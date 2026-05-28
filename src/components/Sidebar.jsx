import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, Activity, Settings, MapPin, Calendar, X } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (onClose) onClose();
    navigate('/login');
  };

  const userRole = (localStorage.getItem('user_role') || '').toUpperCase();
  const isOperativo = userRole === 'OPERADOR' || userRole === 'ASESOR';
  const isAdmin = userRole === 'SUPERADMIN' || userRole === 'GERENTE' || userRole === 'SUPERVISOR' || userRole === 'ADMIN';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="flex items-center gap-3">
            <div className="logo-small"></div>
            <h2>FinControl</h2>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {isAdmin && (
            <>
              <NavLink to="/dashboard" onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/sedes" onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <MapPin size={20} />
                <span>Sedes</span>
              </NavLink>
              <NavLink to="/usuarios" onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Users size={20} />
                <span>Usuarios</span>
              </NavLink>
            </>
          )}

          <NavLink to="/actividad" onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Activity size={20} />
            <span>{isOperativo ? 'Mi Actividad' : 'Monitoreo'}</span>
          </NavLink>

          {isAdmin && (
            <NavLink to="/jornada" onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              <span>Gestión Jornada</span>
            </NavLink>
          )}

          <NavLink to="/historial-jornadas" onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            <span>{isOperativo ? 'Mi Historial' : 'Historial General'}</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
