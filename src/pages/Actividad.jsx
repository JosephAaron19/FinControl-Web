import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Clock, AlertTriangle, MapPin, CheckCircle, XCircle, RefreshCw, Coffee, Eye } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import useWebSockets from '../hooks/useWebSockets';
import './Actividad.css';

const API_URL = import.meta.env.VITE_API_URL;

const Actividad = () => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchActividad = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/actividad/hoy/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActividades(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching actividad:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSocketMessage = (data) => {
    if (data.type === 'attendance_update' || data.type === 'config_update') {
      console.log('Notificación recibida, actualizando datos...');
      fetchActividad();
    }
  };

  useWebSockets(onSocketMessage);

  useEffect(() => {
    fetchProfile();
    fetchActividad();
    
    // Auto-refresh cada 2 minutos como backup
    const interval = setInterval(fetchActividad, 120000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  // Determinar rol
  const rolNombre = userProfile?.rol_info?.nombre?.toLowerCase() || '';
  const rolCodigo = userProfile?.rol_info?.codigo || '';
  const isOperador = rolCodigo === 'OPERADOR';
  const isAsesor = rolCodigo === 'ASESOR';
  const isOperativo = isOperador || isAsesor;
  const isGerente = rolCodigo === 'GERENTE' || rolCodigo === 'SUPERVISOR';
  const isSuperadmin = rolCodigo === 'SUPERADMIN';

  // Cálculos para las tarjetas de resumen
  const totalOperativos = actividades.length;
  const activosHoy = actividades.filter(a => a.asistencia && a.asistencia.estado !== 'Sin Marcar').length;
  const sinMarcar = actividades.filter(a => !a.asistencia || a.asistencia.estado === 'Sin Marcar').length;
  const enBreak = actividades.filter(a => a.asistencia && a.asistencia.estado === 'En break').length;
  const enActividad = actividades.filter(a => a.actividad_actual).length;
  const fueraDeZona = actividades.filter(a => a.ultima_ubicacion?.distancia > (a.sede_info?.radio_metros || 500)).length;
  const conIncidencias = actividades.filter(a => a.incidencias > 0).length;

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  return (
    <MainLayout 
      title="Monitoreo de Actividad" 
      subtitle={isOperativo ? "Tu actividad del día de hoy." : "Estado de los operativos en tiempo real para el día de hoy."}
    >
      <div className="actividad-container">
        

        {/* Tarjetas de Resumen (KPIs) - Ocultar para Operadores */}
        {!isOperativo && (
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper bg-blue">
                <User size={24} />
              </div>
              <div className="kpi-info">
                <h3>Total Personal</h3>
                <p className="kpi-value">{totalOperativos}</p>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper bg-green">
                <CheckCircle size={24} />
              </div>
              <div className="kpi-info">
                <h3>Activos Hoy</h3>
                <p className="kpi-value">{activosHoy}</p>
                <span className="kpi-subtext">{sinMarcar} sin marcar</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper bg-yellow">
                <Coffee size={24} />
              </div>
              <div className="kpi-info">
                <h3>En Descanso</h3>
                <p className="kpi-value">{enBreak}</p>
                <span className="kpi-subtext">{enActividad} en actividad</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper bg-red">
                <AlertTriangle size={24} />
              </div>
              <div className="kpi-info">
                <h3>Fuera de Zona</h3>
                <p className="kpi-value">{fueraDeZona}</p>
                <span className="kpi-subtext">{conIncidencias} con incidencias</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Actividad */}
        <div className="actividad-table-wrapper card">
          <div className="card-header">
            <h2>{isOperativo ? "Mi Actividad" : "Detalle de Actividad"}</h2>
          </div>

          {loading && actividades.length === 0 ? (
            <div className="loading-state">Cargando actividad...</div>
          ) : actividades.length === 0 ? (
            <div className="empty-state">
              <User size={48} className="empty-icon" />
              <p>{isOperativo ? "No tienes actividad registrada hoy." : "No hay personal registrado o activo hoy."}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Sede</th>
                    <th>Marcaciones</th>
                    <th>Actividad Actual</th>
                    <th>GPS</th>
                    <th>Estado</th>
                    <th>Alertas</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {actividades.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.nombre_completo.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold">{user.nombre_completo}</div>
                            <div className="text-xs text-muted">{user.dni}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge mini ${user.rol_info?.codigo?.toLowerCase()}`}>
                          {user.rol_info?.nombre || '-'}
                        </span>
                      </td>
                      <td>{user.sede}</td>
                      <td>
                        <div className="time-stack">
                          <span title="Entrada">E: {formatTime(user.asistencia?.hora_entrada)}</span>
                          {user.asistencia?.hora_inicio_break && (
                            <span title="Break" className="text-xs text-warning">
                              B: {formatTime(user.asistencia?.hora_inicio_break)}
                            </span>
                          )}
                          <span title="Salida">S: {formatTime(user.asistencia?.hora_salida)}</span>
                        </div>
                      </td>
                      <td>
                        {user.rol_info?.codigo === 'ASESOR' ? (
                          <div className="actividad-cell">
                            {user.actividad_actual ? (
                              <div className="actividad-current">
                                <span className="actividad-label">En proceso:</span>
                                <span className="actividad-name">{user.actividad_actual.titulo}</span>
                                <span className="actividad-time">{formatTime(user.actividad_actual.hora_inicio_actividad)}</span>
                              </div>
                            ) : (
                              <span className="text-muted text-xs">Sin actividad en proceso</span>
                            )}
                            <div className="actividad-total">
                              Total: {user.total_actividades || 0}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className="gps-count">
                          {user.puntos_gps} pts
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className={`status-badge ${(user.asistencia?.estado || 'Sin Marcar').toLowerCase().replace(' ', '-')}`}>
                            {user.asistencia?.estado || 'Sin Marcar'}
                          </span>
                          {user.asistencia?.estado_puntualidad && user.asistencia.estado_puntualidad !== 'pendiente' && (
                             <span className={`status-badge small ${user.asistencia.estado_puntualidad}`}>
                               {punctualityLabels[user.asistencia.estado_puntualidad] || user.asistencia.estado_puntualidad}
                             </span>
                          )}
                          {user.asistencia?.estado_salida && user.asistencia.estado_salida !== 'pendiente' && (
                             <span className={`status-badge small ${user.asistencia.estado_salida}`}>
                               {exitStatusLabels[user.asistencia.estado_salida] || user.asistencia.estado_salida}
                             </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="alerts-cell">
                          {user.ultima_ubicacion?.distancia > (user.sede_info?.radio_metros || 500) && (
                            <span className="alert-badge warning" title="Fuera de Zona">
                              <MapPin size={14} />
                              FZ
                            </span>
                          )}
                          {user.incidencias > 0 && (
                            <span className="alert-badge danger" title={`${user.incidencias} Incidencias`}>
                              <AlertTriangle size={14} />
                              {user.incidencias} Inc.
                            </span>
                          )}
                          {!(user.ultima_ubicacion?.distancia > (user.sede_info?.radio_metros || 500)) && user.incidencias === 0 && user.asistencia && user.asistencia.estado !== 'Sin Marcar' && (
                            <span className="alert-badge success">
                              <CheckCircle size={14} />
                              OK
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn-icon text-primary" 
                          onClick={() => navigate(`/actividad/${user.id}`)}
                          title="Ver Detalle"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Actividad;
