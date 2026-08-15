// ATENÇÃO: os dados abaixo são de exemplo (placeholder).
// Quando o backend tiver uma rota tipo /api/regioes/:id/detalhes
// (ou algo parecido, com bioma/temas/notícias), este objeto deve
// ser substituído por um fetch() real. Por enquanto, os "ids" abaixo
// já seguem a ordem da tabela `regiao` no banco, pra facilitar a troca depois.

const dadosRegioes = {
  norte: {
    id: 1,
    nome: 'Norte',
    imagem: 'assets/biomas/bioma-amazonia.jpg',
    estados: 'Amazonas, Pará, Acre, Amapá, Rondônia, Roraima e Tocantins',
    descricao: 'Concentra a maior parte da floresta amazônica brasileira e a bacia hidrográfica mais volumosa do mundo.',
    temas: ['Desmatamento', 'Rios voadores', 'Povos da floresta', 'Bioeconomia'],
    noticias: [
      { titulo: 'Novo sistema de monitoramento detecta alertas de desmatamento em 24 horas', tag: 'Desmatamento', data: '8 de agosto de 2026' },
      { titulo: 'Sensores instalados no dossel medem o pulso climático das florestas', tag: 'Clima', data: '29 de julho de 2026' }
    ]
  },
  nordeste: {
    id: 2,
    nome: 'Nordeste',
    imagem: 'assets/biomas/bioma-caatinga.jpg',
    estados: 'Maranhão, Piauí, Ceará, Rio Grande do Norte, Paraíba, Pernambuco, Alagoas, Sergipe e Bahia',
    descricao: 'Único bioma exclusivamente brasileiro, a Caatinga é marcada pela vegetação adaptada à seca e por um ciclo de chuvas irregular.',
    temas: ['Seca', 'Convivência com o semiárido', 'Energia solar', 'Biodiversidade endêmica'],
    noticias: [
      { titulo: 'Bancos de sementes ajudam produtores a driblar períodos de estiagem', tag: 'Agricultura', data: '3 de agosto de 2026' },
      { titulo: 'Espécie de cacto endêmica é redescoberta após 15 anos', tag: 'Biodiversidade', data: '22 de julho de 2026' }
    ]
  },
  'centro-oeste': {
    id: 3,
    nome: 'Centro-Oeste',
    imagem: 'assets/biomas/bioma-cerrado.jpg',
    estados: 'Mato Grosso, Mato Grosso do Sul, Goiás e Distrito Federal',
    descricao: 'Berço das águas do Brasil, reúne o Cerrado — savana mais biodiversa do mundo — e boa parte do Pantanal.',
    temas: ['Agropecuária', 'Nascentes', 'Queimadas', 'Pantanal'],
    noticias: [
      { titulo: 'Corredores ecológicos ligam fragmentos de Cerrado no entorno de fazendas', tag: 'Conservação', data: '5 de agosto de 2026' },
      { titulo: 'Monitoramento por satélite acompanha nível de alagamento do Pantanal', tag: 'Tecnologia', data: '18 de julho de 2026' }
    ]
  },
  sudeste: {
    id: 4,
    nome: 'Sudeste',
    imagem: 'assets/biomas/bioma-mata-atlantica.jpg',
    estados: 'São Paulo, Rio de Janeiro, Minas Gerais e Espírito Santo',
    descricao: 'Região mais urbanizada do país, ainda guarda remanescentes importantes de Mata Atlântica em serras e parques costeiros.',
    temas: ['Mata Atlântica', 'Recuperação florestal', 'Recursos hídricos', 'Áreas urbanas'],
    noticias: [
      { titulo: 'Mutirão de replantio recupera nascente que abastece região metropolitana', tag: 'Água', data: '7 de agosto de 2026' },
      { titulo: 'Corredor de serra registra retorno de espécie de ave rara', tag: 'Biodiversidade', data: '30 de julho de 2026' }
    ]
  },
  sul: {
    id: 5,
    nome: 'Sul',
    imagem: 'assets/biomas/bioma-pampa.jpg',
    estados: 'Paraná, Santa Catarina e Rio Grande do Sul',
    descricao: 'Reúne remanescentes de Mata Atlântica ao norte e as paisagens abertas do Pampa ao sul, na fronteira com o Uruguai e a Argentina.',
    temas: ['Pampa', 'Araucárias', 'Clima subtropical', 'Pecuária extensiva'],
    noticias: [
      { titulo: 'Produtores testam manejo que preserva campos nativos do Pampa', tag: 'Pecuária', data: '4 de agosto de 2026' },
      { titulo: 'Projeto reflorestamento reintroduz araucárias em área de proteção', tag: 'Reflorestamento', data: '21 de julho de 2026' }
    ]
  }
};

// Pinta o conteúdo do painel da direita com os dados da região recebida
function renderizarRegiao(chave) {
  const regiao = dadosRegioes[chave];
  if (!regiao) return;

  const painel = document.querySelector('.painel-regiao');

  const temasHtml = regiao.temas
    .map(tema => `<span class="tag">${tema}</span>`)
    .join('');

  const noticiasHtml = regiao.noticias
    .map(n => `
      <a href="#" class="item-noticia-regiao">
        <h4>${n.titulo}</h4>
        <div class="meta">${n.tag} · ${n.data}</div>
      </a>
    `)
    .join('');

  painel.innerHTML = `
    <img src="${regiao.imagem}" alt="Paisagem característica da região ${regiao.nome}">
    <div class="tag">REGIÃO</div>
    <h2>${regiao.nome}</h2>
    <p class="painel-estados">${regiao.estados}</p>
    <p class="painel-descricao">${regiao.descricao}</p>

    <h3 class="painel-subtitulo">Temas ambientais</h3>
    <div class="lista-temas">${temasHtml}</div>

    <h3 class="painel-subtitulo">Notícias da região</h3>
    <div class="lista-noticias-regiao">${noticiasHtml}</div>

    <div class="painel-botoes">
      <a href="noticias.html?regiao=${regiao.id}" class="botao botao-primario">Explorar notícias →</a>
      <a href="girabot.html" class="botao botao-secundario">Perguntar ao GiraBot →</a>
    </div>
  `;
}

// Marca visualmente qual botão de região está ativo
function marcarBotaoAtivo(botaoClicado) {
  document.querySelectorAll('.pill-regiao').forEach(botao => {
    botao.classList.remove('ativo');
  });
  botaoClicado.classList.add('ativo');
}

// Liga o clique de cada botão de região à troca do painel
document.querySelectorAll('.pill-regiao').forEach(botao => {
  botao.addEventListener('click', () => {
    const chave = botao.dataset.regiao;
    renderizarRegiao(chave);
    marcarBotaoAtivo(botao);
  });
});

// Região exibida por padrão ao carregar a página
renderizarRegiao('norte');
