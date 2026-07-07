import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  X,
  Search,
  SlidersHorizontal,
  Download,
  Eye,
  Building2,
  CheckCircle2,
  Target,
  Radio,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Map,
  Hash,
  FileText,
  Globe,
  Save,
  Pencil,
  Locate
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './Sedes.css';

//const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
const API_URL = import.meta.env.VITE_API_URL || 'https://apifincontrol.finatech.com.pe/api';

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
  const location = useLocation();
  const { showNotification, showConfirm } = useNotification();
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentSede, setCurrentSede] = useState(null);

  // Filter & Search local states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [radioFilter, setRadioFilter] = useState('Todos');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    referencia: '',
    latitud: '',
    longitud: '',
    radio_metros: 100,
    activo: true,
    sede_central_id: ''
  });

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');

  // Refs for Maps
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Ref for the right panel Leaflet Map
  const leafletMapRef = useRef(null);
  const leafletMapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Load Google Maps API dynamically (for Modal map locator)
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => console.error('Error al cargar la API de Google Maps.');
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setMapsLoaded(true));
    }
  }, []);

  // Load Leaflet dynamically (for the main Cobertura Map)
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  const [sedesCentrales, setSedesCentrales] = useState([]);

  const fetchSedes = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/sedes/?_t=${Date.now()}`, {
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

  const fetchSedesCentrales = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes-centrales/?_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedesCentrales(data);
      }
    } catch (err) {
      console.error('Error fetching sedes centrales:', err);
    }
  };

  useEffect(() => {
    fetchSedes();
    fetchSedesCentrales();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      const sedeCentralId = parseInt(params.get('sede_central_id'));

      // Need to defer slightly to ensure fetch is done or just set state
      setIsViewMode(false);
      setCurrentSede(null);
      setFormData({
        nombre: '',
        codigo: '',
        direccion: '',
        referencia: '',
        latitud: '',
        longitud: '',
        radio_metros: 100,
        activo: true,
        sede_central_id: sedeCentralId || ''
      });
      setSearchInputValue('');
      setIsModalOpen(true);

      // Clear URL params
      navigate('/sedes', { replace: true });
    }
  }, [location.search, navigate]);

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
        activo: sede.activo,
        sede_central_id: sede.sede_central_id || ''
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
        activo: true,
        sede_central_id: ''
      });
      setSearchInputValue('');
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (sede) => {
    setIsViewMode(true);
    handleOpenModal(sede);
  };

  const handleOpenEditModal = (sede) => {
    setIsViewMode(false);
    handleOpenModal(sede);
  };

  const handleOpenCreateModal = () => {
    setIsViewMode(false);
    handleOpenModal(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewMode(false);
    setCurrentSede(null);
    googleMapInstanceRef.current = null;
    markerRef.current = null;
    circleRef.current = null;
    autocompleteRef.current = null;
    setSearchInputValue('');
  };

  // Google Maps in Modal initialization
  useEffect(() => {
    if (!isModalOpen || !mapsLoaded) return;

    const timer = setTimeout(async () => {
      if (!mapContainerRef.current) return;

      const defaultLat = parseFloat(formData.latitud) || -12.046374; // Lima default
      const defaultLng = parseFloat(formData.longitud) || -77.042793;
      const hasCoords = !isNaN(parseFloat(formData.latitud)) && !isNaN(parseFloat(formData.longitud));
      const initialCenter = { lat: defaultLat, lng: defaultLng };

      const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: hasCoords ? 16 : 12,
        styles: [], // Use default light map theme to match mockup exactly
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: "DEMO_MAP_ID"
      });
      googleMapInstanceRef.current = map;

      const marker = new AdvancedMarkerElement({
        position: initialCenter,
        map: hasCoords ? map : null,
        gmpDraggable: !isViewMode,
        title: formData.nombre || 'Sede'
      });
      markerRef.current = marker;

      const radius = parseFloat(formData.radio_metros) || 100;
      const circle = new window.google.maps.Circle({
        map: map,
        radius: radius,
        fillColor: '#3b82f6', // Premium blue fill to match mockup
        fillOpacity: 0.08,
        strokeColor: '#3b82f6', // Premium blue outline to match mockup
        strokeOpacity: 0.6,
        strokeWeight: 1.5,
        center: initialCenter,
        visible: hasCoords
      });
      circleRef.current = circle;

      // Autocomplete setup if not in View Mode
      if (!isViewMode && searchInputRef.current && window.google && window.google.maps && window.google.maps.places) {
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
            latitud: lat.toFixed(8),
            longitud: lng.toFixed(8)
          }));

          const newPos = { lat, lng };
          map.setCenter(newPos);
          map.setZoom(16);
          marker.position = newPos;
          marker.map = map;
          circle.setCenter(newPos);
          circle.setVisible(true);
        });
      }

      // Map Click Handler only if editable
      if (!isViewMode) {
        map.addListener('click', (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          setFormData(prev => ({
            ...prev,
            latitud: lat.toFixed(8),
            longitud: lng.toFixed(8)
          }));

          const newPos = { lat, lng };
          marker.position = newPos;
          marker.map = map;
          circle.setCenter(newPos);
          circle.setVisible(true);

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

        marker.addListener('dragend', () => {
          const pos = marker.position;
          const lat = typeof pos.lat === 'function' ? pos.lat() : pos.lat;
          const lng = typeof pos.lng === 'function' ? pos.lng() : pos.lng;

          setFormData(prev => ({
            ...prev,
            latitud: lat.toFixed(8),
            longitud: lng.toFixed(8)
          }));

          const newPos = { lat, lng };
          circle.setCenter(newPos);

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
      }

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
  }, [isModalOpen, mapsLoaded, isViewMode]);

  // Sync inputs with circle/marker in modal map
  useEffect(() => {
    if (!isModalOpen || !googleMapInstanceRef.current) return;

    const lat = parseFloat(formData.latitud);
    const lng = parseFloat(formData.longitud);
    const hasCoords = !isNaN(lat) && !isNaN(lng);

    if (hasCoords) {
      const pos = { lat, lng };

      if (markerRef.current) {
        markerRef.current.position = pos;
        markerRef.current.map = googleMapInstanceRef.current;
      }

      if (circleRef.current) {
        circleRef.current.setCenter(pos);
        circleRef.current.setRadius(parseFloat(formData.radio_metros) || 100);
        circleRef.current.setVisible(true);
      }
    } else {
      if (markerRef.current) markerRef.current.map = null;
      if (circleRef.current) circleRef.current.setVisible(false);
    }
  }, [formData.latitud, formData.longitud, formData.radio_metros]);

  // Initialize right-hand Leaflet Map for coverage circles
  useEffect(() => {
    if (!leafletLoaded || !leafletMapRef.current || sedes.length === 0) return;

    if (!leafletMapInstanceRef.current) {
      // Find initial coordinate center from existing sedes or default Jaén
      const centerSede = sedes.find(s => s.latitud && s.longitud) || { latitud: -5.70770574, longitud: -78.80942970 };

      const map = window.L.map(leafletMapRef.current, {
        center: [parseFloat(centerSede.latitud), parseFloat(centerSede.longitud)],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Add zoom control to top-right
      window.L.control.zoom({ position: 'topright' }).addTo(map);

      // Light-themed tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      leafletMapInstanceRef.current = map;
      markersGroupRef.current = window.L.featureGroup().addTo(map);
    }

    const map = leafletMapInstanceRef.current;
    const group = markersGroupRef.current;

    group.clearLayers();

    // Add markers and circles for all filtered sedes
    const activeFilteredSedes = sedes.filter(s => {
      const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.direccion || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' ||
        (statusFilter === 'Activos' && s.activo) ||
        (statusFilter === 'Inactivos' && !s.activo);
      return matchesSearch && matchesStatus;
    });

    activeFilteredSedes.forEach(s => {
      if (s.latitud && s.longitud) {
        const lat = parseFloat(s.latitud);
        const lng = parseFloat(s.longitud);

        // Custom HTML Marker matching mockup style
        const marker = window.L.marker([lat, lng], {
          icon: window.L.divIcon({
            className: 'custom-map-marker',
            html: `<div class="marker-pin-dot"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        });

        marker.bindPopup(`<strong>${s.nombre}</strong><br>${s.direccion || 'Sin dirección'}<br>Radio: ${s.radio_metros || 50}m`);
        group.addLayer(marker);

        // Circular range boundary matching design
        const circle = window.L.circle([lat, lng], {
          radius: s.radio_metros || 50,
          color: '#2563eb',
          fillColor: '#2563eb',
          fillOpacity: 0.1,
          weight: 1,
          dashArray: '3 3'
        });
        group.addLayer(circle);
      }
    });

    // Fit map view bounds
    try {
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
      }
    } catch (e) {
      console.warn('Map bounds fit error:', e);
    }
  }, [leafletLoaded, sedes, searchTerm, statusFilter]);

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
      if (payload.sede_central_id === '') payload.sede_central_id = null;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSearchTerm('');
        setStatusFilter('Todos');
        setRadioFilter('Todos');
        await fetchSedes();
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
    if (!await showConfirm('Eliminar Sede', '¿Estás seguro de que deseas eliminar esta sede?', 'danger')) return;

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchSedes();
        showNotification('Sede eliminada correctamente.', 'success');
      } else {
        showNotification('Error al eliminar la sede.', 'error');
      }
    } catch (err) {
      console.error('Error deleting sede:', err);
      showNotification('No se pudo realizar la acción.', 'error');
    }
  };

  // Address line splitter
  const formatAddress = (address) => {
    if (!address) return { line1: '-', line2: '' };
    const parts = address.split(',');
    return {
      line1: parts[0].trim(),
      line2: parts.slice(1).join(',').trim()
    };
  };

  // Date and Time custom formatter
  const formatLastUpdated = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
      hours = hours % 12;
      hours = hours ? hours : 12;

      return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return '-';
    }
  };

  // Filter Logic
  const filteredSedesList = sedes.filter(sede => {
    const matchesSearch = sede.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sede.direccion || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'Todos' ||
      (statusFilter === 'Activos' && sede.activo) ||
      (statusFilter === 'Inactivos' && !sede.activo);

    const matchesRadio = radioFilter === 'Todos' ||
      (radioFilter === 'menor_30' && (sede.radio_metros || 0) < 30) ||
      (radioFilter === 'mayor_30' && (sede.radio_metros || 0) >= 30);

    return matchesSearch && matchesStatus && matchesRadio;
  });

  // Pagination Logic
  const totalItems = filteredSedesList.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSedesList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // KPIs Calculations
  const totalSedesCount = sedes.length;
  const activeSedesCount = sedes.filter(s => s.activo).length;
  const averageRadius = totalSedesCount > 0
    ? Math.round(sedes.reduce((acc, s) => acc + (s.radio_metros || 0), 0) / totalSedesCount)
    : 0;
  const radiosConfiguredCount = sedes.filter(s => s.radio_metros > 0).length;

  const activePct = totalSedesCount > 0 ? Math.round((activeSedesCount / totalSedesCount) * 100) : 100;
  const radiosPct = totalSedesCount > 0 ? Math.round((radiosConfiguredCount / totalSedesCount) * 100) : 100;

  return (
    <MainLayout
      title="Gestión de Sedes"
      subtitle="Administra las sucursales y sus zonas geográficas."
    >
      <div className="flex flex-col gap-6 w-full animate-in select-none">

        {/* Filters Toolbar */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
          <div className="flex flex-wrap gap-3 items-center flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative w-full max-w-[280px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar sede..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-sky-500 transition"
              />
            </div>

            {/* Estado Select */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Estado:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-sky-500 transition"
              >
                <option value="Todos">Todos</option>
                <option value="Activos">Activos</option>
                <option value="Inactivos">Inactivos</option>
              </select>
            </div>

            {/* Radio Select */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Radio:</label>
              <select
                value={radioFilter}
                onChange={(e) => {
                  setRadioFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-sky-500 transition"
              >
                <option value="Todos">Todos</option>
                <option value="menor_30">&lt; 30 m</option>
                <option value="mayor_30">&ge; 30 m</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] rounded-xl transition shadow-sm" onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4" />
              Nueva Sede
            </button>
          </div>
        </div>

        {/* 4 KPIs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Card 1: Total Sedes */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-sky-50 text-sky-500 flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total sedes</p>
              <p className="text-2xl font-extrabold text-slate-800 leading-tight mt-1">{totalSedesCount}</p>
              <p className="text-[10px] text-slate-450 leading-none mt-1">100% registradas</p>
            </div>
          </div>

          {/* Card 2: Sedes Activas */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-500 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Sedes activas</p>
              <p className="text-2xl font-extrabold text-slate-800 leading-tight mt-1">{activeSedesCount}</p>
              <p className="text-[10px] text-emerald-500 font-bold leading-none mt-1">{activePct}% operativas</p>
            </div>
          </div>

          {/* Card 3: Cobertura Promedio */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-50 text-purple-500 flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Cobertura promedio</p>
              <p className="text-2xl font-extrabold text-slate-800 leading-tight mt-1">{averageRadius} m</p>
              <p className="text-[10px] text-slate-450 leading-none mt-1">Radio configurado</p>
            </div>
          </div>

          {/* Card 4: Radios Configurados */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 text-amber-500 flex-shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Radios configurados</p>
              <p className="text-2xl font-extrabold text-slate-800 leading-tight mt-1">{radiosConfiguredCount}</p>
              <p className="text-[10px] text-amber-500 font-bold leading-none mt-1">{radiosPct}% con cobertura</p>
            </div>
          </div>
        </div>

        {/* 2-Column Split Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

          {/* Left Column: Sedes List */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">

              {/* Header inside Card */}
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Listado de Sedes</h2>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">{totalItems} sedes</span>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition">
                  <Download className="w-3.5 h-3.5" />
                  Exportar
                </button>
              </div>

              {/* Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sede Central</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dirección</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordenadas</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Radio</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Actualización</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-xs font-semibold text-slate-400">
                          Cargando sedes...
                        </td>
                      </tr>
                    ) : currentItems.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-xs font-semibold text-slate-400">
                          No se encontraron sedes.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map(sede => {
                        const addr = formatAddress(sede.direccion);
                        return (
                          <tr key={sede.id} className="hover:bg-slate-50/30 transition duration-150">
                            <td className="p-4 text-xs">
                              <div className="flex items-center gap-2 font-bold text-slate-800">
                                <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0">
                                  <MapPin className="w-3.5 h-3.5" />
                                </div>
                                {sede.nombre}
                              </div>
                            </td>
                            <td className="p-4 text-xs font-semibold text-slate-500">
                              {sede.sede_central_nombre || 'Sin asignar'}
                            </td>
                            <td className="p-4 text-xs font-medium text-slate-500">
                              <div>{addr.line1}</div>
                              {addr.line2 && <div className="text-[10px] text-slate-400 mt-0.5">{addr.line2}</div>}
                            </td>
                            <td className="p-4 text-xs font-semibold text-slate-400 font-mono">
                              {sede.latitud ? `${parseFloat(sede.latitud).toFixed(8)}, ${parseFloat(sede.longitud).toFixed(8)}` : '-'}
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-700">
                              {sede.radio_metros} m
                            </td>
                            <td className="p-4 text-xs">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sede.activo
                                ? 'bg-emerald-50 text-emerald-500'
                                : 'bg-rose-50 text-rose-500'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sede.activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {sede.activo ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {formatLastUpdated(sede.actualizado_at || sede.creado_at)}
                              </div>
                            </td>
                            <td className="p-4 text-xs">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  className="w-7 h-7 rounded-lg border border-slate-100 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition"
                                  onClick={() => handleOpenViewModal(sede)}
                                  title="Ver Detalle"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  className="w-7 h-7 rounded-lg border border-slate-100 text-[#2563eb] hover:bg-blue-50 flex items-center justify-center transition"
                                  onClick={() => handleOpenEditModal(sede)}
                                  title="Editar"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  className="w-7 h-7 rounded-lg border border-slate-100 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition"
                                  onClick={() => handleDelete(sede.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 p-4">
                <span className="text-[10px] font-bold text-slate-400">
                  Mostrando {totalItems > 0 ? indexOfFirstItem + 1 : 0} a {Math.min(indexOfLastItem, totalItems)} de {totalItems} sedes
                </span>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value={5}>5 por página</option>
                      <option value={10}>10 por página</option>
                      <option value={20}>20 por página</option>
                    </select>
                  </div>

                  <div className="flex gap-1">
                    <button
                      className="w-6 h-6 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 flex items-center justify-center transition disabled:opacity-50 disabled:pointer-events-none"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 h-6 rounded-lg bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center">
                      {currentPage}
                    </span>
                    <button
                      className="w-6 h-6 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 flex items-center justify-center transition disabled:opacity-50 disabled:pointer-events-none"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Cobertura Map */}
          <div className="lg:col-span-4 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <Map className="w-4 h-4 text-sky-500" /> Cobertura de sedes
              </h2>
              <div className="w-6 h-6 rounded-lg border border-slate-100 text-sky-500 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Leaflet Map Frame */}
            <div className="w-full h-[220px] rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative">
              {!leafletLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-xs text-slate-400 font-bold">
                  Cargando mapa de cobertura...
                </div>
              )}
              <div ref={leafletMapRef} className="w-full h-full z-0" />
            </div>

            {/* Map Statistics */}
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-bold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  Sedes activas
                </span>
                <span className="font-extrabold text-slate-800">{activeSedesCount}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-bold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                  Cobertura promedio
                </span>
                <span className="font-extrabold text-slate-800">{averageRadius} m</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-bold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
                  Última actualización
                </span>
                <span className="font-extrabold text-slate-800">
                  {sedes.length > 0
                    ? new Date(Math.max(...sedes.map(s => new Date(s.actualizado_at || s.creado_at)))).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-'
                  }
                </span>
              </div>
            </div>

            {/* Bottom map link */}
            <button
              onClick={() => navigate('/actividad')}
              className="mt-auto pt-3 border-t border-slate-100 text-left text-[10px] font-extrabold text-[#2563eb] hover:text-[#1d4ed8] flex items-center justify-between w-full"
            >
              <span>Ver cobertura en mapa completo</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#2563eb]" />
            </button>

          </div>

        </div>

      </div>

      {/* Google Map Edit/Create/View Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon bg-sky-50 text-sky-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="modal-header-text">
                  <h2>{isViewMode ? 'Detalle de Sede' : currentSede ? 'Editar Sede' : 'Nueva Sede'}</h2>
                  <p>Configura la información y ubicación geográfica de la sede.</p>
                </div>
              </div>
              <button className="btn-icon modal-close-btn" onClick={handleCloseModal} type="button">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-layout-grid">
                {/* Columna Izquierda: Formulario */}
                <div className="form-column">
                  <div className="form-row modal-inputs-row">
                    <div className="form-group flex-[2]">
                      <label>Nombre de la Sede <span className="text-rose-500">*</span></label>
                      <div className="relative input-wrapper">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          required
                          disabled={isViewMode}
                          className="input-field pl-9"
                          placeholder="TERRAPUERTO"
                        />
                      </div>
                    </div>
                    <div className="form-group flex-[1]">
                      <label>Código <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <div className="relative input-wrapper">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          name="codigo"
                          value={formData.codigo}
                          onChange={handleInputChange}
                          disabled={isViewMode}
                          className="input-field pl-9"
                          placeholder="# 002"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Sede Central <span className="text-slate-400 font-normal">(Opcional)</span></label>
                    <div className="relative input-wrapper">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <select
                        name="sede_central_id"
                        value={formData.sede_central_id || ''}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                        className="input-field pl-9 appearance-none"
                      >
                        <option value="">Sin asignar</option>
                        {sedesCentrales.filter(sc => sc.estado || sc.id === formData.sede_central_id).map(sc => (
                          <option key={sc.id} value={sc.id}>
                            {sc.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Dirección <span className="text-slate-400 font-normal">(Opcional)</span></label>
                    <div className="relative input-wrapper">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                        className="input-field pl-9"
                        placeholder="76F3+52X, Jaén 06801, Perú"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Referencia <span className="text-slate-400 font-normal">(Opcional)</span></label>
                    <div className="relative input-wrapper">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="referencia"
                        value={formData.referencia}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                        className="input-field pl-9"
                        placeholder="TERRAPUERTO NORORIENTAL DE JAÉN"
                      />
                    </div>
                  </div>

                  <div className="form-row modal-inputs-row">
                    <div className="form-group">
                      <label>Latitud</label>
                      <div className="relative input-wrapper">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="number"
                          step="any"
                          name="latitud"
                          value={formData.latitud}
                          onChange={handleInputChange}
                          disabled={isViewMode}
                          className="input-field pl-9"
                          placeholder="-5,72700200"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Longitud</label>
                      <div className="relative input-wrapper">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="number"
                          step="any"
                          name="longitud"
                          value={formData.longitud}
                          onChange={handleInputChange}
                          disabled={isViewMode}
                          className="input-field pl-9"
                          placeholder="-78,79741700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row modal-inputs-row-radio">
                    <div className="form-group">
                      <label>Radio de tolerancia <span className="text-slate-400 font-normal">(metros)</span></label>
                      <div className="relative input-wrapper">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="number"
                          name="radio_metros"
                          value={formData.radio_metros}
                          onChange={handleInputChange}
                          disabled={isViewMode}
                          min="1"
                          id="radio_metros_input"
                          className="input-field pl-9"
                          placeholder="50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="toggle-card">
                    <label className="switch">
                      <input
                        type="checkbox"
                        name="activo"
                        checked={formData.activo}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                      />
                      <span className="slider round"></span>
                    </label>
                    <div className="toggle-card-text" onClick={() => !isViewMode && setFormData(prev => ({ ...prev, activo: !prev.activo }))} style={{ cursor: isViewMode ? 'default' : 'pointer' }}>
                      <span className="toggle-card-title">Sede Activa</span>
                      <p className="toggle-card-desc">Activa o desactiva esta sede para el control de operaciones.</p>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Mapa de Google */}
                <div className="map-column">
                  <div className="map-card-wrapper card">
                    <div className="map-header">
                      <div className="map-header-icon bg-sky-50 text-sky-500">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="map-header-text">
                        <h3>Ubicación Geográfica en Mapa</h3>
                        <p>Visualiza y ajusta la ubicación de la sede en el mapa.</p>
                      </div>
                    </div>

                    {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                      <>
                        {!isViewMode && (
                          <div className="map-search-container">
                            <Search size={16} className="map-search-icon" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              className="map-search-input pl-9 pr-9"
                              placeholder="Buscar dirección o lugar"
                              value={searchInputValue}
                              onChange={(e) => setSearchInputValue(e.target.value)}
                            />
                            <button
                              type="button"
                              className="map-search-locate-btn"
                              onClick={() => {
                                if (navigator.geolocation && googleMapInstanceRef.current) {
                                  navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                      const lat = position.coords.latitude;
                                      const lng = position.coords.longitude;
                                      const pos = { lat, lng };
                                      googleMapInstanceRef.current.setCenter(pos);
                                      googleMapInstanceRef.current.setZoom(16);
                                      if (markerRef.current) {
                                        markerRef.current.position = pos;
                                        markerRef.current.map = googleMapInstanceRef.current;
                                      }
                                      if (circleRef.current) {
                                        circleRef.current.setCenter(pos);
                                        circleRef.current.setVisible(true);
                                      }
                                      setFormData(prev => ({
                                        ...prev,
                                        latitud: lat.toFixed(8),
                                        longitud: lng.toFixed(8)
                                      }));

                                      const geocoder = new window.google.maps.Geocoder();
                                      geocoder.geocode({ location: pos }, (results, status) => {
                                        if (status === 'OK' && results[0]) {
                                          setSearchInputValue(results[0].formatted_address);
                                          setFormData(prev => ({
                                            ...prev,
                                            direccion: results[0].formatted_address
                                          }));
                                        }
                                      });
                                    }
                                  );
                                }
                              }}
                              title="Obtener ubicación actual"
                            >
                              <Locate size={16} />
                            </button>
                          </div>
                        )}

                        <div className="map-canvas-container">
                          {!mapsLoaded && (
                            <div className="map-loading-overlay">
                              Cargando mapa de Google...
                            </div>
                          )}
                          <div ref={mapContainerRef} className="map-canvas" />

                          {/* Floating Radio Tolerance Banner */}
                          <div className="map-overlay-banner">
                            <div className="map-overlay-banner-left">
                              <span className="map-overlay-dot"></span>
                              <span className="map-overlay-text">
                                Radio de tolerancia: {formData.radio_metros || 0} metros
                              </span>
                            </div>
                            {!isViewMode && (
                              <button
                                type="button"
                                className="map-overlay-edit-btn"
                                onClick={() => {
                                  const input = document.getElementById('radio_metros_input');
                                  if (input) {
                                    input.focus();
                                    input.select();
                                  }
                                }}
                              >
                                <Pencil size={11} className="mr-1" />
                                Editar radio
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="map-canvas-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', gap: '0.75rem' }}>
                        <MapPin size={32} className="text-slate-400" />
                        <p className="text-slate-400 text-xs font-semibold">
                          Para habilitar el mapa interactivo y el buscador de direcciones, configure la variable <strong>VITE_GOOGLE_MAPS_API_KEY</strong> en su archivo <strong>.env</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  {isViewMode ? 'Cerrar' : 'Cancelar'}
                </button>
                {!isViewMode && (
                  <button type="submit" className="btn-save">
                    <Save size={14} className="mr-1.5" />
                    <span>Guardar Sede</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Sedes;
