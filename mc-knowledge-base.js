// mc-knowledge-base.js — Knowledge Base editor for Mission Control
// CRUD interface for custom knowledge base entries stored in Supabase

var KB_API = 'https://agent-edge-backend.vercel.app/api/knowledge-base-admin';
var kbEntries = [];

// ===== LOAD ENTRIES =====
async function kbLoadEntries() {
  var container = document.getElementById('kbEntriesList');
  try {
    var resp = await fetch(KB_API);
    var data = await resp.json();

    if (data.tableNeeded) {
      container.innerHTML =
        '<div style="padding:24px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;text-align:center;">' +
          '<div style="font-size:32px;margin-bottom:12px;">&#x1F6A7;</div>' +
          '<div style="font-size:15px;font-weight:600;color:#9a3412;margin-bottom:8px;">Supabase Table Needed</div>' +
          '<div style="font-size:13px;color:#c2410c;line-height:1.6;">The <code>knowledge_base_custom</code> table needs to be created in Supabase.<br>Run this SQL in the Supabase SQL Editor:</div>' +
          '<pre style="text-align:left;background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:8px;margin-top:12px;font-size:12px;line-height:1.6;overflow-x:auto;">' +
            'CREATE TABLE knowledge_base_custom (\n' +
            '  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n' +
            '  title text NOT NULL,\n' +
            '  content text NOT NULL,\n' +
            '  keywords text DEFAULT \'\',\n' +
            '  created_at timestamptz DEFAULT now(),\n' +
            '  updated_at timestamptz DEFAULT now()\n' +
            ');</pre>' +
        '</div>';
      return;
    }

    kbEntries = data.entries || [];

    if (kbEntries.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--text-muted);">' +
          '<div style="font-size:48px;margin-bottom:12px;">&#x1F4DA;</div>' +
          '<div style="font-size:15px;margin-bottom:4px;">No custom entries yet</div>' +
          '<div style="font-size:13px;">Click "Add Entry" to start building your personal knowledge base.</div>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < kbEntries.length; i++) {
      var e = kbEntries[i];
      var dateStr = e.updated_at ? new Date(e.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      var preview = (e.content || '').substring(0, 200);
      if (e.content && e.content.length > 200) preview += '...';
      var kwDisplay = (e.keywords || '').split(',').filter(function(k) { return k.trim(); }).map(function(k) {
        return '<span style="display:inline-block;padding:2px 8px;background:#e8f0fe;color:#1a56db;border-radius:4px;font-size:11px;margin:2px;">' + k.trim() + '</span>';
      }).join('');

      html +=
        '<div style="padding:20px;background:#fff;border:1px solid var(--border);border-radius:10px;margin-bottom:12px;" id="kbEntry-' + e.id + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">' +
            '<div style="font-size:16px;font-weight:700;color:var(--text-primary);">' + escapeHtml(e.title) + '</div>' +
            '<div style="display:flex;gap:8px;flex-shrink:0;">' +
              '<button class="topbar-btn" onclick="kbEditEntry(\'' + e.id + '\')" style="padding:6px 12px;font-size:12px;"><i class="fas fa-edit"></i> Edit</button>' +
              '<button class="topbar-btn" onclick="kbDeleteEntry(\'' + e.id + '\')" style="padding:6px 12px;font-size:12px;color:#ef4444;"><i class="fas fa-trash"></i></button>' +
            '</div>' +
          '</div>' +
          (kwDisplay ? '<div style="margin-bottom:8px;">' + kwDisplay + '</div>' : '') +
          '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">' + escapeHtml(preview) + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-top:8px;">Last updated: ' + dateStr + '</div>' +
        '</div>';
    }

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML =
      '<div style="padding:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#991b1b;">' +
        '<strong>Error loading entries:</strong> ' + err.message +
      '</div>';
  }
}

// ===== SHOW ADD FORM =====
function kbShowAddForm() {
  document.getElementById('kbFormContainer').style.display = 'block';
  document.getElementById('kbFormTitle').textContent = 'Add Knowledge Base Entry';
  document.getElementById('kbEntryTitle').value = '';
  document.getElementById('kbEntryKeywords').value = '';
  document.getElementById('kbEntryContent').value = '';
  document.getElementById('kbEditId').value = '';
  document.getElementById('kbSaveBtn').innerHTML = '<i class="fas fa-save"></i> Save Entry';
  document.getElementById('kbEntryTitle').focus();
}

// ===== CANCEL FORM =====
function kbCancelForm() {
  document.getElementById('kbFormContainer').style.display = 'none';
}

// ===== EDIT ENTRY =====
function kbEditEntry(id) {
  var entry = kbEntries.find(function(e) { return e.id === id; });
  if (!entry) return;

  document.getElementById('kbFormContainer').style.display = 'block';
  document.getElementById('kbFormTitle').textContent = 'Edit Knowledge Base Entry';
  document.getElementById('kbEntryTitle').value = entry.title || '';
  document.getElementById('kbEntryKeywords').value = entry.keywords || '';
  document.getElementById('kbEntryContent').value = entry.content || '';
  document.getElementById('kbEditId').value = id;
  document.getElementById('kbSaveBtn').innerHTML = '<i class="fas fa-save"></i> Update Entry';

  // Scroll to form
  document.getElementById('kbFormContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== SAVE ENTRY (create or update) =====
async function kbSaveEntry() {
  var title = document.getElementById('kbEntryTitle').value.trim();
  var keywords = document.getElementById('kbEntryKeywords').value.trim();
  var content = document.getElementById('kbEntryContent').value.trim();
  var editId = document.getElementById('kbEditId').value;

  if (!title) { showToast('Title is required', 'error'); return; }
  if (!content) { showToast('Content is required', 'error'); return; }

  var btn = document.getElementById('kbSaveBtn');
  var origHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;

  try {
    var payload;
    if (editId) {
      payload = { action: 'update', id: editId, title: title, content: content, keywords: keywords };
    } else {
      payload = { action: 'create', title: title, content: content, keywords: keywords };
    }

    var resp = await fetch(KB_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    var data = await resp.json();
    if (!data.success) throw new Error(data.error || 'Save failed');

    showToast(editId ? 'Entry updated' : 'Entry created', 'success');
    kbCancelForm();
    kbLoadEntries();

  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    btn.innerHTML = origHtml;
    btn.disabled = false;
  }
}

// ===== DELETE ENTRY =====
async function kbDeleteEntry(id) {
  var entry = kbEntries.find(function(e) { return e.id === id; });
  var name = entry ? entry.title : 'this entry';

  if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;

  try {
    var resp = await fetch(KB_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: id })
    });

    var data = await resp.json();
    if (!data.success) throw new Error(data.error || 'Delete failed');

    showToast('Entry deleted', 'success');
    kbLoadEntries();

  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ===== HELPER: escape HTML =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Knowledge base loads are triggered by the modal open button in User Management

// ===== MODAL OPEN/CLOSE =====
function kbOpenModal() {
  document.getElementById('kbModal').style.display = 'flex';
  kbLoadEntries();
}

function kbCloseModal() {
  document.getElementById('kbModal').style.display = 'none';
  kbCancelForm();
}
