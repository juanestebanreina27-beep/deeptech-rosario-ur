# Auditoría multinacional — 4 rondas de debate

**Fecha:** 2026-08-02  
**Modo:** paneles paralelos (CEO/inversores, ingeniería/seguridad/DevOps, marketing/diseño, legal/ops/QA) + síntesis y mejoras aplicadas al repo.

---

## Ronda 1 — Diagnóstico en paralelo

| Panel | Veredicto | Score clave |
|-------|-----------|-------------|
| CEO + inversores | **GO_CON_CONDICIONES** (MVP sí; convocatoria real con firmas; SaaS multi-uni NO aún) | Listo-build 7.5 · Convocatoria ~4 · SaaS 3.5 |
| Eng + Security + DevOps | Arquitectura Supabase+Vercel **OK como piloto**; SQL **inseguro** para prod | Readiness global **4.5/10** (seguridad 3.5) |
| Marketing + Diseño | Hero Lithos OK como atracción; falta anclaje UR y legal en UI | UX/marca **6.4/10** |
| Legal + Ops + QA | Motor bien separado de IA; PII/IA/fairness bloquean go-live real | Compliance **5.5/10** |

### Consenso brutal (R1)

1. El **activo** del proyecto es: motor determinista + IA no puntuable + datos limpios.  
2. El **pasivo** es: pretender “producto de convocatoria” sin código, sin RLS seguro, sin bases legales, sin proceso humano de decisión.  
3. **Supabase + Vercel** se mantiene como destino de **implementación/piloto real en cloud** (no localhost). Azure queda como **ruta institucional** si TI lo exige (mismo modelo de datos).  
4. **IA de informes OFF por defecto** en primera convocatoria (o solo finalistas).  
5. Antes de code: parchear seguridad SQL, fairness de score, catálogo, contratos de submit.

---

## Ronda 2 — Debate entre paneles (conflictos resueltos)

| Conflicto | Decisión de síntesis (obligatoria) |
|-----------|-------------------------------------|
| “Producto real desplegado” vs “no hay app” | El repo debe decir: **blueprint enterprise listo para implementar**, no “ya desplegado”. Deploy = fase de build con cuentas. |
| Supabase vs Azure | **Build en Supabase+Vercel**; diseño portable; checklist TI para migración Azure sin rehacer motor. |
| Vite vs Next | **Vite SPA v1** (cerrado). Next solo si TI pide SSR. |
| `grado_innovacion` 35% opcional + renorm | **Obligatorio si innovacion ≥ 3**; si innovacion baja, puede omitirse. Evita gaming. |
| Rúbrica grupo investigación A1=2 … C=5 | **Corregida**: A1 mejor → más puntos (A1=5 … C=2, sin grupo=0). Excel original invertía calidad. |
| Cédula en MVP | **Opcional en form v1** / se puede pedir en perfil; **nunca al LLM**; export PII solo admin. |
| Score al descartado | **No mostrar** score de selección al postulante descartado. |
| Decisión de cupos | Score = **ranking + input a comité**; no aceptación automática. Estados `under_review` → humano. |
| Naming | **DeepTech Rosario** (UI) + subtítulo institucional UR. |

---

## Ronda 3 — Estándar “máximo nivel” (alcance de implementación v1)

### En alcance v1 (piloto cloud profesional)

- Auth email Supabase + roles (postulante / evaluador / admin) con **rol no auto-escalable**.  
- Wizard + pre-check elegibilidad (4 filtros).  
- Motor `motor_v1.1` (D01–D04, score, IRL) en Edge Function, **service role only** para resultados.  
- Admin: lista, detalle, filtros, export sin PII por defecto, override con motivo + audit.  
- Landing hero (mecánica spotlight) + trust UR + legal mínimo.  
- `ai_reports` schema listo; generate-report **skipped** sin API key.  
- Tests T1–T23 del motor en CI.  
- Staging + prod (dos proyectos Supabase recomendados).

### Fuera de v1 (no inflar)

- SSO Entra ID, Power BI, app móvil, chat evaluador, multi-tenant SaaS, CRM.

---

## Ronda 4 — Mejoras aplicadas al repo (esta iteración)

| Entrega | Ruta |
|---------|------|
| Decisiones cerradas v1.1 | `05_debate_validacion/DECISIONES_CERRADAS_V1_1.md` |
| GO/NO-GO implementación | `05_debate_validacion/GO_IMPLEMENTACION.md` |
| SPEC motor actualizada | `04_plan/SPEC_MOTOR_EVALUACION.md` |
| Catálogo ejecutable | `01_datos_limpios/rules_catalog_motor_v1.json` |
| SQL seguridad | `06_.../migrations/002_security_hardening.sql` |
| Storage policies | `06_.../migrations/003_storage_policies.sql` |
| Contrato Edge | `06_.../supabase/functions/CONTRACT.md` |
| Legal UI mínimo | `04_plan/LEGAL_UI_Y_PRIVACIDAD.md` |
| Product brief implementación | `04_plan/PRODUCT_BRIEF_IMPLEMENTACION.md` |
| Prompt cloud actualizado | `06_.../PROMPT_IMPLEMENTACION_CLOUD.md` |

---

## Scores post-mejora (estimación de paneles)

| Dimensión | R1 | Post R4 (docs) | Meta con código+UAT |
|-----------|----|----------------|---------------------|
| Listo para **escribir código** | 4.5–7.5 | **8.5** | 9 |
| Listo para **convocatoria datos reales** | 4–5.5 | **6.0** (falta firma UR legal/TI) | 8+ |
| Seguridad de diseño | 3.5 | **8.0** (si se aplica SQL 002+003) | 9 |

---

## Veredicto final unificado

### **GO_PARA_IMPLEMENTACION_TECNICA**

con condiciones:

1. Aplicar migraciones 001+002+003 en Supabase.  
2. Implementar según `PRODUCT_BRIEF_IMPLEMENTACION.md` + `PROMPT_IMPLEMENTACION_CLOUD.md`.  
3. IA de informes **no requerida** para lanzar.  
4. Go-live con investigadores reales solo tras aviso de privacidad UR + UAT Transferencia.
