import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { buscarAvisoAtivo, buscarRelatosAtivos, escutarMudancas } from './api';
import { iniciarFila, ouvirFila, tamanhoDaFila } from './fila';
import { lerBairro, salvarBairro } from './local';
import { supabaseConfigurado } from './supabase';

const Ctx = createContext(null);

export function VauProvider({ children }) {
  const [bairro, setBairro] = useState(undefined); // undefined = carregando, null = não escolheu
  const [relatos, setRelatos] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [online, setOnline] = useState(true);
  const [naFila, setNaFila] = useState(0);
  const [local, setLocal] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [recentes, setRecentes] = useState(new Set()); // ids que chegaram em tempo real (destaque)
  const [toast, setToast] = useState(null);
  const bairroRef = useRef(bairro);
  bairroRef.current = bairro;

  const avisar = useCallback((mensagem, tipo = 'info') => {
    setToast({ mensagem, tipo, id: Date.now() });
    AccessibilityInfo.announceForAccessibility(mensagem);
  }, []);

  const recarregar = useCallback(async () => {
    if (!supabaseConfigurado) {
      setErro('O app ainda não está ligado ao banco de dados. Veja o README.');
      setCarregando(false);
      return;
    }
    try {
      const [lista, av] = await Promise.all([
        buscarRelatosAtivos(),
        buscarAvisoAtivo(bairroRef.current),
      ]);
      setRelatos(lista);
      setAviso(av);
      setErro(null);
    } catch (e) {
      setErro('Não deu para atualizar agora. Mostrando o que já estava salvo.');
    } finally {
      setCarregando(false);
    }
  }, []);

  // Bairro salvo no aparelho
  useEffect(() => {
    lerBairro().then((b) => setBairro(b || null));
  }, []);

  useEffect(() => {
    if (bairro !== undefined) recarregar();
  }, [bairro, recarregar]);

  // Localização (opcional: sem ela o app funciona pelo bairro escolhido)
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const ultima = await Location.getLastKnownPositionAsync();
      if (ultima) setLocal({ lat: ultima.coords.latitude, lng: ultima.coords.longitude });
      const atual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocal({ lat: atual.coords.latitude, lng: atual.coords.longitude });
    })().catch(() => {});
  }, []);

  // Conexão e fila offline
  useEffect(() => {
    tamanhoDaFila().then(setNaFila);
    const pararFila = ouvirFila(setNaFila);
    const pararRede = NetInfo.addEventListener((s) =>
      setOnline(Boolean(s.isConnected && s.isInternetReachable !== false))
    );
    const pararEnvio = iniciarFila((n) =>
      avisar(n === 1 ? 'Seu relato guardado foi enviado.' : `${n} relatos guardados foram enviados.`, 'sucesso')
    );
    return () => {
      pararFila();
      pararRede();
      pararEnvio();
    };
  }, [avisar]);

  // Tempo real: o que a web (ou outro morador) faz aparece aqui na hora
  useEffect(() => {
    if (!supabaseConfigurado) return;
    return escutarMudancas({
      onRelato: ({ eventType, new: novo, old }) => {
        setRelatos((atual) => {
          const semEle = atual.filter((r) => r.id !== (novo?.id || old?.id));
          if (eventType === 'DELETE') return semEle;
          if (!['novo', 'confirmado'].includes(novo.status)) return semEle;
          return [novo, ...semEle].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
        });
        if (eventType === 'INSERT' && novo) {
          setRecentes((s) => new Set(s).add(novo.id));
          setTimeout(
            () => setRecentes((s) => {
              const n = new Set(s);
              n.delete(novo.id);
              return n;
            }),
            6000
          );
        }
      },
      onAviso: ({ new: novo }) => {
        if (!novo || novo.bairro !== bairroRef.current) return;
        if (novo.ativo) {
          setAviso(novo);
          AccessibilityInfo.announceForAccessibility(`Novo aviso para o seu bairro: ${novo.mensagem}`);
        } else {
          setAviso((a) => (a?.id === novo.id ? null : a));
        }
      },
    });
  }, []);

  const escolherBairro = useCallback(async (slug) => {
    await salvarBairro(slug);
    setBairro(slug);
  }, []);

  return (
    <Ctx.Provider
      value={{
        bairro,
        escolherBairro,
        relatos,
        aviso,
        online,
        naFila,
        local,
        carregando,
        erro,
        recarregar,
        recentes,
        toast,
        avisar,
        fecharToast: () => setToast(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useVau() {
  return useContext(Ctx);
}
