# Vau · texto do documento PDF

> Texto pronto para diagramar. Os trechos marcados com **[PREENCHER]** dependem do grupo.
> Ordem dos itens = ordem pedida no enunciado.

---

## Capa

**Vau: por onde eu passo?**
Alagamentos em tempo real, rua por rua
Global Solution: CitizenTech, FIAP, 2026

## 1. Integrantes

**[PREENCHER em ordem alfabética]**

| Nome completo | RM |
|---|---|
| | |

## 2. Problema e cidadão beneficiado

**Problema.** Em dias de chuva forte, ruas de bairros de várzea alagam em minutos. O morador descobre o alagamento quando já está dentro dele: no caminho do trabalho, da escola ou do posto de saúde. Os alertas oficiais falam da cidade ou da região, e não da rua. A informação de rua existe, mas está espalhada em grupos de WhatsApp, sem local exato, sem confirmação e sem dizer quando o alagamento acabou.

**Cidadão beneficiado.** O morador de bairros que alagam com frequência, que se desloca a pé, de ônibus ou de moto, muitas vezes com celular básico, pouca bateria e sinal ruim na chuva. Dentro desse grupo, pensamos especialmente em quem tem mobilidade reduzida (idosos, pessoas com deficiência, pais com carrinho de bebê), para quem até a água rasa já é obstáculo.

**Quem mais participa.** Lideranças comunitárias e agentes da Defesa Civil, que confirmam relatos e avisam o bairro. E os vizinhos sem o app, que recebem um link pelo WhatsApp.

**Por que escolhemos.** **[PREENCHER com a pesquisa de campo: quem entrevistaram, onde e 2 ou 3 citações que mostram a dor. Ex.: "Eu só sei que alagou quando o ônibus para e o motorista manda descer."]** Os alagamentos acontecem quase sempre nos mesmos pontos, várias vezes por mês na estação chuvosa, e o problema tende a piorar com chuvas mais intensas. **[PREENCHER com 1 dado de fonte oficial: CGE-SP, Defesa Civil ou notícia, com a referência.]**

## 3. Jornada dos usuários

### Morador: "choveu, por onde eu passo?"

| Etapa | Plataforma | O que acontece |
|---|---|---|
| Começa a chover | App | Abre o app e vê no topo o aviso da liderança do seu bairro, se houver |
| Consulta o caminho | App | Vê os pontos alagados do mais perto ao mais longe, com nível, distância, horário e quantas pessoas confirmaram |
| Encontra um alagamento | App | Relata em 3 toques: aba Relatar, nível, Enviar. O local é automático; foto e detalhe são opcionais. Sem sinal, o relato fica guardado e sai sozinho depois |
| Ajuda os vizinhos | App | No ponto relatado por outra pessoa, toca em "Ainda está assim" ou "Já baixou" |
| Acompanha | App | Em Meus relatos, vê o status mudar: Enviado → Confirmado → Resolvido |

### Liderança comunitária ou Defesa Civil: "o que está acontecendo no bairro?"

| Etapa | Plataforma | O que acontece |
|---|---|---|
| Chuva começa | Web (painel) | Entra no painel e vê a fila de relatos chegando em tempo real, com o mapa ao lado |
| Faz a triagem | Web (painel) | Confirma, descarta ou marca "Água baixou", com clique ou pelas teclas C, D e R |
| Avisa o bairro | Web (painel) | Envia um aviso (Atenção, Alerta ou Emergência) que aparece no app de quem mora lá |
| Compartilha | Web (painel) | Copia o link da página pública do bairro e manda nos grupos |
| Encerra | Web (painel) | Encerra o aviso e marca os pontos como resolvidos, e o app de quem relatou é atualizado |

### Vizinho sem o app

Recebe o link no WhatsApp → abre a **página pública do bairro** na web → vê o aviso ativo, os pontos alagados e o horário da última mudança, sem login nem instalação.

## 4. A solução

O **Vau** liga quem está na rua a quem coordena o bairro.

- **App mobile (React Native + Expo):** feito para o momento da chuva. Relato em 3 toques, funcionamento sem sinal, letras grandes e alto contraste, retorno por vibração e movimento.
- **Plataforma web (React + Vite):** feita para quem coordena e para quem só recebe um link. Painel de triagem com mapa e fila, emissão de avisos e uma página pública e leve por bairro.

Cada plataforma tem um papel que a outra não cumpre: o app colhe a informação na rua, a web valida e distribui.

## 5. Integração entre mobile e web

As duas partes usam o mesmo backend no **Supabase** (banco Postgres, tempo real, armazenamento de fotos e login).

- O relato feito no app é gravado na tabela `relatos` e aparece **na hora** na fila do painel e na página do bairro, por meio do Supabase Realtime.
- Quando a liderança confirma, descarta ou marca como resolvido na web, o status muda no banco e o app de quem relatou é atualizado na hora, com aviso falado para o leitor de tela.
- O aviso emitido na web é gravado em `avisos` e aparece no topo do app de todos que escolheram aquele bairro.
- Os votos "Ainda está assim" e "Já baixou" do app atualizam as contagens no painel.
- **Segurança:** o morador não precisa de conta. As regras de acesso do banco (RLS) só deixam o app ler, relatar e votar. Mudar status e emitir avisos exige login da liderança.
- **Sem conexão:** o app guarda o relato no aparelho e envia quando o sinal volta, mantendo o horário real.

**Papel na jornada:** a integração fecha o ciclo que hoje não existe. O morador avisa, alguém confirma, todo mundo fica sabendo e quem avisou recebe o retorno.

## 6. Decisões de design

### Identidade visual
- **Nome e marca:** "Vau" é o trecho raso do rio, por onde dá para atravessar. A marca usa ondas e uma seta para cima, que lembra o caminho por cima da água.
- **Tema escuro com destaque azul-claro:** inspirado em apps de previsão do tempo, um formato que as pessoas já sabem ler (um número grande "de agora" e a previsão em blocos). O fundo escuro reduz o brilho na rua à noite e gasta menos bateria em telas OLED, o que importa para quem está na chuva com pouca carga. O azul-claro (água) marca o que é mais importante: o card do bairro e os botões, sempre com texto escuro por cima.
- **Níveis:** verde, âmbar e coral claros, ajustados para o fundo escuro. Todas as combinações de texto têm contraste de 6:1 ou mais, conferido por cálculo.
- **Tipografia:** Atkinson Hyperlegible, a mesma no app e na web.
- **Consistência:** os tokens (cores, níveis, tamanhos, durações de animação) ficam num único arquivo (`shared/tokens.js`) importado pelos dois projetos.

### UX
- **3 toques para relatar:** o nível vem primeiro (é o que mais importa para o vizinho), o local é automático e a foto é opcional. Isso responde ao contexto de pressa, chuva e uma mão ocupada.
- **Mais perto primeiro:** a lista é ordenada pela distância, e não pelo horário.
- **Confiança:** cada ponto mostra quantas pessoas confirmaram e se a liderança validou, o que separa informação de boato.
- **Retorno sempre:** toda ação tem resposta (vibração, toast, anúncio falado e mudança de status).
- **Painel para triagem rápida:** depois de agir, o painel vai sozinho para o próximo relato da fila, e os atalhos de teclado evitam o mouse.
- **Web leve:** o mapa só é baixado nas páginas que usam mapa, para a página inicial abrir rápido em conexão ruim.

### Motion design
**[Usar a tabela "Motion design" do README.]** Princípio: todo movimento responde a uma pergunta do usuário. "Mudou algo?" (aviso descendo, relato acendendo). "Em que passo estou?" (barra de progresso). "Deu certo?" (check com mola, toast). "Isso precisa de mim?" (anel pulsando nos pontos novos do mapa). Durações curtas (150 a 400 ms) e nada em loop dentro do conteúdo de leitura.

### Acessibilidade
**[Usar a lista "Acessibilidade" do README.]** Destaque: com "reduzir movimento" ligado no sistema, app e web trocam todas as animações por mudanças instantâneas, sem perder nenhuma informação, porque tudo que é dito por movimento também é dito por texto.

## 7. ODS

- **ODS 11 (Cidades e comunidades sustentáveis), meta 11.5:** reduzir o número de pessoas afetadas por desastres, incluindo os relacionados à água, com foco em pessoas em situação de vulnerabilidade. O Vau reduz a exposição ao alagamento ao avisar antes que a pessoa chegue nele.
- **ODS 13 (Ação contra a mudança global do clima), meta 13.1:** reforçar a capacidade de adaptação a riscos climáticos. O Vau organiza a resposta comunitária a eventos de chuva extrema, que estão ficando mais frequentes.

## 8. Links

- Repositório GitHub: https://github.com/isatomaz2005/vau
- Plataforma web: https://vau-kappa.vercel.app
- Vídeo-pitch: **[PREENCHER]**
