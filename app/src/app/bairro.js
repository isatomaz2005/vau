import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, raio } from '../../../shared/tokens';
import { bairros } from '../../../shared/bairros';
import { useVau } from '../lib/VauContext';
import { Texto } from '../components/ui';

export default function EscolherBairro() {
  const { bairro, escolherBairro, avisar } = useVau();

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <Texto cor={cores.textoSuave}>
        Você recebe os avisos da liderança deste bairro no topo do app. Dá para trocar quando quiser.
      </Texto>
      <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
        {bairros.map((b) => {
          const ativo = bairro === b.slug;
          return (
            <Pressable
              key={b.slug}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={`${b.nome}, ${b.zona}`}
              onPress={async () => {
                await escolherBairro(b.slug);
                avisar(`Bairro escolhido: ${b.nome}`, 'sucesso');
                router.back();
              }}
              style={[estilos.item, ativo && estilos.ativo]}
            >
              <MaterialCommunityIcons
                name={ativo ? 'radiobox-marked' : 'radiobox-blank'}
                size={24}
                color={ativo ? cores.marca : cores.textoSuave}
              />
              <View style={{ flex: 1 }}>
                <Texto negrito>{b.nome}</Texto>
                <Texto variante="pequeno" cor={cores.textoSuave}>
                  {b.zona}
                </Texto>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, gap: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: raio.md,
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  ativo: { borderColor: cores.marca, backgroundColor: cores.marcaClara },
});
