/* ============================================================
   Munify Landing — loader de estilo de fotos/fuente.
   Cada página, al cargar, aplica la config guardada (la que el user
   eligió desde el panel y persistió en el backend /api/style-config).
   - Instant: lee localStorage (sin flash en visitas repetidas).
   - Revalida: hace GET a la function y actualiza si cambió.
   El panel usa window.MunifyStyle.apply() para el preview en vivo, y al
   "Aplicar" hace POST a la function → queda para TODOS, sin pasar nada.
   ============================================================ */
(function () {
  'use strict';
  var FONTS_LOADED = false;
  function loadFonts() {
    if (FONTS_LOADED) return; FONTS_LOADED = true;
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Sora:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Nunito:wght@400;500;600;700&display=swap';
    document.head.appendChild(l);
  }
  function cssFor(cfg) {
    var c = cfg.color || [28,58,140]; var rgb = c.join(',');
    var a1 = (cfg.a1 != null ? cfg.a1 : 0.336), a2 = (cfg.a2 != null ? cfg.a2 : 0.06);
    var dir = (cfg.dir != null ? cfg.dir : 165), gray = (cfg.gray != null ? cfg.gray : 0.08), sat = (cfg.sat != null ? cfg.sat : 1.01);
    var css =
      '.card-img__media img,.bento__media img{filter:saturate(' + sat + ') grayscale(' + gray + ')!important}' +
      '.card-img__media::after,.bento__media::after{background:linear-gradient(' + dir + 'deg,rgba(' + rgb + ',' + a1 + ') 0%,rgba(' + rgb + ',' + a2 + ') 100%)!important}';
    if (cfg.font && cfg.font !== 'Inter') {
      loadFonts();
      var f = "'" + cfg.font + "',sans-serif";
      css += "body,p,li,span,a,td,th,label,input,button,select,.nav-link,.foot-link,.eyebrow{font-family:" + f + "!important}" +
             "h1,h2,h3,h4,h5,h6,h1 *,h2 *,h3 *,h4 *,h5 *,h6 *,.display-1,.display-2,.display-3,.font-display{font-family:'Instrument Serif',serif!important}";
    }
    return css;
  }
  function apply(cfg) {
    if (!cfg) return;
    var st = document.getElementById('munify-style-live');
    if (!st) { st = document.createElement('style'); st.id = 'munify-style-live'; document.head.appendChild(st); }
    st.textContent = cssFor(cfg);
    window.__munifyCfg = cfg;
  }
  function load() {
    try { var ls = localStorage.getItem('munifyStyle'); if (ls) apply(JSON.parse(ls)); } catch (e) {}
    fetch('/api/style-config', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (cfg) { if (cfg) { apply(cfg); try { localStorage.setItem('munifyStyle', JSON.stringify(cfg)); } catch (e) {} } })
      .catch(function () {});
  }
  window.MunifyStyle = { apply: apply, cssFor: cssFor, load: load };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
