import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, niveis, ordemNiveis, raio } from '../../../../shared/tokens';
import { bairroPorSlug, distancia } from '../../../../shared/bairros';
import { useVau } from '../../lib/VauContext';
import { AvisoBanner } from '../../components/AvisoBanner';
import { RelatoCard } from '../../components/RelatoCard';
import { BarraConexao } from '../../components/Avisos';
import { BlocoPonto, DestaqueBairro } from '../../components/Destaque';
import { Botao, Texto } from '../../components/ui';

export default function Inicio() {
  const { bairro, relatos, aviso, local, carregando, erro, recarregar, recentes } = useVau();
  const [filtro, setFiltro] = useState('todos');
  const [atualizando, setAtualizando] = useState(false);
  const meuBairro = bairroPorSlug(bairro);
  const origem = local || (meuBairro && { lat: meuBairro.lat, lng: meuBairro.lng });

  // Mais perto primeiro.
  const porDistancia = useMemo(
    () =>
      relatos
        .map((r) => ({ r, d: origem ? distancia(origem, r) : null }))
        .sort((a, b) => (a.d ?? 0) - (b.d ?? 0)),
    [relatos, origem?.lat, origem?.lng]
  );
  const doMeuBairro = useMemo(() => relatos.filter((r) => r.bairro === bairro), [relatos, bairro]);
  const lista = porDistancia.filter((i) => filtro === 'todos' || i.r.nivel === filtro).slice(0, 50);

  if (bairro === null) {
    return (
      <View style={[estilos.vazio, { flex: 1 }]}>
        <View style={estilos.circulo}>
          <MaterialCommunityIcons name="home-map-marker" size={48} color={cores.sobreMarca} />
        </View>
        <Texto variante="titulo" style={{ textAlign: 'center' }}>
          Onde você mora ou passa todo dia?
        </Texto>
        <Texto cor={cores.textoSuave} style={{ textAlign: 'center' }}>
          Escolha o bairro para receber os avisos da liderança de lá.
        </Texto>
        <Botao titulo="Escolher bairro" icone="map-search" onPress={() => router.push('/bairro')} grande />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BarraConexao />
      <FlatList
        data={lista}
        keyExtractor={(i) => i.r.id}
        contentContainerStyle={estilos.conteudo}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={async () => {
              setAtualizando(true);
              await recarregar();
              setAtualizando(false);
            }}
            tintColor={cores.marca}
            colors={[cores.sobreMarca]}
            progressBackgroundColor={cores.marca}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <Pressable
              onPress={() => router.push('/bairro')}
              accessibilityRole="button"
              accessibilityLabel={`Seu bairro: ${meuBairro?.nome}. Toque para trocar.`}
              style={estilos.local}
            >
              <MaterialCommunityIcons name="map-marker" size={20} color={cores.marca} />
              <Texto negrito style={{ flex: 1 }}>
                {meuBairro?.nome}
                <Texto cor={cores.textoSuave}>, {meuBairro?.zona}</Texto>
              </Texto>
              <MaterialCommunityIcons name="chevron-down" size={22} color={cores.textoSuave} />
            </Pressable>

            <AvisoBanner aviso={aviso} />

            {erro ? (
              <View style={estilos.erro} accessibilityRole="alert">
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={cores.erro} />
                <Texto variante="pequeno" cor={cores.erro} style={{ flex: 1 }}>
                  {erro}
                </Texto>
              </View>
            ) : null}

            <DestaqueBairro nome={meuBairro?.nome} relatos={doMeuBairro} />

            {porDistancia.length ? (
              <View style={{ gap: 12 }}>
                <Texto variante="destaque" negrito accessibilityRole="header">
                  Perto de você
                </Texto>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingRight: 16 }}
                  style={{ marginRight: -16 }}
                >
                  {porDistancia.slice(0, 8).map(({ r, d }) => (
                    <BlocoPonto
                      key={r.id}
                      relato={r}
                      distancia={d}
                      novo={recentes.has(r.id)}
                      onPress={() => router.push(`/relato/${r.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={{ gap: 10 }}>
              <Texto variante="destaque" negrito accessibilityRole="header">
                Todos os pontos
              </Texto>
              <View style={estilos.filtros} accessibilityRole="radiogroup" accessibilityLabel="Filtrar por nível">
                <Filtro ativo={filtro === 'todos'} onPress={() => setFiltro('todos')} rotulo="Todos" />
                {ordemNiveis.map((n) => (
                  <Filtro
                    key={n}
                    ativo={filtro === n}
                    onPress={() => setFiltro(n)}
                    rotulo={niveis[n].rotulo}
                    icone={niveis[n].icone}
                    cor={niveis[n].cor}
                  />
                ))}
              </View>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item, index }) => (
          <RelatoCard
            relato={item.r}
            distancia={item.d}
            novo={recentes.has(item.r.id)}
            indice={index}
            onPress={() => router.push(`/relato/${item.r.id}`)}
          />
        )}
        ListEmptyComponent={
          carregando ? null : (
            <View style={estilos.vazio}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={48} color={cores.marca} />
              <Texto negrito variante="destaque" style={{ textAlign: 'center' }}>
                Nenhum alagamento relatado {filtro === 'todos' ? 'agora' : 'com esse nível'}
              </Texto>
              <Texto cor={cores.textoSuave} style={{ textAlign: 'center' }}>
                Viu água na rua? Avise os vizinhos pela aba Relatar.
              </Texto>
            </View>
          )
        }
      />
    </View>
  );
}

function Filtro({ ativo, onPress, rotulo, icone, cor }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: ativo }}
      accessibilityLabel={rotulo}
      style={[estilos.filtro, ativo && estilos.filtroAtivo]}
      hitSlop={4}
    >
      {icone ? <MaterialCommunityIcons name={icone} size={16} color={ativo ? cores.sobreMarca : cor} /> : null}
      <Texto variante="pequeno" negrito cor={ativo ? cores.sobreMarca : cores.texto}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, paddingBottom: 120 },
  local: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.superficie,
    borderRadius: raio.pilula,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  erro: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#3D1D1B',
    borderRadius: raio.md,
  },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filtro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: raio.pilula,
    backgroundColor: cores.superficie,
  },
  filtroAtivo: { backgroundColor: cores.marca },
  vazio: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  circulo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
