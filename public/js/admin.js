/* ==========================================================================
   admin.js — Painel Administrativo (Gira Brasil)

   FASE 4: conectado de verdade ao backend (/api/admin/*), usando o token
   do Supabase (via fetchAutenticado(), de js/auth.js) e a mesma sessão que
   o resto do site já usa. Nada de mock aqui — o que falhar aparece como
   erro de verdade (toast / mensagem no formulário), não como sucesso fingido.

   Segurança: esta checagem no front é só conveniência de UX (evita que um
   usuário comum veja o painel piscar antes de ser expulso). A autorização
   de verdade está no backend — toda rota /api/admin/* passa por
   middleware/verificarAdmin.js, que valida o token no Supabase Auth e olha
   app_metadata.is_admin. Mesmo que alguém pule esta checagem no navegador,
   as chamadas à API continuam recusadas.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  iniciarPainel();
});

// Guarda em memória as últimas listas carregadas, pra "Editar" não precisar
// buscar tudo de novo na API — os dados já vieram no GET da tabela.
const estado = {
  noticias: [],
  comentarios: [],
  regioes: [],
};

/* ---------------------------------------------------------------------- */
/* Inicialização + guarda de acesso                                       */
/* ---------------------------------------------------------------------- */

async function iniciarPainel() {
  const usuario = typeof obterUsuarioLogado === "function" ? obterUsuarioLogado() : null;

  if (!usuario) {
    window.location.href = `login.html?redirect=${encodeURIComponent("admin.html")}`;
    return;
  }
  if (!usuario.is_admin) {
    window.location.href = "index.html";
    return;
  }

  preencherCabecalhoAdmin(usuario);

  configurarMenuLateral();
  configurarModais();
  configurarFormularioNoticia();
  configurarFormularioComentario();

  await Promise.all([
    carregarMetricas(),
    carregarRegioes().then(carregarNoticias),
    carregarComentarios(),
    carregarUsuarios(),
  ]);
}

function preencherCabecalhoAdmin(usuario) {
  const nome = usuario.nome || (usuario.email ? usuario.email.split("@")[0] : "Administrador");
  const iniciais = nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  const elNome = document.querySelector("[data-admin-nome]");
  const elIniciais = document.querySelector("[data-admin-iniciais]");
  if (elNome) elNome.textContent = nome;
  if (elIniciais) elIniciais.textContent = iniciais || "A";
}

/* ---------------------------------------------------------------------- */
/* Chamadas à API                                                          */
/* ---------------------------------------------------------------------- */

// Wrapper fino sobre fetchAutenticado (de js/auth.js): sempre manda o
// token do Supabase, sempre lê a resposta como JSON e sempre lança um erro
// com a mensagem que o backend mandou (req.erro), pra quem chamar poder
// mostrar isso pro admin em vez de um "erro genérico".
async function chamarApiAdmin(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetchAutenticado(caminho, {
      ...opcoes,
      headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) },
    });
  } catch (erro) {
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  let corpo = null;
  try {
    corpo = await resposta.json();
  } catch {
    corpo = null;
  }

  if (!resposta.ok) {
    if (resposta.status === 401 || resposta.status === 403) {
      throw new Error((corpo && corpo.erro) || "Acesso negado.");
    }
    throw new Error((corpo && corpo.erro) || `Erro inesperado (${resposta.status}).`);
  }

  return corpo;
}

/* ---------------------------------------------------------------------- */
/* Métricas + gráfico                                                      */
/* ---------------------------------------------------------------------- */

async function carregarMetricas() {
  try {
    const dados = await chamarApiAdmin("/api/admin/metricas");
    renderizarMetricas({
      usuarios: dados.usuarios,
      noticias: dados.noticias,
      comentarios: dados.comentarios,
    });
    renderizarGrafico(dados.cadastrosPorMes || []);
  } catch (erro) {
    console.error("Erro ao carregar métricas:", erro);
    mostrarToast(`Não foi possível carregar as métricas: ${erro.message}`);
  }
}

function renderizarMetricas(valores) {
  Object.entries(valores).forEach(([chave, valor]) => {
    const elValor = document.querySelector(`[data-metrica="${chave}"]`);
    if (elValor) elValor.textContent = valor ?? "—";
  });
}

function renderizarGrafico(pontos) {
  const container = document.querySelector("[data-grafico-cadastros]");
  const eixo = document.querySelector("[data-grafico-eixo]");
  if (!container) return;

  container.innerHTML = "";
  if (eixo) eixo.innerHTML = "";

  if (!pontos.length) {
    return;
  }

  const maiorValor = Math.max(1, ...pontos.map((p) => p.total));

  if (eixo) {
    const degraus = 4;
    eixo.style.display = "flex";
    eixo.style.flexDirection = "column";
    eixo.style.justifyContent = "space-between";
    for (let i = degraus; i >= 0; i--) {
      const span = document.createElement("span");
      span.textContent = String(Math.round((maiorValor / degraus) * i));
      eixo.appendChild(span);
    }
  }

  pontos.forEach((ponto) => {
    const alturaPercentual = Math.round((ponto.total / maiorValor) * 100);

    const coluna = document.createElement("div");
    coluna.className = "grafico-barras__coluna";

    const barra = document.createElement("div");
    barra.className = "grafico-barras__barra";
    barra.style.height = `${alturaPercentual}%`;
    barra.title = `${ponto.mes}: ${ponto.total} cadastros`;

    const rotulo = document.createElement("span");
    rotulo.className = "grafico-barras__rotulo";
    rotulo.textContent = ponto.mes;

    coluna.append(barra, rotulo);
    container.appendChild(coluna);
  });
}

/* ---------------------------------------------------------------------- */
/* Regiões (pro <select> do formulário de notícia)                        */
/* ---------------------------------------------------------------------- */

async function carregarRegioes() {
  try {
    const resposta = await fetch("/api/regioes");
    if (!resposta.ok) throw new Error(`API respondeu ${resposta.status}`);
    estado.regioes = await resposta.json();
  } catch (erro) {
    console.error("Erro ao carregar regiões:", erro);
    estado.regioes = [];
  }

  const select = document.querySelector("[data-select-regiao]");
  if (!select) return;

  // Mantém a primeira opção ("Notícia geral (sem região)") e recria o resto
  const primeiraOpcao = select.querySelector("option");
  select.innerHTML = "";
  if (primeiraOpcao) select.appendChild(primeiraOpcao);

  estado.regioes.forEach((regiao) => {
    const opcao = document.createElement("option");
    opcao.value = String(regiao.id);
    opcao.textContent = regiao.nome;
    select.appendChild(opcao);
  });
}

function nomeDaRegiao(regiaoId) {
  if (!regiaoId) return null;
  const regiao = estado.regioes.find((r) => String(r.id) === String(regiaoId));
  return regiao ? regiao.nome : null;
}

/* ---------------------------------------------------------------------- */
/* Tabela de notícias                                                      */
/* ---------------------------------------------------------------------- */

async function carregarNoticias() {
  try {
    estado.noticias = await chamarApiAdmin("/api/admin/noticias");
    renderizarNoticias(estado.noticias);
  } catch (erro) {
    console.error("Erro ao carregar notícias:", erro);
    mostrarToast(`Não foi possível carregar as notícias: ${erro.message}`);
  }
}

function renderizarNoticias(lista) {
  const corpo = document.querySelector('[data-tabela="noticias"]');
  if (!corpo) return;

  corpo.innerHTML = "";

  if (!lista.length) {
    corpo.appendChild(linhaVazia(4, "Nenhuma notícia cadastrada ainda."));
    return;
  }

  lista.forEach((noticia) => {
    const linha = document.createElement("tr");
    linha.dataset.linhaNoticia = noticia.id;
    if (!noticia.ativo) linha.classList.add("esta-desativado");

    const tdTitulo = document.createElement("td");
    tdTitulo.className = "celula-truncada";
    tdTitulo.title = noticia.titulo;
    tdTitulo.textContent = noticia.titulo;

    const tdRegiao = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = "tag-regiao";
    tag.textContent = noticia.regiao_nome || "Geral";
    tdRegiao.appendChild(tag);

    const tdData = document.createElement("td");
    tdData.textContent = formatarDataBr(noticia.criado_em);

    const tdAcoes = document.createElement("td");
    tdAcoes.appendChild(
      celulaAcoes([
        { texto: "Editar", onClick: () => abrirModalEdicaoNoticia(noticia) },
        {
          texto: "Apagar",
          perigo: true,
          onClick: () =>
            pedirConfirmacaoExclusao({
              tipo: "noticia",
              id: noticia.id,
              descricao: `a notícia "${noticia.titulo}"`,
            }),
        },
      ])
    );

    linha.append(tdTitulo, tdRegiao, tdData, tdAcoes);
    corpo.appendChild(linha);
  });
}

/* ---------------------------------------------------------------------- */
/* Tabela de comentários                                                   */
/* ---------------------------------------------------------------------- */

async function carregarComentarios() {
  try {
    estado.comentarios = await chamarApiAdmin("/api/admin/comentarios");
    renderizarComentarios(estado.comentarios);
  } catch (erro) {
    console.error("Erro ao carregar comentários:", erro);
    mostrarToast(`Não foi possível carregar os comentários: ${erro.message}`);
  }
}

function renderizarComentarios(lista) {
  const corpo = document.querySelector('[data-tabela="comentarios"]');
  if (!corpo) return;

  corpo.innerHTML = "";

  if (!lista.length) {
    corpo.appendChild(linhaVazia(4, "Nenhum comentário por enquanto."));
    return;
  }

  lista.forEach((comentario) => {
    const linha = document.createElement("tr");
    linha.dataset.linhaComentario = comentario.id;
    if (!comentario.ativo) linha.classList.add("esta-desativado");

    const tdAutor = document.createElement("td");
    tdAutor.textContent = comentario.autor_nome || "—";

    const tdNoticia = document.createElement("td");
    tdNoticia.className = "celula-truncada";
    tdNoticia.title = comentario.noticia_titulo || "";
    tdNoticia.textContent = comentario.noticia_titulo || "—";

    const tdTexto = document.createElement("td");
    tdTexto.className = "celula-truncada";
    tdTexto.title = comentario.conteudo || "";
    tdTexto.textContent = comentario.conteudo || "";

    const tdAcoes = document.createElement("td");
    tdAcoes.appendChild(
      celulaAcoes([
        { texto: "Editar", onClick: () => abrirModalEdicaoComentario(comentario) },
        {
          texto: "Apagar",
          perigo: true,
          onClick: () =>
            pedirConfirmacaoExclusao({
              tipo: "comentario",
              id: comentario.id,
              descricao: `o comentário de ${comentario.autor_nome || "usuário"}`,
            }),
        },
      ])
    );

    linha.append(tdAutor, tdNoticia, tdTexto, tdAcoes);
    corpo.appendChild(linha);
  });
}

/* ---------------------------------------------------------------------- */
/* Tabela de usuários (só consulta — sem e-mail, sem desativação)          */
/* ---------------------------------------------------------------------- */

async function carregarUsuarios() {
  try {
    const usuarios = await chamarApiAdmin("/api/admin/usuarios");
    renderizarUsuarios(usuarios);
  } catch (erro) {
    console.error("Erro ao carregar usuários:", erro);
    mostrarToast(`Não foi possível carregar os usuários: ${erro.message}`);
  }
}

function renderizarUsuarios(lista) {
  const corpo = document.querySelector('[data-tabela="usuarios"]');
  const contador = document.querySelector('[data-contador="usuarios"]');
  if (contador) contador.textContent = `${lista.length} no total`;
  if (!corpo) return;

  corpo.innerHTML = "";

  if (!lista.length) {
    corpo.appendChild(linhaVazia(2, "Nenhum usuário cadastrado ainda."));
    return;
  }

  lista.forEach((usuario) => {
    const linha = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = usuario.nome || "—";

    const tdData = document.createElement("td");
    tdData.textContent = formatarDataBr(usuario.criado_em);

    linha.append(tdNome, tdData);
    corpo.appendChild(linha);
  });
}

/* ---------------------------------------------------------------------- */
/* Auxiliares de tabela (DOM seguro — sem innerHTML com dado do banco)     */
/* ---------------------------------------------------------------------- */

function linhaVazia(colspan, mensagem) {
  const linha = document.createElement("tr");
  linha.className = "estado-vazio";
  const td = document.createElement("td");
  td.colSpan = colspan;
  td.textContent = mensagem;
  linha.appendChild(td);
  return linha;
}

function celulaAcoes(acoes) {
  const container = document.createElement("div");
  container.className = "acoes-linha";
  acoes.forEach(({ texto, perigo, onClick }) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = perigo ? "botao-acao botao-acao--perigo" : "botao-acao";
    botao.textContent = texto;
    botao.addEventListener("click", onClick);
    container.appendChild(botao);
  });
  return container;
}

function formatarDataBr(isoString) {
  if (!isoString) return "—";
  const data = new Date(isoString);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR");
}

/* ---------------------------------------------------------------------- */
/* Menu lateral (troca de seção)                                          */
/* ---------------------------------------------------------------------- */

function configurarMenuLateral() {
  const itens = document.querySelectorAll(".admin-menu__item");

  itens.forEach((item) => {
    item.addEventListener("click", () => {
      itens.forEach((i) => i.classList.remove("is-ativo"));
      item.classList.add("is-ativo");

      const secaoAlvo = item.getAttribute("data-secao");

      if (secaoAlvo === "visao-geral") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      document.getElementById(secaoAlvo)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Modais (abrir / fechar)                                                */
/* ---------------------------------------------------------------------- */

function configurarModais() {
  document.querySelectorAll("[data-abrir-modal]").forEach((botao) => {
    botao.addEventListener("click", () => {
      abrirModalNovaNoticia();
    });
  });

  document.querySelectorAll("[data-fechar-modal]").forEach((botao) => {
    botao.addEventListener("click", () => {
      fecharModal(botao.closest(".modal-fundo"));
    });
  });

  document.querySelectorAll(".modal-fundo").forEach((modal) => {
    modal.addEventListener("click", (evento) => {
      if (evento.target === modal) fecharModal(modal);
    });
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      document.querySelectorAll(".modal-fundo:not([hidden])").forEach(fecharModal);
    }
  });

  configurarExclusao();
}

function abrirModal(nome) {
  const modal = document.querySelector(`[data-modal="${nome}"]`);
  if (!modal) return;
  modal.hidden = false;
  modal.querySelector("input, select, textarea")?.focus();
}

function fecharModal(modal) {
  if (!modal) return;
  modal.hidden = true;
}

/* ---------------------------------------------------------------------- */
/* Formulário: nova / editar notícia                                       */
/* ---------------------------------------------------------------------- */

// Reduz um array de blocos (formato corpo_json) a um texto simples, só com
// os blocos "de leitura" — usado pra sempre deixar a coluna `conteudo`
// (texto puro) preenchida mesmo quando o admin edita pelo JSON avançado.
// Mesma lógica do scripts/importar-noticias.js, propositalmente.
function textoPlanoDoCorpo(corpo) {
  if (!Array.isArray(corpo)) return "";
  return corpo
    .map((bloco) => {
      if (bloco.tipo === "paragrafo" || bloco.tipo === "titulo" || bloco.tipo === "subtitulo") return bloco.texto || "";
      if (bloco.tipo === "lista" && Array.isArray(bloco.itens)) return bloco.itens.join(" ");
      if (bloco.tipo === "citacao") return bloco.texto || "";
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function abrirModalNovaNoticia() {
  const formulario = document.querySelector('[data-form="nova-noticia"]');
  if (!formulario) return;

  formulario.reset();
  formulario.querySelector('[name="id"]').value = "";
  esconderErroFormulario(formulario);

  document.querySelector("[data-titulo-modal-noticia]").textContent = "Cadastrar nova notícia";
  document.querySelector("[data-botao-salvar-noticia]").textContent = "Publicar notícia";

  abrirModal("nova-noticia");
}

function abrirModalEdicaoNoticia(noticia) {
  const formulario = document.querySelector('[data-form="nova-noticia"]');
  if (!formulario) return;

  formulario.reset();
  esconderErroFormulario(formulario);

  formulario.querySelector('[name="id"]').value = noticia.id;
  formulario.querySelector('[name="titulo"]').value = noticia.titulo || "";
  formulario.querySelector('[name="resumo"]').value = noticia.resumo || "";
  formulario.querySelector('[name="categoria"]').value = noticia.categoria || "";
  formulario.querySelector('[name="bioma"]').value = noticia.bioma || "";
  formulario.querySelector('[name="regiao"]').value = noticia.regiao_id ? String(noticia.regiao_id) : "";
  formulario.querySelector('[name="imagem"]').value = noticia.imagem_url || "";
  formulario.querySelector('[name="fonte"]').value = noticia.link_fonte || "";

  const campoData = formulario.querySelector('[name="dataPublicacao"]');
  if (campoData) {
    const data = new Date(noticia.criado_em);
    campoData.value = Number.isNaN(data.getTime()) ? "" : data.toISOString().slice(0, 10);
  }

  const campoJson = formulario.querySelector("[data-campo-corpo-json]");
  const campoSimples = formulario.querySelector('[name="conteudoSimples"]');
  const detalhesAvancado = formulario.querySelector(".campo-avancado");

  if (Array.isArray(noticia.corpo_json) && noticia.corpo_json.length) {
    // Já tem conteúdo estruturado — preserva o formato exato, só deixa
    // editável em JSON, pra não arriscar perder blocos que o editor de
    // parágrafos simples não sabe representar (citação, lista, etc).
    campoJson.value = JSON.stringify(noticia.corpo_json, null, 2);
    campoSimples.value = "";
    detalhesAvancado.open = true;
  } else {
    campoJson.value = "";
    campoSimples.value = noticia.conteudo || "";
    detalhesAvancado.open = false;
  }

  document.querySelector("[data-titulo-modal-noticia]").textContent = "Editar notícia";
  document.querySelector("[data-botao-salvar-noticia]").textContent = "Salvar alteração";

  abrirModal("nova-noticia");
}

function mostrarErroFormulario(formulario, mensagem) {
  const el = formulario.querySelector("[data-erro-corpo-json]") || formulario.querySelector('[data-aviso]');
  if (!el) return;
  el.textContent = mensagem;
  el.hidden = false;
}

function esconderErroFormulario(formulario) {
  formulario.querySelectorAll("[data-erro-corpo-json], [data-aviso]").forEach((el) => {
    el.hidden = true;
    el.textContent = "";
  });
}

function configurarFormularioNoticia() {
  const formulario = document.querySelector('[data-form="nova-noticia"]');
  if (!formulario) return;

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    esconderErroFormulario(formulario);

    const dados = Object.fromEntries(new FormData(formulario).entries());
    const id = dados.id;

    // Monta o corpo estruturado: se o campo avançado (JSON) tiver algo,
    // ele manda; senão, cada linha não-vazia do campo simples vira um
    // bloco de parágrafo; se os dois estiverem vazios, corpo_json = null.
    let corpoJson = null;
    const jsonBruto = (dados.corpoJson || "").trim();

    if (jsonBruto) {
      try {
        const parsed = JSON.parse(jsonBruto);
        if (!Array.isArray(parsed)) throw new Error("precisa ser uma lista (JSON array)");
        corpoJson = parsed;
      } catch (erro) {
        mostrarErroFormulario(formulario, `JSON inválido no conteúdo estruturado: ${erro.message}`);
        return;
      }
    } else if ((dados.conteudoSimples || "").trim()) {
      corpoJson = dados.conteudoSimples
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean)
        .map((texto) => ({ tipo: "paragrafo", texto }));
    }

    const conteudoPlano = (dados.conteudoSimples || "").trim() || textoPlanoDoCorpo(corpoJson) || dados.resumo || "";

    const payload = {
      titulo: dados.titulo,
      resumo: dados.resumo,
      conteudo: conteudoPlano,
      imagemUrl: dados.imagem || null,
      categoria: dados.categoria || null,
      bioma: dados.bioma || null,
      linkFonte: dados.fonte || null,
      regiaoId: dados.regiao || null,
      corpoJson,
      criadoEm: dados.dataPublicacao || null,
    };

    const botaoSalvar = formulario.querySelector("[data-botao-salvar-noticia]");
    botaoSalvar.disabled = true;

    try {
      if (id) {
        await chamarApiAdmin(`/api/admin/noticias/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        mostrarToast("Notícia atualizada com sucesso.");
      } else {
        await chamarApiAdmin("/api/admin/noticias", { method: "POST", body: JSON.stringify(payload) });
        mostrarToast("Notícia publicada com sucesso.");
      }

      fecharModal(document.querySelector('[data-modal="nova-noticia"]'));
      await carregarNoticias();
      await carregarMetricas();
    } catch (erro) {
      console.error("Erro ao salvar notícia:", erro);
      mostrarErroFormulario(formulario, erro.message);
    } finally {
      botaoSalvar.disabled = false;
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Formulário: editar comentário                                           */
/* ---------------------------------------------------------------------- */

function abrirModalEdicaoComentario(comentario) {
  const modal = document.querySelector('[data-modal="editar-comentario"]');
  const formulario = modal?.querySelector('[data-form="editar-comentario"]');
  if (!modal || !formulario) return;

  esconderErroFormulario(formulario);
  formulario.dataset.comentarioId = comentario.id;
  formulario.querySelector('textarea[name="comentario"]').value = comentario.conteudo || "";

  abrirModal("editar-comentario");
}

function configurarFormularioComentario() {
  const formulario = document.querySelector('[data-form="editar-comentario"]');
  if (!formulario) return;

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    esconderErroFormulario(formulario);

    const id = formulario.dataset.comentarioId;
    const novoTexto = formulario.querySelector('textarea[name="comentario"]').value;
    const botao = formulario.querySelector('button[type="submit"]');
    botao.disabled = true;

    try {
      await chamarApiAdmin(`/api/admin/comentarios/${id}`, {
        method: "PUT",
        body: JSON.stringify({ texto: novoTexto }),
      });

      mostrarToast("Comentário atualizado com sucesso.");
      fecharModal(document.querySelector('[data-modal="editar-comentario"]'));
      await carregarComentarios();
    } catch (erro) {
      console.error("Erro ao editar comentário:", erro);
      mostrarErroFormulario(formulario, erro.message);
    } finally {
      botao.disabled = false;
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Exclusão (notícia ou comentário) — soft delete de verdade no backend   */
/* ---------------------------------------------------------------------- */

function configurarExclusao() {
  document.querySelector("[data-confirmar-exclusao]")?.addEventListener("click", async () => {
    await executarExclusaoPendente();
  });
}

let pendenteExclusao = null; // { tipo: "noticia" | "comentario", id, descricao }

function pedirConfirmacaoExclusao({ tipo, id, descricao }) {
  pendenteExclusao = { tipo, id, descricao };

  const modal = document.querySelector('[data-modal="confirmar-exclusao"]');
  modal.querySelector("[data-texto-exclusao]").textContent =
    `Tem certeza que quer apagar ${descricao}? Essa ação usa soft delete — o item some da listagem, mas continua no banco.`;

  abrirModal("confirmar-exclusao");
}

async function executarExclusaoPendente() {
  if (!pendenteExclusao) return;
  const { tipo, id } = pendenteExclusao;
  const caminho = tipo === "noticia" ? `/api/admin/noticias/${id}` : `/api/admin/comentarios/${id}`;

  try {
    await chamarApiAdmin(caminho, { method: "DELETE" });

    const linha = document.querySelector(
      tipo === "noticia" ? `[data-linha-noticia="${id}"]` : `[data-linha-comentario="${id}"]`
    );
    linha?.classList.add("esta-desativado");

    mostrarToast("Item apagado (soft delete) com sucesso.");
    await carregarMetricas();
  } catch (erro) {
    console.error("Erro ao apagar item:", erro);
    mostrarToast(`Não foi possível apagar: ${erro.message}`);
  } finally {
    fecharModal(document.querySelector('[data-modal="confirmar-exclusao"]'));
    pendenteExclusao = null;
  }
}

/* ---------------------------------------------------------------------- */
/* Toast                                                                   */
/* ---------------------------------------------------------------------- */

let toastTimeoutId = null;

function mostrarToast(mensagem) {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;

  toast.textContent = mensagem;
  toast.hidden = false;

  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toast.hidden = true;
  }, 3600);
}
