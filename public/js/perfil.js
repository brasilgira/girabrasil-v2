// perfil.js — comportamento da página de perfil

const logoutBtn = document.getElementById('logoutBtn');
const toast = document.getElementById('toast');

// Mostra uma mensagem rápida no canto da tela
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// Botão "Sair da conta"
// TODO: ligar no logout real do Supabase (o mesmo do auth.js)
logoutBtn?.addEventListener('click', () => {
  showToast('Sessão encerrada. Até logo!');
});

// Só os itens marcados com data-em-breve são "de mentira" (ainda não têm página).
// Os links normais (noticias.html, jogos.html...) funcionam sozinhos, sem JS.
document.querySelectorAll('[data-em-breve]').forEach(item => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    showToast(`${item.dataset.emBreve} em breve!`);
  });
});
