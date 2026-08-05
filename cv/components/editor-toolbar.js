const escapeText = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const fieldInput = (label, field, value, type = 'text') => `<label class="builder-field"><span>${label}</span><input type="${type}" data-field="${field}" value="${escapeText(value)}"></label>`;
const textareaInput = (label, field, value) => `<label class="builder-field builder-field-wide"><span>${label}</span><textarea rows="2" data-field="${field}">${escapeText(value)}</textarea></label>`;
export class EditorToolbar {
    page;
    frame;
    pageCanvas;
    stage;
    zoomReadout;
    builder;
    scale = 1;
    constructor(page) {
        this.page = page;
        this.frame = document.querySelector('#page-frame');
        this.pageCanvas = this.frame?.querySelector('.cv-page') ?? null;
        this.stage = document.querySelector('.canvas-stage');
        this.zoomReadout = document.querySelector('#zoom-readout');
        this.builder = document.querySelector('#builder-content');
        this.bind();
        this.page.subscribe(() => {
            this.syncThemeButtons(this.page.getDocument().theme);
            this.renderBuilder();
        });
        this.renderBuilder();
        this.applyRequestedTheme();
        this.fit();
    }
    bind() {
        document.querySelectorAll('.theme-button[data-theme]').forEach(button => button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            if (theme === 'blue' || theme === 'gold' || theme === 'red')
                this.page.setTheme(theme);
        }));
        document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => this.handleAction(button.dataset.action)));
        document.querySelector('#json-input')?.addEventListener('change', event => this.importFile(event));
        this.builder?.addEventListener('input', event => this.handleBuilderInput(event));
        this.builder?.addEventListener('change', event => this.handleBuilderInput(event));
        this.builder?.addEventListener('click', event => this.handleBuilderClick(event));
        window.addEventListener('resize', () => this.fit(), { passive: true });
    }
    applyRequestedTheme() {
        const requestedTheme = new URLSearchParams(window.location.search).get('theme');
        if (requestedTheme === 'blue' || requestedTheme === 'gold' || requestedTheme === 'red')
            this.page.setTheme(requestedTheme);
    }
    handleAction(action) {
        if (action === 'fit')
            this.fit();
        if (action === 'zoom-in')
            this.setScale(this.scale + .05);
        if (action === 'zoom-out')
            this.setScale(this.scale - .05);
        if (action === 'zoom-reset')
            this.setScale(1);
        if (action === 'print')
            window.print();
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
        if (!file)
            return;
        try {
            this.page.importJSON(await file.text());
        }
        catch {
            document.querySelector('#save-status')?.replaceChildren(document.createTextNode('IMPORT REJECTED'));
        }
        input.value = '';
    }
    handleBuilderInput(event) {
        const target = event.target;
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
    handleBuilderClick(event) {
        const target = event.target;
        const action = target?.closest('[data-builder-action]')?.dataset.builderAction;
        if (!action)
            return;
        const index = Number(target.closest('[data-index]')?.dataset.index ?? -1);
        if (action === 'portrait-reset')
            this.page.resetPortrait();
        if (action === 'add-skill')
            this.page.updateDocument(document => document.skills.items.push({ name: 'New skill', level: 5 }));
        if (action === 'remove-skill' && index >= 0)
            this.page.updateDocument(document => { document.skills.items.splice(index, 1); });
        if (action === 'add-technology')
            this.page.updateDocument(document => document.technology.items.push({ name: 'New technology', icon: 'technology' }));
        if (action === 'remove-technology' && index >= 0)
            this.page.updateDocument(document => { document.technology.items.splice(index, 1); });
        if (action === 'add-experience')
            this.page.updateDocument(document => document.experience.items.unshift({ job: 'Technical role', company: 'Organisation', location: 'South Africa', period: 'Selected work', description: 'Describe the verified scope of this work.', bullets: ['Verified responsibility'] }));
        if (action === 'remove-experience' && index >= 0)
            this.page.updateDocument(document => { document.experience.items.splice(index, 1); });
        if (action === 'portrait-upload')
            this.builder?.querySelector('#portrait-file')?.click();
    }
    syncThemeButtons(theme) {
        document.querySelectorAll('.theme-button[data-theme]').forEach(button => button.classList.toggle('is-active', button.dataset.theme === theme));
    }
    renderBuilder() {
        if (!this.builder)
            return;
        const documentModel = this.page.getDocument();
        this.builder.innerHTML = this.builderMarkup(documentModel);
        this.builder.querySelector('#portrait-file')?.addEventListener('change', event => this.readPortrait(event));
        this.builder.querySelectorAll('[data-field="portrait.x"], [data-field="portrait.y"], [data-field="portrait.scale"]').forEach(input => input.addEventListener('input', () => this.page.checkOverflow()));
        const undo = document.querySelector('[data-action="undo"]');
        const redo = document.querySelector('[data-action="redo"]');
        if (undo)
            undo.disabled = !this.page.canUndo();
        if (redo)
            redo.disabled = !this.page.canRedo();
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
        reader.addEventListener('load', () => { if (typeof reader.result === 'string')
            this.page.replacePortrait(reader.result); });
        reader.readAsDataURL(file);
    }
    builderMarkup(documentModel) {
        const sectionLabels = [['contact', 'Contact'], ['profile', 'Profile'], ['skills', 'Skills'], ['technology', 'Technology'], ['summary', 'Summary'], ['experience', 'Experience'], ['systems', 'Systems']];
        const iconOptions = ['python', 'flask', 'javascript', 'typescript', 'csharp', 'sql', 'postgresql', 'sqlite', 'docker', 'git', 'linux', 'windows', 'beckhoff', 'siemens', 'network', 'technology', 'server'];
        return `<div class="builder-status"><strong>STRUCTURED DATA</strong><span>JSON v2 / local draft</span></div>
      <details class="builder-group" open><summary>Page sections</summary><div class="builder-checks">${sectionLabels.map(([key, label]) => `<label><input type="checkbox" data-field="sections.${key}" ${documentModel.sections[key] ? 'checked' : ''}>${label}</label>`).join('')}</div></details>
      <details class="builder-group" open><summary>Portrait</summary><div class="portrait-tools"><input id="portrait-file" type="file" accept="image/*"><button class="builder-button" type="button" data-builder-action="portrait-upload">Replace portrait</button><span class="builder-help">JPG, PNG or WebP · 2.5 MB max</span></div><div class="builder-range-grid">${this.rangeField('Horizontal position', 'portrait.x', documentModel.portrait.x, 0, 100, 1)}${this.rangeField('Vertical position', 'portrait.y', documentModel.portrait.y, 0, 100, 1)}${this.rangeField('Portrait zoom', 'portrait.scale', documentModel.portrait.scale, .7, 1.8, .01)}</div><button class="builder-button builder-button-muted" type="button" data-builder-action="portrait-reset">Restore portrait</button></details>
      <details class="builder-group"><summary>Skills <em>${documentModel.skills.items.length}</em></summary><div class="builder-list">${documentModel.skills.items.map((skill, index) => `<div class="builder-row" data-index="${index}">${fieldInput('Name', `skills.items.${index}.name`, skill.name)}<label class="builder-field"><span>Focus ${skill.level}/10</span><input type="range" min="1" max="10" step="1" data-field="skills.items.${index}.level" value="${skill.level}"></label><button class="builder-icon-button" type="button" data-builder-action="remove-skill" aria-label="Remove skill ${index + 1}">×</button></div>`).join('')}</div><button class="builder-button" type="button" data-builder-action="add-skill">+ Add skill</button></details>
      <details class="builder-group"><summary>Technology stack <em>${documentModel.technology.items.length}</em></summary><div class="builder-list">${documentModel.technology.items.map((item, index) => `<div class="builder-row" data-index="${index}">${fieldInput('Name', `technology.items.${index}.name`, item.name)}<label class="builder-field"><span>Icon</span><select data-field="technology.items.${index}.icon">${iconOptions.map(icon => `<option value="${icon}" ${item.icon === icon ? 'selected' : ''}>${icon}</option>`).join('')}</select></label><button class="builder-icon-button" type="button" data-builder-action="remove-technology" aria-label="Remove technology ${index + 1}">×</button></div>`).join('')}</div><button class="builder-button" type="button" data-builder-action="add-technology">+ Add technology</button></details>
      <details class="builder-group"><summary>Experience <em>${documentModel.experience.items.length}</em></summary><div class="builder-list">${documentModel.experience.items.map((item, index) => `<div class="builder-entry" data-index="${index}"><div class="builder-entry-heading"><strong>Entry ${index + 1}</strong><button class="builder-icon-button" type="button" data-builder-action="remove-experience" aria-label="Remove experience entry ${index + 1}">×</button></div>${fieldInput('Role', `experience.items.${index}.job`, item.job)}${fieldInput('Organisation', `experience.items.${index}.company`, item.company)}${fieldInput('Location', `experience.items.${index}.location`, item.location)}${fieldInput('Period', `experience.items.${index}.period`, item.period)}${textareaInput('Description', `experience.items.${index}.description`, item.description)}${item.bullets.map((bullet, bulletIndex) => fieldInput(`Bullet ${bulletIndex + 1}`, `experience.items.${index}.bullets.${bulletIndex}`, bullet)).join('')}</div>`).join('')}</div><button class="builder-button" type="button" data-builder-action="add-experience">+ Add experience</button></details>`;
    }
    rangeField(label, field, value, min, max, step) {
        return `<label class="builder-field"><span>${label} <output>${value}</output></span><input type="range" min="${min}" max="${max}" step="${step}" data-field="${field}" value="${value}"></label>`;
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
            this.frame.style.height = `${297 * this.scale}mm`;
        }
        if (this.pageCanvas) {
            this.pageCanvas.style.transform = `scale(${this.scale})`;
            this.pageCanvas.style.transformOrigin = 'top left';
        }
        if (this.zoomReadout)
            this.zoomReadout.textContent = `${Math.round(this.scale * 100)}%`;
    }
}
