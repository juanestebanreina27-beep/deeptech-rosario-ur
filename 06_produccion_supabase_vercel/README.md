# Producción — Supabase + Vercel (producto real)

> **No se usa localhost como arquitectura objetivo.**  
> Desarrollo eventual puede usar `supabase` remoto y preview de Vercel.  
> Backend = **Supabase** (Auth + Postgres + Storage + Edge Functions).  
> Frontend = **Vercel** (React + Vite o Next).

## Contenido de esta carpeta

| Archivo / carpeta | Para qué |
|-------------------|----------|
| `DEPLOY.md` | Checklist de despliegue real |
| `.env.production.example` | Variables en Vercel + Supabase secrets |
| `supabase/migrations/001_init.sql` | Schema + RLS base |
| `supabase/migrations/002_security_hardening.sql` | **Obligatorio** — anti escalación de rol, inmutabilidad post-submit |
| `supabase/migrations/003_storage_policies.sql` | Bucket privado + policies |
| `supabase/functions/README.md` + `CONTRACT.md` | Edge Functions + trust boundary |
| `PROMPT_IMPLEMENTACION_CLOUD.md` | Prompt para construir y desplegar (post-auditoría) |

## Flujo de producto (cloud)

```text
Usuario → Vercel (web)
            ↓
         Supabase Auth
            ↓
         Postgres (RLS) + Storage
            ↓
         Edge Function `submit-application`
            → motor_v1 (descarte + score + IRL)
            → (si AI_API_KEY) encola informe
```

## IA de informes

- **No bloquea** el producto.  
- Scoring y descarte corren **siempre**.  
- Informe: botón “Generar informe” o post-submit **solo si** hay provider configurado en secrets de Supabase.
