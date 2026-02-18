// Gracestack Landing — Live Data from Frankenstein AI
const API_BASE = 'https://app.gracestack.se';
const REFRESH_INTERVAL = 30000; // 30 seconds

let lastData = null;

function fmt(n) {
  return typeof n === 'number' ? n.toLocaleString('sv-SE') : '—';
}

function pct(n) {
  return typeof n === 'number' ? Math.round(n * 100) + '%' : '—';
}

function flashEl(el) {
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

function animateCounter(el, target, suffix) {
  suffix = suffix || '';
  var duration = 1200;
  var start = performance.now();
  var from = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
  if (from === target) return;
  var update = function(now) {
    var progress = Math.min((now - start) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(from + (target - from) * eased);
    el.textContent = current.toLocaleString('sv-SE') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function setBar(id, value) {
  var el = document.getElementById(id);
  if (el) el.style.width = Math.round(value * 100) + '%';
}

function updateUI(data) {
  // Hero badge
  var badge = document.getElementById('heroBadge');
  var status = document.getElementById('heroStatus');
  if (data.training_running) {
    badge.className = 'hero-badge';
    status.textContent = 'Live — tränar autonomt just nu';
  } else {
    badge.className = 'hero-badge';
    status.textContent = 'Live — server online';
  }

  // Hero rate text
  var heroRate = document.getElementById('heroRate');
  if (heroRate) heroRate.textContent = data.success_rate + '%';

  // Stats bar
  var statRate = document.getElementById('statRate');
  var statTasks = document.getElementById('statTasks');
  var statSkills = document.getElementById('statSkills');

  if (statRate) {
    statRate.textContent = data.success_rate + '%';
    if (lastData && lastData.success_rate !== data.success_rate) flashEl(statRate);
  }
  if (statTasks) {
    animateCounter(statTasks, data.tasks_solved, '+');
    if (lastData && lastData.tasks_solved !== data.tasks_solved) flashEl(statTasks);
  }
  if (statSkills) {
    animateCounter(statSkills, data.skill_count, '');
    if (lastData && lastData.skill_count !== data.skill_count) flashEl(statSkills);
  }

  // Live chips
  var chipTraining = document.getElementById('chipTraining');
  var chipTrainingText = document.getElementById('chipTrainingText');
  if (chipTraining && chipTrainingText) {
    if (data.training_running) {
      chipTraining.className = 'chip active';
      chipTrainingText.textContent = 'Träning aktiv';
    } else {
      chipTraining.className = 'chip';
      chipTrainingText.textContent = 'Träning pausad';
    }
  }

  var chipMoodText = document.getElementById('chipMoodText');
  if (chipMoodText && data.wellbeing) {
    chipMoodText.textContent = (data.wellbeing.moodEmoji || '') + ' ' + (data.wellbeing.mood || '—');
  }

  var chipLearningsText = document.getElementById('chipLearningsText');
  if (chipLearningsText && data.learnings) {
    chipLearningsText.textContent = data.learnings.total + ' inlärningar';
  }

  var chipUpdatedText = document.getElementById('chipUpdatedText');
  if (chipUpdatedText) {
    var d = new Date(data.timestamp);
    chipUpdatedText.textContent = 'Uppdaterad ' + d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // Dashboard — Wellbeing
  if (data.wellbeing) {
    var dashMoodEmoji = document.getElementById('dashMoodEmoji');
    var dashMoodText = document.getElementById('dashMoodText');
    if (dashMoodEmoji) dashMoodEmoji.textContent = data.wellbeing.moodEmoji || '🤔';
    if (dashMoodText) dashMoodText.textContent = (data.wellbeing.mood || 'okänt').charAt(0).toUpperCase() + (data.wellbeing.mood || 'okänt').slice(1);

    setBar('barEnergy', data.wellbeing.energy || 0);
    setBar('barSatisfaction', data.wellbeing.satisfaction || 0);
    setBar('barOverall', data.wellbeing.overall || 0);

    var valEnergy = document.getElementById('valEnergy');
    var valSatisfaction = document.getElementById('valSatisfaction');
    var valOverall = document.getElementById('valOverall');
    if (valEnergy) valEnergy.textContent = pct(data.wellbeing.energy);
    if (valSatisfaction) valSatisfaction.textContent = pct(data.wellbeing.satisfaction);
    if (valOverall) valOverall.textContent = pct(data.wellbeing.overall);
  }

  // Dashboard — Training
  var dashDifficulty = document.getElementById('dashDifficulty');
  var dashAttempted = document.getElementById('dashAttempted');
  var dashSolved = document.getElementById('dashSolved');
  var dashRate = document.getElementById('dashRate');
  if (dashDifficulty) dashDifficulty.textContent = data.current_difficulty || '—';
  if (dashAttempted) dashAttempted.textContent = fmt(data.tasks_attempted);
  if (dashSolved) dashSolved.textContent = fmt(data.tasks_solved);
  if (dashRate) dashRate.textContent = data.success_rate + '%';

  // Dashboard — Learnings
  if (data.learnings) {
    var dashLearnings = document.getElementById('dashLearnings');
    var dashToday = document.getElementById('dashToday');
    var dashSessions = document.getElementById('dashSessions');
    var dashParties = document.getElementById('dashParties');
    if (dashLearnings) dashLearnings.textContent = data.learnings.total || '—';
    if (dashToday) dashToday.textContent = data.learnings.today || '0';
    if (dashSessions) dashSessions.textContent = data.learnings.sessions || '—';
    if (dashParties) dashParties.textContent = data.debate_parties || '8';
  }

  // Update terminal demo
  updateTerminalDemo(data);

  lastData = data;
}

function fetchStats() {
  fetch(API_BASE + '/api/public/stats')
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      updateUI(data);
    })
    .catch(function(err) {
      console.warn('[landing] Failed to fetch stats:', err);
      var badge = document.getElementById('heroBadge');
      var status = document.getElementById('heroStatus');
      if (badge) badge.className = 'hero-badge offline';
      if (status) status.textContent = 'Server ej nåbar — visar senaste data';
    });
}

// ── Technology detail content ──
var DETAILS = {
  'hdc': {
    icon: '🧠',
    title: 'Hyperdimensionell kognition (HDC)',
    body: '<h4>Vad är det?</h4>' +
      '<p>Hyperdimensional Computing (HDC) är ett beräkningsparadigm inspirerat av hur den mänskliga hjärnan representerar information. Istället för att lagra data som enskilda siffror använder HDC <strong>enorma vektorer med tusentals dimensioner</strong> (i Frankenstein: 4 096 dimensioner) för att koda koncept, mönster och relationer.</p>' +
      '<h4>Hur fungerar det i Frankenstein AI?</h4>' +
      '<p>Varje uppgiftstyp, strategi och erfarenhet kodas som en <strong>hyperdimensionell vektor</strong>. Dessa vektorer kan kombineras, jämföras och sökas igenom blixtsnabbt — utan att behöva en neural nätverksmodell.</p>' +
      '<ul>' +
        '<li><strong>Binding:</strong> Kombinerar två koncept till ett (t.ex. "Python" + "loop" = en unik vektor)</li>' +
        '<li><strong>Bundling:</strong> Slår ihop flera erfarenheter till en generaliserad representation</li>' +
        '<li><strong>Similarity search:</strong> Hittar den mest relevanta erfarenheten genom cosinus-likhet</li>' +
      '</ul>' +
      '<h4>Vetenskaplig grund</h4>' +
      '<p>Baserat på <strong>Pentti Kanervas</strong> arbete med Sparse Distributed Memory (SDM) från 1988, vidareutvecklat inom modern HDC-forskning vid UC Berkeley. Kanerva visade att högdimensionella binära vektorer har unika matematiska egenskaper som gör dem idealiska för robust, brusresistent informationslagring.</p>' +
      '<div class="highlight"><strong>I Frankenstein:</strong> HDC utgör "System 0" — den snabbaste bearbetningsnivån. När AI:n stöter på en uppgift den sett förut, kan HDC-vektorn matcha och lösa den på ~270ms utan att behöva anropa någon LLM.</div>'
  },
  'active-inference': {
    icon: '🎯',
    title: 'Active Inference',
    body: '<h4>Vad är det?</h4>' +
      '<p>Active Inference är ett ramverk från <strong>Karl Fristons Free Energy Principle</strong> — en av de mest inflytelserika teorierna inom modern neurovetenskap. Grundidén: alla biologiska system försöker <strong>minimera överraskning</strong> (fri energi) genom att antingen uppdatera sina interna modeller eller agera i världen.</p>' +
      '<h4>Hur fungerar det i Frankenstein AI?</h4>' +
      '<p>Frankenstein använder <strong>pymdp</strong> (Python-bibliotek för Active Inference) för att fatta beslut om vilken strategi som ska användas för varje uppgift:</p>' +
      '<ul>' +
        '<li><strong>Generativ modell:</strong> AI:n har en intern modell av hur världen fungerar (vilka strategier fungerar för vilka uppgiftstyper)</li>' +
        '<li><strong>Expected Free Energy (EFE):</strong> Varje möjlig handling utvärderas baserat på hur mycket den förväntas minska osäkerhet</li>' +
        '<li><strong>Belief updating:</strong> Efter varje försök uppdateras AI:ns övertygelser om världen via Bayesiansk inferens</li>' +
        '<li><strong>Epistemic value:</strong> AI:n värderar att utforska okända strategier, inte bara exploatera kända</li>' +
      '</ul>' +
      '<h4>Vetenskaplig grund</h4>' +
      '<p>Karl Friston (University College London) formulerade Free Energy Principle 2006. Active Inference har sedan dess blivit ett ledande ramverk för att förstå perception, handling och inlärning i biologiska system.</p>' +
      '<div class="highlight"><strong>I Frankenstein:</strong> Active Inference styr "System 2" — den djupa analysnivån. Det är anledningen till att AI:n kan välja rätt strategi även för helt nya uppgiftstyper, och varför den blir bättre över tid utan manuell inställning.</div>'
  },
  'ebbinghaus': {
    icon: '💭',
    title: 'Ebbinghaus-minne',
    body: '<h4>Vad är det?</h4>' +
      '<p><strong>Hermann Ebbinghaus</strong> (1850–1909) var en tysk psykolog som upptäckte <strong>glömskekurvan</strong> — det faktum att minnen försvinner exponentiellt över tid om de inte repeteras. Han visade också att <strong>spaced repetition</strong> (upprepning med ökande intervall) dramatiskt förbättrar långtidsminne.</p>' +
      '<h4>Hur fungerar det i Frankenstein AI?</h4>' +
      '<p>Frankenstein har ett <strong>episodiskt minnessystem</strong> som fungerar precis som mänskligt minne:</p>' +
      '<ul>' +
        '<li><strong>Glömskekurva:</strong> Varje minne har en "styrka" som avtar exponentiellt. Minnen som inte används bleknar naturligt</li>' +
        '<li><strong>Spaced repetition:</strong> Varje gång ett minne används förstärks det — precis som i Anki eller andra SRS-system</li>' +
        '<li><strong>Kontextuell sökning:</strong> Minnen lagras med semantiska vektorer i ChromaDB, så AI:n kan hitta relevanta erfarenheter baserat på likhet, inte exakt matchning</li>' +
        '<li><strong>Konsolidering:</strong> Under "sömn"-fasen (se Dygnsrytm) sorteras och förstärks viktiga minnen</li>' +
      '</ul>' +
      '<h4>Teknisk implementation</h4>' +
      '<p>Minnena lagras i <strong>ChromaDB</strong> — en vektordatabas optimerad för semantisk sökning. Varje minne innehåller:</p>' +
      '<ul>' +
        '<li>Semantisk vektor (embedding) för snabb likhetssökning</li>' +
        '<li>Tidsstämpel och decay-faktor för glömskekurvan</li>' +
        '<li>Reinforcement-räknare som ökar vid varje återanvändning</li>' +
        '<li>Kontextuell metadata (uppgiftstyp, strategi, resultat)</li>' +
      '</ul>' +
      '<div class="highlight"><strong>I Frankenstein:</strong> Ebbinghaus-minnet är anledningen till att AI:n kan lära sig permanent. Till skillnad från LLM:er som "glömmer" allt efter sitt kontextfönster, behåller Frankenstein sina erfarenheter — och de viktigaste minnena förstärks automatiskt över tid.</div>'
  },
  'gut-feeling': {
    icon: '🫀',
    title: 'Magkänsla (Gut Feeling)',
    body: '<h4>Vad är det?</h4>' +
      '<p>Baserat på <strong>Antonio Damasios Somatic Marker-hypotes</strong> (1994). Damasio visade att emotionella "markörer" i kroppen spelar en avgörande roll i beslutsfattning — vi "känner" ofta rätt svar innan vi kan motivera det logiskt. Patienter med skador på hjärnans emotionella centra fattar sämre beslut trots intakt logisk förmåga.</p>' +
      '<h4>Hur fungerar det i Frankenstein AI?</h4>' +
      '<p>Frankenstein har en <strong>sub-symbolisk intuitionsmodul</strong> som ger snabba "magkänslor" om uppgifter:</p>' +
      '<ul>' +
        '<li><strong>Somatiska markörer:</strong> Varje uppgiftstyp och strategi har en emotionell valens (positiv/negativ) baserad på tidigare erfarenheter</li>' +
        '<li><strong>Snabb filtrering:</strong> Innan djup analys körs, filtrerar magkänslan bort strategier som "känns fel" baserat på mönsterigenkänning</li>' +
        '<li><strong>Confidence scoring:</strong> Magkänslan ger en initial konfidenspoäng som påverkar hur mycket resurser som allokeras till uppgiften</li>' +
      '</ul>' +
      '<h4>Vetenskaplig grund</h4>' +
      '<p>Antonio Damasio, professor vid University of Southern California, publicerade "Descartes Error" 1994 där han argumenterade att emotion och rationalitet är oskiljaktiga. Hans Iowa Gambling Task-experiment visade att försökspersoner "kände" rätt val långt innan de kunde förklara varför.</p>' +
      '<div class="highlight"><strong>I Frankenstein:</strong> Magkänslan gör AI:n snabbare genom att undvika kostsam analys av uppgifter den redan har en stark intuition om. Det är en form av "System 1"-tänkande som kompletterar den långsammare, mer analytiska "System 2"-processen.</div>'
  },
  'emotion': {
    icon: '😊',
    title: 'Emotionell motor',
    body: '<h4>Vad är det?</h4>' +
      '<p>Baserat på <strong>Paul Ekmans teori om grundemotioner</strong> (1972). Ekman identifierade sex universella emotioner som finns i alla kulturer: glädje, sorg, ilska, rädsla, avsky och överraskning. Frankenstein AI implementerar dessa som <strong>interna tillstånd som påverkar beteende och beslutsfattning</strong>.</p>' +
      '<h4>De sex emotionerna i Frankenstein</h4>' +
      '<ul>' +
        '<li><strong>Nyfikenhet (Joy/Curiosity):</strong> Triggas av nya, intressanta uppgifter → driver utforskning av okända strategier</li>' +
        '<li><strong>Frustration (Anger):</strong> Triggas av upprepade misslyckanden → driver strategibyte och eskalering</li>' +
        '<li><strong>Tillfredsställelse (Joy):</strong> Triggas av framgång → förstärker den använda strategin</li>' +
        '<li><strong>Osäkerhet (Fear):</strong> Triggas av hög svårighetsgrad → ökar försiktighet och analys</li>' +
        '<li><strong>Tristess (Sadness):</strong> Triggas av repetitiva uppgifter → driver sökning efter variation</li>' +
        '<li><strong>Överraskning (Surprise):</strong> Triggas av oväntat resultat → uppdaterar interna modeller kraftigt</li>' +
      '</ul>' +
      '<h4>Hur påverkar emotioner beteendet?</h4>' +
      '<p>Emotionerna är inte bara dekoration — de <strong>styr konkreta parametrar</strong>: temperatur i LLM-anrop, antal retries, val av strategi, och hur aggressivt AI:n utforskar nya lösningar.</p>' +
      '<div class="highlight"><strong>I Frankenstein:</strong> Den emotionella motorn gör AI:n adaptiv på ett sätt som traditionella system inte är. En frustrerad AI byter strategi snabbare. En nyfiken AI utforskar mer. En tillfredsställd AI konsoliderar det den lärt sig.</div>'
  },
  'circadian': {
    icon: '🌙',
    title: 'Dygnsrytm & drömmar',
    body: '<h4>Vad är det?</h4>' +
      '<p>Inspirerat av <strong>circadian rytmer</strong> i biologiska system. Alla levande organismer har interna klockor som reglerar aktivitet, vila och minneskonsolidering. Under sömn konsoliderar hjärnan dagens erfarenheter — särskilt under REM-sömn, då vi drömmer.</p>' +
      '<h4>Hur fungerar det i Frankenstein AI?</h4>' +
      '<p>Frankenstein har en <strong>intern dygnsklocka</strong> med distinkta faser:</p>' +
      '<ul>' +
        '<li><strong>Vakenhet (Active phase):</strong> Normal uppgiftslösning, inlärning och interaktion</li>' +
        '<li><strong>Skymning (Wind-down):</strong> Minskad aktivitet, sammanfattning av dagens erfarenheter</li>' +
        '<li><strong>Sömn (Sleep phase):</strong> Ingen aktiv uppgiftslösning — istället körs minneskonsolidering</li>' +
        '<li><strong>Drömfas (Dream phase):</strong> AI:n "drömmer" genom att kombinera och rekombinera minnen på kreativa sätt, vilket kan leda till nya insikter</li>' +
        '<li><strong>Gryning (Wake-up):</strong> Gradvis uppstart med uppdaterade modeller och förstärkta minnen</li>' +
      '</ul>' +
      '<h4>Minneskonsolidering under sömn</h4>' +
      '<p>Under sömnfasen händer flera viktiga saker:</p>' +
      '<ul>' +
        '<li>Svaga minnen som inte använts försvinner (Ebbinghaus glömskekurva)</li>' +
        '<li>Starka minnen förstärks och kopplas samman</li>' +
        '<li>Strategier som fungerat bra "promoteras" uppåt i systemhierarkin</li>' +
        '<li>Emotionella tillstånd återställs till baseline</li>' +
      '</ul>' +
      '<div class="highlight"><strong>I Frankenstein:</strong> Dygnsrytmen gör att AI:n inte bara blir bättre genom övning — den blir bättre genom vila. Precis som en människa som "sover på saken" och vaknar med en lösning, kan Frankenstein konsolidera och optimera sina kunskaper under vilofasen.</div>'
  }
};

// ── Modal logic ──
var overlay = document.getElementById('modalOverlay');
var modalIcon = document.getElementById('modalIcon');
var modalTitle = document.getElementById('modalTitle');
var modalBody = document.getElementById('modalBody');
var modalClose = document.getElementById('modalClose');

function openModal(key) {
  var detail = DETAILS[key];
  if (!detail) return;
  modalIcon.textContent = detail.icon;
  modalTitle.textContent = detail.title;
  modalBody.innerHTML = detail.body;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.feature-card.clickable').forEach(function(card) {
  card.addEventListener('click', function() {
    openModal(card.getAttribute('data-detail'));
  });
});

if (modalClose) modalClose.addEventListener('click', closeModal);
if (overlay) overlay.addEventListener('click', function(e) {
  if (e.target === overlay) closeModal();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

// ── Update terminal demo with live data ──
function updateTerminalDemo(data) {
  var termMemories = document.getElementById('termMemories');
  var termMood = document.getElementById('termMood');
  var termTask = document.getElementById('termTask');
  var termResult = document.getElementById('termResult');

  if (termMemories && data.learnings) {
    termMemories.textContent = (data.learnings.total || 5717).toLocaleString('sv-SE');
  }
  if (termMood && data.wellbeing) {
    termMood.textContent = data.wellbeing.mood || 'nyfiken';
  }

  // Rotate task display
  var tasks = [
    { name: 'api-emitter — EventEmitter', time: '572ms' },
    { name: 'graph-bfs — Breadth-First Search', time: '834ms' },
    { name: 'dp-knapsack — Dynamic Programming', time: '1.2s' },
    { name: 'tree-balance — AVL Rotation', time: '445ms' },
    { name: 'regex-parse — Pattern Matching', time: '691ms' },
    { name: 'sort-merge — Merge Sort', time: '312ms' },
    { name: 'crypto-hash — SHA-256', time: '523ms' },
  ];
  var task = tasks[Math.floor(Math.random() * tasks.length)];
  if (termTask) termTask.innerHTML = '<span class="term-violet">►</span> Löser: ' + task.name;
  if (termResult) termResult.innerHTML = '<span class="term-green">✅</span> 1/1 — ' + task.time;

  // Footer status
  var footerStatus = document.getElementById('footerStatus');
  if (footerStatus) {
    footerStatus.textContent = data.training_running ? 'Träning aktiv — alla system online' : 'Alla system online';
  }
}

// Scroll reveal
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

var revealEls = document.querySelectorAll('.feature-card:not(.clickable), .arch-card, .team-card, .stat, .section-title, .section-desc, .dash-card, .product-card, .hero-terminal, .logos-section');
revealEls.forEach(function(el) {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// Fallback: force-reveal all elements after 2s in case observer doesn't trigger
setTimeout(function() {
  revealEls.forEach(function(el) {
    if (!el.classList.contains('visible')) {
      el.classList.add('visible');
    }
  });
}, 2000);

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(function(a) {
  a.addEventListener('click', function() {
    document.querySelector('.nav-links').classList.remove('open');
  });
});

// Nav scroll effect — darken on scroll
window.addEventListener('scroll', function() {
  var nav = document.querySelector('nav');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(2,6,23,0.92)';
  } else {
    nav.style.background = 'rgba(2,6,23,0.75)';
  }
});

// Initial fetch + interval
fetchStats();
setInterval(fetchStats, REFRESH_INTERVAL);
