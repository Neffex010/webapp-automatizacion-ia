# 3.4 Web app para automatización IA

Aplicación web académica que consulta un asistente de Inteligencia Artificial especializado en Tecnologías de la Información y Comunicaciones (TIC).

## Objetivo

Desarrollar una interfaz web responsiva que capture **Tema**, **Nivel**, **Pregunta** e **Integración**, envíe solicitudes HTTP POST a un Webhook de **n8n Cloud** y muestre las respuestas generadas por **OpenAI**, sin recargar la página.

## Historial de consultas

Las últimas **5** consultas exitosas se guardan en el `localStorage` del navegador (clave `nb-historial`). Se recuperan con un clic desde la tarjeta **Consultas recientes**, sin volver a llamar al webhook, y se pueden borrar en cualquier momento. No se envían a ningún servidor ni se comparten entre dispositivos.

## Arquitectura
