import postgres from 'postgres'

const psql = postgres()

export default psql

export interface AccessibleDirectory {
  id: number
  directory_path: string
  description: string
  is_indexed: boolean
}

export interface Document {
  id: number
  directory_id: number
  absolute_path: string
  title: string
  author: string
  creation_time: Date
  update_time: Date
}

export interface DocumentsPage {
  id: number
  document_id: number
  page_num: number
  content: string
}
