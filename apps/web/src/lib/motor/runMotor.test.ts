import { describe, expect, it } from 'vitest'
import { buildMaxAnswers, runMotor } from './runMotor'
import type { AnswerInput } from './types'
import { getVar } from './catalog'

function setOpt(answers: AnswerInput[], key: string, label: string) {
  const i = answers.findIndex((a) => a.variable_key === key)
  if (i >= 0) answers[i] = { variable_key: key, value_option: label }
  else answers.push({ variable_key: key, value_option: label })
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

  it('T10: grado required if innovacion high', () => {
    const a = baseHappy().filter((x) => x.variable_key !== 'grado_innovacion')
    const r = runMotor({
      answers: a,
      tipo_postulacion: 'desarrollo_tecnologico',
      anos_operacion_comercial: 0,
      consent_at: consent,
    })
    expect(r.valid).toBe(false)
    expect(r.validation_errors.some((e) => e.includes('grado_innovacion'))).toBe(true)
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
})
