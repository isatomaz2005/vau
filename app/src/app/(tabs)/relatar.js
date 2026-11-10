import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores, niveis, ordemNiveis, raio } from '../../../../shared/tokens';
import { bairroMaisProximo, bairroPorSlug, bairros } from '../../../../shared/bairros';
import { useVau } from '../../lib/VauContext';
import { enviarOuGuardar } from '../../lib/fila';
import { useDuracoes } from '../../hooks/useMovimentoReduzido';
import { BarraConexao } from '../../components/Avisos';
import { NivelSelo } from '../../components/NivelSelo';
import { Botao, FONTE, Texto } from '../../components/ui';

// Relatar em 3 toques: aba Relatar → nível → Enviar. Local é automático; foto e detalhe são opcionais.
const PASSOS = ['Como está a água?', 'Onde é?', 'Foto e detalhe (opcional)'];

export default function Relatar() {
  const { local, bairro, avisar } = useVau();
  const { medio, lento, reduzido } = useDuracoes();
  const [passo, setPasso] = useState(0);
  const [nivel, setNivel] = useState(null);
  const [referencia, setReferencia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState(null);
  const [bairroEscolhido, setBairroEscolhido] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const progresso = useRef(new Animated.Value(1)).current;
  const conteudo = useRef(new Animated.Value(1)).current;
  const check = useRef(new Animated.Value(0)).current;

  const detectado = local ? bairroMaisProximo(local) : null;
  const bairroFinal = bairroEscolhido || detectado?.slug || bairro;
  const b = bairroPorSlug(bairroFinal);
  const usaGps = Boolean(local && detectado && !bairroEscolhido);

  // A barra de progresso anda junto com o passo: o morador sabe quanto falta.
  useEffect(() => {
    Animated.timing(progresso, { toValue: passo + 1, duration: medio, useNativeDriver: false }).start();
    // O conteúdo do passo entra deslizando da direita: reforça que é "o próximo".
    conteudo.setValue(reduzido ? 1 : 0);
    Animated.timing(conteudo, { toValue: 1, duration: medio, useNativeDriver: true }).start();
  }, [passo]);

  function escolherNivel(n) {
    setNivel(n);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTimeout(() => setPasso(1), reduzido ? 0 : 180);
  }

  async function tirarFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    const opcoes = { quality: 0.5, allowsEditing: false };
    const r = perm.granted
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync(opcoes);
    if (!r.canceled) setFoto(r.assets[0].uri);
  }

  async function enviar() {
    if (!nivel || !b) return;
    setEnviando(true);
    const rascunho = {
      bairro: b.slug,
      lat: usaGps ? local.lat : b.lat,
      lng: usaGps ? local.lng : b.lng,
      referencia: referencia.trim(),
      descricao: descricao.trim(),
      nivel,
      fotoLocal: foto,
    };
    const r = await enviarOuGuardar(rascunho);
    setEnviando(false);
    setResultado(r.resultado);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    avisar(
      r.resultado === 'enviado'
        ? 'Relato enviado. Os vizinhos já podem ver.'
        : 'Sem sinal agora. Guardamos o relato e enviamos sozinho depois.',
      r.resultado === 'enviado' ? 'sucesso' : 'info'
    );
    check.setValue(reduzido ? 1 : 0);
    Animated.spring(check, { toValue: 1, useNativeDriver: true, bounciness: 12 }).start();
  }

  function recomecar() {
    setPasso(0);
    setNivel(null);
    setReferencia('');
    setDescricao('');
    setFoto(null);
    setBairroEscolhido(null);
    setResultado(null);
  }

  if (resultado) {
    const ok = resultado === 'enviado';
    return (
      <View style={estilos.final}>
        <Animated.View
          style={[
            estilos.checkCirculo,
            { backgroundColor: ok ? cores.sucesso : cores.marca },
            { transform: [{ scale: check }] },
          ]}
        >
          <MaterialCommunityIcons name={ok ? 'check-bold' : 'cloud-clock'} size={56} color={cores.fundo} />
        </Animated.View>
        <Texto variante="titulo" style={{ textAlign: 'center' }} accessibilityRole="header">
          {ok ? 'Relato enviado!' : 'Relato guardado'}
        </Texto>
        <Texto cor={cores.textoSuave} style={{ textAlign: 'center' }}>
          {ok
            ? 'Ele já aparece para os vizinhos e para a liderança do bairro. Você acompanha o status em Meus relatos.'
            : 'Você está sem conexão. Assim que o sinal voltar, o Vau envia sozinho. Não precisa fazer nada.'}
        </Texto>
        <View style={{ gap: 12, alignSelf: 'stretch' }}>
          <Botao titulo="Ver meus relatos" icone="clipboard-text" onPress={() => { recomecar(); router.push('/meus'); }} />
          <Botao titulo="Relatar outro ponto" variante="secundario" onPress={recomecar} />
        </View>
      </View>
    );
  }

  const largura = progresso.interpolate({ inputRange: [0, 3], outputRange: ['0%', '100%'] });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BarraConexao />
      <View
        style={estilos.cabecalho}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Passo ${passo + 1} de 3: ${PASSOS[passo]}`}
        accessibilityValue={{ min: 1, max: 3, now: passo + 1 }}
      >
        <Texto variante="pequeno" negrito cor={cores.textoSuave}>
          PASSO {passo + 1} DE 3
        </Texto>
        <View style={estilos.trilho}>
          <Animated.View style={[estilos.barra, { width: largura }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Animated.View
          style={{
            gap: 16,
            opacity: conteudo,
            transform: [{ translateX: conteudo.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }}
        >
          <Texto variante="titulo" accessibilityRole="header">
            {PASSOS[passo]}
          </Texto>

          {passo === 0 &&
            ordemNiveis.map((n) => (
              <OpcaoNivel key={n} nivel={n} marcado={nivel === n} onPress={() => escolherNivel(n)} />
            ))}

          {passo === 1 && (
            <>
              <NivelSelo nivel={nivel} grande />
              <View style={estilos.localCaixa}>
                <MaterialCommunityIcons
                  name={usaGps ? 'crosshairs-gps' : 'map-marker-radius'}
                  size={24}
                  color={cores.marca}
                />
                <View style={{ flex: 1 }}>
                  <Texto negrito>{b ? b.nome : 'Escolha o bairro abaixo'}</Texto>
                  <Texto variante="pequeno" cor={cores.textoSuave}>
                    {usaGps ? 'Pela sua localização atual' : 'Sem GPS: usando o centro do bairro'}
                  </Texto>
                </View>
              </View>

              <Texto negrito nativeID="rotulo-ref">
                Rua ou ponto de referência
              </Texto>
              <TextInput
                accessibilityLabelledBy="rotulo-ref"
                accessibilityLabel="Rua ou ponto de referência"
                accessibilityHint="Opcional. Exemplo: Rua das Flores, perto do mercado"
                placeholder="Ex.: Rua das Flores, perto do mercado"
                placeholderTextColor={cores.textoSuave}
                value={referencia}
                onChangeText={setReferencia}
                style={estilos.campo}
                maxLength={120}
                returnKeyType="done"
              />

              <Texto negrito>Bairro</Texto>
              <View style={estilos.bairros}>
                {bairros.map((x) => (
                  <Pressable
                    key={x.slug}
                    onPress={() => setBairroEscolhido(x.slug)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: bairroFinal === x.slug }}
                    style={[estilos.chip, bairroFinal === x.slug && estilos.chipAtivo]}
                  >
                    <Texto variante="pequeno" negrito cor={bairroFinal === x.slug ? cores.sobreMarca : cores.texto}>
                      {x.nome}
                    </Texto>
                  </Pressable>
                ))}
              </View>

              <Botao
                titulo={enviando ? 'Enviando…' : 'Enviar agora'}
                icone="send"
                grande
                desabilitado={!b || enviando}
                onPress={enviar}
                dica="Envia o relato para os vizinhos e para a liderança"
              />
              <Botao titulo="Adicionar foto ou detalhe" icone="camera" variante="secundario" onPress={() => setPasso(2)} />
              <Botao titulo="Voltar e trocar o nível" variante="discreto" onPress={() => setPasso(0)} />
            </>
          )}

          {passo === 2 && (
            <>
              {foto ? (
                <View style={{ gap: 8 }}>
                  <Image
                    source={{ uri: foto }}
                    style={estilos.foto}
                    accessible
                    accessibilityLabel="Foto do alagamento que você tirou"
                  />
                  <Botao titulo="Trocar foto" variante="discreto" icone="camera-retake" onPress={tirarFoto} />
                </View>
              ) : (
                <Botao titulo="Tirar foto" icone="camera" variante="secundario" onPress={tirarFoto} grande />
              )}
              <Texto negrito>O que você está vendo?</Texto>
              <TextInput
                accessibilityLabel="O que você está vendo? Opcional"
                placeholder="Ex.: correnteza forte, carro parado, bueiro devolvendo água"
                placeholderTextColor={cores.textoSuave}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                style={[estilos.campo, { minHeight: 96, textAlignVertical: 'top' }]}
                maxLength={280}
              />
              <Botao
                titulo={enviando ? 'Enviando…' : 'Enviar relato'}
                icone="send"
                grande
                desabilitado={!b || enviando}
                onPress={enviar}
              />
              <Botao titulo="Voltar" variante="discreto" onPress={() => setPasso(1)} />
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function OpcaoNivel({ nivel, marcado, onPress }) {
  const n = niveis[nivel];
  const escala = useRef(new Animated.Value(1)).current;
  const { reduzido } = useDuracoes();
  useEffect(() => {
    if (marcado && !reduzido) {
      Animated.sequence([
        Animated.timing(escala, { toValue: 1.04, duration: 100, useNativeDriver: true }),
        Animated.spring(escala, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [marcado]);
  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ checked: marcado }}
        accessibilityLabel={`${n.rotulo}. ${n.descricao}`}
        style={[
          estilos.opcao,
          { borderColor: marcado ? n.cor : cores.borda, backgroundColor: marcado ? n.fundo : cores.superficie },
        ]}
      >
        <View style={[estilos.opcaoIcone, { backgroundColor: n.fundo }]}>
          <MaterialCommunityIcons name={n.icone} size={34} color={n.cor} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="destaque" negrito cor={n.cor}>
            {n.rotulo}
          </Texto>
          <Texto variante="pequeno" cor={cores.texto}>
            {n.descricao}
          </Texto>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { paddingHorizontal: 16, paddingTop: 12, gap: 6 },
  trilho: { height: 8, backgroundColor: cores.superficieAlta, borderRadius: 4, overflow: 'hidden' },
  barra: { height: 8, backgroundColor: cores.marca, borderRadius: 4 },
  conteudo: { padding: 16, paddingBottom: 140 },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: raio.lg,
    borderWidth: 2.5,
    minHeight: 88,
  },
  opcaoIcone: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  localCaixa: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    backgroundColor: cores.marcaClara,
    borderRadius: raio.md,
  },
  campo: {
    fontFamily: FONTE,
    fontSize: 17,
    color: cores.texto,
    borderWidth: 1.5,
    borderColor: cores.textoSuave,
    borderRadius: raio.md,
    backgroundColor: cores.superficieAlta,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 52,
  },
  bairros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: raio.pilula,
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: cores.superficieAlta,
  },
  chipAtivo: { backgroundColor: cores.marca, borderColor: cores.marca },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: raio.md },
  final: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  checkCirculo: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
});
