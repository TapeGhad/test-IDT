import type { Messages } from './en'

const es: Messages = {
  title: 'Informe de ventas',
  store: 'Tienda {storeId}',
  language: 'Idioma',
  filters: {
    from: 'Desde',
    to: 'Hasta',
    paymentMethod: 'Método de pago',
    allPaymentMethods: 'Todos los métodos de pago',
  },
  kpi: {
    revenue: 'Ingresos totales',
    transactions: 'Transacciones',
    averageBasket: 'Ticket medio',
    itemsSold: 'Artículos vendidos',
  },
  chart: {
    title: 'Ingresos diarios',
    description: 'Gráfico de barras de los ingresos diarios del {from} al {to}',
  },
  table: {
    title: 'Ingresos por categoría',
    category: 'Categoría',
    transactions: 'Transacciones',
    itemsSold: 'Artículos',
    revenue: 'Ingresos',
    share: 'Cuota',
    total: 'Total',
  },
  categories: {
    beverages: 'Bebidas',
    snacks: 'Aperitivos',
    tobacco: 'Tabaco',
    grocery: 'Alimentación',
    lottery: 'Lotería',
    household: 'Hogar',
  },
  paymentMethods: {
    cash: 'Efectivo',
    card: 'Tarjeta',
    ebt: 'EBT',
    mobile: 'Móvil',
  },
  status: {
    loading: 'Cargando ventas…',
    error: 'No se pudieron cargar los datos de ventas.',
    retry: 'Reintentar',
    empty: 'No hay ventas en este periodo.',
  },
}

export default es
