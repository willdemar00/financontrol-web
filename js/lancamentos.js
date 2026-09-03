/* ==========================================================================
   lançamentos.js - Registro de receitas e despesas
   Requisitos atendidos:
     RF03 - registro de receitas
     RF04 - registro de despesas
     RF05 - categorizacao dos lançamentos
     RF09 - edicao e exclusao de lançamentos
   ========================================================================== */

(function () {
  'use strict';

  const sessao = Comum.iniciarPagina('lancamentos');
  if (!sessao) return;

  const modal = document.getElementById('modal');
  const form = document.getElementById('form-lancamento');
  const aviso = document.getElementById('aviso');
  const campoMes = document.getElementById('mes');
  const campoBusca = document.getElementById('busca');
  const filtroTipo = document.getElementById('filtro-tipo');

  const campos = {
    id: document.getElementById('id'),
    valor: document.getElementById('valor'),
    data: document.getElementById('data'),
    categoria: document.getElementById('categoria'),
    descricao: document.getElementById('descricao'),
    pagamento: document.getElementById('pagamento'),
    fixa: document.getElementById('fixa')
  };

  let tipoSelecionado = 'despesa';

  campoMes.value = Comum.mesAtual();
  campoMes.addEventListener('change', desenhar);
  campoBusca.addEventListener('input', desenhar);
  filtroTipo.addEventListener('change', desenhar);

  /* ---------------------------------------------------------------- modal */

  function preencherSelect(select, itens, selecionado) {
    select.innerHTML = itens.map(function (item) {
      const marca = item === selecionado ? ' selected' : '';
      return '<option value="' + item + '"' + marca + '>' + item + '</option>';
    }).join('');
  }

  function definirTipo(tipo) {
    tipoSelecionado = tipo;

    document.getElementById('aba-receita').classList.toggle('ativo', tipo === 'receita');
    document.getElementById('aba-despesa').classList.toggle('ativo', tipo === 'despesa');

    const lista = tipo === 'receita' ? Dados.CATEGORIAS_RECEITA : Dados.CATEGORIAS_DESPESA;
    preencherSelect(campos.categoria, lista, campos.categoria.value);

    document.getElementById('texto-fixa').textContent = tipo === 'receita'
      ? 'Marcar como receita recorrente (repete todo mês)'
      : 'Marcar como despesa fixa (repete todo mês)';
  }

  function abrirModal(lancamento) {
    aviso.className = 'aviso';
    form.reset();
    campos.id.value = '';

    preencherSelect(campos.pagamento, Dados.FORMAS_PAGAMENTO);

    if (lancamento) {
      document.getElementById('modal-titulo').textContent = 'Editar lançamento';
      campos.id.value = lancamento.id;
      campos.valor.value = lancamento.valor;
      campos.data.value = lancamento.data;
      campos.descricao.value = lancamento.descricao;
      campos.fixa.checked = Boolean(lancamento.fixa);
      definirTipo(lancamento.tipo);
      campos.categoria.value = lancamento.categoria;
      campos.pagamento.value = lancamento.formaPagamento || Dados.FORMAS_PAGAMENTO[0];
    } else {
      document.getElementById('modal-titulo').textContent = 'Novo lançamento';
      campos.data.value = new Date().toISOString().slice(0, 10);
      definirTipo(tipoSelecionado);
    }

    modal.classList.add('aberto');
    campos.valor.focus();
  }

  function fecharModal() {
    modal.classList.remove('aberto');
  }

  document.getElementById('btn-novo').addEventListener('click', function () { abrirModal(null); });
  document.getElementById('btn-fechar').addEventListener('click', fecharModal);
  document.getElementById('btn-cancelar').addEventListener('click', fecharModal);

  document.getElementById('aba-receita').addEventListener('click', function () { definirTipo('receita'); });
  document.getElementById('aba-despesa').addEventListener('click', function () { definirTipo('despesa'); });

  /* Fecha o modal ao clicar fora dele ou apertar Esc. */
  modal.addEventListener('click', function (evento) {
    if (evento.target === modal) fecharModal();
  });
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && modal.classList.contains('aberto')) fecharModal();
  });

  /* -------------------------------------------------------------- salvar */

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const valor = Number(campos.valor.value);

    /* RN - o valor precisa ser maior que zero. */
    if (!valor || valor <= 0) {
      aviso.textContent = 'Informe um valor maior que zero.';
      aviso.className = 'aviso erro';
      campos.valor.focus();
      return;
    }

    if (!campos.data.value) {
      aviso.textContent = 'Informe a data do lançamento.';
      aviso.className = 'aviso erro';
      return;
    }

    if (!campos.descricao.value.trim()) {
      aviso.textContent = 'Informe uma descrição para o lançamento.';
      aviso.className = 'aviso erro';
      return;
    }

    Dados.salvarLancamento({
      id: campos.id.value || undefined,
      tipo: tipoSelecionado,
      valor: valor,
      data: campos.data.value,
      descricao: campos.descricao.value.trim(),
      categoria: campos.categoria.value,
      formaPagamento: campos.pagamento.value,
      fixa: campos.fixa.checked
    });

    /* Leva o usuário para o mês do lançamento salvo. */
    campoMes.value = campos.data.value.slice(0, 7);

    fecharModal();
    desenhar();
  });

  /* ------------------------------------------------------------- listagem */

  function filtrar() {
    const mes = campoMes.value || Comum.mesAtual();
    const termo = campoBusca.value.trim().toLowerCase();
    const tipo = filtroTipo.value;

    return Dados.lancamentosDoMes(mes).filter(function (l) {
      if (tipo && l.tipo !== tipo) return false;
      if (!termo) return true;
      return (l.descricao + ' ' + l.categoria).toLowerCase().indexOf(termo) >= 0;
    });
  }

  function desenhar() {
    const lista = filtrar();
    const corpo = document.getElementById('lista');
    const mes = campoMes.value || Comum.mesAtual();
    const resumo = Dados.resumoDoMes(mes);

    document.getElementById('contexto').textContent =
      resumo.quantidade + ' lançamento' + (resumo.quantidade === 1 ? '' : 's') +
      ' em ' + Comum.nomeDoMes(mes);

    if (lista.length === 0) {
      corpo.innerHTML = '<tr><td colspan="6" class="vazio">' +
        (resumo.quantidade === 0
          ? 'Nenhum lançamento neste mês. Clique em "Novo lançamento" para registrar o primeiro.'
          : 'Nenhum lançamento corresponde ao filtro aplicado.') +
        '</td></tr>';
      document.getElementById('totalizador').textContent = 'Nenhum resultado';
      return;
    }

    corpo.innerHTML = lista.map(function (l) {
      const receita = l.tipo === 'receita';
      return '<tr>' +
        '<td class="suave">' + Comum.data(l.data) + '</td>' +
        '<td class="celula-desc"><b>' + Comum.escapar(l.descricao) + '</b>' +
          (l.fixa ? '<span>Fixa</span>' : '') + '</td>' +
        '<td><span class="etiqueta">' + Comum.escapar(l.categoria) + '</span></td>' +
        '<td class="suave">' + Comum.escapar(l.formaPagamento || '—') + '</td>' +
        '<td class="col-num ' + (receita ? 'receita' : '') + '">' +
          (receita ? '+ ' : '− ') + Comum.moeda(l.valor) + '</td>' +
        '<td><div class="acoes-linha">' +
          '<button class="botao-icone" data-editar="' + l.id + '" title="Editar">' +
            '<svg class="icone icone-p" viewBox="0 0 24 24">' +
            '<path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3z"/></svg></button>' +
          '<button class="botao-icone perigo" data-excluir="' + l.id + '" title="Excluir">' +
            '<svg class="icone icone-p" viewBox="0 0 24 24">' +
            '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    /* Total dos itens exibidos. */
    let receitas = 0;
    let despesas = 0;
    lista.forEach(function (l) {
      if (l.tipo === 'receita') receitas += Number(l.valor);
      else despesas += Number(l.valor);
    });

    document.getElementById('totalizador').textContent =
      lista.length + ' lançamento' + (lista.length === 1 ? '' : 's') +
      ' · receitas ' + Comum.moeda(receitas) +
      ' · despesas ' + Comum.moeda(despesas) +
      ' · saldo ' + Comum.moeda(receitas - despesas);

    ligarAcoes();
  }

  function ligarAcoes() {
    document.querySelectorAll('[data-editar]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        abrirModal(Dados.buscarLancamento(botao.dataset.editar));
      });
    });

    document.querySelectorAll('[data-excluir]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        const lancamento = Dados.buscarLancamento(botao.dataset.excluir);
        if (!lancamento) return;
        if (confirm('Excluir o lançamento "' + lancamento.descricao + '"?')) {
          Dados.removerLancamento(lancamento.id);
          desenhar();
        }
      });
    });
  }

  /* Permite abrir o modal direto pela URL, vindo dos atalhos do painel. */
  const parametros = new URLSearchParams(window.location.search);
  const novo = parametros.get('novo');

  desenhar();

  if (novo) {
    if (novo === 'receita' || novo === 'despesa') tipoSelecionado = novo;
    abrirModal(null);
  }
})();
