(function () {
  'use strict';
  const canvas = document.getElementById("particle-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let animFrame;
    let w, h;
    const mouse = {
      x: -9999,
      y: -9999,
      active: false
    };

    function resize() {
      const section = canvas.parentElement;
      w = canvas.width = section.offsetWidth;
      h = canvas.height = section.offsetHeight;
    }

    function createParticles() {
      particles = [];
      const density = 4000;
      const count = Math.floor((w * h) / density);
      const maxCount = Math.min(count, 400);
      for (let i = 0; i < maxCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.30,
          vy: (Math.random() - 0.5) * 0.30,
          r: Math.random() * 0.8 + 0.3
        });
      }
    }
    function distance(x1, y1, x2, y2) {
      return Math.hypot(x1 - x2, y1 - y2);
    }
    const lightnings = [];

    function createLightning() {
      if (!mouse.active) return;
      const nearby = particles.filter(p =>
        distance(p.x, p.y, mouse.x, mouse.y) < 180
      );

      if (nearby.length < 2) return;
      const start = nearby[Math.floor(Math.random() * nearby.length)];
      const end = nearby[Math.floor(Math.random() * nearby.length)];
      if (start === end) return;
      lightnings.push({
        start,
        end,
        life: 6 + Math.random() * 4
      });
    }

    function drawLightning() {
      if (mouse.active && Math.random() < 0.035) {
        createLightning();
      }

      for (let i = lightnings.length - 1; i >= 0; i--) {

        const bolt = lightnings[i];
        const x1 = bolt.start.x;
        const y1 = bolt.start.y;
        const x2 = bolt.end.x;
        const y2 = bolt.end.y;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const segments = Math.max(8, Math.floor(len / 12));

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00ff4058";
        ctx.strokeStyle = `rgba(0,255,65,${bolt.life / 10})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);

        for (let s = 1; s < segments; s++) {
          const t = s / segments;
          const px = x1 + dx * t;
          const py = y1 + dy * t;
          const offset = (Math.random() - 0.5) * 18;
          const nx = -dy / len;
          const ny = dx / len;

          ctx.lineTo(
            px + nx * offset,
            py + ny * offset
          );
        }

        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (Math.random() < 0.45) {
          const t = Math.random();
          const bx = x1 + dx * t;
          const by = y1 + dy * t;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(
            bx + (Math.random() - 0.5) * 35,
            by + (Math.random() - 0.5) * 35
          );
          ctx.stroke();

        }
        ctx.restore();
        bolt.life -= 1;

        if (bolt.life <= 0) {
          lightnings.splice(i, 1);
        }
      }
    }

    function drawParticles() {

      ctx.clearRect(0, 0, w, h);
      const maxDist = 200;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {

          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > maxDist) continue;
          let alpha = (1 - dist / maxDist) * 0.18;
          let color = "120,120,120";

          if (mouse.active) {
            const dm1 = distance(mouse.x, mouse.y, p1.x, p1.y);
            const dm2 = distance(mouse.x, mouse.y, p2.x, p2.y);

            if (dm1 < 170 || dm2 < 170) {
              color = "0,255,65";
              alpha *= 2;
            }
          }

          ctx.strokeStyle = `rgba(${color},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      for (const p of particles) {
        let color = "140,140,140";
        let glow = "rgba(140,140,140,0.05)";

        if (mouse.active) {
          const dm = distance(mouse.x, mouse.y, p.x, p.y);

          if (dm < 170) {
            color = "0,255,65";
            const intensity = 1 - (dm / 170);
            glow = `rgba(0,255,65,${0.12 * intensity})`;
          }
        }

        ctx.beginPath();
        ctx.fillStyle = `rgb(${color})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= w) p.vx *= -1;
        if (p.y <= 0 || p.y >= h) p.vy *= -1;
      }

      if (mouse.active) {
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          140
        );

        gradient.addColorStop(0, "rgba(0,255,65,0.05)");
        gradient.addColorStop(1, "rgba(0,255,65,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 140, 0, Math.PI * 2);
        ctx.fill();
      }
      drawLightning();
      animFrame = requestAnimationFrame(drawParticles);
    }

    let netRunning = false;
    let netVisible = true;
    function netStart() {
      if (!netRunning && netVisible && !document.hidden) {
        netRunning = true;
        animFrame = requestAnimationFrame(drawParticles);
      }
    }
    function netStop() {
      if (netRunning) {
        netRunning = false;
        cancelAnimationFrame(animFrame);
        animFrame = 0;
      }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) netStop(); else netStart();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        netVisible = entries[0].isIntersecting;
        if (netVisible && !document.hidden) netStart(); else netStop();
      }, { threshold: 0 }).observe(canvas);
    }

    const section = canvas.parentElement;
    const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover) {
      section.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
      });

      section.addEventListener("mouseleave", () => {
        mouse.active = false;

      });
    }

    let lastW = 0, lastH = 0, rzTimer = 0;
    function doResize() {
      const nw = section.offsetWidth, nh = section.offsetHeight;
      if (!nw || !nh) return;
      if (nw === lastW && Math.abs(nh - lastH) < 120) return;
      const kw = lastW ? nw / lastW : 1, kh = lastH ? nh / lastH : 1;
      w = canvas.width = nw;
      h = canvas.height = nh;
      for (let i = 0; i < particles.length; i++) {
        particles[i].x = Math.min(Math.max(particles[i].x * kw, 0.5), nw - 0.5);
        particles[i].y = Math.min(Math.max(particles[i].y * kh, 0.5), nh - 0.5);
      }
      lastW = nw; lastH = nh;
    }
    doResize();
    createParticles();
    netStart();
    window.addEventListener("resize", () => {
      clearTimeout(rzTimer);
      rzTimer = setTimeout(function () { doResize(); netStart(); }, 180);
    });

  }

  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('a[data-section]');
  const sections = document.querySelectorAll('section[id], footer[id]');

  function updateNav() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    let current = 'home';
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150) {
        current = section.id;
      }
    }

    if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight - 10) {
      current = 'contato'; 
    }

    navLinks.forEach(function (link) {
      if (link.dataset.section === current) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });

    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
      });
    });
  }

  const animElements = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    animElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    animElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  const subtitleWrap = document.getElementById('hero-subtitle-wrap');
  if (subtitleWrap && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    subtitleWrap.addEventListener('mousemove', function (e) {
      const rect = subtitleWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      subtitleWrap.style.setProperty('--mask-x', x + 'px');
      subtitleWrap.style.setProperty('--mask-y', y + 'px');
    });
  }

  const typewriterEl = document.getElementById('typewriter');
  if (typewriterEl) {
    const phrases = [
      'root@4root:~$ infosec --community',
      'root@4root:~$ pentest --learn --share',
      'root@4root:~$ ctf --compete --grow',
      'root@4root:~$ osint --explore --discover',
      'root@4root:~$ rev --break --understand',
      'root@4root:~$ forensics --dig --trace',
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typeSpeed = 80;

    function typewrite() {
      const current = phrases[phraseIdx];
      if (isDeleting) {
        typewriterEl.textContent = current.substring(0, charIdx - 1) || '\u00A0';
        charIdx--;
        typeSpeed = 40;
      } else {
        typewriterEl.textContent = current.substring(0, charIdx + 1);
        charIdx++;
        typeSpeed = 80;
      }

      if (!isDeleting && charIdx === current.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        typeSpeed = 500;
      }

      setTimeout(typewrite, typeSpeed);
    }

    let twStarted = false;
    function startTypewriter() {
      if (twStarted) return;
      twStarted = true;
      typewrite();
    }
    document.addEventListener('4root:ready', startTypewriter);
    setTimeout(startTypewriter, 4500); 
  }
})();

document.addEventListener('contextmenu', function (event) {
  event.preventDefault();
});

document.addEventListener('selectstart', function (event) {
  if (
    event.target.tagName !== 'INPUT' &&
    event.target.tagName !== 'TEXTAREA' &&
    !event.target.isContentEditable
  ) {
    event.preventDefault();
  }
});

(function () {
  'use strict';
  const intro = document.getElementById('intro');
  const html = document.documentElement;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealSite() {
    html.classList.remove('intro-lock');
    html.classList.add('site-in');
    try { document.dispatchEvent(new CustomEvent('4root:ready')); } catch (e) { }
  }

  if (!intro) { revealSite(); return; }
  if (reduced) { intro.remove(); revealSite(); return; }

  html.classList.add('intro-lock');

  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem('r4_intro_seen', '1'); } catch (e) { }
    intro.classList.add('intro-exit');
    setTimeout(function () {
      intro.classList.add('intro-done');
      revealSite();
      dustStop();
      setTimeout(function () { if (intro.parentNode) intro.remove(); }, 900);
    }, 480);
  }

  setTimeout(finish, 6500);

  let burst = function () { };
  let dustStop = function () { };
  (function dust() {
    const cv = intro.querySelector('.intro-dust');
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0, raf = 0, last = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const COLORS = [[0, 255, 65], [0, 255, 65], [140, 255, 160], [0, 230, 60], [214, 255, 220]];
    const pts = [], sparks = [];
    const t0 = performance.now();

    function size() {
      W = cv.width = Math.max(2, Math.round(innerWidth * dpr));
      H = cv.height = Math.max(2, Math.round(innerHeight * dpr));
    }
    function spawn(init, dir) {
      const d = dir === 1 ? 1 : -1;
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : (d === 1 ? -12 * dpr : H + 12 * dpr),
        d: d,
        r: (0.8 + Math.random() * 2.0) * dpr,
        v: (14 + Math.random() * 34) * dpr,
        amp: (5 + Math.random() * 15) * dpr,
        f: 0.35 + Math.random(),
        ph: Math.random() * 6.2832,
        a: 0.18 + Math.random() * 0.44,
        tw: 0.7 + Math.random() * 2,
        c: c
      };
    }
    size();
    const area = Math.round(screen.width * screen.height);
    const NP = Math.max(70, Math.min(160, Math.round(area / 9200)));
    for (let i = 0; i < NP; i++) pts.push(spawn(true, i % 2 === 0 ? -1 : 1));

    let paused = document.hidden;
    document.addEventListener('visibilitychange', function () { paused = document.hidden; last = 0; });

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (paused) return;
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.y += p.d * p.v * dt;
        if (p.d === -1 && p.y < -14 * dpr) pts[i] = spawn(false, -1);
        else if (p.d === 1 && p.y > H + 14 * dpr) pts[i] = spawn(false, 1);
        const x = p.x + Math.sin(t * p.f + p.ph) * p.amp;
        const a = p.a * (0.55 + 0.45 * Math.sin(t * p.tw + p.ph * 2));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',' + a.toFixed(3) + ')';
        ctx.arc(x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.vx *= 0.984; s.vy *= 0.984;
        const k = s.life / s.max;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + s.c[0] + ',' + s.c[1] + ',' + s.c[2] + ',' + (k * 0.9).toFixed(3) + ')';
        ctx.arc(s.x, s.y, s.r * k + 0.3 * dpr, 0, 6.2832);
        ctx.fill();
      }
    }
    size();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', size, { passive: true });
    dustStop = function () { if (raf) cancelAnimationFrame(raf); raf = 0; };
    burst = function (cx, cy, n) {
      const x = cx * dpr, y = cy * dpr;
      const N = n || 40;
      for (let i = 0; i < N; i++) {
        const a = Math.random() * 6.2832;
        const sp = (60 + Math.random() * 160) * dpr;
        const life = 0.65 + Math.random() * 0.45;
        sparks.push({
          x: x, y: y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          r: (1.1 + Math.random() * 1.9) * dpr,
          life: life, max: life,
          c: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      }
    };
  })();

  const svg = document.getElementById('intro-text-svg');
  const core = document.getElementById('intro-core');
  const ringsSvg = document.getElementById('intro-rings');
  const mottoSvg = document.getElementById('intro-motto-svg');
  const skipBtn = document.getElementById('intro-skip');

  const seen = (function () {
    try { return sessionStorage.getItem('r4_intro_seen') === '1'; } catch (e) { return false; }
  })();

  skipBtn && skipBtn.addEventListener('click', finish);
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !finished) finish(); });

  try {
    const K = seen ? 0.55 : 1;

    function alignRings() {
      if (!core || !svg) return;
      const cr = core.getBoundingClientRect();
      const wr = svg.getBoundingClientRect();
      if (!cr.width || !wr.width) return;
      const dy = (wr.top + wr.height / 2) - (cr.top + cr.height / 2);
      core.style.setProperty('--wm-dy', dy.toFixed(1) + 'px');
    }
    window.addEventListener('resize', alignRings, { passive: true });

    const PLAN = [
      { sel: '.t-hash', delay: 0.26, dur: 0.46 },
      { sel: '.t-hash-b', delay: 0.64, dur: 0.11 },
      { sel: '.t-under', delay: 0.76, dur: 0.13 },
      { sel: '.t-four', delay: 0.9, dur: 0.32 },
      { sel: '.t-four-b', delay: 1.15, dur: 0.2 },
      { sel: '.t-root-t', delay: 0.26, dur: 0.36, rev: true },
      { sel: '.t-root-o2', delay: 0.55, dur: 0.26, rev: true },
      { sel: '.t-root-o1', delay: 0.74, dur: 0.26, rev: true },
      { sel: '.t-root-r', delay: 0.93, dur: 0.24, rev: true }
    ];

    PLAN.forEach(function (p) {
      const el = svg && svg.querySelector(p.sel);
      if (!el) return;
      let L = 600;
      try { L = el.getTotalLength() + 2; } catch (e) { }
      el.style.setProperty('--len', L.toFixed(1));
      if (p.rev) {
        el.classList.add('trace--rev');
        el.style.setProperty('--len-neg', (-L).toFixed(1));
      }
      el.style.setProperty('--delay', (p.delay * K).toFixed(2) + 's');
      el.style.setProperty('--dur', (p.dur * K).toFixed(2) + 's');
    });

    if (ringsSvg) {
      const arcs = ringsSvg.querySelectorAll('.ring-arc[data-arc]');
      arcs.forEach(function (r, i) {
        let C = 700;
        try { C = r.getTotalLength() + 2; } catch (e) { }
        const frac = parseFloat(r.getAttribute('data-frac') || '0.3');
        const arcLen = Math.max(6, C * frac);
        r.setAttribute('data-spin', r.getAttribute('data-spin') || '12s');
        r.style.setProperty('--spin', r.getAttribute('data-spin'));
        if (r.getAttribute('data-dir') === '-1') r.classList.add('spin-rev');
        r.style.strokeDasharray = '1 ' + C.toFixed(1);
        r.style.setProperty('--clen', C.toFixed(1));
        r.style.setProperty('--alen', arcLen.toFixed(1));
        r.style.setProperty('--astart', ((0.18 + i * 0.14) * K).toFixed(2) + 's');
      });
      const tArco = performance.now();
      (function growArcs(now) {
        const el = (now - tArco) / 1000; 
        let allDone = true;
        arcs.forEach(function (r) {
          const st = parseFloat(r.style.getPropertyValue('--astart')) || 0;
          const C = parseFloat(r.style.getPropertyValue('--clen')) || 700;
          const A = parseFloat(r.style.getPropertyValue('--alen')) || 200;
          const local = Math.max(0, Math.min(1, (el - st) / 1.1));
          const e = 1 - Math.pow(1 - local, 3); 
          r.style.strokeDasharray = Math.max(1, A * e).toFixed(1) + ' ' + C.toFixed(1);
          if (local < 1) allDone = false;
        });
        if (!allDone) requestAnimationFrame(growArcs);
      })(tArco);
    }

    const mTraces = mottoSvg ? mottoSvg.querySelectorAll('.m-trace') : [];
    const M_PLAN = [
      { dur: 0.144, delay: 0 },
      { dur: 0.336, delay: 0.04 },
      { dur: 0.12, delay: 0.32 },
      { dur: 0.336, delay: 0.376 },
      { dur: 0.12, delay: 0.656 },
      { dur: 0.336, delay: 0.712 },
      { dur: 0.144, delay: 0.992 }
    ];
    const mottoTraceEnd = 1.13;
    mTraces.forEach(function (el, i) {
      const p = M_PLAN[i] || { dur: 0.3, delay: 0 };
      let L = 400;
      try { L = el.getTotalLength() + 2; } catch (e) { }
      el.style.setProperty('--len', L.toFixed(1));
      el.style.setProperty('--delay', (p.delay * K).toFixed(2) + 's');
      el.style.setProperty('--dur', (p.dur * K).toFixed(2) + 's');
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        alignRings();
        intro.classList.add('go');
      });
    });

    const fillAt = Math.round((seen ? 0.9 : 1.5) * 1000);
    const waveAt = fillAt + 150;
    const mottoAt = Math.round(fillAt + 220 * K);
    const endAt = Math.round((seen ? 2.35 : 3.4) * 1000);

    const spawnEcho = function () {
      if (!svg || !core) return;
      const c = svg.cloneNode(true);
      c.removeAttribute('id');
      c.removeAttribute('aria-hidden');
      c.classList.remove('intro-text-svg');
      c.classList.add('intro-echo');
      core.appendChild(c);
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 1200);
    };

    setTimeout(function () { intro.classList.add('filled'); }, fillAt);

    setTimeout(function () {
      if (svg) {
        const r = svg.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, seen ? 24 : 52);
      } else {
        burst(innerWidth / 2, innerHeight / 2, seen ? 24 : 52);
      }
      spawnEcho();
      setTimeout(spawnEcho, 220);
    }, waveAt);

    setTimeout(function () { intro.classList.add('motto-go'); }, mottoAt);

    const solidAt = mottoAt + Math.round(mottoTraceEnd * 1000 * K);
    setTimeout(function () {
      intro.classList.add('motto-fill');
    }, solidAt);
    setTimeout(function () { intro.classList.add('motto-done'); }, solidAt + Math.round(420 * K));

    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      const layers = [
        { el: ringsSvg, f: 10 },
        { el: core.querySelector('.intro-glow'), f: 16 },
        { el: svg ? svg.parentNode : null, f: 5 }
      ].filter(function (l) { return l && l.el; });
      let px = 0, py = 0, tx = 0, ty = 0, pRaf = 0;
      const pTick = function () {
        px += (tx - px) * 0.06;
        py += (ty - py) * 0.06;
        layers.forEach(function (l) {
          l.el.style.translate = (px * l.f).toFixed(2) + 'px ' + (py * l.f).toFixed(2) + 'px';
        });
        if (Math.abs(tx - px) > 0.001 || Math.abs(ty - py) > 0.001) pRaf = requestAnimationFrame(pTick);
        else pRaf = 0;
      };
      intro.addEventListener('mousemove', function (e) {
        tx = (e.clientX / innerWidth - 0.5) * 2;
        ty = (e.clientY / innerHeight - 0.5) * 2;
        if (!pRaf) pRaf = requestAnimationFrame(pTick);
      }, { passive: true });
      const pClear = function () {
        tx = 0; ty = 0;
        if (!pRaf) pRaf = requestAnimationFrame(pTick);
      };
      intro.addEventListener('mouseleave', pClear, { passive: true });
    }

    setTimeout(finish, endAt);
  } catch (err) {
    finish();
  }
})();

(function () {
  'use strict';
  const mq = document.querySelector('.marquee');
  if (!mq || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      mq.classList.toggle('marquee--off', !e.isIntersecting);
    });
  }, { threshold: 0 }).observe(mq);
})();
(function () {
  'use strict';
  const progress = document.getElementById('scroll-progress');
  const backTop = document.getElementById('back-top');

  function onScroll() {
    const doc = document.documentElement;
    const max = Math.max(1, (doc.scrollHeight - window.innerHeight));
    if (progress) progress.style.width = Math.min(100, (window.scrollY / max) * 100) + '%';
    if (backTop) backTop.classList.toggle('show', window.scrollY > 600);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();

(function () {
  'use strict';
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  document.querySelectorAll('.manifesto-card, .challenge-card, .tool-card, .social-card').forEach(function (c) {
    c.classList.add('spot');
  });

  if (finePointer && !reduced) {
    document.addEventListener('pointermove', function (e) {
      const card = e.target && e.target.closest && e.target.closest('.spot');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    document.querySelectorAll('.member-card').forEach(function (card) {
      const img = card.querySelector('img');
      if (!img) return;
      card.addEventListener('pointermove', function (e) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = 'perspective(600px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 7).toFixed(2) + 'deg) scale(1.08)';
      });
      card.addEventListener('pointerleave', function () {
        img.style.transform = '';
      });
    });
  }
})();

(function () {
  'use strict';

  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const escapeHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s]/g, ' ');
  }

  function renderRich(text) {
    const links = [];
    let src = escapeHtml(text);
    src = src.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    src = src.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, function (m, t, u) {
      links.push('<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>');
      return '\x00' + (links.length - 1) + '\x00';
    });
    src = src.replace(/\x00(\d+)\x00/g, function (m, i) { return links[+i]; });
    return src.replace(/\n/g, '<br>');
  }

  const U_DISC  = "https://discord.gg/Aw4F6qXS4N";
  const U_YT    = "https://www.youtube.com/@4rootcommunity";
  const U_YTSUB = "https://www.youtube.com/@4rootcommunity?sub_confirmation=1";
  const U_LI    = "https://www.linkedin.com/company/4root";
  const U_IG    = "https://www.instagram.com/4root_community";
  const U_FORM_VAGA = "https://forms.gle/RoVxXp863fwdH1tx6";
  const U_FORM_TALK = "https://forms.gle/DvirpKtr2vg2cM9h8";
  const U_VID   = "https://www.youtube.com/watch?v=ULNX2MVzY8w";

  const SIG = "\n\n**redes oficiais da #_4root:** [Discord](" + U_DISC + ") · [YouTube](" + U_YT + ") · [LinkedIn](" + U_LI + ") · [Instagram](" + U_IG + ")";
  const sig = t => t + SIG;

  const A_ABOUT = sig("A **#_4root** é uma comunidade de **cibersegurança e hacking** voltada à troca de conhecimento, pesquisa e desenvolvimento técnico. Conectamos profissionais, estudantes e entusiastas por meio de **talks, eventos, CTFs** e iniciativas colaborativas em **segurança ofensiva, CTI e OSINT**. Nosso lema: **break // learn // share**. Site: [4root.com.br](https://4root.com.br/)");
  const A_MOTTO = sig("Nosso lema é **[ break // learn // share ]**:\n- **break** — desmonta, faz engenharia reversa, entende como funciona por dentro\n- **learn** — absorve o conhecimento que existe abaixo da superfície\n- **share** — devolve pra comunidade em writeups, talks e mentorias\nÉ o espírito da raiz — e aparece no topo do site e no marquee.");
  const A_JOIN = sig("O coração da comunidade é o nosso **Discord** — o quartel-general: talks, mentorias, CTFs em grupo, **tickets de flag** e os avisos que não saem do servidor. Entra aqui: [discord.gg/Aw4F6qXS4N](" + U_DISC + "). É **grátis**, **todo nível é bem-vindo** e **sem hierarquia** — do iniciante ao veterano.");
  const A_EVENT = sig("O próximo evento é o **#_4root WebTalk2026** — dias **17 e 18/11/2026, das 19:30 às 21:30 (Brasília)**, **online e gratuito**, ao vivo no **YouTube**. A dinâmica: cada noite roda **3 talks de 30 minutos + 10 minutos de perguntas** com a comunidade. Garanta sua vaga: [formulário de inscrição](" + U_FORM_VAGA + ") — e [ative o lembrete](" + U_YTSUB + ") pra não perder nada!");
  const A_SCHED = sig("O **WebTalk2026** acontece em **duas noites** — 17 e 18/11, sempre das **19:30 às 21:30 (Brasília)** — ao vivo no **YouTube** da #_4root. Cada noite tem **3 talks de 30 minutos + 10 minutos de perguntas**. A grade atualizada:\n- **17/11 · 19:30** — **Em breve**\n- **17/11 · 20:10** — **Em breve**\n- **17/11 · 20:50** — **Em breve**\n- **18/11 · 19:30** — **Em breve**\n- **18/11 · 20:10** — **Pedro Tenório** (SERPRO) — \"Medindo a Soberania Digital\"\n- **18/11 · 20:50** — **Em breve**\nOs detalhes dos demais palestrantes serão divulgados em breve. Clica em um horário na seção **Eventos** para consultar as informações disponíveis.");
  const A_SPEAK = sig("Quer **palestrar** no WebTalk2026 (ou nos próximos eventos)? Manda sua proposta no formulário: [Gostaria de palestrar?](" + U_FORM_TALK + "). Cada talk ocupa um bloco de **40 min — 30 de talk + 10 de perguntas** — dentro da janela das **19:30 às 21:30**. Talks sobre hacking, cibersegurança, OSINT, CTI, red/blue team: **todo nível é bem-vindo**.");
  const A_CTF = sig("Temos **CTFs públicos** na seção **Desafios** do site:\n- **CTF-001 · RAYX CTF** — criptografia e esteganografia · 100 pts · fácil\n- **CTF-002 · #_4ROOT+DARTH CTF** — engenharia reversa, stego e forense · 500 pts · difícil\n- **CTF-003 · OSINT CTF** — em breve · 300 pts · médio\nBaixa os arquivos clicando no card do desafio e resolve. **O submit da flag é só abrir um ticket no nosso Discord** — a equipe confere e pontua por lá. Detalhes? Pergunta 'como envio a flag'.");
  const A_FLAG = sig("**O submit de flag é só abrir um ticket no nosso Discord**: entra em [discord.gg/Aw4F6qXS4N](" + U_DISC + "), abre um **ticket** e manda a flag do desafio por lá. A equipe confere, pontua e responde no próprio ticket — sem formulário e sem e-mail. Vale pra todos os CTFs: **RAYX**, **#_4ROOT+DARTH** e os que vêm aí.");
  const A_MEMBERS = sig("Os **operadores ativos** da rede (4 nós):\n- **@Maarckz** — Threat Intelligence & Threat Research — [maarckz.github.io](https://maarckz.github.io)\n- **@4rch3on** — Threat Intelligence & OSINT — [LinkedIn](https://www.linkedin.com/in/alyson-dutra/)\n- **@4n0rak** — Network & Cyber Defense — [LinkedIn](https://www.linkedin.com/in/rfernandes72/)\n- **@N0xV3ct0R** — Crypto & Pwn — [LinkedIn](https://www.linkedin.com/in/lucas-diniz-980a1230a/)");
  const A_YT = sig("Todo o conteúdo da #_4root vive no **YouTube** — talks, lives e eventos: [youtube.com/@4rootcommunity](" + U_YT + "). Último vídeo: [#_4root: comunidade hacker em Brasília](" + U_VID + "). O **WebTalk2026 vai ao ar lá** — [se inscreve e ativa o lembrete](" + U_YTSUB + ") pra não perder nada!");
  const A_PARTNERS = sig("Patrocinadores e apoiadores passam em **dois carrosséis** na seção **Networks**:\n- **Patrocinadores** — Prodigium Academy, HexaCore Security, NullByte Labs, Sentinela Tech, VetorZero Cloud e BitWise Defense\n- **Apoiadores** — RioCyberSec, Chapéu de Palha Hacker Club, BSidesBSB, GYNSEC, Formming Hackers e TecSec\nQuer apoiar ou patrocinar o projeto? Chama a gente no **Discord**!");
  const A_CONTACT = "Canais oficiais da **#_4root** — todas as redes:\n- **Discord** — [discord.gg/Aw4F6qXS4N](" + U_DISC + ")\n- **YouTube** — [@4rootcommunity](" + U_YT + ")\n- **LinkedIn** — [/company/4root](" + U_LI + ")\n- **Instagram** — [@4root_community](" + U_IG + ")\nEscolhe por onde falar com a gente e faz parte do coletivo!";
  const A_NAV = sig("O site tem 6 seções:\n- **Comunidade** — kernel manifest + membros\n- **Eventos** — WebTalk2026 + cronograma\n- **YouTube** — conteúdo e evento ao vivo\n- **Networks** — parceiros e apoiadores\n- **Desafios** — CTFs da comunidade\n- **Contato** — Discord + redes oficiais\nNavega pelo menu do topo — ou me pergunta sobre qualquer seção!");
  const A_MANIFESTO = sig("Nosso **Kernel manifest** tem 4 princípios:\n1. **Acesso Root** — não nos contentamos com a superfície: estudamos, desmontamos e reconstruímos tecnologias\n2. **Curiosidade Radical** — 'como isso funciona?' é o nosso ponto de partida\n3. **Ética do Hacker** — poder exige responsabilidade; aprendemos a atacar para saber defender\n4. **Coletivo > Ego** — writeups abertos, mentorias e CTFs em grupo: cada nó torna o próximo mais forte");
  const A_BOT = "Eu sou o **RootBot**, guia oficial do site da **#_4root**. Não sou uma IA de verdade — rodo 100% no seu navegador e conheço **todo o conteúdo do site**: comunidade, manifesto, membros, **evento e cronograma**, **CTFs e envio de flag**, **YouTube**, **parceiros**, **redes** e **contato**.";
  const A_HELP = "Posso falar sobre **tudo que está no site**:\n- **a comunidade** e o **kernel manifest**\n- **membros** (operadores ativos)\n- **evento** WebTalk2026 e o **cronograma**\n- **CTFs** e **como enviar a flag** (ticket no Discord)\n- **YouTube** e conteúdo\n- **parceiros** e como **apoiar**\n- **palestrar** em um evento\n- **redes oficiais** e **contato**\nTambém aceito um 'oi' ou uma piada. ;)";
  const A_FALL = "Essa eu não sei ainda. Tenta perguntar sobre: **comunidade**, **manifesto**, **membros**, **evento/cronograma**, **CTFs**, **envio de flag**, **YouTube**, **parceiros**, **palestrar** ou **contato/redes**!" + SIG;
  const A_JOKE = "Clássica da área: existem **10 tipos de pessoas** — as que entendem binário e as que não entendem. E as que entendem ternário: as que não entendem binário e as que não entendem ternário. ;)";
  const A_THX = "Por nada! Não esquece: **break // learn // share**. Nos vemos na rede." + SIG;
  const A_HI = "Salve! Bem-vindo à raiz. Quer saber sobre a **comunidade**, o **WebTalk2026** (e o **cronograma**), os **CTFs** — e **como enviar a flag** — ou as **redes oficiais**?";

  const RULES = [
    [/(flag|ticket|submit|submeter|entreg|onde envio|envio a flag|pontuac)/, A_FLAG],
    [/(cronograma|agenda|grade|horario|programacao|dia 17|dia 18|17 de novembro|18 de novembro|o que vai ter no evento|dinamica|como funciona o evento|duracao|quantos minutos|formato do evento|pedro tenorio|serpro|soberania|nist|quem vai palestrar|quem sao os palestrantes|palestrantes confirmados|grade completa|marina|castellani|rafael|montenegro|bianca|ferraz|diego|sampaio|leticia|nogueira|phishing|zero trust|blue team|mitre|att ?ck|osint sem limites)/, A_SCHED],
    [/(palestrar|palestrante|apresentar|dar uma talk|minha talk|ser palestr|submeter palestra)/, A_SPEAK],
    [/(webtalk|proximo evento|prox evento|evento|palestra|talk|inscric|garantir vaga|vaga|quando acontece|quando vai ser)/, A_EVENT],
    [/(ctf|desafio|capture the flag|pwn|exploit|stego|steagan|forense|reverse|reversa|cripto|crypto|osint|pontos|rayx|darth)/, A_CTF],
    [/(youtube|video|canal|conteudo|aula|curso|gravac|inscrever|live)/, A_YT],
    [/(quem e voce|voce e um|voce e o|voce e real|e um bot|e robo|chatbot|seu nome|rootbot|quem e o bot|\bia\b|robo)/, A_BOT],
    [/(membro|equipe|quem sao os|operador|time|fundador|admin|maarckz|4rch3on|4n0rak|n0xv)/, A_MEMBERS],
    [/(parceiro|patrocin|apoiador|apoiar|prodigium|rio ?cyber|chapeu de palha|hexacore|nullbyte|sentinela|vetorzero|bitwise|network|doar|doacao|support)/, A_PARTNERS],
    [/(manifesto|kernel|etica|valor|principio|regra|acesso root|curiosidade|coletivo)/, A_MANIFESTO],
    [/(motto|lema|slogan|break\s+learn)/, A_MOTTO],
    [/(discord|entrar|participar|join|servidor|convite|invite|comunidade do discord)/, A_JOIN],
    [/(contato|redes|social|instagram|linkedin|email|e ?mail|falar com|seguir)/, A_CONTACT],
    [/(secoes|secao|onde fica|navega|parte do site|mapa do site|estrutura do site)/, A_NAV],
    [/(ajuda|help|o que voce (faz|pode|sabe)|opcoes|menu|assuntos|topicos|sabe falar)/, A_HELP],
    [/(piada|engracad|zoeira|humor|joke)/, A_JOKE],
    [/(obrigad|valeu|vlw|brigad|thanks|thank you|grato|tmj)/, A_THX],
    [/(sobre|oque e|o que e|oque|4root|comunidade|quem sao voces|histo|objetivo|proposito|raiz)/, A_ABOUT],
    [/(^|\s)(oi|ola|opa|hey|hello|hi|salve|eai|e ai|bom dia|boa tarde|boa noite|fala)(\s|$)/, A_HI]
  ];

  function answer(q) {
    const t = norm(q);
    if (!t) return A_FALL;
    for (let i = 0; i < RULES.length; i++) {
      if (RULES[i][0].test(t)) return RULES[i][1];
    }
    return A_FALL;
  }

  const LS_HIST = 'r4_bot_hist_v13'; 
  const LS_DOCK = 'r4_bot_dock_v1';
  const LS_TIP = 'r4_bot_tip_v1';

  const dot = document.getElementById('bot-dot');
  const goo = document.getElementById('bot-goo');
  const blob = goo ? goo.querySelector('.bot-blob') : null;
  const trail = goo ? goo.querySelector('.bot-trail') : null;
  const panel = document.getElementById('bot-panel');
  const msgsEl = document.getElementById('bot-msgs');
  const chipsEl = document.getElementById('bot-chips');
  const input = document.getElementById('bot-input');
  const sendBtn = document.getElementById('bot-send');
  const closeBtn = document.getElementById('bot-close');
  const clearBtn = document.getElementById('bot-clear');
  const tipEl = document.getElementById('bot-tip');

  if (!dot || !panel || !msgsEl) return;

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.innerWidth <= 620;

  let open = false, live = false, pending = false;
  let history = [];
  const P = { x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, ex: 0, ey: 0, svx: 0, svy: 0, squash: 0, enter: 0, enterT: 0, hover: 0, hoverT: 0, dragging: false, side: 'right', vw: 1, vh: 1, open: false };
  const M = 26;
  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const edgeX = side => side === 'left' ? M : P.vw - M;

  function loadHist() {
    try {
      const raw = localStorage.getItem(LS_HIST);
      history = raw ? (JSON.parse(raw) || []) : [];
      if (!Array.isArray(history)) history = [];
    } catch (e) { history = []; }
  }
  function saveHist() {
    try { localStorage.setItem(LS_HIST, JSON.stringify(history.slice(-24))); } catch (e) { }
  }

  function restoreDock() {
    P.vw = Math.max(1, window.innerWidth);
    const vv = window.visualViewport;
    const vh = vv ? vv.height : window.innerHeight;
    const offTop = vv ? vv.offsetTop : 0;
    P.vh = Math.max(1, vh);
    P.side = 'right';
    let yr = 0.72;
    try {
      const raw = localStorage.getItem(LS_DOCK);
      if (raw) {
        const j = JSON.parse(raw);
        if (j && (j.side === 'left' || j.side === 'right')) P.side = j.side;
        if (j && typeof j.yr === 'number') yr = clamp(j.yr, 0.08, 0.92);
      }
    } catch (e) { }
    P.x = P.tx = edgeX(P.side);
    P.y = P.ty = clamp(vh * yr + offTop, M, vh + offTop - M);
    P.px = P.x; P.py = P.y; P.ex = P.x; P.ey = P.y;
  }
  function saveDock() {
    try { localStorage.setItem(LS_DOCK, JSON.stringify({ side: P.side, yr: +(P.y / Math.max(1, P.vh)).toFixed(3) })); } catch (e) { }
  }
  function dock() {
    P.side = P.x < P.vw / 2 ? 'left' : 'right';
    P.tx = edgeX(P.side);
    P.ty = clamp(P.y, M, P.vh - M);
    saveDock();
  }

  function loop() {
    if (document.hidden) { requestAnimationFrame(loop); return; }
    P.enter += (P.enterT - P.enter) * 0.11;
    if (P.enter < 0.001 && P.enterT === 0) P.enter = 0;
    const gOp = P.enter < 0.01 ? 0 : Math.min(1, P.enter * 1.25);
    if (goo.classList.contains('inactive')) {
      if (P._go !== 0.5) { P._go = 0.5; goo.style.opacity = 0.5; goo.style.visibility = 'visible'; }
    } else if (gOp !== P._go) {
      P._go = gOp; goo.style.opacity = gOp; goo.style.visibility = gOp === 0 ? 'hidden' : 'visible';
    }
    P.hover += (P.hoverT - P.hover) * 0.15;
    if (!P.dragging) { P.x += (P.tx - P.x) * 0.16; P.y += (P.ty - P.y) * 0.16; }
    const dx = P.x - P.px, dy = P.y - P.py;
    P.px = P.x; P.py = P.y;
    P.svx += (dx - P.svx) * 0.28;
    P.svy += (dy - P.svy) * 0.28;
    if (!P.dragging) {
      const dxE = P.tx - P.x;
      if (Math.abs(dxE) < 2 && Math.abs(P.svx) > 3 && P.squash < 0.2) P.squash = 1;
    }
    P.squash *= 0.86;
    P.ex += (P.x - P.ex) * 0.22;
    P.ey += (P.y - P.ey) * 0.22;
    let tdx = P.ex - P.x, tdy = P.ey - P.y;
    const tlen0 = Math.hypot(tdx, tdy);
    if (tlen0 > 170) { tdx *= 170 / tlen0; tdy *= 170 / tlen0; P.ex = P.x + tdx; P.ey = P.y + tdy; }
    const tlen = Math.hypot(P.ex - P.x, P.ey - P.y);
    const es = P.enter * (1 + P.hover * 0.12);
    const sp = Math.hypot(P.svx, P.svy);
    const st = Math.min(sp * 0.045, 0.85);
    const settled = sp < 0.01 && !P.dragging && P.squash < 0.01 && Math.abs(P.tx - P.x) < 0.5 && Math.abs(P.ty - P.y) < 0.5;
    const sx = (1 + st) * es * (1 - P.squash * 0.3);
    const sy = Math.max(0.35, 1 - st * 0.6) * es * (1 + P.squash * 0.38);
    const bT = settled
      ? 'rotate(0rad) scale(' + es.toFixed(3) + ',' + Math.max(0.35, es).toFixed(3) + ')'
      : 'rotate(' + Math.atan2(P.svy, P.svx).toFixed(3) + 'rad) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
    if (blob && bT !== P._bt) { P._bt = bT; blob.style.transform = bT; }
    const tst = Math.min(tlen * 0.02, 0.9);
    const tsx = (1 + tst) * P.enter;
    const tsy = Math.max(0.3, 1 - tst * 0.55) * P.enter;
    const tT = settled
      ? 'scale(' + P.enter.toFixed(3) + ',' + P.enter.toFixed(3) + ')'
      : 'translate(' + tdx.toFixed(1) + 'px,' + tdy.toFixed(1) + 'px) rotate(' + Math.atan2(tdy, tdx).toFixed(3) + 'rad) scale(' + tsx.toFixed(3) + ',' + tsy.toFixed(3) + ')';
    if (trail && tT !== P._tt) { P._tt = tT; trail.style.transform = tT; }
    const gT = 'translate(' + (P.x - 240).toFixed(1) + 'px,' + (P.y - 240).toFixed(1) + 'px)';
    if (gT !== P._gt) { P._gt = gT; goo.style.transform = gT; }
    const dT = 'translate(' + P.x.toFixed(1) + 'px,' + P.y.toFixed(1) + 'px)';
    if (dT !== P._dt) { P._dt = dT; dot.style.transform = dT; }
    if (tipEl && tipEl.classList.contains('bot-tip-in')) placeTip();
    requestAnimationFrame(loop);
  }

  function addMsg(cls, html, text) {
    const d = document.createElement('div');
    d.className = 'msg ' + cls;
    if (cls === 'msg--user') d.textContent = text;
    else d.innerHTML = html;
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return d;
  }
  function showTyping() {
    const d = document.createElement('div');
    d.className = 'msg msg--bot msg--typing';
    d.innerHTML = '<span></span><span></span><span></span>';
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return d;
  }
  function renderChips() {
    if (!chipsEl) return;
    chipsEl.innerHTML = '';
    ["O que é a #_4root?", "Como entro no Discord?", "Próximo evento?", "Cronograma completo", "Como envio a flag do CTF?", "Onde tem conteúdo?", "Quero palestrar!", "Redes oficiais"].forEach(function (c) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bot-chip';
      b.textContent = c;
      b.addEventListener('click', function () { send(c); });
      chipsEl.appendChild(b);
    });
  }

  function send(forcedText) {
    if (pending) return;
    const text = clean(forcedText || input.value);
    if (!text) return;
    if (!forcedText) input.value = '';
    addMsg('msg--user', '', text);
    history.push({ role: 'user', content: text });
    saveHist();
    pending = true;
    if (sendBtn) sendBtn.disabled = true;
    const t = showTyping();
    const delay = reduced ? 150 : (650 + Math.random() * 550);
    setTimeout(function () {
      if (t.parentNode) t.remove();
      const a = answer(text);
      addMsg('msg--bot', renderRich(a));
      history.push({ role: 'bot', content: a });
      saveHist();
      pending = false;
      if (sendBtn) sendBtn.disabled = false;
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }, delay);
  }

  function placePanel() {
    if (window.innerWidth <= 620) return;
    const h = panel.offsetHeight || 560;
    const half = h / 2 + 14;
    panel.style.top = clamp(P.y, half, Math.max(half, P.vh - half)).toFixed(0) + 'px';
  }
  function openPanel() {
    if (open) return;
    open = true; P.open = true; P.enterT = 0;
    panel.classList.toggle('side-left', P.side === 'left');
    placePanel();
    panel.classList.add('bot-open');
    panel.setAttribute('aria-hidden', 'false');
    dot.classList.add('is-open');
    dot.style.pointerEvents = 'none';
    if (goo) goo.classList.add('bot-goo-hidden');
    if (tipEl) tipEl.classList.remove('bot-tip-in');
    try { localStorage.setItem(LS_TIP, '1'); } catch (e) { }
    if (!msgsEl.childElementCount) {
      loadHist();
      if (history.length) {
        history.forEach(function (m) {
          addMsg(m.role === 'user' ? 'msg--user' : 'msg--bot', m.role === 'user' ? '' : renderRich(m.content), m.content);
        });
      } else {
        const w = "Olá! Eu sou o **RootBot**, guia da comunidade — e conheço **todo o conteúdo do site**: comunidade, manifesto, membros, **WebTalk2026** (dias, horários e a **dinâmica das talks**), **CTFs** (e **como enviar a flag**: ticket no Discord), **YouTube**, **parceiros** e **redes/contato**. O que você quer saber?";
        addMsg('msg--bot', renderRich(w));
        history.push({ role: 'bot', content: w });
        saveHist();
      }
      renderChips();
    }
    if (!isMobile()) {
      setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) { } }, 320);
    }
  }
  function closePanel() {
    if (!open) return;
    open = false; P.open = false; P.enterT = 1;
    panel.classList.remove('bot-open');
    panel.classList.remove('kb-open');
    panel.style.removeProperty('--kb');
    panel.style.removeProperty('--vvh');
    panel.setAttribute('aria-hidden', 'true');
    dot.classList.remove('is-open');
    dot.style.pointerEvents = 'auto';
    if (goo) goo.classList.remove('bot-goo-hidden');
  }
  function togglePanel() { if (open) closePanel(); else openPanel(); }

  const drag = { offX: 0, offY: 0, moved: 0, id: null };
  function onDown(e) {
    if (!live || P.open || P.dragging) return;
    P.dragging = true; drag.moved = 0; drag.id = e.pointerId;
    drag.offX = e.clientX - P.x; drag.offY = e.clientY - P.y;
    try { dot.setPointerCapture(e.pointerId); } catch (err) { }
    e.preventDefault();
  }
  function onMove(e) {
    if (!P.dragging || e.pointerId !== drag.id) return;
    const nx = clamp(e.clientX - drag.offX, M, P.vw - M);
    const ny = clamp(e.clientY - drag.offY, M, P.vh - M);
    drag.moved += Math.abs(nx - P.x) + Math.abs(ny - P.y);
    P.x = P.tx = nx; P.y = P.ty = ny;
    e.preventDefault();
  }
  function onUp(e) {
    if (!P.dragging || e.pointerId !== drag.id) return;
    P.dragging = false; drag.id = null;
    if (drag.moved < 8) {
      if (navigator.vibrate) try { navigator.vibrate(6); } catch (_) { }
      togglePanel();
    } else {
      dock();
    }
  }
  dot.addEventListener('pointerdown', onDown);
  dot.addEventListener('pointermove', onMove);
  dot.addEventListener('pointerup', onUp);
  dot.addEventListener('pointercancel', onUp);
  dot.addEventListener('mouseenter', function () { P.hoverT = 1; });
  dot.addEventListener('mouseleave', function () { P.hoverT = 0; });
  dot.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  closeBtn && closeBtn.addEventListener('click', closePanel);
  clearBtn && clearBtn.addEventListener('click', function () {
    history = [];
    saveHist();
    msgsEl.innerHTML = '';
    addMsg('msg--bot', renderRich("Histórico limpo. Sobre o que você quer falar agora?"));
    renderChips();
  });
  sendBtn && sendBtn.addEventListener('click', function () { send(); });
  input && input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); send(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) closePanel();
  });
  document.addEventListener('pointerdown', function (e) {
    if (open && !panel.contains(e.target) && !dot.contains(e.target)) closePanel();
  }, true);

  window.addEventListener('resize', function () {
    P.vw = Math.max(1, window.innerWidth);
    const vv = window.visualViewport;
    P.vh = Math.max(1, vv ? vv.height : window.innerHeight);
    P.tx = edgeX(P.side);
    P.ty = clamp(P.ty, M, P.vh - M);
    P.y = clamp(P.y, M, P.vh - M);
    P.x = clamp(P.x, M, P.vw - M);
    if (open) placePanel();
  }, { passive: true });

  (function keyboardWatch() {
    const vv = window.visualViewport;
    if (!vv) return;
    let kbRaf = 0;
    const apply = function () {
      kbRaf = 0;
      if (!open || window.innerWidth > 620) return;
      const kbH = Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)));
      if (kbH > 80) {
        panel.style.setProperty('--kb', kbH + 'px');
        panel.style.setProperty('--vvh', Math.round(vv.height) + 'px');
        panel.classList.add('kb-open');
      } else {
        panel.classList.remove('kb-open');
        panel.style.removeProperty('--kb');
        panel.style.removeProperty('--vvh');
      }
      msgsEl.scrollTop = msgsEl.scrollHeight;
    };
    const schedule = function () { if (!kbRaf) kbRaf = requestAnimationFrame(apply); };
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    input && input.addEventListener('focus', function () {
      setTimeout(apply, 80);
      setTimeout(apply, 420);
      setTimeout(apply, 900);
    });
  })();

  function placeTip() {
    if (!tipEl) return;
    tipEl.style.top = P.y + 'px';
    tipEl.style.transform = 'translateY(-50%)';
    if (P.side === 'right') { tipEl.style.right = (P.vw - P.x + 42) + 'px'; tipEl.style.left = 'auto'; }
    else { tipEl.style.left = (P.x + 42) + 'px'; tipEl.style.right = 'auto'; }
  }

  let lastActivity = Date.now();
  const resetActivity = function () {
    lastActivity = Date.now();
    if (dot && !open && !P.dragging) dot.classList.remove('inactive');
    if (goo && !open && !P.dragging) goo.classList.remove('inactive');
  };
  document.addEventListener('mousemove', resetActivity, { passive: true });
  document.addEventListener('touchstart', resetActivity, { passive: true });
  document.addEventListener('keydown', resetActivity, { passive: true });
  document.addEventListener('scroll', resetActivity, { passive: true });
  setInterval(function () {
    if (open || P.dragging) {
      lastActivity = Date.now();
      if (dot) dot.classList.remove('inactive');
      if (goo) goo.classList.remove('inactive');
      return;
    }
    if (Date.now() - lastActivity > 3000) {
      if (dot) dot.classList.add('inactive');
      if (goo) goo.classList.add('inactive');
    }
  }, 1000);

  function entrance() {
    if (live) return;
    setTimeout(function () {
      live = true;
      P.enterT = 1;
      P.enter = 1;
      if (goo) { goo.style.opacity = 1; goo.style.visibility = 'visible'; P._go = 1; }
      let shown = false;
      try { shown = localStorage.getItem(LS_TIP) === '1'; } catch (e) { }
      if (!shown && tipEl) {
        setTimeout(function () {
          if (!open) {
            placeTip();
            tipEl.classList.add('bot-tip-in');
            setTimeout(function () { tipEl.classList.remove('bot-tip-in'); }, 6500);
          }
        }, 1200);
      }
    }, 350);
  }
  if (document.documentElement.classList.contains('site-in')) entrance();
  else {
    document.addEventListener('4root:ready', entrance, { once: true });
    setTimeout(entrance, 5000); 
  }

  restoreDock();
  requestAnimationFrame(loop);
})(); 

(function () {
  'use strict';

  const facade = document.getElementById('yt-facade');
  if (facade) {
    facade.addEventListener('click', function (e) {
      const id = facade.getAttribute('data-video');
      if (!id || facade.classList.contains('playing')) return;

      if (location.protocol !== 'https:' && location.protocol !== 'http:') {
        window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener');
        return;
      }

      e.preventDefault();
      const frame = document.createElement('iframe');
      frame.className = 'yt-iframe';
      let src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      try {
        if (location.origin && location.origin !== 'null') {
          src += '&origin=' + encodeURIComponent(location.origin);
        }
      } catch (err) { }
      frame.src = src;
      frame.title = 'Vídeo da #_4root no YouTube';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      facade.appendChild(frame);
      facade.classList.add('playing');
    });
  }

  const dd = document.getElementById('yt-dd');
  const hh = document.getElementById('yt-hh');
  const mm = document.getElementById('yt-mm');
  const ss = document.getElementById('yt-ss');
  const target = new Date('2026-11-17T19:30:00-03:00').getTime();

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function tickCount() {
    if (!dd) return;
    const diff = target - Date.now();
    if (diff <= 0) {
      dd.textContent = '00';
      if (hh) hh.textContent = '00';
      if (mm) mm.textContent = '00';
      if (ss) ss.textContent = '00';
      const lbl = document.querySelector('.yt-event-label');
      if (lbl) lbl.textContent = 'ao ar agora no youtube';
      return;
    }
    const s = Math.floor(diff / 1000);
    dd.textContent = pad(Math.floor(s / 86400));
    if (hh) hh.textContent = pad(Math.floor((s % 86400) / 3600));
    if (mm) mm.textContent = pad(Math.floor((s % 3600) / 60));
    if (ss) ss.textContent = pad(s % 60);
    setTimeout(tickCount, 1000);
  }
  tickCount();

  const ytFacade = document.querySelector('.yt-facade');
  const ytEventCard = document.querySelector('.yt-event-card');

  function syncYtCard() {
    if (!ytFacade || !ytEventCard) return;
    if (window.innerWidth <= 1023) {
      ytEventCard.style.height = '';
      const img = ytFacade.querySelector('img');
      if (img) img.style.height = '';
      return;
    }
    ytEventCard.style.height = '';
    const img = ytFacade.querySelector('img');
    if (img) img.style.height = '';
    const facadeH = ytFacade.getBoundingClientRect().height;
    const needH = ytEventCard.scrollHeight;
    const h = Math.round(Math.max(facadeH, needH));
    ytEventCard.style.height = h + 'px';
    if (img) img.style.height = h + 'px';
  }

  window.addEventListener('resize', syncYtCard, { passive: true });
  window.addEventListener('load', syncYtCard);
  window.addEventListener('orientationchange', syncYtCard);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncYtCard);
  syncYtCard();
  setTimeout(syncYtCard, 600);
})();

(function () {
  'use strict';
  const card = document.getElementById('discord-card');
  if (!card || typeof window.fetch !== 'function') return;

  const guild = card.getAttribute('data-guild');
  const statusEl = document.getElementById('discord-status');
  const facesEl = document.getElementById('discord-faces');
  const moreEl = document.getElementById('discord-more');
  if (!guild || !facesEl) return;

  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 3500) : null;

  fetch('https://discord.com/api/guilds/' + guild + '/widget.json', ctrl ? { signal: ctrl.signal } : undefined)
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('http ' + r.status)); })
    .then(function (d) {
      if (timer) clearTimeout(timer);
      if (!d) return;
      const n = d.presence_count || 0;

      if (statusEl && n) {
        statusEl.textContent = '';
        const dot = document.createElement('i');
        dot.className = 'st on';
        dot.setAttribute('aria-hidden', 'true');
        statusEl.appendChild(dot);
        statusEl.appendChild(document.createTextNode(n + ' online agora'));
      }

      const members = Array.isArray(d.members) ? d.members : [];
      if (!members.length) return;

      const humans = members.filter(function (m) {
        return !/bot|rss|thread/i.test((m.username || '') + '');
      });
      const list = (humans.length ? humans : members).slice(0, 4);

      facesEl.textContent = '';
      list.forEach(function (m) {
        const li = document.createElement('li');
        li.title = m.username || 'membro';
        if (m.avatar_url) {
          const img = document.createElement('img');
          img.src = m.avatar_url;
          img.alt = '';
                li.appendChild(img);
        } else {
          const sp = document.createElement('span');
          sp.className = 'face';
          sp.textContent = (((m.username || '?').trim()[0]) || '?').toUpperCase();
          li.appendChild(sp);
        }
        const st = document.createElement('i');
        st.className = 'st ' + (m.status === 'idle' ? 'idle' : 'on');
        st.setAttribute('aria-hidden', 'true');
        li.appendChild(st);
        facesEl.appendChild(li);
      });

      if (moreEl) {
        moreEl.textContent = '+' + Math.max(0, n - list.length);
        facesEl.appendChild(moreEl);
      }
    })
    .catch(function () {  });
})();

(function () {
  'use strict';
  const card = document.getElementById('discord-card');
  const cv = card ? card.querySelector('.discord-particles') : null;
  if (!card || !cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { cv.style.display = 'none'; return; }

  let W = 0, H = 0, raf = 0, running = false, visible = false, last = 0;
  const P = [];
  const COLORS = [[0, 255, 65], [110, 255, 145], [0, 230, 60], [190, 255, 205], [0, 200, 55]];
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  function size() {
    const r = card.getBoundingClientRect();
    const hh = Math.min(250, Math.max(120, r.height * 0.48));
    W = cv.width = Math.max(2, Math.round(r.width * dpr));
    H = cv.height = Math.max(2, Math.round(hh * dpr));
  }

  function spawn(init) {
    const c = COLORS[(Math.random() * COLORS.length) | 0];
    return {
      x: (0.04 + Math.random() * 0.92) * W,
      y: init ? Math.random() * H : H + 8 * dpr,
      r: (1.1 + Math.random() * 2.6) * dpr,
      v: (10 + Math.random() * 28) * dpr,
      amp: (3 + Math.random() * 13) * dpr,
      f: 0.3 + Math.random() * 0.8,
      ph: Math.random() * 6.2832,
      a: 0.16 + Math.random() * 0.5,
      tw: 0.6 + Math.random() * 1.7,
      c: c
    };
  }

  const N = Math.max(20, Math.min(38, Math.round(window.innerWidth / 45)));
  function fill() {
    P.length = 0;
    for (let i = 0; i < N; i++) P.push(spawn(true));
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = now / 1000;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;

    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      p.y -= p.v * dt;
      if (p.y < -10 * dpr) P[i] = spawn(false);
      const x = p.x + Math.sin(t * p.f + p.ph) * p.amp;
      const a = p.a * (0.5 + 0.5 * Math.sin(t * p.tw + p.ph * 2));

      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',' + (a * 0.16).toFixed(3) + ')';
      ctx.arc(x, p.y, p.r * 3.4, 0, 6.2832);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',' + a.toFixed(3) + ')';
      ctx.arc(x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'destination-out';
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    g.addColorStop(0, 'rgba(0,0,0,0.9)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.55);
    ctx.globalCompositeOperation = 'source-over';
  }

  function start() {
    if (!running && visible) {
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function stop() {
    if (running) {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  size();
  fill();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0.05 }).observe(card);
  } else {
    visible = true;
    start();
  }

  let rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { size(); fill(); }, 200);
  }, { passive: true });
})();

(function () {
  'use strict';
  const modal = document.getElementById('sched-modal');
  const trigger = document.getElementById('event-card');
  if (!modal || !trigger) return;

  const closers = modal.querySelectorAll('[data-sched-close]');
  const tabs = modal.querySelectorAll('.sched-tab');
  const lists = modal.querySelectorAll('.sched-list');
  const viewport = document.getElementById('sched-viewport');
  const indicator = modal.querySelector('.sched-indicator');
  let lastFocus = null;
  let currentDay = 'd1';

  function moveIndicator(tab) {
    if (!indicator || !tab) return;
    indicator.style.width = tab.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
  }
  window.addEventListener('resize', function () {
    const active = modal.querySelector('.sched-tab.is-active');
    if (active) moveIndicator(active);
  }, { passive: true });

  function openModal() {
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('sched-lock');
    const active = modal.querySelector('.sched-tab.is-active');
    if (active) requestAnimationFrame(function () { moveIndicator(active); });
    const closeBtn = modal.querySelector('.sched-close');
    if (closeBtn) { try { closeBtn.focus({ preventScroll: true }); } catch (e) { closeBtn.focus(); } }
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('sched-lock');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  trigger.addEventListener('click', openModal);
  closers.forEach(function (el) { el.addEventListener('click', closeModal); });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      const spk = document.getElementById('speaker-modal');
      if (spk && spk.classList.contains('is-open')) return;
      closeModal();
    }
  });

  function switchDay(nextTab) {
    const nextDay = nextTab.getAttribute('data-day');
    if (nextDay === currentDay) return;

    const goingRight = nextDay === 'd2'; 
    const oldList = modal.querySelector('.sched-list[data-day="' + currentDay + '"]');
    const newList = modal.querySelector('.sched-list[data-day="' + nextDay + '"]');
    if (!oldList || !newList) return;

    tabs.forEach(function (t) {
      const on = t === nextTab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    moveIndicator(nextTab);

    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (viewport && animate) {
      viewport.style.height = viewport.offsetHeight + 'px';
      void viewport.offsetHeight;

      oldList.classList.remove('is-active');
      oldList.setAttribute('hidden', '');

      newList.removeAttribute('hidden');
      newList.classList.add('is-active');
      newList.classList.remove('enter-from-left', 'enter-from-right');
      newList.classList.add(goingRight ? 'enter-from-right' : 'enter-from-left');

      requestAnimationFrame(function () {
        viewport.style.height = newList.offsetHeight + 'px';
      });
      setTimeout(function () {
        viewport.style.height = '';
        newList.classList.remove('enter-from-left', 'enter-from-right');
      }, 480);
    } else {
      oldList.classList.remove('is-active');
      oldList.setAttribute('hidden', '');
      newList.removeAttribute('hidden');
      newList.classList.add('is-active');
    }

    currentDay = nextDay;
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { switchDay(tab); });
  });

  modal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll('button, a[href]');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();

(function () {
  'use strict';

  const SPEAKERS = {
    'wt-d1-1': {
      name: 'Em breve',
      role: 'Em breve',
      talk: 'Em breve',
      bio: 'Em breve',
      photo: '',
      links: []
    },
    'wt-d1-2': {
      name: 'Em breve',
      role: 'Em breve',
      talk: 'Em breve',
      bio: 'Em breve',
      photo: '',
      links: []
    },
    'wt-d1-3': {
      name: 'Em breve',
      role: 'Em breve',
      talk: 'Em breve',
      bio: 'Em breve',
      photo: '',
      links: []
    },
    'wt-d2-1': {
      name: 'Em breve',
      role: 'Em breve',
      talk: 'Em breve',
      bio: 'Em breve',
      photo: '',
      links: []
    },
    'wt-d2-2': {
      name: 'Pedro Tenório',
      role: 'Analista de TI — SERPRO · Divisão de Inovação em Tecnologia de Nuvem',
      talk: 'Medindo a Soberania Digital: o Gradiente de Soberania do SERPRO e sua conexão com o NIST Cybersecurity 2.0',
      bio: 'Analista de TI do SERPRO, onde atua na Divisão de Inovação em Tecnologia de Nuvem, dedicando-se à arquitetura de nuvem e à soberania digital. Na WebTalk2026, apresenta como o Gradiente de Soberania do SERPRO se conecta ao NIST Cybersecurity Framework 2.0.',
      photo: 'talkers/wt-d2-2.jpg',
      links: [
        { type: 'instagram', url: 'https://www.instagram.com/profpedrotenorio' },
        { type: 'site', url: 'https://www.serpro.gov.br', label: 'Serpro' }
      ]
    },
    'wt-d2-3': {
      name: 'Em breve',
      role: 'Em breve',
      talk: 'Em breve',
      bio: 'Em breve',
      photo: '',
      links: []
    }
  };

  const modal = document.getElementById('speaker-modal');
  if (!modal) return;
  const schedModal = document.getElementById('sched-modal');

  Array.prototype.slice.call(document.querySelectorAll('.sched-speaker[data-speaker]')).forEach(function (btn) {
    const sp = SPEAKERS[btn.getAttribute('data-speaker')];
    if (!sp) return;
    const info = btn.parentElement.querySelector('.sched-info');
    if (!info) return;
    const talkEl = info.querySelector('.sched-talk');
    const whoEl = info.querySelector('.sched-who');
    if (talkEl && sp.talk) talkEl.textContent = sp.talk;
    if (whoEl && sp.name) whoEl.textContent = sp.name;
  });

  Array.prototype.slice.call(document.querySelectorAll('.sched-speaker[data-speaker]')).forEach(function (btn) {
    const sp = SPEAKERS[btn.getAttribute('data-speaker')];
    if (!sp) return;
    const info = btn.parentElement.querySelector('.sched-info');
    if (!info) return;
    const talkEl = info.querySelector('.sched-talk');
    const whoEl = info.querySelector('.sched-who');
    if (talkEl && sp.talk) talkEl.textContent = sp.talk;
    if (whoEl && sp.name) whoEl.textContent = sp.name;
  });

  const el = {
    photoWrap: document.getElementById('speaker-photo-wrap'),
    photo: document.getElementById('speaker-photo'),
    code: document.getElementById('speaker-code'),
    name: document.getElementById('speaker-name'),
    role: document.getElementById('speaker-role'),
    talk: document.getElementById('speaker-talk'),
    bio: document.getElementById('speaker-bio'),
    links: document.getElementById('speaker-links'),
    note: document.getElementById('speaker-note')
  };

  const ICONS = {
    site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>',
    github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4l16 16"></path><path d="M20 4L4 20"></path></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>'
  };

  const LABELS = {
    site: 'Site',
    email: 'E-mail',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    github: 'GitHub',
    x: 'X / Twitter',
    youtube: 'YouTube'
  };

  let lastFocus = null;

  function setPhoto(src, alt) {
    el.photoWrap.classList.add('is-empty');
    el.photo.onerror = function () { el.photoWrap.classList.add('is-empty'); };
    el.photo.onload = function () { el.photoWrap.classList.remove('is-empty'); };
    el.photo.removeAttribute('src');
    el.photo.alt = alt || '';
    if (src) el.photo.src = src;
  }

  function renderLinks(links) {
    el.links.innerHTML = '';
    const list = Array.isArray(links) ? links : [];
    if (!list.length) return;
    list.forEach(function (l) {
      if (!l || !l.url) return;
      const type = ICONS[l.type] ? l.type : 'site';
      const a = document.createElement('a');
      a.className = 'speaker-link';
      a.href = type === 'email' ? 'mailto:' + l.url : l.url;
      if (type !== 'email') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.title = l.label || LABELS[type] || type;
      a.innerHTML = ICONS[type] + '<span>' + (l.label || LABELS[type] || type) + '</span>';
      el.links.appendChild(a);
    });
  }

  function fill(id) {
    const sp = SPEAKERS[id] || null;

    el.code.textContent = '// ' + (sp ? id : 'palestrante');
    el.name.textContent = sp && sp.name ? sp.name : 'A confirmar';
    el.role.textContent = sp && sp.role ? sp.role : 'Palestrante — WebTalk2026';
    el.talk.textContent = sp && sp.talk ? sp.talk : 'Em breve';
    el.bio.textContent = sp && sp.bio ? sp.bio :
      'Perfil em breve. Assim que a talk for confirmada, este espaço recebe a bio, os contatos e as redes sociais do palestrante.';

    setPhoto(sp && sp.photo ? sp.photo : '', sp && sp.name ? sp.name : 'Foto do palestrante');
    renderLinks(sp ? sp.links : []);

    const hasLinks = sp && Array.isArray(sp.links) && sp.links.some(function (l) { return l && l.url; });
    el.note.textContent = hasLinks ? '' : 'Contatos e redes sociais serão publicados junto com a confirmação da talk.';
  }

  function open(id, triggerEl) {
    lastFocus = triggerEl || document.activeElement;
    fill(id);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('sched-lock');
    const closeBtn = modal.querySelector('.speaker-close');
    if (closeBtn) { try { closeBtn.focus({ preventScroll: true }); } catch (e) { closeBtn.focus(); } }
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!(schedModal && schedModal.classList.contains('is-open'))) {
      document.documentElement.classList.remove('sched-lock');
    }
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest && e.target.closest('.sched-speaker');
    if (!btn) return;
    e.preventDefault();
    open(btn.getAttribute('data-speaker'), btn);
  });

  modal.querySelectorAll('[data-speaker-close]').forEach(function (c) {
    c.addEventListener('click', close);
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  modal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll('button, a[href]');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();

(function () {
  'use strict';
  // Modo MANUAL — os cards dos carrosséis vivem no index.html (.mq-set).
  // Para incluir patrocinador/apoiador: 1) jogue a imagem em sponsors/ ou
  // partners/ · 2) copie um bloco <a class="mq-card"> no index.html ·
  // 3) escreva o texto (alt + span.mq-name). A ordem é a ordem dos blocos.
  // Cor por card (opcional): data-bg="#0a0a0a" e data-fg="#fff" na tag <a>.

  function fill(mq) {
    var track = mq.querySelector('.mq-track');
    var set = track ? track.querySelector('.mq-set') : null;
    if (!track || !set) return;
    while (track.children.length > 1) track.removeChild(track.lastElementChild);
    var w = Math.max(1, set.getBoundingClientRect().width);
    var n = Math.ceil((mq.clientWidth * 2) / w) + 1;
    if (n < 2) n = 2;
    if (n % 2) n++;
    for (var i = 0; i < n - 1; i++) {
      var c = set.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a').forEach(function (a) {
        a.setAttribute('tabindex', '-1');
      });
      track.appendChild(c);
    }
  }

  var groups = Array.prototype.slice.call(document.querySelectorAll('.mq'));
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { groups.forEach(fill); }, 150);
  }, { passive: true });
  window.addEventListener('load', function () { groups.forEach(fill); });
  Array.prototype.slice.call(document.querySelectorAll('.mq-card[data-bg], .mq-card[data-fg]')).forEach(function (c) {
    if (c.getAttribute('data-bg')) c.style.background = c.getAttribute('data-bg');
    if (c.getAttribute('data-fg')) c.style.color = c.getAttribute('data-fg');
  });
  groups.forEach(fill);
})();

(function () {
  'use strict';

  const LIVE_WINDOWS = [
    ['2026-11-17T19:30:00-03:00', '2026-11-17T21:30:00-03:00'],
    ['2026-11-18T19:30:00-03:00', '2026-11-18T21:30:00-03:00']
  ];

  function inWindow(now) {
    return LIVE_WINDOWS.some(function (w) {
      return now >= new Date(w[0]).getTime() && now <= new Date(w[1]).getTime();
    });
  }

  function showBadge() {
    if (document.body.classList.contains('is-live')) return;
    document.body.classList.add('is-live');

    const badge = document.createElement('span');
    badge.className = 'live-badge';
    badge.setAttribute('role', 'status');
    badge.textContent = 'ao vivo agora';

    const ytHead = document.querySelector('.yt-event-head');
    if (ytHead) ytHead.appendChild(badge.cloneNode(true));

    const evtHead = document.querySelector('#event-card .challenge-header');
    if (evtHead) evtHead.appendChild(badge.cloneNode(true));
  }

  if (inWindow(Date.now())) showBadge();
})();