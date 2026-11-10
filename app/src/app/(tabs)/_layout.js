import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../../../../shared/tokens';
import { FONTE, FONTE_NEGRITO } from '../../components/ui';
import { Toast } from '../../components/Avisos';
import { useVau } from '../../lib/VauContext';

function Icone(nome) {
  return ({ color, focused }) => (
    <MaterialCommunityIcons name={focused ? nome : `${nome}-outline`} size={26} color={color} />
  );
}

export default function TabsLayout() {
  const { naFila } = useVau();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: cores.fundo },
          headerShadowVisible: false,
          headerTintColor: cores.texto,
          headerTitleStyle: { fontFamily: FONTE_NEGRITO, fontSize: 20 },
          tabBarActiveTintColor: cores.marca,
          tabBarInactiveTintColor: cores.textoSuave,
          tabBarLabelStyle: { fontFamily: FONTE, fontSize: 13 },
          tabBarStyle: { minHeight: 64, paddingTop: 6, backgroundColor: cores.superficie, borderTopColor: cores.borda },
          tabBarItemStyle: { minHeight: 48 },
          sceneStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Perto de mim', tabBarLabel: 'Início', tabBarIcon: Icone('home') }}
        />
        <Tabs.Screen
          name="relatar"
          options={{
            title: 'Relatar alagamento',
            tabBarLabel: 'Relatar',
            tabBarIcon: Icone('plus-circle'),
            tabBarAccessibilityLabel: 'Relatar alagamento',
          }}
        />
        <Tabs.Screen
          name="meus"
          options={{
            title: 'Meus relatos',
            tabBarLabel: 'Meus relatos',
            tabBarIcon: Icone('clipboard-text'),
            tabBarBadge: naFila || undefined,
            tabBarAccessibilityLabel: naFila
              ? `Meus relatos, ${naFila} guardado${naFila > 1 ? 's' : ''} no aparelho`
              : 'Meus relatos',
          }}
        />
      </Tabs>
      <Toast />
    </View>
  );
}

