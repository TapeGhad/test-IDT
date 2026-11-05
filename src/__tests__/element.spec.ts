import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { fetchSales, SalesApiError } from '@/api/sales'
import { defineStoreSalesReport } from '@/element'
import type { SalesResponse } from '@/types'
import { DEFAULT_RANGE, deferred, NOW, recordEvents, salesFor } from './fixtures'

vi.mock('@/api/sales', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/sales')>()),
  fetchSales: vi.fn<(typeof import('@/api/sales'))['fetchSales']>(),
}))
vi.mock('@/components/DailyRevenueChart.ce.vue', async () => ({
  default: (await import('./fixtures')).ChartStub,
}))

const fetchSalesMock = vi.mocked(fetchSales)

async function mountWidget(attributes: Record<string, string>) {
  const element = document.createElement('store-sales-report')
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
  const events = recordEvents(element)
  document.body.append(element)
  await flushPromises()
  const root = element.shadowRoot!
  return {
    element,
    root,
    events,
    text: (selector: string) => root.querySelector(selector)?.textContent?.trim(),
  }
}

async function change(control: HTMLInputElement | HTMLSelectElement | null, value: string) {
  control!.value = value
  control!.dispatchEvent(new Event('change'))
  await flushPromises()
}

describe('<store-sales-report>', () => {
  beforeAll(() => {
    defineStoreSalesReport()
  })

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    fetchSalesMock.mockReset()
    fetchSalesMock.mockImplementation(async (storeId) => salesFor(storeId))
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('loads the last 30 days for the store and shows the key figures', async () => {
    const { text } = await mountWidget({ 'store-id': 'S-1042' })

    expect(fetchSalesMock).toHaveBeenCalledWith('S-1042', DEFAULT_RANGE, expect.anything())
    expect(text('[data-kpi="revenue"] dd')).toBe('$35.50')
    expect(text('[data-kpi="transactions"] dd')).toBe('3')
    expect(text('[data-kpi="averageBasket"] dd')).toBe('$11.83')
    expect(text('[data-kpi="itemsSold"] dd')).toBe('6')
    expect(text('.report__subtitle')).toBe('Store S-1042 · USD')
  })

  it('renders the daily chart for every day of the range and a category table', async () => {
    const { root } = await mountWidget({
      'store-id': 'S-1042',
      from: '2026-10-05',
      to: '2026-10-11',
    })

    expect(root.querySelector('.chart-stub')?.getAttribute('data-points')).toBe('7')
    const firstRow = root.querySelector('tbody tr')!
    expect(firstRow.querySelector('th')?.textContent).toBe('Grocery')
    expect(root.querySelectorAll('tbody tr')).toHaveLength(6)
  })

  it('uses the date range from the attributes', async () => {
    await mountWidget({ 'store-id': 'S-1042', from: '2026-10-10', to: '2026-10-20' })
    expect(fetchSalesMock).toHaveBeenLastCalledWith(
      'S-1042',
      { from: '2026-10-10', to: '2026-10-20' },
      expect.anything(),
    )
  })

  it.each([
    ['reversed', { from: '2026-10-20', to: '2026-10-10' }],
    ['longer than a year', { from: '1000-01-01', to: '2026-10-10' }],
    ['malformed', { from: '2026-10-1', to: '2026-10-10' }],
  ])('falls back to the default range when the attributes are %s', async (_, range) => {
    await mountWidget({ 'store-id': 'S-1042', ...range })
    expect(fetchSalesMock).toHaveBeenLastCalledWith('S-1042', DEFAULT_RANGE, expect.anything())
  })

  it('dispatches a bubbling `loaded` event with the request details', async () => {
    const seen: unknown[] = []
    const onLoaded = (event: Event) => seen.push((event as CustomEvent).detail)
    document.addEventListener('loaded', onLoaded)

    const { events } = await mountWidget({ 'store-id': 'S-2087' })
    document.removeEventListener('loaded', onLoaded)

    const detail = { storeId: 'S-2087', currency: 'CAD', ...DEFAULT_RANGE, transactionCount: 3 }
    expect(events).toEqual([['loaded', detail]])
    expect(seen).toEqual([detail])
  })

  it('shows an error with a retry button and dispatches `load-error`', async () => {
    fetchSalesMock.mockRejectedValueOnce(new SalesApiError('Internal server error', 500))
    const { root, events, text } = await mountWidget({ 'store-id': 'S-1042' })

    expect(text('[role="alert"] p')).toBe('Sales data could not be loaded.')
    expect(events).toEqual([
      ['load-error', { storeId: 'S-1042', ...DEFAULT_RANGE, message: 'Internal server error' }],
    ])

    root.querySelector<HTMLButtonElement>('[role="alert"] button')!.click()
    await flushPromises()

    expect(root.querySelector('[role="alert"]')).toBeNull()
    expect(text('[data-kpi="revenue"] dd')).toBe('$35.50')
    expect(events.at(-1)?.[0]).toBe('loaded')
  })

  it('filters by payment method on the client and dispatches `filters-change`', async () => {
    const { root, events, text } = await mountWidget({ 'store-id': 'S-1042' })

    await change(root.querySelector('select[name="paymentMethod"]'), 'cash')

    expect(text('[data-kpi="revenue"] dd')).toBe('$5.50')
    expect(text('[data-kpi="transactions"] dd')).toBe('1')
    expect(fetchSalesMock).toHaveBeenCalledTimes(1)
    expect(events.at(-1)).toEqual(['filters-change', { ...DEFAULT_RANGE, paymentMethod: 'cash' }])
  })

  it('refetches when the store owner changes the date range', async () => {
    const { root, events } = await mountWidget({ 'store-id': 'S-1042' })

    await change(root.querySelector('input[name="from"]'), '2026-10-20')

    const range = { from: '2026-10-20', to: DEFAULT_RANGE.to }
    expect(fetchSalesMock).toHaveBeenLastCalledWith('S-1042', range, expect.anything())
    expect(events).toContainEqual(['filters-change', { ...range, paymentMethod: 'all' }])
  })

  it('keeps the range valid when the start moves past the end', async () => {
    const { root } = await mountWidget({
      'store-id': 'S-1042',
      from: '2026-10-05',
      to: '2026-10-10',
    })

    await change(root.querySelector('input[name="from"]'), '2026-10-15')

    expect(fetchSalesMock).toHaveBeenLastCalledWith(
      'S-1042',
      { from: '2026-10-15', to: '2026-10-15' },
      expect.anything(),
    )
  })

  it('ignores dates outside the last year, such as a year still being typed', async () => {
    const { root, events } = await mountWidget({ 'store-id': 'S-1042' })
    const from = root.querySelector<HTMLInputElement>('input[name="from"]')!

    await change(from, '0020-10-20')
    await change(root.querySelector('input[name="to"]'), '0002-11-03')

    expect(fetchSalesMock).toHaveBeenCalledTimes(1)
    expect(events.map(([type]) => type)).toEqual(['loaded'])

    from.dispatchEvent(new Event('blur'))
    expect(from.value).toBe(DEFAULT_RANGE.from)
  })

  it('does not show the previous store while the next one loads', async () => {
    const { element, root, text } = await mountWidget({ 'store-id': 'S-1042' })
    const next = deferred<SalesResponse>()
    fetchSalesMock.mockReturnValueOnce(next.promise)

    element.setAttribute('store-id', 'S-2087')
    await flushPromises()
    expect(text('.report__subtitle')).toBe('Store S-2087')
    expect(root.querySelector('[data-kpi]')).toBeNull()

    next.resolve(salesFor('S-2087'))
    await flushPromises()
    expect(text('[data-kpi="revenue"] dd')).toBe('CA$35.50')
  })

  it('shows only the latest response when requests overlap', async () => {
    const slow = deferred<SalesResponse>()
    const fast = deferred<SalesResponse>()
    fetchSalesMock.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise)

    const { element, text } = await mountWidget({ 'store-id': 'S-1042' })
    element.setAttribute('store-id', 'S-2087')
    await flushPromises()

    fast.resolve(salesFor('S-2087'))
    await flushPromises()
    slow.resolve(salesFor('S-1042'))
    await flushPromises()

    expect(text('.report__subtitle')).toBe('Store S-2087 · CAD')
  })

  it('starts in the host language, lets the owner switch it, and follows the attribute', async () => {
    const { element, root, text } = await mountWidget({ 'store-id': 'S-1042', locale: 'fr' })
    expect(text('h2')).toBe('Rapport des ventes')
    expect(text('[data-kpi="revenue"] dd')?.replace(/\s/g, ' ')).toBe('35,50 $US')

    await change(root.querySelector('.report__header select'), 'es')
    expect(text('h2')).toBe('Informe de ventas')

    element.setAttribute('locale', 'en')
    await flushPromises()
    expect(text('h2')).toBe('Sales report')
  })

  it.each([
    [undefined, 'light'],
    ['dark', 'dark'],
    ['neon', 'light'],
  ])('theme %s renders as %s', async (theme, expected) => {
    const { root } = await mountWidget({ 'store-id': 'S-1042', ...(theme && { theme }) })
    expect(root.querySelector('.report')?.getAttribute('data-theme')).toBe(expected)
  })

  it('keeps several widgets independent of each other', async () => {
    const first = await mountWidget({ 'store-id': 'S-1042', locale: 'fr' })
    const second = await mountWidget({ 'store-id': 'S-2087', locale: 'en', theme: 'dark' })

    await change(first.root.querySelector('select[name="paymentMethod"]'), 'cash')

    expect(first.text('h2')).toBe('Rapport des ventes')
    expect(second.text('h2')).toBe('Sales report')
    expect(second.text('[data-kpi="revenue"] dd')).toBe('CA$35.50')
    expect(second.events.map(([type]) => type)).toEqual(['loaded'])
  })

  it('keeps its styles inside the shadow root', async () => {
    const headStylesBefore = document.head.querySelectorAll('style').length
    const { root } = await mountWidget({ 'store-id': 'S-1042' })

    const css = [...root.querySelectorAll('style')].map((style) => style.textContent).join('\n')
    expect(css).toContain(':host')
    expect(css).toContain('.table') // a child component's styles are injected too
    expect(document.head.querySelectorAll('style')).toHaveLength(headStylesBefore)
  })
})
