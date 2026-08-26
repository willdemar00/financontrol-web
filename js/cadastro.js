/* ==========================================================================
   cadastro.js - Cadastro de usuarios (RF01)
   Regras aplicadas: RN01 - e-mail único; RN02 - senha com 8+ caracteres,
   contendo letras e números.
   ========================================================================== */

(function () {
  'use strict';

  const form = document.getElementById('form-cadastro');
  const campoNome = document.getElementById('nome');
  const campoEmail = document.getElementById('email');
  const campoSenha = document.getElementById('senha');
  const campoConfirmar = document.getElementById('confirmar');
  const campoTermos = document.getElementById('termos');
  const aviso = document.getElementById('aviso');
  const barras = document.getElementById('forca').children;
  const forcaTexto = document.getElementById('forca-texto');

  function mostrarAviso(mensagem, tipo) {
    aviso.textContent = mensagem;
    aviso.className = 'aviso ' + tipo;
  }

  /* Calcula a força da senha de 0 a 4. */
  function calcularForca(senha) {
    let pontos = 0;
    if (senha.length >= 8) pontos++;
    if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
    if (/\d/.test(senha)) pontos++;
    if (/[^A-Za-z0-9]/.test(senha)) pontos++;
    return pontos;
  }

  campoSenha.addEventListener('input', function () {
    const forca = calcularForca(campoSenha.value);
    const cores = ['var(--borda)', '#e11d48', '#f59e0b', '#16a34a', '#16a34a'];
    const textos = ['Use no mínimo 8 caracteres, com letras e números.',
                    'Senha fraca.', 'Senha razoável.', 'Senha forte.', 'Senha muito forte.'];

    for (let i = 0; i < barras.length; i++) {
      barras[i].style.background = i < forca ? cores[forca] : 'var(--borda)';
    }
    forcaTexto.textContent = textos[forca];
  });

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    if (nome.length < 3) {
      mostrarAviso('Informe seu nome completo.', 'erro');
      return;
    }

    /* Validacao simples de formato de e-mail. */
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mostrarAviso('Informe um e-mail válido.', 'erro');
      return;
    }

    if (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
      mostrarAviso('A senha deve ter ao menos 8 caracteres, com letras e números.', 'erro');
      return;
    }

    if (senha !== campoConfirmar.value) {
      mostrarAviso('As senhas não conferem.', 'erro');
      return;
    }

    if (!campoTermos.checked) {
      mostrarAviso('E preciso aceitar os termos de uso para continuar.', 'erro');
      return;
    }

    const resultado = Dados.cadastrarUsuario(nome, email, senha);

    if (!resultado.ok) {
      mostrarAviso(resultado.mensagem, 'erro');
      return;
    }

    /* Cadastro concluido: abre a sessao e leva o usuário ao painel. */
    Dados.abrirSessao(resultado.usuario);
    mostrarAviso('Conta criada com sucesso! Redirecionando...', 'sucesso');
    setTimeout(function () { window.location.href = 'painel.html'; }, 800);
  });
})();
