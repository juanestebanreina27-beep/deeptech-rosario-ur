export type TipoPostulacion =
  | 'desarrollo_tecnologico'
  | 'desarrollo_tecnologico_salud'
  | 'adaptacion_tecnologica'

export type AnswerInput = {
  variable_key: string
  /** Label or option selected by user */
  value_option?: string | null
  /** Free text if any */
  value_text?: string | null
  /** Numeric product fields */
  value_number?: number | null
  /** IGNORED by motor — client may send; server recalculates */
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

/** Typed validation error — maps to wizard fields for scroll-to-error */
export type ValidationError = {
  code: string
  field: string
  message: string
  /** Optional wizard step (UI layer may also resolve via catalog.stepForField) */
  step?: number
}

/** Discard rule failure with correction guidance (not shown as score) */
export type FailedRule = {
  id: string
  label: string
  field_key: string
  suggestion: string
}

/** Non-blocking recommendation */
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
  discard: {
    passed: boolean
    failed_rules: FailedRule[]
  }
  tipo_postulacion: TipoPostulacion | null
  /** Official selection score — null when discarded or invalid */
  score: ScoreResult | null
  /**
   * Score computed even on discard for admin diagnostics only.
   * Never expose to postulante UI.
   */
  score_shadow?: ScoreResult | null
  irl_dims_aplicables: string[]
}
