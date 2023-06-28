export const useAppStates = defineStore('appStates', () => {
  const folderSelectorModel = ref<FolderSelectorOptions | null>(null)
  const searchKeyword = ref('')

  return {
    folderSelectorModel,
    searchKeyword,
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
