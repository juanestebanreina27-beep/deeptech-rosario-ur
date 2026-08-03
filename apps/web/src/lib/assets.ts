/** Resolve public assets under Vite `base` (GitHub Pages or root Vercel). */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const clean = path.replace(/^\//, '')
  return `${base}${clean}`
}

export const logos = {
  white: () => asset('assets/logo-ur-white.png'),
  red: () => asset('assets/logo-ur-red.png'),
  black: () => asset('assets/logo-ur-black.png'),
  menWhite: () => asset('assets/logo-ur-men-white.png'),
  menRed: () => asset('assets/logo-ur-men-red.jpg'),
  verticalWhite: () => asset('assets/logo-ur-vertical-white.png'),
} as const
