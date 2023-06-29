<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { QInput } from 'quasar'

const isLoading = ref(false)
const {
  searchKeyword,
  selectedFilePaths,
  searchResults,
} = storeToRefs(useAppStates())
const inputRef = ref<QInput | null>(null)
const isError = ref(false)
const errorMessage = ref('')

function onSearchBtnClick() {
  isError.value = false
  if (isLoading.value || !inputRef.value?.validate())
    return
  if (searchKeyword.value === '') {
    inputRef?.value?.validate(false)
    return
  }

  isLoading.value = true

  useFetch('/api/search', {
    method: 'POST',
    body: {
      paths: selectedFilePaths.value,
      keyword: searchKeyword.value,
    },
  }).then(({ data, error }) => {
    isLoading.value = false
    if (error.value) {
      console.error(error.value)
      isError.value = true
      errorMessage.value = '搜索时出错'
      return
    }
    searchResults.value = data.value?.data || []
  })
}
</script>

<template>
  <q-form class="q-ma-lg q-gutter-md" @submit="onSearchBtnClick">
    <QInput
      ref="inputRef"
      v-model="searchKeyword"
      bottom-slots
      counter
      debounce="300"
      :error="isError"
      :error-message="errorMessage"
      filled
      label="请输入你想查询的关键字"
      lazy-rules
      :loading="isLoading"
      :rules="[
        _ => selectedFilePaths.length > 0 || '请先选择一个目录或文件',
        val => val.length > 1 || '请输入至少两个字符',
      ]"
      type="search"
      @click:clear="onSearchBtnClick"
    >
      <template #hint>
        提示
      </template>

      <template v-if="searchKeyword" #append>
        <q-icon
          class="cursor-pointer"
          name="cancel"
          @click.stop.prevent="searchKeyword = ''; inputRef?.resetValidation()"
        />
      </template>

      <template #after>
        <q-btn class="search-btn" color="primary" icon="search" type="submit" @click="onSearchBtnClick" />
      </template>
    </QInput>
  </q-form>
</template>

<style scoped>
.search-btn {
  width: 100%;
  height: 100%;
}
</style>
