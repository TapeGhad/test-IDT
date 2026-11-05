<script setup lang="ts">
import { useI18n } from '@/i18n'
import { addDays, defaultRange, isIsoDate, MAX_RANGE_DAYS } from '@/report/dates'
import { PAYMENT_METHODS, type DateRange, type PaymentFilter } from '@/types'

const props = defineProps<{
  range: DateRange
  paymentMethod: PaymentFilter
}>()

const emit = defineEmits<{
  'update:range': [range: DateRange]
  'update:paymentMethod': [paymentMethod: PaymentFilter]
}>()

const { t } = useI18n()

/** Sales exist up to yesterday (today isn't complete yet); the pickers reach back one year. */
const lastDay = defaultRange().to
const firstDay = addDays(lastDay, -(MAX_RANGE_DAYS - 1))

function onDateChange(edge: keyof DateRange, event: Event) {
  const { value } = event.target as HTMLInputElement
  // Typing a year fires `change` for every digit (0002, 0020, 0202, 2026): skip incomplete
  // and out-of-bounds dates instead of reloading for each of them.
  if (!isIsoDate(value) || value < firstDay || value > lastDay) return
  const next = { ...props.range, [edge]: value }
  // Moving one end past the other drags the other along, so the range is always valid.
  if (next.from > next.to) {
    if (edge === 'from') next.to = next.from
    else next.from = next.to
  }
  emit('update:range', next)
}

/** Leaving the field shows the date that is actually applied. */
function onDateBlur(edge: keyof DateRange, event: Event) {
  const input = event.target as HTMLInputElement
  input.value = props.range[edge]
}

function onPaymentMethodChange(event: Event) {
  emit('update:paymentMethod', (event.target as HTMLSelectElement).value as PaymentFilter)
}
</script>

<template>
  <div class="filters">
    <label class="field">
      <span class="field__label">{{ t('filters.from') }}</span>
      <input
        class="field__control"
        type="date"
        name="from"
        required
        :value="range.from"
        :min="firstDay"
        :max="lastDay"
        @change="onDateChange('from', $event)"
        @blur="onDateBlur('from', $event)"
      />
    </label>
    <label class="field">
      <span class="field__label">{{ t('filters.to') }}</span>
      <input
        class="field__control"
        type="date"
        name="to"
        required
        :value="range.to"
        :min="firstDay"
        :max="lastDay"
        @change="onDateChange('to', $event)"
        @blur="onDateBlur('to', $event)"
      />
    </label>
    <label class="field">
      <span class="field__label">{{ t('filters.paymentMethod') }}</span>
      <select
        class="field__control"
        name="paymentMethod"
        :value="paymentMethod"
        @change="onPaymentMethodChange"
      >
        <option value="all">{{ t('filters.allPaymentMethods') }}</option>
        <option v-for="method in PAYMENT_METHODS" :key="method" :value="method">
          {{ t(`paymentMethods.${method}`) }}
        </option>
      </select>
    </label>
  </div>
</template>

<style>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
