#!/usr/bin/env python3
"""Serveur MCP (stdio) pour JobNote — Python pur, aucune dépendance.

Permet à Claude Code (ou toute IA compatible MCP) de lire et modifier les tâches,
sous-tâches et notes de JobNote. L'application, si elle est ouverte, recharge
automatiquement les changements.

Lancement (par le client MCP) : python3 /chemin/vers/mcp_server.py
"""

import fcntl
import html
import json
import os
import random
import re
import string
import sys
import time
from contextlib import contextmanager

from notes_format import html_to_markdown, markdown_to_html

DATA_DIR = os.environ.get("JOBNOTE_DATA_DIR") or os.path.join(
    os.environ.get("XDG_DATA_HOME") or os.path.expanduser("~/.local/share"), "jobnote"
)
DATA_FILE = os.path.join(DATA_DIR, "data.json")
LOCK_FILE = os.path.join(DATA_DIR, ".lock")
COLORS = ["blue", "teal", "green", "yellow", "orange", "red", "pink", "purple", "slate"]
MAX_INDENT = 6
SERVER_VERSION = "1.0.0"


class ToolError(Exception):
    pass


# =====================================================================
#  Stockage
# =====================================================================
def now_ms():
    return int(time.time() * 1000)


def uid():
    n, digits, out = now_ms(), string.digits + string.ascii_lowercase, ""
    while n:
        n, r = divmod(n, 36)
        out = digits[r] + out
    return out + "".join(random.choices(digits, k=6))


@contextmanager
def locked_data(write=True):
    """Charge les données sous verrou, et les réécrit (atomiquement) si write=True."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(LOCK_FILE, "a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            try:
                with open(DATA_FILE, encoding="utf-8") as f:
                    data = json.load(f)
            except FileNotFoundError:
                data = {"version": 1, "settings": {}, "selectedId": None, "tasks": []}
            data.setdefault("tasks", [])
            yield data
            if write:
                tmp = DATA_FILE + ".mcp.tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
                    f.flush()
                    os.fsync(f.fileno())
                os.replace(tmp, DATA_FILE)
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def find_task(data, ref):
    ref = str(ref or "").strip()
    if not ref:
        raise ToolError("Paramètre « task » manquant (id ou titre de la tâche).")
    tasks = data["tasks"]
    for t in tasks:
        if t.get("id") == ref:
            return t
    low = ref.lower()
    for candidates in (
        [t for t in tasks if t.get("title", "").strip().lower() == low],
        [t for t in tasks if low in t.get("title", "").lower()],
    ):
        if len(candidates) == 1:
            return candidates[0]
        if len(candidates) > 1:
            names = ", ".join(f"« {t['title']} » (id: {t['id']})" for t in candidates)
            raise ToolError(f"Plusieurs tâches correspondent à « {ref} » : {names}. Précise l'id.")
    raise ToolError(f"Aucune tâche ne correspond à « {ref} ». Utilise list_tasks pour voir les tâches.")


def find_line(task, line_id):
    for i, l in enumerate(task["subtasks"]):
        if l["id"] == line_id:
            return i
    raise ToolError(f"Sous-tâche « {line_id} » introuvable dans « {task['title']} ».")


def block_end(lines, i):
    j = i + 1
    while j < len(lines) and lines[j]["indent"] > lines[i]["indent"]:
        j += 1
    return j


def normalize_indents(lines):
    prev = -1
    for l in lines:
        l["indent"] = max(0, min(int(l.get("indent", 0)), prev + 1, MAX_INDENT))
        prev = l["indent"]
    return lines


def one_line(s):
    return re.sub(r"[\r\n]+", " ", str(s or "")).strip()


def parse_outline(text):
    """'- [ ] a\n  - [x] b' -> [{text, done, rel}] (indentation relative)."""
    rows = [r for r in str(text or "").replace("\r", "").split("\n") if r.strip()]
    if not rows:
        return []
    leads = [len(r.replace("\t", "    ")) - len(r.replace("\t", "    ").lstrip(" ")) for r in rows]
    base = min(leads)
    diffs = [x - base for x in leads if x > base]
    unit = min(diffs) if diffs else 2
    out = []
    for r, lead in zip(rows, leads):
        m = re.match(r"^(?:[-*+•]|\d+[.)])?\s*(?:\[([ xX])\])?\s*(.*)$", r.strip())
        out.append({"text": one_line(m.group(2)), "done": bool(m.group(1) and m.group(1).strip()),
                    "rel": round((lead - base) / unit)})
    return out


def new_task(title, color=None):
    t = now_ms()
    return {
        "id": uid(), "title": one_line(title), "done": False,
        "color": color if color in COLORS else random.choice(COLORS),
        "createdAt": t, "updatedAt": t, "doneAt": None, "notes": "", "subtasks": [],
    }


def touch(task):
    task["updatedAt"] = now_ms()


# =====================================================================
#  Mise en forme des réponses
# =====================================================================
def progress(t):
    lines = [l for l in t["subtasks"] if l["text"].strip()]
    return sum(1 for l in lines if l["done"]), len(lines)


def outline(t, with_ids=True):
    if not t["subtasks"]:
        return "(aucune sous-tâche)"
    rows = []
    for l in t["subtasks"]:
        box = "[x]" if l["done"] else "[ ]"
        rid = f"  (id: {l['id']})" if with_ids else ""
        note = "  📝 a une note" if l.get("notes") else ""
        rows.append(f"{'  ' * l['indent']}- {box} {l['text']}{rid}{note}")
    return "\n".join(rows)


def task_summary(t):
    d, n = progress(t)
    state = "terminée" if t["done"] else f"{d}/{n} sous-tâches faites" if n else "aucune sous-tâche"
    notes = " · a des notes" if html_to_markdown(t.get("notes", "")) else ""
    return f"- {t['title'] or 'Sans titre'}  (id: {t['id']}) — {state}{notes}"


def task_detail(t):
    d, n = progress(t)
    head = f"# {t['title'] or 'Sans titre'}\nid: {t['id']} · couleur: {t['color']} · " + (
        "TERMINÉE" if t["done"] else f"progression {d}/{n}")
    notes = html_to_markdown(t.get("notes", "")) or "(vide)"
    out = f"{head}\n\n## Sous-tâches\n{outline(t)}\n\n## Note de la tâche\n{notes}"
    for l in t["subtasks"]:
        if l.get("notes"):
            out += f"\n\n## Note de la sous-tâche « {l['text']} » (id: {l['id']})\n{html_to_markdown(l['notes'])}"
    return out


# =====================================================================
#  Outils
# =====================================================================
def tool_list_tasks(include_done=False, query=None):
    with locked_data(write=False) as data:
        tasks = data["tasks"]
        if query:
            q = str(query).lower()
            tasks = [t for t in tasks if q in t["title"].lower()
                     or any(q in l["text"].lower() or q in html_to_markdown(l.get("notes", "")).lower()
                            for l in t["subtasks"])
                     or q in html_to_markdown(t.get("notes", "")).lower()]
        active = [t for t in tasks if not t["done"]]
        done = [t for t in tasks if t["done"]]
        parts = ["## Tâches en cours"] + ([task_summary(t) for t in active] or ["(aucune)"])
        if include_done:
            parts += ["", "## Tâches terminées"] + ([task_summary(t) for t in done] or ["(aucune)"])
        elif done:
            parts += ["", f"({len(done)} tâche(s) terminée(s) masquée(s) — include_done=true pour les voir)"]
        return "\n".join(parts)


def tool_get_task(task):
    with locked_data(write=False) as data:
        return task_detail(find_task(data, task))


def tool_create_task(title, subtasks=None, notes=None, color=None):
    if not one_line(title):
        raise ToolError("Le titre ne peut pas être vide.")
    with locked_data() as data:
        t = new_task(title, color)
        t["subtasks"] = normalize_indents([
            {"id": uid(), "text": it["text"], "done": it["done"], "indent": it["rel"]}
            for it in parse_outline(subtasks)
        ])
        if notes:
            t["notes"] = markdown_to_html(notes)
        data["tasks"].insert(0, t)
        return "Tâche créée.\n\n" + task_detail(t)


def tool_update_task(task, title=None, done=None, color=None):
    with locked_data() as data:
        t = find_task(data, task)
        if title is not None:
            if not one_line(title):
                raise ToolError("Le titre ne peut pas être vide.")
            t["title"] = one_line(title)
        if done is not None:
            t["done"] = bool(done)
            t["doneAt"] = now_ms() if t["done"] else None
        if color is not None:
            if color not in COLORS:
                raise ToolError(f"Couleur inconnue. Choix : {', '.join(COLORS)}")
            t["color"] = color
        touch(t)
        return "Tâche mise à jour.\n\n" + task_summary(t)


def tool_add_subtasks(task, items, under=None, after=None):
    parsed = parse_outline(items)
    if not parsed:
        raise ToolError("« items » est vide. Format : une sous-tâche par ligne, ex. '- [ ] Faire X\\n  - [ ] Détail'.")
    with locked_data() as data:
        t = find_task(data, task)
        lines = t["subtasks"]
        if under and after:
            raise ToolError("Utilise soit « under », soit « after », pas les deux.")
        if under:
            i = find_line(t, under)
            pos, base = block_end(lines, i), lines[i]["indent"] + 1
        elif after:
            i = find_line(t, after)
            pos, base = block_end(lines, i), lines[i]["indent"]
        else:
            pos, base = len(lines), 0
        new = [{"id": uid(), "text": it["text"], "done": it["done"], "indent": base + it["rel"]} for it in parsed]
        lines[pos:pos] = new
        normalize_indents(lines)
        touch(t)
        return f"{len(new)} sous-tâche(s) ajoutée(s) à « {t['title']} ».\n\n{outline(t)}"


def tool_update_subtask(task, subtask_id, text=None, done=None, indent=None):
    with locked_data() as data:
        t = find_task(data, task)
        lines = t["subtasks"]
        i = find_line(t, subtask_id)
        l = lines[i]
        if text is not None:
            l["text"] = one_line(text)
        if indent is not None:
            delta = int(indent) - l["indent"]
            for k in range(i, block_end(lines, i)):
                lines[k]["indent"] = max(0, lines[k]["indent"] + delta)
        if done is not None:
            l["done"] = bool(done)
            if l["done"]:
                for k in range(i + 1, block_end(lines, i)):
                    lines[k]["done"] = True
        normalize_indents(lines)
        touch(t)
        return f"Sous-tâche mise à jour.\n\n{outline(t)}"


def tool_delete_subtask(task, subtask_id, with_children=True):
    with locked_data() as data:
        t = find_task(data, task)
        lines = t["subtasks"]
        i = find_line(t, subtask_id)
        end = block_end(lines, i) if with_children else i + 1
        removed = end - i
        del lines[i:end]
        normalize_indents(lines)
        touch(t)
        return f"{removed} ligne(s) supprimée(s).\n\n{outline(t)}"


def tool_write_notes(task, markdown, mode="append", subtask_id=None):
    if mode not in ("append", "replace"):
        raise ToolError("mode doit être « append » ou « replace ».")
    with locked_data() as data:
        t = find_task(data, task)
        target = t["subtasks"][find_line(t, subtask_id)] if subtask_id else t
        new_html = markdown_to_html(markdown)
        merged = new_html if mode == "replace" or not target.get("notes") else target["notes"] + new_html
        if merged:
            target["notes"] = merged
        elif subtask_id:
            target.pop("notes", None)
        else:
            target["notes"] = ""
        touch(t)
        where = f"la sous-tâche « {target['text']} »" if subtask_id else f"« {t['title']} »"
        return f"Note de {where} mise à jour ({mode}).\n\n{html_to_markdown(target.get('notes', ''))}"


TASK_PARAM = {"type": "string", "description": "Id de la tâche, ou son titre (ou un morceau unique du titre)."}
OUTLINE_HELP = ("Une sous-tâche par ligne, au format Markdown : '- [ ] texte' (ou '- [x] texte' si déjà faite). "
                "Indente de 2 espaces pour créer des sous-niveaux.")

TOOLS = {
    "list_tasks": (tool_list_tasks, {
        "description": "Liste les tâches principales de JobNote avec leur id et leur progression.",
        "inputSchema": {"type": "object", "properties": {
            "include_done": {"type": "boolean", "description": "Inclure les tâches terminées (défaut: false)."},
            "query": {"type": "string", "description": "Filtre texte (titre, sous-tâches, notes)."},
        }},
        "annotations": {"readOnlyHint": True},
    }),
    "get_task": (tool_get_task, {
        "description": "Affiche une tâche : ses sous-tâches (avec leurs id) et ses notes en Markdown.",
        "inputSchema": {"type": "object", "properties": {"task": TASK_PARAM}, "required": ["task"]},
        "annotations": {"readOnlyHint": True},
    }),
    "create_task": (tool_create_task, {
        "description": "Crée une nouvelle tâche principale, éventuellement avec des sous-tâches et des notes.",
        "inputSchema": {"type": "object", "properties": {
            "title": {"type": "string", "description": "Titre de la tâche."},
            "subtasks": {"type": "string", "description": OUTLINE_HELP},
            "notes": {"type": "string", "description": "Notes en Markdown (titres #, listes -, gras **, citations >, code ```)."},
            "color": {"type": "string", "enum": COLORS},
        }, "required": ["title"]},
    }),
    "update_task": (tool_update_task, {
        "description": "Renomme une tâche, la marque terminée / non terminée, ou change sa couleur.",
        "inputSchema": {"type": "object", "properties": {
            "task": TASK_PARAM,
            "title": {"type": "string"},
            "done": {"type": "boolean"},
            "color": {"type": "string", "enum": COLORS},
        }, "required": ["task"]},
    }),
    "add_subtasks": (tool_add_subtasks, {
        "description": ("Ajoute une ou plusieurs sous-tâches à une tâche. Par défaut à la fin ; "
                        "« under » les place comme enfants d'une sous-tâche, « after » juste après une sous-tâche."),
        "inputSchema": {"type": "object", "properties": {
            "task": TASK_PARAM,
            "items": {"type": "string", "description": OUTLINE_HELP},
            "under": {"type": "string", "description": "Id d'une sous-tâche existante : les nouvelles deviennent ses enfants."},
            "after": {"type": "string", "description": "Id d'une sous-tâche existante : insérer juste après elle (même niveau)."},
        }, "required": ["task", "items"]},
    }),
    "update_subtask": (tool_update_subtask, {
        "description": "Modifie une sous-tâche : texte, cochée ou non, niveau d'indentation (0 = racine).",
        "inputSchema": {"type": "object", "properties": {
            "task": TASK_PARAM,
            "subtask_id": {"type": "string"},
            "text": {"type": "string"},
            "done": {"type": "boolean"},
            "indent": {"type": "integer", "minimum": 0, "maximum": MAX_INDENT},
        }, "required": ["task", "subtask_id"]},
    }),
    "delete_subtask": (tool_delete_subtask, {
        "description": "Supprime une sous-tâche (et par défaut ses sous-niveaux).",
        "inputSchema": {"type": "object", "properties": {
            "task": TASK_PARAM,
            "subtask_id": {"type": "string"},
            "with_children": {"type": "boolean", "description": "Supprimer aussi les sous-niveaux (défaut: true)."},
        }, "required": ["task", "subtask_id"]},
        "annotations": {"destructiveHint": True},
    }),
    "write_notes": (tool_write_notes, {
        "description": ("Écrit dans une note (Markdown) : la note générale de la tâche, ou celle d'une sous-tâche si "
                        "subtask_id est donné. mode=append ajoute à la fin (défaut), replace remplace tout."),
        "inputSchema": {"type": "object", "properties": {
            "task": TASK_PARAM,
            "markdown": {"type": "string"},
            "mode": {"type": "string", "enum": ["append", "replace"]},
            "subtask_id": {"type": "string", "description": "Id d'une sous-tâche (voir get_task) pour écrire dans sa note à elle."},
        }, "required": ["task", "markdown"]},
    }),
}

INSTRUCTIONS = (
    "JobNote est l'application de tâches de l'utilisateur. Chaque tâche principale a des sous-tâches "
    "(une liste à cocher indentable) et une note générale (texte riche) ; chaque sous-tâche peut aussi avoir sa "
    "propre note (write_notes avec subtask_id). Utilise list_tasks pour trouver une tâche, "
    "get_task pour voir ses sous-tâches et leurs id, puis add_subtasks / update_subtask / write_notes. "
    "L'application se met à jour en direct si elle est ouverte."
)


# =====================================================================
#  JSON-RPC sur stdio
# =====================================================================
def send(obj):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def handle(msg):
    if not isinstance(msg, dict):
        return {"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "Invalid Request"}}
    mid, method, params = msg.get("id"), msg.get("method"), msg.get("params") or {}
    if mid is None:  # notification
        return None

    def ok(result):
        return {"jsonrpc": "2.0", "id": mid, "result": result}

    if method == "initialize":
        return ok({
            "protocolVersion": params.get("protocolVersion") or "2025-06-18",
            "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": {"name": "jobnote", "version": SERVER_VERSION},
            "instructions": INSTRUCTIONS,
        })
    if method == "ping":
        return ok({})
    if method == "tools/list":
        return ok({"tools": [{"name": n, **spec} for n, (_, spec) in TOOLS.items()]})
    if method == "tools/call":
        name = params.get("name")
        args = params.get("arguments") or {}
        if name not in TOOLS:
            return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32602, "message": f"Outil inconnu : {name}"}}
        fn, spec = TOOLS[name]
        allowed = set(spec["inputSchema"]["properties"])
        try:
            missing = [k for k in spec["inputSchema"].get("required", []) if args.get(k) in (None, "")]
            if missing:
                raise ToolError(f"Paramètre(s) manquant(s) : {', '.join(missing)}")
            text = fn(**{k: v for k, v in args.items() if k in allowed})
            return ok({"content": [{"type": "text", "text": text}], "isError": False})
        except ToolError as e:
            return ok({"content": [{"type": "text", "text": str(e)}], "isError": True})
        except Exception as e:  # ne jamais faire tomber le serveur
            return ok({"content": [{"type": "text", "text": f"Erreur interne : {e!r}"}], "isError": True})
    if method in ("resources/list", "prompts/list"):
        return ok({method.split("/")[0]: []})
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"Méthode inconnue : {method}"}}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stdin.reconfigure(encoding="utf-8")
    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            send({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}})
            continue
        if isinstance(msg, list):
            replies = [r for r in (handle(m) for m in msg) if r]
            if replies:
                send(replies)
        else:
            reply = handle(msg)
            if reply:
                send(reply)


if __name__ == "__main__":
    main()
