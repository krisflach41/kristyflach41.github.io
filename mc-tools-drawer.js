// ===== TOOL DRAWER =====
var drawerOpen = false;
var drawerCompareLoaded = false;
var drawerCreditLoaded = false;

function toggleDrawer() {
  if (drawerOpen) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

function openDrawer(tab) {
  document.getElementById('toolDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
  drawerOpen = true;

  // Load compare iframe on first open (lazy load)
  if (!drawerCompareLoaded) {
    document.getElementById('drawerCompareFrame').src = 'loan-comparison.html';
    drawerCompareLoaded = true;
  }

  if (tab) {
    var tabs = document.querySelectorAll('.drawer-tab');
    var panels = document.querySelectorAll('.drawer-panel');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    panels.forEach(function(p) { p.classList.remove('active'); });

    // Find matching tab and panel
    var tabMap = { reports: 0, calc: 1, credit: 2, compare: 3, blended: 4, gus: 5 };
    var idx = tabMap[tab];
    if (idx !== undefined && tabs[idx]) tabs[idx].classList.add('active');
    var panel = document.getElementById('drawer-' + tab);
    if (panel) panel.classList.add('active');
  }
}

function closeDrawer() {
  document.getElementById('toolDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
  drawerOpen = false;
}

function switchDrawerTab(tab, el) {
  document.querySelectorAll('.drawer-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.drawer-panel').forEach(function(p) { p.classList.remove('active'); });
  if (el) el.classList.add('active');
  var panel = document.getElementById('drawer-' + tab);
  if (panel) panel.classList.add('active');

  // Lazy load compare on first switch
  if (tab === 'compare' && !drawerCompareLoaded) {
    document.getElementById('drawerCompareFrame').src = 'loan-comparison.html';
    drawerCompareLoaded = true;
  }
}

function loadDrawerReport(page) {
  var frame = document.getElementById('drawerReportFrame');
  frame.src = page;
  // Highlight the clicked button
  var btns = frame.parentElement.querySelectorAll('.topbar-btn');
  btns.forEach(function(b) { b.style.background = ''; b.style.color = ''; b.style.borderColor = ''; });
  event.target.closest('.topbar-btn').style.background = 'rgba(110,127,119,0.15)';
  event.target.closest('.topbar-btn').style.color = '#6e7f77';
  event.target.closest('.topbar-btn').style.borderColor = 'rgba(110,127,119,0.3)';
}

function loadDrawerCalc(page) {
  var frame = document.getElementById('drawerCalcFrame');
  frame.src = page;
  var btns = frame.parentElement.querySelectorAll('.topbar-btn');
  btns.forEach(function(b) { b.style.background = ''; b.style.color = ''; b.style.borderColor = ''; });
  event.target.closest('.topbar-btn').style.background = 'rgba(110,127,119,0.15)';
  event.target.closest('.topbar-btn').style.color = '#6e7f77';
  event.target.closest('.topbar-btn').style.borderColor = 'rgba(110,127,119,0.3)';
}

function clearDrawerTool() {
  var active = document.querySelector('.drawer-panel.active');
  if (!active) return;
  var frame = active.querySelector('iframe');
  if (frame && frame.src) {
    // Reload the iframe to clear all fields
    frame.src = frame.src;
  }
  // Clear Gus if that's the active panel
  var gusQ = document.getElementById('drawerGusQuestion');
  var gusR = document.getElementById('drawerGusResult');
  if (gusQ) gusQ.value = '';
  if (gusR) gusR.innerHTML = '';
}

// Ask Gus from the drawer
async function drawerAskGus() {
  var question = document.getElementById('drawerGusQuestion').value.trim();
  if (!question) return;

  var btn = document.getElementById('drawerGusBtn');
  var resultDiv = document.getElementById('drawerGusResult');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
  resultDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;"><i class="fas fa-spinner fa-spin"></i> Searching guidelines...</div>';

  try {
    var resp = await fetch('https://agent-edge-backend.vercel.app/api/scenario-desk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ask_gus',
        question: question,
        realtor_name: 'Kristy Flach (LO)',
        realtor_email: 'kflach@prmg.net'
      })
    });
    var data = await resp.json();
    if (data.response) {
      // Convert markdown-style bold to HTML
      var html = data.response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      resultDiv.innerHTML = '<div class="drawer-gus-result"><p>' + html + '</p></div>';
    } else {
      resultDiv.innerHTML = '<div class="drawer-gus-result" style="color:var(--accent-red);">No response received. Try again.</div>';
    }
  } catch (e) {
    resultDiv.innerHTML = '<div class="drawer-gus-result" style="color:var(--accent-red);">Error: ' + e.message + '</div>';
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-search"></i> Search Guidelines';
}

// Open drawer to a specific report from an order card
function openDrawerToReport(reportPage) {
  openDrawer('reports');
  loadDrawerReport(reportPage);
}

// Keyboard shortcut: Escape closes drawer
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && drawerOpen) {
    closeDrawer();
  }
});
