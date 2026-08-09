export function measureExecutiveOverflow(root, tolerance = 1) {
    const pages = [...root.querySelectorAll('.executive-page')].map((page, index) => {
        const vertical = page.scrollHeight > page.clientHeight + tolerance;
        const horizontal = page.scrollWidth > page.clientWidth + tolerance;
        return { id: page.id || `executive-page-${index + 1}`, vertical, horizontal, reasons: [
                ...(vertical ? ['vertical overflow'] : []),
                ...(horizontal ? ['horizontal overflow'] : [])
            ] };
    });
    return { overflowing: pages.some(page => page.vertical || page.horizontal), pages };
}
export const hasExecutiveOverflow = (report) => report.overflowing;
