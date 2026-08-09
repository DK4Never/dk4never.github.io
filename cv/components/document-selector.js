import { DOCUMENT_REGISTRY, registryEntry } from '../app/document-registry.js';
export class DocumentSelector {
    select;
    description;
    onSelect;
    constructor(select, onSelect, description = null) {
        this.select = select;
        this.description = description;
        this.onSelect = onSelect;
        this.select.replaceChildren(...DOCUMENT_REGISTRY.map(entry => {
            const option = document.createElement('option');
            option.value = entry.id;
            option.textContent = entry.label;
            option.dataset.availability = entry.availability;
            return option;
        }));
        this.select.addEventListener('change', this.handleChange);
    }
    handleChange = () => {
        const entry = DOCUMENT_REGISTRY.find(candidate => candidate.id === this.select.value);
        if (entry)
            this.onSelect(entry.id);
    };
    setSelection(documentId) {
        this.select.value = documentId;
        const entry = registryEntry(documentId);
        if (this.description)
            this.description.textContent = entry.description;
    }
    focus() {
        this.select.focus({ preventScroll: true });
    }
    setLoading(loading) {
        this.select.disabled = loading;
        this.select.setAttribute('aria-busy', String(loading));
    }
    destroy() {
        this.select.removeEventListener('change', this.handleChange);
    }
}
