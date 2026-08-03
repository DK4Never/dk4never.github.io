(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function byId(id) {
    return document.getElementById(id);
  }

  function closeMenu() {
    var nav = byId("project-nav");
    var button = byId("project-nav-toggle");
    if (!nav || !button) return;
    nav.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  function setupMenu() {
    var nav = byId("project-nav");
    var button = byId("project-nav-toggle");
    if (!nav || !button) return;
    button.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });
  }

  function setupReveal() {
    var elements = document.querySelectorAll("[data-reveal]");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach(function (element) { element.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries, currentObserver) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    elements.forEach(function (element) { observer.observe(element); });
  }

  function pictureMarkup(project) {
    var webp = project.artwork + ".webp";
    var png = project.artwork + ".png";
    return "<picture class=\"project-card-art\"><source srcset=\"" + webp + "\" type=\"image/webp\"><img src=\"" + png + "\" width=\"1254\" height=\"1254\" loading=\"lazy\" decoding=\"async\" alt=\"" + project.alt + "\"></picture>";
  }

  function renderHub() {
    var grid = document.querySelector("[data-project-grid]");
    if (!grid || !window.DEAN_PROJECTS) return;
    grid.innerHTML = window.DEAN_PROJECTS.map(function (project) {
      var demo = project.demo ? "<span class=\"project-card-demo\">" + project.demo + "</span>" : "";
      return "<article class=\"hub-card\" data-reveal><div class=\"hub-card-art\">" + pictureMarkup(project) + "<span class=\"project-card-category\">" + project.category + "</span></div><div class=\"hub-card-body\"><div class=\"status-row\"><span class=\"status-label\">" + project.status + "</span>" + demo + "</div><h2>" + project.title + "</h2><p>" + project.summary + "</p><div class=\"tag-list\">" + project.tags.map(function (tag) { return "<span>" + tag + "</span>"; }).join("") + "</div><a class=\"text-link\" href=\"" + project.route + "\">VIEW CASE STUDY <span aria-hidden=\"true\">→</span></a></div></article>";
    }).join("");
    setupReveal();
  }

  function setupQrDemo() {
    var form = byId("qr-demo-form");
    var output = byId("qr-demo-output");
    if (!form || !output) return;
    var packets = {
      "DEMO-PKT-1042": { line: "Line A", stage: "Packing", shift: "Day shift", state: "Validated" },
      "DEMO-PKT-2088": { line: "Line C", stage: "Wrapping", shift: "Night shift", state: "Ready for review" }
    };
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var packet = String(form.elements.packetId.value || "").trim().toUpperCase();
      var record = packets[packet];
      if (!/^[A-Z0-9-]{4,32}$/.test(packet)) {
        output.textContent = "Use a synthetic packet ID such as DEMO-PKT-1042.";
        return;
      }
      if (!record) {
        output.textContent = "No representative record found. This demo does not call a backend.";
        return;
      }
      output.innerHTML = "<strong>" + packet + "</strong><span>" + record.state + " · " + record.line + " · " + record.stage + " · " + record.shift + "</span>";
    });
  }

  function setupCalculator() {
    var form = byId("calculator-form");
    var output = byId("calculator-output");
    if (!form || !output || typeof window.deanCalculateProduction !== "function") return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      try {
        var result = window.deanCalculateProduction({
          ratedSpeed: form.elements.ratedSpeed.value,
          shiftHours: form.elements.shiftHours.value,
          downtimePercent: form.elements.downtimePercent.value,
          efficiencyPercent: form.elements.efficiencyPercent.value,
          sticksPerPack: form.elements.sticksPerPack.value,
          packsPerCarton: form.elements.packsPerCarton.value,
          cartonsPerCase: form.elements.cartonsPerCase.value
        });
        output.innerHTML = "<strong>Estimated output</strong><span>" + result.sticks.toLocaleString() + " sticks · " + result.packs.toLocaleString() + " packs · " + result.cartons.toLocaleString() + " cartons · " + result.cases.toLocaleString() + " cases</span>";
      } catch (error) {
        output.textContent = error.message;
      }
    });
  }

  function init() {
    setupMenu();
    renderHub();
    setupReveal();
    setupQrDemo();
    setupCalculator();
  }

  init();
}());
