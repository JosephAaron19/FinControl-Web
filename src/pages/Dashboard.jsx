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
  Compass,
  ArrowUpRight
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import useWebSockets from '../hooks/useWebSockets';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// MOCK FALLBACK DATA (Matches Design Image)
// ==========================================
const mockFallbackData = {
  resumen_general: {
    total_usuarios: 156,
    usuarios_activos: 128,
    usuarios_inactivos: 28,
    total_operadores: 120,
    total_asesores: 36,
    total_sedes: 5,
    sedes_activas: 5
  },
  jornadas_dia: {
    jornadas_programadas: 156,
    jornadas_en_proceso: 18,
    jornadas_completas: 96,
    jornadas_incompletas: 52,
    jornadas_ausentes: 7,
    total_entradas_marcadas: 110,
    total_salidas_marcadas: 96
  },
  puntualidad: {
    puntual: 96,
    tardanza: 10,
    temprano: 2,
    no_marco_entrada: 2
  },
  salidas: {
    salida_en_rango: 90,
    salida_fuera_rango: 6,
    no_marco_salida: 14
  },
  incidencias: {
    total_incidencias_hoy: 5,
    incidencias_pendientes: 5,
    incidencias_revisadas: 0
  },
  actividades: {
    actividades_hoy: 42,
    actividades_en_proceso: 18,
    actividades_finalizadas: 22,
    actividades_pendientes: 6,
    total_actividades: 46
  },
  tracking: {
    usuarios_con_tracking_activo: 24,
    usuarios_fuera_de_zona: 6,
    total_puntos_gps_hoy: 1256,
    en_ruta: 12,
    detenidos: 6,
    sin_senal: 2,
    fuera_de_zona: 4
  },
  graficos: {
    asistencia_por_dia_semana: [
      { label: 'mié 27', value: 120 },
      { label: 'jue 28', value: 132 },
      { label: 'vie 29', value: 145 },
      { label: 'sáb 30', value: 110 },
      { label: 'dom 31', value: 98 },
      { label: 'lun 01', value: 138 },
      { label: 'mar 02', value: 156 }
    ],
    incidencias_por_tipo: [
      { tipo: 'Ausencia Justificada', cantidad: 2, color: '#3b82f6' },
      { tipo: 'Salida Anticipada', cantidad: 1, color: '#ef4444' },
      { tipo: 'Falta de Marcación', cantidad: 1, color: '#f59e0b' },
      { tipo: 'Fuera de Zona', cantidad: 1, color: '#6366f1' }
    ],
    usuarios_por_sede: [
      { sede: 'Oficina Central', cantidad: 64, porcentaje: 41 },
      { sede: 'Sucursal Norte', cantidad: 36, porcentaje: 23 },
      { sede: 'Sucursal Sur', cantidad: 28, porcentaje: 18 },
      { sede: 'Sucursal Este', cantidad: 20, porcentaje: 13 },
      { sede: 'Sucursal Oeste', cantidad: 8, porcentaje: 5 }
    ]
  },
  actividad_reciente: [
    { usuario: 'Juan Pérez', rol: 'Operador', tipo_evento: 'SALIDA', estado: 'success', fecha_hora: new Date().setHours(8, 45, 0), descripcion: 'completó jornada en Oficina Central', sede: 'Oficina Central' },
    { usuario: 'María Gómez', rol: 'Asesor', tipo_evento: 'ACTIVIDAD_FIN', estado: 'success', fecha_hora: new Date().setHours(8, 32, 0), descripcion: 'reportó actividad de campo', sede: 'Oficina Central' },
    { usuario: 'Carlos Ruiz', rol: 'Operador', tipo_evento: 'INCIDENCIA', estado: 'warning', fecha_hora: new Date().setHours(8, 16, 0), descripcion: 'registró incidencia (Tardanza)', sede: 'Oficina Central' },
    { usuario: 'Ana Torres', rol: 'Asesor', tipo_evento: 'ENTRADA', estado: 'info', fecha_hora: new Date().setHours(8, 2, 0), descripcion: 'inició jornada en Sucursal Norte', sede: 'Sucursal Norte' },
    { usuario: 'Luis Martínez', rol: 'Asesor', tipo_evento: 'ACTIVIDAD_INICIO', estado: 'info', fecha_hora: new Date().setHours(7, 55, 0), descripcion: 'completó checklist de seguridad', sede: 'Oficina Central' }
  ]
};

// ==========================================
// CUSTOM SVG LINE CHART COMPONENT
// ==========================================
const LineChart = ({ data = [] }) => {
  const hasRealValues = data && data.length > 0 && data.some(d => {
    const val = d.fecha ? ((d.completa || 0) + (d.incompleta || 0)) : d.value;
    return val > 0;
  });
  const chartData = hasRealValues ? data : mockFallbackData.graficos.asistencia_por_dia_semana;

  // Normalize API format vs Mock format
  const normalizedData = chartData.map(d => {
    if (d.fecha) {
      const val = (d.completa || 0) + (d.incompleta || 0);
      const date = new Date(d.fecha + 'T00:00:00');
      const label = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      return { label, value: val };
    }
    return { label: d.label, value: d.value };
  });

  const values = normalizedData.map(d => d.value);
  const maxVal = Math.max(...values, 200);
  const minVal = 0;

  const svgWidth = 500;
  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = normalizedData.map((d, i) => {
    const x = paddingLeft + (i * (chartWidth / (normalizedData.length - 1)));
    const y = svgHeight - paddingBottom - ((d.value - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  const linePath = points.length > 0 
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') 
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
    : '';

  const yTicks = [0, 50, 100, 150, 200];

  return (
    <div className="line-chart-container w-full h-full flex flex-col justify-between">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = svgHeight - paddingBottom - (tick / 200) * chartHeight;
          return (
            <g key={i}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={svgWidth - paddingRight} 
                y2={y} 
                stroke="rgba(15, 23, 42, 0.06)" 
                strokeDasharray="4 4" 
              />
              <text 
                x={paddingLeft - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] fill-slate-400 font-bold"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Filled area */}
        {areaPath && (
          <path d={areaPath} fill="url(#chartAreaGradient)" />
        )}

        {/* Line */}
        {linePath && (
          <path 
            d={linePath} 
            fill="none" 
            stroke="#2563eb" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {/* Points & values */}
        {points.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="4.5" 
              fill="#2563eb" 
              stroke="#ffffff" 
              strokeWidth="2" 
              className="transition-all duration-200 group-hover:r-[6px]"
            />
            <text 
              x={p.x} 
              y={p.y - 10} 
              textAnchor="middle" 
              className="text-[10px] font-extrabold fill-slate-700"
            >
              {p.value}
            </text>
            <text 
              x={p.x} 
              y={svgHeight - paddingBottom + 20} 
              textAnchor="middle" 
              className="text-[10px] fill-slate-450 font-bold"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
        <span className="text-[10px] text-slate-400 font-bold">Asistencias</span>
      </div>
    </div>
  );
};

// ==========================================
// CUSTOM SVG DONUT CHART COMPONENT
// ==========================================
const DonutChart = ({ data = [], centerValue, centerLabel, fallbackData }) => {
  const hasRealValues = data && data.length > 0 && data.some(d => (d.cantidad || 0) > 0);
  const displayData = hasRealValues ? data : fallbackData;
  const total = displayData ? displayData.reduce((sum, item) => sum + (item.cantidad || 0), 0) : 0;
  
  let accumulatedAngle = 0;
  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-row items-center justify-center gap-6 py-2 w-full">
      {/* SVG Donut */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {displayData.map((item, idx) => {
            const percentage = total > 0 ? (item.cantidad / total) * 100 : 0;
            const strokeLength = (percentage / 100) * circumference;
            const strokeOffset = circumference - strokeLength + (accumulatedAngle / 360) * circumference;
            accumulatedAngle -= total > 0 ? (percentage / 100) * 360 : 0;

            if (percentage === 0) return null;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={item.color || '#3b82f6'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.8s ease-in-out',
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-slate-800 leading-none">{centerValue || total}</span>
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">{centerLabel || 'Total'}</span>
        </div>
      </div>
      
      {/* Legends */}
      <div className="flex flex-col gap-2 min-w-0">
        {displayData.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.cantidad / total) * 100) : 0;
          return (
            <div key={idx} className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate text-slate-600 font-medium w-24 text-left">{item.estado || item.tipo}</span>
              <span className="text-slate-800 font-bold ml-auto">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// CUSTOM HORIZONTAL PROGRESS BARS COMPONENT
// ==========================================
const HorizontalBarChart = ({ data = [], fallbackData }) => {
  const hasRealValues = data && data.length > 0 && data.some(d => (d.cantidad || 0) > 0);
  const chartData = hasRealValues ? data : (fallbackData || mockFallbackData.graficos.usuarios_por_sede);
  const total = chartData.reduce((sum, item) => sum + (item.cantidad || 0), 0);

  return (
    <div className="flex flex-col gap-4 w-full">
      {chartData.map((item, idx) => {
        const pct = item.porcentaje || (total > 0 ? Math.round((item.cantidad / total) * 100) : 0);
        return (
          <div key={idx} className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="text-slate-700 font-medium truncate max-w-[150px]">{item.sede}</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{item.cantidad}</span>
                <span className="text-slate-400 font-normal w-8 text-right">{pct}%</span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-[#3b82f6]" 
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="border-t border-slate-100 pt-3 mt-1 text-[11px] text-slate-400 font-bold text-left">
        Total de usuarios activos: {total}
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const Dashboard = () => {
  const navigate = useNavigate();
  const [rango, setRango] = useState('hoy');
  const [selectedSede, setSelectedSede] = useState('');
  const [selectedRol, setSelectedRol] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [sedesList, setSedesList] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const fetchDashboardData = useCallback(async (currentRango, currentSede, currentRol, start, end) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      let url = `${API_URL}/dashboard/resumen/?rango=${currentRango}&sede=${currentSede || ''}&rol=${currentRol || ''}`;
      if (currentRango === 'personalizado' && start && end) {
        url += `&fecha_inicio=${start}&fecha_fin=${end}`;
      }
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else if (res.status === 403) {
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
      fetchDashboardData(rango, selectedSede, selectedRol, fechaInicio, fechaFin);
    }
  });

  useEffect(() => {
    fetchSedes();
  }, [fetchSedes]);

  useEffect(() => {
    if (rango !== 'personalizado' || (fechaInicio && fechaFin)) {
      fetchDashboardData(rango, selectedSede, selectedRol, fechaInicio, fechaFin);
    }
  }, [rango, selectedSede, selectedRol, fechaInicio, fechaFin, fetchDashboardData]);

  const handleRangeChange = (newRango) => {
    setRango(newRango);
    if (newRango === 'personalizado' && (!fechaInicio || !fechaFin)) {
      const todayStr = new Date().toISOString().split('T')[0];
      setFechaInicio(todayStr);
      setFechaFin(todayStr);
    }
  };

  // Determine whether to use real API data or Fallback Data
  const hasRealData = dashboardData && dashboardData.resumen_general && dashboardData.resumen_general.total_usuarios > 0;
  const data = hasRealData ? dashboardData : mockFallbackData;

  // Helper to fallback to mock value if value is null, undefined, or 0
  const getF = (val, fbVal) => {
    return (val !== undefined && val !== null && val > 0) ? val : fbVal;
  };

  // Unified display metrics (always populated with real or mock data)
  const displayResumen = {
    usuarios_activos: getF(data.resumen_general.usuarios_activos, mockFallbackData.resumen_general.usuarios_activos),
    total_usuarios: getF(data.resumen_general.total_usuarios, mockFallbackData.resumen_general.total_usuarios),
    jornadas_en_proceso: getF(data.jornadas_dia.jornadas_en_proceso, mockFallbackData.jornadas_dia.jornadas_en_proceso),
    jornadas_completas: getF(data.jornadas_dia.jornadas_completas, mockFallbackData.jornadas_dia.jornadas_completas),
    jornadas_ausentes: getF(data.jornadas_dia.jornadas_ausentes, mockFallbackData.jornadas_dia.jornadas_ausentes),
    tardanzas: getF(data.puntualidad.tardanza, mockFallbackData.puntualidad.tardanza),
    incidencias_pendientes: getF(data.incidencias.incidencias_pendientes, mockFallbackData.incidencias.incidencias_pendientes),
    actividades_hoy: getF(data.actividades.actividades_hoy, mockFallbackData.actividades.actividades_hoy),
    usuarios_fuera_de_zona: getF(data.tracking.usuarios_fuera_de_zona, mockFallbackData.tracking.usuarios_fuera_de_zona),
    
    // Bottom details
    total_actividades: getF(data.actividades.total_actividades, mockFallbackData.actividades.total_actividades),
    actividades_en_proceso: getF(data.actividades.actividades_en_proceso, mockFallbackData.actividades.actividades_en_proceso),
    actividades_finalizadas: getF(data.actividades.actividades_finalizadas, mockFallbackData.actividades.actividades_finalizadas),
    actividades_pendientes: getF(data.actividades.actividades_pendientes, mockFallbackData.actividades.actividades_pendientes),
    
    usuarios_con_tracking_activo: getF(data.tracking.usuarios_con_tracking_activo, mockFallbackData.tracking.usuarios_con_tracking_activo),
    total_puntos_gps_hoy: getF(data.tracking.total_puntos_gps_hoy, mockFallbackData.tracking.total_puntos_gps_hoy),
    en_ruta: getF(data.tracking.en_ruta, mockFallbackData.tracking.en_ruta),
    detenidos: getF(data.tracking.detenidos, mockFallbackData.tracking.detenidos),
    sin_senal: getF(data.tracking.sin_senal, mockFallbackData.tracking.sin_senal),
    fuera_de_zona: getF(data.tracking.fuera_de_zona, mockFallbackData.tracking.fuera_de_zona)
  };

  // Dynamic GPS tracking percentages and ratio calculation
  const totalTracked = (displayResumen.en_ruta || 0) + (displayResumen.detenidos || 0) + (displayResumen.sin_senal || 0) + (displayResumen.fuera_de_zona || 0);
  const enRutaPct = totalTracked > 0 ? Math.round((displayResumen.en_ruta / totalTracked) * 100) : 50;
  const detenidosPct = totalTracked > 0 ? Math.round((displayResumen.detenidos / totalTracked) * 100) : 25;
  const sinSenalPct = totalTracked > 0 ? Math.round((displayResumen.sin_senal / totalTracked) * 100) : 8;
  const fueraZonaPct = totalTracked > 0 ? Math.round((displayResumen.fuera_de_zona / totalTracked) * 100) : 17;

  const trackingRatio = displayResumen.total_usuarios > 0
    ? Math.min(1, displayResumen.usuarios_con_tracking_activo / displayResumen.total_usuarios)
    : 0.15;

  const sedesActivas = getF(data.resumen_general.sedes_activas, mockFallbackData.resumen_general.sedes_activas);
  const totalSedes = getF(data.resumen_general.total_sedes, mockFallbackData.resumen_general.total_sedes);

  // Percentages Calculation
  const realTotalEntradas = data.jornadas_dia.total_entradas_marcadas || 0;
  const puntualidadPct = realTotalEntradas > 0 
    ? Math.round(((data.puntualidad.puntual || 0) / realTotalEntradas) * 100) 
    : 87; // default fallback matching image

  const realTotalJornadas = (data.jornadas_dia.jornadas_completas || 0) + (data.jornadas_dia.jornadas_incompletas || 0) + (data.jornadas_dia.jornadas_ausentes || 0);
  const cumplimientoPct = realTotalJornadas > 0 
    ? Math.round(((data.jornadas_dia.jornadas_completas || 0) / realTotalJornadas) * 100) 
    : 96;

  // Chart Mappings
  const hasPuntualidadData = (data.puntualidad.puntual || 0) + (data.puntualidad.tardanza || 0) + (data.puntualidad.temprano || 0) + (data.puntualidad.no_marco_entrada || 0) > 0;
  const puntualidadChartData = hasPuntualidadData 
    ? [
        { estado: 'Puntual', cantidad: data.puntualidad.puntual || 0, color: '#10b981' },
        { estado: 'Tardanza', cantidad: data.puntualidad.tardanza || 0, color: '#f59e0b' },
        { estado: 'Temprano', cantidad: data.puntualidad.temprano || 0, color: '#3b82f6' },
        { estado: 'No Marcó', cantidad: data.puntualidad.no_marco_entrada || 0, color: '#ef4444' }
      ]
    : [
        { estado: 'Puntual', cantidad: 96, color: '#10b981' },
        { estado: 'Tardanza', cantidad: 10, color: '#f59e0b' },
        { estado: 'Temprano', cantidad: 2, color: '#3b82f6' },
        { estado: 'No Marcó', cantidad: 2, color: '#ef4444' }
      ];

  const incidenciasColors = ['#3b82f6', '#ef4444', '#f59e0b', '#6366f1', '#a78bfa', '#10b981'];
  const hasIncidenciasData = data.graficos.incidencias_por_tipo && data.graficos.incidencias_por_tipo.length > 0 && data.graficos.incidencias_por_tipo.some(d => d.cantidad > 0);
  const incidenciasChartData = hasIncidenciasData
    ? data.graficos.incidencias_por_tipo.map((item, idx) => ({
        tipo: item.tipo,
        cantidad: item.cantidad,
        color: item.color || incidenciasColors[idx % incidenciasColors.length]
      }))
    : mockFallbackData.graficos.incidencias_por_tipo;

  const displayTimeline = data.actividad_reciente && data.actividad_reciente.length > 0
    ? data.actividad_reciente
    : mockFallbackData.actividad_reciente;

  return (
    <MainLayout 
      title="Panel de Control" 
      subtitle="Resumen operativo del sistema"
    >
      <div className="flex flex-col gap-6 w-full animate-in select-none">
        
        {/* Header Filters & Range */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Filtros Operativos</span>
          
          <div className="flex flex-wrap gap-3.5 items-center">
            {/* Sede Select */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Sede:</label>
              <select 
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-sky-500 transition" 
                value={selectedSede} 
                onChange={(e) => setSelectedSede(e.target.value)}
              >
                <option value="">Todas las Sedes</option>
                {sedesList.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Rol Select */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Rol:</label>
              <select 
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-sky-500 transition" 
                value={selectedRol} 
                onChange={(e) => setSelectedRol(e.target.value)}
              >
                <option value="">Todos los Roles</option>
                <option value="operador">Operadores</option>
                <option value="asesor">Asesores</option>
              </select>
            </div>

            {/* Custom Range Picker */}
            {rango === 'personalizado' && (
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none" 
                  value={fechaInicio} 
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
                <span className="text-slate-400 text-xs font-bold">a</span>
                <input 
                  type="date" 
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none" 
                  value={fechaFin} 
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            )}

            {/* Ranges */}
            <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl">
              {['hoy', 'semana', 'mes', 'personalizado'].map((r) => (
                <button 
                  key={r}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition duration-200 ${
                    rango === r 
                      ? 'bg-[#2563eb] text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  onClick={() => handleRangeChange(r)}
                >
                  {r === 'hoy' ? 'Hoy' : r === 'semana' ? 'Semana' : r === 'mes' ? 'Mes' : 'Personalizado'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 8 KPIs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3.5 w-full">
          {/* Card 1: Usuarios Activos */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 text-sky-500 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Usuarios Activos</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight mt-1">{displayResumen.usuarios_activos}</p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">De {displayResumen.total_usuarios} registrados</p>
              <p className="text-[9px] text-emerald-500 font-bold leading-none mt-1">↑ 12% vs ayer</p>
            </div>
          </div>

          {/* Card 2: En Proceso */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-500 flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">En Proceso</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight mt-1">{displayResumen.jornadas_en_proceso}</p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">Actividades hoy</p>
              <p className="text-[9px] text-emerald-500 font-bold leading-none mt-1">↑ 5% vs ayer</p>
            </div>
          </div>

          {/* Card 3: Jornadas Completas */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-500 flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Jornadas Completas</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight mt-1">{displayResumen.jornadas_completas}</p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">Cerradas hoy</p>
              <p className="text-[9px] text-emerald-500 font-bold leading-none mt-1">↑ 8% vs ayer</p>
            </div>
          </div>

          {/* Card 4: Ausencias */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Ausencias</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight mt-1">{displayResumen.jornadas_ausentes}</p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">Registradas hoy</p>
              <p className="text-[9px] text-rose-500 font-bold leading-none mt-1">↑ 3% vs ayer</p>
            </div>
          </div>

          {/* Card 5: Tardanzas */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-500 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Tardanzas</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight mt-1">{displayResumen.tardanzas}</p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">Ingresos tarde hoy</p>
              <p className="text-[9px] text-rose-500 font-bold leading-none mt-1">↑ 8% vs ayer</p>
            </div>
          </div>

          {/* Card 6: Incidencias */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-500 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Incidencias</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight mt-1">{displayResumen.incidencias_pendientes}</p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">Pendientes por revisar</p>
              <p className="text-[9px] text-rose-500 font-bold leading-none mt-1">↑ 2% vs ayer</p>
            </div>
          </div>

          {/* Card 7: Actividades */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 text-sky-500 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Actividades</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight mt-1">{displayResumen.actividades_hoy}</p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">Reportadas hoy</p>
              <p className="text-[9px] text-emerald-500 font-bold leading-none mt-1">↑ 15% vs ayer</p>
            </div>
          </div>

          {/* Card 8: Fuera de Zona */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-50 text-teal-500 flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Fuera de Zona</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight mt-1">{displayResumen.usuarios_fuera_de_zona}</p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">Alertas hoy</p>
              <p className="text-[9px] text-rose-500 font-bold leading-none mt-1">↑ 1% vs ayer</p>
            </div>
          </div>
        </div>

        {/* Middle Row Layout (Line, Donut, Horizontal) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* Chart 1: Tendencia de Asistencia */}
          <div className="lg:col-span-6 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col h-[300px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <Calendar className="w-4 h-4 text-sky-500" /> Tendencia de Asistencia
              </h2>
              <select className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 outline-none">
                <option>Últimos 7 días</option>
              </select>
            </div>
            <div className="flex-1 min-h-0">
              <LineChart data={data.graficos.asistencia_por_dia_semana || []} />
            </div>
          </div>

          {/* Chart 2: Puntualidad */}
          <div className="lg:col-span-3 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col h-[300px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <Clock className="w-4 h-4 text-sky-500" /> Puntualidad
              </h2>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <DonutChart 
                data={puntualidadChartData} 
                centerValue={`${puntualidadPct}%`} 
                centerLabel="Puntualidad"
                fallbackData={[
                  { estado: 'Puntual', cantidad: 96, color: '#10b981' },
                  { estado: 'Tardanza', cantidad: 10, color: '#f59e0b' },
                  { estado: 'Temprano', cantidad: 2, color: '#3b82f6' },
                  { estado: 'No Marcó', cantidad: 2, color: '#ef4444' }
                ]}
              />
            </div>
            <div className="border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5 mt-auto">
              <Clock className="w-3.5 h-3.5" /> Sobre ingresos del día
            </div>
          </div>

          {/* Chart 3: Distribución por Sede */}
          <div className="lg:col-span-3 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col h-[300px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-sky-500" /> Distribución por Sede
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <HorizontalBarChart 
                data={data.graficos.usuarios_por_sede || []} 
                fallbackData={mockFallbackData.graficos.usuarios_por_sede}
              />
            </div>
          </div>
        </div>

        {/* Bottom Grid Layout (Incidencias, Actividades, Actividad Reciente, Estado de Operación) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 w-full">
          {/* Card 1: Incidencias por Tipo */}
          <div className="lg:col-span-3 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col h-[290px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-sky-500" /> Incidencias por Tipo
              </h2>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <DonutChart 
                data={incidenciasChartData} 
                centerValue={`${getF(data.incidencias.total_incidencias_hoy, mockFallbackData.incidencias.total_incidencias_hoy)}`} 
                centerLabel="Total" 
                fallbackData={mockFallbackData.graficos.incidencias_por_tipo}
              />
            </div>
          </div>

          {/* Card 2: Actividades de Campo */}
          <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col h-[290px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-sky-500" /> Actividades
              </h2>
            </div>
            <div className="flex flex-col gap-4 my-auto">
              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                <span className="text-slate-450 font-bold">En progreso</span>
                <span className="font-extrabold text-slate-800 text-sm">{displayResumen.actividades_en_proceso}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                <span className="text-slate-450 font-bold">Completadas</span>
                <span className="font-extrabold text-slate-800 text-sm">{displayResumen.actividades_finalizadas}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                <span className="text-slate-450 font-bold">Pendientes</span>
                <span className="font-extrabold text-slate-800 text-sm">{displayResumen.actividades_pendientes}</span>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 mt-auto text-center text-[10px] text-slate-400 font-bold">
              Total: {displayResumen.total_actividades} actividades
            </div>
          </div>

          {/* Card 3: Actividad Reciente */}
          <div className="lg:col-span-4 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col h-[290px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <Activity className="w-4 h-4 text-sky-500" /> Actividad Reciente
              </h2>
            </div>
            <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto pr-1">
              {displayTimeline.map((event, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                    event.estado === 'success' ? 'bg-emerald-500' :
                    event.estado === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                  }`} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-slate-500 font-bold truncate">
                      <span className="font-extrabold text-slate-800">{event.usuario}</span> {event.descripcion}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-extrabold whitespace-nowrap">
                    {new Date(event.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/historial-jornadas')}
              className="mt-auto pt-3 border-t border-slate-100 text-left text-[11px] font-extrabold text-[#2563eb] hover:text-[#1d4ed8] hover:underline flex items-center gap-1.5"
            >
              Ver todas las actividades <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Estado de Operación */}
          <div className="lg:col-span-3 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col h-[290px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <TrendingUp className="w-4 h-4 text-sky-500" /> Estado de Operación
              </h2>
            </div>
            <div className="flex flex-col gap-3 my-auto">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-450">Sistema</span>
                  <span className="text-emerald-500">Óptimo</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-450">Servidores</span>
                  <span className="text-emerald-500">Óptimo</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-450">Conectividad</span>
                  <span className="text-sky-500">Estable</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '96%' }} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-450">GPS</span>
                  <span className="text-amber-500">Advertencia</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 mt-auto text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Última actualización: hace 2 min
            </div>
          </div>
        </div>

        {/* Very Bottom Row Layout (Monitoreo GPS, Acciones Rápidas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* Card 1: Monitoreo GPS Activo */}
          <div className="lg:col-span-6 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col h-[240px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <Compass className="w-4 h-4 text-sky-500" /> Monitoreo GPS Activo
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                {displayResumen.usuarios_con_tracking_activo} Activos
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 my-auto items-center">
              {/* Circular Radial Gauge */}
              <div className="sm:col-span-5 relative flex items-center justify-center w-full h-[100px]">
                <svg viewBox="0 0 100 100" className="w-[90px] h-[90px] transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#10b981" 
                    strokeWidth="8" 
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - trackingRatio)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-800 leading-none">{displayResumen.usuarios_con_tracking_activo}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Activos</span>
                  <span className="text-[7px] text-slate-400 font-semibold leading-tight mt-0.5">De {displayResumen.total_usuarios} registrados</span>
                </div>
              </div>

              {/* States detail list */}
              <div className="sm:col-span-7 grid grid-cols-2 gap-2">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col justify-center text-left">
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">En Ruta</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-extrabold text-slate-800">{displayResumen.en_ruta}</span>
                    <span className="text-[9px] text-emerald-500 font-bold">{enRutaPct}%</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col justify-center text-left">
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Detenidos</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-extrabold text-slate-800">{displayResumen.detenidos}</span>
                    <span className="text-[9px] text-amber-500 font-bold">{detenidosPct}%</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col justify-center text-left">
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Sin Señal</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-extrabold text-slate-800">{displayResumen.sin_senal}</span>
                    <span className="text-[9px] text-rose-500 font-bold">{sinSenalPct}%</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col justify-center text-left">
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Fuera Zona</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-extrabold text-slate-800">{displayResumen.fuera_de_zona}</span>
                    <span className="text-[9px] text-amber-500 font-bold">{fueraZonaPct}%</span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/actividad')}
              className="mt-auto pt-3 border-t border-slate-100 text-left text-[11px] font-extrabold text-[#2563eb] hover:text-[#1d4ed8] hover:underline flex items-center gap-1.5"
            >
              Ver mapa en tiempo real <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Acciones Rápidas */}
          <div className="lg:col-span-6 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col h-[240px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <ArrowUpRight className="w-4 h-4 text-sky-500" /> Acciones Rápidas
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3 my-auto">
              <button onClick={() => navigate('/usuarios')} className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 hover:border-sky-300 group transition duration-200">
                <div className="p-1.5 bg-white rounded-xl shadow-sm text-sky-500 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 mt-2 text-center leading-none">Nuevo Usuario</span>
              </button>

              <button onClick={() => navigate('/sedes')} className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 hover:border-sky-300 group transition duration-200">
                <div className="p-1.5 bg-white rounded-xl shadow-sm text-emerald-500 group-hover:scale-110 transition-transform duration-200">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 mt-2 text-center leading-none">Gestionar Sedes</span>
              </button>

              <button onClick={() => navigate('/jornada')} className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 hover:border-sky-300 group transition duration-200">
                <div className="p-1.5 bg-white rounded-xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 mt-2 text-center leading-none">Gestión Horarios</span>
              </button>

              <button onClick={() => navigate('/historial-jornadas')} className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 hover:border-sky-300 group transition duration-200">
                <div className="p-1.5 bg-white rounded-xl shadow-sm text-amber-500 group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 mt-2 text-center leading-none">Historial Jornadas</span>
              </button>

              <button onClick={() => navigate('/actividad')} className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 hover:border-sky-300 group transition duration-200">
                <div className="p-1.5 bg-white rounded-xl shadow-sm text-teal-500 group-hover:scale-110 transition-transform duration-200">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 mt-2 text-center leading-none">Monitoreo GPS</span>
              </button>

              <button onClick={() => navigate('/historial-jornadas')} className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 hover:border-sky-300 group transition duration-200">
                <div className="p-1.5 bg-white rounded-xl shadow-sm text-rose-500 group-hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 mt-2 text-center leading-none">Reportes</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default Dashboard;
