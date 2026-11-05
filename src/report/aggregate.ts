import {
  CATEGORIES,
  type Category,
  type DateRange,
  type PaymentFilter,
  type Transaction,
} from '@/types'
import { eachDay } from './dates'

// Money is summed in integer cents: adding 2,000 floats like 12.47 drifts by fractions of a cent.
const toCents = (amount: number) => Math.round(amount * 100)
const fromCents = (cents: number) => cents / 100

export interface Kpis {
  revenue: number
  transactions: number
  averageBasket: number
  itemsSold: number
}

export interface DailyRevenue {
  date: string
  revenue: number
}

export interface CategoryRevenue {
  category: Category
  revenue: number
  transactions: number
  itemsSold: number
  /** 0–1 share of the total revenue */
  share: number
}

export type SortDirection = 'asc' | 'desc'

export function filterByPayment(
  transactions: readonly Transaction[],
  paymentMethod: PaymentFilter,
): Transaction[] {
  return paymentMethod === 'all'
    ? [...transactions]
    : transactions.filter((t) => t.paymentMethod === paymentMethod)
}

export function computeKpis(transactions: readonly Transaction[]): Kpis {
  let cents = 0
  let itemsSold = 0
  for (const t of transactions) {
    cents += toCents(t.total)
    itemsSold += t.items
  }
  const count = transactions.length
  return {
    revenue: fromCents(cents),
    transactions: count,
    averageBasket: count ? fromCents(Math.round(cents / count)) : 0,
    itemsSold,
  }
}

/** Revenue per day for every day of the range; days without sales are 0. */
export function dailyRevenue(
  transactions: readonly Transaction[],
  range: DateRange,
): DailyRevenue[] {
  const centsByDay = new Map(eachDay(range).map((day) => [day, 0]))
  for (const t of transactions) {
    const day = t.timestamp.slice(0, 10)
    const cents = centsByDay.get(day)
    if (cents !== undefined) centsByDay.set(day, cents + toCents(t.total))
  }
  return [...centsByDay].map(([date, cents]) => ({ date, revenue: fromCents(cents) }))
}

/** One row per category, including categories without sales. */
export function revenueByCategory(transactions: readonly Transaction[]): CategoryRevenue[] {
  const totals = new Map(
    CATEGORIES.map((category) => [category, { cents: 0, transactions: 0, itemsSold: 0 }]),
  )
  let allCents = 0
  for (const t of transactions) {
    const row = totals.get(t.category)!
    row.cents += toCents(t.total)
    row.transactions++
    row.itemsSold += t.items
    allCents += toCents(t.total)
  }
  return [...totals].map(([category, { cents, ...counts }]) => ({
    category,
    revenue: fromCents(cents),
    ...counts,
    share: allCents ? cents / allCents : 0,
  }))
}

/** Numbers compare numerically, everything else as locale-aware text. Returns a new array. */
export function sortRows<T, K extends keyof T>(
  rows: readonly T[],
  key: K,
  direction: SortDirection,
  locale?: string,
): T[] {
  const sign = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const x = a[key]
    const y = b[key]
    const order =
      typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y), locale)
    return order * sign
  })
}
