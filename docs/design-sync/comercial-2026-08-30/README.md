# Handoff: Sitio comercial Munify (restyling 2026)

## Overview
Sitio comercial completo de **Munify** (software de gestión municipal, Argentina): home + 8 páginas (Reclamos, Trámites, Tesorería, Comunicaciones, Demo, Precios, Contacto), cada una en **dos modos: dark (principal) y light**. El objetivo comercial: municipios como cliente, con guiño al vecino ("recomendalo a tu municipio"). Mensaje central: *"Tu municipio, en línea con la gente"* — reclamos y trámites en tiempo real, IA, RENAPER, seguimiento de cuadrillas.

## About the Design Files
Los archivos de `pages/` son **referencias de diseño hechas en HTML** (prototipos que muestran look & behavior), NO código de producción. La tarea es **recrear estos diseños en el entorno real del proyecto Munify** (el repo `arenazl/munify`, carpeta `landing`) usando sus patrones existentes — o si se arranca de cero, elegir el framework más apropiado (Astro/Next/plain HTML+CSS son buenos candidatos para una landing).

Notas técnicas de los prototipos:
- Son archivos `.dc.html` de una herramienta de diseño: el markup relevante está dentro de `<x-dc>…</x-dc>` (template con estilos inline) y hay un `<script data-dc-script>` con la lógica JS (carruseles, contadores, reveals). Ignorar `support.js` y los `{{ holes }}` — son del runtime de diseño; la lógica a portar está descrita abajo.
- Los videos referencian `uploads/…mp4` que no se incluyen (pesados). Reemplazar por los videos/fotos institucionales reales. Los videos SIEMPRE van `muted`, `loop`, `autoplay`, `playsinline`.

## Fidelity
**High-fidelity.** Colores, tipografía, espaciados, copy y estados son finales. Recrear pixel-perfect con las libs del codebase.

## Estructura del sitio
9 páginas × 2 modos. Nav compartida: Reclamos · Trámites · Tesorería · Comunicaciones · Demo · Precios · Contacto + CTA "Generá tu municipio" + toggle ☀/☾ (en producción: un theme switcher real en vez de páginas duplicadas — las versiones Light muestran el mapeo exacto de colores).

### 1. Home (`Munify Home.dc.html` / ` Light`)
- **Hero** (660px): 3 videos rotando cada 9s con crossfade 1400ms; overlay `linear-gradient(180deg, rgba(6,14,34,.85), rgba(6,14,34,.55) 40%, #060E22 100%)` (en light el último stop funde a `#F2F5FA`). Eyebrow cian, H1 Sora 600 60px, chips (App/Web/WhatsApp/PWA), CTA verde + secundario + "3 meses gratis · sin tarjeta".
- **01 · Timeline del reclamo**: 4 pasos con hora (09:12 → 14:30), círculos numerados conectados por línea.
- **02 · Dos lados en tiempo real**: split app del vecino ↔ panel del municipio, con simulación sincronizada auto-avanzando cada 2s (4 estados: Recibido → Asignado → En camino → Resuelto); toast de notificación, ícono sync que rota 180° por paso, mapa con pin GPS.
- **Fuertes 01/02**: Reclamos con seguimiento real / Trámites con RENAPER y turnos + banda "Y todo con IA" (88% / 2–3 días / 24/7).
- **03 · Banda video + carrusel del intendente**: 3 slides (Prioridades del día / Mapa de calor / Tendencia y analítica), auto 3.6s, pausa en hover, dots + flechas. Slide 1: cards Urgentes 18 (rojo) / Sin asignar 125 (ámbar) / Para cerrar 9 (cian). Slide 2: heatmap sobre plano de calles SVG con blobs radiales rojo→verde. Slide 3: barras de tendencia + ranking barrios.
- **04 · Planes** (Estándar / Express "Más elegido" / Premium) + CTA final + footer.

### 2. Reclamos / 3. Trámites
Hero video con breadcrumb + chips + KPI strip (4 números 800 32px que cuentan desde 0). Sección wizard con IA (mock del paso "no tengo luz" → categoría sugerida). Beneficios (grid 3+2+2+2 cards) / Tipos de trámites. CTA.

### 4. Tesorería
Hero video "adiós al Excel", cards de control de gastos/ingresos/proyectos, import de Excel histórico.

### 5. Comunicaciones
Hero "Obras, eventos y noticias, directo al celular del vecino" + KPIs (97% en 1 min / ×4 alcance / $0 por mensaje / 100% medible). Casos de uso (Obras/Proyectos/Eventos/Alertas urgentes). **"Así lo ve el vecino"**: mockup del teléfono de la app real — header ☰ + logo + "Ituzaingó" + campana con badge; carrusel "TUS RECLAMOS" (alerta rechazo, borde rojo); cards de novedades con foto + fecha + "Leer más ›"; tab bar Inicio/Reclamos 9+/Crear(+)/Trámites 2/Tasas. Sistema de notificaciones en 3 pasos.

### 6. Demo
Hero video + métricas (5.122 municipios / 6 países / 80 demos / 2 min). Card "Crear demo en vivo": chips de país (AR PY UY CL PE BO), combo de provincia (22 con conteos y barras animadas + ícono característico por provincia como marca de agua), input de municipio siempre visible con autocomplete (filtra por provincia elegida) → "Crear demo". Sección "demos existentes" con buscador en vivo y cards ACTIVA/Entrar.

### 7. Precios
3 planes por tamaño de municipio (hasta 20k / 20–100k / +100k hab), en ARS, sin cargo por vecino, 3 meses gratis. Express destacado con borde cian + badge "Más elegido".

### 8. Contacto
Hero video + formulario/canales (WhatsApp +54 9 11 6052 6449, info@munify.com.ar).

## Interactions & Behavior (portar a JS/framework real)
- **Reveal on scroll**: secciones top-level arrancan `opacity:0; translateY(28px)` y entran con transición 700ms al intersectar (threshold 0.08). No aplicar a secciones con video.
- **KPI count-up**: números Sora 800 ≥26px cuentan de 0 al valor en 1200ms con ease-out cúbico al entrar en viewport (threshold 0.6), preservando prefijo/sufijo (`−85%`, `×4`).
- **Cards vivas**: hover → `translateY(-4px)` + sombra `0 14px 32px rgba(6,14,34,0.3)`, 250ms.
- **Carruseles**: auto-advance (3.6–4.5s), pausa en hover, dots clickeables (dot activo se estira a 26–30px), crossfade/slide 380–700ms.
- **Easing universal**: `cubic-bezier(0.2, 0.8, 0.2, 1)`. Sin bounces.
- **Videos**: siempre muted+loop+autoplay+playsinline; nunca audio.

## Design Tokens
### Dark (principal)
- Fondos: página `#060E22`, sección alterna `#0A152E`, card `#101E3C`, card interna/mapa `#0C1830`
- Texto: blanco `#fff`, secundario `#93A5C9`, terciario `#5E7099`, claro `#E8EEFA`
- Acento primario (CTAs, eyebrows, links): **cian `#4CD9C6`** (texto sobre él: `#06223F`); glow CTA `0 0 28px rgba(76,217,198,0.35)`
- Secundarios: azul `#8FB2FF`/`#3F6AC8`, ámbar `#FFB800`, verde `#5BE38A`, rojo `#E5484D`/`#FF7A7A`
- Bordes: `rgba(255,255,255,0.06–0.15)`; sombra cards `0 12px 32px rgba(0,0,0,0.4)`
### Light (mapeo)
- Fondos: `#F2F5FA` / alterna `#E9EFF7` / card `#FFFFFF`
- Texto: `#0F1B33` / `#5A6880` / `#8B97AD`
- Acento: **teal `#0E9384`** (texto blanco encima); azul `#3F6AC8`, verde `#15803D`, rojo `#C22F35`
- Bordes: `rgba(13,20,40,0.12–0.2)`
- **Heros de video quedan dark** y funden al fondo claro: último stop del overlay → `rgba(242,245,250,0.9) 88%, #F2F5FA 100%`
### Tipografía
- Display/títulos: **Sora** — H1 600 50–60px/1.06, letter-spacing -0.03em; H2 600 34–36px; números KPI 800, `font-feature-settings:"tnum"`
- UI/body: **Inter** — body 400 14–18px/1.5–1.6; eyebrows 600 12px uppercase tracking 0.08em
- Ambas de Google Fonts
### Radii y espaciado
- Cards 16px, botones/inputs 10–12px, pills 999px, phone mock 24–28px
- Secciones `padding: 72px 64px`; gaps 12–16px entre cards

## Assets (`assets/`)
- `munify-logo-color.svg` — hexágono blanco + check cian `#4CD9C6` (topbar 44px + wordmark Sora 700 24px; footer 22px)
- `Munify.svg` (original), `munify-mark.png`
- Fotos: `ciudad.webp`, `trabajadores.jpg`, `trabajador-tablet.jpg`, `workers-papeles.jpg` (usadas en novedades de Comunicaciones)
- Videos de heros: no incluidos — usar material institucional propio (oficina municipal, atención al vecino, cuadrillas)

## Files
- `pages/*.dc.html` — 16 páginas (8 dark + 8 light). El markup de referencia está dentro de `<x-dc>`; la lógica JS de carruseles/simulaciones en el `<script data-dc-script>` de cada archivo.
- `assets/` — logo y fotos.


---

## Como abrir estos prototipos (doble clic)

Los `.dc.html` referencian `assets/...` y `uploads/*.mp4` como si estuvieran en
la raiz del paquete, pero viven en `pages/`. Y los videos NO vienen en el
handoff (el README original avisa que pesan). Por eso, recien bajado, el
prototipo abre sin logo y sin video — **no le falta ningun CSS**: los estilos
son inline y el `<style>` del helmet, y las fuentes salen de Google Fonts.

Antes de abrirlos, correr una vez:

    sh _armar-prototipos.sh

Copia `assets/` dentro de `pages/` y arma `pages/uploads/` mapeando los 7
videos del prototipo a los reales de `landing/videos/`. Las dos carpetas estan
gitignoreadas (son copias de archivos que ya estan en el repo).

Verificado: pasa de 16 requests fallidos a 0 visibles, y el hero renderiza con
video de fondo.
