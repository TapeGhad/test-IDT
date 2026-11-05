import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { fetchSales } from '@/api/sales'
import { StoreSalesReport } from '@/StoreSalesReport'
import { DEFAULT_RANGE, NOW, salesFor } from './fixtures'

vi.mock('@/api/sales', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/sales')>()),
  fetchSales: vi.fn<(typeof import('@/api/sales'))['fetchSales']>(),
}))
vi.mock('@/components/DailyRevenueChart.ce.vue', async () => ({
  default: (await import('./fixtures')).ChartStub,
}))

describe('StoreSalesReport (Vue wrapper)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    vi.mocked(fetchSales).mockImplementation(async (storeId) => salesFor(storeId))
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  async function mountWrapper() {
    const wrapper = mount(StoreSalesReport, {
      props: { storeId: 'S-1042', locale: 'fr', theme: 'dark' },
      attachTo: document.body,
    })
    await flushPromises()
    return { wrapper, root: (wrapper.element as HTMLElement).shadowRoot! }
  }

  it('renders the custom element with its props', async () => {
    const { wrapper, root } = await mountWrapper()

    expect(wrapper.element.tagName).toBe('STORE-SALES-REPORT')
    expect(root.querySelector('h2')?.textContent).toBe('Rapport des ventes')
    expect(root.querySelector('.report')?.getAttribute('data-theme')).toBe('dark')
  })

  it('re-emits DOM events as Vue events with the detail as payload', async () => {
    const { wrapper, root } = await mountWrapper()

    expect(wrapper.emitted('loaded')).toEqual([
      [{ storeId: 'S-1042', currency: 'USD', ...DEFAULT_RANGE, transactionCount: 3 }],
    ])

    const select = root.querySelector<HTMLSelectElement>('select[name="paymentMethod"]')!
    select.value = 'card'
    select.dispatchEvent(new Event('change'))
    await flushPromises()

    expect(wrapper.emitted('filters-change')).toEqual([
      [{ ...DEFAULT_RANGE, paymentMethod: 'card' }],
    ])
  })

  it('passes prop updates through to the element', async () => {
    const { wrapper, root } = await mountWrapper()

    await wrapper.setProps({ locale: 'es', theme: 'light' })
    await flushPromises()

    expect(root.querySelector('h2')?.textContent).toBe('Informe de ventas')
    expect(root.querySelector('.report')?.getAttribute('data-theme')).toBe('light')
  })
})
