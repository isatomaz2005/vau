import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { niveis, raio } from '../../../shared/tokens';
import { Texto } from './ui';

// Nível sempre com ícone + texto + cor: quem não distingue cores entende pelo ícone e pela palavra.
export function NivelSelo({ nivel, grande }) {
  const n = niveis[nivel];
  if (!n) return null;
  return (
    <View
      accessible
      accessibilityLabel={`Nível: ${n.rotulo}`}
      style={[estilos.selo, { backgroundColor: n.fundo, borderColor: n.cor }, grande && estilos.grande]}
    >
      <MaterialCommunityIcons name={n.icone} size={grande ? 22 : 18} color={n.cor} />
      <Texto negrito variante={grande ? 'destaque' : 'pequeno'} cor={n.cor}>
        {n.rotulo}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: raio.sm,
    borderWidth: 1.5,
  },
  grande: { paddingHorizontal: 14, paddingVertical: 8 },
});
