# AGENTS.md — SafeWay Mobile

> **Expo mudou.** Antes de escrever código, leia a documentação da versão exata: https://docs.expo.dev/versions/v57.0.0/. APIs de versões antigas (SDK 50–54) que você conhece de memória podem estar erradas aqui.

Responda sempre em **português**.

## Visão geral

App mobile do SafeWay para o **motorista de transporte escolar** (projeto integrador da SPTech). Ele porta para o celular as funcionalidades do front-end web e acrescenta um assistente por voz.

- **Funcionalidades:** login/cadastro, início, alunos agrupados por escola (cadastro e edição de aluno e escola), itinerários (cadastro, edição com arrastar para ordenar, histórico), rota com mapa e chamada de presença, financeiro (gráficos, mensalidades, despesas) e perfil.
- **Assistente (aba Assistente):** o motorista fala ou digita ("o Enzo entrou na van", "como está meu financeiro?"). A transcrição é feita no celular; o texto vai para uma API Python (ainda não existe), que executa as ações no banco e responde.
- **Estado atual: integrado ao back-end.** As telas chamam a API core (Java/Spring, porta 8080) e a API financeira (porta 8081) no IP do `API_HOST`, sem deploy. Só o assistente segue mockado (`services/iaMock.js`) enquanto a API Python não existe. `data/mock.js` fica no projeto como referência, mas nenhuma tela importa dele.
- **Fonte da verdade:** telas e regras vêm do front-end web (`../front-end/src/pages/*.jsx`); **contrato de dados** vem dos DTOs do back-end (`../back-end/src/main/java/com/safeway/tech/api/dto`, `../safeway-financial-api`). O web legado usa a API antiga em português e não serve de contrato.
- **Fora de escopo:** o fluxo de **pais/responsáveis foi vetado**. Não crie telas nem login para eles.

## Tech stack

| Camada | Tecnologia |
| --- | --- |
| Base | Expo SDK 57 (`expo ~57.0.31`), React Native 0.86.3, React 19.2.3, JavaScript/JSX (sem TypeScript) |
| Navegação | `expo-router ~57.0.29`: Stack na raiz, Tabs em `app/(app)/`, Stack aninhado por aba |
| Mapa | `react-native-maps 1.27.2` (Google Maps) + Routes API via `fetch` |
| Localização | `expo-location` |
| Voz | `expo-speech-recognition ^57.1.1` (reconhecimento nativo do aparelho, `pt-BR`) |
| Gráficos | `react-native-svg 15.15.4` (rosca); barras feitas com `View` |
| Animação/gestos | `react-native-reanimated 4.5.1`, `react-native-worklets`, `react-native-gesture-handler`, `react-native-sortables` |
| Ícones | `@expo/vector-icons` (Ionicons) |
| Build | EAS (`eas.json`: `development`, `preview`, `production`), `expo-dev-client` |
| Projeto EAS | `@gustavosptech/safeway-fe-mobile`, projectId `3f6f8e0b-8311-42ad-a9bd-e2f5b78c31a9` |

## Comandos operacionais

```bash
npm install                                  # precisa do .npmrc (legacy-peer-deps=true)
npx expo start                               # dev server; abrir no app SafeWay (dev build)
npx expo start --tunnel                      # celular em outra rede
npx expo start -c                            # limpa cache do Metro
npx expo install <pacote>                    # instalar libs com versão compatível do SDK
npx expo install --fix                       # alinhar versões quando o doctor reclamar
npx expo-doctor                              # esperado: 21/21 checks passed
npx expo export --platform android --output-dir "$env:TEMP\safeway-export"   # valida o bundle (PowerShell)
eas build --profile development --platform android                         # APK de desenvolvimento
eas env:create --name NOME --value "..." --environment development --visibility sensitive --non-interactive
eas credentials                              # SHA-1 do keystore (Android > development)
```

- O ambiente do usuário é **Windows + PowerShell**. `&&` funciona no PowerShell 7, mas prefira `;` ou comandos separados.
- `eas login` pede senha: **o usuário roda**, não o agente.
- Para inspecionar a config sem vazar a chave: `npx expo config --type public --json` filtrado com `node -e` (nunca imprima `extra.googleMaps`).

## Estrutura de pastas

```
app/                         Rotas (Expo Router: cada arquivo é uma tela)
  _layout.jsx                Stack raiz + GestureHandlerRootView
  index.jsx, login.jsx, register.jsx
  (app)/                     Área logada
    _layout.jsx              Tabs + FinanceiroProvider + ChamadaProvider
    index.jsx                Início
    alunos/                  index (escolas colapsáveis), [id], cadastrar, escola-cadastrar, escola-editar/[id]
    itinerarios/             index, cadastrar, editar/[id], historico/[id], rota/[id] (mapa + chamada)
    assistente.jsx           Chat com IA (voz + texto)
    financeiro/              index (dashboard), mensalidades, despesas, despesa (criar/editar)
    perfil.jsx
components/                  Button, Input, Select, Checkbox, Card, ScreenHeader, BackHeader,
                             KeyboardScreen, EscolaForm, EstadoCarregamento, charts/ (BarChart, DonutChart), financeiro/
contexts/                    FinanceiroContext (mensalidades/pagamentos da API), ChamadaContext (chamada aberta na API)
hooks/                       useCarregar (busca no foco), useKeyboardBottomInset, useTranscricao
services/                    api.js (cliente HTTP, token em memória, erros), auth, usuario, escolas, alunos,
                             itinerarios, chamadas, financeiro, rotas.js (Routes API), ia.js (API Python ou mock), iaMock.js
data/mock.js                 Mocks antigos, só referência (nenhuma tela importa)
utils/                       formatters, validators, financeiro (KPIs, séries), trajeto, polyline
constants/colors.js          Paleta (única fonte de cores)
app.config.js                Config dinâmica; lê o .env
eas.json, .env.example, .npmrc, README.md
```

`android/` e `ios/` são gerados (CNG) e ficam fora do git.

Repositórios irmãos (mesma pasta `../`): `front-end` (web React), `back-end` (Java/Spring, otimização de rotas), `safeway-financial-api` (mensalidades e pagamentos).

## Convenções de código

- **Idioma:** nomes de domínio e funções novas em português (`buscarCaminhoPelasRuas`, `marcarPresenca`, `mensalidades`). Campos da API ficam **exatamente** como a API (`dataVencimento`, `valorMensalidade`, `status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO'`).
- **Componentes:** função; telas com `export default`, componentes reutilizáveis com export nomeado (`export function Card`). Props documentadas com JSDoc quando o componente é compartilhado.
- **Imports:** relativos (`../../components/Button`); não há alias.
- **Estilos:** `StyleSheet.create` no fim do arquivo; cores só de `constants/colors.js` (se precisar de uma nova, adicione lá).
- **Telas:** `SafeAreaView` com `edges` explícito; cabeçalho com `ScreenHeader` (abas) ou `BackHeader` (telas internas); formulários dentro de `KeyboardScreen`.
- **Chamadas à API:** sempre por uma função em `services/<domínio>.js` (com o endpoint no JSDoc) usando `apiCore` ou `apiFinanceiro` de `services/api.js`; telas não usam `fetch` direto. Leitura de tela com `useCarregar` + `EstadoCarregamento`; erro de ação vira `Alert.alert(título, erro.message)`. Não há fallback para mock.
- **Formatos da API core:** ids UUID (string), horários `"HH:mm:ss"`, datas `"YYYY-MM-DD"`, enums em inglês (`TO_SCHOOL`/`FROM_SCHOOL`, `PRESENT`/`ABSENT`, `IN_PROGRESS`/`FINISHED`/`CANCELLED`, `DAYCARE_CENTER`...). Erros vêm em texto puro.
- **Textos de UI:** português, com acentuação correta. Ações destrutivas pedem confirmação com `Alert.alert`.
- **Comentários:** só para restrições que o código não mostra. Nada de comentário narrando a linha seguinte.
- **Commits:** conventional commits em português (`feat: tela de chat com IA`, `fix: ...`).

## Restrições

- **Nunca** commitar nem imprimir a chave do Google. Ela vive no `.env` (gitignored) em `GOOGLE_MAPS_API_KEY`; o SHA-1 em `GOOGLE_ANDROID_CERT_SHA1`; a URL da IA em `IA_API_URL`; o IP do back-end em `API_HOST`. Variável nova → atualizar `.env.example` e o README.
- O token JWT fica **só em memória** (`services/api.js`), por decisão do usuário. Não persista sem ele pedir.
- Back-end: mudanças só **aditivas**, na branch `feat/integracao-mobile` do `../back-end` (commits em inglês, padrão do repo). Não altere contrato existente.
- O EAS **não** recebe o `.env`; variáveis do build vão com `eas env:create`.
- Biblioteca **nativa** nova (ou plugin/permissão nova no `app.config.js`) exige **APK novo**. Prefira soluções só em JS e avise o usuário quando o APK for necessário.
- Módulo nativo deve ser carregado de forma que o app **não quebre no Expo Go** (ex.: `requireOptionalNativeModule`, como em `hooks/useTranscricao.js`).
- Não troque `softwareKeyboardLayoutMode: 'pan'` nem o padrão de teclado (`KeyboardScreen` + `useKeyboardBottomInset`) sem testar todas as telas com formulário.
- `eas build:configure` não edita config dinâmica: mudanças de EAS vão à mão no `app.config.js`.
- Escopo: quando o usuário disser "corrige somente isso", não mexa em mais nada.
- Não invente campos: confira nos DTOs do back-end.

## Definição de pronto

1. Comportamento igual ao web (quando existir equivalente), com os campos exatamente como a API devolve.
2. `ReadLints` sem erros nos arquivos editados.
3. `npx expo export --platform android ...` termina sem erro.
4. `npx expo-doctor` com 21/21.
5. Regra de negócio não trivial testada com script Node (bundle com `npx esbuild <arquivo> --bundle --platform=node --format=esm`), apagando o script depois.
6. Teclado conferido em telas com campos de texto.
7. README e `.env.example` atualizados se mudou setup, variável ou comando.
8. Resposta final diz o que **não** foi testado no aparelho e se é preciso gerar APK novo.

## Links de referência

- Expo SDK 57: https://docs.expo.dev/versions/v57.0.0/
- Expo Router: https://docs.expo.dev/router/introduction/
- Development builds: https://docs.expo.dev/develop/development-builds/introduction/
- EAS Build: https://docs.expo.dev/build/introduction/ · variáveis: https://docs.expo.dev/eas/environment-variables/
- react-native-maps: https://github.com/react-native-maps/react-native-maps
- Routes API (computeRoutes): https://developers.google.com/maps/documentation/routes/compute_route_directions
- expo-speech-recognition: https://github.com/jamsch/expo-speech-recognition
- Mapa preto no Expo Go (SDK 55+): https://github.com/expo/expo/issues/49323
- Repositórios: https://github.com/project-safeway (`front-end`, `back-end`, `safeway-financial-api`, `safeway-fe-mobile`)

## Mitigação de erros recorrentes

| Sintoma | Causa | Solução |
| --- | --- | --- |
| `npm install` com `ERESOLVE` | Peer deps do SDK 57 | Manter o `.npmrc` (`legacy-peer-deps=true`) |
| Mapa preto | Expo Go do SDK 55+ vem com chave do Maps expirada | Usar o development build |
| Mapa cinza/em branco no dev build | Pacote/SHA-1 fora da restrição da chave | Conferir `com.safeway.mobile` + SHA-1 no Google Cloud |
| Rota em linha reta tracejada + `API_KEY_ANDROID_APP_BLOCKED` | Faltam headers `X-Android-Package`/`X-Android-Cert` | Preencher `GOOGLE_ANDROID_CERT_SHA1` |
| `The caller does not have permission` (Routes API) | Routes API desativada ou **faturamento fechado** (situação atual da conta) | Resolver faturamento no Google Cloud; não é bug do app |
| `Cannot cast 'Map' to String` no `fetch` | Header com valor não-string (ex.: `extra` com `null` vira `{}`) | Spreads condicionais no `app.config.js` e `typeof === 'string'` antes de usar |
| `Cannot find native module ...` | APK antigo sem a lib nativa | Gerar APK novo |
| `.env` alterado sem efeito | Lido só na inicialização | Reiniciar `npx expo start` |
| `expo-doctor` reclama de versões/patches | Pacotes desalinhados | `npx expo install --fix` |
| `npx expo install` instala versão de outro SDK em lib de terceiros | Lib fora do catálogo do Expo | Fixar a faixa do SDK (ex.: `expo-speech-recognition@^57`) |
| Acentos viram `�` em arquivo criado pelo terminal | `Set-Content` do PowerShell 5 grava em ANSI | Usar a ferramenta de escrita de arquivos ou `[IO.File]::WriteAllText(..., UTF8Encoding($false))` |
| Comando rodou na pasta errada | O cwd do shell persiste entre chamadas | Sempre `cd "<caminho absoluto>"` no início |
| Percentuais da legenda somam 101% | Arredondamento simples | Método do maior resto (`utils/financeiro.js`) |
| "Não foi possível conectar ao servidor" | `API_HOST` errado, outra rede ou firewall | Conferir IP (`ipconfig`), mesma Wi-Fi, liberar 8080/8081 no Firewall do Windows |
| Cadastro de escola/aluno: "Não foi possível localizar o endereço" | Geocoding falhou na API core | Conferir endereço e a chave Google configurada no back-end |
| "A API financeira recusou o login" | Financeira com par RSA diferente da core | Usar as mesmas chaves RSA nas duas APIs |
| Mensalidade não aparece após cadastrar aluno | RabbitMQ ou API financeira parados | Subir RabbitMQ e a API financeira |
| HTTP bloqueado (`Network request failed`) só em APK preview/production | Android bloqueia HTTP sem TLS fora do debug | Usar o development build; liberar cleartext exige config nativa + APK novo |

## Hábitos de prompt

**Para quem pede:**
- Aponte a tela do web que serve de referência (caminho do arquivo) e o que muda em relação a ela.
- Para erro, cole a saída do terminal ou um print; diga se é Expo Go ou development build.
- Delimite o escopo ("só isso", "não mexe no layout").
- Sessão muito longa: abra um chat novo; este arquivo carrega o contexto.

**Para o agente:**
- Leia o equivalente no web e os arquivos que vai editar antes de mudar qualquer coisa.
- Confira a doc do SDK 57 (ou da lib, na versão instalada) antes de usar uma API nativa.
- Decisão que é do usuário (layout, provedor pago, fluxo): pergunte com opções em vez de supor.
- Ao final, resuma em português: o que mudou, como foi validado, o que falta testar no aparelho e se precisa de APK novo.

## MCP

Nenhum servidor MCP está configurado para este projeto. O back-end roda só na máquina do usuário (sem deploy), então o agente não tem acesso aos dados reais: valide contratos lendo os DTOs/controllers em `../back-end` e `../safeway-financial-api` e a collection do Postman que o usuário fornecer (pode estar desatualizada; o código é a referência). Quando a API Python da IA existir, documente aqui o contrato e o acesso.
