# DeepTech Rosario — Web App

React 18 + TypeScript + Vite + Tailwind.

## URLs

- **Live (GitHub Pages):** https://juanestebanreina27-beep.github.io/deeptech-rosario-ur/
- **Repo:** https://github.com/juanestebanreina27-beep/deeptech-rosario-ur

## Desarrollo

```bash
cd apps/web
npm install
npm test      # motor_v1.1
npm run dev   # http://localhost:5173 — usa VITE_BASE=/ en .env.local si hace falta
npm run build
```

## Variables

Ver `.env.example`. Sin Supabase la app usa **modo demo** (localStorage + motor en el cliente).

Para Vercel root domain:

```
VITE_BASE=/
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Root Directory en Vercel: `apps/web`.

## Flujo demo

1. Inscribirse  
2. Nueva postulación  
3. Completar wizard (seleccionar niveles)  
4. Enviar → descarte o score + IRL  
5. Email con `admin` → panel `/admin`
