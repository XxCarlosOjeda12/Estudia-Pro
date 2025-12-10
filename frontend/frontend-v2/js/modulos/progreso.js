import { servicioDatos } from './datos.js';
import { formatearPorcentaje, mostrarOcultar } from '../utilidades/funciones-ayuda.js';

export const moduloProgreso = {
    // ========== OBTENCIÓN DE DATOS ==========

    /**
     * Obtiene datos para el progreso
     */
    async obtenerDatosProgreso() {
        try {
            const [materias, logros, notificaciones] = await Promise.all([
                servicioDatos.obtenerMateriasUsuario(),
                servicioDatos.obtenerLogrosUsuario(),
                servicioDatos.obtenerNotificacionesUsuario()
            ]);
            
            return {
                materias,
                logros,
                notificaciones
            };
        } catch (error) {
            console.error('Error obteniendo datos de progreso:', error);
            throw error;
        }
    },

    /**
     * Renderiza la página de progreso
     */
    async renderizarPaginaProgreso() {
        try {
            const datos = await this.obtenerDatosProgreso();
            
            const html = this.generarHTMLProgreso(datos);
            document.getElementById('contenido-principal').innerHTML = html;
            
            // Renderizar gráficos
            this.renderizarGraficos(datos.materias);
            
        } catch (error) {
            console.error('Error renderizando progreso:', error);
            document.getElementById('contenido-principal').innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-500">Error al cargar el progreso.</p>
                </div>
            `;
        }
    },

    /**
     * Genera HTML para la página de progreso
     * @param {Object} datos - Datos de progreso
     * @returns {string} HTML generado
     */
    generarHTMLProgreso(datos) {
        const notificacionesNoLeidas = datos.notificaciones?.filter(n => !n.leido).length || 0;
        const progresoPromedio = datos.materias?.length > 0 
            ? datos.materias.reduce((sum, m) => sum + (m.progreso || 0), 0) / datos.materias.length 
            : 0;

        return `
            <div class="pagina activa">
                <h1 class="text-3xl font-bold mb-2">Mi Progreso General</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">
                    Analiza tu evolución y áreas de mejora.
                </p>
                
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div class="lg:col-span-3 efecto-vidrio-claro p-6 rounded-2xl">
                        <h3 class="font-bold mb-4">Evolución en Simulacros</h3>
                        <canvas id="grafico-lineal"></canvas>
                    </div>
                    <div class="lg:col-span-2 efecto-vidrio-claro p-6 rounded-2xl">
                        <h3 class="font-bold mb-4">Tiempo de Estudio (Última Semana)</h3>
                        <canvas id="grafico-barras"></canvas>
                    </div>
                </div>
                
                <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="efecto-vidrio-claro p-6 rounded-2xl">
                        <h3 class="font-bold mb-4">Materias con Mejor Progreso</h3>
                        <ul class="space-y-3">
                            ${datos.materias?.length > 0 
                                ? datos.materias
                                    .sort((a, b) => b.progreso - a.progreso)
                                    .slice(0, 3)
                                    .map(m => `
                                        <li class="flex items-center justify-between">
                                            <span>${m.nombre}</span>
                                            <span class="font-bold text-primary">${formatearPorcentaje(m.progreso || 0)}</span>
                                        </li>
                                    `).join('')
                                : '<p class="text-slate-500">No tienes materias añadidas.</p>'
                            }
                        </ul>
                    </div>
                    <div class="efecto-vidrio-claro p-6 rounded-2xl">
                        <h3 class="font-bold mb-4">Recomendaciones de Estudio</h3>
                        <ul class="space-y-2 list-disc list-inside">
                            ${this.generarRecomendaciones(datos.materias)}
                        </ul>
                    </div>
                </div>

                <div class="mt-8 efecto-vidrio-claro p-6 rounded-2xl">
                    <h3 class="font-bold mb-4">Estadísticas de Estudio</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-primary">${datos.materias?.length || 0}</div>
                            <div class="text-sm text-slate-500">Materias</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-primary">${datos.logros?.length || 0}</div>
                            <div class="text-sm text-slate-500">Logros</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-primary">${notificacionesNoLeidas}</div>
                            <div class="text-sm text-slate-500">Notificaciones</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-primary">${Math.round(progresoPromedio)}%</div>
                            <div class="text-sm text-slate-500">Progreso Promedio</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Genera recomendaciones de estudio basadas en el progreso
     * @param {Array} materias - Lista de materias
     * @returns {string} HTML de recomendaciones
     */
    generarRecomendaciones(materias) {
        const recomendaciones = [];
        
        if (!materias || materias.length === 0) {
            return '<li>Añade materias para recibir recomendaciones personalizadas</li>';
        }
        
        // Materias con bajo progreso
        const materiasBajas = materias.filter(m => m.progreso < 40);
        if (materiasBajas.length > 0) {
            recomendaciones.push(`Enfócate en <strong>${materiasBajas[0].nombre}</strong> (progreso: ${materiasBajas[0].progreso}%)`);
        }
        
        // Recomendaciones generales
        recomendaciones.push('Practica más ejercicios de derivadas e integrales');
        recomendaciones.push('Revisa los conceptos de álgebra lineal');
        recomendaciones.push('Intenta resolver exámenes pasados de cada materia');
        
        return recomendaciones.map(rec => `<li>${rec}</li>`).join('');
    },

    /**
     * Renderiza los gráficos de progreso
     * @param {Array} materias - Lista de materias del usuario
     */
    renderizarGraficos(materias) {
        // Verificar si Chart.js está disponible
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está disponible. Los gráficos no se renderizarán.');
            return;
        }
        
        const esModoOscuro = document.documentElement.classList.contains('tema-oscuro');
        const colorTexto = esModoOscuro ? '#e2e8f0' : '#334155';
        const colorGrid = esModoOscuro ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Gráfico lineal: Evolución en simulacros
        const ctxLineal = document.getElementById('grafico-lineal');
        if (ctxLineal) {
            new Chart(ctxLineal, {
                type: 'line',
                data: {
                    labels: ['Sim 1', 'Sim 2', 'Sim 3', 'Sim 4', 'Sim 5'],
                    datasets: [{
                        label: 'Puntaje',
                        data: [55, 62, 75, 68, 82],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        fill: true,
                        tension: 0.3,
                    }, {
                        label: 'Aprobatorio',
                        data: [60, 60, 60, 60, 60],
                        borderColor: '#f59e0b',
                        borderDash: [5, 5],
                        fill: false,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: colorTexto
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: colorTexto
                            },
                            grid: {
                                color: colorGrid
                            }
                        },
                        x: {
                            ticks: {
                                color: colorTexto
                            },
                            grid: {
                                color: colorGrid
                            }
                        }
                    }
                }
            });
        }

        // Gráfico de barras: Tiempo de estudio
        const ctxBarras = document.getElementById('grafico-barras');
        if (ctxBarras) {
            new Chart(ctxBarras, {
                type: 'bar',
                data: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                    datasets: [{
                        label: 'Minutos',
                        data: [45, 60, 25, 90, 30, 75],
                        backgroundColor: '#10b981',
                        borderRadius: 5,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: colorTexto
                            },
                            grid: {
                                color: colorGrid
                            }
                        },
                        x: {
                            ticks: {
                                color: colorTexto
                            },
                            grid: {
                                color: colorGrid
                            }
                        }
                    }
                }
            });
        }

        // Si hay materias, crear gráfico de progreso por materia
        if (materias && materias.length > 0) {
            this.renderizarGraficoMaterias(materias, esModoOscuro);
        }
    },

    /**
     * Renderiza gráfico de progreso por materia
     * @param {Array} materias - Lista de materias
     * @param {boolean} esModoOscuro - Si está en modo oscuro
     */
    renderizarGraficoMaterias(materias, esModoOscuro) {
        const contenedor = document.getElementById('grafico-materias-container');
        if (!contenedor) return;
        
        // Crear contenedor si no existe
        if (!document.getElementById('grafico-materias')) {
            contenedor.innerHTML = `
                <div class="mt-8 efecto-vidrio-claro p-6 rounded-2xl">
                    <h3 class="font-bold mb-4">Progreso por Materia</h3>
                    <canvas id="grafico-materias"></canvas>
                </div>
            `;
        }
        
        const ctx = document.getElementById('grafico-materias');
        if (!ctx) return;
        
        const colorTexto = esModoOscuro ? '#e2e8f0' : '#334155';
        const colorGrid = esModoOscuro ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Ordenar materias por progreso
        const materiasOrdenadas = [...materias].sort((a, b) => b.progreso - a.progreso);
        
        new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: materiasOrdenadas.map(m => m.nombre),
                datasets: [{
                    label: 'Progreso (%)',
                    data: materiasOrdenadas.map(m => m.progreso || 0),
                    backgroundColor: materiasOrdenadas.map(m => {
                        if (m.progreso >= 70) return '#10b981'; // Verde
                        if (m.progreso >= 40) return '#f59e0b'; // Amarillo
                        return '#ef4444'; // Rojo
                    }),
                    borderRadius: 5,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: colorTexto
                        },
                        grid: {
                            color: colorGrid
                        }
                    },
                    y: {
                        ticks: {
                            color: colorTexto
                        },
                        grid: {
                            color: colorGrid
                        }
                    }
                }
            }
        });
    },

    // ========== LOGROS ==========

    /**
     * Renderiza la página de logros
     */
    async renderizarPaginaLogros() {
        try {
            const logros = await servicioDatos.obtenerLogrosUsuario();
            
            const html = this.generarHTMLLogros(logros);
            document.getElementById('contenido-principal').innerHTML = html;
            
        } catch (error) {
            console.error('Error renderizando logros:', error);
            document.getElementById('contenido-principal').innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-500">Error al cargar los logros.</p>
                </div>
            `;
        }
    },

    /**
     * Genera HTML para la página de logros
     * @param {Array} logros - Lista de logros
     * @returns {string} HTML generado
     */
    generarHTMLLogros(logros) {
        const logrosDesbloqueados = logros || [];
        const totalLogros = 12; // Total de logros disponibles
        const porcentajeCompletado = logrosDesbloqueados.length > 0 
            ? Math.round((logrosDesbloqueados.length / totalLogros) * 100) 
            : 0;
        
        return `
            <div class="pagina activa">
                <h1 class="text-3xl font-bold mb-2">Mis Logros</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">
                    Recompensas por tu progreso y participación.
                </p>
                
                <div class="efecto-vidrio-claro p-6 rounded-2xl mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-bold">Progreso de Logros</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">
                                ${logrosDesbloqueados.length} de ${totalLogros} logros desbloqueados
                            </p>
                        </div>
                        <span class="text-2xl font-bold text-primary">${porcentajeCompletado}%</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div class="bg-primary h-2.5 rounded-full" style="width: ${porcentajeCompletado}%"></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${this.generarHTMLTarjetasLogros(logrosDesbloqueados, totalLogros)}
                </div>
            </div>
        `;
    },

    /**
     * Genera HTML para las tarjetas de logros
     * @param {Array} logrosDesbloqueados - Logros obtenidos
     * @param {number} totalLogros - Total de logros disponibles
     * @returns {string} HTML generado
     */
    generarHTMLTarjetasLogros(logrosDesbloqueados, totalLogros) {
        const logrosHTML = logrosDesbloqueados.map(logro => `
            <div class="efecto-vidrio-claro p-6 rounded-2xl text-center logro-desbloqueado">
                <div class="text-4xl mb-3">${logro.icono || '🏆'}</div>
                <h3 class="text-lg font-semibold mb-1">${logro.nombre}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">${logro.descripcion}</p>
                <p class="text-xs text-slate-400">Obtenido: ${this.formatearFechaCorta(logro.fecha)}</p>
            </div>
        `).join('');
        
        // Logros bloqueados
        const logrosBloqueados = totalLogros - logrosDesbloqueados.length;
        const logrosBloqueadosHTML = Array.from({ length: logrosBloqueados }).map((_, i) => `
            <div class="efecto-vidrio-claro p-6 rounded-2xl text-center opacity-60">
                <div class="text-4xl mb-3">🔒</div>
                <h3 class="text-lg font-semibold mb-1">Logro Bloqueado</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Sigue usando la plataforma para desbloquear este logro.
                </p>
            </div>
        `).join('');
        
        return logrosHTML + logrosBloqueadosHTML;
    },

    /**
     * Formatea una fecha en formato corto
     * @param {string} fecha - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatearFechaCorta(fecha) {
        if (!fecha) return 'Reciente';
        
        try {
            const fechaObj = new Date(fecha);
            return fechaObj.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return 'Reciente';
        }
    },

    // ========== ACTUALIZACIÓN DE PROGRESO ==========

    /**
     * Actualiza el progreso de una materia
     * @param {string} materiaId - ID de la materia
     * @param {number} nuevoProgreso - Nuevo valor de progreso
     */
    async actualizarProgresoMateria(materiaId, nuevoProgreso) {
        try {
            // En una implementación real, esto enviaría al backend
            console.log(`Actualizando progreso de materia ${materiaId} a ${nuevoProgreso}%`);
            
            // Actualizar cache local
            const materias = await servicioDatos.obtenerMateriasUsuario();
            const materiaIndex = materias.findIndex(m => m.id === materiaId);
            
            if (materiaIndex !== -1) {
                materias[materiaIndex].progreso = nuevoProgreso;
                
                // Notificar al usuario
                if (nuevoProgreso >= 100) {
                    this.mostrarNotificacion(
                        '¡Felicidades!', 
                        `Has completado la materia ${materias[materiaIndex].nombre}`,
                        'success'
                    );
                } else if (nuevoProgreso >= 70) {
                    this.mostrarNotificacion(
                        'Buen trabajo', 
                        `Vas muy bien en ${materias[materiaIndex].nombre}`,
                        'success'
                    );
                }
            }
            
        } catch (error) {
            console.error('Error actualizando progreso:', error);
        }
    },

    /**
     * Calcula el progreso general del usuario
     * @returns {number} Progreso general en porcentaje
     */
    calcularProgresoGeneral() {
        const materias = this.estado.cache?.materias || [];
        if (materias.length === 0) return 0;
        
        const totalProgreso = materias.reduce((sum, materia) => sum + (materia.progreso || 0), 0);
        return Math.round(totalProgreso / materias.length);
    },

    /**
     * Obtiene estadísticas de estudio
     * @returns {Object} Estadísticas
     */
    obtenerEstadisticas() {
        const materias = this.estado.cache?.materias || [];
        const logros = this.estado.cache?.logros || [];
        
        return {
            totalMaterias: materias.length,
            materiasCompletadas: materias.filter(m => m.progreso >= 100).length,
            totalLogros: logros.length,
            horasEstudiadas: this.calcularHorasEstudiadas(),
            progresoGeneral: this.calcularProgresoGeneral()
        };
    },

    /**
     * Calcula horas de estudio (simulado para demo)
     * @returns {number} Horas estudiadas
     */
    calcularHorasEstudiadas() {
        // En una implementación real, esto vendría del backend
        const materias = this.estado.cache?.materias || [];
        return materias.length * 5; // 5 horas por materia (simulado)
    },

    // ========== EXPORTACIÓN DE PROGRESO ==========

    /**
     * Exporta el progreso como PDF
     */
    async exportarProgresoPDF() {
        try {
            this.mostrarCarga(true);
            
            // Simular generación de PDF
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.mostrarModalExito(
                'Progreso exportado', 
                'Tu progreso ha sido exportado como PDF. El archivo se descargará automáticamente.'
            );
            
            // En una implementación real, aquí se generaría y descargaría el PDF
            console.log('Exportando progreso como PDF...');
            
        } catch (error) {
            console.error('Error exportando progreso:', error);
            this.mostrarNotificacion('Error', 'No se pudo exportar el progreso', 'error');
        } finally {
            this.mostrarCarga(false);
        }
    },

    /**
     * Comparte el progreso en redes sociales
     */
    compartirProgreso() {
        const progresoGeneral = this.calcularProgresoGeneral();
        const texto = `¡He alcanzado el ${progresoGeneral}% de progreso en Estudia-Pro! 🎓 #EstudiaPro #Aprendizaje`;
        
        // En una implementación real, esto abriría un diálogo de compartir
        this.mostrarNotificacion(
            'Compartir progreso', 
            `Copia y pega este texto: "${texto}"`,
            'info'
        );
        
        // Copiar al portapapeles
        navigator.clipboard.writeText(texto).then(() => {
            console.log('Texto copiado al portapapeles');
        });
    }
};