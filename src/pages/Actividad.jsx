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
    if (data.notification_type === 'attendance_update' || data.notification_type === 'config_update') {
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
  const isOperador = rolNombre.includes('operador');
  const isGerente = rolNombre.includes('gerente') || rolNombre.includes('supervisor');
  const isSuperadmin = rolNombre.includes('superadmin');

  // Cálculos para las tarjetas de resumen
  const totalOperadores = actividades.length;
  const activosHoy = actividades.filter(a => a.estado !== 'Sin Marcar').length;
  const sinMarcar = actividades.filter(a => a.estado === 'Sin Marcar').length;
  const enBreak = actividades.filter(a => a.estado === 'En Break').length;
  const fueraDeZona = actividades.filter(a => a.fuera_de_zona).length;
  const conIncidencias = actividades.filter(a => a.incidencias > 0).length;

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <MainLayout 
      title="Monitoreo de Actividad" 
      subtitle={isOperador ? "Tu actividad del día de hoy." : "Estado de los operadores en tiempo real para el día de hoy."}
    >
      <div className="actividad-container">
        
        {/* Barra Superior con botón de refresco */}
        <div className="actividad-header-actions">
          <div className="last-updated">
            {lastUpdated && `Última actualización: ${lastUpdated.toLocaleTimeString()}`}
          </div>
          <button className="btn btn-secondary flex items-center gap-2" onClick={fetchActividad} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Tarjetas de Resumen (KPIs) - Ocultar para Operadores */}
        {!isOperador && (
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper bg-blue">
                <User size={24} />
              </div>
              <div className="kpi-info">
                <h3>Total Operadores</h3>
                <p className="kpi-value">{totalOperadores}</p>
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
                <h3>En Break</h3>
                <p className="kpi-value">{enBreak}</p>
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
            <h2>{isOperador ? "Mi Actividad" : "Detalle de Operadores"}</h2>
          </div>

          {loading && actividades.length === 0 ? (
            <div className="loading-state">Cargando actividad...</div>
          ) : actividades.length === 0 ? (
            <div className="empty-state">
              <User size={48} className="empty-icon" />
              <p>{isOperador ? "No tienes actividad registrada hoy." : "No hay operadores registrados o activos hoy."}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Operador</th>
                    <th>Sede</th>
                    <th>Entrada</th>
                    <th>Break</th>
                    <th>Salida</th>
                    <th>Puntos GPS</th>
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
                      <td>{user.sede}</td>
                      <td>{formatTime(user.hora_entrada)}</td>
                      <td>
                        {user.hora_inicio_break ? (
                          <span>{formatTime(user.hora_inicio_break)} - {formatTime(user.hora_fin_break)}</span>
                        ) : '-'}
                      </td>
                      <td>{formatTime(user.hora_salida)}</td>
                      <td>
                        <span className="gps-count">
                          {user.puntos_gps} pts
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.estado.toLowerCase().replace(' ', '-')}`}>
                          {user.estado}
                        </span>
                      </td>
                      <td>
                        <div className="alerts-cell">
                          {user.fuera_de_zona && (
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
                          {!user.fuera_de_zona && user.incidencias === 0 && user.estado !== 'Sin Marcar' && (
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
