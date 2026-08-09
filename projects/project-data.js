(function (root) {
  root.DEAN_PROJECTS = [
    {
      slug: "btc-production-intelligence",
      type: "case-study",
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
      type: "case-study",
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
      type: "case-study",
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
      type: "case-study",
      title: "Android Operations App",
      category: "Android operations",
      status: "Private implementation",
      summary: "An authenticated Android client for operational login, system-health checks, QR scanning and controlled access to production packet information.",
      artwork: "../assets/projects/case-studies/web/android-operations-app",
      alt: "Android operational scanning and mobile workflow illustration.",
      tags: ["Kotlin", "Retrofit", "REST API"],
      route: "android-operations/"
    },
    {
      slug: "production-calculator",
      type: "case-study",
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
      type: "case-study",
      title: "Legend Investigations Platform",
      category: "Legend systems",
      status: "Concept / prototype",
      summary: "A privacy-conscious case-support concept for structuring research notes, evidence references, review status and controlled access without publishing sensitive subjects or operational methods.",
      artwork: "../assets/projects/case-studies/web/legend-investigations-platform",
      alt: "Secure investigation case management and evidence workflow illustration.",
      tags: ["OSINT", "Security", "Web"],
      route: "legend-investigations/"
    },
    {
      slug: "legend-location",
      type: "github",
      title: "Legend Location",
      status: "Public repository · MIT",
      summary: "Privacy-aware, consent-based phone metadata and authorized location analysis platform built with Flask.",
      artwork: "../assets/projects/github/project-legend-location",
      alt: "Legend Location project artwork",
      tags: ["Flask", "Python", "SQLite"],
      github: "https://github.com/DK4Never/Legend-Location"
    },
    {
      slug: "legend-systems-cv",
      type: "github",
      title: "Legend Systems CV",
      status: "Public repository · license review",
      summary: "An editable, selectable and print-safe static CV application for Dean Kruger.",
      artwork: "../assets/projects/github/project-legend-systems-cv",
      alt: "Legend Systems CV Builder project artwork",
      tags: ["Static HTML", "A4 print"],
      github: "https://github.com/DK4Never/legend-systems-cv",
      live: "https://dk4never.github.io/legend-systems-cv/",
      liveLabel: "OPEN CV BUILDER"
    },
    {
      slug: "legend-industrial-controls",
      type: "github",
      title: "Legend Industrial Controls",
      status: "Public repository · MIT",
      summary: "A modular industrial manufacturing platform for production monitoring, reporting, maintenance, inventory, HR and offline AI in PLC-driven manufacturing environments.",
      artwork: "../assets/projects/github/project-legend-industrial-controls",
      alt: "Legend Industrial Controls project artwork",
      tags: ["Python", "SQLite", "Offline"],
      github: "https://github.com/DK4Never/Legend-Industrial-Controls"
    },
    {
      slug: "legend-investigations-github",
      type: "github",
      title: "Legend Investigations",
      status: "Public repository · license not selected",
      summary: "An offline-first Tool Execution Engine and Center of Operations dashboard for approved reconnaissance and investigation workflows.",
      artwork: "../assets/projects/github/project-legend-investigations",
      alt: "Legend Investigations project artwork",
      tags: ["FastAPI", "React", "TypeScript"],
      github: "https://github.com/DK4Never/Legend-Investigations"
    },
    {
      slug: "legend-hextotext",
      type: "github",
      title: "Legend HexToText",
      status: "Public repository · MIT",
      summary: "An industrial Hex, Binary and ASCII analysis toolkit for reverse engineering, firmware inspection and text extraction.",
      artwork: "../assets/projects/github/project-legend-hextotext",
      alt: "Legend HexToText project artwork",
      tags: ["Python", "Intel HEX", "Binary analysis"],
      github: "https://github.com/DK4Never/Legend-HexToText"
    },
    {
      slug: "legend-devops",
      type: "github",
      title: "Legend Dev-OPS",
      status: "Public repository · license not selected",
      summary: "A local web console for Splintercell, case editing, DA-260, CSV exports, ingestion, RAG and company configuration.",
      artwork: "../assets/projects/github/project-legend-devops",
      alt: "Legend Dev-OPS project artwork",
      tags: ["Python", "SQLite", "RAG"],
      github: "https://github.com/DK4Never/Legend-Dev-OPS"
    },
    {
      slug: "legend-remote-support",
      type: "github",
      title: "Legend Remote Support",
      status: "Public repository · license not selected",
      summary: "A consent-based Android remote support platform with diagnostics, session approval, hardware diagnostics, dashboard, audit logging and LLM-assisted support tools.",
      artwork: "../assets/projects/github/project-legend-remote-support",
      alt: "Legend Remote Support project artwork",
      tags: ["Android", "Diagnostics", "Audit logging"],
      github: "https://github.com/DK4Never/legend-remote-support"
    },
    {
      slug: "legend-cyber-analyzer",
      type: "github",
      title: "Legend Cyber Analyzer",
      status: "Public repository · MIT",
      summary: "A cybersecurity project focused on cybersecurity, AI integration and advanced digital solutions.",
      artwork: "../assets/projects/github/project-legend-cyber-analyzer",
      alt: "Legend Cyber Analyzer project artwork",
      tags: ["Cybersecurity", "AI integration"],
      github: "https://github.com/DK4Never/legend-cyber-analyzer"
    }
  ];
}(window));
