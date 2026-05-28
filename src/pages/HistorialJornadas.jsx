import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  Clock, 
  MapPin,
  User,
  AlertCircle,
  Activity,
  CheckCircle
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import useWebSockets from '../hooks/useWebSockets';
import './HistorialJornadas.css';

const API_URL = import.meta.env.VITE_API_URL;

const getActTypeClass = (type) => {
  return "px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20";
};

const getActStatusClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('finalizada') || s.includes('completa') || s.includes('completada')) {
    return "px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  }
  if (s.includes('proceso') || s.includes('pendiente') || s.includes('curso')) {
    return "px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20";
  }
  if (s.includes('cancelada') || s.includes('anulada') || s.includes('suspendida')) {
    return "px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20";
  }
  return "px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20";
};

const getActResultClass = (result) => {
  return "px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20";
};

const HistorialJornadas = () => {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedJornadaId, setSelectedJornadaId] = useState(null);
  const [jornadaDetalle, setJornadaDetalle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Role & Sede Organization States
  const userRole = (localStorage.getItem('user_role') || '').toUpperCase();
  const isOperativo = userRole === 'OPERADOR' || userRole === 'ASESOR';
  const [sedesResumen, setSedesResumen] = useState([]);
  const [selectedSede, setSelectedSede] = useState(null);
  const [loadingSedes, setLoadingSedes] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // GPS tracking states
  const [trackingRecorrido, setTrackingRecorrido] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // References for Google Map to update dynamically without full re-instantiation
  const mapInstanceRef = useRef(null);
  const mapJornadaIdRef = useRef(null);
  const polylineRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const mapContainerRef = useRef(null);
  
  // Filters for history
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    estado_asistencia: ''
  });

  const fetchHistorial = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('usuario', userId);
      if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
      if (filters.estado_asistencia) queryParams.append('estado_asistencia', filters.estado_asistencia);

      const res = await fetch(`${API_URL}/historial-jornadas/?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistorial(data);
      }
    } catch (err) {
      console.error('Error fetching historial:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchTrackingRecorrido = useCallback(async (jornadaId, silent = false) => {
    if (!jornadaId) return;
    if (!silent) setLoadingTracking(true);
    setMapError(null);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/tracking/recorrido-jornada/${jornadaId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrackingRecorrido(data);
        setLastUpdateTime(new Date());
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMapError(errorData.error || 'No se pudo obtener el recorrido de esta jornada.');
      }
    } catch (err) {
      console.error('Error fetching tracking recorrido:', err);
      setMapError('Error al conectar con el servidor.');
    } finally {
      if (!silent) setLoadingTracking(false);
    }
  }, []);

  const fetchJornadaDetalle = useCallback(async (jornadaId) => {
    if (!jornadaId) return;
    setLoadingDetail(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/historial-jornadas/${jornadaId}/detalle/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJornadaDetalle(data);
      }
    } catch (err) {
      console.error('Error fetching jornada detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const fetchSedesResumen = useCallback(async () => {
    setLoadingSedes(true);
    const token = localStorage.getItem('access_token');
    try {
      const queryParams = new URLSearchParams();
      if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);

      const res = await fetch(`${API_URL}/sedes/historial-resumen/?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedesResumen(data);
      }
    } catch (err) {
      console.error('Error fetching sedes resumen:', err);
    } finally {
      setLoadingSedes(false);
    }
  }, [filters.fecha_inicio, filters.fecha_fin]);

  const fetchUsuarios = useCallback(async (sedeId = null) => {
    setLoadingUsers(true);
    const token = localStorage.getItem('access_token');
    try {
      const url = sedeId
        ? `${API_URL}/usuarios/?sede=${sedeId}&solo_operadores=true`
        : `${API_URL}/usuarios/?solo_operadores=true`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (err) {
      console.error('Error fetching usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleSedeSelect = (sede) => {
    setSelectedSede(sede);
    setRoleFilter('');
    setStatusFilter('');
    setSearchTerm('');
    fetchUsuarios(sede.sede_id);
  };

  // WebSocket handling
  const onSocketMessage = useCallback((data) => {
    if (data.type === 'attendance_update') {
      console.log('Update recibido en Historial');
      if (selectedUser && !selectedJornadaId) {
        fetchHistorial(selectedUser.id);
      } else if (selectedJornadaId) {
        fetchJornadaDetalle(selectedJornadaId);
        fetchTrackingRecorrido(selectedJornadaId);
      }
    }
  }, [selectedUser, selectedJornadaId, fetchHistorial, fetchJornadaDetalle, fetchTrackingRecorrido]);

  useWebSockets(onSocketMessage);

  useEffect(() => {
    if (isOperativo) {
      fetchUsuarios();
    } else {
      fetchSedesResumen();
    }
  }, [isOperativo, fetchUsuarios, fetchSedesResumen]);

  // Bypass selection for operators
  useEffect(() => {
    if (isOperativo && usuarios.length === 1) {
      setSelectedUser(usuarios[0]);
      fetchHistorial(usuarios[0].id);
    }
  }, [usuarios, isOperativo, fetchHistorial]);

  // Dynamically load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('VITE_GOOGLE_MAPS_API_KEY no está definido en el archivo .env');
      return;
    }

    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      const handleLoad = () => setGoogleMapsLoaded(true);
      existingScript.addEventListener('load', handleLoad);
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    script.onerror = () => console.error('Error al cargar la script de Google Maps');
    document.head.appendChild(script);
  }, []);

  // Auto-update tracking data every 60 seconds if the workday is in progress
  useEffect(() => {
    if (!selectedJornadaId || !trackingRecorrido) return;

    const isEnProceso = trackingRecorrido.jornada?.estado_jornada === 'en_proceso' || 
                        !trackingRecorrido.jornada?.hora_salida;

    if (!isEnProceso) return;

    const intervalId = setInterval(() => {
      fetchTrackingRecorrido(selectedJornadaId, true); // Fetch silently in the background
    }, 60000);

    return () => clearInterval(intervalId);
  }, [selectedJornadaId, trackingRecorrido, fetchTrackingRecorrido]);

  // Initialize and draw the Google Map when loaded and recorrido data is ready
  useEffect(() => {
    (async () => {
      console.log("Map useEffect triggered. googleMapsLoaded:", googleMapsLoaded, "trackingRecorrido:", !!trackingRecorrido, "loadingTracking:", loadingTracking);
      if (!googleMapsLoaded || !trackingRecorrido || loadingTracking) {
        return;
      }

      const mapElement = mapContainerRef.current;
      console.log("mapElement:", mapElement);
      if (!mapElement) return;

      try {
        const puntos = trackingRecorrido.puntos || [];
        const sede = trackingRecorrido.sede; // matches response from backend

        // Load AdvancedMarkerElement and PinElement libraries
        const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");

        let map = mapInstanceRef.current;
        const isNewJornada = mapJornadaIdRef.current !== selectedJornadaId;
        console.log("Map initialization. isNewJornada:", isNewJornada, "existing map:", !!map);

        if (isNewJornada || !map) {
          let mapCenter = { lat: -12.046374, lng: -77.042793 }; // Default (Lima)
          if (sede && sede.latitud && sede.longitud) {
            mapCenter = { lat: Number(sede.latitud), lng: Number(sede.longitud) };
          } else if (puntos.length > 0) {
            mapCenter = { lat: Number(puntos[0].latitud), lng: Number(puntos[0].longitud) };
          }

          console.log("Creating new window.google.maps.Map at center:", mapCenter);
          map = new window.google.maps.Map(mapElement, {
            center: mapCenter,
            zoom: 15,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });
          mapInstanceRef.current = map;
          mapJornadaIdRef.current = selectedJornadaId;
        }

        // Clean old overlays from previous updates
        if (polylineRef.current) polylineRef.current.setMap(null);
        if (circleRef.current) circleRef.current.setMap(null);
        markersRef.current.forEach(m => m.map = null);
        markersRef.current = [];

        const bounds = new window.google.maps.LatLngBounds();

        // 1. Sede Marker & Geofence (Circle)
        if (sede && sede.latitud && sede.longitud) {
          const sedePos = { lat: Number(sede.latitud), lng: Number(sede.longitud) };
          bounds.extend(sedePos);

          console.log("Drawing HQ marker at:", sedePos);
          const hqPin = new PinElement({
            background: "#3B82F6",
            borderColor: "#FFFFFF",
            glyphColor: "#FFFFFF",
            scale: 1.0
          });

          const hqMarker = new AdvancedMarkerElement({
            position: sedePos,
            map: map,
            title: `Sede: ${sede.nombre || 'Asignada'}`,
            content: hqPin.element
          });
          markersRef.current.push(hqMarker);

          if (sede.radio_metros) {
            console.log("Drawing HQ geofence circle with radius:", sede.radio_metros);
            const circle = new window.google.maps.Circle({
              strokeColor: "#3B82F6",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#3B82F6",
              fillOpacity: 0.15,
              map: map,
              center: sedePos,
              radius: Number(sede.radio_metros)
            });
            circleRef.current = circle;
          }
        }

        // 2. Journey Polyline
        const pathCoordinates = puntos.map(p => {
          const pos = { lat: Number(p.latitud), lng: Number(p.longitud) };
          bounds.extend(pos);
          return pos;
        });

        if (pathCoordinates.length > 0) {
          console.log("Drawing polyline with points:", pathCoordinates.length);
          const polyline = new window.google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: "#10B981", // Emerald green
            strokeOpacity: 0.9,
            strokeWeight: 4,
            map: map
          });
          polylineRef.current = polyline;
        }

        // 3. Start Marker (Green circle with 'I')
        if (puntos.length > 0) {
          const firstPos = { lat: Number(puntos[0].latitud), lng: Number(puntos[0].longitud) };
          
          const startPin = new PinElement({
            background: "#059669",
            borderColor: "#FFFFFF",
            glyph: "I",
            glyphColor: "#FFFFFF",
            scale: 1.0
          });

          const startMarker = new AdvancedMarkerElement({
            position: firstPos,
            map: map,
            title: "Punto Inicial",
            content: startPin.element
          });
          markersRef.current.push(startMarker);
        }

        // 4. End Marker (Red circle with 'F')
        if (puntos.length > 1) {
          const lastPos = { lat: Number(puntos[puntos.length - 1].latitud), lng: Number(puntos[puntos.length - 1].longitud) };
          
          const endPin = new PinElement({
            background: "#DC2626",
            borderColor: "#FFFFFF",
            glyph: "F",
            glyphColor: "#FFFFFF",
            scale: 1.0
          });

          const endMarker = new AdvancedMarkerElement({
            position: lastPos,
            map: map,
            title: "Punto Final",
            content: endPin.element
          });
          markersRef.current.push(endMarker);
        }

        // 5. User Current Location Marker (Distinctive Blue Pulse Marker with InfoWindow)
        if (puntos.length > 0) {
          const lastP = puntos[puntos.length - 1];
          const lastPos = { lat: Number(lastP.latitud), lng: Number(lastP.longitud) };
          
          const userWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="font-family: Inter, sans-serif; padding: 6px; font-size: 13px; color: #1F2937;">
                <strong style="color: #3B82F6; display: block; margin-bottom: 4px;">Ubicación del Colaborador</strong>
                <strong>Nombre:</strong> ${trackingRecorrido.usuario?.nombre_completo || 'Colaborador'}<br/>
                <strong>Último reporte:</strong> ${new Date(lastP.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}<br/>
                <strong>Batería:</strong> ${lastP.bateria_porcentaje !== null ? lastP.bateria_porcentaje + '%' : 'N/A'}<br/>
                <strong>Precisión:</strong> ${lastP.precision_metros !== null ? Math.round(lastP.precision_metros) + ' m' : 'N/A'}<br/>
                <strong>Estado:</strong> <span style="color: ${lastP.es_fuera_de_zona ? '#EF4444' : '#10B981'}; font-weight: bold;">${lastP.es_fuera_de_zona ? 'Fuera de Zona' : 'Dentro de Zona'}</span>
              </div>
            `
          });

          const userPin = new PinElement({
            background: "#3B82F6",
            borderColor: "#FFFFFF",
            glyphColor: "#FFFFFF",
            scale: 1.1
          });

          const userMarker = new AdvancedMarkerElement({
            position: lastPos,
            map: map,
            title: "Última Ubicación Registrada",
            zIndex: 999, // Ensure user marker is on top
            content: userPin.element
          });
          
          userMarker.addListener('click', () => {
            userWindow.open(map, userMarker);
          });
          markersRef.current.push(userMarker);
        }

        // 6. Outside of Zone Alerts
        puntos.forEach(p => {
          if (p.es_fuera_de_zona) {
            const outPos = { lat: Number(p.latitud), lng: Number(p.longitud) };
            const timeStr = new Date(p.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const outPin = new PinElement({
              background: "#EF4444",
              borderColor: "#FFFFFF",
              glyphColor: "#FFFFFF",
              scale: 0.8
            });

            const outMarker = new AdvancedMarkerElement({
              position: outPos,
              map: map,
              title: `Alerta: Fuera de zona a las ${timeStr}`,
              content: outPin.element
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="font-family: Inter, sans-serif; padding: 6px; font-size: 13px; color: #1F2937;">
                  <strong style="color: #EF4444; display: block; margin-bottom: 4px;">Alerta: Fuera de Zona</strong>
                  <strong>Hora:</strong> ${timeStr}<br/>
                  <strong>Distancia:</strong> ${Math.round(p.distancia_sede_metros)} m de la sede<br/>
                  <strong>Batería:</strong> ${p.bateria_porcentaje !== null ? p.bateria_porcentaje + '%' : 'N/A'}<br/>
                  <strong>Precisión:</strong> ${p.precision_metros !== null ? Math.round(p.precision_metros) + ' m' : 'N/A'}
                </div>
              `
            });

            outMarker.addListener('click', () => {
              infoWindow.open(map, outMarker);
            });
            markersRef.current.push(outMarker);
          }
        });

        // Auto fit map bounds to show path + sede
        if (!bounds.isEmpty()) {
          console.log("Fitting map bounds");
          map.fitBounds(bounds);

          // Guard listener to prevent overzooming on single points or tight bounds
          const listener = window.google.maps.event.addListener(map, "idle", () => {
            if (map.getZoom() > 17) map.setZoom(16);
            window.google.maps.event.removeListener(listener);
          });
        } else {
          // Centrar en un zoom normal si los límites están vacíos
          map.setZoom(14);
        }
      } catch (err) {
        console.error("Error in map useEffect:", err);
        setMapError("Error al renderizar el mapa: " + err.message);
      }
    })();
  }, [googleMapsLoaded, trackingRecorrido, selectedJornadaId, loadingTracking]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchHistorial(user.id);
  };

  const handleJornadaSelect = (jornadaId) => {
    setSelectedJornadaId(jornadaId);
    setLastUpdateTime(new Date());
    
    // Reset map refs to force complete recreation of map when switching journeys
    mapInstanceRef.current = null;
    mapJornadaIdRef.current = null;
    polylineRef.current = null;
    markersRef.current = [];
    circleRef.current = null;
    
    fetchJornadaDetalle(jornadaId);
    fetchTrackingRecorrido(jornadaId);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setHistorial([]);
    setSelectedJornadaId(null);
    setJornadaDetalle(null);
    setTrackingRecorrido(null);
    setMapError(null);
    
    mapInstanceRef.current = null;
    mapJornadaIdRef.current = null;
    polylineRef.current = null;
    markersRef.current = [];
    circleRef.current = null;
  };

  const handleBackToHistory = () => {
    setSelectedJornadaId(null);
    setJornadaDetalle(null);
    setTrackingRecorrido(null);
    setMapError(null);
    
    mapInstanceRef.current = null;
    mapJornadaIdRef.current = null;
    polylineRef.current = null;
    markersRef.current = [];
    circleRef.current = null;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    if (selectedUser) {
      fetchHistorial(selectedUser.id);
    }
  };

  const humanizeDuration = (h, m, s) => {
    let result = [];
    if (h > 0) result.push(`${h}h`);
    if (m > 0) result.push(`${m}min`);
    if (s > 0 || result.length === 0) result.push(`${s}seg`);
    return result.join(' ');
  };

  const formatDuration = (duration) => {
    if (!duration) return '-';
    // Si viene en formato HH:MM:SS.mmmm o similar de Django DurationField
    if (typeof duration === 'string' && duration.includes(':')) {
      const parts = duration.split('.')[0].split(':');
      if (parts.length >= 3) {
        return humanizeDuration(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      }
      return duration.split('.')[0];
    }
    return duration;
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '-';
    try {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diff = Math.abs(d2 - d1);
      
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      return humanizeDuration(hours, minutes, seconds);
    } catch (e) {
      return '-';
    }
  };

  const attendanceLabels = {
    'programada': 'Programada',
    'en_proceso': 'En proceso',
    'completa': 'Completa',
    'incompleta': 'Incompleta',
    'ausente': 'Ausente'
  };

  const punctualityLabels = {
    'temprano': 'Entrada Anticipada',
    'puntual': 'Entrada Puntual',
    'tardanza': 'Tardanza (Entrada)',
    'no_marco_entrada': 'No marcó entrada',
    'pendiente': 'Pendiente'
  };

  const exitStatusLabels = {
    'temprano': 'Salida Temprana',
    'puntual': 'Salida Puntual',
    'tardanza': 'Salida Tardía',
    'no_marco_salida': 'No marcó salida',
    'pendiente': 'Pendiente'
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = usuarios.filter(u => {
    const matchesSearch = u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) || u.dni.includes(searchTerm);
    const matchesRole = !roleFilter || (u.rol_info?.codigo || '').toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? u.activo === true : u.activo === false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <MainLayout 
      title="Historial de Jornadas" 
      subtitle={
        selectedJornadaId ? `Detalle de Jornada ${jornadaDetalle ? '- ' + new Date(jornadaDetalle.fecha + 'T00:00:00').toLocaleDateString() : '...'}` :
        selectedUser ? `Historial de ${selectedUser.nombre_completo}` : 
        "Seleccione un usuario para ver su historial."
      }
    >
      <div className="historial-container">
        {!isOperativo && !selectedSede ? (
          /* LEVEL 0: SEDE SELECTION */
          <div className="sedes-selection-view animate-in">
            {/* Date Filters Card */}
            <div className="card filters-card">
              <form onSubmit={(e) => { e.preventDefault(); fetchSedesResumen(); }} className="filters-grid">
                <div className="filter-group">
                  <label><Calendar size={16} /> Desde</label>
                  <input type="date" name="fecha_inicio" value={filters.fecha_inicio} onChange={handleFilterChange} className="input-field" />
                </div>
                <div className="filter-group">
                  <label><Calendar size={16} /> Hasta</label>
                  <input type="date" name="fecha_fin" value={filters.fecha_fin} onChange={handleFilterChange} className="input-field" />
                </div>
                <div className="filter-actions">
                  <button type="submit" className="btn-primary"><Search size={18} /> Filtrar Sedes</button>
                </div>
              </form>
            </div>

            {loadingSedes ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando resumen de sedes...</p>
              </div>
            ) : sedesResumen.length === 0 ? (
              <div className="empty-state">
                <MapPin size={48} className="empty-icon" />
                <p>No se encontraron sedes autorizadas.</p>
              </div>
            ) : (
              <div className="sedes-grid">
                {sedesResumen.map(sede => (
                  <div key={sede.sede_id} className="sede-card card">
                    <div className="sede-card-header">
                      <div className="sede-icon-wrapper">
                        <MapPin size={24} />
                      </div>
                      <h3>{sede.sede_nombre}</h3>
                    </div>
                    
                    <div className="sede-card-body">
                      <div className="sede-metrics-section">
                        <h4>Personal</h4>
                        <div className="sede-metric-row">
                          <span>Operadores:</span>
                          <strong>{sede.cantidad_operadores}</strong>
                        </div>
                        <div className="sede-metric-row">
                          <span>Asesores:</span>
                          <strong>{sede.cantidad_asesores}</strong>
                        </div>
                      </div>

                      <div className="sede-metrics-section">
                        <h4>Jornadas</h4>
                        <div className="sede-metric-row">
                          <span>Registradas:</span>
                          <strong>{sede.jornadas_registradas}</strong>
                        </div>
                        <div className="sede-metric-row">
                          <span>En proceso:</span>
                          <span className="text-warning font-semibold">{sede.jornadas_en_proceso}</span>
                        </div>
                        <div className="sede-metric-row">
                          <span>Completas:</span>
                          <span className="text-success font-semibold">{sede.jornadas_completas}</span>
                        </div>
                        <div className="sede-metric-row">
                          <span>Ausencias:</span>
                          <span className="text-danger font-semibold">{sede.ausencias}</span>
                        </div>
                      </div>

                      <div className="sede-metrics-section">
                        <h4>Incidencias</h4>
                        <div className="sede-metric-row">
                          <span>Reportadas:</span>
                          <span className={sede.incidencias > 0 ? "text-danger font-bold" : "font-semibold"}>
                            {sede.incidencias}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sede-card-footer">
                      <button 
                        className="btn btn-primary w-full justify-center" 
                        onClick={() => handleSedeSelect(sede)}
                      >
                        Ver usuarios
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !selectedUser ? (
          /* LEVEL 1: USER SELECTION */
          <div className="user-selection-view animate-in">
            {!isOperativo && (
              <div className="view-actions">
                <button className="btn-back" onClick={() => setSelectedSede(null)}>
                  <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} /> Volver a Sedes
                </button>
              </div>
            )}

            <div className="card selection-header-with-filters">
              <div className="sede-details-title mb-4">
                <h2>Usuarios de Sede: {selectedSede?.sede_nombre}</h2>
              </div>
              <div className="user-filters-grid">
                {/* Search input */}
                <div className="search-wrapper">
                  <Search size={20} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Buscar usuario por nombre o DNI..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                {/* Role select */}
                <div className="filter-select-group">
                  <select 
                    value={roleFilter} 
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Todos los Roles</option>
                    <option value="operador">Operadores</option>
                    <option value="asesor">Asesores</option>
                  </select>
                </div>

                {/* Status select */}
                <div className="filter-select-group">
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Todos los Estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
              </div>
            </div>

            {loadingUsers ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando usuarios...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>Esta sede aún no tiene usuarios que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <div className="users-grid">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="user-selection-card card"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="user-card-avatar">
                      {user.nombre_completo.charAt(0)}
                    </div>
                    <div className="user-card-info">
                      <h3>{user.nombre_completo}</h3>
                      <p><User size={14} /> {user.dni}</p>
                      <div className="flex gap-2 items-center flex-wrap mt-1">
                        <span className={`role-badge mini ${(user.rol_info?.codigo || '').toLowerCase()}`}>
                          {user.rol_info?.name || user.rol_info?.nombre || 'Sin Rol'}
                        </span>
                        <span className={`status-badge small ${user.activo ? 'valid' : 'invalid'}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="arrow-icon" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !selectedJornadaId ? (
          /* LEVEL 2: JORNADA LIST FOR USER */
          <div className="history-detail-view animate-in">
            <div className="view-actions">
              <button className="btn-back" onClick={handleBackToUsers}>
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} /> Volver a usuarios
              </button>
            </div>

            <div className="card filters-card">
              <form onSubmit={applyFilters} className="filters-grid">
                <div className="filter-group">
                  <label><Calendar size={16} /> Desde</label>
                  <input type="date" name="fecha_inicio" value={filters.fecha_inicio} onChange={handleFilterChange} className="input-field" />
                </div>
                <div className="filter-group">
                  <label><Calendar size={16} /> Hasta</label>
                  <input type="date" name="fecha_fin" value={filters.fecha_fin} onChange={handleFilterChange} className="input-field" />
                </div>
                <div className="filter-group">
                  <label><Filter size={16} /> Asistencia</label>
                  <select name="estado_asistencia" value={filters.estado_asistencia} onChange={handleFilterChange} className="input-field">
                    <option value="">Todos los estados</option>
                    <option value="programada">Programada</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="completa">Completa</option>
                    <option value="incompleta">Incompleta</option>
                    <option value="ausente">Ausente</option>
                  </select>
                </div>
                <div className="filter-actions">
                  <button type="submit" className="btn-primary"><Search size={18} /> Filtrar</button>
                </div>
              </form>
            </div>

            <div className="card results-card">
              <div className="results-header">
                <h2>Jornadas de {selectedUser.nombre_completo}</h2>
              </div>
              {loading ? (
                <div className="loading-state"><div className="spinner"></div><p>Cargando...</p></div>
              ) : historial.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Horas</th>
                        <th>Incidencias</th>
                        <th>GPS</th>
                        <th>Estado</th>
                        <th>Asistencia</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((item) => (
                        <tr key={item.id} onClick={() => handleJornadaSelect(item.id)} className="clickable-row">
                          <td>{new Date(item.fecha + 'T00:00:00').toLocaleDateString()}</td>
                          <td>{formatTime(item.hora_entrada)}</td>
                          <td>{formatTime(item.hora_salida)}</td>
                          <td><span className="duration-tag">{item.total_horas_trabajadas ? formatDuration(item.total_horas_trabajadas) : calculateDuration(item.hora_entrada, item.hora_salida)}</span></td>
                          <td className="text-center">
                            {item.total_incidencias > 0 ? (
                              <span className="count-badge danger">{item.total_incidencias}</span>
                            ) : '-'}
                          </td>
                          <td className="text-center">
                            {item.total_puntos_gps > 0 ? (
                              <span className="count-badge info">{item.total_puntos_gps}</span>
                            ) : '-'}
                          </td>
                          <td>
                            <div className="flex flex-col gap-1">
                              <span className={`status-badge ${item.estado_puntualidad || 'pendiente'}`}>
                                {punctualityLabels[item.estado_puntualidad || 'pendiente']}
                              </span>
                              {item.hora_salida && (
                                <span className={`status-badge ${item.estado_salida || 'pendiente'}`}>
                                  {exitStatusLabels[item.estado_salida || 'pendiente']}
                                </span>
                              )}
                            </div>
                          </td>
                          <td><span className={`status-badge ${item.estado_asistencia}`}>{attendanceLabels[item.estado_asistencia] || item.estado_asistencia}</span></td>
                          <td><ChevronRight size={18} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state"><AlertCircle size={48} /><p>No hay jornadas registradas.</p></div>
              )}
            </div>
          </div>
        ) : (
          /* LEVEL 3: JORNADA DETAIL VIEW */
          <div className="jornada-detail-view animate-in">
            <div className="view-actions">
              <button className="btn-back" onClick={handleBackToHistory}>
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} /> Volver al listado
              </button>
            </div>

            {loadingDetail ? (
              <div className="loading-state"><div className="spinner"></div><p>Cargando detalles...</p></div>
            ) : jornadaDetalle && (
              <>
                <div className="detail-layout">
                {/* Left Column: Summary & Events */}
                <div className="detail-main">
                  <div className="card summary-header-card">
                    <div className="summary-info">
                      <div className="summary-date">
                        <Calendar size={24} />
                        <div>
                          <h3>{new Date(jornadaDetalle.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                          <p>{jornadaDetalle.operador} - {jornadaDetalle.sede}</p>
                          <span className={`role-badge mini ${jornadaDetalle.rol_codigo?.toLowerCase()}`}>
                            {jornadaDetalle.rol_nombre || '-'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`status-badge large ${jornadaDetalle.estado_jornada?.toLowerCase() || 'completada'}`}>
                          {jornadaDetalle.estado_jornada || 'Completada'}
                        </span>
                        <div className="flex gap-2">
                          <span className={`status-badge ${jornadaDetalle.estado_asistencia}`}>
                            {attendanceLabels[jornadaDetalle.estado_asistencia] || jornadaDetalle.estado_asistencia}
                          </span>
                          <span className={`status-badge ${jornadaDetalle.estado_puntualidad}`}>
                            {punctualityLabels[jornadaDetalle.estado_puntualidad] || jornadaDetalle.estado_puntualidad}
                          </span>
                          {jornadaDetalle.hora_salida && (
                            <span className={`status-badge ${jornadaDetalle.estado_salida}`}>
                              {exitStatusLabels[jornadaDetalle.estado_salida] || jornadaDetalle.estado_salida}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    
                    <div className="metrics-grid">
                      <div className="metric-item">
                        <Clock size={20} className="text-success" />
                        <div className="metric-val">
                          <span>Entrada</span>
                          <strong>{formatTime(jornadaDetalle.hora_entrada)}</strong>
                        </div>
                      </div>
                      <div className="metric-item">
                        <Clock size={20} className="text-danger" />
                        <div className="metric-val">
                          <span>Salida</span>
                          <strong>{formatTime(jornadaDetalle.hora_salida)}</strong>
                        </div>
                      </div>
                      <div className="metric-item">
                        <Activity size={20} />
                        <div className="metric-val">
                          <span>Horas Trabajadas</span>
                          <strong>{jornadaDetalle.total_horas_trabajadas ? formatDuration(jornadaDetalle.total_horas_trabajadas) : calculateDuration(jornadaDetalle.hora_entrada, jornadaDetalle.hora_salida)}</strong>
                        </div>
                      </div>
                      <div className="metric-item">
                        <Clock size={20} className="text-warning" />
                        <div className="metric-val">
                          <span>Total Descanso</span>
                          <strong>{jornadaDetalle.total_tiempo_break ? formatDuration(jornadaDetalle.total_tiempo_break) : calculateDuration(jornadaDetalle.hora_inicio_break, jornadaDetalle.hora_fin_break)}</strong>
                        </div>
                      </div>
                      <div className="metric-item">
                        <Activity size={20} className="text-info" />
                        <div className="metric-val">
                          <span>Estado Asistencia</span>
                          <strong>{attendanceLabels[jornadaDetalle.estado_asistencia] || jornadaDetalle.estado_asistencia}</strong>
                        </div>
                      </div>
                      <div className="metric-item">
                        <CheckCircle size={20} className="text-success" />
                        <div className="metric-val">
                          <span>Salida / Puntualidad</span>
                          <strong>{exitStatusLabels[jornadaDetalle.estado_salida] || jornadaDetalle.estado_salida || 'Pendiente'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card events-timeline-card">
                    <h2>Cronología de la Jornada (Marcaciones)</h2>
                    <div className="timeline-v2">
                      {jornadaDetalle.eventos?.map((evt, idx) => (
                        <div key={idx} className="timeline-v2-item">
                          <div className="time-col">{formatTime(evt.fecha_hora)}</div>
                          <div className="marker-col"><div className={`marker-dot ${(evt.tipo_evento || 'info').toLowerCase()}`}></div></div>
                          <div className="content-col">
                            <h4>{(evt.tipo_evento || 'Evento').replace(/_/g, ' ')}</h4>
                            {evt.distancia_sede_metros > 0 && <p className="text-sm text-muted">A {parseFloat(evt.distancia_sede_metros).toFixed(0)}m de la sede</p>}
                            {evt.es_fuera_de_zona && <span className="warning-pill">Fuera de Zona</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>



                  {/* El listado simple de puntos se ha reemplazado por la visualización del mapa interactivo al final de la página */}
                </div>

                {/* Right Column: Incidents & Advisor Activities */}
                <div className="detail-side">
                  <div className="card incidents-list-card">
                    <h2 className="text-base font-bold text-white border-b border-slate-700/80 pb-3 mb-6 tracking-wide uppercase">
                      {((jornadaDetalle.rol_codigo || '').toUpperCase() === 'ASESOR') ? "Incidencias y Actividades de Campo" : "Reportes e Incidencias"}
                    </h2>
                    
                    {((jornadaDetalle.rol_codigo || '').toUpperCase() !== 'ASESOR') ? (
                      /* OPERADOR ROLE */
                      jornadaDetalle.incidencias && jornadaDetalle.incidencias.length > 0 ? (
                        <div className="incidents-stack">
                          {jornadaDetalle.incidencias.map((inc, idx) => (
                            <div key={idx} className="incident-card-v2">
                              <div className="inc-header">
                                <strong>{inc.tipo_incidencia_0?.nombre || inc.tipo_incidencia || 'Incidencia'}</strong>
                                <span className="inc-time">{formatTime(inc.fecha_hora_reporte)}</span>
                              </div>
                              <p>{inc.descripcion}</p>
                              <div className="inc-meta-row mt-2 text-xs text-muted flex gap-2">
                                <span><strong>Estado:</strong> {inc.estado_revision}</span>
                              </div>
                              {inc.foto && (
                                <div className="inc-media">
                                  <img 
                                    src={inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`} 
                                    alt="Evidencia" 
                                    onClick={() => window.open(inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`, '_blank')} 
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-msg">No se reportaron incidencias.</p>
                      )
                    ) : (
                      /* ASESOR ROLE */
                      /* ASESOR ROLE */
                      ((!jornadaDetalle.incidencias || jornadaDetalle.incidencias.length === 0) && 
                       (!jornadaDetalle.actividades_campo || jornadaDetalle.actividades_campo.length === 0)) ? (
                        <p className="empty-msg-large">
                          No se reportaron incidencias ni actividades en esta jornada.
                        </p>
                      ) : (
                        <div className="incidents-activities-stack">
                          {/* BLOCK 1: INCIDENCIAS */}
                          <div className="incidents-block">
                            <h3 className="section-subtitle">Incidencias</h3>
                            {jornadaDetalle.incidencias && jornadaDetalle.incidencias.length > 0 ? (
                              <div className="incidents-stack">
                                {jornadaDetalle.incidencias.map((inc, idx) => (
                                  <div key={idx} className="incident-card-premium">
                                    <div className="incident-card-header">
                                      <strong className="incident-title">{inc.tipo_incidencia_0?.nombre || inc.tipo_incidencia || 'Incidencia'}</strong>
                                      <span className="incident-time">{formatTime(inc.fecha_hora_reporte)}</span>
                                    </div>
                                    <div className="incident-card-body">
                                      <div className="incident-detail-item">
                                        <span className="incident-detail-label">Descripción</span>
                                        <span className="incident-detail-value">{inc.descripcion}</span>
                                      </div>
                                      <div className="incident-detail-item inline-flex">
                                        <span className="incident-detail-label">Estado:</span>
                                        <span className="incident-status-badge">{inc.estado_revision}</span>
                                      </div>
                                    </div>
                                    {inc.foto && (
                                      <div className="incident-media-box">
                                        <span className="incident-media-label">Evidencia</span>
                                        <img 
                                          src={inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`} 
                                          alt="Evidencia" 
                                          className="incident-media-thumb"
                                          onClick={() => window.open(inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`, '_blank')} 
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="empty-state-message">No se reportaron incidencias.</p>
                            )}
                          </div>

                          {/* BLOCK 2: ACTIVIDADES DE CAMPO */}
                          <div className="activities-block">
                            <h3 className="section-subtitle">Actividades de Campo</h3>
                            {jornadaDetalle.actividades_campo && jornadaDetalle.actividades_campo.length > 0 ? (
                              <div className="activities-stack">
                                {jornadaDetalle.actividades_campo.map((act, idx) => (
                                  <div key={idx} className="activity-card-premium">
                                    {/* HEADER: BADGES ONLY */}
                                    <div className="activity-card-header">
                                      <span className={getActTypeClass(act.tipo_actividad)}>{act.tipo_actividad}</span>
                                      <span className={getActStatusClass(act.estado_actividad)}>{act.estado_actividad}</span>
                                      {act.resultado_actividad && (
                                        <span className={getActResultClass(act.resultado_actividad)}>{act.resultado_actividad}</span>
                                      )}
                                    </div>

                                    {/* DETALLES DE LA ACTIVIDAD */}
                                    <div className="activity-card-body">
                                      {act.cliente_nombre && (
                                        <div className="activity-detail-item">
                                          <span className="activity-detail-label">Cliente / Lugar</span>
                                          <span className="activity-detail-value main-highlight">{act.cliente_nombre}</span>
                                        </div>
                                      )}

                                      <div className="activity-detail-item">
                                        <span className="activity-detail-label">Descripción</span>
                                        <span className="activity-detail-value description-text">{act.descripcion}</span>
                                      </div>

                                      <div className="activity-detail-item">
                                        <span className="activity-detail-label">Inicio</span>
                                        <span className="activity-detail-value time-value">{formatTime(act.hora_inicio_actividad)}</span>
                                      </div>

                                      <div className="activity-detail-item">
                                        <span className="activity-detail-label">Fin</span>
                                        <span className="activity-detail-value time-value">{act.hora_fin_actividad ? formatTime(act.hora_fin_actividad) : '--:--'}</span>
                                      </div>

                                      {act.observacion && (
                                        <div className="activity-detail-item">
                                          <span className="activity-detail-label">Observación</span>
                                          <span className="activity-detail-value observation-box">{act.observacion}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* EVIDENCIA */}
                                    {(act.evidencia_inicio_url || act.evidencia_fin_url) && (
                                      <div className="activity-evidence-wrapper">
                                        {act.evidencia_inicio_url && (
                                          <div className="evidence-item">
                                            <span className="evidence-label">Evidencia Inicio</span>
                                            <img 
                                              src={act.evidencia_inicio_url.startsWith('http') ? act.evidencia_inicio_url : `${API_URL.replace('/api', '')}${act.evidencia_inicio_url}`} 
                                              alt="Evidencia Inicio" 
                                              className="evidence-thumb"
                                              onClick={() => window.open(act.evidencia_inicio_url.startsWith('http') ? act.evidencia_inicio_url : `${API_URL.replace('/api', '')}${act.evidencia_inicio_url}`, '_blank')}
                                            />
                                          </div>
                                        )}
                                        {act.evidencia_fin_url && (
                                          <div className="evidence-item">
                                            <span className="evidence-label">Evidencia Fin</span>
                                            <img 
                                              src={act.evidencia_fin_url.startsWith('http') ? act.evidencia_fin_url : `${API_URL.replace('/api', '')}${act.evidencia_fin_url}`} 
                                              alt="Evidencia Fin" 
                                              className="evidence-thumb"
                                              onClick={() => window.open(act.evidencia_fin_url.startsWith('http') ? act.evidencia_fin_url : `${API_URL.replace('/api', '')}${act.evidencia_fin_url}`, '_blank')}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="empty-state-message">No se registraron actividades de campo.</p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

              </div>

              {/* Seccion Recorrido GPS Premium */}
              <div className="card recorrido-gps-card mt-4 animate-in">
                <div className="card-header-flex">
                  <h2>Recorrido GPS</h2>
                  <div className="flex gap-2 items-center">
                    {trackingRecorrido && (
                      <span className="badge-count">
                        {trackingRecorrido.resumen.total_puntos} puntos
                      </span>
                    )}
                    {trackingRecorrido && (trackingRecorrido.jornada?.estado_jornada === 'en_proceso' || !trackingRecorrido.jornada?.hora_salida) && (
                      <span className="pulse-badge-live">
                        <span className="pulse-dot"></span>
                        En Vivo (60s)
                      </span>
                    )}
                  </div>
                </div>

                {loadingTracking ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando recorrido GPS...</p>
                  </div>
                ) : mapError ? (
                  <div className="empty-state text-center p-8">
                    <AlertCircle size={40} className="text-danger mb-2" />
                    <p className="text-gray-600">{mapError}</p>
                  </div>
                ) : !trackingRecorrido ? (
                  <div className="empty-state text-center p-8">
                    <MapPin size={40} className="text-muted mb-2" />
                    <p className="text-gray-600">Aún no se recuperan los datos de seguimiento.</p>
                  </div>
                ) : (
                  <div className="gps-section-layout">
                    {/* Map Container */}
                    <div className="google-map-wrapper">
                      <div ref={mapContainerRef} id="google-map-container" className="google-map-canvas">
                        {!googleMapsLoaded && (
                          <div className="loading-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                            <div className="spinner"></div>
                            <p>Cargando Google Maps...</p>
                          </div>
                        )}
                      </div>
                      {(!trackingRecorrido.puntos || trackingRecorrido.puntos.length === 0) && (
                        <div className="no-gps-points-banner">
                          <AlertCircle size={16} className="text-warning mr-2" />
                          <span>Aún no se registran puntos de recorrido GPS para esta jornada.</span>
                        </div>
                      )}
                    </div>

                    {/* Metrics Sidebar */}
                    <div className="gps-metrics-sidebar">
                      <h3>Resumen del Recorrido</h3>
                      
                      {trackingRecorrido.resumen.ultima_ubicacion && (
                        <div className="gps-metric-tile">
                          <span className="tile-label">Estado de zona</span>
                          <span className={`tile-value font-bold ${trackingRecorrido.resumen.ultima_ubicacion.es_fuera_de_zona ? 'text-danger' : 'text-success'}`}>
                            {trackingRecorrido.resumen.ultima_ubicacion.es_fuera_de_zona ? 'FUERA DE ZONA' : 'DENTRO DE ZONA'}
                          </span>
                        </div>
                      )}

                      {trackingRecorrido.resumen.ultima_ubicacion && (
                        <div className="gps-metric-tile">
                          <span className="tile-label">Distancia a la sede</span>
                          <span className="tile-value font-semibold">
                            {trackingRecorrido.resumen.ultima_ubicacion.distancia_sede_metros !== null
                              ? `${Math.round(trackingRecorrido.resumen.ultima_ubicacion.distancia_sede_metros)} metros`
                              : 'No disponible'}
                          </span>
                        </div>
                      )}

                      <div className="gps-metric-tile">
                        <span className="tile-label">Última actualización de datos</span>
                        <span className="tile-value font-semibold text-info">
                          {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : '--:--'}
                        </span>
                      </div>

                      <div className="gps-metric-tile">
                        <span className="tile-label">Total de puntos registrados</span>
                        <span className="tile-value">{trackingRecorrido.resumen.total_puntos}</span>
                      </div>

                      <div className="gps-metric-tile">
                        <span className="tile-label">Puntos fuera de zona</span>
                        <span className={`tile-value ${trackingRecorrido.resumen.total_fuera_de_zona > 0 ? 'text-warning font-bold' : ''}`}>
                          {trackingRecorrido.resumen.total_fuera_de_zona}
                        </span>
                      </div>

                      {trackingRecorrido.sede && (
                        <div className="gps-metric-tile gps-tile-full">
                          <span className="tile-label">Ubicación Sede/Local</span>
                          <span className="tile-value subtext">
                            <strong>{trackingRecorrido.sede.nombre || 'Asignada'}</strong>
                            <span className="coordinates">
                              (Radio: {trackingRecorrido.sede.radio_metros || 0} metros)
                            </span>
                          </span>
                        </div>
                      )}

                      {trackingRecorrido.resumen.primera_ubicacion && (
                        <div className="gps-metric-tile gps-tile-full">
                          <span className="tile-label">Primera ubicación</span>
                          <span className="tile-value subtext">
                            <strong>{formatTime(trackingRecorrido.resumen.primera_ubicacion.fecha_hora)}</strong>
                            <span className="coordinates">
                              ({trackingRecorrido.resumen.primera_ubicacion.latitud.toFixed(5)}, {trackingRecorrido.resumen.primera_ubicacion.longitud.toFixed(5)})
                            </span>
                          </span>
                        </div>
                      )}

                      {trackingRecorrido.resumen.ultima_ubicacion && (
                        <div className="gps-metric-tile gps-tile-full">
                          <span className="tile-label">Última ubicación</span>
                          <span className="tile-value subtext">
                            <strong>{formatTime(trackingRecorrido.resumen.ultima_ubicacion.fecha_hora)}</strong>
                            <span className="coordinates">
                              ({trackingRecorrido.resumen.ultima_ubicacion.latitud.toFixed(5)}, {trackingRecorrido.resumen.ultima_ubicacion.longitud.toFixed(5)})
                            </span>
                          </span>
                        </div>
                      )}

                      {trackingRecorrido.resumen.ultima_ubicacion && (
                        <div className="gps-two-column gps-tile-full">
                          {trackingRecorrido.resumen.ultima_ubicacion.bateria_porcentaje !== null && (
                            <div className="gps-metric-tile">
                              <span className="tile-label">Batería última</span>
                              <span className="tile-value font-semibold">
                                {trackingRecorrido.resumen.ultima_ubicacion.bateria_porcentaje}%
                              </span>
                            </div>
                          )}
                          
                          {trackingRecorrido.resumen.ultima_ubicacion.precision_metros !== null && (
                            <div className="gps-metric-tile">
                              <span className="tile-label">Precisión última</span>
                              <span className="tile-value font-semibold">
                                {Math.round(trackingRecorrido.resumen.ultima_ubicacion.precision_metros)} m
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default HistorialJornadas;
