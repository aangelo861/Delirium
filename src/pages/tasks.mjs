/**
 * The seven task pages.
 *
 * Each page follows the same order: immediate action or warning → short
 * pathway or checklist → supporting detail → source section. Clinical wording is
 * pulled from the policy model (subsections, quoted paragraphs, list items and
 * tables); hand-written text is limited to navigation and labels.
 */
import * as h from '../lib/html.mjs'

export function buildTasks(ctx) {
  return [assess, distress, monitor, causes, prevent, discharge, special].map((fn) => buildTaskPage(ctx, fn))
}

function buildTaskPage(ctx, fn) {
  const { site, policy, md, version, collect } = ctx
  const task = site.task(fn.key)
  const page = { url: task.url, title: task.title, navKey: 'tasks', description: task.description }
  const href = (to) => site.href(page.url, to)
  const renderOpts = (extra = {}) => ({
    pageUrl: page.url,
    collect,
    context: task.title,
    anchorUrl: page.url,
    taskList: 'list',
    ...extra
  })

  // Helpers bound to this page
  const tools = {
    site,
    policy,
    md,
    page,
    href,
    /** Rendered body of a subsection */
    sub: (n, extra) => md.render(policy.subsection(n).md, renderOpts(extra)),
    subTitle: (n) => `${n} ${policy.subsection(n).title}`,
    subLink: (n, text) => `<a href="${href(site.urls.subsection(n))}">${text || `Section ${n}`}</a>`,
    secLink: (n, text) => `<a href="${href(site.urls.section(n))}">${text || `Section ${n}`}</a>`,
    appLink: (l, text) => `<a href="${href(site.urls.appendix(l))}">${text || `Appendix ${l}`}</a>`,
    render: (mdText, extra) => md.render(mdText, renderOpts(extra)),
    inline: (mdText, extra) => md.renderInline(mdText, renderOpts(extra)),
    quote: (n, start, extra) => md.render(md.quote(policy.subsection(n).md, start), renderOpts(extra)),
    secQuote: (n, start, extra) => md.render(md.quote(policy.section(n).md, start), renderOpts(extra)),
    list: (n, index = 0) => md.listItems(policy.subsection(n).md, index),
    secList: (n, index = 0) => md.listItems(policy.section(n).md, index),
    tables: (n) => md.tables(policy.subsection(n).md),
    secTables: (n) => md.tables(policy.section(n).md),
    appTables: (l) => md.tables(policy.appendix(l).md),
    appendix: (l, extra) => md.render(policy.appendix(l).md, renderOpts(extra)),
    taskLink: (key, text) => `<a href="${href(site.task(key).url)}">${text || site.task(key).title}</a>`,
    taskAction: (key, text) => h.actionLink({ href: href(site.task(key).url), text: text || site.task(key).title }),
    ul: (items) => `<ul class="nhsuk-list nhsuk-list--bullet">\n${items.map((i) => `<li>${i}</li>`).join('\n')}\n</ul>\n`,
    ol: (items, start) => `<ol class="nhsuk-list nhsuk-list--number"${start && start !== 1 ? ` start="${start}"` : ''}>\n${items.map((i) => `<li>${i}</li>`).join('\n')}\n</ol>\n`,
    renderOpts
  }

  const { intro, sections, sources } = fn(tools)

  // Assemble page: intro (always visible) + h2 sections + source note + pagination
  const body = sections
    .map((s) => `<section class="app-section" id="${s.id}" aria-labelledby="${s.id}-heading">
<h2 class="nhsuk-heading-l" id="${s.id}-heading">${s.heading}</h2>
${s.html}
</section>`)
    .join('\n')

  const index = site.tasks.findIndex((t) => t.key === fn.key)
  const prev = site.tasks[index - 1]
  const next = site.tasks[index + 1]
  const paginationHtml = h.pagination({
    prev: prev ? { href: href(prev.url), label: prev.title } : null,
    next: next ? { href: href(next.url), label: next.title } : null
  })

  const content = `
<span class="nhsuk-caption-l">Task</span>
<h1 class="nhsuk-heading-xl">${task.title}</h1>
${intro}
${body}
${h.sourceNote(sources.map((s) => ({ href: href(s.url), text: s.text })))}
${paginationHtml}
`

  const rail = h.contentsList(
    [
      ...sections.map((s) => ({ text: s.heading, href: `#${s.id}` })),
      { text: 'Source in the full policy', href: '#source' }
    ],
    { label: 'On this page', hiddenHeading: 'On this page' }
  )

  const html = h.layout({
    site,
    page,
    content,
    rail: `<p class="app-rail__heading">On this page</p>${rail}<p class="app-rail__heading">Other tasks</p>${h.contentsList(
      site.tasks.map((t) => (t.key === fn.key ? { text: t.title, current: true } : { text: t.title, href: href(t.url) })),
      { label: 'Other tasks', hiddenHeading: 'Other tasks' }
    )}`,
    breadcrumbs: [{ text: 'Tasks', href: href(site.urls.hub) }],
    version,
    policyTitle: policy.title
  })

  const searchEntries = [
    { title: task.title, section: 'Task', url: page.url, text: md.stripTags(intro) },
    ...sections.map((s) => ({
      title: s.heading,
      section: task.title,
      url: `${page.url}#${s.id}`,
      text: md.stripTags(s.html)
    }))
  ]
  return { page, html, searchEntries }
}

// ---------------------------------------------------------------------------
// 1. Assess suspected delirium
// ---------------------------------------------------------------------------
function assess(t) {
  const { sub, quote, list, href, site, subLink, appLink, taskLink, taskAction, tables, appTables, md, render, inline, ul } = t

  const safety = h.careCard({
    variant: 'non-urgent',
    heading: 'Immediate safety assessment',
    level: 2,
    hiddenPrefix: 'Immediate action',
    html: sub('9.1')
  })

  const hypoactive = h.warningCallout({
    heading: 'Quiet, withdrawn or drowsy patients',
    level: 2,
    html: quote('8.1', 'Be particularly vigilant')
  })

  // Care-setting branch, from 9.2 bullets 1 and 2
  const items92 = list('9.2')
  const settingBranch = `<div class="nhsuk-grid-row app-setting-branch">
  <div class="nhsuk-grid-column-one-half">${h.card({ heading: 'Wards, ED, SDEC and long-term care', level: 3, html: `<p>${inline(items92[0])}</p>`, classes: 'app-setting-card' })}</div>
  <div class="nhsuk-grid-column-one-half">${h.card({ heading: 'Critical care or post-operative recovery', level: 3, html: `<p>${inline(items92[1])}</p>`, classes: 'app-setting-card' })}</div>
</div>`

  const items93 = list('9.3')
  const cautionJudgement = inline(items93[1].replace(/^[\s\S]*?(The 4AT supports)/, '$1'))
  const cautionDementia = inline(items93[2])

  const pathwayA = h.pathway(
    [
      {
        title: 'New or fluctuating change',
        html: `<p>Include quiet, withdrawn or drowsy presentations. Any change reported by a carer, relative or staff member must be documented and acted on (${subLink('8.2', 'section 8.2')}).</p>`
      },
      {
        title: 'Immediate safety assessment',
        html: `<p>ABCDE, observations (NEWS2) and capillary glucose, before or alongside cognitive testing (${subLink('9.1', 'section 9.1')}).</p>`
      },
      {
        title: 'Which care setting?',
        branches: [
          { label: 'Critical care or post-operative recovery', html: `<p><strong>CAM-ICU</strong> or <strong>ICDSC</strong></p>` },
          { label: 'Other settings within this policy', html: `<p><strong>4AT</strong> – <a href="https://www.the4at.com" rel="noopener">open the official 4AT form</a></p>` }
        ]
      },
      {
        title: 'Read the result with two cautions',
        html: `<p>${inline(items92[2])}</p>
${h.insetText(`<p>${cautionJudgement}</p><p>${cautionDementia}</p>`, 'Caution')}`
      },
      {
        title: 'Clinical assessment and collateral baseline',
        html: `<p>${inline(items93[0])}</p><p>${inline(items93[3])}</p>`
      },
      {
        title: 'Find and treat causes, and start non-pharmacological care',
        html: `<p>${taskLink('causes')} · ${t.secLink(11, 'Non-pharmacological management (section 11)')}</p>`
      }
    ],
    { label: 'Assess suspected delirium pathway' }
  )

  const intro = `${safety}\n${hypoactive}\n<h2 class="nhsuk-heading-m">Choose the assessment tool by care setting</h2>\n${settingBranch}\n<h2 class="nhsuk-heading-m">Pathway</h2>\n${pathwayA}`

  const appendixA = policyAppendixDetails(t, 'A', '4AT items and scoring – summary from Appendix A')

  const sections = [
    {
      id: 'using-the-4at',
      heading: 'Using the 4AT',
      html: `${h.actionLink({ href: 'https://www.the4at.com', text: 'Open the official 4AT form (the4at.com)' })}
${sub('9.2')}
${appendixA}`
    },
    {
      id: 'when-to-do-a-4at',
      heading: 'When to do a 4AT',
      html: `${sub('8.3')}
<h3 class="nhsuk-heading-s">Indicators at presentation</h3>
${sub('8.1')}
<h3 class="nhsuk-heading-s">Daily observation</h3>
${sub('8.2')}`
    },
    { id: 'making-the-diagnosis', heading: 'Making the diagnosis', html: sub('9.3') },
    { id: 'collateral-history', heading: 'Collateral history and baseline', html: sub('9.4') },
    {
      id: 'delirium-or-dementia',
      heading: 'Delirium or dementia?',
      html: `${sub('9.5')}
<h3 class="nhsuk-heading-s">Quick comparison (Appendix C)</h3>
${md.renderTableMd(appTables('C')[0], t.renderOpts())}
<p>${inline(md.quote(t.policy.appendix('C').md, 'Common dementia subtypes'))}</p>`
    },
    { id: 'risk-assessment', heading: 'Risk assessment', html: sub('9.6') },
    {
      id: 'mental-capacity',
      heading: 'Mental capacity',
      html: `${sub('9.7')}
${h.actionLink({ href: `${href(site.task('special').url)}#capacity`, text: 'Capacity, restraint and DoLS' })}`
    },
    {
      id: 'next-steps',
      heading: 'Next steps',
      html: `${taskAction('causes')}${taskAction('distress', 'Manage severe distress (if the patient is distressed or at risk)')}${h.actionLink({ href: href(site.urls.section(11)), text: 'Non-pharmacological management (section 11)' })}`
    }
  ]

  return {
    intro,
    sections,
    sources: [
      { url: site.urls.section(8), text: 'Section 8 – Recognition: indicators and daily observation' },
      { url: site.urls.section(9), text: 'Section 9 – Assessment and diagnosis' },
      { url: site.urls.appendix('A'), text: 'Appendix A – 4AT items and scoring' },
      { url: site.urls.appendix('C'), text: 'Appendix C – Delirium vs dementia' }
    ]
  }
}
assess.key = 'assess'

/** An appendix rendered inside a details element, with a link to the full page. */
function policyAppendixDetails(t, letter, summary) {
  const a = t.policy.appendix(letter)
  return h.details({
    summary,
    html: `${t.appendix(letter)}<p><a href="${t.href(t.site.urls.appendix(letter))}">Appendix ${letter}: ${a.title}</a></p>`
  })
}

// ---------------------------------------------------------------------------
// 2. Manage severe distress
// ---------------------------------------------------------------------------
function distress(t) {
  const { sub, quote, list, href, site, subLink, taskLink, taskAction, tables, md, render, inline, ul, policy } = t

  // 11.2 – unmet needs and de-escalation
  const deesc = sub('11.2')

  // 12.2 – indications (intro + 3 bullets) and the "Not an indication" list
  const ind = sub('12.2')

  // 12.3 – safety checks as a plain list (no mandatory tick-boxes), with the
  // emergency ECG exception placed beside the ECG item.
  const checks = list('12.3').map((i) => inline(i))
  const ecgExceptionMd = list('12.1').find((i) => md.stripMd(i).startsWith('Where there is an immediate and serious risk'))
  if (!ecgExceptionMd) throw new Error('Emergency ECG exception not found in section 12.1')
  const ecgException = inline(ecgExceptionMd)
  const checksHtml = `<ol class="nhsuk-list nhsuk-list--number app-checks">
${checks
  .map((c) => {
    const isEcg = /ECG/.test(md.stripTags(c)) && /QTc/.test(md.stripTags(c))
    return `<li>${c}${isEcg ? `<div class="app-checks__exception"><strong>Emergency exception:</strong> ${ecgException}</div>` : ''}</li>`
  })
  .join('\n')}
</ol>`

  const pathwayB = h.pathway(
    [
      {
        title: 'Look for acute causes and unmet needs',
        html: `<p>Pain, thirst, hunger, full bladder or bowels, cold or hot, fear, hypoxia, hypoglycaemia, a new acute problem. Use de-escalation where feasible (${subLink('11.2', 'section 11.2')}).</p>`
      },
      {
        title: 'Medication indication met?',
        variant: 'caution',
        html: `<p><mark class="app-to-confirm">[Exact wording requires clinical sign-off]</mark> – see the indications and non-indications above (${subLink('12.2', 'section 12.2')}).</p>`,
        branches: [
          { label: 'No', html: `<p>Continue non-pharmacological care and review (${subLink('11.1', 'section 11.1')}).</p>` },
          {
            label: 'Yes',
            steps: [
              {
                title: 'Pre-prescribing safety checks',
                html: `<p>The checklist above (${subLink('12.3', 'section 12.3')}).</p>`,
                branches: [
                  {
                    label: 'Contraindication or uncertainty',
                    html: `<p>Senior or specialist advice – Liaison Psychiatry, Care of the Elderly (${subLink('12.7', 'section 12.7')}). <a href="${href(site.urls.help)}">Get help</a>.</p>`
                  },
                  {
                    label: 'No contraindication identified',
                    html: `<p><a href="#haloperidol">Haloperidol reference card</a> · <a href="#alternatives">Alternative antipsychotics</a> · <a href="#benzodiazepines">Lorazepam and benzodiazepines</a></p>`
                  }
                ]
              },
              { title: 'Monitoring and reassessment', html: `<p>${taskLink('monitor')} – repeat observations before any further dose.</p>` },
              { title: 'Daily review and stopping', html: `<p>${subLink('12.10', 'Section 12.10')} – stop as soon as clinically appropriate.</p>` }
            ]
          }
        ]
      }
    ],
    { label: 'Manage severe distress pathway' }
  )

  const intro = `
<h2 class="nhsuk-heading-m">Unmet needs and de-escalation first</h2>
${deesc}
<h2 class="nhsuk-heading-m">When medication may be considered</h2>
${ind}
<h2 class="nhsuk-heading-m">Safety checks before prescribing</h2>
${checksHtml}
<h2 class="nhsuk-heading-m">Pathway</h2>
${pathwayB}
`

  // ---- Medication reference --------------------------------------------
  const principles = list('12.1')
  const principleLead = inline(principles[0])
  const principlesRest = h.details({
    summary: 'All prescribing principles (section 12.1)',
    html: ul(principles.map((p) => inline(p)))
  })

  // Haloperidol card
  const avoidList = list('12.5').map((i) => inline(i))
  const cautionPara = quote('12.5', 'Use with particular caution in')
  const adversePara = quote('12.5', 'Adverse effects to watch for')
  const table124 = tables('12.4')[0]
  const halDose = md.tableToSummaryList(table124, {
    ...t.renderOpts(),
    relabel: { Maximum: 'Cumulative 24-hour limits and senior review' }
  })
  const halIntro = quote('12.4', 'NICE does not recommend')
  const halNote = quote('12.4', 'Product information for haloperidol')

  const haloperidol = `<div class="nhsuk-card app-med-card" id="haloperidol">
  <div class="nhsuk-card__content">
    <h3 class="nhsuk-card__heading nhsuk-heading-l">Haloperidol – first line where no contraindication</h3>
    ${h.careCard({
      variant: 'urgent',
      heading: 'Do not use haloperidol in',
      level: 4,
      hiddenPrefix: 'Stop',
      html: ul(avoidList)
    })}
    <h4 class="nhsuk-heading-s">Use with particular caution</h4>
    ${cautionPara}
    <h4 class="nhsuk-heading-s">Indication</h4>
    <p>Only where the indications in ${subLink('12.2', 'section 12.2')} are met and the safety checks in ${subLink('12.3', 'section 12.3')} are complete. ${principleLead}</p>
    ${halIntro}
    <h4 class="nhsuk-heading-s">Route, dose, repeat dosing, limits and duration</h4>
    ${halDose}
    ${halNote}
    <h4 class="nhsuk-heading-s">ECG and QTc</h4>
    ${sub('12.6')}
    <h4 class="nhsuk-heading-s">Adverse effects to watch for</h4>
    ${adversePara}
    <h4 class="nhsuk-heading-s">Monitoring and stopping</h4>
    ${taskAction('monitor', 'Monitor after medication – escalation triggers, timing, observations before any further dose')}
    ${sub('12.10')}
  </div>
</div>`

  // Alternatives (12.7) as stacked cards
  const table127 = tables('12.7')[0]
  const altCards = md.tableRowsToCards(table127, { ...t.renderOpts(), level: 4 })
  const altParas = md.paragraphs(policy.subsection('12.7').md).map((p) => render(p))
  const alternatives = `<div class="app-med-group" id="alternatives">
<h3 class="nhsuk-heading-l">Alternative antipsychotics</h3>
${altParas[0]}
${altCards}
${altParas.slice(1).join('\n')}
</div>`

  // Benzodiazepines (12.8): text, then the lorazepam table as a summary list
  const md128 = policy.subsection('12.8').md
  const [before128] = md.splitAt(md128, ['**Lorazepam – Trust standard**'])
  const table128 = tables('12.8')[0]
  const lorazepam = md.tableToSummaryList(table128, t.renderOpts())
  const after128 = render(md.quote(md128, 'Diazepam, midazolam'))
  const benzodiazepines = `<div class="app-med-group" id="benzodiazepines">
<h3 class="nhsuk-heading-l">Benzodiazepines and lorazepam</h3>
${render(before128)}
<div class="nhsuk-card app-med-card" id="lorazepam">
  <div class="nhsuk-card__content">
    <h4 class="nhsuk-card__heading nhsuk-heading-m">Lorazepam – Trust standard</h4>
    ${lorazepam}
  </div>
</div>
${after128}
</div>`

  const sections = [
    {
      id: 'medication-reference',
      heading: 'Medication reference',
      html: `${h.warningCallout({ heading: 'Medication does not treat delirium', level: 3, html: `<p>${principleLead}</p>` })}
${principlesRest}
${haloperidol}
${alternatives}
${benzodiazepines}`
    },
    {
      id: 'covert-and-rapid-tranquillisation',
      heading: 'Covert administration and rapid tranquillisation',
      html: `<h3 class="nhsuk-heading-m">Covert administration</h3>${sub('12.11')}<h3 class="nhsuk-heading-m">Rapid tranquillisation</h3>${sub('12.12')}`
    },
    {
      id: 'capacity',
      heading: 'Capacity and least restrictive option',
      html: `${sub('9.7')}${h.actionLink({ href: `${href(site.task('special').url)}#capacity`, text: 'Capacity, restraint and DoLS' })}`
    },
    {
      id: 'next-steps',
      heading: 'Next steps',
      html: `${taskAction('monitor')}${taskAction('causes')}${h.actionLink({ href: href(site.urls.help), text: 'Get help – senior and specialist contacts' })}`
    }
  ]

  return {
    intro,
    sections,
    sources: [
      { url: site.urls.subsection('11.2'), text: 'Section 11.2 – De-escalation of distress' },
      { url: site.urls.section(12), text: 'Section 12 – Pharmacological management of severe behavioural disturbance' },
      { url: site.urls.appendix('D'), text: 'Appendix D – One-page quick reference' }
    ]
  }
}
distress.key = 'distress'

// ---------------------------------------------------------------------------
// 3. Monitor after medication
// ---------------------------------------------------------------------------
function monitor(t) {
  const { sub, quote, list, href, site, subLink, appLink, taskAction, md, render, inline, policy } = t

  const md129 = policy.subsection('12.9').md
  const freqPara = md.quote(md129, 'Frequency:')
  const [standard, increased, repeatObs, escalate, equipment] = md.splitAt(freqPara, [
    'Increase to',
    '**Repeat observations',
    'Escalate any',
    'Resuscitation equipment'
  ])
  const mdE = policy.appendix('E').md
  const [repeatE, escalateE] = md.splitAt(md.quote(mdE, 'Repeat this set of observations'), ['Escalate immediately'])

  const escalateCard = h.careCard({
    variant: 'urgent',
    heading: 'Escalate immediately',
    level: 2,
    hiddenPrefix: 'Urgent',
    html: `<p>${inline(escalate)}</p><p>${inline(escalateE)}</p><p>${inline(equipment)}</p>`
  })

  const timing = `<div class="nhsuk-grid-row app-timing">
  <div class="nhsuk-grid-column-one-half">${h.card({ heading: 'Standard monitoring', level: 3, feature: true, html: `<p>${inline(standard.replace(/^\*\*Frequency:\*\*\s*(\w)/, (m, c) => c.toUpperCase()))}</p>` })}</div>
  <div class="nhsuk-grid-column-one-half">${h.card({ heading: 'Increased-frequency monitoring', level: 3, feature: true, html: `<p>${inline(increased)}</p>` })}</div>
</div>`

  const obsList = list('12.9')
  const observations = `<p>${inline(md.quote(md129, 'Following administration'))}</p>
<ul class="nhsuk-list app-obs-list">
${obsList.map((o) => `<li>${inline(o)}</li>`).join('\n')}
</ul>`

  const beforeDose = h.warningCallout({
    heading: 'Before any further dose',
    level: 2,
    html: `<p>${inline(repeatObs)}</p><p>${inline(repeatE)}</p>`
  })

  const intro = `
${escalateCard}
<h2 class="nhsuk-heading-m">Monitoring frequency</h2>
${timing}
<h2 class="nhsuk-heading-m">What to monitor and document</h2>
${observations}
${beforeDose}
`

  const sections = [
    {
      id: 'monitoring-record',
      heading: 'Monitoring record',
      html: `<p>${inline(md.quote(mdE, '(To be built into the EPR'))}</p>
${h.actionLink({ href: href(site.urls.appendix('E')), text: 'Open the post-medication monitoring record (Appendix E) to print' })}
<p>This site explains the monitoring schedule. Record observations in the approved Trust workflow, not in the browser.</p>`
    },
    { id: 'daily-review', heading: 'Daily review and stopping', html: sub('12.10') },
    {
      id: 'discharge',
      heading: 'If medication continues at discharge',
      html: `<p>${inline(list('12.10')[2])}</p>${taskAction('discharge')}`
    },
    {
      id: 'next-steps',
      heading: 'Related tasks',
      html: `${taskAction('distress', 'Manage severe distress – medication reference')}${taskAction('causes')}`
    }
  ]

  return {
    intro,
    sections,
    sources: [
      { url: site.urls.subsection('12.9'), text: 'Section 12.9 – Monitoring after any dose' },
      { url: site.urls.subsection('12.10'), text: 'Section 12.10 – Daily review and stopping' },
      { url: site.urls.appendix('E'), text: 'Appendix E – Post-medication monitoring record' }
    ]
  }
}
monitor.key = 'monitor'

// ---------------------------------------------------------------------------
// 4. Find and treat causes
// ---------------------------------------------------------------------------
function causes(t) {
  const { sub, quote, href, site, subLink, appLink, taskAction, tables, appTables, md, render, inline, policy } = t

  const lifeThreatening = h.warningCallout({
    heading: 'First exclude life-threatening causes',
    level: 2,
    html: quote('9.1', 'An acute change in cognition')
  })

  // PINCH ME in plain language (Appendix B)
  const pinchMe = inline(md.quote(policy.appendix('B').md, 'PINCH ME'))
  const bedside = `<p>${inline(md.quote(policy.subsection('10.1').md, 'Delirium is almost always multifactorial'))}</p>
<ul class="nhsuk-list nhsuk-list--tick app-cause-list" role="list">
${['Pain', 'Infection', 'Nutrition', 'Constipation', 'Hydration', 'Medication', 'Environment and electrolytes']
  .map((c) => `<li>${h.icons.tick()}<strong>${c}</strong></li>`)
  .join('\n')}
</ul>
<p class="nhsuk-body-s">${pinchMe}</p>`

  // Investigations grouped by column of the 10.2 table
  const table102 = tables('10.2')[0]
  const columns = md.tableColumns(table102)
  const investigations = `<div class="nhsuk-grid-row app-investigations">
${columns
  .map(
    (c) => `  <div class="nhsuk-grid-column-one-third">${h.card({
      heading: inline(c.heading),
      level: 3,
      feature: true,
      html: `<ul class="nhsuk-list nhsuk-list--bullet">${c.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`
    })}</div>`
  )
  .join('\n')}
</div>`

  const intro = `
${lifeThreatening}
<h2 class="nhsuk-heading-m">Bedside cause checklist</h2>
${bedside}
<h2 class="nhsuk-heading-m">Minimum investigation set</h2>
${investigations}
`

  const sections = [
    {
      id: 'full-checklists',
      heading: 'Full cause checklists (DELIBERATE and PINCH ME)',
      html: t.appendix('B')
    },
    { id: 'medication-review', heading: 'Medication review', html: sub('10.3') },
    { id: 'treat-what-you-find', heading: 'Treat what you find', html: sub('10.4') },
    {
      id: 'next-steps',
      heading: 'Next steps',
      html: `${h.actionLink({ href: href(site.urls.section(11)), text: 'Non-pharmacological management (section 11)' })}${taskAction('distress', 'Manage severe distress (if the patient is distressed or at risk)')}${taskAction('special')}`
    }
  ]

  return {
    intro,
    sections,
    sources: [
      { url: site.urls.section(10), text: 'Section 10 – Identifying and treating the cause' },
      { url: site.urls.appendix('B'), text: 'Appendix B – Causes of delirium' }
    ]
  }
}
causes.key = 'causes'

// ---------------------------------------------------------------------------
// 5. Prevent delirium
// ---------------------------------------------------------------------------
function prevent(t) {
  const { href, site, secLink, taskAction, secTables, md, render, inline, policy } = t

  const sec6 = policy.section(6).md
  const riskFactors = md.listItems(sec6, 0)
  const actions = md.listItems(sec6, 1)
  const intro = `
<h2 class="nhsuk-heading-m">Four admission risk factors</h2>
${render(md.quote(sec6, 'Within 24 hours of admission'))}
<ol class="nhsuk-list nhsuk-list--number app-risk-factors">
${riskFactors.map((r) => `<li>${inline(r)}</li>`).join('\n')}
</ol>
${h.warningCallout({
  heading: 'If any one risk factor is present',
  level: 2,
  html: `${render(md.quote(sec6, 'If any one of these is present'))}<ul class="nhsuk-list nhsuk-list--bullet">${actions.map((a) => `<li>${inline(a)}</li>`).join('')}</ul>`
})}
${render(md.quote(sec6, 'Additional recognised precipitating'))}
`

  // Section 7 bundle table → one block per care domain
  const sec7 = policy.section(7).md
  const bundleTable = secTables(7)[0]
  const domains = bundleTable.rows
    .map(
      (r) => `<div class="app-domain">
  <h3 class="nhsuk-heading-s app-domain__heading">${inline(r[0].replace(/^\*\*([\s\S]*)\*\*$/, '$1'))}</h3>
  <p>${inline(r[1])}</p>
</div>`
    )
    .join('\n')

  const sections = [
    {
      id: 'prevention-bundle',
      heading: 'Multicomponent prevention bundle',
      html: `${render(md.quote(sec7, 'Delivered by a multidisciplinary team'))}
<p class="nhsuk-body-s">Column headings from the policy table: ${inline(bundleTable.header[0])} / ${inline(bundleTable.header[1])}.</p>
${domains}
${h.warningCallout({ heading: 'No prophylactic medication', level: 3, html: render(md.quote(sec7, 'Antipsychotics and other drugs must not be used prophylactically')) })}
${render(md.quote(sec7, 'Consider the use of a structured ward-level prevention bundle'))}`
    },
    {
      id: 'next-steps',
      heading: 'Next steps',
      html: `${taskAction('assess', 'Assess suspected delirium – baseline 4AT')}${taskAction('causes', 'Find and treat causes – medication review')}`
    }
  ]

  return {
    intro,
    sections,
    sources: [
      { url: site.urls.section(6), text: 'Section 6 – Risk factor assessment on admission' },
      { url: site.urls.section(7), text: 'Section 7 – Prevention: multicomponent intervention' }
    ]
  }
}
prevent.key = 'prevent'

// ---------------------------------------------------------------------------
// 6. Discharge and follow-up
// ---------------------------------------------------------------------------
function discharge(t) {
  const { sub, list, href, site, subLink, secLink, appLink, taskAction, md, render, inline, policy } = t

  const items16 = md.listItems(policy.section(16).md, 0)
  const before = items16.slice(0, 3)
  const after = items16.slice(3)
  const continuation = inline(list('12.10')[2])

  const intro = `
<h2 class="nhsuk-heading-m">Before discharge</h2>
<ol class="nhsuk-list nhsuk-list--number app-discharge-list">
${before.map((i) => `<li>${inline(i)}</li>`).join('\n')}
</ol>
${h.warningCallout({ heading: 'Antipsychotic or benzodiazepine still prescribed', level: 3, html: `<p>${continuation}</p>` })}
`

  const sections = [
    {
      id: 'follow-up-and-handover',
      heading: 'Follow-up, handover and future risk',
      html: `<ol class="nhsuk-list nhsuk-list--number" start="4">
${after.map((i) => `<li>${inline(i)}</li>`).join('\n')}
</ol>`
    },
    {
      id: 'discharge-checklist',
      heading: 'Discharge checklist after delirium (Appendix F)',
      html: `${t.appendix('F', { taskList: 'checkbox', idPrefix: 'discharge' })}<p class="nhsuk-body-s">Ticks are not saved. Record the completed checklist in the discharge summary or the approved Trust workflow.</p>`
    },
    {
      id: 'information-for-families',
      heading: 'Information for patients, families and carers',
      html: `${render(md.quote(policy.section(15).md, 'Where a person lacks capacity'))}${h.actionLink({ href: href(site.urls.section(15)), text: 'Information and support for patients, families and carers (section 15)' })}`
    },
    {
      id: 'next-steps',
      heading: 'Related tasks',
      html: `${taskAction('monitor', 'Monitor after medication – daily review and stopping')}${taskAction('special', 'Special situations and capacity – DoLS status at discharge')}`
    }
  ]

  return {
    intro,
    sections,
    sources: [
      { url: site.urls.section(16), text: 'Section 16 – Discharge, communication with primary care and follow-up' },
      { url: site.urls.subsection('12.10'), text: 'Section 12.10 – Daily review and stopping' },
      { url: site.urls.section(15), text: 'Section 15 – Information and support for patients, families and carers' },
      { url: site.urls.appendix('F'), text: 'Appendix F – Discharge checklist after delirium' }
    ]
  }
}
discharge.key = 'discharge'

// ---------------------------------------------------------------------------
// 7. Special situations and capacity
// ---------------------------------------------------------------------------
function special(t) {
  const { sub, subTitle, href, site, subLink, taskAction, policy } = t

  const primaryIndex = [
    { id: 'parkinsons', n: '13.1', label: "Parkinson's disease, parkinsonism and dementia with Lewy bodies" },
    { id: 'critical-care', n: '13.4', label: 'Critical care and post-operative recovery' },
    { id: 'withdrawal', n: '13.3', label: 'Alcohol and substance withdrawal' },
    { id: 'end-of-life', n: '13.7', label: 'End of life' },
    { id: 'persistent', n: '13.6', label: 'Delirium that does not resolve' },
    { id: 'capacity', n: '14.1', label: 'Mental capacity, restraint and deprivation of liberty' }
  ]
  const otherIndex = [
    { id: 'dementia', n: '13.2', label: 'Delirium in people living with dementia' },
    { id: 'hip-fracture', n: '13.5', label: 'Hip fracture and perioperative care' },
    { id: 'emergency-department', n: '13.8', label: 'Emergency Department and SDEC' },
    { id: 'younger-adults', n: '13.9', label: 'Younger adults' },
    { id: 'safeguarding', n: '14.5', label: 'Safeguarding, consent and information sharing' }
  ]

  const indexList = (items) => `<ul class="app-nav-rows">
${items.map((i) => `  <li class="app-nav-rows__item"><a class="app-nav-row" href="#${i.id}"><span class="app-nav-row__text"><span class="app-nav-row__title">${i.label}</span><span class="app-nav-row__description">Section ${i.n}</span></span>${h.icons.chevronRightCircle()}</a></li>`).join('\n')}
</ul>`

  const intro = `
<h2 class="nhsuk-heading-m">Go to</h2>
${indexList(primaryIndex)}
<h2 class="nhsuk-heading-s">Also in this section</h2>
${indexList(otherIndex)}
`

  const block = (n) => `<h3 class="nhsuk-heading-m" id="s-${n.replace('.', '-')}">${subTitle(n)}</h3>${sub(n)}`

  const sections = [
    { id: 'parkinsons', heading: "Parkinson's disease, parkinsonism and dementia with Lewy bodies", html: `${sub('13.1')}${h.actionLink({ href: `${href(site.task('distress').url)}#alternatives`, text: 'Alternative antipsychotics (quetiapine after specialist advice)' })}` },
    { id: 'critical-care', heading: 'Critical care and post-operative recovery', html: sub('13.4') },
    { id: 'withdrawal', heading: 'Alcohol and substance withdrawal', html: sub('13.3') },
    { id: 'end-of-life', heading: 'End of life', html: sub('13.7') },
    { id: 'persistent', heading: 'Delirium that does not resolve', html: sub('13.6') },
    {
      id: 'capacity',
      heading: 'Mental capacity, restraint and deprivation of liberty',
      html: `${block('14.1')}${block('14.2')}${block('14.3')}${block('14.4')}`
    },
    { id: 'dementia', heading: 'Delirium in people living with dementia', html: sub('13.2') },
    { id: 'hip-fracture', heading: 'Hip fracture and perioperative care', html: sub('13.5') },
    { id: 'emergency-department', heading: 'Emergency Department and SDEC', html: sub('13.8') },
    { id: 'younger-adults', heading: 'Younger adults', html: sub('13.9') },
    { id: 'safeguarding', heading: 'Safeguarding, consent and information sharing', html: `${block('14.5')}${block('14.6')}` },
    {
      id: 'local-pathways',
      heading: 'Linked local pathways',
      html: `<p>Local policies named in this section (alcohol withdrawal, rapid tranquillisation, restraint, MCA and DoLS, end of life, covert medication) are listed with contact points on the <a href="${href(site.urls.help)}">Get help</a> page. Links to the Trust documents are <mark class="app-to-confirm">[Trust to confirm]</mark>.</p>${taskAction('distress')}${taskAction('discharge')}`
    }
  ]

  return {
    intro,
    sections,
    sources: [
      { url: site.urls.section(13), text: 'Section 13 – Special situations' },
      { url: site.urls.section(14), text: 'Section 14 – Legal and ethical framework' }
    ]
  }
}
special.key = 'special'
