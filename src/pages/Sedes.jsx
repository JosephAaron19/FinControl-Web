import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './Sedes.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://apifincontrol.finatech.com.pe/api';


const Sedes = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSede, setCurrentSede] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    referencia: '',
    latitud: '',
    longitud: '',
    radio_metros: 100,
    activo: true
  });

  const fetchSedes = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/sedes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSedes(data);
      }
    } catch (err) {
      console.error('Error fetching sedes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSedes();
  }, [navigate]);

  const handleOpenModal = (sede = null) => {
    if (sede) {
      setCurrentSede(sede);
      setFormData({
        nombre: sede.nombre,
        codigo: sede.codigo || '',
        direccion: sede.direccion || '',
        referencia: sede.referencia || '',
        latitud: sede.latitud || '',
        longitud: sede.longitud || '',
        radio_metros: sede.radio_metros || '',
        activo: sede.activo
      });
    } else {
      setCurrentSede(null);
      setFormData({
        nombre: '',
        codigo: '',
        direccion: '',
        referencia: '',
        latitud: '',
        longitud: '',
        radio_metros: 100,
        activo: true
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
      ? `${API_URL}/sedes/${currentSede.id}/` 
      : `${API_URL}/sedes/`;
      
    const method = currentSede ? 'PUT' : 'POST';

    try {
      const payload = { ...formData };
      if (payload.latitud === '') payload.latitud = null;
      if (payload.longitud === '') payload.longitud = null;
      if (payload.radio_metros === '') payload.radio_metros = null;
      if (payload.codigo === '') payload.codigo = null;
      if (payload.referencia === '') payload.referencia = null;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchSedes();
        handleCloseModal();
        showNotification(currentSede ? 'Sede actualizada correctamente.' : 'Sede creada correctamente.', 'success');
      } else {
        const errorData = await res.json();
        showNotification(`Error al guardar: ${JSON.stringify(errorData)}`, 'error');
      }
    } catch (err) {
      console.error('Error saving sede:', err);
      showNotification('No se pudo realizar la acción. Verifique su conexión.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta sede?')) return;
    
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/sedes/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchSedes();
        showNotification('Sede eliminada correctamente.', 'success');
      } else {
        showNotification('Error al eliminar la sede.', 'error');
      }
    } catch (err) {
      console.error('Error deleting sede:', err);
      showNotification('No se pudo realizar la acción.', 'error');
    }
  };

  return (
    <MainLayout 
      title="Gestión de Sedes" 
      subtitle="Administra las sucursales y sus zonas geográficas."
    >
      <div className="sedes-container card">
        <div className="sedes-header">
          <h2>Listado de Sedes</h2>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Nueva Sede
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Cargando sedes...</div>
        ) : sedes.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} className="empty-icon" />
            <p>No hay sedes registradas en el sistema.</p>
            <button className="btn btn-primary mt-4" onClick={() => handleOpenModal()}>
              Registrar Primera Sede
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Coordenadas</th>
                  <th>Radio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sedes.map(sede => (
                  <tr key={sede.id}>
                    <td>
                      <div className="font-semibold">{sede.nombre}</div>
                    </td>
                    <td>{sede.direccion || '-'}</td>
                    <td className="text-sm text-muted">
                      {sede.latitud}, {sede.longitud}
                    </td>
                    <td>{sede.radio_metros} m</td>
                    <td>
                      <span className={`status-badge ${sede.activo ? 'valid' : 'invalid'}`}>
                        {sede.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon text-primary" 
                          onClick={() => handleOpenModal(sede)}
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="btn-icon text-danger" 
                          onClick={() => handleDelete(sede.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>{currentSede ? 'Editar Sede' : 'Nueva Sede'}</h2>
              <button className="btn-icon" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre de la Sede</label>
                  <input 
                    type="text" 
                    name="nombre"
                    value={formData.nombre} 
                    onChange={handleInputChange} 
                    required 
                    className="input-field"
                    placeholder="Ej. Oficina Principal"
                  />
                </div>
                <div className="form-group">
                  <label>Código (Opcional)</label>
                  <input 
                    type="text" 
                    name="codigo"
                    value={formData.codigo} 
                    onChange={handleInputChange} 
                    className="input-field"
                    placeholder="Ej. S-01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Dirección (Opcional)</label>
                <input 
                  type="text" 
                  name="direccion"
                  value={formData.direccion} 
                  onChange={handleInputChange} 
                  className="input-field"
                  placeholder="Ej. Av. Siempre Viva 123"
                />
              </div>

              <div className="form-group">
                <label>Referencia (Opcional)</label>
                <input 
                  type="text" 
                  name="referencia"
                  value={formData.referencia} 
                  onChange={handleInputChange} 
                  className="input-field"
                  placeholder="Ej. Frente al parque"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitud (Opcional)</label>
                  <input 
                    type="number" 
                    step="any"
                    name="latitud"
                    value={formData.latitud} 
                    onChange={handleInputChange} 
                    className="input-field"
                    placeholder="-12.046374"
                  />
                </div>
                <div className="form-group">
                  <label>Longitud (Opcional)</label>
                  <input 
                    type="number" 
                    step="any"
                    name="longitud"
                    value={formData.longitud} 
                    onChange={handleInputChange} 
                    className="input-field"
                    placeholder="-77.042793"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Radio de tolerancia (metros) (Opcional)</label>
                  <input 
                    type="number" 
                    name="radio_metros"
                    value={formData.radio_metros} 
                    onChange={handleInputChange} 
                    min="10"
                    className="input-field"
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="activo"
                      checked={formData.activo} 
                      onChange={handleInputChange} 
                    />
                    <span>Sede Activa</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentSede ? 'Actualizar Sede' : 'Guardar Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Sedes;
