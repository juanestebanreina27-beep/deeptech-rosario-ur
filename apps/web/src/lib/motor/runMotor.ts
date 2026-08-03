import { catalog, getVar, maxPoints, resolvePoints } from './catalog'
import type { AnswerInput, LineItem, MotorInput, MotorResult, TipoPostulacion } from './types'

const RULES = 'motor_v1.1'

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

export function runMotor(input: MotorInput): MotorResult {
  const errors: string[] = []
  const map = ansMap(input.answers)

  if (!input.consent_at) {
    errors.push('Debe aceptar el tratamiento de datos personales.')
  }
  if (!input.tipo_postulacion) {
    errors.push('tipo_postulacion es obligatorio.')
  }
  if (input.anos_operacion_comercial == null || Number.isNaN(input.anos_operacion_comercial)) {
    errors.push('anos_operacion_comercial es obligatorio.')
  } else if (input.anos_operacion_comercial < 0) {
    errors.push('anos_operacion_comercial no puede ser negativo.')
  }

  for (const v of catalog.variables) {
    const a = map.get(v.variable_key)
    const pts = a ? resolvePoints(v, a.value_option) : null
    const empty = pts == null

    if (v.variable_key === 'grado_innovacion') {
      if (needsGrado(map) && empty) {
        errors.push('grado_innovacion es obligatorio cuando hay innovación (innovacion ≥ 3).')
      }
      continue
    }
    if (v.obligatorio && empty) {
      errors.push(`Campo obligatorio sin nivel: ${v.variable_key}`)
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
      discard: { passed: false, failed_rules: [] },
      tipo_postulacion: input.tipo_postulacion,
      score: null,
      irl_dims_aplicables: irlDims,
    }
  }

  // --- DISCARD ---
  const failed: { id: string; label: string }[] = []
  const vinculo = getPoints(map, 'vinculo_universidad')
  if (vinculo === 0) {
    failed.push({
      id: 'D01_sin_vinculo',
      label: 'El investigador o profesor no tiene vínculo con la universidad',
    })
  }
  const proto = getPoints(map, 'prototipos')
  if (proto === 0) {
    failed.push({
      id: 'D02_solo_idea',
      label: 'Solo ideas/conceptos (sin prototipos ni PMV)',
    })
  }
  if ((input.anos_operacion_comercial as number) > 3) {
    failed.push({
      id: 'D03_operacion_gt_3a',
      label: 'Tiene más de 3 años con operación comercial',
    })
  }
  const adopcion = getPoints(map, 'adopcion_tecnologia')
  if (input.tipo_postulacion === 'adaptacion_tecnologica' && adopcion === 0) {
    failed.push({
      id: 'D04_sin_base_tech',
      label: 'Adaptación tecnológica sin adopción de tecnología que soporte el emprendimiento',
    })
  }

  const discardPassed = failed.length === 0
  if (!discardPassed) {
    return {
      rules_version: RULES,
      valid: true,
      validation_errors: [],
      discard: { passed: false, failed_rules: failed },
      tipo_postulacion: input.tipo_postulacion,
      score: null,
      irl_dims_aplicables: irlDims,
    }
  }

  // --- SCORE ---
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
        // optional skip
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
    rules_version: RULES,
    valid: true,
    validation_errors: [],
    discard: { passed: true, failed_rules: [] },
    tipo_postulacion: input.tipo_postulacion,
    score: {
      total_0_1: total,
      total_0_100: Math.round(total * 1000) / 10,
      bloques: {
        EQUIPO: bloqueScores.EQUIPO,
        MODELO: bloqueScores.MODELO,
        INNOVACION: bloqueScores.INNOVACION,
      },
      line_items,
    },
    irl_dims_aplicables: irlDims,
  }
}

export function buildMaxAnswers(): AnswerInput[] {
  return catalog.variables.map((v) => {
    const best = v.niveles.reduce((a, b) => (b.points > a.points ? b : a))
    return { variable_key: v.variable_key, value_option: best.label }
  })
}

export type { TipoPostulacion, MotorInput, MotorResult }
