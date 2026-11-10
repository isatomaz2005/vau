import { useState } from 'react';
import { avisos, gravidade, niveis, status as STATUS } from '../../../shared/tokens';
import { bairroPorSlug, tempoRelativo } from '../../../shared/bairros';

export function NivelSelo({ nivel, grande }) {
  const n = niveis[nivel];
  if (!n) return null;
  return (
    <span className={`selo ${grande ? 'selo-grande' : ''}`} style={{ color: n.cor, background: n.fundo }}>
      <span aria-hidden="true" className="selo-simbolo" style={{ background: n.cor }}>
        {n.simbolo}
      </span>
      {n.rotulo}
    </span>
  );
}

// Ícone grande do nível (círculo com símbolo), usado nos blocos e no card de destaque.
export function NivelIcone({ nivel, tamanho = 56 }) {
  const n = niveis[nivel];
  if (!n) return null;
  return (
    <span
      aria-hidden="true"
      className="nivel-icone"
      style={{ width: tamanho, height: tamanho, background: n.fundo, color: n.cor, fontSize: tamanho * 0.42 }}
    >
      <span style={{ background: n.cor, color: '#0F1114' }}>{n.simbolo}</span>
    </span>
  );
}

export function StatusSelo({ status }) {
  const s = STATUS[status];
  if (!s) return null;
  return <span className={`status status-${status}`}>{status === 'novo' ? 'Novo' : s.rotulo}</span>;
}

export function piorNivel(relatos) {
  return relatos.reduce((pior, r) => (!pior || gravidade[r.nivel] > gravidade[pior] ? r.nivel : pior), null);
}

export function AvisoCaixa({ aviso, acao }) {
  const tipo = avisos[aviso.nivel] || avisos.atencao;
  return (
    <section className="aviso" style={{ background: tipo.fundo, color: tipo.cor }} aria-labelledby={`aviso-${aviso.id}`}>
      <span aria-hidden="true" className="aviso-icone" style={{ background: tipo.cor, color: tipo.fundo }}>!</span>
      <div className="aviso-corpo">
        <h2 id={`aviso-${aviso.id}`} className="aviso-titulo">
          {tipo.rotulo} - {bairroPorSlug(aviso.bairro)?.nome || aviso.bairro}
        </h2>
        <p className="aviso-texto">{aviso.mensagem}</p>
        <p className="aviso-meta">
          Emitido <time dateTime={aviso.criado_em}>{tempoRelativo(aviso.criado_em)}</time> pela liderança do bairro
        </p>
        {acao}
      </div>
    </section>
  );
}

// Bloco vertical de um ponto alagado (como os dias de uma previsão do tempo).
export function BlocoPonto({ relato, novo, selecionado, onClick }) {
  const n = niveis[relato.nivel];
  const Tag = onClick ? 'button' : 'article';
  return (
    <Tag
      className={`bloco ${novo ? 'bloco-novo' : ''} ${selecionado ? 'bloco-sel' : ''}`}
      onClick={onClick}
      aria-pressed={onClick ? !!selecionado : undefined}
      aria-label={onClick ? `${n.rotulo}: ${relato.referencia || 'sem referência'}, ${tempoRelativo(relato.criado_em)}` : undefined}
    >
      <span className="bloco-tempo">
        <time dateTime={relato.criado_em}>{tempoRelativo(relato.criado_em)}</time>
      </span>
      <NivelIcone nivel={relato.nivel} />
      <span className="bloco-ref">{relato.referencia || 'Sem referência'}</span>
      <span className="bloco-nivel" style={{ color: n.cor }}>
        {n.rotulo}
      </span>
      {relato.status === 'confirmado' ? <span className="bloco-conf">✓ Confirmado</span> : null}
      {novo ? <span className="bloco-etiqueta">Novo</span> : null}
    </Tag>
  );
}

// Relatos por hora nas últimas 6 horas. Uma série só: uma cor, barras finas, valor visível e tabela para leitor de tela.
export function GraficoHoras({ relatos, titulo = 'Relatos por hora' }) {
  const [foco, setFoco] = useState(null);
  const agora = new Date();
  const horas = Array.from({ length: 6 }, (_, i) => {
    const fim = new Date(agora);
    fim.setMinutes(0, 0, 0);
    fim.setHours(fim.getHours() - (4 - i));
    const inicio = new Date(fim.getTime() - 3600000);
    const total = relatos.filter((r) => {
      const t = new Date(r.criado_em);
      return t >= inicio && t < fim;
    }).length;
    return { rotulo: `${String(inicio.getHours()).padStart(2, '0')}h`, total };
  });
  const max = Math.max(1, ...horas.map((h) => h.total));
  return (
    <section className="cartao grafico" aria-labelledby="titulo-grafico">
      <h2 id="titulo-grafico" className="cartao-titulo">{titulo}</h2>
      <p className="cartao-sub">Últimas 6 horas</p>
      <div className="barras" aria-hidden="true">
        {horas.map((h, i) => (
          <div
            key={h.rotulo}
            className="barra-col"
            onMouseEnter={() => setFoco(i)}
            onMouseLeave={() => setFoco(null)}
          >
            {foco === i ? <span className="barra-dica">{h.total} {h.total === 1 ? 'relato' : 'relatos'}</span> : null}
            <span className="barra-valor">{h.total || ''}</span>
            <span className="barra-trilho">
              <span className="barra" style={{ height: `${(h.total / max) * 100}%` }} />
            </span>
            <span className="barra-rotulo">{h.rotulo}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>{titulo} nas últimas 6 horas</caption>
        <thead>
          <tr><th scope="col">Hora</th><th scope="col">Relatos</th></tr>
        </thead>
        <tbody>
          {horas.map((h) => (
            <tr key={h.rotulo}><td>{h.rotulo}</td><td>{h.total}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <span className="logo-marca" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 28 28">
          <path d="M2 18c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M2 23c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity=".55" />
          <path d="M8 13 14 4l6 9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      Vau
    </span>
  );
}
