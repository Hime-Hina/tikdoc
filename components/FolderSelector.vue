<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { QSelect } from 'quasar'
import type { QSelectProps } from 'quasar'

let fullOptions: FolderSelectorOptions = []
const isError = ref(false)
const errorMessage = ref('')
const options = ref<FolderSelectorOptions | null>(null)

const { folderSelectorModel: model } = storeToRefs(useAppStates())

const onFilter: QSelectProps['onFilter'] = async (
  inputValue, doneFn, abortFn,
) => {
  inputValue = inputValue.toLocaleLowerCase()
  isError.value = false

  if (fullOptions.length <= 0) { // 从服务器获取目录列表
    const { data, error } = await useFetch('/api/accessible_directories')
    if (error.value !== null || data.value?.code !== 200) {
      isError.value = true
      errorMessage.value = error.value?.message ?? data.value?.message ?? '未知错误'
      return abortFn() // 无法获取目录列表时，不再继续
    } else {
      doneFn(() => {
        fullOptions = data.value!.data!.map(v => ({
          label: v.description,
          value: v.path,
        }))
        options.value = fullOptions
      })
    }
  }

  doneFn(() => {
    if (inputValue === '') { // 无输入时
      options.value = fullOptions
    } else { // 根据输入过滤
      options.value = fullOptions.filter(v =>
        v.label.toLocaleLowerCase().includes(inputValue)
      || v.value.toLocaleLowerCase().includes(inputValue),
      )
    }
  })
}

const onFilterAbort: QSelectProps['onFilterAbort'] = () => {
  console.log('onFilterAbort')
}

// const onScroll: QSelectProps['onVirtualScroll'] = ({ to, ref }) => {
//   console.log('onScroll', to, ref)
// }
</script>

<template>
  <ClientOnly>
    <template #fallback>
      <q-skeleton type="QInput" />
    </template>
    // TODO: 改用QTree
    <QSelect
      v-model="model"
      bottom-slots
      clearable
      :error="isError"
      :error-message="errorMessage"
      filled
      input-debounce="200"
      label="选择查询目录"
      multiple
      :options="options!"
      use-chips
      use-input
      @filter="onFilter"
      @filter-abort="onFilterAbort"
    >
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label caption>
              {{ scope.opt.label }}
            </q-item-label>
            <q-item-label>{{ scope.opt.value }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey text-italic">
            没有可查询的目录
          </q-item-section>
        </q-item>
      </template>
    </QSelect>
  </ClientOnly>
</template>

<style scoped></style>
