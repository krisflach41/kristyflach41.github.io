// mc-markets.js — Markets Overview for Mission Control
// Mirrors MBS Highway layout: price cards with intraday snapshots,
// candlestick chart with moving averages + Fibonacci + support/resistance,
// stochastic oscillator, DMA toggles, time range selector

var mktsLoaded = false;
var mktsData = null;
var mktsCurrentSymbol = 'UMBS_5.5';
var mktsCurrentRange = '3mo';
var mktsRefreshTimer = null;
var mktsChartData = null;
var mktsDMA = { 200: true, 100: true, 50: true, 25: true };
var mktsDMAColors = { 200: '#2563eb', 100: '#dc2626', 50: '#0b1f3a', 25: '#ea580c' };

// ─── Load snapshot + current data ───────────────────────────────
function loadMarketsData() {
  var ts = document.getElementById('mktsTimestamp');
  if (ts) ts.textContent = 'Refreshing...';

  fetch('https://agent-edge-backend.vercel.app/api/markets')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.error) { if (ts) ts.textContent = 'Error: ' + d.error; return; }
      mktsData = d;

      var t = new Date(d.fetchedAt);
      if (ts) ts.textContent = 'Day Change: ' + t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET';

      mktsRenderPriceCards(d);
      mktsLoadChart();
    })
    .catch(function(err) {
      if (ts) ts.textContent = 'Error: ' + err.message;
    });
}

// ─── Format helpers ─────────────────────────────────────────────
function mktsBpSpan(bps, inverted) {
  // inverted: true for yields (up = bad = red)
  var isUp = bps > 0;
  var color = inverted ? (isUp ? '#dc2626' : '#16a34a') : (isUp ? '#16a34a' : '#dc2626');
  if (bps === 0) color = '#0b1f3a';
  var arrow = isUp ? '▲' : (bps < 0 ? '▼' : '');
  return '<span style="color:' + color + ';font-weight:700;">' + Math.abs(bps) + 'bp ' + arrow + '</span>';
}

function mktsChangeSpan(val, suffix) {
  suffix = suffix || '';
  var isUp = val > 0;
  var color = isUp ? '#16a34a' : (val < 0 ? '#dc2626' : '#0b1f3a');
  var arrow = isUp ? '▲' : (val < 0 ? '▼' : '');
  return '<span style="color:' + color + ';font-weight:700;">' + Math.abs(val).toFixed(2) + suffix + ' ' + arrow + '</span>';
}

// ─── Render all price cards ─────────────────────────────────────
function mktsRenderPriceCards(d) {
  var snapshots = d.snapshots || {};

  // ── UMBS 5.5% (primary) ──
  var u55 = d.umbs['UMBS_5.5'];
  if (u55 && u55.price) {
    var ch55 = u55.change || 0;
    var bps55 = Math.round(Math.abs(ch55) * 100);
    document.getElementById('mktsUmbs55Price').textContent = u55.price.toFixed(2);
    document.getElementById('mktsUmbs55Bps').innerHTML = mktsBpSpan(ch55 >= 0 ? bps55 : -bps55, false);
    mktsRenderSnapshots('mktsUmbs55Snaps', snapshots['UMBS_5.5'], false);
  }

  // ── 10Y UST ──
  var t10 = d.treasuries['10Y'];
  if (t10 && t10.yield) {
    document.getElementById('mkts10YPrice').textContent = t10.yield.toFixed(4);
    document.getElementById('mkts10YBps').innerHTML = mktsBpSpan(t10.changeBps || 0, true);
    document.getElementById('mkts10YOpen').textContent = t10.previousYield ? t10.previousYield.toFixed(4) : '—';
    document.getElementById('mkts10YLast').textContent = t10.yield.toFixed(4);
    document.getElementById('mkts10YHigh').textContent = t10.yield.toFixed(4);
    document.getElementById('mkts10YLow').textContent = t10.yield.toFixed(4);
  }

  // ── SPY ──
  var spy = d.spy;
  if (spy && spy.price) {
    document.getElementById('mktsSpyPrice').textContent = spy.price.toFixed(2);
    document.getElementById('mktsSpyPts').innerHTML = mktsChangeSpan(spy.change || 0);
    document.getElementById('mktsSpyOpen').textContent = spy.open ? spy.open.toFixed(2) : '—';
    document.getElementById('mktsSpyLast').textContent = spy.price.toFixed(2);
    document.getElementById('mktsSpyHigh').textContent = spy.high ? spy.high.toFixed(2) : '—';
    document.getElementById('mktsSpyLow').textContent = spy.low ? spy.low.toFixed(2) : '—';
  }

  // ── More coupons ──
  ['UMBS_5', 'UMBS_6'].forEach(function(key) {
    var u = d.umbs[key];
    var prefix = key === 'UMBS_5' ? 'mktsUmbs5' : 'mktsUmbs6';
    if (u && u.price) {
      var ch = u.change || 0;
      var bps = Math.round(Math.abs(ch) * 100);
      document.getElementById(prefix + 'Price').textContent = u.price.toFixed(2);
      document.getElementById(prefix + 'Bps').innerHTML = mktsBpSpan(ch >= 0 ? bps : -bps, false);
      mktsRenderSnapshots(prefix + 'Snaps', snapshots[key], false);
    }
  });

  // ── More treasuries ──
  ['1Y', '2Y', '5Y', '7Y'].forEach(function(tn) {
    var td = d.treasuries[tn];
    if (td && td.yield) {
      document.getElementById('mkts' + tn + 'Price').textContent = td.yield.toFixed(4);
      document.getElementById('mkts' + tn + 'Bps').innerHTML = mktsBpSpan(td.changeBps || 0, true);
      document.getElementById('mkts' + tn + 'Open').textContent = td.previousYield ? td.previousYield.toFixed(4) : '—';
      document.getElementById('mkts' + tn + 'Last').textContent = td.yield.toFixed(4);
      document.getElementById('mkts' + tn + 'High').textContent = td.yield.toFixed(4);
      document.getElementById('mkts' + tn + 'Low').textContent = td.yield.toFixed(4);
    }
  });
}

// ─── Render intraday snapshot rows ──────────────────────────────
function mktsRenderSnapshots(containerId, snaps, inverted) {
  var el = document.getElementById(containerId);
  if (!el) return;
  if (!snaps || Object.keys(snaps).length === 0) {
    el.innerHTML = '<div style="font-size:10px;color:var(--text-muted);font-style:italic;">Snapshots build throughout the trading day</div>';
    return;
  }

  var order = ['9:30 ET', '10:30 ET', '11:00 ET', '11:30 ET',
               '11:00 ET (Yesterday)', '11:30 ET (Yesterday)',
               '10:30 ET (Yesterday)', '9:30 ET (Yesterday)'];

  var html = '';
  order.forEach(function(label) {
    if (snaps[label] !== undefined) {
      // Calculate bp change from previous snapshot or open
      // For now just show the price — bp changes will calculate once we have multiple snapshots
      var isYesterday = label.indexOf('Yesterday') !== -1;
      var displayLabel = isYesterday ? label : label;
      var style = isYesterday ? 'font-style:italic;color:var(--text-muted);' : '';
      html += '<div style="display:flex;justify-content:space-between;font-size:11px;' + style + '">' +
        '<span>' + displayLabel + '</span>' +
        '<span style="font-weight:600;">' + snaps[label].toFixed(2) + '</span></div>';
    }
  });

  el.innerHTML = html || '<div style="font-size:10px;color:var(--text-muted);font-style:italic;">No snapshots yet today</div>';
}

// ─── Chart: Symbol + Range switching ────────────────────────────
function mktsChangeSymbol(sym) {
  mktsCurrentSymbol = sym;
  // Highlight active card
  document.querySelectorAll('[data-mkts-card]').forEach(function(card) {
    if (card.getAttribute('data-mkts-card') === sym) {
      card.style.borderColor = '#6e7f77';
      card.style.borderWidth = '2px';
    } else {
      card.style.borderColor = '#e2e5ed';
      card.style.borderWidth = '1px';
    }
  });
  // Also update button bar if it exists
  document.querySelectorAll('#mktsChartSymbols button').forEach(function(b) {
    if (b.getAttribute('data-sym') === sym) {
      b.style.background = '#6e7f77'; b.style.color = '#fff'; b.style.borderColor = '#6e7f77';
    } else {
      b.style.background = '#fff'; b.style.color = '#0b1f3a'; b.style.borderColor = '#e2e5ed';
    }
  });
  // Update DMA label
  var dmaLabel = document.getElementById('mktsDMALabel');
  if (dmaLabel) {
    var labels = { 'UMBS_5.5': 'UMBS 30YR 5.5%', 'UMBS_5': 'UMBS 30YR 5%', 'UMBS_6': 'UMBS 30YR 6%', '10Y': '10Y UST', 'SPY': 'S&P 500', '1Y': '1Y UST', '2Y': '2Y UST', '5Y': '5Y UST', '7Y': '7Y UST' };
    dmaLabel.textContent = labels[sym] || sym;
  }
  mktsLoadChart();
}

function mktsChangeRange(range) {
  mktsCurrentRange = range;
  document.querySelectorAll('#mktsChartRanges button').forEach(function(b) {
    if (b.getAttribute('data-range') === range) {
      b.style.background = '#6e7f77'; b.style.color = '#fff'; b.style.borderColor = '#6e7f77';
    } else {
      b.style.background = '#fff'; b.style.color = '#5a6578'; b.style.borderColor = '#e2e5ed';
    }
  });
  mktsLoadChart();
}

function mktsToggleDMA(period) {
  mktsDMA[period] = !mktsDMA[period];
  var cb = document.getElementById('mktsDMA' + period + 'CB');
  if (cb) cb.checked = mktsDMA[period];
  mktsRenderChartFromData();
}

// ─── Chart: Load data ───────────────────────────────────────────
function mktsLoadChart() {
  var isTreasury = ['1Y', '2Y', '5Y', '7Y', '10Y'].indexOf(mktsCurrentSymbol) !== -1;
  var url = 'https://agent-edge-backend.vercel.app/api/markets?mode=history&symbol=' + mktsCurrentSymbol + '&range=' + mktsCurrentRange;
  if (!isTreasury) url += '&interval=1d';

  // Show loading
  var canvas = document.getElementById('mktsMainChart');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8f9fb'; ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.fillStyle = '#9ca3b4'; ctx.font = '12px DM Sans, sans-serif';
    ctx.fillText('Loading...', canvas.offsetWidth / 2 - 30, canvas.offsetHeight / 2);
  }

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      mktsChartData = d;
      mktsRenderChartFromData();
    })
    .catch(function(err) {
      console.error('Chart error:', err);
    });
}

// ─── Chart: Render candlestick + MAs + stochastic ───────────────
function mktsRenderChartFromData() {
  if (!mktsChartData || !mktsChartData.data || mktsChartData.data.length === 0) return;

  var isTreasury = mktsChartData.type === 'treasury';
  var data = mktsChartData.data;

  // Main chart
  var canvas = document.getElementById('mktsMainChart');
  var dpr = window.devicePixelRatio || 1;
  var w = canvas.offsetWidth;
  var h = canvas.offsetHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  if (isTreasury) {
    mktsDrawTreasuryChart(ctx, w, h, data);
  } else {
    mktsDrawCandlestickChart(ctx, w, h, data);
  }

  // Stochastic (only for MBS)
  var stochCanvas = document.getElementById('mktsStochChart');
  if (stochCanvas && !isTreasury) {
    var sw = stochCanvas.offsetWidth;
    var sh = stochCanvas.offsetHeight;
    stochCanvas.width = sw * dpr; stochCanvas.height = sh * dpr;
    var sctx = stochCanvas.getContext('2d');
    sctx.scale(dpr, dpr);
    mktsDrawStochastic(sctx, sw, sh, data);
    stochCanvas.style.display = 'block';
    document.getElementById('mktsStochLabel').style.display = 'block';
  } else if (stochCanvas) {
    stochCanvas.style.display = 'none';
    document.getElementById('mktsStochLabel').style.display = 'none';
  }
}

function mktsCalcSMA(data, period, key) {
  var result = [];
  for (var i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    var sum = 0;
    for (var j = i - period + 1; j <= i; j++) sum += (data[j][key] || data[j].close || data[j].value);
    result.push(sum / period);
  }
  return result;
}

function mktsCalcStochastic(data, kPeriod, dPeriod) {
  var kValues = [];
  var dValues = [];

  for (var i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) { kValues.push(null); continue; }
    var highMax = -Infinity, lowMin = Infinity;
    for (var j = i - kPeriod + 1; j <= i; j++) {
      if (data[j].high > highMax) highMax = data[j].high;
      if (data[j].low < lowMin) lowMin = data[j].low;
    }
    var range = highMax - lowMin;
    var k = range === 0 ? 50 : ((data[i].close - lowMin) / range) * 100;
    kValues.push(k);
  }

  // %D = SMA of %K
  for (var i = 0; i < kValues.length; i++) {
    if (kValues[i] === null || i < kPeriod - 1 + dPeriod - 1) { dValues.push(null); continue; }
    var sum = 0, count = 0;
    for (var j = i - dPeriod + 1; j <= i; j++) {
      if (kValues[j] !== null) { sum += kValues[j]; count++; }
    }
    dValues.push(count > 0 ? sum / count : null);
  }

  return { k: kValues, d: dValues };
}

// ─── Draw Candlestick with MAs ──────────────────────────────────
function mktsDrawCandlestickChart(ctx, w, h, data) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

  var pad = { top: 15, right: 55, bottom: 25, left: 15 };
  var cw = w - pad.left - pad.right;
  var ch = h - pad.top - pad.bottom;

  var minP = Infinity, maxP = -Infinity;
  data.forEach(function(c) {
    if (c.low < minP) minP = c.low;
    if (c.high > maxP) maxP = c.high;
  });
  var range = maxP - minP || 1;
  minP -= range * 0.05; maxP += range * 0.05; range = maxP - minP;

  function yPos(val) { return pad.top + ((maxP - val) / range) * ch; }
  function xPos(i) { return pad.left + (cw / data.length) * i + (cw / data.length) / 2; }

  // Grid
  ctx.strokeStyle = '#f0f2f7'; ctx.lineWidth = 0.5;
  for (var g = 0; g <= 6; g++) {
    var gy = pad.top + (ch / 6) * g;
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(w - pad.right, gy); ctx.stroke();
    var gval = maxP - (range / 6) * g;
    ctx.fillStyle = '#9ca3b4'; ctx.font = '9px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(gval.toFixed(2), w - pad.right + 4, gy + 3);
  }

  // Moving averages
  var periods = [200, 100, 50, 25];
  periods.forEach(function(p) {
    if (!mktsDMA[p]) return;
    if (data.length < p) return;
    var sma = mktsCalcSMA(data, p, 'close');
    ctx.beginPath(); ctx.strokeStyle = mktsDMAColors[p]; ctx.lineWidth = 1.2;
    var started = false;
    sma.forEach(function(val, i) {
      if (val === null) return;
      var x = xPos(i); var y = yPos(val);
      if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
    });
    ctx.stroke();
  });

  // Candles
  var barW = Math.max(2, Math.min(8, (cw / data.length) * 0.65));
  data.forEach(function(c, i) {
    var x = xPos(i);
    var yO = yPos(c.open); var yC = yPos(c.close);
    var yH = yPos(c.high); var yL = yPos(c.low);
    var up = c.close >= c.open;
    var color = up ? '#16a34a' : '#dc2626';

    // Wick
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, yH); ctx.lineTo(x, yL); ctx.stroke();

    // Body
    ctx.fillStyle = color;
    var bodyTop = Math.min(yO, yC);
    var bodyH = Math.max(Math.abs(yC - yO), 1);
    ctx.fillRect(x - barW / 2, bodyTop, barW, bodyH);
  });

  // Fibonacci levels (if enough data)
  if (data.length > 20) {
    var fibHigh = maxP - range * 0.05;
    var fibLow = minP + range * 0.05;
    var fibRange = fibHigh - fibLow;
    var fibs = [
      { level: 0, label: '0%' },
      { level: 0.236, label: '23.6%' },
      { level: 0.382, label: '38.2%' }
    ];
    ctx.setLineDash([4, 4]);
    fibs.forEach(function(f) {
      var val = fibHigh - fibRange * f.level;
      if (val >= minP && val <= maxP) {
        var y = yPos(val);
        ctx.strokeStyle = 'rgba(110,127,119,0.3)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
        ctx.fillStyle = '#6e7f77'; ctx.font = '9px DM Sans, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(f.label + ' ' + val.toFixed(2), w - pad.right - 2, y - 3);
      }
    });
    ctx.setLineDash([]);
  }

  // Date labels
  ctx.textAlign = 'center';
  var labelInterval = Math.max(1, Math.ceil(data.length / 10));
  data.forEach(function(c, i) {
    if (i % labelInterval === 0) {
      var dt = new Date(c.date);
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var lbl = months[dt.getMonth()] + ' ' + dt.getDate();
      ctx.fillStyle = '#9ca3b4'; ctx.font = '9px DM Sans, sans-serif';
      ctx.fillText(lbl, xPos(i), h - 6);
    }
  });
}

// ─── Draw Treasury line chart ───────────────────────────────────
function mktsDrawTreasuryChart(ctx, w, h, data) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

  var pad = { top: 15, right: 55, bottom: 25, left: 15 };
  var cw = w - pad.left - pad.right;
  var ch = h - pad.top - pad.bottom;

  var vals = data.map(function(d) { return d.value; });
  var minV = Math.min.apply(null, vals);
  var maxV = Math.max.apply(null, vals);
  var range = maxV - minV || 0.1;
  minV -= range * 0.05; maxV += range * 0.05; range = maxV - minV;

  function yPos(val) { return pad.top + ((maxV - val) / range) * ch; }

  // Grid
  ctx.strokeStyle = '#f0f2f7'; ctx.lineWidth = 0.5;
  for (var g = 0; g <= 6; g++) {
    var gy = pad.top + (ch / 6) * g;
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(w - pad.right, gy); ctx.stroke();
    var gval = maxV - (range / 6) * g;
    ctx.fillStyle = '#9ca3b4'; ctx.font = '9px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(gval.toFixed(2) + '%', w - pad.right + 4, gy + 3);
  }

  // Line
  ctx.beginPath(); ctx.strokeStyle = '#6e7f77'; ctx.lineWidth = 2;
  data.forEach(function(d, i) {
    var x = pad.left + (cw / Math.max(data.length - 1, 1)) * i;
    var y = yPos(d.value);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill
  var lastX = pad.left + cw;
  ctx.lineTo(lastX, pad.top + ch);
  ctx.lineTo(pad.left, pad.top + ch);
  ctx.closePath();
  ctx.fillStyle = 'rgba(110,127,119,0.06)'; ctx.fill();

  // Date labels
  ctx.textAlign = 'center';
  var labelInterval = Math.max(1, Math.ceil(data.length / 10));
  data.forEach(function(d, i) {
    if (i % labelInterval === 0) {
      var parts = d.date.split('-');
      var months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      ctx.fillStyle = '#9ca3b4'; ctx.font = '9px DM Sans, sans-serif';
      ctx.fillText(months[parseInt(parts[1])] + ' ' + parseInt(parts[2]),
        pad.left + (cw / Math.max(data.length - 1, 1)) * i, h - 6);
    }
  });
}

// ─── Draw Stochastic Oscillator ─────────────────────────────────
function mktsDrawStochastic(ctx, w, h, data) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

  if (data.length < 21) return;

  var pad = { top: 10, right: 55, bottom: 25, left: 15 };
  var cw = w - pad.left - pad.right;
  var ch = h - pad.top - pad.bottom;

  var stoch = mktsCalcStochastic(data, 21, 3);

  function yPos(val) { return pad.top + ((100 - val) / 100) * ch; }
  function xPos(i) { return pad.left + (cw / data.length) * i + (cw / data.length) / 2; }

  // Grid: 80 and 20 lines
  ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 0.8;
  var y80 = yPos(80);
  ctx.beginPath(); ctx.moveTo(pad.left, y80); ctx.lineTo(w - pad.right, y80); ctx.stroke();
  ctx.fillStyle = '#16a34a'; ctx.font = '9px DM Sans, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('80', w - pad.right + 4, y80 + 3);

  ctx.strokeStyle = '#dc2626';
  var y20 = yPos(20);
  ctx.beginPath(); ctx.moveTo(pad.left, y20); ctx.lineTo(w - pad.right, y20); ctx.stroke();
  ctx.fillStyle = '#dc2626'; ctx.fillText('20', w - pad.right + 4, y20 + 3);

  // Y-axis labels
  [0, 50, 100].forEach(function(v) {
    var y = yPos(v);
    ctx.strokeStyle = '#f0f2f7'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#9ca3b4'; ctx.font = '9px DM Sans, sans-serif';
    ctx.fillText(v, w - pad.right + 4, y + 3);
  });

  // %K line
  ctx.beginPath(); ctx.strokeStyle = '#0b1f3a'; ctx.lineWidth = 1.5;
  var started = false;
  stoch.k.forEach(function(val, i) {
    if (val === null) return;
    var x = xPos(i); var y = yPos(val);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // %D line
  ctx.beginPath(); ctx.strokeStyle = '#6e7f77'; ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  started = false;
  stoch.d.forEach(function(val, i) {
    if (val === null) return;
    var x = xPos(i); var y = yPos(val);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Date labels
  ctx.textAlign = 'center';
  var labelInterval = Math.max(1, Math.ceil(data.length / 10));
  data.forEach(function(c, i) {
    if (i % labelInterval === 0) {
      var dt = new Date(c.date);
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      ctx.fillStyle = '#9ca3b4'; ctx.font = '9px DM Sans, sans-serif';
      ctx.fillText(months[dt.getMonth()] + ' ' + dt.getDate(), xPos(i), h - 6);
    }
  });
}

// ─── Lazy load hook ─────────────────────────────────────────────
(function() {
  var orig = switchView;
  switchView = function(viewId, navEl) {
    orig(viewId, navEl);
    if (viewId === 'markets' && !mktsLoaded) {
      mktsLoaded = true;
      loadMarketsData();
      // Auto-refresh every 2 minutes
      mktsRefreshTimer = setInterval(loadMarketsData, 120000);
    }
  };
})();
