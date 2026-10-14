/* ==========================================================================
   categorias.js - Cadastro e listagem de categorias (RF05)
   Cada usuário começa com as categorias padrão criadas pela API e pode
   adicionar, renomear e excluir as suas. A API recusa a exclusão de uma
   categoria que já tem lançamentos.
   ========================================================================== */

(function () {
  'use strict';

  const sessao = Comum.iniciarPagina('categorias');
  if (!sessao) return;

  const modal = document.getElementById('modal');
  const form = document.getElementById('form-categoria');
  const aviso = document.getElementById('aviso');
  const campoId = document.getElementById('id');
  const campoNome = document.getElementById('nome');
  const botaoSalvar = form.querySelector('button[type="submit"]');

  let categorias = [];
  let tipoSelecionado = 'despesa';

  /* ---------------------------------------------------------------- modal */

  function mostrarAviso(mensagem) {
    aviso.textContent = mensagem;
    aviso.className = 'aviso erro';
  }

  function definirTipo(tipo) {
    tipoSelecionado = tipo;
    document.getElementById('aba-receita').classList.toggle('ativo', tipo === 'receita');
    document.getElementById('aba-despesa').classList.toggle('ativo', tipo === 'despesa');
  }

  function abrirModal(categoria, tipo) {
    aviso.className = 'aviso';
    form.reset();
    campoId.value = '';

    /* O tipo não muda na edição: os lançamentos já ligados a categoria
       continuariam com o tipo antigo. */
    document.getElementById('seletor-tipo').style.display = categoria ? 'none' : '';

    if (categoria) {
      document.getElementById('modal-titulo').textContent = 'Renomear categoria';
      document.getElementById('modal-desc').textContent =
        'Categoria de ' + categoria.tipo + ' · ' + categoria.quantidadeLancamentos + ' lançamento(s)';
      campoId.value = categoria.id;
      campoNome.value = categoria.nome;
      definirTipo(categoria.tipo);
    } else {
      document.getElementById('modal-titulo').textContent = 'Nova categoria';
      document.getElementById('modal-desc').textContent = 'Organize seus lançamentos do jeito que preferir.';
      definirTipo(tipo || tipoSelecionado);
    }

    modal.classList.add('aberto');
    campoNome.focus();
  }

  function fecharModal() {
    modal.classList.remove('aberto');
  }

  document.getElementById('btn-nova').addEventListener('click', function () { abrirModal(null); });
  document.querySelectorAll('[data-nova]').forEach(function (botao) {
    botao.addEventListener('click', function () { abrirModal(null, botao.dataset.nova); });
  });
  document.getElementById('btn-fechar').addEventListener('click', fecharModal);
  document.getElementById('btn-cancelar').addEventListener('click', fecharModal);
  document.getElementById('aba-receita').addEventListener('click', function () { definirTipo('receita'); });
  document.getElementById('aba-despesa').addEventListener('click', function () { definirTipo('despesa'); });

  modal.addEventListener('click', function (evento) {
    if (evento.target === modal) fecharModal();
  });
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && modal.classList.contains('aberto')) fecharModal();
  });

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    if (!nome) {
      mostrarAviso('Informe o nome da categoria.');
      return;
    }

    botaoSalvar.disabled = true;
    try {
      await Dados.salvarCategoria({ id: campoId.value || undefined, nome: nome, tipo: tipoSelecionado });
    } catch (erro) {
      mostrarAviso(erro.message);
      return;
    } finally {
      botaoSalvar.disabled = false;
    }

    fecharModal();
    Comum.carregar(carregar);
  });

  /* ------------------------------------------------------------- listagem */

  function desenharTabela(tipo) {
    const corpo = document.getElementById('lista-' + tipo);
    const lista = categorias.filter(function (c) { return c.tipo === tipo; });
    const emUso = lista.filter(function (c) { return c.quantidadeLancamentos > 0; }).length;

    document.getElementById('resumo-' + tipo).textContent =
      lista.length + ' categoria' + (lista.length === 1 ? '' : 's') + ' · ' + emUso + ' em uso';

    if (lista.length === 0) {
      corpo.innerHTML = '<tr><td colspan="3" class="vazio">Nenhuma categoria de ' + tipo + '.</td></tr>';
      return;
    }

    corpo.innerHTML = lista.map(function (c) {
      const quantidade = c.quantidadeLancamentos;
      return '<tr>' +
        '<td class="celula-desc"><b>' + Comum.escapar(c.nome) + '</b></td>' +
        '<td style="text-align:right">' + (quantidade
          ? '<span class="etiqueta">' + quantidade + '</span>'
          : '<span class="suave">—</span>') + '</td>' +
        '<td><div class="acoes-linha">' +
          '<button class="botao-icone" data-editar="' + c.id + '" title="Renomear">' +
            '<svg class="icone icone-p" viewBox="0 0 24 24">' +
            '<path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3z"/></svg></button>' +
          '<button class="botao-icone perigo" data-excluir="' + c.id + '" title="Excluir">' +
            '<svg class="icone icone-p" viewBox="0 0 24 24">' +
            '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function procurar(id) {
    return categorias.find(function (c) { return c.id === Number(id); });
  }

  function desenhar() {
    const total = categorias.length;
    const emUso = categorias.filter(function (c) { return c.quantidadeLancamentos > 0; }).length;

    document.getElementById('contexto').textContent =
      total + ' categorias · ' + emUso + ' com lançamentos';

    desenharTabela('receita');
    desenharTabela('despesa');

    document.querySelectorAll('[data-editar]').forEach(function (botao) {
      botao.addEventListener('click', function () { abrirModal(procurar(botao.dataset.editar)); });
    });

    document.querySelectorAll('[data-excluir]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        const categoria = procurar(botao.dataset.excluir);
        if (!categoria) return;

        if (categoria.quantidadeLancamentos > 0) {
          alert('A categoria "' + categoria.nome + '" tem ' + categoria.quantidadeLancamentos +
            ' lançamento(s) e não pode ser excluída. Você pode renomeá-la.');
          return;
        }

        if (!confirm('Excluir a categoria "' + categoria.nome + '"?')) return;

        Comum.carregar(async function () {
          await Dados.removerCategoria(categoria.id);
          await carregar();
        });
      });
    });
  }

  async function carregar() {
    categorias = await Dados.listarCategorias();
    desenhar();
  }

  Comum.linhaCarregando(document.getElementById('lista-receita'), 3);
  Comum.linhaCarregando(document.getElementById('lista-despesa'), 3);
  Comum.carregar(carregar);
})();
