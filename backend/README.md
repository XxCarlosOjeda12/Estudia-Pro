# Backend - Estudia Pro

API REST desarrollada con Django y Django REST Framework para la plataforma educativa Estudia Pro.

## Configuración Inicial

### 1. Crear entorno virtual e instalar dependencias

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` y configura:
- `DJANGO_SECRET_KEY`: Genera una clave secreta única
- `DJANGO_DEBUG`: Usa `True` para desarrollo local

**IMPORTANTE**: El archivo `.env` está en `.gitignore` y no se debe subir a git.

### 3. Aplicar migraciones

```bash
python manage.py migrate
```

### 4. Crear superusuario (opcional)

```bash
python manage.py createsuperuser
```

### 5. Iniciar servidor de desarrollo

```bash
python manage.py runserver 8000
```

El servidor estará disponible en: `http://localhost:8000/`

## Estructura del Proyecto

```
backend/
├── estudiapro/          # Configuración del proyecto Django
│   ├── settings.py      # Configuraciones (usa variables de entorno)
│   ├── urls.py          # URLs principales
│   ├── wsgi.py          # WSGI
│   └── asgi.py          # ASGI
├── usuarios/            # App de autenticación y usuarios
│   ├── models.py        # Modelos de Usuario, Estudiante, Creador, Admin
│   ├── serializers.py   # Serializers para la API
│   ├── views.py         # Vistas de la API
│   └── urls.py          # URLs de autenticación
├── manage.py
├── requirements.txt
├── .env.example
└── .gitignore
```

## API Endpoints

### Autenticación (`/api/auth/`)

- `POST /api/auth/register/` - Registrar nuevo usuario
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/logout/` - Cerrar sesión
- `GET /api/auth/profile/` - Obtener perfil del usuario autenticado
- `GET /api/auth/verificar-rol/` - Verificar rol del usuario

### Admin

- `GET /admin/` - Panel de administración de Django

## Roles de Usuario

1. **ESTUDIANTE** - Acceso a cursos, exámenes y recursos
2. **CREADOR** - Puede crear contenido educativo
3. **ADMINISTRADOR** - Gestión completa del sistema

## Base de Datos

Actualmente se usa **SQLite** para desarrollo local. No requiere configuración adicional.

## Variables de Entorno

Ver `.env.example` para todas las variables configurables.

Variables principales:
- `DJANGO_SECRET_KEY` - Clave secreta de Django
- `DJANGO_DEBUG` - Modo debug (True/False)
- `DJANGO_ALLOWED_HOSTS` - Hosts permitidos
- `DB_ENGINE` - Motor de base de datos
- `DB_NAME` - Nombre de la base de datos
- `CORS_ALLOWED_ORIGINS` - Orígenes permitidos para CORS


