import Joi from 'joi'
import type { Document } from '../database/postgreSQL'
import psql from '../database/postgreSQL'

interface SearchRequestBody {
  pageNum: number
  pageSize?: number
  keyword: string
  paths?: string[]
}

interface DocumentsPageWithHighlight {
  id: number
  document_id: number
  page_num: number
  highlighted_content: string
  score: number
}

const schema = Joi.object<SearchRequestBody>({
  pageNum: Joi.number().integer().min(1).optional().default(1),
  pageSize: Joi.number().integer().min(1).optional(),
  keyword: Joi.string().required(),
  paths: Joi.array().items(Joi.string()).optional(),
})

export default defineEventHandler(async (event) => {
  const { error, warning, value } = schema.validate(await readBody(event))
  if (error)
    return createApiResponse(event, 400, error.message, null)

  if (warning)
    console.warn(warning.message)

  const { pageNum, pageSize, keyword, paths } = value

  try {
    const response = await $fetch('/api/directories_index', {
      method: 'POST',
    })
    if (response.code !== 200) {
      return createApiResponse(
        event,
        500, 'Failed to create directories index', null,
      )
    }

    const pages = (await psql<DocumentsPageWithHighlight[]>`
      select
        id,
        document_id,
        page_num,
        pgroonga_score(tableoid, ctid) as score,
        pgroonga_highlight_html(
          content,
          pgroonga_query_extract_keywords(${keyword}),
          'documents_pages_content_index'
        ) as highlighted_content
      from documents_pages
      where id in (
        select id
        from documents_pages
        where ${
          paths === undefined
            ? psql`true`
            : psql`document_id in (
                select id
                from documents
                where pgroonga_prefix_in_varchar_conditions(
                  absolute_path,
                  (${paths})::text[],
                  'documents_absolute_path_index'
                )
              )`
        } and content &@~ ${keyword}
      )
      order by document_id, page_num, pgroonga_score(tableoid, ctid) desc
      ${
        pageSize === undefined
          ? psql``
          : psql`limit ${pageSize} offset ${(pageNum - 1) * pageSize}`
      }
    `).map((page) => {
      const linesBuffer: PageSearchResult = {
        lineStart: 1,
        lineEnd: 1,
        content: '',
      }
      return {
        id: page.id,
        documentId: page.document_id,
        pageNum: page.page_num,
        lines: page.highlighted_content
          .replaceAll('<span class="keyword">\n', '\n<span class="keyword">')
          .replaceAll('\n</span>', '</span>\n')
          .split('\n') // 将内容按行分割
          .map((content, index) => ({
            lineStart: index + 1,
            lineEnd: index + 1,
            content,
          })) // 为每一行添加行号
          .reduce((lineArray, line) => { // 将跨行的高亮标签合并到一行。似乎要假设 pgroonga 的高亮标签不嵌套
            htmlTagRegx.lastIndex = 0
            const match = htmlTagRegx.exec(line.content)

            if (lineArray.length === 0) {
              if (match !== null)
                lineArray.push(line)
              return lineArray
            }

            if (match === null) {
              linesBuffer.content += line.content
              return lineArray
            }

            if (match[0].startsWith('</')) {
              const lastLine = lineArray[lineArray.length - 1]
              lastLine.content += linesBuffer.content + line.content
              lastLine.lineEnd = line.lineEnd
              linesBuffer.content = ''
            } else {
              linesBuffer.content = ''
              lineArray.push(line)
            }

            return lineArray
          }, [] as PageSearchResult[]),
        score: page.score,
      }
    })
    // 需假设`pages`已经按`documentId`和`pageNum`排序
    const results: SearchResults = []
    for (let i = 0; i < pages.length; ++i) {
      const lastResult = results[results.length - 1]
      if (!lastResult || lastResult.id !== pages[i].documentId) {
        const [document] = await psql<[Document]>`
            select id, absolute_path, title, author
            from documents
            where id = ${pages[i].documentId}
          `
        results.push({
          id: document.id,
          absolutePath: document.absolute_path,
          title: document.title,
          author: document.author,
          pages: [{
            id: pages[i].id,
            pageNum: pages[i].pageNum,
            lines: pages[i].lines,
            score: pages[i].score,
          }],
        })
      } else {
        lastResult.pages.push({
          id: pages[i].id,
          pageNum: pages[i].pageNum,
          lines: pages[i].lines,
          score: pages[i].score,
        })
      }
    }

    return createApiResponse(event, 200, 'success', results)
  } catch (_e) {
    const error = _e as Error
    return createApiResponse(event, 500, error.message, null)
  }
})
