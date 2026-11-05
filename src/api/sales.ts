import type { DateRange, SalesResponse } from '@/types'
import { mockFetch, type Transport } from '@/mock/mockFetch'

export class SalesApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'SalesApiError'
  }
}

export interface FetchSalesOptions {
  signal?: AbortSignal
  /** Swap for `window.fetch` once a real backend exists. */
  transport?: Transport
}

export async function fetchSales(
  storeId: string,
  { from, to }: DateRange,
  { signal, transport = mockFetch }: FetchSalesOptions = {},
): Promise<SalesResponse> {
  const query = new URLSearchParams({ from, to })
  const response = await transport(`/api/stores/${encodeURIComponent(storeId)}/sales?${query}`, {
    signal,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new SalesApiError(
      body?.error ?? `Request failed with status ${response.status}`,
      response.status,
    )
  }
  return (await response.json()) as SalesResponse
}
