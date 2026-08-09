const printFallbackGeometry = `<path fill-rule="evenodd" d="M15 4h34l11 11v34L49 60H15L4 49V15zm2 7-6 6v30l6 6h30l6-6V17l-6-6z"/><path d="M18 18h28v7H25v5h14a8 8 0 0 1 0 16H18v-7h21a1 1 0 0 0 0-2H25a7 7 0 0 1-7-7zm0 0v28h7V25h21v-7z"/><circle cx="18" cy="18" r="2.8"/><circle cx="46" cy="25" r="2.8"/><circle cx="18" cy="46" r="2.8"/>`;
export const legendSystemsMark = (extraClass = '', labelled = false) => {
    const className = ['legend-systems-mark', extraClass].filter(Boolean).join(' ');
    const accessible = labelled ? ' role="img" aria-label="Legend Systems"' : ' aria-hidden="true"';
    return `<span class="${className}"${accessible}><svg class="legend-systems-mark-fallback" viewBox="0 0 64 64" focusable="false" aria-hidden="true" fill="currentColor">${printFallbackGeometry}</svg></span>`;
};
