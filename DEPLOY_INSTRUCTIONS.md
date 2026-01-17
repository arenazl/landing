# 🚀 Instrucciones de Deploy - Presentación Comercial

## ✨ Método Más Rápido (2 minutos)

1. Abre esta URL en tu navegador: **https://app.netlify.com/drop**

2. Arrastra la carpeta `landing/` completa a la página

3. ¡Listo! Netlify te dará una URL como: `https://random-name-123.netlify.app`

4. (Opcional) Puedes cambiar el nombre del sitio en: Site settings → Change site name

---

## 📝 Datos a Actualizar Después del Deploy

Una vez desplegado, deberás actualizar estos datos en `index.html`:

### Links de la aplicación:
- **Línea 325**: `href="#demos"` → cambiar por tu URL de producción
- **Línea 426**: `https://tumunicipo.app` → tu URL real

### Datos de contacto:
- **Línea 2090**: `ventas@gestionmunicipal.com` → tu email real
- **Línea 2098**: `+54 9 11 1234-5678` → tu WhatsApp real
- **Línea 2106**: `www.gestionmunicipal.com` → tu sitio web real

---

## 🔄 Re-deploy después de cambios

Simplemente arrastra la carpeta actualizada de nuevo a Netlify Drop,
o usa:

```bash
cd landing
netlify deploy --prod
```

---

## 🎨 Personalización

El archivo está 100% autocontenido:
- ✅ Sin dependencias externas (salvo Tailwind CDN y Google Fonts)
- ✅ Todos los estilos inline
- ✅ JavaScript incluido
- ✅ Temas: light, amber, dark (switcher en top bar)

---

**¿Listo para deployar?**
👉 Ve a https://app.netlify.com/drop y arrastra esta carpeta
