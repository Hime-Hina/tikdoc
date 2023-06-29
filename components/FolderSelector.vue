<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { QTree } from 'quasar'

const nodes = ref<QTree['nodes']>([])
const { selectedFilePaths } = storeToRefs(useAppStates())
const expanded = ref([])

const { data: rootNodes, error } = await useFetch('/api/directories', {
  method: 'GET',
})

if (error.value) {
  console.error(error.value)
  nodes.value.push({
    label: '获取目录时出错',
    disabled: true,
    noTick: true,
  })
} else {
  nodes.value.push(...rootNodes.value!.data!.map(p => ({
    label: p.name
           + (p.description ? ` (${p.description})` : '')
           + (p.isIndexed ? ' [已索引]' : ''),
    path: p.name,
    lazy: p.type === 'directory',
  })))
}

const onLazyLoad: QTree['onLazyLoad'] = ({ key, done, fail }) => {
  useFetch('/api/directories', {
    method: 'GET',
    query: { path: key },
  }).then(({ data, error }) => {
    if (error.value) {
      console.error(error.value)
      fail()
      return
    }
    done(data.value!.data!.map(p => ({
      label: p.name,
      path: `${key}/${p.name}`,
      lazy: p.type === 'directory',
    })))
  })
}
</script>

<template>
  <q-card
    bordered
    class="q-ma-md"
    flat
  >
    <ClientOnly>
      <template #fallback>
        <q-skeleton type="QInput" />
      </template>
      <QTree
        v-model:expanded="expanded"
        v-model:ticked="selectedFilePaths"
        default-expand-all
        label-key="label"
        no-transition
        node-key="path"
        :nodes="nodes"
        tick-strategy="strict"
        @lazy-load="onLazyLoad"
      />
    </ClientOnly>
  </q-card>
</template>

<style scoped></style>
