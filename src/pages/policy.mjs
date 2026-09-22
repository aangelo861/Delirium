/**
 * Full-policy layer: contents page, one page per section and appendix, a
 * single printable page, and the combined training-and-audit page.
 * All 19 sections and 7 appendices keep their original numbering.
 */
import * as h from '../lib/html.mjs'

/** Which task pages relate to each policy section (shown at the end of the section). */
const RELATED_TASKS = {
  6: ['prevent'],
  7: ['prevent'],
  8: ['assess'],
  9: ['assess', 'causes'],
  10: ['causes'],
  11: ['distress', 'causes'],
  12: ['distress', 'monitor'],
  13: ['special'],
  14: ['special'],
  15: ['discharge'],
  16: ['discharge', 'monitor']
}

export function buildPolicyPages(ctx) {
  const { site, policy, md, version, collect } = ctx
  const pages = []

  const ordered = [
    ...policy.sections.map((s) => ({ kind: 'section', id: s.number, url: site.urls.section(s.number), label: `${s.number}. ${s.title}`, item: s })),
    ...policy.appendices.map((a) => ({ kind: 'appendix', id: a.letter, url: site.urls.appendix(a.letter), label: `Appendix ${a.letter}: ${a.title}`, item: a }))
  ]

  const contents = (currentUrl) =>
    h.contentsList(
      ordered.map((o) => (o.url === currentUrl ? { text: o.label, current: true } : { text: o.label, href: site.href(currentUrl, o.url) })),
      { label: 'Full policy contents', hiddenHeading: 'Full policy contents' }
    )

  const renderOpts = (page, extra = {}) => ({
    pageUrl: page.url,
    collect,
    taskList: 'checkbox',
    ...extra
  })

  // ---- Section and appendix pages -----------------------------------------
  ordered.forEach((o, i) => {
    const page = { url: o.url, title: o.label, navKey: 'policy' }
    const href = (to) => site.href(page.url, to)
    const prev = ordered[i - 1]
    const next = ordered[i + 1]
    let body = ''
    let searchEntries = []

    if (o.kind === 'section') {
      const s = o.item
      const context = `Section ${s.number} – ${s.title}`
      body += md.render(s.intro, renderOpts(page, { context, anchorUrl: page.url, idPrefix: `s${s.number}` }))
      if (s.intro) {
        searchEntries.push({ title: `${s.number}. ${s.title}`, section: 'Full policy', url: page.url, text: md.stripTags(body) })
      }
      for (const sub of s.subsections) {
        const anchor = `s-${sub.number.replace('.', '-')}`
        const html = md.render(sub.md, renderOpts(page, {
          context: `Section ${sub.number} – ${sub.title}`,
          anchorUrl: `${page.url}#${anchor}`,
          idPrefix: `s${sub.number.replace('.', '-')}`,
          taskList: sub.number === '12.3' ? 'list' : 'checkbox'
        }))
        body += `<h2 class="nhsuk-heading-m" id="${anchor}">${sub.number} ${sub.title}</h2>\n${html}`
        searchEntries.push({ title: `${sub.number} ${sub.title}`, section: `Section ${s.number}. ${s.title}`, url: `${page.url}#${anchor}`, text: md.stripTags(html) })
      }
      const related = RELATED_TASKS[s.number] || []
      if (related.length) {
        body += `<h2 class="nhsuk-heading-s">Task view</h2>\n${related.map((k) => h.actionLink({ href: href(site.task(k).url), text: site.task(k).title })).join('')}`
      }
    } else {
      const a = o.item
      const context = `Appendix ${a.letter} – ${a.title}`
      const extra = a.letter === 'E' ? { tableMode: 'scroll', scrollLabel: 'Post-medication monitoring record, scrolls horizontally' } : {}
      const html = md.render(a.md, renderOpts(page, { context, anchorUrl: page.url, idPrefix: `app${a.letter}`, ...extra }))
      body += html
      if (a.letter === 'E') body += `<p class="nhsuk-body-s">Print this page in landscape to use the paper version.</p>`
      if (a.letter === 'D') body += h.actionLink({ href: href(site.task('distress').url), text: 'Task view: Manage severe distress' }) + h.actionLink({ href: href(site.task('monitor').url), text: 'Task view: Monitor after medication' })
      searchEntries.push({ title: `Appendix ${a.letter}: ${a.title}`, section: 'Full policy', url: page.url, text: md.stripTags(html) })
    }

    const content = `
<span class="nhsuk-caption-l">${o.kind === 'section' ? `Section ${o.id} of ${policy.sections.length}` : `Appendix ${o.id}`}</span>
<h1 class="nhsuk-heading-xl">${o.item.title}</h1>
${body}
${h.pagination({
  prev: prev ? { href: href(prev.url), label: prev.label } : null,
  next: next ? { href: href(next.url), label: next.label } : null
})}
`
    pages.push({
      page,
      html: h.layout({
        site,
        page,
        content,
        rail: `<p class="app-rail__heading">Full policy</p>${contents(page.url)}`,
        breadcrumbs: [
          { text: 'Tasks', href: href(site.urls.hub) },
          { text: 'Full policy', href: href(site.urls.policyIndex) }
        ],
        version,
        policyTitle: policy.title
      }),
      searchEntries
    })
  })

  // ---- Contents page -------------------------------------------------------
  {
    const page = { url: site.urls.policyIndex, title: 'Full policy', navKey: 'policy' }
    const href = (to) => site.href(page.url, to)
    const meta = h.summaryList(
      policy.meta.map((m) => ({ key: md.renderInline(m.key), value: md.renderInline(m.value, { pageUrl: page.url, collect, context: 'Document details', anchorUrl: page.url }) }))
    )
    const content = `
<span class="nhsuk-caption-l">Full policy</span>
<h1 class="nhsuk-heading-xl">${policy.title}</h1>
<p class="nhsuk-lede-text">${md.renderInline(policy.subtitle)}</p>
<h2 class="nhsuk-heading-m">Contents</h2>
<ol class="nhsuk-list nhsuk-list--number app-policy-contents">
${policy.sections.map((s) => `<li><a href="${href(site.urls.section(s.number))}">${s.title}</a></li>`).join('\n')}
</ol>
<h3 class="nhsuk-heading-s">Appendices</h3>
<ul class="nhsuk-list app-policy-contents">
${policy.appendices.map((a) => `<li><a href="${href(site.urls.appendix(a.letter))}">${a.letter}. ${a.title}</a></li>`).join('\n')}
</ul>
${h.actionLink({ href: href(site.urls.policyFull), text: 'Read or print the whole policy on one page' })}
${h.actionLink({ href: href(site.urls.hub), text: 'Go to the task view' })}
<h2 class="nhsuk-heading-m">Document details</h2>
${meta}
<h2 class="nhsuk-heading-m">Drafting note</h2>
${h.insetText(md.render(policy.draftingNote, { pageUrl: page.url }))}
`
    pages.push({
      page,
      html: h.layout({ site, page, content, breadcrumbs: [{ text: 'Tasks', href: href(site.urls.hub) }], version, policyTitle: policy.title }),
      searchEntries: [{ title: 'Full policy contents', section: 'Full policy', url: page.url, text: md.stripTags(content) }]
    })
  }

  // ---- Single printable page ----------------------------------------------
  {
    const page = { url: site.urls.policyFull, title: 'Full policy (single page)', navKey: 'policy', bodyClass: 'app-body--full' }
    const href = (to) => site.href(page.url, to)
    const opts = (extra = {}) => ({ pageUrl: page.url, taskList: 'checkbox', ...extra })
    let body = ''
    for (const s of policy.sections) {
      body += `<h2 class="nhsuk-heading-l" id="section-${s.number}">${s.number}. ${s.title}</h2>\n`
      body += md.render(s.intro, opts({ idPrefix: `full-s${s.number}` }))
      for (const sub of s.subsections) {
        body += `<h3 class="nhsuk-heading-m" id="s-${sub.number.replace('.', '-')}">${sub.number} ${sub.title}</h3>\n`
        body += md.render(sub.md, opts({ idPrefix: `full-s${sub.number.replace('.', '-')}`, taskList: sub.number === '12.3' ? 'list' : 'checkbox' }))
      }
    }
    for (const a of policy.appendices) {
      body += `<h2 class="nhsuk-heading-l" id="appendix-${a.letter.toLowerCase()}">Appendix ${a.letter}: ${a.title}</h2>\n`
      body += md.render(a.md, opts({ idPrefix: `full-app${a.letter}`, ...(a.letter === 'E' ? { tableMode: 'scroll' } : {}) }))
    }
    const content = `
<span class="nhsuk-caption-l">Full policy – single page</span>
<h1 class="nhsuk-heading-xl">${policy.title}</h1>
<p class="nhsuk-lede-text">${md.renderInline(policy.subtitle)}</p>
${h.summaryList(policy.meta.map((m) => ({ key: md.renderInline(m.key), value: md.renderInline(m.value, { pageUrl: page.url }) })))}
${h.insetText(md.render(policy.draftingNote, { pageUrl: page.url }))}
<p class="app-print-only">Use your browser's print function to print or save as PDF.</p>
${body}
`
    pages.push({
      page,
      html: h.layout({
        site,
        page,
        content,
        rail: `<p class="app-rail__heading">Jump to</p>${h.contentsList(
          [
            ...policy.sections.map((s) => ({ text: `${s.number}. ${s.title}`, href: `#section-${s.number}` })),
            ...policy.appendices.map((a) => ({ text: `Appendix ${a.letter}`, href: `#appendix-${a.letter.toLowerCase()}` }))
          ],
          { label: 'Sections on this page', hiddenHeading: 'Sections on this page' }
        )}`,
        breadcrumbs: [
          { text: 'Tasks', href: href(site.urls.hub) },
          { text: 'Full policy', href: href(site.urls.policyIndex) }
        ],
        version,
        policyTitle: policy.title
      }),
      searchEntries: []
    })
  }

  // ---- Training and audit (sections 17 and 18) -----------------------------
  {
    const page = { url: site.urls.training, title: 'Training and audit', navKey: 'tasks' }
    const href = (to) => site.href(page.url, to)
    const blocks = ['17', '18'].map((n) => {
      const s = policy.section(n)
      const html = md.render(s.md, { pageUrl: page.url, taskList: 'checkbox', idPrefix: `t${n}` })
      return { s, html }
    })
    const content = `
<span class="nhsuk-caption-l">Policy and reference</span>
<h1 class="nhsuk-heading-xl">Training and audit</h1>
${blocks
  .map(
    ({ s, html }) => `<section class="app-section" id="section-${s.number}">
<h2 class="nhsuk-heading-l">${s.number}. ${s.title}</h2>
${html}
<p><a href="${href(site.urls.section(s.number))}">Section ${s.number} in the full policy</a></p>
</section>`
  )
  .join('\n')}
`
    pages.push({
      page,
      html: h.layout({
        site,
        page,
        content,
        rail: `<p class="app-rail__heading">On this page</p>${h.contentsList(
          blocks.map(({ s }) => ({ text: `${s.number}. ${s.title}`, href: `#section-${s.number}` })),
          { label: 'On this page', hiddenHeading: 'On this page' }
        )}`,
        breadcrumbs: [{ text: 'Tasks', href: href(site.urls.hub) }],
        version,
        policyTitle: policy.title
      }),
      searchEntries: []
    })
  }

  return pages
}
