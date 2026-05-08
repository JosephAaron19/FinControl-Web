import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sedes from './pages/Sedes';
import Usuarios from './pages/Usuarios';
import Actividad from './pages/Actividad';
import ActividadDetalle from './pages/ActividadDetalle';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sedes" element={<Sedes />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/actividad" element={<Actividad />} />
          <Route path="/actividad/:id" element={<ActividadDetalle />} />
          {/* Default redirect to login for now */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
