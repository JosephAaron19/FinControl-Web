import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, User, Key, X, Search, Filter, Shield, Building, CheckCircle, MapPin } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useNotification } from '../context/NotificationContext';
import './Usuarios.css';

const API_URL = import.meta.env.VITE_API_URL;

const Usuarios = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [usuarios, setUsuarios] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [currentUsuario, setCurrentUsuario] = useState(null);
  const [newCredentials, setNewCredentials] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSede, setFilterSede] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Formulario Principal
  const [formData, setFormData] = useState({
    dni: '',
    nombre_completo: '',
    password: '',
    cargo: '',
    telefono: '',
    email: '',
    sede: '',
    rol: '',
    activo: true,
    debe_cambiar_password: true,
    observacion: '',
    sedes_ids: []
  });

  // Formulario Contraseña
  const [passwordData, setPasswordData] = useState({
    password: '',
    debe_cambiar_password: true
  });

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      // Fetch Usuarios
      const resUsers = await fetch(`${API_URL}/usuarios/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsuarios(data);
      }

      // Fetch Sedes
      const resSedes = await fetch(`${API_URL}/sedes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resSedes.ok) {
        const data = await resSedes.json();
        setSedes(data);
      }

      // Fetch Roles
      const resRoles = await fetch(`${API_URL}/roles/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resRoles.ok) {
        const data = await resRoles.json();
        setRoles(data);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchData();
  }, [navigate]);

  const handleOpenModal = (usuario = null) => {
    if (usuario) {
      setCurrentUsuario(usuario);
      setFormData({
        dni: usuario.dni,
        nombre_completo: usuario.nombre_completo,
        password: '', // No se muestra por seguridad
        cargo: usuario.cargo || '',
        telefono: usuario.telefono || '',
        email: usuario.email || '',
        sede: usuario.sede || '',
        rol: usuario.rol || '',
        activo: usuario.activo,
        debe_cambiar_password: usuario.debe_cambiar_password,
        observacion: usuario.observacion || '',
        sedes_ids: usuario.sedes_ids || []
      });
    } else {
      setCurrentUsuario(null);
      // Si es gerente o supervisor, pre-seleccionar su sede principal
      const userRole = userProfile?.rol_info?.codigo?.toLowerCase() || '';
      const isManager = userRole.includes('gerente') || userRole.includes('supervisor');
      
      setFormData({
        dni: '',
        nombre_completo: '',
        password: '',
        cargo: '',
        telefono: '',
        email: '',
        sede: isManager ? (userProfile?.sede || '') : '',
        rol: '',
        activo: true,
        debe_cambiar_password: true,
        observacion: '',
        sedes_ids: isManager ? [userProfile?.sede].filter(Boolean) : []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUsuario(null);
  };

  const handleOpenPasswordModal = (usuario) => {
    setCurrentUsuario(usuario);
    setPasswordData({
      password: '',
      debe_cambiar_password: true
    });
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setCurrentUsuario(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Si cambia la sede central, asegurarnos de que esté en sedes_ids
      if (name === 'sede' && value) {
        const sedeId = parseInt(value);
        if (!prev.sedes_ids.includes(sedeId)) {
          newData.sedes_ids = [...prev.sedes_ids, sedeId];
        }
      }

      return newData;
    });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleSede = (sedeId) => {
    setFormData(prev => {
      const currentSedes = prev.sedes_ids || [];
      const isSelected = currentSedes.includes(sedeId);
      
      // La sede central siempre debe estar en sedes_ids
      if (sedeId === parseInt(prev.sede)) return prev;

      const newSedes = isSelected
        ? currentSedes.filter(id => id !== sedeId)
        : [...currentSedes, sedeId];
        
      return { ...prev, sedes_ids: newSedes };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    
    const url = currentUsuario 
      ? `${API_URL}/usuarios/${currentUsuario.id}/` 
      : `${API_URL}/usuarios/`;
      
    const method = currentUsuario ? 'PUT' : 'POST';

    try {
      const payload = { ...formData };
      
      // Si estamos editando y no se ingresó contraseña, la quitamos del payload
      if (currentUsuario && !payload.password) {
        delete payload.password;
      }
      
      // Limpiar nulos
      if (payload.cargo === '') payload.cargo = null;
      if (payload.telefono === '') payload.telefono = null;
      if (payload.email === '') payload.email = null;
      if (payload.sede === '') payload.sede = null;
      if (payload.rol === '') payload.rol = null;
      if (payload.observacion === '') payload.observacion = null;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        fetchData();
        handleCloseModal();
        if (!currentUsuario) {
          setNewCredentials({
            dni: data.dni,
            password: data.password_plano || formData.password,
            nombre: data.nombre_completo
          });
          setIsSuccessModalOpen(true);
          showNotification('Usuario creado correctamente.', 'success');
        } else {
          showNotification('Usuario actualizado correctamente.', 'success');
        }
      } else {
        const errorData = await res.json();
        showNotification(`Error al guardar: ${JSON.stringify(errorData)}`, 'error');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      showNotification('No se pudo realizar la acción. Verifique los datos.', 'error');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${API_URL}/usuarios/${currentUsuario.id}/change-password/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(passwordData)
      });

      if (res.ok) {
        showNotification('Contraseña actualizada correctamente.', 'success');
        setIsPasswordModalOpen(false);
        setPasswordData({ password: '', debe_cambiar_password: true });
      } else {
        showNotification('Error al cambiar la contraseña.', 'error');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      showNotification('No se pudo realizar la acción.', 'error');
    }
  };

  const handleToggleActive = async (usuario) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/usuarios/${usuario.id}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ activo: !usuario.activo })
      });

      if (res.ok) {
        fetchData();
        showNotification('Usuario actualizado correctamente.', 'success');
      } else {
        showNotification('Error al actualizar el estado del usuario.', 'error');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      showNotification('No se pudo realizar la acción.', 'error');
    }
  };

  // Filtrado local
  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = 
      user.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cargo?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSede = filterSede === '' || user.sede === parseInt(filterSede);
    const matchesRol = filterRol === '' || user.rol === parseInt(filterRol);
    const matchesEstado = filterEstado === '' || user.activo === (filterEstado === 'true');

    return matchesSearch && matchesSede && matchesRol && matchesEstado;
  });

  return (
    <MainLayout 
      title="Gestión de Usuarios" 
      subtitle="Administra los accesos, roles y sedes de los trabajadores."
    >
      <div className="usuarios-container card">
        
        {/* Barra de Filtros en Dos Filas */}
        <div className="filters-container">
          <div className="filters-top-row">
            <div className="search-group">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, DNI, cargo o correo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field search-input"
              />
            </div>
            <button className="btn btn-primary btn-add-user" onClick={() => handleOpenModal()}>
              <Plus size={20} />
              <span>Nuevo Usuario</span>
            </button>
          </div>
          
          <div className="filters-bottom-row">
            <div className="filter-select-wrapper">
              <Building size={16} className="select-icon" />
              <select value={filterSede} onChange={(e) => setFilterSede(e.target.value)} className="input-field filter-select">
                <option value="">Todas las Sedes</option>
                {sedes.map(sede => (
                  <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <Shield size={16} className="select-icon" />
              <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)} className="input-field filter-select">
                <option value="">Todos los Roles</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <Filter size={16} className="select-icon" />
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="input-field filter-select">
                <option value="">Todos los Estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla o Estado de Carga */}
        {loading ? (
          <div className="loading-state">Cargando usuarios...</div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="empty-state">
            <User size={48} className="empty-icon" />
            <p>No se encontraron usuarios con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario / DNI</th>
                  <th>Nombre Completo</th>
                  <th>Cargo</th>
                  <th>Sede</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="font-semibold">{user.dni}</div>
                    </td>
                    <td>{user.nombre_completo}</td>
                    <td>{user.cargo || '-'}</td>
                    <td>{user.sede_info?.nombre || '-'}</td>
                    <td>
                      <span className={`role-badge ${user.rol_info?.codigo?.toLowerCase()}`}>
                        {user.rol_info?.nombre || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.activo ? 'valid' : 'invalid'}`}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon text-primary" 
                          onClick={() => handleOpenModal(user)}
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="btn-icon text-warning" 
                          onClick={() => handleOpenPasswordModal(user)}
                          title="Cambiar Contraseña"
                        >
                          <Key size={18} />
                        </button>
                        <button 
                          className={`btn-icon ${user.activo ? 'text-danger' : 'text-success'}`}
                          onClick={() => handleToggleActive(user)}
                          title={user.activo ? 'Desactivar' : 'Activar'}
                        >
                          <User size={18} />
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

      {/* Modal Principal (Crear/Editar) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>{currentUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="btn-icon" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-body">
                
                {/* Sección 1: Datos de acceso */}
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-title-icon">🔑</span> Datos de acceso
                  </h3>
                  <div className="form-grid-2">
                    <div className={`form-group ${currentUsuario ? 'full-width' : ''}`}>
                      <label>DNI (Username) *</label>
                      <input 
                        type="text" 
                        name="dni"
                        value={formData.dni} 
                        onChange={handleInputChange} 
                        required 
                        disabled={!!currentUsuario}
                        className="input-field"
                        placeholder="Ej. 12345678"
                        maxLength={8}
                      />
                    </div>
                    {!currentUsuario && (
                      <div className="form-group">
                        <label>Contraseña Temporal *</label>
                        <div className="password-input-wrapper">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            name="password"
                            value={formData.password} 
                            onChange={handleInputChange} 
                            required={!currentUsuario}
                            className="input-field"
                            placeholder="Asigna una contraseña inicial"
                          />
                          <button 
                            type="button" 
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? 'Ocultar' : 'Ver'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección 2: Datos personales */}
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-title-icon">👤</span> Datos personales
                  </h3>
                  <div className="form-grid-2">
                    <div className="form-group full-width">
                      <label>Nombre Completo *</label>
                      <input 
                        type="text" 
                        name="nombre_completo"
                        value={formData.nombre_completo} 
                        onChange={handleInputChange} 
                        required 
                        className="input-field"
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cargo</label>
                      <input 
                        type="text" 
                        name="cargo"
                        value={formData.cargo} 
                        onChange={handleInputChange} 
                        className="input-field"
                        placeholder="Ej. Supervisor"
                      />
                    </div>
                    <div className="form-group">
                      <label>Celular</label>
                      <input 
                        type="text" 
                        name="telefono"
                        value={formData.telefono} 
                        onChange={handleInputChange} 
                        className="input-field"
                        placeholder="Ej. 987654321"
                        maxLength={9}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Correo Electrónico</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleInputChange} 
                        className="input-field"
                        placeholder="Ej. correo@dominio.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 3: Asignación del sistema */}
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-title-icon">⚙️</span> Asignación del sistema
                  </h3>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Rol *</label>
                      <select name="rol" value={formData.rol} onChange={handleInputChange} required className="input-field">
                        <option value="">Seleccione un Rol</option>
                        {roles
                          .filter(rol => {
                            const userRole = userProfile?.rol_info?.codigo?.toUpperCase() || userProfile?.rol_info?.nombre?.toUpperCase() || '';
                            if (userRole.includes('ADMIN') || userRole === 'SUPERADMIN') return true;
                            if (userRole.includes('GERENTE') || userRole.includes('SUPERVISOR')) {
                              const targetRol = (rol.codigo || rol.nombre || '').toUpperCase();
                              return ['OPERADOR', 'ASESOR'].includes(targetRol);
                            }
                            return false;
                          })
                          .map(rol => (
                            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                          ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Sede Principal *</label>
                      <select name="sede" value={formData.sede} onChange={handleInputChange} required className="input-field">
                        <option value="">Seleccione una Sede</option>
                        {sedes.map(sede => (
                          <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Selector Dinámico para Gerentes */}
                    {roles.find(r => r.id == formData.rol)?.nombre?.toLowerCase().includes('gerente') && (
                      <div className="form-group full-width">
                        <label>Sedes Autorizadas (Multiselección) *</label>
                        <div className="sede-selection-container">
                          <div className="selection-header-info">
                            <h4>Selecciona las sedes adicionales</h4>
                            <span className="badge-count">
                              {(formData.sedes_ids || []).length} seleccionadas
                            </span>
                          </div>
                          
                          <div className="sede-chips-grid">
                            {sedes.map(sede => {
                              const isCentral = parseInt(formData.sede) === sede.id;
                              const isSelected = (formData.sedes_ids || []).includes(sede.id) || isCentral;
                              
                              return (
                                <div 
                                  key={sede.id} 
                                  className={`sede-chip-item ${isSelected ? 'selected' : ''} ${isCentral ? 'is_central' : ''}`}
                                  onClick={() => !isCentral && toggleSede(sede.id)}
                                >
                                  {isCentral && <span className="central-badge">Central</span>}
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
                    )}
                  </div>
                </div>

                {/* Sección 4: Observación y Estados */}
                <div className="form-section" style={{ marginBottom: 0 }}>
                  <h3 className="section-title">
                    <span className="section-title-icon">📝</span> Observación y Estados
                  </h3>
                  <div className="form-grid-2">
                    <div className="form-group full-width">
                      <label>Observación</label>
                      <textarea 
                        name="observacion"
                        value={formData.observacion} 
                        onChange={handleInputChange} 
                        className="input-field textarea-field"
                        placeholder="Notas adicionales sobre el usuario..."
                      />
                    </div>
                    
                    <div className="form-group full-width">
                      <div className="checkbox-row">
                        <div className="checkbox-group">
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              name="activo"
                              checked={formData.activo} 
                              onChange={handleInputChange} 
                            />
                            <span>Usuario Activo</span>
                          </label>
                        </div>
                        <div className="checkbox-group">
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              name="debe_cambiar_password"
                              checked={formData.debe_cambiar_password} 
                              onChange={handleInputChange} 
                            />
                            <span>Exigir cambio de contraseña</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentUsuario ? 'Actualizar Usuario' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Contraseña */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>Cambiar Contraseña</h2>
              <button className="btn-icon" onClick={handleClosePasswordModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleChangePasswordSubmit} className="modal-form">
              <div className="modal-body">
                <p className="text-sm text-muted mb-4">
                  Asignando nueva contraseña para: <strong>{currentUsuario?.nombre_completo}</strong>
                </p>
                
                <div className="form-group">
                  <label>Nueva Contraseña Temporal *</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showModalPassword ? "text" : "password"} 
                      name="password"
                      value={passwordData.password} 
                      onChange={handlePasswordInputChange} 
                      required 
                      className="input-field"
                      placeholder="Ingrese la nueva contraseña"
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                    >
                      {showModalPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleClosePasswordModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Éxito al Crear Usuario */}
      {isSuccessModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content text-center">
            <div className="modal-header justify-center">
              <div className="success-icon-large">
                <CheckCircle size={48} className="text-success" />
              </div>
            </div>
            <h2 className="mt-4">¡Usuario Creado con Éxito!</h2>
            <p className="text-muted mb-6">Comparte estas credenciales con el trabajador:</p>
            
            <div className="credentials-box">
              <div className="credential-item">
                <span>DNI / Usuario:</span>
                <strong>{newCredentials?.dni}</strong>
              </div>
              <div className="credential-item">
                <span>Contraseña Temporal:</span>
                <strong>{newCredentials?.password}</strong>
              </div>
            </div>

            <div className="modal-footer justify-center mt-6">
              <button 
                className="btn btn-primary w-full" 
                onClick={() => setIsSuccessModalOpen(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Usuarios;
