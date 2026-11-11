import { validarFormulario, normalizarTexto, sanitizarTexto, validarPreguntaSignificativa } from './validation.js';
import { consultarAsistente } from './api.js';
import { UI } from './ui.js';

function obtenerDatosFormulario() {
    const formData = new FormData(UI.form);
    return {
        tema: sanitizarTexto(formData.get('tema')),
        nivel: sanitizarTexto(formData.get('nivel')),
        pregunta: sanitizarTexto(formData.get('pregunta')),
        integracion: sanitizarTexto(formData.get('integracion'))
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

    if (!validarPreguntaSignificativa(datos.pregunta)) {
        UI.mostrarError('La pregunta debe tener al menos 5 caracteres visibles.');
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
        if (error.message.includes('red') || error.message.includes('CORS') || error.message.includes('tardó')) {
            UI.mostrarErrorConReintento(error.message, () => manejarEnvio(new Event('submit')));
        } else {
            UI.mostrarError(error.message);
        }
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