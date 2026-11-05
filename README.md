# Store Sales Report widget

A self-contained widget that shows a store owner last month's sales: key figures, daily revenue
chart, and a sortable revenue-by-category table, with date-range and payment-method filters. It
is available in English, Spanish and French, in light and dark themes.

It ships in two forms, built from the same code:

| You have…        | Use                                              | Bundle                                               |
| ---------------- | ------------------------------------------------ | ---------------------------------------------------- |
| A Vue 3 app      | the `<StoreSalesReport>` component               | `dist/lib`, about 10 kB gzip (Vue and Chart.js are dependencies) |
| Any other page   | the `<store-sales-report>` custom element        | `dist/wc/store-sales-report.js`, about 88 kB gzip, no dependencies |

Both render the widget inside a Shadow DOM, so your page's CSS can't reach in and the widget's CSS
can't leak out.

## Plain HTML (Web Component)

```html
<script type="module" src="https://<your-cdn>/store-sales-report.js"></script>

<store-sales-report store-id="S-1042" locale="fr" theme="dark"></store-sales-report>
```

Loading the script registers the element. Nothing else is needed: no CSS file, no framework.

```js
const report = document.querySelector('store-sales-report')

report.addEventListener('loaded', (event) => console.log('loaded', event.detail))
report.addEventListener('load-error', (event) => console.warn(event.detail.message))
report.addEventListener('filters-change', (event) => console.log(event.detail))

// Attributes can change at any time; the widget updates in place.
report.setAttribute('theme', 'light')
report.setAttribute('from', '2026-10-01')
```

## Vue 3

Requires Vue 3.5+. The package isn't published to a registry yet. Once it is:

```sh
npm install store-sales-report
```

```vue
<script setup lang="ts">
import {
  StoreSalesReport,
  type FiltersChangeDetail,
  type LoadedDetail,
  type LoadErrorDetail,
} from 'store-sales-report'

const onLoaded = (detail: LoadedDetail) => console.log(detail.transactionCount, 'transactions')
const onError = (detail: LoadErrorDetail) => console.warn(detail.message)
const onFilters = (detail: FiltersChangeDetail) => console.log(detail.from, detail.to)
</script>

<template>
  <StoreSalesReport
    store-id="S-1042"
    locale="es"
    theme="light"
    @loaded="onLoaded"
    @load-error="onError"
    @filters-change="onFilters"
  />
</template>
```

No plugin to install, no global CSS to import, and no `isCustomElement` compiler option: the
component wraps the custom element for you. Vue events carry the same payload as the DOM event's
`detail`.

## Configuration

| Attribute (HTML) | Prop (Vue) | Values                 | Default                         |
| ---------------- | ---------- | ---------------------- | ------------------------------- |
| `store-id`       | `storeId`  | e.g. `S-1042`          | required                        |
| `locale`         | `locale`   | `en`, `es`, `fr`       | `en`                            |
| `theme`          | `theme`    | `light`, `dark`        | `light`                         |
| `from`           | `from`     | `YYYY-MM-DD`           | 30 days ago (UTC)               |
| `to`             | `to`       | `YYYY-MM-DD`           | yesterday (UTC)                 |

- **Locale:** this is the starting language. The store owner can switch languages inside the
  widget. When the attribute later changes to a different value, that value wins. Regional tags such
  as `fr-CA` map to `fr`. Unsupported values fall back to `en`.
- **Date range:** the default is the last 30 complete days. Today is left out because it isn't
  complete yet. All dates are UTC days. Set both `from` and `to`: a missing one is taken from the
  default range. A malformed or reversed range, or one longer than 366 days, falls back to the
  default. The date pickers inside the widget reach back one year.
- **Theme:** unknown values fall back to `light`.

## Events

All events are `CustomEvent`s dispatched on the element. They bubble and are `composed`, so you can
also listen on a parent or on `document`. `event.target` tells you which widget sent them.

| Event            | When                                                             | `detail`                                                    |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `loaded`         | Sales data arrived for the current store and date range          | `{ storeId, currency, from, to, transactionCount }`         |
| `load-error`     | Loading failed. The widget shows an error with a Retry button.   | `{ storeId, from, to, message }`                            |
| `filters-change` | The store owner changed the date range or payment method         | `{ from, to, paymentMethod }`, with `paymentMethod` one of `all`, `cash`, `card`, `ebt`, `mobile` |

`filters-change` fires only for changes made inside the widget, not when you change attributes.
TypeScript types for every payload are exported: `LoadedDetail`, `LoadErrorDetail`,
`FiltersChangeDetail` and `StoreSalesReportEventMap`.

## Layout and styling

- The element is `display: block` and fills the width you give it. Size and position it like any
  block element: `width`, `max-width`, `margin`, grid or flex placement.
- The layout responds to the widget's own width, not the window's. From 760 px wide it shows four
  key figures in a row; from 1,100 px the chart and the table sit side by side. It's designed for
  desktop and laptop screens (1024–1440 px) and still works down to about 480 px wide, where the
  table scrolls inside the widget.
- Inherited styles from your page (font, color, line height) are reset at the widget boundary, so
  the widget looks the same on every page.

## Several widgets on one page

Use as many as you like. Each one has its own store, language, theme, filters and requests, and its
styles live in its own shadow root. The script registers the element only once, even if it's loaded
more than once.

## Data

There is no backend yet. The widget calls a built-in mock of:

```
GET /api/stores/{storeId}/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
```

The mock knows two stores: `S-1042` (USD) and `S-2087` (CAD). Each has about 2,000 transactions
over the 30 complete days before today. It answers after 300–800 ms and fails about 10% of the time,
so you will see the error state and the Retry button. To connect a real API, change the default
`transport` in [`src/api/sales.ts`](src/api/sales.ts) from `mockFetch` to `window.fetch`. The mock
has the same signature.

## Browser support

Current Chrome, Edge, Firefox and Safari: custom elements, Shadow DOM and container queries
(Safari 16+, Firefox 110+).

## Development

```sh
npm install
npm run dev          # Vue playground at http://localhost:5173
npm test             # unit and component tests (Vitest + jsdom)
npm run type-check
npm run lint
npm run build        # type-check, then dist/wc (standalone) and dist/lib (Vue)
docker compose up --build   # builds and serves the plain-HTML demo at http://localhost:8080
```

| Path                            | What                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `src/components/*.ce.vue`       | The widget UI. `.ce.vue` puts each component's styles in the shadow root. |
| `src/element.ts`                | Custom element definition and registration                   |
| `src/StoreSalesReport.ts`       | Vue wrapper around the custom element                         |
| `src/composables/useSalesReport.ts` | Loading, refetching, aborting stale requests              |
| `src/report/`                   | Pure aggregation (KPIs, daily series, categories, sorting) and date helpers |
| `src/i18n/`                     | Messages for en/es/fr and `Intl` formatting                  |
| `src/mock/`, `src/api/`         | Mock endpoint and API client                                 |
| `demo/index.html`               | Plain HTML embedding demo served by Docker                   |
| `playground/`                   | Vue embedding demo for `npm run dev`                         |
