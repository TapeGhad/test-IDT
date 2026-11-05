import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockFetch, type MockFetchOptions, type Transport } from '../mockFetch'
import { mulberry32 } from '../generate'
import type { SalesResponse } from '@/types'

const NOW = new Date('2026-11-04T12:00:00Z')

function createTransport(options: MockFetchOptions = {}): Transport {
  return createMockFetch({ random: () => 0.5, now: () => NOW, ...options })
}

async function request(transport: Transport, url: string): Promise<Response> {
  const response = transport(url)
  await vi.runAllTimersAsync()
  return response
}

describe('mock sales endpoint', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['S-1042', 'USD'],
    ['S-2087', 'CAD'],
  ])('returns sales of %s in %s', async (storeId, currency) => {
    const response = await request(
      createTransport(),
      `/api/stores/${storeId}/sales?from=2026-10-05&to=2026-11-03`,
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as SalesResponse
    expect(body).toMatchObject({ storeId, currency, generatedAt: NOW.toISOString() })
    expect(body.transactions.length).toBeGreaterThan(1800)
  })

  it('only returns transactions inside the inclusive date range', async () => {
    const response = await request(
      createTransport(),
      '/api/stores/S-1042/sales?from=2026-10-10&to=2026-10-11',
    )
    const { transactions } = (await response.json()) as SalesResponse
    const days = new Set(transactions.map((t) => t.timestamp.slice(0, 10)))
    expect([...days].sort()).toEqual(['2026-10-10', '2026-10-11'])
  })

  it('has no data for today or the future', async () => {
    const response = await request(
      createTransport(),
      '/api/stores/S-1042/sales?from=2026-11-04&to=2026-12-01',
    )
    expect(((await response.json()) as SalesResponse).transactions).toEqual([])
  })

  it.each([
    ['unknown store', '/api/stores/S-0000/sales?from=2026-10-05&to=2026-11-03', 404],
    ['unknown route', '/api/stores/S-1042/refunds', 404],
    ['missing dates', '/api/stores/S-1042/sales', 400],
    ['malformed date', '/api/stores/S-1042/sales?from=2026-10-5&to=2026-11-03', 400],
    ['impossible date', '/api/stores/S-1042/sales?from=2026-02-31&to=2026-03-03', 400],
    ['from after to', '/api/stores/S-1042/sales?from=2026-11-03&to=2026-10-05', 400],
    ['range longer than a year', '/api/stores/S-1042/sales?from=2025-01-01&to=2026-11-03', 400],
  ])('rejects %s', async (_, url, status) => {
    const response = await request(createTransport(), url)
    expect(response.status).toBe(status)
    expect(await response.json()).toHaveProperty('error')
  })

  it.each([
    [0, 300],
    [0.999, 799],
  ])('responds after 300–800 ms (random %d → %d ms)', async (roll, delay) => {
    let settled = false
    void createTransport({ random: () => roll, failureRate: 0 })(
      '/api/stores/S-1042/sales?from=2026-10-05&to=2026-10-05',
    ).then(() => (settled = true))

    await vi.advanceTimersByTimeAsync(delay - 1)
    expect(settled).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(settled).toBe(true)
  })

  it('fails with 500 when the failure roll is below the failure rate', async () => {
    const rolls = [0.5, 0.05]
    const transport = createTransport({ random: () => rolls.shift() ?? 0.5 })
    const response = await request(
      transport,
      '/api/stores/S-1042/sales?from=2026-10-05&to=2026-10-05',
    )
    expect(response.status).toBe(500)
  })

  it('fails about 10% of the time', async () => {
    const transport = createTransport({ random: mulberry32(7), minDelayMs: 0, maxDelayMs: 0 })
    let failures = 0
    for (let i = 0; i < 1000; i++) {
      const response = await request(
        transport,
        '/api/stores/S-1042/sales?from=2026-10-05&to=2026-10-05',
      )
      if (response.status === 500) failures++
    }
    expect(failures).toBeGreaterThan(70)
    expect(failures).toBeLessThan(130)
  })

  it('rejects with an AbortError when the request is aborted', async () => {
    const controller = new AbortController()
    const response = createTransport()('/api/stores/S-1042/sales?from=2026-10-05&to=2026-10-05', {
      signal: controller.signal,
    })
    controller.abort()
    await expect(response).rejects.toMatchObject({ name: 'AbortError' })
  })
})
