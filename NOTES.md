# Notes for reviewers

## Time spent

_To fill in._

## How I used AI tools

_To fill in._

## Decisions where the brief left room

- **"Last 30 days"** means the 30 complete UTC days before today. Today is excluded because it is
  still in progress. The mock generates data for exactly those days, relative to the current date,
  so the default view always has data. The data is deterministic per store and day.
- **About 2,000 transactions per store.** The brief can be read as 2,000 in total; per store gives
  each widget a realistic month of data.
- **Timezone.** The API has no store timezone, so every date is a UTC day: grouping transactions
  into days, date inputs, and chart labels.
- **The payment filter runs on the client.** The endpoint only takes `from` and `to`. Changing the
  dates refetches; changing the payment method re-aggregates the data already loaded.
- **Events** are `loaded`, `load-error` and `filters-change`. `load-error` avoids the native
  `error` name. `filters-change` only fires for changes made by the store owner, because the host
  already knows about its own attribute changes. Each event carries a clean `detail` (Vue's
  built-in custom-element emits would wrap it in an array).
- **Invalid attributes** (an unknown locale or theme, a malformed or reversed range) fall back to
  the defaults instead of breaking the widget.
- **Ranges are capped at one year.** The pickers reach back 366 days and longer ranges fall back to
  the default. This also matters while typing: a date input fires `change` for every digit of a
  year (0002, 0020, 0202…), and without bounds each of those would reload, and a pause could build
  a chart with hundreds of thousands of days.
- **Locale ownership.** The host sets the starting language, and the store owner can switch it
  inside the widget. When the host later changes the attribute to a different value, it wins.
- **Themes** are `light` and `dark` only, as asked. There is no `auto` mode that follows the OS.

## Key trade-offs

- **The Vue component wraps the custom element** instead of being a separate plain SFC. Both
  integrations get the same Shadow DOM isolation (host CSS can't reach in), and there is one code
  path to test. The cost: each widget runs as its own small Vue app, and the host can't pass slots
  or provide/inject into it. That is fine for a sealed widget.
- **No UI kit, no Pinia, no vue-i18n.** UI kits teleport popovers to `document.body` and ship global
  CSS, which breaks Shadow DOM isolation. A global store would couple widgets on the same page. A
  ~80-line typed i18n module, with one instance per widget and `Intl` formatters, can't clash with
  a host app's own vue-i18n. Message keys are type-checked, and a test checks the three locales
  have identical keys.
- **Chart.js** because it's quick to set up, tree-shakes to the bar chart pieces, and renders to
  canvas (no styles to inject). Colors come from the theme's CSS custom properties, read at draw
  time, so there is one source of truth for both themes. It registers its controllers in Chart.js'
  shared registry. That is harmless if the host also uses Chart.js.
- **Native date inputs** keep the bundle small and accessible, but they display dates in the
  *browser's* locale, not the widget's. A localized date-range picker is a next step.
- **The standalone bundle includes Vue and Chart.js** (about 88 kB gzip), so a plain HTML page
  needs nothing else. One copy serves any number of widgets on the page. Vue apps should use the
  library build, which shares the app's Vue.
- **Money is summed in integer cents.** Summing ~2,000 floats such as 12.47 otherwise drifts.
- **Only the latest request wins.** A new request aborts the previous one, and a response that
  arrives after being superseded is dropped. There is a test for this, and I checked that it fails
  without the guard. While a new date range loads, the old figures stay on screen, dimmed; when the
  store changes they are cleared, so one store's numbers never show under another's name.
- **Tests run in jsdom** (Vitest): pure logic, the mock endpoint, i18n, and the real custom element
  with its shadow root, events, retry, isolation between two instances, and styles staying out of
  `document.head`. The Chart.js component is stubbed there because jsdom has no canvas. Nothing runs
  in a real browser yet.

## What I would do next

1. **Playwright tests against the Docker build:** real Shadow DOM and canvas rendering, visual
   snapshots of both themes at 1024 and 1440 px, keyboard navigation, and an axe accessibility
   scan.
2. **A table view of the daily chart** for screen readers and keyboard users. The canvas only has
   a summary `aria-label` today.
3. **Date range presets** (7 / 30 / 90 days, this month) and a picker localized like the rest of the
   widget.
4. **A real API:** a `transport` or base URL and auth passed in as a property, retry with backoff,
   and caching per store and range. Push the payment filter and aggregation to the server once
   stores have far more than 2,000 transactions a month.
5. **Publishing:** CI, a semver release to the internal registry, CDN hosting with content-hashed
   file names, and a CSP nonce option.
6. **Brand theming:** a few documented CSS custom properties or `::part()` hooks, if embedding
   teams need more than light and dark.
