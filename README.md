# Herramienta de Selección DeepTech — Universidad del Rosario

Proyecto ejecutable a partir del brief de contraparte: **prompt maestro + datos limpios + plan por etapas**.

> **Estado actual:** **GO para implementación técnica** tras auditoría multinacional (4 rondas).  
> Motor **`motor_v1.1`** + catálogo ejecutable + SQL seguridad 001–003.  
> Runtime: **Supabase + Vercel** (no backend en tu PC). IA informes: **opcional**.  
> **Veredicto:** `05_debate_validacion/GO_IMPLEMENTACION.md`  
> **Brief build:** `04_plan/PRODUCT_BRIEF_IMPLEMENTACION.md`  
> **Prompt cloud:** `06_produccion_supabase_vercel/PROMPT_IMPLEMENTACION_CLOUD.md`

---

## Mapa de carpetas

| Carpeta | Para qué | ¿Contexto IA? |
|---------|----------|---------------|
| **`01_datos_limpios/`** | JSON de postulación, score, IRL, proceso, diagramas | **SÍ — contexto principal** |
| **`02_recursos/`** | Logos UR + imágenes de referencia (biotech/robótica) | Solo assets visuales |
| **`03_prompts/`** | Prompt maestro para el agente constructor | Sí, al construir |
| **`04_plan/`** | Plan, listas, **backend/hosting**, **frontend UX**, modelo de datos | Sí, planificación |
| **`05_debate_validacion/`** | Conclusiones de revisión multiagente “¿listo para iniciar?” | Lectura humana |
| **`00_archivo_original/`** | Excel, PPT y zip de logos **originales** (respaldo) | **NO** (salvo auditoría) |
| **`06_produccion_supabase_vercel/`** | **Deploy real:** SQL, Edge Functions, env, prompt cloud | Sí al construir |
| **`scripts/`** | Utilidades (p. ej. regenerar JSON desde Excel) | No |

---

## Cómo usar este repo con una IA

1. **Contexto de negocio / motor de evaluación:**  
   Cargar `01_datos_limpios/herramienta_deeptech_rosario.json`  
   (o toda la carpeta `01_datos_limpios/`).

2. **Instrucciones de construcción:**  
   `03_prompts/PROMPT_MAESTRO.md`  
   **Prompt hero (el que pasaste, listo para pegar):** `03_prompts/PROMPT_FRONTEND_HERO.md`

3. **Plan y entregables:**  
   `04_plan/PLAN_EJECUCION.md`  
   **Explicación simple motor + backend:** `04_plan/EXPLICACION_SIMPLE_MOTOR_Y_BACKEND.md` ← si algo no se entiende  
   **Cómo funciona el backend (paso a paso):** `04_plan/COMO_FUNCIONA_BACKEND.md`  
   **IA e informes (OpenAI / DeepSeek / xAI):** `04_plan/PLAN_IA_INFORMES.md`  
   **Alcance profesional / expectativas:** `04_plan/CAPACIDAD_Y_ALCANCE_PROFESIONAL.md`  
   Listas: `04_plan/LISTAS_DESPLEGABLES.md`  
   Backend / hosting: `04_plan/ARQUITECTURA_BACKEND_Y_HOSTING.md`  
   Frontend UX: `04_plan/SPEC_FRONTEND_UX.md`  
   Modelo de datos: `04_plan/MODELO_DATOS_RESUMEN.md`

4. **Marca, imágenes y video:**  
   `02_recursos/logos/` + `02_recursos/imagenes_referencia/` + `02_recursos/hero/`  
   **Video ADN (tuyo, no generar):** `02_recursos/video/Video_genetic_editing_DNA_modified_202608022104.mp4`  
   Descripción de assets: `01_datos_limpios/imagenes_descripciones.json`

5. **No mezclar** con HUB iEX / IncubaLab 2.0 / El Bosque: solo reutilizar el *patrón* modular de arquitectura, no contenido, pesos ni variables.

---

## Fuente de verdad

| Tema | Fuente |
|------|--------|
| Variables, pesos, niveles de score, IRL | Excel original → ya extraído en `01_datos_limpios/` |
| Descarte, tipos de postulación, dimensiones condicionales | PPT original → ya modelado en `proceso_seleccion_deeptech.json` |
| En caso de contradicción | **Gana el Excel** (salvo indicación explícita del usuario) |
| Facultades y sectores | `04_plan/LISTAS_DESPLEGABLES.md` (curadas en el brief) |

---

## Producción (destino real)

| Capa | Plataforma |
|------|------------|
| Web | **Vercel** |
| Auth + DB + Storage + motor (Edge Functions) | **Supabase cloud** |
| Score / descarte / IRL | `motor_v1` — `04_plan/SPEC_MOTOR_EVALUACION.md` |
| Informes con IA | Solo si hay API key en secrets de Supabase |

Guía: `06_produccion_supabase_vercel/DEPLOY.md`  
Prompt para el agente constructor: `06_produccion_supabase_vercel/PROMPT_IMPLEMENTACION_CLOUD.md`

## Próximo hito (cuando digas “construir / desplegar”)

1. Crear proyectos Supabase + Vercel (o dar acceso).  
2. Ejecutar el prompt de implementación cloud (código + deploy remoto).  
3. Cuando quieran informes: pegar API OpenAI/DeepSeek/xAI en secrets (el scoring ya no depende de eso).
