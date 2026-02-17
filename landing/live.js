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

// Scroll reveal
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .arch-card, .team-card, .stat, .section-title, .section-desc, .dash-card').forEach(function(el) {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(function(a) {
  a.addEventListener('click', function() {
    document.querySelector('.nav-links').classList.remove('open');
  });
});

// Initial fetch + interval
fetchStats();
setInterval(fetchStats, REFRESH_INTERVAL);
