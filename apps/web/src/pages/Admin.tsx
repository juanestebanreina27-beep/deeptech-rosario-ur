import { Navigate } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { demoStore } from '@/lib/demoStore'

export function Admin() {
  const user = demoStore.getUser()
  if (!user) return <Navigate to="/auth/login" replace />
  if (user.role !== 'admin' && user.role !== 'evaluador') {
    return <Navigate to="/app" replace />
  }
  const apps = demoStore.listApps()

  function exportCsv() {
    const rows = [
      ['id', 'email', 'status', 'tipo', 'score', 'failed_rules'],
      ...apps.map((a) => [
        a.id,
        a.user_email,
        a.status,
        a.tipo_postulacion ?? '',
        a.result?.score?.total_0_100 ?? '',
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

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-5xl mx-auto pt-28 px-4 pb-16">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Panel evaluadores</h1>
            <p className="text-sm text-zinc-500">DeepTech Rosario · ranking e input a comité (sin aceptación automática)</p>
          </div>
          <button onClick={exportCsv} className="text-sm border px-4 py-2 rounded-full bg-white">
            Export CSV (sin PII extra)
          </button>
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
              </tr>
            </thead>
            <tbody>
              {apps
                .slice()
                .sort((a, b) => (b.result?.score?.total_0_100 ?? -1) - (a.result?.score?.total_0_100 ?? -1))
                .map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{a.id.slice(0, 8)}</td>
                    <td className="p-3">{a.user_email}</td>
                    <td className="p-3">{a.status}</td>
                    <td className="p-3 text-xs">{a.tipo_postulacion ?? '—'}</td>
                    <td className="p-3 font-semibold">
                      {a.status === 'discarded' ? '—' : (a.result?.score?.total_0_100 ?? '—')}
                    </td>
                  </tr>
                ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    Sin postulaciones aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
