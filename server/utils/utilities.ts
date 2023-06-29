import type { Replacer } from 'safe-stable-stringify'
import { configure } from 'safe-stable-stringify'
import type { H3Event } from 'h3'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export function createApiResponse<T>(event: H3Event, code: number, message: string, data: T): ApiResponse<T> {
  setResponseStatus(event, code)
  return {
    code,
    message,
    data,
  }
}

// export const openTagRegx = /<(\w+)"[^"]*"|'[^']*'|[^'">]*>/g
// export const closeTagRegx = /<\/(\w+)"[^"]*"|'[^']*'|[^'">]*>/g
export const htmlTagRegx = /<(?:"[^"]*"|'[^']*'|[^'">])*>/g
export const supportFileExtRegx = /\.(pdf|docx)$/i

const _stringifyJSON = configure({
  circularValue: '[...]',
  deterministic: false,
})
export function stringifyJSON(value: undefined | symbol | ((...args: unknown[]) => unknown), replacer?: Replacer, space?: string | number): undefined
export function stringifyJSON(value: string | number | unknown[] | null | boolean | object, replacer?: Replacer, space?: string | number): string
export function stringifyJSON(
  value: unknown,
  replacer?: ((key: string, value: unknown) => unknown) | (number | string)[] | null | undefined,
  space: string | number = 2,
): string | undefined {
  return _stringifyJSON(value, replacer, space)
}

export interface AABB {
  x: number
  y: number
  width: number
  height: number
}

export function isAABBIntersectedX(a: AABB, b: AABB, tolerance = 0): boolean {
  return a.x + a.width + tolerance >= b.x && b.x + b.width + tolerance >= a.x
}
export function isAABBIntersectedY(a: AABB, b: AABB, tolerance = 0): boolean {
  return a.y + a.height + tolerance >= b.y && b.y + b.height + tolerance >= a.y
}
export function isAABBIntersected(a: AABB, b: AABB, tolerance = 0): boolean {
  return isAABBIntersectedX(a, b, tolerance) && isAABBIntersectedY(a, b, tolerance)
}
