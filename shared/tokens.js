// Identidade visual comum ao app e à web. Tema escuro: menos brilho na rua à noite e menos bateria em tela OLED.
// Todas as combinações de texto foram conferidas por cálculo (WCAG AA, 4,5:1 ou mais). Veja docs/contraste.md.

export const cores = {
  fundo: '#0F1114',
  superficie: '#1B1E23', // cards
  superficieAlta: '#262B31', // cards dentro de cards, campos, chips
  borda: '#343A42',
  texto: '#F3F5F7',
  textoSuave: '#A7B0B9',
  // Destaque azul-claro (água). Usado no card principal e nos botões, sempre com texto escuro por cima.
  marca: '#B9E2F5',
  marcaForte: '#8FCDEB',
  sobreMarca: '#0F1114',
  marcaClara: '#1E2E38', // fundo azulado escuro para caixas informativas
  acento: '#F2B705',
  foco: '#B9E2F5',
  sucesso: '#6FD39A',
  erro: '#FF8A80',
};

// Nível do alagamento: nunca depende só da cor. Sempre ícone + texto + cor.
export const niveis = {
  passavel: {
    rotulo: 'Passável',
    descricao: 'Água rasa, dá para passar com cuidado',
    cor: '#6FD39A',
    fundo: '#173226',
    icone: 'check-circle',
    simbolo: '✓',
  },
  perigoso: {
    rotulo: 'Perigoso',
    descricao: 'Água na canela ou correnteza, evite a pé ou de moto',
    cor: '#F7BE5A',
    fundo: '#3A2C12',
    icone: 'alert',
    simbolo: '!',
  },
  intransitavel: {
    rotulo: 'Intransitável',
    descricao: 'Não passe: água alta ou carros parados',
    cor: '#FF8A80',
    fundo: '#3D1D1B',
    icone: 'close-octagon',
    simbolo: '✕',
  },
};

export const ordemNiveis = ['passavel', 'perigoso', 'intransitavel'];

// Do menos ao mais grave (para saber o pior nível de um bairro).
export const gravidade = { passavel: 1, perigoso: 2, intransitavel: 3 };

// Status do relato, do ponto de vista de quem relatou.
export const status = {
  novo: { rotulo: 'Enviado', descricao: 'Aguardando confirmação da comunidade', passo: 1 },
  confirmado: { rotulo: 'Confirmado', descricao: 'A liderança do bairro confirmou o alagamento', passo: 2 },
  resolvido: { rotulo: 'Resolvido', descricao: 'A água baixou, o caminho está livre', passo: 3 },
  descartado: { rotulo: 'Não confirmado', descricao: 'A liderança não encontrou o alagamento', passo: 0 },
};

// Nível do aviso emitido para o bairro.
export const avisos = {
  atencao: { rotulo: 'Atenção', cor: '#F7BE5A', fundo: '#3A2C12', icone: 'alert-circle' },
  alerta: { rotulo: 'Alerta', cor: '#FF8A80', fundo: '#3D1D1B', icone: 'alert' },
  emergencia: { rotulo: 'Emergência', cor: '#0F1114', fundo: '#FF8A80', icone: 'alarm-light' },
};

export const espaco = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const raio = { sm: 10, md: 16, lg: 24, pilula: 999 };

// Tamanho mínimo de área de toque (app) e de alvo clicável (web).
export const toqueMinimo = 48;

// Durações de movimento. Com "reduzir movimento" ligado, tudo vira 0.
export const movimento = {
  rapido: 150,
  medio: 250,
  lento: 400,
};

export const fonte = {
  familia: 'Atkinson Hyperlegible',
  tamanhos: { pequeno: 14, corpo: 17, destaque: 20, titulo: 26, display: 34, gigante: 72 },
};
