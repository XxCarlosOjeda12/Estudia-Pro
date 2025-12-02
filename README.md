# Estudia-Pro

Plataforma web educativa para la práctica y evaluación de cursos de matemáticas a nivel universitario, construida con **Django (backend)** y **React (frontend)**, usando **PostgreSQL** como base de datos principal.

---

## Stack tecnológico

- **Frontend**
  - [React](https://react.dev/)
  - [Tailwind CSS](https://tailwindcss.com/) (estilos y diseño)
  - React Router (ruteo en el cliente)
  - Axios o fetch API (consumo de API REST)
  - Vite / Create React App (según configuración del proyecto)
- **Backend**
  - [Django](https://www.djangoproject.com/)
  - Django REST Framework (API REST)
- **Base de datos**
  - [PostgreSQL](https://www.postgresql.org/)
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

## Estructura del proyecto (propuesta)

```bash
estudia-pro/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── estudia_pro/        # Configuración principal de Django
│   └── apps/
│       ├── users/
│       ├── courses/
│       ├── questions/
│       ├── exams/
│       ├── marketplace/
│       └── tutoring/
├── frontend/
│   ├── package.json
│   ├── vite.config.js / webpack.config.js
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/       # Cliente API (axios, fetch)
│       └── router/
└── README.md
```

La estructura exacta puede variar según la implementación real del repo.

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

### Backend (Django)
Crear un archivo `.env` en el directorio `backend/` (o usar variables de entorno del sistema):

```env
# Django
DJANGO_SECRET_KEY=tu_clave_secreta
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Base de datos PostgreSQL
DB_NAME=estudiapro_db
DB_USER=postgres
DB_PASSWORD=postgres_password
DB_HOST=localhost
DB_PORT=5432

# CORS / frontend
FRONTEND_URL=http://localhost:5173
```

Configurar `settings.py` para leer estas variables (por ejemplo con `python-dotenv` o `os.environ`).

### Frontend (React)
Crear `.env` en `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

o equivalente según el empaquetador usado.

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

# Ejecutar servidor de desarrollo
python manage.py runserver 8000
```

El backend quedará disponible en:
**http://localhost:8000/**

### 3. Frontend (React)

En otra terminal:

```bash
cd frontend

# Instalar dependencias
npm install        # o yarn

# Ejecutar servidor de desarrollo
npm run dev        # o yarn dev
```

El frontend quedará disponible en (ejemplo con Vite):
**http://localhost:5173/**

---

## Endpoints (visión general)

La lista detallada de endpoints puede documentarse con Swagger / Redoc / Postman.

Algunos grupos de endpoints esperados:

- `auth/` – registro, login, refresh de tokens, gestión de perfil.
- `users/` – gestión de usuarios y roles.
- `courses/` – materias, temas, contenidos.
- `questions/` – banco de preguntas.
- `exams/` – creación y resolución de exámenes, simuladores.
- `progress/` – resultados, estadísticas y métricas.
- `marketplace/` – recursos de la comunidad (materiales, guías, etc.).
- `tutoring/` – gestión de tutorías SOS.
- `forum/` – hilos, respuestas, reacciones.

---

## Pruebas

### Backend
Pruebas unitarias/integración con `pytest` o el framework de pruebas de Django.

```bash
cd backend
pytest
# o
python manage.py test
```

### Frontend
Pruebas unitarias de componentes con Jest/Testing Library (según configuración).

```bash
cd frontend
npm test
```

---

## Estilo de código y calidad

**Python**
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
