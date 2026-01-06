# Estudia Pro - Backend API

Backend del proyecto Estudia Pro, una plataforma educativa desarrollada con Django REST Framework.

---

## Tabla de Contenidos

1. [Tecnologias](#tecnologias)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Instalacion](#instalacion)
4. [Configuracion](#configuracion)
5. [Modelos de Datos](#modelos-de-datos)
6. [API Endpoints](#api-endpoints)
7. [Autenticacion](#autenticacion)
8. [Integracion con Frontend](#integracion-con-frontend)

---

## Tecnologias

| Tecnologia | Version | Descripcion |
|------------|---------|-------------|
| Python | 3.8+ | Lenguaje de programacion |
| Django | 4.2+ | Framework web |
| Django REST Framework | 3.14.0 | API REST |
| django-cors-headers | 4.3.0 | Manejo de CORS |
| SQLite | - | Base de datos (desarrollo) |
| PostgreSQL | - | Base de datos (produccion) |

---

## Estructura del Proyecto

```
backend/
├── manage.py                    # CLI de Django
├── requirements.txt             # Dependencias Python
├── estudia_pro_db.sql           # Dump de base de datos
├── Estudia_Pro_API.postman_collection.json  # Coleccion Postman
│
├── estudiapro/                  # Configuracion principal
│   ├── settings.py              # Configuracion Django
│   ├── urls.py                  # URLs raiz
│   ├── wsgi.py                  # WSGI application
│   └── asgi.py                  # ASGI application
│
├── usuarios/                    # App de autenticacion y usuarios
│   ├── models.py                # Usuario, Estudiante, Creador, Administrador
│   ├── views.py                 # Vistas de auth (register, login, logout)
│   ├── serializers.py           # Serializadores de usuario
│   ├── urls.py                  # Rutas /api/auth/
│   ├── admin.py                 # Configuracion admin
│   ├── admin_views.py           # Vistas de administracion
│   └── admin_urls.py            # Rutas admin personalizadas
│
└── cursos/                      # App principal de contenido
    ├── models.py                # Todos los modelos de cursos, examenes, foro, etc.
    ├── views.py                 # ViewSets y vistas
    ├── serializers.py           # Serializadores
    ├── urls.py                  # Rutas /api/
    ├── admin.py                 # Configuracion admin
    └── management/commands/     # Comandos personalizados
        ├── poblar_calculo.py    # Poblar datos de calculo
        └── poblar_comunidad.py  # Poblar datos de comunidad
```

---

## Instalacion

### 1. Clonar y acceder al directorio

```bash
git clone <url-del-repositorio>
cd Estudia-Pro/backend
```

### 2. Crear entorno virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Ejecutar migraciones

```bash
python manage.py migrate
```

### 5. Crear superusuario (opcional)

```bash
python manage.py createsuperuser
```

### 6. Poblar datos de prueba (opcional)

```bash
python manage.py poblar_calculo
python manage.py poblar_comunidad
```

### 7. Iniciar servidor

```bash
python manage.py runserver
```

El servidor estara disponible en `http://127.0.0.1:8000`

---

## Configuracion

### Variables de Entorno

Crear archivo `.env` en la raiz del backend:

```env
# Django
DJANGO_SECRET_KEY=tu-secret-key-segura
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Base de datos (SQLite por defecto)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# PostgreSQL (produccion)
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=estudiapro_db
# DB_USER=postgres
# DB_PASSWORD=tu_password
# DB_HOST=localhost
# DB_PORT=5432
```

### Configuracion CORS

El backend permite peticiones desde cualquier origen en desarrollo. Para produccion, configurar en `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://tu-dominio-frontend.com",
]
```

---

## Modelos de Datos

### App: usuarios

#### Usuario (AbstractUser)
Modelo base de usuario con campos extendidos.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| username | CharField | Nombre de usuario unico |
| email | EmailField | Correo electronico unico |
| rol | CharField | ESTUDIANTE, CREADOR, ADMINISTRADOR |
| estado | CharField | ACTIVO, INACTIVO, SUSPENDIDO |
| nivel | IntegerField | Nivel de gamificacion (1-100) |
| puntos_gamificacion | IntegerField | Puntos acumulados |
| is_premium | BooleanField | Estado premium |
| fecha_registro | DateTimeField | Fecha de registro |
| foto_perfil | URLField | URL de foto de perfil |

#### Estudiante
Perfil extendido para estudiantes.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id_usuario | OneToOneField | Relacion con Usuario |
| carrera | CharField | Carrera del estudiante |
| semestre | IntegerField | Semestre actual |
| tiempo_estudio_minutos | IntegerField | Tiempo total de estudio |
| fecha_nacimiento | DateField | Fecha de nacimiento |

#### Creador
Perfil extendido para creadores de contenido.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id_usuario | OneToOneField | Relacion con Usuario |
| especialidad | CharField | Area de especializacion |
| biografia | TextField | Descripcion del creador |
| calificacion_promedio | DecimalField | Promedio de calificaciones |
| es_tutor | BooleanField | Si ofrece tutorias |

#### Administrador
Perfil extendido para administradores.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id_usuario | OneToOneField | Relacion con Usuario |
| area_responsabilidad | CharField | Area asignada |

---

### App: cursos

#### Curso

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| titulo | CharField | Nombre del curso |
| descripcion | TextField | Descripcion completa |
| imagen_portada | URLField | URL de imagen |
| creador | ForeignKey | Creador del curso |
| precio | DecimalField | Precio (0 si es gratuito) |
| es_gratuito | BooleanField | Indica si es gratuito |
| categoria | CharField | Categoria del curso |
| nivel | CharField | BASICO, INTERMEDIO, AVANZADO |
| activo | BooleanField | Estado del curso |

#### Modulo

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| curso | ForeignKey | Curso padre |
| titulo | CharField | Nombre del modulo |
| descripcion | TextField | Descripcion |
| orden | IntegerField | Orden de aparicion |
| icono | CharField | Icono del modulo |

#### Recurso

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| modulo | ForeignKey | Modulo padre |
| titulo | CharField | Nombre del recurso |
| tipo | CharField | VIDEO, PDF, LECTURA, EJERCICIO |
| contenido_url | URLField | URL del contenido |
| contenido_texto | TextField | Contenido textual |
| duracion_minutos | IntegerField | Duracion estimada |
| es_gratuito | BooleanField | Acceso gratuito |
| orden | IntegerField | Orden de aparicion |

#### Inscripcion

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| estudiante | ForeignKey | Estudiante inscrito |
| curso | ForeignKey | Curso inscrito |
| fecha_inscripcion | DateTimeField | Fecha de inscripcion |
| progreso_porcentaje | DecimalField | Progreso 0-100 |
| completado | BooleanField | Curso completado |
| fecha_examen | DateField | Fecha de examen programado |
| hora_examen | TimeField | Hora del examen |

#### Pregunta

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| modulo | ForeignKey | Modulo asociado |
| texto_pregunta | TextField | Enunciado |
| tipo | CharField | OPCION_MULTIPLE, VERDADERO_FALSO, etc. |
| opciones | JSONField | Opciones de respuesta |
| respuesta_correcta | CharField | Respuesta correcta |
| explicacion | TextField | Explicacion de la respuesta |
| dificultad | CharField | FACIL, MEDIO, DIFICIL |
| puntos | IntegerField | Puntos por respuesta correcta |

#### Examen

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| curso | ForeignKey | Curso asociado |
| titulo | CharField | Nombre del examen |
| descripcion | TextField | Descripcion |
| duracion_minutos | IntegerField | Tiempo limite |
| numero_preguntas | IntegerField | Cantidad de preguntas |
| puntaje_minimo_aprobacion | DecimalField | Porcentaje minimo |
| activo | BooleanField | Estado del examen |

#### IntentoExamen

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| estudiante | ForeignKey | Estudiante |
| examen | ForeignKey | Examen realizado |
| fecha_inicio | DateTimeField | Inicio del intento |
| fecha_fin | DateTimeField | Fin del intento |
| puntaje_obtenido | DecimalField | Puntaje final |
| completado | BooleanField | Si fue completado |
| aprobado | BooleanField | Si aprobo |
| tiempo_usado | IntegerField | Minutos utilizados |

#### TemaForo

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| titulo | CharField | Titulo del tema |
| contenido | TextField | Contenido del tema |
| categoria | CharField | PREGUNTA, DISCUSION, AYUDA, ANUNCIO |
| autor | ForeignKey | Usuario autor |
| curso | ForeignKey | Curso relacionado (opcional) |
| cerrado | BooleanField | Tema cerrado |
| resuelto | BooleanField | Tema resuelto |
| vistas | IntegerField | Contador de vistas |

#### RespuestaForo

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| tema | ForeignKey | Tema padre |
| autor | ForeignKey | Usuario autor |
| contenido | TextField | Contenido de respuesta |
| es_solucion | BooleanField | Marcada como solucion |
| votos | IntegerField | Contador de votos |

#### RecursoComunidad

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| titulo | CharField | Nombre del recurso |
| descripcion | TextField | Descripcion |
| tipo | CharField | DOCUMENTO, VIDEO, ENLACE, CODIGO, PRESENTACION |
| archivo_url | URLField | URL externa |
| archivo | FileField | Archivo subido |
| autor | ForeignKey | Usuario autor |
| curso | ForeignKey | Curso relacionado (opcional) |
| descargas | IntegerField | Contador de descargas |
| calificacion_promedio | DecimalField | Promedio de calificaciones |
| aprobado | BooleanField | Aprobado por admin |
| activo | BooleanField | Estado activo |

#### FormularioEstudio

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| titulo | CharField | Nombre del formulario |
| materia | CharField | Materia asociada |
| archivo | FileField | Archivo PDF |
| archivo_url | URLField | URL alternativa |
| creado_por | ForeignKey | Usuario creador |
| activo | BooleanField | Estado activo |

#### TutorPerfil

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| creador | OneToOneField | Perfil de creador |
| activo | BooleanField | Disponible para tutorias |
| materias | JSONField | Lista de materias |
| horario | JSONField | Horario disponible |
| tarifa_hora | DecimalField | Precio por hora |

#### Tutoria

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| estudiante | ForeignKey | Estudiante solicitante |
| tutor | ForeignKey | Tutor asignado |
| curso | ForeignKey | Curso relacionado |
| fecha_hora | DateTimeField | Fecha y hora programada |
| duracion_minutos | IntegerField | Duracion (30 o 60) |
| estado | CharField | PENDIENTE, CONFIRMADA, COMPLETADA, CANCELADA |
| tema | CharField | Tema especifico |

#### Notificacion

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| usuario | ForeignKey | Usuario destinatario |
| titulo | CharField | Titulo de notificacion |
| mensaje | TextField | Contenido |
| tipo | CharField | info, success, warning, alert |
| leida | BooleanField | Estado de lectura |
| fecha_creacion | DateTimeField | Fecha de creacion |

#### ProximaActividad

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| estudiante | ForeignKey | Estudiante |
| curso | ForeignKey | Curso relacionado |
| titulo | CharField | Titulo de actividad |
| tipo | CharField | EXAMEN, TAREA, TUTORIA |
| fecha | DateField | Fecha programada |
| hora | TimeField | Hora programada |
| origen | CharField | MANUAL, FECHA_EXAMEN, AUTOMATICO |

#### Logro

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| nombre | CharField | Nombre del logro |
| descripcion | TextField | Descripcion |
| icono | CharField | Icono/emoji |
| puntos_recompensa | IntegerField | Puntos otorgados |
| condicion_tipo | CharField | Tipo de condicion |
| condicion_valor | IntegerField | Valor requerido |
| activo | BooleanField | Estado activo |

---

## API Endpoints

### Autenticacion (/api/auth/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register/` | Registrar nuevo usuario | No |
| POST | `/api/auth/login/` | Iniciar sesion | No |
| POST | `/api/auth/logout/` | Cerrar sesion | Si |
| GET | `/api/auth/profile/` | Obtener perfil del usuario | Si |
| GET | `/api/auth/verificar-rol/` | Verificar rol del usuario | Si |
| POST | `/api/auth/activate-premium/` | Activar premium (simulado) | Si |
| POST | `/api/auth/track-time/` | Registrar tiempo de estudio | Si |
| GET | `/api/auth/admin/users/` | Listar usuarios (admin) | Si |
| PUT/DELETE | `/api/auth/admin/users/<id>/` | Gestionar usuario (admin) | Si |

### Cursos (/api/cursos/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/cursos/` | Listar cursos | Si |
| GET | `/api/cursos/<id>/` | Detalle de curso | Si |
| GET | `/api/cursos/<id>/modulos/` | Modulos de un curso | Si |
| POST | `/api/cursos/<id>/inscribirse/` | Inscribirse a curso | Si |
| POST | `/api/cursos/<id>/desinscribirse/` | Cancelar inscripcion | Si |
| GET | `/api/cursos/<id>/mi-progreso/` | Progreso en curso | Si |

### Recursos (/api/recursos/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/recursos/` | Listar recursos | Si |
| GET | `/api/recursos/<id>/` | Detalle de recurso | Si |
| POST | `/api/recursos/<id>/marcar_completado/` | Marcar recurso completado | Si |

### Preguntas (/api/preguntas/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/preguntas/` | Listar preguntas | Si |
| GET | `/api/preguntas/<id>/` | Detalle de pregunta | Si |
| GET | `/api/preguntas/por_modulo/?modulo_id=<id>` | Preguntas de un modulo | Si |
| GET | `/api/preguntas/por_dificultad/?dificultad=<nivel>` | Filtrar por dificultad | Si |

### Examenes (/api/examenes/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/examenes/` | Listar examenes | Si |
| GET | `/api/examenes/<id>/` | Detalle de examen | Si |
| POST | `/api/examenes/<id>/iniciar/` | Iniciar intento de examen | Si |
| POST | `/api/examenes/<id>/enviar_respuestas/` | Enviar respuestas | Si |

### Foro (/api/foro/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/foro/` | Listar temas | Si |
| POST | `/api/foro/` | Crear tema | Si |
| GET | `/api/foro/<id>/` | Detalle de tema (incrementa vistas) | Si |
| POST | `/api/foro/<id>/responder/` | Responder a tema | Si |
| POST | `/api/foro/<id>/marcar_resuelto/` | Marcar como resuelto (autor) | Si |
| GET | `/api/foro/mis_temas/` | Mis temas creados | Si |
| GET | `/api/foro/por_curso/?curso_id=<id>` | Temas de un curso | Si |
| POST | `/api/foro/votar-respuesta/<id>/` | Votar respuesta (UP/DOWN) | Si |

### Recursos Comunidad (/api/recursos-comunidad/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/recursos-comunidad/` | Listar recursos | Si |
| POST | `/api/recursos-comunidad/` | Crear recurso | Si |
| GET | `/api/recursos-comunidad/<id>/` | Detalle de recurso | Si |
| PUT | `/api/recursos-comunidad/<id>/` | Actualizar recurso | Si |
| DELETE | `/api/recursos-comunidad/<id>/` | Eliminar recurso | Si |
| POST | `/api/recursos-comunidad/<id>/descargar/` | Registrar descarga | Si |
| POST | `/api/recursos-comunidad/<id>/calificar/` | Calificar recurso | Si |
| GET | `/api/recursos-comunidad/mis_recursos/` | Mis recursos | Si |
| GET | `/api/recursos-comunidad/por_curso/?curso_id=<id>` | Recursos de curso | Si |
| GET | `/api/recursos-comunidad/buscar/?q=<texto>&tipo=<tipo>` | Buscar recursos | Si |

### Formularios de Estudio (/api/formularios-estudio/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/formularios-estudio/` | Listar formularios PDF | Si |
| POST | `/api/formularios-estudio/` | Crear formulario (admin) | Si |
| GET | `/api/formularios-estudio/<id>/` | Detalle de formulario | Si |
| PUT | `/api/formularios-estudio/<id>/` | Actualizar (admin) | Si |
| DELETE | `/api/formularios-estudio/<id>/` | Eliminar (admin) | Si |

### Formularios/Encuestas (/api/formularios/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/formularios/` | Listar formularios | Si |
| POST | `/api/formularios/` | Crear formulario (creador/admin) | Si |
| GET | `/api/formularios/<id>/` | Detalle con preguntas | Si |
| POST | `/api/formularios/<id>/responder/` | Responder formulario | Si |
| GET | `/api/formularios/<id>/resultados/` | Ver resultados (creador) | Si |
| GET | `/api/formularios/disponibles/` | Formularios para responder | Si |
| GET | `/api/formularios/mis_formularios/` | Mis formularios creados | Si |

### Proximas Actividades (/api/proximas-actividades/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/proximas-actividades/` | Listar actividades | Si |
| POST | `/api/proximas-actividades/` | Crear actividad manual | Si |
| PUT | `/api/proximas-actividades/<id>/` | Actualizar (solo manual) | Si |
| DELETE | `/api/proximas-actividades/<id>/` | Eliminar (solo manual) | Si |

### Tutores (/api/tutores/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/tutores/` | Listar tutores activos | Si |
| GET | `/api/tutores/<id>/` | Detalle de tutor | Si |
| GET/PUT | `/api/tutores/me/` | Mi perfil de tutor (creador) | Si |
| POST | `/api/tutores/agendar/` | Solicitar tutoria (estudiante) | Si |

### Notificaciones (/api/notificaciones/)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/notificaciones/` | Listar notificaciones | Si |
| POST | `/api/notificaciones/leer/` | Marcar como leida | Si |

### Dashboard y Utilidades

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/mi-panel/` | Dashboard del usuario | Si |
| GET | `/api/mis-cursos/` | Cursos inscritos | Si |
| GET | `/api/buscar-cursos/?q=<texto>` | Buscar cursos | Si |
| PUT | `/api/actualizar-fecha-examen/` | Actualizar fecha de examen | Si |
| GET | `/api/mi-progreso-detallado/` | Progreso detallado | Si |
| GET | `/api/mis-logros/` | Logros del estudiante | Si |

---

## Autenticacion

El backend utiliza autenticacion basada en Token (Django REST Framework Token Authentication).

### Registro

```http
POST /api/auth/register/
Content-Type: application/json

{
    "username": "usuario123",
    "email": "usuario@ejemplo.com",
    "password": "contraseña123",
    "first_name": "Nombre",
    "last_name": "Apellido",
    "rol": "ESTUDIANTE"
}
```

Respuesta exitosa (201):
```json
{
    "token": "abc123...",
    "usuario": {
        "id": 1,
        "username": "usuario123",
        "email": "usuario@ejemplo.com",
        "rol": "ESTUDIANTE",
        ...
    },
    "message": "Usuario creado exitosamente"
}
```

### Login

```http
POST /api/auth/login/
Content-Type: application/json

{
    "username": "usuario123",
    "password": "contraseña123"
}
```

Respuesta exitosa (200):
```json
{
    "token": "abc123...",
    "usuario": {
        "id": 1,
        "username": "usuario123",
        ...
    },
    "message": "Login exitoso"
}
```

### Uso del Token

Para endpoints protegidos, incluir el token en el header:

```http
GET /api/cursos/
Authorization: Token abc123...
```

---

## Integracion con Frontend

### URL Base

- Desarrollo: `http://127.0.0.1:8000`
- Produccion: Configurar segun servidor

### Formato de Peticiones

Todas las peticiones deben incluir:

```http
Content-Type: application/json
Authorization: Token <token>  # Para endpoints protegidos
```

### Formato de Respuestas

Las respuestas siguen el formato JSON estandar:

**Exito:**
```json
{
    "data": { ... },
    "message": "Operacion exitosa"
}
```

**Error:**
```json
{
    "error": "Descripcion del error"
}
```

### Codigos de Estado HTTP

| Codigo | Descripcion |
|--------|-------------|
| 200 | OK - Peticion exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Eliminacion exitosa |
| 400 | Bad Request - Error de validacion |
| 401 | Unauthorized - Token invalido/faltante |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

### Configuracion CORS

El backend permite peticiones desde `http://localhost:5173` (Vite dev server) por defecto.

Para agregar origenes adicionales, modificar `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://tu-dominio.com",
]
```

### Subida de Archivos

Para endpoints que aceptan archivos (recursos comunidad, formularios):

```http
POST /api/recursos-comunidad/
Content-Type: multipart/form-data
Authorization: Token <token>

{
    "titulo": "Mi recurso",
    "descripcion": "Descripcion",
    "tipo": "DOCUMENTO",
    "archivo": <file>
}
```

---

## Comandos Utiles

```bash
# Ejecutar servidor de desarrollo
python manage.py runserver

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Poblar datos de prueba
python manage.py poblar_calculo
python manage.py poblar_comunidad

# Shell de Django
python manage.py shell

# Ejecutar tests
python manage.py test
```

---

## Panel de Administracion

Acceder a `/admin/` con credenciales de superusuario para gestionar:

- Usuarios y perfiles
- Cursos, modulos y recursos
- Examenes y preguntas
- Temas del foro
- Recursos de comunidad
- Formularios
- Logros y gamificacion

---

## Notas para Integracion

1. **Roles de Usuario**: El sistema maneja tres roles (ESTUDIANTE, CREADOR, ADMINISTRADOR). Algunos endpoints estan restringidos por rol.

2. **Progreso**: El progreso se calcula automaticamente al completar recursos y examenes.

3. **Notificaciones**: Se crean automaticamente al solicitar tutorias y otras acciones.

4. **Archivos**: Los archivos subidos se almacenan en `/media/` (configurar almacenamiento en produccion).

5. **Actividades**: Las proximas actividades pueden ser MANUAL (creadas por usuario) o FECHA_EXAMEN (sincronizadas con inscripciones).

6. **Tutorias**: Al crear una tutoria, se envian notificaciones tanto al tutor como al estudiante.
