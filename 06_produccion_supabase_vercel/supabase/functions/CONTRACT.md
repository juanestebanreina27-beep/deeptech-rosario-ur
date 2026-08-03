# Contrato Edge Functions — trust boundary

## Principio

| Actor | Puede |
|-------|--------|
| Browser + anon/user JWT | Auth, CRUD draft vía RLS, leer propios resultados (no score si discarded), invocar functions |
| Edge Function + **service role** | Escribir discard/score/ai_reports/audit; cambiar status de application |
| Nunca el browser | Insertar scores, cambiar `profiles.role`, mutar post-submit |

---

## `submit-application`

### Request

```json
{ "application_id": "uuid" }
```

Headers: `Authorization: Bearer <user_jwt>`

### Algoritmo

1. `auth.getUser(jwt)` → 401 si inválido.  
2. Load application; 404 si no existe; 403 si no owner/staff.  
3. Si `status != 'draft'` → 409 Conflict (idempotencia: si ya scored/discarded con same rules, devolver resultado existente).  
4. Verificar `consent_at` no null → 400.  
5. Load answers; **ignorar score_points del cliente**; resolver puntos desde `rules_catalog_motor_v1.json`.  
6. Validar obligatorios motor_v1.1 (incl. tipo, anos_operacion, grado_innovacion condicional).  
7. **Transacción lógica:**  
   a. discard → upsert `discard_results`  
   b. if !passed → status=discarded; audit; return  
   c. score → upsert `score_results`  
   d. ensure IRL rows for applicable dims (require self_level+justification)  
   e. status=scored  
   f. if AI key present → insert ai_reports pending (no bloquear) else skipped  
8. Response 200 + payload motor.

### Errores

| Code | Cuándo |
|------|--------|
| 400 | Validación / sin consentimiento |
| 401 | JWT |
| 403 | No owner |
| 409 | Ya enviada |
| 500 | Error interno (log request_id, sin PII) |

---

## `generate-report`

1. AuthZ owner o staff.  
2. Rate limit: 3/día postulante; staff 20/día.  
3. Sin API key → `skipped`.  
4. Allowlist de campos (sin cédula, phone, email).  
5. Timeout + 1 retry schema.  
6. Nunca modifica score ni status de application (salvo campos ia_* en IRL si se usa contraste).

---

## Idempotency

Header opcional `Idempotency-Key`. Si reenvío del mismo key + application_id en 24h → misma respuesta.
