Índice
Visão Geral e Metáfora Conceitual
Papéis de Usuário e Permissões
Arquitetura Técnica
Fluxos Principais da Aplicação
Estrutura de Dados e Segurança
Sistema de IA
Estado Atual e Próximos Passos
Jornada de Desenvolvimento e Plano de Verificação

1. Visão Geral e Metáfora Conceitual <a name="visão-geral"></a>
A OmniFlow AI é concebida como um Shopping Center Digital, onde:

Super Administrador = Dono do Shopping
Administrador = Dono de uma Loja específica
Usuário Final = Cliente que visita uma loja

Esta analogia define toda a hierarquia, permissões e interações no ecossistema.

2. Papéis de Usuário e Permissões <a name="papéis-de-usuário"></a>
2.1. Super Administrador (Dono do Shopping)
Acesso: /super-admin/*
Poderes:
CRUD completo de Administradores
Visão global de todos os contatos, históricos e métricas
Criação de campanhas de Broadcasting Corporativo
Configuração da IA Global (/super-admin/global-ai-config)
Acesso ao próprio painel Admin para gestão pessoal

2.2. Administrador (Dono de Loja)
Acesso: /admin/*
Poderes:
CRUD apenas dos próprios contatos (isolamento total)
Configuração de IA pessoal (/admin/ai-config)
Link único de chat: https://app.com/chat/{adminUid}
Visualização de comunicados do Super Admin

2.3. Usuário Final (Cliente)
Acesso: Anônimo via /chat/{adminUid}
Interações:
Conversar com a IA da "loja"
Solicitar atendimento humano
Fornecer informações de contato

3. Arquitetura Técnica <a name="arquitetura-técnica"></a>
3.1. Stack Tecnológica
Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn/UI
Backend & Database: Firebase (Auth, Firestore, Cloud Functions, Cloud Messaging)
IA: Google Gemini API

3.2. Estrutura de Pastas (Resumida)
src/app/
├── admin/                 # Painel do Administrador
│   ├── ai-config/        # Configuração de IA pessoal
│   ├── broadcast/        # Visualização de comunicados
│   ├── contacts/         # Gestão de contatos
│   ├── dashboard/        # Dashboard personalizado
│   ├── groups/           # Gestão de grupos
│   ├── history/          # Histórico de conversas
│   └── live-chat/        # Chat em tempo real
├── api/                  # Endpoints da API
│   └── summarize/        # Resumo de conversas (futuro)
├── chat/                 # Interface pública de chat
│   └── [adminUid]/       # Chat específico por Admin
├── login/                # Página de autenticação
└── super-admin/          # Painel do Super Admin
    ├── admins/           # Gestão de Administradores
    ├── ai-config/        # Configuração de IA global
    ├── ai-settings/      # Configurações avançadas de IA
    ├── broadcast/        # Criação de campanhas
    ├── contacts/         # Visualização global de contatos
    ├── dashboard/        # Dashboard global
    ├── history/          # Histórico global
    ├── live-chat/        # Visualização de chats ativos
    └── users/            # Gestão de usuários

4. Fluxos Principais da Aplicação <a name="fluxos-principais"></a>
4.1. Fluxo de Atendimento ao Cliente
... (conteúdo existente)

4.2. Sistema de Migração de Conversas
... (conteúdo existente)

5. Estrutura de Dados e Segurança <a name="estrutura-de-dados"></a>
... (conteúdo existente)

6. Sistema de IA <a name="sistema-de-ia"></a>
... (conteúdo existente)

7. Estado Atual e Próximos Passos <a name="estado-atual"></a>
... (conteúdo existente)

---

**8. Jornada de Desenvolvimento e Plano de Verificação <a name="jornada-e-verificação"></a>**

**8.1. Nosso Percurso: Do Conceito à Consolidação**

O desenvolvimento inicial da OmniFlow AI foi uma jornada de descobertas e iterações. Nossa visão sempre foi clara: criar um sistema robusto baseado na metáfora do "Shopping Center". No entanto, o caminho para a implementação técnica correta apresentou desafios cruciais, principalmente em torno da segurança e do fluxo de dados.

*   **O Caminho Enganoso Inicial:** A primeira abordagem para o chat público tentava buscar os dados do administrador (nome, avatar) diretamente de sua coleção privada (`/users`). Embora parecesse lógico do ponto de vista da interface, essa abordagem batia de frente com uma regra fundamental de segurança: dados privados não devem ser acessíveis publicamente. O resultado foram os persistentes erros de "Permissão Negada" do Firebase, que corretamente agia como um segurança, impedindo o acesso não autorizado.

*   **A Virada de Chave: A Descoberta dos Caminhos Consolidados:** A solução veio ao internalizarmos a separação entre **dados privados** e **dados de exibição pública**. A implementação de uma coleção intermediária, a `public_profiles`, foi o ponto de virada. Este "crachá público" permitiu que cada administrador publicasse seletivamente as informações que deveriam ser visíveis no chat, sem nunca expor seus dados privados. Outro pilar consolidado foi o tratamento de conversas anônimas, que agora são gerenciadas em uma área central (`/conversations`) e elegantemente migradas para um contato identificado após a captura do lead.

**8.2. Consolidação da Autenticação e Presença em Tempo Real**

Após a estabilização da arquitetura de dados, a próxima fronteira foi garantir uma experiência de usuário robusta e confiável, começando pelos sistemas mais fundamentais: cadastro, login e status de presença.

*   **Lógica de Cadastro Atômica:** O fluxo de registro de novos usuários foi solidificado para incorporar a lógica de negócios central:
    1.  O **primeiro usuário** a se cadastrar na plataforma é automaticamente designado como `superadmin` (o "Dono do Shopping").
    2.  Todos os usuários subsequentes são designados como `admin` (os "Donos de Loja").
    3.  Essa lógica é implementada usando uma **transação atômica** do Firestore, garantindo que, mesmo com múltiplos registros simultâneos, a designação de papéis seja executada de forma segura e sem condições de corrida.

*   **Estabilização da Sessão de Usuário:** Foi identificado e corrigido um bug crítico de instabilidade que causava a "piscada" do status do usuário. A causa raiz era uma dessincronização entre o objeto de usuário do Firebase Auth e o perfil de usuário do Firestore.
    *   **A Solução:** O serviço `onAuthChange` foi refatorado para unificar essas duas fontes. Agora, ele primeiro observa a autenticação e, em seguida, busca o perfil de dados completo, emitindo um **único objeto de usuário estável** para toda a aplicação. Isso eliminou a instabilidade e consolidou a fonte da verdade sobre o usuário logado.

*   **Implementação de um Sistema de Presença Confiável:** Para resolver o problema de "desconexões fantasmas", foi implementado um sistema de presença em tempo real utilizando o **Firebase Realtime Database (RTDB)**.
    *   **Como Funciona:**
        1.  Quando um usuário faz login, seu status é definido como `isOnline: true` em um caminho específico no RTDB (`/status/{uid}`).
        2.  Imediatamente, a função `onDisconnect()` é armada. Este é um poderoso recurso do Firebase que instrui o servidor a **automaticamente** alterar o status para `isOnline: false` se a conexão do cliente for perdida abruptamente (por exemplo, ao fechar a aba do navegador ou perder a conexão com a internet).
        3.  No logout manual, o status é proativamente definido como `false` para garantir uma desconexão limpa.

Essas melhorias fundamentais garantem que a plataforma seja resiliente a interrupções do mundo real, fornecendo uma base sólida para todas as funcionalidades futuras.

**8.3. Plano de Verificação Global do Sistema**

Com os pilares arquitetônicos agora firmes, é hora de realizar um teste de ponta a ponta para validar todo o fluxo principal da aplicação.

>**Nota sobre o Ciclo de Testes:**
>Para facilitar a repetição dos testes, especialmente o fluxo de cadastro do primeiro usuário (`superadmin`), utilize o botão "Reset" disponível na interface do Firebase Studio. Ele limpa o ambiente e permite que o Passo 1 seja executado novamente a partir de um estado limpo.

**Passo 1: Preparação do Ambiente (Como Super Admin)**
- [ ] **Acessar o Painel:** Faça login como `super-admin`.
- [ ] **Criar um Administrador:** Navegue até `/super-admin/admins` e crie um novo usuário com a role `admin`. Guarde as credenciais (email/senha).

**Passo 2: Configuração da Loja (Como Administrador)**
- [ ] **Login do Administrador:** Faça logout e entre com as credenciais do `admin` recém-criado.
- [ ] **Acessar o Perfil:** Use o novo menu no canto inferior esquerdo para navegar até "Editar Perfil".
- [ ] **Personalizar a Identidade:**
    - [ ] Atualize o "Nome de Exibição".
    - [ ] Faça o upload de uma "Imagem de Perfil" (Avatar).
    - [ ] Escreva uma "Frase de Apresentação".
    - [ ] Salve as alterações.
- [ ] **Obter o Link do Chat:** Copie o link único do chat, que terá o formato `.../chat/{adminUid}`.

**Passo 3: A Experiência do Cliente (Como Usuário Final)**
- [ ] **Acessar o Chat:** Abra uma janela anônima do navegador e cole o link do chat.
- [ ] **Verificar a Personalização:** Confirme que o nome, avatar e frase de apresentação estão sendo exibidos.
- [ ] **Interagir com a IA:** Envie algumas mensagens.
- [ ] **Solicitar Atendimento Humano:** Clique em "Falar com Atendente", preencha o formulário e envie.

**Passo 4: Gestão do Atendimento (Como Administrador)**
- [ ] **Verificar a Notificação:** Volte para a janela do `admin`.
- [ ] **Acessar o Chat ao Vivo:** Navegue para `/admin/live-chat`.
- [ ] **Confirmar o Novo Contato:** Verifique se a conversa aparece na lista e se o histórico da IA está visível.
- [ ] **Responder ao Cliente:** Envie uma mensagem no chat.

**Passo 5: Verificação Final (Como Usuário Final)**
- [ ] **Confirmar a Resposta:** Volte para a janela anônima e verifique se a mensagem do admin chegou.

---

Nota: Este documento será atualizado continuamente conforme a aplicação evolui.

# Analogia do Negócio
Super Administrador (Você): O Dono do Shopping Center Digital. Sua principal fonte de renda é "alugar" os espaços (as lojas) para outros empresários.
Admin (Seu Cliente, o "Dono da Loja"): Um empresário que se cadastra para abrir uma "loja" em modo de teste. Se gostar, ele começa a te pagar o "aluguel" (a assinatura do serviço).
Cliente Final (O cliente do "Dono da Loja"): O visitante que entra no chat de uma loja específica para ser atendido pela IA.
Sua "Loja" Pessoal: Como Dono do Shopping, você também tem direito de ter sua própria loja, que opera para seus próprios fins.

# Estrutura de Arquivos
bin               md5-browser.js     regex.js         uuid-bin.js  v5.js
commonjs-browser  md5.js             rng-browser.js   v1.js        v6.js
esm-browser       native-browser.js  rng.js           v1ToV6.js    v6ToV1.js
esm-node          native.js          sha1-browser.js  v35.js       v7.js
index.js          nil.js             sha1.js          v3.js        validate.js
max.js            parse.js           stringify.js     v4.js        version.js

./node_modules/uuid/dist/bin:
uuid

./node_modules/uuid/dist/commonjs-browser:
index.js  native.js  regex.js  stringify.js  v35.js  v5.js      v7.js
max.js    nil.js     rng.js    v1.js         v3.js   v6.js      validate.js
md5.js    parse.js   sha1.js   v1ToV6.js     v4.js   v6ToV1.js  version.js

./node_modules/uuid/dist/esm-browser:
index.js  native.js  regex.js  stringify.js  v35.js  v5.js      v7.js
max.js    nil.js     rng.js    v1.js         v3.js   v6.js      validate.js
md5.js    parse.js   sha1.js   v1ToV6.js     v4.js   v6ToV1.js  version.js

./node_modules/uuid/dist/esm-node:
index.js  native.js  regex.js  stringify.js  v35.js  v5.js      v7.js
max.js    nil.js     rng.js    v1.js         v3.js   v6.js      validate.js
md5.js    parse.js   sha1.js   v1ToV6.js     v4.js   v6ToV1.js  version.js

./node_modules/vary:
HISTORY.md  index.js  LICENSE  package.json  README.md

./node_modules/victory-vendor:
CHANGELOG.md   d3-ease.js           d3-scale.js    d3-time.js     lib
d3-array.d.ts  d3-interpolate.d.ts  d3-shape.d.ts  d3-timer.d.ts  lib-vendor
d3-array.js    d3-interpolate.js    d3-shape.js    d3-timer.js    package.json
d3-ease.d.ts   d3-scale.d.ts        d3-time.d.ts   es             README.md

./node_modules/victory-vendor/es:
d3-array.js  d3-format.js       d3-scale.js        d3-time.js     internmap.js
d3-color.js  d3-interpolate.js  d3-shape.js        d3-timer.js
d3-ease.js   d3-path.js         d3-time-format.js  d3-voronoi.js

./node_modules/victory-vendor/lib:
d3-array.js  d3-format.js       d3-scale.js        d3-time.js     internmap.js
d3-color.js  d3-interpolate.js  d3-shape.js        d3-timer.js
d3-ease.js   d3-path.js         d3-time-format.js  d3-voronoi.js

./node_modules/victory-vendor/lib-vendor:
d3-array  d3-ease    d3-interpolate  d3-scale  d3-time         d3-timer    internmap
d3-color  d3-format  d3-path         d3-shape  d3-time-format  d3-voronoi

./node_modules/victory-vendor/lib-vendor/d3-array:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-array/src:
array.js       disjoint.js       leastIndex.js  number.js       sort.js
ascending.js   every.js          least.js       pairs.js        subset.js
bin.js         extent.js         map.js         permute.js      sum.js
bisect.js      filter.js         maxIndex.js    quantile.js     superset.js
bisector.js    fsum.js           max.js         quickselect.js  threshold
constant.js    greatestIndex.js  mean.js        range.js        ticks.js
count.js       greatest.js       median.js      rank.js         transpose.js
cross.js       group.js          merge.js       reduce.js       union.js
cumsum.js      groupSort.js      minIndex.js    reverse.js      variance.js
descending.js  identity.js       min.js         scan.js         zip.js
deviation.js   index.js          mode.js        shuffle.js
difference.js  intersection.js   nice.js        some.js

./node_modules/victory-vendor/lib-vendor/d3-array/src/threshold:
freedmanDiaconis.js  scott.js  sturges.js

./node_modules/victory-vendor/lib-vendor/d3-color:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-color/src:
color.js  cubehelix.js  define.js  index.js  lab.js  math.js

./node_modules/victory-vendor/lib-vendor/d3-ease:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-ease/src:
back.js    circle.js  elastic.js  index.js   math.js  quad.js
bounce.js  cubic.js   exp.js      linear.js  poly.js  sin.js

./node_modules/victory-vendor/lib-vendor/d3-format:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-format/src:
defaultLocale.js  formatNumerals.js    formatTrim.js   locale.js
exponent.js       formatPrefixAuto.js  formatTypes.js  precisionFixed.js
formatDecimal.js  formatRounded.js     identity.js     precisionPrefix.js
formatGroup.js    formatSpecifier.js   index.js        precisionRound.js

./node_modules/victory-vendor/lib-vendor/d3-interpolate:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-interpolate/src:
array.js        constant.js   hcl.js    lab.js          piecewise.js  string.js
basisClosed.js  cubehelix.js  hsl.js    numberArray.js  quantize.js   transform
basis.js        date.js       hue.js    number.js       rgb.js        value.js
color.js        discrete.js   index.js  object.js       round.js      zoom.js

./node_modules/victory-vendor/lib-vendor/d3-interpolate/src/transform:
decompose.js  index.js  parse.js

./node_modules/victory-vendor/lib-vendor/d3-path:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-path/src:
index.js  path.js

./node_modules/victory-vendor/lib-vendor/d3-scale:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-scale/src:
band.js        diverging.js  linear.js  ordinal.js   radial.js              threshold.js
colors.js      identity.js   log.js     pow.js       sequential.js          tickFormat.js
constant.js    index.js      nice.js    quantile.js  sequentialQuantile.js  time.js
continuous.js  init.js       number.js  quantize.js  symlog.js              utcTime.js

./node_modules/victory-vendor/lib-vendor/d3-shape:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-shape/src:
arc.js         constant.js    index.js       math.js  pie.js          symbol
area.js        curve          line.js        noop.js  point.js        symbol.js
areaRadial.js  descending.js  lineRadial.js  offset   pointRadial.js
array.js       identity.js    link.js        order    stack.js

./node_modules/victory-vendor/lib-vendor/d3-shape/src/curve:
basisClosed.js  bundle.js          catmullRomClosed.js  linear.js    step.js
basis.js        cardinalClosed.js  catmullRom.js        monotone.js
basisOpen.js    cardinal.js        catmullRomOpen.js    natural.js
bump.js         cardinalOpen.js    linearClosed.js      radial.js

./node_modules/victory-vendor/lib-vendor/d3-shape/src/offset:
diverging.js  expand.js  none.js  silhouette.js  wiggle.js

./node_modules/victory-vendor/lib-vendor/d3-shape/src/order:
appearance.js  ascending.js  descending.js  insideOut.js  none.js  reverse.js

./node_modules/victory-vendor/lib-vendor/d3-shape/src/symbol:
asterisk.js  cross.js     diamond.js  square2.js  star.js       triangle.js  x.js
circle.js    diamond2.js  plus.js     square.js   triangle2.js  wye.js

./node_modules/victory-vendor/lib-vendor/d3-time:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-time/src:
day.js       index.js        minute.js  ticks.js    utcMinute.js  utcYear.js
duration.js  interval.js     month.js   utcDay.js   utcMonth.js   week.js
hour.js      millisecond.js  second.js  utcHour.js  utcWeek.js    year.js

./node_modules/victory-vendor/lib-vendor/d3-time-format:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-time-format/src:
defaultLocale.js  index.js  isoFormat.js  isoParse.js  locale.js

./node_modules/victory-vendor/lib-vendor/d3-timer:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-timer/src:
index.js  interval.js  timeout.js  timer.js

./node_modules/victory-vendor/lib-vendor/d3-voronoi:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/d3-voronoi/src:
Beach.js  Circle.js    Diagram.js  index.js  RedBlackTree.js
Cell.js   constant.js  Edge.js     point.js  voronoi.js

./node_modules/victory-vendor/lib-vendor/internmap:
LICENSE  src

./node_modules/victory-vendor/lib-vendor/internmap/src:
index.js

./node_modules/wcwidth:
combining.js  docs  index.js  LICENSE  package.json  Readme.md  test

./node_modules/wcwidth/docs:
index.md

./node_modules/wcwidth/test:
index.js

./node_modules/webidl-conversions:
lib  LICENSE.md  package.json  README.md

./node_modules/webidl-conversions/lib:
index.js

./node_modules/websocket-driver:
CHANGELOG.md  lib  LICENSE.md  package.json  README.md

./node_modules/websocket-driver/lib:
websocket

./node_modules/websocket-driver/lib/websocket:
driver  driver.js  http_parser.js  streams.js

./node_modules/websocket-driver/lib/websocket/driver:
base.js    draft75.js  headers.js  hybi.js   server.js
client.js  draft76.js  hybi        proxy.js  stream_reader.js

./node_modules/websocket-driver/lib/websocket/driver/hybi:
frame.js  message.js

./node_modules/websocket-extensions:
CHANGELOG.md  lib  LICENSE.md  package.json  README.md

./node_modules/websocket-extensions/lib:
parser.js  pipeline  websocket_extensions.js

./node_modules/websocket-extensions/lib/pipeline:
cell.js  functor.js  index.js  pledge.js  README.md  ring_buffer.js

./node_modules/web-streams-polyfill:
dist  es2018  es6  LICENSE  package.json  ponyfill  README.md

./node_modules/web-streams-polyfill/dist:
polyfill.es2018.js          polyfill.es6.mjs.map     ponyfill.es6.js
polyfill.es2018.js.map      polyfill.js              ponyfill.es6.js.map
polyfill.es2018.min.js      polyfill.js.map          ponyfill.es6.mjs
polyfill.es2018.min.js.map  polyfill.min.js          ponyfill.es6.mjs.map
polyfill.es2018.mjs         polyfill.min.js.map      ponyfill.js
polyfill.es2018.mjs.map     polyfill.mjs             ponyfill.js.map
polyfill.es6.js             polyfill.mjs.map         ponyfill.mjs
polyfill.es6.js.map         ponyfill.es2018.js       ponyfill.mjs.map
polyfill.es6.min.js         ponyfill.es2018.js.map   types
polyfill.es6.min.js.map     ponyfill.es2018.mjs
polyfill.es6.mjs            ponyfill.es2018.mjs.map

./node_modules/web-streams-polyfill/dist/types:
polyfill.d.ts  ponyfill.d.ts  ts3.6  tsdoc-metadata.json

./node_modules/web-streams-polyfill/dist/types/ts3.6:
polyfill.d.ts  ponyfill.d.ts

./node_modules/web-streams-polyfill/es2018:
package.json

./node_modules/web-streams-polyfill/es6:
package.json

./node_modules/web-streams-polyfill/ponyfill:
es2018  es6  package.json

./node_modules/web-streams-polyfill/ponyfill/es2018:
package.json

./node_modules/web-streams-polyfill/ponyfill/es6:
package.json

./node_modules/web-vitals:
attribution.d.ts  attribution.js  dist  LICENSE  package.json  README.md  src

./node_modules/web-vitals/dist:
modules                         web-vitals.attribution.umd.cjs  web-vitals.umd.cjs
web-vitals.attribution.iife.js  web-vitals.iife.js
web-vitals.attribution.js       web-vitals.js

./node_modules/web-vitals/dist/modules:
attribution      index.d.ts  onCLS.d.ts  onFCP.js    onINP.d.ts  onLCP.js     types
deprecated.d.ts  index.js    onCLS.js    onFID.d.ts  onINP.js    onTTFB.d.ts  types.d.ts
deprecated.js    lib         onFCP.d.ts  onFID.js    onLCP.d.ts  onTTFB.js    types.js

./node_modules/web-vitals/dist/modules/attribution:
deprecated.d.ts  index.js    onFCP.d.ts  onFID.js    onLCP.d.ts   onTTFB.js
deprecated.js    onCLS.d.ts  onFCP.js    onINP.d.ts  onLCP.js
index.d.ts       onCLS.js    onFID.d.ts  onINP.js    onTTFB.d.ts

./node_modules/web-vitals/dist/modules/lib:
bfcache.d.ts             getActivationStart.js      initMetric.d.ts    runOnce.d.ts
bfcache.js               getLoadState.d.ts          initMetric.js      runOnce.js
bindReporter.d.ts        getLoadState.js            interactions.d.ts  whenActivated.d.ts
bindReporter.js          getNavigationEntry.d.ts    interactions.js    whenActivated.js
doubleRAF.d.ts           getNavigationEntry.js      observe.d.ts       whenIdle.d.ts
doubleRAF.js             getSelector.d.ts           observe.js         whenIdle.js
generateUniqueID.d.ts    getSelector.js             onHidden.d.ts
generateUniqueID.js      getVisibilityWatcher.d.ts  onHidden.js
getActivationStart.d.ts  getVisibilityWatcher.js    polyfills

./node_modules/web-vitals/dist/modules/lib/polyfills:
firstInputPolyfill.d.ts  getFirstHiddenTimePolyfill.d.ts  interactionCountPolyfill.d.ts
firstInputPolyfill.js    getFirstHiddenTimePolyfill.js    interactionCountPolyfill.js

./node_modules/web-vitals/dist/modules/types:
base.d.ts  cls.d.ts  fcp.d.ts  fid.d.ts  inp.d.ts  lcp.d.ts  polyfills.d.ts  ttfb.d.ts
base.js    cls.js    fcp.js    fid.js    inp.js    lcp.js    polyfills.js    ttfb.js

./node_modules/web-vitals/src:
attribution    index.ts  onCLS.ts  onFID.ts  onLCP.ts   types
deprecated.ts  lib       onFCP.ts  onINP.ts  onTTFB.ts  types.ts

./node_modules/web-vitals/src/attribution:
deprecated.ts  index.ts  onCLS.ts  onFCP.ts  onFID.ts  onINP.ts  onLCP.ts  onTTFB.ts

./node_modules/web-vitals/src/lib:
bfcache.ts             getLoadState.ts          interactions.ts  whenActivated.ts
bindReporter.ts        getNavigationEntry.ts    observe.ts       whenIdle.ts
doubleRAF.ts           getSelector.ts           onHidden.ts
generateUniqueID.ts    getVisibilityWatcher.ts  polyfills
getActivationStart.ts  initMetric.ts            runOnce.ts

./node_modules/web-vitals/src/lib/polyfills:
firstInputPolyfill.ts  getFirstHiddenTimePolyfill.ts  interactionCountPolyfill.ts

./node_modules/web-vitals/src/types:
base.ts  cls.ts  fcp.ts  fid.ts  inp.ts  lcp.ts  polyfills.ts  ttfb.ts

./node_modules/whatwg-url:
lib  LICENSE.txt  package.json  README.md

./node_modules/whatwg-url/lib:
public-api.js  URL-impl.js  URL.js  url-state-machine.js  utils.js

./node_modules/which:
bin  CHANGELOG.md  LICENSE  package.json  README.md  which.js

./node_modules/which/bin:
node-which

./node_modules/winston:
dist  index.d.ts  lib  LICENSE  package.json  README.md

./node_modules/winston/dist:
winston  winston.js

./node_modules/winston/dist/winston:
common.js     create-logger.js      logger.js             rejection-stream.js
config        exception-handler.js  profiler.js           tail-file.js
container.js  exception-stream.js   rejection-handler.js  transports

./node_modules/winston/dist/winston/config:
index.js

./node_modules/winston/dist/winston/transports:
console.js  file.js  http.js  index.js  stream.js

./node_modules/winston/lib:
winston  winston.js

./node_modules/winston/lib/winston:
common.js     create-logger.js      logger.js             rejection-stream.js
config        exception-handler.js  profiler.js           tail-file.js
container.js  exception-stream.js   rejection-handler.js  transports

./node_modules/winston/lib/winston/config:
index.d.ts  index.js

./node_modules/winston/lib/winston/transports:
console.js  file.js  http.js  index.d.ts  index.js  stream.js

./node_modules/winston-transport:
CHANGELOG.md  index.d.ts  legacy.js  modern.js     README.md
dist          index.js    LICENSE    package.json

./node_modules/winston-transport/dist:
index.js  legacy.js  modern.js

./node_modules/wordwrap:
example  index.js  LICENSE  package.json  README.markdown  test

./node_modules/wordwrap/example:
center.js  meat.js

./node_modules/wordwrap/test:
break.js  idleness.txt  wrap.js

./node_modules/wrap-ansi:
index.js  license  node_modules  package.json  readme.md

./node_modules/wrap-ansi/node_modules:
ansi-regex  emoji-regex  string-width  strip-ansi

./node_modules/wrap-ansi/node_modules/ansi-regex:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/wrap-ansi/node_modules/emoji-regex:
es2015  index.d.ts  index.js  LICENSE-MIT.txt  package.json  README.md  text.js

./node_modules/wrap-ansi/node_modules/emoji-regex/es2015:
index.js  text.js

./node_modules/wrap-ansi/node_modules/string-width:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/wrap-ansi/node_modules/strip-ansi:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/wrap-ansi-cjs:
index.js  license  node_modules  package.json  readme.md

./node_modules/wrap-ansi-cjs/node_modules:
ansi-regex  emoji-regex  string-width  strip-ansi

./node_modules/wrap-ansi-cjs/node_modules/ansi-regex:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/wrap-ansi-cjs/node_modules/emoji-regex:
es2015  index.d.ts  index.js  LICENSE-MIT.txt  package.json  README.md  text.js

./node_modules/wrap-ansi-cjs/node_modules/emoji-regex/es2015:
index.js  text.js

./node_modules/wrap-ansi-cjs/node_modules/string-width:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/wrap-ansi-cjs/node_modules/strip-ansi:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/wrappy:
LICENSE  package.json  README.md  wrappy.js

./node_modules/write-file-atomic:
CHANGELOG.md  index.js  LICENSE  node_modules  package.json  README.md

./node_modules/write-file-atomic/node_modules:
signal-exit

./node_modules/write-file-atomic/node_modules/signal-exit:
index.js  LICENSE.txt  package.json  README.md  signals.js

./node_modules/xdg-basedir:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/xorshift:
benchmark.js  package.json  reference.c     test.js
LICENSE.md    README.md     reference.json  xorshift.js

./node_modules/xtend:
immutable.js  LICENSE  mutable.js  package.json  README.md  test.js

./node_modules/y18n:
build  CHANGELOG.md  index.mjs  LICENSE  package.json  README.md

./node_modules/y18n/build:
index.cjs  lib

./node_modules/y18n/build/lib:
cjs.js  index.js  platform-shims

./node_modules/y18n/build/lib/platform-shims:
node.js

./node_modules/yallist:
iterator.js  LICENSE  package.json  README.md  yallist.js

./node_modules/yaml:
bin.mjs  browser  dist  LICENSE  package.json  README.md  util.js

./node_modules/yaml/browser:
dist  index.js  package.json

./node_modules/yaml/browser/dist:
compose  errors.js  log.js  parse          schema     util.js
doc      index.js   nodes   public-api.js  stringify  visit.js

./node_modules/yaml/browser/dist/compose:
compose-collection.js  resolve-block-scalar.js     util-contains-newline.js
compose-doc.js         resolve-block-seq.js        util-empty-scalar-position.js
compose-node.js        resolve-end.js              util-flow-indent-check.js
composer.js            resolve-flow-collection.js  util-map-includes.js
compose-scalar.js      resolve-flow-scalar.js
resolve-block-map.js   resolve-props.js

./node_modules/yaml/browser/dist/doc:
anchors.js  applyReviver.js  createNode.js  directives.js  Document.js

./node_modules/yaml/browser/dist/nodes:
addPairToJSMap.js  Collection.js  Node.js  Scalar.js  YAMLMap.js
Alias.js           identity.js    Pair.js  toJS.js    YAMLSeq.js

./node_modules/yaml/browser/dist/parse:
cst.js         cst-stringify.js  lexer.js         parser.js
cst-scalar.js  cst-visit.js      line-counter.js

./node_modules/yaml/browser/dist/schema:
common  core  json  Schema.js  tags.js  yaml-1.1

./node_modules/yaml/browser/dist/schema/common:
map.js  null.js  seq.js  string.js

./node_modules/yaml/browser/dist/schema/core:
bool.js  float.js  int.js  schema.js

./node_modules/yaml/browser/dist/schema/json:
schema.js

./node_modules/yaml/browser/dist/schema/yaml-1.1:
binary.js  float.js  merge.js  pairs.js   set.js
bool.js    int.js    omap.js   schema.js  timestamp.js

./node_modules/yaml/browser/dist/stringify:
foldFlowLines.js        stringifyComment.js   stringify.js        stringifyPair.js
stringifyCollection.js  stringifyDocument.js  stringifyNumber.js  stringifyString.js

./node_modules/yaml/dist:
cli.d.ts  errors.d.ts  log.d.ts      parse            stringify         util.js
cli.mjs   errors.js    log.js        public-api.d.ts  test-events.d.ts  visit.d.ts
compose   index.d.ts   nodes         public-api.js    test-events.js    visit.js
doc       index.js     options.d.ts  schema           util.d.ts

./node_modules/yaml/dist/compose:
compose-collection.d.ts  resolve-block-map.js          resolve-props.d.ts
compose-collection.js    resolve-block-scalar.d.ts     resolve-props.js
compose-doc.d.ts         resolve-block-scalar.js       util-contains-newline.d.ts
compose-doc.js           resolve-block-seq.d.ts        util-contains-newline.js
compose-node.d.ts        resolve-block-seq.js          util-empty-scalar-position.d.ts
compose-node.js          resolve-end.d.ts              util-empty-scalar-position.js
composer.d.ts            resolve-end.js                util-flow-indent-check.d.ts
composer.js              resolve-flow-collection.d.ts  util-flow-indent-check.js
compose-scalar.d.ts      resolve-flow-collection.js    util-map-includes.d.ts
compose-scalar.js        resolve-flow-scalar.d.ts      util-map-includes.js
resolve-block-map.d.ts   resolve-flow-scalar.js

./node_modules/yaml/dist/doc:
anchors.d.ts  applyReviver.d.ts  createNode.d.ts  directives.d.ts  Document.d.ts
anchors.js    applyReviver.js    createNode.js    directives.js    Document.js

./node_modules/yaml/dist/nodes:
addPairToJSMap.d.ts  Collection.d.ts  Node.d.ts  Scalar.d.ts  YAMLMap.d.ts
addPairToJSMap.js    Collection.js    Node.js    Scalar.js    YAMLMap.js
Alias.d.ts           identity.d.ts    Pair.d.ts  toJS.d.ts    YAMLSeq.d.ts
Alias.js             identity.js      Pair.js    toJS.js      YAMLSeq.js

./node_modules/yaml/dist/parse:
cst.d.ts         cst-scalar.js       cst-visit.d.ts  lexer.js           parser.d.ts
cst.js           cst-stringify.d.ts  cst-visit.js    line-counter.d.ts  parser.js
cst-scalar.d.ts  cst-stringify.js    lexer.d.ts      line-counter.js

./node_modules/yaml/dist/schema:
common  json              Schema.d.ts  tags.d.ts  types.d.ts
core    json-schema.d.ts  Schema.js    tags.js    yaml-1.1

./node_modules/yaml/dist/schema/common:
map.d.ts  map.js  null.d.ts  null.js  seq.d.ts  seq.js  string.d.ts  string.js

./node_modules/yaml/dist/schema/core:
bool.d.ts  bool.js  float.d.ts  float.js  int.d.ts  int.js  schema.d.ts  schema.js

./node_modules/yaml/dist/schema/json:
schema.d.ts  schema.js

./node_modules/yaml/dist/schema/yaml-1.1:
binary.d.ts  bool.js     int.d.ts    merge.js   pairs.d.ts   schema.js  timestamp.d.ts
binary.js    float.d.ts  int.js      omap.d.ts  pairs.js     set.d.ts   timestamp.js
bool.d.ts    float.js    merge.d.ts  omap.js    schema.d.ts  set.js

./node_modules/yaml/dist/stringify:
foldFlowLines.d.ts        stringifyDocument.d.ts  stringifyPair.d.ts
foldFlowLines.js          stringifyDocument.js    stringifyPair.js
stringifyCollection.d.ts  stringify.d.ts          stringifyString.d.ts
stringifyCollection.js    stringify.js            stringifyString.js
stringifyComment.d.ts     stringifyNumber.d.ts
stringifyComment.js       stringifyNumber.js

./node_modules/yargs:
browser.d.ts  build    index.cjs  lib      locales       package.json  yargs
browser.mjs   helpers  index.mjs  LICENSE  node_modules  README.md     yargs.mjs

./node_modules/yargs/build:
index.cjs  lib

./node_modules/yargs/build/lib:
argsert.js     completion-templates.js  typings   validation.js
command.js     middleware.js            usage.js  yargs-factory.js
completion.js  parse-command.js         utils     yerror.js

./node_modules/yargs/build/lib/typings:
common-types.js  yargs-parser-types.js

./node_modules/yargs/build/lib/utils:
apply-extends.js  levenshtein.js         obj-filter.js    set-blocking.js
is-promise.js     maybe-async-result.js  process-argv.js  which-module.js

./node_modules/yargs/helpers:
helpers.mjs  index.js  package.json

./node_modules/yargs/lib:
platform-shims

./node_modules/yargs/lib/platform-shims:
browser.mjs  esm.mjs

./node_modules/yargs/locales:
be.json  es.json  hu.json  ko.json  pirate.json  ru.json     uz.json
cs.json  fi.json  id.json  nb.json  pl.json      th.json     zh_CN.json
de.json  fr.json  it.json  nl.json  pt_BR.json   tr.json     zh_TW.json
en.json  hi.json  ja.json  nn.json  pt.json      uk_UA.json

./node_modules/yargs/node_modules:
ansi-regex  emoji-regex  string-width  strip-ansi

./node_modules/yargs/node_modules/ansi-regex:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/yargs/node_modules/emoji-regex:
es2015  index.d.ts  index.js  LICENSE-MIT.txt  package.json  README.md  text.js

./node_modules/yargs/node_modules/emoji-regex/es2015:
index.js  text.js

./node_modules/yargs/node_modules/string-width:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/yargs/node_modules/strip-ansi:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/yargs-parser:
browser.js  build  CHANGELOG.md  LICENSE.txt  package.json  README.md

./node_modules/yargs-parser/build:
index.cjs  lib

./node_modules/yargs-parser/build/lib:
index.js  string-utils.js  tokenize-arg-string.js  yargs-parser.js  yargs-parser-types.js

./node_modules/@yarnpkg:
lockfile

./node_modules/@yarnpkg/lockfile:
index.js  package.json  README.md

./node_modules/yauzl:
index.js  LICENSE  package.json  README.md

./node_modules/yoctocolors-cjs:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/yocto-queue:
index.d.ts  index.js  license  package.json  readme.md

./node_modules/zod:
index.cjs    index.d.ts  LICENSE       README.md  v3  v4-mini
index.d.cts  index.js    package.json  src        v4

./node_modules/zod/src:
index.ts  v3  v4  v4-mini

./node_modules/zod/src/v3:
benchmarks  external.ts  index.ts  standard-schema.ts  types.ts
errors.ts   helpers      locales   tests               ZodError.ts

./node_modules/zod/src/v3/benchmarks:
datetime.ts            index.ts  object.ts      realworld.ts  union.ts
discriminatedUnion.ts  ipv4.ts   primitives.ts  string.ts

./node_modules/zod/src/v3/helpers:
enumUtil.ts  errorUtil.ts  parseUtil.ts  partialUtil.ts  typeAliases.ts  util.ts

./node_modules/zod/src/v3/locales:
en.ts

./node_modules/zod/src/v3/tests:
all-errors.test.ts             function.test.ts             partials.test.ts
anyunknown.test.ts             generics.test.ts             pickomit.test.ts
array.test.ts                  instanceof.test.ts           pipeline.test.ts
async-parsing.test.ts          intersection.test.ts         preprocess.test.ts
async-refinements.test.ts      language-server.source.ts    primitive.test.ts
base.test.ts                   language-server.test.ts      promise.test.ts
bigint.test.ts                 literal.test.ts              readonly.test.ts
branded.test.ts                map.test.ts                  record.test.ts
catch.test.ts                  masking.test.ts              recursive.test.ts
coerce.test.ts                 mocker.test.ts               refine.test.ts
complex.test.ts                Mocker.ts                    safeparse.test.ts
custom.test.ts                 nan.test.ts                  set.test.ts
date.test.ts                   nativeEnum.test.ts           standard-schema.test.ts
deepmasking.test.ts            nullable.test.ts             string.test.ts
default.test.ts                number.test.ts               transformer.test.ts
description.test.ts            object-augmentation.test.ts  tuple.test.ts
discriminated-unions.test.ts   object-in-es5-env.test.ts    unions.test.ts
enum.test.ts                   object.test.ts               validations.test.ts
error.test.ts                  optional.test.ts             void.test.ts
firstpartyschematypes.test.ts  parser.test.ts
firstparty.test.ts             parseUtil.test.ts

./node_modules/zod/src/v4:
classic  core  index.ts  locales  mini

./node_modules/zod/src/v4/classic:
checks.ts  compat.ts  external.ts  iso.ts    schemas.ts
coerce.ts  errors.ts  index.ts     parse.ts  tests

./node_modules/zod/src/v4/classic/tests:
anyunknown.test.ts            firstparty.test.ts     primitive.test.ts
array.test.ts                 function.test.ts       promise.test.ts
assignability.test.ts         generics.test.ts       prototypes.test.ts
async-parsing.test.ts         index.test.ts          readonly.test.ts
async-refinements.test.ts     instanceof.test.ts     record.test.ts
base.test.ts                  intersection.test.ts   recursive-types.test.ts
bigint.test.ts                json.test.ts           refine.test.ts
brand.test.ts                 lazy.test.ts           registries.test.ts
catch.test.ts                 literal.test.ts        set.test.ts
coalesce.test.ts              map.test.ts            standard-schema.test.ts
coerce.test.ts                nan.test.ts            stringbool.test.ts
continuability.test.ts        nested-refine.test.ts  string-formats.test.ts
custom.test.ts                nonoptional.test.ts    string.test.ts
date.test.ts                  nullable.test.ts       template-literal.test.ts
datetime.test.ts              number.test.ts         to-json-schema.test.ts
default.test.ts               object.test.ts         transform.test.ts
description.test.ts           optional.test.ts       tuple.test.ts
discriminated-unions.test.ts  partial.test.ts        union.test.ts
enum.test.ts                  pickomit.test.ts       validations.test.ts
error.test.ts                 pipe.test.ts           void.test.ts
error-utils.test.ts           prefault.test.ts
file.test.ts                  preprocess.test.ts

./node_modules/zod/src/v4/core:
api.ts     doc.ts       json-schema.ts  schemas.ts          util.ts
checks.ts  errors.ts    parse.ts        standard-schema.ts  versions.ts
config.ts  function.ts  regexes.ts      tests               zsf.ts
core.ts    index.ts     registries.ts   to-json-schema.ts

./node_modules/zod/src/v4/core/tests:
index.test.ts  locales

./node_modules/zod/src/v4/core/tests/locales:
be.test.ts  en.test.ts  ru.test.ts  tr.test.ts

./node_modules/zod/src/v4/locales:
ar.ts  cs.ts  es.ts     fr.ts  index.ts  ko.ts  no.ts   pt.ts  ta.ts  ur.ts
az.ts  de.ts  fa.ts     he.ts  it.ts     mk.ts  ota.ts  ru.ts  th.ts  vi.ts
be.ts  en.ts  fi.ts     hu.ts  ja.ts     ms.ts  pl.ts   sl.ts  tr.ts  zh-CN.ts
ca.ts  eo.ts  fr-CA.ts  id.ts  kh.ts     nl.ts  ps.ts   sv.ts  ua.ts  zh-TW.ts

./node_modules/zod/src/v4/mini:
checks.ts  coerce.ts  external.ts  index.ts  iso.ts  parse.ts  schemas.ts  tests

./node_modules/zod/src/v4/mini/tests:
assignability.test.ts  computed.test.ts   index.test.ts   prototypes.test.ts
brand.test.ts          error.test.ts      number.test.ts  recursive-types.test.ts
checks.test.ts         functions.test.ts  object.test.ts  string.test.ts

./node_modules/zod/src/v4-mini:
index.ts

./node_modules/zod/v3:
errors.cjs      external.d.ts  index.js               types.cjs       ZodError.d.ts
errors.d.cts    external.js    locales                types.d.cts     ZodError.js
errors.d.ts     helpers        standard-schema.cjs    types.d.ts
errors.js       index.cjs      standard-schema.d.cts  types.js
external.cjs    index.d.cts    standard-schema.d.ts   ZodError.cjs
external.d.cts  index.d.ts     standard-schema.js     ZodError.d.cts

./node_modules/zod/v3/helpers:
enumUtil.cjs    errorUtil.d.cts  parseUtil.d.ts     partialUtil.js     util.cjs
enumUtil.d.cts  errorUtil.d.ts   parseUtil.js       typeAliases.cjs    util.d.cts
enumUtil.d.ts   errorUtil.js     partialUtil.cjs    typeAliases.d.cts  util.d.ts
enumUtil.js     parseUtil.cjs    partialUtil.d.cts  typeAliases.d.ts   util.js
errorUtil.cjs   parseUtil.d.cts  partialUtil.d.ts   typeAliases.js

./node_modules/zod/v3/locales:
en.cjs  en.d.cts  en.d.ts  en.js

./node_modules/zod/v4:
classic  core  index.cjs  index.d.cts  index.d.ts  index.js  locales  mini

./node_modules/zod/v4/classic:
checks.cjs    coerce.d.ts   errors.cjs      external.d.ts  iso.cjs      parse.d.ts
checks.d.cts  coerce.js     errors.d.cts    external.js    iso.d.cts    parse.js
checks.d.ts   compat.cjs    errors.d.ts     index.cjs      iso.d.ts     schemas.cjs
checks.js     compat.d.cts  errors.js       index.d.cts    iso.js       schemas.d.cts
coerce.cjs    compat.d.ts   external.cjs    index.d.ts     parse.cjs    schemas.d.ts
coerce.d.cts  compat.js     external.d.cts  index.js       parse.d.cts  schemas.js

./node_modules/zod/v4/core:
api.cjs       errors.cjs         parse.cjs         standard-schema.cjs
api.d.cts     errors.d.cts       parse.d.cts       standard-schema.d.cts
api.d.ts      errors.d.ts        parse.d.ts        standard-schema.d.ts
api.js        errors.js          parse.js          standard-schema.js
checks.cjs    function.cjs       regexes.cjs       to-json-schema.cjs
checks.d.cts  function.d.cts     regexes.d.cts     to-json-schema.d.cts
checks.d.ts   function.d.ts      regexes.d.ts      to-json-schema.d.ts
checks.js     function.js        regexes.js        to-json-schema.js
core.cjs      index.cjs          registries.cjs    util.cjs
core.d.cts    index.d.cts        registries.d.cts  util.d.cts
core.d.ts     index.d.ts         registries.d.ts   util.d.ts
core.js       index.js           registries.js     util.js
doc.cjs       json-schema.cjs    schemas.cjs       versions.cjs
doc.d.cts     json-schema.d.cts  schemas.d.cts     versions.d.cts
doc.d.ts      json-schema.d.ts   schemas.d.ts      versions.d.ts
doc.js        json-schema.js     schemas.js        versions.js

./node_modules/zod/v4/locales:
ar.cjs    de.cjs    fi.cjs       id.cjs       ko.cjs    ota.cjs    sl.cjs    ua.cjs
ar.d.cts  de.d.cts  fi.d.cts     id.d.cts     ko.d.cts  ota.d.cts  sl.d.cts  ua.d.cts
ar.d.ts   de.d.ts   fi.d.ts      id.d.ts      ko.d.ts   ota.d.ts   sl.d.ts   ua.d.ts
ar.js     de.js     fi.js        id.js        ko.js     ota.js     sl.js     ua.js
az.cjs    en.cjs    fr-CA.cjs    index.cjs    mk.cjs    pl.cjs     sv.cjs    ur.cjs
az.d.cts  en.d.cts  fr-CA.d.cts  index.d.cts  mk.d.cts  pl.d.cts   sv.d.cts  ur.d.cts
az.d.ts   en.d.ts   fr-CA.d.ts   index.d.ts   mk.d.ts   pl.d.ts    sv.d.ts   ur.d.ts
az.js     en.js     fr-CA.js     index.js     mk.js     pl.js      sv.js     ur.js
be.cjs    eo.cjs    fr.cjs       it.cjs       ms.cjs    ps.cjs     ta.cjs    vi.cjs
be.d.cts  eo.d.cts  fr.d.cts     it.d.cts     ms.d.cts  ps.d.cts   ta.d.cts  vi.d.cts
be.d.ts   eo.d.ts   fr.d.ts      it.d.ts      ms.d.ts   ps.d.ts    ta.d.ts   vi.d.ts
be.js     eo.js     fr.js        it.js        ms.js     ps.js      ta.js     vi.js
ca.cjs    es.cjs    he.cjs       ja.cjs       nl.cjs    pt.cjs     th.cjs    zh-CN.cjs
ca.d.cts  es.d.cts  he.d.cts     ja.d.cts     nl.d.cts  pt.d.cts   th.d.cts  zh-CN.d.cts
ca.d.ts   es.d.ts   he.d.ts      ja.d.ts      nl.d.ts   pt.d.ts    th.d.ts   zh-CN.d.ts
ca.js     es.js     he.js        ja.js        nl.js     pt.js      th.js     zh-CN.js
cs.cjs    fa.cjs    hu.cjs       kh.cjs       no.cjs    ru.cjs     tr.cjs    zh-TW.cjs
cs.d.cts  fa.d.cts  hu.d.cts     kh.d.cts     no.d.cts  ru.d.cts   tr.d.cts  zh-TW.d.cts
cs.d.ts   fa.d.ts   hu.d.ts      kh.d.ts      no.d.ts   ru.d.ts    tr.d.ts   zh-TW.d.ts
cs.js     fa.js     hu.js        kh.js        no.js     ru.js      tr.js     zh-TW.js

./node_modules/zod/v4/mini:
checks.cjs    coerce.d.cts    external.d.ts  index.js   parse.cjs    schemas.d.cts
checks.d.cts  coerce.d.ts     external.js    iso.cjs    parse.d.cts  schemas.d.ts
checks.d.ts   coerce.js       index.cjs      iso.d.cts  parse.d.ts   schemas.js
checks.js     external.cjs    index.d.cts    iso.d.ts   parse.js
coerce.cjs    external.d.cts  index.d.ts     iso.js     schemas.cjs

./node_modules/zod/v4-mini:
index.cjs  index.d.cts  index.d.ts  index.js

./node_modules/zod-to-json-schema:
changelog.md     createIndex.ts  LICENSE       postcjs.ts  README.md
contributing.md  dist            package.json  postesm.ts  SECURITY.md

./node_modules/zod-to-json-schema/dist:
cjs  esm  types

./node_modules/zod-to-json-schema/dist/cjs:
errorMessages.js    Options.js    parsers        selectParser.js
getRelativePath.js  package.json  parseTypes.js  zodToJsonSchema.js
index.js            parseDef.js   Refs.js

./node_modules/zod-to-json-schema/dist/cjs/parsers:
any.js      catch.js    intersection.js  nullable.js  pipeline.js  string.js
array.js    date.js     literal.js       null.js      promise.js   tuple.js
bigint.js   default.js  map.js           number.js    readonly.js  undefined.js
boolean.js  effects.js  nativeEnum.js    object.js    record.js    union.js
branded.js  enum.js     never.js         optional.js  set.js       unknown.js

./node_modules/zod-to-json-schema/dist/esm:
errorMessages.js    Options.js    parsers        selectParser.js
getRelativePath.js  package.json  parseTypes.js  zodToJsonSchema.js
index.js            parseDef.js   Refs.js

./node_modules/zod-to-json-schema/dist/esm/parsers:
any.js      catch.js    intersection.js  nullable.js  pipeline.js  string.js
array.js    date.js     literal.js       null.js      promise.js   tuple.js
bigint.js   default.js  map.js           number.js    readonly.js  undefined.js
boolean.js  effects.js  nativeEnum.js    object.js    record.js    union.js
branded.js  enum.js     never.js         optional.js  set.js       unknown.js

./node_modules/zod-to-json-schema/dist/types:
errorMessages.d.ts    index.d.ts    parseDef.d.ts  parseTypes.d.ts  selectParser.d.ts
getRelativePath.d.ts  Options.d.ts  parsers        Refs.d.ts        zodToJsonSchema.d.ts

./node_modules/zod-to-json-schema/dist/types/parsers:
any.d.ts      date.d.ts          map.d.ts         object.d.ts    set.d.ts
array.d.ts    default.d.ts       nativeEnum.d.ts  optional.d.ts  string.d.ts
bigint.d.ts   effects.d.ts       never.d.ts       pipeline.d.ts  tuple.d.ts
boolean.d.ts  enum.d.ts          nullable.d.ts    promise.d.ts   undefined.d.ts
branded.d.ts  intersection.d.ts  null.d.ts        readonly.d.ts  union.d.ts
catch.d.ts    literal.d.ts       number.d.ts      record.d.ts    unknown.d.ts

./public:
firebase-messaging-sw.js

./src:
ai  app  components  config  hooks  lib  services

./src/ai:
dev.ts  flows  genkit.ts

./src/ai/flows:
suggest-response.ts  summarize-chat-history.ts

./src/app:
admin  api  c  chat  favicon.ico  globals.css  layout.tsx  login  page.tsx  super-admin

./src/app/admin:
ai-config  contacts   groups   interests   live-chat
broadcast  dashboard  history  layout.tsx  profile

./src/app/admin/ai-config:
page.tsx

./src/app/admin/broadcast:

./src/app/admin/contacts:
_components  page.tsx

./src/app/admin/contacts/_components:
cell-action.tsx  columns.tsx

./src/app/admin/dashboard:
page.tsx

./src/app/admin/groups:
_components  page.tsx

./src/app/admin/groups/_components:
cell-action.tsx  columns.tsx  group-form-modal.tsx  group-modal.tsx

./src/app/admin/history:
_components  page.tsx

./src/app/admin/history/_components:
cell-action.tsx  columns.tsx

./src/app/admin/interests:
_components  page.tsx

./src/app/admin/interests/_components:
cell-action.tsx  columns.tsx

./src/app/admin/live-chat:
page.tsx

./src/app/admin/profile:
_components  page.tsx

./src/app/admin/profile/_components:
account-settings-form.tsx  chat-link-display.tsx  profile-form.tsx

./src/app/api:
summarize

./src/app/api/summarize:
route.ts

./src/app/c:
'[adminId]'

'./src/app/c/[adminId]':
page.tsx

./src/app/chat:
'[adminId]'  '[adminUid]'

'./src/app/chat/[adminId]':

'./src/app/chat/[adminUid]':
page.tsx

./src/app/login:
page.tsx

./src/app/super-admin:
admins     ai-settings  contacts   groups   layout.tsx  profile
ai-config  broadcast    dashboard  history  live-chat   users

./src/app/super-admin/admins:
_components  page.tsx

./src/app/super-admin/admins/_components:
cell-action.tsx  columns.tsx

./src/app/super-admin/ai-config:
page.tsx

./src/app/super-admin/ai-settings:
page.tsx

./src/app/super-admin/broadcast:

./src/app/super-admin/contacts:
_components  page.tsx

./src/app/super-admin/contacts/_components:
cell-action.tsx  columns.tsx

./src/app/super-admin/dashboard:
page.tsx

./src/app/super-admin/groups:
_components  page.tsx

./src/app/super-admin/groups/_components:
columns.tsx

./src/app/super-admin/history:
_components

./src/app/super-admin/history/_components:
columns.tsx

./src/app/super-admin/live-chat:

./src/app/super-admin/profile:
_components  page.tsx

./src/app/super-admin/profile/_components:
profile-form.tsx

./src/app/super-admin/users:
_components  page.tsx

./src/app/super-admin/users/_components:
cell-action.tsx  columns.tsx

./src/components:
admin  chat.tsx        icons.tsx  main-nav.tsx           sidebar-nav.tsx  user-nav.tsx
chat   data-table.tsx  logo.tsx   notification-bell.tsx  ui

./src/components/admin:
AddContactModal.tsx  admin-nav.tsx  ChatLinkSharer.tsx  ContactManager.tsx

./src/components/chat:
LeadCaptureModal.tsx  PublicChatView.tsx

./src/components/ui:
accordion.tsx     carousel.tsx       image-uploader.tsx  radio-group.tsx  switch.tsx
alert-dialog.tsx  chart.tsx          input.tsx           scroll-area.tsx  table.tsx
alert.tsx         checkbox.tsx       label.tsx           select.tsx       tabs.tsx
avatar.tsx        collapsible.tsx    loader.tsx          separator.tsx    textarea.tsx
badge.tsx         dialog.tsx         menubar.tsx         sheet.tsx        toaster.tsx
button.tsx        dropdown-menu.tsx  multi-select.tsx    sidebar.tsx      toast.tsx
calendar.tsx      form.tsx           popover.tsx         skeleton.tsx     tooltip.tsx
card.tsx          heading.tsx        progress.tsx        slider.tsx

./src/config:
nav-links.ts

./src/hooks:
use-auth.tsx  useFirebaseMessaging.js  use-mobile.tsx  use-toast.ts

./src/lib:
data.ts  firebase.ts  types.ts  utils.ts

./src/services:
authService.ts    contactService.ts  neutralize.ts
configService.ts  groupService.ts    userService.ts

## Descrição detalhada da estrutura atual
Chegamos às seguintes conclusões sobre como a arquitetura da inteligência artificial deve funcionar para ser robusta, escalável e, acima de tudo, inteligente.

1. Configuração de IA em Dois Níveis: Global e Pessoal

Conclusão: A plataforma terá dois níveis de configuração de IA.
Nível Global (Gerenciado pelo Super Admin): Define a "personalidade" base e as regras de segurança para toda a aplicação. Funciona como um fallback (plano B) e uma diretriz geral.
Nível Pessoal (Gerenciado por cada Admin, incluindo o Super Admin): Permite que cada administrador refine e personalize o comportamento da IA para o seu atendimento específico, adicionando instruções sobre seus produtos, estilo de comunicação, etc.
Hierarquia: A instrução Pessoal sempre terá prioridade, complementando ou sobrescrevendo a instrução Global.
2. Controle de Privacidade de Dados do Cliente

Conclusão: A decisão de usar os dados de um cliente (como nome, interesses, histórico) para personalizar as respostas da IA é sensível e deve ser controlada.
Definição: Esta funcionalidade será controlada por um interruptor ("Usar Informações Personalizadas"). Cada administrador terá seu próprio interruptor, dando a ele controle total sobre seus atendimentos. A configuração global do Super Admin definirá apenas o valor padrão para novos administradores.
3. A "Memória" da IA: Enriquecendo o Contexto

Conclusão: O maior valor da IA é sua capacidade de ser um assistente que "conhece" o cliente. Para isso, o sistema precisa de uma "memória".
Definição: A memória da IA será construída a partir de duas fontes de dados, que serão injetadas no prompt em tempo real (se o interruptor de privacidade permitir):
Dados do Perfil do Contato: Informações estruturadas como Nome, Tags de Grupos e Interesses.
Histórico de Conversas (Resumido): Em vez de analisar conversas antigas inteiras a cada vez, o sistema irá, ao arquivar um chat, criar um resumo conciso daquela interação e salvá-lo. Nos atendimentos futuros, a IA lerá esses resumos para entender rapidamente o histórico do cliente.
Com base nessas definições, este é o nosso plano para a próxima fase de desenvolvimento:

Disponibilizar o Controle de Privacidade para Todos: Adicionar o interruptor "Usar Informações Personalizadas" à página de configuração de IA do administrador comum (/admin/ai-config).

Criar o Sistema de Memória (Arquivamento e Resumo):

Criar uma nova rota de API (ex: /api/archiveConversation).
Essa rota será responsável por usar a API de resumo existente (/api/summarize) e salvar o resultado em um local apropriado no histórico do contato no Firestore.
Implementar a Lógica de Resposta Inteligente:

Identificar ou criar a API que gera as respostas da IA em tempo real.
Modificá-la para que, antes de chamar o modelo de IA, ela: a. Verifique se tem permissão para usar dados do cliente. b. Se sim, busque os dados do perfil do contato e os resumos do histórico. c. Monte um "mega prompt" final contendo: a instrução Global, a instrução Pessoal, os dados do contato e o histórico resumido.
Este plano aborda todas as suas observações e nos dá um caminho claro para construir a funcionalidade exatamente como imaginamos.

## Lógica de IA em dois níveis (Global e Pessoal) 
Não é apenas uma regra no backend, mas um conceito claro e intuitivo para o usuário final, a implementação na interface deve seguir estritamente a arquitetura de "pastas" e "molduras" que estabelecemos.

Isso se materializa na página de configuração de IA de cada administrador.

A Implementação Correta:

Contexto: Um administrador (Admin, o "Dono da Loja") acessa sua área restrita, protegida pela "moldura" em /admin/layout.tsx, e navega para a sua página de configuração de IA pessoal, localizada em /admin/ai-config.

Lógica de Carregamento da Página: Ao carregar a página /admin/ai-config, o componente responsável executará a seguinte sequência de busca de dados:

Primeiro, buscar a Configuração Global: O sistema fará uma leitura no banco de dados para obter a instrução de IA Global. Esta instrução é gerenciada exclusivamente pelo Super Admin (o "Dono do Shopping") em sua própria "pasta" segura (/super-admin/ai-config).
Em seguida, buscar a Configuração Pessoal: O sistema buscará a instrução de IA Pessoal do Admin que está logado.
A Experiência do Usuário (O Ponto Crucial):

Se o Admin nunca salvou uma configuração pessoal, a caixa de texto para a sua instrução não será exibida em branco. Em vez disso, ela virá pré-preenchida com o texto da configuração Global.
Se o Admin já salvou uma configuração pessoal, a caixa de texto mostrará a sua própria instrução, como esperado.
Por que esta abordagem é Arquiteturalmente Correta:

Materializa a Hierarquia: Ao pré-preencher com a instrução Global, a interface comunica visualmente ao "Dono da Loja" que ele não está começando do zero. Ele está herdando uma base, uma "lei" vinda do "Dono do Shopping", e seu papel é complementar ou sobrescrever essa base, exatamente como definido na nossa arquitetura.

Reforça o Propósito das "Pastas": A implementação demonstra que os dados gerenciados na "pasta" /super-admin têm um impacto direto e servem como fundação para o que acontece na "pasta" /admin. Isso solidifica a relação de dependência hierárquica entre os dois tipos de administradores.

Cria um Contrato Visual: A interface deixa de ser apenas um formulário e passa a ser um "contrato" que ensina ao usuário as regras do sistema, evitando confusão e garantindo que o comportamento da IA seja consistente, a menos que seja intencionalmente alterado por um Admin.

Seguir esta diretriz não apenas melhora a usabilidade, mas também serve como uma barreira de proteção contra futuros erros de lógica, pois força qualquer desenvolvedor a reconhecer e implementar a hierarquia de configurações diretamente na interface do usuário.

## Usabilidade dos tipoos de Admin e Estrutura de pastas e códigos
1: O Primeiro Acesso e Tomada de Posse

Ação: Ele se cadastra na plataforma pela primeira vez.
Onde Acontece: A lógica da função signUp em src/services/authService.ts detecta que não há outros usuários e atribui a ele o role: 'superadmin'.
Ação: Ele faz login em /login (usando o componente src/app/login/page.tsx).
Ação: Após o sucesso, ele é redirecionado para /super-admin/dashboard.
A "Moldura" em Ação: Sua entrada na "pasta" /super-admin é validada pelo layout src/app/super-admin/layout.tsx. Este arquivo é o "segurança" da área do Dono do Shopping. Ele verifica if (user.role !== 'superadmin') e expulsa qualquer um que não tenha essa credencial. Todo e qualquer arquivo dentro de /super-admin/* está protegido por esta moldura.
Passo 2: Configurando o "Shopping" (Mandato Global)

Ação: Ele navega pelo menu (definido em src/app/super-admin/layout.tsx) até "Configurações de IA".
Onde Acontece: Isso o leva para a URL /super-admin/ai-config, que renderiza o arquivo de página src/app/super-admin/ai-config/page.tsx.
Ação: Nesta página, ele encontra um campo de texto chamado "Instrução Global de IA". O que ele escreve aqui é a "lei" para todo o shopping.
Onde Acontece: O formulário nesta página salva essa instrução em um local central no Firestore (ex: config/ai_global).
Passo 3: Configurando a Sua Própria "Loja"

Ação: Como qualquer usuário, ele também tem um perfil público. Ele navega para /super-admin/profile.
Onde Acontece: A página src/app/super-admin/profile/page.tsx é renderizada, contendo o formulário profile-form.tsx.
Ação: Ele preenche seu nome de exibição e saudação.
Onde Acontece: O formulário executa a lógica de writeBatch, salvando seus dados públicos no "crachá" em public_profiles/{seu_user_id}, como o README.md descreve.
Ele chega depois, herda as regras do shopping e personaliza sua própria loja.

Passo 1: Abrindo a Loja

Ação: Ele se cadastra (não sendo o primeiro usuário).
Onde Acontece: A mesma função signUp em src/services/authService.ts agora atribui a ele o role: 'admin'.
Ação: Ele faz login em /login.
Ação: Após o sucesso, ele é redirecionado para /admin/dashboard. Ele nunca consegue acessar /super-admin/dashboard, pois a "moldura" daquela pasta o expulsaria.
A "Moldura" em Ação: Sua entrada na "pasta" /admin é validada pelo layout src/app/admin/layout.tsx. Este é o "segurança" da área dos lojistas. Ele valida a posse do role: 'admin'.
Passo 2: Criando o "Crachá" da Loja

Ação: Ele navega pelo menu em seu layout para "Editar Perfil".
Onde Acontece: Isso o leva para /admin/profile, renderizando a página src/app/admin/profile/page.tsx e seu formulário (profile-form.tsx).
Ação: Ele define seu "Nome de Exibição", "Avatar" e "Frase de Saudação".
Onde Acontece: Exatamente como o Super Admin, seu formulário salva os dados na coleção public_profiles/{seu_user_id}. A lógica é a mesma, o componente é reutilizado, mas a "moldura" que o cerca é diferente.
Passo 3: Personalizando a IA da Loja (O Ponto Crucial)

Ação: Ele navega para /admin/ai-config.
Onde Acontece: A página src/app/admin/ai-config/page.tsx é renderizada.
A Hierarquia em Ação: O componente nesta página executa a seguinte lógica:
Primeiro, ele lê a "Lei do Shopping": Busca a instrução global de config/ai_global no Firestore.
Depois, ele verifica as anotações pessoais: Busca a instrução pessoal do Admin (ex: users/{seu_user_id}/ai_config).
A Mágica da Usabilidade: Se a instrução pessoal estiver vazia, a caixa de texto na tela aparece pré-preenchida com a instrução global. Isso o ensina visualmente sobre a hierarquia.
Ação: Ele edita o texto, adicionando detalhes sobre seus produtos.
Onde Acontece: Ao salvar, o formulário salva essa nova instrução apenas em seu documento pessoal (users/{seu_user_id}/ai_config), sem nunca tocar na configuração global. Ele também vê e controla seu próprio interruptor de privacidade, conforme definido no README.md.
Conclusão da Jornada:

A estrutura de pastas do /app funciona como a planta de um shopping.

/app/super-admin é a sala da administração central. Apenas o Dono do Shopping tem a chave. O layout.tsx é a porta blindada.
/app/admin é o andar com todas as lojas. Cada Dono de Loja tem acesso a este andar e à sua própria loja, mas não à sala da administração. O layout.tsx daqui é o segurança do andar.
Componentes reutilizados (como o profile-form) são como os balcões e vitrines: o modelo é o mesmo, mas o que cada lojista exibe neles é único.
Arquivos de página como /admin/ai-config/page.tsx são os locais onde a "herança" das regras do shopping se torna visível e editável para o lojista.