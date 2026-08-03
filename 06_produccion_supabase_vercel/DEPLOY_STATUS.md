# Estado deploy — 2026-08-02 (sesión actual)

## Hecho en código
- Capa Supabase `apps/web/src/lib/supabase/api.ts` (applications, answers, IRL, submit edge)
- Auth / Dashboard / Wizard / Resultado dual-mode (Supabase o demo local)
- `vite.config.ts` base `/` (Vercel) + `vercel.json` SPA rewrites
- Edge function `submit-application` + `motor.ts` + rules catalog en repo
- Push a GitHub: `main` @ https://github.com/juanestebanreina27-beep/deeptech-rosario-ur

## Vercel
- Team MCP: `juanestebanreina27-2954s-projects` (`team_aWsfSbAwN4Ie54lVSmOk2ssM`)
- Proyecto existente `deeptech-rosario` es **otra app Next.js** (Deeptech Transfer). NO sobrescribir.
- Proyecto objetivo nuevo: **`deeptech-rosario-ur`**
- Payload listo: `apps/web/deploy-ready.cjs` / `C:\Users\grana\vercel_tool_args.json` (36 files)

## Supabase
- **Falta access token / proyecto cloud** en esta máquina (sin `SUPABASE_ACCESS_TOKEN`)
- SQL listo: `supabase/migrations/001_init.sql` + `002` + `003`
- Edge function lista para `supabase functions deploy submit-application`

## URLs
- GitHub Pages demo: https://juanestebanreina27-beep.github.io/deeptech-rosario-ur/
- Vercel (pendiente de deploy MCP o import Git): `https://deeptech-rosario-ur.vercel.app` (tras deploy)
