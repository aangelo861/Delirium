/**
 * Full policy: every section and appendix on one page, with original
 * numbering. Sections (#section-12), subsections (#s-12-4) and appendices
 * (#appendix-e) are anchors, so task pages, cross-references and search
 * results all land on the wording they refer to.
 */
import * as h from '../lib/html.mjs'

export function buildPolicyPage(ctx) {
  const { site, policy, md, version } = ctx
  const page = { url: site.urls.policyFull, title: 'Full policy', navKey: 'policy', bodyClass: 'app-body--full' }
  const href = (to) => site.href(page.url, to)
  const opts = (extra = {}) => ({ pageUrl: page.url, taskList: 'checkbox', ...extra })
  const anchor = (url) => url.split('#')[1]

  let body = ''
  const searchEntries = []

  for (const s of policy.sections) {
    const intro = md.render(s.intro, opts({ idPrefix: `full-s${s.number}` }))
    body += `<h2 class="nhsuk-heading-l" id="${anchor(site.urls.section(s.number))}">${s.number}. ${s.title}</h2>\n${intro}`
    if (s.intro) {
      searchEntries.push({ title: `${s.number}. ${s.title}`, section: 'Full policy', url: site.urls.section(s.number), text: md.stripTags(intro) })
    }
    for (const sub of s.subsections) {
      const html = md.render(sub.md, opts({ idPrefix: `full-s${sub.number.replace('.', '-')}`, taskList: sub.number === '12.3' ? 'list' : 'checkbox' }))
      body += `<h3 class="nhsuk-heading-m" id="${anchor(site.urls.subsection(sub.number))}">${sub.number} ${sub.title}</h3>\n${html}`
      searchEntries.push({ title: `${sub.number} ${sub.title}`, section: `Section ${s.number}. ${s.title}`, url: site.urls.subsection(sub.number), text: md.stripTags(html) })
    }
  }
  for (const a of policy.appendices) {
    const extra = a.letter === 'E' ? { tableMode: 'scroll', scrollLabel: 'Post-medication monitoring record, scrolls horizontally' } : {}
    const html = md.render(a.md, opts({ idPrefix: `full-app${a.letter}`, ...extra }))
    body += `<h2 class="nhsuk-heading-l" id="${anchor(site.urls.appendix(a.letter))}">Appendix ${a.letter}: ${a.title}</h2>\n${html}`
    searchEntries.push({ title: `Appendix ${a.letter}: ${a.title}`, section: 'Full policy', url: site.urls.appendix(a.letter), text: md.stripTags(html) })
  }

  const contentsItems = [
    ...policy.sections.map((s) => ({ text: `${s.number}. ${s.title}`, href: href(site.urls.section(s.number)) })),
    ...policy.appendices.map((a) => ({ text: `Appendix ${a.letter}: ${a.title}`, href: href(site.urls.appendix(a.letter)) }))
  ]

  // On phones the rail sits below the content, so the contents list is also
  // offered at the top of the page (hidden where the rail is alongside)
  const contentsTop = h.details({
    summary: 'Contents',
    html: `<ul class="nhsuk-list">\n${contentsItems.map((i) => `<li><a href="${i.href}">${i.text}</a></li>`).join('\n')}\n</ul>`,
    classes: 'app-policy-contents'
  })

  const content = `
<span class="nhsuk-caption-l">Full policy</span>
<h1 class="nhsuk-heading-xl">${policy.title}</h1>
<p class="nhsuk-lede-text">${md.renderInline(policy.subtitle)}</p>
${contentsTop}
${h.summaryList(policy.meta.map((m) => ({ key: md.renderInline(m.key), value: md.renderInline(m.value, { pageUrl: page.url }) })))}
${h.insetText(md.render(policy.draftingNote, { pageUrl: page.url }))}
<p class="app-print-only">Use your browser's print function to print or save as PDF.</p>
${body}
`

  return {
    page,
    html: h.layout({
      site,
      page,
      content,
      rail: `<p class="app-rail__heading">Contents</p>${h.contentsList(contentsItems, { label: 'Full policy contents', hiddenHeading: 'Full policy contents' })}`,
      breadcrumbs: [{ text: 'Where do I start?', href: href(site.urls.hub) }],
      version,
      policyTitle: policy.title
    }),
    searchEntries
  }
}
