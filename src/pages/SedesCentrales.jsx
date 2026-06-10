import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Building2, Search, Eye, Building, CheckCircle2 } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './Sedes.css'; // Reusing Sedes.css for styling as it has similar structures

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const SedesCentrales = () => {
  const navigate = useNavigate();
  const { showNotification, showConfirm } = useNotification();
  const [sedesCentrales, setSedesCentrales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSede, setCurrentSede] = useState(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: true
  });

  const fetchSedesCentrales = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/sedes-centrales/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedesCentrales(data);
      }
    } catch (err) {
      console.error('Error fetching sedes centrales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSedesCentrales();
  }, [navigate]);

  const handleOpenModal = (sede = null) => {
    if (sede) {
      setCurrentSede(sede);
      setFormData({
        nombre: sede.nombre,
        descripcion: sede.descripcion || '',
        estado: sede.estado
      });
    } else {
      setCurrentSede(null);
      setFormData({
        nombre: '',
        descripcion: '',
        estado: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSede(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    const url = currentSede
      ? `${API_URL}/sedes-centrales/${currentSede.id}/`
      : `${API_URL}/sedes-centrales/`;

    const method = currentSede ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchSedesCentrales();
        handleCloseModal();
        showNotification(currentSede ? 'Sede central actualizada.' : 'Sede central creada.', 'success');
      } else {
        const errorData = await res.json();
        showNotification(`Error: ${JSON.stringify(errorData)}`, 'error');
      }
    } catch (err) {
      console.error('Error saving sede central:', err);
      showNotification('Error de conexión.', 'error');
    }
  };

  const handleDelete = async (id, totalSedes) => {
    if (totalSedes > 0) {
      showNotification('No se puede desactivar una sede central con sedes asociadas.', 'error');
      return;
    }
    if (!await showConfirm('Desactivar Sede Central', '¿Seguro que deseas desactivar esta sede central?', 'danger')) return;

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes-centrales/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchSedesCentrales();
        showNotification('Sede central desactivada.', 'success');
      } else {
        showNotification('Error al desactivar la sede central.', 'error');
      }
    } catch (err) {
      showNotification('Error de conexión.', 'error');
    }
  };

  // Format date
  const formatLastUpdated = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return '-';
    }
  };

  // Filters
  const filteredList = sedesCentrales.filter(sede => {
    const matchesSearch = sede.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' ||
      (statusFilter === 'Activos' && sede.estado) ||
      (statusFilter === 'Inactivos' && !sede.estado);
    return matchesSearch && matchesStatus;
  });

  const activeCount = sedesCentrales.filter(s => s.estado).length;

  return (
    <MainLayout
      title="Sedes Centrales"
      subtitle="Gestiona los agrupadores principales de sedes."
    >
      <div className="flex flex-col gap-6 w-full animate-in select-none">

        {/* Toolbar */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
          <div className="flex flex-wrap gap-3 items-center flex-1 min-w-0">
            <div className="relative w-full max-w-[280px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar sede central..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-sky-500 transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Estado:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-sky-500 transition"
              >
                <option value="Todos">Todos</option>
                <option value="Activos">Activos</option>
                <option value="Inactivos">Inactivos</option>
              </select>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] rounded-xl transition shadow-sm" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            Nueva Sede Central
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-sky-50 text-sky-500 flex-shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total Centrales</p>
              <p className="text-2xl font-extrabold text-slate-800 leading-tight mt-1">{sedesCentrales.length}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-500 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Activas</p>
              <p className="text-2xl font-extrabold text-slate-800 leading-tight mt-1">{activeCount}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sedes Asociadas</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actualizado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-xs font-semibold text-slate-400">
                      Cargando sedes centrales...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-xs font-semibold text-slate-400">
                      No se encontraron sedes centrales.
                    </td>
                  </tr>
                ) : (
                  filteredList.map(sede => (
                    <tr key={sede.id} className="hover:bg-slate-50/30 transition duration-150">
                      <td className="p-4 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          {sede.nombre}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-500 max-w-xs truncate">
                        {sede.descripcion || '-'}
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-700">
                        {sede.total_sedes} sedes
                      </td>
                      <td className="p-4 text-xs">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sede.estado
                          ? 'bg-emerald-50 text-emerald-500'
                          : 'bg-rose-50 text-rose-500'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sede.estado ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {sede.estado ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500 font-medium">
                        {formatLastUpdated(sede.actualizado_at || sede.creado_at)}
                      </td>
                      <td className="p-4 text-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            className="w-7 h-7 rounded-lg border border-slate-100 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition"
                            onClick={() => navigate(`/sedes-centrales/${sede.id}`)}
                            title="Ver Detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="w-7 h-7 rounded-lg border border-slate-100 text-[#2563eb] hover:bg-blue-50 flex items-center justify-center transition"
                            onClick={() => handleOpenModal(sede)}
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="w-7 h-7 rounded-lg border border-slate-100 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition"
                            onClick={() => handleDelete(sede.id, sede.total_sedes)}
                            title="Desactivar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon bg-sky-50 text-sky-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="modal-header-text">
                  <h2>{currentSede ? 'Editar Sede Central' : 'Nueva Sede Central'}</h2>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <div className="form-group">
                <label className="text-xs font-bold text-slate-500">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500"
                  placeholder="Ej: Central Jaén"
                />
              </div>

              <div className="form-group">
                <label className="text-xs font-bold text-slate-500">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500"
                  placeholder="Agrupa sedes operativas de Jaén."
                  rows="3"
                />
              </div>

              <div className="toggle-card mt-2">
                <label className="switch">
                  <input
                    type="checkbox"
                    name="estado"
                    checked={formData.estado}
                    onChange={handleInputChange}
                  />
                  <span className="slider round"></span>
                </label>
                <div className="toggle-card-text">
                  <span className="toggle-card-title">Estado Activo</span>
                </div>
              </div>

              <div className="modal-footer mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] rounded-lg transition shadow-sm">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SedesCentrales;
