# Prompt de implementación — producto real en Supabase + Vercel

> Pegar a un agente de código cuando se autorice **construir y desplegar**.  
> **No** montar backend en localhost como destino de entrega.  
> **No** depender de la API de IA para el flujo principal.  
> **Post-auditoría multinacional:** cumplir `motor_v1.1`, SQL 001+002+003, y `DECISIONES_CERRADAS_V1_1.md`.

---

## ROL

Eres el equipo full-stack que construye y deja **desplegado en producción** (o listo para un clic de deploy) la **Herramienta de Selección DeepTech — Universidad del Rosario**.

## DESTINO DE RUNTIME (obligatorio)

| Pieza | Plataforma |
|-------|------------|
| Frontend | **Vercel** |
| Auth + Postgres + Storage + Edge Functions | **Supabase cloud** |
| Motor | TypeScript en Edge Function `submit-application` según `motor_v1` |
| Informes LLM | Opcional: `generate-report` solo si hay secret de API |

**Prohibido como arquitectura de entrega:**

- Backend Express/Nest corriendo solo en el PC del usuario  
- Postgres instalado en local como “producción”  
- API keys de IA en el frontend  

Previews de Vercel + proyecto Supabase remoto = entorno de trabajo válido.

## FUENTES DE VERDAD EN EL REPO

1. `05_debate_validacion/DECISIONES_CERRADAS_V1_1.md` + `GO_IMPLEMENTACION.md`  
2. `04_plan/PRODUCT_BRIEF_IMPLEMENTACION.md`  
3. `01_datos_limpios/rules_catalog_motor_v1.json` — **única fuente de niveles/pesos en código**  
4. `04_plan/SPEC_MOTOR_EVALUACION.md` — motor_v1.1  
5. Migrations `001_init.sql` + `002_security_hardening.sql` + `003_storage_policies.sql`  
6. `supabase/functions/CONTRACT.md`  
7. `03_prompts/PROMPT_FRONTEND_HERO.md` + `04_plan/SPEC_FRONTEND_UX.md` + `04_plan/LEGAL_UI_Y_PRIVACIDAD.md`  
8. `04_plan/PLAN_IA_INFORMES.md` — solo si hay API key  
9. Listas: `listas_desplegables.json`  
10. Naming UI: **DeepTech Rosario**

## QUÉ CONSTRUIR

### A. App web (Vercel)

- React 18 + TypeScript + Vite + Tailwind + lucide-react (+ react-router).  
- Supabase JS client solo con **anon key**.  
- Pantallas: landing hero, auth, wizard postulación, resultado (descarte/score/IRL), admin básico.  
- Hero: mecánica del prompt frontend; assets locales + video ADN en `02_recursos/`.  
- CTA rojo UR `#C8102E`. Logo UR blanco en nav.

### B. Backend (solo Supabase)

1. Aplicar `001_init.sql` al proyecto remoto.  
2. Edge Function `submit-application`:  
   - validación → discard → score → status  
   - **sin** llamar al LLM  
3. Edge Function `generate-report`:  
   - si no hay key → `skipped`  
   - si hay key → informe JSON/MD  
4. Storage bucket privado `application-files`.

### C. Motor `motor_v1.1` (obligatorio, sin IA)

Implementar desde `rules_catalog_motor_v1.json`:

- Descarte D01–D04 (tabla verdad D04)  
- Score: norm × peso; grado_innovacion obligatorio si innovacion≥3; total = promedio 3 bloques  
- Grupo investigación: A1=5 … C=2 (rúbrica corregida)  
- IRL condicional + rangos por dim  
- **Ignorar score_points del cliente**  
- `rules_version: "motor_v1.1"`  
- Tests T1–T23 (SPEC + legal audit)  
- Service role only para escribir discard/score

### D. Deploy

1. Documentar en `apps/web/README.md` (o raíz) cómo conectar Vercel + Supabase.  
2. Dejar el código de forma que con secrets reales un deploy de Vercel quede online.  
3. Si el usuario da `SUPABASE_ACCESS_TOKEN` / link del proyecto y Vercel, ejecutar deploy remoto.  
4. **No** dejar el producto “solo corre en mi máquina”.

## IA DE INFORMES (único opcional)

- El producto **funciona al 100%** sin OpenAI/DeepSeek/xAI.  
- UI: botón “Generar informe” deshabilitado o mensaje claro si `status=skipped`.  
- Cuando el usuario configure la key en Supabase secrets, el mismo botón funciona sin redesplegar lógica de score.

## RESTRICCIONES

- No inventar pesos ni reglas fuera de la SPEC.  
- No mezclar HUB iEX / El Bosque.  
- Excel histórico en `00_archivo_original` solo auditoría.  
- Español Colombia en UI.

## DEFINICIÓN DE HECHO (DoD)

- [ ] Schema aplicado en Supabase remoto  
- [ ] Web en Vercel con auth real  
- [ ] Submit produce discard o score trazable  
- [ ] IRL por tipo correcto  
- [ ] Sin AI key: flujo completo OK  
- [ ] Con AI key (si se prueba): informe se genera  
- [ ] RLS: no se ven postulaciones ajenas  
- [ ] README de operación para la UR  

## ORDEN DE TRABAJO DEL AGENTE

1. Scaffold monorepo / `apps/web`  
2. Portar motor a TS + tests T1–T8  
3. Edge functions  
4. UI wizard + resultado  
5. Hero  
6. Wire Vercel env example  
7. Instrucciones finales de un solo párrafo: “crea proyecto Supabase, corre SQL, conecta Vercel, listo”
