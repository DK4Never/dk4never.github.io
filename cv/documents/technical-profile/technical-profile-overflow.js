export function measureTechnicalProfileOverflow(root, tolerance = 1) {
    const article = root.querySelector('.technical-profile-document') ?? root;
    const articleRect = article.getBoundingClientRect();
    const sections = [...article.querySelectorAll('section, address, article')]
        .filter(section => section.getBoundingClientRect().right > articleRect.right + tolerance || section.getBoundingClientRect().left < articleRect.left - tolerance)
        .map(section => section.id || section.dataset.experienceId || section.dataset.projectId || section.tagName.toLowerCase());
    const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + tolerance || document.body.scrollWidth > document.body.clientWidth + tolerance;
    return {
        overflowing: article.scrollWidth > article.clientWidth + tolerance || bodyOverflow || sections.length > 0,
        articleWidth: article.scrollWidth,
        articleClientWidth: article.clientWidth,
        bodyOverflow,
        sections: [...new Set(sections)]
    };
}
export const hasTechnicalProfileOverflow = (report) => report.overflowing;
