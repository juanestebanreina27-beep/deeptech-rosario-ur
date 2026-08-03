import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { asset } from '@/lib/assets'

const SPOTLIGHT_R = 260
const BG1 = asset('assets/bg-base.jpg')
const BG2_POSTER = asset('assets/bg-reveal.jpg')
const DNA_VIDEO = asset('assets/dna-hero.mp4')

function spotlightMask(x: number, y: number, radius: number) {
  return `radial-gradient(circle ${radius}px at ${x}px ${y}px,
    rgba(255,255,255,1) 0%,
    rgba(255,255,255,1) 40%,
    rgba(255,255,255,0.75) 60%,
    rgba(255,255,255,0.4) 75%,
    rgba(255,255,255,0.12) 88%,
    rgba(255,255,255,0) 100%)`
}

function RevealLayer({
  cursorX,
  cursorY,
  radius,
  useVideo,
}: {
  cursorX: number
  cursorY: number
  radius: number
  useVideo: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const mask = spotlightMask(cursorX, cursorY, radius)
  const showVideo = useVideo && !videoFailed

  useEffect(() => {
    const v = videoRef.current
    if (!v || !showVideo) return
    v.muted = true
    v.playsInline = true
    const play = () => {
      void v.play().catch(() => {})
    }
    if (v.readyState >= 2) play()
    else v.addEventListener('canplay', play, { once: true })
    return () => v.removeEventListener('canplay', play)
  }, [showVideo])

  const layerStyle: CSSProperties = {
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  }

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle ${radius * 1.05}px at ${cursorX}px ${cursorY}px,
            rgba(200,16,46,0.2) 0%,
            rgba(200,16,46,0.08) 45%,
            transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{
          ...layerStyle,
          backgroundImage: `url(${BG2_POSTER})`,
          opacity: showVideo && videoReady ? 0 : 1,
          transition: 'opacity 0.6s ease',
        }}
      />
      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            ...layerStyle,
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
          src={DNA_VIDEO}
          poster={BG2_POSTER}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
        />
      )}
    </div>
  )
}

export function HeroSpotlight() {
  const mouse = useRef({ x: -999, y: -999 })
  const smooth = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.42 : 0,
  })
  const rafRef = useRef(0)
  const [cursorPos, setCursorPos] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.42 : 0,
  }))
  const [isTouch, setIsTouch] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [radius, setRadius] = useState(SPOTLIGHT_R)

  useEffect(() => {
    const touch = window.matchMedia('(pointer: coarse)').matches
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setIsTouch(touch)
    setReduceMotion(motion)

    const cx = window.innerWidth / 2
    const cy = window.innerHeight * 0.42
    mouse.current = { x: cx, y: cy }
    smooth.current = { x: cx, y: cy }
    setCursorPos({ x: cx, y: cy })
    setRadius(touch ? Math.min(window.innerWidth * 0.38, 240) : SPOTLIGHT_R)

    if (touch) {
      if (motion) return
      let t = 0
      const loop = () => {
        t += 0.008
        setCursorPos({ x: cx + Math.sin(t) * 28, y: cy + Math.cos(t * 0.7) * 18 })
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(rafRef.current)
    }

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
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

  return (
    <section className="relative w-full overflow-hidden h-screen bg-black" style={{ height: '100dvh' }}>
      <div
        className={`absolute inset-0 bg-center bg-cover bg-no-repeat z-10 ${reduceMotion ? '' : 'hero-zoom'}`}
        style={{ backgroundImage: `url(${BG1})` }}
      />
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/60 via-black/42 to-black/70 pointer-events-none" />

      <RevealLayer cursorX={cursorPos.x} cursorY={cursorPos.y} radius={radius} useVideo={!reduceMotion} />

      {!isTouch && (
        <p
          className="absolute bottom-[40%] left-0 right-0 z-40 text-center text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-white/35 pointer-events-none hero-anim hero-fade"
          style={{ animationDelay: '1.25s' }}
        >
          Mueve el cursor para revelar el ADN
        </p>
      )}

      <div className="absolute top-[12%] sm:top-[13%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
        {/* Sello institucional */}
        <div
          className="hero-anim hero-fade flex flex-col items-center gap-2.5 mb-5 sm:mb-6"
          style={{ animationDelay: '0.08s' }}
        >
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
            Universidad del Rosario
          </p>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 sm:w-12 bg-[#C8102E]/80" aria-hidden />
            <span className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-white/55 font-medium">
              Transferencia tecnológica · DeepTech
            </span>
            <span className="h-px w-8 sm:w-12 bg-[#C8102E]/80" aria-hidden />
          </div>
        </div>

        <h1 className="text-white leading-[0.95] max-w-4xl">
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

      <div
        className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[290px] z-50 hero-anim hero-fade"
        style={{ animationDelay: '0.7s' }}
      >
        <div className="h-0.5 w-10 bg-[#C8102E] mb-3" aria-hidden />
        <p className="text-sm text-white/80 leading-relaxed">
          Cada postulación es un resultado de investigación con potencial de transferencia. Evaluamos equipo, modelo de
          negocio y madurez tecnológica con rigor y trazabilidad.
        </p>
      </div>

      <div
        className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[290px] flex flex-col items-start gap-4 z-50 hero-anim hero-fade"
        style={{ animationDelay: '0.85s' }}
      >
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
          Inscríbete, completa tu postulación y obtén un diagnóstico de madurez (KTH IRL) y un score DeepTech ponderado.
          El puntaje no lo inventa la IA.
        </p>
        <Link
          to="/auth/registro"
          className="bg-[#C8102E] hover:bg-[#9a0c24] text-white text-sm font-semibold px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#C8102E]/35"
        >
          Comenzar postulación
        </Link>
        <Link to="/elegibilidad" className="text-white/70 text-sm underline underline-offset-4 hover:text-white">
          Ver si aplico
        </Link>
      </div>
    </section>
  )
}
