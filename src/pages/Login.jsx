import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="min-h-screen bg-slate-50 bg-cover bg-center bg-no-repeat text-slate-900 font-sans flex items-center justify-center relative overflow-hidden p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/bg-login.png')" }}>

      {/* Main Grid Wrapper */}
      <div className="w-full max-w-[1140px] xl:max-w-[1240px] mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">

          {/* LEFT BLOCK: Presentación Comercial */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left order-last lg:order-first">

            {/* Title & Description */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-[#0f172a] leading-[1.12]">
                Control operativo, <br />
                <span className="bg-gradient-to-r from-teal-500 to-[#2563eb] bg-clip-text text-transparent">
                  jornadas y trazabilidad
                </span> <br />
                en una sola plataforma.
              </h1>
              <p className="text-sm text-slate-500/90 max-w-xl leading-relaxed">
                Supervisa tu equipo, gestiona horarios, registra incidencias y obtén trazabilidad completa en tiempo real desde cualquier lugar.
              </p>
            </div>

            {/* Chips de funcionalidades */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">

              {/* Tracking GPS */}
              <div className="bg-white border border-slate-100/80 rounded-2xl p-2.5 shadow-sm flex items-center gap-2.5 hover:shadow-md hover:scale-[1.02] transition-all duration-200">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-50 text-teal-600 flex-shrink-0">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="text-[11px] font-bold text-slate-800 leading-none">Tracking GPS</h3>
                  <p className="text-[9px] text-slate-400 mt-1 truncate">Ubicación en tiempo real</p>
                </div>
              </div>

              {/* Control de jornadas */}
              <div className="bg-white border border-slate-100/80 rounded-2xl p-2.5 shadow-sm flex items-center gap-2.5 hover:shadow-md hover:scale-[1.02] transition-all duration-200">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 flex-shrink-0">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="text-[11px] font-bold text-slate-800 leading-none">Jornadas</h3>
                  <p className="text-[9px] text-slate-400 mt-1 truncate">Horarios y asistencia</p>
                </div>
              </div>

              {/* Incidencias */}
              <div className="bg-white border border-slate-100/80 rounded-2xl p-2.5 shadow-sm flex items-center gap-2.5 hover:shadow-md hover:scale-[1.02] transition-all duration-200">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-50 text-purple-600 flex-shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="text-[11px] font-bold text-slate-800 leading-none">Incidencias</h3>
                  <p className="text-[9px] text-slate-400 mt-1 truncate">Reporta y sigue</p>
                </div>
              </div>

              {/* Actividades */}
              <div className="bg-white border border-slate-100/80 rounded-2xl p-2.5 shadow-sm flex items-center gap-2.5 hover:shadow-md hover:scale-[1.02] transition-all duration-200">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 flex-shrink-0">
                  <ClipboardList className="w-4.5 h-4.5" />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="text-[11px] font-bold text-slate-800 leading-none">Actividades</h3>
                  <p className="text-[9px] text-slate-400 mt-1 truncate">Tareas y campo</p>
                </div>
              </div>

            </div>

            {/* Central Composition (Symmetric Layout - Scaled down) */}
            <div className="hidden md:flex h-[340px] relative w-full items-center justify-between overflow-visible py-2 select-none">
              
              {/* LEFT COLUMN: Stack of 2 Cards (Static, justified around) */}
              <div className="flex flex-col justify-around h-full py-2 z-10 w-[165px] xl:w-[180px]">
                
                {/* Equipo Activo */}
                <div className="bg-white border border-slate-100/80 rounded-[18px] p-3 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-2.5 w-full hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl flex-shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">Equipo activo</p>
                    <p className="text-lg xl:text-xl font-extrabold text-slate-800 leading-tight mt-0.5">128</p>
                    <p className="text-[9px] text-slate-500 leading-none mt-0.5">En jornada</p>
                  </div>
                </div>

                {/* Jornadas hoy */}
                <div className="bg-white border border-slate-100/80 rounded-[18px] p-3 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-2.5 w-full hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl flex-shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">Jornadas hoy</p>
                    <p className="text-lg xl:text-xl font-extrabold text-slate-800 leading-tight mt-0.5">156</p>
                    <p className="text-[9px] text-emerald-500 font-bold leading-none mt-0.5">+12% vs ayer</p>
                  </div>
                </div>

              </div>

              {/* CENTER SECTION: Symmetrical transparent graphic image */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img 
                  src="/central-composition.png" 
                  alt="Ubicación y personal" 
                  className="w-[285px] h-[285px] object-contain select-none pointer-events-none animate-float-medium" 
                />
              </div>

              {/* RIGHT COLUMN: Stack of 3 Cards (Static, justified between) */}
              <div className="flex flex-col justify-between h-full py-2 z-10 w-[165px] xl:w-[180px] items-end">
                
                {/* Incidencias abiertas */}
                <div className="bg-white border border-slate-100/80 rounded-[18px] p-3 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-2.5 w-full hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                  <div className="p-2 bg-red-50 text-red-500 rounded-xl flex-shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">Incidencias</p>
                    <p className="text-lg xl:text-xl font-extrabold text-slate-800 leading-tight mt-0.5">7</p>
                    <p className="text-[9px] text-slate-500 leading-none mt-0.5">Abiertas hoy</p>
                  </div>
                </div>

                {/* Actividades hoy */}
                <div className="bg-white border border-slate-100/80 rounded-[18px] p-3 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-2.5 w-full hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                  <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl flex-shrink-0">
                    <ClipboardList className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">Actividades</p>
                    <p className="text-lg xl:text-xl font-extrabold text-slate-800 leading-tight mt-0.5">24</p>
                    <p className="text-[9px] text-slate-500 leading-none mt-0.5">En progreso</p>
                  </div>
                </div>

                {/* Cumplimiento */}
                <div className="bg-white border border-slate-100/80 rounded-[18px] p-3 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-2.5 w-full hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                  <div className="p-2 bg-teal-50 text-teal-500 rounded-xl flex-shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">Cumplimiento</p>
                    <p className="text-lg xl:text-xl font-extrabold text-slate-800 leading-tight mt-0.5">94%</p>
                    <p className="text-[9px] text-slate-500 leading-none mt-0.5">Objetivo del día</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Security Footer bar */}
            <div className="bg-[#eef2f6]/60 border border-slate-100/85 rounded-xl p-3.5 flex items-center gap-3.5 max-w-md shadow-sm">
              <div className="w-9 h-9 bg-[#0ea5e9] text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800 text-xs">Tus datos y los de tu equipo siempre protegidos</h4>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">Seguridad, privacidad y cifrado de nivel empresarial.</p>
              </div>
            </div>

          </div>

          {/* RIGHT BLOCK: Formulario Login */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-white/95 backdrop-blur-md border border-slate-100/90 shadow-xl rounded-[28px] p-8 sm:p-10 xl:p-12 w-full max-w-[420px] transform hover:scale-[1.002] transition-all duration-300">

              {/* Logo & Header */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="mb-3 hover:scale-105 transition-transform duration-300">
                  <img src="/logo.png" alt="FinControl Logo" className="w-20 h-20 object-contain" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-0.5">
                  Fin<span className="text-[#0ea5e9]">Control</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 max-w-[280px] leading-relaxed">
                  Plataforma SaaS de control operativo y trazabilidad del personal.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6">

                {/* Username Input */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-700 block" htmlFor="email">
                    Usuario / DNI
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#0ea5e9] transition-colors duration-200" />
                    <input
                      id="email"
                      type="text"
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#0ea5e9] rounded-xl py-3.5 pl-12 pr-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all duration-200"
                      placeholder="Ingrese su DNI o correo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-slate-700 block" htmlFor="password">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#0ea5e9] transition-colors duration-200" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#0ea5e9] rounded-xl py-3.5 pl-12 pr-11 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-[#0ea5e9]/10 transition-all duration-200"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0ea5e9] transition-colors duration-200 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Only */}
                <div className="flex items-center text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-500 hover:text-slate-700 transition duration-150">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-350 text-[#0ea5e9] focus:ring-[#0ea5e9]/20 w-4 h-4 transition duration-200 cursor-pointer"
                    />
                    Recordarme
                  </label>
                </div>

                {/* Local Error Block */}
                {error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs text-center font-medium animate-pulse">
                    {error === 'Credenciales inválidas' ? 'DNI o contraseña incorrectos' : error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-teal-400 via-cyan-500 to-[#2563eb] hover:from-teal-500 hover:via-cyan-600 hover:to-[#1d4ed8] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-[#0ea5e9]/20 hover:shadow-[#0ea5e9]/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-4 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Ingresando...
                    </>
                  ) : (
                    <>
                      Iniciar sesión
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider with Secure Lock Text */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2.5 text-[9px] text-slate-400 flex items-center gap-2 font-bold tracking-wide uppercase">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    Acceso seguro y encriptado
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <p className="text-[9px] text-slate-400 mt-2 flex items-center justify-center gap-1 leading-normal max-w-[250px] mx-auto text-center font-normal">
                  <Lock className="w-3.5 h-3.5 text-slate-400/80 flex-shrink-0" />
                  Tu información está protegida con encriptación de nivel empresarial.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;
