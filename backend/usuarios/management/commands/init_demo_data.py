from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from usuarios.models import Estudiante, Creador, Administrador
from cursos.models import Curso, Modulo, Recurso, Examen, Pregunta, TutorPerfil
from django.utils import timezone
from datetime import timedelta

Usuario = get_user_model()

class Command(BaseCommand):
    help = 'Inicializa los datos de demostración para EstudiaPro'

    def handle(self, *args, **kwargs):
        self.stdout.write('Iniciando carga de datos de demostración...')
        
        # 1. Crear Usuarios Demo
        users_data = [
            {
                'username': 'estudiante.demo', 'email': 'demo@estudiapro.com', 'password': 'demo123',
                'first_name': 'Daniela', 'last_name': 'Yáñez', 'rol': 'ESTUDIANTE', 'nivel': 3, 'puntos': 820
            },
            {
                'username': 'estudiante2', 'email': 'luis@estudiapro.com', 'password': 'demo123',
                'first_name': 'Luis', 'last_name': 'Hernández', 'rol': 'ESTUDIANTE', 'nivel': 1, 'puntos': 0
            },
            {
                'username': 'creador.demo', 'email': 'creador@estudiapro.com', 'password': 'demo123',
                'first_name': 'Ana', 'last_name': 'García', 'rol': 'CREADOR', 'nivel': 5, 'puntos': 1500,
                'especialidad': 'Cálculo Avanzado', 'tarifa30': 150, 'tarifa60': 280
            },
            {
                'username': 'alejandra', 'email': 'alejandra@estudiapro.com', 'password': 'demo123',
                'first_name': 'Alejandra', 'last_name': 'Ruiz', 'rol': 'CREADOR', 'nivel': 8, 'puntos': 3400,
                'especialidad': 'Calculo, Álgebra', 'tarifa30': 180, 'tarifa60': 320, 
                'bio': 'Coach académica con 6 años ayudando a pasar extraordinarios.', 'active': True
            },
            {
                'username': 'ian', 'email': 'ian@estudiapro.com', 'password': 'demo123',
                'first_name': 'Ian', 'last_name': 'Salazar', 'rol': 'CREADOR', 'nivel': 6, 'puntos': 2100,
                'especialidad': 'Probabilidad, Estadística', 'tarifa30': 160, 'tarifa60': 290,
                'bio': 'Te ayudo a traducir problemas de datos a pasos simples.', 'active': True
            },
             {
                'username': 'rosa', 'email': 'rosa@estudiapro.com', 'password': 'demo123',
                'first_name': 'Rosa', 'last_name': 'Vera', 'rol': 'CREADOR', 'nivel': 7, 'puntos': 2800,
                'especialidad': 'Ecuaciones Diferenciales', 'tarifa30': 200, 'tarifa60': 340,
                'bio': 'Explico con gráficas interactivas y ejemplos reales.', 'active': True
            },
            {
                'username': 'admin.demo', 'email': 'admin@estudiapro.com', 'password': 'demo123',
                'first_name': 'Administrador', 'last_name': 'General', 'rol': 'ADMINISTRADOR', 'nivel': 10, 'puntos': 9999
            }
        ]

        for u_data in users_data:
            user, created = Usuario.objects.get_or_create(
                username=u_data['username'],
                defaults={
                    'email': u_data['email'],
                    'first_name': u_data['first_name'],
                    'last_name': u_data['last_name'],
                    'rol': u_data['rol'],
                    'nivel': u_data.get('nivel', 1),
                    'puntos_gamificacion': u_data.get('puntos', 0),
                    'is_staff': u_data['rol'] == 'ADMINISTRADOR',
                    'is_superuser': u_data['rol'] == 'ADMINISTRADOR'
                }
            )
            if created:
                user.set_password(u_data['password'])
                user.save()
                self.stdout.write(f'Usuario creado: {user.username}')

                # Crear Perfiles
                if user.rol == 'ESTUDIANTE':
                    Estudiante.objects.create(id_usuario=user, nivel_escolar='Universidad')
                elif user.rol == 'CREADOR':
                    creador = Creador.objects.create(
                        id_usuario=user,
                        especialidad=u_data.get('especialidad', 'General'),
                        tarifa_30_min=u_data.get('tarifa30', 0),
                        tarifa_60_min=u_data.get('tarifa60', 0),
                        biografia=u_data.get('bio', ''),
                        activo=True
                    )
                    # Crear Perfil de Tutor si aplica
                    if u_data.get('active'):
                         TutorPerfil.objects.create(
                            creador=creador,
                            materias=u_data.get('especialidad', ''),
                            bio=u_data.get('bio', ''),
                            tarifa_30_min=u_data.get('tarifa30'),
                            tarifa_60_min=u_data.get('tarifa60'),
                            activo=True
                         )
                elif user.rol == 'ADMINISTRADOR':
                    Administrador.objects.create(id_usuario=user, permiso='ALL')
            else:
                 self.stdout.write(f'Usuario ya existe: {user.username}')

        # 2. Crear Cursos y Contenido
        # Necesitamos un creador para asignar los cursos
        creador_ana = Usuario.objects.get(username='creador.demo').perfil_creador
        creador_ale = Usuario.objects.get(username='alejandra').perfil_creador

        cursos_data = [
            {
                'titulo': 'Cálculo Diferencial', 'descripcion': 'Domina límites, derivadas y aplicaciones.',
                'categoria': 'MATEMATICAS', 'nivel': 'INTERMEDIO', 'creador': creador_ana
            },
            {
                'titulo': 'Álgebra Lineal Avanzada', 'descripcion': 'Matrices, espacios vectoriales y más.',
                'categoria': 'MATEMATICAS', 'nivel': 'AVANZADO', 'creador': creador_ale
            },
             {
                'titulo': 'Probabilidad y Estadística', 'descripcion': 'Distribuciones e inferencia.',
                'categoria': 'MATEMATICAS', 'nivel': 'BASICO', 'creador': creador_ana
            }
        ]

        for c_data in cursos_data:
            curso, created = Curso.objects.get_or_create(
                titulo=c_data['titulo'],
                defaults={
                    'descripcion': c_data['descripcion'],
                    'categoria': c_data['categoria'],
                    'nivel': c_data['nivel'],
                    'creador': c_data['creador'],
                    'precio': 0,
                    'es_gratuito': True
                }
            )
            if created:
                self.stdout.write(f'Curso creado: {curso.titulo}')
                
                # Crear Módulos y Recursos Dummy
                modulo = Modulo.objects.create(curso=curso, titulo='Conceptos Básicos', orden=1)
                Recurso.objects.create(modulo=modulo, titulo='Introducción', tipo='VIDEO', orden=1)
                Recurso.objects.create(modulo=modulo, titulo='Guía de estudio', tipo='PDF', orden=2)
                
                # Crear Examen Dummy
                Examen.objects.create(
                    curso=curso, titulo=f'Examen Parcial - {curso.titulo}',
                    tipo='EVALUACION', duracion_minutos=60, numero_preguntas=10,
                    puntaje_minimo_aprobacion=70
                )

        self.stdout.write(self.style.SUCCESS('Datos de demostración cargados exitosamente'))
