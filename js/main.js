import { validarFormulario, normalizarTexto } from './validation.js';
import { consultarAsistente } from './api.js';
import { UI } from './ui.js';

function obtenerDatosFormulario() {
    const formData = new FormData(UI.form);
    return {
        tema: normalizarTexto(formData.get('tema')),
        nivel: normalizarTexto(formData.get('nivel')),
        pregunta: normalizarTexto(formData.get('pregunta')),
        integracion: normalizarTexto(formData.get('integracion'))
    };
}

async function manejarEnvio(evento) {
    evento.preventDefault();
    UI.ocultarError();

    const datos = obtenerDatosFormulario();
    const validacion = validarFormulario(datos);

    if (!validacion.esValido) {
        UI.mostrarError(validacion.errores.join(' '));
        return;
    }

    UI.setLoading(true);

    try {
        const resultado = await consultarAsistente(datos);

        if (resultado.ok) {
            UI.mostrarResultado(resultado);
        } else {
            UI.mostrarError(resultado.respuesta || 'Ocurrió un error en la automatización.');
        }
    } catch (error) {
        console.error('Error:', error);
        UI.mostrarError(error.message || 'No se pudo conectar con el asistente.');
    } finally {
        UI.setLoading(false);
    }
}

// Inicialización
UI.form.addEventListener('submit', manejarEnvio);
UI.btnClear.addEventListener('click', () => {
    setTimeout(() => UI.limpiarFormulario(), 0);
});
UI.preguntaField.addEventListener('input', () => UI.actualizarContadorCaracteres());
UI.actualizarContadorCaracteres();