/* ==========================================================================
   comum.js - Funcoes reutilizadas por todas as telas do FinanControl
   (formatacao, protecao de rota e montagem do menu lateral)
   ========================================================================== */

const Comum = (function () {
  'use strict';

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  /* ---------------------------------------------------------- formatacao */

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL'
    });
  }

  /* Recebe '2026-09-11' e devolve '11/09/2026' sem depender do fuso horário. */
  function data(iso) {
    if (!iso) return '--';
    const partes = String(iso).split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  function mesAtual() {
    const hoje = new Date();
    return hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
  }

  function mesAnterior(mes) {
    const ano = Number(mes.slice(0, 4));
    const numero = Number(mes.slice(5, 7));
    if (numero === 1) return (ano - 1) + '-12';
    return ano + '-' + String(numero - 1).padStart(2, '0');
  }

  function nomeDoMes(mes) {
    const ano = mes.slice(0, 4);
    const numero = Number(mes.slice(5, 7));
    return MESES[numero - 1] + ' de ' + ano;
  }

  function iniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  /* Escapa o texto antes de inserir no HTML, evitando injecao de código. */
  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
  }

  function variacao(atual, anterior) {
    if (!anterior) return null;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  }

  /* ---------------------------------------------------- protecao de rota */

  /* Chamada no início de toda página interna: se não houver sessao aberta,
     devolve o visitante para a tela de login. */
  function exigirLogin() {
    const sessao = Dados.sessaoAtual();
    if (!sessao) {
      window.location.href = 'index.html';
      return null;
    }
    return sessao;
  }

  /* ------------------------------------------------------- menu lateral */

  const ICONES = {
    painel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    lancamentos: '<path d="M7 10h14M7 10l3-3M7 10l3 3"/><path d="M17 14H3M17 14l-3-3M17 14l-3 3"/>',
    relatorios: '<path d="M3 20h18"/><rect x="5" y="11" width="3.5" height="7" rx="1"/><rect x="10.2" y="6" width="3.5" height="12" rx="1"/><rect x="15.5" y="13.5" width="3.5" height="4.5" rx="1"/>',
    metas: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    marca: '<path d="M12 3v18M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H6"/>',
    sair: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>'
  };

  const PAGINAS = [
    { id: 'painel', arquivo: 'painel.html', texto: 'Painel' },
    { id: 'lancamentos', arquivo: 'lancamentos.html', texto: 'Lançamentos' },
    { id: 'relatorios', arquivo: 'relatorios.html', texto: 'Relatórios' },
    { id: 'metas', arquivo: 'metas.html', texto: 'Metas' }
  ];

  function svg(caminho, classe) {
    return '<svg class="' + (classe || 'icone') + '" viewBox="0 0 24 24">' + caminho + '</svg>';
  }

  function montarMenu(paginaAtiva, sessao) {
    const alvo = document.getElementById('menu-lateral');
    if (!alvo) return;

    const links = PAGINAS.map(function (p) {
      const ativo = p.id === paginaAtiva ? ' class="ativo"' : '';
      return '<a href="' + p.arquivo + '"' + ativo + '>' + svg(ICONES[p.id]) + p.texto + '</a>';
    }).join('');

    alvo.innerHTML =
      '<div class="marca">' +
        '<div class="simbolo">' + svg(ICONES.marca) + '</div>' +
        '<div><b>FinanControl</b><small>Controle financeiro</small></div>' +
      '</div>' +
      '<div class="menu-titulo">Principal</div>' +
      '<nav>' + links + '</nav>' +
      '<div class="usuario-rodape">' +
        '<div class="avatar">' + iniciais(sessao.nome) + '</div>' +
        '<div><b>' + escapar(sessao.nome) + '</b><span>' + escapar(sessao.email) + '</span></div>' +
        '<button class="sair" id="btn-sair" title="Sair da conta">' + svg(ICONES.sair, 'icone icone-p') + '</button>' +
      '</div>';

    document.getElementById('btn-sair').addEventListener('click', function () {
      Dados.encerrarSessao();
      window.location.href = 'index.html';
    });
  }

  /* Inicializa qualquer página interna: valida a sessao e desenha o menu
     lateral. Os dados de cada tela agora vem da API. */
  function iniciarPagina(paginaAtiva) {
    const sessao = exigirLogin();
    if (!sessao) return null;
    montarMenu(paginaAtiva, sessao);
    return sessao;
  }

  /* --------------------------------------- carregamento e falhas da API */

  const ICONE_ALERTA = '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>';

  /* Faixa vermelha no topo da página, usada quando a API não responde ou
     devolve um erro ao carregar os dados da tela. */
  function mostrarFalha(erro) {
    let faixa = document.getElementById('faixa-falha');

    if (!faixa) {
      faixa = document.createElement('div');
      faixa.id = 'faixa-falha';
      faixa.className = 'faixa-falha';
      faixa.setAttribute('role', 'alert');
      const alvo = document.querySelector('.conteudo') || document.body;
      alvo.insertBefore(faixa, alvo.firstChild);
    }

    const mensagem = erro && erro.message ? erro.message : 'Não foi possível carregar os dados.';
    faixa.innerHTML = svg(ICONE_ALERTA) + '<span>' + escapar(mensagem) + '</span>' +
      '<button type="button" class="botao botao-contorno botao-p">Tentar novamente</button>';
    faixa.querySelector('button').addEventListener('click', function () {
      window.location.reload();
    });
  }

  function esconderFalha() {
    const faixa = document.getElementById('faixa-falha');
    if (faixa) faixa.remove();
  }

  /* Mensagem de "Carregando..." dentro de uma tabela. */
  function linhaCarregando(corpo, colunas) {
    corpo.innerHTML = '<tr><td colspan="' + colunas + '" class="vazio">Carregando...</td></tr>';
  }

  /* Executa o carregamento de uma tela mostrando a barra de progresso no topo
     e, se algo der errado, a faixa de falha. */
  async function carregar(tarefa) {
    document.body.classList.add('carregando');
    try {
      await tarefa();
      esconderFalha();
    } catch (erro) {
      console.error(erro);
      mostrarFalha(erro);
    } finally {
      document.body.classList.remove('carregando');
    }
  }

  return {
    moeda: moeda,
    data: data,
    mesAtual: mesAtual,
    mesAnterior: mesAnterior,
    nomeDoMes: nomeDoMes,
    iniciais: iniciais,
    escapar: escapar,
    variacao: variacao,
    iniciarPagina: iniciarPagina,
    mostrarFalha: mostrarFalha,
    esconderFalha: esconderFalha,
    linhaCarregando: linhaCarregando,
    carregar: carregar
  };
})();
