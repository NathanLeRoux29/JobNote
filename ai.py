"""Assistant d'écriture IA de JobNote.

Fournisseurs :
  - claude-code : Claude via la CLI Claude Code installée (abonnement, aucune clé)
  - anthropic   : API Claude, via le SDK officiel `anthropic` (installé dans ./vendor)
  - openai, mistral, gemini, openrouter, ollama, custom : toute API compatible OpenAI
    (/chat/completions en streaming), appelée en HTTP simple.

Les clés API sont rangées dans le trousseau GNOME (libsecret), jamais dans data.json.
"""

import json
import os
import re
import shutil
import stat
import subprocess
import sys
import threading
import urllib.error
import urllib.request

import files_access

HERE = os.path.dirname(os.path.realpath(__file__))
VENDOR = os.path.join(HERE, "vendor")

# Modèles Claude qui acceptent le repli automatique côté serveur en cas de refus
FALLBACK_MODELS = {"claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"}

PROVIDERS = {
    "claude-code": {
        "label": "Claude Code (ton abonnement)", "kind": "claude-code", "needs_key": False,
        "hint": "Utilise Claude Code installé sur ce PC et ton abonnement Claude. Aucune clé nécessaire.",
        "model_hint": "Laisse vide pour le modèle par défaut de Claude Code (ex. opus, sonnet, haiku)",
    },
    "anthropic": {
        "label": "Claude – API Anthropic", "kind": "anthropic", "needs_key": True,
        "default_model": "claude-opus-5-5",
        "hint": "Clé à créer sur console.anthropic.com → API Keys. Facturé à l'usage.",
    },
    "openai": {
        "label": "OpenAI", "kind": "openai", "needs_key": True,
        "base_url": "https://api.openai.com/v1", "hint": "Clé à créer sur platform.openai.com.",
    },
    "mistral": {
        "label": "Mistral AI", "kind": "openai", "needs_key": True,
        "base_url": "https://api.mistral.ai/v1", "hint": "Clé à créer sur console.mistral.ai.",
    },
    "gemini": {
        "label": "Google Gemini", "kind": "openai", "needs_key": True,
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "hint": "Clé à créer sur aistudio.google.com.",
    },
    "openrouter": {
        "label": "OpenRouter", "kind": "openai", "needs_key": True,
        "base_url": "https://openrouter.ai/api/v1", "hint": "Une clé, des centaines de modèles : openrouter.ai.",
    },
    "ollama": {
        "label": "Ollama (local, gratuit)", "kind": "openai", "needs_key": False,
        "base_url": "http://localhost:11434/v1", "editable_url": True,
        "hint": "Modèles qui tournent sur ton PC. Installe Ollama puis « ollama pull llama3.2 ».",
    },
    "custom": {
        "label": "Autre (compatible OpenAI)", "kind": "openai", "needs_key": False,
        "base_url": "", "editable_url": True,
        "hint": "N'importe quel service compatible OpenAI (LM Studio, Groq, DeepSeek…). Indique l'adresse /v1.",
    },
}

SYSTEM_CHAT = """Tu es l'assistant intégré à JobNote, l'application de tâches et de notes de l'utilisateur. \
Tu discutes avec lui de la tâche en cours et de ses notes. Le contexte (titre, sous-tâches, note, sélection) \
est joint à son dernier message et reflète toujours l'état actuel de la note.

Deux façons de répondre :
1. Question, avis, explication, discussion (ex. « que comprends-tu de mes notes ? », « qu'est-ce qui manque ? ») : \
réponds directement, de façon concise et utile, en Markdown simple. N'écris PAS de nouvelle version de la note.
2. Seulement quand l'utilisateur demande de modifier, réécrire, corriger, réorganiser, compléter ou rédiger du texte \
pour la note : place le texte proposé entre les balises <note> et </note>, en Markdown, complet et prêt à être \
inséré (aucun commentaire à l'intérieur des balises). Tu peux ajouter une phrase courte avant ou après. \
Le contenu de <note> remplacera la sélection s'il y en a une, sinon toute la note : il doit donc être complet.
Quand il demande des sous-tâches, mets-les entre <sous-taches> et </sous-taches>, une par ligne au format \
« - [ ] texte », indentées de 2 espaces pour les sous-niveaux.

Appuie-toi sur toute la discussion : si l'utilisateur dit « avec ce que tu as compris », réutilise ce que tu as \
expliqué plus tôt. Réponds dans la langue de l'utilisateur. Formats Markdown possibles : titres #, listes - et 1., \
citations >, **gras**, *italique*, ~~barré~~, `code`."""


class AIError(Exception):
    def __init__(self, msg, code=None):
        super().__init__(msg)
        self.code = code


# =====================================================================
#  Configuration et clés
# =====================================================================
class Config:
    def __init__(self, data_dir):
        self.path = os.path.join(data_dir, "ai.json")
        self.keys_file = os.path.join(data_dir, "ai-keys.json")  # repli si pas de trousseau
        self._secret = None
        try:
            import gi
            gi.require_version("Secret", "1")
            from gi.repository import Secret
            self._secret = Secret
            self._schema = Secret.Schema.new(
                "fr.jobnote.JobNote.ApiKey", Secret.SchemaFlags.NONE,
                {"provider": Secret.SchemaAttributeType.STRING},
            )
        except Exception:
            self._secret = None
        self.data = self._load()

    def _load(self):
        default = {
            "provider": "claude-code" if claude_cli() else "anthropic",
            "models": {}, "base_urls": {}, "effort": "", "instructions": "", "max_tokens": {},
            "files": {"enabled": False, "folders": []},
        }
        try:
            with open(self.path, encoding="utf-8") as f:
                default.update(json.load(f))
        except Exception:
            pass
        return default

    def save(self):
        tmp = self.path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False, indent=1)
        os.replace(tmp, self.path)

    # --- clés ---
    def get_key(self, provider):
        if self._secret:
            try:
                key = self._secret.password_lookup_sync(self._schema, {"provider": provider}, None)
                if key:
                    return key
            except Exception:
                pass
        return self._file_keys().get(provider)

    def set_key(self, provider, key):
        if self._secret:
            try:
                if key:
                    self._secret.password_store_sync(
                        self._schema, {"provider": provider}, self._secret.COLLECTION_DEFAULT,
                        f"JobNote – clé API {PROVIDERS[provider]['label']}", key, None)
                else:
                    self._secret.password_clear_sync(self._schema, {"provider": provider}, None)
                self._write_file_key(provider, None)
                return "keyring"
            except Exception:
                pass
        self._write_file_key(provider, key or None)
        return "file"

    def _file_keys(self):
        try:
            with open(self.keys_file, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_file_key(self, provider, key):
        keys = self._file_keys()
        if key:
            keys[provider] = key
        elif provider in keys:
            del keys[provider]
        else:
            return
        fd = os.open(self.keys_file, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, stat.S_IRUSR | stat.S_IWUSR)
        with os.fdopen(fd, "w") as f:
            json.dump(keys, f)

    # --- vue publique (envoyée à l'interface, sans aucune clé) ---
    def public(self):
        provs = []
        for pid, p in PROVIDERS.items():
            provs.append({
                "id": pid, "label": p["label"], "hint": p["hint"], "needsKey": p["needs_key"],
                "hasKey": bool(self.get_key(pid)) if p["kind"] != "claude-code" else False,
                "baseUrl": self.data["base_urls"].get(pid, p.get("base_url", "")),
                "editableUrl": bool(p.get("editable_url")),
                "model": self.data["models"].get(pid, p.get("default_model", "")),
                "modelHint": p.get("model_hint", ""),
                "kind": p["kind"],
                "available": bool(claude_cli()) if p["kind"] == "claude-code" else True,
            })
        return {
            "provider": self.data["provider"], "effort": self.data.get("effort", ""),
            "instructions": self.data.get("instructions", ""), "providers": provs,
            "keyStorage": "trousseau GNOME" if self._secret else "fichier protégé (ai-keys.json)",
            "files": {"enabled": bool(self.data.get("files", {}).get("enabled")),
                      "folders": [{"path": f, "label": files_access.tilde(f), "exists": os.path.isdir(f)}
                                  for f in self.data.get("files", {}).get("folders", [])]},
        }

    def toolbox(self):
        """Outils de lecture des dossiers autorisés, ou None si l'accès est désactivé."""
        f = self.data.get("files") or {}
        if not f.get("enabled"):
            return None
        box = files_access.Toolbox(f.get("folders") or [])
        return box if box.roots else None

    def resolved(self, provider=None, overrides=None):
        """Paramètres effectifs d'un fournisseur (avec la clé)."""
        pid = provider or self.data["provider"]
        if pid not in PROVIDERS:
            raise AIError(f"Fournisseur inconnu : {pid}")
        p = PROVIDERS[pid]
        o = overrides or {}
        return {
            "id": pid, "kind": p["kind"], "label": p["label"],
            "model": (o.get("model") if o.get("model") is not None else self.data["models"].get(pid, p.get("default_model", ""))).strip(),
            "base_url": (o.get("base_url") or self.data["base_urls"].get(pid) or p.get("base_url", "")).rstrip("/"),
            "key": o.get("key") or self.get_key(pid),
            "effort": o.get("effort", self.data.get("effort", "")),
            "instructions": self.data.get("instructions", ""),
            "max_tokens": self.data.get("max_tokens", {}).get(pid) or 64000,
        }


def claude_cli():
    return shutil.which("claude") or next(
        (p for p in [os.path.expanduser("~/.local/bin/claude"), os.path.expanduser("~/.claude/local/claude")]
         if os.path.isfile(p) and os.access(p, os.X_OK)), None)


# =====================================================================
#  Construction de la requête
# =====================================================================
MAX_HISTORY = 24
MAX_NOTE_CHARS = 40000


def build_context(ctx):
    parts = ["[Contexte actuel]"]
    if ctx.get("title"):
        parts.append(f"Tâche : {ctx['title']}")
    if ctx.get("outline"):
        parts.append(f"Sous-tâches :\n{ctx['outline']}")
    def cut(t):
        return t[:MAX_NOTE_CHARS] + "\n[… note tronquée car trop longue …]" if len(t) > MAX_NOTE_CHARS else t

    note = cut(ctx.get("note_md") or "")
    if ctx.get("subtask"):
        task_note = cut(ctx.get("task_note_md") or "")
        parts.append(f'Note générale de la tâche (pour le contexte) :\n"""\n{task_note or "(vide)"}\n"""')
        parts.append(f'Note ouverte : celle de la sous-tâche « {ctx["subtask"]} ». C\'est elle que <note> modifiera :\n'
                     f'"""\n{note or "(vide)"}\n"""')
    else:
        parts.append(f'Note ouverte : la note générale de la tâche :\n"""\n{note or "(vide)"}\n"""')
    if ctx.get("selection_md"):
        parts.append(f'Sélection actuelle dans la note (une proposition <note> la remplacera) :\n"""\n{ctx["selection_md"]}\n"""')
    else:
        parts.append("Aucune sélection : une proposition <note> remplacera toute la note.")
    return "\n\n".join(parts)


MAX_ATTACH_TOTAL = 150000


def _attachments(paths, budget):
    """Contenu des fichiers joints (budget partagé : les plus récents d'abord)."""
    out = []
    for p in paths or []:
        label = files_access.tilde(os.path.realpath(os.path.expanduser(p)))
        if budget[0] <= 0:
            out.append(f"[Fichier joint : {label} — contenu non répété (trop de fichiers joints dans la discussion)]")
            continue
        try:
            text = files_access.read_attachment(p)
        except files_access.AccessError as e:
            out.append(f"[Fichier joint : {label} — {e}]")
            continue
        except Exception as e:
            out.append(f"[Fichier joint : {label} — illisible ({e})]")
            continue
        text = text[:budget[0]]
        budget[0] -= len(text)
        out.append(f'[Fichier joint par l\'utilisateur : {label}]\n"""\n{text}\n"""')
    return "\n\n".join(out)


def build_messages(history, ctx, user_text, files=None):
    """Historique [{role, content, files?}] + nouveau message enrichi du contexte à jour.
    Les fichiers joints sont relus à chaque fois (les plus récents en priorité)."""
    history = history[-MAX_HISTORY:]
    budget = [MAX_ATTACH_TOTAL]
    current_files = _attachments(files, budget)
    attach = {}
    for i in range(len(history) - 1, -1, -1):
        if history[i].get("role") != "assistant" and history[i].get("files"):
            attach[i] = _attachments(history[i]["files"], budget)
    msgs = []
    for i, h in enumerate(history):
        role = "assistant" if h.get("role") == "assistant" else "user"
        content = (h.get("content") or "").strip()
        if attach.get(i):
            content = (content + "\n\n" + attach[i]).strip()
        if not content:
            continue
        if msgs and msgs[-1]["role"] == role:
            msgs[-1]["content"] += "\n\n" + content
        else:
            msgs.append({"role": role, "content": content})
    while msgs and msgs[0]["role"] != "user":
        msgs.pop(0)
    final = build_context(ctx) + "\n\n[Message de l'utilisateur]\n" + user_text
    if current_files:
        final += "\n\n" + current_files
    if msgs and msgs[-1]["role"] == "user":
        msgs[-1]["content"] += "\n\n" + final
    else:
        msgs.append({"role": "user", "content": final})
    return msgs


def system_prompt(cfg, toolbox=None):
    base = SYSTEM_CHAT
    if toolbox:
        base += files_access.system_note(toolbox.roots)
    else:
        base += ("\n\nTu n'as pas accès aux fichiers de l'utilisateur, sauf ceux qu'il joint à ses messages. "
                 "S'il te demande de regarder un dossier, explique-lui qu'il peut autoriser des dossiers "
                 "(lecture seule) dans la configuration de l'IA, ou joindre un fichier avec le trombone.")
    if cfg.get("instructions"):
        base += "\n\nPréférences de l'utilisateur :\n" + cfg["instructions"]
    return base


TAG_RE = re.compile(r"<(note|sous-taches)>|</(note|sous-taches)>")


def split_segments(raw, final=False):
    """Découpe la réponse en morceaux : texte de discussion / proposition <note> / <sous-taches>."""
    segs, mode, i = [], "text", 0

    def add(kind, chunk):
        chunk = chunk.strip("\n")
        if chunk.strip():
            segs.append({"type": {"note": "note", "sous-taches": "subtasks"}.get(kind, "text"), "md": chunk.strip()})

    for m in TAG_RE.finditer(raw):
        add(mode, raw[i:m.start()])
        mode = m.group(1) or "text"
        i = m.end()
    tail = raw[i:]
    if not final:
        tail = re.sub(r"<[/a-z-]*$", "", tail)  # balise en cours d'écriture
    add(mode, tail)
    return segs


def clean_output(text):
    t = text.strip()
    if t.startswith("```"):
        first_nl = t.find("\n")
        if first_nl != -1 and t.endswith("```"):
            t = t[first_nl + 1:-3].strip()
    return t


# =====================================================================
#  Exécution (dans un thread) — on_chunk(texte_cumulé), on_done(texte), on_error(message)
# =====================================================================
class Job:
    def __init__(self):
        self.cancelled = threading.Event()
        self._closers = []

    def cancel(self):
        self.cancelled.set()
        for c in self._closers:
            try:
                c()
            except Exception:
                pass


MAX_TOOL_TURNS = 16


class Emitter:
    """Accumule le texte diffusé ; sep() place un saut de paragraphe avant le prochain morceau
    (quand l'IA reprend la parole après avoir consulté des fichiers)."""

    def __init__(self, job, on_chunk, on_status):
        self.job, self.on_chunk, self.acc, self._sep = job, on_chunk, [], False
        self.on_status = on_status or (lambda _t: None)

    def __call__(self, piece):
        if piece and not self.job.cancelled.is_set():
            if self._sep and self.acc:
                piece = "\n\n" + piece.lstrip("\n")
            self._sep = False
            self.acc.append(piece)
            self.on_chunk("".join(self.acc))

    def sep(self):
        self._sep = True

    def status(self, text):
        if not self.job.cancelled.is_set():
            self.on_status(text)

    def text(self):
        return "".join(self.acc)


def run(cfg, system, messages, on_chunk, on_done, on_error, job, toolbox=None, on_status=None):
    def worker():
        emit = Emitter(job, on_chunk, on_status)
        acc = emit.acc

        try:
            kind = cfg["kind"]
            if kind == "claude-code":
                _run_claude_code(cfg, system, messages, emit, job, toolbox)
            elif kind == "anthropic":
                _run_anthropic(cfg, system, messages, emit, job, toolbox)
            else:
                _run_openai(cfg, system, messages, emit, job, toolbox)
            if not job.cancelled.is_set():
                text = "".join(acc).strip()
                if not text:
                    raise AIError("L'IA n'a renvoyé aucun texte.")
                on_done(text)
        except AIError as e:
            if not job.cancelled.is_set():
                on_error(str(e))
        except Exception as e:  # ne jamais faire planter l'appli
            if not job.cancelled.is_set():
                on_error(f"Erreur inattendue : {e}")

    threading.Thread(target=worker, daemon=True).start()


# ---- Claude Code (CLI, abonnement) ----
def _transcript(messages):
    if len(messages) == 1:
        return messages[0]["content"]
    who = {"user": "Utilisateur", "assistant": "Assistant"}
    past = "\n\n".join(f"[{who[m['role']]}]\n{m['content']}" for m in messages[:-1])
    return f"Historique de notre conversation :\n\n{past}\n\n---\n\n{messages[-1]['content']}"


def _run_claude_code(cfg, system, messages, emit, job, toolbox=None):
    exe = claude_cli()
    if not exe:
        raise AIError("Claude Code est introuvable sur ce PC.")
    cmd = [exe, "-p", "--output-format", "stream-json", "--verbose", "--include-partial-messages",
           "--tools", "", "--no-session-persistence", "--strict-mcp-config", "--setting-sources", "",
           "--system-prompt", system]
    if cfg.get("model"):
        cmd += ["--model", cfg["model"]]
    if cfg.get("effort"):
        cmd += ["--effort", cfg["effort"]]
    if toolbox:
        # seuls nos outils de lecture, servis par files_access.py en MCP ; aucun outil intégré
        server = {"command": sys.executable or "/usr/bin/python3",
                  "args": [os.path.join(HERE, "files_access.py"), "--mcp", *toolbox.roots]}
        cmd += ["--mcp-config", json.dumps({"mcpServers": {"jnfiles": server}}),
                "--allowedTools", ",".join(f"mcp__jnfiles__{n}" for n in files_access.TOOLS),
                "--max-turns", str(MAX_TOOL_TURNS + 1)]
    workdir = os.path.join(os.path.expanduser("~/.cache"), "jobnote")
    os.makedirs(workdir, exist_ok=True)
    proc = subprocess.Popen(cmd, cwd=workdir, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, text=True, encoding="utf-8")
    job._closers.append(proc.kill)
    proc.stdin.write(_transcript(messages))
    proc.stdin.close()
    result_error = None
    streamed = False
    final_text = None
    for line in proc.stdout:
        if job.cancelled.is_set():
            break
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if ev.get("type") == "stream_event":
            e = ev.get("event", {})
            if e.get("type") == "content_block_delta" and e.get("delta", {}).get("type") == "text_delta":
                streamed = True
                emit(e["delta"]["text"])
            elif e.get("type") == "message_start":
                emit.sep()
        elif ev.get("type") == "assistant":
            for c in (ev.get("message") or {}).get("content") or []:
                if isinstance(c, dict) and c.get("type") == "tool_use":
                    emit.status(files_access.describe(str(c.get("name", "")).removeprefix("mcp__jnfiles__"),
                                                      c.get("input") or {}))
        elif ev.get("type") == "result":
            if ev.get("is_error"):
                result_error = ev.get("result") or ev.get("subtype") or "échec"
            final_text = ev.get("result")
    proc.wait()
    if job.cancelled.is_set():
        return
    if result_error:
        raise AIError(f"Claude Code : {result_error}")
    if proc.returncode not in (0, None) and not streamed:
        err = (proc.stderr.read() or "").strip().splitlines()
        raise AIError("Claude Code a échoué" + (f" : {err[-1]}" if err else "") +
                      ". Vérifie que tu es connecté (lance « claude » une fois dans un terminal).")
    if not streamed and final_text:
        emit(final_text)


# ---- API Anthropic (SDK officiel) ----
def _anthropic():
    if VENDOR not in sys.path:
        sys.path.insert(0, VENDOR)
    try:
        import anthropic
        return anthropic
    except ImportError:
        raise AIError("Le SDK Anthropic n'est pas installé. Lance ./install.sh dans le dossier de JobNote.")


def _anthropic_client(cfg):
    anthropic = _anthropic()
    try:
        # Sans clé enregistrée : le SDK cherche ANTHROPIC_API_KEY, un profil `ant auth login`, etc.
        return anthropic, (anthropic.Anthropic(api_key=cfg["key"], max_retries=2) if cfg.get("key")
                           else anthropic.Anthropic(max_retries=2))
    except Exception:
        raise AIError("Aucune clé API Anthropic : ajoute-la dans la configuration IA.")


def _anthropic_errors(anthropic, fn):
    try:
        return fn()
    except anthropic.AuthenticationError:
        raise AIError("Clé API Anthropic refusée. Vérifie-la dans la configuration IA.")
    except anthropic.PermissionDeniedError:
        raise AIError("Cette clé n'a pas accès à ce modèle.")
    except anthropic.NotFoundError:
        raise AIError("Modèle introuvable. Choisis-en un autre dans la configuration IA.")
    except anthropic.RateLimitError as e:
        retry = e.response.headers.get("retry-after") if getattr(e, "response", None) is not None else None
        raise AIError("Limite d'utilisation atteinte" + (f", réessaie dans {retry} s." if retry else ", réessaie plus tard."))
    except anthropic.BadRequestError as e:
        raise AIError(f"Requête refusée : {e.message}")
    except anthropic.APIStatusError as e:
        if e.status_code >= 500:
            raise AIError("Le service Claude est surchargé ou indisponible, réessaie dans un instant.")
        raise AIError(f"Erreur de l'API ({e.status_code}) : {e.message}")
    except anthropic.APIConnectionError:
        raise AIError("Impossible de joindre l'API Anthropic. Vérifie ta connexion.")
    except (anthropic.AnthropicError, TypeError) as e:
        if "auth" in str(e).lower() or "api_key" in str(e):
            raise AIError("Aucune clé API Anthropic : ajoute-la dans la configuration IA.")
        raise AIError(f"Erreur du SDK Anthropic : {e}")


def _run_anthropic(cfg, system, messages, emit, job, toolbox=None):
    anthropic, client = _anthropic_client(cfg)
    model = cfg.get("model") or PROVIDERS["anthropic"]["default_model"]
    kwargs = {"model": model, "max_tokens": int(cfg.get("max_tokens") or 64000), "system": system}
    if cfg.get("effort"):
        kwargs["output_config"] = {"effort": cfg["effort"]}
    tools = [{"name": n, "description": t["description"], "input_schema": t["input_schema"]}
             for n, t in files_access.TOOLS.items()] if toolbox else None
    msgs = list(messages)

    def go():
        for turn in range(MAX_TOOL_TURNS + 1):
            kw = dict(kwargs, messages=msgs)
            if tools:
                kw["tools"] = tools
                if turn == MAX_TOOL_TURNS:
                    kw["tool_choice"] = {"type": "none"}  # assez cherché : il faut répondre
            if model in FALLBACK_MODELS:
                ctx = client.beta.messages.stream(betas=["server-side-fallback-2026-07-01"], fallbacks="default", **kw)
            else:
                ctx = client.messages.stream(**kw)
            with ctx as stream:
                job._closers.append(stream.close)
                for text in stream.text_stream:
                    if job.cancelled.is_set():
                        return
                    emit(text)
                final = stream.get_final_message()
            if final.stop_reason == "refusal":
                raise AIError("Claude a refusé de traiter ce texte.")
            uses = [b for b in final.content if getattr(b, "type", "") == "tool_use"]
            if final.stop_reason != "tool_use" or not uses or not tools:
                return
            msgs.append({"role": "assistant", "content": final.content})
            results = []
            for b in uses:
                if job.cancelled.is_set():
                    return
                emit.status(files_access.describe(b.name, b.input))
                text, err = toolbox.call(b.name, b.input)
                results.append({"type": "tool_result", "tool_use_id": b.id, "content": text, "is_error": err})
            msgs.append({"role": "user", "content": results})
            emit.sep()

    _anthropic_errors(anthropic, go)


# ---- API compatibles OpenAI ----
def _http(cfg, path, body=None, timeout=120):
    if not cfg.get("base_url"):
        raise AIError("Indique l'adresse (URL) du service dans la configuration IA.")
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if cfg.get("key"):
        headers["Authorization"] = f"Bearer {cfg['key']}"
    if cfg["id"] == "openrouter":
        headers["X-Title"] = "JobNote"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(cfg["base_url"] + path, data=data, headers=headers,
                                 method="POST" if data else "GET")
    try:
        return urllib.request.urlopen(req, timeout=timeout)
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read().decode())
            msg = detail.get("error", {}).get("message") if isinstance(detail.get("error"), dict) else detail.get("error") or detail.get("message")
        except Exception:
            msg = None
        if e.code in (401, 403):
            raise AIError(f"Clé API refusée par {cfg['label']}." + (f" ({msg})" if msg else ""))
        if e.code == 404:
            raise AIError(f"Introuvable chez {cfg['label']} (modèle ou adresse)." + (f" ({msg})" if msg else ""))
        if e.code == 429:
            raise AIError("Limite d'utilisation atteinte, réessaie plus tard.", 429)
        raise AIError(f"Erreur {e.code} de {cfg['label']}" + (f" : {msg}" if msg else "."), e.code)
    except urllib.error.URLError as e:
        hint = " Ollama est-il lancé ?" if cfg["id"] == "ollama" else ""
        raise AIError(f"Impossible de joindre {cfg['base_url']}.{hint} ({e.reason})")


def _run_openai(cfg, system, messages, emit, job, toolbox=None):
    if PROVIDERS[cfg["id"]]["needs_key"] and not cfg.get("key"):
        raise AIError(f"Aucune clé API pour {cfg['label']} : ajoute-la dans la configuration IA.")
    if not cfg.get("model"):
        raise AIError("Choisis un modèle dans la configuration IA (bouton « Charger la liste »).")
    msgs = [{"role": "system", "content": system}] + messages
    tools = [{"type": "function", "function": {"name": n, "description": t["description"], "parameters": t["input_schema"]}}
             for n, t in files_access.TOOLS.items()] if toolbox else None
    turn = 0
    while turn <= MAX_TOOL_TURNS:
        body = {"model": cfg["model"], "stream": True, "messages": msgs}
        if tools:
            body["tools"] = tools
            if turn == MAX_TOOL_TURNS:
                body["tool_choice"] = "none"
        try:
            resp = _http(cfg, "/chat/completions", body)
        except AIError as e:
            if tools and turn == 0 and e.code in (400, 404, 422, 500, 501):
                # modèle sans « function calling » : on répond sans accès aux fichiers
                tools = None
                emit.status("Ce modèle ne sait pas consulter les fichiers : réponse sans accès aux dossiers")
                continue
            raise
        job._closers.append(resp.close)
        calls, said = {}, []
        with resp:
            for raw in resp:
                if job.cancelled.is_set():
                    return
                line = raw.decode("utf-8", "replace").strip()
                if not line.startswith("data:"):
                    continue
                payload = line[5:].strip()
                if payload == "[DONE]":
                    break
                try:
                    ev = json.loads(payload)
                except ValueError:
                    continue
                if ev.get("error"):
                    err = ev["error"]
                    raise AIError(err.get("message") if isinstance(err, dict) else str(err))
                for choice in ev.get("choices") or []:
                    delta = choice.get("delta") or {}
                    piece = delta.get("content")
                    if piece:
                        said.append(piece)
                        emit(piece)
                    for tc in delta.get("tool_calls") or []:
                        c = calls.setdefault(tc.get("index", len(calls)), {"id": "", "name": "", "args": ""})
                        if tc.get("id"):
                            c["id"] = tc["id"]
                        fn = tc.get("function") or {}
                        if fn.get("name"):
                            c["name"] = fn["name"]
                        c["args"] += fn.get("arguments") or ""
        if not calls or not tools:
            return
        ordered = [calls[k] for k in sorted(calls)]
        for i, c in enumerate(ordered):
            c["id"] = c["id"] or f"call_{turn}_{i}"
        msgs.append({"role": "assistant", "content": "".join(said) or None, "tool_calls": [
            {"id": c["id"], "type": "function", "function": {"name": c["name"], "arguments": c["args"] or "{}"}}
            for c in ordered]})
        for c in ordered:
            if job.cancelled.is_set():
                return
            try:
                args = json.loads(c["args"] or "{}")
            except ValueError:
                args = {}
            emit.status(files_access.describe(c["name"], args))
            text, _err = toolbox.call(c["name"], args if isinstance(args, dict) else {})
            msgs.append({"role": "tool", "tool_call_id": c["id"], "content": text})
        emit.sep()
        turn += 1


# =====================================================================
#  Liste des modèles
# =====================================================================
def list_models(cfg):
    kind = cfg["kind"]
    if kind == "claude-code":
        return [{"id": m, "label": m} for m in ("opus", "sonnet", "haiku")]
    if kind == "anthropic":
        anthropic, client = _anthropic_client(cfg)
        page = _anthropic_errors(anthropic, lambda: list(client.models.list(limit=100)))
        return [{"id": m.id, "label": getattr(m, "display_name", None) or m.id,
                 "maxTokens": getattr(m, "max_tokens", None)} for m in page]
    if PROVIDERS[cfg["id"]]["needs_key"] and not cfg.get("key"):
        raise AIError("Ajoute d'abord ta clé API.")
    with _http(cfg, "/models", timeout=20) as resp:
        data = json.loads(resp.read().decode())
    items = data.get("data") or data.get("models") or []
    ids = sorted({(m.get("id") or m.get("name", "")).removeprefix("models/") for m in items if isinstance(m, dict)})
    return [{"id": i, "label": i} for i in ids if i]
