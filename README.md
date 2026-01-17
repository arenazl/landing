# Landing Page - Sistema de Gestión Municipal

Presentación comercial estática del sistema.

**URL Producción:** https://gestion-municipal-landing.netlify.app

---

## 🚀 Deploy Rápido

```bash
# Método 1: Script automático (recomendado)
./deploy-prod.sh "Mensaje del deploy"

# Método 2: CLI directo
netlify deploy --prod --message="Update landing"
```

---

## 📁 Estructura

```
landing/
├── index.html              # Página principal (autocontenida)
├── netlify.toml           # Configuración de Netlify
├── deploy-prod.sh         # Script de deploy
├── .netlify/
│   └── state.json         # Linkeo del sitio (no editar)
└── README.md              # Este archivo
```

---

## ✏️ Actualizar Contenido

### Links de la aplicación:

```html
<!-- Línea ~325: Link "Ver Demos" -->
<a href="#demos">Ver Demos</a>
<!-- Cambiar por: -->
<a href="https://tu-app.netlify.app">Ver Demos</a>

<!-- Línea ~426: URL del dashboard mockup -->
https://tumunicipo.app • Dashboard de Gestión
<!-- Cambiar por tu URL real -->
```

### Datos de contacto:

```html
<!-- Línea ~2090 -->
<a href="mailto:ventas@gestionmunicipal.com">

<!-- Línea ~2098 -->
WhatsApp: <strong>+54 9 11 1234-5678</strong>

<!-- Línea ~2102 -->
Email: <strong>ventas@gestionmunicipal.com</strong>

<!-- Línea ~2106 -->
Web: <strong>www.gestionmunicipal.com</strong>
```

**Buscar y reemplazar** estos valores con tus datos reales.

---

## 🎨 Características

- ✅ **100% autocontenido**: Sin dependencias externas (excepto Tailwind CDN y Google Fonts)
- ✅ **Theme switcher**: Light, Amber, Dark (botones en top bar)
- ✅ **Responsive**: Mobile, tablet, desktop
- ✅ **Glassmorphism**: Efectos modernos con backdrop-blur
- ✅ **Animaciones**: Smooth scrolling, fade-in, hover effects
- ✅ **Flujos completos**: 2 casos de ejemplo detallados (Reclamo y Trámite)

---

## 🔧 Configuración Técnica

### Netlify
- **Site ID**: `522eac1f-fa1f-43d1-86ca-128e5467a27d`
- **Account**: `arenazl`
- **URL**: https://gestion-municipal-landing.netlify.app

### Redirects (netlify.toml)
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 📝 Notas

- El archivo `index.html` pesa ~150KB (todo inline para máxima performance)
- Los temas se guardan en `localStorage` del navegador
- Las imágenes de fondo son SVG inline (sin requests HTTP)
- Las fotos de Unsplash se cargan desde CDN

---

## 🐛 Troubleshooting

### El sitio no está linkeado
```bash
# Verificar linkeo
cat .netlify/state.json

# Re-linkear si es necesario
echo '{"siteId":"522eac1f-fa1f-43d1-86ca-128e5467a27d"}' > .netlify/state.json
```

### Deploy falla
```bash
# Verificar autenticación
netlify status

# Re-autenticar si es necesario
netlify login
```

---

**Documentación completa:** Ver `DEPLOY.md` en la raíz del proyecto
