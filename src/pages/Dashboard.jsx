import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  PlusCircle,
  FileText,
  Settings
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    usuarios: 0, 
    asistencias: 0, 
    sedes: 0, 
    incidencias: 0 
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Parallel fetching for efficiency
        const [userRes, asisRes, sedeRes, incRes, actRes] = await Promise.all([
          fetch(`${API_URL}/usuarios/`, { headers }),
          fetch(`${API_URL}/asistencias/`, { headers }),
          fetch(`${API_URL}/sedes/`, { headers }),
          fetch(`${API_URL}/incidencias/`, { headers }),
          fetch(`${API_URL}/actividad/hoy/`, { headers })
        ]);

        const [users, asistencias, sedes, incidencias, actividad] = await Promise.all([
          userRes.json(),
          asisRes.json(),
          sedeRes.json(),
          incRes.json(),
          actRes.json()
        ]);
        
        setStats({
          usuarios: Array.isArray(users) ? users.length : 0,
          asistencias: Array.isArray(asistencias) ? asistencias.length : 0,
          sedes: Array.isArray(sedes) ? sedes.length : 0,
          incidencias: Array.isArray(incidencias) ? incidencias.length : 0
        });

        // Use top 5 for recent activity
        setRecentActivity(Array.isArray(actividad) ? actividad.slice(0, 5) : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  return (
    <MainLayout 
      title="Panel de Control" 
      subtitle="Visualización en tiempo real de la operación."
    >
      <div className="dashboard-content">
        {/* KPI Grid */}
        <div className="stats-grid">
          <div className="stat-card card animate-in">
            <div className="stat-icon-wrapper users">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Usuarios</span>
              <h3 className="stat-value">{loading ? '...' : stats.usuarios}</h3>
              <span className="stat-subtext">Registrados</span>
            </div>
            <div className="stat-chart-mini">
              <TrendingUp size={16} className="text-success" />
            </div>
          </div>
          
          <div className="stat-card card animate-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon-wrapper activity">
              <Activity size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Asistencias</span>
              <h3 className="stat-value">{loading ? '...' : stats.asistencias}</h3>
              <span className="stat-subtext">Histórico total</span>
            </div>
            <div className="stat-chart-mini">
              <TrendingUp size={16} className="text-success" />
            </div>
          </div>

          <div className="stat-card card animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon-wrapper sedes">
              <MapPin size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Sedes</span>
              <h3 className="stat-value">{loading ? '...' : stats.sedes}</h3>
              <span className="stat-subtext">Puntos de control</span>
            </div>
          </div>

          <div className="stat-card card animate-in" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon-wrapper alerts">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Incidencias</span>
              <h3 className="stat-value">{loading ? '...' : stats.incidencias}</h3>
              <span className="stat-subtext">Pendientes de revisión</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-main">
          {/* Main Visual Section */}
          <div className="dashboard-section main-viz card animate-in" style={{ animationDelay: '0.4s' }}>
            <div className="section-header">
              <h2>Tendencia de Asistencia</h2>
              <div className="header-actions">
                <button className="btn-tab active">Semanal</button>
                <button className="btn-tab">Mensual</button>
              </div>
            </div>
            <div className="viz-placeholder">
              {/* Mock CSS Chart */}
              <div className="chart-mockup">
                {[40, 70, 45, 90, 65, 80, 50].map((height, i) => (
                  <div key={i} className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ height: `${height}%` }}
                    >
                      <span className="bar-tooltip">{height}%</span>
                    </div>
                    <span className="bar-label">{['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section quick-actions card animate-in" style={{ animationDelay: '0.5s' }}>
            <div className="section-header">
              <h2>Acciones Rápidas</h2>
            </div>
            <div className="actions-grid">
              <button onClick={() => navigate('/usuarios')} className="action-item">
                <div className="action-icon"><PlusCircle /></div>
                <span>Nuevo Usuario</span>
              </button>
              <button onClick={() => navigate('/sedes')} className="action-item">
                <div className="action-icon"><MapPin /></div>
                <span>Gestionar Sedes</span>
              </button>
              <button onClick={() => navigate('/actividad')} className="action-item">
                <div className="action-icon"><FileText /></div>
                <span>Reportes</span>
              </button>
              <button onClick={() => navigate('/gestion-jornada')} className="action-item">
                <div className="action-icon"><Settings /></div>
                <span>Configuración</span>
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-secondary">
          {/* Recent Activity */}
          <div className="dashboard-section activity-feed card animate-in" style={{ animationDelay: '0.6s' }}>
            <div className="section-header">
              <h2>Actividad de Hoy</h2>
              <button className="text-btn" onClick={() => navigate('/actividad')}>Ver todo <ChevronRight size={16} /></button>
            </div>
            
            {loading ? (
              <div className="loading-state">Cargando actividad...</div>
            ) : recentActivity.length > 0 ? (
              <div className="activity-timeline">
                {recentActivity.map((act, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-icon">
                      <Clock size={14} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-user">{act.nombre_completo}</span>
                        <span className="timeline-time">{act.hora_entrada ? new Date(`2000-01-01T${act.hora_entrada}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                      </div>
                      <p className="timeline-desc">
                        Ingreso en <strong>{act.sede_nombre}</strong>
                      </p>
                      <span className={`status-tag ${act.estado_entrada?.toLowerCase() || 'valid'}`}>
                        {act.estado_entrada || 'Correcto'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Activity size={40} />
                <p>Sin actividad registrada hoy.</p>
              </div>
            )}
          </div>

          {/* Incidents Summary */}
          <div className="dashboard-section incidents-summary card animate-in" style={{ animationDelay: '0.7s' }}>
            <div className="section-header">
              <h2>Estado de Operación</h2>
            </div>
            <div className="operational-status">
              <div className="status-item">
                <div className="status-info">
                  <span>Personal Activo</span>
                  <span>85%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: '85%' }}></div></div>
              </div>
              <div className="status-item">
                <div className="status-info">
                  <span>Cumplimiento Horario</span>
                  <span>92%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill warning" style={{ width: '92%' }}></div></div>
              </div>
              <div className="status-item">
                <div className="status-info">
                  <span>Sedes Operativas</span>
                  <span>100%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill success" style={{ width: '100%' }}></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
