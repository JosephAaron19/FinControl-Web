import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Clock,
  AlertTriangle,
  MapPin,
  CheckCircle,
  RefreshCw,
  Coffee,
  Search,
  ChevronDown,
  Calendar,
  Building,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import useWebSockets from '../hooks/useWebSockets';
import './Actividad.css';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
const API_URL = import.meta.env.VITE_API_URL || 'https://apifincontrol.finatech.com.pe/api';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getAvatarTheme = (name) => {
  const colors = [
    { bg: '#dcfce7', text: '#15803d' }, // Green
    { bg: '#f3e8ff', text: '#7e22ce' }, // Purple
    { bg: '#ffe4e6', text: '#be123c' }, // Rose
    { bg: '#fff7ed', text: '#ea580c' }, // Orange
    { bg: '#e0f2fe', text: '#0284c7' }, // Sky/Blue
    { bg: '#ecfeff', text: '#0891b2' }  // Cyan
  ];
  let sum = 0;
  if (name) {
    sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }
  return colors[sum % colors.length];
};

const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = value || placeholder;

  return (
    <div className={`custom-select-wrapper-monitoreo ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={selectRef}>
      <div
        className={`filter-pill-select-wrapper-monitoreo custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <Icon size={15} className="filter-pill-icon-blue" />
        <span className="custom-select-text">{selectedLabel}</span>
        <ChevronDown size={14} className={`filter-pill-chevron transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          <div
            className={`custom-select-option ${!value ? 'selected' : ''}`}
            onClick={() => { onChange(''); setIsOpen(false); }}
          >
            {placeholder}
          </div>
          {options.map((opt, idx) => (
            <div
              key={idx}
              className={`custom-select-option ${value === opt ? 'selected' : ''}`}
              onClick={() => { onChange(opt); setIsOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Actividad = () => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCentral, setSelectedCentral] = useState('');
  const [selectedSede, setSelectedSede] = useState('');
  const [selectedRol, setSelectedRol] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchActividad = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/actividad/hoy/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActividades(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching actividad:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSocketMessage = (data) => {
    if (data.type === 'attendance_update' || data.type === 'config_update') {
      console.log('Notificación recibida, actualizando datos...');
      fetchActividad();
    }
  };

  useWebSockets(onSocketMessage);

  useEffect(() => {
    fetchProfile();
    fetchActividad();

    // Auto-refresh cada 2 minutos como backup
    const interval = setInterval(fetchActividad, 120000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Determinar rol
  const rolCodigo = userProfile?.rol_info?.codigo || '';
  const isOperador = rolCodigo === 'OPERADOR';
  const isAsesor = rolCodigo === 'ASESOR';
  const isOperativo = isOperador || isAsesor;

  // Filtros aplicados localmente
  const filteredActividades = actividades.filter(a => {
    const nameMatch = (a.nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.dni || '').toLowerCase().includes(searchTerm.toLowerCase());

    const centralName = a.sede_info?.sede_central_nombre || 'Sin asignar';
    const centralMatch = !selectedCentral || centralName === selectedCentral;

    const sedeMatch = !selectedSede || a.sede === selectedSede;

    const rolName = (a.rol_info?.nombre || a.cargo || '').toUpperCase();
    const rolMatch = !selectedRol || rolName === selectedRol;

    return nameMatch && centralMatch && sedeMatch && rolMatch;
  });

  // Listas de opciones únicas para los filtros en cascada
  const uniqueCentrales = Array.from(new Set(actividades.map(a => a.sede_info?.sede_central_nombre || 'Sin asignar'))).sort();

  const uniqueSedes = Array.from(new Set(actividades
    .filter(a => !selectedCentral || (a.sede_info?.sede_central_nombre || 'Sin asignar') === selectedCentral)
    .map(a => a.sede)
    .filter(Boolean))).sort();

  const uniqueRoles = Array.from(new Set(actividades
    .filter(a => !selectedCentral || (a.sede_info?.sede_central_nombre || 'Sin asignar') === selectedCentral)
    .filter(a => !selectedSede || a.sede === selectedSede)
    .map(a => (a.rol_info?.nombre || a.cargo || '').toUpperCase())
    .filter(Boolean))).sort();

  // Paginación local
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredActividades.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentList = filteredActividades.slice(indexOfFirst, indexOfLast);

  // Resetear página actual si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCentral, selectedSede, selectedRol]);

  // Cálculos para las tarjetas de resumen
  const totalOperativos = actividades.length;
  const activosHoy = actividades.filter(a => a.asistencia && a.asistencia.estado !== 'Sin Marcar').length;
  const sinMarcar = totalOperativos - activosHoy;
  const enBreak = actividades.filter(a => a.asistencia && a.asistencia.estado === 'En Break').length;
  const enActividad = actividades.filter(a => a.actividad_actual).length;
  const fueraDeZona = actividades.filter(a => a.ultima_ubicacion?.distancia > (a.sede_info?.radio_metros || 500)).length;
  const conIncidencias = actividades.filter(a => a.incidencias > 0).length;

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFormattedTodayDate = () => {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const d = new Date();
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `Hoy, ${day} ${month} ${year}`;
  };

  const punctualityLabels = {
    'temprano': 'ENTRADA ANTICIPADA',
    'puntual': 'ENTRADA PUNTUAL',
    'tardanza': 'TARDANZA',
    'no_marco_entrada': 'NO MARCÓ ENTRADA',
    'pendiente': 'PENDIENTE'
  };

  const exitStatusLabels = {
    'temprano': 'SALIDA ANTICIPADA',
    'puntual': 'SALIDA PUNTUAL',
    'tardanza': 'SALIDA TARDÍA',
    'no_marco_salida': 'NO MARCÓ SALIDA',
    'pendiente': 'PENDIENTE'
  };

  return (
    <MainLayout
      title="Monitoreo de Actividad"
      subtitle={isOperativo ? "Tu actividad del día de hoy." : "Estado de los operativos en tiempo real para el día de hoy."}
    >
      <div className="actividad-container">

        {/* Tarjetas de Resumen (KPIs) - Ocultar para Operadores */}
        {!isOperativo && (
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper bg-blue">
                <User size={22} />
              </div>
              <div className="kpi-info">
                <h3>Total Personal</h3>
                <p className="kpi-value">{totalOperativos}</p>
                <span className="kpi-subtext">Personal programado hoy</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper bg-green">
                <CheckCircle size={22} />
              </div>
              <div className="kpi-info">
                <h3>Activos Hoy</h3>
                <p className="kpi-value">{activosHoy}</p>
                <span className="kpi-subtext">{sinMarcar} sin marcar</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper bg-yellow">
                <Coffee size={22} />
              </div>
              <div className="kpi-info">
                <h3>En Descanso</h3>
                <p className="kpi-value">{enBreak}</p>
                <span className="kpi-subtext">{enActividad} en actividad</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper bg-red">
                <AlertTriangle size={22} />
              </div>
              <div className="kpi-info">
                <h3>Fuera de Zona</h3>
                <p className="kpi-value">{fueraDeZona}</p>
                <span className="kpi-subtext">{conIncidencias} con incidencias</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Actividad */}
        <div className="actividad-table-wrapper card">
          <div className="card-header-monitoreo">
            <h2>{isOperativo ? "Mi Actividad" : "Detalle de Actividad"}</h2>

            {/* Barra de Filtros */}
            {!isOperativo && (
              <div className="filters-toolbar-monitoreo">
                {/* Filtro Fecha */}
                <div className="filter-pill-btn-monitoreo">
                  <Calendar size={15} className="filter-pill-icon-blue" />
                  <span className="filter-pill-text-monitoreo">{getFormattedTodayDate()}</span>
                  <ChevronDown size={14} className="filter-pill-chevron" />
                </div>

                {/* Filtro Central */}
                <CustomSelect
                  value={selectedCentral}
                  onChange={(val) => {
                    setSelectedCentral(val);
                    setSelectedSede('');
                    setSelectedRol('');
                  }}
                  options={uniqueCentrales}
                  placeholder="Sedes Centrales"
                  icon={Building}
                />

                {/* Filtro Sede */}
                <CustomSelect
                  value={selectedSede}
                  onChange={(val) => {
                    setSelectedSede(val);
                    setSelectedRol('');
                  }}
                  options={uniqueSedes}
                  placeholder="Sedes Operativas"
                  icon={MapPin}
                  disabled={!selectedCentral && uniqueSedes.length === 0}
                />

                {/* Filtro Rol */}
                <CustomSelect
                  value={selectedRol}
                  onChange={(val) => setSelectedRol(val)}
                  options={uniqueRoles}
                  placeholder="Todos los roles"
                  icon={User}
                  disabled={uniqueRoles.length === 0}
                />

                {/* Buscador */}
                <div className="search-bar-wrapper-monitoreo">
                  <Search size={15} className="search-bar-icon-monitoreo" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-bar-input-monitoreo"
                  />
                </div>
              </div>
            )}
          </div>

          {loading && actividades.length === 0 ? (
            <div className="loading-state-monitoreo">
              <RefreshCw className="animate-spin" size={24} />
              <span>Cargando actividad...</span>
            </div>
          ) : filteredActividades.length === 0 ? (
            <div className="empty-state-monitoreo">
              <User size={48} className="empty-icon-monitoreo" />
              <p>{isOperativo ? "No tienes actividad registrada hoy." : "No se encontraron operativos activos con los filtros aplicados."}</p>
            </div>
          ) : (
            <>
              <div className="table-responsive-monitoreo">
                <table className="data-table-monitoreo">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Sede</th>
                      <th>Marcaciones</th>
                      <th>Actividad Actual</th>
                      <th>GPS</th>
                      <th>Estado</th>
                      <th>Alertas</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentList.map(user => {
                      const avatarTheme = getAvatarTheme(user.nombre_completo);
                      const uRol = (user.rol_info?.nombre || user.cargo || '').toUpperCase();
                      const statusVal = user.asistencia?.estado || 'Sin Marcar';
                      const statusClass = statusVal.toLowerCase().replace(' ', '-');

                      const hasFz = user.ultima_ubicacion?.distancia > (user.sede_info?.radio_metros || 500);
                      const hasInc = user.incidencias > 0;
                      const hasAssistance = user.asistencia && user.asistencia.estado !== 'Sin Marcar';

                      return (
                        <tr key={user.id}>
                          {/* Usuario */}
                          <td>
                            <div className="user-cell-monitoreo">
                              <div
                                className="user-avatar-monitoreo"
                                style={{
                                  backgroundColor: avatarTheme.bg,
                                  color: avatarTheme.text
                                }}
                              >
                                {getInitials(user.nombre_completo)}
                              </div>
                              <div className="user-details-monitoreo">
                                <span className="user-name-monitoreo">{user.nombre_completo}</span>
                                <span className="user-dni-monitoreo">{user.dni}</span>
                              </div>
                            </div>
                          </td>

                          {/* Rol */}
                          <td>
                            <span className={`role-badge-monitoreo ${uRol.toLowerCase().includes('asesor') ? 'asesor' : 'operador'}`}>
                              {uRol}
                            </span>
                          </td>

                          {/* Sede */}
                          <td>
                            <span className="sede-text-monitoreo">{user.sede || '-'}</span>
                          </td>

                          {/* Marcaciones */}
                          <td>
                            <div className="time-stack-monitoreo">
                              <span title="Entrada">E: {user.asistencia?.hora_entrada ? formatTime(user.asistencia.hora_entrada) : '-'}</span>
                              {user.asistencia?.hora_inicio_break && (
                                <span title="Break" className="text-xs text-warning">
                                  B: {formatTime(user.asistencia.hora_inicio_break)}
                                </span>
                              )}
                              <span title="Salida">S: {user.asistencia?.hora_salida ? formatTime(user.asistencia.hora_salida) : '-'}</span>
                            </div>
                          </td>

                          {/* Actividad Actual */}
                          <td>
                            {user.rol_info?.codigo === 'ASESOR' ? (
                              <div className="actividad-cell-monitoreo">
                                {user.actividad_actual ? (
                                  <div className="actividad-current-monitoreo">
                                    <span className="actividad-label-monitoreo">En proceso:</span>
                                    <span className="actividad-name-monitoreo">{user.actividad_actual.titulo}</span>
                                    <span className="actividad-time-monitoreo">{formatTime(user.actividad_actual.hora_inicio_actividad)}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-monitoreo">-</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-monitoreo">-</span>
                            )}
                          </td>

                          {/* GPS capsule vertical */}
                          <td>
                            <div className="gps-capsule-monitoreo">
                              <span className="gps-number-monitoreo">{user.puntos_gps || 0}</span>
                              <span className="gps-label-monitoreo">pts</span>
                            </div>
                          </td>

                          {/* Estado */}
                          <td>
                            <div className="status-container-monitoreo">
                              <span className={`status-badge-monitoreo ${statusClass}`}>
                                {statusVal.toUpperCase()}
                              </span>

                              {/* Sub-badge de puntualidad */}
                              {user.asistencia?.estado_puntualidad && user.asistencia.estado_puntualidad !== 'pendiente' && (
                                <span className={`status-sub-badge-monitoreo ${user.asistencia.estado_puntualidad}`}>
                                  {punctualityLabels[user.asistencia.estado_puntualidad]}
                                </span>
                              )}
                              {/* Sub-badge de salida */}
                              {user.asistencia?.estado_salida && user.asistencia.estado_salida !== 'pendiente' && (
                                <span className={`status-sub-badge-monitoreo ${user.asistencia.estado_salida}`}>
                                  {exitStatusLabels[user.asistencia.estado_salida]}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Alertas */}
                          <td>
                            <div className="alerts-cell-monitoreo">
                              {hasFz && (
                                <span className="alert-badge-monitoreo warning" title="Fuera de Zona">
                                  <MapPin size={12} />
                                  <span>FZ</span>
                                </span>
                              )}
                              {hasInc && (
                                <span className="alert-badge-monitoreo danger" title={`${user.incidencias} Incidencias`}>
                                  <AlertTriangle size={12} />
                                  <span>{user.incidencias} Inc.</span>
                                </span>
                              )}
                              {!hasFz && !hasInc && hasAssistance && (
                                <span className="alert-badge-monitoreo success">
                                  <CheckCircle size={12} className="alert-success-icon" />
                                  <span>OK</span>
                                </span>
                              )}
                              {!hasAssistance && (
                                <span className="alert-badge-monitoreo ok-default">
                                  <CheckCircle size={12} className="alert-success-icon" />
                                  <span>OK</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Acciones (dots button) */}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn-action-more-monitoreo"
                              onClick={() => navigate(`/actividad/${user.id}`)}
                              title="Ver Detalle"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {!isOperativo && (
                <div className="table-pagination-footer-monitoreo">
                  <span className="pagination-legend-monitoreo">
                    Mostrando {indexOfFirst + 1} a {Math.min(indexOfLast, filteredActividades.length)} de {filteredActividades.length} resultados
                  </span>

                  <div className="pagination-buttons-monitoreo">
                    <button
                      className="btn-page-arrow-monitoreo"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      type="button"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`btn-page-number-monitoreo ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                        type="button"
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="btn-page-arrow-monitoreo"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      type="button"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Actividad;
