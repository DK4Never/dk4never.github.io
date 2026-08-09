import { DocumentSelector } from '../components/document-selector.js';
import { EditorToolbar } from '../components/editor-toolbar.js';
import { renderDocumentUnavailable } from '../components/document-unavailable.js';
import { getDocumentShell, announce, announceLoading } from '../components/document-shell.js';
import { renderRuntimeError } from '../components/runtime-error.js';
import { adaptPageOneProjection } from '../content/page-one-projection-adapter.js';
import { loadPublicContent, selectPublicDocument } from '../content/public-content-loader.js';
import { DraftStore } from './draft-store.js';
import { applyDocumentQuery, isTheme, parseDocumentQuery, updateDocumentQuery } from './document-query.js';
import { DEFAULT_DOCUMENT_ID, registryEntry, validateRegistryAgainstProjection } from './document-registry.js';
import { isDocumentId } from './document-types.js';
import { PageOne } from '../components/page-one.js';
import { adaptExecutiveProjection } from '../documents/executive/executive-adapter.js';
import { ExecutiveDraftStore } from '../documents/executive/executive-draft.js';
import { ExecutiveRenderer } from '../documents/executive/executive-renderer.js';
import { adaptAtsProjection } from '../documents/ats/ats-adapter.js';
import { AtsDraftStore } from '../documents/ats/ats-draft.js';
import { AtsRenderer } from '../documents/ats/ats-renderer.js';
import { adaptTechnicalProfileProjection } from '../documents/technical-profile/technical-profile-adapter.js';
import { TechnicalProfileDraftStore } from '../documents/technical-profile/technical-profile-draft.js';
import { TechnicalProfileRenderer } from '../documents/technical-profile/technical-profile-renderer.js';
const ERROR_MESSAGE = 'The approved public CV content is unavailable. Check the connection and try again.';
export async function bootstrapRuntime() {
    const shell = getDocumentShell();
    if (!shell)
        return;
    const selector = new DocumentSelector(shell.selector, documentId => {
        applyDocumentQuery({ documentId }, 'push');
        renderSafely(documentId);
    }, shell.description);
    const draftStore = new DraftStore();
    let toolbar = null;
    let page = null;
    let executive = null;
    let ats = null;
    let technicalProfile = null;
    let projection = null;
    let query = parseDocumentQuery(window.location.search);
    const announceDraftState = (active) => {
        const saveStatus = document.querySelector('#save-status');
        if (saveStatus)
            saveStatus.textContent = active ? 'LOCAL DRAFT ACTIVE' : 'CANONICAL';
    };
    const destroyPage = () => {
        toolbar?.setPage(null);
        toolbar?.setExecutive(null);
        toolbar?.setAts(null);
        toolbar?.setTechnicalProfile(null);
        page?.destroy();
        executive?.destroy();
        ats?.destroy();
        technicalProfile?.destroy();
        page = null;
        executive = null;
        ats = null;
        technicalProfile = null;
    };
    const setThemeQuery = (theme) => applyDocumentQuery({ documentId: query.documentId, theme }, 'push');
    const normaliseAddressBar = () => {
        const params = new URLSearchParams(window.location.search);
        const parsed = parseDocumentQuery(window.location.search);
        const invalidDocument = params.has('document') && !isDocumentId(params.get('document'));
        const invalidTheme = params.has('theme') && !isTheme(params.get('theme'));
        if (invalidDocument || invalidTheme) {
            window.history.replaceState(window.history.state, '', updateDocumentQuery(window.location.href, parsed));
        }
        return parsed;
    };
    toolbar = new EditorToolbar(null, { onThemeChange: setThemeQuery });
    selector.setLoading(true);
    announceLoading(shell.status);
    const renderSelected = async (requestedId) => {
        if (!projection)
            return;
        query = parseDocumentQuery(window.location.search);
        const documentId = requestedId ?? query.documentId ?? DEFAULT_DOCUMENT_ID;
        selector.setSelection(documentId);
        const entry = registryEntry(documentId);
        const manifest = selectPublicDocument(projection, entry.projectionId);
        const inspectorCopy = document.querySelector('#inspector-copy');
        if (inspectorCopy)
            inspectorCopy.textContent = entry.id === 'executive'
                ? 'Executive CV text fields are editable inline. Projected identity, dates, roles and document structure remain locked.'
                : entry.id === 'page-one'
                    ? 'Page One fields are editable in the browser. Other approved documents are available through the same controlled runtime.'
                    : entry.id === 'ats'
                        ? 'ATS CV uses a neutral single-column text-first layout. Plain-text fields are editable; projected structure and identity remain locked.'
                        : entry.id === 'technical-profile'
                            ? 'Technical Career Profile uses a continuous, themed technical-document layout. Plain-text profile, focus, career and project fields are editable.'
                            : 'The selected public CV document is editable through the same controlled runtime.';
        destroyPage();
        if (entry.availability === 'planned') {
            renderDocumentUnavailable(shell.mount, entry, () => {
                applyDocumentQuery({ documentId: DEFAULT_DOCUMENT_ID }, 'push');
                renderSafely(DEFAULT_DOCUMENT_ID);
            });
            announce(shell.status, `${entry.label} selected. Template unavailable.`);
            selector.focus();
            return;
        }
        const requestedTheme = query.theme;
        const theme = requestedTheme && manifest.themeSupport.includes(requestedTheme)
            ? requestedTheme
            : 'red';
        shell.mount.className = 'document-mount';
        if (entry.renderer === 'ats') {
            shell.mount.innerHTML = '<div class="ats-frame" id="ats-frame" aria-label="ATS CV editable document"></div>';
            const root = shell.mount.querySelector('#ats-frame');
            if (!root)
                throw new Error('ATS CV mount unavailable');
            const canonical = adaptAtsProjection(manifest, theme);
            ats = new AtsRenderer(root, canonical, {
                draftStore: new AtsDraftStore(),
                onDraftState: announceDraftState
            });
            toolbar?.setAts(ats);
            announce(shell.status, `${entry.label} ready`);
            selector.focus();
            return;
        }
        if (entry.renderer === 'technical-profile') {
            shell.mount.innerHTML = '<div class="technical-profile-frame" id="technical-profile-frame" aria-label="Technical Career Profile editable document"></div>';
            const root = shell.mount.querySelector('#technical-profile-frame');
            if (!root)
                throw new Error('Technical Career Profile mount unavailable');
            const canonical = adaptTechnicalProfileProjection(manifest, theme);
            technicalProfile = new TechnicalProfileRenderer(root, canonical, {
                draftStore: new TechnicalProfileDraftStore(),
                onDraftState: announceDraftState
            });
            if (requestedTheme)
                technicalProfile.setTheme(theme);
            toolbar?.setTechnicalProfile(technicalProfile);
            announce(shell.status, `${entry.label} ready`);
            selector.focus();
            return;
        }
        if (entry.renderer === 'executive') {
            shell.mount.innerHTML = '<div class="executive-frame" id="executive-frame" aria-label="Executive CV editable document"></div>';
            const root = shell.mount.querySelector('#executive-frame');
            if (!root)
                throw new Error('Executive CV mount unavailable');
            const canonical = adaptExecutiveProjection(manifest, theme);
            executive = new ExecutiveRenderer(root, canonical, {
                draftStore: new ExecutiveDraftStore(),
                onDraftState: announceDraftState
            });
            if (requestedTheme)
                executive.setTheme(theme);
            toolbar?.setExecutive(executive);
            announce(shell.status, `${entry.label} ready`);
            selector.focus();
            return;
        }
        shell.mount.innerHTML = '<div class="page-frame" id="page-frame"><article class="cv-page" id="page-one" data-theme="red" aria-label="Page One editable CV"></article></div>';
        const root = shell.mount.querySelector('#page-one');
        if (!root)
            throw new Error('Page One mount unavailable');
        const canonical = adaptPageOneProjection(manifest, theme);
        page = new PageOne(root, canonical, {
            draftStore,
            onOverflow: () => toolbar?.syncPageControls(),
            onDraftState: announceDraftState
        });
        if (requestedTheme)
            page.setTheme(theme);
        toolbar?.setPage(page);
        announce(shell.status, `${entry.label} ready`);
        selector.focus();
    };
    const renderSafely = (requestedId) => {
        void renderSelected(requestedId).catch(() => showFailure());
    };
    const showFailure = () => {
        destroyPage();
        selector.setLoading(false);
        toolbar?.setPage(null);
        toolbar?.setExecutive(null);
        toolbar?.setAts(null);
        toolbar?.setTechnicalProfile(null);
        renderRuntimeError(shell.mount, ERROR_MESSAGE, () => { void loadProjection(); });
        shell.status.textContent = 'CV content unavailable';
        shell.status.setAttribute('data-state', 'error');
        document.querySelector('#runtime-document-status')?.replaceChildren(document.createTextNode('UNAVAILABLE'));
    };
    const loadProjection = async () => {
        selector.setLoading(true);
        announceLoading(shell.status);
        try {
            const loaded = await loadPublicContent();
            validateRegistryAgainstProjection(loaded);
            projection = loaded;
            selector.setLoading(false);
            query = normaliseAddressBar();
            await renderSelected(query.documentId);
        }
        catch (error) {
            projection = null;
            showFailure();
            if (!(error instanceof Error) || error.name !== 'PublicContentLoadError')
                return;
        }
    };
    window.addEventListener('popstate', () => {
        query = normaliseAddressBar();
        if (projection)
            renderSafely(query.documentId);
    });
    await loadProjection();
}
