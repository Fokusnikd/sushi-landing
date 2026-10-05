// Content schema shared by the admin form and the landing runtime.
// A landing describes its editable content in content.schema.json; the admin renders a form from it.

type Base = { key: string; label: string; hint?: string }

export type TextField = Base & { type: 'text' | 'textarea'; maxLength?: number; required?: boolean; placeholder?: string }
export type NumberField = Base & { type: 'number'; min?: number; max?: number; step?: number; suffix?: string }
export type ImageField = Base & { type: 'image'; required?: boolean }
export type ToggleField = Base & { type: 'toggle' }
export type SelectField = Base & {
  type: 'select'
  options?: { value: string; label: string }[]
  // Options taken from a list elsewhere in the content, e.g. menu categories
  optionsFrom?: { path: string; value: string; label: string }
}
export type GroupField = Base & { type: 'group'; fields: Field[] }
export type ListField = Base & {
  type: 'list'
  fields: Field[]
  // Field shown as the collapsed item's title
  itemTitle?: string
  // Accusative noun for the "Добавить …" button, e.g. "блюдо"
  itemName?: string
  // Field that gets a generated id for new items (cart keys, anchors)
  idKey?: string
  min?: number
  max?: number
}

export type Field = TextField | NumberField | ImageField | ToggleField | SelectField | GroupField | ListField
export type Section = GroupField | ListField

export type Schema = {
  title: string
  sections: Section[]
}

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }
export type JsonObject = { [key: string]: Json }

export const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Saved content wins, defaults fill keys added to the landing after the client last saved.
// Arrays are taken whole: a list the client edited must not be padded back with default items.
export function mergeContent<T>(defaults: T, saved: unknown): T {
  if (!isObject(defaults) || !isObject(saved)) return (saved === undefined ? defaults : saved) as T
  const result: JsonObject = { ...defaults }
  for (const [key, value] of Object.entries(saved)) {
    result[key] = key in defaults ? mergeContent(defaults[key], value) : value
  }
  return result as T
}

export function newId(prefix = 'item') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export function emptyValue(field: Field): Json {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'image':
      return ''
    case 'number':
      return field.min ?? 0
    case 'toggle':
      return false
    case 'select':
      return field.options?.[0]?.value ?? ''
    case 'group':
      return Object.fromEntries(field.fields.map((f) => [f.key, emptyValue(f)]))
    case 'list':
      return []
  }
}

export function emptyItem(list: ListField): JsonObject {
  const item = Object.fromEntries(list.fields.map((f) => [f.key, emptyValue(f)]))
  if (list.idKey) item[list.idKey] = newId()
  return item
}

// Site-relative asset path → URL. Uploaded images are site-relative too; demo uploads are data: URLs.
export function assetUrl(src: string, base: string) {
  if (!src || /^(data:|blob:|https?:|\/)/.test(src)) return src
  return base + src
}

// localStorage key for demo drafts; GitHub Pages demos share one origin, so the site path is part of it
export function draftKey(siteRoot: string) {
  return `landing-admin:draft:${siteRoot}`
}
