/* ==========================================================================
   dados.js - Camada de acesso aos dados do FinanControl
   --------------------------------------------------------------------------
   Na Entrega 2 os dados ficavam no localStorage do navegador. A partir da
   Entrega 3 todas as funcoes deste arquivo conversam com a API REST
   (projeto financontrol-api). Como agora existe comunicacao pela rede, as
   funcoes sao assincronas: devolvem uma Promise e as telas usam "await".

   No navegador fica guardada apenas a sessao: o token de login e o nome e o
   e-mail do usuario, para montar o menu sem precisar consultar a API.
   ========================================================================== */

const Dados = (function () {
  'use strict';

  const URL_API = window.FINANCONTROL_API || 'http://localhost:3333/api';
  const CHAVE_SESSAO = 'fc_sessao';

  /* Erro devolvido pela API, com a mensagem pronta para mostrar na tela. */
  class ErroApi extends Error {
    constructor(mensagem, status, erros) {
      super(mensagem);
      this.name = 'ErroApi';
      this.status = status;
      this.erros = erros || [];
      this.semConexao = status === 0;
    }
  }

  /* ------------------------------------------------------- requisicoes */

  async function requisicao(metodo, caminho, corpo, opcoes) {
    const sessao = sessaoAtual();
    const cabecalhos = {};

    if (sessao) cabecalhos.Authorization = 'Bearer ' + sessao.token;
    if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';

    let resposta;
    try {
      resposta = await fetch(URL_API + caminho, {
        method: metodo,
        headers: cabecalhos,
        body: corpo === undefined ? undefined : JSON.stringify(corpo)
      });
    } catch (erro) {
      throw new ErroApi('Não foi possível conectar à API do FinanControl. ' +
        'Verifique se ela está rodando em ' + URL_API + '.', 0);
    }

    /* Token vencido ou invalido: encerra a sessao e volta para o login. */
    if (resposta.status === 401 && sessao) {
      encerrarSessao();
      window.location.href = 'index.html?sessao=expirada';
      throw new ErroApi('Sua sessão expirou. Faça login novamente.', 401);
    }

    if (resposta.status === 204) return null;

    if (resposta.ok && opcoes && opcoes.arquivo) {
      return resposta.blob();
    }

    let dados = null;
    try {
      dados = await resposta.json();
    } catch (erro) {
      dados = null;
    }

    if (!resposta.ok) {
      throw new ErroApi(
        (dados && dados.mensagem) || 'A API respondeu com o erro ' + resposta.status + '.',
        resposta.status,
        dados && dados.erros
      );
    }

    return dados;
  }

  /* Monta a query string ignorando filtros vazios. */
  function consulta(parametros) {
    const partes = Object.keys(parametros)
      .filter(function (chave) {
        return parametros[chave] !== undefined && parametros[chave] !== null && parametros[chave] !== '';
      })
      .map(function (chave) {
        return encodeURIComponent(chave) + '=' + encodeURIComponent(parametros[chave]);
      });
    return partes.length ? '?' + partes.join('&') : '';
  }

  /* --------------------------------------------------------------- sessao */

  function abrirSessao(resposta) {
    const sessao = {
      token: resposta.token,
      id: resposta.usuario.id,
      nome: resposta.usuario.nome,
      email: resposta.usuario.email
    };
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    return sessao;
  }

  function sessaoAtual() {
    try {
      const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
      /* Sessoes antigas da Entrega 2 nao tinham token: sao descartadas. */
      return sessao && sessao.token ? sessao : null;
    } catch (erro) {
      return null;
    }
  }

  function encerrarSessao() {
    localStorage.removeItem(CHAVE_SESSAO);
  }

  /* ------------------------------------------------- usuarios (RF01, RF02) */

  async function cadastrarUsuario(nome, email, senha) {
    const resposta = await requisicao('POST', '/auth/cadastro', { nome: nome, email: email, senha: senha });
    return abrirSessao(resposta);
  }

  async function autenticar(email, senha) {
    const resposta = await requisicao('POST', '/auth/login', { email: email, senha: senha });
    return abrirSessao(resposta);
  }

  /* --------------------------------------------------- categorias (RF05) */

  function listarCategorias(tipo) {
    return requisicao('GET', '/categorias' + consulta({ tipo: tipo }));
  }

  function salvarCategoria(dados) {
    if (dados.id) return requisicao('PUT', '/categorias/' + dados.id, { nome: dados.nome });
    return requisicao('POST', '/categorias', { nome: dados.nome, tipo: dados.tipo });
  }

  function removerCategoria(id) {
    return requisicao('DELETE', '/categorias/' + id);
  }

  /* ------------------------------------- lancamentos (RF03, RF04, RF09) */

  function listarLancamentos(filtros) {
    return requisicao('GET', '/lancamentos' + consulta(filtros || {}));
  }

  function lancamentosDoMes(mes, filtros) {
    return listarLancamentos(Object.assign({ mes: mes }, filtros));
  }

  function buscarLancamento(id) {
    return requisicao('GET', '/lancamentos/' + id);
  }

  function salvarLancamento(dados) {
    const corpo = {
      tipo: dados.tipo,
      valor: dados.valor,
      data: dados.data,
      descricao: dados.descricao,
      categoriaId: dados.categoriaId,
      formaPagamento: dados.formaPagamento,
      fixa: Boolean(dados.fixa)
    };
    if (dados.id) return requisicao('PUT', '/lancamentos/' + dados.id, corpo);
    return requisicao('POST', '/lancamentos', corpo);
  }

  function removerLancamento(id) {
    return requisicao('DELETE', '/lancamentos/' + id);
  }

  /* ------------------------------------ resumo e relatorios (RF06 a RF08) */

  function resumoDoMes(mes) {
    return requisicao('GET', '/resumo' + consulta({ mes: mes }));
  }

  function evolucao(mes, meses) {
    return requisicao('GET', '/relatorios/evolucao' + consulta({ mes: mes, meses: meses }));
  }

  function totaisPorCategoria(mes, tipo) {
    return requisicao('GET', '/relatorios/categorias' + consulta({ mes: mes, tipo: tipo }));
  }

  /* Baixa o CSV gerado pela API (RF12). */
  async function exportarCsv(mes) {
    const arquivo = await requisicao('GET', '/relatorios/exportar' + consulta({ mes: mes }), undefined, { arquivo: true });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(arquivo);
    link.download = 'financontrol-' + mes + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  }

  /* ------------------------------------------------------- metas (RF11) */

  function listarMetas() {
    return requisicao('GET', '/metas');
  }

  function salvarMeta(dados) {
    const corpo = {
      descricao: dados.descricao,
      valorAlvo: dados.valorAlvo,
      valorAtual: dados.valorAtual,
      prazo: dados.prazo || null,
      prioridade: dados.prioridade
    };
    if (dados.id) return requisicao('PUT', '/metas/' + dados.id, corpo);
    return requisicao('POST', '/metas', corpo);
  }

  function removerMeta(id) {
    return requisicao('DELETE', '/metas/' + id);
  }

  /* API pública do módulo */
  return {
    URL_API: URL_API,
    ErroApi: ErroApi,
    FORMAS_PAGAMENTO: ['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Débito automático', 'Transferência'],

    cadastrarUsuario: cadastrarUsuario,
    autenticar: autenticar,
    sessaoAtual: sessaoAtual,
    encerrarSessao: encerrarSessao,

    listarCategorias: listarCategorias,
    salvarCategoria: salvarCategoria,
    removerCategoria: removerCategoria,

    listarLancamentos: listarLancamentos,
    lancamentosDoMes: lancamentosDoMes,
    buscarLancamento: buscarLancamento,
    salvarLancamento: salvarLancamento,
    removerLancamento: removerLancamento,

    resumoDoMes: resumoDoMes,
    evolucao: evolucao,
    totaisPorCategoria: totaisPorCategoria,
    exportarCsv: exportarCsv,

    listarMetas: listarMetas,
    salvarMeta: salvarMeta,
    removerMeta: removerMeta
  };
})();
