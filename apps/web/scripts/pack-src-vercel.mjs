import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'deploy-src.json')

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'scripts'])
const SKIP_FILES = new Set([
  'deploy-bundle.json',
  'deploy-mcp.cjs',
  'deploy-emit.mjs',
  'files-only.json',
  'payload-full.json',
  'deploy-final.json',
  'deploy-mcp.json',
  'deploy-payload.json',
  'deploy-small.json',
  'deploy-small-oneline.json',
  'deploy-src.json',
  'deploy-static.json',
  'deploy-static-bundle.json',
  '_vercel_files.json',
])
const SKIP_EXT = new Set(['.mp4', '.map'])
const files = []

function walk(dir, rel = '') {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.') && name !== '.env.example') continue
    const abs = path.join(dir, name)
    const r = rel ? `${rel}/${name}` : name
    const st = fs.statSync(abs)
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue
      walk(abs, r)
      continue
    }
    if (SKIP_FILES.has(name)) continue
    const ext = path.extname(name).toLowerCase()
    if (SKIP_EXT.has(ext)) continue
    if (st.size > 1.5 * 1024 * 1024) {
      console.warn('skip large', r, st.size)
      continue
    }
    const buf = fs.readFileSync(abs)
    const bin = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2'].includes(ext)
    files.push({
      file: r.replace(/\\/g, '/'),
      data: bin ? buf.toString('base64') : buf.toString('utf8'),
      encoding: bin ? 'base64' : 'utf-8',
    })
  }
}

walk(root)

const vercelJson = {
  framework: 'vite',
  buildCommand:
    'mkdir -p public/assets && curl -fsSL -o public/assets/dna-hero.mp4 https://juanestebanreina27-beep.github.io/deeptech-rosario-ur/assets/dna-hero.mp4 && VITE_BASE=/ npm run build',
  outputDirectory: 'dist',
  rewrites: [{ source: '/((?!assets/).*)', destination: '/index.html' }],
  headers: [
    {
      source: '/assets/(.*)\\.(js|css)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/assets/(.*)\\.(png|jpg|jpeg|webp|mp4|svg)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
    },
  ],
}

const entry = {
  file: 'vercel.json',
  data: JSON.stringify(vercelJson, null, 2),
  encoding: 'utf-8',
}
const idx = files.findIndex((f) => f.file === 'vercel.json')
if (idx >= 0) files[idx] = entry
else files.push(entry)

fs.writeFileSync(out, JSON.stringify(files))
console.log(`Wrote ${files.length} files → ${out}`)
console.log(`Size: ${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB`)
