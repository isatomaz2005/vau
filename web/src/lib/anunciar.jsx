// Região aria-live única: tudo que muda sozinho na tela também é lido pelo leitor de tela.
import { useEffect, useState } from 'react';

const ouvintes = new Set();

export function anunciar(texto) {
  ouvintes.forEach((f) => f({ texto, id: Date.now() }));
}

export function Anunciador() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    const f = (m) => setMsg(m);
    ouvintes.add(f);
    return () => ouvintes.delete(f);
  }, []);
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {msg?.texto}
    </div>
  );
}

// Toast visual + anúncio. Some sozinho; com movimento reduzido fica mais tempo e sem deslizar.
const ouvintesToast = new Set();

export function toast(texto, tipo = 'info') {
  anunciar(texto);
  ouvintesToast.forEach((f) => f({ texto, tipo, id: Date.now() }));
}

export function Toasts() {
  const [itens, setItens] = useState([]);
  useEffect(() => {
    const f = (t) => {
      setItens((l) => [...l, t]);
      setTimeout(() => setItens((l) => l.filter((x) => x.id !== t.id)), 5000);
    };
    ouvintesToast.add(f);
    return () => ouvintesToast.delete(f);
  }, []);
  return (
    <div className="toasts" aria-hidden="true">
      {itens.map((t) => (
        <div key={t.id} className={`toast toast-${t.tipo}`}>
          <span className="toast-icone">{t.tipo === 'sucesso' ? '✓' : 'i'}</span>
          {t.texto}
        </div>
      ))}
    </div>
  );
}
