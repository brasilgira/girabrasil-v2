// ==========================================================================
// GiraBrasil — Fluxo de doação (protótipo, sem gateway de pagamento real)
// ==========================================================================

(function () {
  const form = document.getElementById('form-doacao');
  if (!form) return; // só roda em doacao.html

  const botoesValor = Array.from(document.querySelectorAll('.valor-opcao'));
  const inputCustom = document.getElementById('valor-customizado');
  const erroCustom = document.getElementById('valor-erro');
  const resumoValorEl = document.getElementById('resumo-valor');
  const botaoDoar = document.getElementById('botao-doar');

  let valorSelecionado = null; // número em reais, ou null se nada válido selecionado

  function formatarBRL(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function atualizarResumo() {
    if (valorSelecionado && valorSelecionado > 0) {
      resumoValorEl.textContent = `R$ ${formatarBRL(valorSelecionado)}`;
      botaoDoar.textContent = `Doar R$ ${formatarBRL(valorSelecionado)}`;
      botaoDoar.disabled = false;
    } else {
      resumoValorEl.textContent = 'R$ 0,00';
      botaoDoar.textContent = 'Continuar com a doação';
      botaoDoar.disabled = true;
    }
    resumoValorEl.classList.add('atualizado');
    setTimeout(() => resumoValorEl.classList.remove('atualizado'), 150);
  }

  function selecionarPreset(botao) {
    botoesValor.forEach(b => b.classList.remove('selecionado'));
    botao.classList.add('selecionado');
    valorSelecionado = Number(botao.dataset.valor);
    inputCustom.value = '';
    erroCustom.classList.remove('visivel');
    atualizarResumo();
  }

  botoesValor.forEach(botao => {
    botao.addEventListener('click', () => selecionarPreset(botao));
  });

  // Valor customizado: aceita vírgula ou ponto, bloqueia negativos/zero/inválidos
  inputCustom.addEventListener('input', () => {
    botoesValor.forEach(b => b.classList.remove('selecionado'));
    const bruto = inputCustom.value.trim().replace(',', '.');

    if (bruto === '') {
      valorSelecionado = null;
      erroCustom.classList.remove('visivel');
      atualizarResumo();
      return;
    }

    const numero = Number(bruto);
    const valido = /^\d+(\.\d{1,2})?$/.test(bruto) && !Number.isNaN(numero);

    if (!valido || numero <= 0) {
      valorSelecionado = null;
      erroCustom.textContent = numero <= 0 && valido
        ? 'Informe um valor maior que zero.'
        : 'Digite um valor válido, ex: 25,00';
      erroCustom.classList.add('visivel');
      atualizarResumo();
      return;
    }

    erroCustom.classList.remove('visivel');
    valorSelecionado = numero;
    atualizarResumo();
  });

  // --- Método de pagamento ---
  const tabPix = document.getElementById('tab-pix');
  const tabCartao = document.getElementById('tab-cartao');
  const painelPix = document.getElementById('painel-pix');
  const painelCartao = document.getElementById('painel-cartao');

  function ativarMetodo(metodo) {
    const pixAtivo = metodo === 'pix';
    tabPix.classList.toggle('ativo', pixAtivo);
    tabCartao.classList.toggle('ativo', !pixAtivo);
    tabPix.setAttribute('aria-selected', String(pixAtivo));
    tabCartao.setAttribute('aria-selected', String(!pixAtivo));
    painelPix.hidden = !pixAtivo;
    painelCartao.hidden = pixAtivo;
  }
  tabPix.addEventListener('click', () => ativarMetodo('pix'));
  tabCartao.addEventListener('click', () => ativarMetodo('cartao'));

  // --- Copiar código PIX ---
  const botaoCopiarPix = document.getElementById('botao-copiar-pix');
  const pixFeedback = document.getElementById('pix-feedback');
  const pixCodigo = document.getElementById('pix-codigo');

  botaoCopiarPix.addEventListener('click', async () => {
    const texto = pixCodigo.textContent.trim();
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {
      // Fallback silencioso caso a Clipboard API não esteja disponível
      const area = document.createElement('textarea');
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    pixFeedback.textContent = 'PIX copiado!';
    pixFeedback.classList.add('visivel');
    setTimeout(() => pixFeedback.classList.remove('visivel'), 2200);
  });

  // --- Envio (simulado) ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!valorSelecionado || valorSelecionado <= 0) return;
    const valorFormatado = formatarBRL(valorSelecionado);
    window.location.href = `doacao-obrigado.html?valor=${encodeURIComponent(valorFormatado)}`;
  });

  atualizarResumo();
})();
