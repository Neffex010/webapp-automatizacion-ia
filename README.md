# 3.4 Web app para automatización IA

Aplicación web académica que consulta un asistente de Inteligencia Artificial especializado en Tecnologías de la Información y Comunicaciones (TIC).

---

## Descripción general

Interfaz web **responsiva** (Bootstrap 5 + CSS neobrutalista propio) que captura **Tema**, **Nivel**, **Pregunta** e **Integración**, envía una solicitud HTTP POST a un Webhook de **n8n Cloud** y muestra la respuesta generada por **OpenAI** sin recargar la página.

---

## Capturas

| Modo claro | Modo oscuro |
|------------|-------------|
| ![Modo claro](captura-modo-claro.png) | ![Modo oscuro](captura-modo-oscuro.png) |

---

## Tecnologías

| Capa | Tecnología |
|------|------------|
| HTML | HTML5 semántico, ES Modules, sin bundler |
| CSS | Bootstrap 5.3 (solo CSS) + tema neobrutalista con variables CSS (`--nb-*`) |
| JS | ES Modules nativos, `fetch` + `AbortController`, `localStorage`, `markdownATextoSeguro` (XSS-safe) |
| Backend | n8n Cloud + OpenAI (configurado vía Webhook público) |
| Tipografía | Space Grotesk (Google Fonts) |

---

## Estructura del proyecto

```
webapp-automatizacion-ia/
├── index.html          # Entrada: formulario, carga, error, resultado, historial
├── css/
│   └── styles.css      # Tema neobrutalista (claro/oscuro), chips, animaciones, responsive
├── js/
│   ├── main.js         # Orquestador: envío, validación, tema, historial, atajos
│   ├── ui.js           # Capa de UI: carga, errores inline, resultado, historial, contador
│   ├── api.js          # fetch con timeout, manejo de códigos HTTP, normalización JSON
│   ├── validation.js   # Validadores atómicos + sanitización anti-XSS
│   ├── markdown.js     # Markdown → HTML seguro (escape previo, etiquetas permitidas)
│   ├── theme.js        # Tema claro/oscuro + persistencia + prefers-color-scheme + anti-FOUC
│   ├── history.js      # Historial en localStorage (5 entradas, deduplicado, borrado 2 pasos)
│   └── config.js       # URL pública del webhook, timeout, longitud máxima
└── README.md           # Este archivo
```

---

## Características principales

### Formulario y validación
- **Validación inline por campo** (Borde rojo + mensaje + `aria-invalid` + `aria-describedby`).
- **Contador reactivo**: amarillo > 800, rojo > 950 caracteres.
- **Ctrl/Cmd + Enter** envía desde el textarea.
- Limpieza de error al editar el campo.

### Estados de UI
- **Carga** con textos rotando ("Enviando…" → "Pensando…" → "Generando…"), `aria-busy`, título "Consultando…", campos y botón Limpiar deshabilitados.
- **Errores de servidor/red** con mensajes específicos (429, 503, 401, 403, timeout, CORS) y **botón Reintentar**.
- **Estado vacío inicial** con robot neobrutalista flotando.
- **Resultado** con chips (Tema, Nivel, Integración) y renderizado de Markdown (encabezados, negritas, cursivas, listas).

### Tema visual
- **Neobrutalista**: bordes 3 px, sombras duras (6 px), colores vibrantes.
- **Modo oscuro** real: `[data-tema="oscuro"]` en `<html>`, persistido en `localStorage` (`nb-tema`), respeta `prefers-color-scheme`, script inline anti-FOUC en `<head>`, `color-scheme: dark`.
- **Regla de acentos**: header naranja, footer turquesa, encabezado amarillo, chips, toggle y robot **conservan su look claro** (líneas/texto negro) en ambos temas; solo la zona adaptable (body, tarjetas, inputs, botones) se invierte.

### Historial de consultas
- Guarda las **últimas 5 consultas exitosas** en `localStorage` (`nb-historial`).
- **Deduplicado**: misma consulta = se mueve al inicio, no duplica.
- **Recuperación sin red**: rellena formulario + muestra respuesta guardada (Markdown incluido).
- **Borrado en dos pasos** (confirmación visual 3 s).
- Degradación silenciosa si `localStorage` falla.

### Accesibilidad
- `aria-live` en errores (`assertive`) y resultados (`polite` via `role="status"`).
- `aria-invalid`, `aria-describedby`, `aria-pressed`, `aria-label` donde corresponde.
- Foco visible (`outline` naranja 3 px).
- Respeta `prefers-reduced-motion` (sin animaciones, transiciones ni scroll suave).
- Skip-link implícito: scroll al primer error o al resultado.
- Navegación por teclado completa.

### Seguridad
- **Sin secretos en el cliente**: webhook público en `js/config.js`.
- **Sanitización anti-XSS** de entradas (`sanitizarTexto`).
- **Escape de HTML** antes de renderizar Markdown (`escaparHTML` en `markdown.js`).
- CSP-friendly: sin `eval`, sin `innerHTML` con datos de usuario sin escapar.

---

## Cómo ejecutar localmente

```bash
# 1. Clonar
git clone https://github.com/Neffex010/webapp-automatizacion-ia.git
cd webapp-automatizacion-ia

# 2. Servidor estático sin caché (necesario para ver cambios en JS/CSS)
# Opción A: Python (recomendado en el proyecto)
python nocache_server.py
# Sirve en http://127.0.0.1:8138 con cabeceras Cache-Control: no-store

# Opción B: VS Code Live Server / npx serve / php -S
```

> **Nota**: `python -m http.server` **no sirve** porque cachea agresivamente. Usa el `nocache_server.py` incluido (puerto 8138).

---

## Configuración

Edita `js/config.js` solo si cambia el endpoint:

```js
export const CONFIG = {
    WEBHOOK_URL: "https://TU_WEBHOOK.n8n.cloud/webhook/...",
    TIMEOUT_MS: 30000,
    MAX_PREGUNTA_LENGTH: 1000
};
```

---

## Formato de respuesta esperado (n8n → OpenAI → n8n → Web)

El webhook debe devolver **JSON** con forma:

```json
{
  "ok": true,
  "respuesta": "### Título\n\n**Concepto:** definición\n\n- item 1\n- item 2",
  "tema": "Redes",
  "nivel": "Intermedio",
  "integracion": "nativo"
}
```

Si `ok` es `false` o el HTTP no es 2xx, la app muestra el mensaje de error correspondiente.

---

## Flujo de trabajo

1. Usuario elige **Tema**, **Nivel**, **Integración** y escribe **Pregunta**.
2. Al enviar → **validación inline** → **carga con textos rotando** + `aria-busy`.
3. `fetch` POST al webhook (timeout 30 s).
4. **Éxito**: tarjeta de resultado con chips + Markdown renderizado + **Nueva consulta** + **Copiar/Descargar** (si implementado) + guardado en historial.
5. **Error**: alerta con mensaje específico + **Reintentar** (si es red/timeout/429/503).
6. **Nueva consulta**: limpia pregunta, conserva tema/nivel/integración, foco en textarea, scroll al formulario.
7. **Historial**: clic en "Consultas recientes" → lista de últimas 5 → clic para recuperar sin llamar al webhook.

---

## Responsive

- **≥ 576 px**: dos botones lado a lado, header con toggle a la derecha.
- **< 576 px**: botones apilados, header compacto, sombras reducidas (4 px), tarjetas con padding 1 rem.
- Probado en Chrome DevTools device toolbar (360 px, 414 px, 768 px, 1024 px).

---

## Commits principales

| Commit | Mensaje |
|--------|---------|
| `3f9d742` | feat: historial de consultas (5 entradas, cerrado por defecto) |
| `241d04c` | feat: botón Nueva consulta en la tarjeta de resultado |
| `cf182bc` | fix: modo oscuro correcto en acentos y texto de tarjetas |
| `9b1922e` | feat: mejoras de UX/UI (9 mejoras) |
| `832a4f0` | feat: renderizado seguro de Markdown y mensajes HTTP específicos |
| `87cff8d` | feat: manejo de errores HTTP, sanitización y reintento |
| `80a3c65` | feat: nombre del desarrollador y enlace al repositorio en el pie |
| `3037bdd` | style: rediseño neobrutalista |
| `45aa4c2` | feat: implementación de la webapp |
| `cb5bbc0` | chore: estructura inicial |

---

## Despliegue en GitHub Pages

1. Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`.
2. La app queda en `https://neffex010.github.io/webapp-automatizacion-ia/`.
3. Funciona **tal cual** (solo archivos estáticos, sin build).

---

## Licencia

MIT — uso académico y personal permitido.

---

## Autor

**Luis Enrique Cabrera García**  
TecNM Campus Pachuca  
Materia: *Inteligencia Artificial aplicada a las TIC*  

Repositorio: https://github.com/Neffex010/webapp-automatizacion-ia