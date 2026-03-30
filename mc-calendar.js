// ===== FULL CALENDAR — Agent Edge =====
var calYear = new Date().getFullYear();
var calMonth = new Date().getMonth();

// Category configuration with colors
var CAL_CATEGORIES = {
  loan_pipeline: { label: 'Loan Pipeline', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  booking:       { label: 'Booking',       color: '#6e7f77', bg: 'rgba(110,127,119,0.15)' },
  webinar:       { label: 'Webinar',       color: '#0d9488', bg: 'rgba(13,148,136,0.15)' },
  personal:      { label: 'Personal',      color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  out_of_office:  { label: 'Out of Office', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  realtor:       { label: 'Realtor',       color: '#2563eb', bg: 'rgba(37,99,235,0.15)' },
  prospecting:   { label: 'Prospecting',   color: '#ea580c', bg: 'rgba(234,88,12,0.15)' },
  training:      { label: 'Training',      color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  deadline:      { label: 'Deadline',      color: '#e11d48', bg: 'rgba(225,29,72,0.15)' },
  blocked_time:  { label: 'Blocked Time',  color: '#4b5563', bg: 'rgba(75,85,99,0.15)' }
};

// Existing pipeline date config (preserved from original)
var CAL_DATE_CONFIG = {
  date_closing:      { label: 'Closing', priority: 1 },
  date_final_cd:     { label: 'Final CD', priority: 2 },
  date_contract_exp: { label: 'Contract Exp', priority: 3 },
  date_ctc:          { label: 'CTC', priority: 4 },
  date_conditional:  { label: 'Conditional', priority: 5 },
  date_emd:          { label: 'EMD', priority: 6 },
  date_appraisal:    { label: 'Appraisal', priority: 7 },
  date_inspection:   { label: 'Inspection', priority: 8 }
};

// State
var calEvents = [];
var calBookings = [];
var calWebinars = [];
var calFilters = {};
var calDataLoaded = false;

// Initialize all filters as visible
Object.keys(CAL_CATEGORIES).forEach(function(k) { calFilters[k] = true; });

// ===== DATA LOADING =====
function calLoadData(cb) {
  var API = 'https://agent-edge-backend.vercel.app/api';
  var loaded = 0;
  var total = 3;
  function done() { loaded++; if (loaded >= total) { calDataLoaded = true; if (cb) cb(); } }

  fetch(API + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_calendar_events', start_date: '2020-01-01', end_date: '2030-12-31' })
  }).then(function(r) { return r.json(); }).then(function(d) {
    calEvents = d.events || [];
    done();
  }).catch(function() { done(); });

  fetch(API + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_bookings_full', start_date: '2020-01-01', end_date: '2030-12-31' })
  }).then(function(r) { return r.json(); }).then(function(d) {
    calBookings = d.bookings || [];
    done();
  }).catch(function() { done(); });

  fetch(API + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_webinars', lo_user_id: 'default' })
  }).then(function(r) { return r.json(); }).then(function(d) {
    calWebinars = (d.webinars || []).filter(function(w) { return w.webinar_date; });
    done();
  }).catch(function() { done(); });
}

// ===== RESCISSION (preserved) =====
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
  var lastDay = new Date(year, month + 1, 0);
  var lastDayNum = lastDay.getDate();
  for (var day = lastDayNum; day >= 1; day--) {
    var signDate = year + '-' + String(month + 1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    var rescEnd = calcRescissionEnd(signDate);
    if (rescEnd.getFullYear() === year && rescEnd.getMonth() === month) return signDate;
  }
  return null;
}

// ===== NAVIGATION =====
function calPrevMonth() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function calNextMonth() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }
function calToday() { var n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth(); renderCalendar(); }

// ===== TOGGLE CATEGORY FILTER =====
function calToggleFilter(cat) {
  calFilters[cat] = !calFilters[cat];
  var chip = document.getElementById('calFilter_' + cat);
  if (chip) chip.classList.toggle('cal-filter-off', !calFilters[cat]);
  renderCalendar();
}

// ===== GATHER ALL EVENTS =====
function gatherAllEvents() {
  var events = {};

  function addEvent(dateStr, evt) {
    if (!events[dateStr]) events[dateStr] = [];
    events[dateStr].push(evt);
  }

  // 1) Pipeline loans
  if (calFilters.loan_pipeline && typeof pipelineLoans !== 'undefined') {
    pipelineLoans.forEach(function(loan) {
      if (loan.pipeline_stage === 'closed' || loan.pipeline_stage === 'archived') return;
      var loanName = getLoanDisplayName(loan);
      Object.keys(CAL_DATE_CONFIG).forEach(function(col) {
        var val = loan[col];
        if (!val) return;
        var cfg = CAL_DATE_CONFIG[col];
        addEvent(val, {
          id: loan.ae_id + '_' + col,
          title: cfg.label + ' — ' + loanName,
          category: 'loan_pipeline',
          time: null,
          allDay: true,
          sourceType: 'pipeline',
          sourceId: loan.ae_id,
          col: col,
          priority: cfg.priority
        });
      });
    });
  }

  // 2) Bookings
  if (calFilters.booking) {
    calBookings.forEach(function(bk) {
      var name = ((bk.first_name || '') + ' ' + (bk.last_name || '')).trim() || bk.email || 'Booking';
      addEvent(bk.booking_date, {
        id: 'bk_' + bk.id,
        title: name,
        category: 'booking',
        time: bk.booking_time,
        allDay: false,
        sourceType: 'booking',
        sourceId: bk.id,
        sourceData: bk
      });
    });
  }

  // 3) Webinars
  if (calFilters.webinar) {
    calWebinars.forEach(function(w) {
      addEvent(w.webinar_date, {
        id: 'wb_' + w.id,
        title: w.title || 'Webinar',
        category: 'webinar',
        time: w.webinar_time || null,
        allDay: !w.webinar_time,
        sourceType: 'webinar',
        sourceId: w.id,
        sourceData: w
      });
    });
  }

  // 4) Calendar events (including recurring generation)
  calEvents.forEach(function(ev) {
    if (!calFilters[ev.category]) return;
    var repeatType = ev.repeat_type || 'none';

    if (repeatType === 'none') {
      // Single event
      addEvent(ev.event_date, {
        id: 'ce_' + ev.id,
        title: ev.title,
        category: ev.category,
        time: ev.start_time || null,
        endTime: ev.end_time || null,
        allDay: ev.all_day || false,
        notes: ev.notes || '',
        reminder: ev.reminder || false,
        sourceType: 'calendar_event',
        sourceId: ev.id,
        sourceData: ev
      });
    } else {
      // Recurring — generate occurrences for the visible month range
      var viewStart = new Date(calYear, calMonth - 1, 1);
      var viewEnd = new Date(calYear, calMonth + 2, 0);
      var evStart = new Date(ev.event_date + 'T00:00:00');
      var evEnd = ev.repeat_end ? new Date(ev.repeat_end + 'T23:59:59') : new Date(calYear + 1, 11, 31);
      var current = new Date(evStart);
      var safety = 0;

      while (current <= viewEnd && current <= evEnd && safety < 500) {
        safety++;
        if (current >= viewStart && current >= evStart) {
          var dateStr = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-' + String(current.getDate()).padStart(2, '0');
          var dayOfWeek = current.getDay();

          // Skip weekends for weekday recurrence
          if (repeatType === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
            current.setDate(current.getDate() + 1);
            continue;
          }

          addEvent(dateStr, {
            id: 'ce_' + ev.id + '_' + dateStr,
            title: ev.title,
            category: ev.category,
            time: ev.start_time || null,
            endTime: ev.end_time || null,
            allDay: ev.all_day || false,
            notes: ev.notes || '',
            reminder: ev.reminder || false,
            sourceType: 'calendar_event',
            sourceId: ev.id,
            sourceData: ev,
            isRecurring: true,
            occurrenceDate: dateStr
          });
        }

        // Advance to next occurrence
        if (repeatType === 'daily' || repeatType === 'weekdays') {
          current.setDate(current.getDate() + 1);
        } else if (repeatType === 'weekly') {
          current.setDate(current.getDate() + 7);
        } else if (repeatType === 'biweekly') {
          current.setDate(current.getDate() + 14);
        } else if (repeatType === 'monthly') {
          current.setMonth(current.getMonth() + 1);
        }
      }
    }
  });

  // Sort each day
  Object.keys(events).forEach(function(d) {
    events[d].sort(function(a, b) {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.priority && b.priority) return a.priority - b.priority;
      return 0;
    });
  });

  return events;
}

// ===== FORMAT TIME =====
function calFormatTime(timeStr) {
  if (!timeStr) return '';
  var parts = timeStr.split(':');
  var hr = parseInt(parts[0]);
  var min = parts[1] || '00';
  var ampm = hr >= 12 ? 'p' : 'a';
  var hr12 = hr > 12 ? hr - 12 : (hr === 0 ? 12 : hr);
  return hr12 + ':' + min + ampm;
}

// ===== GET DISPLAY NAME (preserved) =====
function getLoanDisplayName(loan) {
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

// ===== RENDER CALENDAR =====
function renderCalendar() {
  if (!calDataLoaded) {
    calLoadData(renderCalendar);
    if (typeof pipelineLoaded !== 'undefined' && !pipelineLoaded && typeof loadPipeline === 'function') {
      loadPipeline();
    }
    return;
  }
  if (typeof pipelineLoaded !== 'undefined' && !pipelineLoaded) {
    if (typeof loadPipeline === 'function') loadPipeline();
    setTimeout(renderCalendar, 500);
    return;
  }

  var months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  document.getElementById('calMonthLabel').textContent = months[calMonth] + ' ' + calYear;

  var allEvents = gatherAllEvents();
  var today = new Date(); today.setHours(0,0,0,0);
  var todayStr = today.toISOString().slice(0,10);

  // Refi cutoffs
  var refiCutoffs = {};
  var cutoff = getRefiCutoffDate(calYear, calMonth);
  if (cutoff) refiCutoffs[cutoff] = true;
  var ppm = calMonth === 0 ? 11 : calMonth - 1;
  var ppy = calMonth === 0 ? calYear - 1 : calYear;
  var cutoffPrev = getRefiCutoffDate(ppy, ppm);
  if (cutoffPrev) refiCutoffs[cutoffPrev] = true;
  var nnm = calMonth === 11 ? 0 : calMonth + 1;
  var nny = calMonth === 11 ? calYear + 1 : calYear;
  var cutoffNext = getRefiCutoffDate(nny, nnm);
  if (cutoffNext) refiCutoffs[cutoffNext] = true;

  // Build grid
  var firstDay = new Date(calYear, calMonth, 1);
  var startDow = firstDay.getDay();
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
      displayNum = prevMonthDays - startDow + i + 1;
      var pm = calMonth === 0 ? 11 : calMonth - 1;
      var py = calMonth === 0 ? calYear - 1 : calYear;
      dateStr = py + '-' + String(pm + 1).padStart(2,'0') + '-' + String(displayNum).padStart(2,'0');
      isOutside = true;
    } else if (dayNum > daysInMonth) {
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

    html += '<div class="' + cls + '" onclick="calDayClick(\'' + dateStr + '\')" style="cursor:pointer;">';
    html += '<div class="cal-day-num">' + displayNum + '</div>';

    if (isRefiCutoff && !isOutside) {
      html += '<div class="cal-refi-tag">REFI CUTOFF</div>';
    }

    var dayEvents = allEvents[dateStr] || [];
    var maxShow = 3;
    dayEvents.slice(0, maxShow).forEach(function(ev) {
      var cat = CAL_CATEGORIES[ev.category] || CAL_CATEGORIES.personal;
      var timeLabel = ev.time ? calFormatTime(ev.time) + ' ' : '';
      html += '<div class="cal-event-item" style="background:' + cat.bg + ';color:' + cat.color + ';border-left:2px solid ' + cat.color + ';" onclick="event.stopPropagation();calEventClick(\'' + ev.id + '\',\'' + dateStr + '\')" title="' + (timeLabel + ev.title).replace(/"/g, '&quot;') + '">';
      html += timeLabel + ev.title;
      html += '</div>';
    });
    if (dayEvents.length > maxShow) {
      html += '<div style="font-size:9px;color:var(--text-muted);padding:1px 5px;">+' + (dayEvents.length - maxShow) + ' more</div>';
    }

    html += '</div>';
    if (i % 7 === 6) html += '</div>';
  }

  document.getElementById('calBody').innerHTML = html;
  renderUpcoming(allEvents, todayStr);
}

// ===== UPCOMING =====
function renderUpcoming(events, todayStr) {
  var upcoming = [];
  var today = new Date(todayStr + 'T00:00:00');

  Object.keys(events).forEach(function(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var diff = Math.round((d - today) / 86400000);
    if (diff >= 0 && diff <= 14) {
      events[dateStr].forEach(function(ev) {
        upcoming.push({ date: dateStr, diff: diff, title: ev.title, category: ev.category, time: ev.time, id: ev.id, allDay: ev.allDay });
      });
    }
  });

  upcoming.sort(function(a, b) {
    if (a.diff !== b.diff) return a.diff - b.diff;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return 0;
  });

  var container = document.getElementById('calUpcoming');
  if (upcoming.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">No events in the next 14 days</div>';
    return;
  }

  var html = '';
  upcoming.forEach(function(u) {
    var d = new Date(u.date + 'T00:00:00');
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var mons = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dateLabel = days[d.getDay()] + ', ' + mons[d.getMonth()] + ' ' + d.getDate();
    var diffLabel = u.diff === 0 ? 'TODAY' : u.diff === 1 ? 'TOMORROW' : u.diff + ' days';
    var cat = CAL_CATEGORIES[u.category] || CAL_CATEGORIES.personal;
    var badgeBg = u.diff === 0 ? 'rgba(239,68,68,0.15)' : u.diff <= 3 ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.03)';
    var badgeColor = u.diff === 0 ? '#ef4444' : u.diff <= 3 ? '#f59e0b' : 'var(--text-muted)';
    var timeStr = u.time ? calFormatTime(u.time) : 'All day';

    html += '<div class="cal-upcoming-row" onclick="calDayClick(\'' + u.date + '\')" style="cursor:pointer;">';
    html += '<span class="cal-upcoming-dot" style="background:' + cat.color + ';"></span>';
    html += '<span class="cal-upcoming-date">' + dateLabel + '</span>';
    html += '<span class="cal-upcoming-time">' + timeStr + '</span>';
    html += '<span class="cal-upcoming-label">' + u.title + '</span>';
    html += '<span class="cal-upcoming-badge" style="background:' + badgeBg + ';color:' + badgeColor + ';">' + diffLabel + '</span>';
    html += '</div>';
  });

  container.innerHTML = html;
}

// ===== DAY CLICK — Detail modal =====
function calDayClick(dateStr) {
  var allEvents = gatherAllEvents();
  var dayEvents = allEvents[dateStr] || [];
  var d = new Date(dateStr + 'T00:00:00');
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var mons = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dayTitle = days[d.getDay()] + ', ' + mons[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();

  var html = '<div class="cal-modal-overlay" onclick="calCloseModal()">';
  html += '<div class="cal-modal" onclick="event.stopPropagation()">';
  html += '<div class="cal-modal-header">';
  html += '<div class="cal-modal-title">' + dayTitle + '</div>';
  html += '<div class="cal-modal-close" onclick="calCloseModal()">&times;</div>';
  html += '</div>';

  html += '<div style="padding:0 20px 12px;"><button class="cal-add-btn" onclick="calOpenEventForm(\'' + dateStr + '\')"><i class="fas fa-plus" style="margin-right:6px;"></i>Add Event</button></div>';

  if (dayEvents.length === 0) {
    html += '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No events this day</div>';
  } else {
    html += '<div class="cal-day-events">';
    dayEvents.forEach(function(ev) {
      var cat = CAL_CATEGORIES[ev.category] || CAL_CATEGORIES.personal;
      var timeLabel = ev.time ? calFormatTime(ev.time) : 'All day';
      if (ev.time && ev.endTime) timeLabel += ' – ' + calFormatTime(ev.endTime);

      html += '<div class="cal-day-event-row">';
      html += '<div class="cal-day-event-dot" style="background:' + cat.color + ';"></div>';
      html += '<div class="cal-day-event-body">';
      html += '<div class="cal-day-event-title">' + ev.title + '</div>';
      html += '<div class="cal-day-event-meta">' + timeLabel + ' &middot; ' + cat.label + '</div>';
      if (ev.notes) html += '<div class="cal-day-event-notes">' + ev.notes + '</div>';

      if (ev.sourceType === 'calendar_event') {
        html += '<div class="cal-day-event-actions">';
        html += '<button class="cal-action-btn" onclick="calEditEvent(' + ev.sourceId + ')"><i class="fas fa-pen"></i> Edit</button>';
        html += '<button class="cal-action-btn cal-action-delete" onclick="calDeleteEvent(' + ev.sourceId + ')"><i class="fas fa-trash"></i> Delete</button>';
        html += '</div>';
      }
      if (ev.sourceType === 'booking') {
        html += '<div class="cal-day-event-meta" style="margin-top:4px;">';
        if (ev.sourceData) {
          if (ev.sourceData.email) html += ev.sourceData.email + '<br>';
          if (ev.sourceData.phone) html += ev.sourceData.phone;
        }
        html += '</div>';
        html += '<div class="cal-day-event-actions">';
        html += '<button class="cal-action-btn cal-action-delete" onclick="calCancelBooking(' + ev.sourceId + ')"><i class="fas fa-times"></i> Cancel Booking</button>';
        html += '</div>';
      }
      if (ev.sourceType === 'pipeline') {
        html += '<div class="cal-day-event-actions">';
        html += '<button class="cal-action-btn" onclick="calCloseModal();switchView(\'pipeline\',document.querySelector(\'.nav-item[onclick*=pipeline]\'));setTimeout(function(){openFaceCard(\'' + ev.sourceId + '\');},300);"><i class="fas fa-external-link-alt"></i> Open Loan</button>';
        html += '</div>';
      }

      html += '</div></div>';
    });
    html += '</div>';
  }

  html += '</div></div>';

  var existing = document.getElementById('calModalContainer');
  if (existing) existing.remove();

  var container = document.createElement('div');
  container.id = 'calModalContainer';
  container.innerHTML = html;
  document.body.appendChild(container);
}

function calCloseModal() {
  var el = document.getElementById('calModalContainer');
  if (el) el.remove();
}

function calEventClick(evId, dateStr) {
  calDayClick(dateStr);
}

// ===== ADD/EDIT EVENT FORM =====
function calOpenEventForm(dateStr, existingEvent) {
  var isEdit = !!existingEvent;
  var ev = existingEvent || { title: '', event_date: dateStr, start_time: '', end_time: '', all_day: false, category: 'personal', notes: '', reminder: false };

  var html = '<div class="cal-modal-overlay" onclick="calCloseModal()">';
  html += '<div class="cal-modal" onclick="event.stopPropagation()" style="max-width:440px;">';
  html += '<div class="cal-modal-header">';
  html += '<div class="cal-modal-title">' + (isEdit ? 'Edit Event' : 'New Event') + '</div>';
  html += '<div class="cal-modal-close" onclick="calCloseModal()">&times;</div>';
  html += '</div>';

  html += '<div style="padding:16px 20px;">';

  html += '<label class="cal-form-label">Title</label>';
  html += '<input type="text" id="calEvTitle" class="cal-form-input" value="' + (ev.title || '').replace(/"/g, '&quot;') + '" placeholder="Event title">';

  html += '<label class="cal-form-label">Date</label>';
  html += '<input type="date" id="calEvDate" class="cal-form-input" value="' + (ev.event_date || dateStr) + '">';

  html += '<label class="cal-form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
  html += '<input type="checkbox" id="calEvAllDay" ' + (ev.all_day ? 'checked' : '') + ' onchange="calToggleAllDay()"> All day event</label>';

  html += '<div id="calEvTimeFields" style="' + (ev.all_day ? 'display:none;' : '') + '">';
  html += '<div style="display:flex;gap:12px;">';
  html += '<div style="flex:1;"><label class="cal-form-label">Start Time</label>';
  html += '<input type="time" id="calEvStart" class="cal-form-input" value="' + (ev.start_time || '') + '"></div>';
  html += '<div style="flex:1;"><label class="cal-form-label">End Time</label>';
  html += '<input type="time" id="calEvEnd" class="cal-form-input" value="' + (ev.end_time || '') + '"></div>';
  html += '</div></div>';

  html += '<label class="cal-form-label">Category</label>';
  html += '<select id="calEvCategory" class="cal-form-input">';
  var userCats = ['personal','out_of_office','realtor','prospecting','training','deadline','blocked_time'];
  userCats.forEach(function(k) {
    var sel = ev.category === k ? ' selected' : '';
    html += '<option value="' + k + '"' + sel + '>' + CAL_CATEGORIES[k].label + '</option>';
  });
  html += '</select>';

  // Recurrence
  var rt = ev.repeat_type || 'none';
  html += '<label class="cal-form-label">Repeat</label>';
  html += '<select id="calEvRepeat" class="cal-form-input" onchange="calToggleRepeatEnd()">';
  html += '<option value="none"' + (rt === 'none' ? ' selected' : '') + '>Does not repeat</option>';
  html += '<option value="daily"' + (rt === 'daily' ? ' selected' : '') + '>Every day</option>';
  html += '<option value="weekdays"' + (rt === 'weekdays' ? ' selected' : '') + '>Every weekday (Mon–Fri)</option>';
  html += '<option value="weekly"' + (rt === 'weekly' ? ' selected' : '') + '>Every week</option>';
  html += '<option value="biweekly"' + (rt === 'biweekly' ? ' selected' : '') + '>Every 2 weeks</option>';
  html += '<option value="monthly"' + (rt === 'monthly' ? ' selected' : '') + '>Every month</option>';
  html += '</select>';

  html += '<div id="calEvRepeatEndWrap" style="' + (rt === 'none' ? 'display:none;' : '') + '">';
  html += '<label class="cal-form-label">End repeat <span style="color:var(--text-muted);font-weight:400;">(optional)</span></label>';
  html += '<input type="date" id="calEvRepeatEnd" class="cal-form-input" value="' + (ev.repeat_end || '') + '">';
  html += '</div>';

  html += '<label class="cal-form-label">Notes</label>';
  html += '<textarea id="calEvNotes" class="cal-form-input" rows="3" placeholder="Optional notes">' + (ev.notes || '') + '</textarea>';

  html += '<label class="cal-form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
  html += '<input type="checkbox" id="calEvReminder" ' + (ev.reminder ? 'checked' : '') + '> SMS reminder (15 min before)</label>';

  html += '<div style="display:flex;gap:10px;margin-top:16px;">';
  if (isEdit) {
    html += '<button class="cal-save-btn" onclick="calSaveEvent(' + ev.id + ')">Save Changes</button>';
  } else {
    html += '<button class="cal-save-btn" onclick="calSaveEvent(null)">Create Event</button>';
  }
  html += '<button class="cal-cancel-btn" onclick="calCloseModal()">Cancel</button>';
  html += '</div>';

  html += '</div></div></div>';

  var existing = document.getElementById('calModalContainer');
  if (existing) existing.remove();

  var container = document.createElement('div');
  container.id = 'calModalContainer';
  container.innerHTML = html;
  document.body.appendChild(container);

  document.getElementById('calEvTitle').focus();
}

function calToggleAllDay() {
  var allDay = document.getElementById('calEvAllDay').checked;
  document.getElementById('calEvTimeFields').style.display = allDay ? 'none' : '';
}

function calToggleRepeatEnd() {
  var val = document.getElementById('calEvRepeat').value;
  document.getElementById('calEvRepeatEndWrap').style.display = val === 'none' ? 'none' : '';
}

// ===== SAVE EVENT =====
function calSaveEvent(existingId) {
  var title = document.getElementById('calEvTitle').value.trim();
  if (!title) { alert('Title is required'); return; }

  var repeatType = document.getElementById('calEvRepeat').value;
  var repeatEnd = repeatType !== 'none' ? (document.getElementById('calEvRepeatEnd').value || null) : null;

  var payload = {
    action: existingId ? 'update_calendar_event' : 'create_calendar_event',
    title: title,
    event_date: document.getElementById('calEvDate').value,
    all_day: document.getElementById('calEvAllDay').checked,
    start_time: document.getElementById('calEvAllDay').checked ? null : (document.getElementById('calEvStart').value || null),
    end_time: document.getElementById('calEvAllDay').checked ? null : (document.getElementById('calEvEnd').value || null),
    category: document.getElementById('calEvCategory').value,
    notes: document.getElementById('calEvNotes').value.trim(),
    reminder: document.getElementById('calEvReminder').checked,
    repeat_type: repeatType,
    repeat_end: repeatEnd
  };

  if (existingId) payload.id = existingId;

  var API = 'https://agent-edge-backend.vercel.app/api';
  fetch(API + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      calCloseModal();
      calDataLoaded = false;
      calLoadData(function() { renderCalendar(); });
    } else {
      alert('Error: ' + (d.message || 'Failed to save'));
    }
  }).catch(function() { alert('Connection error'); });
}

// ===== EDIT EVENT =====
function calEditEvent(eventId) {
  var ev = calEvents.find(function(e) { return e.id === eventId; });
  if (!ev) return;
  calOpenEventForm(ev.event_date, ev);
}

// ===== DELETE EVENT =====
function calDeleteEvent(eventId) {
  if (!confirm('Delete this event?')) return;
  var API = 'https://agent-edge-backend.vercel.app/api';
  fetch(API + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_calendar_event', id: eventId })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      calCloseModal();
      calDataLoaded = false;
      calLoadData(function() { renderCalendar(); });
    }
  });
}

// ===== CANCEL BOOKING =====
function calCancelBooking(bookingId) {
  if (!confirm('Cancel this booking? The client will need to rebook.')) return;
  var API = 'https://agent-edge-backend.vercel.app/api';
  fetch(API + '/webinar-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel_booking', id: bookingId })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      calCloseModal();
      calDataLoaded = false;
      calLoadData(function() { renderCalendar(); });
    }
  });
}

// ===== ADD EVENT BUTTON (from topbar) =====
function calAddEvent() {
  var todayStr = new Date().toISOString().slice(0,10);
  calOpenEventForm(todayStr);
}

// ===== CALENDAR REMINDER SYSTEM =====
var calRemindersDismissed = {};
var calReminderInterval = null;
var calSmsSent = {};

function calStartReminders() {
  if (calReminderInterval) clearInterval(calReminderInterval);
  calCheckReminders();
  calReminderInterval = setInterval(calCheckReminders, 60000); // check every 60 seconds
}

function calCheckReminders() {
  var now = new Date();
  var todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  var nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Gather today's events
  var todayEvents = [];

  calEvents.forEach(function(ev) {
    if (!ev.start_time || ev.all_day) return;
    var repeatType = ev.repeat_type || 'none';

    if (repeatType === 'none') {
      if (ev.event_date === todayStr) todayEvents.push(ev);
    } else {
      // Check if this recurring event has an occurrence today
      var evStart = new Date(ev.event_date + 'T00:00:00');
      var evEnd = ev.repeat_end ? new Date(ev.repeat_end + 'T23:59:59') : new Date(now.getFullYear() + 1, 11, 31);
      var today = new Date(todayStr + 'T00:00:00');

      if (today < evStart || today > evEnd) return;

      var isOccurrence = false;
      if (repeatType === 'daily') {
        isOccurrence = true;
      } else if (repeatType === 'weekdays') {
        var dow = today.getDay();
        isOccurrence = dow >= 1 && dow <= 5;
      } else if (repeatType === 'weekly') {
        var diff = Math.round((today - evStart) / 86400000);
        isOccurrence = diff % 7 === 0;
      } else if (repeatType === 'biweekly') {
        var diff2 = Math.round((today - evStart) / 86400000);
        isOccurrence = diff2 % 14 === 0;
      } else if (repeatType === 'monthly') {
        isOccurrence = today.getDate() === evStart.getDate();
      }

      if (isOccurrence) todayEvents.push(ev);
    }
  });

  todayEvents.forEach(function(ev) {
    var parts = ev.start_time.split(':');
    var evMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    var diff = evMinutes - nowMinutes;
    var reminderId = ev.id + '_' + todayStr;

    // 15 minutes before and not yet dismissed
    if (diff > 0 && diff <= 15 && !calRemindersDismissed[reminderId]) {
      calShowReminderBanner(ev, diff, reminderId);

      // Send SMS if reminder enabled and not already sent
      if (ev.reminder && !calSmsSent[reminderId]) {
        calSmsSent[reminderId] = true;
        calSendReminderSms(ev);
      }
    }
  });
}

function calShowReminderBanner(ev, minutesLeft, reminderId) {
  // Don't show if already showing this one
  if (document.getElementById('calReminder_' + reminderId)) return;

  var catConfig = CAL_CATEGORIES[ev.category] || { label: ev.category, color: '#3b82f6' };
  var timeStr = ev.start_time ? formatCalTime(ev.start_time) : '';

  var banner = document.createElement('div');
  banner.id = 'calReminder_' + reminderId;
  banner.className = 'cal-reminder-banner';
  banner.innerHTML =
    '<div class="cal-reminder-dot" style="background:' + catConfig.color + ';"></div>' +
    '<div class="cal-reminder-content">' +
      '<div class="cal-reminder-title">' + ev.title + '</div>' +
      '<div class="cal-reminder-detail">' + catConfig.label + (timeStr ? ' — ' + timeStr : '') + ' — in ' + minutesLeft + ' min</div>' +
    '</div>' +
    '<button class="cal-reminder-dismiss" onclick="calDismissReminder(\'' + reminderId + '\')">Dismiss</button>';

  // Insert at top of body
  var container = document.getElementById('calReminderContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'calReminderContainer';
    container.className = 'cal-reminder-container';
    document.body.appendChild(container);
  }
  container.appendChild(banner);

  // Auto-dismiss after 5 minutes if not clicked
  setTimeout(function() { calDismissReminder(reminderId); }, 300000);
}

function calDismissReminder(reminderId) {
  calRemindersDismissed[reminderId] = true;
  var el = document.getElementById('calReminder_' + reminderId);
  if (el) {
    el.style.animation = 'calReminderSlideOut 0.3s ease forwards';
    setTimeout(function() { el.remove(); }, 300);
  }
}

function calSendReminderSms(ev) {
  var API = 'https://agent-edge-backend.vercel.app/api';
  fetch(API + '/webinar-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send_calendar_sms',
      title: ev.title,
      time: ev.start_time ? formatCalTime(ev.start_time) : ''
    })
  }).catch(function() {}); // fire and forget
}

function formatCalTime(t) {
  if (!t) return '';
  var parts = t.split(':');
  var h = parseInt(parts[0]);
  var m = parts[1];
  var ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return h + ':' + m + ' ' + ampm;
}

// Start reminders when calendar data is loaded
var _origCalLoadData = calLoadData;
calLoadData = function(cb) {
  _origCalLoadData(function() {
    calStartReminders();
    if (cb) cb();
  });
};
