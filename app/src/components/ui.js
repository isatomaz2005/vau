// Peças básicas: texto com a fonte da marca e botão com área de toque confortável.
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cores, fonte, raio, toqueMinimo } from '../../../shared/tokens';
import { useMovimentoReduzido } from '../hooks/useMovimentoReduzido';

export const FONTE = 'AtkinsonHyperlegible_400Regular';
export const FONTE_NEGRITO = 'AtkinsonHyperlegible_700Bold';

// O texto acompanha o tamanho de fonte do sistema (até 2x, para não quebrar o layout).
export function Texto({ variante = 'corpo', negrito, cor, style, ...props }) {
  return (
    <Text
      maxFontSizeMultiplier={2}
      style={[
        estilos.base,
        estilos[variante],
        negrito && { fontFamily: FONTE_NEGRITO },
        cor && { color: cor },
        style,
      ]}
      {...props}
    />
  );
}

export function Botao({
  titulo,
  icone,
  variante = 'primario',
  onPress,
  desabilitado,
  dica,
  rotulo,
  style,
  grande,
}) {
  const escala = useRef(new Animated.Value(1)).current;
  const reduzido = useMovimentoReduzido();
  const v = variantes[variante];

  // Microinteração: o botão "afunda" ao toque, confirmando que foi pressionado.
  const apertar = (para) => {
    if (reduzido) return;
    Animated.spring(escala, { toValue: para, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: escala }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={rotulo || titulo}
        accessibilityHint={dica}
        accessibilityState={{ disabled: !!desabilitado }}
        disabled={desabilitado}
        onPressIn={() => apertar(0.96)}
        onPressOut={() => apertar(1)}
        onPress={(e) => {
          Haptics.selectionAsync().catch(() => {});
          onPress?.(e);
        }}
        style={[
          estilos.botao,
          grande && estilos.botaoGrande,
          { backgroundColor: v.fundo, borderColor: v.borda },
          desabilitado && estilos.desabilitado,
        ]}
      >
        {icone ? <MaterialCommunityIcons name={icone} size={grande ? 26 : 22} color={v.texto} /> : null}
        <Texto negrito variante={grande ? 'destaque' : 'corpo'} cor={v.texto}>
          {titulo}
        </Texto>
      </Pressable>
    </Animated.View>
  );
}

const variantes = {
  primario: { fundo: cores.marca, borda: cores.marca, texto: cores.sobreMarca },
  secundario: { fundo: 'transparent', borda: cores.textoSuave, texto: cores.texto },
  discreto: { fundo: 'transparent', borda: 'transparent', texto: cores.marca },
};

const estilos = StyleSheet.create({
  base: { fontFamily: FONTE, color: cores.texto },
  pequeno: { fontSize: fonte.tamanhos.pequeno, lineHeight: 20 },
  corpo: { fontSize: fonte.tamanhos.corpo, lineHeight: 24 },
  destaque: { fontSize: fonte.tamanhos.destaque, lineHeight: 28 },
  titulo: { fontSize: fonte.tamanhos.titulo, lineHeight: 32, fontFamily: FONTE_NEGRITO },
  display: { fontSize: fonte.tamanhos.display, lineHeight: 40, fontFamily: FONTE_NEGRITO },
  botao: {
    minHeight: toqueMinimo,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: raio.pilula,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoGrande: { minHeight: 64, borderRadius: raio.lg },
  desabilitado: { opacity: 0.45 },
});
