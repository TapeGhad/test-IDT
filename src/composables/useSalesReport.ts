import { onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { fetchSales } from '@/api/sales'
import type { DateRange, SalesResponse } from '@/types'

export type LoadStatus = 'loading' | 'success' | 'error'

export interface SalesRequest extends DateRange {
  storeId: string
}

export interface LoadedSales {
  storeId: string
  sales: SalesResponse
  /** The range these sales were requested for (the filters may already show a newer one). */
  range: DateRange
}

export interface SalesReportCallbacks {
  onLoaded?: (sales: SalesResponse, request: SalesRequest) => void
  onError?: (error: Error, request: SalesRequest) => void
}

/**
 * Loads sales for the store and range and reloads when either changes.
 * Only the latest request wins: a newer one aborts the previous, and late responses are dropped.
 */
export function useSalesReport(
  storeId: Ref<string>,
  range: Ref<DateRange>,
  { onLoaded, onError }: SalesReportCallbacks = {},
) {
  const status = ref<LoadStatus>('loading')
  const result = shallowRef<LoadedSales | null>(null)
  let controller: AbortController | undefined

  async function load() {
    controller?.abort()
    const current = (controller = new AbortController())
    const requestedRange = { ...range.value }
    const request: SalesRequest = { storeId: storeId.value, ...requestedRange }
    // A new range keeps the old figures on screen (dimmed) while loading; a new store does not.
    if (result.value?.storeId !== request.storeId) result.value = null
    status.value = 'loading'

    try {
      const sales = await fetchSales(request.storeId, requestedRange, { signal: current.signal })
      if (current.signal.aborted) return
      result.value = { storeId: request.storeId, sales, range: requestedRange }
      status.value = 'success'
      onLoaded?.(sales, request)
    } catch (error) {
      if (current.signal.aborted) return
      status.value = 'error'
      onError?.(error instanceof Error ? error : new Error(String(error)), request)
    }
  }

  watch([storeId, () => range.value.from, () => range.value.to], load, { immediate: true })
  onScopeDispose(() => controller?.abort())

  return { status, result, reload: load }
}
