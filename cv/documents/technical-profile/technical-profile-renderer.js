import { editableText, escapeEditableText, normaliseEditableText } from '../../components/editable-text.js';
import { setDraftStatus } from '../../components/document-draft-status.js';
import { setOverflowStatus } from '../../components/document-overflow-status.js';
import { ThemePreferenceStore } from '../../app/theme-preference-store.js';
import { printDocument } from '../../app/print-preference.js';
import { applyTechnicalProfileDraft, canonicalTechnicalProfileDraft, cloneTechnicalProfileDocument, TECHNICAL_MAX_BULLET_LENGTH, TECHNICAL_MAX_DEVELOPMENT_LENGTH, TECHNICAL_MAX_EXPERIENCE_SUMMARY_LENGTH, TECHNICAL_MAX_FOCUS_LENGTH, TECHNICAL_MAX_PROJECT_DESCRIPTION_LENGTH, TECHNICAL_MAX_SUMMARY_LENGTH } from './technical-profile-model.js';
import { TechnicalProfileDraftStore } from './technical-profile-draft.js';
import { measureTechnicalProfileOverflow } from './technical-profile-overflow.js';
const text = escapeEditableText;
const contactLine = (label, item) => `<p><strong>${text(label)}:</strong> <a href="${text(item.href)}">${text(item.display)}</a></p>`;
const contactLocation = (location) => `<p><strong>Location:</strong> ${text(location)}</p>`;
const experienceMarkup = (item) => {
    const paginationClass = item.bullets.length ? ' technical-experience--detailed' : ' technical-experience--compact';
    return `<article class="technical-experience${paginationClass}" data-experience-id="${text(item.id)}">
  <header class="technical-entry-heading"><div><h3>${text(item.organisation)}</h3><p class="technical-role">${text(item.role)}</p></div><p class="technical-period"><strong>${text(item.period)}</strong>${item.location ? ` · ${text(item.location)}` : ''}</p></header>
  <p class="technical-specialisation">${text(item.specialisation)}</p>
  ${item.concurrent ? '<p class="technical-concurrent">Concurrent independent work</p>' : ''}
  <p>${editableText(`experience.${item.id}.summary`, `${item.role} summary`, item.summary, TECHNICAL_MAX_EXPERIENCE_SUMMARY_LENGTH, 'technical-profile-editable')}</p>
  ${item.bullets.length ? `<ul>${item.bullets.map((bullet, index) => `<li>${editableText(`experience.${item.id}.bullet.${index}`, `${item.role} responsibility ${index + 1}`, bullet, TECHNICAL_MAX_BULLET_LENGTH, 'technical-profile-editable')}</li>`).join('')}</ul>` : ''}
</article>`;
};
const projectMarkup = (item) => {
    const paginationClass = item.url ? ' technical-project--linked' : ' technical-project--compact';
    return `<article class="technical-project${paginationClass}" data-project-id="${text(item.id)}">
  <h3>${text(item.name)}</h3>
  <p>${editableText(`projects.${item.id}.description`, `${item.name} description`, item.description, TECHNICAL_MAX_PROJECT_DESCRIPTION_LENGTH, 'technical-profile-editable')}</p>
  <p class="technical-technologies"><strong>Technologies:</strong> ${item.technologies.map(text).join(', ')}</p>
  ${item.url ? `<p class="technical-project-url"><strong>Project URL:</strong> <a href="${text(item.url)}">${text(item.url)}</a></p>` : ''}
</article>`;
};
const capabilityGroupMarkup = (group, allowed, className) => {
    const items = group.items.filter(item => allowed.has(item.classification));
    if (!items.length)
        return '';
    const paginationClass = items.length > 5 ? ' technical-capability-group--detailed' : ' technical-capability-group--compact';
    return `<div class="technical-capability-group ${className}${paginationClass}"><h3>${text(group.label)}</h3><ul>${items.map(item => `<li><span class="technical-skill-name">${text(item.name)}</span><span class="technical-skill-classification">${text(item.classification)}</span></li>`).join('')}</ul></div>`;
};
export function technicalProfileMarkup(document) {
    const coreAndWorking = new Set(['Core capability', 'Practical working capability']);
    const exposureAndResearch = new Set(['Technical exposure', 'Research and experimentation']);
    return `<article class="technical-profile-document" data-theme="${text(document.theme)}" aria-labelledby="technical-profile-name">
    <header class="technical-profile-header">
      <p class="technical-document-kicker">TECHNICAL CAREER PROFILE</p>
      <h1 id="technical-profile-name">${text(document.contact.name)}</h1>
      <p class="technical-target-title">${text(document.positioning.primary)}</p>
      <p class="technical-secondary-positioning">${text(document.positioning.secondary)}</p>
    </header>
    <address class="technical-contact" aria-label="Public contact information">
      ${contactLocation(document.contact.location)}
      ${contactLine('Phone', document.contact.phone)}
      ${contactLine('Email', document.contact.email)}
    </address>
    <section aria-labelledby="technical-profile-heading"><h2 id="technical-profile-heading">Professional Profile</h2><p>${editableText('summary', 'Professional profile', document.summary, TECHNICAL_MAX_SUMMARY_LENGTH, 'technical-profile-editable')}</p></section>
    <section aria-labelledby="technical-focus-heading"><h2 id="technical-focus-heading">Current Engineering Focus</h2><div class="technical-focus-list">${document.currentFocus.map(item => `<article class="technical-focus-item" data-focus-id="${text(item.id)}"><h3>${text(item.label)}</h3><p>${editableText(`currentFocus.${item.id}.statement`, `${item.label} focus statement`, item.statement, TECHNICAL_MAX_FOCUS_LENGTH, 'technical-profile-editable')}</p></article>`).join('')}</div></section>
    <section aria-labelledby="technical-career-heading"><h2 id="technical-career-heading">Career Progression</h2>${document.experience.map(experienceMarkup).join('')}</section>
    <section aria-labelledby="technical-capabilities-heading"><h2 id="technical-capabilities-heading">Technical Capabilities</h2>${document.capabilityGroups.map(group => capabilityGroupMarkup(group, coreAndWorking, 'technical-core-capability')).join('')}</section>
    <section aria-labelledby="technical-systems-heading"><h2 id="technical-systems-heading">Selected Systems and Engineering Work</h2>${document.projects.map(projectMarkup).join('')}</section>
    <section aria-labelledby="technical-exposure-heading"><h2 id="technical-exposure-heading">Diagnostic, Defensive and Research Exposure</h2>${document.capabilityGroups.map(group => capabilityGroupMarkup(group, exposureAndResearch, 'technical-exposure-capability')).join('')}${document.additionalTechnicalExposure.length ? `<ul>${document.additionalTechnicalExposure.map(item => `<li><span class="technical-skill-name">${text(item)}</span><span class="technical-skill-classification">Technical exposure</span></li>`).join('')}</ul>` : ''}</section>
    <section aria-labelledby="technical-development-heading"><h2 id="technical-development-heading">Current Professional Development</h2><ul>${document.professionalDevelopment.map((item, index) => `<li>${editableText(`professionalDevelopment.${index}`, `Professional development statement ${index + 1}`, item, TECHNICAL_MAX_DEVELOPMENT_LENGTH, 'technical-profile-editable')}</li>`).join('')}</ul></section>
    <section aria-labelledby="technical-education-heading"><h2 id="technical-education-heading">Education</h2><p><strong>${text(document.education.institution)}</strong><br>${text(document.education.qualification)} · ${text(document.education.completed)}</p></section>
    <section aria-labelledby="technical-languages-heading"><h2 id="technical-languages-heading">Languages</h2><ul>${document.languages.map(item => `<li>${text(item)}</li>`).join('')}</ul></section>
    <section aria-labelledby="technical-links-heading"><h2 id="technical-links-heading">Portfolio and Public Links</h2><ul class="technical-public-links"><li>${contactLine('Portfolio', document.contact.portfolio)}</li><li>${contactLine('GitHub', document.contact.github)}</li><li>${contactLine('LinkedIn', document.contact.linkedin)}</li></ul></section>
  </article>`;
}
const fieldValue = (document, fieldId) => {
    if (fieldId === 'summary')
        return { value: document.summary, maxLength: TECHNICAL_MAX_SUMMARY_LENGTH };
    const focusMatch = /^currentFocus\.([^\.]+)\.statement$/.exec(fieldId);
    if (focusMatch) {
        const item = document.currentFocus.find(candidate => candidate.id === focusMatch[1]);
        return item ? { value: item.statement, maxLength: TECHNICAL_MAX_FOCUS_LENGTH } : null;
    }
    const experienceMatch = /^experience\.([^\.]+)\.(summary|bullet)\.(\d+)$/.exec(fieldId);
    if (experienceMatch) {
        const item = document.experience.find(candidate => candidate.id === experienceMatch[1]);
        if (!item)
            return null;
        if (experienceMatch[2] === 'summary')
            return { value: item.summary, maxLength: TECHNICAL_MAX_EXPERIENCE_SUMMARY_LENGTH };
        const bullet = item.bullets[Number(experienceMatch[3])];
        return typeof bullet === 'string' ? { value: bullet, maxLength: TECHNICAL_MAX_BULLET_LENGTH } : null;
    }
    const projectMatch = /^projects\.([^\.]+)\.description$/.exec(fieldId);
    if (projectMatch) {
        const item = document.projects.find(candidate => candidate.id === projectMatch[1]);
        return item ? { value: item.description, maxLength: TECHNICAL_MAX_PROJECT_DESCRIPTION_LENGTH } : null;
    }
    const developmentMatch = /^professionalDevelopment\.(\d+)$/.exec(fieldId);
    if (developmentMatch) {
        const item = document.professionalDevelopment[Number(developmentMatch[1])];
        return typeof item === 'string' ? { value: item, maxLength: TECHNICAL_MAX_DEVELOPMENT_LENGTH } : null;
    }
    return null;
};
export class TechnicalProfileRenderer {
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
    overflowReport = { overflowing: true, articleWidth: 0, articleClientWidth: 0, bodyOverflow: true, sections: [] };
    constructor(root, canonical, options = {}) {
        this.root = root;
        this.initialDocument = cloneTechnicalProfileDocument(canonical);
        this.draftStore = options.draftStore ?? new TechnicalProfileDraftStore();
        this.onDraftState = options.onDraftState;
        this.onOverflow = options.onOverflow;
        this.themePreferenceStore = new ThemePreferenceStore();
        this.customAccent = this.themePreferenceStore.load('technical-profile');
        const restored = this.draftStore.load(canonical);
        this.document = applyTechnicalProfileDraft(canonical, restored.payload);
        this.root.id = 'technical-profile-frame';
        this.root.className = 'technical-profile-frame';
        document.body.classList.add('technical-profile-active');
        document.documentElement.classList.add('technical-profile-active');
        this.onDraftState?.(restored.state === 'local');
        this.root.addEventListener('input', this.handleInput);
        window.addEventListener('resize', this.scheduleOverflow, { passive: true });
        this.render();
    }
    render() {
        this.root.innerHTML = technicalProfileMarkup(this.document);
        if (this.customAccent) {
            this.root.dataset.customAccent = 'true';
            this.root.style.setProperty('--document-accent', this.customAccent);
        }
        else {
            delete this.root.dataset.customAccent;
            this.root.style.removeProperty('--document-accent');
        }
        this.scheduleOverflow();
        this.notify();
    }
    notify() { for (const listener of this.listeners)
        listener(this.getDocument()); }
    scheduleOverflow = () => {
        window.cancelAnimationFrame(this.overflowTimer);
        this.overflowTimer = window.requestAnimationFrame(() => {
            const report = measureTechnicalProfileOverflow(this.root);
            this.overflowReport = report;
            setOverflowStatus({ overflowing: report.overflowing, message: report.overflowing ? 'HORIZONTAL OVERFLOW / PRINT DISABLED' : 'TECHNICAL PROFILE FLOW / NO HORIZONTAL OVERFLOW', title: report.sections.join(', ') });
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
                const focusMatch = /^currentFocus\.([^\.]+)\.statement$/.exec(fieldId);
                const experienceMatch = /^experience\.([^\.]+)\.(summary|bullet)\.(\d+)$/.exec(fieldId);
                const projectMatch = /^projects\.([^\.]+)\.description$/.exec(fieldId);
                const developmentMatch = /^professionalDevelopment\.(\d+)$/.exec(fieldId);
                if (focusMatch) {
                    const item = this.document.currentFocus.find(candidate => candidate.id === focusMatch[1]);
                    if (!item)
                        return;
                    item.statement = value;
                }
                else if (experienceMatch) {
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
                else if (developmentMatch)
                    this.document.professionalDevelopment[Number(developmentMatch[1])] = value;
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
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    getDocument() { return cloneTechnicalProfileDocument(this.document); }
    getTheme() { return this.document.theme; }
    setTheme(theme) {
        if (!['blue', 'gold', 'red'].includes(theme))
            return;
        this.document.theme = theme;
        this.customAccent = null;
        this.themePreferenceStore.reset('technical-profile');
        this.render();
    }
    getAccent() { return this.customAccent ? { mode: 'custom', hex: this.customAccent } : { mode: 'theme', hex: '' }; }
    setCustomAccent(hex) {
        if (!/^#[0-9a-f]{6}$/i.test(hex))
            throw new Error('Accent must be a six-digit HEX color');
        this.customAccent = hex.toUpperCase();
        this.themePreferenceStore.save('technical-profile', this.customAccent);
        this.render();
    }
    resetCustomAccent() {
        if (!this.customAccent)
            return;
        this.customAccent = null;
        this.themePreferenceStore.reset('technical-profile');
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
    saveDraft() {
        try {
            const saved = this.draftStore.save(canonicalTechnicalProfileDraft(this.document));
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
    reset() {
        window.clearTimeout(this.saveTimer);
        this.draftStore.reset();
        const theme = this.document.theme;
        this.document = cloneTechnicalProfileDocument(this.initialDocument);
        this.document.theme = theme;
        setDraftStatus('RESET TO PROJECTED CONTENT');
        this.onDraftState?.(false);
        this.render();
    }
    exportJSON() { this.draftStore.export(canonicalTechnicalProfileDraft(this.document)); }
    importJSON(json) {
        const payload = this.draftStore.import(json);
        const theme = this.document.theme;
        this.document = applyTechnicalProfileDraft(this.initialDocument, payload);
        this.document.theme = theme;
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
        document.body.classList.remove('technical-profile-active');
        document.documentElement.classList.remove('technical-profile-active');
        this.listeners.clear();
    }
}
