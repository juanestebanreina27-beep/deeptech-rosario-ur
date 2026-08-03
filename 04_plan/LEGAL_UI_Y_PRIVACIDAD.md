# Legal y privacidad en UI (mínimo v1)

> Textos **placeholder** para implementación. Deben validarse con Oficina de Protección de Datos / Jurídica UR antes de datos reales.

---

## 1. Checkbox de registro / primer submit (obligatorio)

```text
[ ] Autorizo el tratamiento de mis datos personales por la Universidad del Rosario
    para la postulación, evaluación y gestión del programa DeepTech Rosario
    (selección y diagnóstico de transferencia tecnológica), conforme a la
    Política de Privacidad y la Ley 1581 de 2012.

    He leído la [Política de Privacidad].
```

Persistir: `consent_at = now()`, `privacy_version = 'ur-deeptech-v1'`.

---

## 2. Disclaimer de IA (si el feature está visible)

```text
El puntaje y los filtros de elegibilidad se calculan con reglas del programa
(motor determinista), no por inteligencia artificial.

Si genera un informe asistido por IA, parte de las respuestas de texto de
negocio puede enviarse a un proveedor tecnológico solo para redactar el
diagnóstico. No se envían cédula, teléfono ni correo al modelo.
El informe no sustituye la decisión humana del programa.
```

Si no hay API key: no mostrar promesa de informe; o mostrar “Informes IA no habilitados en esta convocatoria”.

---

## 3. Descarte

```text
Tu postulación no cumple uno o más criterios de elegibilidad de la convocatoria.
Motivos: [lista legible].
Esto no es una evaluación de calidad completa; puedes revisar los criterios
y postular en una próxima convocatoria si tu situación cambia.
```

No mostrar score de ranking al descartado.

---

## 4. Declaración de veracidad (pre-submit)

```text
[ ] Declaro que la información suministrada es veraz y completa, incluyendo
    años de operación comercial, vínculo con la Universidad y nivel de prototipo.
```

---

## 5. Footer mínimo

- Universidad del Rosario  
- Contacto de Transferencia (placeholder)  
- Política de Privacidad · Términos de uso  
- “© {year} Universidad del Rosario”  

---

## 6. Campos que NUNCA van al LLM

`document_id`, `phone`, `email`, cédula, celular, correo, URLs firmadas de storage, tokens.

Lista canónica: `rules_catalog_motor_v1.json` → `never_send_to_llm`.
