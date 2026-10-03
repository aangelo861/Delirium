/**
 * Secondary pages: Where to get extra help, and Search.
 */
import * as h from '../lib/html.mjs'

// ---------------------------------------------------------------------------
// Where to get extra help – who to bleep and the reasons to contact them.
//
// Bleep numbers are a local decision: fill in `bleep` below and the page shows
// it; while it is null the page shows a [Trust to confirm] marker.
//
// Each reason is a short label for a point in the policy. `expect` is the
// policy wording the label stands for; the build fails if that wording is no
// longer in the section given by `ref`, so the list cannot drift from the policy.
// ---------------------------------------------------------------------------
const R = {
  haloperidolDose: { text: 'Haloperidol above 2 mg in 24 hours', ref: '12.4', expect: 'above 2 mg in 24 hours without senior review' },
  lorazepamDose: { text: 'Lorazepam above 2 mg in 24 hours', ref: '12.8', expect: '2 mg in 24 hours (senior review required to exceed)' },
  qtcProlonged: { text: 'QTc is prolonged, or there is concern about arrhythmia risk', ref: '12.6', expect: 'If the QTc is prolonged or there is concern regarding arrhythmia risk, seek senior or specialist advice' },
  qtc500: { text: 'QTc above 500 ms', ref: '12.6', expect: 'Discuss with senior clinician / cardiology / liaison psychiatry' },
  benzodiazepine: { text: 'A benzodiazepine is being considered because antipsychotics are contraindicated or high risk', ref: '12.8', expect: 'may be appropriate following senior clinical review' },
  rapidTranq: { text: 'Imminent violence needs rapid tranquillisation', ref: '12.12', expect: 'involves the senior doctor' },
  alternative: { text: 'Haloperidol is contraindicated and an alternative is needed', ref: '12.7', expect: 'Seek specialist advice from Liaison Psychiatry regarding alternative medication where haloperidol is contraindicated' },
  parkinsons: { text: "Medication is unavoidable in Parkinson's disease, parkinsonism or dementia with Lewy bodies", ref: '13.1', expect: 'Discuss with Liaison Psychiatry / Neurology / Care of the Elderly' },
  beyond48h: { text: 'Haloperidol is likely to be needed beyond 48 hours', ref: '12.4', expect: 'Consider consultation with the Care of the Elderly consultant or Liaison Psychiatry' },
  after7days: { text: 'An antipsychotic is still needed after 7 days', ref: '12.10', expect: 'after 7 days must be discussed with Care of the Elderly or Liaison Psychiatry' },
  notResolving: { text: 'Delirium is not resolving', ref: '13.6', expect: 'discuss with Care of the Elderly / Liaison Psychiatry' },
  resisting: { text: 'The patient is actively resisting and DoLS may be inappropriate', ref: '14.3', expect: 'Seek Liaison Psychiatry advice where a patient with delirium is actively resisting and DoLS may be inappropriate' },
  capacityDisputed: { text: 'Capacity is disputed', ref: '5', expect: 'capacity where disputed' },
  frailtyEd: { text: 'A patient with delirium is in the Emergency Department or SDEC', ref: '13.8', expect: 'involve the frailty team early' },
  drugChart: { text: 'Review of the whole drug chart and anticholinergic burden', ref: '10.3', expect: 'Review the whole drug chart with pharmacy' },
  alternativeDose: { text: 'Confirming the dose of an alternative antipsychotic', ref: '12.7', expect: 'must be confirmed against the BNF/Maudsley with pharmacy' },
  covert: { text: 'Covert administration is being considered', ref: '12.11', expect: 'involving pharmacy' },
  dischargePlan: { text: 'An antipsychotic is continuing at discharge and needs a stop or review date', ref: '5', expect: 'ensure a stop date/review plan for any antipsychotic on discharge' },
  dols: { text: 'The patient lacks capacity, is under continuous supervision and control, and is not free to leave (DoLS)', ref: '14.3', expect: 'Involve the MCA/DoLS lead' },
  mcaAdvice: { text: 'Advice on capacity, best interests, restraint or covert medication', ref: '5', expect: 'Advice on capacity, best interests, DoLS applications, restraint and covert medication' },
  safeguarding: { text: 'Safeguarding concerns', ref: '14.5', expect: 'Follow the Safeguarding Adults Policy where there are concerns' },
  parkinsonsDrugs: { text: "Review of anticholinergic and dopaminergic drugs in Parkinson's disease", ref: '13.1', expect: "review anticholinergic and dopaminergic drugs with the Parkinson's specialist team" },
  terminal: { text: 'Terminal agitation, or delirium in the last days of life', ref: '13.7', expect: 'palliative care guidance for terminal agitation' },
  dementia: { text: 'Delirium in a person living with dementia', ref: '13.2', expect: 'involve the dementia nurse specialist' }
}

const CONTACTS = [
  { who: 'Senior doctor (registrar or consultant)', bleep: null, reasons: [R.haloperidolDose, R.lorazepamDose, R.qtcProlonged, R.benzodiazepine, R.rapidTranq] },
  { who: 'Liaison Psychiatry', bleep: null, reasons: [R.alternative, R.parkinsons, R.qtc500, R.beyond48h, R.after7days, R.notResolving, R.resisting, R.capacityDisputed] },
  { who: 'Care of the Elderly / Frailty team', bleep: null, reasons: [R.beyond48h, R.after7days, R.notResolving, R.parkinsons, R.frailtyEd] },
  { who: 'Ward pharmacist', bleep: null, reasons: [R.drugChart, R.alternativeDose, R.covert, R.dischargePlan] },
  { who: 'MCA / DoLS / Safeguarding lead', bleep: null, reasons: [R.dols, R.mcaAdvice, R.safeguarding] },
  { who: 'Cardiology', bleep: null, reasons: [R.qtc500] },
  { who: "Parkinson's specialist team or Neurology", bleep: null, reasons: [R.parkinsonsDrugs, R.parkinsons] },
  { who: 'Palliative care', bleep: null, reasons: [R.terminal] },
  { who: 'Dementia nurse specialist', bleep: null, reasons: [R.dementia] }
]

export function buildHelp(ctx) {
  const { site, policy, md, version } = ctx
  const page = { url: site.urls.help, title: 'Where to get extra help', navKey: 'help' }
  const href = (to) => site.href(page.url, to)
  const toConfirm = (text) => `<mark class="app-to-confirm">[Trust to confirm: ${text}]</mark>`

  const emergency = h.careCard({
    variant: 'emergency',
    heading: 'Medical emergency',
    level: 2,
    hiddenPrefix: 'Immediate action required',
    html: `<p>For a patient who is unresponsive, has a NEWS2 trigger, respiratory rate below 10, oxygen saturation below target or systolic blood pressure below 90 mmHg, or who is at immediate risk of serious harm, call the Trust emergency number ${toConfirm('emergency number, for example 2222')}.</p>
<p><a href="${href(site.task('monitor').url)}">Escalation triggers after medication</a></p>`
  })

  const reason = (r) => {
    const isSub = r.ref.includes('.')
    const source = isSub ? policy.subsection(r.ref).md : policy.section(r.ref).md
    if (!md.stripMd(source).includes(r.expect)) {
      throw new Error(`Extra help: "${r.text}" expects section ${r.ref} to say "${r.expect}", which is no longer in the policy text`)
    }
    const url = isSub ? site.urls.subsection(r.ref) : site.urls.section(r.ref)
    return `<li>${r.text} (<a href="${href(url)}">section ${r.ref}</a>)</li>`
  }

  const cell = (label, html) =>
    `<td class="nhsuk-table__cell" role="cell"><span class="nhsuk-table__heading" aria-hidden="true">${label}</span><span class="app-table__value">${html}</span></td>`
  const table = `<table class="nhsuk-table nhsuk-table--responsive app-contacts" role="table">
<caption class="nhsuk-table__caption nhsuk-u-visually-hidden">Who to contact, their bleep and the reasons to contact them</caption>
<thead class="nhsuk-table__head" role="rowgroup"><tr class="nhsuk-table__row" role="row"><th class="nhsuk-table__header" scope="col" role="columnheader">Who</th><th class="nhsuk-table__header" scope="col" role="columnheader">Bleep</th><th class="nhsuk-table__header" scope="col" role="columnheader">Reasons to contact</th></tr></thead>
<tbody class="nhsuk-table__body">
${CONTACTS.map(
  (c) => `<tr class="nhsuk-table__row" role="row"><th class="nhsuk-table__header" scope="row" role="rowheader"><span class="nhsuk-table__heading" aria-hidden="true">Who</span><span class="app-table__value">${c.who}</span></th>${cell('Bleep', c.bleep || toConfirm('bleep'))}${cell('Reasons to contact', `<ul class="nhsuk-list nhsuk-list--bullet app-contacts__reasons">${c.reasons.map(reason).join('')}</ul>`)}</tr>`
).join('\n')}
</tbody>
</table>`

  const content = `
<h1 class="nhsuk-heading-xl">Where to get extra help</h1>
${emergency}
<h2 class="nhsuk-heading-l" id="contacts">Who to contact</h2>
${table}
`
  return {
    page,
    html: h.layout({
      site,
      page,
      content,
      breadcrumbs: [{ text: 'Where do I start?', href: href(site.urls.hub) }],
      version,
      policyTitle: policy.title
    }),
    searchEntries: [{ title: 'Where to get extra help – bleeps and reasons to contact', section: 'Extra help', url: page.url, text: md.stripTags(content) }]
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
<noscript><p>Search needs JavaScript. Use the <a href="${href(site.urls.policyFull)}">full policy</a> instead.</p></noscript>
<h2 class="nhsuk-heading-m">Or start from a task</h2>
${h.navRows(site.tasks.map((t) => ({ text: t.title, href: href(t.url) })), { label: 'Tasks' })}
`
  return {
    page: { ...page, scripts: `<script src="${site.root(page.url)}javascripts/search.js" defer></script>` },
    html: h.layout({
      site,
      page: { ...page, scripts: `<script src="${site.root(page.url)}javascripts/search.js" defer></script>` },
      content,
      breadcrumbs: [{ text: 'Where do I start?', href: href(site.urls.hub) }],
      version,
      policyTitle: policy.title
    }),
    searchEntries: []
  }
}
