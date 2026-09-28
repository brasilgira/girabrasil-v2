// controllers/admin.controller.js
const adminModel = require("../models/admin.model");

async function listarNoticias(req, res) {
  try {
    const noticias = await adminModel.listarNoticias();
    res.status(200).json(noticias);
  } catch (erro) {
    console.error("Erro ao listar notícias (admin):", erro);
    res.status(500).json({ erro: "Erro ao listar notícias." });
  }
}

// Valida o campo opcional de conteúdo estruturado (corpo_json): se vier,
// precisa ser um array e cada bloco precisa ter um `tipo` (string). Não
// validamos o formato interno de cada bloco — isso é responsabilidade de
// quem preenche, igual já valia pro conteúdo importado das 12 notícias
// gerais — só garantimos que não vai quebrar o renderBloco() do front.
function validarCorpoJson(corpoJson) {
  if (corpoJson === undefined || corpoJson === null || corpoJson === '') return { ok: true, valor: null };
  if (!Array.isArray(corpoJson)) {
    return { ok: false, erro: 'O conteúdo estruturado precisa ser uma lista de blocos (JSON array).' };
  }
  const algumInvalido = corpoJson.some((bloco) => !bloco || typeof bloco.tipo !== 'string');
  if (algumInvalido) {
    return { ok: false, erro: 'Cada bloco do conteúdo estruturado precisa ter um campo "tipo".' };
  }
  return { ok: true, valor: corpoJson };
}

async function criarNoticia(req, res) {
  try {
    const { titulo, resumo, conteudo, imagemUrl, categoria, bioma, linkFonte, regiaoId, corpoJson, criadoEm } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ erro: "O título não pode ficar vazio." });
    }

    const validacaoCorpo = validarCorpoJson(corpoJson);
    if (!validacaoCorpo.ok) {
      return res.status(400).json({ erro: validacaoCorpo.erro });
    }

    const noticia = await adminModel.criarNoticia({
      titulo: titulo.trim(),
      resumo: resumo ?? "",
      conteudo: conteudo ?? "",
      imagemUrl,
      categoria,
      bioma: bioma || null,
      linkFonte,
      regiaoId: regiaoId || null,
      corpoJson: validacaoCorpo.valor,
      criadoEm: criadoEm || null,
      usuarioId: req.usuarioAdmin?.id,
    });

    res.status(201).json({ mensagem: "Notícia criada.", noticia });
  } catch (erro) {
    console.error("Erro ao criar notícia (admin):", erro);
    res.status(500).json({ erro: "Erro ao criar notícia." });
  }
}

async function editarNoticia(req, res) {
  try {
    const { id } = req.params;
    const { titulo, resumo, conteudo, imagemUrl, categoria, bioma, linkFonte, regiaoId, corpoJson, criadoEm } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ erro: "O título não pode ficar vazio." });
    }

    const validacaoCorpo = validarCorpoJson(corpoJson);
    if (!validacaoCorpo.ok) {
      return res.status(400).json({ erro: validacaoCorpo.erro });
    }

    const noticia = await adminModel.editarNoticia(id, {
      titulo: titulo.trim(),
      resumo,
      conteudo: conteudo ?? "",
      imagemUrl,
      categoria,
      bioma,
      linkFonte,
      regiaoId: regiaoId || null,
      corpoJson: validacaoCorpo.valor,
      criadoEm: criadoEm || null,
    });

    if (!noticia) {
      return res.status(404).json({ erro: "Notícia não encontrada." });
    }

    res.status(200).json({ mensagem: "Notícia atualizada.", noticia });
  } catch (erro) {
    console.error("Erro ao editar notícia (admin):", erro);
    res.status(500).json({ erro: "Erro ao editar notícia." });
  }
}

async function apagarNoticia(req, res) {
  try {
    const { id } = req.params;
    const noticia = await adminModel.apagarNoticia(id);

    if (!noticia) {
      return res.status(404).json({ erro: "Notícia não encontrada." });
    }

    res.status(200).json({ mensagem: "Notícia removida.", noticia });
  } catch (erro) {
    console.error("Erro ao apagar notícia (admin):", erro);
    res.status(500).json({ erro: "Erro ao apagar notícia." });
  }
}

async function listarComentarios(req, res) {
  try {
    const comentarios = await adminModel.listarComentarios();
    res.status(200).json(comentarios);
  } catch (erro) {
    console.error("Erro ao listar comentários (admin):", erro);
    res.status(500).json({ erro: "Erro ao listar comentários." });
  }
}

async function editarComentario(req, res) {
  try {
    const { id } = req.params;
    const { texto } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ erro: "O texto do comentário não pode ficar vazio." });
    }

    const comentario = await adminModel.editarComentario(id, texto.trim());

    if (!comentario) {
      return res.status(404).json({ erro: "Comentário não encontrado." });
    }

    res.status(200).json({ mensagem: "Comentário atualizado.", comentario });
  } catch (erro) {
    console.error("Erro ao editar comentário (admin):", erro);
    res.status(500).json({ erro: "Erro ao editar comentário." });
  }
}

async function apagarComentario(req, res) {
  try {
    const { id } = req.params;
    const comentario = await adminModel.apagarComentario(id);

    if (!comentario) {
      return res.status(404).json({ erro: "Comentário não encontrado." });
    }

    res.status(200).json({ mensagem: "Comentário removido.", comentario });
  } catch (erro) {
    console.error("Erro ao apagar comentário (admin):", erro);
    res.status(500).json({ erro: "Erro ao apagar comentário." });
  }
}

async function listarUsuarios(req, res) {
  try {
    const usuarios = await adminModel.listarUsuarios();
    res.status(200).json(usuarios);
  } catch (erro) {
    console.error("Erro ao listar usuários (admin):", erro);
    res.status(500).json({ erro: "Erro ao listar usuários." });
  }
}

async function obterMetricas(req, res) {
  try {
    const [totais, cadastros] = await Promise.all([
      adminModel.obterTotais(),
      adminModel.obterCadastrosPorMes(),
    ]);

    // Preenche os 12 meses corridos com 0 onde não veio linha do banco,
    // pra o gráfico sempre ter as 12 colunas na ordem certa.
    const porMes = new Map(cadastros.map((c) => [c.mes, c.total]));
    const cadastrosPorMes = [];
    const referencia = new Date();
    referencia.setDate(1);
    const nomesMeses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    for (let i = 11; i >= 0; i--) {
      const data = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
      const rotulo = `${nomesMeses[data.getMonth()]}/${String(data.getFullYear()).slice(-2)}`;
      cadastrosPorMes.push({ mes: rotulo, total: porMes.get(chave) || 0 });
    }

    res.status(200).json({
      usuarios: totais.usuarios,
      noticias: totais.noticias,
      comentarios: totais.comentarios,
      cadastrosPorMes,
    });
  } catch (erro) {
    console.error("Erro ao calcular métricas (admin):", erro);
    res.status(500).json({ erro: "Erro ao calcular métricas." });
  }
}

module.exports = {
  listarNoticias,
  criarNoticia,
  editarNoticia,
  apagarNoticia,
  listarComentarios,
  editarComentario,
  apagarComentario,
  listarUsuarios,
  obterMetricas,
};
