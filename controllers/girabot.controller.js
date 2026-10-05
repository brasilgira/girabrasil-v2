const girabotModel = require("../models/girabot.model");

// Chave da Groq — nunca hardcoded, sempre vem do ambiente
// (.env local / painel da Vercel em produção)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Prompt de sistema do GiraBot — preservado exatamente como estava.
const SYSTEM_PROMPT = `Você é o Gira-Bot, a inteligência artificial oficial do site GiraBrasil — um portal de notícias e informações sobre a natureza e as florestas do Brasil.

Sua personalidade:
- Você é apaixonado pela natureza brasileira, curioso e acolhedor
- Usa linguagem acessível mas com embasamento científico
- Use emojis relacionados à natureza disversifique o bastante o modelo dos emojis para tornar a conversa mais viva 
- É positivo sobre soluções de conservação, mas honesto sobre os desafios ambientais

Sua especialidade abrange EXCLUSIVAMENTE:
- Biomas brasileiros: Amazônia, Cerrado, Mata Atlântica, Caatinga, Pantanal, Pampa, Zona Costeira
- Fauna e flora nativa do Brasil (animais, plantas, fungos, etc.)
- Desmatamento, queimadas e degradação ambiental no Brasil
- Mudanças climáticas e seus efeitos no território brasileiro
- Recursos hídricos: rios, aquíferos, rios voadores, chuvas
- Povos indígenas e comunidades tradicionais e sua relação com a floresta
- Políticas ambientais, legislação e órgãos como IBAMA, ICMBio, INPE
- Biodiversidade, espécies ameaçadas e programas de conservação
- Bioeconomia, extrativismo sustentável e ecoturismo no Brasil
- Notícias e temas recentes do meio ambiente brasileiro

REGRA IMPORTANTE: Se o usuário perguntar sobre algo fora desses temas, responda com gentileza que você é especializado apenas em natureza e meio ambiente brasileiro, e sugira um tema relacionado.

Formato das respostas:
- Respostas em português brasileiro
- Não use formatação markdown (nunca use #, ##, **, tabelas, nem listas com "-" ou "*" — só texto puro). Para listar, use apenas o símbolo "•" no começo da linha
- Seja direto: comece pela resposta, sem introdução longa e sem repetir a pergunta
- Tamanho: mire em até uns 100 palavras no total; só passe disso se o usuário pedir mais detalhes
- Na maioria das respostas, organize em tópicos curtos, um por linha, começando com "• ". Use de 3 a 5 tópicos, cada um com no máximo 1 ou 2 frases
- Pode abrir com UMA frase curta antes dos tópicos, deixando uma linha em branco entre ela e a lista
- Use texto corrido (sem tópicos) só para perguntas simples que se resolvem em 1 ou 2 frases, cumprimentos e conversa casual
- Se o assunto for muito amplo, dê só o essencial e ofereça aprofundar (ex: "Quer que eu detalhe algum desses pontos?")
- Só termine com um dado curioso se couber em 1 frase e realmente agregar; não é obrigatório`;

const MAX_MENSAGENS_CONTEXTO = 20;
const MAX_TITULO = 60;

function idValido(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function gerarTitulo(textoPrimeiraMensagem) {
  const limpo = textoPrimeiraMensagem.trim().replace(/\s+/g, " ");
  if (limpo.length <= MAX_TITULO) return limpo;
  return `${limpo.slice(0, MAX_TITULO - 1).trimEnd()}…`;
}

async function chamarGroq(mensagens) {
  if (!GROQ_API_KEY) {
    console.error("GROQ_API_KEY não configurada no ambiente");
    throw Object.assign(new Error("IA não configurada no servidor"), { codigo: "sem_config" });
  }

  const respostaGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...mensagens],
      max_completion_tokens: 600,
      reasoning_effort: "low",
      temperature: 0.7,
    }),
  });

  const dados = await respostaGroq.json();
  const texto = dados.choices?.[0]?.message?.content;

  if (!texto) {
    console.error("Resposta inesperada da Groq:", JSON.stringify(dados));
    throw Object.assign(new Error("Erro ao obter resposta da IA"), { codigo: "ia_falhou" });
  }

  return texto.trim();
}

async function listarConversas(req, res) {
  try {
    const conversas = await girabotModel.listarConversas(req.usuarioLogado.id);
    res.status(200).json(conversas);
  } catch (erro) {
    console.error("Erro ao listar conversas do GiraBot:", erro.message);
    res.status(500).json({ erro: "Não foi possível carregar suas conversas." });
  }
}

async function criarConversa(req, res) {
  try {
    const conversa = await girabotModel.criarConversa(req.usuarioLogado.id);
    res.status(201).json(conversa);
  } catch (erro) {
    console.error("Erro ao criar conversa do GiraBot:", erro.message);
    res.status(500).json({ erro: "Não foi possível criar a conversa." });
  }
}

async function listarMensagens(req, res) {
  try {
    const conversaId = idValido(req.params.id);
    if (!conversaId) return res.status(404).json({ erro: "Conversa não encontrada." });

    const conversa = await girabotModel.obterConversaDoDono(conversaId, req.usuarioLogado.id);
    if (!conversa) return res.status(404).json({ erro: "Conversa não encontrada." });

    const mensagens = await girabotModel.listarMensagens(conversaId);
    res.status(200).json({ conversa, mensagens });
  } catch (erro) {
    console.error("Erro ao listar mensagens do GiraBot:", erro.message);
    res.status(500).json({ erro: "Não foi possível carregar essa conversa." });
  }
}

async function enviarMensagem(req, res) {
  try {
    const conversaId = idValido(req.params.id);
    if (!conversaId) return res.status(404).json({ erro: "Conversa não encontrada." });

    const conteudo = typeof req.body?.conteudo === "string" ? req.body.conteudo.trim() : "";
    if (!conteudo) return res.status(400).json({ erro: "Mensagem vazia." });
    if (conteudo.length > 4000) return res.status(400).json({ erro: "Mensagem muito longa." });

    const conversa = await girabotModel.obterConversaDoDono(conversaId, req.usuarioLogado.id);
    if (!conversa) return res.status(404).json({ erro: "Conversa não encontrada." });

    const mensagemUsuario = await girabotModel.inserirMensagem(conversaId, "user", conteudo);

    if (!conversa.titulo) {
      await girabotModel.definirTitulo(conversaId, gerarTitulo(conteudo));
    }

    const historico = await girabotModel.listarMensagens(conversaId);
    const ultimasMensagens = historico
      .slice(-MAX_MENSAGENS_CONTEXTO)
      .map((m) => ({ role: m.papel, content: m.conteudo }));

    let textoResposta;
    try {
      textoResposta = await chamarGroq(ultimasMensagens);
    } catch (erroIA) {
      return res.status(502).json({
        erro: "O Gira-Bot não conseguiu responder agora. Tente de novo em instantes.",
        mensagemUsuario,
      });
    }

    try {
      const mensagemAssistente = await girabotModel.inserirMensagem(conversaId, "assistant", textoResposta);
      return res.status(200).json({ mensagemUsuario, mensagemAssistente, avisoNaoSalvo: false });
    } catch (erroSalvar) {
      console.error("Resposta da IA obtida, mas falhou ao salvar:", erroSalvar.message);
      return res.status(200).json({
        mensagemUsuario,
        mensagemAssistente: { papel: "assistant", conteudo: textoResposta, naoPersistida: true },
        avisoNaoSalvo: true,
      });
    }
  } catch (erro) {
    console.error("Erro ao conversar com o GiraBot:", erro.message);
    res.status(500).json({ erro: "Erro interno ao conversar com o Gira-Bot." });
  }
}

async function renomearConversa(req, res) {
  try {
    const conversaId = idValido(req.params.id);
    if (!conversaId) return res.status(404).json({ erro: "Conversa não encontrada." });

    const titulo = typeof req.body?.titulo === "string" ? req.body.titulo.trim() : "";
    if (!titulo) return res.status(400).json({ erro: "Título não pode ficar vazio." });

    const conversa = await girabotModel.renomearConversaDoDono(conversaId, req.usuarioLogado.id, gerarTitulo(titulo));
    if (!conversa) return res.status(404).json({ erro: "Conversa não encontrada." });

    res.status(200).json(conversa);
  } catch (erro) {
    console.error("Erro ao renomear conversa do GiraBot:", erro.message);
    res.status(500).json({ erro: "Não foi possível renomear a conversa." });
  }
}

async function excluirConversa(req, res) {
  try {
    const conversaId = idValido(req.params.id);
    if (!conversaId) return res.status(404).json({ erro: "Conversa não encontrada." });

    const apagada = await girabotModel.excluirConversaDoDono(conversaId, req.usuarioLogado.id);
    if (!apagada) return res.status(404).json({ erro: "Conversa não encontrada." });

    res.status(200).json({ mensagem: "Conversa excluída." });
  } catch (erro) {
    console.error("Erro ao excluir conversa do GiraBot:", erro.message);
    res.status(500).json({ erro: "Não foi possível excluir a conversa." });
  }
}

module.exports = {
  listarConversas,
  criarConversa,
  listarMensagens,
  enviarMensagem,
  renomearConversa,
  excluirConversa,
};
