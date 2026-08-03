# Product Brief — Implementación v1 (DeepTech Rosario)

**Estado:** listo para implementación técnica  
**Runtime:** Vercel + Supabase (cloud)  
**Motor:** `motor_v1.1`  
**IA informes:** opcional / OFF por defecto  

---

## 1. Qué se construye

Producto web de **selección y diagnóstico** de postulaciones deeptech de la Universidad del Rosario:

1. Landing con hero spotlight (marca UR).  
2. Auth (registro / login).  
3. Pre-check de elegibilidad (4 filtros).  
4. Wizard de postulación + autosave.  
5. Submit → motor descarte + score + IRL.  
6. Resultado (motivos / score / radar).  
7. Admin staff (lista, detalle, export, override).  
8. Slot “Generar informe IA” (skipped sin API key).

---

## 2. Qué NO se construye en v1

- SSO Entra ID, Azure obligatorio, Power BI, app móvil, chat, multi-universidad SaaS.  
- Aceptación automática de cupos por score.  
- Dependencia de OpenAI/DeepSeek para funcionar.

---

## 3. User stories mínimas

| ID | Como | Quiero | Para |
|----|------|--------|------|
| US1 | Visitante | Entender la convocatoria y postular | Entrar al programa |
| US2 | Postulante | Guardar borrador y enviar | Completar sin perder datos |
| US3 | Postulante | Ver si fui descartado y por qué | Entender elegibilidad |
| US4 | Postulante | Ver score y madurez si pasé | Diagnosticar brechas |
| US5 | Evaluador | Ver ranking y expedientes | Preparar comité |
| US6 | Admin | Exportar y override con motivo | Operar convocatoria |
| US7 | Sistema | Calcular sin IA | Garantizar trazabilidad |

---

## 4. Fuentes de implementación (orden)

1. `05_debate_validacion/DECISIONES_CERRADAS_V1_1.md`  
2. `01_datos_limpios/rules_catalog_motor_v1.json`  
3. `04_plan/SPEC_MOTOR_EVALUACION.md`  
4. `06_produccion_supabase_vercel/supabase/migrations/*.sql`  
5. `06_produccion_supabase_vercel/supabase/functions/CONTRACT.md`  
6. `03_prompts/PROMPT_FRONTEND_HERO.md` + `04_plan/SPEC_FRONTEND_UX.md`  
7. `04_plan/LEGAL_UI_Y_PRIVACIDAD.md`  
8. `06_produccion_supabase_vercel/PROMPT_IMPLEMENTACION_CLOUD.md`  

---

## 5. Definition of Done v1

- [ ] Migraciones 001–003 en Supabase **staging** y **prod**  
- [ ] Web en Vercel con HTTPS  
- [ ] Tests motor T1–T23 en CI  
- [ ] Submit produce discard o score `motor_v1.1`  
- [ ] RLS: no auto-admin; no edit post-submit; no score a discarded  
- [ ] Pre-check + wizard + admin export  
- [ ] Sin AI key: flujo 100% OK  
- [ ] Textos legales mínimos en UI  
- [ ] README de operación para Transferencia  

---

## 6. Orden de build (sprints sugeridos)

| Sprint | Entrega |
|--------|---------|
| S0 | Repo app + catálogo TS + tests motor |
| S1 | Supabase schema + auth + submit function |
| S2 | Wizard + listas + pre-check |
| S3 | Resultados + IRL radar |
| S4 | Admin + export + audit override |
| S5 | Hero + legal UI + polish |
| S6 | Staging UAT + prod deploy |

---

## 7. Riesgos residuales (aceptados con mitigación)

| Riesgo | Mitigación v1 |
|--------|----------------|
| TI UR rechaza Supabase | Schema portable; plan Azure documentado |
| Gaming auto-reporte | Declaración de veracidad; override humano |
| Sin bases de convocatoria firmadas | Producto técnico listo; go-live legal = UR |
