/* ===================================================
   CRM CARDS - Contact Card System for Mission Control
   Type-adaptive, hybrid layout, multi-employer, side panel calc
   =================================================== */

var CRM_API = 'https://agent-edge-backend.vercel.app/api';

// Global: auto-capitalize first letter of all text inputs in card areas on blur
document.addEventListener('blur', function(e) {
  var el = e.target;
  if (el.tagName !== 'INPUT' || el.type !== 'text') return;
  // Skip fields that shouldn't be capitalized
  if (el.id === 'cf_middle_initial') return; // MI already uppercase via CSS
  if (el.id && el.id.match(/asset_balance/)) return; // Currency field
  if (el.closest('.crm-detail-panel') || el.closest('.card-header')) {
    if (el.value && el.value.length > 0) {
      // Capitalize first letter of each word
      el.value = el.value.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    }
  }
}, true); // useCapture so it fires before other blur handlers

// ===== TYPE DEFINITIONS =====
// ROOT TYPES — permanent, set at creation
var CONTACT_TYPES = {
  client:      { label: 'Client',      icon: 'fa-user',              color: 'var(--type-client)' },
  realtor:     { label: 'Realtor',     icon: 'fa-handshake',         color: 'var(--type-realtor)' },
  title:       { label: 'Title',       icon: 'fa-building',          color: 'var(--type-title)' },
  appraiser:   { label: 'Appraiser',   icon: 'fa-search-dollar',     color: 'var(--type-appraiser)' },
  contractor:  { label: 'Contractor',  icon: 'fa-hard-hat',          color: 'var(--type-contractor)' },
  vendor:      { label: 'Vendor',      icon: 'fa-store',             color: 'var(--type-vendor)' },
  other:       { label: 'Other',       icon: 'fa-ellipsis-h',        color: 'var(--type-other)' }
};
// DESIGNATIONS — layered on/off, not permanent
var DESIGNATION_TYPES = {
  borrower:    { label: 'Borrower',    icon: 'fa-file-invoice-dollar', color: 'var(--type-borrower)' },
  past_client: { label: 'Past Client', icon: 'fa-user-check',        color: '#22c55e' }
};
// Combined lookup for backward compat
var ALL_TYPES = Object.assign({}, CONTACT_TYPES, DESIGNATION_TYPES);

// Helper: check if a contact has a designation
function hasDesignation(c, d) {
  if (!c) return false;
  var desigs = c.designations || [];
  return desigs.indexOf(d) !== -1;
}
// Helper: check if contact is borrower or past_client (by designation OR legacy type)
function isBorrowerLike(c) {
  if (!c) return false;
  var desigs = c.designations || [];
  if (desigs.indexOf('borrower') !== -1 || desigs.indexOf('past_client') !== -1) return true;
  // Legacy fallback
  if (c.type === 'borrower' || c.type === 'past_client') return true;
  return false;
}
// Helper: get the effective display type (root_type preferred)
function getEffectiveType(c) {
  return c.root_type || c.type || 'other';
}
var PIPELINE_STAGES = [
  { id: 'warm', label: 'Warm Leads' }, { id: 'active', label: 'Active Conversations' },
  { id: 'credit', label: 'Credit Repair' }, { id: 'preapproval', label: 'Started Pre-Approval' },
  { id: 'preapproved', label: 'Approved' }, { id: 'ratewatch', label: 'Rate Watch' },
  { id: 'underwriting', label: 'Underwriting' }
];
function sourceOptions() {
  return [
    {value:'',label:'--'},{value:'referral',label:'Referral'},{value:'pipeline',label:'Pipeline'},
    {value:'portal',label:'Portal'},{value:'portal_signup',label:'Portal Signup'},
    {value:'webinar',label:'Webinar'},{value:'social',label:'Social Media'},
    {value:'manual',label:'Manual'},{value:'import',label:'Import'}
  ];
}

// ===== FIELD DEFINITIONS PER TYPE =====
function getFieldsForType(type, designations) {
  // If contact has borrower or past_client designation, use borrower card
  var desigs = designations || [];
  if (desigs.indexOf('borrower') !== -1 || desigs.indexOf('past_client') !== -1) return 'borrower';
  // Legacy fallback
  if (type === 'borrower' || type === 'past_client') return 'borrower';
  var contactFields = [
    {id:'name',label:'Name',type:'text',required:true},
    {id:'phone',label:'Phone',type:'tel'},
    {id:'email',label:'Email',type:'email'}
  ];
  var addressFields = [
    {id:'address',label:'Street',type:'text'},{id:'city',label:'City',type:'text'},
    {id:'state',label:'State',type:'text',maxlength:2},{id:'zip',label:'Zip',type:'text',maxlength:10}
  ];
  var noteFields = [
    {id:'tags',label:'Tags',type:'text',placeholder:'Comma-separated'},
    {id:'notes',label:'Notes',type:'textarea',fullWidth:true}
  ];

  switch(type) {
    case 'client':
      return [
        {section:'Address',fields:addressFields},
        {section:'Employment',fields:[
          {id:'employer',label:'Employer',type:'text'},
          {id:'job_title',label:'Job Title',type:'text'}
        ]},
        {section:'Personal',fields:[
          {id:'birthday',label:'Birthday',type:'date'},
          {id:'spouse_name',label:'Spouse / Partner',type:'text'},
          {id:'kids',label:'Kids',type:'text'}
        ]},
        {section:'Source',fields:[
          {id:'source',label:'Source',type:'select',options:sourceOptions()},
          {id:'realtor_name',label:'Referring Realtor',type:'text',conditional:'source',conditionValue:'referral'}
        ]},
        {section:'Tags & Notes',fields:noteFields}
      ];
    case 'realtor':
      return [
        {section:'Brokerage',fields:[
          {id:'company',label:'Brokerage Name',type:'text'},
          {id:'license_number',label:'License Number',type:'text'}
        ]},
        {section:'Brokerage Address',fields:addressFields},
        {section:'Credentials',fields:[
          {id:'headshot_url',label:'Headshot',type:'text',placeholder:'URL or uploaded via portal'}
        ]},
        {section:'Web & Social',fields:[
          {id:'website',label:'Website',type:'text'},{id:'facebook',label:'Facebook',type:'text'},
          {id:'instagram',label:'Instagram',type:'text'},{id:'linkedin',label:'LinkedIn',type:'text'},
          {id:'tiktok',label:'TikTok',type:'text'}
        ]},
        {section:'Tags & Notes',fields:noteFields}
      ];
    case 'title': case 'appraiser':
      return [
        {section:'Company',fields:[{id:'company',label:'Company Name',type:'text'}]},
        {section:'Address',fields:addressFields},
        {section:'Web',fields:[{id:'website',label:'Website',type:'text'}]},
        {section:'Tags & Notes',fields:noteFields}
      ];
    default:
      return [
        {section:'Company',fields:[{id:'company',label:'Company Name',type:'text'}]},
        {section:'Address',fields:addressFields},
        {section:'Tags & Notes',fields:noteFields}
      ];
  }
}

// ===== TYPE PICKER =====
function showTypePicker(cb) {
  var ov = document.getElementById('typePickerOverlay');
  if (!ov) {
    ov = document.createElement('div'); ov.id='typePickerOverlay'; ov.className='type-picker-overlay';
    var h='<div class="type-picker"><h3>What type of contact?</h3><div class="type-picker-grid">';
    Object.keys(CONTACT_TYPES).forEach(function(k){var t=CONTACT_TYPES[k];
      h+='<div class="type-picker-btn" data-type="'+k+'"><span class="type-dot" style="background:'+t.color+'"></span><i class="fas '+t.icon+'"></i><span>'+t.label+'</span></div>';
    });
    h+='</div><button class="type-picker-cancel" onclick="closeTypePicker()">Cancel</button></div>';
    ov.innerHTML=h; document.body.appendChild(ov);
  }
  ov.querySelectorAll('.type-picker-btn').forEach(function(b){b.onclick=function(){closeTypePicker();cb(b.dataset.type);};});
  ov.classList.add('show');
}
function closeTypePicker(){var o=document.getElementById('typePickerOverlay');if(o)o.classList.remove('show');}

// ===== RENDER STANDARD FORM (non-borrower) =====
function renderStandardForm(container, sections, data) {
  data=data||{}; var html='';
  sections.forEach(function(sec){
    html+='<div class="card-section"><div class="card-section-title">'+sec.section+'</div><div class="card-fields">';
    sec.fields.forEach(function(f){
      var val=data[f.id]||''; var sv=String(val).replace(/"/g,'&quot;');
      var cls='card-field';if(f.fullWidth)cls+=' full-width';
      if(f.conditional)cls+=' conditional'+(data[f.conditional]===f.conditionValue?' visible':'');
      html+='<div class="'+cls+'" data-field="'+f.id+'"';
      if(f.conditional)html+=' data-condition="'+f.conditional+'" data-condition-value="'+f.conditionValue+'"';
      html+='><label>'+f.label+'</label>';
      if(f.type==='select'){
        html+='<select id="cf_'+f.id+'" class="card-tracked">';
        (f.options||[]).forEach(function(o){html+='<option value="'+o.value+'"'+(val===o.value?' selected':'')+'>'+o.label+'</option>';});
        html+='</select>';
      } else if(f.type==='textarea'){
        html+='<textarea id="cf_'+f.id+'" class="card-tracked" rows="3">'+(val||'')+'</textarea>';
      } else {
        html+='<input type="'+(f.type||'text')+'" id="cf_'+f.id+'" class="card-tracked" value="'+sv+'"';
        if(f.maxlength)html+=' maxlength="'+f.maxlength+'"';if(f.placeholder)html+=' placeholder="'+f.placeholder+'"';if(f.required)html+=' required';
        html+='>';
      }
      html+='</div>';
    });
    html+='</div></div>';
  });
  container.innerHTML=html;
  wireTracking(container);
}

function wireTracking(container) {
  container.querySelectorAll('.card-tracked').forEach(function(el){
    el.addEventListener('change',function(){
      var fid=el.id.replace('cf_','');
      container.querySelectorAll('[data-condition="'+fid+'"]').forEach(function(cf){
        cf.classList.toggle('visible',el.value===cf.dataset.conditionValue);
      });
    });
    var dirty=function(){crmDirty=true;};
    el.addEventListener('input',dirty);el.addEventListener('change',dirty);
  });
}

// Wire the always-visible header fields (Name, Phone, Email) which live outside crmCardForm
// Also wire the action buttons with proper JS listeners as backup for onclick attributes
var _headerFieldsWired = false;
function wireHeaderFields() {
  if (_headerFieldsWired) return;
  _headerFieldsWired = true;

  // Wire name fields — update header display in real-time
  ['cf_first_name','cf_middle_initial','cf_last_name'].forEach(function(id){
    var el = document.getElementById(id);
    if (!el || el._dirtyWired) return;
    el._dirtyWired = true;
    var dirty = function(){
      crmDirty = true;
      var displayName = buildDisplayName();
      document.getElementById('crmDName').textContent = displayName || 'Unnamed';
      if (activeCoBorrowerIdx === 0) primaryBorrowerName = displayName;
    };
    el.addEventListener('input', dirty);
    el.addEventListener('change', dirty);
    // Auto-capitalize first letter on blur for first/last name
    if (id === 'cf_first_name' || id === 'cf_last_name') {
      el.addEventListener('blur', function() {
        if (this.value) this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
      });
    }
  });

  // Wire phone field with auto-format
  var phoneEl = document.getElementById('cf_phone');
  if (phoneEl && !phoneEl._dirtyWired) {
    phoneEl._dirtyWired = true;
    phoneEl.addEventListener('input', function(e) {
      crmDirty = true;
      formatPhoneInput(phoneEl);
    });
    phoneEl.addEventListener('change', function() { crmDirty = true; });
  }

  // Wire email
  var emailEl = document.getElementById('cf_email');
  if (emailEl && !emailEl._dirtyWired) {
    emailEl._dirtyWired = true;
    emailEl.addEventListener('input', function() { crmDirty = true; });
    emailEl.addEventListener('change', function() { crmDirty = true; });
  }

  // Wire action buttons with JS listeners (more reliable than onclick attributes)
  var saveBtn = document.getElementById('crmSaveBtn');
  if (saveBtn && !saveBtn._wired) {
    saveBtn._wired = true;
    saveBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      crmSaveContact();
    });
  }
}

// Build display name from the three fields
function buildDisplayName() {
  var first = (document.getElementById('cf_first_name') || {}).value || '';
  var mi = (document.getElementById('cf_middle_initial') || {}).value || '';
  var last = (document.getElementById('cf_last_name') || {}).value || '';
  var parts = [first.trim()];
  if (mi.trim()) parts.push(mi.trim().toUpperCase() + '.');
  parts.push(last.trim());
  return parts.filter(Boolean).join(' ');
}

// Split a full name into first/mi/last
function splitName(fullName) {
  if (!fullName) return { first: '', mi: '', last: '' };
  var parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], mi: '', last: '' };
  if (parts.length === 2) return { first: parts[0], mi: '', last: parts[1] };
  // Check if middle part looks like an initial (1 char or 1 char + period)
  var mid = parts[1];
  if (mid.length <= 2 && (mid.length === 1 || mid.charAt(1) === '.')) {
    return { first: parts[0], mi: mid.replace('.', ''), last: parts.slice(2).join(' ') };
  }
  // Otherwise treat everything between first and last as middle
  return { first: parts[0], mi: '', last: parts.slice(1).join(' ') };
}

// Populate header name fields from a contact object
function populateNameFields(c) {
  var firstEl = document.getElementById('cf_first_name');
  var miEl = document.getElementById('cf_middle_initial');
  var lastEl = document.getElementById('cf_last_name');
  if (c.first_name !== undefined) {
    // Has split fields already
    if (firstEl) firstEl.value = c.first_name || '';
    if (miEl) miEl.value = c.middle_initial || '';
    if (lastEl) lastEl.value = c.last_name || '';
  } else {
    // Legacy single name — split it
    var s = splitName(c.name || '');
    if (firstEl) firstEl.value = s.first;
    if (miEl) miEl.value = s.mi;
    if (lastEl) lastEl.value = s.last;
  }
}

// Phone formatting: (xxx) xxx-xxxx
function formatPhoneInput(el) {
  var raw = el.value.replace(/\D/g, '');
  if (raw.length > 10) raw = raw.slice(0, 10);
  var formatted = '';
  if (raw.length > 0) formatted += '(' + raw.substring(0, 3);
  if (raw.length >= 3) formatted += ') ';
  if (raw.length > 3) formatted += raw.substring(3, 6);
  if (raw.length >= 6) formatted += '-';
  if (raw.length > 6) formatted += raw.substring(6, 10);
  // Preserve cursor position
  var cursorPos = el.selectionStart;
  var prevLen = el.value.length;
  el.value = formatted;
  var newLen = el.value.length;
  var newPos = cursorPos + (newLen - prevLen);
  if (newPos < 0) newPos = 0;
  if (newPos > newLen) newPos = newLen;
  el.setSelectionRange(newPos, newPos);
}

function formatPhoneDisplay(phone) {
  if (!phone) return '';
  var raw = String(phone).replace(/\D/g, '');
  if (raw.length === 10) return '(' + raw.substring(0,3) + ') ' + raw.substring(3,6) + '-' + raw.substring(6,10);
  return phone; // return as-is if not 10 digits
}

// ===== BORROWER STATE =====
var borrowerEmployers = [];
var borrowerEducation = [];
var borrowerAssets = [];
var activeEmpTab = 0;
var activeAssetTab = 0;
var cardDocuments = [];

function newEmployer(name){
  return {id:'emp-'+Date.now()+'-'+Math.random().toString(36).substr(2,4),
    employer_name:name||'',job_title:'',start_date:'',end_date:'',
    income_type:'w2',has_ot:false,has_bonus:false,has_commission:false,
    w2_collected:false,paystubs_collected:false,qualifying_income:0};
}
function newEducation(){
  return {id:'edu-'+Date.now()+'-'+Math.random().toString(36).substr(2,4),
    school_name:'',degree:'',start_date:'',end_date:'',graduated:false};
}
function newAsset(){
  return {id:'asset-'+Date.now()+'-'+Math.random().toString(36).substr(2,4),
    institution:'',account_type:'checking',balance:0};
}

function formatMoney(a){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(a||0);
}

// ===== PHONE DUPLICATE CHECKER =====
function normalizePhone(p) {
  if (!p) return '';
  return String(p).replace(/\D/g, '').slice(-10); // last 10 digits strips country code
}

function findContactByPhone(phone, excludeId) {
  if (!phone) return null;
  var norm = normalizePhone(phone);
  if (norm.length < 7) return null; // too short to match
  if (typeof crmContacts === 'undefined') return null;
  for (var i = 0; i < crmContacts.length; i++) {
    var c = crmContacts[i];
    if (excludeId && c.id === excludeId) continue;
    if (normalizePhone(c.phone) === norm) return c;
  }
  return null;
}

// ===== RENDER BORROWER CARD (hybrid layout) =====
function renderBorrowerCard(container, data) {
  data=data||{};
  if(data.employers&&data.employers.length>0){borrowerEmployers=data.employers;}
  else if(borrowerEmployers.length===0){
    var first=newEmployer(data.employer||'');
    if(data.employer){first.job_title=data.job_title||'';first.income_type=data.income_type||'w2';}
    borrowerEmployers=[first];
  }
  if(data.education&&data.education.length>0) borrowerEducation=data.education;
  if(data.assets&&data.assets.length>0) borrowerAssets=data.assets;
  else if(borrowerAssets.length===0) borrowerAssets=[];
  if(data.reos&&data.reos.length>0) borrowerREOs=data.reos;
  else if(borrowerREOs.length===0) borrowerREOs=[];
  cardDocuments=data.documents||[];
  activeEmpTab=0;
  activeREOTab=0;

  var html='';
  // 4 main tabs (Loan details now live on Pipeline Face Card)
  html+='<div class="card-tabs" id="borrowerMainTabs">';
  html+='<div class="card-tab active" data-btab="personal" onclick="switchBorrowerTab(\'personal\')">Personal</div>';
  html+='<div class="card-tab" data-btab="employment" onclick="switchBorrowerTab(\'employment\')">Employment</div>';
  html+='<div class="card-tab" data-btab="assets" onclick="switchBorrowerTab(\'assets\')">Assets</div>';
  html+='<div class="card-tab" data-btab="reo" onclick="switchBorrowerTab(\'reo\')">REO</div>';
  html+='<div class="card-tab" data-btab="documents" onclick="switchBorrowerTab(\'documents\')">Documents</div>';
  html+='<div class="card-tab" data-btab="loanhistory" onclick="switchBorrowerTab(\'loanhistory\')">Loan History</div>';
  html+='</div>';

  // PERSONAL TAB
  html+='<div class="card-tab-content active" id="btab_personal">';
  html+=bldSec('Current Address',[
    {id:'address',l:'Street',t:'text',v:data.address},{id:'city',l:'City',t:'text',v:data.city},
    {id:'state',l:'State',t:'text',v:data.state,mx:2},{id:'zip',l:'Zip',t:'text',v:data.zip,mx:10},
    {id:'own_rent',l:'Own or Rent',t:'select',v:data.own_rent,opts:[{value:'',label:'--'},{value:'own',label:'Own'},{value:'rent',label:'Rent'}]},
    {id:'monthly_payment',l:'Monthly Payment',t:'number',v:data.monthly_payment,ph:'0.00'},
    {id:'retain_sell',l:'Retain or Sell',t:'select',v:data.retain_sell,opts:[{value:'',label:'--'},{value:'retain',label:'Retain'},{value:'sell',label:'Sell'},{value:'na',label:'N/A'}]}
  ]);
  html+='<button class="emp-tab-add" style="margin:-10px 0 16px;" onclick="addREOFromPersonal()"><i class="fas fa-home"></i> + Add REO</button>';
  html+=bldSec('Personal',[
    {id:'birthday',l:'Birthday',t:'date',v:data.birthday},
    {id:'spouse_name',l:'Spouse / Partner',t:'text',v:data.spouse_name},
    {id:'kids',l:'Kids',t:'text',v:data.kids}
  ]);
  html+=bldSec('Source',[
    {id:'source',l:'Source',t:'select',v:data.source,opts:sourceOptions()},
    {id:'realtor_name',l:'Referring Realtor',t:'text',v:data.realtor_name,cond:'source',condVal:'referral'}
  ]);
  html+='</div>';

  // EMPLOYMENT TAB
  html+='<div class="card-tab-content" id="btab_employment">';
  html+='<div id="empTabsContainer"></div><div id="empPanelsContainer"></div>';
  html+='</div>';

  // ASSETS TAB
  html+='<div class="card-tab-content" id="btab_assets">';
  html+='<div id="assetsTabsContainer"></div><div id="assetsPanelsContainer"></div>';
  html+='</div>';

  // REO TAB (Real Estate Owned)
  html+='<div class="card-tab-content" id="btab_reo">';
  html+='<div id="reoTabsContainer"></div><div id="reoPanelsContainer"></div>';
  html+='</div>';

  // DOCUMENTS TAB
  html+='<div class="card-tab-content" id="btab_documents">';
  html+='<div class="card-section"><div class="card-section-title">Documents</div>';
  html+='<div class="doc-upload-area"><div class="doc-list" id="docList"></div>';
  html+='<div class="doc-upload-btn-row"><label class="card-action-btn" style="cursor:pointer;"><i class="fas fa-upload"></i> Upload Document';
  html+='<input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style="display:none;" onchange="handleDocUpload(this)" multiple>';
  html+='</label></div></div></div>';
  html+=bldSec('Notes',[{id:'notes',l:'Notes',t:'textarea',v:data.notes,fw:true}]);
  html+='</div>';

  // LOAN HISTORY TAB
  html+='<div class="card-tab-content" id="btab_loanhistory">';
  html+='<div class="card-section"><div class="card-section-title">Completed Loans</div>';
  html+='<div id="borrowerLoanHistoryList" style="font-size:12px;color:#999;padding:8px 0;">Loading...</div>';
  html+='</div></div>';

  container.innerHTML=html;
  wireTracking(container);
  renderEmpTabs();
  renderREOTabs();
  renderDocList();
}

// Borrower section builder (compact helper)
function bldSec(title,fields){
  var h='<div class="card-section"><div class="card-section-title">'+title+'</div><div class="card-fields">';
  fields.forEach(function(f){
    var val=f.v||''; var sv=String(val).replace(/"/g,'&quot;');
    var cls='card-field'; if(f.fw)cls+=' full-width';
    if(f.cond) cls+=' conditional'+(f.v===f.condVal?' visible':'');
    h+='<div class="'+cls+'"';
    if(f.cond) h+=' data-condition="'+f.cond+'" data-condition-value="'+f.condVal+'"';
    h+=' data-field="'+f.id+'"><label>'+f.l+'</label>';
    if(f.t==='select'){
      h+='<select id="cf_'+f.id+'" class="card-tracked">';
      (f.opts||[]).forEach(function(o){h+='<option value="'+o.value+'"'+(val==o.value?' selected':'')+'>'+o.label+'</option>';});
      h+='</select>';
    } else if(f.t==='textarea'){
      h+='<textarea id="cf_'+f.id+'" class="card-tracked" rows="3">'+(val||'')+'</textarea>';
    } else {
      h+='<input type="'+f.t+'" id="cf_'+f.id+'" class="card-tracked" value="'+sv+'"';
      if(f.mx)h+=' maxlength="'+f.mx+'"';if(f.ph)h+=' placeholder="'+f.ph+'"';
      h+='>';
    }
    h+='</div>';
  });
  h+='</div></div>'; return h;
}

// ===== EMPLOYER SUB-TABS =====
function renderEmpTabs() {
  var th='<div class="emp-tabs-row">';
  borrowerEmployers.forEach(function(e,i){
    var cur=!e.end_date;
    var cls='emp-tab '+(cur?'current':'past')+(activeEmpTab===i?' active':'');
    var label=e.employer_name||('Employer '+(i+1));
    th+='<div class="'+cls+'" onclick="switchEmpTab('+i+')">'+label+'</div>';
  });
  borrowerEducation.forEach(function(ed,i){
    var idx=borrowerEmployers.length+i;
    var cls='emp-tab education'+(activeEmpTab===idx?' active':'');
    var label=ed.school_name||('Education '+(i+1));
    th+='<div class="'+cls+'" onclick="switchEmpTab('+idx+')">'+label+'</div>';
  });
  th+='<button class="emp-tab-add" onclick="addEmployer()">+ Employer</button>';
  th+='<button class="emp-tab-add" onclick="addEducation()">+ Education</button>';
  th+='</div>';
  document.getElementById('empTabsContainer').innerHTML=th;

  // Panels
  var ph='';
  borrowerEmployers.forEach(function(e,i){
    ph+='<div class="emp-panel'+(activeEmpTab===i?' active':'')+'" id="empPanel_'+i+'">'+buildEmpPanel(e,i)+'</div>';
  });
  borrowerEducation.forEach(function(ed,i){
    var idx=borrowerEmployers.length+i;
    ph+='<div class="emp-panel'+(activeEmpTab===idx?' active':'')+'" id="empPanel_'+idx+'">'+buildEduPanel(ed,i)+'</div>';
  });
  document.getElementById('empPanelsContainer').innerHTML=ph;

  // Wire tracking
  document.querySelectorAll('.emp-tracked').forEach(function(el){
    var h=function(){syncEmpField(el);crmDirty=true;};
    el.addEventListener('input',h);el.addEventListener('change',h);
  });
  updateTotalQualifying();
}

function buildEmpPanel(emp,idx){
  var p='emp_'+idx+'_';
  var h='<button class="emp-remove-btn" onclick="removeEmployer('+idx+')">Remove</button>';
  h+='<div class="card-fields">';
  h+=empField(p+'name','Employer Name','text',emp.employer_name,idx,'employer_name');
  h+=empField(p+'title','Job Title','text',emp.job_title,idx,'job_title');
  h+=empField(p+'start','Start Date','date',emp.start_date,idx,'start_date');
  h+=empField(p+'end','End Date (blank = current)','date',emp.end_date,idx,'end_date');
  // Income type select
  h+='<div class="card-field"><label>Income Type</label><select id="'+p+'income_type" class="emp-tracked" data-emp="'+idx+'" data-key="income_type">';
  [{v:'w2',l:'W-2'},{v:'1099',l:'1099'},{v:'self_employed',l:'Self-Employed'}].forEach(function(o){
    h+='<option value="'+o.v+'"'+(emp.income_type===o.v?' selected':'')+'>'+o.l+'</option>';
  });
  h+='</select></div><div class="card-field"></div>';
  // Toggles
  h+='<div class="card-toggle-row">';
  h+=empToggle(p+'ot','OT/Bonus',emp.has_ot,idx,'has_ot');
  h+=empToggle(p+'bonus','Bonus',emp.has_bonus,idx,'has_bonus');
  h+=empToggle(p+'commission','Commission',emp.has_commission,idx,'has_commission');
  h+='</div>';
  // Checkboxes
  h+='<div class="card-check-row">';
  h+=empCheck(p+'w2s','2 Yrs W-2s Collected',emp.w2_collected,idx,'w2_collected');
  h+=empCheck(p+'stubs','Recent 2 Paystubs',emp.paystubs_collected,idx,'paystubs_collected');
  h+='</div>';
  h+='</div>';
  // Qualifying + calc button
  h+='<div class="emp-qualifying"><div><div class="emp-qualifying-label">Qualifying Income (monthly)</div>';
  h+='<div class="emp-qualifying-amount" id="'+p+'qualifying">'+formatMoney(emp.qualifying_income)+'</div></div>';
  h+='<button class="emp-calc-btn" onclick="openCalcPanel('+idx+')"><i class="fas fa-calculator"></i> Open Calculator</button>';
  h+='</div>';
  return h;
}

function buildEduPanel(edu,eduIdx){
  var p='edu_'+eduIdx+'_';
  var h='<button class="emp-remove-btn" onclick="removeEducation('+eduIdx+')">Remove</button>';
  h+='<div class="card-fields">';
  h+=eduField(p+'school','School Name','text',edu.school_name,eduIdx,'school_name');
  h+=eduField(p+'degree','Degree / Program','text',edu.degree,eduIdx,'degree');
  h+=eduField(p+'start','Start Date','date',edu.start_date,eduIdx,'start_date');
  h+=eduField(p+'end','End Date','date',edu.end_date,eduIdx,'end_date');
  h+='<div class="card-check-row"><label class="card-check'+(edu.graduated?' checked':'')+'"><input type="checkbox" class="emp-tracked" data-edu="'+eduIdx+'" data-key="graduated"'+(edu.graduated?' checked':'')+'>Graduated</label></div>';
  h+='</div>';
  return h;
}

function empField(id,label,type,val,empIdx,key){
  var sv=String(val||'').replace(/"/g,'&quot;');
  return '<div class="card-field"><label>'+label+'</label><input type="'+type+'" id="'+id+'" class="emp-tracked" data-emp="'+empIdx+'" data-key="'+key+'" value="'+sv+'"></div>';
}
function eduField(id,label,type,val,eduIdx,key){
  var sv=String(val||'').replace(/"/g,'&quot;');
  return '<div class="card-field"><label>'+label+'</label><input type="'+type+'" id="'+id+'" class="emp-tracked" data-edu="'+eduIdx+'" data-key="'+key+'" value="'+sv+'"></div>';
}
function empToggle(id,label,checked,empIdx,key){
  return '<label class="card-toggle"><input type="checkbox" class="emp-tracked" data-emp="'+empIdx+'" data-key="'+key+'" id="'+id+'"'+(checked?' checked':'')+'> '+label+'</label>';
}
function empCheck(id,label,checked,empIdx,key){
  return '<label class="card-check'+(checked?' checked':'')+'"><input type="checkbox" class="emp-tracked" data-emp="'+empIdx+'" data-key="'+key+'" id="'+id+'"'+(checked?' checked':'')+'> '+label+'</label>';
}

function syncEmpField(el){
  var empIdx=el.dataset.emp; var eduIdx=el.dataset.edu; var key=el.dataset.key;
  if(!key) return;
  var val=el.type==='checkbox'?el.checked:el.value;
  if(eduIdx!==undefined&&eduIdx!==''){
    var ei=parseInt(eduIdx); if(borrowerEducation[ei]) borrowerEducation[ei][key]=val;
    // Update tab label without re-rendering
    if(key==='school_name') updateEmpTabLabel(borrowerEmployers.length+ei, val||'Education '+(ei+1));
  } else if(empIdx!==undefined&&empIdx!==''){
    var i=parseInt(empIdx); if(borrowerEmployers[i]) borrowerEmployers[i][key]=val;
    // Update tab label without re-rendering
    if(key==='employer_name') updateEmpTabLabel(i, val||'Employer '+(i+1));
    // Update tab color on end_date change (current vs past)
    if(key==='end_date') {
      clearTimeout(window._empColorRefresh);
      window._empColorRefresh=setTimeout(function(){renderEmpTabs();},600);
    }
  }
}

function updateEmpTabLabel(idx, label) {
  var tabs = document.querySelectorAll('.emp-tabs-row .emp-tab');
  if(tabs[idx]) tabs[idx].textContent = label;
}

function switchEmpTab(i){activeEmpTab=i;renderEmpTabs();}
function addEmployer(){borrowerEmployers.push(newEmployer());activeEmpTab=borrowerEmployers.length-1;renderEmpTabs();crmDirty=true;}
function addEducation(){borrowerEducation.push(newEducation());activeEmpTab=borrowerEmployers.length+borrowerEducation.length-1;renderEmpTabs();crmDirty=true;}
function removeEmployer(i){
  if(borrowerEmployers.length<=1){showToast('Need at least one employer');return;}
  borrowerEmployers.splice(i,1);if(activeEmpTab>=borrowerEmployers.length)activeEmpTab=0;renderEmpTabs();crmDirty=true;
}
function removeEducation(i){borrowerEducation.splice(i,1);activeEmpTab=0;renderEmpTabs();crmDirty=true;}

function updateTotalQualifying(){
  var total=0;
  borrowerEmployers.forEach(function(e){total+=(parseFloat(e.qualifying_income)||0);});
  var el=document.getElementById('cardTotalQualifying');
  if(el)el.textContent=formatMoney(total);
}

// ===== REO (REAL ESTATE OWNED) SYSTEM =====
var borrowerREOs = [];
var activeREOTab = 0;

function newREO(addr){
  return {id:'reo-'+Date.now()+'-'+Math.random().toString(36).substr(2,4),
    address:addr||'',city:'',state:'',zip:'',
    occupancy_type:'',retain_sell:'',units:'1',pct_owned:'100',
    receive_rent:false,rent_amount:0,
    pi_payment:0,insurance:0,taxes:0};
}

function renderREOTabs(){
  var c1=document.getElementById('reoTabsContainer');
  var c2=document.getElementById('reoPanelsContainer');
  if(!c1||!c2) return;

  var th='<div class="emp-tabs-row">';
  borrowerREOs.forEach(function(r,i){
    var selling=r.retain_sell==='sell';
    var cls='emp-tab '+(selling?'past':'current')+(activeREOTab===i?' active':'');
    var label=r.address||('Property '+(i+1));
    if(label.length>25) label=label.substring(0,25)+'...';
    th+='<div class="'+cls+'" onclick="switchREOTab('+i+')">'+label+'</div>';
  });
  th+='<button class="emp-tab-add" onclick="addREO()"><i class="fas fa-home"></i> + Property</button>';
  th+='</div>';
  c1.innerHTML=th;

  var ph='';
  borrowerREOs.forEach(function(r,i){
    ph+='<div class="emp-panel'+(activeREOTab===i?' active':'')+'" id="reoPanel_'+i+'">'+buildREOPanel(r,i)+'</div>';
  });
  c2.innerHTML=ph;

  // Wire tracking
  document.querySelectorAll('.reo-tracked').forEach(function(el){
    var h=function(){syncREOField(el);crmDirty=true;};
    el.addEventListener('input',h);el.addEventListener('change',h);
  });
}

function buildREOPanel(reo,idx){
  var p='reo_'+idx+'_';
  var h='<button class="emp-remove-btn" onclick="removeREO('+idx+')">Remove</button>';
  h+='<div class="card-fields">';
  h+=reoField(p+'address','Street','text',reo.address,idx,'address');
  h+=reoField(p+'city','City','text',reo.city,idx,'city');
  h+=reoField(p+'state','State','text',reo.state,idx,'state');
  h+=reoField(p+'zip','Zip','text',reo.zip,idx,'zip');
  // Occupancy type
  h+='<div class="card-field"><label>Occupancy Type</label><select id="'+p+'occupancy" class="reo-tracked" data-reo="'+idx+'" data-key="occupancy_type">';
  [{v:'',l:'--'},{v:'primary',l:'Primary Residence'},{v:'second',l:'Second Home'},{v:'investment',l:'Investment'}].forEach(function(o){
    h+='<option value="'+o.v+'"'+(reo.occupancy_type===o.v?' selected':'')+'>'+o.l+'</option>';
  });
  h+='</select></div>';
  // Retain or sell
  h+='<div class="card-field"><label>Retain or Sell</label><select id="'+p+'retain" class="reo-tracked" data-reo="'+idx+'" data-key="retain_sell">';
  [{v:'',l:'--'},{v:'retain',l:'Retain'},{v:'sell',l:'Sell'},{v:'na',l:'N/A'}].forEach(function(o){
    h+='<option value="'+o.v+'"'+(reo.retain_sell===o.v?' selected':'')+'>'+o.l+'</option>';
  });
  h+='</select></div>';
  // Units
  h+='<div class="card-field"><label>Units</label><select id="'+p+'units" class="reo-tracked" data-reo="'+idx+'" data-key="units">';
  ['1','2','3','4'].forEach(function(u){
    h+='<option value="'+u+'"'+(reo.units===u?' selected':'')+'>'+u+'</option>';
  });
  h+='</select></div>';
  h+='<div class="card-field"></div>';
  // % Owned
  h+=reoField(p+'pct_owned','% Owned','number',reo.pct_owned,idx,'pct_owned');
  // Rent toggle + amount
  h+='<div class="card-toggle-row">';
  h+='<label class="card-toggle"><input type="checkbox" class="reo-tracked" data-reo="'+idx+'" data-key="receive_rent" id="'+p+'rent"'+(reo.receive_rent?' checked':'')+'> Receive Rent</label>';
  h+='</div>';
  h+=reoField(p+'rent_amount','Monthly Rent Amount','number',reo.rent_amount,idx,'rent_amount');
  h+=reoField(p+'pi','P&I Payment','number',reo.pi_payment,idx,'pi_payment');
  h+=reoField(p+'insurance','Insurance Payment','number',reo.insurance,idx,'insurance');
  h+=reoField(p+'taxes','Taxes (monthly)','number',reo.taxes,idx,'taxes');
  h+='</div>';
  return h;
}

function reoField(id,label,type,val,reoIdx,key){
  var sv=String(val||'').replace(/"/g,'&quot;');
  return '<div class="card-field"><label>'+label+'</label><input type="'+type+'" id="'+id+'" class="reo-tracked" data-reo="'+reoIdx+'" data-key="'+key+'" value="'+sv+'"'+(type==='number'?' step="0.01" min="0" placeholder="0.00"':'')+'></div>';
}

function syncREOField(el){
  var idx=el.dataset.reo; var key=el.dataset.key;
  if(!key||idx===undefined||idx==='') return;
  var i=parseInt(idx);
  if(!borrowerREOs[i]) return;
  var val=el.type==='checkbox'?el.checked:el.value;
  borrowerREOs[i][key]=val;
  // Update tab label on address change
  if(key==='address') updateREOTabLabel(i, val||'Property '+(i+1));
  // Update tab color on retain/sell change
  if(key==='retain_sell'){
    clearTimeout(window._reoRefresh);
    window._reoRefresh=setTimeout(function(){renderREOTabs();},600);
  }
}

function updateREOTabLabel(idx,label){
  var tabs=document.querySelectorAll('#reoTabsContainer .emp-tab');
  if(label.length>25) label=label.substring(0,25)+'...';
  if(tabs[idx]) tabs[idx].textContent=label;
}

function switchREOTab(i){activeREOTab=i;renderREOTabs();}
function addREO(prefill){
  var r=newREO();
  if(prefill){r.address=prefill.address||'';r.city=prefill.city||'';r.state=prefill.state||'';r.zip=prefill.zip||'';}
  borrowerREOs.push(r);activeREOTab=borrowerREOs.length-1;renderREOTabs();crmDirty=true;
}
function removeREO(i){
  borrowerREOs.splice(i,1);if(activeREOTab>=borrowerREOs.length)activeREOTab=Math.max(0,borrowerREOs.length-1);renderREOTabs();crmDirty=true;
}

// Add REO from Personal tab (pre-fills current address)
function addREOFromPersonal(){
  var addr=document.getElementById('cf_address');
  var city=document.getElementById('cf_city');
  var state=document.getElementById('cf_state');
  var zip=document.getElementById('cf_zip');
  addREO({
    address:addr?addr.value:'',city:city?city.value:'',
    state:state?state.value:'',zip:zip?zip.value:''
  });
  switchBorrowerTab('reo');
}

// ===== BORROWER MAIN TAB SWITCHER =====
function switchBorrowerTab(tab){
  document.querySelectorAll('#borrowerMainTabs .card-tab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('[id^="btab_"]').forEach(function(t){t.classList.remove('active');});
  var tabEl=document.querySelector('[data-btab="'+tab+'"]');
  var contentEl=document.getElementById('btab_'+tab);
  if(tabEl)tabEl.classList.add('active');
  if(contentEl)contentEl.classList.add('active');
  if(tab==='assets') renderAssetTabs();
  if(tab==='loanhistory') renderBorrowerLoanHistory();
}

// ===== ASSETS TAB =====
function renderAssetTabs(){
  var tc=document.getElementById('assetsTabsContainer');
  var pc=document.getElementById('assetsPanelsContainer');
  if(!tc||!pc)return;

  var th='<div class="emp-tabs-row">';
  borrowerAssets.forEach(function(a,i){
    th+='<button class="emp-tab'+(activeAssetTab===i?' active':'')+'" onclick="switchAssetTab('+i+')">'+(a.institution||'Account '+(i+1))+'</button>';
  });
  th+='<button class="emp-tab-add" onclick="addAsset()"><i class="fas fa-plus"></i> Add Account</button></div>';
  tc.innerHTML=th;

  var ph='';
  borrowerAssets.forEach(function(a,i){
    ph+='<div class="emp-panel'+(activeAssetTab===i?' active':'')+'" id="assetPanel_'+i+'">'+buildAssetPanel(a,i)+'</div>';
  });
  pc.innerHTML=ph;

  // Wire tracking — same pattern as employers and REOs
  document.querySelectorAll('.asset-tracked').forEach(function(el){
    var h=function(){ syncAssetField(el); crmDirty=true; };
    el.addEventListener('input',h); el.addEventListener('change',h);
  });
}

function buildAssetPanel(asset,idx){
  var p='asset_'+idx+'_';
  var h='';
  if(borrowerAssets.length>1){
    h+='<button class="emp-remove-btn" onclick="removeAsset('+idx+')">Remove</button>';
  }
  h+='<div class="card-section"><div class="card-section-title">Account Details</div><div class="card-fields">';
  h+=assetField(p+'institution','Institution Name','text',asset.institution,idx,'institution','Chase, Wells Fargo, etc.');
  // Account type select
  h+='<div class="card-field"><label>Account Type</label><select id="'+p+'type" class="asset-tracked" data-asset="'+idx+'" data-key="account_type">';
  [{v:'checking',l:'Checking'},{v:'savings',l:'Savings'},{v:'money_market',l:'Money Market'},{v:'cd',l:'CD'},{v:'ira',l:'IRA'},{v:'401k',l:'401(k)'},{v:'brokerage',l:'Brokerage'},{v:'trust',l:'Trust'},{v:'gift',l:'Gift Funds'},{v:'other',l:'Other'}].forEach(function(o){
    h+='<option value="'+o.v+'"'+(asset.account_type===o.v?' selected':'')+'>'+o.l+'</option>';
  });
  h+='</select></div>';
  // Balance field — currency formatting
  var balDisplay=asset.balance?formatMoney(asset.balance):'';
  h+='<div class="card-field"><label>Balance</label><input type="text" id="'+p+'balance" class="asset-tracked" data-asset="'+idx+'" data-key="balance" value="'+balDisplay+'" placeholder="$0.00"></div>';
  h+='</div></div>';
  return h;
}

function assetField(id,label,type,val,assetIdx,key,ph){
  var sv=String(val||'').replace(/"/g,'&quot;');
  return '<div class="card-field"><label>'+label+'</label><input type="'+type+'" id="'+id+'" class="asset-tracked" data-asset="'+assetIdx+'" data-key="'+key+'" value="'+sv+'"'+(ph?' placeholder="'+ph+'"':'')+'></div>';
}

function syncAssetField(el){
  var idx=el.dataset.asset; var key=el.dataset.key;
  if(!key||idx===undefined||idx==='') return;
  var i=parseInt(idx);
  if(!borrowerAssets[i]) return;
  var val=el.value;
  // Special handling for balance — parse currency to number
  if(key==='balance'){
    var num=parseFloat(val.replace(/[^0-9.]/g,''))||0;
    borrowerAssets[i].balance=num;
  } else {
    borrowerAssets[i][key]=val;
  }
  // Update tab label on institution change
  if(key==='institution'){
    var tabs=document.querySelectorAll('#assetsTabsContainer .emp-tab');
    if(tabs[i]) tabs[i].textContent=val||'Account '+(i+1);
  }
}

// Format balance on blur (show currency), strip on focus (show raw number)
document.addEventListener('focus',function(e){
  var el=e.target;
  if(el.classList.contains('asset-tracked')&&el.dataset.key==='balance'){
    var raw=el.value.replace(/[^0-9.]/g,'');
    el.value=raw;
  }
},true);
document.addEventListener('blur',function(e){
  var el=e.target;
  if(el.classList.contains('asset-tracked')&&el.dataset.key==='balance'){
    var num=parseFloat(el.value.replace(/[^0-9.]/g,''))||0;
    borrowerAssets[parseInt(el.dataset.asset)].balance=num;
    el.value=num?formatMoney(num):'';
  }
},true);

function switchAssetTab(idx){
  activeAssetTab=idx;
  renderAssetTabs();
}

function addAsset(){
  borrowerAssets.push(newAsset());
  activeAssetTab=borrowerAssets.length-1;
  renderAssetTabs();
  crmDirty=true;
}

function removeAsset(idx){
  if(borrowerAssets.length<=1)return;
  borrowerAssets.splice(idx,1);
  if(activeAssetTab>=borrowerAssets.length) activeAssetTab=borrowerAssets.length-1;
  renderAssetTabs();
  crmDirty=true;
}

// ===== LOAN HISTORY TAB =====
function renderBorrowerLoanHistory(){
  var el=document.getElementById('borrowerLoanHistoryList');
  if(!el||!crmCurrentId)return;
  el.innerHTML='<div style="color:#999;font-size:13px;padding:8px 0;">Loading loan history...</div>';
  fetch(CRM_API+'/ae-loans-api',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'getHistory',crm_contact_id:crmCurrentId})
  }).then(function(r){return r.json();})
  .then(function(data){
    if(!data.success||!data.history||data.history.length===0){
      el.innerHTML='<div style="color:#999;font-size:13px;padding:8px 0;">No completed loans on record</div>';
      return;
    }
    var icons={funded:'fa-trophy',denied:'fa-times-circle',suspended:'fa-pause-circle',withdrawn:'fa-undo'};
    var colors={funded:'#22c55e',denied:'#ef4444',suspended:'#f59e0b',withdrawn:'#8b5cf6'};
    var h='';
    data.history.forEach(function(loan){
      var color=colors[loan.outcome]||'#64748b';
      var icon=icons[loan.outcome]||'fa-file';
      var loanType=loan.loan_type||loan.transaction_type||(loan.transaction_type&&loan.loan_program?(loan.transaction_type+' / '+loan.loan_program):'—');
      var rate=loan.interest_rate?(parseFloat(loan.interest_rate).toFixed(3)+'%'):'—';
      var amt=loan.loan_amount?('$'+parseFloat(loan.loan_amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',')):'—';
      var addr=loan.subject_address||'—';
      var dt=loan.outcome_date?new Date(loan.outcome_date+'T00:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):'—';
      var outcomeLabel=loan.outcome?(loan.outcome.charAt(0).toUpperCase()+loan.outcome.slice(1)):'—';

      // Build borrower names from the borrowers array
      var borrowerNames='';
      if(loan.borrowers&&loan.borrowers.length>0){
        borrowerNames=loan.borrowers.map(function(b){
          var role=b.role?(b.role.charAt(0).toUpperCase()+b.role.slice(1).replace(/_/g,' ')):'';
          return (b.name||'Unknown')+(role?' <span style="font-size:11px;opacity:0.5;">('+role+')</span>':'');
        }).join(', ');
      } else {
        borrowerNames=loan.primary_name||'—';
      }

      // AE ID badge
      var aeIdBadge = loan.ae_id ? '<span style="font-family:monospace;font-size:12px;font-weight:600;color:#0ea5e9;background:rgba(14,165,233,0.1);padding:3px 10px;border-radius:4px;">' + loan.ae_id + '</span>' : '';

      h+='<div style="background:rgba(0,0,0,0.02);border:1px solid #e5e7eb;border-left:3px solid '+color+';border-radius:8px;padding:16px 18px;margin-bottom:12px;">';
      // Header row: outcome badge + AE ID + loan number + date
      h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">';
      h+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">';
      h+='<span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:14px;color:'+color+';"><i class="fas '+icon+'"></i> '+outcomeLabel+'</span>';
      h+=aeIdBadge;
      if(loan.loan_number){
        h+='<span style="font-family:monospace;font-size:12px;font-weight:600;color:#666;background:rgba(0,0,0,0.03);padding:3px 10px;border-radius:4px;">Loan #'+loan.loan_number+'</span>';
      }
      h+='</div>';
      h+='<span style="font-size:12px;color:#888;">'+dt+'</span>';
      h+='</div>';
      // Details grid
      h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">';
      h+='<div><span style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Loan Type</span><div style="margin-top:3px;">'+loanType+'</div></div>';
      h+='<div><span style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Interest Rate</span><div style="margin-top:3px;">'+rate+'</div></div>';
      h+='<div><span style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Loan Amount</span><div style="margin-top:3px;">'+amt+'</div></div>';
      h+='<div><span style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Strike Rate</span><div style="margin-top:3px;">'+(loan.strike_rate||'—')+'</div></div>';
      h+='<div style="grid-column:1/-1;"><span style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Property</span><div style="margin-top:3px;">'+addr+'</div></div>';
      h+='<div style="grid-column:1/-1;"><span style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Borrowers on Loan</span><div style="margin-top:3px;">'+borrowerNames+'</div></div>';
      if(loan.notes){
        h+='<div style="grid-column:1/-1;"><span style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Notes</span><div style="margin-top:3px;font-style:italic;opacity:0.6;">'+loan.notes+'</div></div>';
      }
      h+='</div></div>';
    });
    el.innerHTML=h;
  }).catch(function(err){
    console.error('Loan history tab error:',err);
    el.innerHTML='<div style="color:#ef4444;font-size:13px;padding:8px 0;">Error loading loan history</div>';
  });
}

// ===== ACTIVE LOAN RELATIONSHIPS =====
function fetchActiveLoanRelationships(crmId) {
  var banner = document.getElementById('crmLoanHistoryBanner');
  if (!banner || !crmId) return;

  var roleLabels = { primary: 'Primary Borrower', 'co-borrower': 'Co-Borrower', spouse: 'Spouse', 'non-borrowing_spouse': 'Non-Borrowing Spouse', parent: 'Parent', other: 'Other', '': '' };
  var stageLabels = {};
  if (typeof PIPELINE_STAGES !== 'undefined') {
    PIPELINE_STAGES.forEach(function(s) { stageLabels[s.id] = s.label; });
  }

  fetch(CRM_API + '/ae-loans-api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getContactLoans', crm_contact_id: crmId })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (!data.success) { banner.style.display = 'none'; return; }
    var h = '';

    // Active loans
    if (data.active_loans && data.active_loans.length > 0) {
      h += '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888;margin-bottom:10px;"><i class="fas fa-funnel-dollar" style="margin-right:6px;"></i> Active Loan' + (data.active_loans.length > 1 ? 's' : '') + '</div>';

      data.active_loans.forEach(function(loan) {
        var stageLabel = stageLabels[loan.pipeline_stage] || loan.pipeline_stage || '—';
        var myRole = loan.my_role || 'primary';
        var myRoleLabel = roleLabels[myRole] || myRole;
        var roleColor = myRole === 'primary' ? '#0ea5e9' : '#a855f7';

        // Other borrowers on this loan
        var otherBorrowers = (loan.borrowers || []).filter(function(b) { return b.crm_contact_id !== crmId; });
        var othersHtml = '';
        if (otherBorrowers.length > 0) {
          othersHtml = '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">';
          otherBorrowers.forEach(function(b) {
            var bColor = b.role === 'primary' ? '#0ea5e9' : '#a855f7';
            var bRoleLabel = roleLabels[b.role] || b.role || '';
            var clickAttr = b.crm_contact_id ? ' onclick="event.stopPropagation();crmSelectContact(\'' + b.crm_contact_id + '\')" style="cursor:pointer;"' : '';
            othersHtml += '<span' + clickAttr + ' style="background:' + bColor + '10;border:1px solid ' + bColor + '30;color:' + bColor + ';padding:4px 10px;border-radius:5px;font-size:12px;font-weight:600;">';
            othersHtml += (b.name || 'Unknown');
            if (bRoleLabel) othersHtml += ' <span style="font-size:10px;opacity:0.6;">(' + bRoleLabel + ')</span>';
            if (b.crm_contact_id) othersHtml += ' <i class="fas fa-external-link-alt" style="font-size:8px;opacity:0.4;"></i>';
            othersHtml += '</span>';
          });
          othersHtml += '</div>';
        }

        // Loan details
        var details = [];
        if (loan.transaction_type) details.push(loan.transaction_type);
        if (loan.loan_program) details.push(loan.loan_program);
        if (loan.interest_rate) details.push(parseFloat(loan.interest_rate).toFixed(3) + '%');
        if (loan.loan_amount) details.push('$' + parseFloat(loan.loan_amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','));

        var address = [loan.subject_street, loan.subject_city, loan.subject_state].filter(Boolean).join(', ');

        h += '<div style="background:rgba(0,0,0,0.02);border:1px solid #f0f0f0;border-left:3px solid ' + roleColor + ';border-radius:8px;padding:14px 16px;margin-bottom:8px;">';
        // Top row: AE ID + role + stage
        h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">';
        h += '<div style="display:flex;align-items:center;gap:8px;">';
        h += '<span style="font-family:monospace;font-size:12px;font-weight:700;color:#0ea5e9;background:rgba(14,165,233,0.1);padding:3px 10px;border-radius:4px;">' + loan.ae_id + '</span>';
        h += '<span style="font-size:12px;font-weight:700;color:' + roleColor + ';"><i class="fas fa-user"></i> ' + myRoleLabel + '</span>';
        h += '</div>';
        h += '<span style="font-size:12px;padding:3px 10px;border-radius:5px;background:#e5e7eb;color:#666;font-weight:600;">' + stageLabel + '</span>';
        h += '</div>';
        // Details
        if (address || details.length > 0) {
          h += '<div style="margin-top:8px;font-size:13px;color:#666;">';
          if (address) h += '<div><i class="fas fa-map-marker-alt" style="margin-right:4px;font-size:10px;"></i>' + address + '</div>';
          if (details.length > 0) h += '<div style="margin-top:3px;">' + details.join(' · ') + '</div>';
          h += '</div>';
        }
        if (otherBorrowers.length > 0) {
          h += '<div style="margin-top:8px;font-size:11px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;">Also on this loan:</div>';
          h += othersHtml;
        }
        h += '</div>';
      });
    }

    if (h) {
      banner.innerHTML = h;
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
      banner.innerHTML = '';
    }
  }).catch(function(err) {
    console.error('Active loans fetch error:', err);
    banner.style.display = 'none';
  });
}

// ===== PIPELINE BUTTON =====
function renderPipelineButton(container,contactId,currentStage){
  var isIn=!!currentStage;
  var stageObj=isIn?PIPELINE_STAGES.find(function(s){return s.id===currentStage;}):null;
  var h='<div class="pipeline-action"><button class="pipeline-stage-btn '+(isIn?'in-pipeline':'not-in-pipeline')+'" onclick="togglePipelineDropdown()">';
  h+='<i class="fas fa-funnel-dollar"></i> '+(isIn?stageObj.label:'Add to Pipeline')+' <i class="fas fa-caret-down" style="margin-left:4px;font-size:10px;"></i></button>';
  h+='<div class="pipeline-dropdown" id="pipelineDropdown">';
  PIPELINE_STAGES.forEach(function(s){
    h+='<div class="pipeline-dropdown-item'+(currentStage===s.id?' active':'')+'" onclick="setPipelineStage(\''+contactId+'\',\''+s.id+'\')">'+s.label+'</div>';
  });
  if(isIn) h+='<div class="pipeline-dropdown-item pipeline-dropdown-remove" onclick="removePipelineStage(\''+contactId+'\')"><i class="fas fa-times"></i> Remove from Pipeline</div>';
  h+='</div></div>';
  container.innerHTML=h;
}
function togglePipelineDropdown(){
  var dd=document.getElementById('pipelineDropdown');
  if(!dd) return;
  dd.classList.toggle('show');
  if(dd.classList.contains('show')){
    setTimeout(function(){
      var close=function(e){
        if(!e.target.closest('.pipeline-action')){
          dd.classList.remove('show');
        }
        document.removeEventListener('click',close,true);
      };
      document.addEventListener('click',close,true);
    },10);
  }
}

function setPipelineStage(contactId,stage){
  var userId = localStorage.getItem('agent_edge_user') || 'default';

  fetch(CRM_API+'/ae-loans-api',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      action:'createLoan',
      user_id: userId,
      crm_contact_id: contactId,
      pipeline_stage: stage,
      source: 'crm'
    })
  }).then(function(r){return r.json();})
  .then(function(result){
    if(result.success){
      var dd=document.getElementById('pipelineDropdown');if(dd)dd.classList.remove('show');
      var btn=document.getElementById('cardPipelineBtn');if(btn)renderPipelineButton(btn,contactId,stage);
      var displayName = buildDisplayName();
      showToast(displayName+' pushed to pipeline — '+result.ae_id);
      if(typeof loadPipeline==='function')loadPipeline();
      // Add borrower designation
      if(!hasDesignation({designations:window._currentDesignations||[]},'borrower')){
        if(!window._currentDesignations) window._currentDesignations=[];
        window._currentDesignations.push('borrower');
        fetch(CRM_API+'/crm-api?action=addDesignation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({crm_id:contactId,designation:'borrower'})}).catch(function(){});
        if(typeof crmContacts!=='undefined'){var idx=crmContacts.findIndex(function(c){return c.id===contactId;});if(idx>=0){if(!crmContacts[idx].designations)crmContacts[idx].designations=[];crmContacts[idx].designations.push('borrower');}}
        // Rebuild badge with designation
        var rootTi=CONTACT_TYPES[window._currentRootType||crmCurrentType]||CONTACT_TYPES.other;
        var badgeHtml='<span class="card-type-badge" style="background:'+rootTi.color+'22;color:'+rootTi.color+';"><i class="fas '+rootTi.icon+'"></i> '+rootTi.label+'</span>';
        (window._currentDesignations||[]).forEach(function(d){var dt=DESIGNATION_TYPES[d];if(dt)badgeHtml+=' <span class="card-desig-badge" style="background:'+dt.color+'18;color:'+dt.color+';border:1px solid '+dt.color+'33;"><i class="fas '+dt.icon+'"></i> '+dt.label+'</span>';});
        document.getElementById('crmDTypeBadge').innerHTML=badgeHtml;
        var qt=document.getElementById('cardQualifyingWrap');if(qt)qt.style.display='block';
        var fc=document.getElementById('crmCardForm');
        var cd=collectAllCardData();
        renderBorrowerCard(fc,cd);
        renderCoBorrowerTabs();
        if(typeof crmRenderList==='function')crmRenderList();
        showToast('Borrower designation added');
      }
    } else {
      showToast('Error: '+(result.message||'Unknown'));
    }
  }).catch(function(err){console.error('Pipeline error:',err);});
}

function removePipelineStage(contactId){
  // TODO: implement remove from pipeline via ae-loans-api
  // For now, just update the UI
  var dd=document.getElementById('pipelineDropdown');if(dd)dd.classList.remove('show');
  var btn=document.getElementById('cardPipelineBtn');if(btn)renderPipelineButton(btn,contactId,null);
  showToast('Removed from pipeline');if(typeof loadPipeline==='function')loadPipeline();
}

// ===== INCOME CALCULATOR SIDE PANEL (iframe-based) =====
var calcPanelEmpIdx = 0;
var activeCalcType = 'w2'; // 'w2' or 'se'

function openCalcPanel(empIdx){
  calcPanelEmpIdx=empIdx;
  var ov=document.getElementById('calcSideOverlay');
  if(!ov){buildCalcSidePanel();ov=document.getElementById('calcSideOverlay');}
  var emp=borrowerEmployers[empIdx];
  document.getElementById('calcSideTitle').textContent='Income Calculator - '+(emp.employer_name||'Employer '+(empIdx+1));
  // Show qualifying input with current value
  var qInput=document.getElementById('calcQualifyingInput');
  if(qInput) qInput.value=emp.qualifying_income||'';
  // Default to W-2 calc
  switchCalcType('w2');
  ov.classList.add('open');
}
function closeCalcPanel(){var o=document.getElementById('calcSideOverlay');if(o)o.classList.remove('open');}

function switchCalcType(type){
  activeCalcType=type;
  var frame=document.getElementById('calcIframe');
  if(type==='w2') frame.src='mc-income-calculator.html';
  else frame.src='mc-self-employed-calculator.html';
  var w2Tab=document.getElementById('calcTabW2');
  var seTab=document.getElementById('calcTabSE');
  if(w2Tab){w2Tab.classList.toggle('active-calc',type==='w2');}
  if(seTab){seTab.classList.toggle('active-calc',type==='se');}
}

// Listen for postMessage from calculator iframes - auto-fill qualifying input
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'calcTotal') {
    var input = document.getElementById('calcQualifyingInput');
    if (input) input.value = (e.data.amount || 0).toFixed(2);
  }
});

function buildCalcSidePanel(){
  var ov=document.createElement('div');ov.id='calcSideOverlay';ov.className='calc-side-overlay';
  ov.innerHTML='<div class="calc-side-panel">'+
    '<div class="calc-side-header">'+
      '<div class="calc-side-title" id="calcSideTitle">Income Calculator</div>'+
      '<button class="calc-side-close" onclick="closeCalcPanel()"><i class="fas fa-times"></i></button>'+
    '</div>'+
    '<div class="calc-side-tabs">'+
      '<button class="calc-side-tab active-calc" id="calcTabW2" onclick="switchCalcType(\'w2\')"><i class="fas fa-calculator"></i> W-2 Calculator</button>'+
      '<button class="calc-side-tab" id="calcTabSE" onclick="switchCalcType(\'se\')"><i class="fas fa-store"></i> Self-Employed Calculator</button>'+
    '</div>'+
    '<div class="calc-side-action-bar">'+
      '<div class="calc-save-row">'+
        '<label class="calc-save-label">Qualifying Income:</label>'+
        '<input type="number" id="calcQualifyingInput" placeholder="0.00" step="0.01" min="0" style="width:140px;padding:8px 12px;border-radius:7px;font-size:14px;font-weight:700;background:#f0f0f0;border:1px solid rgba(34,197,94,0.3);color:#22c55e;">'+
        '<button class="card-action-btn primary" onclick="saveCalcToEmployer()" style="padding:8px 14px;"><i class="fas fa-save"></i> Save to Card</button>'+
        '<button class="card-action-btn" onclick="exportCalcToDoc()" style="padding:8px 14px;"><i class="fas fa-folder-plus"></i> Save to Docs</button>'+
      '</div>'+
    '</div>'+
    '<div class="calc-side-body">'+
      '<iframe id="calcIframe" src="mc-income-calculator.html" style="width:100%;height:100%;border:none;border-radius:8px;"></iframe>'+
    '</div>'+
  '</div>';
  ov.addEventListener('click',function(e){if(e.target===ov)closeCalcPanel();});
  document.body.appendChild(ov);
}

function saveCalcToEmployer(){
  var input=document.getElementById('calcQualifyingInput');
  if(!input||!input.value){showToast('Enter the qualifying income amount');return;}
  var amt=parseFloat(input.value)||0;
  borrowerEmployers[calcPanelEmpIdx].qualifying_income=amt;
  // Update the employer panel display
  var qEl=document.getElementById('emp_'+calcPanelEmpIdx+'_qualifying');
  if(qEl) qEl.textContent=formatMoney(amt);
  updateTotalQualifying();
  crmDirty=true;
  showToast('Income saved: '+formatMoney(amt));
  closeCalcPanel();
}

function exportCalcToDoc(){
  var emp=borrowerEmployers[calcPanelEmpIdx];
  var name=buildDisplayName()||'Borrower';
  var input=document.getElementById('calcQualifyingInput');
  var amt=input?input.value:'0';
  addDocumentToCard('Income Calc - '+(emp.employer_name||'Employer')+' - '+name+' - '+formatMoney(amt),'income_calc',new Date().toISOString());
  showToast('Saved to documents');
}

// ===== CO-BORROWER SYSTEM =====
var coBorrowers = []; // [{id, name, phone, email, relationship, excluded, data:{...full borrower data}}]
var activeCoBorrowerIdx = 0; // 0 = primary, 1+ = co-borrowers
var sharedLoanData = {}; // Shared loan fields across all borrowers
var primaryBorrowerName = ''; // Dedicated store — never overwritten by co-borrower switching

function initCoBorrowers(data) {
  coBorrowers = data.co_borrowers || [];
  sharedLoanData = data.shared_loan || {};
  activeCoBorrowerIdx = 0;
  primaryBorrowerName = data.name || '';
}

function renderCoBorrowerTabs() {
  var container = document.getElementById('coBorrowerTabs');
  if (!container) return;
  if (crmCurrentType !== 'borrower' && crmCurrentType !== 'past_client') { container.style.display = 'none'; return; }
  container.style.display = 'block';

  // Use full primary name
  var primName = primaryBorrowerName || 'Primary';

  var h = '<div class="coborrower-tabs">';
  // Primary tab
  h += '<div class="coborrower-tab primary' + (activeCoBorrowerIdx === 0 ? ' active' : '') + '" onclick="switchCoBorrower(0)">';
  h += primName + '<span class="cb-relationship">primary</span></div>';
  // Co-borrower tabs — show FULL name
  coBorrowers.forEach(function(cb, i) {
    var cbName = cb.name || 'Borrower ' + (i + 2);
    var linked = cb.contact_id ? ' linked' : '';
    var cls = 'coborrower-tab secondary' + (activeCoBorrowerIdx === (i + 1) ? ' active' : '') + (cb.excluded ? ' excluded' : '') + linked;
    h += '<div class="' + cls + '" onclick="switchCoBorrower(' + (i + 1) + ')" oncontextmenu="event.preventDefault();showCBContext(' + i + ',event)">';
    h += (cb.contact_id ? '<i class="fas fa-link cb-link-icon"></i> ' : '') + cbName + '<span class="cb-relationship">' + (cb.relationship || 'co-borrower') + '</span></div>';
  });
  h += '<button class="coborrower-add" onclick="showAddCoBorrower()">+ Co-Borrower</button>';
  h += '</div>';
  container.innerHTML = h;

  // Show/hide combined income on B1
  var combinedWrap = document.getElementById('cardCombinedWrap');
  if (combinedWrap) {
    combinedWrap.style.display = (coBorrowers.length > 0 && activeCoBorrowerIdx === 0) ? 'block' : 'none';
  }
  // Update label
  var label = document.getElementById('cardQualifyingLabel');
  if (label) {
    if (activeCoBorrowerIdx === 0) label.textContent = 'B1 Qualifying Income';
    else label.textContent = 'B' + (activeCoBorrowerIdx + 1) + ' Qualifying Income';
  }
  updateCombinedIncome();

  // Show Create/View Contact button when on a co-borrower tab
  var cbBtn = document.getElementById('cbContactBtn');
  if (cbBtn) {
    if (activeCoBorrowerIdx > 0) {
      var cb = coBorrowers[activeCoBorrowerIdx - 1];
      if (cb.contact_id) {
        cbBtn.innerHTML = '<button class="card-action-btn" onclick="viewCBContact(\'' + cb.contact_id + '\')"><i class="fas fa-address-card"></i> View Contact</button>';
      } else {
        cbBtn.innerHTML = '<button class="card-action-btn" style="background:rgba(34,197,94,0.1);border-color:rgba(34,197,94,0.3);color:#22c55e;" onclick="createCBContact(' + (activeCoBorrowerIdx - 1) + ')"><i class="fas fa-user-plus"></i> Create Contact</button>';
      }
    } else {
      cbBtn.innerHTML = '';
    }
  }
  // Show/hide Unlink button based on whether we're on a co-borrower tab
  var unlinkBtn = document.getElementById('crmUnlinkBtn');
  if (unlinkBtn) unlinkBtn.style.display = (activeCoBorrowerIdx > 0) ? '' : 'none';
}

function switchCoBorrower(idx) {
  // Save current borrower's data before switching
  saveCoBorrowerState();
  activeCoBorrowerIdx = idx;

  if (idx === 0) {
    // Load primary borrower data
    loadPrimaryBorrowerData();
    // Update header to show primary's name and populate fields
    if (window._primaryBorrowerData) {
      document.getElementById('crmDName').textContent = window._primaryBorrowerData.name || 'Unnamed';
      document.getElementById('crmDMeta').textContent = [window._primaryBorrowerData.email, formatPhoneDisplay(window._primaryBorrowerData.phone)].filter(Boolean).join(' – ');
      populateNameFields(window._primaryBorrowerData);
      var phoneEl = document.getElementById('cf_phone');
      if(phoneEl) { phoneEl.value = window._primaryBorrowerData.phone || ''; formatPhoneInput(phoneEl); }
      var emailEl = document.getElementById('cf_email');
      if(emailEl) emailEl.value = window._primaryBorrowerData.email || '';
    }
  } else {
    // Load co-borrower data
    var cb = coBorrowers[idx - 1];
    if (cb && cb.data) {
      loadCoBorrowerData(cb);
    }
    // Update header to show co-borrower's name and populate fields
    if (cb) {
      document.getElementById('crmDName').textContent = cb.name || 'Co-Borrower';
      document.getElementById('crmDMeta').textContent = [cb.email, formatPhoneDisplay(cb.phone)].filter(Boolean).join(' – ');
      var cbData = cb.data || {};
      cbData.name = cb.name; cbData.phone = cb.phone; cbData.email = cb.email;
      populateNameFields(cbData);
      var phoneEl = document.getElementById('cf_phone');
      if(phoneEl) { phoneEl.value = cb.phone || ''; formatPhoneInput(phoneEl); }
      var emailEl = document.getElementById('cf_email');
      if(emailEl) emailEl.value = cb.email || '';
    }
  }
  renderCoBorrowerTabs();
}

function saveCoBorrowerState() {
  var data = collectAllCardData();

  // Remove top-level fields that don't belong in per-borrower data
  delete data.co_borrowers;
  delete data.shared_loan;

  if (activeCoBorrowerIdx === 0) {
    window._primaryBorrowerData = data;
    window._primaryBorrowerData.employers = JSON.parse(JSON.stringify(borrowerEmployers));
    window._primaryBorrowerData.education = JSON.parse(JSON.stringify(borrowerEducation));
    window._primaryBorrowerData.assets = JSON.parse(JSON.stringify(borrowerAssets));
    window._primaryBorrowerData.reos = JSON.parse(JSON.stringify(borrowerREOs));
    window._primaryBorrowerData.documents = cardDocuments.slice();
    // Keep primaryBorrowerName in sync
    if (data.name) primaryBorrowerName = data.name;
  } else {
    var cb = coBorrowers[activeCoBorrowerIdx - 1];
    if (cb) {
      cb.name = data.name || cb.name;
      cb.phone = data.phone || cb.phone;
      cb.email = data.email || cb.email;
      cb.data = data;
      cb.data.first_name = data.first_name;
      cb.data.middle_initial = data.middle_initial;
      cb.data.last_name = data.last_name;
      cb.data.employers = JSON.parse(JSON.stringify(borrowerEmployers));
      cb.data.education = JSON.parse(JSON.stringify(borrowerEducation));
      cb.data.assets = JSON.parse(JSON.stringify(borrowerAssets));
      cb.data.reos = JSON.parse(JSON.stringify(borrowerREOs));
      cb.data.documents = cardDocuments.slice();
    }
  }
}

function loadPrimaryBorrowerData() {
  var data = window._primaryBorrowerData || {};
  // Reset state
  borrowerEmployers = data.employers || [];
  borrowerEducation = data.education || [];
  borrowerAssets = data.assets || [];
  borrowerREOs = data.reos || [];
  cardDocuments = data.documents || [];
  activeEmpTab = 0; activeREOTab = 0; activeAssetTab = 0;
  // Repopulate fields
  populateCardFields(data);
  var fc = document.getElementById('crmCardForm');
  if (fc) { renderBorrowerCard(fc, data); }
}

function loadCoBorrowerData(cb) {
  var data = cb.data || {};
  // Reset state
  borrowerEmployers = data.employers || [newEmployer()];
  borrowerEducation = data.education || [];
  borrowerAssets = data.assets || [];
  borrowerREOs = data.reos || [];
  cardDocuments = data.documents || [];
  activeEmpTab = 0; activeREOTab = 0; activeAssetTab = 0;
  // Populate header fields
  var cbData = data || {};
  cbData.name = cb.name; cbData.phone = cb.phone; cbData.email = cb.email;
  populateNameFields(cbData);
  var phoneEl = document.getElementById('cf_phone');
  var emailEl = document.getElementById('cf_email');
  if (phoneEl) { phoneEl.value = cb.phone || ''; formatPhoneInput(phoneEl); }
  if (emailEl) emailEl.value = cb.email || '';
  // Render card body
  var fc = document.getElementById('crmCardForm');
  if (fc) { renderBorrowerCard(fc, data); }
}

function populateCardFields(data) {
  populateNameFields(data);
  var phoneEl = document.getElementById('cf_phone');
  var emailEl = document.getElementById('cf_email');
  if (phoneEl) { phoneEl.value = data.phone || ''; formatPhoneInput(phoneEl); }
  if (emailEl) emailEl.value = data.email || '';
}

// Add co-borrower modal
var _cbPhoneMatch = null; // stores the matched contact when phone duplicate found

function showAddCoBorrower() {
  _cbPhoneMatch = null;
  var ov = document.getElementById('cbAddOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'cbAddOverlay'; ov.className = 'cb-add-overlay';
    ov.innerHTML = '<div class="cb-add-modal">' +
      '<h3><i class="fas fa-user-plus"></i> Add Co-Borrower</h3>' +
      '<div class="card-fields single-col">' +
      '<div class="card-field"><label>Name</label><input type="text" id="cbAddName" placeholder="Full name"></div>' +
      '<div class="card-field"><label>Phone</label><input type="tel" id="cbAddPhone" placeholder="Phone"></div>' +
      '<div id="cbPhoneMatchBanner" class="cb-phone-match" style="display:none;"></div>' +
      '<div class="card-field"><label>Email</label><input type="email" id="cbAddEmail" placeholder="Email"></div>' +
      '<div class="card-field"><label>Relationship</label><select id="cbAddRelationship">' +
      '<option value="">-- Select --</option><option value="spouse">Spouse</option><option value="co-borrower">Co-Borrower</option>' +
      '<option value="parent">Parent</option><option value="child">Child</option>' +
      '<option value="sibling">Sibling</option><option value="domestic_partner">Domestic Partner</option>' +
      '<option value="other">Other</option></select></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px;">' +
      '<button class="card-action-btn primary" style="flex:1;" id="cbAddBtn" onclick="confirmAddCoBorrower()"><i class="fas fa-plus"></i> Add</button>' +
      '<button class="card-action-btn" style="flex:1;" onclick="closeCBAddModal()">Cancel</button>' +
      '</div></div>';
    ov.addEventListener('click', function(e) { if (e.target === ov) closeCBAddModal(); });
    document.body.appendChild(ov);

    // Wire phone blur to check for duplicates
    document.getElementById('cbAddPhone').addEventListener('blur', checkCBPhoneDuplicate);
    document.getElementById('cbAddPhone').addEventListener('input', function() {
      // Clear match banner while typing
      var banner = document.getElementById('cbPhoneMatchBanner');
      if (banner) { banner.style.display = 'none'; }
      _cbPhoneMatch = null;
      var btn = document.getElementById('cbAddBtn');
      if (btn) { btn.innerHTML = '<i class="fas fa-plus"></i> Add'; }
    });
  }
  // Clear fields
  document.getElementById('cbAddName').value = '';
  document.getElementById('cbAddPhone').value = '';
  document.getElementById('cbAddEmail').value = '';
  document.getElementById('cbAddRelationship').value = '';
  var banner = document.getElementById('cbPhoneMatchBanner');
  if (banner) banner.style.display = 'none';
  var btn = document.getElementById('cbAddBtn');
  if (btn) { btn.innerHTML = '<i class="fas fa-plus"></i> Add'; }
  ov.classList.add('show');
}

function checkCBPhoneDuplicate() {
  var phone = document.getElementById('cbAddPhone').value;
  var banner = document.getElementById('cbPhoneMatchBanner');
  if (!banner) return;
  var match = findContactByPhone(phone, crmCurrentId);
  if (match) {
    _cbPhoneMatch = match;
    var typeBadge = (ALL_TYPES[match.root_type||match.type] || CONTACT_TYPES.other);
    banner.innerHTML =
      '<div class="cb-match-info">' +
        '<i class="fas fa-exclamation-triangle"></i> ' +
        '<strong>' + (match.name || 'Unnamed') + '</strong> (' + typeBadge.label + ') already has this phone number.' +
      '</div>' +
      '<div class="cb-match-actions">' +
        '<button class="card-action-btn primary" style="padding:5px 12px;font-size:11px;" onclick="linkExistingAsCoBorrower()"><i class="fas fa-link"></i> Link Existing Contact</button>' +
        '<span style="font-size:10px;color:#888;">or continue to add new</span>' +
      '</div>';
    banner.style.display = 'block';
    // Only auto-fill name/email if user hasn't typed anything yet
    var nameEl = document.getElementById('cbAddName');
    var emailEl = document.getElementById('cbAddEmail');
    if (emailEl && !emailEl.value && match.email) emailEl.value = match.email;
    // Do NOT auto-fill name — user may have already typed the correct name
  } else {
    _cbPhoneMatch = null;
    banner.style.display = 'none';
  }
}

function linkExistingAsCoBorrower() {
  if (!_cbPhoneMatch) return;
  var match = _cbPhoneMatch;
  var rel = document.getElementById('cbAddRelationship').value;
  // Use the name from the modal field (what the user typed), not the match name
  var enteredName = document.getElementById('cbAddName').value || match.name || '';
  var enteredEmail = document.getElementById('cbAddEmail').value || match.email || '';

  // Save current state first
  saveCoBorrowerState();

  // Create co-borrower entry linked to the existing contact
  var newCB = {
    id: 'cb-' + Date.now(),
    name: enteredName, phone: match.phone || '', email: enteredEmail,
    relationship: rel, excluded: false,
    contact_id: match.id,
    data: { name: enteredName, phone: match.phone || '', email: enteredEmail,
            employers: [newEmployer()], education: [], reos: [], documents: [] }
  };
  coBorrowers.push(newCB);

  closeCBAddModal();
  _cbPhoneMatch = null;
  crmDirty = true; 

  var newIdx = coBorrowers.length;
  activeCoBorrowerIdx = newIdx;
  loadCoBorrowerData(newCB);
  document.getElementById('crmDName').textContent = enteredName || 'Co-Borrower';
  document.getElementById('crmDMeta').textContent = [enteredEmail, match.phone].filter(Boolean).join(' – ');
  renderCoBorrowerTabs();
  showToast(enteredName + ' linked as ' + rel);
}
function closeCBAddModal() { var o = document.getElementById('cbAddOverlay'); if (o) o.classList.remove('show'); }

function confirmAddCoBorrower() {
  var name = document.getElementById('cbAddName').value;
  if (!name) { showToast('Name is required'); return; }
  var phone = document.getElementById('cbAddPhone').value;
  var email = document.getElementById('cbAddEmail').value;
  var rel = document.getElementById('cbAddRelationship').value;

  // Save current state first (we're on primary at this point)
  saveCoBorrowerState();

  // Create co-borrower
  var newCB = {
    id: 'cb-' + Date.now(),
    name: name, phone: phone, email: email,
    relationship: rel, excluded: false,
    data: { name: name, phone: phone, email: email, employers: [newEmployer()], education: [], reos: [], documents: [] }
  };
  coBorrowers.push(newCB);

  closeCBAddModal();
  crmDirty = true; 

  // Switch to the new co-borrower — set index directly and load,
  // skip saveCoBorrowerState inside switchCoBorrower since we just saved above
  var newIdx = coBorrowers.length;
  activeCoBorrowerIdx = newIdx;
  loadCoBorrowerData(newCB);
  // Update header to show co-borrower's name
  document.getElementById('crmDName').textContent = name;
  document.getElementById('crmDMeta').textContent = [email, phone].filter(Boolean).join(' – ');
  renderCoBorrowerTabs();
  showToast(name + ' added as ' + rel);
}

// Context menu for co-borrower tabs (right-click or long-press)
function showCBContext(cbIdx, event) {
  // Remove any existing context menus
  document.querySelectorAll('.cb-context').forEach(function(m) { m.remove(); });
  var cb = coBorrowers[cbIdx];
  var menu = document.createElement('div');
  menu.className = 'cb-context show';
  menu.style.position = 'fixed';
  menu.style.left = event.clientX + 'px';
  menu.style.top = event.clientY + 'px';
  menu.style.zIndex = '200';
  menu.innerHTML =
    '<div class="cb-context-item" onclick="editCBRelationship(' + cbIdx + ')"><i class="fas fa-edit"></i> Change Relationship</div>' +
    '<div class="cb-context-item' + (cb.excluded ? '' : ' danger') + '" onclick="toggleCBExclude(' + cbIdx + ')">' +
    (cb.excluded ? '<i class="fas fa-check"></i> Include on Loan' : '<i class="fas fa-ban"></i> Exclude from Loan') + '</div>' +
    '<div class="cb-context-item danger" onclick="unlinkCoBorrower(' + cbIdx + ')"><i class="fas fa-unlink"></i> Remove Co-Borrower</div>';
  document.body.appendChild(menu);
  setTimeout(function() {
    var close = function(e) {
      if (!e.target.closest('.cb-context')) menu.remove();
      document.removeEventListener('click', close, true);
    };
    document.addEventListener('click', close, true);
  }, 10);
}

function toggleCBExclude(cbIdx) {
  coBorrowers[cbIdx].excluded = !coBorrowers[cbIdx].excluded;
  renderCoBorrowerTabs();
  crmDirty = true; 
  showToast(coBorrowers[cbIdx].name + (coBorrowers[cbIdx].excluded ? ' excluded from loan' : ' included on loan'));
}

function editCBRelationship(cbIdx) {
  var current = coBorrowers[cbIdx].relationship || '';
  var options = ['spouse', 'co-borrower', 'parent', 'child', 'sibling', 'domestic_partner', 'other'];
  var currentIdx = options.indexOf(current);
  var next = options[(currentIdx + 1) % options.length];
  coBorrowers[cbIdx].relationship = next;
  renderCoBorrowerTabs();
  crmDirty = true; 
  showToast('Relationship changed to ' + next);
}

function unlinkCoBorrower(cbIdx) {
  var cb = coBorrowers[cbIdx];
  if (!cb) return;
  if (!confirm('Remove ' + (cb.name || 'this co-borrower') + ' from this loan?')) return;
  
  // If co-borrower has a CRM contact, clear their linked_to field
  if (cb.contact_id) {
    fetch(CRM_API + '/crm-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clearLink', crm_id: cb.contact_id })
    }).catch(function(err) { console.error('Clear link error:', err); });
  }

  // If we're currently viewing this co-borrower, switch to primary first
  if (activeCoBorrowerIdx === cbIdx + 1) {
    activeCoBorrowerIdx = 0;
    loadPrimaryBorrowerData();
    if (window._primaryBorrowerData) {
      document.getElementById('crmDName').textContent = window._primaryBorrowerData.name || 'Unnamed';
      document.getElementById('crmDMeta').textContent = [window._primaryBorrowerData.email, formatPhoneDisplay(window._primaryBorrowerData.phone)].filter(Boolean).join(' – ');
      populateNameFields(window._primaryBorrowerData);
      var phoneEl = document.getElementById('cf_phone');
      if(phoneEl) { phoneEl.value = window._primaryBorrowerData.phone || ''; formatPhoneInput(phoneEl); }
      var emailEl = document.getElementById('cf_email');
      if(emailEl) emailEl.value = window._primaryBorrowerData.email || '';
    }
  } else if (activeCoBorrowerIdx > cbIdx + 1) {
    activeCoBorrowerIdx--;
  }
  
  var removedName = cb.name || 'Co-borrower';
  coBorrowers.splice(cbIdx, 1);
  renderCoBorrowerTabs();
  crmDirty = true;
  showToast(removedName + ' unlinked from loan');
}

// Unlink the currently active co-borrower (from the Unlink button)
function unlinkActiveCoBorrower() {
  if (activeCoBorrowerIdx < 1) return;
  unlinkCoBorrower(activeCoBorrowerIdx - 1);
}

// Create a CRM contact from a co-borrower
function createCBContact(cbIdx) {
  var cb = coBorrowers[cbIdx];
  if (!cb) return;

  // Check for duplicate phone before creating
  if (cb.phone) {
    var existing = findContactByPhone(cb.phone, crmCurrentId);
    if (existing) {
      // Show confirmation instead of silently creating
      if (!confirm(existing.name + ' already exists with this phone number.\n\nClick OK to link to the existing contact, or Cancel to create a new one anyway.')) {
        // User chose Cancel — proceed with creating new contact below
      } else {
        // User chose OK — link to existing contact
        coBorrowers[cbIdx].contact_id = existing.id;
        renderCoBorrowerTabs();
        crmDirty = true;
        
        showToast(cb.name + ' linked to existing contact ' + existing.name);
        return;
      }
    }
  }

  // Build contact data from co-borrower (don't call saveCoBorrowerState here — 
  // we don't want to overwrite stored data, just read what we need for the new contact)
  var contactData = {};
  if (cb.data) contactData = Object.assign({}, cb.data);
  contactData.name = cb.name;
  contactData.phone = cb.phone;
  contactData.email = cb.email;
  contactData.type = 'client';
  contactData.root_type = 'client';
  contactData.designations = ['borrower'];
  contactData.linked_to = crmCurrentId;
  contactData.relationship = cb.relationship;
  // Remove nested objects that shouldn't go to the API as top-level
  delete contactData.employers;
  delete contactData.education;
  delete contactData.reos;
  delete contactData.documents;

  fetch(CRM_API + '/crm-api?action=save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crm: contactData })
  })
  .then(function(r) { return r.json(); })
  .then(function(result) {
    if (result.success) {
      // Store the new contact ID on the co-borrower
      coBorrowers[cbIdx].contact_id = result.id;
      // Add to local contacts list
      contactData.id = result.id;
      contactData.created_at = new Date().toISOString();
      if (typeof crmContacts !== 'undefined') crmContacts.push(contactData);
      // Update counts
      var countEl = document.getElementById('navCrmCount');
      if (countEl) countEl.textContent = crmContacts.length;
      var dashEl = document.getElementById('dashCrm');
      if (dashEl) dashEl.textContent = crmContacts.length;
      var subEl = document.getElementById('crmSubtitle');
      if (subEl) subEl.textContent = crmContacts.length + ' contacts';
      // Re-render list and tabs
      if (typeof crmRenderList === 'function') crmRenderList();
      renderCoBorrowerTabs();
      // Auto-save primary card so the co-borrower link persists
      crmDirty = true;
      crmSaveContact();
      
      showToast('Contact created for ' + cb.name);
    } else {
      showToast('Failed to create contact');
    }
  })
  .catch(function(err) { console.error(err); showToast('Error creating contact'); });
}

// Jump to a co-borrower's CRM contact card
function viewCBContact(contactId) {
  // Save current state first
  saveCoBorrowerState();
  // Save primary's co-borrower data
  crmSaveContact();
  // Switch to the contact
  crmSelectContact(contactId);
}

function updateCombinedIncome() {
  var primaryTotal = 0;
  // Get primary's employers
  if (window._primaryBorrowerData && window._primaryBorrowerData.employers) {
    window._primaryBorrowerData.employers.forEach(function(e) { primaryTotal += (parseFloat(e.qualifying_income) || 0); });
  } else {
    borrowerEmployers.forEach(function(e) { primaryTotal += (parseFloat(e.qualifying_income) || 0); });
  }
  var combined = primaryTotal;
  coBorrowers.forEach(function(cb) {
    if (!cb.excluded && cb.data && cb.data.employers) {
      cb.data.employers.forEach(function(e) { combined += (parseFloat(e.qualifying_income) || 0); });
    }
  });
  var el = document.getElementById('cardCombinedQualifying');
  if (el) el.textContent = formatMoney(combined);
}

// ===== TYPE CHANGER =====
function showTypeChanger(){
  showTypePicker(function(newType){
    if(newType===crmCurrentType) return;
    var oldType=crmCurrentType;
    crmCurrentType=newType;
    window._currentRootType=newType;
    // Update root_type in database
    if(crmCurrentId){
      fetch(CRM_API+'/crm-api?action=save',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({crm:{id:crmCurrentId,root_type:newType,type:newType}})}).catch(function(){});
      if(typeof crmContacts!=='undefined'){
        var idx=crmContacts.findIndex(function(c){return c.id===crmCurrentId;});
        if(idx>=0) { crmContacts[idx].root_type=newType; crmContacts[idx].type=newType; }
      }
    }
    // Update badge
    var ti=CONTACT_TYPES[newType]||CONTACT_TYPES.other;
    var badgeHtml='<span class="card-type-badge" style="background:'+ti.color+'22;color:'+ti.color+';"><i class="fas '+ti.icon+'"></i> '+ti.label+'</span>';
    (window._currentDesignations||[]).forEach(function(d){
      var dt=DESIGNATION_TYPES[d];
      if(dt) badgeHtml+=' <span class="card-desig-badge" style="background:'+dt.color+'18;color:'+dt.color+';border:1px solid '+dt.color+'33;"><i class="fas '+dt.icon+'"></i> '+dt.label+'</span>';
    });
    document.getElementById('crmDTypeBadge').innerHTML=badgeHtml;
    // Qualifying total visibility
    var qt=document.getElementById('cardQualifyingWrap');if(qt)qt.style.display=(hasDesignation({designations:window._currentDesignations},'borrower')?'block':'none');
    // Re-render form
    var fc=document.getElementById('crmCardForm');
    var currentData=collectAllCardData();
    currentData.type=newType;
    currentData.root_type=newType;
    currentData.designations=window._currentDesignations||[];
    var bl=isBorrowerLike(currentData);
    if(bl){
      if(oldType!=='borrower'&&oldType!=='past_client'&&!isBorrowerLike({type:oldType,designations:window._currentDesignations||[]})){
        borrowerEmployers=[];borrowerEducation=[];borrowerAssets=[];borrowerREOs=[];
        coBorrowers=[];activeCoBorrowerIdx=0;sharedLoanData={};
        window._primaryBorrowerData=null;primaryBorrowerName=currentData.name||'';
      }
      renderBorrowerCard(fc,currentData);
      renderCoBorrowerTabs();
    } else {
      var cbTabs=document.getElementById('coBorrowerTabs');
      if(cbTabs)cbTabs.style.display='none';
      var secs=getFieldsForType(newType,window._currentDesignations);
      renderStandardForm(fc,secs,currentData);
    }
    if(typeof crmRenderList==='function') crmRenderList();
    crmDirty=true;
    showToast('Changed to '+ti.label);
  });
}

// ===== DOCUMENT SYSTEM =====
function handleDocUpload(input){
  if(!input.files||!input.files.length)return;
  Array.from(input.files).forEach(function(file){
    if(file.size>10*1024*1024){showToast('File too large: '+file.name);return;}
    var reader=new FileReader();
    reader.onload=function(e){addDocumentToCard(file.name,file.type,new Date().toISOString(),e.target.result);};
    reader.readAsDataURL(file);
  });
  input.value='';
}
function addDocumentToCard(name,type,date,dataUrl){
  cardDocuments.push({name:name,type:type,date:date,data:dataUrl||null,id:'doc-'+Date.now()});
  renderDocList();crmDirty=true;
}
function removeDocument(docId){
  cardDocuments=cardDocuments.filter(function(d){return d.id!==docId;});
  renderDocList();crmDirty=true;
}
function renderDocList(){
  var list=document.getElementById('docList');if(!list)return;
  if(cardDocuments.length===0){list.innerHTML='<div style="color:#999;font-size:12px;padding:8px 0;">No documents yet</div>';return;}
  var h='';
  cardDocuments.forEach(function(d){
    var icon='fa-file';if(d.type&&d.type.includes('pdf'))icon='fa-file-pdf';
    else if(d.type==='income_calc')icon='fa-calculator';else if(d.type&&d.type.includes('image'))icon='fa-file-image';
    h+='<div class="doc-item"><div class="doc-item-icon"><i class="fas '+icon+'"></i></div>';
    h+='<div class="doc-item-info"><div class="doc-item-name">'+d.name+'</div><div class="doc-item-date">'+new Date(d.date).toLocaleDateString()+'</div></div>';
    h+='<div class="doc-item-actions">';
    if(d.data)h+='<a class="doc-item-btn" href="'+d.data+'" download="'+d.name+'"><i class="fas fa-download"></i></a>';
    h+='<button class="doc-item-btn" onclick="removeDocument(\''+d.id+'\')"><i class="fas fa-times"></i></button></div></div>';
  });
  list.innerHTML=h;
}

// ===== COLLECT ALL DATA =====
function collectAllCardData(){
  var data={};
  document.querySelectorAll('.card-tracked').forEach(function(el){
    var id=el.id.replace('cf_','');data[id]=el.value||null;
  });
  // Build composite name from split fields + store individual parts
  data.first_name = data.first_name || '';
  data.middle_initial = data.middle_initial ? data.middle_initial.toUpperCase() : '';
  data.last_name = data.last_name || '';
  data.name = buildDisplayName();
  // Clean phone to raw digits for storage, keep formatted for display
  if(data.phone) data.phone = data.phone.replace(/\D/g,'');
  data.root_type = window._currentRootType || crmCurrentType;
  data.designations = window._currentDesignations || [];
  if(isBorrowerLike({designations:data.designations,type:crmCurrentType})){
    data.employers=borrowerEmployers;
    data.education=borrowerEducation;
    data.assets=borrowerAssets;
    data.reos=borrowerREOs;
    data.documents=cardDocuments;
    // NOTE: co_borrowers and shared_loan are NOT included here.
    // They are added at the top level in crmSaveContact only.
  }
  return data;
}

// ===== CRM INTEGRATION =====
var crmCurrentType='client';

function crmAddNew(){
  crmCurrentId=null;crmDirty=false;
  borrowerEmployers=[];borrowerEducation=[];borrowerAssets=[];borrowerREOs=[];cardDocuments=[];
  coBorrowers=[];activeCoBorrowerIdx=0;sharedLoanData={};window._primaryBorrowerData=null;primaryBorrowerName='';
  window._currentDesignations=[];window._currentRootType='client';
  var bannerPre=document.getElementById('crmLoanHistoryBanner');
  if(bannerPre){bannerPre.style.display='none';bannerPre.innerHTML='';}
  var cbTabsPre=document.getElementById('coBorrowerTabs');
  if(cbTabsPre){cbTabsPre.style.display='none';cbTabsPre.innerHTML='';}
  if(typeof crmRenderList==='function') crmRenderList();

  showTypePicker(function(type){
    crmCurrentType=type;
    window._currentRootType=type;
    document.getElementById('crmDetailEmpty').style.display='none';
    document.getElementById('crmDetailContent').style.display='flex';
    var newBtn=document.getElementById('crmNewContactBtn');if(newBtn)newBtn.style.display='none';
    var ti=CONTACT_TYPES[type]||CONTACT_TYPES.other;
    document.getElementById('crmDName').textContent='New '+ti.label;
    document.getElementById('crmDMeta').textContent='';
    document.getElementById('crmDTypeBadge').innerHTML='<span class="card-type-badge" style="background:'+ti.color+'22;color:'+ti.color+';"><i class="fas '+ti.icon+'"></i> '+ti.label+'</span>';
    document.getElementById('cardPipelineBtn').innerHTML='';
    var qt=document.getElementById('cardQualifyingWrap');if(qt)qt.style.display='none';
    var fc=document.getElementById('crmCardForm');
    var cbTabs=document.getElementById('coBorrowerTabs');
    if(cbTabs) cbTabs.style.display='none';
    var secs=getFieldsForType(type,[]);renderStandardForm(fc,secs,{});
    var firstEl=document.getElementById('cf_first_name');if(firstEl)firstEl.value='';
    var miEl=document.getElementById('cf_middle_initial');if(miEl)miEl.value='';
    var lastEl=document.getElementById('cf_last_name');if(lastEl)lastEl.value='';
    var phoneEl=document.getElementById('cf_phone');if(phoneEl)phoneEl.value='';
    var emailEl=document.getElementById('cf_email');if(emailEl)emailEl.value='';
    wireHeaderFields();
    crmSwitchTab('details');
  });
}

function crmSelectContact(id){
  crmCurrentId=id;crmDirty=false;
  borrowerEmployers=[];borrowerEducation=[];borrowerAssets=[];borrowerREOs=[];cardDocuments=[];
  coBorrowers=[];activeCoBorrowerIdx=0;sharedLoanData={};window._primaryBorrowerData=null;primaryBorrowerName='';
  
  
  
  document.getElementById('crmDetailEmpty').style.display='none';
  document.getElementById('crmDetailContent').style.display='flex';
  // Hide New Contact button while card is open
  var newBtn=document.getElementById('crmNewContactBtn');if(newBtn)newBtn.style.display='none';
  crmRenderList();
  fetch(CRM_API+'/crm-api?action=get&id='+id)
    .then(function(r){return r.json();})
    .then(function(data){
      if(data.success!==false){
        var c=data.contact||data;
        crmCurrentType=getEffectiveType(c);
        crmPopulateCard(c,data.activity||[]);
      }
    }).catch(function(err){console.error('CRM get error:',err);});
}

function crmPopulateCard(c,activity){
  var rootType=getEffectiveType(c);
  var ti=CONTACT_TYPES[rootType]||CONTACT_TYPES.other;
  var bl=isBorrowerLike(c);
  // Store designations on current card context
  window._currentDesignations=c.designations||[];
  window._currentRootType=rootType;

  document.getElementById('crmDName').textContent=c.name||'Unnamed';
  var metaParts=[c.email,formatPhoneDisplay(c.phone),c.company].filter(Boolean);
  if(c.ae_id)metaParts.push(c.ae_id);
  document.getElementById('crmDMeta').textContent=metaParts.join(' \u2013 ');

  // Build badge HTML: root type + designation badges
  var badgeHtml='<span class="card-type-badge" style="background:'+ti.color+'22;color:'+ti.color+';"><i class="fas '+ti.icon+'"></i> '+ti.label+'</span>';
  (c.designations||[]).forEach(function(d){
    var dt=DESIGNATION_TYPES[d];
    if(dt) badgeHtml+=' <span class="card-desig-badge" style="background:'+dt.color+'18;color:'+dt.color+';border:1px solid '+dt.color+'33;"><i class="fas '+dt.icon+'"></i> '+dt.label+'</span>';
  });
  document.getElementById('crmDTypeBadge').innerHTML=badgeHtml;

  // Show qualifying income for active borrowers
  var qt=document.getElementById('cardQualifyingWrap');if(qt)qt.style.display=(hasDesignation(c,'borrower')?'block':'none');
  // Co-borrower tabs — show for borrower-like contacts
  var cbTabs=document.getElementById('coBorrowerTabs');
  if(cbTabs) cbTabs.style.display=(bl?'flex':'none');
  if(bl){
    initCoBorrowers(c);
    window._primaryBorrowerData=Object.assign({},c);
    if(c.employers) window._primaryBorrowerData.employers=JSON.parse(JSON.stringify(c.employers));
    if(c.education) window._primaryBorrowerData.education=JSON.parse(JSON.stringify(c.education));
    if(c.assets) window._primaryBorrowerData.assets=JSON.parse(JSON.stringify(c.assets));
    if(c.reos) window._primaryBorrowerData.reos=JSON.parse(JSON.stringify(c.reos));
    if(c.documents) window._primaryBorrowerData.documents=(c.documents||[]).slice();
  }
  // Pipeline button
  var pBtn=document.getElementById('cardPipelineBtn');
  var fs=null;
  if(typeof pipelineLoans!=='undefined'&&typeof pipelineBorrowers!=='undefined'){
    var myLoanLink=pipelineBorrowers.find(function(b){return b.crm_contact_id===c.id;});
    if(myLoanLink){
      var myLoan=pipelineLoans.find(function(l){return l.ae_id===myLoanLink.ae_id;});
      if(myLoan) fs=myLoan.pipeline_stage;
    }
  }
  renderPipelineButton(pBtn,c.id,fs);
  // Active Loan Relationships banner
  var banner=document.getElementById('crmLoanHistoryBanner');
  if(banner){banner.style.display='none';banner.innerHTML='';}
  fetchActiveLoanRelationships(c.id);
  // Form — borrower-like contacts use borrower card
  var fc=document.getElementById('crmCardForm');
  if(bl){renderBorrowerCard(fc,c);}
  else{var secs=getFieldsForType(rootType,c.designations);renderStandardForm(fc,secs,c);}
  if(bl) renderCoBorrowerTabs();
  // Populate header fields
  populateNameFields(c);
  var phoneEl=document.getElementById('cf_phone');
  if(phoneEl) { phoneEl.value=c.phone||''; formatPhoneInput(phoneEl); }
  var emailEl=document.getElementById('cf_email');if(emailEl)emailEl.value=c.email||'';
  wireHeaderFields();
  renderActivity(activity);
  crmDirty=false;
  crmSwitchTab('details');
}

function renderActivity(activity){
  var tl=document.getElementById('crmActivityTimeline');if(!tl)return;
  if(activity&&activity.length>0){
    var icons={email_sent:'fa-paper-plane',email_received:'fa-inbox',call:'fa-phone',note:'fa-sticky-note',meeting:'fa-handshake',text:'fa-comment'};
    var h='';activity.forEach(function(a){
      h+='<div class="activity-item"><div class="activity-icon"><i class="fas '+(icons[a.type]||'fa-sticky-note')+'"></i></div><div><div class="activity-text">'+(a.subject||a.body||a.type)+'</div><div class="activity-date">'+(a.type||'')+' - '+new Date(a.date).toLocaleDateString()+'</div></div></div>';
    });tl.innerHTML=h;
  } else {tl.innerHTML='<div style="color:#999;font-size:12px;padding:12px;">No activity yet</div>';}
}

function crmSwitchTab(tab){
  document.querySelectorAll('.card-tab[data-tab]').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.crm-tab-content').forEach(function(t){t.classList.remove('active');});
  var tabEl=document.querySelector('.card-tab[data-tab="'+tab+'"]');
  var contentEl=document.getElementById('crmTab_'+tab);
  if(tabEl)tabEl.classList.add('active');
  if(contentEl)contentEl.classList.add('active');
}

var crmSaving = false;
function crmSaveContact(){
  if (crmSaving) { console.log('Save already in progress, skipping'); return; }
  crmSaving = true;

  // Capture state at call time to prevent race conditions when user switches contacts
  var saveId = crmCurrentId;
  var saveType = crmCurrentType;
  var saveDesignations = window._currentDesignations || [];
  var saveBorrowerLike = isBorrowerLike({designations:saveDesignations,type:saveType});
  var saveCoBorrowerIdx = activeCoBorrowerIdx;
  var savePrimaryName = primaryBorrowerName;

  console.log('=== SAVE CONTACT START ===');
  console.log('saveId:', saveId);
  console.log('saveType:', saveType);
  console.log('saveDesignations:', saveDesignations);
  console.log('activeCoBorrowerIdx:', saveCoBorrowerIdx);
  console.log('coBorrowers count:', coBorrowers.length);

  // Step 1: Save current co-borrower state into memory
  if(saveBorrowerLike && coBorrowers.length>0) {
    console.log('Saving co-borrower state...');
    saveCoBorrowerState();
  }

  // Step 2: Build the data object — always use primary borrower as the contact record
  var data = {};
  if(saveBorrowerLike && saveCoBorrowerIdx > 0 && window._primaryBorrowerData) {
    console.log('On co-borrower tab, using _primaryBorrowerData');
    data = JSON.parse(JSON.stringify(window._primaryBorrowerData));
  } else {
    console.log('On primary/standard tab, collecting from DOM');
    data = collectAllCardData();
  }

  // Step 3: Always attach co-borrower and shared loan data for borrower-like contacts
  if(saveBorrowerLike) {
    data.co_borrowers = JSON.parse(JSON.stringify(coBorrowers));
    data.shared_loan = JSON.parse(JSON.stringify(sharedLoanData));
  }

  data.type = saveType;
  data.root_type = window._currentRootType || saveType;
  data.designations = saveDesignations;
  // Debug: log assets state at save time
  console.log('=== ASSET DEBUG ===');
  console.log('borrowerAssets:', JSON.stringify(borrowerAssets));
  console.log('data.assets:', JSON.stringify(data.assets));
  console.log('crmCurrentType:', crmCurrentType);
  // Ensure composite name is built from parts
  if(!data.name) data.name = [data.first_name, data.middle_initial ? data.middle_initial + '.' : '', data.last_name].filter(Boolean).join(' ');
  console.log('Data name:', data.name);
  console.log('Data keys:', Object.keys(data).join(', '));

  if(!data.name || !data.name.trim()){
    showToast('First or Last name is required');
    console.log('ABORT: No name');
    crmSaving = false;
    return;
  }

  if(saveId) data.id = saveId;

  var payload = JSON.stringify({crm: data});
  console.log('Payload size:', payload.length, 'bytes');
  console.log('Sending to:', CRM_API + '/crm-api?action=save');

  // Step 4: Send to API
  fetch(CRM_API + '/crm-api?action=save', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: payload
  })
  .then(function(r){
    console.log('Response status:', r.status);
    return r.json();
  })
  .then(function(result){
    console.log('Response body:', JSON.stringify(result));
    if(result.success){
      if(saveId){
        // Update local array using the captured ID, not the current one
        var idx = crmContacts.findIndex(function(c){return c.id === saveId;});
        if(idx >= 0) crmContacts[idx] = Object.assign(crmContacts[idx], data);
        showToast('Saved!');
      } else {
        data.id = result.id;
        data.created_at = new Date().toISOString();
        crmContacts.push(data);
        // Only update crmCurrentId if user is still on this (new) card
        if(!crmCurrentId) crmCurrentId = result.id;
        showToast('Contact created!');
      }
      crmRenderList();
      // Only update header if user is still on the same card
      if(crmCurrentId === saveId || crmCurrentId === result.id) {
        if(saveBorrowerLike && saveCoBorrowerIdx > 0) {
          document.getElementById('crmDName').textContent = savePrimaryName || data.name || 'Unnamed';
        } else {
          document.getElementById('crmDName').textContent = data.name || 'Unnamed';
        }
        crmDirty = false;
      }
      var navCount = document.getElementById('navCrmCount');
      if (navCount) navCount.textContent = crmContacts.length;
      var dashCount = document.getElementById('dashCrm');
      if (dashCount) dashCount.textContent = crmContacts.length;
      var subTitle = document.getElementById('crmSubtitle');
      if (subTitle) subTitle.textContent = crmContacts.length + ' contacts';
      console.log('=== SAVE SUCCESS ===');
      crmSaving = false;
    } else {
      showToast('Save failed: ' + (result.message || ''));
      console.log('=== SAVE FAILED ===', result);
      crmSaving = false;
    }
  })
  .catch(function(err){
    showToast('Save error — check console');
    console.error('=== SAVE ERROR ===', err);
    crmSaving = false;
  });
}
