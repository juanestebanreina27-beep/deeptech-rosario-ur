import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const SPOTLIGHT_R = 260
const BG1 = '/assets/bg-base.jpg'
const BG2 = '/assets/bg-reveal.jpg'

function RevealLayer({ image, cursorX, cursorY, radius }: { image: string; cursorX: number; cursorY: number; radius: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mask, setMask] = useState<string>('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    const g = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, radius)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,1)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.75)')
    g.addColorStop(0.75, 'rgba(255,255,255,0.4)')
    g.addColorStop(0.88, 'rgba(255,255,255,0.12)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cursorX, cursorY, radius, 0, Math.PI * 2)
    ctx.fill()
    setMask(canvas.toDataURL())
  }, [cursorX, cursorY, radius])

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ display: 'none' }} />
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{
          backgroundImage: `url(${image})`,
          WebkitMaskImage: mask ? `url(${mask})` : undefined,
          maskImage: mask ? `url(${mask})` : undefined,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
        }}
      />
    </>
  )
}

export function HeroSpotlight() {
  const mouse = useRef({ x: -999, y: -999 })
  const smooth = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 })
  const rafRef = useRef(0)
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const touch = window.matchMedia('(pointer: coarse)').matches
    setIsTouch(touch)
    if (touch) {
      setCursorPos({ x: window.innerWidth / 2, y: window.innerHeight * 0.45 })
      return
    }
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove)
    const loop = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1
      setCursorPos({ x: smooth.current.x, y: smooth.current.y })
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const r = isTouch ? Math.min(window.innerWidth * 0.35, 220) : SPOTLIGHT_R

  return (
    <section className="relative w-full overflow-hidden h-screen bg-black" style={{ height: '100dvh' }}>
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
        style={{ backgroundImage: `url(${BG1})` }}
      />
      <div className="absolute inset-0 z-20 bg-black/45 pointer-events-none" />
      <RevealLayer image={BG2} cursorX={cursorPos.x} cursorY={cursorPos.y} radius={r} />

      <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
        <p className="text-white/70 text-xs sm:text-sm tracking-wide mb-4 hero-anim hero-fade" style={{ animationDelay: '0.1s' }}>
          Convocatoria · Transferencia tecnológica · Universidad del Rosario
        </p>
        <h1 className="text-white leading-[0.95]">
          <span
            className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
            style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}
          >
            La ciencia
          </span>
          <span
            className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
            style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}
          >
            se convierte en empresa
          </span>
        </h1>
      </div>

      <div className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[280px] z-50 hero-anim hero-fade" style={{ animationDelay: '0.7s' }}>
        <p className="text-sm text-white/80 leading-relaxed">
          Cada postulación es un resultado de investigación con potencial de transferencia. Evaluamos equipo, modelo de negocio y madurez tecnológica con rigor y trazabilidad.
        </p>
      </div>

      <div className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[280px] flex flex-col items-start gap-4 z-50 hero-anim hero-fade" style={{ animationDelay: '0.85s' }}>
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
          Inscríbete, completa tu postulación y obtén un diagnóstico de madurez (KTH IRL) y un score DeepTech ponderado. El puntaje no lo inventa la IA.
        </p>
        <Link
          to="/auth/registro"
          className="bg-[#C8102E] hover:bg-[#9a0c24] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#C8102E]/30"
        >
          Comenzar postulación
        </Link>
        <Link to="/elegibilidad" className="text-white/70 text-sm underline underline-offset-4">
          Ver si aplico
        </Link>
      </div>
    </section>
  )
}
