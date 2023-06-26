import postgres from 'postgres'

const psql = postgres('postgres://localhost:5432', {})

export default psql

export interface AccessibleDirectoriesRow {
  id: number
  directory_path: string
  description: string
}

export interface DocumentsRow {
  id: number
  directory_id: number
  relative_path: string
  filename: string
  title: string
  author: string
  type: string
  creation_time: Date
  update_time: Date
}

export interface DocumentsPagesRow {
  id: number
  document_id: number
  page_num: number
  content: string
}
