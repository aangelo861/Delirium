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
  help: 'get-help.html',
  search: 'search.html',
  searchIndex: 'search-index.json',
  // The full policy is one page; sections, subsections and appendices are anchors in it
  policyFull: 'policy/full.html',
  section: (n) => `policy/full.html#section-${n}`,
  appendix: (letter) => `policy/full.html#appendix-${String(letter).toLowerCase()}`,
  subsection: (num) => `policy/full.html#s-${String(num).replace('.', '-')}`
}

/** Prefix that reaches the site root from a page URL ("" or "../"). */
export function root(url) {
  const depth = url.split('/').length - 1
  return '../'.repeat(depth)
}

/** Relative href from one page URL to another (either may carry a #fragment). */
export function href(from, to) {
  const [toPath, hash] = to.split('#')
  if (hash && toPath === from) return `#${hash}`
  const fromDir = path.posix.dirname(from)
  let rel = path.posix.relative(fromDir === '.' ? '' : fromDir, toPath)
  if (!rel) rel = path.posix.basename(toPath)
  return hash ? `${rel}#${hash}` : rel
}

/**
 * The seven task pages, in reading order (used for prev/next and the homepage).
 * `situation` is the wording of the "Where do I start?" row that leads to the page.
 */
export const tasks = [
  {
    key: 'assess',
    url: urls.assess,
    title: 'Assess suspected delirium',
    situation: 'A patient has new or fluctuating confusion, drowsiness or withdrawal, or is "not themselves"',
    description: 'Immediate safety assessment, choosing the assessment tool, diagnosis'
  },
  {
    key: 'distress',
    url: urls.distress,
    title: 'Manage severe distress',
    situation: 'A patient with delirium is distressed, agitated or a risk to themselves or others',
    description: 'Unmet needs, de-escalation, when medication may be considered'
  },
  {
    key: 'monitor',
    url: urls.monitor,
    title: 'Monitor after medication',
    situation: 'Medication has been given for behavioural disturbance',
    description: 'Escalation triggers, timing, observations before any further dose'
  },
  {
    key: 'causes',
    url: urls.causes,
    title: 'Find and treat causes',
    situation: 'Delirium is likely or confirmed and I need to find and treat the cause',
    description: 'Bedside cause checklist and investigations'
  },
  {
    key: 'prevent',
    url: urls.prevent,
    title: 'Prevent delirium',
    situation: 'A patient is at risk of delirium and I want to prevent it',
    description: 'Admission risk factors and the prevention bundle'
  },
  {
    key: 'discharge',
    url: urls.discharge,
    title: 'Discharge and follow-up',
    situation: 'I am planning discharge after delirium',
    description: 'Safe discharge, medication plan, communication with the GP'
  },
  {
    key: 'special',
    url: urls.special,
    title: 'Special situations and capacity',
    situation: "A special situation: Parkinson's or Lewy body dementia, critical care, withdrawal, end of life, dementia, capacity",
    description: "Parkinson's and DLB, critical care, withdrawal, end of life, capacity"
  }
]

export function task(key) {
  const t = tasks.find((x) => x.key === key)
  if (!t) throw new Error(`Unknown task ${key}`)
  return t
}

export const site = { urls, root, href, tasks, task }
