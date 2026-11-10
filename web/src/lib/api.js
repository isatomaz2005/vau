// Mesmo banco que o app usa. A web lê, a liderança (logada) muda status e emite avisos.
import { supabase } from './supabase';

export async function buscarRelatos({ bairro, desde } = {}) {
  let q = supabase.from('relatos').select('*').order('criado_em', { ascending: false }).limit(300);
  if (bairro) q = q.eq('bairro', bairro);
  if (desde) q = q.gte('criado_em', desde);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function buscarAvisos({ bairro, ativos = true } = {}) {
  let q = supabase.from('avisos').select('*').order('criado_em', { ascending: false });
  if (bairro) q = q.eq('bairro', bairro);
  if (ativos) q = q.eq('ativo', true);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function mudarStatus(id, status) {
  const { data, error } = await supabase.from('relatos').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function emitirAviso({ bairro, nivel, mensagem }) {
  const { data, error } = await supabase
    .from('avisos')
    .insert({ bairro, nivel, mensagem })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function encerrarAviso(id) {
  const { error } = await supabase
    .from('avisos')
    .update({ ativo: false, encerrado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export function escutar({ onRelato, onAviso }) {
  const canal = supabase
    .channel(`web-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'relatos' }, (p) => onRelato?.(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos' }, (p) => onAviso?.(p))
    .subscribe();
  return () => supabase.removeChannel(canal);
}

// Aplica um evento do tempo real numa lista em memória.
export function aplicarEvento(lista, { eventType, new: novo, old }) {
  const id = novo?.id || old?.id;
  const sem = lista.filter((x) => x.id !== id);
  if (eventType === 'DELETE') return sem;
  return [novo, ...sem].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
}
