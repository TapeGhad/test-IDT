import type { Category, PaymentMethod, Transaction } from '@/types'
import { addDays, DEFAULT_RANGE_DAYS } from '@/report/dates'

export const TRANSACTIONS_PER_STORE = 2000

/** Seeded PRNG (mulberry32): the same seed always yields the same sequence. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a string hash, used to turn a store id and a day into a seed. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

interface CategoryProfile {
  weight: number
  minUnitPrice: number
  maxUnitPrice: number
  maxItems: number
}

const CATEGORY_PROFILES: Record<Category, CategoryProfile> = {
  beverages: { weight: 30, minUnitPrice: 1.5, maxUnitPrice: 6, maxItems: 4 },
  snacks: { weight: 25, minUnitPrice: 1, maxUnitPrice: 4.5, maxItems: 5 },
  tobacco: { weight: 15, minUnitPrice: 8, maxUnitPrice: 14, maxItems: 2 },
  grocery: { weight: 15, minUnitPrice: 2, maxUnitPrice: 9, maxItems: 8 },
  lottery: { weight: 10, minUnitPrice: 1, maxUnitPrice: 20, maxItems: 3 },
  household: { weight: 5, minUnitPrice: 3, maxUnitPrice: 15, maxItems: 3 },
}

const CATEGORY_WEIGHTS = Object.fromEntries(
  Object.entries(CATEGORY_PROFILES).map(([category, profile]) => [category, profile.weight]),
) as Record<Category, number>

const PAYMENT_WEIGHTS: Record<PaymentMethod, number> = { cash: 30, card: 45, ebt: 10, mobile: 15 }

const OPENS_AT_SECONDS = 6 * 3600
const CLOSES_AT_SECONDS = 22 * 3600

function pickWeighted<T extends string>(weights: Record<T, number>, random: () => number): T {
  const entries = Object.entries(weights) as [T, number][]
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total
  for (const [key, weight] of entries) {
    roll -= weight
    if (roll < 0) return key
  }
  return entries[entries.length - 1]![0]
}

/**
 * About `target` transactions over the `days` days ending on `lastDay` (inclusive).
 * Weekends are busier; timestamps fall between 06:00 and 22:00 UTC.
 */
export function generateTransactions(
  storeId: string,
  lastDay: string,
  { days = DEFAULT_RANGE_DAYS, target = TRANSACTIONS_PER_STORE } = {},
): Transaction[] {
  const firstDay = addDays(lastDay, -(days - 1))
  const transactions: Transaction[] = []

  for (let offset = 0; offset < days; offset++) {
    const day = addDays(firstDay, offset)
    // Seeded per store and day, so a day's sales stay the same as the 30-day window moves on.
    const random = mulberry32(hash(`${storeId}:${day}`))
    const dayStart = Date.parse(`${day}T00:00:00Z`)
    const weekday = new Date(dayStart).getUTCDay()
    // 5 weekdays × 0.9 + 2 weekend days × 1.25 ≈ 7, so the average stays at target / days.
    const busyness = weekday === 0 || weekday === 6 ? 1.25 : 0.9
    const count = Math.round((target / days) * busyness * (0.85 + random() * 0.3))

    const seconds = Array.from(
      { length: count },
      () => OPENS_AT_SECONDS + Math.floor(random() * (CLOSES_AT_SECONDS - OPENS_AT_SECONDS)),
    ).sort((a, b) => a - b)

    for (const second of seconds) {
      const category = pickWeighted(CATEGORY_WEIGHTS, random)
      const profile = CATEGORY_PROFILES[category]
      const items = 1 + Math.floor(random() * profile.maxItems)
      const unitPrice =
        profile.minUnitPrice + random() * (profile.maxUnitPrice - profile.minUnitPrice)

      transactions.push({
        id: `T-${String(transactions.length + 1).padStart(6, '0')}`,
        timestamp: new Date(dayStart + second * 1000).toISOString().replace('.000Z', 'Z'),
        category,
        paymentMethod: pickWeighted(PAYMENT_WEIGHTS, random),
        items,
        total: Math.round(items * unitPrice * 100) / 100,
      })
    }
  }

  return transactions
}
