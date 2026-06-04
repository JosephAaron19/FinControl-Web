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
  CheckCircle,
  Building2,
  Users,
  MinusCircle,
  ChevronLeft,
  IdCard,
  Eye,
  XCircle
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
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [jornadasCurrentPage, setJornadasCurrentPage] = useState(1);
  const [jornadasPerPage, setJornadasPerPage] = useState(10);

  // GPS tracking states
  const [trackingRecorrido, setTrackingRecorrido] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [mapRequested, setMapRequested] = useState(false);

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
        setMapError('No se pudo cargar el mapa. Intente nuevamente.');
      }
    } catch (err) {
      console.error('Error fetching tracking recorrido:', err);
      setMapError('No se pudo cargar el mapa. Intente nuevamente.');
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
      const res = await fetch(`${API_URL}/sedes/historial-resumen/`, {
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
  }, []);

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
    setUserCurrentPage(1);
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
        if (mapRequested) {
          fetchTrackingRecorrido(selectedJornadaId);
        }
      }
    }
  }, [selectedUser, selectedJornadaId, fetchHistorial, fetchJornadaDetalle, fetchTrackingRecorrido, mapRequested]);

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

  // Dynamically load Google Maps script only when requested
  useEffect(() => {
    if (!mapRequested) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('VITE_GOOGLE_MAPS_API_KEY no está definido en el archivo .env');
      setMapError('No se pudo cargar el mapa. Api key no definida.');
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
    script.onerror = () => {
      console.error('Error al cargar la script de Google Maps');
      setMapError('No se pudo cargar el mapa. Intente nuevamente.');
    };
    document.head.appendChild(script);
  }, [mapRequested]);

  // Auto-update tracking data every 60 seconds if the workday is in progress AND map is requested
  useEffect(() => {
    if (!mapRequested || !selectedJornadaId || !trackingRecorrido) return;

    const isEnProceso = trackingRecorrido.jornada?.estado_jornada === 'en_proceso' || 
                        !trackingRecorrido.jornada?.hora_salida;

    if (!isEnProceso) return;

    const intervalId = setInterval(() => {
      fetchTrackingRecorrido(selectedJornadaId, true); // Fetch silently in the background
    }, 60000);

    return () => clearInterval(intervalId);
  }, [selectedJornadaId, trackingRecorrido, fetchTrackingRecorrido, mapRequested]);

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
    setJornadasCurrentPage(1);
    setJornadasPerPage(10);
    fetchHistorial(user.id);
  };

  const handleLoadMap = () => {
    setMapRequested(true);
    fetchTrackingRecorrido(selectedJornadaId);
  };

  const handleJornadaSelect = (jornadaId) => {
    setSelectedJornadaId(jornadaId);
    setMapRequested(false);
    setLastUpdateTime(null);
    setMapError(null);
    setTrackingRecorrido(null);
    
    // Reset map refs to force complete recreation of map when switching journeys
    mapInstanceRef.current = null;
    mapJornadaIdRef.current = null;
    polylineRef.current = null;
    markersRef.current = [];
    circleRef.current = null;
    
    fetchJornadaDetalle(jornadaId);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setHistorial([]);
    setSelectedJornadaId(null);
    setJornadaDetalle(null);
    setTrackingRecorrido(null);
    setMapError(null);
    setMapRequested(false);
    setUserCurrentPage(1);
    
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
    setMapRequested(false);
    
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

  const formatMemberSince = (dateString) => {
    if (!dateString) return '12 may. 2024';
    try {
      const date = new Date(dateString);
      const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return '12 may. 2024';
    }
  };

  const getAvatarGradient = (userId) => {
    const gradients = [
      'linear-gradient(135deg, #0ea5e9, #2563eb)',
      'linear-gradient(135deg, #0d9488, #10b981)',
      'linear-gradient(135deg, #7c3aed, #a855f7)',
      'linear-gradient(135deg, #ea580c, #f97316)',
      'linear-gradient(135deg, #db2777, #ec4899)'
    ];
    return gradients[(userId || 0) % gradients.length];
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
                      <div className="sede-icon-wrapper bg-blue-50 text-blue-500">
                        <MapPin size={20} />
                      </div>
                      <h3>{sede.sede_nombre}</h3>
                    </div>
                    
                    <div className="sede-card-body">
                      <div className="sede-metrics-section">
                        <h4>PERSONAL</h4>
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
                        <h4>JORNADAS</h4>
                        <div className="sede-metric-row">
                          <span>Registradas:</span>
                          <strong>{sede.jornadas_registradas}</strong>
                        </div>
                        <div className="sede-metric-row">
                          <span>En proceso:</span>
                          <strong>{sede.jornadas_en_proceso}</strong>
                        </div>
                        <div className="sede-metric-row">
                          <span>Completas:</span>
                          <strong>{sede.jornadas_completas}</strong>
                        </div>
                        <div className="sede-metric-row">
                          <span>Ausencias:</span>
                          <strong>{sede.ausencias}</strong>
                        </div>
                      </div>

                      <div className="sede-metrics-section">
                        <h4>INCIDENCIAS</h4>
                        <div className="sede-metric-row">
                          <span>Reportadas:</span>
                          <strong>{sede.incidencias}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="sede-card-footer">
                      <button 
                        className="btn-ver-usuarios" 
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
                  <ChevronLeft size={16} /> Volver a Sedes
                </button>
              </div>
            )}

            {/* Sede details header and KPIs */}
            <div className="sede-details-header mb-6">
              <div className="sede-title-box">
                <div className="sede-icon-box bg-blue-50 text-blue-500">
                  <Building2 size={24} />
                </div>
                <h2>Usuarios de Sede: {selectedSede?.sede_nombre}</h2>
              </div>
              
              <div className="sede-kpis-row">
                <div className="sede-kpi-card card">
                  <div className="kpi-icon-box bg-blue-50 text-blue-500">
                    <Users size={18} />
                  </div>
                  <div className="kpi-content">
                    <span className="kpi-label">Total usuarios</span>
                    <span className="kpi-value">{usuarios.length}</span>
                  </div>
                </div>
                
                <div className="sede-kpi-card card">
                  <div className="kpi-icon-box bg-emerald-50 text-emerald-500">
                    <CheckCircle size={18} />
                  </div>
                  <div className="kpi-content">
                    <span className="kpi-label">Activos</span>
                    <span className="kpi-value">{usuarios.filter(u => u.activo).length}</span>
                  </div>
                </div>
                
                <div className="sede-kpi-card card">
                  <div className="kpi-icon-box bg-purple-50 text-purple-500">
                    <User size={18} />
                  </div>
                  <div className="kpi-content">
                    <span className="kpi-label">Asesores</span>
                    <span className="kpi-value">
                      {usuarios.filter(u => (u.rol_info?.codigo || '').toLowerCase() === 'asesor').length}
                    </span>
                  </div>
                </div>
                
                <div className="sede-kpi-card card">
                  <div className="kpi-icon-box bg-teal-50 text-teal-500">
                    <MinusCircle size={18} />
                  </div>
                  <div className="kpi-content">
                    <span className="kpi-label">Inactivos</span>
                    <span className="kpi-value">{usuarios.filter(u => !u.activo).length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom filters toolbar */}
            <div className="user-filters-toolbar card mb-6">
              <div className="search-filter-input-wrapper">
                <Search size={18} className="filter-input-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar usuario por nombre o DNI..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setUserCurrentPage(1);
                  }}
                  className="filter-search-input"
                />
              </div>

              <div className="select-filter-wrapper">
                <User size={18} className="filter-select-icon" />
                <select 
                  value={roleFilter} 
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setUserCurrentPage(1);
                  }}
                  className="filter-select-native"
                >
                  <option value="">Todos los Roles</option>
                  <option value="operador">Operadores</option>
                  <option value="asesor">Asesores</option>
                </select>
              </div>

              <div className="select-filter-wrapper">
                <MinusCircle size={18} className="filter-select-icon" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setUserCurrentPage(1);
                  }}
                  className="filter-select-native"
                >
                  <option value="">Todos los Estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
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
            ) : (() => {
              const itemsPerPage = 10;
              const indexOfLastItem = userCurrentPage * itemsPerPage;
              const indexOfFirstItem = indexOfLastItem - itemsPerPage;
              const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
              const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

              return (
                <>
                  <div className="users-card-grid">
                    {currentUsers.map(user => (
                      <div 
                        key={user.id} 
                        className="user-item-card card"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="user-card-body-layout">
                          <div 
                            className="user-card-avatar-circle"
                            style={{ background: getAvatarGradient(user.id) }}
                          >
                            {user.nombre_completo.charAt(0)}
                          </div>
                          <div className="user-card-main-info">
                            <h3>{user.nombre_completo}</h3>
                            <p className="dni-info-row">
                              <IdCard size={14} className="text-slate-400" />
                              <span>DNI {user.dni}</span>
                            </p>
                          </div>
                        </div>

                        <div className="card-divider-dotted" />

                        <div className="user-card-badges-row">
                          <span className={`role-badge-pill ${(user.rol_info?.codigo || '').toLowerCase()}`}>
                            {user.rol_info?.name || user.rol_info?.nombre || 'Sin Rol'}
                          </span>
                          <span className={`status-badge-pill ${user.activo ? 'activo' : 'inactivo'}`}>
                            {user.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </div>

                        <div className="user-card-footer-layout">
                          <div className="member-since-box">
                            <Calendar size={14} className="text-slate-400" />
                            <span>Miembro desde {formatMemberSince(user.creado_at)}</span>
                          </div>
                          <button className="btn-card-action">
                            <span>Ver historial</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination footer */}
                  <div className="users-pagination-footer card">
                    <span className="pagination-info-text">
                      Mostrando {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0} a {Math.min(indexOfLastItem, filteredUsers.length)} de {filteredUsers.length} usuarios
                    </span>
                    
                    <div className="pagination-controls-box">
                      <button
                        className="btn-pagination-nav"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserCurrentPage(prev => Math.max(1, prev - 1));
                        }}
                        disabled={userCurrentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="pagination-current-page-num">
                        {userCurrentPage}
                      </span>
                      <button
                        className="btn-pagination-nav"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserCurrentPage(prev => Math.min(totalPages, prev + 1));
                        }}
                        disabled={userCurrentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : !selectedJornadaId ? (
          /* LEVEL 2: JORNADA LIST FOR USER */
          <div className="history-detail-view animate-in">
            <div className="view-actions">
              <button className="btn-back" onClick={handleBackToUsers}>
                <ChevronLeft size={16} /> Volver a usuarios
              </button>
            </div>

            {/* Premium Date & Attendance Filters Card */}
            <div className="card journeys-filters-card mb-6">
              <form onSubmit={applyFilters} className="journeys-filters-grid">
                <div className="filter-item-box">
                  <span className="filter-item-label">Desde</span>
                  <div className="date-input-wrapper-styled">
                    <Calendar size={18} className="date-icon-left" />
                    <input 
                      type="date" 
                      name="fecha_inicio" 
                      value={filters.fecha_inicio} 
                      onChange={handleFilterChange} 
                      className="date-input-native" 
                    />
                  </div>
                </div>

                <div className="filter-item-box">
                  <span className="filter-item-label">Hasta</span>
                  <div className="date-input-wrapper-styled">
                    <Calendar size={18} className="date-icon-left" />
                    <input 
                      type="date" 
                      name="fecha_fin" 
                      value={filters.fecha_fin} 
                      onChange={handleFilterChange} 
                      className="date-input-native" 
                    />
                  </div>
                </div>

                <div className="filter-item-box select-box">
                  <span className="filter-item-label">Asistencia</span>
                  <div className="select-input-wrapper-styled">
                    <Filter size={16} className="select-icon-left" />
                    <select 
                      name="estado_asistencia" 
                      value={filters.estado_asistencia} 
                      onChange={handleFilterChange} 
                      className="select-input-native"
                    >
                      <option value="">Todos los estados</option>
                      <option value="programada">Programada</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="completa">Completa</option>
                      <option value="incompleta">Incompleta</option>
                      <option value="ausente">Ausente</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-filter-submit">
                  <Search size={16} />
                  <span>Filtrar</span>
                </button>
              </form>
            </div>

            {/* Results Table Card */}
            <div className="card journeys-results-card">
              <div className="journeys-results-header">
                <div className="calendar-icon-wrapper bg-blue-50 text-blue-500">
                  <Calendar size={20} />
                </div>
                <h2>Jornadas de {selectedUser.nombre_completo}</h2>
              </div>
              
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Cargando...</p>
                </div>
              ) : historial.length > 0 ? (() => {
                // Client-side pagination logic
                const indexOfLastItem = jornadasCurrentPage * jornadasPerPage;
                const indexOfFirstItem = indexOfLastItem - jornadasPerPage;
                const currentJornadas = historial.slice(indexOfFirstItem, indexOfLastItem);
                const totalPages = Math.ceil(historial.length / jornadasPerPage) || 1;

                // Inner helper to format short dates like 3/6/2026
                const formatDateShort = (dateString) => {
                  if (!dateString) return '-';
                  try {
                    const date = new Date(dateString + 'T00:00:00');
                    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                  } catch (e) {
                    return dateString;
                  }
                };

                // Inner helper to render custom Status badges with clock/check/X circles
                const renderEstadoBadge = (estado) => {
                  const est = (estado || 'pendiente').toLowerCase();
                  if (est === 'pendiente') {
                    return (
                      <span className="table-estado-badge warning">
                        <Clock size={12} />
                        <span>Pendiente</span>
                      </span>
                    );
                  }
                  if (est === 'no_marco_entrada') {
                    return (
                      <span className="table-estado-badge danger">
                        <XCircle size={12} />
                        <span>No marcó entrada</span>
                      </span>
                    );
                  }
                  if (est === 'tardanza') {
                    return (
                      <span className="table-estado-badge danger">
                        <Clock size={12} />
                        <span>Tardanza (entrada)</span>
                      </span>
                    );
                  }
                  if (est === 'puntual') {
                    return (
                      <span className="table-estado-badge success">
                        <CheckCircle size={12} />
                        <span>Entrada Puntual</span>
                      </span>
                    );
                  }
                  if (est === 'temprano') {
                    return (
                      <span className="table-estado-badge success">
                        <CheckCircle size={12} />
                        <span>Entrada Anticipada</span>
                      </span>
                    );
                  }
                  return (
                    <span className="table-estado-badge info">
                      <span>{punctualityLabels[estado] || estado}</span>
                    </span>
                  );
                };

                const renderSalidaBadge = (estado) => {
                  const est = (estado || 'pendiente').toLowerCase();
                  if (est === 'pendiente') {
                    return (
                      <span className="table-estado-badge warning">
                        <Clock size={12} />
                        <span>Pendiente</span>
                      </span>
                    );
                  }
                  if (est === 'no_marco_salida') {
                    return (
                      <span className="table-estado-badge danger">
                        <XCircle size={12} />
                        <span>No marcó salida</span>
                      </span>
                    );
                  }
                  if (est === 'tardanza') {
                    return (
                      <span className="table-estado-badge danger">
                        <Clock size={12} />
                        <span>Salida Tardía</span>
                      </span>
                    );
                  }
                  if (est === 'puntual') {
                    return (
                      <span className="table-estado-badge success">
                        <CheckCircle size={12} />
                        <span>Salida Puntual</span>
                      </span>
                    );
                  }
                  if (est === 'temprano') {
                    return (
                      <span className="table-estado-badge success">
                        <CheckCircle size={12} />
                        <span>Salida Anticipada</span>
                      </span>
                    );
                  }
                  return (
                    <span className="table-estado-badge info">
                      <span>{exitStatusLabels[estado] || estado}</span>
                    </span>
                  );
                };

                const renderAsistenciaBadge = (estado) => {
                  const est = (estado || '').toLowerCase();
                  if (est === 'programada') {
                    return (
                      <span className="table-asistencia-badge programada">
                        <Calendar size={12} />
                        <span>Programada</span>
                      </span>
                    );
                  }
                  if (est === 'ausente') {
                    return (
                      <span className="table-asistencia-badge ausente">
                        <User size={12} />
                        <span>Ausente</span>
                      </span>
                    );
                  }
                  if (est === 'completa' || est === 'completada') {
                    return (
                      <span className="table-asistencia-badge completa">
                        <CheckCircle size={12} />
                        <span>Completa</span>
                      </span>
                    );
                  }
                  if (est === 'en_proceso') {
                    return (
                      <span className="table-asistencia-badge en-proceso">
                        <Clock size={12} />
                        <span>En proceso</span>
                      </span>
                    );
                  }
                  if (est === 'incompleta') {
                    return (
                      <span className="table-asistencia-badge incompleta">
                        <AlertCircle size={12} />
                        <span>Incompleta</span>
                      </span>
                    );
                  }
                  return (
                    <span className="table-asistencia-badge info">
                      <span>{attendanceLabels[estado] || estado}</span>
                    </span>
                  );
                };

                return (
                  <>
                    <div className="table-responsive-custom">
                      <table className="data-table-custom">
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
                            <th className="text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentJornadas.map((item) => (
                            <tr 
                              key={item.id} 
                              onClick={() => handleJornadaSelect(item.id)} 
                              className="clickable-row-custom"
                            >
                              <td className="font-bold text-slate-800">
                                {formatDateShort(item.fecha)}
                              </td>
                              <td className="text-slate-500 font-medium">
                                {formatTime(item.hora_entrada)}
                              </td>
                              <td className="text-slate-500 font-medium">
                                {formatTime(item.hora_salida)}
                              </td>
                              <td>
                                {item.hora_entrada && (item.total_horas_trabajadas || item.hora_salida) ? (
                                  <span className="duration-tag-badge">
                                    <Clock size={12} />
                                    <span>
                                      {item.total_horas_trabajadas 
                                        ? formatDuration(item.total_horas_trabajadas) 
                                        : calculateDuration(item.hora_entrada, item.hora_salida)
                                      }
                                    </span>
                                  </span>
                                ) : (
                                  <span className="duration-empty-badge">-</span>
                                )}
                              </td>
                              <td className="text-center font-bold text-slate-500">
                                {item.total_incidencias > 0 ? (
                                  <span className="count-badge-incidents">{item.total_incidencias}</span>
                                ) : '-'}
                              </td>
                              <td className="text-center">
                                {item.total_puntos_gps > 0 ? (
                                  <span className="count-badge-gps">{item.total_puntos_gps}</span>
                                ) : '-'}
                              </td>
                              <td>
                                <div className="estado-badges-stack">
                                  {renderEstadoBadge(item.estado_puntualidad)}
                                  {item.hora_salida && renderSalidaBadge(item.estado_salida)}
                                </div>
                              </td>
                              <td>
                                {renderAsistenciaBadge(item.estado_asistencia)}
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <div className="action-cell-center">
                                  <button
                                    className="btn-action-view"
                                    onClick={() => handleJornadaSelect(item.id)}
                                    title="Ver Detalle"
                                  >
                                    <Eye size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Pagination Footer */}
                    <div className="table-pagination-footer-custom">
                      <span className="pagination-info-text-custom">
                        Mostrando {historial.length > 0 ? indexOfFirstItem + 1 : 0} a {Math.min(indexOfLastItem, historial.length)} de {historial.length} jornadas
                      </span>
                      
                      <div className="pagination-controls-box-custom">
                        {/* Selector for items per page */}
                        <div className="items-per-page-select-wrapper">
                          <select
                            value={jornadasPerPage}
                            onChange={(e) => {
                              setJornadasPerPage(parseInt(e.target.value));
                              setJornadasCurrentPage(1);
                            }}
                            className="items-per-page-select"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                          </select>
                        </div>

                        <button
                          className="btn-pagination-nav-custom"
                          onClick={() => setJornadasCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={jornadasCurrentPage === 1}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        
                        <span className="pagination-current-page-num-custom">
                          {jornadasCurrentPage}
                        </span>
                        
                        <button
                          className="btn-pagination-nav-custom"
                          onClick={() => setJornadasCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={jornadasCurrentPage === totalPages}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })() : (
                <div className="empty-state">
                  <AlertCircle size={48} />
                  <p>No hay jornadas registradas.</p>
                </div>
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
                <div className="detail-layout-v2">

                  <div className="detail-main-v2">

                    <div className="dv2-card">
                      <div className="dv2-summary-top">
                        <div className="dv2-date-block">
                          <div className="dv2-cal-icon">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <h3 className="dv2-date-title">
                              {new Date(jornadaDetalle.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            <div className="dv2-user-meta">
                              <span className="dv2-user-chip"><User size={12} /> {jornadaDetalle.operador}</span>
                              <span className="dv2-dot">·</span>
                              <span className="dv2-sede-chip"><Building2 size={12} /> {jornadaDetalle.sede}</span>
                            </div>
                            <span className={`dv2-role-badge ${jornadaDetalle.rol_codigo?.toLowerCase()}`}>
                              {jornadaDetalle.rol_nombre || '-'}
                            </span>
                          </div>
                        </div>
                        <div className="dv2-status-block">
                          <span className="dv2-estado-label">ESTADO DE JORNADA</span>
                          <div className="dv2-badges-row">
                            <span className={`dv2-badge dv2-badge-asistencia ${jornadaDetalle.estado_asistencia}`}>
                              {attendanceLabels[jornadaDetalle.estado_asistencia] || jornadaDetalle.estado_asistencia}
                            </span>
                            <span className={`dv2-badge dv2-badge-puntualidad ${jornadaDetalle.estado_puntualidad}`}>
                              {punctualityLabels[jornadaDetalle.estado_puntualidad] || jornadaDetalle.estado_puntualidad}
                            </span>
                            {jornadaDetalle.hora_salida && (
                              <span className={`dv2-badge dv2-badge-salida ${jornadaDetalle.estado_salida}`}>
                                {exitStatusLabels[jornadaDetalle.estado_salida] || jornadaDetalle.estado_salida}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="dv2-metrics-row">
                        <div className="dv2-metric">
                          <Clock size={18} className="dv2-metric-icon entry" />
                          <div>
                            <span className="dv2-metric-label">ENTRADA</span>
                            <strong className="dv2-metric-value">{formatTime(jornadaDetalle.hora_entrada)}</strong>
                          </div>
                        </div>
                        <div className="dv2-metric">
                          <Clock size={18} className="dv2-metric-icon exit" />
                          <div>
                            <span className="dv2-metric-label">SALIDA</span>
                            <strong className="dv2-metric-value">{formatTime(jornadaDetalle.hora_salida)}</strong>
                          </div>
                        </div>
                        <div className="dv2-metric">
                          <Activity size={18} className="dv2-metric-icon hours" />
                          <div>
                            <span className="dv2-metric-label">HORAS TRABAJADAS</span>
                            <strong className="dv2-metric-value">
                              {jornadaDetalle.total_horas_trabajadas ? formatDuration(jornadaDetalle.total_horas_trabajadas) : calculateDuration(jornadaDetalle.hora_entrada, jornadaDetalle.hora_salida)}
                            </strong>
                          </div>
                        </div>
                        <div className="dv2-metric">
                          <Clock size={18} className="dv2-metric-icon break" />
                          <div>
                            <span className="dv2-metric-label">TOTAL DESCANSO</span>
                            <strong className="dv2-metric-value">
                              {jornadaDetalle.total_tiempo_break ? formatDuration(jornadaDetalle.total_tiempo_break) : '-'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="dv2-status-row">
                        <div className="dv2-status-item">
                          <Activity size={15} className="dv2-status-icon" />
                          <div>
                            <span className="dv2-status-label">ESTADO ASISTENCIA</span>
                            <span className={`dv2-status-val asistencia-${jornadaDetalle.estado_asistencia}`}>
                              {attendanceLabels[jornadaDetalle.estado_asistencia] || jornadaDetalle.estado_asistencia}
                            </span>
                          </div>
                        </div>
                        <div className="dv2-status-item">
                          <CheckCircle size={15} className="dv2-status-icon" />
                          <div>
                            <span className="dv2-status-label">SALIDA / PUNTUALIDAD</span>
                            <span className={`dv2-status-val salida-${jornadaDetalle.estado_salida}`}>
                              {exitStatusLabels[jornadaDetalle.estado_salida] || jornadaDetalle.estado_salida || 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="dv2-card">
                      <h2 className="dv2-card-title">Cronología de la Jornada (Marcaciones)</h2>
                      <div className="dv2-timeline">
                        {jornadaDetalle.eventos?.map((evt, idx) => (
                          <div key={idx} className="dv2-timeline-item">
                            <span className="dv2-tl-time">{formatTime(evt.fecha_hora)}</span>
                            <div className="dv2-tl-track">
                              <div className={`dv2-tl-dot ${(evt.tipo_evento || 'info').toLowerCase()}`} />
                              {idx < (jornadaDetalle.eventos.length - 1) && <div className="dv2-tl-line" />}
                            </div>
                            <div className="dv2-tl-content">
                              <strong className="dv2-tl-event-name">
                                {(evt.tipo_evento || 'Evento').replace(/_/g, ' ').toUpperCase()}
                              </strong>
                              {evt.distancia_sede_metros > 0 && (
                                <p className="dv2-tl-distance">A {parseFloat(evt.distancia_sede_metros).toFixed(0)}m de la sede</p>
                              )}
                              {evt.es_fuera_de_zona && (
                                <span className="dv2-tl-zone-pill">FUERA DE ZONA</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="detail-side-v2">

                    <div className="dv2-card dv2-side-card">
                      <div className="dv2-side-card-header">
                        <div className="dv2-side-card-title-row">
                          <AlertCircle size={16} className="dv2-side-icon" />
                          <h2 className="dv2-card-title">Incidencias</h2>
                        </div>
                        <button className="dv2-kebab-btn" title="Opciones">&#x22EE;</button>
                      </div>
                      {jornadaDetalle.incidencias && jornadaDetalle.incidencias.length > 0 ? (
                        <div className="dv2-incidents-list">
                          {jornadaDetalle.incidencias.map((inc, idx) => (
                            <div key={idx} className="dv2-incident-item">
                              <div className="dv2-incident-header">
                                <strong>{inc.tipo_incidencia_0?.nombre || inc.tipo_incidencia || 'Incidencia'}</strong>
                                <span className="dv2-incident-time">{formatTime(inc.fecha_hora_reporte)}</span>
                              </div>
                              <p className="dv2-incident-desc">{inc.descripcion}</p>
                              <span className="dv2-incident-estado">{inc.estado_revision}</span>
                              {inc.foto && (
                                <img
                                  src={inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`}
                                  alt="Evidencia"
                                  className="dv2-incident-img"
                                  onClick={() => window.open(inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`, '_blank')}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="dv2-empty-panel">
                          <CheckCircle size={20} className="dv2-empty-icon" />
                          <span>No se reportaron incidencias.</span>
                        </div>
                      )}
                    </div>

                    {((jornadaDetalle.rol_codigo || '').toUpperCase() === 'ASESOR') && (
                      <div className="dv2-card dv2-side-card">
                        <div className="dv2-side-card-header">
                          <div className="dv2-side-card-title-row">
                            <Calendar size={16} className="dv2-side-icon activities" />
                            <h2 className="dv2-card-title">Actividades de campo</h2>
                          </div>
                        </div>
                        {jornadaDetalle.actividades_campo && jornadaDetalle.actividades_campo.length > 0 ? (
                          <div className="dv2-activities-list">
                            {jornadaDetalle.actividades_campo.map((act, idx) => (
                              <div key={idx} className="dv2-activity-item">
                                <div className="dv2-act-badges">
                                  <span className={getActTypeClass(act.tipo_actividad)}>{act.tipo_actividad}</span>
                                  <span className={getActStatusClass(act.estado_actividad)}>{act.estado_actividad}</span>
                                  {act.resultado_actividad && (
                                    <span className={getActResultClass(act.resultado_actividad)}>{act.resultado_actividad}</span>
                                  )}
                                </div>
                                {act.cliente_nombre && (
                                  <div className="dv2-act-field">
                                    <span className="dv2-act-field-label">CLIENTE / LUGAR</span>
                                    <span className="dv2-act-field-value bold">{act.cliente_nombre}</span>
                                  </div>
                                )}
                                <div className="dv2-act-field">
                                  <span className="dv2-act-field-label">DESCRIPCION</span>
                                  <span className="dv2-act-field-value">{act.descripcion}</span>
                                </div>
                                <div className="dv2-act-times">
                                  <div className="dv2-act-time-item">
                                    <span className="dv2-act-field-label">INICIO</span>
                                    <span className="dv2-act-field-value">{formatTime(act.hora_inicio_actividad)}</span>
                                  </div>
                                  <div className="dv2-act-time-item">
                                    <span className="dv2-act-field-label">FIN</span>
                                    <span className="dv2-act-field-value">{act.hora_fin_actividad ? formatTime(act.hora_fin_actividad) : '--:--'}</span>
                                  </div>
                                  {act.observacion && (
                                    <div className="dv2-act-time-item dv2-act-obs">
                                      <span className="dv2-act-field-label">OBSERVACION</span>
                                      <span className="dv2-act-obs-val">{act.observacion}</span>
                                    </div>
                                  )}
                                </div>
                                {(act.evidencia_inicio_url || act.evidencia_fin_url) && (
                                  <div className="dv2-act-evidence">
                                    {act.evidencia_inicio_url && (
                                      <div className="dv2-evidence-item">
                                        <span className="dv2-act-field-label">Evidencia Inicio</span>
                                        <img
                                          src={act.evidencia_inicio_url.startsWith('http') ? act.evidencia_inicio_url : `${API_URL.replace('/api', '')}${act.evidencia_inicio_url}`}
                                          alt="Evidencia Inicio"
                                          className="dv2-evidence-thumb"
                                          onClick={() => window.open(act.evidencia_inicio_url.startsWith('http') ? act.evidencia_inicio_url : `${API_URL.replace('/api', '')}${act.evidencia_inicio_url}`, '_blank')}
                                        />
                                      </div>
                                    )}
                                    {act.evidencia_fin_url && (
                                      <div className="dv2-evidence-item">
                                        <span className="dv2-act-field-label">Evidencia Fin</span>
                                        <img
                                          src={act.evidencia_fin_url.startsWith('http') ? act.evidencia_fin_url : `${API_URL.replace('/api', '')}${act.evidencia_fin_url}`}
                                          alt="Evidencia Fin"
                                          className="dv2-evidence-thumb"
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
                          <p className="dv2-empty-text">No se registraron actividades de campo.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="dv2-gps-section">
                  <div className="dv2-gps-header">
                    <h2 className="dv2-gps-title">Recorrido GPS</h2>
                    <div className="dv2-gps-header-right">
                      {((trackingRecorrido?.resumen?.total_puntos !== undefined ? trackingRecorrido.resumen.total_puntos : (jornadaDetalle?.total_puntos_gps || 0)) > 0) && (
                        <span className="dv2-gps-count-badge">
                          {trackingRecorrido?.resumen?.total_puntos !== undefined ? trackingRecorrido.resumen.total_puntos : jornadaDetalle.total_puntos_gps} puntos
                        </span>
                      )}
                      {trackingRecorrido && (trackingRecorrido.jornada?.estado_jornada === 'en_proceso' || !trackingRecorrido.jornada?.hora_salida) && (
                        <span className="pulse-badge-live">
                          <span className="pulse-dot"></span>
                          En Vivo (60s)
                        </span>
                      )}
                      <button onClick={handleLoadMap} disabled={loadingTracking} className="dv2-btn-load-map">
                        {loadingTracking ? (
                          <><span className="map-btn-spinner"></span> Cargando...</>
                        ) : (
                          (!mapRequested || mapError) ? 'Cargar mapa de recorrido' : 'Actualizar recorrido'
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="dv2-gps-body">
                    <div className="dv2-google-map-wrapper">
                      {loadingTracking && (
                        <div className="map-loading-overlay">
                          <div className="spinner"></div>
                          <p>Cargando mapa y recorrido GPS...</p>
                        </div>
                      )}
                      {mapError && !loadingTracking && (
                        <div className="map-error-overlay">
                          <AlertCircle size={40} />
                          <p>No se pudo cargar el mapa. Intente nuevamente.</p>
                          <button onClick={handleLoadMap} className="dv2-btn-load-map">Intentar nuevamente</button>
                        </div>
                      )}
                      {!mapRequested && !loadingTracking && !mapError && (
                        <div className="dv2-map-placeholder">
                          <div className="dv2-map-pin-circle">
                            <MapPin size={40} className="dv2-map-pin-icon" />
                          </div>
                          <p className="dv2-map-placeholder-title">Mapa de recorrido no cargado</p>
                          <p className="dv2-map-placeholder-sub">Carga el recorrido GPS para visualizar el trayecto de la jornada.</p>
                          <button onClick={handleLoadMap} className="dv2-btn-load-map-inner">Cargar mapa de recorrido</button>
                        </div>
                      )}
                      {mapRequested && !loadingTracking && !mapError && trackingRecorrido && (!trackingRecorrido.puntos || trackingRecorrido.puntos.length === 0) && (
                        <div className="map-empty-overlay">
                          <AlertCircle size={40} />
                          <p>No se registraron puntos GPS para esta jornada.</p>
                        </div>
                      )}
                      {mapRequested && (
                        <div ref={mapContainerRef} id="google-map-container" className="google-map-canvas">
                          {!googleMapsLoaded && !mapError && (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#f8fafc' }}>
                              <div className="spinner"></div>
                              <p style={{ color: '#64748b' }}>Cargando Google Maps...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="dv2-gps-sidebar">
                      <h3 className="dv2-gps-sidebar-title">Resumen del Recorrido</h3>
                      <div className="dv2-gps-tile">
                        <span className="dv2-gps-tile-label">ESTADO DE ZONA</span>
                        <span className={`dv2-gps-tile-value ${trackingRecorrido?.resumen?.ultima_ubicacion ? (trackingRecorrido.resumen.ultima_ubicacion.es_fuera_de_zona ? 'danger' : 'success') : ''}`}>
                          {trackingRecorrido?.resumen?.ultima_ubicacion ? (trackingRecorrido.resumen.ultima_ubicacion.es_fuera_de_zona ? 'FUERA DE ZONA' : 'DENTRO DE ZONA') : 'SIN CARGAR'}
                        </span>
                      </div>
                      <div className="dv2-gps-tile">
                        <span className="dv2-gps-tile-label">DISTANCIA A LA SEDE</span>
                        <span className="dv2-gps-tile-value">
                          {trackingRecorrido?.resumen?.ultima_ubicacion ? (trackingRecorrido.resumen.ultima_ubicacion.distancia_sede_metros !== null ? `${Math.round(trackingRecorrido.resumen.ultima_ubicacion.distancia_sede_metros)} metros` : 'No disponible') : 'SIN CARGAR'}
                        </span>
                      </div>
                      <div className="dv2-gps-tile">
                        <span className="dv2-gps-tile-label">ULTIMA ACTUALIZACION</span>
                        <span className="dv2-gps-tile-value">{lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'SIN CARGAR'}</span>
                      </div>
                      <div className="dv2-gps-tile">
                        <span className="dv2-gps-tile-label">TOTAL PUNTOS</span>
                        <span className="dv2-gps-tile-value">
                          {trackingRecorrido?.resumen?.total_puntos !== undefined ? trackingRecorrido.resumen.total_puntos : (jornadaDetalle?.total_puntos_gps || 0)}
                        </span>
                      </div>
                      <div className="dv2-gps-tile">
                        <span className="dv2-gps-tile-label">PUNTOS FUERA DE ZONA</span>
                        <span className={`dv2-gps-tile-value ${trackingRecorrido?.resumen?.total_fuera_de_zona > 0 ? 'warning' : ''}`}>
                          {trackingRecorrido?.resumen?.total_fuera_de_zona !== undefined ? trackingRecorrido.resumen.total_fuera_de_zona : 'SIN CARGAR'}
                        </span>
                      </div>
                      <div className="dv2-gps-tile">
                        <span className="dv2-gps-tile-label">SEDE</span>
                        <span className="dv2-gps-tile-value">{trackingRecorrido?.sede?.nombre || jornadaDetalle?.sede || 'Asignada'}</span>
                      </div>
                      {trackingRecorrido?.resumen?.primera_ubicacion && (
                        <div className="dv2-gps-tile">
                          <span className="dv2-gps-tile-label">PRIMERA UBICACION</span>
                          <span className="dv2-gps-tile-value">
                            {formatTime(trackingRecorrido.resumen.primera_ubicacion.fecha_hora)}
                            <span className="dv2-gps-coords">({trackingRecorrido.resumen.primera_ubicacion.latitud.toFixed(5)}, {trackingRecorrido.resumen.primera_ubicacion.longitud.toFixed(5)})</span>
                          </span>
                        </div>
                      )}
                      {trackingRecorrido?.resumen?.ultima_ubicacion && (
                        <div className="dv2-gps-tile">
                          <span className="dv2-gps-tile-label">ULTIMA UBICACION</span>
                          <span className="dv2-gps-tile-value">
                            {formatTime(trackingRecorrido.resumen.ultima_ubicacion.fecha_hora)}
                            <span className="dv2-gps-coords">({trackingRecorrido.resumen.ultima_ubicacion.latitud.toFixed(5)}, {trackingRecorrido.resumen.ultima_ubicacion.longitud.toFixed(5)})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
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
