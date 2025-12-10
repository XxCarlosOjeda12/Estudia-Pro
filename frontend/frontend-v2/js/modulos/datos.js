import { CONFIGURACION_API, MODO_DEMO, USUARIO_DEMO, TIEMPOS } from '../utilidades/constantes.js';

// Servicio de API para manejar todas las peticiones
export const servicioDatos = {
    // Cache para datos
    cache: {
        materias: null,
        recursos: null,
        examenes: null,
        tutores: null,
        foros: null,
        ultimaActualizacion: {}
    },

    /**
     * Realiza una petición a la API
     * @param {string} endpoint - Endpoint de la API
     * @param {string} metodo - Método HTTP
     * @param {Object} datos - Datos a enviar
     * @param {boolean} requiereAutenticacion - Si requiere token
     * @returns {Promise<Object>} Respuesta de la API
     */
    async realizarPeticion(endpoint, metodo = 'GET', datos = null, requiereAutenticacion = true) {
        const url = `${CONFIGURACION_API.URL_BASE}${endpoint}`;
        const encabezados = {
            'Content-Type': 'application/json',
        };

        // Modo demo: simula respuestas
        if (MODO_DEMO) {
            await this.simularLatencia();
            return this.simularRespuestaDemo(endpoint, metodo, datos, requiereAutenticacion);
        }

        // Petición real
        if (requiereAutenticacion) {
            const token = localStorage.getItem('tokenAutenticacion');
            if (token) {
                encabezados['Authorization'] = `Bearer ${token}`;
            }
        }

        const opciones = {
            method: metodo,
            headers: encabezados,
            credentials: 'include'
        };

        if (datos && (metodo === 'POST' || metodo === 'PUT' || metodo === 'PATCH')) {
            opciones.body = JSON.stringify(datos);
        }

        try {
            const respuesta = await fetch(url, opciones);
            
            if (!respuesta.ok) {
                const datosError = await respuesta.json().catch(() => ({}));
                throw new Error(datosError.mensaje || `Error HTTP! estado: ${respuesta.status}`);
            }

            return await respuesta.json();
        } catch (error) {
            console.error('Error en petición API:', error);
            throw error;
        }
    },

    /**
     * Simula latencia para modo demo
     */
    async simularLatencia() {
        return new Promise(resolve => setTimeout(resolve, TIEMPOS.SIMULACION_LATENCIA));
    },

    /**
     * Simula respuestas para modo demo
     */
    simularRespuestaDemo(endpoint, metodo, datos, requiereAutenticacion) {
        // Autenticación
        if (endpoint === CONFIGURACION_API.ENDPOINTS.AUTENTICACION.INICIAR_SESION && metodo === 'POST') {
            if (datos && datos.email === USUARIO_DEMO.email && datos.password === 'demo123') {
                localStorage.setItem('tokenAutenticacion', 'demo-token');
                return { exito: true, token: 'demo-token', usuario: USUARIO_DEMO };
            }
            return { exito: false, mensaje: 'Credenciales inválidas (usar demo@demo.com / demo123)' };
        }

        if (endpoint === CONFIGURACION_API.ENDPOINTS.AUTENTICACION.REGISTRARSE && metodo === 'POST') {
            return { exito: true, mensaje: 'Registro simulado (modo demo)' };
        }

        if (endpoint === CONFIGURACION_API.ENDPOINTS.AUTENTICACION.CERRAR_SESION) {
            localStorage.removeItem('tokenAutenticacion');
            return { exito: true };
        }

        // Verificar autenticación
        if (requiereAutenticacion) {
            const token = localStorage.getItem('tokenAutenticacion');
            if (token !== 'demo-token') {
                throw new Error('No autorizado (modo demo)');
            }
        }

        // Perfil de usuario
        if (endpoint === CONFIGURACION_API.ENDPOINTS.USUARIOS.OBTENER_PERFIL) {
            return USUARIO_DEMO;
        }

        // Materias
        if (endpoint === CONFIGURACION_API.ENDPOINTS.MATERIAS.OBTENER_TODAS) {
            return [
                { 
                    id: 'm1', 
                    titulo: 'Álgebra Básica', 
                    descripcion: 'Conceptos fundamentales de álgebra',
                    profesor: 'Dr. Martínez',
                    escuela: 'ESCOM',
                    temario: [
                        { id: 't1', titulo: 'Operaciones básicas' },
                        { id: 't2', titulo: 'Ecuaciones lineales' },
                        { id: 't3', titulo: 'Factorización' }
                    ]
                },
                { 
                    id: 'm2', 
                    titulo: 'Cálculo I', 
                    descripcion: 'Límites y derivadas',
                    profesor: 'Dra. García',
                    escuela: 'ESCOM',
                    temario: [
                        { id: 't4', titulo: 'Límites' },
                        { id: 't5', titulo: 'Derivadas' },
                        { id: 't6', titulo: 'Aplicaciones de derivadas' }
                    ]
                }
            ];
        }

        if (endpoint === CONFIGURACION_API.ENDPOINTS.MATERIAS.OBTENER_MATERIAS_USUARIO) {
            return [
                { 
                    id: 'm1', 
                    nombre: 'Álgebra Básica',
                    progreso: 65,
                    fechaExamen: null,
                    profesor: 'Dr. Martínez'
                }
            ];
        }

        // Recursos
        if (endpoint === CONFIGURACION_API.ENDPOINTS.RECURSOS.OBTENER_TODOS) {
            return [
                {
                    id: 'r1',
                    titulo: 'Guía de Álgebra Básica',
                    autor: 'Juan Pérez',
                    tipo: 'pdf',
                    precio: 50,
                    calificacion: 4.5,
                    materiaNombre: 'Álgebra Básica',
                    gratis: false,
                    ventas: 15
                },
                {
                    id: 'r2',
                    titulo: 'Exámenes Pasados Cálculo',
                    autor: 'María López',
                    tipo: 'exam',
                    precio: 75,
                    calificacion: 4.8,
                    materiaNombre: 'Cálculo I',
                    gratis: false,
                    ventas: 22
                }
            ];
        }

        if (endpoint === CONFIGURACION_API.ENDPOINTS.RECURSOS.OBTENER_RECURSOS_COMPRADOS) {
            return [];
        }

        // Exámenes
        if (endpoint === CONFIGURACION_API.ENDPOINTS.EXAMENES.OBTENER_TODOS) {
            return [
                {
                    id: 'ex1',
                    titulo: 'Examen de Álgebra - Parcial 1',
                    materiaId: 'm1',
                    duracion: 3600,
                    preguntas: []
                }
            ];
        }

        // Tutores
        if (endpoint === CONFIGURACION_API.ENDPOINTS.TUTORES.OBTENER_TODOS) {
            return [
                {
                    id: 'tu1',
                    nombre: 'Carlos Rodríguez',
                    biografia: 'Tutor con 5 años de experiencia',
                    especialidades: 'Álgebra, Cálculo',
                    calificacion: 4.9,
                    tarifa30min: 150,
                    tarifa60min: 250
                }
            ];
        }

        // Foros
        if (endpoint === CONFIGURACION_API.ENDPOINTS.FOROS.OBTENER_TODOS) {
            return [
                {
                    id: 'fo1',
                    titulo: '¿Cómo resolver ecuaciones cuadráticas?',
                    materiaNombre: 'Álgebra Básica',
                    cantidadRespuestas: 5
                }
            ];
        }

        // Logros
        if (endpoint === CONFIGURACION_API.ENDPOINTS.LOGROS.OBTENER_LOGROS_USUARIO) {
            return [
                {
                    id: 'lo1',
                    nombre: 'Primer Login',
                    descripcion: 'Iniciaste sesión por primera vez',
                    icono: '🏆',
                    fecha: '2024-01-15'
                }
            ];
        }

        // Notificaciones
        if (endpoint === CONFIGURACION_API.ENDPOINTS.NOTIFICACIONES.OBTENER_NOTIFICACIONES_USUARIO) {
            return [
                {
                    id: 'no1',
                    titulo: 'Bienvenido a Estudia-Pro',
                    mensaje: '¡Comienza a explorar todas las funciones!',
                    leido: false,
                    fecha: '2024-01-15T10:00:00Z'
                }
            ];
        }

        // Respuesta por defecto
        return { exito: true, mensaje: 'Operación simulada (modo demo)' };
    },

    // ========== MÉTODOS DE AUTENTICACIÓN ==========

    async iniciarSesion(email, password) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.AUTENTICACION.INICIAR_SESION,
            'POST',
            { email, password },
            false
        );
    },

    async registrarse(datosUsuario) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.AUTENTICACION.REGISTRARSE,
            'POST',
            datosUsuario,
            false
        );
    },

    async verificarCuenta(email, codigo) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.AUTENTICACION.VERIFICAR,
            'POST',
            { email, codigo },
            false
        );
    },

    async cerrarSesion() {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.AUTENTICACION.CERRAR_SESION,
            'POST'
        );
    },

    // ========== MÉTODOS DE USUARIO ==========

    async obtenerPerfilUsuario() {
        return this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.USUARIOS.OBTENER_PERFIL);
    },

    async actualizarPerfil(datosPerfil) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.USUARIOS.ACTUALIZAR_PERFIL,
            'PUT',
            datosPerfil
        );
    },

    // ========== MÉTODOS DE MATERIAS ==========

    async obtenerTodasMaterias(forzarActualizacion = false) {
        const ahora = Date.now();
        const ultimaActualizacion = this.cache.ultimaActualizacion.materias || 0;
        
        if (!forzarActualizacion && 
            this.cache.materias && 
            (ahora - ultimaActualizacion) < TIEMPOS.CACHE_MATERIAS) {
            return this.cache.materias;
        }

        const materias = await this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.MATERIAS.OBTENER_TODAS);
        this.cache.materias = materias;
        this.cache.ultimaActualizacion.materias = ahora;
        return materias;
    },

    async obtenerMateriasUsuario() {
        return this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.MATERIAS.OBTENER_MATERIAS_USUARIO);
    },

    async agregarMateria(materiaId) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.MATERIAS.AGREGAR_MATERIA,
            'POST',
            { materiaId }
        );
    },

    async actualizarFechaExamen(materiaId, fechaExamen) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.MATERIAS.ACTUALIZAR_FECHA_EXAMEN,
            'PUT',
            { materiaId, fechaExamen }
        );
    },

    // ========== MÉTODOS DE RECURSOS ==========

    async obtenerTodosRecursos(forzarActualizacion = false) {
        const ahora = Date.now();
        const ultimaActualizacion = this.cache.ultimaActualizacion.recursos || 0;
        
        if (!forzarActualizacion && 
            this.cache.recursos && 
            (ahora - ultimaActualizacion) < TIEMPOS.CACHE_RECURSOS) {
            return this.cache.recursos;
        }

        const recursos = await this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.RECURSOS.OBTENER_TODOS);
        this.cache.recursos = recursos;
        this.cache.ultimaActualizacion.recursos = ahora;
        return recursos;
    },

    async obtenerRecursosComprados() {
        return this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.RECURSOS.OBTENER_RECURSOS_COMPRADOS);
    },

    async comprarRecurso(recursoId) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.RECURSOS.COMPRAR,
            'POST',
            { recursoId }
        );
    },

    async descargarRecurso(recursoId) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.RECURSOS.DESCARGAR,
            'POST',
            { recursoId }
        );
    },

    // ========== MÉTODOS DE EXÁMENES ==========

    async obtenerTodosExamenes(forzarActualizacion = false) {
        const ahora = Date.now();
        const ultimaActualizacion = this.cache.ultimaActualizacion.examenes || 0;
        
        if (!forzarActualizacion && 
            this.cache.examenes && 
            (ahora - ultimaActualizacion) < TIEMPOS.CACHE_EXAMENES) {
            return this.cache.examenes;
        }

        const examenes = await this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.EXAMENES.OBTENER_TODOS);
        this.cache.examenes = examenes;
        this.cache.ultimaActualizacion.examenes = ahora;
        return examenes;
    },

    async iniciarExamen(examenId) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.EXAMENES.INICIAR_EXAMEN,
            'POST',
            { examenId }
        );
    },

    async enviarExamen(examenId, respuestas) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.EXAMENES.ENVIAR_EXAMEN,
            'POST',
            { examenId, respuestas }
        );
    },

    // ========== MÉTODOS DE TUTORES ==========

    async obtenerTodosTutores(forzarActualizacion = false) {
        const ahora = Date.now();
        const ultimaActualizacion = this.cache.ultimaActualizacion.tutores || 0;
        
        if (!forzarActualizacion && 
            this.cache.tutores && 
            (ahora - ultimaActualizacion) < TIEMPOS.CACHE_TUTORES) {
            return this.cache.tutores;
        }

        const tutores = await this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.TUTORES.OBTENER_TODOS);
        this.cache.tutores = tutores;
        this.cache.ultimaActualizacion.tutores = ahora;
        return tutores;
    },

    async agendarTutoria(tutorId, materiaId, duracion, tema) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.TUTORES.AGENDAR,
            'POST',
            { tutorId, materiaId, duracion, tema }
        );
    },

    // ========== MÉTODOS DE FOROS ==========

    async obtenerTodosForos(forzarActualizacion = false) {
        const ahora = Date.now();
        const ultimaActualizacion = this.cache.ultimaActualizacion.foros || 0;
        
        if (!forzarActualizacion && 
            this.cache.foros && 
            (ahora - ultimaActualizacion) < TIEMPOS.CACHE_FOROS) {
            return this.cache.foros;
        }

        const foros = await this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.FOROS.OBTENER_TODOS);
        this.cache.foros = foros;
        this.cache.ultimaActualizacion.foros = ahora;
        return foros;
    },

    async crearTemaForo(datosTema) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.FOROS.CREAR_TEMA,
            'POST',
            datosTema
        );
    },

    async obtenerTemaForo(temaId) {
        return this.realizarPeticion(
            `${CONFIGURACION_API.ENDPOINTS.FOROS.OBTENER_TEMA}/${temaId}`
        );
    },

    // ========== MÉTODOS DE LOGROS ==========

    async obtenerLogrosUsuario() {
        return this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.LOGROS.OBTENER_LOGROS_USUARIO);
    },

    // ========== MÉTODOS DE NOTIFICACIONES ==========

    async obtenerNotificacionesUsuario() {
        return this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.NOTIFICACIONES.OBTENER_NOTIFICACIONES_USUARIO);
    },

    async marcarNotificacionComoLeida(notificacionId) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.NOTIFICACIONES.MARCAR_COMO_LEIDO,
            'POST',
            { notificacionId }
        );
    },

    // ========== MÉTODOS DE ADMINISTRACIÓN ==========

    async obtenerTodosUsuarios() {
        return this.realizarPeticion(CONFIGURACION_API.ENDPOINTS.ADMINISTRACION.USUARIOS);
    },

    async gestionarUsuario(usuarioId, accion, datos) {
        return this.realizarPeticion(
            `${CONFIGURACION_API.ENDPOINTS.ADMINISTRACION.USUARIOS}/${usuarioId}`,
            'PUT',
            { accion, ...datos }
        );
    },

    async crearMateria(datosMateria) {
        return this.realizarPeticion(
            CONFIGURACION_API.ENDPOINTS.ADMINISTRACION.MATERIAS,
            'POST',
            datosMateria
        );
    },

    async actualizarMateria(materiaId, datosMateria) {
        return this.realizarPeticion(
            `${CONFIGURACION_API.ENDPOINTS.ADMINISTRACION.MATERIAS}/${materiaId}`,
            'PUT',
            datosMateria
        );
    },

    async eliminarMateria(materiaId) {
        return this.realizarPeticion(
            `${CONFIGURACION_API.ENDPOINTS.ADMINISTRACION.MATERIAS}/${materiaId}`,
            'DELETE'
        );
    },

    // ========== MÉTODOS DE CACHE ==========

    limpiarCache() {
        this.cache = {
            materias: null,
            recursos: null,
            examenes: null,
            tutores: null,
            foros: null,
            ultimaActualizacion: {}
        };
    },

    actualizarCache(tipo, datos) {
        this.cache[tipo] = datos;
        this.cache.ultimaActualizacion[tipo] = Date.now();
    }
};