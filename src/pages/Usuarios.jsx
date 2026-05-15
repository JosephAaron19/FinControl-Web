import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, User, Key, X, Search, Filter, Shield, Building } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import './Usuarios.css';

const API_URL = import.meta.env.VITE_API_URL;

const Usuarios = () => {
  const navigate = useNavigate();
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
  const [currentUsuario, setCurrentUsuario] = useState(null);
  
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
    observacion: ''
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
        observacion: usuario.observacion || ''
      });
    } else {
      setCurrentUsuario(null);
      setFormData({
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
        observacion: ''
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        fetchData();
        handleCloseModal();
      } else {
        const errorData = await res.json();
        alert(`Error al guardar: ${JSON.stringify(errorData)}`);
      }
    } catch (err) {
      console.error('Error saving usuario:', err);
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
        alert('Contraseña actualizada con éxito');
        handleClosePasswordModal();
      } else {
        const errorData = await res.json();
        alert(`Error: ${JSON.stringify(errorData)}`);
      }
    } catch (err) {
      console.error('Error changing password:', err);
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
      } else {
        alert('Error al cambiar el estado del usuario');
      }
    } catch (err) {
      console.error('Error toggling active state:', err);
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
              <div className="form-row">
                <div className="form-group">
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
                <div className="form-group">
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
              </div>

              {!currentUsuario && (
                <div className="form-group">
                  <label>Contraseña Temporal *</label>
                  <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      value={formData.password} 
                      onChange={handleInputChange} 
                      required={!currentUsuario}
                      className="input-field"
                      placeholder="Asigna una contraseña inicial"
                      style={{ paddingRight: '40px' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-row">
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
              </div>

              <div className="form-group">
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

              <div className="form-row">
                <div className="form-group">
                  <label>Rol *</label>
                  <select name="rol" value={formData.rol} onChange={handleInputChange} required className="input-field">
                    <option value="">Seleccione un Rol</option>
                    {roles
                      .filter(rol => {
                        const userRole = userProfile?.rol_info?.codigo;
                        if (userRole === 'SUPERADMIN') return true;
                        if (userRole === 'GERENTE') {
                          return ['OPERADOR', 'ASESOR'].includes(rol.codigo);
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
              </div>

              <div className="form-group">
                <label>Observación</label>
                <textarea 
                  name="observacion"
                  value={formData.observacion} 
                  onChange={handleInputChange} 
                  className="input-field textarea-field"
                  placeholder="Notas adicionales sobre el usuario..."
                />
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
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
          <div className="modal-content">
            <div className="modal-header">
              <h2>Cambiar Contraseña</h2>
              <button className="btn-icon" onClick={handleClosePasswordModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleChangePasswordSubmit} className="modal-form">
              <p className="text-sm text-muted mb-4">
                Asignando nueva contraseña para: <strong>{currentUsuario?.nombre_completo}</strong>
              </p>
              
              <div className="form-group">
                <label>Nueva Contraseña Temporal *</label>
                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                  <input 
                    type={showModalPassword ? "text" : "password"} 
                    name="password"
                    value={passwordData.password} 
                    onChange={handlePasswordInputChange} 
                    required 
                    className="input-field"
                    placeholder="Ingrese la nueva contraseña"
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showModalPassword ? 'Ocultar' : 'Ver'}
                  </button>
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
    </MainLayout>
  );
};

export default Usuarios;
