import fs from 'node:fs'
import path from 'node:path'
import type { PDFExtractPage, PDFExtractText } from 'pdf.js-extract'
import { PDFExtract } from 'pdf.js-extract'
import mammoth from 'mammoth'

export const pdfExtract = new PDFExtract()

export interface ParsedDocumentText {
  content: string
  lineNum: number
}

export interface ParsedDocumentPageWithLines {
  lines: ParsedDocumentText[]
  pageNum: number
}

export interface ParsedDocumentPage {
  content: string
  pageNum: number
}

export interface ParsedDocument {
  pages: ParsedDocumentPage[]
  absolutePath: string
  docInfo: {
    numPages: number
    title: string
    author?: string
    creator?: string
    producer?: string
    creationDate?: string
    updateDate?: string
  }
}

// 定义一个函数，用于递归地读取某个目录下特定类型的文件
export async function readFiles(directoryPath: string, extRegx?: RegExp) {
  const filePaths: string[] = []
  try {
  // 读取dir目录下的所有文件和子目录的名称
    const files = await fs.promises.readdir(directoryPath, {
      withFileTypes: true,
    })
    // 遍历文件和子目录
    for (const file of files) {
      const fullPath = path.join(directoryPath, file.name)
      const extName = path.extname(file.name)
      if (file.isFile()) { // 如果是文件，判断是否是目标文件类型
        if (extRegx) {
          if (extName.match(extRegx))
            filePaths.push(fullPath)
        } else {
          filePaths.push(fullPath)
        }
      } else if (file.isDirectory()) { // 如果是子目录，递归调用readFiles
        filePaths.push(...await readFiles(fullPath, extRegx))
      }
    }
  } catch (_e) {
    // console.error(_e)
  }

  return filePaths
}

function canContentsMergedLTR(contentA: PDFExtractText, contentB: PDFExtractText) {
  return isAABBIntersectedY(contentA, contentB)
  //  && !isAABBIntersectedX(contentA, contentB, -2)
       && contentA.x < contentB.x
}

function canContentsMergedRTL(contentA: PDFExtractText, contentB: PDFExtractText) {
  return isAABBIntersectedY(contentA, contentB)
  //  && !isAABBIntersectedX(contentA, contentB, -2)
       && contentA.x > contentB.x
}

function canContentsMergedTTB(contentA: PDFExtractText, contentB: PDFExtractText) {
  return isAABBIntersectedX(contentA, contentB)
  //  && !isAABBIntersectedY(contentA, contentB, -2)
       && contentA.y < contentB.y
}

function canContentsMergedBTT(contentA: PDFExtractText, contentB: PDFExtractText) {
  return isAABBIntersectedX(contentA, contentB)
        // && !isAABBIntersectedY(contentA, contentB, -2)
        && contentA.y > contentB.y
}

function canContentsMergedWith(contentA: PDFExtractText, contentB: PDFExtractText, dir: string) {
  switch (dir) {
    case 'ltr':
      return canContentsMergedLTR(contentA, contentB)
    case 'rtl':
      return canContentsMergedRTL(contentA, contentB)
    case 'ttb':
      return canContentsMergedTTB(contentA, contentB)
    case 'btt':
      return canContentsMergedBTT(contentA, contentB)
    default:
      console.error('Unknown direction:', dir)
      return false
  }
}

function getContentsMergedDir(contentA: PDFExtractText, contentB: PDFExtractText): string {
  if (canContentsMergedLTR(contentA, contentB))
    return 'ltr'
  if (canContentsMergedRTL(contentA, contentB))
    return 'rtl'
  if (canContentsMergedTTB(contentA, contentB))
    return 'ttb'
  if (canContentsMergedBTT(contentA, contentB))
    return 'btt'

  return contentA.dir
}

function mergeContents(
  contentA: PDFExtractText,
  contentB: PDFExtractText,
  dir: string,
) {
  switch (dir) {
    case 'ltr':
      contentA.width = contentA.width + contentB.width
      contentA.height = Math.max(contentA.height, contentB.height)
      contentA.str = contentA.str + contentB.str
      contentA.dir = 'ltr'
      contentB.dir = 'ltr'
      break
    case 'rtl':
      contentA.x = contentB.x
      contentA.y = contentB.y
      contentA.width = contentA.width + contentB.width
      contentA.height = Math.max(contentA.height, contentB.height)
      contentA.str = contentB.str + contentA.str
      contentA.dir = 'rtl'
      contentB.dir = 'rtl'
      break
    case 'ttb':
      contentA.width = Math.max(contentA.width, contentB.width)
      contentA.height = contentA.height + contentB.height
      contentA.str = contentA.str + contentB.str
      contentA.dir = 'ttb'
      contentB.dir = 'ttb'
      break
    case 'btt':
      contentA.x = contentB.x
      contentA.y = contentB.y
      contentA.width = Math.max(contentA.width, contentB.width)
      contentA.height = contentA.height + contentB.height
      contentA.str = contentB.str + contentA.str
      contentA.dir = 'btt'
      contentB.dir = 'btt'
      break
    default:
      throw new Error(`Unknown direction: ${dir}`)
  }
}

function mergePDFPageContentToLines(page: PDFExtractPage): ParsedDocumentText[] {
  let lineNum = 1
  const filteredContent = page.content.filter(content => content.str !== '')
  const reducedContent = filteredContent.reduce((contentArray, content) => {
    const lastContent = contentArray[contentArray.length - 1]

    if (!lastContent) {
      contentArray.push({
        ...content,
        lineNum: lineNum++,
      })
      return contentArray
    }

    if (lastContent.str.length === 1 && content.str.length === 1) {
      // console.log('1', lastContent.str, content.str, getContentsMergedDir(lastContent, content))
      mergeContents(
        lastContent, content,
        getContentsMergedDir(lastContent, content),
      )
    } else if (
      lastContent.str.length === 1 && content.str.length > 1
      && canContentsMergedWith(lastContent, content, content.dir)
    ) {
      // console.log('2', lastContent.str, content.str, content.dir)
      mergeContents(lastContent, content, content.dir)
    } else if (
      lastContent.str.length > 1 && content.str.length === 1
      && canContentsMergedWith(lastContent, content, lastContent.dir)
    ) {
      // console.log('3', lastContent.str, content.str, lastContent.dir)
      mergeContents(lastContent, content, lastContent.dir)
    } else if (
      lastContent.str.length > 1 && content.str.length > 1
      && lastContent.dir === content.dir
      && canContentsMergedWith(lastContent, content, lastContent.dir)
    ) {
      // console.log('4', lastContent.str, content.str, lastContent.dir)
      mergeContents(lastContent, content, lastContent.dir)
    } else {
      // console.log('5', lastContent.str, content.str)
      contentArray.push({
        ...content,
        lineNum: lineNum++,
      })
    }

    return contentArray
  }, [] as Array<PDFExtractText & { lineNum: number }>)

  const mappedContent = reducedContent.map(content => ({
    content: content.str,
    lineNum: content.lineNum,
  }))

  return mappedContent
}

function parsePDF(filePath: string): Promise<ParsedDocument> {
  const basename = path.basename(filePath)
  return pdfExtract.extract(filePath, {
  }).then((pdfData) => {
    if (!pdfData)
      throw new Error(`${basename}: data is empty`)

    const pages: ParsedDocumentPage[] = pdfData.pages.map(page => ({
      pageNum: page.pageInfo.num,
      content: mergePDFPageContentToLines(page)
        .map(line => line.content.replaceAll('\u0000', ''))
        .join('\n'),
    })).filter(page => page.content !== '')

    if (pages.length === 0)
      throw new Error(`${basename}: pages is empty`)

    return {
      pages,
      absolutePath: filePath,
      docInfo: {
        numPages: pdfData.pdfInfo?.numPages ?? pages.length,
        title: pdfData.meta?.info?.Title
               ?? pdfData.meta?.metadata?.['dc:title']
               ?? path.basename(filePath, path.extname(filePath)),
        author: pdfData.meta?.info?.Author
                ?? (pdfData.meta?.metadata?.['dc:creator'] as string[] | undefined)?.join(' '),
        creator: pdfData.meta?.info?.Creator,
        producer: pdfData.meta?.info?.Producer,
        creationDate: pdfData.meta?.info?.CreationDate,
        updateDate: pdfData.meta?.info?.ModDate,
      },
    }
  })
}

function parseDocx(filePath: string): Promise<ParsedDocument> {
  const basename = path.basename(filePath)
  return mammoth.extractRawText({
    path: filePath,
  }).then((result) => {
    for (const message of result.messages) {
      if (message.type === 'warning')
        console.warn(basename, message.message)
      else if (message.type === 'error')
        throw new Error(`${basename}: ${message.message}`)
    }

    const pages = [{
      pageNum: 1,
      content: result.value.split('\n')
        .map((line, index) => ({
          content: line,
          lineNum: index + 1,
        }))
        .filter(line => line.content !== '')
        .map(line => line.content.replaceAll('\u0000', ''))
        .join('\n'),
    }].filter(page => page.content !== '')

    if (pages.length === 0)
      throw new Error(`${basename}: pages is empty`)

    return {
      pages,
      absolutePath: filePath,
      docInfo: {
        numPages: pages.length,
        title: path.basename(filePath, path.extname(filePath)),
      },
    }
  })
}

const pdfExtentionRegex = /\.pdf$/i
const docxExtentionRegex = /\.docx$/i
// const txtExtentionRegex = /\.(txt|md)$/i
export function parseDocument(filePath: string): Promise<ParsedDocument> {
  const ext = path.extname(filePath)
  if (pdfExtentionRegex.test(ext))
    return parsePDF(filePath)
  else if (docxExtentionRegex.test(ext))
    return parseDocx(filePath)
  else
    throw new Error(`Unsupported file type: ${ext}`)
}
