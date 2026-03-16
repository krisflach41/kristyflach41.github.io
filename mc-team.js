// ===== TEAM ROSTER (SUPABASE) =====
var editingTeamIdx = -1;

function getLoggedInUserId() {
  return localStorage.getItem('agent_edge_user') || 'default';
}

function loadTeamRoster() {
  fetch(API_BASE + '/ae-loans-api?action=get_team&user_id=' + getLoggedInUserId())
    .then(function(r) { return r.json(); })
    .then(function(data) {
      loTeamMembers = data.team || [];
      renderTeamRoster();
    })
    .catch(function() {
      loTeamMembers = [];
      renderTeamRoster();
    });
}

function renderTeamRoster() {
  var el = document.getElementById('teamRosterList');
  if (!el) return;
  if (loTeamMembers.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:16px;text-align:center;border:1px dashed var(--border);border-radius:8px;">No team members yet. Click "+ Add Team Member" to start building your loan team.</div>';
    return;
  }
  var h = '';
  loTeamMembers.forEach(function(tm, i) {
    var roleLabels = { lo:'Loan Officer', loa:'LOA', processor:'Processor' };
    var smsBadge = tm.sms_opt_in ? '<span style="font-size:9px;background:rgba(34,197,94,0.15);color:#22c55e;padding:2px 6px;border-radius:4px;margin-left:6px;">SMS ON</span>' : '';
    h += '<div class="team-card">';
    h += '<div style="width:36px;height:36px;border-radius:8px;background:rgba(168,85,247,0.12);display:flex;align-items:center;justify-content:center;"><i class="fas fa-user" style="color:#a855f7;font-size:14px;"></i></div>';
    h += '<div class="team-card-info">';
    h += '<div class="team-card-name">' + (tm.name || 'Unnamed') + smsBadge + '</div>';
    h += '<div class="team-card-role">' + (roleLabels[tm.role] || tm.role || '') + '</div>';
    h += '<div class="team-card-contact">' + [tm.email, tm.phone].filter(Boolean).join(' · ') + '</div>';
    h += '</div>';
    h += '<div class="team-card-actions">';
    h += '<button class="topbar-btn" style="font-size:10px;padding:4px 8px;" onclick="editTeamMember(' + i + ')"><i class="fas fa-edit"></i></button>';
    h += '<button class="topbar-btn danger" style="font-size:10px;padding:4px 8px;" onclick="deleteTeamMember(' + i + ')"><i class="fas fa-trash-alt"></i></button>';
    h += '</div></div>';
  });
  el.innerHTML = h;
}

function openTeamMemberForm() {
  editingTeamIdx = -1;
  document.getElementById('teamFormTitle').textContent = 'Add Team Member';
  document.getElementById('tm_name').value = '';
  document.getElementById('tm_role').value = 'loa';
  document.getElementById('tm_email').value = '';
  document.getElementById('tm_phone').value = '';
  document.getElementById('tmSmsLink').style.display = 'none';
  document.getElementById('teamMemberForm').style.display = 'block';
  document.getElementById('tm_name').focus();
}

function editTeamMember(idx) {
  var tm = loTeamMembers[idx];
  if (!tm) return;
  editingTeamIdx = idx;
  document.getElementById('teamFormTitle').textContent = 'Edit Team Member';
  document.getElementById('tm_name').value = tm.name || '';
  document.getElementById('tm_role').value = tm.role || 'loa';
  document.getElementById('tm_email').value = tm.email || '';
  document.getElementById('tm_phone').value = tm.phone || '';
  document.getElementById('tmSmsLink').style.display = 'inline';
  document.getElementById('teamMemberForm').style.display = 'block';
}

function closeTeamMemberForm() {
  document.getElementById('teamMemberForm').style.display = 'none';
  editingTeamIdx = -1;
}

function saveTeamMember() {
  var name = document.getElementById('tm_name').value.trim();
  if (!name) { showToast('Name is required'); return; }
  var tm = {
    name: name,
    role: document.getElementById('tm_role').value,
    email: document.getElementById('tm_email').value.trim(),
    phone: document.getElementById('tm_phone').value.trim()
  };

  if (editingTeamIdx >= 0) {
    tm.id = loTeamMembers[editingTeamIdx].id;
  }

  fetch(API_BASE + '/ae-loans-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_team_member', user_id: getLoggedInUserId(), member: tm })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      closeTeamMemberForm();
      loadTeamRoster();
      showToast(editingTeamIdx >= 0 ? 'Team member updated' : 'Team member added', 'success');
    } else {
      showToast('Save failed: ' + (data.error || data.message || 'Unknown'), 'error');
    }
  })
  .catch(function(err) {
    showToast('Error: ' + err.message, 'error');
  });
}

function deleteTeamMember(idx) {
  if (!confirm('Remove ' + loTeamMembers[idx].name + ' from your team?')) return;
  var memberId = loTeamMembers[idx].id;

  fetch(API_BASE + '/ae-loans-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_team_member', member_id: memberId })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      loadTeamRoster();
      showToast('Team member removed', 'success');
    }
  })
  .catch(function(err) {
    showToast('Error: ' + err.message, 'error');
  });
}

