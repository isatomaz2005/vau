import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Entrar() {
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) setErro('E-mail ou senha não conferem. Confira e tente de novo.');
    else navegar('/painel');
  }

  return (
    <div className="container estreito">
      <h1>Painel da liderança</h1>
      <p>
        Área para lideranças comunitárias e agentes da Defesa Civil confirmarem relatos e avisarem o bairro.
      </p>
      <form className="formulario" onSubmit={entrar} noValidate>
        <label className="campo">
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={erro ? 'erro-login' : undefined}
          />
        </label>
        <label className="campo">
          <span>Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-describedby={erro ? 'erro-login' : undefined}
          />
        </label>
        {erro ? (
          <p id="erro-login" className="erro" role="alert">
            {erro}
          </p>
        ) : null}
        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
