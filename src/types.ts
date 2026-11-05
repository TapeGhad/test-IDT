export const CATEGORIES = [
  'beverages',
  'snacks',
  'tobacco',
  'grocery',
  'lottery',
  'household',
] as const
export type Category = (typeof CATEGORIES)[number]

export const PAYMENT_METHODS = ['cash', 'card', 'ebt', 'mobile'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type PaymentFilter = PaymentMethod | 'all'

export const LOCALES = ['en', 'es', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

export type Theme = 'light' | 'dark'

export interface Transaction {
  id: string
  /** ISO 8601, UTC */
  timestamp: string
  category: Category
  paymentMethod: PaymentMethod
  items: number
  /** In the store currency, 2 decimals */
  total: number
}

export interface SalesResponse {
  storeId: string
  /** ISO 4217 code, e.g. USD or CAD */
  currency: string
  generatedAt: string
  transactions: Transaction[]
}

/** Inclusive range of UTC calendar days, both `YYYY-MM-DD`. */
export interface DateRange {
  from: string
  to: string
}

/** `detail` payloads of the DOM events the widget dispatches. */
export interface LoadedDetail extends DateRange {
  storeId: string
  currency: string
  transactionCount: number
}

export interface LoadErrorDetail extends DateRange {
  storeId: string
  message: string
}

export interface FiltersChangeDetail extends DateRange {
  paymentMethod: PaymentFilter
}

export interface StoreSalesReportEventMap {
  loaded: CustomEvent<LoadedDetail>
  'load-error': CustomEvent<LoadErrorDetail>
  'filters-change': CustomEvent<FiltersChangeDetail>
}
