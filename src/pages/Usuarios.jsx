import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  User, 
  Key, 
  X, 
  Search, 
  Filter, 
  Shield, 
  Building, 
  CheckCircle, 
  MapPin,
  Circle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Lock,
  Briefcase,
  Phone,
  Mail,
  FileText,
  Contact,
  UserCheck,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
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

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Control de paso activo en el formulario
  const [activeStep, setActiveStep] = useState(1);

  // Filtro de sedes autorizadas en el modal
  const [sedeSearchQuery, setSedeSearchQuery] = useState('');

  // Helper para generar iniciales
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Helper para el tema del avatar
  const getAvatarTheme = (name) => {
    const colors = [
      { bg: '#e0f2fe', text: '#0284c7' }, // Blue/Sky
      { bg: '#dcfce7', text: '#15803d' }, // Green
      { bg: '#ecfeff', text: '#0891b2' }, // Cyan
      { bg: '#f3e8ff', text: '#7e22ce' }, // Purple
      { bg: '#fce7f3', text: '#be185d' }, // Pink
      { bg: '#ffe4e6', text: '#be123c' }  // Red/Rose
    ];
    let sum = 0;
    if (name) {
      sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }
    return colors[sum % colors.length];
  };

  const scrollToSection = (id, stepNumber) => {
    if (stepNumber !== undefined) {
      setActiveStep(stepNumber);
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleModalScroll = (e) => {
    const container = e.target;
    const containerRect = container.getBoundingClientRect();
    
    const sections = [
      { id: 'section-acceso', step: 1 },
      { id: 'section-perfil', step: 2 },
      { id: 'section-asignacion', step: 3 },
      { id: 'section-estado', step: 4 }
    ];
    
    let currentStep = 1;
    let minDiff = Infinity;
    
    sections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        const diff = Math.abs(rect.top - containerRect.top);
        if (diff < minDiff) {
          minDiff = diff;
          currentStep = sec.step;
        }
      }
    });
    
    setActiveStep(currentStep);
  };

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
        // Filtrar el administrador de sistema para que no sea visible en la interfaz
        const filteredData = data.filter(u => {
          const isSystemAdmin = 
            u.nombre_completo?.toLowerCase() === 'administrador sistema' || 
            u.dni === '87654321' || 
            u.username?.toLowerCase() === 'admin';
          return !isSystemAdmin;
        });
        setUsuarios(filteredData);
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
    setActiveStep(1);
    setSedeSearchQuery('');
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

  // Cálculos de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsuariosList = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage) || 1;

  // Variables para la selección de sedes autorizadas
  const selectedRoleName = roles.find(r => r.id == formData.rol)?.nombre?.toLowerCase() || '';
  const showSedesSelection = selectedRoleName.includes('gerente') || selectedRoleName.includes('supervisor') || selectedRoleName.includes('admin') || selectedRoleName.includes('administrador');
  
  const filteredSedesForSelection = sedes.filter(sede =>
    sede.nombre?.toLowerCase().includes(sedeSearchQuery.toLowerCase())
  );

  return (
    <MainLayout 
      title="Gestión de Usuarios" 
      subtitle="Administra los accesos, roles y sedes de los trabajadores."
    >
      <div className="flex flex-col gap-6 w-full animate-in select-none">
        
        {/* Fila de KPIs Superiores */}
        <div className="users-kpi-grid">
          {/* Card 1: Total Usuarios */}
          <div className="users-kpi-card">
            <div className="users-kpi-icon bg-sky-50 text-sky-500">
              <User className="w-5 h-5" />
            </div>
            <div className="users-kpi-text">
              <span className="users-kpi-title">Total Usuarios</span>
              <span className="users-kpi-value">{usuarios.length}</span>
              <span className="users-kpi-subtext">Usuarios registrados</span>
            </div>
          </div>

          {/* Card 2: Operadores */}
          <div className="users-kpi-card">
            <div className="users-kpi-icon bg-emerald-50 text-emerald-500">
              <User className="w-5 h-5" />
            </div>
            <div className="users-kpi-text">
              <span className="users-kpi-title">Operadores</span>
              <span className="users-kpi-value">
                {usuarios.filter(u => (u.rol_info?.nombre || '').toLowerCase().includes('operador') || (u.rol_info?.codigo || '').toLowerCase().includes('operador')).length}
              </span>
              <span className="users-kpi-subtext">Cuentas con rol operador</span>
            </div>
          </div>

          {/* Card 3: Asesores */}
          <div className="users-kpi-card">
            <div className="users-kpi-icon bg-purple-50 text-purple-500">
              <User className="w-5 h-5" />
            </div>
            <div className="users-kpi-text">
              <span className="users-kpi-title">Asesores</span>
              <span className="users-kpi-value">
                {usuarios.filter(u => (u.rol_info?.nombre || '').toLowerCase().includes('asesor') || (u.rol_info?.codigo || '').toLowerCase().includes('asesor')).length}
              </span>
              <span className="users-kpi-subtext">Cuentas con rol asesor</span>
            </div>
          </div>

          {/* Card 4: Administradores */}
          <div className="users-kpi-card">
            <div className="users-kpi-icon bg-rose-50 text-rose-500">
              <Shield className="w-5 h-5" />
            </div>
            <div className="users-kpi-text">
              <span className="users-kpi-title">Administradores</span>
              <span className="users-kpi-value">
                {usuarios.filter(u => (u.rol_info?.nombre || '').toLowerCase().includes('admin') || (u.rol_info?.codigo || '').toLowerCase().includes('admin')).length}
              </span>
              <span className="users-kpi-subtext">Cuentas con rol admin</span>
            </div>
          </div>
        </div>

        {/* Contenedor Principal de la Tabla */}
        <div className="usuarios-container card">
          
          {/* Barra de Filtros Unificada */}
          <div className="filters-bar">
            {/* Buscador */}
            <div className="search-group">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, DNI, cargo o correo..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field search-input"
              />
            </div>

            {/* Selector Sede */}
            <div className="filter-select-card">
              <MapPin size={16} className="filter-card-icon" />
              <div className="filter-card-text">
                <span className="filter-card-label">Sede</span>
                <span className="filter-card-value">
                  {sedes.find(s => s.id === parseInt(filterSede))?.nombre || 'Todas las sedes'}
                </span>
              </div>
              <ChevronDown size={14} className="filter-card-chevron" />
              <select 
                value={filterSede} 
                onChange={(e) => {
                  setFilterSede(e.target.value);
                  setCurrentPage(1);
                }} 
                className="filter-select-overlay"
              >
                <option value="">Todas las Sedes</option>
                {sedes.map(sede => (
                  <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                ))}
              </select>
            </div>

            {/* Selector Rol */}
            <div className="filter-select-card">
              <User size={16} className="filter-card-icon" />
              <div className="filter-card-text">
                <span className="filter-card-label">Rol</span>
                <span className="filter-card-value">
                  {roles.find(r => r.id === parseInt(filterRol))?.nombre || 'Todos los roles'}
                </span>
              </div>
              <ChevronDown size={14} className="filter-card-chevron" />
              <select 
                value={filterRol} 
                onChange={(e) => {
                  setFilterRol(e.target.value);
                  setCurrentPage(1);
                }} 
                className="filter-select-overlay"
              >
                <option value="">Todos los Roles</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                ))}
              </select>
            </div>

            {/* Selector Estado */}
            <div className="filter-select-card">
              <Circle size={16} className="filter-card-icon" />
              <div className="filter-card-text">
                <span className="filter-card-label">Estado</span>
                <span className="filter-card-value">
                  {filterEstado === 'true' ? 'Activos' : filterEstado === 'false' ? 'Inactivos' : 'Todos los estados'}
                </span>
              </div>
              <ChevronDown size={14} className="filter-card-chevron" />
              <select 
                value={filterEstado} 
                onChange={(e) => {
                  setFilterEstado(e.target.value);
                  setCurrentPage(1);
                }} 
                className="filter-select-overlay"
              >
                <option value="">Todos los Estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            {/* Botón Nuevo Usuario */}
            <button className="btn-add-user" onClick={() => handleOpenModal()} type="button">
              <Plus size={16} />
              <span>Nuevo Usuario</span>
            </button>
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
            <>
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
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsuariosList.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-profile-cell">
                            <div 
                              className="user-avatar-circle"
                              style={{
                                backgroundColor: getAvatarTheme(user.nombre_completo).bg,
                                color: getAvatarTheme(user.nombre_completo).text
                              }}
                            >
                              {getInitials(user.nombre_completo)}
                            </div>
                            <div className="user-profile-text">
                              <span className="user-dni-value">{user.dni}</span>
                              <span className="user-username-value">{user.username || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="user-name-cell">{user.nombre_completo}</td>
                        <td className="user-cargo-cell">{user.cargo || '—'}</td>
                        <td className="user-sede-cell">{user.sede_info?.nombre || '—'}</td>
                        <td>
                          <span className={`role-badge-pill ${user.rol_info?.codigo?.toLowerCase()}`}>
                            {user.rol_info?.nombre || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge-pill ${user.activo ? 'active' : 'inactive'}`}>
                            {user.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            <button 
                              className="btn-action-edit" 
                              onClick={() => handleOpenModal(user)}
                              title="Editar"
                              type="button"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="btn-action-key" 
                              onClick={() => handleOpenPasswordModal(user)}
                              title="Cambiar Contraseña"
                              type="button"
                            >
                              <Key size={16} />
                            </button>
                            <button 
                              className={`btn-action-status ${user.activo ? 'active' : 'inactive'}`}
                              onClick={() => handleToggleActive(user)}
                              title={user.activo ? 'Desactivar' : 'Activar'}
                              type="button"
                            >
                              <User size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table pagination footer */}
              <div className="table-pagination-footer">
                <span className="pagination-legend">
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredUsuarios.length)} de {filteredUsuarios.length} usuarios
                </span>

                <div className="pagination-buttons">
                  <button
                    className="btn-page-arrow"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    type="button"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn-page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                      type="button"
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="btn-page-arrow"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    type="button"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Modal Principal (Crear/Editar) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="modal-header-text">
                  <h2>{currentUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                  <p>Registra un nuevo trabajador y configura su acceso al sistema.</p>
                </div>
              </div>
              <button className="btn-icon modal-close-btn" onClick={handleCloseModal} type="button">
                <X size={20} />
              </button>
            </div>

            {/* Step navigation indicator */}
            <div className="modal-steps-indicator">
              <div className={`step-item ${activeStep === 1 ? 'active' : ''}`} onClick={() => scrollToSection('section-acceso', 1)}>
                <div className="step-number">1</div>
                <div className="step-label">
                  <span className="step-title">Acceso</span>
                  <span className="step-desc">Credenciales</span>
                </div>
              </div>
              <div className="step-connector"></div>
              <div className={`step-item ${activeStep === 2 ? 'active' : ''}`} onClick={() => scrollToSection('section-perfil', 2)}>
                <div className="step-number">2</div>
                <div className="step-label">
                  <span className="step-title">Perfil</span>
                  <span className="step-desc">Información personal</span>
                </div>
              </div>
              <div className="step-connector"></div>
              <div className={`step-item ${activeStep === 3 ? 'active' : ''}`} onClick={() => scrollToSection('section-asignacion', 3)}>
                <div className="step-number">3</div>
                <div className="step-label">
                  <span className="step-title">Asignación</span>
                  <span className="step-desc">Rol y sede</span>
                </div>
              </div>
              <div className="step-connector"></div>
              <div className={`step-item ${activeStep === 4 ? 'active' : ''}`} onClick={() => scrollToSection('section-estado', 4)}>
                <div className="step-number">4</div>
                <div className="step-label">
                  <span className="step-title">Estado</span>
                  <span className="step-desc">Observaciones</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-body user-modal-body" onScroll={handleModalScroll}>
                
                {/* Sección 1: Datos de acceso */}
                <div className="form-section-card" id="section-acceso">
                  <div className="form-section-card-header">
                    <div className="form-section-card-icon-box bg-blue-50 text-blue-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="form-section-card-header-text">
                      <h3>Datos de acceso</h3>
                      <p>Credenciales de acceso al sistema.</p>
                    </div>
                  </div>
                  
                  <div className="form-grid-2">
                    <div className={`form-group ${currentUsuario ? 'full-width' : ''}`}>
                      <label>DNI (Username) <span className="text-rose-500">*</span></label>
                      <div className="relative input-wrapper">
                        <Contact className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          type="text" 
                          name="dni"
                          value={formData.dni} 
                          onChange={handleInputChange} 
                          required 
                          disabled={!!currentUsuario}
                          className="input-field pl-9"
                          placeholder="12345678"
                          maxLength={8}
                        />
                      </div>
                    </div>
                    {!currentUsuario && (
                      <div className="form-group">
                        <label>Contraseña temporal <span className="text-rose-500">*</span></label>
                        <div className="password-input-row">
                          <div className="relative password-field-wrapper flex-1">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                              type={showPassword ? "text" : "password"} 
                              name="password"
                              value={formData.password} 
                              onChange={handleInputChange} 
                              required={!currentUsuario}
                              className="input-field pl-9 pr-9"
                              placeholder="••••••••••••"
                            />
                            <button 
                              type="button" 
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <button 
                            type="button" 
                            className="btn-password-toggle-text"
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
                <div className="form-section-card" id="section-perfil">
                  <div className="form-section-card-header">
                    <div className="form-section-card-icon-box bg-blue-50 text-blue-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="form-section-card-header-text">
                      <h3>Datos personales</h3>
                      <p>Información personal del usuario.</p>
                    </div>
                  </div>
                  
                  <div className="form-grid-2">
                    <div className="form-group full-width">
                      <label>Nombre completo <span className="text-rose-500">*</span></label>
                      <div className="relative input-wrapper">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          type="text" 
                          name="nombre_completo"
                          value={formData.nombre_completo} 
                          onChange={handleInputChange} 
                          required 
                          className="input-field pl-9"
                          placeholder="Juan Pérez"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Cargo</label>
                      <div className="relative input-wrapper">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          type="text" 
                          name="cargo"
                          value={formData.cargo} 
                          onChange={handleInputChange} 
                          className="input-field pl-9"
                          placeholder="Supervisor"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Celular</label>
                      <div className="relative input-wrapper">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          type="text" 
                          name="telefono"
                          value={formData.telefono} 
                          onChange={handleInputChange} 
                          className="input-field pl-9"
                          placeholder="987654321"
                          maxLength={9}
                        />
                      </div>
                    </div>
                    <div className="form-group full-width">
                      <label>Correo electrónico</label>
                      <div className="relative input-wrapper">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email} 
                          onChange={handleInputChange} 
                          className="input-field pl-9"
                          placeholder="correo@dominio.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 3: Asignación del sistema */}
                <div className="form-section-card" id="section-asignacion">
                  <div className="form-section-card-header">
                    <div className="form-section-card-icon-box bg-blue-50 text-blue-500">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="form-section-card-header-text">
                      <h3>Asignación del sistema</h3>
                      <p>Configura los permisos y la sede principal del usuario.</p>
                    </div>
                  </div>
                  
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Rol <span className="text-rose-500">*</span></label>
                      <div className="relative select-wrapper">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        <select name="rol" value={formData.rol} onChange={handleInputChange} required autoComplete="off" className={`input-field pl-9 select-field ${!formData.rol ? 'text-slate-400' : 'text-slate-800'}`}>
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
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Sede principal <span className="text-rose-500">*</span></label>
                      <div className="relative select-wrapper">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        <select name="sede" value={formData.sede} onChange={handleInputChange} required autoComplete="off" className={`input-field pl-9 select-field ${!formData.sede ? 'text-slate-400' : 'text-slate-800'}`}>
                          <option value="">Seleccione una Sede</option>
                          {sedes.map(sede => (
                            <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>
                    
                    {/* Selector Dinámico para Gerentes/Supervisores/Administradores */}
                    {showSedesSelection && (
                      <div className="form-group full-width">
                        <div className="sede-selection-container">
                          <div className="selection-header-info">
                            <div className="selection-header-left">
                              <h4>Sedes autorizadas</h4>
                              <p>
                                El {selectedRoleName.includes('gerente') ? 'gerente' : selectedRoleName.includes('supervisor') ? 'supervisor' : 'administrador'} podrá supervisar y gestionar múltiples sedes.
                              </p>
                            </div>
                            <span className="badge-count">
                              {((formData.sedes_ids || []).includes(parseInt(formData.sede)) ? (formData.sedes_ids || []).length : ((formData.sedes_ids || []).length + (formData.sede ? 1 : 0)))} seleccionadas
                            </span>
                          </div>
                          
                          <div className="sede-search-wrapper">
                            <Search className="sede-search-icon" size={16} />
                            <input 
                              type="text"
                              placeholder="Buscar sede..."
                              value={sedeSearchQuery}
                              onChange={(e) => setSedeSearchQuery(e.target.value)}
                              className="sede-search-input"
                              autoComplete="off"
                            />
                          </div>

                          <div className="sede-cards-grid">
                            {filteredSedesForSelection.map(sede => {
                              const isCentral = parseInt(formData.sede) === sede.id;
                              const isSelected = (formData.sedes_ids || []).includes(sede.id) || isCentral;
                              
                              return (
                                <div 
                                  key={sede.id} 
                                  className={`sede-card-item ${isSelected ? 'selected' : ''} ${isCentral ? 'is_central' : ''}`}
                                  onClick={() => !isCentral && toggleSede(sede.id)}
                                >
                                  <div className="sede-card-left">
                                    <MapPin size={18} className="sede-pin-icon" />
                                    <span className="sede-card-name">
                                      {isCentral ? `Central - ${sede.nombre}` : sede.nombre}
                                    </span>
                                  </div>
                                  <div className="sede-card-right">
                                    {isSelected ? (
                                      <CheckCircle className="check-icon checked" size={18} />
                                    ) : (
                                      <div className="check-icon unchecked" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="selected-sedes-chips-footer">
                            <span className="selected-label">Seleccionadas</span>
                            <div className="selected-chips-list">
                              {formData.sede && (() => {
                                const centralSede = sedes.find(s => s.id === parseInt(formData.sede));
                                if (centralSede) {
                                  return (
                                    <div className="selected-sede-chip central">
                                      <span>Central - {centralSede.nombre}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              {sedes
                                .filter(s => (formData.sedes_ids || []).includes(s.id) && s.id !== parseInt(formData.sede))
                                .map(s => (
                                  <div key={s.id} className="selected-sede-chip">
                                    <span>{s.nombre}</span>
                                    <button 
                                      type="button" 
                                      className="remove-chip-btn"
                                      onClick={() => toggleSede(s.id)}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección 4: Observación y estado */}
                <div className="form-section-card" id="section-estado">
                  <div className="form-section-card-header">
                    <div className="form-section-card-icon-box bg-blue-50 text-blue-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="form-section-card-header-text">
                      <h3>Observación y estado</h3>
                      <p>Notas adicionales y configuración de estado del usuario.</p>
                    </div>
                  </div>
                  
                  <div className="status-section-grid">
                    <div className="form-group">
                      <label>Observación</label>
                      <textarea 
                        name="observacion"
                        value={formData.observacion} 
                        onChange={handleInputChange} 
                        className="textarea-field-mock"
                        placeholder="Notas adicionales sobre el usuario..."
                      />
                    </div>
                    
                    <div className="checkboxes-card-container">
                      <label className="checkbox-card-item">
                        <input 
                          type="checkbox" 
                          name="activo"
                          checked={formData.activo} 
                          onChange={handleInputChange} 
                        />
                        <span className="checkbox-card-custom-indicator"></span>
                        <div className="checkbox-card-icon-box">
                          <UserCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="checkbox-card-content">
                          <span className="checkbox-card-title">Usuario activo</span>
                          <span className="checkbox-card-desc active-desc">El usuario podrá acceder al sistema.</span>
                        </div>
                      </label>

                      <label className="checkbox-card-item">
                        <input 
                          type="checkbox" 
                          name="debe_cambiar_password"
                          checked={formData.debe_cambiar_password} 
                          onChange={handleInputChange} 
                        />
                        <span className="checkbox-card-custom-indicator"></span>
                        <div className="checkbox-card-icon-box">
                          <Lock className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="checkbox-card-content">
                          <span className="checkbox-card-title">Exigir cambio de contraseña</span>
                          <span className="checkbox-card-desc">El usuario deberá cambiar su contraseña al iniciar sesión.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  <XCircle size={16} />
                  <span>Cancelar</span>
                </button>
                <button type="submit" className="btn-modal-save">
                  <UserPlus size={16} />
                  <span>{currentUsuario ? 'Guardar usuario' : 'Guardar usuario'}</span>
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
