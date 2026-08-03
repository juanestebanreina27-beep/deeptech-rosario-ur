# Plan de ejecución por etapas — DeepTech U. Rosario

Derivado del brief de planeación + estado real del repo tras extracción Excel/PPT.

---

## Estado de insumos (Fase 0)

| Insumo | Estado | Ubicación |
|--------|--------|-----------|
| Excel (preguntas + KTH IRL + Score) | ✅ Disponible y **extraído a JSON** | `00_archivo_original/excel/` → `01_datos_limpios/` |
| PowerPoint (imágenes, descarte, dimensiones condicionales) | ✅ Disponible y **modelado** | `00_archivo_original/powerpoint/` → proceso + recursos |
| Logo Universidad del Rosario | ✅ Disponible | `02_recursos/logos/` |
| Prompt maestro | ✅ Escrito | `03_prompts/PROMPT_MAESTRO.md` |
| Listas facultades / sectores | ✅ Curadas en brief | `04_plan/LISTAS_DESPLEGABLES.md` |

**Fase 0: completada.** Ya no es bloqueante.

---

## Hipótesis del brief vs. datos confirmados

| Tema | Brief (hipótesis) | Confirmado en PPT/Excel |
|------|-------------------|-------------------------|
| Salud suma 1 dimensión | Regulatoria/clínica | ✅ **RRL** (Regulatory Readiness) |
| Adopción resta 1 dimensión | ¿IPRL? | ❌ No: se resta **TRL** (adaptación no mide TRL propio de I+D) |
| Equipo en IRL | TMRL (nomenclatura KTH clásica) | Excel usa **TERL** (Team Building Readiness) |
| Pesos | Vector único o por dimensión | **3 bloques** con pesos internos que suman 1.0 cada uno; combinación entre bloques **no definida** |

Estas confirmaciones deben usarse en Fase 2 (motor). No volver a tratar RRL/TRL como hipótesis abiertas.

---

## Fases

| Fase | Objetivo | Entregables | Duración est. | Depende de | Estado |
|------|----------|-------------|---------------|------------|--------|
| **0** | Recolección y organización de insumos | Archivos en repo + `01_datos_limpios/` | Hecho | — | ✅ Hecho |
| **1** | Auditoría fina del diccionario limpio | Checklist variable-a-variable; gaps documentados; opcional: re-extracción si se encuentra error | 0.5–1 día | Fase 0 | ⏳ Pendiente |
| **2** | Diseño del motor de evaluación | Spec: fórmula, descarte, IRL condicional, política de opcionales, combinación de bloques | 1 día | Fase 1 | ⏳ Pendiente |
| **3** | Listas desplegables | Facultades + sectores listos | Hecho en brief | — | ✅ Hecho |
| **4** | Sistema visual + UX | Tokens, hero spotlight (ADN), wizard; ver `SPEC_FRONTEND_UX.md` | 0.5–1 día | Fase 0 | ⏳ Spec lista; assets hero pendientes |
| **4b** | Backend / hosting | Modelo de datos, API, auth, dónde aloja la UR; ver `ARQUITECTURA_BACKEND_Y_HOSTING.md` | 0.5–1 día decisión con TI | Fase 0 | ⏳ Propuesta lista; falta OK UR |
| **5** | Desarrollo técnico | Front (React) + API + BD + storage + motor; deploy MVP | varios días | Fases 1–4b | 🚫 No iniciar hasta OK |
| **6** | QA con casos reales | Casos de prueba + checklist | 1 día | Fase 5 | 🚫 |
| **7** | Entrega y handoff | Paquete + guía de uso | 1 día | Fase 6 | 🚫 |

---

## Criterios de “listo para iniciar Fase 5 (desarrollo)”

- [x] Excel, PPT y logo en el repo  
- [x] Datos limpios en JSON consumible por IA  
- [x] Prompt maestro escrito  
- [x] Descarte y dimensiones condicionales **confirmados** (no solo hipótesis)  
- [x] Listas facultades/sectores  
- [x] Spec del motor firmada: `SPEC_MOTOR_EVALUACION.md` (`motor_v1`)  
- [x] Stack UI: React+Vite+Tailwind (`SPEC_FRONTEND_UX` + `PROMPT_FRONTEND_HERO`)  
- [x] Hosting producto: **Supabase + Vercel** (no localhost) — `06_produccion_supabase_vercel/`  
- [x] IA informes: opcional / API TBD  
- [ ] OK de privacidad / dominio custom UR (operativo)  
- [ ] Usuario da la orden explícita de **construir y desplegar**  
- [ ] Proyectos Supabase + Vercel creados y SQL aplicado

---

## Documentos de arquitectura ya redactados (no son código)

| Doc | Contenido |
|-----|-----------|
| `ARQUITECTURA_BACKEND_Y_HOSTING.md` | Dónde se guarda todo, quién se inscribe, Azure vs Supabase, API, seguridad |
| `MODELO_DATOS_RESUMEN.md` | Entidades y ciclo de vida de la postulación |
| `SPEC_FRONTEND_UX.md` | Hero tipo Lithos adaptado a ADN/DeepTech UR + mapa de pantallas |
| `SPEC_FRONTEND_UX.md` + `02_recursos/hero/` | Assets del spotlight (ADN reveal) |
| `COMO_FUNCIONA_BACKEND.md` | Guion operativo del backend |
| `PLAN_IA_INFORMES.md` | Informes con LLM (OpenAI/DeepSeek/xAI), keys solo servidor |
| `CAPACIDAD_Y_ALCANCE_PROFESIONAL.md` | Expectativas de calidad y niveles MVP |

## Orden recomendado al retomar

1. Revisar `05_debate_validacion/VALIDACION_LISTO_PARA_INICIAR.md`.  
2. Cerrar Fase 1 (auditoría JSON vs Excel + mapeo score↔postulación).  
3. Escribir `SPEC_MOTOR_EVALUACION.md` (Fase 2).  
4. Validar con UR: hosting + SSO + privacidad (checklist en arquitectura backend).  
5. Fase 4: aprobar copy/hero y exportar WebP a `02_recursos/hero/`.  
6. Solo entonces: ejecutar `03_prompts/PROMPT_MAESTRO.md` + specs front/back para construir.

---

## Fuera de alcance por ahora

- Implementar formulario o backend.  
- Reutilizar variables de HUB iEX / El Bosque.  
- Inventar pesos de combinación entre bloques sin documentar la decisión.
