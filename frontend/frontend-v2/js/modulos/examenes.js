import { servicioDatos } from './datos.js';
import { formatearTiempoRestante, mostrarOcultar, agregarClaseTemporal } from '../utilidades/funciones-ayuda.js';

export const moduloExamenes = {
    // ========== ESTADO DE EXAMEN ==========
    estadoExamen: null,

    /**
     * Inicializa un examen
     * @param {string} examenId - ID del examen
     */
    async inicializarExamen(examenId) {
        try {
            // Obtener datos del examen
            const examen = await servicioDatos.iniciarExamen(examenId);
            
            // Configurar estado
            this.estadoExamen = {
                id: examen.id,
                titulo: examen.titulo,
                duracion: examen.duracion || 3600, // 1 hora por defecto
                tiempoRestante: examen.duracion || 3600,
                temporizador: null,
                respuestas: {},
                preguntas: examen.preguntas || [],
                completado: false
            };
            
            // Renderizar examen
            this.renderizarExamen();
            
            // Iniciar temporizador
            this.iniciarTemporizador();
            
            // Configurar modo examen
            this.activarModoExamen();
            
        } catch (error) {
            console.error('Error inicializando examen:', error);
            throw error;
        }
    },

    /**
     * Renderiza el examen
     */
    renderizarExamen() {
        const contenido = document.getElementById('contenido-principal');
        if (!contenido) return;
        
        contenido.innerHTML = `
            <div class="pagina activa">
                <div class="flex justify-between items-center mb-4">
                    <button onclick="aplicacion.navegarAtras()" 
                            class="flex items-center text-sm text-primary hover:underline">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver
                    </button>
                    <div class="text-2xl font-mono bg-red-500/20 text-red-500 py-2 px-4 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span id="temporizador-examen">${formatearTiempoRestante(this.estadoExamen.tiempoRestante)}</span>
                    </div>
                </div>
                
                <h1 class="text-3xl font-bold mb-2">${this.estadoExamen.titulo}</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">
                    Resuelve los ejercicios en el tiempo establecido.
                </p>
                
                <div id="contenedor-preguntas" class="space-y-6">
                    ${this.generarHTMLPreguntas()}
                </div>
                
                <div class="mt-8 text-center">
                    <button onclick="aplicacion.finalizarExamen()" 
                            class="py-3 px-8 bg-secondary/80 hover:bg-secondary text-white font-bold rounded-lg transition-transform transform hover:scale-105">
                        Terminar y Calificar Examen
                    </button>
                </div>
            </div>
        `;
        
        // Configurar campos matemáticos
        this.configurarCamposMatematicos();
    },

    /**
     * Genera HTML para las preguntas
     * @returns {string} HTML de preguntas
     */
    generarHTMLPreguntas() {
        return this.estadoExamen.preguntas.map((pregunta, index) => `
            <div class="efecto-vidrio-claro p-6 rounded-2xl" id="tarjeta-pregunta-${pregunta.id}">
                <p class="font-semibold mb-4">
                    Pregunta ${index + 1}/${this.estadoExamen.preguntas.length}
                </p>
                <div class="text-lg mb-4">${pregunta.texto}</div>
                
                ${pregunta.opciones ? this.generarHTMLOpciones(pregunta) : this.generarHTMLRespuestaAbierta(pregunta)}
                
                <div id="retroalimentacion-${pregunta.id}" class="mt-4 oculto"></div>
            </div>
        `).join('');
    },

    /**
     * Genera HTML para preguntas de opción múltiple
     * @param {Object} pregunta - Datos de la pregunta
     * @returns {string} HTML de opciones
     */
    generarHTMLOpciones(pregunta) {
        return `
            <div class="space-y-2">
                ${pregunta.opciones.map((opcion, idx) => `
                    <label class="flex items-center p-3 rounded-lg border border-light-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        <input type="radio" 
                               name="pregunta-${pregunta.id}" 
                               value="${opcion.valor}"
                               onchange="aplicacion.guardarRespuesta('${pregunta.id}', '${opcion.valor}')"
                               class="mr-3">
                        <span>${opcion.texto}</span>
                    </label>
                `).join('')}
            </div>
        `;
    },

    /**
     * Genera HTML para preguntas abiertas
     * @param {Object} pregunta - Datos de la pregunta
     * @returns {string} HTML de respuesta abierta
     */
    generarHTMLRespuestaAbierta(pregunta) {
        return `
            <div class="flex flex-col">
                <label for="respuesta-${pregunta.id}" class="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Escribe tu respuesta:
                </label>
                <math-field id="campo-matematico-${pregunta.id}" 
                           class="campo-matematico" 
                           placeholder="Escribe tu respuesta aquí..."
                           onfocus="aplicacion.establecerCampoMatematicoActivo('campo-matematico-${pregunta.id}', '${pregunta.id}')">
                </math-field>
            </div>
            <div class="mt-4 flex justify-between items-center">
                <div id="vista-previa-${pregunta.id}" class="p-3 bg-slate-200 dark:bg-slate-900 rounded-xl min-h-[50px] flex items-center"></div>
                <button onclick="aplicacion.revisarRespuesta('${pregunta.id}')" 
                        class="py-2 px-4 bg-primary/80 hover:bg-primary text-white rounded-md">
                    Revisar
                </button>
            </div>
        `;
    },

    /**
     * Configura campos matemáticos
     */
    configurarCamposMatematicos() {
        // Verificar si MathLive está disponible
        if (typeof MathLive !== 'undefined') {
            document.querySelectorAll('math-field').forEach(campo => {
                campo.addEventListener('input', (evento) => {
                    const preguntaId = evento.target.id.replace('campo-matematico-', '');
                    const vistaPrevia = document.getElementById(`vista-previa-${preguntaId}`);
                    if (vistaPrevia) {
                        vistaPrevia.innerHTML = evento.target.value;
                    }
                });
            });
        }
    },

    /**
     * Establece el campo matemático activo
     * @param {string} campoId - ID del campo
     * @param {string} preguntaId - ID de la pregunta
     */
    establecerCampoMatematicoActivo(campoId, preguntaId) {
        this.estado.campoMatematicoActivo = campoId;
        this.estado.preguntaActiva = preguntaId;
    },

    // ========== TEMPORIZADOR ==========

    /**
     * Inicia el temporizador del examen
     */
    iniciarTemporizador() {
        if (this.estadoExamen.temporizador) {
            clearInterval(this.estadoExamen.temporizador);
        }
        
        this.estadoExamen.temporizador = setInterval(() => {
            this.estadoExamen.tiempoRestante--;
            
            // Actualizar display
            const elemento = document.getElementById('temporizador-examen');
            if (elemento) {
                elemento.textContent = formatearTiempoRestante(this.estadoExamen.tiempoRestante);
            }
            
            // Cambiar color cuando quede poco tiempo
            if (this.estadoExamen.tiempoRestante <= 300) { // 5 minutos
                elemento?.classList.add('animate-pulse');
            }
            
            // Finalizar cuando el tiempo se agote
            if (this.estadoExamen.tiempoRestante <= 0) {
                this.finalizarExamen();
            }
        }, 1000);
    },

    /**
     * Pausa el temporizador
     */
    pausarTemporizador() {
        if (this.estadoExamen.temporizador) {
            clearInterval(this.estadoExamen.temporizador);
            this.estadoExamen.temporizador = null;
        }
    },

    /**
     * Reanuda el temporizador
     */
    reanudarTemporizador() {
        if (!this.estadoExamen.temporizador && !this.estadoExamen.completado) {
            this.iniciarTemporizador();
        }
    },

    // ========== MANEJO DE RESPUESTAS ==========

    /**
     * Guarda una respuesta
     * @param {string} preguntaId - ID de la pregunta
     * @param {string} respuesta - Respuesta del usuario
     */
    guardarRespuesta(preguntaId, respuesta) {
        if (!this.estadoExamen) return;
        
        this.estadoExamen.respuestas[preguntaId] = respuesta;
        
        // Marcar pregunta como respondida
        const tarjeta = document.getElementById(`tarjeta-pregunta-${preguntaId}`);
        if (tarjeta) {
            tarjeta.classList.add('border-green-500', 'border-2');
        }
    },

    /**
     * Revisa una respuesta
     * @param {string} preguntaId - ID de la pregunta
     */
    revisarRespuesta(preguntaId) {
        // En una implementación real, esto enviaría la respuesta al backend
        // Para demo, mostramos retroalimentación básica
        
        const campo = document.getElementById(`campo-matematico-${preguntaId}`);
        const retroalimentacion = document.getElementById(`retroalimentacion-${preguntaId}`);
        
        if (!campo || !retroalimentacion) return;
        
        const respuesta = campo.value;
        if (!respuesta.trim()) {
            mostrarRetroalimentacion(retroalimentacion, 'Por favor ingresa una respuesta', 'error');
            return;
        }
        
        // Guardar respuesta
        this.guardarRespuesta(preguntaId, respuesta);
        
        // Mostrar retroalimentación positiva
        mostrarRetroalimentacion(retroalimentacion, '¡Respuesta guardada!', 'success');
    },

    /**
     * Finaliza el examen
     */
    async finalizarExamen() {
        // Detener temporizador
        this.pausarTemporizador();
        
        // Confirmar si hay preguntas sin responder
        const preguntasSinResponder = this.estadoExamen.preguntas.filter(
            p => !this.estadoExamen.respuestas[p.id]
        ).length;
        
        if (preguntasSinResponder > 0) {
            const confirmar = confirm(`Tienes ${preguntasSinResponder} pregunta(s) sin responder. ¿Seguro que quieres finalizar?`);
            if (!confirmar) {
                this.reanudarTemporizador();
                return;
            }
        }
        
        try {
            // Enviar respuestas al backend
            const resultado = await servicioDatos.enviarExamen(
                this.estadoExamen.id,
                this.estadoExamen.respuestas
            );
            
            // Marcar como completado
            this.estadoExamen.completado = true;
            
            // Mostrar resultados
            this.mostrarResultadosExamen(resultado);
            
        } catch (error) {
            console.error('Error finalizando examen:', error);
            this.mostrarNotificacion('Error', 'No se pudo enviar el examen', 'error');
        }
    },

    /**
     * Muestra los resultados del examen
     * @param {Object} resultado - Resultados del examen
     */
    mostrarResultadosExamen(resultado) {
        const calificacion = resultado.calificacion || 0;
        const correctas = resultado.correctas || 0;
        const total = resultado.total || this.estadoExamen.preguntas.length;
        
        const modalHTML = `
        <div id="modal-resultados-examen" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 text-center transform transition-all scale-95 opacity-0 animar-modal-entrada">
                <h2 class="text-2xl font-bold mb-2">Resultados del Examen</h2>
                <div class="text-5xl font-bold my-6 ${calificacion >= 60 ? 'text-green-500' : 'text-red-500'}">
                    ${calificacion}%
                </div>
                <p class="text-lg mb-4">${correctas} de ${total} respuestas correctas</p>
                <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 my-6">
                    <div class="h-2.5 rounded-full ${calificacion >= 60 ? 'bg-green-500' : 'bg-red-500'}" 
                         style="width: ${calificacion}%"></div>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    ${calificacion >= 60 ? 
                        '¡Felicidades! Has aprobado el examen.' : 
                        'Necesitas estudiar más este tema.'}
                </p>
                <div class="flex space-x-4">
                    <button onclick="aplicacion.cerrarModal('modal-resultados-examen')" 
                            class="flex-1 py-2 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors">
                        Cerrar
                    </button>
                    <button onclick="aplicacion.revisarExamen()" 
                            class="flex-1 py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-lg transition-colors">
                        Revisar Respuestas
                    </button>
                </div>
            </div>
        </div>`;
        
        document.getElementById('contenedor-modales').innerHTML = modalHTML;
    },

    /**
     * Permite revisar las respuestas del examen
     */
    revisarExamen() {
        this.cerrarModal('modal-resultados-examen');
        
        // Modificar la vista para mostrar respuestas correctas
        this.estadoExamen.preguntas.forEach(pregunta => {
            const retroalimentacion = document.getElementById(`retroalimentacion-${pregunta.id}`);
            if (retroalimentacion) {
                mostrarOcultar(retroalimentacion, true);
                retroalimentacion.innerHTML = `
                    <div class="p-3 rounded-lg ${this.estadoExamen.respuestas[pregunta.id] === pregunta.respuestaCorrecta ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}">
                        <p class="font-semibold">${this.estadoExamen.respuestas[pregunta.id] === pregunta.respuestaCorrecta ? '✓ Correcta' : '✗ Incorrecta'}</p>
                        ${pregunta.respuestaCorrecta ? `<p class="mt-1">Respuesta correcta: ${pregunta.respuestaCorrecta}</p>` : ''}
                        ${pregunta.explicacion ? `<p class="mt-2 text-sm">${pregunta.explicacion}</p>` : ''}
                    </div>
                `;
            }
        });
    },

    // ========== MODO EXAMEN ==========

    /**
     * Activa el modo examen (previene copias)
     */
    activarModoExamen() {
        document.body.classList.add('modo-examen');
        
        // Prevenir clic derecho
        document.addEventListener('contextmenu', this.prevenirAccion);
        
        // Prevenir atajos de teclado
        document.addEventListener('keydown', this.prevenirAtajosTeclado);
        
        // Prevenir capturas de pantalla (limitado)
        document.addEventListener('visibilitychange', this.manejarCambioVisibilidad);
    },

    /**
     * Desactiva el modo examen
     */
    desactivarModoExamen() {
        document.body.classList.remove('modo-examen');
        
        // Remover event listeners
        document.removeEventListener('contextmenu', this.prevenirAccion);
        document.removeEventListener('keydown', this.prevenirAtajosTeclado);
        document.removeEventListener('visibilitychange', this.manejarCambioVisibilidad);
    },

    /**
     * Previene acciones no deseadas
     * @param {Event} evento - Evento a prevenir
     */
    prevenirAccion(evento) {
        evento.preventDefault();
        return false;
    },

    /**
     * Previene atajos de teclado
     * @param {KeyboardEvent} evento - Evento de teclado
     */
    prevenirAtajosTeclado(evento) {
        // Prevenir F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (evento.keyCode === 123 || // F12
            (evento.ctrlKey && evento.shiftKey && evento.keyCode === 73) || // Ctrl+Shift+I
            (evento.ctrlKey && evento.shiftKey && evento.keyCode === 74) || // Ctrl+Shift+J
            (evento.ctrlKey && evento.keyCode === 85)) { // Ctrl+U
            evento.preventDefault();
            return false;
        }
    },

    /**
     * Maneja cambios en la visibilidad de la página
     */
    manejarCambioVisibilidad() {
        if (document.hidden) {
            // El usuario cambió de pestaña
            alert('¡No cambies de pestaña durante el examen!');
        }
    },

    // ========== FUNCIONES AUXILIARES ==========

    /**
     * Muestra retroalimentación
     * @param {HTMLElement} elemento - Elemento donde mostrar
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de retroalimentación
     */
    mostrarRetroalimentacion(elemento, mensaje, tipo = 'info') {
        if (!elemento) return;
        
        const colores = {
            success: 'bg-green-500/20 text-green-700 border-green-500',
            error: 'bg-red-500/20 text-red-700 border-red-500',
            info: 'bg-blue-500/20 text-blue-700 border-blue-500'
        };
        
        elemento.innerHTML = `
            <div class="p-3 rounded-lg border ${colores[tipo]}">
                ${mensaje}
            </div>
        `;
        
        mostrarOcultar(elemento, true);
    },

    /**
     * Limpia el estado del examen
     */
    limpiarEstadoExamen() {
        this.estadoExamen = null;
        this.desactivarModoExamen();
    },

    /**
     * Obtiene el progreso del examen
     * @returns {number} Porcentaje de progreso
     */
    obtenerProgresoExamen() {
        if (!this.estadoExamen || this.estadoExamen.preguntas.length === 0) {
            return 0;
        }
        
        const respondidas = Object.keys(this.estadoExamen.respuestas).length;
        return (respondidas / this.estadoExamen.preguntas.length) * 100;
    }
};