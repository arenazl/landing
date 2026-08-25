# design-sync — landing munify.com.ar

projectId: 2c3ee620-0f7e-4482-8958-57246614c94d
url:       https://claude.ai/design/p/2c3ee620-0f7e-4482-8958-57246614c94d

## Carpetas

| Carpeta | Pantalla | Estado |
|---|---|---|
| `home-2026-08-25/` | Mockup del home de la landing munify.com.ar, hecho en Claude Design (`Munify Home.dc.html` + `support.js`). | **IMPORTADO 2026-08-25.** Del mockup se implementó SOLO el hero con videos en loop (3 clips rotando cada 9 s, crossfade 1.4 s) — el resto del mockup (restyle oscuro completo) fue descartado por el dueño porque pisaba el contenido real. Implementación: `index.html` (data-videos), `css/munify-v2.css` (.hero__media video), `js/munify-anim.js` (initHeroVideos). |

## Notas

- El proyecto de diseño tiene mockups de TODAS las páginas (`Munify Restyle`, `Contacto`, `Precios`, `Reclamos`, `Tesoreria`, `Tramites` en `.dc.html`) — sin importar aún; bajar bajo demanda con `DesignSync method=get_file`.
- Los videos que referencia el mockup (`uploads/*.mp4`) NO están en esta carpeta: son los mismos archivos de `D:\Code\media-studio\candidates`, copiados a `landing/videos/` con nombres `loop-*.mp4`.
- El prototipo abre con doble clic (usa el `support.js` de la carpeta), pero los `<video>` no van a cargar por lo anterior.
