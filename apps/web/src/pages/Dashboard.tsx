import { Link, Navigate } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { demoStore } from '@/lib/demoStore'
import { Plus } from 'lucide-react'

export function Dashboard() {
  const user = demoStore.getUser()
  if (!user) return <Navigate to="/auth/login" replace />
  const apps = demoStore.listApps().filter((a) => a.user_email === user.email)

  function create() {
    const app = demoStore.createApp()
    window.location.href = `/app/${app.id}`
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-3xl mx-auto pt-28 px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Mis postulaciones</h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
          <button
            onClick={create}
            className="inline-flex items-center gap-2 bg-[#C8102E] text-white px-5 py-2.5 rounded-full text-sm font-medium"
          >
            <Plus size={16} /> Nueva postulación
          </button>
        </div>
        {apps.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center text-zinc-500 text-sm">
            Aún no tienes postulaciones. Crea una para comenzar el wizard.
          </div>
        ) : (
          <ul className="space-y-3">
            {apps.map((a) => (
              <li key={a.id}>
                <Link
                  to={a.status === 'draft' ? `/app/${a.id}` : `/app/${a.id}/resultado`}
                  className="flex justify-between items-center bg-white border rounded-xl px-5 py-4 hover:border-[#C8102E]/40"
                >
                  <div>
                    <p className="font-medium text-sm">Postulación {a.id.slice(0, 8)}</p>
                    <p className="text-xs text-zinc-500">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-zinc-100 text-zinc-700',
    discarded: 'bg-red-100 text-red-800',
    scored: 'bg-emerald-100 text-emerald-800',
  }
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${map[status] ?? 'bg-zinc-100'}`}>
      {status}
    </span>
  )
}
