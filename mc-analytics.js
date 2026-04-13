// ===== ANALYTICS =====
var anaDataLoaded = false;
var anaLoanHistory = [];
var anaCrmAll = [];

function anaShowTab(tab, el) {
  document.querySelectorAll('.ana-tab').forEach(function(t) { t.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('anaTabDashboard').style.display = tab === 'dashboard' ? 'block' : 'none';
  document.getElementById('anaTabReports').style.display = tab === 'reports' ? 'block' : 'none';
  if (tab === 'reports' && !document.getElementById('anaQbFields').children.length) anaInitQueryBuilder();
}

function loadAnalytics() {
  qrLoadUserReports();
  if (anaDataLoaded) { renderAnalyticsDashboard(); return; }
  // Fetch all loan history
  fetch(API_BASE + '/ae-loans-api', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getAllHistory' })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) anaLoanHistory = data.history || [];
    renderAnalyticsDashboard();
  }).catch(function() { renderAnalyticsDashboard(); });

  // Also need CRM data for birthdays
  fetch(API_BASE + '/crm-api?action=list').then(function(r) { return r.json(); }).then(function(data) {
    if (data.success) anaCrmAll = data.contacts || [];
    renderUpcomingDates();
    renderSourcePerformance();
  }).catch(function() {});

  anaDataLoaded = true;
}

function renderAnalyticsDashboard() {
  renderProductionMetrics();
  renderPipelineVelocity();
  renderRefiOpportunities();
  renderStrikeRate();
}

// --- PRODUCTION METRICS ---
function renderProductionMetrics() {
  var funded = anaLoanHistory.filter(function(h) { return h.outcome === 'funded'; });
  var totalVol = 0; var count = funded.length;
  funded.forEach(function(h) { totalVol += parseFloat(h.loan_amount) || 0; });
  var avg = count > 0 ? totalVol / count : 0;

  document.getElementById('anaFundedVol').textContent = '$' + Math.round(totalVol).toLocaleString();
  document.getElementById('anaFundedCount').textContent = count;
  document.getElementById('anaAvgSize').textContent = avg > 0 ? '$' + Math.round(avg).toLocaleString() : '—';
  document.getElementById('anaProdStatus').textContent = 'YTD ' + new Date().getFullYear();

  // Monthly bars
  var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var monthlyVol = {};
  var yr = new Date().getFullYear();
  funded.forEach(function(h) {
    if (!h.outcome_date) return;
    var d = new Date(h.outcome_date);
    if (d.getFullYear() === yr) {
      var m = d.getMonth();
      monthlyVol[m] = (monthlyVol[m] || 0) + (parseFloat(h.loan_amount) || 0);
    }
  });
  var maxVol = 0;
  for (var k in monthlyVol) { if (monthlyVol[k] > maxVol) maxVol = monthlyVol[k]; }
  if (maxVol === 0) maxVol = 100000;

  var barsHtml = '';
  months.forEach(function(m, i) {
    var vol = monthlyVol[i] || 0;
    var h = vol > 0 ? Math.max(8, (vol / maxVol) * 140) : 2;
    var color = vol > 0 ? '#22c55e' : 'rgba(0,0,0,0.03)';
    var valText = vol > 0 ? '$' + Math.round(vol / 1000) + 'K' : '—';
    var valColor = vol > 0 ? 'color:#22c55e;' : 'color:var(--text-muted);';
    barsHtml += '<div class="mc-vbar-col"><div class="mc-vbar-val" style="' + valColor + '">' + valText + '</div>';
    barsHtml += '<div class="mc-vbar" style="height:' + h + 'px;background:linear-gradient(180deg,' + color + ',' + color + '40);box-shadow:0 0 12px ' + color + '30;"></div>';
    barsHtml += '<div class="mc-vbar-label">' + m + '</div></div>';
  });
  document.getElementById('anaMonthlyBars').innerHTML = barsHtml;
}

// --- PIPELINE VELOCITY ---
function renderPipelineVelocity() {
  var stages = [
    { id: 'warm', label: 'WARM LEADS', color: '#818cf8' },
    { id: 'active', label: 'ACTIVE CONVOS', color: '#f472b6' },
    { id: 'credit', label: 'CREDIT REPAIR', color: '#fb923c' },
    { id: 'preapproval', label: 'PRE-APPROVAL', color: '#f87171' },
    { id: 'preapproved', label: 'APPROVED', color: '#fbbf24' },
    { id: 'ratewatch', label: 'RATE WATCH', color: '#34d399' },
    { id: 'underwriting', label: 'UNDERWRITING', color: '#38bdf8' }
  ];
  var counts = {};
  stages.forEach(function(s) { counts[s.id] = 0; });
  pipelineLoans.forEach(function(l) { if (counts[l.pipeline_stage] !== undefined) counts[l.pipeline_stage]++; });
  var maxC = Math.max.apply(null, stages.map(function(s) { return counts[s.id]; }));
  if (maxC === 0) maxC = 1;

  var h = '';
  stages.forEach(function(s) {
    var c = counts[s.id];
    var pct = (c / Math.max(maxC, 5)) * 100;
    h += '<div class="mc-hbar-row"><div class="mc-hbar-label">' + s.label + '</div>';
    h += '<div class="mc-hbar-track"><div class="mc-hbar-fill" style="width:' + pct + '%;background:linear-gradient(90deg,' + s.color + '20,' + s.color + ');box-shadow:0 0 10px ' + s.color + '30;"></div></div>';
    h += '<div class="mc-hbar-val" style="color:' + (c > 0 ? s.color : 'var(--text-muted)') + ';">' + c + '</div></div>';
  });
  document.getElementById('anaVelocityBars').innerHTML = h;

  var totalActive = pipelineLoans.length;
  var totalDecisioned = anaLoanHistory.length;
  var totalAll = totalActive + totalDecisioned;
  var funded = anaLoanHistory.filter(function(x) { return x.outcome === 'funded'; }).length;
  var convRate = totalAll > 0 ? Math.round((funded / totalAll) * 100) : 0;

  document.getElementById('anaConversion').textContent = convRate + '%';
  document.getElementById('anaStalled').textContent = totalActive;
  document.getElementById('anaVelocityStatus').textContent = totalActive + ' IN PIPELINE';
}

// --- REFI OPPORTUNITIES ---
function renderRefiOpportunities() {
  var mktRate = 6.375; // TODO: could pull from MBS data
  var funded = anaLoanHistory.filter(function(h) { return h.outcome === 'funded' && h.interest_rate; });
  var opps = [];

  funded.forEach(function(h) {
    var rate = parseFloat(h.interest_rate);
    var amt = parseFloat(h.loan_amount) || 0;
    if (rate > mktRate + 0.25) {
      var spread = rate - mktRate;
      var monthlySave = Math.round((spread / 100) * amt / 12);
      var names = [];
      if (h.borrowers && Array.isArray(h.borrowers)) {
        h.borrowers.forEach(function(b) { if (b.name) names.push(b.name); });
      }
      var name = names.length > 0 ? names.join(' & ') : 'Unknown';
      var priority = spread >= 0.75 ? 'HOT' : spread >= 0.5 ? 'WARM' : 'WATCH';
      var pColor = priority === 'HOT' ? '#ef4444' : priority === 'WARM' ? '#f59e0b' : '#3b82f6';
      opps.push({ name: name, rate: rate, spread: spread, save: monthlySave, amt: amt, priority: priority, pColor: pColor, date: h.outcome_date });
    }
  });

  opps.sort(function(a, b) { return b.spread - a.spread; });
  var el = document.getElementById('anaRefiCards');
  var statusEl = document.getElementById('anaRefiStatus');

  if (opps.length === 0) {
    el.innerHTML = '<div class="mc-empty-msg">NO OPPORTUNITIES DETECTED AT CURRENT RATES</div>';
    statusEl.textContent = '0 FOUND';
    return;
  }

  statusEl.textContent = opps.length + ' OPPORTUNITIES';
  var oh = '';
  opps.forEach(function(o) {
    oh += '<div class="mc-opp"><div class="mc-opp-icon" style="background:' + o.pColor + '15;color:' + o.pColor + ';">⬇</div>';
    oh += '<div class="mc-opp-body"><div class="mc-opp-name">' + o.name + '</div>';
    oh += '<div class="mc-opp-detail">RATE: ' + o.rate.toFixed(3) + '% → MKT ' + mktRate.toFixed(3) + '% · SAVES $' + o.save + '/MO · $' + Math.round(o.amt).toLocaleString() + '</div></div>';
    oh += '<div class="mc-opp-tag" style="background:' + o.pColor + '15;color:' + o.pColor + ';">' + o.priority + '</div></div>';
  });
  el.innerHTML = oh;
}

// --- SOURCE PERFORMANCE ---
function renderSourcePerformance() {
  var srcColors = { 'Realtor': '#f472b6', 'Zillow': '#818cf8', 'Past Client': '#34d399', 'Website': '#fbbf24', 'Social Media': '#38bdf8', 'Walk-In': '#fb923c', 'Other': '#a78bfa' };
  var srcCounts = {};
  var allContacts = anaCrmAll.length > 0 ? anaCrmAll : [];
  allContacts.forEach(function(c) {
    var src = c.source || 'Other';
    srcCounts[src] = (srcCounts[src] || 0) + 1;
  });

  var sources = Object.keys(srcCounts).sort(function(a, b) { return srcCounts[b] - srcCounts[a]; });
  var maxS = sources.length > 0 ? srcCounts[sources[0]] : 1;
  var el = document.getElementById('anaSourceBars');
  var statusEl = document.getElementById('anaSourceStatus');

  if (sources.length === 0) {
    el.innerHTML = '<div class="mc-empty-msg">NO SOURCE DATA</div>';
    statusEl.textContent = '—';
    return;
  }

  statusEl.textContent = sources.length + ' SOURCES';
  var sh = '';
  sources.slice(0, 8).forEach(function(src) {
    var c = srcCounts[src];
    var pct = (c / Math.max(maxS, 5)) * 100;
    var color = srcColors[src] || '#a78bfa';
    sh += '<div class="mc-hbar-row"><div class="mc-hbar-label">' + src.toUpperCase() + '</div>';
    sh += '<div class="mc-hbar-track"><div class="mc-hbar-fill" style="width:' + pct + '%;background:linear-gradient(90deg,' + color + '20,' + color + ');box-shadow:0 0 10px ' + color + '30;"></div></div>';
    sh += '<div class="mc-hbar-val" style="color:' + color + ';">' + c + '</div></div>';
  });
  el.innerHTML = sh;

  var footer = document.getElementById('anaSourceFooter');
  if (footer && sources.length > 0) {
    footer.innerHTML = 'TOP SOURCE: <span style="color:' + (srcColors[sources[0]] || '#a78bfa') + ';text-shadow:0 0 6px ' + (srcColors[sources[0]] || '#a78bfa') + '40;">' + sources[0].toUpperCase() + '</span> (' + srcCounts[sources[0]] + ' CONTACTS)';
  }
}

// --- UPCOMING DATES ---
function renderUpcomingDates() {
  var el = document.getElementById('anaUpcomingDates');
  var now = new Date();
  var in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  var nowMonth = now.getMonth(); var nowDay = now.getDate();

  var birthdays = [];
  var anniversaries = [];

  anaCrmAll.forEach(function(c) {
    if (c.birthday) {
      var parts = c.birthday.split('-');
      if (parts.length >= 3) {
        var bMonth = parseInt(parts[1]) - 1;
        var bDay = parseInt(parts[2]);
        var bDate = new Date(now.getFullYear(), bMonth, bDay);
        if (bDate < now) bDate = new Date(now.getFullYear() + 1, bMonth, bDay);
        if (bDate >= now && bDate <= in30) {
          birthdays.push({ name: (c.first_name || '') + ' ' + (c.last_name || ''), date: bDate, type: c.type || '', sub: (c.type || '').toUpperCase() });
        }
      }
    }
  });

  // Home anniversaries from loan history
  anaLoanHistory.forEach(function(h) {
    if (h.outcome === 'funded' && h.outcome_date) {
      var od = new Date(h.outcome_date);
      var anniv = new Date(now.getFullYear(), od.getMonth(), od.getDate());
      if (anniv < now) anniv = new Date(now.getFullYear() + 1, od.getMonth(), od.getDate());
      if (anniv >= now && anniv <= in30) {
        var years = now.getFullYear() - od.getFullYear();
        var names = [];
        if (h.borrowers && Array.isArray(h.borrowers)) h.borrowers.forEach(function(b) { if (b.name) names.push(b.name); });
        anniversaries.push({ name: names.join(' & ') || 'Unknown', date: anniv, years: years, amt: h.loan_amount });
      }
    }
  });

  birthdays.sort(function(a, b) { return a.date - b.date; });
  anniversaries.sort(function(a, b) { return a.date - b.date; });

  var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var html = '';

  if (birthdays.length > 0) {
    html += '<div style="font-size:10px;letter-spacing:2px;color:var(--text-muted);margin-bottom:8px;font-family:\'Share Tech Mono\',monospace;">🎂 BIRTHDAYS</div>';
    birthdays.slice(0, 5).forEach(function(b) {
      html += '<div class="mc-alert-row" style="border-color:#a78bfa;"><div class="mc-alert-icon">🎂</div>';
      html += '<div class="mc-alert-body"><div class="mc-alert-name">' + b.name + '</div><div class="mc-alert-sub">' + b.sub + '</div></div>';
      html += '<div class="mc-alert-date" style="color:#a78bfa;">' + months[b.date.getMonth()] + ' ' + b.date.getDate() + '</div></div>';
    });
  }

  if (anniversaries.length > 0) {
    html += '<div style="font-size:10px;letter-spacing:2px;color:var(--text-muted);margin:' + (birthdays.length > 0 ? '14' : '0') + 'px 0 8px;font-family:\'Share Tech Mono\',monospace;">🏠 HOME ANNIVERSARIES</div>';
    anniversaries.slice(0, 5).forEach(function(a) {
      html += '<div class="mc-alert-row" style="border-color:#22c55e;"><div class="mc-alert-icon">🏠</div>';
      html += '<div class="mc-alert-body"><div class="mc-alert-name">' + a.name + '</div><div class="mc-alert-sub">' + a.years + ' YEAR' + (a.years !== 1 ? 'S' : '') + ' · $' + Math.round(parseFloat(a.amt) || 0).toLocaleString() + '</div></div>';
      html += '<div class="mc-alert-date" style="color:#22c55e;">' + months[a.date.getMonth()] + ' ' + a.date.getDate() + '</div></div>';
    });
  }

  if (!html) html = '<div class="mc-empty-msg">NO UPCOMING DATES IN NEXT 30 DAYS</div>';
  el.innerHTML = html;

  var statusEl = document.getElementById('anaDateStatus');
  var total = birthdays.length + anniversaries.length;
  if (statusEl) statusEl.textContent = total > 0 ? total + ' UPCOMING' : 'NONE';
}

// --- STRIKE RATE ---
function renderStrikeRate() {
  var mktRate = 6.375;
  document.getElementById('anaMktRate').textContent = mktRate.toFixed(3) + '%';

  var funded = anaLoanHistory.filter(function(h) { return h.outcome === 'funded' && h.interest_rate; });
  if (funded.length === 0) {
    document.getElementById('anaAvgRate').textContent = '—';
    document.getElementById('anaRefiCount').textContent = '0';
    document.getElementById('anaStrikeCards').innerHTML = '<div class="mc-empty-msg">NO FUNDED LOAN DATA</div>';
    return;
  }

  var totalRate = 0;
  funded.forEach(function(h) { totalRate += parseFloat(h.interest_rate); });
  var avgRate = totalRate / funded.length;
  document.getElementById('anaAvgRate').textContent = avgRate.toFixed(3) + '%';

  var candidates = [];
  funded.forEach(function(h) {
    var rate = parseFloat(h.interest_rate);
    if (rate > mktRate) {
      var spread = rate - mktRate;
      var names = [];
      if (h.borrowers && Array.isArray(h.borrowers)) h.borrowers.forEach(function(b) { if (b.name) names.push(b.name); });
      var priority = spread >= 0.75 ? 'HOT' : spread >= 0.5 ? 'WARM' : 'WATCH';
      var pColor = priority === 'HOT' ? '#ef4444' : priority === 'WARM' ? '#f59e0b' : '#3b82f6';
      candidates.push({ name: names.join(' & ') || 'Unknown', rate: rate, spread: spread, amt: parseFloat(h.loan_amount) || 0, priority: priority, pColor: pColor, strikeRate: h.strike_rate });
    }
  });
  candidates.sort(function(a, b) { return b.spread - a.spread; });

  document.getElementById('anaRefiCount').textContent = candidates.length;
  document.getElementById('anaStrikeStatus').textContent = candidates.length + ' ABOVE MKT';

  if (candidates.length === 0) {
    document.getElementById('anaStrikeCards').innerHTML = '<div class="mc-empty-msg">ALL CLIENTS AT OR BELOW MARKET RATE</div>';
    return;
  }

  var sh = '';
  candidates.forEach(function(c) {
    var strikeStr = c.strikeRate ? ' · STRIKE: ' + parseFloat(c.strikeRate).toFixed(3) + '%' : '';
    sh += '<div class="mc-opp"><div class="mc-opp-icon" style="background:' + c.pColor + '15;color:' + c.pColor + ';">📊</div>';
    sh += '<div class="mc-opp-body"><div class="mc-opp-name">' + c.name + '</div>';
    sh += '<div class="mc-opp-detail">RATE: ' + c.rate.toFixed(3) + '% · MKT: ' + mktRate.toFixed(3) + '% · SPREAD: +' + c.spread.toFixed(3) + '% · $' + Math.round(c.amt).toLocaleString() + strikeStr + '</div></div>';
    sh += '<div class="mc-opp-tag" style="background:' + c.pColor + '15;color:' + c.pColor + ';">' + c.priority + '</div></div>';
  });
  document.getElementById('anaStrikeCards').innerHTML = sh;
}

// ===== QUICK REPORTS =====
var qrCurrentType='';var qrCurrentConfig={};var qrResultData=[];var qrResultColumns=[];
var qrUserReports=JSON.parse(localStorage.getItem('ae_user_reports')||'[]');

function qrLoadUserReports(){var g=document.getElementById('qrUserSaved');if(!g||qrUserReports.length===0)return;var h='<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(59,130,246,0.08);display:flex;gap:8px;flex-wrap:wrap;">';qrUserReports.forEach(function(r){h+='<div class="qr-card user-saved" onclick="qrSelect(\''+r.id+'\',this)" style="flex-direction:row;padding:8px 14px;gap:8px;"><span>⭐</span><div class="qr-name">'+r.name+'</div></div>';});h+='</div>';g.innerHTML=h;}

function qrSelect(type,el){document.querySelectorAll('.qr-card').forEach(function(c){c.classList.remove('active');});if(el)el.classList.add('active');qrCurrentType=type;document.getElementById('anaResultsPanel').style.display='none';document.getElementById('qrConfigPanel').style.display='block';qrBuildConfig(type);}

function qrBuildConfig(type){
  var title=document.getElementById('qrConfigTitle'),body=document.getElementById('qrConfigBody');
  var months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var cm=new Date().getMonth();
  var now=new Date(),yStr=now.getFullYear()+'-01-01',tStr=now.toISOString().split('T')[0];
  var mp='<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;letter-spacing:1px;font-weight:600;">SELECT MONTH</div><div class="qr-months">';
  months.forEach(function(m,i){mp+='<div class="qr-month'+(i===cm?' active':'')+'" onclick="qrPickMonth(this,'+i+')">'+m+'</div>';});mp+='</div>';
  var datePickers='<div style="display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap;"><span style="font-size:13px;color:var(--text-muted);font-weight:600;">OR CUSTOM RANGE:</span><input type="date" class="qb-date-input" id="qrDateFrom" value="'+yStr+'" style="font-size:13px;"><span style="color:var(--text-muted);">→</span><input type="date" class="qb-date-input" id="qrDateTo" value="'+tStr+'" style="font-size:13px;"></div>';
  var pp='<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;letter-spacing:1px;font-weight:600;">SELECT PERIOD</div><div class="qr-periods"><div class="qr-period" onclick="qrPickPeriod(this,\'mtd\')">THIS MONTH</div><div class="qr-period" onclick="qrPickPeriod(this,\'qtd\')">THIS QUARTER</div><div class="qr-period active" onclick="qrPickPeriod(this,\'ytd\')">YEAR TO DATE</div><div class="qr-period" onclick="qrPickPeriod(this,\'12mo\')">LAST 12 MONTHS</div><div class="qr-period" onclick="qrPickPeriod(this,\'all\')">ALL TIME</div><div class="qr-period" onclick="qrPickPeriod(this,\'custom\')">CUSTOM</div></div><div id="qrCustomDateWrap" style="display:none;margin-top:10px;"><div style="display:flex;align-items:center;gap:10px;"><input type="date" class="qb-date-input" id="qrDateFrom" value="'+yStr+'" style="font-size:13px;"><span style="color:var(--text-muted);">→</span><input type="date" class="qb-date-input" id="qrDateTo" value="'+tStr+'" style="font-size:13px;"></div></div>';
  var mktInput='<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><span style="font-size:13px;color:var(--text-secondary);font-weight:600;">MARKET RATE:</span><input type="number" step="0.001" value="6.375" id="qrMktRate" style="background:#fafbfc;border:1px solid rgba(59,130,246,0.2);color:#3b82f6;font-family:sans-serif;font-size:16px;font-weight:700;padding:6px 12px;border-radius:4px;width:100px;outline:none;text-align:center;" onfocus="this.style.borderColor=\'rgba(59,130,246,0.5)\'" onblur="this.style.borderColor=\'rgba(59,130,246,0.2)\'"><span style="font-size:13px;color:var(--text-secondary);font-weight:600;">%</span><span style="font-size:12px;color:var(--text-muted);font-weight:600;margin-left:8px;">EDIT TO MATCH YOUR PRICING</span></div>';
  qrCurrentConfig={};
  if(type==='birthdays'){title.textContent='BIRTHDAYS';body.innerHTML=mp;qrCurrentConfig.month=cm;}
  else if(type==='anniv-purchase'){title.textContent='PURCHASE CLOSING ANNIVERSARIES';body.innerHTML=mp;qrCurrentConfig.month=cm;}
  else if(type==='anniv-refi'){title.textContent='REFI CLOSING ANNIVERSARIES';body.innerHTML=mp;qrCurrentConfig.month=cm;}
  else if(type==='production'){title.textContent='MONTHLY PRODUCTION';body.innerHTML=pp;qrCurrentConfig.period='ytd';}
  else if(type==='sources'){title.textContent='SOURCE BREAKDOWN';body.innerHTML=pp;qrCurrentConfig.period='ytd';}
  else if(type==='refi'){title.textContent='REFI CANDIDATES';body.innerHTML=mktInput+'<div style="font-size:12px;color:var(--text-muted);margin-top:8px;font-weight:600;">SHOWS ALL FUNDED CLIENTS WITH RATES ABOVE YOUR MARKET RATE</div>';}
  else if(type==='strike'){title.textContent='STRIKE RATE CLIENTS';body.innerHTML=mktInput+'<div style="font-size:12px;color:var(--text-muted);margin-top:8px;font-weight:600;">SHOWS SPREAD BETWEEN CLIENT RATES AND CURRENT MARKET</div>';}
  else if(type==='age'){title.textContent='AGE OF LOAN';body.innerHTML='<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;letter-spacing:1px;font-weight:600;">DAYS FROM CREATION TO DECISION</div>'+pp;qrCurrentConfig.period='ytd';}
  else if(type==='fallout'){title.textContent='FALLOUT REPORT';body.innerHTML='<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;letter-spacing:1px;font-weight:600;">WITHDRAWN · SUSPENDED · DENIED</div>'+pp;qrCurrentConfig.period='ytd';}
  else if(type==='archive'){title.textContent='COMPLIANCE ARCHIVE';body.innerHTML='<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;letter-spacing:1px;font-weight:600;">PULL ARCHIVED ORDERS BY DATE RANGE</div><div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Orders auto-archive after 90 days. Retained for 3 years.</div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span style="font-size:13px;color:var(--text-muted);font-weight:600;">DATE RANGE:</span><input type="date" class="qb-date-input" id="qrArchiveFrom" value="'+yStr+'" style="font-size:13px;"><span style="color:var(--text-muted);">→</span><input type="date" class="qb-date-input" id="qrArchiveTo" value="'+tStr+'" style="font-size:13px;"></div>';}
  else if(type==='realtor'){title.textContent='REALTOR TRACKING';body.innerHTML='<div style="font-size:13px;color:var(--text-secondary);letter-spacing:1px;font-weight:600;">PORTAL ACTIVITY TRACKING — COMING SOON</div>';}
  else if(type.startsWith('user_')){var s=qrUserReports.find(function(r){return r.id===type;});if(s){title.textContent=s.name.toUpperCase();body.innerHTML='<div style="font-size:13px;color:var(--text-secondary);">SAVED REPORT — CLICK RUN</div>';qrCurrentConfig=JSON.parse(JSON.stringify(s.config));}}
}

function qrPickMonth(el,m){el.parentElement.querySelectorAll('.qr-month').forEach(function(e){e.classList.remove('active');});el.classList.add('active');qrCurrentConfig.month=m;}
function qrPickPeriod(el,p){el.parentElement.querySelectorAll('.qr-period').forEach(function(e){e.classList.remove('active');});el.classList.add('active');qrCurrentConfig.period=p;var cw=document.getElementById('qrCustomDateWrap');if(cw)cw.style.display=p==='custom'?'block':'none';}

function qrGetDateRange(p){var n=new Date(),to=n.toISOString().split('T')[0],fr='2020-01-01';if(p==='mtd')fr=new Date(n.getFullYear(),n.getMonth(),1).toISOString().split('T')[0];else if(p==='qtd'){var q=Math.floor(n.getMonth()/3)*3;fr=new Date(n.getFullYear(),q,1).toISOString().split('T')[0];}else if(p==='ytd')fr=n.getFullYear()+'-01-01';else if(p==='12mo')fr=new Date(n.getFullYear()-1,n.getMonth(),n.getDate()).toISOString().split('T')[0];else if(p==='custom'){var f=document.getElementById('qrDateFrom'),t=document.getElementById('qrDateTo');if(f&&f.value)fr=f.value;if(t&&t.value)to=t.value;}return{from:fr,to:to};}

function qrNames(h){var n=[];if(h.borrowers&&Array.isArray(h.borrowers))h.borrowers.forEach(function(b){if(b.name)n.push(b.name);});return n.join(' & ')||'—';}

function qrRunReport(){
  var type=qrCurrentType,data=[],cols=[];var mkEl=document.getElementById('qrMktRate');var mk=mkEl?parseFloat(mkEl.value)||6.375:6.375;
  if(type==='birthdays'){cols=['NAME','TYPE','BIRTHDAY','PHONE','EMAIL'];var m=qrCurrentConfig.month;anaCrmAll.forEach(function(c){if(!c.birthday)return;var p=c.birthday.split('-');if(p.length>=2&&parseInt(p[1])-1===m)data.push({'NAME':(c.first_name||'')+' '+(c.last_name||''),'TYPE':(c.type||'—').toUpperCase(),'BIRTHDAY':c.birthday,'PHONE':c.phone||'—','EMAIL':c.email||'—'});});}
  else if(type==='anniv-purchase'||type==='anniv-refi'){cols=['BORROWER','CLOSE DATE','YEARS','LOAN AMOUNT','RATE','LOAN TYPE'];var m=qrCurrentConfig.month;anaLoanHistory.forEach(function(h){if(h.outcome!=='funded'||!h.outcome_date)return;var od=new Date(h.outcome_date);if(od.getMonth()!==m)return;var tt=(h.transaction_type||'').toLowerCase();if(type==='anniv-purchase'&&tt&&tt.indexOf('purch')<0)return;if(type==='anniv-refi'&&tt&&tt.indexOf('refi')<0)return;data.push({'BORROWER':qrNames(h),'CLOSE DATE':h.outcome_date,'YEARS':new Date().getFullYear()-od.getFullYear(),'LOAN AMOUNT':'$'+Math.round(parseFloat(h.loan_amount)||0).toLocaleString(),'RATE':h.interest_rate?parseFloat(h.interest_rate).toFixed(3)+'%':'—','LOAN TYPE':h.transaction_type||'—'});});}
  else if(type==='production'){cols=['BORROWER','LOAN AMOUNT','RATE','LOAN TYPE','PROGRAM','CLOSE DATE','AE ID'];var r=qrGetDateRange(qrCurrentConfig.period);anaLoanHistory.forEach(function(h){if(h.outcome!=='funded')return;if(h.outcome_date&&(h.outcome_date<r.from||h.outcome_date>r.to))return;data.push({'BORROWER':qrNames(h),'LOAN AMOUNT':'$'+Math.round(parseFloat(h.loan_amount)||0).toLocaleString(),'RATE':h.interest_rate?parseFloat(h.interest_rate).toFixed(3)+'%':'—','LOAN TYPE':h.transaction_type||'—','PROGRAM':h.loan_program||'—','CLOSE DATE':h.outcome_date||'—','AE ID':h.ae_id||'—',_amt:parseFloat(h.loan_amount)||0,_rate:parseFloat(h.interest_rate)||0});});}
  else if(type==='sources'){cols=['SOURCE','TOTAL CONTACTS','FUNDED','PULL-THROUGH %'];var sc={},sf={};anaCrmAll.forEach(function(c){var s=c.source||'Other';sc[s]=(sc[s]||0)+1;});anaLoanHistory.forEach(function(h){if(h.outcome==='funded'&&h.source)sf[h.source]=(sf[h.source]||0)+1;});Object.keys(sc).sort(function(a,b){return sc[b]-sc[a];}).forEach(function(s){var f=sf[s]||0;data.push({'SOURCE':s,'TOTAL CONTACTS':sc[s],'FUNDED':f,'PULL-THROUGH %':sc[s]>0?Math.round((f/sc[s])*100)+'%':'0%'});});}
  else if(type==='refi'||type==='strike'){cols=['BORROWER','FUNDED RATE','MARKET RATE','SPREAD','MONTHLY SAVINGS','LOAN AMOUNT','FUNDED DATE'];anaLoanHistory.forEach(function(h){if(h.outcome!=='funded'||!h.interest_rate)return;var rate=parseFloat(h.interest_rate);if(rate<=mk)return;var sp=rate-mk,amt=parseFloat(h.loan_amount)||0;data.push({'BORROWER':qrNames(h),'FUNDED RATE':rate.toFixed(3)+'%','MARKET RATE':mk.toFixed(3)+'%','SPREAD':'+'+sp.toFixed(3)+'%','MONTHLY SAVINGS':'$'+Math.round((sp/100)*amt/12),'LOAN AMOUNT':'$'+Math.round(amt).toLocaleString(),'FUNDED DATE':h.outcome_date||'—'});});}
  else if(type==='age'){cols=['BORROWER','AE ID','CREATED','DECISIONED','DAYS','OUTCOME'];var r=qrGetDateRange(qrCurrentConfig.period);anaLoanHistory.forEach(function(h){if(!h.outcome_date||!h.created_at)return;if(h.outcome_date<r.from||h.outcome_date>r.to)return;var c=new Date(h.created_at),d=new Date(h.outcome_date),days=Math.round((d-c)/(86400000));data.push({'BORROWER':qrNames(h),'AE ID':h.ae_id||'—','CREATED':h.created_at?h.created_at.split('T')[0]:'—','DECISIONED':h.outcome_date,'DAYS':days,'OUTCOME':(h.outcome||'').toUpperCase()});});}
  else if(type==='fallout'){cols=['BORROWER','AE ID','LOAN AMOUNT','OUTCOME','OUTCOME DATE','LOAN TYPE'];var r=qrGetDateRange(qrCurrentConfig.period);anaLoanHistory.forEach(function(h){if(!h.outcome||h.outcome==='funded')return;if(h.outcome_date&&(h.outcome_date<r.from||h.outcome_date>r.to))return;data.push({'BORROWER':qrNames(h),'AE ID':h.ae_id||'—','LOAN AMOUNT':'$'+Math.round(parseFloat(h.loan_amount)||0).toLocaleString(),'OUTCOME':h.outcome.toUpperCase(),'OUTCOME DATE':h.outcome_date||'—','LOAN TYPE':h.transaction_type||'—'});});}
  else if(type==='archive'){return qrRunArchiveReport();}
  qrResultData=data;qrResultColumns=cols;qrRenderResults(data,cols);
}

function qrRenderResults(data,cols){
  var p=document.getElementById('anaResultsPanel');p.style.display='block';
  document.getElementById('anaResultsStatus').textContent=data.length+' RECORDS';
  document.getElementById('anaResultCount2').textContent=data.length+' RECORDS';
  document.getElementById('anaSearchBox').value='';
  var h='<table class="mc-table"><thead><tr>';
  cols.forEach(function(c){h+='<th>'+c+'<div class="col-filter"><input placeholder="Filter..." oninput="qrFilterColumn()"></div></th>';});
  h+='</tr></thead><tbody>';
  data.forEach(function(row){h+='<tr>';cols.forEach(function(c){var v=row[c]!==undefined?row[c]:'—';var cls='';if(c==='BORROWER'||c==='NAME')cls='cell-name';else if(c.indexOf('AMOUNT')>=0||c.indexOf('SAVINGS')>=0)cls='cell-money';else if(c.indexOf('RATE')>=0||c==='SPREAD')cls='cell-rate';else if(c==='OUTCOME'){var lv=(''+v).toLowerCase();v='<span class="cell-tag '+(lv==='funded'?'funded':'denied')+'">'+v+'</span>';cls='';}else if(c==='TYPE'){v='<span class="cell-tag ct-active">'+v+'</span>';cls='';}h+='<td class="'+cls+'">'+v+'</td>';});h+='</tr>';});
  h+='</tbody></table>';document.getElementById('anaResultsTable').innerHTML=h;
  var ta=0,rs=0,rc=0;data.forEach(function(d){if(d._amt)ta+=d._amt;if(d._rate){rs+=d._rate;rc++;}});
  var f='';if(ta>0)f+='TOTAL: <span style="color:#22c55e;font-weight:700;">$'+Math.round(ta).toLocaleString()+'</span>';
  if(rc>0)f+=(f?' · ':'')+' AVG RATE: <span style="color:#3b82f6;font-weight:700;">'+(rs/rc).toFixed(3)+'%</span>';
  document.getElementById('anaResultsFooter').innerHTML=f;
  p.scrollIntoView({behavior:'smooth',block:'start'});
}

function qrFilterColumn(){var t=document.querySelector('#anaResultsTable table');if(!t)return;var f=[];t.querySelectorAll('thead input').forEach(function(i){f.push(i.value.toLowerCase());});t.querySelectorAll('tbody tr').forEach(function(tr){var show=true;tr.querySelectorAll('td').forEach(function(td,i){if(f[i]&&td.textContent.toLowerCase().indexOf(f[i])<0)show=false;});tr.style.display=show?'':'none';});document.getElementById('anaResultCount2').textContent=t.querySelectorAll('tbody tr:not([style*="display: none"])').length+' RECORDS';}

function anaFilterResults(){var q=document.getElementById('anaSearchBox').value.toLowerCase();var t=document.querySelector('#anaResultsTable table');if(!t)return;t.querySelectorAll('tbody tr').forEach(function(tr){tr.style.display=tr.textContent.toLowerCase().indexOf(q)>=0?'':'none';});document.getElementById('anaResultCount2').textContent=t.querySelectorAll('tbody tr:not([style*="display: none"])').length+' RECORDS';}

function anaSaveQuickReport(){var name=prompt('Name this report:');if(!name)return;qrUserReports.push({id:'user_'+Date.now(),name:name,config:JSON.parse(JSON.stringify(qrCurrentConfig)),type:qrCurrentType});localStorage.setItem('ae_user_reports',JSON.stringify(qrUserReports));qrLoadUserReports();showToast('Report saved: '+name);}

function anaExportCSV(){var t=document.querySelector('#anaResultsTable table');if(!t)return;var csv='';t.querySelectorAll('tr').forEach(function(tr){if(tr.style.display==='none')return;var row=[];tr.querySelectorAll('th,td').forEach(function(cell){row.push('"'+cell.textContent.replace(/"/g,'""').replace(/Filter\.\.\./g,'')+'"');});csv+=row.join(',')+'\n';});var blob=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='agent-edge-report.csv';a.click();}



// ===== COMPLIANCE ARCHIVE REPORT =====
async function qrRunArchiveReport() {
  var fromEl = document.getElementById('qrArchiveFrom');
  var toEl = document.getElementById('qrArchiveTo');
  if (!fromEl || !toEl || !fromEl.value || !toEl.value) {
    showToast('Select a date range');
    return;
  }

  var p = document.getElementById('anaResultsPanel');
  p.style.display = 'block';
  document.getElementById('anaResultsStatus').textContent = 'LOADING...';
  document.getElementById('anaResultsTable').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Fetching archived orders...</div>';

  try {
    var resp = await fetch(API_BASE + '/cron-archive?action=query&start=' + fromEl.value + '&end=' + toEl.value);
    var data = await resp.json();

    if (!data.success) {
      document.getElementById('anaResultsTable').innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">Error: ' + (data.error || 'Unknown') + '</div>';
      return;
    }

    var orders = data.orders || [];
    var cols = ['ORDER ID', 'DATE', 'PARTNER', 'EMAIL', 'BROKERAGE', 'ITEMS', 'STATUS', 'ARCHIVED'];
    var rows = [];

    orders.forEach(function(o) {
      var itemList = '';
      try {
        var parsed = JSON.parse(o.items || o.cartJson || '{}');
        if (parsed.advisory) parsed.advisory.forEach(function(i) { itemList += i.name + ', '; });
        if (parsed.marketing) parsed.marketing.forEach(function(i) { itemList += i.name + ', '; });
        itemList = itemList.replace(/, $/, '') || (o.itemCount + ' items');
      } catch (e) { itemList = o.itemCount + ' items'; }

      rows.push({
        'ORDER ID': o.orderId,
        'DATE': o.timestamp ? o.timestamp.split('T')[0] : '—',
        'PARTNER': o.name || '—',
        'EMAIL': o.email || '—',
        'BROKERAGE': o.brokerage || '—',
        'ITEMS': itemList,
        'STATUS': (o.status || '').toUpperCase(),
        'ARCHIVED': o.archivedAt ? o.archivedAt.split('T')[0] : '—'
      });
    });

    document.getElementById('anaResultsStatus').textContent = rows.length + ' ARCHIVED ORDERS';
    document.getElementById('anaResultCount2').textContent = rows.length + ' RECORDS';
    qrResultData = rows;
    qrResultColumns = cols;
    qrRenderResults(rows, cols);

  } catch (err) {
    document.getElementById('anaResultsTable').innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">Failed to fetch archive: ' + err.message + '</div>';
  }
}
