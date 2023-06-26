import postgres from 'postgres'

const psql = postgres('postgres://localhost:5432', {})

export default psql

export interface AccessibleDirectoriesTableRow {
  id: number
  directory_path: string
  description: string
}
