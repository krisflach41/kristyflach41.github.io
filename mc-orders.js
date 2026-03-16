// ===== ORDER LOADING =====
var ordersLoaded = false;
var allOrders = [];

function loadOrders() {
  fetch('https://agent-edge-backend.vercel.app/api/get-orders', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success && data.orders) {
        allOrders = data.orders;
        ordersLoaded = true;
        // Update dashboard order count if element exists
        var dashEl = document.getElementById('dashOrders');
        if (dashEl) dashEl.textContent = allOrders.filter(function(o) { return (o.status || '').toLowerCase() !== 'complete'; }).length;
      } else {
        allOrders = [];
        ordersLoaded = true;
      }
    })
    .catch(function(err) { 
      console.error('Orders load error:', err); 
      allOrders = [];
      ordersLoaded = true;
    });
}

// ===== USER MANAGEMENT =====
var usersLoaded = false;

function loadUsers() {
  try {
    var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:json&sheet=Users';
    fetch(url)
      .then(function(r) { return r.text(); })
      .then(function(text) {
        var match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
        if (!match) return;
        var json = JSON.parse(match[1]);
        var rows = json.table.rows;
        if (!rows || rows.length === 0) { document.getElementById('usersList').textContent = 'No users found'; return; }
        var html = '';
        rows.forEach(function(row) {
          var name = (row.c[0] && row.c[0].v) || '';
          var email = (row.c[1] && row.c[1].v) || '';
          var status = (row.c[3] && row.c[3].v) || 'active';
          var date = (row.c[4] && row.c[4].v) || '';
          if (!name || name === 'Name') return;
          var statusBadge = status === 'active' ? '<span class="status-badge status-complete">Active</span>' :
                           status === 'trial' ? '<span class="status-badge status-inprogress">Trial</span>' :
                           '<span class="status-badge" style="background:rgba(239,68,68,0.15);color:#ef4444;">Expired</span>';
          html += '<div class="at-row at-5"><div>' + name + '</div><div style="font-size:10px;">' + email + '</div><div>' + statusBadge + '</div><div style="font-size:10px;">' + date + '</div><div><button class="topbar-btn" style="font-size:9px;padding:3px 8px;">Reset PW</button></div></div>';
        });
        document.getElementById('usersList').innerHTML = html;
        usersLoaded = true;
      });
  } catch (e) { console.error('Users load error:', e); }
}

// ===== EMAIL =====
function closeEmailModal() { document.getElementById('emailModal').classList.remove('show'); }
