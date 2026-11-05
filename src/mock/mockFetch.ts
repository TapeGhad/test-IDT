import type { SalesResponse, Transaction } from '@/types'
import { addDays, isValidRange, todayUtc } from '@/report/dates'
import { generateTransactions } from './generate'
import { MOCK_STORES } from './stores'

/** The subset of `fetch` the widget uses, so the mock and the real thing are interchangeable. */
export type Transport = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>

export interface MockFetchOptions {
  random?: () => number
  failureRate?: number
  minDelayMs?: number
  maxDelayMs?: number
  now?: () => Date
}

const SALES_ROUTE = /^\/api\/stores\/([^/]+)\/sales$/

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true },
    )
  })
}

/**
 * Mock of `GET /api/stores/{storeId}/sales?from=YYYY-MM-DD&to=YYYY-MM-DD`.
 * Responds after a random 300–800 ms delay and fails ~10% of the time with a 500.
 * Data covers the 30 complete UTC days before today.
 */
export function createMockFetch({
  random = Math.random,
  failureRate = 0.1,
  minDelayMs = 300,
  maxDelayMs = 800,
  now = () => new Date(),
}: MockFetchOptions = {}): Transport {
  const cache = new Map<string, Transaction[]>()

  function storeTransactions(storeId: string, lastDay: string): Transaction[] {
    const key = `${storeId}:${lastDay}`
    let transactions = cache.get(key)
    if (!transactions) {
      transactions = generateTransactions(storeId, lastDay)
      cache.set(key, transactions)
    }
    return transactions
  }

  return async (url, init) => {
    await sleep(minDelayMs + random() * (maxDelayMs - minDelayMs), init?.signal)
    if (random() < failureRate) return json(500, { error: 'Internal server error' })

    const { pathname, searchParams } = new URL(url, 'http://localhost')
    const encodedId = SALES_ROUTE.exec(pathname)?.[1]
    if (encodedId === undefined) return json(404, { error: 'Not found' })

    const storeId = decodeURIComponent(encodedId)
    const store = MOCK_STORES[storeId]
    if (!store) return json(404, { error: `Unknown store ${storeId}` })

    const range = { from: searchParams.get('from') ?? '', to: searchParams.get('to') ?? '' }
    if (!isValidRange(range)) return json(400, { error: 'Invalid date range' })

    const generatedAt = now()
    const transactions = storeTransactions(storeId, addDays(todayUtc(generatedAt), -1)).filter(
      (transaction) => {
        const day = transaction.timestamp.slice(0, 10)
        return day >= range.from && day <= range.to
      },
    )

    const body: SalesResponse = {
      storeId,
      currency: store.currency,
      generatedAt: generatedAt.toISOString(),
      transactions,
    }
    return json(200, body)
  }
}

export const mockFetch = createMockFetch()
