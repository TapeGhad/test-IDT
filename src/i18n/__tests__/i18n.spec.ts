import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { createI18n, MESSAGES, normalizeLocale, translate } from '..'
import type { Locale } from '@/types'

function leafKeys(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : leafKeys(value as object, `${prefix}${key}.`),
  )
}

function leafValues(node: object): string[] {
  return Object.values(node).flatMap((value) =>
    typeof value === 'string' ? [value] : leafValues(value as object),
  )
}

/** Intl uses (narrow) no-break spaces in fr; compare with plain spaces. */
const plainSpaces = (text: string) => text.replace(/\s/g, ' ')

describe('i18n', () => {
  it.each(['es', 'fr'] as const)('%s has exactly the same keys as en', (locale) => {
    expect(leafKeys(MESSAGES[locale])).toEqual(leafKeys(MESSAGES.en))
  })

  it.each(['en', 'es', 'fr'] as const)('%s has no empty messages', (locale) => {
    expect(leafValues(MESSAGES[locale]).every((message) => message.trim().length > 0)).toBe(true)
  })

  it('interpolates parameters and leaves unknown placeholders untouched', () => {
    expect(translate(MESSAGES.en, 'chart.description', { from: 'Oct 5', to: 'Nov 3' })).toBe(
      'Bar chart of daily revenue from Oct 5 to Nov 3',
    )
    expect(translate(MESSAGES.en, 'chart.description', { from: 'Oct 5' })).toBe(
      'Bar chart of daily revenue from Oct 5 to {to}',
    )
  })

  it('follows locale changes', () => {
    const locale = ref<Locale>('en')
    const { t } = createI18n(locale)
    expect(t('kpi.averageBasket')).toBe('Average basket')
    locale.value = 'fr'
    expect(t('kpi.averageBasket')).toBe('Panier moyen')
  })

  it.each([
    ['en', 'USD', '$1,234.50'],
    ['en', 'CAD', 'CA$1,234.50'],
    ['fr', 'CAD', '1 234,50 $CA'],
    ['es', 'USD', '1234,50 US$'],
  ] as const)('formats %s %s as %s', (locale, currency, expected) => {
    const { formatCurrency } = createI18n(ref(locale))
    expect(plainSpaces(formatCurrency(1234.5, currency))).toBe(expected)
  })

  it('formats days in UTC regardless of the viewer timezone', () => {
    const { formatDate } = createI18n(ref('en'))
    expect(formatDate('2026-10-05', { month: 'short', day: 'numeric' })).toBe('Oct 5')
  })

  it.each([
    ['fr', 'fr'],
    ['FR', 'fr'],
    ['es-MX', 'es'],
    ['de', 'en'],
    [undefined, 'en'],
  ])('normalizes locale %s to %s', (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected)
  })
})
