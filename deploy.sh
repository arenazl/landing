#!/bin/bash

# Script para deploy automático a Netlify
# Requiere tener netlify-cli instalado y estar autenticado

echo "🚀 Desplegando presentación comercial a Netlify..."

# Crear zip actualizado
echo "📦 Creando archivo zip..."
rm -f deploy.zip
zip -r deploy.zip index.html netlify.toml

# Deploy usando netlify CLI con el método de drag & drop
echo "☁️ Subiendo a Netlify..."
netlify deploy \
  --dir=. \
  --prod \
  --message="Deploy presentación comercial $(date +%Y-%m-%d)"

echo "✅ Deploy completado!"
