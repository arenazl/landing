#!/usr/bin/env python3
# Script para reemplazar emojis por iconos Font Awesome

replacements = {
    '📧': '<i class="fas fa-envelope"></i>',
    '🚀': '<i class="fas fa-rocket"></i>',
    '📞': '<i class="fas fa-phone"></i>',
    '✉️': '<i class="fas fa-envelope"></i>',
    '🌐': '<i class="fas fa-globe"></i>',
    '❌': '<i class="fas fa-times-circle"></i>',
    '✅': '<i class="fas fa-check-circle"></i>',
    '⚡': '<i class="fas fa-bolt"></i>',
    '🎁': '<i class="fas fa-gift"></i>',
    '📱': '<i class="fas fa-mobile-alt"></i>',
    '🗺️': '<i class="fas fa-map-marked-alt"></i>',
    '💻': '<i class="fas fa-laptop"></i>',
    '⚙️': '<i class="fas fa-cog"></i>',
    '📊': '<i class="fas fa-chart-bar"></i>',
    '👥': '<i class="fas fa-users"></i>',
    '🏛️': '<i class="fas fa-landmark"></i>',
    '💬': '<i class="fas fa-comments"></i>',
    '📸': '<i class="fas fa-camera"></i>',
    '🔔': '<i class="fas fa-bell"></i>',
    '✓': '<i class="fas fa-check"></i>',
    '🎯': '<i class="fas fa-bullseye"></i>',
    '💰': '<i class="fas fa-dollar-sign"></i>',
    '📄': '<i class="fas fa-file-alt"></i>',
    '🔍': '<i class="fas fa-search"></i>',
    '⏱️': '<i class="fas fa-stopwatch"></i>',
    '🌟': '<i class="fas fa-star"></i>',
    '🥉': '<i class="fas fa-medal"></i>',
    '🥈': '<i class="fas fa-medal"></i>',
    '🥇': '<i class="fas fa-crown"></i>',
    '⭐': '<i class="fas fa-star"></i>',
    '💵': '<i class="fas fa-money-bill-wave"></i>',
    '👤': '<i class="fas fa-user"></i>',
    '⏱': '<i class="fas fa-clock"></i>',
    '📎': '<i class="fas fa-paperclip"></i>',
    '📤': '<i class="fas fa-paper-plane"></i>',
    '🤖': '<i class="fas fa-robot"></i>',
    '📋': '<i class="fas fa-clipboard-list"></i>',
    '🏢': '<i class="fas fa-building"></i>',
    '🖥️': '<i class="fas fa-desktop"></i>',
    '✨': '<i class="fas fa-sparkles"></i>',
    '🏠': '<i class="fas fa-home"></i>',
    '🚧': '<i class="fas fa-exclamation-triangle"></i>',
    '📍': '<i class="fas fa-map-marker-alt"></i>',
    '🌅': '<i class="fas fa-sun"></i>',
    '🌆': '<i class="fas fa-city"></i>',
    '🌃': '<i class="fas fa-moon"></i>',
    '🌇': '<i class="fas fa-cloud-sun"></i>',
    '🏆': '<i class="fas fa-trophy"></i>',
}

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

for emoji, icon in replacements.items():
    content = content.replace(emoji, icon)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Emojis reemplazados exitosamente!")
print(f"Total de reemplazos: {len(replacements)}")
