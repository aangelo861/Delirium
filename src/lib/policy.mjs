/**
 * Parses the policy markdown into a structured model.
 *
 * The markdown is the single source of truth for clinical content. Nothing in
 * the site re-types policy wording: task pages pull subsections, paragraphs and
 * tables from the model built here.
 *
 * Expected document shape (see Delirium_Policy_DRAFT_v0.1.md):
 *
 *   # Title
 *   **Subtitle**
 *   | Field | Detail |   ← metadata table
 *   > **Drafting note.** ...
 *   ## Contents            ← ignored, navigation is generated
 *   ## 1. Section title
 *   ### 1.1 Subsection title
 *   ...
 *   ## Appendix A: Title
 */

const SECTION_RE = /^## (\d{1,2})\.\s+(.+?)\s*$/
const APPENDIX_RE = /^## Appendix ([A-Z]):\s+(.+?)\s*$/
const SUBSECTION_RE = /^### (\d{1,2}\.\d{1,2})\s+(.+?)\s*$/

/** Remove leading/trailing blank lines and horizontal rules from a block. */
function tidy(lines) {
  const out = [...lines]
  while (out.length && /^(\s*|---)$/.test(out[0])) out.shift()
  while (out.length && /^(\s*|---)$/.test(out[out.length - 1])) out.pop()
  return out.join('\n')
}

/** Split a section body into an intro plus `### n.n` subsections. */
function splitSubsections(sectionNumber, lines) {
  const intro = []
  const subsections = []
  let current = null
  for (const line of lines) {
    const m = line.match(SUBSECTION_RE)
    if (m) {
      current = { number: m[1], title: m[2], lines: [] }
      subsections.push(current)
      continue
    }
    if (current) current.lines.push(line)
    else intro.push(line)
  }
  return {
    intro: tidy(intro),
    subsections: subsections.map((s) => ({
      number: s.number,
      title: s.title,
      md: tidy(s.lines),
      section: sectionNumber
    }))
  }
}

/** Parse a markdown pipe table into header + rows of raw cell markdown. */
export function parseTable(md) {
  const rows = md
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'))
    .map((l) => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
  if (rows.length < 2) return null
  const [header, , ...body] = rows // second row is the |---|---| separator
  return { header, rows: body }
}

export function parsePolicy(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')

  // --- Front matter: everything before the first "## " heading -------------
  const firstHeading = lines.findIndex((l) => l.startsWith('## '))
  const front = lines.slice(0, firstHeading)

  const title = (front.find((l) => l.startsWith('# ')) || '# Untitled').slice(2).trim()
  const subtitle = (front.find((l) => /^\*\*.+\*\*$/.test(l.trim())) || '')
    .trim()
    .replace(/^\*\*|\*\*$/g, '')
  const metaTable = parseTable(front.filter((l) => l.trim().startsWith('|')).join('\n'))
  const meta = metaTable
    ? metaTable.rows.map(([key, value]) => ({ key, value }))
    : []
  const draftingNote = tidy(
    front.filter((l) => l.startsWith('>')).map((l) => l.replace(/^>\s?/, ''))
  )

  // --- Sections and appendices --------------------------------------------
  const sections = new Map()
  const appendices = new Map()
  let current = null

  for (const line of lines.slice(firstHeading)) {
    if (line.startsWith('## ')) {
      let m
      if ((m = line.match(SECTION_RE))) {
        current = { kind: 'section', number: m[1], title: m[2], lines: [] }
        sections.set(m[1], current)
      } else if ((m = line.match(APPENDIX_RE))) {
        current = { kind: 'appendix', letter: m[1], title: m[2], lines: [] }
        appendices.set(m[1], current)
      } else {
        current = null // e.g. "## Contents" – ignored
      }
      continue
    }
    if (current) current.lines.push(line)
  }

  const sectionList = [...sections.values()].map((s) => {
    const { intro, subsections } = splitSubsections(s.number, s.lines)
    return { number: s.number, title: s.title, md: tidy(s.lines), intro, subsections }
  })

  const appendixList = [...appendices.values()].map((a) => ({
    letter: a.letter,
    title: a.title,
    md: tidy(a.lines)
  }))

  const subsectionIndex = new Map()
  for (const s of sectionList) for (const sub of s.subsections) subsectionIndex.set(sub.number, sub)

  const model = {
    title,
    subtitle,
    meta,
    draftingNote,
    sections: sectionList,
    appendices: appendixList,
    section(number) {
      const s = sectionList.find((x) => x.number === String(number))
      if (!s) throw new Error(`Policy section ${number} not found`)
      return s
    },
    subsection(number) {
      const s = subsectionIndex.get(String(number))
      if (!s) throw new Error(`Policy subsection ${number} not found`)
      return s
    },
    appendix(letter) {
      const a = appendixList.find((x) => x.letter === letter)
      if (!a) throw new Error(`Policy appendix ${letter} not found`)
      return a
    },
    metaValue(key) {
      const row = meta.find((m) => m.key.toLowerCase() === key.toLowerCase())
      return row ? row.value : ''
    }
  }
  return model
}
