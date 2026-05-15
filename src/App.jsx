import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sedes from './pages/Sedes';
import Usuarios from './pages/Usuarios';
import Actividad from './pages/Actividad';
import ActividadDetalle from './pages/ActividadDetalle';
import GestionJornada from './pages/GestionJornada';
import HistorialJornadas from './pages/HistorialJornadas';

// Componente para proteger rutas según el rol
const ProtectedRoute = ({ children, allowOperativos = false }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');
  const isOperativo = userRole === 'OPERADOR' || userRole === 'ASESOR';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si es operativo y la ruta no los permite, redirigir a su vista principal
  if (isOperativo && !allowOperativos) {
    return <Navigate to="/actividad" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Administrativas (Solo Admin/Gerente) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/sedes" element={
            <ProtectedRoute>
              <Sedes />
            </ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute>
              <Usuarios />
            </ProtectedRoute>
          } />
          <Route path="/jornada" element={
            <ProtectedRoute>
              <GestionJornada />
            </ProtectedRoute>
          } />

          {/* Rutas Compartidas (Operativos y Admin) */}
          <Route path="/actividad" element={
            <ProtectedRoute allowOperativos={true}>
              <Actividad />
            </ProtectedRoute>
          } />
          <Route path="/actividad/:id" element={
            <ProtectedRoute allowOperativos={true}>
              <ActividadDetalle />
            </ProtectedRoute>
          } />
          <Route path="/historial-jornadas" element={
            <ProtectedRoute allowOperativos={true}>
              <HistorialJornadas />
            </ProtectedRoute>
          } />

          {/* Default redirect to login for now */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
