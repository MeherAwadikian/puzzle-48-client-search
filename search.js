// Real-time client-side search with Fuse.js — everything runs in the browser,
// no server round-trips. Fuzzy/typo-tolerant, multi-field, with match
// highlighting via Fuse's match indices.

(function () {
  const books = window.BOOKS || []
  const input = document.getElementById('q')
  const results = document.getElementById('results')
  const empty = document.getElementById('empty')
  const stats = document.getElementById('stats')
  document.getElementById('count').textContent = books.length

  // Build the index once (cost paid upfront, then every keystroke is instant).
  const fuse = new Fuse(books, {
    keys: ['title', 'category'],
    includeMatches: true,   // gives us the char ranges to highlight
    includeScore: true,
    threshold: 0.4,         // fuzzy tolerance (0 = exact, 1 = anything)
    ignoreLocation: true,   // match anywhere in the string
    minMatchCharLength: 2,
  })

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ))
  }

  // Wrap the matched character ranges (from Fuse) in <mark>, escaping the rest.
  function highlight(text, indices) {
    if (!indices || !indices.length) return escapeHtml(text)
    let out = ''
    let last = 0
    // indices are [start,end] inclusive, sorted
    for (const [start, end] of indices) {
      out += escapeHtml(text.slice(last, start))
      out += '<mark>' + escapeHtml(text.slice(start, end + 1)) + '</mark>'
      last = end + 1
    }
    out += escapeHtml(text.slice(last))
    return out
  }

  function matchIndicesFor(matches, key) {
    const m = matches && matches.find((x) => x.key === key)
    return m ? m.indices : null
  }

  function render(query) {
    const t0 = performance.now()
    let items
    if (!query.trim()) {
      items = books.slice(0, 50).map((b) => ({ item: b, matches: [] }))
    } else {
      items = fuse.search(query, { limit: 50 })
    }
    const ms = (performance.now() - t0).toFixed(1)

    results.replaceChildren()
    empty.hidden = items.length > 0 || !query.trim() ? true : false

    for (const { item, matches } of items) {
      const li = document.createElement('li')
      li.className = 'row'
      const titleEl = document.createElement('span')
      titleEl.className = 'title'
      titleEl.innerHTML = highlight(item.title, matchIndicesFor(matches, 'title'))
      const catEl = document.createElement('span')
      catEl.className = 'cat'
      catEl.innerHTML = highlight(item.category, matchIndicesFor(matches, 'category'))
      const metaEl = document.createElement('span')
      metaEl.className = 'meta'
      metaEl.textContent = '★' + item.rating + ' · £' + item.price
      li.append(titleEl, catEl, metaEl)
      results.appendChild(li)
    }

    stats.textContent = query.trim()
      ? `${items.length} result${items.length === 1 ? '' : 's'} in ${ms}ms`
      : `${books.length} books`
  }

  // Debounce keystrokes slightly (search is already sub-ms, but this avoids
  // redundant renders during fast typing).
  let timer = null
  input.addEventListener('input', () => {
    clearTimeout(timer)
    timer = setTimeout(() => render(input.value), 60)
  })

  // Expose for automated testing.
  window.__search = (q) => {
    render(q)
    return {
      query: q,
      count: results.children.length,
      firstTitle: results.firstChild ? results.firstChild.querySelector('.title').textContent : null,
      firstHasMark: results.firstChild ? !!results.firstChild.querySelector('mark') : false,
      stats: stats.textContent,
    }
  }

  render('')
})()
