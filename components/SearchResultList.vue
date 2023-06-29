<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { saveAs } from 'file-saver'

const { searchResults } = storeToRefs(useAppStates())
const checkboxes = ref<boolean[]>([])
const haveResultsSelected = computed(() => checkboxes.value.some(v => v))

function onDownloadBtnClick() {
  const selectedSearchResults = searchResults.value.filter((_, i) => checkboxes.value[i])
  const htmlTagRegx = /<(?:"[^"]*"|'[^']*'|[^'">])*>/g
  /*
    ```text
    路径A\子路径B\...\文件1
    -------------------------------
    行号x    包括关键字的内容行
    行号y    包括关键字的内容行
    ...
    行号z    包括关键字的内容行

    路径C\子路径D\...\文件2
    -------------------------------
    行号x    包括关键字的内容行
    行号y    包括关键字的内容行
    ...
    行号z    包括关键字的内容行
    ......

    ```
   */
  // 保存为txt
  const txtContent = selectedSearchResults.map(({ absolutePath, pages }) => {
    const txtLines = pages.map(({ pageNum, lines }) => {
      const linesWithoutTag: PageSearchResult[]
        = lines.map(line => ({
          lineStart: line.lineStart,
          lineEnd: line.lineEnd,
          content: line.content.replaceAll(htmlTagRegx, ''),
        }))
      return linesWithoutTag.map(line =>
        `${pageNum}页，`
        + `${
          line.lineStart === line.lineEnd
            ? `${line.lineStart}`
            : `${line.lineStart}-${line.lineEnd}`
        }行`
        + `    ${line.content}`,
      ).join('\n')
    })
    return `${
      absolutePath
    }\n${
      '-'.repeat(absolutePath.length)
    }\n${
      txtLines.join('\n')
    }`
  })
  const blob = new Blob(
    [txtContent.join('\n\n')],
    { type: 'text/plain;charset=utf-8' },
  )
  saveAs(blob, '搜索结果.txt')
}

watch(searchResults, () => {
  checkboxes.value = searchResults.value.map(() => false)
})
</script>

<template>
  <div v-if="searchResults.length > 0">
    <q-card
      bordered
      class="q-ma-md"
      flat
    >
      <q-card-section>
        <q-item>
          <q-item-section>
            <q-item-label class="text-h6">
              搜索结果
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              color="primary"
              :disable="!haveResultsSelected"
              label="下载"
              @click="onDownloadBtnClick"
            />
          </q-item-section>
        </q-item>
        <q-list
          v-for="(searchResult, index) of searchResults"
          :key="searchResult.id"
          bordered
          class="rounded-borders q-ma-lg"
          padding
          separator
        >
          <q-expansion-item
            expand-icon-toggle
            expand-separator
          >
            <template #header>
              <q-item-section avatar>
                <q-checkbox
                  v-model="checkboxes[index]"
                  color="primary"
                  dense
                  hide-label
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-subtitle1">
                  {{ searchResult.absolutePath }}
                </q-item-label>
              </q-item-section>
            </template>
            <q-list
              v-for="page of searchResult.pages" :key="page.id"
              bordered
              class="rounded-borders q-ma-md"
              padding
              spearator
            >
              <q-item
                v-for="line of page.lines"
                :key="line.lineStart"
                class="line-content-list-item"
                horizontal
              >
                <q-item>
                  <q-item-section>
                    <q-item-label overline>
                      {{
                        `页${page.pageNum}，行${line.lineStart}`.concat(
                          line.lineStart !== line.lineEnd
                            ? `-${line.lineEnd}`
                            : '',
                        )
                      }}
                    </q-item-label>
                    <q-item-label class="line-content" v-html="line.content" />
                  </q-item-section>
                </q-item>
              </q-item>
            </q-list>
          </q-expansion-item>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
.line-content :deep() .keyword {
  color: red;
}
.line-content-list-item {
  width: 100%;
}
</style>
