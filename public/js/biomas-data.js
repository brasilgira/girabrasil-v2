// ==========================================================================
// GiraBrasil — Dados dos biomas
// Fonte única de conteúdo para a página /biomas/<slug>.html.
// Cada objeto aqui alimenta o mesmo template (js/biomas.js), então adicionar
// ou editar um bioma não exige criar HTML novo — só editar os dados abaixo.
// ==========================================================================

const BIOMAS = {

  amazonia: {
    slug: 'amazonia',
    nome: 'Amazônia',
    subtitulo: 'A maior floresta tropical do planeta.',
    categoria: 'BIOMA BRASILEIRO',
    localizacao: 'Norte do Brasil',
    corDestaque: '#2E6B44',
    heroImagem: '../assets/biomas/bioma-amazonia.jpg',
    descricao: 'Cobrindo cerca de 49% do território brasileiro, a Amazônia é a maior floresta tropical contínua do mundo e concentra a maior diversidade biológica já registrada em um único bioma.',

    stats: [
      { label: 'Área', valor: '4,2 milhões km²', detalhe: 'no território brasileiro' },
      { label: 'Biodiversidade', valor: '+40 mil', detalhe: 'espécies de plantas catalogadas' },
      { label: 'Clima', valor: 'Equatorial', detalhe: 'quente e úmido o ano todo' },
      { label: 'Região', valor: 'Norte', detalhe: 'do Brasil' }
    ],

    mapaDestaque: ['norte'],

    linhaDoTempo: [
      { periodo: 'Dezenas de milhões de anos atrás', titulo: 'Formação geológica', texto: 'A bacia amazônica se forma a partir de soerguimentos e mudanças no curso de rios, criando as condições para uma floresta tropical extensa e estável.' },
      { periodo: 'Milhões de anos atrás', titulo: 'Transformações climáticas', texto: 'Ciclos de clima mais úmido e mais seco alternam períodos de expansão e retração da floresta, favorecendo a diversificação de espécies.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Expansão da vegetação', texto: 'A floresta tropical densa se estabelece na configuração próxima da atual, com múltiplos estratos de vegetação e altíssima diversidade de árvores.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Adaptação das espécies', texto: 'Fauna e flora desenvolvem relações de dependência complexas, da polinização à dispersão de sementes por animais.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Presença humana', texto: 'Povos indígenas ocupam a região há milênios, desenvolvendo formas de manejo florestal que moldam parte da paisagem até hoje.' },
      { periodo: 'Presente', titulo: 'Desafios atuais', texto: 'Desmatamento, queimadas e mudanças climáticas colocam em risco o equilíbrio construído ao longo de milhões de anos.' }
    ],

    passadoPresenteFuturo: {
      passado: 'Por milhões de anos, ciclos climáticos moldaram a extensão e a composição da floresta, permitindo que ela se tornasse o bioma mais biodiverso do planeta.',
      presente: 'Hoje a Amazônia ainda é amplamente florestada, mas enfrenta desmatamento concentrado no chamado "arco do desmatamento", ao sul e sudeste da floresta.',
      futuro: 'Cientistas apontam que, dependendo do ritmo de desmatamento e das mudanças climáticas, partes da floresta podem perder capacidade de se regenerar. Ações de conservação e fiscalização podem reverter essa trajetória.'
    },

    fauna: [
      { nome: 'Onça-pintada', cientifico: 'Panthera onca', desc: 'O maior felino das Américas e um dos principais predadores da floresta.', status: 'Quase Ameaçada', curiosidade: 'Tem a mordida mais forte, proporcionalmente, entre os grandes felinos.', habitat: 'Florestas densas próximas a rios e igarapés.', dieta: 'Carnívora — caça capivaras, jacarés, veados e outros mamíferos.', papel: 'Como predador de topo, ajuda a regular as populações de herbívoros.' },
      { nome: 'Boto-cor-de-rosa', cientifico: 'Inia geoffrensis', desc: 'Golfinho de água doce símbolo dos rios amazônicos.', status: 'Em Perigo', curiosidade: 'Sua coloração rosada pode variar com a idade e o comportamento do animal.', habitat: 'Rios, igarapés e lagos de várzea.', dieta: 'Peixes diversos, incluindo espécies de fundo.', papel: 'Indicador da saúde dos ecossistemas aquáticos amazônicos.' },
      { nome: 'Arara-azul-grande', cientifico: 'Anodorhynchus hyacinthinus', desc: 'A maior espécie de arara do mundo, com plumagem azul intensa.', status: 'Quase Ameaçada', curiosidade: 'Depende de palmeiras específicas tanto para se alimentar quanto para nidificar.', habitat: 'Florestas abertas e áreas de palmeiras.', dieta: 'Frutos e sementes de palmeiras, especialmente coco-babaçu e bocaiúva.', papel: 'Dispersora de sementes de palmeiras nativas.' },
      { nome: 'Preguiça-de-três-dedos', cientifico: 'Bradypus tridactylus', desc: 'Mamífero de movimentos extremamente lentos adaptado à vida nas copas das árvores.', status: 'Pouco Preocupante', curiosidade: 'Pode levar cerca de um mês para digerir uma única folha.', habitat: 'Dossel florestal.', dieta: 'Folhas, brotos e frutos.', papel: 'Sua pelagem abriga algas e insetos, formando um pequeno ecossistema próprio.' },
      { nome: 'Peixe-boi-da-amazônia', cientifico: 'Trichechus inunguis', desc: 'Único mamífero aquático herbívoro exclusivamente de água doce do mundo.', status: 'Vulnerável', curiosidade: 'Pode passar até 20 minutos sem respirar na superfície.', habitat: 'Rios e lagos de água doce.', dieta: 'Plantas aquáticas.', papel: 'Ajuda a controlar a vegetação aquática dos rios onde vive.' },
      { nome: 'Mico-leão-dourado', cientifico: 'Leontopithecus rosalia', desc: 'Pequeno primata de pelagem dourada, símbolo de conservação no Brasil.', status: 'Em Perigo', curiosidade: 'Vive em pequenos grupos familiares com forte cooperação no cuidado dos filhotes.', habitat: 'Fragmentos de floresta com dossel denso.', dieta: 'Frutas, insetos e pequenos vertebrados.', papel: 'Dispersor de sementes e controlador de populações de insetos.' }
    ],

    flora: [
      { nome: 'Castanheira-do-pará', cientifico: 'Bertholletia excelsa', papel: 'Árvore de grande porte que pode viver centenas de anos.', curiosidade: 'Depende de abelhas específicas para ser polinizada e de um pequeno roedor, a cutia, para dispersar suas sementes.' },
      { nome: 'Vitória-régia', cientifico: 'Victoria amazonica', papel: 'Planta aquática com as maiores folhas flutuantes do mundo.', curiosidade: 'Suas folhas podem suportar dezenas de quilos de peso distribuído sobre a superfície.' },
      { nome: 'Seringueira', cientifico: 'Hevea brasiliensis', papel: 'Árvore nativa da qual se extrai o látex natural.', curiosidade: 'Foi a base econômica do "ciclo da borracha" na Amazônia, entre o final do século 19 e início do século 20.' },
      { nome: 'Açaizeiro', cientifico: 'Euterpe oleracea', papel: 'Palmeira típica de áreas alagadas, base alimentar de comunidades ribeirinhas.', curiosidade: 'Um mesmo cacho pode produzir centenas de frutos, colhidos manualmente por extrativistas.' },
      { nome: 'Sumaúma', cientifico: 'Ceiba pentandra', papel: 'Uma das maiores árvores da floresta, com raízes tabulares extensas.', curiosidade: 'É considerada sagrada por diversos povos indígenas da região amazônica.' }
    ],

    redeDeVida: {
      produtores: ['Sumaúma', 'Castanheira-do-pará', 'Vitória-régia'],
      herbivoros: ['Preguiça-de-três-dedos', 'Peixe-boi-da-amazônia', 'Arara-azul-grande'],
      predadores: ['Onça-pintada', 'Boto-cor-de-rosa'],
      decompositores: ['Fungos e cupins do solo da floresta']
    },

    ameacas: [
      { icone: '🪓', titulo: 'Desmatamento', texto: 'Conversão de área florestal em pastagens e áreas de cultivo, concentrada no arco do desmatamento.' },
      { icone: '🔥', titulo: 'Queimadas', texto: 'Frequentemente usadas para limpeza de terreno, podem fugir de controle em períodos de seca.' },
      { icone: '🧩', titulo: 'Fragmentação de habitat', texto: 'Estradas e áreas abertas isolam populações de fauna e flora, reduzindo a resiliência dos ecossistemas.' },
      { icone: '🌡️', titulo: 'Mudanças climáticas', texto: 'Alterações no regime de chuvas podem comprometer o próprio ciclo hidrológico que a floresta ajuda a manter.' }
    ],

    serHumano: {
      texto: 'A Amazônia é lar de centenas de povos indígenas e comunidades ribeirinhas e extrativistas, cujo conhecimento tradicional sobre manejo florestal, plantas medicinais e uso sustentável dos recursos é reconhecido internacionalmente. Cidades como Manaus e Belém também dependem diretamente da floresta e dos rios para economia, transporte e cultura.',
      pontos: ['Povos indígenas e conhecimento tradicional', 'Comunidades ribeirinhas e extrativismo', 'Economia baseada em açaí, castanha e madeira certificada', 'Rios como principal via de transporte']
    },

    conservacao: [
      { icone: '🌳', titulo: 'Unidades de conservação', texto: 'Parques e reservas protegem legalmente grandes extensões de floresta.' },
      { icone: '🛰️', titulo: 'Monitoramento por satélite', texto: 'Tecnologia de sensoriamento remoto ajuda a identificar desmatamento em tempo real.' },
      { icone: '🌱', titulo: 'Cadeias produtivas sustentáveis', texto: 'Produtos como açaí e castanha geram renda sem exigir a derrubada da floresta.' },
      { icone: '📚', titulo: 'Educação ambiental', texto: 'Projetos como este ajudam a aproximar mais pessoas da realidade da floresta.' }
    ],

    curiosidades: [
      'A Amazônia produz "rios voadores": grandes volumes de vapor de água que se deslocam pela atmosfera e influenciam o clima de boa parte da América do Sul.',
      'Estima-se que a bacia amazônica abrigue cerca de um quinto de toda a água doce superficial do planeta.',
      'Uma única árvore da floresta pode abrigar centenas de espécies de insetos.',
      'A Amazônia se estende por nove países, mas a maior parte está em território brasileiro.',
      'Muitos remédios modernos têm origem em substâncias descobertas em plantas amazônicas.'
    ],

    perfilVisual: {
      clima: 'Equatorial quente e úmido',
      vegetacao: 'Floresta tropical densa, multiestratificada',
      fauna: 'Altíssima diversidade de mamíferos, aves, peixes e insetos',
      flora: 'Uma das maiores diversidades vegetais do planeta',
      agua: 'Maior bacia hidrográfica do mundo',
      presencaHumana: 'Povos indígenas, comunidades ribeirinhas e centros urbanos',
      pressoesAmbientais: 'Alta — desmatamento e queimadas'
    },

    som: { label: 'Sons da floresta amazônica', descricao: 'aves, insetos e chuva na copa das árvores' },

    relacionados: ['cerrado', 'pantanal']
  },

  cerrado: {
    slug: 'cerrado',
    nome: 'Cerrado',
    subtitulo: 'A savana mais biodiversa do mundo.',
    categoria: 'BIOMA BRASILEIRO',
    localizacao: 'Centro do Brasil',
    corDestaque: '#B5652E',
    heroImagem: '../assets/biomas/bioma-cerrado.jpg',
    descricao: 'Conhecido como o "berço das águas" do Brasil, o Cerrado alimenta oito das doze grandes bacias hidrográficas do país e é considerado a savana tropical mais biodiversa do planeta.',

    stats: [
      { label: 'Área', valor: '2 milhões km²', detalhe: 'cerca de 22% do território brasileiro' },
      { label: 'Biodiversidade', valor: '+11 mil', detalhe: 'espécies de plantas catalogadas' },
      { label: 'Clima', valor: 'Tropical sazonal', detalhe: 'estação seca e chuvosa bem definidas' },
      { label: 'Região', valor: 'Centro-Oeste', detalhe: 'com trechos em outras regiões' }
    ],

    mapaDestaque: ['centro-oeste'],

    linhaDoTempo: [
      { periodo: 'Dezenas de milhões de anos atrás', titulo: 'Formação geológica', texto: 'Um planalto antigo e solos profundos e ácidos criam as condições para uma vegetação adaptada a longos períodos de seca.' },
      { periodo: 'Milhões de anos atrás', titulo: 'Transformações climáticas', texto: 'Ciclos climáticos mais secos favorecem espécies de raízes profundas e cascas grossas, resistentes ao fogo natural.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Expansão da vegetação', texto: 'Formam-se as fitofisionomias características do Cerrado: campo limpo, campo sujo, cerrado sentido restrito e matas de galeria ao longo dos rios.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Adaptação das espécies', texto: 'A fauna desenvolve estratégias específicas para lidar com a estação seca prolongada e o fogo periódico.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Presença humana', texto: 'Povos indígenas ocupam a região há milênios, utilizando o fogo de forma controlada como parte do manejo tradicional da paisagem.' },
      { periodo: 'Presente', titulo: 'Desafios atuais', texto: 'A expansão da agropecuária tornou o Cerrado um dos biomas brasileiros mais transformados pela ocupação humana.' }
    ],

    passadoPresenteFuturo: {
      passado: 'Moldado por longos ciclos de seca e fogo natural, o Cerrado desenvolveu uma vegetação única, com raízes profundas capazes de acessar água em grande profundidade.',
      presente: 'Hoje o bioma é uma das principais regiões agrícolas do Brasil, com boa parte de sua vegetação nativa já convertida em lavouras e pastagens.',
      futuro: 'A proporção de área nativa restante depende diretamente do equilíbrio entre expansão agrícola e políticas de conservação, especialmente por seu papel como "caixa d\'água" do país.'
    },

    fauna: [
      { nome: 'Lobo-guará', cientifico: 'Chrysocyon brachyurus', desc: 'O maior canídeo da América do Sul, com pernas longas adaptadas aos campos abertos.', status: 'Quase Ameaçada', curiosidade: 'Tem hábitos onívoros e come mais frutas do que a maioria dos canídeos silvestres.', habitat: 'Campos abertos e cerrado sentido restrito.', dieta: 'Pequenos mamíferos, aves, insetos e frutas, especialmente a lobeira.', papel: 'Dispersor de sementes de diversas plantas do Cerrado.' },
      { nome: 'Tamanduá-bandeira', cientifico: 'Myrmecophaga tridactyla', desc: 'Mamífero especializado na alimentação de formigas e cupins.', status: 'Vulnerável', curiosidade: 'Pode consumir milhares de insetos em um único dia usando sua língua longa e pegajosa.', habitat: 'Campos, cerrado e áreas abertas.', dieta: 'Formigas e cupins.', papel: 'Ajuda a controlar populações de insetos sociais.' },
      { nome: 'Ema', cientifico: 'Rhea americana', desc: 'A maior ave nativa do Brasil, não voadora e adaptada aos campos abertos.', status: 'Quase Ameaçada', curiosidade: 'Os machos são responsáveis por incubar os ovos e cuidar dos filhotes.', habitat: 'Campos abertos e áreas de vegetação rasteira.', dieta: 'Onívora — folhas, sementes, insetos e pequenos vertebrados.', papel: 'Dispersora de sementes de diversas plantas do Cerrado.' },
      { nome: 'Tatu-canastra', cientifico: 'Priodontes maximus', desc: 'O maior tatu do mundo, com hábitos noturnos e escavadores.', status: 'Vulnerável', curiosidade: 'Suas tocas abandonadas servem de abrigo para dezenas de outras espécies.', habitat: 'Cerrado e áreas de solo propício à escavação.', dieta: 'Principalmente cupins e formigas.', papel: 'Espécie-engenheira: suas tocas criam microhabitats para outros animais.' },
      { nome: 'Seriema', cientifico: 'Cariama cristata', desc: 'Ave terrestre de pernas longas, conhecida pelo canto alto e característico.', status: 'Pouco Preocupante', curiosidade: 'Prefere correr a voar, alcançando boa velocidade nos campos abertos.', habitat: 'Campos e áreas abertas do Cerrado.', dieta: 'Insetos, pequenos répteis e roedores.', papel: 'Predadora que ajuda a controlar populações de répteis e roedores.' },
      { nome: 'Onça-parda (suçuarana)', cientifico: 'Puma concolor', desc: 'Grande felino de ampla distribuição, presente também no Cerrado.', status: 'Pouco Preocupante', curiosidade: 'É o segundo maior felino das Américas, atrás apenas da onça-pintada.', habitat: 'Cerrado, matas de galeria e áreas de transição.', dieta: 'Veados, capivaras e outros mamíferos de médio porte.', papel: 'Predador de topo que regula populações de herbívoros.' }
    ],

    flora: [
      { nome: 'Ipê-amarelo', cientifico: 'Handroanthus albus', papel: 'Árvore símbolo do Cerrado, floresce intensamente durante a estação seca.', curiosidade: 'Perde todas as folhas antes de florescer, deixando a copa completamente amarela.' },
      { nome: 'Pequizeiro', cientifico: 'Caryocar brasiliense', papel: 'Árvore cujo fruto, o pequi, é base de pratos tradicionais do Centro-Oeste.', curiosidade: 'A polpa envolve um caroço coberto de espinhos finos, que exige cuidado ao consumir.' },
      { nome: 'Buriti', cientifico: 'Mauritia flexuosa', papel: 'Palmeira típica das veredas, áreas úmidas do Cerrado.', curiosidade: 'É considerada uma "árvore da vida" para comunidades tradicionais, que aproveitam quase todas as suas partes.' },
      { nome: 'Lobeira', cientifico: 'Solanum lycocarpum', papel: 'Arbusto cujo fruto é um dos principais alimentos do lobo-guará.', curiosidade: 'Seu nome popular vem justamente da relação estreita com o lobo-guará.' },
      { nome: 'Barbatimão', cientifico: 'Stryphnodendron adstringens', papel: 'Árvore de casca grossa, historicamente usada na medicina popular do Cerrado.', curiosidade: 'Sua casca é rica em taninos, substâncias usadas tradicionalmente por suas propriedades adstringentes.' }
    ],

    redeDeVida: {
      produtores: ['Pequizeiro', 'Buriti', 'Ipê-amarelo'],
      herbivoros: ['Ema', 'Tatu-canastra', 'Tamanduá-bandeira'],
      predadores: ['Lobo-guará', 'Onça-parda (suçuarana)'],
      decompositores: ['Cupins e fungos do solo do Cerrado']
    },

    ameacas: [
      { icone: '🚜', titulo: 'Expansão agropecuária', texto: 'Conversão de vegetação nativa em lavouras e pastagens é a principal pressão sobre o bioma.' },
      { icone: '🔥', titulo: 'Queimadas fora de controle', texto: 'Embora o fogo seja natural no Cerrado, incêndios fora do regime natural degradam o ecossistema.' },
      { icone: '💧', titulo: 'Pressão sobre nascentes', texto: 'Como "berço das águas", a perda de vegetação nativa afeta diretamente a recarga de aquíferos e rios.' },
      { icone: '🧩', titulo: 'Fragmentação de habitat', texto: 'Áreas de vegetação nativa cada vez mais isoladas dificultam o deslocamento da fauna.' }
    ],

    serHumano: {
      texto: 'O Cerrado abriga comunidades quilombolas, povos indígenas e populações tradicionais, como os geraizeiros e vazanteiros, cujos modos de vida dependem diretamente do extrativismo sustentável de frutos nativos como pequi, buriti e baru. É também uma das principais regiões produtoras de grãos do Brasil.',
      pontos: ['Comunidades tradicionais e extrativismo de frutos nativos', 'Uma das principais regiões agrícolas do país', 'Papel central no abastecimento de água de várias bacias', 'Culinária regional baseada em espécies nativas']
    },

    conservacao: [
      { icone: '🌳', titulo: 'Unidades de conservação', texto: 'Parques nacionais protegem amostras representativas da vegetação nativa.' },
      { icone: '🌾', titulo: 'Agricultura de baixo impacto', texto: 'Técnicas que aumentam a produtividade em áreas já abertas reduzem a pressão por novas derrubadas.' },
      { icone: '🫐', titulo: 'Valorização do extrativismo', texto: 'Cadeias produtivas de frutos nativos geram renda sem exigir desmatamento.' },
      { icone: '🔥', titulo: 'Manejo integrado do fogo', texto: 'Uso controlado do fogo, inspirado em práticas tradicionais, ajuda a prevenir incêndios descontrolados.' }
    ],

    curiosidades: [
      'O Cerrado é considerado a savana mais biodiversa do mundo, com altíssima taxa de espécies endêmicas.',
      'Suas raízes profundas — algumas árvores têm raízes maiores que a própria copa — ajudam a captar água em camadas profundas do solo.',
      'O bioma alimenta oito das doze principais bacias hidrográficas do Brasil.',
      'Muitas plantas do Cerrado têm casca grossa como adaptação natural ao fogo periódico.',
      'O pequi e o buriti são a base de pratos típicos de todo o Centro-Oeste brasileiro.'
    ],

    perfilVisual: {
      clima: 'Tropical sazonal, com seca bem marcada',
      vegetacao: 'Savana tropical, de campos abertos a matas de galeria',
      fauna: 'Alta diversidade, com muitas espécies endêmicas',
      flora: 'Vegetação adaptada ao fogo e à seca prolongada',
      agua: 'Nascentes de oito das doze grandes bacias do país',
      presencaHumana: 'Comunidades tradicionais e forte atividade agrícola',
      pressoesAmbientais: 'Muito alta — expansão agropecuária'
    },

    som: { label: 'Sons do Cerrado', descricao: 'vento nos campos abertos e aves típicas da savana' },

    relacionados: ['caatinga', 'pantanal']
  },

  caatinga: {
    slug: 'caatinga',
    nome: 'Caatinga',
    subtitulo: 'O único bioma exclusivamente brasileiro.',
    categoria: 'BIOMA BRASILEIRO',
    localizacao: 'Nordeste do Brasil',
    corDestaque: '#C08A3E',
    heroImagem: '../assets/biomas/bioma-caatinga.jpg',
    descricao: 'Adaptada a longos períodos de seca, a Caatinga floresce rapidamente após a chuva. É o único bioma inteiramente brasileiro, não compartilhado com nenhum outro país.',

    stats: [
      { label: 'Área', valor: '844 mil km²', detalhe: 'cerca de 10% do território brasileiro' },
      { label: 'Biodiversidade', valor: '+3 mil', detalhe: 'espécies vegetais catalogadas' },
      { label: 'Clima', valor: 'Semiárido', detalhe: 'chuvas escassas e irregulares' },
      { label: 'Região', valor: 'Nordeste', detalhe: 'do Brasil' }
    ],

    mapaDestaque: ['nordeste'],

    linhaDoTempo: [
      { periodo: 'Dezenas de milhões de anos atrás', titulo: 'Formação geológica', texto: 'Solos rasos e pedregosos, associados a um regime de chuvas escasso, criam as bases para uma vegetação adaptada à seca extrema.' },
      { periodo: 'Milhões de anos atrás', titulo: 'Transformações climáticas', texto: 'Ciclos de aridez favorecem espécies capazes de perder folhas e armazenar água, como cactos e árvores caducifólias.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Expansão da vegetação', texto: 'Formam-se as paisagens características da Caatinga, com vegetação espinhosa e grande capacidade de resposta rápida à chuva.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Adaptação das espécies', texto: 'A fauna desenvolve estratégias específicas de sobrevivência à seca, como hibernação e comportamento noturno.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Presença humana', texto: 'Povos indígenas e, mais tarde, comunidades sertanejas desenvolvem técnicas de convivência com o semiárido, como cisternas e agricultura adaptada.' },
      { periodo: 'Presente', titulo: 'Desafios atuais', texto: 'Desmatamento para produção de carvão e expansão agropecuária, combinados à mudança climática, aumentam o risco de desertificação em algumas áreas.' }
    ],

    passadoPresenteFuturo: {
      passado: 'Moldada por milênios de clima semiárido, a Caatinga desenvolveu espécies únicas, capazes de suportar longos períodos sem chuva.',
      presente: 'Hoje o bioma é um dos menos protegidos do Brasil em termos de unidades de conservação, apesar de sua rica biodiversidade endêmica.',
      futuro: 'Projeções indicam que o aumento de temperatura e a redução de chuvas podem intensificar processos de desertificação em áreas mais vulneráveis, tornando programas de convivência com o semiárido ainda mais importantes.'
    },

    fauna: [
      { nome: 'Ararinha-azul', cientifico: 'Cyanopsitta spixii', desc: 'Pequena arara extinta na natureza, hoje alvo de projetos de reintrodução.', status: 'Extinta na Natureza', curiosidade: 'Ficou mundialmente conhecida após inspirar um filme de animação.', habitat: 'Matas ciliares associadas a árvores de caraibeira.', dieta: 'Sementes e frutos de espécies nativas.', papel: 'Símbolo dos esforços de conservação e reintrodução de espécies no Brasil.' },
      { nome: 'Veado-catingueiro', cientifico: 'Mazama gouazoubira', desc: 'Pequeno cervídeo bem adaptado às condições secas da Caatinga.', status: 'Pouco Preocupante', curiosidade: 'Consegue obter boa parte da água de que precisa a partir da vegetação que consome.', habitat: 'Vegetação arbustiva e áreas de mata seca.', dieta: 'Folhas, frutos e brotos.', papel: 'Dispersor de sementes de plantas nativas.' },
      { nome: 'Asa-branca', cientifico: 'Patagioenas picazuro', desc: 'Ave símbolo do imaginário nordestino, associada ao período de seca.', status: 'Pouco Preocupante', curiosidade: 'Foi imortalizada na música popular brasileira como símbolo da migração em busca de água.', habitat: 'Áreas abertas e de vegetação arbustiva.', dieta: 'Sementes e frutos.', papel: 'Dispersora de sementes de plantas da Caatinga.' },
      { nome: 'Tatu-peba', cientifico: 'Euphractus sexcinctus', desc: 'Tatu de hábitos onívoros, bem adaptado a ambientes secos.', status: 'Pouco Preocupante', curiosidade: 'Cava tocas que depois servem de abrigo para outras espécies pequenas.', habitat: 'Áreas abertas e solos propícios à escavação.', dieta: 'Onívora — insetos, pequenos vertebrados, frutos e raízes.', papel: 'Suas tocas funcionam como microhabitats para outras espécies.' },
      { nome: 'Preá', cientifico: 'Galea spixii', desc: 'Pequeno roedor típico da Caatinga, presa importante na cadeia alimentar local.', status: 'Pouco Preocupante', curiosidade: 'Vive em grupos e é bastante ágil para escapar de predadores.', habitat: 'Vegetação rasteira e arbustiva.', dieta: 'Herbívoro — gramíneas e vegetação rasteira.', papel: 'Presa-chave para diversos predadores da Caatinga.' },
      { nome: 'Gato-do-mato', cientifico: 'Leopardus tigrinus', desc: 'Pequeno felino selvagem presente em diversos biomas brasileiros, incluindo a Caatinga.', status: 'Vulnerável', curiosidade: 'É do tamanho aproximado de um gato doméstico, mas com hábitos totalmente selvagens.', habitat: 'Áreas de vegetação arbustiva e mata seca.', dieta: 'Pequenos mamíferos, aves e répteis.', papel: 'Predador que ajuda a controlar populações de roedores.' }
    ],

    flora: [
      { nome: 'Mandacaru', cientifico: 'Cereus jamacaru', papel: 'Cacto colunar símbolo da paisagem da Caatinga.', curiosidade: 'Armazena água em seu tecido interno, permitindo sobreviver a longos períodos de seca.' },
      { nome: 'Umbuzeiro', cientifico: 'Spondias tuberosa', papel: 'Árvore conhecida como "árvore da vida do sertão" pela importância de seus frutos.', curiosidade: 'Suas raízes tuberosas armazenam água e nutrientes, ajudando a árvore a sobreviver à estiagem.' },
      { nome: 'Xique-xique', cientifico: 'Pilosocereus gounellei', papel: 'Cacto ramificado amplamente usado como alimento para animais em períodos de seca extrema.', curiosidade: 'Seus espinhos densos protegem a planta da perda de água e de herbívoros.' },
      { nome: 'Angico', cientifico: 'Anadenanthera colubrina', papel: 'Árvore de madeira resistente, tradicionalmente usada na construção rural.', curiosidade: 'Perde as folhas na seca para reduzir a perda de água, retomando-as com as primeiras chuvas.' },
      { nome: 'Carnaúba', cientifico: 'Copernicia prunifera', papel: 'Palmeira conhecida como "árvore da vida" do sertão nordestino.', curiosidade: 'De suas folhas é extraída a cera de carnaúba, historicamente um dos principais produtos econômicos da região.' }
    ],

    redeDeVida: {
      produtores: ['Umbuzeiro', 'Mandacaru', 'Angico'],
      herbivoros: ['Veado-catingueiro', 'Preá', 'Asa-branca'],
      predadores: ['Gato-do-mato'],
      decompositores: ['Fungos e insetos decompositores do solo seco']
    },

    ameacas: [
      { icone: '🪵', titulo: 'Desmatamento para carvão', texto: 'Extração de lenha e produção de carvão vegetal reduzem a cobertura vegetal nativa.' },
      { icone: '🌵', titulo: 'Risco de desertificação', texto: 'Em áreas mais degradadas, a combinação de seca e uso do solo pode levar à perda de fertilidade.' },
      { icone: '🐐', titulo: 'Sobrepastejo', texto: 'Criação extensiva de caprinos e bovinos pode degradar a vegetação nativa em algumas áreas.' },
      { icone: '🌡️', titulo: 'Mudanças climáticas', texto: 'Aumento de temperatura e maior irregularidade nas chuvas intensificam a vulnerabilidade do bioma.' }
    ],

    serHumano: {
      texto: 'A Caatinga é o lar do povo sertanejo, que ao longo de gerações desenvolveu técnicas de convivência com o semiárido — como cisternas para captação de água de chuva e agricultura adaptada à sazonalidade. Plantas nativas como o umbuzeiro e o mandacaru fazem parte da culinária, da medicina popular e da cultura regional.',
      pontos: ['Tecnologias sociais de convivência com o semiárido', 'Agricultura familiar adaptada à seca', 'Uso tradicional de plantas nativas na alimentação e medicina popular', 'Forte identidade cultural sertaneja']
    },

    conservacao: [
      { icone: '💧', titulo: 'Convivência com o semiárido', texto: 'Programas de cisternas e captação de água ajudam comunidades a conviver melhor com a seca sem degradar o ambiente.' },
      { icone: '🌳', titulo: 'Ampliação de áreas protegidas', texto: 'A Caatinga é um dos biomas com menor percentual de área legalmente protegida no Brasil, tornando novas unidades de conservação prioritárias.' },
      { icone: '🐐', titulo: 'Manejo sustentável da pecuária', texto: 'Práticas de pastejo rotacionado reduzem a degradação da vegetação nativa.' },
      { icone: '🔬', titulo: 'Pesquisa sobre espécies endêmicas', texto: 'Estudos científicos ajudam a entender e proteger espécies que só existem na Caatinga.' }
    ],

    curiosidades: [
      'A Caatinga é o único bioma inteiramente brasileiro — não existe território equivalente em nenhum outro país.',
      'Seu nome vem do tupi e significa "mata branca", referência ao aspecto da vegetação na estação seca.',
      'Muitas espécies vegetais conseguem florescer poucas horas após a primeira chuva do ano.',
      'A ararinha-azul, extinta na natureza, é originária da Caatinga e hoje é alvo de projetos de reintrodução.',
      'Apesar da aparência árida, a Caatinga tem alto grau de endemismo — muitas espécies só existem ali.'
    ],

    perfilVisual: {
      clima: 'Semiárido, com chuvas escassas e irregulares',
      vegetacao: 'Arbustiva e espinhosa, com muitas espécies caducifólias',
      fauna: 'Alto endemismo, com espécies adaptadas à seca extrema',
      flora: 'Cactos, arbustos e árvores adaptadas ao déficit hídrico',
      agua: 'Rios intermitentes e forte dependência de reservatórios',
      presencaHumana: 'Forte identidade sertaneja e agricultura familiar',
      pressoesAmbientais: 'Alta — desmatamento e risco de desertificação'
    },

    som: { label: 'Sons da Caatinga', descricao: 'vento seco, cigarras e aves do sertão' },

    relacionados: ['cerrado', 'pampa']
  },

  'mata-atlantica': {
    slug: 'mata-atlantica',
    nome: 'Mata Atlântica',
    subtitulo: 'A floresta que abastece as cidades.',
    categoria: 'BIOMA BRASILEIRO',
    localizacao: 'Litoral do Brasil',
    corDestaque: '#1F4D36',
    heroImagem: '../assets/biomas/bioma-mata-atlantica.jpg',
    descricao: 'Originalmente estendida por boa parte do litoral brasileiro, restam hoje cerca de 24% da cobertura vegetal original da Mata Atlântica — ainda assim, ela garante água para mais de 145 milhões de pessoas.',

    stats: [
      { label: 'Área', valor: '1,1 milhão km²', detalhe: 'extensão original do bioma' },
      { label: 'Biodiversidade', valor: '+20 mil', detalhe: 'espécies de plantas catalogadas' },
      { label: 'Clima', valor: 'Tropical e subtropical úmido', detalhe: 'variando com a latitude e altitude' },
      { label: 'Região', valor: 'Litoral', detalhe: 'do Brasil, do Nordeste ao Sul' }
    ],

    mapaDestaque: ['sudeste', 'sul', 'nordeste'],

    linhaDoTempo: [
      { periodo: 'Dezenas de milhões de anos atrás', titulo: 'Formação geológica', texto: 'A proximidade com o oceano e a variação de relevo, de planícies costeiras a serras, criam múltiplos microclimas ao longo do bioma.' },
      { periodo: 'Milhões de anos atrás', titulo: 'Transformações climáticas', texto: 'A umidade constante vinda do oceano favorece o desenvolvimento de uma floresta densa e altamente diversa.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Expansão da vegetação', texto: 'A Mata Atlântica se estabelece como um mosaico de florestas, restingas e manguezais ao longo de milhares de quilômetros de costa.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Adaptação das espécies', texto: 'O isolamento geográfico de trechos da floresta favorece altíssimo endemismo — muitas espécies não existem em nenhum outro lugar.' },
      { periodo: 'Séculos atrás', titulo: 'Presença humana', texto: 'Povos indígenas ocupam a região há milênios; a partir do século 16, a colonização portuguesa se concentra justamente na faixa da Mata Atlântica.' },
      { periodo: 'Presente', titulo: 'Desafios atuais', texto: 'Por coincidir com a região mais urbanizada do Brasil, o bioma é um dos mais fragmentados do país, com poucos remanescentes florestais contínuos.' }
    ],

    passadoPresenteFuturo: {
      passado: 'Originalmente, a Mata Atlântica cobria uma extensa faixa contínua ao longo do litoral brasileiro, do Nordeste ao Sul do país.',
      presente: 'Restam hoje fragmentos, muitos pequenos e isolados entre si, concentrados sobretudo em áreas de relevo mais acidentado, de difícil ocupação.',
      futuro: 'Projetos de restauração florestal e corredores ecológicos buscam reconectar fragmentos remanescentes, o que pode ampliar a resiliência do bioma nas próximas décadas.'
    },

    fauna: [
      { nome: 'Mico-leão-dourado', cientifico: 'Leontopithecus rosalia', desc: 'Pequeno primata endêmico da Mata Atlântica, símbolo de conservação no Brasil.', status: 'Em Perigo', curiosidade: 'Já esteve à beira da extinção; hoje é um dos maiores exemplos de recuperação de espécie no país.', habitat: 'Fragmentos de floresta com dossel denso no Rio de Janeiro.', dieta: 'Frutas, insetos e pequenos vertebrados.', papel: 'Dispersor de sementes essencial para a regeneração florestal.' },
      { nome: 'Muriqui-do-sul', cientifico: 'Brachyteles arachnoides', desc: 'O maior primata das Américas, endêmico da Mata Atlântica.', status: 'Em Perigo', curiosidade: 'Tem comportamento social pacífico, com raros episódios de agressividade entre indivíduos.', habitat: 'Florestas contínuas de altitude.', dieta: 'Folhas, frutos e flores.', papel: 'Importante dispersor de sementes de árvores de grande porte.' },
      { nome: 'Jaguatirica', cientifico: 'Leopardus pardalis', desc: 'Felino de médio porte com pelagem manchada, presente em diversos biomas brasileiros.', status: 'Pouco Preocupante', curiosidade: 'Tem hábitos majoritariamente noturnos e é excelente escaladora.', habitat: 'Florestas densas e áreas de vegetação fechada.', dieta: 'Pequenos mamíferos, aves e répteis.', papel: 'Predadora que ajuda a controlar populações de roedores.' },
      { nome: 'Papagaio-da-cara-roxa', cientifico: 'Amazona brasiliensis', desc: 'Espécie de papagaio endêmica do litoral sul da Mata Atlântica.', status: 'Vulnerável', curiosidade: 'Faz longos deslocamentos diários entre áreas de manguezal e floresta para se alimentar.', habitat: 'Manguezais e restingas costeiras.', dieta: 'Frutos e sementes nativas.', papel: 'Dispersor de sementes entre diferentes ambientes costeiros.' },
      { nome: 'Bicho-preguiça-de-coleira', cientifico: 'Bradypus torquatus', desc: 'Espécie de preguiça endêmica e exclusiva da Mata Atlântica.', status: 'Vulnerável', curiosidade: 'Depende de grandes áreas de floresta contínua para se manter geneticamente saudável.', habitat: 'Dossel de florestas bem preservadas.', dieta: 'Folhas de diferentes espécies arbóreas.', papel: 'Indicadora da qualidade e continuidade da floresta.' },
      { nome: 'Tucano-de-bico-verde', cientifico: 'Ramphastos dicolorus', desc: 'Ave colorida e carismática, comum em remanescentes de Mata Atlântica.', status: 'Pouco Preocupante', curiosidade: 'Seu bico grande ajuda a regular a temperatura corporal em dias quentes.', habitat: 'Florestas e bordas de mata.', dieta: 'Frutas e, ocasionalmente, pequenos animais e ovos.', papel: 'Um dos principais dispersores de sementes de árvores frutíferas.' }
    ],

    flora: [
      { nome: 'Pau-brasil', cientifico: 'Paubrasilia echinata', papel: 'Árvore que deu nome ao país, historicamente explorada pelo corante extraído de seu tronco.', curiosidade: 'Foi tão intensamente explorada no período colonial que hoje é uma espécie ameaçada.' },
      { nome: 'Jequitibá-rosa', cientifico: 'Cariniana legalis', papel: 'Uma das árvores mais altas e longevas da Mata Atlântica.', curiosidade: 'Pode viver centenas de anos e ultrapassar 40 metros de altura.' },
      { nome: 'Bromélia', cientifico: 'Família Bromeliaceae', papel: 'Planta que acumula água entre suas folhas, criando pequenos microhabitats.', curiosidade: 'Algumas espécies de rãs completam todo o ciclo de vida dentro da água acumulada nas bromélias.' },
      { nome: 'Palmeira-juçara', cientifico: 'Euterpe edulis', papel: 'Palmeira nativa cujo palmito é uma importante fonte de alimento para a fauna.', curiosidade: 'A extração predatória de seu palmito levou a espécie a ficar ameaçada de extinção.' },
      { nome: 'Araucária', cientifico: 'Araucaria angustifolia', papel: 'Conífera típica das matas de altitude da Mata Atlântica no Sul e Sudeste do país.', curiosidade: 'Suas sementes, os pinhões, são um alimento tradicional de inverno em partes do Sul do Brasil.' }
    ],

    redeDeVida: {
      produtores: ['Jequitibá-rosa', 'Palmeira-juçara', 'Pau-brasil'],
      herbivoros: ['Muriqui-do-sul', 'Bicho-preguiça-de-coleira'],
      predadores: ['Jaguatirica'],
      decompositores: ['Fungos e insetos do solo florestal úmido']
    },

    ameacas: [
      { icone: '🏙️', titulo: 'Urbanização', texto: 'O bioma coincide com a faixa mais densamente povoada do Brasil, o que historicamente reduziu sua cobertura original.' },
      { icone: '🧩', titulo: 'Fragmentação extrema', texto: 'A maior parte do que resta está dividida em fragmentos pequenos e isolados entre si.' },
      { icone: '🌆', titulo: 'Expansão imobiliária', texto: 'Pressão por novas áreas residenciais e de infraestrutura continua reduzindo remanescentes florestais.' },
      { icone: '🦋', titulo: 'Perda de espécies endêmicas', texto: 'Muitas espécies que só existem na Mata Atlântica dependem de fragmentos florestais específicos para sobreviver.' }
    ],

    serHumano: {
      texto: 'A Mata Atlântica é o bioma mais diretamente ligado à história urbana do Brasil — grande parte das maiores cidades do país, como São Paulo, Rio de Janeiro e Salvador, está sobre sua área original. Hoje, os remanescentes florestais continuam essenciais para o abastecimento de água dessas regiões metropolitanas.',
      pontos: ['Abastecimento de água para grandes centros urbanos', 'Berço da colonização portuguesa no Brasil', 'Forte pressão imobiliária e urbana', 'Importantes projetos de restauração florestal em curso']
    },

    conservacao: [
      { icone: '🌱', titulo: 'Restauração florestal', texto: 'Projetos de plantio de mudas nativas ajudam a reconectar fragmentos isolados de floresta.' },
      { icone: '🌉', titulo: 'Corredores ecológicos', texto: 'Faixas de vegetação plantadas conectam fragmentos, facilitando o deslocamento da fauna.' },
      { icone: '🌳', titulo: 'Unidades de conservação', texto: 'Parques estaduais e federais protegem remanescentes importantes da floresta original.' },
      { icone: '💧', titulo: 'Proteção de mananciais', texto: 'Preservar a floresta remanescente é diretamente ligado à garantia de água para as cidades.' }
    ],

    curiosidades: [
      'A Mata Atlântica é considerada um dos hotspots de biodiversidade mais ameaçados do mundo, por combinar altíssima diversidade com grande perda de habitat.',
      'Foi na Mata Atlântica que os portugueses desembarcaram em 1500, e o pau-brasil deu nome ao país.',
      'Mais de 70% da população brasileira vive dentro da área original do bioma.',
      'Apesar de restar cerca de um quarto da cobertura original, o bioma ainda mantém altíssimo grau de endemismo.',
      'O mico-leão-dourado é um dos maiores símbolos de recuperação de espécies ameaçadas do mundo.'
    ],

    perfilVisual: {
      clima: 'Tropical e subtropical úmido, variando com altitude',
      vegetacao: 'Floresta densa, restingas e manguezais',
      fauna: 'Altíssimo endemismo, especialmente entre primatas e aves',
      flora: 'Rica diversidade, com muitas espécies ameaçadas',
      agua: 'Principal fonte de água para grandes centros urbanos',
      presencaHumana: 'A mais densamente povoada entre os biomas brasileiros',
      pressoesAmbientais: 'Muito alta — urbanização e fragmentação'
    },

    som: { label: 'Sons da Mata Atlântica', descricao: 'aves da mata e sons de riachos entre as árvores' },

    relacionados: ['pampa', 'cerrado']
  },

  pantanal: {
    slug: 'pantanal',
    nome: 'Pantanal',
    subtitulo: 'A maior planície alagável do mundo.',
    categoria: 'BIOMA BRASILEIRO',
    localizacao: 'Centro-Oeste do Brasil',
    corDestaque: '#3E6B7A',
    heroImagem: '../assets/biomas/bioma-pantanal.jpg',
    descricao: 'Com ciclos anuais de cheia e seca, o Pantanal é a maior planície alagável contínua do planeta e um dos ambientes com maior concentração visível de fauna silvestre da América do Sul.',

    stats: [
      { label: 'Área', valor: '150 mil km²', detalhe: 'em território brasileiro' },
      { label: 'Biodiversidade', valor: '+650', detalhe: 'espécies de aves registradas' },
      { label: 'Clima', valor: 'Tropical com estações de cheia e seca', detalhe: 'regime de pulso de inundação' },
      { label: 'Região', valor: 'Centro-Oeste', detalhe: 'do Brasil' }
    ],

    mapaDestaque: ['centro-oeste'],

    linhaDoTempo: [
      { periodo: 'Dezenas de milhões de anos atrás', titulo: 'Formação geológica', texto: 'Uma extensa depressão sedimentar, cercada por planaltos, cria a bacia que hoje recebe as águas de diversos rios formadores do Pantanal.' },
      { periodo: 'Milhões de anos atrás', titulo: 'Transformações climáticas', texto: 'O regime de chuvas sazonal estabelece o padrão de cheias e secas que ainda hoje define o ritmo do bioma.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Expansão da vegetação', texto: 'Formam-se mosaicos de campos inundáveis, matas ciliares e cordilheiras — porções de terra mais alta que não alagam.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Adaptação das espécies', texto: 'A fauna desenvolve estratégias específicas para lidar com o ciclo anual de cheia e seca, como migrações locais e reprodução sincronizada com as águas.' },
      { periodo: 'Séculos atrás', titulo: 'Presença humana', texto: 'Povos indígenas ocupam a região há milênios; mais tarde, a pecuária extensiva se adapta ao ritmo natural das águas.' },
      { periodo: 'Presente', titulo: 'Desafios atuais', texto: 'Queimadas de grandes proporções e alterações no regime hídrico da bacia ameaçam o equilíbrio do pulso de inundação.' }
    ],

    passadoPresenteFuturo: {
      passado: 'Por milênios, o ciclo anual de cheias e secas moldou um dos ecossistemas com maior concentração visível de vida selvagem do continente.',
      presente: 'O Pantanal mantém boa parte de sua vegetação nativa, em grande parte por conviver historicamente com a pecuária extensiva de baixo impacto.',
      futuro: 'Anos recentes de seca severa e grandes incêndios mostraram a vulnerabilidade do bioma a mudanças climáticas, reforçando a importância de proteger as áreas de nascentes que alimentam suas águas.'
    },

    fauna: [
      { nome: 'Onça-pintada', cientifico: 'Panthera onca', desc: 'O Pantanal tem uma das maiores densidades de onças-pintadas do continente.', status: 'Quase Ameaçada', curiosidade: 'É um dos poucos felinos que gosta de entrar na água para caçar.', habitat: 'Matas ciliares e áreas próximas a rios.', dieta: 'Capivaras, jacarés e outros mamíferos de médio porte.', papel: 'Predador de topo, essencial para o equilíbrio do ecossistema.' },
      { nome: 'Ariranha', cientifico: 'Pteronura brasiliensis', desc: 'Maior espécie de lontra do mundo, vive em grupos familiares.', status: 'Em Perigo', curiosidade: 'Comunica-se por meio de vocalizações variadas dentro do grupo.', habitat: 'Rios e corixos (canais naturais) do Pantanal.', dieta: 'Principalmente peixes.', papel: 'Indicadora da qualidade da água dos rios pantaneiros.' },
      { nome: 'Tuiuiú', cientifico: 'Jabiru mycteria', desc: 'Ave símbolo do Pantanal, uma das maiores aves voadoras das Américas.', status: 'Pouco Preocupante', curiosidade: 'Constrói ninhos enormes, reutilizados por várias temporadas seguidas.', habitat: 'Áreas alagadas e campos inundáveis.', dieta: 'Peixes, anfíbios e pequenos répteis.', papel: 'Indicador da saúde das áreas úmidas do Pantanal.' },
      { nome: 'Jacaré-do-pantanal', cientifico: 'Caiman yacare', desc: 'Réptil extremamente abundante no bioma, essencial para o equilíbrio aquático.', status: 'Pouco Preocupante', curiosidade: 'Estima-se que o Pantanal abrigue uma das maiores populações de crocodilianos do planeta.', habitat: 'Rios, lagoas e áreas alagadas.', dieta: 'Peixes e outros pequenos animais aquáticos.', papel: 'Regula populações de peixes e recicla nutrientes na água.' },
      { nome: 'Capivara', cientifico: 'Hydrochoerus hydrochaeris', desc: 'O maior roedor do mundo, muito comum às margens dos rios pantaneiros.', status: 'Pouco Preocupante', curiosidade: 'Vive em grupos grandes e é excelente nadadora.', habitat: 'Margens de rios e áreas alagadas.', dieta: 'Herbívora — gramíneas e plantas aquáticas.', papel: 'Presa importante para onças e outros predadores, além de dispersora de sementes.' },
      { nome: 'Arara-azul-grande', cientifico: 'Anodorhynchus hyacinthinus', desc: 'A maior arara do mundo também tem populações importantes no Pantanal.', status: 'Quase Ameaçada', curiosidade: 'Depende de ocos em árvores específicas para nidificar.', habitat: 'Áreas de cerrado e matas próximas a corpos d\'água.', dieta: 'Frutos e sementes de palmeiras nativas.', papel: 'Dispersora de sementes de palmeiras do bioma.' }
    ],

    flora: [
      { nome: 'Piúva', cientifico: 'Handroanthus impetiginosus', papel: 'Árvore de floração rosa intensa, comum nas cordilheiras do Pantanal.', curiosidade: 'Sua floração costuma marcar visualmente a transição entre as estações no bioma.' },
      { nome: 'Aguapé', cientifico: 'Eichhornia crassipes', papel: 'Planta aquática flutuante que forma extensos tapetes verdes sobre a água.', curiosidade: 'Suas raízes servem de abrigo para pequenos peixes e invertebrados aquáticos.' },
      { nome: 'Carandá', cientifico: 'Copernicia alba', papel: 'Palmeira típica de áreas periodicamente inundadas.', curiosidade: 'Forma densos palmeirais visíveis à distância na paisagem pantaneira.' },
      { nome: 'Cambará', cientifico: 'Vochysia divergens', papel: 'Árvore que forma extensos "cambarazais" em áreas mais baixas e alagáveis.', curiosidade: 'Sua expansão em algumas áreas é estudada por pesquisadores como indicador de mudanças no regime de inundação.' },
      { nome: 'Acuri', cientifico: 'Attalea phalerata', papel: 'Palmeira comum no Pantanal, cujos frutos alimentam diversas espécies da fauna local.', curiosidade: 'Araras e outros animais dependem de seus frutos, especialmente em períodos de escassez de outros alimentos.' }
    ],

    redeDeVida: {
      produtores: ['Aguapé', 'Carandá', 'Cambará'],
      herbivoros: ['Capivara'],
      predadores: ['Onça-pintada', 'Jacaré-do-pantanal', 'Ariranha'],
      decompositores: ['Microrganismos aquáticos e do solo alagado']
    },

    ameacas: [
      { icone: '🔥', titulo: 'Grandes queimadas', texto: 'Anos de seca severa aumentam o risco de incêndios de grandes proporções na vegetação seca.' },
      { icone: '🌊', titulo: 'Alteração do regime hídrico', texto: 'Mudanças no uso do solo na bacia que alimenta o Pantanal podem afetar o ciclo natural de cheias e secas.' },
      { icone: '🐄', titulo: 'Pecuária em larga escala', texto: 'Embora historicamente conviva com o bioma, a intensificação da pecuária pode pressionar áreas nativas.' },
      { icone: '🌡️', titulo: 'Mudanças climáticas', texto: 'Períodos de seca mais longos e intensos afetam diretamente um ecossistema que depende do ciclo de inundação.' }
    ],

    serHumano: {
      texto: 'O Pantanal tem uma longa história de convivência com a pecuária extensiva, praticada de forma adaptada ao ritmo das águas, o que ajudou a preservar boa parte da vegetação nativa. Comunidades tradicionais pantaneiras e povos indígenas mantêm modos de vida profundamente conectados ao ciclo de cheias e secas do bioma.',
      pontos: ['Pecuária extensiva adaptada ao regime de cheias', 'Comunidades tradicionais pantaneiras', 'Ecoturismo e observação de fauna silvestre', 'Povos indígenas com forte relação com os rios da região']
    },

    conservacao: [
      { icone: '🚒', titulo: 'Prevenção e combate a incêndios', texto: 'Brigadas e monitoramento ajudam a conter queimadas antes que se espalhem.' },
      { icone: '💧', titulo: 'Proteção das nascentes', texto: 'Preservar a vegetação nas áreas altas que alimentam os rios do Pantanal é essencial para manter o pulso de inundação.' },
      { icone: '🐄', titulo: 'Pecuária sustentável', texto: 'Práticas de manejo que respeitam o ciclo natural das águas ajudam a conciliar produção e conservação.' },
      { icone: '🔭', titulo: 'Turismo de observação', texto: 'O ecoturismo responsável gera renda local a partir da conservação da fauna silvestre.' }
    ],

    curiosidades: [
      'O Pantanal é considerado a maior planície alagável contínua do mundo.',
      'Durante a cheia, até 80% de sua área pode ficar temporariamente coberta por água.',
      'É um dos melhores lugares do planeta para observar onças-pintadas em vida livre.',
      'O tuiuiú, símbolo do bioma, pode reutilizar o mesmo ninho por diversas temporadas.',
      'A grande cheia anual funciona como um "reset" natural, redistribuindo nutrientes por toda a planície.'
    ],

    perfilVisual: {
      clima: 'Tropical, com estações de cheia e seca bem marcadas',
      vegetacao: 'Mosaico de campos inundáveis, matas ciliares e cordilheiras',
      fauna: 'Uma das maiores concentrações visíveis de fauna da América do Sul',
      flora: 'Vegetação adaptada ao pulso anual de inundação',
      agua: 'Regime de cheias e secas que rege todo o ecossistema',
      presencaHumana: 'Pecuária extensiva e comunidades tradicionais',
      pressoesAmbientais: 'Alta — queimadas e alterações no regime hídrico'
    },

    som: { label: 'Sons do Pantanal', descricao: 'aves aquáticas, água corrente e sons da vida silvestre' },

    relacionados: ['cerrado', 'amazonia']
  },

  pampa: {
    slug: 'pampa',
    nome: 'Pampa',
    subtitulo: 'Campos nativos do extremo sul.',
    categoria: 'BIOMA BRASILEIRO',
    localizacao: 'Sul do Brasil',
    corDestaque: '#4A7A4E',
    heroImagem: '../assets/biomas/bioma-pampa.jpg',
    descricao: 'Restrito ao Rio Grande do Sul dentro do território brasileiro, o Pampa é formado por extensos campos nativos de horizonte aberto, com vegetação rasteira predominantemente herbácea.',

    stats: [
      { label: 'Área', valor: '176 mil km²', detalhe: 'em território brasileiro' },
      { label: 'Biodiversidade', valor: '+3,2 mil', detalhe: 'espécies de plantas catalogadas' },
      { label: 'Clima', valor: 'Subtropical', detalhe: 'com estações do ano bem definidas' },
      { label: 'Região', valor: 'Sul', detalhe: 'do Brasil' }
    ],

    mapaDestaque: ['sul'],

    linhaDoTempo: [
      { periodo: 'Dezenas de milhões de anos atrás', titulo: 'Formação geológica', texto: 'Um relevo suavemente ondulado e solos férteis favorecem o desenvolvimento de extensos campos nativos, em vez de florestas densas.' },
      { periodo: 'Milhões de anos atrás', titulo: 'Transformações climáticas', texto: 'Um clima subtropical, com estações do ano bem marcadas, sustenta a predominância de vegetação herbácea e rasteira.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Expansão da vegetação', texto: 'Formam-se os campos nativos característicos do Pampa, com alta diversidade de gramíneas e poucas árvores isoladas.' },
      { periodo: 'Milhares de anos atrás', titulo: 'Adaptação das espécies', texto: 'A fauna se adapta à vida em campo aberto, com espécies terrestres bem camufladas na vegetação rasteira.' },
      { periodo: 'Séculos atrás', titulo: 'Presença humana', texto: 'Povos indígenas ocupam a região há milênios; mais tarde, a pecuária de corte se torna a atividade econômica predominante, moldando a cultura gaúcha.' },
      { periodo: 'Presente', titulo: 'Desafios atuais', texto: 'A conversão de campos nativos em lavouras e silvicultura é hoje a principal pressão sobre o bioma.' }
    ],

    passadoPresenteFuturo: {
      passado: 'Por milênios, o clima subtropical e o relevo suave do extremo sul favoreceram a formação de extensos campos nativos, em vez de florestas.',
      presente: 'Hoje, boa parte da vegetação nativa já foi convertida em lavouras de soja, arroz e áreas de silvicultura, tornando o Pampa um dos biomas menos protegidos do país.',
      futuro: 'A valorização do campo nativo como parte da identidade cultural gaúcha, aliada a políticas específicas de conservação, pode ajudar a conter a perda contínua de área nativa.'
    },

    fauna: [
      { nome: 'Veado-campeiro', cientifico: 'Ozotoceros bezoarticus', desc: 'Cervídeo adaptado à vida em campo aberto, hoje raro em boa parte de sua distribuição original.', status: 'Vulnerável', curiosidade: 'É extremamente sensível a alterações no seu habitat, desaparecendo rapidamente de áreas convertidas para agricultura.', habitat: 'Campos nativos abertos.', dieta: 'Gramíneas e vegetação rasteira.', papel: 'Espécie-símbolo da conservação dos campos nativos do Pampa.' },
      { nome: 'Tico-tico', cientifico: 'Zonotrichia capensis', desc: 'Uma das aves mais comuns e conhecidas dos campos e áreas urbanas do Sul do Brasil.', status: 'Pouco Preocupante', curiosidade: 'Seu canto é um dos sons mais associados à paisagem rural gaúcha.', habitat: 'Campos abertos e áreas urbanas arborizadas.', dieta: 'Sementes e pequenos insetos.', papel: 'Controladora de populações de insetos e dispersora de sementes.' },
      { nome: 'Graxaim-do-campo', cientifico: 'Lycalopex gymnocercus', desc: 'Pequeno canídeo silvestre típico dos campos sulinos.', status: 'Pouco Preocupante', curiosidade: 'Tem hábitos oportunistas e se adapta bem a áreas de transição entre campo e lavoura.', habitat: 'Campos abertos e bordas de áreas agrícolas.', dieta: 'Onívoro — pequenos mamíferos, insetos e frutos.', papel: 'Controlador de populações de roedores e insetos.' },
      { nome: 'Perdiz', cientifico: 'Rhynchotus rufescens', desc: 'Ave terrestre bem camuflada na vegetação rasteira dos campos.', status: 'Pouco Preocupante', curiosidade: 'Prefere correr e se esconder na vegetação a voar quando ameaçada.', habitat: 'Campos nativos com vegetação rasteira densa.', dieta: 'Sementes, brotos e pequenos insetos.', papel: 'Presa importante na cadeia alimentar dos campos.' },
      { nome: 'Tuco-tuco', cientifico: 'Ctenomys spp.', desc: 'Pequeno roedor subterrâneo que constrói extensas galerias sob os campos.', status: 'Varia por espécie', curiosidade: 'Recebe esse nome por causa do som característico que emite dentro de suas tocas.', habitat: 'Solo dos campos nativos, onde escava galerias.', dieta: 'Raízes e partes subterrâneas de plantas.', papel: 'Suas galerias airejam o solo e influenciam a vegetação local.' },
      { nome: 'Quero-quero', cientifico: 'Vanellus chilensis', desc: 'Ave símbolo dos campos do Sul do Brasil, conhecida pelo canto de alerta característico.', status: 'Pouco Preocupante', curiosidade: 'É extremamente territorial e alerta ruidosamente diante de qualquer ameaça próxima ao ninho.', habitat: 'Campos abertos, incluindo áreas urbanas e rurais.', dieta: 'Insetos e pequenos invertebrados.', papel: 'Ajuda a controlar populações de insetos nos campos.' }
    ],

    flora: [
      { nome: 'Capim-flechilha', cientifico: 'Gênero Piptochaetium', papel: 'Uma das gramíneas nativas típicas dos campos do Pampa.', curiosidade: 'Suas sementes têm uma estrutura pontiaguda que ajuda a se fixar no solo após dispersadas pelo vento.' },
      { nome: 'Butiazeiro', cientifico: 'Butia odorata', papel: 'Palmeira nativa típica da paisagem campestre do Rio Grande do Sul.', curiosidade: 'Seus frutos, o butiá, são usados tradicionalmente na culinária gaúcha.' },
      { nome: 'Barba-de-bode', cientifico: 'Vernonanthura tweedieana', papel: 'Arbusto nativo comum em áreas de campo e transição com mata.', curiosidade: 'Suas flores atraem grande variedade de polinizadores nativos.' },
      { nome: 'Capim-caninha', cientifico: 'Andropogon lateralis', papel: 'Gramínea nativa que forma touceiras características da paisagem campestre.', curiosidade: 'É uma das espécies que ajuda a identificar áreas de campo nativo bem preservado.' },
      { nome: 'Corticeira', cientifico: 'Erythrina crista-galli', papel: 'Árvore de flores vermelhas intensas, comum em áreas úmidas e margens de rios do Pampa.', curiosidade: 'Suas flores são a flor símbolo do Rio Grande do Sul e atraem beija-flores.' }
    ],

    redeDeVida: {
      produtores: ['Capim-flechilha', 'Capim-caninha', 'Butiazeiro'],
      herbivoros: ['Veado-campeiro', 'Tuco-tuco', 'Perdiz'],
      predadores: ['Graxaim-do-campo'],
      decompositores: ['Fungos e microrganismos do solo dos campos']
    },

    ameacas: [
      { icone: '🌾', titulo: 'Conversão para lavouras', texto: 'Campos nativos são convertidos para o cultivo de soja, arroz e outras culturas em larga escala.' },
      { icone: '🌲', titulo: 'Expansão da silvicultura', texto: 'Plantios de espécies exóticas para produção de celulose reduzem a área de campo nativo.' },
      { icone: '🐄', titulo: 'Pastejo mal manejado', texto: 'Em algumas áreas, o excesso de gado sem rotação pode degradar a vegetação nativa.' },
      { icone: '🧬', titulo: 'Baixa proteção legal', texto: 'O Pampa está entre os biomas brasileiros com menor percentual de área legalmente protegida.' }
    ],

    serHumano: {
      texto: 'O Pampa está no coração da cultura gaúcha: a tradição campeira, a pecuária extensiva e o modo de vida ligado à lida com o gado moldaram boa parte da identidade cultural do Rio Grande do Sul. Hoje, esse mesmo campo nativo que sustenta a tradição também é disputado pela expansão da agricultura em larga escala.',
      pontos: ['Berço da cultura campeira gaúcha', 'Pecuária extensiva de longa tradição', 'Culinária regional baseada em produtos do campo, como o butiá', 'Disputa crescente entre pecuária tradicional e agricultura em larga escala']
    },

    conservacao: [
      { icone: '🌾', titulo: 'Valorização do campo nativo', texto: 'Reconhecer o valor ecológico e cultural do campo nativo ajuda a frear sua conversão para outros usos.' },
      { icone: '🐄', titulo: 'Pecuária sobre campo nativo', texto: 'Sistemas de pastejo bem manejados permitem produzir e conservar a vegetação nativa ao mesmo tempo.' },
      { icone: '🌳', titulo: 'Ampliação de áreas protegidas', texto: 'O Pampa precisa de mais unidades de conservação para proteger sua biodiversidade específica.' },
      { icone: '📖', titulo: 'Reconhecimento cultural', texto: 'Valorizar a cultura campeira como parte do patrimônio ambiental reforça o interesse pela conservação.' }
    ],

    curiosidades: [
      'No Brasil, o Pampa está restrito ao Rio Grande do Sul, embora se estenda também por Uruguai e Argentina.',
      'Apesar da aparência simples, os campos nativos do Pampa têm altíssima diversidade de gramíneas.',
      'O bioma é um dos que possuem menor percentual de área legalmente protegida no Brasil.',
      'A tradição campeira gaúcha, com o gado e o cavalo, está diretamente ligada à paisagem do Pampa.',
      'Diferente da maioria dos biomas brasileiros, o Pampa é predominantemente formado por vegetação rasteira, com poucas árvores.'
    ],

    perfilVisual: {
      clima: 'Subtropical, com quatro estações bem definidas',
      vegetacao: 'Campos nativos abertos, predominantemente herbáceos',
      fauna: 'Espécies adaptadas à vida em campo aberto',
      flora: 'Alta diversidade de gramíneas nativas',
      agua: 'Rios e banhados distribuídos pela paisagem campestre',
      presencaHumana: 'Forte tradição campeira e pecuária extensiva',
      pressoesAmbientais: 'Alta — conversão para lavouras e silvicultura'
    },

    som: { label: 'Sons do Pampa', descricao: 'vento nos campos abertos e aves campestres' },

    relacionados: ['mata-atlantica', 'caatinga']
  }

};

// Disponibiliza no escopo global para uso em js/biomas.js
if (typeof window !== 'undefined') {
  window.BIOMAS = BIOMAS;
}
