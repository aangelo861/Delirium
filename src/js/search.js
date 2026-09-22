/* Client-side search over search-index.json (no server). */
(function () {
  var form = document.getElementById('search-form')
  var input = document.getElementById('q')
  var results = document.getElementById('search-results')
  var status = document.getElementById('search-status')
  if (!form || !input || !results) return

  var index = null
  var loading = null

  function load() {
    if (index) return Promise.resolve(index)
    if (!loading) {
      loading = fetch(form.getAttribute('data-index'))
        .then(function (r) { return r.json() })
        .then(function (data) {
          index = data.map(function (e) {
            return { title: e.title, section: e.section, url: e.url, text: e.text, lower: (e.title + ' ' + e.text).toLowerCase(), titleLower: e.title.toLowerCase() }
          })
          return index
        })
    }
    return loading
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function terms(q) {
    return q.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1 })
  }

  function highlight(text, ts) {
    var safe = escapeHtml(text)
    ts.forEach(function (t) {
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig')
      safe = safe.replace(re, '<mark>$1</mark>')
    })
    return safe
  }

  function snippet(entry, ts) {
    var lower = entry.text.toLowerCase()
    var pos = -1
    for (var i = 0; i < ts.length; i++) {
      var p = lower.indexOf(ts[i])
      if (p >= 0 && (pos < 0 || p < pos)) pos = p
    }
    if (pos < 0) pos = 0
    var start = Math.max(0, pos - 70)
    var end = Math.min(entry.text.length, pos + 150)
    var s = entry.text.slice(start, end)
    return (start > 0 ? '… ' : '') + highlight(s, ts) + (end < entry.text.length ? ' …' : '')
  }

  function search(q) {
    var ts = terms(q)
    if (!ts.length) {
      results.innerHTML = ''
      status.textContent = ''
      return
    }
    load().then(function (data) {
      var scored = []
      data.forEach(function (e) {
        var ok = true
        var score = 0
        for (var i = 0; i < ts.length; i++) {
          var t = ts[i]
          if (e.lower.indexOf(t) < 0) { ok = false; break }
          if (e.titleLower.indexOf(t) >= 0) score += 8
          var count = e.lower.split(t).length - 1
          score += Math.min(count, 6)
        }
        if (ok) scored.push({ e: e, score: score })
      })
      scored.sort(function (a, b) { return b.score - a.score })
      var top = scored.slice(0, 30)
      status.textContent = top.length ? top.length + (scored.length > 30 ? ' of ' + scored.length : '') + ' results for "' + q + '"' : 'No results for "' + q + '". Try a different word, or start from a task below.'
      results.innerHTML = top.map(function (r) {
        return '<li class="app-result"><a class="app-result__link" href="' + r.e.url + '">' + highlight(r.e.title, ts) + '</a>' +
          '<span class="app-result__section">' + escapeHtml(r.e.section) + '</span>' +
          '<p class="app-result__snippet">' + snippet(r.e, ts) + '</p></li>'
      }).join('')
      var url = new URL(window.location.href)
      url.searchParams.set('q', q)
      window.history.replaceState(null, '', url.toString())
    })
  }

  var timer = null
  form.addEventListener('submit', function (ev) {
    ev.preventDefault()
    search(input.value.trim())
  })
  input.addEventListener('input', function () {
    clearTimeout(timer)
    timer = setTimeout(function () { search(input.value.trim()) }, 200)
  })

  var initial = new URLSearchParams(window.location.search).get('q')
  if (initial) {
    input.value = initial
    search(initial.trim())
  } else {
    input.focus()
  }
})()
