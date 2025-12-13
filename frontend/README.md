# React + Vite

Este proyecto utiliza React con Vite para un entorno de desarrollo rápido, con recarga en caliente (HMR) y una configuración base de ESLint.

Actualmente se pueden usar los siguientes plugins oficiales:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) para recarga rápida usando Babel  
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) para recarga rápida usando SWC  

---

## React Compiler

El compilador de React no está habilitado en este proyecto debido a su impacto en el rendimiento durante el desarrollo y la construcción.  
Si se desea activar, se recomienda consultar la documentación oficial de React.

---

## Configuración de ESLint

Para aplicaciones en producción, se recomienda utilizar TypeScript junto con reglas de linting más estrictas y conscientes de tipos.  
Existe una plantilla oficial con TypeScript que puede servir como referencia para extender esta configuración.

---

## Frontend demo (Luis)

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
