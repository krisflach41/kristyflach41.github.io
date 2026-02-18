/* ===================================================
   CRM CARDS - Contact Card System for Mission Control
   Type-adaptive, hybrid layout, multi-employer, side panel calc
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
  { id: 'warm', label: 'Warm Leads' }, { id: 'active', label: 'Active Conversations' },
  { id: 'credit', label: 'Credit Repair' }, { id: 'preapproval', label: 'Started Pre-Approval' },
  { id: 'preapproved', label: 'Approved' }, { id: 'ratewatch', label: 'Rate Watch' },
  { id: 'underwriting', label: 'Underwriting' }, { id: 'closed', label: 'Closed - Funded' }
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
function getFieldsForType(type) {
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
        {section:'Contact Info',fields:contactFields},
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
    case 'borrower':
      return 'borrower'; // handled by renderBorrowerCard
    case 'realtor':
      return [
        {section:'Contact Info',fields:contactFields},
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
        {section:'Contact Info',fields:contactFields},
        {section:'Company',fields:[{id:'company',label:'Company Name',type:'text'}]},
        {section:'Address',fields:addressFields},
        {section:'Web',fields:[{id:'website',label:'Website',type:'text'}]},
        {section:'Tags & Notes',fields:noteFields}
      ];
    default:
      return [
        {section:'Contact Info',fields:contactFields},
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
    var dirty=function(){crmDirty=true;var s=document.getElementById('crmSaveBtn');if(s)s.disabled=false;};
    el.addEventListener('input',dirty);el.addEventListener('change',dirty);
  });
}

// ===== BORROWER STATE =====
var borrowerEmployers = [];
var borrowerEducation = [];
var activeEmpTab = 0;
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

function formatMoney(a){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(a||0);
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
  cardDocuments=data.documents||[];
  activeEmpTab=0;

  var html='';
  // 4 main tabs
  html+='<div class="card-tabs" id="borrowerMainTabs">';
  html+='<div class="card-tab active" data-btab="personal" onclick="switchBorrowerTab(\'personal\')">Personal</div>';
  html+='<div class="card-tab" data-btab="employment" onclick="switchBorrowerTab(\'employment\')">Employment</div>';
  html+='<div class="card-tab" data-btab="loan" onclick="switchBorrowerTab(\'loan\')">Loan</div>';
  html+='<div class="card-tab" data-btab="documents" onclick="switchBorrowerTab(\'documents\')">Documents</div>';
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

  // LOAN TAB
  html+='<div class="card-tab-content" id="btab_loan">';
  html+=bldSec('Loan Details',[
    {id:'loan_type',l:'Loan Type',t:'select',v:data.loan_type,opts:[
      {value:'',label:'--'},{value:'purchase',label:'Purchase'},{value:'refinance',label:'Refinance'},
      {value:'cashout',label:'Cash-Out Refi'},{value:'fha',label:'FHA'},
      {value:'va',label:'VA'},{value:'usda',label:'USDA'},{value:'jumbo',label:'Jumbo'}]},
    {id:'interest_rate',l:'Interest Rate (%)',t:'number',v:data.interest_rate,ph:'0.000'},
    {id:'lock_status',l:'Lock Status',t:'select',v:data.lock_status,opts:[
      {value:'',label:'--'},{value:'unlocked',label:'Unlocked'},{value:'locked',label:'Locked'},{value:'expired',label:'Expired'}]},
    {id:'subject_address',l:'Subject Property',t:'text',v:data.subject_address,fw:true}
  ]);
  html+=bldSec('Key Dates',[
    {id:'date_mutual',l:'Mutual Acceptance',t:'date',v:data.date_mutual},
    {id:'date_emd',l:'EMD Due',t:'date',v:data.date_emd},
    {id:'date_appraisal',l:'Appraisal',t:'date',v:data.date_appraisal},
    {id:'date_inspection',l:'Inspection',t:'date',v:data.date_inspection},
    {id:'date_conditional',l:'Conditional Approval',t:'date',v:data.date_conditional},
    {id:'date_final_approval',l:'Final Approval',t:'date',v:data.date_final_approval},
    {id:'date_closing',l:'Closing',t:'date',v:data.date_closing}
  ]);
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

  container.innerHTML=html;
  wireTracking(container);
  renderEmpTabs();
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
    var h=function(){syncEmpField(el);crmDirty=true;var s=document.getElementById('crmSaveBtn');if(s)s.disabled=false;};
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
  } else if(empIdx!==undefined&&empIdx!==''){
    var i=parseInt(empIdx); if(borrowerEmployers[i]) borrowerEmployers[i][key]=val;
  }
  // Debounce tab refresh for name/date changes
  clearTimeout(window._empRefresh);
  window._empRefresh=setTimeout(function(){renderEmpTabs();},500);
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

// ===== BORROWER MAIN TAB SWITCHER =====
function switchBorrowerTab(tab){
  document.querySelectorAll('#borrowerMainTabs .card-tab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('[id^="btab_"]').forEach(function(t){t.classList.remove('active');});
  var tabEl=document.querySelector('[data-btab="'+tab+'"]');
  var contentEl=document.getElementById('btab_'+tab);
  if(tabEl)tabEl.classList.add('active');
  if(contentEl)contentEl.classList.add('active');
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
  var dd=document.getElementById('pipelineDropdown');if(dd)dd.classList.toggle('show');
  setTimeout(function(){var c=function(e){if(!e.target.closest('.pipeline-action')){dd.classList.remove('show');document.removeEventListener('click',c);}};document.addEventListener('click',c);},10);
}

function setPipelineStage(contactId,stage){
  var pid='crm-'+contactId;
  var n=document.getElementById('cf_name'),p=document.getElementById('cf_phone'),e=document.getElementById('cf_email');
  fetch(CRM_API+'/pipeline-api',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'save',id:pid,name:n?n.value:'',phone:p?p.value:'',email:e?e.value:'',stage:stage,source:'crm',realtorName:'',loanType:'',interestRate:'',subjectAddress:'',dates:{},borrowers:[]})
  }).then(function(){
    var dd=document.getElementById('pipelineDropdown');if(dd)dd.classList.remove('show');
    var btn=document.getElementById('cardPipelineBtn');if(btn)renderPipelineButton(btn,contactId,stage);
    showToast((n?n.value:'Contact')+' moved to pipeline');
    if(typeof loadPipeline==='function')loadPipeline();
    // Auto-convert to borrower
    if(crmCurrentType!=='borrower'){
      crmCurrentType='borrower';
      fetch(CRM_API+'/crm-api?action=save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({crm:{id:contactId,type:'borrower'}})}).catch(function(){});
      if(typeof crmContacts!=='undefined'){var idx=crmContacts.findIndex(function(c){return c.id===contactId;});if(idx>=0)crmContacts[idx].type='borrower';}
      var ti=CONTACT_TYPES.borrower;
      document.getElementById('crmDTypeBadge').innerHTML='<span class="card-type-badge" style="background:'+ti.color+'22;color:'+ti.color+';"><i class="fas '+ti.icon+'"></i> '+ti.label+'</span>';
      var qt=document.getElementById('cardQualifyingWrap');if(qt)qt.style.display='block';
      var fc=document.getElementById('crmCardForm');
      var cd=collectAllCardData();cd.type='borrower';
      renderBorrowerCard(fc,cd);
      if(typeof crmRenderList==='function')crmRenderList();
      showToast('Converted to Borrower');
    }
  }).catch(function(err){console.error('Pipeline error:',err);});
}

function removePipelineStage(contactId){
  fetch(CRM_API+'/pipeline-api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',contactId:'crm-'+contactId})
  }).then(function(){
    var dd=document.getElementById('pipelineDropdown');if(dd)dd.classList.remove('show');
    var btn=document.getElementById('cardPipelineBtn');if(btn)renderPipelineButton(btn,contactId,null);
    showToast('Removed from pipeline');if(typeof loadPipeline==='function')loadPipeline();
  }).catch(function(err){console.error(err);});
}

// ===== INCOME CALCULATOR SIDE PANEL =====
var calcPanelEmpIdx = 0;
var calcSourceIncluded = {hourly:true,salary:true,ot:true,commission:true,se:true,nontax:true,other:true};

function openCalcPanel(empIdx){
  calcPanelEmpIdx=empIdx;
  var ov=document.getElementById('calcSideOverlay');
  if(!ov){buildCalcSidePanel();ov=document.getElementById('calcSideOverlay');}
  var emp=borrowerEmployers[empIdx];
  document.getElementById('calcSideTitle').textContent='Income Calculator - '+(emp.employer_name||'Employer '+(empIdx+1));
  // Reset fields
  ov.querySelectorAll('input[type="number"]').forEach(function(el){el.value='';});
  // Reset includes
  calcSourceIncluded={hourly:true,salary:true,ot:true,commission:true,se:true,nontax:true,other:true};
  ov.querySelectorAll('.calc-source-toggle').forEach(function(t){t.classList.add('on');});
  ov.querySelectorAll('.calc-source').forEach(function(s){s.classList.add('expanded');});
  // Reset ownership default
  var ownEl=document.getElementById('cs_se_ownership');if(ownEl)ownEl.value='100';
  ov.classList.add('open');
  calcAllSources();
}
function closeCalcPanel(){var o=document.getElementById('calcSideOverlay');if(o)o.classList.remove('open');}

function buildCalcSidePanel(){
  var ov=document.createElement('div');ov.id='calcSideOverlay';ov.className='calc-side-overlay';
  ov.innerHTML='<div class="calc-side-panel">'+
    '<div class="calc-side-header"><div class="calc-side-title" id="calcSideTitle">Income Calculator</div>'+
    '<button class="calc-side-close" onclick="closeCalcPanel()"><i class="fas fa-times"></i></button></div>'+
    '<div class="calc-side-body" id="calcSideBody">'+buildCalcSources()+'</div>'+
    '<div class="calc-side-footer">'+
    '<button class="card-action-btn primary" onclick="saveCalcToEmployer()"><i class="fas fa-save"></i> Save to Card</button>'+
    '<button class="card-action-btn" onclick="exportCalcPDF()"><i class="fas fa-file-pdf"></i> Export PDF</button>'+
    '<button class="card-action-btn" onclick="exportCalcToDoc()"><i class="fas fa-folder-plus"></i> Save to Docs</button>'+
    '</div></div>';
  ov.addEventListener('click',function(e){if(e.target===ov)closeCalcPanel();});
  document.body.appendChild(ov);
}

function buildCalcSources(){
  var sources=[
    {id:'hourly',title:'Hourly Income',fields:[
      {id:'cs_hourly_rate',l:'Hourly Rate ($/hr)'},{id:'cs_hourly_hours',l:'Hours/Week'}]},
    {id:'salary',title:'Salary',fields:[
      {id:'cs_salary_amount',l:'Amount'},
      {id:'cs_salary_type',l:'Pay Period',t:'select',opts:[
        {value:'monthly',label:'Monthly'},{value:'biweekly',label:'Bi-Weekly'},
        {value:'semimonthly',label:'Semi-Monthly'},{value:'weekly',label:'Weekly'}]}]},
    {id:'ot',title:'Overtime / Bonus',fields:[
      {id:'cs_ot_ytd',l:'YTD Amount'},{id:'cs_ot_months',l:'YTD Months'},
      {id:'cs_ot_year1',l:'Prior Year Total'},{id:'cs_ot_year2',l:'Year Before Total'}]},
    {id:'commission',title:'Commission (net of expenses)',fields:[
      {id:'cs_comm_ytd',l:'YTD Gross'},{id:'cs_comm_exp',l:'YTD Expenses'},
      {id:'cs_comm_months',l:'YTD Months'},{id:'cs_comm_year1',l:'Prior Year Net'},
      {id:'cs_comm_year2',l:'Year Before Net'}]},
    {id:'se',title:'Self-Employment',fields:[
      {id:'cs_se_y1_net',l:'Year 1 Net Profit'},{id:'cs_se_y1_addbacks',l:'Year 1 Add-Backs'},
      {id:'cs_se_y2_net',l:'Year 2 Net Profit'},{id:'cs_se_y2_addbacks',l:'Year 2 Add-Backs'},
      {id:'cs_se_ownership',l:'Ownership %',def:'100'}]},
    {id:'nontax',title:'Non-Taxable (SSI, disability) - 125% gross-up',fields:[
      {id:'cs_nontax_monthly',l:'Monthly Amount'}]},
    {id:'other',title:'Other Income',fields:[
      {id:'cs_other_monthly',l:'Monthly Amount'}]}
  ];

  var h='';
  sources.forEach(function(src){
    h+='<div class="calc-source" id="calcSrc_'+src.id+'" data-source="'+src.id+'">';
    h+='<div class="calc-source-header">';
    h+='<div class="calc-source-left" onclick="toggleCalcExpand(\''+src.id+'\')">';
    h+='<div class="calc-source-title">'+src.title+'</div>';
    h+='<div class="calc-source-total" id="calcTotal_'+src.id+'">$0.00</div></div>';
    h+='<button class="calc-source-toggle on" id="calcToggle_'+src.id+'" onclick="toggleCalcInclude(\''+src.id+'\')"></button>';
    h+='</div><div class="calc-source-body"><div class="calc-source-fields">';
    src.fields.forEach(function(f){
      h+='<div class="card-field"><label>'+f.l+'</label>';
      if(f.t==='select'){
        h+='<select id="'+f.id+'" onchange="calcAllSources()">';
        f.opts.forEach(function(o){h+='<option value="'+o.value+'">'+o.label+'</option>';});
        h+='</select>';
      } else {
        h+='<input type="number" id="'+f.id+'" step="0.01" min="0" placeholder="0.00" oninput="calcAllSources()"';
        if(f.def)h+=' value="'+f.def+'"';
        h+='>';
      }
      h+='</div>';
    });
    h+='</div></div></div>';
  });
  h+='<div class="calc-total-bar"><span class="calc-total-label">Total Monthly Qualifying Income</span><span class="calc-total-value" id="calcGrandTotal">$0.00</span></div>';
  return h;
}

function toggleCalcExpand(srcId){var el=document.getElementById('calcSrc_'+srcId);if(el)el.classList.toggle('expanded');}
function toggleCalcInclude(srcId){
  calcSourceIncluded[srcId]=!calcSourceIncluded[srcId];
  var btn=document.getElementById('calcToggle_'+srcId);
  if(btn)btn.classList.toggle('on',calcSourceIncluded[srcId]);
  calcAllSources();
}

function cv(id){var el=document.getElementById(id);return el?(parseFloat(el.value)||0):0;}
function lowestAvg(ytd,months,y1,y2){
  var a=[];
  if(months>0)a.push(ytd/months);
  if(months>0&&y1>0)a.push((ytd+y1)/(months+12));
  if(months>0&&y1>0&&y2>0)a.push((ytd+y1+y2)/(months+24));
  return a.length>0?Math.min.apply(null,a):0;
}

function calcAllSources(){
  var r={};
  // Hourly
  r.hourly=(cv('cs_hourly_rate')*cv('cs_hourly_hours')*52)/12;
  // Salary
  var sa=cv('cs_salary_amount'),stEl=document.getElementById('cs_salary_type'),st=stEl?stEl.value:'monthly';
  if(st==='monthly')r.salary=sa;else if(st==='biweekly')r.salary=sa*26/12;
  else if(st==='semimonthly')r.salary=sa*24/12;else r.salary=sa*52/12;
  // OT
  r.ot=lowestAvg(cv('cs_ot_ytd'),cv('cs_ot_months'),cv('cs_ot_year1'),cv('cs_ot_year2'));
  // Commission
  r.commission=lowestAvg(cv('cs_comm_ytd')-cv('cs_comm_exp'),cv('cs_comm_months'),cv('cs_comm_year1'),cv('cs_comm_year2'));
  // SE
  var own=cv('cs_se_ownership')||100;
  var se1=(cv('cs_se_y1_net')+cv('cs_se_y1_addbacks'))*(own/100);
  var se2=(cv('cs_se_y2_net')+cv('cs_se_y2_addbacks'))*(own/100);
  var seR=se1/12,seA=(se1+se2)/24;
  r.se=(se1>0&&se2>0)?Math.min(seR,seA):seR;
  // Non-taxable
  r.nontax=cv('cs_nontax_monthly')*1.25;
  // Other
  r.other=cv('cs_other_monthly');

  var grand=0;
  Object.keys(r).forEach(function(k){
    var el=document.getElementById('calcTotal_'+k);if(el)el.textContent=formatMoney(r[k]);
    if(calcSourceIncluded[k])grand+=r[k];
  });
  var gt=document.getElementById('calcGrandTotal');if(gt)gt.textContent=formatMoney(grand);
}

function saveCalcToEmployer(){
  var gt=document.getElementById('calcGrandTotal');if(!gt)return;
  var amt=parseFloat(gt.textContent.replace(/[^0-9.]/g,''))||0;
  borrowerEmployers[calcPanelEmpIdx].qualifying_income=amt;
  renderEmpTabs();updateTotalQualifying();
  crmDirty=true;var s=document.getElementById('crmSaveBtn');if(s)s.disabled=false;
  showToast('Income saved: '+formatMoney(amt));
  closeCalcPanel();
}

function exportCalcPDF(){
  var emp=borrowerEmployers[calcPanelEmpIdx];
  var name=document.getElementById('cf_name')?document.getElementById('cf_name').value:'Borrower';
  var total=document.getElementById('calcGrandTotal').textContent;
  var w=window.open('','_blank','width=700,height=900');
  w.document.write('<html><head><title>Income - '+name+'</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#0b1f3a;}h1{font-size:22px;}.meta{color:#666;margin-bottom:20px;font-size:13px;}.line{padding:8px 0;border-bottom:1px solid #eee;font-size:14px;}.total{font-size:20px;font-weight:700;margin-top:20px;padding:16px;background:#f0f7ff;border-radius:8px;}.disc{font-size:11px;color:#999;margin-top:30px;font-style:italic;}</style></head><body>');
  w.document.write('<h1>Income Calculation</h1><div class="meta">Borrower: '+name+' | Employer: '+(emp.employer_name||'N/A')+' | Date: '+new Date().toLocaleDateString()+'</div>');
  var labels={hourly:'Hourly',salary:'Salary',ot:'OT/Bonus',commission:'Commission',se:'Self-Employment',nontax:'Non-Taxable (125%)',other:'Other'};
  Object.keys(labels).forEach(function(k){
    var el=document.getElementById('calcTotal_'+k);
    if(el&&el.textContent!=='$0.00'&&calcSourceIncluded[k])
      w.document.write('<div class="line">'+labels[k]+': <strong>'+el.textContent+'</strong>'+(calcSourceIncluded[k]?'':' (excluded)')+'</div>');
  });
  w.document.write('<div class="total">Total Monthly Qualifying: '+total+'</div>');
  w.document.write('<div class="disc">For informational purposes only. Not a substitute for underwriter review.</div></body></html>');
  w.document.close();w.focus();w.print();
}

function exportCalcToDoc(){
  var emp=borrowerEmployers[calcPanelEmpIdx];
  var name=document.getElementById('cf_name')?document.getElementById('cf_name').value:'Borrower';
  var total=document.getElementById('calcGrandTotal').textContent;
  addDocumentToCard('Income Calc - '+(emp.employer_name||'Employer')+' - '+name+' - '+total,'income_calc',new Date().toISOString());
  showToast('Saved to documents');
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
  renderDocList();crmDirty=true;var s=document.getElementById('crmSaveBtn');if(s)s.disabled=false;
}
function removeDocument(docId){
  cardDocuments=cardDocuments.filter(function(d){return d.id!==docId;});
  renderDocList();crmDirty=true;var s=document.getElementById('crmSaveBtn');if(s)s.disabled=false;
}
function renderDocList(){
  var list=document.getElementById('docList');if(!list)return;
  if(cardDocuments.length===0){list.innerHTML='<div style="color:rgba(255,255,255,0.3);font-size:12px;padding:8px 0;">No documents yet</div>';return;}
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
  if(crmCurrentType==='borrower'){
    data.employers=borrowerEmployers;
    data.education=borrowerEducation;
    data.documents=cardDocuments;
  }
  return data;
}

// ===== CRM INTEGRATION =====
var crmCurrentType='client';

function crmAddNew(){
  showTypePicker(function(type){
    crmCurrentType=type;crmCurrentId=null;crmDirty=false;
    borrowerEmployers=[];borrowerEducation=[];cardDocuments=[];
    document.getElementById('crmDetailEmpty').style.display='none';
    document.getElementById('crmDetailContent').style.display='flex';
    var ti=CONTACT_TYPES[type];
    document.getElementById('crmDName').textContent='New '+ti.label;
    document.getElementById('crmDMeta').textContent='';
    document.getElementById('crmDTypeBadge').innerHTML='<span class="card-type-badge" style="background:'+ti.color+'22;color:'+ti.color+';"><i class="fas '+ti.icon+'"></i> '+ti.label+'</span>';
    document.getElementById('cardPipelineBtn').innerHTML='';
    var qt=document.getElementById('cardQualifyingWrap');if(qt)qt.style.display=(type==='borrower'?'block':'none');
    var fc=document.getElementById('crmCardForm');
    if(type==='borrower'){renderBorrowerCard(fc,{});}
    else{var secs=getFieldsForType(type);renderStandardForm(fc,secs,{});}
    document.getElementById('crmSaveBtn').disabled=true;
    document.getElementById('crmDeleteBtn').disabled=true;
    crmSwitchTab('details');
  });
}

function crmSelectContact(id){
  crmCurrentId=id;crmDirty=false;
  borrowerEmployers=[];borrowerEducation=[];cardDocuments=[];
  document.getElementById('crmSaveBtn').disabled=true;
  document.getElementById('crmDeleteBtn').disabled=true;
  document.getElementById('crmDeleteBtn').textContent='Delete';
  crmDeleteArmed=false;
  document.getElementById('crmDetailEmpty').style.display='none';
  document.getElementById('crmDetailContent').style.display='flex';
  crmRenderList();
  fetch(CRM_API+'/crm-api?action=get&id='+id)
    .then(function(r){return r.json();})
    .then(function(data){
      if(data.success!==false){
        var c=data.contact||data;
        crmCurrentType=c.type||'client';
        crmPopulateCard(c,data.activity||[]);
      }
    }).catch(function(err){console.error('CRM get error:',err);});
}

function crmPopulateCard(c,activity){
  var type=c.type||'other';
  var ti=CONTACT_TYPES[type]||CONTACT_TYPES.other;
  document.getElementById('crmDName').textContent=c.name||'Unnamed';
  document.getElementById('crmDMeta').textContent=[c.email,c.phone,c.company].filter(Boolean).join(' - ');
  document.getElementById('crmDTypeBadge').innerHTML='<span class="card-type-badge" style="background:'+ti.color+'22;color:'+ti.color+';"><i class="fas '+ti.icon+'"></i> '+ti.label+'</span>';
  var qt=document.getElementById('cardQualifyingWrap');if(qt)qt.style.display=(type==='borrower'?'block':'none');
  // Pipeline
  var pBtn=document.getElementById('cardPipelineBtn');
  var pid='crm-'+c.id;var fs=null;
  if(typeof pipelineContacts!=='undefined'){
    var m=pipelineContacts.find(function(p){return p.id===pid||(c.email&&p.email&&p.email.toLowerCase()===c.email.toLowerCase());});
    if(m)fs=m.stage;
  }
  renderPipelineButton(pBtn,c.id,fs);
  // Form
  var fc=document.getElementById('crmCardForm');
  if(type==='borrower'){renderBorrowerCard(fc,c);}
  else{var secs=getFieldsForType(type);renderStandardForm(fc,secs,c);}
  renderActivity(activity);
  crmDirty=false;document.getElementById('crmSaveBtn').disabled=true;
  crmSwitchTab('details');
}

function renderActivity(activity){
  var tl=document.getElementById('crmActivityTimeline');if(!tl)return;
  if(activity&&activity.length>0){
    var icons={email_sent:'fa-paper-plane',email_received:'fa-inbox',call:'fa-phone',note:'fa-sticky-note',meeting:'fa-handshake',text:'fa-comment'};
    var h='';activity.forEach(function(a){
      h+='<div class="activity-item"><div class="activity-icon"><i class="fas '+(icons[a.type]||'fa-sticky-note')+'"></i></div><div><div class="activity-text">'+(a.subject||a.body||a.type)+'</div><div class="activity-date">'+(a.type||'')+' - '+new Date(a.date).toLocaleDateString()+'</div></div></div>';
    });tl.innerHTML=h;
  } else {tl.innerHTML='<div style="color:rgba(255,255,255,0.3);font-size:12px;padding:12px;">No activity yet</div>';}
}

function crmSwitchTab(tab){
  document.querySelectorAll('.card-tab[data-tab]').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.crm-tab-content').forEach(function(t){t.classList.remove('active');});
  var tabEl=document.querySelector('.card-tab[data-tab="'+tab+'"]');
  var contentEl=document.getElementById('crmTab_'+tab);
  if(tabEl)tabEl.classList.add('active');
  if(contentEl)contentEl.classList.add('active');
}

function crmSaveContact(){
  var data=collectAllCardData();
  data.type=crmCurrentType;
  if(!data.name){showToast('Name is required');return;}
  if(crmCurrentId)data.id=crmCurrentId;
  fetch(CRM_API+'/crm-api?action=save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({crm:data})})
  .then(function(r){return r.json();})
  .then(function(result){
    if(result.success){
      if(crmCurrentId){
        var idx=crmContacts.findIndex(function(c){return c.id===crmCurrentId;});
        if(idx>=0)crmContacts[idx]=Object.assign(crmContacts[idx],data);
        showToast('Saved!');
      } else {
        data.id=result.id;data.created_at=new Date().toISOString();
        crmContacts.push(data);crmCurrentId=result.id;
        showToast('Contact created!');
      }
      crmRenderList();
      document.getElementById('crmDName').textContent=data.name||'Unnamed';
      crmDirty=false;document.getElementById('crmSaveBtn').disabled=true;
      document.getElementById('navCrmCount').textContent=crmContacts.length;
      document.getElementById('dashCrm').textContent=crmContacts.length;
      document.getElementById('crmSubtitle').textContent=crmContacts.length+' contacts';
    } else {showToast('Save failed: '+(result.message||''));}
  }).catch(function(err){showToast('Save failed');console.error(err);});
}
