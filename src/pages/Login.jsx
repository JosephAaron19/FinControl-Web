import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dni: email, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_role', data.user_role || '');
      localStorage.setItem('user_name', data.user_name || '');
      
      const role = (data.user_role || '').toUpperCase();
      showNotification(`Bienvenido, ${data.user_name || 'Usuario'}`, 'success');
      if (role === 'OPERADOR' || role === 'ASESOR') {
        navigate('/actividad');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      showNotification(err.message === 'Credenciales inválidas' ? 'DNI o contraseña incorrectos' : 'Error al conectar con el servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background decorative elements */}
      <div className="glow-circle circle-1"></div>
      <div className="glow-circle circle-2"></div>
      
      <div className="login-content">
        <div className="login-header">
          <div className="logo-container">
            <ShieldCheck size={40} className="logo-icon" />
          </div>
          <h1>FinControl</h1>
          <p className="subtitle">Panel de Administración Web</p>
        </div>

        <div className="card login-card">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="input-label" htmlFor="email">Usuario</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  id="email"
                  type="text"
                  className="input-field with-icon"
                  placeholder="Ingrese su DNI"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={8}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-header">
                <label className="input-label" htmlFor="password">Contraseña</label>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input-field with-icon with-right-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

            <button 
              type="submit" 
              className="btn-primary login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
              {!isLoading && <ArrowRight size={20} />}
            </button>
          </form>
        </div>
        
        <p className="footer-text">
          Acceso exclusivo para personal autorizado.
        </p>
      </div>
    </div>
  );
};

export default Login;
