# Estudia-Pro · Frontend React

Plataforma educativa para estudiantes de matemáticas e ingeniería, desarrollada con **React 19 + Vite**. Cuenta con **modo demo completo** que permite explorar todas las funcionalidades sin necesidad de un backend activo.

> **Importante:** Este frontend opera 100% con datos locales (localStorage + IndexedDB + archivos JSON) cuando el modo demo está activo. No requiere backend para funcionar.

---

## Índice

1. [Inicio Rápido](#inicio-rápido)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Arquitectura y Flujo de Datos](#arquitectura-y-flujo-de-datos)
4. [Modo Demo vs Modo Real](#modo-demo-vs-modo-real)
5. [Roles de Usuario](#roles-de-usuario)
6. [Páginas y Funcionalidades](#páginas-y-funcionalidades)
7. [Sistema de Almacenamiento Local](#sistema-de-almacenamiento-local)
8. [Componentes Principales](#componentes-principales)
9. [Estilos y Temas](#estilos-y-temas)
10. [Dependencias](#dependencias)
11. [Scripts Disponibles](#scripts-disponibles)
12. [Credenciales de Prueba](#credenciales-de-prueba)

---

## Inicio Rápido

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

> ⚠️ **No abras los archivos HTML de `demo-frontend-luis/` o `frontend-v2/`** directamente. Esas carpetas son prototipos históricos y no representan la aplicación actual.

---

## Estructura del Proyecto

```
frontend/
├── index.html                    # Entry point HTML
├── package.json                  # Dependencias y scripts
├── vite.config.js                # Configuración de Vite
├── tailwind.config.js            # Configuración de Tailwind CSS
├── postcss.config.js             # PostCSS para Tailwind
├── eslint.config.js              # Reglas de ESLint
│
├── public/
│   ├── data/
│   │   ├── subjects.json         # Catálogo de materias (fuente de verdad)
│   │   ├── community-resources.json  # Recursos de la comunidad
│   │   └── formularios.json      # Formularios de estudio
│   ├── formularios/              # PDFs de formularios
│   └── recursos_comunidad/       # PDFs de recursos compartidos
│
├── src/
│   ├── main.jsx                  # Punto de entrada React
│   ├── App.jsx                   # Componente raíz + enrutamiento
│   ├── index.css                 # Estilos globales + Tailwind
│   │
│   ├── context/
│   │   └── AppContext.jsx        # Estado global (auth, demo, cache, toasts)
│   │
│   ├── lib/
│   │   ├── api.js                # Cliente API + Simulador Demo (DemoAPI)
│   │   ├── constants.js          # Endpoints + datos hardcodeados + perfiles demo
│   │   ├── demoFileStore.js      # Almacenamiento de archivos en IndexedDB
│   │   └── url.js                # Utilidades para resolución de URLs
│   │
│   ├── components/
│   │   ├── MathRenderer.jsx      # Renderizado de LaTeX con KaTeX
│   │   ├── NotificationStack.jsx # Stack de toasts flotantes
│   │   └── SubscriptionModal.jsx # Modal de suscripción premium
│   │
│   └── views/
│       ├── LoginPage.jsx         # Página de login + toggle demo
│       ├── RegisterPage.jsx      # Página de registro
│       ├── DashboardShell.jsx    # Layout principal + navegación + routing
│       │
│       └── pages/
│           ├── PanelStudent.jsx      # Panel del estudiante
│           ├── PanelCreator.jsx      # Panel del creador/tutor
│           ├── PanelAdmin.jsx        # Panel del administrador
│           ├── ExplorePage.jsx       # Explorar catálogo de materias
│           ├── MateriaPage.jsx       # Detalle de una materia
│           ├── RecursosPage.jsx      # Recursos de la comunidad
│           ├── ForoPage.jsx          # Listado de temas del foro
│           ├── ForoTemaPage.jsx      # Detalle de un tema del foro
│           ├── FormulariosPage.jsx   # Formularios de estudio (PDFs)
│           ├── ProgresoPage.jsx      # Gráficas de progreso del estudiante
│           ├── ExamenPage.jsx        # Vista de examen con MathLive
│           ├── SimuladorPage.jsx     # Generador de simulacros
│           ├── TutoriasPage.jsx      # Tutorías SOS
│           ├── MisRecursosPage.jsx   # Recursos del creador
│           ├── GestionUsuariosPage.jsx   # Admin: gestión de usuarios
│           ├── GestionMateriasPage.jsx   # Admin: gestión de materias
│           ├── GestionRecursosPage.jsx   # Admin: gestión de recursos
│           └── GestionFormulariosPage.jsx # Admin: gestión de formularios
│
├── demo-frontend-luis/           # [HISTÓRICO] Prototipo HTML original
└── frontend-v2/                  # [HISTÓRICO] Segunda iteración HTML
```

---

## Arquitectura y Flujo de Datos

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                           App.jsx                                │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │  LoginPage.jsx      │    │     DashboardShell.jsx          │ │
│  │  RegisterPage.jsx   │ OR │  (Sidebar + Routing interno)    │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AppContext.jsx                              │
│  - user, token, demoEnabled                                      │
│  - login(), logout(), loadProfile()                              │
│  - notifications, cache, toasts                                  │
│  - toggleDemoMode(), enableDemoMode()                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         api.js                                   │
│  ┌─────────────────┐         ┌─────────────────────────────┐   │
│  │   apiService    │ ──────► │  DemoAPI (modo demo)        │   │
│  │  (facade)       │         │  o fetch real (modo real)   │   │
│  └─────────────────┘         └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Almacenamiento Local                                │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ localStorage │  │  IndexedDB   │  │  /public/data/*.json │   │
│  │  (estados)   │  │  (archivos)  │  │  (datos iniciales)   │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Autenticación

1. Usuario llega a `LoginPage.jsx`
2. Puede activar/desactivar **modo demo** con el toggle
3. Al hacer login:
   - **Modo Demo:** `DemoAPI.login()` valida contra `DEMO_PROFILES` en `constants.js`
   - **Modo Real:** `fetch` a `/api/auth/login/`
4. Si es exitoso, se guarda `authToken` en `localStorage`
5. `AppContext` carga el perfil y renderiza `DashboardShell.jsx`

---

## Modo Demo vs Modo Real

| Aspecto | Modo Demo | Modo Real |
|---------|-----------|-----------|
| **Activación** | Toggle en login o `localStorage` | Desactivar toggle |
| **Datos** | `HARDCODED_DATA` + JSON locales + localStorage | API REST del backend |
| **Persistencia** | localStorage + IndexedDB | Base de datos del servidor |
| **Latencia** | 350ms simulada | Real |
| **Archivos** | IndexedDB (`demoFileStore.js`) | Backend + storage |

### Claves de localStorage (Modo Demo)

| Clave | Descripción |
|-------|-------------|
| `estudia-pro-demo-mode` | `true`/`false` - Activa modo demo |
| `authToken` | Token de sesión |
| `estudia-pro-demo-subjects` | Materias del catálogo |
| `estudia-pro-demo-community-resources` | Recursos de la comunidad |
| `estudia-pro-demo-formularies` | Formularios de estudio |
| `estudia-pro-demo-forums` | Temas del foro |
| `estudia-pro-demo-user-state` | Estado por usuario (materias, compras, progreso) |
| `estudia-pro-demo-extra-users` | Usuarios registrados en demo |
| `estudia-pro-demo-admin-users` | Lista de usuarios para panel admin |
| `estudia-pro-demo-tutor-profiles` | Perfiles de tutores |
| `estudia-pro-demo-tutoring-sessions` | Sesiones de tutoría agendadas |

### Sincronización entre pestañas

El modo demo usa `BroadcastChannel` y eventos `storage` para sincronizar cambios entre pestañas del navegador en tiempo real.

---

## Roles de Usuario

### Estudiante (`ESTUDIANTE`)

- **Panel:** Resumen de materias, actividades próximas, progreso
- **Acciones:** 
  - Explorar y añadir materias
  - Ver recursos de la comunidad (requiere premium)
  - Descargar formularios
  - Realizar exámenes y simulacros
  - Participar en el foro
  - Agendar tutorías SOS
  - Ver gráficas de progreso

### Creador (`CREADOR`)

- **Panel:** Métricas de recursos publicados, solicitudes de tutorías
- **Acciones:**
  - Gestionar recursos propios
  - Configurar perfil de tutor
  - Atender solicitudes de tutoría
  - Participar como mentor en el foro

### Administrador (`ADMINISTRADOR`)

- **Panel:** Métricas globales (usuarios, materias, recursos)
- **Acciones:**
  - Gestionar usuarios (crear, editar, eliminar)
  - Gestionar catálogo de materias
  - Gestionar recursos de la comunidad
  - Gestionar formularios

---

## Páginas y Funcionalidades

### Login (`LoginPage.jsx`)

- Toggle de modo demo prominente
- Accesos rápidos a perfiles demo (estudiante, creador, admin)
- Recuperación de contraseña (solo en demo)
- Opción "Recordarme"

### Dashboard (`DashboardShell.jsx`)

- **Sidebar responsive** con navegación por rol
- **Modo oscuro/claro** (toggle en header)
- **Notificaciones** con badge y panel desplegable
- **Perfil de usuario** con stats (nivel, puntos, racha)
- Routing interno sin recargas de página

### Explorar Materias (`ExplorePage.jsx`)

- Búsqueda en tiempo real con normalización de acentos
- Chips de búsqueda rápida (Derivadas, Matrices, Probabilidad)
- Tarjetas con nivel, escuela, descripción y temario
- Botón para añadir materia al panel del estudiante

### Detalle de Materia (`MateriaPage.jsx`)

- Información completa de la materia
- **Ruta de Estudio:** Temario con enlaces externos:
  - 🔍 Google Search
  - ▶️ YouTube Tutorial
  - ✨ Perplexity AI (diagnóstico)
- **Fecha de examen** editable (fecha + hora)
- **Diagnóstico con IA:** Genera quiz por nivel
- **Simulacro de Examen:** Acceso directo al examen
- **Tutoría SOS:** Agendar asesoría
- Opción para dar de baja la materia

### Exámenes (`ExamenPage.jsx`)

- **Cronómetro** con pausa/reanudación
- **MathLive** para escritura de fórmulas matemáticas
- **KaTeX** para renderizado de preguntas LaTeX
- Revisión por pregunta (correcto/incorrecto)
- Enlace a **Wolfram Alpha** si la respuesta es incorrecta
- Confirmación al salir con examen en progreso

### Simulador (`SimuladorPage.jsx`)

- Selección de número de preguntas (1-20)
- Filtro por dificultad (Fácil, Intermedio, Avanzado)
- Vista previa de preguntas seleccionadas
- Botón para iniciar examen formal

### Recursos de la Comunidad (`RecursosPage.jsx`)

- **Filtros:** Búsqueda, materia, tipo (pdf, exam, formula)
- **Restricción Premium:** Modal de suscripción para no-premium
- Vista previa y descarga de archivos
- Paginación progresiva (cargar más)

### Formularios (`FormulariosPage.jsx`)

- Grid de formularios disponibles
- Modal con vista previa (iframe PDF)
- Descarga directa sin perder sesión

### Foro (`ForoPage.jsx` + `ForoTemaPage.jsx`)

- Listado de temas con conteo de respuestas
- Creación de nuevos temas
- Vista de tema individual con todos los posts
- Responder a temas existentes
- Sistema de votos

### Progreso (`ProgresoPage.jsx`)

- **Gráfica de barras:** Promedio en exámenes por materia
- **Tiempo de estudio:** Total acumulado
- **Estadísticas:** Nivel, puntos, materias completadas
- Actualización en tiempo real

### Tutorías SOS (`TutoriasPage.jsx`)

- **Estudiantes:** Lista de tutores disponibles, agendar sesión
- **Creadores:** Gestionar perfil de tutor, ver solicitudes
- Configuración de tarifas (30min, 60min)
- Aceptar/rechazar solicitudes

### Paneles de Administración

- **Gestión de Usuarios:** CRUD completo, cambio de rol
- **Gestión de Materias:** Crear, editar, eliminar del catálogo
- **Gestión de Recursos:** Aprobar, eliminar recursos de comunidad
- **Gestión de Formularios:** Subir, editar, eliminar PDFs

---

## Sistema de Almacenamiento Local

### IndexedDB (`demoFileStore.js`)

Almacena archivos binarios (PDFs, imágenes) para el modo demo:

```javascript
// Guardar archivo
const fileId = await putDemoFile(fileBlob);

// Recuperar archivo
const { blob, name, type } = await getDemoFile(fileId);

// Eliminar archivo
await deleteDemoFile(fileId);
```

**Base de datos:** `estudia-pro-demo-files`  
**Object Store:** `files` (keyPath: `id`)

### Carga de Datos Iniciales

1. **Materias:** `/public/data/subjects.json` → `localStorage` → `DemoAPI.subjectsCatalog`
2. **Recursos:** `/public/data/community-resources.json` → merge con localStorage
3. **Formularios:** `/public/data/formularios.json` → merge con localStorage

El sistema mantiene un versionado (`DEMO_COMMUNITY_RESOURCES_VERSION`) para forzar recarga cuando cambian los JSON.

---

## Componentes Principales

### `MathRenderer.jsx`

Renderiza texto con fórmulas LaTeX usando KaTeX:

```jsx
<MathRenderer text="La derivada de $x^2$ es $2x$" />
```

Delimitadores soportados: `$...$`, `$$...$$`, `\(...\)`, `\[...\]`

### `NotificationStack.jsx`

Stack de toasts flotantes con tipos: `info`, `success`, `alert`

```jsx
const { pushToast } = useAppContext();
pushToast({ title: 'Éxito', message: 'Operación completada', type: 'success' });
```

Auto-dismiss después de 5 segundos.

### `SubscriptionModal.jsx`

Modal de suscripción premium con simulación de pago:

1. **Oferta:** Beneficios de premium
2. **Pago:** Formulario de tarjeta (simulado)
3. **Procesando:** Animación de carga
4. **Éxito:** Confirmación

---

## Estilos y Temas

### Tailwind Config (`tailwind.config.js`)

```javascript
colors: {
  primary: '#8b5cf6',      // Violeta
  'primary-focus': '#7c3aed',
  secondary: '#10b981',    // Esmeralda
  accent: '#f59e0b',       // Ámbar
  'dark-bg': '#0f172a',    // Slate 900
  'dark-card': '#1e293b',  // Slate 800
  'light-bg': '#f1f5f9',   // Slate 100
  'light-card': '#ffffff',
}
```

### Clases Personalizadas (`index.css`)

- `.glass-effect-light`: Efecto glassmorphism adaptativo
- `.page.active`: Control de visibilidad de páginas
- `.animate-modal-in`: Animación de entrada de modales
- `.math-block` / `.math-inline`: Estilos para KaTeX

### Modo Oscuro/Claro

- Toggle en el header del dashboard
- Clase `dark` en `<html>` para Tailwind
- Clase `light` en `<body>` para estilos base

---

## Dependencias

### Producción

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | 19.2.0 | Framework UI |
| `react-dom` | 19.2.0 | Renderizado DOM |
| `katex` | 0.16.27 | Renderizado LaTeX |
| `mathlive` | 0.108.2 | Input matemático con teclado virtual |
| `chart.js` | 4.5.1 | Gráficas de progreso |
| `react-chartjs-2` | 5.3.1 | Wrapper React para Chart.js |

### Desarrollo

| Paquete | Uso |
|---------|-----|
| `vite` (rolldown-vite) | Bundler y dev server |
| `tailwindcss` | Framework CSS |
| `eslint` | Linter |
| `autoprefixer` | PostCSS plugin |

---

## Scripts Disponibles

```bash
npm install         # Instala dependencias
npm run dev         # Inicia servidor de desarrollo (http://localhost:5173)
npm run build       # Genera build de producción en dist/
npm run preview     # Sirve el build para QA
npm run lint        # Ejecuta ESLint
npm run sync-resources  # Sincroniza recursos (si existe el script)
```

---

## Credenciales de Prueba

### Perfiles Rápidos (Modo Demo)

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Estudiante | `demo@estudiapro.com` | `demo123` |
| Creador | `creador@estudiapro.com` | `demo123` |
| Administrador | `admin@estudiapro.com` | `demo123` |

### Tutores Demo

| Tutor | Email | Especialidad |
|-------|-------|--------------|
| Alejandra Ruiz | `alejandra@estudiapro.com` | Cálculo, Álgebra |
| Ian Salazar | `ian@estudiapro.com` | Probabilidad, Estadística |
| Rosa Vera | `rosa@estudiapro.com` | Ecuaciones Diferenciales |

---

## Flujo de Trabajo Típico

### Estudiante

1. Login con perfil estudiante
2. Explorar y añadir materias
3. Configurar fecha de examen
4. Estudiar con los enlaces externos (Google, YouTube, Perplexity)
5. Practicar con simulacros
6. Consultar formularios
7. Preguntar en el foro si hay dudas
8. Agendar tutoría SOS si se atora
9. Ver progreso en gráficas

### Creador

1. Login con perfil creador
2. Configurar perfil de tutor (especialidades, tarifas)
3. Publicar recursos en "Mis Recursos"
4. Atender solicitudes de tutorías
5. Participar como mentor en el foro

### Administrador

1. Login con perfil admin
2. Revisar métricas globales
3. Gestionar usuarios (verificar, cambiar rol)
4. Administrar catálogo de materias
5. Aprobar/rechazar recursos de la comunidad
6. Gestionar formularios de estudio

---

## Notas Técnicas

### ¿Por qué modo demo por defecto?

El frontend está diseñado para funcionar de manera independiente durante desarrollo y demos. Cuando el backend esté listo:

1. Desactiva el modo demo desde el login
2. Actualiza `API_CONFIG.BASE_URL` en `constants.js` si es necesario
3. Las llamadas irán automáticamente al backend real

### Sincronización de Datos

Los archivos JSON en `/public/data/` son la **fuente de verdad** para datos iniciales. Al cargar la app:

1. Se intenta `fetch` del JSON
2. Se hace merge con datos en localStorage (preserva creaciones del usuario)
3. Se guarda el resultado en localStorage

### Archivos de Usuario

Los archivos subidos en modo demo se almacenan en IndexedDB con un `fileId` único. Las referencias se guardan en localStorage junto con los metadatos del recurso/formulario.

---

## Próximos Pasos

1. [ ] Integrar con backend Django cuando esté listo
2. [ ] Implementar WebSockets para notificaciones en tiempo real
3. [ ] Añadir tests unitarios y de integración
4. [ ] Optimizar bundle size para producción
5. [ ] Implementar PWA para uso offline
6. [ ] Añadir internacionalización (i18n)

---

*Última actualización: Enero 2026*

