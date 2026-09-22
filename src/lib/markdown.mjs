/**
 * Markdown → NHS design system HTML.
 *
 * Wraps `marked` with a renderer that emits nhsuk-frontend markup, and adds
 * helpers for pulling structured pieces (paragraphs, list items, tables) out of
 * a markdown fragment so task pages can re-arrange policy content without
 * re-typing it.
 */
import { Marked } from 'marked'
import * as h from './html.mjs'

const TO_CONFIRM_RE =
  /\[((?:[^\]]*?)(?:Trust to|to confirm|to verify|delete if not applicable)[^\]]*)\]/g

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

export function stripTags(html) {
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugify(s) {
  return stripTags(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Very small markdown-to-text used for matching paragraphs by their opening words. */
export function stripMd(s) {
  return String(s)
    .replace(/^>\s?/gm, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/(^|\s)[*_](?=\S)/g, '$1')
    .replace(/(?<=\S)[*_](?=\s|$|[.,;:)])/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Apply `fn` to the text segments of an HTML string, skipping text inside
 * anchors, headings and existing <mark> elements.
 */
function processText(html, fn) {
  const parts = html.split(/(<[^>]+>)/)
  let skip = 0
  return parts
    .map((p) => {
      if (p.startsWith('<')) {
        if (/^<(a|h[1-6]|mark)\b/i.test(p)) skip++
        else if (/^<\/(a|h[1-6]|mark)\b/i.test(p)) skip = Math.max(0, skip - 1)
        return p
      }
      return skip ? p : fn(p)
    })
    .join('')
}

export function createMarkdown({ site, policy }) {
  let opts = {}
  let counter = 0

  const marked = new Marked({ gfm: true, breaks: false })

  function renderTable(table, o = {}) {
    // `table` = { header: [html], rows: [[html]] }
    const mode = o.tableMode || 'responsive'
    const resp = mode === 'responsive'
    const rowHeader =
      table.rows.length > 0 && table.rows.every((r) => /^<strong>[\s\S]*<\/strong>$/.test(r[0] || ''))
    const unbold = (s) => s.replace(/^<strong>([\s\S]*)<\/strong>$/, '$1')
    const thead =
      `<thead class="nhsuk-table__head"${resp ? ' role="rowgroup"' : ''}><tr class="nhsuk-table__row"${resp ? ' role="row"' : ''}>` +
      table.header
        .map((c) => `<th class="nhsuk-table__header" scope="col"${resp ? ' role="columnheader"' : ''}>${c}</th>`)
        .join('') +
      '</tr></thead>'
    const tbody = table.rows
      .map((r) => {
        const cells = r
          .map((c, i) => {
            const isRowHeader = rowHeader && i === 0
            const el = isRowHeader ? 'th' : 'td'
            const empty = !stripTags(c)
            const cls = (isRowHeader ? 'nhsuk-table__header' : 'nhsuk-table__cell') + (empty ? ' app-table__cell--empty' : '')
            const role = resp ? (isRowHeader ? ' role="rowheader"' : ' role="cell"') : ''
            const scope = isRowHeader ? ' scope="row"' : ''
            const label =
              resp && table.header[i]
                ? `<span class="nhsuk-table__heading" aria-hidden="true">${stripTags(table.header[i])}</span>`
                : ''
            const content = isRowHeader ? unbold(c) : c
            return `<${el} class="${cls}"${scope}${role}>${label}${resp ? `<span class="app-table__value">${content}</span>` : content}</${el}>`
          })
          .join('')
        return `<tr class="nhsuk-table__row"${resp ? ' role="row"' : ''}>${cells}</tr>`
      })
      .join('\n')
    const caption = o.caption ? `<caption class="nhsuk-table__caption nhsuk-u-visually-hidden">${o.caption}</caption>` : ''
    const table$ = `<table class="nhsuk-table${resp ? ' nhsuk-table--responsive' : ' app-table--grid'}"${resp ? ' role="table"' : ''}>${caption}${thead}<tbody class="nhsuk-table__body">${tbody}</tbody></table>`
    if (mode === 'scroll') {
      return `<div class="app-scroll" role="region" aria-label="${escapeHtml(o.scrollLabel || 'Table, scrolls horizontally')}" tabindex="0">${table$}</div>\n`
    }
    return table$ + '\n'
  }

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens)
        const plain = stripTags(inner)
        const level = Math.min(6, Math.max(2, depth + (opts.headingShift ?? -1)))
        const m = plain.match(/^(\d{1,2}\.\d{1,2})\s+/)
        const id = m ? `s-${m[1].replace('.', '-')}` : slugify(plain)
        const size = level <= 2 ? 'm' : 's'
        return `<h${level} class="nhsuk-heading-${size}" id="${id}">${inner}</h${level}>\n`
      },
      paragraph({ tokens }) {
        return `<p>${this.parser.parseInline(tokens)}</p>\n`
      },
      list(token) {
        const allTasks = token.items.length > 0 && token.items.every((i) => i.task)
        if (allTasks && opts.taskList !== 'list') {
          const items = token.items.map((i) => unwrapParagraph(this.parser.parse(i.tokens).trim()))
          return h.checklist(items, `${opts.idPrefix || 'check'}-${++counter}`)
        }
        const tag = token.ordered ? 'ol' : 'ul'
        const cls = token.ordered ? 'nhsuk-list nhsuk-list--number' : 'nhsuk-list nhsuk-list--bullet'
        const start = token.ordered && token.start && token.start !== 1 ? ` start="${token.start}"` : ''
        return `<${tag} class="${cls}"${start}>\n${token.items.map((i) => this.listitem(i)).join('')}</${tag}>\n`
      },
      listitem(item) {
        return `<li>${unwrapParagraph(this.parser.parse(item.tokens).trim())}</li>\n`
      },
      checkbox() {
        return ''
      },
      table(token) {
        const header = token.header.map((c) => this.parser.parseInline(c.tokens))
        const rows = token.rows.map((r) => r.map((c) => this.parser.parseInline(c.tokens)))
        return renderTable({ header, rows }, opts)
      },
      blockquote({ tokens }) {
        const inner = this.parser.parse(tokens).trim()
        if (/^Not an indication/.test(stripTags(inner))) {
          const items = inner
            .split(/<\/p>\s*/)
            .filter((p) => p.trim())
            .map((p) => p.replace(/^<p>/, ''))
          return h.doDontList({
            heading: 'Not an indication for medication',
            items,
            icon: 'cross',
            hidePrefix: true,
            level: opts.calloutLevel || 3
          })
        }
        return h.insetText(inner)
      },
      code({ text }) {
        return `<pre class="app-pre">${escapeHtml(text)}</pre>\n`
      },
      hr() {
        return ''
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const external = /^https?:/i.test(href)
        return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' rel="noopener"' : ''}>${text}</a>`
      }
    }
  })

  /** A list item with a single paragraph reads better without the <p>. */
  function unwrapParagraph(html) {
    const count = (html.match(/<p>/g) || []).length
    if (count === 1 && /^<p>[\s\S]*<\/p>$/.test(html)) return html.slice(3, -4)
    return html
  }

  /** Split consecutive "> **Not an indication" lines into separate paragraphs. */
  function preprocess(md) {
    return md.replace(/\n(> \*\*Not an indication[^\n]*)\n(?=> \*\*Not an indication)/g, '\n$1\n>\n')
  }

  function markToConfirm(html, ctx = {}) {
    // Plain text of the whole fragment (minus stacked-table column labels),
    // used to give each marker some context
    const plain = stripTags(html.replace(/<span class="nhsuk-table__heading"[^>]*>[^<]*<\/span>/g, ''))
    return processText(html, (t) =>
      t.replace(TO_CONFIRM_RE, (m, inner) => {
        if (ctx.collect) {
          const text = stripTags(inner)
          const at = plain.indexOf(`[${text}]`)
          const before = at > 0 ? plain.slice(Math.max(0, at - 110), at).replace(/^\S*\s/, '') : ''
          ctx.collect({
            text,
            snippet: (before ? `…${before}` : '') + `[${text}]`,
            context: ctx.context || '',
            url: ctx.anchorUrl || ''
          })
        }
        return `<mark class="app-to-confirm">[${inner}]</mark>`
      })
    )
  }

  function sectionUrl(num) {
    return policy.sections.some((s) => s.number === num) ? site.urls.section(num) : null
  }
  function subsectionUrl(num) {
    try {
      policy.subsection(num)
      return site.urls.subsection(num)
    } catch {
      return null
    }
  }

  /** Turn "section 12.6", "sections 8, 12 and 13" and "Appendix A" into links. */
  function linkCrossRefs(html, pageUrl) {
    return processText(html, (t) => {
      t = t.replace(/\b(Appendix) ([A-G])\b/g, (m, word, letter) => {
        if (!policy.appendices.some((a) => a.letter === letter)) return m
        return `<a href="${site.href(pageUrl, site.urls.appendix(letter))}">${word} ${letter}</a>`
      })
      t = t.replace(
        /\b([Ss]ections?) ((?:\d{1,2}(?:\.\d{1,2})?)(?:(?:,\s*|\s+and\s+)\d{1,2}(?:\.\d{1,2})?)*)/g,
        (m, word, refs) => {
          const linked = refs.replace(/\d{1,2}(?:\.\d{1,2})?/g, (num) => {
            const target = num.includes('.') ? subsectionUrl(num) : sectionUrl(num)
            return target ? `<a href="${site.href(pageUrl, target)}">${num}</a>` : num
          })
          return `${word} ${linked}`
        }
      )
      return t
    })
  }

  /**
   * Render a markdown fragment.
   * options: { pageUrl, taskList: 'checkbox'|'list', tableMode: 'responsive'|'scroll',
   *            idPrefix, headingShift, collect, context, anchorUrl, calloutLevel }
   */
  function render(md, options = {}) {
    opts = { ...options }
    counter = 0
    let html = marked.parse(preprocess(md))
    html = markToConfirm(html, options)
    if (options.pageUrl) html = linkCrossRefs(html, options.pageUrl)
    return html
  }

  function renderInline(md, options = {}) {
    let html = marked.parseInline(md)
    html = markToConfirm(html, options)
    if (options.pageUrl) html = linkCrossRefs(html, options.pageUrl)
    return html
  }

  // ---- Structural helpers over raw markdown --------------------------------

  function tokens(md) {
    return marked.lexer(md)
  }

  /** Raw markdown of each top-level paragraph. */
  function paragraphs(md) {
    return tokens(md)
      .filter((t) => t.type === 'paragraph')
      .map((t) => t.raw.trim())
  }

  /** The paragraph whose (de-formatted) text starts with `startsWith`. Throws if absent. */
  function quote(md, startsWith) {
    const p = paragraphs(md).find((x) => stripMd(x).startsWith(startsWith))
    if (!p) throw new Error(`Paragraph starting "${startsWith}" not found in policy text`)
    return p
  }

  /** Raw markdown of the items in the `index`-th top-level list. */
  function listItems(md, index = 0) {
    const lists = tokens(md).filter((t) => t.type === 'list')
    const list = lists[index]
    if (!list) throw new Error(`List ${index} not found in policy text`)
    return list.items.map((i) => i.text.trim())
  }

  /** Parsed tables: { header: [md], rows: [[md]] }. */
  function tables(md) {
    return tokens(md)
      .filter((t) => t.type === 'table')
      .map((t) => ({
        header: t.header.map((c) => c.text.trim()),
        rows: t.rows.map((r) => r.map((c) => c.text.trim()))
      }))
  }

  /** Split raw text at each marker in order. Throws if any marker is missing. */
  function splitAt(text, markers) {
    const parts = []
    let rest = text
    for (const m of markers) {
      const i = rest.indexOf(m)
      if (i < 0) throw new Error(`Marker "${m}" not found in policy text`)
      parts.push(rest.slice(0, i))
      rest = rest.slice(i)
    }
    parts.push(rest)
    return parts.map((s) => s.trim()).filter(Boolean)
  }

  /** Each column of a table as a heading plus its non-empty cells. */
  function tableColumns(table) {
    return table.header.map((heading, i) => ({
      heading,
      items: table.rows.map((r) => r[i] || '').filter((c) => c.trim())
    }))
  }

  function renderTableMd(table, options = {}) {
    const inline = (md) => renderInline(md, options)
    return renderTable({ header: table.header.map(inline), rows: table.rows.map((r) => r.map(inline)) }, options)
  }

  /** Two-column table → summary list. `relabel` maps a key's plain text to a replacement. */
  function tableToSummaryList(table, options = {}) {
    const relabel = options.relabel || {}
    const rows = table.rows.map((r) => {
      const keyPlain = stripMd(r[0])
      const key = relabel[keyPlain] ? relabel[keyPlain] : renderInline(r[0].replace(/^\*\*([\s\S]*)\*\*$/, '$1'), options)
      return { key, value: renderInline(r[1] || '', options) }
    })
    return h.summaryList(rows)
  }

  /** Each table row → a stacked card headed by the first column. */
  function tableRowsToCards(table, options = {}) {
    return table.rows
      .map((r) => {
        const heading = renderInline(r[0].replace(/^\*\*([\s\S]*)\*\*$/, '$1'), options)
        const rows = table.header.slice(1).map((hd, i) => ({
          key: renderInline(hd, options),
          value: renderInline(r[i + 1] || '', options)
        }))
        return h.card({ heading, level: options.level || 3, html: h.summaryList(rows), classes: 'app-stack-card' })
      })
      .join('\n')
  }

  return {
    render,
    renderInline,
    renderTable,
    renderTableMd,
    paragraphs,
    quote,
    listItems,
    tables,
    splitAt,
    tableColumns,
    tableToSummaryList,
    tableRowsToCards,
    stripTags,
    stripMd
  }
}
