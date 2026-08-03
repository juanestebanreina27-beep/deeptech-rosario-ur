import { catalog, getVar, maxPoints, resolvePoints, resolvePointsWithMeta, stepForField } from './catalog'
import type {
  AnswerInput,
  FailedRule,
  LineItem,
  MotorInput,
  MotorResult,
  ScoreResult,
  TipoPostulacion,
  ValidationError,
  Warning,
} from './types'

const RULES = 'motor_v1.1'

const DISCARD_META: Record<
  string,
  { label: string; field_key: string; suggestion: string }
> = {
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

function err(
  code: string,
  field: string,
  message: string,
): ValidationError {
  return { code, field, message, step: stepForField(field) }
}

function computeScore(map: Map<string, AnswerInput>): ScoreResult {
  const blocks = ['EQUIPO', 'MODELO', 'INNOVACION'] as const
  const line_items: LineItem[] = []
  const bloqueScores: Record<string, number> = {}

  for (const block of blocks) {
    const vars = catalog.variables.filter((v) => v.bloque === block)
    type Resolved = { v: (typeof vars)[0]; points: number; skipped: boolean }
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
    const a = map.get(v.variable_key)
    if (!a?.value_option) continue
    const meta = resolvePointsWithMeta(v, a.value_option)
    if (meta.match === 'fuzzy') {
      warnings.push({
        code: 'FUZZY_LABEL_MATCH',
        field: v.variable_key,
        message: `La opción de "${v.variable_key}" se resolvió por coincidencia aproximada; verifique que el nivel sea el deseado.`,
      })
    }
  }

  for (const v of catalog.variables) {
    if (v.obligatorio) continue
    if (v.variable_key === 'grado_innovacion') continue
    const pts = getPoints(map, v.variable_key)
    if (pts == null) {
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
          message: `El bloque ${block} tiene un score bajo (${(val * 100).toFixed(1)}%). Considere fortalecer las variables de ese bloque.`,
        })
      }
    }
  }

  if (input.anos_operacion_comercial != null && input.anos_operacion_comercial === 3) {
    warnings.push({
      code: 'OPERACION_LIMITE',
      field: 'anos_operacion_comercial',
      message: 'Años de operación = 3 (límite exacto). Más de 3 años activaría descarte D03.',
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
    errors.push(
      err('INVALID_RANGE', 'anos_operacion_comercial', 'anos_operacion_comercial no puede ser negativo.'),
    )
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

  // --- DISCARD (evaluate all rules) ---
  const failed: FailedRule[] = []
  const vinculo = getPoints(map, 'vinculo_universidad')
  if (vinculo === 0) {
    const m = DISCARD_META.D01_sin_vinculo
    failed.push({ id: 'D01_sin_vinculo', ...m })
  }
  const proto = getPoints(map, 'prototipos')
  if (proto === 0) {
    const m = DISCARD_META.D02_solo_idea
    failed.push({ id: 'D02_solo_idea', ...m })
  }
  if ((input.anos_operacion_comercial as number) > 3) {
    const m = DISCARD_META.D03_operacion_gt_3a
    failed.push({ id: 'D03_operacion_gt_3a', ...m })
  }
  const adopcion = getPoints(map, 'adopcion_tecnologia')
  if (input.tipo_postulacion === 'adaptacion_tecnologica' && adopcion === 0) {
    const m = DISCARD_META.D04_sin_base_tech
    failed.push({ id: 'D04_sin_base_tech', ...m })
  }

  // Always compute score for shadow / official path
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

/**
 * Preview discard rules only (wizard step-0 early warning).
 * Does not require full form validity.
 */
export function previewDiscard(input: {
  answers: AnswerInput[]
  tipo_postulacion: TipoPostulacion | null
  anos_operacion_comercial: number | null
}): FailedRule[] {
  const map = ansMap(input.answers)
  const failed: FailedRule[] = []

  const vinculo = getPoints(map, 'vinculo_universidad')
  if (vinculo === 0) failed.push({ id: 'D01_sin_vinculo', ...DISCARD_META.D01_sin_vinculo })

  const proto = getPoints(map, 'prototipos')
  if (proto === 0) failed.push({ id: 'D02_solo_idea', ...DISCARD_META.D02_solo_idea })

  if (
    input.anos_operacion_comercial != null &&
    !Number.isNaN(input.anos_operacion_comercial) &&
    input.anos_operacion_comercial > 3
  ) {
    failed.push({ id: 'D03_operacion_gt_3a', ...DISCARD_META.D03_operacion_gt_3a })
  }

  const adopcion = getPoints(map, 'adopcion_tecnologia')
  if (input.tipo_postulacion === 'adaptacion_tecnologica' && adopcion === 0) {
    failed.push({ id: 'D04_sin_base_tech', ...DISCARD_META.D04_sin_base_tech })
  }

  return failed
}

export function buildMaxAnswers(): AnswerInput[] {
  return catalog.variables.map((v) => {
    const best = v.niveles.reduce((a, b) => (b.points > a.points ? b : a))
    return { variable_key: v.variable_key, value_option: best.label }
  })
}

export type { TipoPostulacion, MotorInput, MotorResult }
