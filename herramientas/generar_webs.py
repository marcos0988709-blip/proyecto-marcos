#!/usr/bin/env python3
"""Genera webs demo de una sola página para negocios locales sin web.

Uso:
    python3 herramientas/generar_webs.py

Escribe en webs/:
  - <slug>.html  web completa en un único archivo (fuentes incrustadas, sin dependencias externas)
  - index.html   panel con todas las demos, cómo contactar y qué verificar

Para añadir un negocio, copia una entrada de NEGOCIOS y cambia los datos.
"""
import base64
import html
import json
import re
import urllib.parse
from pathlib import Path
from string import Template

BASE = Path(__file__).resolve().parent
OUT = BASE.parent / "webs"
FONTS = BASE / "fonts"
YEAR = 2026

# ---------------------------------------------------------------- iconos (24x24, trazo)
ICONOS = {
    "spine": '<path d="M12 2v20M8 5h8M7 9h10M8 13h8M7 17h10"/>',
    "hand": '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8a8 8 0 0 0 16 0v-3a2 2 0 0 0-4 0"/>',
    "needle": '<path d="m18 2 4 4M15 5l4 4M3 21l9-9M12 6l6 6-8 8H4v-6z"/>',
    "run": '<circle cx="14" cy="4" r="2"/><path d="m6 22 4-8 3 3v5M9 9l3-2 3 3 3 1M7 13l2-4"/>',
    "dumbbell": '<path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12"/>',
    "heart": '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
    "apple": '<path d="M12 7c-2-2-6-1.5-6 3 0 5 3 9 6 9s6-4 6-9c0-4.5-4-5-6-3zM12 7c0-2 1-4 3-4"/>',
    "users": '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 0 1 0 6M21 20c0-2-1.5-4-4-4.5"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    "scissors": '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    "sparkle": '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    "drop": '<path d="M12 2s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z"/>',
    "eye": '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0 5 5L22 14l-8 8-2.3-2.3a4 4 0 0 0-5-5L2 10l8-8z"/>',
    "car": '<path d="M5 17h14M3 13l2-6h14l2 6v5H3zM7 17v2M17 17v2"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
    "spray": '<path d="M9 9h6v12H9zM10 9V5h4v4M17 4h.01M19 6h.01M17 8h.01"/>',
    "snow": '<path d="M12 2v20M4 7l16 10M20 7 4 17"/>',
    "check": '<path d="m5 12 5 5 9-10"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "pin": '<path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    "phone": '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    "home": '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    "activity": '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    "brush": '<path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L12 14.8 9.2 12z"/><path d="M9 12.5c-2.5 0-4 1.7-4 4 0 1.7-1 2.6-2 3 1 .7 2.6 1 4 1 2.8 0 5-2 5-4.8"/>',
    "zap": '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    "message": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    "flame": '<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z"/>',
    "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    "leaf": '<path d="M5 21c0-9 6-15 16-16-1 10-7 16-16 16zM5 21l7-7"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
}
WHATSAPP = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.8a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>')


def icono(nombre):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONOS[nombre]}</svg>')


# ---------------------------------------------------------------- tipografías (OFL, incrustadas)
FUENTES = {
    "Plus Jakarta Sans": ("plus-jakarta-sans-latin-wght-normal.woff2", "200 800"),
    "Outfit": ("outfit-latin-wght-normal.woff2", "100 900"),
    "DM Sans": ("dm-sans-latin-wght-normal.woff2", "100 1000"),
    "Cormorant Garamond": ("cormorant-garamond-latin-wght-normal.woff2", "300 700"),
    "Oswald": ("oswald-latin-wght-normal.woff2", "200 700"),
}


def font_face(familia):
    archivo, pesos = FUENTES[familia]
    datos = base64.b64encode((FONTS / archivo).read_bytes()).decode()
    return (f'@font-face{{font-family:"{familia}";font-style:normal;font-display:swap;'
            f'font-weight:{pesos};src:url(data:font/woff2;base64,{datos}) format("woff2")}}')


# ---------------------------------------------------------------- paletas (contraste AA comprobado)
def paleta(c1, c2, deep, soft, acc, btn, btn_ink):
    return dict(c1=c1, c2=c2, deep=deep, soft=soft, acc=acc, btn=btn, btn_ink=btn_ink)


PALETAS = {
    "fisio": [
        paleta("#0b5f59", "#2dd4bf", "#021a19", "#ecfdf8", "#0f766e", "#2dd4bf", "#022c29"),
        paleta("#0b3a66", "#38bdf8", "#020c1b", "#eff8ff", "#0369a1", "#38bdf8", "#04213a"),
        paleta("#14532d", "#4ade80", "#03140a", "#effdf3", "#15803d", "#4ade80", "#052e14"),
        paleta("#312e81", "#a5b4fc", "#0b0a24", "#eef2ff", "#4338ca", "#a5b4fc", "#1e1b4b"),
    ],
    "trainer": [
        paleta("#1c1917", "#f97316", "#0a0908", "#fff7ed", "#c2410c", "#f97316", "#1c0a02"),
        paleta("#18181b", "#a3e635", "#09090b", "#f7fee7", "#4d7c0f", "#a3e635", "#1a2e05"),
        paleta("#1f1215", "#fb7185", "#0c0507", "#fff1f2", "#be123c", "#fb7185", "#2a0610"),
        paleta("#0f172a", "#22d3ee", "#020617", "#ecfeff", "#0e7490", "#22d3ee", "#062a33"),
    ],
    "beauty": [
        paleta("#7a1d48", "#f472b6", "#22061a", "#fdf2f8", "#be185d", "#f472b6", "#3b0820"),
        paleta("#4c1d95", "#c4b5fd", "#150a2e", "#f5f3ff", "#6d28d9", "#c4b5fd", "#2e1065"),
        paleta("#7c2d12", "#fdba74", "#1f0b04", "#fff7ed", "#c2410c", "#fdba74", "#431407"),
        paleta("#1c1917", "#e0c27a", "#0c0a09", "#faf7f0", "#8a6116", "#e0c27a", "#1c1917"),
    ],
    "taller": [
        paleta("#0b1f3a", "#facc15", "#020817", "#f8fafc", "#a16207", "#facc15", "#0b1f3a"),
        paleta("#1f2937", "#f87171", "#0b0f17", "#fef2f2", "#b91c1c", "#f87171", "#2a0606"),
        paleta("#0c1d3b", "#60a5fa", "#030a17", "#eff6ff", "#1d4ed8", "#60a5fa", "#06142e"),
        paleta("#111827", "#fb923c", "#05070c", "#fff7ed", "#c2410c", "#fb923c", "#2a0e02"),
    ],
}

# ---------------------------------------------------------------- contenido por sector
SECTORES = {
    "fisio": dict(
        etiqueta="Fisioterapia", schema="Physiotherapy",
        cuerpo="Plus Jakarta Sans", titulos="Plus Jakarta Sans",
        heroes=["Vuelve a moverte sin dolor", "Menos dolor. Más vida.",
                "Tu recuperación, en buenas manos", "Recupera tu movimiento"],
        sub="Fisioterapia personalizada en {city}. Buscamos el origen de tu dolor y diseñamos un plan pensado solo para ti.",
        chips=["Sin necesidad de volante médico", "Tratamiento 100 % personalizado"],
        quick=("Pide tu cita", "Cuéntanos qué te pasa y te buscamos hueco."),
        serv=("Tratamientos", "¿En qué podemos ayudarte?",
              "Cada lesión es distinta. Por eso adaptamos cada tratamiento a ti, a tu ritmo y a tus objetivos."),
        servicios=[
            ("hand", "Terapia manual", "Técnicas manuales para aliviar el dolor y recuperar movilidad desde las primeras sesiones."),
            ("spine", "Espalda y cuello", "Lumbalgias, cervicalgias, contracturas y ese dolor que vuelve una y otra vez."),
            ("run", "Lesiones deportivas", "Esguinces, sobrecargas y roturas: recuperación y vuelta segura a tu deporte."),
            ("needle", "Punción seca", "Tratamiento de puntos gatillo y dolor miofascial que no cede con otras técnicas."),
            ("dumbbell", "Ejercicio terapéutico", "Te enseñamos los ejercicios que necesitas para que la lesión no vuelva."),
            ("activity", "Recuperación postoperatoria", "Te acompañamos tras una cirugía o un traumatismo hasta que recuperes tu día a día."),
        ],
        about="En {short} creemos que cada paciente es único. Por eso dedicamos tiempo a escucharte, valoramos tu caso a fondo y diseñamos un tratamiento a tu medida para que vuelvas a tu vida sin dolor.",
        checks=["Valoración completa en la primera visita", "Tratamiento individualizado", "Ejercicios para que la lesión no vuelva"],
        pasos=("Así es tu tratamiento", [
            ("Valoración", "Escuchamos tu historia y exploramos a fondo para entender qué te pasa y por qué."),
            ("Plan a medida", "Diseñamos el tratamiento según tu lesión, tu ritmo y tus objetivos."),
            ("Autonomía", "Te damos las herramientas para mantenerte bien sin depender de nosotros."),
        ]),
        faq=[
            ("¿Necesito volante médico?", "No. Puedes pedir cita directamente, sin derivación."),
            ("¿Cuántas sesiones voy a necesitar?", "Depende de cada caso. Después de la primera valoración te damos una estimación honesta."),
            ("¿Qué ropa debo llevar?", "Ropa cómoda que permita trabajar bien la zona que vamos a tratar."),
            ("¿Cómo pido cita?", "{como_cita}"),
        ],
        contacto=("Pide tu cita", "Escríbenos o llámanos y te respondemos lo antes posible."),
        msg="Hola, me gustaría pedir cita de fisioterapia.",
    ),
    "trainer": dict(
        etiqueta="Entrenamiento personal", schema="SportsActivityLocation",
        cuerpo="Outfit", titulos="Outfit",
        heroes=["Entrena con un plan. Consigue resultados.", "Más fuerte cada semana",
                "Tu mejor versión empieza hoy", "Entrena mejor, no más"],
        sub="Entrenamiento personal en {city}: técnica, constancia y un seguimiento real para que llegues a tu objetivo.",
        chips=["Para todos los niveles", "Plan adaptado a tus objetivos"],
        quick=("Empieza hoy", "Cuéntanos tu objetivo y te proponemos cómo empezar."),
        serv=("Servicios", "Elige cómo quieres entrenar",
              "Desde tu primera sesión hasta tu objetivo, con un plan que se adapta a ti y a tu día a día."),
        servicios=[
            ("dumbbell", "Entrenamiento personal", "Sesiones uno a uno adaptadas a tu nivel, con la técnica corregida en cada repetición."),
            ("users", "Grupos reducidos", "La motivación de entrenar en grupo con la atención de un entrenador."),
            ("flame", "Pérdida de grasa", "Fuerza y actividad combinadas para cambiar tu composición corporal."),
            ("heart", "Salud y movilidad", "Muévete mejor, sin molestias y con más energía en tu día a día."),
            ("apple", "Pautas de alimentación", "Hábitos sencillos y sostenibles que acompañan a tu entrenamiento."),
            ("target", "Seguimiento", "Medimos tu progreso para ajustar el plan y que no te estanques."),
        ],
        about="En {short} entrenamos con un objetivo claro: que consigas resultados y que duren. Cuidamos la técnica, ajustamos el plan a tu nivel y te acompañamos en cada paso.",
        checks=["Plan adaptado a tu nivel", "Técnica cuidada en cada sesión", "Seguimiento real de tu progreso"],
        pasos=("Así empezamos", [
            ("Primera sesión", "Conocemos tu punto de partida, tus objetivos y tu disponibilidad."),
            ("Tu plan", "Diseñamos un programa realista que puedas cumplir semana a semana."),
            ("Progreso", "Revisamos resultados y ajustamos para que sigas avanzando."),
        ]),
        faq=[
            ("¿Necesito experiencia previa?", "No. Adaptamos cada sesión a tu nivel, empieces de cero o no."),
            ("¿Cuántos días a la semana tengo que entrenar?", "Con dos o tres sesiones bien planificadas se consiguen muy buenos resultados."),
            ("¿Y si tengo alguna lesión o molestia?", "Cuéntanoslo antes de empezar y adaptamos los ejercicios a tu situación."),
            ("¿Cómo empiezo?", "{como_cita}"),
        ],
        contacto=("¿Empezamos?", "Escríbenos y te contamos cómo empezar a entrenar."),
        msg="Hola, me interesa empezar a entrenar. ¿Me das información?",
    ),
    "beauty": dict(
        etiqueta="Peluquería y estética", schema="BeautySalon",
        cuerpo="DM Sans", titulos="Cormorant Garamond",
        heroes=["Tu momento para cuidarte", "Sal sintiéndote increíble",
                "Belleza con mimo, cerca de ti", "Un rato solo para ti"],
        sub="Peluquería y estética en {city}. Atención cercana, productos de calidad y resultados que se notan.",
        chips=["Atención personalizada", "Asesoramiento sincero"],
        quick=("Reserva tu cita", "Escríbenos y te buscamos el hueco que mejor te venga."),
        serv=("Servicios", "Todo lo que necesitas para cuidarte",
              "Tratamientos pensados para ti, con productos de calidad y todo el mimo."),
        servicios=[
            ("scissors", "Corte y peinado", "Cortes que favorecen tus rasgos y son fáciles de llevar en el día a día."),
            ("drop", "Color y mechas", "Coloración, mechas y matices para un color luminoso y cuidado."),
            ("leaf", "Tratamientos capilares", "Hidratación y reparación para un pelo sano y con brillo."),
            ("sparkle", "Estética facial", "Higienes y tratamientos faciales para una piel cuidada y luminosa."),
            ("hand", "Manicura y pedicura", "Manos y pies cuidados y unas uñas impecables."),
            ("eye", "Cejas y pestañas", "Diseño de cejas y tratamientos para realzar tu mirada."),
        ],
        about="En {short} queremos que cada visita sea un momento para ti. Te escuchamos, te aconsejamos con sinceridad y cuidamos cada detalle para que salgas sintiéndote genial.",
        checks=["Asesoramiento sincero", "Productos de calidad", "Un rato solo para ti"],
        pasos=("Así cuidamos de ti", [
            ("Te escuchamos", "Hablamos de lo que quieres y te aconsejamos con sinceridad."),
            ("Cuidamos cada detalle", "Trabajamos con calma y con productos de calidad."),
            ("Sales sintiéndote genial", "Y con consejos para mantener el resultado en casa."),
        ]),
        faq=[
            ("¿Hace falta cita previa?", "Te recomendamos reservar para asegurarte tu hora."),
            ("¿Puedo pedir consejo antes?", "Claro. Escríbenos y te orientamos sin compromiso."),
            ("¿Qué productos utilizáis?", "Trabajamos con productos profesionales. Pregúntanos y te contamos cuáles son los más adecuados para ti."),
            ("¿Cómo reservo?", "{como_cita}"),
        ],
        contacto=("Reserva tu cita", "Escríbenos o llámanos y te buscamos hueco."),
        msg="Hola, me gustaría pedir cita.",
    ),
    "taller": dict(
        etiqueta="Taller mecánico", schema="AutoRepair",
        cuerpo="DM Sans", titulos="Oswald",
        heroes=["Tu coche, en buenas manos", "Mecánica honesta. Precio claro.",
                "Reparamos tu coche sin sorpresas", "Tu taller de confianza"],
        sub="Taller mecánico en {city}. Diagnóstico claro, presupuesto antes de reparar y trato de confianza.",
        chips=["Presupuesto antes de reparar", "Todas las marcas"],
        quick=("Pide cita o presupuesto", "Cuéntanos qué le pasa a tu coche y te decimos cuándo puedes traerlo."),
        serv=("Servicios", "Todo lo que tu coche necesita",
              "Del mantenimiento a la reparación, con un diagnóstico claro y sin sorpresas en la factura."),
        servicios=[
            ("wrench", "Mecánica general", "Motor, embrague, distribución, frenos y suspensión."),
            ("check", "Revisión y pre-ITV", "Puesta a punto para que pases la ITV a la primera."),
            ("drop", "Aceite y filtros", "Mantenimiento periódico según el plan de tu fabricante."),
            ("car", "Neumáticos", "Montaje, equilibrado y alineación de dirección."),
            ("spray", "Chapa y pintura", "Golpes, rayadas y reparación de carrocería."),
            ("snow", "Aire acondicionado", "Carga de gas y revisión del sistema de climatización."),
        ],
        about="En {short} reparamos cada coche como si fuera el nuestro. Te explicamos qué le pasa sin tecnicismos, te damos el presupuesto antes de empezar y te avisamos en cuanto está listo.",
        checks=["Presupuesto claro antes de empezar", "Mecánica para todas las marcas", "Trato cercano y de confianza"],
        pasos=("Así trabajamos", [
            ("Diagnóstico", "Revisamos tu vehículo y te explicamos qué le pasa, sin tecnicismos."),
            ("Presupuesto", "Te damos el precio antes de tocar nada. Sin sorpresas."),
            ("Reparación", "Lo arreglamos y te lo entregamos listo para circular."),
        ]),
        faq=[
            ("¿Trabajáis con todas las marcas?", "Sí, atendemos vehículos de todas las marcas."),
            ("¿Me dais presupuesto antes?", "Siempre. No reparamos nada sin tu aprobación."),
            ("¿Pierdo la garantía del fabricante si no voy al concesionario?", "No, siempre que el mantenimiento siga el plan oficial del fabricante."),
            ("¿Cómo pido cita?", "{como_cita}"),
        ],
        contacto=("Pide cita o presupuesto", "Llámanos o escríbenos y te atendemos lo antes posible."),
        msg="Hola, quería pedir cita o presupuesto para mi coche.",
    ),
}

PELUQUERIA = [
    ("scissors", "Corte", "Cortes para mujer y hombre que favorecen tus rasgos y se peinan solos."),
    ("drop", "Color", "Coloración y cobertura de canas con un acabado natural y luminoso."),
    ("sparkle", "Mechas", "Mechas y matices para dar luz y movimiento a tu pelo."),
    ("leaf", "Tratamientos capilares", "Hidratación y reparación para un pelo sano y con brillo."),
    ("brush", "Peinados y recogidos", "Para el día a día o para tus eventos especiales."),
    ("message", "Asesoramiento", "Te aconsejamos el corte y el color que mejor te van."),
]

# ---------------------------------------------------------------- negocios
# Datos públicos de directorios (Doctoralia, Fresha, Páginas Amarillas...). "verificar" = qué
# confirmar con el negocio antes de entregar la web.
NEGOCIOS = [
    # ---------- fisioterapia
    dict(slug="claudia-ardid", sector="fisio", nombre="Claudia Ardid Fisioterapia", corto="Claudia Ardid",
         city="Tarragona", addr="C/ del Cardenal Cervantes, 23, bajos B", cp="43001", tel="618 44 82 33",
         hero="Recupera tu movimiento",
         sub="Fisioterapia traumatológica, deportiva e invasiva en Tarragona. Y si no puedes venir, vamos a tu casa.",
         chips=["También a domicilio", "Traumatología y deporte"],
         servicios=[
             ("activity", "Fisioterapia traumatológica", "Esguinces, fracturas, tendinitis y lesiones articulares: recupera fuerza y movilidad."),
             ("run", "Fisioterapia deportiva", "Prevención y tratamiento de lesiones para que vuelvas a entrenar con seguridad."),
             ("needle", "Fisioterapia invasiva", "Técnicas como la punción seca para dolores y lesiones que no ceden."),
             ("home", "Fisioterapia a domicilio", "Si no puedes desplazarte, la sesión se hace en tu casa."),
             ("hand", "Terapia manual", "Técnicas manuales para aliviar el dolor y devolverte la movilidad."),
             ("dumbbell", "Ejercicio terapéutico", "Ejercicios pautados para que la lesión no vuelva."),
         ],
         verificar="Los directorios dan varias direcciones (Cardenal Cervantes 23; Av. Catalunya 22D, Clínica Vida'm; C/ Josep Català Rufà 1). Pregúntale cuál quiere en la web."),
    dict(slug="carlos-del-egido", sector="fisio", nombre="Carlos del Egido · Fisioterapia y Osteopatía", corto="Carlos del Egido",
         city="Tarragona", addr="C/ de Sant Llorenç, 12, 1.º 1.ª", cp="43003", tel="629 328 606",
         hero="Trata el origen de tu dolor",
         sub="Fisioterapia, osteopatía y acupuntura en el centro de Tarragona. Un enfoque global para que vuelvas a moverte sin dolor.",
         chips=["Fisioterapeuta colegiado n.º 7644", "Osteópata DO y acupuntor", "Visitas a domicilio"],
         servicios=[
             ("hand", "Fisioterapia", "Tratamiento del dolor muscular y articular con técnicas manuales y ejercicio."),
             ("user", "Osteopatía", "Un enfoque global del cuerpo para tratar el origen del dolor, no solo el síntoma."),
             ("needle", "Acupuntura", "Acupuntura como complemento para aliviar el dolor y la tensión."),
             ("spine", "Columna vertebral", "Lumbalgias, cervicalgias y otras alteraciones de la columna."),
             ("run", "Fisioterapia deportiva", "Prevención y recuperación de lesiones, con gimnasia terapéutica."),
             ("home", "A domicilio", "Si no puedes desplazarte, la sesión se hace en tu casa."),
         ],
         about="Carlos del Egido es fisioterapeuta, osteópata DO y acupuntor en Tarragona. Combina las tres disciplinas para tratar el origen de tu dolor, con especial dedicación a la columna y a la medicina deportiva.",
         verificar="Doctoralia también lo sitúa en Rambla Nova 103 (Edificio Atlántico). Confirmar dirección y n.º de colegiado."),
    dict(slug="eric-vicens", sector="fisio", nombre="Eric Vicens · Centre de Fisioteràpia", corto="Eric Vicens",
         city="Tarragona", addr="C/ d'Higini Anglès, 4, local 18", cp="43001", tel="615 23 29 00",
         hero="Menos dolor. Más vida.",
         chips=["Más de 200 opiniones de pacientes en Doctoralia", "Fisioterapia invasiva y terapia manual"],
         servicios=[
             ("needle", "Fisioterapia invasiva", "Punción seca y otras técnicas para dolores y lesiones que no ceden."),
             ("hand", "Terapia manual", "Técnicas manuales para aliviar el dolor y recuperar movilidad."),
             ("heart", "Quiromasaje", "Masaje terapéutico para descargar tensión y contracturas."),
             ("spine", "Espalda y cuello", "Lumbalgias, cervicalgias y ese dolor que vuelve una y otra vez."),
             ("run", "Lesiones deportivas", "Recuperación y vuelta segura a tu deporte."),
             ("dumbbell", "Ejercicio terapéutico", "Ejercicios pautados para que la lesión no vuelva."),
         ],
         verificar="Los directorios dan otro teléfono y una 2.ª sede (Clínica Cicles, C/ Cardenal Vidal i Barraquer 24). Confirmar el teléfono antes de escribir."),
    dict(slug="nuria-barcelona", sector="fisio", nombre="Fisioteràpia Núria Barcelona", corto="Núria Barcelona",
         city="Tarragona", addr="Rambla Nova, 78, 1.º 1.ª B", cp="43003", tel="977 24 11 18",
         hero="Tu recuperación, en buenas manos",
         sub="Fisioterapia personalizada en plena Rambla Nova de Tarragona. Buscamos el origen de tu dolor y diseñamos un plan pensado solo para ti.",
         verificar="Solo teléfono fijo: llamar. Solo aparece en Fresha."),
    dict(slug="fisiovital", sector="fisio", nombre="FisioVital", corto="FisioVital", mono="FV",
         city="Tarragona", addr="Av. de Roma, 14, entlo. 3.ª", cp="43005", tel="977 21 34 68",
         hero="Vuelve a moverte sin dolor",
         verificar="Solo teléfono fijo: llamar. En Doctoralia figura como «FisioVital»; confirmar el nombre comercial."),
    dict(slug="cenfis-funcional", sector="fisio", nombre="Cenfis Funcional", corto="Cenfis Funcional", mono="CF",
         city="Cambrils", addr="C/ de Santa Joaquima de Vedruna, 4, bajos", cp="43850",
         tel="607 39 52 57", tel2="977 79 22 55",
         hero="Recupera tu cuerpo. Recupera tu día a día.",
         sub="Fisioterapia y recuperación funcional en Cambrils para prevenir, tratar y recuperar. También a domicilio.",
         chips=["Servicio a domicilio", "Fisioterapia y recuperación funcional"],
         servicios=[
             ("hand", "Fisioterapia", "Tratamiento del dolor y las lesiones con técnicas manuales y ejercicio."),
             ("activity", "Recuperación funcional", "Recupera fuerza, movilidad y autonomía tras una lesión o una operación."),
             ("shield", "Prevención", "Detectamos y corregimos lo que puede acabar en lesión."),
             ("spine", "Espalda y cuello", "Lumbalgias, cervicalgias y contracturas."),
             ("run", "Lesiones deportivas", "Recuperación y vuelta segura a tu deporte."),
             ("home", "A domicilio", "Si no puedes desplazarte, vamos a tu casa."),
         ],
         about="Cenfis Funcional es un centro de fisioterapia y recuperación funcional en Cambrils. Nuestro objetivo es prevenir, tratar y recuperar: que vuelvas a hacer tu vida con normalidad y que no vuelva a pasar.",
         verificar="Móvil 607 39 52 57 (WhatsApp) y fijo 977 79 22 55, según Páginas Amarillas."),
    dict(slug="axis-cambrils", sector="fisio", nombre="Axis · Centro de Fisioterapia", corto="Axis Fisioterapia", mono="AX",
         city="Cambrils", addr="C/ de Sant Josep, 15", cp="43850", tel="977 79 54 33",
         hero="Menos dolor. Más vida.",
         chips=["Rehabilitación a domicilio", "Tratamiento 100 % personalizado"],
         servicios=[
             ("hand", "Terapia manual", "Técnicas manuales para aliviar el dolor y recuperar movilidad."),
             ("spine", "Espalda y cuello", "Lumbalgias, cervicalgias y contracturas."),
             ("run", "Lesiones deportivas", "Recuperación y vuelta segura a tu deporte."),
             ("activity", "Rehabilitación", "Recupera fuerza y movilidad tras una lesión o una cirugía."),
             ("dumbbell", "Ejercicio terapéutico", "Ejercicios pautados para que la lesión no vuelva."),
             ("home", "Rehabilitación a domicilio", "Si no puedes desplazarte, la rehabilitación se hace en tu casa."),
         ],
         verificar="Solo teléfono fijo: llamar. Doctoralia indica rehabilitación a domicilio."),
    # ---------- entrenamiento
    dict(slug="hawks-training", sector="trainer", nombre="Hawks Training", corto="Hawks Training", mono="HT",
         city="Tarragona", addr="Av. dels Països Catalans, 28, local 2", cp="43007", tel="692 50 53 09",
         hero="Entrena con un plan. Consigue resultados.",
         verificar="Un directorio asocia también esta dirección y teléfono a «M.C. Personal Trainer». Confirmar."),
    dict(slug="the-iron-path", sector="trainer", nombre="The Iron Path", corto="The Iron Path", mono="IP",
         city="Tarragona", addr="C/ del Vidre, 11", cp="43003", tel="672 98 86 89",
         hero="Más fuerte cada semana",
         sub="Entrenamiento de fuerza y entrenamiento personal en la Part Alta de Tarragona, con técnica, progresión y seguimiento real.",
         servicios=[
             ("dumbbell", "Entrenamiento de fuerza", "Aprende a levantar con técnica y progresa semana a semana."),
             ("user", "Entrenamiento personal", "Sesiones uno a uno centradas en tu objetivo."),
             ("users", "Grupos reducidos", "La energía del grupo con la atención de un entrenador."),
             ("flame", "Pérdida de grasa", "Fuerza y hábitos para cambiar tu composición corporal."),
             ("heart", "Movilidad y salud", "Muévete mejor y sin molestias."),
             ("target", "Seguimiento", "Medimos tu progreso para que no te estanques."),
         ],
         verificar="Fresha muestra también el 639 84 67 22 (compartido con TRIFIT / Johana Silva). Confirmar cuál es el suyo."),
    dict(slug="damian-gomez", sector="trainer", nombre="Damián Gómez · Entrenamiento y Nutrición", corto="Damián Gómez", mono="DG",
         city="Tarragona", addr=None, tel="620 38 38 08",
         hero="Entrena mejor. Come mejor.",
         sub="Entrenamiento personal y coaching nutricional en Tarragona, sin dietas imposibles ni planes que no puedes cumplir.",
         chips=["Entrenamiento + nutrición", "Plan adaptado a tus objetivos"],
         servicios=[
             ("dumbbell", "Entrenamiento personal", "Sesiones adaptadas a tu nivel, con la técnica corregida en cada repetición."),
             ("apple", "Coaching nutricional", "Aprende a comer mejor con pautas sencillas que encajan en tu vida."),
             ("flame", "Pérdida de grasa", "Entrenamiento y alimentación trabajando juntos."),
             ("activity", "Ganar masa muscular", "Un plan de fuerza y nutrición para ganar músculo de forma progresiva."),
             ("leaf", "Hábitos saludables", "Pequeños cambios que se mantienen en el tiempo."),
             ("target", "Seguimiento", "Revisamos tu progreso y ajustamos el plan."),
         ],
         about="Damián Gómez es entrenador personal y coach nutricional. Une entrenamiento y alimentación en un mismo plan, porque los resultados llegan cuando las dos cosas van de la mano.",
         verificar="Sin dirección pública: la web solo dice Tarragona. Pregúntale dónde entrena."),
    dict(slug="gerard-torres", sector="trainer", nombre="Gerard Torres · Entrenador Personal", corto="Gerard Torres", mono="GT",
         city="Tarragona", addr="C/ de Joan Baptista Plana, 15", tel="618 77 05 27",
         hero="Tu mejor versión empieza hoy",
         verificar="Muy pocos datos públicos. Confirmar la dirección."),
    dict(slug="mc-personal-trainer", sector="trainer", nombre="M.C. Personal Trainer & Coach", corto="M.C. Personal Trainer", mono="MC",
         city="Salou", addr="Av. de Pere Molas, 100", cp="43840", tel="664 77 67 65",
         hero="Entrena mejor, no más",
         verificar="Otros listados le dan otros teléfonos (683 27 28 51) y una dirección en Tarragona. Confirmar."),
    dict(slug="mueve-t", sector="trainer", nombre="Mueve T", corto="Mueve T", mono="MT",
         city="Altafulla", addr=None, tel="663 29 47 74",
         hero="Muévete. Siéntete mejor.",
         sub="Entrenamiento personal en Altafulla para ganar fuerza, energía y salud a tu ritmo.",
         verificar="Muy pocos datos públicos. Pregunta dónde y cómo entrena."),
    # ---------- belleza
    dict(slug="perruqueria-pau", sector="beauty", nombre="Estètica Perruqueria Pau", corto="Perruqueria Pau", mono="Pau",
         city="Tarragona", addr="C/ de Pau del Protectorat, 26", tel="653 49 86 55",
         hero="Tu momento para cuidarte",
         verificar="Pocos datos públicos. Confirmar nombre exacto y dirección."),
    dict(slug="lori-ari", sector="beauty", nombre="Estética y Peluquería Lori Ari", corto="Lori Ari", mono="LA",
         city="Tarragona", addr="Via Augusta, 35", cp="43003", tel="615 76 37 68",
         hero="Sal sintiéndote increíble",
         verificar="Hay dos fichas: Via Augusta 35 / 615 76 37 68 y C/ Mossèn Ritort i Faus 5 / 663 90 76 18. Confirmar cuál es la actual."),
    dict(slug="encarni", sector="beauty", nombre="Encarni · Centro de Estética", corto="Encarni Estética", mono="E",
         etiqueta="Centro de estética", schema="BeautySalon",
         city="Tarragona", addr="C/ de Francesc Bastos, 10", cp="43005", tel="629 82 28 26", tel2="977 24 35 06",
         hero="Una piel que se nota cuidada",
         sub="Centro de estética en Tarragona especializado en tratamientos faciales. Atención cercana para que salgas sintiéndote bien.",
         chips=["Especialistas en tratamientos faciales", "También faciales para hombre"],
         servicios=[
             ("sparkle", "Tratamientos faciales", "Tratamientos adaptados a tu tipo de piel para que luzca sana y luminosa."),
             ("drop", "Limpieza facial profunda", "Limpieza con extracciones para una piel limpia y sin impurezas."),
             ("user", "Faciales para hombre", "Cuidado facial pensado para la piel masculina."),
             ("eye", "Depilación con hilo", "Técnica precisa para cejas y rostro, ideal para pieles sensibles."),
             ("brush", "Diseño de cejas", "Cejas definidas y en armonía con tu rostro."),
             ("message", "Asesoramiento de piel", "Te recomendamos el tratamiento y la rutina que tu piel necesita."),
         ],
         about="En Encarni cuidamos tu piel con tratamientos faciales a tu medida. Te escuchamos, analizamos qué necesita tu piel y te aconsejamos con sinceridad para que salgas sintiéndote genial.",
         verificar="Dos teléfonos en directorios: 629 82 28 26 (móvil) y 977 24 35 06 (fijo)."),
    dict(slug="peluqueria-pina", sector="beauty", nombre="Peluquería Pina", corto="Peluquería Pina", mono="P",
         etiqueta="Peluquería", schema="HairSalon",
         city="Tarragona", addr="C/ de Canyelles, 3", tel="977 23 78 25",
         hero="Tu pelo, en las mejores manos",
         sub="Peluquería en Tarragona. Cortes, color y tratamientos con un trato cercano y resultados que se notan.",
         chips=["Asesoramiento personalizado", "Mujer y hombre"],
         servicios=PELUQUERIA,
         about="En Peluquería Pina queremos que salgas con un pelo que te encante y que sea fácil de llevar. Te escuchamos, te aconsejamos y cuidamos cada detalle.",
         verificar="Solo una ficha encontrada (Zokko). Confirmar que sigue abierta antes de llamar. Solo fijo."),
    dict(slug="vibe-estilistes", sector="beauty", nombre="Vibe Estilistes", corto="Vibe Estilistes", mono="V",
         city="Tarragona", addr="C/ d'Amposta, 39 (Torreforta)", cp="43006", tel="977 54 15 13",
         hero="Tu mejor versión, para cada ocasión",
         sub="Peluquería y estética en Torreforta: del día a día a tu boda, con un equipo que te escucha.",
         chips=["Novias y eventos", "Peluquería y estética"],
         servicios=[
             ("scissors", "Peluquería y peinados", "Corte, color y peinados para el día a día y para tus eventos."),
             ("brush", "Maquillaje de novia", "Maquillaje que dura todo el día y queda perfecto en las fotos."),
             ("hand", "Manicura y pedicura", "Manos y pies cuidados y unas uñas impecables."),
             ("sparkle", "Tratamientos faciales", "Para una piel limpia, cuidada y luminosa."),
             ("drop", "Envolturas corporales", "Tratamientos corporales para relajarte y cuidar tu piel."),
             ("eye", "Lifting de pestañas", "Pestañas con curva y una mirada más abierta sin extensiones."),
         ],
         verificar="Bodas.net la lista como «VIBE Estilistes»; Fresha como «Vibe centro de estética». Solo fijo."),
    dict(slug="tonic", sector="beauty", nombre="Tonic · Instituto de Belleza", corto="Tonic", mono="T",
         etiqueta="Instituto de belleza",
         city="Tarragona", addr="C/ de Frederic Mompou, 10", cp="43005", tel="977 21 19 50",
         hours="Abierto también al mediodía",
         hero="Belleza con experiencia",
         sub="Instituto de belleza en Tarragona con más de 15 años de experiencia. Abrimos también al mediodía, para que encuentres tu hueco.",
         chips=["Más de 15 años de experiencia", "Abierto al mediodía"],
         servicios=[
             ("hand", "Manicura permanente", "Uñas perfectas durante semanas, sin desconchones."),
             ("sparkle", "Tratamiento estético del pie", "Pies cuidados, suaves y listos para lucir."),
             ("leaf", "Tratamientos faciales", "Para una piel limpia, hidratada y luminosa."),
             ("drop", "Tratamientos corporales", "Cuida tu piel y date un respiro."),
             ("zap", "Depilación con luz pulsada", "Reduce el vello de forma progresiva y duradera."),
             ("message", "Asesoramiento personalizado", "Te recomendamos lo que de verdad necesitas."),
         ],
         verificar="Solo fijo. Datos de Fresha y Páginas Amarillas (más de 15 años, abierto al mediodía)."),
    # ---------- talleres
    dict(slug="mecanica-alcover", sector="taller", nombre="Mecànica i Planxa Alcover", corto="Mecànica Alcover", mono="MA",
         city="Alcover", addr="Ctra. de Valls, km 1", cp="43460", tel="626 785 184", tel2="977 76 70 69",
         hours="Lunes a viernes · 9:00–13:00 y 15:00–19:00",
         hero="Mecánica y chapa, en un solo taller",
         sub="Taller en Alcover para mecánica y chapa. Diagnóstico claro, presupuesto antes de reparar y trato de confianza.",
         chips=["Mecánica y chapa", "Presupuesto antes de reparar"],
         servicios=[
             ("wrench", "Mecánica general", "Motor, embrague, distribución, frenos y suspensión."),
             ("spray", "Chapa y pintura", "Golpes, rayadas y reparación de carrocería."),
             ("check", "Revisión y pre-ITV", "Puesta a punto para que pases la ITV a la primera."),
             ("drop", "Aceite y filtros", "Mantenimiento periódico según el plan de tu fabricante."),
             ("zap", "Diagnosis", "Localizamos la avería y te explicamos qué le pasa a tu coche."),
             ("shield", "Frenos y suspensión", "Revisión y cambio para circular con seguridad."),
         ],
         verificar="Dos teléfonos: 626 785 184 (móvil) y 977 76 70 69 (fijo). Horario según directorio (puede haber cambiado)."),
    dict(slug="tallers-vebor", sector="taller", nombre="Tallers Ve-bor", corto="Tallers Ve-bor", mono="VB",
         city="Tarragona", addr="C/ del Baró de les Quatre Torres, 8", cp="43002", tel="977 21 83 83",
         hero="Tu coche, en buenas manos",
         servicios=[
             ("wrench", "Mecánica para todas las marcas", "Motor, embrague, distribución, frenos y suspensión."),
             ("spray", "Chapa y pintura", "Golpes, rayadas y reparación de carrocería."),
             ("snow", "Aire acondicionado", "Carga de gas y reparación del sistema de climatización."),
             ("check", "Revisión y pre-ITV", "Puesta a punto para que pases la ITV a la primera."),
             ("drop", "Aceite y filtros", "Mantenimiento periódico según el plan de tu fabricante."),
             ("car", "Neumáticos", "Montaje, equilibrado y alineación."),
         ],
         verificar="No aparece en búsquedas recientes: llama primero para confirmar que sigue abierto. Solo fijo."),
    dict(slug="tallers-vallverdu", sector="taller", nombre="Tallers Vallverdú", corto="Tallers Vallverdú", mono="TV",
         city="Tarragona", addr="C/ de la Reina Maria Cristina, 21 bis", cp="43002", tel="977 23 44 30",
         hero="Mecánica honesta. Precio claro.",
         verificar="No aparece en búsquedas recientes: llama primero para confirmar que sigue abierto. Solo fijo."),
    dict(slug="tallers-amezcua", sector="taller", nombre="Tallers Amezcua", corto="Tallers Amezcua", mono="TA",
         city="Tarragona", addr="C/ d'Orosi, 8", cp="43004", tel="977 23 04 04",
         hero="Reparamos tu coche sin sorpresas",
         verificar="No aparece en búsquedas recientes: llama primero para confirmar que sigue abierto. Solo fijo."),
]

# Autónomos: el primer mensaje les habla de tú y, si se sabe, por su nombre.
TUTEO = {"claudia-ardid": "Claudia", "carlos-del-egido": "Carlos", "eric-vicens": "Eric", "nuria-barcelona": "Núria",
         "damian-gomez": "Damián", "gerard-torres": "Gerard", "mc-personal-trainer": None}

# ---------------------------------------------------------------- utilidades
e = html.escape
STOP = {"de", "del", "la", "las", "los", "el", "i", "y", "&", "·", "d'", "l'"}


def digitos(tel):
    return re.sub(r"\D", "", tel or "")


def es_movil(tel):
    d = digitos(tel)
    return len(d) == 9 and d[0] in "67"


def numero_whatsapp(n):
    return next((t for t in (n["tel"], n.get("tel2")) if t and es_movil(t)), None)


def mensaje_contacto(n):
    """Primer mensaje por WhatsApp, o guion de llamada si el negocio solo tiene fijo."""
    tu = n["slug"] in TUTEO
    pila = TUTEO.get(n["slug"])
    if numero_whatsapp(n):
        saludo = f"Hola {pila}!" if pila else "Hola!"
        if tu:
            return (f"{saludo} Soy Marcos, de Tarragona 👋 He visto que no tienes web propia y te he preparado esta "
                    "propuesta de diseño, sin compromiso. Si te gusta, te paso el enlace para que la veas entera en el móvil.")
        return (f"{saludo} Soy Marcos, de Tarragona 👋 He visto que {n['corto']} no tiene web propia y os he preparado "
                "esta propuesta de diseño, sin compromiso. Si os gusta, os paso el enlace para que la veáis entera en el móvil.")
    if tu:
        return (f"Hola, ¿hablo con {pila or n['corto']}? Soy Marcos, de Tarragona. He visto que no tienes web propia y te he "
                "preparado un diseño, sin compromiso. ¿Te lo envío por WhatsApp o por email para que lo veas?")
    return (f"Hola, ¿hablo con {n['corto']}? Soy Marcos, de Tarragona. He visto que no tenéis web propia y os he preparado "
            "un diseño, sin compromiso. ¿Os lo envío por WhatsApp o por email para que lo veáis?")


def enlace_whatsapp(numero, texto):
    return f"https://wa.me/34{digitos(numero)}?text={urllib.parse.quote(texto)}"


def rgb(hexa):
    h = hexa.lstrip("#")
    return " ".join(str(int(h[i:i + 2], 16)) for i in (0, 2, 4))


def monograma(texto):
    palabras = [p for p in re.split(r"[\s·]+", texto) if p and p.lower() not in STOP]
    if len(palabras) >= 2:
        return (palabras[0][0] + palabras[1][0]).upper()
    return palabras[0][:2].capitalize()


def favicon(c1, c2, mono):
    tam = 30 if len(mono) == 1 else (24 if len(mono) == 2 else 19)
    svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>"
           f"<stop offset='0' stop-color='{c1}'/><stop offset='1' stop-color='{c2}'/></linearGradient></defs>"
           "<rect width='64' height='64' rx='16' fill='url(#g)'/>"
           f"<text x='32' y='{32 + tam * 0.36:.0f}' font-family='Arial,Helvetica,sans-serif' font-size='{tam}' font-weight='700' "
           f"fill='white' text-anchor='middle'>{e(mono)}</text></svg>")
    return "data:image/svg+xml," + urllib.parse.quote(svg)


def icono_mas(color):
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='{color}' "
           "stroke-width='2.4' stroke-linecap='round'><path d='M12 5v14M5 12h14'/></svg>")
    return 'url("data:image/svg+xml,' + urllib.parse.quote(svg) + '")'


# ---------------------------------------------------------------- CSS común
CSS = """
*,*::before,*::after{box-sizing:border-box}
*{margin:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{font-family:var(--bf),system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:16px;line-height:1.6;color:var(--ink);background:#fff;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
svg{display:block}
a{color:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent}
button{font:inherit;-webkit-tap-highlight-color:transparent}
:focus-visible{outline:3px solid var(--c2);outline-offset:3px;border-radius:8px}
h1,h2,h3{font-family:var(--hf),system-ui,sans-serif;line-height:1.1;text-wrap:balance}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}
.skip{position:absolute;left:-9999px;top:8px;z-index:100;padding:10px 16px;border-radius:10px;background:#fff;color:var(--ink);font-weight:700}
.skip:focus{left:12px}
.demo{padding:7px 16px;background:var(--deep);color:rgb(255 255 255/.7);font-size:12.5px;text-align:center}
.demo b{color:#fff;font-weight:600}
.top{position:sticky;top:0;z-index:50;background:rgb(255 255 255/.86);-webkit-backdrop-filter:saturate(1.6) blur(14px);backdrop-filter:saturate(1.6) blur(14px);border-bottom:1px solid rgb(15 23 42/.07)}
.bar{display:flex;align-items:center;justify-content:space-between;gap:16px;height:70px}
.logo{display:flex;align-items:center;gap:11px;min-width:0;font-family:var(--hf),system-ui,sans-serif;font-size:18px;font-weight:700;letter-spacing:-.01em}
.mk{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;font-family:var(--bf),system-ui,sans-serif;font-size:14px;font-weight:800;letter-spacing:.02em;box-shadow:0 6px 16px -6px rgb(var(--c1rgb)/.6)}
.nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.links{display:flex;gap:28px;font-size:15px;font-weight:500;color:var(--mut)}
.links a{transition:color .2s ease}
.links a:hover{color:var(--acc)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 24px;border:0;border-radius:999px;font-size:16px;font-weight:700;line-height:1.1;white-space:nowrap;cursor:pointer;transition:transform .16s var(--ease-out),translate .2s var(--ease-out),box-shadow .2s ease,background-color .2s ease}
.btn svg{width:20px;height:20px;flex:none}
.btn:active{transform:scale(.97)}
.btn-main{background:var(--btn);color:var(--btn-ink);box-shadow:0 12px 28px -14px rgb(var(--c2rgb)/.9)}
.btn-line{color:#fff;box-shadow:inset 0 0 0 1.5px rgb(255 255 255/.35)}
.btn-sm{min-height:42px;padding:0 18px;font-size:14px}
@media (hover:hover) and (pointer:fine){
.btn-main:hover{translate:0 -2px;box-shadow:0 18px 34px -14px rgb(var(--c2rgb)/.95)}
.btn-line:hover{background:rgb(255 255 255/.08)}
}
.hero{position:relative;overflow:hidden;padding:clamp(56px,9vw,104px) 0 clamp(64px,10vw,120px);color:#fff;background:radial-gradient(60% 80% at 92% -10%,rgb(var(--c2rgb)/.42),transparent 60%),radial-gradient(45% 60% at -5% 105%,rgb(var(--c2rgb)/.16),transparent 65%),linear-gradient(160deg,var(--c1) 0%,var(--deep) 82%)}
.hero::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgb(255 255 255/.07) 1px,transparent 1px);background-size:24px 24px;-webkit-mask-image:linear-gradient(to bottom,#000 20%,transparent 90%);mask-image:linear-gradient(to bottom,#000 20%,transparent 90%)}
.rings{position:absolute;top:-200px;right:-240px;width:780px;max-width:none;height:auto;color:rgb(255 255 255/.07);pointer-events:none}
.hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.85fr);gap:clamp(32px,5vw,72px);align-items:center}
.kick{display:inline-flex;align-items:center;gap:10px;margin-bottom:24px;padding:8px 14px;border-radius:999px;background:rgb(255 255 255/.08);border:1px solid rgb(255 255 255/.14);font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.kick i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--c2);box-shadow:0 0 0 4px rgb(var(--c2rgb)/.22)}
.hero h1{margin-bottom:22px;font-size:clamp(40px,6.4vw,74px);font-weight:800;line-height:1.03;letter-spacing:-.035em}
.lead{max-width:52ch;margin-bottom:34px;font-size:clamp(17px,1.9vw,20px);color:rgb(255 255 255/.8)}
.cta{display:flex;flex-wrap:wrap;gap:12px}
.chips{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:30px}
.chips li{display:flex;align-items:center;gap:8px;font-size:14.5px;font-weight:600;color:rgb(255 255 255/.88)}
.chips svg{flex:none;width:18px;height:18px;color:var(--c2)}
.quick{padding:clamp(22px,3vw,32px);border-radius:26px;background:rgb(255 255 255/.07);border:1px solid rgb(255 255 255/.14);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:0 40px 80px -40px rgb(0 0 0/.6)}
.quick h2{margin-bottom:6px;font-size:24px;letter-spacing:-.02em}
.qs{margin-bottom:22px;font-size:15px;color:rgb(255 255 255/.7)}
.qlist{list-style:none;padding:0;display:grid;gap:16px;margin-bottom:24px}
.qlist li{display:flex;align-items:flex-start;gap:12px;font-size:15.5px;color:rgb(255 255 255/.92);overflow-wrap:anywhere}
.qlist svg{flex:none;width:20px;height:20px;margin-top:2px;color:var(--c2)}
.qlist a,.info a{text-decoration:underline;text-decoration-color:rgb(255 255 255/.3);text-underline-offset:3px}
.quick .btn{width:100%}
section{padding:clamp(68px,9vw,116px) 0}
.eyebrow{margin-bottom:12px;color:var(--acc);font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
h2{margin-bottom:16px;font-size:clamp(30px,4.3vw,50px);font-weight:800;letter-spacing:-.03em}
.intro{max-width:60ch;color:var(--mut);font-size:clamp(16px,1.6vw,18px)}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:48px}
.card{padding:28px;border-radius:22px;border:1px solid var(--line);background:#fff}
.ico{display:grid;place-items:center;width:52px;height:52px;margin-bottom:20px;border-radius:15px;background:var(--soft);color:var(--acc)}
.ico svg{width:24px;height:24px}
.card h3{margin-bottom:8px;font-size:19px;letter-spacing:-.01em}
.card p{color:var(--mut);font-size:15.5px}
.about,.faq{background:var(--soft)}
.about-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(36px,6vw,80px);align-items:center}
.big{margin-bottom:26px;font-size:clamp(17px,1.8vw,20px);color:#1e293b}
.checks{list-style:none;padding:0;display:grid;gap:14px}
.checks li{display:flex;align-items:center;gap:12px;font-weight:600}
.checks svg{flex:none;width:24px;height:24px;padding:5px;border-radius:50%;background:var(--acc);color:#fff}
.panel{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;gap:40px;min-height:380px;padding:clamp(26px,4vw,40px);border-radius:30px;color:#fff;background:linear-gradient(150deg,var(--c1),var(--deep));box-shadow:0 40px 80px -44px rgb(var(--c1rgb)/.9)}
.panel::before{content:"";position:absolute;top:-190px;right:-170px;width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,rgb(var(--c2rgb)/.55),transparent 66%)}
.panel::after{content:"";position:absolute;inset:0;background-image:radial-gradient(rgb(255 255 255/.08) 1px,transparent 1px);background-size:22px 22px;-webkit-mask-image:linear-gradient(to top,#000,transparent 70%);mask-image:linear-gradient(to top,#000,transparent 70%)}
.pm{position:relative;z-index:1;font-family:var(--hf),system-ui,sans-serif;font-size:clamp(88px,13vw,156px);font-weight:800;line-height:.85;letter-spacing:-.05em}
.pfoot{position:relative;z-index:1}
.pl{margin-bottom:14px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgb(255 255 255/.65)}
.pc{display:flex;flex-wrap:wrap;gap:8px}
.pc span{padding:8px 14px;border-radius:999px;background:rgb(255 255 255/.1);border:1px solid rgb(255 255 255/.16);font-size:14px;font-weight:600}
.steps{list-style:none;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:48px}
.steps li{padding:30px;border-radius:22px;border:1px solid var(--line);background:#fff}
.n{display:grid;place-items:center;width:46px;height:46px;margin-bottom:20px;border-radius:14px;background:var(--c1);color:#fff;font-family:var(--bf),system-ui,sans-serif;font-size:17px;font-weight:800}
.steps h3{margin-bottom:6px;font-size:20px}
.steps p{color:var(--mut)}
.faq-wrap{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(28px,5vw,72px);align-items:start}
.faq-wrap .intro a{color:var(--acc);font-weight:700;text-decoration:underline;text-underline-offset:3px}
details{border-bottom:1px solid rgb(15 23 42/.1)}
details:first-child{border-top:1px solid rgb(15 23 42/.1)}
summary{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 0;cursor:pointer;list-style:none;font-size:clamp(16px,1.7vw,18px);font-weight:700}
summary::-webkit-details-marker{display:none}
summary::after{content:"";flex:none;width:30px;height:30px;border-radius:50%;background:#fff var(--plus) center/14px no-repeat;box-shadow:inset 0 0 0 1px var(--line);transition:transform .25s var(--ease-out)}
details[open] summary::after{transform:rotate(45deg)}
details p{padding:0 46px 22px 0;color:var(--mut)}
.contact{position:relative;overflow:hidden;color:#fff;background:var(--deep)}
.contact::before{content:"";position:absolute;left:-260px;bottom:-420px;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgb(var(--c2rgb)/.22),transparent 65%);pointer-events:none}
.contact-grid{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:clamp(32px,5vw,64px);align-items:stretch}
.contact .eyebrow{color:var(--c2)}
.contact .intro{color:rgb(255 255 255/.7)}
.info{list-style:none;padding:0;display:grid;gap:20px;margin:32px 0 36px}
.info li{display:flex;align-items:flex-start;gap:14px;overflow-wrap:anywhere}
.info svg{flex:none;width:22px;height:22px;margin-top:2px;color:var(--c2)}
.info small{display:block;margin-bottom:2px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgb(255 255 255/.5)}
.map{position:relative;min-height:380px;overflow:hidden;border-radius:26px;border:1px solid rgb(255 255 255/.12);background-color:rgb(255 255 255/.04);background-image:linear-gradient(rgb(255 255 255/.05) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255/.05) 1px,transparent 1px);background-size:44px 44px}
.map-ph{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:28px;text-align:center}
.pin{display:grid;place-items:center;width:68px;height:68px;border-radius:50%;background:var(--btn);color:var(--btn-ink);box-shadow:0 0 0 12px rgb(var(--c2rgb)/.14),0 0 0 28px rgb(var(--c2rgb)/.06)}
.pin svg{width:30px;height:30px}
.map-ph p{max-width:32ch;color:rgb(255 255 255/.85);font-weight:600}
.map-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
.map iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
footer{padding:28px 0;background:#020617;color:#94a3b8;font-size:14px}
.foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px}
.float{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:60;display:grid;place-items:center;width:60px;height:60px;border-radius:50%;background:#1da851;color:#fff;box-shadow:0 14px 30px -10px rgb(0 0 0/.45);transition:transform .16s var(--ease-out)}
.float.call{background:var(--btn);color:var(--btn-ink)}
.float svg{width:30px;height:30px}
.float:active{transform:scale(.94)}
@media (hover:hover) and (pointer:fine){
.float:hover{transform:scale(1.06)}
.card{transition:translate .25s var(--ease-out),box-shadow .25s ease,border-color .25s ease}
.card:hover{translate:0 -4px;border-color:transparent;box-shadow:0 26px 50px -26px rgb(15 23 42/.25)}
}
.js .reveal{opacity:0;transform:translateY(16px);transition:opacity .7s var(--ease-out),transform .7s var(--ease-out)}
.js .reveal.on{opacity:1;transform:none}
.js .reveal [data-st]{opacity:0;transform:translateY(14px);transition:opacity .6s var(--ease-out) calc(var(--i,0)*70ms + 120ms),transform .6s var(--ease-out) calc(var(--i,0)*70ms + 120ms),translate .25s var(--ease-out),box-shadow .25s ease,border-color .25s ease}
.js .reveal.on [data-st]{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
html{scroll-behavior:auto}
.js .reveal,.js .reveal [data-st]{transform:none;transition:opacity .4s ease}
.btn,.float,.card,summary::after{transition:none}
.btn:active,.float:active{transform:none}
}
@media (max-width:980px){
.hero-grid,.about-grid,.contact-grid,.faq-wrap{grid-template-columns:minmax(0,1fr)}
.grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.steps{grid-template-columns:minmax(0,1fr)}
.links{display:none}
.panel{min-height:300px}
.quick{max-width:560px}
}
@media (max-width:620px){
.grid{grid-template-columns:minmax(0,1fr)}
.bar{height:64px}
.bar .btn{display:none}
.cta .btn{flex:1 1 100%}
.card,.steps li{padding:24px}
.map{min-height:320px}
.rings{width:560px;top:-160px;right:-300px}
.kick{font-size:11.5px;letter-spacing:.1em}
footer{padding-bottom:104px}
.foot{flex-direction:column}
}
.s-beauty h1,.s-beauty h2,.s-beauty h3,.s-beauty .pm,.s-beauty .logo{font-weight:600;letter-spacing:-.01em}
.s-beauty .hero h1{font-size:clamp(46px,7vw,84px);line-height:1}
.s-beauty .logo{font-size:21px}
.s-beauty .card h3,.s-beauty .steps h3{font-size:24px}
.s-beauty .quick h2{font-size:28px}
.s-taller h1,.s-taller h2,.s-taller .pm,.s-taller .logo{font-weight:600;letter-spacing:0;text-transform:uppercase}
.s-taller h3{font-weight:600;letter-spacing:0}
.s-taller .hero h1{line-height:1.02}
"""

JS = """(function(){var els=document.querySelectorAll(".reveal");
if(!("IntersectionObserver" in window)){for(var i=0;i<els.length;i++)els[i].classList.add("on");return}
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("on");io.unobserve(x.target)}})},{rootMargin:"0px 0px -10% 0px"});
for(var j=0;j<els.length;j++)io.observe(els[j])})();
(function(){var b=document.querySelector("[data-cargar-mapa]");if(!b)return;
b.addEventListener("click",function(){var m=document.getElementById("mapa");var f=document.createElement("iframe");
f.src=m.getAttribute("data-src");f.title="Mapa de ubicación";f.loading="lazy";f.referrerPolicy="no-referrer-when-downgrade";
m.appendChild(f);var p=b.closest(".map-ph");if(p)p.parentNode.removeChild(p)})})();"""

RINGS = ('<svg class="rings" viewBox="0 0 600 600" fill="none" stroke="currentColor" aria-hidden="true">'
         '<circle cx="300" cy="300" r="290"/><circle cx="300" cy="300" r="225"/>'
         '<circle cx="300" cy="300" r="160"/><circle cx="300" cy="300" r="95"/></svg>')

PAGINA = Template("""<!doctype html>
<html lang="es" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>$title</title>
<meta name="description" content="$desc">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="$c1">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="$title">
<meta property="og:description" content="$desc">
<link rel="icon" href="$favicon">
<script>document.documentElement.className="js"</script>
<script type="application/ld+json">$schema</script>
<style>
$fontfaces
$root
$css
</style>
</head>
<body class="s-$sector">
<a class="skip" href="#main">Saltar al contenido</a>
<div class="demo">Vista previa · <b>Propuesta de web para $corto</b></div>
<header class="top">
<div class="wrap bar">
<a class="logo" href="#inicio"><span class="mk" aria-hidden="true">$mono</span><span class="nm">$corto</span></a>
<nav class="links" aria-label="Secciones"><a href="#servicios">Servicios</a><a href="#nosotros">Nosotros</a><a href="#faq">Preguntas</a><a href="#contacto">Contacto</a></nav>
$cta_header
</div>
</header>
<main id="main">
<section class="hero" id="inicio">
$rings
<div class="wrap hero-grid">
<div>
<p class="kick"><i></i>$etiqueta · $city</p>
<h1>$hero</h1>
<p class="lead">$sub</p>
<div class="cta">$cta_hero<a class="btn btn-line" href="#servicios">$ver_servicios</a></div>
<ul class="chips">$chips</ul>
</div>
<aside class="quick" aria-label="Contacto rápido">
<h2>$quick_t</h2>
<p class="qs">$quick_s</p>
<ul class="qlist">$qlist</ul>
$cta_quick
</aside>
</div>
</section>
<section id="servicios">
<div class="wrap reveal">
<p class="eyebrow">$serv_eye</p>
<h2>$serv_h2</h2>
<p class="intro">$serv_intro</p>
<div class="grid">$cards</div>
</div>
</section>
<section class="about" id="nosotros">
<div class="wrap about-grid reveal">
<div>
<p class="eyebrow">Quiénes somos</p>
<h2>$corto</h2>
<p class="big">$about</p>
<ul class="checks">$checks</ul>
</div>
<div class="panel" aria-hidden="true">
<span class="pm">$mono</span>
<div class="pfoot"><p class="pl">$etiqueta · $city</p><div class="pc">$panel_chips</div></div>
</div>
</div>
</section>
<section>
<div class="wrap reveal">
<p class="eyebrow">Cómo trabajamos</p>
<h2>$pasos_h2</h2>
<ol class="steps">$pasos</ol>
</div>
</section>
<section class="faq" id="faq">
<div class="wrap faq-wrap reveal">
<div><p class="eyebrow">Preguntas frecuentes</p><h2>Resolvemos tus dudas</h2><p class="intro">¿Tienes otra pregunta? $faq_contacto</p></div>
<div>$faq</div>
</div>
</section>
<section class="contact" id="contacto">
<div class="wrap contact-grid reveal">
<div>
<p class="eyebrow">Contacto</p>
<h2>$contacto_h2</h2>
<p class="intro">$contacto_intro</p>
<ul class="info">$info</ul>
<div class="cta">$cta_contacto</div>
</div>
$mapa
</div>
</section>
</main>
<footer><div class="wrap foot"><span>© $year $nombre</span><span>$pie</span></div></footer>
$flotante
<script>
$js
</script>
</body>
</html>
""")


def construir(n, indice_sector):
    s = SECTORES[n["sector"]]
    p = PALETAS[n["sector"]][indice_sector % len(PALETAS[n["sector"]])]
    city, corto, nombre = n["city"], n["corto"], n["nombre"]
    mono = n.get("mono") or monograma(corto)
    etiqueta = n.get("etiqueta", s["etiqueta"])
    hero = n.get("hero") or s["heroes"][indice_sector % len(s["heroes"])]
    sub = n.get("sub") or s["sub"].format(city=city)
    tel, tel2 = n["tel"], n.get("tel2")
    wa = numero_whatsapp(n)
    wa_url = enlace_whatsapp(wa, s["msg"]) if wa else None
    tel_url = f"tel:+34{digitos(tel)}"
    addr = n.get("addr")
    lugar = f"{addr}, {city}" if addr else city
    consulta = urllib.parse.quote(f"{nombre}, {addr + ', ' if addr else ''}{n.get('cp', '')} {city}".replace(" ,", ","))

    def boton(clase="btn btn-main", extra=""):
        if wa_url:
            return f'<a class="{clase}" href="{wa_url}"{extra}>{WHATSAPP}Escríbenos por WhatsApp</a>'
        return f'<a class="{clase}" href="{tel_url}"{extra}>{icono("phone")}Llamar ahora</a>'

    if wa_url:
        cta_header = f'<a class="btn btn-main btn-sm" href="{wa_url}">{WHATSAPP}WhatsApp</a>'
        como_cita = "Escríbenos por WhatsApp o llámanos y te buscamos hueco lo antes posible."
        faq_contacto = f'<a href="{wa_url}">Escríbenos por WhatsApp</a>.'
        flotante = f'<a class="float" href="{wa_url}" aria-label="Escribir por WhatsApp">{WHATSAPP}</a>'
    else:
        cta_header = f'<a class="btn btn-main btn-sm" href="{tel_url}">{icono("phone")}Llamar</a>'
        como_cita = f"Llámanos al {tel} y te buscamos hueco lo antes posible."
        faq_contacto = f'<a href="{tel_url}">Llámanos al {e(tel)}</a>.'
        flotante = f'<a class="float call" href="{tel_url}" aria-label="Llamar al {e(tel)}">{icono("phone")}</a>'

    chips_txt = n.get("chips") or s["chips"]
    chips = "".join(f"<li>{icono('check')}{e(c)}</li>" for c in chips_txt)

    def tel_li(t, clase_svg="phone"):
        etiqueta_tel = " · WhatsApp" if es_movil(t) else ""
        return f'{icono(clase_svg)}<span><a href="tel:+34{digitos(t)}">{e(t)}</a>{etiqueta_tel}</span>'

    horario = n.get("hours") or ("Consúltanos el horario por WhatsApp" if wa_url else "Consúltanos el horario por teléfono")
    qlist = [f'<li>{icono("pin")}<span>{e(lugar)}</span></li>', f"<li>{tel_li(tel)}</li>"]
    if tel2:
        qlist.append(f"<li>{tel_li(tel2)}</li>")
    qlist.append(f'<li>{icono("clock")}<span>{e(horario)}</span></li>')

    servicios = n.get("servicios") or s["servicios"]
    cards = "".join(
        f'<article class="card" data-st style="--i:{i}"><div class="ico">{icono(k)}</div><h3>{e(t)}</h3><p>{e(d)}</p></article>'
        for i, (k, t, d) in enumerate(servicios))
    checks = "".join(f"<li>{icono('check')}{e(c)}</li>" for c in s["checks"])
    panel_chips = "".join(f"<span>{e(t)}</span>" for _, t, _ in servicios[:3])
    pasos_h2, pasos_lista = s["pasos"]
    pasos = "".join(
        f'<li data-st style="--i:{i}"><span class="n">{i + 1}</span><h3>{e(t)}</h3><p>{e(d)}</p></li>'
        for i, (t, d) in enumerate(pasos_lista))
    # Sin móvil no hay WhatsApp: los textos invitan a llamar en vez de a escribir.
    def canal(texto):
        if wa_url:
            return texto
        for antes, despues in (("Escríbenos o llámanos", "Llámanos"), ("Llámanos o escríbenos", "Llámanos"),
                               ("te respondemos lo antes posible", "te atendemos encantados"),
                               ("Escríbenos", "Llámanos")):
            texto = texto.replace(antes, despues)
        return texto

    faq = "".join(
        f"<details><summary>{e(q)}</summary><p>{e(canal(a.format(como_cita=como_cita)))}</p></details>"
        for q, a in s["faq"])
    about = n.get("about") or s["about"].format(short=corto)

    info = [f'<li>{icono("pin")}<span><small>Dirección</small>{e(lugar)}</span></li>' if addr
            else f'<li>{icono("pin")}<span><small>Zona</small>{e(city)} y alrededores</span></li>']
    for t in (tel, tel2):
        if t:
            info.append(f'<li>{icono("phone")}<span><small>{"Teléfono y WhatsApp" if es_movil(t) else "Teléfono"}</small>'
                        f'<a href="tel:+34{digitos(t)}">{e(t)}</a></span></li>')
    info.append(f'<li>{icono("clock")}<span><small>Horario</small>{e(horario)}</span></li>')

    if addr:
        embed = f"https://maps.google.com/maps?q={consulta}&z=16&output=embed"
        ruta = f"https://www.google.com/maps/search/?api=1&query={consulta}"
        mapa = (f'<div class="map" id="mapa" data-src="{e(embed)}"><div class="map-ph">'
                f'<span class="pin">{icono("pin")}</span><p>{e(lugar)}</p><div class="map-actions">'
                f'<button class="btn btn-main btn-sm" type="button" data-cargar-mapa>Ver mapa</button>'
                f'<a class="btn btn-line btn-sm" href="{e(ruta)}" target="_blank" rel="noopener">Cómo llegar{icono("arrow")}</a>'
                "</div></div></div>")
    else:
        mapa = (f'<div class="map"><div class="map-ph"><span class="pin">{icono("pin")}</span>'
                f"<p>{e(etiqueta)} en {e(city)} y alrededores. Escríbenos y te contamos dónde y cómo trabajamos.</p>"
                f'<div class="map-actions">{boton("btn btn-main btn-sm")}</div></div></div>')

    schema = {"@context": "https://schema.org", "@type": n.get("schema", s["schema"]), "name": nombre,
              "telephone": f"+34{digitos(tel)}", "description": sub, "areaServed": city,
              "address": {"@type": "PostalAddress", "addressLocality": city, "addressRegion": "Tarragona",
                          "addressCountry": "ES"}}
    if addr:
        schema["address"]["streetAddress"] = addr
    if n.get("cp"):
        schema["address"]["postalCode"] = n["cp"]

    root = (f':root{{--c1:{p["c1"]};--c2:{p["c2"]};--deep:{p["deep"]};--soft:{p["soft"]};--acc:{p["acc"]};'
            f'--btn:{p["btn"]};--btn-ink:{p["btn_ink"]};--c1rgb:{rgb(p["c1"])};--c2rgb:{rgb(p["c2"])};'
            f'--ink:#0f172a;--mut:#475569;--line:#e2e8f0;--bf:"{s["cuerpo"]}";--hf:"{s["titulos"]}";'
            f'--ease-out:cubic-bezier(.23,1,.32,1);--plus:{icono_mas(p["acc"])}}}')
    familias = dict.fromkeys([s["cuerpo"], s["titulos"]])

    return PAGINA.substitute(
        title=e(f"{corto} · {etiqueta} en {city}"), desc=e(sub), c1=p["c1"],
        favicon=favicon(p["c1"], p["c2"], mono),
        schema=json.dumps(schema, ensure_ascii=False).replace("</", "<\\/"),
        fontfaces="\n".join(font_face(f) for f in familias), root=root, css=CSS.strip(),
        sector=n["sector"], corto=e(corto), nombre=e(nombre), mono=e(mono), etiqueta=e(etiqueta), city=e(city),
        cta_header=cta_header, rings=RINGS, hero=e(hero), sub=e(sub), cta_hero=boton(),
        ver_servicios="Ver servicios", chips=chips,
        quick_t=e(s["quick"][0]), quick_s=e(canal(s["quick"][1])), qlist="".join(qlist), cta_quick=boton(),
        serv_eye=e(s["serv"][0]), serv_h2=e(s["serv"][1]), serv_intro=e(s["serv"][2]), cards=cards,
        about=e(about), checks=checks, panel_chips=panel_chips, pasos_h2=e(pasos_h2), pasos=pasos,
        faq_contacto=faq_contacto, faq=faq, contacto_h2=e(s["contacto"][0]), contacto_intro=e(canal(s["contacto"][1])),
        info="".join(info), cta_contacto=boton(), mapa=mapa, year=YEAR, pie=e(f"{lugar} · {tel}"),
        flotante=flotante, js=JS,
    )


def panel(negocios):
    filas = []
    for n in negocios:
        wa = numero_whatsapp(n)
        mensaje = mensaje_contacto(n)
        contacto = (f'<a href="{e(enlace_whatsapp(wa, mensaje))}">WhatsApp {e(wa)} (mensaje listo)</a>' if wa
                    else f'<a href="tel:+34{digitos(n["tel"])}">Llamar {e(n["tel"])}</a>')
        filas.append(
            f'<article><div class="t"><a class="nm" href="{n["slug"]}.html">{e(n["nombre"])}</a>'
            f'<span class="tag">{e(n.get("etiqueta", SECTORES[n["sector"]]["etiqueta"]))} · {e(n["city"])}</span></div>'
            f'<p class="c">{contacto} · <a href="mockups/{n["slug"]}.jpg">Imagen para enviar</a></p>'
            f'<p class="m">{"" if wa else "<b>Guion:</b> "}{e(mensaje)}</p>'
            f'<p class="v"><b>Verificar:</b> {e(n.get("verificar", "-"))}</p></article>')
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Webs demo Tarragona</title>
<style>
:root{{--ink:#0f172a;--mut:#64748b;--line:#e2e8f0;--acc:#0f766e;--bg:#f8fafc;--card:#fff}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--ink:#e2e8f0;--mut:#94a3b8;--line:#1e293b;--acc:#2dd4bf;--bg:#020617;--card:#0f172a}}}}
:root[data-theme="dark"]{{--ink:#e2e8f0;--mut:#94a3b8;--line:#1e293b;--acc:#2dd4bf;--bg:#020617;--card:#0f172a}}
*{{box-sizing:border-box;margin:0}}body{{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--ink);padding:32px 16px;line-height:1.5}}
main{{max-width:980px;margin:0 auto}}h1{{font-size:28px;letter-spacing:-.02em}}.sub{{color:var(--mut);margin:6px 0 24px}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px}}
article{{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;display:grid;gap:8px}}
.t{{display:grid;gap:2px}}.nm{{font-weight:700;color:var(--ink);text-decoration:none}}.nm:hover{{color:var(--acc)}}
.tag{{font-size:13px;color:var(--mut)}}.c{{font-size:14px}}.c a{{color:var(--acc)}}.v{{font-size:13px;color:var(--mut)}}
.m{{font-size:13.5px;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line)}}
</style></head><body><main>
<h1>Webs demo · {len(negocios)} negocios</h1>
<p class="sub">Propuestas de una página, listas para enseñar. Abre cada una para verla; envía la imagen por WhatsApp.</p>
<div class="g">{"".join(filas)}</div></main></body></html>"""


def main():
    OUT.mkdir(exist_ok=True)
    contador = {}
    for n in NEGOCIOS:
        i = contador.get(n["sector"], 0)
        contador[n["sector"]] = i + 1
        (OUT / f'{n["slug"]}.html').write_text(construir(n, i), encoding="utf-8")
    (OUT / "index.html").write_text(panel(NEGOCIOS), encoding="utf-8")
    print(f"{len(NEGOCIOS)} webs generadas en {OUT}")


if __name__ == "__main__":
    main()
