// ===== CALENDAR =====
var calYear = new Date().getFullYear();
var calMonth = new Date().getMonth(); // 0-indexed

var CAL_DATE_CONFIG = {
  date_closing:      { label: 'Closing', cls: 'critical', priority: 1 },
  date_final_cd:     { label: 'Final CD', cls: 'critical', priority: 2 },
  date_contract_exp: { label: 'Contract Exp', cls: 'critical', priority: 3 },
  date_ctc:          { label: 'CTC', cls: 'warning', priority: 4 },
  date_conditional:  { label: 'Conditional', cls: 'warning', priority: 5 },
  date_emd:          { label: 'EMD', cls: 'info', priority: 6 },
  date_appraisal:    { label: 'Appraisal', cls: 'info', priority: 7 },
  date_inspection:   { label: 'Inspection', cls: 'info', priority: 8 }
};

// Rescission calculation: 3 business days after signing (exclude Sundays & federal holidays)
function calcRescissionEnd(signDateStr) {
  var d = new Date(signDateStr + 'T00:00:00');
  var bizDays = 0;
  while (bizDays < 3) {
    d.setDate(d.getDate() + 1);
    if (isTRIDBusinessDay(d)) bizDays++;
  }
  return d;
}

function getRefiCutoffDate(year, month) {
  // Find the last day you can sign a refi and have rescission clear within the same month
  var lastDay = new Date(year, month + 1, 0); // last day of month
  var lastDayNum = lastDay.getDate();
  // Work backwards from last day of month
  for (var day = lastDayNum; day >= 1; day--) {
    var signDate = year + '-' + String(month + 1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    var rescEnd = calcRescissionEnd(signDate);
    // Does rescission end within this same month?
    if (rescEnd.getFullYear() === year && rescEnd.getMonth() === month) {
      return signDate;
    }
  }
  return null;
}

function calPrevMonth() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function calNextMonth() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }
function calToday() { var n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth(); renderCalendar(); }

function getLoanDisplayName(loan) {
  // Try to get a short borrower name
  if (loan._borrowers && loan._borrowers.length) {
    var primary = loan._borrowers.find(function(b) { return b.role === 'primary'; }) || loan._borrowers[0];
    if (primary && primary.name) {
      var parts = primary.name.split(' ');
      return parts.length > 1 ? parts[parts.length - 1] : parts[0];
    }
  }
  if (loan.subject_street) return loan.subject_street.substring(0, 15);
  return loan.ae_id.substring(0, 8);
}

function gatherCalendarEvents() {
  var events = {}; // keyed by YYYY-MM-DD
  pipelineLoans.forEach(function(loan) {
    if (loan.pipeline_stage === 'closed' || loan.pipeline_stage === 'archived') return;
    var loanName = getLoanDisplayName(loan);
    Object.keys(CAL_DATE_CONFIG).forEach(function(col) {
      var val = loan[col];
      if (!val) return;
      var cfg = CAL_DATE_CONFIG[col];
      if (!events[val]) events[val] = [];
      events[val].push({
        label: cfg.label,
        loanName: loanName,
        cls: cfg.cls,
        priority: cfg.priority,
        aeId: loan.ae_id,
        col: col
      });
    });
  });
  // Sort events within each day by priority
  Object.keys(events).forEach(function(d) {
    events[d].sort(function(a, b) { return a.priority - b.priority; });
  });
  return events;
}

function renderCalendar() {
  // Ensure pipeline data is loaded
  if (!pipelineLoaded) {
    loadPipeline();
    setTimeout(renderCalendar, 500);
    return;
  }

  var months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  document.getElementById('calMonthLabel').textContent = months[calMonth] + ' ' + calYear;

  var events = gatherCalendarEvents();
  var today = new Date(); today.setHours(0,0,0,0);
  var todayStr = today.toISOString().slice(0,10);

  // Calculate refi cutoff for visible months
  var refiCutoffs = {};
  // Current month
  var cutoff = getRefiCutoffDate(calYear, calMonth);
  if (cutoff) refiCutoffs[cutoff] = true;
  // Prev month (may show in grid)
  var pm = calMonth === 0 ? 11 : calMonth - 1;
  var py = calMonth === 0 ? calYear - 1 : calYear;
  var cutoffPrev = getRefiCutoffDate(py, pm);
  if (cutoffPrev) refiCutoffs[cutoffPrev] = true;
  // Next month (may show in grid)
  var nm = calMonth === 11 ? 0 : calMonth + 1;
  var ny = calMonth === 11 ? calYear + 1 : calYear;
  var cutoffNext = getRefiCutoffDate(ny, nm);
  if (cutoffNext) refiCutoffs[cutoffNext] = true;

  // Build calendar grid
  var firstDay = new Date(calYear, calMonth, 1);
  var startDow = firstDay.getDay(); // 0=Sun
  var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  var prevMonthDays = new Date(calYear, calMonth, 0).getDate();

  var html = '';
  var dayNum = 1;
  var nextNum = 1;
  var totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  for (var i = 0; i < totalCells; i++) {
    if (i % 7 === 0) html += '<div class="cal-week">';

    var isOutside = false;
    var displayNum;
    var dateStr;

    if (i < startDow) {
      // Previous month
      displayNum = prevMonthDays - startDow + i + 1;
      var pm = calMonth === 0 ? 11 : calMonth - 1;
      var py = calMonth === 0 ? calYear - 1 : calYear;
      dateStr = py + '-' + String(pm + 1).padStart(2,'0') + '-' + String(displayNum).padStart(2,'0');
      isOutside = true;
    } else if (dayNum > daysInMonth) {
      // Next month
      displayNum = nextNum++;
      var nm = calMonth === 11 ? 0 : calMonth + 1;
      var ny = calMonth === 11 ? calYear + 1 : calYear;
      dateStr = ny + '-' + String(nm + 1).padStart(2,'0') + '-' + String(displayNum).padStart(2,'0');
      isOutside = true;
    } else {
      displayNum = dayNum;
      dateStr = calYear + '-' + String(calMonth + 1).padStart(2,'0') + '-' + String(dayNum).padStart(2,'0');
      dayNum++;
    }

    var isToday = dateStr === todayStr;
    var isRefiCutoff = refiCutoffs[dateStr] || false;
    var cls = 'cal-day' + (isOutside ? ' outside' : '') + (isToday ? ' today' : '') + (isRefiCutoff ? ' refi-cutoff' : '');

    html += '<div class="' + cls + '">';
    html += '<div class="cal-day-num">' + displayNum + '</div>';

    // Refi cutoff tag
    if (isRefiCutoff && !isOutside) {
      html += '<div class="cal-refi-tag">REFI CUTOFF</div>';
    }

    // Render events for this date
    var dayEvents = events[dateStr] || [];
    var maxShow = 3;
    dayEvents.slice(0, maxShow).forEach(function(ev) {
      html += '<div class="cal-event ' + ev.cls + '" onclick="calEventClick(\'' + ev.aeId + '\')" title="' + ev.loanName + ' — ' + ev.label + '">';
      html += ev.label + ' · ' + ev.loanName;
      html += '</div>';
    });
    if (dayEvents.length > maxShow) {
      html += '<div style="font-size:9px;color:var(--text-muted);padding:1px 5px;">+' + (dayEvents.length - maxShow) + ' more</div>';
    }

    html += '</div>';
    if (i % 7 === 6) html += '</div>';
  }

  document.getElementById('calBody').innerHTML = html;

  // Render upcoming deadlines
  renderUpcoming(events, todayStr);
}

function renderUpcoming(events, todayStr) {
  var upcoming = [];
  var today = new Date(todayStr + 'T00:00:00');

  Object.keys(events).forEach(function(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var diff = Math.round((d - today) / 86400000);
    if (diff >= 0 && diff <= 14) {
      events[dateStr].forEach(function(ev) {
        upcoming.push({ date: dateStr, diff: diff, label: ev.label, loanName: ev.loanName, cls: ev.cls, aeId: ev.aeId, priority: ev.priority });
      });
    }
  });

  upcoming.sort(function(a, b) { return a.diff === b.diff ? a.priority - b.priority : a.diff - b.diff; });

  var container = document.getElementById('calUpcoming');
  if (upcoming.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">No deadlines in the next 14 days</div>';
    return;
  }

  var html = '';
  upcoming.forEach(function(u) {
    var d = new Date(u.date + 'T00:00:00');
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dateLabel = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
    var diffLabel = u.diff === 0 ? 'TODAY' : u.diff === 1 ? 'TOMORROW' : u.diff + ' days';
    var dotColor = u.cls === 'critical' ? '#ef4444' : u.cls === 'warning' ? '#f59e0b' : u.cls === 'info' ? '#3b82f6' : '#6e7f77';
    var badgeBg = u.diff === 0 ? 'rgba(239,68,68,0.15)' : u.diff <= 3 ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.03)';
    var badgeColor = u.diff === 0 ? '#ef4444' : u.diff <= 3 ? '#f59e0b' : 'var(--text-muted)';

    html += '<div class="cal-upcoming-row" onclick="calEventClick(\'' + u.aeId + '\')" style="cursor:pointer;">';
    html += '<span class="cal-upcoming-dot" style="background:' + dotColor + ';"></span>';
    html += '<span class="cal-upcoming-date">' + dateLabel + '</span>';
    html += '<span class="cal-upcoming-label">' + u.label + '</span>';
    html += '<span class="cal-upcoming-loan">' + u.loanName + '</span>';
    html += '<span class="cal-upcoming-badge" style="background:' + badgeBg + ';color:' + badgeColor + ';">' + diffLabel + '</span>';
    html += '</div>';
  });

  container.innerHTML = html;
}

function calEventClick(aeId) {
  // Navigate to pipeline and open the face card
  switchView('pipeline', document.querySelector('.nav-item[onclick*="pipeline"]'));
  setTimeout(function() { openFaceCard(aeId); }, 300);
}

