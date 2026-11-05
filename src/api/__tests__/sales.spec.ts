import { describe, expect, it, vi } from 'vitest'
import { fetchSales, SalesApiError } from '../sales'
import type { Transport } from '@/mock/mockFetch'
import type { SalesResponse } from '@/types'

const RANGE = { from: '2026-10-05', to: '2026-11-03' }

describe('fetchSales', () => {
  it('requests the sales endpoint and returns the parsed body', async () => {
    const body: SalesResponse = {
      storeId: 'S-1042',
      currency: 'USD',
      generatedAt: '2026-11-04T12:00:00.000Z',
      transactions: [],
    }
    const transport = vi.fn<Transport>().mockResolvedValue(Response.json(body))
    const { signal } = new AbortController()

    await expect(fetchSales('S-1042', RANGE, { transport, signal })).resolves.toEqual(body)
    expect(transport).toHaveBeenCalledWith(
      '/api/stores/S-1042/sales?from=2026-10-05&to=2026-11-03',
      { signal },
    )
  })

  it('encodes the store id', async () => {
    const transport = vi.fn<Transport>().mockResolvedValue(Response.json({}))
    await fetchSales('a/b', RANGE, { transport })
    expect(transport.mock.calls[0]![0]).toMatch(/^\/api\/stores\/a%2Fb\/sales\?/)
  })

  it('throws SalesApiError with the server message and status', async () => {
    const transport = vi
      .fn<Transport>()
      .mockResolvedValue(Response.json({ error: 'Boom' }, { status: 500 }))
    await expect(fetchSales('S-1042', RANGE, { transport })).rejects.toEqual(
      expect.objectContaining({ name: 'SalesApiError', message: 'Boom', status: 500 }),
    )
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    const transport = vi.fn<Transport>().mockResolvedValue(new Response('oops', { status: 502 }))
    const error = await fetchSales('S-1042', RANGE, { transport }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(SalesApiError)
    expect((error as SalesApiError).message).toBe('Request failed with status 502')
  })
})
