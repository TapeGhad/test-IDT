import { defineCustomElement } from 'vue'
import SalesReport from './components/SalesReport.ce.vue'

export const STORE_SALES_REPORT_TAG = 'store-sales-report'

export const StoreSalesReportElement = defineCustomElement(SalesReport)
export type StoreSalesReportElement = InstanceType<typeof StoreSalesReportElement>

/** Registers `<store-sales-report>`. Safe to call more than once. */
export function defineStoreSalesReport(): void {
  if (!customElements.get(STORE_SALES_REPORT_TAG)) {
    customElements.define(STORE_SALES_REPORT_TAG, StoreSalesReportElement)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'store-sales-report': StoreSalesReportElement
  }
}
