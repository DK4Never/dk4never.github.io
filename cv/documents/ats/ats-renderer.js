import { editableText, escapeEditableText, normaliseEditableText } from '../../components/editable-text.js';
import { setDraftStatus } from '../../components/document-draft-status.js';
import { setOverflowStatus } from '../../components/document-overflow-status.js';
import { ThemePreferenceStore } from '../../app/theme-preference-store.js';
import { printDocument } from '../../app/print-preference.js';
import { applyAtsDraft, canonicalAtsDraft, cloneAtsDocument } from './ats-model.js';
import { ATS_MAX_BULLET_LENGTH, ATS_MAX_EXPERIENCE_SUMMARY_LENGTH, ATS_MAX_PROJECT_DESCRIPTION_LENGTH, ATS_MAX_SUMMARY_LENGTH } from './ats-model.js';
import { AtsDraftStore } from './ats-draft.js';
import { measureAtsOverflow } from './ats-overflow.js';
const text = escapeEditableText;
const contactLine = (label, item) => `<p><strong>${text(label)}:</strong> <a href="${text(item.href)}">${text(item.display)}</a></p>`;
const contactLocation = (location) => `<p><strong>Location:</strong> ${text(location)}</p>`;
const experienceMarkup = (item, index) => {
    const paginationClass = index === 6 ? ' ats-experience--page-balance' : '';
    return `<article class="ats-experience${paginationClass}" data-experience-id="${text(item.id)}">
  <h3>${text(item.organisation)}</h3>
  <p class="ats-role">${text(item.role)}</p>
  <p class="ats-specialisation">${text(item.specialisation)}</p>
  <p class="ats-period"><strong>${text(item.period)}</strong>${item.location ? ` · ${text(item.location)}` : ''}</p>
  ${item.concurrent ? '<p class="ats-concurrent">Concurrent independent work</p>' : ''}
  <p>${editableText(`experience.${item.id}.summary`, `${item.role} summary`, item.summary, ATS_MAX_EXPERIENCE_SUMMARY_LENGTH, 'ats-editable')}</p>
  ${item.bullets.length ? `<ul>${item.bullets.map((bullet, index) => `<li>${editableText(`experience.${item.id}.bullet.${index}`, `${item.role} responsibility ${index + 1}`, bullet, ATS_MAX_BULLET_LENGTH, 'ats-editable')}</li>`).join('')}</ul>` : ''}
</article>`;
};
const projectMarkup = (item) => `<article class="ats-project" data-project-id="${text(item.id)}">
  <h3>${text(item.name)}</h3>
  <p>${editableText(`projects.${item.id}.description`, `${item.name} description`, item.description, ATS_MAX_PROJECT_DESCRIPTION_LENGTH, 'ats-editable')}</p>
  <p class="ats-project-technologies"><strong>Technologies:</strong> ${item.technologies.map(text).join(', ')}</p>
  ${item.url ? `<p class="ats-project-url"><strong>Project URL:</strong> <a href="${text(item.url)}">${text(item.url)}</a></p>` : ''}
</article>`;
export function atsMarkup(document) {
    return `<article class="ats-document" data-theme="${text(document.theme)}" aria-labelledby="ats-name">
    <header class="ats-header">
      <h1 id="ats-name">${text(document.contact.name)}</h1>
      <p class="ats-target-title">${text(document.positioning.primary)}</p>
      <p class="ats-secondary-positioning">${text(document.positioning.secondary)}</p>
    </header>
    <address class="ats-contact" aria-label="Public contact information">
      ${contactLocation(document.contact.location)}
      ${contactLine('Phone', document.contact.phone)}
      ${contactLine('Email', document.contact.email)}
      ${contactLine('Portfolio', document.contact.portfolio)}
      ${contactLine('GitHub', document.contact.github)}
      ${contactLine('LinkedIn', document.contact.linkedin)}
    </address>
    <section aria-labelledby="ats-summary-heading"><h2 id="ats-summary-heading">Professional Summary</h2><p>${editableText('summary', 'Professional summary', document.summary, ATS_MAX_SUMMARY_LENGTH, 'ats-editable')}</p></section>
    <section aria-labelledby="ats-skills-heading"><h2 id="ats-skills-heading">Core Skills</h2>${document.skillGroups.map(group => `<div class="ats-skill-group"><h3>${text(group.label)}</h3><ul>${group.items.map(item => `<li>${text(item)}</li>`).join('')}</ul></div>`).join('')}</section>
    <section aria-labelledby="ats-experience-heading"><h2 id="ats-experience-heading">Professional Experience</h2>${document.experience.map(experienceMarkup).join('')}</section>
    <section aria-labelledby="ats-projects-heading"><h2 id="ats-projects-heading">Selected Projects</h2>${document.projects.map(projectMarkup).join('')}</section>
    ${document.additionalTechnicalExposure.length ? `<section aria-labelledby="ats-exposure-heading"><h2 id="ats-exposure-heading">Additional Technical Exposure</h2><ul>${document.additionalTechnicalExposure.map(item => `<li>${text(item)}</li>`).join('')}</ul></section>` : ''}
    <section aria-labelledby="ats-education-heading"><h2 id="ats-education-heading">Education</h2><p><strong>${text(document.education.institution)}</strong><br>${text(document.education.qualification)} · ${text(document.education.completed)}</p></section>
    <section aria-labelledby="ats-languages-heading"><h2 id="ats-languages-heading">Languages</h2><ul>${document.languages.map(item => `<li>${text(item)}</li>`).join('')}</ul></section>
  </article>`;
}
const fieldValue = (document, fieldId) => {
    if (fieldId === 'summary')
        return { value: document.summary, maxLength: ATS_MAX_SUMMARY_LENGTH };
    const experienceMatch = /^experience\.([^\.]+)\.(summary|bullet)\.(\d+)$/.exec(fieldId);
    if (experienceMatch) {
        const item = document.experience.find(candidate => candidate.id === experienceMatch[1]);
        if (!item)
            return null;
        if (experienceMatch[2] === 'summary')
            return { value: item.summary, maxLength: ATS_MAX_EXPERIENCE_SUMMARY_LENGTH };
        const bullet = item.bullets[Number(experienceMatch[3])];
        return typeof bullet === 'string' ? { value: bullet, maxLength: ATS_MAX_BULLET_LENGTH } : null;
    }
    const projectMatch = /^projects\.([^\.]+)\.description$/.exec(fieldId);
    if (projectMatch) {
        const item = document.projects.find(candidate => candidate.id === projectMatch[1]);
        return item ? { value: item.description, maxLength: ATS_MAX_PROJECT_DESCRIPTION_LENGTH } : null;
    }
    return null;
};
export class AtsRenderer {
    document;
    root;
    initialDocument;
    draftStore;
    onDraftState;
    onOverflow;
    themePreferenceStore;
    customAccent;
    listeners = new Set();
    saveTimer = 0;
    overflowTimer = 0;
    overflowReport = { overflowing: true, documentWidth: 0, documentClientWidth: 0, sections: [] };
    constructor(root, canonical, options = {}) {
        this.root = root;
        this.initialDocument = cloneAtsDocument(canonical);
        this.draftStore = options.draftStore ?? new AtsDraftStore();
        this.onDraftState = options.onDraftState;
        this.onOverflow = options.onOverflow;
        this.themePreferenceStore = new ThemePreferenceStore();
        this.customAccent = this.themePreferenceStore.load('ats');
        const restored = this.draftStore.load(canonical);
        this.document = applyAtsDraft(canonical, restored.payload);
        this.root.id = 'ats-frame';
        this.root.className = 'ats-frame';
        document.body.classList.add('ats-active');
        document.documentElement.classList.add('ats-active');
        this.onDraftState?.(restored.state === 'local');
        this.root.addEventListener('input', this.handleInput);
        window.addEventListener('resize', this.scheduleOverflow, { passive: true });
        this.render();
    }
    render() {
        this.root.innerHTML = atsMarkup(this.document);
        this.applyAccentStyle();
        this.scheduleOverflow();
        this.notify();
    }
    applyAccentStyle() {
        if (this.customAccent) {
            this.root.dataset.customAccent = 'true';
            this.root.style.setProperty('--document-accent', this.customAccent);
        }
        else {
            delete this.root.dataset.customAccent;
            this.root.style.removeProperty('--document-accent');
        }
    }
    notify() { for (const listener of this.listeners)
        listener(this.getDocument()); }
    scheduleOverflow = () => {
        window.cancelAnimationFrame(this.overflowTimer);
        this.overflowTimer = window.requestAnimationFrame(() => {
            const report = measureAtsOverflow(this.root);
            this.overflowReport = report;
            setOverflowStatus({ overflowing: report.overflowing, message: report.overflowing ? 'HORIZONTAL OVERFLOW / PRINT DISABLED' : 'ATS FLOW / NO HORIZONTAL OVERFLOW', title: report.sections.join(', ') });
            this.onOverflow?.(report);
            this.notify();
        });
    };
    handleInput = (event) => {
        const target = event.target;
        if (!target?.matches('[contenteditable="true"]'))
            return;
        const fieldId = target.dataset.fieldId;
        if (!fieldId)
            return;
        const field = fieldValue(this.document, fieldId);
        if (!field)
            return;
        try {
            const value = normaliseEditableText(target.textContent || '', field.maxLength);
            target.replaceChildren(document.createTextNode(value));
            if (fieldId === 'summary')
                this.document.summary = value;
            else {
                const experienceMatch = /^experience\.([^\.]+)\.(summary|bullet)\.(\d+)$/.exec(fieldId);
                const projectMatch = /^projects\.([^\.]+)\.description$/.exec(fieldId);
                if (experienceMatch) {
                    const item = this.document.experience.find(candidate => candidate.id === experienceMatch[1]);
                    if (!item)
                        return;
                    if (experienceMatch[2] === 'summary')
                        item.summary = value;
                    else
                        item.bullets[Number(experienceMatch[3])] = value;
                }
                else if (projectMatch) {
                    const item = this.document.projects.find(candidate => candidate.id === projectMatch[1]);
                    if (!item)
                        return;
                    item.description = value;
                }
                else
                    return;
            }
            setDraftStatus('EDITING…');
            this.queueSave();
            this.scheduleOverflow();
            this.notify();
        }
        catch {
            setDraftStatus('IMPORT REJECTED');
        }
    };
    queueSave() {
        window.clearTimeout(this.saveTimer);
        this.saveTimer = window.setTimeout(() => this.saveDraft(), 300);
        setDraftStatus('EDITING…');
    }
    saveDraft() {
        try {
            const saved = this.draftStore.save(canonicalAtsDraft(this.document));
            setDraftStatus(saved ? 'SAVED LOCALLY' : 'LOCAL STORAGE UNAVAILABLE');
            if (saved)
                this.onDraftState?.(true);
            return saved;
        }
        catch {
            setDraftStatus('LOCAL STORAGE UNAVAILABLE');
            return false;
        }
    }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    getDocument() { return cloneAtsDocument(this.document); }
    getTheme() { return this.document.theme; }
    setTheme(theme) {
        if (!['blue', 'gold', 'red'].includes(theme) || this.document.theme === theme)
            return;
        this.document.theme = theme;
        this.customAccent = null;
        this.themePreferenceStore.reset('ats');
        this.render();
    }
    getAccent() { return this.customAccent ? { mode: 'custom', hex: this.customAccent } : { mode: 'theme', hex: '' }; }
    setCustomAccent(hex) {
        if (!/^#[0-9a-f]{6}$/i.test(hex))
            throw new Error('Accent must be a six-digit HEX color');
        this.customAccent = hex.toUpperCase();
        this.themePreferenceStore.save('ats', this.customAccent);
        this.render();
    }
    resetCustomAccent() {
        if (!this.customAccent)
            return;
        this.customAccent = null;
        this.themePreferenceStore.reset('ats');
        this.render();
    }
    canPrint() { return !this.overflowReport.overflowing; }
    print() {
        if (!this.canPrint()) {
            setDraftStatus('PRINT DISABLED / OVERFLOW');
            return false;
        }
        printDocument();
        return true;
    }
    reset() {
        window.clearTimeout(this.saveTimer);
        this.draftStore.reset();
        this.document = cloneAtsDocument(this.initialDocument);
        setDraftStatus('RESET TO PROJECTED CONTENT');
        this.onDraftState?.(false);
        this.render();
    }
    exportJSON() { this.draftStore.export(canonicalAtsDraft(this.document)); }
    importJSON(json) {
        const payload = this.draftStore.import(json);
        this.document = applyAtsDraft(this.initialDocument, payload);
        const saved = this.draftStore.save(payload);
        setDraftStatus(saved ? 'SAVED LOCALLY' : 'LOCAL STORAGE UNAVAILABLE');
        if (saved)
            this.onDraftState?.(true);
        this.render();
    }
    destroy() {
        window.clearTimeout(this.saveTimer);
        window.cancelAnimationFrame(this.overflowTimer);
        window.removeEventListener('resize', this.scheduleOverflow);
        this.root.removeEventListener('input', this.handleInput);
        document.body.classList.remove('ats-active');
        document.documentElement.classList.remove('ats-active');
        this.listeners.clear();
    }
}
