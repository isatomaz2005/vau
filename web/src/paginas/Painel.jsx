import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bairroPorSlug, bairros, confirmam, dizemQueBaixou, tempoRelativo } from '../../../shared/bairros';
import { avisos as TIPOS_AVISO, niveis } from '../../../shared/tokens';
import {
  aplicarEvento,
  buscarAvisos,
  buscarRelatos,
  emitirAviso,
  encerrarAviso,
  escutar,
  mudarStatus,
} from '../lib/api';
import { supabase } from '../lib/supabase';
import { anunciar, toast } from '../lib/anunciar.jsx';
import { AvisoCaixa, NivelSelo, StatusSelo } from '../componentes/Basicos';
import { Mapa } from '../componentes/Mapa';

const ABAS = [
  { id: 'novo', rotulo: 'Novos' },
  { id: 'confirmado', rotulo: 'Confirmados' },
  { id: 'resolvido', rotulo: 'Resolvidos' },
];

export function Painel() {
  const navegar = useNavigate();
  const [sessao, setSessao] = useState(undefined);
  const [relatos, setRelatos] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [bairro, setBairro] = useState('');
  const [aba, setAba] = useState('novo');
  const [selecionado, setSelecionado] = useState(null);
  const [recentes, setRecentes] = useState(new Set());
  const [, forcar] = useState(0);
  const detalheRef = useRef(null);

  useEffect(() => {
    document.title = 'Painel da liderança - Vau';
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navegar('/entrar', { replace: true });
      else setSessao(data.session);
    });
  }, []);

  useEffect(() => {
    if (!sessao) return;
    const desde = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString();
    buscarRelatos({ desde }).then(setRelatos);
    buscarAvisos().then(setAvisos);
    const parar = escutar({
      onRelato: (p) => {
        setRelatos((l) => aplicarEvento(l, p));
        if (p.eventType === 'INSERT') {
          const r = p.new;
          anunciar(`Novo relato: ${niveis[r.nivel].rotulo} em ${bairroPorSlug(r.bairro)?.nome}, ${r.referencia}`);
          setRecentes((s) => new Set(s).add(r.id));
          setTimeout(() => setRecentes((s) => { const n = new Set(s); n.delete(r.id); return n; }), 8000);
        }
      },
      onAviso: (p) => setAvisos((l) => aplicarEvento(l, p).filter((a) => a.ativo)),
    });
    const relogio = setInterval(() => forcar((x) => x + 1), 30000);
    return () => {
      parar();
      clearInterval(relogio);
    };
  }, [sessao]);

  const doBairro = useMemo(() => relatos.filter((r) => !bairro || r.bairro === bairro), [relatos, bairro]);
  const contagem = useMemo(
    () => Object.fromEntries(ABAS.map((a) => [a.id, doBairro.filter((r) => r.status === a.id).length])),
    [doBairro]
  );
  const daAba = doBairro.filter((r) => r.status === aba);
  const atual = relatos.find((r) => r.id === selecionado);
  const avisosVisiveis = avisos.filter((a) => !bairro || a.bairro === bairro);

  async function agir(status) {
    if (!atual) return;
    try {
      await mudarStatus(atual.id, status);
      const msg = {
        confirmado: 'Relato confirmado. Quem relatou já vê no app.',
        descartado: 'Relato descartado.',
        resolvido: 'Marcado como resolvido. Some do mapa do app.',
      }[status];
      toast(msg, 'sucesso');
      // Vai para o próximo da fila: fluxo de triagem sem tirar a mão do teclado.
      const proximo = daAba.find((r) => r.id !== atual.id);
      setSelecionado(proximo?.id || null);
    } catch {
      toast('Não deu para salvar. Confira a conexão.', 'erro');
    }
  }

  // Atalhos de teclado na triagem: C confirmar, D descartar, R resolvido.
  useEffect(() => {
    function tecla(e) {
      if (!atual || e.ctrlKey || e.metaKey || e.altKey) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const mapa = { c: 'confirmado', d: 'descartado', r: 'resolvido' };
      const s = mapa[e.key.toLowerCase()];
      if (s && s !== atual.status) {
        e.preventDefault();
        agir(s);
      }
    }
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  function selecionar(id) {
    setSelecionado(id);
    requestAnimationFrame(() => detalheRef.current?.focus());
  }

  if (!sessao) return <div className="container"><p>Carregando…</p></div>;

  return (
    <div className="container largo painel">
      <div className="cabecalho-pagina">
        <div>
          <p className="sobretitulo escuro">Painel da liderança</p>
          <h1>Relatos e avisos</h1>
        </div>
        <div className="painel-filtros">
          <label className="campo campo-linha">
            <span>Bairro</span>
            <select value={bairro} onChange={(e) => { setBairro(e.target.value); setSelecionado(null); }}>
              <option value="">Todos os bairros</option>
              {bairros.map((b) => (
                <option key={b.slug} value={b.slug}>{b.nome}</option>
              ))}
            </select>
          </label>
          <button className="botao botao-discreto" onClick={() => supabase.auth.signOut().then(() => navegar('/'))}>
            Sair
          </button>
        </div>
      </div>

      <dl className="numeros">
        <div><dt>Novos para triar</dt><dd>{contagem.novo}</dd></div>
        <div><dt>Confirmados agora</dt><dd>{contagem.confirmado}</dd></div>
        <div><dt>Avisos ativos</dt><dd>{avisosVisiveis.length}</dd></div>
      </dl>

      <div className="painel-grade">
        <section className="fila" aria-labelledby="titulo-fila">
          <h2 id="titulo-fila">Fila de relatos</h2>
          <div className="abas" role="group" aria-label="Filtrar por status">
            {ABAS.map((a) => (
              <button
                key={a.id}
                className="aba"
                aria-pressed={aba === a.id}
                onClick={() => { setAba(a.id); setSelecionado(null); }}
              >
                {a.rotulo} <span className="contador">{contagem[a.id]}</span>
              </button>
            ))}
          </div>
          {daAba.length ? (
            <ul className="fila-lista">
              {daAba.map((r) => (
                <li key={r.id} className={recentes.has(r.id) ? 'relato-novo' : ''}>
                  <button
                    className="fila-item"
                    aria-pressed={selecionado === r.id}
                    onClick={() => selecionar(r.id)}
                  >
                    <span className="fila-linha">
                      <NivelSelo nivel={r.nivel} />
                      {recentes.has(r.id) ? <span className="etiqueta-novo">Acabou de chegar</span> : null}
                    </span>
                    <strong>{r.referencia || 'Sem referência'}</strong>
                    <span className="meta">
                      {bairroPorSlug(r.bairro)?.nome} - <time dateTime={r.criado_em}>{tempoRelativo(r.criado_em)}</time>
                      {r.ainda_assim ? ` - ${confirmam(r.ainda_assim)}` : ''}
                      {r.ja_baixou ? ` - ${dizemQueBaixou(r.ja_baixou)}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vazio">Nada aqui {bairro ? `em ${bairroPorSlug(bairro).nome}` : ''}.</p>
          )}
        </section>

        <div className="painel-centro">
          <Mapa
            relatos={doBairro.filter((r) => ['novo', 'confirmado'].includes(r.status))}
            selecionado={selecionado}
            onSelecionar={selecionar}
            centro={bairroPorSlug(bairro)}
          />

          <section
            className="detalhe"
            aria-labelledby="titulo-detalhe"
            tabIndex={-1}
            ref={detalheRef}
            key={atual?.id || 'vazio'}
          >
            {atual ? (
              <>
                <div className="relato-topo">
                  <NivelSelo nivel={atual.nivel} grande />
                  <StatusSelo status={atual.status} />
                </div>
                <h2 id="titulo-detalhe">{atual.referencia || 'Ponto sem referência'}</h2>
                <p className="meta">
                  {bairroPorSlug(atual.bairro)?.nome} - relatado {tempoRelativo(atual.criado_em)} - {confirmam(atual.ainda_assim)},{' '}
                  {dizemQueBaixou(atual.ja_baixou)}
                </p>
                {atual.descricao ? <p>“{atual.descricao}”</p> : null}
                {atual.foto_url ? (
                  <img className="detalhe-foto" src={atual.foto_url} alt={`Foto enviada pelo morador: ${atual.referencia}`} />
                ) : null}
                <div className="acoes">
                  {atual.status !== 'confirmado' ? (
                    <button className="botao" onClick={() => agir('confirmado')} aria-keyshortcuts="C">
                      Confirmar <kbd>C</kbd>
                    </button>
                  ) : null}
                  {atual.status !== 'resolvido' ? (
                    <button className="botao botao-contorno" onClick={() => agir('resolvido')} aria-keyshortcuts="R">
                      Água baixou <kbd>R</kbd>
                    </button>
                  ) : null}
                  {atual.status === 'novo' ? (
                    <button className="botao botao-discreto" onClick={() => agir('descartado')} aria-keyshortcuts="D">
                      Descartar <kbd>D</kbd>
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <p id="titulo-detalhe" className="vazio">
                Escolha um relato na fila ou no mapa para confirmar, descartar ou marcar que a água baixou.
              </p>
            )}
          </section>
        </div>

        <section className="avisos-painel" aria-labelledby="titulo-avisos">
          <h2 id="titulo-avisos">Avisar o bairro</h2>
          <FormAviso bairroInicial={bairro} />
          <h3 className="h3">Avisos ativos</h3>
          {avisosVisiveis.length ? (
            avisosVisiveis.map((a) => (
              <AvisoCaixa
                key={a.id}
                aviso={a}
                acao={
                  <div className="acoes">
                    <button
                      className="botao botao-pequeno botao-contorno"
                      onClick={async () => {
                        await encerrarAviso(a.id);
                        toast('Aviso encerrado. Saiu do app e da página do bairro.', 'sucesso');
                      }}
                    >
                      Encerrar aviso
                    </button>
                    <button
                      className="botao botao-pequeno botao-discreto"
                      onClick={async () => {
                        await navigator.clipboard.writeText(`${window.location.origin}/bairro/${a.bairro}`);
                        toast('Link da página do bairro copiado.', 'sucesso');
                      }}
                    >
                      Copiar link do bairro
                    </button>
                  </div>
                }
              />
            ))
          ) : (
            <p className="vazio">Nenhum aviso ativo.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function FormAviso({ bairroInicial }) {
  const [bairro, setBairro] = useState(bairroInicial || '');
  const [nivel, setNivel] = useState('atencao');
  const [mensagem, setMensagem] = useState('');
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (bairroInicial) setBairro(bairroInicial);
  }, [bairroInicial]);

  async function enviar(e) {
    e.preventDefault();
    const novos = {};
    if (!bairro) novos.bairro = 'Escolha o bairro que vai receber o aviso.';
    if (mensagem.trim().length < 5) novos.mensagem = 'Escreva o aviso (pelo menos 5 letras).';
    setErros(novos);
    if (Object.keys(novos).length) {
      document.getElementById(novos.bairro ? 'aviso-bairro' : 'aviso-msg')?.focus();
      return;
    }
    setEnviando(true);
    try {
      await emitirAviso({ bairro, nivel, mensagem: mensagem.trim() });
      toast(`Aviso enviado para ${bairroPorSlug(bairro).nome}. Já aparece no app dos moradores.`, 'sucesso');
      setMensagem('');
    } catch {
      toast('Não deu para enviar o aviso. Confira a conexão.', 'erro');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <label className="campo">
        <span>Bairro</span>
        <select
          id="aviso-bairro"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          aria-invalid={!!erros.bairro}
          aria-describedby={erros.bairro ? 'erro-bairro' : undefined}
        >
          <option value="">Selecione…</option>
          {bairros.map((b) => (
            <option key={b.slug} value={b.slug}>{b.nome}</option>
          ))}
        </select>
        {erros.bairro ? <span id="erro-bairro" className="erro-campo">{erros.bairro}</span> : null}
      </label>

      <fieldset className="campo">
        <legend>Nível do aviso</legend>
        <div className="opcoes-aviso">
          {Object.entries(TIPOS_AVISO).map(([id, t]) => (
            <label key={id} className="opcao-aviso" style={{ '--cor': id === 'emergencia' ? t.fundo : t.cor }}>
              <input type="radio" name="nivel-aviso" value={id} checked={nivel === id} onChange={() => setNivel(id)} />
              <span>{t.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="campo">
        <span>Mensagem</span>
        <textarea
          id="aviso-msg"
          rows={3}
          maxLength={280}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Ex.: Evite a Rua Capachós. Ponto de apoio na escola."
          aria-invalid={!!erros.mensagem}
          aria-describedby={`dica-msg${erros.mensagem ? ' erro-msg' : ''}`}
        />
        <span id="dica-msg" className="dica">
          Use frases curtas e diga o que fazer. {280 - mensagem.length} caracteres restantes.
        </span>
        {erros.mensagem ? <span id="erro-msg" className="erro-campo">{erros.mensagem}</span> : null}
      </label>

      <button className="botao" type="submit" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar aviso ao bairro'}
      </button>
    </form>
  );
}
