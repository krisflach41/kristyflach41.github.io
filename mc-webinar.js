// mc-webinar.js — Webinar Seminars launcher for Mission Control
var API_BASE_WB = 'https://agent-edge-backend.vercel.app/api';
var wbWebinars = [];

function wbOpenCreate() {
  document.getElementById('wbCreateForm').style.display = 'block';
  document.getElementById('wbList').style.display = 'none';
  document.getElementById('wbFormTitle').textContent = 'New Webinar';
  document.getElementById('wbTitle').value = '';
  document.getElementById('wbCity').value = '';
  document.getElementById('wbDate').value = '';
  document.getElementById('wbTime').value = '19:00';
  document.getElementById('wbTimezone').value = 'America/New_York';
  document.getElementById('wbZoomLink').value = 'https://us06web.zoom.us/j/7080198417?pwd=G2WOlqyTeDUhaUaujzfwxD165yFdn1.1';
  document.getElementById('wbBookingLink').value = '';
  document.getElementById('wbHeadline').value = '';
  document.getElementById('wbSubheadline').value = '';
  document.getElementById('wbExpectText').value = '';
  document.getElementById('wbSpeakerBio').value = '';
  document.getElementById('wbEditId').value = '';
}

function wbCloseCreate() {
  document.getElementById('wbCreateForm').style.display = 'none';
  document.getElementById('wbList').style.display = 'block';
}

function wbEditWebinar(id) {
  var w = wbWebinars.find(function(x) { return x.id === id; });
  if (!w) return;
  document.getElementById('wbCreateForm').style.display = 'block';
  document.getElementById('wbList').style.display = 'none';
  document.getElementById('wbFormTitle').textContent = 'Edit Webinar';
  document.getElementById('wbTitle').value = w.title || '';
  document.getElementById('wbCity').value = w.city || '';
  document.getElementById('wbDate').value = w.webinar_date || '';
  document.getElementById('wbTime').value = w.webinar_time || '19:00';
  document.getElementById('wbTimezone').value = w.timezone || 'America/New_York';
  document.getElementById('wbZoomLink').value = w.zoom_link || '';
  document.getElementById('wbBookingLink').value = w.booking_link || '';
  document.getElementById('wbHeadline').value = w.headline || '';
  document.getElementById('wbSubheadline').value = w.subheadline || '';
  document.getElementById('wbExpectText').value = w.expect_text || '';
  document.getElementById('wbSpeakerBio').value = w.speaker_bio || '';
  document.getElementById('wbEditId').value = w.id;
}

function wbGatherForm() {
  var title = document.getElementById('wbTitle').value.trim();
  if (!title) { showToast('Webinar title is required'); return null; }
  var date = document.getElementById('wbDate').value;
  if (!date) { showToast('Webinar date is required'); return null; }
  var city = document.getElementById('wbCity').value.trim();
  if (!city) { showToast('Target city is required'); return null; }

  // Generate slug from title
  var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Build pretty date for display
  var dateObj = new Date(date + 'T12:00:00');
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var timeVal = document.getElementById('wbTime').value || '19:00';
  var timeParts = timeVal.split(':');
  var hr = parseInt(timeParts[0]);
  var min = timeParts[1] || '00';
  var ampm = hr >= 12 ? 'PM' : 'AM';
  var hr12 = hr > 12 ? hr - 12 : (hr === 0 ? 12 : hr);
  var prettyDate = days[dateObj.getDay()] + ', ' + months[dateObj.getMonth()] + ' ' + dateObj.getDate() + ' at ' + hr12 + ':' + min + ' ' + ampm;

  // Build formatted date for countdown (ISO-like)
  var formattedDateTime = date + 'T' + timeVal + ':00';

  var tz = document.getElementById('wbTimezone').value;
  var tzAbbr = { 'America/New_York': 'ET', 'America/Chicago': 'CT', 'America/Denver': 'MT', 'America/Los_Angeles': 'PT' };

  return {
    title: title,
    city: city,
    slug: slug,
    webinar_date: date,
    webinar_time: timeVal,
    timezone: tz,
    timezone_abbr: tzAbbr[tz] || 'ET',
    pretty_date: prettyDate,
    formatted_datetime: formattedDateTime,
    zoom_link: document.getElementById('wbZoomLink').value.trim(),
    booking_link: 'https://kristyflach.com/landing/' + slug + '/book',
    headline: document.getElementById('wbHeadline').value.trim(),
    subheadline: document.getElementById('wbSubheadline').value.trim(),
    expect_text: document.getElementById('wbExpectText').value.trim(),
    speaker_bio: document.getElementById('wbSpeakerBio').value.trim(),
    host_name: 'Kristy Flach',
    host_email: 'kflach@prmg.net',
    host_phone: '(206) 313-5883',
    lo_user_id: localStorage.getItem('agent_edge_user') || 'default'
  };
}

function wbSaveDraft() {
  var data = wbGatherForm();
  if (!data) return;
  data.status = 'draft';
  var editId = document.getElementById('wbEditId').value;
  if (editId) data.id = parseInt(editId);

  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_webinar', webinar: data })
  }).then(function(r) { return r.json(); }).then(function(res) {
    if (res.success) {
      wbCloseCreate();
      wbLoadWebinars();
      showToast('Webinar draft saved!', 'success');
    } else { showToast('Error: ' + (res.message || 'Save failed')); }
  }).catch(function(e) { showToast('Error saving webinar'); });
}

function wbPublish() {
  var data = wbGatherForm();
  if (!data) return;
  if (!data.headline) { showToast('Headline is required to publish'); return; }
  data.status = 'published';
  var editId = document.getElementById('wbEditId').value;
  if (editId) data.id = parseInt(editId);

  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_webinar', webinar: data })
  }).then(function(r) { return r.json(); }).then(function(res) {
    if (res.success) {
      // Update booking link with ID
      document.getElementById('wbBookingLink').value = data.booking_link;
      wbCloseCreate();
      wbLoadWebinars();
      showToast('Webinar published! Landing pages are live.', 'success');
    } else { showToast('Error: ' + (res.message || 'Publish failed')); }
  }).catch(function(e) { showToast('Error publishing webinar'); });
}

function wbLoadWebinars() {
  var loUser = localStorage.getItem('agent_edge_user') || 'default';
  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_webinars', lo_user_id: loUser })
  }).then(function(r) { return r.json(); }).then(function(res) {
    wbWebinars = res.webinars || [];
    wbRenderList();
  }).catch(function() {
    document.getElementById('wbList').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:12px;">Could not load webinars</div>';
  });
}

function wbRenderList() {
  var el = document.getElementById('wbList');
  if (wbWebinars.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);"><i class="fas fa-broadcast-tower" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.2;"></i><div style="font-size:14px;margin-bottom:4px;">No webinars yet</div><div style="font-size:12px;">Click "+ New Webinar" to create your first webinar funnel</div></div>';
    return;
  }

  var upcoming = wbWebinars.filter(function(w) { return w.status === 'published' && new Date(w.webinar_date) >= new Date(new Date().toDateString()); });
  var drafts = wbWebinars.filter(function(w) { return w.status === 'draft'; });
  var past = wbWebinars.filter(function(w) { return w.status === 'published' && new Date(w.webinar_date) < new Date(new Date().toDateString()); });

  var h = '';

  if (upcoming.length > 0) {
    h += '<div style="font-size:11px;font-weight:700;color:#6e7f77;letter-spacing:0.5px;margin-bottom:10px;"><i class="fas fa-circle" style="font-size:6px;vertical-align:middle;margin-right:4px;"></i> UPCOMING</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-bottom:24px;">';
    upcoming.forEach(function(w) { h += wbCard(w, 'upcoming'); });
    h += '</div>';
  }

  if (drafts.length > 0) {
    h += '<div style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;margin-bottom:10px;"><i class="fas fa-file-alt" style="font-size:9px;vertical-align:middle;margin-right:4px;"></i> DRAFTS</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-bottom:24px;">';
    drafts.forEach(function(w) { h += wbCard(w, 'draft'); });
    h += '</div>';
  }

  if (past.length > 0) {
    h += '<div style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;margin-bottom:10px;"><i class="fas fa-history" style="font-size:9px;vertical-align:middle;margin-right:4px;"></i> PAST</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-bottom:24px;">';
    past.forEach(function(w) { h += wbCard(w, 'past'); });
    h += '</div>';
  }

  el.innerHTML = h;
}

function wbCard(w, type) {
  var statusColor = type === 'upcoming' ? '#6e7f77' : type === 'draft' ? 'var(--text-muted)' : '#999';
  var statusLabel = type === 'upcoming' ? 'Live' : type === 'draft' ? 'Draft' : 'Completed';
  var regCount = w.registered_count || 0;
  var attendedCount = w.attended_count || 0;

  var h = '<div style="background:#fafbfc;border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:all 0.2s;" onmouseover="this.style.borderColor=\'rgba(110,127,119,0.4)\'" onmouseout="this.style.borderColor=\'var(--border)\'">';

  // Top banner
  h += '<div style="background:' + (type === 'upcoming' ? 'rgba(110,127,119,0.15)' : type === 'draft' ? '#f0f0f0' : '#eee') + ';padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">';
  h += '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:' + statusColor + '20;color:' + statusColor + ';font-weight:600;">' + statusLabel + '</span>';
  if (type === 'upcoming') {
    h += '<span style="font-size:10px;color:#6e7f77;font-weight:600;">' + regCount + ' registered</span>';
  } else if (type === 'past') {
    h += '<span style="font-size:10px;color:var(--text-muted);">' + attendedCount + ' attended · ' + regCount + ' registered</span>';
  }
  h += '</div>';

  // Body
  h += '<div style="padding:16px;">';
  h += '<div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">' + w.title + '</div>';
  h += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">' + (w.pretty_date || w.webinar_date || '') + ' · ' + (w.city || '') + '</div>';

  // Links (only for published)
  if (type === 'upcoming' || type === 'past') {
    h += '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">';
    h += '<a href="https://kristyflach.com/landing/' + w.slug + '" target="_blank" style="font-size:10px;color:#6e7f77;text-decoration:none;padding:2px 6px;border:1px solid rgba(110,127,119,0.3);border-radius:4px;"><i class="fas fa-external-link-alt" style="margin-right:3px;"></i>Registration</a>';
    h += '<a href="https://kristyflach.com/landing/' + w.slug + '/join" target="_blank" style="font-size:10px;color:#6e7f77;text-decoration:none;padding:2px 6px;border:1px solid rgba(110,127,119,0.3);border-radius:4px;"><i class="fas fa-video" style="margin-right:3px;"></i>Join Page</a>';
    h += '<a href="https://kristyflach.com/landing/' + w.slug + '/book" target="_blank" style="font-size:10px;color:#6e7f77;text-decoration:none;padding:2px 6px;border:1px solid rgba(110,127,119,0.3);border-radius:4px;"><i class="fas fa-calendar-check" style="margin-right:3px;"></i>Booking</a>';
    h += '<a href="https://kristyflach.com/landing/' + w.slug + '/replay" target="_blank" style="font-size:10px;color:#6e7f77;text-decoration:none;padding:2px 6px;border:1px solid rgba(110,127,119,0.3);border-radius:4px;"><i class="fas fa-play-circle" style="margin-right:3px;"></i>Replay</a>';
    h += '</div>';
  }

  // Action buttons
  h += '<div style="display:flex;gap:6px;">';
  h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="wbEditWebinar(' + w.id + ')"><i class="fas fa-edit"></i> Edit</button>';
  if (type === 'upcoming') {
    h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="wbCopyLink(\'' + w.slug + '\')"><i class="fas fa-copy"></i> Copy Reg Link</button>';
    h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;background:rgba(110,127,119,0.15);color:#6e7f77;border-color:rgba(110,127,119,0.4);font-weight:700;" onclick="wbCopyBookingLink(\'' + w.slug + '\')"><i class="fas fa-calendar-check"></i> Copy Booking Link</button>';
  }
  h += '<button class="topbar-btn danger" style="font-size:10px;padding:4px 8px;" onclick="wbDeleteWebinar(' + w.id + ')"><i class="fas fa-trash-alt"></i></button>';
  h += '</div>';

  h += '</div></div>';
  return h;
}

function wbCopyLink(slug) {
  var url = 'https://kristyflach.com/landing/' + slug;
  navigator.clipboard.writeText(url).then(function() {
    showToast('Registration link copied!', 'success');
  }).catch(function() {
    showToast('Copy failed — link: ' + url);
  });
}

function wbCopyBookingLink(slug) {
  var url = 'https://kristyflach.com/landing/' + slug + '/book';
  navigator.clipboard.writeText(url).then(function() {
    showToast('Booking link copied!', 'success');
  }).catch(function() {
    showToast('Copy failed — link: ' + url);
  });
}

function wbDeleteWebinar(id) {
  if (!confirm('Delete this webinar and all its pages? This cannot be undone.')) return;
  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_webinar', webinar_id: id })
  }).then(function() { wbLoadWebinars(); showToast('Webinar deleted'); });
}

// ===== WEBINAR PIPELINE =====
var wpRegistrants = [];
var wpCurrentDetail = null;
var wpDragId = null;

var wpStages = [
  { id: 'registered', title: 'REGISTERED' },
  { id: 'abandoned', title: 'ABANDONED' },
  { id: 'did_not_attend', title: 'DID NOT ATTEND' },
  { id: 'attended', title: 'ATTENDED' },
  { id: 'attended_no_book', title: 'ATTENDED & DID NOT BOOK' },
  { id: 'attended_booked', title: 'ATTENDED & BOOKED' },
  { id: 'appointment_conducted', title: 'APPOINTMENT CONDUCTED' }
];

function wpInit() {
  // Load webinar list into the filter dropdown
  var loUser = localStorage.getItem('agent_edge_user') || 'default';
  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_webinars', lo_user_id: loUser })
  }).then(function(r) { return r.json(); }).then(function(res) {
    var sel = document.getElementById('wpWebinarFilter');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select a webinar...</option>';
    (res.webinars || []).forEach(function(w) {
      sel.innerHTML += '<option value="' + w.id + '">' + w.title + ' (' + (w.pretty_date || w.webinar_date || '') + ')</option>';
    });
  });
}

function wpLoadRegistrants() {
  var webinarId = document.getElementById('wpWebinarFilter').value;
  var board = document.getElementById('wpBoard');
  var empty = document.getElementById('wpEmpty');
  if (!webinarId) {
    board.innerHTML = '';
    board.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  board.style.display = 'flex';

  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_registrants', webinar_id: parseInt(webinarId) })
  }).then(function(r) { return r.json(); }).then(function(res) {
    wpRegistrants = res.registrants || [];
    wpRenderBoard();
  }).catch(function() {
    board.innerHTML = '<div style="padding:40px;color:var(--text-muted);text-align:center;">Error loading registrants</div>';
  });
}

function wpRenderBoard() {
  var board = document.getElementById('wpBoard');
  board.innerHTML = '';

  wpStages.forEach(function(stage) {
    var stageRegs = wpRegistrants.filter(function(r) { return (r.pipeline_stage || 'registered') === stage.id; });
    var col = document.createElement('div');
    col.className = 'wp-col';

    var header = '<div class="wp-col-header">' + stage.title + ' <span class="wp-col-count">' + stageRegs.length + '</span></div>';
    var body = document.createElement('div');
    body.className = 'wp-col-body';
    body.dataset.stage = stage.id;

    // Drag drop
    body.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drop-highlight'); });
    body.addEventListener('dragleave', function() { this.classList.remove('drop-highlight'); });
    body.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drop-highlight');
      var newStage = this.dataset.stage;
      if (wpDragId && newStage) {
        wpUpdateStage(wpDragId, newStage);
      }
    });

    stageRegs.forEach(function(r) {
      var card = document.createElement('div');
      card.className = 'wp-card';
      card.draggable = true;
      card.addEventListener('dragstart', function() { wpDragId = r.id; });
      card.addEventListener('dragend', function() { wpDragId = null; });
      card.onclick = function() { wpOpenDetail(r.id); };

      var name = ((r.first_name || '') + ' ' + (r.last_name || '')).trim() || r.email;
      var dateStr = r.registered_at ? new Date(r.registered_at).toLocaleDateString() : '';
      var h = '<div class="wp-card-name">' + name + '</div>';
      h += '<div class="wp-card-email">' + (r.email || '') + '</div>';
      h += '<div class="wp-card-phone">' + (r.phone || '') + '</div>';
      h += '<div class="wp-card-date">' + dateStr + '</div>';
      if (r.crm_id) h += '<div class="wp-card-crm">CRM</div>';
      card.innerHTML = h;
      body.appendChild(card);
    });

    col.innerHTML = header;
    col.appendChild(body);
    board.appendChild(col);
  });
}

function wpUpdateStage(regId, newStage) {
  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_stage', registrant_id: regId, stage: newStage })
  }).then(function(r) { return r.json(); }).then(function(res) {
    if (res.success) {
      var reg = wpRegistrants.find(function(r) { return r.id === regId; });
      if (reg) reg.pipeline_stage = newStage;
      wpRenderBoard();
    }
  });
}

function wpOpenDetail(regId) {
  var r = wpRegistrants.find(function(x) { return x.id === regId; });
  if (!r) return;
  wpCurrentDetail = r;
  document.getElementById('wpDetailId').value = r.id;
  document.getElementById('wpDetailName').textContent = ((r.first_name || '') + ' ' + (r.last_name || '')).trim() || r.email;
  document.getElementById('wpDetailEmail').textContent = r.email || '—';
  document.getElementById('wpDetailPhone').textContent = r.phone || '—';
  document.getElementById('wpDetailDate').textContent = r.registered_at ? new Date(r.registered_at).toLocaleString() : '—';
  var stageLabel = wpStages.find(function(s) { return s.id === (r.pipeline_stage || 'registered'); });
  document.getElementById('wpDetailStage').textContent = stageLabel ? stageLabel.title : r.pipeline_stage;
  document.getElementById('wpDetailNotes').value = r.notes || '';
  document.getElementById('wpActionMenu').style.display = 'none';

  // Update CRM button state
  var crmBtn = document.getElementById('wpCrmBtn');
  if (r.crm_id) {
    crmBtn.textContent = 'View CRM Card';
    crmBtn.onclick = function() { switchView('crm'); /* TODO: open specific card */ };
  } else {
    crmBtn.textContent = 'Create CRM Card';
    crmBtn.onclick = wpCreateCRM;
  }

  document.getElementById('wpDetailOverlay').style.display = 'flex';
}

function wpCloseDetail() {
  document.getElementById('wpDetailOverlay').style.display = 'none';
  wpCurrentDetail = null;
}

function wpToggleActions() {
  var menu = document.getElementById('wpActionMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function wpSaveNotes() {
  if (!wpCurrentDetail) return;
  var notes = document.getElementById('wpDetailNotes').value;
  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_notes', registrant_id: wpCurrentDetail.id, notes: notes })
  }).then(function(r) { return r.json(); }).then(function(res) {
    if (res.success) {
      wpCurrentDetail.notes = notes;
      showToast('Notes saved', 'success');
    }
  });
}

function wpCreateCRM() {
  if (!wpCurrentDetail) return;
  var r = wpCurrentDetail;
  document.getElementById('wpActionMenu').style.display = 'none';

  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create_crm_from_registrant',
      registrant_id: r.id,
      lo_user_id: localStorage.getItem('agent_edge_user') || 'default'
    })
  }).then(function(res) { return res.json(); }).then(function(data) {
    if (data.success) {
      r.crm_id = data.crm_id;
      showToast('CRM card created!', 'success');
      wpRenderBoard();
      wpOpenDetail(r.id);
    } else {
      showToast('Error: ' + (data.message || 'Could not create CRM card'));
    }
  });
}

function wpMoveToLoan(stage) {
  if (!wpCurrentDetail) return;
  var r = wpCurrentDetail;
  document.getElementById('wpActionMenu').style.display = 'none';

  // Create CRM card first if not exists
  var createFirst = !r.crm_id;
  var proceed = function(crmId) {
    fetch(API_BASE_WB + '/webinar-api', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'move_to_loan_pipeline',
        registrant_id: r.id,
        crm_id: crmId,
        pipeline_stage: stage,
        lo_user_id: localStorage.getItem('agent_edge_user') || 'default'
      })
    }).then(function(res) { return res.json(); }).then(function(data) {
      if (data.success) {
        var stageNames = { warm:'Warm Leads', active:'Active Conversations', credit:'Credit Repair', preapproval:'Started Pre-Approval', preapproved:'Approved', ratewatch:'Rate Watch', underwriting:'Underwriting' };
        showToast('Moved to ' + (stageNames[stage] || stage) + '!', 'success');
        wpCloseDetail();
        wpLoadRegistrants();
      } else {
        showToast('Error: ' + (data.message || 'Could not move to pipeline'));
      }
    });
  };

  if (createFirst) {
    fetch(API_BASE_WB + '/webinar-api', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_crm_from_registrant', registrant_id: r.id, lo_user_id: localStorage.getItem('agent_edge_user') || 'default' })
    }).then(function(res) { return res.json(); }).then(function(data) {
      if (data.success) {
        r.crm_id = data.crm_id;
        proceed(data.crm_id);
      } else {
        showToast('Error creating CRM card first');
      }
    });
  } else {
    proceed(r.crm_id);
  }
}

function wpDeleteRegistrant() {
  if (!wpCurrentDetail) return;
  if (!confirm('Delete this registrant? This cannot be undone.')) return;
  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_registrant', registrant_id: wpCurrentDetail.id })
  }).then(function() {
    wpCloseDetail();
    wpLoadRegistrants();
    showToast('Registrant deleted');
  });
}
