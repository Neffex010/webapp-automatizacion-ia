import { validarFormulario, sanitizarTexto, validarPreguntaSignificativa } from './validation.js';
import { consultarAsistente } from './api.js';
import { UI } from './ui.js';
import { aplicarTema, temaInicial, alternarTema, sincronizarConPreferenciaSistema } from './theme.js';

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
    UI.limpiarErroresCampos();

    const datos = obtenerDatosFormulario();
    const validacion = validarFormulario(datos);

    if (!validacion.esValido) {
        UI.mostrarErroresCampos(validacion.campos);
        return;
    }

    if (!validarPreguntaSignificativa(datos.pregunta)) {
        UI.mostrarErroresCampos({ pregunta: 'La pregunta debe tener al menos 5 caracteres visibles.' });
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

// Tema visual: aplicar el guardado y permitir alternar
aplicarTema(temaInicial());
sincronizarConPreferenciaSistema();
UI.btnTheme.addEventListener('click', alternarTema);

// Inicialización
UI.form.addEventListener('submit', manejarEnvio);
UI.btnClear.addEventListener('click', () => {
    setTimeout(() => UI.limpiarFormulario(), 0);
});
UI.preguntaField.addEventListener('input', () => UI.actualizarContadorCaracteres());
UI.btnNueva.addEventListener('click', () => UI.prepararNuevaConsulta());

// Ctrl+Enter (o Cmd+Enter) envía desde el textarea
UI.preguntaField.addEventListener('keydown', (evento) => {
    if ((evento.ctrlKey || evento.metaKey) && evento.key === 'Enter') {
        evento.preventDefault();
        UI.form.requestSubmit();
    }
});

// Al editar un campo, se limpia su error inline
for (const [nombre, campo] of Object.entries(UI.campos)) {
    campo.addEventListener(nombre === 'pregunta' ? 'input' : 'change', () => UI.limpiarErrorCampo(nombre));
}

UI.actualizarContadorCaracteres();
