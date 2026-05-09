import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Calendar, X } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import './Sedes.css'; // Reutilizamos estilos de sedes para consistencia
import './GestionJornada.css';


const API_URL = import.meta.env.VITE_API_URL || 'https://apifincontrol.finatech.com.pe/api';

const GestionJornada = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  
  const [formData, setFormData] = useState({
    sede: '',
    dia_semana: 'lunes',
    hora_inicio_marcacion: '08:00:00',
    hora_fin_marcacion: '09:00:00',
    activo: true,
    observacion: ''
  });

  const diasOpciones = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  const fetchConfigs = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/jornada-configuracion/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (err) {
      console.error('Error fetching configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSedes = async () => {
    const token = localStorage.getItem('access_token');
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
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchSedes();
  }, [navigate]);

  const handleOpenModal = (config = null) => {
    if (config) {
      setCurrentConfig(config);
      setFormData({
        sede: config.sede,
        dia_semana: config.dia_semana,
        hora_inicio_marcacion: config.hora_inicio_marcacion,
        hora_fin_marcacion: config.hora_fin_marcacion,
        activo: config.activo,
        observacion: config.observacion || ''
      });
    } else {
      setCurrentConfig(null);
      setFormData({
        sede: sedes.length > 0 ? sedes[0].id : '',
        dia_semana: 'lunes',
        hora_inicio_marcacion: '08:00:00',
        hora_fin_marcacion: '09:00:00',
        activo: true,
        observacion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentConfig(null);
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
    
    const url = currentConfig 
      ? `${API_URL}/jornada-configuracion/${currentConfig.id}/` 
      : `${API_URL}/jornada-configuracion/`;
      
    const method = currentConfig ? 'PUT' : 'POST';

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
        fetchConfigs();
        handleCloseModal();
      } else {
        const errorData = await res.json();
        alert(`Error al guardar: ${JSON.stringify(errorData)}`);
      }
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta configuración?')) return;
    
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/jornada-configuracion/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchConfigs();
      } else {
        alert('Error al eliminar la configuración');
      }
    } catch (err) {
      console.error('Error deleting config:', err);
    }
  };

  const getSedeNombre = (sedeId) => {
    const sede = sedes.find(s => s.id === sedeId);
    return sede ? sede.nombre : '-';
  };

  return (
    <MainLayout 
      title="Gestión de Jornadas" 
      subtitle="Configura los horarios permitidos para marcar entrada por sede."
    >
      <div className="sedes-container card">
        <div className="sedes-header">
          <h2>Configuraciones por Sede</h2>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Nueva Configuración
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Cargando configuraciones...</div>
        ) : configs.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} className="empty-icon" />
            <p>No hay configuraciones registradas.</p>
            <button className="btn btn-primary mt-4" onClick={() => handleOpenModal()}>
              Crear Primera Configuración
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sede</th>
                  <th>Día</th>
                  <th>Hora Inicio</th>
                  <th>Hora Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {configs.map(config => (
                  <tr key={config.id}>
                    <td>
                      <div className="font-semibold">{getSedeNombre(config.sede)}</div>
                    </td>
                    <td className="capitalize">{config.dia_semana}</td>
                    <td>{config.hora_inicio_marcacion}</td>
                    <td>{config.hora_fin_marcacion}</td>
                    <td>
                      <span className={`status-badge ${config.activo ? 'valid' : 'invalid'}`}>
                        {config.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon text-primary" 
                          onClick={() => handleOpenModal(config)}
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="btn-icon text-danger" 
                          onClick={() => handleDelete(config.id)}
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
          <div className="modal-content">
            <div className="modal-header">
              <h2>{currentConfig ? 'Editar Configuración' : 'Nueva Configuración'}</h2>
              <button className="btn-icon" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Sede</label>
                <select 
                  name="sede"
                  value={formData.sede} 
                  onChange={handleInputChange} 
                  required 
                  className="input-field"
                >
                  <option value="">Seleccione una sede</option>
                  {sedes.map(sede => (
                    <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Día de la Semana</label>
                <select 
                  name="dia_semana"
                  value={formData.dia_semana} 
                  onChange={handleInputChange} 
                  required 
                  className="input-field"
                >
                  {diasOpciones.map(opcion => (
                    <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora Inicio Marcación</label>
                  <input 
                    type="time" 
                    name="hora_inicio_marcacion"
                    value={formData.hora_inicio_marcacion} 
                    onChange={handleInputChange} 
                    required 
                    className="input-field"
                    step="1"
                  />
                </div>
                <div className="form-group">
                  <label>Hora Fin Marcación</label>
                  <input 
                    type="time" 
                    name="hora_fin_marcacion"
                    value={formData.hora_fin_marcacion} 
                    onChange={handleInputChange} 
                    required 
                    className="input-field"
                    step="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observación (Opcional)</label>
                <input 
                  type="text" 
                  name="observacion"
                  value={formData.observacion} 
                  onChange={handleInputChange} 
                  className="input-field"
                  placeholder="Ej. Horario especial"
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
                  <span>Configuración Activa</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentConfig ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default GestionJornada;
