/**
 * Site map: every page URL in one place, plus helpers for relative links.
 *
 * All output URLs are flat `.html` files so the site works from GitHub Pages
 * (project sub-path) and from a plain local file server without any base-path
 * configuration.
 */
import path from 'node:path'

export const urls = {
  hub: 'index.html',
  assess: 'assess.html',
  causes: 'causes.html',
  distress: 'distress.html',
  monitor: 'monitor.html',
  prevent: 'prevent.html',
  discharge: 'discharge.html',
  special: 'special-situations.html',
  training: 'training-and-audit.html',
  about: 'about.html',
  help: 'get-help.html',
  search: 'search.html',
  searchIndex: 'search-index.json',
  policyIndex: 'policy/index.html',
  policyFull: 'policy/full.html',
  section: (n) => `policy/section-${n}.html`,
  appendix: (letter) => `policy/appendix-${String(letter).toLowerCase()}.html`,
  subsection: (num) => `policy/section-${String(num).split('.')[0]}.html#s-${String(num).replace('.', '-')}`
}

/** Prefix that reaches the site root from a page URL ("" or "../"). */
export function root(url) {
  const depth = url.split('/').length - 1
  return '../'.repeat(depth)
}

/** Relative href from one page URL to another (either may carry a #fragment). */
export function href(from, to) {
  const [toPath, hash] = to.split('#')
  const fromDir = path.posix.dirname(from)
  let rel = path.posix.relative(fromDir === '.' ? '' : fromDir, toPath)
  if (!rel) rel = path.posix.basename(toPath)
  return hash ? `${rel}#${hash}` : rel
}

/** The seven task pages, in reading order (used for prev/next and the hub). */
export const tasks = [
  {
    key: 'assess',
    url: urls.assess,
    title: 'Assess suspected delirium',
    description: 'Immediate safety assessment, choosing the assessment tool, diagnosis'
  },
  {
    key: 'distress',
    url: urls.distress,
    title: 'Manage severe distress',
    description: 'Unmet needs, de-escalation, when medication may be considered'
  },
  {
    key: 'monitor',
    url: urls.monitor,
    title: 'Monitor after medication',
    description: 'Escalation triggers, timing, observations before any further dose'
  },
  {
    key: 'causes',
    url: urls.causes,
    title: 'Find and treat causes',
    description: 'Bedside cause checklist and investigations'
  },
  {
    key: 'prevent',
    url: urls.prevent,
    title: 'Prevent delirium',
    description: 'Admission risk factors and the prevention bundle'
  },
  {
    key: 'discharge',
    url: urls.discharge,
    title: 'Discharge and follow-up',
    description: 'Safe discharge, medication plan, communication with the GP'
  },
  {
    key: 'special',
    url: urls.special,
    title: 'Special situations and capacity',
    description: "Parkinson's and DLB, critical care, withdrawal, end of life, capacity"
  }
]

export const secondaryLinks = [
  { key: 'policy', url: urls.policyIndex, title: 'Full policy', description: 'All 19 sections and appendices with original numbering' },
  { key: 'patients', url: urls.section(15), title: 'Patient and carer information', description: 'Section 15' },
  { key: 'training', url: urls.training, title: 'Training and audit', description: 'Sections 17 and 18' },
  { key: 'about', url: urls.about, title: 'Policy version and changes', description: 'Draft status, items to confirm, change log' }
]

export function task(key) {
  const t = tasks.find((x) => x.key === key)
  if (!t) throw new Error(`Unknown task ${key}`)
  return t
}

export const site = { urls, root, href, tasks, secondaryLinks, task }
