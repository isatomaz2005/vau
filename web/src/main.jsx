import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './estilos.css'
import { Layout } from './componentes/Layout.jsx'
import { Inicio } from './paginas/Inicio.jsx'
import { Entrar } from './paginas/Entrar.jsx'

// Bairro e Painel carregam o mapa (Leaflet): só baixa quando a pessoa abre essas páginas.
const Bairro = lazy(() => import('./paginas/Bairro.jsx').then((m) => ({ default: m.Bairro })))
const Painel = lazy(() => import('./paginas/Painel.jsx').then((m) => ({ default: m.Painel })))

function Carregando() {
  return <div className="container"><p role="status">Carregando…</p></div>
}

function NaoEncontrada() {
  return (
    <div className="container estreito">
      <h1>Página não encontrada</h1>
      <p>
        <a href="/">Voltar para o início</a>
      </p>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout carregando={<Carregando />} />}>
          <Route index element={<Inicio />} />
          <Route path="bairro" element={<Bairro />} />
          <Route path="bairro/:slug" element={<Bairro />} />
          <Route path="entrar" element={<Entrar />} />
          <Route path="painel" element={<Painel />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
