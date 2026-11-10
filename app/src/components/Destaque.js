import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, gravidade, niveis, ordemNiveis, raio } from '../../../shared/tokens';
import { formatarDistancia, tempoRelativo } from '../../../shared/bairros';
import { useDuracoes } from '../hooks/useMovimentoReduzido';
import { Texto } from './ui';

export function piorNivel(lista) {
  return lista.reduce((p, r) => (!p || gravidade[r.nivel] > gravidade[p] ? r.nivel : p), null);
}

// Círculo do nível com ícone (versão grande, usada no destaque e nos blocos).
export function NivelIcone({ nivel, tamanho = 52, fundo }) {
  const n = niveis[nivel];
  if (!n) return null;
  return (
    <View
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        backgroundColor: fundo || n.fundo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name={n.icone} size={tamanho * 0.55} color={n.cor} />
    </View>
  );
}

// Card azul-claro com o "número do momento" do bairro, como a temperatura num app de clima.
export function DestaqueBairro({ nome, relatos }) {
  const { lento, reduzido } = useDuracoes();
  const numero = useRef(new Animated.Value(reduzido ? 1 : 0.6)).current;
  const pior = piorNivel(relatos);
  const conta = Object.fromEntries(ordemNiveis.map((n) => [n, relatos.filter((r) => r.nivel === n).length]));
  const ultimo = relatos[0];

  // Quando o número muda (chegou ou saiu um ponto), ele "pulsa" de leve para chamar atenção.
  useEffect(() => {
    if (reduzido) return;
    numero.setValue(0.6);
    Animated.spring(numero, { toValue: 1, useNativeDriver: true, bounciness: 10 }).start();
  }, [relatos.length]);

  const rotulo = `${nome}: ${relatos.length} ${relatos.length === 1 ? 'ponto alagado' : 'pontos alagados'} agora. ${
    pior ? `Pior trecho: ${niveis[pior].rotulo}.` : 'Caminhos livres.'
  }`;

  return (
    <View style={estilos.destaque} accessible accessibilityRole="summary" accessibilityLabel={rotulo}>
      <View style={estilos.topo}>
        <Texto negrito variante="destaque" cor={cores.sobreMarca}>
          {nome}
        </Texto>
        <Texto negrito cor={cores.sobreMarca}>
          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Texto>
      </View>
      <View style={estilos.meio}>
        <View>
          <Animated.Text
            maxFontSizeMultiplier={1.4}
            style={[estilos.numero, { transform: [{ scale: numero }] }]}
          >
            {relatos.length}
          </Animated.Text>
          <Texto negrito cor={cores.sobreMarca}>
            {relatos.length === 1 ? 'ponto alagado agora' : 'pontos alagados agora'}
          </Texto>
        </View>
        {pior ? (
          <NivelIcone nivel={pior} tamanho={84} fundo={cores.fundo} />
        ) : (
          <View style={[estilos.livre]}>
            <MaterialCommunityIcons name="check-bold" size={44} color={cores.sucesso} />
          </View>
        )}
      </View>
      <View style={estilos.dados}>
        {ordemNiveis
          .slice()
          .reverse()
          .map((n) => (
            <Dado key={n} rotulo={niveis[n].rotulo} valor={conta[n]} />
          ))}
        <Dado rotulo="Último relato" valor={ultimo ? tempoRelativo(ultimo.criado_em) : '-'} />
      </View>
    </View>
  );
}

function Dado({ rotulo, valor }) {
  return (
    <View style={estilos.dado}>
      <Texto variante="pequeno" cor={cores.sobreMarca}>
        {rotulo}
      </Texto>
      <Texto variante="pequeno" negrito cor={cores.sobreMarca}>
        {valor}
      </Texto>
    </View>
  );
}

// Bloco vertical de um ponto (como a previsão por hora): tempo, ícone, referência e nível.
export function BlocoPonto({ relato, distancia, novo, onPress }) {
  const n = niveis[relato.nivel];
  const { lento, reduzido } = useDuracoes();
  const brilho = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!novo) return;
    brilho.setValue(1);
    Animated.timing(brilho, { toValue: 0, duration: reduzido ? 0 : lento * 5, useNativeDriver: false }).start();
  }, [novo]);
  const dist = formatarDistancia(distancia);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${novo ? 'Novo. ' : ''}${n.rotulo}: ${relato.referencia || 'sem referência'}${
        dist ? `, a ${dist}` : ''
      }, ${tempoRelativo(relato.criado_em)}`}
      accessibilityHint="Abre o detalhe do ponto"
      style={{ alignSelf: "stretch" }}
    >
      <Animated.View
        style={[
          estilos.bloco,
          { flex: 1 },
          {
            borderColor: brilho.interpolate({ inputRange: [0, 1], outputRange: [cores.superficie, cores.acento] }),
          },
        ]}
      >
        <Texto variante="pequeno" cor={cores.textoSuave} style={estilos.blocoTempo}>
          {dist || tempoRelativo(relato.criado_em)}
        </Texto>
        <NivelIcone nivel={relato.nivel} />
        <Texto negrito variante="pequeno" numberOfLines={3} style={{ textAlign: 'center' }}>
          {relato.referencia || 'Sem referência'}
        </Texto>
        <Texto negrito variante="pequeno" cor={n.cor} style={{ marginTop: 'auto' }}>
          {n.rotulo}
        </Texto>
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  destaque: { backgroundColor: cores.marca, borderRadius: raio.lg, padding: 20, gap: 14 },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,17,20,0.15)',
  },
  meio: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 76,
    lineHeight: 80,
    color: cores.sobreMarca,
    letterSpacing: -2,
  },
  livre: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dados: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4, columnGap: 16 },
  dado: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, minWidth: '45%' },
  bloco: {
    width: 128,
    minHeight: 200,
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
    gap: 10,
  },
  blocoTempo: {
    alignSelf: 'stretch',
    textAlign: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
});
