import { describe, expect, it } from 'vitest'
import {
  computeKpis,
  dailyRevenue,
  filterByPayment,
  revenueByCategory,
  sortRows,
} from '../aggregate'
import type { Transaction } from '@/types'

let nextId = 1
function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: `T-${nextId++}`,
    timestamp: '2026-10-10T10:00:00Z',
    category: 'beverages',
    paymentMethod: 'card',
    items: 1,
    total: 1,
    ...overrides,
  }
}

describe('filterByPayment', () => {
  const transactions = [tx({ paymentMethod: 'cash' }), tx({ paymentMethod: 'card' })]

  it('keeps everything for "all"', () => {
    expect(filterByPayment(transactions, 'all')).toEqual(transactions)
  })

  it('keeps only the selected method', () => {
    expect(filterByPayment(transactions, 'cash')).toEqual([transactions[0]])
  })
})

describe('computeKpis', () => {
  it('sums revenue, transactions and items and averages the basket', () => {
    const kpis = computeKpis([tx({ total: 12.47, items: 3 }), tx({ total: 7.53, items: 2 })])
    expect(kpis).toEqual({ revenue: 20, transactions: 2, averageBasket: 10, itemsSold: 5 })
  })

  it('does not accumulate floating point errors', () => {
    const kpis = computeKpis(Array.from({ length: 10 }, () => tx({ total: 0.1 })))
    expect(kpis.revenue).toBe(1)
  })

  it('rounds the average basket to cents', () => {
    expect(
      computeKpis([tx({ total: 1 }), tx({ total: 1 }), tx({ total: 0.01 })]).averageBasket,
    ).toBe(0.67)
  })

  it('returns zeros for no transactions', () => {
    expect(computeKpis([])).toEqual({ revenue: 0, transactions: 0, averageBasket: 0, itemsSold: 0 })
  })
})

describe('dailyRevenue', () => {
  it('returns every day of the range and fills days without sales with 0', () => {
    const transactions = [
      tx({ timestamp: '2026-10-10T08:00:00Z', total: 2.5 }),
      tx({ timestamp: '2026-10-10T21:59:59Z', total: 0.25 }),
      tx({ timestamp: '2026-10-12T12:00:00Z', total: 4 }),
    ]
    expect(dailyRevenue(transactions, { from: '2026-10-10', to: '2026-10-12' })).toEqual([
      { date: '2026-10-10', revenue: 2.75 },
      { date: '2026-10-11', revenue: 0 },
      { date: '2026-10-12', revenue: 4 },
    ])
  })

  it('ignores transactions outside the range', () => {
    const transactions = [tx({ timestamp: '2026-10-09T23:59:59Z', total: 5 })]
    expect(dailyRevenue(transactions, { from: '2026-10-10', to: '2026-10-10' })).toEqual([
      { date: '2026-10-10', revenue: 0 },
    ])
  })
})

describe('revenueByCategory', () => {
  it('aggregates per category with the share of total revenue', () => {
    const rows = revenueByCategory([
      tx({ category: 'snacks', total: 3, items: 2 }),
      tx({ category: 'snacks', total: 1, items: 1 }),
      tx({ category: 'lottery', total: 4, items: 1 }),
    ])
    expect(rows.find((r) => r.category === 'snacks')).toEqual({
      category: 'snacks',
      revenue: 4,
      transactions: 2,
      itemsSold: 3,
      share: 0.5,
    })
    expect(rows.find((r) => r.category === 'lottery')?.share).toBe(0.5)
  })

  it('always lists all six categories', () => {
    const rows = revenueByCategory([])
    expect(rows.map((r) => r.category)).toEqual([
      'beverages',
      'snacks',
      'tobacco',
      'grocery',
      'lottery',
      'household',
    ])
    expect(rows.every((r) => r.revenue === 0 && r.share === 0)).toBe(true)
  })
})

describe('sortRows', () => {
  const rows = [
    { name: 'Épicerie', revenue: 10 },
    { name: 'Boissons', revenue: 30 },
    { name: 'Tabac', revenue: 2 },
  ]

  it('sorts numbers in both directions', () => {
    expect(sortRows(rows, 'revenue', 'asc').map((r) => r.revenue)).toEqual([2, 10, 30])
    expect(sortRows(rows, 'revenue', 'desc').map((r) => r.revenue)).toEqual([30, 10, 2])
  })

  it('sorts text with the locale (accents sort with their base letter)', () => {
    expect(sortRows(rows, 'name', 'asc', 'fr').map((r) => r.name)).toEqual([
      'Boissons',
      'Épicerie',
      'Tabac',
    ])
  })

  it('does not mutate the input', () => {
    const copy = [...rows]
    sortRows(rows, 'revenue', 'asc')
    expect(rows).toEqual(copy)
  })
})
