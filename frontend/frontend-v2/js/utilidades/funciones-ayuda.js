// Funciones de ayuda generales

/**
 * Formatea una fecha a formato local
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatearFecha(fecha) {
    if (!fecha) return 'No asignada';
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formatea un número como porcentaje
 * @param {number} valor - Valor a formatear
 * @returns {string} Porcentaje formateado
 */
export function formatearPorcentaje(valor) {
    return `${Math.round(valor)}%`;
}

/**
 * Formatea un número como moneda
 * @param {number} monto - Monto a formatear
 * @returns {string} Monto formateado
 */
export function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(monto);
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {boolean} True si es válida
 */
export function validarPassword(password) {
    return password.length >= 6;
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generarIdUnico() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Limpia y sanitiza un string
 * @param {string} texto - Texto a limpiar
 * @returns {string} Texto limpio
 */
export function sanitizarTexto(texto) {
    if (!texto) return '';
    return texto
        .replace(/[<>]/g, '') // Elimina < y >
        .trim();
}

/**
 * Muestra u oculta un elemento
 * @param {HTMLElement} elemento - Elemento a manipular
 * @param {boolean} mostrar - True para mostrar, false para ocultar
 */
export function mostrarOcultar(elemento, mostrar) {
    if (!elemento) return;
    if (mostrar) {
        elemento.classList.remove('oculto');
    } else {
        elemento.classList.add('oculto');
    }
}

/**
 * Deshabilita o habilita un elemento
 * @param {HTMLElement} elemento - Elemento a manipular
 * @param {boolean} deshabilitar - True para deshabilitar
 */
export function deshabilitarElemento(elemento, deshabilitar) {
    if (!elemento) return;
    elemento.disabled = deshabilitar;
    if (deshabilitar) {
        elemento.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        elemento.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

/**
 * Agrega una clase temporalmente a un elemento
 * @param {HTMLElement} elemento - Elemento a modificar
 * @param {string} clase - Clase a agregar
 * @param {number} duracion - Duración en ms
 */
export function agregarClaseTemporal(elemento, clase, duracion = 1000) {
    if (!elemento) return;
    elemento.classList.add(clase);
    setTimeout(() => {
        elemento.classList.remove(clase);
    }, duracion);
}

/**
 * Copia texto al portapapeles
 * @param {string} texto - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
export async function copiarAlPortapapeles(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch (error) {
        console.error('Error copiando al portapapeles:', error);
        return false;
    }
}

/**
 * Obtiene el parámetro de una URL
 * @param {string} nombre - Nombre del parámetro
 * @returns {string|null} Valor del parámetro
 */
export function obtenerParametroURL(nombre) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nombre);
}

/**
 * Establece el título de la página
 * @param {string} titulo - Título a establecer
 */
export function establecerTituloPagina(titulo) {
    document.title = `${titulo} - Estudia-Pro`;
}

/**
 * Formatea el tiempo restante en minutos:segundos
 * @param {number} segundos - Segundos totales
 * @returns {string} Tiempo formateado
 */
export function formatearTiempoRestante(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

/**
 * Crea un elemento HTML con atributos
 * @param {string} tag - Etiqueta HTML
 * @param {Object} atributos - Atributos del elemento
 * @param {string} contenido - Contenido HTML
 * @returns {HTMLElement} Elemento creado
 */
export function crearElemento(tag, atributos = {}, contenido = '') {
    const elemento = document.createElement(tag);
    
    Object.keys(atributos).forEach(key => {
        elemento.setAttribute(key, atributos[key]);
    });
    
    if (contenido) {
        if (typeof contenido === 'string') {
            elemento.innerHTML = contenido;
        } else {
            elemento.appendChild(contenido);
        }
    }
    
    return elemento;
}

/**
 * Elimina todos los hijos de un elemento
 * @param {HTMLElement} elemento - Elemento padre
 */
export function limpiarElemento(elemento) {
    if (!elemento) return;
    while (elemento.firstChild) {
        elemento.removeChild(elemento.firstChild);
    }
}

/**
 * Verifica si un elemento está en el viewport
 * @param {HTMLElement} elemento - Elemento a verificar
 * @returns {boolean} True si está en el viewport
 */
export function estaEnViewport(elemento) {
    if (!elemento) return false;
    const rect = elemento.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Espera un tiempo determinado
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>} Promesa que se resuelve después del tiempo
 */
export function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}