import { MongoClient } from 'mongodb'
import Joi from 'joi'

export interface FoldersQueryParam {
  pageNum: number
  pageSize?: number
}

const schema = Joi.object<FoldersQueryParam>({
  pageNum: Joi.number().integer().min(1).optional().default(1),
  pageSize: Joi.number().integer().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  const { error, warning, value } = schema.validate(getQuery(event))
  if (error)
    return createApiResponse(400, error.message, null)
  if (warning)
    console.warn(warning.message)

  const { pageNum, pageSize } = value
  const client = await MongoClient.connect(process.env.MONGODB_URI)

  try {
    const collection = client.db('tikdoc').collection<MongoDB.Folders>('folders')

    const folders = typeof pageSize !== 'undefined'
      ? (await collection
          .find({})
          .skip(pageSize * (pageNum - 1))
          .limit(pageSize)
          .toArray()) // if pageSize is number
      : (await collection.find({}).toArray()) // if pageSize is null or undefined

    return createApiResponse(200, 'success', folders)
  } catch (_e) {
    const error = _e as Error
    return createApiResponse(500, error.message, null)
  } finally {
    await client.close()
  }
})
