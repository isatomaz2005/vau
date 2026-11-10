import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import { cores } from '../../../shared/tokens';
import { VauProvider } from '../lib/VauContext';
import { useMovimentoReduzido } from '../hooks/useMovimentoReduzido';
import { FONTE_NEGRITO } from '../components/ui';

export default function RootLayout() {
  const [fontesProntas] = useFonts({ AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold });
  const reduzido = useMovimentoReduzido();

  if (!fontesProntas) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator color={cores.marca} accessibilityLabel="Carregando o Vau" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <VauProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: cores.fundo },
          headerShadowVisible: false,
            headerTintColor: cores.texto,
            headerTitleStyle: { fontFamily: FONTE_NEGRITO },
            contentStyle: { backgroundColor: cores.fundo },
            // Transição lateral: o detalhe "entra" sobre a lista e o voltar desfaz o caminho.
            animation: reduzido ? 'none' : 'slide_from_right',
            headerBackTitle: 'Voltar',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="relato/[id]" options={{ title: 'Ponto de alagamento' }} />
          <Stack.Screen
            name="bairro"
            options={{
              title: 'Seu bairro',
              presentation: 'modal',
              animation: reduzido ? 'none' : 'slide_from_bottom',
            }}
          />
        </Stack>
      </VauProvider>
    </SafeAreaProvider>
  );
}
