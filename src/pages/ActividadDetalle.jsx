import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  CheckCircle, 
  ArrowLeft, 
  Battery, 
  Crosshair, 
  Wifi, 
  X, 
  LogIn, 
  LogOut, 
  Coffee, 
  Calendar, 
  Shield, 
  Route, 
  FileText 
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import useWebSockets from '../hooks/useWebSockets';
import { useNotification } from '../context/NotificationContext';
import './ActividadDetalle.css';

const API_URL = import.meta.env.VITE_API_URL;

const ActividadDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchDetalle = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/actividad/usuario/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDetalle(data);
      } else {
        showNotification('Error al cargar el detalle del usuario', 'error');
        navigate('/actividad');
      }
    } catch (err) {
      console.error('Error fetching detalle:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSocketMessage = (data) => {
    // Si la actualización es para este usuario o es una actualización de configuración
    if (data.type === 'attendance_update' || data.type === 'config_update') {
      console.log('Notificación recibida en detalle, actualizando...');
      fetchDetalle();
    }
  };

  useWebSockets(onSocketMessage);

  useEffect(() => {
    fetchDetalle();
  }, [id, navigate]);

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading && !detalle) {
    return (
      <MainLayout title="Cargando..." subtitle="Obteniendo información del operador">
        <div className="loading-state">Cargando información...</div>
      </MainLayout>
    );
  }

  if (!detalle) return null;

  const { usuario, asistencia, resumen_gps, puntos_gps, incidencias, actividades_campo = [] } = detalle;
  const isAsesor = usuario.rol_codigo === 'ASESOR';
  const sinActividad = puntos_gps.length === 0 && incidencias.length === 0 && asistencia.estado === 'Sin Marcar' && actividades_campo.length === 0;

  return (
    <MainLayout 
      title={`Detalle de Actividad: ${usuario.nombre_completo}`} 
      subtitle={`DNI: ${usuario.dni} | Sede: ${usuario.sede}`}
    >
      <div className="detalle-container">
        
        {/* Botón Volver */}
        <div className="detalle-header-actions mb-4">
          <button className="btn-back-list" onClick={() => navigate('/actividad')}>
            <ArrowLeft size={16} />
            Volver al listado
          </button>
          
          {sinActividad && (
            <div className="alert-banner warning flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>El operador no registra ninguna actividad el día de hoy.</span>
            </div>
          )}
        </div>

        {/* Grid de Resumen */}
        <div className="activity-kpi-grid">
          {/* Card 1: Última Ubicación */}
          <div className="activity-kpi-card">
            <div className="kpi-icon-box bg-blue-50 text-blue-500">
              <MapPin size={22} />
            </div>
            <div className="kpi-text-info">
              <span className="kpi-label">Última ubicación</span>
              <span className="kpi-value">{resumen_gps.ultima_hora ? formatTime(resumen_gps.ultima_hora) : '-'}</span>
              <span className="kpi-subtext">
                {resumen_gps.ultima_hora ? 'Hora de última señal' : 'Sin datos disponibles'}
              </span>
            </div>
          </div>

          {/* Card 2: Batería */}
          <div className="activity-kpi-card">
            <div className="kpi-icon-box bg-emerald-50 text-emerald-500">
              <Battery size={22} />
            </div>
            <div className="kpi-text-info">
              <span className="kpi-label">Batería</span>
              <span className="kpi-value">{resumen_gps.ultima_bateria ? `${resumen_gps.ultima_bateria}%` : '-'}</span>
              <span className="kpi-subtext">
                {resumen_gps.ultima_bateria ? 'Nivel del dispositivo' : 'Sin datos disponibles'}
              </span>
            </div>
          </div>

          {/* Card 3: Precisión */}
          <div className="activity-kpi-card">
            <div className="kpi-icon-box bg-orange-50 text-orange-500">
              <Crosshair size={22} />
            </div>
            <div className="kpi-text-info">
              <span className="kpi-label">Precisión</span>
              <span className="kpi-value">
                {resumen_gps.ultima_precision ? `${resumen_gps.ultima_precision.toFixed(1)} m` : '-'}
              </span>
              <span className="kpi-subtext">
                {resumen_gps.ultima_precision ? 'Margen de error GPS' : 'Sin datos disponibles'}
              </span>
            </div>
          </div>

          {/* Card 4: Estado */}
          <div className="activity-kpi-card">
            <div className="kpi-icon-box bg-rose-50 text-rose-500">
              <AlertTriangle size={22} />
            </div>
            <div className="kpi-text-info">
              <span className="kpi-label">Estado</span>
              <div className="kpi-value-row">
                <span className="kpi-value">
                  {resumen_gps.es_fuera_de_zona ? 'Fuera de Zona' : 'Dentro de Zona'}
                </span>
                {!resumen_gps.es_fuera_de_zona ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <span className="kpi-subtext">
                {resumen_gps.puntos_fuera_zona || 0} puntos fuera de zona
              </span>
            </div>
          </div>
        </div>

        {/* Sección de Jornada y Puntos */}
        <div className="detalle-content-grid">
          
          {/* Columna Izquierda: Jornada, Actividades de Campo e Incidencias */}
          <div className="detalle-left-col">
            
            {/* Tarjeta de Jornada */}
            <div className="activity-card mb-4">
              <div className="activity-card-header">
                <div className="card-header-left">
                  <Calendar size={18} className="text-blue-500" />
                  <h2>Estado de Jornada</h2>
                </div>
                <span className={`status-badge-pill ${asistencia.estado.toLowerCase().replace(/\s+/g, '-')}`}>
                  {asistencia.estado}
                </span>
              </div>
              
              <div className="jornada-grid">
                <div className="jornada-grid-item">
                  <div className="jornada-icon-box bg-blue-50 text-blue-500">
                    <LogIn size={18} />
                  </div>
                  <div className="jornada-text-info">
                    <span className="jornada-label">Entrada</span>
                    <span className="jornada-value">{formatTime(asistencia.hora_entrada)}</span>
                  </div>
                </div>
                <div className="jornada-grid-item">
                  <div className="jornada-icon-box bg-orange-50 text-orange-500">
                    <Coffee size={18} />
                  </div>
                  <div className="jornada-text-info">
                    <span className="jornada-label">Inicio Break</span>
                    <span className="jornada-value">{formatTime(asistencia.hora_inicio_break)}</span>
                  </div>
                </div>
                <div className="jornada-grid-item">
                  <div className="jornada-icon-box bg-emerald-50 text-emerald-500">
                    <Coffee size={18} />
                  </div>
                  <div className="jornada-text-info">
                    <span className="jornada-label">Fin Break</span>
                    <span className="jornada-value">{formatTime(asistencia.hora_fin_break)}</span>
                  </div>
                </div>
                <div className="jornada-grid-item">
                  <div className="jornada-icon-box bg-rose-50 text-rose-500">
                    <LogOut size={18} />
                  </div>
                  <div className="jornada-text-info">
                    <span className="jornada-label">Salida</span>
                    <span className="jornada-value">{formatTime(asistencia.hora_salida)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Actividades de Campo (SOLO ASESORES) */}
            {isAsesor && (
              <div className="activity-card mb-4">
                <div className="activity-card-header">
                  <div className="card-header-left">
                    <MapPin size={18} className="text-purple-500" />
                    <h2>Actividades de Campo</h2>
                  </div>
                  <span className="badge-count-pill">{actividades_campo.length}</span>
                </div>
                {actividades_campo.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No se registraron actividades de campo en esta jornada.
                  </div>
                ) : (
                  <div className="actividades-timeline">
                    {actividades_campo.map((act, idx) => (
                      <div key={idx} className={`actividad-card ${act.estado_actividad?.toLowerCase()}`}>
                        <div className="actividad-header">
                          <div className="actividad-title-row">
                            <span className="actividad-tipo-tag">{act.tipo_actividad}</span>
                            <span className="actividad-hora">{formatTime(act.hora_inicio_actividad)} - {act.hora_fin_actividad ? formatTime(act.hora_fin_actividad) : 'En proceso'}</span>
                          </div>
                          <h3>{act.titulo}</h3>
                        </div>
                        
                        <div className="actividad-body">
                          <p className="actividad-desc">{act.descripcion}</p>
                          
                          <div className="actividad-details-grid">
                            <div className="detail-row">
                              <User size={14} />
                              <span><strong>Cliente:</strong> {act.cliente_nombre} ({act.cliente_documento})</span>
                            </div>
                            <div className="detail-row">
                              <MapPin size={14} />
                              <span><strong>Dirección:</strong> {act.direccion_actividad}</span>
                            </div>
                            {act.resultado_actividad && (
                              <div className="detail-row">
                                <CheckCircle size={14} />
                                <span><strong>Resultado:</strong> {act.resultado_actividad}</span>
                              </div>
                            )}
                          </div>

                          {/* Evidencias */}
                          <div className="actividad-evidencias">
                            {act.evidencia_inicio_url && (
                              <div className="evidencia-item">
                                <span className="evidencia-label">Inicio:</span>
                                <img 
                                  src={act.evidencia_inicio_url.startsWith('http') ? act.evidencia_inicio_url : `${API_URL.replace('/api', '')}${act.evidencia_inicio_url}`} 
                                  alt="Evidencia Inicio" 
                                  onClick={() => setSelectedImage(act.evidencia_inicio_url.startsWith('http') ? act.evidencia_inicio_url : `${API_URL.replace('/api', '')}${act.evidencia_inicio_url}`)}
                                />
                              </div>
                            )}
                            {act.evidencia_fin_url && (
                              <div className="evidencia-item">
                                <span className="evidencia-label">Fin:</span>
                                <img 
                                  src={act.evidencia_fin_url.startsWith('http') ? act.evidencia_fin_url : `${API_URL.replace('/api', '')}${act.evidencia_fin_url}`} 
                                  alt="Evidencia Fin" 
                                  onClick={() => setSelectedImage(act.evidencia_fin_url.startsWith('http') ? act.evidencia_fin_url : `${API_URL.replace('/api', '')}${act.evidencia_fin_url}`)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tarjeta de Incidencias */}
            <div className="activity-card">
              <div className="activity-card-header">
                <div className="card-header-left">
                  <AlertTriangle size={18} className="text-rose-500" />
                  <h2>Incidencias Reportadas</h2>
                </div>
                <span className="badge-count-pill alert">{incidencias.length}</span>
              </div>
              
              {incidencias.length === 0 ? (
                <div className="empty-state-block">
                  <div className="empty-state-illustration-box bg-sky-50 text-sky-500">
                    <FileText size={32} />
                    <CheckCircle className="illustration-sub-badge bg-white text-emerald-500" size={16} />
                  </div>
                  <h3>No hay incidencias reportadas hoy.</h3>
                  <p>Todo en orden.</p>
                </div>
              ) : (
                <div className="incidencias-list">
                  {incidencias.map(inc => (
                    <div key={inc.id} className={`incidencia-item ${inc.estado?.toLowerCase()}`}>
                      <div className="incidencia-header">
                        <span className="incidencia-tipo">{inc.tipo}</span>
                        <span className="incidencia-hora">{formatTime(inc.fecha_hora_reporte)}</span>
                      </div>
                      <p className="incidencia-desc">{inc.descripcion}</p>
                      
                      {inc.foto && (
                        <div className="incidencia-foto-wrapper">
                          <img 
                            src={inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`} 
                            alt="Evidencia" 
                            className="incidencia-thumbnail"
                            onClick={() => setSelectedImage(inc.foto.startsWith('http') ? inc.foto : `${API_URL.replace('/api', '')}${inc.foto}`)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Recorrido / Puntos GPS & Resumen del día */}
          <div className="detalle-right-col">
            
            {/* Tarjeta de Recorrido */}
            <div className="activity-card mb-4">
              <div className="activity-card-header">
                <div className="card-header-left">
                  <MapPin size={18} className="text-blue-500" />
                  <h2>Recorrido (Puntos GPS)</h2>
                </div>
                <span className="badge-count-pill">{puntos_gps.length} puntos</span>
              </div>
              
              {puntos_gps.length === 0 ? (
                <div className="empty-state-dashed-box">
                  <div className="map-illustration-box">
                    <div className="map-circle bg-blue-50 text-blue-500">
                      <MapPin size={32} />
                    </div>
                    <svg className="dotted-trail" width="120" height="40" viewBox="0 0 120 40" fill="none">
                      <path d="M10 20C30 5 50 35 70 20C90 5 110 20 110 20" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6"/>
                    </svg>
                  </div>
                  <h3>No hay puntos GPS registrados hoy.</h3>
                  <p>Aún no se han registrado recorridos GPS para esta actividad.</p>
                </div>
              ) : (
                <div className="table-responsive-detail max-h-600">
                  <table className="data-table-detail">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Coordenadas</th>
                        <th>Batería</th>
                        <th>Precisión</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...puntos_gps].reverse().map(p => (
                        <tr key={p.id} className={p.es_fuera_de_zona ? 'row-alert-detail' : ''}>
                          <td className="time-col">{formatTime(p.fecha_hora)}</td>
                          <td className="coord-col">
                            {p.latitud?.toFixed(5) || 'N/A'}, {p.longitud?.toFixed(5) || 'N/A'}
                          </td>
                          <td className="battery-col">
                            <div className="battery-level-cell">
                              <Battery size={14} className="text-slate-400" />
                              <span>{p.bateria_porcentaje ?? '-'}%</span>
                            </div>
                          </td>
                          <td className="precision-col">{p.precision_metros?.toFixed(1) || '-'} m</td>
                          <td className="status-col">
                            <span className={`status-badge-pill-micro ${p.es_fuera_de_zona ? 'invalid' : 'valid'}`}>
                              {p.es_fuera_de_zona ? 'Fuera Zona' : 'OK'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tarjeta de Resumen del día */}
            <div className="activity-card">
              <div className="activity-card-header">
                <div className="card-header-left">
                  <Clock size={18} className="text-blue-500" />
                  <h2>Resumen del día</h2>
                </div>
              </div>
              
              <div className="resumen-dia-row">
                {/* Columna 1: Estado Actual */}
                <div className="resumen-col-item">
                  <div className={`resumen-circle-icon ${resumen_gps.es_fuera_de_zona ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {resumen_gps.es_fuera_de_zona ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div className="resumen-text-block">
                    <span className="resumen-label">Estado actual</span>
                    <span className={`resumen-value ${resumen_gps.es_fuera_de_zona ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {resumen_gps.es_fuera_de_zona ? 'Fuera de Zona' : 'Dentro de Zona'}
                    </span>
                  </div>
                </div>

                {/* Columna 2: Recorrido GPS */}
                <div className="resumen-col-item">
                  <div className="resumen-circle-icon bg-blue-50 text-blue-500">
                    <Route size={20} />
                  </div>
                  <div className="resumen-text-block">
                    <span className="resumen-label">Recorrido GPS</span>
                    <span className="resumen-value text-slate-800">
                      {puntos_gps.length} puntos
                    </span>
                  </div>
                </div>

                {/* Columna 3: Incidencias */}
                <div className="resumen-col-item">
                  <div className="resumen-circle-icon bg-purple-50 text-purple-500">
                    <Shield size={20} />
                  </div>
                  <div className="resumen-text-block">
                    <span className="resumen-label">Incidencias</span>
                    <span className="resumen-value text-slate-800">
                      {incidencias.length} reportadas
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Visor de Imágenes (Modal) */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setSelectedImage(null)}>
              <X size={24} />
            </button>
            <img src={selectedImage} alt="Evidencia Full" className="image-modal-img" />
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ActividadDetalle;
