import { servicioDatos } from './datos.js';
import { formatearMoneda, mostrarOcultar } from '../utilidades/funciones-ayuda.js';

export const moduloRecursos = {
    // ========== OBTENCIÓN DE RECURSOS ==========

    /**
     * Obtiene todos los recursos disponibles
     * @param {boolean} forzarActualizacion - Forzar actualización de cache
     * @returns {Promise<Array>} Lista de recursos
     */
    async obtenerRecursos(forzarActualizacion = false) {
        try {
            return await servicioDatos.obtenerTodosRecursos(forzarActualizacion);
        } catch (error) {
            console.error('Error obteniendo recursos:', error);
            throw error;
        }
    },

    /**
     * Obtiene los recursos comprados por el usuario
     * @returns {Promise<Array>} Recursos comprados
     */
    async obtenerRecursosComprados() {
        try {
            return await servicioDatos.obtenerRecursosComprados();
        } catch (error) {
            console.error('Error obteniendo recursos comprados:', error);
            return [];
        }
    },

    /**
     * Renderiza la página de recursos
     */
    async renderizarPaginaRecursos() {
        try {
            const [recursos, recursosComprados] = await Promise.all([
                this.obtenerRecursos(),
                this.obtenerRecursosComprados()
            ]);
            
            const idsComprados = recursosComprados.map(r => r.id);
            
            const html = this.generarHTMLRecursos(recursos, idsComprados);
            document.getElementById('contenido-principal').innerHTML = html;
            
            // Configurar filtros y búsqueda
            this.configurarFiltrosRecursos();
            
        } catch (error) {
            console.error('Error renderizando recursos:', error);
            document.getElementById('contenido-principal').innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-500">Error al cargar los recursos.</p>
                </div>
            `;
        }
    },

    /**
     * Genera HTML para la página de recursos
     * @param {Array} recursos - Lista de recursos
     * @param {Array} idsComprados - IDs de recursos comprados
     * @returns {string} HTML generado
     */
    generarHTMLRecursos(recursos, idsComprados) {
        return `
            <div class="pagina activa">
                <h1 class="text-3xl font-bold mb-2">Recursos de la Comunidad</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">
                    Apuntes, guías y exámenes compartidos por otros estudiantes.
                </p>
                
                <div class="flex flex-col md:flex-row gap-4 mb-8">
                    <div class="relative flex-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" id="buscar-recursos" 
                               placeholder="Buscar recursos..." 
                               class="w-full p-3 pl-12 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                    </div>
                    <select id="filtrar-materia" 
                            class="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                        <option value="todas">Todas las materias</option>
                        ${this.obtenerOpcionesMaterias(recursos)}
                    </select>
                    <select id="filtrar-tipo" 
                            class="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                        <option value="todos">Todos los tipos</option>
                        <option value="pdf">Guías/Resúmenes</option>
                        <option value="examen">Exámenes</option>
                        <option value="formula">Formularios</option>
                    </select>
                </div>
                
                <div id="grid-recursos" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${recursos.map(recurso => 
                        this.generarHTMLTarjetaRecurso(recurso, idsComprados.includes(recurso.id) || recurso.gratis)
                    ).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Genera opciones de materias para filtro
     * @param {Array} recursos - Lista de recursos
     * @returns {string} HTML de opciones
     */
    obtenerOpcionesMaterias(recursos) {
        const materias = [...new Set(recursos.map(r => r.materiaNombre).filter(Boolean))];
        return materias.map(materia => 
            `<option value="${materia.toLowerCase()}">${materia}</option>`
        ).join('');
    },

    /**
     * Genera HTML para una tarjeta de recurso
     * @param {Object} recurso - Datos del recurso
     * @param {boolean} esComprado - Si ya fue comprado
     * @returns {string} HTML de tarjeta
     */
    generarHTMLTarjetaRecurso(recurso, esComprado) {
        return `
            <div class="tarjeta-recurso efecto-vidrio-claro p-6 rounded-2xl flex flex-col" 
                 data-titulo="${recurso.titulo.toLowerCase()}" 
                 data-materia="${(recurso.materiaNombre || '').toLowerCase()}" 
                 data-tipo="${recurso.tipo}">
                
                <span class="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full self-start">
                    ${recurso.materiaNombre || 'General'}
                </span>
                
                <h3 class="text-xl font-bold mt-3">${recurso.titulo}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">Por: ${recurso.autor}</p>
                
                <div class="flex items-center my-3">
                    <div class="flex text-yellow-400">
                        ${this.generarEstrellas(recurso.calificacion || 0)}
                    </div>
                    <span class="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        (${(recurso.calificacion || 0).toFixed(1)})
                    </span>
                </div>
                
                <p class="text-2xl font-bold mb-4">
                    ${recurso.gratis ? 'Gratuito' : formatearMoneda(recurso.precio)}
                </p>
                
                <div class="flex-grow"></div>
                
                <div class="flex space-x-2 mt-4">
                    <button onclick="aplicacion.mostrarVistaPreviaRecurso('${recurso.id}')" 
                            class="flex-1 text-center py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-lg transition-all">
                        Vista Previa
                    </button>
                    
                    ${esComprado ? this.generarBotonDescargar(recurso) : this.generarBotonComprar(recurso)}
                </div>
            </div>
        `;
    },

    /**
     * Genera estrellas de calificación
     * @param {number} calificacion - Calificación (0-5)
     * @returns {string} HTML de estrellas
     */
    generarEstrellas(calificacion) {
        const estrellas = [];
        for (let i = 1; i <= 5; i++) {
            estrellas.push(`
                <svg xmlns="http://www.w3.org/2000/svg" 
                     class="h-4 w-4 ${i <= Math.round(calificacion) ? 'fill-current' : ''}" 
                     viewBox="0 0 20 20" 
                     fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            `);
        }
        return estrellas.join('');
    },

    /**
     * Genera botón de descargar
     * @param {Object} recurso - Datos del recurso
     * @returns {string} HTML del botón
     */
    generarBotonDescargar(recurso) {
        return `
            <button onclick="aplicacion.descargarRecurso('${recurso.id}')" 
                    class="flex-1 text-center py-2 px-4 bg-slate-200 dark:bg-slate-700 text-slate-500 font-semibold rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                ${recurso.gratis ? 'Descargar' : 'Descargar'}
            </button>
        `;
    },

    /**
     * Genera botón de comprar
     * @param {Object} recurso - Datos del recurso
     * @returns {string} HTML del botón
     */
    generarBotonComprar(recurso) {
        return `
            <button onclick="aplicacion.mostrarModalCompra('${recurso.id}')" 
                    class="flex-1 text-center py-2 px-4 bg-secondary/80 hover:bg-secondary text-white font-semibold rounded-lg transition-all">
                Comprar
            </button>
        `;
    },

    // ========== FILTROS Y BÚSQUEDA ==========

    /**
     * Configura los filtros de recursos
     */
    configurarFiltrosRecursos() {
        const buscarInput = document.getElementById('buscar-recursos');
        const filtrarMateria = document.getElementById('filtrar-materia');
        const filtrarTipo = document.getElementById('filtrar-tipo');
        
        if (!buscarInput || !filtrarMateria || !filtrarTipo) return;
        
        const filtrarRecursos = () => {
            const terminoBusqueda = buscarInput.value.toLowerCase();
            const materiaSeleccionada = filtrarMateria.value;
            const tipoSeleccionado = filtrarTipo.value;
            
            document.querySelectorAll('.tarjeta-recurso').forEach(tarjeta => {
                const titulo = tarjeta.dataset.titulo;
                const materia = tarjeta.dataset.materia;
                const tipo = tarjeta.dataset.tipo;
                
                const coincideBusqueda = titulo.includes(terminoBusqueda);
                const coincideMateria = materiaSeleccionada === 'todas' || materia === materiaSeleccionada;
                const coincideTipo = tipoSeleccionado === 'todos' || tipo === tipoSeleccionado;
                
                if (coincideBusqueda && coincideMateria && coincideTipo) {
                    mostrarOcultar(tarjeta, true);
                } else {
                    mostrarOcultar(tarjeta, false);
                }
            });
        };
        
        buscarInput.addEventListener('keyup', filtrarRecursos);
        filtrarMateria.addEventListener('change', filtrarRecursos);
        filtrarTipo.addEventListener('change', filtrarRecursos);
    },

    // ========== COMPRA Y DESCARGA ==========

    /**
     * Muestra modal de compra
     * @param {string} recursoId - ID del recurso
     */
    async mostrarModalCompra(recursoId) {
        try {
            const recursos = await this.obtenerRecursos();
            const recurso = recursos.find(r => r.id === recursoId);
            
            if (!recurso) {
                this.mostrarNotificacion('Error', 'Recurso no encontrado', 'error');
                return;
            }
            
            const modalHTML = `
            <div id="modal-compra" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 transform transition-all scale-95 opacity-0 animar-modal-entrada">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold">Comprar Recurso</h3>
                        <button onclick="aplicacion.cerrarModal('modal-compra')" 
                                class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="font-semibold mb-2">${recurso.titulo}</h4>
                        <p class="text-2xl font-bold text-primary">${formatearMoneda(recurso.precio)}</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Método de Pago
                            </label>
                            <select class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                                <option>Tarjeta de Crédito/Débito</option>
                                <option>PayPal</option>
                                <option>Transferencia Bancaria</option>
                            </select>
                        </div>
                        
                        <button onclick="aplicacion.comprarRecurso('${recurso.id}')" 
                                class="w-full py-3 bg-secondary/80 hover:bg-secondary text-white font-bold rounded-lg transition-transform transform hover:scale-105">
                            Pagar Ahora
                        </button>
                    </div>
                </div>
            </div>`;
            
            document.getElementById('contenedor-modales').innerHTML = modalHTML;
            
        } catch (error) {
            console.error('Error mostrando modal de compra:', error);
            this.mostrarNotificacion('Error', 'No se pudo cargar la información del recurso', 'error');
        }
    },

    /**
     * Compra un recurso
     * @param {string} recursoId - ID del recurso
     */
    async comprarRecurso(recursoId) {
        try {
            this.mostrarCarga(true);
            
            const resultado = await servicioDatos.comprarRecurso(recursoId);
            
            this.cerrarModal('modal-compra');
            
            if (resultado.exito) {
                this.mostrarModalExito('Compra exitosa', 'El recurso se ha añadido a tu biblioteca.');
                
                // Actualizar cache y renderizar
                servicioDatos.actualizarCache('recursos', null);
                this.renderizarPaginaRecursos();
            } else {
                this.mostrarNotificacion('Error', resultado.mensaje || 'No se pudo completar la compra', 'error');
            }
            
        } catch (error) {
            console.error('Error comprando recurso:', error);
            this.mostrarNotificacion('Error', 'No se pudo completar la compra', 'error');
        } finally {
            this.mostrarCarga(false);
        }
    },

    /**
     * Descarga un recurso
     * @param {string} recursoId - ID del recurso
     */
    async descargarRecurso(recursoId) {
        try {
            this.mostrarCarga(true);
            
            const resultado = await servicioDatos.descargarRecurso(recursoId);
            
            if (resultado.exito && resultado.url) {
                // Simular descarga (en producción sería un link real)
                const link = document.createElement('a');
                link.href = resultado.url;
                link.download = resultado.nombre || 'recurso';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.mostrarNotificacion('Descarga iniciada', 'El recurso se está descargando', 'success');
            } else {
                this.mostrarNotificacion('Error', 'No se pudo descargar el recurso', 'error');
            }
            
        } catch (error) {
            console.error('Error descargando recurso:', error);
            this.mostrarNotificacion('Error', 'No se pudo descargar el recurso', 'error');
        } finally {
            this.mostrarCarga(false);
        }
    },

    // ========== VISTA PREVIA ==========

    /**
     * Muestra vista previa de un recurso
     * @param {string} recursoId - ID del recurso
     */
    async mostrarVistaPreviaRecurso(recursoId) {
        try {
            const recursos = await this.obtenerRecursos();
            const recurso = recursos.find(r => r.id === recursoId);
            
            if (!recurso) {
                this.mostrarNotificacion('Error', 'Recurso no encontrado', 'error');
                return;
            }
            
            const modalHTML = `
            <div id="modal-vista-previa" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div class="bg-light-card dark:bg-dark-card w-full max-w-4xl rounded-2xl transform transition-all scale-95 opacity-0 animar-modal-entrada max-h-[80vh] overflow-hidden">
                    <div class="flex justify-between items-center p-6 border-b border-light-border dark:border-dark-border">
                        <h3 class="text-xl font-bold">Vista Previa: ${recurso.titulo}</h3>
                        <button onclick="aplicacion.cerrarModal('modal-vista-previa')" 
                                class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="p-6">
                        <div class="visor-pdf" id="vista-previa-pdf">
                            <div class="text-center py-12">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p class="text-slate-500 dark:text-slate-400">Vista previa del recurso</p>
                                <button onclick="aplicacion.descargarRecurso('${recurso.id}')" 
                                        class="mt-4 py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-md">
                                    ${recurso.gratis ? 'Descargar Completo' : 'Comprar para Descargar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            
            document.getElementById('contenedor-modales').innerHTML = modalHTML;
            
        } catch (error) {
            console.error('Error mostrando vista previa:', error);
            this.mostrarNotificacion('Error', 'No se pudo cargar la vista previa', 'error');
        }
    },

    // ========== RECURSOS DEL CREADOR ==========

    /**
     * Renderiza la página de recursos del creador
     */
    async renderizarRecursosCreador() {
        if (this.estado.usuarioActual?.rol !== 'creador') {
            this.mostrarNotificacion('Acceso denegado', 'No tienes permisos para acceder a esta sección', 'error');
            this.navegarA('panel');
            return;
        }
        
        try {
            const recursos = await this.obtenerRecursos();
            const misRecursos = recursos.filter(r => r.autor === this.estado.usuarioActual.nombre);
            
            const html = this.generarHTMLRecursosCreador(misRecursos);
            document.getElementById('contenido-principal').innerHTML = html;
            
        } catch (error) {
            console.error('Error renderizando recursos del creador:', error);
            document.getElementById('contenido-principal').innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-500">Error al cargar tus recursos.</p>
                </div>
            `;
        }
    },

    /**
     * Genera HTML para recursos del creador
     * @param {Array} recursos - Recursos del creador
     * @returns {string} HTML generado
     */
    generarHTMLRecursosCreador(recursos) {
        return `
            <div class="pagina activa">
                <h1 class="text-3xl font-bold mb-2">Mis Recursos</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">
                    Gestiona los recursos que has publicado.
                </p>
                
                <button onclick="aplicacion.mostrarModalNuevoRecurso()" 
                        class="mb-6 py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Crear Nuevo Recurso
                </button>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${recursos.map(recurso => this.generarHTMLRecursoCreador(recurso)).join('')}
                    
                    ${recursos.length === 0 ? `
                        <div class="col-span-3 text-center py-12 text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>Aún no has publicado ningún recurso.</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Genera HTML para un recurso del creador
     * @param {Object} recurso - Datos del recurso
     * @returns {string} HTML generado
     */
    generarHTMLRecursoCreador(recurso) {
        return `
            <div class="efecto-vidrio-claro p-6 rounded-2xl flex flex-col">
                <span class="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full self-start">
                    ${recurso.materiaNombre || 'General'}
                </span>
                
                <h3 class="text-xl font-bold mt-3">${recurso.titulo}</h3>
                
                <div class="flex items-center my-3">
                    <div class="flex text-yellow-400">
                        ${this.generarEstrellas(recurso.calificacion || 0)}
                    </div>
                    <span class="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        (${(recurso.calificacion || 0).toFixed(1)})
                    </span>
                </div>
                
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    ${recurso.ventas || 0} ventas • ${recurso.cantidadResenas || 0} reseñas
                </p>
                
                <div class="flex space-x-2 mt-4">
                    <button onclick="aplicacion.mostrarModalEditarRecurso('${recurso.id}')" 
                            class="flex-1 py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-md">
                        Editar
                    </button>
                    <button onclick="aplicacion.eliminarRecurso('${recurso.id}')" 
                            class="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-md">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }
};