#!/bin/bash

# Script de deploy automático de la landing page
# Uso: ./deploy-prod.sh [mensaje]

set -e

MESSAGE="${1:-Update landing page}"

echo "🚀 Desplegando landing page a producción..."
echo "📝 Mensaje: $MESSAGE"
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -f "index.html" ]; then
    echo "❌ Error: Debes ejecutar este script desde la carpeta landing/"
    exit 1
fi

# Deploy a producción
netlify deploy --prod --dir=. --message="$MESSAGE"

echo ""
echo "✅ Deploy completado!"
echo "🌐 URL: https://gestion-municipal-landing.netlify.app"
