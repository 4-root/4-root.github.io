(function () { 
  'use strict';
  /* ============================================== 
   PARTICLE NETWORK CYBER
   ============================================== */
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
    function distance(x1,y1,x2,y2){
        return Math.hypot(x1-x2,y1-y2);
    }
    const lightnings = [];

function createLightning() {
    if (!mouse.active) return;
    const nearby = particles.filter(p =>
        distance(p.x, p.y, mouse.x, mouse.y) < 180
    );

    if (nearby.length < 2) return;
    const start = nearby[Math.floor(Math.random() * nearby.length)];
    const end   = nearby[Math.floor(Math.random() * nearby.length)];
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
        ctx.strokeStyle = `rgba(0,255,65,${bolt.life/10})`;
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

    function drawParticles(){

        ctx.clearRect(0,0,w,h);
        const maxDist=200;

        for(let i=0;i<particles.length;i++){
            const p1=particles[i];

            for(let j=i+1;j<particles.length;j++){

                const p2=particles[j];
                const dx=p1.x-p2.x;
                const dy=p1.y-p2.y;
                const dist=Math.sqrt(dx*dx+dy*dy);

                if(dist>maxDist) continue;
                let alpha=(1-dist/maxDist)*0.18;
                let color="120,120,120";

                if(mouse.active){
                    const dm1=distance(mouse.x,mouse.y,p1.x,p1.y);
                    const dm2=distance(mouse.x,mouse.y,p2.x,p2.y);

                    if(dm1<170 || dm2<170){
                        color="0,255,65";
                        alpha*=2;
                    }
                }

                ctx.strokeStyle=`rgba(${color},${alpha})`;
                ctx.lineWidth=0.6;
                ctx.beginPath();
                ctx.moveTo(p1.x,p1.y);
                ctx.lineTo(p2.x,p2.y);
                ctx.stroke();
            }
        }

        for(const p of particles){
            let color="140,140,140";
            let glow="rgba(140,140,140,0.05)";

            if(mouse.active){
                const dm=distance(mouse.x,mouse.y,p.x,p.y);

                if(dm<170){
                    color="0,255,65";
                    const intensity=1-(dm/170);
                    glow=`rgba(0,255,65,${0.12*intensity})`;
                }
            }

            ctx.beginPath();
            ctx.fillStyle=`rgb(${color})`;
            ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle=glow;
            ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2);
            ctx.fill();
            p.x+=p.vx;
            p.y+=p.vy;
            if(p.x<=0 || p.x>=w) p.vx*=-1;
            if(p.y<=0 || p.y>=h) p.vy*=-1;
        }

        if(mouse.active){
            const gradient=ctx.createRadialGradient(
                mouse.x,
                mouse.y,
                0,
                mouse.x,
                mouse.y,
                140
            );

            gradient.addColorStop(0,"rgba(0,255,65,0.05)");
            gradient.addColorStop(1,"rgba(0,255,65,0)");
            ctx.fillStyle=gradient;
            ctx.beginPath();
            ctx.arc(mouse.x,mouse.y,140,0,Math.PI*2);
            ctx.fill();
        }
        drawLightning();
        animFrame=requestAnimationFrame(drawParticles);
    }

    const section = canvas.parentElement;
    section.addEventListener("mousemove",(e)=>{
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
    });

    section.addEventListener("mouseleave",()=>{
        mouse.active = false;

    });
    resize();
    createParticles();
    drawParticles();
    window.addEventListener("resize",()=>{
        cancelAnimationFrame(animFrame);
        resize();
        createParticles();
        drawParticles();
    });

}

  /* ==============================================
     2. NAVBAR: scroll background + active link
     ============================================== */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
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

  /* ==============================================
     3. MOBILE MENU
     ============================================== */
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

  /* ==============================================
     4. SCROLL ANIMATIONS (IntersectionObserver)
     ============================================== */
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

  /* ==============================================
     5. PROXIMITY MASK EFFECT (Hero subtitle)
     ============================================== */
  const subtitleWrap = document.getElementById('hero-subtitle-wrap');
  if (subtitleWrap) {
    subtitleWrap.addEventListener('mousemove', function (e) {
      const rect = subtitleWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      subtitleWrap.style.setProperty('--mask-x', x + 'px');
      subtitleWrap.style.setProperty('--mask-y', y + 'px');
    });
    subtitleWrap.addEventListener('mouseleave', function () {
      subtitleWrap.style.setProperty('--mask-x', '-200px');
      subtitleWrap.style.setProperty('--mask-y', '-200px');
    });
  }

  /* ==============================================
     6. TYPEWRITER EFFECT (Hero status)
     ============================================= */
  const typewriterEl = document.getElementById('typewriter');
  if (typewriterEl) {
    const phrases = [
      'root@4root:~$ infosec --community',
      'root@4root:~$ pentest --learn --share',
      'root@4root:~$ ctf --compete --grow',
      'root@4root:~$ osint --explore --discover',
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

    typewrite();
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
