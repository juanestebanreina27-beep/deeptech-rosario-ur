/**
 * Deno-compatible motor_v1.1 — port of apps/web/src/lib/motor/runMotor.ts
 * Keep in sync when web motor changes (rules_version + catalog).
 */
// @ts-expect-error Deno JSON import
import catalogJson from './rules_catalog_motor_v1.json' with { type: 'json' }

export type TipoPostulacion =
  | 'desarrollo_tecnologico'
  | 'desarrollo_tecnologico_salud'
  | 'adaptacion_tecnologica'

export type AnswerInput = {
  variable_key: string
  value_option?: string | null
  value_text?: string | null
  value_number?: number | null
  score_points?: number | null
}

export type MotorInput = {
  answers: AnswerInput[]
  tipo_postulacion: TipoPostulacion | null
  anos_operacion_comercial: number | null
  consent_at?: string | null
}

export type LineItem = {
  variable_key: string
  points: number
  max_points: number
  weight: number
  weight_effective: number
  normalized: number
  contribution: number
  block: string
  skipped_optional: boolean
}

export type ScoreResult = {
  total_0_1: number
  total_0_100: number
  bloques: Record<string, number>
  line_items: LineItem[]
}

export type ValidationError = {
  code: string
  field: string
  message: string
  step?: number
}

export type FailedRule = {
  id: string
  label: string
  field_key: string
  suggestion: string
}

export type Warning = {
  code: string
  message: string
  field?: string
}

export type MotorResult = {
  rules_version: string
  valid: boolean
  validation_errors: ValidationError[]
  warnings: Warning[]
  discard: { passed: boolean; failed_rules: FailedRule[] }
  tipo_postulacion: TipoPostulacion | null
  score: ScoreResult | null
  score_shadow?: ScoreResult | null
  irl_dims_aplicables: string[]
}

type Nivel = { label: string; points: number }
type CatalogVar = {
  variable_key: string
  bloque: string
  peso: number
  obligatorio: boolean
  niveles: Nivel[]
  renorm_ok?: boolean
}

const catalog = catalogJson as {
  rules_version: string
  variables: CatalogVar[]
  irl_by_tipo: Record<string, string[]>
}

const RULES = 'motor_v1.1'

const DISCARD_META: Record<string, { label: string; field_key: string; suggestion: string }> = {
  D01_sin_vinculo: {
    label: 'El investigador o profesor no tiene vínculo con la universidad',
    field_key: 'vinculo_universidad',
    suggestion:
      'Seleccione un nivel de vínculo diferente a "NO vinculado" (temporal/servicios o fijo/indefinido).',
  },
  D02_solo_idea: {
    label: 'Solo ideas/conceptos (sin prototipos ni PMV)',
    field_key: 'prototipos',
    suggestion:
      'Indique un nivel de prototipos superior a "Idea o concepto teórico" (al menos un prototipo o PMV).',
  },
  D03_operacion_gt_3a: {
    label: 'Tiene más de 3 años con operación comercial',
    field_key: 'anos_operacion_comercial',
    suggestion:
      'Esta convocatoria admite hasta 3 años de operación comercial. Si el valor es correcto, la postulación no es elegible en esta convocatoria.',
  },
  D04_sin_base_tech: {
    label:
      'Adaptación tecnológica sin adopción de tecnología que soporte el emprendimiento',
    field_key: 'adopcion_tecnologia',
    suggestion:
      'Para tipo "Adaptación tecnológica" debe indicar adopción de tecnología (no "NO adopta ninguna tecnología").',
  },
}

function getVar(key: string): CatalogVar | undefined {
  return catalog.variables.find((v) => v.variable_key === key)
}

function maxPoints(v: CatalogVar): number {
  return Math.max(...v.niveles.map((n) => n.points), 0)
}

function resolvePoints(v: CatalogVar, value_option?: string | null): number | null {
  if (value_option == null || value_option === '') return null
  const exact = v.niveles.find((n) => n.label === value_option)
  if (exact) return exact.points
  const lower = value_option.toLowerCase()
  const fuzzy = v.niveles.find(
    (n) => n.label.toLowerCase() === lower || lower.includes(n.label.toLowerCase().slice(0, 12)),
  )
  if (fuzzy) return fuzzy.points
  const asNum = Number(value_option)
  if (!Number.isNaN(asNum) && v.niveles.some((n) => n.points === asNum)) return asNum
  return null
}

function ansMap(answers: AnswerInput[]): Map<string, AnswerInput> {
  const m = new Map<string, AnswerInput>()
  for (const a of answers) m.set(a.variable_key, a)
  return m
}

function getPoints(map: Map<string, AnswerInput>, key: string): number | null {
  const v = getVar(key)
  if (!v) return null
  const a = map.get(key)
  if (!a) return null
  return resolvePoints(v, a.value_option)
}

function needsGrado(map: Map<string, AnswerInput>): boolean {
  const p = getPoints(map, 'innovacion')
  return p != null && p >= 3
}

function err(code: string, field: string, message: string): ValidationError {
  return { code, field, message }
}

function computeScore(map: Map<string, AnswerInput>): ScoreResult {
  const blocks = ['EQUIPO', 'MODELO', 'INNOVACION'] as const
  const line_items: LineItem[] = []
  const bloqueScores: Record<string, number> = {}

  for (const block of blocks) {
    const vars = catalog.variables.filter((v) => v.bloque === block)
    type Resolved = { v: CatalogVar; points: number; skipped: boolean }
    const resolved: Resolved[] = []

    for (const v of vars) {
      const pts = getPoints(map, v.variable_key)
      if (pts == null) {
        if (!v.obligatorio || v.variable_key === 'grado_innovacion') {
          resolved.push({ v, points: 0, skipped: true })
        }
        continue
      }
      resolved.push({ v, points: pts, skipped: false })
    }

    const active = resolved.filter((r) => !r.skipped)
    const weightSum = active.reduce((s, r) => s + r.v.peso, 0) || 1

    let blockScore = 0
    for (const r of resolved) {
      if (r.skipped) {
        line_items.push({
          variable_key: r.v.variable_key,
          points: 0,
          max_points: maxPoints(r.v),
          weight: r.v.peso,
          weight_effective: 0,
          normalized: 0,
          contribution: 0,
          block,
          skipped_optional: true,
        })
        continue
      }
      const max = maxPoints(r.v)
      const norm = max > 0 ? r.points / max : 0
      const wEff = r.v.peso / weightSum
      const contrib = norm * wEff
      blockScore += contrib
      line_items.push({
        variable_key: r.v.variable_key,
        points: r.points,
        max_points: max,
        weight: r.v.peso,
        weight_effective: wEff,
        normalized: norm,
        contribution: contrib,
        block,
        skipped_optional: false,
      })
    }
    bloqueScores[block] = active.length ? blockScore : NaN
  }

  const blockValues = Object.values(bloqueScores).filter((x) => !Number.isNaN(x))
  const total =
    blockValues.length > 0 ? blockValues.reduce((a, b) => a + b, 0) / blockValues.length : 0

  return {
    total_0_1: total,
    total_0_100: Math.round(total * 1000) / 10,
    bloques: {
      EQUIPO: bloqueScores.EQUIPO,
      MODELO: bloqueScores.MODELO,
      INNOVACION: bloqueScores.INNOVACION,
    },
    line_items,
  }
}

function collectWarnings(
  map: Map<string, AnswerInput>,
  score: ScoreResult | null,
  input: MotorInput,
): Warning[] {
  const warnings: Warning[] = []
  for (const v of catalog.variables) {
    if (v.obligatorio || v.variable_key === 'grado_innovacion') continue
    if (getPoints(map, v.variable_key) == null) {
      warnings.push({
        code: 'OPTIONAL_EMPTY',
        field: v.variable_key,
        message: `Campo opcional vacío: ${v.variable_key} (se renormaliza el bloque).`,
      })
    }
  }
  if (score) {
    for (const [block, val] of Object.entries(score.bloques)) {
      if (Number.isNaN(val)) continue
      if (val < 0.4) {
        warnings.push({
          code: 'LOW_BLOCK_SCORE',
          field: block,
          message: `El bloque ${block} tiene un score bajo (${(val * 100).toFixed(1)}%).`,
        })
      }
    }
  }
  if (input.anos_operacion_comercial === 3) {
    warnings.push({
      code: 'OPERACION_LIMITE',
      field: 'anos_operacion_comercial',
      message: 'Años de operación = 3 (límite exacto).',
    })
  }
  return warnings
}

export function runMotor(input: MotorInput): MotorResult {
  const errors: ValidationError[] = []
  const map = ansMap(input.answers)

  if (!input.consent_at) {
    errors.push(err('CONSENT_REQUIRED', 'consent_at', 'Debe aceptar el tratamiento de datos personales.'))
  }
  if (!input.tipo_postulacion) {
    errors.push(err('REQUIRED', 'tipo_postulacion', 'tipo_postulacion es obligatorio.'))
  }
  if (input.anos_operacion_comercial == null || Number.isNaN(input.anos_operacion_comercial)) {
    errors.push(err('REQUIRED', 'anos_operacion_comercial', 'anos_operacion_comercial es obligatorio.'))
  } else if (input.anos_operacion_comercial < 0) {
    errors.push(err('INVALID_RANGE', 'anos_operacion_comercial', 'anos_operacion_comercial no puede ser negativo.'))
  }

  for (const v of catalog.variables) {
    const a = map.get(v.variable_key)
    const pts = a ? resolvePoints(v, a.value_option) : null
    const empty = pts == null
    if (v.variable_key === 'grado_innovacion') {
      if (needsGrado(map) && empty) {
        errors.push(
          err(
            'GRADO_REQUIRED',
            'grado_innovacion',
            'grado_innovacion es obligatorio cuando hay innovación (innovacion ≥ 3).',
          ),
        )
      }
      continue
    }
    if (v.obligatorio && empty) {
      errors.push(err('REQUIRED', v.variable_key, `Campo obligatorio sin nivel: ${v.variable_key}`))
    }
  }

  const irlDims =
    input.tipo_postulacion && catalog.irl_by_tipo[input.tipo_postulacion]
      ? catalog.irl_by_tipo[input.tipo_postulacion]
      : []

  if (errors.length) {
    return {
      rules_version: RULES,
      valid: false,
      validation_errors: errors,
      warnings: [],
      discard: { passed: false, failed_rules: [] },
      tipo_postulacion: input.tipo_postulacion,
      score: null,
      score_shadow: null,
      irl_dims_aplicables: irlDims,
    }
  }

  const failed: FailedRule[] = []
  if (getPoints(map, 'vinculo_universidad') === 0) {
    failed.push({ id: 'D01_sin_vinculo', ...DISCARD_META.D01_sin_vinculo })
  }
  if (getPoints(map, 'prototipos') === 0) {
    failed.push({ id: 'D02_solo_idea', ...DISCARD_META.D02_solo_idea })
  }
  if ((input.anos_operacion_comercial as number) > 3) {
    failed.push({ id: 'D03_operacion_gt_3a', ...DISCARD_META.D03_operacion_gt_3a })
  }
  if (
    input.tipo_postulacion === 'adaptacion_tecnologica' &&
    getPoints(map, 'adopcion_tecnologia') === 0
  ) {
    failed.push({ id: 'D04_sin_base_tech', ...DISCARD_META.D04_sin_base_tech })
  }

  const scoreComputed = computeScore(map)
  const discardPassed = failed.length === 0
  const warnings = collectWarnings(map, scoreComputed, input)

  if (!discardPassed) {
    return {
      rules_version: RULES,
      valid: true,
      validation_errors: [],
      warnings,
      discard: { passed: false, failed_rules: failed },
      tipo_postulacion: input.tipo_postulacion,
      score: null,
      score_shadow: scoreComputed,
      irl_dims_aplicables: irlDims,
    }
  }

  return {
    rules_version: RULES,
    valid: true,
    validation_errors: [],
    warnings,
    discard: { passed: true, failed_rules: [] },
    tipo_postulacion: input.tipo_postulacion,
    score: scoreComputed,
    score_shadow: scoreComputed,
    irl_dims_aplicables: irlDims,
  }
}
