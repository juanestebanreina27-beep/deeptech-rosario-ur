/**
 * Supabase data layer — used when VITE_SUPABASE_* is configured.
 * Falls back is handled by callers via isSupabaseConfigured.
 */
import { isSupabaseConfigured, supabase, type Profile } from './client'
import type { AnswerInput, MotorResult, TipoPostulacion } from '@/lib/motor/types'

export type AppRow = {
  id: string
  status: string
  tipo_postulacion: TipoPostulacion | null
  anos_operacion_comercial: number | null
  faculty_id: number | null
  sector_id: number | null
  created_at: string
  submitted_at: string | null
  user_id: string
  user_email?: string
  answers: AnswerInput[]
  irl: Record<string, { level: number; justification: string }>
  result: MotorResult | null
}

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no configurado')
  }
  return supabase
}

export async function getSessionUser() {
  const sb = requireClient()
  const { data, error } = await sb.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

export async function getMyProfile(): Promise<Profile | null> {
  const sb = requireClient()
  const user = await getSessionUser()
  if (!user) return null
  const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  if (!data) {
    return {
      id: user.id,
      email: user.email ?? '',
      full_name: (user.user_metadata?.full_name as string) ?? null,
      role: 'postulante',
      consent_at: null,
      privacy_version: null,
    }
  }
  return data as Profile
}

export async function updateConsent(fullName: string) {
  const sb = requireClient()
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')
  const { error } = await sb
    .from('profiles')
    .update({
      full_name: fullName,
      consent_at: new Date().toISOString(),
      privacy_version: 'ur-deeptech-v1',
    })
    .eq('id', user.id)
  if (error) throw error
}

export async function listMyApplications(): Promise<AppRow[]> {
  const sb = requireClient()
  const user = await getSessionUser()
  if (!user) return []

  const { data: apps, error } = await sb
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return Promise.all((apps ?? []).map((a) => hydrateApp(a, user.email ?? '')))
}

export async function listAllApplicationsStaff(): Promise<AppRow[]> {
  const sb = requireClient()
  const { data: apps, error } = await sb
    .from('applications')
    .select('*, profiles(email)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return Promise.all(
    (apps ?? []).map((a: Record<string, unknown>) => {
      const profiles = a.profiles as { email?: string } | null
      const email = profiles?.email ?? ''
      return hydrateApp(a, email)
    }),
  )
}

export async function getApplication(id: string): Promise<AppRow | null> {
  const sb = requireClient()
  const { data: app, error } = await sb.from('applications').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!app) return null
  const { data: prof } = await sb.from('profiles').select('email').eq('id', app.user_id).maybeSingle()
  return hydrateApp(app, prof?.email ?? '')
}

async function hydrateApp(app: Record<string, unknown>, user_email: string): Promise<AppRow> {
  const sb = requireClient()
  const id = app.id as string

  const [{ data: answers }, { data: irlRows }, { data: discard }, { data: score }] = await Promise.all([
    sb
      .from('application_answers')
      .select('variable_key, value_option, value_text, value_number')
      .eq('application_id', id),
    sb
      .from('irl_assessments')
      .select('dimension_code, self_level, self_justification')
      .eq('application_id', id),
    sb
      .from('discard_results')
      .select('*')
      .eq('application_id', id)
      .order('evaluated_at', { ascending: false })
      .limit(1),
    sb
      .from('score_results')
      .select('*')
      .eq('application_id', id)
      .order('computed_at', { ascending: false })
      .limit(1),
  ])

  const irl: Record<string, { level: number; justification: string }> = {}
  for (const row of irlRows ?? []) {
    irl[row.dimension_code] = {
      level: row.self_level ?? 1,
      justification: row.self_justification ?? '',
    }
  }

  const status = app.status as string
  let result: MotorResult | null = null
  if (status !== 'draft' && (discard?.[0] || score?.[0])) {
    const d = discard?.[0]
    const s = score?.[0]
    result = {
      rules_version: d?.rules_version ?? s?.rules_version ?? 'motor_v1.1',
      valid: true,
      validation_errors: [],
      warnings: [],
      discard: {
        passed: d?.passed ?? false,
        failed_rules: (d?.failed_rules as MotorResult['discard']['failed_rules']) ?? [],
      },
      tipo_postulacion: (app.tipo_postulacion as TipoPostulacion) ?? null,
      score:
        s && d?.passed
          ? {
              total_0_1: Number(s.total_0_1),
              total_0_100: Number(s.total_0_100),
              bloques: {
                EQUIPO: Number(s.block_equipo),
                MODELO: Number(s.block_modelo),
                INNOVACION: Number(s.block_innovacion),
              },
              line_items: Array.isArray(s.line_items) ? s.line_items : [],
            }
          : null,
      irl_dims_aplicables: Object.keys(irl),
    }
  }

  return {
    id,
    status,
    tipo_postulacion: (app.tipo_postulacion as TipoPostulacion) ?? null,
    anos_operacion_comercial:
      app.anos_operacion_comercial != null ? Number(app.anos_operacion_comercial) : null,
    faculty_id: app.faculty_id != null ? Number(app.faculty_id) : null,
    sector_id: app.sector_id != null ? Number(app.sector_id) : null,
    created_at: app.created_at as string,
    submitted_at: (app.submitted_at as string) ?? null,
    user_id: app.user_id as string,
    user_email,
    answers: (answers ?? []).map((a) => ({
      variable_key: a.variable_key,
      value_option: a.value_option,
      value_text: a.value_text,
      value_number: a.value_number != null ? Number(a.value_number) : null,
    })),
    irl,
    result,
  }
}

export async function createApplication(): Promise<AppRow> {
  const sb = requireClient()
  const user = await getSessionUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await sb
    .from('applications')
    .insert({ user_id: user.id, status: 'draft' })
    .select('*')
    .single()
  if (error) throw error
  return hydrateApp(data, user.email ?? '')
}

export async function updateApplicationMeta(
  id: string,
  patch: {
    tipo_postulacion?: TipoPostulacion | null
    anos_operacion_comercial?: number | null
    faculty_id?: number | null
    sector_id?: number | null
  },
) {
  const sb = requireClient()
  const { error } = await sb
    .from('applications')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function upsertAnswer(applicationId: string, answer: AnswerInput) {
  const sb = requireClient()
  const { error } = await sb.from('application_answers').upsert(
    {
      application_id: applicationId,
      variable_key: answer.variable_key,
      value_option: answer.value_option ?? null,
      value_text: answer.value_text ?? null,
      value_number: answer.value_number ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'application_id,variable_key' },
  )
  if (error) throw error
}

export async function upsertIrl(
  applicationId: string,
  code: string,
  level: number,
  justification: string,
) {
  const sb = requireClient()
  const { error } = await sb.from('irl_assessments').upsert(
    {
      application_id: applicationId,
      dimension_code: code,
      applies: true,
      self_level: level,
      self_justification: justification,
      final_level: level,
    },
    { onConflict: 'application_id,dimension_code' },
  )
  if (error) throw error
}

export async function submitApplication(applicationId: string) {
  const sb = requireClient()
  const { data, error } = await sb.functions.invoke('submit-application', {
    body: { application_id: applicationId },
  })
  if (error) throw error
  return data as {
    status: string
    error?: string
    validation_errors?: unknown
    discard?: MotorResult['discard']
    score?: MotorResult['score']
    rules_version?: string
    irl_dims_aplicables?: string[]
  }
}

export async function reopenAsDraft(applicationId: string) {
  const sb = requireClient()
  const { error } = await sb
    .from('applications')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', applicationId)
  if (error) throw error
}
