import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  PlusCircle,
  FileText,
  Calendar,
  Filter,
  Compass,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import useWebSockets from '../hooks/useWebSockets';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// PREMIUM EMPTY STATE COMPONENT
// ==========================================
const EmptyState = ({ icon: Icon, title, description, exampleInfo }) => {
  return (
    <div className="dashboard-empty-state">
      <div className="empty-state-icon-wrapper">
        {Icon && <Icon size={24} className="empty-state-icon" />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {exampleInfo && (
        <div className="empty-state-example">
          <span className="example-tag">Información ejemplo:</span>
          <span className="example-text">{exampleInfo}</span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// CUSTOM SVG / HTML CHART COMPONENTS
// ==========================================

const DonutChart = ({ data, emptyIcon, emptyTitle, emptyDescription, emptyExample }) => {
  const total = data.reduce((sum, item) => sum + item.cantidad, 0);
  
  if (total === 0) {
    return (
      <EmptyState 
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        exampleInfo={emptyExample}
      />
    );
  }

  let accumulatedAngle = 0;
  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="donut-chart-container">
      <div className="donut-chart-svg-wrapper">
        <svg viewBox="0 0 140 140" width="100%" height="100%">
          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
          {data.map((item, idx) => {
            const percentage = (item.cantidad / total) * 100;
            const strokeLength = (percentage / 100) * circumference;
            const strokeOffset = circumference - strokeLength + (accumulatedAngle / 360) * circumference;
            accumulatedAngle -= (percentage / 100) * 360;

            return (
              <circle
                key={idx}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={item.color || '#3b82f6'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{
                  transition: 'stroke-dashoffset 0.8s ease-in-out',
                }}
              />
            );
          })}
          <text x="70" y="68" textAnchor="middle" dominantBaseline="middle" className="donut-total-num">
            {total}
          </text>
          <text x="70" y="85" textAnchor="middle" dominantBaseline="middle" className="donut-total-lbl">
            Total
          </text>
        </svg>
      </div>
      <div className="donut-legend">
        {data.map((item, idx) => (
          <div key={idx} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: item.color }} />
            <span className="legend-label">{item.estado || item.tipo}</span>
            <span className="legend-value">{item.cantidad} ({((item.cantidad / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarChart = ({ data, emptyIcon, emptyTitle, emptyDescription, emptyExample }) => {
  const maxVal = Math.max(...data.map(d => d.completa + d.incompleta + d.ausente), 1);
  const hasData = data.some(d => d.completa > 0 || d.incompleta > 0 || d.ausente > 0);

  if (!hasData) {
    return (
      <EmptyState 
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        exampleInfo={emptyExample}
      />
    );
  }

  const formatDateLabel = (dateStr) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bar-chart-container">
      <div className="bar-chart-bars">
        {data.map((d, i) => {
          const total = d.completa + d.incompleta + d.ausente;
          const hCompleta = total > 0 ? (d.completa / maxVal) * 100 : 0;
          const hIncompleta = total > 0 ? (d.incompleta / maxVal) * 100 : 0;
          const hAusente = total > 0 ? (d.ausente / maxVal) * 100 : 0;

          return (
            <div key={i} className="bar-column-wrapper">
              <div className="bar-stacked-track">
                {d.completa > 0 && (
                  <div 
                    className="bar-segment completa" 
                    style={{ height: `${hCompleta}%` }}
                  >
                    <span className="tooltip-text">Completas: {d.completa}</span>
                  </div>
                )}
                {d.incompleta > 0 && (
                  <div 
                    className="bar-segment incompleta" 
                    style={{ height: `${hIncompleta}%` }}
                  >
                    <span className="tooltip-text">Incompletas: {d.incompleta}</span>
                  </div>
                )}
                {d.ausente > 0 && (
                  <div 
                    className="bar-segment ausente" 
                    style={{ height: `${hAusente}%` }}
                  >
                    <span className="tooltip-text">Ausentes: {d.ausente}</span>
                  </div>
                )}
              </div>
              <span className="bar-label">{formatDateLabel(d.fecha)}</span>
            </div>
          );
        })}
      </div>
      <div className="bar-legend">
        <div className="legend-item"><span className="legend-dot completa" /><span>Completa</span></div>
        <div className="legend-item"><span className="legend-dot incompleta" /><span>Incompleta</span></div>
        <div className="legend-item"><span className="legend-dot ausente" /><span>Ausente</span></div>
      </div>
    </div>
  );
};

const HorizontalBarChart = ({ data, labelKey = 'sede', valueKey = 'cantidad', emptyIcon, emptyTitle, emptyDescription, emptyExample }) => {
  const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);

  if (total === 0) {
    return (
      <EmptyState 
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        exampleInfo={emptyExample}
      />
    );
  }

  return (
    <div className="horizontal-bar-chart">
      {data.map((item, idx) => {
        const percentage = ((item[valueKey] || 0) / maxVal) * 100;
        return (
          <div key={idx} className="horizontal-bar-row">
            <div className="bar-label-container">
              <span className="row-label">{item[labelKey] || 'Sin Etiqueta'}</span>
              <span className="row-value">{item[valueKey] || 0}</span>
            </div>
            <div className="bar-track">
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${percentage}%`,
                  background: 'linear-gradient(90deg, var(--color-primary), #3b82f6)' 
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================

const Dashboard = () => {
  const navigate = useNavigate();
  const [rango, setRango] = useState('hoy');
  const [selectedSede, setSelectedSede] = useState('');
  const [sedesList, setSedesList] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch list of active control centers/sedes
  const fetchSedes = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/sedes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedesList(Array.isArray(data) ? data.filter(s => s.activo) : []);
      }
    } catch (err) {
      console.error('Error fetching sedes:', err);
    }
  }, []);

  const fetchDashboardData = useCallback(async (currentRango, currentSede) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const url = `${API_URL}/dashboard/resumen/?rango=${currentRango}&sede=${currentSede || ''}`;
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else if (res.status === 403) {
        // Redirigir a vista operativa si es operador o asesor
        navigate('/actividad');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useWebSockets((data) => {
    if (data.type === 'attendance_update' || data.type === 'incident_update') {
      fetchDashboardData(rango, selectedSede);
    }
  });

  useEffect(() => {
    fetchSedes();
  }, [fetchSedes]);

  useEffect(() => {
    fetchDashboardData(rango, selectedSede);
  }, [rango, selectedSede, fetchDashboardData]);

  // Formatted date string for header
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading && !dashboardData) {
    return (
      <MainLayout title="Cargando Panel..." subtitle="Recuperando estado de la operación.">
        <div className="loading-state-fullscreen">
          <div className="spinner"></div>
          <p>Preparando estadísticas y gráficos en tiempo real...</p>
        </div>
      </MainLayout>
    );
  }

  const data = dashboardData || {
    resumen_general: { total_usuarios: 0, total_operadores: 0, total_asesores: 0, total_gerentes: 0, total_sedes: 0, sedes_activas: 0, usuarios_activos: 0, usuarios_inactivos: 0 },
    jornadas_dia: { jornadas_programadas: 0, jornadas_en_proceso: 0, jornadas_completas: 0, jornadas_incompletas: 0, jornadas_ausentes: 0, total_entradas_marcadas: 0, total_salidas_marcadas: 0 },
    puntualidad: { puntual: 0, tardanza: 0, temprano: 0, no_marco_entrada: 0 },
    salidas: { salida_en_rango: 0, salida_fuera_rango: 0, no_marco_salida: 0 },
    incidencias: { total_incidencias_hoy: 0, incidencias_pendientes: 0, incidencias_revisadas: 0, incidencias_por_tipo: [] },
    actividades: { actividades_hoy: 0, actividades_en_proceso: 0, actividades_finalizadas: 0, asesores_con_actividad: 0, asesores_sin_actividad: 0 },
    tracking: { usuarios_con_tracking_activo: 0, usuarios_fuera_de_zona: 0, total_puntos_gps_hoy: 0 },
    graficos: { asistencia_por_dia_semana: [], jornadas_por_estado: [], puntualidad_por_estado: [], incidencias_por_tipo: [], actividades_por_estado: [], usuarios_por_sede: [] },
    actividad_reciente: []
  };

  // Helper calculating progress percentages
  const realTotalEntradas = data.jornadas_dia.total_entradas_marcadas || 0;
  const puntualidadPct = realTotalEntradas > 0 
    ? Math.round(((data.puntualidad.puntual || 0) / realTotalEntradas) * 100) 
    : 0;
  
  const realTotalJornadas = (data.jornadas_dia.jornadas_completas || 0) + (data.jornadas_dia.jornadas_incompletas || 0) + (data.jornadas_dia.jornadas_ausentes || 0);
  const cumplimientoPct = realTotalJornadas > 0 
    ? Math.round(((data.jornadas_dia.jornadas_completas || 0) / realTotalJornadas) * 100) 
    : 0;

  // Map backend graph data with colors
  const rangeLabel = rango === 'hoy' ? 'hoy' : rango === 'semana' ? 'esta semana' : 'este mes';

  const puntualidadChartData = [
    { estado: 'Puntual', cantidad: data.puntualidad.puntual, color: 'var(--color-success)' },
    { estado: 'Tardanza', cantidad: data.puntualidad.tardanza, color: 'var(--color-warning)' },
    { estado: 'Temprano', cantidad: data.puntualidad.temprano, color: 'var(--color-info)' },
    { estado: 'No Marcó', cantidad: data.puntualidad.no_marco_entrada, color: 'var(--color-danger)' }
  ];

  const actividadesChartData = [
    { estado: 'En Proceso', cantidad: data.actividades.actividades_en_proceso, color: 'var(--color-warning)' },
    { estado: 'Finalizada', cantidad: data.actividades.actividades_finalizadas, color: 'var(--color-success)' }
  ];

  const incidenciasColors = ['#ef4444', '#fbbf24', '#a78bfa', '#f472b6', '#3b82f6', '#10b981'];
  const incidenciasChartData = (data.graficos.incidencias_por_tipo || []).map((item, idx) => ({
    estado: item.tipo,
    cantidad: item.cantidad,
    color: incidenciasColors[idx % incidenciasColors.length]
  }));

  // Helper function to render recent activity icons based on event type
  const renderActivityIcon = (tipo) => {
    switch(tipo) {
      case 'ENTRADA': return <Clock size={12} />;
      case 'SALIDA': return <Clock size={12} />;
      case 'INICIO_BREAK':
      case 'FIN_BREAK': return <Clock size={12} />;
      case 'INCIDENCIA': return <AlertTriangle size={12} />;
      case 'ACTIVIDAD_INICIO':
      case 'ACTIVIDAD_FIN': return <FileText size={12} />;
      case 'FUERA_DE_ZONA': return <Compass size={12} />;
      default: return <Activity size={12} />;
    }
  };

  return (
    <MainLayout 
      title="Panel de Control" 
      subtitle="Resumen operativo del sistema"
    >
      <div className="dashboard-content">
        
        {/* Header Filters */}
        <div className="dashboard-filter-bar animate-in">
          <div className="filter-group">
            <span className="filter-label">{getFormattedDate()}</span>
          </div>

          <div className="filter-group">
            <div className="flex items-center gap-2">
              <label className="filter-label">Sede:</label>
              <select 
                className="select-input" 
                value={selectedSede} 
                onChange={(e) => setSelectedSede(e.target.value)}
              >
                <option value="">Todas las Sedes</option>
                {sedesList.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div className="date-badge-group">
              <button 
                className={`date-btn ${rango === 'hoy' ? 'active' : ''}`}
                onClick={() => setRango('hoy')}
              >
                Hoy
              </button>
              <button 
                className={`date-btn ${rango === 'semana' ? 'active' : ''}`}
                onClick={() => setRango('semana')}
              >
                Semana
              </button>
              <button 
                className={`date-btn ${rango === 'mes' ? 'active' : ''}`}
                onClick={() => setRango('mes')}
              >
                Mes
              </button>
            </div>
          </div>
        </div>

        {/* 8 KPIs Grid */}
        <div className="stats-grid">
          <div className="stat-card animate-in" style={{ animationDelay: '0.05s' }}>
            <div className="stat-icon-wrapper blue">
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Usuarios Activos</span>
              <h3 className="stat-value">{data.resumen_general.usuarios_activos || 0}</h3>
              <span className="stat-subtext">De {data.resumen_general.total_usuarios || 0} registrados</span>
            </div>
          </div>

          <div className="stat-card animate-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon-wrapper purple">
              <Activity size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">En Proceso</span>
              <h3 className="stat-value">{data.jornadas_dia.jornadas_en_proceso || 0}</h3>
              <span className="stat-subtext">Activas {rangeLabel}</span>
            </div>
          </div>

          <div className="stat-card animate-in" style={{ animationDelay: '0.15s' }}>
            <div className="stat-icon-wrapper green">
              <TrendingUp size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Jornadas Completas</span>
              <h3 className="stat-value">{data.jornadas_dia.jornadas_completas || 0}</h3>
              <span className="stat-subtext">Cerradas {rangeLabel}</span>
            </div>
          </div>

          <div className="stat-card animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon-wrapper red">
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Ausencias</span>
              <h3 className="stat-value">{data.jornadas_dia.jornadas_ausentes || 0}</h3>
              <span className="stat-subtext">Registradas {rangeLabel}</span>
            </div>
          </div>

          <div className="stat-card animate-in" style={{ animationDelay: '0.25s' }}>
            <div className="stat-icon-wrapper yellow">
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Tardanzas</span>
              <h3 className="stat-value">{data.puntualidad.tardanza || 0}</h3>
              <span className="stat-subtext">Ingresos tarde {rangeLabel}</span>
            </div>
          </div>

          <div className="stat-card animate-in" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon-wrapper red">
              <AlertTriangle size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Incidencias Pendientes</span>
              <h3 className="stat-value">{data.incidencias.incidencias_pendientes || 0}</h3>
              <span className="stat-subtext">Pendientes por revisar</span>
            </div>
          </div>

          <div className="stat-card animate-in" style={{ animationDelay: '0.35s' }}>
            <div className="stat-icon-wrapper blue">
              <FileText size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Actividades</span>
              <h3 className="stat-value">{data.actividades.actividades_hoy || 0}</h3>
              <span className="stat-subtext">Reportadas {rangeLabel}</span>
            </div>
          </div>

          <div className="stat-card animate-in" style={{ animationDelay: '0.4s' }}>
            <div className="stat-icon-wrapper yellow">
              <Compass size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Fuera de Zona</span>
              <h3 className="stat-value">{data.tracking.usuarios_fuera_de_zona || 0}</h3>
              <span className="stat-subtext">Alertas de perímetro {rangeLabel}</span>
            </div>
          </div>
        </div>

        {/* Charts Layout Rows */}
        <div className="dashboard-charts-row">
          {/* Asistencia por dia de la semana */}
          <div className="dashboard-section animate-in" style={{ animationDelay: '0.45s' }}>
            <div className="section-header">
              <h2><Calendar size={18} /> Tendencia de Asistencia</h2>
            </div>
            <BarChart 
              data={data.graficos.asistencia_por_dia_semana || []} 
              emptyIcon={Calendar}
              emptyTitle="Aún no hay registros de asistencia"
              emptyDescription="Aquí se mostrará la evolución de jornadas completas, incompletas y ausentes por día."
              emptyExample="Evolución de jornadas marcadas con check-in y check-out correctos por día de la semana."
            />
          </div>

          {/* Puntualidad por Estado */}
          <div className="dashboard-section animate-in" style={{ animationDelay: '0.5s' }}>
            <div className="section-header">
              <h2><Clock size={18} /> Puntualidad</h2>
            </div>
            <DonutChart 
              data={puntualidadChartData} 
              emptyIcon={Clock}
              emptyTitle="Aún no hay marcaciones de entrada"
              emptyDescription="Aquí se visualizarán los usuarios puntuales, tardanzas y entradas no marcadas."
              emptyExample="Porcentaje de ingresos puntuales frente a ingresos fuera del horario de tolerancia establecido."
            />
          </div>
        </div>

        <div className="dashboard-charts-row three-cols">
          {/* Usuarios por Sede */}
          <div className="dashboard-section animate-in" style={{ animationDelay: '0.55s' }}>
            <div className="section-header">
              <h2><MapPin size={18} /> Distribución por Sede</h2>
            </div>
            <HorizontalBarChart 
              data={data.graficos.usuarios_por_sede || []} 
              labelKey="sede" 
              valueKey="cantidad" 
              emptyIcon={MapPin}
              emptyTitle="Aún no hay personal asignado"
              emptyDescription="Aquí se mostrará la cantidad de operadores y asesores por sede."
              emptyExample="Visualización del total de asesores asignados a Sede Norte, Sede Sur o Sede Central."
            />
          </div>

          {/* Incidencias por Tipo */}
          <div className="dashboard-section animate-in" style={{ animationDelay: '0.58s' }}>
            <div className="section-header">
              <h2><AlertTriangle size={18} /> Incidencias por Tipo</h2>
            </div>
            <DonutChart 
              data={incidenciasChartData} 
              emptyIcon={AlertTriangle}
              emptyTitle="Aún no hay incidencias reportadas"
              emptyDescription="Aquí se agruparán las incidencias reportadas por categoría."
              emptyExample="Distribución de incidentes de soporte: fallas del celular, retrasos justificados, emergencias."
            />
          </div>

          {/* Actividades por Estado */}
          <div className="dashboard-section animate-in" style={{ animationDelay: '0.61s' }}>
            <div className="section-header">
              <h2><FileText size={18} /> Actividades de Campo</h2>
            </div>
            <DonutChart 
              data={actividadesChartData} 
              emptyIcon={FileText}
              emptyTitle="Aún no hay actividades registradas"
              emptyDescription="Aquí se verán las actividades iniciadas y finalizadas por los asesores."
              emptyExample="Resumen de actividades diarias iniciadas en ruta frente a reportes cerrados."
            />
          </div>
        </div>

        {/* Unified Bottom row: Activity feed, state of operation & quick actions */}
        <div className="dashboard-grid-secondary">
          
          {/* Recent Activity Timeline */}
          <div className="dashboard-section animate-in" style={{ animationDelay: '0.65s' }}>
            <div className="section-header">
              <h2><Activity size={18} /> Actividad Reciente</h2>
              <button className="text-btn" onClick={() => navigate('/historial-jornadas')}>
                Ver todo <ChevronRight size={16} />
              </button>
            </div>
            <div className="activity-feed-wrapper">
              {data.actividad_reciente.length > 0 ? (
                <div className="activity-timeline">
                  {data.actividad_reciente.map((event, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className={`timeline-icon ${event.estado}`}>
                        {renderActivityIcon(event.tipo_evento)}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <div className="timeline-user-info">
                            <span className="timeline-user">{event.usuario}</span>
                            <span className="timeline-role">{event.rol}</span>
                          </div>
                          <span className="timeline-time-badge">
                            <Clock size={12} />
                            {new Date(event.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="timeline-desc">{event.descripcion}</p>
                        <span className="timeline-sede-badge">{event.sede}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state" style={{ minHeight: '300px' }}>
                  <div className="empty-state-icon-wrapper">
                    <Activity size={24} className="empty-state-icon" />
                  </div>
                  <h3 className="empty-state-title">No hay eventos recientes</h3>
                  <p className="empty-state-desc" style={{ maxWidth: '340px' }}>
                    Cuando un usuario marque entrada, reporte incidencia o registre actividad, aparecerá aquí.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Operation State, GPS Monitoring & Quick Actions */}
          <div className="flex flex-col gap-6">
            
            {/* Operational Status */}
            <div className="dashboard-section animate-in" style={{ animationDelay: '0.7s' }}>
              <div className="section-header">
                <h2><TrendingUp size={18} /> Estado de Operación</h2>
              </div>
              <div className="operational-status">
                <div className="status-metric-card">
                  <div className="status-metric-header">
                    <span>Cumplimiento Jornadas</span>
                    <span>{cumplimientoPct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill success" style={{ width: `${cumplimientoPct}%` }}></div>
                  </div>
                </div>

                <div className="status-metric-card">
                  <div className="status-metric-header">
                    <span>Puntualidad</span>
                    <span>{puntualidadPct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill info" style={{ width: `${puntualidadPct}%` }}></div>
                  </div>
                </div>

                <div className="status-metric-card">
                  <div className="status-metric-header">
                    <span>Usuarios Activos Hoy</span>
                    <span>{data.resumen_general.usuarios_activos}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill success" style={{ width: `${data.resumen_general.total_usuarios > 0 ? (data.resumen_general.usuarios_activos / data.resumen_general.total_usuarios) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="status-metric-card">
                  <div className="status-metric-header">
                    <span>Sedes en Operación</span>
                    <span>{data.resumen_general.sedes_activas} / {data.resumen_general.total_sedes}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill success" style={{ width: `${data.resumen_general.total_sedes > 0 ? (data.resumen_general.sedes_activas / data.resumen_general.total_sedes) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="status-metric-card">
                  <div className="status-metric-header">
                    <span>Usuarios Fuera de Zona</span>
                    <span>{data.tracking.usuarios_fuera_de_zona}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill danger" style={{ width: `${data.resumen_general.usuarios_activos > 0 ? (data.tracking.usuarios_fuera_de_zona / data.resumen_general.usuarios_activos) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Tracking Pulse widget */}
            <div className="dashboard-section animate-in" style={{ animationDelay: '0.72s' }}>
              <div className="section-header">
                <h2><Compass size={18} /> Monitoreo GPS Activo</h2>
                <span className="pulse-badge">
                  <span className="pulse-dot"></span>
                  {data.tracking.usuarios_con_tracking_activo} Activos
                </span>
              </div>
              <div className="gps-tracking-summary">
                <div className="gps-stats-row">
                  <div className="gps-stat-mini">
                    <span className="gps-stat-label">Puntos GPS Hoy</span>
                    <span className="gps-stat-val">{data.tracking.total_puntos_gps_hoy}</span>
                  </div>
                  <div className="gps-stat-mini">
                    <span className="gps-stat-label">Fuera de Zona</span>
                    <span className="gps-stat-val alert">{data.tracking.usuarios_fuera_de_zona}</span>
                  </div>
                </div>

                <div className="latest-locations-list">
                  {data.tracking.ultimas_ubicaciones && data.tracking.ultimas_ubicaciones.length > 0 ? (
                    data.tracking.ultimas_ubicaciones.slice(0, 5).map((loc, idx) => (
                      <div key={idx} className="location-item-mini">
                        <div className="loc-user-info">
                          <span className="loc-username">{loc.usuario_nombre}</span>
                          <span className="loc-time">
                            {new Date(loc.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="loc-details">
                          <span className={`loc-status-badge ${loc.es_fuera_de_zona ? 'outside' : 'inside'}`}>
                            {loc.es_fuera_de_zona ? 'Fuera Zona' : 'En Zona'}
                          </span>
                          {loc.bateria !== null && (
                            <span className="loc-battery">
                              🔋 {loc.bateria}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-mini" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', textAlign: 'center' }}>
                      <Compass size={24} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-main)' }}>Sin ubicaciones reportadas hoy</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.3' }}>
                        Cuando un usuario inicie jornada y active tracking, se mostrarán sus puntos GPS y nivel de batería aquí.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-section animate-in" style={{ animationDelay: '0.75s' }}>
              <div className="section-header">
                <h2><ArrowUpRight size={18} /> Acciones Rápidas</h2>
              </div>
              <div className="quick-actions-grid">
                <button onClick={() => navigate('/usuarios')} className="action-btn-redesign">
                  <div className="icon-container"><PlusCircle size={20} /></div>
                  <span>Nuevo Usuario</span>
                </button>
                <button onClick={() => navigate('/sedes')} className="action-btn-redesign">
                  <div className="icon-container"><MapPin size={20} /></div>
                  <span>Gestionar Sedes</span>
                </button>
                <button onClick={() => navigate('/jornada')} className="action-btn-redesign">
                  <div className="icon-container"><Calendar size={20} /></div>
                  <span>Gestión Horarios</span>
                </button>
                <button onClick={() => navigate('/historial-jornadas')} className="action-btn-redesign">
                  <div className="icon-container"><FileText size={20} /></div>
                  <span>Historial Jornadas</span>
                </button>
                <button onClick={() => navigate('/actividad')} className="action-btn-redesign">
                  <div className="icon-container"><Compass size={20} /></div>
                  <span>Monitoreo GPS</span>
                </button>
                <button onClick={() => navigate('/historial-jornadas')} className="action-btn-redesign">
                  <div className="icon-container"><TrendingUp size={20} /></div>
                  <span>Reportes</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </MainLayout>
  );
};

export default Dashboard;
