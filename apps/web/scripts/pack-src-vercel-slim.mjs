/**
 * Slim pack: text sources only. Assets downloaded at Vercel build from GH Pages.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'deploy-src-slim.json')
const CDN = 'https://juanestebanreina27-beep.github.io/deeptech-rosario-ur/assets'

const INCLUDE_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.html',
  '.svg',
  '.md',
  '.example',
])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'scripts'])
const SKIP_NAMES = new Set([
  'deploy-src.json',
  'deploy-src-slim.json',
  'deploy-static-bundle.json',
  'deploy-bundle.json',
  'files-only.json',
  'payload-full.json',
  'final-deploy.json',
  'deploy-final.json',
  'deploy-mcp.json',
  'deploy-payload.json',
  'deploy-small.json',
  'deploy-small-oneline.json',
  'deploy-static.json',
  '_vercel_files.json',
  'deploy-mcp.cjs',
  'deploy-emit.mjs',
])

const files = []

function walk(dir, rel = '') {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.') && name !== '.env.example' && name !== '.oxlintrc.json') continue
    if (SKIP_NAMES.has(name)) continue
    const abs = path.join(dir, name)
    const r = rel ? `${rel}/${name}` : name
    const st = fs.statSync(abs)
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue
      walk(abs, r)
      continue
    }
    const ext = path.extname(name).toLowerCase()
    if (!INCLUDE_EXT.has(ext) && name !== '.env.example' && name !== '.oxlintrc.json') continue
    // skip huge junk json
    if (st.size > 500_000) {
      console.warn('skip large', r, st.size)
      continue
    }
    files.push({
      file: r.replace(/\\/g, '/'),
      data: fs.readFileSync(abs, 'utf8'),
      encoding: 'utf-8',
    })
  }
}

walk(root)

const assetList = [
  'bg-base.jpg',
  'bg-reveal.jpg',
  'dna-hero.mp4',
  'logo-ur-white.png',
  'logo-ur-red.png',
  'logo-ur-black.png',
  'logo-ur-men-white.png',
  'logo-ur-men-red.jpg',
  'logo-ur-vertical-white.png',
]

const downloadCmds = assetList
  .map((a) => `curl -fsSL -o public/assets/${a} ${CDN}/${a}`)
  .join(' && ')

const vercelJson = {
  framework: 'vite',
  installCommand: 'npm ci',
  buildCommand: `mkdir -p public/assets && ${downloadCmds} && VITE_BASE=/ npm run build`,
  outputDirectory: 'dist',
  rewrites: [{ source: '/((?!assets/).*)', destination: '/index.html' }],
}

const entry = {
  file: 'vercel.json',
  data: JSON.stringify(vercelJson, null, 2),
  encoding: 'utf-8',
}
const idx = files.findIndex((f) => f.file === 'vercel.json')
if (idx >= 0) files[idx] = entry
else files.push(entry)

// ensure public/favicon exists as text svg is included via walk if under public
fs.writeFileSync(out, JSON.stringify(files))
console.log(`Wrote ${files.length} files → ${out}`)
console.log(`Size: ${(fs.statSync(out).size / 1024).toFixed(1)} KB`)
files.forEach((f) => console.log(' -', f.file))
