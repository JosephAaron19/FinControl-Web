import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  X,
  MapPin,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Clock,
  AlertTriangle,
  Building,
  Info,
  ArrowRight,
  User,
  Search,
  Filter,
  ChevronDown,
  ArrowLeftRight,
  Sun,
  Moon,
  Lock,
  MoreVertical,
  Check,
  UserPlus,
  LogIn,
  LogOut,
  FileText
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './GestionJornada.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getAvatarTheme = (name) => {
  const colors = [
    { bg: '#dcfce7', text: '#15803d' }, // Green (PA style)
    { bg: '#f3e8ff', text: '#7e22ce' }, // Purple (CB style)
    { bg: '#ffe4e6', text: '#be123c' }, // Rose
    { bg: '#fff7ed', text: '#ea580c' }, // Orange (JM style)
    { bg: '#e0f2fe', text: '#0284c7' }, // Sky/Blue
    { bg: '#ecfeff', text: '#0891b2' }  // Cyan
  ];
  let sum = 0;
  if (name) {
    sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }
  return colors[sum % colors.length];
};

const GestionJornada = () => {
  const navigate = useNavigate();
  const { showNotification, showConfirm } = useNotification();

  // Level 1 vs Level 2 navigation
  const [selectedSede, setSelectedSede] = useState(null); // Sede object or null
  const [sedesResumen, setSedesResumen] = useState([]);
  const [loadingResumen, setLoadingResumen] = useState(true);
  const [sedeCentralSearchTerm, setSedeCentralSearchTerm] = useState('');
  const [expandedCentrales, setExpandedCentrales] = useState({});

  // Level 2 data
  const [activeTab, setActiveTab] = useState('horarios'); // 'horarios' | 'con_horario' | 'sin_horario' | 'intercambios'
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [usuariosSede, setUsuariosSede] = useState([]);
  const [usuariosConHorario, setUsuariosConHorario] = useState([]);
  const [usuariosSinHorario, setUsuariosSinHorario] = useState([]);
  const [intercambios, setIntercambios] = useState([]);

  // States for con_horario tab search and pagination
  const [conHorarioSearchTerm, setConHorarioSearchTerm] = useState('');
  const [conHorarioSelectedHorario, setConHorarioSelectedHorario] = useState('');
  const [conHorarioCurrentPage, setConHorarioCurrentPage] = useState(1);

  // States for intercambios tab search, filter and pagination
  const [intercambioSearchTerm, setIntercambioSearchTerm] = useState('');
  const [intercambioSelectedEstado, setIntercambioSelectedEstado] = useState('');
  const [intercambioCurrentPage, setIntercambioCurrentPage] = useState(1);

  // States for sin_horario tab banner dismissal
  const [showSinHorarioBanner, setShowSinHorarioBanner] = useState(true);

  // Modals state
  const [isHorarioModalOpen, setIsHorarioModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  // Current items for editing
  const [currentHorario, setCurrentHorario] = useState(null);

  // Dynamic simplified schedule states
  const [isCustomSchedule, setIsCustomSchedule] = useState(false);
  const [globalTimes, setGlobalTimes] = useState({
    hora_inicio_entrada: '08:00:00',
    hora_fin_entrada: '09:00:00',
    hora_inicio_salida: '17:00:00',
    hora_fin_salida: '19:00:00'
  });

  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Form states
  const [horarioForm, setHorarioForm] = useState({
    nombre: '',
    descripcion: '',
    detalles: [
      { dia_semana: 'lunes', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
      { dia_semana: 'martes', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
      { dia_semana: 'miercoles', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
      { dia_semana: 'jueves', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
      { dia_semana: 'viernes', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
      { dia_semana: 'sabado', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '13:00:00', hora_fin_salida: '15:00:00' },
      { dia_semana: 'domingo', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '13:00:00', hora_fin_salida: '15:00:00' }
    ],
    usuarios_asignados: [],
    vigente_desde: getLocalDateString(),
    vigente_hasta: ''
  });

  const [assignForm, setAssignForm] = useState({
    usuarios: [], // supports multi-assign
    horario: '',
    vigente_desde: getLocalDateString(),
    vigente_hasta: '',
    observacion: ''
  });

  const [swapForm, setSwapForm] = useState({
    usuario_solicitante: '',
    usuario_reemplazo: '',
    fecha_intercambio: getLocalDateString(),
    motivo: '',
    observacion: ''
  });

  const getUserAssignedSchedule = (userId) => {
    if (!userId) return null;

    // Find active assignment for this user (independent of date)
    const assignment = usuariosConHorario.find(uh => uh.usuario === parseInt(userId) && uh.activo);
    if (!assignment) return null;

    // Find the schedule definition
    const horario = horarios.find(h => h.id === assignment.horario);
    if (!horario || !horario.activo) return null;

    // Find the first active day detail to get the hours
    const firstActiveDetail = horario.detalles?.find(d => d.activo);
    if (!firstActiveDetail) return null;

    return {
      horario,
      detail: firstActiveDetail
    };
  };

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return h * 60 + m;
  };

  // Dropdown states for Asignar Horario modal
  const [isHorarioDropdownOpen, setIsHorarioDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSearchDropdownTerm, setUserSearchDropdownTerm] = useState('');

  // Refs for click outside detection
  const horarioDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Click outside hook
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (horarioDropdownRef.current && !horarioDropdownRef.current.contains(event.target)) {
        setIsHorarioDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch Level 1 Resumen
  const fetchSedesResumen = async () => {
    setLoadingResumen(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/gestion-jornada/sedes-agrupadas/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedesResumen(data);
        
        // Expand all by default
        const initialExpanded = {};
        data.forEach(c => {
          initialExpanded[c.id || 'sin_asignar'] = true;
        });
        setExpandedCentrales(initialExpanded);
      } else {
        showNotification('Error al cargar resumen de sedes', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error de conexión con el servidor', 'error');
    } finally {
      setLoadingResumen(false);
    }
  };

  useEffect(() => {
    fetchSedesResumen();
  }, [navigate]);

  // Fetch Level 2 Detail on Sede select
  const fetchSedeDetailData = async (sedeId) => {
    setLoadingDetail(true);
    const token = localStorage.getItem('access_token');
    try {
      // 1. Fetch Horarios
      const resH = await fetch(`${API_URL}/horarios/?sede=${sedeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataH = resH.ok ? await resH.json() : [];

      // 2. Fetch UsuarioHorarios
      const resUH = await fetch(`${API_URL}/usuario-horarios/?sede=${sedeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataUH = resUH.ok ? await resUH.json() : [];

      // 3. Fetch Users (only operators/asesores of this Sede)
      const resU = await fetch(`${API_URL}/usuarios/?sede=${sedeId}&solo_operadores=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataU = resU.ok ? await resU.json() : [];
      const filteredUsers = (dataU || []).filter(u => {
        const rolName = (u.rol_info?.nombre || u.rol?.nombre || u.cargo || '').toLowerCase();
        return rolName.includes('operador') || rolName.includes('asesor');
      });

      // 4. Fetch Intercambios
      const resI = await fetch(`${API_URL}/intercambios/?sede=${sedeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataI = resI.ok ? await resI.json() : [];

      setHorarios(dataH || []);
      setUsuariosSede(filteredUsers);
      setUsuariosConHorario(dataUH || []);
      setIntercambios(dataI || []);

      // Calculate users without schedule dynamically from fetched assignments
      const conHorarioIds = new Set(dataUH.map(uh => uh.usuario));
      const sinHorario = filteredUsers.filter(u => !conHorarioIds.has(u.id));
      setUsuariosSinHorario(sinHorario);

    } catch (err) {
      console.error(err);
      showNotification('Error al cargar datos detallados de la sede', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectSede = (sede) => {
    setSelectedSede(sede);
    setActiveTab('horarios');
    fetchSedeDetailData(sede.sede_id);
  };

  const handleBackToSedes = () => {
    setSelectedSede(null);
    fetchSedesResumen();
  };

  // --- HORARIO MODAL ACTIONS ---
  const handleOpenHorarioModal = (horario = null) => {
    setUserSearchTerm('');
    if (horario) {
      setCurrentHorario(horario);

      // Load details for days of week
      const mappedDetalles = [
        { dia_semana: 'lunes', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
        { dia_semana: 'martes', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
        { dia_semana: 'miercoles', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
        { dia_semana: 'jueves', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
        { dia_semana: 'viernes', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
        { dia_semana: 'sabado', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '13:00:00', hora_fin_salida: '15:00:00' },
        { dia_semana: 'domingo', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '13:00:00', hora_fin_salida: '15:00:00' }
      ];

      let firstActive = null;
      let hasDifferentTimes = false;

      if (horario.detalles) {
        horario.detalles.forEach(d => {
          const match = mappedDetalles.find(md => md.dia_semana === d.dia_semana.toLowerCase());
          if (match) {
            match.activo = true;
            match.hora_inicio_entrada = d.hora_inicio_entrada;
            match.hora_fin_entrada = d.hora_fin_entrada;
            match.hora_inicio_salida = d.hora_inicio_salida;
            match.hora_fin_salida = d.hora_fin_salida;

            if (!firstActive) {
              firstActive = d;
            } else {
              if (
                firstActive.hora_inicio_entrada !== d.hora_inicio_entrada ||
                firstActive.hora_fin_entrada !== d.hora_fin_entrada ||
                firstActive.hora_inicio_salida !== d.hora_inicio_salida ||
                firstActive.hora_fin_salida !== d.hora_fin_salida
              ) {
                hasDifferentTimes = true;
              }
            }
          }
        });
      }

      setIsCustomSchedule(horario.tipo_configuracion === 'personalizado_por_dias' || hasDifferentTimes);
      if (firstActive) {
        setGlobalTimes({
          hora_inicio_entrada: firstActive.hora_inicio_entrada,
          hora_fin_entrada: firstActive.hora_fin_entrada,
          hora_inicio_salida: firstActive.hora_inicio_salida,
          hora_fin_salida: firstActive.hora_fin_salida
        });
      }

      // Find currently assigned active users for this schedule
      const assignedUH = usuariosConHorario.filter(uh => uh.horario === horario.id && uh.activo);
      const assignedUserIds = assignedUH.map(uh => uh.usuario);
      const firstUH = assignedUH[0];
      const vigenteDesdeVal = firstUH ? firstUH.vigente_desde : getLocalDateString();
      const vigenteHastaVal = firstUH ? (firstUH.vigente_hasta || '') : '';

      setHorarioForm({
        nombre: horario.nombre,
        descripcion: horario.descripcion || '',
        detalles: mappedDetalles,
        usuarios_asignados: assignedUserIds,
        vigente_desde: vigenteDesdeVal,
        vigente_hasta: vigenteHastaVal
      });
    } else {
      setCurrentHorario(null);
      setIsCustomSchedule(false);
      setGlobalTimes({
        hora_inicio_entrada: '08:00:00',
        hora_fin_entrada: '09:00:00',
        hora_inicio_salida: '17:00:00',
        hora_fin_salida: '19:00:00'
      });
      setHorarioForm({
        nombre: '',
        descripcion: '',
        detalles: [
          { dia_semana: 'lunes', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
          { dia_semana: 'martes', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
          { dia_semana: 'miercoles', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
          { dia_semana: 'jueves', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
          { dia_semana: 'viernes', activo: true, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '17:00:00', hora_fin_salida: '19:00:00' },
          { dia_semana: 'sabado', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '13:00:00', hora_fin_salida: '15:00:00' },
          { dia_semana: 'domingo', activo: false, hora_inicio_entrada: '08:00:00', hora_fin_entrada: '09:00:00', hora_inicio_salida: '13:00:00', hora_fin_salida: '15:00:00' }
        ],
        usuarios_asignados: [],
        vigente_desde: getLocalDateString(),
        vigente_hasta: ''
      });
    }
    setIsHorarioModalOpen(true);
  };

  const handleDayToggle = (index) => {
    setHorarioForm(prev => {
      const updated = prev.detalles.map((d, i) => {
        if (i === index) {
          const newDay = { ...d, activo: !d.activo };
          if (!isCustomSchedule && newDay.activo) {
            newDay.hora_inicio_entrada = globalTimes.hora_inicio_entrada;
            newDay.hora_fin_entrada = globalTimes.hora_fin_entrada;
            newDay.hora_inicio_salida = globalTimes.hora_inicio_salida;
            newDay.hora_fin_salida = globalTimes.hora_fin_salida;
          }
          return newDay;
        }
        return d;
      });
      return { ...prev, detalles: updated };
    });
  };

  const handleTimeChange = (index, field, value) => {
    setHorarioForm(prev => {
      const updated = prev.detalles.map((d, i) => {
        if (i === index) {
          return { ...d, [field]: value };
        }
        return d;
      });
      return { ...prev, detalles: updated };
    });
  };

  const handleToggleUserSelect = (uId) => {
    setHorarioForm(prev => {
      const isSelected = prev.usuarios_asignados.includes(uId);
      const newUsers = isSelected
        ? prev.usuarios_asignados.filter(id => id !== uId)
        : [...prev.usuarios_asignados, uId];
      return { ...prev, usuarios_asignados: newUsers };
    });
  };

  const handleSaveHorario = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    // Check if at least one day is active
    const activeDays = horarioForm.detalles.filter(d => d.activo);
    if (activeDays.length === 0) {
      showNotification('Debes configurar y activar al menos un día en el horario.', 'warning');
      return;
    }

    let payload = {};
    if (!isCustomSchedule) {
      // General Único Mode
      payload = {
        modo: 'general_unico',
        sede_id: selectedSede.sede_id,
        nombre: horarioForm.nombre,
        descripcion: horarioForm.descripcion,
        dias: activeDays.map(d => d.dia_semana),
        hora_inicio_entrada: globalTimes.hora_inicio_entrada,
        hora_fin_entrada: globalTimes.hora_fin_entrada,
        hora_inicio_salida: globalTimes.hora_inicio_salida,
        hora_fin_salida: globalTimes.hora_fin_salida
      };
    } else {
      // Personalizado por Días Mode
      payload = {
        modo: 'personalizado_por_dias',
        sede_id: selectedSede.sede_id,
        nombre: horarioForm.nombre,
        descripcion: horarioForm.descripcion,
        dias: activeDays.map(d => ({
          dia_semana: d.dia_semana,
          hora_inicio_entrada: d.hora_inicio_entrada,
          hora_fin_entrada: d.hora_fin_entrada,
          hora_inicio_salida: d.hora_inicio_salida,
          hora_fin_salida: d.hora_fin_salida
        }))
      };
    }

    payload.usuarios_ids = horarioForm.usuarios_asignados;
    if (horarioForm.usuarios_asignados.length > 0) {
      payload.vigente_desde = horarioForm.vigente_desde;
      payload.vigente_hasta = horarioForm.vigente_hasta || null;
    }

    try {
      let res;
      if (currentHorario) {
        // Edit Mode
        res = await fetch(`${API_URL}/horarios/${currentHorario.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create Mode
        res = await fetch(`${API_URL}/horarios/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showNotification(currentHorario ? 'Horario actualizado exitosamente.' : 'Horario creado y configurado exitosamente.', 'success');
        setIsHorarioModalOpen(false);
        fetchSedeDetailData(selectedSede.sede_id);
        if (!currentHorario && horarioForm.usuarios_asignados && horarioForm.usuarios_asignados.length > 0) {
          setActiveTab('con_horario');
          setConHorarioSearchTerm('');
          setConHorarioSelectedHorario('');
          setConHorarioCurrentPage(1);
        }
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'No se pudo guardar la configuración de horario.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error al comunicarse con el servidor', 'error');
    }
  };

  const handleDeleteHorario = async (id) => {
    if (!await showConfirm('Eliminar Horario', '¿Desea desactivar y eliminar este horario? Esto afectará a todos los operarios asignados.', 'danger')) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/horarios/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification('Horario eliminado correctamente.', 'success');
        fetchSedeDetailData(selectedSede.sede_id);
      } else {
        showNotification('Error al eliminar horario', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error de conexión', 'error');
    }
  };

  // --- ASIGNAR HORARIO ACTIONS ---
  const getHorarioSummary = (h) => {
    if (!h || !h.detalles || h.detalles.length === 0) return 'Sin detalles';
    const activeDays = h.detalles.filter(d => d.activo);
    if (activeDays.length === 0) return 'Sin días activos';

    const dayAbbrs = {
      lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue',
      viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom'
    };

    const dayNames = activeDays.map(d => dayAbbrs[d.dia_semana.toLowerCase()] || d.dia_semana);
    const daysStr = dayNames.join(', ');

    const firstDay = activeDays[0];
    const startEntrada = firstDay.hora_inicio_entrada?.substring(0, 5) || '00:00';
    const endEntrada = firstDay.hora_fin_entrada?.substring(0, 5) || '00:00';
    const startSalida = firstDay.hora_inicio_salida?.substring(0, 5) || '00:00';
    const endSalida = firstDay.hora_fin_salida?.substring(0, 5) || '00:00';

    return `${daysStr} · Entrada ${startEntrada}-${endEntrada} · Salida ${startSalida}-${endSalida}`;
  };

  const checkScheduleConflict = (uId, proposedHorarioId, proposedDesde, proposedHasta) => {
    if (!proposedHorarioId || !proposedDesde) return null;

    const newHorario = horarios.find(h => h.id === parseInt(proposedHorarioId));
    if (!newHorario || !newHorario.detalles) return null;

    const newActiveDays = new Set(
      newHorario.detalles.filter(d => d.activo).map(d => d.dia_semana.toLowerCase())
    );

    const nS = new Date(proposedDesde + 'T00:00:00');
    const nE = proposedHasta ? new Date(proposedHasta + 'T00:00:00') : null;

    const userAssignments = usuariosConHorario.filter(uh => uh.usuario === uId);

    for (const assignment of userAssignments) {
      const aS = new Date(assignment.vigente_desde + 'T00:00:00');
      const aE = assignment.vigente_hasta ? new Date(assignment.vigente_hasta + 'T00:00:00') : null;

      const datesOverlap = (!nE || aS <= nE) && (!aE || nS <= aE);

      if (datesOverlap) {
        const existingHorario = horarios.find(h => h.id === assignment.horario);
        if (existingHorario && existingHorario.detalles) {
          const existingActiveDays = existingHorario.detalles
            .filter(d => d.activo)
            .map(d => d.dia_semana.toLowerCase());

          const commonDays = existingActiveDays.filter(day => newActiveDays.has(day));
          if (commonDays.length > 0) {
            return {
              assignment,
              horario: existingHorario,
              commonDays
            };
          }
        }
      }
    }
    return null;
  };

  const handleOpenAssignModal = (quickUser = null) => {
    setAssignForm({
      usuarios: quickUser ? [quickUser.id] : [],
      horario: '',
      vigente_desde: getLocalDateString(),
      vigente_hasta: '',
      observacion: ''
    });
    setIsHorarioDropdownOpen(false);
    setIsUserDropdownOpen(false);
    setUserSearchDropdownTerm('');
    setIsAssignModalOpen(true);
  };

  const handleToggleAssignUser = (uId) => {
    setAssignForm(prev => {
      const isSelected = prev.usuarios.includes(uId);
      const newU = isSelected ? prev.usuarios.filter(id => id !== uId) : [...prev.usuarios, uId];
      return { ...prev, usuarios: newU };
    });
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (assignForm.usuarios.length === 0) {
      showNotification('Selecciona al menos un usuario para asignar.', 'warning');
      return;
    }
    if (!assignForm.horario) {
      showNotification('Selecciona un horario.', 'warning');
      return;
    }

    // Date range validation
    if (assignForm.vigente_hasta && assignForm.vigente_desde > assignForm.vigente_hasta) {
      showNotification('La fecha "Vigente Hasta" no puede ser anterior a "Vigente Desde".', 'warning');
      return;
    }

    // Conflict validation
    const conflictingUsers = [];
    const nonConflictingUsers = [];

    for (const uId of assignForm.usuarios) {
      const conflict = checkScheduleConflict(
        uId,
        assignForm.horario,
        assignForm.vigente_desde,
        assignForm.vigente_hasta
      );

      if (conflict) {
        const userObj = usuariosSede.find(u => u.id === uId);
        conflictingUsers.push({
          user: userObj,
          conflict
        });
      } else {
        nonConflictingUsers.push(uId);
      }
    }

    let usersToAssign = [...assignForm.usuarios];

    if (conflictingUsers.length > 0) {
      const conflictMessages = conflictingUsers.map(item => {
        return `- ${item.user.nombre_completo} (tiene turno cruzado '${item.conflict.horario.nombre}')`;
      }).join('\n');

      if (nonConflictingUsers.length === 0) {
        // All selected users have conflicts
        showNotification(
          `No se puede realizar la asignación. Los usuarios seleccionados presentan conflictos de horario:\n${conflictMessages}`,
          'error'
        );
        return;
      }

      // Some users have conflicts, some don't. Ask if we want to proceed.
      const confirmProceed = await showConfirm(
        'Conflictos de Horario Detectados',
        `Los siguientes usuarios ya tienen un turno asignado en ese rango:\n${conflictMessages}\n\n¿Desea continuar la asignación excluyendo a los usuarios con conflicto?`,
        'warning'
      );

      if (!confirmProceed) {
        return; // Stop assignment
      }

      usersToAssign = nonConflictingUsers;
    }

    const token = localStorage.getItem('access_token');
    try {
      const promises = usersToAssign.map(async (uId) => {
        try {
          const res = await fetch(`${API_URL}/usuario-horarios/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              usuario: uId,
              horario: assignForm.horario,
              vigente_desde: assignForm.vigente_desde,
              vigente_hasta: assignForm.vigente_hasta || null,
              observacion: assignForm.observacion
            })
          });
          const isOk = res.ok;
          let errMsg = null;
          if (!isOk) {
            try {
              const data = await res.json();
              errMsg = data.error || `Error ${res.status}`;
            } catch (e) {
              errMsg = `Error ${res.status}`;
            }
          }
          return { uId, ok: isOk, error: errMsg };
        } catch (err) {
          return { uId, ok: false, error: err.message || 'Error de conexión' };
        }
      });

      const results = await Promise.all(promises);
      const successfulIds = results.filter(r => r.ok).map(r => r.uId);
      const failedResults = results.filter(r => !r.ok);

      if (successfulIds.length > 0) {
        // Refresh the detail data immediately to update the lists
        await fetchSedeDetailData(selectedSede.sede_id);

        // Remove successful users from the modal form selection
        setAssignForm(prev => ({
          ...prev,
          usuarios: prev.usuarios.filter(id => !successfulIds.includes(id))
        }));
      }

      if (failedResults.length === 0) {
        showNotification('Horarios asignados correctamente.', 'success');
        setIsAssignModalOpen(false);
        // Switch to "Usuarios con horario" tab and clear filters to instantly see the changes
        setActiveTab('con_horario');
        setConHorarioSearchTerm('');
        setConHorarioSelectedHorario('');
        setConHorarioCurrentPage(1);
      } else {
        const errorMessages = Array.from(new Set(failedResults.map(r => r.error)));
        const userNames = failedResults.map(r => {
          const u = usuariosSede.find(us => us.id === r.uId);
          return u ? u.nombre_completo : `Usuario #${r.uId}`;
        }).join(', ');

        if (successfulIds.length > 0) {
          showNotification(
            `Asignación parcial realizada. Se asignó a ${successfulIds.length} usuario(s). Falló para: ${userNames}. Detalle: ${errorMessages.join(' | ')}`,
            'warning'
          );
          setIsAssignModalOpen(false);
          setActiveTab('con_horario');
          setConHorarioSearchTerm('');
          setConHorarioSelectedHorario('');
          setConHorarioCurrentPage(1);
        } else {
          showNotification(
            `No se pudo realizar la asignación. Falló para: ${userNames}. Detalle: ${errorMessages.join(' | ')}`,
            'error'
          );
        }
      }
    } catch (err) {
      console.error(err);
      showNotification('Error al crear asignaciones.', 'error');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!await showConfirm('Desactivar Asignación', '¿Desactivar la asignación de horario para este usuario?', 'danger')) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/usuario-horarios/${assignmentId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification('Horario removido exitosamente del usuario.', 'success');
        // Refresh the detail data immediately to update the lists
        await fetchSedeDetailData(selectedSede.sede_id);
        // Switch to "Usuarios sin horario" tab and clear filters to instantly see the changes
        setActiveTab('sin_horario');
        setShowSinHorarioBanner(true);
      } else {
        showNotification('Error al remover el horario.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error de conexión.', 'error');
    }
  };

  // --- INTERCAMBIO ACTIONS ---
  const handleOpenSwapModal = () => {
    setSwapForm({
      usuario_solicitante: '',
      usuario_reemplazo: '',
      fecha_intercambio: getLocalDateString(),
      motivo: '',
      observacion: ''
    });
    setIsSwapModalOpen(true);
  };

  const handleSaveSwap = async (e) => {
    e.preventDefault();
    if (!swapForm.usuario_solicitante || !swapForm.usuario_reemplazo) {
      showNotification('Debe seleccionar ambos usuarios.', 'warning');
      return;
    }
    if (swapForm.usuario_solicitante === swapForm.usuario_reemplazo) {
      showNotification('El solicitante y el reemplazo deben ser usuarios diferentes.', 'warning');
      return;
    }
    if (!swapForm.fecha_intercambio) {
      showNotification('La fecha de intercambio es requerida.', 'warning');
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/intercambios/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(swapForm)
      });

      if (res.ok) {
        showNotification('Intercambio temporal de turnos aprobado y registrado con éxito.', 'success');
        setIsSwapModalOpen(false);
        fetchSedeDetailData(selectedSede.sede_id);
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'No se pudo registrar el intercambio.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error al registrar intercambio.', 'error');
    }
  };

  const handleDeleteSwap = async (id) => {
    if (!await showConfirm('Anular Intercambio', '¿Eliminar y anular este intercambio de turnos?', 'danger')) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/intercambios/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification('Intercambio anulado exitosamente.', 'success');
        fetchSedeDetailData(selectedSede.sede_id);
      } else {
        showNotification('Error al anular intercambio.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error de conexión.', 'error');
    }
  };

  // Calculations for con_horario tab (KPIs and Filters)
  const pctConHorario = usuariosSede.length > 0 ? Math.round((usuariosConHorario.length / usuariosSede.length) * 100) : 0;

  const vigentesEstaSemana = usuariosConHorario.filter(uh => {
    if (!uh.vigente_hasta) return true;
    const hastaDate = new Date(uh.vigente_hasta);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return hastaDate >= today;
  }).length;

  const pctVigentes = usuariosConHorario.length > 0 ? Math.round((vigentesEstaSemana / usuariosConHorario.length) * 100) : 0;

  const proximosVencimientos = usuariosConHorario.filter(uh => {
    if (!uh.vigente_hasta) return false;
    const hasta = new Date(uh.vigente_hasta);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = hasta - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  return (
    <MainLayout
      title="Gestión de Horarios y Jornadas"
      subtitle={selectedSede
        ? `Sede: ${selectedSede.sede_nombre} - Planificación de turnos personalizados, descansos e intercambios temporales.`
        : "Planificación de turnos e intercambios con control estricto por sede."
      }
    >
      {!selectedSede ? (
        // ================= LEVEL 1: SEDES GRID =================
        <div className="sedes-overview">
          <div className="panel-header-box mb-6">
            <div className="panel-header-icon-container">
              <Building size={22} />
            </div>
            <h2>Panel General por Sedes Centrales</h2>
          </div>

          <div className="panel-info-banner mb-6">
            <Info size={16} className="info-icon" />
            <span>Selecciona una sede central y luego una sede operativa para gestionar horarios, jornadas y asignaciones.</span>
          </div>

          <div className="relative mb-8 max-w-lg">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar sede central u operativa..."
              value={sedeCentralSearchTerm}
              onChange={(e) => setSedeCentralSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-50 transition"
            />
          </div>

          {loadingResumen ? (
            <div className="loading-state-card">
              <RefreshCw className="animate-spin" size={36} />
              <p>Cargando información resumen de sedes...</p>
            </div>
          ) : sedesResumen.length === 0 ? (
            <div className="empty-state-g">
              <CalendarRange size={56} className="empty-icon" />
              <p>No tienes sedes asignadas o creadas para configurar.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {sedesResumen.map(central => {
                // Filtro: buscar en central o en sus sedes
                const search = sedeCentralSearchTerm.toLowerCase();
                const matchesCentral = central.nombre?.toLowerCase().includes(search);
                const sedesFiltradas = central.sedes?.filter(s => 
                  s.sede_nombre?.toLowerCase().includes(search) || 
                  s.direccion?.toLowerCase().includes(search)
                ) || [];
                
                if (search && !matchesCentral && sedesFiltradas.length === 0) {
                  return null; // Ocultar si no coincide ni la central ni sus sedes
                }
                
                const sedesAMostrar = search && !matchesCentral ? sedesFiltradas : central.sedes;
                const centralIdKey = central.id || 'sin_asignar';
                const isExpanded = expandedCentrales[centralIdKey];

                return (
                  <div key={centralIdKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Cabecera de la Sede Central */}
                    <div 
                      className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                      onClick={() => setExpandedCentrales(prev => ({ ...prev, [centralIdKey]: !isExpanded }))}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${central.id ? 'bg-[#ebf5ff] text-[#2563eb]' : 'bg-slate-100 text-slate-500'}`}>
                          <Building size={22} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800">{central.nombre}</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{central.total_sedes} sedes operativas</span>
                            {central.id && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${central.estado ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {central.estado ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-400 p-2 rounded-lg hover:bg-slate-100 transition">
                        {isExpanded ? <ChevronDown size={20} className="transform rotate-180 transition-transform" /> : <ChevronDown size={20} className="transition-transform" />}
                      </div>
                    </div>

                    {/* Lista de Sedes Operativas */}
                    {isExpanded && (
                      <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                        {sedesAMostrar.length === 0 ? (
                          <div className="text-sm text-slate-500 text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
                            Esta sede central aún no tiene sedes operativas asociadas.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sedesAMostrar.map(sede => (
                              <div key={sede.sede_id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start gap-3 mb-4">
                                    <div className="mt-0.5 text-[#2563eb]">
                                      <MapPin size={18} />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-slate-800 leading-tight" title={sede.sede_nombre}>{sede.sede_nombre}</h4>
                                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${sede.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {sede.activo ? 'ACTIVO' : 'INACTIVO'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mb-5">
                                    <div className="flex flex-col bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Personal</span>
                                      <span className="text-lg font-black text-slate-700">{sede.usuarios_con_horario + sede.usuarios_sin_horario}</span>
                                    </div>
                                    <div className="flex flex-col bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Horarios</span>
                                      <span className="text-lg font-black text-slate-700">{sede.horarios_creados}</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  className="w-full py-2.5 bg-white border-2 border-[#2563eb] text-[#2563eb] text-xs font-bold rounded-xl hover:bg-[#2563eb] hover:text-white transition-colors flex items-center justify-center gap-2"
                                  onClick={() => handleSelectSede(sede)}
                                >
                                  Gestionar
                                  <ArrowRight size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Mensaje de no resultados */}
              {sedesResumen.length > 0 && sedeCentralSearchTerm && !sedesResumen.some(central => {
                const search = sedeCentralSearchTerm.toLowerCase();
                const matchesCentral = central.nombre?.toLowerCase().includes(search);
                const sedesFiltradas = central.sedes?.filter(s => s.sede_nombre?.toLowerCase().includes(search) || s.direccion?.toLowerCase().includes(search)) || [];
                return matchesCentral || sedesFiltradas.length > 0;
              }) && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Search size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No se encontraron sedes relacionadas con "{sedeCentralSearchTerm}".</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // ================= LEVEL 2: DETAILED SEDE VIEW =================
        <div className="sede-detailed-panel">
          {/* Header Action Row */}
          <div className="detailed-header">
            <button className="btn-back-link" onClick={handleBackToSedes}>
              <ChevronLeft size={18} />
              Volver a Sedes
            </button>
            <div className="detailed-actions-group">
              <button className="btn btn-secondary" onClick={handleOpenSwapModal}>
                <RefreshCw size={16} />
                Intercambio Temporal
              </button>
              <button className="btn btn-secondary" onClick={() => handleOpenAssignModal()}>
                <Users size={16} />
                Asignar Horario
              </button>
              <button className="btn btn-primary" onClick={() => handleOpenHorarioModal()}>
                <Plus size={16} />
                Crear Horario
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'horarios' ? 'active' : ''}`}
              onClick={() => setActiveTab('horarios')}
            >
              <Clock size={16} />
              Horarios creados ({horarios.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'con_horario' ? 'active' : ''}`}
              onClick={() => setActiveTab('con_horario')}
            >
              <UserCheck size={16} />
              Usuarios con horario ({usuariosConHorario.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'sin_horario' ? 'active' : ''}`}
              onClick={() => setActiveTab('sin_horario')}
            >
              <UserX size={16} />
              Usuarios sin horario ({usuariosSinHorario.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'intercambios' ? 'active' : ''}`}
              onClick={() => setActiveTab('intercambios')}
            >
              <CalendarRange size={16} />
              Intercambios registrados ({intercambios.length})
            </button>
          </div>

          {/* Loading details */}
          {loadingDetail ? (
            <div className="loading-state-details">
              <RefreshCw className="animate-spin" size={32} />
              <p>Actualizando planilla de turnos...</p>
            </div>
          ) : (
            <div className="tab-content-wrapper">

              {/* --- TAB 1: HORARIOS CREADOS --- */}
              {activeTab === 'horarios' && (
                <div className="horarios-tab-p">
                  {horarios.length === 0 ? (
                    <div className="empty-state-tab">
                      <Clock size={48} className="empty-icon-tab" />
                      <h3>No hay horarios creados</h3>
                      <p>Crea un horario detallado o flexible para esta sede y asígnalo masivamente.</p>
                      <button className="btn btn-primary mt-4" onClick={() => handleOpenHorarioModal()}>
                        Crear Primer Horario
                      </button>
                    </div>
                  ) : (
                    <div className="horarios-container-grid-p">
                      <div className="horarios-cards-grid-p">
                        {horarios.map(h => {
                          // Filter details to active days
                          const activeDetails = h.detalles ? h.detalles.filter(d => d.activo) : [];

                          // Day name translation map for abbreviation
                          const dayAbbrMap = {
                            'lunes': 'Lun',
                            'martes': 'Mar',
                            'miercoles': 'Mié',
                            'jueves': 'Jue',
                            'viernes': 'Vie',
                            'sabado': 'Sáb',
                            'domingo': 'Dom'
                          };

                          // Sort active details in standard weekday order
                          const weekdayOrder = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
                          const sortedDetails = [...activeDetails].sort((a, b) => {
                            return weekdayOrder.indexOf(a.dia_semana.toLowerCase()) - weekdayOrder.indexOf(b.dia_semana.toLowerCase());
                          });

                          // Extract first active day ranges for summary display
                          const firstActive = sortedDetails[0];
                          const entradaRange = firstActive
                            ? `${firstActive.hora_inicio_entrada.substring(0, 5)} - ${firstActive.hora_fin_entrada.substring(0, 5)}`
                            : '00:00 - 00:00';
                          const salidaRange = firstActive
                            ? `${firstActive.hora_inicio_salida.substring(0, 5)} - ${firstActive.hora_fin_salida.substring(0, 5)}`
                            : '00:00 - 00:00';

                          // Dynamic theme icon selection based on name
                          const lowercaseName = h.nombre.toLowerCase();
                          let iconThemeClass = 'default';
                          let IconComponent = Clock;

                          if (lowercaseName.includes('mañana') || lowercaseName.includes('dia') || lowercaseName.includes('día')) {
                            iconThemeClass = 'morning';
                            IconComponent = Sun;
                          } else if (lowercaseName.includes('tarde') || lowercaseName.includes('noche') || lowercaseName.includes('vespertino')) {
                            iconThemeClass = 'evening';
                            IconComponent = Moon;
                          }

                          // Calculate assigned users statistics dynamically
                          const assignedUH = usuariosConHorario.filter(uh => uh.horario === h.id);
                          const assignedUsers = assignedUH.map(uh => usuariosSede.find(u => u.id === uh.usuario)).filter(Boolean);
                          const userCount = assignedUsers.length;
                          const rolesList = Array.from(new Set(assignedUsers.map(u => u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador')));
                          const rolesStr = rolesList.length > 0 ? rolesList.join(', ') : 'Sin personal asignado';

                          return (
                            <div key={h.id} className="horario-card-premium-p">
                              {/* Header: Icon, Status, Actions */}
                              <div className="horario-card-top-p">
                                <div className={`schedule-icon-circle-p ${iconThemeClass}`}>
                                  <IconComponent size={20} />
                                </div>
                                <div className="horario-card-top-right-p">
                                  <div className="schedule-actions-p">
                                    <button
                                      className="btn-schedule-edit-p"
                                      onClick={() => handleOpenHorarioModal(h)}
                                      title="Editar Horario"
                                      type="button"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      className="btn-schedule-delete-p"
                                      onClick={() => handleDeleteHorario(h.id)}
                                      title="Eliminar Horario"
                                      type="button"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Title & Description */}
                              <div className="horario-card-info-p">
                                <h4>{h.nombre}</h4>
                                <p className="horario-desc-p">{h.descripcion || 'Sin descripción'}</p>
                              </div>

                              {/* Configured Days pills */}
                              <div className="horario-days-section-p">
                                <span className="days-label-title-p">DÍAS CONFIGURADOS</span>
                                <div className="days-pills-row-p">
                                  {sortedDetails.map(d => (
                                    <span key={d.id} className="day-pill-p">
                                      {dayAbbrMap[d.dia_semana.toLowerCase()] || d.dia_semana.substring(0, 3)}
                                    </span>
                                  ))}
                                  {sortedDetails.length === 0 && (
                                    <span className="day-pill-empty-p">Ninguno</span>
                                  )}
                                </div>
                              </div>

                              {/* Time ranges panel */}
                              <div className="horario-ranges-panel-p">
                                <div className="range-box-column-p green">
                                  <span className="range-box-label-p">Entrada</span>
                                  <span className="range-box-value-p">{entradaRange}</span>
                                </div>
                                <div className="range-box-column-p orange">
                                  <span className="range-box-label-p">Salida</span>
                                  <span className="range-box-value-p">{salidaRange}</span>
                                </div>
                              </div>

                              {/* Footer: User count & Roles */}
                              <div className="horario-card-footer-p">
                                <Users size={16} className="footer-users-icon-p" />
                                <div className="footer-text-col-p">
                                  <span className="footer-count-text-p">
                                    {userCount} {userCount === 1 ? 'usuario asignado' : 'usuarios asignados'}
                                  </span>
                                  <span className="footer-roles-text-p">{rolesStr}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom "Crear nuevo horario" dotted card */}
                      <div
                        className="horario-create-dotted-card-p"
                        onClick={() => handleOpenHorarioModal()}
                      >
                        <div className="create-dotted-icon-p">
                          <Plus size={20} />
                        </div>
                        <div className="create-dotted-text-p">
                          <h5>Crear nuevo horario</h5>
                          <p>Define un nuevo horario y asígnalo a tu equipo.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 2: USUARIOS CON HORARIO --- */}
              {activeTab === 'con_horario' && (() => {
                // Filter the list
                const filteredUH = usuariosConHorario.filter(uh => {
                  const userDetail = usuariosSede.find(u => u.id === uh.usuario);
                  const name = userDetail?.nombre_completo || uh.usuario_nombre || '';
                  const email = userDetail?.email || '';
                  const matchesSearch = name.toLowerCase().includes(conHorarioSearchTerm.toLowerCase()) ||
                    email.toLowerCase().includes(conHorarioSearchTerm.toLowerCase());
                  const matchesHorario = conHorarioSelectedHorario === '' || uh.horario_nombre === conHorarioSelectedHorario;
                  return matchesSearch && matchesHorario;
                });

                // Unique schedule names for the dropdown
                const uniqueHorarioNames = Array.from(new Set(usuariosConHorario.map(uh => uh.horario_nombre).filter(Boolean)));

                // Pagination calculations
                const itemsPerPageConHorario = 5;
                const totalPagesConHorario = Math.ceil(filteredUH.length / itemsPerPageConHorario) || 1;
                const indexOfLastConHorario = conHorarioCurrentPage * itemsPerPageConHorario;
                const indexOfFirstConHorario = indexOfLastConHorario - itemsPerPageConHorario;
                const currentConHorarioList = filteredUH.slice(indexOfFirstConHorario, indexOfLastConHorario);

                return (
                  <div className="con-horarios-tab">
                    {/* KPI Row */}
                    <div className="con-horarios-kpis">
                      <div className="con-horario-kpi-card">
                        <div className="kpi-icon-bg success">
                          <Users size={20} />
                        </div>
                        <div className="kpi-content">
                          <span className="kpi-title">Asignaciones activas</span>
                          <div className="kpi-value-row">
                            <span className="kpi-value">{usuariosConHorario.length}</span>
                            <span className="kpi-badge success">{pctConHorario}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="con-horario-kpi-card">
                        <div className="kpi-icon-bg info">
                          <Calendar size={20} />
                        </div>
                        <div className="kpi-content">
                          <span className="kpi-title">Vigentes esta semana</span>
                          <div className="kpi-value-row">
                            <span className="kpi-value">{vigentesEstaSemana}</span>
                            <span className="kpi-badge info">{pctVigentes}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="con-horario-kpi-card">
                        <div className="kpi-icon-bg warning">
                          <Clock size={20} />
                        </div>
                        <div className="kpi-content">
                          <span className="kpi-title">Próximos vencimientos</span>
                          <div className="kpi-value-row">
                            <span className="kpi-value">{proximosVencimientos}</span>
                            <span className="kpi-badge warning">7 días</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main Grid Container Card */}
                    <div className="con-horarios-container-card">
                      {/* Filters Toolbar */}
                      <div className="con-horarios-toolbar">
                        <div className="toolbar-left">
                          <div className="toolbar-search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input
                              type="text"
                              placeholder="Buscar usuario..."
                              value={conHorarioSearchTerm}
                              onChange={(e) => {
                                setConHorarioSearchTerm(e.target.value);
                                setConHorarioCurrentPage(1);
                              }}
                              className="toolbar-search-input"
                            />
                          </div>
                          <div className="toolbar-select-wrapper">
                            <select
                              value={conHorarioSelectedHorario}
                              onChange={(e) => {
                                setConHorarioSelectedHorario(e.target.value);
                                setConHorarioCurrentPage(1);
                              }}
                              className="toolbar-select"
                            >
                              <option value="">Todos los horarios</option>
                              {uniqueHorarioNames.map((name, idx) => (
                                <option key={idx} value={name}>{name}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="select-chevron" />
                          </div>
                          <button className="btn-toolbar-filters" type="button">
                            <Filter size={14} />
                            <span>Filtros</span>
                          </button>
                        </div>
                        <div className="toolbar-right">
                          <span className="results-count">{filteredUH.length} resultados</span>
                          <button
                            className="btn-toolbar-refresh"
                            onClick={() => fetchSedeDetailData(selectedSede.sede_id)}
                            title="Actualizar datos"
                            type="button"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>

                      {filteredUH.length === 0 ? (
                        <div className="empty-state-tab">
                          <UserCheck size={48} className="empty-icon-tab" />
                          <h3>No se encontraron asignaciones</h3>
                          <p>Ajuste los filtros de búsqueda o asigne un nuevo horario.</p>
                        </div>
                      ) : (
                        <>
                          <div className="table-responsive-p">
                            <table className="data-table-p con-horario-table">
                              <thead>
                                <tr>
                                  <th>Usuario</th>
                                  <th>Rol</th>
                                  <th>Horario asignado</th>
                                  <th>
                                    <div className="header-sort-cell">
                                      <span>Vigente desde</span>
                                      <ChevronDown size={12} />
                                    </div>
                                  </th>
                                  <th>
                                    <div className="header-sort-cell">
                                      <span>Vigente hasta</span>
                                      <ChevronDown size={12} />
                                    </div>
                                  </th>
                                  <th>Observación</th>
                                  <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentConHorarioList.map(uh => {
                                  const userDetail = usuariosSede.find(u => u.id === uh.usuario);
                                  const uName = userDetail?.nombre_completo || uh.usuario_nombre || 'Usuario';
                                  const uEmail = userDetail?.email || 'sin-correo@dominio.com';
                                  const uRol = userDetail?.rol_info?.nombre || userDetail?.rol?.nombre || userDetail?.cargo || uh.usuario_rol || 'Operador';
                                  const avatarTheme = getAvatarTheme(uName);

                                  // Determine Schedule Color Theme dynamically
                                  const scheduleThemeClass =
                                    uh.horario_nombre?.toLowerCase().includes('mañana') ? 'theme-morning' :
                                      uh.horario_nombre?.toLowerCase().includes('tarde') ? 'theme-evening' : 'theme-default';

                                  return (
                                    <tr key={uh.id}>
                                      <td>
                                        <div className="user-profile-cell-p">
                                          <div
                                            className="user-avatar-circle-p"
                                            style={{
                                              backgroundColor: avatarTheme.bg,
                                              color: avatarTheme.text
                                            }}
                                          >
                                            {getInitials(uName)}
                                            <span className="status-dot-green"></span>
                                          </div>
                                          <div className="user-profile-text-p">
                                            <span className="user-name-value-p">{uName}</span>
                                            <span className="user-email-value-p">{uEmail}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <span className={`rol-badge-pill-p ${uRol.toLowerCase()}`}>
                                          {uRol}
                                        </span>
                                      </td>
                                      <td>
                                        <div className={`schedule-badge-pill-p ${scheduleThemeClass}`}>
                                          <Clock size={12} className="schedule-badge-icon" />
                                          <span>{uh.horario_nombre}</span>
                                        </div>
                                      </td>
                                      <td><span className="date-value-p">{uh.vigente_desde}</span></td>
                                      <td><span className="date-value-p">{uh.vigente_hasta || 'Indefinido'}</span></td>
                                      <td><span className="obs-value-p">{uh.observacion || '-'}</span></td>
                                      <td>
                                        <div className="action-buttons-cell-p">
                                          <button
                                            className="btn-action-swap-p"
                                            onClick={() => handleOpenSwapModal()}
                                            title="Intercambio Temporal"
                                            type="button"
                                          >
                                            <RefreshCw size={14} />
                                          </button>
                                          <button
                                            className="btn-action-delete-p"
                                            onClick={() => handleDeleteAssignment(uh.id)}
                                            title="Remover Horario"
                                            type="button"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Footer */}
                          <div className="table-pagination-footer-p">
                            <span className="pagination-legend-p">
                              Mostrando {indexOfFirstConHorario + 1} a {Math.min(indexOfLastConHorario, filteredUH.length)} de {filteredUH.length} resultados
                            </span>

                            <div className="pagination-buttons-p">
                              <button
                                className="btn-page-arrow-p"
                                onClick={() => setConHorarioCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={conHorarioCurrentPage === 1}
                                type="button"
                              >
                                <ChevronLeft size={14} />
                              </button>
                              {Array.from({ length: totalPagesConHorario }, (_, i) => i + 1).map(page => (
                                <button
                                  key={page}
                                  className={`btn-page-number-p ${conHorarioCurrentPage === page ? 'active' : ''}`}
                                  onClick={() => setConHorarioCurrentPage(page)}
                                  type="button"
                                >
                                  {page}
                                </button>
                              ))}
                              <button
                                className="btn-page-arrow-p"
                                onClick={() => setConHorarioCurrentPage(prev => Math.min(totalPagesConHorario, prev + 1))}
                                disabled={conHorarioCurrentPage === totalPagesConHorario}
                                type="button"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* --- TAB 3: USUARIOS SIN HORARIO --- */}
              {activeTab === 'sin_horario' && (() => {
                const getMockUpdateDate = (userId) => {
                  const day = (userId * 7) % 28 + 1;
                  const month = (userId * 3) % 12;
                  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
                  const year = 2026;
                  const hours = String((userId * 5) % 24).padStart(2, '0');
                  const minutes = String((userId * 11) % 60).padStart(2, '0');
                  return `${day} ${months[month]}. ${year} • ${hours}:${minutes}`;
                };

                return (
                  <div className="sin-horarios-tab-p">
                    {usuariosSinHorario.length === 0 ? (
                      <div className="empty-state-tab success-tab">
                        <UserCheck size={48} className="empty-icon-tab text-success" />
                        <h3>¡Planilla Completa!</h3>
                        <p>Todos los operarios y asesores de esta sede cuentan con un horario activo.</p>
                      </div>
                    ) : (
                      <>
                        {/* Dismissible Info Banner */}
                        {showSinHorarioBanner && (
                          <div className="sin-horario-banner-p">
                            <div className="banner-icon-circle-p">
                              <Info size={18} />
                            </div>
                            <div className="banner-content-p">
                              <h5>Usuarios sin horario asignado</h5>
                              <p>Estos usuarios no tienen un turno asignado. Mientras estén en este estado, no podrán marcar su asistencia desde la app móvil.</p>
                            </div>
                            <button
                              className="banner-close-btn-p"
                              onClick={() => setShowSinHorarioBanner(false)}
                              title="Cerrar"
                              type="button"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}

                        {/* Toolbar Header */}
                        <div className="sin-horario-header-p">
                          <span className="sin-horario-count-p">
                            {usuariosSinHorario.length} {usuariosSinHorario.length === 1 ? 'usuario sin horario' : 'usuarios sin horario'}
                          </span>
                          <button
                            className="btn-assign-multiple-p"
                            onClick={() => handleOpenAssignModal()}
                            type="button"
                          >
                            <Users size={16} />
                            <span>Asignar a varios</span>
                          </button>
                        </div>

                        {/* List of cards */}
                        <div className="sin-horario-list-p">
                          {usuariosSinHorario.map(u => {
                            const avatarTheme = getAvatarTheme(u.nombre_completo);
                            const uRol = u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador';
                            const uSedeName = selectedSede?.sede_nombre || selectedSede?.nombre || 'Jaen';

                            return (
                              <div key={u.id} className="sin-horario-card-p">
                                {/* Profile Info */}
                                <div className="card-profile-col-p">
                                  <div
                                    className="user-avatar-circle-p"
                                    style={{
                                      backgroundColor: avatarTheme.bg,
                                      color: avatarTheme.text
                                    }}
                                  >
                                    {getInitials(u.nombre_completo)}
                                  </div>
                                  <div className="user-profile-text-p">
                                    <span className="user-name-value-p">{u.nombre_completo}</span>
                                    <span className="user-email-value-p">{u.email || 'sin-correo@dominio.com'}</span>
                                  </div>
                                </div>

                                {/* Role Badge */}
                                <div className="card-role-col-p">
                                  <span className={`rol-badge-pill-p ${uRol.toLowerCase().includes('asesor') ? 'asesor' : uRol.toLowerCase().includes('cajero') ? 'cajero' : 'operador'}`}>
                                    {uRol}
                                  </span>
                                </div>

                                {/* Status Warning */}
                                <div className="card-status-col-p">
                                  <span className="pending-status-badge-p">
                                    <AlertTriangle size={12} />
                                    <span>Sin turno asignado</span>
                                  </span>
                                </div>

                                {/* Sede Info */}
                                <div className="card-sede-col-p">
                                  <Building size={14} className="card-meta-icon-p" />
                                  <div className="card-meta-text-p">
                                    <span className="meta-label-p">Sede</span>
                                    <span className="meta-value-p">{uSedeName}</span>
                                  </div>
                                </div>

                                {/* Last Update */}
                                <div className="card-update-col-p">
                                  <Calendar size={14} className="card-meta-icon-p" />
                                  <div className="card-meta-text-p">
                                    <span className="meta-label-p">Última actualización</span>
                                    <span className="meta-value-p">{getMockUpdateDate(u.id)}</span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="card-actions-col-p">
                                  <button
                                    className="btn-card-assign-p"
                                    onClick={() => handleOpenAssignModal(u)}
                                    type="button"
                                  >
                                    Asignar turno
                                  </button>
                                  <button
                                    className="btn-card-more-p"
                                    title="Más opciones"
                                    type="button"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Footer Disclaimer */}
                        <div className="sin-horario-footer-note-p">
                          <Info size={14} />
                          <span>Al asignar un horario, el usuario podrá marcar su asistencia normalmente desde la app móvil.</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* --- TAB 4: INTERCAMBIOS --- */}
              {activeTab === 'intercambios' && (() => {
                // Filter the list
                const filteredIntercambios = intercambios.filter(i => {
                  const reqUser = usuariosSede.find(u => u.id === i.usuario_solicitante);
                  const repUser = usuariosSede.find(u => u.id === i.usuario_reemplazo);
                  const reqName = reqUser?.nombre_completo || i.usuario_solicitante_nombre || '';
                  const repName = repUser?.nombre_completo || i.usuario_reemplazo_nombre || '';

                  const matchesSearch = reqName.toLowerCase().includes(intercambioSearchTerm.toLowerCase()) ||
                    repName.toLowerCase().includes(intercambioSearchTerm.toLowerCase()) ||
                    (i.motivo || '').toLowerCase().includes(intercambioSearchTerm.toLowerCase());

                  const matchesEstado = intercambioSelectedEstado === '' || i.estado === intercambioSelectedEstado;
                  return matchesSearch && matchesEstado;
                });

                // Pagination calculations
                const itemsPerPageIntercambio = 5;
                const totalPagesIntercambio = Math.ceil(filteredIntercambios.length / itemsPerPageIntercambio) || 1;
                const indexOfLastIntercambio = intercambioCurrentPage * itemsPerPageIntercambio;
                const indexOfFirstIntercambio = indexOfLastIntercambio - itemsPerPageIntercambio;
                const currentIntercambioList = filteredIntercambios.slice(indexOfFirstIntercambio, indexOfLastIntercambio);

                // Stats calculations
                const statsPendientes = intercambios.filter(x => x.estado === 'pendiente').length;
                const statsAprobadas = intercambios.filter(x => x.estado === 'aprobado').length;
                const statsRechazadas = intercambios.filter(x => x.estado === 'rechazado').length;
                const statsTotal = intercambios.length;

                // Helper for time ranges
                const getScheduleRangeStr = (horarioId) => {
                  if (!horarioId) return '';
                  const h = horarios.find(x => x.id === horarioId);
                  if (!h) return '';
                  if (!h.detalles || h.detalles.length === 0) return 'Horario especial';
                  const activeDetail = h.detalles.find(d => d.activo) || h.detalles[0];
                  if (!activeDetail) return 'Horario especial';
                  const start = activeDetail.hora_inicio_entrada?.substring(0, 5) || '00:00';
                  const end = activeDetail.hora_fin_salida?.substring(0, 5) || '00:00';
                  return `${start} - ${end}`;
                };

                // Helper for date formatting
                const formatIntercambioDate = (dateStr) => {
                  if (!dateStr) return { formatted: '-', dayName: '' };
                  try {
                    const dateParts = dateStr.split('-');
                    if (dateParts.length !== 3) return { formatted: dateStr, dayName: '' };
                    const year = dateParts[0];
                    const month = dateParts[1];
                    const day = dateParts[2];

                    const dateObj = new Date(year, month - 1, day);
                    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const dayName = daysOfWeek[dateObj.getDay()];

                    return {
                      formatted: `${day}/${month}/${year}`,
                      dayName: dayName
                    };
                  } catch (e) {
                    return { formatted: dateStr, dayName: '' };
                  }
                };

                return (
                  <div className="intercambios-tab-p">
                    {/* KPI Cards Row */}
                    <div className="intercambios-kpis-grid-p">
                      <div className="intercambio-kpi-card-p">
                        <div className="kpi-icon-circle-p yellow">
                          <Clock size={20} />
                        </div>
                        <div className="kpi-content-p">
                          <span className="kpi-title-p">Solicitudes pendientes</span>
                          <span className="kpi-value-p">{statsPendientes}</span>
                          <span className="kpi-subtitle-p">Esperando revisión</span>
                        </div>
                      </div>

                      <div className="intercambio-kpi-card-p">
                        <div className="kpi-icon-circle-p green">
                          <UserCheck size={20} />
                        </div>
                        <div className="kpi-content-p">
                          <span className="kpi-title-p">Aprobadas</span>
                          <span className="kpi-value-p">{statsAprobadas}</span>
                          <span className="kpi-subtitle-p">Turnos cubiertos</span>
                        </div>
                      </div>

                      <div className="intercambio-kpi-card-p">
                        <div className="kpi-icon-circle-p red">
                          <X size={20} />
                        </div>
                        <div className="kpi-content-p">
                          <span className="kpi-title-p">Rechazadas</span>
                          <span className="kpi-value-p">{statsRechazadas}</span>
                          <span className="kpi-subtitle-p">Historial</span>
                        </div>
                      </div>

                      <div className="intercambio-kpi-card-p">
                        <div className="kpi-icon-circle-p blue">
                          <CalendarRange size={20} />
                        </div>
                        <div className="kpi-content-p">
                          <span className="kpi-title-p">Total registradas</span>
                          <span className="kpi-value-p">{statsTotal}</span>
                          <span className="kpi-subtitle-p">Historial completo</span>
                        </div>
                      </div>
                    </div>

                    {/* Main Container Card */}
                    <div className="intercambios-container-card-p">
                      {/* Title block */}
                      <div className="container-card-header-p">
                        <h3>Registro de intercambios de horarios</h3>
                      </div>

                      {/* Toolbar */}
                      <div className="intercambios-toolbar-p">
                        <div className="toolbar-left-p">
                          <div className="toolbar-search-wrapper-p">
                            <Search size={16} className="search-icon-p" />
                            <input
                              type="text"
                              placeholder="Buscar usuario..."
                              value={intercambioSearchTerm}
                              onChange={(e) => {
                                setIntercambioSearchTerm(e.target.value);
                                setIntercambioCurrentPage(1);
                              }}
                              className="toolbar-search-input-p"
                            />
                          </div>
                          <div className="toolbar-select-wrapper-p">
                            <select
                              value={intercambioSelectedEstado}
                              onChange={(e) => {
                                setIntercambioSelectedEstado(e.target.value);
                                setIntercambioCurrentPage(1);
                              }}
                              className="toolbar-select-p"
                            >
                              <option value="">Todos los estados</option>
                              <option value="pendiente">Pendiente</option>
                              <option value="aprobado">Aprobado</option>
                              <option value="rechazado">Rechazado</option>
                            </select>
                            <ChevronDown size={14} className="select-chevron-p" />
                          </div>
                          <button className="btn-toolbar-filters-p" type="button">
                            <Filter size={14} />
                            <span>Filtros</span>
                          </button>
                        </div>
                        <div className="toolbar-right-p">
                          <span className="results-count-p">{filteredIntercambios.length} resultados</span>
                        </div>
                      </div>

                      {/* Table or Empty State */}
                      {filteredIntercambios.length === 0 ? (
                        <div className="empty-state-tab">
                          <CalendarRange size={48} className="empty-icon-tab" />
                          <h3>Sin intercambios coincidentes</h3>
                          <p>No se encontraron registros de intercambio de turnos con los filtros actuales.</p>
                        </div>
                      ) : (
                        <>
                          <div className="table-responsive-p">
                            <table className="data-table-p intercambios-table-p">
                              <thead>
                                <tr>
                                  <th>Usuario origen</th>
                                  <th style={{ width: '40px', textAlign: 'center' }}></th>
                                  <th>Usuario reemplazo</th>
                                  <th>Horario original</th>
                                  <th>Horario nuevo / cubierto</th>
                                  <th>Fecha del intercambio</th>
                                  <th>Motivo / resumen</th>
                                  <th>Estado</th>
                                  <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentIntercambioList.map(i => {
                                  const reqUser = usuariosSede.find(u => u.id === i.usuario_solicitante);
                                  const repUser = usuariosSede.find(u => u.id === i.usuario_reemplazo);

                                  const reqName = reqUser?.nombre_completo || i.usuario_solicitante_nombre || 'Usuario';
                                  const reqRol = reqUser?.rol_info?.nombre || reqUser?.rol?.nombre || reqUser?.cargo || 'Operador';
                                  const reqAvatarTheme = getAvatarTheme(reqName);

                                  const repName = repUser?.nombre_completo || i.usuario_reemplazo_nombre || 'Usuario';
                                  const repRol = repUser?.rol_info?.nombre || repUser?.rol?.nombre || repUser?.cargo || 'Operador';
                                  const repAvatarTheme = getAvatarTheme(repName);

                                  const origHorarioObj = horarios.find(h => h.id === i.horario_solicitante_original);
                                  const hOrigName = origHorarioObj ? origHorarioObj.nombre : (i.horario_solicitante_original_nombre || 'Sin Horario');

                                  const newHorarioObj = horarios.find(h => h.id === i.horario_reemplazo_original);
                                  const hNewName = newHorarioObj ? newHorarioObj.nombre : (i.horario_reemplazo_original_nombre || 'Sin Horario');

                                  const origThemeClass =
                                    hOrigName.toLowerCase().includes('mañana') ? 'theme-morning' :
                                      hOrigName.toLowerCase().includes('tarde') ? 'theme-evening' : 'theme-default';

                                  const newThemeClass =
                                    hNewName.toLowerCase().includes('mañana') ? 'theme-morning' :
                                      hNewName.toLowerCase().includes('tarde') ? 'theme-evening' : 'theme-default';

                                  const { formatted: dateFormatted, dayName } = formatIntercambioDate(i.fecha_intercambio);

                                  // Status mapping
                                  const statusValue = i.estado || 'aprobado';
                                  const statusLabel = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);

                                  return (
                                    <tr key={i.id}>
                                      {/* Solicitante */}
                                      <td>
                                        <div className="user-profile-cell-p">
                                          <div
                                            className="user-avatar-circle-p"
                                            style={{
                                              backgroundColor: reqAvatarTheme.bg,
                                              color: reqAvatarTheme.text
                                            }}
                                          >
                                            {getInitials(reqName)}
                                          </div>
                                          <div className="user-profile-text-p">
                                            <span className="user-name-value-p">{reqName}</span>
                                            <span className="user-email-value-p">{reqRol}</span>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Arrow Column */}
                                      <td style={{ textAlign: 'center' }}>
                                        <div className="swap-arrow-wrapper-p">
                                          <ArrowLeftRight size={14} className="swap-arrow-icon-p" />
                                        </div>
                                      </td>

                                      {/* Reemplazo */}
                                      <td>
                                        <div className="user-profile-cell-p">
                                          <div
                                            className="user-avatar-circle-p"
                                            style={{
                                              backgroundColor: repAvatarTheme.bg,
                                              color: repAvatarTheme.text
                                            }}
                                          >
                                            {getInitials(repName)}
                                          </div>
                                          <div className="user-profile-text-p">
                                            <span className="user-name-value-p">{repName}</span>
                                            <span className="user-email-value-p">{repRol}</span>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Horario Original */}
                                      <td>
                                        <div className="schedule-column-cell-p">
                                          <div className={`schedule-badge-pill-p ${origThemeClass}`}>
                                            <Clock size={12} className="schedule-badge-icon" />
                                            <span>{hOrigName}</span>
                                          </div>
                                          <span className="time-range-subtext-p">{getScheduleRangeStr(i.horario_solicitante_original)}</span>
                                        </div>
                                      </td>

                                      {/* Horario Nuevo */}
                                      <td>
                                        <div className="schedule-column-cell-p">
                                          <div className={`schedule-badge-pill-p ${newThemeClass}`}>
                                            <Clock size={12} className="schedule-badge-icon" />
                                            <span>{hNewName}</span>
                                          </div>
                                          <span className="time-range-subtext-p">{getScheduleRangeStr(i.horario_reemplazo_original)}</span>
                                        </div>
                                      </td>

                                      {/* Fecha */}
                                      <td>
                                        <div className="date-column-cell-p">
                                          <span className="date-main-text-p">{dateFormatted}</span>
                                          <span className="date-sub-text-p">{dayName}</span>
                                        </div>
                                      </td>

                                      {/* Motivo */}
                                      <td>
                                        <div className="reason-column-cell-p">
                                          <span className="reason-main-text-p">{i.motivo}</span>
                                          <span className="reason-sub-text-p">Reg: {i.registrado_por_nombre || 'Admin'}</span>
                                        </div>
                                      </td>

                                      {/* Estado */}
                                      <td>
                                        <span className={`status-pill-badge-p ${statusValue.toLowerCase()}`}>
                                          {statusLabel}
                                        </span>
                                      </td>

                                      {/* Acciones */}
                                      <td>
                                        <div className="action-buttons-cell-p">
                                          <button
                                            className="btn-action-delete-p"
                                            onClick={() => handleDeleteSwap(i.id)}
                                            title="Anular Intercambio"
                                            type="button"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Footer */}
                          <div className="table-pagination-footer-p">
                            <span className="pagination-legend-p">
                              Mostrando {indexOfFirstIntercambio + 1} a {Math.min(indexOfLastIntercambio, filteredIntercambios.length)} de {filteredIntercambios.length} resultados
                            </span>

                            <div className="pagination-buttons-p">
                              <button
                                className="btn-page-arrow-p"
                                onClick={() => setIntercambioCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={intercambioCurrentPage === 1}
                                type="button"
                              >
                                <ChevronLeft size={14} />
                              </button>
                              {Array.from({ length: totalPagesIntercambio }, (_, i) => i + 1).map(page => (
                                <button
                                  key={page}
                                  className={`btn-page-number-p ${intercambioCurrentPage === page ? 'active' : ''}`}
                                  onClick={() => setIntercambioCurrentPage(page)}
                                  type="button"
                                >
                                  {page}
                                </button>
                              ))}
                              <button
                                className="btn-page-arrow-p"
                                onClick={() => setIntercambioCurrentPage(prev => Math.min(totalPagesIntercambio, prev + 1))}
                                disabled={intercambioCurrentPage === totalPagesIntercambio}
                                type="button"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CREAR/EDITAR HORARIO ================= */}
      {isHorarioModalOpen && createPortal(
        <div className="modal-overlay">
          {/* Modal shell: flex-column, max 90vh, no overflow */}
          <div className="hm-shell">

            {/* ── HEADER FIJO ── */}
            <div className="hm-header">
              <div className="hm-header-left">
                <div className="hm-header-icon-box">
                  <Calendar size={20} />
                </div>
                <div className="hm-header-titles">
                  <h2>{currentHorario ? 'Editar Horario Detallado' : 'Crear Nuevo Horario'}</h2>
                  <p className="hm-header-subtitle">Configura rangos, días activos y asignación inicial del turno.</p>
                </div>
              </div>
              <button className="hm-close-btn" onClick={() => setIsHorarioModalOpen(false)} title="Cerrar" type="button">
                <X size={20} />
              </button>
            </div>

            {/* ── BODY CON SCROLL — form semántico ocupa sólo el body ── */}
            <form id="horario-form" onSubmit={handleSaveHorario} className="hm-body">

              <div className="form-group-row">
                <div className="form-group flex-1">
                  <label className="input-label-p">Nombre del Horario/Turno *</label>
                  <input
                    type="text"
                    value={horarioForm.nombre}
                    onChange={(e) => setHorarioForm(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                    className="input-field"
                    placeholder="Ej. Turno Mañana Flexible"
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="input-label-p">Descripción / Comentario</label>
                  <input
                    type="text"
                    value={horarioForm.descripcion}
                    onChange={(e) => setHorarioForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="input-field"
                    placeholder="Comentario sobre este turno"
                  />
                </div>
              </div>

              {/* SWITCH MODE */}
              <div className="schedule-mode-selector">
                <label className="section-label-modal">¿Cómo deseas configurar este horario?</label>
                <div className="mode-cards-row">
                  <button
                    type="button"
                    className={`btn-mode-select ${!isCustomSchedule ? 'active' : ''}`}
                    onClick={() => {
                      setIsCustomSchedule(false);
                      setHorarioForm(prev => {
                        const updated = prev.detalles.map(d => ({
                          ...d,
                          hora_inicio_entrada: globalTimes.hora_inicio_entrada,
                          hora_fin_entrada: globalTimes.hora_fin_entrada,
                          hora_inicio_salida: globalTimes.hora_inicio_salida,
                          hora_fin_salida: globalTimes.hora_fin_salida
                        }));
                        return { ...prev, detalles: updated };
                      });
                    }}
                  >
                    <div className="btn-mode-radio-circle">
                      <div className="btn-mode-radio-dot" />
                    </div>
                    <div className="btn-mode-icon-box">
                      <Calendar size={18} />
                    </div>
                    <div className="btn-mode-content">
                      <span className="btn-mode-title">Horario General Único</span>
                      <span className="btn-mode-desc">Mismas horas para todos los días seleccionados</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`btn-mode-select ${isCustomSchedule ? 'active' : ''}`}
                    onClick={() => setIsCustomSchedule(true)}
                  >
                    <div className="btn-mode-radio-circle">
                      <div className="btn-mode-radio-dot" />
                    </div>
                    <div className="btn-mode-icon-box">
                      <Calendar size={18} />
                    </div>
                    <div className="btn-mode-content">
                      <span className="btn-mode-title">Personalizado por Días</span>
                      <span className="btn-mode-desc">Configura diferentes horas por día de la semana</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* TIMELINE EXPLANATION */}
              <div className="timeline-helper-card">
                <div className="helper-title flex items-center gap-1.5 text-xs font-semibold text-accent mb-2">
                  <Info size={14} className="text-primary" />
                  ¿Cómo funcionan los rangos de marcación?
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-p">
                  <div className="helper-item flex gap-2">
                    <LogIn size={16} className="text-primary mt-0.5" />
                    <div>
                      <span className="font-semibold text-success block">Rango de Entrada (Ingreso):</span>
                      <span>Lapso en el que el empleado puede marcar entrada puntual. Si marca después del fin, se registra como <strong>Tardanza</strong>.</span>
                    </div>
                  </div>
                  <div className="helper-item flex gap-2">
                    <LogOut size={16} className="text-primary mt-0.5" />
                    <div>
                      <span className="font-semibold text-warning block">Rango de Salida (Egreso):</span>
                      <span>Lapso establecido para registrar la salida de la jornada diaria.</span>
                    </div>
                  </div>
                </div>
              </div>

              {!isCustomSchedule ? (
                <div className="unified-schedule-block">
                  <div className="global-times-panel-grid">
                    {/* Entrada */}
                    <div className="global-time-card">
                      <div className="time-card-icon-box blue">
                        <LogIn size={20} />
                      </div>
                      <div className="time-card-content">
                        <label className="time-card-label">Rango de Entrada de Trabajo *</label>
                        <div className="time-inputs-row">
                          <div className="time-input-wrapper">
                            <input
                              type="time"
                              value={globalTimes.hora_inicio_entrada}
                              onChange={(e) => { const val = e.target.value; setGlobalTimes(prev => ({ ...prev, hora_inicio_entrada: val })); setHorarioForm(prev => { const updated = prev.detalles.map(d => ({ ...d, hora_inicio_entrada: val })); return { ...prev, detalles: updated }; }); }}
                              className="input-field-time"
                              required
                              step="1"
                            />
                            <Clock size={14} className="time-input-clock" />
                          </div>
                          <span className="time-separator">a</span>
                          <div className="time-input-wrapper">
                            <input
                              type="time"
                              value={globalTimes.hora_fin_entrada}
                              onChange={(e) => { const val = e.target.value; setGlobalTimes(prev => ({ ...prev, hora_fin_entrada: val })); setHorarioForm(prev => { const updated = prev.detalles.map(d => ({ ...d, hora_fin_entrada: val })); return { ...prev, detalles: updated }; }); }}
                              className="input-field-time"
                              required
                              step="1"
                            />
                            <Clock size={14} className="time-input-clock" />
                          </div>
                        </div>
                        <span className="time-card-hint">Ej. Entrada puntual de 08:00:00 a 09:00:00</span>
                      </div>
                    </div>

                    {/* Salida */}
                    <div className="global-time-card">
                      <div className="time-card-icon-box blue">
                        <LogOut size={20} />
                      </div>
                      <div className="time-card-content">
                        <label className="time-card-label">Rango de Salida de Trabajo *</label>
                        <div className="time-inputs-row">
                          <div className="time-input-wrapper">
                            <input
                              type="time"
                              value={globalTimes.hora_inicio_salida}
                              onChange={(e) => { const val = e.target.value; setGlobalTimes(prev => ({ ...prev, hora_inicio_salida: val })); setHorarioForm(prev => { const updated = prev.detalles.map(d => ({ ...d, hora_inicio_salida: val })); return { ...prev, detalles: updated }; }); }}
                              className="input-field-time"
                              required
                              step="1"
                            />
                            <Clock size={14} className="time-input-clock" />
                          </div>
                          <span className="time-separator">a</span>
                          <div className="time-input-wrapper">
                            <input
                              type="time"
                              value={globalTimes.hora_fin_salida}
                              onChange={(e) => { const val = e.target.value; setGlobalTimes(prev => ({ ...prev, hora_fin_salida: val })); setHorarioForm(prev => { const updated = prev.detalles.map(d => ({ ...d, hora_fin_salida: val })); return { ...prev, detalles: updated }; }); }}
                              className="input-field-time"
                              required
                              step="1"
                            />
                            <Clock size={14} className="time-input-clock" />
                          </div>
                        </div>
                        <span className="time-card-hint">Ej. Salida de 17:00:00 a 19:00:00</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="section-label-modal">Selecciona los días activos para este turno</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {horarioForm.detalles.map((d, index) => (
                        <button
                          key={d.dia_semana}
                          type="button"
                          className={`day-selector-btn-pill capitalize ${d.activo ? 'active' : ''}`}
                          onClick={() => handleDayToggle(index)}
                        >
                          {d.activo && <Check size={14} className="day-check-icon" />}
                          <span className="capitalize">{d.dia_semana}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="custom-schedule-block">
                  <label className="section-label-modal">Configura horas individuales por día</label>
                  <div className="days-configs-grid mt-2">
                    {horarioForm.detalles.map((d, index) => {
                      const isDomingo = d.dia_semana.toLowerCase() === 'domingo';
                      return (
                        <div key={d.dia_semana} className={`day-config-card ${d.activo ? 'active' : ''} ${isDomingo ? 'domingo-card' : ''}`}>
                          <div className="day-card-header">
                            <label className="checkbox-label flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={d.activo}
                                onChange={() => handleDayToggle(index)}
                                className="day-card-checkbox"
                              />
                              <span className="capitalize font-semibold">{d.dia_semana}</span>
                            </label>
                          </div>

                          <div className={`day-card-times mt-3 ${isDomingo ? 'domingo-times-row' : ''}`}>
                            <div className="time-group">
                              <label className="time-group-label">Entrada Rango</label>
                              <div className="time-inputs-row-sm">
                                <div className="time-input-wrapper-sm">
                                  <input
                                    type="time"
                                    value={d.activo ? d.hora_inicio_entrada : ''}
                                    onChange={(e) => handleTimeChange(index, 'hora_inicio_entrada', e.target.value)}
                                    className="input-field-time-sm"
                                    disabled={!d.activo}
                                    required={d.activo}
                                    step="1"
                                  />
                                  <Clock size={12} className="time-input-clock-sm" />
                                </div>
                                <span className="time-separator-sm">a</span>
                                <div className="time-input-wrapper-sm">
                                  <input
                                    type="time"
                                    value={d.activo ? d.hora_fin_entrada : ''}
                                    onChange={(e) => handleTimeChange(index, 'hora_fin_entrada', e.target.value)}
                                    className="input-field-time-sm"
                                    disabled={!d.activo}
                                    required={d.activo}
                                    step="1"
                                  />
                                  <Clock size={12} className="time-input-clock-sm" />
                                </div>
                              </div>
                            </div>

                            <div className={`time-group ${isDomingo ? '' : 'mt-3'}`}>
                              <label className="time-group-label">Salida Rango</label>
                              <div className="time-inputs-row-sm">
                                <div className="time-input-wrapper-sm">
                                  <input
                                    type="time"
                                    value={d.activo ? d.hora_inicio_salida : ''}
                                    onChange={(e) => handleTimeChange(index, 'hora_inicio_salida', e.target.value)}
                                    className="input-field-time-sm"
                                    disabled={!d.activo}
                                    required={d.activo}
                                    step="1"
                                  />
                                  <Clock size={12} className="time-input-clock-sm" />
                                </div>
                                <span className="time-separator-sm">a</span>
                                <div className="time-input-wrapper-sm">
                                  <input
                                    type="time"
                                    value={d.activo ? d.hora_fin_salida : ''}
                                    onChange={(e) => handleTimeChange(index, 'hora_fin_salida', e.target.value)}
                                    className="input-field-time-sm"
                                    disabled={!d.activo}
                                    required={d.activo}
                                    step="1"
                                  />
                                  <Clock size={12} className="time-input-clock-sm" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Asignación opcional al crear */}
              {!currentHorario && (
                <div className="assignment-section-modal">
                  <h4 className="section-label-modal">Asignar inmediatamente a usuarios (opcional)</h4>
                  <p className="text-muted-p text-sm">Selecciona uno o más usuarios de la sede para asignarles este nuevo horario.</p>
                  {usuariosSede.length === 0 ? (
                    <p className="text-warning text-sm mt-2">No hay usuarios de rol Operador/Asesor en esta sede para asignar.</p>
                  ) : (
                    <>
                      <div className="user-search-wrapper mt-3 mb-2">
                        <Search size={14} className="user-search-icon" />
                        <input
                          type="text"
                          className="user-search-input-modal"
                          placeholder="Buscar usuarios por nombre..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="users-select-checklist-scroll mt-2">
                        {usuariosSede
                          .filter(u => u.nombre_completo.toLowerCase().includes(userSearchTerm.toLowerCase()))
                          .map(u => {
                            const isSelected = horarioForm.usuarios_asignados.includes(u.id);
                            const avatarTheme = getAvatarTheme(u.nombre_completo);
                            return (
                              <label key={u.id} className={`user-select-row-p ${isSelected ? 'selected' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleUserSelect(u.id)}
                                  className="user-select-checkbox-p"
                                />
                                <div
                                  className="user-avatar-circle-sm-p"
                                  style={{
                                    backgroundColor: avatarTheme.bg,
                                    color: avatarTheme.text
                                  }}
                                >
                                  {getInitials(u.nombre_completo)}
                                </div>
                                <div className="user-select-info-p">
                                  <span className="user-select-name-p">{u.nombre_completo}</span>
                                  <span className="user-select-role-p">{u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador'}</span>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                      {horarioForm.usuarios_asignados.length > 0 && (
                        <div className="form-row mt-4">
                          <div className="form-group flex-1">
                            <label className="input-label-p">Vigente Desde *</label>
                            <div className="date-input-wrapper-custom">
                              <Calendar size={16} className="date-input-icon" />
                              <input
                                type="date"
                                value={horarioForm.vigente_desde}
                                onChange={(e) => setHorarioForm(prev => ({ ...prev, vigente_desde: e.target.value }))}
                                required
                                className="input-field-date-custom"
                              />
                            </div>
                          </div>
                          <div className="form-group flex-1">
                            <label className="input-label-p">Vigente Hasta</label>
                            <div className="date-input-wrapper-custom">
                              <Calendar size={16} className="date-input-icon" />
                              <input
                                type="date"
                                value={horarioForm.vigente_hasta}
                                onChange={(e) => setHorarioForm(prev => ({ ...prev, vigente_hasta: e.target.value }))}
                                className="input-field-date-custom"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Si ya está creado (Modo Edición) y tiene usuarios asignados, permitimos editar las fechas de vigencia sin mostrar la lista de usuarios */}
              {currentHorario && horarioForm.usuarios_asignados.length > 0 && (
                <div className="assignment-section-modal mt-4">
                  <h4 className="section-label-modal">Vigencia del Horario</h4>
                  <p className="text-muted-p text-sm">Modifica el rango de fechas en el que estará vigente este horario para los usuarios que lo tienen asignado actualmente.</p>
                  <div className="form-row mt-3">
                    <div className="form-group flex-1">
                      <label className="input-label-p">Vigente Desde *</label>
                      <div className="date-input-wrapper-custom">
                        <Calendar size={16} className="date-input-icon" />
                        <input
                          type="date"
                          value={horarioForm.vigente_desde}
                          onChange={(e) => setHorarioForm(prev => ({ ...prev, vigente_desde: e.target.value }))}
                          required
                          className="input-field-date-custom"
                        />
                      </div>
                    </div>
                    <div className="form-group flex-1">
                      <label className="input-label-p">Vigente Hasta</label>
                      <div className="date-input-wrapper-custom">
                        <Calendar size={16} className="date-input-icon" />
                        <input
                          type="date"
                          value={horarioForm.vigente_hasta}
                          onChange={(e) => setHorarioForm(prev => ({ ...prev, vigente_hasta: e.target.value }))}
                          className="input-field-date-custom"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </form>

            {/* ── FOOTER FIJO — fuera del form, usa form="horario-form" ── */}
            <div className="hm-footer">
              <button type="button" className="btn-modal-footer-cancel" onClick={() => setIsHorarioModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" form="horario-form" className="btn-modal-footer-submit">
                <UserPlus size={16} />
                <span>{currentHorario ? 'Guardar Cambios' : 'Crear y Asignar'}</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL: ASIGNAR HORARIO EXISTENTE ================= */}
      {isAssignModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="hm-shell">
            {/* Header Fijo */}
            <div className="hm-header">
              <div className="hm-header-left">
                <div className="hm-header-icon-box">
                  <Calendar size={24} />
                  <div className="hm-header-icon-badge">
                    <User size={10} />
                  </div>
                </div>
                <div className="hm-header-titles">
                  <h2>Asignar Horario</h2>
                  <p className="hm-header-subtitle">Selecciona el turno, define la vigencia y asigna los usuarios que tendrán este horario.</p>
                </div>
              </div>
              <button className="hm-close-btn" onClick={() => setIsAssignModalOpen(false)} title="Cerrar" type="button">
                <X size={20} />
              </button>
            </div>

            {/* Body con Scroll */}
            <form id="assign-form" onSubmit={handleSaveAssignment} className="hm-body">
              {/* Campo Desplegable de Horario */}
              <div className="form-group position-relative" ref={horarioDropdownRef}>
                <label className="input-label-p">Horario/Turno a asignar *</label>

                <div
                  className={`dropdown-select-custom ${isHorarioDropdownOpen ? 'open' : ''} ${!assignForm.horario ? 'placeholder' : ''}`}
                  onClick={() => setIsHorarioDropdownOpen(prev => !prev)}
                >
                  <div className="dropdown-select-trigger-content">
                    <Calendar size={16} className="dropdown-trigger-icon-blue" />
                    {assignForm.horario ? (
                      (() => {
                        const selectedH = horarios.find(h => h.id === parseInt(assignForm.horario));
                        if (!selectedH) return <span>Seleccione un horario</span>;
                        return (
                          <div className="selected-option-summary">
                            <span className="selected-option-title">{selectedH.nombre}</span>
                            <span className="selected-option-subtext">{getHorarioSummary(selectedH)}</span>
                          </div>
                        );
                      })()
                    ) : (
                      <span>Seleccione un horario</span>
                    )}
                  </div>
                  <ChevronDown size={16} className="dropdown-trigger-chevron" />
                </div>

                {isHorarioDropdownOpen && (
                  <div className="dropdown-menu-custom">
                    {horarios.length === 0 ? (
                      <div className="dropdown-empty-state">
                        <p>No hay horarios creados para esta sede.</p>
                      </div>
                    ) : (
                      horarios.map(h => {
                        const countAssigned = usuariosConHorario.filter(uh => uh.horario === h.id).length;
                        const isSelected = parseInt(assignForm.horario) === h.id;
                        return (
                          <div
                            key={h.id}
                            className={`dropdown-option-custom ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setAssignForm(prev => ({ ...prev, horario: h.id }));
                              setIsHorarioDropdownOpen(false);
                            }}
                          >
                            <div className="option-main-info">
                              <span className="option-title">{h.nombre}</span>
                              {countAssigned > 0 ? (
                                <span className="option-badge-assigned">{countAssigned} {countAssigned === 1 ? 'usuario' : 'usuarios'}</span>
                              ) : (
                                <span className="option-badge-empty">Sin usuarios</span>
                              )}
                            </div>
                            <span className="option-subtext">{getHorarioSummary(h)}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Campo Multiselect de Usuarios */}
              <div className="form-group position-relative" ref={userDropdownRef}>
                <label className="input-label-p">Seleccionar Usuarios *</label>

                <div
                  className={`multiselect-trigger-custom ${isUserDropdownOpen ? 'open' : ''}`}
                  onClick={(e) => {
                    if (e.target.closest('.chip-delete-btn')) return;
                    setIsUserDropdownOpen(prev => !prev);
                  }}
                >
                  <Users size={16} className="dropdown-trigger-icon-blue" />
                  <div className="multiselect-chips-and-input">
                    {(() => {
                      const maxChipsToShow = 2;
                      const selectedUsers = usuariosSede.filter(u => assignForm.usuarios.includes(u.id));
                      const displayedChips = selectedUsers.slice(0, maxChipsToShow);
                      const hiddenCount = selectedUsers.length - displayedChips.length;

                      return (
                        <>
                          {displayedChips.map(u => {
                            const avatarTheme = getAvatarTheme(u.nombre_completo);
                            return (
                              <span
                                key={u.id}
                                className="user-chip-custom"
                                style={{
                                  backgroundColor: avatarTheme.bg,
                                  color: avatarTheme.text,
                                  borderColor: avatarTheme.text + '20'
                                }}
                              >
                                <div
                                  className="chip-avatar-circle"
                                  style={{
                                    backgroundColor: avatarTheme.text,
                                    color: '#ffffff'
                                  }}
                                >
                                  {getInitials(u.nombre_completo)}
                                </div>
                                <span className="chip-text-name">{u.nombre_completo.split(' ')[0]} {u.nombre_completo.split(' ')[1] || ''}</span>
                                <button
                                  type="button"
                                  className="chip-delete-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleAssignUser(u.id);
                                  }}
                                  style={{
                                    color: avatarTheme.text
                                  }}
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            );
                          })}
                          {hiddenCount > 0 && (
                            <span className="user-chip-more-custom">+{hiddenCount} más</span>
                          )}
                          {assignForm.usuarios.length === 0 && (
                            <span className="multiselect-placeholder-text">Buscar y seleccionar usuarios</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <ChevronDown size={16} className="dropdown-trigger-chevron" />
                </div>

                {isUserDropdownOpen && (
                  <div className="dropdown-menu-custom user-dropdown-menu">
                    <div className="dropdown-search-container" onClick={(e) => e.stopPropagation()}>
                      <Search size={14} className="dropdown-search-icon" />
                      <input
                        type="text"
                        className="search-input-dropdown"
                        placeholder="Buscar por nombre o rol"
                        value={userSearchDropdownTerm}
                        onChange={(e) => setUserSearchDropdownTerm(e.target.value)}
                      />
                      {userSearchDropdownTerm && (
                        <button
                          type="button"
                          className="clear-search-btn"
                          onClick={() => setUserSearchDropdownTerm('')}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <div className="user-options-list-scroll">
                      {(() => {
                        const filtered = usuariosSede.filter(u => {
                          const query = userSearchDropdownTerm.toLowerCase();
                          const nameMatch = u.nombre_completo.toLowerCase().includes(query);
                          const rolName = (u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador').toLowerCase();
                          const rolMatch = rolName.includes(query);
                          return nameMatch || rolMatch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="dropdown-empty-state-users">
                              <p>No hay usuarios disponibles.</p>
                            </div>
                          );
                        }

                        return filtered.map(u => {
                          const isSelected = assignForm.usuarios.includes(u.id);
                          const avatarTheme = getAvatarTheme(u.nombre_completo);
                          const hasConflict = checkScheduleConflict(
                            u.id,
                            assignForm.horario,
                            assignForm.vigente_desde,
                            assignForm.vigente_hasta
                          );

                          return (
                            <div
                              key={u.id}
                              className={`user-option-row ${isSelected ? 'selected' : ''} ${hasConflict ? 'has-conflict-row' : ''}`}
                              onClick={() => handleToggleAssignUser(u.id)}
                            >
                              <div className="user-option-left">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="user-option-checkbox"
                                />
                                <div
                                  className="user-option-avatar"
                                  style={{
                                    backgroundColor: avatarTheme.bg,
                                    color: avatarTheme.text
                                  }}
                                >
                                  {getInitials(u.nombre_completo)}
                                </div>
                                <div className="user-option-info">
                                  <span className="user-option-name">{u.nombre_completo}</span>
                                </div>
                              </div>

                              <div className="user-option-right">
                                {hasConflict ? (
                                  <span className="conflict-warning-badge" title={`Conflicto con '${hasConflict.horario.nombre}'`}>
                                    Tiene horario en conflicto
                                  </span>
                                ) : (
                                  <span className="user-option-role-badge">
                                    {u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Fechas de Vigencia en Dos Columnas */}
              <div className="form-group-row">
                <div className="form-group flex-1">
                  <label className="input-label-p">Vigente Desde *</label>
                  <div className="date-input-wrapper-custom">
                    <Calendar size={16} className="date-input-icon" />
                    <input
                      type="date"
                      value={assignForm.vigente_desde}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, vigente_desde: e.target.value }))}
                      required
                      className="input-field-date-custom"
                    />
                  </div>
                </div>
                <div className="form-group flex-1">
                  <label className="input-label-p">Vigente Hasta</label>
                  <div className="date-input-wrapper-custom">
                    <Calendar size={16} className="date-input-icon" />
                    <input
                      type="date"
                      value={assignForm.vigente_hasta}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, vigente_hasta: e.target.value }))}
                      className="input-field-date-custom"
                    />
                  </div>
                </div>
              </div>

              {/* Observación */}
              <div className="form-group">
                <label className="input-label-p">Observación</label>
                <div className="observation-input-wrapper">
                  <FileText size={16} className="observation-input-icon" />
                  <textarea
                    value={assignForm.observacion}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, observacion: e.target.value }))}
                    className="input-field-obs"
                    rows={1}
                    placeholder="Agrega una observación (opcional)"
                  />
                </div>
              </div>
            </form>

            {/* Footer Fijo */}
            <div className="hm-footer">
              <button type="button" className="btn-modal-footer-cancel" onClick={() => setIsAssignModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" form="assign-form" className="btn-modal-footer-submit-blue">
                <Check size={16} className="btn-submit-check-icon" />
                <span>Confirmar Asignación</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL: REGISTRAR INTERCAMBIO ================= */}
      {isSwapModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Registrar Intercambio Temporal</h2>
              <button className="btn-icon" onClick={() => setIsSwapModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveSwap} className="modal-form">
              <div className="form-group">
                <label>Usuario Solicitante (A) *</label>
                <select
                  value={swapForm.usuario_solicitante}
                  onChange={(e) => setSwapForm(prev => ({
                    ...prev,
                    usuario_solicitante: e.target.value,
                    usuario_reemplazo: ''
                  }))}
                  required
                  className="input-field"
                >
                  <option value="" disabled>Seleccione al solicitante</option>
                  {usuariosSede
                    .filter(u => getUserAssignedSchedule(u.id) !== null)
                    .map(u => {
                      const sched = getUserAssignedSchedule(u.id);
                      const horarioName = sched ? sched.horario.nombre : '';
                      const hours = sched ? ` (${sched.detail.hora_inicio_entrada.substring(0, 5)} - ${sched.detail.hora_fin_salida.substring(0, 5)})` : '';
                      return (
                        <option key={u.id} value={u.id}>
                          {u.nombre_completo} ({u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador'}) - {horarioName}{hours}
                        </option>
                      );
                    })
                  }
                </select>
              </div>

              <div className="form-group mt-3">
                <label>Usuario Reemplazo (B) *</label>
                <select
                  value={swapForm.usuario_reemplazo}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, usuario_reemplazo: e.target.value }))}
                  required
                  className="input-field"
                  disabled={!swapForm.usuario_solicitante}
                >
                  <option value="" disabled>Seleccione al reemplazo</option>
                  {(() => {
                    const solicitanteId = parseInt(swapForm.usuario_solicitante);
                    if (!solicitanteId) return null;

                    const schedA = getUserAssignedSchedule(solicitanteId);
                    if (!schedA) return null;

                    return usuariosSede
                      .filter(u => u.id !== solicitanteId)
                      .filter(u => {
                        const schedB = getUserAssignedSchedule(u.id);
                        if (!schedB) return false; // Both must have a schedule to swap!

                        // They must have different schedules to swap
                        return schedB.horario.id !== schedA.horario.id;
                      })
                      .map(u => {
                        const schedB = getUserAssignedSchedule(u.id);
                        const labelText = schedB
                          ? ` - ${schedB.horario.nombre} (${schedB.detail.hora_inicio_entrada.substring(0, 5)} - ${schedB.detail.hora_fin_salida.substring(0, 5)})`
                          : '';
                        return (
                          <option key={u.id} value={u.id}>
                            {u.nombre_completo} ({u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador'}){labelText}
                          </option>
                        );
                      });
                  })()}
                </select>
              </div>

              <div className="form-group mt-3">
                <label>Fecha de Intercambio *</label>
                <div className="date-input-wrapper-custom">
                  <Calendar size={16} className="date-input-icon" />
                  <input
                    type="date"
                    value={swapForm.fecha_intercambio}
                    onChange={(e) => setSwapForm(prev => ({ ...prev, fecha_intercambio: e.target.value }))}
                    required
                    className="input-field-date-custom"
                  />
                </div>
              </div>

              <div className="form-group mt-3">
                <label>Motivo del cambio *</label>
                <textarea
                  value={swapForm.motivo}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, motivo: e.target.value }))}
                  required
                  rows={2}
                  className="input-field"
                  placeholder="Ej. Cambio de turno por cita médica aprobada"
                />
              </div>

              <div className="form-group mt-3">
                <label>Observaciones Adicionales</label>
                <input
                  type="text"
                  value={swapForm.observacion}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, observacion: e.target.value }))}
                  className="input-field"
                  placeholder="Detalle administrativo"
                />
              </div>

              <div className="modal-footer mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setIsSwapModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar e Intercambiar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </MainLayout>
  );
};

export default GestionJornada;
