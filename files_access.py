#!/usr/bin/env python3
"""Accès aux fichiers en LECTURE SEULE pour l'assistant IA de JobNote.

L'IA peut lister, chercher et lire des fichiers, uniquement dans les dossiers que
l'utilisateur a autorisés. Aucun outil ne permet de créer, modifier ou supprimer quoi que ce soit.
Les fichiers sensibles (clés SSH, .env, trousseaux, mots de passe…) sont toujours refusés.

Utilisé de deux façons :
  - importé par ai.py (API Anthropic et API compatibles OpenAI : boucle d'outils) ;
  - en serveur MCP stdio pour Claude Code :  python3 files_access.py --mcp DOSSIER [DOSSIER…]
"""

import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
import time
import zipfile

MAX_READ_CHARS = 60000        # par lecture
MAX_ATTACH_CHARS = 60000      # par fichier joint
MAX_FILE_BYTES = 30 * 1024 * 1024
MAX_SCAN_BYTES = 3 * 1024 * 1024   # on ne cherche pas dans les fichiers plus gros
SEARCH_SECONDS = 8
SKIP_DIRS = {"node_modules", "__pycache__", ".git", ".hg", ".svn", "venv", ".venv", "env", "site-packages",
             ".cache", ".mypy_cache", ".pytest_cache", "dist", "build", ".next", ".idea", ".tox", "target"}
# Jamais lisibles, même si demandés explicitement
SENSITIVE_PARTS = {".ssh", ".gnupg", ".password-store", ".aws", ".kube", ".docker", ".pki", "keyrings",
                   ".mozilla", "google-chrome", "chromium", ".thunderbird", "BraveSoftware"}
SENSITIVE_FILES = [".env", ".env.*", "*.pem", "*.key", "*.p12", "*.pfx", "id_rsa*", "id_ed25519*", "id_ecdsa*",
                   "id_dsa*", "*.kdbx", "*.kdb", ".netrc", ".pgpass", ".git-credentials", "credentials",
                   "credentials.json", "ai-keys.json", "*.keystore", "shadow", ".htpasswd", "secrets.*"]
TEXT_EXT_BINARY = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".mp3", ".mp4", ".mkv", ".avi",
                   ".mov", ".wav", ".flac", ".ogg", ".zip", ".gz", ".xz", ".bz2", ".7z", ".rar", ".tar", ".iso",
                   ".exe", ".dll", ".so", ".o", ".bin", ".class", ".jar", ".pyc", ".woff", ".woff2", ".ttf",
                   ".otf", ".sqlite", ".db", ".psd", ".xcf", ".deb", ".rpm", ".appimage"}

TOOLS = {
    "list_folder": {
        "description": "Liste le contenu d'un dossier autorisé (fichiers et sous-dossiers, avec taille et date). "
                       "Sans chemin : liste les dossiers autorisés.",
        "input_schema": {"type": "object", "properties": {
            "path": {"type": "string", "description": "Chemin du dossier (absolu, ~/…, ou relatif à un dossier autorisé)"},
            "depth": {"type": "integer", "description": "Profondeur (1 à 3, défaut 1)"},
        }},
    },
    "find_files": {
        "description": "Cherche des fichiers par nom (motif type *.md, *facture*, rapport*) dans les dossiers autorisés.",
        "input_schema": {"type": "object", "properties": {
            "pattern": {"type": "string", "description": "Motif de nom de fichier, insensible à la casse"},
            "path": {"type": "string", "description": "Dossier où chercher (défaut : tous les dossiers autorisés)"},
        }, "required": ["pattern"]},
    },
    "search_text": {
        "description": "Cherche un texte à l'intérieur des fichiers texte des dossiers autorisés. "
                       "Renvoie les lignes trouvées avec leur fichier et numéro de ligne.",
        "input_schema": {"type": "object", "properties": {
            "query": {"type": "string", "description": "Texte à chercher (insensible à la casse)"},
            "path": {"type": "string", "description": "Dossier ou fichier où chercher (défaut : tous les dossiers autorisés)"},
            "file_pattern": {"type": "string", "description": "Limiter à certains fichiers, ex. *.md"},
        }, "required": ["query"]},
    },
    "read_file": {
        "description": "Lit un fichier d'un dossier autorisé : texte, code, Markdown, CSV, PDF, Word (.docx) ou "
                       "OpenDocument (.odt). Les lignes sont numérotées ; pour un long fichier, lire par morceaux.",
        "input_schema": {"type": "object", "properties": {
            "path": {"type": "string", "description": "Chemin du fichier"},
            "start_line": {"type": "integer", "description": "Première ligne à lire (défaut 1)"},
            "max_lines": {"type": "integer", "description": "Nombre de lignes (défaut 600)"},
        }, "required": ["path"]},
    },
}


class AccessError(Exception):
    pass


def tilde(p):
    home = os.path.expanduser("~")
    return "~" + p[len(home):] if p == home or p.startswith(home + os.sep) else p


def human_size(n):
    for unit in ("o", "Ko", "Mo", "Go"):
        if n < 1024 or unit == "Go":
            return f"{n:.0f} {unit}" if unit == "o" else f"{n:.1f} {unit}"
        n /= 1024


def is_sensitive(path):
    parts = path.split(os.sep)
    if any(p in SENSITIVE_PARTS for p in parts):
        return True
    name = parts[-1].lower()
    return any(fnmatch.fnmatch(name, pat.lower()) for pat in SENSITIVE_FILES)


def _clean_roots(folders):
    roots = []
    for f in folders or []:
        try:
            r = os.path.realpath(os.path.expanduser(str(f)))
        except Exception:
            continue
        if os.path.isdir(r) and r not in roots:
            roots.append(r)
    return roots


def extract_text(real):
    """Texte d'un fichier (texte brut, PDF, docx, odt). Lève AccessError si illisible."""
    ext = os.path.splitext(real)[1].lower()
    size = os.path.getsize(real)
    if size > MAX_FILE_BYTES:
        raise AccessError(f"Fichier trop gros ({human_size(size)}).")
    if ext == ".pdf":
        if not shutil.which("pdftotext"):
            raise AccessError("Lecture des PDF impossible : installe le paquet poppler-utils.")
        r = subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", real, "-"], capture_output=True, timeout=30)
        if r.returncode != 0:
            raise AccessError("PDF illisible (protégé ou abîmé).")
        text = r.stdout.decode("utf-8", "replace")
        if not text.strip():
            raise AccessError("Ce PDF ne contient pas de texte (c'est sans doute un scan).")
        return text
    if ext in (".docx", ".odt", ".odp", ".ods", ".pptx"):
        xml_name = {".docx": "word/document.xml", ".pptx": None}.get(ext, "content.xml")
        try:
            with zipfile.ZipFile(real) as z:
                names = [xml_name] if xml_name else sorted(n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n))
                xml = "\n".join(z.read(n).decode("utf-8", "replace") for n in names)
        except Exception:
            raise AccessError("Document illisible.")
        xml = re.sub(r"</(w:p|text:p|text:h|a:p)>", "\n", xml)
        xml = re.sub(r"<(w:tab|text:tab)/>", "\t", xml)
        text = re.sub(r"<[^>]+>", "", xml)
        import html as _html
        return _html.unescape(text)
    if ext in TEXT_EXT_BINARY:
        raise AccessError("Fichier binaire (image, audio, archive…) : impossible de le lire comme du texte.")
    with open(real, "rb") as f:
        data = f.read(MAX_FILE_BYTES)
    if b"\x00" in data[:8192]:
        raise AccessError("Fichier binaire : impossible de le lire comme du texte.")
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return data.decode("latin-1")


def read_attachment(path):
    """Contenu d'un fichier joint explicitement par l'utilisateur (hors dossiers autorisés possible)."""
    real = os.path.realpath(os.path.expanduser(path))
    if is_sensitive(real):
        raise AccessError("fichier sensible, non transmis à l'IA")
    if not os.path.isfile(real):
        raise AccessError("fichier introuvable")
    text = extract_text(real)
    if len(text) > MAX_ATTACH_CHARS:
        text = text[:MAX_ATTACH_CHARS] + f"\n[… tronqué : {len(text)} caractères au total …]"
    return text


class Toolbox:
    def __init__(self, folders):
        self.roots = _clean_roots(folders)

    # ---------- chemins ----------
    def _inside(self, real):
        return any(real == r or real.startswith(r.rstrip(os.sep) + os.sep) for r in self.roots)

    def resolve(self, path, want_dir=None):
        if not self.roots:
            raise AccessError("Aucun dossier n'est autorisé.")
        path = (path or "").strip()
        if not path:
            raise AccessError("Chemin vide.")
        p = os.path.expanduser(path)
        candidates = [p] if os.path.isabs(p) else [os.path.join(r, p) for r in self.roots] + \
            [os.path.join(os.path.dirname(r), p) for r in self.roots]
        for c in candidates:
            real = os.path.realpath(c)
            if os.path.exists(real) and self._inside(real):
                if is_sensitive(real):
                    raise AccessError(f"Accès refusé à {tilde(real)} : fichier sensible (clés, mots de passe…).")
                if want_dir is True and not os.path.isdir(real):
                    raise AccessError(f"{tilde(real)} n'est pas un dossier.")
                if want_dir is False and not os.path.isfile(real):
                    raise AccessError(f"{tilde(real)} n'est pas un fichier.")
                return real
        real = os.path.realpath(candidates[0])
        if os.path.exists(real) and not self._inside(real):
            raise AccessError(f"Accès refusé : {tilde(real)} est en dehors des dossiers autorisés "
                              f"({', '.join(tilde(r) for r in self.roots)}).")
        raise AccessError(f"Introuvable : {path}")

    def _walk(self, base, deadline=None):
        """Parcourt les fichiers (sans dossiers cachés/lourds, sans liens sortants)."""
        for dirpath, dirnames, filenames in os.walk(base):
            if deadline and time.monotonic() > deadline:
                return
            dirnames[:] = sorted(d for d in dirnames if not d.startswith(".") and d not in SKIP_DIRS
                                 and d not in SENSITIVE_PARTS)
            for fn in sorted(filenames):
                if fn.startswith("."):
                    continue
                full = os.path.join(dirpath, fn)
                real = os.path.realpath(full)
                if not self._inside(real) or is_sensitive(real):
                    continue
                yield full

    # ---------- outils ----------
    def list_folder(self, path="", depth=1):
        if not path:
            if not self.roots:
                return "Aucun dossier n'est autorisé."
            return "Dossiers autorisés (lecture seule) :\n" + "\n".join(f"- {tilde(r)}/" for r in self.roots)
        base = self.resolve(path, want_dir=True)
        depth = max(1, min(int(depth or 1), 3))
        out, count = [f"{tilde(base)}/"], 0

        def rec(d, level):
            nonlocal count
            try:
                entries = sorted(os.scandir(d), key=lambda e: (not e.is_dir(), e.name.lower()))
            except OSError as e:
                out.append("  " * level + f"(illisible : {e.strerror})")
                return
            for e in entries:
                if e.name.startswith(".") or count >= 400:
                    continue
                real = os.path.realpath(e.path)
                if not self._inside(real) or is_sensitive(real):
                    continue  # lien vers l'extérieur ou fichier sensible : invisible
                count += 1
                ind = "  " * level
                try:
                    if e.is_dir():
                        out.append(f"{ind}{e.name}/")
                        if level < depth and e.name not in SKIP_DIRS:
                            rec(e.path, level + 1)
                    else:
                        st = e.stat()
                        out.append(f"{ind}{e.name}  ({human_size(st.st_size)}, {time.strftime('%d/%m/%Y', time.localtime(st.st_mtime))})")
                except OSError:
                    out.append(f"{ind}{e.name}")

        rec(base, 1)
        if count >= 400:
            out.append("… (liste tronquée à 400 éléments)")
        if len(out) == 1:
            out.append("  (dossier vide)")
        return "\n".join(out)

    def find_files(self, pattern, path=""):
        bases = [self.resolve(path, want_dir=True)] if path else self.roots
        pat = pattern.strip().lower()
        if not any(ch in pat for ch in "*?["):
            pat = f"*{pat}*"
        found, deadline = [], time.monotonic() + SEARCH_SECONDS
        for b in bases:
            for full in self._walk(b, deadline):
                if fnmatch.fnmatch(os.path.basename(full).lower(), pat):
                    found.append(tilde(full))
                    if len(found) >= 200:
                        break
            if len(found) >= 200:
                break
        if not found:
            return f"Aucun fichier ne correspond à « {pattern} »."
        more = "\n… (200 premiers résultats)" if len(found) >= 200 else ""
        return f"{len(found)} fichier(s) :\n" + "\n".join(found) + more

    def search_text(self, query, path="", file_pattern=""):
        q = query.strip().lower()
        if not q:
            raise AccessError("Texte à chercher vide.")
        if path:
            target = self.resolve(path)
            files = [target] if os.path.isfile(target) else None
            bases = [] if files else [target]
        else:
            files, bases = None, self.roots
        deadline = time.monotonic() + SEARCH_SECONDS
        fp = file_pattern.strip().lower()

        def candidates():
            if files:
                yield from files
            for b in bases:
                yield from self._walk(b, deadline)

        hits, nfiles, timed_out = [], 0, False
        for full in candidates():
            if time.monotonic() > deadline:
                timed_out = True
                break
            name = os.path.basename(full).lower()
            if fp and not fnmatch.fnmatch(name, fp):
                continue
            ext = os.path.splitext(name)[1]
            if ext in TEXT_EXT_BINARY:
                continue
            try:
                if os.path.getsize(full) > MAX_SCAN_BYTES:
                    continue
                if ext in (".pdf", ".docx", ".odt"):
                    text = extract_text(full)
                else:
                    with open(full, "rb") as f:
                        raw = f.read()
                    if b"\x00" in raw[:8192]:
                        continue
                    text = raw.decode("utf-8", "replace")
            except (OSError, AccessError, subprocess.SubprocessError):
                continue
            if q not in text.lower():
                continue
            nfiles += 1
            for i, line in enumerate(text.splitlines(), 1):
                if q in line.lower():
                    hits.append(f"{tilde(full)}:{i}: {line.strip()[:220]}")
                    if len(hits) >= 120:
                        break
            if len(hits) >= 120:
                break
        if not hits:
            return f"« {query} » n'apparaît dans aucun fichier." + (" (recherche interrompue : trop long)" if timed_out else "")
        tail = "\n… (120 premières lignes)" if len(hits) >= 120 else ""
        if timed_out:
            tail += "\n(recherche interrompue au bout de quelques secondes : précise un dossier)"
        return f"Trouvé dans {nfiles} fichier(s) :\n" + "\n".join(hits) + tail

    def read_file(self, path, start_line=1, max_lines=600):
        real = self.resolve(path, want_dir=False)
        text = extract_text(real)
        lines = text.splitlines()
        start = max(1, int(start_line or 1))
        count = max(1, min(int(max_lines or 600), 2000))
        chunk, size, end = [], 0, start - 1
        for i in range(start - 1, min(len(lines), start - 1 + count)):
            row = f"{i + 1:>5}\t{lines[i]}"
            if size + len(row) > MAX_READ_CHARS:
                break
            chunk.append(row)
            size += len(row) + 1
            end = i + 1
        head = f"{tilde(real)} — {len(lines)} lignes"
        if not chunk:
            return head + (" (fichier vide)" if not lines else f" (aucune ligne à partir de {start})")
        rest = f"\n[… suite : lignes {end + 1} à {len(lines)}, utilise start_line={end + 1} …]" if end < len(lines) else ""
        return f"{head}, lignes {start} à {end} :\n" + "\n".join(chunk) + rest

    def call(self, name, args):
        fn = {"list_folder": self.list_folder, "find_files": self.find_files,
              "search_text": self.search_text, "read_file": self.read_file}.get(name)
        if not fn:
            return f"Outil inconnu : {name}", True
        allowed = set(TOOLS[name]["input_schema"]["properties"])
        try:
            return fn(**{k: v for k, v in (args or {}).items() if k in allowed}), False
        except AccessError as e:
            return str(e), True
        except TypeError as e:
            return f"Paramètres invalides : {e}", True
        except Exception as e:
            return f"Erreur : {e}", True


def describe(name, args):
    """Phrase courte affichée pendant que l'IA consulte les fichiers."""
    a = args or {}
    base = lambda p: os.path.basename(str(p).rstrip("/")) or str(p)
    if name == "list_folder":
        return f"Parcourt {base(a['path'])}/" if a.get("path") else "Regarde les dossiers autorisés"
    if name == "find_files":
        return f"Cherche les fichiers « {a.get('pattern', '')} »" + (f" dans {base(a['path'])}/" if a.get("path") else "")
    if name == "search_text":
        return f"Cherche « {a.get('query', '')} »" + (f" dans {base(a['path'])}" if a.get("path") else " dans les fichiers")
    if name == "read_file":
        return f"Lit {base(a.get('path', ''))}"
    return name


def system_note(roots):
    return ("\n\nAccès aux fichiers (lecture seule) : tu peux consulter ces dossiers de l'utilisateur :\n"
            + "\n".join(f"- {tilde(r)}/" for r in roots)
            + "\nOutils : list_folder, find_files, search_text, read_file. Utilise-les de toi-même quand la demande "
              "porte sur des fichiers ou quand ils aident à répondre (« regarde mon dossier X », « résume le fichier Y », "
              "« retrouve ce que j'ai écrit sur Z »). Tu ne peux rien créer, modifier ni supprimer. "
              "Cite les fichiers que tu as consultés. N'utilise pas les outils si la question ne concerne que la note.")


# =====================================================================
#  Serveur MCP (stdio) pour Claude Code
# =====================================================================
def _mcp(folders):
    box = Toolbox(folders)
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stdin.reconfigure(encoding="utf-8")

    def send(obj):
        sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
        sys.stdout.flush()

    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            msg = json.loads(raw)
        except ValueError:
            continue
        if not isinstance(msg, dict) or msg.get("id") is None:
            continue
        mid, method, params = msg["id"], msg.get("method"), msg.get("params") or {}
        if method == "initialize":
            res = {"protocolVersion": params.get("protocolVersion") or "2025-06-18",
                   "capabilities": {"tools": {"listChanged": False}},
                   "serverInfo": {"name": "jobnote-fichiers", "version": "1.0.0"}}
        elif method == "ping":
            res = {}
        elif method == "tools/list":
            res = {"tools": [{"name": n, "description": t["description"], "inputSchema": t["input_schema"],
                              "annotations": {"readOnlyHint": True}} for n, t in TOOLS.items()]}
        elif method == "tools/call":
            text, err = box.call(params.get("name"), params.get("arguments") or {})
            res = {"content": [{"type": "text", "text": text}], "isError": err}
        elif method in ("resources/list", "prompts/list"):
            res = {method.split("/")[0]: []}
        else:
            send({"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"Méthode inconnue : {method}"}})
            continue
        send({"jsonrpc": "2.0", "id": mid, "result": res})


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "--mcp":
        _mcp(sys.argv[2:])
    else:
        print(__doc__)
