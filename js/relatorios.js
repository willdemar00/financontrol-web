/* ==========================================================================
   relatórios.js - Relatórios financeiros
   Requisitos atendidos:
     RF07 - relatórios financeiros mensais
     RF08 - gráficos de receitas e despesas
     RF12 - exportação dos relatorios (arquivo CSV)
   ========================================================================== */

(function () {
  'use strict';

  const sessao = Comum.iniciarPagina('relatorios');
  if (!sessao) return;

  const TONS = ['#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

  const campoMes = document.getElementById('mes');
  campoMes.value = Comum.mesAtual();
  campoMes.addEventListener('change', desenhar);

  /* Devolve os 6 meses que terminam no mês informado. */
  function ultimosSeisMeses(mes) {
    const meses = [mes];
    for (let i = 0; i < 5; i++) {
      meses.unshift(Comum.mesAnterior(meses[0]));
    }
    return meses;
  }

  /* ------------------------------------------------- gráfico de barras */

  function desenharBarras(mes) {
    const svg = document.getElementById('grafico-barras');
    const meses = ultimosSeisMeses(mes);
    const resumos = meses.map(function (m) { return Dados.resumoDoMes(m); });

    const maximo = Math.max(
      1,
      ...resumos.map(function (r) { return Math.max(r.receitas, r.despesas); })
    );

    const base = 222;
    const alturaUtil = 192;
    const passo = 100;
    const inicio = 66;

    let marcas = '';
    for (let i = 1; i <= 4; i++) {
      const y = base - (alturaUtil / 4) * i;
      const rotulo = Comum.moeda((maximo / 4) * i).replace('R$', '').trim();
      marcas += '<line x1="44" y1="' + y + '" x2="650" y2="' + y + '" stroke="#f4f4f5"/>' +
                '<text x="38" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#71717a" ' +
                'font-family="sans-serif">' + rotulo + '</text>';
    }

    let barras = '';
    let rotulos = '';

    resumos.forEach(function (r, i) {
      const x = inicio + i * passo;
      const alturaReceita = (r.receitas / maximo) * alturaUtil;
      const alturaDespesa = (r.despesas / maximo) * alturaUtil;

      barras += '<rect x="' + x + '" y="' + (base - alturaReceita) + '" width="30" height="' +
                alturaReceita + '" rx="4" fill="#16a34a"/>';
      barras += '<rect x="' + (x + 34) + '" y="' + (base - alturaDespesa) + '" width="30" height="' +
                alturaDespesa + '" rx="4" fill="#a1a1aa"/>';

      const nome = Comum.nomeDoMes(meses[i]).slice(0, 3);
      const atual = meses[i] === mes;
      rotulos += '<text x="' + (x + 32) + '" y="242" text-anchor="middle" font-size="11.5" ' +
                 'font-family="sans-serif" fill="' + (atual ? '#09090b' : '#71717a') + '"' +
                 (atual ? ' font-weight="bold"' : '') + '>' +
                 nome.charAt(0).toUpperCase() + nome.slice(1) + '</text>';
    });

    svg.innerHTML = marcas +
      '<line x1="44" y1="' + base + '" x2="650" y2="' + base + '" stroke="#e4e4e7"/>' +
      '<text x="38" y="' + (base + 4) + '" text-anchor="end" font-size="10" fill="#71717a" ' +
      'font-family="sans-serif">0</text>' + barras + rotulos;
  }

  /* --------------------------------------------------- gráfico de rosca */

  function desenharRosca(mes) {
    const svg = document.getElementById('rosca');
    const legenda = document.getElementById('legenda-categoria');
    const categorias = Dados.totaisPorCategoria(mes);
    const total = categorias.reduce(function (soma, c) { return soma + c.total; }, 0);

    if (total === 0) {
      svg.innerHTML = '<circle cx="60" cy="60" r="46" fill="none" stroke="#f4f4f5" stroke-width="17"/>' +
        '<text x="60" y="64" text-anchor="middle" font-size="10" fill="#a1a1aa" ' +
        'font-family="sans-serif">sem dados</text>';
      legenda.innerHTML = '<span class="suave" style="font-size:12.5px">' +
        'Nenhuma despesa registrada neste mês.</span>';
      return;
    }

    /* Agrupa da quinta categoria em diante em "Outros". */
    const principais = categorias.slice(0, 4);
    const resto = categorias.slice(4).reduce(function (soma, c) { return soma + c.total; }, 0);
    if (resto > 0) principais.push({ categoria: 'Outros', total: resto });

    const circunferencia = 2 * Math.PI * 46;
    let deslocamento = 0;
    let arcos = '';

    principais.forEach(function (c, i) {
      const fatia = (c.total / total) * circunferencia;
      arcos += '<circle cx="60" cy="60" r="46" fill="none" stroke="' + TONS[i % TONS.length] +
               '" stroke-width="17" stroke-dasharray="' + fatia.toFixed(2) + ' ' +
               (circunferencia - fatia).toFixed(2) + '" stroke-dashoffset="' +
               (-deslocamento).toFixed(2) + '" transform="rotate(-90 60 60)"/>';
      deslocamento += fatia;
    });

    svg.innerHTML = arcos +
      '<text x="60" y="56" text-anchor="middle" font-size="10.5" fill="#71717a" ' +
      'font-family="sans-serif">Total</text>' +
      '<text x="60" y="72" text-anchor="middle" font-size="13" font-weight="bold" ' +
      'font-family="sans-serif">' + Comum.moeda(total).replace('R$', '').trim() + '</text>';

    legenda.innerHTML = principais.map(function (c, i) {
      const porcentagem = Math.round((c.total / total) * 100);
      return '<div style="display:flex;align-items:center;gap:8px">' +
        '<i style="width:8px;height:8px;border-radius:50%;flex:none;background:' +
        TONS[i % TONS.length] + '"></i>' + Comum.escapar(c.categoria) +
        '<b style="margin-left:auto">' + porcentagem + '%</b></div>';
    }).join('');

    document.getElementById('desc-categoria').textContent =
      Comum.nomeDoMes(mes) + ' · total de ' + Comum.moeda(total);
  }

  /* ------------------------------------------------------------- tabela */

  function desenharTabela(mes) {
    const corpo = document.getElementById('tabela-categorias');
    const mesPassado = Comum.mesAnterior(mes);
    const categorias = Dados.totaisPorCategoria(mes);
    const anteriores = Dados.totaisPorCategoria(mesPassado);
    const total = categorias.reduce(function (soma, c) { return soma + c.total; }, 0);

    if (categorias.length === 0) {
      corpo.innerHTML = '<tr><td colspan="5" class="vazio">' +
        'Nenhuma despesa registrada neste mês.</td></tr>';
      return;
    }

    const lancamentos = Dados.lancamentosDoMes(mes);

    corpo.innerHTML = categorias.map(function (c, i) {
      const quantidade = lancamentos.filter(function (l) {
        return l.tipo === 'despesa' && l.categoria === c.categoria;
      }).length;

      const anterior = anteriores.find(function (a) { return a.categoria === c.categoria; });
      const valorAnterior = anterior ? anterior.total : 0;
      const porcentagem = Math.round((c.total / total) * 100);

      let comparativo = '<span class="etiqueta">novo</span>';
      if (valorAnterior > 0) {
        const variacao = ((c.total - valorAnterior) / valorAnterior) * 100;
        const subiu = variacao > 0;
        const classe = subiu ? 'etiqueta-negativa' : 'etiqueta-positiva';
        comparativo = '<span class="etiqueta ' + (Math.abs(variacao) < 0.5 ? '' : classe) + '">' +
          (subiu ? '+' : '−') + Math.abs(variacao).toFixed(1).replace('.', ',') + '%</span>';
      }

      return '<tr>' +
        '<td class="celula-desc"><b>' + Comum.escapar(c.categoria) + '</b></td>' +
        '<td class="suave">' + quantidade + ' lançamento' + (quantidade === 1 ? '' : 's') + '</td>' +
        '<td><div class="barra-progresso"><div style="width:' + porcentagem +
          '%;background:' + TONS[Math.min(i, TONS.length - 1)] + '"></div></div></td>' +
        '<td class="col-num">' + Comum.moeda(c.total) + '</td>' +
        '<td style="text-align:right">' + comparativo + '</td>' +
      '</tr>';
    }).join('');

    document.getElementById('desc-resumo').textContent =
      Comum.nomeDoMes(mes) + ' comparado a ' + Comum.nomeDoMes(mesPassado);
  }

  /* ---------------------------------------------------- exportação CSV */

  document.getElementById('btn-exportar').addEventListener('click', function () {
    const mes = campoMes.value || Comum.mesAtual();
    const lancamentos = Dados.lancamentosDoMes(mes);

    if (lancamentos.length === 0) {
      alert('Não há lançamentos neste mês para exportar.');
      return;
    }

    const linhas = [['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma de pagamento', 'Valor']];
    lancamentos.forEach(function (l) {
      linhas.push([
        Comum.data(l.data),
        l.tipo === 'receita' ? 'Receita' : 'Despesa',
        l.descricao,
        l.categoria,
        l.formaPagamento || '',
        Number(l.valor).toFixed(2).replace('.', ',')
      ]);
    });

    /* Usa ponto e virgula como separador, padrão do Excel em portugues. */
    const csv = linhas.map(function (linha) {
      return linha.map(function (celula) { return '"' + String(celula).replace(/"/g, '""') + '"'; })
                  .join(';');
    }).join('\n');

    const arquivo = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(arquivo);
    link.download = 'financontrol-' + mes + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  /* ------------------------------------------------------------ desenhar */

  function desenhar() {
    const mes = campoMes.value || Comum.mesAtual();
    const resumo = Dados.resumoDoMes(mes);

    document.getElementById('contexto').textContent =
      Comum.nomeDoMes(mes) + ' · saldo de ' + Comum.moeda(resumo.saldo);

    desenharBarras(mes);
    desenharRosca(mes);
    desenharTabela(mes);
  }

  desenhar();
})();
