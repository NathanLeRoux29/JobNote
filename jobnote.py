#!/usr/bin/env python3
"""JobNote — liste de tâches avec sous-tâches et notes, pour GNOME.

Fenêtre GTK4 / libadwaita qui héberge l'interface (ui/) dans une WebView.
Les données sont stockées dans ~/.local/share/jobnote/data.json
(sauvegarde automatique + une copie de secours par jour dans backups/).
"""

import fcntl
import json
import os
import sys
import shutil
import datetime

import subprocess


def _sandbox_available():
    """Le bac à sable de WebKit (bubblewrap) a besoin des « user namespaces ».
    Ubuntu 24.04+ les bloque via AppArmor pour les applis lancées depuis le dock
    (le terminal de VS Code, lui, a une exception) : WebKit plante alors au démarrage."""
    try:
        return subprocess.run(["unshare", "-Ur", "true"], stdout=subprocess.DEVNULL,
                              stderr=subprocess.DEVNULL, timeout=3).returncode == 0
    except Exception:
        return False


if "WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS" not in os.environ and not _sandbox_available():
    # L'appli n'affiche que ses propres fichiers locaux et bloque toute navigation
    # externe (voir _on_decide_policy) : se passer du bac à sable est sans risque ici.
    os.environ["WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS"] = "1"

import gi  # noqa: E402

gi.require_version("Gtk", "4.0")
gi.require_version("Adw", "1")
gi.require_version("WebKit", "6.0")
from gi.repository import Adw, Gdk, Gio, GLib, Gtk, WebKit  # noqa: E402

import ai  # noqa: E402
from notes_format import html_to_markdown, markdown_to_html  # noqa: E402

APP_ID = "fr.jobnote.JobNote"
HERE = os.path.dirname(os.path.realpath(__file__))
UI_FILE = os.path.join(HERE, "ui", "index.html")
DATA_DIR = os.environ.get("JOBNOTE_DATA_DIR") or os.path.join(GLib.get_user_data_dir(), "jobnote")
DATA_FILE = os.path.join(DATA_DIR, "data.json")
WINDOW_FILE = os.path.join(DATA_DIR, "window.json")
LOCK_FILE = os.path.join(DATA_DIR, ".lock")  # partagé avec mcp_server.py
BACKUP_DIR = os.path.join(DATA_DIR, "backups")
BACKUPS_KEPT = 14
DEBUG = os.environ.get("JOBNOTE_DEBUG") == "1"

# Couleurs de la barre de titre : identiques au fond de l'interface HTML.
CHROME = {False: ("#ebebef", "#1f1f24"), True: ("#1d1d21", "#ececf1")}


def log(*args):
    print("[jobnote]", *args, file=sys.stderr)


class Store:
    """Lecture / écriture atomique du fichier de données."""

    def __init__(self):
        os.makedirs(BACKUP_DIR, exist_ok=True)
        self.last_text = None  # dernier contenu connu du fichier (lu ou écrit par nous)

    def _lock(self):
        lock = open(LOCK_FILE, "a")
        fcntl.flock(lock, fcntl.LOCK_EX)
        return lock

    def read_disk(self):
        try:
            with open(DATA_FILE, encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return None

    def load(self):
        for path in [DATA_FILE] + self._backups()[::-1]:
            try:
                with open(path, encoding="utf-8") as f:
                    text = f.read()
                json.loads(text)
                if path != DATA_FILE:
                    log("data.json illisible, restauration depuis", path)
                else:
                    self.last_text = text
                return text
            except FileNotFoundError:
                continue
            except Exception as e:  # fichier corrompu : on essaie la sauvegarde suivante
                log("lecture impossible", path, e)
        return None

    def save(self, text, force=False):
        """Écrit les données. Renvoie False (sans rien écrire) si le fichier a été modifié
        par un autre programme (ex. le serveur MCP) depuis la dernière lecture : il faut
        d'abord fusionner ces changements."""
        json.loads(text)  # ne jamais écrire quelque chose d'invalide
        lock = self._lock()
        try:
            disk = self.read_disk()
            if not force and disk is not None and self.last_text is not None and disk != self.last_text:
                return False
            tmp = DATA_FILE + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                f.write(text)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp, DATA_FILE)
            self.last_text = text
        finally:
            lock.close()
        self._daily_backup()
        return True

    def _backups(self):
        try:
            return sorted(
                os.path.join(BACKUP_DIR, n)
                for n in os.listdir(BACKUP_DIR)
                if n.startswith("data-") and n.endswith(".json")
            )
        except FileNotFoundError:
            return []

    def _daily_backup(self):
        target = os.path.join(BACKUP_DIR, f"data-{datetime.date.today().isoformat()}.json")
        if not os.path.exists(target):
            shutil.copy2(DATA_FILE, target)
            for old in self._backups()[:-BACKUPS_KEPT]:
                os.remove(old)

    def theme(self):
        text = self.load()
        try:
            return json.loads(text)["settings"]["theme"] if text else "system"
        except Exception:
            return "system"


class Window(Adw.ApplicationWindow):
    def __init__(self, app, store):
        super().__init__(application=app, title="JobNote")
        self.store = store
        self.ai_config = ai.Config(DATA_DIR)
        self.ai_jobs = {}
        self._closing = False
        self._closed = False
        self.set_size_request(560, 420)
        self._restore_geometry()

        self.style = Adw.StyleManager.get_default()
        self.css = Gtk.CssProvider()
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(), self.css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1
        )

        header = Adw.HeaderBar()
        header.add_css_class("jn-header")
        self.title_widget = Adw.WindowTitle(title="JobNote", subtitle="")
        header.set_title_widget(self.title_widget)

        manager = WebKit.UserContentManager()
        manager.register_script_message_handler("jobnote", None)
        manager.connect("script-message-received::jobnote", self._on_message)

        self.web = WebKit.WebView(user_content_manager=manager)
        self.web.set_vexpand(True)
        settings = self.web.get_settings()
        settings.set_enable_developer_extras(DEBUG)
        settings.set_enable_back_forward_navigation_gestures(False)
        settings.set_javascript_can_access_clipboard(True)
        try:
            ctx = self.web.get_context()
            ctx.set_spell_checking_enabled(True)
            ctx.set_spell_checking_languages(["fr_FR", "en_US"])
        except Exception:
            pass
        self.web.connect("decide-policy", self._on_decide_policy)
        self.web.connect("context-menu", self._on_context_menu)

        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        box.append(header)
        box.append(self.web)
        self.set_content(box)

        self.style.connect("notify::dark", lambda *_: self._apply_dark())
        self._apply_theme_pref(store.theme())
        self._apply_dark()

        # Surveille data.json : rechargement à chaud si une IA (MCP) ou autre le modifie
        self._booted = False
        self._ext_timer = 0
        self.monitor = Gio.File.new_for_path(DATA_DIR).monitor_directory(Gio.FileMonitorFlags.WATCH_MOVES, None)
        self.monitor.connect("changed", self._on_file_changed)

        self.ui_uri = GLib.filename_to_uri(UI_FILE, None)
        self.web.load_uri(self.ui_uri)
        self.connect("close-request", self._on_close_request)

    # ---------- thème ----------
    def _apply_theme_pref(self, pref):
        scheme = {
            "light": Adw.ColorScheme.FORCE_LIGHT,
            "dark": Adw.ColorScheme.FORCE_DARK,
        }.get(pref, Adw.ColorScheme.DEFAULT)
        self.style.set_color_scheme(scheme)

    def _apply_dark(self):
        dark = self.style.get_dark()
        bg, fg = CHROME[dark]
        self.css.load_from_string(
            f"""
            headerbar.jn-header {{ background: {bg}; color: {fg}; box-shadow: none; border: none; }}
            window {{ background: {bg}; }}
            """
        )
        rgba = Gdk.RGBA()
        rgba.parse(bg)
        self.web.set_background_color(rgba)
        self._js(f"window.JobNote && JobNote.setDark({'true' if dark else 'false'})")

    # ---------- pont JS <-> Python ----------
    def _js(self, code, callback=None):
        self.web.evaluate_javascript(code, -1, None, None, None, callback, None)

    def _on_message(self, _manager, value):
        try:
            msg = json.loads(value.to_string())
        except Exception as e:
            log("message invalide", e)
            return
        kind = msg.get("type")
        if kind == "ready":
            self._booted = True
            data = self.store.load()
            payload = json.dumps(data) if data else "null"
            dark = "true" if self.style.get_dark() else "false"
            self._js(f"JobNote.boot({payload} === null ? null : JSON.parse({payload}), {dark})")
        elif kind == "save":
            try:
                if not self.store.save(msg["data"]):
                    self._check_external()  # fusion côté JS, qui ré-enregistrera ensuite
            except Exception as e:
                log("échec de sauvegarde", e)
                self._js("JobNote.saveFailed()")
        elif kind == "theme":
            self._apply_theme_pref(msg.get("value"))
        elif kind.startswith("ai-"):
            self._on_ai_message(kind, msg)
        elif kind == "title":
            self.title_widget.set_subtitle(msg.get("text") or "")

    # ---------- assistant IA ----------
    def _js_call(self, fn, *args):
        self._js(f"window.JobNote && JobNote.{fn}(" + ",".join(json.dumps(a) for a in args) + ")")

    def _on_ai_message(self, kind, msg):
        rid = msg.get("id")
        if kind == "ai-config-get":
            self._js_call("aiConfig", self.ai_config.public())
        elif kind == "ai-config-save":
            c = msg.get("config", {})
            d = self.ai_config.data
            pid = c.get("provider", d["provider"])
            if pid not in ai.PROVIDERS:
                return
            d["provider"] = pid
            d["models"][pid] = (c.get("model") or "").strip()
            if ai.PROVIDERS[pid].get("editable_url") and c.get("baseUrl") is not None:
                d["base_urls"][pid] = c["baseUrl"].strip()
            if c.get("maxTokens"):
                d.setdefault("max_tokens", {})[pid] = int(c["maxTokens"])
            elif "maxTokens" in c:
                d.setdefault("max_tokens", {}).pop(pid, None)
            d["effort"] = c.get("effort", "")
            d["instructions"] = c.get("instructions", "")
            if isinstance(c.get("files"), dict):
                folders = []
                for f in c["files"].get("folders") or []:
                    f = os.path.realpath(os.path.expanduser(str(f)))
                    if f not in folders and f != "/":
                        folders.append(f)
                d["files"] = {"enabled": bool(c["files"].get("enabled")), "folders": folders}
            self.ai_config.save()
            if msg.get("apiKey") is not None:  # "" = supprimer, None = inchangée
                self.ai_config.set_key(pid, msg["apiKey"].strip())
            self._js_call("aiConfig", self.ai_config.public())
        elif kind == "ai-models":
            def work():
                try:
                    cfg = self.ai_config.resolved(msg.get("provider"), {
                        "base_url": msg.get("baseUrl"), "key": msg.get("apiKey") or None})
                    result = {"ok": True, "models": ai.list_models(cfg)}
                except ai.AIError as e:
                    result = {"ok": False, "error": str(e)}
                except Exception as e:
                    result = {"ok": False, "error": f"Erreur : {e}"}
                GLib.idle_add(lambda: self._js_call("aiModels", result) and False)
            import threading
            threading.Thread(target=work, daemon=True).start()
        elif kind == "ai-chats-get":
            self._js_call("aiChats", self._load_chats())
        elif kind == "ai-chat-save":
            try:
                self._save_chat(str(msg.get("taskId")), msg.get("messages") or [])
            except Exception as e:
                log("discussion IA non sauvegardée", e)
        elif kind == "ai-pick":
            self._pick(msg.get("id"), msg.get("what"))
        elif kind in ("ai-run", "ai-test"):
            self._ai_run(rid, kind, msg)
        elif kind == "ai-cancel":
            job = self.ai_jobs.pop(rid, None)
            if job:
                job.cancel()

    def _pick(self, pid, what):
        """Sélecteur GTK : un dossier à autoriser, ou des fichiers à joindre."""
        dialog = Gtk.FileDialog()
        dialog.set_modal(True)
        home = Gio.File.new_for_path(os.path.expanduser("~"))
        dialog.set_initial_folder(home)

        def reply(items):
            self._js_call("aiPicked", pid, what, items)

        if what == "folder":
            dialog.set_title("Dossier que l'IA pourra consulter (lecture seule)")

            def done(dlg, res):
                try:
                    f = dlg.select_folder_finish(res)
                    p = f.get_path() if f else None
                    reply([{"path": p, "label": ai.files_access.tilde(p)}] if p else [])
                except GLib.Error:
                    reply([])
            dialog.select_folder(self, None, done)
        else:
            dialog.set_title("Fichiers à joindre au message")

            def done(dlg, res):
                items = []
                try:
                    files = dlg.open_multiple_finish(res)
                    for i in range(files.get_n_items()):
                        p = files.get_item(i).get_path()
                        if not p:
                            continue
                        try:
                            size = os.path.getsize(p)
                        except OSError:
                            size = 0
                        items.append({"path": p, "name": os.path.basename(p), "size": size,
                                      "sensitive": ai.files_access.is_sensitive(os.path.realpath(p))})
                except GLib.Error:
                    pass
                reply(items)
            dialog.open_multiple(self, None, done)

    def _ai_run(self, rid, kind, msg):
        toolbox = None
        try:
            if kind == "ai-test":
                cfg = self.ai_config.resolved(msg.get("provider"), {
                    "model": msg.get("model"), "base_url": msg.get("baseUrl"),
                    "key": msg.get("apiKey") or None, "effort": msg.get("effort", "")})
                system = "Tu es un test de connexion."
                messages = [{"role": "user", "content": "Réponds uniquement par le mot : OK"}]
            else:
                cfg = self.ai_config.resolved()
                c = msg.get("context", {})
                ctx = {
                    "title": c.get("title", ""), "outline": c.get("outline", ""),
                    "note_md": html_to_markdown(c.get("noteHtml", "")),
                    "subtask": c.get("subtask", ""),
                    "task_note_md": html_to_markdown(c.get("taskNoteHtml", "")) if c.get("subtask") else "",
                    "selection_md": html_to_markdown(c.get("selectionHtml", "")) if c.get("selectionHtml") else "",
                }
                toolbox = self.ai_config.toolbox()
                system = ai.system_prompt(cfg, toolbox)
                messages = ai.build_messages(msg.get("history", []), ctx, msg.get("text", ""), msg.get("files") or [])
        except ai.AIError as e:
            self._js_call("aiError", rid, str(e))
            return
        job = ai.Job()
        self.ai_jobs[rid] = job
        state = {"text": "", "pending": False}

        def render(raw, final):
            segs = ai.split_segments(raw, final)
            for seg in segs:
                seg["html"] = markdown_to_html(seg["md"])
            return segs

        def flush():
            state["pending"] = False
            if rid in self.ai_jobs:
                self._js_call("aiChunk", rid, render(state["text"], False))
            return False

        def on_chunk(text):
            state["text"] = text
            if not state["pending"]:
                state["pending"] = True
                GLib.timeout_add(60, flush)

        def on_done(text):
            def deliver():
                if self.ai_jobs.pop(rid, None):
                    self._js_call("aiDone", rid, render(text, True), text)
                return False
            GLib.idle_add(deliver)

        def on_error(err):
            def deliver():
                if self.ai_jobs.pop(rid, None):
                    self._js_call("aiError", rid, err)
                return False
            GLib.idle_add(deliver)

        def on_status(text):
            GLib.idle_add(lambda: (rid in self.ai_jobs and self._js_call("aiStatus", rid, text)) and False)

        ai.run(cfg, system, messages, on_chunk, on_done, on_error, job, toolbox, on_status)

    # ---------- discussions IA (une par tâche, hors de data.json) ----------
    def _chats_path(self):
        return os.path.join(DATA_DIR, "ai-chats.json")

    def _load_chats(self):
        try:
            with open(self._chats_path(), encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _save_chat(self, task_id, messages):
        chats = self._load_chats()
        if messages:
            chats[task_id] = messages[-200:]
        else:
            chats.pop(task_id, None)
        tmp = self._chats_path() + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(chats, f, ensure_ascii=False)
        os.replace(tmp, self._chats_path())

    def _on_file_changed(self, _monitor, file, other, _event):
        names = {file.get_basename(), other.get_basename() if other else None}
        if "data.json" in names and not self._ext_timer:
            self._ext_timer = GLib.timeout_add(120, self._check_external)

    def _check_external(self):
        self._ext_timer = 0
        if not self._booted:
            return False
        text = self.store.read_disk()
        if not text or text == self.store.last_text:
            return False
        try:
            json.loads(text)
        except Exception:
            return False  # écriture en cours ou fichier invalide : on attend le prochain événement
        self.store.last_text = text
        self._js(f"JobNote.external(JSON.parse({json.dumps(text)}))")
        return False

    def _on_decide_policy(self, _web, decision, kind):
        if kind not in (
            WebKit.PolicyDecisionType.NAVIGATION_ACTION,
            WebKit.PolicyDecisionType.NEW_WINDOW_ACTION,
        ):
            return False
        uri = decision.get_navigation_action().get_request().get_uri() or ""
        if uri.split("#")[0] == self.ui_uri:
            return False
        decision.ignore()
        if uri.startswith(("http://", "https://", "mailto:")):
            Gtk.UriLauncher.new(uri).launch(self, None, None, None)
        return True

    def _on_context_menu(self, _web, menu, hit):
        # Menu natif seulement dans les zones de texte éditables (copier / coller / orthographe)
        if DEBUG:
            return False
        return not hit.context_is_editable()

    # ---------- fenêtre ----------
    def _restore_geometry(self):
        try:
            with open(WINDOW_FILE, encoding="utf-8") as f:
                g = json.load(f)
            self.set_default_size(int(g.get("width", 1180)), int(g.get("height", 760)))
            if g.get("maximized"):
                self.maximize()
        except Exception:
            self.set_default_size(1180, 760)

    def _save_geometry(self):
        try:
            w, h = self.get_default_size()
            with open(WINDOW_FILE, "w", encoding="utf-8") as f:
                json.dump({"width": w, "height": h, "maximized": self.is_maximized()}, f)
        except Exception as e:
            log("géométrie non sauvegardée", e)

    def _on_close_request(self, *_):
        if self._closing:
            return False
        self._closing = True
        self._save_geometry()
        self._js("window.JobNote ? JobNote.serialize() : null", self._on_final_state)
        GLib.timeout_add(1500, self._really_close)
        return True

    def _on_final_state(self, web, result, _data):
        try:
            value = web.evaluate_javascript_finish(result)
            if value is not None and value.is_string():
                text = value.to_string()
                if not self.store.save(text):
                    # Changement externe de dernière minute : on fusionne puis on réessaie
                    self._check_external()
                    self._js("JobNote.serialize()", self._on_final_state_forced)
                    return
        except Exception as e:
            log("sauvegarde finale impossible", e)
        self._really_close()

    def _on_final_state_forced(self, web, result, _data):
        try:
            value = web.evaluate_javascript_finish(result)
            if value is not None and value.is_string():
                self.store.save(value.to_string(), force=True)
        except Exception as e:
            log("sauvegarde finale impossible", e)
        self._really_close()

    def _really_close(self):
        if not self._closed:
            self._closed = True
            self.destroy()
        return False


class App(Adw.Application):
    def __init__(self):
        super().__init__(application_id=APP_ID, flags=Gio.ApplicationFlags.DEFAULT_FLAGS)
        self.store = Store()
        self.window = None

    def do_activate(self):
        Gtk.Window.set_default_icon_name(APP_ID)
        if self.window is None:
            self.window = Window(self, self.store)
        self.window.present()


if __name__ == "__main__":
    sys.exit(App().run(sys.argv))
