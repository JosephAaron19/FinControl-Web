import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Calendar, X, MapPin } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './Sedes.css'; 
import './GestionJornada.css';


const API_URL = import.meta.env.VITE_API_URL || 'https://apifincontrol.finatech.com.pe/api';

const GestionJornada = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [configs, setConfigs] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  
  const [formData, setFormData] = useState({
    sedes_ids: [],
    dia_semana: 'lunes',
    hora_inicio_marcacion: '08:00:00',
    hora_fin_marcacion: '09:00:00',
    hora_inicio_salida: '17:00:00',
    hora_fin_salida: '19:00:00',
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
        sedes_ids: [config.sede], // En edición solo es una
        dia_semana: config.dia_semana,
        hora_inicio_marcacion: config.hora_inicio_marcacion,
        hora_fin_marcacion: config.hora_fin_marcacion,
        hora_inicio_salida: config.hora_inicio_salida || '17:00:00',
        hora_fin_salida: config.hora_fin_salida || '19:00:00',
        activo: config.activo,
        observacion: config.observacion || ''
      });
    } else {
      setCurrentConfig(null);
      // POR DEFECTO: Seleccionar TODAS las sedes autorizadas para creación masiva
      const allSedesIds = sedes.map(s => s.id);
      setFormData({
        sedes_ids: allSedesIds,
        dia_semana: 'lunes',
        hora_inicio_marcacion: '08:00:00',
        hora_fin_marcacion: '09:00:00',
        hora_inicio_salida: '17:00:00',
        hora_fin_salida: '19:00:00',
        activo: true,
        observacion: ''
      });
    }
    setIsModalOpen(true);
  };

  const toggleSede = (sedeId) => {
    if (currentConfig) return; // No se puede cambiar sede en edición individual
    
    setFormData(prev => {
      const current = prev.sedes_ids || [];
      const isSelected = current.includes(sedeId);
      const newSedes = isSelected
        ? current.filter(id => id !== sedeId)
        : [...current, sedeId];
      return { ...prev, sedes_ids: newSedes };
    });
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
    
    if (formData.sedes_ids.length === 0) {
      showNotification('Debes seleccionar al menos una sede.', 'warning');
      return;
    }

    try {
      if (currentConfig) {
        // ACTUALIZACIÓN INDIVIDUAL
        const url = `${API_URL}/jornada-configuracion/${currentConfig.id}/`;
        const dataToSend = {
          ...formData,
          sede: formData.sedes_ids[0],
          hora_inicio_salida: formData.hora_inicio_salida || null,
          hora_fin_salida: formData.hora_fin_salida || null,
          observacion: formData.observacion || null
        };
        
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(dataToSend)
        });

        if (res.ok) {
          showNotification('Configuración actualizada correctamente.', 'success');
        } else {
          showNotification('No se pudo realizar la actualización.', 'error');
        }
      } else {
        // CREACIÓN MASIVA
        const promises = formData.sedes_ids.map(sedeId => {
          const dataToSend = {
            ...formData,
            sede: sedeId,
            hora_inicio_salida: formData.hora_inicio_salida || null,
            hora_fin_salida: formData.hora_fin_salida || null,
            observacion: formData.observacion || null
          };
          
          return fetch(`${API_URL}/jornada-configuracion/`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(dataToSend)
          });
        });

        const results = await Promise.all(promises);
        const allOk = results.every(r => r.ok);
        
        if (allOk) {
          showNotification('Jornadas creadas correctamente para todas las sedes.', 'success');
        } else {
          showNotification('Algunas jornadas no pudieron crearse (posiblemente ya existen).', 'warning');
        }
      }

      fetchConfigs();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving config:', err);
      showNotification('Error de conexión al intentar guardar.', 'error');
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
        showNotification('Configuración eliminada correctamente.', 'success');
      } else {
        showNotification('Error al eliminar la configuración.', 'error');
      }
    } catch (err) {
      console.error('Error deleting config:', err);
      showNotification('No se pudo realizar la acción.', 'error');
    }
  };

  const getSedeNombre = (sedeId) => {
    const sede = sedes.find(s => s.id === sedeId);
    return sede ? sede.nombre : '-';
  };

  return (
    <MainLayout 
      title="Gestión de Jornadas" 
      subtitle="Configura los rangos de tiempo para entrada y salida. (La salida ahora permite marcaciones fuera del horario para seguimiento)."
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
                  <th>Rango Entrada</th>
                  <th>Rango Salida</th>
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
                    <td>{config.hora_inicio_marcacion} - {config.hora_fin_marcacion}</td>
                    <td>{config.hora_inicio_salida || '-'} - {config.hora_fin_salida || '-'}</td>
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
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>{currentConfig ? 'Editar Configuración' : 'Nueva Configuración'}</h2>
              <button className="btn-icon" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Sedes donde se aplicará este horario *</label>
                <div className="sede-selection-container">
                  <div className="selection-header-info">
                    <h4>{currentConfig ? 'Sede asignada' : 'Selección Masiva'}</h4>
                    <span className="badge-count">
                      {formData.sedes_ids.length} seleccionadas
                    </span>
                  </div>
                  
                  <div className="sede-chips-grid">
                    {sedes.map(sede => {
                      const isSelected = formData.sedes_ids.includes(sede.id);
                      return (
                        <div 
                          key={sede.id} 
                          className={`sede-chip-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleSede(sede.id)}
                          style={currentConfig ? { cursor: 'default' } : {}}
                        >
                          <div className="chip-icon-wrapper">
                            <MapPin size={16} />
                          </div>
                          <span className="sede-chip-name">{sede.nombre}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                  <label>Hora Fin Marcación (Puntual)</label>
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

              <div className="form-row">
                <div className="form-group">
                  <label>Hora Inicio Salida</label>
                  <input 
                    type="time" 
                    name="hora_inicio_salida"
                    value={formData.hora_inicio_salida} 
                    onChange={handleInputChange} 
                    className="input-field"
                    step="1"
                  />
                </div>
                <div className="form-group">
                  <label>Hora Fin Salida</label>
                  <input 
                    type="time" 
                    name="hora_fin_salida"
                    value={formData.hora_fin_salida} 
                    onChange={handleInputChange} 
                    className="input-field"
                    step="1"
                  />
                  <small className="form-hint" style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    Nota: La salida se permitirá incluso después de esta hora para seguimiento de demoras.
                  </small>
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
