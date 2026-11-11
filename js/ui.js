export const UI = {
    form: document.getElementById('ai-form'),
    btnSubmit: document.getElementById('btn-submit'),
    btnClear: document.getElementById('btn-clear'),
    loadingContainer: document.getElementById('loading-container'),
    errorContainer: document.getElementById('error-container'),
    resultContainer: document.getElementById('result-container'),
    charCount: document.getElementById('char-count'),
    preguntaField: document.getElementById('pregunta'),

    // Campos de resultado
    resTema: document.getElementById('res-tema'),
    resNivel: document.getElementById('res-nivel'),
    resIntegracion: document.getElementById('res-integracion'),
    resRespuesta: document.getElementById('res-respuesta'),

    setLoading(isLoading) {
        this.btnSubmit.disabled = isLoading;
        this.btnSubmit.textContent = isLoading ? 'Consultando...' : 'Consultar asistente';
        this.loadingContainer.classList.toggle('d-none', !isLoading);
        if (isLoading) {
            this.resultContainer.classList.add('d-none');
            this.errorContainer.classList.add('d-none');
        }
    },

    mostrarError(mensaje) {
        this.errorContainer.textContent = mensaje;
        this.errorContainer.classList.remove('d-none');
        this.resultContainer.classList.add('d-none');
    },

    ocultarError() {
        this.errorContainer.classList.add('d-none');
    },

    mostrarResultado(datos) {
        this.resTema.textContent = datos.tema || '—';
        this.resNivel.textContent = datos.nivel || '—';

        const integracionTexto = datos.integracion === 'nativo'
            ? 'Nodo OpenAI (Nativo)'
            : 'HTTP Request (Responses API)';
        this.resIntegracion.textContent = integracionTexto;

        // Renderizar como TEXTO (no HTML) para evitar XSS
        this.resRespuesta.textContent = datos.respuesta || 'Sin respuesta.';

        this.resultContainer.classList.remove('d-none');
        this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    actualizarContadorCaracteres() {
        const longitud = this.preguntaField.value.length;
        this.charCount.textContent = `${longitud}/${this.preguntaField.maxLength}`;
    },

    limpiarFormulario() {
        this.form.reset();
        this.ocultarError();
        this.resultContainer.classList.add('d-none');
        this.actualizarContadorCaracteres();
    }
};