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
      "Ich dekodiere urbane Rohdaten und parametrisiere die Methoden, um sie zu " +
      "erkunden – damit evidenzbasierte Entscheidungen und Entwürfe leichtfallen. Meine " +
      "Forschung richtet das auf eine Frage: Wo kann sich wirtschaftliches Handeln in der " +
      "Stadt verorten – und wie bleibt städtischer Raum offen für die kleinen Ökonomien " +
      "und Kollektive, die Menschen von unten aufbauen? Doktorand an der " +
      "Bauhaus-Universität Weimar.",
    "hero.cv": "Lebenslauf (PDF) herunterladen ↓",

    "tab.work": "Arbeiten",
    "tab.research": "Forschung",
    "tab.teaching": "Lehre",
    "tab.experience": "Werdegang",
    "tab.about": "Über mich",

    "research.h": "Forschung",

    "rs.h": "Forschungsstatement",
    "rs.p1":
      "Eine Überzeugung trägt meine Arbeit seit meiner Bachelorarbeit: " +
      "<strong>Eigenständige Produktion in kleinen, dichten Quartieren zu stärken, macht " +
      "Gemeinschaften heterogener und selbsttragender.</strong> Zuerst erprobt habe ich " +
      "sie in Istanbuls Şişhane-Viertel – ich kartierte die Abhängigkeitsnetzwerke der " +
      "Handwerksateliers und simulierte ihre informellen Produktionslinien als eine " +
      "Bottom-up-Fabrik (Masterarbeit, 2013). Danach habe ich ein Jahrzehnt an der " +
      "Bauhaus-Universität Weimar erworben, was diese Frage verlangte – parametrische " +
      "Spatial-Query-Methoden, die Aktivitäten auf Straßenebene mit den umgebenden " +
      "Stadtformen verknüpfen, statistisches Werkzeug (DeCodingSpaces Toolbox, mineR) und " +
      "offene Datenplattformen. Die Methode bleibt konstant: <strong>Rohdaten dekodieren, " +
      "die Analyse parametrisieren und die Evidenz die Entscheidung tragen lassen</strong> " +
      "– damit Städte die Kraft kleiner ökonomischer Kollektive verstehen und ihr Raum " +
      "geben können.",

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
      "Über fast zwei Jahrzehnte – von der Architekturpraxis in Ägypten und den VAE bis zu " +
      "einem Jahrzehnt Lehre und Forschung in Deutschland, Ägypten, Jordanien und Äthiopien – " +
      "habe ich immer wieder die Werkzeuge gebaut, die Analysen reproduzierbar machen: von " +
      "Grasshopper-Plug-ins für die räumliche Datenanalyse bis hin zu interaktiven " +
      "Web-Plattformen für Open-Data-Exploration und evidenzbasiertes Entwerfen.",

    "edu.h": "Ausbildung",
    "edu.li1":
      "<strong>Promotion – laufend</strong> (seit Nov. 2018) · " +
      "<a href=\"https://www.uni-weimar.de/de/architektur-und-urbanistik/professuren/infau/\" " +
      "target=\"_blank\" rel=\"noopener\">Informatik in der Architektur und Urbanistik (InfAU)</a>, " +
      "Bauhaus-Universität Weimar – Arbeitstitel: <em>„Spatial dependency of urban retail: " +
      "detailed methods for positioning street-level activities“</em>",
    "edu.li2":
      "<strong>M.A. Architektur</strong> (2013) · " +
      "<a href=\"https://www.hs-anhalt.de/\" target=\"_blank\" rel=\"noopener\">Hochschule Anhalt</a>, " +
      "Dessau-Roßlau – Thesis: <em>„Heterogeneous-Atelier Industry: Revitalization as Social " +
      "Stratification of Atelier Industrial Community“</em>",
    "edu.li3":
      "<strong>B.Sc. Architektur und Ingenieurwesen</strong> (2007) · " +
      "<a href=\"https://www.mans.edu.eg/\" target=\"_blank\" rel=\"noopener\">Fakultät für " +
      "Ingenieurwesen, Mansoura University</a>, Ägypten",

    "comp.h": "Wettbewerbe",
    "comp.list":
      "<li><strong>2014</strong> – Lusail Underpasses Public Art Competition, Phase 1 &amp; 2 · Lusail Real Estate, Doha, Katar</li>" +
      "<li><strong>2007</strong> – 2. Platz, 4. National Architecture Students Competition · Fakultät für Ingenieurwesen, Universität Kairo</li>" +
      "<li><strong>2006</strong> – 1. Platz, 3. National Architecture Students Competition · Fakultät für Ingenieurwesen, Universität Kairo</li>",

    "recog.h": "Auszeichnung",
    "recog.body":
      "2026 – Würdigung des zehnjährigen Dienstjubiläums an der Bauhaus-Universität Weimar, " +
      "überreicht vom Universitätspräsidenten.",

    "work.h": "Ausgewählte Arbeiten",
    "work.c1.title": "VSP&nbsp;Unfallatlas – Verkehrssicherheits-Explorer",
    "work.c1.role": "Alleiniger Entwickler · Bauhaus Weimar, EDIH.TH",
    "work.c1.body":
      "Eine interaktive Web-Plattform zur Exploration deutscher Unfalldaten: räumliche " +
      "Aggregation, Erkennung von Unfallhäufungsstellen und statistische Methoden für eine " +
      "evidenzbasierte Verkehrssicherheitsanalyse. Läuft vollständig im Browser " +
      "(DuckDB-WASM + deck.gl).",
    "work.c1.link": "Live-App öffnen →",
    "work.c7.title": "Heterogene Industrien — Şişhanes Bottom-up-Fabrik",
    "work.c7.role": "Masterarbeit, mit Ali Farhan · Hochschule Anhalt, Dessau · Istanbul 2013",
    "work.c7.body":
      "Istanbuls Şişhane-Viertel produziert seit über einem Jahrhundert Leuchten: " +
      "Tausende kleiner Ateliers, die als eine dezentrale, informelle Produktionslinie " +
      "arbeiten. Wir kartierten die Abhängigkeitsnetzwerke der Ateliers und simulierten " +
      "ihr Verhalten mit agentenbasierten Modellen über 3D-Zellulärautomaten – und " +
      "entschlüsselten so, wie eine selbstorganisierte Ökonomie über Generationen robust " +
      "bleibt, und schlugen vor, wie sich das Viertel verdichten lässt, ohne seine " +
      "Produzenten durch Gentrifizierung zu verdrängen.",
    "work.c7.link": "Projektzusammenfassung (PDF) →",
    "work.c7.link2": "Poster — SimAUD 2016 (PDF) →",
    "work.c6.title": "Aktive Fassaden kartieren — Einzelhandel &amp; Stadtform",
    "work.c6.role": "Erstautor · 13. Space Syntax Symposium, Bergen",
    "work.c6.body":
      "Eine Methode, um Aktivität im Erdgeschoss dort zu kartieren, wo sie der Stadt " +
      "tatsächlich begegnet: an der Gebäudefassade. Einzelhandels-, Dienstleistungs- und " +
      "Wohnfassaden in Weimar werden über alle Maßstäbe der Stadtform verknüpft — Straße, " +
      "Parzelle, Block, Gebäude — für MAUP-bewusste räumliche Abfragen, " +
      "Gravitations-Erreichbarkeit und Zentralitätsanalysen. Aufbauend auf einer " +
      "parametrischen Spatial-Query-Pipeline (eCAADe&nbsp;2022).",
    "work.c6.link": "Zum Paper →",
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
    "work.c5.title": "mineR — R-Statistik in Grasshopper",
    "work.c5.role": "Hauptautor &amp; Entwickler · C# / R / Grasshopper",
    "work.c5.body":
      "Ein Grasshopper-Plugin, das die statistische Analyse von R in die parametrische " +
      "Entwurfsumgebung bringt — integrierte Datenanalyse, Regression und Visualisierung direkt " +
      "im Modellierungs-Workflow. Vorgestellt auf der 36. eCAADe (2018).",
    "work.c5.link": "Zum Beitrag →",

    "stats.pubs": "Publikationen",
    "stats.reads.n": "12.000+",
    "stats.reads": "Aufrufe",
    "stats.cites": "Zitationen",
    "stats.rg": "ResearchGate-Profil →",

    "pub.h": "Ausgewählte Publikationen",
    "pub.more":
      'Vollständige Liste auf <a href="https://www.researchgate.net/profile/Abdulmalik-Abdulmawla" ' +
      'target="_blank" rel="noopener">ResearchGate</a>.',

    "exp.h": "Berufserfahrung",
    "exp.e1.date": "Dez. 2023 – heute",
    "exp.e1.role": "Wissenschaftlicher Mitarbeiter – Professur Verkehrssystemplanung",
    "exp.e1.body":
      "Erhebung und Analyse offener Mobilitätsdaten, Entwicklung interaktiver Plattformen zur " +
      "Datenexploration und Data-Science-Beratung öffentlicher Institutionen – inklusive Schulungen " +
      "für Verwaltungen zu europäischen Standards für offene Mobilitätsdaten, Unterstützung bei " +
      "der Datenveröffentlichung auf der Mobilithek sowie Betreuung studentischer Projekte und " +
      "Masterarbeiten (Digital Transport Research Lab).",
    "exp.e2.date": "Apr. – Nov. 2023",
    "exp.e2.role": "Doktorand – Informatik in der Architektur und Urbanistik (InfAU)",
    "exp.e2.body":
      "Übergangsphase mit Fokus auf die eigene Dissertation und die Planung der nächsten Etappe " +
      "meiner Forschungslaufbahn.",
    "exp.e3.date": "Dez. 2017 – Jan. 2019",
    "exp.e3.role": "Projektkoordinator – DAAD-Austauschprojekt „Discovering Cities“",
    "exp.e3.body":
      "DAAD-gefördertes Austauschprojekt zwischen der Bauhaus-Universität Weimar und der " +
      "German-Jordanian University in Amman – parallel zur Stelle als wissenschaftlicher " +
      "Mitarbeiter am InfAR. Verfassen des Projektantrags, Verwaltung der Finanzen, Lehrseminar " +
      "in Weimar und Vorbereitung des Workshops in Amman.",
    "exp.e4.date": "Mai 2016 – März 2023",
    "exp.e4.role": "Wissenschaftlicher Mitarbeiter – Informatik in der Architektur (InfAR, heute InfAU)",
    "exp.e4.body":
      "Lehre rechnergestützter Methoden für Stadtplanung und -analyse; Entwicklung von " +
      "Entwurfs- und Forschungswerkzeugen (DeCodingSpaces Toolbox, mineR); Betreuung von " +
      "Masterarbeiten; Konferenzvorträge sowie Unterstützung von Publikationen, Ausstellungen " +
      "und Exkursionen.",
    "exp.e5.date": "Mai 2016 – 2020",
    "exp.e5.role": "Mitautor – DeCodingSpaces Toolbox",
    "exp.e5.body":
      "C#-Programmierung für eine Grasshopper-Toolbox zur Stadtanalyse; Testing, Dokumentation " +
      "und Beratung für Stadtprojekte und Workshops.",
    "exp.e6.date": "Okt. 2014 – Apr. 2016",
    "exp.e6.role": "Wissenschaftlicher Mitarbeiter – Lehre &amp; Computational Design",
    "exp.e6.body":
      "Lehre von rechnergestütztem und parametrischem Entwerfen (Grasshopper, Processing, " +
      "Arduino) in einem RIBA-Part-I-zertifizierten Programm.",
    "exp.e7.date": "Jan. 2012 – Apr. 2016",
    "exp.e7.role": "Mitgründer &amp; Architekt",
    "exp.e7.body":
      "Entwurfsstudio und Architekturberatung – Wohn-, Bildungs- und Wettbewerbsprojekte " +
      "(u. a. der Lusail Underpass Competition, Katar).",
    "exp.e8.date": "Mai 2009 – Sep. 2011",
    "exp.e8.role": "Junior-Architekt",
    "exp.e8.body":
      "Halbstaatliches Planungsbüro – Bauherrenvertretung für ausgelagerte Projekte und " +
      "Kundenberatung bei internen Projekten.",
    "exp.e9.date": "Jul. 2008 – Apr. 2009",
    "exp.e9.role": "Freiberuflicher Architekt",
    "exp.e9.org": "Selbstständige Tätigkeit, Ägypten",
    "exp.e9.body": "3D-Modellierung und Visualisierung von Wohnbauprojekten.",
    "exp.e10.date": "Jul. 2007 – Jun. 2008",
    "exp.e10.role": "Junior-Architekt",
    "exp.e10.body":
      "Architekturentwurf und Planung im Büro von Kamel Louqman &amp; Amir Wahid.",
    "exp.e11.date": "Jun. – Aug. 2005",
    "exp.e11.role": "Praktikant (Grundstudium)",
    "exp.e11.body": "CAD-Entwurf, Layout und Plotten vollständiger Projektsätze.",

    "teaching.h": "Lehre",
    "sem.h": "Universitätsseminare",
    "sem.list":
      "<li><strong>2023 – heute</strong> – Digital Traffic Simulation Lab · Open Mobility Data · " +
      "Rent-a-Data-Scientist – Professur Verkehrssystemplanung, Bauhaus-Universität Weimar</li>" +
      "<li><strong>2016 – 2023</strong> – Algorithmic Architecture · Parametric Urban Design &amp; Analysis · " +
      "SYNCITY&nbsp;I&nbsp;&amp;&nbsp;II · Circular Urbanism – InfAR/InfAU, Bauhaus-Universität Weimar</li>" +
      "<li><strong>2018</strong> – Discovering-Cities-Lehrseminar (DAAD-Austausch), Bauhaus-Universität Weimar</li>" +
      "<li><strong>2014 – 2016</strong> – Design 5 Studio · Web Application in Architecture – AASTMT, Kairo " +
      "(RIBA-Part-I-Programm)</li>",
    "sup.body":
      "Laufend: Betreuung von Masterarbeiten und studentischen Projekten – am InfAR/InfAU " +
      "(2016–2023) und im Digital Transport Research Lab der Professur Verkehrssystemplanung " +
      "(seit 2023).",
    "worg.h": "Organisierte Workshops",
    "worg.list":
      "<li><strong>2018</strong> – <a href=\"https://toolbox.decodingspaces.net/discovering-cities-workshop-amman/\" target=\"_blank\" rel=\"noopener\">Discovering Cities Workshop</a>, German-Jordanian University, Amman</li>" +
      "<li><strong>2018</strong> – <a href=\"https://toolbox.decodingspaces.net/ecaade2018-workshop-urban-analysis-synthesis-and-exploration-with-grasshopper/\" target=\"_blank\" rel=\"noopener\">Urban Analysis, Synthesis &amp; Exploration with Grasshopper</a>, eCAADe 2018, Łódź</li>" +
      "<li><strong>2016</strong> – Rural-to-Urban Transformation Workshop, Emerging City Lab, Addis Abeba</li>" +
      "<li><strong>2015</strong> – Simulating Agent-Based Systems using Processing, Kairo</li>",
    "watt.h": "Besuchte Workshops &amp; Ausstellungen",
    "watt.list":
      "<li><strong>2022</strong> – Place Syntax Tool Workshop, eCAADe 2022, Bergen</li>" +
      "<li><strong>2017</strong> – Data Informed Urban Design, Complexity Science Hub Vienna, Wien</li>" +
      "<li><strong>2017</strong> – Data Analysis &amp; Machine Learning with Geo-Spatial Data, SSS11, Lissabon</li>" +
      "<li><strong>2012</strong> – 13. Architekturbiennale Venedig, „Maribor 2112 YC“, Slowenischer Pavillon</li>",

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
    // the CV download is a different file per language (CV vs. Lebenslauf)
    var cv = document.getElementById("cv-link");
    if (cv) {
      var file = de ? "Abdulmawla-Lebenslauf.pdf" : "Abdulmawla-CV.pdf";
      cv.setAttribute("href", "assets/" + file);
      cv.setAttribute("download", file);
    }
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
