// Conversión segura de Markdown básico a HTML.
// Estrategia anti-XSS: se escapan TODOS los caracteres peligrosos
// antes de insertar cualquier etiqueta, y las únicas etiquetas que se
// generan son las de esta función (el HTML del servidor nunca pasa).

function escaparHTML(texto) {
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Formato en línea: **negritas** y *cursivas* (sobre texto ya escapado)
function convertirInline(texto) {
    return texto
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function markdownATextoSeguro(texto) {
    if (!texto || typeof texto !== 'string') return '';

    const lineas = escaparHTML(texto).split(/\r?\n/);
    const bloques = [];
    let parrafo = [];
    let lista = null; // { tipo: 'ul' | 'ol', items: [] }

    const cerrarParrafo = () => {
        if (parrafo.length) {
            bloques.push(`<p>${parrafo.join('<br>')}</p>`);
            parrafo = [];
        }
    };

    const cerrarLista = () => {
        if (lista) {
            bloques.push(`<${lista.tipo}>${lista.items.map(item => `<li>${item}</li>`).join('')}</${lista.tipo}>`);
            lista = null;
        }
    };

    for (const linea of lineas) {
        const actual = linea.trim();

        if (actual === '') {
            cerrarParrafo();
            cerrarLista();
            continue;
        }

        // Encabezados: #, ## y ###
        const encabezado = actual.match(/^(#{1,3})\s+(.+)$/);
        if (encabezado) {
            cerrarParrafo();
            cerrarLista();
            const nivel = encabezado[1].length;
            bloques.push(`<h${nivel}>${convertirInline(encabezado[2])}</h${nivel}>`);
            continue;
        }

        // Lista con viñetas
        const itemLista = actual.match(/^-\s+(.+)$/);
        if (itemLista) {
            cerrarParrafo();
            if (!lista || lista.tipo !== 'ul') {
                cerrarLista();
                lista = { tipo: 'ul', items: [] };
            }
            lista.items.push(convertirInline(itemLista[1]));
            continue;
        }

        // Lista numerada
        const itemNumerado = actual.match(/^\d+\.\s+(.+)$/);
        if (itemNumerado) {
            cerrarParrafo();
            if (!lista || lista.tipo !== 'ol') {
                cerrarLista();
                lista = { tipo: 'ol', items: [] };
            }
            lista.items.push(convertirInline(itemNumerado[1]));
            continue;
        }

        // Línea de párrafo (las consecutivas se unen con <br>)
        cerrarLista();
        parrafo.push(convertirInline(actual));
    }

    cerrarParrafo();
    cerrarLista();

    return bloques.join('');
}
