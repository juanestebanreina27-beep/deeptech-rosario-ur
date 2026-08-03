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

/** Wizard step index for product / score fields (UI navigation) */
export const FIELD_STEP: Record<string, number> = {
  tipo_postulacion: 0,
  anos_operacion_comercial: 0,
  faculty_id: 0,
  sector_id: 0,
  consent_at: 0,
  // EQUIPO → step 1
  nivel_educativo: 1,
  conformacion_equipo: 1,
  experiencia_profesional: 1,
  grupo_investigacion: 1,
  dedicacion_tiempo: 1,
  vinculo_universidad: 1,
  // MODELO → step 2
  problema_oportunidad: 2,
  propuesta_valor: 2,
  desarrollo_tecnologico: 2,
  prototipos: 2,
  diferencial: 2,
  competencia: 2,
  aliados: 2,
  estrategia_pi: 2,
  gestion_financiera: 2,
  gestion_inversiones: 2,
  // INNOVACION → step 3
  innovacion: 3,
  grado_innovacion: 3,
  madurez_tecnologica: 3,
  adopcion_tecnologia: 3,
  // IRL → step 4
  irl: 4,
}

export function stepForField(field: string): number | undefined {
  if (field in FIELD_STEP) return FIELD_STEP[field]
  if (field.startsWith('irl_') || field.startsWith('IRL')) return 4
  const v = getVar(field)
  if (!v) return undefined
  if (v.bloque === 'EQUIPO') return 1
  if (v.bloque === 'MODELO') return 2
  if (v.bloque === 'INNOVACION') return 3
  return undefined
}

export function getVar(key: string): CatalogVar | undefined {
  return catalog.variables.find((v) => v.variable_key === key)
}

export function maxPoints(v: CatalogVar): number {
  return Math.max(...v.niveles.map((n) => n.points), 0)
}

export type ResolvePointsResult = {
  points: number | null
  match: 'exact' | 'fuzzy' | 'numeric' | 'none'
}

/**
 * Resolve points from option label; never trust client points.
 * Prefer resolvePointsWithMeta when you need fuzzy-match diagnostics.
 */
export function resolvePoints(v: CatalogVar, value_option?: string | null): number | null {
  return resolvePointsWithMeta(v, value_option).points
}

export function resolvePointsWithMeta(
  v: CatalogVar,
  value_option?: string | null,
): ResolvePointsResult {
  if (value_option == null || value_option === '') return { points: null, match: 'none' }
  const exact = v.niveles.find((n) => n.label === value_option)
  if (exact) return { points: exact.points, match: 'exact' }
  // fuzzy: case-insensitive or prefix contains
  const lower = value_option.toLowerCase()
  const fuzzy = v.niveles.find(
    (n) => n.label.toLowerCase() === lower || lower.includes(n.label.toLowerCase().slice(0, 12)),
  )
  if (fuzzy) return { points: fuzzy.points, match: 'fuzzy' }
  // numeric string
  const asNum = Number(value_option)
  if (!Number.isNaN(asNum) && v.niveles.some((n) => n.points === asNum)) {
    return { points: asNum, match: 'numeric' }
  }
  return { points: null, match: 'none' }
}
