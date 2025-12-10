import { servicioDatos } from './datos.js';
import { formatearFecha, sanitizarTexto } from '../utilidades/funciones-ayuda.js';

export const moduloForos = {
    // ========== OBTENCIÓN DE FOROS ==========

    /**
     * Obtiene todos los foros
     * @param {boolean} forzarActualizacion - Forzar actualización de cache
     * @returns {Promise<Array>} Lista de foros
     */
    async obtenerForos(forzarActualizacion = false) {
        try {
            return await servicioDatos.obtenerTodosForos(forzarActualizacion);
        } catch (error) {
            console.error('Error obteniendo foros:', error);
            throw error;
        }
    },

    /**
     * Renderiza la página de foros
     */
    async renderizarPaginaForos() {
        try {
            const foros = await this.obtenerForos();
            
            const html = this.generarHTMLForos(foros);
            document.getElementById('contenido-principal').innerHTML = html;
            
            // Configurar formulario de nuevo tema
            this.configurarFormularioNuevoTema();
            
        } catch (error) {
            console.error('Error renderizando foros:', error);
            document.getElementById('contenido-principal').innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-500">Error al cargar el foro.</p>
                </div>
            `;
        }
    },

    /**
     * Genera HTML para la página de foros
     * @param {Array} foros - Lista de foros
     * @returns {string} HTML generado
     */
    generarHTMLForos(foros) {
        return `
            <div class="pagina activa">
                <h1 class="text-3xl font-bold mb-2">Foro de Ayuda</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">
                    Comparte dudas y soluciones con otros estudiantes.
                </p>
                
                <div class="efecto-vidrio-claro p-6 rounded-2xl mb-8">
                    <h2 class="text-xl font-bold mb-4">Temas de Discusión</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${foros.map(foro => this.generarHTMLTarjetaForo(foro)).join('')}
                    </div>
                </div>
                
                <div class="efecto-vidrio-claro p-6 rounded-2xl">
                    <h2 class="text-xl font-bold mb-4">Crear Nuevo Tema</h2>
                    <form id="formulario-nuevo-tema">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Título
                            </label>
                            <input type="text" 
                                   id="titulo-tema" 
                                   class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" 
                                   placeholder="¿Cuál es tu pregunta?" 
                                   required>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Materia
                            </label>
                            <select id="materia-tema" 
                                    class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" 
                                    required>
                                <option value="">Selecciona una materia</option>
                                <!-- Las materias se cargarán dinámicamente -->
                            </select>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Pregunta
                            </label>
                            <textarea id="contenido-tema" 
                                      rows="4" 
                                      class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" 
                                      placeholder="Describe tu duda con detalle..." 
                                      required></textarea>
                        </div>
                        
                        <button type="submit" 
                                class="w-full py-3 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition-transform transform hover:scale-105">
                            Publicar Pregunta
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Genera HTML para tarjeta de foro
     * @param {Object} foro - Datos del foro
     * @returns {string} HTML generado
     */
    generarHTMLTarjetaForo(foro) {
        return `
            <div class="post-foro p-4 rounded-xl cursor-pointer hover:bg-primary/5" 
                 onclick="aplicacion.navegarA('foro-tema', {foroId: '${foro.id}'})">
                <h3 class="font-semibold">${foro.titulo}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    ${foro.materiaNombre || 'General'} • ${foro.cantidadRespuestas || 0} respuestas
                </p>
            </div>
        `;
    },

    // ========== FORMULARIO DE NUEVO TEMA ==========

    /**
     * Configura el formulario de nuevo tema
     */
    async configurarFormularioNuevoTema() {
        const formulario = document.getElementById('formulario-nuevo-tema');
        if (!formulario) return;
        
        // Cargar materias
        await this.cargarMateriasParaForo();
        
        formulario.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            await this.crearNuevoTema();
        });
    },

    /**
     * Carga materias para el selector del foro
     */
    async cargarMateriasParaForo() {
        try {
            const selector = document.getElementById('materia-tema');
            if (!selector) return;
            
            // Primero intentar con materias del usuario
            try {
                const materiasUsuario = await servicioDatos.obtenerMateriasUsuario();
                if (materiasUsuario.length > 0) {
                    selector.innerHTML = `
                        <option value="">Selecciona una materia</option>
                        ${materiasUsuario.map(materia => 
                            `<option value="${materia.id}">${materia.nombre}</option>`
                        ).join('')}
                    `;
                    return;
                }
            } catch (error) {
                console.error('Error cargando materias del usuario:', error);
            }
            
            // Si no hay materias del usuario, cargar todas
            const todasMaterias = await servicioDatos.obtenerTodasMaterias();
            if (todasMaterias.length > 0) {
                selector.innerHTML = `
                    <option value="">Selecciona una materia</option>
                    ${todasMaterias.map(materia => 
                        `<option value="${materia.id}">${materia.titulo}</option>`
                    ).join('')}
                `;
            }
            
        } catch (error) {
            console.error('Error cargando materias para foro:', error);
        }
    },

    /**
     * Crea un nuevo tema
     */
    async crearNuevoTema() {
        const titulo = document.getElementById('titulo-tema')?.value;
        const materiaId = document.getElementById('materia-tema')?.value;
        const contenido = document.getElementById('contenido-tema')?.value;
        
        // Validaciones
        if (!titulo?.trim() || !materiaId || !contenido?.trim()) {
            this.mostrarNotificacion('Error', 'Por favor completa todos los campos', 'error');
            return;
        }
        
        // Sanitizar contenido
        const tituloSanitizado = sanitizarTexto(titulo);
        const contenidoSanitizado = sanitizarTexto(contenido);
        
        try {
            this.mostrarCarga(true);
            
            const datosTema = {
                titulo: tituloSanitizado,
                materiaId,
                contenido: contenidoSanitizado,
                autor: this.estado.usuarioActual.nombre
            };
            
            const resultado = await servicioDatos.crearTemaForo(datosTema);
            
            if (resultado.exito) {
                // Limpiar formulario
                document.getElementById('formulario-nuevo-tema').reset();
                
                // Mostrar éxito
                this.mostrarModalExito('Tema creado', 'Tu pregunta ha sido publicada en el foro.');
                
                // Actualizar cache y renderizar
                servicioDatos.actualizarCache('foros', null);
                this.renderizarPaginaForos();
            } else {
                this.mostrarNotificacion('Error', resultado.mensaje || 'No se pudo crear el tema', 'error');
            }
            
        } catch (error) {
            console.error('Error creando tema:', error);
            this.mostrarNotificacion('Error', 'No se pudo crear el tema', 'error');
        } finally {
            this.mostrarCarga(false);
        }
    },

    // ========== TEMA ESPECÍFICO ==========

    /**
     * Renderiza un tema específico del foro
     * @param {string} foroId - ID del foro
     */
    async renderizarTemaForo(foroId) {
        try {
            const [tema, foros] = await Promise.all([
                servicioDatos.obtenerTemaForo(foroId),
                this.obtenerForos()
            ]);
            
            const foroOriginal = foros.find(f => f.id === foroId);
            
            const html = this.generarHTMLTemaForo(tema, foroOriginal);
            document.getElementById('contenido-principal').innerHTML = html;
            
            // Configurar formulario de respuesta
            this.configurarFormularioRespuesta(foroId);
            
        } catch (error) {
            console.error('Error renderizando tema:', error);
            document.getElementById('contenido-principal').innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-500">Error al cargar el tema.</p>
                </div>
            `;
        }
    },

    /**
     * Genera HTML para un tema específico
     * @param {Object} tema - Datos del tema
     * @param {Object} foroOriginal - Datos del foro original
     * @returns {string} HTML generado
     */
    generarHTMLTemaForo(tema, foroOriginal) {
        return `
            <div class="pagina activa">
                <button onclick="aplicacion.navegarA('foro')" 
                        class="flex items-center text-sm text-primary mb-4 hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al Foro
                </button>
                
                <h1 class="text-3xl font-bold mb-2">${foroOriginal?.titulo || tema.titulo}</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">
                    ${foroOriginal?.materiaNombre || 'General'} • 
                    ${tema.posts?.length || 0} respuestas
                </p>
                
                <!-- Pregunta original -->
                <div class="efecto-vidrio-claro p-6 rounded-2xl mb-6">
                    <div class="flex items-start mb-4">
                        <div class="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold mr-3">
                            ${tema.autor?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h3 class="font-semibold">${tema.autor || 'Usuario'}</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400">
                                ${formatearFecha(tema.fecha || new Date())}
                            </p>
                        </div>
                    </div>
                    <div class="prose dark:prose-invert max-w-none">
                        ${tema.contenido || 'Contenido no disponible.'}
                    </div>
                </div>
                
                <!-- Respuestas -->
                <h2 class="text-2xl font-bold mb-4">Respuestas (${tema.posts?.length || 0})</h2>
                
                <div id="lista-respuestas" class="space-y-4 mb-8">
                    ${tema.posts?.map(post => this.generarHTMLRespuesta(post)).join('') || 
                      '<p class="text-slate-500 text-center py-8">No hay respuestas aún. ¡Sé el primero en responder!</p>'}
                </div>
                
                <!-- Formulario de respuesta -->
                <div class="efecto-vidrio-claro p-6 rounded-2xl">
                    <h3 class="text-lg font-bold mb-4">Tu Respuesta</h3>
                    <form id="formulario-respuesta">
                        <div class="mb-4">
                            <textarea id="contenido-respuesta" 
                                      rows="4" 
                                      class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" 
                                      placeholder="Escribe tu respuesta aquí..." 
                                      required></textarea>
                        </div>
                        <button type="submit" 
                                class="py-2 px-6 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg">
                            Publicar Respuesta
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Genera HTML para una respuesta
     * @param {Object} respuesta - Datos de la respuesta
     * @returns {string} HTML generado
     */
    generarHTMLRespuesta(respuesta) {
        return `
            <div class="post-foro efecto-vidrio-claro p-6 rounded-xl">
                <div class="flex items-start mb-4">
                    <div class="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold mr-3">
                        ${respuesta.autor?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h3 class="font-semibold">${respuesta.autor || 'Usuario'}</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            ${formatearFecha(respuesta.fecha || new Date())}
                        </p>
                    </div>
                </div>
                <div class="prose dark:prose-invert max-w-none">
                    ${respuesta.contenido || ''}
                </div>
                
                ${respuesta.esMejorRespuesta ? `
                    <div class="mt-4 flex items-center text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm font-semibold">Mejor Respuesta</span>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Configura el formulario de respuesta
     * @param {string} foroId - ID del foro
     */
    configurarFormularioRespuesta(foroId) {
        const formulario = document.getElementById('formulario-respuesta');
        if (!formulario) return;
        
        formulario.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            await this.crearRespuesta(foroId);
        });
    },

    /**
     * Crea una respuesta
     * @param {string} foroId - ID del foro
     */
    async crearRespuesta(foroId) {
        const contenido = document.getElementById('contenido-respuesta')?.value;
        
        if (!contenido?.trim()) {
            this.mostrarNotificacion('Error', 'Por favor escribe una respuesta', 'error');
            return;
        }
        
        const contenidoSanitizado = sanitizarTexto(contenido);
        
        try {
            this.mostrarCarga(true);
            
            // En una implementación real, esto enviaría al endpoint de respuestas
            const respuesta = {
                id: `resp-${Date.now()}`,
                autor: this.estado.usuarioActual.nombre,
                contenido: contenidoSanitizado,
                fecha: new Date().toISOString(),
                esMejorRespuesta: false
            };
            
            // Actualizar UI
            const lista = document.getElementById('lista-respuestas');
            if (lista) {
                const htmlRespuesta = this.generarHTMLRespuesta(respuesta);
                
                // Si no hay respuestas, reemplazar mensaje
                if (lista.innerHTML.includes('No hay respuestas')) {
                    lista.innerHTML = htmlRespuesta;
                } else {
                    lista.insertAdjacentHTML('beforeend', htmlRespuesta);
                }
                
                // Limpiar formulario
                formulario.reset();
                
                // Mostrar éxito
                this.mostrarNotificacion('Éxito', 'Tu respuesta ha sido publicada', 'success');
                
                // Desplazar a la nueva respuesta
                setTimeout(() => {
                    const ultimaRespuesta = lista.lastElementChild;
                    ultimaRespuesta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    agregarClaseTemporal(ultimaRespuesta, 'bg-primary/10');
                }, 100);
            }
            
        } catch (error) {
            console.error('Error creando respuesta:', error);
            this.mostrarNotificacion('Error', 'No se pudo publicar la respuesta', 'error');
        } finally {
            this.mostrarCarga(false);
        }
    },

    // ========== BÚSQUEDA EN FOROS ==========

    /**
     * Configura búsqueda en foros
     */
    configurarBusquedaForos() {
        const inputBusqueda = document.getElementById('buscar-foros');
        if (!inputBusqueda) return;
        
        inputBusqueda.addEventListener('input', (evento) => {
            const termino = evento.target.value.toLowerCase();
            
            document.querySelectorAll('.tarjeta-foro').forEach(tarjeta => {
                const titulo = tarjeta.querySelector('h3')?.textContent.toLowerCase() || '';
                const contenido = tarjeta.querySelector('p')?.textContent.toLowerCase() || '';
                
                if (titulo.includes(termino) || contenido.includes(termino)) {
                    mostrarOcultar(tarjeta, true);
                } else {
                    mostrarOcultar(tarjeta, false);
                }
            });
        });
    }
};