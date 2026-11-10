import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, niveis, raio } from '../../../shared/tokens';
import { confirmam, formatarDistancia, tempoRelativo } from '../../../shared/bairros';
import { useDuracoes } from '../hooks/useMovimentoReduzido';
import { NivelSelo } from './NivelSelo';
import { Texto } from './ui';

// Card de um ponto alagado. Entra com fade + deslize (a lista "monta" de cima para baixo)
// e, se acabou de chegar em tempo real, o fundo acende e apaga para mostrar o que é novo.
export function RelatoCard({ relato, distancia, novo, indice = 0, onPress }) {
  const { medio, lento, reduzido } = useDuracoes();
  const entrada = useRef(new Animated.Value(reduzido ? 1 : 0)).current;
  const brilho = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: medio,
      delay: reduzido ? 0 : Math.min(indice, 6) * 40,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!novo) return;
    brilho.setValue(1);
    Animated.timing(brilho, { toValue: 0, duration: reduzido ? 0 : lento * 4, useNativeDriver: false }).start();
  }, [novo]);

  const n = niveis[relato.nivel];
  const dist = formatarDistancia(distancia);
  const confirmado = relato.status === 'confirmado';
  const rotulo = [
    novo ? 'Novo.' : '',
    `${n?.rotulo}.`,
    relato.referencia,
    dist ? `a ${dist}` : '',
    tempoRelativo(relato.criado_em),
    confirmado ? 'Confirmado pela liderança.' : '',
    relato.ainda_assim ? `${confirmam(relato.ainda_assim)}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Animated.View
      style={{
        opacity: entrada,
        transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        accessibilityHint="Abre o detalhe para confirmar se ainda está assim"
        onPress={onPress}
        style={({ pressed }) => [estilos.card, pressed && { opacity: 0.85 }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            estilos.brilho,
            { opacity: brilho.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }) },
          ]}
        />
        <View style={estilos.corpo}>
          <View style={estilos.linha}>
            <NivelSelo nivel={relato.nivel} />
            {novo ? (
              <View style={estilos.novo}>
                <Texto negrito variante="pequeno" cor={cores.sobreMarca}>
                  NOVO
                </Texto>
              </View>
            ) : null}
          </View>
          <Texto negrito variante="destaque" numberOfLines={2}>
            {relato.referencia || 'Ponto sem referência'}
          </Texto>
          <View style={estilos.meta}>
            {dist ? <Meta icone="map-marker-distance" texto={dist} /> : null}
            <Meta icone="clock-outline" texto={tempoRelativo(relato.criado_em)} />
            {relato.ainda_assim ? (
              <Meta icone="account-multiple-check" texto={confirmam(relato.ainda_assim)} />
            ) : null}
          </View>
          {confirmado ? (
            <View style={estilos.linha}>
              <MaterialCommunityIcons name="shield-check" size={18} color={cores.marca} />
              <Texto variante="pequeno" negrito cor={cores.marca}>
                Confirmado pela liderança
              </Texto>
            </View>
          ) : null}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={26} color={cores.textoSuave} />
      </Pressable>
    </Animated.View>
  );
}

function Meta({ icone, texto }) {
  return (
    <View style={estilos.linha}>
      <MaterialCommunityIcons name={icone} size={16} color={cores.textoSuave} />
      <Texto variante="pequeno" cor={cores.textoSuave}>
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  card: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: 8,
    minHeight: 96,
  },
  brilho: { backgroundColor: cores.acento },
  corpo: { flex: 1, padding: 16, gap: 6 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 },
  novo: { backgroundColor: cores.marca, borderRadius: raio.sm, paddingHorizontal: 8, paddingVertical: 2 },
});
