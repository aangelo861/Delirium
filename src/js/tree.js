/* Interactive decision tree: one node at a time, answers kept in history
   state, routed by URL hash so Back and deep links work. Without this script
   every node is visible and the option links jump between sections. */
(function () {
  var root = document.getElementById('tree')
  if (!root) return
  var nodes = Array.prototype.slice.call(root.querySelectorAll('[data-node]'))
  var startId = root.getAttribute('data-start')
  var trailBox = document.getElementById('tree-trail')
  var trailList = document.getElementById('tree-trail-list')
  var showAllBtn = document.getElementById('tree-show-all')
  var showAll = false

  root.classList.add('app-tree--js')
  if (showAllBtn) showAllBtn.hidden = false

  function nodeById(id) {
    return id && document.getElementById(id) && document.getElementById(id).hasAttribute('data-node') ? document.getElementById(id) : null
  }
  function idFromHash() {
    var id = window.location.hash.replace('#', '')
    return nodeById(id) ? id : null
  }
  function questionOf(node) {
    var heading = node.querySelector('h2')
    return heading ? heading.textContent.trim() : ''
  }
  function currentId() {
    var visible = nodes.filter(function (n) { return !n.hidden })
    return visible.length === 1 ? visible[0].id : (idFromHash() || startId)
  }

  function renderTrail(trail) {
    if (!trailBox || !trailList) return
    trailList.innerHTML = ''
    if (!trail.length) { trailBox.hidden = true; return }
    trail.forEach(function (step, i) {
      var li = document.createElement('li')
      var a = document.createElement('a')
      a.href = '#' + step.node
      a.setAttribute('data-back', String(i))
      a.textContent = step.q
      li.appendChild(a)
      li.appendChild(document.createTextNode(' — ' + step.a))
      trailList.appendChild(li)
    })
    trailBox.hidden = false
  }

  function show(id, trail, focus) {
    nodes.forEach(function (n) { n.hidden = showAll ? false : n.id !== id })
    renderTrail(trail || [])
    if (focus) {
      var heading = document.getElementById(id + '-h')
      if (heading) heading.focus({ preventScroll: false })
      var target = document.getElementById(id)
      if (target) target.scrollIntoView({ block: 'start' })
    }
  }

  function state() {
    return (window.history.state && window.history.state.tree) ? window.history.state.tree : null
  }

  root.addEventListener('click', function (ev) {
    var link = ev.target.closest ? ev.target.closest('[data-next]') : null
    if (!link || !root.contains(link)) return
    var next = link.getAttribute('data-next')
    if (!nodeById(next)) return
    ev.preventDefault()
    var cur = currentId()
    var trail = (state() && state().trail) || []
    var curNode = nodeById(cur)
    var isRestart = next === startId
    var newTrail = isRestart
      ? []
      : trail.concat([{ node: cur, q: curNode ? questionOf(curNode) : '', a: link.textContent.replace(/\s+/g, ' ').trim() }])
    window.history.pushState({ tree: { node: next, trail: newTrail } }, '', '#' + next)
    show(next, newTrail, true)
  })

  if (trailList) {
    trailList.addEventListener('click', function (ev) {
      var link = ev.target.closest ? ev.target.closest('[data-back]') : null
      if (!link) return
      ev.preventDefault()
      var index = parseInt(link.getAttribute('data-back'), 10)
      var trail = (state() && state().trail) || []
      var step = trail[index]
      if (!step) return
      var newTrail = trail.slice(0, index)
      window.history.pushState({ tree: { node: step.node, trail: newTrail } }, '', '#' + step.node)
      show(step.node, newTrail, true)
    })
  }

  if (showAllBtn) {
    showAllBtn.addEventListener('click', function () {
      showAll = !showAll
      showAllBtn.setAttribute('aria-pressed', String(showAll))
      showAllBtn.textContent = showAll ? 'Show one question at a time' : 'Show the whole tree'
      root.classList.toggle('app-tree--all', showAll)
      var s = state()
      show(s ? s.node : (idFromHash() || startId), s ? s.trail : [], false)
    })
  }

  window.addEventListener('popstate', function () {
    var s = state()
    if (s && nodeById(s.node)) show(s.node, s.trail, true)
    else show(idFromHash() || startId, [], true)
  })

  var initial = idFromHash() || startId
  var existing = state()
  if (existing && nodeById(existing.node)) {
    show(existing.node, existing.trail, false)
  } else {
    window.history.replaceState({ tree: { node: initial, trail: [] } }, '', initial === startId ? window.location.pathname + window.location.search : '#' + initial)
    show(initial, [], false)
  }
})()
