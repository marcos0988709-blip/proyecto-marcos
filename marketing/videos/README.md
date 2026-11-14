# Vídeos de Rocky (código)

Cada vídeo es una escena en 3D que se graba fotograma a fotograma: 1080×1920, 30 fps exactos, sin tirones.

- `common.js`: subtítulos estilo TikTok, tarjeta final, partículas y la R en 3D.
- `desk.js` + `povlib.js`: el escritorio de noche y las 4 fases de los vídeos POV (gancho, agobio, giro con Rocky y final).
- Vídeos: `pov.js`, `control.js`, `tres.js`, `horas.js`, `ejercicio.js`, `nueve.js`, `trucos.js`, `un10.js` y los de la semana 2 (`w2_*.js`).
- `render.js <vídeo>` graba el vídeo y le añade los efectos de `sfx.py`; `stills.js <vídeo> t1 t2…` saca fotogramas para revisarlo.

Para usarlo: `npm install` (instala three.js) y `node render.js pov`. Los vídeos salen en `out/`.
