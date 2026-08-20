// ===========================================================================
// script.js — routing, rendering, filters/sort, exam switching, mobile nav.
// Reads CHAPTERS/CLUSTERS (data.js, JEE) and NEET_CHAPTERS/NEET_CLUSTERS
// (data_neet.js) — both loaded before this file, neither ever edited here.
//
// IMPORTANT: chapter ids are NOT unique across exams (both datasets have
// e.g. "physics-current-electricity" with different values), so every
// route is namespaced by exam: /jee/... and /neet/... — a correctness
// requirement, not a style choice.
//
// This file drives the static chrome already in index.html: the header
// nav (built from [data-nav] placeholders), the exam-switch widgets
// (#examSwitch / #examSwitchMobile, [data-exam-opt] buttons).
// SEO is handled entirely in seo.js via setSEO().
// ===========================================================================
(function () {
  "use strict";
  // Dynamic hydration: map NEET quickWin and highValueHighEffort flags from valueVsEffort metadata
  if (typeof NEET_CHAPTERS !== "undefined") {
    NEET_CHAPTERS.forEach(c => {
      c.quickWin = (c.valueVsEffort === "Quick Win");
      c.highValueHighEffort = (c.valueVsEffort === "High Value, High Effort");
    });
  }

  const pageArea = document.getElementById("pageArea");

  const SUBJECT_META = {
    physics: { label: "Physics" },
    chemistry: { label: "Chemistry" },
    maths: { label: "Mathematics" },
    botany: { label: "Botany" },
    zoology: { label: "Zoology" },
  };

  const EXAMS = {
    jee: {
      key: "jee",
      label: "JEE Main",
      tagline: "JEE Main · Physics, Chemistry, Mathematics",
      chapters: CHAPTERS,
      clusters: CLUSTERS,
      chaptersById: CHAPTERS_BY_ID,
      clustersById: CLUSTERS_BY_ID,
      subjects: ["physics", "chemistry", "maths"],
      timeSplit: [
        { label: "Physics", pct: 30 },
        { label: "Chemistry", pct: 30 },
        { label: "Mathematics", pct: 40 },
      ],
      heroGlyphs: { "": "&int;", priority: "#", clusters: "&#8942;" },
      sources: [
        { name: "NTA JEE Main 2026 syllabus", use: "Current syllabus verification", url: "https://jeemain.nta.nic.in/document/syllabus-2026/" },
        { name: "SATHEE JEE chapterwise weightage", use: "Historical chapter level trend", url: "https://sathee.iitk.ac.in/sathee-jee/chapterwise-weightage/" },
        { name: "SATHEE Maths weightage", use: "Individual Maths chapter data (2017–2024)", url: "https://sathee.iitk.ac.in/sathee-jee/chapterwise-weightage/maths/" },
        { name: "SATHEE Physics topic analysis", use: "Physics cluster and priority signals (2018–2024)", url: "https://www.sathee.iitk.ac.in/topic-weightage-analysis/jee-physics-weightage/" },
        { name: "SATHEE Chemistry chapterwise data", use: "Chemistry historical chapter signals (2018–2024)", url: "https://sathee.iitk.ac.in/sathee-neet/chapterwise-weightage/chemistry/" },
        { name: "Indian Express JEE Main 2025 analysis", use: "Recent trend cross-check", url: "https://education.indianexpress.com/news/jee-main-2025-chapter-wise-weightage-for-maths-physics-chemistry-2482777" },
        { name: "MathonGo PYQ repository", use: "PYQ availability and chapterwise practice (2022–2025)", url: "https://www.mathongo.com/iit-jee/nta-abhyas-question-paper-pdf-download-chapterwise-for-jee-main" },
        { name: "Zollege chapter trend table", use: "Five year grouped trend cross-check (2021–2025)", url: "https://zollege.in/exams/jee-main/chapter-wise-weightage" },
      ],
      methodology: {
        formula: "Focus Score = 30% × [Weightage Signal] + 45% × [Scoring Potential] + 25% × [Prerequisite Value]",
        components: [
          { name: "Weightage Signal (30%)", desc: "Normalized min-max weightage signal extracted across all 76 chapters based on verified 5-year averages." },
          { name: "Scoring Potential (45%)", desc: "Evaluation of question return characteristics—how predictable, repeatable, and straightforward the chapter is to clear in exams." },
          { name: "Prerequisite Value (25%)", desc: "Measures structural linkage value—the degree to which mastering this chapter unlocks success in subsequent high-priority topics." }
        ],
        tiers: [
          { name: "Tier S", range: "Score ≥ 80", desc: "High-weightage foundations & high-yield topics. Crucial first-pass priority.", class: "tier-s" },
          { name: "Tier A", range: "Score 60 – 79.9", desc: "Reliable scoring chapters with healthy return on time.", class: "tier-a" },
          { name: "Tier B", range: "Score 40 – 59.9", desc: "Secondary yield. Address once S and A Tier materials are secure.", class: "tier-b" },
          { name: "Tier C", range: "Score < 40", desc: "Lower frequency or specialized concepts. Revise selectively.", class: "tier-c" }
        ]
      }
    },
    neet: {
      key: "neet",
      label: "NEET UG",
      tagline: "NEET UG · Physics, Chemistry, Botany, Zoology",
      chapters: NEET_CHAPTERS,
      clusters: NEET_CLUSTERS,
      chaptersById: NEET_CHAPTERS_BY_ID,
      clustersById: NEET_CLUSTERS_BY_ID,
      subjects: ["physics", "chemistry", "botany", "zoology"],
      timeSplit: [
        { label: "Physics", pct: 25 },
        { label: "Chemistry", pct: 25 },
        { label: "Botany", pct: 25 },
        { label: "Zoology", pct: 25 },
      ],
      heroGlyphs: { "": "&#10010;", priority: "#", clusters: "&#8942;" },
      sources: [
        { name: "NTA NEET UG 2026 Information Bulletin", use: "Exam pattern, marking, compulsory questions, duration", url: "https://neet.nta.nic.in/document/information-bulletin-english/" },
        { name: "NTA NEET UG 2026 Syllabus", use: "Current syllabus verification", url: "https://neet.nta.nic.in/documents/" },
        { name: "SATHEE NEET Physics chapterwise weightage", use: "Historical chapter frequency (2018–2024)", url: "https://sathee.iitk.ac.in/sathee-neet/chapterwise-weightage/physics/" },
        { name: "SATHEE NEET Chemistry chapterwise weightage", use: "Historical chapter frequency (2018–2024)", url: "https://sathee.iitk.ac.in/sathee-neet/chapterwise-weightage/chemistry/" },
        { name: "SATHEE NEET Biology chapterwise weightage", use: "Historical Biology baseline, split into Botany and Zoology for planning", url: "https://sathee.iitk.ac.in/sathee-neet/chapterwise-weightage/biology/" },
        { name: "Careers360 NEET 2025 paper chapter analysis", use: "Recent paper cross-check", url: "https://medicine.careers360.com/articles/neet-chapter-wise-weightage-as-per-2025-paper" },
        { name: "Careers360 NEET 2026 exam analysis", use: "Recent paper cross-check", url: "https://medicine.careers360.com/articles/neet-2026-exam-analysis-live-updates" },
        { name: "Careers360 NEET 2026 weightage analysis", use: "Expected chapter pattern cross-check", url: "https://medicine.careers360.com/articles/neet-weightage-2026-biology-physics-chemistry-high-weightage-chapters-and-topics-list" },
        { name: "SATHEE topic weightage overview", use: "Context for multi-year analysis", url: "https://sathee.iitk.ac.in/topic-weightage-analysis/" },
      ],
      methodology: {
        formula: "Focus Score = 30% × [Expected Questions] + 45% × [Scoring Potential] + 25% × [Prerequisite Value]",
        components: [
          { name: "Expected Questions (30%)", desc: "Normalized question contribution projection based on subject-specific weighting limits (45-question baseline blocks)." },
          { name: "Scoring Potential (45%)", desc: "Evaluation of direct fact retention return. Rewards predictable questions with high conceptual return-on-time values." },
          { name: "Prerequisite Value (25%)", desc: "Structural dependency scores, representing structural leverage across physical chemistry and biology core segments." }
        ],
        tiers: [
          { name: "Tier S", range: "Score ≥ 80", desc: "Highly recurring structural pillars. Secure these topics first.", class: "tier-s" },
          { name: "Tier A", range: "Score 60 – 79.9", desc: "Key supporting chapters with standard conceptual outputs.", class: "tier-a" },
          { name: "Tier B", range: "Score 40 – 59.9", desc: "Moderate return. Address once structural foundations are cleared.", class: "tier-b" },
          { name: "Tier C", range: "Score < 40", desc: "Selective or peripheral topics. Use for targeted formula reviews.", class: "tier-c" }
        ],
        dataNote: "Biology percentages are expressed relative to 45-question Botany/Zoology planning blocks, and cross-checked against Sartha, Educart, Class24, Motion and Aakash paper analyses alongside the sources below."
      }
    },
  };

  const DEFAULT_EXAM = "jee";
  const STORAGE_KEY = "theta_exam";

  function subjectLabel(s) { return SUBJECT_META[s]?.label || s; }
  function tierBadge(tier) { return `<span class="badge badge-tier-${tier.toLowerCase()}">Tier ${tier}</span>`; }
  function subjectBadge(subj) { return `<span class="badge badge-${subj}">${subjectLabel(subj)}</span>`; }
  function fmt(n) { return n === null || n === undefined ? "—" : n; }
  function avgWeightage(c) {
    return c.weightageSignal === null || c.weightageSignal === undefined ? "—" : `${c.weightageSignal}%`;
  }

  function getStoredExam() { try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } }
  function setStoredExam(key) { try { localStorage.setItem(STORAGE_KEY, key); } catch (e) {} }
  
  function getActivePath() {
    let path = window.location.pathname;
    // Normalize index routes to root path
    if (path === "/index.html" || path === "/index" || path === "/index.htm") {
      path = "/";
    }
    if (window.location.hash && window.location.hash.startsWith("#/")) {
      path = window.location.hash.slice(1);
    }
    return path;
  }

  function examFromPath(path) {
    const segs = path.split("/").filter(Boolean).filter(s => s !== "index.html" && s !== "index.htm");
    const seg = segs[0];
    return EXAMS[seg] ? seg : null;
  }
  
  function hrefFor(examKey, navKey) {
    if (navKey === "home") return `/${examKey}/`;
    return `/${examKey}/${navKey}`;
  }

  // ---------------------------------------------------------------------
  // chapter card / priority row
  // ---------------------------------------------------------------------
  function chapterCard(examKey, c) {
    return `
    <a class="chapter-card subj-${c.subject} reveal" href="/${examKey}/chapter/${c.id}" data-link>
      <div class="row-top">
        ${subjectBadge(c.subject)}
        ${tierBadge(c.tier)}
        ${c.quickWin ? `<span class="badge badge-quickwin">&#9889; Quick win</span>` : ""}
      </div>
      <h3>${c.chapter}</h3>
      <p class="why">${c.whyItMatters || ""}</p>
      <div class="stat-row">
        <span class="stat-primary">Focus <b class="num">${fmt(c.focusScore)}</b></span>
        <span>Avg. weightage <b class="num">${avgWeightage(c)}</b></span>
      </div>
    </a>`;
  }

  function priorityRow(examKey, c, index) {
    const topRank = index < 3;
    return `
    <a class="priority-row reveal${topRank ? " top-rank" : ""}" href="/${examKey}/chapter/${c.id}" data-link>
      <span class="rank">${c.rank}</span>
      <div class="chap">
        <span class="chap-name">${c.chapter}</span>
        ${subjectBadge(c.subject)}
        ${tierBadge(c.tier)}
        ${c.quickWin ? `<span class="badge badge-quickwin">Quick win</span>` : ""}
      </div>
      <div class="metrics-wrap" style="display:contents">
        <span class="metric"><span class="metric-label">Focus</span><span class="num">${fmt(c.focusScore)}</span></span>
        <span class="metric"><span class="metric-label">Avg. weightage</span><span class="num">${avgWeightage(c)}</span></span>
      </div>
    </a>`;
  }

  function heroGlyph(exam, routeKey) {
    const g = exam.heroGlyphs[routeKey];
    return g ? `<span class="glyph" aria-hidden="true">${g}</span>` : "";
  }

  function timeSplitBlock(exam) {
    return `
    <div class="detail-section">
      <h2>Suggested time split</h2>
      <p class="lede" style="margin-top:-4px;">A neutral starting point — adjust after your own test results, and weight your weakest subject higher.</p>
      <div class="stat-cards">
        ${exam.timeSplit.map((s) => `<div class="stat-card"><div class="label">${s.label}</div><div class="value num">${s.pct}%</div></div>`).join("")}
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------------
  // views
  // ---------------------------------------------------------------------
  function viewHome(examKey, exam) {
    const topPriority = [...exam.chapters].sort((a, b) => b.focusScore - a.focusScore).slice(0, 8);
    const quickWins = exam.chapters.filter((c) => c.quickWin).sort((a, b) => b.returnOnTime - a.returnOnTime).slice(0, 6);
    const highEffort = exam.chapters.filter((c) => c.highValueHighEffort).sort((a, b) => b.focusScore - a.focusScore).slice(0, 4);
    const otherKey = examKey === "jee" ? "neet" : "jee";

    return `
    <section class="page-hero">
      ${heroGlyph(exam, "")}
      <p class="eyebrow">${exam.tagline}</p>
      <h1>What should I study first?</h1>
      <p class="lede">A priority and focus system built from historical PYQ trends, scoring potential and prerequisite
      value — not a prediction of the next paper. ${exam.chapters.length} chapters, ranked and sequenced so you
      always know the next move.</p>
      <div class="hero-actions">
        <a class="pill-link" href="/${examKey}/priority" data-link>Browse all ${exam.chapters.length} chapters &rarr;</a>
        <a class="pill-link" href="/${examKey}/about" data-link>How to read this</a>
      </div>
    </section>

    <div class="section">
      <div class="section-head">
        <h2>Top priorities</h2>
        <a class="see-all" href="/${examKey}/priority?sort=focus" data-link>See full ranking</a>
      </div>
      <div class="card-grid">${topPriority.map((c) => chapterCard(examKey, c)).join("")}</div>
    </div>

    <div class="section">
      <div class="section-head">
        <h2>Best quick wins</h2>
        <a class="see-all" href="/${examKey}/priority?filter=quickwin" data-link>See all quick wins</a>
      </div>
      <p class="lede" style="margin-top:-8px;">High priority chapters that need comparatively less effort — good
      picks when time is limited.</p>
      <div class="card-grid">${quickWins.map((c) => chapterCard(examKey, c)).join("")}</div>
    </div>

    <div class="section">
      <div class="section-head"><h2>Important, but plan for it</h2></div>
      <p class="lede" style="margin-top:-8px;">High value chapters that also demand a longer preparation cycle.
      Don't skip these — just don't expect them to be quick.</p>
      <div class="card-grid">${highEffort.map((c) => chapterCard(examKey, c)).join("")}</div>
    </div>

    <div class="section">${timeSplitBlock(exam)}</div>

    <div class="disclaimer-strip">
      Focus Score is a relative planning score, not an NTA score and not a prediction of exact questions.
      Weightage is a historical trend signal, not a guarantee. See the <a href="/${examKey}/about" data-link>about page</a>
      for how to read every number on this site, or use the switch in the header to jump to ${EXAMS[otherKey].label}.
    </div>`;
  }

  function applyFilters(exam, params, lockSubject) {
    let list = [...exam.chapters];
    if (lockSubject) {
      list = list.filter((c) => c.subject === lockSubject);
    } else {
      const subjects = (params.get("subject") || "").split(",").filter(Boolean);
      if (subjects.length) list = list.filter((c) => subjects.includes(c.subject));
    }
    const tiers = (params.get("tier") || "").split(",").filter(Boolean);
    const effort = params.get("effort");
    const q = (params.get("q") || "").trim().toLowerCase();
    const filter = params.get("filter");

    if (tiers.length) list = list.filter((c) => tiers.includes(c.tier));
    if (effort) list = list.filter((c) => c.effortBand === effort);
    if (filter === "quickwin") list = list.filter((c) => c.quickWin);
    if (filter === "higheffort") list = list.filter((c) => c.highValueHighEffort);
    if (q) list = list.filter((c) => c.chapter.toLowerCase().includes(q));

    const sort = params.get("sort") || "focus";
    const sorters = {
      focus: (a, b) => b.focusScore - a.focusScore,
      return: (a, b) => b.returnOnTime - a.returnOnTime,
      weightage: (a, b) => (b.weightageSignal ?? -Infinity) - (a.weightageSignal ?? -Infinity),
      rank: (a, b) => a.rank - b.rank,
      alpha: (a, b) => a.chapter.localeCompare(b.chapter),
      class: (a, b) => a.class - b.class,
    };
    list.sort(sorters[sort] || sorters.focus);
    return list;
  }

  function chip(label, active, href) {
    return `<a class="filter-chip${active ? " active" : ""}" href="${href}" data-link>${label}</a>`;
  }
  function toggleParamValue(params, key, value, basePath) {
    const current = (params.get(key) || "").split(",").filter(Boolean);
    const idx = current.indexOf(value);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(value);
    const next = new URLSearchParams(params);
    if (current.length) next.set(key, current.join(","));
    else next.delete(key);
    return `${basePath}?${next.toString()}`;
  }
  function toggleFlag(params, flagValue, basePath) {
    const next = new URLSearchParams(params);
    if (next.get("filter") === flagValue) next.delete("filter");
    else next.set("filter", flagValue);
    return `${basePath}?${next.toString()}`;
  }

  function controlsPanel(exam, params, basePath, lockSubject) {
    const TIERS = ["S", "A", "B", "C"];
    const tiers = (params.get("tier") || "").split(",").filter(Boolean);
    const filterFlag = params.get("filter");
    const sort = params.get("sort") || "focus";

    const subjectChips = !lockSubject
      ? exam.subjects.map((s) => {
          const subjects = (params.get("subject") || "").split(",").filter(Boolean);
          return chip(subjectLabel(s), subjects.includes(s), toggleParamValue(params, "subject", s, basePath));
        }).join("")
      : "";

    const tierChips = TIERS.map((t) => chip(`Tier ${t}`, tiers.includes(t), toggleParamValue(params, "tier", t, basePath))).join("");
    const quickWinChip = chip("&#9889; Quick wins", filterFlag === "quickwin", toggleFlag(params, "quickwin", basePath));
    const highEffortChip = chip("High value, high effort", filterFlag === "higheffort", toggleFlag(params, "higheffort", basePath));

    function sortLink(key, label) {
      const p = new URLSearchParams(params);
      p.set("sort", key);
      return `<a href="${basePath}?${p.toString()}" data-link class="${sort === key ? "active-sort" : ""}">${label}</a>`;
    }

    return `
    <div class="controls-panel">
      <div class="filter-bar">
        ${!lockSubject ? `<span class="filter-group-label">Subject</span>${subjectChips}<span class="filter-divider"></span>` : ""}
        <span class="filter-group-label">Tier</span>${tierChips}
        <span class="filter-divider"></span>
        ${quickWinChip}${highEffortChip}
      </div>
      <div class="filter-bar sort-row">
        <span class="filter-group-label">Sort</span>
        ${sortLink("focus", "Focus score")} ·
        ${sortLink("return", "Return on time")} ·
        ${sortLink("weightage", "Avg. weightage")} ·
        ${sortLink("rank", "Rank")} ·
        ${sortLink("alpha", "A–Z")} ·
        ${sortLink("class", "Class")}
      </div>
    </div>`;
  }

  function viewPriority(examKey, exam, params) {
    const results = applyFilters(exam, params, null);
    return `
    <section class="page-hero" style="padding-bottom:0;">
      ${heroGlyph(exam, "priority")}
      <p class="eyebrow">Priority explorer</p>
      <h1>All ${exam.chapters.length} chapters, ranked</h1>
    </section>
    ${controlsPanel(exam, params, `/${examKey}/priority`, null)}
    <p class="result-count">${results.length} chapter${results.length === 1 ? "" : "s"}</p>
    <div class="priority-list">
      ${results.map((c, i) => priorityRow(examKey, c, i)).join("") || `<p>No chapters match these filters.</p>`}
    </div>
    <div class="section">${timeSplitBlock(exam)}</div>`;
  }

  function viewSubject(examKey, exam, subj, params) {
    const results = applyFilters(exam, params, subj);
    const label = subjectLabel(subj);
    return `
    <div class="subject-tabs">
      ${exam.subjects.map((s) => `<a class="subject-tab tab-${s}${s === subj ? " active" : ""}" href="/${examKey}/${s}" data-link>${subjectLabel(s)}</a>`).join("")}
    </div>
    <p class="eyebrow">Subject matrix</p>
    <h1>${label}</h1>
    <p class="lede">${exam.chapters.filter((c) => c.subject === subj).length} chapters, filterable and sortable within ${label}.</p>
    ${controlsPanel(exam, params, `/${examKey}/${subj}`, subj)}
    <p class="result-count">${results.length} chapter${results.length === 1 ? "" : "s"}</p>
    <div class="card-grid">${results.map((c) => chapterCard(examKey, c)).join("") || `<p>No chapters match these filters.</p>`}</div>`;
  }

  function chapterInClusterList(cluster) {
    const steps = (cluster.recommendedOrder || "").split("→").map((s) => s.trim()).filter(Boolean);
    return steps.map((s, i) => `<span class="step">${s}</span>${i < steps.length - 1 ? `<span class="arrow">&rarr;</span>` : ""}`).join("");
  }

  function viewClusters(examKey, exam) {
    return `
    <section class="page-hero" style="padding-bottom:0;">
      ${heroGlyph(exam, "clusters")}
      <p class="eyebrow">Dependency-aware sequences</p>
      <h1>Clusters</h1>
      <p class="lede">Several chapters support each other. Follow the recommended order inside a cluster rather than
      studying isolated chapters.</p>
    </section>
    <div class="section" style="margin-top:26px;">
      ${exam.clusters.map((cl) => `
      <a class="cluster-card" href="/${examKey}/cluster/${cl.id}" data-link style="display:block;">
        <div class="row-top">${subjectBadge(cl.subject)}<span class="badge badge-outline">Priority ${cl.priority}</span></div>
        <h3>${cl.name}</h3>
        <div class="cluster-seq">${chapterInClusterList(cl)}</div>
        <p style="margin:0;font-size:13.5px;">${cl.why}</p>
      </a>`).join("")}
    </div>`;
  }

  function viewClusterDetail(examKey, exam, id) {
    const cl = exam.clustersById[id];
    if (!cl) return notFoundHTML(examKey);
    return `
    <p class="eyebrow">${subjectLabel(cl.subject)} cluster</p>
    <h1>${cl.name}</h1>
    <p class="lede">${cl.why}</p>
    <div class="cluster-seq" style="margin:20px 0;">${chapterInClusterList(cl)}</div>
    <div class="cluster-meta">
      <div><span>Entry point</span>${cl.entryPoint}</div>
      <div><span>End goal</span>${cl.endGoal}</div>
      <div><span>Highest priority chapter</span>${cl.highestPriority}</div>
      <div><span>Most difficult</span>${cl.mostDifficult}</div>
      <div><span>Best quick win</span>${cl.bestQuickWin}</div>
      <div><span>Prerequisite bottleneck</span>${cl.bottleneck}</div>
      <div><span>Practice target</span>${cl.practiceTarget}</div>
    </div>
    <p style="margin-top:22px;"><a class="pill-link" href="/${examKey}/clusters" data-link>&larr; All clusters</a></p>`;
  }

  function statCard(label, value) {
    return `<div class="stat-card"><div class="label">${label}</div><div class="value num">${fmt(value)}</div></div>`;
  }
  function statStripItem(label, value) {
    return `<div class="item"><span class="label">${label}</span><span class="value num">${fmt(value)}</span></div>`;
  }

  function viewChapterDetail(examKey, exam, id) {
    const c = exam.chaptersById[id];
    if (!c) return notFoundHTML(examKey);
    return `
    <div class="detail-head">
      ${subjectBadge(c.subject)} ${tierBadge(c.tier)}
      ${c.quickWin ? `<span class="badge badge-quickwin">&#9889; Quick win</span>` : ""}
      ${c.highValueHighEffort ? `<span class="badge badge-outline">High value, high effort</span>` : ""}
      <span class="badge badge-outline">Rank #${c.rank} · Class ${c.class}</span>
    </div>
    <p class="eyebrow">${subjectLabel(c.subject)}</p>
    <h1>${c.chapter}</h1>
    <p class="lede">${c.whyItMatters || ""}</p>

    <div class="stat-cards">
      ${statCard("Focus score", c.focusScore)}
      ${statCard("Average weightage", avgWeightage(c))}
      ${statCard("Typical difficulty", c.difficulty)}
      ${statCard("Value vs effort", c.valueVsEffort)}
    </div>

    <div class="detail-section">
      <h2>How to study it</h2>
      <div class="stat-strip">
        ${statStripItem("Return on time", c.returnOnTime)}
        ${statStripItem("Effort band", c.effortBand)}
      </div>
      <dl class="kv-list">
        <dt>Method</dt><dd>${c.studyMethod || "—"}</dd>
        ${c.questionStyle ? `<dt>Question style</dt><dd>${c.questionStyle}</dd>` : ""}
        ${c.firstPass ? `<dt>Suggested first pass</dt><dd>${c.firstPass}</dd>` : ""}
        ${c.branch ? `<dt>Branch</dt><dd>${c.branch}</dd>` : ""}
        ${c.ncertDependence ? `<dt>NCERT dependence</dt><dd>${c.ncertDependence}</dd>` : ""}
      </dl>
      ${c.focusTip ? `<p class="callout" style="margin-top:14px;">${c.focusTip}</p>` : ""}
    </div>

    <div class="detail-section"><h2>Prerequisites</h2><p>${c.prerequisitesText || "None listed."}</p></div>
    <div class="detail-section"><h2>Why this priority</h2><p>${c.priorityRationale || "—"}</p></div>
    <div class="detail-section"><h2>Historical signal</h2><p style="font-size:14px;color:var(--ink-soft);">${c.trendSignal || "—"}</p></div>

    <p style="margin-top:28px;"><a class="pill-link" href="/${examKey}/priority" data-link>&larr; Back to priority explorer</a></p>`;
  }

  function viewAbout(examKey, exam) {
    const otherKey = examKey === "jee" ? "neet" : "jee";
    const meth = exam.methodology;

    return `
    <p class="eyebrow">Methodology &amp; credits</p>
    <h1>About Theta</h1>
    <p class="lede">Theta is a chapter priority and focus system for competitive exam preparation in India — right
    now covering ${EXAMS.jee.label} chapter wise weightage and ${EXAMS.neet.label} chapter wise weightage, ranked
    by an explicit, documented formula rather than gut feel.</p>

    <div class="detail-section">
      <h2>How to find your way around</h2>
      <p>Start on <a href="/${examKey}/" data-link>Home</a> for the highest-priority ${exam.label} chapters and the
      quickest wins if your time is limited. Open <a href="/${examKey}/priority" data-link>Priority explorer</a> to
      browse every chapter, filter by subject or tier, and sort by Focus Score, Return on Time or Average Weightage.
      Use the subject pages for a syllabus-shaped view, and <a href="/${examKey}/clusters" data-link>Clusters</a>
      when a chapter depends on others — clusters show the recommended order, the entry point and the bottleneck to
      clear first. Each chapter page explains not just the score but the study method, prerequisites and the
      reasoning behind its priority. The suggested weekly time split sits at the bottom of Home and the Priority
      explorer. Use the JEE/NEET switch in the header any time you want to compare both exams' priority chapters.</p>
    </div>

    <div class="detail-section">
      <h2>${exam.label} Methodology</h2>
      <p class="lede">Focus Score is computed dynamically per chapter based on structural constraints and historical papers:</p>
      
      <div class="formula-container">
        <div class="formula-box">${meth.formula}</div>
      </div>

      <p style="margin-top:20px;font-weight:600;font-size:15px;color:var(--ink);">Formula Components Explained:</p>
      <ul class="methodology-list">
        ${meth.components.map((c, idx) => `
          <li class="methodology-item">
            <span class="methodology-icon">${idx + 1}</span>
            <div>
              <strong>${c.name}</strong> — ${c.desc}
            </div>
          </li>
        `).join("")}
      </ul>

      <p style="margin-top:24px;font-weight:600;font-size:15px;color:var(--ink);">Priority Tiers Matrix:</p>
      <div class="tier-matrix">
        ${meth.tiers.map((t) => `
          <div class="tier-matrix-card ${t.class}">
            <div class="tier-matrix-header">
              <span class="tier-matrix-title">${t.name}</span>
              <span class="tier-matrix-range">${t.range}</span>
            </div>
            <p class="tier-matrix-desc">${t.desc}</p>
          </div>
        `).join("")}
      </div>

      ${meth.dataNote ? `<p class="callout" style="margin-top:24px;">${meth.dataNote}</p>` : ""}
      <p style="font-size:13px;color:var(--ink-mute);margin-top:16px;">Neither Focus Score nor Average Weightage is an NTA-published
      figure or a prediction of the next paper — both are planning signals built from historical trend data.</p>
    </div>

    <div class="detail-section" id="credits">
      <h2>${exam.label} Data Credits &amp; Sources</h2>
      <p>Historical chapter weightage, scoring potential and prerequisite data for ${exam.label} were cross-checked
      against the following sources:</p>
      <ul class="credits-links-list">
        ${exam.sources.map((s) => `
          <li>
            <a href="${s.url}" target="_blank" rel="noopener">${s.name}</a> 
            <span style="color:var(--ink-mute);">— ${s.use}</span>
          </li>`).join("")}
      </ul>
    </div>

    <p style="margin-top:26px;font-size:13px;color:var(--ink-mute);">
      Preparing for ${EXAMS[otherKey].label} instead? <a href="/${otherKey}/about" data-link>See ${EXAMS[otherKey].label} credits and methodology</a>.
    </p>`;
  }

  function notFoundHTML(examKey) {
    const home = examKey && EXAMS[examKey] ? `/${examKey}/` : "/";
    return `<h1>Page not found</h1><p>That page doesn't exist. <a href="${home}" data-link>Back to home</a>.</p>`;
  }

  // ---------------------------------------------------------------------
  // router
  // ---------------------------------------------------------------------
  function render() {
    const path = getActivePath();
    const params = new URLSearchParams(window.location.search);
    const segs = path.split("/").filter(Boolean).filter(s => s !== "index.html" && s !== "index.htm");
    const examKey = examFromPath(path);

    // If path is completely empty, default immediately to the last-remembered exam (or "jee")
    if (segs.length === 0) {
      let stored = getStoredExam();
      if (!stored || !EXAMS[stored]) {
        stored = DEFAULT_EXAM;
        setStoredExam(stored);
      }
      try {
        history.replaceState({}, "", `/${stored}/`);
      } catch (e) {
        window.location.hash = `#/${stored}/`;
      }
      return render();
    }

    if (!examKey) {
      renderPage(null, notFoundHTML(null), "Not found — Theta", "Page not found.", path);
      return;
    }
    setStoredExam(examKey);
    const exam = EXAMS[examKey];
    const rest = segs.slice(1);
    const sub = rest[0];

    let html, title, description;
    if (rest.length === 0) {
      html = viewHome(examKey, exam);
      title = `Theta — what should I study first? (${exam.label})`;
      description = `A priority and focus system for ${exam.label}, built from historical trends, scoring potential and prerequisites.`;
    } else if (sub === "priority") {
      html = viewPriority(examKey, exam, params);
      title = `Priority explorer — ${exam.label} — Theta`;
      description = `All ${exam.label} chapters ranked by Focus Score, Return on Time and tier, with filters by subject and tier.`;
    } else if (exam.subjects.includes(sub)) {
      html = viewSubject(examKey, exam, sub, params);
      title = `${subjectLabel(sub)} priority — ${exam.label} — Theta`;
      description = `${subjectLabel(sub)} chapters ranked by Focus Score for ${exam.label}, filterable by tier and effort.`;
    } else if (sub === "clusters") {
      html = viewClusters(examKey, exam);
      title = `Clusters — ${exam.label} — Theta`;
      description = `Dependency-aware chapter sequences for ${exam.label}.`;
    } else if (sub === "cluster" && rest[1]) {
      html = viewClusterDetail(examKey, exam, rest[1]);
      title = `${exam.clustersById[rest[1]]?.name || "Cluster"} — ${exam.label} — Theta`;
      description = exam.clustersById[rest[1]]?.why || "";
    } else if (sub === "chapter" && rest[1]) {
      const c = exam.chaptersById[rest[1]];
      html = viewChapterDetail(examKey, exam, rest[1]);
      title = `${c?.chapter || "Chapter"} — ${exam.label} — Theta`;
      description = c?.whyItMatters || "";
    } else if (sub === "about") {
      html = viewAbout(examKey, exam);
      title = `About — ${exam.label} credits & methodology — Theta`;
      description = `How Focus Score, Average Weightage and tiers work for ${exam.label}, plus data sources and credits.`;
    } else {
      html = notFoundHTML(examKey);
      title = "Not found — Theta";
      description = "Page not found.";
    }

    renderPage(examKey, html, title, description, path);
  }

  function renderPage(examKey, html, title, description, path) {
    updateFavicon();
    pageArea.innerHTML = html;
    pageArea.classList.remove("page-enter");
    void pageArea.offsetWidth;
    pageArea.classList.add("page-enter");

    document.documentElement.setAttribute("data-exam", examKey || "jee");
    if (window.setSEO) window.setSEO({ title, description, path });
    setupReveal();
    syncChrome(examKey);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    closeMobileNav();

    if (window.location.hash) {
      const targetHash = window.location.hash.startsWith("#/") ? "" : window.location.hash;
      if (targetHash) {
        const target = document.getElementById(targetHash.slice(1));
        if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 60);
      }
    }
  }

  // ---------------------------------------------------------------------
  // chrome sync — nav links, exam-switch widgets, active states.
  // ---------------------------------------------------------------------
  function rebuildNavList(containerId, examKey, exam) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const subjectLinks = exam.subjects
      .map((s) => `<a data-link href="/${examKey}/${s}" data-nav="${s}">${subjectLabel(s)}</a>`)
      .join("");
    el.innerHTML =
      `<a data-link href="/${examKey}/priority" data-nav="priority">Priority</a>` +
      subjectLinks +
      `<a data-link href="/${examKey}/clusters" data-nav="clusters">Clusters</a>` +
      `<a data-link href="/${examKey}/about" data-nav="about">About</a>`;
  }

  function syncChrome(examKey) {
    const key = examKey && EXAMS[examKey] ? examKey : DEFAULT_EXAM;
    const exam = EXAMS[key];
    const path = getActivePath();

    rebuildNavList("mainNav", key, exam);
    rebuildNavList("mobileNavInner", key, exam);

    const brand = document.querySelector('.brand[data-nav="home"]');
    if (brand) brand.setAttribute("href", `/${key}/`);
    document.querySelectorAll(".footer-col a[data-nav]").forEach((a) => {
      a.setAttribute("href", hrefFor(key, a.getAttribute("data-nav")));
    });

    // Only toggle active state for header navigation and mobile drawer menu links
    document.querySelectorAll(".site-header a[data-link], .mobile-nav-panel a[data-link]").forEach((a) => {
      const href = a.getAttribute("href");
      a.classList.toggle("active", !!href && href !== "#" && (href === path || (href.length > 1 && path.startsWith(href))));
    });

    document.querySelectorAll(".exam-switch").forEach((sw) => {
      sw.classList.toggle("is-neet", key === "neet");
      sw.querySelectorAll("[data-exam-opt]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-exam-opt") === key);
      });
    });
  }

  function setupReveal() {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((node) => io.observe(node));
  }

  function navigate(path) {
    const activePath = getActivePath();
    if (path === activePath) return;
    try {
      history.pushState({}, "", path);
    } catch (e) {
      window.location.hash = `#${path}`;
    }
    render();
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if (!link) return;
    e.preventDefault();
    navigate(link.getAttribute("href"));
  });
  window.addEventListener("popstate", render);
  window.addEventListener("hashchange", () => {
    if (window.location.hash.startsWith("#/")) {
      render();
    }
  });

  // ---------------------------------------------------------------------
  // exam switch — animated slide (CSS) + brief transition overlay
  // ---------------------------------------------------------------------
  function switchExam(nextKey) {
    if (!EXAMS[nextKey] || nextKey === examFromPath(getActivePath())) return;
    const overlay = document.getElementById("examTransition");
    if (overlay) overlay.classList.add("active");
    setTimeout(() => {
      setStoredExam(nextKey);
      navigate(`/${nextKey}/`);
      setTimeout(() => { if (overlay) overlay.classList.remove("active"); }, 120);
    }, 380);
  }

  // ---------------------------------------------------------------------
  // mobile nav — slide-in drawer + backdrop
  // ---------------------------------------------------------------------
  function closeMobileNav() {
    const panel = document.getElementById("mobileNavPanel");
    const backdrop = document.getElementById("mobileNavBackdrop");
    const toggle = document.getElementById("menuToggle");
    if (!panel || !toggle) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    if (backdrop) backdrop.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  function openMobileNav() {
    const panel = document.getElementById("mobileNavPanel");
    const backdrop = document.getElementById("mobileNavBackdrop");
    const toggle = document.getElementById("menuToggle");
    if (!panel || !toggle) return;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    if (backdrop) backdrop.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("themeToggle");
    const root = document.documentElement;
    themeToggle.addEventListener("click", () => {
      const isDark = root.getAttribute("data-theme") === "dark";
      root.setAttribute("data-theme", isDark ? "light" : "dark");
      try { localStorage.setItem("theta_theme", isDark ? "light" : "dark"); } catch (e) {}
    });

    const menuToggle = document.getElementById("menuToggle");
    const mobilePanel = document.getElementById("mobileNavPanel");
    const mobileBackdrop = document.getElementById("mobileNavBackdrop");
    const mobileClose = document.getElementById("mobileNavClose");
    menuToggle.addEventListener("click", () => {
      if (mobilePanel.classList.contains("open")) closeMobileNav();
      else openMobileNav();
    });
    if (mobileClose) mobileClose.addEventListener("click", closeMobileNav);
    if (mobileBackdrop) mobileBackdrop.addEventListener("click", closeMobileNav);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMobileNav(); });

    // exam-switch widgets (header + mobile drawer)
    document.querySelectorAll("[data-exam-opt]").forEach((btn) => {
      btn.addEventListener("click", () => switchExam(btn.getAttribute("data-exam-opt")));
    });

    render();
  });
})();
function updateFavicon() {
  const isNEET = window.location.pathname.startsWith("/neet");
  const prefix = isNEET ? "neet" : "jee";

  document.querySelector('[data-favicon="ico"]').href =
    `/icons/favicon-${prefix}.ico`;

  document.querySelector('[data-favicon="32"]').href =
    `/icons/favicon-${prefix}-32x32.png`;

  document.querySelector('[data-favicon="16"]').href =
    `/icons/favicon-${prefix}-16x16.png`;

  document.querySelector('[data-favicon="apple"]').href =
    `/icons/apple-touch-icon-${prefix}.png`;
}