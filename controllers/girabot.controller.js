// Chave da Groq — nunca hardcoded, sempre vem do ambiente
// (.env local / painel da Vercel em produção)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Mesmo prompt de sistema usado no v1 — define a personalidade e os
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
- Use parágrafos bem estruturados
- Use negrito (**texto**) para destacar nomes de espécies e conceitos importantes
- Seja informativo mas não excessivamente longo
- Sempre que possível, termine com um dado curioso ou convite para explorar mais o tema`;

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
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const dados = await respostaGroq.json();
    const textoResposta = dados.choices?.[0]?.message?.content;

    if (!textoResposta) {
      console.error('Resposta inesperada da Groq:', JSON.stringify(dados));
      return res.status(502).json({ erro: 'Erro ao obter resposta da IA' });
    }

    res.json({ resposta: textoResposta });
  } catch (erro) {
    console.error('Erro ao conversar com o GiraBot:', erro);
    res.status(500).json({ erro: 'Erro interno ao conversar com o GiraBot' });
  }
}

module.exports = { conversar };
