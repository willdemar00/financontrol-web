/* ==========================================================================
   painel.js - Página inicial do sistema (RF06 - exibicao do saldo)
   Mostra o saldo do mês, os indicadores de receitas e despesas, o gráfico de
   evolução do saldo acumulado e os últimos lançamentos registrados.
   ========================================================================== */

(function () {
  'use strict';

  const sessao = Comum.iniciarPagina('painel');
  if (!sessao) return;

  const campoMes = document.getElementById('mes');
  campoMes.value = Comum.mesAtual();
  campoMes.addEventListener('change', desenhar);

  /* ------------------------------------------------------------- gráfico */

  /* Desenha a linha do saldo acumulado dia a dia dentro do mês escolhido. */
  function desenharGrafico(mes) {
    const svg = document.getElementById('grafico-saldo');
    const lancamentos = Dados.lancamentosDoMes(mes).slice().sort(function (a, b) {
      return a.data.localeCompare(b.data);
    });

    const largura = 620;
    const altura = 92;

    if (lancamentos.length === 0) {
      svg.innerHTML = '<text x="310" y="50" text-anchor="middle" fill="#a1a1aa" ' +
                      'font-size="12" font-family="sans-serif">Sem lançamentos neste mês</text>';
      return;
    }

    /* Monta a serie de saldo acumulado. */
    const pontos = [];
    let acumulado = 0;
    lancamentos.forEach(function (l) {
      acumulado += l.tipo === 'receita' ? Number(l.valor) : -Number(l.valor);
      pontos.push({ dia: Number(l.data.slice(8, 10)), saldo: acumulado });
    });

    const minimo = Math.min(0, ...pontos.map(function (p) { return p.saldo; }));
    const maximo = Math.max(0, ...pontos.map(function (p) { return p.saldo; }));
    const faixa = (maximo - minimo) || 1;

    const coordenadas = pontos.map(function (p, i) {
      const x = pontos.length === 1 ? largura : (i / (pontos.length - 1)) * largura;
      const y = altura - 8 - ((p.saldo - minimo) / faixa) * (altura - 20);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });

    const cor = acumulado >= 0 ? '#16a34a' : '#e11d48';
    const ultimo = coordenadas[coordenadas.length - 1].split(',');

    svg.innerHTML =
      '<line x1="0" y1="' + (altura - 6) + '" x2="' + largura + '" y2="' + (altura - 6) +
        '" stroke="#e4e4e7"/>' +
      '<polygon points="' + coordenadas.join(' ') + ' ' + largura + ',' + altura + ' 0,' + altura +
        '" fill="' + cor + '" opacity=".07"/>' +
      '<polyline points="' + coordenadas.join(' ') + '" fill="none" stroke="' + cor +
        '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + ultimo[0] + '" cy="' + ultimo[1] + '" r="4" fill="' + cor + '"/>';

    document.getElementById('legenda-inicio').textContent = 'dia ' + pontos[0].dia;
    document.getElementById('legenda-fim').textContent = 'dia ' + pontos[pontos.length - 1].dia;
  }

  /* --------------------------------------------------------------- lista */

  function desenharLista(mes) {
    const corpo = document.getElementById('lista');
    const lancamentos = Dados.lancamentosDoMes(mes).slice(0, 6);

    if (lancamentos.length === 0) {
      corpo.innerHTML = '<tr><td colspan="4" class="vazio">' +
        'Nenhum lançamento neste mês. Use o botão "Novo lançamento" para começar.</td></tr>';
      return;
    }

    corpo.innerHTML = lancamentos.map(function (l) {
      const receita = l.tipo === 'receita';
      const sinal = receita ? '+ ' : '− ';
      const complemento = l.fixa ? 'Fixa' : (l.formaPagamento || '');

      return '<tr>' +
        '<td class="celula-desc"><b>' + Comum.escapar(l.descricao) + '</b>' +
          (complemento ? '<span>' + Comum.escapar(complemento) + '</span>' : '') + '</td>' +
        '<td><span class="etiqueta">' + Comum.escapar(l.categoria) + '</span></td>' +
        '<td class="suave">' + Comum.data(l.data) + '</td>' +
        '<td class="col-num ' + (receita ? 'receita' : '') + '">' + sinal +
          Comum.moeda(l.valor) + '</td>' +
      '</tr>';
    }).join('');
  }

  /* ------------------------------------------------------------ desenhar */

  function desenhar() {
    const mes = campoMes.value || Comum.mesAtual();
    const resumo = Dados.resumoDoMes(mes);
    const anterior = Dados.resumoDoMes(Comum.mesAnterior(mes));

    document.getElementById('rotulo-mes').textContent = Comum.nomeDoMes(mes).split(' de ')[0];
    document.getElementById('saldo').textContent = Comum.moeda(resumo.saldo);
    document.getElementById('receitas').textContent = Comum.moeda(resumo.receitas);
    document.getElementById('despesas').textContent = Comum.moeda(resumo.despesas);

    document.getElementById('contexto').textContent =
      Comum.nomeDoMes(mes) + ' · ' + resumo.quantidade + ' lançamento' +
      (resumo.quantidade === 1 ? '' : 's');

    document.getElementById('receitas-info').textContent =
      resumo.qtdReceitas + ' lançamento' + (resumo.qtdReceitas === 1 ? '' : 's') +
      ' · mês anterior: ' + Comum.moeda(anterior.receitas);

    document.getElementById('despesas-info').textContent =
      resumo.qtdDespesas + ' lançamento' + (resumo.qtdDespesas === 1 ? '' : 's') +
      ' · mês anterior: ' + Comum.moeda(anterior.despesas);

    /* Comparativo do saldo com o mês anterior. */
    const etiqueta = document.getElementById('variacao');
    const diferenca = resumo.saldo - anterior.saldo;

    if (anterior.quantidade === 0) {
      etiqueta.className = 'etiqueta';
      etiqueta.textContent = 'Primeiro mês';
      document.getElementById('comparativo').textContent =
        'Ainda não há lançamentos no mês anterior para comparar.';
    } else {
      const subiu = diferenca >= 0;
      etiqueta.className = 'etiqueta ' + (subiu ? 'etiqueta-positiva' : 'etiqueta-negativa');
      etiqueta.textContent = (subiu ? '+' : '−') + Comum.moeda(Math.abs(diferenca));
      document.getElementById('comparativo').textContent =
        'vs. ' + Comum.moeda(anterior.saldo) + ' em ' + Comum.nomeDoMes(Comum.mesAnterior(mes));
    }

    /* Metas em andamento. */
    const metas = Dados.listarMetas();
    const concluidas = metas.filter(function (m) {
      return Number(m.valorAtual) >= Number(m.valorAlvo);
    });
    document.getElementById('metas').innerHTML = (metas.length - concluidas.length) +
      ' <span style="font-size:15px;font-weight:500;color:var(--texto-suave)">de ' + metas.length + '</span>';

    const emAndamento = metas.find(function (m) {
      return Number(m.valorAtual) < Number(m.valorAlvo);
    });
    document.getElementById('metas-info').textContent = emAndamento
      ? emAndamento.descricao + ' em ' +
        Math.round((emAndamento.valorAtual / emAndamento.valorAlvo) * 100) + '% do objetivo'
      : (metas.length ? 'Todas as metas foram concluídas.' : 'Nenhuma meta cadastrada ainda.');

    document.getElementById('resumo-lista').textContent =
      resumo.qtdReceitas + ' receitas · ' + resumo.qtdDespesas + ' despesas neste mês';

    desenharGrafico(mes);
    desenharLista(mes);
  }

  desenhar();
})();
