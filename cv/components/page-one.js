import { pageOneMarkup } from '../content/page-one-content.js';
import { createDefaultDocument, normaliseDocument } from '../content/page-one-model.js';
import { DraftStore, validateImportedPageOne } from '../app/draft-store.js';
import { normaliseEditableText } from './editable-text.js';
import { setDraftStatus } from './document-draft-status.js';
import { resolveAssetUrl } from '../utils/asset-url.js';
import { printDocument } from '../app/print-preference.js';
const clone = (document) => structuredClone(document);
const capabilityIconNames = ['code-2', 'database', 'server', 'network'];
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
    draftStore;
    onDraftState;
    onOverflow;
    listeners = new Set();
    history = [];
    future = [];
    builderSnapshots = new Map();
    saveTimer = 0;
    editSnapshot = null;
    resizeObserver = null;
    constructor(root, initialDocument = createDefaultDocument(), options = {}) {
        this.root = root;
        this.initialDocument = clone(initialDocument);
        this.draftStore = options.draftStore ?? new DraftStore();
        this.onDraftState = options.onDraftState;
        this.onOverflow = options.onOverflow;
        this.draftStore.migrateLegacyPageOne(this.initialDocument);
        this.document = this.load();
        this.root.addEventListener('input', this.handleInput);
        this.root.addEventListener('focusin', this.handleFocusIn);
        this.root.addEventListener('focusout', this.handleFocusOut);
        this.resizeObserver = new ResizeObserver(() => this.checkOverflow());
        this.resizeObserver.observe(this.root);
        this.render();
    }
    load() {
        const saved = this.draftStore.load('page-one');
        this.onDraftState?.(Boolean(saved));
        return saved ? normaliseDocument(saved.payload, this.initialDocument) : clone(this.initialDocument);
    }
    render() {
        this.root.innerHTML = pageOneMarkup(this.document);
        this.root.dataset.theme = this.document.theme;
        this.applyAccentStyle();
        this.applyReferenceShellMarkup();
        this.applyPortraitStyle();
        this.checkOverflow();
        this.notify();
    }
    applyReferenceShellMarkup() {
        if (this.document.theme !== 'red')
            return;
        this.root.querySelectorAll('.capability .mask-icon').forEach((icon, index) => {
            const iconName = capabilityIconNames[index];
            if (!iconName)
                return;
            icon.classList.add('cv-capability-icon');
            icon.style.setProperty('--icon-url', `url('${resolveAssetUrl(`assets/icons/cv/${iconName}.svg`)}')`);
        });
        const primaryBrand = this.root.querySelector('.brand-lockup');
        if (primaryBrand) {
            primaryBrand.classList.add('reference-primary-brand');
            primaryBrand.setAttribute('aria-label', 'Legend Systems');
            primaryBrand.querySelector('.legend-systems-mark')?.classList.add('reference-primary-brand-mark');
            const image = document.createElement('img');
            image.className = 'reference-primary-brand-image';
            image.src = resolveAssetUrl('assets/branding/owner/legend-systems-red-cv.png');
            image.alt = '';
            image.setAttribute('aria-hidden', 'true');
            image.loading = 'eager';
            primaryBrand.append(image);
        }
        const hero = this.root.querySelector('.hero-panel');
        if (!hero || hero.querySelector('.reference-identity-panel'))
            return;
        const identity = document.createElement('aside');
        identity.className = 'reference-identity-panel';
        identity.setAttribute('aria-label', 'Legend Systems identity');
        const name = document.createElement('strong');
        name.textContent = 'LEGEND SYSTEMS';
        const discipline = document.createElement('span');
        discipline.textContent = 'INDUSTRIAL SOFTWARE';
        const integration = document.createElement('span');
        integration.textContent = 'SYSTEMS INTEGRATION';
        identity.append(name, discipline, integration);
        const capabilityBar = this.root.querySelector('.capability-bar');
        const intelligenceReserve = document.createElement('div');
        intelligenceReserve.className = 'reference-intelligence-reserve';
        intelligenceReserve.setAttribute('role', 'group');
        intelligenceReserve.setAttribute('aria-label', 'Knowledge map');
        const mapSlogan = document.createElement('p');
        mapSlogan.className = 'reference-map-slogan';
        mapSlogan.textContent = this.document.mapSlogan || 'KNOWLEDGE COMES,\nBUT WISDOM LINGERS.';
        const featureVisual = document.createElement('img');
        featureVisual.classList.add('reference-feature-visual');
        featureVisual.src = resolveAssetUrl('assets/branding/owner/legend-world-network.svg');
        featureVisual.alt = '';
        featureVisual.loading = 'eager';
        featureVisual.setAttribute('aria-hidden', 'true');
        intelligenceReserve.append(mapSlogan, featureVisual);
        if (capabilityBar)
            capabilityBar.insertAdjacentElement('afterend', intelligenceReserve);
        const footer = hero.parentElement?.querySelector('.cv-footer');
        const shellReserve = document.createElement('div');
        shellReserve.className = 'reference-shell-reserve';
        shellReserve.setAttribute('aria-hidden', 'true');
        if (footer)
            footer.insertAdjacentElement('beforebegin', shellReserve);
        hero.append(identity);
    }
    applyPortraitStyle() {
        const frame = this.root.querySelector('.portrait-frame');
        if (!frame)
            return;
        frame.style.setProperty('--portrait-x', `${this.document.portrait.x}%`);
        frame.style.setProperty('--portrait-y', `${this.document.portrait.y}%`);
        frame.style.setProperty('--portrait-scale', String(this.document.portrait.scale));
    }
    applyAccentStyle() {
        const custom = this.document.accent?.mode === 'custom' ? this.document.accent.hex : null;
        if (!custom) {
            delete this.root.dataset.customAccent;
            this.root.style.removeProperty('--cv-custom-accent');
            this.root.style.removeProperty('--cv-custom-accent-strong');
            this.root.style.removeProperty('--cv-accent-rgb');
            return;
        }
        const red = Number.parseInt(custom.slice(1, 3), 16);
        const green = Number.parseInt(custom.slice(3, 5), 16);
        const blue = Number.parseInt(custom.slice(5, 7), 16);
        this.root.dataset.customAccent = 'true';
        this.root.style.setProperty('--cv-custom-accent', custom);
        this.root.style.setProperty('--cv-custom-accent-strong', custom);
        this.root.style.setProperty('--cv-accent-rgb', `${red}, ${green}, ${blue}`);
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
        this.commitActiveEdit();
        this.queueSave();
    };
    commitActiveEdit() {
        if (!this.editSnapshot)
            return;
        if (JSON.stringify(this.editSnapshot) !== JSON.stringify(this.document)) {
            this.history.push(this.editSnapshot);
            this.future = [];
        }
        this.editSnapshot = null;
    }
    handleInput = (event) => {
        const target = event.target;
        const field = target?.dataset.field;
        if (!field || !target?.matches('[contenteditable="true"]'))
            return;
        try {
            const value = normaliseEditableText(target.textContent || '', 2_000);
            setByPath(this.document, field, value);
            // Keep the active caret intact for ordinary text input. Replacing the
            // child node on every keystroke can blur contenteditable in Chromium,
            // which prevents the active edit snapshot from reaching undo/redo.
            if (target.children.length > 0 || target.textContent !== value) {
                target.replaceChildren(document.createTextNode(value));
            }
        }
        catch {
            target.replaceChildren(document.createTextNode(this.getFieldValue(field)));
        }
        this.queueSave();
    };
    getFieldValue(field) {
        const parts = field.split('.');
        let cursor = this.document;
        for (const part of parts) {
            if (!cursor || typeof cursor !== 'object')
                return '';
            cursor = cursor[part];
        }
        return typeof cursor === 'string' ? cursor : '';
    }
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
    getTheme() { return this.document.theme; }
    getAccent() {
        return this.document.accent?.mode === 'custom'
            ? { mode: 'custom', hex: this.document.accent.hex }
            : { mode: 'theme', hex: '' };
    }
    setCustomAccent(hex) {
        if (!/^#[0-9a-f]{6}$/i.test(hex))
            throw new Error('Accent must be a six-digit HEX color');
        this.updateDocument(document => { document.accent = { mode: 'custom', hex: hex.toUpperCase() }; });
    }
    resetCustomAccent() {
        if (!this.document.accent)
            return;
        this.updateDocument(document => { delete document.accent; });
    }
    replacePortrait(dataUrl) {
        this.updateDocument(document => { document.portrait.src = dataUrl; });
    }
    resetPortrait() {
        this.updateDocument(document => { document.portrait = clone(this.initialDocument).portrait; });
    }
    addTechnology() {
        this.updateDocument(document => document.technology.items.push({
            id: `technology-${Date.now().toString(36)}`,
            name: 'New technology',
            icon: 'technology',
            iconMode: 'built-in',
            colorMode: 'accent'
        }));
    }
    resetTechnologyStack() {
        this.updateDocument(document => { document.technology = clone(this.initialDocument).technology; });
    }
    reset() {
        window.clearTimeout(this.saveTimer);
        this.draftStore.reset('page-one');
        this.document = clone(this.initialDocument);
        this.history = [];
        this.future = [];
        this.builderSnapshots.clear();
        this.render();
        this.onDraftState?.(false);
        document.querySelector('#save-status')?.replaceChildren(document.createTextNode('RESET TO PROJECTED CONTENT'));
    }
    undo() {
        this.commitActiveEdit();
        const previous = this.history.pop();
        if (!previous)
            return;
        this.future.push(clone(this.document));
        this.document = previous;
        this.render();
        this.queueSave();
    }
    redo() {
        this.commitActiveEdit();
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
    saveDraft() { this.commitActiveEdit(); this.notify(); this.queueSave(); }
    importJSON(json) {
        const imported = validateImportedPageOne(JSON.parse(json), this.initialDocument);
        const previous = clone(this.document);
        this.document = imported;
        this.history.push(previous);
        this.future = [];
        this.render();
        this.queueSave();
    }
    exportJSON() {
        const envelope = {
            schemaVersion: 1,
            documentId: 'page-one',
            contentVersion: 1,
            payload: this.document
        };
        const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
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
        const factualContainers = [
            ['Skills', '.skills-panel'],
            ['Selected Systems', '.achievements-panel'],
            ['Experience', '.experience-panel'],
            ['Summary', '.summary-panel'],
            ['Contact', '.contact-panel'],
            ['Technology', '.stack-panel'],
            ['Education', '.education-panel'],
            ['Languages', '.languages-panel'],
            ['Footer', '.cv-footer']
        ];
        for (const [label, selector] of factualContainers) {
            const container = page.querySelector(selector);
            if (!container)
                continue;
            if (container.scrollHeight > container.clientHeight + 1 || container.scrollWidth > container.clientWidth + 1) {
                overflowing.push(`${label} content is clipped`);
            }
        }
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
            this.onOverflow?.(report.length > 0);
            const status = document.querySelector('#overflow-status');
            if (!status)
                return;
            status.textContent = report.length ? `OVERFLOW / ${report.length} CHECK${report.length === 1 ? '' : 'S'}` : 'A4 FIT / NO OVERFLOW';
            status.dataset.state = report.length ? 'warning' : 'ready';
            status.title = report.join(', ');
        });
    }
    canPrint() { return this.getOverflowReport().length === 0; }
    print() {
        if (!this.canPrint()) {
            setDraftStatus('PRINT DISABLED / OVERFLOW');
            return false;
        }
        printDocument();
        return true;
    }
    queueSave() {
        window.clearTimeout(this.saveTimer);
        this.saveTimer = window.setTimeout(() => {
            const saved = this.draftStore.save('page-one', this.document);
            if (saved) {
                this.onDraftState?.(true);
                document.querySelector('#save-status')?.replaceChildren(document.createTextNode('SAVED LOCALLY'));
            }
            else {
                document.querySelector('#save-status')?.replaceChildren(document.createTextNode('LOCAL STORAGE UNAVAILABLE'));
            }
        }, 300);
        document.querySelector('#save-status')?.replaceChildren(document.createTextNode('EDITING…'));
    }
    destroy() {
        window.clearTimeout(this.saveTimer);
        this.root.removeEventListener('input', this.handleInput);
        this.root.removeEventListener('focusin', this.handleFocusIn);
        this.root.removeEventListener('focusout', this.handleFocusOut);
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        this.listeners.clear();
    }
}
