# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Frontend demo (Luis)

Este proyecto incluye un prototipo de frontend sin datos hardcodeados en:

`frontend/demo-frontend-luis/`

Está pensado para consumir la API del backend, pero también tiene un **modo demo** para poder usar la app aunque el backend real no esté levantado.

### Credenciales de prueba

- Email: `demo@demo.com`
- Contraseña: `demo123`

### Cómo activar/desactivar el modo demo

En `demo-frontend-luis/script.js`:

```js
// Modo demo (usa usuario y datos de prueba)
const DEMO_MODE = true;

// Modo real (usa API del backend)
const DEMO_MODE = false;

const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api', // ajustar al backend real
  // ...
};
