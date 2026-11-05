import { defineComponent, h } from 'vue'
import type { DateRange, SalesResponse } from '@/types'

export const NOW = new Date('2026-11-04T12:00:00Z')
export const DEFAULT_RANGE: DateRange = { from: '2026-10-05', to: '2026-11-03' }

/** Revenue 35.50 over 3 transactions and 6 items; cash is only T-2 (5.50). */
export function salesFor(storeId: string): SalesResponse {
  return {
    storeId,
    currency: storeId === 'S-2087' ? 'CAD' : 'USD',
    generatedAt: NOW.toISOString(),
    transactions: [
      {
        id: 'T-000001',
        timestamp: '2026-10-05T10:00:00Z',
        category: 'beverages',
        paymentMethod: 'card',
        items: 2,
        total: 10,
      },
      {
        id: 'T-000002',
        timestamp: '2026-10-06T10:00:00Z',
        category: 'snacks',
        paymentMethod: 'cash',
        items: 1,
        total: 5.5,
      },
      {
        id: 'T-000003',
        timestamp: '2026-10-06T11:00:00Z',
        category: 'grocery',
        paymentMethod: 'card',
        items: 3,
        total: 20,
      },
    ],
  }
}

/** jsdom has no canvas, so the Chart.js component is replaced in widget tests. */
export const ChartStub = defineComponent({
  props: { points: { type: Array, required: true } },
  setup: (props) => () => h('div', { class: 'chart-stub', 'data-points': props.points.length }),
})

/** Collects the widget's DOM events as `[type, detail]` pairs. */
export function recordEvents(target: EventTarget) {
  const events: [string, unknown][] = []
  for (const type of ['loaded', 'load-error', 'filters-change']) {
    target.addEventListener(type, (event) => events.push([type, (event as CustomEvent).detail]))
  }
  return events
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}
