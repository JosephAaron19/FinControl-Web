import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './MainLayout.css';

const MainLayout = ({ children, title, subtitle }) => {
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || 'Usuario');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Obtener solo el primer nombre con seguridad
          const firstName = data.nombre_completo?.split(' ')[0] || 'Usuario';
          setUserName(firstName);
          localStorage.setItem('user_name', firstName);
          localStorage.setItem('user_role', data.rol_info?.codigo || '');
        }
      } catch (err) {
        console.error('Error fetching profile in layout:', err);
      }
    };

    // Solo pedir si no tenemos el nombre o para asegurar que esté fresco
    fetchProfile();
  }, []);

  return (
    <div className="main-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menú">
              <Menu size={24} />
            </button>
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-subtitle">{subtitle}</p>
            </div>
          </div>
          <div className="user-profile">
            <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
            <span>{userName}</span>
          </div>
        </header>
        <div className="layout-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
