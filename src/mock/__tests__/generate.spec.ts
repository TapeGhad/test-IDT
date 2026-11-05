import { describe, expect, it } from 'vitest'
import { generateTransactions } from '../generate'
import { CATEGORIES, PAYMENT_METHODS } from '@/types'

const LAST_DAY = '2026-11-03'

describe('generateTransactions', () => {
  it.each(['S-1042', 'S-2087'])('generates about 2,000 transactions for %s', (storeId) => {
    const transactions = generateTransactions(storeId, LAST_DAY)
    expect(transactions.length).toBeGreaterThan(1800)
    expect(transactions.length).toBeLessThan(2200)
  })

  it('covers exactly the 30 days ending on the last day', () => {
    const days = [
      ...new Set(generateTransactions('S-1042', LAST_DAY).map((t) => t.timestamp.slice(0, 10))),
    ].sort()
    expect(days).toHaveLength(30)
    expect(days[0]).toBe('2026-10-05')
    expect(days[29]).toBe(LAST_DAY)
  })

  it('produces transactions matching the API contract', () => {
    for (const t of generateTransactions('S-1042', LAST_DAY)) {
      expect(t.id).toMatch(/^T-\d{6}$/)
      expect(t.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
      expect(CATEGORIES).toContain(t.category)
      expect(PAYMENT_METHODS).toContain(t.paymentMethod)
      expect(Number.isInteger(t.items) && t.items >= 1).toBe(true)
      expect(t.total).toBeGreaterThan(0)
      expect(Math.round(t.total * 100) / 100).toBe(t.total)
    }
  })

  it('returns transactions sorted by time with unique ids', () => {
    const transactions = generateTransactions('S-1042', LAST_DAY)
    const timestamps = transactions.map((t) => t.timestamp)
    expect(timestamps).toEqual([...timestamps].sort())
    expect(new Set(transactions.map((t) => t.id)).size).toBe(transactions.length)
  })

  it('is deterministic per store and day', () => {
    expect(generateTransactions('S-1042', LAST_DAY)).toEqual(
      generateTransactions('S-1042', LAST_DAY),
    )
    expect(generateTransactions('S-1042', LAST_DAY)).not.toEqual(
      generateTransactions('S-2087', LAST_DAY),
    )
  })

  it('keeps the sales of a day when the 30-day window moves on', () => {
    const salesOn = (day: string, lastDay: string) =>
      generateTransactions('S-1042', lastDay)
        .filter((t) => t.timestamp.startsWith(day))
        .map((t) => ({ ...t, id: '' })) // ids are numbered within the window
    expect(salesOn('2026-10-20', '2026-11-04')).toEqual(salesOn('2026-10-20', '2026-11-03'))
  })
})
