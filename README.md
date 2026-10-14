# FinanControl — Aplicativo de Controle Financeiro Pessoal

Front-end (projeto UI) do FinanControl, desenvolvido no Projeto Integrador II do
curso de Tecnologia em Sistemas para Internet (UESPI / UAPI).

O FinanControl permite que o usuário registre suas receitas e despesas,
acompanhe o saldo do mês, visualize relatórios por categoria e defina metas
financeiras.

| Entrega | O que foi feito |
|---------|-----------------|
| Entrega 2 | Telas em HTML, CSS e JavaScript, com os dados guardados no navegador (`localStorage`). |
| **Entrega 3** | Telas ligadas à **API REST** ([financontrol-api](https://github.com/willdemar00/financontrol-api)): os dados passam a ficar em um banco relacional, com login por token e senha criptografada. Nova tela de **Categorias**. |

---

## Grupo 01 — Belém do Piauí

| Nr. | Aluno(a)                        |
|-----|---------------------------------|
| 01  | Elda de Sousa Carvalho          |
| 02  | Evangelista Generosa dos Santos |
| 03  | Joseane de Carvalho Gomes       |
| 04  | Perciliana Generosa dos Santos  |
| 05  | Rosimary de Sousa Carvalho      |
| 06  | Wildemar Pedro Leal             |

**Orientador:** Esp. Mateus Abreu

---

## Tecnologias

### Front-end (este repositório)

| Tecnologia | Uso no projeto |
|------------|----------------|
| **HTML5** | Estrutura semântica das páginas, formulários e atributos de acessibilidade (`aria-*`, `role`). |
| **CSS3** | Estilização completa, sem framework: variáveis CSS, Flexbox, CSS Grid e *media queries*. |
| **JavaScript (ES2017+, sem framework)** | Interatividade, validações e gráficos. Usa `fetch` e `async/await` para conversar com a API. |
| **SVG inline** | Ícones e gráficos (linha, barras e rosca) desenhados sem bibliotecas externas. |
| **Fetch API + JSON** | Comunicação com o back-end. Todo o acesso fica isolado em `js/dados.js`. |
| **Git e GitHub** | Versionamento do código e repositório remoto compartilhado pelo grupo. |

### Back-end (repositório [financontrol-api](https://github.com/willdemar00/financontrol-api))

Node.js + Express 5, banco relacional SQLite, senhas com bcrypt, autenticação
por JSON Web Token e testes automatizados com `node:test`. Os detalhes estão no
README da API.

---

## Como executar

O front-end precisa da API rodando.

**1. Suba a API** (detalhes no README do [financontrol-api](https://github.com/willdemar00/financontrol-api)):

```bash
git clone https://github.com/willdemar00/financontrol-api.git
cd financontrol-api
npm install
npm run seed
npm start
```

**2. Abra o front-end:**

```bash
git clone https://github.com/willdemar00/financontrol-web.git
```

Dê um duplo clique em **`index.html`**. Também funciona com a extensão
*Live Server* do VS Code ou qualquer servidor de arquivos estáticos.

O endereço da API fica em `js/config.js` (padrão: `http://localhost:3333/api`).
Se ela não estiver no ar, as telas mostram um aviso com o botão
**Tentar novamente**.

### Acesso para avaliação

Depois de `npm run seed` na API, entre com:

| E-mail | Senha |
|--------|-------|
| `demo@financontrol.com` | `demo1234` |

Esse usuário já tem seis meses de lançamentos e quatro metas. Também é possível
criar uma conta nova em **"Criar uma conta gratuita"**.

---

## Estrutura do projeto

```
financontrol-web/
├── index.html          → tela de login
├── cadastro.html       → cadastro de usuário
├── painel.html         → página inicial (saldo, indicadores e gráfico)
├── lancamentos.html    → listagem e registro de receitas e despesas
├── relatorios.html     → relatórios e gráficos por categoria
├── metas.html          → metas financeiras
├── categorias.html     → cadastro de categorias (novo na Entrega 3)
├── css/
│   └── style.css       → folha de estilo única do projeto
├── js/
│   ├── config.js       → endereço da API
│   ├── dados.js        → comunicação com a API (fetch + token)
│   ├── comum.js        → menu, formatação, avisos de carregamento e de erro
│   ├── login.js        → autenticação
│   ├── cadastro.js     → cadastro de usuário
│   ├── painel.js       → página inicial
│   ├── lancamentos.js  → receitas e despesas
│   ├── relatorios.js   → relatórios e exportação CSV
│   ├── metas.js        → metas financeiras
│   └── categorias.js   → categorias de receitas e despesas
├── assets/
│   └── favicon.svg
└── README.md
```

Na Entrega 2, o acesso a dados foi isolado em `dados.js` justamente para esta
etapa: as funções mantiveram os mesmos nomes e passaram a chamar a API. Como a
comunicação pela rede é assíncrona, as telas agora esperam a resposta
(`await`) antes de desenhar.

---

## Tarefas da Sprint 2 — projeto UI

Tarefas da lista **Sprint 2 — Entrega 3** do quadro do grupo no Trello
(mínimo exigido: 8 tarefas). Cada tarefa corresponde a um commit neste repositório.

| # | Tarefa (cartão no Trello) | Requisito | Onde está | Situação |
|---|---------------------------|-----------|-----------|----------|
| 1 | Criar o módulo de comunicação com a API | — | `js/config.js`, `js/dados.js` | ✅ Concluído |
| 2 | Integrar o cadastro de usuários à API | RF01 | `js/cadastro.js` | ✅ Concluído |
| 3 | Integrar o login à API e controlar a sessão por token | RF02 | `js/login.js`, `js/dados.js` | ✅ Concluído |
| 4 | Exibir avisos de carregamento e de falha de conexão | RNF04 | `js/comum.js`, `css/style.css` | ✅ Concluído |
| 5 | Integrar o painel e o saldo do mês à API | RF06 | `js/painel.js` | ✅ Concluído |
| 6 | Integrar o registro, a edição e a exclusão de lançamentos à API | RF03, RF04, RF09 | `js/lancamentos.js` | ✅ Concluído |
| 7 | Desenvolver a tela de cadastro de categorias | RF05 | `categorias.html`, `js/categorias.js` | ✅ Concluído |
| 8 | Integrar os relatórios e os gráficos à API | RF07, RF08 | `js/relatorios.js` | ✅ Concluído |
| 9 | Integrar a exportação do relatório em CSV à API | RF12 | `js/relatorios.js`, `js/dados.js` | ✅ Concluído |
| 10 | Integrar as metas financeiras à API | RF11 | `js/metas.js` | ✅ Concluído |

---

## Validações

As validações acontecem nas telas, para avisar o usuário na hora, e **de novo na
API**, que é quem grava os dados:

- E-mail único por usuário (**RN01**);
- Senha com no mínimo 8 caracteres, contendo letras e números (**RN02**);
- Senha guardada só como hash bcrypt na API (**RNF05**);
- Valor do lançamento obrigatoriamente maior que zero;
- Descrição, data e categoria obrigatórias; a categoria precisa ser do mesmo tipo do lançamento;
- Valor já guardado de uma meta não pode passar do objetivo;
- Categoria com lançamentos não pode ser excluída;
- Páginas internas exigem sessão aberta; com o token vencido, o sistema volta para o login;
- Escape de HTML nos textos digitados pelo usuário, evitando injeção de código.

---

## Links do projeto

- **Quadro no Trello:** https://trello.com/b/Ouj8Q5Dn
- **API (back-end):** https://github.com/willdemar00/financontrol-api
- **Documentação completa (PI II):** arquivo `FinanControl_PI2.docx` entregue na plataforma

---

## Próximos passos

- Recuperação de senha por e-mail;
- Publicar a API e o front-end em um servidor na nuvem;
- Revisão de acessibilidade e usabilidade (RNF04) e manual básico do usuário.
