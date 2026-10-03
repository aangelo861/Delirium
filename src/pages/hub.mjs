/**
 * Homepage: "Where do I start?".
 * Order: draft status (page shell) → one row per situation, each going
 * straight to its task page → immediate safety message (section 9.1) →
 * search, the full policy and where to get extra help.
 */
import * as h from '../lib/html.mjs'

export function buildHub(ctx) {
  const { site, policy, md, version } = ctx
  const page = { url: site.urls.hub, title: 'Where do I start?', navKey: 'start', bodyClass: 'app-body--hub' }
  const href = (to) => site.href(page.url, to)

  const situations = h.navRows(
    site.tasks.map((t) => ({ text: t.situation, href: href(t.url), description: t.title })),
    { label: 'Situations' }
  )

  const immediate = h.careCard({
    variant: 'non-urgent',
    heading: 'Acute cognitive change',
    level: 2,
    hiddenPrefix: 'Immediate action',
    html: `<p class="app-hub__lead"><strong>Immediate safety assessment:</strong> ABCDE, observations and capillary glucose, before or alongside cognitive testing.</p>
<p class="nhsuk-body-s app-hub__source">An acute change in cognition is a medical emergency until proven otherwise. <a href="${href(site.urls.subsection('9.1'))}">Full immediate assessment (section 9.1)</a></p>`
  })

  const search = `<form class="app-search app-hub__search" action="${href(site.urls.search)}" method="get" role="search">
  <div class="nhsuk-form-group">
    <label class="nhsuk-label nhsuk-label--s" for="q">Search the policy</label>
    <div class="app-search__row">
      <input class="nhsuk-input app-search__input" id="q" name="q" type="search" autocomplete="off" enterkeyhint="search">
      <button class="nhsuk-button app-search__button" type="submit" data-module="nhsuk-button">Search</button>
    </div>
  </div>
</form>`

  const more = h.navRows(
    [
      {
        text: 'Full policy',
        href: href(site.urls.policyFull),
        description: `All ${policy.sections.length} sections and ${policy.appendices.length} appendices on one page`
      },
      { text: 'Where to get extra help', href: href(site.urls.help), description: 'Bleeps and reasons to contact' }
    ],
    { label: 'Full policy and extra help' }
  )

  const content = `
<h1 class="nhsuk-heading-l app-hub__title">Where do I start?</h1>
<p>Choose the situation to go straight to the guidance for it.</p>
${situations}
${immediate}
${search}
${more}
<p class="nhsuk-body-s app-hub__note">Each situation page re-arranges the policy's own wording for bedside use and links to the section it comes from. Items marked <mark class="app-to-confirm">[Trust to confirm]</mark> need a local decision before ratification.</p>
`

  return {
    page,
    html: h.layout({ site, page, content, version, policyTitle: policy.title }),
    searchEntries: [
      {
        title: 'Where do I start?',
        section: 'Home',
        url: page.url,
        text: md.stripTags(`${situations}${immediate}`)
      }
    ]
  }
}
