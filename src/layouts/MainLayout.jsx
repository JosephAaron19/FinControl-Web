import Sidebar from '../components/Sidebar';
import './MainLayout.css';

const MainLayout = ({ children, title, subtitle, userName = "Admin" }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          <div className="user-profile">
            <div className="avatar">{userName.charAt(0)}</div>
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
