import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bairroPorSlug, bairros, tempoRelativo } from '../../../shared/bairros';
import { niveis, ordemNiveis } from '../../../shared/tokens';
import { aplicarEvento, buscarAvisos, buscarRelatos, escutar } from '../lib/api';
import { supabaseConfigurado } from '../lib/supabase';
import { anunciar, toast } from '../lib/anunciar.jsx';
import { AvisoCaixa, BlocoPonto, GraficoHoras, NivelIcone, NivelSelo, piorNivel } from '../componentes/Basicos';
import { Mapa } from '../componentes/Mapa';

const ATIVO = (r) => r.status === 'novo' || r.status === 'confirmado';

// Página pública do bairro: sem login, para mandar por WhatsApp a quem não tem o app.
export function Bairro() {
  const { slug } = useParams();
  const navegar = useNavigate();
  const bairro = bairroPorSlug(slug);
  const [relatos, setRelatos] = useState([]); // todos os bairros (para "Outros bairros")
  const [avisos, setAvisos] = useState([]);
  const [atualizado, setAtualizado] = useState(null);
  const [recentes, setRecentes] = useState(new Set());
  const [erro, setErro] = useState(null);
  const [, forcar] = useState(0);

  useEffect(() => {
    if (!bairro || !supabaseConfigurado) return;
    document.title = `Alagamentos em ${bairro.nome} - Vau`;
    const desde = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    Promise.all([buscarRelatos({ desde }), buscarAvisos({ bairro: slug })])
      .then(([r, a]) => {
        setRelatos(r);
        setAvisos(a);
        setAtualizado(new Date().toISOString());
      })
      .catch(() => setErro('Não foi possível carregar agora. Tente de novo em instantes.'));

    const parar = escutar({
      onRelato: (p) => {
        setRelatos((l) => aplicarEvento(l, p));
        const r = p.new || p.old;
        if (r?.bairro !== slug) return;
        setAtualizado(new Date().toISOString());
        if (p.eventType === 'INSERT') {
          anunciar(`Novo relato: ${niveis[r.nivel].rotulo} em ${r.referencia || bairro.nome}`);
          setRecentes((s) => new Set(s).add(r.id));
        }
      },
      onAviso: (p) => {
        if ((p.new || p.old)?.bairro !== slug) return;
        setAvisos((l) => aplicarEvento(l, p).filter((a) => a.ativo));
        setAtualizado(new Date().toISOString());
        if (p.eventType === 'INSERT') anunciar(`Novo aviso para ${bairro.nome}: ${p.new.mensagem}`);
      },
    });
    const relogio = setInterval(() => forcar((x) => x + 1), 30000);
    return () => {
      parar();
      clearInterval(relogio);
    };
  }, [slug]);

  const doBairro = useMemo(() => relatos.filter((r) => r.bairro === slug), [relatos, slug]);
  const ativos = useMemo(() => doBairro.filter(ATIVO), [doBairro]);
  const outros = useMemo(
    () =>
      bairros
        .filter((b) => b.slug !== slug)
        .map((b) => {
          const lista = relatos.filter((r) => r.bairro === b.slug && ATIVO(r));
          return { b, total: lista.length, pior: piorNivel(lista) };
        })
        .sort((a, b) => b.total - a.total),
    [relatos, slug]
  );

  if (!bairro) {
    return (
      <div className="container estreito">
        <h1>Escolha o bairro</h1>
        <p className="suave">Veja os alagamentos relatados agora e os avisos da liderança.</p>
        <label className="campo">
          <span>Bairro</span>
          <select defaultValue="" onChange={(e) => e.target.value && navegar(`/bairro/${e.target.value}`)}>
            <option value="" disabled>Selecione…</option>
            {bairros.map((b) => (
              <option key={b.slug} value={b.slug}>{b.nome} ({b.zona})</option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  const pior = piorNivel(ativos);
  const porNivel = Object.fromEntries(ordemNiveis.map((n) => [n, ativos.filter((r) => r.nivel === n).length]));
  const confirmados = ativos.filter((r) => r.status === 'confirmado').length;
  const ultimo = ativos[0];

  async function compartilhar() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `Alagamentos agora em ${bairro.nome}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copiado. É só colar no WhatsApp.', 'sucesso');
      }
    } catch {
      /* cancelado */
    }
  }

  return (
    <div className="container largo">
      <div className="barra-pagina">
        <label className="local">
          <span className="sr-only">Trocar de bairro</span>
          <span aria-hidden="true" className="local-pino">⌖</span>
          <select value={slug} onChange={(e) => navegar(`/bairro/${e.target.value}`)}>
            {bairros.map((b) => (
              <option key={b.slug} value={b.slug}>{b.nome}, {b.zona}</option>
            ))}
          </select>
        </label>
        <p className="atualizado">
          <span className="ao-vivo" aria-hidden="true" /> Ao vivo{atualizado ? ` - última mudança ${tempoRelativo(atualizado)}` : ''}
        </p>
        <button className="botao botao-contorno" onClick={compartilhar}>Compartilhar link</button>
      </div>

      {erro || !supabaseConfigurado ? (
        <p className="erro" role="alert">{erro || 'A plataforma ainda não está ligada ao banco de dados (veja o README).'}</p>
      ) : null}

      {avisos.map((a) => <AvisoCaixa key={a.id} aviso={a} />)}

      <div className="painel-bairro">
        {/* Card de destaque: o "número do dia" do bairro */}
        <section className="destaque" aria-labelledby="titulo-destaque">
          <div className="destaque-topo">
            <h1 id="titulo-destaque" className="destaque-titulo">{bairro.nome}</h1>
            <span className="destaque-hora">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="destaque-meio">
            <p className="destaque-numero">
              {ativos.length}
              <span>{ativos.length === 1 ? 'ponto alagado agora' : 'pontos alagados agora'}</span>
            </p>
            {pior ? <NivelIcone nivel={pior} tamanho={88} /> : <span className="destaque-livre" aria-hidden="true">✓</span>}
          </div>
          <p className="destaque-resumo">
            {pior ? <>Pior trecho: <strong>{niveis[pior].rotulo}</strong></> : 'Caminhos livres no bairro'}
          </p>
          <dl className="destaque-dados">
            {ordemNiveis.slice().reverse().map((n) => (
              <div key={n}><dt>{niveis[n].rotulo}</dt><dd>{porNivel[n]}</dd></div>
            ))}
            <div><dt>Confirmados</dt><dd>{confirmados}</dd></div>
            <div><dt>Último relato</dt><dd>{ultimo ? tempoRelativo(ultimo.criado_em) : '-'}</dd></div>
          </dl>
        </section>

        <section className="pontos" aria-labelledby="titulo-pontos">
          <div className="cartao-cabeca">
            <h2 id="titulo-pontos" className="cartao-titulo">Pontos alagados</h2>
            <span className="contador">{ativos.length}</span>
          </div>
          {ativos.length ? (
            <ul className="blocos" tabIndex={0} aria-label="Pontos alagados, role para o lado para ver todos">
              {ativos.map((r) => (
                <li key={r.id}><BlocoPonto relato={r} novo={recentes.has(r.id)} /></li>
              ))}
            </ul>
          ) : (
            <p className="vazio">Nenhum ponto alagado relatado agora. Bom caminho!</p>
          )}
        </section>

        <GraficoHoras relatos={doBairro} />

        <section className="cartao cartao-mapa" aria-labelledby="titulo-mapa">
          <div className="cartao-cabeca">
            <h2 id="titulo-mapa" className="cartao-titulo">Mapa do bairro</h2>
            <span className="legenda" aria-hidden="true">
              {ordemNiveis.map((n) => (
                <span key={n}><NivelSelo nivel={n} /></span>
              ))}
            </span>
          </div>
          <Mapa relatos={ativos} centro={bairro} rotulo={`Mapa dos pontos alagados em ${bairro.nome}. A mesma informação está nos blocos acima.`} />
        </section>

        <section className="outros" aria-labelledby="titulo-outros">
          <div className="cartao-cabeca">
            <h2 id="titulo-outros" className="cartao-titulo">Outros bairros</h2>
          </div>
          <ul className="lista-outros">
            {outros.map(({ b, total, pior: p }) => (
              <li key={b.slug}>
                <Link to={`/bairro/${b.slug}`} className="outro">
                  <span>
                    <span className="outro-zona">{b.zona}</span>
                    <strong>{b.nome}</strong>
                    <span className="outro-estado">{p ? `Pior: ${niveis[p].rotulo}` : 'Sem alagamentos'}</span>
                  </span>
                  <span className="outro-num">
                    {p ? <NivelIcone nivel={p} tamanho={36} /> : null}
                    <strong>{total}</strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <aside className="chamada-app" aria-labelledby="titulo-app">
          <h2 id="titulo-app">Viu água na rua?</h2>
          <p>Pelo app do Vau você avisa os vizinhos em 3 toques, mesmo sem sinal.</p>
          <Link className="botao" to="/">Conhecer o app</Link>
        </aside>
      </div>
    </div>
  );
}
