<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n'
import type { Kpis } from '@/report/aggregate'

const props = defineProps<{
  kpis: Kpis
  currency: string
}>()

const { t, formatCurrency, formatNumber } = useI18n()

const cards = computed(() => [
  {
    key: 'revenue',
    label: t('kpi.revenue'),
    value: formatCurrency(props.kpis.revenue, props.currency),
  },
  {
    key: 'transactions',
    label: t('kpi.transactions'),
    value: formatNumber(props.kpis.transactions),
  },
  {
    key: 'averageBasket',
    label: t('kpi.averageBasket'),
    value: formatCurrency(props.kpis.averageBasket, props.currency),
  },
  { key: 'itemsSold', label: t('kpi.itemsSold'), value: formatNumber(props.kpis.itemsSold) },
])
</script>

<template>
  <dl class="kpis">
    <div v-for="card in cards" :key="card.key" class="kpi" :data-kpi="card.key">
      <dt class="kpi__label">{{ card.label }}</dt>
      <dd class="kpi__value">{{ card.value }}</dd>
    </div>
  </dl>
</template>

<style>
.kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

@container (min-width: 760px) {
  .kpis {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.kpi {
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--ssr-border);
  border-radius: 10px;
}

.kpi__label {
  color: var(--ssr-text-secondary);
  font-size: 13px;
}

.kpi__value {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}
</style>
