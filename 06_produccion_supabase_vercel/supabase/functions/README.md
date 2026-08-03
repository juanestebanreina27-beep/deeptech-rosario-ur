# Edge Functions (Supabase) — backend cloud

**No hay servidor en el PC del desarrollador como runtime de producción.**  
El backend ejecutable son estas funciones en Supabase + RLS.

## Funciones requeridas

### 1. `submit-application`

**Trigger:** cliente autenticado hace `POST` con `{ application_id }`.

**Pasos:**

1. Verificar JWT y que la application es del user (o staff).  
2. Cargar answers + campos de cabecera.  
3. Validar obligatorios (`motor_v1`).  
4. Ejecutar **discard** → insert `discard_results`.  
5. Si no pasa → `status = discarded`, return motivos.  
6. Si pasa → calcular **score** → insert `score_results`.  
7. Validar IRL dims aplicables → asegurar filas en `irl_assessments`.  
8. `status = scored`.  
9. Si existe secret `AI_API_KEY` (o `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` / `XAI_API_KEY`):  
   - insert `ai_reports` status `pending`  
   - invocar `generate-report` (async o misma request con timeout)  
   - si **no** hay key → `ai_reports.status = skipped`  
10. Audit log `submit`.

**Runtime del motor:** portar la lógica de  
`04_plan/SPEC_MOTOR_EVALUACION.md` +  
`01_datos_limpios/mapeo_score_postulacion.json`  
a TypeScript dentro de la función (o paquete compartido importable).

### 2. `generate-report` (opcional)

**Trigger:** botón “Generar informe” o post-submit.

- Si **no** hay API key en secrets → `skipped` y mensaje “Informes IA no configurados”.  
- Si hay key → armar contexto (score + answers sin PII innecesaria) → LLM → guardar `content_json` / `content_md`.  
- Proveedor: leer `AI_PROVIDER` = `openai` | `deepseek` | `xai`.

### 3. (Opcional) `admin-export`

CSV de postulaciones (solo staff). Service role o check `is_staff`.

---

## Secrets (Supabase Dashboard → Edge Functions → Secrets)

| Secret | Obligatorio prod | Notas |
|--------|------------------|-------|
| `SUPABASE_URL` | auto | |
| `SUPABASE_ANON_KEY` | auto | |
| `SUPABASE_SERVICE_ROLE_KEY` | sí (en function) | solo server |
| `AI_PROVIDER` | no | openai / deepseek / xai |
| `AI_API_KEY` o keys específicas | no | sin esto el producto igual vive |
| `AI_MODEL` | no | default por provider |

---

## Deploy de functions (desde CI o máquina con login, no “servidor local”)

```bash
# En proyecto con Supabase CLI logueado al proyecto remoto:
supabase functions deploy submit-application --project-ref <REF>
supabase functions deploy generate-report --project-ref <REF>
```

No se expone un backend Node en el laptop del usuario final.
