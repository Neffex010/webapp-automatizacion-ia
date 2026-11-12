import { markdownATextoSeguro } from './markdown.js';
import { leerHistorial } from './history.js';

const MENSAJES_CARGA = [
    'Enviando consulta…',
    'El asistente está pensando…',
    'Generando respuesta…'
];
const INTERVALO_CARGA_MS = 2500;

// Fecha corta para el historial: "hoy 14:32", "ayer 09:10" o "05 nov 18:20"
function formatearFecha(iso) {
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return '';

    const ahora = new Date();
    const ayer = new Date(ahora);
    ayer.setDate(ahora.getDate() - 1);

    const hora = fecha.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    if (fecha.toDateString() === ahora.toDateString()) return `hoy ${hora}`;
    if (fecha.toDateString() === ayer.toDateString()) return `ayer ${hora}`;

    const dia = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    return `${dia} ${hora}`;
}

export const UI = {
    form: document.getElementById('ai-form'),
    btnSubmit: document.getElementById('btn-submit'),
    btnClear: document.getElementById('btn-clear'),
    btnTheme: document.getElementById('btn-theme'),
    btnNueva: document.getElementById('btn-nueva-consulta'),
    historyCard: document.getElementById('history-card'),
    historyList: document.getElementById('history-list'),
    historyCount: document.getElementById('history-count'),
    btnClearHistory: document.getElementById('btn-clear-history'),
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
            this.historyCard.classList.add('d-none');
            this.iniciarTextosCarga();
            document.title = 'Consultando…';
        } else {
            this.detenerTextosCarga();
            this.renderHistorial(leerHistorial());
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

    /* ---------- Historial de consultas ---------- */

    renderHistorial(entradas) {
        this.historyList.replaceChildren();

        if (!entradas || entradas.length === 0) {
            this.historyCount.textContent = '0';
            this.historyCard.classList.add('d-none');
            return;
        }

        for (const entrada of entradas) {
            const item = document.createElement('li');

            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'nb-history-item';
            boton.setAttribute(
                'aria-label',
                `Recuperar consulta: ${entrada.pregunta} (${formatearFecha(entrada.fecha)})`
            );

            const fila = document.createElement('span');
            fila.className = 'nb-history-top';

            const meta = document.createElement('span');
            meta.className = 'nb-history-meta';
            meta.textContent = `${entrada.tema} · ${entrada.nivel}`;

            const fecha = document.createElement('span');
            fecha.className = 'nb-history-date';
            fecha.textContent = formatearFecha(entrada.fecha);

            const pregunta = document.createElement('span');
            pregunta.className = 'nb-history-question';
            pregunta.textContent = entrada.pregunta;

            fila.append(meta, fecha);
            boton.append(fila, pregunta);
            boton.addEventListener('click', () => this.cargarDesdeHistorial(entrada));

            item.append(boton);
            this.historyList.append(item);
        }

        this.historyCount.textContent = String(entradas.length);
        this.historyCard.classList.remove('d-none');
    },

    // Recupera una consulta guardada sin llamar al webhook
    cargarDesdeHistorial(entrada) {
        this.limpiarErroresCampos();
        this.ocultarError();

        this.campos.tema.value = entrada.tema;
        this.campos.nivel.value = entrada.nivel;
        this.campos.integracion.value = entrada.integracion;
        this.preguntaField.value = entrada.pregunta;
        this.actualizarContadorCaracteres();

        this.mostrarResultado(entrada);
    },

    // Borrado en dos pasos: el primer clic pide confirmación durante 3 s
    confirmarBorradoHistorial(alBorrar) {
        if (this._borradoPendiente) {
            clearTimeout(this._borradoPendiente);
            this._borradoPendiente = null;
            this.restablecerBotonBorrar();
            alBorrar();
            return;
        }

        this.btnClearHistory.textContent = '¿Borrar todo?';
        this.btnClearHistory.classList.add('nb-btn-confirm');
        this._borradoPendiente = setTimeout(() => {
            this._borradoPendiente = null;
            this.restablecerBotonBorrar();
        }, 3000);
    },

    restablecerBotonBorrar() {
        this.btnClearHistory.textContent = 'Borrar historial';
        this.btnClearHistory.classList.remove('nb-btn-confirm');
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
