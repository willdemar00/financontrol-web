# FinanControl — Aplicativo de Controle Financeiro Pessoal

Projeto front-end desenvolvido para a **Entrega 2** do Projeto Integrador II do
curso de Tecnologia em Sistemas para Internet (UESPI / UAPI).

O FinanControl permite que o usuário registre suas receitas e despesas,
acompanhe o saldo do mês, visualize relatórios por categoria e defina metas
financeiras.

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

## Tecnologias front-end definidas

| Tecnologia | Uso no projeto |
|------------|----------------|
| **HTML5** | Estrutura semântica das páginas, formulários com validação nativa e atributos de acessibilidade (`aria-*`, `role`). |
| **CSS3** | Estilização completa, sem framework. Uso de variáveis CSS (`:root`) para o tema, Flexbox e CSS Grid no layout e *media queries* para a responsividade. |
| **JavaScript (ES6, sem framework)** | Toda a interatividade: validações, montagem dinâmica das listas, gráficos em SVG e persistência dos dados. |
| **SVG inline** | Ícones e gráficos (linha, barras e rosca) desenhados sem bibliotecas externas, o que mantém o projeto leve e sem dependências. |
| **Web Storage API (`localStorage`)** | Armazenamento local dos dados enquanto o backend não existe. Todo o acesso está isolado em `js/dados.js`. |
| **Git e GitHub** | Versionamento do código e repositório remoto compartilhado pelo grupo. |
| **Visual Studio Code** | Editor utilizado pela equipe. |

### Por que não usamos framework

O sistema desta etapa é composto por telas de formulário e listagem, sem
necessidade de build, empacotador ou gerenciador de pacotes. Usando apenas
HTML, CSS e JavaScript o projeto **abre com um duplo clique no `index.html`**,
sem instalar nada — o que facilita a execução por todos os integrantes do grupo
e pelo professor na correção.

---

## Como executar

Não é necessário instalar nada nem rodar servidor.

1. Baixe ou clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   ```
2. Abra a pasta do projeto.
3. Dê um duplo clique em **`index.html`** (ou clique com o botão direito →
   *Abrir com* → seu navegador).

> Na primeira vez, crie uma conta pela tela **"Criar uma conta gratuita"**.
> Ao entrar, o sistema cadastra automaticamente alguns lançamentos de exemplo
> para que as telas não apareçam vazias durante a apresentação.

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
├── css/
│   └── style.css       → folha de estilo única do projeto
├── js/
│   ├── dados.js        → camada de acesso aos dados (localStorage)
│   ├── comum.js        → funções compartilhadas e menu lateral
│   ├── login.js        → autenticação
│   ├── cadastro.js     → cadastro de usuário
│   ├── painel.js       → página inicial
│   ├── lancamentos.js  → receitas e despesas
│   ├── relatorios.js   → relatórios e exportação CSV
│   └── metas.js        → metas financeiras
├── assets/
│   └── favicon.svg
└── README.md
```

A separação em `dados.js` é proposital: **todo o acesso a dados passa por esse
arquivo**. Na Entrega 3, quando o backend for implementado, basta trocar o
corpo dessas funções por chamadas à API — as telas não precisarão ser alteradas.

---

## Tarefas da Sprint 1 implementadas

Tarefas retiradas da lista **Sprint Inicial** do quadro do grupo no Trello
(mínimo exigido: 4 tarefas).

| # | Tarefa (cartão no Trello) | Requisito | Onde está | Situação |
|---|---------------------------|-----------|-----------|----------|
| 1 | Configurar o ambiente de desenvolvimento e o repositório | — | estrutura de pastas, `.gitignore`, `README.md` | ✅ Concluído |
| 2 | Desenvolver a tela de login e a autenticação | RF02 | `index.html` + `js/login.js` | ✅ Concluído |
| 3 | Criar cadastro de usuários | RF01 | `cadastro.html` + `js/cadastro.js` | ✅ Concluído |
| 4 | Desenvolver a página inicial (painel) | RF06 | `painel.html` + `js/painel.js` | ✅ Concluído |
| 5 | Implementar o registro de receitas | RF03 | `lancamentos.html` + `js/lancamentos.js` | ✅ Concluído |
| 6 | Implementar o registro de despesas | RF04 | `lancamentos.html` + `js/lancamentos.js` | ✅ Concluído |
| 7 | Modelar e implementar o banco de dados | RF10 | estrutura de dados definida em `js/dados.js` | 🔄 Em andamento (backend na Entrega 3) |

### Outros requisitos já atendidos nesta entrega

- **RF05** — categorização dos lançamentos (categorias por tipo);
- **RF09** — edição e exclusão de lançamentos;
- **RF07 / RF08** — relatórios mensais com gráficos de barras e de rosca;
- **RF11** — cadastro e acompanhamento de metas financeiras;
- **RF12** — exportação do relatório do mês em CSV;
- **RNF01** — layout responsivo (computador, tablet e celular);
- **RNF04** — interface simples, seguindo o protótipo aprovado na Entrega 1;
- **RNF05** — senha não é gravada em texto puro (a criptografia definitiva será
  feita no backend, na Entrega 3).

---

## Validações implementadas

- E-mail único por usuário (**RN01**);
- Senha com no mínimo 8 caracteres, contendo letras e números (**RN02**);
- Confirmação de senha;
- Valor do lançamento obrigatoriamente maior que zero;
- Descrição e data obrigatórias;
- Bloqueio de acesso às páginas internas sem sessão aberta;
- Escape de HTML nos textos digitados pelo usuário, evitando injeção de código.

---

## Links do projeto

- **Quadro no Trello:** https://trello.com/b/Ouj8Q5Dn
- **Documentação completa (PI II):** arquivo `FinanControl_PI2.docx` entregue na plataforma

---

## Próximos passos (Entrega 3)

- Implementar o backend e o banco de dados relacional;
- Substituir o `localStorage` por chamadas à API REST;
- Aplicar criptografia real de senha (bcrypt) e autenticação por token;
- Continuar a evolução das telas e a atualização da documentação.
