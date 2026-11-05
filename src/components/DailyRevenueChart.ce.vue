<script setup lang="ts">
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js'
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { useI18n } from '@/i18n'
import type { DailyRevenue } from '@/report/aggregate'
import type { Theme } from '@/types'

// Registers into Chart.js' own registry; registering the same pieces twice is a no-op.
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps<{
  points: DailyRevenue[]
  currency: string
  /** Only used to redraw: colors are read from the theme's CSS custom properties. */
  theme: Theme
}>()

const { t, locale, formatCurrency, formatDate } = useI18n()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
let chart: Chart<'bar', number[], string> | undefined

const description = computed(() => {
  const first = props.points[0]
  const last = props.points.at(-1)
  return first && last
    ? t('chart.description', { from: formatDate(first.date), to: formatDate(last.date) })
    : t('chart.title')
})

function buildConfig(element: HTMLCanvasElement): ChartConfiguration<'bar', number[], string> {
  const style = getComputedStyle(element)
  const token = (name: string) => style.getPropertyValue(name).trim()
  const font = { family: style.fontFamily, size: 12 }
  const muted = token('--ssr-text-muted')

  return {
    type: 'bar',
    data: {
      labels: props.points.map((p) => formatDate(p.date, { month: 'short', day: 'numeric' })),
      datasets: [
        {
          data: props.points.map((p) => p.revenue),
          backgroundColor: token('--ssr-series'),
          hoverBackgroundColor: token('--ssr-accent'),
          borderRadius: 4,
          categoryPercentage: 0.85,
          barPercentage: 0.9,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      locale: locale.value,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        tooltip: {
          displayColors: false,
          titleFont: { ...font, weight: 'bold' },
          bodyFont: font,
          callbacks: {
            title: ([item]) =>
              item ? formatDate(props.points[item.dataIndex]!.date, { dateStyle: 'full' }) : '',
            label: (item) => formatCurrency(item.parsed.y ?? 0, props.currency),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: token('--ssr-axis') },
          ticks: { color: muted, font, maxRotation: 0, autoSkipPadding: 12 },
        },
        y: {
          beginAtZero: true,
          grid: { color: token('--ssr-grid') },
          border: { display: false },
          ticks: {
            color: muted,
            font,
            maxTicksLimit: 6,
            callback: (value) =>
              formatCurrency(Number(value), props.currency, {
                notation: 'compact',
                maximumFractionDigits: 1,
              }),
          },
        },
      },
    },
  }
}

function render() {
  if (!canvas.value) return
  const { data, options } = buildConfig(canvas.value)
  if (chart) {
    chart.data = data
    chart.options = options!
    chart.update()
  } else {
    chart = new Chart(canvas.value, { type: 'bar', data, options })
  }
}

onMounted(render)
// `post` so a theme switch has already updated the CSS custom properties we read.
watch([() => props.points, () => props.currency, () => props.theme, locale], render, {
  flush: 'post',
})
onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <section class="panel">
    <h3 class="panel__title">{{ t('chart.title') }}</h3>
    <div class="chart">
      <canvas ref="canvas" role="img" :aria-label="description"></canvas>
    </div>
  </section>
</template>

<style>
.chart {
  position: relative;
  height: 280px;
}
</style>
