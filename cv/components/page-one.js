import { pageOneMarkup } from '../content/page-one-content.js';
import { createDefaultDocument, normaliseDocument } from '../content/page-one-model.js';
const STORAGE_KEY = 'legend-systems-a4-cv-builder';
const clone = (document) => structuredClone(document);
function setByPath(target, path, value) {
    const parts = path.split('.');
    let cursor = target;
    for (const part of parts.slice(0, -1)) {
        if (!cursor || typeof cursor !== 'object' || !(part in cursor))
            return false;
        cursor = cursor[part];
    }
    if (!cursor || typeof cursor !== 'object')
        return false;
    const key = parts.at(-1);
    if (!key || !(key in cursor))
        return false;
    const current = cursor[key];
    cursor[key] = typeof current === 'number' ? Number(value) : typeof current === 'boolean' ? value === 'true' : value;
    return true;
}
export class PageOne {
    document;
    root;
    initialDocument;
    listeners = new Set();
    history = [];
    future = [];
    builderSnapshots = new Map();
    saveTimer = 0;
    editSnapshot = null;
    resizeObserver = null;
    constructor(root) {
        this.root = root;
        this.initialDocument = createDefaultDocument();
        this.document = this.load();
        this.root.addEventListener('input', this.handleInput);
        this.root.addEventListener('focusin', this.handleFocusIn);
        this.root.addEventListener('focusout', this.handleFocusOut);
        this.resizeObserver = new ResizeObserver(() => this.checkOverflow());
        this.resizeObserver.observe(this.root);
        this.render();
    }
    load() {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (!saved)
            return createDefaultDocument();
        try {
            return normaliseDocument(JSON.parse(saved));
        }
        catch {
            return createDefaultDocument();
        }
    }
    render() {
        this.root.innerHTML = pageOneMarkup(this.document);
        this.root.dataset.theme = this.document.theme;
        this.applyPortraitStyle();
        this.checkOverflow();
        this.notify();
    }
    applyPortraitStyle() {
        const frame = this.root.querySelector('.portrait-frame');
        if (!frame)
            return;
        frame.style.setProperty('--portrait-x', `${this.document.portrait.x}%`);
        frame.style.setProperty('--portrait-y', `${this.document.portrait.y}%`);
        frame.style.setProperty('--portrait-scale', String(this.document.portrait.scale));
    }
    handleFocusIn = (event) => {
        const target = event.target;
        if (target?.matches('[contenteditable="true"]'))
            this.editSnapshot = clone(this.document);
    };
    handleFocusOut = (event) => {
        const target = event.target;
        if (!target?.matches('[contenteditable="true"]') || !this.editSnapshot)
            return;
        if (JSON.stringify(this.editSnapshot) !== JSON.stringify(this.document)) {
            this.history.push(this.editSnapshot);
            this.future = [];
        }
        this.editSnapshot = null;
        this.queueSave();
    };
    handleInput = (event) => {
        const target = event.target;
        const field = target?.dataset.field;
        if (!field || !target?.matches('[contenteditable="true"]'))
            return;
        setByPath(this.document, field, target.textContent || '');
        this.queueSave();
    };
    notify() {
        for (const listener of this.listeners)
            listener(this);
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    getDocument() {
        return clone(this.document);
    }
    updateField(field, value, commit = false) {
        const previous = clone(this.document);
        if (!setByPath(this.document, field, value))
            return;
        if (commit) {
            this.history.push(previous);
            this.future = [];
            this.render();
        }
        else {
            this.syncField(field, value);
            if (!this.builderSnapshots.has(field))
                this.builderSnapshots.set(field, previous);
            this.applyPortraitStyle();
            this.queueSave();
            this.checkOverflow();
        }
    }
    commitField(field) {
        const previous = this.builderSnapshots.get(field);
        if (!previous)
            return;
        this.builderSnapshots.delete(field);
        if (JSON.stringify(previous) === JSON.stringify(this.document))
            return;
        this.history.push(previous);
        this.future = [];
        this.render();
        this.queueSave();
    }
    syncField(field, value) {
        this.root.querySelectorAll('[data-field]').forEach(element => {
            if (element.dataset.field === field && element.matches('[contenteditable="true"]'))
                element.textContent = value;
        });
    }
    updateDocument(mutator) {
        const previous = clone(this.document);
        mutator(this.document);
        this.history.push(previous);
        this.future = [];
        this.render();
        this.queueSave();
    }
    setTheme(theme) {
        if (this.document.theme === theme)
            return;
        this.updateDocument(document => { document.theme = theme; });
    }
    replacePortrait(dataUrl) {
        this.updateDocument(document => { document.portrait.src = dataUrl; });
    }
    resetPortrait() {
        this.updateDocument(document => { document.portrait = clone(this.initialDocument).portrait; });
    }
    reset() {
        window.clearTimeout(this.saveTimer);
        window.localStorage.removeItem(STORAGE_KEY);
        this.document = createDefaultDocument();
        this.history = [];
        this.future = [];
        this.builderSnapshots.clear();
        this.render();
        document.querySelector('#save-status')?.replaceChildren(document.createTextNode('RESET TO MASTER'));
    }
    undo() {
        const previous = this.history.pop();
        if (!previous)
            return;
        this.future.push(clone(this.document));
        this.document = previous;
        this.render();
        this.queueSave();
    }
    redo() {
        const next = this.future.pop();
        if (!next)
            return;
        this.history.push(clone(this.document));
        this.document = next;
        this.render();
        this.queueSave();
    }
    canUndo() { return this.history.length > 0; }
    canRedo() { return this.future.length > 0; }
    importJSON(json) {
        const imported = normaliseDocument(JSON.parse(json));
        this.updateDocument(document => Object.assign(document, imported));
    }
    exportJSON() {
        const blob = new Blob([JSON.stringify(this.document, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'legend-systems-page-one.json';
        link.click();
        URL.revokeObjectURL(link.href);
    }
    getOverflowReport() {
        const page = this.root.querySelector('.cv-page');
        if (!page)
            return [];
        const pageRect = page.getBoundingClientRect();
        const overflowing = [];
        if (page.scrollHeight > page.clientHeight + 1)
            overflowing.push('Page One content exceeds the A4 canvas');
        page.querySelectorAll('[data-section]').forEach(section => {
            if (section.getBoundingClientRect().bottom > pageRect.bottom + 1)
                overflowing.push(section.dataset.section || 'section');
        });
        return [...new Set(overflowing)];
    }
    checkOverflow() {
        window.requestAnimationFrame(() => {
            const report = this.getOverflowReport();
            this.root.dataset.overflow = report.length ? 'true' : 'false';
            const status = document.querySelector('#overflow-status');
            if (!status)
                return;
            status.textContent = report.length ? `OVERFLOW / ${report.length} CHECK${report.length === 1 ? '' : 'S'}` : 'A4 FIT / NO OVERFLOW';
            status.dataset.state = report.length ? 'warning' : 'ready';
            status.title = report.join(', ');
        });
    }
    queueSave() {
        window.clearTimeout(this.saveTimer);
        this.saveTimer = window.setTimeout(() => {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.document));
            document.querySelector('#save-status')?.replaceChildren(document.createTextNode('SAVED LOCALLY'));
        }, 300);
        document.querySelector('#save-status')?.replaceChildren(document.createTextNode('EDITING…'));
    }
}
