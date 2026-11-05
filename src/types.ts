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
