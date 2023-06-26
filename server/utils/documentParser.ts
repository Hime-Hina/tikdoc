import path from 'node:path'
import type { PDFExtractPage, PDFExtractText } from 'pdf.js-extract'
import { PDFExtract } from 'pdf.js-extract'
import mammoth from 'mammoth'

export const pdfExtract = new PDFExtract()

export interface ParsedDocumentText {
  content: string
  lineNum: number
}

export interface ParsedDocumentPage {
  lines: ParsedDocumentText[]
  pageNum: number
}

export interface ParsedDocument {
  filename?: string
  pages: ParsedDocumentPage[]
  info: {
    numPages: number
    title?: string
    author?: string
    creator?: string
    producer?: string
    creationDate?: string
    updateDate?: string
  }
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

export function parsePDF(filePath: string, callback: (err: Error | null, parsed?: ParsedDocument) => void) {
  pdfExtract.extract(filePath, {}, (err, pdfData) => {
    if (err) {
      console.error(err)
      callback(err)
      return
    }
    if (!pdfData) {
      console.error('PDF data is empty')
      callback(new Error('PDF data is empty'))
      return
    }

    const filename = path.basename(pdfData.filename ?? filePath)
    const pages = pdfData.pages.map(page => ({
      pageNum: page.pageInfo.num,
      lines: mergePDFPageContentToLines(page),
    }))
    const parsed = {
      filename,
      pages,
      info: {
        numPages: pdfData.pdfInfo?.numPages ?? pages.length,
        title: pdfData.meta?.info?.Title
               ?? pdfData.meta?.metadata?.['dc:title']
               ?? path.basename(filename, path.extname(filename)),
        author: pdfData.meta?.info?.Author
                ?? (pdfData.meta?.metadata?.['dc:creator'] as string[] | undefined)?.join(' '),
        creator: pdfData.meta?.info?.Creator,
        producer: pdfData.meta?.info?.Producer,
        creationDate: pdfData.meta?.info?.CreationDate,
        updateDate: pdfData.meta?.info?.ModDate,
      },
    }

    callback(null, parsed)
  })
}

export function parseWord(filePath: string, callback: (err: Error | null, parsed?: ParsedDocument) => void) {
  mammoth.extractRawText({ path: filePath }).then((result) => {
    for (const message of result.messages) {
      if (message.type === 'warning') {
        console.warn(message.message)
      } else if (message.type === 'error') {
        console.error(message.message)
        callback(new Error(message.message))
        return
      }
    }

    const filename = path.basename(filePath)
    const pages = [{
      pageNum: 1,
      lines: result.value.split('\n').map((line, index) => ({
        content: line,
        lineNum: index + 1,
      })),
    }]
    const parsed = {
      filename,
      pages,
      info: {
        numPages: pages.length,
        title: path.basename(filename, path.extname(filename)),
      },
    }

    callback(null, parsed)
  }).catch((err) => {
    console.error(err)
    callback(err as Error)
  })
}
