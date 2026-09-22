/* Site-wide behaviour for collapsible blocks (details.app-reveal):
   - open the block that contains the anchor a link, search result or the
     decision tree points to, so deep links always land on visible content
   - open every block before printing, restore afterwards */
(function () {
  function openAround(el) {
    if (!el) return
    if (el.tagName === 'DETAILS') el.open = true
    var d = el.parentElement ? el.parentElement.closest('details') : null
    while (d) {
      d.open = true
      d = d.parentElement ? d.parentElement.closest('details') : null
    }
  }

  function openForHash(hash) {
    if (!hash || hash.length < 2) return
    var id
    try { id = decodeURIComponent(hash.slice(1)) } catch (e) { id = hash.slice(1) }
    var el = document.getElementById(id)
    if (!el) return
    openAround(el)
    el.scrollIntoView({ block: 'start' })
  }

  if (window.location.hash) openForHash(window.location.hash)
  // The browser may re-scroll to the fragment after load using the collapsed
  // layout, so correct the position once everything has loaded.
  window.addEventListener('load', function () {
    if (window.location.hash) setTimeout(function () { openForHash(window.location.hash) }, 50)
  })
  window.addEventListener('hashchange', function () { openForHash(window.location.hash) })

  // Clicking a link to the hash we are already on does not fire hashchange
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('a[href*="#"]') : null
    if (!a) return
    var href = a.getAttribute('href')
    var hash = href.slice(href.indexOf('#'))
    var samePage = href.indexOf('#') === 0 || href.split('#')[0] === window.location.pathname.split('/').pop()
    if (samePage && hash === window.location.hash) openForHash(hash)
  })

  var openedForPrint = []
  window.addEventListener('beforeprint', function () {
    openedForPrint = []
    Array.prototype.forEach.call(document.querySelectorAll('details.app-reveal:not([open])'), function (d) {
      d.open = true
      openedForPrint.push(d)
    })
  })
  window.addEventListener('afterprint', function () {
    openedForPrint.forEach(function (d) { d.open = false })
    openedForPrint = []
  })
})()
