import catalogJson from '../rules/rules_catalog_motor_v1.json'

export type Nivel = { label: string; points: number }
export type CatalogVar = {
  variable_key: string
  bloque: string
  peso: number
  obligatorio: boolean
  niveles: Nivel[]
  renorm_ok?: boolean
  required_if?: string
  requiere_texto?: boolean
  permite_archivo?: boolean
  analisis_ia?: boolean
}

export const catalog = catalogJson as {
  rules_version: string
  variables: CatalogVar[]
  irl_by_tipo: Record<string, string[]>
  irl_ranges: Record<string, { min: number; max: number }>
  never_send_to_llm: string[]
}

export function getVar(key: string): CatalogVar | undefined {
  return catalog.variables.find((v) => v.variable_key === key)
}

export function maxPoints(v: CatalogVar): number {
  return Math.max(...v.niveles.map((n) => n.points), 0)
}

/** Resolve points from option label; never trust client points */
export function resolvePoints(v: CatalogVar, value_option?: string | null): number | null {
  if (value_option == null || value_option === '') return null
  const exact = v.niveles.find((n) => n.label === value_option)
  if (exact) return exact.points
  // fuzzy: contains or case-insensitive
  const lower = value_option.toLowerCase()
  const fuzzy = v.niveles.find(
    (n) => n.label.toLowerCase() === lower || lower.includes(n.label.toLowerCase().slice(0, 12)),
  )
  if (fuzzy) return fuzzy.points
  // numeric string
  const asNum = Number(value_option)
  if (!Number.isNaN(asNum) && v.niveles.some((n) => n.points === asNum)) return asNum
  return null
}
