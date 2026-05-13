import os
import django
import sys
from datetime import datetime, time
from django.utils import timezone
from zoneinfo import ZoneInfo

# Setup Django
sys.path.append(os.path.abspath('../FinControl-Back'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fincontrol_backend.settings')
django.setup()

from api.models import Usuario, Asistencia, Incidencia, JornadaConfiguracion, Sede, Rol

def run_test():
    # 1. Preparar datos de prueba
    user = Usuario.objects.filter(rol__nombre__icontains='operador').first()
    if not user:
        print("No se encontró un usuario operador para la prueba.")
        return

    sede = user.sede
    today = timezone.now().date()
    
    # Limpiar asistencia de hoy si existe
    Asistencia.objects.filter(usuario=user, fecha=today).delete()
    Incidencia.objects.filter(usuario=user, fecha_hora_reporte__date=today).delete()

    print(f"Probando con usuario: {user.nombre_completo} en sede: {sede.nombre}")

    # 2. Configurar jornada para hoy (asegurar que somos tarde)
    dias_map = {0: 'lunes', 1: 'martes', 2: 'miercoles', 3: 'jueves', 4: 'viernes', 5: 'sabado', 6: 'domingo'}
    day_name = dias_map[timezone.now().weekday()]
    
    # Configurar para que el rango de entrada ya haya pasado
    config, _ = JornadaConfiguracion.objects.get_or_create(
        sede=sede, 
        dia_semana=day_name,
        defaults={
            'hora_inicio_marcacion': time(5, 0),
            'hora_fin_marcacion': time(6, 0),
            'activo': True
        }
    )
    config.hora_inicio_marcacion = time(5, 0)
    config.hora_fin_marcacion = time(6, 0) # Rango de 5am a 6am (ya pasó)
    config.save()

    print(f"Jornada configurada: Fin entrada a las {config.hora_fin_marcacion}")

    # 3. Escenario A: Marcar entrada SIN incidencia aprobada
    print("\n--- Escenario A: Marcación tardía sin justificación ---")
    # Simulamos el POST a AttendanceEventView
    current_time = timezone.now().astimezone(ZoneInfo('America/Lima')).time()
    estado = 'puntual' if current_time <= config.hora_fin_marcacion else 'tardanza'
    
    asistencia = Asistencia.objects.create(
        usuario=user,
        fecha=today,
        hora_entrada=timezone.now(),
        estado=estado
    )
    print(f"Resultado: Asistencia creada con estado = '{asistencia.estado}'")

    # 4. Escenario B: Marcar entrada CON incidencia aprobada
    print("\n--- Escenario B: Marcación tardía con incidencia aprobada ---")
    Asistencia.objects.filter(usuario=user, fecha=today).delete() # Reset
    
    # Crear incidencia aprobada
    Incidencia.objects.create(
        usuario=user,
        fecha_hora_reporte=timezone.now(),
        descripcion="Tráfico intenso verificado",
        estado_revision='Aprobado'
    )
    
    # Simular lógica de la View actualizada
    incidencia_aprobada = Incidencia.objects.filter(
        usuario=user, 
        fecha_hora_reporte__date=today,
        estado_revision='Aprobado'
    ).exists()
    
    nuevo_estado = estado
    if incidencia_aprobada:
        nuevo_estado = 'justificado'
        
    asistencia = Asistencia.objects.create(
        usuario=user,
        fecha=today,
        hora_entrada=timezone.now(),
        estado=nuevo_estado
    )
    print(f"Resultado: Asistencia creada con estado = '{asistencia.estado}'")

if __name__ == "__main__":
    run_test()
