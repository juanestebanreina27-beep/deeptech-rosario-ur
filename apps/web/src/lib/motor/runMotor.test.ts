import { describe, expect, it } from 'vitest'
import { buildMaxAnswers, previewDiscard, runMotor } from './runMotor'
import type { AnswerInput } from './types'
import { getVar, resolvePointsWithMeta, stepForField } from './catalog'

function setOpt(answers: AnswerInput[], key: string, label: string) {
  const i = answers.findIndex((a) => a.variable_key === key)
  if (i >= 0) answers[i] = { variable_key: key, value_option: label }
  else answers.push({ variable_key: key, value_option: label })
}

function removeOpt(answers: AnswerInput[], key: string) {
  return answers.filter((a) => a.variable_key !== key)
}

function baseHappy(): AnswerInput[] {
  return buildMaxAnswers()
}

const consent = '2026-01-01T00:00:00Z'

describe('motor_v1.1', () => {
  it('T1: vinculo 0 → D01', () => {
    const a = baseHappy()
    setOpt(a, 'vinculo_universidad', 'Líder NO vinculado a la Universidad')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 1,
      consent_at: consent,
    })
    expect(r.discard.passed).toBe(false)
    expect(r.discard.failed_rules.some((x) => x.id === 'D01_sin_vinculo')).toBe(true)
    expect(r.score).toBeNull()
    const rule = r.discard.failed_rules.find((x) => x.id === 'D01_sin_vinculo')!
    expect(rule.field_key).toBe('vinculo_universidad')
    expect(rule.suggestion.length).toBeGreaterThan(10)
  })

  it('T2: prototipos idea → D02', () => {
    const a = baseHappy()
    setOpt(a, 'prototipos', 'Idea o concepto teórico')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 1,
      consent_at: consent,
    })
    expect(r.discard.failed_rules.some((x) => x.id === 'D02_solo_idea')).toBe(true)
  })

  it('T3: anos > 3 → D03', () => {
    const a = baseHappy()
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 4,
      consent_at: consent,
    })
    expect(r.discard.failed_rules.some((x) => x.id === 'D03_operacion_gt_3a')).toBe(true)
  })

  it('T4: adaptacion + adopcion 0 → D04', () => {
    const a = baseHappy()
    setOpt(a, 'adopcion_tecnologia', 'NO adopta ninguna tecnología')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'adaptacion_tecnologica',
      anos_operacion_comercial: 1,
      consent_at: consent,
    })
    expect(r.discard.failed_rules.some((x) => x.id === 'D04_sin_base_tech')).toBe(true)
  })

  it('T5: max answers → score near 1', () => {
    const a = baseHappy()
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 1,
      consent_at: consent,
    })
    expect(r.discard.passed).toBe(true)
    expect(r.score).not.toBeNull()
    expect(r.score!.total_0_1).toBeGreaterThan(0.95)
    expect(r.rules_version).toBe('motor_v1.1')
  })

  it('T6: grado_innovacion vacío con innovacion baja → renorm ok', () => {
    let a = baseHappy()
    setOpt(a, 'innovacion', 'No contiene innovaciones')
    a = removeOpt(a, 'grado_innovacion')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 1,
      consent_at: consent,
    })
    expect(r.valid).toBe(true)
    expect(r.discard.passed).toBe(true)
    expect(r.score).not.toBeNull()
    const grado = r.score!.line_items.find((li) => li.variable_key === 'grado_innovacion')
    expect(grado?.skipped_optional).toBe(true)
  })

  it('T7: tipo salud → irl incluye RRL', () => {
    const a = baseHappy()
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico_salud',
      anos_operacion_comercial: 0,
      consent_at: consent,
    })
    expect(r.irl_dims_aplicables).toContain('RRL')
    expect(r.irl_dims_aplicables).toContain('TRL')
  })

  it('T8: tipo adaptacion → irl sin TRL', () => {
    const a = baseHappy()
    setOpt(a, 'adopcion_tecnologia', 'Adopta tecnología 4.0 o ACTI')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'adaptacion_tecnologica',
      anos_operacion_comercial: 0,
      consent_at: consent,
    })
    expect(r.irl_dims_aplicables).not.toContain('TRL')
    expect(r.irl_dims_aplicables).toContain('BRL')
  })

  it('T9: múltiples descartes simultáneos (D01+D02+D03)', () => {
    const a = baseHappy()
    setOpt(a, 'vinculo_universidad', 'Líder NO vinculado a la Universidad')
    setOpt(a, 'prototipos', 'Idea o concepto teórico')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 5,
      consent_at: consent,
    })
    const ids = r.discard.failed_rules.map((x) => x.id)
    expect(ids).toContain('D01_sin_vinculo')
    expect(ids).toContain('D02_solo_idea')
    expect(ids).toContain('D03_operacion_gt_3a')
    expect(ids.length).toBeGreaterThanOrEqual(3)
  })

  it('T10: grado required if innovacion high', () => {
    const a = baseHappy().filter((x) => x.variable_key !== 'grado_innovacion')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 0,
      consent_at: consent,
    })
    expect(r.valid).toBe(false)
    expect(r.validation_errors.some((e) => e.field === 'grado_innovacion')).toBe(true)
    expect(r.validation_errors.some((e) => e.code === 'GRADO_REQUIRED')).toBe(true)
  })

  it('T11: anos_operacion = 3.0 exacto → NO descarte', () => {
    const a = baseHappy()
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 3.0,
      consent_at: consent,
    })
    expect(r.discard.failed_rules.some((x) => x.id === 'D03_operacion_gt_3a')).toBe(false)
    expect(r.discard.passed).toBe(true)
  })

  it('T12: anos = 3 → no D03', () => {
    const a = baseHappy()
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 3,
      consent_at: consent,
    })
    expect(r.discard.failed_rules.some((x) => x.id === 'D03_operacion_gt_3a')).toBe(false)
    expect(r.discard.passed).toBe(true)
  })

  it('T13: todos opcionales vacíos → score con renorm', () => {
    let a = baseHappy()
    a = removeOpt(a, 'competencia')
    a = removeOpt(a, 'aliados')
    // grado with low innovacion
    setOpt(a, 'innovacion', 'No contiene innovaciones')
    a = removeOpt(a, 'grado_innovacion')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 1,
      consent_at: consent,
    })
    expect(r.valid).toBe(true)
    expect(r.discard.passed).toBe(true)
    expect(r.score).not.toBeNull()
    expect(r.score!.total_0_1).toBeGreaterThan(0)
    expect(r.warnings.some((w) => w.code === 'OPTIONAL_EMPTY')).toBe(true)
  })

  it('T14: score_shadow se calcula en descarte', () => {
    const a = baseHappy()
    setOpt(a, 'vinculo_universidad', 'Líder NO vinculado a la Universidad')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 1,
      consent_at: consent,
    })
    expect(r.discard.passed).toBe(false)
    expect(r.score).toBeNull()
    expect(r.score_shadow).not.toBeNull()
    expect(r.score_shadow!.total_0_100).toBeGreaterThan(0)
    expect(r.score_shadow!.line_items.length).toBeGreaterThan(0)
  })

  it('T15: salud → RRL in dims', () => {
    const a = baseHappy()
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico_salud',
      anos_operacion_comercial: 0,
      consent_at: consent,
    })
    expect(r.irl_dims_aplicables).toContain('RRL')
    expect(r.irl_dims_aplicables).toContain('TRL')
  })

  it('T16: adaptacion sin D04 si adopcion > 0; sin TRL', () => {
    const a = baseHappy()
    setOpt(a, 'adopcion_tecnologia', 'Adopta tecnología 4.0 o ACTI')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'adaptacion_tecnologica',
      anos_operacion_comercial: 0,
      consent_at: consent,
    })
    expect(r.discard.passed).toBe(true)
    expect(r.irl_dims_aplicables).not.toContain('TRL')
    expect(r.irl_dims_aplicables).toContain('BRL')
  })

  it('T17: validation_errors incluyen field y step', () => {
    const r = runMotor({
      answers: [],
      tipo_postulacion: null,
      anos_operacion_comercial: null,
      consent_at: null,
    })
    expect(r.valid).toBe(false)
    expect(r.validation_errors.length).toBeGreaterThan(0)
    for (const e of r.validation_errors) {
      expect(e.code).toBeTruthy()
      expect(e.field).toBeTruthy()
      expect(e.message).toBeTruthy()
    }
    const tipo = r.validation_errors.find((e) => e.field === 'tipo_postulacion')
    expect(tipo?.step).toBe(0)
  })

  it('T18: warnings generados (opcionales / fuzzy / low block)', () => {
    let a = baseHappy()
    a = removeOpt(a, 'competencia')
    // force low innovacion block by minimal options
    setOpt(a, 'innovacion', 'No contiene innovaciones')
    a = removeOpt(a, 'grado_innovacion')
    setOpt(a, 'madurez_tecnologica', getVar('madurez_tecnologica')!.niveles[0].label)
    setOpt(a, 'adopcion_tecnologia', 'NO adopta ninguna tecnología')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 1,
      consent_at: consent,
    })
    expect(r.valid).toBe(true)
    expect(r.warnings.length).toBeGreaterThan(0)
    expect(r.warnings.some((w) => w.code === 'OPTIONAL_EMPTY' || w.code === 'LOW_BLOCK_SCORE')).toBe(
      true,
    )
  })

  it('T19: fuzzy match de labels (case-insensitive)', () => {
    const v = getVar('nivel_educativo')!
    const meta = resolvePointsWithMeta(v, 'doctorado')
    expect(meta.match).toBe('fuzzy')
    expect(meta.points).toBe(5)

    const a = baseHappy()
    setOpt(a, 'nivel_educativo', 'doctorado')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 1,
      consent_at: consent,
    })
    expect(r.valid).toBe(true)
    expect(r.warnings.some((w) => w.code === 'FUZZY_LABEL_MATCH' && w.field === 'nivel_educativo')).toBe(
      true,
    )
  })

  it('T20: input malicioso (NaN, undefined, strings vacíos)', () => {
    const a: AnswerInput[] = [
      { variable_key: 'nivel_educativo', value_option: '' },
      { variable_key: 'vinculo_universidad', value_option: undefined },
      { variable_key: 'prototipos', value_option: '   ' },
    ]
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: Number.NaN,
      consent_at: consent,
    })
    expect(r.valid).toBe(false)
    expect(r.validation_errors.some((e) => e.field === 'anos_operacion_comercial')).toBe(true)
    expect(r.score).toBeNull()
    expect(r.score_shadow ?? null).toBeNull()
  })

  it('grupo A1 has 5 points in catalog', () => {
    const v = getVar('grupo_investigacion')!
    const a1 = v.niveles.find((n) => n.label.includes('A1'))
    expect(a1?.points).toBe(5)
  })

  it('ignores client score_points forgery', () => {
    const a = baseHappy()
    a.forEach((x) => {
      x.score_points = 0
    })
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 0,
      consent_at: consent,
    })
    expect(r.score!.total_0_1).toBeGreaterThan(0.9)
  })

  it('previewDiscard detects D03 early without full validation', () => {
    const failed = previewDiscard({
      answers: [],
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 10,
    })
    expect(failed.some((f) => f.id === 'D03_operacion_gt_3a')).toBe(true)
  })

  it('stepForField maps core fields', () => {
    expect(stepForField('tipo_postulacion')).toBe(0)
    expect(stepForField('vinculo_universidad')).toBe(1)
    expect(stepForField('prototipos')).toBe(2)
    expect(stepForField('grado_innovacion')).toBe(3)
  })
})
