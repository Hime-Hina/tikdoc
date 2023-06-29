export const useAppStates = defineStore('appStates', () => {
  const selectedFilePaths = ref<string[]>([])
  const searchKeyword = ref('')
  const searchResults = ref<SearchResults>([])

  return {
    selectedFilePaths,
    searchKeyword,
    searchResults,
  }
}, {
  persist: [
    {
      paths: ['folderSelectorModel'],
      storage: persistedState.localStorage,
    },
    {
      paths: ['searchKeyword'],
    },
  ],
})
