// ===== PIPELINE =====
var pipelineLoaded = false;
var pipelineLoans = []; // AE loan objects
var pipelineBorrowers = []; // All borrowers across all loans
var API_BASE = 'https://agent-edge-backend.vercel.app/api';

var pipelineColumns = [
  { id: 'warm', title: 'Warm Leads' },
  { id: 'active', title: 'Active Conversations' },
  { id: 'credit', title: 'Credit Repair' },
  { id: 'preapproval', title: 'Started Pre-Approval' },
  { id: 'preapproved', title: 'Approved' },
  { id: 'ratewatch', title: 'Rate Watch' },
  { id: 'underwriting', title: 'Underwriting' }
];
var draggedLoanId = null;

function loadPipeline() {
  var userId = localStorage.getItem('agent_edge_user') || 'default';
  fetch(API_BASE + '/ae-loans-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'listActive', user_id: userId })
  })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        pipelineLoans = data.loans || [];
        pipelineBorrowers = data.borrowers || [];
      } else {
        pipelineLoans = [];
        pipelineBorrowers = [];
      }
      pipelineLoaded = true;
      renderPipeline();
      updateDashboard();
      loadDashAlerts();
    })
    .catch(function(err) {
      console.error('Pipeline load error:', err);
      pipelineLoans = [];
      pipelineBorrowers = [];
      pipelineLoaded = true;
      renderPipeline();
    });
}

// Helper: get borrowers for a specific loan
function getLoanBorrowers(aeId) {
  return pipelineBorrowers.filter(function(b) { return b.ae_id === aeId; });
}

// Helper: get primary borrower for a loan
function getLoanPrimary(aeId) {
  return pipelineBorrowers.find(function(b) { return b.ae_id === aeId && b.role === 'primary'; });
}

// Helper: format phone for display
function formatPhoneDisplay(ph) {
  if (!ph) return '';
  var digits = ph.replace(/\D/g, '');
  if (digits.length === 10) return '(' + digits.substr(0,3) + ') ' + digits.substr(3,3) + '-' + digits.substr(6);
  if (digits.length === 11 && digits[0] === '1') return '(' + digits.substr(1,3) + ') ' + digits.substr(4,3) + '-' + digits.substr(7);
  return ph;
}

function renderPipeline() {
  var board = document.getElementById('pipelineBoard');
  board.innerHTML = '';
  document.getElementById('pipelineSubtitle').textContent = pipelineLoans.length + ' active loans';

  pipelineColumns.forEach(function(col) {
    var colLoans = pipelineLoans.filter(function(l) { return l.pipeline_stage === col.id; });
    var colEl = document.createElement('div');
    colEl.className = 'pipeline-col';
    colEl.innerHTML =
      '<div class="pipeline-col-header"><span class="pcol-title">' + col.title + '</span><span class="pcol-count">' + colLoans.length + '</span></div>' +
      '<div class="pipeline-col-body" data-stage="' + col.id + '"></div>';
    board.appendChild(colEl);

    var body = colEl.querySelector('.pipeline-col-body');

    // Drag-drop events
    body.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drop-zone'); });
    body.addEventListener('dragleave', function(e) { this.classList.remove('drop-zone'); });
    body.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drop-zone');
      var newStage = this.dataset.stage;
      if (draggedLoanId && newStage) {
        var loan = pipelineLoans.find(function(l) { return l.ae_id === draggedLoanId; });
        if (loan) {
          loan.pipeline_stage = newStage;
          renderPipeline();
          fetch(API_BASE + '/ae-loans-api', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'updateStage', ae_id: loan.ae_id, pipeline_stage: newStage })
          }).catch(function() {});
        }
      }
    });

    colLoans.forEach(function(loan) {
      var borrowers = getLoanBorrowers(loan.ae_id);
      var primary = borrowers.find(function(b) { return b.role === 'primary'; });
      var card = document.createElement('div');
      card.className = 'pipeline-card';
      card.draggable = true;
      card.dataset.id = loan.ae_id;

      // Build borrower display
      var displayName = borrowers.map(function(b) { return b.name || ''; }).filter(Boolean).join(' & ') || 'Unnamed';

      // Tags
      var tagHtml = '';
      var loanType = (loan.transaction_type || '') + (loan.loan_program ? ' / ' + loan.loan_program : '');
      if (loanType && loanType !== ' / ') tagHtml += '<span class="pc-tag">' + loanType + '</span> ';
      if (loan.interest_rate) tagHtml += '<span class="pc-tag' + (parseFloat(loan.interest_rate) >= 7 ? ' red' : '') + '">' + loan.interest_rate + '%</span> ';
      if (loan.source) tagHtml += '<span class="pc-tag green">' + loan.source + '</span>';

      // AE ID badge
      var aeTag = '<span class="pc-tag" style="background:rgba(14,165,233,0.15);color:#0ea5e9;font-family:monospace;">' + loan.ae_id + '</span> ';

      // Address preview
      var addrPreview = '';
      if (loan.subject_street) {
        addrPreview = '<div class="pc-sub" style="margin-top:2px;"><i class="fas fa-map-marker-alt" style="margin-right:3px;"></i>' + loan.subject_street + '</div>';
      }

      card.innerHTML =
        '<div class="pc-name">' + displayName + '</div>' +
        '<div class="pc-sub">' + (primary ? (formatPhoneDisplay(primary.phone) || primary.email || '') : '') + '</div>' +
        addrPreview +
        '<div>' + aeTag + tagHtml + '</div>';

      card.addEventListener('dragstart', function(e) {
        draggedLoanId = loan.ae_id;
        this.classList.add('dragging');
      });
      card.addEventListener('dragend', function() { this.classList.remove('dragging'); });
      card.addEventListener('click', function() { openFaceCard(loan.ae_id); });

      body.appendChild(card);
    });

    // Add button
    var addBtn = document.createElement('button');
    addBtn.className = 'add-card-btn';
    addBtn.textContent = '+ Add';
    addBtn.onclick = function() { addNewPipelineContact(col.id); };
    body.appendChild(addBtn);

  });
}

// ===== FUNDED MODAL =====
var fundingContactId = null;
var fundingContactName = '';

function openFundedModal(aeId, defaultOutcome) {
  fundingContactId = aeId; // now stores ae_id
  var loan = pipelineLoans.find(function(l) { return l.ae_id === aeId; });
  if (!loan) return;
  var borrowers = getLoanBorrowers(aeId);
  fundingContactName = borrowers.map(function(b) { return b.name; }).filter(Boolean).join(' & ') || 'Loan ' + aeId;
  document.getElementById('funded_date').value = new Date().toISOString().split('T')[0];
  document.getElementById('funded_rate').value = loan.interest_rate || '';
  document.getElementById('funded_transType').value = loan.transaction_type || '';
  document.getElementById('funded_loanProgram').value = loan.loan_program || '';
  document.getElementById('funded_amount').value = loan.loan_amount || '';
  document.getElementById('funded_strikeRate').value = '';
  document.getElementById('funded_notes').value = '';
  document.getElementById('funded_outcome').value = defaultOutcome || 'funded';
  updateOutcomeUI();
  document.getElementById('fundedModal').classList.add('show');
}

function updateOutcomeUI() {
  var outcome = document.getElementById('funded_outcome').value;
  var title = document.getElementById('outcomeModalTitle');
  var btn = document.getElementById('outcomeSubmitBtn');
  var amountWrap = document.getElementById('fundedAmountWrap');
  var strikeWrap = document.getElementById('fundedStrikeWrap');
  var name = fundingContactName || 'Contact';

  if (outcome === 'funded') {
    title.innerHTML = '<i class="fas fa-trophy" style="color:#22c55e;"></i> Congratulations! Closing ' + name;
    btn.innerHTML = '<i class="fas fa-trophy"></i> Mark as Funded';
    btn.className = 'topbar-btn primary';
    amountWrap.style.display = '';
    strikeWrap.style.display = '';
  } else if (outcome === 'denied') {
    title.innerHTML = '<i class="fas fa-times-circle" style="color:#ef4444;"></i> Loan Denied — ' + name;
    btn.innerHTML = '<i class="fas fa-times-circle"></i> Mark as Denied';
    btn.className = 'topbar-btn danger';
    amountWrap.style.display = 'none';
    strikeWrap.style.display = 'none';
  } else if (outcome === 'suspended') {
    title.innerHTML = '<i class="fas fa-pause-circle" style="color:#f59e0b;"></i> Loan Suspended — ' + name;
    btn.innerHTML = '<i class="fas fa-pause-circle"></i> Mark as Suspended';
    btn.className = 'topbar-btn';
    btn.style.borderColor = 'rgba(245,158,11,0.4)';
    btn.style.color = '#f59e0b';
    amountWrap.style.display = 'none';
    strikeWrap.style.display = 'none';
  } else if (outcome === 'withdrawn') {
    title.innerHTML = '<i class="fas fa-undo" style="color:#8b5cf6;"></i> Loan Withdrawn — ' + name;
    btn.innerHTML = '<i class="fas fa-undo"></i> Mark as Withdrawn';
    btn.className = 'topbar-btn';
    btn.style.borderColor = 'rgba(139,92,246,0.4)';
    btn.style.color = '#8b5cf6';
    amountWrap.style.display = 'none';
    strikeWrap.style.display = 'none';
  }
}

function closeFundedModal() {
  document.getElementById('fundedModal').classList.remove('show');
  fundingContactId = null;
  fundingContactName = '';
}

function saveFundedContact() {
  if (!fundingContactId) return;
  var loan = pipelineLoans.find(function(l) { return l.ae_id === fundingContactId; });
  if (!loan) return;

  var outcome = document.getElementById('funded_outcome').value;
  var outcomeDate = document.getElementById('funded_date').value;
  var rate = document.getElementById('funded_rate').value;
  var amount = document.getElementById('funded_amount').value;
  var strikeRate = document.getElementById('funded_strikeRate').value;
  var notes = document.getElementById('funded_notes').value;

  console.log('=== DECISIONING LOAN ===', { ae_id: loan.ae_id, outcome: outcome });
  fetch(API_BASE + '/ae-loans-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'decisionLoan',
      ae_id: loan.ae_id,
      outcome: outcome,
      outcome_date: outcomeDate,
      interest_rate: rate,
      loan_amount: amount,
      strike_rate: strikeRate,
      notes: notes
    })
  })
  .then(function(r) { 
    console.log('decisionLoan response status:', r.status);
    return r.json(); 
  })
  .then(function(result) {
    console.log('decisionLoan result:', result);
    if (result.success) {
      // Remove from active pipeline
      pipelineLoans = pipelineLoans.filter(function(l) { return l.ae_id !== fundingContactId; });
      closeFundedModal();
      renderPipeline();
      updateDashboard();
      
      var toastIcons = { funded: 'fa-trophy', denied: 'fa-times-circle', suspended: 'fa-pause-circle', withdrawn: 'fa-undo' };
      var toastColors = { funded: '#22c55e', denied: '#ef4444', suspended: '#f59e0b', withdrawn: '#8b5cf6' };
      var label = outcome.charAt(0).toUpperCase() + outcome.slice(1);
      showToast('<i class="fas ' + (toastIcons[outcome] || 'fa-check') + '" style="color:' + (toastColors[outcome] || '#fff') + ';"></i> ' + fundingContactName + ' — ' + label + '! Saved to history.');
      if (typeof loadCrm === 'function') loadCrm();
      
      // Auto-enroll in drip campaigns based on outcome
      if (outcome === 'funded' && loan.borrower_email) {
        emAutoEnroll('loan_funded', loan.borrower_email, (loan.borrower_first || '') + ' ' + (loan.borrower_last || ''));
        // Also trigger anniversary enrollment
        emAutoEnroll('anniversary', loan.borrower_email, (loan.borrower_first || '') + ' ' + (loan.borrower_last || ''));
      }
    } else {
      showToast('Error: ' + (result.message || 'Unknown error'));
    }
  })
  .catch(function(err) {
    console.error('Decision loan error:', err);
    showToast('Error saving outcome');
  });
}

// ===== MARK COLD (deferred — not part of AE loan system yet) =====
function markContactCold(contactId) {
  showToast('Cold leads feature coming soon');
}

var editingPipelineId = null; // now stores ae_id when editing

function addNewPipelineContact(stage) {
  editingPipelineId = null;
  document.getElementById('pcmTitle').textContent = 'Add to Pipeline';
  document.getElementById('pcm_name').value = '';
  document.getElementById('pcm_phone').value = '';
  document.getElementById('pcm_email').value = '';
  document.getElementById('pcm_source').value = 'other';
  document.getElementById('pcm_realtor').value = '';
  document.getElementById('pcm_stage').value = stage || 'warm';
  document.getElementById('pcm_transType').value = '';
  document.getElementById('pcm_loanProgram').value = '';
  document.getElementById('pcm_occupancy').value = '';
  document.getElementById('pcm_rate').value = '';
  document.getElementById('pcm_loanAmount').value = '';
  document.getElementById('pcm_address').value = '';
  document.getElementById('pcmDeleteBtn').style.display = 'none';
  document.getElementById('pcmCrmBtn').style.display = 'none';
  document.getElementById('pcmBorrowersWrap').style.display = 'none';
  document.getElementById('pcmOutcomeWrap').style.display = 'none';
  document.getElementById('pipelineContactModal').classList.add('show');
}

function openPipelineContact(aeId) {
  var loan = pipelineLoans.find(function(l) { return l.ae_id === aeId; });
  if (!loan) return;
  editingPipelineId = aeId;
  var borrowers = getLoanBorrowers(aeId);
  var primary = borrowers.find(function(b) { return b.role === 'primary'; });

  document.getElementById('pcmTitle').textContent = 'Edit Loan — ' + loan.ae_id;
  document.getElementById('pcm_name').value = primary ? primary.name : '';
  document.getElementById('pcm_phone').value = primary ? primary.phone : '';
  document.getElementById('pcm_email').value = primary ? primary.email : '';
  document.getElementById('pcm_source').value = loan.source || 'other';
  document.getElementById('pcm_realtor').value = loan.realtor_name || '';
  document.getElementById('pcm_stage').value = loan.pipeline_stage || 'warm';
  document.getElementById('pcm_transType').value = loan.transaction_type || '';
  document.getElementById('pcm_loanProgram').value = loan.loan_program || '';
  document.getElementById('pcm_occupancy').value = loan.occupancy || '';
  document.getElementById('pcm_rate').value = loan.interest_rate || '';
  document.getElementById('pcm_loanAmount').value = loan.loan_amount || '';
  document.getElementById('pcm_address').value = loan.subject_street || '';
  document.getElementById('pcmDeleteBtn').style.display = 'inline-block';

  // Show borrowers
  var bWrap = document.getElementById('pcmBorrowersWrap');
  var bList = document.getElementById('pcmBorrowersList');
  if (borrowers.length > 0) {
    var h = '';
    borrowers.forEach(function(b) {
      var color = b.role === 'primary' ? '#0ea5e9' : '#a855f7';
      h += '<div style="padding:5px 12px;border-radius:6px;font-size:11px;font-weight:600;background:' + color + '18;border:1px solid ' + color + '40;color:' + color + ';">';
      h += (b.name || 'Unnamed') + ' <span style="font-size:9px;opacity:0.7;">' + b.role + '</span></div>';
    });
    bList.innerHTML = h;
    bWrap.style.display = 'block';
  } else {
    bWrap.style.display = 'none';
  }

  // CRM button — link to primary
  var crmBtn = document.getElementById('pcmCrmBtn');
  if (primary && primary.crm_contact_id) {
    crmBtn.style.display = 'inline-block';
    crmBtn.dataset.crmId = primary.crm_contact_id;
  } else {
    crmBtn.style.display = 'none';
  }

  // Outcome buttons — only show in underwriting
  document.getElementById('pcmOutcomeWrap').style.display = (loan.pipeline_stage === 'underwriting') ? 'flex' : 'none';

  document.getElementById('pipelineContactModal').classList.add('show');
}

function savePipelineContact() {
  var name = document.getElementById('pcm_name').value.trim();
  if (!name) { showToast('Name is required'); return; }

  var stage = document.getElementById('pcm_stage').value;
  var userId = localStorage.getItem('agent_edge_user') || 'default';

  if (editingPipelineId) {
    // Update existing loan
    var loan = pipelineLoans.find(function(l) { return l.ae_id === editingPipelineId; });
    if (loan) {
      loan.pipeline_stage = stage;
      loan.source = document.getElementById('pcm_source').value;
      loan.realtor_name = document.getElementById('pcm_realtor').value.trim();
      loan.transaction_type = document.getElementById('pcm_transType').value;
      loan.loan_program = document.getElementById('pcm_loanProgram').value;
      loan.occupancy = document.getElementById('pcm_occupancy').value;
      loan.interest_rate = document.getElementById('pcm_rate').value.trim();
      loan.loan_amount = document.getElementById('pcm_loanAmount').value.trim();
      loan.subject_street = document.getElementById('pcm_address').value.trim();

      fetch(API_BASE + '/ae-loans-api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateLoan', ae_id: loan.ae_id,
          pipeline_stage: loan.pipeline_stage, source: loan.source,
          realtor_name: loan.realtor_name, transaction_type: loan.transaction_type,
          loan_program: loan.loan_program, occupancy: loan.occupancy,
          interest_rate: loan.interest_rate, loan_amount: loan.loan_amount,
          subject_street: loan.subject_street
        })
      }).catch(function(err) { console.error('Loan update error:', err); });
    }
    closePipelineModal();
    renderPipeline();
    updateDashboard();
    showToast('Loan updated!');
  } else {
    // Create new loan — first create a CRM contact, then create the AE loan
    var phone = document.getElementById('pcm_phone').value.trim();
    var email = document.getElementById('pcm_email').value.trim();
    
    // Split name into first/last
    var parts = name.split(' ');
    var firstName = parts[0] || '';
    var lastName = parts.slice(1).join(' ') || '';

    // Create CRM contact first
    fetch(API_BASE + '/crm-api', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', crm: { name: name, email: email, phone: phone, type: 'borrower' }})
    })
    .then(function(r) { return r.json(); })
    .then(function(crmResult) {
      if (!crmResult.success || !crmResult.id) {
        showToast('Error creating CRM contact');
        return;
      }
      // Now create the AE loan
      return fetch(API_BASE + '/ae-loans-api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createLoan',
          user_id: userId,
          crm_contact_id: crmResult.id,
          pipeline_stage: stage,
          source: document.getElementById('pcm_source').value,
          realtor_name: document.getElementById('pcm_realtor').value.trim(),
          transaction_type: document.getElementById('pcm_transType').value,
          loan_program: document.getElementById('pcm_loanProgram').value,
          loan_amount: document.getElementById('pcm_loanAmount').value.trim(),
          interest_rate: document.getElementById('pcm_rate').value.trim(),
          subject_street: document.getElementById('pcm_address').value.trim()
        })
      }).then(function(r) { return r.json(); });
    })
    .then(function(result) {
      if (result && result.success) {
        closePipelineModal();
        loadPipeline(); // Reload to get the new loan
        if (typeof loadCrm === 'function') loadCrm();
        showToast('Loan ' + result.ae_id + ' created!');
      } else {
        showToast('Error: ' + (result ? result.message : 'Unknown'));
      }
    })
    .catch(function(err) { console.error('Create loan error:', err); showToast('Error creating loan'); });
  }
}

function deletePipelineContact() {
  if (!editingPipelineId || !confirm('Delete this loan permanently?')) return;
  
  // For now, just remove from local array. TODO: add a delete endpoint to ae-loans-api
  pipelineLoans = pipelineLoans.filter(function(l) { return l.ae_id !== editingPipelineId; });
  closePipelineModal();
  renderPipeline();
  updateDashboard();
  showToast('Loan removed');
}

function closePipelineModal() { document.getElementById('pipelineContactModal').classList.remove('show'); }

function openCrmFromPipeline() {
  var crmBtn = document.getElementById('pcmCrmBtn');
  var crmId = crmBtn ? crmBtn.dataset.crmId : null;
  if (!crmId) return;
  closePipelineModal();
  switchView('crm', document.querySelector('.nav-item[onclick*="crm"]'));
  setTimeout(function() { crmSelectContact(crmId); }, 300);
}

// ===== LOAN FACE CARD =====
var fcContactId = null;
var fcTasks = [];
var loTeamMembers = []; // LO's team roster

var FC_DATES = [
  { key: 'mutual', label: 'Mutual Acceptance', alertable: false },
  { key: 'emd', label: 'EMD Due', alertable: true, alertDefault: false, taskName: 'Earnest Money Deposited' },
  { key: 'appraisal', label: 'Appraisal', alertable: true, alertDefault: false, taskName: 'Appraisal Completed' },
  { key: 'inspection', label: 'Inspection', alertable: true, alertDefault: false, taskName: 'Inspection Waiver Deadline' },
  { key: 'conditional', label: 'Conditional Approval', alertable: true, alertDefault: false, taskName: 'Initial Approval Deadline' },
  { key: 'ctc', label: 'Clear to Close', alertable: true, alertDefault: true, taskName: 'Clear to Close Received' },
  { key: 'finalCD', label: 'Final CD', auto: true, alertable: true, alertDefault: true, taskName: 'Final CD Shipped' },
  { key: 'closing', label: 'Closing', alertable: true, alertDefault: false, taskName: 'Closing Scheduled' },
  { key: 'contractExp', label: 'Contract Expiration', alertable: true, alertDefault: true, taskName: 'Contract Expiration' }
];

function openFaceCard(aeId) {
  var loan = pipelineLoans.find(function(l) { return l.ae_id === aeId; });
  if (!loan) return;
  fcContactId = aeId; // now stores ae_id instead of contact id

  var borrowers = getLoanBorrowers(aeId);

  // Title — use borrower names
  var names = borrowers.map(function(b) { return b.name; }).filter(Boolean).join(' & ');
  document.getElementById('fcTitle').textContent = names || 'Loan File';
  document.getElementById('fcLoanNumDisplay').textContent = loan.lender_loan_number ? 'Loan #' + loan.lender_loan_number : loan.ae_id;

  // Fields
  document.getElementById('fc_loanNumber').value = loan.lender_loan_number || '';
  document.getElementById('fc_street').value = loan.subject_street || '';
  document.getElementById('fc_city').value = loan.subject_city || '';
  document.getElementById('fc_state').value = loan.subject_state || '';
  document.getElementById('fc_zip').value = loan.subject_zip || '';
  fcUpdateZillowLink();
  document.getElementById('fc_transType').value = loan.transaction_type || '';
  document.getElementById('fc_loanProgram').value = loan.loan_program || '';
  document.getElementById('fc_occupancy').value = loan.occupancy || '';
  document.getElementById('fc_rate').value = loan.interest_rate ? parseFloat(loan.interest_rate).toFixed(3) : '';
  document.getElementById('fc_appraisedValue').value = loan.appraised_value ? fcToMoney(loan.appraised_value) : '';
  document.getElementById('fc_loanAmount').value = loan.loan_amount ? fcToMoney(loan.loan_amount) : '';
  fcCalcLTV();

  // Borrower chips
  var chips = document.getElementById('fcBorrowerChips');
  var ch = '';
  if (borrowers.length > 0) {
    borrowers.forEach(function(b) {
      var color = (b.role === 'primary') ? '#0ea5e9' : '#a855f7';
      var crmId = b.crm_contact_id || null;
      var onclick = crmId ? ' onclick="fcOpenBorrowerCrm(\'' + crmId + '\')"' : '';
      ch += '<div class="fc-borrower-chip" style="background:' + color + '14;border-color:' + color + '40;color:' + color + ';cursor:' + (crmId ? 'pointer' : 'default') + ';"' + onclick + '>';
      ch += '<i class="fas fa-user" style="font-size:10px;"></i> ' + (b.name || 'Unnamed');
      ch += ' <span style="font-size:9px;opacity:0.6;">' + (b.role || '') + '</span>';
      if (crmId) ch += ' <i class="fas fa-external-link-alt" style="font-size:8px;opacity:0.5;"></i>';
      ch += '</div>';
    });
  }
  // Add borrower button
  ch += '<div class="fc-borrower-chip" style="background:#f5f6fa;border-color:var(--text-muted);color:var(--text-secondary);cursor:pointer;" onclick="fcOpenAddBorrower()">';
  ch += '<i class="fas fa-plus" style="font-size:10px;"></i> Add Borrower</div>';

  // Borrower management rows (remove actions for non-primary)
  var hasCoBorrowers = borrowers.some(function(b) { return b.role !== 'primary'; });
  if (hasCoBorrowers) {
    ch += '<div style="width:100%;margin-top:10px;border-top:1px solid var(--border);padding-top:8px;">';
    borrowers.forEach(function(b) {
      if (b.role === 'primary') return;
      var roleLabel = b.role ? (b.role.charAt(0).toUpperCase() + b.role.slice(1).replace(/_/g, ' ')) : 'Co-Borrower';
      ch += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;">';
      ch += '<div style="font-size:12px;"><i class="fas fa-user" style="font-size:10px;color:#a855f7;margin-right:6px;"></i>' + (b.name || 'Unnamed') + ' <span style="font-size:10px;color:var(--text-muted);">(' + roleLabel + ')</span></div>';
      ch += '<button onclick="fcRemoveBorrower(\'' + b.id + '\',\'' + (b.name||'').replace(/'/g,"\\'") + '\')" style="background:rgba(239,68,68,0.08);color:#ef4444;border:1px solid rgba(239,68,68,0.2);border-radius:5px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer;">Remove from Loan</button>';
      ch += '</div>';
    });
    ch += '</div>';
  }

  chips.innerHTML = ch;

  // CRM button — link to primary borrower's CRM card
  var primary = borrowers.find(function(b) { return b.role === 'primary'; });
  var crmId = primary ? primary.crm_contact_id : null;
  document.getElementById('fcCrmBtn').style.display = crmId ? '' : 'none';
  document.getElementById('fcCrmBtn').dataset.crmId = crmId || '';

  // Tasks — load from Supabase before dates so create-task buttons know what's linked
  fcTasks = [];
  fcLoadTasksFromSupabase(fcContactId, function() {
    // Re-render date create buttons after tasks load
    refreshDateCreateButtons();
  });

  // Key dates
  var dh = '';
  FC_DATES.forEach(function(d) {
    var dateKey = 'date_' + d.key;
    // Map face card key names to ae_loans column names
    if (d.key === 'ctc') dateKey = 'date_ctc';
    if (d.key === 'finalCD') dateKey = 'date_final_cd';
    if (d.key === 'contractExp') dateKey = 'date_contract_exp';
    var val = loan[dateKey] || '';
    // Auto-calculate Final CD from closing date
    if (d.key === 'finalCD' && !val && loan.date_closing) {
      val = calcFinalCDDate(loan.date_closing, loan.transaction_type, loan.occupancy);
      loan.date_final_cd = val;
    }
    var badge = fcDateBadge(val);
    var autoTag = (d.auto && val) ? '<span style="font-size:9px;color:#6e7f77;margin-left:6px;letter-spacing:1px;">AUTO</span>' : '';
    dh += '<div class="fc-date-row">';
    dh += '<div class="fc-date-label">' + d.label + autoTag + '</div>';
    dh += '<div class="fc-date-input"><input type="date" id="fcd_' + d.key + '" value="' + val + '" onchange="' + (d.key === 'closing' ? 'fcOnClosingChange()' : 'fcRefreshDateBadge(\'' + d.key + '\')') + '"></div>';
    dh += '<span class="fc-date-badge ' + badge.cls + '" id="fcd_' + d.key + '_b">' + badge.txt + '</span>';
    // Create Task button for alertable dates with a value
    if (d.alertable && d.taskName) {
      var hasTask = fcTasks.some(function(t) { return t.fromDate === d.key; });
      dh += '<span id="fcd_' + d.key + '_task">';
      if (val && !hasTask) {
        dh += '<button class="fc-create-task-btn" onclick="fcCreateTaskFromDate(\'' + d.key + '\')" title="Create task: ' + d.taskName + '"><i class="fas fa-plus-circle"></i> Task</button>';
      } else if (val && hasTask) {
        dh += '<span class="fc-task-linked" title="Task created"><i class="fas fa-check-circle"></i></span>';
      }
      dh += '</span>';
    }
    dh += '</div>';
  });
  document.getElementById('fcDatesContainer').innerHTML = dh;

  // Render tasks
  fcRenderTasks();
  document.getElementById('fcTaskForm').style.display = 'none';

  // Show/hide decision buttons based on stage
  var decisionBtns = document.querySelectorAll('#fcOverlay .outcome-btn');
  decisionBtns.forEach(function(btn) {
    btn.style.display = (loan.pipeline_stage === 'underwriting') ? '' : 'none';
  });

  document.getElementById('fcOverlay').classList.add('show');
}

function closeFaceCard() {
  document.getElementById('fcOverlay').classList.remove('show');
  fcContactId = null;
}

function fcOutcome(outcome) {
  var aeId = fcContactId; // now stores ae_id
  closeFaceCard();
  openFundedModal(aeId, outcome);
}

function fcCalcLTV() {
  var av = fcParseMoney(document.getElementById('fc_appraisedValue').value);
  var la = fcParseMoney(document.getElementById('fc_loanAmount').value);
  var el = document.getElementById('fc_ltvDisplay');
  if (av > 0 && la > 0) {
    var ltv = (la / av * 100);
    var pmi = ltv > 80;
    el.innerHTML = ltv.toFixed(2) + '% <span class="fc-pmi ' + (pmi ? 'fc-pmi-yes' : 'fc-pmi-no') + '">' + (pmi ? 'PMI' : 'No PMI') + '</span>';
  } else {
    el.innerHTML = '— %';
  }
}

// Money formatting helpers
function fcParseMoney(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^0-9.\-]/g, '')) || 0;
}

function fcToMoney(val) {
  var num = parseFloat(String(val).replace(/[^0-9.\-]/g, '')) || 0;
  return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fcFormatMoney(el) {
  var num = fcParseMoney(el.value);
  if (num > 0) {
    el.value = fcToMoney(num);
  } else {
    el.value = '';
  }
}

function fcUnformatMoney(el) {
  var num = fcParseMoney(el.value);
  if (num > 0) {
    el.value = num;
  }
}

function fcFormatRate(el) {
  var num = parseFloat(el.value);
  if (!isNaN(num) && num > 0) {
    el.value = num.toFixed(3);
  }
}

function fcUpdateZillowLink() {
  var street = document.getElementById('fc_street').value.trim();
  var city = document.getElementById('fc_city').value.trim();
  var state = document.getElementById('fc_state').value.trim();
  var zip = document.getElementById('fc_zip').value.trim();
  var link = document.getElementById('fc_zillowLink');
  if (street && (city || zip)) {
    link.style.display = 'inline';
  } else {
    link.style.display = 'none';
  }
}

function fcOpenZillow() {
  var street = document.getElementById('fc_street').value.trim();
  var city = document.getElementById('fc_city').value.trim();
  var state = document.getElementById('fc_state').value.trim();
  var zip = document.getElementById('fc_zip').value.trim();
  var addr = [street, city, state, zip].filter(Boolean).join(' ');
  if (addr) {
    window.open('https://www.zillow.com/homes/' + encodeURIComponent(addr) + '_rb/', '_blank');
  }
  return false;
}

// ===== FINAL CD AUTO-CALCULATE =====
// TRID Rule: CD must be received 3 business days before consummation
// Business day = all calendar days except Sundays and federal holidays (Saturdays count)
var FEDERAL_HOLIDAYS_2025_2027 = [
  '2025-01-01','2025-01-20','2025-02-17','2025-05-26','2025-06-19','2025-07-04','2025-09-01','2025-10-13','2025-11-11','2025-11-27','2025-12-25',
  '2026-01-01','2026-01-19','2026-02-16','2026-05-25','2026-06-19','2026-07-03','2026-07-04','2026-09-07','2026-10-12','2026-11-11','2026-11-26','2026-12-25',
  '2027-01-01','2027-01-18','2027-02-15','2027-05-31','2027-06-18','2027-06-19','2027-07-05','2027-09-06','2027-10-11','2027-11-11','2027-11-25','2027-12-24','2027-12-25'
];

function isTRIDBusinessDay(date) {
  var day = date.getDay(); // 0=Sun
  if (day === 0) return false; // Sunday
  var iso = date.toISOString().slice(0,10);
  if (FEDERAL_HOLIDAYS_2025_2027.indexOf(iso) !== -1) return false;
  return true;
}

function calcFinalCDDate(closingDateStr, transactionType, occupancy) {
  if (!closingDateStr) return '';
  var closing = new Date(closingDateStr + 'T00:00:00');
  // Count back 3 TRID business days from closing
  var bizDays = 0;
  var d = new Date(closing);
  while (bizDays < 3) {
    d.setDate(d.getDate() - 1);
    if (isTRIDBusinessDay(d)) bizDays++;
  }
  // d is now the latest date CD must be RECEIVED
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// Auto-recalculate Final CD when closing date changes
function fcOnClosingChange() {
  var closingInput = document.getElementById('fcd_closing');
  var cdInput = document.getElementById('fcd_finalCD');
  if (!closingInput || !cdInput) return;
  var closingVal = closingInput.value;
  if (closingVal) {
    var txType = document.getElementById('fc_transactionType') ? document.getElementById('fc_transactionType').value : '';
    var occ = document.getElementById('fc_occupancy') ? document.getElementById('fc_occupancy').value : '';
    var autoCD = calcFinalCDDate(closingVal, txType, occ);
    cdInput.value = autoCD;
    fcRefreshDateBadge('finalCD');
  }
  fcRefreshDateBadge('closing');
}

function fcDateBadge(val) {
  if (!val) return { cls: '', txt: '' };
  var today = new Date(); today.setHours(0,0,0,0);
  var d = new Date(val + 'T00:00:00');
  var diff = Math.round((d - today) / 86400000);
  if (diff < 0) return { cls: 'fc-date-overdue', txt: Math.abs(diff) + 'd ago' };
  if (diff === 0) return { cls: 'fc-date-today', txt: 'Today' };
  if (diff <= 7) return { cls: 'fc-date-soon', txt: 'In ' + diff + 'd' };
  return { cls: 'fc-date-soon', txt: diff + 'd out' };
}

function fcRefreshDateBadge(key) {
  var input = document.getElementById('fcd_' + key);
  var badge = document.getElementById('fcd_' + key + '_b');
  if (!input || !badge) return;
  var b = fcDateBadge(input.value);
  badge.className = 'fc-date-badge ' + b.cls;
  badge.textContent = b.txt;
  refreshDateCreateButtons();
  // Auto-save this date to Supabase
  fcAutoSaveDate(key, input.value);
}

function fcAutoSaveDate(key, val) {
  if (!fcContactId) return;
  var dateMap = { mutual:'date_mutual', emd:'date_emd', appraisal:'date_appraisal', inspection:'date_inspection', conditional:'date_conditional', ctc:'date_ctc', finalCD:'date_final_cd', contractExp:'date_contract_exp', closing:'date_closing' };
  var col = dateMap[key] || ('date_' + key);
  var payload = { action: 'updateLoan', ae_id: fcContactId };
  payload[col] = val || '';
  // Also update local loan object
  var loan = pipelineLoans.find(function(l) { return l.ae_id === fcContactId; });
  if (loan) loan[col] = val || '';

  fetch(API_BASE + '/ae-loans-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function() {
    renderPipeline();
  }).catch(function(err) { console.error('Auto-save date error:', err); });
}

function fcToggleConfirm(key) {
  var cb = document.getElementById('fcc_' + key);
  if (!cb) return;
  var label = cb.closest('.fc-date-confirm');
  if (label) label.classList.toggle('done', cb.checked);
  // Store on loan object
  var loan = pipelineLoans.find(function(l) { return l.ae_id === fcContactId; });
  if (loan) loan['confirmed_' + key] = cb.checked;
}

function fcOpenCrm() {
  var crmId = document.getElementById('fcCrmBtn').dataset.crmId;
  if (!crmId) return;
  closeFaceCard();
  switchView('crm', document.querySelector('.nav-item[onclick*="crm"]'));
  setTimeout(function() { crmSelectContact(crmId); }, 300);
}

function fcOpenBorrowerCrm(crmId) {
  if (!crmId) return;
  closeFaceCard();
  switchView('crm', document.querySelector('.nav-item[onclick*="crm"]'));
  setTimeout(function() { crmSelectContact(crmId); }, 300);
}

// ===== ADD/REMOVE BORROWER =====
function fcOpenAddBorrower() {
  document.getElementById('abSearchInput').value = '';
  document.getElementById('abSearchResults').innerHTML = '';
  document.getElementById('abNewName').value = '';
  document.getElementById('abNewPhone').value = '';
  document.getElementById('abNewEmail').value = '';
  document.getElementById('abRole').value = 'co-borrower';
  document.getElementById('addBorrowerModal').classList.add('show');
}

function abClose() {
  document.getElementById('addBorrowerModal').classList.remove('show');
}

function abSearchContacts() {
  var query = document.getElementById('abSearchInput').value.trim();
  var resultsEl = document.getElementById('abSearchResults');
  if (query.length < 2) { resultsEl.innerHTML = ''; return; }

  // Search CRM contacts
  fetch(API_BASE + '/crm-api?action=list', { method: 'GET' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success || !data.contacts) { resultsEl.innerHTML = ''; return; }
      var matches = data.contacts.filter(function(c) {
        return c.name && c.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;
      }).slice(0, 6);

      if (matches.length === 0) {
        resultsEl.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:6px;">No matches found</div>';
        return;
      }

      // Check which contacts are already on this loan
      var existingIds = getLoanBorrowers(fcContactId).map(function(b) { return b.crm_contact_id; });

      var h = '';
      matches.forEach(function(c) {
        var already = existingIds.indexOf(c.id) >= 0;
        h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:6px;margin-bottom:3px;background:#fafbfc;border:1px solid var(--border-light);' + (already ? 'opacity:0.4;' : 'cursor:pointer;') + '"';
        if (!already) h += ' onclick="abAddExisting(\'' + c.id + '\',\'' + (c.name||'').replace(/'/g,"\\'") + '\')"';
        h += '>';
        h += '<div><div style="font-size:12px;font-weight:600;">' + (c.name || 'Unnamed') + '</div>';
        h += '<div style="font-size:10px;color:var(--text-muted);">' + (c.email || c.phone || '') + '</div></div>';
        if (already) {
          h += '<span style="font-size:9px;color:var(--text-muted);">Already on loan</span>';
        } else {
          h += '<span style="font-size:10px;color:#0ea5e9;"><i class="fas fa-plus"></i></span>';
        }
        h += '</div>';
      });
      resultsEl.innerHTML = h;
    })
    .catch(function() { resultsEl.innerHTML = ''; });
}

function abAddExisting(crmId, name) {
  var role = document.getElementById('abRole').value;
  fetch(API_BASE + '/ae-loans-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addBorrower', ae_id: fcContactId, crm_contact_id: crmId, role: role })
  })
  .then(function(r) { return r.json(); })
  .then(function(result) {
    if (result.success) {
      abClose();
      showToast(name + ' added as ' + role);
      // Reload pipeline to get updated borrowers, then reopen face card
      fetch(API_BASE + '/ae-loans-api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listActive', user_id: localStorage.getItem('agent_edge_user') || 'default' })
      }).then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          pipelineLoans = data.loans || [];
          pipelineBorrowers = data.borrowers || [];
          renderPipeline();
          openFaceCard(fcContactId);
        }
      });
    } else {
      showToast('Error: ' + (result.message || 'Unknown'));
    }
  })
  .catch(function(err) { console.error(err); showToast('Error adding borrower'); });
}

function abCreateAndAdd() {
  var name = document.getElementById('abNewName').value.trim();
  if (!name) { showToast('Name is required'); return; }
  var phone = document.getElementById('abNewPhone').value.trim();
  var email = document.getElementById('abNewEmail').value.trim();
  var role = document.getElementById('abRole').value;

  // Create CRM contact first
  fetch(API_BASE + '/crm-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save', crm: { name: name, phone: phone, email: email, type: 'borrower' }})
  })
  .then(function(r) { return r.json(); })
  .then(function(crmResult) {
    if (!crmResult.success || !crmResult.id) {
      showToast('Error creating contact');
      return;
    }
    // Add to the loan
    return fetch(API_BASE + '/ae-loans-api', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addBorrower', ae_id: fcContactId, crm_contact_id: crmResult.id, role: role })
    }).then(function(r) { return r.json(); });
  })
  .then(function(result) {
    if (result && result.success) {
      abClose();
      showToast(name + ' created & added as ' + role);
      // Reload and reopen
      fetch(API_BASE + '/ae-loans-api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listActive', user_id: localStorage.getItem('agent_edge_user') || 'default' })
      }).then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          pipelineLoans = data.loans || [];
          pipelineBorrowers = data.borrowers || [];
          renderPipeline();
          openFaceCard(fcContactId);
        }
      });
      if (typeof loadCrm === 'function') loadCrm();
    } else {
      showToast('Error: ' + (result ? result.message : 'Unknown'));
    }
  })
  .catch(function(err) { console.error(err); showToast('Error creating borrower'); });
}

function fcRemoveBorrower(borrowerLinkId, name) {
  if (!confirm('Remove ' + (name || 'this borrower') + ' from this loan?')) return;
  fetch(API_BASE + '/ae-loans-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'removeBorrower', id: borrowerLinkId })
  })
  .then(function(r) { return r.json(); })
  .then(function(result) {
    if (result.success) {
      showToast((name || 'Borrower') + ' removed from loan');
      // Reload and reopen
      fetch(API_BASE + '/ae-loans-api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listActive', user_id: localStorage.getItem('agent_edge_user') || 'default' })
      }).then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          pipelineLoans = data.loans || [];
          pipelineBorrowers = data.borrowers || [];
          renderPipeline();
          openFaceCard(fcContactId);
        }
      });
    } else {
      showToast('Error: ' + (result.message || 'Unknown'));
    }
  })
  .catch(function(err) { console.error(err); showToast('Error removing borrower'); });
}
function fcRenderTasks() {
  var el = document.getElementById('fcTasksList');
  if (fcTasks.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">No tasks yet. Create tasks from Key Dates above or click "+ Add Task" below.</div>';
    return;
  }
  var h = '';
  fcTasks.forEach(function(t, i) {
    var done = t.done ? ' done' : '';
    var assignee = t.assignee ? '<span class="fc-task-assignee">' + t.assignee + '</span>' : '<span class="fc-task-assignee" style="opacity:0.3;">Unassigned</span>';
    var due = t.due ? '<span class="fc-task-due">' + t.due + '</span>' : '';
    var bellOn = t.alarm !== false;
    var bellCls = bellOn ? 'fc-task-bell on' : 'fc-task-bell off';
    var fromTag = t.fromDate ? '<span class="fc-task-linked-tag"><i class="fas fa-link"></i></span>' : '';

    // Task row
    h += '<div class="fc-task-row" id="fcTaskRow_' + i + '">';
    h += '<div class="fc-task-chk' + done + '" onclick="fcToggleTask(' + i + ')">' + (t.done ? '<i class="fas fa-check"></i>' : '') + '</div>';
    h += '<div class="fc-task-name' + done + '" onclick="fcEditTask(' + i + ')" style="cursor:pointer;">' + (t.title || 'Untitled') + fromTag + '</div>';
    h += assignee + due;
    h += '<button class="' + bellCls + '" onclick="fcToggleAlarm(' + i + ')" title="' + (bellOn ? 'Alarm ON' : 'Alarm OFF') + '"><i class="fas fa-bell' + (bellOn ? '' : '-slash') + '"></i></button>';
    h += '<button class="fc-task-del" onclick="fcDeleteTask(' + i + ')"><i class="fas fa-trash-alt"></i></button>';
    h += '</div>';

    // Hidden edit form
    h += '<div class="fc-task-edit" id="fcTaskEdit_' + i + '" style="display:none;">';
    h += '<div class="fc-task-form">';
    h += '<div class="fc-field fc-task-form-full"><div class="fc-lbl">Task Name</div><input id="fcte_title_' + i + '" value="' + (t.title || '').replace(/"/g, '&quot;') + '"></div>';
    h += '<div class="fc-field"><div class="fc-lbl">Assign To</div><select id="fcte_assignee_' + i + '">' + fcBuildTeamOptions(t.assignee) + '</select></div>';
    h += '<div class="fc-field"><div class="fc-lbl">Due Date</div><input type="date" id="fcte_due_' + i + '" value="' + (t.due || '') + '"></div>';
    h += '<div style="grid-column:1/-1;display:flex;gap:6px;margin-top:4px;">';
    h += '<button class="topbar-btn" style="font-size:11px;" onclick="fcCloseEditTask(' + i + ')">Cancel</button>';
    h += '<button class="topbar-btn primary" style="font-size:11px;" onclick="fcSaveEditTask(' + i + ')"><i class="fas fa-save"></i> Save</button>';
    h += '</div>';
    h += '</div></div>';
  });
  el.innerHTML = h;
  refreshDateCreateButtons();
}

function fcLoadTasksFromSupabase(aeId, callback) {
  fetch(API_BASE + '/ae-loans-api?action=get_tasks&ae_id=' + aeId)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      fcTasks = (data.tasks || []).map(function(t) {
        return { db_id: t.id, id: t.task_id, title: t.title, assignee: t.assignee || '', due: t.due || '', done: t.done || false, alarm: t.alarm || false, fromDate: t.from_date || '' };
      });
      fcRenderTasks();
      if (callback) callback();
    })
    .catch(function() {
      fcTasks = [];
      fcRenderTasks();
      if (callback) callback();
    });
}

function fcSaveTaskToSupabase(task) {
  if (!fcContactId) return;
  return fetch(API_BASE + '/ae-loans-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_task', ae_id: fcContactId, task: task })
  }).then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success && data.task && !task.db_id) {
      // Assign the db_id back to the local task
      var local = fcTasks.find(function(t) { return t.id === task.id; });
      if (local) local.db_id = data.task.id;
    }
    return data;
  });
}

function fcDeleteTaskFromSupabase(dbId) {
  return fetch(API_BASE + '/ae-loans-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_task', db_id: dbId })
  }).then(function(r) { return r.json(); });
}

function fcBuildTeamOptions(current) {
  var opts = '<option value="">-- Unassigned --</option>';
  loTeamMembers.forEach(function(tm) {
    var label = tm.name + ' (' + (tm.role || '') + ')';
    var sel = (current === tm.name) ? ' selected' : '';
    opts += '<option value="' + tm.name + '"' + sel + '>' + label + '</option>';
  });
  return opts;
}

function fcEditTask(idx) {
  fcTasks.forEach(function(t, i) {
    var editEl = document.getElementById('fcTaskEdit_' + i);
    var rowEl = document.getElementById('fcTaskRow_' + i);
    if (editEl) editEl.style.display = 'none';
    if (rowEl) rowEl.style.display = '';
  });
  var editEl = document.getElementById('fcTaskEdit_' + idx);
  var rowEl = document.getElementById('fcTaskRow_' + idx);
  if (editEl) editEl.style.display = 'block';
  if (rowEl) rowEl.style.display = 'none';
}

function fcCloseEditTask(idx) {
  var editEl = document.getElementById('fcTaskEdit_' + idx);
  var rowEl = document.getElementById('fcTaskRow_' + idx);
  if (editEl) editEl.style.display = 'none';
  if (rowEl) rowEl.style.display = '';
}

function fcSaveEditTask(idx) {
  if (!fcTasks[idx]) return;
  fcTasks[idx].title = document.getElementById('fcte_title_' + idx).value.trim() || fcTasks[idx].title;
  fcTasks[idx].assignee = document.getElementById('fcte_assignee_' + idx).value || '';
  fcTasks[idx].due = document.getElementById('fcte_due_' + idx).value || '';
  fcSaveTaskToSupabase(fcTasks[idx]);
  fcRenderTasks();
  showToast('Task updated', 'success');
}

function fcToggleAlarm(idx) {
  if (fcTasks[idx]) {
    fcTasks[idx].alarm = !fcTasks[idx].alarm;
    fcSaveTaskToSupabase(fcTasks[idx]);
    fcRenderTasks();
  }
}

function fcCreateTaskFromDate(dateKey) {
  var dateConfig = FC_DATES.find(function(d) { return d.key === dateKey; });
  if (!dateConfig) return;
  var dateInput = document.getElementById('fcd_' + dateKey);
  var dateVal = dateInput ? dateInput.value : '';

  var newTask = {
    id: 'task-' + Date.now(),
    title: dateConfig.taskName,
    assignee: '',
    due: dateVal,
    done: false,
    alarm: dateConfig.alertDefault,
    fromDate: dateKey
  };
  fcTasks.push(newTask);
  fcSaveTaskToSupabase(newTask);
  fcRenderTasks();
  showToast('Task created: ' + dateConfig.taskName, 'success');
}

function refreshDateCreateButtons() {
  FC_DATES.forEach(function(d) {
    if (!d.alertable || !d.taskName) return;
    var container = document.getElementById('fcd_' + d.key + '_task');
    if (!container) return;
    var dateInput = document.getElementById('fcd_' + d.key);
    var val = dateInput ? dateInput.value : '';
    var hasTask = fcTasks.some(function(t) { return t.fromDate === d.key; });
    if (val && !hasTask) {
      container.innerHTML = '<button class="fc-create-task-btn" onclick="fcCreateTaskFromDate(\'' + d.key + '\')" title="Create task: ' + d.taskName + '"><i class="fas fa-plus-circle"></i> Task</button>';
    } else if (val && hasTask) {
      container.innerHTML = '<span class="fc-task-linked" title="Task created"><i class="fas fa-check-circle"></i></span>';
    } else {
      container.innerHTML = '';
    }
  });
}

function fcToggleTask(idx) {
  if (fcTasks[idx]) {
    fcTasks[idx].done = !fcTasks[idx].done;
    fcSaveTaskToSupabase(fcTasks[idx]);
    fcRenderTasks();
  }
}

function fcDeleteTask(idx) {
  var task = fcTasks[idx];
  if (task && task.db_id) {
    fcDeleteTaskFromSupabase(task.db_id);
  }
  fcTasks.splice(idx, 1);
  fcRenderTasks();
}

function fcShowTaskForm() {
  var el = document.getElementById('fcTaskForm');
  var teamOpts = '<option value="">-- Unassigned --</option>';
  loTeamMembers.forEach(function(tm) {
    var label = tm.name + ' (' + (tm.role || '') + ')';
    teamOpts += '<option value="' + tm.name + '">' + label + '</option>';
  });
  el.innerHTML = '<div class="fc-task-form">' +
    '<div class="fc-field fc-task-form-full"><div class="fc-lbl">Task</div><input id="fctf_title" placeholder="e.g. Order appraisal, Pull credit"></div>' +
    '<div class="fc-field"><div class="fc-lbl">Assign To</div><select id="fctf_assignee">' + teamOpts + '</select></div>' +
    '<div class="fc-field"><div class="fc-lbl">Due Date</div><input type="date" id="fctf_due"></div>' +
    '<div style="grid-column:1/-1;display:flex;gap:6px;margin-top:4px;">' +
      '<button class="topbar-btn" style="font-size:10px;" onclick="fcHideTaskForm()">Cancel</button>' +
      '<button class="topbar-btn primary" style="font-size:10px;" onclick="fcSaveTask()"><i class="fas fa-plus"></i> Add</button>' +
    '</div>' +
  '</div>';
  el.style.display = 'block';
  document.getElementById('fctf_title').focus();
}

function fcHideTaskForm() {
  document.getElementById('fcTaskForm').style.display = 'none';
}

function fcSaveTask() {
  var title = document.getElementById('fctf_title').value.trim();
  if (!title) { showToast('Task name required'); return; }
  var newTask = {
    id: 'task-' + Date.now(),
    title: title,
    assignee: document.getElementById('fctf_assignee').value || '',
    due: document.getElementById('fctf_due').value || '',
    done: false,
    alarm: false
  };
  fcTasks.push(newTask);
  fcSaveTaskToSupabase(newTask);
  fcHideTaskForm();
  fcRenderTasks();
  showToast('Task added', 'success');
}

function saveFaceCard() {
  if (!fcContactId) return;
  var loan = pipelineLoans.find(function(l) { return l.ae_id === fcContactId; });
  if (!loan) return;

  // Collect all fields into the loan object
  loan.lender_loan_number = document.getElementById('fc_loanNumber').value.trim();
  loan.subject_street = document.getElementById('fc_street').value.trim();
  loan.subject_city = document.getElementById('fc_city').value.trim();
  loan.subject_state = document.getElementById('fc_state').value.trim().toUpperCase();
  loan.subject_zip = document.getElementById('fc_zip').value.trim();
  loan.transaction_type = document.getElementById('fc_transType').value;
  loan.loan_program = document.getElementById('fc_loanProgram').value;
  loan.occupancy = document.getElementById('fc_occupancy').value;
  loan.interest_rate = document.getElementById('fc_rate').value.trim();
  loan.appraised_value = String(fcParseMoney(document.getElementById('fc_appraisedValue').value) || '');
  loan.loan_amount = String(fcParseMoney(document.getElementById('fc_loanAmount').value) || '');

  // Collect dates
  var dateMap = { mutual: 'date_mutual', emd: 'date_emd', appraisal: 'date_appraisal', inspection: 'date_inspection', conditional: 'date_conditional', ctc: 'date_ctc', finalCD: 'date_final_cd', contractExp: 'date_contract_exp', closing: 'date_closing' };
  FC_DATES.forEach(function(d) {
    var input = document.getElementById('fcd_' + d.key);
    var col = dateMap[d.key] || ('date_' + d.key);
    if (input) loan[col] = input.value || '';
  });

  // Tasks are saved to Supabase independently (ae_loan_tasks table)

  // Update display
  document.getElementById('fcLoanNumDisplay').textContent = loan.lender_loan_number ? 'Loan #' + loan.lender_loan_number : loan.ae_id;

  // Save to Supabase via ae-loans-api
  fetch(API_BASE + '/ae-loans-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateLoan',
      ae_id: loan.ae_id,
      lender_loan_number: loan.lender_loan_number,
      subject_street: loan.subject_street,
      subject_city: loan.subject_city,
      subject_state: loan.subject_state,
      subject_zip: loan.subject_zip,
      transaction_type: loan.transaction_type,
      loan_program: loan.loan_program,
      occupancy: loan.occupancy,
      interest_rate: loan.interest_rate,
      appraised_value: loan.appraised_value,
      loan_amount: loan.loan_amount,
      date_mutual: loan.date_mutual,
      date_emd: loan.date_emd,
      date_appraisal: loan.date_appraisal,
      date_inspection: loan.date_inspection,
      date_conditional: loan.date_conditional,
      date_ctc: loan.date_ctc,
      date_final_cd: loan.date_final_cd,
      date_contract_exp: loan.date_contract_exp,
      date_closing: loan.date_closing
    })
  }).then(function() {
    renderPipeline();
    showToast('Loan file saved!');
  }).catch(function(err) { console.error('Face card save error:', err); });
}

