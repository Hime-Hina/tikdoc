import fs from 'node:fs/promises'
import nodePath from 'node:path'
import Joi from 'joi'
import type { AccessibleDirectory } from '../database/postgreSQL'
import psql from '../database/postgreSQL'

export interface DirectoriesQueryParam {
  pageNum: number
  pageSize?: number
  path?: string
}

const schema = Joi.object<DirectoriesQueryParam>({
  pageNum: Joi.number().integer().min(1).optional().default(1),
  pageSize: Joi.number().integer().min(1).optional(),
  path: Joi.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { error, warning, value } = schema.validate(getQuery(event))
  if (error)
    return createApiResponse(event, 400, error.message, null)
  if (warning)
    console.warn(warning.message)

  const { pageNum, pageSize, path } = value

  try {
    const accessibleDirectories = await psql<AccessibleDirectory[]>`
      select id, directory_path
      from accessible_directories
      ${
        pageSize === undefined
          ? psql``
          : psql`limit ${pageSize} offset ${(pageNum - 1) * pageSize}`
      }
    `

    if (path) {
      if (!accessibleDirectories.some(dir => path.startsWith(dir.directory_path))) {
        return createApiResponse(event, 403, 'forbidden', null)
      } else {
        const pathInfo = await fs.readdir(path, { withFileTypes: true })
          .then((files) => {
            return files
              .filter(file =>
                file.isDirectory()
                || (file.isFile()
                    && supportFileExtRegx.test(nodePath.extname(file.name))),
              )
              .map(file => ({
                fileType: file.isDirectory() ? 'directory' : 'file',
                fileName: nodePath.normalize(file.name),
              }))
          })
        return createApiResponse(
          event,
          200, 'success',
          pathInfo,
        )
      }
    } else {
      return createApiResponse(
        event,
        200, 'success',
        accessibleDirectories.map(dir => ({
          fileType: 'directory',
          fileName: nodePath.normalize(dir.directory_path),
        })),
      )
    }
  } catch (_e) {
    const error = _e as Error
    return createApiResponse(event, 500, error.message, null)
  }
})
