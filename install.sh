#!/usr/bin/env bash
# Installe JobNote dans le menu des applications (pour l'utilisateur courant uniquement).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ID="fr.jobnote.JobNote"
APPS="$HOME/.local/share/applications"
ICONS="$HOME/.local/share/icons/hicolor/scalable/apps"

chmod +x "$DIR/jobnote.py"

# SDK officiel Anthropic pour l'assistant IA (installé dans ./vendor, sans toucher au Python du système)
if [ ! -d "$DIR/vendor/anthropic" ]; then
  echo "Installation du SDK Anthropic dans $DIR/vendor…"
  python3 -m pip install --quiet --target "$DIR/vendor" anthropic || echo "⚠ SDK non installé : le fournisseur « Claude – API Anthropic » ne sera pas disponible."
fi
mkdir -p "$APPS" "$ICONS"
cp "$DIR/icon/$APP_ID.svg" "$ICONS/$APP_ID.svg"

cat > "$APPS/$APP_ID.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=JobNote
Comment=Tâches, sous-tâches et notes
Exec=/usr/bin/python3 "$DIR/jobnote.py"
Icon=$APP_ID
Terminal=false
Categories=Office;ProjectManagement;
Keywords=todo;tâches;notes;liste;
StartupNotify=true
StartupWMClass=$APP_ID
EOF

update-desktop-database "$APPS" >/dev/null 2>&1 || true
gtk-update-icon-cache -q -t "$HOME/.local/share/icons/hicolor" >/dev/null 2>&1 || true

echo "JobNote est installé : cherche « JobNote » dans tes applications (touche Super)."
echo "Données : ~/.local/share/jobnote/data.json"
