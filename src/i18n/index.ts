import { computed, inject, provide, type InjectionKey, type Ref } from 'vue'
import { LOCALES, type Locale } from '@/types'
import en, { type Messages } from './en'
import es from './es'
import fr from './fr'

// A small per-instance i18n instead of vue-i18n: every widget on the page needs its own locale,
// and the Vue wrapper must not pick up (or clash with) an i18n plugin installed by the host app.

export const MESSAGES: Record<Locale, Messages> = { en, es, fr }

/** Shown in their own language, so they are not translated. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
}

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>
}[keyof T & string]

/** Dotted path to a message, e.g. `kpi.revenue`. Typos fail type-checking. */
export type MessageKey = Leaves<Messages>
export type MessageParams = Record<string, string | number>

export function translate(messages: Messages, key: MessageKey, params: MessageParams = {}): string {
  const template = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages) as string
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  )
}

/** Accepts `fr`, `FR` or `fr-CA`; anything unsupported falls back to English. */
export function normalizeLocale(value: string | undefined): Locale {
  const language = value?.toLowerCase().split('-')[0]
  return LOCALES.find((locale) => locale === language) ?? 'en'
}

export function createI18n(locale: Ref<Locale>) {
  const messages = computed(() => MESSAGES[locale.value])

  return {
    locale,
    t: (key: MessageKey, params?: MessageParams) => translate(messages.value, key, params),
    formatCurrency: (amount: number, currency: string, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale.value, { ...options, style: 'currency', currency }).format(
        amount,
      ),
    formatNumber: (value: number) => new Intl.NumberFormat(locale.value).format(value),
    formatPercent: (value: number) =>
      new Intl.NumberFormat(locale.value, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value),
    /** Formats a `YYYY-MM-DD` day; UTC so the day never shifts with the viewer's timezone. */
    formatDate: (isoDate: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
      new Intl.DateTimeFormat(locale.value, { ...options, timeZone: 'UTC' }).format(
        new Date(`${isoDate}T00:00:00Z`),
      ),
  }
}

export type I18n = ReturnType<typeof createI18n>

const I18N_KEY: InjectionKey<I18n> = Symbol('store-sales-report:i18n')

export function provideI18n(locale: Ref<Locale>): I18n {
  const i18n = createI18n(locale)
  provide(I18N_KEY, i18n)
  return i18n
}

export function useI18n(): I18n {
  const i18n = inject(I18N_KEY)
  if (!i18n) throw new Error('useI18n() must be used inside a component that called provideI18n()')
  return i18n
}
