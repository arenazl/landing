# design-sync — landing munify.com.ar

projectId: 2c3ee620-0f7e-4482-8958-57246614c94d
url:       https://claude.ai/design/p/2c3ee620-0f7e-4482-8958-57246614c94d

## Carpetas

| Carpeta | Pantalla | Estado |
|---|---|---|
| `comercial-2026-08-30/` | **Restyling integral del sitio comercial** (handoff `design_handoff_munify_comercial`): 8 paginas x 2 modos (dark principal + light), tokens finales, copy final. Incluye `assets/` (logo color, fotos) y `pages/*.dc.html` + `support.js` para abrir con doble clic. | **FASE 0 IMPLEMENTADA 2026-08-30.** Tokens dark/light (`css/munify-theme.css`), Sora+Inter desde Google Fonts, theme switcher (`js/munify-theme.js`) y guard sin flash en las 7 paginas. Faltan: Home (fase 1), resto de paginas (fase 2), Comunicaciones y Demo (fase 3, nuevas). |
| `home-2026-08-25/` | Mockup del home de la landing munify.com.ar, hecho en Claude Design (`Munify Home.dc.html` + `support.js`). | **IMPORTADO 2026-08-25.** Del mockup se implementó SOLO el hero con videos en loop (3 clips rotando cada 9 s, crossfade 1.4 s) — el resto del mockup (restyle oscuro completo) fue descartado por el dueño porque pisaba el contenido real. Implementación: `index.html` (data-videos), `css/munify-v2.css` (.hero__media video), `js/munify-anim.js` (initHeroVideos). |

## Notas

- El proyecto de diseño tiene mockups de TODAS las páginas (`Munify Restyle`, `Contacto`, `Precios`, `Reclamos`, `Tesoreria`, `Tramites` en `.dc.html`) — sin importar aún; bajar bajo demanda con `DesignSync method=get_file`.
- Los videos que referencia el mockup (`uploads/*.mp4`) NO están en esta carpeta: son los mismos archivos de `D:\Code\media-studio\candidates`, copiados a `landing/videos/` con nombres `loop-*.mp4`.
- El prototipo abre con doble clic (usa el `support.js` de la carpeta), pero los `<video>` no van a cargar por lo anterior.

## Restyling comercial 2026 — como esta armado

- **Todo el restyling vive en `css/munify-theme.css` + `js/munify-theme.js`.** No se
  reescribio `munify-v2.css`: como la landing pinta 100% por `var()` y no tiene una
  sola clase de color de Tailwind en el markup (verificado), redefinir los tokens
  repinta los componentes existentes. Sacando los dos `<link>`/`<script>` se vuelve
  al crema anterior.
- **Dark es el modo principal**; el handoff trae las paginas `Light` duplicadas solo
  para documentar el mapeo de color. En produccion es un switcher real, no paginas
  duplicadas.
- **Tres lugares tenian color literal** y no seguian al tema: `.topbar`
  (`rgba(255,255,255,.75)`), `.btn-primary` (degrade con `--ink`) y los headers con
  `font-family: 'Instrument Serif' !important`. Los tres se corrigen desde
  `munify-theme.css`, no en `munify-v2.css`.
- **`software-gestion-municipal.html` no esta en el handoff** pero NO se borra: es la
  vitrina SEO con pretty URL activa. Se restila con los tokens nuevos.
- Hallazgo: la landing declaraba Instrument Serif y Manrope pero **nunca las
  descargaba** (solo habia un `preconnect`, ningun `family=`). Caia a fuentes del
  sistema. Ahora si trae Sora + Inter.
