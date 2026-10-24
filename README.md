# SafeWay Mobile

Aplicativo mobile do SafeWay para o motorista de transporte escolar, feito com **Expo SDK 57** (React Native 0.86 + Expo Router). Segue as funcionalidades do front-end web (alunos e escolas, itinerários, chamada com rota no mapa e financeiro) e tem um **assistente por voz**. As telas falam com o back-end real: a **API core** (Java/Spring, porta 8080) e a **API financeira** (porta 8081), rodando num PC da mesma rede do celular. Só o assistente ainda responde com mock enquanto a API Python não existe.

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [1. Instalar as dependências](#1-instalar-as-dependências)
- [2. Configurar o `.env`](#2-configurar-o-env)
- [Back-end (API core e financeira)](#back-end-api-core-e-financeira)
- [3. Escolher como rodar](#3-escolher-como-rodar)
- [4. Rodar com development build (EAS)](#4-rodar-com-development-build-eas)
- [5. Rodar localmente com Android Studio (opcional)](#5-rodar-localmente-com-android-studio-opcional)
- [Quando gerar um APK novo](#quando-gerar-um-apk-novo)
- [Assistente por voz (IA)](#assistente-por-voz-ia)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Problemas comuns](#problemas-comuns)

## Pré-requisitos

- **Node.js** em versão LTS (22 ou superior recomendado; o projeto foi testado com o Node 24) e **npm**.
- **Git**.
- **Celular Android** com o celular e o PC **na mesma rede Wi-Fi**.
- Uma **conta gratuita no Expo** ([expo.dev](https://expo.dev)) para gerar o app pelo EAS.
- Para o mapa: uma **chave do Google Maps**. Veja [Configurar o `.env`](#2-configurar-o-env).

## 1. Instalar as dependências

```bash
git clone https://github.com/project-safeway/safeway-fe-mobile.git
cd safeway-fe-mobile
npm install
```

O projeto já tem um `.npmrc` com `legacy-peer-deps=true`. Não remova esse arquivo, porque sem ele o `npm install` falha com erro de `ERESOLVE` (conflito de peer dependencies do SDK 57).

Para conferir se está tudo certo:

```bash
npx expo-doctor
```

O resultado esperado é `21/21 checks passed`.

## 2. Configurar o `.env`

Copie o modelo e preencha:

```bash
cp .env.example .env
```

```env
API_HOST=192.168.0.10
GOOGLE_MAPS_API_KEY=sua_chave_aqui
GOOGLE_ANDROID_CERT_SHA1=AA:BB:CC:...
IA_API_URL=
```

| Variável | Para que serve |
| --- | --- |
| `API_HOST` | IP do PC que roda o back-end, na mesma rede Wi-Fi do celular (no Windows: `ipconfig`, campo "Endereço IPv4"). O app chama `http://API_HOST:8080` (core) e `http://API_HOST:8081` (financeiro). Se vier com `http://` ou porta, o app ignora essas partes. |
| `GOOGLE_MAPS_API_KEY` | Mostra o mapa (Maps SDK for Android) e calcula o caminho pelas ruas na tela de rota (Routes API). |
| `GOOGLE_ANDROID_CERT_SHA1` | SHA-1 da assinatura do app. A Routes API exige esse valor quando a chave é restrita a apps Android. Aceita com ou sem `:`. |
| `IA_API_URL` | Endereço da API Python do assistente, por exemplo `http://192.168.0.10:8000`. Vazio: o assistente responde com o mock do próprio app. |

O `.env` está no `.gitignore`. **Nunca faça commit da chave.**

### Configurando a chave no Google Cloud

1. No [Google Cloud Console](https://console.cloud.google.com), ative a **Maps SDK for Android** e a **Routes API** no projeto.
2. O projeto precisa ter uma **conta de faturamento ativa**. Sem isso, a Routes API responde `The caller does not have permission`. O mapa em si aparece mesmo sem faturamento.
3. Em **Credenciais**, crie uma chave de API e configure:
   - **Restrições de aplicativo:** Apps Android, com o pacote `com.safeway.mobile` e o SHA-1 do build (veja o [passo 4](#4-rodar-com-development-build-eas)).
   - **Restrições de API:** Maps SDK for Android e Routes API.

Sem chave o app funciona normalmente. Só o mapa fica vazio e o caminho da rota aparece em linha reta tracejada.

## Back-end (API core e financeira)

Não há deploy: o back-end roda no PC e o celular acessa pelo IP da rede local.

1. **API core** (`../back-end`), branch `feat/integracao-mobile`, na porta **8080**. Ela precisa:
   - do par de chaves RSA do JWT;
   - de uma chave do Google com a **Geocoding API**, porque cadastrar escola ou aluno converte o endereço em coordenadas. Sem ela, o cadastro devolve erro de endereço não localizado.
2. **API financeira** (`../safeway-financial-api`) na porta **8081**. Ela precisa:
   - do **mesmo par de chaves RSA** da core, senão recusa o token do app;
   - do **RabbitMQ** rodando, porque as mensalidades são geradas quando um aluno é cadastrado.
3. Libere as portas 8080 e 8081 no **Firewall do Windows** para a rede privada.
4. Preencha `API_HOST` no `.env` e reinicie o `npx expo start`.

A branch `feat/integracao-mobile` da core só **acrescenta** o que o app precisa, sem mudar o que já existia:

| Mudança | Para que serve |
| --- | --- |
| `GET /routes/{id}/stops` | Alunos e escolas do itinerário na ordem do trajeto, com endereço e coordenadas (edição e mapa da rota). |
| `guardians` em `StudentResponse` e `id` em `school` | Responsável no detalhe do aluno e no financeiro; agrupar alunos por escola. |
| `createdAt` e `presences` em `AttendanceResponse` | Histórico de chamadas e retomada de uma chamada em andamento. |

Como o app se comporta com o back-end:

- **Login:** o token fica **só em memória**. Fechou o app, entra de novo. Um `401` da core volta para o login.
- **Chamada:** entrar na rota abre a chamada (`POST /routes/{id}/attendances`), ou retoma a que já está em andamento. Cada toque no switch envia `PRESENT` ou `ABSENT`. Ao finalizar, quem não está presente é enviado como `ABSENT` e a chamada é encerrada.
- **HTTP sem TLS:** funciona no development build. Um APK `preview` ou `production` bloqueia HTTP puro e precisaria de configuração nativa (e APK novo).
- **`data/mock.js`** continua no projeto como referência, mas nenhuma tela usa mais. O mock do assistente (`services/iaMock.js`) segue ativo enquanto `IA_API_URL` estiver vazio.

## 3. Escolher como rodar

| Forma | Precisa de | Mapa funciona? |
| --- | --- | --- |
| **Expo Go** | Só o app Expo Go no celular | ❌ (no SDK 57, o Expo Go para Android vem com uma chave do Google Maps expirada e o mapa fica preto) |
| **Development build (EAS)** | Conta Expo; o build é feito na nuvem | ✅ **Recomendado** |
| **`npx expo run:android`** | Android Studio + SDK + JDK 17 instalados | ✅ |

Para ver as telas sem o mapa, o Expo Go basta:

```bash
npx expo start
```

Escaneie o QR code com o app **Expo Go**. Se o projeto já tiver o `expo-dev-client` instalado, aperte `s` no terminal para trocar para o modo Expo Go.

## 4. Rodar com development build (EAS)

O development build é um APK do próprio SafeWay que inclui as bibliotecas nativas e a sua chave. Depois de instalado, ele funciona como o Expo Go: carrega o código pelo QR code e recarrega na hora quando você salva um arquivo.

### 4.1. Login e chaves no EAS (uma vez só)

```bash
npm install -g eas-cli
eas login
```

O EAS **não envia o `.env`** para o build, porque ele está no `.gitignore`. Cadastre as variáveis no ambiente `development` do EAS.

No **Git Bash**, lendo direto do `.env`:

```bash
eas env:create --name GOOGLE_MAPS_API_KEY --value "$(grep '^GOOGLE_MAPS_API_KEY=' .env | cut -d= -f2-)" --environment development --visibility sensitive --non-interactive
eas env:create --name GOOGLE_ANDROID_CERT_SHA1 --value "$(grep '^GOOGLE_ANDROID_CERT_SHA1=' .env | cut -d= -f2-)" --environment development --visibility sensitive --non-interactive
```

No **PowerShell**:

```powershell
$envs = @{}; Get-Content .env | ForEach-Object { $p = $_ -split '=', 2; if ($p.Count -eq 2) { $envs[$p[0].Trim()] = $p[1].Trim() } }
eas env:create --name GOOGLE_MAPS_API_KEY --value $envs['GOOGLE_MAPS_API_KEY'] --environment development --visibility sensitive --non-interactive
eas env:create --name GOOGLE_ANDROID_CERT_SHA1 --value $envs['GOOGLE_ANDROID_CERT_SHA1'] --environment development --visibility sensitive --non-interactive
```

### 4.2. Gerar e instalar o APK

```bash
eas build --profile development --platform android
```

- No primeiro build, responda **sim** quando perguntar se pode gerar um *Android Keystore*.
- O build roda na nuvem do Expo e leva alguns minutos. No plano gratuito pode haver fila.
- No final aparece um **link e um QR code**. Abra no celular, baixe o APK e instale. Se o Android pedir, permita instalar de fontes desconhecidas.

### 4.3. Pegar o SHA-1 (uma vez só)

```bash
eas credentials
```

Escolha **Android**, depois o perfil **development**, e copie o **SHA-1 Fingerprint**. Faça duas coisas com ele:

1. Adicione na restrição da chave no Google Cloud, junto com `com.safeway.mobile`.
2. Coloque em `GOOGLE_ANDROID_CERT_SHA1` no `.env` e no EAS (passo 4.1).

### 4.4. Desenvolver no dia a dia

```bash
npx expo start
```

Abra o app **SafeWay** instalado (não o Expo Go) e escaneie o QR code. Mudanças no código JavaScript aparecem na hora.

Se o celular não estiver na mesma rede que o PC:

```bash
npx expo start --tunnel
```

## 5. Rodar localmente com Android Studio (opcional)

Se você tiver o [Android Studio](https://developer.android.com/studio) instalado (com Android SDK, emulador ou celular com depuração USB, e JDK 17):

```bash
npx expo run:android
```

Esse comando gera a pasta `android/` (ela está no `.gitignore`), compila e instala o app. A assinatura usada é a de debug local. Para o mapa e a Routes API funcionarem, adicione o SHA-1 dela na chave do Google Cloud. Para descobrir o SHA-1:

```bash
cd android && ./gradlew signingReport
```

## Quando gerar um APK novo

**Não precisa** gerar outro APK quando você muda telas, componentes, estilos, mocks, utils ou bibliotecas só de JavaScript. Basta o `npx expo start`.

**Precisa** gerar outro APK (`eas build --profile development --platform android`) quando você:

- instala uma biblioteca com código nativo (`npx expo install ...` de câmera, mapas, SVG etc.);
- muda plugins, permissões, `package`, ícone ou splash no `app.config.js`;
- troca a chave do Google Maps;
- atualiza a versão do Expo SDK.

Se você esquecer, o app costuma mostrar um erro do tipo `Cannot find native module ...`.

## Assistente por voz (IA)

A aba **Assistente** deixa o motorista falar ou digitar pedidos como "o Enzo entrou na van", "a Valentina faltou", "quem ainda falta embarcar?" ou "como está meu financeiro este mês?".

- **Fala para texto:** feita no próprio celular com [`expo-speech-recognition`](https://github.com/jamsch/expo-speech-recognition), que usa o reconhecimento de voz do Android (o mesmo do teclado do Google). É gratuito e não precisa de chave. Precisa de internet e só funciona no development build; no Expo Go o microfone fica indisponível.
- **Presença:** só pode ser marcada com uma rota em andamento (aba Itinerário → **Iniciar Rota**). A chamada é compartilhada entre a tela da rota e o assistente, e cada marcação feita pela IA pode ser desfeita.
- **Respostas:** com `IA_API_URL` vazio, `services/iaMock.js` responde com regras simples sobre os dados já carregados no app (chamada aberta, mensalidades e despesas). Com a URL preenchida, o app chama a API Python.

Contrato esperado da API Python (`POST {IA_API_URL}/ia/mensagens`):

```json
{ "conversaId": null, "texto": "o Enzo entrou na van", "itinerarioId": "8f1c2d3e-..." }
```

```json
{
  "conversaId": "abc123",
  "resposta": "Pronto, marquei o Enzo como presente.",
  "acoes": [{ "tipo": "MARCAR_PRESENCA", "alunoId": "5b6a7c8d-...", "nomeAluno": "Enzo Gabriel Silva", "status": "PRESENTE" }]
}
```

- `conversaId` vem `null` na primeira mensagem; a API cria a conversa, guarda o texto no histórico e devolve o id, que o app reenvia nas próximas mensagens.
- `itinerarioId` é o UUID da rota em andamento, ou `null` se não houver. `alunoId` é o UUID do aluno na API core.
- `acoes` lista as presenças que a IA marcou. O app aplica na chamada aberta, e essa marcação também é enviada à API core (`PUT /attendances/{id}/presences`, que sobrescreve sem duplicar).

## Estrutura do projeto

```
app/                     Telas (Expo Router: cada arquivo é uma rota)
  index.jsx, login.jsx, register.jsx
  (app)/                 Área logada, com navegação por tabs
    index.jsx            Início
    perfil.jsx           Perfil (com troca de foto)
    alunos/              Lista por escola, detalhe, cadastro de aluno e de escola, edição de escola
    itinerarios/         Lista, cadastro, edição (arrastar para ordenar), histórico, rota + chamada
    financeiro/          Painel com gráficos, mensalidades, despesas e formulário de despesa
    assistente.jsx       Conversa com a IA por voz ou texto
components/              Componentes reutilizáveis (Input, Select, Button, Card, gráficos...)
contexts/                Estado compartilhado (FinanceiroContext, ChamadaContext), já ligado à API
hooks/                   Carregamento de dados (useCarregar), teclado e transcrição de voz (useTranscricao)
services/                api.js (cliente HTTP, token, erros), um arquivo por domínio (auth, alunos,
                         escolas, itinerarios, chamadas, financeiro, usuario), Routes API e IA
data/mock.js             Mocks antigos, mantidos só como referência (as telas não usam mais)
utils/                   Formatadores, máscaras, validações e regras de negócio
constants/colors.js      Paleta de cores
app.config.js            Configuração do Expo (lê o .env)
eas.json                 Perfis de build do EAS (development, preview, production)
```

## Problemas comuns

**"Configure API_HOST no .env..."**
O `API_HOST` está vazio. Preencha e reinicie o `npx expo start`.

**"Não foi possível conectar ao servidor em ..."**
- O back-end não está rodando ou está em outra porta.
- O celular está em outra rede. O `--tunnel` do Expo não resolve isso, porque o túnel serve só para o Metro e não para a API.
- O Firewall do Windows está bloqueando as portas 8080 e 8081.
- O IP do PC mudou (rode `ipconfig` de novo).

**"Não foi possível localizar o endereço no mapa"** ao cadastrar escola ou aluno
A API core não conseguiu converter o endereço em coordenadas. Confira os dados do endereço e a chave Google (Geocoding API) configurada no back-end.

**"A API financeira recusou o login"**
A API financeira não usa o mesmo par de chaves RSA da core.

**Cadastrei um aluno e a mensalidade não apareceu**
As mensalidades são criadas pela API financeira a partir de uma mensagem do RabbitMQ. Confira se o RabbitMQ e a API financeira estão rodando.

**`npm install` falha com `ERESOLVE`**
Confira se o arquivo `.npmrc` com `legacy-peer-deps=true` existe na raiz do projeto.

**Mapa todo preto**
No Expo Go isso é esperado (veja a [seção 3](#3-escolher-como-rodar)). No development build, confira a chave no `.env` e no EAS e se a Maps SDK for Android está ativada.

**Mapa cinza ou em branco no development build**
O SHA-1 ou o pacote `com.safeway.mobile` não está na restrição da chave.

**A rota aparece em linha reta tracejada**
A Routes API falhou. O motivo aparece no terminal do Metro, em `[rota] caminho pelas ruas indisponível: ...`:
- `API_KEY_ANDROID_APP_BLOCKED`: o `GOOGLE_ANDROID_CERT_SHA1` está vazio ou errado.
- `The caller does not have permission`: a Routes API não está ativada ou o projeto está sem faturamento.

**O microfone do assistente não funciona**
- "Só funciona no app instalado pelo development build": você está no Expo Go ou num APK gerado antes da instalação do `expo-speech-recognition`. Gere um APK novo.
- "Reconhecimento de voz indisponível": instale ou ative o app **Google** / **Serviços de fala do Google** no celular.

**Mudei o `.env` e nada aconteceu**
Pare o `npx expo start` e rode de novo. O `.env` só é lido quando o servidor inicia.

**Comportamento estranho depois de atualizar dependências**
Limpe o cache do Metro:

```bash
npx expo start -c
```
