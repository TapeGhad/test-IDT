export interface MockStore {
  currency: string
}

export const MOCK_STORES: Record<string, MockStore> = {
  'S-1042': { currency: 'USD' },
  'S-2087': { currency: 'CAD' },
}
