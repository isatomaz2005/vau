import { Suspense, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Anunciador, Toasts } from '../lib/anunciar.jsx';
import { Logo } from './Basicos';

export function Layout({ carregando }) {
  const { pathname } = useLocation();
  const principal = useRef(null);

  // Ao trocar de página, o foco vai para o conteúdo novo (o leitor de tela sabe que mudou).
  useEffect(() => {
    principal.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="topo">
        <Link to="/" className="topo-logo" aria-label="Vau, página inicial">
          <Logo />
        </Link>
        <nav aria-label="Principal">
          <ul className="nav">
            <li><NavLink to="/" end>Início</NavLink></li>
            <li><NavLink to="/bairro">Meu bairro</NavLink></li>
            <li><NavLink to="/painel">Painel da liderança</NavLink></li>
          </ul>
        </nav>
      </header>
      {/* A chave faz a página nova entrar com fade: orienta que o conteúdo mudou. */}
      <main id="conteudo" ref={principal} tabIndex={-1} key={pathname.split('/')[1]} className="pagina">
        <Suspense fallback={carregando}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="rodape">
        <p>
          Vau - projeto acadêmico Global Solution FIAP (CitizenTech). Dados de demonstração. Em emergência, ligue{' '}
          <a href="tel:199">199 (Defesa Civil)</a> ou <a href="tel:193">193 (Bombeiros)</a>.
        </p>
      </footer>
      <Anunciador />
      <Toasts />
    </>
  );
}
