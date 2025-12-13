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

Este repositorio incluye un prototipo de frontend ubicado en:

`frontend/demo-frontend-luis/`

El frontend está diseñado para consumir la API del backend, pero también cuenta con un **modo demostración**, lo que permite usar la aplicación aunque el backend real no esté activo.

---

### Credenciales de prueba

- **Correo:** `demo@demo.com`  
- **Contraseña:** `demo123`

---

### Activar o desactivar el modo demostración

Dentro del archivo `demo-frontend-luis/script.js` se puede cambiar entre modo demostración y modo real:

---

## Cambios recientes

### Modo de demostración y uso del sistema real

La plataforma ahora permite trabajar en **modo demostración** o conectarse al **sistema real**, lo que facilita explorar y probar la aplicación sin depender de que todo el sistema esté activo.

Desde la pantalla de inicio de sesión es posible identificar claramente si se están usando datos de prueba o datos reales.  
Cuando el modo demostración está activo, la aplicación muestra información simulada como usuarios, materias, notificaciones, recursos y exámenes, permitiendo recorrer la plataforma de forma completa.

El proceso de registro fue ajustado para manejar correctamente la información según el tipo de usuario (estudiante, docente o administrador), asegurando que los datos se envíen de manera correcta al sistema principal.

---

### Dashboard y navegación simplificada

Se mejoró la estructura de navegación para que la experiencia sea más clara y directa.  
Algunas secciones que ya no eran necesarias fueron retiradas del menú, como la sección de logros.

Las notificaciones se actualizan automáticamente y se muestran con un indicador visual cuando hay mensajes nuevos.  
Estas pueden abrirse, leerse y marcarse como vistas desde la misma plataforma.

---

### Exploración de materias y recursos

Se incorporó una barra de búsqueda que permite encontrar materias y contenidos de forma rápida.  
Las materias y recursos se organizan mediante etiquetas visuales que facilitan el filtrado y la exploración de información.

---

### Exámenes y escritura matemática

La sección de exámenes fue mejorada para facilitar la resolución de ejercicios matemáticos.  
Ahora se cuenta con un teclado matemático integrado que puede mostrarse u ocultarse según sea necesario y que se adapta correctamente a distintos tamaños de pantalla.

Esto permite una experiencia más fluida y ordenada al escribir fórmulas y resolver evaluaciones dentro de la plataforma.

---

### Cómo probar la plataforma

1. Mantén activo el modo demostración para recorrer el sistema con datos de ejemplo.
2. Desactívalo cuando quieras conectarte al sistema real y validar funciones como el inicio de sesión, el registro y las notificaciones.

---

### Foro, búsquedas y práctica de exámenes

Se completó la vista de los temas del foro, permitiendo entrar a cada discusión y responder directamente desde el mismo espacio.  
Ahora cada tema muestra todo el historial de mensajes y cuenta con su propio formulario para agregar nuevas respuestas, haciendo la conversación más clara y ordenada.

Los buscadores de materias y recursos fueron mejorados para que realmente ayuden al usuario.  
Al escribir, el sistema sugiere resultados de forma más inteligente, reconoce palabras aunque tengan acentos y utiliza la misma lógica tanto para materias como para recursos, logrando una experiencia de búsqueda consistente.

El flujo de exámenes ya funciona de forma completa.  
El teclado matemático puede mostrarse u ocultarse fácilmente, las respuestas se guardan mientras el usuario escribe y, al finalizar, el sistema valida automáticamente las respuestas contra las preguntas del examen.  
Al salir de esta vista, todo se limpia para evitar errores o información acumulada.

También se agregó un simulador de práctica que permite generar preguntas según la materia y el nivel de dificultad, sin necesidad de cambiar de pantalla.  
Desde ahí mismo se puede pasar directamente al modo examen para continuar con la evaluación formal.

Por último, los botones de **“Diagnóstico con IA”** ahora funcionan de manera real, conectándose a **Perplexity**.  
Además, se prepararon utilidades internas que permitirán reutilizar esta lógica en futuras funciones relacionadas con búsquedas y análisis.

---

### Estilos, modo demo y mejoras por rol

La aplicación ahora utiliza **Tailwind como única fuente de estilos**, eliminando hojas de estilo separadas y logrando un diseño más consistente y fácil de mantener.  
Los efectos visuales, animaciones, el teclado matemático, el foro y las notificaciones están completamente estilizados con utilidades nativas de Tailwind.

El modo demostración fue mejorado para reflejar mejor el comportamiento real según el rol del usuario.  
Ahora incluye datos diferenciados por tipo de usuario y permite realizar acciones de administración y creación de contenido

---

### Uso real de React y paso a una arquitectura por componentes

En esta etapa el frontend dejó de manejarse como páginas estáticas con JavaScript suelto y pasó a trabajar **realmente con React**.

Todo lo que antes estaba separado en archivos HTML, CSS y JS dentro de `frontend-v2` ahora se implementa mediante **componentes React (JSX)**, lo que permite reutilizar código y controlar mejor el comportamiento de la aplicación.

Los cambios más importantes fueron:

- Las pantallas principales ahora son componentes de React y ya no vistas estáticas:
  - Login y registro
  - Dashboard general
  - Panel de estudiante, creador y administrador
  - Materias, exámenes, foro, progreso y recursos
- La navegación ya no depende de recargar páginas ni de redirecciones manuales, sino del **estado de la aplicación** y del **rol del usuario**.
- El manejo de sesión, rol, modo demostración y notificaciones se centralizó en `AppContext`, evitando repetir lógica en cada pantalla.
- Se eliminó la manipulación directa del DOM y los scripts independientes; ahora la interfaz responde automáticamente a los cambios de estado.
- Al cambiar de sección, los componentes se montan y desmontan correctamente, evitando que queden datos o estados “arrastrados” entre vistas.

Con estos cambios, el proyecto deja de ser una maqueta estática y pasa a ser una **aplicación React bien estructurada**, lista para crecer, integrarse con el backend real y mantener una separación clara entre interfaz, lógica y estado.

