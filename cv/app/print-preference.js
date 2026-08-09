const PRINT_MODE_KEY = 'legend-systems-cv:print-mode:v1';
const readMode = () => {
    try {
        return window.localStorage.getItem(PRINT_MODE_KEY) === 'printer' ? 'printer' : 'match';
    }
    catch {
        return 'match';
    }
};
export function getPrintMode() { return readMode(); }
export function setPrintMode(mode) {
    try {
        window.localStorage.setItem(PRINT_MODE_KEY, mode);
    }
    catch { /* optional persistence */ }
}
export function printDocument() {
    document.documentElement.dataset.printBackgrounds = readMode() === 'match' ? 'on' : 'off';
    window.print();
}
