import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Plus, Trash2, Search, X, CheckSquare, Square } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './Sedes.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const SedesCentralesDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification, showConfirm } = useNotification();

  const [sedeCentral, setSedeCentral] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal agregar sedes
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [loadingDisponibles, setLoadingDisponibles] = useState(false);
  const [searchDisponibles, setSearchDisponibles] = useState('');
  const [selectedSedes, setSelectedSedes] = useState([]);

  const fetchDetalle = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes-centrales/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedeCentral(data);
      } else {
        showNotification('No se pudo cargar el detalle.', 'error');
        navigate('/sedes-centrales');
      }
    } catch (err) {
      showNotification('Error de conexión.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalle();
  }, [id]);

  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    setLoadingDisponibles(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes/disponibles-para-central/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedesDisponibles(data);
      }
    } catch (err) {
      showNotification('Error al cargar sedes disponibles.', 'error');
    } finally {
      setLoadingDisponibles(false);
    }
  };

  const toggleSedeSelection = (sedeId) => {
    setSelectedSedes(prev =>
      prev.includes(sedeId) ? prev.filter(id => id !== sedeId) : [...prev, sedeId]
    );
  };

  const handleAddSedes = async () => {
    if (selectedSedes.length === 0) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes-centrales/${id}/agregar-sedes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sedes_ids: selectedSedes })
      });
      if (res.ok) {
        showNotification('Sedes asociadas correctamente.', 'success');
        setIsAddModalOpen(false);
        setSelectedSedes([]);
        fetchDetalle();
      } else {
        showNotification('Error al asociar sedes.', 'error');
      }
    } catch (err) {
      showNotification('Error de conexión.', 'error');
    }
  };

  const handleRemoveSede = async (sedeId) => {
    if (!await showConfirm('Quitar Sede', '¿Deseas quitar esta sede de la sede central? La sede no será eliminada, solo quedará sin asignar.', 'warning')) return;

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes-centrales/${id}/quitar-sede/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sede_id: sedeId })
      });
      if (res.ok) {
        showNotification('Sede quitada correctamente.', 'success');
        fetchDetalle();
      } else {
        showNotification('Error al quitar la sede.', 'error');
      }
    } catch (err) {
      showNotification('Error de conexión.', 'error');
    }
  };

  const filteredDisponibles = sedesDisponibles.filter(s =>
    s.nombre.toLowerCase().includes(searchDisponibles.toLowerCase())
  );

  if (loading || !sedeCentral) {
    return (
      <MainLayout title="Cargando..." subtitle="Por favor espera">
        <div className="p-8 text-center text-slate-500">Cargando detalle...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Detalle de Sede Central"
      subtitle={`Gestiona las sedes operativas asignadas a ${sedeCentral.nombre}.`}
    >
      <div className="flex flex-col gap-6 w-full animate-in select-none">
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate('/sedes-centrales')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Sedes Centrales
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">{sedeCentral.nombre}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">{sedeCentral.descripcion || 'Sin descripción'}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sedeCentral.estado ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sedeCentral.estado ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {sedeCentral.estado ? 'ACTIVO' : 'INACTIVO'}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {sedeCentral.total_sedes} sedes asociadas
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button
              className="flex justify-center items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 text-xs font-bold hover:bg-sky-100 rounded-xl transition shadow-sm w-full md:w-auto"
              onClick={handleOpenAddModal}
            >
              <Plus className="w-4 h-4" />
              Agregar sedes existentes
            </button>
            <button
              className="flex justify-center items-center gap-2 px-4 py-2 bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] rounded-xl transition shadow-sm w-full md:w-auto"
              onClick={() => navigate(`/sedes?create=true&sede_central_id=${sedeCentral.id}`)}
            >
              <Building2 className="w-4 h-4" />
              Crear nueva sede operativa
            </button>
          </div>
        </div>

        {/* Sedes List */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Sedes Operativas Asociadas</h2>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sedeCentral.sedes && sedeCentral.sedes.length > 0 ? (
                  sedeCentral.sedes.map(sede => (
                    <tr key={sede.id} className="hover:bg-slate-50/30 transition">
                      <td className="p-4 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          {sede.nombre}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-center">
                        <button
                          className="px-3 py-1.5 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-50 text-[10px] font-bold transition inline-flex items-center gap-1"
                          onClick={() => handleRemoveSede(sede.id)}
                        >
                          <Trash2 className="w-3 h-3" /> Quitar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="p-8 text-center text-xs font-semibold text-slate-400">
                      No hay sedes asociadas a esta central.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Agregar Sedes */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon bg-sky-50 text-sky-500">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="modal-header-text">
                  <h2>Agregar sedes a {sedeCentral.nombre}</h2>
                </div>
              </div>
              <button className="btn-icon modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar sede disponible..."
                  value={searchDisponibles}
                  onChange={(e) => setSearchDisponibles(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-lg">
                {loadingDisponibles ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-semibold">Cargando...</div>
                ) : filteredDisponibles.length > 0 ? (
                  <div className="flex flex-col">
                    {filteredDisponibles.map(sede => (
                      <div
                        key={sede.id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer transition"
                        onClick={() => toggleSedeSelection(sede.id)}
                      >
                        {selectedSedes.includes(sede.id) ? (
                          <CheckSquare className="w-5 h-5 text-[#2563eb]" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                        <span className="text-xs font-bold text-slate-700">{sede.nombre}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 font-semibold">
                    No hay sedes disponibles para asociar.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition" onClick={() => setIsAddModalOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition shadow-sm ${selectedSedes.length > 0 ? 'bg-[#2563eb] hover:bg-[#1d4ed8]' : 'bg-slate-300 cursor-not-allowed'}`}
                  onClick={handleAddSedes}
                  disabled={selectedSedes.length === 0}
                >
                  Agregar sedes ({selectedSedes.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SedesCentralesDetalle;
