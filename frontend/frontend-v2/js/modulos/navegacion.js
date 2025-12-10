import { NAVEGACION_POR_ROL, ICONOS_SVG } from '../utilidades/constantes.js';
import { servicioDatos } from './datos.js';
import { capitalizar } from '../utilidades/funciones-ayuda.js';

export const moduloNavegacion = {
    // ========== NAVEGACIÓN PRINCIPAL ==========

    /**
     * Navega a una página específica
     * @param {string} pagina - ID de la página
     * @param {Object} contexto - Contexto adicional
     */
    async navegarA(pagina, contexto = null) {
        // Guardar página anterior para posible retroceso
        if (this.estado.paginaActual) {
            this.estado.paginaAnterior = this.estado.paginaActual;
        }
        
        this.estado.paginaActual = pagina;
        
        // Cargar contexto si es necesario
        if (contexto) {
            await this.cargarContextoPagina(contexto);
        }
        
        // Renderizar la nueva página
        this.renderizar();
        
        // Scroll al inicio
        window.scrollTo(0, 0);
        
        // Cerrar menú móvil si está abierto
        this.cerrarMenuMovil();
    },

    /**
     * Carga el contexto de la página
     * @param {Object} contexto - Contexto de la página
     */
    async cargarContextoPagina(contexto) {
        if (contexto.materiaId) {
            try {
                const materias = await servicioDatos.obtenerTodasMaterias();
                this.estado.materiaActual = materias.find(m => m.id === contexto.materiaId);
            } catch (error) {
                console.error('Error cargando materia:', error);
                this.estado.materiaActual = null;
            }
        }
        
        if (contexto.examenId) {
            try {
                const examenes = await servicioDatos.obtenerTodosExamenes();
                this.estado.examenActual = examenes.find(e => e.id === contexto.examenId);
            } catch (error) {
                console.error('Error cargando examen:', error);
                this.estado.examenActual = null;
            }
        }
        
        if (contexto.recursoId) {
            try {
                const recursos = await servicioDatos.obtenerTodosRecursos();
                this.estado.recursoActual = recursos.find(r => r.id === contexto.recursoId);
            } catch (error) {
                console.error('Error cargando recurso:', error);
                this.estado.recursoActual = null;
            }
        }
        
        if (contexto.foroId) {
            try {
                const foros = await servicioDatos.obtenerTodosForos();
                this.estado.foroActual = foros.find(f => f.id === contexto.foroId);
            } catch (error) {
                console.error('Error cargando foro:', error);
                this.estado.foroActual = null;
            }
        }
    },

    /**
     * Navega a la página anterior
     */
    navegarAtras() {
        if (this.estado.paginaAnterior) {
            this.navegarA(this.estado.paginaAnterior);
        } else {
            this.navegarA('panel');
        }
    },

    // ========== RENDERIZADO DE NAVEGACIÓN ==========

    /**
     * Renderiza la navegación principal
     */
    renderizarNavegacion() {
        const rol = this.estado.usuarioActual?.rol || 'estudiante';
        const paginas = NAVEGACION_POR_ROL[rol] || [];
        
        // Renderizar navegación principal
        const navegacionHTML = this.generarHTMLNavegacion(paginas);
        document.getElementById('navegacion-principal').innerHTML = navegacionHTML;
        
        // Renderizar navegación móvil
        document.getElementById('navegacion-movil').innerHTML = navegacionHTML;
        
        // Renderizar materias del usuario si es estudiante
        if (rol === 'estudiante') {
            this.renderizarMateriasUsuario();
        }
    },

    /**
     * Genera el HTML de navegación
     * @param {Array} paginas - Lista de páginas
     * @returns {string} HTML generado
     */
    generarHTMLNavegacion(paginas) {
        return paginas.map(pagina => `
            <a href="#" 
               onclick="event.preventDefault(); aplicacion.navegarA('${pagina.id}')" 
               class="flex items-center p-3 rounded-lg transition-colors ${this.estado.paginaActual === pagina.id ? 'bg-primary/20 text-primary' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${ICONOS_SVG[pagina.icono] || ''}
                </svg>
                ${pagina.nombre}
            </a>
        `).join('');
    },

    /**
     * Renderiza las materias del usuario
     */
    async renderizarMateriasUsuario() {
        try {
            const materias = await servicioDatos.obtenerMateriasUsuario();
            
            if (materias && materias.length > 0) {
                // Mostrar sección de materias
                mostrarOcultar(document.getElementById('materias-usuario'), true);
                mostrarOcultar(document.getElementById('materias-usuario-movil'), true);
                
                // Generar HTML de materias
                const materiasHTML = this.generarHTMLMaterias(materias);
                document.getElementById('lista-materias-usuario').innerHTML = materiasHTML;
                document.getElementById('lista-materias-usuario-movil').innerHTML = materiasHTML;
            } else {
                mostrarOcultar(document.getElementById('materias-usuario'), false);
                mostrarOcultar(document.getElementById('materias-usuario-movil'), false);
            }
        } catch (error) {
            console.error('Error renderizando materias:', error);
            mostrarOcultar(document.getElementById('materias-usuario'), false);
            mostrarOcultar(document.getElementById('materias-usuario-movil'), false);
        }
    },

    /**
     * Genera el HTML de las materias
     * @param {Array} materias - Lista de materias
     * @returns {string} HTML generado
     */
    generarHTMLMaterias(materias) {
        return materias.map(materia => {
            const esMateriaActual = this.estado.paginaActual === 'materia' && 
                                   this.estado.materiaActual && 
                                   this.estado.materiaActual.id === materia.id;
            
            return `
                <a href="#" 
                   onclick="event.preventDefault(); aplicacion.navegarA('materia', {materiaId: '${materia.id}'})" 
                   class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${esMateriaActual ? 'bg-primary/20 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'}">
                    <span class="w-2 h-2 rounded-full ${this.obtenerColorProgreso(materia.progreso || 0)}"></span>
                    ${materia.nombre}
                </a>
            `;
        }).join('');
    },

    /**
     * Obtiene el color según el progreso
     * @param {number} progreso - Porcentaje de progreso
     * @returns {string} Clase de color
     */
    obtenerColorProgreso(progreso) {
        if (progreso > 70) return 'bg-green-500';
        if (progreso > 40) return 'bg-yellow-500';
        return 'bg-red-500';
    },

    // ========== MANEJO DE MENÚ MÓVIL ==========

    /**
     * Alterna la visibilidad del menú móvil
     */
    alternarMenuMovil() {
        const menu = document.getElementById('menu-movil');
        menu.classList.toggle('translate-x-0');
        menu.classList.toggle('-translate-x-full');
        
        // Bloquear scroll cuando el menú está abierto
        if (menu.classList.contains('translate-x-0')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    },

    /**
     * Cierra el menú móvil
     */
    cerrarMenuMovil() {
        const menu = document.getElementById('menu-movil');
        menu.classList.remove('translate-x-0');
        menu.classList.add('-translate-x-full');
        document.body.style.overflow = 'auto';
    },

    /**
     * Configura los eventos del menú móvil
     */
    configurarMenuMovil() {
        const botonMenu = document.getElementById('boton-menu-movil');
        const botonCerrar = document.getElementById('cerrar-menu-movil');
        
        if (botonMenu) {
            botonMenu.addEventListener('click', () => this.alternarMenuMovil());
        }
        
        if (botonCerrar) {
            botonCerrar.addEventListener('click', () => this.cerrarMenuMovil());
        }
        
        // Cerrar menú al hacer clic en un enlace
        document.addEventListener('click', (evento) => {
            const menu = document.getElementById('menu-movil');
            const esEnlaceMenu = evento.target.closest('#navegacion-movil a');
            
            if (esEnlaceMenu && menu.classList.contains('translate-x-0')) {
                this.cerrarMenuMovil();
            }
        });
    },

    // ========== BREADCRUMBS ==========

    /**
     * Genera breadcrumbs para la página actual
     * @returns {Array} Array de breadcrumbs
     */
    generarBreadcrumbs() {
        const breadcrumbs = [];
        const rol = this.estado.usuarioActual?.rol || 'estudiante';
        
        // Página principal
        breadcrumbs.push({ nombre: 'Inicio', ruta: 'panel' });
        
        // Página actual
        if (this.estado.paginaActual !== 'panel') {
            const paginas = NAVEGACION_POR_ROL[rol] || [];
            const paginaActual = paginas.find(p => p.id === this.estado.paginaActual);
            
            if (paginaActual) {
                breadcrumbs.push({ 
                    nombre: paginaActual.nombre, 
                    ruta: this.estado.paginaActual 
                });
            }
            
            // Contexto adicional
            if (this.estado.materiaActual) {
                breadcrumbs.push({ 
                    nombre: this.estado.materiaActual.titulo, 
                    ruta: null 
                });
            }
        }
        
        return breadcrumbs;
    },

    /**
     * Renderiza los breadcrumbs
     * @returns {string} HTML de breadcrumbs
     */
    renderizarBreadcrumbs() {
        const breadcrumbs = this.generarBreadcrumbs();
        
        if (breadcrumbs.length <= 1) return '';
        
        return `
            <nav class="flex mb-4" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-3">
                    ${breadcrumbs.map((bc, index) => `
                        <li class="inline-flex items-center">
                            ${index > 0 ? `
                                <svg class="w-3 h-3 mx-1 text-slate-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            ` : ''}
                            ${bc.ruta ? `
                                <a href="#" 
                                   onclick="event.preventDefault(); aplicacion.navegarA('${bc.ruta}')" 
                                   class="inline-flex items-center text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-400 dark:hover:text-white">
                                    ${bc.nombre}
                                </a>
                            ` : `
                                <span class="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    ${bc.nombre}
                                </span>
                            `}
                        </li>
                    `).join('')}
                </ol>
            </nav>
        `;
    },

    // ========== HISTORIAL DE NAVEGACIÓN ==========

    /**
     * Agrega una página al historial
     * @param {string} pagina - ID de la página
     */
    agregarAlHistorial(pagina) {
        if (!this.estado.historial) {
            this.estado.historial = [];
        }
        
        // Evitar duplicados consecutivos
        if (this.estado.historial[this.estado.historial.length - 1] !== pagina) {
            this.estado.historial.push(pagina);
            
            // Limitar historial a 10 páginas
            if (this.estado.historial.length > 10) {
                this.estado.historial.shift();
            }
        }
    },

    /**
     * Obtiene el historial de navegación
     * @returns {Array} Historial de páginas
     */
    obtenerHistorial() {
        return this.estado.historial || [];
    },

    /**
     * Limpia el historial de navegación
     */
    limpiarHistorial() {
        this.estado.historial = [];
    }
};