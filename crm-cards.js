/* ===================================================
   CRM CARDS - Contact Card System for Mission Control
   Type-adaptive forms, pipeline integration, income calc
   =================================================== */

var CRM_API = 'https://agent-edge-backend.vercel.app/api';

// ===== TYPE DEFINITIONS =====
var CONTACT_TYPES = {
  client:     { label: 'Client',     icon: 'fa-user',              color: 'var(--type-client)' },
  borrower:   { label: 'Borrower',   icon: 'fa-file-invoice-dollar', color: 'var(--type-borrower)' },
  realtor:    { label: 'Realtor',    icon: 'fa-handshake',         color: 'var(--type-realtor)' },
  title:      { label: 'Title',      icon: 'fa-building',          color: 'var(--type-title)' },
  appraiser:  { label: 'Appraiser',  icon: 'fa-search-dollar',     color: 'var(--type-appraiser)' },
  contractor: { label: 'Contractor', icon: 'fa-hard-hat',          color: 'var(--type-contractor)' },
  vendor:     { label: 'Vendor',     icon: 'fa-store',             color: 'var(--type-vendor)' },
  other:      { label: 'Other',      icon: 'fa-ellipsis-h',        color: 'var(--type-other)' }
};

var PIPELINE_STAGES = [
  { id: 'warm', label: 'Warm Leads' },
  { id: 'active', label: 'Active Conversations' },
  { id: 'credit', label: 'Credit Repair' },
  { id: 'preapproval', label: 'Started Pre-Approval' },
  { id: 'preapproved', label: 'Approved' },
  { id: 'ratewatch', label: 'Rate Watch' },
  { id: 'underwriting', label: 'Underwriting' },
  { id: 'closed', label: 'Closed - Funded' }
];

function sourceOptions() {
  return [
    { value: '', label: '--' }, { value: 'referral', label: 'Referral' },
    { value: 'pipeline', label: 'Pipeline' }, { value: 'portal', label: 'Portal' },
    { value: 'portal_signup', label: 'Portal Signup' }, { value: 'webinar', label: 'Webinar' },
    { value: 'social', label: 'Social Media' }, { value: 'manual', label: 'Manual' },
    { value: 'import', label: 'Import' }
  ];
}

// ===== FIELD DEFINITIONS PER TYPE =====
function getFieldsForType(type) {
  var contactFields = [
    { id: 'name', label: 'Name', type: 'text', required: true },
    { id: 'phone', label: 'Phone', type: 'tel' },
    { id: 'email', label: 'Email', type: 'email' }
  ];
  var addressFields = [
    { id: 'address', label: 'Street', type: 'text' },
    { id: 'city', label: 'City', type: 'text' },
    { id: 'state', label: 'State', type: 'text', maxlength: 2 },
    { id: 'zip', label: 'Zip', type: 'text', maxlength: 10 }
  ];
  var noteFields = [
    { id: 'tags', label: 'Tags', type: 'text', placeholder: 'Comma-separated' },
    { id: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
  ];

  switch(type) {
    case 'client':
      return [
        { section: 'Contact Info', fields: contactFields },
        { section: 'Address', fields: addressFields },
        { section: 'Employment', fields: [
          { id: 'employer', label: 'Employer', type: 'text' },
          { id: 'job_title', label: 'Job Title', type: 'text' }
        ]},
        { section: 'Personal', fields: [
          { id: 'birthday', label: 'Birthday', type: 'date' },
          { id: 'spouse_name', label: 'Spouse / Partner', type: 'text' },
          { id: 'kids', label: 'Kids', type: 'text' }
        ]},
        { section: 'Source', fields: [
          { id: 'source', label: 'Source', type: 'select', options: sourceOptions() },
          { id: 'realtor_name', label: 'Referring Realtor', type: 'text', conditional: 'source', conditionValue: 'referral' }
        ]},
        { section: 'Tags & Notes', fields: noteFields }
      ];

    case 'borrower':
      return [
        { section: 'Contact Info', fields: contactFields },
        { section: 'Current Address', fields: [
          { id: 'address', label: 'Street', type: 'text' },
          { id: 'city', label: 'City', type: 'text' },
          { id: 'state', label: 'State', type: 'text', maxlength: 2 },
          { id: 'zip', label: 'Zip', type: 'text', maxlength: 10 },
          { id: 'own_rent', label: 'Own or Rent', type: 'select', options: [
            { value: '', label: '--' }, { value: 'own', label: 'Own' }, { value: 'rent', label: 'Rent' }
          ]},
          { id: 'monthly_payment', label: 'Monthly Payment', type: 'number', placeholder: '0.00' },
          { id: 'retain_sell', label: 'Retain or Sell', type: 'select', options: [
            { value: '', label: '--' }, { value: 'retain', label: 'Retain' }, { value: 'sell', label: 'Sell' }, { value: 'na', label: 'N/A (renting)' }
          ]}
        ]},
        { section: 'Personal', fields: [
          { id: 'birthday', label: 'Birthday', type: 'date' },
          { id: 'spouse_name', label: 'Spouse / Partner', type: 'text' },
          { id: 'kids', label: 'Kids', type: 'text' }
        ]},
        { section: 'Source', fields: [
          { id: 'source', label: 'Source', type: 'select', options: sourceOptions() },
          { id: 'realtor_name', label: 'Referring Realtor', type: 'text', conditional: 'source', conditionValue: 'referral' }
        ]},
        { section: 'Employment & Income', fields: [
          { id: 'employer', label: 'Employer', type: 'text' },
          { id: 'job_title', label: 'Job Title', type: 'text' },
          { id: 'income_type', label: 'Income Type', type: 'select', options: [
            { value: '', label: '--' }, { value: 'w2', label: 'W-2' }, { value: 'self_employed', label: 'Self-Employed' },
            { value: '1099', label: '1099' }, { value: 'mixed', label: 'Mixed' }
          ]},
          { id: 'self_reported_wages', label: 'Self-Reported Wages', type: 'number', placeholder: '0.00' },
          { id: 'w2_year1', label: 'W-2 Prior Year', type: 'number', placeholder: '0.00' },
          { id: 'w2_year2', label: 'W-2 Year Before', type: 'number', placeholder: '0.00' },
          { id: 'ytd', label: 'YTD Earnings', type: 'number', placeholder: '0.00' },
          { id: 'qualifying_earnings', label: 'Qualifying Earnings', type: 'number', placeholder: '0.00' }
        ]},
        { section: 'Income Calculator', fields: [], calculator: true },
        { section: 'Loan Details', fields: [
          { id: 'loan_type', label: 'Loan Type', type: 'select', options: [
            { value: '', label: '--' }, { value: 'purchase', label: 'Purchase' }, { value: 'refinance', label: 'Refinance' },
            { value: 'cashout', label: 'Cash-Out Refi' }, { value: 'fha', label: 'FHA' },
            { value: 'va', label: 'VA' }, { value: 'usda', label: 'USDA' }, { value: 'jumbo', label: 'Jumbo' }
          ]},
          { id: 'interest_rate', label: 'Interest Rate (%)', type: 'number', placeholder: '0.000' },
          { id: 'lock_status', label: 'Lock Status', type: 'select', options: [
            { value: '', label: '--' }, { value: 'unlocked', label: 'Unlocked' }, { value: 'locked', label: 'Locked' },
            { value: 'expired', label: 'Expired' }
          ]},
          { id: 'subject_address', label: 'Subject Property', type: 'text', fullWidth: true }
        ]},
        { section: 'Key Dates', fields: [
          { id: 'date_mutual', label: 'Mutual Acceptance', type: 'date' },
          { id: 'date_emd', label: 'EMD Due', type: 'date' },
          { id: 'date_appraisal', label: 'Appraisal', type: 'date' },
          { id: 'date_inspection', label: 'Inspection', type: 'date' },
          { id: 'date_conditional', label: 'Conditional Approval', type: 'date' },
          { id: 'date_final_approval', label: 'Final Approval', type: 'date' },
          { id: 'date_closing', label: 'Closing', type: 'date' }
        ]},
        { section: 'Documents & Notes', fields: [], documents: true }
      ];

    case 'realtor':
      return [
        { section: 'Contact Info', fields: contactFields },
        { section: 'Brokerage', fields: [
          { id: 'company', label: 'Brokerage Name', type: 'text' },
          { id: 'license_number', label: 'License Number', type: 'text' }
        ]},
        { section: 'Brokerage Address', fields: addressFields },
        { section: 'Credentials', fields: [
          { id: 'headshot_url', label: 'Headshot', type: 'text', placeholder: 'URL or uploaded via portal' }
        ]},
        { section: 'Web & Social', fields: [
          { id: 'website', label: 'Website', type: 'text' },
          { id: 'facebook', label: 'Facebook', type: 'text' },
          { id: 'instagram', label: 'Instagram', type: 'text' },
          { id: 'linkedin', label: 'LinkedIn', type: 'text' },
          { id: 'tiktok', label: 'TikTok', type: 'text' }
        ]},
        { section: 'Tags & Notes', fields: noteFields }
      ];

    case 'title':
    case 'appraiser':
      return [
        { section: 'Contact Info', fields: contactFields },
        { section: 'Company', fields: [
          { id: 'company', label: 'Company Name', type: 'text' }
        ]},
        { section: 'Address', fields: addressFields },
        { section: 'Web', fields: [
          { id: 'website', label: 'Website', type: 'text' }
        ]},
        { section: 'Tags & Notes', fields: noteFields }
      ];

    default: // contractor, vendor, other
      return [
        { section: 'Contact Info', fields: contactFields },
        { section: 'Company', fields: [
          { id: 'company', label: 'Company Name', type: 'text' }
        ]},
        { section: 'Address', fields: addressFields },
        { section: 'Tags & Notes', fields: noteFields }
      ];
  }
}

// ===== TYPE PICKER MODAL =====
function showTypePicker(callback) {
  var overlay = document.getElementById('typePickerOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'typePickerOverlay';
    overlay.className = 'type-picker-overlay';
    var picker = '<div class="type-picker"><h3>What type of contact?</h3><div class="type-picker-grid">';
    Object.keys(CONTACT_TYPES).forEach(function(key) {
      var t = CONTACT_TYPES[key];
      picker += '<div class="type-picker-btn" data-type="' + key + '">' +
        '<span class="type-dot" style="background:' + t.color + '"></span>' +
        '<i class="fas ' + t.icon + ' type-icon"></i>' +
        '<span>' + t.label + '</span></div>';
    });
    picker += '</div><button class="type-picker-cancel" onclick="closeTypePicker()">Cancel</button></div>';
    overlay.innerHTML = picker;
    document.body.appendChild(overlay);
  }
  overlay.querySelectorAll('.type-picker-btn').forEach(function(btn) {
    btn.onclick = function() {
      closeTypePicker();
      callback(btn.dataset.type);
    };
  });
  overlay.classList.add('show');
}

function closeTypePicker() {
  var o = document.getElementById('typePickerOverlay');
  if (o) o.classList.remove('show');
}

// ===== RENDER CARD FORM =====
function renderCardForm(container, type, data) {
  data = data || {};
  var sections = getFieldsForType(type);
  var html = '';

  sections.forEach(function(sec) {
    // Income calculator section — dual mode (W-2 and Self-Employed)
    if (sec.calculator) {
      html += '<div class="card-section">' +
        '<div class="card-section-title">' + sec.section + '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:14px;">' +
          '<div class="calc-embed-toggle" onclick="showCalcTab(\'w2\')" id="calcTabW2" style="flex:1;">' +
            '<i class="fas fa-calculator"></i> W-2 Income Calculator</div>' +
          '<div class="calc-embed-toggle" onclick="showCalcTab(\'se\')" id="calcTabSE" style="flex:1;">' +
            '<i class="fas fa-store"></i> Self-Employed Calculator</div>' +
        '</div>' +
        '<div class="calc-embed-panel" id="calcPanelW2">' + buildIncomeCalculatorHTML() + '</div>' +
        '<div class="calc-embed-panel" id="calcPanelSE">' + buildSECalculatorHTML() + '</div>' +
      '</div>';
      return;
    }

    // Documents & Notes section
    if (sec.documents) {
      html += '<div class="card-section">' +
        '<div class="card-section-title">' + sec.section + '</div>' +
        '<div class="doc-upload-area">' +
          '<div class="doc-list" id="docList"></div>' +
          '<div class="doc-upload-btn-row">' +
            '<label class="card-action-btn" style="cursor:pointer;"><i class="fas fa-upload"></i> Upload Document' +
              '<input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style="display:none;" onchange="handleDocUpload(this)" multiple>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div class="card-fields" style="margin-top:14px;">' +
          '<div class="card-field full-width"><label>Notes</label>' +
            '<textarea id="cf_notes" class="card-tracked" rows="3">' + (data.notes || '') + '</textarea></div>' +
        '</div>' +
      '</div>';
      return;
    }

    html += '<div class="card-section"><div class="card-section-title">' + sec.section + '</div><div class="card-fields">';

    sec.fields.forEach(function(f) {
      var val = data[f.id] || '';
      // Escape quotes in values
      var safeVal = String(val).replace(/"/g, '&quot;');
      var cls = 'card-field';
      if (f.fullWidth) cls += ' full-width';
      if (f.conditional) cls += ' conditional' + (data[f.conditional] === f.conditionValue ? ' visible' : '');

      html += '<div class="' + cls + '" data-field="' + f.id + '"';
      if (f.conditional) html += ' data-condition="' + f.conditional + '" data-condition-value="' + f.conditionValue + '"';
      html += '><label>' + f.label + '</label>';

      if (f.type === 'select') {
        html += '<select id="cf_' + f.id + '" class="card-tracked">';
        (f.options || []).forEach(function(opt) {
          html += '<option value="' + opt.value + '"' + (val === opt.value ? ' selected' : '') + '>' + opt.label + '</option>';
        });
        html += '</select>';
      } else if (f.type === 'textarea') {
        html += '<textarea id="cf_' + f.id + '" class="card-tracked" rows="3">' + (val || '') + '</textarea>';
      } else {
        var attrs = ' type="' + (f.type || 'text') + '"';
        attrs += ' id="cf_' + f.id + '" class="card-tracked"';
        attrs += ' value="' + safeVal + '"';
        if (f.maxlength) attrs += ' maxlength="' + f.maxlength + '"';
        if (f.placeholder) attrs += ' placeholder="' + f.placeholder + '"';
        if (f.required) attrs += ' required';
        html += '<input' + attrs + '>';
      }
      html += '</div>';
    });
    html += '</div></div>';
  });

  container.innerHTML = html;

  // Wire conditional fields
  container.querySelectorAll('.card-tracked').forEach(function(el) {
    el.addEventListener('change', function() {
      var fid = el.id.replace('cf_', '');
      container.querySelectorAll('[data-condition="' + fid + '"]').forEach(function(cf) {
        if (el.value === cf.dataset.conditionValue) {
          cf.classList.add('visible');
        } else {
          cf.classList.remove('visible');
        }
      });
    });
  });

  // Wire dirty tracking
  container.querySelectorAll('.card-tracked').forEach(function(el) {
    var handler = function() {
      crmDirty = true;
      var sb = document.getElementById('crmSaveBtn');
      if (sb) sb.disabled = false;
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
}

// ===== COLLECT FORM DATA =====
function collectCardData(container) {
  var data = {};
  container.querySelectorAll('.card-tracked').forEach(function(el) {
    var id = el.id.replace('cf_', '');
    data[id] = el.value || null;
  });
  return data;
}

// ===== PIPELINE BUTTON =====
function renderPipelineButton(container, contactId, currentStage) {
  var isIn = !!currentStage;
  var stageObj = isIn ? PIPELINE_STAGES.find(function(s) { return s.id === currentStage; }) : null;
  var stageLabel = stageObj ? stageObj.label : '';

  var html = '<div class="pipeline-action" style="position:relative;">' +
    '<button class="pipeline-stage-btn ' + (isIn ? 'in-pipeline' : 'not-in-pipeline') + '" onclick="togglePipelineDropdown()">' +
    '<i class="fas fa-funnel-dollar"></i> ' +
    (isIn ? stageLabel : 'Add to Pipeline') +
    ' <i class="fas fa-caret-down" style="margin-left:4px;font-size:10px;"></i></button>' +
    '<div class="pipeline-dropdown" id="pipelineDropdown">';

  PIPELINE_STAGES.forEach(function(stage) {
    html += '<div class="pipeline-dropdown-item' + (currentStage === stage.id ? ' active' : '') +
      '" onclick="setPipelineStage(\'' + contactId + '\',\'' + stage.id + '\')">' + stage.label + '</div>';
  });
  if (isIn) {
    html += '<div class="pipeline-dropdown-item pipeline-dropdown-remove" onclick="removePipelineStage(\'' + contactId + '\')"><i class="fas fa-times"></i> Remove from Pipeline</div>';
  }
  html += '</div></div>';
  container.innerHTML = html;
}

function togglePipelineDropdown() {
  var dd = document.getElementById('pipelineDropdown');
  if (dd) dd.classList.toggle('show');
  setTimeout(function() {
    var closer = function(e) {
      if (!e.target.closest('.pipeline-action')) {
        dd.classList.remove('show');
        document.removeEventListener('click', closer);
      }
    };
    document.addEventListener('click', closer);
  }, 10);
}

function setPipelineStage(contactId, stage) {
  var pipelineId = 'crm-' + contactId;
  var n = document.getElementById('cf_name');
  var p = document.getElementById('cf_phone');
  var e = document.getElementById('cf_email');

  fetch(CRM_API + '/pipeline-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save', id: pipelineId,
      name: n ? n.value : '', phone: p ? p.value : '', email: e ? e.value : '',
      stage: stage, source: 'crm', realtorName: '', loanType: '', interestRate: '',
      subjectAddress: '', dates: {}, borrowers: []
    })
  }).then(function() {
    var dd = document.getElementById('pipelineDropdown');
    if (dd) dd.classList.remove('show');
    var btn = document.getElementById('cardPipelineBtn');
    if (btn) renderPipelineButton(btn, contactId, stage);
    showToast((n ? n.value : 'Contact') + ' moved to pipeline');
    if (typeof loadPipeline === 'function') loadPipeline();

    // ===== AUTO-CONVERT TO BORROWER =====
    // If current type is not already borrower, convert it
    if (crmCurrentType !== 'borrower') {
      var oldType = crmCurrentType;
      crmCurrentType = 'borrower';

      // Update type in CRM database
      fetch(CRM_API + '/crm-api?action=save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crm: { id: contactId, type: 'borrower' } })
      }).catch(function(err) { console.error('Type update error:', err); });

      // Update local crmContacts array
      if (typeof crmContacts !== 'undefined') {
        var idx = crmContacts.findIndex(function(c) { return c.id === contactId; });
        if (idx >= 0) crmContacts[idx].type = 'borrower';
      }

      // Re-render the card as Borrower type
      var typeInfo = CONTACT_TYPES.borrower;
      document.getElementById('crmDTypeBadge').innerHTML =
        '<span class="card-type-badge" style="background:' + typeInfo.color + '22;color:' + typeInfo.color + ';">' +
        '<i class="fas ' + typeInfo.icon + '"></i> ' + typeInfo.label + '</span>';

      // Collect current form data before re-rendering
      var formContainer = document.getElementById('crmCardForm');
      var currentData = collectCardData(formContainer);
      currentData.type = 'borrower';

      // Re-render with borrower fields, preserving existing data
      renderCardForm(formContainer, 'borrower', currentData);

      // Refresh the contact list to show updated type badge
      if (typeof crmRenderList === 'function') crmRenderList();

      showToast('Converted to Borrower - full loan fields now available');
    }
  }).catch(function(err) { console.error('Pipeline save error:', err); });
}

function removePipelineStage(contactId) {
  var pipelineId = 'crm-' + contactId;
  fetch(CRM_API + '/pipeline-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', contactId: pipelineId })
  }).then(function() {
    var dd = document.getElementById('pipelineDropdown');
    if (dd) dd.classList.remove('show');
    var btn = document.getElementById('cardPipelineBtn');
    if (btn) renderPipelineButton(btn, contactId, null);
    showToast('Removed from pipeline');
    if (typeof loadPipeline === 'function') loadPipeline();
  }).catch(function(err) { console.error('Pipeline remove error:', err); });
}

// ===== INCOME CALCULATOR (EMBEDDED) =====
function showCalcTab(which) {
  var w2 = document.getElementById('calcPanelW2');
  var se = document.getElementById('calcPanelSE');
  var tabW2 = document.getElementById('calcTabW2');
  var tabSE = document.getElementById('calcTabSE');
  if (which === 'w2') {
    if (w2) { w2.classList.toggle('open'); if (se) se.classList.remove('open'); }
    if (tabW2) tabW2.classList.add('active-calc');
    if (tabSE) tabSE.classList.remove('active-calc');
    // Pre-populate W-2 calc from card fields
    if (w2 && w2.classList.contains('open')) populateW2CalcFromCard();
  } else {
    if (se) { se.classList.toggle('open'); if (w2) w2.classList.remove('open'); }
    if (tabSE) tabSE.classList.add('active-calc');
    if (tabW2) tabW2.classList.remove('active-calc');
    // Pre-populate SE calc from card fields
    if (se && se.classList.contains('open')) populateSECalcFromCard();
  }
}

// Pre-populate W-2 calculator from Employment & Income card fields
function populateW2CalcFromCard() {
  var mappings = [
    // Card field id → Calc field id
    { card: 'cf_w2_year1', calc: 'calc_otYear1' },
    { card: 'cf_w2_year2', calc: 'calc_otYear2' },
    { card: 'cf_ytd', calc: 'calc_otYTD' },
    { card: 'cf_self_reported_wages', calc: 'calc_salaryAmount' }
  ];
  mappings.forEach(function(m) {
    var cardEl = document.getElementById(m.card);
    var calcEl = document.getElementById(m.calc);
    if (cardEl && calcEl && cardEl.value && !calcEl.value) {
      calcEl.value = cardEl.value;
    }
  });
  calcTotal();
}

// Pre-populate SE calculator from card fields
function populateSECalcFromCard() {
  // If W-2 year fields have data, use them as SE net profit
  var w2y1 = document.getElementById('cf_w2_year1');
  var w2y2 = document.getElementById('cf_w2_year2');
  var seY1 = document.getElementById('calc_se_y1_net');
  var seY2 = document.getElementById('calc_se_y2_net');
  if (w2y1 && seY1 && w2y1.value && !seY1.value) seY1.value = w2y1.value;
  if (w2y2 && seY2 && w2y2.value && !seY2.value) seY2.value = w2y2.value;
  calcSETotal();
}

function toggleCalcEmbed() { showCalcTab('w2'); }

function calcFormat(amt) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt);
}

function calcVal(id) { return parseFloat(document.getElementById(id).value) || 0; }

function calcLowestAvg(ytd, ytdMonths, year1, year2) {
  var avgs = [];
  if (ytdMonths > 0) avgs.push(ytd / ytdMonths);
  if (ytdMonths > 0 && year1 > 0) avgs.push((ytd + year1) / (ytdMonths + 12));
  if (ytdMonths > 0 && year1 > 0 && year2 > 0) avgs.push((ytd + year1 + year2) / (ytdMonths + 24));
  return avgs.length > 0 ? Math.min.apply(null, avgs) : 0;
}

function calcTotal() {
  // Hourly
  var hourly = (calcVal('calc_hourlyRate') * calcVal('calc_hoursPerWeek') * 52) / 12;
  document.getElementById('calcHourlyResult').textContent = calcFormat(hourly);

  // Salary
  var salAmt = calcVal('calc_salaryAmount');
  var salType = document.getElementById('calc_salaryType').value;
  var salary = 0;
  if (salType === 'monthly') salary = salAmt;
  else if (salType === 'biweekly') salary = salAmt * 26 / 12;
  else if (salType === 'semimonthly') salary = salAmt * 24 / 12;
  else if (salType === 'weekly') salary = salAmt * 52 / 12;
  document.getElementById('calcSalaryResult').textContent = calcFormat(salary);

  // OT/Bonus
  var ot = calcLowestAvg(calcVal('calc_otYTD'), calcVal('calc_otYTDMonths'), calcVal('calc_otYear1'), calcVal('calc_otYear2'));
  document.getElementById('calcOTResult').textContent = calcFormat(ot);

  // Commission
  var commYtdNet = calcVal('calc_commYTD') - calcVal('calc_commYTDExp');
  var comm = calcLowestAvg(commYtdNet, calcVal('calc_commMonths'), calcVal('calc_commYear1'), calcVal('calc_commYear2'));
  document.getElementById('calcCommResult').textContent = calcFormat(comm);

  // Non-taxable
  var nonTax = calcVal('calc_nonTaxable') * 1.25;
  document.getElementById('calcNonTaxResult').textContent = calcFormat(nonTax);

  // Total
  var total = hourly + salary + ot + comm + nonTax;
  document.getElementById('calcTotalIncome').textContent = calcFormat(total);
}

function saveCalcToBorrower() {
  var total = document.getElementById('calcTotalIncome').textContent;
  
  // Write qualifying earnings
  var qe = document.getElementById('cf_qualifying_earnings');
  if (qe) qe.value = total.replace(/[^0-9.]/g, '');

  // Write calc values back to card fields
  var writeBack = [
    { calc: 'calc_salaryAmount', card: 'cf_self_reported_wages' },
    { calc: 'calc_otYear1', card: 'cf_w2_year1' },
    { calc: 'calc_otYear2', card: 'cf_w2_year2' },
    { calc: 'calc_otYTD', card: 'cf_ytd' }
  ];
  writeBack.forEach(function(wb) {
    var calcEl = document.getElementById(wb.calc);
    var cardEl = document.getElementById(wb.card);
    if (calcEl && cardEl && calcEl.value) cardEl.value = calcEl.value;
  });

  crmDirty = true;
  var sb = document.getElementById('crmSaveBtn');
  if (sb) sb.disabled = false;
  showToast('Income data synced to card: ' + total);
}

function exportCalcPDF() {
  var totalText = document.getElementById('calcTotalIncome').textContent;
  var borrowerName = document.getElementById('cf_name') ? document.getElementById('cf_name').value : 'Borrower';

  var lines = [];
  lines.push('INCOME CALCULATION WORKSHEET');
  lines.push('Borrower: ' + borrowerName);
  lines.push('Date: ' + new Date().toLocaleDateString());
  lines.push('---');

  var hourlyR = document.getElementById('calcHourlyResult');
  if (hourlyR) lines.push('Hourly Income (monthly): ' + hourlyR.textContent);
  var salaryR = document.getElementById('calcSalaryResult');
  if (salaryR) lines.push('Salary Income (monthly): ' + salaryR.textContent);
  var otR = document.getElementById('calcOTResult');
  if (otR) lines.push('OT/Bonus (monthly): ' + otR.textContent);
  var commR = document.getElementById('calcCommResult');
  if (commR) lines.push('Commission (monthly): ' + commR.textContent);
  var ntR = document.getElementById('calcNonTaxResult');
  if (ntR) lines.push('Non-Taxable Grossed Up: ' + ntR.textContent);
  lines.push('---');
  lines.push('TOTAL MONTHLY QUALIFYING INCOME: ' + totalText);
  lines.push('');
  lines.push('DISCLAIMER: This is for informational purposes only. Not a substitute for underwriter review.');

  // Build simple HTML for PDF print
  var printWin = window.open('', '_blank', 'width=700,height=900');
  printWin.document.write('<html><head><title>Income Calculation - ' + borrowerName + '</title>');
  printWin.document.write('<style>body{font-family:Arial,sans-serif;padding:40px;color:#0b1f3a;}h1{font-size:22px;margin-bottom:5px;}');
  printWin.document.write('.meta{color:#666;margin-bottom:20px;font-size:13px;}.line{padding:8px 0;border-bottom:1px solid #eee;font-size:14px;}');
  printWin.document.write('.total{font-size:20px;font-weight:700;margin-top:20px;padding:16px;background:#f0f7ff;border-radius:8px;}');
  printWin.document.write('.disc{font-size:11px;color:#999;margin-top:30px;font-style:italic;}</style></head><body>');
  printWin.document.write('<h1>Income Calculation Worksheet</h1>');
  printWin.document.write('<div class="meta">Borrower: ' + borrowerName + ' | Date: ' + new Date().toLocaleDateString() + '</div>');

  if (hourlyR) printWin.document.write('<div class="line">Hourly Income (monthly): <strong>' + hourlyR.textContent + '</strong></div>');
  if (salaryR) printWin.document.write('<div class="line">Salary Income (monthly): <strong>' + salaryR.textContent + '</strong></div>');
  if (otR) printWin.document.write('<div class="line">OT/Bonus Income (monthly): <strong>' + otR.textContent + '</strong></div>');
  if (commR) printWin.document.write('<div class="line">Commission Income (monthly): <strong>' + commR.textContent + '</strong></div>');
  if (ntR) printWin.document.write('<div class="line">Non-Taxable Income (grossed up 125%): <strong>' + ntR.textContent + '</strong></div>');

  printWin.document.write('<div class="total">Total Monthly Qualifying Income: ' + totalText + '</div>');
  printWin.document.write('<div class="disc">This calculation is for informational and educational purposes only. It is NOT a substitute for a professional underwriter\'s final income calculation or loan approval determination. Always consult with a licensed mortgage professional.</div>');
  printWin.document.write('</body></html>');
  printWin.document.close();
  printWin.focus();
  printWin.print();
}

function buildIncomeCalculatorHTML() {
  return '' +
    '<div class="calc-section"><div class="calc-section-title">Hourly Income</div>' +
    '<div class="calc-row">' +
      '<div class="card-field"><label>Hourly Rate ($/hr)</label><input type="number" id="calc_hourlyRate" step="0.01" min="0" placeholder="0.00" oninput="calcTotal()"></div>' +
      '<div class="card-field"><label>Hours/Week</label><input type="number" id="calc_hoursPerWeek" step="1" min="0" placeholder="40" oninput="calcTotal()"></div>' +
    '</div>' +
    '<div class="calc-result"><span class="calc-result-label">Monthly:</span><span class="calc-result-value" id="calcHourlyResult">$0.00</span></div></div>' +

    '<div class="calc-section"><div class="calc-section-title">Salary Income</div>' +
    '<div class="calc-row">' +
      '<div class="card-field"><label>Amount</label><input type="number" id="calc_salaryAmount" step="0.01" min="0" placeholder="0.00" oninput="calcTotal()"></div>' +
      '<div class="card-field"><label>Pay Period</label><select id="calc_salaryType" onchange="calcTotal()"><option value="monthly">Monthly</option><option value="biweekly">Bi-Weekly</option><option value="semimonthly">Semi-Monthly</option><option value="weekly">Weekly</option></select></div>' +
    '</div>' +
    '<div class="calc-result"><span class="calc-result-label">Monthly:</span><span class="calc-result-value" id="calcSalaryResult">$0.00</span></div></div>' +

    '<div class="calc-section"><div class="calc-section-title">Overtime / Bonus</div>' +
    '<div class="calc-row">' +
      '<div class="card-field"><label>YTD Amount</label><input type="number" id="calc_otYTD" step="0.01" placeholder="0.00" oninput="calcTotal()"></div>' +
      '<div class="card-field"><label>YTD Months</label><input type="number" id="calc_otYTDMonths" step="1" max="12" placeholder="0" oninput="calcTotal()"></div>' +
    '</div><div class="calc-row">' +
      '<div class="card-field"><label>Prior Year Total</label><input type="number" id="calc_otYear1" step="0.01" placeholder="0.00" oninput="calcTotal()"></div>' +
      '<div class="card-field"><label>Year Before Total</label><input type="number" id="calc_otYear2" step="0.01" placeholder="0.00" oninput="calcTotal()"></div>' +
    '</div>' +
    '<div class="calc-result"><span class="calc-result-label">Monthly:</span><span class="calc-result-value" id="calcOTResult">$0.00</span></div></div>' +

    '<div class="calc-section"><div class="calc-section-title">Commission Income (net of expenses)</div>' +
    '<div class="calc-row">' +
      '<div class="card-field"><label>YTD Gross</label><input type="number" id="calc_commYTD" step="0.01" placeholder="0.00" oninput="calcTotal()"></div>' +
      '<div class="card-field"><label>YTD Expenses</label><input type="number" id="calc_commYTDExp" step="0.01" placeholder="0.00" oninput="calcTotal()"></div>' +
    '</div><div class="calc-row">' +
      '<div class="card-field"><label>YTD Months</label><input type="number" id="calc_commMonths" step="1" max="12" placeholder="0" oninput="calcTotal()"></div>' +
      '<div class="card-field"><label>Prior Year Net</label><input type="number" id="calc_commYear1" step="0.01" placeholder="0.00" oninput="calcTotal()"></div>' +
    '</div><div class="calc-row">' +
      '<div class="card-field"><label>Year Before Net</label><input type="number" id="calc_commYear2" step="0.01" placeholder="0.00" oninput="calcTotal()"></div>' +
      '<div class="card-field"></div>' +
    '</div>' +
    '<div class="calc-result"><span class="calc-result-label">Monthly:</span><span class="calc-result-value" id="calcCommResult">$0.00</span></div></div>' +

    '<div class="calc-section"><div class="calc-section-title">Non-Taxable Income (125% gross-up)</div>' +
    '<div class="calc-row">' +
      '<div class="card-field"><label>Monthly Non-Taxable</label><input type="number" id="calc_nonTaxable" step="0.01" placeholder="0.00" oninput="calcTotal()"></div>' +
      '<div class="card-field"></div>' +
    '</div>' +
    '<div class="calc-result"><span class="calc-result-label">Grossed Up:</span><span class="calc-result-value" id="calcNonTaxResult">$0.00</span></div></div>' +

    '<div class="calc-total-bar"><span class="calc-total-label">Total Monthly Qualifying Income</span><span class="calc-total-value" id="calcTotalIncome">$0.00</span></div>' +
    '<div class="calc-action-btns">' +
      '<button class="card-action-btn primary" onclick="saveCalcToBorrower()"><i class="fas fa-save"></i> Save to Card</button>' +
      '<button class="card-action-btn" onclick="exportCalcPDF()"><i class="fas fa-file-pdf"></i> Export PDF</button>' +
      '<button class="card-action-btn" onclick="exportCalcToDoc()"><i class="fas fa-folder-plus"></i> Save to Documents</button>' +
    '</div>';
}

// ===== SELF-EMPLOYED CALCULATOR (EMBEDDED) =====
function buildSECalculatorHTML() {
  return '' +
    '<div class="calc-section"><div class="calc-section-title">Business Info</div>' +
    '<div class="calc-row">' +
      '<div class="card-field"><label>Business Type</label><select id="calc_se_bizType"><option value="sole-prop">Sole Proprietorship</option><option value="s-corp">S-Corporation</option><option value="partnership">Partnership</option><option value="llc">LLC</option></select></div>' +
      '<div class="card-field"><label>Ownership %</label><input type="number" id="calc_se_ownership" value="100" min="1" max="100" oninput="calcSETotal()"></div>' +
    '</div></div>' +

    '<div class="calc-section"><div class="calc-section-title">Most Recent Tax Year</div>' +
    '<div class="calc-row">' +
      '<div class="card-field"><label>Net Profit (Sched C / K-1)</label><input type="number" id="calc_se_y1_net" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
      '<div class="card-field"><label>Depreciation</label><input type="number" id="calc_se_y1_dep" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
    '</div><div class="calc-row">' +
      '<div class="card-field"><label>Amortization</label><input type="number" id="calc_se_y1_amort" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
      '<div class="card-field"><label>Depletion</label><input type="number" id="calc_se_y1_depl" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
    '</div><div class="calc-row">' +
      '<div class="card-field"><label>Other Add-Backs</label><input type="number" id="calc_se_y1_other" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
      '<div class="card-field"><label>One-Time Loss (add back)</label><input type="number" id="calc_se_y1_loss" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
    '</div><div class="calc-row">' +
      '<div class="card-field"><label>One-Time Gain (subtract)</label><input type="number" id="calc_se_y1_gain" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
      '<div class="card-field"></div>' +
    '</div>' +
    '<div class="calc-result"><span class="calc-result-label">Year 1 Annual:</span><span class="calc-result-value" id="calcSEY1Result">$0.00</span></div></div>' +

    '<div class="calc-section"><div class="calc-section-title">Prior Tax Year</div>' +
    '<div class="calc-row">' +
      '<div class="card-field"><label>Net Profit</label><input type="number" id="calc_se_y2_net" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
      '<div class="card-field"><label>Depreciation</label><input type="number" id="calc_se_y2_dep" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
    '</div><div class="calc-row">' +
      '<div class="card-field"><label>Amortization</label><input type="number" id="calc_se_y2_amort" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
      '<div class="card-field"><label>Depletion</label><input type="number" id="calc_se_y2_depl" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
    '</div><div class="calc-row">' +
      '<div class="card-field"><label>Other Add-Backs</label><input type="number" id="calc_se_y2_other" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
      '<div class="card-field"><label>One-Time Loss (add back)</label><input type="number" id="calc_se_y2_loss" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
    '</div><div class="calc-row">' +
      '<div class="card-field"><label>One-Time Gain (subtract)</label><input type="number" id="calc_se_y2_gain" step="0.01" placeholder="0.00" oninput="calcSETotal()"></div>' +
      '<div class="card-field"></div>' +
    '</div>' +
    '<div class="calc-result"><span class="calc-result-label">Year 2 Annual:</span><span class="calc-result-value" id="calcSEY2Result">$0.00</span></div></div>' +

    '<div class="calc-section"><div class="calc-section-title">Qualifying Income</div>' +
    '<div style="display:flex;gap:10px;margin-bottom:10px;">' +
      '<div class="calc-result" style="flex:1;"><span class="calc-result-label">Most Recent Year (monthly):</span><span class="calc-result-value" id="calcSERecentResult">$0.00</span></div>' +
      '<div class="calc-result" style="flex:1;"><span class="calc-result-label">2-Year Average (monthly):</span><span class="calc-result-value" id="calcSEAvgResult">$0.00</span></div>' +
    '</div>' +
    '<div id="calcSERecommendation" style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:10px;"></div></div>' +

    '<div class="calc-total-bar"><span class="calc-total-label">Monthly Qualifying Income</span><span class="calc-total-value" id="calcSETotalIncome">$0.00</span></div>' +
    '<div class="calc-action-btns">' +
      '<button class="card-action-btn primary" onclick="saveSECalcToBorrower()"><i class="fas fa-save"></i> Save to Card</button>' +
      '<button class="card-action-btn" onclick="exportSECalcPDF()"><i class="fas fa-file-pdf"></i> Export PDF</button>' +
      '<button class="card-action-btn" onclick="exportSECalcToDoc()"><i class="fas fa-folder-plus"></i> Save to Documents</button>' +
    '</div>';
}

function calcSEYear(prefix) {
  var net = calcVal('calc_se_' + prefix + '_net');
  var dep = calcVal('calc_se_' + prefix + '_dep');
  var amort = calcVal('calc_se_' + prefix + '_amort');
  var depl = calcVal('calc_se_' + prefix + '_depl');
  var other = calcVal('calc_se_' + prefix + '_other');
  var loss = calcVal('calc_se_' + prefix + '_loss');
  var gain = calcVal('calc_se_' + prefix + '_gain');
  var ownership = calcVal('calc_se_ownership') || 100;
  var adjusted = net + dep + amort + depl + other + loss - gain;
  return adjusted * (ownership / 100);
}

function calcSETotal() {
  var y1 = calcSEYear('y1');
  var y2 = calcSEYear('y2');
  document.getElementById('calcSEY1Result').textContent = calcFormat(y1);
  document.getElementById('calcSEY2Result').textContent = calcFormat(y2);

  var y1Monthly = y1 / 12;
  var avgMonthly = (y1 + y2) / 24;
  document.getElementById('calcSERecentResult').textContent = calcFormat(y1Monthly);
  document.getElementById('calcSEAvgResult').textContent = calcFormat(avgMonthly);

  var qualifying = 0;
  var rec = document.getElementById('calcSERecommendation');
  if (y1 > 0 && y2 > 0) {
    if (y1Monthly <= avgMonthly) {
      qualifying = y1Monthly;
      if (rec) rec.textContent = 'Income is declining - using most recent year (more conservative).';
    } else {
      qualifying = avgMonthly;
      if (rec) rec.textContent = 'Income is stable/increasing - using 2-year average.';
    }
  } else if (y1 > 0) {
    qualifying = y1Monthly;
    if (rec) rec.textContent = 'Enter Year 2 for 2-year average. Most lenders require 2 years for self-employed.';
  } else {
    if (rec) rec.textContent = '';
  }
  document.getElementById('calcSETotalIncome').textContent = calcFormat(qualifying);
}

function saveSECalcToBorrower() {
  var total = document.getElementById('calcSETotalIncome').textContent;
  
  // Write qualifying earnings
  var qe = document.getElementById('cf_qualifying_earnings');
  if (qe) qe.value = total.replace(/[^0-9.]/g, '');

  // Write SE net profit back as W-2 year fields (closest equivalent on card)
  var seY1 = document.getElementById('calc_se_y1_net');
  var seY2 = document.getElementById('calc_se_y2_net');
  var cardY1 = document.getElementById('cf_w2_year1');
  var cardY2 = document.getElementById('cf_w2_year2');
  if (seY1 && cardY1 && seY1.value) cardY1.value = seY1.value;
  if (seY2 && cardY2 && seY2.value) cardY2.value = seY2.value;

  // Set income type to self-employed
  var incType = document.getElementById('cf_income_type');
  if (incType) incType.value = 'self_employed';

  crmDirty = true;
  var sb = document.getElementById('crmSaveBtn');
  if (sb) sb.disabled = false;
  showToast('SE income data synced to card: ' + total);
}

function exportSECalcPDF() {
  var totalText = document.getElementById('calcSETotalIncome').textContent;
  var borrowerName = document.getElementById('cf_name') ? document.getElementById('cf_name').value : 'Borrower';
  var y1R = document.getElementById('calcSEY1Result');
  var y2R = document.getElementById('calcSEY2Result');
  var recentR = document.getElementById('calcSERecentResult');
  var avgR = document.getElementById('calcSEAvgResult');

  var printWin = window.open('', '_blank', 'width=700,height=900');
  printWin.document.write('<html><head><title>SE Income - ' + borrowerName + '</title>');
  printWin.document.write('<style>body{font-family:Arial,sans-serif;padding:40px;color:#0b1f3a;}h1{font-size:22px;margin-bottom:5px;}');
  printWin.document.write('.meta{color:#666;margin-bottom:20px;font-size:13px;}.line{padding:8px 0;border-bottom:1px solid #eee;font-size:14px;}');
  printWin.document.write('.total{font-size:20px;font-weight:700;margin-top:20px;padding:16px;background:#f0f7ff;border-radius:8px;}');
  printWin.document.write('.disc{font-size:11px;color:#999;margin-top:30px;font-style:italic;}</style></head><body>');
  printWin.document.write('<h1>Self-Employed Income Calculation</h1>');
  printWin.document.write('<div class="meta">Borrower: ' + borrowerName + ' | Date: ' + new Date().toLocaleDateString() + '</div>');
  if (y1R) printWin.document.write('<div class="line">Most Recent Year Annual: <strong>' + y1R.textContent + '</strong></div>');
  if (y2R) printWin.document.write('<div class="line">Prior Year Annual: <strong>' + y2R.textContent + '</strong></div>');
  if (recentR) printWin.document.write('<div class="line">Most Recent Year Monthly: <strong>' + recentR.textContent + '</strong></div>');
  if (avgR) printWin.document.write('<div class="line">2-Year Average Monthly: <strong>' + avgR.textContent + '</strong></div>');
  printWin.document.write('<div class="total">Monthly Qualifying Income: ' + totalText + '</div>');
  printWin.document.write('<div class="disc">This calculation is for informational purposes only. Not a substitute for underwriter review.</div>');
  printWin.document.write('</body></html>');
  printWin.document.close();
  printWin.focus();
  printWin.print();
}

function exportSECalcToDoc() {
  var borrowerName = document.getElementById('cf_name') ? document.getElementById('cf_name').value : 'Borrower';
  var total = document.getElementById('calcSETotalIncome').textContent;
  addDocumentToCard('SE Income Calc - ' + borrowerName + ' - ' + total, 'income_calc', new Date().toISOString());
  showToast('Self-employed income calc saved to documents');
}

// ===== DOCUMENT UPLOAD SYSTEM =====
var cardDocuments = [];

function handleDocUpload(input) {
  if (!input.files || !input.files.length) return;
  Array.from(input.files).forEach(function(file) {
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB): ' + file.name);
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      addDocumentToCard(file.name, file.type, new Date().toISOString(), e.target.result);
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function addDocumentToCard(name, type, date, dataUrl) {
  cardDocuments.push({
    name: name,
    type: type,
    date: date,
    data: dataUrl || null,
    id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
  });
  renderDocList();
  crmDirty = true;
  var sb = document.getElementById('crmSaveBtn');
  if (sb) sb.disabled = false;
}

function removeDocument(docId) {
  cardDocuments = cardDocuments.filter(function(d) { return d.id !== docId; });
  renderDocList();
  crmDirty = true;
  var sb = document.getElementById('crmSaveBtn');
  if (sb) sb.disabled = false;
}

function renderDocList() {
  var list = document.getElementById('docList');
  if (!list) return;
  if (cardDocuments.length === 0) {
    list.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:12px;padding:8px 0;">No documents uploaded yet</div>';
    return;
  }
  var html = '';
  cardDocuments.forEach(function(doc) {
    var icon = 'fa-file';
    if (doc.type && doc.type.includes('pdf')) icon = 'fa-file-pdf';
    else if (doc.type && doc.type.includes('image')) icon = 'fa-file-image';
    else if (doc.type === 'income_calc') icon = 'fa-calculator';
    else if (doc.type && doc.type.includes('word')) icon = 'fa-file-word';

    html += '<div class="doc-item">' +
      '<div class="doc-item-icon"><i class="fas ' + icon + '"></i></div>' +
      '<div class="doc-item-info"><div class="doc-item-name">' + doc.name + '</div>' +
        '<div class="doc-item-date">' + new Date(doc.date).toLocaleDateString() + '</div></div>' +
      '<div class="doc-item-actions">';
    if (doc.data) {
      html += '<a class="doc-item-btn" href="' + doc.data + '" download="' + doc.name + '" title="Download"><i class="fas fa-download"></i></a>';
    }
    html += '<button class="doc-item-btn" onclick="removeDocument(\'' + doc.id + '\')" title="Remove"><i class="fas fa-times"></i></button>' +
      '</div></div>';
  });
  list.innerHTML = html;
}

// Also update the W-2 calc export to save to documents
function exportCalcToDoc() {
  var borrowerName = document.getElementById('cf_name') ? document.getElementById('cf_name').value : 'Borrower';
  var total = document.getElementById('calcTotalIncome').textContent;
  addDocumentToCard('W-2 Income Calc - ' + borrowerName + ' - ' + total, 'income_calc', new Date().toISOString());
  showToast('W-2 income calc saved to documents');
}

// ===== CRM INTEGRATION FUNCTIONS =====
// These replace the old inline CRM functions in mission-control.html

var crmCurrentType = 'client';

function crmAddNew() {
  showTypePicker(function(type) {
    crmCurrentType = type;
    crmCurrentId = null;
    crmDirty = false;
    document.getElementById('crmDetailEmpty').style.display = 'none';
    document.getElementById('crmDetailContent').style.display = 'flex';

    // Render header
    var typeInfo = CONTACT_TYPES[type];
    document.getElementById('crmDName').textContent = 'New ' + typeInfo.label;
    document.getElementById('crmDMeta').textContent = '';
    document.getElementById('crmDTypeBadge').innerHTML =
      '<span class="card-type-badge" style="background:' + typeInfo.color + '22;color:' + typeInfo.color + ';">' +
      '<i class="fas ' + typeInfo.icon + '"></i> ' + typeInfo.label + '</span>';

    // Render pipeline button
    var pBtn = document.getElementById('cardPipelineBtn');
    pBtn.innerHTML = '';

    // Render form
    var formContainer = document.getElementById('crmCardForm');
    renderCardForm(formContainer, type, {});

    // Reset buttons
    document.getElementById('crmSaveBtn').disabled = true;
    document.getElementById('crmDeleteBtn').disabled = true;

    // Switch to details tab
    crmSwitchTab('details');
  });
}

function crmSelectContact(id) {
  crmCurrentId = id;
  crmDirty = false;
  document.getElementById('crmSaveBtn').disabled = true;
  document.getElementById('crmDeleteBtn').disabled = true;
  document.getElementById('crmDeleteBtn').textContent = 'Delete';
  crmDeleteArmed = false;
  document.getElementById('crmDetailEmpty').style.display = 'none';
  document.getElementById('crmDetailContent').style.display = 'flex';
  crmRenderList();

  fetch(CRM_API + '/crm-api?action=get&id=' + id)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success !== false) {
        var c = data.contact || data;
        crmCurrentType = c.type || 'client';
        crmPopulateCard(c, data.activity || []);
      }
    })
    .catch(function(err) { console.error('CRM get error:', err); });
}

function crmPopulateCard(c, activity) {
  var type = c.type || 'other';
  var typeInfo = CONTACT_TYPES[type] || CONTACT_TYPES.other;

  // Header
  document.getElementById('crmDName').textContent = c.name || 'Unnamed';
  document.getElementById('crmDMeta').textContent = [c.email, c.phone, c.company].filter(Boolean).join(' - ');
  document.getElementById('crmDTypeBadge').innerHTML =
    '<span class="card-type-badge" style="background:' + typeInfo.color + '22;color:' + typeInfo.color + ';">' +
    '<i class="fas ' + typeInfo.icon + '"></i> ' + typeInfo.label + '</span>';

  // Pipeline button - check if in pipeline
  var pBtn = document.getElementById('cardPipelineBtn');
  var pipelineId = 'crm-' + c.id;
  var foundStage = null;
  if (typeof pipelineContacts !== 'undefined') {
    var match = pipelineContacts.find(function(p) {
      return p.id === pipelineId || (c.email && p.email && p.email.toLowerCase() === c.email.toLowerCase());
    });
    if (match) foundStage = match.stage;
  }
  renderPipelineButton(pBtn, c.id, foundStage);

  // If pipeline not loaded yet, fetch to check
  if (!foundStage && typeof pipelineLoaded !== 'undefined' && !pipelineLoaded) {
    fetch(CRM_API + '/pipeline-api?action=list')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.contacts) {
          var m = data.contacts.find(function(p) {
            return p.id === pipelineId || (c.email && p.email && p.email.toLowerCase() === c.email.toLowerCase());
          });
          if (m) renderPipelineButton(pBtn, c.id, m.stage);
        }
      }).catch(function() {});
  }

  // Render type-adaptive form with data
  var formContainer = document.getElementById('crmCardForm');
  renderCardForm(formContainer, type, c);

  // Activity
  renderActivity(activity);

  // Reset dirty
  crmDirty = false;
  document.getElementById('crmSaveBtn').disabled = true;

  // Switch to details tab
  crmSwitchTab('details');
}

function renderActivity(activity) {
  var timeline = document.getElementById('crmActivityTimeline');
  if (!timeline) return;
  if (activity && activity.length > 0) {
    var icons = {
      email_sent: 'fa-paper-plane', email_received: 'fa-inbox',
      call: 'fa-phone', note: 'fa-sticky-note',
      meeting: 'fa-handshake', text: 'fa-comment'
    };
    var html = '';
    activity.forEach(function(a) {
      var icon = icons[a.type] || 'fa-sticky-note';
      html += '<div class="activity-item"><div class="activity-icon"><i class="fas ' + icon + '"></i></div>' +
        '<div><div class="activity-text">' + (a.subject || a.body || a.type || 'Activity') + '</div>' +
        '<div class="activity-date">' + (a.type || '') + ' - ' + new Date(a.date).toLocaleDateString() + '</div></div></div>';
    });
    timeline.innerHTML = html;
  } else {
    timeline.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:12px;padding:12px;">No activity yet</div>';
  }
}

function crmSwitchTab(tab) {
  document.querySelectorAll('.card-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.crm-tab-content').forEach(function(t) { t.classList.remove('active'); });
  var tabEl = document.querySelector('.card-tab[data-tab="' + tab + '"]');
  var contentEl = document.getElementById('crmTab_' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (contentEl) contentEl.classList.add('active');
}

function crmSaveContact() {
  var formContainer = document.getElementById('crmCardForm');
  var data = collectCardData(formContainer);
  data.type = crmCurrentType;

  if (!data.name) { showToast('Name is required'); return; }

  if (crmCurrentId) {
    data.id = crmCurrentId;
  }

  fetch(CRM_API + '/crm-api?action=save', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crm: data })
  })
  .then(function(r) { return r.json(); })
  .then(function(result) {
    if (result.success) {
      if (crmCurrentId) {
        var idx = crmContacts.findIndex(function(c) { return c.id === crmCurrentId; });
        if (idx >= 0) crmContacts[idx] = Object.assign(crmContacts[idx], data);
        showToast('Saved!');
      } else {
        data.id = result.id;
        data.created_at = new Date().toISOString();
        crmContacts.push(data);
        crmCurrentId = result.id;
        showToast('Contact created!');
      }
      crmRenderList();
      document.getElementById('crmDName').textContent = data.name || 'Unnamed';
      crmDirty = false;
      document.getElementById('crmSaveBtn').disabled = true;

      // Update counts
      document.getElementById('navCrmCount').textContent = crmContacts.length;
      document.getElementById('dashCrm').textContent = crmContacts.length;
      document.getElementById('crmSubtitle').textContent = crmContacts.length + ' contacts';
    } else {
      showToast('Save failed: ' + (result.message || ''));
    }
  })
  .catch(function(err) { showToast('Save failed'); console.error(err); });
}
