// mc-candle-patterns.js — Candlestick Pattern Detection for MBS Pricing
// Scans UMBS 5.5% history and detects CMA-certified patterns
// Displays results inside the MBS Pricing panel

var candlePatternsLoaded = false;

function detectCandlePatterns() {
  var el = document.getElementById('candlePatternResult');
  if (!el) return;
  el.innerHTML = '<span style="color:var(--text-muted);font-size:11px;">Scanning...</span>';

  // Fetch MBS candle history
  fetch('https://agent-edge-backend.vercel.app/api/rates?action=get_mbs_history')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success || !data.data || data.data.length < 6) {
        el.innerHTML = '<span style="color:var(--text-muted);font-size:11px;">Not enough candle data</span>';
        return;
      }
      var candles = data.data;
      var patterns = runPatternScan(candles);
      renderPatterns(el, patterns);
    })
    .catch(function(err) {
      el.innerHTML = '<span style="color:var(--text-muted);font-size:11px;">Pattern scan error</span>';
    });
}

// ─── Trend helpers ──────────────────────────────────────────────
function isDowntrend(candles, endIndex, lookback) {
  if (endIndex < lookback) return false;
  var count = 0;
  for (var i = endIndex - lookback; i < endIndex; i++) {
    if (candles[i].close < candles[i].open) count++;
  }
  // Also check that the overall direction moved lower
  var startClose = candles[endIndex - lookback].close;
  var endClose = candles[endIndex - 1].close;
  return count >= Math.ceil(lookback * 0.6) && endClose < startClose;
}

function isUptrend(candles, endIndex, lookback) {
  if (endIndex < lookback) return false;
  var count = 0;
  for (var i = endIndex - lookback; i < endIndex; i++) {
    if (candles[i].close > candles[i].open) count++;
  }
  var startClose = candles[endIndex - lookback].close;
  var endClose = candles[endIndex - 1].close;
  return count >= Math.ceil(lookback * 0.6) && endClose > startClose;
}

// ─── Pattern detection ──────────────────────────────────────────
function runPatternScan(candles) {
  var found = [];
  var len = candles.length;
  // Only scan the last 10 candles for recent signals
  var scanStart = Math.max(5, len - 10);

  for (var i = scanStart; i < len; i++) {
    var c = candles[i];
    var body = Math.abs(c.close - c.open);
    var upperWick = c.high - Math.max(c.open, c.close);
    var lowerWick = Math.min(c.open, c.close) - c.low;
    var totalRange = c.high - c.low;
    var isGreen = c.close >= c.open;

    // Skip candles with zero range (bad data)
    if (totalRange < 0.01) continue;

    // ── Doji ──
    // Open and close virtually the same (within 0.05)
    if (body <= 0.05 && totalRange > 0.05) {
      found.push({
        date: c.date,
        name: 'Doji',
        signal: 'Indecision',
        color: '#f59e0b',
        meaning: 'Neither bulls nor bears have conviction. Expect volatility — the next candle usually dictates direction.'
      });
      continue; // Don't double-flag a Doji as something else
    }

    // ── Bullish Hammer ──
    // After downtrend, small body, lower wick >= 2x body, upper wick small
    if (body > 0.01 && lowerWick >= body * 2 && upperWick <= body * 0.5 && isDowntrend(candles, i, 4)) {
      found.push({
        date: c.date,
        name: 'Bullish Hammer',
        signal: 'Bullish',
        color: '#16a34a',
        meaning: 'After a downtrend, bears lost control intraday and bulls rallied back. Signals a potential reversal higher — MBS prices may improve.'
      });
      continue;
    }

    // ── Bearish Hanging Man ──
    // After uptrend, same shape as hammer
    if (body > 0.01 && lowerWick >= body * 2 && upperWick <= body * 0.5 && isUptrend(candles, i, 4)) {
      found.push({
        date: c.date,
        name: 'Hanging Man',
        signal: 'Bearish',
        color: '#dc2626',
        meaning: 'After an uptrend, bears made their first push lower. Bulls who bought here may be "hung out to dry." Watch for follow-through selling.'
      });
      continue;
    }

    // ── Bullish Inverted Hammer ──
    // After downtrend, small body, upper wick >= 2x body, lower wick small
    if (body > 0.01 && upperWick >= body * 2 && lowerWick <= body * 0.5 && isDowntrend(candles, i, 4)) {
      found.push({
        date: c.date,
        name: 'Inverted Hammer',
        signal: 'Bullish',
        color: '#16a34a',
        meaning: 'After a downtrend, bulls attempted to drive prices higher. Signals potential reversal — MBS prices could improve.'
      });
      continue;
    }

    // ── Bearish Shooting Star ──
    // After uptrend, small body, upper wick >= 2x body, lower wick small
    if (body > 0.01 && upperWick >= body * 2 && lowerWick <= body * 0.5 && isUptrend(candles, i, 4)) {
      found.push({
        date: c.date,
        name: 'Shooting Star',
        signal: 'Bearish',
        color: '#dc2626',
        meaning: 'After an uptrend, bulls failed to hold gains. This is a reversal warning — MBS prices may pull back.'
      });
      continue;
    }

    // ── Bullish Engulfing ──
    // Two candle: previous red, current green, current body engulfs previous body, after downtrend
    if (i > 0) {
      var prev = candles[i - 1];
      var prevBody = Math.abs(prev.close - prev.open);
      var prevIsRed = prev.close < prev.open;
      var currIsGreen = c.close > c.open;

      if (prevIsRed && currIsGreen && prevBody > 0.01 && body > 0.01 &&
          c.open <= prev.close && c.close >= prev.open &&
          body > prevBody && isDowntrend(candles, i - 1, 4)) {
        found.push({
          date: c.date,
          name: 'Bullish Engulfing',
          signal: 'Bullish',
          color: '#16a34a',
          meaning: 'After a downtrend, a strong green candle completely engulfed the prior red candle. Bulls have taken over — expect prices to move higher.'
        });
        continue;
      }

      // ── Bearish Engulfing ──
      var prevIsGreen = prev.close > prev.open;
      var currIsRed = c.close < c.open;

      if (prevIsGreen && currIsRed && prevBody > 0.01 && body > 0.01 &&
          c.open >= prev.close && c.close <= prev.open &&
          body > prevBody && isUptrend(candles, i - 1, 4)) {
        found.push({
          date: c.date,
          name: 'Bearish Engulfing',
          signal: 'Bearish',
          color: '#dc2626',
          meaning: 'After an uptrend, a strong red candle engulfed the prior green candle. Bears have taken control — watch for prices to move lower.'
        });
        continue;
      }

      // ── Falling Window (gap down) ──
      // Prior session low > current session high
      if (prev.low > c.high + 0.02) {
        found.push({
          date: c.date,
          name: 'Falling Window',
          signal: 'Bearish',
          color: '#dc2626',
          meaning: 'A gap down between sessions. The top of this gap (' + prev.low.toFixed(2) + ') becomes a ceiling of resistance if prices try to recover.'
        });
        continue;
      }

      // ── Rising Window (gap up) ──
      // Prior session high < current session low
      if (prev.high < c.low - 0.02) {
        found.push({
          date: c.date,
          name: 'Rising Window',
          signal: 'Bullish',
          color: '#16a34a',
          meaning: 'A gap up between sessions. The bottom of this gap (' + prev.high.toFixed(2) + ') becomes a floor of support.'
        });
        continue;
      }
    }
  }

  // ── Double Top ──
  // Scan for two highs at approximately the same level within the last 30 candles
  // with at least 5 candles between them and a dip of at least 0.20 in between
  var dtStart = Math.max(0, len - 30);
  for (var a = dtStart; a < len - 5; a++) {
    for (var b = a + 5; b < len; b++) {
      var highA = candles[a].high;
      var highB = candles[b].high;
      if (Math.abs(highA - highB) <= 0.15 && highA > 0 && highB > 0) {
        // Check there's a meaningful dip between the two peaks
        var minBetween = Infinity;
        for (var m = a + 1; m < b; m++) {
          if (candles[m].low < minBetween) minBetween = candles[m].low;
        }
        var avgPeak = (highA + highB) / 2;
        if (avgPeak - minBetween >= 0.20) {
          // Only report if the second peak is recent (within last 5 candles)
          if (b >= len - 5) {
            found.push({
              date: candles[b].date,
              name: 'Double Top',
              signal: 'Bearish',
              color: '#dc2626',
              meaning: 'Two highs near ' + avgPeak.toFixed(2) + ' with a dip between them. This level is now strong resistance — sellers are likely to push prices down from here.'
            });
          }
          break; // Only report the most recent double top
        }
      }
    }
  }

  return found;
}

// ─── Render ─────────────────────────────────────────────────────
function renderPatterns(el, patterns) {
  if (patterns.length === 0) {
    el.innerHTML = '<span style="color:var(--text-muted);font-size:11px;">No patterns detected in recent candles</span>';
    return;
  }

  // Show most recent patterns (up to 3)
  var show = patterns.slice(-3);
  var html = '';
  show.forEach(function(p) {
    var dateStr = p.date;
    try { var d = new Date(p.date); dateStr = (d.getMonth()+1) + '/' + d.getDate(); } catch(e) {}
    html += '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-light);">';
    html += '<div style="min-width:8px;width:8px;height:8px;border-radius:50%;background:' + p.color + ';margin-top:4px;flex-shrink:0;"></div>';
    html += '<div>';
    html += '<div style="font-size:12px;font-weight:700;color:var(--text-primary);">' + p.name + ' <span style="font-weight:500;color:' + p.color + ';">(' + p.signal + ')</span> <span style="font-weight:400;color:var(--text-muted);font-size:10px;">' + dateStr + '</span></div>';
    html += '<div style="font-size:11px;color:var(--text-secondary);line-height:1.4;margin-top:2px;">' + p.meaning + '</div>';
    html += '</div></div>';
  });
  el.innerHTML = html;
}

// Hook into briefings view load
(function() {
  var origSwitch = switchView;
  switchView = function(viewId, navEl) {
    origSwitch(viewId, navEl);
    if (viewId === 'briefings' && !candlePatternsLoaded) {
      candlePatternsLoaded = true;
      detectCandlePatterns();
    }
  };
})();
