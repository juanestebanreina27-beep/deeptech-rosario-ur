# Deploy producto real — Vercel + Supabase

## Principio

| Capa | Dónde corre |
|------|-------------|
| Web | **Vercel** (producción + previews) |
| Auth, DB, Storage, Edge Functions | **Supabase cloud** |
| Motor descarte/score/IRL | Edge Function `submit-application` |
| Informes IA | Edge Function `generate-report` **solo si hay API key** |

**No** se define arquitectura “backend en localhost” ni “Postgres en mi PC”.  
El SQL se aplica al **proyecto Supabase remoto**.  
El front se publica en **Vercel**.

---

## 0. Cuentas necesarias (una vez)

1. Cuenta [Supabase](https://supabase.com) → Create project (región cercana, ej. South America si disponible).  
2. Cuenta [Vercel](https://vercel.com) → Import Git repo.  
3. (Opcional) API key OpenAI / DeepSeek / xAI **solo cuando quieran informes**.

---

## 1. Supabase (backend)

### 1.1 Schema

1. Abrir **SQL Editor** del proyecto.  
2. Pegar y ejecutar:  
   `supabase/migrations/001_init.sql`  
3. Verificar tablas: `profiles`, `applications`, `score_results`, etc.

### 1.2 Auth

1. Authentication → Providers → **Email** (y/o magic link).  
2. (Opcional) dominio de correo `@urosario.edu.co` con restricción en app.  
3. Site URL: URL de Vercel prod (ej. `https://deeptech-rosario.vercel.app`).  
4. Redirect URLs: `https://*.vercel.app/**` + dominio custom si hay.

### 1.3 Storage

1. Create bucket **`application-files`** → **Private**.  
2. Policies: usuarios autenticados pueden subir solo bajo `user_id/application_id/...` (ajustar en Dashboard).

### 1.4 Edge Functions

1. Implementar según `supabase/functions/README.md` (código en el repo de la app).  
2. Deploy al project-ref remoto.  
3. Secrets: service role + (opcional) AI keys.

### 1.5 Staff

Promover evaluador/admin en SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'tu-correo@urosario.edu.co';
```

---

## 2. Vercel (frontend)

1. Conectar repositorio Git.  
2. Framework: Vite o Next.  
3. Root directory: carpeta de la app web.  
4. Environment variables (Production + Preview):

Ver `.env.production.example`.

Mínimo:

```text
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Nunca** poner `SERVICE_ROLE` ni `AI_API_KEY` en Vercel frontend.

5. Deploy → dominio `*.vercel.app`.  
6. (Opcional) dominio custom / `deeptech.urosario.edu.co` (DNS + Vercel).

---

## 3. Verificación post-deploy (producto, no demo)

| Check | OK |
|-------|----|
| Registro + login en URL de Vercel | ☐ |
| Crear borrador y autosave | ☐ |
| Submit con caso T1 (sin vínculo) → discarded | ☐ |
| Submit caso feliz → scored + total_0_100 | ☐ |
| Tipo salud → IRL con RRL | ☐ |
| Sin AI key → informe `skipped`, score igual funciona | ☐ |
| Con AI key → “Generar informe” produce MD/JSON | ☐ |
| Usuario A no ve postulación de usuario B | ☐ |
| Admin ve listado | ☐ |

---

## 4. Operación continua

- Cambios de pesos/reglas → nueva `rules_version` (`motor_v2`) + no reescribir scores viejos.  
- Backups: Supabase PITR / daily backups según plan.  
- Monitoreo: Vercel logs + Supabase function logs.  
- Costos: Supabase plan, Vercel plan, tokens IA solo si se usan informes.

---

## 5. Qué falta de tu lado (humano)

1. Crear proyectos Supabase + Vercel (o dar acceso).  
2. Ejecutar SQL / conectar Git.  
3. Cuando quieran informes: pegar **una** API key en secrets de Supabase.  
4. Textos legales de privacidad en la web.  
5. Correo admin staff.

El resto (motor, schema, prompts de build) está en este repo.
