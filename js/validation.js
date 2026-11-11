import { CONFIG } from './config.js';

const TEMAS_VALIDOS = [
    'Inteligencia artificial',
    'Redes',
    'Programación',
    'Bases de datos',
    'Internet de las cosas (IoT)'
];

const NIVELES_VALIDOS = ['Básico', 'Intermedio', 'Avanzado'];
const INTEGRACIONES_VALIDAS = ['nativo', 'http'];

export function validarCampoTexto(valor, minimo = 5) {
    if (!valor || typeof valor !== 'string') return false;
    const limpio = valor.trim();
    return limpio.length >= minimo && limpio.length <= CONFIG.MAX_PREGUNTA_LENGTH;
}

export function validarTema(valor) {
    return TEMAS_VALIDOS.includes(valor);
}

export function validarNivel(valor) {
    return NIVELES_VALIDOS.includes(valor);
}

export function validarIntegracion(valor) {
    return INTEGRACIONES_VALIDAS.includes(valor);
}

export function validarFormulario(datos) {
    const errores = [];

    if (!validarTema(datos.tema)) {
        errores.push('Seleccione un tema válido.');
    }
    if (!validarNivel(datos.nivel)) {
        errores.push('Seleccione un nivel válido.');
    }
    if (!validarCampoTexto(datos.pregunta)) {
        errores.push(`La pregunta debe tener entre 5 y ${CONFIG.MAX_PREGUNTA_LENGTH} caracteres.`);
    }
    if (!validarIntegracion(datos.integracion)) {
        errores.push('Seleccione un mecanismo de integración válido.');
    }

    return {
        esValido: errores.length === 0,
        errores
    };
}

export function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.trim().replace(/\s+/g, ' ');
}

export function sanitizarTexto(texto) {
    if (!texto || typeof texto !== 'string') return '';
    return texto
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function validarPreguntaSignificativa(texto) {
    return sanitizarTexto(texto).length >= 5;
}