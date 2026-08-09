import { officialTechnologyMarkAssetPath, technologyMarkNames } from './page-one-model.js';
import { iconAssetPath, resolveAssetUrl, resolveIconUrl, resolvePortraitSource } from '../utils/asset-url.js';
import { legendSystemsMark } from '../components/legend-systems-mark.js';
import { isSafeCustomIconData } from '../utils/custom-icon.js';
const escapeHtml = (value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
const asset = (path) => resolveAssetUrl(path);
const icon = (name) => `<span class="mask-icon" style="--icon-url: url('${escapeHtml(asset(iconAssetPath(name)))}')" aria-hidden="true"></span>`;
const cvIcon = (name, className = '') => `<span class="mask-icon cv-local-icon ${escapeHtml(className)}" style="--icon-url: url('${escapeHtml(asset(`assets/icons/cv/${name}.svg`))}')" aria-hidden="true"></span>`;
const officialMark = (name, className = '') => `<img class="official-tech-mark ${className}" src="${escapeHtml(asset(officialTechnologyMarkAssetPath(name)))}" alt="" aria-hidden="true" loading="eager">`;
const brandTechnologyMark = (name) => `<img class="brand-tech-mark brand-tech-mark--${name}" src="${escapeHtml(asset(`assets/icons/brands/${name}.svg`))}" alt="" aria-hidden="true" loading="eager">`;
const technologyMarks = (name) => {
    const value = name.trim().toLowerCase();
    const official = technologyMarkNames(name).map(mark => officialMark(mark, `official-tech-mark--${mark}`)).join('');
    const brand = value === 'javascript' || value === 'flask' || value === 'android'
        ? brandTechnologyMark(value)
        : '';
    return official + brand;
};
const technologyIcon = (item) => {
    if (item.iconMode === 'custom' && isSafeCustomIconData(item.customIconData))
        return `<img class="custom-tech-icon" src="${escapeHtml(item.customIconData)}" alt="" aria-hidden="true" loading="lazy">`;
    if (item.iconRef && /^[a-z0-9][a-z0-9._-]*\.(?:svg|png|webp)$/i.test(item.iconRef))
        return `<img class="manifest-tech-icon${item.colorMode === 'original' ? ' manifest-tech-icon--original' : ''}" src="${escapeHtml(resolveIconUrl(`icons/${item.iconRef}`))}" alt="" aria-hidden="true" loading="lazy">`;
    return technologyMarks(item.name) || cvIcon(technologyIconName(item.name), 'stack-chip-local-icon');
};
const capabilityIconNames = ['code-2', 'database', 'server', 'network'];
const skillIconName = (name) => {
    const value = name.toLowerCase();
    if (value.includes('python') || value.includes('javascript'))
        return 'code-2';
    if (value.includes('sql') || value.includes('data'))
        return 'database';
    if (value.includes('report'))
        return 'chart-column';
    if (value.includes('server') || value.includes('linux') || value.includes('windows'))
        return 'server';
    return 'network';
};
const technologyIconName = (name) => {
    const value = name.toLowerCase();
    if (['javascript', 'typescript', 'html', 'css', 'git', 'bash', 'powershell', 'kotlin', 'java'].includes(value))
        return 'code-2';
    if (value === 'sql' || value === 'sqlite')
        return 'database';
    if (value === 'flask' || value === 'node.js' || value === 'linux')
        return 'server';
    if (value === 'android')
        return 'smartphone';
    if (value === 'qr' || value === 'data matrix')
        return 'qr-code';
    if (value === 'rest' || value.includes('beckhoff') || value.includes('twincat'))
        return 'network';
    if (value.includes('report'))
        return 'chart-column';
    if (value.includes('offline') || value.includes('synchronisation'))
        return 'refresh-cw';
    return 'code-2';
};
const fieldLabel = (field) => {
    const root = field.split('.')[0];
    const labels = {
        masthead: 'Name and positioning', contact: 'Contact information', profile: 'Education and languages',
        skills: 'Skill', technology: 'Technology', summary: 'Professional summary', experience: 'Experience',
        capabilities: 'Professional specialization', systems: 'Selected system', hero: 'Profile highlight',
        brand: 'Brand label', footer: 'Footer text'
    };
    return labels[root] ?? 'Editable CV text';
};
const edit = (value, field, className = '') => `<span class="editable ${className}" data-field="${escapeHtml(field)}" contenteditable="true" role="textbox" aria-label="${escapeHtml(fieldLabel(field))}" tabindex="0" spellcheck="false">${escapeHtml(value)}</span>`;
const paragraph = (value, field, className = '') => `<p class="${className}">${edit(value, field)}</p>`;
const brandMark = () => legendSystemsMark();
const contactDisplayValue = (href, kind) => {
    try {
        const url = new URL(href);
        if (kind === 'host')
            return url.hostname.replace(/^www\./, '');
        const segments = url.pathname.split('/').filter(Boolean);
        return segments[segments.length - 1] ?? url.hostname.replace(/^www\./, '');
    }
    catch {
        return href;
    }
};
const editableContactValue = (value, href, kind) => value && value !== href ? value : contactDisplayValue(href, kind);
const contactLink = (iconMarkup, label, display, href, field, accessibleLabel) => `<li>${iconMarkup}<a aria-label="${escapeHtml(`${accessibleLabel}: ${href}`)}" href="${escapeHtml(href)}" rel="noopener"><span class="contact-display"><strong>${escapeHtml(label)}</strong><span class="contact-display-separator" aria-hidden="true">·</span>${edit(display, field, 'contact-value')}</span></a></li>`;
const sectionHeading = (title, field, code, iconName, headingId, useLocalIcon = false) => `<div class="section-heading"><h2 id="${headingId}" class="section-title">${useLocalIcon ? cvIcon(iconName, 'section-local-icon') : icon(iconName)}${edit(title, field)}</h2><span class="section-code">${code}</span></div>`;
const experience = (item, index) => `
  <article class="experience-item" data-section="experience" data-experience-index="${index}">
    <span class="timeline-marker" aria-hidden="true"></span>
    <div class="experience-heading">
      <div>
        <h3 class="job-title">${edit(item.job, `experience.items.${index}.job`)}</h3>
        <p class="job-company">${edit(item.company, `experience.items.${index}.company`)}${item.location ? ` <span class="job-location">| ${edit(item.location, `experience.items.${index}.location`)}</span>` : ''}</p>
      </div>
      <p class="job-period">${edit(item.period, `experience.items.${index}.period`)}</p>
    </div>
    ${paragraph(item.description, `experience.items.${index}.description`, 'job-description')}
    ${item.bullets.length ? `<ul class="job-bullets">${item.bullets.map((bullet, bulletIndex) => `<li>› ${edit(bullet, `experience.items.${index}.bullets.${bulletIndex}`)}</li>`).join('')}</ul>` : ''}
  </article>`;
const foundationParagraph = (value, field, iconName) => `<p class="profile-copy profile-foundation"><span class="profile-copy-icon">${cvIcon(iconName)}</span>${edit(value, field)}</p>`;
export const pageOneMarkup = (document) => `
  <div class="technical-art page-technical-art" aria-hidden="true"></div>
  <div class="page-border" aria-hidden="true"></div>
  <div class="page-inner">
    <aside class="cv-side" aria-label="Profile, contact and technology">
      <header class="side-masthead" data-section="masthead">
        <div class="portrait-frame"><img src="${escapeHtml(resolvePortraitSource(document.portrait.src))}" alt="Dean Kruger head-and-shoulders portrait" width="1200" height="1500"></div>
        <div class="brand-lockup">${brandMark()}<div class="brand-lockup-text"><strong>${edit(document.brand.name, 'brand.name')}</strong><span>${edit(document.brand.type, 'brand.type')}</span></div></div>
        <div class="masthead-copy">
          <p class="masthead-kicker">${edit(document.masthead.kicker, 'masthead.kicker')}</p>
          <p class="masthead-caption">Industrial software / systems integration</p>
        </div>
      </header>

      ${document.sections.contact ? `<section class="cv-panel side-panel contact-panel" data-section="contact" aria-labelledby="contact-title">${sectionHeading(document.contact.title, 'contact.title', '01', 'map-pin', 'contact-title', true)}<ul class="contact-list">
        <li>${cvIcon('map-pin', 'contact-row-icon')}${edit(document.contact.location, 'contact.location')}</li>
        <li>${cvIcon('phone', 'contact-row-icon')}<a href="${escapeHtml(document.contact.phoneHref)}">${edit(document.contact.phone, 'contact.phone')}</a></li>
        <li>${cvIcon('mail', 'contact-row-icon')}<a href="${escapeHtml(document.contact.emailHref)}">${edit(document.contact.email, 'contact.email')}</a></li>
        ${contactLink(cvIcon('globe-2', 'contact-row-icon'), 'Portfolio', editableContactValue(document.contact.site, document.contact.siteHref, 'host'), document.contact.siteHref, 'contact.site', 'Portfolio website')}
        ${contactLink(officialMark('github', 'official-link-mark'), 'GitHub', editableContactValue(document.contact.github, document.contact.githubHref, 'handle'), document.contact.githubHref, 'contact.github', 'GitHub profile')}
        ${contactLink(cvIcon('external-link', 'contact-row-icon'), 'LinkedIn', editableContactValue(document.contact.linkedin, document.contact.linkedinHref, 'handle'), document.contact.linkedinHref, 'contact.linkedin', 'LinkedIn profile')}
      </ul></section>` : ''}

      ${document.sections.profile ? `<section class="cv-panel side-panel profile-panel" data-section="profile" aria-labelledby="profile-title">${sectionHeading(document.profile.title, 'profile.title', '02', 'graduation-cap', 'profile-title', true)}${document.profile.paragraphs.slice(1).map((item, index) => foundationParagraph(item, `profile.paragraphs.${index + 1}`, index === 0 ? 'graduation-cap' : 'globe-2')).join('')}</section>` : ''}

      ${document.sections.skills ? `<section class="cv-panel side-panel skills-panel" data-section="skills" aria-labelledby="skills-title">${sectionHeading(document.skills.title, 'skills.title', '03', 'code-2', 'skills-title', true)}<div class="skill-list">${document.skills.items.map((skill, index) => `<div class="skill-row">${cvIcon(skillIconName(skill.name), 'skill-row-icon')}<span class="skill-copy"><span class="skill-name">${edit(skill.name, `skills.items.${index}.name`)}</span><small class="skill-classification">${escapeHtml(skill.classification || 'Core capability')}</small></span></div>`).join('')}</div></section>` : ''}

      ${document.sections.technology ? `<section class="cv-panel side-panel stack-panel" data-section="technology" aria-labelledby="stack-title">${sectionHeading(document.technology.title, 'technology.title', '04', 'server', 'stack-title', true)}<div class="stack-grid">${document.technology.items.map((item, index) => `<div class="stack-chip"><span class="stack-chip-icon">${technologyIcon(item)}</span><span>${edit(item.name, `technology.items.${index}.name`)}${item.name === 'Python' ? '<sup class="trademark-symbol" aria-hidden="true">™</sup>' : ''}</span></div>`).join('')}</div></section>` : ''}
    </aside>

    <section class="cv-main" aria-label="Professional content">
      <header class="cv-panel hero-panel" data-section="masthead">
        <div class="hero-content">
          <p class="hero-kicker">${edit(document.brand.name, 'brand.name')} <span>/</span> ${edit(document.brand.type, 'brand.type')}</p>
          <h1 class="hero-title">${edit(document.masthead.first, 'masthead.first')} <strong>${edit(document.masthead.last, 'masthead.last')}</strong></h1>
          <p class="hero-primary">${edit(document.masthead.role, 'masthead.role')}</p>
          <p class="hero-secondary">${edit(document.masthead.subrole, 'masthead.subrole')}</p>
        </div>
        <div class="hero-meta"><span>${edit(document.hero.status, 'hero.status')}</span><span>${edit(document.hero.statusMeta, 'hero.statusMeta')}</span></div>
      </header>

      ${document.capabilities.length ? `<section class="cv-panel capability-bar" data-section="capabilities" aria-label="Professional specializations">${document.capabilities.map((item, index) => `<div class="capability">${cvIcon(capabilityIconNames[index] ?? 'network', 'cv-capability-icon')}<span>${edit(item.label, `capabilities.${index}.label`).replaceAll('\\n', '<br>')}</span></div>`).join('')}</section>` : ''}

      ${document.sections.summary ? `<section class="cv-panel summary-panel" data-section="summary" aria-labelledby="summary-title">${sectionHeading(document.summary.title, 'summary.title', '05 / PROFILE', 'chart-column', 'summary-title', true)}<div class="summary-body">${document.summary.paragraphs.map((item, index) => paragraph(item, `summary.paragraphs.${index}`, 'summary-copy')).join('')}</div></section>` : ''}

      ${document.sections.experience ? `<section class="cv-panel experience-panel" data-section="experience" aria-labelledby="experience-title">${sectionHeading(document.experience.title, 'experience.title', '06 / EXPERIENCE', 'server', 'experience-title', true)}<div class="timeline">${document.experience.items.map(experience).join('')}</div></section>` : ''}

      ${document.sections.systems ? `<section class="cv-panel achievements-panel" data-section="systems" aria-labelledby="systems-title">${sectionHeading(document.systems.title, 'systems.title', '07 / SYSTEMS', 'network', 'systems-title', true)}<div class="achievement-grid">${document.systems.items.map((item, index) => `<article class="achievement" data-system-index="${index}">${cvIcon(item.icon, 'achievement-local-icon')}<strong>${edit(item.title, `systems.items.${index}.title`)}</strong><span>${edit(item.copy, `systems.items.${index}.copy`)}</span></article>`).join('')}</div></section>` : ''}

      <footer class="cv-footer"><div><p class="footer-motto">${edit(document.footer.motto, 'footer.motto')}</p><p class="footer-subtitle">${edit(document.footer.subtitle, 'footer.subtitle')}</p></div><div class="footer-mark">${brandMark()}</div></footer>
    </section>
  </div>`;
