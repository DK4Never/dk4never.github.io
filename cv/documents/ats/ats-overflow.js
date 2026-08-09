export function measureAtsOverflow(root, tolerance = 1) {
    const documentElement = root.querySelector('.ats-document') ?? root;
    const documentWidth = documentElement.scrollWidth;
    const documentClientWidth = documentElement.clientWidth;
    const documentRect = documentElement.getBoundingClientRect();
    const sections = [...documentElement.querySelectorAll('section, address, article')]
        .filter(section => section.getBoundingClientRect().right > documentRect.right + tolerance)
        .map(section => section.id || section.dataset.experienceId || section.dataset.projectId || section.tagName.toLowerCase());
    return {
        overflowing: documentWidth > documentClientWidth + tolerance || sections.length > 0,
        documentWidth,
        documentClientWidth,
        sections: [...new Set(sections)]
    };
}
export const hasAtsOverflow = (report) => report.overflowing;
