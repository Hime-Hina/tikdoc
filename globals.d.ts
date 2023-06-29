interface SearchResult {
  id: number
  absolutePath: string 
  title: string
  author: string
  pages: {
    id: number
    pageNum: number
    lines: PageSearchResult[]
    score: number
  }[]
}

type SearchResults = SearchResult[]

interface PageSearchResult {
  lineStart: number
  lineEnd: number
  content: string
}

declare module 'file-saver';
