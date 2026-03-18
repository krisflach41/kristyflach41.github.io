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
    h += '<a href="https://kristyflach.com/landing/' + w.slug + '/replay" target="_blank" style="font-size:10px;color:#6e7f77;text-decoration:none;padding:2px 6px;border:1px solid rgba(110,127,119,0.3);border-radius:4px;"><i class="fas fa-play-circle" style="margin-right:3px;"></i>Replay</a>';
    h += '</div>';
  }

  // Action buttons
  h += '<div style="display:flex;gap:6px;">';
  h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="wbEditWebinar(' + w.id + ')"><i class="fas fa-edit"></i> Edit</button>';
  if (type === 'upcoming') {
    h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="wbCopyLink(\'' + w.slug + '\')"><i class="fas fa-copy"></i> Copy Link</button>';
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

function wbDeleteWebinar(id) {
  if (!confirm('Delete this webinar and all its pages? This cannot be undone.')) return;
  fetch(API_BASE_WB + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_webinar', webinar_id: id })
  }).then(function() { wbLoadWebinars(); showToast('Webinar deleted'); });
}
