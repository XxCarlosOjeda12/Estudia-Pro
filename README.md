# Estudia-Pro

Plataforma web educativa para la práctica y evaluación de cursos de matemáticas a nivel universitario, construida con **Django (backend)** y **React (frontend)**, usando **SQLite** en desarrollo y **PostgreSQL** para producción.

---

## Estado del Desarrollo

### Funcionalidades Implementadas
- Autenticación de usuarios (registro, login, logout)
- Sistema de roles (Estudiante, Creador, Administrador)
- Panel de Administrador (funcional)
  - Gestión de usuarios
  - Gestión de materias
  - Gestión de recursos de comunidad
  - Visualización de estadísticas
- Exploración de cursos y materias
- Sistema de inscripción a cursos
- Recursos de aprendizaje (videos, PDFs, lecturas)
- Formularios y encuestas
- Foro de ayuda comunitaria
- Recursos compartidos por la comunidad
- Sistema de exámenes y preguntas

### En Desarrollo
- Panel de Estudiante (parcialmente implementado)
  - Progreso de cursos
  - Historial de exámenes
  - Sistema de logros
- Panel de Creador (pendiente de completar)
  - Creación de contenido
  - Gestión de cursos propios
  - Estadísticas de estudiantes
- Sistema de tutorías SOS
- Marketplace de recursos premium
- Sistema de gamificación completo

---

## Stack tecnológico

- **Frontend**
  - [React](https://react.dev/) 19.2.0
  - [Tailwind CSS](https://tailwindcss.com/) 3.4.17 (estilos y diseño)
  - [Vite](https://vitejs.dev/) 7.2.5 (bundler y servidor de desarrollo)
  - Fetch API (consumo de API REST)
  - KaTeX / MathLive (renderizado de ecuaciones matemáticas)
  - Chart.js (visualización de estadísticas)
- **Backend**
  - [Django](https://www.djangoproject.com/) 5.2.9
  - Django REST Framework 3.14.0 (API REST)
  - Django CORS Headers 4.3.0
  - Token Authentication
- **Base de datos**
  - SQLite (desarrollo local)
  - [PostgreSQL](https://www.postgresql.org/) (producción - recomendado)
- **Infraestructura / DevOps**
  - Git + GitHub (control de versiones)
  - Entorno virtual de Python (`venv` / `pipenv` / `poetry`)
  - Gestor de dependencias JS: `npm` o `yarn`
  - Despliegue recomendado:
    - Frontend: Vercel/Netlify o servidor web estático
    - Backend: servidor con Gunicorn + Nginx / Railway / Render / similar
    - Base de datos: instancia de PostgreSQL gestionada (Heroku PG, Railway, RDS, etc.)

---

## Arquitectura general

El proyecto está organizado como una aplicación web con **frontend y backend desacoplados**:

- **Frontend (SPA en React)**  
  Consume la API REST del backend para gestionar:
  - Autenticación de usuarios y roles (estudiante, creador de contenido, administrador).
  - Panel de estudiante (progreso, métricas, alertas).
  - Exploración de materias y temarios.
  - Banco de preguntas y simulador de exámenes.
  - Módulos de recursos (marketplace) y tutorías SOS.
  - Foro y herramientas (formularios, calculadoras, etc.).

- **Backend (API REST en Django + DRF)**  
  Expone endpoints seguros para:
  - Gestión de usuarios y roles.
  - CRUD de materias, temas y contenidos.
  - Banco de preguntas y exámenes.
  - Registro de progreso, resultados y estadísticas.
  - Gestión de recursos, tutorías y pagos (si aplica).
  - Administración (panel de administración y endpoints internos).

- **Base de datos (PostgreSQL)**
  - Almacena usuarios, materias, preguntas, exámenes, resultados, recursos, tutorías, etc.
  - Se define mediante modelos de Django y migraciones.

---

## Estructura del proyecto

```bash
Estudia-Pro/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3                    # Base de datos SQLite
│   ├── estudiapro/                   # Configuración principal de Django
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── usuarios/                     # App de usuarios y autenticación
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   └── cursos/                       # App de cursos, recursos y exámenes
│       ├── models.py
│       ├── views.py
│       ├── serializers.py
│       ├── urls.py
│       └── management/
│           └── commands/
│               ├── poblar_calculo.py
│               └── poblar_comunidad.py
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/               # Componentes reutilizables
│       ├──8+ (recomendado 3.10+)
- pip y virtualenv

**Frontend**
- Node.js 18+
- npm└── AppContext.jsx
│       └── lib/                      # Utilidades
│           ├── api.js                # Cliente API
│           └── constants.js          # Configuración
└── README.md
```

---

## Requisitos previos

**Backend**
- Python 3.10+ (recomendado)
- PostgreSQL 13+
- pip y virtualenv / pipenv / poetry

**Frontend**
- Node.js 18+
- npm o yarn

---

## Variables de entorno
Configuración

### Backend (Django)

El proyecto está configurado para usar SQLite en desarrollo por defecto. No se requiere configuración adicional de base de datos.

**CORS**: El backend ya está configurado para permitir peticiones desde `http://localhost:5173` (frontend en desarrollo).

### Frontend (React)

La configuración de la API está en `frontend/src/lib/constants.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000/api',
  // ... endpoints
}
```

No se requieren archivos `.env` para desarrollo local
---

## Instalación y ejecución en local

### 1. Clonar el repositorio

```bash
git clone https://github.com/XxCarlosOjeda12/Estudia-Pro.git
cd Estudia-Pro
```

### 2. Backend (Django)

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate      # Linux / macOS
# .\venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (opcional, para admin)
python manage.py createsuperuser
 (opcional pero recomendado)
python -m venv venv
# Windows PowerShell:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# (Opcional) Poblar base de datos con datos de prueba
python manage.py poblar_calculo      # Crea curso de Cálculo Diferencial
python manage.py poblar_comunidad    # Crea recursos y formularios

# Crear superusuario para acceso admin
python manage.py createsuperuser

# Ejecutar servidor de desarrollo
python manage.py runserver
``` (mantener el backend corriendo):

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

El frontend quedará disponible en:
**http://localhost:5173/**

### 4. Acceso a la aplicación

Puedes:Implementados

### Autenticación (`/api/auth/`)
- `POST /api/auth/register/` - Registro de usuarios
- `POST /api/auth/login/` - Inicio de sesión (retorna token)
- `POST /api/auth/logout/` - Cerrar sesión
- `Comandos de Gestión

### Poblar Base de Datos

El proyecto incluye comandos personalizados para poblar la base de datos con datos de prueba:

```bash
# Crear curso de Cálculo Diferencial con módulos, recursos y preguntas
python manage.py poblar_calculo

# Crear recursos de comunidad y formularios de ejemplo
python manage.py poblar_comunidad
```

### Acceso al Panel de Django Admin

El panel de administración de Django está disponible en:
**http://127.0.0.1:8000/admin/**

Permite gestionar directamente:
- Usuarios y perfiles
- Cursos y módulos
- Recursos y preguntas
- Formularios y respuestas
- Inscripciones y progresoGET /api/recursos/` - Listar recursos de aprendizaje

### Comunidad (`/api/recursos-comunidad/`)
- `GET /api/recursos-comunidad/` - Recursos compartidos por usuarios
- `POST /api/recursos-comunidad/` - Crear recurso comunitario
- `Tecnologías y Librerías Principales

### Backend
- Django 5.2.9
- Django REST Framework 3.14.0
- Django CORS Headers 4.3.0
- Token Authentication (rest_framework.authtoken)

### Frontend
- React 19.2.0
- Tailwind CSS 3.4.17
- Vite 7.2.5
- KaTeX 0.16.27 (renderizado de LaTeX)
- MathLive 0.108.2 (editor matemático)
- Chart.js 4.5.1 (gráficos y estadísticas)
1. Cambiar a PostgreSQL en `settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'estudiapro_db',
           'USER': 'postgres',
           'PASSWORD': 'password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

2. Instalar dependencia PostgreSQL:
   ```bash
   pip install psycopg2-binary
   ```

3. Configurar variables de entorno:
   ```bash
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=tu-dominio.com
   DJANGO_SECRET_KEY=clave-secreta-segura
   ```

4. Aplicar migraciones:
   ```bash
   python manage.py migrate
   ```

5. Recopilar archivos estáticos:
   ```bash
   python manage.py collectstatic
   ```

6. Ejecutar con Gunicorn:
   ```bash
   gunicorn estudiapro.wsgi:application --bind 0.0.0.0:8000
   ```

### Frontend (React)

1. Actualizar la URL del API en `src/lib/constants.js`:
   ```javascript
   BASE_URL: 'https://tu-backend.com/api'
   ```

2. Generar build de producción:
   ```bash
   npm run build
   ```

3. Servir archivos estáticos del directorio `dist/` en:
   - Vercel
   - Netlify
   - Nginx/Apache
   - Servidor estático
- Formateo con `black` / `isort`
- Lint con `flake8` o `ruff`

**JavaScript/TypeScript**
- `eslint`
- `prettier`

Ejemplos:

```bash
# Backend
black .
flake8 .

# Frontend
npm run lint
npm run format
```

Se recomienda configurar hooks de pre-commit para asegurar el estilo antes de cada commit.

---

## Despliegue (resumen)

### Backend (Django + PostgreSQL)
1. Configurar variables de entorno con `DJANGO_DEBUG=False` y `DJANGO_ALLOWED_HOSTS` apropiados.
2. Aplicar migraciones en el entorno de producción:
   ```bash
   python manage.py migrate
   ```
3. Recopilar archivos estáticos:
   ```bash
   python manage.py collectstatic
   ```
4. Ejecutar servidor de aplicación (ej. Gunicorn) detrás de Nginx o usar un PaaS (Railway, Render, etc.).

### Frontend (React)
1. Configurar `VITE_API_BASE_URL` (o equivalente) apuntando al backend en producción.
2. Generar build de producción:
   ```bash
   npm run build
   ```
3. Servir los archivos estáticos generados (`dist/`) en:
   - Vercel / Netlify, o
   - como static files detrás de Nginx u otro servidor web.

### Base de datos (PostgreSQL)
- Crear la base de datos y el usuario con los permisos adecuados.
- Configurar backups automáticos.
- Restringir el acceso por IP / VPC según el proveedor.

---

## Flujo de trabajo con Git

1. Rama principal: `main` (código estable).
2. Rama de desarrollo: `develop` (opcional).
3. Ramas de trabajo por funcionalidad:
   ```bash
   # Nueva funcionalidad
   git checkout -b feature/nombre-funcionalidad

   # Corrección de bug
   git checkout -b bugfix/nombre-bug
   ```
4. Desarrollar la funcionalidad.
5. Asegurarse de que las pruebas pasan.
6. Crear Pull Request hacia `develop` o `main`.
7. Revisar código (code review) antes de hacer merge.

---

## Contribución

1. Hacer fork del repositorio.
2. Crear rama desde `develop` o `main`:
   ```bash
   git checkout -b feature/mi-aporte
   ```
3. Implementar cambios + pruebas.
4. Asegurarse de que el linter y las pruebas pasan.
5. Crear Pull Request describiendo claramente:
   - Cambios realizados.
   - Cómo probarlos.
   - Issues relacionados (si los hay).

---

**Nota:** Este README está centrado exclusivamente en la parte técnica (stack, instalación, configuración, despliegue y flujo de trabajo). 