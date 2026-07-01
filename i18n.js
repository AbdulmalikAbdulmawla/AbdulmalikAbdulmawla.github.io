/* ============================================================
   Lightweight EN⇄DE toggle for the portfolio (no framework).
   English is the in-HTML default (works with JS disabled).
   German strings live here, keyed by the `data-i18n` attribute.
   Publications are intentionally NOT translated (published in English).
   Language is remembered in localStorage; ?lang=de forces German.
   ============================================================ */
(function () {
  "use strict";

  var DE = {
    "hero.eyebrow": "Computational Urban Design · Raumökonomische Forschung",
    "hero.lede":
      "Ich entwickle Forschungswerkzeuge, die urbane Daten in Evidenz verwandeln – " +
      "und verknüpfe dabei räumliche Strukturen mit lokaler Wertschöpfung, " +
      "Dienstleistungsökonomien und der Resilienz städtischer Systeme. Doktorand an " +
      "der Bauhaus-Universität Weimar.",

    "tab.work": "Arbeiten",
    "tab.research": "Forschung",
    "tab.experience": "Werdegang",
    "tab.about": "Über mich",

    "research.h": "Forschung",

    "about.h": "Über mich",
    "about.p1":
      "Ich bin Raumökonomie-Forscher und Computational Urban Designer. Meine Arbeit " +
      "untersucht städtische Strukturen im Verhältnis zu lokaler Wertschöpfung, " +
      "Dienstleistungsökonomien und Resilienz – und verknüpft räumliche Konfiguration " +
      "empirisch mit ökonomischer Dynamik, um eine nachhaltige Stadt- und " +
      "Regionalentwicklung zu unterstützen.",
    "about.p2":
      "Methodisch arbeite ich mit GIS, Netzwerkanalyse, agentenbasierter Simulation und " +
      "datengetriebenen Verfahren (Python, R, C#). Mein Promotionsprojekt untersucht die " +
      "raumökonomische Dynamik lokaler Produktions- und Dienstleistungsstrukturen: " +
      "<em>„Räumliche Abhängigkeit des städtischen Einzelhandels: detaillierte Methoden " +
      "zur Verortung von Aktivitäten auf Straßenebene“</em> (Betreuer: Prof. Dr. Reinhard König).",
    "about.p3":
      "In einem Jahrzehnt Lehre und Forschung – in Deutschland, Ägypten, Jordanien und " +
      "Äthiopien – habe ich immer wieder die Werkzeuge gebaut, die Analysen reproduzierbar " +
      "machen: von Grasshopper-Plug-ins für die räumliche Datenanalyse bis hin zu " +
      "interaktiven Web-Plattformen für Open-Data-Exploration und evidenzbasiertes Entwerfen.",

    "work.h": "Ausgewählte Arbeiten",
    "work.c1.title": "VSP&nbsp;Unfallatlas – Verkehrssicherheits-Explorer",
    "work.c1.role": "Alleiniger Entwickler · Bauhaus Weimar, EDIH.TH",
    "work.c1.body":
      "Eine interaktive Web-Plattform zur Exploration deutscher Unfalldaten: räumliche " +
      "Aggregation, Erkennung von Unfallhäufungsstellen und statistische Methoden für eine " +
      "evidenzbasierte Verkehrssicherheitsanalyse. Läuft vollständig im Browser " +
      "(DuckDB-WASM + deck.gl).",
    "work.c1.link": "Live-App öffnen →",
    "work.c2.title": "DeCodingSpaces Toolbox",
    "work.c2.role": "Mitautor · C# / Grasshopper",
    "work.c2.body":
      "Eine freie Open-Source-Toolbox für die rechnergestützte Analyse und Generierung von " +
      "Straßennetzen, Parzellen und Gebäuden. Ich habe C#-Komponenten entwickelt, die " +
      "statistische Analysen und sozioökonomische Indikatoren in parametrische Stadtmodelle " +
      "integrieren. Eine Kooperation der Bauhaus Weimar, ETH Zürich, AIT Wien und des " +
      "FCL Singapur (GPL v3).",
    "work.c2.link": "Zur Toolbox →",
    "work.c3.title": "Plattformen für offene Mobilitätsdaten",
    "work.c3.role": "Wissenschaftlicher Mitarbeiter · EDIH.TH, Bauhaus Weimar",
    "work.c3.body":
      "Interaktive Plattformen zur Datenexploration und digitale Dateninfrastrukturen für " +
      "offene Mobilitätsdaten, entwickelt im Rahmen der Data-Science-Beratung öffentlicher " +
      "Institutionen am European Digital Innovation Hub Thüringen.",
    "work.c3.link": "Zum Code →",
    "work.c4.title": "Discovering Cities – Workshop &amp; Austausch",
    "work.c4.role": "Projektkoordinator · DAAD, Weimar ↔ Amman",
    "work.c4.body":
      "Ein DAAD-gefördertes Austauschprojekt zwischen der Bauhaus-Universität Weimar und der " +
      "German-Jordanian University in Amman. Ich habe den Antrag verfasst, die Finanzen " +
      "verwaltet und das Lehr- und Workshop-Programm organisiert.",
    "work.c4.link": "Zur Workshop-Seite →",

    "pub.h": "Ausgewählte Publikationen",
    "pub.more":
      'Vollständige Liste auf <a href="https://www.researchgate.net/profile/Abdulmalik-Abdulmawla" ' +
      'target="_blank" rel="noopener">ResearchGate</a>.',

    "exp.h": "Berufserfahrung",
    "exp.e1.date": "2023 – heute",
    "exp.e1.role": "Wissenschaftlicher Mitarbeiter – Professur Verkehrssystemplanung",
    "exp.e1.body":
      "Erhebung und Analyse offener Mobilitätsdaten, Entwicklung interaktiver Plattformen zur " +
      "Datenexploration und Data-Science-Beratung öffentlicher Institutionen.",
    "exp.e2.role": "Wissenschaftlicher Mitarbeiter – Informatik in der Architektur (InfAR/InfAU)",
    "exp.e2.body":
      "Lehre rechnergestützter Methoden für Stadtplanung und -analyse; Entwicklung von " +
      "Entwurfs- und Forschungswerkzeugen (DeCodingSpaces Toolbox); Unterstützung " +
      "wissenschaftlicher Publikationen.",
    "exp.e3.role": "Mitautor – DeCodingSpaces Toolbox",
    "exp.e3.body":
      "C#-Programmierung für eine Grasshopper-Toolbox zur Stadtanalyse; Testing, Dokumentation " +
      "und Beratung für Stadtprojekte und Workshops.",
    "exp.e4.role": "Wissenschaftlicher Mitarbeiter – Lehre &amp; Computational Design",
    "exp.e4.body":
      "Lehre von rechnergestütztem und parametrischem Entwerfen (Grasshopper, Processing, " +
      "Arduino) in einem RIBA-Part-I-zertifizierten Programm.",
    "exp.e5.role": "Mitgründer &amp; Architekt",
    "exp.e5.body":
      "Entwurfsstudio und Architekturberatung – Wohn-, Bildungs- und Wettbewerbsprojekte " +
      "(u. a. der Lusail Underpass Competition, Katar).",

    "teach.h": "Lehre &amp; Workshops",
    "teach.list":
      "<li><strong>2022</strong> – Place Syntax Tool Workshop (Teilnehmer), eCAADe 2022, Bergen</li>" +
      "<li><strong>2018</strong> – Discovering Cities Workshop (Organisator), German-Jordanian University, Amman</li>" +
      "<li><strong>2018</strong> – Urban Analysis, Synthesis &amp; Exploration with Grasshopper (Organisator), eCAADe 2018, Łódź</li>" +
      "<li><strong>2016</strong> – Rural-to-Urban Transformation Workshop (Organisator), Emerging City Lab, Addis Abeba</li>" +
      "<li><strong>2015</strong> – Simulating Agent-Based Systems using Processing (Organisator), Kairo</li>",
    "teach.seminars":
      "Gehaltene Universitätsseminare: Algorithmic Architecture · Parametric Urban Design " +
      "&amp; Analysis · SYNCITY&nbsp;I&nbsp;&amp;&nbsp;II · Digitales Verkehrssimulationslabor · " +
      "Open Mobility Data · Rent-a-Data-Scientist.",

    "skills.h": "Kompetenzen",
    "skills.g1": "Programmierung",
    "skills.g2": "Räumlich &amp; analytisch",
    "skills.g2list":
      "<li>GIS</li><li>Netzwerkanalyse</li><li>Agentenbasierte Simulation</li>" +
      "<li>Space Syntax</li><li>Räumliche Datenverarbeitung</li>",
    "skills.g3": "Modellierung &amp; Medien",
    "skills.g4": "Sprachen",
    "skills.g4list":
      "<li>Arabisch (Muttersprache)</li><li>Englisch (fließend)</li><li>Deutsch (sehr gut)</li>",

    "foot.loc": "Weimar, Deutschland"
  };

  var STORE = "lang";
  var toggle = document.getElementById("lang-toggle");
  var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-i18n]"));

  // cache the English original (the in-HTML default) so we can restore it
  nodes.forEach(function (el) { el.__en = el.innerHTML; });

  function apply(lang) {
    var de = lang === "de";
    nodes.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      el.innerHTML = de && DE[key] != null ? DE[key] : el.__en;
    });
    document.documentElement.lang = de ? "de" : "en";
    if (toggle) {
      toggle.textContent = de ? "EN" : "DE";
      toggle.setAttribute("aria-label", de ? "Switch to English" : "Auf Deutsch umschalten");
    }
    try { localStorage.setItem(STORE, lang); } catch (e) {}
  }

  // initial language: ?lang= wins, then stored preference, else English
  var initial = new URLSearchParams(location.search).get("lang");
  if (initial !== "de" && initial !== "en") {
    try { initial = localStorage.getItem(STORE); } catch (e) { initial = null; }
  }
  apply(initial === "de" ? "de" : "en");

  if (toggle) {
    toggle.addEventListener("click", function () {
      apply(document.documentElement.lang === "de" ? "en" : "de");
    });
  }
})();
