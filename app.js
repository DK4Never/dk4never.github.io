(() => {
  "use strict";

  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("nav-toggle");
  navToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.textContent = open ? "✕" : "☰";
  });
  nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle.textContent = "☰";
    navToggle.setAttribute("aria-expanded", "false");
  }));

  const sections = [...document.querySelectorAll("main section[id]")];
  const links = [...document.querySelectorAll("nav a")];
  const activateNav = () => {
    let current = "home";
    for (const section of sections) {
      if (window.scrollY >= section.offsetTop - 140) current = section.id;
    }
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
  };
  window.addEventListener("scroll", activateNav, { passive: true });
  activateNav();

  // Matrix background
  const matrix = document.getElementById("matrix-bg");
  const mctx = matrix.getContext("2d");
  let mw = 0, mh = 0, columns = 0, drops = [];
  const glyphs = "01<>[]{}ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function resizeMatrix() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    mw = innerWidth; mh = innerHeight;
    matrix.width = mw * dpr; matrix.height = mh * dpr;
    matrix.style.width = mw + "px"; matrix.style.height = mh + "px";
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    columns = Math.floor(mw / 18);
    drops = Array.from({ length: columns }, () => Math.random() * -50);
  }
  function drawMatrix() {
    mctx.fillStyle = "rgba(4,7,11,.08)";
    mctx.fillRect(0, 0, mw, mh);
    mctx.font = "12px monospace";
    for (let i = 0; i < drops.length; i++) {
      const char = glyphs[Math.floor(Math.random() * glyphs.length)];
      mctx.fillStyle = Math.random() > .985 ? "#7dfff5" : "#00a99a";
      mctx.fillText(char, i * 18, drops[i] * 18);
      if (drops[i] * 18 > mh && Math.random() > .985) drops[i] = 0;
      drops[i] += .45;
    }
    requestAnimationFrame(drawMatrix);
  }
  addEventListener("resize", resizeMatrix);
  resizeMatrix();
  drawMatrix();

  // Animated wireframe globe
  const canvas = document.getElementById("globe");
  const ctx = canvas.getContext("2d");
  let width = 0, height = 0, dpr = 1, angle = 0;
  const points = [];
  for (let lat = -75; lat <= 75; lat += 15) {
    for (let lon = 0; lon < 360; lon += 12) {
      const phi = lat * Math.PI / 180;
      const theta = lon * Math.PI / 180;
      points.push({
        x: Math.cos(phi) * Math.cos(theta),
        y: Math.sin(phi),
        z: Math.cos(phi) * Math.sin(theta),
        lat,
        lon
      });
    }
  }
  function resizeGlobe() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function project(p, radius, cx, cy) {
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const x = p.x * ca - p.z * sa;
    const z = p.x * sa + p.z * ca;
    const perspective = 1 / (1.8 - z * .42);
    return { x: cx + x * radius * perspective, y: cy - p.y * radius * perspective, z };
  }
  function drawGlobe() {
    ctx.clearRect(0,0,width,height);
    const cx = width * .69, cy = height * .43;
    const radius = Math.min(width,height) * .38;

    const glow = ctx.createRadialGradient(cx,cy,12,cx,cy,radius*1.6);
    glow.addColorStop(0,"rgba(0,245,223,.15)");
    glow.addColorStop(.48,"rgba(0,245,223,.055)");
    glow.addColorStop(1,"rgba(0,245,223,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx,cy,radius*1.65,0,Math.PI*2); ctx.fill();

    // Outer sphere
    ctx.strokeStyle = "rgba(0,245,223,.42)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(cx,cy,radius*.62,0,Math.PI*2);
    ctx.stroke();

    // Latitude and longitude mesh
    ctx.strokeStyle = "rgba(0,245,223,.23)";
    ctx.lineWidth = .85;
    for (let lat = -75; lat <= 75; lat += 15) {
      ctx.beginPath();
      let started = false;
      for (let lon = 0; lon <= 360; lon += 3) {
        const phi=lat*Math.PI/180, theta=lon*Math.PI/180;
        const p={x:Math.cos(phi)*Math.cos(theta),y:Math.sin(phi),z:Math.cos(phi)*Math.sin(theta)};
        const q=project(p,radius,cx,cy);
        if(q.z > -.34){ if(!started){ctx.moveTo(q.x,q.y);started=true}else ctx.lineTo(q.x,q.y);}
      }
      ctx.stroke();
    }
    for (let lon = 0; lon < 360; lon += 15) {
      ctx.beginPath(); let started=false;
      for (let lat=-90;lat<=90;lat+=2.5){
        const phi=lat*Math.PI/180, theta=lon*Math.PI/180;
        const p={x:Math.cos(phi)*Math.cos(theta),y:Math.sin(phi),z:Math.cos(phi)*Math.sin(theta)};
        const q=project(p,radius,cx,cy);
        if(q.z > -.34){ if(!started){ctx.moveTo(q.x,q.y);started=true}else ctx.lineTo(q.x,q.y);}
      }
      ctx.stroke();
    }

    // Pseudo-continent data clusters
    points.forEach(p=>{
      const q=project(p,radius,cx,cy);
      const continental =
        Math.sin((p.lon+angle*80)*.11) +
        Math.cos((p.lat-12)*.17) +
        Math.sin((p.lon+p.lat)*.07);
      if(q.z > -.08 && continental > .72){
        const alpha=.2 + Math.max(0,q.z)*.55;
        ctx.fillStyle=`rgba(78,255,214,${alpha})`;
        const s=1.15 + Math.max(0,q.z)*1.5;
        ctx.fillRect(q.x,q.y,s,s);
      }
    });

    // Orbit arcs
    ctx.strokeStyle="rgba(0,245,223,.42)";
    ctx.lineWidth=.8;
    for(let i=0;i<4;i++){
      ctx.beginPath();
      ctx.ellipse(cx,cy,radius*1.48,radius*(.37+i*.11),angle*.22+i*.73,0,Math.PI*2);
      ctx.stroke();
    }

    // Moving orbit points
    for(let i=0;i<5;i++){
      const t=angle*8+i*1.25;
      const rx=radius*1.47, ry=radius*(.42+(i%3)*.1);
      const rot=i*.73;
      const ox=Math.cos(t)*rx, oy=Math.sin(t)*ry;
      const px=cx + ox*Math.cos(rot)-oy*Math.sin(rot);
      const py=cy + ox*Math.sin(rot)+oy*Math.cos(rot);
      ctx.fillStyle=i%2?"#59ff6a":"#00f5df";
      ctx.beginPath();ctx.arc(px,py,2.2,0,Math.PI*2);ctx.fill();
      ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(px,py,1.1,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }

    angle += .0033;
    requestAnimationFrame(drawGlobe);
  }
  addEventListener("resize", resizeGlobe);
  resizeGlobe();
  drawGlobe();

  // terminal type sequence
  const terminal = document.getElementById("terminal-output");
  const lines = [
    "> Initializing Portfolio...",
    "> Loading systems...",
    "",
    "> Industrial Systems        [ OK ]",
    "> Data Intelligence         [ OK ]",
    "> AI Modules                [ OK ]",
    "> Automation Engines        [ OK ]",
    "> Reporting Dashboards      [ OK ]",
    "",
    "> All systems operational.",
    "> Welcome to my digital domain."
  ];
  let li = 0, ci = 0, buffer = "";
  function typeTerminal() {
    if (li >= lines.length) return;
    const line = lines[li];
    if (ci < line.length) {
      buffer += line[ci++];
      terminal.textContent = buffer;
      setTimeout(typeTerminal, 20 + Math.random()*20);
    } else {
      buffer += "\n"; li++; ci = 0;
      terminal.textContent = buffer;
      setTimeout(typeTerminal, 120);
    }
  }
  setTimeout(typeTerminal, 450);

  // reveal animation
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.animate(
          [{opacity:0,transform:"translateY(28px)"},{opacity:1,transform:"translateY(0)"}],
          {duration:650,easing:"cubic-bezier(.2,.8,.2,1)",fill:"both"}
        );
        reveal.unobserve(entry.target);
      }
    });
  }, {threshold:.1});
  document.querySelectorAll(".panel,.project-card,.capability").forEach(el=>reveal.observe(el));
})();
