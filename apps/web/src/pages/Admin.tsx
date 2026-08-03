import { Fragment, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { demoStore } from '@/lib/demoStore'

const DISCARD_RULES = [
  'D01_sin_vinculo',
  'D02_solo_idea',
  'D03_operacion_gt_3a',
  'D04_sin_base_tech',
] as const

type StatusFilter = 'all' | 'draft' | 'scored' | 'discarded'

export function Admin() {
  const user = demoStore.getUser()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ruleFilter, setRuleFilter] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [overrideModal, setOverrideModal] = useState<string | null>(null)

  const apps = useMemo(() => {
    if (!user) return []
    if (user.role !== 'admin' && user.role !== 'evaluador') return []
    return demoStore.listApps()
  }, [user, statusFilter, ruleFilter, expanded])

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (ruleFilter) {
        const ids = a.result?.discard.failed_rules.map((f) => f.id) ?? []
        if (!ids.includes(ruleFilter)) return false
      }
      return true
    })
  }, [apps, statusFilter, ruleFilter])

  const stats = useMemo(() => {
    const total = apps.length
    const scored = apps.filter((a) => a.status === 'scored').length
    const discarded = apps.filter((a) => a.status === 'discarded').length
    const draft = apps.filter((a) => a.status === 'draft').length
    const scoredApps = apps.filter((a) => a.result?.score)
    const avgScore =
      scoredApps.length > 0
        ? scoredApps.reduce((s, a) => s + (a.result!.score!.total_0_100 ?? 0), 0) / scoredApps.length
        : null
    const byRule: Record<string, number> = {}
    for (const id of DISCARD_RULES) byRule[id] = 0
    for (const a of apps) {
      for (const f of a.result?.discard.failed_rules ?? []) {
        byRule[f.id] = (byRule[f.id] ?? 0) + 1
      }
    }
    return { total, scored, discarded, draft, avgScore, byRule }
  }, [apps])

  if (!user) return <Navigate to="/auth/login" replace />
  if (user.role !== 'admin' && user.role !== 'evaluador') {
    return <Navigate to="/app" replace />
  }

  function exportCsv() {
    const rows = [
      ['id', 'email', 'status', 'tipo', 'score', 'score_shadow', 'failed_rules'],
      ...apps.map((a) => [
        a.id,
        a.user_email,
        a.status,
        a.tipo_postulacion ?? '',
        a.result?.score?.total_0_100 ?? '',
        a.result?.score_shadow?.total_0_100 ?? '',
        a.result?.discard.failed_rules.map((f) => f.id).join('|') ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'deeptech-rosario-export.csv'
    a.click()
  }

  const maxRuleCount = Math.max(1, ...Object.values(stats.byRule))

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-5xl mx-auto pt-28 px-4 pb-16">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Panel evaluadores</h1>
            <p className="text-sm text-zinc-500">
              DeepTech Rosario · ranking e input a comité (sin aceptación automática)
            </p>
          </div>
          <button onClick={exportCsv} className="text-sm border px-4 py-2 rounded-full bg-white">
            Export CSV (sin PII extra)
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            ['Total', stats.total],
            ['Scored', stats.scored],
            ['Descartadas', stats.discarded],
            ['Borrador', stats.draft],
            ['Score prom.', stats.avgScore != null ? stats.avgScore.toFixed(1) : '—'],
          ].map(([label, val]) => (
            <div key={label as string} className="bg-white border rounded-2xl p-3 text-center">
              <p className="text-[10px] uppercase text-zinc-500">{label}</p>
              <p className="text-xl font-semibold">{val}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border rounded-2xl p-4 mb-6">
          <h2 className="text-sm font-semibold mb-3">Distribución de descartes por regla</h2>
          <div className="space-y-2">
            {DISCARD_RULES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setRuleFilter(ruleFilter === id ? null : id)}
                className="w-full flex items-center gap-3 text-left text-xs"
              >
                <span className="font-mono w-40 shrink-0">{id}</span>
                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${(stats.byRule[id] / maxRuleCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-semibold">{stats.byRule[id]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="text-sm border rounded-full px-3 py-1.5 bg-white"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">draft</option>
            <option value="scored">scored</option>
            <option value="discarded">discarded</option>
          </select>
          <div className="flex flex-wrap gap-1.5">
            {DISCARD_RULES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setRuleFilter(ruleFilter === id ? null : id)}
                className={`text-[10px] font-mono px-2 py-1 rounded-full border ${
                  ruleFilter === id
                    ? 'bg-red-100 border-red-300 text-red-800'
                    : 'bg-white text-zinc-600'
                }`}
              >
                {id.split('_')[0]}
              </button>
            ))}
            {ruleFilter && (
              <button
                type="button"
                onClick={() => setRuleFilter(null)}
                className="text-[10px] px-2 py-1 text-zinc-500 underline"
              >
                limpiar regla
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Email</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Score</th>
                <th className="p-3">Fallas</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice()
                .sort(
                  (a, b) =>
                    (b.result?.score?.total_0_100 ?? b.result?.score_shadow?.total_0_100 ?? -1) -
                    (a.result?.score?.total_0_100 ?? a.result?.score_shadow?.total_0_100 ?? -1),
                )
                .map((a) => {
                  const isOpen = expanded === a.id
                  const failed = a.result?.discard.failed_rules ?? []
                  return (
                    <Fragment key={a.id}>
                      <tr className="border-t">
                        <td className="p-3 font-mono text-xs">{a.id.slice(0, 8)}</td>
                        <td className="p-3">{a.user_email}</td>
                        <td className="p-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              a.status === 'discarded'
                                ? 'bg-red-100 text-red-800'
                                : a.status === 'scored'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs">{a.tipo_postulacion ?? '—'}</td>
                        <td className="p-3 font-semibold">
                          {a.status === 'discarded' ? (
                            <span className="text-zinc-400" title="Score sombra (solo admin)">
                              🔒 {a.result?.score_shadow?.total_0_100 ?? '—'}
                              <span className="block text-[10px] font-normal">shadow</span>
                            </span>
                          ) : (
                            (a.result?.score?.total_0_100 ?? '—')
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {failed.map((f) => (
                              <span
                                key={f.id}
                                className="text-[10px] font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded"
                                title={f.label}
                              >
                                {f.id.split('_')[0]}
                              </span>
                            ))}
                            {failed.length === 0 && <span className="text-zinc-300">—</span>}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : a.id)}
                            className="text-xs text-[#C8102E] underline"
                          >
                            {isOpen ? 'Cerrar' : 'Detalle'}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-zinc-50 border-t">
                          <td colSpan={7} className="p-4 text-xs space-y-3">
                            {failed.length > 0 && (
                              <div>
                                <p className="font-semibold text-red-800 mb-1">Reglas fallidas</p>
                                <ul className="space-y-1">
                                  {failed.map((f) => (
                                    <li key={f.id} className="bg-white border rounded-lg px-3 py-2">
                                      <span className="font-mono text-red-500">{f.id}</span> —{' '}
                                      {f.label}
                                      <p className="text-zinc-500 mt-0.5">{f.suggestion}</p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {a.result?.score_shadow && (
                              <div>
                                <p className="font-semibold mb-1">
                                  Score sombra (admin){' '}
                                  <span className="font-normal text-zinc-500">
                                    · no visible al postulante
                                  </span>
                                </p>
                                <p className="text-lg font-semibold">
                                  {a.result.score_shadow.total_0_100}
                                </p>
                                <div className="flex gap-3 mt-1">
                                  {Object.entries(a.result.score_shadow.bloques).map(([k, v]) => (
                                    <span key={k}>
                                      {k}: {Number.isNaN(v) ? '—' : (v * 100).toFixed(1)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {a.result?.warnings && a.result.warnings.length > 0 && (
                              <div>
                                <p className="font-semibold text-amber-800 mb-1">Warnings</p>
                                <ul className="list-disc pl-4 text-amber-900">
                                  {a.result.warnings.map((w, i) => (
                                    <li key={i}>{w.message}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {a.status === 'discarded' && (
                              <div className="pt-2 border-t">
                                <button
                                  type="button"
                                  onClick={() => setOverrideModal(a.id)}
                                  className="text-xs border px-3 py-1.5 rounded-full bg-white text-zinc-600"
                                >
                                  Revertir descarte (próximamente)
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    Sin postulaciones con este filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {overrideModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-semibold text-lg">Revertir descarte</h3>
            <p className="text-sm text-zinc-600 mt-2">
              Esta acción estará disponible cuando el override con audit log esté habilitado en
              producción. Por ahora es solo un placeholder de UI.
            </p>
            <label className="block text-sm mt-4">
              <span className="font-medium">Justificación (requerida en v2)</span>
              <textarea
                className="mt-1 w-full border rounded-xl p-2 text-sm"
                rows={3}
                disabled
                placeholder="Motivo del override…"
              />
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="text-sm px-4 py-2 rounded-full border"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled
                className="text-sm px-4 py-2 rounded-full bg-zinc-200 text-zinc-500 cursor-not-allowed"
              >
                Confirmar (deshabilitado)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
