/* ==========================================================================
   login.js - Tela de acesso (RF02 - autenticação por login e senha)
   ========================================================================== */

(function () {
  'use strict';

  const form = document.getElementById('form-login');
  const campoEmail = document.getElementById('email');
  const campoSenha = document.getElementById('senha');
  const aviso = document.getElementById('aviso');

  /* Se já existe uma sessao aberta, vai direto para o painel. */
  if (Dados.sessaoAtual()) {
    window.location.href = 'painel.html';
  }

  function mostrarAviso(mensagem, tipo) {
    aviso.textContent = mensagem;
    aviso.className = 'aviso ' + tipo;
  }

  /* Botão de mostrar/ocultar a senha. */
  document.getElementById('ver-senha').addEventListener('click', function () {
    campoSenha.type = campoSenha.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('link-senha').addEventListener('click', function (evento) {
    evento.preventDefault();
    mostrarAviso('A recuperação de senha será implementada na próxima entrega.', 'sucesso');
  });

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    if (!email || !senha) {
      mostrarAviso('Preencha o e-mail e a senha para entrar.', 'erro');
      return;
    }

    const resultado = Dados.autenticar(email, senha);

    if (!resultado.ok) {
      mostrarAviso(resultado.mensagem, 'erro');
      campoSenha.value = '';
      campoSenha.focus();
      return;
    }

    Dados.abrirSessao(resultado.usuario);
    window.location.href = 'painel.html';
  });
})();
