/**
 * Secondary pages: Get help, Search, and Policy version and changes.
 */
import * as h from '../lib/html.mjs'

// ---------------------------------------------------------------------------
// Get help – escalation and specialist contacts (contact details are local
// decisions, so every contact point is marked [Trust to confirm]).
// ---------------------------------------------------------------------------
export function buildHelp(ctx) {
  const { site, policy, md, version, collect } = ctx
  const page = { url: site.urls.help, title: 'Get help', navKey: 'help' }
  const href = (to) => site.href(page.url, to)
  const opts = { pageUrl: page.url, collect, context: 'Get help', anchorUrl: page.url }
  const toConfirm = (text) => {
    collect({ text, context: 'Get help', url: page.url })
    return `<mark class="app-to-confirm">[Trust to confirm: ${text}]</mark>`
  }

  const emergency = h.careCard({
    variant: 'emergency',
    heading: 'Medical emergency',
    level: 2,
    hiddenPrefix: 'Immediate action required',
    html: `<p>For a patient who is unresponsive, has a NEWS2 trigger, respiratory rate below 10, oxygen saturation below target or systolic blood pressure below 90 mmHg, or who is at immediate risk of serious harm, call the Trust emergency number ${toConfirm('emergency number, for example 2222')} and follow the ${md.renderInline('Trust Rapid Tranquillisation Policy', opts)} where imminent violence requires parenteral medication (${`<a href="${href(site.urls.subsection('12.12'))}">section 12.12</a>`}).</p>
<p><a href="${href(site.task('monitor').url)}">Escalation triggers after medication</a></p>`
  })

  // Senior review triggers, each linked to its policy wording
  const seniorReview = `<ul class="nhsuk-list nhsuk-list--bullet">
<li>Haloperidol cumulative dose above 2 mg in 24 hours in older or frail adults, or above 2 mg in 24 hours in younger adults – registrar or consultant review (<a href="${href(site.urls.subsection('12.4'))}">section 12.4</a>).</li>
<li>Anticipated use beyond 48 hours – Care of the Elderly consultant or Liaison Psychiatry (<a href="${href(site.urls.subsection('12.4'))}">section 12.4</a>).</li>
<li>Prolonged QTc, arrhythmia concern, or QTc above 500 ms – senior clinician, cardiology or liaison psychiatry (<a href="${href(site.urls.subsection('12.6'))}">section 12.6</a>).</li>
<li>Haloperidol contraindicated (Parkinson's disease, dementia with Lewy bodies, previous NMS, recent MI) – Liaison Psychiatry for alternatives (<a href="${href(site.urls.subsection('12.7'))}">section 12.7</a>, <a href="${href(site.urls.subsection('13.1'))}">section 13.1</a>).</li>
<li>Any exceptional benzodiazepine use outside withdrawal protocols – senior clinical review (<a href="${href(site.urls.subsection('12.8'))}">section 12.8</a>).</li>
<li>Antipsychotic still required after 7 days, or delirium not resolving – Care of the Elderly or Liaison Psychiatry (<a href="${href(site.urls.subsection('12.10'))}">section 12.10</a>, <a href="${href(site.urls.subsection('13.6'))}">section 13.6</a>).</li>
<li>Patient with delirium actively resisting care, capacity disputed, or DoLS may be inappropriate – Liaison Psychiatry and the MCA/DoLS lead (<a href="${href(site.urls.subsection('14.3'))}">section 14.3</a>).</li>
</ul>`

  // Specialist teams from the roles table in section 5
  const rolesTable = md.tables(policy.section(5).md)[0]
  const wanted = [
    /^Clinical lead for delirium/,
    /^Liaison Psychiatry/,
    /^Care of the Elderly/,
    /^Pharmacists/,
    /^Critical Care/,
    /^MCA \/ Safeguarding lead/,
    /^Security staff/
  ]
  const teams = rolesTable.rows
    .filter((r) => wanted.some((re) => re.test(md.stripMd(r[0]))))
    .map((r) =>
      h.card({
        heading: md.renderInline(r[0].replace(/^\*\*([\s\S]*?)\*\*/, '$1'), opts),
        level: 3,
        html: `<p>${md.renderInline(r[1], opts)}</p><p class="app-contact"><strong>Contact:</strong> ${toConfirm('contact details, bleep or extension, and out-of-hours route')}</p>`,
        classes: 'app-stack-card'
      })
    )
    .join('\n')

  const otherTeams = [
    { name: 'Alcohol care team', why: 'Alcohol withdrawal delirium and the Trust Alcohol Withdrawal Guideline', ref: '13.3' },
    { name: "Parkinson's specialist team / Neurology", why: "Dopaminergic and anticholinergic medication review in Parkinson's disease; alternatives to haloperidol", ref: '13.1' },
    { name: 'Dementia nurse specialist', why: 'Delirium in people living with dementia; "This is Me" and carer passport', ref: '13.2' },
    { name: 'Palliative care', why: 'Terminal agitation and delirium in the last days of life', ref: '13.7' },
    { name: 'Cardiology', why: 'Prolonged QTc or arrhythmia concern before or after haloperidol', ref: '12.6' }
  ]
    .map((tm) =>
      h.card({
        heading: tm.name,
        level: 3,
        html: `<p>${tm.why} (<a href="${href(site.urls.subsection(tm.ref))}">section ${tm.ref}</a>).</p><p class="app-contact"><strong>Contact:</strong> ${toConfirm('contact details and out-of-hours route')}</p>`,
        classes: 'app-stack-card'
      })
    )
    .join('\n')

  // Related Trust documents from the metadata table
  const related = policy
    .metaValue('Related documents')
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
  const documents = `<ul class="nhsuk-list nhsuk-list--bullet">
${related.map((d) => `<li>${md.renderInline(d)} – ${toConfirm('link to the current document')}</li>`).join('\n')}
</ul>`

  const content = `
<span class="nhsuk-caption-l">Escalation and contacts</span>
<h1 class="nhsuk-heading-xl">Get help</h1>
${emergency}
<h2 class="nhsuk-heading-l" id="senior-review">When the policy requires senior or specialist review</h2>
${seniorReview}
<h2 class="nhsuk-heading-l" id="teams">Specialist teams</h2>
<p>Responsibilities are taken from <a href="${href(site.urls.section(5))}">section 5 – Roles and responsibilities</a>. Contact details are a local decision and are not yet set.</p>
${teams}
${otherTeams}
<h2 class="nhsuk-heading-l" id="documents">Related Trust documents</h2>
${documents}
`
  return {
    page,
    html: h.layout({
      site,
      page,
      content,
      rail: `<p class="app-rail__heading">On this page</p>${h.contentsList(
        [
          { text: 'Senior or specialist review', href: '#senior-review' },
          { text: 'Specialist teams', href: '#teams' },
          { text: 'Related Trust documents', href: '#documents' }
        ],
        { label: 'On this page', hiddenHeading: 'On this page' }
      )}`,
      breadcrumbs: [{ text: 'Tasks', href: href(site.urls.hub) }],
      version,
      policyTitle: policy.title
    }),
    searchEntries: [{ title: 'Get help – escalation and specialist contacts', section: 'Get help', url: page.url, text: md.stripTags(content) }]
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export function buildSearch(ctx) {
  const { site, policy, md, version } = ctx
  const page = { url: site.urls.search, title: 'Search', navKey: 'search' }
  const href = (to) => site.href(page.url, to)
  const content = `
<h1 class="nhsuk-heading-xl">Search</h1>
<form class="app-search" id="search-form" action="${href(site.urls.search)}" method="get" data-index="${href(site.urls.searchIndex)}" role="search">
  <div class="nhsuk-form-group">
    <label class="nhsuk-label nhsuk-label--m" for="q">Search the policy and task pages</label>
    <div class="nhsuk-hint" id="q-hint">For example: haloperidol, 4AT, QTc, DoLS, hip fracture</div>
    <div class="app-search__row">
      <input class="nhsuk-input app-search__input" id="q" name="q" type="search" autocomplete="off" aria-describedby="q-hint" enterkeyhint="search">
      <button class="nhsuk-button app-search__button" type="submit" data-module="nhsuk-button">Search</button>
    </div>
  </div>
</form>
<div class="app-search__status nhsuk-body-s" id="search-status" aria-live="polite"></div>
<ol class="nhsuk-list app-results" id="search-results"></ol>
<noscript><p>Search needs JavaScript. Use the <a href="${href(site.urls.policyIndex)}">full policy contents</a> instead.</p></noscript>
<h2 class="nhsuk-heading-m">Or start from a task</h2>
${h.navRows(site.tasks.map((t) => ({ text: t.title, href: href(t.url) })), { label: 'Tasks' })}
`
  return {
    page: { ...page, scripts: `<script src="${site.root(page.url)}javascripts/search.js" defer></script>` },
    html: h.layout({
      site,
      page: { ...page, scripts: `<script src="${site.root(page.url)}javascripts/search.js" defer></script>` },
      content,
      breadcrumbs: [{ text: 'Tasks', href: href(site.urls.hub) }],
      version,
      policyTitle: policy.title
    }),
    searchEntries: []
  }
}

// ---------------------------------------------------------------------------
// Policy version and changes – built last so it can list every [Trust to
// confirm] marker collected while rendering the other pages.
// ---------------------------------------------------------------------------
export function buildAbout(ctx, collected) {
  const { site, policy, md, version, sourceName } = ctx
  const page = { url: site.urls.about, title: 'Policy version and changes', navKey: 'tasks' }
  const href = (to) => site.href(page.url, to)

  const meta = h.summaryList(
    policy.meta.map((m) => ({ key: md.renderInline(m.key), value: md.renderInline(m.value, { pageUrl: page.url }) }))
  )

  // Each policy marker is collected from the task page and from the policy
  // section it comes from. Show it once, preferring the policy location.
  const rank = (i) => (/^(Section|Appendix|Document details)/.test(i.context) ? 0 : 1)
  const seen = new Set()
  const items = [
    { text: 'Exact wording of the medication indication step in the distress pathway', snippet: 'Exact wording of the medication indication step in the distress pathway', context: 'Manage severe distress', url: site.urls.distress },
    ...[...collected].sort((a, b) => rank(a) - rank(b))
  ].filter((i) => {
    const key = (i.snippet || i.text).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const table = `<table class="nhsuk-table nhsuk-table--responsive" role="table">
<caption class="nhsuk-table__caption nhsuk-u-visually-hidden">Items to confirm before ratification</caption>
<thead class="nhsuk-table__head" role="rowgroup"><tr class="nhsuk-table__row" role="row"><th class="nhsuk-table__header" scope="col" role="columnheader">Item</th><th class="nhsuk-table__header" scope="col" role="columnheader">Where</th></tr></thead>
<tbody class="nhsuk-table__body">
${items
  .map(
    (i) => `<tr class="nhsuk-table__row" role="row"><td class="nhsuk-table__cell" role="cell"><span class="nhsuk-table__heading" aria-hidden="true">Item</span><span class="app-table__value">${md.renderInline((i.snippet || i.text).replace(/[*_]/g, ''))}</span></td><td class="nhsuk-table__cell" role="cell"><span class="nhsuk-table__heading" aria-hidden="true">Where</span><span class="app-table__value">${i.url ? `<a href="${href(i.url)}">${i.context || i.url}</a>` : i.context}</span></td></tr>`
  )
  .join('\n')}
</tbody>
</table>`

  const changeLog = md.render(policy.appendix('G').md, { pageUrl: page.url })

  const content = `
<span class="nhsuk-caption-l">Policy and reference</span>
<h1 class="nhsuk-heading-xl">Policy version and changes</h1>
${h.warningCallout({
  heading: `Draft ${version} – not ratified`,
  level: 2,
  html: `<p>${md.renderInline(policy.metaValue('Status'))}. This prototype presents the draft for consultation and is not approved clinical guidance. Follow current Trust policy until this document is ratified.</p>`
})}
<h2 class="nhsuk-heading-l" id="details">Document details</h2>
${meta}
<h2 class="nhsuk-heading-l" id="drafting-note">Drafting note</h2>
${h.insetText(md.render(policy.draftingNote, { pageUrl: page.url }))}
<h2 class="nhsuk-heading-l" id="to-confirm">Items to confirm before ratification</h2>
<p>${items.length} items are marked <mark class="app-to-confirm">[Trust to confirm]</mark> across the policy and this site. Each needs a local decision.</p>
${table}
<h2 class="nhsuk-heading-l" id="change-log">Change log from the previous draft (Appendix G)</h2>
${changeLog}
<h2 class="nhsuk-heading-l" id="about-site">About this site</h2>
<p>Every page is generated from the policy markdown file <code>${sourceName}</code>. Task pages re-arrange the policy's own wording for bedside use; the <a href="${href(site.urls.policyIndex)}">full policy</a> keeps all sections and appendices with their original numbering. Where a task page condenses a section, it links to the source subsection.</p>
`
  return {
    page,
    html: h.layout({
      site,
      page,
      content,
      rail: `<p class="app-rail__heading">On this page</p>${h.contentsList(
        [
          { text: 'Document details', href: '#details' },
          { text: 'Drafting note', href: '#drafting-note' },
          { text: 'Items to confirm', href: '#to-confirm' },
          { text: 'Change log', href: '#change-log' },
          { text: 'About this site', href: '#about-site' }
        ],
        { label: 'On this page', hiddenHeading: 'On this page' }
      )}`,
      breadcrumbs: [{ text: 'Tasks', href: href(site.urls.hub) }],
      version,
      policyTitle: policy.title
    }),
    searchEntries: [
      { title: 'Policy version and changes', section: 'Policy and reference', url: page.url, text: md.stripTags(content) }
    ]
  }
}
