import type { Messages } from './en'

const fr: Messages = {
  title: 'Rapport des ventes',
  store: 'Magasin {storeId}',
  language: 'Langue',
  filters: {
    from: 'Du',
    to: 'Au',
    paymentMethod: 'Moyen de paiement',
    allPaymentMethods: 'Tous les moyens de paiement',
  },
  kpi: {
    revenue: "Chiffre d'affaires total",
    transactions: 'Transactions',
    averageBasket: 'Panier moyen',
    itemsSold: 'Articles vendus',
  },
  chart: {
    title: "Chiffre d'affaires quotidien",
    description: "Diagramme en barres du chiffre d'affaires quotidien du {from} au {to}",
  },
  table: {
    title: "Chiffre d'affaires par catégorie",
    category: 'Catégorie',
    transactions: 'Transactions',
    itemsSold: 'Articles',
    revenue: "Chiffre d'affaires",
    share: 'Part',
    total: 'Total',
  },
  categories: {
    beverages: 'Boissons',
    snacks: 'En-cas',
    tobacco: 'Tabac',
    grocery: 'Épicerie',
    lottery: 'Loterie',
    household: 'Entretien',
  },
  paymentMethods: {
    cash: 'Espèces',
    card: 'Carte',
    ebt: 'EBT',
    mobile: 'Mobile',
  },
  status: {
    loading: 'Chargement des ventes…',
    error: 'Impossible de charger les données de ventes.',
    retry: 'Réessayer',
    empty: 'Aucune vente sur cette période.',
  },
}

export default fr
