/**
 * Homepage: task-first hub.
 * Order: draft status (page shell) → "Where do I start?" scenario picker that
 * opens the decision tree → immediate safety message (section 9.1) → the
 * three priority entry points → compact navigation rows.
 */
import * as h from '../lib/html.mjs'
import { scenarios } from './pathway.mjs'

export function buildHub(ctx) {
  const { site, policy, md, version } = ctx
  const page = { url: site.urls.hub, title: 'Delirium – tasks', navKey: 'tasks', bodyClass: 'app-body--hub' }
  const href = (to) => site.href(page.url, to)
  const t = (key) => site.task(key)

  const start = `<h2 class="nhsuk-heading-m app-hub__start-heading" id="start">Where do I start?</h2>
<p>Choose the situation. A few questions lead to the right part of the policy.</p>
${h.navRows(
  scenarios.map((s) => ({ text: s.label, href: `${href(site.urls.pathway)}#n-${s.id}` })),
  { label: 'Scenarios' }
)}`

  const immediate = h.careCard({
    variant: 'non-urgent',
    heading: 'Acute cognitive change',
    level: 2,
    hiddenPrefix: 'Immediate action',
    html: `<p class="app-hub__lead"><strong>Immediate safety assessment:</strong> ABCDE, observations and capillary glucose, before or alongside cognitive testing.</p>
<p class="nhsuk-body-s app-hub__source">An acute change in cognition is a medical emergency until proven otherwise. <a href="${href(site.urls.subsection('9.1'))}">Full immediate assessment (section 9.1)</a></p>`
  })

  const primary = `<div class="app-task-buttons">
${['assess', 'distress', 'monitor']
  .map((k) => `  <a class="nhsuk-button nhsuk-button--brand app-task-button" href="${href(t(k).url)}" role="button" draggable="false" data-module="nhsuk-button"><span>${t(k).title}</span>${h.icons.arrowRight()}</a>`)
  .join('\n')}
</div>`

  const rows = h.navRows(
    ['causes', 'prevent', 'discharge', 'special'].map((k) => ({ text: t(k).title, href: href(t(k).url), description: t(k).description })),
    { label: 'More tasks' }
  )

  const secondary = h.navRows(
    site.secondaryLinks.map((l) => ({ text: l.title, href: href(l.url), description: l.description })),
    { label: 'Policy and reference' }
  )

  const content = `
<h1 class="nhsuk-heading-l app-hub__title">Delirium</h1>
${start}
${immediate}
<h2 class="nhsuk-heading-s app-nav-rows__heading" id="tasks">Or go straight to a task</h2>
${primary}
<h2 class="nhsuk-heading-s app-nav-rows__heading">More tasks</h2>
${rows}
<h2 class="nhsuk-heading-s app-nav-rows__heading">Policy and reference</h2>
${secondary}
<p class="nhsuk-body-s app-hub__note">Task pages are a navigation layer over the policy. The <a href="${href(site.urls.policyIndex)}">full policy</a> keeps all 19 sections and appendices with their original numbering. Items marked <mark class="app-to-confirm">[Trust to confirm]</mark> need a local decision before ratification – see <a href="${href(site.urls.about)}">policy version and changes</a>.</p>
`

  return {
    page,
    html: h.layout({ site, page, content, version, policyTitle: policy.title }),
    searchEntries: [
      {
        title: 'Tasks (home)',
        section: 'Home',
        url: page.url,
        text: md.stripTags(content)
      }
    ]
  }
}
