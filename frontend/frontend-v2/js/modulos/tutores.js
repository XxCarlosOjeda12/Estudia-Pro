import { servicioDatos } from './datos.js';
import { formatearMoneda, formatearFecha } from '../utilidades/funciones-ayuda.js';

export const moduloTutores = {
    // ========== OBTENCIÓN DE TUTORES ==========

    /**
     * Obtiene todos los tutores disponibles
     * @param {boolean} forzarActualizacion - Forzar actualización de cache
     * @returns {Promise<Array>} Lista de tutores
     */
    async obtenerTutores(forzarActualizacion = false) {
        try {
            return await servicioDatos.obtenerTodosTutores(forzarActualizacion);
        } catch (error) {
            console.error('Error obteniendo tutores:', error);
            throw error;
        }
    },

    /**
     * Renderiza la página de tutorías
     */
    async renderizarPaginaTutorias() {
        const rol = this.estado.usuarioActual?.rol;
        
        if (rol === 'creador') {
            await this.renderizarTutoriasCreador();
        } else {
            await this.renderizarTutoriasEstudiante();
        }
    },

    /**
     * Renderiza tutorías para estudiantes
     */
    async renderizarTutoriasEstudiante() {
        try {
            const tutores = await this.obtenerTutores();
            
            const html = this.generarHTMLTutoriasEstudiante(tutores);
            document.getElementById('contenido-principal').innerHTML = html;
            
        } catch (error) {
            console.error('Error renderizando tutorías:', error);
            document.getElementById('contenido-principal').innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-500">Error al cargar las tutorías.</p>
                </div>
            `;
        }
    },

    /**
     * Genera HTML para tutorías de estudiante
     * @param {Array} tutores - Lista de tutores
     * @returns {string} HTML generado
     */
    generarHTMLTutoriasEstudiante(tutores) {
        return `
            <div class="pagina activa">
                <h1 class="text-3xl font-bold mb-2">Tutorías Disponibles</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">
                    Conecta con tutores expertos en cada materia.
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${tutores.map(tutor => this.generarHTMLTarjetaTutor(tutor)).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Genera HTML para tarjeta de tutor
     * @param {Object} tutor - Datos del tutor
     * @returns {string} HTML generado
     */
    generarHTMLTarjetaTutor(tutor) {
        return `
            <div class="efecto-vidrio-claro p-6 rounded-2xl flex flex-col">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-lg mr-3">
                        ${tutor.nombre.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h3 class="font-semibold">${tutor.nombre}</h3>
                        <div class="flex items-center">
                            <div class="flex text-yellow-400">
                                ${this.generarEstrellas(tutor.calificacion || 0)}
                            </div>
                            <span class="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                (${(tutor.calificacion || 0).toFixed(1)})
                            </span>
                        </div>
                    </div>
                </div>
                
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    ${tutor.biografia || 'Tutor experto'}
                </p>
                
                <p class="text-sm mb-2">
                    <strong>Especialidad:</strong> ${tutor.especialidades || 'Matemáticas'}
                </p>
                
                <p class="text-sm mb-4">
                    <strong>Tarifas:</strong> 
                    ${formatearMoneda(tutor.tarifa30min || 150)} (30min) / 
                    ${formatearMoneda(tutor.tarifa60min || 250)} (60min)
                </p>
                
                <button onclick="aplicacion.mostrarModalAgendarTutoria('${tutor.id}')" 
                        class="w-full py-2 bg-primary/80 hover:bg-primary text-white rounded-md">
                    Agendar Tutoría
                </button>
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

    // ========== TUTORÍAS DEL CREADOR ==========

    /**
     * Renderiza tutorías para creadores
     */
    async renderizarTutoriasCreador() {
        const html = this.generarHTMLTutoriasCreador();
        document.getElementById('contenido-principal').innerHTML = html;
    },

    /**
     * Genera HTML para tutorías del creador
     * @returns {string} HTML generado
     */
    generarHTMLTutoriasCreador() {
        return `
            <div class="pagina activa">
                <h1 class="text-3xl font-bold mb-2">Mis Tutorías</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">
                    Configura tu disponibilidad y tarifas como tutor.
                </p>
                
                <div class="efecto-vidrio-claro p-6 rounded-2xl mb-8">
                    <h2 class="text-xl font-bold mb-4">Configuración de Tutorías</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Tarifa 30 minutos (MXN)
                            </label>
                            <input type="number" 
                                   id="tarifa-30min" 
                                   value="150" 
                                   class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Tarifa 60 minutos (MXN)
                            </label>
                            <input type="number" 
                                   id="tarifa-60min" 
                                   value="250" 
                                   class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                        </div>
                    </div>
                    
                    <button onclick="aplicacion.actualizarTarifasTutoria()" 
                            class="py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-md">
                        Actualizar Tarifas
                    </button>
                </div>
                
                <div class="efecto-vidrio-claro p-6 rounded-2xl">
                    <h2 class="text-xl font-bold mb-4">Disponibilidad Semanal</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.generarHTMLDisponibilidad()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Genera HTML para disponibilidad
     * @returns {string} HTML generado
     */
    generarHTMLDisponibilidad() {
        const dias = [
            { id: 'lunes', nombre: 'Lunes' },
            { id: 'martes', nombre: 'Martes' },
            { id: 'miercoles', nombre: 'Miércoles' },
            { id: 'jueves', nombre: 'Jueves' },
            { id: 'viernes', nombre: 'Viernes' },
            { id: 'sabado', nombre: 'Sábado' }
        ];
        
        return dias.map(dia => `
            <div class="p-4 border border-light-border dark:border-dark-border rounded-xl">
                <h3 class="font-semibold mb-3">${dia.nombre}</h3>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-2">
                        <span class="text-sm">Mañana (9:00 - 13:00)</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-2">
                        <span class="text-sm">Tarde (15:00 - 19:00)</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-2">
                        <span class="text-sm">Noche (19:00 - 22:00)</span>
                    </label>
                </div>
                <button onclick="aplicacion.editarDisponibilidad('${dia.id}')" 
                        class="mt-3 text-sm text-primary hover:underline">
                    Editar horarios
                </button>
            </div>
        `).join('');
    },

    // ========== AGENDAMIENTO ==========

    /**
     * Muestra modal para agendar tutoría
     * @param {string} tutorId - ID del tutor
     */
    mostrarModalAgendarTutoria(tutorId = null) {
        const esSOS = !tutorId;
        const titulo = esSOS ? 'Solicitar Tutoría SOS' : 'Agendar Tutoría';
        
        const modalHTML = `
        <div id="modal-agendar-tutoria" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 transform transition-all scale-95 opacity-0 animar-modal-entrada">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">${titulo}</h3>
                    <button onclick="aplicacion.cerrarModal('modal-agendar-tutoria')" 
                            class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            Materia
                        </label>
                        <select id="materia-tutoria" 
                                class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="">Selecciona una materia</option>
                            <!-- Las materias se cargarán dinámicamente -->
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            Tema específico
                        </label>
                        <input type="text" 
                               placeholder="Ej: Derivadas, Integrales, etc." 
                               class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            Duración
                        </label>
                        <select class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="30">30 minutos ($150)</option>
                            <option value="60">60 minutos ($250)</option>
                        </select>
                    </div>
                    
                    <button onclick="aplicacion.agendarTutoria('${tutorId}')" 
                            class="w-full py-3 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition-transform transform hover:scale-105">
                        Solicitar Tutoría
                    </button>
                </div>
            </div>
        </div>`;
        
        document.getElementById('contenedor-modales').innerHTML = modalHTML;
        
        // Cargar materias del usuario
        this.cargarMateriasParaTutoria();
    },

    /**
     * Carga materias para el selector de tutoría
     */
    async cargarMateriasParaTutoria() {
        try {
            const materias = await servicioDatos.obtenerMateriasUsuario();
            const selector = document.getElementById('materia-tutoria');
            
            if (selector && materias.length > 0) {
                selector.innerHTML = `
                    <option value="">Selecciona una materia</option>
                    ${materias.map(materia => 
                        `<option value="${materia.id}">${materia.nombre}</option>`
                    ).join('')}
                `;
            }
        } catch (error) {
            console.error('Error cargando materias para tutoría:', error);
        }
    },

    /**
     * Agenda una tutoría
     * @param {string} tutorId - ID del tutor
     */
    async agendarTutoria(tutorId) {
        try {
            const materiaId = document.getElementById('materia-tutoria')?.value;
            const tema = document.querySelector('#modal-agendar-tutoria input[type="text"]')?.value;
            const duracion = document.querySelector('#modal-agendar-tutoria select:last-of-type')?.value;
            
            if (!materiaId || !tema || !duracion) {
                this.mostrarNotificacion('Error', 'Por favor completa todos los campos', 'error');
                return;
            }
            
            this.mostrarCarga(true);
            
            const resultado = await servicioDatos.agendarTutoria(tutorId, materiaId, duracion, tema);
            
            this.cerrarModal('modal-agendar-tutoria');
            
            if (resultado.exito) {
                this.mostrarModalExito('Tutoría agendada', 'Un tutor se pondrá en contacto contigo pronto.');
            } else {
                this.mostrarNotificacion('Error', resultado.mensaje || 'No se pudo agendar la tutoría', 'error');
            }
            
        } catch (error) {
            console.error('Error agendando tutoría:', error);
            this.mostrarNotificacion('Error', 'No se pudo agendar la tutoría', 'error');
        } finally {
            this.mostrarCarga(false);
        }
    },

    /**
     * Actualiza las tarifas de tutoría
     */
    async actualizarTarifasTutoria() {
        const tarifa30min = document.getElementById('tarifa-30min')?.value;
        const tarifa60min = document.getElementById('tarifa-60min')?.value;
        
        if (!tarifa30min || !tarifa60min) {
            this.mostrarNotificacion('Error', 'Por favor ingresa ambas tarifas', 'error');
            return;
        }
        
        try {
            // En una implementación real, esto enviaría al backend
            this.mostrarNotificacion('Éxito', 'Tarifas actualizadas correctamente', 'success');
        } catch (error) {
            console.error('Error actualizando tarifas:', error);
            this.mostrarNotificacion('Error', 'No se pudieron actualizar las tarifas', 'error');
        }
    },

    /**
     * Edita la disponibilidad de un día
     * @param {string} diaId - ID del día
     */
    editarDisponibilidad(diaId) {
        const dias = {
            lunes: 'Lunes',
            martes: 'Martes',
            miercoles: 'Miércoles',
            jueves: 'Jueves',
            viernes: 'Viernes',
            sabado: 'Sábado'
        };
        
        this.mostrarModalExito(
            'Editar Disponibilidad', 
            `Editando disponibilidad para ${dias[diaId]}. En una implementación completa, aquí podrías seleccionar horarios específicos.`
        );
    }
};