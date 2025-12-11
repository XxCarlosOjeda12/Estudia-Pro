## Estudia Pro - Backend API
Backend del proyecto Estudia Pro, una plataforma educativa desarrollada con Django REST Framework que permite a estudiantes acceder a cursos, realizar exámenes, participar en foros y más.

 ## Tabla de Contenidos

Características
Tecnologías
Instalación
Configuración
Estructura del Proyecto
API Endpoints
Modelos
Uso
Contribuir


## Características
Autenticación y Usuarios
Sistema de registro y login con tokens 3 tipos de usuarios: Estudiante, Creador y Administrador
Perfiles personalizados por tipo de usuario
Validación de correos únicos y contraseñas

## Sistema de Cursos

Cursos con módulos y recursos (videos, PDFs, lecturas)
Inscripción de estudiantes a cursos
Seguimiento de progreso por curso
Sistema de calificaciones por módulo

## Evaluaciones

Banco de preguntas por módulo
Exámenes con cronómetro
Simuladores de examen configurables
Historial de intentos y calificaciones
Corrección automática

## Gamificación

Sistema de puntos y niveles
Logros desbloqueables
Tracking de actividades
Progreso detallado por estudiante

## Comunidad

Foro de ayuda y discusión
Sistema de preguntas y respuestas
Votación de respuestas
Recursos compartidos por la comunidad
Calificación y descarga de recursos

## Formularios

Encuestas y formularios de feedback
Múltiples tipos de preguntas
Respuestas anónimas opcionales
Estadísticas y resultados


## Tecnologías

Python: 3.8+
Django: 6.0
Django REST Framework: 3.14.0
django-cors-headers: 4.3.1
Base de datos: SQLite (desarrollo) / PostgreSQL (producción)


## Instalación
1. Clonar el repositorio
bashgit clone <url-del-repositorio>
cd Estudia-Pro/backend
2. Crear entorno virtual
bash# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
3. Instalar dependencias
bashpip install -r requirements.txt
4. Configurar variables de entorno (opcional)
Crea un archivo .env en la raíz:
envSECRET_KEY=tu-secret-key-aqui
DEBUG=True
5. Ejecutar migraciones
bashpython manage.py makemigrations
python manage.py migrate
6. Crear superusuario
bashpython manage.py createsuperuser
7. Poblar base de datos (opcional)
bashpython manage.py poblar_calculo
Este comando crea:

Curso de "Cálculo Diferencial"
4 módulos (Límites, Derivadas, Integrales, Aplicaciones)
Recursos de aprendizaje
Preguntas de prueba
Exámenes

8. Ejecutar servidor
bashpython manage.py runserver
El servidor estará disponible en: http://127.0.0.1:8000/

⚙️ Configuración
CORS (para frontend)
En backend/settings.py:
pythonCORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React
    "http://localhost:5173",  # Vite
]
Admin de Django
Accede al panel administrativo en: http://127.0.0.1:8000/admin/

## Estructura del Proyecto
backend/
├── backend/                 # Configuración del proyecto
│   ├── settings.py         # Configuraciones
│   ├── urls.py             # URLs principales
│   └── wsgi.py
├── usuarios/               # App de autenticación
│   ├── models.py           # Usuario, Estudiante, Creador, Administrador
│   ├── serializers.py      # Serializers de usuarios
│   ├── views.py            # Login, registro, perfil
│   └── urls.py
├── cursos/                 # App de cursos
│   ├── models.py           # Curso, Módulo, Recurso, Examen, etc.
│   ├── serializers.py      # Serializers de cursos
│   ├── views.py            # Endpoints de cursos
│   ├── urls.py
│   └── management/
│       └── commands/
│           └── poblar_calculo.py
├── manage.py
├── requirements.txt
├── .gitignore
└── README.md

🌐 API Endpoints
Autenticación
MétodoEndpointDescripciónAuthPOST/api/auth/register/Registrar usuarioNoPOST/api/auth/login/Iniciar sesiónNoPOST/api/auth/logout/Cerrar sesiónSíGET/api/auth/profile/Ver perfilSíGET/api/auth/verificar-rol/Verificar rol del usuarioSí
Dashboard
MétodoEndpointDescripciónAuthGET/api/mi-panel/Dashboard completo del estudianteSíGET/api/mis-cursos/Mis cursos inscritosSí
Cursos
MétodoEndpointDescripciónAuthGET/api/cursos/Listar todos los cursosSíGET/api/cursos/{id}/Detalle de un cursoSíGET/api/cursos/{id}/modulos/Módulos de un cursoSíPOST/api/cursos/{id}/inscribirse/Inscribirse a un cursoSíGET/api/cursos/{id}/mi_progreso/Ver mi progreso en el cursoSíGET/api/buscar-cursos/Buscar y filtrar cursosSí
Parámetros de búsqueda:

?q=texto - Búsqueda por texto
?categoria=MATEMATICAS - Filtrar por categoría
?nivel=BASICO - Filtrar por nivel
?gratuito=true - Solo cursos gratuitos

Recursos
MétodoEndpointDescripciónAuthGET/api/recursos/Listar recursosSíGET/api/recursos/{id}/Detalle de un recursoSíPOST/api/recursos/{id}/marcar_completado/Marcar recurso como completadoSí
Preguntas
MétodoEndpointDescripciónAuthGET/api/preguntas/Listar preguntasSíGET/api/preguntas/por_modulo/?modulo_id=1Preguntas por móduloSíGET/api/preguntas/por_dificultad/?dificultad=FACILFiltrar por dificultadSí
Exámenes
MétodoEndpointDescripciónAuthGET/api/examenes/Listar exámenesSíGET/api/examenes/{id}/Detalle de un examenSíPOST/api/examenes/{id}/iniciar/Iniciar examenSíPOST/api/examenes/{id}/enviar_respuestas/Enviar respuestas y calificarSí
Progreso y Logros
MétodoEndpointDescripciónAuthGET/api/mi-progreso/Progreso detalladoSíGET/api/mis-logros/Mis logros y badgesSí
Foro
MétodoEndpointDescripciónAuthGET/api/foro/Listar temas del foroSíPOST/api/foro/Crear nuevo temaSíGET/api/foro/{id}/Ver tema con respuestasSíPOST/api/foro/{id}/responder/Responder a un temaSíPOST/api/foro/{id}/marcar_resuelto/Marcar como resueltoSíGET/api/foro/mis_temas/Mis temas creadosSíGET/api/foro/por_curso/?curso_id=1Temas por cursoSíPOST/api/foro/respuesta/{id}/votar/Votar respuestaSí
Recursos de Comunidad
MétodoEndpointDescripciónAuthGET/api/recursos-comunidad/Listar recursos compartidosSíPOST/api/recursos-comunidad/Subir recursoSíGET/api/recursos-comunidad/{id}/Detalle del recursoSíPOST/api/recursos-comunidad/{id}/descargar/Descargar recursoSíPOST/api/recursos-comunidad/{id}/calificar/Calificar recursoSíGET/api/recursos-comunidad/mis_recursos/Mis recursos subidosSíGET/api/recursos-comunidad/buscar/Buscar recursosSí
Formularios
MétodoEndpointDescripciónAuthGET/api/formularios/Listar formulariosSíPOST/api/formularios/Crear formularioSíGET/api/formularios/{id}/Ver formularioSíPOST/api/formularios/{id}/responder/Responder formularioSíGET/api/formularios/{id}/resultados/Ver resultados (creador)SíGET/api/formularios/disponibles/Formularios disponiblesSíGET/api/formularios/mis_formularios/Mis formularios creadosSí

## Modelos
App: usuarios
Usuario (extends AbstractUser)

Campos adicionales: rol, puntos_gamificacion, nivel, foto_perfil_url, estado

Estudiante

Perfil específico para estudiantes
Campos: nivel_escolar, id_institucion

Creador

Perfil específico para creadores de contenido
Campos: especialidad, calificacion_promedio, ranking_promedio

Administrador

Perfil específico para administradores
Campos: permiso

App: cursos
Curso

Información del curso: titulo, descripcion, categoria, nivel, precio, creador

Módulo

Secciones dentro de un curso
Campos: titulo, orden, descripcion

Recurso

Contenido de aprendizaje: videos, PDFs, lecturas
Campos: tipo, contenido_url, duracion_minutos

Pregunta

Banco de preguntas para exámenes
Campos: texto_pregunta, opciones (A-D), respuesta_correcta, dificultad

Examen

Exámenes y simuladores
Campos: tipo, duracion_minutos, numero_preguntas

Inscripcion

Relación estudiante-curso
Campos: progreso_porcentaje, completado

ProgresoRecurso

Tracking de recursos completados

IntentoExamen

Intentos de examen de estudiantes
Campos: puntaje_obtenido, tiempo_usado, aprobado

Logro

Achievements/badges disponibles
Campos: nombre, tipo, puntos_recompensa

LogroEstudiante

Logros desbloqueados por estudiante
Campos: progreso_actual, desbloqueado

TemaForo

Temas del foro
Campos: titulo, contenido, categoria, resuelto

RespuestaForo

Respuestas en el foro
Campos: contenido, es_solucion, votos

RecursoComunidad

Recursos compartidos por usuarios
Campos: titulo, tipo, archivo_url, calificacion_promedio

Formulario

Encuestas y formularios
Campos: titulo, tipo, anonimo, fecha_cierre


## Uso
Ejemplo: Registrar un estudiante
bashPOST http://127.0.0.1:8000/api/auth/register/
Content-Type: application/json

{
    "username": "estudiante1",
    "email": "estudiante@example.com",
    "password": "password123",
    "password_confirm": "password123",
    "first_name": "Juan",
    "last_name": "Pérez",
    "rol": "ESTUDIANTE",
    "nivel_escolar": "Universidad",
    "id_institucion": 1
}
Ejemplo: Login
bashPOST http://127.0.0.1:8000/api/auth/login/
Content-Type: application/json

{
    "username": "estudiante1",
    "password": "password123"
}
Respuesta:
json{
    "token": "a1b2c3d4e5f6...",
    "usuario": {
        "id": 1,
        "username": "estudiante1",
        "email": "estudiante@example.com",
        "rol": "ESTUDIANTE",
        ...
    }
}
Ejemplo: Usar el token en peticiones
bashGET http://127.0.0.1:8000/api/mi-panel/
Authorization: Token a1b2c3d4e5f6...
Ejemplo: Inscribirse a un curso
bashPOST http://127.0.0.1:8000/api/cursos/1/inscribirse/
Authorization: Token a1b2c3d4e5f6...
Ejemplo: Iniciar examen
bashPOST http://127.0.0.1:8000/api/examenes/1/iniciar/
Authorization: Token a1b2c3d4e5f6...
Respuesta:
json{
    "intento_id": 1,
    "duracion_minutos": 60,
    "preguntas": [
        {
            "id": 1,
            "texto_pregunta": "¿Qué es un límite?",
            "opcion_a": "...",
            "opcion_b": "...",
            ...
        }
    ]
}

## Autenticación
Este proyecto usa Token Authentication de Django REST Framework.

El usuario hace login y recibe un token
El token se incluye en el header de las peticiones:

   Authorization: Token <tu-token>

El token es válido hasta que el usuario hace logout


## Tipos de Usuario
Estudiante

Puede inscribirse a cursos
Ver contenido y recursos
Realizar exámenes
Participar en foros
Descargar recursos de comunidad

Creador

Todo lo de Estudiante +
Crear cursos
Crear formularios
Subir recursos

Administrador

Acceso completo
Gestión de usuarios
Aprobación de contenido
Ver estadísticas globales


## Gamificación
Sistema de Puntos

Iniciar sesión: 5 puntos
Completar recurso: 10 puntos
Aprobar examen: 50-100 puntos
Participar en foro: 15 puntos

Niveles

Nivel 1: 0-100 puntos
Nivel 2: 101-300 puntos
Nivel 3: 301-600 puntos
Nivel 4: 601-1000 puntos
Nivel 5: 1001+ puntos

Logros

 "Bienvenido" - Registrarse
 "Primera semana" - 7 días desde registro
 "Usuario activo" - 10 inicios de sesión
 "Experto" - Completar un curso
 "Perfeccionista" - 100% en un examen


## Troubleshooting
Error: "No module named 'django'"
bash# Asegúrate de que el entorno virtual esté activado
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Instala las dependencias
pip install -r requirements.txt
Error: "no such table: usuario"
bash# Ejecuta las migraciones
python manage.py makemigrations
python manage.py migrate
Error: CORS
bash# Verifica que django-cors-headers esté instalado
pip install django-cors-headers

# Verifica settings.py:
# - 'corsheaders' en INSTALLED_APPS
# - 'corsheaders.middleware.CorsMiddleware' en MIDDLEWARE
# - CORS_ALLOW_ALL_ORIGINS = True (desarrollo)