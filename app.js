(() => {
  "use strict";

  const mobile = window.matchMedia("(max-width: 760px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lowPower = () => mobile.matches || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  let pageVisible = !document.hidden;
  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    if (pageVisible) {
      if (matrix && mctx && !matrixFrameId) matrixFrameId = requestAnimationFrame(drawMatrix);
      if (globe && ctx && !globeFrameId) globeFrameId = requestAnimationFrame(drawGlobe);
    }
  });

  /* Navigation */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("nav-toggle");

  const closeNav = () => {
    nav?.classList.remove("open");
    if (navToggle) {
      navToggle.dataset.open = "false";
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    }
  };

  navToggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open") ?? false;
    navToggle.dataset.open = String(open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });

  nav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1150) closeNav();
  }, { passive: true });

  /* Active navigation without repeated offset calculations */
  const navLinks = [...document.querySelectorAll("nav a")];
  const sectionMap = new Map(
    navLinks.map(link => [link.getAttribute("href")?.slice(1), link])
  );

  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    navLinks.forEach(link => link.classList.remove("active"));
    sectionMap.get(visible.target.id)?.classList.add("active");
  }, {
    rootMargin: "-24% 0px -58% 0px",
    threshold: [0.08, 0.2, 0.45]
  });

  document.querySelectorAll("main section[id]").forEach(section => {
    sectionObserver.observe(section);
  });

  /* Canvas helpers */
  const setupCanvas = (canvas, context, maxDpr) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { width, height, dpr };
  };

  /* Matrix background */
  const matrix = document.getElementById("matrix-bg");
  const mctx = matrix?.getContext("2d", { alpha: true });

  let matrixWidth = 0;
  let matrixHeight = 0;
  let matrixColumns = 0;
  let matrixDrops = [];
  let matrixLastFrame = 0;
  let matrixFrameId = 0;

  const glyphs = "01<>[]{}ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const matrixColumnWidth = () => lowPower() ? 24 : 18;
  const matrixFrameInterval = () => lowPower() ? 1000 / 18 : 1000 / 32;

  function resizeMatrix() {
    if (!matrix || !mctx) return;

    const maxDpr = lowPower() ? 1 : 1.5;
    const size = setupCanvas(matrix, mctx, maxDpr);

    matrixWidth = size.width;
    matrixHeight = size.height;

    const columnWidth = matrixColumnWidth();
    matrixColumns = Math.max(1, Math.floor(matrixWidth / columnWidth));
    matrixDrops = Array.from(
      { length: matrixColumns },
      () => Math.random() * -45
    );
  }

  function drawMatrix(timestamp = 0) {
    if (!matrix || !mctx) return;

    matrixFrameId = requestAnimationFrame(drawMatrix);

    if (!pageVisible || reducedMotion.matches) return;
    if (timestamp - matrixLastFrame < matrixFrameInterval()) return;

    matrixLastFrame = timestamp;

    const columnWidth = matrixColumnWidth();

    mctx.fillStyle = lowPower()
      ? "rgba(4,7,11,.15)"
      : "rgba(4,7,11,.09)";
    mctx.fillRect(0, 0, matrixWidth, matrixHeight);

    mctx.font = lowPower() ? "11px monospace" : "12px monospace";

    for (let i = 0; i < matrixDrops.length; i++) {
      const char = glyphs[(Math.random() * glyphs.length) | 0];
      mctx.fillStyle = Math.random() > 0.987 ? "#7dfff5" : "#00a99a";
      mctx.fillText(char, i * columnWidth, matrixDrops[i] * columnWidth);

      if (
        matrixDrops[i] * columnWidth > matrixHeight &&
        Math.random() > 0.986
      ) {
        matrixDrops[i] = 0;
      }

      matrixDrops[i] += lowPower() ? 0.32 : 0.45;
    }
  }

  /* Animated wireframe globe */
  const globe = document.getElementById("globe");
  const ctx = globe?.getContext("2d", { alpha: true });

  let globeWidth = 0;
  let globeHeight = 0;
  let angle = 0;
  let globeLastFrame = 0;
  let globeFrameId = 0;
  let globeVisible = true;

  const makeSpherePoint = (lat, lon) => {
    const phi = lat * Math.PI / 180;
    const theta = lon * Math.PI / 180;
    return {
      x: Math.cos(phi) * Math.cos(theta),
      y: Math.sin(phi),
      z: Math.cos(phi) * Math.sin(theta),
      lat,
      lon
    };
  };

  const points = [];
  const latitudeLines = [];
  const longitudeLines = [];

  for (let lat = -80; lat <= 80; lat += 10) {
    const line = [];
    for (let lon = 0; lon <= 360; lon += 5) line.push(makeSpherePoint(lat, lon));
    latitudeLines.push(line);
    for (let lon = 0; lon < 360; lon += 10) points.push(makeSpherePoint(lat, lon));
  }

  for (let lon = 0; lon < 360; lon += 12) {
    const line = [];
    for (let lat = -90; lat <= 90; lat += 5) line.push(makeSpherePoint(lat, lon));
    longitudeLines.push(line);
  }

  const networkNodes = [
    makeSpherePoint(34, 18),
    makeSpherePoint(8, 94),
    makeSpherePoint(-22, 148),
    makeSpherePoint(-35, 268),
    makeSpherePoint(28, 304),
    makeSpherePoint(2, 218)
  ];
  const networkRoutes = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]];
  const orbitRings = [
    { radius: 1.2, tilt: -.42, yaw: -.28, roll: -.1, speed: .82, precession: .08, phase: .4, color: "0,245,223", alpha: .42, width: 1.05, dash: [22, 10] },
    { radius: 1.31, tilt: .58, yaw: .32, roll: .14, speed: -.52, precession: -.12, phase: 2.1, color: "89,255,106", alpha: .32, width: .9, dash: [13, 16] },
    { radius: 1.42, tilt: -.2, yaw: .7, roll: .26, speed: .34, precession: .05, phase: 4.4, color: "112,235,255", alpha: .24, width: .78, dash: [5, 19] }
  ];
  const projection = { x: 0, y: 0, z: 0 };

  const globeObserver = new IntersectionObserver(entries => {
    globeVisible = entries[0]?.isIntersecting ?? true;
    if (globeVisible && pageVisible && !globeFrameId) globeFrameId = requestAnimationFrame(drawGlobe);
  }, { threshold: 0.01 });

  if (globe) globeObserver.observe(globe);

  function resizeGlobe() {
    if (!globe || !ctx) return;

    const maxDpr = lowPower() ? 1 : 1.5;
    const size = setupCanvas(globe, ctx, maxDpr);

    globeWidth = size.width;
    globeHeight = size.height;
  }

  function project(point, radius, centerX, centerY) {
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const x = point.x * cosine - point.z * sine;
    const z = point.x * sine + point.z * cosine;
    const perspective = 1 / (1.86 - z * 0.34);

    projection.x = centerX + x * radius * perspective;
    projection.y = centerY - point.y * radius * perspective;
    projection.z = z;
    return projection;
  }

  function strokeLines(lines, radius, centerX, centerY, step) {
    for (let index = 0; index < lines.length; index += step) {
      const line = lines[index];
      ctx.beginPath();
      let started = false;

      for (let pointIndex = 0; pointIndex < line.length; pointIndex++) {
        const projected = project(line[pointIndex], radius, centerX, centerY);
        if (projected.z > -0.28) {
          if (!started) {
            ctx.moveTo(projected.x, projected.y);
            started = true;
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        }
      }

      ctx.stroke();
    }
  }

  function orbitPoint(ring, theta) {
    const orbitTheta = theta + angle * ring.speed + ring.phase;
    const tilt = ring.tilt;
    const yaw = ring.yaw + angle * ring.precession;
    const roll = ring.roll;
    const cosTheta = Math.cos(orbitTheta);
    const sinTheta = Math.sin(orbitTheta);

    let x = cosTheta;
    let y = sinTheta * Math.sin(tilt);
    let z = sinTheta * Math.cos(tilt);

    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const yawedX = x * cosYaw - z * sinYaw;
    z = x * sinYaw + z * cosYaw;
    x = yawedX;

    const cosRoll = Math.cos(roll);
    const sinRoll = Math.sin(roll);
    return {
      x: x * cosRoll - y * sinRoll,
      y: x * sinRoll + y * cosRoll,
      z
    };
  }

  function strokeOrbitSegment(ring, radius, centerX, centerY, front) {
    const samples = lowPower() ? 72 : 112;
    let started = false;

    for (let index = 0; index <= samples; index++) {
      const point = orbitPoint(ring, index / samples * Math.PI * 2);
      const projected = project(point, radius * ring.radius, centerX, centerY);
      const isFront = projected.z > .02;

      if (isFront === front) {
        if (!started) {
          ctx.beginPath();
          ctx.moveTo(projected.x, projected.y);
          started = true;
        } else {
          ctx.lineTo(projected.x, projected.y);
        }
      } else if (started) {
        ctx.stroke();
        started = false;
      }
    }

    if (started) ctx.stroke();
  }

  function drawOrbitRings(radius, centerX, centerY, front, glow = false) {
    for (let index = 0; index < orbitRings.length; index++) {
      const ring = orbitRings[index];
      ctx.save();
      ctx.lineCap = "round";
      ctx.setLineDash(glow ? [] : ring.dash);
      ctx.lineDashOffset = -angle * (index + 1) * 18;
      ctx.strokeStyle = `rgba(${ring.color},${glow ? .055 : (front ? ring.alpha : ring.alpha * .2)})`;
      ctx.lineWidth = glow ? ring.width * 4.4 : ring.width;
      strokeOrbitSegment(ring, radius, centerX, centerY, front);
      ctx.restore();
    }
  }

  function drawOrbitTracers(radius, centerX, centerY) {
    for (let index = 0; index < orbitRings.length; index++) {
      const ring = orbitRings[index];
      const point = orbitPoint(ring, index * 2.2 + .8);
      const projected = project(point, radius * ring.radius, centerX, centerY);

      if (projected.z < -.08) continue;

      const size = lowPower() ? 1.8 : 2.4;
      ctx.fillStyle = `rgba(${ring.color},${projected.z > .15 ? .9 : .5})`;
      ctx.shadowColor = `rgba(${ring.color},.8)`;
      ctx.shadowBlur = lowPower() ? 4 : 8;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawGlobeTicks(radius, centerX, centerY) {
    ctx.save();
    ctx.strokeStyle = "rgba(98,246,189,.24)";
    ctx.lineWidth = .65;

    for (let index = 0; index < 24; index++) {
      const tickAngle = index / 24 * Math.PI * 2 + angle * .12;
      const innerRadius = radius * (index % 6 === 0 ? 1.035 : 1.055);
      const outerRadius = radius * (index % 6 === 0 ? 1.095 : 1.075);
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(tickAngle) * innerRadius, centerY + Math.sin(tickAngle) * innerRadius);
      ctx.lineTo(centerX + Math.cos(tickAngle) * outerRadius, centerY + Math.sin(tickAngle) * outerRadius);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGlobe(timestamp = 0) {
    if (!globe || !ctx) return;
    if (!pageVisible || !globeVisible) {
      globeFrameId = 0;
      return;
    }

    globeFrameId = requestAnimationFrame(drawGlobe);

    const interval = lowPower() ? 1000 / 24 : 1000 / 45;
    if (timestamp - globeLastFrame < interval) return;
    globeLastFrame = timestamp;

    ctx.clearRect(0, 0, globeWidth, globeHeight);

    const compactGlobe = mobile.matches;
    const centerX = globeWidth * (compactGlobe ? 0.5 : 0.61);
    const centerY = globeHeight * (compactGlobe ? 0.47 : 0.48);
    const radius = Math.min(
      globeWidth * (compactGlobe ? 0.37 : 0.43),
      globeHeight * (compactGlobe ? 0.43 : 0.52)
    );

    const glow = ctx.createRadialGradient(centerX, centerY, 12, centerX, centerY, radius * 1.55);
    glow.addColorStop(0, "rgba(0,245,223,.14)");
    glow.addColorStop(.52, "rgba(0,245,223,.045)");
    glow.addColorStop(1, "rgba(0,245,223,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    drawOrbitRings(radius, centerX, centerY, false, true);
    drawOrbitRings(radius, centerX, centerY, false);

    const glassSurface = ctx.createRadialGradient(
      centerX - radius * .34,
      centerY - radius * .42,
      radius * .08,
      centerX,
      centerY,
      radius * 1.08
    );
    glassSurface.addColorStop(0, "rgba(184,255,246,.12)");
    glassSurface.addColorStop(.48, "rgba(0,245,223,.035)");
    glassSurface.addColorStop(1, "rgba(0,20,28,.08)");
    ctx.fillStyle = glassSurface;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * .995, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,245,223,.38)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,245,223,.2)";
    ctx.lineWidth = .78;
    strokeLines(latitudeLines, radius, centerX, centerY, lowPower() ? 2 : 1);
    strokeLines(longitudeLines, radius, centerX, centerY, lowPower() ? 2 : 1);

    for (let index = 0; index < points.length; index++) {
      const point = points[index];
      const projected = project(point, radius, centerX, centerY);
      const signal = Math.sin((point.lon + angle * 80) * .11) + Math.cos((point.lat - 12) * .17) + Math.sin((point.lon + point.lat) * .07);

      if (projected.z > -.02 && signal > .72) {
        const alpha = .18 + Math.max(0, projected.z) * .5;
        const size = 1.05 + Math.max(0, projected.z) * 1.35;
        ctx.fillStyle = `rgba(78,255,214,${alpha})`;
        ctx.fillRect(projected.x, projected.y, size, size);
      }
    }

    ctx.strokeStyle = "rgba(89,255,106,.5)";
    ctx.lineWidth = 1.05;
    for (let index = 0; index < networkRoutes.length; index++) {
      const route = networkRoutes[index];
      const from = project(networkNodes[route[0]], radius, centerX, centerY);
      const fromX = from.x;
      const fromY = from.y;
      const fromZ = from.z;
      const to = project(networkNodes[route[1]], radius, centerX, centerY);
      if (fromZ > -.08 && to.z > -.08) {
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo((fromX + to.x) * .5, (fromY + to.y) * .5 - radius * .16, to.x, to.y);
        ctx.stroke();
      }
    }

    for (let index = 0; index < networkNodes.length; index++) {
      const projected = project(networkNodes[index], radius, centerX, centerY);
      if (projected.z > -.08) {
        ctx.fillStyle = index % 2 ? "#59ff6a" : "#00f5df";
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, lowPower() ? 2 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const scanAngle = angle * 1.7;
    ctx.strokeStyle = "rgba(170,255,235,.72)";
    ctx.lineWidth = lowPower() ? 1 : 1.4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.012, scanAngle, scanAngle + Math.PI * .32);
    ctx.stroke();

    ctx.strokeStyle = "rgba(213,255,248,.34)";
    ctx.lineWidth = lowPower() ? .7 : 1;
    ctx.beginPath();
    ctx.arc(centerX - radius * .04, centerY - radius * .04, radius * .91, Math.PI * 1.08, Math.PI * 1.48);
    ctx.stroke();

    drawOrbitRings(radius, centerX, centerY, true, true);
    drawOrbitRings(radius, centerX, centerY, true);
    drawOrbitTracers(radius, centerX, centerY);
    drawGlobeTicks(radius, centerX, centerY);

    if (!reducedMotion.matches) angle += lowPower() ? .0021 : .0031;
  }

  /* Terminal sequence */
  const terminal = document.getElementById("terminal-output");
  const terminalLines = [
    "> Initializing portfolio...",
    "> Loading engineering profile...",
    "",
    "> Backend systems        [ OK ]",
    "> Industrial integration [ OK ]",
    "> Data and reporting     [ OK ]",
    "> Mobile operations      [ OK ]",
    "> DevOps and recovery    [ OK ]",
    "",
    "> Systems operational.",
    "> Open to opportunities.",
    "> _"
  ];

  function startTerminal() {
    if (!terminal) return;

    if (reducedMotion.matches) {
      terminal.textContent = terminalLines.join("\n");
      return;
    }

    let lineIndex = 0;
    let characterIndex = 0;
    let output = "";

    const type = () => {
      if (!pageVisible) {
        window.setTimeout(type, 250);
        return;
      }

      if (lineIndex >= terminalLines.length) return;

      const line = terminalLines[lineIndex];

      if (characterIndex < line.length) {
        output += line[characterIndex++];
        terminal.textContent = output;
        window.setTimeout(type, lowPower() ? 24 : 18);
      } else {
        output += "\n";
        terminal.textContent = output;
        lineIndex++;
        characterIndex = 0;
        window.setTimeout(type, line ? 90 : 45);
      }
    };

    window.setTimeout(type, 350);
  }

  /* Reveal animations */
  const revealTargets = document.querySelectorAll(
    ".panel, .project-card, .capability"
  );

  if (reducedMotion.matches || lowPower()) {
    revealTargets.forEach(element => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.animate(
          [
            { opacity: 0, transform: "translateY(22px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          {
            duration: 520,
            easing: "cubic-bezier(.2,.8,.2,1)",
            fill: "both"
          }
        );

        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -35px 0px"
    });

    revealTargets.forEach(element => revealObserver.observe(element));
  }

  /* Resize management */
  let resizeTimer = 0;
  const handleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeMatrix();
      resizeGlobe();
    }, 120);
  };

  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("orientationchange", handleResize, { passive: true });

  resizeMatrix();
  resizeGlobe();
  startTerminal();

  if (matrix && mctx) matrixFrameId = requestAnimationFrame(drawMatrix);
  if (globe && ctx) globeFrameId = requestAnimationFrame(drawGlobe);

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(matrixFrameId);
    cancelAnimationFrame(globeFrameId);
  });
})();
