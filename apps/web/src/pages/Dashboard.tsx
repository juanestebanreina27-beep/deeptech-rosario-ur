import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { demoStore, type DemoApp } from '@/lib/demoStore'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createApplication, getMyProfile, listMyApplications, type AppRow } from '@/lib/supabase/api'
import { Plus } from 'lucide-react'

type ListItem = {
  id: string
  status: string
  created_at: string
  user_email: string
}

export function Dashboard() {
  const demoUser = demoStore.getUser()
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [cloudUser, setCloudUser] = useState<{ email: string; name: string } | null>(null)
  const [apps, setApps] = useState<ListItem[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      if (demoUser) {
        setApps(
          demoStore
            .listApps()
            .filter((a) => a.user_email === demoUser.email)
            .map(mapDemo),
        )
      }
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const profile = await getMyProfile()
        if (!profile) {
          if (!cancelled) setCloudUser(null)
          return
        }
        if (!cancelled) {
          setCloudUser({ email: profile.email, name: profile.full_name ?? profile.email })
          demoStore.login(profile.email)
        }
        const rows = await listMyApplications()
        if (!cancelled) setApps(rows.map(mapCloud))
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Error cargando postulaciones')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [demoUser?.email])

  const userEmail = cloudUser?.email ?? demoUser?.email
  if (!loading && !userEmail) return <Navigate to="/auth/login" replace />

  async function create() {
    setErr('')
    try {
      if (isSupabaseConfigured) {
        const app = await createApplication()
        window.location.href = `/app/${app.id}`
        return
      }
      const app = demoStore.createApp()
      window.location.href = `/app/${app.id}`
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo crear la postulación')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteNav />
      <div className="max-w-3xl mx-auto pt-28 px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Mis postulaciones</h1>
            <p className="text-sm text-zinc-500">
              {userEmail}
              {isSupabaseConfigured ? (
                <span className="ml-2 text-emerald-700">· Supabase</span>
              ) : (
                <span className="ml-2 text-amber-700">· demo local</span>
              )}
            </p>
          </div>
          <button
            onClick={create}
            className="inline-flex items-center gap-2 bg-[#C8102E] text-white px-5 py-2.5 rounded-full text-sm font-medium"
          >
            <Plus size={16} /> Nueva postulación
          </button>
        </div>
        {err && <p className="text-sm text-red-600 mb-4">{err}</p>}
        {loading ? (
          <div className="bg-white border rounded-2xl p-10 text-center text-zinc-500 text-sm">Cargando…</div>
        ) : apps.length === 0 ? (
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

function mapDemo(a: DemoApp): ListItem {
  return { id: a.id, status: a.status, created_at: a.created_at, user_email: a.user_email }
}

function mapCloud(a: AppRow): ListItem {
  return { id: a.id, status: a.status, created_at: a.created_at, user_email: a.user_email ?? '' }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-zinc-100 text-zinc-700',
    discarded: 'bg-red-100 text-red-800',
    scored: 'bg-emerald-100 text-emerald-800',
    under_review: 'bg-sky-100 text-sky-800',
    accepted: 'bg-emerald-100 text-emerald-900',
    waitlisted: 'bg-amber-100 text-amber-900',
    rejected: 'bg-zinc-200 text-zinc-800',
  }
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${map[status] ?? 'bg-zinc-100'}`}>
      {status}
    </span>
  )
}
