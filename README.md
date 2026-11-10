# Vau: por onde eu passo?

**Alagamentos em tempo real, rua por rua.** Quem está na rua relata pelo app onde alagou. A liderança do bairro confirma no painel web e avisa todo mundo. Quem não tem o app acompanha pela página pública do bairro, que dá para mandar no WhatsApp.

> Projeto da Global Solution FIAP: CitizenTech.
> Vau é o trecho raso de um rio, o lugar por onde dá para atravessar a pé.

- **Plataforma web:** https://vau-kappa.vercel.app
- **Vídeo-pitch:** <!-- TODO: link do YouTube -->
- **App:** instruções abaixo (Expo Go)

## Integrantes

| Nome | RM |
|---|---|
| <!-- TODO: nomes em ordem alfabética --> | |

## A solução

| | App mobile (React Native + Expo) | Plataforma web (React + Vite) |
|---|---|---|
| **Quem usa** | Morador na rua, com pressa, pouca bateria e sinal ruim | Liderança comunitária e Defesa Civil (painel). Vizinhos sem app (página do bairro) |
| **Para quê** | Ver os pontos alagados perto, relatar em 3 toques, confirmar o relato de outra pessoa e acompanhar o status | Triar relatos no mapa, confirmar, descartar ou marcar como resolvido, emitir aviso ao bairro e compartilhar o link público |
| **Telas** | Início, Relatar, Meus relatos, Detalhe do ponto, Seu bairro | Início, Meu bairro (página pública), Entrar, Painel da liderança |

## Como a integração funciona

O app e a web usam o mesmo backend no **Supabase** (Postgres + Realtime + Storage):

```
 App (morador)                     Supabase                      Web (liderança / vizinhos)
 ─────────────                     ────────                      ──────────────────────────
 Relatar ───────── insert ───────▶ relatos ──── realtime ──────▶ Fila do painel + mapa (chega na hora)
 Meus relatos ◀─── realtime ────── relatos ◀─── update status ── Confirmar / Descartar / Água baixou
 Aviso no topo ◀── realtime ────── avisos  ◀─── insert ──────── Avisar o bairro
 "Ainda está assim" ── rpc votar ▶ relatos ──── realtime ──────▶ Contagem no painel e na página do bairro
```

- **Tempo real:** as duas pontas assinam as tabelas `relatos` e `avisos` pelo Supabase Realtime. Uma ação feita de um lado aparece do outro sem recarregar a página.
- **Segurança (RLS):** o morador não tem login. Ele só lê, cria relatos e vota por uma função (`votar`). Mudar status e emitir avisos exige login da liderança. Veja `supabase/schema.sql`.
- **Sem sinal:** o app guarda o relato no aparelho (AsyncStorage) e envia sozinho quando a conexão volta (NetInfo), mantendo o horário real do relato.
- **Identidade comum:** cores, níveis, bairros e durações de animação ficam em `shared/` e são importados pelos dois projetos.

## Estrutura

```
vau/
├── app/        App mobile (Expo SDK 58, expo-router)
├── web/        Plataforma web (Vite + React + React Router + Leaflet)
├── shared/     Tokens visuais e bairros usados pelos dois
├── supabase/   schema.sql (tabelas, RLS, realtime, storage) e seed.sql (dados de demonstração)
└── docs/       Problema, jornadas, texto do PDF e roteiro do vídeo
```

## Como rodar

### 1. Banco (Supabase), uma vez para o grupo

1. Crie um projeto em [supabase.com](https://supabase.com) (plano gratuito).
2. Em **SQL Editor**, rode `supabase/schema.sql` e depois `supabase/seed.sql`.
3. Em **Authentication > Users > Add user**, crie o usuário da liderança (e-mail + senha, marcando *Auto Confirm User*).
4. Em **Project Settings > API**, copie a *Project URL* e a chave *anon public*.

### 2. Plataforma web

```bash
cd web
cp .env.example .env    # cole a URL e a chave anon
npm install
npm run dev             # http://localhost:5173
```

**Deploy na Vercel:** importe o repositório sem mudar a pasta raiz (o `vercel.json` da raiz já constrói a pasta `web/`, que importa `shared/`), cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e publique.

### 3. App

```bash
cd app
cp .env.example .env    # mesma URL e chave anon, com prefixo EXPO_PUBLIC_
npm install
npx expo start
```

Abra o **Expo Go** no celular e leia o QR code.

### Roteiro rápido para testar a integração

1. No app, escolha o bairro **Jardim Pantanal** e relate um ponto como *Perigoso*.
2. Na web, entre no **Painel da liderança**: o relato aparece no topo da fila com "Acabou de chegar".
3. Clique no relato e aperte **C** (confirmar): no app, em *Meus relatos*, o status anda para "Confirmado".
4. No painel, envie um aviso para o Jardim Pantanal: ele desce no topo da tela inicial do app.
5. Abra `/bairro/jardim-pantanal` em outra aba: a página pública mostra o aviso e o ponto, sem login.

## Acessibilidade

- Fonte **Atkinson Hyperlegible**, criada pelo Braille Institute para pessoas com baixa visão.
- Contraste conferido por cálculo (WCAG AA): todas as combinações de texto passam de 4,5:1.
- O nível do alagamento nunca depende só da cor: **ícone + palavra + cor** (Passável ✓, Perigoso !, Intransitável ✕).
- App: rótulos e dicas para TalkBack e VoiceOver, áreas de toque de no mínimo 48 dp, texto que acompanha o tamanho de fonte do sistema (até 2x) e anúncios falados quando algo muda sozinho.
- Web: HTML semântico (landmarks, títulos em ordem, listas, `fieldset`), link "Pular para o conteúdo", foco visível, painel 100% operável pelo teclado (com atalhos C, D e R), região `aria-live` para os relatos que chegam em tempo real e erros de formulário ligados ao campo.
- **Movimento reduzido:** se a pessoa ligar "reduzir movimento" no sistema, as animações viram trocas instantâneas, tanto no app quanto na web.
- Linguagem simples: "Água baixou" em vez de "Ocorrência encerrada".

## Motion design

| Onde | O que acontece | Para quê |
|---|---|---|
| App, aviso do bairro | Desce do topo e o ícone pulsa 2 vezes | Mostrar que algo mudou sem precisar de som |
| App, relato novo na lista | Fundo acende em amarelo e apaga | Indicar o que acabou de chegar em tempo real |
| App, Relatar | Barra de progresso anda e o passo entra pela direita | Orientar: em que passo estou e quanto falta |
| App, escolha do nível | O card "salta" e o celular vibra | Confirmar a escolha mesmo com a mão molhada ou sem olhar |
| App, envio | Círculo com check entra com mola | Dar retorno claro: "foi" ou "guardado para depois" |
| App, Meus relatos | A trilha Enviado → Confirmado → Resolvido se enche | Mostrar o progresso quando a liderança age |
| App, sem sinal | Barra escura desliza no topo | Avisar o estado da conexão sem bloquear o uso |
| Web, fila do painel | Relato novo entra deslizando, com destaque | Chamar a atenção para o que precisa de triagem |
| Web, mapa | Anel pulsando nos pontos ainda não confirmados | Separar visualmente "novo" de "confirmado" |
| Web, páginas e toasts | Fade na troca de página e toast que sobe e some | Orientar a navegação e confirmar ações |
| Web, página do bairro | Ponto verde "ao vivo" pulsando | Comunicar que a página se atualiza sozinha |

## ODS

- **ODS 11, meta 11.5:** reduzir as pessoas afetadas por desastres, incluindo os relacionados à água, com foco em quem está em situação de vulnerabilidade.
- **ODS 13, meta 13.1:** reforçar a resiliência e a capacidade de adaptação a riscos climáticos.

## Tecnologias

Expo SDK 58 · React Native 0.88 · expo-router · expo-location · expo-image-picker · AsyncStorage · NetInfo · React 19 · Vite 8 · React Router · Leaflet + OpenStreetMap · Supabase (Postgres, Realtime, Storage, Auth)
