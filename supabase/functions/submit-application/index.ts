// Supabase Edge Function — submit-application
// Deploy: supabase functions deploy submit-application
// Motor: motor_v1.1 (Deno port of apps/web motor)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { runMotor, type AnswerInput, type TipoPostulacion } from './motor.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, service)

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { application_id } = await req.json()
    if (!application_id) return json({ error: 'application_id required' }, 400)

    const { data: app, error: appErr } = await admin
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .single()

    if (appErr || !app) return json({ error: 'Not found' }, 404)
    if (app.user_id !== user.id) {
      const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single()
      if (!prof || (prof.role !== 'admin' && prof.role !== 'evaluador')) {
        return json({ error: 'Forbidden' }, 403)
      }
    }

    if (app.status !== 'draft') {
      // Idempotent return of last evaluation
      const { data: discard } = await admin
        .from('discard_results')
        .select('*')
        .eq('application_id', application_id)
        .order('evaluated_at', { ascending: false })
        .limit(1)
      const { data: score } = await admin
        .from('score_results')
        .select('*')
        .eq('application_id', application_id)
        .order('computed_at', { ascending: false })
        .limit(1)
      return json({
        status: app.status,
        discard: discard?.[0] ?? null,
        score: score?.[0] ?? null,
        note: 'already submitted',
      })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('consent_at')
      .eq('id', app.user_id)
      .single()
    if (!profile?.consent_at) return json({ error: 'consent_required' }, 400)

    // Load answers — ignore client score_points; motor recalculates from catalog
    const { data: answerRows, error: ansErr } = await admin
      .from('application_answers')
      .select('variable_key, value_option, value_text, value_number')
      .eq('application_id', application_id)

    if (ansErr) return json({ error: 'failed_to_load_answers', detail: ansErr.message }, 500)

    const answers: AnswerInput[] = (answerRows ?? []).map((row) => ({
      variable_key: row.variable_key,
      value_option: row.value_option,
      value_text: row.value_text,
      value_number: row.value_number != null ? Number(row.value_number) : null,
    }))

    const result = runMotor({
      answers,
      tipo_postulacion: (app.tipo_postulacion as TipoPostulacion | null) ?? null,
      anos_operacion_comercial:
        app.anos_operacion_comercial != null ? Number(app.anos_operacion_comercial) : null,
      consent_at: profile.consent_at,
    })

    if (!result.valid) {
      return json(
        {
          error: 'validation_failed',
          validation_errors: result.validation_errors,
          rules_version: result.rules_version,
        },
        400,
      )
    }

    const now = new Date().toISOString()
    const newStatus = result.discard.passed ? 'scored' : 'discarded'

    // Persist discard_results (upsert on application_id + rules_version)
    const { error: discErr } = await admin.from('discard_results').upsert(
      {
        application_id,
        rules_version: result.rules_version,
        passed: result.discard.passed,
        failed_rules: result.discard.failed_rules,
        evaluated_at: now,
      },
      { onConflict: 'application_id,rules_version' },
    )
    if (discErr) {
      return json({ error: 'persist_discard_failed', detail: discErr.message }, 500)
    }

    // Persist score when passed; when discarded store score_shadow in score_results for admin
    // (RLS hides score from postulante on discarded — see migration 002)
    const scorePayload = result.discard.passed ? result.score : result.score_shadow
    if (scorePayload) {
      const { error: scoreErr } = await admin.from('score_results').upsert(
        {
          application_id,
          rules_version: result.rules_version,
          block_equipo: numOrNull(scorePayload.bloques.EQUIPO),
          block_modelo: numOrNull(scorePayload.bloques.MODELO),
          block_innovacion: numOrNull(scorePayload.bloques.INNOVACION),
          total_0_1: scorePayload.total_0_1,
          total_0_100: scorePayload.total_0_100,
          line_items: scorePayload.line_items,
          computed_at: now,
        },
        { onConflict: 'application_id,rules_version' },
      )
      if (scoreErr) {
        return json({ error: 'persist_score_failed', detail: scoreErr.message }, 500)
      }
    }

    // Update application status
    const { error: updErr } = await admin
      .from('applications')
      .update({
        status: newStatus,
        submitted_at: now,
        updated_at: now,
      })
      .eq('id', application_id)

    if (updErr) {
      return json({ error: 'update_status_failed', detail: updErr.message }, 500)
    }

    // Audit log (payload jsonb per schema)
    await admin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: result.discard.passed ? 'submit_scored' : 'submit_discarded',
      entity_type: 'application',
      entity_id: application_id,
      payload: {
        rules_version: result.rules_version,
        failed_rules: result.discard.failed_rules.map((f) => f.id),
        total_0_100: scorePayload?.total_0_100 ?? null,
        is_shadow: !result.discard.passed,
      },
    })

    // Optional AI report stub (skipped by default — ignore if insert fails)
    try {
      await admin.from('ai_reports').insert({
        application_id,
        kind: 'diagnostico',
        status: 'skipped',
        finished_at: now,
      })
    } catch {
      /* non-blocking */
    }

    return json({
      status: newStatus,
      rules_version: result.rules_version,
      valid: true,
      warnings: result.warnings,
      discard: result.discard,
      // Official score only when passed; shadow not returned to client as official score
      score: result.discard.passed ? result.score : null,
      score_shadow: result.discard.passed ? null : result.score_shadow,
      irl_dims_aplicables: result.irl_dims_aplicables,
    })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function numOrNull(v: number | undefined): number | null {
  if (v == null || Number.isNaN(v)) return null
  return v
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
