import React from 'react';
import { Shield, Mail, Phone, MapPin, Globe, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PoliticaPrivacidad = () => {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans flex flex-col">
      {/* Header Simple */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="text-sky-500 w-7 h-7" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                Fin<span className="text-sky-500">Control</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Plataforma de gestión operativa</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs font-semibold">
            <Link to="/politica-privacidad" className="text-sky-600 hover:text-sky-700">Política de Privacidad</Link>
            <Link to="/eliminacion-datos" className="text-slate-500 hover:text-slate-700">Eliminación de Datos</Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6 md:p-10">
          <div className="border-b border-slate-100 pb-6 mb-6">
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 text-xs px-3 py-1 rounded-full font-bold mb-3">
              <Shield size={14} />
              <span>Documento Legal Oficial</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">Política de Privacidad</h2>
            <p className="text-slate-500 text-xs mt-2 font-medium">Última actualización: 06 de junio de 2026</p>
          </div>

          <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
            {/* Sección 1: Información de la Empresa */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3">1. Información General y de la Empresa</h3>
              <p className="mb-4">
                La presente Política de Privacidad describe el tratamiento de los datos personales recopilados a través de la aplicación móvil <strong>FinControl</strong> y sus servicios relacionados. Esta aplicación es propiedad de y está gestionada por:
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
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
                    <span className="font-bold block text-slate-700">Contacto de Soporte:</span>
                    finaredtechnology@gmail.com
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-700">Teléfono / WhatsApp:</span>
                    +51 951805026
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-700">Identificador de la App:</span>
                    FinControl (Package: <code className="bg-slate-200 px-1 rounded text-[10px]">com.finatech.fincontrol</code>)
                  </div>
                </div>
              </div>
            </section>

            {/* Sección 2: Datos Recopilados */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3">2. Datos Recopilados y Propósito del Tratamiento</h3>
              <p className="mb-4">
                Para el correcto funcionamiento operativo, control de asistencia y seguridad de las operaciones empresariales, la aplicación móvil <strong>FinControl</strong> recopila los siguientes datos:
              </p>
              
              <ul className="space-y-3 pl-1 mb-4">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Datos de Usuario y Autenticación:</strong> DNI, nombre completo, cargo, número de teléfono, correo electrónico e información de inicio de sesión.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Registro de Jornada Laboral:</strong> Fechas, horas e información de ubicación exacta correspondientes a las marcaciones de inicio de jornada, salida e inicio/fin de descansos.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Ubicación GPS en Primer y Segundo Plano:</strong> Durante la jornada laboral activa del trabajador, la aplicación recopila coordenadas GPS periódicas en segundo plano para el rastreo en tiempo real del personal operativo en campo. Este seguimiento se detiene inmediatamente al marcar la salida o al finalizar la jornada.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Evidencias Fotográficas:</strong> Captura de imágenes a través de la cámara del dispositivo para justificar incidencias (ej. tardanzas, averías) y reportar el cumplimiento de actividades de campo en tiempo real.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="text-sky-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Tokens de Notificación FCM:</strong> Identificador único del dispositivo generado por Firebase para enviar alertas operativas críticas al trabajador.
                  </div>
                </li>
              </ul>
            </section>

            {/* Sección 3: Almacenamiento y Destino de los Datos */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3">3. Almacenamiento, Seguridad y Transferencia de Datos</h3>
              <p className="mb-3">
                <strong>Almacenamiento Local y Servidor Propio:</strong> Todos los datos capturados por el aplicativo móvil (incluyendo coordenadas de ubicación, evidencias fotográficas, incidencias y estados de jornada) se transmiten de manera encriptada y se almacenan directamente en un <strong>servidor de base de datos y backend propio</strong> administrado por <strong>Finatech S.A.C.</strong>
              </p>
              <p className="mb-3">
                <strong>Uso de Firebase:</strong> El sistema utiliza Firebase exclusivamente para el servicio de notificaciones push de **Firebase Cloud Messaging (FCM)**. <strong>NO</strong> se hace uso de Firebase Storage para guardar fotos, ni de Firebase Analytics o Crashlytics para rastreo de actividad del usuario o depuración en producción.
              </p>
              <p>
                <strong>Google Maps:</strong> Los mapas y servicios de geolocalización de Google Maps se utilizan únicamente en el **panel administrativo web** para que el personal autorizado visualice los recorridos y geocercas. La aplicación móvil no integra ningún SDK visual de Google Maps.
              </p>
            </section>

            {/* Sección 4: Derechos del Usuario y Eliminación de Cuenta */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3">4. Derechos Arco (Acceso, Rectificación, Cancelación y Oposición)</h3>
              <p className="mb-4">
                Como titular de los datos personales, tienes derecho a acceder a tu información, solicitar su rectificación, o requerir la desactivación o eliminación permanente de tu cuenta y registros del sistema.
              </p>
              <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-start gap-3">
                <Shield className="text-sky-600 w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-sky-800 font-bold mb-1">¿Cómo solicitar la eliminación de tus datos?</p>
                  <p className="text-xs text-sky-700">
                    Dado que la aplicación móvil no dispone de un botón de borrado automático por motivos de control y trazabilidad laboral interna, debes tramitar tu solicitud de desactivación o eliminación de cuenta a través del procedimiento oficial detallado en nuestra sección de:
                  </p>
                  <Link to="/eliminacion-datos" className="inline-block text-xs font-bold text-sky-600 hover:text-sky-700 underline mt-2">
                    Procedimiento de Eliminación de Datos →
                  </Link>
                </div>
              </div>
            </section>

            {/* Sección 5: Modificaciones */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3">5. Cambios en esta Política de Privacidad</h3>
              <p>
                Nos reservamos el derecho a realizar cambios o actualizaciones en esta política de privacidad según requerimientos legislativos o cambios técnicos de la aplicación. Cualquier modificación entrará en vigor inmediatamente tras su publicación en esta ruta.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer Simple */}
      <footer className="bg-white border-t border-slate-100 py-6 px-6 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; 2026 Finatech S.A.C. Todos los derechos reservados. RUC 20614686813.</span>
          <div className="flex gap-4">
            <Link to="/politica-privacidad" className="hover:text-slate-600">Política de Privacidad</Link>
            <Link to="/eliminacion-datos" className="hover:text-slate-600">Eliminación de Datos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PoliticaPrivacidad;
