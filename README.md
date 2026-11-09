# JobNote

Liste de tâches avec sous-tâches façon éditeur de texte et notes par tâche, pour GNOME (GTK4 + libadwaita + WebKit).

## Lancer

- Depuis le menu des applications : **JobNote** (après `./install.sh`)
- Ou en terminal : `python3 jobnote.py`

## Données

- `~/.local/share/jobnote/data.json` : enregistrement automatique à chaque modification
- `~/.local/share/jobnote/backups/` : une copie par jour, les 14 dernières sont gardées

## Notes

Chaque tâche a une **note générale**, et chaque sous-tâche peut avoir **sa propre note**. Pour ouvrir celle d'une sous-tâche, survole la ligne et clique sur l'icône 📝, ou fais **Alt+E**. Refais **Alt+E** pour revenir à la ligne. Le bouton « ‹ Tâche » ramène à la note générale, et le compteur 📝 en haut du panneau liste les sous-tâches qui ont une note.

**Ctrl+Z** annule et **Ctrl+Y** (ou Ctrl+Maj+Z) rétablit, mot par mot. Chaque note garde son propre historique, même quand on passe d'une note à l'autre.

## Assistant IA dans les notes

En bas des notes, une **barre de discussion** (ou **Ctrl+J**) permet de parler de la note avec une IA :
- **Une question** (« qu'as-tu compris ? », « qu'est-ce qui manque ? ») reçoit une réponse dans la discussion. Rien n'est écrit dans la note.
- **Une demande de modification** (« réorganise avec ce que tu as compris », « corrige », « fais un plan ») renvoie une **carte de proposition** avec les boutons **Remplacer**, **Insérer en dessous**, **Copier** ou **Ajouter aux sous-tâches**. La note ne change qu'au clic, et **Ctrl+Z** annule.
- Si tu sélectionnes un passage avant d'écrire, l'IA ne travaille que dessus. Clique sur la pastille pour revenir à toute la note.
- **Mémoire** : la discussion est gardée par tâche, même après redémarrage (`~/.local/share/jobnote/ai-chats.json`). Le bouton ↻ lance une nouvelle discussion. L'IA voit toujours la version à jour de la note, du titre et des sous-tâches.

### Fichiers (lecture seule)

- **Joindre des fichiers** : le trombone 📎 dans la zone de saisie joint un ou plusieurs fichiers au message (texte, Markdown, code, CSV, PDF, Word, OpenDocument). L'IA les lit, et ils restent dans la mémoire de la discussion.
- **Dossiers autorisés** : dans la configuration de l'IA, section « Accès aux fichiers ». L'IA peut alors lister, chercher (par nom ou dans le contenu) et lire les fichiers de ces dossiers, d'elle-même, quand ta question le demande. Le badge 📁 dans l'en-tête de la discussion indique combien de dossiers elle voit. Sous sa réponse, « N consultations de fichiers » détaille ce qu'elle a ouvert.
- **Jamais d'écriture** : aucun outil ne permet de créer, modifier ou supprimer un fichier. Les chemins hors des dossiers autorisés, les liens qui en sortent, les fichiers cachés et les fichiers sensibles (`.env`, clés SSH, `.gnupg`, mots de passe…) sont refusés.
- Ce que l'IA lit est envoyé au fournisseur choisi (ou reste sur ton PC avec Ollama). Le code est dans `files_access.py`.

La configuration se fait via le bouton ✨ en bas de la liste, ou via le nom du fournisseur dans le panneau IA :

| Fournisseur | Ce qu'il faut |
|---|---|
| Claude Code (par défaut) | rien : utilise la CLI `claude` installée et ton abonnement |
| Claude – API Anthropic | une clé API (console.anthropic.com), via le SDK officiel installé dans `vendor/` |
| OpenAI, Mistral, Gemini, OpenRouter | une clé API |
| Ollama | Ollama lancé en local, gratuit |
| Autre | n'importe quelle adresse compatible OpenAI (LM Studio, Groq…) |

Les clés sont rangées dans le **trousseau GNOME**, jamais dans `data.json`. Les réglages non secrets sont dans `~/.local/share/jobnote/ai.json`.

## Accès pour les IA (serveur MCP)

`mcp_server.py` est un serveur MCP (stdio, Python pur, sans dépendance). Il donne accès à ces outils :
`list_tasks`, `get_task`, `create_task`, `update_task`, `add_subtasks`, `update_subtask`, `delete_subtask`, `write_notes`.
Les sous-tâches s'écrivent en liste Markdown (`- [ ] texte`, indentation de 2 espaces) et les notes en Markdown.

Si l'appli est ouverte, elle se met à jour en direct. Si tu tapes dans une tâche au même moment, les deux versions sont fusionnées, ligne par ligne.

- **Claude Code** (déjà fait) : `claude mcp add --scope user jobnote -- /usr/bin/python3 /home/pommefrite/Documents/Perso/jobNote/mcp_server.py`
- **Autres clients MCP** (Claude Desktop, Cursor, etc.) :

```json
{
  "mcpServers": {
    "jobnote": {
      "command": "/usr/bin/python3",
      "args": ["/home/pommefrite/Documents/Perso/jobNote/mcp_server.py"]
    }
  }
}
```

Pour retirer le serveur de Claude Code : `claude mcp remove jobnote -s user`

## Structure

- `jobnote.py` : fenêtre GTK, sauvegarde, thème clair/sombre, surveillance du fichier de données
- `mcp_server.py` : serveur MCP pour les IA
- `ai.py` : assistant IA (fournisseurs, streaming, clés)
- `notes_format.py` : conversion des notes HTML ↔ Markdown
- `files_access.py` : accès aux fichiers en lecture seule pour l’IA (outils + serveur MCP pour Claude Code)
- `vendor/` : SDK Anthropic (installé par `install.sh`)
- `ui/index.html`, `ui/style.css`, `ui/app.js` : l'interface
- `install.sh` / `uninstall.sh` : ajout ou retrait du menu des applications (les données ne sont jamais supprimées)

Débogage : `JOBNOTE_DEBUG=1 python3 jobnote.py` active l'inspecteur web (clic droit, puis « Inspecter »).

Raccourcis : touche **F1** dans l'appli.
