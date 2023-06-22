namespace MongoDB {
  interface Folders {
    path: string;
    description: string;
  }
}

interface FolderSelectorOption {
  label: string;
  value: string;
}
type FolderSelectorOptions = FolderSelectorOption[]
