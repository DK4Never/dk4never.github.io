const escapeHtml = (value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
const icon = (name) => `<span class="mask-icon" style="--icon-url: url('../assets/icons/${escapeHtml(name)}.svg')" aria-hidden="true"></span>`;
const edit = (value, field, className = '') => `<span class="editable ${className}" data-field="${escapeHtml(field)}" contenteditable="true" role="textbox" aria-label="${escapeHtml(field)}" tabindex="0" spellcheck="false">${escapeHtml(value)}</span>`;
const paragraph = (value, field, className = '') => `<p class="${className}">${edit(value, field)}</p>`;
const skillBars = (active) => `<span class="skill-bars" role="img" aria-label="${active} out of 10">${Array.from({ length: 10 }, (_, index) => `<i class="${index < active ? 'is-on' : ''}"></i>`).join('')}</span>`;
const brandMark = `<span class="theme-logo-stack" role="img" aria-label="Legend Systems mark">
  <picture class="theme-logo theme-logo--electric"><source srcset="assets/branding/legend-logo-electric-blue.webp" type="image/webp"><img src="assets/branding/legend-logo-electric-blue.png" alt="Legend Systems electric blue logo" width="1024" height="1536"></picture>
  <picture class="theme-logo theme-logo--royal"><source srcset="assets/branding/legend-logo-royal-blue.webp" type="image/webp"><img src="assets/branding/legend-logo-royal-blue.png" alt="Legend Systems royal blue logo" width="1024" height="1536"></picture>
  <picture class="theme-logo theme-logo--industrial"><source srcset="assets/branding/legend-logo-industrial-gold.webp" type="image/webp"><img src="assets/branding/legend-logo-industrial-gold.png" alt="Legend Systems industrial gold logo" width="1024" height="1536"></picture>
  <picture class="theme-logo theme-logo--cyber"><source srcset="assets/branding/legend-logo-cyber-red.webp" type="image/webp"><img src="assets/branding/legend-logo-cyber-red.png" alt="Legend Systems cyber red logo" width="1024" height="1536"></picture>
</span>`;
const sectionHeading = (title, field, code, iconName) => `<div class="section-heading"><h2 class="section-title">${icon(iconName)}${edit(title, field)}</h2><span class="section-code">${code}</span></div><img class="section-divider" src="assets/graphics/section-divider.svg" alt="">`;
const experience = (item, index) => `
  <article class="experience-item" data-section="experience">
    <span class="timeline-marker" aria-hidden="true"></span>
    <div class="experience-heading">
      <div>
        <h3 class="job-title">${edit(item.job, `experience.items.${index}.job`)}</h3>
        <p class="job-company">${edit(item.company, `experience.items.${index}.company`)} <span class="job-location">| ${edit(item.location, `experience.items.${index}.location`)}</span></p>
      </div>
      <p class="job-period">${edit(item.period, `experience.items.${index}.period`)}</p>
    </div>
    ${paragraph(item.description, `experience.items.${index}.description`, 'job-description')}
    <ul class="job-bullets">${item.bullets.map((bullet, bulletIndex) => `<li>› ${edit(bullet, `experience.items.${index}.bullets.${bulletIndex}`)}</li>`).join('')}</ul>
  </article>`;
export const pageOneMarkup = (document) => `
  <div class="page-border" aria-hidden="true"></div>
  <div class="page-grain" aria-hidden="true"></div>
  <div class="page-inner">
    <aside class="cv-side" aria-label="Profile, contact and technology">
      <header class="side-masthead" data-section="masthead">
        <div class="portrait-frame"><img src="${escapeHtml(document.portrait.src)}" alt="Dean Kruger head-and-shoulders portrait" width="1200" height="1500"></div>
        <div class="masthead-copy">
          <p class="masthead-kicker">${edit(document.masthead.kicker, 'masthead.kicker')}</p>
          <h2 class="masthead-name">${edit(document.masthead.first, 'masthead.first')} <strong>${edit(document.masthead.last, 'masthead.last')}</strong></h2>
          <p class="masthead-role">${edit(document.masthead.role, 'masthead.role')}<br>${edit(document.masthead.subrole, 'masthead.subrole')}</p>
        </div>
        <div class="brand-lockup">${brandMark}<div class="brand-lockup-text"><strong>${edit(document.brand.name, 'brand.name')}</strong><span>${edit(document.brand.type, 'brand.type')}</span></div></div>
      </header>

      ${document.sections.contact ? `<section class="cv-panel side-panel contact-panel" data-section="contact" aria-labelledby="contact-title">${sectionHeading(document.contact.title, 'contact.title', '01', 'user')}<ul class="contact-list">
        <li>${icon('location')}${edit(document.contact.location, 'contact.location')}</li>
        <li>${icon('phone')}<a href="tel:+27796436540">${edit(document.contact.phone, 'contact.phone')}</a></li>
        <li>${icon('email')}<a href="mailto:dean.kruger3@gmail.com">${edit(document.contact.email, 'contact.email')}</a></li>
        <li>${icon('globe')}<a href="https://dk4never.github.io/" rel="noopener">${edit(document.contact.site, 'contact.site')}</a></li>
        <li>${icon('github')}<a href="https://github.com/DK4Never" rel="noopener">${edit(document.contact.github, 'contact.github')}</a></li>
      </ul></section>` : ''}

      ${document.sections.profile ? `<section class="cv-panel side-panel profile-panel" data-section="profile" aria-labelledby="profile-title">${sectionHeading(document.profile.title, 'profile.title', '02', 'profile')}${document.profile.paragraphs.map((item, index) => paragraph(item, `profile.paragraphs.${index}`, 'profile-copy')).join('')}<img class="profile-orbit" src="assets/graphics/cybersecurity-lock-ring.svg" alt=""></section>` : ''}

      ${document.sections.skills ? `<section class="cv-panel side-panel skills-panel" data-section="skills" aria-labelledby="skills-title">${sectionHeading(document.skills.title, 'skills.title', '03', 'skills')}<div class="skill-list">${document.skills.items.map((skill, index) => `<div class="skill-row"><span>${edit(skill.name, `skills.items.${index}.name`)}</span>${skillBars(skill.level)}</div>`).join('')}</div><small class="skill-legend">FOCUS LEVEL / EDIT IN BUILDER</small></section>` : ''}

      ${document.sections.technology ? `<section class="cv-panel side-panel stack-panel" data-section="technology" aria-labelledby="stack-title">${sectionHeading(document.technology.title, 'technology.title', '04', 'technology')}<div class="stack-grid">${document.technology.items.map((item, index) => `<div class="stack-chip">${icon(item.icon)}<span>${edit(item.name, `technology.items.${index}.name`)}</span></div>`).join('')}</div></section>` : ''}
    </aside>

    <section class="cv-main" aria-label="Professional content">
      <header class="cv-panel hero-panel" data-section="masthead">
        <svg class="hero-svg" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true"><path class="ghost" d="M3 61h94M9 67h74M18 18h71M18 24h64M46 7v57M68 9v51"></path><path d="M4 55c13-19 23-2 34-17s18 5 27-13 19 1 31-14"></path><path d="M9 61L27 43l10 7 17-21 10 9 14-19 12 7"></path><circle cx="27" cy="43" r="1.8"></circle><circle cx="54" cy="29" r="1.8"></circle><circle cx="78" cy="19" r="1.8"></circle><rect x="57" y="43" width="19" height="12" rx="1"></rect><rect x="80" y="31" width="14" height="9" rx="1"></rect><text x="59" y="48">SYSTEM MAP</text><text x="59" y="52">DATA / FLOW / CONTROL</text><text x="82" y="36">LIVE</text></svg>
        <div class="hero-content"><p class="hero-kicker">${edit(document.masthead.kicker, 'masthead.kicker')}</p><h1 class="hero-title">${edit(document.masthead.first, 'masthead.first')} <strong>${edit(document.masthead.last, 'masthead.last')}</strong></h1><p class="hero-subtitle">${edit(document.masthead.role.toUpperCase(), 'masthead.role')} <i></i> ${edit(document.masthead.subrole.toUpperCase(), 'masthead.subrole')}</p><div class="hero-line"></div></div>
        <div class="hero-quote">${edit(document.hero.quote, 'hero.quote')}<strong>- ${edit(document.hero.quoteAuthor, 'hero.quoteAuthor')}</strong></div><div class="hero-status"><span class="status-dot"></span>${edit(document.hero.status, 'hero.status')}<small>${edit(document.hero.statusMeta, 'hero.statusMeta')}</small></div>
      </header>

      <section class="cv-panel capability-bar" data-section="capabilities" aria-label="Professional specializations">${document.capabilities.map((item, index) => `<div class="capability">${icon(item.icon)}<span>${edit(item.label, `capabilities.${index}.label`).replaceAll('\\n', '<br>')}</span></div>`).join('')}</section>

      ${document.sections.summary ? `<section class="cv-panel summary-panel" data-section="summary" aria-labelledby="summary-title">${sectionHeading(document.summary.title, 'summary.title', '05 / OVERVIEW', 'summary')}<div class="summary-body"><div>${document.summary.paragraphs.map((item, index) => paragraph(item, `summary.paragraphs.${index}`, 'summary-copy')).join('')}</div><div class="summary-graphic"><img src="assets/graphics/network-routes.svg" alt=""><span>${edit(document.summary.graphic, 'summary.graphic')}</span></div></div></section>` : ''}

      ${document.sections.experience ? `<section class="cv-panel experience-panel" data-section="experience" aria-labelledby="experience-title">${sectionHeading(document.experience.title, 'experience.title', '06 / TIMELINE', 'experience')}<div class="timeline">${document.experience.items.map(experience).join('')}</div></section>` : ''}

      ${document.sections.systems ? `<section class="cv-panel achievements-panel" data-section="systems" aria-labelledby="systems-title">${sectionHeading(document.systems.title, 'systems.title', '07 / SYSTEMS', 'achievements')}<div class="achievement-grid">${document.systems.items.map((item, index) => `<article class="achievement">${icon(item.icon)}<strong>${edit(item.title, `systems.items.${index}.title`)}</strong><span>${edit(item.copy, `systems.items.${index}.copy`)}</span></article>`).join('')}</div></section>` : ''}

      <footer class="cv-footer"><div><p class="footer-motto">${edit(document.footer.motto, 'footer.motto')}</p><p class="footer-subtitle">${edit(document.footer.subtitle, 'footer.subtitle')}</p></div><div class="footer-mark">${brandMark}</div></footer>
    </section>
  </div>`;
