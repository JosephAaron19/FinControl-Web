import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  Clock, 
  MapPin,
  User,
  AlertCircle,
  Activity
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import useWebSockets from '../hooks/useWebSockets';
import './HistorialJornadas.css';

const API_URL = import.meta.env.VITE_API_URL;

const HistorialJornadas = () => {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedJornadaId, setSelectedJornadaId] = useState(null);
  const [jornadaDetalle, setJornadaDetalle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters for history
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: ''
  });

  const fetchHistorial = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('usuario', userId);
      if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);

      const res = await fetch(`${API_URL}/historial-jornadas/?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistorial(data);
      }
    } catch (err) {
      console.error('Error fetching historial:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchJornadaDetalle = useCallback(async (jornadaId) => {
    if (!jornadaId) return;
    setLoadingDetail(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/historial-jornadas/${jornadaId}/detalle/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJornadaDetalle(data);
      }
    } catch (err) {
      console.error('Error fetching jornada detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    setLoadingUsers(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/usuarios/?solo_operadores=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (err) {
      console.error('Error fetching usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // WebSocket handling
  const onSocketMessage = useCallback((data) => {
    if (data.type === 'attendance_update') {
      console.log('Update recibido en Historial');
      if (selectedUser && !selectedJornadaId) {
        fetchHistorial(selectedUser.id);
      } else if (selectedJornadaId) {
        fetchJornadaDetalle(selectedJornadaId);
      }
    }
  }, [selectedUser, selectedJornadaId, fetchHistorial, fetchJornadaDetalle]);

  useWebSockets(onSocketMessage);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchHistorial(user.id);
  };

  const handleJornadaSelect = (jornadaId) => {
    setSelectedJornadaId(jornadaId);
    fetchJornadaDetalle(jornadaId);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setHistorial([]);
    setSelectedJornadaId(null);
    setJornadaDetalle(null);
  };

  const handleBackToHistory = () => {
    setSelectedJornadaId(null);
    setJornadaDetalle(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    if (selectedUser) {
      fetchHistorial(selectedUser.id);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '-';
    return duration.split('.')[0];
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = usuarios.filter(u => 
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.dni.includes(searchTerm)
  );

  return (
    <MainLayout 
      title="Historial de Jornadas" 
      subtitle={
        selectedJornadaId ? `Detalle de Jornada ${jornadaDetalle ? '- ' + new Date(jornadaDetalle.fecha + 'T00:00:00').toLocaleDateString() : '...'}` :
        selectedUser ? `Historial de ${selectedUser.nombre_completo}` : 
        "Seleccione un usuario para ver su historial."
      }
    >
      <div className="historial-container">
        {!selectedUser ? (
          /* LEVEL 1: USER SELECTION */
          <div className="user-selection-view animate-in">
            <div className="selection-header card">
              <div className="search-wrapper">
                <Search size={20} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar usuario por nombre o DNI..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {loadingUsers ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando usuarios...</p>
              </div>
            ) : (
              <div className="users-grid">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="user-selection-card card"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="user-card-avatar">
                      {user.nombre_completo.charAt(0)}
                    </div>
                    <div className="user-card-info">
                      <h3>{user.nombre_completo}</h3>
                      <p><User size={14} /> {user.dni}</p>
                      <span className="user-card-sede">
                        <MapPin size={12} /> {user.sede_info?.nombre || 'Sin Sede'}
                      </span>
                    </div>
                    <ChevronRight size={20} className="arrow-icon" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !selectedJornadaId ? (
          /* LEVEL 2: JORNADA LIST FOR USER */
          <div className="history-detail-view animate-in">
            <div className="view-actions">
              <button className="btn-back" onClick={handleBackToUsers}>
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} /> Volver a usuarios
              </button>
            </div>

            <div className="card filters-card">
              <form onSubmit={applyFilters} className="filters-grid">
                <div className="filter-group">
                  <label><Calendar size={16} /> Desde</label>
                  <input type="date" name="fecha_inicio" value={filters.fecha_inicio} onChange={handleFilterChange} className="input-field" />
                </div>
                <div className="filter-group">
                  <label><Calendar size={16} /> Hasta</label>
                  <input type="date" name="fecha_fin" value={filters.fecha_fin} onChange={handleFilterChange} className="input-field" />
                </div>
                <div className="filter-actions">
                  <button type="submit" className="btn-primary"><Search size={18} /> Filtrar</button>
                </div>
              </form>
            </div>

            <div className="card results-card">
              <div className="results-header">
                <h2>Jornadas de {selectedUser.nombre_completo}</h2>
              </div>
              {loading ? (
                <div className="loading-state"><div className="spinner"></div><p>Cargando...</p></div>
              ) : historial.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Horas</th>
                        <th>Incidencias</th>
                        <th>GPS</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((item) => (
                        <tr key={item.id} onClick={() => handleJornadaSelect(item.id)} className="clickable-row">
                          <td>{new Date(item.fecha + 'T00:00:00').toLocaleDateString()}</td>
                          <td>{formatTime(item.hora_entrada)}</td>
                          <td>{formatTime(item.hora_salida)}</td>
                          <td><span className="duration-tag">{formatDuration(item.total_horas_trabajadas)}</span></td>
                          <td className="text-center">
                            {item.total_incidencias > 0 ? (
                              <span className="count-badge danger">{item.total_incidencias}</span>
                            ) : '-'}
                          </td>
                          <td className="text-center">
                            {item.total_puntos_gps > 0 ? (
                              <span className="count-badge info">{item.total_puntos_gps}</span>
                            ) : '-'}
                          </td>
                          <td><span className={`status-badge ${item.estado_jornada?.toLowerCase() || 'completada'}`}>{item.estado_jornada || 'Completada'}</span></td>
                          <td><ChevronRight size={18} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state"><AlertCircle size={48} /><p>No hay jornadas registradas.</p></div>
              )}
            </div>
          </div>
        ) : (
          /* LEVEL 3: JORNADA DETAIL VIEW */
          <div className="jornada-detail-view animate-in">
            <div className="view-actions">
              <button className="btn-back" onClick={handleBackToHistory}>
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} /> Volver al listado
              </button>
            </div>

            {loadingDetail ? (
              <div className="loading-state"><div className="spinner"></div><p>Cargando detalles...</p></div>
            ) : jornadaDetalle && (
              <div className="detail-layout">
                {/* Left Column: Summary & Events */}
                <div className="detail-main">
                  <div className="card summary-header-card">
                    <div className="summary-info">
                      <div className="summary-date">
                        <Calendar size={24} />
                        <div>
                          <h3>{new Date(jornadaDetalle.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                          <p>{jornadaDetalle.operador} - {jornadaDetalle.sede}</p>
                        </div>
                      </div>
                      <span className={`status-badge large ${jornadaDetalle.estado_jornada?.toLowerCase() || 'completada'}`}>
                        {jornadaDetalle.estado_jornada || 'Completada'}
                      </span>
                    </div>
                    
                    <div className="metrics-grid">
                      <div className="metric-item">
                        <Clock size={20} className="text-success" />
                        <div className="metric-val">
                          <span>Entrada</span>
                          <strong>{formatTime(jornadaDetalle.hora_entrada)}</strong>
                        </div>
                      </div>
                      <div className="metric-item">
                        <Clock size={20} className="text-danger" />
                        <div className="metric-val">
                          <span>Salida</span>
                          <strong>{formatTime(jornadaDetalle.hora_salida)}</strong>
                        </div>
                      </div>
                      <div className="metric-item">
                        <Activity size={20} />
                        <div className="metric-val">
                          <span>Horas Trabajadas</span>
                          <strong>{formatDuration(jornadaDetalle.total_horas_trabajadas)}</strong>
                        </div>
                      </div>
                      <div className="metric-item">
                        <Clock size={20} className="text-warning" />
                        <div className="metric-val">
                          <span>Total Descanso</span>
                          <strong>{formatDuration(jornadaDetalle.total_tiempo_break)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card events-timeline-card">
                    <h2>Cronología de la Jornada</h2>
                    <div className="timeline-v2">
                      {jornadaDetalle.eventos?.map((evt, idx) => (
                        <div key={idx} className="timeline-v2-item">
                          <div className="time-col">{formatTime(evt.fecha_hora)}</div>
                          <div className="marker-col"><div className={`marker-dot ${(evt.tipo_evento || 'info').toLowerCase()}`}></div></div>
                          <div className="content-col">
                            <h4>{(evt.tipo_evento || 'Evento').replace(/_/g, ' ')}</h4>
                            {evt.distancia_sede_metros > 0 && <p className="text-sm text-muted">A {parseFloat(evt.distancia_sede_metros).toFixed(0)}m de la sede</p>}
                            {evt.es_fuera_de_zona && <span className="warning-pill">Fuera de Zona</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GPS Points Table */}
                  <div className="card gps-points-card">
                    <div className="card-header-flex">
                      <h2>Recorrido GPS (Puntos Registrados)</h2>
                      <span className="badge-count">{jornadaDetalle.puntos_gps?.length || 0} puntos</span>
                    </div>
                    <div className="table-responsive max-h-400">
                      <table className="data-table small">
                        <thead>
                          <tr>
                            <th>Hora</th>
                            <th>Coordenadas</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...(jornadaDetalle.puntos_gps || [])].reverse().map((p, idx) => (
                            <tr key={idx} className={p.es_fuera_de_zona ? 'row-alert' : ''}>
                              <td>{formatTime(p.fecha_hora)}</td>
                              <td>{parseFloat(p.latitud).toFixed(5)}, {parseFloat(p.longitud).toFixed(5)}</td>
                              <td>
                                <span className={`status-badge small ${p.es_fuera_de_zona ? 'invalid' : 'valid'}`}>
                                  {p.es_fuera_de_zona ? 'Fuera' : 'OK'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column: Incidents & Map placeholder */}
                <div className="detail-side">
                  <div className="card incidents-list-card">
                    <h2>Reportes e Incidencias</h2>
                    {jornadaDetalle.incidencias.length > 0 ? (
                      <div className="incidents-stack">
                        {jornadaDetalle.incidencias?.map((inc, idx) => (
                          <div key={idx} className="incident-card-v2">
                            <div className="inc-header">
                              <strong>{inc.tipo_incidencia_0?.nombre || 'Incidencia'}</strong>
                              <span className="inc-time">{formatTime(inc.fecha_hora_reporte)}</span>
                            </div>
                            <p>{inc.descripcion}</p>
                            {inc.foto && (
                              <div className="inc-media">
                                <img 
                                  src={inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`} 
                                  alt="Evidencia" 
                                  onClick={() => window.open(inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`, '_blank')} 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-msg">No se reportaron incidencias.</p>
                    )}
                  </div>
                  
                  <div className="card map-placeholder-card">
                    <div className="map-header">
                      <h2>Ubicación Final</h2>
                      <MapPin size={20} className="text-primary" />
                    </div>
                    <div className="mini-map-mock">
                      <div className="mock-map-bg">
                        <MapPin size={40} className="pulse-pin" />
                      </div>
                      <p>Seguimiento de ruta completado</p>
                      <button className="btn-primary" onClick={() => navigate(`/actividad/usuario/${jornadaDetalle.id}`)}>
                        Ver Ruta en Mapa Interactivo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default HistorialJornadas;
