// ===== EMAIL CENTER =====
var emTemplates = [];
var emCampaigns = [];
var emEditSteps = [];
var emLoaded = false;

function emTab(tab) {
  ['emDashboard','emCampaigns','emCampaignDetail','emTemplates'].forEach(function(id) {
    var e = document.getElementById(id); if (e) e.style.display = 'none';
  });
  ['emTabDashboard','emTabCampaigns','emTabTemplates'].forEach(function(id) {
    var e = document.getElementById(id); if (e) e.classList.remove('active');
  });
  var map = { dashboard:'emDashboard', campaigns:'emCampaigns', templates:'emTemplates' };
  var tabMap = { dashboard:'emTabDashboard', campaigns:'emTabCampaigns', templates:'emTabTemplates' };
  var t = document.getElementById(map[tab]); if (t) t.style.display = 'block';
  var tb = document.getElementById(tabMap[tab]); if (tb) tb.classList.add('active');
  if (tab === 'dashboard') emLoadDashboard();
  if (tab === 'campaigns') emLoadCampaigns();
  if (tab === 'templates') emLoadTemplates();
}

function loadEmailCenter() {
  if (emLoaded) { emLoadDashboard(); return; }
  emLoadTemplates(); // preload for step renderer
  emLoadDashboard();
  emLoaded = true;
}

function emLoadDashboard() {
  var loUser = localStorage.getItem('agent_edge_user') || 'default';

  // Stats
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'email_stats', lo_user_id: loUser })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) {
      document.getElementById('emStatSent').textContent = data.stats.sent_this_month || 0;
      document.getElementById('emStatOpen').textContent = data.stats.open_rate + '%';
    }
  }).catch(function() {});

  // Campaigns + performance
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_campaigns', lo_user_id: loUser })
  }).then(function(r) { return r.json(); }).then(function(data) {
    emCampaigns = data.campaigns || [];
    var active = emCampaigns.filter(function(c) { return c.status === 'active'; });
    document.getElementById('emStatCampaigns').textContent = active.length;

    // Campaign performance panel
    var el = document.getElementById('emCampaignPerf');
    if (active.length === 0) {
      el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:10px;text-align:center;">No active campaigns. Go to Campaigns to activate one.</div>';
    } else {
      var h = '';
      active.forEach(function(c) {
        var stepCount = c.steps ? c.steps.length : 0;
        h += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;margin-bottom:3px;cursor:pointer;" onclick="emOpenCampaignDetail(' + c.id + ')" onmouseover="this.style.background=\'rgba(0,0,0,0.02)\'" onmouseout="this.style.background=\'none\'">';
        h += '<div style="width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0;"></div>';
        h += '<div style="flex:1;font-size:12px;color:var(--text-secondary);">' + c.name + '</div>';
        h += '<div style="font-size:10px;color:rgba(59,130,246,0.6);">' + stepCount + ' emails</div>';
        h += '<i class="fas fa-chevron-right" style="font-size:9px;color:var(--text-muted);"></i>';
        h += '</div>';
      });
      el.innerHTML = h;
    }
  }).catch(function() {});

  // Upcoming sends
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upcoming_sends', lo_user_id: loUser })
  }).then(function(r) { return r.json(); }).then(function(data) {
    var el = document.getElementById('emUpcomingSends');
    var upcoming = data.upcoming || [];
    if (upcoming.length === 0) {
      el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:10px;text-align:center;">No upcoming sends in the next 7 days</div>';
    } else {
      var h = '';
      upcoming.forEach(function(u) {
        var d = new Date(u.next_send_at);
        var now = new Date();
        var diffDays = Math.ceil((d - now) / 86400000);
        var when = diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : 'In ' + diffDays + ' days';
        h += '<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:6px;margin-bottom:3px;">';
        h += '<div style="font-size:10px;padding:3px 8px;border-radius:4px;background:rgba(249,115,22,0.12);color:#f97316;font-weight:600;min-width:70px;text-align:center;">' + when + '</div>';
        h += '<div style="flex:1;min-width:0;">';
        h += '<div style="font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Email ' + (u.current_step + 1) + ' → ' + (u.contact_name || u.contact_email) + '</div>';
        h += '<div style="font-size:10px;color:var(--text-muted);">' + (u.campaign_name || 'Campaign') + '</div>';
        h += '</div>';
        h += '</div>';
      });
      el.innerHTML = h;
    }
  }).catch(function() {
    document.getElementById('emUpcomingSends').innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:10px;text-align:center;">No upcoming sends</div>';
  });

  // Total enrolled
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'total_enrolled', lo_user_id: loUser })
  }).then(function(r) { return r.json(); }).then(function(data) {
    document.getElementById('emStatEnrolled').textContent = data.total || 0;
  }).catch(function() { document.getElementById('emStatEnrolled').textContent = '0'; });

  // Recent activity
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'email_history', lo_user_id: loUser, limit: 10 })
  }).then(function(r) { return r.json(); }).then(function(data) {
    var el = document.getElementById('emRecentSends');
    var emails = data.emails || [];
    if (emails.length === 0) {
      el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:10px;text-align:center;">No emails sent yet</div>';
    } else {
      var h = '';
      emails.forEach(function(e) {
        var d = new Date(e.sent_at);
        var dateStr = (d.getMonth()+1) + '/' + d.getDate();
        var statusIcon = e.status === 'sent' ? '📤' : e.status === 'opened' ? '👀' : e.status === 'clicked' ? '🖱️' : e.status === 'bounced' ? '⚠️' : '❌';
        h += '<div style="display:flex;align-items:center;gap:10px;padding:6px 12px;border-radius:6px;margin-bottom:2px;">';
        h += '<div style="font-size:12px;">' + statusIcon + '</div>';
        h += '<div style="flex:1;min-width:0;">';
        h += '<div style="font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + e.subject + '</div>';
        h += '<div style="font-size:10px;color:var(--text-muted);">To: ' + (e.to_name || e.to_email) + '</div>';
        h += '</div>';
        h += '<div style="font-size:10px;color:var(--text-muted);">' + dateStr + '</div>';
        h += '</div>';
      });
      el.innerHTML = h;
    }
  }).catch(function() {});
}

// ===== CAMPAIGN DETAIL VIEW =====
var emDetailCampaignId = null;
var emDetailData = null;

function emOpenCampaignDetail(id) {
  emDetailCampaignId = id;
  document.getElementById('emCampaigns').style.display = 'none';
  document.getElementById('emCampaignDetail').style.display = 'block';
  emLoadCampaignDetail(id);
}

function emCloseCampaignDetail() {
  document.getElementById('emCampaignDetail').style.display = 'none';
  document.getElementById('emCampaigns').style.display = 'block';
  emLoadCampaigns();
}

function emLoadCampaignDetail(id) {
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_campaign', campaign_id: id })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (!data.success) return;
    emDetailData = data.campaign;
    var c = data.campaign;
    var trigLabels = { manual:'Manual', signup:'New Signup', birthday:'Birthday', loan_funded:'Loan Funded', inactive:'Inactive 7d', anniversary:'Anniversary', rate_drop:'Rate Drop' };

    document.getElementById('emDetailName').textContent = c.name;
    document.getElementById('emDetailMeta').textContent = (trigLabels[c.trigger_type] || c.trigger_type) + ' · ' + (c.steps || []).length + ' emails · ' + (c.description || '');

    var statusColor = c.status === 'active' ? '#22c55e' : c.status === 'paused' ? '#f59e0b' : 'var(--text-muted)';
    var statusEl = document.getElementById('emDetailStatus');
    statusEl.textContent = c.status.charAt(0).toUpperCase() + c.status.slice(1);
    statusEl.style.background = statusColor + '20';
    statusEl.style.color = statusColor;

    var toggleBtn = document.getElementById('emDetailToggleBtn');
    if (c.status === 'active') {
      toggleBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
      toggleBtn.onclick = function() { emToggleCampaign(c.id, 'paused'); setTimeout(function() { emLoadCampaignDetail(c.id); }, 500); };
    } else {
      toggleBtn.innerHTML = '<i class="fas fa-play"></i> Activate';
      toggleBtn.onclick = function() { emToggleCampaign(c.id, 'active'); setTimeout(function() { emLoadCampaignDetail(c.id); }, 500); };
    }

    // Email timeline
    var timelineEl = document.getElementById('emDetailTimeline');
    var steps = c.steps || [];
    if (steps.length === 0) {
      timelineEl.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:16px;">No emails in this campaign yet.</div>';
    } else {
      var th = '';
      var cumulativeDays = 0;
      steps.forEach(function(s, i) {
        cumulativeDays += (s.delay_days || 0);
        var tpl = emTemplates.find(function(t) { return t.id === s.template_id; });
        var subject = s.subject_override || (tpl ? tpl.subject : 'Untitled');
        var dayLabel = i === 0 ? (s.delay_days === 0 ? 'Immediately' : 'Day ' + s.delay_days) : 'Day ' + cumulativeDays;

        th += '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:4px;">';
        // Timeline connector
        th += '<div style="display:flex;flex-direction:column;align-items:center;">';
        th += '<div style="width:28px;height:28px;border-radius:50%;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#3b82f6;">' + (i+1) + '</div>';
        if (i < steps.length - 1) th += '<div style="width:2px;height:100%;min-height:40px;background:rgba(59,130,246,0.1);"></div>';
        th += '</div>';
        // Content
        th += '<div style="flex:1;padding:4px 0 16px;" id="emStepDetail_' + i + '">';
        th += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">';
        th += '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(59,130,246,0.1);color:#3b82f6;font-weight:600;">' + dayLabel + '</span>';
        if (s.delay_days > 0 && i > 0) th += '<span style="font-size:9px;color:var(--text-muted);">(' + s.delay_days + ' days after previous)</span>';
        th += '</div>';
        th += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:2px;">' + subject.replace(/\{\{first_name\}\}/g, '{{first_name}}') + '</div>';
        th += '<div style="font-size:10px;color:var(--text-muted);">' + (tpl ? tpl.name : 'Custom') + '</div>';
        th += '<button class="topbar-btn" style="font-size:10px;padding:3px 8px;margin-top:6px;" onclick="emToggleEmailPreview(' + i + ')"><i class="fas fa-eye"></i> Preview</button>';
        th += '<div id="emEmailPreview_' + i + '" style="display:none;margin-top:8px;padding:12px;background:#fafbfc;border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--text-secondary);line-height:1.6;"></div>';
        th += '</div></div>';
      });
      timelineEl.innerHTML = th;

      // Pre-load preview content
      steps.forEach(function(s, i) {
        var tpl = emTemplates.find(function(t) { return t.id === s.template_id; });
        if (tpl) {
          var previewEl = document.getElementById('emEmailPreview_' + i);
          if (previewEl) previewEl.innerHTML = tpl.body_html.replace(/\{\{first_name\}\}/g, '<span style="color:#3b82f6;">Jane</span>').replace(/\{\{name\}\}/g, '<span style="color:#3b82f6;">Jane Smith</span>');
        }
      });
    }

    // Enrollments
    var enrollEl = document.getElementById('emDetailEnrollments');
    var enrollments = c.enrollments || [];
    if (enrollments.length === 0) {
      enrollEl.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:16px;text-align:center;">No contacts enrolled yet. Click "Add People" to get started.</div>';
    } else {
      var totalSteps = steps.length;
      var eh = '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 80px;gap:8px;padding:6px 12px;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);margin-bottom:4px;"><div>Contact</div><div>Progress</div><div>Next Send</div><div>Status</div><div></div></div>';
      enrollments.forEach(function(e) {
        var progress = e.current_step + ' of ' + totalSteps;
        var progressPct = totalSteps > 0 ? Math.round((e.current_step / totalSteps) * 100) : 0;
        var nextSend = e.next_send_at ? emFormatDate(e.next_send_at) : '—';
        var statusColor = e.status === 'active' ? '#22c55e' : e.status === 'completed' ? '#3b82f6' : e.status === 'paused' ? '#f59e0b' : 'var(--text-muted)';

        eh += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 80px;gap:8px;padding:8px 12px;border-radius:6px;font-size:12px;align-items:center;">';
        eh += '<div style="color:var(--text-secondary);">' + (e.contact_name || e.contact_email) + '<div style="font-size:10px;color:var(--text-muted);">' + e.contact_email + '</div></div>';
        eh += '<div><div style="display:flex;align-items:center;gap:6px;"><div style="flex:1;height:4px;background:#f8f9fb;border-radius:2px;"><div style="width:' + progressPct + '%;height:100%;background:#3b82f6;border-radius:2px;"></div></div><span style="font-size:10px;color:var(--text-muted);">' + progress + '</span></div></div>';
        eh += '<div style="font-size:11px;color:var(--text-muted);">' + nextSend + '</div>';
        eh += '<div><span style="font-size:10px;padding:2px 6px;border-radius:4px;background:' + statusColor + '20;color:' + statusColor + ';">' + e.status + '</span></div>';
        eh += '<div>';
        if (e.status === 'active') {
          eh += '<button class="topbar-btn" style="font-size:9px;padding:2px 6px;" onclick="emPauseEnrollment(' + e.id + ')"><i class="fas fa-pause"></i></button> ';
        } else if (e.status === 'paused') {
          eh += '<button class="topbar-btn" style="font-size:9px;padding:2px 6px;" onclick="emResumeEnrollment(' + e.id + ')"><i class="fas fa-play"></i></button> ';
        }
        eh += '<button class="topbar-btn danger" style="font-size:9px;padding:2px 6px;" onclick="emRemoveEnrollment(' + e.id + ')"><i class="fas fa-times"></i></button>';
        eh += '</div></div>';
      });
      enrollEl.innerHTML = eh;
    }
  });
}

function emToggleEmailPreview(idx) {
  var el = document.getElementById('emEmailPreview_' + idx);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function emDetailEdit() {
  if (!emDetailData) return;
  emCloseCampaignDetail();
  emEditCampaign(emDetailData.id);
}

function emDetailToggle() {
  if (!emDetailData) return;
  var newStatus = emDetailData.status === 'active' ? 'paused' : 'active';
  emToggleCampaign(emDetailData.id, newStatus);
  setTimeout(function() { emLoadCampaignDetail(emDetailData.id); }, 500);
}

function emFormatDate(dateStr) {
  var d = new Date(dateStr);
  var now = new Date();
  var diffDays = Math.ceil((d - now) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return (d.getMonth()+1) + '/' + d.getDate();
}

// ===== ENROLLMENT MANAGEMENT =====
var emEnrollContacts = [];
var emEnrollSelected = [];

function emOpenEnrollModal() {
  document.getElementById('emEnrollOverlay').style.display = 'flex';
  emEnrollSelected = [];
  document.getElementById('emEnrollCount').textContent = '0 selected';
  document.getElementById('emEnrollSearch').value = '';
  // Load CRM contacts
  fetch(API_BASE + '/crm-contacts?lo_user_id=' + encodeURIComponent(localStorage.getItem('agent_edge_user') || 'default'))
  .then(function(r) { return r.json(); })
  .then(function(data) {
    emEnrollContacts = data.contacts || data || [];
    emRenderEnrollList();
  }).catch(function() {
    document.getElementById('emEnrollList').innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:12px;text-align:center;">Could not load contacts</div>';
  });
}

function emCloseEnrollModal() {
  document.getElementById('emEnrollOverlay').style.display = 'none';
}

function emRenderEnrollList() {
  var search = (document.getElementById('emEnrollSearch').value || '').toLowerCase();
  var filtered = emEnrollContacts.filter(function(c) {
    var name = ((c.first_name || '') + ' ' + (c.last_name || '') + ' ' + (c.email || '')).toLowerCase();
    return name.indexOf(search) !== -1;
  });

  var el = document.getElementById('emEnrollList');
  if (filtered.length === 0) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:12px;text-align:center;">No contacts found</div>';
    return;
  }

  // Check who's already enrolled
  var existingEmails = {};
  if (emDetailData && emDetailData.enrollments) {
    emDetailData.enrollments.forEach(function(e) { existingEmails[e.contact_email.toLowerCase()] = true; });
  }

  var h = '';
  filtered.slice(0, 50).forEach(function(c) {
    var email = (c.email || '').toLowerCase();
    var name = ((c.first_name || '') + ' ' + (c.last_name || '')).trim() || email;
    var alreadyEnrolled = existingEmails[email];
    var isSelected = emEnrollSelected.indexOf(email) !== -1;

    h += '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;' + (alreadyEnrolled ? 'opacity:0.4;' : 'cursor:pointer;') + '" ';
    if (!alreadyEnrolled) {
      h += 'onclick="emToggleEnrollSelect(\'' + email.replace(/'/g, "\\'") + '\',\'' + name.replace(/'/g, "\\'") + '\')" onmouseover="this.style.background=\'rgba(0,0,0,0.02)\'" onmouseout="this.style.background=\'none\'"';
    }
    h += '>';
    h += '<div style="width:20px;height:20px;border-radius:4px;border:2px solid ' + (isSelected ? '#3b82f6' : 'var(--text-muted)') + ';background:' + (isSelected ? '#3b82f6' : 'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">';
    if (isSelected) h += '<i class="fas fa-check" style="font-size:10px;color:white;"></i>';
    if (alreadyEnrolled) h += '<i class="fas fa-minus" style="font-size:10px;color:var(--text-muted);"></i>';
    h += '</div>';
    h += '<div style="flex:1;"><div style="font-size:12px;color:var(--text-secondary);">' + name + '</div><div style="font-size:10px;color:var(--text-muted);">' + email + '</div></div>';
    if (alreadyEnrolled) h += '<span style="font-size:9px;color:var(--text-muted);">Already enrolled</span>';
    h += '</div>';
  });
  el.innerHTML = h;
}

function emFilterEnrollList() { emRenderEnrollList(); }

function emToggleEnrollSelect(email, name) {
  var idx = emEnrollSelected.findIndex(function(s) { return s.email === email; });
  if (idx >= 0) {
    emEnrollSelected.splice(idx, 1);
  } else {
    emEnrollSelected.push({ email: email, name: name });
  }
  document.getElementById('emEnrollCount').textContent = emEnrollSelected.length + ' selected';
  emRenderEnrollList();
}

function emBulkEnroll() {
  if (emEnrollSelected.length === 0 || !emDetailCampaignId) { showToast('Select at least one contact'); return; }
  var loUser = localStorage.getItem('agent_edge_user') || 'default';
  var promises = emEnrollSelected.map(function(s) {
    return fetch(API_BASE + '/email-center', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enroll', campaign_id: emDetailCampaignId, contact_email: s.email, contact_name: s.name, lo_user_id: loUser })
    });
  });
  Promise.all(promises).then(function() {
    emCloseEnrollModal();
    emLoadCampaignDetail(emDetailCampaignId);
    showToast(emEnrollSelected.length + ' contact(s) enrolled!', 'success');
  });
}

function emPauseEnrollment(id) {
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unenroll', enrollment_id: id })
  }).then(function() { emLoadCampaignDetail(emDetailCampaignId); showToast('Enrollment paused'); });
}

function emResumeEnrollment(id) {
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resume_enrollment', enrollment_id: id })
  }).then(function() { emLoadCampaignDetail(emDetailCampaignId); showToast('Enrollment resumed', 'success'); });
}

function emRemoveEnrollment(id) {
  if (!confirm('Remove this contact from the campaign?')) return;
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'remove_enrollment', enrollment_id: id })
  }).then(function() { emLoadCampaignDetail(emDetailCampaignId); showToast('Contact removed'); });
}

// ===== CAMPAIGNS =====
function emLoadCampaigns() {
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_campaigns', lo_user_id: localStorage.getItem('agent_edge_user') || 'default' })
  }).then(function(r) { return r.json(); }).then(function(data) {
    emCampaigns = data.campaigns || [];
    emRenderCampaignList();
  }).catch(function() {});
}

function emRenderCampaignList() {
  var el = document.getElementById('emCampaignList');
  if (emCampaigns.length === 0) {
    el.innerHTML = '<div style="padding:40px;text-align:center;border:1px dashed var(--border);border-radius:10px;color:var(--text-muted);font-size:12px;"><i class="fas fa-mail-bulk" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.3;"></i>No campaigns yet. Click "+ New Campaign" to create your first drip sequence.</div>';
    return;
  }
  var trigLabels = { manual:'Manual', signup:'New Signup', birthday:'Birthday', loan_funded:'Loan Funded', inactive:'Inactive 7d', anniversary:'Anniversary', rate_drop:'Rate Drop' };
  var h = '';
  emCampaigns.forEach(function(c) {
    var statusColor = c.status === 'active' ? '#22c55e' : c.status === 'paused' ? '#f59e0b' : 'var(--text-muted)';
    var statusLabel = c.status.charAt(0).toUpperCase() + c.status.slice(1);
    var stepCount = c.steps ? c.steps.length : 0;

    h += '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#fafbfc;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">';
    h += '<div style="width:10px;height:10px;border-radius:50%;background:' + statusColor + ';flex-shrink:0;"></div>';
    h += '<div style="flex:1;cursor:pointer;" onclick="emOpenCampaignDetail(' + c.id + ')">';
    h += '<div style="font-size:14px;font-weight:600;color:var(--text-primary);">' + c.name + ' <i class="fas fa-chevron-right" style="font-size:10px;opacity:0.3;"></i></div>';
    h += '<div style="font-size:11px;color:var(--text-muted);">' + (trigLabels[c.trigger_type] || c.trigger_type) + ' · ' + stepCount + ' email' + (stepCount !== 1 ? 's' : '') + (c.description ? ' · ' + c.description : '') + '</div>';
    h += '</div>';
    h += '<span style="font-size:10px;padding:3px 8px;border-radius:4px;background:' + statusColor + '20;color:' + statusColor + ';font-weight:600;">' + statusLabel + '</span>';

    if (c.status === 'active') {
      h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="emToggleCampaign(' + c.id + ',\'paused\')"><i class="fas fa-pause"></i></button>';
    } else {
      h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="emToggleCampaign(' + c.id + ',\'active\')"><i class="fas fa-play"></i></button>';
    }
    h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="emEditCampaign(' + c.id + ')"><i class="fas fa-edit"></i></button>';
    h += '<button class="topbar-btn danger" style="font-size:10px;padding:4px 8px;" onclick="emDeleteCampaign(' + c.id + ')"><i class="fas fa-trash-alt"></i></button>';
    h += '</div>';
  });
  el.innerHTML = h;
}

function emToggleCampaign(id, newStatus) {
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'toggle_campaign', campaign_id: id, status: newStatus })
  }).then(function() { emLoadCampaigns(); showToast('Campaign ' + newStatus, 'success'); });
}

function emDeleteCampaign(id) {
  if (!confirm('Delete this campaign and all its steps? This cannot be undone.')) return;
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_campaign', campaign_id: id })
  }).then(function() { emLoadCampaigns(); showToast('Campaign deleted'); });
}

function emOpenCampaignBuilder() {
  document.getElementById('emCampaignBuilder').style.display = 'block';
  document.getElementById('emBuilderTitle').textContent = 'New Campaign';
  document.getElementById('emCampName').value = '';
  document.getElementById('emCampTrigger').value = 'manual';
  document.getElementById('emCampDesc').value = '';
  document.getElementById('emCampEditId').value = '';
  emEditSteps = [];
  emRenderSteps();
}

function emCloseCampaignBuilder() {
  document.getElementById('emCampaignBuilder').style.display = 'none';
}

function emEditCampaign(id) {
  var c = emCampaigns.find(function(x) { return x.id === id; });
  if (!c) return;
  document.getElementById('emCampaignBuilder').style.display = 'block';
  document.getElementById('emBuilderTitle').textContent = 'Edit Campaign';
  document.getElementById('emCampName').value = c.name;
  document.getElementById('emCampTrigger').value = c.trigger_type;
  document.getElementById('emCampDesc').value = c.description || '';
  document.getElementById('emCampEditId').value = c.id;
  emEditSteps = (c.steps || []).map(function(s) {
    return { delay_days: s.delay_days, template_id: s.template_id, subject_override: s.subject_override || '', body_override: s.body_override || '' };
  });
  emRenderSteps();
}

function emAddStep() {
  emEditSteps.push({ delay_days: emEditSteps.length === 0 ? 0 : 3, template_id: '', subject_override: '', body_override: '' });
  emRenderSteps();
}

function emRemoveStep(idx) {
  emEditSteps.splice(idx, 1);
  emRenderSteps();
}

function emRenderSteps() {
  var el = document.getElementById('emStepsList');
  if (emEditSteps.length === 0) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:12px;text-align:center;border:1px dashed var(--border);border-radius:8px;">No emails in this sequence yet. Click "Add Email Step" to build your drip.</div>';
    return;
  }
  var tplOpts = '<option value="">— Select a template —</option>';
  emTemplates.forEach(function(t) {
    tplOpts += '<option value="' + t.id + '">' + t.name + '</option>';
  });
  var h = '';
  emEditSteps.forEach(function(s, i) {
    h += '<div style="display:flex;align-items:flex-start;gap:12px;padding:12px;background:#fafbfc;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;">';
    // Timeline dot
    h += '<div style="display:flex;flex-direction:column;align-items:center;padding-top:4px;"><div style="width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#3b82f6;">' + (i+1) + '</div>';
    if (i < emEditSteps.length - 1) h += '<div style="width:2px;height:20px;background:rgba(59,130,246,0.15);margin-top:4px;"></div>';
    h += '</div>';
    // Step content
    h += '<div style="flex:1;">';
    h += '<div style="display:grid;grid-template-columns:120px 1fr;gap:8px;margin-bottom:8px;">';
    h += '<div class="fc-field"><div class="fc-lbl" title="' + (i === 0 ? 'How many days after the trigger event to send this email. 0 = send immediately when triggered.' : 'How many days after the PREVIOUS email to send this one.') + '" style="cursor:help;border-bottom:1px dotted var(--border);">' + (i === 0 ? 'Days after trigger' : 'Days after prev') + ' <i class="fas fa-info-circle" style="font-size:9px;opacity:0.4;"></i></div><input type="number" min="0" value="' + s.delay_days + '" onchange="emEditSteps[' + i + '].delay_days=parseInt(this.value)||0" style="width:100%;"></div>';
    h += '<div class="fc-field"><div class="fc-lbl" title="Choose which pre-written email template to send at this step. Create templates in the Templates tab first." style="cursor:help;border-bottom:1px dotted var(--border);">Email Template <i class="fas fa-info-circle" style="font-size:9px;opacity:0.4;"></i></div><select onchange="emEditSteps[' + i + '].template_id=this.value||null">' + tplOpts.replace('value="' + s.template_id + '"', 'value="' + s.template_id + '" selected') + '</select></div>';
    h += '</div>';
    h += '<div class="fc-field"><div class="fc-lbl" title="Optional: override the template\'s subject line for this specific step. Leave blank to use the template\'s original subject." style="cursor:help;border-bottom:1px dotted var(--border);">Subject Override (optional) <i class="fas fa-info-circle" style="font-size:9px;opacity:0.4;"></i></div><input value="' + (s.subject_override || '').replace(/"/g, '&quot;') + '" onchange="emEditSteps[' + i + '].subject_override=this.value" placeholder="Leave blank to use template subject"></div>';
    h += '</div>';
    h += '<button class="topbar-btn danger" style="font-size:10px;padding:4px 8px;margin-top:4px;" onclick="emRemoveStep(' + i + ')"><i class="fas fa-times"></i></button>';
    h += '</div>';
  });
  el.innerHTML = h;
}

function emSaveCampaign() {
  var name = document.getElementById('emCampName').value.trim();
  if (!name) { showToast('Campaign name required'); return; }
  var editId = document.getElementById('emCampEditId').value;
  var campaign = {
    name: name,
    trigger_type: document.getElementById('emCampTrigger').value,
    description: document.getElementById('emCampDesc').value.trim(),
    status: 'draft',
    steps: emEditSteps
  };
  if (editId) campaign.id = parseInt(editId);

  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_campaign', lo_user_id: localStorage.getItem('agent_edge_user') || 'default', campaign: campaign })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) {
      emCloseCampaignBuilder();
      emLoadCampaigns();
      showToast('Campaign saved!', 'success');
    } else { showToast('Error: ' + data.message); }
  });
}

// ===== TEMPLATES =====
function emLoadTemplates() {
  var loUser = localStorage.getItem('agent_edge_user') || 'default';
  Promise.all([
    fetch(API_BASE + '/email-center', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list_templates', lo_user_id: loUser }) }).then(function(r) { return r.json(); }),
    fetch(API_BASE + '/email-center', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list_campaigns', lo_user_id: loUser }) }).then(function(r) { return r.json(); })
  ]).then(function(results) {
    emTemplates = results[0].templates || [];
    emCampaigns = results[1].campaigns || [];
    emRenderTemplateList();
  });
}

function emRenderTemplateList() {
  var el = document.getElementById('emTemplateList');

  // Build map: template_id -> campaign info
  var tplToCampaign = {};
  emCampaigns.forEach(function(c) {
    (c.steps || []).forEach(function(s) {
      if (s.template_id) {
        if (!tplToCampaign[s.template_id]) tplToCampaign[s.template_id] = [];
        tplToCampaign[s.template_id].push({ name: c.name, stepOrder: s.step_order, campaignId: c.id });
      }
    });
  });

  // Group by campaign
  var campaignTemplates = {};
  var customTemplates = [];

  emTemplates.forEach(function(t) {
    if (tplToCampaign[t.id]) {
      tplToCampaign[t.id].forEach(function(info) {
        if (!campaignTemplates[info.name]) campaignTemplates[info.name] = { campaignId: info.campaignId, templates: [] };
        campaignTemplates[info.name].templates.push({ tpl: t, stepOrder: info.stepOrder });
      });
    } else {
      customTemplates.push(t);
    }
  });

  Object.keys(campaignTemplates).forEach(function(key) {
    campaignTemplates[key].templates.sort(function(a, b) { return a.stepOrder - b.stepOrder; });
  });

  var h = '';
  var campKeys = Object.keys(campaignTemplates);

  // Campaign icons
  var campIcons = { 'Birthday Greeting':'🎂', 'Past Client Nurture':'🏠', 'Refi Opportunity':'💰', 'Realtor Recruitment':'🤝', 'Rent to Buy':'🏘️', 'Credit Repair Journey':'🔧', 'Holiday Greetings':'🎄', 'Second Home & Investment':'🏡', 'Monthly Market Update':'📊', 'Home Anniversary':'🎉', 'Divorce Attorney Outreach':'⚖️', 'Tax Planner Partnership':'🧾' };

  // CAMPAIGN EMAILS
  if (campKeys.length > 0) {
    h += '<div style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;margin-bottom:12px;">CAMPAIGN EMAILS</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:24px;">';
    campKeys.forEach(function(campName) {
      var group = campaignTemplates[campName];
      var count = group.templates.length;
      var icon = campIcons[campName] || '📧';
      h += '<div class="em-camp-card" onclick="emOpenCampaignTemplates(\'' + campName.replace(/'/g, "\\'") + '\')" style="cursor:pointer;background:#fafbfc;border:1px solid var(--border);border-radius:12px;padding:18px;transition:all 0.2s;position:relative;overflow:hidden;" onmouseover="this.style.borderColor=\'rgba(59,130,246,0.4)\';this.style.background=\'rgba(59,130,246,0.04)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'#fafbfc\'">';
      h += '<div style="font-size:28px;margin-bottom:10px;">' + icon + '</div>';
      h += '<div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">' + campName + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted);">' + count + ' email' + (count !== 1 ? 's' : '') + ' in sequence</div>';
      // Mini step dots
      h += '<div style="display:flex;gap:4px;margin-top:10px;">';
      for (var i = 0; i < count; i++) {
        h += '<div style="width:6px;height:6px;border-radius:50%;background:rgba(59,130,246,0.3);"></div>';
      }
      h += '</div>';
      h += '</div>';
    });
    h += '</div>';
  }

  // CUSTOM TEMPLATES
  h += '<div style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;margin-bottom:12px;">MY CUSTOM TEMPLATES</div>';
  if (customTemplates.length === 0) {
    h += '<div style="padding:30px;text-align:center;border:1px dashed var(--border);border-radius:10px;color:var(--text-muted);font-size:12px;">';
    h += '<i class="fas fa-magic" style="font-size:20px;display:block;margin-bottom:8px;opacity:0.3;color:#a855f7;"></i>';
    h += 'No custom templates yet. Click "+ New Template" to create your own with AI assist.</div>';
  } else {
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">';
    customTemplates.forEach(function(t) {
      h += '<div style="background:#fafbfc;border:1px solid var(--border);border-radius:12px;padding:18px;transition:all 0.2s;position:relative;" onmouseover="this.style.borderColor=\'rgba(168,85,247,0.4)\';this.style.background=\'rgba(168,85,247,0.04)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'#fafbfc\'">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">';
      h += '<div style="width:32px;height:32px;border-radius:8px;background:rgba(168,85,247,0.12);display:flex;align-items:center;justify-content:center;"><i class="fas fa-envelope" style="color:#a855f7;font-size:12px;"></i></div>';
      h += '<div style="display:flex;gap:4px;">';
      h += '<button class="topbar-btn" style="font-size:9px;padding:3px 6px;" onclick="emEditTemplate(' + t.id + ')"><i class="fas fa-edit"></i></button>';
      h += '<button class="topbar-btn danger" style="font-size:9px;padding:3px 6px;" onclick="emDeleteTemplate(' + t.id + ')"><i class="fas fa-trash-alt"></i></button>';
      h += '</div></div>';
      h += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.name + '</div>';
      h += '<div style="font-size:10px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.subject + '</div>';
      h += '<div style="font-size:9px;padding:2px 6px;border-radius:4px;background:#f8f9fb;color:var(--text-muted);display:inline-block;margin-top:8px;">' + (t.category || 'custom') + '</div>';
      h += '</div>';
    });
    h += '</div>';
  }

  el.innerHTML = h;
}

// Open campaign template detail — shows all emails in that campaign
function emOpenCampaignTemplates(campName) {
  var el = document.getElementById('emTemplateList');

  // Build template list for this campaign
  var tplToCampaign = {};
  emCampaigns.forEach(function(c) {
    (c.steps || []).forEach(function(s) {
      if (s.template_id) {
        if (!tplToCampaign[s.template_id]) tplToCampaign[s.template_id] = [];
        tplToCampaign[s.template_id].push({ name: c.name, stepOrder: s.step_order });
      }
    });
  });

  var templates = [];
  emTemplates.forEach(function(t) {
    if (tplToCampaign[t.id]) {
      tplToCampaign[t.id].forEach(function(info) {
        if (info.name === campName) templates.push({ tpl: t, stepOrder: info.stepOrder });
      });
    }
  });
  templates.sort(function(a, b) { return a.stepOrder - b.stepOrder; });

  var campIcons = { 'Birthday Greeting':'🎂', 'Past Client Nurture':'🏠', 'Refi Opportunity':'💰', 'Realtor Recruitment':'🤝', 'Rent to Buy':'🏘️', 'Credit Repair Journey':'🔧', 'Holiday Greetings':'🎄', 'Second Home & Investment':'🏡', 'Monthly Market Update':'📊', 'Home Anniversary':'🎉', 'Divorce Attorney Outreach':'⚖️', 'Tax Planner Partnership':'🧾' };
  var icon = campIcons[campName] || '📧';

  var h = '';
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">';
  h += '<button class="topbar-btn" onclick="emRenderTemplateList()" style="font-size:11px;"><i class="fas fa-arrow-left"></i> Back</button>';
  h += '<div style="font-size:24px;">' + icon + '</div>';
  h += '<div><div style="font-size:16px;font-weight:700;color:var(--text-primary);">' + campName + '</div>';
  h += '<div style="font-size:11px;color:var(--text-muted);">' + templates.length + ' email' + (templates.length !== 1 ? 's' : '') + ' in sequence</div></div>';
  h += '</div>';

  templates.forEach(function(item, i) {
    var t = item.tpl;
    h += '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:4px;">';
    // Timeline
    h += '<div style="display:flex;flex-direction:column;align-items:center;padding-top:2px;">';
    h += '<div style="width:30px;height:30px;border-radius:50%;background:rgba(59,130,246,0.12);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#3b82f6;">' + item.stepOrder + '</div>';
    if (i < templates.length - 1) h += '<div style="width:2px;flex:1;min-height:30px;background:rgba(59,130,246,0.08);margin:4px 0;"></div>';
    h += '</div>';
    // Card
    h += '<div style="flex:1;background:#fafbfc;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;overflow:hidden;">';
    // Header - click to expand
    h += '<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;" onclick="emToggleTplPreview(\'campDrill_' + t.id + '\')">';
    h += '<div style="flex:1;min-width:0;">';
    h += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:2px;">' + t.name + '</div>';
    h += '<div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.subject + '</div>';
    h += '</div>';
    h += '<i class="fas fa-eye" style="font-size:10px;color:var(--text-muted);"></i>';
    h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="event.stopPropagation();emEditTemplate(' + t.id + ')"><i class="fas fa-edit"></i> Edit</button>';
    h += '</div>';
    // Preview
    h += '<div id="campDrill_' + t.id + '" style="display:none;border-top:1px solid var(--border);padding:16px;background:rgba(0,0,0,0.01);">';
    h += '<div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;">Subject: ' + t.subject.replace(/\{\{first_name\}\}/g, '<span style="color:#3b82f6;">Jane</span>') + '</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);line-height:1.7;">' + t.body_html.replace(/\{\{first_name\}\}/g, '<span style="color:#3b82f6;">Jane</span>').replace(/\{\{name\}\}/g, '<span style="color:#3b82f6;">Jane Smith</span>') + '</div>';
    h += '</div>';
    h += '</div></div>';
  });

  el.innerHTML = h;
}

function emToggleTplPreview(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function emOpenTemplateEditor() {
  document.getElementById('emTemplateEditor').style.display = 'block';
  document.getElementById('emTplEditorTitle').textContent = 'New Template';
  document.getElementById('emTplName').value = '';
  document.getElementById('emTplSubject').value = 'Happy Birthday, {{first_name}}!';
  document.getElementById('emTplBody').value = '<p>Hi {{first_name}},</p>\n\n';
  document.getElementById('emTplCategory').value = 'custom';
  document.getElementById('emTplEditId').value = '';
}

function emCloseTemplateEditor() {
  document.getElementById('emTemplateEditor').style.display = 'none';
}

function emEditTemplate(id) {
  var t = emTemplates.find(function(x) { return x.id === id; });
  if (!t) return;
  document.getElementById('emTemplateEditor').style.display = 'block';
  document.getElementById('emTplEditorTitle').textContent = 'Edit Template';
  document.getElementById('emTplName').value = t.name;
  document.getElementById('emTplSubject').value = t.subject;
  document.getElementById('emTplBody').value = t.body_html;
  document.getElementById('emTplCategory').value = t.category || 'custom';
  document.getElementById('emTplEditId').value = t.id;
}

function emSaveTemplate() {
  var name = document.getElementById('emTplName').value.trim();
  var subject = document.getElementById('emTplSubject').value.trim();
  var body = document.getElementById('emTplBody').value.trim();
  if (!name || !subject || !body) { showToast('Name, subject, and body required'); return; }

  var editId = document.getElementById('emTplEditId').value;
  var template = { name: name, subject: subject, body_html: body, category: document.getElementById('emTplCategory').value };
  if (editId) template.id = parseInt(editId);

  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_template', lo_user_id: localStorage.getItem('agent_edge_user') || 'default', template: template })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) {
      emCloseTemplateEditor();
      emLoadTemplates();
      showToast('Template saved!', 'success');
    } else { showToast('Error: ' + data.message); }
  });
}

function emDeleteTemplate(id) {
  if (!confirm('Delete this template?')) return;
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_template', template_id: id })
  }).then(function() { emLoadTemplates(); showToast('Template deleted'); });
}

function emPreviewTemplate() {
  var subject = document.getElementById('emTplSubject').value;
  var body = document.getElementById('emTplBody').value;
  var preview = window.open('', '_blank', 'width=650,height=700');
  var html = '<html><head><title>Preview</title></head><body style="font-family:Arial;color:#333;padding:20px;background:#f9f9f9;">';
  html += '<div style="max-width:600px;margin:0 auto;background:#fff;padding:30px;border-radius:4px;">';
  html += '<div style="font-size:11px;color:#999;margin-bottom:16px;">Subject: ' + subject.replace(/\{\{first_name\}\}/g, 'Jane').replace(/\{\{name\}\}/g, 'Jane Smith') + '</div>';
  html += body.replace(/\{\{first_name\}\}/g, 'Jane').replace(/\{\{name\}\}/g, 'Jane Smith').replace(/\{\{email\}\}/g, 'jane@example.com');
  html += '</div></body></html>';
  preview.document.write(html);
  preview.document.close();
}

// ===== AI EMAIL WRITER =====
function emAiDraft() {
  document.getElementById('emAiOverlay').style.display = 'flex';
  document.getElementById('emAiPrompt').value = '';
  document.getElementById('emAiResult').textContent = '';
  // Pre-fill tone suggestion based on category
  var cat = document.getElementById('emTplCategory').value;
  if (cat === 'milestone') document.getElementById('emAiTone').value = 'warm and professional';
  if (cat === 'seasonal') document.getElementById('emAiTone').value = 'energetic and upbeat';
}

function emAiClose() {
  document.getElementById('emAiOverlay').style.display = 'none';
}

function emAiGenerate() {
  var prompt = document.getElementById('emAiPrompt').value.trim();
  if (!prompt) { document.getElementById('emAiResult').textContent = 'Please describe what you want'; return; }
  var tone = document.getElementById('emAiTone').value;
  var btn = document.getElementById('emAiBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Writing...';
  document.getElementById('emAiResult').textContent = '';

  fetch(API_BASE + '/ai-email-writer', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: prompt, tone: tone })
  }).then(function(r) { return r.json(); }).then(function(data) {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Generate';
    if (data.success && data.body_html) {
      document.getElementById('emTplBody').value = data.body_html;
      if (data.subject) document.getElementById('emTplSubject').value = data.subject;
      emAiClose();
      showToast('AI draft ready! Review and edit as needed.', 'success');
    } else {
      document.getElementById('emAiResult').textContent = 'Failed: ' + (data.message || 'Try again');
    }
  }).catch(function() {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Generate';
    document.getElementById('emAiResult').textContent = 'Error connecting to AI';
  });
}

// ===== HISTORY =====
// ===== AUTO-ENROLLMENT UTILITY =====
function emAutoEnroll(trigger, email, name) {
  if (!email) return;
  fetch(API_BASE + '/auto-enroll', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trigger: trigger,
      contact_email: email,
      contact_name: name || '',
      lo_user_id: localStorage.getItem('agent_edge_user') || 'default'
    })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.enrolled > 0) console.log('Auto-enrolled ' + email + ' in ' + data.enrolled + ' campaign(s) for trigger: ' + trigger);
  }).catch(function() {});
}

// ===== COMPOSE =====
function emOpenCompose() {
  document.getElementById('emComposeOverlay').style.display = 'flex';
  document.getElementById('emComposeTo').value = '';
  document.getElementById('emComposeSubject').value = '';
  document.getElementById('emComposeBody').value = '';
  document.getElementById('emComposeResult').textContent = '';
  // Load template options
  var sel = document.getElementById('emComposeTemplate');
  var opts = '<option value="">— Write custom —</option>';
  emTemplates.forEach(function(t) { opts += '<option value="' + t.id + '">' + t.name + '</option>'; });
  sel.innerHTML = opts;
}

function emCloseCompose() {
  document.getElementById('emComposeOverlay').style.display = 'none';
}

function emFillFromTemplate() {
  var sel = document.getElementById('emComposeTemplate');
  var tid = sel.value;
  if (!tid) return;
  var t = emTemplates.find(function(x) { return String(x.id) === tid; });
  if (t) {
    document.getElementById('emComposeSubject').value = t.subject;
    document.getElementById('emComposeBody').value = t.body_html;
  }
}

function emSendCompose() {
  var to = document.getElementById('emComposeTo').value.trim();
  var subject = document.getElementById('emComposeSubject').value.trim();
  var body = document.getElementById('emComposeBody').value.trim();
  var result = document.getElementById('emComposeResult');
  if (!to || !subject || !body) { result.style.color = '#ef4444'; result.textContent = 'All fields required'; return; }
  result.style.color = 'var(--text-muted)'; result.textContent = 'Sending...';

  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'send_now', lo_user_id: localStorage.getItem('agent_edge_user') || 'default', to: to, subject: subject, body_html: body })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) {
      result.style.color = '#22c55e'; result.textContent = '✓ Sent!';
      setTimeout(function() { emCloseCompose(); }, 1000);
    } else {
      result.style.color = '#ef4444'; result.textContent = 'Failed: ' + (data.message || 'Unknown');
    }
  }).catch(function(err) { result.style.color = '#ef4444'; result.textContent = 'Error'; });
}

// Keep old function name working for CRM cards
function openComposeEmail() { emOpenCompose(); }

