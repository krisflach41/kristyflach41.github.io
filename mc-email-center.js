// ===== EMAIL CENTER =====
var emTemplates = [];
var emCampaigns = [];
var emEditSteps = [];
var emLoaded = false;

function emTab(tab) {
  ['emDashboard','emAudiences','emCampaigns','emCampaignDetail','emTemplates'].forEach(function(id) {
    var e = document.getElementById(id); if (e) e.style.display = 'none';
  });
  ['emTabDashboard','emTabAudiences','emTabCampaigns','emTabTemplates'].forEach(function(id) {
    var e = document.getElementById(id); if (e) e.classList.remove('active');
  });
  var map = { dashboard:'emDashboard', audiences:'emAudiences', campaigns:'emCampaigns', templates:'emTemplates' };
  var tabMap = { dashboard:'emTabDashboard', audiences:'emTabAudiences', campaigns:'emTabCampaigns', templates:'emTabTemplates' };
  var t = document.getElementById(map[tab]); if (t) t.style.display = 'block';
  var tb = document.getElementById(tabMap[tab]); if (tb) tb.classList.add('active');
  if (tab === 'dashboard') emLoadDashboard();
  if (tab === 'audiences') audLoadGroups();
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
      document.getElementById('emStatClick').textContent = (data.stats.click_rate || 0) + '%';
      document.getElementById('emStatBounced').textContent = data.stats.bounced || 0;
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

    // Active campaigns — each as its own card
    var el = document.getElementById('emCampaignPerf');
    if (active.length === 0) {
      el.innerHTML = '';
    } else {
      var h = '';
      active.forEach(function(c) {
        var stepCount = c.steps ? c.steps.length : 0;
        h += '<div class="mc-panel" id="emPerfRow_' + c.id + '">';
        h += '<div class="mc-panel-head" style="cursor:pointer;" onclick="emTogglePerfDetail(' + c.id + ')">';
        h += '<div class="mc-blinker green"></div>';
        h += '<div class="mc-panel-title">' + c.name.toUpperCase() + '</div>';
        h += '<div style="margin-left:auto;display:flex;align-items:center;gap:8px;">';
        h += '<span style="font-size:10px;color:var(--text-muted);">' + stepCount + ' email' + (stepCount !== 1 ? 's' : '') + '</span>';
        h += '<i class="fas fa-chevron-down" style="font-size:9px;color:var(--text-muted);transition:transform 0.2s;" id="emPerfChevron_' + c.id + '"></i>';
        h += '</div></div>';
        h += '<div id="emPerfDetail_' + c.id + '" style="display:none;padding:12px;"></div>';
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
}

// ===== CAMPAIGN PERFORMANCE EXPAND/COLLAPSE =====
var emPerfLoaded = {};

function emTogglePerfDetail(campaignId) {
  var detail = document.getElementById('emPerfDetail_' + campaignId);
  var chevron = document.getElementById('emPerfChevron_' + campaignId);
  if (!detail) return;

  if (detail.style.display === 'none') {
    detail.style.display = 'block';
    if (chevron) chevron.style.transform = 'rotate(180deg)';

    if (!emPerfLoaded[campaignId]) {
      detail.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:8px;">Loading...</div>';
      fetch(API_BASE + '/email-center', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'campaign_stats', campaign_id: campaignId })
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (!data.success || !data.stats || data.stats.total === 0) {
          detail.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:8px;">No sends yet</div>';
          return;
        }
        emPerfLoaded[campaignId] = true;
        var s = data.stats;
        var h = '';

        h += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:10px;">';
        h += emPerfMetric('Sent', s.total, '#3b82f6');
        h += emPerfMetric('Delivered', s.delivered, '#22c55e');
        h += emPerfMetric('Opened', s.opened, '#f59e0b', s.open_rate + '%');
        h += emPerfMetric('Clicked', s.clicked, '#8b5cf6', s.click_rate + '%');
        h += emPerfMetric('Bounced', s.bounced, '#ef4444', s.bounce_rate + '%');
        h += emPerfMetric('Unsub', s.unsubscribed, '#6b7280');
        h += '</div>';

        var steps = s.per_step || {};
        var stepKeys = Object.keys(steps).sort(function(a, b) { return parseInt(a) - parseInt(b); });
        if (stepKeys.length > 1) {
          h += '<div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Per Email</div>';
          h += '<div style="display:grid;grid-template-columns:60px repeat(5,1fr);gap:4px;font-size:10px;color:var(--text-muted);padding:3px 6px;border-bottom:1px solid var(--border);margin-bottom:2px;">';
          h += '<div>Step</div><div>Sent</div><div>Delivered</div><div>Opened</div><div>Clicked</div><div>Bounced</div></div>';
          stepKeys.forEach(function(key) {
            var st = steps[key];
            var soRate = st.delivered > 0 ? Math.round((st.opened / st.delivered) * 100) : 0;
            var scRate = st.delivered > 0 ? Math.round((st.clicked / st.delivered) * 100) : 0;
            h += '<div style="display:grid;grid-template-columns:60px repeat(5,1fr);gap:4px;font-size:11px;padding:4px 6px;align-items:center;">';
            h += '<div style="font-weight:600;color:var(--text-secondary);">Email ' + key + '</div>';
            h += '<div>' + st.sent + '</div>';
            h += '<div>' + st.delivered + '</div>';
            h += '<div>' + st.opened + ' <span style="font-size:9px;color:var(--text-muted);">(' + soRate + '%)</span></div>';
            h += '<div>' + st.clicked + ' <span style="font-size:9px;color:var(--text-muted);">(' + scRate + '%)</span></div>';
            h += '<div>' + st.bounced + '</div>';
            h += '</div>';
          });
        }

        detail.innerHTML = h;
      }).catch(function() {
        detail.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:8px;">Failed to load</div>';
      });
    }
  } else {
    detail.style.display = 'none';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }
}

function emPerfMetric(label, value, color, sub) {
  var h = '<div style="text-align:center;padding:6px;border-radius:6px;background:' + color + '08;">';
  h += '<div style="font-size:16px;font-weight:700;color:' + color + ';">' + (value || 0) + '</div>';
  h += '<div style="font-size:9px;color:var(--text-muted);">' + label + '</div>';
  if (sub) h += '<div style="font-size:9px;color:' + color + ';">' + sub + '</div>';
  h += '</div>';
  return h;
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

function emLoadCampaignAnalytics(campaignId) {
  var el = document.getElementById('emDetailAnalytics');
  el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:12px;">Loading analytics...</div>';

  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'campaign_stats', campaign_id: campaignId })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (!data.success || !data.stats) {
      el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:12px;">No analytics data yet</div>';
      return;
    }
    var s = data.stats;
    if (s.total === 0) {
      el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:12px;">No emails sent yet — analytics will appear after the first send</div>';
      return;
    }

    var h = '';

    // Top-level metrics
    h += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:16px;">';
    h += emStatBox('Sent', s.total, '#3b82f6');
    h += emStatBox('Delivered', s.delivered, '#22c55e');
    h += emStatBox('Opened', s.opened, '#f59e0b', s.open_rate + '%');
    h += emStatBox('Clicked', s.clicked, '#8b5cf6', s.click_rate + '%');
    h += emStatBox('Bounced', s.bounced, '#ef4444', s.bounce_rate + '%');
    h += emStatBox('Unsubscribed', s.unsubscribed, '#6b7280');
    h += '</div>';

    // Visual bar
    if (s.delivered > 0) {
      var openW = Math.round((s.opened / s.total) * 100);
      var clickW = Math.round((s.clicked / s.total) * 100);
      h += '<div style="margin-bottom:16px;">';
      h += '<div style="display:flex;gap:4px;height:8px;border-radius:4px;overflow:hidden;background:#f1f5f9;">';
      if (openW > 0) h += '<div style="width:' + openW + '%;background:#f59e0b;border-radius:4px;" title="Opened ' + openW + '%"></div>';
      if (clickW > 0) h += '<div style="width:' + clickW + '%;background:#8b5cf6;border-radius:4px;" title="Clicked ' + clickW + '%"></div>';
      h += '</div>';
      h += '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:4px;">';
      h += '<span><span style="display:inline-block;width:8px;height:8px;background:#f59e0b;border-radius:2px;margin-right:4px;"></span>Opens ' + s.open_rate + '%</span>';
      h += '<span><span style="display:inline-block;width:8px;height:8px;background:#8b5cf6;border-radius:2px;margin-right:4px;"></span>Clicks ' + s.click_rate + '%</span>';
      h += '</div>';
      h += '</div>';
    }

    // Per-step breakdown
    var steps = s.per_step || {};
    var stepKeys = Object.keys(steps).sort(function(a, b) { return parseInt(a) - parseInt(b); });
    if (stepKeys.length > 1) {
      h += '<div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Per Email Breakdown</div>';
      h += '<div style="display:grid;grid-template-columns:60px repeat(5,1fr);gap:6px;font-size:10px;color:var(--text-muted);padding:4px 8px;border-bottom:1px solid var(--border);margin-bottom:4px;">';
      h += '<div>Step</div><div>Sent</div><div>Delivered</div><div>Opened</div><div>Clicked</div><div>Bounced</div></div>';
      stepKeys.forEach(function(key) {
        var st = steps[key];
        var stepOpenRate = st.delivered > 0 ? Math.round((st.opened / st.delivered) * 100) : 0;
        var stepClickRate = st.delivered > 0 ? Math.round((st.clicked / st.delivered) * 100) : 0;
        h += '<div style="display:grid;grid-template-columns:60px repeat(5,1fr);gap:6px;font-size:12px;padding:6px 8px;border-radius:4px;align-items:center;">';
        h += '<div style="font-weight:600;color:var(--text-secondary);">Email ' + key + '</div>';
        h += '<div>' + st.sent + '</div>';
        h += '<div>' + st.delivered + '</div>';
        h += '<div>' + st.opened + ' <span style="font-size:10px;color:var(--text-muted);">(' + stepOpenRate + '%)</span></div>';
        h += '<div>' + st.clicked + ' <span style="font-size:10px;color:var(--text-muted);">(' + stepClickRate + '%)</span></div>';
        h += '<div>' + st.bounced + '</div>';
        h += '</div>';
      });
    }

    el.innerHTML = h;
  }).catch(function() {
    el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:12px;">Failed to load analytics</div>';
  });
}

function emStatBox(label, value, color, subLabel) {
  var h = '<div style="text-align:center;padding:10px;border-radius:8px;background:' + color + '08;border:1px solid ' + color + '15;">';
  h += '<div style="font-size:20px;font-weight:700;color:' + color + ';">' + (value || 0) + '</div>';
  h += '<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">' + label + '</div>';
  if (subLabel) h += '<div style="font-size:10px;color:' + color + ';margin-top:1px;">' + subLabel + '</div>';
  h += '</div>';
  return h;
}

function emLoadCampaignDetail(id) {
  // Load campaign analytics
  emLoadCampaignAnalytics(id);

  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_campaign', campaign_id: id })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (!data.success) return;
    emDetailData = data.campaign;
    var c = data.campaign;
    var trigLabels = { manual:'Manual', signup:'New Signup', birthday:'Birthday', loan_funded:'Loan Funded', inactive:'Inactive 7d', anniversary:'Anniversary', rate_drop:'Rate Drop' };

    document.getElementById('emDetailName').textContent = c.name;
    document.getElementById('emDetailMeta').textContent = (trigLabels[c.trigger_type] || c.trigger_type) + ' · ' + (c.steps || []).length + ' steps · ' + (c.description || '');

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
      timelineEl.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:16px;">No steps in this campaign yet.</div>';
    } else {
      var th = '';
      var cumulativeDays = 0;
      steps.forEach(function(s, i) {
        cumulativeDays += (s.delay_days || 0);
        var isSms = (s.step_type || 'email') === 'sms';
        var stepColor = isSms ? '#22c55e' : '#3b82f6';
        var stepIcon = isSms ? 'fa-sms' : 'fa-envelope';
        var tpl = emTemplates.find(function(t) { return t.id === s.template_id; });
        var subject = isSms ? ('SMS: ' + (s.sms_body || '').substring(0, 60) + ((s.sms_body || '').length > 60 ? '...' : '')) : (s.subject_override || (tpl ? tpl.subject : 'Untitled'));
        var dayLabel = i === 0 ? (s.delay_days === 0 ? 'Immediately' : 'Day ' + s.delay_days) : 'Day ' + cumulativeDays;

        th += '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:4px;">';
        // Timeline connector
        th += '<div style="display:flex;flex-direction:column;align-items:center;">';
        th += '<div style="width:28px;height:28px;border-radius:50%;background:' + stepColor + '20;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:' + stepColor + ';"><i class="fas ' + stepIcon + '" style="font-size:10px;"></i></div>';
        if (i < steps.length - 1) th += '<div style="width:2px;height:100%;min-height:40px;background:' + stepColor + '15;"></div>';
        th += '</div>';
        // Content
        th += '<div style="flex:1;padding:4px 0 16px;" id="emStepDetail_' + i + '">';
        th += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">';
        th += '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:' + stepColor + '15;color:' + stepColor + ';font-weight:600;">' + dayLabel + '</span>';
        th += '<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:' + stepColor + '10;color:' + stepColor + ';">' + (isSms ? 'SMS' : 'EMAIL') + '</span>';
        if (s.delay_days > 0 && i > 0) th += '<span style="font-size:9px;color:var(--text-muted);">(' + s.delay_days + ' days after previous)</span>';
        th += '</div>';
        th += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:2px;">' + subject + '</div>';
        if (!isSms) {
          th += '<div style="font-size:10px;color:var(--text-muted);">' + (tpl ? tpl.name : 'Custom') + '</div>';
          th += '<button class="topbar-btn" style="font-size:10px;padding:3px 8px;margin-top:6px;" onclick="emToggleEmailPreview(' + i + ')"><i class="fas fa-eye"></i> Preview</button>';
          th += '<div id="emEmailPreview_' + i + '" style="display:none;margin-top:8px;padding:12px;background:#fafbfc;border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--text-secondary);line-height:1.6;"></div>';
        }
        th += '</div></div>';
      });
      timelineEl.innerHTML = th;

      // Pre-load preview content for email steps
      steps.forEach(function(s, i) {
        if ((s.step_type || 'email') === 'email') {
          var tpl = emTemplates.find(function(t) { return t.id === s.template_id; });
          if (tpl) {
            var previewEl = document.getElementById('emEmailPreview_' + i);
            if (previewEl) previewEl.innerHTML = tpl.body_html.replace(/\{\{first_name\}\}/g, '<span style="color:#3b82f6;">Jane</span>').replace(/\{\{name\}\}/g, '<span style="color:#3b82f6;">Jane Smith</span>');
          }
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
    el.innerHTML = '<div style="padding:40px;text-align:center;border:1px dashed var(--border);border-radius:10px;color:var(--text-muted);font-size:12px;"><i class="fas fa-mail-bulk" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.3;"></i>No campaigns yet. Create campaigns in the Templates tab.</div>';
    return;
  }
  var trigLabels = { manual:'Manual', signup:'New Signup', birthday:'Birthday', loan_funded:'Loan Funded', inactive:'Inactive 7d', anniversary:'Anniversary', rate_drop:'Rate Drop' };
  var autoTriggers = ['signup','birthday','loan_funded','inactive','anniversary','rate_drop'];

  // Group campaigns
  var active = emCampaigns.filter(function(c) { return c.status === 'active' && autoTriggers.indexOf(c.trigger_type) === -1; });
  var autoTrigger = emCampaigns.filter(function(c) { return autoTriggers.indexOf(c.trigger_type) !== -1; });
  var drafts = emCampaigns.filter(function(c) { return (c.status === 'draft' || c.status === 'paused') && autoTriggers.indexOf(c.trigger_type) === -1; });

  function renderGroup(camps) {
    var gh = '';
    camps.forEach(function(c) {
      var statusColor = c.status === 'active' ? '#22c55e' : c.status === 'paused' ? '#f59e0b' : 'var(--text-muted)';
      var statusLabel = c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Draft';
      var stepCount = c.steps ? c.steps.length : 0;

      gh += '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#fafbfc;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">';
      gh += '<div style="width:10px;height:10px;border-radius:50%;background:' + statusColor + ';flex-shrink:0;"></div>';
      gh += '<div style="flex:1;cursor:pointer;" onclick="emOpenCampaignDetail(' + c.id + ')">';
      gh += '<div style="font-size:14px;font-weight:600;color:var(--text-primary);">' + c.name + ' <i class="fas fa-chevron-right" style="font-size:10px;opacity:0.3;"></i></div>';
      gh += '<div style="font-size:11px;color:var(--text-muted);">' + (trigLabels[c.trigger_type] || c.trigger_type || 'Manual') + ' · ' + stepCount + ' step' + (stepCount !== 1 ? 's' : '') + (c.description ? ' · ' + c.description : '') + '</div>';
      gh += '</div>';
      gh += '<span style="font-size:10px;padding:3px 8px;border-radius:4px;background:' + statusColor + '20;color:' + statusColor + ';font-weight:600;">' + statusLabel + '</span>';
      if (c.status === 'active') {
        gh += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="emToggleCampaign(' + c.id + ',\'paused\')"><i class="fas fa-pause"></i></button>';
      } else {
        gh += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="emToggleCampaign(' + c.id + ',\'active\')"><i class="fas fa-play"></i></button>';
      }
      gh += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="emEditCampaign(' + c.id + ')"><i class="fas fa-edit"></i></button>';
      gh += '</div>';
    });
    return gh;
  }

  var h = '';
  if (active.length > 0) {
    h += '<div style="font-size:11px;font-weight:700;color:#22c55e;letter-spacing:0.5px;margin-bottom:8px;margin-top:8px;"><i class="fas fa-circle" style="font-size:6px;vertical-align:middle;margin-right:4px;"></i> ACTIVE CAMPAIGNS</div>';
    h += renderGroup(active);
  }
  if (autoTrigger.length > 0) {
    h += '<div style="font-size:11px;font-weight:700;color:#3b82f6;letter-spacing:0.5px;margin-bottom:8px;margin-top:16px;"><i class="fas fa-bolt" style="font-size:9px;vertical-align:middle;margin-right:4px;"></i> AUTO-TRIGGER CAMPAIGNS</div>';
    h += renderGroup(autoTrigger);
  }
  if (drafts.length > 0) {
    h += '<div style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;margin-bottom:8px;margin-top:16px;"><i class="fas fa-file-alt" style="font-size:9px;vertical-align:middle;margin-right:4px;"></i> DRAFTS & PAUSED</div>';
    h += renderGroup(drafts);
  }
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
  // Redirect to Templates tab
  emTab('templates');
  emOpenTemplateEditor();
}

function emCloseCampaignBuilder() {
  emCloseTemplateEditor();
}

function emEditCampaign(id) {
  emTab('templates');
  emEditTemplate(id);
}

function emAddStep(type) {
  var stepType = type || 'email';
  emEditSteps.push({ step_type: stepType, delay_days: emEditSteps.length === 0 ? 0 : 3, template_id: '', subject_override: '', body_override: '', sms_body: '' });
  emRenderSteps();
}

function emRemoveStep(idx) {
  emEditSteps.splice(idx, 1);
  emRenderSteps();
}

function emRenderSteps() {
  var el = document.getElementById('emStepsList');
  if (emEditSteps.length === 0) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:12px;text-align:center;border:1px dashed var(--border);border-radius:8px;">No steps yet. Add an Email or SMS step to build your campaign sequence.</div>';
    return;
  }
  var h = '';
  emEditSteps.forEach(function(s, i) {
    var isEmail = (s.step_type || 'email') === 'email';
    var stepColor = isEmail ? '#3b82f6' : '#22c55e';
    var stepIcon = isEmail ? 'fa-envelope' : 'fa-sms';
    var stepLabel = isEmail ? 'EMAIL' : 'SMS';

    h += '<div style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:#fafbfc;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;">';
    h += '<div style="display:flex;flex-direction:column;align-items:center;padding-top:4px;"><div style="width:24px;height:24px;border-radius:50%;background:' + stepColor + '20;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:' + stepColor + ';">' + (i+1) + '</div>';
    if (i < emEditSteps.length - 1) h += '<div style="width:2px;height:20px;background:' + stepColor + '20;margin-top:4px;"></div>';
    h += '</div>';
    h += '<div style="flex:1;">';
    h += '<div style="margin-bottom:8px;"><span style="font-size:10px;padding:2px 8px;border-radius:4px;background:' + stepColor + '15;color:' + stepColor + ';font-weight:600;"><i class="fas ' + stepIcon + '" style="margin-right:4px;"></i>' + stepLabel + ' — Step ' + (i+1) + '</span></div>';
    h += '<div class="fc-field" style="margin-bottom:8px;max-width:180px;"><div class="fc-lbl">' + (i === 0 ? 'Days after trigger' : 'Days after previous step') + '</div><input type="number" min="0" value="' + s.delay_days + '" onchange="emEditSteps[' + i + '].delay_days=parseInt(this.value)||0" style="width:100%;"></div>';

    if (isEmail) {
      // Greeting
      var greetOpts = ['Hi','Hello','Hey','Happy Birthday','Congratulations','Good morning','Happy Holidays'];
      var greetVal = s.greeting || 'Hi';
      h += '<div style="display:grid;grid-template-columns:150px 1fr;gap:8px;margin-bottom:8px;">';
      h += '<div class="fc-field"><div class="fc-lbl">Greeting</div><select onchange="emEditSteps[' + i + '].greeting=this.value">';
      greetOpts.forEach(function(g) { h += '<option value="' + g + '"' + (g === greetVal ? ' selected' : '') + '>' + g + '</option>'; });
      h += '</select></div>';
      // Subject
      h += '<div class="fc-field"><div class="fc-lbl">Subject Line *</div><input value="' + (s.subject_override || '').replace(/"/g, '&quot;') + '" onchange="emEditSteps[' + i + '].subject_override=this.value"></div>';
      h += '</div>';
      // AI button
      h += '<div onclick="emAiDraftForStep(' + i + ')" style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 14px;margin-bottom:8px;background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(59,130,246,0.08));border:1px dashed rgba(168,85,247,0.3);border-radius:8px;transition:all 0.2s;" onmouseover="this.style.borderColor=\'rgba(168,85,247,0.6)\'" onmouseout="this.style.borderColor=\'rgba(168,85,247,0.3)\'">';
      h += '<i class="fas fa-magic" style="font-size:12px;color:#a855f7;"></i>';
      h += '<span style="font-size:12px;font-weight:600;color:#a855f7;">AI Write</span></div>';
      // Body
      h += '<div class="fc-field" style="margin-bottom:8px;"><div class="fc-lbl">Email Body *</div>';
      h += '<textarea id="emStepBody_' + i + '" rows="6" style="width:100%;resize:vertical;background:#fff;border:1px solid var(--border);border-radius:8px;font-family:monospace;font-size:12px;padding:10px;box-sizing:border-box;" onchange="emEditSteps[' + i + '].body_override=this.value" placeholder="Write your email content here...">' + (s.body_override || '').replace(/</g, '&lt;') + '</textarea></div>';
      // AI rewrite bar for this step
      h += '<div id="emStepRewrite_' + i + '" style="display:none;margin-bottom:8px;padding:10px;background:linear-gradient(135deg,rgba(168,85,247,0.06),rgba(59,130,246,0.06));border:1px solid rgba(168,85,247,0.2);border-radius:8px;">';
      h += '<div style="display:flex;gap:8px;align-items:flex-end;">';
      h += '<textarea id="emStepExtra_' + i + '" rows="2" style="flex:1;background:#f8f9fb;border:1px solid var(--border);border-radius:8px;font-size:11px;padding:6px;resize:vertical;box-sizing:border-box;" placeholder="Make it shorter, more casual..."></textarea>';
      h += '<button class="topbar-btn" onclick="emAiRewriteStep(' + i + ')" style="white-space:nowrap;font-size:10px;"><i class="fas fa-redo"></i> Re-write</button></div>';
      h += '<div id="emStepRewriteStatus_' + i + '" style="font-size:10px;margin-top:4px;color:var(--text-muted);"></div></div>';
      // Video button
      h += '<button class="topbar-btn" onclick="emOpenVideoModal(\'emStepBody_' + i + '\')" style="font-size:10px;padding:4px 8px;color:#ef4444;border-color:rgba(239,68,68,0.3);"><i class="fab fa-youtube"></i> Add Video</button>';
    } else {
      h += '<div class="fc-field"><div class="fc-lbl">Text Message</div><textarea rows="3" style="width:100%;resize:vertical;" onchange="emEditSteps[' + i + '].sms_body=this.value" placeholder="Hi {{first_name}}, just wanted to check in...">' + (s.sms_body || '').replace(/</g, '&lt;') + '</textarea></div>';
      h += '<div style="font-size:10px;color:var(--text-muted);margin-top:4px;">Use {{first_name}} for personalization.</div>';
    }

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
  if (emCampaigns.length === 0) {
    el.innerHTML = '<div style="padding:40px;text-align:center;border:1px dashed var(--border);border-radius:10px;color:var(--text-muted);font-size:12px;"><i class="fas fa-mail-bulk" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.3;"></i>No campaigns yet. Click "+ New Campaign" to build your first drip sequence.</div>';
    return;
  }
  var trigLabels = { manual:'Manual', signup:'New Signup', birthday:'Birthday', loan_funded:'Loan Funded', inactive:'Inactive 7d', anniversary:'Anniversary', rate_drop:'Rate Drop' };
  var campIcons = { birthday:'🎂', anniversary:'🎉', loan_funded:'🏠', signup:'🤝', inactive:'⏰', rate_drop:'💰', manual:'📧' };
  var h = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;">';
  emCampaigns.forEach(function(c) {
    var statusColor = c.status === 'active' ? '#22c55e' : c.status === 'paused' ? '#f59e0b' : 'var(--text-muted)';
    var statusLabel = c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Draft';
    var stepCount = c.steps ? c.steps.length : 0;
    var emailSteps = (c.steps || []).filter(function(s) { return (s.step_type || 'email') === 'email'; }).length;
    var smsSteps = (c.steps || []).filter(function(s) { return s.step_type === 'sms'; }).length;
    var icon = campIcons[c.trigger_type] || '📧';

    h += '<div style="background:#fafbfc;border:1px solid var(--border);border-radius:12px;padding:18px;transition:all 0.2s;position:relative;cursor:pointer;" onmouseover="this.style.borderColor=\'rgba(59,130,246,0.4)\';this.style.background=\'rgba(59,130,246,0.04)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'#fafbfc\'" onclick="emEditTemplate(' + c.id + ')">';
    // Top row: icon + status + actions
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">';
    h += '<div style="font-size:28px;">' + icon + '</div>';
    h += '<div style="display:flex;gap:4px;align-items:center;" onclick="event.stopPropagation()">';
    h += '<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:' + statusColor + '20;color:' + statusColor + ';font-weight:600;">' + statusLabel + '</span>';
    h += '<button class="topbar-btn danger" style="font-size:9px;padding:3px 6px;" onclick="emDeleteCampaignFromTemplates(' + c.id + ')"><i class="fas fa-trash-alt"></i></button>';
    h += '</div></div>';
    // Name
    h += '<div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">' + c.name + '</div>';
    // Info
    h += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">' + (trigLabels[c.trigger_type] || 'Manual');
    if (emailSteps > 0) h += ' · ' + emailSteps + ' email' + (emailSteps !== 1 ? 's' : '');
    if (smsSteps > 0) h += ' · ' + smsSteps + ' SMS';
    h += '</div>';
    if (c.description) h += '<div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;line-height:1.4;">' + c.description + '</div>';
    // Step dots
    if (stepCount > 0) {
      h += '<div style="display:flex;gap:4px;">';
      (c.steps || []).forEach(function(s) {
        var dotColor = (s.step_type || 'email') === 'email' ? 'rgba(59,130,246,0.4)' : 'rgba(34,197,94,0.4)';
        h += '<div style="width:6px;height:6px;border-radius:50%;background:' + dotColor + ';" title="' + ((s.step_type || 'email') === 'email' ? 'Email' : 'SMS') + '"></div>';
      });
      h += '</div>';
    }
    h += '</div>';
  });
  h += '</div>';
  el.innerHTML = h;
}

function emDeleteCampaignFromTemplates(id) {
  if (!confirm('Delete this campaign and all its steps? This cannot be undone.')) return;
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_campaign', campaign_id: id })
  }).then(function() { emLoadTemplates(); emLoadCampaigns(); showToast('Campaign deleted'); });
}

function emToggleTplPreview(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function emOpenTemplateEditor() {
  document.getElementById('emTemplateEditor').style.display = 'block';
  document.getElementById('emTplEditorTitle').textContent = 'New Campaign';
  document.getElementById('emTplName').value = '';
  document.getElementById('emTplCategory').value = 'custom';
  document.getElementById('emCampTrigger').value = 'manual';
  document.getElementById('emCampDesc').value = '';
  document.getElementById('emTplEditId').value = '';
  document.getElementById('emCampEditId').value = '';
  emEditSteps = [];
  emRenderSteps();
}

function emCloseTemplateEditor() {
  document.getElementById('emTemplateEditor').style.display = 'none';
}

function emEditTemplate(id) {
  // Edit from template list — load the campaign data
  var c = emCampaigns.find(function(x) { return x.id === id; });
  if (!c) return;
  document.getElementById('emTemplateEditor').style.display = 'block';
  document.getElementById('emTplEditorTitle').textContent = 'Edit Campaign';
  document.getElementById('emTplName').value = c.name;
  document.getElementById('emTplCategory').value = c.category || 'custom';
  document.getElementById('emCampTrigger').value = c.trigger_type || 'manual';
  document.getElementById('emCampDesc').value = c.description || '';
  document.getElementById('emTplEditId').value = '';
  document.getElementById('emCampEditId').value = c.id;
  emEditSteps = (c.steps || []).map(function(s) {
    return {
      step_type: s.step_type || 'email',
      delay_days: s.delay_days,
      greeting: s.greeting || 'Hi',
      subject_override: s.subject_override || s.subject || '',
      body_override: s.body_override || '',
      sms_body: s.sms_body || '',
      template_id: s.template_id || null
    };
  });
  emRenderSteps();
  document.getElementById('emTemplateEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function emBuildStepsForSave() {
  // Prepend greeting to each email step body
  return emEditSteps.map(function(s, i) {
    var step = {
      step_type: s.step_type || 'email',
      step_order: i + 1,
      delay_days: s.delay_days || 0,
      template_id: null,
      subject_override: s.subject_override || '',
      body_override: s.body_override || '',
      sms_body: s.sms_body || '',
      greeting: s.greeting || 'Hi'
    };
    if (step.step_type === 'email' && step.body_override) {
      var greeting = s.greeting || 'Hi';
      var sep = (greeting === 'Happy Birthday' || greeting === 'Congratulations' || greeting === 'Happy Holidays') ? ', {{first_name}}!' : ', {{first_name}},';
      step.body_override = '<p>' + greeting + sep + '</p>\n' + step.body_override;
    }
    return step;
  });
}

function emSaveCampaignDraft() {
  var name = document.getElementById('emTplName').value.trim();
  if (!name) { showToast('Campaign name required'); return; }
  var editId = document.getElementById('emCampEditId').value;
  var campaign = {
    name: name,
    trigger_type: document.getElementById('emCampTrigger').value,
    description: document.getElementById('emCampDesc').value.trim(),
    category: document.getElementById('emTplCategory').value,
    status: 'draft',
    steps: emBuildStepsForSave()
  };
  if (editId) campaign.id = parseInt(editId);

  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_campaign', lo_user_id: localStorage.getItem('agent_edge_user') || 'default', campaign: campaign })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) {
      if (data.campaign_id) document.getElementById('emCampEditId').value = data.campaign_id;
      emLoadTemplates();
      emLoadCampaigns();
      showToast('Campaign draft saved!', 'success');
    } else { showToast('Error: ' + data.message); }
  });
}

function emPublishCampaign() {
  var name = document.getElementById('emTplName').value.trim();
  if (!name) { showToast('Campaign name required'); return; }
  if (emEditSteps.length === 0) { showToast('Add at least one step before publishing'); return; }
  var editId = document.getElementById('emCampEditId').value;
  var campaign = {
    name: name,
    trigger_type: document.getElementById('emCampTrigger').value,
    description: document.getElementById('emCampDesc').value.trim(),
    category: document.getElementById('emTplCategory').value,
    status: 'active',
    steps: emBuildStepsForSave()
  };
  if (editId) campaign.id = parseInt(editId);

  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_campaign', lo_user_id: localStorage.getItem('agent_edge_user') || 'default', campaign: campaign })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) {
      emCloseTemplateEditor();
      emLoadTemplates();
      emLoadCampaigns();
      showToast('Campaign published! It\'s now active in the Campaigns tab.', 'success');
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

// ===== VIDEO IN EMAIL =====
var emVideoTargetId = null; // tracks which textarea to insert into

function emExtractYouTubeId(url) {
  if (!url) return null;
  var m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function emOpenVideoModal(targetId) {
  // Auto-detect which textarea is active if not specified
  if (!targetId) {
    var composeOpen = document.getElementById('emComposeOverlay');
    if (composeOpen && composeOpen.style.display === 'flex') {
      targetId = 'emComposeBody';
    } else if (document.getElementById('emTemplateEditor').style.display !== 'none') {
      targetId = 'emTplBody';
    } else if (document.getElementById('emTemplates').style.display !== 'none') {
      targetId = 'emTplBody';
    }
  }
  emVideoTargetId = targetId;
  var info = document.getElementById('emVideoTargetInfo');
  if (info) {
    if (targetId === 'emComposeBody') info.textContent = 'Video will be inserted into your compose email.';
    else if (targetId === 'emTplBody') info.textContent = 'Video will be inserted into the template editor.';
    else info.textContent = 'Open a template editor or compose window first, then insert.';
  }
  document.getElementById('emVideoOverlay').style.display = 'flex';
}

function emCloseVideoModal() {
  document.getElementById('emVideoOverlay').style.display = 'none';
  document.getElementById('emVideoUrl').value = '';
  document.getElementById('emVideoPreview').style.display = 'none';
  emVideoTargetId = null;
}

function emVideoPreviewFn() {
  var url = document.getElementById('emVideoUrl').value.trim();
  var videoId = emExtractYouTubeId(url);
  if (!videoId) { showToast('Could not find a YouTube video ID in that URL'); return; }
  var thumb = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
  var inner = document.getElementById('emVideoPreviewInner');
  inner.innerHTML = '<div style="position:relative;display:inline-block;"><img src="' + thumb + '" style="width:400px;max-width:100%;border-radius:8px;display:block;">' +
    '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:68px;height:48px;background:rgba(255,0,0,0.85);border-radius:14px;display:flex;align-items:center;justify-content:center;">' +
    '<div style="width:0;height:0;border-style:solid;border-width:10px 0 10px 20px;border-color:transparent transparent transparent #fff;margin-left:4px;"></div></div></div>';
  document.getElementById('emVideoPreview').style.display = 'block';
}

function emInsertVideo() {
  var url = document.getElementById('emVideoUrl').value.trim();
  var videoId = emExtractYouTubeId(url);
  if (!videoId) { showToast('Could not find a YouTube video ID in that URL'); return; }
  if (!emVideoTargetId) { showToast('Open a template or compose window first'); return; }
  var textarea = document.getElementById(emVideoTargetId);
  if (!textarea) { showToast('Could not find the email body to insert into'); return; }
  var ytLink = 'https://www.youtube.com/watch?v=' + videoId;
  var thumb = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
  var videoHtml = '\n<div style="text-align:center;margin:20px 0;">' +
    '<a href="' + ytLink + '" target="_blank" style="display:inline-block;position:relative;text-decoration:none;">' +
    '<img src="' + thumb + '" alt="Watch Video" style="width:100%;max-width:560px;border-radius:10px;display:block;">' +
    '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:72px;height:50px;background:rgba(255,0,0,0.9);border-radius:14px;display:flex;align-items:center;justify-content:center;">' +
    '<div style="width:0;height:0;border-style:solid;border-width:12px 0 12px 22px;border-color:transparent transparent transparent #fff;margin-left:4px;"></div>' +
    '</div></a></div>\n';
  var pos = textarea.selectionStart || textarea.value.length;
  textarea.value = textarea.value.substring(0, pos) + videoHtml + textarea.value.substring(pos);
  emCloseVideoModal();
  showToast('Video thumbnail inserted!');
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
var emAiTargetStepIdx = null;

function emAiDraft() {
  emAiTargetStepIdx = null;
  document.getElementById('emAiOverlay').style.display = 'flex';
  document.getElementById('emAiPrompt').value = '';
  document.getElementById('emAiResult').textContent = '';
}

function emAiDraftForStep(stepIdx) {
  emAiTargetStepIdx = stepIdx;
  document.getElementById('emAiOverlay').style.display = 'flex';
  document.getElementById('emAiPrompt').value = '';
  document.getElementById('emAiResult').textContent = '';
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
      if (emAiTargetStepIdx !== null) {
        // Insert into step body
        var textarea = document.getElementById('emStepBody_' + emAiTargetStepIdx);
        if (textarea) {
          textarea.value = data.body_html;
          emEditSteps[emAiTargetStepIdx].body_override = data.body_html;
        }
        if (data.subject) {
          emEditSteps[emAiTargetStepIdx].subject_override = data.subject;
          emRenderSteps();
        }
        var rewriteBar = document.getElementById('emStepRewrite_' + emAiTargetStepIdx);
        if (rewriteBar) rewriteBar.style.display = 'block';
      } else {
        // Fallback for compose body
        var tplBody = document.getElementById('emTplBody');
        if (tplBody) tplBody.value = data.body_html;
      }
      emAiClose();
      showToast('AI draft ready — edit or re-write below', 'success');
    } else {
      document.getElementById('emAiResult').textContent = 'Failed: ' + (data.message || 'Try again');
    }
  }).catch(function() {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Generate';
    document.getElementById('emAiResult').textContent = 'Error connecting to AI';
  });
}

function emAiRewriteStep(stepIdx) {
  var extra = document.getElementById('emStepExtra_' + stepIdx);
  var statusEl = document.getElementById('emStepRewriteStatus_' + stepIdx);
  if (!extra || !extra.value.trim()) { if (statusEl) statusEl.textContent = 'Add directions for the re-write'; return; }
  var currentBody = emEditSteps[stepIdx].body_override || '';
  var originalPrompt = document.getElementById('emAiPrompt').value.trim();
  var tone = document.getElementById('emAiTone').value;
  if (statusEl) statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Re-writing...';

  var rewritePrompt = (originalPrompt ? 'Original request: ' + originalPrompt + '\n\n' : '') + 'Current draft:\n' + currentBody + '\n\nRevision instructions: ' + extra.value.trim();

  fetch(API_BASE + '/ai-email-writer', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: rewritePrompt, tone: tone })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success && data.body_html) {
      var textarea = document.getElementById('emStepBody_' + stepIdx);
      if (textarea) {
        textarea.value = data.body_html;
        emEditSteps[stepIdx].body_override = data.body_html;
      }
      if (data.subject) emEditSteps[stepIdx].subject_override = data.subject;
      extra.value = '';
      if (statusEl) statusEl.innerHTML = '<span style="color:#22c55e;">Re-write complete.</span>';
    } else {
      if (statusEl) statusEl.textContent = 'Failed: ' + (data.message || 'Try again');
    }
  }).catch(function() {
    if (statusEl) statusEl.textContent = 'Error connecting to AI';
  });
}

function emAiRewrite() {
  // Legacy — kept for compose modal compatibility
  emAiRewriteStep(emAiTargetStepIdx !== null ? emAiTargetStepIdx : 0);
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
  document.getElementById('emComposeTo').value = (audSelected && audSelected.length > 0) ? audSelected.join(', ') : '';
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

  var recipients = to.split(',').map(function(e) { return e.trim(); }).filter(function(e) { return e; });
  result.style.color = 'var(--text-muted)';
  result.textContent = recipients.length > 1 ? 'Sending to ' + recipients.length + ' contacts...' : 'Sending...';

  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'send_now', lo_user_id: localStorage.getItem('agent_edge_user') || 'default', to: to, subject: subject, body_html: body })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) {
      if (data.sent > 1) {
        result.style.color = '#22c55e'; result.textContent = '✓ Sent to ' + data.sent + ' of ' + data.total + ' contacts';
      } else {
        result.style.color = '#22c55e'; result.textContent = '✓ Sent!';
      }
      audSelected = [];
      emPerfLoaded = {};
      setTimeout(function() { emCloseCompose(); emLoadDashboard(); }, 1500);
    } else {
      result.style.color = '#ef4444'; result.textContent = 'Failed: ' + (data.message || 'Unknown');
    }
  }).catch(function(err) { result.style.color = '#ef4444'; result.textContent = 'Error'; });
}

// Keep old function name working for CRM cards
function openComposeEmail() { emOpenCompose(); }


// ===== AUDIENCES =====
var audContacts = [];
var audSelected = [];
var audGroups = [];
var audSearchTimer = null;

function audSearchDebounce() {
  if (audSearchTimer) clearTimeout(audSearchTimer);
  audSearchTimer = setTimeout(audSearch, 400);
}

function audSearch() {
  var params = [];
  var type = document.getElementById('audFilterType').value;
  var source = document.getElementById('audFilterSource').value;
  var state = document.getElementById('audFilterState').value.trim();
  var zip = document.getElementById('audFilterZip').value.trim();
  var city = document.getElementById('audFilterCity').value.trim();
  var company = document.getElementById('audFilterCompany').value.trim();
  var q = document.getElementById('audFilterSearch').value.trim();

  if (type && type !== 'all') params.push('root_type=' + encodeURIComponent(type));
  if (source && source !== 'all') params.push('source=' + encodeURIComponent(source));
  if (state) params.push('state=' + encodeURIComponent(state));
  if (zip) params.push('zip=' + encodeURIComponent(zip));
  if (city) params.push('city=' + encodeURIComponent(city));
  if (company) params.push('company=' + encodeURIComponent(company));
  if (q) params.push('q=' + encodeURIComponent(q));

  // If "All Types" or "All Sources" selected, that means show everything (no type/source filter)
  // but still run the search
  var hasAnyInput = type || source || state || zip || city || company || q;

  if (!hasAnyInput) {
    document.getElementById('audResults').innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:20px;text-align:center;">Select a filter or enter a search term.</div>';
    document.getElementById('audResultCount').textContent = '—';
    return;
  }

  // If the only selections are "all" with no other filters, fetch everything
  if (params.length === 0) {
    // No actual filter params but user picked All Types or All Sources — fetch all
  }

  document.getElementById('audResults').innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:20px;text-align:center;"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

  fetch(API_BASE + '/crm-api?' + params.join('&'))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      audContacts = (data.contacts || []).filter(function(c) { return c.email; });
      audSelected = [];
      document.getElementById('audSelectAll').checked = false;
      audUpdateSelectedCount();
      audRenderResults();
    })
    .catch(function() {
      document.getElementById('audResults').innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:20px;text-align:center;">Search failed.</div>';
    });
}

function audRenderResults() {
  var el = document.getElementById('audResults');
  var count = audContacts.length;
  document.getElementById('audResultCount').textContent = count + ' FOUND';

  if (count === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:20px;text-align:center;">No contacts match those filters.</div>';
    return;
  }

  var h = '';
  audContacts.forEach(function(c, i) {
    var name = c.name || ((c.first_name || '') + ' ' + (c.last_name || '')).trim() || c.email;
    var email = c.email || '';
    var isSelected = audSelected.indexOf(email.toLowerCase()) >= 0;
    var meta = [];
    if (c.company) meta.push(c.company);
    if (c.city && c.state) meta.push(c.city + ', ' + c.state);
    else if (c.state) meta.push(c.state);
    if (c.zip) meta.push(c.zip);

    h += '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;cursor:pointer;' + (isSelected ? 'background:rgba(110,127,119,0.08);' : '') + '" onclick="audToggleContact(\'' + email.replace(/'/g, "\\'") + '\')" onmouseover="if(!this.style.background||this.style.background===\'none\')this.style.background=\'rgba(0,0,0,0.02)\'" onmouseout="if(' + (!isSelected ? 'true' : 'false') + ')this.style.background=\'none\'">';
    h += '<input type="checkbox" ' + (isSelected ? 'checked' : '') + ' style="width:15px;height:15px;pointer-events:none;">';
    h += '<div style="flex:1;min-width:0;">';
    h += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>';
    h += '<div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + email + (meta.length ? ' · ' + meta.join(' · ') : '') + '</div>';
    h += '</div>';
    h += '<div style="font-size:10px;padding:2px 8px;border-radius:4px;background:rgba(110,127,119,0.08);color:var(--text-muted);">' + (c.root_type || c.type || 'other') + '</div>';
    h += '</div>';
  });
  el.innerHTML = h;
}

function audToggleContact(email) {
  var lower = email.toLowerCase();
  var idx = audSelected.indexOf(lower);
  if (idx >= 0) audSelected.splice(idx, 1);
  else audSelected.push(lower);
  audUpdateSelectedCount();
  audRenderResults();
}

function audToggleAll(checked) {
  if (checked) {
    audSelected = audContacts.filter(function(c) { return c.email; }).map(function(c) { return c.email.toLowerCase(); });
  } else {
    audSelected = [];
  }
  audUpdateSelectedCount();
  audRenderResults();
}

function audUpdateSelectedCount() {
  var n = audSelected.length;
  document.getElementById('audSelectedCount').textContent = n + ' selected';
  document.getElementById('audSaveBtn').disabled = n === 0;
  document.getElementById('audComposeBtn').disabled = n === 0;
  document.getElementById('audEnrollBtn').disabled = n === 0;
}

function audClearFilters() {
  document.getElementById('audFilterType').value = '';
  document.getElementById('audFilterSource').value = '';
  document.getElementById('audFilterState').value = '';
  document.getElementById('audFilterZip').value = '';
  document.getElementById('audFilterCity').value = '';
  document.getElementById('audFilterCompany').value = '';
  document.getElementById('audFilterSearch').value = '';
  audContacts = [];
  audSelected = [];
  document.getElementById('audSelectAll').checked = false;
  audUpdateSelectedCount();
  document.getElementById('audResults').innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:20px;text-align:center;">Use the filters above to find contacts.</div>';
  document.getElementById('audResultCount').textContent = '—';
}

// ===== SAVED GROUPS =====
function audLoadGroups() {
  fetch(API_BASE + '/crm-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'listGroups' })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    audGroups = data.groups || [];
    document.getElementById('audGroupCount').textContent = audGroups.length + ' GROUP' + (audGroups.length !== 1 ? 'S' : '');
    var el = document.getElementById('audGroupList');
    if (audGroups.length === 0) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:16px;text-align:center;">No saved groups yet. Search for contacts and save a group.</div>';
      return;
    }
    var h = '';
    audGroups.forEach(function(g) {
      h += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background=\'rgba(0,0,0,0.02)\'" onmouseout="this.style.background=\'none\'">';
      h += '<div style="width:36px;height:36px;border-radius:8px;background:rgba(110,127,119,0.1);display:flex;align-items:center;justify-content:center;font-size:14px;color:#6e7f77;"><i class="fas fa-users"></i></div>';
      h += '<div style="flex:1;min-width:0;" onclick="audLoadGroup(\'' + g.id + '\')">';
      h += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);">' + g.name + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted);">' + (g.contact_count || 0) + ' contacts</div>';
      h += '</div>';
      h += '<button class="topbar-btn" onclick="event.stopPropagation();audEnrollGroup(\'' + g.id + '\')" style="font-size:10px;padding:4px 10px;"><i class="fas fa-paper-plane"></i> Enroll</button>';
      h += '<button class="topbar-btn" onclick="event.stopPropagation();audDeleteGroup(\'' + g.id + '\')" style="font-size:10px;padding:4px 8px;border-color:rgba(220,38,38,0.2);color:rgba(220,38,38,0.5);"><i class="fas fa-trash"></i></button>';
      h += '</div>';
    });
    el.innerHTML = h;
  })
  .catch(function() {
    document.getElementById('audGroupList').innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:16px;text-align:center;">Failed to load groups.</div>';
  });
}

function audSaveGroup() {
  if (audSelected.length === 0) { showToast('Select contacts first'); return; }
  var name = prompt('Name this group:');
  if (!name) return;

  // Build filters object from current filter state
  var filters = {
    type: document.getElementById('audFilterType').value,
    source: document.getElementById('audFilterSource').value,
    state: document.getElementById('audFilterState').value.trim(),
    zip: document.getElementById('audFilterZip').value.trim(),
    city: document.getElementById('audFilterCity').value.trim(),
    company: document.getElementById('audFilterCompany').value.trim(),
    q: document.getElementById('audFilterSearch').value.trim(),
    emails: audSelected.slice()
  };

  fetch(API_BASE + '/crm-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveGroup', group: { name: name, filters: filters, contact_count: audSelected.length } })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      showToast('Group "' + name + '" saved with ' + audSelected.length + ' contacts');
      audLoadGroups();
    }
  })
  .catch(function() { showToast('Failed to save group'); });
}

function audDeleteGroup(id) {
  if (!confirm('Delete this group?')) return;
  fetch(API_BASE + '/crm-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteGroup', groupId: id })
  })
  .then(function(r) { return r.json(); })
  .then(function() { showToast('Group deleted'); audLoadGroups(); })
  .catch(function() { showToast('Failed to delete'); });
}

function audLoadGroup(id) {
  var group = audGroups.find(function(g) { return g.id === id; });
  if (!group || !group.filters) return;
  var f = group.filters;

  // Restore filters
  document.getElementById('audFilterType').value = f.type || '';
  document.getElementById('audFilterSource').value = f.source || '';
  document.getElementById('audFilterState').value = f.state || '';
  document.getElementById('audFilterZip').value = f.zip || '';
  document.getElementById('audFilterCity').value = f.city || '';
  document.getElementById('audFilterCompany').value = f.company || '';
  document.getElementById('audFilterSearch').value = f.q || '';

  // If group has stored emails, use those directly
  if (f.emails && f.emails.length > 0) {
    // Re-run the search to get current contact data, then pre-select the stored emails
    audSearch();
    setTimeout(function() {
      audSelected = f.emails.slice();
      audUpdateSelectedCount();
      audRenderResults();
    }, 1000);
  } else {
    audSearch();
  }
  showToast('Loaded group: ' + group.name);
}

function audEnrollGroup(id) {
  var group = audGroups.find(function(g) { return g.id === id; });
  if (!group || !group.filters || !group.filters.emails) { showToast('Group has no contacts'); return; }

  // Load the group's emails into selection, then prompt for campaign
  audSelected = group.filters.emails.slice();
  audUpdateSelectedCount();
  audEnrollSelected();
}

function audEnrollSelected() {
  if (audSelected.length === 0) { showToast('Select contacts first'); return; }

  // Build campaign selection
  var loUser = localStorage.getItem('agent_edge_user') || 'default';
  fetch(API_BASE + '/email-center', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_campaigns', lo_user_id: loUser })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    var campaigns = (data.campaigns || []).filter(function(c) { return c.status === 'active'; });
    if (campaigns.length === 0) {
      showToast('No active campaigns. Create a campaign first.');
      return;
    }
    var names = campaigns.map(function(c, i) { return (i + 1) + '. ' + c.name; }).join('\n');
    var choice = prompt('Select a campaign to enroll ' + audSelected.length + ' contacts:\n\n' + names + '\n\nEnter the number:');
    if (!choice) return;
    var idx = parseInt(choice) - 1;
    if (isNaN(idx) || idx < 0 || idx >= campaigns.length) { showToast('Invalid selection'); return; }

    var campaign = campaigns[idx];
    var enrolled = 0;
    var promises = [];

    // Get contact names from audContacts
    var contactMap = {};
    audContacts.forEach(function(c) {
      if (c.email) contactMap[c.email.toLowerCase()] = c.name || ((c.first_name || '') + ' ' + (c.last_name || '')).trim() || c.email;
    });

    audSelected.forEach(function(email) {
      var name = contactMap[email] || email;
      var p = fetch(API_BASE + '/email-center', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll', campaign_id: campaign.id, contact_email: email, contact_name: name, lo_user_id: loUser })
      }).then(function() { enrolled++; }).catch(function() {});
      promises.push(p);
    });

    Promise.all(promises).then(function() {
      showToast('Enrolled ' + enrolled + ' contacts into "' + campaign.name + '"');
    });
  })
  .catch(function() { showToast('Failed to load campaigns'); });
}
