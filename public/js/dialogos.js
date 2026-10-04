// ==========================================================================
// dialogos.js — caixa de confirmação do Gira-Brasil (substitui window.confirm)
//
// Uso (retorna Promise<boolean>):
//   const ok = await confirmarAcao({
//     titulo: 'Excluir comentário',
//     mensagem: 'Essa ação não pode ser desfeita.',
//     confirmar: 'Excluir',   // texto do botão principal (opcional)
//     cancelar: 'Cancelar',   // opcional
//     perigo: true,           // botão em destaque de alerta (opcional)
//   });
//
// Avisos simples (substituem window.alert) continuam no toast.js:
//   mostrarToast('Mensagem', 'sucesso' | 'erro' | 'aviso')
// Acessível: role="dialog", foco preso, Esc cancela, devolve o foco.
// ==========================================================================
(function () {
  window.confirmarAcao = function confirmarAcao(opcoes) {
    const o = Object.assign({ titulo: 'Confirmar', mensagem: '', confirmar: 'Confirmar', cancelar: 'Cancelar', perigo: false }, opcoes || {});
    return new Promise((resolver) => {
      const anterior = document.activeElement;
      const fundo = document.createElement('div');
      fundo.className = 'dlg-fundo';
      fundo.innerHTML =
        '<div class="dlg-caixa" role="alertdialog" aria-modal="true" aria-labelledby="dlgTitulo" aria-describedby="dlgMsg">' +
          '<h3 class="dlg-titulo" id="dlgTitulo"></h3>' +
          '<p class="dlg-msg" id="dlgMsg"></p>' +
          '<div class="dlg-acoes">' +
            '<button type="button" class="dlg-btn dlg-btn--sec" data-dlg="nao"></button>' +
            '<button type="button" class="dlg-btn dlg-btn--pri" data-dlg="sim"></button>' +
          '</div>' +
        '</div>';
      fundo.querySelector('.dlg-titulo').textContent = o.titulo;
      const msg = fundo.querySelector('.dlg-msg');
      msg.textContent = o.mensagem;
      if (!o.mensagem) msg.hidden = true;
      const nao = fundo.querySelector('[data-dlg="nao"]');
      const sim = fundo.querySelector('[data-dlg="sim"]');
      nao.textContent = o.cancelar;
      sim.textContent = o.confirmar;
      if (o.perigo) sim.classList.add('dlg-btn--perigo');

      let fechado = false;
      function fechar(resultado) {
        if (fechado) return;
        fechado = true;
        document.removeEventListener('keydown', teclas, true);
        fundo.classList.remove('is-visivel');
        document.body.classList.remove('dlg-aberto');
        setTimeout(() => fundo.remove(), 160);
        if (anterior && anterior.focus) anterior.focus();
        resolver(resultado);
      }
      function teclas(e) {
        if (e.key === 'Escape') { e.preventDefault(); fechar(false); return; }
        if (e.key === 'Tab') {
          const f = [nao, sim];
          const i = f.indexOf(document.activeElement);
          if (e.shiftKey && i <= 0) { e.preventDefault(); f[1].focus(); }
          else if (!e.shiftKey && i === 1) { e.preventDefault(); f[0].focus(); }
          else if (i === -1) { e.preventDefault(); f[0].focus(); }
        }
      }
      nao.addEventListener('click', () => fechar(false));
      sim.addEventListener('click', () => fechar(true));
      fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fechar(false); });
      document.addEventListener('keydown', teclas, true);

      document.body.appendChild(fundo);
      document.body.classList.add('dlg-aberto');
      requestAnimationFrame(() => fundo.classList.add('is-visivel'));
      (o.perigo ? nao : sim).focus(); // ação destrutiva: foco começa no "Cancelar"
    });
  };
})();
