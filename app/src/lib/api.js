// Toda conversa com o backend (Supabase) passa por aqui.
import { supabase } from './supabase';
import { idDoAparelho } from './local';

export async function buscarRelatosAtivos() {
  const { data, error } = await supabase
    .from('relatos')
    .select('*')
    .in('status', ['novo', 'confirmado'])
    .order('criado_em', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

export async function buscarMeusRelatos() {
  const autor = await idDoAparelho();
  const { data, error } = await supabase
    .from('relatos')
    .select('*')
    .eq('autor', autor)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data;
}

export async function buscarRelato(id) {
  const { data, error } = await supabase.from('relatos').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function buscarAvisoAtivo(bairro) {
  if (!bairro) return null;
  const { data, error } = await supabase
    .from('avisos')
    .select('*')
    .eq('bairro', bairro)
    .eq('ativo', true)
    .order('criado_em', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data[0] || null;
}

async function enviarFoto(uri) {
  const resposta = await fetch(uri);
  const arquivo = await resposta.arrayBuffer();
  const caminho = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from('fotos')
    .upload(caminho, arquivo, { contentType: 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from('fotos').getPublicUrl(caminho).data.publicUrl;
}

// Recebe o rascunho montado na tela Relatar (com fotoLocal opcional) e grava no banco.
export async function criarRelato(rascunho) {
  const autor = await idDoAparelho();
  let foto_url = null;
  if (rascunho.fotoLocal) {
    try {
      foto_url = await enviarFoto(rascunho.fotoLocal);
    } catch (e) {
      // Sem a foto o relato ainda é útil: não trava o envio.
      console.warn('[Vau] foto não enviada', e?.message);
    }
  }
  const { data, error } = await supabase
    .from('relatos')
    .insert({
      bairro: rascunho.bairro,
      lat: rascunho.lat,
      lng: rascunho.lng,
      referencia: rascunho.referencia || '',
      nivel: rascunho.nivel,
      descricao: rascunho.descricao || '',
      foto_url,
      autor,
      criado_em: rascunho.criadoEm, // horário real do relato, mesmo se saiu da fila offline
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function votar(id, tipo) {
  const { data, error } = await supabase.rpc('votar', { p_relato: id, p_tipo: tipo });
  if (error) throw error;
  return data;
}

// Escuta inserções e mudanças em relatos e avisos (tempo real).
export function escutarMudancas({ onRelato, onAviso }) {
  const canal = supabase
    .channel(`app-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'relatos' }, (p) =>
      onRelato?.(p)
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos' }, (p) =>
      onAviso?.(p)
    )
    .subscribe();
  return () => supabase.removeChannel(canal);
}
