import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ usuarios: 0, transacciones: 0 });
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
        
        // Fetch usuarios
        const userRes = await fetch('http://localhost:8000/api/usuarios/', { headers });
        const users = await userRes.json();
        
        // Fetch asistencias
        const asisRes = await fetch('http://localhost:8000/api/asistencias/', { headers });
        const asistencias = await asisRes.json();
        
        setStats({
          usuarios: users.length || 0,
          transacciones: asistencias.length || 0
        });

        // Use top 5 asistencias as recent activity
        setRecentActivity((asistencias.slice ? asistencias.slice(0, 5) : []));
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
      title="Resumen General" 
      subtitle="Bienvenido al panel de administración."
    >
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Usuarios</h3>
            <p className="stat-value">{loading ? '...' : stats.usuarios}</p>
            <span className="stat-trend positive">Actualizado</span>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon activity">
            <Activity size={24} />
          </div>
          <div className="stat-details">
            <h3>Asistencias</h3>
            <p className="stat-value">{loading ? '...' : stats.transacciones}</p>
            <span className="stat-trend positive">Totales</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card recent-activity">
        <h2>Asistencias Recientes</h2>
        {loading ? (
          <p>Cargando actividad...</p>
        ) : recentActivity.length > 0 ? (
          <ul className="activity-list">
            {recentActivity.map((act, index) => (
              <li key={index} className="activity-item">
                <strong>{act.sede_nombre || `Usuario ${act.usuario}`}</strong> marcó asistencia el {act.fecha} a las {act.hora_entrada ? new Date(act.hora_entrada).toLocaleTimeString() : 'N/A'} - Estado: <span className={`status-badge ${act.estado === 'Válido' ? 'valid' : 'invalid'}`}>{act.estado}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p>No hay actividad reciente para mostrar.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
