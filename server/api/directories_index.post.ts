import joi from 'joi'
import type { AccessibleDirectory, Document, DocumentsPage } from '../database/postgreSQL'
import psql from '../database/postgreSQL'
import { parseDocument, readFiles } from '../utils/documentParser'

export interface DirectoriesIdRequestBody {
  ids?: number[]
  forceUpdate?: boolean
}

interface NumInserted {
  numInsertedDocuments: number
  numInsertedPages: number
}

const schema = joi.object<DirectoriesIdRequestBody>({
  ids: joi.array().items(joi.number().integer().min(1)).optional(),
  forceUpdate: joi.boolean().optional().default(false),
}).default({})

export default defineEventHandler(async (event) => {
  const { error, warning, value } = schema.validate(await readBody(event))
  if (error)
    return createApiResponse(event, 400, error.message, null)
  if (warning)
    console.warn(warning.message)

  try {
    let numInsertedDocuments = 0
    let numInsertedPages = 0
    const directories = await psql<AccessibleDirectory[]>`
      select id, directory_path, description, is_indexed
      from accessible_directories
      ${
        value.ids === undefined
          ? psql``
          : psql`where id in ${psql(value.ids)}`
      }
    `

    if (directories.length === 0)
      return createApiResponse(event, 404, 'No such directory', null)

    if (!value.forceUpdate) {
      for (const directoryPath of directories) {
        const filePaths = await readFiles(
          directoryPath.directory_path,
          supportFileExtRegx,
        )
        const indexedDocumentPathSet = new Set(
          (await psql<Pick<Document, 'id' | 'directory_id' | 'absolute_path'>[]>`
            select absolute_path
            from documents
            where directory_id = ${directoryPath.id}
                  and absolute_path in ${psql(filePaths)}
          `).map(document => document.absolute_path),
        )
        await Promise.allSettled(
          filePaths
            .filter(filePath => !indexedDocumentPathSet.has(filePath))
            .map(filePath =>
              parseDocument(filePath)
                .then(async ({ pages, absolutePath, docInfo }) => {
                  return psql.begin(async (psql) => {
                    const [document] = await psql<[Pick<Document, 'id'>]>`
                      insert into documents (directory_id, absolute_path, title, author)
                      values (
                        ${directoryPath.id},
                        ${absolutePath},
                        ${docInfo.title},
                        ${docInfo.author ?? ''}
                      )
                      returning id
                    `
                    const pageIds = await psql<Pick<DocumentsPage, 'id'>[]>`
                      insert into documents_pages ${
                        psql(pages.map(page => ({
                            document_id: document.id,
                            page_num: page.pageNum,
                            content: page.content,
                          })))
                      }
                      returning id
                    `

                    return {
                      numInsertedDocuments: 1,
                      numInsertedPages: pageIds.length,
                    } as NumInserted
                  })
                }),
            ),
        ).then(results =>
          results.filter((result): result is PromiseFulfilledResult<NumInserted> => {
            if (result.status === 'rejected') {
              console.error(result.reason)
              return false
            } else if (result.status === 'fulfilled') {
              numInsertedDocuments += result.value.numInsertedDocuments
              numInsertedPages += result.value.numInsertedPages
              return true
            }
            return false
          }),
        ).catch((error: any) => {
          console.error(error)
        })
      }
    } else {
      for (const directoryPath of directories) {
        const filePaths = await readFiles(
          directoryPath.directory_path,
          supportFileExtRegx,
        )
        await Promise.allSettled(
          filePaths
            .map(filePath =>
              parseDocument(filePath)
                .then(({ pages, absolutePath, docInfo }) => {
                  return psql.begin(async (psql) => {
                    const [document] = await psql<[Pick<Document, 'id'>]>`
                      insert into documents (directory_id, absolute_path, title, author)
                      values (
                        ${directoryPath.id},
                        ${absolutePath},
                        ${docInfo.title},
                        ${docInfo.author ?? ''}
                      ) on conflict (absolute_path)
                        do update set
                          title = ${docInfo.title},
                          author = ${docInfo.author || ''},
                          update_time = now()
                      returning id
                    `
                    await psql`
                    delete from documents_pages
                    where document_id = ${document.id}
                    `
                    const pageIds = await psql<Pick<DocumentsPage, 'id'>[]>`
                      insert into documents_pages ${
                        psql(pages.map(page => ({
                          document_id: document.id,
                          page_num: page.pageNum,
                          content: page.content,
                        })))
                      }
                      returning id
                    `

                    return {
                      numInsertedDocuments: 1,
                      numInsertedPages: pageIds.length,
                    } as NumInserted
                  })
                }),
            ),
        ).then(results =>
          results.filter((result): result is PromiseFulfilledResult<NumInserted> => {
            if (result.status === 'rejected') {
              console.error(result.reason)
              return false
            } else if (result.status === 'fulfilled') {
              numInsertedDocuments += result.value.numInsertedDocuments
              numInsertedPages += result.value.numInsertedPages
              return true
            }
            return false
          }),
        ).catch((error: any) => {
          console.error(error)
        })
      }
    }

    return createApiResponse(event, 200, 'OK', {
      numInsertedDocuments,
      numInsertedPages,
    })
  } catch (_e) {
    const error = _e as Error
    return createApiResponse(event, 500, error.message, null)
  }
})
