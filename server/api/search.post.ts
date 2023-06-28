import Joi from 'joi'
import type { DocumentsPage } from '../database/postgreSQL'
import psql from '../database/postgreSQL'

export interface SearchRequestBody {
  pageNum: number
  pageSize?: number
  keyword: string
  directories?: number[]
  subPaths?: string[] | { [key: string]: string[] }
}

interface PageLine {
  lineNum: number
  content: string
}

const schema = Joi.object<SearchRequestBody>({
  pageNum: Joi.number().integer().min(1).optional().default(1),
  pageSize: Joi.number().integer().min(1).optional(),
  keyword: Joi.string().required(),
  directories: Joi.array().items(Joi.number().integer().min(1)).optional(),
  subPaths: Joi.alternatives(
    Joi.array().items(Joi.string()).optional(),
    Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string()).optional()),
  ).optional(),
})

const openTagRegx = /<(\w+)"[^"]*"|'[^']*'|[^'">]*>/g
const closeTagRegx = /<\/(\w+)"[^"]*"|'[^']*'|[^'">]*>/g
const htmlTagRegx = /<(?:"[^"]*"|'[^']*'|[^'">])*>/g

export default defineEventHandler(async (event) => {
  const { error, warning, value } = schema.validate(await readBody(event))
  if (error)
    return createApiResponse(event, 400, error.message, null)

  if (warning)
    console.warn(warning.message)

  const { pageNum, pageSize, keyword, directories, subPaths } = value
  try {
    console.log('keyword', keyword)
    const results = (await psql<DocumentsPage[]>`
      select
        id,
        document_id,
        page_num,
        pgroonga_highlight_html(
          content,
          pgroonga_query_extract_keywords(${keyword})
        ) as content
      from
        documents_pages
      where ${
        directories === undefined
          ? psql`content &@~ ${keyword}`
          : psql`document_id = any(
              select id 
              from documents 
              where directory_id = any(${psql(directories)}))
                and content &@~ ${keyword}
            `
      }
      ${
        pageSize === undefined
          ? psql``
          : psql`limit ${pageSize} offset ${(pageNum - 1) * pageSize}`
      }
    `).map((result) => {
      return {
        id: result.id,
        document_id: result.document_id,
        page_num: result.page_num,
        lines: result.content
          .split('\n') // 将内容按行分割
          .map((content, index) => ({ lineNum: index + 1, content })) // 为每一行添加行号
          .filter(line => openTagRegx.test(line.content)
                          || closeTagRegx.test(line.content)) // 过滤掉没有高亮标签的行
          .reduce((lineArray, line) => { // 将跨行的高亮标签合并到一行
            if (lineArray.length === 0) {
              lineArray.push(line)
              return lineArray
            }

            const lastLine = lineArray[lineArray.length - 1]
            const lastLineTagMatches = Array.from(
              lastLine.content.matchAll(htmlTagRegx),
            )
            const lastLineLastTag = lastLineTagMatches[lastLineTagMatches.length - 1][0]

            if (lastLineLastTag.startsWith('</')) {
              // 如果上一行标签已经闭合，那么这一行就是新的一行
              lineArray.push(line)
            } else {
              // 如果上一行标签没有闭合，那么这一行就是上一行的一部分
              lastLine.content += line.content
            }

            return lineArray
          }, [] as PageLine[]),
      }
    })

    return createApiResponse(event, 200, 'success', results.map(result => ({
      id: result.id,
      documentId: result.document_id,
      pageNum: result.page_num,
      lines: result.lines,
    })))
  } catch (_e) {
    const error = _e as Error
    return createApiResponse(event, 500, error.message, null)
  }
})
