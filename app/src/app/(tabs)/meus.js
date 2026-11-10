import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, raio } from '../../../../shared/tokens';
import { bairroPorSlug, tempoRelativo } from '../../../../shared/bairros';
import { buscarMeusRelatos, escutarMudancas } from '../../lib/api';
import { itensDaFila } from '../../lib/fila';
import { useVau } from '../../lib/VauContext';
import { BarraConexao } from '../../components/Avisos';
import { NivelSelo } from '../../components/NivelSelo';
import { StatusTrilha } from '../../components/StatusTrilha';
import { Botao, Texto } from '../../components/ui';

// Acompanhamento: o morador vê o status mudar quando a liderança age na web.
export default function Meus() {
  const { naFila, avisar } = useVau();
  const [enviados, setEnviados] = useState([]);
  const [guardados, setGuardados] = useState([]);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    setGuardados(await itensDaFila());
    try {
      setEnviados(await buscarMeusRelatos());
    } catch {
      // sem conexão: mantém o que já estava na tela
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  useEffect(() => {
    carregar();
  }, [naFila]);

  // Tempo real: status mudou na web → muda aqui e o leitor de tela anuncia.
  useEffect(() => {
    return escutarMudancas({
      onRelato: ({ eventType, new: novo, old }) => {
        if (eventType !== 'UPDATE' || !novo) return;
        setEnviados((lista) => {
          const antes = lista.find((r) => r.id === novo.id);
          if (!antes) return lista;
          if (antes.status !== novo.status) {
            const msg = {
              confirmado: 'A liderança confirmou seu relato.',
              resolvido: 'Seu relato foi marcado como resolvido: a água baixou.',
              descartado: 'A liderança não encontrou o alagamento do seu relato.',
            }[novo.status];
            if (msg) avisar(msg, novo.status === 'descartado' ? 'info' : 'sucesso');
          }
          return lista.map((r) => (r.id === novo.id ? novo : r));
        });
      },
    });
  }, [avisar]);

  const itens = [
    ...guardados.map((g, i) => ({ ...g, id: `fila-${i}`, naFila: true, criado_em: g.criadoEm })),
    ...enviados,
  ];

  return (
    <View style={{ flex: 1 }}>
      <BarraConexao />
      <FlatList
        data={itens}
        keyExtractor={(i) => i.id}
        contentContainerStyle={estilos.conteudo}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={async () => {
              setAtualizando(true);
              await carregar();
              setAtualizando(false);
            }}
            colors={[cores.marca]}
            tintColor={cores.marca}
          />
        }
        renderItem={({ item }) => (
          <View style={estilos.card}>
            <View style={estilos.linha}>
              <NivelSelo nivel={item.nivel} />
              <Texto variante="pequeno" cor={cores.textoSuave}>
                {tempoRelativo(item.criado_em)}
              </Texto>
            </View>
            <Texto negrito variante="destaque">
              {item.referencia || 'Ponto sem referência'}
            </Texto>
            <Texto variante="pequeno" cor={cores.textoSuave}>
              {bairroPorSlug(item.bairro)?.nome}
            </Texto>
            <StatusTrilha status={item.status} naFila={item.naFila} />
            {!item.naFila ? (
              <Botao
                titulo="Ver detalhe"
                variante="discreto"
                icone="chevron-right"
                onPress={() => router.push(`/relato/${item.id}`)}
                rotulo={`Ver detalhe do relato ${item.referencia || ''}`}
              />
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <View style={estilos.vazio}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={cores.marca} />
            <Texto negrito variante="destaque" style={{ textAlign: 'center' }}>
              Você ainda não relatou nenhum alagamento
            </Texto>
            <Texto cor={cores.textoSuave} style={{ textAlign: 'center' }}>
              Quando relatar, você acompanha aqui se a liderança confirmou e quando a água baixou.
            </Texto>
            <Botao titulo="Relatar agora" icone="plus-circle" onPress={() => router.push('/relatar')} />
          </View>
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, paddingBottom: 120 },
  card: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
        padding: 16,
    gap: 10,
  },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  vazio: { alignItems: 'center', gap: 12, padding: 32 },
});
