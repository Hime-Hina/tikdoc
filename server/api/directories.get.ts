import Joi from 'joi'
import type { AccessibleDirectory } from '../database/postgreSQL'
import psql from '../database/postgreSQL'

export interface DirectoriesQueryParam {
  pageNum: number
  pageSize?: number
}

const schema = Joi.object<DirectoriesQueryParam>({
  pageNum: Joi.number().integer().min(1).optional().default(1),
  pageSize: Joi.number().integer().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  const { error, warning, value } = schema.validate(getQuery(event))
  if (error)
    return createApiResponse(event, 400, error.message, null)
  if (warning)
    console.warn(warning.message)

  const { pageNum, pageSize } = value

  try {
    const results = await psql<AccessibleDirectory[]>`
      SELECT id, directory_path, description
      FROM accessible_directories
      ${
        pageSize === undefined
          ? psql``
          : psql`LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`
      }
    `

    return createApiResponse(event, 200, 'success', results.map(result => ({
      id: result.id,
      path: result.directory_path,
      description: result.description,
    })))
  } catch (_e) {
    const error = _e as Error
    return createApiResponse(event, 500, error.message, null)
  }
})
