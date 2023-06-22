export const useAppStates = defineStore('appStates', () => {
  const folderSelectorModel = ref<FolderSelectorOptions | null>(null)

  return {
    folderSelectorModel,
  }
}, {
  persist: {
    storage: persistedState.localStorage,
  },
})
