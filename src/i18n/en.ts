const en = {
  title: 'Sales report',
  store: 'Store {storeId}',
  language: 'Language',
  filters: {
    from: 'From',
    to: 'To',
    paymentMethod: 'Payment method',
    allPaymentMethods: 'All payment methods',
  },
  kpi: {
    revenue: 'Total revenue',
    transactions: 'Transactions',
    averageBasket: 'Average basket',
    itemsSold: 'Items sold',
  },
  chart: {
    title: 'Daily revenue',
    description: 'Bar chart of daily revenue from {from} to {to}',
  },
  table: {
    title: 'Revenue by category',
    category: 'Category',
    transactions: 'Transactions',
    itemsSold: 'Items',
    revenue: 'Revenue',
    share: 'Share',
    total: 'Total',
  },
  categories: {
    beverages: 'Beverages',
    snacks: 'Snacks',
    tobacco: 'Tobacco',
    grocery: 'Grocery',
    lottery: 'Lottery',
    household: 'Household',
  },
  paymentMethods: {
    cash: 'Cash',
    card: 'Card',
    ebt: 'EBT',
    mobile: 'Mobile',
  },
  status: {
    loading: 'Loading sales…',
    error: 'Sales data could not be loaded.',
    retry: 'Try again',
    empty: 'No sales in this period.',
  },
}

export type Messages = typeof en
export default en
