// ===== SETTINGS — SMS ALERTS =====
var smsCurrentPerson = 'self'; // 'self' or team member db id

function toggleSmsSection() {
  var cb = document.getElementById('settingSmsEnabled');
  var detail = document.getElementById('smsSettingsDetail');
  if (detail) detail.style.display = cb && cb.checked ? 'block' : 'none';
}

function buildSmsPersonDropdown() {
  var sel = document.getElementById('smsPersonSelect');
  if (!sel) return;
  var html = '<option value="self">Myself (Loan Officer)</option>';
  loTeamMembers.forEach(function(tm) {
    var roleLabels = { lo:'LO', loa:'LOA', processor:'Processor' };
    html += '<option value="' + tm.id + '">' + tm.name + ' (' + (roleLabels[tm.role] || tm.role) + ')</option>';
  });
  sel.innerHTML = html;
  sel.value = smsCurrentPerson;
}

function switchSmsPerson() {
  var sel = document.getElementById('smsPersonSelect');
  smsCurrentPerson = sel ? sel.value : 'self';
  loadSmsSettingsForPerson(smsCurrentPerson);
}

function loadSmsSettingsForPerson(personId) {
  var scheduleSection = document.getElementById('smsScheduleSection');

  if (personId === 'self') {
    // LO — show schedule section, load from user profile
    if (scheduleSection) scheduleSection.style.display = 'block';
    document.getElementById('smsEnableDesc').textContent = 'Receive text messages for critical pipeline dates';
    // TODO: Load saved prefs from Supabase user profile
    // For now, just reset to defaults
    document.getElementById('settingSmsEnabled').checked = false;
    document.getElementById('settingAlertPhone').value = '';
    toggleSmsSection();
    renderSmsDateToggles('self');
  } else {
    // Team member — hide schedule (LO controls that), show their per-date toggles
    if (scheduleSection) scheduleSection.style.display = 'none';
    var tm = loTeamMembers.find(function(t) { return String(t.id) === String(personId); });
    if (tm) {
      document.getElementById('smsEnableDesc').textContent = 'Send text alerts to ' + tm.name + ' for their assigned tasks';
      document.getElementById('settingSmsEnabled').checked = tm.sms_opt_in || false;
      document.getElementById('settingAlertPhone').value = tm.phone || '';
      toggleSmsSection();
      renderSmsDateToggles(personId);
    }
  }
}

function renderSmsDateToggles(personId) {
  var container = document.getElementById('smsDateToggles');
  if (!container) return;
  var dates = [
    { key: 'closing', label: 'Closing', def: false },
    { key: 'final_cd', label: 'Final CD', def: true },
    { key: 'ctc', label: 'Clear to Close', def: true },
    { key: 'conditional', label: 'Conditional Approval', def: false },
    { key: 'emd', label: 'EMD Due', def: false },
    { key: 'appraisal', label: 'Appraisal', def: false },
    { key: 'inspection', label: 'Inspection', def: false }
  ];

  // Load saved prefs if available
  var savedPrefs = null;
  if (personId && personId !== 'self') {
    var tm = loTeamMembers.find(function(t) { return String(t.id) === String(personId); });
    if (tm && tm.alert_date_prefs) {
      try { savedPrefs = typeof tm.alert_date_prefs === 'string' ? JSON.parse(tm.alert_date_prefs) : tm.alert_date_prefs; } catch(e) {}
    }
  }

  var html = '';
  dates.forEach(function(d) {
    var checked = savedPrefs ? (savedPrefs[d.key] || false) : d.def;
    html += '<div class="sms-date-toggle">';
    html += '<input type="checkbox" id="smsToggle_' + d.key + '"' + (checked ? ' checked' : '') + '>';
    html += '<label for="smsToggle_' + d.key + '">' + d.label + '</label>';
    if (d.def && !savedPrefs) html += '<span class="sms-default">ON by default</span>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function sendTestSms() {
  var phone = document.getElementById('settingAlertPhone');
  var result = document.getElementById('testSmsResult');
  if (!phone || !phone.value) {
    if (result) { result.style.color = '#ef4444'; result.textContent = 'Enter a phone number first'; }
    return;
  }
  var personName = 'You';
  if (smsCurrentPerson !== 'self') {
    var tm = loTeamMembers.find(function(t) { return String(t.id) === String(smsCurrentPerson); });
    if (tm) personName = tm.name;
  }
  if (result) { result.style.color = 'var(--text-muted)'; result.textContent = 'Sending...'; }

  fetch(API_BASE + '/send-sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phone.value,
      message: '✅ Agent Edge SMS Test — Alerts are working for ' + personName + '! Pipeline dates will be monitored and texts sent for critical deadlines.'
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      result.style.color = '#22c55e';
      result.textContent = '✓ Test message sent!';
    } else {
      result.style.color = '#ef4444';
      result.textContent = 'Failed: ' + (data.error || 'SMS failed');
    }
  })
  .catch(function(err) {
    result.style.color = '#ef4444';
    result.textContent = 'Error: ' + err.message;
  });
}

function saveCurrentPersonSms() {
  var resultEl = document.getElementById('smsSaveResult');
  var smsEnabled = document.getElementById('settingSmsEnabled')?.checked || false;
  var phone = document.getElementById('settingAlertPhone')?.value || '';

  var datePrefs = {};
  ['closing','final_cd','ctc','conditional','emd','appraisal','inspection'].forEach(function(k) {
    var cb = document.getElementById('smsToggle_' + k);
    datePrefs[k] = cb ? cb.checked : false;
  });

  if (smsCurrentPerson === 'self') {
    // Save LO settings to user profile
    var morningAlert = document.getElementById('settingMorningAlert')?.checked || false;
    var noonEscalation = document.getElementById('settingNoonEscalation')?.checked || false;
    var settings = {
      alert_sms_enabled: smsEnabled,
      alert_phone: phone,
      alert_morning: morningAlert,
      alert_noon_escalation: noonEscalation,
      alert_date_prefs: JSON.stringify(datePrefs)
    };

    fetch(API_BASE + '/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: getLoggedInUserId(), ...settings })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success || data.user) {
        if (resultEl) { resultEl.style.color = '#22c55e'; resultEl.textContent = '✓ Saved!'; }
        showToast('Your SMS settings saved!', 'success');
      } else {
        if (resultEl) { resultEl.style.color = '#ef4444'; resultEl.textContent = 'Save failed'; }
      }
      setTimeout(function() { if (resultEl) resultEl.textContent = ''; }, 3000);
    })
    .catch(function(err) {
      if (resultEl) { resultEl.style.color = '#ef4444'; resultEl.textContent = 'Error'; }
    });
  } else {
    // Save team member SMS settings
    var tm = loTeamMembers.find(function(t) { return String(t.id) === String(smsCurrentPerson); });
    if (!tm) return;

    var memberUpdate = {
      id: tm.id,
      name: tm.name,
      role: tm.role,
      email: tm.email,
      phone: phone,
      sms_opt_in: smsEnabled,
      alert_date_prefs: JSON.stringify(datePrefs)
    };

    fetch(API_BASE + '/ae-loans-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_team_member', user_id: getLoggedInUserId(), member: memberUpdate })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        // Update local copy
        tm.sms_opt_in = smsEnabled;
        tm.phone = phone;
        tm.alert_date_prefs = datePrefs;
        if (resultEl) { resultEl.style.color = '#22c55e'; resultEl.textContent = '✓ Saved for ' + tm.name + '!'; }
        showToast('SMS settings saved for ' + tm.name, 'success');
        renderTeamRoster();
      } else {
        if (resultEl) { resultEl.style.color = '#ef4444'; resultEl.textContent = 'Save failed'; }
      }
      setTimeout(function() { if (resultEl) resultEl.textContent = ''; }, 3000);
    })
    .catch(function(err) {
      if (resultEl) { resultEl.style.color = '#ef4444'; resultEl.textContent = 'Error'; }
    });
  }
}

function goToSmsSettings() {
  closeTeamMemberForm();
  switchView('settings', document.querySelector('.nav-item[onclick*="settings"]'));
  // Small delay to let Settings render, then scroll to SMS section
  setTimeout(function() {
    var sel = document.getElementById('smsPersonSelect');
    if (sel && editingTeamIdx >= 0 && loTeamMembers[editingTeamIdx]) {
      sel.value = String(loTeamMembers[editingTeamIdx].id);
      switchSmsPerson();
    }
  }, 300);
}

function saveAlertSettings() {
  saveCurrentPersonSms();
}

function initSettingsView() {
  buildSmsPersonDropdown();
  smsCurrentPerson = 'self';
  var sel = document.getElementById('smsPersonSelect');
  if (sel) sel.value = 'self';
  loadSmsSettingsForPerson('self');
}

