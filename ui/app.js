'use strict';
(() => {
  // =====================================================================
  //  Constantes & utilitaires
  // =====================================================================
  const COLORS = {
    blue: '#3584e4', teal: '#2190a4', green: '#3a944a', yellow: '#c88800', orange: '#ed5b00',
    red: '#e62d42', pink: '#d56199', purple: '#9141ac', slate: '#6f8396',
  };
  const COLOR_KEYS = Object.keys(COLORS);
  const MAX_INDENT = 6;

  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    notes: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    sidebar: '<rect width="18" height="18" x="3" y="3" rx="3"/><path d="M9 3v18"/>',
    keyboard: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.67 2.68M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61M2 2l20 20"/>',
    reopen: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    listOl: '<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
    quote: '<path d="M7 7h4v5c0 2.5-1.5 4.5-4 5M14 7h4v5c0 2.5-1.5 4.5-4 5"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    sparkles: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
    rename: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    send: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2.5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
    clip: '<path d="m21 11-8.6 8.6a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L15.5 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    insert: '<path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
    listChecks: '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    spell: '<path d="m6 16 6-12 6 12M8 12h8"/><path d="m16 20 2 2 4-4"/>',
    wand: '<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M15 9h.01M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5"/>',
  };
  const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24">${ICONS[name]}</svg>`;
  const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = () => Date.now();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const oneLine = (s) => String(s || '').replace(/[\r\n]+/g, ' ');
  const stripHtml = (html) => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent || ''; };

  const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  const DATE_FMT_Y = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  function fmtDate(ts) {
    const d = new Date(ts);
    return d.getFullYear() === new Date().getFullYear() ? DATE_FMT.format(d) : DATE_FMT_Y.format(d);
  }
  function fmtAgo(ts) {
    const s = Math.round((now() - ts) / 1000);
    if (s < 45) return 'à l’instant';
    const m = Math.round(s / 60); if (m < 60) return `il y a ${m} min`;
    const h = Math.round(m / 60); if (h < 24) return `il y a ${h} h`;
    const d = Math.round(h / 24); if (d < 7) return d === 1 ? 'hier' : `il y a ${d} jours`;
    return 'le ' + fmtDate(ts);
  }

  // =====================================================================
  //  Pont avec Python (WebKitGTK) — repli localStorage dans un navigateur
  // =====================================================================
  const bridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jobnote;
  const post = (msg) => { if (bridge) bridge.postMessage(JSON.stringify(msg)); };

  // =====================================================================
  //  État
  // =====================================================================
  const defaults = () => ({
    version: 1,
    settings: {
      theme: 'system', notesOpen: true, notesFocus: false, notesWidth: 440,
      sidebarOpen: true, hideDone: false, doneOpen: false, zoom: 1,
    },
    selectedId: null,
    tasks: [],
  });

  function normLine(l) {
    const line = { id: l.id || uid(), text: oneLine(l.text), done: !!l.done, indent: clamp(l.indent | 0, 0, MAX_INDENT) };
    if (typeof l.notes === 'string' && l.notes) line.notes = l.notes;
    return line;
  }
  function normTask(t) {
    return {
      id: t.id || uid(),
      title: oneLine(t.title),
      done: !!t.done,
      color: COLORS[t.color] ? t.color : 'blue',
      createdAt: t.createdAt || now(),
      updatedAt: t.updatedAt || now(),
      doneAt: t.doneAt || null,
      notes: typeof t.notes === 'string' ? t.notes : '',
      subtasks: normalizeIndents(Array.isArray(t.subtasks) ? t.subtasks.map(normLine) : []),
    };
  }
  function normalizeState(s) {
    const d = defaults();
    if (!s || typeof s !== 'object') return d;
    return {
      version: 1,
      settings: Object.assign(d.settings, s.settings || {}),
      selectedId: s.selectedId || null,
      tasks: Array.isArray(s.tasks) ? s.tasks.map(normTask) : [],
    };
  }
  function normalizeIndents(lines) {
    let prev = -1;
    for (const l of lines) { l.indent = clamp(l.indent, 0, Math.min(prev + 1, MAX_INDENT)); prev = l.indent; }
    return lines;
  }

  function welcomeTask() {
    const L = (text, indent = 0, done = false) => ({ text, indent, done });
    return normTask({
      title: 'Bienvenue dans JobNote 👋',
      color: 'blue',
      subtasks: [
        L('Clique sur une ligne et écris, comme dans un éditeur de texte', 0, true),
        L('Entrée crée la sous-tâche suivante'),
        L('Tab pour indenter, Maj+Tab pour désindenter'),
        L('Comme ceci', 1),
        L('Et encore plus loin', 2),
        L('Ctrl+Entrée (ou clic sur la case) pour cocher'),
        L('Alt+Maj+↑ / ↓ pour déplacer une ligne'),
        L('Ctrl+E ouvre / ferme les notes liées à la tâche'),
        L('Ctrl+N pour une nouvelle tâche, clic droit dans la liste pour la couleur'),
      ],
      notes:
        '<h1>Notes de la tâche</h1><p>Chaque tâche principale possède son propre éditeur de texte. ' +
        'Tout est <b>enregistré automatiquement</b>.</p><h2>Raccourcis Markdown</h2><ul>' +
        '<li><code># </code> titre, <code>## </code> sous-titre</li><li><code>- </code> liste à puces, <code>1. </code> liste numérotée</li>' +
        '<li><code>&gt; </code> citation</li><li>Ctrl+B gras, Ctrl+I italique</li></ul>' +
        '<blockquote>Astuce : le bouton ⤢ passe les notes en plein écran.</blockquote>',
    });
  }

  let state = defaults();
  let cur = null; // tâche sélectionnée
  let noteLineId = null; // sous-tâche dont la note est affichée (null = note de la tâche)
  let query = '';
  let synced = new Map(); // id -> JSON de la tâche telle qu'elle était dans le fichier à la dernière synchro
  const snapshotOf = (tasks) => new Map(tasks.map((t) => [t.id, JSON.stringify(t)]));
  const deletedIds = new Set(); // tâches supprimées ici (à ne pas ressusciter lors d'une fusion)

  const taskById = (id) => state.tasks.find((t) => t.id === id) || null;
  function progress(t) {
    const lines = t.subtasks.filter((l) => l.text.trim() !== '');
    return { done: lines.filter((l) => l.done).length, total: lines.length };
  }

  // =====================================================================
  //  Sauvegarde
  // =====================================================================
  let saveTimer = null;
  let dirty = false;
  function scheduleSave() {
    dirty = true;
    setSaveStatus('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 350);
  }
  function saveNow() {
    clearTimeout(saveTimer);
    if (!dirty) { setSaveStatus('saved'); return; }
    dirty = false;
    const data = JSON.stringify(state);
    synced = snapshotOf(state.tasks);
    if (bridge) post({ type: 'save', data });
    else try { localStorage.setItem('jobnote', data); } catch (e) { /* ignore */ }
    setSaveStatus('saved');
  }
  function touch(task) {
    if (task) task.updatedAt = now();
    scheduleSave();
  }
  function setSaveStatus(kind) {
    const el = $('#saveStatus');
    el.className = 'save-status ' + kind;
    el.lastElementChild.textContent = kind === 'saving' ? 'Enregistrement…' : kind === 'error' ? 'Erreur de sauvegarde' : 'Enregistré';
  }

  // =====================================================================
  //  Thème & réglages visuels
  // =====================================================================
  function setDark(dark) { document.documentElement.classList.toggle('dark', !!dark); }
  function applyTheme() {
    const t = state.settings.theme;
    $('#themeBtn').innerHTML = icon(t === 'light' ? 'sun' : t === 'dark' ? 'moon' : 'auto');
    $('#themeBtn').title = 'Thème : ' + ({ light: 'clair', dark: 'sombre', system: 'système' }[t]);
    if (bridge) post({ type: 'theme', value: t });
    else setDark(t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches));
  }
  function cycleTheme() {
    const order = ['system', 'light', 'dark'];
    state.settings.theme = order[(order.indexOf(state.settings.theme) + 1) % 3];
    applyTheme();
    toast('Thème ' + ({ light: 'clair', dark: 'sombre', system: 'du système' }[state.settings.theme]));
    scheduleSave();
  }
  function applyLayout() {
    const s = state.settings;
    const app = $('#app');
    app.classList.toggle('no-sidebar', !s.sidebarOpen);
    app.classList.toggle('no-notes', !s.notesOpen);
    app.classList.toggle('notes-focus', s.notesOpen && s.notesFocus);
    app.classList.toggle('no-task', !cur);
    document.documentElement.style.setProperty('--notes-w', s.notesWidth + 'px');
    document.documentElement.style.zoom = s.zoom;
    $('#notesFocusBtn').innerHTML = icon(s.notesFocus ? 'shrink' : 'expand');
    const nb = $('#notesBtn'); if (nb) nb.classList.toggle('on', s.notesOpen);
  }

  // =====================================================================
  //  Barre latérale
  // =====================================================================
  function ringSvg(t) {
    const { done, total } = progress(t);
    if (t.done || (total > 0 && done === total)) {
      return `<svg class="ring full" viewBox="0 0 20 20" style="transform:none"><circle class="bg" cx="10" cy="10" r="8.5"/><path d="M6.2 10.4l2.5 2.5 5-5.4"/></svg>`;
    }
    const C = 2 * Math.PI * 7.5;
    const off = total ? C * (1 - done / total) : C;
    return `<svg class="ring" viewBox="0 0 20 20"><circle class="bg" cx="10" cy="10" r="7.5"/><circle class="fg" cx="10" cy="10" r="7.5" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg>`;
  }
  function rowHtml(t) {
    const { done, total } = progress(t);
    const sel = cur && t.id === cur.id ? ' selected' : '';
    return `<div class="task-row${sel}${t.done ? ' is-done' : ''}" data-id="${t.id}" draggable="${!query}" style="--c:${COLORS[t.color]}">
      ${ringSvg(t)}
      <span class="row-title">${t.title.trim() ? esc(t.title) : '<em>Sans titre</em>'}</span>
      <span class="row-count">${total && !t.done ? `${done}/${total}` : ''}</span>
    </div>`;
  }
  function matches(t) {
    if (!query) return true;
    const q = query.toLowerCase();
    return t.title.toLowerCase().includes(q)
      || t.subtasks.some((l) => l.text.toLowerCase().includes(q))
      || stripHtml(t.notes).toLowerCase().includes(q)
      || t.subtasks.some((l) => l.notes && stripHtml(l.notes).toLowerCase().includes(q));
  }
  function renderSidebar() {
    const active = state.tasks.filter((t) => !t.done && matches(t));
    const done = state.tasks.filter((t) => t.done && matches(t));
    $('#taskList').innerHTML = active.map(rowHtml).join('')
      || `<div class="empty-side">${query ? 'Aucun résultat' : 'Aucune tâche en cours'}</div>`;
    $('#doneSection').hidden = done.length === 0;
    $('#doneCount').textContent = done.length;
    const open = state.settings.doneOpen || !!query;
    $('#doneToggle').classList.toggle('open', open);
    $('#doneList').hidden = !open;
    $('#doneList').innerHTML = open ? done.map(rowHtml).join('') : '';
  }
  let sidebarRaf = 0;
  function renderSidebarSoon() {
    if (sidebarRaf) return;
    sidebarRaf = requestAnimationFrame(() => { sidebarRaf = 0; renderSidebar(); });
  }

  // =====================================================================
  //  Sélection / gestion des tâches
  // =====================================================================
  let titleTimer = null;
  function postTitle() {
    clearTimeout(titleTimer);
    titleTimer = setTimeout(() => post({ type: 'title', text: cur ? (cur.title || 'Sans titre') : '' }), 120);
  }

  function select(id, opts = {}) {
    if (aiOpen() && (!cur || cur.id !== id)) closeAI(false);
    if (!cur || cur.id !== id) noteLineId = null;
    cur = taskById(id);
    state.selectedId = cur ? cur.id : null;
    renderMain();
    renderNotes();
    renderSidebar();
    applyLayout();
    postTitle();
    scheduleSave();
    if (opts.focusTitle) focusTitle(true);
    const row = $(`.task-row[data-id="${state.selectedId}"]`);
    if (row) row.scrollIntoView({ block: 'nearest' });
  }

  function newTask() {
    const t = normTask({ title: '', color: COLOR_KEYS[state.tasks.length % COLOR_KEYS.length] });
    state.tasks.splice(0, 0, t);
    if (query) { query = ''; $('#search').value = ''; }
    select(t.id, { focusTitle: true });
    touch(t);
  }

  function deleteTask(id) {
    const i = state.tasks.findIndex((t) => t.id === id);
    if (i < 0) return;
    const [t] = state.tasks.splice(i, 1);
    deletedIds.add(t.id);
    if (cur && cur.id === id) {
      const list = state.tasks.filter((x) => !x.done);
      const next = list[Math.min(list.length - 1, Math.max(0, i))] || state.tasks[0] || null;
      select(next ? next.id : null);
    } else renderSidebar();
    scheduleSave();
    toast(`« ${t.title.trim() || 'Sans titre'} » supprimée`, 'Annuler', () => {
      deletedIds.delete(t.id);
      state.tasks.splice(Math.min(i, state.tasks.length), 0, t);
      select(t.id);
    });
  }

  function duplicateTask(id) {
    const t = taskById(id);
    if (!t) return;
    const copy = normTask(JSON.parse(JSON.stringify(t)));
    copy.id = uid();
    copy.title = (t.title || 'Sans titre') + ' (copie)';
    copy.createdAt = copy.updatedAt = now();
    copy.subtasks.forEach((l) => { l.id = uid(); });
    state.tasks.splice(state.tasks.indexOf(t) + 1, 0, copy);
    select(copy.id);
    touch(copy);
  }

  function toggleTaskDone(id) {
    const t = taskById(id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? now() : null;
    touch(t);
    renderSidebar();
    if (cur && cur.id === t.id) renderMainHead();
    if (t.done) toast('Tâche terminée, bravo ✨', 'Annuler', () => toggleTaskDone(id));
  }

  function setColor(id, color) {
    const t = taskById(id);
    if (!t) return;
    t.color = color;
    touch(t);
    renderSidebar();
    if (cur && cur.id === id) { applyTaskColor(); }
  }
  function applyTaskColor() {
    const c = cur ? COLORS[cur.color] : COLORS.blue;
    $('#main').style.setProperty('--c', c);
    $('#notes').style.setProperty('--c', c);
  }

  function moveSelection(delta) {
    const list = [...$$('#taskList .task-row'), ...$$('#doneList .task-row')];
    if (!list.length) return;
    let i = list.findIndex((r) => cur && r.dataset.id === cur.id);
    i = i < 0 ? 0 : clamp(i + delta, 0, list.length - 1);
    select(list[i].dataset.id);
  }

  // =====================================================================
  //  Panneau principal
  // =====================================================================
  function renderMain() {
    const main = $('#main');
    applyTaskColor();
    if (!cur) {
      main.innerHTML = `<div class="empty-state"><div>
        <div class="art">${icon('check')}</div>
        <h2>${state.tasks.length ? 'Choisis une tâche' : 'Rien à faire… pour l’instant'}</h2>
        <p>Sélectionne une tâche à gauche ou crées-en une nouvelle.</p>
        <button class="btn-primary" data-act="new">${icon('plus')} Nouvelle tâche</button>
        <div class="hint" style="justify-content:center"><span><kbd>Ctrl N</kbd>nouvelle tâche</span><span><kbd>F1</kbd>raccourcis</span></div>
      </div></div>`;
      return;
    }
    main.innerHTML = `<div class="main-inner">
      <div class="topbar" id="mainHead"></div>
      <div class="task-title" id="title" contenteditable="plaintext-only" spellcheck="true" data-placeholder="Nouvelle tâche"></div>
      <div class="progress" id="progress"><div class="bar"><i></i></div><span></span></div>
      <div class="lines" id="lines"></div>
      <button class="add-line" data-act="add-line">${icon('plus')} Ajouter une sous-tâche</button>
      <div class="hint">
        <span><kbd>Entrée</kbd>nouvelle ligne</span><span><kbd>Tab</kbd>indenter</span>
        <span><kbd>Ctrl Entrée</kbd>cocher</span><span><kbd>Ctrl E</kbd>notes</span><span><kbd>Alt E</kbd>note de la sous-tâche</span>
      </div>
    </div>`;
    $('#title').textContent = cur.title;
    renderMainHead();
    renderLines();
  }

  function renderMainHead() {
    if (!cur) return;
    const s = state.settings;
    $('#main').classList.toggle('is-done-task', cur.done);
    $('#mainHead').innerHTML = `
      ${s.sidebarOpen ? '' : `<button class="tbtn only-icon" data-act="sidebar" title="Afficher la liste (F9)">${icon('sidebar')}</button>`}
      <button class="color-dot" data-act="color" title="Couleur"></button>
      <span class="meta">Créée le ${fmtDate(cur.createdAt)} · modifiée ${fmtAgo(cur.updatedAt)}</span>
      <span class="spacer"></span>
      <button class="tbtn ${s.hideDone ? 'on' : ''}" data-act="hide-done" title="${s.hideDone ? 'Afficher' : 'Masquer'} les sous-tâches cochées">${icon(s.hideDone ? 'eyeOff' : 'eye')}<span class="lbl">${s.hideDone ? 'Cochées masquées' : 'Cochées visibles'}</span></button>
      <button class="tbtn ${cur.done ? 'done-on' : ''}" data-act="done" title="Ctrl+Maj+Entrée">${icon(cur.done ? 'reopen' : 'circleCheck')}<span class="lbl">${cur.done ? 'Rouvrir' : 'Terminer'}</span></button>
      <button class="tbtn ${s.notesOpen ? 'on' : ''}" id="notesBtn" data-act="notes" title="Notes (Ctrl+E)">${icon('notes')}<span class="lbl">Notes</span></button>
      <button class="tbtn only-icon" data-act="more" title="Plus">${icon('more')}</button>`;
  }

  function updateProgress() {
    if (!cur) return;
    const p = $('#progress');
    if (!p) return;
    const { done, total } = progress(cur);
    const pct = total ? Math.round((done / total) * 100) : 0;
    p.querySelector('i').style.width = pct + '%';
    p.querySelector('span').textContent = !total ? 'Aucune sous-tâche'
      : done === total ? 'Tout est fait ✨' : `${done} sur ${total} · ${pct} %`;
    p.classList.toggle('complete', total > 0 && done === total);
  }

  function focusTitle(selectAll) {
    const el = $('#title');
    if (!el) return;
    el.focus();
    if (selectAll) {
      const r = document.createRange();
      r.selectNodeContents(el);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    } else setCaret(el, el.textContent.length);
  }

  // =====================================================================
  //  Éditeur de sous-tâches (une ligne = une sous-tâche)
  // =====================================================================
  const linesBox = () => $('#lines');
  const lineIndex = (id) => cur.subtasks.findIndex((l) => l.id === id);
  const lineById = (id) => cur.subtasks.find((l) => l.id === id);
  const textOf = (id) => $(`.line[data-id="${id}"] .text`);

  function lineEl(l, fresh) {
    const d = document.createElement('div');
    d.className = 'line' + (l.done ? ' done' : '') + (fresh ? ' fresh' : '') + (l.notes ? ' has-note' : '') + (l.id === noteLineId ? ' note-open' : '');
    d.dataset.id = l.id;
    d.style.setProperty('--indent', l.indent);
    d.innerHTML = `<button class="check" tabindex="-1" aria-label="Cocher">${CHECK_SVG}</button>`
      + `<div class="text" contenteditable="plaintext-only" spellcheck="true"></div>`
      + `<button class="nbtn" tabindex="-1" title="Note de cette sous-tâche (Alt+E)">${icon('notes')}</button>`
      + `<button class="del" tabindex="-1" title="Supprimer la ligne">${icon('x')}</button>`;
    d.querySelector('.text').textContent = l.text;
    return d;
  }

  function renderLines(focus, freshId) {
    const box = linesBox();
    if (!box) return;
    const frag = document.createDocumentFragment();
    for (const l of cur.subtasks) frag.appendChild(lineEl(l, l.id === freshId));
    box.replaceChildren(frag);
    box.classList.toggle('hide-done', state.settings.hideDone);
    updateProgress();
    if (noteLineId && !lineById(noteLineId)) { noteLineId = null; renderNotes(); } else if (noteLineId) renderNotesHead();
    if (focus) focusLine(focus.id, focus.offset);
  }

  function focusLine(id, offset) {
    const el = textOf(id);
    if (!el) return;
    setCaret(el, offset == null ? el.textContent.length : offset);
    const line = el.parentElement;
    const r = line.getBoundingClientRect();
    const m = $('#main').getBoundingClientRect();
    if (r.bottom > m.bottom - 40 || r.top < m.top + 20) line.scrollIntoView({ block: 'nearest' });
  }

  // ---- Curseur ----
  function getSel(el) {
    const s = getSelection();
    if (!s.rangeCount) return { start: 0, end: 0 };
    const r = s.getRangeAt(0);
    if (!el.contains(r.startContainer)) return { start: 0, end: 0 };
    const pre = document.createRange();
    pre.selectNodeContents(el);
    pre.setEnd(r.startContainer, r.startOffset);
    const start = pre.toString().length;
    pre.setEnd(r.endContainer, r.endOffset);
    return { start, end: pre.toString().length };
  }
  function setCaret(el, offset) {
    el.focus();
    const s = getSelection();
    const r = document.createRange();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node, left = offset;
    while ((node = walker.nextNode())) {
      if (left <= node.length) { r.setStart(node, left); r.collapse(true); s.removeAllRanges(); s.addRange(r); return; }
      left -= node.length;
    }
    r.selectNodeContents(el);
    r.collapse(false);
    s.removeAllRanges(); s.addRange(r);
  }
  function caretRect() {
    const s = getSelection();
    if (!s.rangeCount) return null;
    const r = s.getRangeAt(0).cloneRange();
    r.collapse(true);
    const rects = r.getClientRects();
    return rects.length ? rects[0] : null;
  }
  function caretOnEdgeRow(el, top) {
    if (!el.textContent) return true;
    const cr = caretRect();
    if (!cr || (!cr.height && !cr.top)) return true;
    const er = el.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 24;
    return top ? cr.top - er.top < lh * 0.7 : er.bottom - cr.bottom < lh * 0.7;
  }

  // ---- Voisins visibles ----
  function visibleLineEls() {
    return $$('.line', linesBox()).filter((d) => !(state.settings.hideDone && d.classList.contains('done')));
  }
  function neighbour(lineDiv, delta) {
    const v = visibleLineEls();
    return v[v.indexOf(lineDiv) + delta] || null;
  }

  // ---- Historique (annuler / rétablir) ----
  const histories = new Map();
  function hist() {
    let h = histories.get(cur.id);
    if (!h) { h = { undo: [], redo: [], lastType: 0, lastId: null }; histories.set(cur.id, h); }
    return h;
  }
  function currentFocus() {
    const a = document.activeElement;
    if (a && a.classList.contains('text') && a.parentElement.dataset.id) {
      return { id: a.parentElement.dataset.id, offset: getSel(a).start };
    }
    return null;
  }
  // noteFix : notes de sous-tâches (id -> html) à rétablir exactement lors de l'annulation
  // (sinon l'annulation conserve toujours les notes actuelles, pour ne pas perdre ce qu'on a écrit)
  function checkpoint(noteFix) {
    const h = hist();
    const lines = JSON.stringify(cur.subtasks);
    const last = h.undo[h.undo.length - 1];
    if (!last || last.lines !== lines) {
      h.undo.push({ lines, focus: currentFocus(), noteFix });
      if (h.undo.length > 300) h.undo.shift();
    } else if (noteFix) last.noteFix = { ...(last.noteFix || {}), ...noteFix };
    h.redo.length = 0;
    h.lastType = 0;
  }
  function typingCheckpoint(id) {
    const h = hist();
    const t = now();
    if (h.lastId !== id || t - h.lastType > 900) checkpoint();
    h.lastType = t;
    h.lastId = id;
  }
  function undoRedo(isRedo) {
    const h = hist();
    const from = isRedo ? h.redo : h.undo;
    const to = isRedo ? h.undo : h.redo;
    if (!from.length) return;
    const snap = from.pop();
    const inverse = snap.noteFix
      ? Object.fromEntries(Object.keys(snap.noteFix).map((nid) => [nid, (lineById(nid) || {}).notes || '']))
      : undefined;
    to.push({ lines: JSON.stringify(cur.subtasks), focus: currentFocus(), noteFix: inverse });
    const liveNotes = new Map(cur.subtasks.map((l) => [l.id, l.notes || '']));
    cur.subtasks = JSON.parse(snap.lines);
    for (const l of cur.subtasks) {
      if (!liveNotes.has(l.id)) continue; // ligne qui revient : on garde la note de l'instantané
      if (liveNotes.get(l.id)) l.notes = liveNotes.get(l.id); else delete l.notes;
    }
    if (snap.noteFix) {
      for (const [nid, html] of Object.entries(snap.noteFix)) {
        const l = lineById(nid);
        if (l) { if (html) l.notes = html; else delete l.notes; }
      }
      if (noteLineId && noteLineId in snap.noteFix) setTimeout(renderNotes, 0);
    }
    h.lastType = 0;
    touch(cur);
    renderLines(snap.focus);
    if (!snap.focus && cur.subtasks.length) focusLine(cur.subtasks[0].id, 0);
    renderSidebarSoon();
  }

  // ---- Opérations ----
  function blockEnd(i) {
    const lines = cur.subtasks;
    let j = i + 1;
    while (j < lines.length && lines[j].indent > lines[i].indent) j++;
    return j;
  }
  function shiftIndent(i, delta) {
    const lines = cur.subtasks;
    const L = lines[i];
    if (delta > 0) {
      if (i === 0 || L.indent >= Math.min(lines[i - 1].indent + 1, MAX_INDENT)) return false;
    } else if (L.indent === 0) return false;
    const end = blockEnd(i);
    for (let k = i; k < end; k++) lines[k].indent = clamp(lines[k].indent + delta, 0, MAX_INDENT);
    normalizeIndents(lines);
    return true;
  }
  function moveBlock(i, dir) {
    const lines = cur.subtasks;
    const L = lines[i];
    const end = blockEnd(i);
    if (dir < 0) {
      let j = i - 1;
      while (j >= 0 && lines[j].indent > L.indent) j--;
      if (j < 0 || lines[j].indent !== L.indent) return false;
      const block = lines.splice(i, end - i);
      lines.splice(j, 0, ...block);
    } else {
      if (end >= lines.length || lines[end].indent !== L.indent) return false;
      const nextEnd = blockEnd(end);
      const block = lines.splice(i, end - i);
      lines.splice(nextEnd - block.length, 0, ...block);
    }
    normalizeIndents(lines);
    return true;
  }
  function addLineAt(index, props = {}, focus = true) {
    const l = normLine({ text: '', indent: 0, ...props });
    cur.subtasks.splice(index, 0, l);
    normalizeIndents(cur.subtasks);
    touch(cur);
    renderLines(focus ? { id: l.id, offset: 0 } : null, l.id);
    renderSidebarSoon();
    return l;
  }
  function appendLine() {
    if (!cur) return;
    const last = cur.subtasks[cur.subtasks.length - 1];
    if (last && last.text === '' && !(state.settings.hideDone && last.done)) { focusLine(last.id, 0); return; }
    checkpoint();
    addLineAt(cur.subtasks.length, { indent: last ? last.indent : 0 });
  }
  function toggleLine(id) {
    const i = lineIndex(id);
    if (i < 0) return;
    checkpoint();
    const L = cur.subtasks[i];
    L.done = !L.done;
    const changed = [L];
    if (L.done) for (let k = i + 1; k < blockEnd(i); k++) { cur.subtasks[k].done = true; changed.push(cur.subtasks[k]); }
    for (const l of changed) {
      const d = $(`.line[data-id="${l.id}"]`);
      if (d) d.classList.toggle('done', l.done);
    }
    touch(cur);
    updateProgress();
    renderSidebarSoon();
    if (state.settings.hideDone && L.done) {
      // laisser l'animation de la coche se jouer avant de masquer
      const focus = currentFocus();
      const els = changed.map((l) => $(`.line[data-id="${l.id}"]`)).filter(Boolean);
      els.forEach((d) => { d.style.display = 'flex'; });
      setTimeout(() => els.forEach((d) => d.classList.add('leaving')), 350);
      setTimeout(() => {
        const next = focus && neighbourAfterHide(focus.id);
        renderLines(next ? { id: next, offset: 0 } : null);
      }, 700);
    }
    const { done, total } = progress(cur);
    if (L.done && total > 1 && done === total) toast('Toutes les sous-tâches sont faites ✨');
  }
  function neighbourAfterHide(id) {
    const i = lineIndex(id);
    for (let k = i + 1; k < cur.subtasks.length; k++) if (!cur.subtasks[k].done) return cur.subtasks[k].id;
    for (let k = i - 1; k >= 0; k--) if (!cur.subtasks[k].done) return cur.subtasks[k].id;
    return null;
  }
  function removeLine(id, focusDelta = -1) {
    const i = lineIndex(id);
    if (i < 0) return;
    const div = $(`.line[data-id="${id}"]`);
    const target = div && (neighbour(div, focusDelta) || neighbour(div, -focusDelta));
    checkpoint();
    const [gone] = cur.subtasks.splice(i, 1);
    normalizeIndents(cur.subtasks);
    touch(cur);
    renderLines(target ? { id: target.dataset.id, offset: focusDelta < 0 ? null : 0 } : null);
    renderSidebarSoon();
    if (gone.notes) toast('Sous-tâche supprimée avec sa note', 'Annuler', () => undoRedo(false));
  }

  // ---- Clavier dans une ligne ----
  function onLineKeydown(e) {
    const textEl = e.target.closest('.text');
    if (!textEl || e.isComposing) return;
    const lineDiv = textEl.parentElement;
    const id = lineDiv.dataset.id;
    const i = lineIndex(id);
    if (i < 0) return;
    const L = cur.subtasks[i];
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;
    const k = key.length === 1 ? key.toLowerCase() : key;
    const sel = getSel(textEl);
    const collapsed = sel.start === sel.end;

    if (mod && !e.shiftKey && k === 'z') { e.preventDefault(); undoRedo(false); return; }
    if (mod && (k === 'y' || (e.shiftKey && k === 'z'))) { e.preventDefault(); undoRedo(true); return; }

    if (key === 'Enter' && mod && !e.shiftKey) { e.preventDefault(); toggleLine(id); return; }
    if (key === 'Enter' && e.shiftKey && !mod) { e.preventDefault(); return; }

    if (key === 'Enter' && !mod && !e.altKey) {
      e.preventDefault();
      L.text = oneLine(textEl.textContent);
      if (L.text === '' && L.indent > 0) {
        checkpoint(); shiftIndent(i, -1); touch(cur); renderLines({ id, offset: 0 }); return;
      }
      checkpoint();
      if (sel.start === 0 && collapsed && L.text !== '') {
        addLineAt(i, { indent: L.indent }, false);
        focusLine(id, 0);
        return;
      }
      const before = L.text.slice(0, sel.start);
      const after = L.text.slice(sel.end);
      L.text = before;
      const hasChildren = i + 1 < cur.subtasks.length && cur.subtasks[i + 1].indent > L.indent;
      const indent = hasChildren && after === '' ? L.indent + 1 : L.indent;
      addLineAt(i + 1, { text: after, indent });
      return;
    }

    if (key === 'Tab') {
      e.preventDefault();
      checkpoint();
      if (shiftIndent(i, e.shiftKey ? -1 : 1)) { touch(cur); renderLines({ id, offset: sel.start }); }
      return;
    }

    if (key === 'Backspace' && !mod && collapsed && sel.start === 0) {
      if (L.indent > 0) {
        e.preventDefault(); checkpoint(); shiftIndent(i, -1); touch(cur); renderLines({ id, offset: 0 }); return;
      }
      const prev = neighbour(lineDiv, -1);
      if (prev) {
        e.preventDefault();
        L.text = oneLine(textEl.textContent);
        mergeLines(lineById(prev.dataset.id), L, { focusId: id, focusOffset: 0 });
        return;
      }
      const next = neighbour(lineDiv, 1);
      if (next && textEl.textContent === '') { e.preventDefault(); removeLine(id, 1); }
      return;
    }

    if (key === 'Delete' && !mod && collapsed && sel.start === textEl.textContent.length) {
      const next = neighbour(lineDiv, 1);
      if (next) {
        e.preventDefault();
        L.text = oneLine(textEl.textContent);
        mergeLines(L, lineById(next.dataset.id), { focusId: id, focusOffset: L.text.length });
      }
      return;
    }

    if (e.altKey && !mod && !e.shiftKey && k === 'e') {
      e.preventDefault();
      L.text = oneLine(textEl.textContent);
      openLineNote(id);
      return;
    }

    if (mod && e.shiftKey && (k === 'k' || key === 'Backspace')) {
      e.preventDefault(); removeLine(id, -1); return;
    }

    if (e.altKey && e.shiftKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
      e.preventDefault();
      checkpoint();
      if (moveBlock(i, key === 'ArrowUp' ? -1 : 1)) { touch(cur); renderLines({ id, offset: sel.start }); }
      return;
    }

    if ((key === 'ArrowUp' || key === 'ArrowDown') && !mod && !e.altKey && !e.shiftKey) {
      const up = key === 'ArrowUp';
      if (!caretOnEdgeRow(textEl, up)) return;
      const target = neighbour(lineDiv, up ? -1 : 1);
      e.preventDefault();
      if (target) {
        const tt = target.querySelector('.text');
        focusLine(target.dataset.id, Math.min(sel.start, tt.textContent.length));
      } else if (up) focusTitle(false);
      else setCaret(textEl, textEl.textContent.length);
      return;
    }
  }

  function onLineInput(e) {
    const textEl = e.target.closest('.text');
    if (!textEl) return;
    const L = lineById(textEl.parentElement.dataset.id);
    if (!L) return;
    let t = textEl.textContent;
    if (/[\r\n]/.test(t)) {
      const off = getSel(textEl).start;
      t = oneLine(t);
      textEl.textContent = t;
      setCaret(textEl, off);
    }
    L.text = t;
    touch(cur);
    if (L.id === noteLineId) renderNotesHead();
    updateProgress();
    renderSidebarSoon();
  }

  function parsePasted(text) {
    const rows = text.replace(/\r/g, '').split('\n').filter((r) => r.trim() !== '');
    const leads = rows.map((r) => r.replace(/\t/g, '    ').match(/^ */)[0].length);
    const min = Math.min(...leads);
    const diffs = leads.map((x) => x - min).filter((x) => x > 0);
    const unit = diffs.length ? Math.min(...diffs) : 2;
    return rows.map((r, n) => {
      const m = r.trim().match(/^(?:[-*+•]|\d+[.)])?\s*(?:\[([ xX])\])?\s*(.*)$/);
      return { rel: Math.round((leads[n] - min) / unit), done: !!(m[1] && m[1].trim()), text: m[2] };
    });
  }
  function onLinePaste(e) {
    const textEl = e.target.closest('.text');
    if (!textEl) return;
    e.preventDefault();
    const raw = e.clipboardData.getData('text/plain') || '';
    if (!/\n/.test(raw.trim())) { document.execCommand('insertText', false, oneLine(raw)); return; }
    const id = textEl.parentElement.dataset.id;
    const i = lineIndex(id);
    const L = cur.subtasks[i];
    checkpoint();
    const sel = getSel(textEl);
    const full = oneLine(textEl.textContent);
    const before = full.slice(0, sel.start);
    const after = full.slice(sel.end);
    const items = parsePasted(raw);
    const first = items.shift();
    L.text = before + first.text;
    const added = items.map((it) => normLine({ text: it.text, done: it.done, indent: L.indent + it.rel }));
    let lastId = id, lastOff = L.text.length;
    if (added.length) {
      const last = added[added.length - 1];
      lastOff = last.text.length;
      last.text += after;
      lastId = last.id;
    } else L.text += after;
    cur.subtasks.splice(i + 1, 0, ...added);
    normalizeIndents(cur.subtasks);
    touch(cur);
    renderLines({ id: lastId, offset: lastOff });
    renderSidebarSoon();
  }

  // =====================================================================
  //  Notes (éditeur de texte riche lié à la tâche)
  // =====================================================================
  const editor = () => $('#notesEditor');
  function renderNotes() {
    const ed = editor();
    if (!cur) { ed.innerHTML = ''; return; }
    if (noteLineId && !lineById(noteLineId)) noteLineId = null;
    const line = noteTargetLine();
    ed.innerHTML = (line ? line.notes : cur.notes) || '';
    ed.dataset.placeholder = line ? 'Notes de cette sous-tâche…  # titre, - liste, > citation' : 'Notes générales de la tâche…  # titre, - liste, > citation';
    $$('p:empty', ed).forEach((el) => el.remove());
    renderNotesHead();
    markNoteLine();
    updateNotesMeta();
    histSync();
  }
  function updateNotesMeta() {
    const ed = editor();
    const text = ed.textContent.trim();
    const hasStructure = ed.querySelector('li, h1, h2, h3, blockquote, pre, hr');
    ed.classList.toggle('empty', !text && !hasStructure);
    const words = text ? text.split(/\s+/).length : 0;
    $('#wordCount').textContent = words ? `${words} mot${words > 1 ? 's' : ''} · ${text.length} caractères` : 'Vide';
  }
  // ---------------------------------------------------------------------
  //  Historique des notes (Ctrl+Z / Ctrl+Y) : un historique par note
  //  (note générale ou note de sous-tâche), conservé quand on change de note.
  // ---------------------------------------------------------------------
  const noteHist = new Map();
  let histMute = false;
  const NOTE_BLOCK = /^(P|DIV|H1|H2|H3|LI|BLOCKQUOTE|PRE|UL|OL)$/;
  function histOf() {
    const k = cur ? cur.id + (noteLineId ? ':' + noteLineId : '') : '';
    let h = noteHist.get(k);
    if (!h) { h = { stack: [], idx: -1, at: 0, start: 0, kind: '', brk: false, before: null }; noteHist.set(k, h); }
    return h;
  }
  // position du curseur sous forme d'un nombre (texte + 1 par bloc / saut de ligne)
  function caretPos(c, o) {
    const ed = editor();
    let n = 0;
    const visit = (node) => {
      if (node.nodeType === 3) { if (node === c) { n += o; return true; } n += node.length; return false; }
      if (node !== ed && (node.nodeName === 'BR' || NOTE_BLOCK.test(node.nodeName))) n += 1;
      const kids = node.childNodes;
      for (let i = 0; i < kids.length; i++) {
        if (node === c && i === o) return true;
        if (visit(kids[i])) return true;
      }
      return node === c;
    };
    visit(ed);
    return n;
  }
  function pointAt(pos) {
    const ed = editor();
    let n = 0;
    const visit = (node) => {
      if (node.nodeType === 3) { if (pos <= n + node.length) return [node, pos - n]; n += node.length; return null; }
      if (node.nodeName === 'BR') {
        if (pos <= n) return [node.parentNode, [...node.parentNode.childNodes].indexOf(node)];
        n += 1; return null;
      }
      if (node !== ed && NOTE_BLOCK.test(node.nodeName)) { n += 1; if (pos <= n && !node.firstChild) return [node, 0]; }
      for (const k of node.childNodes) { const r = visit(k); if (r) return r; }
      return null;
    };
    return visit(ed) || [ed, ed.childNodes.length];
  }
  function noteSel() {
    const s = getSelection();
    if (!s.rangeCount) return null;
    const r = s.getRangeAt(0);
    const ed = editor();
    if (!ed.contains(r.startContainer) || !ed.contains(r.endContainer)) return null;
    return [caretPos(r.startContainer, r.startOffset), caretPos(r.endContainer, r.endOffset)];
  }
  function setNoteSel(sel) {
    const ed = editor();
    if (document.activeElement !== ed) ed.focus({ preventScroll: true });
    const r = document.createRange();
    if (sel) {
      const a = pointAt(sel[0]), b = pointAt(sel[1]);
      try { r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]); } catch (err) { r.selectNodeContents(ed); r.collapse(false); }
    } else { r.selectNodeContents(ed); r.collapse(false); }
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    const n = r.startContainer.nodeType === 3 ? r.startContainer.parentNode : r.startContainer;
    if (n && n !== ed && n.scrollIntoView) n.scrollIntoView({ block: 'nearest' });
  }
  // enregistre l'état courant ; les frappes rapprochées forment une seule étape (par mot)
  function histRecord(kind) {
    if (histMute || !cur) return;
    const h = histOf();
    const html = editor().innerHTML;
    const sel = noteSel();
    const before = h.before; h.before = null;
    if (h.idx >= 0 && h.stack[h.idx].html === html) { h.stack[h.idx].sel = sel; return; }
    h.stack.length = h.idx + 1;
    const now = Date.now();
    const merge = kind && kind === h.kind && !h.brk && h.idx > 0 && now - h.at < 1200 && now - h.start < 6000;
    if (merge) { h.stack[h.idx].html = html; h.stack[h.idx].sel = sel; }
    else {
      h.stack.push({ html, sel, before: before || (h.idx >= 0 ? h.stack[h.idx].sel : null) });
      h.idx++; h.start = now;
      if (h.stack.length > 300) { h.stack.shift(); h.idx--; }
    }
    h.at = now; h.kind = kind || ''; h.brk = false;
  }
  function histBreak() { if (cur) histOf().brk = true; }
  // aligne l'historique sur le contenu affiché (changement de note, rechargement, fusion…)
  function histSync() {
    if (!cur) return;
    const h = histOf();
    const html = editor().innerHTML;
    if (h.idx >= 0 && h.stack[h.idx].html === html) return;
    h.stack.length = h.idx + 1;
    h.stack.push({ html, sel: null, before: null });
    h.idx++; h.kind = ''; h.brk = false;
  }
  function noteUndo(redo) {
    if (!cur) return;
    histRecord('');
    const h = histOf();
    const ni = h.idx + (redo ? 1 : -1);
    if (ni < 0 || ni >= h.stack.length) return;
    const from = h.stack[h.idx], to = h.stack[ni];
    h.idx = ni; h.kind = ''; h.brk = true;
    editor().innerHTML = to.html;
    setNoteSel(redo ? to.sel : from.before || to.sel);
    storeNote();
  }
  function onNotesBeforeInput(e) {
    if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
      e.preventDefault(); noteUndo(e.inputType === 'historyRedo'); return;
    }
    if (!histMute && cur) { const h = histOf(); if (!h.before) h.before = noteSel(); }
  }

  function onNotesInput(e) {
    if (!cur) return;
    if (e && e.inputType === 'insertText' && e.data === ' ' && !histMute) {
      // « # » + espace : l'annulation rend d'abord le texte « # » tapé
      histRecord('type');
      histMute = true;
      let changed = false;
      try { const before = editor().innerHTML; markdownShortcut(); changed = editor().innerHTML !== before; } finally { histMute = false; }
      storeNote();
      if (changed) histRecord(''); else { histOf().brk = true; }
      return;
    }
    storeNote();
    const t = e && e.inputType;
    histRecord(t === 'insertText' ? 'type' : /^delete(Content|Word)/.test(t || '') ? 'del' : '');
  }
  function storeNote() {
    if (!cur) return;
    const ed = editor();
    const html = ed.textContent.trim() || ed.querySelector('li, h1, h2, h3, blockquote, pre, hr') ? ed.innerHTML : '';
    const line = noteTargetLine();
    if (line) {
      if (html) line.notes = html; else delete line.notes;
      const d = $(`.line[data-id="${line.id}"]`);
      if (d) d.classList.toggle('has-note', !!html);
      updateNotesSwitch();
    } else cur.notes = html;
    touch(cur);
    updateNotesMeta();
    renderSidebarSoon();
  }
  function currentBlock() {
    const s = getSelection();
    if (!s.rangeCount) return null;
    let n = s.getRangeAt(0).startContainer;
    const ed = editor();
    while (n && n !== ed) {
      if (n.nodeType === 1 && /^(P|DIV|H1|H2|H3|LI|BLOCKQUOTE|PRE)$/.test(n.nodeName)) return n;
      n = n.parentNode;
    }
    return ed;
  }
  function markdownShortcut() {
    const s = getSelection();
    if (!s.rangeCount) return;
    const block = currentBlock();
    if (!block || block.nodeName === 'PRE' || block.nodeName === 'LI') return;
    const r = s.getRangeAt(0);
    const pre = document.createRange();
    pre.selectNodeContents(block);
    pre.setEnd(r.startContainer, r.startOffset);
    const before = pre.toString().replace(/ /g, ' ');
    const rules = { '# ': 'h1', '## ': 'h2', '### ': 'h3', '- ': 'ul', '* ': 'ul', '1. ': 'ol', '> ': 'blockquote', '``` ': 'pre' };
    const action = rules[before];
    if (!action) return;
    s.removeAllRanges();
    s.addRange(pre);
    document.execCommand('delete');
    if (action === 'ul') document.execCommand('insertUnorderedList');
    else if (action === 'ol') document.execCommand('insertOrderedList');
    else document.execCommand('formatBlock', false, action);
  }
  function blockTag() {
    const b = currentBlock();
    if (!b) return '';
    let n = b;
    while (n && n !== editor()) { if (/^(H1|H2|H3|BLOCKQUOTE|PRE)$/.test(n.nodeName)) return n.nodeName.toLowerCase(); n = n.parentNode; }
    return '';
  }
  function runCmd(cmd) {
    const ed = editor();
    if (document.activeElement !== ed) ed.focus();
    const tag = blockTag();
    switch (cmd) {
      case 'h1': case 'h2': case 'quote': case 'code': {
        const want = { h1: 'h1', h2: 'h2', quote: 'blockquote', code: 'pre' }[cmd];
        document.execCommand('formatBlock', false, tag === want ? 'p' : want);
        break;
      }
      case 'ul': document.execCommand('insertUnorderedList'); break;
      case 'ol': document.execCommand('insertOrderedList'); break;
      default: document.execCommand(cmd);
    }
    onNotesInput();
    updateToolbar();
  }
  function updateToolbar() {
    if (document.activeElement !== editor()) { $$('#toolbar button').forEach((b) => b.classList.remove('on')); return; }
    const tag = blockTag();
    const st = (c) => { try { return document.queryCommandState(c); } catch (e) { return false; } };
    const on = {
      h1: tag === 'h1', h2: tag === 'h2', quote: tag === 'blockquote', code: tag === 'pre',
      bold: st('bold'), italic: st('italic'), strikeThrough: st('strikeThrough'),
      ul: st('insertUnorderedList'), ol: st('insertOrderedList'),
    };
    $$('#toolbar button').forEach((b) => b.classList.toggle('on', !!on[b.dataset.cmd]));
  }
  function onNotesKeydown(e) {
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (mod && !e.altKey && k === 'z') { e.preventDefault(); noteUndo(e.shiftKey); return; }
    if (mod && !e.altKey && !e.shiftKey && k === 'y') { e.preventDefault(); noteUndo(true); return; }
    if (e.altKey && !mod && e.key.toLowerCase() === 'e' && noteLineId) {
      e.preventDefault();
      if (textOf(noteLineId)) focusLine(noteLineId);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const inList = !!(currentBlock() && currentBlock().closest && currentBlock().closest('li'));
      if (inList) document.execCommand(e.shiftKey ? 'outdent' : 'indent');
      else if (!e.shiftKey) document.execCommand('insertText', false, '    ');
      onNotesInput();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !mod) {
      // sortir d'un titre / d'une citation vide pour revenir à un paragraphe
      const tag = blockTag();
      const b = currentBlock();
      if ((tag === 'blockquote' || tag === 'pre') && b && b.textContent === '') {
        e.preventDefault();
        document.execCommand('formatBlock', false, 'p');
      }
    }
    if (mod && e.key.toLowerCase() === 'u') { /* souligné natif, ok */ }
  }
  function onNotesPaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain') || '';
    histBreak();
    document.execCommand('insertText', false, text);
    histBreak();
  }

  function toggleNotes(force) {
    const s = state.settings;
    s.notesOpen = force == null ? !s.notesOpen : force;
    if (!s.notesOpen) s.notesFocus = false;
    applyLayout();
    renderMainHead();
    renderNotes();
    scheduleSave();
    if (s.notesOpen && cur) setTimeout(() => focusNotesEnd(), 30);
  }
  function toggleNotesFocus(force) {
    const s = state.settings;
    s.notesFocus = force == null ? !s.notesFocus : force;
    if (s.notesFocus) s.notesOpen = true;
    applyLayout();
    renderMainHead();
    renderNotes();
    scheduleSave();
    if (cur) setTimeout(() => focusNotesEnd(), 30);
  }
  // ---- Notes des sous-tâches ----
  function noteTargetLine() { return cur && noteLineId ? lineById(noteLineId) : null; }
  // Fusionne la ligne `from` dans `into` (texte + note). Si `from` a une note, on demande d'abord.
  function mergeLines(into, from, { focusId, focusOffset }) {
    const go = () => {
      checkpoint(from.notes ? { [into.id]: into.notes || '' } : undefined);
      const off = into.text.length;
      into.text += from.text;
      const refresh = mergeLineNotes(into, from);
      cur.subtasks.splice(lineIndex(from.id), 1);
      normalizeIndents(cur.subtasks);
      touch(cur);
      renderLines({ id: into.id, offset: off });
      if (refresh) renderNotes();
      renderSidebarSoon();
    };
    if (!from.notes) { go(); return; }
    const name = (l) => esc(l.text.trim() || 'Sous-tâche sans titre');
    const preview = (l) => {
      const t = stripHtml(l.notes).trim();
      return esc(t.length > 140 ? t.slice(0, 139) + '…' : t || '(note vide)');
    };
    const both = !!into.notes;
    confirmDialog({
      icon: 'notes',
      title: both ? 'Fusionner les deux notes ?' : 'Déplacer la note ?',
      body: (both
        ? `Les deux sous-tâches ont une note. En fusionnant les lignes, la note de « ${name(from)} » sera ajoutée à la fin de celle de « ${name(into)} ».`
        : `« ${name(from)} » a une note. En fusionnant les lignes, elle sera rattachée à « ${name(into)} ».`)
        + `<div class="merge-notes">
            ${both ? `<div class="mn"><b>${name(into)}</b><span>${preview(into)}</span></div><div class="mn-plus">+</div>` : ''}
            <div class="mn"><b>${name(from)}</b><span>${preview(from)}</span></div></div>`,
      confirm: both ? 'Fusionner les notes' : 'Fusionner',
      cancel: 'Annuler',
      onConfirm: go,
      onCancel: () => focusLine(focusId, focusOffset),
    });
  }
  function mergeLineNotes(into, from) {
    if (!from.notes) return false;
    into.notes = into.notes ? into.notes + from.notes : from.notes;
    const affected = noteLineId === from.id || noteLineId === into.id;
    if (affected) noteLineId = into.id;
    return affected;
  }
  function markNoteLine() {
    $$('.line.note-open').forEach((d) => d.classList.remove('note-open'));
    if (noteLineId) { const d = $(`.line[data-id="${noteLineId}"]`); if (d) d.classList.add('note-open'); }
  }
  function openLineNote(id, focus = true) {
    if (!cur || !lineById(id)) return;
    noteLineId = id;
    if (document.activeElement === editor()) editor().blur();
    if (!state.settings.notesOpen) { state.settings.notesOpen = true; applyLayout(); renderMainHead(); scheduleSave(); }
    renderNotes();
    if (aiOpen()) renderAIHead();
    if (focus) setTimeout(() => focusNotesEnd(), 30);
  }
  function openTaskNote(focus = true) {
    noteLineId = null;
    if (document.activeElement === editor()) editor().blur();
    renderNotes();
    if (aiOpen()) renderAIHead();
    if (focus) setTimeout(() => focusNotesEnd(), 30);
  }
  function renderNotesHead() {
    if (!cur) { $('#notesTitle').innerHTML = ''; return; }
    const line = noteTargetLine();
    $('#notesTitle').innerHTML = line
      ? `<button class="nt-back" data-nt="task" title="Revenir à la note de la tâche">${icon('chevron')}Tâche</button>
         <span class="nt-kind">Sous-tâche</span><span class="nt-line">${esc(line.text.trim() || 'Sous-tâche sans titre')}</span>`
      : `<span class="nt-label">${state.settings.notesFocus ? esc(cur.title || 'Sans titre') : 'Note de la tâche'}</span>`;
    updateNotesSwitch();
  }
  function updateNotesSwitch() {
    const b = $('#notesSwitch');
    const n = cur ? cur.subtasks.filter((l) => l.notes).length : 0;
    b.hidden = !cur || (n === 0 && !noteLineId);
    b.innerHTML = `${icon('notes')}${n}`;
    b.title = `${n} sous-tâche${n > 1 ? 's ont' : ' a'} une note · choisir la note à afficher`;
  }
  function notesSwitchMenu() {
    if (!cur) return;
    const items = [{ icon: 'notes', label: (noteLineId ? '' : '✓ ') + 'Note de la tâche', run: () => openTaskNote() }];
    const withNotes = cur.subtasks.filter((l) => l.notes);
    if (withNotes.length) items.push('-');
    for (const l of withNotes) {
      const label = (l.id === noteLineId ? '✓ ' : '') + (l.text.trim() || 'Sous-tâche sans titre');
      items.push({ icon: l.done ? 'circleCheck' : 'rename', label: esc(label.length > 46 ? label.slice(0, 45) + '…' : label), run: () => openLineNote(l.id) });
    }
    openMenu(...menuBelow($('#notesSwitch')), items);
  }

  // Ctrl+E : ouvre les notes, y place le curseur, ou les ferme si on y est déjà
  let lastLineFocus = null;
  function notesShortcut() {
    const s = state.settings;
    if (!s.notesOpen) { toggleNotes(true); return; }
    if (!$('#notes').contains(document.activeElement)) { focusNotesEnd(); return; }
    toggleNotes(false);
    if (lastLineFocus && textOf(lastLineFocus)) focusLine(lastLineFocus);
    else focusTitle(false);
  }
  function focusNotesEnd() {
    const ed = editor();
    if (document.activeElement === ed) return;
    ed.focus();
    ensureBlock();
    const r = document.createRange();
    r.selectNodeContents(ed.lastElementChild || ed);
    r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  // Toujours écrire dans un paragraphe (évite le texte « nu » à la racine de l'éditeur)
  function ensureBlock() {
    const ed = editor();
    const bare = !ed.firstChild || (ed.childNodes.length === 1 && ed.firstChild.nodeName === 'BR');
    if (!bare) return;
    ed.innerHTML = '<p><br></p>';
    const r = document.createRange();
    r.setStart(ed.firstChild, 0);
    r.collapse(true);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  // =====================================================================
  //  Menus, toasts, aide
  // =====================================================================
  let menuHandlers = [];
  function openMenu(x, y, items) {
    const m = $('#menu');
    menuHandlers = [];
    m.innerHTML = items.map((it) => {
      if (it === '-') return '<div class="msep"></div>';
      if (it.colors) {
        return `<div class="mlabel">Couleur</div><div class="swatches">${COLOR_KEYS.map((c) =>
          `<button class="swatch ${c === it.value ? 'on' : ''}" style="--sw:${COLORS[c]}" data-color="${c}" title="${c}"></button>`).join('')}</div>`;
      }
      menuHandlers.push(it.run);
      return `<button class="item ${it.danger ? 'danger' : ''}" data-i="${menuHandlers.length - 1}">${icon(it.icon)}<span>${it.label}</span>${it.kbd ? `<kbd>${it.kbd}</kbd>` : ''}</button>`;
    }).join('');
    const colorItem = items.find((it) => it && it.colors);
    m.onclick = (e) => {
      const sw = e.target.closest('.swatch');
      if (sw && colorItem) { colorItem.pick(sw.dataset.color); closeMenu(); return; }
      const b = e.target.closest('.item');
      if (b) { closeMenu(); menuHandlers[+b.dataset.i](); }
    };
    m.hidden = false;
    const w = m.offsetWidth, h = m.offsetHeight;
    const zoom = state.settings.zoom || 1;
    const vw = innerWidth / zoom, vh = innerHeight / zoom;
    m.style.left = clamp(x, 8, vw - w - 8) + 'px';
    m.style.top = (y + h > vh - 8 ? Math.max(8, y - h) : y) + 'px';
  }
  function closeMenu() { $('#menu').hidden = true; }

  function taskMenu(t, x, y) {
    openMenu(x, y, [
      { colors: true, value: t.color, pick: (c) => setColor(t.id, c) },
      '-',
      { icon: 'rename', label: 'Renommer', run: () => select(t.id, { focusTitle: true }) },
      { icon: t.done ? 'reopen' : 'circleCheck', label: t.done ? 'Rouvrir' : 'Marquer comme terminée', kbd: 'Ctrl Maj ⏎', run: () => toggleTaskDone(t.id) },
      { icon: 'notes', label: 'Ouvrir les notes', kbd: 'Ctrl E', run: () => { select(t.id); toggleNotes(true); } },
      { icon: 'copy', label: 'Dupliquer', run: () => duplicateTask(t.id) },
      '-',
      { icon: 'trash', label: 'Supprimer', danger: true, run: () => deleteTask(t.id) },
    ]);
  }
  function menuPos(e) {
    const z = state.settings.zoom || 1;
    return [e.clientX / z, e.clientY / z];
  }
  function menuBelow(el) {
    const z = state.settings.zoom || 1;
    const r = el.getBoundingClientRect();
    return [r.left / z, r.bottom / z + 6];
  }

  function toast(msg, actionLabel, action) {
    const box = $('#toasts');
    while (box.children.length > 2) box.firstChild.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span>${esc(msg)}</span>${actionLabel ? `<button>${esc(actionLabel)}</button>` : ''}`;
    const close = () => { t.classList.add('out'); setTimeout(() => t.remove(), 200); };
    if (actionLabel) t.querySelector('button').onclick = () => { close(); action(); };
    box.appendChild(t);
    setTimeout(close, actionLabel ? 6000 : 2600);
  }

  function showHelp() {
    const K = (...keys) => keys.map((k) => `<kbd>${k}</kbd>`).join('');
    const row = (label, keys) => `<div class="row"><span>${label}</span><span>${keys}</span></div>`;
    $('#modal').innerHTML = `<div class="dialog" role="dialog">
      <h2>Raccourcis clavier<span class="spacer"></span><button class="icon-btn" data-close>${icon('x')}</button></h2>
      <h3>Général</h3>
      ${row('Nouvelle tâche', K('Ctrl', 'N'))}
      ${row('Rechercher', K('Ctrl', 'K'))}
      ${row('Tâche précédente / suivante', K('Alt', '↑') + K('Alt', '↓'))}
      ${row('Terminer / rouvrir la tâche', K('Ctrl', 'Maj', 'Entrée'))}
      ${row('Notes : ouvrir, y aller, fermer', K('Ctrl', 'E'))}
      ${row('Notes en plein écran', K('Ctrl', 'Maj', 'E'))}
      ${row('Afficher / masquer la liste', K('F9'))}
      ${row('Zoom', K('Ctrl', '+') + K('Ctrl', '−') + K('Ctrl', '0'))}
      <h3>Sous-tâches</h3>
      ${row('Nouvelle ligne (coupe au curseur)', K('Entrée'))}
      ${row('Indenter / désindenter', K('Tab') + K('Maj', 'Tab'))}
      ${row('Cocher / décocher', K('Ctrl', 'Entrée'))}
      ${row('Déplacer la ligne', K('Alt', 'Maj', '↑') + K('Alt', 'Maj', '↓'))}
      ${row('Supprimer la ligne', K('Ctrl', 'Maj', 'K'))}
      ${row('Note de la sous-tâche (aller / revenir)', K('Alt', 'E'))}
      ${row('Fusionner avec la ligne du dessus', K('⌫') + ' en début de ligne')}
      ${row('Annuler / rétablir (liste et notes)', K('Ctrl', 'Z') + K('Ctrl', 'Y'))}
      ${row('Coller une liste (- [ ] …)', 'crée une ligne par élément')}
      <h3>Notes</h3>
      ${row('Titres', K('#') + K('##') + ' + espace')}
      ${row('Listes', K('-') + K('1.') + ' + espace')}
      ${row('Citation / code', K('&gt;') + K('```') + ' + espace')}
      ${row('Gras / italique / souligné', K('Ctrl', 'B') + K('Ctrl', 'I') + K('Ctrl', 'U'))}
      <h3>Assistant IA</h3>
      ${row('Discuter avec l’IA (barre en bas des notes)', K('Ctrl', 'J'))}
      ${row('Envoyer / nouvelle ligne', K('Entrée') + K('Maj', 'Entrée'))}
      ${row('Arrêter la réponse / réduire', K('Échap'))}
      ${row('Annuler ce que l’IA a écrit', K('Ctrl', 'Z'))}
    </div>`;
    $('#modal').hidden = false;
  }
  let modalOnClose = null;
  function closeModal() {
    $('#modal').hidden = true;
    const cb = modalOnClose;
    modalOnClose = null;
    if (cb) cb();
  }
  function confirmDialog({ icon: ic, title, body, confirm, cancel, onConfirm, onCancel }) {
    $('#modal').innerHTML = `<div class="dialog confirm" role="alertdialog">
      <h2>${ic ? `<span class="confirm-ic">${icon(ic)}</span>` : ''}${esc(title)}</h2>
      <div class="confirm-body">${body}</div>
      <div class="dialog-foot"><span class="spacer"></span>
        <button class="btn" data-confirm="no">${esc(cancel || 'Annuler')}</button>
        <button class="btn-primary" data-confirm="yes">${esc(confirm || 'OK')}</button>
      </div></div>`;
    $('#modal').hidden = false;
    modalOnClose = onCancel || null;
    $('#modal [data-confirm="yes"]').onclick = () => { modalOnClose = null; closeModal(); onConfirm(); };
    $('#modal [data-confirm="no"]').onclick = () => closeModal();
    setTimeout(() => $('#modal [data-confirm="yes"]').focus(), 0);
  }

  // =====================================================================
  //  Événements
  // =====================================================================
  function bindEvents() {
    $('#addTask').innerHTML = icon('plus');
    $('#helpBtn').innerHTML = icon('keyboard');
    $('#notesCloseBtn').innerHTML = icon('x');
    $('#doneToggle .chev').innerHTML = icon('chevron');
    const tb = { ul: 'list', ol: 'listOl', quote: 'quote', code: 'code' };
    for (const [cmd, ic] of Object.entries(tb)) $(`#toolbar [data-cmd="${cmd}"]`).innerHTML = icon(ic);

    $('#addTask').onclick = newTask;
    $('#themeBtn').onclick = cycleTheme;
    $('#helpBtn').onclick = showHelp;
    $('#notesCloseBtn').onclick = () => toggleNotes(false);
    $('#notesSwitch').onclick = notesSwitchMenu;
    $('#notesTitle').addEventListener('click', (e) => { if (e.target.closest('[data-nt="task"]')) openTaskNote(); });
    $('#notesFocusBtn').onclick = () => toggleNotesFocus();
    $('#doneToggle').onclick = () => { state.settings.doneOpen = !state.settings.doneOpen; renderSidebar(); scheduleSave(); };
    $('#modal').onclick = (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); };

    // Recherche
    const search = $('#search');
    search.addEventListener('input', () => { query = search.value.trim(); renderSidebar(); });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { search.value = ''; query = ''; renderSidebar(); search.blur(); }
      if (e.key === 'Enter') { const first = $('.task-row'); if (first) { select(first.dataset.id); search.blur(); } }
      if (e.key === 'ArrowDown') { e.preventDefault(); const first = $('.task-row'); if (first) select(first.dataset.id); }
    });

    // Liste des tâches
    const side = $('.side-scroll');
    side.addEventListener('click', (e) => {
      const row = e.target.closest('.task-row');
      if (row && (!cur || row.dataset.id !== cur.id)) select(row.dataset.id);
    });
    side.addEventListener('dblclick', (e) => {
      const row = e.target.closest('.task-row');
      if (row) select(row.dataset.id, { focusTitle: true });
    });
    side.addEventListener('contextmenu', (e) => {
      const row = e.target.closest('.task-row');
      if (!row) return;
      e.preventDefault();
      const t = taskById(row.dataset.id);
      if (t) taskMenu(t, ...menuPos(e));
    });

    // Glisser-déposer pour réordonner les tâches
    let dragId = null;
    side.addEventListener('dragstart', (e) => {
      const row = e.target.closest('.task-row');
      if (!row) return;
      dragId = row.dataset.id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragId);
      requestAnimationFrame(() => row.classList.add('dragging'));
    });
    const clearDrop = () => $$('.drop-before, .drop-after').forEach((r) => r.classList.remove('drop-before', 'drop-after'));
    side.addEventListener('dragover', (e) => {
      if (!dragId) return;
      const row = e.target.closest('.task-row');
      e.preventDefault();
      clearDrop();
      if (!row || row.dataset.id === dragId) return;
      const r = row.getBoundingClientRect();
      row.classList.add(e.clientY < r.top + r.height / 2 ? 'drop-before' : 'drop-after');
    });
    side.addEventListener('drop', (e) => {
      e.preventDefault();
      const row = $('.drop-before, .drop-after');
      if (dragId && row) {
        const after = row.classList.contains('drop-after');
        const t = taskById(dragId);
        const target = taskById(row.dataset.id);
        if (t && target) {
          state.tasks.splice(state.tasks.indexOf(t), 1);
          state.tasks.splice(state.tasks.indexOf(target) + (after ? 1 : 0), 0, t);
          if (t.done !== target.done) { t.done = target.done; t.doneAt = t.done ? now() : null; }
          scheduleSave();
        }
      }
      clearDrop();
      dragId = null;
      renderSidebar();
      if (cur) renderMainHead();
    });
    side.addEventListener('dragend', () => { clearDrop(); dragId = null; renderSidebar(); });

    // Panneau principal (délégation)
    const main = $('#main');
    main.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b) {
        const act = b.dataset.act;
        if (act === 'new') newTask();
        else if (act === 'add-line') appendLine();
        else if (act === 'done') toggleTaskDone(cur.id);
        else if (act === 'notes') toggleNotes();
        else if (act === 'sidebar') toggleSidebar();
        else if (act === 'hide-done') {
          state.settings.hideDone = !state.settings.hideDone;
          renderMainHead(); renderLines(); scheduleSave();
        } else if (act === 'color') {
          openMenu(...menuBelow(b), [{ colors: true, value: cur.color, pick: (c) => setColor(cur.id, c) }]);
        } else if (act === 'more') {
          const [x, y] = menuBelow(b);
          taskMenu(cur, x - 150, y);
        }
        return;
      }
      const check = e.target.closest('.line .check');
      if (check) { toggleLine(check.parentElement.dataset.id); return; }
      const nb = e.target.closest('.line .nbtn');
      if (nb) {
        const id = nb.parentElement.dataset.id;
        if (id === noteLineId) openTaskNote(); else openLineNote(id);
        return;
      }
      const del = e.target.closest('.line .del');
      if (del) { removeLine(del.parentElement.dataset.id, -1); return; }
      if (cur && (e.target === main || e.target.classList.contains('main-inner')) && e.clientY > ($('.add-line')?.getBoundingClientRect().bottom || 0)) {
        appendLine();
      }
    });
    main.addEventListener('mousedown', (e) => {
      // garder le focus sur la ligne quand on clique sur la case
      if (e.target.closest('.line .check, .line .del, .line .nbtn')) e.preventDefault();
    });
    main.addEventListener('keydown', (e) => {
      if (e.target.id === 'title') onTitleKeydown(e);
      else if (e.target.closest && e.target.closest('.line')) onLineKeydown(e);
    });
    main.addEventListener('focusin', (e) => {
      const l = e.target.closest && e.target.closest('.line');
      if (l) lastLineFocus = l.dataset.id;
    });
    main.addEventListener('beforeinput', (e) => {
      const t = e.target.closest && e.target.closest('.line');
      if (t && cur) typingCheckpoint(t.dataset.id);
    });
    main.addEventListener('input', (e) => {
      if (e.target.id === 'title') onTitleInput();
      else onLineInput(e);
    });
    main.addEventListener('paste', (e) => {
      if (e.target.id === 'title') {
        e.preventDefault();
        document.execCommand('insertText', false, oneLine(e.clipboardData.getData('text/plain')));
      } else if (e.target.closest && e.target.closest('.line')) onLinePaste(e);
    });

    // Notes
    const ed = editor();
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* ignore */ }
    ed.addEventListener('focus', ensureBlock);
    ed.addEventListener('beforeinput', ensureBlock);
    ed.addEventListener('beforeinput', onNotesBeforeInput);
    ed.addEventListener('input', onNotesInput);
    ed.addEventListener('keydown', onNotesKeydown);
    ed.addEventListener('paste', onNotesPaste);
    ed.addEventListener('blur', updateToolbar);
    $('.notes-scroll').addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('notes-scroll')) { e.preventDefault(); focusNotesEnd(); }
    });
    ed.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a && (e.ctrlKey || e.metaKey)) { e.preventDefault(); window.open(a.href); }
    });
    $('#toolbar').addEventListener('mousedown', (e) => e.preventDefault());
    $('#toolbar').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) runCmd(b.dataset.cmd);
    });
    document.addEventListener('selectionchange', () => { if (document.activeElement === ed) updateToolbar(); });

    // Redimensionnement du panneau de notes
    const sp = $('#splitter');
    sp.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { sp.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      sp.classList.add('drag');
      const z = state.settings.zoom || 1;
      const move = (ev) => {
        const right = $('#app').getBoundingClientRect().right / z - 10;
        const max = $('#app').clientWidth - (state.settings.sidebarOpen ? 264 : 0) - 380;
        state.settings.notesWidth = Math.round(clamp(right - ev.clientX / z - 5, 300, Math.max(300, max)));
        applyLayout();
      };
      const up = () => {
        sp.classList.remove('drag');
        sp.removeEventListener('pointermove', move);
        sp.removeEventListener('pointerup', up);
        scheduleSave();
      };
      sp.addEventListener('pointermove', move);
      sp.addEventListener('pointerup', up);
    });
    sp.addEventListener('dblclick', () => { state.settings.notesWidth = 440; applyLayout(); scheduleSave(); });

    // Global
    document.addEventListener('mousedown', (e) => {
      if (!$('#menu').hidden && !e.target.closest('#menu')) closeMenu();
    });
    document.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('[contenteditable], input')) e.preventDefault();
    });
    window.addEventListener('blur', closeMenu);
    window.addEventListener('resize', closeMenu);
    document.addEventListener('keydown', onGlobalKeydown);
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());

    bindAI();

    // Rafraîchir « modifiée il y a … »
    setInterval(() => {
      if (cur && !$('#mainHead').contains(document.activeElement)) {
        const meta = $('#mainHead .meta');
        if (meta) meta.textContent = `Créée le ${fmtDate(cur.createdAt)} · modifiée ${fmtAgo(cur.updatedAt)}`;
      }
    }, 30000);
  }

  function onTitleKeydown(e) {
    if (e.key === 'Enter' || (e.key === 'ArrowDown' && caretOnEdgeRow(e.target, false))) {
      e.preventDefault();
      const first = visibleLineEls()[0];
      if (first) focusLine(first.dataset.id, 0);
      else { checkpoint(); addLineAt(cur.subtasks.length); }
    }
  }
  function onTitleInput() {
    const el = $('#title');
    let t = el.textContent;
    if (/[\r\n]/.test(t)) { t = oneLine(t); el.textContent = t; setCaret(el, t.length); }
    cur.title = t;
    touch(cur);
    renderSidebarSoon();
    postTitle();
    if (state.settings.notesFocus) renderNotesHead();
  }

  function toggleSidebar() {
    state.settings.sidebarOpen = !state.settings.sidebarOpen;
    applyLayout();
    renderMainHead();
    scheduleSave();
  }
  function setZoom(z) {
    state.settings.zoom = Math.round(clamp(z, 0.7, 1.6) * 10) / 10;
    applyLayout();
    toast(`Zoom ${Math.round(state.settings.zoom * 100)} %`);
    scheduleSave();
  }

  function onGlobalKeydown(e) {
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;
    const k = key.length === 1 ? key.toLowerCase() : key;

    if (key === 'Escape') {
      if (!$('#menu').hidden) { closeMenu(); return; }
      if (!$('#modal').hidden) { closeModal(); return; }
      if (aiOpen()) { if (ai.running) cancelAI(); else closeAI(true); return; }
      if (state.settings.notesFocus) { toggleNotesFocus(false); return; }
      if (window.innerWidth <= 920 && state.settings.notesOpen && $('#notes').contains(document.activeElement)) { toggleNotes(false); return; }
      return;
    }
    if (!$('#modal').hidden) return;

    if (key === 'F1' || (mod && (k === '/' || k === '?'))) { e.preventDefault(); showHelp(); return; }
    if (key === 'F9' || (mod && key === '\\')) { e.preventDefault(); toggleSidebar(); return; }
    if (key === 'F5' || (mod && k === 'r')) { e.preventDefault(); return; }
    if (mod && k === 'n') { e.preventDefault(); newTask(); return; }
    if (mod && (k === 'k' && !e.shiftKey || k === 'f')) {
      e.preventDefault();
      if (!state.settings.sidebarOpen) toggleSidebar();
      $('#search').focus(); $('#search').select(); return;
    }
    if (mod && k === 's') { e.preventDefault(); saveNow(); toast('Enregistré'); return; }
    if (mod && k === 'j' && cur) { e.preventDefault(); toggleAI(); return; }
    if (mod && k === 'e' && cur) { e.preventDefault(); e.shiftKey ? toggleNotesFocus() : notesShortcut(); return; }
    if (mod && e.shiftKey && key === 'Enter' && cur) { e.preventDefault(); toggleTaskDone(cur.id); return; }
    if (e.altKey && !e.shiftKey && !mod && (key === 'ArrowUp' || key === 'ArrowDown')) {
      e.preventDefault(); moveSelection(key === 'ArrowUp' ? -1 : 1); return;
    }
    if (mod && (key === '+' || key === '=')) { e.preventDefault(); setZoom(state.settings.zoom + 0.1); return; }
    if (mod && (key === '-' || key === '_')) { e.preventDefault(); setZoom(state.settings.zoom - 0.1); return; }
    if (mod && key === '0') { e.preventDefault(); setZoom(1); return; }
    if (mod && !e.shiftKey && k === 'z' && cur && !document.activeElement.closest?.('[contenteditable], input')) {
      e.preventDefault(); undoRedo(false);
    }
  }


  // =====================================================================
  //  Assistant IA (dans les notes)
  // =====================================================================
  const AI_ACTIONS = [
    { id: 'understand', label: 'Qu’as-tu compris ?', icon: 'eye', text: 'Que comprends-tu de mes notes ? Résume ce que tu en retiens, et dis-moi ce qui te semble flou ou manquant.' },
    { id: 'structure', label: 'Réorganiser', icon: 'list', text: 'Réorganise la note de façon claire et structurée (titres, listes, paragraphes), en t’appuyant sur ce que tu as compris.' },
    { id: 'improve', label: 'Améliorer', icon: 'wand', text: 'Améliore la rédaction : plus clair et plus fluide, sans changer le sens.' },
    { id: 'fix', label: 'Corriger', icon: 'spell', text: 'Corrige l’orthographe, la grammaire et la ponctuation, sans rien changer d’autre.' },
    { id: 'shorten', label: 'Raccourcir', icon: 'shrink', text: 'Raccourcis le texte en gardant l’essentiel.' },
    { id: 'expand', label: 'Développer', icon: 'expand', text: 'Développe le texte avec plus de détails utiles.' },
    { id: 'translate', label: 'En anglais', icon: 'globe', text: 'Traduis le texte en anglais.' },
    { id: 'subtasks', label: 'Sous-tâches', icon: 'listChecks', special: true, text: 'Propose des sous-tâches concrètes et actionnables à partir de mes notes.' },
  ];
  let aiCfg = null;
  let aiSeq = 0;
  let chats = {};                 // taskId -> messages
  const aiRanges = new Map();     // id du message utilisateur -> sélection d'origine
  const ai = { running: null, msgId: null, taskId: null, selRange: null, useSel: true, files: [] };
  let pickSeq = 0;
  const aiOpen = () => !$('#aiExpanded').hidden;
  const chatOf = (taskId) => (chats[taskId] = chats[taskId] || []);

  function toggleAI() {
    if (aiOpen() && document.activeElement === $('#aiPrompt')) closeAI(true);
    else openAI();
  }
  function openAI() {
    if (!cur) return;
    if (!state.settings.notesOpen) toggleNotes(true);
    $('#aiExpanded').hidden = false;
    $('#aiDock').classList.add('open');
    if (state.settings.aiHeight) $('#aiDock').style.setProperty('--ai-h', state.settings.aiHeight + 'px');
    renderThread();
    renderAIHead();
    if (!aiCfg) post({ type: 'ai-config-get' });
    setTimeout(() => $('#aiPrompt').focus(), 0);
  }
  function closeAI(refocus) {
    if (ai.running) cancelAI();
    $('#aiExpanded').hidden = true;
    $('#aiDock').classList.remove('open');
    setHighlight(null);
    if (refocus && cur) {
      const ed = editor();
      ed.focus();
      if (ai.selRange && ed.contains(ai.selRange.startContainer)) {
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(ai.selRange);
      }
    }
  }

  // Mémorise la dernière sélection faite dans la note (le focus part dans la zone de saisie ensuite)
  function trackEditorSelection() {
    const ed = editor();
    if (document.activeElement !== ed) return;
    const sel = getSelection();
    if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    if (!r.collapsed && ed.contains(r.commonAncestorContainer) && r.toString().trim()) {
      ai.selRange = r.cloneRange();
      ai.useSel = true;
    } else ai.selRange = null;
    renderAIHead();
  }
  function activeSelection() {
    const ed = editor();
    return ai.useSel && ai.selRange && ed.contains(ai.selRange.startContainer) && ed.contains(ai.selRange.endContainer)
      && !ai.selRange.collapsed ? ai.selRange : null;
  }
  function setHighlight(range) {
    try {
      if (!window.CSS || !CSS.highlights) return;
      CSS.highlights.delete('ai-selection');
      if (range) CSS.highlights.set('ai-selection', new Highlight(range));
    } catch (e) { /* ignore */ }
  }

  function renderAIHead() {
    const sel = activeSelection();
    const sc = $('#aiScope');
    sc.hidden = !sel;
    if (sel) {
      const n = sel.toString().length;
      sc.innerHTML = `Sélection · ${n} car. ${icon('x')}`;
      sc.title = 'L’IA travaillera sur ce passage. Cliquer pour travailler sur toute la note.';
    }
    const focused = document.activeElement === $('#aiPrompt');
    setHighlight(sel && (focused || aiOpen()) ? sel : null);
    const p = aiCfg && aiCfg.providers.find((x) => x.id === aiCfg.provider);
    $('#aiProvider').innerHTML = `${icon('sliders')}<span>${p ? esc(p.label.split(' (')[0].split(' – ')[0]) + (p.model ? ' · ' + esc(p.model) : '') : 'Configurer'}</span>`;
    const f = aiCfg && aiCfg.files;
    const n = f && f.enabled ? f.folders.filter((x) => x.exists).length : 0;
    const fb = $('#aiFolders');
    fb.classList.toggle('on', n > 0);
    fb.innerHTML = `${icon('folder')}<span>${n ? `${n} dossier${n > 1 ? 's' : ''}` : 'Fichiers'}</span>`;
    fb.title = n ? `L’IA peut consulter (lecture seule) : ${f.folders.filter((x) => x.exists).map((x) => x.label).join(', ')}`
      : 'L’IA n’a accès à aucun dossier. Cliquer pour en autoriser (lecture seule).';
    renderAttached();
  }
  const fmtSize = (n) => n < 1024 ? `${n} o` : n < 1048576 ? `${Math.round(n / 1024)} Ko` : `${(n / 1048576).toFixed(1)} Mo`;
  function renderAttached() {
    const box = $('#aiAttached');
    box.hidden = !ai.files.length;
    box.innerHTML = ai.files.map((f, i) => `<span class="ai-file" title="${esc(f.path)}">${icon('file')}<b>${esc(f.name)}</b><small>${fmtSize(f.size || 0)}</small>
      <button type="button" data-unattach="${i}" title="Retirer">${icon('x')}</button></span>`).join('');
  }
  function onAIPicked(id, what, items) {
    if (what === 'folder') {
      if (!dlg || $('#modal').hidden) return;
      readDlgFields();
      for (const it of items) if (!dlg.files.folders.some((x) => x.path === it.path)) dlg.files.folders.push({ ...it, exists: true });
      if (items.length) dlg.files.enabled = true;
      renderAISettings();
      return;
    }
    const bad = items.filter((it) => it.sensitive);
    for (const it of items) if (!it.sensitive && !ai.files.some((x) => x.path === it.path)) ai.files.push(it);
    if (bad.length) toast(`${bad.map((b) => b.name).join(', ')} : fichier sensible, non joint`);
    renderAttached();
    $('#aiPrompt').focus();
  }

  function outlineText(t) {
    return t.subtasks.filter((l) => l.text.trim())
      .map((l) => `${'  '.repeat(l.indent)}- [${l.done ? 'x' : ' '}] ${l.text}${l.notes ? ' (a une note)' : ''}`).join('\n');
  }

  // ---- Fil de discussion ----
  function renderThread() {
    if (!cur) return;
    const list = chatOf(cur.id);
    const th = $('#aiThread');
    th.innerHTML = list.length ? list.map(msgHtml).join('') : `<div class="ai-empty">
      <b>Discute de ta note avec l’IA.</b> Pose une question (« qu’as-tu compris ? ») ou demande une modification
      (« réorganise avec ce que tu as compris »). Elle garde en mémoire la discussion de cette tâche, et
      <b>n’écrit dans la note que si tu cliques sur « Remplacer » ou « Insérer »</b>.
      Sélectionne un passage avant d’écrire pour qu’elle ne travaille que dessus.</div>`;
    th.scrollTop = th.scrollHeight;
  }
  function msgHtml(m) {
    if (m.role === 'user') {
      return `<div class="ai-msg user" data-id="${m.id}">${(m.files || []).length ? `<div class="ai-msg-files">${m.files.map((f) =>
        `<span class="ai-file small" title="${esc(f.path)}">${icon('file')}<b>${esc(f.name)}</b></span>`).join('')}</div>` : ''}<div class="bubble">${esc(m.text)}</div>${
        m.scope === 'selection' || m.target ? `<div class="ai-msg-meta">${[
          m.target ? `note de « ${esc(m.targetLabel)} »` : '',
          m.scope === 'selection' ? `sélection · ${m.selLen} car.` : ''].filter(Boolean).join(' · ')}</div>` : ''}</div>`;
    }
    return `<div class="ai-msg assistant" data-id="${m.id}">${assistantBody(m)}</div>`;
  }
  function assistantBody(m) {
    if (m.error) {
      return `<div class="ai-error">${esc(m.error)}<button data-act="retry">Réessayer</button><button data-act="settings">Configurer l’IA</button></div>`;
    }
    const tools = toolsHtml(m);
    if (m.pending && !(m.segments || []).length) {
      return tools + `<div class="ai-dots"><span><i></i><i></i><i></i></span>${(m.tools || []).length ? 'L’IA consulte tes fichiers…' : 'L’IA réfléchit…'}</div>`;
    }
    const segs = m.segments || [];
    let h = tools + segs.map((sg, i) => segHtml(m, sg, i)).join('');
    if (m.pending) h += '<span class="ai-caret"></span>';
    if (m.cancelled) h += '<div class="ai-msg-meta">Réponse interrompue</div>';
    return h;
  }
  function toolsHtml(m) {
    const t = m.tools || [];
    if (!t.length) return '';
    const items = t.map((x) => `<li>${icon(/^Lit /.test(x) ? 'file' : /^Cherche/.test(x) ? 'search' : 'folder')}<span>${esc(x)}</span></li>`).join('');
    if (m.pending) return `<ul class="ai-tools live">${items}</ul>`;
    return `<details class="ai-tools-sum"><summary>${icon('folder')}${t.length} consultation${t.length > 1 ? 's' : ''} de fichiers · lecture seule</summary><ul class="ai-tools">${items}</ul></details>`;
  }
  function onAIStatus(id, text) {
    if (id !== ai.running) return;
    const m = runningMsg();
    if (!m) return;
    (m.tools = m.tools || []).push(text);
    if (cur && cur.id === ai.taskId && aiOpen()) renderMsg(m);
  }
  function segHtml(m, sg, i) {
    if (sg.type === 'text') return `<div class="prose ai-text">${sg.html}</div>`;
    const isSub = sg.type === 'subtasks';
    const user = chatOf(cur.id).find((x) => x.id === m.replyTo);
    const onSel = user && user.scope === 'selection';
    const applied = m.applied && m.applied[i];
    const b = (act, label, ic, primary) => `<button data-act="${act}" data-seg="${i}" class="${primary ? 'primary' : ''}">${icon(ic)}${label}</button>`;
    const actions = m.pending ? '' : (applied ? `<span class="ai-applied">✓ ${esc(applied)}</span>` : '') + (isSub
      ? (applied ? '' : b('subtasks', 'Ajouter aux sous-tâches', 'listChecks', true)) + b('insert', 'Insérer dans la note', 'insert')
      : (applied ? '' : b('replace', onSel ? 'Remplacer la sélection' : 'Remplacer la note', 'check', true)) + b('insert', 'Insérer en dessous', 'insert') + b('copy', 'Copier', 'copy'));
    return `<div class="ai-proposal ${applied ? 'applied' : ''}">
      <div class="ai-proposal-head">${icon(isSub ? 'listChecks' : 'rename')}${isSub ? 'Sous-tâches proposées'
        : (onSel ? 'Proposition pour la sélection' : 'Proposition pour la note')
          + (user && user.target ? ` de « ${esc(user.targetLabel)} »` : ' de la tâche')}</div>
      <div class="prose">${sg.html}</div><div class="ai-actions">${actions}</div></div>`;
  }
  function renderMsg(m) {
    const el = $(`#aiThread .ai-msg[data-id="${m.id}"]`);
    if (!el) { renderThread(); return; }
    const th = $('#aiThread');
    const list = chatOf(cur.id);
    const follow = list[list.length - 1] === m || th.scrollHeight - th.scrollTop - th.clientHeight < 40;
    el.innerHTML = assistantBody(m);
    if (follow && !m.applied) th.scrollTop = th.scrollHeight;
  }

  let chatSaveTimer = null;
  function saveChat(taskId) {
    clearTimeout(chatSaveTimer);
    chatSaveTimer = setTimeout(() => {
      const list = (chats[taskId] || []).filter((m) => !m.pending && !m.error).map((m) => (m.role === 'user'
        ? { id: m.id, role: 'user', text: m.text, scope: m.scope, selLen: m.selLen, ts: m.ts, target: m.target, targetLabel: m.targetLabel, files: m.files }
        : { id: m.id, role: 'assistant', raw: m.raw, segments: m.segments, replyTo: m.replyTo, applied: m.applied, cancelled: m.cancelled, tools: m.tools }));
      post({ type: 'ai-chat-save', taskId, messages: list });
    }, 300);
  }

  function sendAI(text) {
    text = String(text || '').trim();
    if (!text || !cur) return;
    if (!aiOpen()) openAI();
    if (ai.running) cancelAI();
    const ed = editor();
    const list = chatOf(cur.id);
    const sel = activeSelection();
    let selectionHtml = '';
    if (sel) { const d = document.createElement('div'); d.appendChild(sel.cloneContents()); selectionHtml = d.innerHTML; }
    const history = list.filter((m) => !m.error && !m.pending)
      .map((m) => ({ role: m.role, content: m.role === 'user' ? m.text : m.raw, files: m.role === 'user' && m.files ? m.files.map((f) => f.path) : undefined }));
    const tline = noteTargetLine();
    const files = ai.files.map((f) => ({ path: f.path, name: f.name }));
    const um = { id: uid(), role: 'user', text, scope: sel ? 'selection' : 'all', selLen: sel ? sel.toString().length : 0, ts: now(),
      target: tline ? tline.id : null, targetLabel: tline ? (tline.text.trim() || 'Sous-tâche sans titre') : null,
      files: files.length ? files : undefined };
    ai.files = [];
    renderAttached();
    if (sel) aiRanges.set(um.id, sel.cloneRange());
    const am = { id: uid(), role: 'assistant', raw: '', segments: [], replyTo: um.id, pending: true };
    list.push(um, am);
    const rid = 'r' + (++aiSeq);
    Object.assign(ai, { running: rid, msgId: am.id, taskId: cur.id });
    post({
      type: 'ai-run', id: rid, history, text, files: files.map((f) => f.path),
      context: {
        title: cur.title, outline: outlineText(cur), noteHtml: ed.innerHTML, selectionHtml,
        subtask: tline ? tline.text : '', taskNoteHtml: tline ? cur.notes : '',
      },
    });
    $('#aiPrompt').value = '';
    autosizePrompt();
    renderThread();
    setSendState();
    saveChat(cur.id);
  }
  function runningMsg() {
    return ai.taskId && (chats[ai.taskId] || []).find((m) => m.id === ai.msgId);
  }
  function cancelAI() {
    if (!ai.running) return;
    post({ type: 'ai-cancel', id: ai.running });
    const m = runningMsg();
    ai.running = null;
    if (m) {
      m.pending = false;
      if ((m.segments || []).length) {
        m.cancelled = true;
        m.raw = m.segments.map((sg) => (sg.type === 'note' ? `<note>\n${sg.md}\n</note>` : sg.type === 'subtasks' ? `<sous-taches>\n${sg.md}\n</sous-taches>` : sg.md)).join('\n\n');
      } else {
        const list = chats[ai.taskId];
        const i = list.indexOf(m);
        if (i > 0) list.splice(i - 1, 2); // ni question ni réponse : on retire l'échange
      }
      if (cur && cur.id === ai.taskId) renderThread();
      saveChat(ai.taskId);
    }
    setSendState();
  }
  function setSendState() {
    const b = $('#aiSend');
    b.classList.toggle('stop', !!ai.running);
    b.innerHTML = icon(ai.running ? 'stop' : 'send');
    b.title = ai.running ? 'Arrêter (Échap)' : 'Envoyer (Entrée)';
  }
  function autosizePrompt() {
    const t = $('#aiPrompt');
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 132) + 'px';
    t.style.overflowY = t.scrollHeight > 132 ? 'auto' : 'hidden';
  }

  function onAIChunk(id, segments) {
    if (String(id).startsWith('test') || id !== ai.running) return;
    const m = runningMsg();
    if (!m) return;
    m.segments = segments;
    if (cur && cur.id === ai.taskId && aiOpen()) renderMsg(m);
  }
  function onAIDone(id, segments, raw) {
    if (String(id).startsWith('test')) { onAITest(true, raw); return; }
    if (id !== ai.running) return;
    const m = runningMsg();
    ai.running = null;
    setSendState();
    if (!m) return;
    Object.assign(m, { segments, raw, pending: false });
    if (cur && cur.id === ai.taskId && aiOpen()) renderMsg(m);
    saveChat(ai.taskId);
  }
  function onAIError(id, msg) {
    if (String(id).startsWith('test')) { onAITest(false, msg); return; }
    if (id !== ai.running) return;
    const m = runningMsg();
    ai.running = null;
    setSendState();
    if (!m) return;
    Object.assign(m, { error: msg, pending: false });
    if (cur && cur.id === ai.taskId && aiOpen()) renderMsg(m);
  }
  function onAIChats(map) {
    for (const [k, v] of Object.entries(map || {})) if (!chats[k] || !chats[k].length) chats[k] = v;
    if (aiOpen()) renderThread();
  }

  function topBlock(node) {
    const ed = editor();
    while (node && node.parentNode !== ed) node = node.parentNode;
    return node;
  }
  function unwrapSingleParagraph(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.children.length === 1 && d.firstElementChild.tagName === 'P' ? d.firstElementChild.innerHTML : html;
  }
  function copyText(text) {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    t.remove();
  }

  function applyProposal(msgId, segIdx, how) {
    if (!cur) return;
    const list = chatOf(cur.id);
    const m = list.find((x) => x.id === msgId);
    const sg = m && m.segments[segIdx];
    if (!sg) return;
    const mark = (label) => { m.applied = { ...(m.applied || {}), [segIdx]: label }; renderMsg(m); saveChat(cur.id); };
    if (how === 'copy') { copyText(sg.md); toast('Copié (Markdown)'); return; }
    if (how === 'subtasks') {
      const items = parsePasted(sg.md);
      if (!items.length) { toast('Aucune sous-tâche trouvée'); return; }
      checkpoint();
      const base = cur.subtasks.length;
      cur.subtasks.push(...items.map((it) => normLine({ text: it.text, done: it.done, indent: it.rel })));
      normalizeIndents(cur.subtasks);
      touch(cur);
      renderLines(null, cur.subtasks[base] && cur.subtasks[base].id);
      renderSidebarSoon();
      mark(`${items.length} sous-tâche${items.length > 1 ? 's' : ''} ajoutée${items.length > 1 ? 's' : ''}`);
      return;
    }
    const user = list.find((x) => x.id === m.replyTo);
    const want = (user && user.target) || null;
    if (want !== noteLineId) {
      // la proposition concerne une autre note : on l'ouvre d'abord
      if (want && !lineById(want)) { toast('Cette sous-tâche n’existe plus'); return; }
      if (want) openLineNote(want, false); else openTaskNote(false);
    }
    const range = user && aiRanges.get(user.id);
    const ed = editor();
    ed.focus();
    ensureBlock();
    const valid = range && !range.collapsed && ed.contains(range.startContainer) && ed.contains(range.endContainer);
    let html = sg.html;
    let r;
    if (how === 'insert') {
      r = document.createRange();
      const top = valid ? topBlock(range.endContainer) : null;
      if (top) r.setStartAfter(top); else { r.selectNodeContents(ed); r.collapse(false); }
      r.collapse(true);
    } else if (user && user.scope === 'selection') {
      if (!valid) { toast('Le passage d’origine a changé : utilise « Insérer en dessous »'); return; }
      r = range.cloneRange();
      if (topBlock(r.startContainer) === topBlock(r.endContainer)) html = unwrapSingleParagraph(html);
    } else {
      r = document.createRange();
      r.selectNodeContents(ed);
    }
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    document.execCommand('insertHTML', false, html);
    $$('p:empty', ed).forEach((el) => el.remove());
    onNotesInput();
    if (user) aiRanges.delete(user.id);
    ai.selRange = null;
    renderAIHead();
    mark(how === 'insert' ? 'Inséré dans la note' : 'Appliqué à la note');
    toast((how === 'insert' ? 'Inséré' : 'Remplacé') + ' · Ctrl+Z pour annuler');
  }

  function retryMsg(msgId) {
    const list = chatOf(cur.id);
    const i = list.findIndex((x) => x.id === msgId);
    if (i < 1) return;
    const user = list[i - 1];
    list.splice(i - 1, 2);
    if (user.files) ai.files = user.files.map((f) => ({ ...f, size: 0 }));
    sendAI(user.text);
  }

  function onAIConfig(cfg) {
    const wasSaving = aiSettingsSaving;
    aiCfg = cfg;
    renderAIHead();
    if (wasSaving) { aiSettingsSaving = false; closeModal(); toast('Configuration IA enregistrée'); }
    else if (aiSettingsPending) { aiSettingsPending = false; openAISettings(); }
  }

  // ---- Fenêtre de configuration ----
  let aiSettingsPending = false;
  let aiSettingsSaving = false;
  let dlg = null;
  function openAISettings() {
    if (!aiCfg) { aiSettingsPending = true; post({ type: 'ai-config-get' }); return; }
    dlg = { provider: aiCfg.provider, drafts: {}, models: {}, effort: aiCfg.effort, instructions: aiCfg.instructions,
      files: { enabled: !!(aiCfg.files && aiCfg.files.enabled), folders: ((aiCfg.files && aiCfg.files.folders) || []).map((f) => ({ ...f })) } };
    for (const p of aiCfg.providers) dlg.drafts[p.id] = { model: p.model, baseUrl: p.baseUrl, key: '', deleteKey: false };
    renderAISettings();
    $('#modal').hidden = false;
  }
  function readDlgFields() {
    if (!dlg || $('#modal').hidden) return;
    const d = dlg.drafts[dlg.provider];
    const v = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
    if (v('aiKey') !== null) d.key = v('aiKey');
    if (v('aiUrl') !== null) d.baseUrl = v('aiUrl');
    if (v('aiModel') !== null) d.model = v('aiModel');
    if (v('aiEffort') !== null) dlg.effort = v('aiEffort');
    if (v('aiInstr') !== null) dlg.instructions = v('aiInstr');
    const fe = document.getElementById('aiFilesOn');
    if (fe) dlg.files.enabled = fe.checked;
  }
  function renderAISettings(focusId) {
    const p = aiCfg.providers.find((x) => x.id === dlg.provider);
    const d = dlg.drafts[p.id];
    const models = dlg.models[p.id] || [];
    const keyField = p.kind === 'claude-code' ? '' : `
      <div class="field"><label for="aiKey">Clé API${p.needsKey ? '' : ' (optionnelle)'}</label>
        <div class="row-in">
          <input id="aiKey" type="password" autocomplete="off" spellcheck="false" value="${esc(d.key)}"
            placeholder="${p.hasKey && !d.deleteKey ? '•••••••• enregistrée — laisse vide pour la garder' : 'Colle ta clé ici'}">
          ${p.hasKey && !d.deleteKey ? '<button class="btn small danger" data-dlg="delkey">Supprimer</button>' : ''}
        </div>
        <div class="hint">${d.deleteKey ? 'La clé sera supprimée à l’enregistrement. ' : ''}Rangée dans le ${esc(aiCfg.keyStorage)}, jamais dans tes notes.</div>
      </div>`;
    const urlField = p.editableUrl ? `
      <div class="field"><label for="aiUrl">Adresse du service</label>
        <input id="aiUrl" type="text" spellcheck="false" value="${esc(d.baseUrl)}" placeholder="http://localhost:1234/v1"></div>` : '';
    const effortField = (p.kind === 'anthropic' || p.kind === 'claude-code') ? `
      <div class="field"><label for="aiEffort">Réflexion</label>
        <select id="aiEffort">
          ${[['', 'Par défaut du modèle'], ['low', 'Rapide'], ['medium', 'Normale'], ['high', 'Approfondie']].map(([v, l]) => `<option value="${v}" ${dlg.effort === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select><div class="hint">« Rapide » répond plus vite, idéal pour corriger ou reformuler.</div></div>` : '';
    $('#modal').innerHTML = `<div class="dialog ai-settings" role="dialog">
      <h2>${icon('sparkles')}&nbsp;Configuration de l’IA<span class="spacer"></span><button class="icon-btn" data-close>${icon('x')}</button></h2>
      <div class="field"><label>Fournisseur</label>
        <div class="prov-grid">${aiCfg.providers.map((x) => `
          <button class="prov-card ${x.id === p.id ? 'on' : ''}" data-prov="${x.id}" ${x.available ? '' : 'disabled title="Claude Code n’est pas installé"'}>
            ${esc(x.label.split(' (')[0])}<small>${x.kind === 'claude-code' ? 'abonnement, sans clé' : x.id === 'ollama' ? 'local, gratuit' : x.id === 'custom' ? 'compatible OpenAI' : x.hasKey ? 'clé enregistrée' : 'clé API'}</small>
            ${x.id === aiCfg.provider ? '<span class="tick" title="Fournisseur actif"></span>' : ''}
          </button>`).join('')}</div>
        <div class="hint">${esc(p.hint)}</div>
      </div>
      ${keyField}${urlField}
      <div class="field"><label for="aiModel">Modèle</label>
        <div class="row-in">
          <input id="aiModel" type="text" list="aiModelList" spellcheck="false" value="${esc(d.model)}" placeholder="${esc(p.modelHint || 'Nom du modèle')}">
          <button class="btn small" data-dlg="models">Charger la liste</button>
        </div>
        <datalist id="aiModelList">${models.map((m) => `<option value="${esc(m.id)}">${esc(m.label !== m.id ? m.label : '')}</option>`).join('')}</datalist>
        <div class="hint" id="aiModelsHint">${models.length ? `${models.length} modèles disponibles : clique dans le champ pour choisir.` : ''}</div>
      </div>
      ${effortField}
      <div class="field files-field" id="aiFilesField"><label>Accès aux fichiers <span class="ro-badge">${icon('lock')}lecture seule</span></label>
        <label class="switch-row"><input type="checkbox" id="aiFilesOn" ${dlg.files.enabled ? 'checked' : ''}>
          <span>Laisser l’IA consulter ces dossiers d’elle-même</span></label>
        <div class="folder-list ${dlg.files.enabled ? '' : 'off'}">${dlg.files.folders.map((f, i) => `
          <div class="folder-row ${f.exists === false ? 'missing' : ''}">${icon('folder')}<span title="${esc(f.path)}">${esc(f.label)}</span>${f.exists === false ? '<small>introuvable</small>' : ''}
            <button class="icon-btn" data-dlg="rmfolder" data-i="${i}" title="Retirer">${icon('x')}</button></div>`).join('')
          || '<div class="folder-empty">Aucun dossier autorisé.</div>'}
          <button class="btn small" data-dlg="addfolder">${icon('plus')}Ajouter un dossier…</button>
        </div>
        <div class="hint">L’IA peut lister, chercher et lire les fichiers de ces dossiers (texte, PDF, Word…), jamais les modifier ni les supprimer.
          Les fichiers cachés et sensibles (.env, clés SSH, mots de passe…) restent inaccessibles. Ce qu’elle lit est envoyé au fournisseur choisi.
          Tu peux aussi joindre un fichier précis avec le trombone ${icon('clip')} dans la discussion.</div>
      </div>
      <div class="field"><label for="aiInstr">Instructions personnelles <span style="font-weight:500;color:var(--faint)">(optionnel)</span></label>
        <textarea id="aiInstr" placeholder="ex : écris en français, ton professionnel, phrases courtes, tutoiement">${esc(dlg.instructions)}</textarea></div>
      <div class="dialog-foot">
        <span id="aiTestResult" class="test-result"></span>
        <button class="btn" data-dlg="test">Tester</button>
        <button class="btn-primary" data-dlg="save">Enregistrer</button>
      </div>
    </div>`;
    if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
  }
  function onAIModels(res) {
    if (!dlg || $('#modal').hidden) return;
    readDlgFields();
    if (res.ok) {
      dlg.models[dlg.provider] = res.models;
      renderAISettings('aiModel');
      if (!res.models.length) $('#aiModelsHint').textContent = 'Aucun modèle trouvé.';
    } else {
      const h = $('#aiModelsHint');
      if (h) { h.textContent = res.error; h.style.color = 'var(--danger)'; }
    }
  }
  function onAITest(ok, msg) {
    const el = $('#aiTestResult');
    if (!el) return;
    el.className = 'test-result ' + (ok ? 'ok' : 'err');
    el.textContent = ok ? `✓ Ça marche ! (réponse : ${String(msg || '').slice(0, 40)})` : msg;
  }
  function dlgPayload() {
    readDlgFields();
    const d = dlg.drafts[dlg.provider];
    const m = (dlg.models[dlg.provider] || []).find((x) => x.id === d.model.trim());
    return {
      config: { provider: dlg.provider, model: d.model, baseUrl: d.baseUrl, effort: dlg.effort, instructions: dlg.instructions, maxTokens: m && m.maxTokens ? m.maxTokens : null,
        files: { enabled: dlg.files.enabled, folders: dlg.files.folders.map((f) => f.path) } },
      apiKey: d.key.trim() ? d.key.trim() : d.deleteKey ? '' : null,
    };
  }
  function onDialogClick(e) {
    if (!dlg || !$('#modal .ai-settings')) return;
    const prov = e.target.closest('[data-prov]');
    if (prov) { readDlgFields(); dlg.provider = prov.dataset.prov; renderAISettings(); return; }
    const b = e.target.closest('[data-dlg]');
    if (!b) return;
    const act = b.dataset.dlg;
    const pl = dlgPayload();
    if (act === 'addfolder') { post({ type: 'ai-pick', id: 'p' + (++pickSeq), what: 'folder' }); return; }
    if (act === 'rmfolder') { readDlgFields(); dlg.files.folders.splice(+b.dataset.i, 1); renderAISettings(); return; }
    if (act === 'delkey') { dlg.drafts[dlg.provider].deleteKey = true; dlg.drafts[dlg.provider].key = ''; renderAISettings(); }
    else if (act === 'models') {
      const h = $('#aiModelsHint'); if (h) { h.style.color = ''; h.textContent = 'Chargement…'; }
      post({ type: 'ai-models', provider: dlg.provider, baseUrl: pl.config.baseUrl, apiKey: pl.apiKey || null });
    } else if (act === 'test') {
      const el = $('#aiTestResult'); el.className = 'test-result'; el.textContent = 'Test en cours…';
      post({ type: 'ai-test', id: 'test' + (++aiSeq), provider: dlg.provider, model: pl.config.model, baseUrl: pl.config.baseUrl, apiKey: pl.apiKey || null, effort: pl.config.effort });
    } else if (act === 'save') {
      aiSettingsSaving = true;
      post({ type: 'ai-config-save', ...pl });
      if (!bridge) { aiSettingsSaving = false; closeModal(); }
    }
  }

  function bindAI() {
    $$('.ai-spark').forEach((el) => { el.innerHTML = icon('sparkles'); });
    $('#aiSettingsBtn').innerHTML = icon('sparkles');
    $('#aiNewChat').innerHTML = icon('reopen');
    $('#aiCollapse').innerHTML = `<svg class="ic" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>`;
    setSendState();
    $('#aiChips').innerHTML = AI_ACTIONS.map((a) =>
      `<button type="button" class="ai-chip ${a.special ? 'special' : ''}" data-chip="${a.id}">${icon(a.icon)}${a.label}</button>`).join('');
    $('#aiChips').addEventListener('mousedown', (e) => { if (e.target.closest('[data-chip]')) e.preventDefault(); });
    // molette verticale -> défilement horizontal des raccourcis
    $('#aiChips').addEventListener('wheel', (e) => {
      const el = e.currentTarget;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) { el.scrollLeft += e.deltaY; e.preventDefault(); }
    }, { passive: false });
    // poignée de redimensionnement de la discussion
    const rz = $('#aiResizer');
    rz.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { rz.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      rz.classList.add('drag');
      document.body.classList.add('resizing-ai');
      const dock = $('#aiDock');
      const z = state.settings.zoom || 1;
      const startY = e.clientY / z;
      const startH = dock.getBoundingClientRect().height / z;
      const move = (ev) => {
        const max = $('#notes').clientHeight - 150;
        const h = Math.round(clamp(startH + startY - ev.clientY / z, 240, Math.max(240, max)));
        state.settings.aiHeight = h;
        dock.style.setProperty('--ai-h', h + 'px');
      };
      const up = () => {
        rz.classList.remove('drag');
        document.body.classList.remove('resizing-ai');
        rz.removeEventListener('pointermove', move);
        rz.removeEventListener('pointerup', up);
        scheduleSave();
      };
      rz.addEventListener('pointermove', move);
      rz.addEventListener('pointerup', up);
    });
    rz.addEventListener('dblclick', () => {
      delete state.settings.aiHeight;
      $('#aiDock').style.removeProperty('--ai-h');
      scheduleSave();
    });
    $('#aiChips').addEventListener('click', (e) => {
      const c = e.target.closest('[data-chip]');
      if (c) sendAI(AI_ACTIONS.find((x) => x.id === c.dataset.chip).text);
    });
    const prompt = $('#aiPrompt');
    $('#aiForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (ai.running) cancelAI(); else sendAI(prompt.value);
    });
    prompt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!ai.running) sendAI(prompt.value); }
    });
    prompt.addEventListener('input', autosizePrompt);
    prompt.addEventListener('focus', () => { if (!aiOpen()) openAI(); renderAIHead(); });
    prompt.addEventListener('blur', () => setTimeout(renderAIHead, 0));
    $('#aiCollapse').onclick = () => closeAI(true);
    $('#aiNewChat').onclick = () => {
      if (!cur) return;
      if (ai.running) cancelAI();
      chats[cur.id] = [];
      saveChat(cur.id);
      renderThread();
      toast('Nouvelle discussion');
      prompt.focus();
    };
    $('#aiProvider').onclick = openAISettings;
    $('#aiFolders').onclick = () => { openAISettings(); setTimeout(() => { const f = $('#aiFilesField'); if (f) f.scrollIntoView({ block: 'center' }); }, 30); };
    $('#aiAttach').innerHTML = icon('clip');
    $('#aiAttach').addEventListener('mousedown', (e) => e.preventDefault());
    $('#aiAttach').onclick = () => post({ type: 'ai-pick', id: 'p' + (++pickSeq), what: 'files' });
    $('#aiAttached').addEventListener('mousedown', (e) => e.preventDefault());
    $('#aiAttached').addEventListener('click', (e) => {
      const b = e.target.closest('[data-unattach]');
      if (b) { ai.files.splice(+b.dataset.unattach, 1); renderAttached(); }
    });
    $('#aiSettingsBtn').onclick = openAISettings;
    $('#aiScope').addEventListener('mousedown', (e) => e.preventDefault());
    $('#aiScope').onclick = () => { ai.useSel = false; renderAIHead(); };
    $('#aiThread').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const msgEl = b.closest('.ai-msg');
      const id = msgEl && msgEl.dataset.id;
      const act = b.dataset.act;
      if (act === 'settings') openAISettings();
      else if (act === 'retry') retryMsg(id);
      else applyProposal(id, +b.dataset.seg, act);
    });
    document.addEventListener('selectionchange', trackEditorSelection);
    $('#modal').addEventListener('click', onDialogClick);
    $('#modal').addEventListener('change', (e) => {
      if (e.target.id === 'aiFilesOn' && dlg) { dlg.files.enabled = e.target.checked; const l = $('#modal .folder-list'); if (l) l.classList.toggle('off', !e.target.checked); }
    });
    post({ type: 'ai-chats-get' });
  }

  // =====================================================================
  //  Démarrage & API exposée à Python
  // =====================================================================
  let booted = false;
  function boot(data, dark) {
    if (booted) return;
    booted = true;
    if (dark != null) setDark(dark);
    state = normalizeState(data);
    if (!data) {
      const w = welcomeTask();
      state.tasks.push(w);
      state.selectedId = w.id;
      dirty = true;
    }
    cur = taskById(state.selectedId) || state.tasks.find((t) => !t.done) || null;
    state.selectedId = cur ? cur.id : null;
    synced = snapshotOf(state.tasks);
    bindEvents();
    applyTheme();
    applyLayout();
    renderSidebar();
    renderMain();
    renderNotes();
    postTitle();
    if (dirty) saveNow(); else setSaveStatus('saved');
    setTimeout(() => $('#app').classList.remove('booting'), 30);
  }

  // Le fichier a été modifié par un autre programme (serveur MCP, édition manuelle…).
  // Fusion à trois versions (base = dernière synchro, locale, externe) :
  //  - une tâche modifiée d'un seul côté prend cette version ;
  //  - modifiée des deux côtés : fusion champ par champ et ligne par ligne ;
  //  - les tâches créées ici et pas encore enregistrées sont conservées.
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function mergeTask(base, lt, et) {
    const B = JSON.parse(base);
    const pick = (k) => (same(lt[k], B[k]) ? et[k] : lt[k]);
    const m = {
      ...et, title: pick('title'), done: pick('done'), doneAt: pick('doneAt'), color: pick('color'),
      notes: pick('notes'), updatedAt: Math.max(lt.updatedAt, et.updatedAt),
    };
    const baseLines = new Map(B.subtasks.map((l) => [l.id, JSON.stringify(l)]));
    const localLines = new Map(lt.subtasks.map((l) => [l.id, l]));
    const out = [];
    for (const el of et.subtasks) {
      if (baseLines.has(el.id) && !localLines.has(el.id)) continue; // supprimée ici
      const loc = localLines.get(el.id);
      out.push(loc && JSON.stringify(loc) !== baseLines.get(el.id) ? loc : el);
    }
    lt.subtasks.forEach((l, idx) => { // lignes ajoutées ici
      if (baseLines.has(l.id) || out.some((o) => o.id === l.id)) return;
      const prev = idx > 0 ? lt.subtasks[idx - 1].id : null;
      const at = prev ? out.findIndex((o) => o.id === prev) + 1 : 0;
      out.splice(prev && at === 0 ? out.length : at, 0, l);
    });
    m.subtasks = normalizeIndents(out);
    return m;
  }
  function external(data) {
    if (!booted) return;
    const ext = normalizeState(data);
    const local = new Map(state.tasks.map((t) => [t.id, t]));
    const extIds = new Set(ext.tasks.map((t) => t.id));
    let localWins = false;
    const merged = [];
    for (const et of ext.tasks) {
      if (deletedIds.has(et.id)) { localWins = true; continue; }
      const lt = local.get(et.id);
      const base = synced.get(et.id);
      if (!lt) { merged.push(et); continue; }
      const localChanged = !base || JSON.stringify(lt) !== base;
      const extChanged = !base || JSON.stringify(et) !== base;
      if (!localChanged || same(lt, et)) merged.push(et);
      else if (!extChanged) { merged.push(lt); localWins = true; }
      else if (!base) { merged.push(lt.updatedAt > et.updatedAt ? lt : et); localWins = true; }
      else { merged.push(mergeTask(base, lt, et)); localWins = true; }
    }
    state.tasks.forEach((lt, idx) => {
      if (!extIds.has(lt.id) && !synced.has(lt.id)) { merged.splice(Math.min(idx, merged.length), 0, lt); localWins = true; }
    });
    const before = JSON.stringify(state.tasks);
    const curBefore = cur ? JSON.stringify(cur) : null;
    state.tasks = merged;
    synced = snapshotOf(ext.tasks);
    if (JSON.stringify(state.tasks) === before) { if (localWins) scheduleSave(); return; }

    const focus = editingContext();
    cur = taskById(state.selectedId) || state.tasks.find((t) => !t.done) || null;
    state.selectedId = cur ? cur.id : null;
    renderSidebar();
    if (!cur || JSON.stringify(cur) !== curBefore) {
      if (cur) histories.delete(cur.id);
      renderMain();
      renderNotes();
      applyLayout();
      restoreEditing(focus);
      postTitle();
    }
    if (localWins) scheduleSave();
    toast('Liste mise à jour depuis l’extérieur');
  }
  function editingContext() {
    const a = document.activeElement;
    if (!a || !cur) return null;
    if (a.id === 'title') return { kind: 'title', offset: getSel(a).start, task: cur.id };
    if (a.id === 'notesEditor') return { kind: 'notes', task: cur.id };
    const f = currentFocus();
    return f ? { kind: 'line', ...f, task: cur.id } : null;
  }
  function restoreEditing(f) {
    if (!f || !cur || f.task !== cur.id) return;
    if (f.kind === 'title') { const el = $('#title'); if (el) setCaret(el, Math.min(f.offset, el.textContent.length)); }
    else if (f.kind === 'notes') { editor().blur(); focusNotesEnd(); }
    else if (f.kind === 'line' && textOf(f.id)) focusLine(f.id, f.offset);
  }

  window.JobNote = {
    boot,
    external,
    setDark,
    serialize() { clearTimeout(saveTimer); dirty = false; return JSON.stringify(state); },
    saveFailed() { setSaveStatus('error'); toast('La sauvegarde a échoué'); },
    // utilisé par les tests
    _state: () => state,
    aiConfig: onAIConfig,
    aiModels: onAIModels,
    aiChunk: onAIChunk,
    aiChats: onAIChats,
    aiDone: onAIDone,
    aiError: onAIError,
    aiStatus: onAIStatus,
    aiPicked: onAIPicked,
  };

  if (bridge) post({ type: 'ready' });
  else {
    let data = null;
    try { data = JSON.parse(localStorage.getItem('jobnote')); } catch (e) { /* ignore */ }
    boot(data, matchMedia('(prefers-color-scheme: dark)').matches);
  }
})();
