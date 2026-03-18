// ===== WAIT FOR AUTH.JS TO LOAD =====
document.addEventListener('DOMContentLoaded', function() {
  // ===== AUTH =====
  if (typeof protectPage === 'function') {
    protectPage();
  }
  
  // Check admin flag from session (set during login from Users sheet)
  var isAdmin = sessionStorage.getItem('agentEdgeAdmin') === 'true';
  if (!isAdmin) {
    window.location.href = 'portal.html';
  }
});

// ===== PIN GATE =====
// PIN stored as hash in localStorage
function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Check if PIN already verified this session
var pinVerified = sessionStorage.getItem('agentEdgePinVerified') === 'true';

if (pinVerified) {
  // Already verified - show dashboard immediately
  document.getElementById('pinGate').style.display = 'none';
  document.querySelector('.app-layout').style.display = 'flex';
} else {
  // Show PIN gate, hide dashboard
  document.getElementById('pinGate').style.display = 'flex';
  document.querySelector('.app-layout').style.display = 'none';
  // Show setup message if no PIN set yet
  if (!localStorage.getItem('agentEdgeAdminPin')) {
    document.getElementById('pinPrompt').textContent = 'Create your admin PIN (first time setup)';
  }
}

function verifyPin(e) {
  e.preventDefault();
  var pin = document.getElementById('adminPinInput').value;
  var pinHash = simpleHash(pin);
  var storedPinHash = localStorage.getItem('agentEdgeAdminPin');

  if (!storedPinHash) {
    // First time - set the PIN
    localStorage.setItem('agentEdgeAdminPin', pinHash);
    enterDashboard();
    return;
  }

  if (pinHash !== storedPinHash) {
    document.getElementById('pinError').style.display = 'block';
    document.getElementById('adminPinInput').value = '';
    document.getElementById('adminPinInput').focus();
    return;
  }

  enterDashboard();
}

function enterDashboard() {
  sessionStorage.setItem('agentEdgePinVerified', 'true');
  document.getElementById('pinGate').style.display = 'none';
  document.querySelector('.app-layout').style.display = 'flex';
  // Load pipeline from Supabase so dashboard stats populate
  loadPipeline();
  loadTeamRoster();
  updateDashboard();
}

// ===== VIEW SWITCHING =====
function switchView(viewId, navEl) {
  document.querySelectorAll('.view-panel').forEach(function(v) { v.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var view = document.getElementById('view-' + viewId);
  if (view) view.classList.add('active');
  if (navEl) navEl.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');

  // Lazy-load data for each view
  if (viewId === 'pipeline' && !pipelineLoaded) loadPipeline();
  if (viewId === 'crm' && !crmLoaded) loadCrm();
  if (viewId === 'orders' && !ordersLoaded) loadOrders();
  if (viewId === 'users' && !usersLoaded) loadUsers();
  if (viewId === 'analytics') loadAnalytics();
  if (viewId === 'portal') loadPartnerPortal();
  if (viewId === 'scenarios') loadScenarios();
  if (viewId === 'calendar') renderCalendar();
  if (viewId === 'settings') initSettingsView();
  if (viewId === 'email') loadEmailCenter();
  if (viewId === 'users') loadBlogPosts();
  if (viewId === 'webinars') wpInit();
  if (viewId === 'webinarLauncher') wbLoadWebinars();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

function switchCalcView(mode) {
  var w2 = document.getElementById('calcViewW2');
  var se = document.getElementById('calcViewSE');
  if (mode === 'w2') { w2.style.display = 'block'; se.style.display = 'none'; }
  else if (mode === 'se') { w2.style.display = 'none'; se.style.display = 'block'; }
  else { w2.style.display = 'block'; se.style.display = 'block'; }
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// ===== DASHBOARD =====
function updateDashboard() {
  var h = new Date().getHours();
  var greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashGreeting').textContent = greet + ', Kristy';

  var d = new Date();
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('dashSubtitle').textContent = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();

  // Pipeline stats
  var active = pipelineLoans.length;
  var navEl = document.getElementById('navPipelineCount');
  if (navEl) navEl.textContent = active;

  // Active Pipeline $ — cumulative loan amounts
  var pipelineTotal = 0;
  pipelineLoans.forEach(function(loan) {
    if (loan.loan_amount) pipelineTotal += parseFloat(loan.loan_amount) || 0;
  });
  document.getElementById('dashPipelineVol').textContent = pipelineTotal > 0 ? '$' + Math.round(pipelineTotal).toLocaleString() : '$0';

  // Closed This Month + Decision counts for chart
  var userId = localStorage.getItem('agent_edge_user') || 'default';
  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  
  // Fetch all outcomes this month (not just funded)
  fetch(API_BASE + '/ae-loans-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getMonthlyDecisions', month_start: monthStart })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      var closedTotal = 0;
      var closedCount = 0;
      var decisionCounts = { funded: 0, denied: 0, suspended: 0, withdrawn: 0 };
      (data.history || []).forEach(function(h) {
        if (h.outcome === 'funded') {
          if (h.loan_amount) closedTotal += parseFloat(h.loan_amount) || 0;
          closedCount++;
        }
        if (decisionCounts[h.outcome] !== undefined) decisionCounts[h.outcome]++;
      });
      document.getElementById('dashClosed').textContent = closedTotal > 0 ? '$' + Math.round(closedTotal).toLocaleString() : '$0';
      document.getElementById('dashClosedSub').textContent = closedCount + ' loan' + (closedCount !== 1 ? 's' : '') + ' funded';
      
      // Store for chart rendering
      window._dashDecisionCounts = decisionCounts;
      window._dashFundedVolume = closedTotal;
      renderPipelineHTML();
    }
  })
  .catch(function() {});

  // Render charts
  renderPipelineHTML();
  renderLoanTypeHTML();

  // Load production metrics and pipeline velocity (moved from Analytics)
  if (typeof loadAnalytics === 'function') loadAnalytics();
}

// ===== MC PIPELINE BARS (HTML) =====
function renderPipelineHTML() {
  var stageRows = [
    { id: 'warm', label: 'WARM LEADS', color: '#818cf8' },
    { id: 'active', label: 'ACTIVE CONVOS', color: '#f472b6' },
    { id: 'credit', label: 'CREDIT REPAIR', color: '#fb923c' },
    { id: 'preapproval', label: 'PRE-APPROVAL', color: '#f87171' },
    { id: 'preapproved', label: 'APPROVED', color: '#fbbf24' },
    { id: 'ratewatch', label: 'RATE WATCH', color: '#34d399' },
    { id: 'underwriting', label: 'UNDERWRITING', color: '#38bdf8' }
  ];
  var decRows = [
    { id: 'funded', label: 'FUNDED', color: '#22c55e' },
    { id: 'denied', label: 'DENIED', color: '#ef4444' },
    { id: 'suspended', label: 'SUSPENDED', color: '#f59e0b' },
    { id: 'withdrawn', label: 'WITHDRAWN', color: '#a78bfa' }
  ];

  var counts = {};
  pipelineColumns.forEach(function(col) { counts[col.id] = 0; });
  pipelineLoans.forEach(function(loan) {
    if (counts[loan.pipeline_stage] !== undefined) counts[loan.pipeline_stage]++;
  });
  counts.funded = window._dashDecisionCounts ? window._dashDecisionCounts.funded || 0 : 0;
  counts.denied = window._dashDecisionCounts ? window._dashDecisionCounts.denied || 0 : 0;
  counts.suspended = window._dashDecisionCounts ? window._dashDecisionCounts.suspended || 0 : 0;
  counts.withdrawn = window._dashDecisionCounts ? window._dashDecisionCounts.withdrawn || 0 : 0;

  var allCounts = stageRows.concat(decRows).map(function(r) { return counts[r.id] || 0; });
  var scaleMax = Math.max(10, Math.ceil(Math.max.apply(null, allCounts) * 1.3));

  function buildRows(rows) {
    var h = '';
    rows.forEach(function(row) {
      var count = counts[row.id] || 0;
      var pct = (count / scaleMax) * 100;
      var isActive = count > 0;
      h += '<div class="mc-row">';
      h += '<div class="mc-row-label">' + row.label + '</div>';
      h += '<div class="mc-row-track"><div class="mc-row-bar' + (isActive ? ' glow' : '') + '" style="width:' + pct + '%;background:linear-gradient(90deg,' + row.color + '20,' + row.color + ');box-shadow:0 0 15px ' + row.color + '40;"></div></div>';
      h += '<div class="mc-row-count' + (isActive ? '' : ' zero') + '"' + (isActive ? ' style="color:' + row.color + ';"' : '') + '>' + count + '</div>';
      h += '</div>';
    });
    return h;
  }

  var el1 = document.getElementById('mcPipelineRows');
  if (el1) el1.innerHTML = buildRows(stageRows);
  var el2 = document.getElementById('mcDecisionRows');
  if (el2) el2.innerHTML = buildRows(decRows);

  var totalActive = pipelineLoans.length;
  var totalEl = document.getElementById('mcTotalValue');
  if (totalEl) totalEl.textContent = totalActive + ' LOAN' + (totalActive !== 1 ? 'S' : '');
  var statusEl = document.getElementById('mcPipelineStatus');
  if (statusEl) statusEl.textContent = totalActive > 0 ? totalActive + ' ACTIVE' : 'STANDBY';
}

// ===== MC LOAN TYPES (SVG Donut) =====
function renderLoanTypeHTML() {
  var el = document.getElementById('mcLoanTypeContent');
  if (!el) return;

  var typeCounts = {};
  pipelineLoans.forEach(function(loan) {
    var label = '';
    if (loan.transaction_type && loan.loan_program) label = loan.transaction_type + ' / ' + loan.loan_program;
    else if (loan.transaction_type) label = loan.transaction_type;
    else if (loan.loan_program) label = loan.loan_program;
    else label = 'Not Set';
    typeCounts[label] = (typeCounts[label] || 0) + 1;
  });
  var types = Object.keys(typeCounts);
  var total = pipelineLoans.length;

  if (total === 0) {
    el.innerHTML = '<div class="mc-empty-msg">AWAITING DATA</div>';
    var statusEl = document.getElementById('mcLoanStatus');
    if (statusEl) { statusEl.textContent = 'STANDBY'; statusEl.style.color = 'var(--text-muted)'; }
    return;
  }

  var colors = ['#818cf8','#f472b6','#34d399','#fbbf24','#38bdf8','#fb923c','#a78bfa','#f87171'];
  var circumference = 2 * Math.PI * 60;
  var offset = 0;
  var circles = '';
  types.forEach(function(type, i) {
    var pct = typeCounts[type] / total;
    var dash = pct * circumference;
    var color = colors[i % colors.length];
    circles += '<circle cx="80" cy="80" r="60" fill="none" stroke="' + color + '" stroke-width="16" ';
    circles += 'stroke-dasharray="' + dash + ' ' + (circumference - dash) + '" ';
    circles += 'stroke-dashoffset="' + (-offset) + '" ';
    circles += 'style="filter:drop-shadow(0 0 6px ' + color + '60);opacity:0.85;"/>';
    offset += dash;
  });

  var h = '<div class="mc-donut-wrap">';
  h += '<div class="mc-donut-container">';
  h += '<svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="60" fill="none" stroke="rgba(59,130,246,0.06)" stroke-width="16"/>' + circles + '</svg>';
  h += '<div class="mc-donut-center"><div class="mc-donut-num">' + total + '</div><div class="mc-donut-sub">ACTIVE</div></div>';
  h += '</div>';
  h += '<div class="mc-legend">';
  types.forEach(function(type, i) {
    var color = colors[i % colors.length];
    var pct = Math.round((typeCounts[type] / total) * 100);
    h += '<div class="mc-legend-row"><div class="mc-legend-dot" style="background:' + color + ';box-shadow:0 0 6px ' + color + '60;"></div>';
    h += '<div class="mc-legend-name">' + type + '</div>';
    h += '<div class="mc-legend-val" style="color:' + color + ';">' + typeCounts[type] + ' (' + pct + '%)</div></div>';
  });
  h += '</div></div>';
  el.innerHTML = h;

  var statusEl = document.getElementById('mcLoanStatus');
  if (statusEl) { statusEl.textContent = types.length + ' TYPES'; statusEl.style.color = '#22c55e'; }
}

// ===== TICKER SYSTEM =====
var tickerMessages = [];
var tickerIdx = 0;
var tickerInterval = null;

function buildTickerMessages() {
  var msgs = [];
  var totalActive = pipelineLoans.length;
  var pipelineVol = 0;
  pipelineLoans.forEach(function(l) { if (l.loan_amount) pipelineVol += parseFloat(l.loan_amount) || 0; });
  var volStr = pipelineVol > 0 ? '$' + Math.round(pipelineVol).toLocaleString() : '$0';

  // Pipeline summary
  if (totalActive > 0) {
    msgs.push('PIPELINE STATUS: <span class="highlight">' + totalActive + ' ACTIVE LOAN' + (totalActive !== 1 ? 'S' : '') + '</span> — ' + volStr + ' TOTAL VOLUME');
  }

  // Funded this month
  var dc = window._dashDecisionCounts || {};
  if (dc.funded > 0) {
    var fundedVol = window._dashFundedVolume || 0;
    msgs.push('MONTHLY PERFORMANCE: <span class="good">$' + Math.round(fundedVol).toLocaleString() + ' FUNDED</span> — ' + dc.funded + ' LOAN' + (dc.funded !== 1 ? 'S' : '') + ' CLOSED');
  }

  // Stage counts
  var stageCounts = {};
  pipelineColumns.forEach(function(col) { stageCounts[col.id] = 0; });
  pipelineLoans.forEach(function(l) { if (stageCounts[l.pipeline_stage] !== undefined) stageCounts[l.pipeline_stage]++; });
  if (stageCounts.underwriting > 0) msgs.push('<span class="highlight">' + stageCounts.underwriting + ' LOAN' + (stageCounts.underwriting !== 1 ? 'S' : '') + ' IN UNDERWRITING</span> — MONITORING FOR CLEAR TO CLOSE');
  if (stageCounts.preapproved > 0) msgs.push('<span class="good">' + stageCounts.preapproved + ' APPROVED</span> — AWAITING CONTRACTS');
  if (stageCounts.ratewatch > 0) msgs.push('<span class="alert">' + stageCounts.ratewatch + ' ON RATE WATCH</span> — MONITORING MBS');
  if (stageCounts.credit > 0) msgs.push('<span class="alert">' + stageCounts.credit + ' IN CREDIT REPAIR</span> — TRACKING IMPROVEMENT');

  // Default if nothing to say
  if (msgs.length === 0) {
    msgs.push('ALL SYSTEMS OPERATIONAL — PIPELINE CLEAR');
    msgs.push('READY FOR NEW OPPORTUNITIES');
  }

  return msgs;
}

function rotateTicker() {
  var tickerEl = document.getElementById('mcTicker');
  if (!tickerEl) return;
  var msg = tickerEl.querySelector('.mc-ticker-msg');
  if (!msg) return;
  if (tickerMessages.length === 0) tickerMessages = buildTickerMessages();
  msg.style.animation = 'none';
  msg.offsetHeight;
  msg.innerHTML = tickerMessages[tickerIdx];
  msg.style.animation = 'tickerFade 6s ease-in-out';
  tickerIdx = (tickerIdx + 1) % tickerMessages.length;
}

function startTicker() {
  tickerMessages = buildTickerMessages();
  tickerIdx = 0;
  setTimeout(function() {
    rotateTicker();
    if (tickerInterval) clearInterval(tickerInterval);
    tickerInterval = setInterval(rotateTicker, 6000);
  }, 1000);
}
