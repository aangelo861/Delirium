/**
 * "Where do I start?" – an interactive decision tree.
 *
 * Scenario → questions → the right part of the policy. Every node is rendered
 * as a section in the HTML; JavaScript (src/js/tree.js) shows one node at a
 * time, keeps the answer trail in history state and routes by URL hash, so the
 * browser Back button and deep links work. Without JavaScript the whole tree
 * is visible and the option links jump between sections.
 *
 * Questions are navigation. Leaf guidance is pulled from the policy model.
 */
import * as h from '../lib/html.mjs'

/** Top-level scenarios (also shown on the hub). `next` is the node to open. */
export const scenarios = [
  { id: 'a-safety', label: 'A patient has new or fluctuating confusion, drowsiness or withdrawal, or is "not themselves"' },
  { id: 'c-risk', label: 'A patient with delirium is distressed, agitated or a risk to themselves or others' },
  { id: 'd-escalate', label: 'Medication has been given for behavioural disturbance' },
  { id: 'e-lifethreat', label: 'Delirium is likely or confirmed and I need to find and treat the cause' },
  { id: 'b-risk', label: 'A patient is at risk of delirium and I want to prevent it' },
  { id: 'f-resolving', label: 'I am planning discharge after delirium' },
  { id: 'g-which', label: "A special situation: Parkinson's or Lewy body dementia, critical care, withdrawal, end of life, dementia, capacity" }
]

export function buildPathway(ctx) {
  const { site, policy, md, version, collect } = ctx
  const page = {
    url: site.urls.pathway,
    title: 'Where do I start?',
    navKey: 'start',
    description: 'Choose the situation and answer a few questions to reach the right part of the delirium policy.',
    scripts: `<script src="${site.root(site.urls.pathway)}javascripts/tree.js" defer></script>`
  }
  const href = (to) => site.href(page.url, to)
  const opts = (extra = {}) => ({ pageUrl: page.url, collect, context: 'Where do I start?', anchorUrl: page.url, taskList: 'list', ...extra })

  const T = {
    sub: (n) => md.render(policy.subsection(n).md, opts()),
    intro: (n) => md.render(policy.section(n).intro, opts()),
    render: (text) => md.render(text, opts()),
    inline: (text) => md.renderInline(text, opts()),
    quote: (n, start) => md.render(md.quote(policy.subsection(n).md, start), opts()),
    secQuote: (n, start) => md.render(md.quote(policy.section(n).md, start), opts()),
    list: (n, i = 0) => md.listItems(policy.subsection(n).md, i),
    secList: (n, i = 0) => md.listItems(policy.section(n).md, i),
    item: (n, start, i = 0) => {
      const it = md.listItems(policy.subsection(n).md, i).find((x) => md.stripMd(x).startsWith(start))
      if (!it) throw new Error(`List item starting "${start}" not found in ${n}`)
      return it
    },
    ul: (items) => `<ul class="nhsuk-list nhsuk-list--bullet">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`,
    subUrl: (n) => href(site.urls.subsection(n)),
    secUrl: (n) => href(site.urls.section(n)),
    taskUrl: (key, anchor) => href(site.task(key).url) + (anchor ? `#${anchor}` : ''),
    appUrl: (l) => href(site.urls.appendix(l))
  }

  const nodes = buildTree(T, href, site, md, policy)
  validate(nodes)

  // ---- Render ----------------------------------------------------------------
  const levelCard = (leaf) => {
    if (leaf.level === 'urgent') return h.careCard({ variant: 'urgent', heading: leaf.heading, level: 2, hiddenPrefix: 'Urgent', html: leaf.html })
    if (leaf.level === 'caution') return h.warningCallout({ heading: leaf.heading, level: 2, html: leaf.html })
    return h.careCard({ variant: 'non-urgent', heading: leaf.heading, level: 2, hiddenPrefix: 'Guidance', html: leaf.html })
  }

  const renderNode = (n) => {
    const caption = `<p class="nhsuk-caption-m app-tree__branch">${n.branch}</p>`
    if (n.leaf) {
      return `<section class="app-tree__node app-tree__node--leaf" id="n-${n.id}" data-node data-kind="leaf" aria-labelledby="n-${n.id}-h">
${caption}
<h2 class="nhsuk-u-visually-hidden" id="n-${n.id}-h" tabindex="-1">${md.stripTags(n.heading)}</h2>
${levelCard(n)}
${n.links && n.links.length ? `<h3 class="nhsuk-heading-s">Go to</h3>${n.links.map((l) => h.actionLink({ href: l.href, text: l.text })).join('')}` : ''}
${n.next ? `<ul class="app-nav-rows app-tree__options"><li class="app-nav-rows__item"><a class="app-nav-row" href="#n-${n.next.id}" data-next="n-${n.next.id}"><span class="app-nav-row__text"><span class="app-nav-row__title">${n.next.label}</span></span>${h.icons.chevronRightCircle()}</a></li></ul>` : ''}
<p class="app-tree__restart"><a class="nhsuk-back-link" href="#n-start" data-next="n-start"><span class="nhsuk-u-visually-hidden">Back to </span>Start again</a></p>
</section>`
    }
    return `<section class="app-tree__node" id="n-${n.id}" data-node data-kind="question" aria-labelledby="n-${n.id}-h">
${caption}
<h2 class="nhsuk-heading-m" id="n-${n.id}-h" tabindex="-1">${n.question}</h2>
${n.intro || ''}
<ul class="app-nav-rows app-tree__options" aria-label="Answers">
${n.options
  .map(
    (o) => `<li class="app-nav-rows__item"><a class="app-nav-row" href="#n-${o.next}" data-next="n-${o.next}"><span class="app-nav-row__text"><span class="app-nav-row__title">${o.label}</span>${o.description ? `<span class="app-nav-row__description">${o.description}</span>` : ''}</span>${h.icons.chevronRightCircle()}</a></li>`
  )
  .join('\n')}
</ul>
${n.id === 'start' ? '' : '<p class="app-tree__restart"><a class="nhsuk-back-link" href="#n-start" data-next="n-start"><span class="nhsuk-u-visually-hidden">Back to </span>Start again</a></p>'}
</section>`
  }

  const content = `
<span class="nhsuk-caption-l">Scenario, questions, then the right part of the policy</span>
<h1 class="nhsuk-heading-xl">Where do I start?</h1>
<p class="app-tree__help">Answer each question. The tree ends at the guidance that applies and links to the task page and policy section. Use your browser's Back button to change an answer.</p>
<div class="app-tree__controls">
  <div class="app-tree__trail" id="tree-trail" hidden><h2 class="nhsuk-heading-s">Your answers</h2><ol class="nhsuk-list" id="tree-trail-list"></ol></div>
  <button type="button" class="nhsuk-button nhsuk-button--secondary nhsuk-button--small app-tree__show-all" id="tree-show-all" hidden aria-pressed="false">Show the whole tree</button>
</div>
<div class="app-tree" id="tree" data-start="n-start">
${nodes.map(renderNode).join('\n')}
</div>
<noscript><p class="nhsuk-inset-text"><span class="nhsuk-u-visually-hidden">Information: </span>JavaScript is off, so the whole tree is shown. Follow the links under each question.</p></noscript>
`

  const html = h.layout({
    site,
    page,
    content,
    breadcrumbs: [{ text: 'Tasks', href: href(site.urls.hub) }],
    version,
    policyTitle: policy.title
  })

  const searchEntries = nodes
    .filter((n) => n.leaf)
    .map((n) => ({
      title: md.stripTags(n.heading),
      section: `Where do I start? – ${n.branch}`,
      url: `${page.url}#n-${n.id}`,
      text: md.stripTags(n.html)
    }))

  return { page, html, searchEntries }
}

function validate(nodes) {
  const ids = new Set()
  for (const n of nodes) {
    if (ids.has(n.id)) throw new Error(`Duplicate tree node id ${n.id}`)
    ids.add(n.id)
  }
  const refs = (n) => (n.leaf ? (n.next ? [n.next.id] : []) : n.options.map((o) => o.next))
  for (const n of nodes) for (const r of refs(n)) if (!ids.has(r)) throw new Error(`Tree node ${n.id} points to missing node ${r}`)
  const seen = new Set(['start'])
  const queue = ['start']
  while (queue.length) {
    const id = queue.shift()
    const n = nodes.find((x) => x.id === id)
    for (const r of refs(n)) if (!seen.has(r)) { seen.add(r); queue.push(r) }
  }
  const unreachable = nodes.filter((n) => !seen.has(n.id)).map((n) => n.id)
  if (unreachable.length) throw new Error(`Unreachable tree nodes: ${unreachable.join(', ')}`)
}

// ---------------------------------------------------------------------------
// Tree content
// ---------------------------------------------------------------------------
function buildTree(T, href, site, md, policy) {
  const A = 'Assess suspected delirium'
  const B = 'Prevent delirium'
  const C = 'Manage severe distress'
  const D = 'Monitor after medication'
  const E = 'Find and treat causes'
  const F = 'Discharge and follow-up'
  const G = 'Special situations and capacity'

  // Reused policy fragments -------------------------------------------------
  const items92 = T.list('9.2')
  const items93 = T.list('9.3')
  const dlbSentence = T.inline(md.splitAt(policy.subsection('9.5').md, ['Dementia with Lewy bodies (']).pop())
  const sec6 = policy.section(6).md
  const sec16 = T.secList(16)
  const md129 = policy.subsection('12.9').md
  const [standard, increased, repeatObs, escalate, equipment] = md.splitAt(md.quote(md129, 'Frequency:'), [
    'Increase to',
    '**Repeat observations',
    'Escalate any',
    'Resuscitation equipment'
  ])
  const mdE = policy.appendix('E').md
  const [repeatE, escalateE] = md.splitAt(md.quote(mdE, 'Repeat this set of observations'), ['Escalate immediately'])
  const obsList = T.ul(T.list('12.9').map((o) => T.inline(o)))
  const t124 = md.tables(policy.subsection('12.4').md)[0]
  const row124 = (name) => {
    const r = t124.rows.find((x) => md.stripMd(x[0]) === name)
    if (!r) throw new Error(`Row ${name} not found in 12.4`)
    return r
  }
  const doseRows = h.summaryList([
    { key: 'Repeat dosing', value: T.inline(row124('Repeat dosing')[1]) },
    { key: 'Cumulative 24-hour limits and senior review', value: T.inline(row124('Maximum')[1]) }
  ])
  const notIndication = T.render(
    policy
      .subsection('12.2')
      .md.split('\n')
      .filter((l) => l.startsWith('>'))
      .join('\n')
  )

  const link = (text, href) => ({ text, href })
  const taskL = (key, text, anchor) => link(text || site.task(key).title, T.taskUrl(key, anchor))
  const subL = (n, text) => link(text || `Section ${n} – ${policy.subsection(n).title}`, T.subUrl(n))
  const secL = (n, text) => link(text || `Section ${n} – ${policy.section(n).title}`, T.secUrl(n))
  const help = link('Get help – senior and specialist contacts', href(site.urls.help))

  return [
    // ---- Start ------------------------------------------------------------
    {
      id: 'start',
      branch: 'Start',
      question: 'What is the situation?',
      options: scenarios.map((s) => ({ label: s.label, next: s.id }))
    },

    // ---- A. Assess ---------------------------------------------------------
    {
      id: 'a-safety',
      branch: A,
      question: 'Has the immediate safety assessment been done?',
      intro: `<p>ABCDE, observations (NEWS2), capillary glucose, oxygen saturation, pain, bladder scan, bowel chart, medication chart and a drug and alcohol history.</p>`,
      options: [
        { label: 'Yes', next: 'a-setting' },
        { label: 'Not yet', next: 'a-safety-leaf' }
      ]
    },
    {
      id: 'a-safety-leaf',
      branch: A,
      leaf: true,
      level: 'urgent',
      heading: 'Do the immediate safety assessment now',
      html: T.sub('9.1'),
      links: [taskL('assess'), subL('9.1')],
      next: { id: 'a-setting', label: 'Done – continue to the assessment tool' }
    },
    {
      id: 'a-setting',
      branch: A,
      question: 'Which care setting?',
      options: [
        { label: 'Ward, Emergency Department, SDEC or long-term care', next: 'a-4at' },
        { label: 'Critical care or post-operative recovery', next: 'a-icu-leaf' }
      ]
    },
    {
      id: 'a-icu-leaf',
      branch: A,
      leaf: true,
      level: 'info',
      heading: 'Use the CAM-ICU or ICDSC',
      html: `<p>${T.inline(items92[1])}</p>${T.sub('13.4')}`,
      links: [subL('13.4'), taskL('assess')]
    },
    {
      id: 'a-4at',
      branch: A,
      question: 'What is the 4AT score?',
      intro: `<p><a href="https://www.the4at.com" rel="noopener">Open the official 4AT form (the4at.com)</a> · <a href="${T.appUrl('A')}">Appendix A – items and scoring</a></p>`,
      options: [
        { label: '4 or more', next: 'a-probable-leaf' },
        { label: '1 to 3', next: 'a-possible-leaf' },
        { label: '0', next: 'a-unlikely-leaf' },
        { label: 'Not done yet', next: 'a-do4at-leaf' }
      ]
    },
    {
      id: 'a-do4at-leaf',
      branch: A,
      leaf: true,
      level: 'info',
      heading: 'Do the 4AT',
      html: `<p>${T.inline(items92[0])}</p><p>${T.inline(items92[3])}</p>`,
      links: [link('Official 4AT form (the4at.com)', 'https://www.the4at.com'), link('Appendix A – 4AT items and scoring', T.appUrl('A'))],
      next: { id: 'a-4at', label: 'Enter the score' }
    },
    {
      id: 'a-probable-leaf',
      branch: A,
      leaf: true,
      level: 'urgent',
      heading: 'Probable delirium – confirm, document, then treat the cause',
      html: `<p>${T.inline(items92[2])}</p>${T.ul(items93.map((i) => T.inline(i)))}`,
      links: [taskL('assess', 'Making the diagnosis', 'making-the-diagnosis'), taskL('causes'), secL(11)],
      next: { id: 'e-lifethreat', label: 'Next: find and treat the cause' }
    },
    {
      id: 'a-possible-leaf',
      branch: A,
      leaf: true,
      level: 'caution',
      heading: 'Possible cognitive impairment – delirium is not excluded',
      html: `<p>${T.inline(items92[2])}</p><p>${T.inline(items93[2])}</p>${T.sub('9.4')}`,
      links: [taskL('assess', 'Collateral history and baseline', 'collateral-history'), subL('9.5'), taskL('causes')]
    },
    {
      id: 'a-unlikely-leaf',
      branch: A,
      leaf: true,
      level: 'info',
      heading: 'Delirium unlikely – but not excluded if the history is suggestive',
      html: `<p>${T.inline(items92[2])}</p>${T.sub('8.2')}<p><strong>Repeat the 4AT if any of these occur:</strong></p>${T.sub('8.3')}`,
      links: [taskL('assess', 'When to do a 4AT', 'when-to-do-a-4at'), taskL('prevent')]
    },

    // ---- B. Prevent --------------------------------------------------------
    {
      id: 'b-risk',
      branch: B,
      question: 'Does the patient have any of these risk factors?',
      intro: T.ul(T.secList(6, 0).map((i) => T.inline(i))),
      options: [
        { label: 'Yes – at least one', next: 'b-atrisk-leaf' },
        { label: 'No', next: 'b-notrisk-leaf' },
        { label: 'Not sure about cognition', next: 'b-unsure-leaf' }
      ]
    },
    {
      id: 'b-atrisk-leaf',
      branch: B,
      leaf: true,
      level: 'urgent',
      heading: 'At risk of delirium – act within 24 hours of admission',
      html: `${T.secQuote(6, 'If any one of these is present')}${T.ul(T.secList(6, 1).map((i) => T.inline(i)))}`,
      links: [taskL('prevent'), secL(7), taskL('assess', 'Baseline 4AT')]
    },
    {
      id: 'b-notrisk-leaf',
      branch: B,
      leaf: true,
      level: 'info',
      heading: 'Not in the NICE at-risk group – still observe daily',
      html: `${T.sub('8.2')}${T.secQuote(6, 'Additional recognised precipitating')}`,
      links: [taskL('prevent'), taskL('assess', 'When to do a 4AT', 'when-to-do-a-4at')]
    },
    {
      id: 'b-unsure-leaf',
      branch: B,
      leaf: true,
      level: 'info',
      heading: 'If in doubt about cognition',
      html: `<p>${T.inline(T.secList(6, 0)[1])}</p>${T.sub('9.4')}`,
      links: [secL(6), subL('9.4')],
      next: { id: 'b-risk', label: 'Back to the risk factors' }
    },

    // ---- C. Distress -------------------------------------------------------
    {
      id: 'c-risk',
      branch: C,
      question: 'Is there an immediate and serious risk of physical harm to the patient or others?',
      options: [
        { label: 'Yes', next: 'c-urgent-leaf' },
        { label: 'No', next: 'c-needs' }
      ]
    },
    {
      id: 'c-urgent-leaf',
      branch: C,
      leaf: true,
      level: 'urgent',
      heading: 'Immediate and serious risk',
      html: `<p>${T.inline(T.item('12.1', 'Where there is an immediate and serious risk'))}</p>${T.sub('12.12')}`,
      links: [help, taskL('distress')],
      next: { id: 'c-pd', label: 'Continue to the pre-prescribing checks' }
    },
    {
      id: 'c-needs',
      branch: C,
      question: 'Have you looked for an unmet need or physical cause, and tried de-escalation?',
      options: [
        { label: 'Not yet', next: 'c-deesc-leaf' },
        { label: 'Yes – the patient has settled', next: 'c-settled-leaf' },
        { label: 'Yes – still severely distressed or at risk', next: 'c-why' }
      ]
    },
    {
      id: 'c-deesc-leaf',
      branch: C,
      leaf: true,
      level: 'info',
      heading: 'Unmet needs and de-escalation come first',
      html: T.sub('11.2'),
      links: [taskL('distress'), subL('11.1')],
      next: { id: 'c-needs', label: 'Done – what happened?' }
    },
    {
      id: 'c-settled-leaf',
      branch: C,
      leaf: true,
      level: 'info',
      heading: 'Continue non-pharmacological care and review',
      html: `${T.intro(11)}${T.quote('12.2', 'Medication should only be considered')}`,
      links: [secL(11), taskL('causes'), taskL('distress')]
    },
    {
      id: 'c-why',
      branch: C,
      question: 'What is driving the consideration of medication?',
      options: [
        { label: 'Severe distress due to delirium', next: 'c-pd' },
        { label: 'Immediate risk of harm to themselves or others', next: 'c-pd' },
        { label: 'Preventing essential investigation or treatment that cannot safely be delayed', next: 'c-pd' },
        {
          label: 'Falls risk, wandering, calling out, refusing care that can wait, night-time restlessness alone, hypoactive delirium or staff convenience',
          next: 'c-notind-leaf'
        }
      ]
    },
    {
      id: 'c-notind-leaf',
      branch: C,
      leaf: true,
      level: 'caution',
      heading: 'Not an indication for medication',
      html: `${notIndication}${T.intro(11)}`,
      links: [subL('12.2'), subL('11.1'), taskL('distress')]
    },
    {
      id: 'c-pd',
      branch: C,
      question: "Does the patient have Parkinson's disease, parkinsonism or dementia with Lewy bodies?",
      options: [
        { label: 'Yes', next: 'c-pd-leaf' },
        { label: 'No', next: 'c-cardiac' },
        { label: 'Not sure', next: 'c-pd-unsure-leaf' }
      ]
    },
    {
      id: 'c-pd-leaf',
      branch: C,
      leaf: true,
      level: 'urgent',
      heading: 'Do not use haloperidol',
      html: T.sub('13.1'),
      links: [taskL('distress', 'Alternative antipsychotics', 'alternatives'), subL('13.1'), help]
    },
    {
      id: 'c-pd-unsure-leaf',
      branch: C,
      leaf: true,
      level: 'caution',
      heading: 'Exclude parkinsonism and Lewy body dementia before any antipsychotic',
      html: `<p>${dlbSentence}</p><p>${T.inline(T.item('12.3', "Parkinson's disease"))}</p>`,
      links: [subL('9.5'), subL('12.5')],
      next: { id: 'c-pd', label: 'Answer again' }
    },
    {
      id: 'c-cardiac',
      branch: C,
      question: 'Any of these?',
      intro: T.ul(T.list('12.5').slice(2).map((i) => T.inline(i))),
      options: [
        { label: 'Yes', next: 'c-contra-leaf' },
        { label: 'No', next: 'c-withdrawal' }
      ]
    },
    {
      id: 'c-contra-leaf',
      branch: C,
      leaf: true,
      level: 'urgent',
      heading: 'Haloperidol contraindicated or high risk – senior or specialist advice',
      html: `<p>${T.inline(T.item('12.6', 'If the QTc is prolonged', 1))}</p>${T.quote('12.7', "NICE doesn't recommend")}${T.quote('12.8', 'In exceptional circumstances')}`,
      links: [taskL('distress', 'Alternative antipsychotics', 'alternatives'), taskL('distress', 'Benzodiazepines and lorazepam', 'benzodiazepines'), help]
    },
    {
      id: 'c-withdrawal',
      branch: C,
      question: 'Is this alcohol or benzodiazepine withdrawal?',
      options: [
        { label: 'Yes', next: 'c-withdrawal-leaf' },
        { label: 'No', next: 'c-halo-leaf' }
      ]
    },
    {
      id: 'c-withdrawal-leaf',
      branch: C,
      leaf: true,
      level: 'urgent',
      heading: 'Manage under the alcohol withdrawal guideline',
      html: T.sub('13.3'),
      links: [subL('13.3'), help, taskL('special')]
    },
    {
      id: 'c-halo-leaf',
      branch: C,
      leaf: true,
      level: 'caution',
      heading: 'Haloperidol may be considered – complete the safety checks first',
      html: `${T.sub('12.3')}<p><strong>Then use the haloperidol reference card.</strong> Oral first, lowest clinically appropriate dose.</p>${doseRows}`,
      links: [taskL('distress', 'Haloperidol reference card', 'haloperidol'), subL('12.4'), subL('12.6')],
      next: { id: 'd-escalate', label: 'After any dose: monitoring' }
    },

    // ---- D. Monitor --------------------------------------------------------
    {
      id: 'd-escalate',
      branch: D,
      question: 'Since the dose, is there any of these?',
      intro: `<p>${T.inline(escalateE)}</p>`,
      options: [
        { label: 'Yes', next: 'd-urgent-leaf' },
        { label: 'No', next: 'd-freq' }
      ]
    },
    {
      id: 'd-urgent-leaf',
      branch: D,
      leaf: true,
      level: 'urgent',
      heading: 'Escalate immediately',
      html: `<p>${T.inline(escalate)}</p><p>${T.inline(equipment)}</p>`,
      links: [taskL('monitor'), help]
    },
    {
      id: 'd-freq',
      branch: D,
      question: 'Any of these?',
      intro: `<p>${T.inline(increased.replace(/^Increase to \*\*every 15 minutes\*\* for at least the first hour if:\s*/, '')).replace(/^\w/, (c) => c.toUpperCase())}</p>`,
      options: [
        { label: 'Yes', next: 'd-q15-leaf' },
        { label: 'No', next: 'd-std-leaf' }
      ]
    },
    {
      id: 'd-q15-leaf',
      branch: D,
      leaf: true,
      level: 'urgent',
      heading: 'Monitor every 15 minutes for at least the first hour',
      html: `<p>${T.inline(increased)}</p><p>${T.inline(repeatObs)}</p>${obsList}`,
      links: [taskL('monitor'), link('Appendix E – monitoring record', T.appUrl('E'))],
      next: { id: 'd-review', label: 'Next: further dose or daily review' }
    },
    {
      id: 'd-std-leaf',
      branch: D,
      leaf: true,
      level: 'info',
      heading: 'Monitor at 15 to 30 minutes, then at least hourly',
      html: `<p>${T.inline(standard.replace(/^\*\*Frequency:\*\*\s*(\w)/, (m, c) => c.toUpperCase()))}</p><p>${T.inline(repeatObs)}</p>${obsList}`,
      links: [taskL('monitor'), link('Appendix E – monitoring record', T.appUrl('E'))],
      next: { id: 'd-review', label: 'Next: further dose or daily review' }
    },
    {
      id: 'd-review',
      branch: D,
      question: 'Is a further dose being considered?',
      options: [
        { label: 'Yes', next: 'd-further-leaf' },
        { label: 'No', next: 'd-daily-leaf' }
      ]
    },
    {
      id: 'd-further-leaf',
      branch: D,
      leaf: true,
      level: 'caution',
      heading: 'Before any further dose',
      html: `<p>${T.inline(repeatObs)}</p><p>${T.inline(repeatE)}</p>${doseRows}`,
      links: [taskL('distress', 'Haloperidol reference card', 'haloperidol'), taskL('monitor')],
      next: { id: 'd-escalate', label: 'After the dose: monitoring' }
    },
    {
      id: 'd-daily-leaf',
      branch: D,
      leaf: true,
      level: 'info',
      heading: 'Daily review and stopping',
      html: T.sub('12.10'),
      links: [taskL('monitor', 'Daily review and stopping', 'daily-review'), taskL('discharge')]
    },

    // ---- E. Causes ---------------------------------------------------------
    {
      id: 'e-lifethreat',
      branch: E,
      question: 'Have life-threatening causes been excluded?',
      intro: '<p>Hypoxia, hypotension, hypoglycaemia, intoxication or withdrawal.</p>',
      options: [
        { label: 'Yes', next: 'e-where' },
        { label: 'Not yet', next: 'e-safety-leaf' }
      ]
    },
    {
      id: 'e-safety-leaf',
      branch: E,
      leaf: true,
      level: 'urgent',
      heading: 'Exclude life-threatening causes now',
      html: T.sub('9.1'),
      links: [taskL('causes'), subL('9.1')],
      next: { id: 'e-where', label: 'Done – continue' }
    },
    {
      id: 'e-where',
      branch: E,
      question: 'Where are you with the cause?',
      options: [
        { label: 'Starting the work-up', next: 'e-workup-leaf' },
        { label: 'A cause has been found', next: 'e-treat-leaf' },
        { label: 'No cause found, or delirium is not resolving', next: 'e-persist-leaf' }
      ]
    },
    {
      id: 'e-workup-leaf',
      branch: E,
      leaf: true,
      level: 'info',
      heading: 'Bedside checklist, investigations and medication review',
      html: `${T.sub('10.1')}${T.render(md.quote(policy.appendix('B').md, 'PINCH ME'))}<p>${T.inline(md.splitAt(policy.subsection('10.3').md, ['Particular culprits'])[0])}</p>`,
      links: [taskL('causes'), subL('10.2'), subL('10.3')]
    },
    {
      id: 'e-treat-leaf',
      branch: E,
      leaf: true,
      level: 'info',
      heading: 'Treat what you find',
      html: `${T.sub('10.4')}${T.intro(11)}`,
      links: [taskL('causes', 'Treat what you find', 'treat-what-you-find'), secL(11)]
    },
    {
      id: 'e-persist-leaf',
      branch: E,
      leaf: true,
      level: 'caution',
      heading: 'Delirium that does not resolve',
      html: T.sub('13.6'),
      links: [subL('13.6'), help, taskL('special')]
    },

    // ---- F. Discharge ------------------------------------------------------
    {
      id: 'f-resolving',
      branch: F,
      question: 'Is the delirium resolving?',
      options: [
        { label: 'Yes', next: 'f-meds' },
        { label: 'No', next: 'f-not-leaf' }
      ]
    },
    {
      id: 'f-not-leaf',
      branch: F,
      leaf: true,
      level: 'caution',
      heading: 'Do not discharge until delirium is resolving',
      html: `<p>${T.inline(sec16[0])}</p>`,
      links: [taskL('discharge'), subL('13.6')]
    },
    {
      id: 'f-meds',
      branch: F,
      question: 'Is an antipsychotic or benzodiazepine started for delirium still prescribed?',
      options: [
        { label: 'Yes', next: 'f-meds-leaf' },
        { label: 'No', next: 'f-check-leaf' }
      ]
    },
    {
      id: 'f-meds-leaf',
      branch: F,
      leaf: true,
      level: 'caution',
      heading: 'Stop before discharge, or state an explicit plan',
      html: `<p>${T.inline(T.list('12.10')[2])}</p><p>${T.inline(sec16[2])}</p>`,
      links: [taskL('discharge'), taskL('monitor', 'Daily review and stopping', 'daily-review')],
      next: { id: 'f-check-leaf', label: 'Continue to the discharge checklist' }
    },
    {
      id: 'f-check-leaf',
      branch: F,
      leaf: true,
      level: 'info',
      heading: 'Discharge summary, follow-up and family information',
      html: `<ol class="nhsuk-list nhsuk-list--number">${[sec16[1], sec16[3], sec16[4], sec16[5]].map((i) => `<li>${T.inline(i)}</li>`).join('')}</ol>`,
      links: [taskL('discharge', 'Discharge checklist (Appendix F)', 'discharge-checklist'), secL(15), secL(16)]
    },

    // ---- G. Special situations --------------------------------------------
    {
      id: 'g-which',
      branch: G,
      question: 'Which applies?',
      options: [
        { label: "Parkinson's disease, parkinsonism or dementia with Lewy bodies", next: 'g-pd-leaf' },
        { label: 'Delirium in a person living with dementia', next: 'g-dementia-leaf' },
        { label: 'Alcohol or substance withdrawal', next: 'g-withdrawal-leaf' },
        { label: 'Critical care or post-operative recovery', next: 'g-icu-leaf' },
        { label: 'Hip fracture or perioperative care', next: 'g-hip-leaf' },
        { label: 'Delirium that does not resolve', next: 'g-persist-leaf' },
        { label: 'End of life', next: 'g-eol-leaf' },
        { label: 'Emergency Department or SDEC', next: 'g-ed-leaf' },
        { label: 'Younger adult (under 65)', next: 'g-young-leaf' },
        { label: 'Capacity, restraint or deprivation of liberty', next: 'g-capacity-leaf' }
      ]
    },
    { id: 'g-pd-leaf', branch: G, leaf: true, level: 'urgent', heading: "Parkinson's disease, parkinsonism and dementia with Lewy bodies", html: T.sub('13.1'), links: [taskL('special', null, 'parkinsons'), taskL('distress', 'Alternative antipsychotics', 'alternatives')] },
    { id: 'g-dementia-leaf', branch: G, leaf: true, level: 'info', heading: 'Delirium in people living with dementia', html: T.sub('13.2'), links: [taskL('special', null, 'dementia'), subL('9.5')] },
    { id: 'g-withdrawal-leaf', branch: G, leaf: true, level: 'urgent', heading: 'Alcohol and substance withdrawal', html: T.sub('13.3'), links: [taskL('special', null, 'withdrawal'), help] },
    { id: 'g-icu-leaf', branch: G, leaf: true, level: 'info', heading: 'Critical care and post-operative recovery', html: T.sub('13.4'), links: [taskL('special', null, 'critical-care'), taskL('assess')] },
    { id: 'g-hip-leaf', branch: G, leaf: true, level: 'info', heading: 'Hip fracture and perioperative care', html: T.sub('13.5'), links: [taskL('special', null, 'hip-fracture'), taskL('prevent')] },
    { id: 'g-persist-leaf', branch: G, leaf: true, level: 'caution', heading: 'Delirium that does not resolve', html: T.sub('13.6'), links: [taskL('special', null, 'persistent'), help] },
    { id: 'g-eol-leaf', branch: G, leaf: true, level: 'info', heading: 'End of life', html: T.sub('13.7'), links: [taskL('special', null, 'end-of-life'), help] },
    { id: 'g-ed-leaf', branch: G, leaf: true, level: 'info', heading: 'Emergency Department and SDEC', html: T.sub('13.8'), links: [taskL('special', null, 'emergency-department'), taskL('assess')] },
    { id: 'g-young-leaf', branch: G, leaf: true, level: 'info', heading: 'Younger adults', html: T.sub('13.9'), links: [taskL('special', null, 'younger-adults'), taskL('distress')] },
    {
      id: 'g-capacity-leaf',
      branch: G,
      leaf: true,
      level: 'info',
      heading: 'Mental capacity, restraint and deprivation of liberty',
      html: T.sub('14.1'),
      links: [taskL('special', 'Capacity, restraint and DoLS', 'capacity'), subL('14.2'), subL('14.3'), help]
    }
  ]
}
