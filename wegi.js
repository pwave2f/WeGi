(function(){
  "use strict";

  /* ---------- BOOT SEQUENCE ---------- */
  var boot = document.getElementById('boot');
  var bootLines = document.getElementById('bootLines');
  var bootBar = document.getElementById('bootBar');
  var bootPct = document.getElementById('bootPct');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var lines = ["INITIALIZING...", "LOADING EXPERIENCE...", "MOUNTING INTERFACE...", "READY."];

  function finishBoot(){
    boot.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if(reduced){
    finishBoot();
  } else {
    document.body.style.overflow = 'hidden';
    var li = 0, pct = 0;
    bootLines.innerHTML = '<div>' + lines[0] + '</div>';
    var lineTimer = setInterval(function(){
      li++;
      if(li < lines.length){
        bootLines.innerHTML = '<div>' + lines[li] + '</div>';
      }
    }, 550);
    var pctTimer = setInterval(function(){
      pct += Math.random() * 14 + 6;
      if(pct >= 100){
        pct = 100;
        clearInterval(pctTimer);
        clearInterval(lineTimer);
        bootLines.innerHTML = '<div>' + lines[lines.length-1] + '</div>';
        setTimeout(finishBoot, 500);
      }
      bootBar.style.width = pct + '%';
      bootPct.textContent = Math.floor(pct) + '%';
    }, 220);
    // safety fallback
    setTimeout(finishBoot, 3200);
  }

  /* ---------- CUSTOM CURSOR ---------- */
  var dot = document.getElementById('cursorDot');
  var ring = document.getElementById('cursorRing');
  if(window.matchMedia('(hover:hover)').matches){
    window.addEventListener('mousemove', function(e){
      dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
      ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px';
    });
    document.querySelectorAll('a, button, .service-card, .project-card').forEach(function(el){
      el.addEventListener('mouseenter', function(){ ring.style.width='48px'; ring.style.height='48px'; ring.style.borderColor='#4d5dfb'; });
      el.addEventListener('mouseleave', function(){ ring.style.width='32px'; ring.style.height='32px'; ring.style.borderColor='#1c2378'; });
    });
  }

  /* ---------- HEADER SCROLL STATE ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll(){
    if(window.scrollY > 40){ header.classList.add('scrolled'); }
    else { header.classList.remove('scrolled'); }
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  /* ---------- MOBILE NAV ---------- */
  var burger = document.getElementById('burgerBtn');
  var mobileNav = document.getElementById('mobileNav');
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

  /* ---------- SCROLL REVEAL ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.15 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

})();