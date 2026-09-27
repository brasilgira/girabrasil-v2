document.addEventListener('DOMContentLoaded', () => {
  const linksMenu = document.querySelectorAll('.nav-site a');
  const indicador = document.getElementById('indicador');

  // Função mais simples e precisa para mover a barra
  function moverIndicador(elemento) {
    if (!elemento || !indicador) return;
    
    // offsetLeft/Top pega a posição exata do link em relação ao container <nav>
    indicador.style.width = `${elemento.offsetWidth}px`;
    indicador.style.height = `${elemento.offsetHeight}px`;
    indicador.style.left = `${elemento.offsetLeft}px`;
    indicador.style.top = `${elemento.offsetTop}px`;
    
    indicador.style.opacity = '1';
  }

  // 1. Posiciona no item "ativo" quando a página carrega
  const itemAtivo = document.querySelector('.nav-site a.ativo');
  setTimeout(() => {
    moverIndicador(itemAtivo);
  }, 100);

  // 2. Evento de clique para fazer a corridinha
  linksMenu.forEach(link => {
    link.addEventListener('click', function(e) {
      // Se a pessoa clicou no link que já está ativo, não faz nada
      if (this.classList.contains('ativo')) return;

      e.preventDefault(); // SEGURA a página, não deixa carregar o link ainda
      
      // Remove a classe ativo de todos e coloca só no que foi clicado
      linksMenu.forEach(l => l.classList.remove('ativo'));
      this.classList.add('ativo');
      
      // Manda a barrinha correr para o novo link
      moverIndicador(this);
      
      // Pega para onde o link deveria ir (ex: "jogos.html")
      const destino = this.getAttribute('href');
      
      // Espera 400 milissegundos (o tempo exato de ver ela correndo) e muda a página
      setTimeout(() => {
        window.location.href = destino;
      }, 400);
    });
  });
});