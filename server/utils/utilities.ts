import type { Replacer } from 'safe-stable-stringify'
import { configure } from 'safe-stable-stringify'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export function createApiResponse<T>(code: number, message: string, data: T): ApiResponse<T> {
  return {
    code,
    message,
    data,
  }
}

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
