import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { avisos, raio } from '../../../shared/tokens';
import { tempoRelativo, bairroPorSlug } from '../../../shared/bairros';
import { useDuracoes } from '../hooks/useMovimentoReduzido';
import { Texto } from './ui';

// Aviso emitido pela liderança na web. Quando chega um aviso novo, ele desce do topo
// e o ícone pulsa duas vezes: mostra que algo mudou sem precisar de som.
export function AvisoBanner({ aviso }) {
  const { medio, reduzido } = useDuracoes();
  const entrada = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!aviso) return;
    entrada.setValue(reduzido ? 1 : 0);
    Animated.timing(entrada, { toValue: 1, duration: medio, useNativeDriver: true }).start();
    if (!reduzido) {
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.25, duration: 180, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1.25, duration: 180, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [aviso?.id]);

  if (!aviso) return null;
  const tipo = avisos[aviso.nivel] || avisos.atencao;
  const nomeBairro = bairroPorSlug(aviso.bairro)?.nome || aviso.bairro;

  return (
    <Animated.View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${tipo.rotulo} para ${nomeBairro}, ${tempoRelativo(aviso.criado_em)}. ${aviso.mensagem}`}
      style={[
        estilos.caixa,
        { backgroundColor: tipo.fundo, borderColor: tipo.cor },
        {
          opacity: entrada,
          transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        },
      ]}
    >
      <View style={estilos.topo}>
        <Animated.View style={{ transform: [{ scale: pulso }] }}>
          <MaterialCommunityIcons name={tipo.icone} size={26} color={tipo.cor} />
        </Animated.View>
        <Texto negrito variante="destaque" cor={tipo.cor}>
          {tipo.rotulo} - {nomeBairro}
        </Texto>
      </View>
      <Texto cor={tipo.cor}>{aviso.mensagem}</Texto>
      <Texto variante="pequeno" cor={tipo.cor}>
        Aviso da liderança do bairro, {tempoRelativo(aviso.criado_em)}
      </Texto>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  caixa: { borderWidth: 2, borderRadius: raio.md, padding: 16, gap: 6 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
