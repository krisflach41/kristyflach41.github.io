// ===== PIPELINE ALERTS =====
var currentAlerts = [];

// ===== HOT LEADS UNIFIED BANNER =====
var hotLeadsData = [];
var hotLeadsPanelOpen = false;

async function loadHotLeads() {
  try {
    var hotItems = [];

    // Fetch scenario hot leads (status = new, not ask_gus)
    if (typeof allScenarios !== 'undefined' && allScenarios.length > 0) {
      allScenarios.forEach(function(s) {
        if (s.status === 'new' && s.type !== 'ask_gus') {
          hotItems.push({
            id: s.id,
            type: 'scenario',
            typeLabel: 'GUIDELINE SCENARIO',
            name: s.realtor_name || 'Unknown Realtor',
            detail: s.question ? s.question.substring(0, 80) + (s.question.length > 80 ? '...' : '') : 'No details',
            created_at: s.created_at,
            viewTarget: 'portal'
          });
        }
      });
    }

    // Fetch credit hot leads
    if (typeof creditSubmissions !== 'undefined' && creditSubmissions.length > 0) {
      creditSubmissions.forEach(function(s) {
        if (s.status === 'new') {
          hotItems.push({
            id: s.id,
            type: 'credit',
            typeLabel: 'CREDIT ANALYSIS',
            name: s.borrower_name || 'Unknown Borrower',
            detail: (s.submitted_by === 'realtor' ? 'via ' + (s.realtor_name || 'Realtor') + ' - ' : '') + 'Score: ' + (s.self_reported_score || 'N/A') + (s.goal_score ? ' Goal: ' + s.goal_score : ''),
            created_at: s.created_at,
            viewTarget: 'creditanalysis'
          });
        }
      });
    }

    // Sort by newest first
    hotItems.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    hotLeadsData = hotItems;
    updateHotLeadsBanner();
    updateCreditNavBadge();
  } catch(e) {
    console.error('loadHotLeads error:', e);
  }
}

function updateHotLeadsBanner() {
  var banner = document.getElementById('hotLeadsBanner');
  var oldBanner = document.getElementById('scenarioAlertBanner');
  if (!banner) return;

  // Hide old scenario-only banner since we handle it now
  if (oldBanner) oldBanner.style.display = 'none';

  if (hotLeadsData.length === 0) {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = 'block';
  banner.style.animation = 'alertPulse 2s ease infinite';

  var txt = document.getElementById('hotLeadsText');
  var scenCount = hotLeadsData.filter(function(h){return h.type==='scenario';}).length;
  var credCount = hotLeadsData.filter(function(h){return h.type==='credit';}).length;
  var parts = [];
  if (credCount > 0) parts.push(credCount + ' credit submission' + (credCount !== 1 ? 's' : ''));
  if (scenCount > 0) parts.push(scenCount + ' guideline scenario' + (scenCount !== 1 ? 's' : ''));
  txt.textContent = parts.join(' and ') + ' awaiting review';

  var timeEl = document.getElementById('hotLeadsTime');
  if (hotLeadsData.length > 0) {
    timeEl.textContent = 'newest: ' + timeAgo(hotLeadsData[0].created_at);
  }

  renderHotLeadsList();
}

function updateCreditNavBadge() {
  var badge = document.getElementById('creditNavBadge');
  if (!badge) return;
  var credCount = 0;
  if (typeof creditSubmissions !== 'undefined') {
    credCount = creditSubmissions.filter(function(s){return s.status==='new';}).length;
  }
  if (credCount > 0) {
    badge.textContent = credCount;
    badge.style.display = '';
    var navItem = badge.closest('.nav-item');
    if (navItem) navItem.classList.add('has-hot-lead');
  } else {
    badge.style.display = 'none';
    var navItem2 = badge.closest('.nav-item');
    if (navItem2) navItem2.classList.remove('has-hot-lead');
  }
}

function toggleHotLeadsPanel() {
  var panel = document.getElementById('hotLeadsPanel');
  var arrow = document.getElementById('hotLeadsToggleArrow');
  if (!panel) return;
  hotLeadsPanelOpen = !hotLeadsPanelOpen;
  panel.style.display = hotLeadsPanelOpen ? 'block' : 'none';
  if (arrow) arrow.textContent = hotLeadsPanelOpen ? 'REVIEW \u25B2' : 'REVIEW \u25BC';
}

function renderHotLeadsList() {
  var list = document.getElementById('hotLeadsList');
  if (!list) return;
  if (hotLeadsData.length === 0) {
    list.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:13px;">No hot leads right now</div>';
    return;
  }
  var h = '';
  hotLeadsData.forEach(function(item) {
    var typeColor = item.type === 'credit' ? '#f59e0b' : '#ef4444';
    var ts = new Date(item.created_at);
    var dateStr = (ts.getMonth()+1) + '/' + ts.getDate() + '/' + ts.getFullYear();
    var timeStr = ts.toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit',hour12:true});
    h += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#fafbfc;border:1px solid var(--border-light);border-radius:8px;margin-bottom:6px;">';
    h += '<div style="width:6px;height:6px;border-radius:50%;background:' + typeColor + ';flex-shrink:0;"></div>';
    h += '<div style="flex:1;min-width:0;">';
    h += '<div style="display:flex;align-items:center;gap:8px;">';
    h += '<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:' + typeColor + ';text-transform:uppercase;">' + item.typeLabel + '</span>';
    h += '</div>';
    h += '<div style="font-size:14px;font-weight:600;color:#fff;margin-top:2px;">' + item.name + '</div>';
    h += '<div style="font-size:11px;color:var(--text-muted);margin-top:1px;">' + item.detail + '</div>';
    h += '</div>';
    h += '<div style="text-align:right;flex-shrink:0;">';
    h += '<div style="font-size:10px;color:var(--text-muted);font-weight:600;">' + dateStr + '</div>';
    h += '<div style="font-size:10px;color:var(--text-muted);font-weight:600;">' + timeStr + '</div>';
    h += '</div>';
    h += '<div onclick="event.stopPropagation();switchView(\'' + item.viewTarget + '\',document.querySelector(\'[onclick*=' + item.viewTarget + ']\'))" style="padding:5px 12px;border-radius:5px;background:rgba(239,68,68,0.15);color:#ef4444;font-size:10px;font-weight:700;letter-spacing:0.5px;cursor:pointer;flex-shrink:0;">REVIEW</div>';
    h += '</div>';
  });
  list.innerHTML = h;
}

function loadDashAlerts() {
  if (!pipelineLoaded) {
    setTimeout(loadDashAlerts, 500);
    return;
  }
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var alerts = [];

  pipelineLoans.forEach(function(loan) {
    if (loan.pipeline_stage === 'closed' || loan.pipeline_stage === 'archived' || loan.pipeline_stage === 'funded') return;
    var loanName = getLoanDisplayName(loan);
    var tasks = loan._tasks || [];

    tasks.forEach(function(t) {
      if (!t.due || t.done) return;
      if (t.alarm === false) return; // alarm off, skip

      var dateObj = new Date(t.due + 'T00:00:00');
      var daysOut = Math.round((dateObj - today) / 86400000);
      if (daysOut < 0 || daysOut > 7) return;

      var priority = 'normal';
      if (daysOut === 0) priority = 'critical';
      else if (daysOut <= 2) priority = 'high';
      else if (daysOut <= 5) priority = 'medium';

      var icon = '📋';
      if (daysOut === 0) icon = '🚨';
      else if (daysOut <= 2) icon = '⚠️';

      var msg = '';
      if (daysOut === 0) msg = t.title + ' is due TODAY';
      else if (daysOut === 1) msg = t.title + ' is due TOMORROW';
      else msg = t.title + ' in ' + daysOut + ' days';

      alerts.push({
        icon: icon,
        loanName: loanName,
        message: msg,
        daysOut: daysOut,
        priority: priority,
        aeId: loan.ae_id,
        taskTitle: t.title,
        assignee: t.assignee || 'Unassigned'
      });
    });
  });

  alerts.sort(function(a, b) {
    if (a.daysOut !== b.daysOut) return a.daysOut - b.daysOut;
    var p = { critical: 0, high: 1, medium: 2, normal: 3 };
    return (p[a.priority] || 3) - (p[b.priority] || 3);
  });

  currentAlerts = alerts;
  renderDashAlerts();
}

function renderDashAlerts() {
  var panel = document.getElementById('dashAlertPanel');
  var list = document.getElementById('dashAlertList');
  var count = document.getElementById('dashAlertCount');
  if (!panel || !list) return;

  if (currentAlerts.length === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  count.textContent = currentAlerts.length + ' ALERT' + (currentAlerts.length > 1 ? 'S' : '');

  var html = '';
  currentAlerts.forEach(function(a) {
    var badgeLabel = a.daysOut === 0 ? 'TODAY' : a.daysOut === 1 ? 'TOMORROW' : a.daysOut + ' DAYS';
    html += '<div class="alert-row" onclick="calEventClick(\'' + a.aeId + '\')">';
    html += '<div class="alert-icon">' + a.icon + '</div>';
    html += '<div class="alert-body">';
    html += '<div class="alert-title">' + a.loanName + '</div>';
    html += '<div class="alert-sub">' + a.message + '</div>';
    html += '</div>';
    html += '<span class="alert-badge ' + a.priority + '">' + badgeLabel + '</span>';
    html += '</div>';
  });

  list.innerHTML = html;
}

