(function (root) {
  root.DEAN_PROJECTS = [
    {
      slug: "btc-production-intelligence",
      title: "BTC Production Intelligence Suite",
      category: "Manufacturing intelligence",
      status: "Private implementation",
      summary: "BTC Production Intelligence Suite is a modular manufacturing operations platform that brings production status, machine events, shift reporting, QR/Data Matrix workflows, technician activity and operational reporting into a browser-based interface.",
      artwork: "../assets/projects/case-studies/web/btc-production-intelligence",
      alt: "Industrial production intelligence monitoring and reporting illustration.",
      tags: ["Python", "Flask", "SQL"],
      route: "btc-production-intelligence/"
    },
    {
      slug: "industrial-integration",
      title: "Industrial Systems Integration",
      category: "Systems integration",
      status: "Private implementation",
      summary: "A staged integration architecture for moving industrial machine reports and events through local collection, validation, recovery-aware queueing, server-side ingestion and operational reporting.",
      artwork: "../assets/projects/case-studies/web/industrial-systems-integration",
      alt: "Connected industrial data services and systems integration illustration.",
      tags: ["Python", "REST API", "Recovery-aware"],
      route: "industrial-integration/"
    },
    {
      slug: "qr-traceability",
      title: "QR Traceability System",
      category: "QR traceability",
      status: "Sanitised demonstration",
      summary: "A controlled QR and Data Matrix workflow for identifying production packets, resolving their operational context and presenting a reviewable result to mobile or browser users.",
      artwork: "../assets/projects/case-studies/web/qr-traceability-system",
      alt: "QR packet scanning, validation and production traceability workflow illustration.",
      tags: ["Data Matrix", "Android", "REST API"],
      route: "qr-traceability/",
      demo: "Client-side packet lookup"
    },
    {
      slug: "android-operations",
      title: "Android Operations App",
      category: "Android operations",
      status: "Private implementation",
      summary: "An authenticated Android client for operational login, system-health checks, QR scanning and controlled access to production packet information.",
      artwork: "../assets/projects/case-studies/web/android-operations-evidence",
      artworkWidth: 1600,
      artworkHeight: 1100,
      alt: "Sanitised Android operations evidence composition showing application, QR scanning and packet details workflow.",
      tags: ["Kotlin", "Retrofit", "REST API"],
      route: "android-operations/"
    },
    {
      slug: "production-calculator",
      title: "Production Calculator & Planner",
      category: "Production planning",
      status: "Sanitised demonstration",
      summary: "A representative planning model for rated speed, shifts, downtime, efficiency and packaging conversions.",
      artwork: "../assets/projects/case-studies/web/production-calculator-planner",
      alt: "Production planning, capacity modelling and operational calculator illustration.",
      tags: ["JavaScript", "Data Models", "UI"],
      route: "production-calculator/",
      demo: "Static capacity calculator"
    },
    {
      slug: "legend-investigations",
      title: "Legend Investigations Platform",
      category: "Legend systems",
      status: "Concept / prototype",
      summary: "A privacy-conscious case-support concept for structuring research notes, evidence references, review status and controlled access without publishing sensitive subjects or operational methods.",
      artwork: "../assets/projects/case-studies/web/legend-investigations-platform",
      alt: "Secure investigation case management and evidence workflow illustration.",
      tags: ["OSINT", "Security", "Web"],
      route: "legend-investigations/"
    }
  ];
}(window));
