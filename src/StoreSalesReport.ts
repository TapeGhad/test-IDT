import { defineComponent, h, type PropType } from 'vue'
import { defineStoreSalesReport, STORE_SALES_REPORT_TAG } from './element'
import type { FiltersChangeDetail, LoadedDetail, LoadErrorDetail, Locale, Theme } from './types'

/**
 * Vue wrapper around `<store-sales-report>`. Rendering the custom element keeps the same
 * Shadow DOM isolation as in plain HTML; its DOM events come back as Vue events with the `detail`.
 */
export const StoreSalesReport = defineComponent({
  name: 'StoreSalesReport',
  props: {
    storeId: { type: String, required: true },
    locale: String as PropType<Locale>,
    theme: String as PropType<Theme>,
    from: String,
    to: String,
  },
  emits: {
    loaded: (detail: LoadedDetail) => !!detail,
    'load-error': (detail: LoadErrorDetail) => !!detail,
    'filters-change': (detail: FiltersChangeDetail) => !!detail,
  },
  setup(props, { emit }) {
    defineStoreSalesReport()

    return () =>
      h(STORE_SALES_REPORT_TAG, {
        ...props,
        onLoaded: (event: CustomEvent<LoadedDetail>) => emit('loaded', event.detail),
        onLoadError: (event: CustomEvent<LoadErrorDetail>) => emit('load-error', event.detail),
        onFiltersChange: (event: CustomEvent<FiltersChangeDetail>) =>
          emit('filters-change', event.detail),
      })
  },
})
