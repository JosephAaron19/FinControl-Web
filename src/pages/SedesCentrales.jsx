import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Building2, Search, Eye, Building, CheckCircle2, Calendar, Upload, Link, X } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './Sedes.css'; // Reusing Sedes.css for styling
import bannerImg from '../assets/modern_office_buildings_banner.png';
import placeholderImg from '../assets/modern_office_building_placeholder.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const SedesCentrales = () => {
  const navigate = useNavigate();
  const { showNotification, showConfirm } = useNotification();
  const [sedesCentrales, setSedesCentrales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSede, setCurrentSede] = useState(null);

  // File Upload states
  const [imageSourceType, setImageSourceType] = useState('url'); // 'url' or 'file'
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: true,
    imagen_url: ''
  });

  const fetchSedesCentrales = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/sedes-centrales/?_t=${Date.now()}`, {
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
        estado: sede.estado,
        imagen_url: sede.imagen_url || ''
      });
      setImageSourceType(sede.imagen ? 'file' : 'url');
      setSelectedFile(null);
      setImagePreview(sede.imagen_completa_url || null);
    } else {
      setCurrentSede(null);
      setFormData({
        nombre: '',
        descripcion: '',
        estado: true,
        imagen_url: ''
      });
      setImageSourceType('url');
      setSelectedFile(null);
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSede(null);
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getModalImagePreview = () => {
    if (imageSourceType === 'file') {
      return imagePreview;
    }
    return formData.imagen_url || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    const url = currentSede
      ? `${API_URL}/sedes-centrales/${currentSede.id}/`
      : `${API_URL}/sedes-centrales/`;

    const method = currentSede ? 'PATCH' : 'POST';

    const uploadData = new FormData();
    uploadData.append('nombre', formData.nombre);
    uploadData.append('descripcion', formData.descripcion);
    uploadData.append('estado', formData.estado);

    if (imageSourceType === 'file') {
      if (selectedFile) {
        uploadData.append('imagen', selectedFile);
      }
      uploadData.append('imagen_url', ''); // clear url if uploading a file
    } else {
      uploadData.append('imagen_url', formData.imagen_url || '');
      if (currentSede) {
        // Explicitly clear file if switching back to URL
        uploadData.append('imagen', '');
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadData
      });

      if (res.ok) {
        setSearchTerm('');
        setStatusFilter('Todos');
        await fetchSedesCentrales();
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
      showNotification('No se puede eliminar una sede central con sedes asociadas.', 'error');
      return;
    }
    if (!await showConfirm('Eliminar Sede Central', '¿Seguro que deseas eliminar definitivamente esta sede central?', 'danger')) return;

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes-centrales/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchSedesCentrales();
        showNotification('Sede central eliminada.', 'success');
      } else {
        showNotification('Error al eliminar la sede central.', 'error');
      }
    } catch (err) {
      showNotification('Error de conexión.', 'error');
    }
  };

  const formatLastUpdated = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return '-';
    }
  };

  const filteredList = sedesCentrales.filter(sede => {
    const matchesSearch = sede.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' ||
      (statusFilter === 'Activos' && sede.estado) ||
      (statusFilter === 'Inactivos' && !sede.estado);
    return matchesSearch && matchesStatus;
  });

  const totalCentralesCount = sedesCentrales.length;
  const activeCentralesCount = sedesCentrales.filter(s => s.estado).length;
  const totalSedesAsociadas = sedesCentrales.reduce((sum, s) => sum + (s.total_sedes || 0), 0);

  return (
    <MainLayout
      title="Sedes Centrales"
      subtitle="Gestiona los agrupadores principales de sedes."
    >
      <div className="flex flex-col gap-6 w-full animate-in select-none">
        
        {/* Banner Superior */}
        <div className="relative bg-gradient-to-r from-blue-50 via-sky-50 to-white border border-slate-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between overflow-hidden shadow-sm">
          <div className="flex items-center gap-6 max-w-xl text-left">
            <div className="w-16 h-16 rounded-2xl bg-white text-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800">Administra tus sedes centrales</h1>
              <p className="text-xs md:text-sm font-semibold text-slate-500 mt-2 leading-relaxed">
                Organiza y visualiza de forma clara los agrupadores principales de sedes operativas en tu organización.
              </p>
            </div>
          </div>
          <div className="hidden md:block w-52 h-24 flex-shrink-0 relative">
            <img src={bannerImg} alt="Buildings Banner" className="w-full h-full object-contain object-right" />
          </div>
        </div>

        {/* Toolbar de Filtros & Búsqueda */}
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
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] rounded-xl transition shadow-sm" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            Nueva Sede Central
          </button>
        </div>

        {/* KPIs (Tarjetas de Estadísticas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 flex-shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Centrales</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalCentralesCount}</h3>
              <p className="text-[11px] font-semibold text-slate-400">Sedes centrales registradas</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activas</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{activeCentralesCount}</h3>
              <p className="text-[11px] font-semibold text-slate-400">Sedes centrales activas</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600 flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sedes Asociadas</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalSedesAsociadas}</h3>
              <p className="text-[11px] font-semibold text-slate-400">En total asociadas</p>
            </div>
          </div>
        </div>

        {/* Listado en Tarjetas Horizontales */}
        <div className="grid grid-cols-1 gap-6 w-full">
          {loading ? (
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-12 text-center text-xs font-semibold text-slate-400">
              Cargando sedes centrales...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-12 text-center text-xs font-semibold text-slate-400">
              No se encontraron sedes centrales.
            </div>
          ) : (
            filteredList.map(sede => (
              <div key={sede.id} className="relative bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row gap-6 items-stretch transition duration-200 overflow-hidden">
                
                {/* Acento lateral */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-3xl" />
                
                {/* Imagen izquierda */}
                <div className="w-full md:w-60 h-44 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center relative">
                  <img 
                    src={sede.imagen_completa_url || placeholderImg} 
                    alt={sede.nombre} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.target.src = placeholderImg; }}
                  />
                </div>

                {/* Contenido derecho */}
                <div className="flex-1 flex flex-col justify-between py-1 text-left relative">
                  <div>
                    {/* Fila de Badge y Acciones */}
                    <div className="flex justify-between items-start gap-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        sede.estado ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sede.estado ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {sede.estado ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                      
                      {/* Acciones */}
                      <div className="flex items-center gap-1.5">
                        <button
                          className="w-8 h-8 rounded-xl border border-slate-100 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition"
                          onClick={() => navigate(`/sedes-centrales/${sede.id}`)}
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-xl border border-slate-100 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition"
                          onClick={() => handleOpenModal(sede)}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-xl border border-slate-100 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition"
                          onClick={() => handleDelete(sede.id, sede.total_sedes)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Título y Descripción */}
                    <h2 className="text-lg font-black text-slate-800 mt-2 uppercase tracking-tight">{sede.nombre}</h2>
                    <p className="text-xs font-semibold text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      {sede.descripcion || 'Sin descripción detallada.'}
                    </p>

                    {/* Sedes Asociadas Metadatos */}
                    <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sede.total_sedes} {sede.total_sedes === 1 ? 'SEDE ASOCIADA' : 'SEDES ASOCIADAS'}</span>
                    </div>

                    {/* Badges de Sedes Operativas */}
                    {sede.sedes && sede.sedes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sede.sedes.slice(0, 3).map(s => (
                          <span key={s.id} className="inline-flex items-center px-3 py-1 rounded-xl text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                            {s.nombre.toUpperCase()}
                          </span>
                        ))}
                        {sede.sedes.length > 3 && (
                          <button 
                            onClick={() => navigate(`/sedes-centrales/${sede.id}`)}
                            className="inline-flex items-center px-3 py-1 rounded-xl text-[9px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-100"
                          >
                            + Ver todas
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">Sin sedes operativas asociadas.</span>
                        <button
                          type="button"
                          onClick={() => navigate(`/sedes-centrales/${sede.id}`)}
                          className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Asociar sedes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pie de la tarjeta */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Actualizado el {formatLastUpdated(sede.actualizado_at || sede.creado_at)}
                    </span>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Creación / Edición */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', borderRadius: '24px' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon bg-sky-50 text-sky-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="modal-header-text">
                  <h2>{currentSede ? 'Editar Sede Central' : 'Nueva Sede Central'}</h2>
                </div>
              </div>
              <button className="btn-icon modal-close-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              {/* Contenedor Scrollable de Campos */}
              <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[55vh]">
                <div className="form-group text-left">
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

                <div className="form-group text-left">
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

                {/* Origen de Imagen Selector */}
                <div className="form-group flex flex-col gap-2 text-left">
                  <label className="text-xs font-bold text-slate-500">Origen de Imagen</label>
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setImageSourceType('url')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${
                        imageSourceType === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Enlace URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceType('file')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${
                        imageSourceType === 'file' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Archivo Local
                    </button>
                  </div>
                </div>

                {imageSourceType === 'url' ? (
                  <div className="form-group flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-500">Enlace URL de Imagen</label>
                    <div className="relative flex items-center">
                      <Link className="absolute left-3 text-slate-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        name="imagen_url"
                        value={formData.imagen_url || ''}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-500">Subir Archivo de Imagen</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="fileInput"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="fileInput"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/10 rounded-xl cursor-pointer transition text-xs font-bold text-slate-500"
                      >
                        <Upload className="w-4 h-4 text-slate-400" />
                        {selectedFile ? selectedFile.name : 'Seleccionar imagen...'}
                      </label>
                    </div>
                  </div>
                )}

                {/* Vista previa de imagen adaptiva */}
                {getModalImagePreview() && (
                  <div className="mt-1 rounded-2xl overflow-hidden border border-slate-200 h-44 bg-slate-100 flex items-center justify-center relative shadow-inner">
                    <img 
                      src={getModalImagePreview()} 
                      alt="Vista previa" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageSourceType === 'file') {
                          setSelectedFile(null);
                          setImagePreview(null);
                        } else {
                          setFormData(prev => ({ ...prev, imagen_url: '' }));
                        }
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center transition"
                      title="Eliminar imagen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

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
                  <div className="toggle-card-text text-left">
                    <span className="toggle-card-title">Estado Activo</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción fijos en la parte inferior */}
              <div className="modal-footer px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50 rounded-b-[24px]">
                <button type="button" className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] rounded-lg transition shadow-sm">
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
