import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { demoStore, type DemoApp } from '@/lib/demoStore'
import { stepForField } from '@/lib/motor/catalog'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getApplication, getMyProfile, reopenAsDraft } from '@/lib/supabase/api'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

function blockColor(v: number): string {
  if (Number.isNaN(v)) return 'bg-zinc-200'
  if (v < 0.4) return 'bg-red-400'
  if (v < 0.7) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function blockLabel(v: number): string {
  if (Number.isNaN(v)) return '—'
  if (v < 0.4) return 'Bajo'
  if (v < 0.7) return 'Medio'
  return 'Alto'
}

function statusBanner(status: string, discarded: boolean) {
  if (discarded || status === 'discarded') {
    return {
      className: 'bg-red-50 border-red-200 text-red-900',
      title: 'No elegible (descartada)',
      body: 'No cumple uno o más criterios de entrada de la convocatoria.',
    }
  }
  if (status === 'under_review') {
    return {
      className: 'bg-sky-50 border-sky-200 text-sky-900',
      title: 'En revisión',
      body: 'Su postulación está siendo evaluada por el comité. El score es input, no aceptación automática.',
    }
  }
  if (status === 'accepted') {
    return {
      className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      title: 'Aceptada',
      body: 'Decisión de comité. Felicitaciones.',
    }
  }
  if (status === 'waitlisted') {
    return {
      className: 'bg-amber-50 border-amber-200 text-amber-900',
      title: 'Lista de espera',
      body: 'Su postulación permanece en espera de cupo o decisión del comité.',
    }
  }
  if (status === 'rejected') {
    return {
      className: 'bg-zinc-100 border-zinc-300 text-zinc-800',
      title: 'No seleccionada',
      body: 'Decisión de comité (no es el descarte automático de elegibilidad).',
    }
  }
  if (status === 'scored') {
    return {
      className: 'bg-white border-zinc-200 text-zinc-900',
      title: 'Evaluada — ranking para comité',
      body: 'Score calculado. No hay aceptación automática.',
    }
  }
  return null
}

export function Resultado() {
  const { id } = useParams()
  const nav = useNavigate()
  const user = demoStore.getUser()
  const [app, setApp] = useState<DemoApp | null>(
    !isSupabaseConfigured && id ? demoStore.getApp(id) : null,
  )
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authed, setAuthed] = useState(!!user || isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !id) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const profile = await getMyProfile()
        if (!profile) {
          if (!cancelled) setAuthed(false)
          return
        }
        demoStore.login(profile.email)
        if (!cancelled) setAuthed(true)
        const row = await getApplication(id)
        if (!cancelled && row) {
          setApp({
            id: row.id,
            status: row.status,
            tipo_postulacion: row.tipo_postulacion,
            anos_operacion_comercial: row.anos_operacion_comercial,
            faculty_id: row.faculty_id,
            sector_id: row.sector_id,
            answers: row.answers,
            irl: row.irl,
            result: row.result,
            created_at: row.created_at,
            user_email: row.user_email ?? profile.email,
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteNav />
        <div className="max-w-3xl mx-auto pt-28 px-4 text-sm text-zinc-500">Cargando resultado…</div>
      </div>
    )
  }
  if (!authed && !user) return <Navigate to="/auth/login" replace />
  if (!app) return <Navigate to="/app" replace />

  const r = app.result
  const discarded = app.status === 'discarded' || (r != null && !r.discard.passed)
  const banner = statusBanner(app.status, !!discarded)

  async function goCorrect(fieldKey: string) {
    const step = stepForField(fieldKey) ?? 0
    if (isSupabaseConfigured) {
      try {
        await reopenAsDraft(app!.id)
        nav(`/app/${app!.id}?step=${step}&field=${encodeURIComponent(fieldKey)}`)
      } catch {
        /* ignore */
      }
      return
    }
    const reopened = demoStore.reopenDraft(app!.id)
    if (reopened) {
      nav(`/app/${app!.id}?step=${step}&field=${encodeURIComponent(fieldKey)}`)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-3xl mx-auto pt-28 px-4 pb-16">
        <Link to="/app" className="text-sm text-zinc-500 underline">
          ← Mis postulaciones
        </Link>
        <h1 className="text-2xl font-semibold mt-4 mb-2">Resultado de evaluación</h1>
        <p className="text-xs text-zinc-500 mb-6">
          Motor {r?.rules_version ?? '—'} · La IA no asigna el puntaje
        </p>

        {banner && (
          <div className={`border rounded-2xl p-4 mb-6 text-sm ${banner.className}`}>
            <p className="font-semibold">{banner.title}</p>
            <p className="mt-1 opacity-90">{banner.body}</p>
          </div>
        )}

        {!r && (
          <div className="bg-white border rounded-2xl p-6 text-sm">
            Aún no hay resultado. <Link to={`/app/${app.id}`}>Continuar borrador</Link>
          </div>
        )}

        {r && !r.valid && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm">
            <p className="font-semibold text-amber-900">Validación incompleta</p>
            <ul className="list-disc pl-5 mt-2 text-amber-800 space-y-2">
              {r.validation_errors.map((e) => (
                <li key={`${e.field}-${e.code}`}>
                  {e.message}
                  <button
                    type="button"
                    onClick={() => goCorrect(e.field)}
                    className="ml-2 text-[#C8102E] font-medium underline"
                  >
                    Corregir →
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {r?.valid && discarded && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h2 className="font-semibold text-red-900 text-lg flex items-center gap-2">
                <span>❌</span> Postulación no elegible
              </h2>
              <p className="text-sm text-red-800 mt-2">
                No cumple uno o más criterios de entrada. Esto no es el score de calidad; puede
                corregir y reenviar, o revisar criterios para una próxima convocatoria.
              </p>
              <ul className="mt-4 space-y-3">
                {r.discard.failed_rules.map((f) => (
                  <li
                    key={f.id}
                    className="text-sm bg-white rounded-xl px-4 py-3 border border-red-100 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs text-red-500">{f.id}</span>
                        <p className="font-medium text-red-900 mt-0.5">{f.label}</p>
                        <p className="text-zinc-600 mt-1 text-xs leading-relaxed">{f.suggestion}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goCorrect(f.field_key)}
                        className="shrink-0 text-xs font-medium bg-[#C8102E] text-white px-3 py-1.5 rounded-full"
                      >
                        Corregir →
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {r?.valid && !discarded && r.score && (
          <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">Score DeepTech (0–100)</p>
                <p className="text-5xl font-semibold text-zinc-900 tracking-tight">
                  {r.score.total_0_100}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm w-full sm:w-auto">
                {Object.entries(r.score.bloques).map(([k, v]) => (
                  <div
                    key={k}
                    className="bg-zinc-50 rounded-xl px-3 py-2"
                    title={`${k}: ${Number.isNaN(v) ? 'n/a' : (v * 100).toFixed(1)}% — ${blockLabel(v)}`}
                  >
                    <p className="text-[10px] uppercase text-zinc-500">{k}</p>
                    <p className="font-semibold">
                      {Number.isNaN(v) ? '—' : (v * 100).toFixed(1)}
                    </p>
                    <div className="mt-1.5 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${blockColor(v)}`}
                        style={{ width: Number.isNaN(v) ? '0%' : `${Math.min(100, v * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {r.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                  <span>⚠️</span> Recomendaciones de mejora
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-amber-900">
                  {r.warnings.map((w, i) => (
                    <li key={`${w.code}-${w.field ?? i}`} className="flex gap-2">
                      <span className="text-amber-500">•</span>
                      <span>
                        {w.message}
                        {w.field && stepForField(w.field) != null && (
                          <button
                            type="button"
                            onClick={() => goCorrect(w.field!)}
                            className="ml-2 text-[#C8102E] underline text-xs font-medium"
                          >
                            Revisar
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white border rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Desglose por variable</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-zinc-500">
                      <th className="py-2">Variable</th>
                      <th>Pts</th>
                      <th>Peso eff.</th>
                      <th>Contrib.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.score.line_items
                      .filter((li) => !li.skipped_optional)
                      .map((li) => (
                        <tr key={li.variable_key} className="border-b border-zinc-50">
                          <td className="py-1.5 font-mono">{li.variable_key}</td>
                          <td>
                            {li.points}/{li.max_points}
                          </td>
                          <td>{(li.weight_effective * 100).toFixed(1)}%</td>
                          <td>{(li.contribution * 100).toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-6">
              <h3 className="font-semibold mb-2">Madurez IRL (autoevaluación)</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Dimensiones: {r.irl_dims_aplicables.join(', ')}
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={r.irl_dims_aplicables.map((d) => ({
                      dim: d,
                      level: app.irl[d]?.level ?? 0,
                    }))}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                    <Radar dataKey="level" stroke="#C8102E" fill="#C8102E" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-zinc-100 border rounded-2xl p-5 text-sm text-zinc-600">
              <strong>Informe IA:</strong> no configurado en esta instancia (status skipped). El
              score y el descarte ya están completos sin LLM.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
