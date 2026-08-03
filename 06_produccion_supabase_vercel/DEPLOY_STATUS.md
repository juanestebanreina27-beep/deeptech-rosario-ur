# Estado de implementación y despliegue

**Fecha:** 2026-08-02  
**Producto:** DeepTech Rosario v1  

---

## Qué quedó construido

| Pieza | Estado |
|-------|--------|
| App React + Vite + Tailwind | ✅ `apps/web` |
| Motor `motor_v1.1` + 11 tests | ✅ `npm test` verde |
| Build producción | ✅ `npm run build` |
| Modo demo (sin Supabase) | ✅ localStorage + motor local |
| SQL 001–003 Supabase | ✅ en `supabase/migrations` |
| Edge function stub | ✅ `supabase/functions/submit-application` |
| Repo GitHub | ✅ https://github.com/juanestebanreina27-beep/deeptech-rosario-ur |
| GitHub Pages | ✅ https://juanestebanreina27-beep.github.io/deeptech-rosario-ur/ |
| Vercel CLI | ⚠️ cuenta local sin acceso al team MCP; usar import desde GitHub |
| Supabase proyecto cloud | ⬜ crear y pegar env (sin token en sesión) |
| API IA informes | ⬜ opcional / skipped |

---

## URL pública (demo completa del flujo)

**https://juanestebanreina27-beep.github.io/deeptech-rosario-ur/**

Funciona **sin Supabase** (modo demo):

1. Inscribirse (cualquier email; con `admin` en el correo → rol admin)  
2. Nueva postulación → wizard  
3. Enviar → descarte o score + radar IRL  
4. Panel admin si email contiene `admin`

---

## Conectar Supabase (5 minutos)

1. Crear proyecto en https://supabase.com  
2. SQL Editor → ejecutar en orden:  
   - `supabase/migrations/001_init.sql`  
   - `supabase/migrations/002_security_hardening.sql`  
   - `supabase/migrations/003_storage_policies.sql`  
3. Project Settings → API → copiar URL y anon key  
4. En Vercel o GitHub Actions / Pages rebuild, env:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_BASE=/
```

5. Para Vercel root domain: `VITE_BASE=/` y root directory `apps/web`.

---

## Conectar Vercel (recomendado producción)

1. https://vercel.com/new  
2. Import `juanestebanreina27-beep/deeptech-rosario-ur`  
3. Root Directory: `apps/web`  
4. Env: `VITE_BASE=/` + Supabase keys  
5. Deploy  

(La sesión de agente tiene MCP Vercel en team `juanestebanreina27-2954s-projects`; el CLI local no tenía scope. Import desde GitHub es el camino más estable.)

---

## Cómo probar el motor localmente

```bash
cd apps/web
npm install
npm test
npm run dev
```

---

## IA

Sin `AI_API_KEY` el producto **no se bloquea**. Informe = skipped.
