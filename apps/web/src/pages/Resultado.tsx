import { Link, Navigate, useParams } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { demoStore } from '@/lib/demoStore'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

export function Resultado() {
  const { id } = useParams()
  const user = demoStore.getUser()
  const app = id ? demoStore.getApp(id) : null
  if (!user) return <Navigate to="/auth/login" replace />
  if (!app) return <Navigate to="/app" replace />

  const r = app.result
  const discarded = app.status === 'discarded' || (r && !r.discard.passed)

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-3xl mx-auto pt-28 px-4 pb-16">
        <Link to="/app" className="text-sm text-zinc-500 underline">
          ← Mis postulaciones
        </Link>
        <h1 className="text-2xl font-semibold mt-4 mb-2">Resultado de evaluación</h1>
        <p className="text-xs text-zinc-500 mb-8">
          Motor {r?.rules_version ?? '—'} · La IA no asigna el puntaje
        </p>

        {!r && (
          <div className="bg-white border rounded-2xl p-6 text-sm">
            Aún no hay resultado. <Link to={`/app/${app.id}`}>Continuar borrador</Link>
          </div>
        )}

        {r && !r.valid && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm">
            <p className="font-semibold text-amber-900">Validación incompleta</p>
            <ul className="list-disc pl-5 mt-2 text-amber-800">
              {r.validation_errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <Link to={`/app/${app.id}`} className="inline-block mt-4 text-[#C8102E] font-medium">
              Corregir postulación
            </Link>
          </div>
        )}

        {r?.valid && discarded && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h2 className="font-semibold text-red-900 text-lg">Postulación no elegible</h2>
            <p className="text-sm text-red-800 mt-2">
              No cumple uno o más criterios de entrada. Esto no es el score de calidad; puedes revisar criterios para una
              próxima convocatoria.
            </p>
            <ul className="mt-4 space-y-2">
              {r.discard.failed_rules.map((f) => (
                <li key={f.id} className="text-sm bg-white/80 rounded-lg px-3 py-2 border border-red-100">
                  <span className="font-mono text-xs text-red-500">{f.id}</span>
                  <br />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {r?.valid && !discarded && r.score && (
          <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">Score DeepTech (0–100)</p>
                <p className="text-5xl font-semibold text-zinc-900 tracking-tight">{r.score.total_0_100}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm w-full sm:w-auto">
                {Object.entries(r.score.bloques).map(([k, v]) => (
                  <div key={k} className="bg-zinc-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] uppercase text-zinc-500">{k}</p>
                    <p className="font-semibold">{Number.isNaN(v) ? '—' : (v * 100).toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>

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
              <p className="text-xs text-zinc-500 mb-4">Dimensiones: {r.irl_dims_aplicables.join(', ')}</p>
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
              <strong>Informe IA:</strong> no configurado en esta instancia (status skipped). El score y el descarte ya
              están completos sin LLM.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
