// Supabase Edge Function — submit-application
// Deploy: supabase functions deploy submit-application
// Uses motor logic mirrored from apps/web (copy catalog into function on deploy).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      // idempotent return
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
      return json({ status: app.status, discard: discard?.[0], score: score?.[0], note: 'already submitted' })
    }

    const { data: profile } = await admin.from('profiles').select('consent_at').eq('id', app.user_id).single()
    if (!profile?.consent_at) return json({ error: 'consent_required' }, 400)

    // Load answers — scoring must be done with shared motor package in production.
    // This stub marks submitted and expects a full motor port; for now return instruction.
    // Full motor is implemented in apps/web; Edge should import the same logic after bundling.
    return json(
      {
        error: 'edge_motor_pending',
        message:
          'Deploy the web app motor as a shared module. Until then use demo mode or invoke scoring client-side only for pilots. SQL schema is ready.',
        application_id,
      },
      501,
    )
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
