/* ==========================================================================
   metas.js - Metas financeiras (RF11)
   Permite cadastrar objetivos de economia, acompanhar o percentual alcancado
   e editar ou excluir cada meta. As metas ficam gravadas pela API, que
   também calcula o percentual e se a meta já foi concluida.
   ========================================================================== */

(function () {
  'use strict';

  const sessao = Comum.iniciarPagina('metas');
  if (!sessao) return;

  const modal = document.getElementById('modal');
  const form = document.getElementById('form-meta');
  const aviso = document.getElementById('aviso');
  const botaoSalvar = form.querySelector('button[type="submit"]');
  const corpo = document.getElementById('lista');

  const campos = {
    id: document.getElementById('id'),
    descricao: document.getElementById('descricao'),
    alvo: document.getElementById('alvo'),
    atual: document.getElementById('atual'),
    prazo: document.getElementById('prazo'),
    prioridade: document.getElementById('prioridade')
  };

  /* ---------------------------------------------------------------- modal */

  function abrirModal(meta) {
    aviso.className = 'aviso';
    form.reset();
    campos.id.value = '';

    if (meta) {
      document.getElementById('modal-titulo').textContent = 'Editar meta';
      campos.id.value = meta.id;
      campos.descricao.value = meta.descricao;
      campos.alvo.value = meta.valorAlvo;
      campos.atual.value = meta.valorAtual;
      campos.prazo.value = meta.prazo;
      campos.prioridade.value = meta.prioridade || 'Média';
    } else {
      document.getElementById('modal-titulo').textContent = 'Nova meta';
      campos.atual.value = 0;
      campos.prazo.value = Comum.mesAtual();
    }

    modal.classList.add('aberto');
    campos.descricao.focus();
  }

  function fecharModal() {
    modal.classList.remove('aberto');
  }

  document.getElementById('btn-nova').addEventListener('click', function () { abrirModal(null); });
  document.getElementById('btn-fechar').addEventListener('click', fecharModal);
  document.getElementById('btn-cancelar').addEventListener('click', fecharModal);

  modal.addEventListener('click', function (evento) {
    if (evento.target === modal) fecharModal();
  });
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && modal.classList.contains('aberto')) fecharModal();
  });

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const descricao = campos.descricao.value.trim();
    const alvo = Number(campos.alvo.value);
    const atual = Number(campos.atual.value) || 0;

    if (!descricao) {
      aviso.textContent = 'Informe a descrição da meta.';
      aviso.className = 'aviso erro';
      return;
    }

    if (!alvo || alvo <= 0) {
      aviso.textContent = 'O valor objetivo deve ser maior que zero.';
      aviso.className = 'aviso erro';
      return;
    }

    if (atual > alvo) {
      aviso.textContent = 'O valor já guardado não pode ser maior que o objetivo.';
      aviso.className = 'aviso erro';
      return;
    }

    botaoSalvar.disabled = true;
    try {
      await Dados.salvarMeta({
        id: campos.id.value || undefined,
        descricao: descricao,
        valorAlvo: alvo,
        valorAtual: atual,
        prazo: campos.prazo.value,
        prioridade: campos.prioridade.value
      });
    } catch (erro) {
      aviso.textContent = erro.message;
      aviso.className = 'aviso erro';
      return;
    } finally {
      botaoSalvar.disabled = false;
    }

    fecharModal();
    Comum.carregar(desenhar);
  });

  /* ------------------------------------------------------------- listagem */

  function situacao(meta) {
    if (meta.concluida) {
      return '<span class="etiqueta">' +
        '<svg class="icone icone-p" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>Concluída</span>';
    }

    /* Compara o prazo com o mês atual para indicar atraso. */
    const atrasada = meta.prazo && meta.prazo < Comum.mesAtual();
    const classe = atrasada ? 'etiqueta-negativa' : 'etiqueta-positiva';
    const texto = atrasada ? 'Atrasada' : 'No prazo';

    return '<span class="etiqueta ' + classe + '">' +
      '<svg class="icone icone-p" viewBox="0 0 24 24" style="fill:currentColor;stroke:none">' +
      '<circle cx="12" cy="12" r="5"/></svg>' + texto + '</span>';
  }

  async function desenhar() {
    const metas = await Dados.listarMetas();

    const guardado = metas.reduce(function (s, m) { return s + Number(m.valorAtual); }, 0);
    const objetivo = metas.reduce(function (s, m) { return s + Number(m.valorAlvo); }, 0);
    const concluidas = metas.filter(function (m) { return m.concluida; });

    document.getElementById('total-guardado').textContent = Comum.moeda(guardado);
    document.getElementById('objetivo-total').textContent = Comum.moeda(objetivo);
    document.getElementById('info-guardado').textContent = metas.length
      ? 'distribuído em ' + metas.length + ' meta' + (metas.length === 1 ? '' : 's')
      : 'nenhuma meta cadastrada';
    document.getElementById('info-objetivo').textContent = objetivo
      ? 'faltam ' + Comum.moeda(Math.max(0, objetivo - guardado)) + ' para alcançar tudo'
      : '--';

    document.getElementById('contexto').textContent =
      metas.length + ' meta' + (metas.length === 1 ? '' : 's') + ' · ' +
      concluidas.length + ' concluída' + (concluidas.length === 1 ? '' : 's') + ' · ' +
      Comum.moeda(guardado) + ' acumulados';

    document.getElementById('resumo-metas').textContent =
      (metas.length - concluidas.length) + ' em andamento · ' + concluidas.length + ' concluídas';

    /* Meta em andamento que esta mais perto de ser alcancada. */
    const proxima = metas
      .filter(function (m) { return !m.concluida; })
      .sort(function (a, b) {
        return (b.valorAtual / b.valorAlvo) - (a.valorAtual / a.valorAlvo);
      })[0];

    document.getElementById('mais-proxima').textContent = proxima ? proxima.descricao : '--';
    document.getElementById('info-proxima').textContent = proxima
      ? 'faltam ' + Comum.moeda(proxima.valorAlvo - proxima.valorAtual) +
        (proxima.prazo ? ' · prazo em ' + Comum.nomeDoMes(proxima.prazo) : '')
      : 'nenhuma meta em andamento';

    if (metas.length === 0) {
      corpo.innerHTML = '<tr><td colspan="7" class="vazio">' +
        'Nenhuma meta cadastrada. Clique em "Nova meta" para definir seu primeiro objetivo.</td></tr>';
      return;
    }

    corpo.innerHTML = metas.map(function (m) {
      const percentual = m.percentual;
      const concluida = m.concluida;

      return '<tr>' +
        '<td class="celula-desc"><b>' + Comum.escapar(m.descricao) + '</b>' +
          '<span>Prioridade ' + Comum.escapar(m.prioridade || 'Média').toLowerCase() + '</span></td>' +
        '<td><div style="display:flex;align-items:center;gap:9px">' +
          '<div class="barra-progresso" style="flex:1"><div style="width:' + percentual + '%' +
          (concluida ? ';background:#3f3f46' : '') + '"></div></div>' +
          '<b style="font-size:12px">' + percentual + '%</b></div></td>' +
        '<td class="col-num">' + Comum.moeda(m.valorAtual) + '</td>' +
        '<td class="col-num" style="font-weight:500">' + Comum.moeda(m.valorAlvo) + '</td>' +
        '<td class="suave">' + (m.prazo ? Comum.nomeDoMes(m.prazo) : '—') + '</td>' +
        '<td>' + situacao(m) + '</td>' +
        '<td><div class="acoes-linha">' +
          '<button class="botao-icone" data-editar="' + m.id + '" title="Editar">' +
            '<svg class="icone icone-p" viewBox="0 0 24 24">' +
            '<path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3z"/></svg></button>' +
          '<button class="botao-icone perigo" data-excluir="' + m.id + '" title="Excluir">' +
            '<svg class="icone icone-p" viewBox="0 0 24 24">' +
            '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    document.querySelectorAll('[data-editar]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        const meta = metas.find(function (m) { return m.id === Number(botao.dataset.editar); });
        abrirModal(meta);
      });
    });

    document.querySelectorAll('[data-excluir]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        const meta = metas.find(function (m) { return m.id === Number(botao.dataset.excluir); });
        if (meta && confirm('Excluir a meta "' + meta.descricao + '"?')) {
          Comum.carregar(async function () {
            await Dados.removerMeta(meta.id);
            await desenhar();
          });
        }
      });
    });
  }

  Comum.linhaCarregando(corpo, 7);
  Comum.carregar(desenhar);
})();
