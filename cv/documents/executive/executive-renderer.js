import { editableText, escapeEditableText, normaliseEditableText } from '../../components/editable-text.js';
import { setDraftStatus } from '../../components/document-draft-status.js';
import { setOverflowStatus } from '../../components/document-overflow-status.js';
import { legendSystemsMark } from '../../components/legend-systems-mark.js';
import { ThemePreferenceStore } from '../../app/theme-preference-store.js';
import { printDocument } from '../../app/print-preference.js';
import { officialTechnologyMarkAssetPath, technologyMarkNames } from '../../content/page-one-model.js';
import { resolveAssetUrl } from '../../utils/asset-url.js';
import { applyExecutiveDraft, canonicalExecutiveDraft, cloneExecutiveDocument, isTheme } from './executive-model.js';
import { ExecutiveDraftStore, EXECUTIVE_MAX_BULLET_LENGTH, EXECUTIVE_MAX_EXPERIENCE_SUMMARY_LENGTH, EXECUTIVE_MAX_SUMMARY_LENGTH, EXECUTIVE_MAX_SYSTEM_DESCRIPTION_LENGTH } from './executive-draft.js';
import { measureExecutiveOverflow } from './executive-overflow.js';
const text = escapeEditableText;
const officialMark = (name, className = '') => `<img class="official-tech-mark ${className}" src="${text(resolveAssetUrl(officialTechnologyMarkAssetPath(name)))}" alt="" aria-hidden="true" loading="eager">`;
const technologyMarks = (name) => technologyMarkNames(name).map(mark => officialMark(mark, `official-tech-mark--${mark}`)).join('');
const contactLink = (label, item) => `<a${label === 'GitHub' ? ' aria-label="GitHub profile link"' : ''} href="${text(item.href)}">${label === 'GitHub' ? officialMark('github', 'official-link-mark') : ''}${text(label)}<span>${text(item.display)}</span></a>`;
const brandMark = () => legendSystemsMark('executive-brand-mark', true);
const experienceCard = (item) => {
    const classes = [
        'executive-experience-card',
        item.id === 'btc' ? 'executive-experience-card--primary' : '',
        item.id === 'legend-investigations' ? 'executive-experience-card--engagement' : '',
        item.concurrent ? 'executive-experience-card--concurrent' : '',
        ['monster-signs', 'signland-margate'].includes(item.id) ? 'executive-experience-card--earlier' : ''
    ].filter(Boolean).join(' ');
    return `<article class="${classes}" data-experience-id="${text(item.id)}">
  <header><div><p class="executive-eyebrow">${text(item.specialisation)}</p><h3>${text(item.role)}</h3><p class="executive-organisation">${text(item.organisation)}</p></div><div class="executive-period"><strong>${text(item.period)}</strong>${item.location ? `<span>${text(item.location)}</span>` : ''}</div></header>
  <p>${editableText(`experience.${item.id}.summary`, `${item.role} summary`, item.summary, EXECUTIVE_MAX_EXPERIENCE_SUMMARY_LENGTH, 'executive-editable')}</p>
  ${item.bullets.length ? `<ul>${item.bullets.map((bullet, index) => `<li>${editableText(`experience.${item.id}.bullet.${index}`, `${item.role} responsibility ${index + 1}`, bullet, EXECUTIVE_MAX_BULLET_LENGTH, 'executive-editable')}</li>`).join('')}</ul>` : ''}
</article>`;
};
const systemCard = (item) => `<article class="executive-system-card" data-system-id="${text(item.id)}"><h3>${text(item.name)}</h3><p>${editableText(`systems.${item.id}.description`, `${item.name} description`, item.description, EXECUTIVE_MAX_SYSTEM_DESCRIPTION_LENGTH, 'executive-editable')}</p><ul class="executive-tech-list">${item.technologies.map(technology => `<li>${text(technology)}</li>`).join('')}</ul></article>`;
export function executiveMarkup(document) {
    const contact = document.contact;
    return `<div class="executive-document" data-theme="${text(document.theme)}">
    <section class="executive-page executive-page--one" id="executive-page-one" aria-label="Executive CV page one">
      <div class="executive-art" aria-hidden="true"></div>
      <header class="executive-masthead">
        <div class="executive-identity">${brandMark()}<p class="executive-kicker">${text(document.positioning.secondary)}</p><h1>${text(contact.name)}</h1><p class="executive-primary">${text(document.positioning.primary)}</p><p class="executive-location">${text(contact.location)}</p></div>
        <img class="executive-portrait" src="${text(document.portrait)}" alt="Portrait of Dean Kruger">
      </header>
      <address class="executive-contact" aria-label="Public contact details">
        ${contactLink('Phone', contact.phone)}${contactLink('Email', contact.email)}${contactLink('Portfolio', contact.portfolio)}${contactLink('GitHub', contact.github)}${contactLink('LinkedIn', contact.linkedin)}
      </address>
      <div class="executive-rule"></div>
      <section class="executive-summary-block" aria-labelledby="executive-summary-title"><div class="executive-section-heading"><p class="executive-eyebrow">01 / PROFILE</p><h2 id="executive-summary-title">Executive Summary</h2></div><p class="executive-summary-copy">${editableText('summary', 'Executive summary', document.summary, EXECUTIVE_MAX_SUMMARY_LENGTH, 'executive-editable')}</p></section>
      <section class="executive-capabilities" aria-labelledby="executive-capabilities-title"><div class="executive-section-heading"><p class="executive-eyebrow">02 / CAPABILITY</p><h2 id="executive-capabilities-title">Systems at a glance</h2></div><ul>${document.capabilities.map(capability => `<li>${text(capability)}</li>`).join('')}</ul></section>
      <section class="executive-experience-section executive-page-one-experience" aria-labelledby="executive-page-one-experience-title"><div class="executive-section-heading"><p class="executive-eyebrow">03 / SELECTED EXPERIENCE</p><h2 id="executive-page-one-experience-title">Current and recent systems work</h2></div><div class="executive-experience-grid">${document.experience.slice(0, 3).map(experienceCard).join('')}</div></section>
      <p class="executive-page-marker">LEGEND SYSTEMS / EXECUTIVE CV <span>01</span></p>
    </section>
    <section class="executive-page executive-page--two" id="executive-page-two" aria-label="Executive CV page two">
      <div class="executive-art" aria-hidden="true"></div>
      <header class="executive-page-heading"><div><p class="executive-kicker">${text(document.positioning.primary)}</p><h2>Experience &amp; systems</h2></div><span class="executive-page-number">02</span></header>
      <section class="executive-experience-section" aria-labelledby="executive-continuity-title"><div class="executive-section-heading"><p class="executive-eyebrow">04 / CONTINUITY</p><h2 id="executive-continuity-title">Concurrent and foundational work</h2></div><div class="executive-experience-grid executive-experience-grid--page-two">${document.experience.slice(3).map(experienceCard).join('')}</div></section>
      <section class="executive-systems-section" aria-labelledby="executive-systems-title"><div class="executive-section-heading"><p class="executive-eyebrow">05 / SELECTED SYSTEMS</p><h2 id="executive-systems-title">Applied engineering systems</h2></div><div class="executive-system-grid">${document.systems.slice(0, 3).map(systemCard).join('')}</div></section>
      <div class="executive-two-column"><section aria-labelledby="executive-skills-title"><div class="executive-section-heading"><p class="executive-eyebrow">06 / FOCUS</p><h2 id="executive-skills-title">Focused technologies</h2></div><ul class="executive-skills-list">${document.skills.map(skill => `<li><span class="executive-skill-label"><span class="executive-skill-mark-set">${technologyMarks(skill.name)}</span><span class="executive-skill-name">${text(skill.name)}${skill.name === 'Python' ? '<sup class="trademark-symbol" aria-hidden="true">™</sup>' : ''}</span></span><small>${text(skill.classification)}</small></li>`).join('')}</ul></section><section aria-labelledby="executive-education-title"><div class="executive-section-heading"><p class="executive-eyebrow">07 / FOUNDATION</p><h2 id="executive-education-title">Education &amp; languages</h2></div><div class="executive-education"><strong>${text(document.education.qualification)}</strong><span>${text(document.education.institution)} · ${text(document.education.completed)}</span><strong>Languages</strong><span>${document.languages.map(text).join(' · ')}</span></div></section></div>
      <footer class="executive-footer"><span>LEGEND SYSTEMS / PUBLIC EXECUTIVE CV</span><nav aria-label="Compact public links">${contactLink('Portfolio', contact.portfolio)}${contactLink('GitHub', contact.github)}${contactLink('LinkedIn', contact.linkedin)}</nav></footer>
    </section>
  </div>`;
}
const fieldValue = (document, fieldId) => {
    if (fieldId === 'summary')
        return { value: document.summary, maxLength: EXECUTIVE_MAX_SUMMARY_LENGTH };
    const experienceMatch = /^experience\.([^\.]+)\.(summary|bullet)\.(\d+)$/.exec(fieldId);
    if (experienceMatch) {
        const item = document.experience.find(candidate => candidate.id === experienceMatch[1]);
        if (!item)
            return null;
        if (experienceMatch[2] === 'summary')
            return { value: item.summary, maxLength: EXECUTIVE_MAX_EXPERIENCE_SUMMARY_LENGTH };
        const bullet = item.bullets[Number(experienceMatch[3])];
        return typeof bullet === 'string' ? { value: bullet, maxLength: EXECUTIVE_MAX_BULLET_LENGTH } : null;
    }
    const systemMatch = /^systems\.([^\.]+)\.description$/.exec(fieldId);
    if (systemMatch) {
        const item = document.systems.find(candidate => candidate.id === systemMatch[1]);
        return item ? { value: item.description, maxLength: EXECUTIVE_MAX_SYSTEM_DESCRIPTION_LENGTH } : null;
    }
    return null;
};
export class ExecutiveRenderer {
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
    overflowReport = { overflowing: false, pages: [] };
    constructor(root, canonical, options = {}) {
        this.root = root;
        this.initialDocument = cloneExecutiveDocument(canonical);
        this.draftStore = options.draftStore ?? new ExecutiveDraftStore();
        this.onDraftState = options.onDraftState;
        this.onOverflow = options.onOverflow;
        this.themePreferenceStore = new ThemePreferenceStore();
        this.customAccent = this.themePreferenceStore.load('executive');
        const restored = this.draftStore.load(canonical);
        this.document = applyExecutiveDraft(canonical, restored.payload);
        this.root.id = 'executive-frame';
        this.root.className = 'executive-frame';
        document.body.classList.add('executive-active');
        this.onDraftState?.(restored.state === 'local');
        this.root.addEventListener('input', this.handleInput);
        window.addEventListener('resize', this.scheduleOverflow, { passive: true });
        this.render();
    }
    render() {
        this.root.innerHTML = executiveMarkup(this.document);
        this.root.dataset.theme = this.document.theme;
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
            const report = measureExecutiveOverflow(this.root);
            this.overflowReport = report;
            setOverflowStatus({ overflowing: report.overflowing, message: report.overflowing ? `OVERFLOW / ${report.pages.filter(page => page.reasons.length).length} PAGE CHECK` : 'A4 TWO-PAGE / NO OVERFLOW', title: report.pages.flatMap(page => page.reasons.map(reason => `${page.id}: ${reason}`)).join(', ') });
            this.onOverflow?.(report);
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
                const systemMatch = /^systems\.([^\.]+)\.description$/.exec(fieldId);
                if (experienceMatch) {
                    const item = this.document.experience.find(candidate => candidate.id === experienceMatch[1]);
                    if (!item)
                        return;
                    if (experienceMatch[2] === 'summary')
                        item.summary = value;
                    else
                        item.bullets[Number(experienceMatch[3])] = value;
                }
                else if (systemMatch) {
                    const item = this.document.systems.find(candidate => candidate.id === systemMatch[1]);
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
        const saved = this.draftStore.save(canonicalExecutiveDraft(this.document));
        setDraftStatus(saved ? 'SAVED LOCALLY' : 'LOCAL STORAGE UNAVAILABLE');
        if (saved)
            this.onDraftState?.(true);
        return saved;
    }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    getDocument() { return cloneExecutiveDocument(this.document); }
    getTheme() { return this.document.theme; }
    setTheme(theme) {
        if (!isTheme(theme) || this.document.theme === theme)
            return;
        this.document.theme = theme;
        this.customAccent = null;
        this.themePreferenceStore.reset('executive');
        this.queueSave();
        this.render();
    }
    getAccent() { return this.customAccent ? { mode: 'custom', hex: this.customAccent } : { mode: 'theme', hex: '' }; }
    setCustomAccent(hex) {
        if (!/^#[0-9a-f]{6}$/i.test(hex))
            throw new Error('Accent must be a six-digit HEX color');
        this.customAccent = hex.toUpperCase();
        this.themePreferenceStore.save('executive', this.customAccent);
        this.render();
    }
    resetCustomAccent() {
        if (!this.customAccent)
            return;
        this.customAccent = null;
        this.themePreferenceStore.reset('executive');
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
        this.document = cloneExecutiveDocument(this.initialDocument);
        setDraftStatus('RESET TO PROJECTED CONTENT');
        this.onDraftState?.(false);
        this.render();
    }
    exportJSON() { this.draftStore.export(canonicalExecutiveDraft(this.document)); }
    importJSON(json) {
        const payload = this.draftStore.import(json);
        this.document = applyExecutiveDraft(this.initialDocument, payload);
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
        document.body.classList.remove('executive-active');
        this.listeners.clear();
    }
}
