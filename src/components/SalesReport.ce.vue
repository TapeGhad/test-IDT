<script setup lang="ts">
import { computed, ref, toRef, useHost, watch } from 'vue'
import { LOCALE_NAMES, normalizeLocale, provideI18n } from '@/i18n'
import { useSalesReport } from '@/composables/useSalesReport'
import { computeKpis, filterByPayment } from '@/report/aggregate'
import { defaultRange, isValidRange } from '@/report/dates'
import {
  LOCALES,
  type DateRange,
  type Locale,
  type PaymentFilter,
  type StoreSalesReportEventMap,
  type Theme,
} from '@/types'
import FiltersBar from './FiltersBar.ce.vue'
import KpiCards from './KpiCards.ce.vue'

const props = defineProps<{
  storeId: string
  locale?: string
  theme?: string
  from?: string
  to?: string
}>()

// The host sets the starting locale; the store owner can switch it inside the widget.
const locale = ref<Locale>(normalizeLocale(props.locale))
watch(
  () => props.locale,
  (value) => (locale.value = normalizeLocale(value)),
)

const theme = computed<Theme>(() => (props.theme === 'dark' ? 'dark' : 'light'))

/** Missing or invalid dates fall back to the default "last 30 days". */
function rangeFromProps(): DateRange {
  const fallback = defaultRange()
  const range = { from: props.from ?? fallback.from, to: props.to ?? fallback.to }
  return isValidRange(range) ? range : fallback
}

const range = ref<DateRange>(rangeFromProps())
watch([() => props.from, () => props.to], () => (range.value = rangeFromProps()))

const paymentMethod = ref<PaymentFilter>('all')

const { t } = provideI18n(locale)

// Plain CustomEvents with a clean `detail` (Vue's own CE emits wrap it in an array).
const host = useHost()
function dispatch<K extends keyof StoreSalesReportEventMap>(
  type: K,
  detail: StoreSalesReportEventMap[K]['detail'],
) {
  host?.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }))
}

const { status, result, reload } = useSalesReport(toRef(props, 'storeId'), range, {
  onLoaded: (sales, { storeId, from, to }) =>
    dispatch('loaded', {
      storeId,
      currency: sales.currency,
      from,
      to,
      transactionCount: sales.transactions.length,
    }),
  onError: (error, { storeId, from, to }) =>
    dispatch('load-error', { storeId, from, to, message: error.message }),
})

const currency = computed(() => result.value?.sales.currency)
const transactions = computed(() =>
  filterByPayment(result.value?.sales.transactions ?? [], paymentMethod.value),
)
const kpis = computed(() => computeKpis(transactions.value))

function onRangeChange(next: DateRange) {
  range.value = next
  dispatch('filters-change', { ...next, paymentMethod: paymentMethod.value })
}

function onPaymentMethodChange(next: PaymentFilter) {
  paymentMethod.value = next
  dispatch('filters-change', { ...range.value, paymentMethod: next })
}
</script>

<template>
  <section
    class="report"
    :data-theme="theme"
    :lang="locale"
    :aria-busy="status === 'loading'"
    aria-labelledby="report-title"
  >
    <header class="report__header">
      <div>
        <h2 id="report-title" class="report__title">{{ t('title') }}</h2>
        <p class="report__subtitle">
          {{ t('store', { storeId }) }}<template v-if="currency"> · {{ currency }}</template>
        </p>
      </div>
      <label class="field">
        <span class="field__label">{{ t('language') }}</span>
        <select v-model="locale" class="field__control">
          <option v-for="code in LOCALES" :key="code" :value="code" :lang="code">
            {{ LOCALE_NAMES[code] }}
          </option>
        </select>
      </label>
    </header>

    <FiltersBar
      :range="range"
      :payment-method="paymentMethod"
      @update:range="onRangeChange"
      @update:payment-method="onPaymentMethodChange"
    />

    <div v-if="status === 'error'" class="notice notice--error" role="alert">
      <span class="notice__icon" aria-hidden="true">!</span>
      <p class="notice__text">{{ t('status.error') }}</p>
      <button type="button" class="button" @click="reload">{{ t('status.retry') }}</button>
    </div>

    <p v-else-if="!currency" class="notice" role="status">{{ t('status.loading') }}</p>

    <div v-else class="report__content" :class="{ 'is-stale': status === 'loading' }">
      <p v-if="status === 'loading'" class="visually-hidden" role="status">
        {{ t('status.loading') }}
      </p>
      <KpiCards :kpis="kpis" :currency="currency" />
      <p v-if="transactions.length === 0" class="notice" role="status">{{ t('status.empty') }}</p>
    </div>
  </section>
</template>

<style>
/* Reset everything the host page could pass down by inheritance (font, color, line-height…). */
:host {
  all: initial;
  display: block;
}

.report {
  /* Light theme tokens */
  --ssr-surface: #fcfcfb;
  --ssr-control: #ffffff;
  --ssr-text: #0b0b0b;
  --ssr-text-secondary: #52514e;
  --ssr-text-muted: #6f6e69;
  --ssr-border: rgba(11, 11, 11, 0.1);
  --ssr-border-strong: rgba(11, 11, 11, 0.22);
  --ssr-grid: #e1e0d9;
  --ssr-axis: #c3c2b7;
  --ssr-series: #2a78d6;
  --ssr-accent: #256abf;
  --ssr-critical: #d03b3b;
  --ssr-hover: rgba(11, 11, 11, 0.05);

  color-scheme: light;
  container-type: inline-size;
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--ssr-border);
  border-radius: 12px;
  background: var(--ssr-surface);
  color: var(--ssr-text);
  font:
    14px/1.45 system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  text-align: start;
}

.report[data-theme='dark'] {
  --ssr-surface: #1a1a19;
  --ssr-control: #232322;
  --ssr-text: #f0efec;
  --ssr-text-secondary: #c3c2b7;
  --ssr-text-muted: #a3a29b;
  --ssr-border: rgba(255, 255, 255, 0.1);
  --ssr-border-strong: rgba(255, 255, 255, 0.22);
  --ssr-grid: #2c2c2a;
  --ssr-axis: #383835;
  --ssr-series: #3987e5;
  --ssr-accent: #5598e7;
  --ssr-critical: #e66767;
  --ssr-hover: rgba(255, 255, 255, 0.06);

  color-scheme: dark;
}

.report *,
.report *::before,
.report *::after {
  box-sizing: border-box;
}

.report__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.report__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}

.report__subtitle {
  margin: 2px 0 0;
  color: var(--ssr-text-secondary);
}

.report__content {
  display: grid;
  gap: 16px;
  transition: opacity 0.2s;
}

.report__content.is-stale {
  opacity: 0.55;
}

.field {
  display: grid;
  gap: 4px;
}

.field__label {
  color: var(--ssr-text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.field__control,
.button {
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid var(--ssr-border-strong);
  border-radius: 8px;
  background: var(--ssr-control);
  color: var(--ssr-text);
  font: inherit;
}

.button {
  padding-inline: 14px;
  font-weight: 500;
  cursor: pointer;
}

.button:hover {
  background: var(--ssr-hover);
}

.field__control:focus-visible,
.button:focus-visible {
  outline: 2px solid var(--ssr-accent);
  outline-offset: 1px;
}

/* A date outside the pickers' bounds is not applied; flag it until the field is left. */
.field__control:invalid {
  border-color: var(--ssr-critical);
}

.notice {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 16px;
  border: 1px dashed var(--ssr-border-strong);
  border-radius: 10px;
  color: var(--ssr-text-secondary);
}

.notice--error {
  border: 1px solid var(--ssr-critical);
  color: var(--ssr-text);
}

.notice__icon {
  display: inline-grid;
  flex: none;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--ssr-critical);
  color: #fff;
  font-weight: 700;
}

.notice__text {
  flex: 1;
  margin: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
