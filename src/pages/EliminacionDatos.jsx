import React from 'react';
import { Trash2, Mail, Phone, MapPin, Globe, ShieldAlert, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const EliminacionDatos = () => {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans flex flex-col">
      {/* Header Simple */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Trash2 className="text-rose-500 w-7 h-7" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                Fin<span className="text-sky-500">Control</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Plataforma de gestión operativa</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs font-semibold">
            <Link to="/politica-privacidad" className="text-slate-500 hover:text-slate-700">Política de Privacidad</Link>
            <Link to="/eliminacion-datos" className="text-sky-600 hover:text-sky-700">Eliminación de Datos</Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6 md:p-10">
          {/* Cabecera del Documento */}
          <div className="border-b border-slate-100 pb-6 mb-6">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 text-xs px-3 py-1 rounded-full font-bold mb-3">
              <Trash2 size={14} />
              <span>Solicitudes de Privacidad</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">Solicitud de Eliminación o Desactivación de Datos - FinControl</h2>
            <p className="text-slate-500 text-xs mt-2 font-medium">Última actualización: 06 de junio de 2026</p>
          </div>

          <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
            {/* 1. Descripción general */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Descripción general</span>
              </h3>
              <p className="mb-3">
                FinControl es una plataforma empresarial de gestión operativa desarrollada por Finatech S.A.C., utilizada por empresas para administrar jornadas laborales, asistencia, ubicaciones, actividades de campo, incidencias y reportes de su personal autorizado.
              </p>
              <p>
                La aplicación móvil FinControl no permite que el trabajador elimine directamente su cuenta desde la app, debido a que las cuentas son creadas, asignadas y administradas por la empresa contratante mediante el panel administrativo web.
              </p>
            </section>

            {/* 2. Administración de cuentas */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Administración de cuentas</span>
              </h3>
              <p className="mb-3">
                Las cuentas de usuario de FinControl son gestionadas por la empresa contratante.
              </p>
              <p className="mb-3">
                Esto significa que la creación, modificación, desactivación o eliminación de usuarios se realiza de forma centralizada por:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 font-medium text-slate-700">
                <li>El administrador de la empresa contratante.</li>
                <li>El área de Recursos Humanos.</li>
                <li>El área de Administración.</li>
                <li>Supervisores o gerentes autorizados.</li>
                <li>Soporte de Finatech S.A.C., cuando corresponda.</li>
              </ul>
            </section>

            {/* 3. Cómo solicitar eliminación o desactivación */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Cómo solicitar eliminación o desactivación</span>
              </h3>
              <p className="mb-4">
                El usuario puede solicitar la eliminación, desactivación o corrección de sus datos mediante cualquiera de los siguientes canales:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Mail className="text-sky-500 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs text-slate-700 block">Correo electrónico:</span>
                    <a href="mailto:finaredtechnology@gmail.com" className="text-sky-600 hover:underline text-xs font-medium">finaredtechnology@gmail.com</a>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Phone className="text-sky-500 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs text-slate-700 block">Teléfono / WhatsApp:</span>
                    <span className="text-slate-600 text-xs font-medium">951805026</span>
                  </div>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="text-sky-600 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs text-sky-800 font-medium">
                  También puede solicitarlo directamente al administrador o responsable de Recursos Humanos de la empresa contratante.
                </p>
              </div>
            </section>

            {/* 4. Información que debe incluir la solicitud */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Información que debe incluir la solicitud</span>
              </h3>
              <p className="mb-3">
                Para atender correctamente la solicitud, el usuario debe enviar:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 text-xs">
                <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0" />
                  <span>Nombre completo.</span>
                </li>
                <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0" />
                  <span>DNI o identificador registrado.</span>
                </li>
                <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0" />
                  <span>Empresa a la que pertenece.</span>
                </li>
                <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0" />
                  <span>Sede asignada, si la conoce.</span>
                </li>
                <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 col-span-1 sm:col-span-2">
                  <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0" />
                  <span>Motivo de la solicitud.</span>
                </li>
              </ul>

              <div className="mt-4">
                <p className="text-xs font-bold text-slate-700 mb-2">Tipo de solicitud:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-semibold">
                  <span className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-center">Eliminación de cuenta</span>
                  <span className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-center">Desactivación de cuenta</span>
                  <span className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-center">Corrección de datos</span>
                  <span className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-center">Actualización de datos</span>
                  <span className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-center">Eliminación de token FCM</span>
                  <span className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-center">Eliminación de datos personales cuando corresponda</span>
                </div>
              </div>
            </section>

            {/* 5. Datos que pueden eliminarse o desactivarse */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <span>Datos que pueden eliminarse o desactivarse</span>
              </h3>
              <p className="mb-3">
                Según corresponda, se puede solicitar la eliminación o desactivación de:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-slate-700">
                <li>Cuenta de usuario.</li>
                <li>Datos de identificación.</li>
                <li>Usuario de acceso.</li>
                <li>Rol asignado.</li>
                <li>Sede asignada.</li>
                <li>Token FCM de notificaciones push.</li>
                <li>Información asociada al perfil operativo.</li>
              </ul>
            </section>

            {/* 6. Datos que pueden conservarse por obligación operativa o legal */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">6</span>
                <span>Datos que pueden conservarse por obligación operativa o legal</span>
              </h3>
              <p className="mb-3">
                Algunos registros pueden conservarse cuando sean necesarios por motivos administrativos, laborales, contractuales, legales o de auditoría.
              </p>
              <p className="mb-3">
                Esto puede incluir:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Jornadas registradas.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Marcaciones de entrada y salida.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Descansos.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Historial de asistencia.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Incidencias.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Actividades de campo.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Evidencias asociadas.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Recorridos GPS vinculados a jornadas laborales.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Reportes operativos.</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <FileText className="text-slate-400 w-4 h-4 shrink-0" />
                  <span>Auditorías internas del sistema.</span>
                </div>
              </div>
              <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs italic">
                La conservación de estos datos dependerá de las obligaciones de la empresa contratante, la normativa aplicable y las políticas internas de gestión laboral.
              </p>
            </section>

            {/* 7. Tiempo de atención */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">7</span>
                <span>Tiempo de atención</span>
              </h3>
              <p className="mb-3">
                Finatech S.A.C. evaluará la solicitud y, cuando corresponda, coordinará con la empresa contratante.
              </p>
              <p className="mb-3">
                La atención se realizará en un plazo razonable, sujeto a:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-slate-700">
                <li>Validación de identidad.</li>
                <li>Verificación de relación laboral u operativa.</li>
                <li>Confirmación con la empresa contratante.</li>
                <li>Obligaciones de conservación legal, laboral o administrativa.</li>
              </ul>
            </section>

            {/* 8. Eliminación del token de notificaciones push */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">8</span>
                <span>Eliminación del token de notificaciones push</span>
              </h3>
              <p>
                Si el usuario solicita la desactivación de su cuenta o la eliminación de datos asociados al dispositivo, FinControl podrá eliminar o desactivar el token FCM vinculado al usuario, impidiendo el envío de nuevas notificaciones push al dispositivo registrado.
              </p>
            </section>

            {/* 9. Contacto del responsable */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">9</span>
                <span>Contacto del responsable</span>
              </h3>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-700">Empresa / Dirección:</span>
                    Finatech S.A.C. (RUC: 20614686813)<br />
                    Loreto 757, Iquitos, Loreto, Perú
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-700">Correo electrónico:</span>
                    <a href="mailto:finaredtechnology@gmail.com" className="text-sky-600 hover:underline">finaredtechnology@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-700">Teléfono / WhatsApp:</span>
                    951805026
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-700">Sitio Web:</span>
                    <a href="https://fincontrol.finatech.com.pe" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">https://fincontrol.finatech.com.pe</a>
                  </div>
                </div>
              </div>
            </section>

            {/* 10. Enlace relacionado */}
            <section className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="text-sky-600 w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sky-900 text-xs mb-1">Enlace relacionado</h4>
                <p className="text-xs text-sky-800">
                  Puede revisar la Política de Privacidad completa en:
                </p>
                <Link to="/politica-privacidad" className="inline-block font-bold text-sky-600 hover:text-sky-700 underline mt-1.5">
                  https://fincontrol.finatech.com.pe/politica-privacidad
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-6 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; 2026 Finatech S.A.C. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <Link to="/politica-privacidad" className="hover:text-slate-600">Política de Privacidad</Link>
            <Link to="/eliminacion-datos" className="hover:text-slate-600">Eliminación de Datos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EliminacionDatos;
