// Dados que ficam só no aparelho: id anônimo, bairro escolhido, preferências e ids dos relatos feitos aqui.
import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  aparelho: 'vau:aparelho',
  bairro: 'vau:bairro',
  meus: 'vau:meus',
  votos: 'vau:votos',
};

export async function idDoAparelho() {
  let id = await AsyncStorage.getItem(K.aparelho);
  if (!id) {
    id = `ap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(K.aparelho, id);
  }
  return id;
}

export async function lerBairro() {
  return AsyncStorage.getItem(K.bairro);
}

export async function salvarBairro(slug) {
  await AsyncStorage.setItem(K.bairro, slug);
}

async function lerLista(chave) {
  try {
    return JSON.parse((await AsyncStorage.getItem(chave)) || '[]');
  } catch {
    return [];
  }
}

export async function votosFeitos() {
  return lerLista(K.votos);
}

export async function registrarVoto(id) {
  const lista = await lerLista(K.votos);
  if (!lista.includes(id)) await AsyncStorage.setItem(K.votos, JSON.stringify([...lista, id]));
}
