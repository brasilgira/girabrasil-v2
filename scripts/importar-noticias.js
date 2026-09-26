// ============================================================================
// scripts/importar-noticias.js
//
// FASE 1 da migração de conteúdo: lê as 72 notícias que hoje vivem nos
// arquivos JS do front (public/js/noticias-data.js e
// public/js/regiao-noticias-data.js) e insere elas na tabela `noticias`
// do PostgreSQL/Supabase.
//
// COMO RODAR:
//   node scripts/importar-noticias.js
//
// É SEGURO RODAR MAIS DE UMA VEZ: cada notícia recebe um `slug_origem`
// estável (ex: 'geral-1', 'regiao-norte-03') e o script faz
// INSERT ... ON CONFLICT (slug_origem) DO UPDATE — ou seja, rodar de novo
// depois de editar o conteúdo nos arquivos JS ATUALIZA a notícia no banco
// em vez de duplicar.
//
// NÃO mexe no server.js, app.js, config/db.js nem nas rotas existentes —
// só lê os dois arquivos JS e escreve na tabela `noticias`.
// ============================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const pool = require('../config/db');

// ---------------------------------------------------------------------------
// 1) Lê os arquivos JS do front SEM executá-los no Node "de verdade" — eles
//    fazem `window.NOTICIAS = [...]`, então criamos um `window` falso dentro
//    de um sandbox (vm) só pra capturar esses dois valores, sem poluir o
//    escopo global deste script nem precisar de nenhuma dependência nova.
// ---------------------------------------------------------------------------

function carregarDadosDoArquivo(caminhoRelativo) {
  const caminhoAbsoluto = path.join(__dirname, '..', 'public', 'js', caminhoRelativo);
  const codigo = fs.readFileSync(caminhoAbsoluto, 'utf8');

  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(codigo, sandbox, { filename: caminhoRelativo });

  return sandbox.window;
}

// ---------------------------------------------------------------------------
// 2) Utilitários de transformação
// ---------------------------------------------------------------------------

// Converte 'DD/MM/AAAA' pra um Date de verdade. Se não conseguir entender
// o formato, retorna null (o banco usa a data de agora nesse caso).
function converterDataBr(texto) {
  if (!texto || typeof texto !== 'string') return null;
  const partes = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!partes) return null;
  const [, dia, mes, ano] = partes;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return Number.isNaN(data.getTime()) ? null : data;
}

// As 12 notícias gerais têm `corpo` estruturado (blocos), não um texto
// corrido. Pra manter a coluna `conteudo` (texto simples) preenchida — ela
// já é lida em outros lugares do projeto —, juntamos só os textos "de
// leitura" (parágrafos/títulos/subtítulos) numa versão em texto plano.
// O array original INTEIRO continua preservado, sem perdas, em corpo_json.
function textoPlanoDoCorpo(corpo) {
  if (!Array.isArray(corpo)) return '';
  return corpo
    .map((bloco) => {
      if (bloco.tipo === 'paragrafo' || bloco.tipo === 'titulo' || bloco.tipo === 'subtitulo') {
        return bloco.texto;
      }
      if (bloco.tipo === 'lista' && Array.isArray(bloco.itens)) {
        return bloco.itens.join(' ');
      }
      if (bloco.tipo === 'citacao') {
        return bloco.texto;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// 3) Monta a lista de "linhas" (uma por notícia) prontas pra inserir,
//    a partir dos dois arquivos JS.
// ---------------------------------------------------------------------------

function montarLinhasGerais(noticiasGerais) {
  return noticiasGerais.map((n) => ({
    slugOrigem: `geral-${n.id}`,
    titulo: n.titulo,
    resumo: n.resumo || null,
    conteudo: textoPlanoDoCorpo(n.corpo) || n.resumo || '',
    imagemUrl: n.imagem || null,
    categoria: n.categoria || null,
    bioma: n.bioma || null,
    linkFonte: n.link || null,
    regiaoId: null, // notícias gerais não pertencem a UMA região específica
    corpoJson: n.corpo || null,
    metadados: {
      autor: n.autor,
      dataPublicacao: n.dataPublicacao,
      dataAtualizacao: n.dataAtualizacao,
      tempoLeitura: n.tempoLeitura,
      legendaHero: n.legendaHero,
    },
    criadoEm: converterDataBr(n.meta),
  }));
}

function montarLinhasRegionais(regiaoNoticias, mapaRegiaoIdPorChave) {
  const linhas = [];

  for (const [chaveRegiao, lista] of Object.entries(regiaoNoticias)) {
    const regiaoId = mapaRegiaoIdPorChave[chaveRegiao];

    if (!regiaoId) {
      console.warn(`Aviso: região "${chaveRegiao}" não encontrada na tabela regiao — pulando essas notícias.`);
      continue;
    }

    lista.forEach((n, indice) => {
      const numero = String(indice + 1).padStart(2, '0');
      linhas.push({
        slugOrigem: `regiao-${chaveRegiao}-${numero}`,
        titulo: n.titulo,
        resumo: n.resumo || null,
        conteudo: n.resumo || '',
        imagemUrl: n.imagem || null,
        categoria: n.categoria || null,
        bioma: null, // aqui quem identifica a região é regiaoId, não bioma
        linkFonte: n.link || null,
        regiaoId,
        corpoJson: null, // as 60 regionais não têm corpo estruturado (ainda)
        metadados: { regiaoOrigem: chaveRegiao },
        criadoEm: converterDataBr(n.data),
      });
    });
  }

  return linhas;
}

// ---------------------------------------------------------------------------
// 4) Insere (ou atualiza) uma linha no banco
// ---------------------------------------------------------------------------

async function importarLinha(cliente, linha) {
  await cliente.query(
    `
      INSERT INTO noticias (
        slug_origem,
        titulo,
        resumo,
        conteudo,
        imagem_url,
        categoria,
        bioma,
        link_fonte,
        regiao_id,
        corpo_json,
        metadados,
        criado_em,
        ativo
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        COALESCE($12, now()),
        true
      )
      ON CONFLICT (slug_origem) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        resumo = EXCLUDED.resumo,
        conteudo = EXCLUDED.conteudo,
        imagem_url = EXCLUDED.imagem_url,
        categoria = EXCLUDED.categoria,
        bioma = EXCLUDED.bioma,
        link_fonte = EXCLUDED.link_fonte,
        regiao_id = EXCLUDED.regiao_id,
        corpo_json = EXCLUDED.corpo_json,
        metadados = EXCLUDED.metadados,
        atualizado_em = now()
    `,
    [
      linha.slugOrigem,
      linha.titulo,
      linha.resumo,
      linha.conteudo,
      linha.imagemUrl,
      linha.categoria,
      linha.bioma,
      linha.linkFonte,
      linha.regiaoId,
      linha.corpoJson ? JSON.stringify(linha.corpoJson) : null,
      JSON.stringify(linha.metadados || {}),
      linha.criadoEm,
    ]
  );
}

// ---------------------------------------------------------------------------
// 5) Execução principal
// ---------------------------------------------------------------------------

async function main() {
  console.log('Lendo public/js/noticias-data.js e public/js/regiao-noticias-data.js...');

  const janelaGeral = carregarDadosDoArquivo('noticias-data.js');
  const janelaRegional = carregarDadosDoArquivo('regiao-noticias-data.js');

  const noticiasGerais = janelaGeral.NOTICIAS || [];
  const regiaoNoticias = janelaRegional.REGIAO_NOTICIAS || {};

  console.log(`Encontradas ${noticiasGerais.length} notícias gerais.`);
  console.log(`Encontradas ${Object.keys(regiaoNoticias).length} regiões com notícias.`);

  const cliente = await pool.connect();

  try {
    // Mapa 'norte' -> id numérico real da tabela regiao (busca pelo nome,
    // sem depender de nenhum ID fixo — a migration 004 já garante que as
    // 5 linhas existem).
    const resultadoRegioes = await cliente.query('SELECT id, nome FROM regiao');
    const mapaRegiaoIdPorChave = {};
    const normalizarChave = (nome) =>
      nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-');

    resultadoRegioes.rows.forEach((r) => {
      mapaRegiaoIdPorChave[normalizarChave(r.nome)] = r.id;
    });

    const linhasGerais = montarLinhasGerais(noticiasGerais);
    const linhasRegionais = montarLinhasRegionais(regiaoNoticias, mapaRegiaoIdPorChave);
    const todasAsLinhas = [...linhasGerais, ...linhasRegionais];

    console.log(`Importando ${todasAsLinhas.length} notícias (esperado: 72)...`);

    await cliente.query('BEGIN');
    for (const linha of todasAsLinhas) {
      await importarLinha(cliente, linha);
    }
    await cliente.query('COMMIT');

    console.log(`\nImportação concluída: ${todasAsLinhas.length} notícias processadas.`);
    console.log('Rode a consulta de validação (db/migrations/validar_importacao_noticias.sql) no Supabase pra conferir.');
  } catch (erro) {
    await cliente.query('ROLLBACK');
    console.error('\nErro durante a importação — nada foi salvo (rollback aplicado).');
    console.error(erro);
    process.exitCode = 1;
  } finally {
    cliente.release();
    await pool.end();
  }
}

main();
