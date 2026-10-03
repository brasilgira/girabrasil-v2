// Chave da Groq — nunca hardcoded, sempre vem do ambiente
// (.env local / painel da Vercel em produção)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Prompt de sistema do GiraBot — definido a partir do v1, mas com o formato
// de resposta ajustado (tópicos curtos) pra respostas mais diretas.— define a personalidade e os
// limites de assunto do GiraBot. Mantido igual de propósito, já estava
// funcionando bem lá.
const SYSTEM_PROMPT = `Você é o Gira-Bot, a inteligência artificial oficial do site GiraBrasil — um portal de notícias e informações sobre a natureza e as florestas do Brasil.

Sua personalidade:
- Você é apaixonado pela natureza brasileira, curioso e acolhedor
- Usa linguagem acessível mas com embasamento científico
- Ocasionalmente usa emojis relacionados à natureza para tornar a conversa mais viva 🌿
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

// POST /api/girabot
// Recebe { messages: [{ role: 'user'|'assistant', content: '...' }, ...] }
// (o histórico da conversa até agora, sem o system prompt — isso o
// controller adiciona por conta própria antes de mandar pra Groq)
async function conversar(req, res) {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ erro: 'Campo "messages" (array) é obrigatório' });
    }

    if (!GROQ_API_KEY) {
      // Isso só acontece se alguém esqueceu de configurar a variável de
      // ambiente — melhor avisar claro no log do que devolver um erro
      // genérico difícil de debugar depois
      console.error('GROQ_API_KEY não configurada no ambiente');
      return res.status(500).json({ erro: 'IA não configurada no servidor' });
    }

    const respostaGroq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        // A Groq descontinuou o llama-3.3-70b-versatile (usado no v1) em 2026.
        // openai/gpt-oss-120b é o modelo recomendado atual pra uso geral.
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_completion_tokens: 600,
        reasoning_effort: 'low',
        temperature: 0.7,
      }),
    });

    const dados = await respostaGroq.json();
    const textoResposta = dados.choices?.[0]?.message?.content;

    if (!textoResposta) {
      console.error('Resposta inesperada da Groq:', JSON.stringify(dados));
      return res.status(502).json({ erro: 'Erro ao obter resposta da IA' });
    }

    res.json({ resposta: textoResposta.trim () });
  } catch (erro) {
    console.error('Erro ao conversar com o GiraBot:', erro);
    res.status(500).json({ erro: 'Erro interno ao conversar com o GiraBot' });
  }
}

module.exports = { conversar };
