<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { QInput } from 'quasar'

const isLoading = ref(false)
const { searchKeyword } = storeToRefs(useAppStates())
const inputRef = ref<QInput | null>(null)

function onSearchBtnClick() {
  if (searchKeyword.value === '') {
    inputRef?.value?.validate(false)
    return
  }
  if (isLoading.value || !inputRef.value?.validate())
    return
  isLoading.value = true

  console.log('onSearchBtnClick')
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}
</script>

<template>
  <div class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSearchBtnClick">
      <QInput
        ref="inputRef"
        v-model="searchKeyword"
        bottom-slots
        counter
        debounce="300"
        filled
        label="请输入你想查询的关键字"
        lazy-rules
        :loading="isLoading"
        :rules="[val => val.length === 0 || val.length > 1 || '请输入至少两个字符']"
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
          <q-btn color="primary" icon="search" type="submit" @click="onSearchBtnClick" />
        </template>
      </QInput>
    </q-form>
  </div>
</template>

<style scoped></style>
