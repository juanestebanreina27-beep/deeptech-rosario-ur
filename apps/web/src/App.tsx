import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { AuthLogin, AuthRegistro } from '@/pages/Auth'
import { Elegibilidad } from '@/pages/Elegibilidad'
import { Dashboard } from '@/pages/Dashboard'
import { Wizard } from '@/pages/Wizard'
import { Resultado } from '@/pages/Resultado'
import { Admin } from '@/pages/Admin'
import { Faq, Metodologia } from '@/pages/Static'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<AuthLogin />} />
        <Route path="/auth/registro" element={<AuthRegistro />} />
        <Route path="/elegibilidad" element={<Elegibilidad />} />
        <Route path="/metodologia" element={<Metodologia />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/:id" element={<Wizard />} />
        <Route path="/app/:id/resultado" element={<Resultado />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
