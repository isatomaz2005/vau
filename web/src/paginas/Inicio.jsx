import { Link } from 'react-router-dom';
import { bairros } from '../../../shared/bairros';
import { niveis, ordemNiveis } from '../../../shared/tokens';
import { NivelIcone, NivelSelo } from '../componentes/Basicos';

export function Inicio() {
  return (
    <>
      <section className="heroi" aria-labelledby="titulo-heroi">
        <div className="heroi-interno">
          <div>
            <p className="sobretitulo">Alagamentos em tempo real, rua por rua</p>
            <h1 id="titulo-heroi">Choveu. Por onde eu passo?</h1>
            <p className="heroi-texto">
              No Vau, quem está na rua avisa pelo app onde alagou. A liderança do bairro confirma e avisa todo mundo, e
              quem não tem o app acompanha por um link.
            </p>
            <div className="acoes">
              <Link className="botao" to="/bairro">Ver meu bairro agora</Link>
              <Link className="botao botao-contorno" to="/painel">Sou liderança do bairro</Link>
            </div>
          </div>
          {/* Prévia ilustrativa do card de bairro */}
          <div className="heroi-cartao" aria-hidden="true">
            <span className="meta">Jardim Pantanal - agora</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="heroi-cartao-num">3</p>
              <NivelIcone nivel="intransitavel" tamanho={72} />
            </div>
            <span>pontos alagados</span>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {ordemNiveis.map((n) => <NivelSelo key={n} nivel={n} />)}
            </div>
            <svg className="ondas" viewBox="0 0 400 40" preserveAspectRatio="none">
              <path d="M-40 20 C10 5 50 35 100 20 S190 5 240 20 330 35 380 20 470 5 520 20" fill="none" stroke="#B9E2F5" strokeWidth="3" />
            </svg>
          </div>
        </div>
      </section>

      <div className="container largo secoes">
        <section aria-labelledby="como">
          <h2 id="como">Como funciona</h2>
          <ol className="passos">
            <li>
              <span className="passo-num" aria-hidden="true">1</span>
              <h3>Morador relata pelo app</h3>
              <p>Em 3 toques, mesmo sem sinal: o relato fica guardado e sai quando a conexão volta.</p>
            </li>
            <li>
              <span className="passo-num" aria-hidden="true">2</span>
              <h3>Liderança confirma no painel</h3>
              <p>Vê os relatos chegando no mapa, confirma ou descarta e marca quando a água baixou.</p>
            </li>
            <li>
              <span className="passo-num" aria-hidden="true">3</span>
              <h3>O bairro inteiro fica sabendo</h3>
              <p>O aviso aparece no app de quem mora lá e na página pública, que dá para mandar no WhatsApp.</p>
            </li>
          </ol>
        </section>

        <section aria-labelledby="niveis">
          <h2 id="niveis">Os três níveis</h2>
          <p className="suave">Cada nível tem nome, símbolo e cor. Ninguém precisa distinguir cores para entender.</p>
          <ul className="niveis">
            {ordemNiveis.map((n) => (
              <li key={n}>
                <NivelSelo nivel={n} grande />
                <p>{niveis[n].descricao}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="bairros">
          <h2 id="bairros">Bairros atendidos</h2>
          <ul className="grade-bairros">
            {bairros.map((b) => (
              <li key={b.slug}>
                <Link to={`/bairro/${b.slug}`} className="cartao-bairro">
                  <strong>{b.nome}</strong>
                  <span>{b.zona}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ods" className="ods">
          <h2 id="ods">Objetivos de Desenvolvimento Sustentável</h2>
          <p className="suave">
            <strong>ODS 11, meta 11.5:</strong> reduzir as pessoas afetadas por desastres relacionados à água.{' '}
            <strong>ODS 13, meta 13.1:</strong> aumentar a capacidade de adaptação das comunidades a eventos climáticos.
          </p>
        </section>
      </div>
    </>
  );
}
