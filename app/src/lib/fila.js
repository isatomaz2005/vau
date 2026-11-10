// Fila offline: na chuva o sinal cai. O relato é guardado no aparelho e enviado sozinho quando a conexão volta.
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { criarRelato } from './api';

const CHAVE = 'vau:fila';
const ouvintes = new Set();
let enviando = false;

async function ler() {
  try {
    return JSON.parse((await AsyncStorage.getItem(CHAVE)) || '[]');
  } catch {
    return [];
  }
}

async function gravar(lista) {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(lista));
  ouvintes.forEach((f) => f(lista.length));
}

export async function tamanhoDaFila() {
  return (await ler()).length;
}

export function ouvirFila(f) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export async function estaOnline() {
  const estado = await NetInfo.fetch();
  return Boolean(estado.isConnected && estado.isInternetReachable !== false);
}

// Tenta enviar agora; se não der, guarda na fila. Retorna 'enviado' ou 'na-fila'.
export async function enviarOuGuardar(rascunho) {
  const comHorario = { ...rascunho, criadoEm: rascunho.criadoEm || new Date().toISOString() };
  if (await estaOnline()) {
    try {
      const relato = await criarRelato(comHorario);
      return { resultado: 'enviado', relato };
    } catch (e) {
      console.warn('[Vau] envio falhou, guardando na fila', e?.message);
    }
  }
  const lista = await ler();
  await gravar([...lista, comHorario]);
  return { resultado: 'na-fila' };
}

export async function esvaziarFila() {
  if (enviando) return 0;
  enviando = true;
  let enviados = 0;
  try {
    let lista = await ler();
    while (lista.length) {
      try {
        await criarRelato(lista[0]);
      } catch {
        break; // ainda sem conexão: tenta na próxima reconexão
      }
      lista = lista.slice(1);
      enviados += 1;
      await gravar(lista);
    }
  } finally {
    enviando = false;
  }
  return enviados;
}

// Liga o envio automático quando a conexão volta. Chamar uma vez no layout raiz.
export function iniciarFila(aoEnviar) {
  return NetInfo.addEventListener(async (estado) => {
    if (estado.isConnected && estado.isInternetReachable !== false) {
      const n = await esvaziarFila();
      if (n > 0) aoEnviar?.(n);
    }
  });
}

export async function itensDaFila() {
  return ler();
}
