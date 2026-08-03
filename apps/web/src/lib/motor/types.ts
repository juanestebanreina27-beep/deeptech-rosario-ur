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

export type MotorResult = {
  rules_version: string
  valid: boolean
  validation_errors: string[]
  discard: {
    passed: boolean
    failed_rules: { id: string; label: string }[]
  }
  tipo_postulacion: TipoPostulacion | null
  score: {
    total_0_1: number
    total_0_100: number
    bloques: Record<string, number>
    line_items: LineItem[]
  } | null
  irl_dims_aplicables: string[]
}
