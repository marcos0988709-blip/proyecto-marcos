# Servidor gratis de Rocky

Hace que **tus amigos usen la IA sin sacar clave**. Más adelante también servirá para:
- tener los mismos datos en el iPhone y en el iPad;
- un calendario que se actualiza solo en el widget de la pantalla de bloqueo.

Funciona en **Cloudflare Workers, plan gratuito**: no pide tarjeta, así que no te pueden cobrar nada.

## Qué hace
| Ruta | Para qué |
|---|---|
| `/ai/...` | Pasa las peticiones de la app a Gemini con **tu clave**, que está guardada en el servidor y nadie ve. Cada móvil tiene un máximo diario (60 peticiones por defecto). |
| `/sync/<código>` | Guarda y devuelve los datos de un alumno con un código privado y largo. |
| `/cal/<código>.ics` | Calendario para suscribirse desde el móvil. |

Probado con `t_worker.mjs`: 18 de 18 pruebas bien (orígenes, límite diario, rutas bloqueadas, sync y calendario). También probado de punta a punta: la app sin clave contesta en el chat a través del servidor.

## Cómo subirlo (15 minutos, lo hacemos juntos)
1. **Cuenta de Cloudflare:** en dash.cloudflare.com, regístrate gratis con tu correo. No pide tarjeta.
2. **Clave de Gemini para el servidor:** en aistudio.google.com, crea una clave nueva **en un proyecto sin facturación**. Así, cuando se gaste el cupo gratis, simplemente para; nunca cobra.
3. **Espacio KV:** en Cloudflare ve a Storage & Databases → KV → Create, ponle de nombre `rocky` y copia su ID en `wrangler.toml` (`PEGA_AQUI_EL_ID_DEL_KV`).
4. **Tu web:** en `wrangler.toml` cambia `TU-USUARIO` por tu usuario de GitHub, para que solo la web de Rocky pueda usar el servidor.
5. **Subirlo:** desde esta carpeta:
   ```
   npx wrangler login
   npx wrangler secret put GEMINI_KEY     (pega la clave del paso 2)
   npx wrangler deploy
   ```
   Te dará una dirección del estilo `https://rocky.TU-USUARIO.workers.dev`.
6. **Encenderlo en la app:** en `docs/index.html` pon esa dirección en `const ROCKY_SERVER = "";`, sube la versión y publica. A partir de ahí:
   - quien no tenga clave usa la IA gratis de Rocky;
   - quien tenga clave propia sigue usando la suya, sin límite.

## Límites del plan gratis
- **Workers:** 100.000 peticiones al día.
- **KV:** 1.000 escrituras al día. Cada mensaje a la IA cuenta 1 (por el contador del límite diario), así que da para unos **1.000 mensajes de IA al día** entre todos. Para empezar con amigos sobra. Si crece, se sube de plan o se cambia el contador.
- **Gemini sin facturación:** tiene su propio cupo gratis. Si se acaba, la app avisa de que se ha llegado al límite y se renueva al día siguiente.

## Seguridad
- La clave de Gemini va como **secreto** de Cloudflare: no está en el código, ni en GitHub, ni en los móviles.
- Solo se aceptan peticiones desde la web de Rocky (`ALLOWED`) y solo a las rutas de la IA que usa la app.
