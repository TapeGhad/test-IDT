<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/i18n'
import { sortRows, type CategoryRevenue, type Kpis, type SortDirection } from '@/report/aggregate'

const props = defineProps<{
  rows: CategoryRevenue[]
  totals: Kpis
  currency: string
}>()

const { t, locale, formatCurrency, formatNumber, formatPercent } = useI18n()

type ColumnKey = 'label' | 'transactions' | 'itemsSold' | 'revenue' | 'share'

const columns = computed<{ key: ColumnKey; label: string }[]>(() => [
  { key: 'label', label: t('table.category') },
  { key: 'transactions', label: t('table.transactions') },
  { key: 'itemsSold', label: t('table.itemsSold') },
  { key: 'revenue', label: t('table.revenue') },
  { key: 'share', label: t('table.share') },
])

const sortKey = ref<ColumnKey>('revenue')
const sortDirection = ref<SortDirection>('desc')

const sortedRows = computed(() =>
  sortRows(
    props.rows.map((row) => ({ ...row, label: t(`categories.${row.category}`) })),
    sortKey.value,
    sortDirection.value,
    locale.value,
  ),
)

/** Same column flips the direction; a new column starts A→Z for text, largest first for numbers. */
function sortBy(key: ColumnKey) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = key === 'label' ? 'asc' : 'desc'
  }
}

function ariaSort(key: ColumnKey) {
  if (sortKey.value !== key) return 'none'
  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <section class="panel">
    <h3 id="category-table-title" class="panel__title">{{ t('table.title') }}</h3>
    <!-- In a narrow host the table scrolls inside the widget instead of widening the page. -->
    <div class="table-scroll">
      <table class="table" aria-labelledby="category-table-title">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="{ 'is-numeric': column.key !== 'label' }"
              :aria-sort="ariaSort(column.key)"
            >
              <button type="button" class="table__sort" @click="sortBy(column.key)">
                {{ column.label }}
                <span class="table__sort-icon" aria-hidden="true">{{
                  sortKey !== column.key ? '↕' : sortDirection === 'asc' ? '↑' : '↓'
                }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sortedRows" :key="row.category">
            <th scope="row">{{ row.label }}</th>
            <td class="is-numeric">{{ formatNumber(row.transactions) }}</td>
            <td class="is-numeric">{{ formatNumber(row.itemsSold) }}</td>
            <td class="is-numeric">{{ formatCurrency(row.revenue, currency) }}</td>
            <td class="is-numeric">{{ formatPercent(row.share) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{{ t('table.total') }}</th>
            <td class="is-numeric">{{ formatNumber(totals.transactions) }}</td>
            <td class="is-numeric">{{ formatNumber(totals.itemsSold) }}</td>
            <td class="is-numeric">{{ formatCurrency(totals.revenue, currency) }}</td>
            <td class="is-numeric">{{ formatPercent(totals.revenue ? 1 : 0) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>

<style>
.table-scroll {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.table th,
.table td {
  padding: 8px;
  border-bottom: 1px solid var(--ssr-border);
  font-weight: 400;
  text-align: start;
  white-space: nowrap;
}

.table thead th {
  padding: 0;
  color: var(--ssr-text-secondary);
  font-size: 12px;
  font-weight: 500;
  white-space: normal;
  vertical-align: bottom;
}

.table tfoot th,
.table tfoot td {
  border-bottom: 0;
  font-weight: 600;
}

.table .is-numeric {
  text-align: end;
}

.table__sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.is-numeric .table__sort {
  justify-content: flex-end;
}

.table__sort:hover {
  background: var(--ssr-hover);
}

.table__sort:focus-visible {
  outline: 2px solid var(--ssr-accent);
  outline-offset: -2px;
}

[aria-sort='none'] .table__sort-icon {
  opacity: 0.4;
}
</style>
