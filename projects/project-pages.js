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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function pictureMarkup(project) {
    var webp = project.artwork + ".webp";
    var png = project.artwork + ".png";
    return "<picture class=\"project-card__picture\"><source srcset=\"" + webp + "\" type=\"image/webp\"><img src=\"" + png + "\" width=\"1586\" height=\"992\" loading=\"lazy\" decoding=\"async\" alt=\"" + escapeHtml(project.alt) + "\"></picture>";
  }

  function projectLinkMarkup(project) {
    if (project.type === "case-study") {
      return "<a class=\"text-link\" href=\"" + escapeHtml(project.route) + "\">VIEW CASE STUDY <span aria-hidden=\"true\">→</span></a>";
    }

    var sourceLink = "<a class=\"text-link\" href=\"" + escapeHtml(project.github) + "\" target=\"_blank\" rel=\"noopener noreferrer\">VIEW SOURCE <span aria-hidden=\"true\">↗</span></a>";
    if (!project.live) return sourceLink;
    return "<div class=\"hub-card-actions\"><a class=\"text-link text-link--primary\" href=\"" + escapeHtml(project.live) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHtml(project.liveLabel || "OPEN PROJECT") + " <span aria-hidden=\"true\">↗</span></a>" + sourceLink + "</div>";
  }

  function cardMarkup(project) {
    var demo = project.demo ? "<span class=\"project-card-demo\">" + escapeHtml(project.demo) + "</span>" : "";
    var tags = (project.tags || []).map(function (tag) { return "<span>" + escapeHtml(tag) + "</span>"; }).join("");
    var category = project.type === "github" ? "" : "<span class=\"project-card-category\">" + escapeHtml(project.category) + "</span>";
    return "<article class=\"hub-card hub-card--" + escapeHtml(project.type) + "\" data-reveal data-project-type=\"" + escapeHtml(project.type) + "\"><div class=\"hub-card-art\">" + pictureMarkup(project) + category + "</div><div class=\"hub-card-body\"><div class=\"status-row\"><span class=\"status-label\">" + escapeHtml(project.status) + "</span>" + demo + "</div><h2>" + escapeHtml(project.title) + "</h2><p>" + escapeHtml(project.summary) + "</p><div class=\"tag-list\">" + tags + "</div>" + projectLinkMarkup(project) + "</div></article>";
  }

  function renderHub() {
    var caseGrid = document.querySelector("[data-project-grid=case-studies]");
    var githubGrid = document.querySelector("[data-project-grid=github-projects]");
    if ((!caseGrid && !githubGrid) || !window.DEAN_PROJECTS) return;
    var caseStudies = window.DEAN_PROJECTS.filter(function (project) { return project.type === "case-study"; });
    var githubProjects = window.DEAN_PROJECTS.filter(function (project) { return project.type === "github"; });
    if (caseGrid) caseGrid.innerHTML = caseStudies.map(cardMarkup).join("");
    if (githubGrid) githubGrid.innerHTML = githubProjects.map(cardMarkup).join("");
    var count = document.querySelector("[data-project-count]");
    if (count) count.textContent = window.DEAN_PROJECTS.length + " indexed projects";
    setupReveal();
  }

  function setupFilters() {
    var buttons = document.querySelectorAll("[data-project-filter]");
    var groups = document.querySelectorAll("[data-project-group]");
    if (!buttons.length || !groups.length) return;

    function applyFilter(filter) {
      groups.forEach(function (group) {
        var visible = filter === "all" || group.getAttribute("data-project-group") === filter;
        group.hidden = !visible;
      });
      buttons.forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-project-filter") === filter));
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () { applyFilter(button.getAttribute("data-project-filter")); });
    });
    applyFilter("all");
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
        output.innerHTML = "<strong>Estimated output</strong><span>Available production minutes: " + result.availableMinutes.toLocaleString() + "</span><span>Complete packs: " + result.completePacks.toLocaleString() + " · Sticks: " + result.sticks.toLocaleString() + "</span><span>Complete cartons: " + result.completeCartons.toLocaleString() + " · Complete cases: " + result.completeCases.toLocaleString() + " · Remaining cartons: " + result.remainingCartons.toLocaleString() + "</span><span>Assumptions: " + form.elements.sticksPerPack.value + " sticks/pack · " + form.elements.packsPerCarton.value + " packs/carton · " + form.elements.cartonsPerCase.value + " cartons/case</span>";
      } catch (error) {
        output.textContent = error.message;
      }
    });
  }

  function init() {
    setupMenu();
    renderHub();
    setupFilters();
    setupReveal();
    setupQrDemo();
    setupCalculator();
  }

  init();
}());
