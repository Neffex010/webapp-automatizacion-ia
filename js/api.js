import { CONFIG } from './config.js';

export async function consultarAsistente(datos) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    try {
        const response = await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(datos),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // 1. Manejo de errores HTTP
        if (!response.ok) {
            // Códigos con mensaje específico
            if (response.status === 429) throw new Error('Se alcanzó el límite de consultas. Intente más tarde.');
            if (response.status === 503) throw new Error('El servicio está temporalmente indisponible. Intente más tarde.');
            if (response.status === 401) throw new Error('Error de autenticación en el servidor. Contacte al administrador.');
            if (response.status === 403) throw new Error('Acceso prohibido al servicio.');

            let mensajeError = `Error del servidor (HTTP ${response.status}).`;
            try {
                const errorData = await response.json();
                if (errorData?.respuesta) mensajeError = errorData.respuesta;
            } catch {}
            throw new Error(mensajeError);
        }

        // 2. Verificar que sea JSON
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('La respuesta del servidor no es JSON válido.');
        }

        let resultado = await response.json();

        // 3. Si viene como array, extraer el primer elemento
        if (Array.isArray(resultado)) {
            if (resultado.length === 0) {
                throw new Error('La respuesta está vacía.');
            }
            resultado = resultado[0];
        }

        // 4. Validación: JSON vacío o sin campos 'ok' ni 'respuesta'
        if (!resultado || typeof resultado !== 'object' || (!('ok' in resultado) && !('respuesta' in resultado))) {
            throw new Error('El servidor no devolvió una respuesta válida.');
        }

        // 5. Normalización flexible de la respuesta
        const esExito = resultado.ok === true || resultado.ok === "true";

        if (esExito) {
            return {
                ok: true,
                respuesta: resultado.respuesta || 'Sin respuesta generada.',
                tema: resultado.tema || datos.tema,
                nivel: resultado.nivel || datos.nivel,
                integracion: resultado.integracion || datos.integracion
            };
        }

        // Si ok es falso
        if (resultado.ok === false || resultado.ok === "false") {
            throw new Error(resultado.respuesta || 'La automatización reportó un error.');
        }

        // Si tiene respuesta pero no ok
        if (resultado.respuesta) {
            return {
                ok: true,
                respuesta: resultado.respuesta,
                tema: resultado.tema || datos.tema,
                nivel: resultado.nivel || datos.nivel,
                integracion: resultado.integracion || datos.integracion
            };
        }

        throw new Error('La respuesta no tiene el formato esperado.');

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('La solicitud tardó demasiado. Intente nuevamente.');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Error de red o CORS. Verifique la URL del Webhook y su conexión.');
        }

        throw error;
    }
}