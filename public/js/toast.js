// ==========================================================================
// toast.js — notificação visual compartilhada (sucesso/erro/aviso)
//


(function () {
  let container = null;
  let contadorId = 0;

  function garantirContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
  }

  const ICONES = {
    sucesso: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
    erro: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
    aviso: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
  };

  window.mostrarToast = function mostrarToast(mensagem, tipo = 'aviso', opcoes = {}) {
    const alvo = garantirContainer();
    const duracao = opcoes.duracao ?? (tipo === 'erro' ? 5200 : 3400);

    const item = document.createElement('div');
    item.className = `toast-item toast-item--${tipo}`;
    item.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    item.id = `toast-${++contadorId}`;

    const icone = document.createElement('span');
    icone.className = 'toast-item__icone';
    icone.innerHTML = ICONES[tipo] || ICONES.aviso;

    const texto = document.createElement('span');
    texto.className = 'toast-item__texto';
    texto.textContent = mensagem;

    const fechar = document.createElement('button');
    fechar.type = 'button';
    fechar.className = 'toast-item__fechar';
    fechar.setAttribute('aria-label', 'Fechar notificação');
    fechar.textContent = '×';

    item.append(icone, texto, fechar);
    alvo.appendChild(item);

    requestAnimationFrame(() => item.classList.add('is-visivel'));

    let timeoutId = null;
    function remover() {
      item.classList.remove('is-visivel');
      item.addEventListener('transitionend', () => item.remove(), { once: true });
      clearTimeout(timeoutId);
    }

    fechar.addEventListener('click', remover);
    if (duracao > 0) timeoutId = setTimeout(remover, duracao);

    return { remover };
  };
})();
