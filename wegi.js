(function(){
  "use strict";

  /* =========================================================
     HELPERS
     Cada bloco de funcionalidade roda isolado em try/catch:
     se um recurso falhar (ex.: elemento ausente), os demais
     continuam funcionando e o conteúdo nunca fica escondido.
     ========================================================= */
  function safe(fn){
    try{ fn(); } catch(err){ /* silencioso: uma falha aqui não pode travar a página */ }
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- DEGRADAÇÃO PROGRESSIVA (PERFIL C) ----------
     Usa apenas capacidades reais de hardware quando o navegador
     as expõe (nunca user-agent, marca ou modelo). Na ausência
     dessas APIs (ex.: Safari), a página segue no perfil padrão. */
  safe(function(){
    var lowMemory = ('deviceMemory' in navigator) && navigator.deviceMemory <= 2;
    var lowCores = ('hardwareConcurrency' in navigator) && navigator.hardwareConcurrency <= 2;
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var slowNetwork = !!(conn && (conn.saveData || /^(slow-2g|2g)$/.test(conn.effectiveType || '')));
    if(lowMemory || lowCores || slowNetwork){
      document.documentElement.classList.add('low-power');
    }
  });

  /* ---------- BOOT SEQUENCE ----------
     Progressivo e não bloqueante: pula direto para o conteúdo
     quando o movimento é reduzido ou a conexão é lenta. */
  safe(function(){
    var boot = document.getElementById('boot');
    if(!boot) return;
    var bootLines = document.getElementById('bootLines');
    var bootBar = document.getElementById('bootBar');
    var bootPct = document.getElementById('bootPct');
    var lowPower = document.documentElement.classList.contains('low-power');

    var lines = ["INICIALIZANDO...", "CARREGANDO...", "RENDERIZANDO A INTERFACE...", "PRONTO."];

    function finishBoot(){
      boot.classList.add('hidden');
      document.body.style.overflow = '';
    }

    if(reducedMotion || lowPower){
      finishBoot();
      return;
    }

    document.body.style.overflow = 'hidden';
    var li = 0, pct = 0;
    if(bootLines) bootLines.innerHTML = '<div>' + lines[0] + '</div>';
    var lineTimer = setInterval(function(){
      li++;
      if(li < lines.length && bootLines){
        bootLines.innerHTML = '<div>' + lines[li] + '</div>';
      }
    }, 480);
    var pctTimer = setInterval(function(){
      pct += Math.random() * 16 + 8;
      if(pct >= 100){
        pct = 100;
        clearInterval(pctTimer);
        clearInterval(lineTimer);
        if(bootLines) bootLines.innerHTML = '<div>' + lines[lines.length-1] + '</div>';
        setTimeout(finishBoot, 400);
      }
      if(bootBar) bootBar.style.width = pct + '%';
      if(bootPct) bootPct.textContent = Math.floor(pct) + '%';
    }, 190);
    // Rede essencial já está pronta: nunca bloquear o conteúdo por muito tempo.
    setTimeout(finishBoot, 2200);
  });

  /* ---------- CUSTOM CURSOR (somente mouse real, nunca em touch) ----------
     Atualização de posição agrupada em requestAnimationFrame para
     não disparar recálculo de estilo a cada pixel de movimento. */
  safe(function(){
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    if(!dot || !ring) return;
    if(!isFinePointer) return; // sem mouse real: nenhum listener é criado

    var pendingX = 0, pendingY = 0, ticking = false;
    function applyPosition(){
      dot.style.left = pendingX + 'px'; dot.style.top = pendingY + 'px';
      ring.style.left = pendingX + 'px'; ring.style.top = pendingY + 'px';
      ticking = false;
    }
    window.addEventListener('mousemove', function(e){
      pendingX = e.clientX; pendingY = e.clientY;
      if(!ticking){ ticking = true; requestAnimationFrame(applyPosition); }
    }, { passive:true });

    document.querySelectorAll('a, button, .service-card, .project-card').forEach(function(el){
      el.addEventListener('mouseenter', function(){ ring.style.width='48px'; ring.style.height='48px'; ring.style.borderColor='#4d5dfb'; });
      el.addEventListener('mouseleave', function(){ ring.style.width='32px'; ring.style.height='32px'; ring.style.borderColor='#1c2378'; });
    });
  });

  /* ---------- HEADER SCROLL STATE ----------
     Listener passivo, throttlado por requestAnimationFrame:
     no máximo uma atualização de classe por frame. */
  safe(function(){
    var header = document.getElementById('siteHeader');
    if(!header) return;
    var ticking = false;
    function update(){
      if(window.scrollY > 40){ header.classList.add('scrolled'); }
      else { header.classList.remove('scrolled'); }
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }, { passive:true });
    update();
  });

  /* ---------- MOBILE NAV ----------
     Área de toque, aria-expanded e bloqueio/restauração de
     scroll preservados integralmente. */
  safe(function(){
    var burger = document.getElementById('burgerBtn');
    var mobileNav = document.getElementById('mobileNav');
    if(!burger || !mobileNav) return;

    burger.addEventListener('click', function(){
      var open = mobileNav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        mobileNav.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded','false');
        document.body.style.overflow = '';
      });
    });
  });

  /* ---------- SCROLL REVEAL ----------
     Com movimento reduzido, ou sem suporte a IntersectionObserver,
     o conteúdo aparece imediatamente — nunca fica invisível. */
  safe(function(){
    var revealEls = document.querySelectorAll('.reveal');
    if(!revealEls.length) return;

    if(reducedMotion || !('IntersectionObserver' in window)){
      revealEls.forEach(function(el){ el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.15, rootMargin:'0px 0px -8% 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  });

  /* ---------- PAUSAR ANIMAÇÕES FORA DA VIEWPORT ----------
     O sistema orbital do Hero e os satélites do card CAMINHO
     ORBITAL só giram enquanto estão visíveis na tela. */
  safe(function(){
    if(reducedMotion || !('IntersectionObserver' in window)) return;

    var hero = document.getElementById('top');
    if(hero){
      var heroIO = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          hero.classList.toggle('paused', !entry.isIntersecting);
        });
      }, { threshold:0 });
      heroIO.observe(hero);
    }

    var orbitCards = document.querySelectorAll('.project-card');
    if(orbitCards.length){
      var cardIO = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          entry.target.classList.toggle('in-view', entry.isIntersecting);
        });
      }, { threshold:0 });
      orbitCards.forEach(function(card){ cardIO.observe(card); });
    }
  });

})();
