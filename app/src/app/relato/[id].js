import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, niveis, raio } from '../../../../shared/tokens';
import { bairroPorSlug, distancia, formatarDistancia, tempoRelativo } from '../../../../shared/bairros';
import { buscarRelato, escutarMudancas, votar } from '../../lib/api';
import { registrarVoto, votosFeitos } from '../../lib/local';
import { useVau } from '../../lib/VauContext';
import { NivelSelo } from '../../components/NivelSelo';
import { StatusTrilha } from '../../components/StatusTrilha';
import { Botao, Texto } from '../../components/ui';

export default function DetalheRelato() {
  const { id } = useLocalSearchParams();
  const { local, avisar } = useVau();
  const [relato, setRelato] = useState(null);
  const [jaVotou, setJaVotou] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarRelato(id).then(setRelato).catch(() => setErro('Não deu para abrir este ponto agora.'));
    votosFeitos().then((v) => setJaVotou(v.includes(id)));
    return escutarMudancas({
      onRelato: ({ new: novo }) => {
        if (novo?.id === id) setRelato(novo);
      },
    });
  }, [id]);

  async function enviarVoto(tipo) {
    try {
      const atualizado = await votar(id, tipo);
      setRelato(atualizado);
      await registrarVoto(id);
      setJaVotou(true);
      avisar(
        tipo === 'ainda_assim' ? 'Obrigado! Você confirmou que ainda está alagado.' : 'Obrigado! Você avisou que a água baixou.',
        'sucesso'
      );
    } catch {
      avisar('Sem conexão. Tente confirmar de novo daqui a pouco.');
    }
  }

  if (erro) {
    return (
      <View style={estilos.centro}>
        <Texto>{erro}</Texto>
      </View>
    );
  }
  if (!relato) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={cores.marca} accessibilityLabel="Carregando ponto" />
      </View>
    );
  }

  const n = niveis[relato.nivel];
  const dist = local ? formatarDistancia(distancia(local, relato)) : null;

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <NivelSelo nivel={relato.nivel} grande />
      <Texto variante="titulo" accessibilityRole="header">
        {relato.referencia || 'Ponto sem referência'}
      </Texto>
      <Texto cor={cores.textoSuave}>
        {bairroPorSlug(relato.bairro)?.nome}
        {dist ? ` - a ${dist} de você` : ''} - {tempoRelativo(relato.criado_em)}
      </Texto>

      <View style={[estilos.nivel, { backgroundColor: n.fundo }]}>
        <MaterialCommunityIcons name={n.icone} size={24} color={n.cor} />
        <Texto cor={n.cor} style={{ flex: 1 }}>
          {n.descricao}
        </Texto>
      </View>

      {relato.foto_url ? (
        <Image
          source={{ uri: relato.foto_url }}
          style={estilos.foto}
          accessible
          accessibilityLabel={`Foto enviada por um morador${relato.descricao ? `: ${relato.descricao}` : ''}`}
        />
      ) : null}

      {relato.descricao ? (
        <View style={{ gap: 4 }}>
          <Texto negrito>O que o morador viu</Texto>
          <Texto>{relato.descricao}</Texto>
        </View>
      ) : null}

      <View style={estilos.caixa}>
        <Texto negrito>Status</Texto>
        <StatusTrilha status={relato.status} />
      </View>

      <View style={estilos.caixa}>
        <Texto negrito accessibilityRole="header">
          Você está perto? Ajude os vizinhos
        </Texto>
        <View style={estilos.contagem}>
          <Contagem icone="water" valor={relato.ainda_assim} rotulo="ainda está assim" />
          <Contagem icone="water-off" valor={relato.ja_baixou} rotulo="dizem que baixou" />
        </View>
        {jaVotou ? (
          <View style={estilos.linha}>
            <MaterialCommunityIcons name="check-circle" size={20} color={cores.sucesso} />
            <Texto cor={cores.sucesso} negrito>
              Você já respondeu sobre este ponto
            </Texto>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Botao titulo="Ainda está assim" icone="water" onPress={() => enviarVoto('ainda_assim')} />
            <Botao titulo="Já baixou" icone="water-off" variante="secundario" onPress={() => enviarVoto('ja_baixou')} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Contagem({ icone, valor, rotulo }) {
  return (
    <View style={estilos.cont} accessible accessibilityLabel={`${valor} ${valor === 1 ? 'pessoa' : 'pessoas'}: ${rotulo}`}>
      <MaterialCommunityIcons name={icone} size={22} color={cores.marca} />
      <Texto variante="titulo">{valor}</Texto>
      <Texto variante="pequeno" cor={cores.textoSuave} style={{ textAlign: 'center' }}>
        {rotulo}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, gap: 16, paddingBottom: 48 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  nivel: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: raio.md },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: raio.md },
  caixa: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
        padding: 16,
    gap: 12,
  },
  contagem: { flexDirection: 'row', gap: 12 },
  cont: { flex: 1, alignItems: 'center', backgroundColor: cores.marcaClara, borderRadius: raio.md, padding: 12 },
  linha: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
