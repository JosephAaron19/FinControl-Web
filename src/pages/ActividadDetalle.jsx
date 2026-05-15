import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Clock, AlertTriangle, MapPin, CheckCircle, ArrowLeft, Battery, Crosshair, Wifi, X } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import useWebSockets from '../hooks/useWebSockets';
import './ActividadDetalle.css';

const API_URL = import.meta.env.VITE_API_URL;

const ActividadDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
        alert('Error al cargar el detalle del usuario');
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
        <div className="mb-4 flex justify-between items-center">
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => navigate('/actividad')}>
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

        {/* Grid de Resumen Solicitado */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon-wrapper bg-blue">
              <Clock size={24} />
            </div>
            <div className="kpi-info">
              <h3>Última Ubicación</h3>
              <p className="kpi-value">{formatTime(resumen_gps.ultima_hora)}</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper bg-green">
              <Battery size={24} />
            </div>
            <div className="kpi-info">
              <h3>Batería</h3>
              <p className="kpi-value">{resumen_gps.ultima_bateria ? `${resumen_gps.ultima_bateria}%` : '-'}</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper bg-yellow">
              <Crosshair size={24} />
            </div>
            <div className="kpi-info">
              <h3>Precisión</h3>
              <p className="kpi-value">{resumen_gps.ultima_precision ? `${resumen_gps.ultima_precision.toFixed(1)} m` : '-'}</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper bg-red">
              <AlertTriangle size={24} />
            </div>
            <div className="kpi-info">
              <h3>Estado</h3>
              <p className="kpi-value">{resumen_gps.es_fuera_de_zona ? 'Fuera de Zona' : 'Dentro de Zona'}</p>
              <span className="kpi-subtext">{resumen_gps.puntos_fuera_zona} puntos fuera de zona</span>
            </div>
          </div>
        </div>

        {/* Sección de Jornada y Puntos */}
        <div className="detalle-content-grid">
          
          {/* Columna Izquierda: Jornada y Timeline */}
          <div className="detalle-left-col">
            
            {/* Tarjeta de Jornada */}
            <div className="card mb-4">
              <div className="card-header">
                <h2>Estado de Jornada</h2>
                <span className={`status-badge ${asistencia.estado.toLowerCase().replace(' ', '-')}`}>
                  {asistencia.estado}
                </span>
              </div>
              <div className="jornada-times">
                <div className="time-item">
                  <span className="time-label">Entrada</span>
                  <span className="time-value">{formatTime(asistencia.hora_entrada)}</span>
                </div>
                <div className="time-item">
                  <span className="time-label">Inicio Break</span>
                  <span className="time-value">{formatTime(asistencia.hora_inicio_break)}</span>
                </div>
                <div className="time-item">
                  <span className="time-label">Fin Break</span>
                  <span className="time-value">{formatTime(asistencia.hora_fin_break)}</span>
                </div>
                <div className="time-item">
                  <span className="time-label">Salida</span>
                  <span className="time-value">{formatTime(asistencia.hora_salida)}</span>
                </div>
              </div>
            </div>

            {/* Tarjeta de Actividades de Campo (SOLO ASESORES) */}
            {isAsesor && (
              <div className="card mb-4">
                <div className="card-header">
                  <h2>Actividades de Campo</h2>
                  <span className="badge-count">{actividades_campo.length}</span>
                </div>
                {actividades_campo.length === 0 ? (
                  <div className="p-4 text-center text-muted">No se registraron actividades de campo en esta jornada.</div>
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
            <div className="card">
              <div className="card-header">
                <h2>Incidencias Reportadas</h2>
                <span className="badge-count">{incidencias.length}</span>
              </div>
              {incidencias.length === 0 ? (
                <div className="p-4 text-center text-muted">No hay incidencias reportadas hoy.</div>
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

          {/* Columna Derecha: Recorrido / Puntos GPS */}
          <div className="detalle-right-col">
            <div className="card">
              <div className="card-header">
                <h2>Recorrido (Puntos GPS)</h2>
                <span className="badge-count">{resumen_gps.total_puntos} puntos</span>
              </div>
              
              {puntos_gps.length === 0 ? (
                <div className="p-4 text-center text-muted">No hay puntos GPS registrados hoy.</div>
              ) : (
                <div className="table-responsive max-h-600">
                  <table className="data-table">
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
                        <tr key={p.id} className={p.es_fuera_de_zona ? 'row-alert' : ''}>
                          <td>{formatTime(p.fecha_hora)}</td>
                          <td className="text-sm">
                            {p.latitud?.toFixed(5) || 'N/A'}, {p.longitud?.toFixed(5) || 'N/A'}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <Battery size={14} />
                              {p.bateria_porcentaje ?? '-'}%
                            </div>
                          </td>
                          <td>{p.precision_metros?.toFixed(1) || '-'} m</td>
                          <td>
                            <span className={`status-badge ${p.es_fuera_de_zona ? 'invalid' : 'valid'}`}>
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
