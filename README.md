# Puzzle #48 — real-time client-side search engine (Fuse.js)

Brief (Task Forge puzzle tracker): real-time client-side search engine (Fuse.js/FlexSearch) — none/generic.

Instant fuzzy search over 100 books that runs **entirely in the browser** — no
server, no API round-trips, works offline.

## How it works

- **Fuse.js 7.0.0, vendored locally** (`fuse.min.js`, no CDN at runtime) builds
  a fuzzy index over the dataset once on load; every keystroke searches in
  sub-millisecond-to-low-ms time against the in-memory index.
- Multi-field (`title` + `category`), typo-tolerant (`threshold: 0.4`,
  `ignoreLocation`), with **character-level match highlighting** using Fuse's
  match indices wrapped in `<mark>`.
- Debounced input (60ms) so fast typing doesn't trigger redundant renders.
- A live stats line shows result count + search time.

The dataset (`data.js`) is **real data** — the 100 books scraped by puzzle #45,
enriched with a category and rating, baked into a static JS file.

## Verified live (automated, in a real browser)

Driven via claude-in-chrome:

| query | behavior | result |
|---|---|---|
| `light` | exact substring | 8 results, "A Light in the Attic" first, highlighted, ~24ms |
| `lihgt` | **typo** (transposed) | still finds "A Light in the Attic" first — real fuzzy match |
| `mystery` | category field | 11 results (the Mystery category) |
| `women` | title term | 14 results |
| `` (empty) | shows all (capped 50) | "100 books" |
| `zzzqqqxyw` | nonsense | 0 results |

Visually confirmed character-level gold highlighting across exact and fuzzy
matches (e.g. "On a Mid**night** Clear", scattered-letter matches), each row
with its category pill + ★rating + £price.

## Security
Match highlighting builds an HTML string, but every data slice is HTML-escaped
(`escapeHtml`, all 5 special chars) before concatenation and the only inserted
markup is the literal `<mark>` tags — so no field can inject markup. (The
PostToolUse XSS hook flagged the `innerHTML`; this is the standard safe
highlight pattern, since `textContent` can't wrap matches.)

## Deploy
`wrangler.jsonc` included (static Worker). Public deploy pending the same
one-time `wrangler login` as #35/#39/#40/#43/#44/#46.
