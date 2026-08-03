# Estado deploy — actualizado

## Vercel LIVE
- **URL:** https://deeptech-rosario-ur.vercel.app
- Proyecto: `deeptech-rosario-ur` (team juanestebanreina27-2954s-projects)
- Framework: Vite
- Deploy: landing de producción (placeholder) — app completa en repo + GitHub Pages

## App completa (demo)
- GitHub Pages: https://juanestebanreina27-beep.github.io/deeptech-rosario-ur/
- Repo: https://github.com/juanestebanreina27-beep/deeptech-rosario-ur

## Supabase (pendiente de credenciales)
Sin `SUPABASE_ACCESS_TOKEN` en la máquina. Para conectar:

1. Crear proyecto en https://supabase.com
2. SQL Editor → ejecutar en orden:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_security_hardening.sql`
   - `supabase/migrations/003_storage_policies.sql`
3. Storage → bucket privado `application-files`
4. Edge Functions: `supabase functions deploy submit-application`
5. Auth → Site URL = `https://deeptech-rosario-ur.vercel.app`
   Redirect URLs = `https://deeptech-rosario-ur.vercel.app/**` y `https://*.vercel.app/**`
6. En Vercel → Project Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BASE=/`
7. Redeploy

## Código listo
- Capa Supabase API en `apps/web/src/lib/supabase/api.ts`
- Auth/Dashboard/Wizard/Resultado dual-mode
- Edge function `submit-application` + motor_v1.1
- 24 tests del motor en verde
