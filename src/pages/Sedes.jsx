import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, MapPin, X, Search } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './Sedes.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f8fafc' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#10b981' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#334155' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f172a' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f8fafc' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f8fafc' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#020617' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#020617' }]
  }
];


const Sedes = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSede, setCurrentSede] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    referencia: '',
    latitud: '',
    longitud: '',
    radio_metros: 100,
    activo: true
  });

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');

  // Refs for Google Maps
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Load Google Maps API dynamically
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapsLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY no está configurada en el archivo .env. El mapa interactivo estará inactivo.');
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => console.error('Error al cargar la API de Google Maps.');
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setMapsLoaded(true));
    }
  }, []);

  const fetchSedes = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/sedes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedes(data);
      }
    } catch (err) {
      console.error('Error fetching sedes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSedes();
  }, [navigate]);

  const handleOpenModal = (sede = null) => {
    if (sede) {
      setCurrentSede(sede);
      setFormData({
        nombre: sede.nombre,
        codigo: sede.codigo || '',
        direccion: sede.direccion || '',
        referencia: sede.referencia || '',
        latitud: sede.latitud || '',
        longitud: sede.longitud || '',
        radio_metros: sede.radio_metros || '',
        activo: sede.activo
      });
      setSearchInputValue(sede.direccion || '');
    } else {
      setCurrentSede(null);
      setFormData({
        nombre: '',
        codigo: '',
        direccion: '',
        referencia: '',
        latitud: '',
        longitud: '',
        radio_metros: 100,
        activo: true
      });
      setSearchInputValue('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSede(null);
    googleMapInstanceRef.current = null;
    markerRef.current = null;
    circleRef.current = null;
    autocompleteRef.current = null;
    setSearchInputValue('');
  };

  // Initialize Map and event listeners when modal opens
  useEffect(() => {
    if (!isModalOpen || !mapsLoaded) return;

    // Timeout to ensure DOM element is mounted
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const defaultLat = parseFloat(formData.latitud) || -12.046374; // Lima default
      const defaultLng = parseFloat(formData.longitud) || -77.042793;
      const hasCoords = !isNaN(parseFloat(formData.latitud)) && !isNaN(parseFloat(formData.longitud));
      const initialCenter = { lat: defaultLat, lng: defaultLng };

      // Create Map
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: hasCoords ? 16 : 12,
        styles: darkMapStyle,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      googleMapInstanceRef.current = map;

      // Create Marker
      const marker = new window.google.maps.Marker({
        position: initialCenter,
        map: map,
        draggable: true,
        visible: hasCoords,
        title: formData.nombre || 'Sede'
      });
      markerRef.current = marker;

      // Create Circle
      const radius = parseFloat(formData.radio_metros) || 100;
      const circle = new window.google.maps.Circle({
        map: map,
        radius: radius,
        fillColor: '#10b981',
        fillOpacity: 0.15,
        strokeColor: '#10b981',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        center: initialCenter,
        visible: hasCoords
      });
      circleRef.current = circle;

      // Initialize Places Autocomplete
      if (searchInputRef.current && window.google && window.google.maps && window.google.maps.places) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ['geometry', 'name', 'formatted_address'],
        });
        autocompleteRef.current = autocomplete;

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            console.error('El lugar seleccionado no tiene coordenadas.');
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || '';
          const name = place.name || '';

          setSearchInputValue(address);
          setFormData(prev => ({
            ...prev,
            direccion: address,
            referencia: name !== address ? name : prev.referencia,
            latitud: lat.toFixed(6),
            longitud: lng.toFixed(6)
          }));

          const newPos = { lat, lng };
          map.setCenter(newPos);
          map.setZoom(16);
          marker.setPosition(newPos);
          marker.setVisible(true);
          circle.setCenter(newPos);
          circle.setVisible(true);
        });
      } else {
        console.warn('Google Maps Places Autocomplete is not available (possibly due to API key authentication failure or restriction).');
      }

      // Map Click Handler (Select Location)
      map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setFormData(prev => ({
          ...prev,
          latitud: lat.toFixed(6),
          longitud: lng.toFixed(6)
        }));

        const newPos = { lat, lng };
        marker.setPosition(newPos);
        marker.setVisible(true);
        circle.setCenter(newPos);
        circle.setVisible(true);

        // Reverse geocoding to suggest address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newPos }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            setSearchInputValue(address);
            setFormData(prev => ({
              ...prev,
              direccion: address
            }));
          }
        });
      });

      // Marker Drag End Handler (Refine Location)
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        const lat = pos.lat();
        const lng = pos.lng();

        setFormData(prev => ({
          ...prev,
          latitud: lat.toFixed(6),
          longitud: lng.toFixed(6)
        }));

        const newPos = { lat, lng };
        circle.setCenter(newPos);

        // Reverse geocoding
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newPos }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            setSearchInputValue(address);
            setFormData(prev => ({
              ...prev,
              direccion: address
            }));
          }
        });
      });

      // Geolocation fallback for new branch
      if (!hasCoords && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            const userPos = { lat: currentLat, lng: currentLng };
            map.setCenter(userPos);
            map.setZoom(15);
          },
          (error) => {
            console.log('Error de geolocalización:', error);
          }
        );
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isModalOpen, mapsLoaded]);

  // Sync state changes back to map elements
  useEffect(() => {
    if (!isModalOpen || !googleMapInstanceRef.current) return;

    const lat = parseFloat(formData.latitud);
    const lng = parseFloat(formData.longitud);
    const hasCoords = !isNaN(lat) && !isNaN(lng);

    if (hasCoords) {
      const pos = { lat, lng };
      
      if (markerRef.current) {
        markerRef.current.setPosition(pos);
        markerRef.current.setVisible(true);
      }
      
      if (circleRef.current) {
        circleRef.current.setCenter(pos);
        circleRef.current.setRadius(parseFloat(formData.radio_metros) || 100);
        circleRef.current.setVisible(true);
      }
    } else {
      if (markerRef.current) markerRef.current.setVisible(false);
      if (circleRef.current) circleRef.current.setVisible(false);
    }
  }, [formData.latitud, formData.longitud, formData.radio_metros]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    const url = currentSede
      ? `${API_URL}/sedes/${currentSede.id}/`
      : `${API_URL}/sedes/`;

    const method = currentSede ? 'PUT' : 'POST';

    try {
      const payload = { ...formData };
      if (payload.latitud === '') payload.latitud = null;
      if (payload.longitud === '') payload.longitud = null;
      if (payload.radio_metros === '') payload.radio_metros = null;
      if (payload.codigo === '') payload.codigo = null;
      if (payload.referencia === '') payload.referencia = null;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchSedes();
        handleCloseModal();
        showNotification(currentSede ? 'Sede actualizada correctamente.' : 'Sede creada correctamente.', 'success');
      } else {
        const errorData = await res.json();
        showNotification(`Error al guardar: ${JSON.stringify(errorData)}`, 'error');
      }
    } catch (err) {
      console.error('Error saving sede:', err);
      showNotification('No se pudo realizar la acción. Verifique su conexión.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta sede?')) return;

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchSedes();
        showNotification('Sede eliminada correctamente.', 'success');
      } else {
        showNotification('Error al eliminar la sede.', 'error');
      }
    } catch (err) {
      console.error('Error deleting sede:', err);
      showNotification('No se pudo realizar la acción.', 'error');
    }
  };

  return (
    <MainLayout
      title="Gestión de Sedes"
      subtitle="Administra las sucursales y sus zonas geográficas."
    >
      <div className="sedes-container card">
        <div className="sedes-header">
          <h2>Listado de Sedes</h2>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Nueva Sede
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Cargando sedes...</div>
        ) : sedes.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} className="empty-icon" />
            <p>No hay sedes registradas en el sistema.</p>
            <button className="btn btn-primary mt-4" onClick={() => handleOpenModal()}>
              Registrar Primera Sede
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Coordenadas</th>
                  <th>Radio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sedes.map(sede => (
                  <tr key={sede.id}>
                    <td>
                      <div className="font-semibold">{sede.nombre}</div>
                    </td>
                    <td>{sede.direccion || '-'}</td>
                    <td className="text-sm text-muted">
                      {sede.latitud}, {sede.longitud}
                    </td>
                    <td>{sede.radio_metros} m</td>
                    <td>
                      <span className={`status-badge ${sede.activo ? 'valid' : 'invalid'}`}>
                        {sede.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon text-primary"
                          onClick={() => handleOpenModal(sede)}
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="btn-icon text-danger"
                          onClick={() => handleDelete(sede.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>{currentSede ? 'Editar Sede' : 'Nueva Sede'}</h2>
              <button className="btn-icon" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-layout-grid">
                {/* Columna Izquierda: Formulario */}
                <div className="form-column">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre de la Sede</label>
                      <input 
                        type="text" 
                        name="nombre"
                        value={formData.nombre} 
                        onChange={handleInputChange} 
                        required 
                        className="input-field"
                        placeholder="Ej. Oficina Principal"
                      />
                    </div>
                    <div className="form-group">
                      <label>Código (Opcional)</label>
                      <input 
                        type="text" 
                        name="codigo"
                        value={formData.codigo} 
                        onChange={handleInputChange} 
                        className="input-field"
                        placeholder="Ej. S-01"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Dirección (Opcional)</label>
                    <input 
                      type="text" 
                      name="direccion"
                      value={formData.direccion} 
                      onChange={handleInputChange} 
                      className="input-field"
                      placeholder="Ej. Av. Siempre Viva 123"
                    />
                  </div>

                  <div className="form-group">
                    <label>Referencia (Opcional)</label>
                    <input 
                      type="text" 
                      name="referencia"
                      value={formData.referencia} 
                      onChange={handleInputChange} 
                      className="input-field"
                      placeholder="Ej. Frente al parque"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Latitud (Opcional)</label>
                      <input 
                        type="number" 
                        step="any"
                        name="latitud"
                        value={formData.latitud} 
                        onChange={handleInputChange} 
                        className="input-field"
                        placeholder="-12.046374"
                      />
                    </div>
                    <div className="form-group">
                      <label>Longitud (Opcional)</label>
                      <input 
                        type="number" 
                        step="any"
                        name="longitud"
                        value={formData.longitud} 
                        onChange={handleInputChange} 
                        className="input-field"
                        placeholder="-77.042793"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Radio de tolerancia (metros) (Opcional)</label>
                      <input 
                        type="number" 
                        name="radio_metros"
                        value={formData.radio_metros} 
                        onChange={handleInputChange} 
                        min="10"
                        className="input-field"
                      />
                    </div>
                    
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          name="activo"
                          checked={formData.activo} 
                          onChange={handleInputChange} 
                        />
                        <span>Sede Activa</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Mapa de Google */}
                <div className="map-column">
                  <label className="input-label">Ubicación Geográfica en Mapa</label>
                  
                  {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                    <>
                      <div className="map-search-container">
                        <Search size={18} className="map-search-icon" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          className="map-search-input"
                          placeholder="Buscar dirección o lugar..."
                          value={searchInputValue}
                          onChange={(e) => setSearchInputValue(e.target.value)}
                        />
                      </div>
                      
                      <div className="map-canvas-container">
                        {!mapsLoaded && (
                          <div className="map-loading-overlay">
                            Cargando mapa de Google...
                          </div>
                        )}
                        <div ref={mapContainerRef} className="map-canvas" />
                      </div>
                    </>
                  ) : (
                    <div className="map-canvas-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', gap: '0.75rem' }}>
                      <MapPin size={32} className="text-muted" />
                      <p className="text-muted text-sm">
                        Para habilitar el mapa interactivo y el buscador de direcciones, configure la variable <strong>VITE_GOOGLE_MAPS_API_KEY</strong> en su archivo <strong>.env</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentSede ? 'Actualizar Sede' : 'Guardar Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Sedes;
