import { markdownATextoSeguro } from './markdown.js';

const MENSAJES_CARGA = [
    'Enviando consulta…',
    'El asistente está pensando…',
    'Generando respuesta…'
];
const INTERVALO_CARGA_MS = 2500;

export const UI = {
    form: document.getElementById('ai-form'),
    btnSubmit: document.getElementById('btn-submit'),
    btnClear: document.getElementById('btn-clear'),
    btnTheme: document.getElementById('btn-theme'),
    btnNueva: document.getElementById('btn-nueva-consulta'),
    loadingContainer: document.getElementById('loading-container'),
    loadingText: document.getElementById('loading-text'),
    errorContainer: document.getElementById('error-container'),
    resultContainer: document.getElementById('result-container'),
    emptyState: document.getElementById('empty-state'),
    charCount: document.getElementById('char-count'),
    preguntaField: document.getElementById('pregunta'),
    formCard: document.getElementById('ai-form').closest('section'),
    main: document.querySelector('main'),
    tituloDocumento: document.title,

    // Campos del formulario para validación inline
    campos: {
        tema: document.getElementById('tema'),
        nivel: document.getElementById('nivel'),
        pregunta: document.getElementById('pregunta'),
        integracion: document.getElementById('integracion')
    },

    // Campos de resultado
    resTema: document.getElementById('res-tema'),
    resNivel: document.getElementById('res-nivel'),
    resIntegracion: document.getElementById('res-integracion'),
    resRespuesta: document.getElementById('res-respuesta'),

    /* ---------- Estado de carga ---------- */

    setLoading(isLoading) {
        this.btnSubmit.disabled = isLoading;
        this.btnSubmit.textContent = isLoading ? 'Consultando...' : 'Consultar asistente';
        this.btnClear.disabled = isLoading;
        for (const elemento of this.form.elements) {
            elemento.disabled = isLoading;
        }
        this.loadingContainer.classList.toggle('d-none', !isLoading);
        this.main.setAttribute('aria-busy', String(isLoading));

        if (isLoading) {
            this.resultContainer.classList.add('d-none');
            this.errorContainer.classList.add('d-none');
            this.emptyState.classList.add('d-none');
            this.iniciarTextosCarga();
            document.title = 'Consultando…';
        } else {
            this.detenerTextosCarga();
            document.title = this.tituloDocumento;
        }
    },

    iniciarTextosCarga() {
        let indice = 0;
        this.loadingText.textContent = MENSAJES_CARGA[0];
        this.intervaloCarga = setInterval(() => {
            indice = (indice + 1) % MENSAJES_CARGA.length;
            this.loadingText.textContent = MENSAJES_CARGA[indice];
        }, INTERVALO_CARGA_MS);
    },

    detenerTextosCarga() {
        if (this.intervaloCarga) {
            clearInterval(this.intervaloCarga);
            this.intervaloCarga = null;
        }
    },

    /* ---------- Validación inline por campo ---------- */

    mostrarErrorCampo(nombre, mensaje) {
        const campo = this.campos[nombre];
        const error = document.getElementById(`error-${nombre}`);
        campo.classList.add('is-invalid');
        campo.setAttribute('aria-invalid', 'true');
        if (error) error.textContent = mensaje;
    },

    limpiarErrorCampo(nombre) {
        const campo = this.campos[nombre];
        const error = document.getElementById(`error-${nombre}`);
        campo.classList.remove('is-invalid');
        campo.removeAttribute('aria-invalid');
        if (error) error.textContent = '';
    },

    limpiarErroresCampos() {
        Object.keys(this.campos).forEach((nombre) => this.limpiarErrorCampo(nombre));
    },

    mostrarErroresCampos(errores) {
        let primerCampo = null;
        for (const [nombre, mensaje] of Object.entries(errores)) {
            if (mensaje) {
                this.mostrarErrorCampo(nombre, mensaje);
                if (!primerCampo) primerCampo = this.campos[nombre];
            }
        }
        // El foco desplaza la vista al primer campo con error
        if (primerCampo) primerCampo.focus();
    },

    /* ---------- Errores de servidor/red ---------- */

    mostrarError(mensaje) {
        this.errorContainer.textContent = mensaje;
        this.errorContainer.classList.remove('d-none');
        this.resultContainer.classList.add('d-none');
        this.emptyState.classList.add('d-none');
        this.desplazarHacia(this.errorContainer);
    },

    ocultarError() {
        this.errorContainer.classList.add('d-none');
    },

    mostrarErrorConReintento(mensaje, callback) {
        this.errorContainer.innerHTML = `${mensaje} <button type="button" class="btn btn-sm btn-warning ms-2" id="btn-retry">Reintentar</button>`;
        this.errorContainer.classList.remove('d-none');
        this.resultContainer.classList.add('d-none');
        this.emptyState.classList.add('d-none');
        document.getElementById('btn-retry').addEventListener('click', () => {
            this.ocultarError();
            callback();
        });
        this.desplazarHacia(this.errorContainer);
    },

    /* ---------- Resultado ---------- */

    mostrarResultado(datos) {
        this.resTema.textContent = datos.tema || '—';
        this.resNivel.textContent = datos.nivel || '—';

        const integracionTexto = datos.integracion === 'nativo'
            ? 'Nodo OpenAI (Nativo)'
            : 'HTTP Request (Responses API)';
        this.resIntegracion.textContent = integracionTexto;

        // Renderizar Markdown convertido (el escape previo evita XSS)
        this.resRespuesta.innerHTML = markdownATextoSeguro(datos.respuesta || 'Sin respuesta.');

        this.resultContainer.classList.remove('d-none');
        this.resultContainer.scrollIntoView({
            behavior: this.movimientoSuave() ? 'smooth' : 'auto',
            block: 'start'
        });
    },

    /* ---------- Utilidades ---------- */

    // "Nueva consulta": vuelve al formulario conservando tema, nivel e integración
    prepararNuevaConsulta() {
        this.ocultarError();
        this.limpiarErrorCampo('pregunta');
        this.preguntaField.value = '';
        this.actualizarContadorCaracteres();
        this.resultContainer.classList.add('d-none');
        this.emptyState.classList.remove('d-none');

        this.formCard.scrollIntoView({
            behavior: this.movimientoSuave() ? 'smooth' : 'auto',
            block: 'start'
        });
        // El foco abre el teclado en móvil; preventScroll evita un segundo salto
        this.preguntaField.focus({ preventScroll: true });
    },

    movimientoSuave() {
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    // Desplaza solo si el elemento queda fuera de la vista
    desplazarHacia(elemento) {
        const rect = elemento.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            elemento.scrollIntoView({
                behavior: this.movimientoSuave() ? 'smooth' : 'auto',
                block: 'center'
            });
        }
    },

    actualizarContadorCaracteres() {
        const longitud = this.preguntaField.value.length;
        const maximo = this.preguntaField.maxLength;
        this.charCount.textContent = `${longitud}/${maximo}`;
        this.charCount.classList.toggle('nb-count-warning', longitud > 800 && longitud <= 950);
        this.charCount.classList.toggle('nb-count-danger', longitud > 950);
    },

    limpiarFormulario() {
        this.form.reset();
        this.ocultarError();
        this.limpiarErroresCampos();
        this.resultContainer.classList.add('d-none');
        this.emptyState.classList.remove('d-none');
        this.actualizarContadorCaracteres();
    }
};
