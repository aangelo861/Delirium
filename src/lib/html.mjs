/**
 * HTML helpers: nhsuk-frontend component markup and the page shell.
 * Markup mirrors the Nunjucks templates shipped in nhsuk-frontend 10.x.
 */

export const TRUST = 'Chelsea and Westminster Hospital NHS Foundation Trust'

const svg = (path, cls) =>
  `<svg class="nhsuk-icon nhsuk-icon--${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" focusable="false" aria-hidden="true">${path}</svg>`

export const icons = {
  arrowRight: () => svg('<path d="m14.7 6.3 5 5c.2.2.3.4.3.7 0 .3-.1.5-.3.7l-5 5a1 1 0 0 1-1.4-1.4l3.3-3.3H5a1 1 0 0 1 0-2h11.6l-3.3-3.3a1 1 0 1 1 1.4-1.4Z"/>', 'arrow-right'),
  arrowLeft: () => svg('<path d="M10.7 6.3c.4.4.4 1 0 1.4L7.4 11H19a1 1 0 0 1 0 2H7.4l3.3 3.3c.4.4.4 1 0 1.4a1 1 0 0 1-1.4 0l-5-5A1 1 0 0 1 4 12c0-.3.1-.5.3-.7l5-5a1 1 0 0 1 1.4 0Z"/>', 'arrow-left'),
  arrowRightCircle: () => svg('<path d="M12 2a10 10 0 0 0-10 9h11.7l-4-4a1 1 0 0 1 1.5-1.4l5.6 5.7a1 1 0 0 1 0 1.4l-5.6 5.7a1 1 0 0 1-1.5 0 1 1 0 0 1 0-1.4l4-4H2A10 10 0 1 0 12 2z"/>', 'arrow-right-circle'),
  chevronRightCircle: () => svg('<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-.3 5.8a1 1 0 1 0-1.5 1.4l2.9 2.8-2.9 2.8a1 1 0 0 0 1.5 1.4l3.5-3.5c.4-.4.4-1 0-1.4Z"/>', 'chevron-right-circle'),
  tick: () => svg('<path d="M11.4 17.5a2 2 0 0 1-2.7.1h-.1L4 12.8a1.5 1.5 0 0 1 2.1-2L10 14.7l8.1-8.1a1.5 1.5 0 1 1 2.2 2l-8.9 9Z"/>', 'tick'),
  cross: () => svg('<path d="M17 18.5c-.4 0-.8-.1-1.1-.4l-10-10c-.6-.6-.6-1.6 0-2.1.6-.6 1.5-.6 2.1 0l10 10c.6.6.6 1.5 0 2.1-.3.3-.6.4-1 .4z M7 18.5c-.4 0-.8-.1-1.1-.4-.6-.6-.6-1.5 0-2.1l10-10c.6-.6 1.5-.6 2.1 0 .6.6.6 1.5 0 2.1l-10 10c-.3.3-.6.4-1 .4z"/>', 'cross'),
  search: () => svg('<path d="m20.7 18.9-4.1-4.1a7 7 0 1 0-1.4 1.4l4 4.1a1 1 0 0 0 1.5 0c.4-.4.4-1 0-1.4ZM6 10.6a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z"/>', 'search'),
  // App icons (not part of nhsuk-frontend)
  list: () => svg('<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>', 'list'),
  help: () => svg('<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-4.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 6a3.5 3.5 0 0 0-3.5 3.5h2a1.5 1.5 0 1 1 3 0c0 .8-.5 1.1-1.3 1.6-.8.5-1.7 1.2-1.7 2.9v.5h2V14c0-.7.4-1 1.2-1.5.9-.5 1.8-1.2 1.8-3A3.5 3.5 0 0 0 12 6z"/>', 'help')
}

const cls = (...names) => names.filter(Boolean).join(' ')

export function careCard({ variant = 'non-urgent', heading, level = 2, hiddenPrefix, html, id, classes }) {
  const prefixes = { emergency: 'Immediate action required', urgent: 'Urgent advice', 'non-urgent': 'Non-urgent advice' }
  const prefix = hiddenPrefix === null ? '' : `<span class="nhsuk-u-visually-hidden">${hiddenPrefix ?? prefixes[variant]}: </span>`
  return `<div class="${cls('nhsuk-card nhsuk-card--care', `nhsuk-card--care--${variant}`, classes)}"${id ? ` id="${id}"` : ''}>
  <div class="nhsuk-card__heading-container">
    <h${level} class="nhsuk-card__heading nhsuk-heading-m"><span role="text">${prefix}${heading}</span></h${level}>
    <span class="nhsuk-card--care__arrow" aria-hidden="true"></span>
  </div>
  <div class="nhsuk-card__content">
${html}
  </div>
</div>
`
}

export function warningCallout({ heading, html, level = 3, id, classes }) {
  const prefix = /important/i.test(heading) ? '' : '<span class="nhsuk-u-visually-hidden">Important: </span>'
  return `<div class="${cls('nhsuk-card nhsuk-card--warning', classes)}"${id ? ` id="${id}"` : ''}>
  <div class="nhsuk-card__content">
    <h${level} class="nhsuk-card__heading nhsuk-heading-m"><span role="text">${prefix}${heading}</span></h${level}>
${html}
  </div>
</div>
`
}

export function card({ heading, html, href, level = 3, id, classes, feature = false }) {
  const headingHtml = heading
    ? `<h${level} class="nhsuk-card__heading nhsuk-heading-m">${href ? `<a class="nhsuk-card__link" href="${href}">${heading}</a>` : heading}</h${level}>`
    : ''
  return `<div class="${cls('nhsuk-card', href && 'nhsuk-card--clickable', feature && 'nhsuk-card--feature', classes)}"${id ? ` id="${id}"` : ''}>
  <div class="nhsuk-card__content">
    ${headingHtml}
${html}
  </div>
</div>
`
}

export function details({ summary, html, open = false, classes }) {
  return `<details class="${cls('nhsuk-details', classes)}"${open ? ' open' : ''}>
  <summary class="nhsuk-details__summary"><span class="nhsuk-details__summary-text">${summary}</span></summary>
  <div class="nhsuk-details__text">
${html}
  </div>
</details>
`
}

export function insetText(html, hiddenText = 'Information') {
  return `<div class="nhsuk-inset-text"><span class="nhsuk-u-visually-hidden">${hiddenText}: </span>${html}</div>\n`
}

export function actionLink({ href, text, classes }) {
  return `<a class="${cls('nhsuk-action-link', classes)}" href="${href}">${icons.arrowRightCircle()}<span class="nhsuk-action-link__text">${text}</span></a>\n`
}

export function buttonLink({ href, text, classes }) {
  return `<a class="${cls('nhsuk-button', classes)}" href="${href}" role="button" draggable="false" data-module="nhsuk-button">${text}</a>\n`
}

export function tag(text, colour) {
  return `<strong class="${cls('nhsuk-tag', colour && `nhsuk-tag--${colour}`)}">${text}</strong>`
}

export function summaryList(rows, { classes } = {}) {
  return `<dl class="${cls('nhsuk-summary-list', classes)}">
${rows
  .map(
    (r) => `  <div class="nhsuk-summary-list__row">
    <dt class="nhsuk-summary-list__key">${r.key}</dt>
    <dd class="nhsuk-summary-list__value">${r.value}</dd>
  </div>`
  )
  .join('\n')}
</dl>
`
}

export function contentsList(items, { label = 'Contents', hiddenHeading = 'Contents' } = {}) {
  const render = (items) =>
    `<ol class="nhsuk-contents-list__list">
${items
  .map((i) =>
    i.current
      ? `<li class="nhsuk-contents-list__item" aria-current="page"><span class="nhsuk-contents-list__current">${i.text}</span>${i.items ? render(i.items) : ''}</li>`
      : `<li class="nhsuk-contents-list__item"><a class="nhsuk-contents-list__link" href="${i.href}">${i.text}</a>${i.items ? render(i.items) : ''}</li>`
  )
  .join('\n')}
</ol>`
  return `<nav class="nhsuk-contents-list" role="navigation" aria-label="${label}">
  <h2 class="nhsuk-u-visually-hidden">${hiddenHeading}</h2>
${render(items)}
</nav>
`
}

export function pagination({ prev, next }) {
  if (!prev && !next) return ''
  const item = (link, dir) => {
    if (!link) return ''
    const arrow = dir === 'prev' ? icons.arrowLeft() : icons.arrowRight()
    const word = dir === 'prev' ? 'Previous' : 'Next'
    return `<li class="nhsuk-pagination-item--${dir === 'prev' ? 'previous' : 'next'}">
    <a class="nhsuk-pagination__link nhsuk-pagination__link--${dir}" href="${link.href}" rel="${dir}">
      <span class="nhsuk-pagination__title">${word}<span class="nhsuk-u-visually-hidden"> page</span></span>
      <span class="nhsuk-u-visually-hidden">:</span>
      <span class="nhsuk-pagination__page">${link.label}</span>
      ${arrow}
    </a>
  </li>`
  }
  return `<nav class="nhsuk-pagination" role="navigation" aria-label="Pagination">
  <ul class="nhsuk-list nhsuk-pagination__list">
  ${item(prev, 'prev')}
  ${item(next, 'next')}
  </ul>
</nav>
`
}

/** Breadcrumb trail (desktop) with a back link to the last item (mobile). */
export function breadcrumb(items) {
  const last = items[items.length - 1]
  return `<nav class="nhsuk-breadcrumb" aria-label="Breadcrumb">
  <ol class="nhsuk-breadcrumb__list">
${items.map((i) => `    <li class="nhsuk-breadcrumb__list-item"><a class="nhsuk-breadcrumb__link" href="${i.href}">${i.text}</a></li>`).join('\n')}
  </ol>
  <a class="nhsuk-back-link" href="${last.href}"><span class="nhsuk-u-visually-hidden">Back to </span>${last.text}</a>
</nav>
`
}

export function doDontList({ heading, items, icon = 'tick', hidePrefix = false, level = 3, id }) {
  const prefix = !hidePrefix && icon === 'cross' ? 'do not ' : ''
  const iconSvg = icon === 'cross' ? icons.cross() : icons.tick()
  return `<div class="nhsuk-card nhsuk-card--feature app-do-dont"${id ? ` id="${id}"` : ''}>
  <div class="nhsuk-card__content">
    <h${level} class="nhsuk-card__heading nhsuk-heading-m">${heading}</h${level}>
    <ul class="nhsuk-list nhsuk-list--${icon}" role="list">
${items.map((i) => `      <li>${iconSvg}${prefix}${i}</li>`).join('\n')}
    </ul>
  </div>
</div>
`
}

/** Visible checklist using NHS checkboxes. Nothing is stored; boxes print as boxes. */
export function checklist(items, idPrefix = 'check') {
  return `<div class="nhsuk-checkboxes app-checklist">
${items
  .map(
    (item, i) => `  <div class="nhsuk-checkboxes__item">
    <input class="nhsuk-checkboxes__input" id="${idPrefix}-${i + 1}" name="${idPrefix}" type="checkbox" value="${i + 1}">
    <label class="nhsuk-label nhsuk-checkboxes__label" for="${idPrefix}-${i + 1}">${item}</label>
  </div>`
  )
  .join('\n')}
</div>
`
}

/** Compact full-width navigation rows (48px min height). */
export function navRows(items, { label } = {}) {
  return `<ul class="app-nav-rows"${label ? ` aria-label="${label}"` : ''}>
${items
  .map(
    (i) => `  <li class="app-nav-rows__item">
    <a class="app-nav-row" href="${i.href}">
      <span class="app-nav-row__text"><span class="app-nav-row__title">${i.text}</span>${i.description ? `<span class="app-nav-row__description">${i.description}</span>` : ''}</span>
      ${icons.chevronRightCircle()}
    </a>
  </li>`
  )
  .join('\n')}
</ul>
`
}

/**
 * Vertical decision pathway rendered as nested lists.
 * steps: [{ title, html, variant, branches: [{ label, html, steps }] }]
 */
export function pathway(steps, { label } = {}) {
  const renderSteps = (steps) =>
    `<ol class="app-pathway">
${steps
  .map(
    (s) => `  <li class="${cls('app-pathway__step', s.variant && `app-pathway__step--${s.variant}`)}">
    <p class="app-pathway__title">${s.title}</p>
    ${s.html || ''}
    ${s.branches ? renderBranches(s.branches) : ''}
  </li>`
  )
  .join('\n')}
</ol>`
  const renderBranches = (branches) =>
    `<ul class="app-pathway__branches">
${branches
  .map(
    (b) => `  <li class="app-pathway__branch">
    <p class="app-pathway__branch-label">${b.label}</p>
    ${b.html || ''}
    ${b.steps ? renderSteps(b.steps) : ''}
  </li>`
  )
  .join('\n')}
</ul>`
  return `<div class="app-pathway-wrapper" role="group"${label ? ` aria-label="${label}"` : ''}>
${renderSteps(steps)}
</div>
`
}

/** "Source" footer linking to the policy sections a task page draws on. */
export function sourceNote(links) {
  return `<div class="app-source" id="source">
  <h2 class="nhsuk-heading-s">Source in the full policy</h2>
  <ul class="nhsuk-list">
${links.map((l) => `    <li><a href="${l.href}">${l.text}</a></li>`).join('\n')}
  </ul>
</div>
`
}

/** Full HTML document. */
export function layout({ site, page, content, rail = '', breadcrumbs = null, version, policyTitle }) {
  const root = site.root(page.url)
  const href = (to) => site.href(page.url, to)
  const nav = [
    { key: 'tasks', text: 'Tasks', href: href(site.urls.hub) },
    { key: 'policy', text: 'Full policy', href: href(site.urls.policyIndex) },
    { key: 'search', text: 'Search', href: href(site.urls.search) },
    { key: 'help', text: 'Get help', href: href(site.urls.help) }
  ]
  const navHtml = nav
    .map((n) => {
      const current = n.key === page.navKey
      return `<li class="nhsuk-header__navigation-item${current ? ' nhsuk-header__navigation-item--current' : ''}"><a class="nhsuk-header__navigation-link" href="${n.href}"${current ? ' aria-current="page"' : ''}>${current ? `<strong class="nhsuk-header__navigation-item-current-fallback">${n.text}</strong>` : n.text}</a></li>`
    })
    .join('\n          ')
  const bottom = [
    { key: 'tasks', text: 'Tasks', href: href(site.urls.hub), icon: icons.list() },
    { key: 'search', text: 'Search', href: href(site.urls.search), icon: icons.search() },
    { key: 'help', text: 'Get help', href: href(site.urls.help), icon: icons.help() }
  ]
    .map((b) => {
      const current = b.key === page.navKey
      return `<a class="app-bottom-bar__link${current ? ' app-bottom-bar__link--current' : ''}" href="${b.href}"${current ? ' aria-current="page"' : ''}>${b.icon}<span class="app-bottom-bar__label">${b.text}</span></a>`
    })
    .join('\n    ')

  const body = rail
    ? `<div class="app-layout">
        <aside class="app-rail">${rail}</aside>
        <div class="app-content">${content}</div>
      </div>`
    : `<div class="app-content app-content--single">${content}</div>`

  return `<!DOCTYPE html>
<html lang="en" class="app-html">
<head>
  <meta charset="utf-8">
  <title>${page.title} – Delirium policy (draft ${version})</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#005eb8">
  <meta name="robots" content="noindex">
  <meta name="description" content="${page.description || 'Delirium: prevention, recognition and management policy – draft for consultation.'}">
  <link rel="icon" href="${root}assets/images/favicon.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="${root}assets/images/apple-touch-icon.png">
  <link rel="stylesheet" href="${root}stylesheets/app.css">
</head>
<body class="app-body${page.bodyClass ? ` ${page.bodyClass}` : ''}">
<script>document.body.className += ' js-enabled' + ('noModule' in HTMLScriptElement.prototype ? ' nhsuk-frontend-supported' : '');</script>
<a class="nhsuk-skip-link" href="#maincontent" data-module="nhsuk-skip-link">Skip to main content</a>
<header class="nhsuk-header nhsuk-header--white nhsuk-header--organisation app-header" role="banner" data-module="nhsuk-header">
  <div class="nhsuk-header__container nhsuk-width-container">
    <div class="nhsuk-header__service">
      <a class="nhsuk-header__service-logo" href="${href(site.urls.hub)}" aria-label="${TRUST} – Delirium policy homepage">
        <img class="nhsuk-header__organisation-logo" src="${root}assets/images/cw-logo.png" width="280" height="61" alt="${TRUST}">
      </a>
      <span class="nhsuk-header__service-name app-header__service-name">Delirium policy<span class="app-header__service-descriptor">Prevention, recognition and management</span></span>
    </div>
  </div>
  <nav class="nhsuk-header__navigation nhsuk-header__navigation--white app-header__nav" aria-label="Menu">
    <div class="nhsuk-header__navigation-container nhsuk-width-container">
      <ul class="nhsuk-header__navigation-list">
          ${navHtml}
        <li class="nhsuk-header__menu" hidden>
          <button class="nhsuk-header__menu-toggle nhsuk-header__navigation-link" id="toggle-menu" aria-expanded="false"><span class="nhsuk-u-visually-hidden">Browse </span>More</button>
        </li>
      </ul>
    </div>
  </nav>
</header>
<div class="app-status" role="note" aria-label="Document status">
  <div class="nhsuk-width-container">
    <p class="app-status__text"><strong class="nhsuk-tag app-status__tag">Draft ${version}</strong> <span class="app-status__label">Not ratified – for consultation only.</span> <span class="app-status__scope">Adult patients, 18+.</span></p>
  </div>
</div>
<div class="nhsuk-width-container">
  ${breadcrumbs ? breadcrumb(breadcrumbs) : ''}
  <main class="nhsuk-main-wrapper app-main" id="maincontent">
    ${body}
  </main>
</div>
<footer class="nhsuk-footer" role="contentinfo">
  <div class="nhsuk-width-container">
    <div class="app-footer__brand">
      <img class="app-footer__mark" src="${root}assets/images/w-logo.png" width="75" height="38" alt="">
      <p class="nhsuk-body-s app-footer__trust">${TRUST}</p>
    </div>
    <div class="nhsuk-footer__meta">
      <h2 class="nhsuk-u-visually-hidden">Support links</h2>
      <ul class="nhsuk-footer__list">
        <li class="nhsuk-footer__list-item"><a class="nhsuk-footer__list-item-link" href="${href(site.urls.hub)}">Tasks</a></li>
        <li class="nhsuk-footer__list-item"><a class="nhsuk-footer__list-item-link" href="${href(site.urls.policyIndex)}">Full policy</a></li>
        <li class="nhsuk-footer__list-item"><a class="nhsuk-footer__list-item-link" href="${href(site.urls.policyFull)}">Print the full policy</a></li>
        <li class="nhsuk-footer__list-item"><a class="nhsuk-footer__list-item-link" href="${href(site.urls.about)}">Policy version and changes</a></li>
        <li class="nhsuk-footer__list-item"><a class="nhsuk-footer__list-item-link" href="${href(site.urls.help)}">Get help</a></li>
      </ul>
      <p class="nhsuk-body-s">${policyTitle}. Draft ${version} for consultation – not yet ratified. This prototype is not approved clinical guidance; follow current Trust policy.</p>
    </div>
  </div>
</footer>
<nav class="app-bottom-bar" aria-label="Quick links">
    ${bottom}
</nav>
<p class="app-print-footer">Draft ${version} – not ratified, for consultation only. ${policyTitle}. ${TRUST}.</p>
<script type="module">
  import { initAll } from '${root || './'}javascripts/nhsuk-frontend.min.js'
  initAll()
</script>
${page.scripts || ''}
</body>
</html>
`
}
