// ============================================================================
// js/regioes-data.js
//
// Fonte única de dados das 5 regiões geográficas do Brasil — mesmo padrão
// que já usamos em js/biomas-data.js (window.BIOMAS) e js/noticias-data.js
// (window.NOTICIAS). Aqui é window.REGIOES.
//
// Usado em dois lugares:
//   1) regioes.html — o painel interativo com mapa + pílulas (js/regioes.js)
//   2) public/regioes/*.html — as páginas dedicadas de notícias de cada
//      região (js/noticias-regiao.js), uma tela cheia por região
//
// `bioma` aqui é a chave que liga a região ao filtro de bioma que já existe
// em noticias.html (window.NOTICIAS[].bioma) — é o que faz o botão
// "Explorar notícias" abrir a lista já filtrada pela região certa.
//
// ⚠️ `noticias` abaixo ainda é conteúdo de exemplo/placeholder (só usado
// pelo painel interativo de regioes.html). As páginas dedicadas novas não
// mostram essa lista — ainda não temos as notícias reais de cada região.
// ============================================================================

window.REGIOES = {
  norte: {
    id: 1,
    nome: 'Norte',
    apelido: 'Amazônia',
    bioma: 'Amazônia',
    imagem: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Amazonia.jpg',
    estados: 'Amazonas, Pará, Acre, Amapá, Rondônia, Roraima e Tocantins',
    descricao: 'Concentra a maior parte da floresta amazônica brasileira e a bacia hidrográfica mais volumosa do mundo.',
    heroLinha1: 'A força da Amazônia',
    heroLinha2: 'vive aqui',
    area: '3,85 milhões km²',
    populacao: '~ 18,4 milhões',
    frase: 'A Amazônia não é apenas uma floresta, é o nosso maior patrimônio natural.',
    destaques: [
      'Conheça os principais rios voadores da Amazônia',
      'A importância dos povos da floresta na preservação do bioma',
      'Espécies que dependem da floresta em pé para sobreviver'
    ],
    temas: ['Desmatamento', 'Rios voadores', 'Povos da floresta', 'Bioeconomia'],
    noticias: [
      { titulo: 'Novo sistema de monitoramento detecta alertas de desmatamento em 24 horas', tag: 'Desmatamento', data: '8 de agosto de 2026' },
      { titulo: 'Sensores instalados no dossel medem o pulso climático das florestas', tag: 'Clima', data: '29 de julho de 2026' }
    ]
  },
  nordeste: {
    id: 2,
    nome: 'Nordeste',
    apelido: 'Caatinga',
    bioma: 'Caatinga',
    imagem: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Paisagem_da_Caatinga_Paraibana.JPG',
    estados: 'Maranhão, Piauí, Ceará, Rio Grande do Norte, Paraíba, Pernambuco, Alagoas, Sergipe e Bahia',
    descricao: 'Único bioma exclusivamente brasileiro, a Caatinga é marcada pela vegetação adaptada à seca e por um ciclo de chuvas irregular.',
    heroLinha1: 'A resistência da Caatinga',
    heroLinha2: 'floresce aqui',
    area: '1,55 milhão km²',
    populacao: '~ 54,6 milhões',
    frase: 'A Caatinga prova que a vida encontra um jeito, mesmo na seca mais dura.',
    destaques: [
      'Como comunidades convivem com o semiárido há gerações',
      'Espécies endêmicas que só existem na Caatinga',
      'O potencial da energia solar no Nordeste brasileiro'
    ],
    temas: ['Seca', 'Convivência com o semiárido', 'Energia solar', 'Biodiversidade endêmica'],
    noticias: [
      { titulo: 'Bancos de sementes ajudam produtores a driblar períodos de estiagem', tag: 'Agricultura', data: '3 de agosto de 2026' },
      { titulo: 'Espécie de cacto endêmica é redescoberta após 15 anos', tag: 'Biodiversidade', data: '22 de julho de 2026' }
    ]
  },
  'centro-oeste': {
    id: 3,
    nome: 'Centro-Oeste',
    apelido: 'Cerrado & Pantanal',
    bioma: 'Cerrado',
    imagem: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cerrado_cajuzinho_fruto_t%C3%ADpico_da_culin%C3%A1ria_de_goi%C3%A1s_com_serra_dourada_ao_fundo.JPG',
    estados: 'Mato Grosso, Mato Grosso do Sul, Goiás e Distrito Federal',
    descricao: 'Berço das águas do Brasil, reúne o Cerrado — savana mais biodiversa do mundo — e boa parte do Pantanal.',
    heroLinha1: 'O berço das águas do Brasil',
    heroLinha2: 'nasce aqui',
    area: '1,61 milhão km²',
    populacao: '~ 16,3 milhões',
    frase: 'O Cerrado é a caixa d\u2019água do Brasil — protegê-lo é proteger todos os outros biomas.',
    destaques: [
      'Por que o Cerrado é chamado de "berço das águas"',
      'Como o Pantanal se recupera após temporadas de queimadas',
      'Corredores ecológicos conectam fragmentos de savana'
    ],
    temas: ['Agropecuária', 'Nascentes', 'Queimadas', 'Pantanal'],
    noticias: [
      { titulo: 'Corredores ecológicos ligam fragmentos de Cerrado no entorno de fazendas', tag: 'Conservação', data: '5 de agosto de 2026' },
      { titulo: 'Monitoramento por satélite acompanha nível de alagamento do Pantanal', tag: 'Tecnologia', data: '18 de julho de 2026' }
    ]
  },
  sudeste: {
    id: 4,
    nome: 'Sudeste',
    apelido: 'Mata Atlântica',
    bioma: 'Mata Atlântica',
    imagem: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mata_atlantica_parte_baixa_Itatiaia.jpg',
    estados: 'São Paulo, Rio de Janeiro, Minas Gerais e Espírito Santo',
    descricao: 'Região mais urbanizada do país, ainda guarda remanescentes importantes de Mata Atlântica em serras e parques costeiros.',
    heroLinha1: 'A Mata Atlântica resiste',
    heroLinha2: 'entre as cidades',
    area: '924 mil km²',
    populacao: '~ 84,8 milhões',
    frase: 'Mesmo cercada de concreto, a Mata Atlântica segue abastecendo as maiores cidades do país.',
    destaques: [
      'Como nascentes urbanas ainda abastecem grandes cidades',
      'Espécies raras que retornam a corredores de serra restaurados',
      'O que restou da maior floresta costeira das Américas'
    ],
    temas: ['Mata Atlântica', 'Recuperação florestal', 'Recursos hídricos', 'Áreas urbanas'],
    noticias: [
      { titulo: 'Mutirão de replantio recupera nascente que abastece região metropolitana', tag: 'Água', data: '7 de agosto de 2026' },
      { titulo: 'Corredor de serra registra retorno de espécie de ave rara', tag: 'Biodiversidade', data: '30 de julho de 2026' }
    ]
  },
  sul: {
    id: 5,
    nome: 'Sul',
    apelido: 'Pampa & Araucárias',
    bioma: 'Pampa',
    imagem: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/PC100017.JPG',
    estados: 'Paraná, Santa Catarina e Rio Grande do Sul',
    descricao: 'Reúne remanescentes de Mata Atlântica ao norte e as paisagens abertas do Pampa ao sul, na fronteira com o Uruguai e a Argentina.',
    heroLinha1: 'Os campos do Pampa',
    heroLinha2: 'se estendem aqui',
    area: '577 mil km²',
    populacao: '~ 30,2 milhões',
    frase: 'O Pampa mostra que paisagem aberta também é natureza — e também precisa de cuidado.',
    destaques: [
      'Manejo que preserva os campos nativos do Pampa',
      'Projetos que reintroduzem araucárias em áreas protegidas',
      'O clima subtropical e seus efeitos na biodiversidade local'
    ],
    temas: ['Pampa', 'Araucárias', 'Clima subtropical', 'Pecuária extensiva'],
    noticias: [
      { titulo: 'Produtores testam manejo que preserva campos nativos do Pampa', tag: 'Pecuária', data: '4 de agosto de 2026' },
      { titulo: 'Projeto reflorestamento reintroduz araucárias em área de proteção', tag: 'Reflorestamento', data: '21 de julho de 2026' }
    ]
  }
};
