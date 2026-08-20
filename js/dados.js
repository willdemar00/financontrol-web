/* ==========================================================================
   dados.js - Camada de acesso aos dados do FinanControl
   --------------------------------------------------------------------------
   Nesta entrega o projeto e apenas front-end, por isso os dados são gravados
   no localStorage do navegador. Toda leitura e escrita passa por este arquivo,
   de modo que na Entrega 3, quando o backend for implementado, basta trocar o
   corpo destas funcoes por chamadas a API - as telas não precisarao mudar.
   ========================================================================== */

const Dados = (function () {
  'use strict';

  const CHAVES = {
    usuarios: 'fc_usuarios',
    sessao: 'fc_sessao',
    lancamentos: 'fc_lancamentos',
    metas: 'fc_metas'
  };

  /* ---------------------------------------------------------- utilitarios */

  function ler(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || [];
    } catch (erro) {
      console.error('Falha ao ler ' + chave, erro);
      return [];
    }
  }

  function gravar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
  }

  function novoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* Cifra simples apenas para não guardar a senha em texto puro no navegador.
     A criptografia definitiva (bcrypt) será feita no backend, na Entrega 3. */
  function cifrar(texto) {
    let hash = 5381;
    for (let i = 0; i < texto.length; i++) {
      hash = ((hash << 5) + hash + texto.charCodeAt(i)) | 0;
    }
    return 'fc$' + Math.abs(hash).toString(16);
  }

  /* ------------------------------------------------------------- usuários */

  function listarUsuarios() {
    return ler(CHAVES.usuarios);
  }

  function buscarUsuarioPorEmail(email) {
    const alvo = String(email || '').trim().toLowerCase();
    return listarUsuarios().find(function (u) { return u.email === alvo; }) || null;
  }

  function cadastrarUsuario(nome, email, senha) {
    const usuarios = listarUsuarios();
    const emailLimpo = String(email).trim().toLowerCase();

    if (usuarios.some(function (u) { return u.email === emailLimpo; })) {
      return { ok: false, mensagem: 'Este e-mail já esta cadastrado.' };
    }

    const usuario = {
      id: novoId(),
      nome: String(nome).trim(),
      email: emailLimpo,
      senha: cifrar(senha),
      criadoEm: new Date().toISOString()
    };

    usuarios.push(usuario);
    gravar(CHAVES.usuarios, usuarios);
    return { ok: true, usuario: usuario };
  }

  function autenticar(email, senha) {
    const usuario = buscarUsuarioPorEmail(email);
    if (!usuario || usuario.senha !== cifrar(senha)) {
      return { ok: false, mensagem: 'E-mail ou senha incorretos.' };
    }
    return { ok: true, usuario: usuario };
  }

  /* --------------------------------------------------------------- sessao */

  function abrirSessao(usuario) {
    gravar(CHAVES.sessao, { id: usuario.id, nome: usuario.nome, email: usuario.email });
  }

  function sessaoAtual() {
    try {
      return JSON.parse(localStorage.getItem(CHAVES.sessao));
    } catch (erro) {
      return null;
    }
  }

  function encerrarSessao() {
    localStorage.removeItem(CHAVES.sessao);
  }

  /* ---------------------------------------------------------- lançamentos */

  function listarLancamentos() {
    const sessao = sessaoAtual();
    if (!sessao) return [];
    return ler(CHAVES.lancamentos)
      .filter(function (l) { return l.usuarioId === sessao.id; })
      .sort(function (a, b) { return b.data.localeCompare(a.data); });
  }

  function salvarLancamento(dados) {
    const sessao = sessaoAtual();
    if (!sessao) return null;

    const todos = ler(CHAVES.lancamentos);

    if (dados.id) {
      const indice = todos.findIndex(function (l) { return l.id === dados.id; });
      if (indice >= 0) {
        todos[indice] = Object.assign(todos[indice], dados);
      }
    } else {
      dados.id = novoId();
      dados.usuarioId = sessao.id;
      dados.criadoEm = new Date().toISOString();
      todos.push(dados);
    }

    gravar(CHAVES.lancamentos, todos);
    return dados;
  }

  function removerLancamento(id) {
    const restantes = ler(CHAVES.lancamentos).filter(function (l) { return l.id !== id; });
    gravar(CHAVES.lancamentos, restantes);
  }

  function buscarLancamento(id) {
    return listarLancamentos().find(function (l) { return l.id === id; }) || null;
  }

  /* ----------------------------------------------------------------- metas */

  function listarMetas() {
    const sessao = sessaoAtual();
    if (!sessao) return [];
    return ler(CHAVES.metas).filter(function (m) { return m.usuarioId === sessao.id; });
  }

  function salvarMeta(dados) {
    const sessao = sessaoAtual();
    if (!sessao) return null;

    const todas = ler(CHAVES.metas);

    if (dados.id) {
      const indice = todas.findIndex(function (m) { return m.id === dados.id; });
      if (indice >= 0) todas[indice] = Object.assign(todas[indice], dados);
    } else {
      dados.id = novoId();
      dados.usuarioId = sessao.id;
      todas.push(dados);
    }

    gravar(CHAVES.metas, todas);
    return dados;
  }

  function removerMeta(id) {
    gravar(CHAVES.metas, ler(CHAVES.metas).filter(function (m) { return m.id !== id; }));
  }

  /* ------------------------------------------------------------- cálculos */

  /* Retorna os lançamentos de um mês no formato 'AAAA-MM'. */
  function lancamentosDoMes(mes) {
    return listarLancamentos().filter(function (l) { return l.data.slice(0, 7) === mes; });
  }

  function resumoDoMes(mes) {
    const lista = lancamentosDoMes(mes);
    let receitas = 0;
    let despesas = 0;

    lista.forEach(function (l) {
      if (l.tipo === 'receita') receitas += Number(l.valor);
      else despesas += Number(l.valor);
    });

    return {
      receitas: receitas,
      despesas: despesas,
      saldo: receitas - despesas,
      quantidade: lista.length,
      qtdReceitas: lista.filter(function (l) { return l.tipo === 'receita'; }).length,
      qtdDespesas: lista.filter(function (l) { return l.tipo === 'despesa'; }).length
    };
  }

  function totaisPorCategoria(mes) {
    const mapa = {};
    lancamentosDoMes(mes)
      .filter(function (l) { return l.tipo === 'despesa'; })
      .forEach(function (l) {
        mapa[l.categoria] = (mapa[l.categoria] || 0) + Number(l.valor);
      });

    return Object.keys(mapa)
      .map(function (nome) { return { categoria: nome, total: mapa[nome] }; })
      .sort(function (a, b) { return b.total - a.total; });
  }

  /* ------------------------------------------------------- dados de exemplo */

  /* Cria alguns lançamentos na primeira vez que o usuário entra, para que as
     telas não aparecam vazias na apresentacao do projeto. */
  function semearExemplos() {
    const sessao = sessaoAtual();
    if (!sessao) return;
    if (listarLancamentos().length > 0) return;

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = function (d) { return ano + '-' + mes + '-' + String(d).padStart(2, '0'); };

    const exemplos = [
      { tipo: 'receita', valor: 2800, data: dia(5),  descricao: 'Salário', categoria: 'Salário', formaPagamento: 'Transferência', fixa: true },
      { tipo: 'receita', valor: 400,  data: dia(8),  descricao: 'Freelance — projeto de site', categoria: 'Renda extra', formaPagamento: 'Pix', fixa: false },
      { tipo: 'despesa', valor: 850,  data: dia(10), descricao: 'Aluguel', categoria: 'Moradia', formaPagamento: 'Débito automático', fixa: true },
      { tipo: 'despesa', valor: 428.9, data: dia(12), descricao: 'Supermercado', categoria: 'Alimentação', formaPagamento: 'Cartão de crédito', fixa: false },
      { tipo: 'despesa', valor: 180,  data: dia(7),  descricao: 'Combustível', categoria: 'Transporte', formaPagamento: 'Dinheiro', fixa: false },
      { tipo: 'despesa', valor: 62,   data: dia(3),  descricao: 'Cinema', categoria: 'Lazer', formaPagamento: 'Pix', fixa: false },
      { tipo: 'despesa', valor: 94.6, data: dia(2),  descricao: 'Farmácia', categoria: 'Saúde', formaPagamento: 'Cartão de débito', fixa: false }
    ];

    exemplos.forEach(salvarLancamento);

    salvarMeta({ descricao: 'Reserva de emergência', valorAlvo: 3000, valorAtual: 2040, prazo: ano + '-12', prioridade: 'Alta' });
    salvarMeta({ descricao: 'Notebook novo', valorAlvo: 3000, valorAtual: 2600, prazo: ano + '-10', prioridade: 'Média' });
  }

  /* API pública do módulo */
  return {
    CATEGORIAS_RECEITA: ['Salário', 'Renda extra', 'Investimentos', 'Outros'],
    CATEGORIAS_DESPESA: ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'],
    FORMAS_PAGAMENTO: ['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Débito automático', 'Transferência'],

    cadastrarUsuario: cadastrarUsuario,
    autenticar: autenticar,
    abrirSessao: abrirSessao,
    sessaoAtual: sessaoAtual,
    encerrarSessao: encerrarSessao,

    listarLancamentos: listarLancamentos,
    lancamentosDoMes: lancamentosDoMes,
    salvarLancamento: salvarLancamento,
    removerLancamento: removerLancamento,
    buscarLancamento: buscarLancamento,

    listarMetas: listarMetas,
    salvarMeta: salvarMeta,
    removerMeta: removerMeta,

    resumoDoMes: resumoDoMes,
    totaisPorCategoria: totaisPorCategoria,
    semearExemplos: semearExemplos
  };
})();
