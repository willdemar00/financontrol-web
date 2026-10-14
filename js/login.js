/* ==========================================================================
   login.js - Tela de acesso (RF02 - autenticação por login e senha)
   --------------------------------------------------------------------------
   O e-mail e a senha sao conferidos pela API. Se estiverem certos, ela
   devolve um token (JWT) que fica guardado na sessao e acompanha todas as
   proximas requisicoes.
   ========================================================================== */

(function () {
  'use strict';

  const form = document.getElementById('form-login');
  const campoEmail = document.getElementById('email');
  const campoSenha = document.getElementById('senha');
  const aviso = document.getElementById('aviso');
  const botao = form.querySelector('button[type="submit"]');
  const textoBotao = botao.textContent.trim();

  /* Se já existe uma sessao aberta, vai direto para o painel. */
  if (Dados.sessaoAtual()) {
    window.location.href = 'painel.html';
  }

  function mostrarAviso(mensagem, tipo) {
    aviso.textContent = mensagem;
    aviso.className = 'aviso ' + tipo;
  }

  /* Volta da API com token vencido (ver dados.js). */
  if (new URLSearchParams(window.location.search).get('sessao') === 'expirada') {
    mostrarAviso('Sua sessão expirou. Entre novamente para continuar.', 'erro');
  }

  /* Botão de mostrar/ocultar a senha. */
  document.getElementById('ver-senha').addEventListener('click', function () {
    campoSenha.type = campoSenha.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('link-senha').addEventListener('click', function (evento) {
    evento.preventDefault();
    mostrarAviso('A recuperação de senha está no backlog do projeto e será implementada em uma próxima sprint.', 'sucesso');
  });

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    if (!email || !senha) {
      mostrarAviso('Preencha o e-mail e a senha para entrar.', 'erro');
      return;
    }

    botao.disabled = true;
    botao.textContent = 'Entrando...';

    try {
      await Dados.autenticar(email, senha);
    } catch (erro) {
      mostrarAviso(erro.message, 'erro');
      botao.disabled = false;
      botao.textContent = textoBotao;
      campoSenha.value = '';
      campoSenha.focus();
      return;
    }

    window.location.href = 'painel.html';
  });
})();
