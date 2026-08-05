import { EditorToolbar } from './components/editor-toolbar.js';
import { PageOne } from './components/page-one.js';
const pageRoot = document.querySelector('#page-one');
if (pageRoot) {
    const page = new PageOne(pageRoot);
    new EditorToolbar(page);
}
