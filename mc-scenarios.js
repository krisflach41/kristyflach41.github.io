// ===== SCENARIO DESK =====
var allScenarios = [];
var currentFilter = 'hot';

async function loadScenarios() {
  try {
    var resp = await fetch(API_BASE + '/scenario-desk');
    var data = await resp.json();
    allScenarios = data.scenarios || [];
    updateScenarioNav();
    renderScenarios();
    loadHotLeads();
  } catch (err) {
    console.error('Failed to load scenarios:', err);
    document.getElementById('scenarioList').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-weight:600;font-size:12px;">FAILED TO LOAD SCENARIOS</div></div>';
  }
}

function updateScenarioNav() {
  var hotCount = allScenarios.filter(function(s) { return s.status === 'new' && s.type !== 'ask_gus'; }).length;
  var intelCount = allScenarios.filter(function(s) { return s.type === 'ask_gus' && s.status === 'auto_resolved'; }).length;
  var resolvedCount = allScenarios.filter(function(s) { return s.status === 'called_back' || s.status === 'closed'; }).length;

  // Nav badge
  var badge = document.getElementById('scenarioNavBadge');
  if (hotCount > 0) {
    badge.textContent = hotCount;
    badge.style.display = '';
    // Add pulse to nav item
    var navItem = badge.closest('.nav-item');
    if (navItem) navItem.classList.add('has-hot-lead');
  } else {
    badge.style.display = 'none';
    var navItem2 = document.querySelector('.nav-item[onclick*="scenarios"]');
    if (navItem2) navItem2.classList.remove('has-hot-lead');
  }

  // Dashboard alert banner
  var banner = document.getElementById('scenarioAlertBanner');
  if (hotCount > 0) {
    var newest = allScenarios.filter(function(s) { return s.status === 'new' && s.type !== 'ask_gus'; })[0];
    // banner handled by unified hot leads banner
    document.getElementById('scenarioAlertText').textContent =
      hotCount === 1
        ? (newest.realtor_name || 'A realtor') + ' submitted a scenario — click to review'
        : hotCount + ' realtors have submitted scenarios — click to review';
    if (newest) {
      var ago = timeAgo(newest.created_at);
      document.getElementById('scenarioAlertTime').textContent = ago;
    }
  } else {
    banner.style.display = 'none';
  }

  // Filter counts
  document.getElementById('filterHotCount').textContent = hotCount ? '(' + hotCount + ')' : '';
  document.getElementById('filterIntelCount').textContent = intelCount ? '(' + intelCount + ')' : '';
  document.getElementById('filterResolvedCount').textContent = resolvedCount ? '(' + resolvedCount + ')' : '';

  // Stat cards
  var sse=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
  sse("scHotStat",hotCount);sse("scIntelStat",intelCount);sse("scResolvedStat",resolvedCount);sse("scTotalStat",allScenarios.length);
}

function filterScenarios(filter) {
  currentFilter = filter;
  renderScenarios();
}

function renderScenarios() {
  var list = document.getElementById('scenarioList');
  var filtered = allScenarios;

  if (currentFilter === 'hot') {
    filtered = allScenarios.filter(function(s) { return s.status === 'new' && s.type !== 'ask_gus'; });
  } else if (currentFilter === 'intel') {
    filtered = allScenarios.filter(function(s) { return s.type === 'ask_gus' && s.status === 'auto_resolved'; });
  } else if (currentFilter === 'resolved') {
    filtered = allScenarios.filter(function(s) { return s.status === 'called_back' || s.status === 'closed'; });
  }

  if (filtered.length === 0) {
    var msg = currentFilter === 'hot' ? 'No hot leads right now' : currentFilter === 'intel' ? 'No guideline searches yet' : currentFilter === 'resolved' ? 'No resolved scenarios' : 'No scenarios found';
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:28px;margin-bottom:8px;">&#x1F43E;</div><div style="font-size:13px;">' + msg + '</div></div>';
    return;
  }

  var html = '';
  filtered.forEach(function(s) {
    var isHot = s.status === 'new' && s.type !== 'ask_gus';
    var isIntel = s.type === 'ask_gus' && s.status === 'auto_resolved';
    var isResolved = s.status === 'called_back' || s.status === 'closed';
    var dotColor = isHot ? '#ef4444' : isIntel ? '#3b82f6' : '#22c55e';
    var statusLabel = isHot ? 'NEW' : isIntel ? 'INTEL' : 'RESOLVED';
    var typeLabel = s.type === 'ask_gus' ? 'Gus Search' : s.type === 'forwarded_gus' ? 'Forwarded' : 'Review Request';
    var snippet = s.question ? s.question.substring(0, 60) + (s.question.length > 60 ? '...' : '') : 'No details';

    html += '<div data-id="' + s.id + '" onclick="showScenarioDetail(\'' + s.id + '\')" style="display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;border-bottom:1px solid var(--border-light);transition:0.15s;" onmouseover="this.style.background=\'#f0f2f7\'" onmouseout="if(!this.classList.contains(\'sc-active\'))this.style.background=\'transparent\'">';
    html += '<div style="width:8px;height:8px;border-radius:50%;background:' + dotColor + ';flex-shrink:0;"></div>';
    html += '<div style="flex:1;min-width:0;">';
    html += '<div style="font-weight:600;font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(s.realtor_name || 'Unknown Realtor') + '</div>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(snippet) + '</div>';
    html += '</div>';
    html += '<div style="text-align:right;flex-shrink:0;">';
    html += '<div style="font-size:9px;font-weight:700;color:' + dotColor + ';letter-spacing:0.5px;">' + statusLabel + '</div>';
    html += '<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">' + timeAgo(s.created_at) + '</div>';
    html += '</div></div>';
  });

  list.innerHTML = html;
}

function showScenarioDetail(id) {
  var s = allScenarios.find(function(sc) { return sc.id === id; });
  if (!s) return;

  // Highlight active in list
  document.querySelectorAll('#scenarioList [data-id]').forEach(function(el){ el.style.background='transparent'; el.classList.remove('sc-active'); });
  var sel = document.querySelector('#scenarioList [data-id="'+id+'"]');
  if (sel) { sel.style.background='#f0f2f7'; sel.classList.add('sc-active'); }

  var preview = document.getElementById('scenarioDetailPreview');
  if (!preview) return;

  var isHot = s.status === 'new' && s.type !== 'ask_gus';
  var isIntel = s.type === 'ask_gus' && s.status === 'auto_resolved';
  var isResolved = s.status === 'called_back' || s.status === 'closed';
  var badgeColor = isHot ? '#ef4444' : isIntel ? '#3b82f6' : '#22c55e';
  var badgeBg = isHot ? 'rgba(239,68,68,0.15)' : isIntel ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)';
  var badgeText = isHot ? (s.type === 'forwarded_gus' ? 'FORWARDED' : 'REVIEW REQUEST') : isIntel ? 'GUS GUS SEARCH' : 'RESOLVED';

  var ts = new Date(s.created_at);
  var dateStr = (ts.getMonth()+1) + '/' + ts.getDate() + '/' + ts.getFullYear() + ' at ' + ts.toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit',hour12:true});

  var h = '';
  // Header
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">';
  h += '<span style="font-size:9px;font-weight:700;letter-spacing:1px;padding:4px 10px;border-radius:4px;background:' + badgeBg + ';color:' + badgeColor + ';">' + badgeText + '</span>';
  h += '<span style="font-size:11px;color:var(--text-muted);font-weight:600;">' + dateStr + '</span>';
  h += '</div>';

  // Realtor info
  h += '<div style="font-size:18px;font-weight:700;color:#fff;">' + escHtml(s.realtor_name || 'Unknown Realtor') + '</div>';
  if (s.realtor_email) h += '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + escHtml(s.realtor_email) + '</div>';

  // Scenario data
  if (s.scenario_data && s.scenario_data.scenario_types && s.scenario_data.scenario_types.length) {
    h += '<div style="margin-top:16px;padding:12px 14px;background:#fafbfc;border:1px solid var(--border-light);border-radius:8px;">';
    h += '<div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">Scenario Details</div>';
    var parts = [];
    if (s.scenario_data.borrower && s.scenario_data.borrower.credit_score) parts.push('<span style="color:var(--text-muted);">Credit:</span> ' + s.scenario_data.borrower.credit_score);
    if (s.scenario_data.borrower && s.scenario_data.borrower.employment) parts.push('<span style="color:var(--text-muted);">Employment:</span> ' + s.scenario_data.borrower.employment);
    if (s.scenario_data.property && s.scenario_data.property.type) parts.push('<span style="color:var(--text-muted);">Property:</span> ' + s.scenario_data.property.type);
    if (s.scenario_data.property && s.scenario_data.property.use) parts.push('<span style="color:var(--text-muted);">Use:</span> ' + s.scenario_data.property.use);
    if (s.scenario_data.purchase_price) parts.push('<span style="color:var(--text-muted);">Price:</span> ' + s.scenario_data.purchase_price);
    if (s.scenario_data.down_payment) parts.push('<span style="color:var(--text-muted);">Down:</span> ' + s.scenario_data.down_payment);
    h += '<div style="font-size:13px;color:var(--text-secondary);line-height:2;">' + parts.join('<br>') + '</div>';
    h += '</div>';
  }

  // Question / full story
  if (s.question) {
    h += '<div style="margin-top:16px;">';
    h += '<div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">Details</div>';
    h += '<div style="font-size:14px;color:var(--text-secondary);line-height:1.7;">' + escHtml(s.question) + '</div>';
    h += '</div>';
  }

  // Realtor notes (for forwarded)
  if (s.type === 'forwarded_gus' && s.scenario_data && s.scenario_data.realtor_notes) {
    h += '<div style="margin-top:16px;">';
    h += '<div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">Realtor Notes</div>';
    h += '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;padding:10px 14px;background:rgba(110,127,119,0.08);border-radius:8px;">' + escHtml(s.scenario_data.realtor_notes) + '</div>';
    h += '</div>';
  }

  // AI research notes
  if (s.ai_response) {
    h += '<div style="margin-top:16px;">';
    h += '<div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">Research Notes</div>';
    h += '<div style="font-size:13px;color:var(--text-muted);line-height:1.7;">' + formatScenarioAI(s.ai_response) + '</div>';
    h += '</div>';
  }

  // Action buttons
  if (isHot) {
    h += '<div style="display:flex;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">';
    h += '<button class="scenario-action-btn callback" onclick="markScenario(\'' + s.id + '\',\'called_back\')">&#x2713; Called Back</button>';
    h += '<button class="scenario-action-btn dismiss" onclick="markScenario(\'' + s.id + '\',\'closed\')">Dismiss</button>';
    h += '</div>';
  }

  preview.innerHTML = h;
}

function toggleAI(idx) {
  var el = document.getElementById('aiResp' + idx);
  var toggle = el.nextElementSibling;
  if (el.classList.contains('open')) {
    el.classList.remove('open');
    toggle.textContent = '▸ Show research notes';
  } else {
    el.classList.add('open');
    toggle.textContent = '▾ Hide research notes';
  }
}

function formatScenarioAI(text) {
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#6e7f77;">$1</strong>');
  text = text.replace(/\n\n/g, '</p><p style="margin-top:8px;">');
  text = text.replace(/\n/g, '<br>');
  return '<p>' + text + '</p>';
}

function escHtml(str) {
  var d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function timeAgo(dateStr) {
  var now = new Date();
  var then = new Date(dateStr);
  var diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

async function markScenario(id, status) {
  try {
    var url = API_BASE.replace('/api', '') + '/api/scenario-desk';
    // Use PATCH-like approach via POST with update action
    await fetch(API_BASE + '/scenario-desk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', id: id, status: status })
    });
    // Update local data
    allScenarios.forEach(function(s) {
      if (s.id === id) {
        s.status = status;
        if (status === 'called_back') s.called_back_at = new Date().toISOString();
      }
    });
    updateScenarioNav();
    renderScenarios();
    loadHotLeads();
    showToast(status === 'called_back' ? 'Marked as called back' : 'Scenario dismissed');
  } catch (err) {
    showToast('Failed to update');
  }
}

