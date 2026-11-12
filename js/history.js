// Historial de consultas: últimas respuestas guardadas solo en este navegador.
// Cualquier fallo de almacenamiento degrada en silencio: la app sigue funcionando.

const CLAVE_HISTORIAL = 'nb-historial';
const MAX_ENTRADAS = 5;
const MAX_RESPUESTA = 20000;

function crearId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function esTexto(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
}

function esEntradaValida(entrada) {
    return !!entrada
        && typeof entrada === 'object'
        && esTexto(entrada.id)
        && esTexto(entrada.fecha)
        && esTexto(entrada.tema)
        && esTexto(entrada.nivel)
        && esTexto(entrada.integracion)
        && esTexto(entrada.pregunta)
        && typeof entrada.respuesta === 'string';
}

// Recorta cada campo para no guardar datos absurdos ni llenar la cuota
function normalizarEntrada(entrada) {
    return {
        id: entrada.id.slice(0, 64),
        fecha: entrada.fecha,
        tema: entrada.tema.slice(0, 80),
        nivel: entrada.nivel.slice(0, 40),
        integracion: entrada.integracion.slice(0, 20),
        pregunta: entrada.pregunta.slice(0, 1000),
        respuesta: entrada.respuesta.slice(0, MAX_RESPUESTA)
    };
}

function claveDuplicado(entrada) {
    return `${entrada.tema}|${entrada.nivel}|${entrada.integracion}|${entrada.pregunta.trim().toLowerCase()}`;
}

export function leerHistorial() {
    try {
        const crudo = localStorage.getItem(CLAVE_HISTORIAL);
        if (!crudo) return [];

        const datos = JSON.parse(crudo);
        if (!Array.isArray(datos)) return [];

        return datos
            .filter(esEntradaValida)
            .map(normalizarEntrada)
            .slice(0, MAX_ENTRADAS);
    } catch (error) {
        console.warn('Historial no disponible:', error);
        return [];
    }
}

export function guardarConsulta(datos, resultado) {
    const entrada = normalizarEntrada({
        id: crearId(),
        fecha: new Date().toISOString(),
        tema: datos.tema || resultado.tema || '',
        nivel: datos.nivel || resultado.nivel || '',
        integracion: datos.integracion || resultado.integracion || '',
        pregunta: (datos.pregunta || '').trim(),
        respuesta: resultado.respuesta || ''
    });

    // Si la misma consulta ya existe, se mueve al inicio en lugar de duplicarse
    const lista = leerHistorial().filter((previa) => claveDuplicado(previa) !== claveDuplicado(entrada));
    lista.unshift(entrada);

    const recortada = lista.slice(0, MAX_ENTRADAS);

    try {
        localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(recortada));
    } catch (error) {
        console.warn('No se pudo guardar el historial:', error);
    }

    return recortada;
}

export function borrarHistorial() {
    try {
        localStorage.removeItem(CLAVE_HISTORIAL);
    } catch (error) {
        console.warn('No se pudo borrar el historial:', error);
    }
    return [];
}
