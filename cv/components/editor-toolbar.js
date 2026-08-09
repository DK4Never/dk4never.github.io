import { PACKAGED_ICON_NAMES } from '../utils/asset-url.js';
import { registryEntry } from '../app/document-registry.js';
import { validateCustomIconData } from '../utils/custom-icon.js';
import { getPrintMode, setPrintMode } from '../app/print-preference.js';
const escapeText = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const normalizePickerSearch = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
const fieldInput = (label, field, value, type = 'text') => `<label class="builder-field"><span>${label}</span><input type="${type}" data-field="${field}" value="${escapeText(value)}"></label>`;
const textareaInput = (label, field, value) => `<label class="builder-field builder-field-wide"><span>${label}</span><textarea rows="2" data-field="${field}">${escapeText(value)}</textarea></label>`;
const HEX = /^#[0-9a-f]{6}$/i;
const customAccentForTheme = (theme) => theme === 'red' ? '#E32020' : theme === 'gold' ? '#D6A43A' : '#5DBBFF';
const textForContrast = (hex) => {
    const values = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255).map(value => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    const luminance = .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
    const ratio = (Math.max(luminance, .004) + .05) / (Math.min(luminance, .004) + .05);
    return ratio < 3 ? 'Low contrast against CV background' : '';
};
export class EditorToolbar {
    page;
    executive = null;
    ats = null;
    technicalProfile = null;
    mode = 'unavailable';
    unsubscribe = null;
    onThemeChange;
    frame;
    pageCanvas;
    stage;
    zoomReadout;
    builder;
    scale = 1;
    iconManifest = [];
    iconManifestLoaded = false;
    iconPickerIndex = null;
    iconPickerSelection = null;
    mobileViewport = false;
    constructor(page, options = {}) {
        this.page = page;
        this.onThemeChange = options.onThemeChange;
        this.frame = document.querySelector('#page-frame');
        this.pageCanvas = this.frame?.querySelector('.cv-page') ?? null;
        this.stage = document.querySelector('.canvas-stage');
        this.zoomReadout = document.querySelector('#zoom-readout');
        this.builder = document.querySelector('#builder-content');
        this.bind();
        this.restoreSidebarState();
        this.syncPrintMode();
        this.setPage(page);
        this.applyRequestedTheme();
        this.fit();
    }
    setPage(page) {
        this.unsubscribe?.();
        this.executive = null;
        this.ats = null;
        this.technicalProfile = null;
        this.page = page;
        this.mode = page ? 'page-one' : 'unavailable';
        this.refreshCanvasElements();
        this.unsubscribe = page?.subscribe(() => {
            const activePage = this.page;
            if (!activePage)
                return;
            this.syncThemeButtons(activePage.getDocument().theme);
            this.renderBuilder();
            this.syncPageControls();
        }) ?? null;
        this.setControlsEnabled(Boolean(page));
        this.renderBuilder();
        this.syncThemeButtons(page ? page.getDocument().theme : null);
        this.syncPageControls();
        this.syncActionLabels();
        if (page)
            this.fit();
    }
    setExecutive(executive) {
        this.unsubscribe?.();
        this.page = null;
        this.ats = null;
        this.technicalProfile = null;
        this.executive = executive;
        this.mode = executive ? 'executive' : 'unavailable';
        this.refreshCanvasElements();
        this.unsubscribe = executive?.subscribe(() => {
            if (!this.executive)
                return;
            this.syncThemeButtons(this.executive.getTheme());
            this.syncExecutiveControls();
            this.renderBuilder();
        }) ?? null;
        this.setControlsEnabled(Boolean(executive));
        this.renderBuilder();
        this.syncActionLabels();
        this.syncThemeButtons(executive ? executive.getTheme() : null);
        if (executive)
            this.fit();
    }
    setAts(ats) {
        this.unsubscribe?.();
        this.page = null;
        this.executive = null;
        this.technicalProfile = null;
        this.ats = ats;
        this.mode = ats ? 'ats' : 'unavailable';
        this.refreshCanvasElements();
        this.unsubscribe = ats?.subscribe(() => {
            if (!this.ats)
                return;
            this.syncAtsControls();
            this.syncThemeButtons(this.ats.getTheme());
            this.renderBuilder();
        }) ?? null;
        this.setControlsEnabled(Boolean(ats));
        this.renderBuilder();
        this.syncActionLabels();
        this.syncThemeButtons(null);
        if (ats)
            this.fit();
    }
    setTechnicalProfile(technicalProfile) {
        this.unsubscribe?.();
        this.page = null;
        this.executive = null;
        this.ats = null;
        this.technicalProfile = technicalProfile;
        this.mode = technicalProfile ? 'technical-profile' : 'unavailable';
        this.refreshCanvasElements();
        this.unsubscribe = technicalProfile?.subscribe(() => {
            if (!this.technicalProfile)
                return;
            this.syncThemeButtons(this.technicalProfile.getTheme());
            this.syncTechnicalProfileControls();
            this.renderBuilder();
        }) ?? null;
        this.setControlsEnabled(Boolean(technicalProfile));
        this.renderBuilder();
        this.syncActionLabels();
        this.syncThemeButtons(technicalProfile ? technicalProfile.getTheme() : null);
        if (technicalProfile)
            this.fit();
    }
    refreshCanvasElements() {
        this.frame = document.querySelector('#page-frame, #executive-frame, #ats-frame, #technical-profile-frame');
        this.pageCanvas = this.frame?.querySelector('.cv-page, .executive-document, .ats-document, .technical-profile-document') ?? null;
    }
    bind() {
        document.querySelectorAll('.theme-button[data-theme]').forEach(button => button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            if ((this.page || this.executive || this.ats || this.technicalProfile) && (theme === 'blue' || theme === 'gold' || theme === 'red')) {
                this.page?.setTheme(theme);
                this.executive?.setTheme(theme);
                this.ats?.setTheme(theme);
                this.technicalProfile?.setTheme(theme);
                this.onThemeChange?.(theme);
            }
        }));
        document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => this.handleAction(button.dataset.action)));
        document.querySelector('#print-mode')?.addEventListener('change', event => {
            const value = event.target.value;
            setPrintMode(value === 'printer' ? 'printer' : 'match');
        });
        document.querySelector('#json-input')?.addEventListener('change', event => this.importFile(event));
        this.builder?.addEventListener('input', event => this.handleBuilderInput(event));
        this.builder?.addEventListener('change', event => this.handleBuilderInput(event));
        this.builder?.addEventListener('change', event => this.handleBuilderChange(event));
        this.builder?.addEventListener('click', event => this.handleBuilderClick(event));
        this.builder?.addEventListener('keydown', event => this.handleBuilderKeydown(event));
        window.addEventListener('resize', () => {
            const workspace = document.querySelector('.workspace');
            const mobile = window.matchMedia('(max-width: 1100px)').matches;
            if (workspace && mobile !== this.mobileViewport) {
                if (mobile) {
                    workspace.classList.remove('sidebar-collapsed');
                    workspace.classList.add('editor-open');
                }
                else {
                    workspace.classList.remove('editor-open');
                    let collapsed = false;
                    try {
                        collapsed = window.localStorage.getItem('legend-systems-cv:editor-sidebar') === 'collapsed';
                    }
                    catch { /* storage is optional */ }
                    workspace.classList.toggle('sidebar-collapsed', collapsed);
                }
                this.mobileViewport = mobile;
            }
            this.fit();
            this.syncSidebarState();
        }, { passive: true });
    }
    applyRequestedTheme() {
        const requestedTheme = new URLSearchParams(window.location.search).get('theme');
        if (this.page && (requestedTheme === 'blue' || requestedTheme === 'gold' || requestedTheme === 'red'))
            this.page.setTheme(requestedTheme);
    }
    handleAction(action) {
        if (action === 'fit')
            this.fit();
        if (action === 'zoom-75')
            this.setScale(.75);
        if (action === 'zoom-100')
            this.setScale(1);
        if (action === 'zoom-125')
            this.setScale(1.25);
        if (action === 'zoom-in')
            this.setScale(this.scale + .05);
        if (action === 'zoom-out')
            this.setScale(this.scale - .05);
        if (action === 'zoom-reset')
            this.setScale(1);
        if (action === 'toggle-sidebar') {
            this.toggleSidebar();
            return;
        }
        if (this.executive) {
            if (action === 'print')
                this.executive.print();
            if (action === 'save')
                this.executive.saveDraft();
            if (action === 'reset')
                this.executive.reset();
            if (action === 'export-json')
                this.executive.exportJSON();
            if (action === 'import-json')
                document.querySelector('#json-input')?.click();
            return;
        }
        if (this.ats) {
            if (action === 'print')
                this.ats.print();
            if (action === 'save')
                this.ats.saveDraft();
            if (action === 'reset')
                this.ats.reset();
            if (action === 'export-json')
                this.ats.exportJSON();
            if (action === 'import-json')
                document.querySelector('#json-input')?.click();
            return;
        }
        if (this.technicalProfile) {
            if (action === 'print')
                this.technicalProfile.print();
            if (action === 'save')
                this.technicalProfile.saveDraft();
            if (action === 'reset')
                this.technicalProfile.reset();
            if (action === 'export-json')
                this.technicalProfile.exportJSON();
            if (action === 'import-json')
                document.querySelector('#json-input')?.click();
            return;
        }
        if (!this.page)
            return;
        if (action === 'print')
            this.page.print();
        if (action === 'save')
            this.page.saveDraft();
        if (action === 'reset')
            this.page.reset();
        if (action === 'undo')
            this.page.undo();
        if (action === 'redo')
            this.page.redo();
        if (action === 'export-json')
            this.page.exportJSON();
        if (action === 'import-json')
            document.querySelector('#json-input')?.click();
    }
    async importFile(event) {
        const input = event.target;
        const file = input.files?.[0];
        if (!file || (!this.page && !this.executive && !this.ats && !this.technicalProfile))
            return;
        try {
            const json = await file.text();
            if (this.executive)
                this.executive.importJSON(json);
            else if (this.ats)
                this.ats.importJSON(json);
            else if (this.technicalProfile)
                this.technicalProfile.importJSON(json);
            else
                this.page?.importJSON(json);
        }
        catch {
            document.querySelector('#save-status')?.replaceChildren(document.createTextNode('IMPORT REJECTED'));
        }
        input.value = '';
    }
    handleBuilderInput(event) {
        const target = event.target;
        const themeTarget = this.currentThemeTarget();
        if (target?.matches('[data-accent-input="color"]')) {
            const hex = target.value.toUpperCase();
            const input = this.builder?.querySelector('[data-accent-input="hex"]');
            if (input)
                input.value = hex;
            this.syncAccentPreview(hex);
            return;
        }
        if (target?.matches('[data-accent-input="hex"]')) {
            this.syncAccentPreview(target.value.toUpperCase());
            return;
        }
        if (!this.page)
            return;
        if (target?.matches('[data-icon-search]')) {
            this.renderIconPicker(target.value, this.builder?.querySelector('[data-category].is-active')?.dataset.category ?? 'all');
            return;
        }
        const field = target?.dataset.field;
        if (!field || target.type === 'file')
            return;
        if (target.type === 'checkbox') {
            this.page.updateField(field, String(target.checked), true);
        }
        else {
            this.page.updateField(field, target.value, false);
            target.closest('.builder-field')?.querySelector('output')?.replaceChildren(document.createTextNode(target.value));
            if (event.type === 'change')
                this.page.commitField(field);
        }
    }
    handleBuilderChange(event) {
        const target = event.target;
        if (target?.matches('[data-icon-upload]'))
            void this.readCustomIcon(target);
    }
    handleBuilderKeydown(event) {
        const target = event.target;
        if (target?.matches('[data-picker-option]') && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            const id = target.dataset.pickerOption;
            this.iconPickerSelection = this.iconManifest.find(icon => icon.id === id) ?? null;
            this.syncPickerSelection();
        }
        if (event.key === 'Escape')
            this.closeIconPicker();
    }
    handleBuilderClick(event) {
        const target = event.target;
        const pickerOption = target?.closest('[data-picker-option]');
        if (pickerOption) {
            const id = pickerOption.dataset.pickerOption;
            this.iconPickerSelection = this.iconManifest.find(icon => icon.id === id) ?? null;
            this.syncPickerSelection();
            return;
        }
        const globalAction = target?.closest('[data-action]')?.dataset.action;
        if (globalAction) {
            this.handleAction(globalAction);
            return;
        }
        const action = target?.closest('[data-builder-action]')?.dataset.builderAction;
        if (!action)
            return;
        const index = Number(target.closest('[data-index]')?.dataset.index ?? -1);
        const themeTarget = this.currentThemeTarget();
        if (action === 'theme-preset' && themeTarget) {
            const theme = target.closest('[data-theme]')?.dataset.theme;
            if (theme === 'blue' || theme === 'gold' || theme === 'red')
                themeTarget.setTheme(theme);
            return;
        }
        if (action === 'custom-accent-focus') {
            const input = this.builder?.querySelector('[data-accent-input="hex"]');
            input?.focus();
            input?.select();
            return;
        }
        if (action === 'accent-apply' && themeTarget) {
            this.applyAccentFromControls();
            return;
        }
        if (action === 'accent-reset' && themeTarget) {
            themeTarget.resetCustomAccent();
            return;
        }
        if (action === 'theme-reset' && this.page) {
            this.page.resetCustomAccent();
            return;
        }
        if (action === 'icon-picker-open' && this.page && index >= 0) {
            void this.openIconPicker(index);
            return;
        }
        if (action === 'icon-picker-apply' && this.page) {
            this.applyPickerSelection();
            return;
        }
        if (action === 'icon-picker-cancel') {
            this.closeIconPicker();
            return;
        }
        if (action === 'icon-picker-category') {
            this.filterIconPicker(target.closest('[data-category]')?.dataset.category ?? 'all');
            return;
        }
        if (action === 'technology-icon-reset' && this.page && index >= 0) {
            this.page.updateDocument(document => { const item = document.technology.items[index]; if (!item)
                return; delete item.iconMode; delete item.iconRef; delete item.customIconData; });
            return;
        }
        if (action === 'technology-move-up' && this.page && index > 0) {
            this.page.updateDocument(document => { [document.technology.items[index - 1], document.technology.items[index]] = [document.technology.items[index], document.technology.items[index - 1]]; });
            return;
        }
        if (action === 'technology-move-down' && this.page && index >= 0) {
            this.page.updateDocument(document => { if (index >= document.technology.items.length - 1)
                return; [document.technology.items[index], document.technology.items[index + 1]] = [document.technology.items[index + 1], document.technology.items[index]]; });
            return;
        }
        if (action === 'technology-reset' && this.page) {
            this.page.resetTechnologyStack();
            return;
        }
        if (!this.page)
            return;
        if (action === 'portrait-reset')
            this.page.resetPortrait();
        if (action === 'add-skill')
            this.page.updateDocument(document => document.skills.items.push({ name: 'New skill', level: 5 }));
        if (action === 'remove-skill' && index >= 0)
            this.page.updateDocument(document => { document.skills.items.splice(index, 1); });
        if (action === 'add-technology')
            this.page.addTechnology();
        if (action === 'remove-technology' && index >= 0)
            this.page.updateDocument(document => { document.technology.items.splice(index, 1); });
        if (action === 'add-experience')
            this.page.updateDocument(document => document.experience.items.unshift({ job: 'Technical role', company: 'Organisation', location: 'South Africa', period: 'Selected work', description: 'Describe the verified scope of this work.', bullets: ['Verified responsibility'] }));
        if (action === 'remove-experience' && index >= 0)
            this.page.updateDocument(document => { document.experience.items.splice(index, 1); });
        if (action === 'portrait-upload')
            this.builder?.querySelector('#portrait-file')?.click();
        if (action === 'technology-upload' && index >= 0)
            this.builder?.querySelector(`[data-icon-upload][data-index="${index}"]`)?.click();
    }
    syncThemeButtons(theme) {
        document.querySelectorAll('.theme-button[data-theme]').forEach(button => button.classList.toggle('is-active', button.dataset.theme === theme));
    }
    renderBuilder() {
        if (!this.builder)
            return;
        const page = this.page;
        if (this.executive) {
            this.builder.innerHTML = this.themeBuilderMarkup('EXECUTIVE CV', this.executive, 'Edit the highlighted summary, experience and systems text directly on the two A4 pages. Structure and projected facts remain locked.');
            this.syncAccentControls(this.executive.getAccent(), this.executive.getTheme());
            return;
        }
        if (this.ats) {
            this.builder.innerHTML = this.themeBuilderMarkup('ATS CV', this.ats, 'Edit the highlighted summary, experience and project text directly. Identity, chronology, structure and projected skills remain locked.');
            this.syncAccentControls(this.ats.getAccent(), this.ats.getTheme());
            return;
        }
        if (this.technicalProfile) {
            this.builder.innerHTML = this.themeBuilderMarkup('TECHNICAL CAREER PROFILE', this.technicalProfile, 'Edit the highlighted profile, focus, career, project and development text directly. Identity, chronology, capability classifications and structure remain locked.');
            this.syncAccentControls(this.technicalProfile.getAccent(), this.technicalProfile.getTheme());
            return;
        }
        this.builder.closest('.builder-card')?.removeAttribute('aria-hidden');
        if (!page) {
            this.builder.innerHTML = '<div class="builder-status"><strong>DOCUMENT CONTROLS UNAVAILABLE</strong><span>Select Page One to edit or export a draft.</span></div>';
            return;
        }
        const documentModel = page.getDocument();
        this.builder.innerHTML = this.builderMarkup(documentModel);
        this.builder.querySelector('#portrait-file')?.addEventListener('change', event => this.readPortrait(event));
        this.builder.querySelector('[data-builder-action="icon-picker-apply"]')?.addEventListener('click', () => this.applyPickerSelection());
        this.builder.querySelectorAll('[data-field="portrait.x"], [data-field="portrait.y"], [data-field="portrait.scale"]').forEach(input => input.addEventListener('input', () => page.checkOverflow()));
        this.syncAccentControls(page.getAccent(), documentModel.theme);
        const undo = document.querySelector('[data-action="undo"]');
        const redo = document.querySelector('[data-action="redo"]');
        if (undo)
            undo.disabled = !page.canUndo();
        if (redo)
            redo.disabled = !page.canRedo();
    }
    async readPortrait(event) {
        const input = event.target;
        const file = input.files?.[0];
        if (!file || !file.type.startsWith('image/'))
            return;
        if (file.size > 2_500_000) {
            document.querySelector('#save-status')?.replaceChildren(document.createTextNode('PORTRAIT TOO LARGE'));
            return;
        }
        const reader = new FileReader();
        const page = this.page;
        reader.addEventListener('load', () => { if (page && typeof reader.result === 'string')
            page.replacePortrait(reader.result); });
        reader.readAsDataURL(file);
    }
    builderMarkup(documentModel) {
        const sectionLabels = [['contact', 'Contact'], ['profile', 'Profile'], ['skills', 'Skills'], ['technology', 'Technology'], ['summary', 'Summary'], ['experience', 'Experience'], ['systems', 'Systems']];
        const themeButtons = ['red', 'blue', 'gold'].map(theme => `<button class="builder-theme-button${documentModel.theme === theme && documentModel.accent?.mode !== 'custom' ? ' is-active' : ''}" type="button" data-builder-action="theme-preset" data-theme="${theme}"><i></i>${theme === 'red' ? 'Signal Red' : theme === 'gold' ? 'Legend Gold' : 'Legend Blue'}<span class="theme-selected" aria-hidden="true">✓</span></button>`).join('');
        const customThemeButton = `<button class="builder-theme-button${documentModel.accent?.mode === 'custom' ? ' is-active' : ''}" type="button" data-builder-action="custom-accent-focus" data-custom-theme="true"><i></i>Custom<span class="theme-selected" aria-hidden="true">✓</span></button>`;
        const accent = documentModel.accent?.mode === 'custom' ? documentModel.accent.hex : customAccentForTheme(documentModel.theme);
        const technologies = documentModel.technology.items.map((item, index) => {
            const preview = item.iconMode === 'custom' && item.customIconData
                ? `<img src="${escapeText(item.customIconData)}" alt="" aria-hidden="true">`
                : item.iconRef ? `<img src="${escapeText(`icons/${item.iconRef}`)}" alt="" aria-hidden="true">` : `<span>${escapeText(item.icon)}</span>`;
            return `<div class="technology-editor-row builder-entry" data-index="${index}"><div class="builder-entry-heading"><strong>${index + 1}. ${escapeText(item.name)}</strong><button class="builder-icon-button" type="button" data-builder-action="remove-technology" aria-label="Remove technology ${index + 1}">×</button></div>${fieldInput('Label', `technology.items.${index}.name`, item.name)}<div class="technology-icon-actions"><span class="builder-icon-preview">${preview}</span><button class="builder-button" type="button" data-builder-action="icon-picker-open">Choose icon</button><button class="builder-button builder-button-muted" type="button" data-builder-action="technology-upload">Upload icon</button><input type="file" accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp" data-icon-upload data-index="${index}" hidden></div><div class="technology-row-actions"><button class="builder-button builder-button-muted" type="button" data-builder-action="technology-icon-reset">Reset icon</button><button class="builder-button builder-button-muted" type="button" data-builder-action="technology-move-up">Move up</button><button class="builder-button builder-button-muted" type="button" data-builder-action="technology-move-down">Move down</button></div><label class="builder-field"><span>Icon colour mode</span><select data-field="technology.items.${index}.colorMode"><option value="accent" ${item.colorMode !== 'original' ? 'selected' : ''}>Accent</option><option value="original" ${item.colorMode === 'original' ? 'selected' : ''}>Original</option></select></label></div>`;
        }).join('');
        return `<div class="builder-status"><strong>EDITOR CONTROL CENTER</strong><span data-editor-save-state>Local draft · default-safe fields</span></div>
      <details class="builder-group" open><summary>DOCUMENT</summary><div class="builder-checks">${sectionLabels.map(([key, label]) => `<label><input type="checkbox" data-field="sections.${key}" ${documentModel.sections[key] ? 'checked' : ''}>${label}</label>`).join('')}</div></details>
      <details class="builder-group" open><summary>THEME &amp; COLOR</summary><div class="theme-grid">${themeButtons}${customThemeButton}</div><div class="accent-control"><label class="builder-field"><span>Custom accent HEX</span><input id="accent-hex" data-accent-input="hex" value="${escapeText(accent)}" inputmode="text" maxlength="7" autocomplete="off"></label><input id="accent-color-input" data-accent-input="color" type="color" value="${escapeText(accent)}" aria-label="Choose custom accent color"><span id="accent-preview" class="accent-preview" style="background:${escapeText(accent)}"></span><p id="accent-warning" class="builder-warning" role="status" aria-live="polite"></p></div><div class="builder-action-row"><button class="builder-button" type="button" data-builder-action="accent-apply">Apply accent</button><button class="builder-button builder-button-muted" type="button" data-builder-action="accent-reset">Reset to theme</button></div></details>
      <details class="builder-group" open><summary>CONTENT</summary>${fieldInput('Name first', 'masthead.first', documentModel.masthead.first)}${fieldInput('Name last', 'masthead.last', documentModel.masthead.last)}${fieldInput('Primary title', 'masthead.role', documentModel.masthead.role)}${fieldInput('Secondary title', 'masthead.subrole', documentModel.masthead.subrole)}${fieldInput('Kicker', 'masthead.kicker', documentModel.masthead.kicker)}${fieldInput('Brand name', 'brand.name', documentModel.brand.name)}${fieldInput('Brand type', 'brand.type', documentModel.brand.type)}${textareaInput('Map slogan', 'mapSlogan', documentModel.mapSlogan ?? 'KNOWLEDGE COMES,\nBUT WISDOM LINGERS.')}${fieldInput('Contact heading', 'contact.title', documentModel.contact.title)}${fieldInput('Location', 'contact.location', documentModel.contact.location)}${fieldInput('Phone', 'contact.phone', documentModel.contact.phone)}${fieldInput('Phone link', 'contact.phoneHref', documentModel.contact.phoneHref)}${fieldInput('Email', 'contact.email', documentModel.contact.email)}${fieldInput('Email link', 'contact.emailHref', documentModel.contact.emailHref)}${fieldInput('Portfolio', 'contact.site', documentModel.contact.site)}${fieldInput('Portfolio link', 'contact.siteHref', documentModel.contact.siteHref)}${fieldInput('GitHub', 'contact.github', documentModel.contact.github)}${fieldInput('GitHub link', 'contact.githubHref', documentModel.contact.githubHref)}${fieldInput('LinkedIn', 'contact.linkedin', documentModel.contact.linkedin)}${fieldInput('LinkedIn link', 'contact.linkedinHref', documentModel.contact.linkedinHref)}${fieldInput('Education & languages heading', 'profile.title', documentModel.profile.title)}${documentModel.profile.paragraphs.map((paragraph, index) => textareaInput(index === 0 ? 'Profile source summary' : index === 1 ? 'Education' : 'Languages', `profile.paragraphs.${index}`, paragraph)).join('')}${fieldInput('Skills heading', 'skills.title', documentModel.skills.title)}${fieldInput('Summary heading', 'summary.title', documentModel.summary.title)}${documentModel.summary.paragraphs.map((paragraph, index) => textareaInput(`Summary paragraph ${index + 1}`, `summary.paragraphs.${index}`, paragraph)).join('')}${fieldInput('Experience heading', 'experience.title', documentModel.experience.title)}${fieldInput('Systems heading', 'systems.title', documentModel.systems.title)}${documentModel.systems.items.map((item, index) => `<div class="builder-entry" data-index="${index}">${fieldInput('System title', `systems.items.${index}.title`, item.title)}${textareaInput('System description', `systems.items.${index}.copy`, item.copy)}</div>`).join('')}${fieldInput('Footer primary text', 'footer.motto', documentModel.footer.motto)}${fieldInput('Footer secondary text', 'footer.subtitle', documentModel.footer.subtitle)}</details>
      <details class="builder-group"><summary>PORTRAIT</summary><div class="portrait-tools"><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp"><button class="builder-button" type="button" data-builder-action="portrait-upload">Replace portrait</button><span class="builder-help">JPG, PNG or WebP · 2.5 MB max</span></div><div class="builder-range-grid">${this.rangeField('Horizontal position', 'portrait.x', documentModel.portrait.x, 0, 100, 1)}${this.rangeField('Vertical position', 'portrait.y', documentModel.portrait.y, 0, 100, 1)}${this.rangeField('Portrait zoom', 'portrait.scale', documentModel.portrait.scale, .7, 1.8, .01)}</div><button class="builder-button builder-button-muted" type="button" data-builder-action="portrait-reset">Reset portrait</button></details>
      <details class="builder-group"><summary>TECHNOLOGY STACK <em>${documentModel.technology.items.length}</em></summary><p class="builder-help">Built-in icons are local and searchable. Custom uploads stay in this document draft or JSON export.</p><div class="builder-list">${technologies}</div><div class="builder-action-row"><button class="builder-button" type="button" data-builder-action="add-technology">+ Add technology</button><button class="builder-button builder-button-muted" type="button" data-builder-action="technology-reset">Reset stack</button></div></details>
      <details class="builder-group"><summary>VIEW</summary><div class="builder-action-row"><button class="builder-button" type="button" data-action="fit">Fit</button><button class="builder-button" type="button" data-action="zoom-75">75%</button><button class="builder-button" type="button" data-action="zoom-100">100%</button><button class="builder-button" type="button" data-action="zoom-125">125%</button></div><p class="builder-help">Viewport only. Print remains fixed A4.</p></details>
      <dialog id="icon-picker-dialog" class="icon-picker-dialog" aria-labelledby="icon-picker-title"><form method="dialog"><div class="dialog-heading"><div><span class="inspector-kicker">TECHNOLOGY STACK</span><strong id="icon-picker-title">Choose built-in icon</strong></div><button class="builder-icon-button" value="cancel" type="submit" data-builder-action="icon-picker-cancel" aria-label="Close icon picker">×</button></div><label class="builder-field"><span>Search icons</span><input id="icon-search" data-icon-search type="search" aria-label="Search icons" autocomplete="off"></label><div class="icon-picker-filters" role="group" aria-label="Icon category"><button type="button" class="builder-button" data-builder-action="icon-picker-category" data-category="all">All</button><button type="button" class="builder-button" data-builder-action="icon-picker-category" data-category="brand">Brand</button><button type="button" class="builder-button" data-builder-action="icon-picker-category" data-category="generic">Generic</button></div><div id="icon-picker-grid" class="icon-picker-grid" role="listbox" aria-label="Built-in technology icons"></div><div id="icon-picker-selection" class="icon-picker-selection" aria-live="polite">Select an icon</div><div class="dialog-actions"><button class="builder-button builder-button-primary" type="button" data-builder-action="icon-picker-apply">Apply</button><button class="builder-button builder-button-muted" type="button" data-builder-action="icon-picker-cancel">Cancel</button></div></form></dialog>`;
    }
    rangeField(label, field, value, min, max, step) {
        return `<label class="builder-field"><span>${label} <output>${value}</output></span><input type="range" min="${min}" max="${max}" step="${step}" data-field="${field}" value="${value}"></label>`;
    }
    syncAccentControls(accent, theme) {
        const hex = accent.mode === 'custom' ? accent.hex : customAccentForTheme(theme);
        const input = this.builder?.querySelector('[data-accent-input="hex"]');
        const color = this.builder?.querySelector('[data-accent-input="color"]');
        if (input)
            input.value = hex;
        if (color)
            color.value = hex;
        this.syncAccentPreview(hex);
    }
    syncAccentPreview(hex) {
        const preview = this.builder?.querySelector('#accent-preview');
        const warning = this.builder?.querySelector('#accent-warning');
        if (!HEX.test(hex)) {
            if (warning)
                warning.textContent = 'Enter a six-digit HEX value';
            return;
        }
        if (preview)
            preview.style.background = hex;
        if (warning)
            warning.textContent = textForContrast(hex);
    }
    applyAccentFromControls() {
        const target = this.currentThemeTarget();
        if (!target)
            return;
        const value = this.builder?.querySelector('[data-accent-input="hex"]')?.value.trim().toUpperCase() ?? '';
        if (!HEX.test(value)) {
            this.syncAccentPreview(value);
            return;
        }
        target.setCustomAccent(value);
    }
    currentThemeTarget() {
        return this.page ?? this.executive ?? this.ats ?? this.technicalProfile;
    }
    themeBuilderMarkup(label, target, help) {
        const accent = target.getAccent();
        const current = accent.mode === 'custom' ? accent.hex : customAccentForTheme(target.getTheme());
        const presets = ['red', 'blue', 'gold'].map(theme => `<button class="builder-button builder-theme-button${accent.mode !== 'custom' && target.getTheme() === theme ? ' is-active' : ''}" type="button" data-builder-action="theme-preset" data-theme="${theme}"><i></i>${theme === 'red' ? 'Signal Red' : theme === 'gold' ? 'Legend Gold' : 'Legend Blue'}<span class="theme-selected" aria-hidden="true">✓</span></button>`).join('');
        return `<div class="builder-status"><strong>${label}</strong><span>Shared controls / versioned local preferences</span></div><p class="builder-help">${help}</p><details class="builder-group" open><summary>THEME &amp; COLOR</summary><div class="theme-grid">${presets}<button class="builder-button builder-theme-button${accent.mode === 'custom' ? ' is-active' : ''}" type="button" data-builder-action="custom-accent-focus" data-custom-theme="true"><i></i>Custom<span class="theme-selected" aria-hidden="true">✓</span></button></div><div class="accent-control"><label class="builder-field"><span>Custom accent HEX</span><input id="accent-hex" data-accent-input="hex" value="${escapeText(current)}" inputmode="text" maxlength="7" autocomplete="off"></label><input id="accent-color-input" data-accent-input="color" type="color" value="${escapeText(current)}" aria-label="Choose custom accent color"><span id="accent-preview" class="accent-preview" style="background:${escapeText(current)}"></span><p id="accent-warning" class="builder-warning" role="status" aria-live="polite"></p></div><div class="builder-action-row"><button class="builder-button" type="button" data-builder-action="accent-apply">Apply accent</button><button class="builder-button builder-button-muted" type="button" data-builder-action="accent-reset">Reset to theme</button></div></details>`;
    }
    syncPrintMode() {
        const select = document.querySelector('#print-mode');
        if (select)
            select.value = getPrintMode();
    }
    async readCustomIcon(input) {
        const file = input.files?.[0];
        if (!file || !this.page)
            return;
        const allowed = file.type === 'image/svg+xml' || file.type === 'image/png' || file.type === 'image/webp';
        if (!allowed) {
            this.setEditorStatus('ICON REJECTED / SVG, PNG OR WEBP ONLY');
            input.value = '';
            return;
        }
        const limit = file.type === 'image/svg+xml' ? 256 * 1024 : 1024 * 1024;
        if (file.size > limit) {
            this.setEditorStatus('ICON REJECTED / FILE TOO LARGE');
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            try {
                const validated = validateCustomIconData(reader.result);
                const index = Number(input.dataset.index ?? -1);
                if (index < 0)
                    return;
                this.page?.updateDocument(document => {
                    const item = document.technology.items[index];
                    if (!item)
                        return;
                    item.iconMode = 'custom';
                    item.customIconData = validated.dataUrl;
                    delete item.iconRef;
                    item.colorMode = 'original';
                });
                this.setEditorStatus('CUSTOM ICON ADDED / SAVED LOCALLY');
            }
            catch (error) {
                this.setEditorStatus(error instanceof Error ? `ICON REJECTED / ${error.message.toUpperCase()}` : 'ICON REJECTED');
            }
        });
        reader.readAsDataURL(file);
        input.value = '';
    }
    async openIconPicker(index) {
        if (!this.page)
            return;
        this.iconPickerIndex = index;
        this.iconPickerSelection = null;
        if (!this.iconManifestLoaded) {
            try {
                const response = await fetch(new URL('data/icon-manifest.json', document.baseURI));
                if (!response.ok)
                    throw new Error('Icon manifest unavailable');
                this.iconManifest = await response.json();
                this.iconManifestLoaded = true;
            }
            catch {
                this.setEditorStatus('ICON LIBRARY UNAVAILABLE');
                return;
            }
        }
        const dialog = this.builder?.querySelector('#icon-picker-dialog');
        if (!dialog)
            return;
        this.renderIconPicker('', 'all');
        if (typeof dialog.showModal === 'function')
            dialog.showModal();
        else
            dialog.setAttribute('open', '');
        this.builder?.querySelector('#icon-search')?.focus();
    }
    renderIconPicker(query, category) {
        const grid = this.builder?.querySelector('#icon-picker-grid');
        if (!grid)
            return;
        const needle = normalizePickerSearch(query);
        const results = this.iconManifest.filter(icon => (category === 'all' || icon.type === category) && (!needle || [icon.id, icon.label, ...icon.keywords].some(value => normalizePickerSearch(value).includes(needle))));
        grid.innerHTML = results.map(icon => `<button class="icon-picker-option${this.iconPickerSelection?.id === icon.id ? ' is-selected' : ''}" type="button" data-picker-option="${escapeText(icon.id)}" role="option" aria-selected="${this.iconPickerSelection?.id === icon.id ? 'true' : 'false'}"><img src="${escapeText(icon.url)}" alt="" loading="lazy"><span>${escapeText(icon.label)}</span><small>${icon.type}</small></button>`).join('') || '<p class="builder-help">No matching icons.</p>';
        this.builder?.querySelectorAll('[data-category]').forEach(button => button.classList.toggle('is-active', button.dataset.category === category));
        this.syncPickerSelection();
    }
    filterIconPicker(category) {
        const query = this.builder?.querySelector('#icon-search')?.value ?? '';
        this.renderIconPicker(query, category);
    }
    syncPickerSelection() {
        this.builder?.querySelectorAll('[data-picker-option]').forEach(option => {
            const selected = option.dataset.pickerOption === this.iconPickerSelection?.id;
            option.classList.toggle('is-selected', selected);
            option.setAttribute('aria-selected', String(selected));
        });
        const status = this.builder?.querySelector('#icon-picker-selection');
        if (status)
            status.textContent = this.iconPickerSelection ? `${this.iconPickerSelection.label} selected` : 'Select an icon';
    }
    applyPickerSelection() {
        if (!this.page || this.iconPickerIndex === null || !this.iconPickerSelection) {
            this.setEditorStatus('ICON PICKER APPLY UNAVAILABLE');
            return;
        }
        const selected = this.iconPickerSelection;
        this.page.updateDocument(document => {
            const item = document.technology.items[this.iconPickerIndex ?? -1];
            if (!item)
                return;
            item.iconMode = 'built-in';
            item.iconRef = selected.file;
            item.icon = PACKAGED_ICON_NAMES.includes(selected.id) ? selected.id : 'technology';
            delete item.customIconData;
        });
        this.closeIconPicker();
        this.setEditorStatus('BUILT-IN ICON APPLIED / SAVED LOCALLY');
    }
    closeIconPicker() {
        const dialog = this.builder?.querySelector('#icon-picker-dialog');
        if (dialog?.open)
            dialog.close();
        else
            dialog?.removeAttribute('open');
        this.iconPickerIndex = null;
        this.iconPickerSelection = null;
    }
    setEditorStatus(message) {
        const status = document.querySelector('#save-status');
        if (status)
            status.textContent = message;
    }
    restoreSidebarState() {
        const workspace = document.querySelector('.workspace');
        this.mobileViewport = window.matchMedia('(max-width: 1100px)').matches;
        workspace?.classList.remove('editor-open');
        let collapsed = false;
        try {
            collapsed = window.localStorage.getItem('legend-systems-cv:editor-sidebar') === 'collapsed';
        }
        catch { /* storage is optional */ }
        if (this.mobileViewport)
            workspace?.classList.add('editor-open');
        else
            workspace?.classList.toggle('sidebar-collapsed', collapsed);
        this.syncSidebarState();
    }
    toggleSidebar() {
        const workspace = document.querySelector('.workspace');
        if (!workspace)
            return;
        if (window.matchMedia('(max-width: 1100px)').matches)
            workspace.classList.toggle('editor-open');
        else {
            const collapsed = workspace.classList.toggle('sidebar-collapsed');
            try {
                window.localStorage.setItem('legend-systems-cv:editor-sidebar', collapsed ? 'collapsed' : 'expanded');
            }
            catch { /* storage is optional */ }
        }
        this.syncSidebarState();
    }
    syncSidebarState() {
        const workspace = document.querySelector('.workspace');
        const toggle = document.querySelector('#sidebar-toggle');
        if (!workspace || !toggle)
            return;
        const mobile = window.matchMedia('(max-width: 1100px)').matches;
        const open = mobile ? workspace.classList.contains('editor-open') : !workspace.classList.contains('sidebar-collapsed');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = mobile ? (open ? 'Close editor' : 'Editor') : (open ? 'Collapse editor' : 'Open editor');
    }
    fit() {
        if (!this.stage || !this.frame)
            return;
        const viewportWidth = Math.min(this.stage.clientWidth, window.innerWidth);
        const stageStyles = window.getComputedStyle(this.stage);
        const horizontalPadding = parseFloat(stageStyles.paddingLeft) + parseFloat(stageStyles.paddingRight);
        const availableWidth = Math.max(280, viewportWidth - horizontalPadding - 2);
        const pageWidth = 210 * 96 / 25.4;
        this.setScale(Math.min(1, availableWidth / pageWidth));
    }
    setScale(nextScale) {
        this.scale = Math.max(.3, Math.min(1.15, Number(nextScale.toFixed(3))));
        if (this.frame) {
            this.frame.style.width = `${210 * this.scale}mm`;
            this.frame.style.height = this.executive ? `${602 * this.scale}mm` : this.ats || this.technicalProfile ? 'auto' : `${297 * this.scale}mm`;
        }
        if (this.pageCanvas) {
            this.pageCanvas.style.transform = `scale(${this.scale})`;
            this.pageCanvas.style.transformOrigin = 'top left';
        }
        if (this.zoomReadout)
            this.zoomReadout.textContent = `${Math.round(this.scale * 100)}%`;
    }
    setControlsEnabled(enabled) {
        const capabilities = this.mode === 'unavailable' ? null : registryEntry(this.mode).capabilities;
        document.querySelectorAll('.theme-button').forEach(control => { control.disabled = !enabled || !capabilities?.theme; });
        document.querySelectorAll('[data-action]').forEach(control => {
            const action = control.dataset.action;
            const allowed = action === 'fit' || action === 'zoom-75' || action === 'zoom-100' || action === 'zoom-125' || action === 'zoom-in' || action === 'zoom-out' || action === 'zoom-reset'
                ? capabilities?.zoom
                : action === 'print'
                    ? capabilities?.print
                    : action === 'save'
                        ? capabilities?.save
                        : action === 'reset'
                            ? capabilities?.reset
                            : action === 'undo' || action === 'redo'
                                ? capabilities?.undoRedo
                                : action === 'import-json' || action === 'export-json'
                                    ? capabilities?.importExport
                                    : false;
            control.disabled = !enabled || !allowed;
        });
        const fileInput = document.querySelector('#json-input');
        if (fileInput) {
            fileInput.disabled = !enabled || !capabilities?.importExport;
            fileInput.value = '';
        }
        if (enabled && this.mode === 'executive')
            this.syncExecutiveControls();
        if (enabled && this.mode === 'ats')
            this.syncAtsControls();
        if (enabled && this.mode === 'technical-profile')
            this.syncTechnicalProfileControls();
        const builderPanel = document.querySelector('#builder-panel');
        if (builderPanel) {
            builderPanel.toggleAttribute('aria-disabled', !enabled);
            builderPanel.toggleAttribute('hidden', !capabilities?.builder || !enabled);
        }
        this.syncActionLabels();
    }
    syncExecutiveControls() {
        if (this.mode !== 'executive' || !this.executive)
            return;
        document.querySelectorAll('[data-action="print"]').forEach(control => { control.disabled = !this.executive?.canPrint(); });
    }
    syncPageControls() {
        if (this.mode !== 'page-one' || !this.page)
            return;
        document.querySelectorAll('[data-action="print"]').forEach(control => { control.disabled = !this.page?.canPrint(); });
    }
    syncAtsControls() {
        if (this.mode !== 'ats' || !this.ats)
            return;
        document.querySelectorAll('[data-action="print"]').forEach(control => { control.disabled = !this.ats?.canPrint(); });
    }
    syncTechnicalProfileControls() {
        if (this.mode !== 'technical-profile' || !this.technicalProfile)
            return;
        document.querySelectorAll('[data-action="print"]').forEach(control => { control.disabled = !this.technicalProfile?.canPrint(); });
    }
    syncActionLabels() {
        const executive = this.mode === 'executive';
        const ats = this.mode === 'ats';
        const technicalProfile = this.mode === 'technical-profile';
        document.querySelectorAll('[data-action="reset"]').forEach(button => { button.textContent = executive ? 'Reset Executive Draft' : ats ? 'Reset ATS Draft' : technicalProfile ? 'Reset Technical Profile Draft' : 'Reset Page One'; });
        document.querySelectorAll('[data-action="export-json"]').forEach(button => { button.textContent = executive ? 'Export Executive JSON' : ats ? 'Export ATS JSON' : technicalProfile ? 'Export Technical Profile JSON' : 'Export JSON'; });
        document.querySelectorAll('[data-action="import-json"]').forEach(button => { button.textContent = executive ? 'Import Executive JSON' : ats ? 'Import ATS JSON' : technicalProfile ? 'Import Technical Profile JSON' : 'Import JSON'; });
        document.querySelectorAll('[data-action="save"]').forEach(button => { button.textContent = executive ? 'Save Executive Draft' : ats ? 'Save ATS Draft' : technicalProfile ? 'Save Technical Profile Draft' : 'Save Page One Draft'; });
    }
    destroy() {
        this.unsubscribe?.();
        this.unsubscribe = null;
    }
}
