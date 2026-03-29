// ===== BLENDED RATE CALCULATOR =====
var API_BASE_BR = 'https://agent-edge-backend.vercel.app/api';
var brDebts = [];
var brDebtCounter = 0;
var brClientId = null;
var brClientName = '';
var brCrmResults = [];
var brAppreciationData = null;

// ===== INITIALIZATION =====
function brInit() {
  brDebts = [];
  brDebtCounter = 0;
  brClientId = null;
  brClientName = '';
  brCrmResults = [];
  brAppreciationData = null;
  brAddDebt();
  brUpdateSummary();
  brHideComparison();
  brHideAccelerator();
}

// ===== CLIENT SEARCH (CRM) =====
function brSearchClients() {
  var input = document.getElementById('brClientSearch');
  var query = input.value.trim().toLowerCase();
  var dropdown = document.getElementById('brClientDropdown');

  if (query.length < 1) {
    dropdown.style.display = 'none';
    return;
  }

  // Use already-loaded CRM contacts if available
  var contacts = (typeof crmContacts !== 'undefined' && crmContacts.length > 0) ? crmContacts : [];

  if (contacts.length === 0) {
    // Fetch from API
    fetch(API_BASE_BR + '/crm-api?action=list', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success && data.contacts) {
        brCrmResults = data.contacts;
        brRenderDropdown(query);
      }
    })
    .catch(function(err) { console.error('CRM search error:', err); });
  } else {
    brCrmResults = contacts;
    brRenderDropdown(query);
  }
}

function brRenderDropdown(query) {
  var dropdown = document.getElementById('brClientDropdown');
  var filtered = brCrmResults.filter(function(c) {
    return (c.name || '').toLowerCase().includes(query) ||
           (c.email || '').toLowerCase().includes(query) ||
           (c.phone || '').includes(query);
  }).slice(0, 8);

  var html = '';
  filtered.forEach(function(c) {
    var sub = c.email || c.phone || '';
    html += '<div class="br-dropdown-item" onclick="brSelectClient(\'' + c.id + '\',\'' + (c.name || '').replace(/'/g, "\\'") + '\',\'' + (c.email || '').replace(/'/g, "\\'") + '\',\'' + (c.zip || '').replace(/'/g, "\\'") + '\')">' +
      '<span class="br-dropdown-name">' + (c.name || '') + '</span>' +
      (sub ? '<span class="br-dropdown-sub">' + sub + '</span>' : '') +
    '</div>';
  });

  html += '<div class="br-dropdown-item br-dropdown-add" onclick="brShowNewClient()"><i class="fas fa-plus" style="margin-right:6px;font-size:10px;"></i> Add new client</div>';

  dropdown.innerHTML = html;
  dropdown.style.display = 'block';
}

function brSelectClient(id, name, email, zip) {
  brClientId = id;
  brClientName = name;
  document.getElementById('brClientSearch').value = name;
  document.getElementById('brClientDropdown').style.display = 'none';
  document.getElementById('brNewClientForm').style.display = 'none';
  document.getElementById('brSaveToCrmBtn').style.display = 'none';

  // If client has a zip, auto-fill the equity recoup zip field
  if (zip) {
    var zipEl = document.getElementById('brEquityZip');
    if (zipEl) zipEl.value = zip;
  }
}

function brShowNewClient() {
  document.getElementById('brClientDropdown').style.display = 'none';
  document.getElementById('brNewClientForm').style.display = 'block';
  document.getElementById('brNewClientName').focus();
}

function brAddNewClient() {
  var name = document.getElementById('brNewClientName').value.trim();
  var email = document.getElementById('brNewClientEmail').value.trim();
  var phone = document.getElementById('brNewClientPhone').value.trim();
  var fico = document.getElementById('brNewClientFico').value.trim();

  if (!name) { alert('Name is required.'); return; }
  if (!fico) { alert('FICO score is required.'); return; }

  brClientId = null;
  brClientName = name;
  document.getElementById('brClientSearch').value = name;
  document.getElementById('brNewClientForm').style.display = 'none';
  document.getElementById('brSaveToCrmBtn').style.display = 'inline-flex';

  // Store temp data for CRM save
  document.getElementById('brSaveToCrmBtn').dataset.name = name;
  document.getElementById('brSaveToCrmBtn').dataset.email = email;
  document.getElementById('brSaveToCrmBtn').dataset.phone = phone;
  document.getElementById('brSaveToCrmBtn').dataset.fico = fico;
}

function brSaveToCrm() {
  var btn = document.getElementById('brSaveToCrmBtn');
  var name = btn.dataset.name;
  var email = btn.dataset.email;
  var phone = btn.dataset.phone;
  var fico = btn.dataset.fico;

  btn.textContent = 'Saving...';
  btn.disabled = true;

  var crm = {
    name: name,
    email: email || null,
    phone: phone || null,
    root_type: 'client',
    source: 'Blended Rate Calculator',
    notes: 'FICO: ' + fico
  };

  fetch(API_BASE_BR + '/crm-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save', crm: crm })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      brClientId = data.id;
      btn.innerHTML = '<i class="fas fa-check" style="margin-right:5px;"></i> Saved to CRM';
      btn.style.background = 'rgba(22,163,74,0.1)';
      btn.style.borderColor = 'rgba(22,163,74,0.3)';
      btn.style.color = '#16a34a';
      // Refresh CRM list if loaded
      if (typeof loadCrm === 'function') loadCrm();
    } else {
      btn.textContent = 'Error — Try Again';
      btn.disabled = false;
    }
  })
  .catch(function(err) {
    console.error('CRM save error:', err);
    btn.textContent = 'Error — Try Again';
    btn.disabled = false;
  });
}

function brCloseDropdown(e) {
  var dropdown = document.getElementById('brClientDropdown');
  var search = document.getElementById('brClientSearch');
  if (dropdown && !dropdown.contains(e.target) && e.target !== search) {
    dropdown.style.display = 'none';
  }
}

document.addEventListener('click', brCloseDropdown);

// ===== DEBT MANAGEMENT =====
function brAddDebt() {
  brDebtCounter++;
  var debt = {
    id: brDebtCounter,
    name: '',
    type: 'revolving',
    balance: 0,
    rate: 0,
    payment: 0,
    remainingMonths: 0
  };
  brDebts.push(debt);
  brRenderDebts();
  brUpdateSummary();
}

function brRemoveDebt(id) {
  brDebts = brDebts.filter(function(d) { return d.id !== id; });
  if (brDebts.length === 0) brAddDebt();
  brRenderDebts();
  brUpdateSummary();
}

function brReset() {
  brDebts = [];
  brDebtCounter = 0;
  brClientId = null;
  brClientName = '';
  document.getElementById('brClientSearch').value = '';
  document.getElementById('brNewClientForm').style.display = 'none';
  document.getElementById('brSaveToCrmBtn').style.display = 'none';
  brAddDebt();
  brUpdateSummary();
  brHideComparison();
  brHideAccelerator();
  document.getElementById('brDebtSummaryCards').innerHTML = '';
}

function brUpdateDebt(id, field, value) {
  var debt = brDebts.find(function(d) { return d.id === id; });
  if (!debt) return;

  if (field === 'name' || field === 'type') {
    debt[field] = value;
  } else {
    debt[field] = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  }
  brUpdateSummary();
}

function brFormatDebtInput(el, id, field) {
  var raw = el.value.replace(/[^0-9.]/g, '');
  var num = parseFloat(raw) || 0;
  if (field === 'balance' || field === 'payment') {
    if (num > 0) el.value = num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  brUpdateDebt(id, field, raw);
}

// ===== RATE ESTIMATION =====
function brEstimateRate(id) {
  var debt = brDebts.find(function(d) { return d.id === id; });
  if (!debt) return;

  if (debt.balance <= 0 || debt.payment <= 0) {
    alert('Enter both a balance and a monthly payment to estimate the rate.');
    return;
  }

  var rate = 0;

  if (debt.type === 'installment' || debt.type === 'mortgage') {
    // Need remaining months
    var n = debt.remainingMonths;
    if (!n || n <= 0) {
      alert('For installment loans and mortgages, enter the remaining months to estimate the rate.');
      return;
    }
    rate = brSolveInstallmentRate(debt.balance, debt.payment, n);
  } else {
    // Revolving — estimate using a simplified approach
    // Monthly interest ≈ payment - (balance * 0.01) from the standard formula
    // So monthlyRate ≈ (payment - balance*0.01) / balance, annualize it
    // More accurate: use Newton's method assuming fixed payment payoff
    // We'll assume a 120-month horizon for revolving as a reasonable estimate
    rate = brSolveInstallmentRate(debt.balance, debt.payment, 120);
    if (rate <= 0) {
      // Fallback: simple interest estimate from first month
      var monthlyInterestEst = debt.payment - (debt.balance * 0.01);
      if (monthlyInterestEst > 0) {
        rate = (monthlyInterestEst / debt.balance) * 12 * 100;
      }
    }
  }

  if (rate > 0 && rate < 100) {
    rate = Math.round(rate * 100) / 100; // round to 2 decimals
    debt.rate = rate;
    var rateInput = document.getElementById('brRate_' + id);
    if (rateInput) rateInput.value = rate;
    brUpdateSummary();
    showToast('Estimated rate: ' + rate + '%');
  } else {
    alert('Could not estimate a reasonable rate from the balance and payment provided. Check your numbers and try again.');
  }
}

// Newton's method to solve for interest rate given PV, PMT, and N
function brSolveInstallmentRate(balance, payment, months) {
  // Solve: payment = balance * r / (1 - (1+r)^-n)  for r (monthly rate)
  // Using Newton-Raphson iteration
  var r = 0.005; // initial guess: 6% annual = 0.5% monthly
  for (var i = 0; i < 100; i++) {
    var pmt = r === 0 ? balance / months : balance * r / (1 - Math.pow(1 + r, -months));
    var dpmt; // derivative of pmt w.r.t. r
    if (r === 0) {
      dpmt = 0;
    } else {
      var a = Math.pow(1 + r, -months);
      var denom = 1 - a;
      var numer = balance * r;
      // d/dr [balance * r / (1 - (1+r)^-n)]
      // = balance * [(1-a) - r * n * (1+r)^(-n-1)] / (1-a)^2
      dpmt = balance * (denom + r * months * Math.pow(1 + r, -months - 1)) / (denom * denom);
    }
    if (Math.abs(dpmt) < 1e-12) break;
    var rNew = r - (pmt - payment) / dpmt;
    if (Math.abs(rNew - r) < 1e-10) {
      r = rNew;
      break;
    }
    r = rNew;
    if (r < 0) r = 0.0001; // keep positive
    if (r > 0.5) r = 0.5; // cap at 600% annual
  }
  return r * 12 * 100; // convert monthly to annual percentage
}

function brRenderDebts() {
  var container = document.getElementById('brDebtRows');
  var html = '';

  brDebts.forEach(function(d, idx) {
    var showTermField = (d.type === 'installment' || d.type === 'mortgage');
    html += '<div class="br-debt-row" data-id="' + d.id + '">' +
      '<div class="br-debt-grip" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></div>' +
      '<div class="br-debt-fields">' +
        '<div class="br-debt-field br-debt-name">' +
          '<label>Debt name</label>' +
          '<input type="text" value="' + (d.name || '').replace(/"/g, '&quot;') + '" placeholder="e.g. Visa, Auto Loan" oninput="brUpdateDebt(' + d.id + ',\'name\',this.value)">' +
        '</div>' +
        '<div class="br-debt-field br-debt-type">' +
          '<label>Type</label>' +
          '<select onchange="brUpdateDebt(' + d.id + ',\'type\',this.value);brRenderDebts();">' +
            '<option value="revolving"' + (d.type === 'revolving' ? ' selected' : '') + '>Revolving</option>' +
            '<option value="installment"' + (d.type === 'installment' ? ' selected' : '') + '>Installment</option>' +
            '<option value="mortgage"' + (d.type === 'mortgage' ? ' selected' : '') + '>Mortgage</option>' +
          '</select>' +
        '</div>' +
        '<div class="br-debt-field br-debt-balance">' +
          '<label>Balance</label>' +
          '<div class="br-input-prefix"><span>$</span><input type="text" value="' + (d.balance > 0 ? d.balance.toLocaleString() : '') + '" placeholder="0" oninput="brFormatDebtInput(this,' + d.id + ',\'balance\')" onblur="brFormatDebtInput(this,' + d.id + ',\'balance\')"></div>' +
        '</div>' +
        '<div class="br-debt-field br-debt-rate">' +
          '<label>Interest rate</label>' +
          '<div class="br-input-suffix"><input type="text" id="brRate_' + d.id + '" value="' + (d.rate > 0 ? d.rate : '') + '" placeholder="0" oninput="brUpdateDebt(' + d.id + ',\'rate\',this.value)"><span>%</span></div>' +
          '<a class="br-estimate-link" onclick="brEstimateRate(' + d.id + ')" title="Calculate rate from balance & payment">Estimate rate</a>' +
        '</div>' +
        '<div class="br-debt-field br-debt-payment">' +
          '<label>Min payment <span style="color:var(--text-muted);font-weight:400;">(optional)</span></label>' +
          '<div class="br-input-prefix"><span>$</span><input type="text" value="' + (d.payment > 0 ? d.payment.toLocaleString() : '') + '" placeholder="0" oninput="brFormatDebtInput(this,' + d.id + ',\'payment\')" onblur="brFormatDebtInput(this,' + d.id + ',\'payment\')"></div>' +
        '</div>' +
        (showTermField ? '<div class="br-debt-field br-debt-term">' +
          '<label>Months left</label>' +
          '<input type="text" value="' + (d.remainingMonths > 0 ? d.remainingMonths : '') + '" placeholder="e.g. 48" oninput="brUpdateDebt(' + d.id + ',\'remainingMonths\',this.value)">' +
        '</div>' : '') +
      '</div>' +
      '<button class="br-debt-delete" onclick="brRemoveDebt(' + d.id + ')" title="Remove"><i class="fas fa-trash-can"></i></button>' +
    '</div>';
  });

  container.innerHTML = html;
  brInitDragDrop();
}

// ===== DRAG & DROP REORDER =====
function brInitDragDrop() {
  var rows = document.querySelectorAll('.br-debt-row');
  rows.forEach(function(row) {
    var grip = row.querySelector('.br-debt-grip');
    grip.addEventListener('mousedown', function(e) {
      e.preventDefault();
      var container = document.getElementById('brDebtRows');
      var dragging = row;
      dragging.classList.add('br-dragging');

      function onMove(e2) {
        var siblings = Array.from(container.querySelectorAll('.br-debt-row:not(.br-dragging)'));
        var next = siblings.find(function(sib) {
          var box = sib.getBoundingClientRect();
          return e2.clientY < box.top + box.height / 2;
        });
        if (next) {
          container.insertBefore(dragging, next);
        } else {
          container.appendChild(dragging);
        }
      }

      function onUp() {
        dragging.classList.remove('br-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);

        // Rebuild brDebts array to match new DOM order
        var newOrder = [];
        container.querySelectorAll('.br-debt-row').forEach(function(r) {
          var id = parseInt(r.dataset.id);
          var debt = brDebts.find(function(d) { return d.id === id; });
          if (debt) newOrder.push(debt);
        });
        brDebts = newOrder;
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}

// ===== SUMMARY CALCULATIONS =====
function brUpdateSummary() {
  var totalBalance = 0;
  var totalPayment = 0;
  var weightedRateSum = 0;

  brDebts.forEach(function(d) {
    if (d.balance > 0) {
      totalBalance += d.balance;
      weightedRateSum += d.balance * d.rate;

      if (d.payment > 0) {
        totalPayment += d.payment;
      } else {
        // Estimate minimum payment
        totalPayment += brEstimateMinPayment(d);
      }
    }
  });

  var blendedRate = totalBalance > 0 ? weightedRateSum / totalBalance : 0;

  document.getElementById('brSummaryTotal').textContent = '$' + Math.round(totalBalance).toLocaleString();
  document.getElementById('brSummaryRate').textContent = blendedRate.toFixed(3) + '%';
  document.getElementById('brSummaryPayment').textContent = '$' + Math.round(totalPayment).toLocaleString();

  // Update total balance below debt rows
  var totalEl = document.getElementById('brDebtTotalBalance');
  if (totalEl) totalEl.textContent = '$' + Math.round(totalBalance).toLocaleString();

  // Update comparison panel if open
  brUpdateComparison();

  // Update equity recoup non-mortgage total
  brUpdateEquityTotal();
}

function brEstimateMinPayment(debt) {
  if (debt.balance <= 0 || debt.rate <= 0) return 0;

  if (debt.type === 'revolving') {
    // Standard: 1% of balance + monthly interest, floor $25
    var monthlyInterest = debt.balance * (debt.rate / 100) / 12;
    var minPay = (debt.balance * 0.01) + monthlyInterest;
    return Math.max(minPay, 25);
  } else {
    // Can't estimate installment without term — return 0
    return 0;
  }
}

// ===== DEBT SUMMARY CARDS (Option B) =====
function brGenerateSummaryCards() {
  var container = document.getElementById('brDebtSummaryCards');
  var html = '';
  var totalInterestAll = 0;
  var totalCostAll = 0;
  var totalBalanceAll = 0;

  var validDebts = brDebts.filter(function(d) { return d.balance > 0 && d.rate > 0; });

  if (validDebts.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px;font-size:13px;">Enter at least one debt with a balance and interest rate to see the analysis.</div>';
    return;
  }

  validDebts.forEach(function(d) {
    var result = brCalcDebtPayoff(d);
    totalInterestAll += result.totalInterest;
    totalCostAll += result.totalCost;
    totalBalanceAll += d.balance;

    var interestRatio = result.firstYearInterest > 0 && result.firstYearPayments > 0
      ? Math.round((result.firstYearInterest / result.firstYearPayments) * 100)
      : 0;

    var barColor = interestRatio > 60 ? 'var(--accent-red)' : interestRatio > 35 ? 'var(--accent-orange)' : 'var(--accent-green)';

    html += '<div class="br-summary-card">' +
      '<div class="br-summary-card-header">' +
        '<span class="br-summary-card-name">' + (d.name || 'Unnamed debt') + '</span>' +
        '<span class="br-summary-card-detail">$' + d.balance.toLocaleString() + ' at ' + d.rate + '%</span>' +
      '</div>' +
      '<div class="br-summary-card-stats">' +
        '<div class="br-summary-stat">' +
          '<span class="br-summary-stat-label">Min payment</span>' +
          '<span class="br-summary-stat-value">$' + Math.round(result.monthlyPayment).toLocaleString() + '/mo</span>' +
        '</div>' +
        '<div class="br-summary-stat">' +
          '<span class="br-summary-stat-label">Time to payoff</span>' +
          '<span class="br-summary-stat-value">' + result.payoffTimeStr + '</span>' +
        '</div>' +
        '<div class="br-summary-stat">' +
          '<span class="br-summary-stat-label">Total interest</span>' +
          '<span class="br-summary-stat-value br-stat-red">$' + Math.round(result.totalInterest).toLocaleString() + '</span>' +
        '</div>' +
        '<div class="br-summary-stat">' +
          '<span class="br-summary-stat-label">True cost</span>' +
          '<span class="br-summary-stat-value">$' + Math.round(result.totalCost).toLocaleString() + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="br-summary-bar-wrap">' +
        '<div class="br-summary-bar-track"><div class="br-summary-bar-fill" style="width:' + interestRatio + '%;background:' + barColor + ';"></div></div>' +
        '<span class="br-summary-bar-label">' + interestRatio + '% of first year payments go to interest</span>' +
      '</div>' +
    '</div>';
  });

  // Grand total
  html += '<div class="br-summary-total-card">' +
    '<div class="br-summary-total-row">' +
      '<span>Total interest across all debts</span>' +
      '<span class="br-summary-total-amount">$' + Math.round(totalInterestAll).toLocaleString() + '</span>' +
    '</div>' +
    '<div class="br-summary-total-desc">You\'ll pay $' + Math.round(totalBalanceAll).toLocaleString() + ' in balances + $' + Math.round(totalInterestAll).toLocaleString() + ' in interest = $' + Math.round(totalCostAll).toLocaleString() + ' total at minimum payments.</div>' +
  '</div>';

  container.innerHTML = html;
}

function brCalcDebtPayoff(debt) {
  var balance = debt.balance;
  var annualRate = debt.rate / 100;
  var monthlyRate = annualRate / 12;
  var userPayment = debt.payment > 0 ? debt.payment : 0;
  var months = 0;
  var totalInterest = 0;
  var firstYearInterest = 0;
  var firstYearPayments = 0;
  var maxMonths = 600; // 50 year safety cap

  if (debt.type === 'revolving') {
    // Revolving: minimum payment = 1% of balance + monthly interest, floor $25
    var bal = balance;
    var initialInterest = balance * monthlyRate;
    var actualPayment = userPayment > 0 ? userPayment : Math.max((balance * 0.01) + initialInterest, 25);

    // Check upfront: if the user's payment doesn't cover even the first month's interest, debt never pays off
    if (userPayment > 0 && userPayment <= initialInterest) {
      // Calculate first year for the interest ratio display
      for (var m = 0; m < 12; m++) {
        var int = bal * monthlyRate;
        firstYearInterest += int;
        firstYearPayments += userPayment;
        bal += (int - userPayment); // balance grows
      }
      return {
        monthlyPayment: Math.round(userPayment),
        months: maxMonths,
        payoffTimeStr: 'Never (payment below interest)',
        totalInterest: 0,
        totalCost: balance,
        firstYearInterest: firstYearInterest,
        firstYearPayments: firstYearPayments
      };
    }

    bal = balance;
    while (bal > 0.50 && months < maxMonths) {
      months++;
      var interest = bal * monthlyRate;
      var minPay;
      if (userPayment > 0) {
        minPay = userPayment;
      } else {
        minPay = Math.max((bal * 0.01) + interest, 25);
        // If calculated min doesn't cover interest, force it above
        if (minPay <= interest) {
          minPay = interest + (bal * 0.01);
        }
      }
      if (minPay > bal + interest) minPay = bal + interest;
      var principal = minPay - interest;
      bal -= principal;
      totalInterest += interest;
      if (months <= 12) {
        firstYearInterest += interest;
        firstYearPayments += minPay;
      }
    }
    return {
      monthlyPayment: Math.round(actualPayment),
      months: months,
      payoffTimeStr: brFormatMonths(months),
      totalInterest: totalInterest,
      totalCost: balance + totalInterest,
      firstYearInterest: firstYearInterest,
      firstYearPayments: firstYearPayments
    };
  } else {
    // Installment: fixed payment amortization
    var payment = userPayment;
    if (payment <= 0 && monthlyRate > 0) {
      // Cannot estimate without a payment — just show the balance info
      return {
        monthlyPayment: 0,
        months: 0,
        payoffTimeStr: 'Enter payment',
        totalInterest: 0,
        totalCost: balance,
        firstYearInterest: 0,
        firstYearPayments: 0
      };
    }
    if (payment <= 0) return { monthlyPayment: 0, months: 0, payoffTimeStr: 'N/A', totalInterest: 0, totalCost: balance, firstYearInterest: 0, firstYearPayments: 0 };

    var bal = balance;
    while (bal > 0.50 && months < maxMonths) {
      months++;
      var interest = bal * monthlyRate;
      var pmt = Math.min(payment, bal + interest);
      var principal = pmt - interest;
      if (principal <= 0) {
        // Payment doesn't cover interest
        return {
          monthlyPayment: payment,
          months: maxMonths,
          payoffTimeStr: 'Never (payment too low)',
          totalInterest: totalInterest,
          totalCost: balance + totalInterest,
          firstYearInterest: firstYearInterest,
          firstYearPayments: firstYearPayments
        };
      }
      bal -= principal;
      totalInterest += interest;
      if (months <= 12) {
        firstYearInterest += interest;
        firstYearPayments += pmt;
      }
    }
    return {
      monthlyPayment: payment,
      months: months,
      payoffTimeStr: brFormatMonths(months),
      totalInterest: totalInterest,
      totalCost: balance + totalInterest,
      firstYearInterest: firstYearInterest,
      firstYearPayments: firstYearPayments
    };
  }
}

function brFormatMonths(m) {
  if (m >= 600) return '50+ years';
  var yrs = Math.floor(m / 12);
  var mo = m % 12;
  if (yrs === 0) return mo + ' month' + (mo !== 1 ? 's' : '');
  if (mo === 0) return yrs + ' year' + (yrs !== 1 ? 's' : '');
  return yrs + ' yr' + (yrs !== 1 ? 's' : '') + ' ' + mo + ' mo';
}

// ===== NEW MORTGAGE COMPARISON (Section 2) =====
function brToggleComparison() {
  var panel = document.getElementById('brComparisonPanel');
  var btn = document.getElementById('brComparisonToggle');
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'block';
    btn.innerHTML = '<i class="fas fa-compress-alt" style="margin-right:6px;"></i> Hide mortgage comparison';
  } else {
    brHideComparison();
  }
}

function brHideComparison() {
  var panel = document.getElementById('brComparisonPanel');
  var btn = document.getElementById('brComparisonToggle');
  if (panel) panel.style.display = 'none';
  if (btn) btn.innerHTML = '<i class="fas fa-exchange-alt" style="margin-right:6px;"></i> Compare to new mortgage';
}

function brUpdateComparison() {
  var panel = document.getElementById('brComparisonPanel');
  if (!panel || panel.style.display === 'none') return;

  var loanAmt = parseFloat((document.getElementById('brNewLoanAmt').value || '0').replace(/[^0-9.]/g, '')) || 0;
  var rate = parseFloat(document.getElementById('brNewRate').value) || 0;
  var term = parseInt(document.getElementById('brNewTerm').value) || 30;

  if (loanAmt <= 0 || rate <= 0) {
    document.getElementById('brComparisonResult').innerHTML = '';
    return;
  }

  var mr = (rate / 100) / 12;
  var n = term * 12;
  var newPayment = mr === 0 ? loanAmt / n : loanAmt * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
  var newTotalInterest = (newPayment * n) - loanAmt;

  // Current totals
  var currentPayment = 0;
  brDebts.forEach(function(d) {
    if (d.balance > 0) {
      currentPayment += d.payment > 0 ? d.payment : brEstimateMinPayment(d);
    }
  });

  var totalBalance = 0;
  var weightedRateSum = 0;
  brDebts.forEach(function(d) {
    if (d.balance > 0) {
      totalBalance += d.balance;
      weightedRateSum += d.balance * d.rate;
    }
  });
  var blendedRate = totalBalance > 0 ? weightedRateSum / totalBalance : 0;

  var monthlySavings = currentPayment - newPayment;
  var savingsClass = monthlySavings > 0 ? 'br-comp-positive' : 'br-comp-negative';

  var html = '<div class="br-comp-grid">' +
    '<div class="br-comp-col">' +
      '<div class="br-comp-col-label">Current debts</div>' +
      '<div class="br-comp-stat"><span class="br-comp-stat-label">Total monthly</span><span class="br-comp-stat-value">$' + Math.round(currentPayment).toLocaleString() + '</span></div>' +
      '<div class="br-comp-stat"><span class="br-comp-stat-label">Blended rate</span><span class="br-comp-stat-value">' + blendedRate.toFixed(3) + '%</span></div>' +
      '<div class="br-comp-stat"><span class="br-comp-stat-label">Total balances</span><span class="br-comp-stat-value">$' + Math.round(totalBalance).toLocaleString() + '</span></div>' +
    '</div>' +
    '<div class="br-comp-vs">VS</div>' +
    '<div class="br-comp-col">' +
      '<div class="br-comp-col-label">New mortgage</div>' +
      '<div class="br-comp-stat"><span class="br-comp-stat-label">Monthly P&I</span><span class="br-comp-stat-value">$' + Math.round(newPayment).toLocaleString() + '</span></div>' +
      '<div class="br-comp-stat"><span class="br-comp-stat-label">Interest rate</span><span class="br-comp-stat-value">' + rate.toFixed(3) + '%</span></div>' +
      '<div class="br-comp-stat"><span class="br-comp-stat-label">Loan amount</span><span class="br-comp-stat-value">$' + Math.round(loanAmt).toLocaleString() + '</span></div>' +
    '</div>' +
  '</div>' +
  '<div class="br-comp-savings ' + savingsClass + '">' +
    '<div class="br-comp-savings-amount">' + (monthlySavings >= 0 ? '' : '-') + '$' + Math.abs(Math.round(monthlySavings)).toLocaleString() + '/mo</div>' +
    '<div class="br-comp-savings-label">' + (monthlySavings >= 0 ? 'Monthly savings with new mortgage' : 'Monthly increase with new mortgage') + '</div>' +
    (monthlySavings > 0 ? '<div class="br-comp-savings-annual">$' + Math.round(monthlySavings * 12).toLocaleString() + ' saved per year</div>' : '') +
  '</div>';

  document.getElementById('brComparisonResult').innerHTML = html;

  // Store for accelerator
  document.getElementById('brComparisonPanel').dataset.newPayment = Math.round(newPayment);
  document.getElementById('brComparisonPanel').dataset.savings = Math.round(monthlySavings);
  document.getElementById('brComparisonPanel').dataset.newLoan = loanAmt;
  document.getElementById('brComparisonPanel').dataset.newRate = rate;
  document.getElementById('brComparisonPanel').dataset.newTerm = term;
}

function brFormatCompInput(el) {
  var val = el.value.replace(/[^0-9]/g, '');
  if (val) el.value = parseInt(val).toLocaleString();
  brUpdateComparison();
}

// ===== EXTRA PAYMENT ACCELERATOR (Section 3) =====
function brToggleAccelerator() {
  var panel = document.getElementById('brAcceleratorPanel');
  var btn = document.getElementById('brAcceleratorToggle');
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'block';
    btn.innerHTML = '<i class="fas fa-compress-alt" style="margin-right:6px;"></i> Hide payoff accelerator';
  } else {
    brHideAccelerator();
  }
}

function brHideAccelerator() {
  var panel = document.getElementById('brAcceleratorPanel');
  var btn = document.getElementById('brAcceleratorToggle');
  if (panel) panel.style.display = 'none';
  if (btn) btn.innerHTML = '<i class="fas fa-bolt" style="margin-right:6px;"></i> Payoff accelerator';
}

function brUpdateAccelerator() {
  var compPanel = document.getElementById('brComparisonPanel');
  var loanAmt = parseFloat(compPanel.dataset.newLoan) || 0;
  var rate = parseFloat(compPanel.dataset.newRate) || 0;
  var term = parseInt(compPanel.dataset.newTerm) || 30;
  var baseSavings = parseFloat(compPanel.dataset.savings) || 0;

  var extraPayment = parseFloat((document.getElementById('brExtraPayment').value || '0').replace(/[^0-9.]/g, '')) || 0;

  if (loanAmt <= 0 || rate <= 0) {
    document.getElementById('brAcceleratorResult').innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px;">Enter your new mortgage details in the comparison panel above first.</div>';
    return;
  }

  // Standard amortization
  var mr = (rate / 100) / 12;
  var n = term * 12;
  var stdPayment = mr === 0 ? loanAmt / n : loanAmt * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
  var stdTotalInterest = (stdPayment * n) - loanAmt;

  // Accelerated amortization
  var bal = loanAmt;
  var accMonths = 0;
  var accTotalInterest = 0;
  while (bal > 0.50 && accMonths < n + 120) {
    accMonths++;
    var interest = bal * mr;
    var totalPmt = stdPayment + extraPayment;
    if (totalPmt > bal + interest) totalPmt = bal + interest;
    var principal = totalPmt - interest;
    bal -= principal;
    accTotalInterest += interest;
  }

  var savedMonths = n - accMonths;
  var savedInterest = stdTotalInterest - accTotalInterest;
  var netSavingsPerMonth = baseSavings - extraPayment;

  var html = '<div class="br-accel-grid">' +
    '<div class="br-accel-col">' +
      '<div class="br-accel-col-label">Standard payoff</div>' +
      '<div class="br-accel-stat"><span class="br-accel-stat-label">Term</span><span class="br-accel-stat-value">' + term + ' years</span></div>' +
      '<div class="br-accel-stat"><span class="br-accel-stat-label">Total interest</span><span class="br-accel-stat-value">$' + Math.round(stdTotalInterest).toLocaleString() + '</span></div>' +
    '</div>' +
    '<div class="br-accel-vs">VS</div>' +
    '<div class="br-accel-col">' +
      '<div class="br-accel-col-label">With extra $' + Math.round(extraPayment).toLocaleString() + '/mo</div>' +
      '<div class="br-accel-stat"><span class="br-accel-stat-label">Payoff in</span><span class="br-accel-stat-value" style="color:var(--accent-green);">' + brFormatMonths(accMonths) + '</span></div>' +
      '<div class="br-accel-stat"><span class="br-accel-stat-label">Total interest</span><span class="br-accel-stat-value" style="color:var(--accent-green);">$' + Math.round(accTotalInterest).toLocaleString() + '</span></div>' +
    '</div>' +
  '</div>' +
  '<div class="br-accel-savings">' +
    '<div class="br-accel-savings-big">$' + Math.round(savedInterest).toLocaleString() + '</div>' +
    '<div class="br-accel-savings-label">Interest saved</div>' +
    '<div class="br-accel-savings-desc">Pay off your mortgage ' + brFormatMonths(savedMonths) + ' early</div>' +
    (netSavingsPerMonth > 0 ? '<div class="br-accel-savings-net">You still pocket $' + Math.round(netSavingsPerMonth).toLocaleString() + '/mo in savings</div>' : '') +
  '</div>';

  document.getElementById('brAcceleratorResult').innerHTML = html;
}

function brFormatExtraInput(el) {
  var val = el.value.replace(/[^0-9]/g, '');
  if (val) el.value = parseInt(val).toLocaleString();
  brUpdateAccelerator();
}

// ===== EQUITY RECOUP (Section 4 inside accelerator) =====
function brUpdateEquityTotal() {
  var totalNonMortgage = 0;
  brDebts.forEach(function(d) {
    if (d.balance > 0 && d.type !== 'mortgage') {
      totalNonMortgage += d.balance;
    }
  });
  var el = document.getElementById('brEquityDebtTotal');
  if (el) el.textContent = '$' + Math.round(totalNonMortgage).toLocaleString();
  var hidden = document.getElementById('brEquityDebtTotalVal');
  if (hidden) hidden.value = totalNonMortgage;
}

function brFetchAppreciation() {
  var zip = (document.getElementById('brEquityZip').value || '').trim();
  if (!zip || zip.length < 5) {
    alert('Please enter a valid 5-digit zip code.');
    return;
  }

  var btn = document.getElementById('brEquityFetchBtn');
  btn.textContent = 'Loading...';
  btn.disabled = true;

  fetch(API_BASE_BR + '/appreciation-rate?zip=' + encodeURIComponent(zip))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      brAppreciationData = data;
      btn.textContent = 'Update';
      btn.disabled = false;
      brRenderEquityRecoup();
    })
    .catch(function(err) {
      console.error('Appreciation fetch error:', err);
      btn.textContent = 'Error — Retry';
      btn.disabled = false;
    });
}

function brRenderEquityRecoup() {
  var container = document.getElementById('brEquityResult');
  if (!brAppreciationData) {
    container.innerHTML = '';
    return;
  }

  var homeValue = parseFloat((document.getElementById('brEquityHomeValue').value || '0').replace(/[^0-9.]/g, '')) || 0;
  var debtTotal = parseFloat(document.getElementById('brEquityDebtTotalVal').value) || 0;

  if (homeValue <= 0 || debtTotal <= 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:15px;font-size:13px;">Enter your current home value above to see the equity recoup timeline.</div>';
    return;
  }

  var data = brAppreciationData;
  var rates = [
    { label: '1-year rate', rate: data.oneYear, key: '1yr' },
    { label: '5-year avg', rate: data.fiveYear || data.rate, key: '5yr' },
    { label: '10-year avg', rate: data.tenYear, key: '10yr' }
  ].filter(function(r) { return r.rate !== null && r.rate !== undefined; });

  // Default to 5-year
  var selectedKey = document.getElementById('brEquityRateSelect') ? document.getElementById('brEquityRateSelect').value : '5yr';
  var selectedRate = data.fiveYear || data.rate || 3.5;
  rates.forEach(function(r) {
    if (r.key === selectedKey) selectedRate = r.rate;
  });

  // Calculate months to recoup
  var annualAppreciation = homeValue * (selectedRate / 100);
  var monthlyAppreciation = annualAppreciation / 12;
  var monthsToRecoup = monthlyAppreciation > 0 ? Math.ceil(debtTotal / monthlyAppreciation) : 0;

  var html = '<div class="br-equity-rates">' +
    '<div class="br-equity-rates-header">' +
      '<span>FHFA appreciation for ' + (data.stateName || data.state || 'your state') + '</span>' +
      '<span class="br-equity-source">Source: ' + (data.source || 'FHFA') + '</span>' +
    '</div>' +
    '<div class="br-equity-rates-row">';

  rates.forEach(function(r) {
    html += '<div class="br-equity-rate-card' + (r.key === selectedKey ? ' active' : '') + '" onclick="document.getElementById(\'brEquityRateSelect\').value=\'' + r.key + '\';brRenderEquityRecoup();">' +
      '<span class="br-equity-rate-label">' + r.label + '</span>' +
      '<span class="br-equity-rate-value">' + r.rate.toFixed(2) + '%</span>' +
    '</div>';
  });

  html += '</div></div>';

  html += '<div class="br-equity-timeline">' +
    '<div class="br-equity-timeline-big">' + brFormatMonths(monthsToRecoup) + '</div>' +
    '<div class="br-equity-timeline-label">to recoup $' + Math.round(debtTotal).toLocaleString() + ' in equity</div>' +
    '<div class="br-equity-timeline-detail">Your home at $' + Math.round(homeValue).toLocaleString() + ' appreciates ~$' + Math.round(monthlyAppreciation).toLocaleString() + '/mo at ' + selectedRate.toFixed(2) + '% annually</div>' +
  '</div>';

  html += '<input type="hidden" id="brEquityRateSelect" value="' + selectedKey + '">';
  container.innerHTML = html;
}

function brFormatEquityInput(el) {
  var val = el.value.replace(/[^0-9]/g, '');
  if (val) el.value = parseInt(val).toLocaleString();
  brRenderEquityRecoup();
}

// ===== PDF REPORT =====
function brGenerateReport() {
  // Gather all data
  var clientName = brClientName || document.getElementById('brClientSearch').value.trim() || 'Client';
  var debts = brDebts.filter(function(d) { return d.balance > 0; });
  if (debts.length === 0) { alert('Add at least one debt to generate a report.'); return; }

  // Summary
  var totalBalance = 0, weightedRateSum = 0, totalPayment = 0;
  debts.forEach(function(d) {
    totalBalance += d.balance;
    weightedRateSum += d.balance * d.rate;
    totalPayment += d.payment > 0 ? d.payment : brEstimateMinPayment(d);
  });
  var blendedRate = totalBalance > 0 ? weightedRateSum / totalBalance : 0;

  // Debt summaries
  var debtSummaries = debts.map(function(d) {
    var result = brCalcDebtPayoff(d);
    return { debt: d, result: result };
  });

  var totalInterestAll = 0;
  debtSummaries.forEach(function(s) { totalInterestAll += s.result.totalInterest; });

  // Comparison data
  var compPanel = document.getElementById('brComparisonPanel');
  var hasComparison = compPanel && compPanel.style.display !== 'none';
  var newLoan = 0, newRate = 0, newTerm = 30, newPayment = 0, monthlySavings = 0;
  if (hasComparison) {
    newLoan = parseFloat(compPanel.dataset.newLoan) || 0;
    newRate = parseFloat(compPanel.dataset.newRate) || 0;
    newTerm = parseInt(compPanel.dataset.newTerm) || 30;
    newPayment = parseFloat(compPanel.dataset.newPayment) || 0;
    monthlySavings = parseFloat(compPanel.dataset.savings) || 0;
  }

  // Accelerator data
  var accPanel = document.getElementById('brAcceleratorPanel');
  var hasAccelerator = accPanel && accPanel.style.display !== 'none';
  var extraPayment = 0, accMonths = 0, accInterest = 0, savedInterest = 0, savedMonths = 0;
  if (hasAccelerator && newLoan > 0) {
    extraPayment = parseFloat((document.getElementById('brExtraPayment').value || '0').replace(/[^0-9.]/g, '')) || 0;
    if (extraPayment > 0) {
      var mr = (newRate / 100) / 12;
      var n = newTerm * 12;
      var stdPmt = mr === 0 ? newLoan / n : newLoan * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
      var stdInt = (stdPmt * n) - newLoan;
      var bal = newLoan;
      accMonths = 0;
      accInterest = 0;
      while (bal > 0.50 && accMonths < n + 120) {
        accMonths++;
        var int = bal * mr;
        var tp = stdPmt + extraPayment;
        if (tp > bal + int) tp = bal + int;
        bal -= (tp - int);
        accInterest += int;
      }
      savedMonths = n - accMonths;
      savedInterest = stdInt - accInterest;
    }
  }

  // Equity recoup
  var hasEquity = brAppreciationData && parseFloat(document.getElementById('brEquityHomeValue').value.replace(/[^0-9.]/g, '')) > 0;
  var equityData = null;
  if (hasEquity) {
    var homeVal = parseFloat(document.getElementById('brEquityHomeValue').value.replace(/[^0-9.]/g, ''));
    var debtTotalNonMtg = 0;
    brDebts.forEach(function(d) { if (d.balance > 0 && d.type !== 'mortgage') debtTotalNonMtg += d.balance; });
    var selKey = document.getElementById('brEquityRateSelect') ? document.getElementById('brEquityRateSelect').value : '5yr';
    var selRate = brAppreciationData.fiveYear || brAppreciationData.rate || 3.5;
    if (selKey === '1yr' && brAppreciationData.oneYear) selRate = brAppreciationData.oneYear;
    if (selKey === '10yr' && brAppreciationData.tenYear) selRate = brAppreciationData.tenYear;
    var annualApp = homeVal * (selRate / 100);
    var monthlyApp = annualApp / 12;
    var moRecoup = monthlyApp > 0 ? Math.ceil(debtTotalNonMtg / monthlyApp) : 0;
    equityData = {
      homeValue: homeVal,
      debtTotal: debtTotalNonMtg,
      rate: selRate,
      stateName: brAppreciationData.stateName || brAppreciationData.state || '',
      monthlyAppreciation: monthlyApp,
      monthsToRecoup: moRecoup
    };
  }

  // Build report HTML
  var now = new Date();
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dateStr = months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();

  var rpt = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">';
  rpt += '<title>Blended Rate Analysis — ' + clientName + '</title>';
  rpt += '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">';
  rpt += '<style>';
  rpt += brReportCSS();
  rpt += '</style></head><body>';

  // Report page
  rpt += '<div class="report-page">';

  // Hero
  rpt += '<div class="rpt-hero">';
  rpt += '<div class="rpt-greeting">Blended Rate Analysis</div>';
  rpt += '<div class="rpt-greeting-sub">Prepared for ' + clientName + ' · ' + dateStr + '</div>';
  rpt += '</div>';

  // Summary metrics
  rpt += '<div class="rpt-metrics">';
  rpt += '<div class="rpt-metric"><div class="rpt-metric-label">Total Debt</div><div class="rpt-metric-value">$' + Math.round(totalBalance).toLocaleString() + '</div></div>';
  rpt += '<div class="rpt-metric"><div class="rpt-metric-label">Blended Rate</div><div class="rpt-metric-value">' + blendedRate.toFixed(3) + '%</div></div>';
  rpt += '<div class="rpt-metric"><div class="rpt-metric-label">Monthly Payments</div><div class="rpt-metric-value">$' + Math.round(totalPayment).toLocaleString() + '</div></div>';
  rpt += '<div class="rpt-metric"><div class="rpt-metric-label">Total Interest</div><div class="rpt-metric-value rpt-red">$' + Math.round(totalInterestAll).toLocaleString() + '</div></div>';
  rpt += '</div>';

  // Debt detail table
  rpt += '<div class="rpt-section"><div class="rpt-section-title">Your Current Debts</div>';
  rpt += '<table class="rpt-table"><thead><tr><th>Debt</th><th>Type</th><th>Balance</th><th>Rate</th><th>Payment</th><th>Payoff Time</th><th>Total Interest</th><th>True Cost</th></tr></thead><tbody>';
  debtSummaries.forEach(function(s) {
    var d = s.debt;
    var r = s.result;
    rpt += '<tr>';
    rpt += '<td style="text-align:left;font-weight:600;">' + (d.name || 'Unnamed') + '</td>';
    rpt += '<td>' + d.type.charAt(0).toUpperCase() + d.type.slice(1) + '</td>';
    rpt += '<td>$' + Math.round(d.balance).toLocaleString() + '</td>';
    rpt += '<td>' + d.rate + '%</td>';
    rpt += '<td>$' + Math.round(r.monthlyPayment).toLocaleString() + '</td>';
    rpt += '<td>' + r.payoffTimeStr + '</td>';
    rpt += '<td class="rpt-red">$' + Math.round(r.totalInterest).toLocaleString() + '</td>';
    rpt += '<td>$' + Math.round(r.totalCost).toLocaleString() + '</td>';
    rpt += '</tr>';
  });
  rpt += '</tbody></table></div>';

  // Comparison section
  if (hasComparison && newLoan > 0) {
    rpt += '<div class="rpt-savings">';
    rpt += '<div class="rpt-savings-title">Consolidation Comparison</div>';
    rpt += '<div class="rpt-savings-grid">';
    rpt += '<div class="rpt-savings-col"><div class="rpt-savings-col-label">Current Debts</div>';
    rpt += '<div class="rpt-savings-stat"><div class="rpt-savings-stat-label">Monthly payment</div><div class="rpt-savings-stat-value">$' + Math.round(totalPayment).toLocaleString() + '</div></div>';
    rpt += '<div class="rpt-savings-stat"><div class="rpt-savings-stat-label">Blended rate</div><div class="rpt-savings-stat-value">' + blendedRate.toFixed(3) + '%</div></div>';
    rpt += '</div>';
    rpt += '<div class="rpt-savings-divider">VS</div>';
    rpt += '<div class="rpt-savings-col"><div class="rpt-savings-col-label">New Mortgage</div>';
    rpt += '<div class="rpt-savings-stat"><div class="rpt-savings-stat-label">Monthly P&I</div><div class="rpt-savings-stat-value" style="color:#5ebc8a;">$' + Math.round(newPayment).toLocaleString() + '</div></div>';
    rpt += '<div class="rpt-savings-stat"><div class="rpt-savings-stat-label">Interest rate</div><div class="rpt-savings-stat-value" style="color:#5ebc8a;">' + newRate.toFixed(3) + '%</div></div>';
    rpt += '</div></div>';
    if (monthlySavings > 0) {
      rpt += '<div class="rpt-savings-highlight"><div class="rpt-savings-big">$' + Math.round(monthlySavings).toLocaleString() + '/mo</div>';
      rpt += '<div class="rpt-savings-big-label">Monthly Savings</div>';
      rpt += '<div class="rpt-savings-desc">$' + Math.round(monthlySavings * 12).toLocaleString() + ' saved per year</div></div>';
    }
    rpt += '</div>';
  }

  // Accelerator section
  if (hasAccelerator && extraPayment > 0 && savedInterest > 0) {
    rpt += '<div class="rpt-section" style="background:linear-gradient(135deg,rgba(94,188,138,0.03) 0%,rgba(94,188,138,0.01) 100%);">';
    rpt += '<div class="rpt-section-title" style="color:#5ebc8a;">Payoff Accelerator</div>';
    rpt += '<p class="rpt-body-text">By applying just $' + Math.round(extraPayment).toLocaleString() + ' of your monthly savings as an extra principal payment:</p>';
    rpt += '<div class="rpt-accel-highlights">';
    rpt += '<div class="rpt-accel-item"><span class="rpt-accel-value" style="color:#5ebc8a;">' + brFormatMonths(accMonths) + '</span><span class="rpt-accel-label">New payoff time</span></div>';
    rpt += '<div class="rpt-accel-item"><span class="rpt-accel-value" style="color:#5ebc8a;">$' + Math.round(savedInterest).toLocaleString() + '</span><span class="rpt-accel-label">Interest saved</span></div>';
    rpt += '<div class="rpt-accel-item"><span class="rpt-accel-value" style="color:#5ebc8a;">' + brFormatMonths(savedMonths) + '</span><span class="rpt-accel-label">Paid off early</span></div>';
    if (monthlySavings - extraPayment > 0) {
      rpt += '<div class="rpt-accel-item"><span class="rpt-accel-value">$' + Math.round(monthlySavings - extraPayment).toLocaleString() + '/mo</span><span class="rpt-accel-label">Still in your pocket</span></div>';
    }
    rpt += '</div></div>';
  }

  // Equity recoup
  if (equityData) {
    rpt += '<div class="rpt-section">';
    rpt += '<div class="rpt-section-title">Equity Recovery Timeline</div>';
    rpt += '<p class="rpt-body-text">Based on your home value of $' + Math.round(equityData.homeValue).toLocaleString() + ' and ' + equityData.stateName + '\'s ' + equityData.rate.toFixed(2) + '% annual appreciation rate:</p>';
    rpt += '<div class="rpt-equity-highlight">';
    rpt += '<div class="rpt-equity-big">' + brFormatMonths(equityData.monthsToRecoup) + '</div>';
    rpt += '<div class="rpt-equity-label">to recoup $' + Math.round(equityData.debtTotal).toLocaleString() + ' in equity used for consolidation</div>';
    rpt += '<div class="rpt-equity-detail">Your home appreciates approximately $' + Math.round(equityData.monthlyAppreciation).toLocaleString() + ' per month</div>';
    rpt += '</div></div>';
  }

  // Footer
  rpt += '<div class="rpt-footer"><div class="footer-standard">';
  rpt += '<div class="footer-your-info"><div class="footer-initials">KF</div>';
  rpt += '<div class="footer-details"><div class="footer-name">Kristy Flach</div>';
  rpt += '<div class="footer-credentials">Loan Officer · NMLS# 2632259<br>Cell: (206) 313-5883<br>kflach@prmg.net · kflach.myprmg.net</div></div></div>';
  rpt += '<div class="footer-logos-text"><div style="font-size:10px;font-weight:600;color:rgba(232,228,220,0.6);">Paramount Residential Mortgage Group</div>';
  rpt += '<div style="font-size:9px;color:rgba(232,228,220,0.3);">NMLS# 75243 · Equal Housing Lender</div></div>';
  rpt += '</div></div>';

  // Disclosures
  rpt += '<div class="rpt-disclosures">';
  rpt += 'Prepared ' + dateStr + '. &copy; Paramount Residential Mortgage Group, Inc. ("PRMG") NMLS ID #75243; 1265 Corona Pointe Court, Corona, CA 92879. All Rights Reserved. This blended rate analysis is for informational and educational purposes only and does not constitute a commitment to lend. Actual rates, terms, and savings may vary. Revolving debt minimum payments estimated using industry-standard formula (1% of balance + monthly interest, $25 floor). Installment loan calculations based on entered payment amounts. Home appreciation rates sourced from the FHFA House Price Index and represent historical averages — future appreciation is not guaranteed.';
  rpt += '<div class="rpt-disc-logos"><span>MEMBER FDIC</span><span>EQUAL HOUSING LENDER</span><span>NMLS #75243</span></div>';
  rpt += '</div>';

  rpt += '</div>'; // end report-page
  rpt += '</body></html>';

  // Open in new tab
  var win = window.open('', '_blank');
  win.document.write(rpt);
  win.document.close();
}

function brReportCSS() {
  return '*{box-sizing:border-box;margin:0;padding:0;}' +
  ':root{--bg:#07090e;--surface:#0d1117;--surface-raised:#131920;--border:rgba(255,255,255,0.05);--border-gold:rgba(186,163,112,0.18);--gold:#baa370;--gold-bright:#d4bc7c;--gold-dim:rgba(186,163,112,0.4);--green:#5ebc8a;--red:#d97373;--blue:#6ba3d6;--text:#e8e4dc;--text-mid:rgba(232,228,220,0.6);--text-dim:rgba(232,228,220,0.3);--text-faint:rgba(232,228,220,0.15);}' +
  'body{font-family:"DM Sans",system-ui,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}' +
  '.report-page{max-width:1060px;margin:20px auto;background:var(--surface);border:1px solid var(--border-gold);overflow:hidden;}' +
  '.rpt-hero{padding:52px 64px 48px;border-bottom:1px solid var(--border);position:relative;}' +
  '.rpt-hero::after{content:"";position:absolute;bottom:0;left:64px;right:64px;height:1px;background:linear-gradient(90deg,transparent,var(--gold-dim),transparent);}' +
  '.rpt-greeting{font-family:"Playfair Display",serif;font-size:28px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:4px;}' +
  '.rpt-greeting-sub{font-size:13px;color:var(--text-dim);}' +
  '.rpt-metrics{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border);}' +
  '.rpt-metric{padding:22px 24px;border-right:1px solid var(--border);text-align:center;}' +
  '.rpt-metric:last-child{border-right:none;}' +
  '.rpt-metric-label{font-size:9px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;}' +
  '.rpt-metric-value{font-family:"Playfair Display",serif;font-size:22px;font-weight:700;color:var(--text);}' +
  '.rpt-red{color:var(--red)!important;}' +
  '.rpt-section{padding:40px 64px;border-bottom:1px solid var(--border);}' +
  '.rpt-section-title{font-family:"Playfair Display",serif;font-size:18px;font-weight:600;color:var(--text);margin-bottom:16px;}' +
  '.rpt-body-text{font-size:13px;color:var(--text-mid);line-height:1.6;margin-bottom:20px;}' +
  '.rpt-table{width:100%;border-collapse:collapse;}' +
  '.rpt-table thead th{padding:8px 10px;text-align:right;font-size:8px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--border-gold);background:var(--surface-raised);}' +
  '.rpt-table thead th:first-child{text-align:left;}' +
  '.rpt-table tbody td{padding:8px 12px;font-size:12px;color:var(--text-mid);border-bottom:1px solid var(--border);text-align:right;font-variant-numeric:tabular-nums;}' +
  '.rpt-table tbody td:first-child{text-align:left;font-weight:600;color:var(--text);}' +
  '.rpt-savings{padding:40px 64px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,rgba(94,188,138,0.03) 0%,rgba(94,188,138,0.01) 100%);}' +
  '.rpt-savings-title{font-family:"Playfair Display",serif;font-size:18px;font-weight:600;color:var(--green);margin-bottom:24px;}' +
  '.rpt-savings-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:0;align-items:center;}' +
  '.rpt-savings-col{text-align:center;}' +
  '.rpt-savings-col-label{font-size:9px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;}' +
  '.rpt-savings-stat{margin-bottom:10px;}' +
  '.rpt-savings-stat-label{font-size:10px;color:var(--text-dim);margin-bottom:1px;}' +
  '.rpt-savings-stat-value{font-family:"Playfair Display",serif;font-size:20px;font-weight:700;color:var(--text);}' +
  '.rpt-savings-divider{width:50px;height:50px;border-radius:50%;background:rgba(94,188,138,0.12);border:1px solid rgba(94,188,138,0.2);color:var(--green);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;margin:0 24px;}' +
  '.rpt-savings-highlight{margin-top:24px;padding:20px 24px;border-radius:8px;background:rgba(94,188,138,0.04);border:1px solid rgba(94,188,138,0.1);text-align:center;}' +
  '.rpt-savings-big{font-family:"Playfair Display",serif;font-size:32px;font-weight:700;color:var(--green);}' +
  '.rpt-savings-big-label{font-size:12px;color:var(--green);font-weight:600;margin-top:2px;}' +
  '.rpt-savings-desc{font-size:11px;color:var(--text-dim);margin-top:4px;}' +
  '.rpt-accel-highlights{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;}' +
  '.rpt-accel-item{text-align:center;padding:16px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;}' +
  '.rpt-accel-value{display:block;font-family:"Playfair Display",serif;font-size:20px;font-weight:700;color:var(--text);margin-bottom:4px;}' +
  '.rpt-accel-label{font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;}' +
  '.rpt-equity-highlight{text-align:center;padding:24px;background:rgba(186,163,112,0.04);border:1px solid var(--border-gold);border-radius:8px;}' +
  '.rpt-equity-big{font-family:"Playfair Display",serif;font-size:28px;font-weight:700;color:var(--gold);}' +
  '.rpt-equity-label{font-size:13px;color:var(--text-mid);margin-top:4px;}' +
  '.rpt-equity-detail{font-size:11px;color:var(--text-dim);margin-top:8px;}' +
  '.rpt-footer{background:var(--surface-raised);padding:28px 64px;border-top:1px solid var(--border);}' +
  '.footer-standard{display:flex;justify-content:space-between;align-items:center;gap:30px;}' +
  '.footer-your-info{display:flex;align-items:center;gap:16px;}' +
  '.footer-initials{width:44px;height:44px;border-radius:50%;background:var(--surface);border:1px solid var(--border-gold);color:var(--gold);font-family:"Playfair Display",serif;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;}' +
  '.footer-details{line-height:1.5;}' +
  '.footer-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;}' +
  '.footer-credentials{font-size:10px;color:var(--text-dim);line-height:1.5;}' +
  '.footer-logos-text{text-align:right;}' +
  '.rpt-disclosures{background:var(--bg);padding:14px 64px;font-size:7.5px;color:var(--text-faint);line-height:1.7;text-align:center;border-top:1px solid var(--border);max-width:1060px;margin:0 auto;}' +
  '.rpt-disc-logos{display:flex;justify-content:center;gap:24px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.03);}' +
  '.rpt-disc-logos span{font-size:8px;font-weight:700;color:var(--text-faint);letter-spacing:1px;text-transform:uppercase;}' +
  '@media print{body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.report-page{margin:0;max-width:100%;border:none;}.rpt-hero{padding:24px 40px 20px;}.rpt-section{padding:20px 40px;}.rpt-savings{padding:20px 40px;}.rpt-footer{padding:18px 40px;}.rpt-disclosures{padding:8px 40px 12px;}@page{margin:0.25in;size:letter;}}';
}

function brPrintReport() {
  brGenerateReport();
}
