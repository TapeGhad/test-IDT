<script setup lang="ts">
import { ref } from 'vue'
import { StoreSalesReport, type Locale, type Theme } from '@/index'

const locale = ref<Locale>('en')
const theme = ref<Theme>('light')
const events = ref<string[]>([])

function log(widget: string, name: string, detail: unknown) {
  const time = new Date().toLocaleTimeString()
  events.value = [`${time}  ${widget}  ${name}  ${JSON.stringify(detail)}`, ...events.value].slice(
    0,
    20,
  )
}
</script>

<template>
  <main class="page">
    <h1>Store Sales Report · Vue playground</h1>
    <p>
      Two <code>&lt;StoreSalesReport&gt;</code> instances. The controls drive the first one's props.
    </p>

    <div class="controls">
      <label>
        Locale
        <select v-model="locale">
          <option value="en">en</option>
          <option value="es">es</option>
          <option value="fr">fr</option>
        </select>
      </label>
      <label>
        Theme
        <select v-model="theme">
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>
      </label>
    </div>

    <StoreSalesReport
      store-id="S-1042"
      :locale="locale"
      :theme="theme"
      @loaded="log('S-1042', 'loaded', $event)"
      @load-error="log('S-1042', 'load-error', $event)"
      @filters-change="log('S-1042', 'filters-change', $event)"
    />

    <h2>Events</h2>
    <pre class="log">{{ events.join('\n') || 'No events yet' }}</pre>

    <StoreSalesReport
      store-id="S-2087"
      locale="fr"
      theme="dark"
      @loaded="log('S-2087', 'loaded', $event)"
      @load-error="log('S-2087', 'load-error', $event)"
      @filters-change="log('S-2087', 'filters-change', $event)"
    />
  </main>
</template>

<style>
body {
  margin: 0;
  background: #f1f0ec;
  font-family: Georgia, serif;
}

.page {
  display: grid;
  gap: 16px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.controls {
  display: flex;
  gap: 16px;
}

.log {
  min-height: 80px;
  max-height: 200px;
  margin: 0;
  overflow: auto;
  padding: 12px;
  background: #fff;
  font-size: 12px;
}
</style>
