<script lang="ts" setup>
import SearchBar from './components/SearchBar.vue'

const rightDrawerOpen = ref(false)

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>

<template>
  <q-layout view="hHh LpR lFr">
    <q-header
      class="bg-primary text-white"
      elevated
      reveal
    >
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          TikDoc
        </q-toolbar-title>

        <q-btn
          dense
          flat
          icon="menu"
          round
          @click="toggleRightDrawer"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="rightDrawerOpen"
      bordered
      side="right"
    >
      <!-- drawer content -->
    </q-drawer>

    <q-page-container>
      <FolderSelector />
      <SearchBar />
    </q-page-container>

    <q-footer
      class="bg-grey-3 text-white"
      elevated
    />
  </q-layout>
</template>

<style scoped></style>
