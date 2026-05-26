import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Calendar, X, MapPin, Users, 
  UserCheck, UserX, RefreshCw, ChevronLeft, CalendarRange, Clock, AlertTriangle
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './GestionJornada.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const GestionJornada = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // Level 1 vs Level 2 navigation
  const [selectedSede, setSelectedSede] = useState(null); // Sede object or null
  const [sedesResumen, setSedesResumen] = useState([]);
  const [loadingResumen, setLoadingResumen] = useState(true);

  // Level 2 data
  const [activeTab, setActiveTab] = useState('horarios'); // 'horarios' | 'con_horario' | 'sin_horario' | 'intercambios'
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [usuariosSede, setUsuariosSede] = useState([]);
  const [usuariosConHorario, setUsuariosConHorario] = useState([]);
  const [usuariosSinHorario, setUsuariosSinHorario] = useState([]);
  const [intercambios, setIntercambios] = useState([]);

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
    vigente_desde: new Date().toISOString().split('T')[0],
    vigente_hasta: ''
  });

  const [assignForm, setAssignForm] = useState({
    usuarios: [], // supports multi-assign
    horario: '',
    vigente_desde: new Date().toISOString().split('T')[0],
    vigente_hasta: '',
    observacion: ''
  });

  const [swapForm, setSwapForm] = useState({
    usuario_solicitante: '',
    usuario_reemplazo: '',
    fecha_intercambio: new Date().toISOString().split('T')[0],
    motivo: '',
    observacion: ''
  });

  // Fetch Level 1 Resumen
  const fetchSedesResumen = async () => {
    setLoadingResumen(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/sedes/resumen/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedesResumen(data);
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

      setHorarioForm({
        nombre: horario.nombre,
        descripcion: horario.descripcion || '',
        detalles: mappedDetalles,
        usuarios_asignados: [],
        vigente_desde: new Date().toISOString().split('T')[0],
        vigente_hasta: ''
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
        vigente_desde: new Date().toISOString().split('T')[0],
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
      if (!currentHorario) {
        payload.usuarios_ids = horarioForm.usuarios_asignados;
      }
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
      if (!currentHorario) {
        payload.usuarios_ids = horarioForm.usuarios_asignados;
      }
    }

    // Include vigency variables on creation if users are assigned
    if (!currentHorario && horarioForm.usuarios_asignados.length > 0) {
      payload.vigente_desde = horarioForm.vigente_desde;
      if (horarioForm.vigente_hasta) {
        payload.vigente_hasta = horarioForm.vigente_hasta;
      }
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
    if (!window.confirm('¿Desea desactivar y eliminar este horario? Esto afectará a todos los operarios asignados.')) return;
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
  const handleOpenAssignModal = (quickUser = null) => {
    setAssignForm({
      usuarios: quickUser ? [quickUser.id] : [],
      horario: horarios.length > 0 ? horarios[0].id : '',
      vigente_desde: new Date().toISOString().split('T')[0],
      vigente_hasta: '',
      observacion: ''
    });
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

    const token = localStorage.getItem('access_token');
    try {
      const promises = assignForm.usuarios.map(uId => {
        return fetch(`${API_URL}/usuario-horarios/`, {
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
      });

      const results = await Promise.all(promises);
      const allOk = results.every(r => r.ok);

      if (allOk) {
        showNotification('Horarios asignados correctamente.', 'success');
        setIsAssignModalOpen(false);
        fetchSedeDetailData(selectedSede.sede_id);
      } else {
        showNotification('Ocurrió un inconveniente al asignar algunos horarios.', 'warning');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error al crear asignaciones.', 'error');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('¿Desactivar la asignación de horario para este usuario?')) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/usuario-horarios/${assignmentId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification('Horario removido exitosamente del usuario.', 'success');
        fetchSedeDetailData(selectedSede.sede_id);
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
      fecha_intercambio: new Date().toISOString().split('T')[0],
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
    if (!window.confirm('¿Eliminar y anular este intercambio de turnos?')) return;
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
          <div className="section-title-wrapper">
            <h2>Panel General por Sedes</h2>
            <p>Seleccione una sede para gestionar sus turnos, horarios y auditar intercambios.</p>
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
            <div className="sedes-grid">
              {sedesResumen.map(sede => (
                <div key={sede.sede_id} className="sede-card-premium">
                  <div className="sede-card-glow"></div>
                  <div className="sede-card-content">
                    <div className="sede-header-premium">
                      <div className="sede-icon-bg">
                        <MapPin size={24} />
                      </div>
                      <h3 className="sede-title-premium">{sede.sede_nombre}</h3>
                    </div>

                    <div className="sede-metrics-grid">
                      <div className="metric-box">
                        <Clock size={18} className="text-accent" />
                        <div className="metric-info">
                          <span className="metric-value">{sede.horarios_creados}</span>
                          <span className="metric-label">Horarios Creados</span>
                        </div>
                      </div>
                      <div className="metric-box">
                        <UserCheck size={18} className="text-success" />
                        <div className="metric-info">
                          <span className="metric-value">{sede.usuarios_con_horario}</span>
                          <span className="metric-label">Usuarios c/ Horario</span>
                        </div>
                      </div>
                      <div className="metric-box">
                        <UserX size={18} className="text-warning" />
                        <div className="metric-info">
                          <span className="metric-value">{sede.usuarios_sin_horario}</span>
                          <span className="metric-label">Usuarios s/ Horario</span>
                        </div>
                      </div>
                      <div className="metric-box">
                        <RefreshCw size={18} className="text-primary" />
                        <div className="metric-info">
                          <span className="metric-value">{sede.intercambios_count}</span>
                          <span className="metric-label">Intercambios Aprob.</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      className="btn-premium-action mt-6 w-full"
                      onClick={() => handleSelectSede(sede)}
                    >
                      Gestionar Horarios
                    </button>
                  </div>
                </div>
              ))}
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
                <div className="horarios-tab">
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
                    <div className="horarios-list-grid">
                      {horarios.map(h => (
                        <div key={h.id} className="horario-detail-card">
                          <div className="horario-card-header">
                            <div>
                              <h4>{h.nombre}</h4>
                              <p className="horario-desc">{h.descripcion || 'Sin descripción'}</p>
                            </div>
                            <div className="horario-actions">
                              <button className="btn-icon-detail text-primary" onClick={() => handleOpenHorarioModal(h)}>
                                <Edit2 size={16} />
                              </button>
                              <button className="btn-icon-detail text-danger" onClick={() => handleDeleteHorario(h.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="horario-days-summary">
                            <h5>Rangos diarios configurados:</h5>
                            <div className="days-ranges-list">
                              {h.detalles && h.detalles.map(d => (
                                <div key={d.id} className="day-range-row">
                                  <span className="day-label-pill capitalize">{d.dia_semana}</span>
                                  <div className="time-range-box">
                                    <span className="time-badge input-badge">Entrada: {d.hora_inicio_entrada.substring(0, 5)} - {d.hora_fin_entrada.substring(0, 5)}</span>
                                    <span className="time-badge output-badge">Salida: {d.hora_inicio_salida.substring(0, 5)} - {d.hora_fin_salida.substring(0, 5)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="horario-card-footer">
                            <Users size={16} />
                            <span>{h.usuario_count} operadores / asesores asignados</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 2: USUARIOS CON HORARIO --- */}
              {activeTab === 'con_horario' && (
                <div className="con-horarios-tab">
                  {usuariosConHorario.length === 0 ? (
                    <div className="empty-state-tab">
                      <UserCheck size={48} className="empty-icon-tab" />
                      <h3>Ningún usuario asignado</h3>
                      <p>Asigna turnos ya configurados al personal operativo de esta sede.</p>
                      <button className="btn btn-primary mt-4" onClick={() => handleOpenAssignModal()}>
                        Asignar Horario Ahora
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive-p">
                      <table className="data-table-p">
                        <thead>
                          <tr>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Horario Turno</th>
                            <th>Vigente Desde</th>
                            <th>Vigente Hasta</th>
                            <th>Observación</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuariosConHorario.map(uh => (
                            <tr key={uh.id}>
                              <td>
                                <div className="font-semibold">{uh.usuario_nombre}</div>
                              </td>
                              <td><span className="rol-badge capitalize">{uh.usuario_rol}</span></td>
                              <td><div className="font-medium text-accent">{uh.horario_nombre}</div></td>
                              <td>{uh.vigente_desde}</td>
                              <td>{uh.vigente_hasta || 'Indefinido'}</td>
                              <td><span className="text-muted-p">{uh.observacion || '-'}</span></td>
                              <td>
                                <button 
                                  className="btn-icon-p text-danger"
                                  onClick={() => handleDeleteAssignment(uh.id)}
                                  title="Remover Horario"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 3: USUARIOS SIN HORARIO --- */}
              {activeTab === 'sin_horario' && (
                <div className="sin-horarios-tab">
                  {usuariosSinHorario.length === 0 ? (
                    <div className="empty-state-tab success-tab">
                      <UserCheck size={48} className="empty-icon-tab text-success" />
                      <h3>¡Planilla Completa!</h3>
                      <p>Todos los operarios y asesores de esta sede cuentan con un horario activo.</p>
                    </div>
                  ) : (
                    <div className="alert-tab-info">
                      <AlertTriangle size={18} />
                      <span><strong>Atención:</strong> Los usuarios sin horario asignado tienen bloqueada la marcación de asistencia en la app móvil.</span>
                    </div>
                  )}

                  {usuariosSinHorario.length > 0 && (
                    <div className="table-responsive-p mt-4">
                      <table className="data-table-p">
                        <thead>
                          <tr>
                            <th>Nombre Operativo</th>
                            <th>Rol</th>
                            <th>Estado Marcación</th>
                            <th>Acción Rápida</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuariosSinHorario.map(u => (
                            <tr key={u.id}>
                              <td>
                                <div className="font-semibold">{u.nombre_completo}</div>
                                <small className="text-muted-p">{u.email}</small>
                              </td>
                              <td><span className="rol-badge capitalize">{u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador'}</span></td>
                              <td>
                                <span className="status-badge invalid">Marcación Bloqueada</span>
                              </td>
                              <td>
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenAssignModal(u)}
                                >
                                  Asignar Turno
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 4: INTERCAMBIOS --- */}
              {activeTab === 'intercambios' && (
                <div className="intercambios-tab">
                  <div className="tab-action-row mb-4">
                    <button className="btn btn-primary" onClick={handleOpenSwapModal}>
                      <Plus size={16} />
                      Registrar Intercambio Temporal
                    </button>
                  </div>

                  {intercambios.length === 0 ? (
                    <div className="empty-state-tab">
                      <CalendarRange size={48} className="empty-icon-tab" />
                      <h3>Sin intercambios registrados</h3>
                      <p>Use intercambios temporales si dos operarios realizarán cambios de turno para un día específico.</p>
                    </div>
                  ) : (
                    <div className="table-responsive-p">
                      <table className="data-table-p">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Solicitante (A)</th>
                            <th>Reemplazo (B)</th>
                            <th>Turno Orig (A)</th>
                            <th>Turno Orig (B)</th>
                            <th>Motivo / Auditoría</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {intercambios.map(i => (
                            <tr key={i.id}>
                              <td><strong>{i.fecha_intercambio}</strong></td>
                              <td><div className="font-semibold">{i.usuario_solicitante_nombre}</div></td>
                              <td><div className="font-semibold">{i.usuario_reemplazo_nombre}</div></td>
                              <td><span className="text-accent">{i.horario_solicitante_original_nombre || 'Sede Respaldo'}</span></td>
                              <td><span className="text-accent">{i.horario_reemplazo_original_nombre || 'Sede Respaldo'}</span></td>
                              <td>
                                <div className="motivo-box-info">
                                  <p className="motivo-p font-medium">Motivo: {i.motivo}</p>
                                  <small className="audit-span">Reg. por: {i.registrado_por_nombre}</small>
                                </div>
                              </td>
                              <td>
                                <button 
                                  className="btn-icon-p text-danger"
                                  onClick={() => handleDeleteSwap(i.id)}
                                  title="Anular Intercambio"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CREAR/EDITAR HORARIO ================= */}
      {isHorarioModalOpen && (
        <div className="modal-overlay">
          {/* Modal shell: flex-column, max 90vh, no overflow */}
          <div className="hm-shell">

            {/* ── HEADER FIJO ── */}
            <div className="hm-header">
              <h2>{currentHorario ? 'Editar Horario Detallado' : 'Crear Nuevo Horario'}</h2>
              <button className="btn-icon" onClick={() => setIsHorarioModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* ── BODY CON SCROLL — form semántico ocupa sólo el body ── */}
            <form id="horario-form" onSubmit={handleSaveHorario} className="hm-body">

              <div className="form-group">
                <label>Nombre del Horario/Turno *</label>
                <input
                  type="text"
                  value={horarioForm.nombre}
                  onChange={(e) => setHorarioForm(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  className="input-field"
                  placeholder="Ej. Turno Mañana Flexible"
                />
              </div>

              <div className="form-group">
                <label>Descripción / Comentario</label>
                <input
                  type="text"
                  value={horarioForm.descripcion}
                  onChange={(e) => setHorarioForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="input-field"
                  placeholder="Comentario sobre este turno"
                />
              </div>

              {/* SWITCH MODE */}
              <div className="schedule-mode-selector">
                <label className="section-label-modal">¿Cómo deseas configurar este horario?</label>
                <div className="flex gap-4 mt-2">
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
                    <div className="font-semibold text-sm">Horario General Único</div>
                    <small className="text-muted-p text-xs block mt-1">Mismas horas para todos los días seleccionados</small>
                  </button>
                  <button
                    type="button"
                    className={`btn-mode-select ${isCustomSchedule ? 'active' : ''}`}
                    onClick={() => setIsCustomSchedule(true)}
                  >
                    <div className="font-semibold text-sm">Personalizado por Días</div>
                    <small className="text-muted-p text-xs block mt-1">Configura diferentes horas por día de la semana</small>
                  </button>
                </div>
              </div>

              {/* TIMELINE EXPLANATION */}
              <div className="timeline-helper-card">
                <div className="helper-title flex items-center gap-1.5 text-xs font-semibold text-accent mb-2">
                  <Clock size={14} />
                  ¿Cómo funcionan los rangos de marcación?
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-p">
                  <div className="helper-item">
                    <span className="font-semibold text-success block">Rango de Entrada (Ingreso):</span>
                    <span>Lapso en el que el empleado puede marcar entrada puntual. Si marca después del fin, se registra como <strong>Tardanza</strong>.</span>
                  </div>
                  <div className="helper-item">
                    <span className="font-semibold text-warning block">Rango de Salida (Egreso):</span>
                    <span>Lapso establecido para registrar la salida de la jornada diaria.</span>
                  </div>
                </div>
              </div>

              {!isCustomSchedule ? (
                <div className="unified-schedule-block">
                  <div className="global-times-panel form-row">
                    <div className="form-group">
                      <label className="text-xs font-semibold text-success">Rango de Entrada de Trabajo *</label>
                      <div className="flex gap-2 items-center mt-1">
                        <input type="time" value={globalTimes.hora_inicio_entrada}
                          onChange={(e) => { const val = e.target.value; setGlobalTimes(prev => ({ ...prev, hora_inicio_entrada: val })); setHorarioForm(prev => { const updated = prev.detalles.map(d => ({ ...d, hora_inicio_entrada: val })); return { ...prev, detalles: updated }; }); }}
                          className="input-field" required step="1" />
                        <span className="text-muted-p text-xs">a</span>
                        <input type="time" value={globalTimes.hora_fin_entrada}
                          onChange={(e) => { const val = e.target.value; setGlobalTimes(prev => ({ ...prev, hora_fin_entrada: val })); setHorarioForm(prev => { const updated = prev.detalles.map(d => ({ ...d, hora_fin_entrada: val })); return { ...prev, detalles: updated }; }); }}
                          className="input-field" required step="1" />
                      </div>
                      <small className="form-hint text-xs mt-1 block">Ej. Entrada puntual de 08:00:00 a 09:00:00</small>
                    </div>
                    <div className="form-group">
                      <label className="text-xs font-semibold text-warning">Rango de Salida de Trabajo *</label>
                      <div className="flex gap-2 items-center mt-1">
                        <input type="time" value={globalTimes.hora_inicio_salida}
                          onChange={(e) => { const val = e.target.value; setGlobalTimes(prev => ({ ...prev, hora_inicio_salida: val })); setHorarioForm(prev => { const updated = prev.detalles.map(d => ({ ...d, hora_inicio_salida: val })); return { ...prev, detalles: updated }; }); }}
                          className="input-field" required step="1" />
                        <span className="text-muted-p text-xs">a</span>
                        <input type="time" value={globalTimes.hora_fin_salida}
                          onChange={(e) => { const val = e.target.value; setGlobalTimes(prev => ({ ...prev, hora_fin_salida: val })); setHorarioForm(prev => { const updated = prev.detalles.map(d => ({ ...d, hora_fin_salida: val })); return { ...prev, detalles: updated }; }); }}
                          className="input-field" required step="1" />
                      </div>
                      <small className="form-hint text-xs mt-1 block">Ej. Salida de 17:00:00 a 19:00:00</small>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="section-label-modal">Selecciona los días activos para este turno:</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {horarioForm.detalles.map((d, index) => (
                        <button key={d.dia_semana} type="button"
                          className={`day-selector-btn-pill capitalize ${d.activo ? 'active' : ''}`}
                          onClick={() => handleDayToggle(index)}>
                          <span className="capitalize">{d.dia_semana}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="custom-schedule-block">
                  <label className="section-label-modal">Configura horas individuales por día:</label>
                  <div className="days-configs-grid mt-2">
                    {horarioForm.detalles.map((d, index) => (
                      <div key={d.dia_semana} className={`day-config-card ${d.activo ? 'active' : ''}`}>
                        <div className="day-card-header">
                          <label className="checkbox-label flex items-center gap-2">
                            <input type="checkbox" checked={d.activo} onChange={() => handleDayToggle(index)} />
                            <span className="capitalize font-semibold">{d.dia_semana}</span>
                          </label>
                        </div>
                        {d.activo && (
                          <div className="day-card-times mt-3">
                            <div className="time-group">
                              <label>Entrada Rango</label>
                              <div className="flex gap-1 items-center">
                                <input type="time" value={d.hora_inicio_entrada} onChange={(e) => handleTimeChange(index, 'hora_inicio_entrada', e.target.value)} className="input-field-sm" required step="1" />
                                <span>a</span>
                                <input type="time" value={d.hora_fin_entrada} onChange={(e) => handleTimeChange(index, 'hora_fin_entrada', e.target.value)} className="input-field-sm" required step="1" />
                              </div>
                            </div>
                            <div className="time-group mt-2">
                              <label>Salida Rango</label>
                              <div className="flex gap-1 items-center">
                                <input type="time" value={d.hora_inicio_salida} onChange={(e) => handleTimeChange(index, 'hora_inicio_salida', e.target.value)} className="input-field-sm" required step="1" />
                                <span>a</span>
                                <input type="time" value={d.hora_fin_salida} onChange={(e) => handleTimeChange(index, 'hora_fin_salida', e.target.value)} className="input-field-sm" required step="1" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Asignación opcional al crear */}
              {!currentHorario && (
                <div className="assignment-section-modal">
                  <h4 className="section-label-modal">Asignar Inmediatamente a Usuarios (Opcional)</h4>
                  <p className="text-muted-p text-sm">Selecciona uno o más usuarios de la sede para asignarles este nuevo horario.</p>
                  {usuariosSede.length === 0 ? (
                    <p className="text-warning text-sm mt-2">No hay usuarios de rol Operador/Asesor en esta sede para asignar.</p>
                  ) : (
                    <>
                      <div className="user-search-wrapper mt-3 mb-2">
                        <input type="text" className="input-field text-sm"
                          placeholder="🔍 Buscar usuarios por nombre..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)} />
                      </div>
                      <div className="users-select-checklist-scroll mt-2">
                        {usuariosSede
                          .filter(u => u.nombre_completo.toLowerCase().includes(userSearchTerm.toLowerCase()))
                          .map(u => {
                            const isSelected = horarioForm.usuarios_asignados.includes(u.id);
                            return (
                              <label key={u.id} className={`user-select-row-p ${isSelected ? 'selected' : ''}`}>
                                <input 
                                  type="checkbox" 
                                  checked={isSelected} 
                                  onChange={() => handleToggleUserSelect(u.id)} 
                                  className="mr-2" 
                                />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm">{u.nombre_completo}</span>
                                  <span className="text-xs text-muted-p capitalize">{u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador'}</span>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                      {horarioForm.usuarios_asignados.length > 0 && (
                        <div className="form-row mt-4">
                          <div className="form-group">
                            <label>Vigente Desde *</label>
                            <input type="date" value={horarioForm.vigente_desde}
                              onChange={(e) => setHorarioForm(prev => ({ ...prev, vigente_desde: e.target.value }))}
                              required className="input-field" />
                          </div>
                          <div className="form-group">
                            <label>Vigente Hasta</label>
                            <input type="date" value={horarioForm.vigente_hasta}
                              onChange={(e) => setHorarioForm(prev => ({ ...prev, vigente_hasta: e.target.value }))}
                              className="input-field" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </form>

            {/* ── FOOTER FIJO — fuera del form, usa form="horario-form" ── */}
            <div className="hm-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsHorarioModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" form="horario-form" className="btn btn-primary">
                {currentHorario ? 'Guardar Cambios' : 'Crear y Asignar'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: ASIGNAR HORARIO EXISTENTE ================= */}
      {isAssignModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Asignar Horario</h2>
              <button className="btn-icon" onClick={() => setIsAssignModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="modal-form">
              <div className="form-group">
                <label>Horario/Turno a asignar *</label>
                <select
                  value={assignForm.horario}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, horario: e.target.value }))}
                  required
                  className="input-field"
                >
                  <option value="" disabled>Seleccione un horario</option>
                  {horarios.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Seleccionar Usuarios *</label>
                <div className="users-select-checklist mt-2 max-h-48 overflow-y-auto border p-2 rounded">
                  {usuariosSede.map(u => {
                    const isSelected = assignForm.usuarios.includes(u.id);
                    return (
                      <div 
                        key={u.id}
                        className={`user-select-row-p ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleAssignUser(u.id)}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          readOnly 
                          className="mr-2"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{u.nombre_completo}</span>
                          <span className="text-xs text-muted-p capitalize">{u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-row mt-3">
                <div className="form-group w-full md:w-1/2">
                  <label>Vigente Desde *</label>
                  <input
                    type="date"
                    value={assignForm.vigente_desde}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, vigente_desde: e.target.value }))}
                    required
                    className="input-field"
                  />
                </div>
                <div className="form-group w-full md:w-1/2">
                  <label>Vigente Hasta</label>
                  <input
                    type="date"
                    value={assignForm.vigente_hasta}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, vigente_hasta: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group mt-3">
                <label>Observación</label>
                <input
                  type="text"
                  value={assignForm.observacion}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, observacion: e.target.value }))}
                  className="input-field"
                  placeholder="Detalle de asignación"
                />
              </div>

              <div className="modal-footer mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTRAR INTERCAMBIO ================= */}
      {isSwapModalOpen && (
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
                    usuario_reemplazo: prev.usuario_reemplazo === e.target.value ? '' : prev.usuario_reemplazo
                  }))}
                  required
                  className="input-field"
                >
                  <option value="" disabled>Seleccione al solicitante</option>
                  {usuariosSede.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre_completo} ({u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador'})</option>
                  ))}
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
                  {usuariosSede
                    .filter(u => u.id !== parseInt(swapForm.usuario_solicitante))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.nombre_completo} ({u.rol_info?.nombre || u.rol?.nombre || u.cargo || 'Operador'})</option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group mt-3">
                <label>Fecha de Intercambio *</label>
                <input
                  type="date"
                  value={swapForm.fecha_intercambio}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, fecha_intercambio: e.target.value }))}
                  required
                  className="input-field"
                />
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
        </div>
      )}

    </MainLayout>
  );
};

export default GestionJornada;
