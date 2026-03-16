// ===== CREDIT ANALYSIS =====
var creditSubmissions = [];
var creditFilter = 'new';
var activeCreditSub = null;

async function loadCreditSubmissions() {
  try {
    var resp = await fetch(API_BASE + '/credit-submission');
    var data = await resp.json();
    if (data.success) {
      creditSubmissions = data.submissions || [];
      renderCreditSubs();
      loadHotLeads();
    }
  } catch(e) { console.error('Load credit subs error:', e); }
}

function filterCreditSubs(f) {
  creditFilter = f;
  renderCreditSubs();
}

function renderCreditSubs() {
  var list = document.getElementById('creditSubList');
  if (!list) return;

  var filtered = creditFilter === 'all' ? creditSubmissions : creditSubmissions.filter(function(s) { return s.status === creditFilter; });

  // Update counts
  var newC = creditSubmissions.filter(function(s){return s.status==='new'}).length;
  var revC = creditSubmissions.filter(function(s){return s.status==='reviewing'}).length;
  var planC = creditSubmissions.filter(function(s){return s.status==='plan_sent'}).length;
  var ce = function(id,v){var el=document.getElementById(id);if(el)el.textContent=v?'('+v+')':'';};
  ce('csNewCount',newC); ce('csReviewCount',revC); ce('csPlanCount',planC);

  if (filtered.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:36px;margin-bottom:12px;">📊</div><div style="font-size:13px;">No submissions found.</div></div>';
    return;
  }

  var h = '';
  filtered.forEach(function(s) {
    var statusColor = s.status === 'new' ? '#ef4444' : s.status === 'reviewing' ? '#f59e0b' : '#22c55e';
    var statusLabel = s.status === 'new' ? 'NEW' : s.status === 'reviewing' ? 'REVIEWING' : s.status === 'plan_sent' ? 'PLAN SENT' : s.status.toUpperCase();
    var simCount = 0;
    try { simCount = JSON.parse(s.simulations_ran || '[]').length; } catch(e){}
    var timeAgo = getTimeAgo(s.created_at);
    var source = s.submitted_by === 'realtor' ? '<span style="color:#a855f7;">via ' + (s.realtor_name || 'Realtor') + '</span>' : '<span style="color:#3b82f6;">Direct</span>';

    h += '<div onclick="openCreditDetail(\'' + s.id + '\')" style="display:flex;align-items:center;gap:16px;padding:14px 16px;background:#fafbfc;border:1px solid var(--border-light);border-radius:10px;margin-bottom:8px;cursor:pointer;transition:0.15s;" onmouseover="this.style.background=\'#f0f2f7\'" onmouseout="this.style.background=\'rgba(0,0,0,0.02)\'">';
    h += '<div style="width:8px;height:8px;border-radius:50%;background:' + statusColor + ';flex-shrink:0;"></div>';
    h += '<div style="flex:1;min-width:0;">';
    h += '<div style="font-weight:600;font-size:14px;color:#fff;">' + (s.borrower_name || 'Unknown') + '</div>';
    h += '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + source + ' &bull; Score: ' + (s.self_reported_score || 'N/A') + (s.goal_score ? ' → Goal: ' + s.goal_score : '') + ' &bull; ' + simCount + ' simulation' + (simCount !== 1 ? 's' : '') + '</div>';
    h += '</div>';
    h += '<div style="text-align:right;flex-shrink:0;">';
    h += '<div style="font-size:10px;font-weight:700;color:' + statusColor + ';letter-spacing:0.5px;">' + statusLabel + '</div>';
    h += '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">' + timeAgo + '</div>';
    h += '</div></div>';
  });

  list.innerHTML = h;
}

function openDirectAnalysis() {
  window.open('mc-credit-analysis.html', '_blank');
}

function openCreditDetail(id) {
  var s = creditSubmissions.find(function(x) { return x.id === id; });
  if (!s) return;
  activeCreditSub = s;

  var content = document.getElementById('creditDetailContent');
  var h = '';

  // Header info
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">';
  h += '<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Borrower</div><div style="font-size:16px;font-weight:700;color:#fff;">' + (s.borrower_name || 'N/A') + '</div></div>';
  h += '<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Self-Reported Score</div><div style="font-size:16px;font-weight:700;color:#f59e0b;">' + (s.self_reported_score || 'N/A') + '</div></div>';
  h += '<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Goal Score</div><div style="font-size:16px;font-weight:700;color:#22c55e;">' + (s.goal_score || 'N/A') + '</div></div>';
  h += '<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Email</div><div style="font-size:13px;color:#fff;">' + (s.borrower_email || 'N/A') + '</div></div>';
  h += '<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Phone</div><div style="font-size:13px;color:#fff;">' + (s.borrower_phone || 'N/A') + '</div></div>';
  h += '<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Source</div><div style="font-size:13px;color:#fff;">' + (s.submitted_by === 'realtor' ? 'Realtor: ' + (s.realtor_name || 'Unknown') : 'Direct') + '</div></div>';
  h += '<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Submitted</div><div style="font-size:13px;color:#fff;">' + new Date(s.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) + '</div></div>';
  h += '</div>';

  // Situation notes
  if (s.situation_notes) {
    h += '<div style="background:#f5f6fa;border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:16px;">';
    h += '<div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Borrower\'s Description</div>';
    h += '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">' + s.situation_notes + '</div>';
    h += '</div>';
  }

  // Simulations ran
  var sims = [];
  try { sims = JSON.parse(s.simulations_ran || '[]'); } catch(e) {}
  if (sims.length > 0) {
    h += '<div style="background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:8px;padding:14px;margin-bottom:16px;">';
    h += '<div style="font-size:10px;color:#f59e0b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;font-weight:700;">Simulations Run</div>';
    sims.forEach(function(sim) {
      var arrow = sim.projectedMin > sim.currentScore ? '↑' : '↓';
      var color = sim.projectedMin > sim.currentScore ? '#22c55e' : '#ef4444';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-light);">';
      h += '<div style="font-size:13px;color:var(--text-secondary);">' + sim.action + '</div>';
      h += '<div style="font-size:13px;font-weight:700;color:' + color + ';">' + sim.projectedMin + '-' + sim.projectedMax + ' ' + arrow + '</div>';
      h += '</div>';
    });
    h += '</div>';
  }

  // LO Notes
  h += '<div style="margin-bottom:8px;">';
  h += '<div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Your Notes</div>';
  h += '<textarea id="csLoNotes" rows="3" style="width:100%;padding:10px;border-radius:8px;background:#f8f9fb;border:1px solid var(--border);color:#fff;font-family:inherit;font-size:13px;resize:vertical;" placeholder="Add your notes about this submission...">' + (s.lo_notes || '') + '</textarea>';
  h += '<button class="topbar-btn" onclick="saveCreditNotes()" style="margin-top:6px;font-size:11px;"><i class="fas fa-save"></i> Save Notes</button>';
  h += '</div>';

  content.innerHTML = h;
  document.getElementById('creditDetailModal').style.display = 'flex';
}

async function updateCreditStatus(newStatus) {
  if (!activeCreditSub) return;
  try {
    await fetch(API_BASE + '/credit-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', id: activeCreditSub.id, status: newStatus })
    });
    activeCreditSub.status = newStatus;
    document.getElementById('creditDetailModal').style.display = 'none';
    renderCreditSubs();
    loadHotLeads();
    showToast('Status updated to ' + newStatus.replace('_',' '));
  } catch(e) { showToast('Error updating status'); }
}

async function saveCreditNotes() {
  if (!activeCreditSub) return;
  var notes = document.getElementById('csLoNotes').value;
  try {
    await fetch(API_BASE + '/credit-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveNotes', id: activeCreditSub.id, lo_notes: notes })
    });
    activeCreditSub.lo_notes = notes;
    showToast('Notes saved');
  } catch(e) { showToast('Error saving notes'); }
}

function openCreditAnalysis() {
  if (!activeCreditSub) return;
  var s = activeCreditSub;

  // Build URL with borrower data
  var params = [];
  if (s.borrower_name) params.push('name=' + encodeURIComponent(s.borrower_name));
  if (s.self_reported_score) params.push('score=' + s.self_reported_score);
  if (s.goal_score) params.push('goal=' + s.goal_score);
  if (s.borrower_email) params.push('email=' + encodeURIComponent(s.borrower_email));
  if (s.borrower_phone) params.push('phone=' + encodeURIComponent(s.borrower_phone));
  if (s.submitted_by) params.push('source=' + s.submitted_by);
  if (s.realtor_name) params.push('realtor_name=' + encodeURIComponent(s.realtor_name));

  var url = 'mc-credit-analysis.html' + (params.length > 0 ? '?' + params.join('&') : '');

  // Load into iframe and switch view
  document.getElementById('creditEngineFrame').src = url;
  document.getElementById('creditDetailModal').style.display = 'none';

  // Mark as reviewing automatically
  if (s.status === 'new') {
    updateCreditStatus('reviewing');
  }

  // Switch to the credit engine view
  document.querySelectorAll('.view-panel').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('view-creditengine').classList.add('active');

  // Update nav state
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
}

function getTimeAgo(dateStr) {
  var now = new Date();
  var then = new Date(dateStr);
  var diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
  return then.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

// Auto-load when switching to credit analysis view
var origSwitchView = typeof switchView === 'function' ? switchView : null;
(function() {
  var checkInterval = setInterval(function() {
    if (typeof switchView === 'function' && !switchView._creditPatched) {
      var orig = switchView;
      switchView = function(view, el) {
        orig(view, el);
        if (view === 'creditanalysis') loadCreditSubmissions();
      };
      switchView._creditPatched = true;
      clearInterval(checkInterval);
    }
  }, 500);
})();

