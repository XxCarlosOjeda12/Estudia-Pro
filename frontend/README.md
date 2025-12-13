# Estudia-Pro · Frontend React

Migramos la maqueta original (`frontend-v2`) a un proyecto **React + Vite** que replica el comportamiento del archivo `demo-frontend-luis/fepipro (1).html`. Toda la interfaz ahora es declarativa, con componentes reutilizables y estilos construidos únicamente con Tailwind CSS.

## Características principales
- **Modos estudiante, creador y administrador** con paneles dedicados, acciones y métricas propias.
- **Modo Demo** activable desde el login para probar toda la app sin backend. Al desactivarlo, `apiService` consume la API real definida en `src/lib/constants.js`.
- **Datos pre-cargados** (materias, recursos, exámenes, foros, etc.) en `src/lib/constants.js` que alimentan todas las vistas y soportan autocompletado en buscadores.
- **Shell del dashboard** con navegación responsive, colapsado móvil, notificaciones y cierre de sesión.
- **Exámenes, simulador, foros, IA diagnóstica y tutorías SOS** listos para integrarse con servicios reales.
- **Contexto global (`AppContext`)** que maneja sesión, token, modo demo, cachés básicos y stack de notificaciones.

## Requisitos
- Node.js >= 18
- npm >= 8 (el proyecto usa dependencias modernas; aún no se ejecutó `npm install` en este entorno).

## Scripts disponibles

```bash
npm install         # instala dependencias
npm run dev         # levanta Vite con HMR (http://localhost:5173)
npm run build       # genera artefactos optimizados en dist/
npm run preview     # sirve dist/ para QA
npm run lint        # ejecuta ESLint con la configuración base de Vite
```

## Estructura relevante (`frontend/src`)

```
components/NotificationStack.jsx   // banner flotante para toasts
context/AppContext.jsx             // estado global: auth, demo mode, cachés
lib/constants.js                   // API endpoints y datos demo
lib/api.js                         // cliente API + simulador demo
views/LoginPage.jsx                // login con toggle de demo y perfiles rápidos
views/DashboardShell.jsx           // layout + routing simple
views/pages/*                      // pantallas por sección/rol (paneles, foros, exámenes, etc.)
index.css                          // tailwind + utilidades compartidas
```

## Modo Demo y datos hardcodeados
- El flag se guarda en `localStorage` (`estudia-pro-demo-mode`) y también se puede alternar con el botón “Activado/Desactivado” del login.
- Mientras esté en `true`, cada llamada de `apiService` delega en el simulador (`DemoAPI`) que usa `HARDCODED_DATA`. Al cambiar a `false`, el cliente usa `fetch` real contra `API_CONFIG.BASE_URL`.
- Los “Perfiles rápidos” (estudiante, creador, administrador) rellenan usuario y contraseña automáticamente para validar cada flujo.
- Si necesitas ajustar la información demo, modifica `HARDCODED_DATA` y `DEMO_PROFILES`; todos los componentes reaccionan automáticamente sin tocar JSX.

## Conectar con el backend real
1. Actualiza `API_CONFIG.BASE_URL` si tu API no vive en `http://127.0.0.1:8000/api`.
2. Desactiva el modo demo desde el login o manualmente ejecutando en consola `localStorage.setItem('estudia-pro-demo-mode', 'false')`.
3. Inicia sesión con credenciales reales; `AppContext` guardará el `authToken` y llamará a `apiService.getProfile()` para poblar la interfaz.
4. Si una ruta de backend aún no existe, puedes dejar el modo demo activo hasta que esté lista sin cambiar componentes.

## Estilos y temas
- Tailwind está configurado en `tailwind.config.js` con colores personalizados (`primary`, `secondary`, `light-bg`, `dark-bg`, etc.).
- `src/index.css` importa la fuente Inter y define utilidades como `glass-effect-light`, animaciones y helpers de modo examen.
- No se cargan hojas de estilo externas; cualquier ajuste visual debe realizarse vía clases Tailwind o `@apply`.

## Próximos pasos sugeridos
1. Ejecutar `npm install` y probar `npm run dev` para validar el build (no se pudo correr dentro de este entorno).
2. Completar los endpoints reales del backend y mapear las respuestas al formato utilizado en `formatUserForFrontend`.
3. Reforzar pruebas/UI para teclado matemático u otras integraciones (MathLive, charts) si se requieren en producción.

Con esto el equipo puede seguir extendiendo Estudia-Pro totalmente en React, manteniendo el modo demo para QA y la conexión con APIs reales cuando estén listas.
