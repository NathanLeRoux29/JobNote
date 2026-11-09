#!/usr/bin/env bash
# Retire JobNote du menu des applications. Tes données (~/.local/share/jobnote) sont conservées.
set -euo pipefail
APP_ID="fr.jobnote.JobNote"
rm -f "$HOME/.local/share/applications/$APP_ID.desktop"
rm -f "$HOME/.local/share/icons/hicolor/scalable/apps/$APP_ID.svg"
update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
echo "JobNote retiré du menu. Données conservées dans ~/.local/share/jobnote/"
