import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, raio } from '../../../shared/tokens';
import { useVau } from '../lib/VauContext';
import { useDuracoes } from '../hooks/useMovimentoReduzido';
import { Texto } from './ui';

// Barra de conexão: aparece deslizando quando o sinal cai e some quando volta.
export function BarraConexao() {
  const { online, naFila } = useVau();
  const { medio } = useDuracoes();
  const visivel = !online || naFila > 0;
  const anim = useRef(new Animated.Value(visivel ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: visivel ? 1 : 0, duration: medio, useNativeDriver: false }).start();
  }, [visivel]);

  const texto = !online
    ? naFila
      ? `Sem conexão. ${naFila} ${naFila === 1 ? 'relato guardado' : 'relatos guardados'}, enviaremos quando o sinal voltar.`
      : 'Sem conexão. Você ainda pode relatar: guardamos e enviamos depois.'
    : `Enviando ${naFila} ${naFila === 1 ? 'relato guardado' : 'relatos guardados'}…`;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={{
        maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }),
        opacity: anim,
        overflow: 'hidden',
      }}
    >
      {visivel ? (
        <View style={estilos.barra} accessible accessibilityRole="text">
          <MaterialCommunityIcons name={online ? 'cloud-upload' : 'wifi-off'} size={20} color="#FFF" />
          <Texto variante="pequeno" cor="#FFF" style={{ flex: 1 }}>
            {texto}
          </Texto>
        </View>
      ) : null}
    </Animated.View>
  );
}

// Toast de retorno: sobe da base, fica alguns segundos e sai. Também é lido pelo leitor de tela.
export function Toast() {
  const { toast, fecharToast } = useVau();
  const { medio, reduzido } = useDuracoes();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: medio, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: medio, useNativeDriver: true }).start(fecharToast);
    }, reduzido ? 6000 : 4000);
    return () => clearTimeout(t);
  }, [toast?.id]);

  if (!toast) return null;
  const sucesso = toast.tipo === 'sucesso';
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        estilos.toastArea,
        { bottom: insets.bottom + 90 },
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        },
      ]}
    >
      <Pressable
        onPress={fecharToast}
        accessibilityRole="button"
        accessibilityLabel={`${toast.mensagem}. Toque para fechar.`}
        style={[estilos.toast, sucesso && { backgroundColor: cores.sucesso }]}
      >
        <MaterialCommunityIcons name={sucesso ? 'check-circle' : 'information'} size={22} color={cores.fundo} />
        <Texto negrito cor={cores.fundo} style={{ flex: 1 }}>
          {toast.mensagem}
        </Texto>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.superficieAlta,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastArea: { position: 'absolute', left: 16, right: 16 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.texto,
    borderRadius: raio.md,
    padding: 14,
    minHeight: 48,
  },
});
