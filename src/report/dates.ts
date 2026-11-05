import type { DateRange } from '@/types'

/** "Last 30 days" = the 30 complete UTC days before today. */
export const DEFAULT_RANGE_DAYS = 30

/** Longest range the widget loads: one year, so the chart never gets thousands of bars. */
export const MAX_RANGE_DAYS = 366

const DAY_MS = 24 * 60 * 60 * 1000
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  // Rejects impossible dates such as 2026-02-31, which Date silently rolls over.
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === value
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return toIsoDate(date)
}

export function todayUtc(now: Date = new Date()): string {
  return toIsoDate(now)
}

export function defaultRange(now: Date = new Date()): DateRange {
  const to = addDays(todayUtc(now), -1)
  return { from: addDays(to, -(DEFAULT_RANGE_DAYS - 1)), to }
}

/** Number of days in the range, both ends included. */
export function rangeLength({ from, to }: DateRange): number {
  // Date-only ISO strings parse as UTC midnight, so the difference is a whole number of days.
  return (Date.parse(to) - Date.parse(from)) / DAY_MS + 1
}

/** Every day from `from` to `to`, inclusive. */
export function eachDay(range: DateRange): string[] {
  const start = Date.parse(range.from)
  return Array.from({ length: rangeLength(range) }, (_, i) =>
    toIsoDate(new Date(start + i * DAY_MS)),
  )
}

export function isValidRange(range: Partial<DateRange>): range is DateRange {
  return (
    isIsoDate(range.from) &&
    isIsoDate(range.to) &&
    range.from <= range.to &&
    rangeLength({ from: range.from, to: range.to }) <= MAX_RANGE_DAYS
  )
}
