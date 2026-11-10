import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, status as STATUS } from '../../../shared/tokens';
import { useDuracoes } from '../hooks/useMovimentoReduzido';
import { Texto } from './ui';

const PASSOS = ['novo', 'confirmado', 'resolvido'];

// Trilha Enviado → Confirmado → Resolvido. Quando a liderança muda o status na web,
// a linha "enche" até o novo passo: o morador vê o progresso acontecer.
export function StatusTrilha({ status, naFila }) {
  const { lento } = useDuracoes();
  const atual = naFila ? 0 : STATUS[status]?.passo || 0;
  const progresso = useRef(new Animated.Value(atual)).current;

  useEffect(() => {
    Animated.timing(progresso, { toValue: atual, duration: lento, useNativeDriver: false }).start();
  }, [atual]);

  if (status === 'descartado') {
    return (
      <View style={estilos.linha} accessible accessibilityLabel="Status: não confirmado pela liderança">
        <MaterialCommunityIcons name="close-circle-outline" size={20} color={cores.textoSuave} />
        <Texto variante="pequeno" cor={cores.textoSuave}>
          {STATUS.descartado.rotulo}: {STATUS.descartado.descricao}
        </Texto>
      </View>
    );
  }

  const largura = progresso.interpolate({ inputRange: [0, 1, 3], outputRange: ['0%', '0%', '100%'] });
  const rotulo = naFila
    ? 'Status: guardado no aparelho, será enviado quando houver conexão'
    : `Status: ${STATUS[status]?.rotulo}, passo ${atual} de 3. ${STATUS[status]?.descricao}`;

  return (
    <View accessible accessibilityLabel={rotulo} style={{ gap: 8 }}>
      <View style={estilos.trilho}>
        <Animated.View style={[estilos.cheio, { width: largura }]} />
        <View style={estilos.pontos}>
          {PASSOS.map((p, i) => {
            const feito = !naFila && i + 1 <= atual;
            return (
              <View key={p} style={[estilos.ponto, feito && estilos.pontoFeito]}>
                {feito ? <MaterialCommunityIcons name="check" size={14} color={cores.sobreMarca} /> : null}
              </View>
            );
          })}
        </View>
      </View>
      <View style={estilos.rotulos}>
        {naFila ? (
          <Texto variante="pequeno" negrito cor={cores.textoSuave}>
            Guardado no aparelho - envia quando tiver sinal
          </Texto>
        ) : (
          PASSOS.map((p, i) => (
            <Texto
              key={p}
              variante="pequeno"
              negrito={i + 1 === atual}
              cor={i + 1 <= atual ? cores.texto : cores.textoSuave}
              style={{ flex: 1, textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center' }}
            >
              {STATUS[p].rotulo}
            </Texto>
          ))
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trilho: { height: 22, justifyContent: 'center' },
  cheio: { position: 'absolute', left: 11, height: 4, backgroundColor: cores.marca, borderRadius: 2, maxWidth: '94%' },
  pontos: { flexDirection: 'row', justifyContent: 'space-between' },
  ponto: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pontoFeito: { backgroundColor: cores.marca, borderColor: cores.marca },
  rotulos: { flexDirection: 'row' },
});
