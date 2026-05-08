import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
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
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
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
              <label className="input-label" htmlFor="email">Correo Electrónico</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  id="email"
                  type="text"
                  className="input-field with-icon"
                  placeholder="admin / DNI"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type="password"
                  className="input-field with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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
