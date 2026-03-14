/* ===========================
   OPEN HOUSE GENERATORS
   All 3 flyer PDF generators + shared helpers
   Agent Edge Partner Portal
=========================== */

/* ===== KRISTY'S INFO ===== */
var KRISTY={name:'Kristy Flach',title1:'Certified Mortgage Advisor',title2:'& Loan Officer',nmls:'NMLS ID# 2632259',phone:'M: (206) 313-5883',email:'kflach@prmg.net',web1:'kflach.myprmg.net',web2:'kristyflach.com'};

var PRMG_DISCLAIMER='\u00A92025 Paramount Residential Mortgage Group, Inc. (\u201CPRMG\u201D) is a mortgage lender. NMLS ID# 75243 (www.nmlsconsumeraccess.org). 1265 Corona Pointe Court, Suite 301, Corona, CA 92879. 866-776-4937. AZ Mortgage Banker License #910387. Licensed by the Department of Financial Protection and Innovation under the California Residential Mortgage Lending Act. Massachusetts Lender/Broker Licenses #MC75243. Licensed by the N.J. Department of Banking and Insurance. OH #RM.804171.000. Rhode Island Licensed Lender. Equal Housing Opportunity.';

var BUYDOWN_DISCLAIMER='For illustrative purposes only. This is not an offer to lend, a loan commitment, or a guarantee of rates or terms. Example assumes a 2-1 temporary buydown on a 30-year conventional mortgage with 20% down at an assumed note rate of 6.0% (Year 1: 4.0%, Year 2: 5.0%, Years 3\u201330: 6.0%). Not all loan programs allow buydowns. Actual rates, terms, and payments may vary based on creditworthiness, loan program, and market conditions. Taxes, insurance, and MI not included. Contact your loan officer for a personalized quote.';

var FLYER_DISCLAIMER='For illustrative purposes only. This is not an offer to lend, a loan commitment, or a guarantee of rates or terms. Actual rates, terms, and payments may vary based on creditworthiness, loan program, and market conditions. Contact your loan officer for a personalized quote.';

/* ===== PHOTO STORAGE ===== */
var _photos={cmp:null,bd:null,lux1:null,lux2:null,lux3:null};

/* ===========================
   SHARED FUNCTIONS
=========================== */
function closePopup(id){document.getElementById(id).style.display='none';document.body.style.overflow=''}

function prefillRealtor(prefix){
  var map={RName:'agentEdgeUserName',RTitle:'agentEdgeUserTitle',RBrokerage:'agentEdgeUserBrokerage',RPhone:'agentEdgeUserPhone',REmail:'agentEdgeUserEmail',RWebsite:'agentEdgeUserWebsite'};
  for(var k in map){var el=document.getElementById(prefix+k);if(el)el.value=sessionStorage.getItem(map[k])||''}
}

function saveRealtor(prefix){
  var map={RName:'agentEdgeUserName',RTitle:'agentEdgeUserTitle',RBrokerage:'agentEdgeUserBrokerage',RPhone:'agentEdgeUserPhone',REmail:'agentEdgeUserEmail',RWebsite:'agentEdgeUserWebsite'};
  for(var k in map){var el=document.getElementById(prefix+k);if(el&&el.value.trim())sessionStorage.setItem(map[k],el.value.trim())}
}

function getRealtorInfo(prefix){
  return{name:document.getElementById(prefix+'RName').value.trim()||'Your Name',title:document.getElementById(prefix+'RTitle').value.trim(),brokerage:document.getElementById(prefix+'RBrokerage').value.trim(),phone:document.getElementById(prefix+'RPhone').value.trim(),email:document.getElementById(prefix+'REmail').value.trim(),website:document.getElementById(prefix+'RWebsite').value.trim()};
}

function pickBrand(prefix,mode){
  document.getElementById(prefix+'OptCobrand').classList.toggle('active',mode==='cobrand');
  document.getElementById(prefix+'OptSingle').classList.toggle('active',mode==='single');
  document.getElementById(prefix+'CobrandFields').style.display=mode==='cobrand'?'block':'none';
}

function pickLayout(prefix,side){
  document.getElementById(prefix+'LayoutLeft').classList.toggle('active',side==='left');
  document.getElementById(prefix+'LayoutRight').classList.toggle('active',side==='right');
}

function handlePhoto(prefix,input){
  if(input.files&&input.files[0]){var r=new FileReader();r.onload=function(e){_photos[prefix]=e.target.result;var l=document.getElementById(prefix+'PhotoLabel');l.innerHTML='<img src="'+e.target.result+'" alt="Photo">';l.classList.add('has-photo')};r.readAsDataURL(input.files[0])}
}

function handleMultiPhoto(prefix,num,input){
  if(input.files&&input.files[0]){var r=new FileReader();r.onload=function(e){_photos[prefix+num]=e.target.result;var l=document.getElementById(prefix+'Photo'+num+'Label');l.innerHTML='<img src="'+e.target.result+'" alt="Photo '+num+'">';l.classList.add('has-photo')};r.readAsDataURL(input.files[0])}
}

/* ===== Dropdown "Other" toggle ===== */
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('select[id$="Name"]').forEach(function(sel){
    sel.addEventListener('change',function(){var cId=this.id.replace('Name','Custom');var c=document.getElementById(cId);if(c)c.style.display=this.value==='other'?'block':'none'});
  });
});

/* ===== OPEN FORM FUNCTIONS ===== */
function openComparisonForm(){prefillRealtor('cmp');document.getElementById('comparisonPopup').style.display='block';document.body.style.overflow='hidden'}
function openLuxuryForm(){prefillRealtor('lux');document.getElementById('luxuryPopup').style.display='block';document.body.style.overflow='hidden'}
function openBuydownForm(){prefillRealtor('bd');document.getElementById('buydownPopup').style.display='block';document.body.style.overflow='hidden'}

/* ===== CALCULATOR ===== */
function calcPI(principal,annualRate,termYears){var r=annualRate/100/12;var n=termYears*12;if(r===0)return principal/n;return principal*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1)}
function calcAPR(principal,annualRate,termYears){return annualRate+0.125}

function fmt$(n){return'$'+n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',')}
function fmt$W(n){return'$'+Math.round(n).toLocaleString()}
function fmtP(n){return n.toFixed(3)+'%'}
function num(id){return parseFloat(document.getElementById(id).value.replace(/[^0-9.]/g,''))||0}
function val(id){return document.getElementById(id).value.trim()}

function getProgName(prefix){
  var sel=document.getElementById(prefix+'Name');
  if(sel.value==='other')return document.getElementById(prefix+'Custom').value.trim()||'Custom Program';
  return sel.value||'Program';
}

/* ===== PDF HELPERS ===== */
function drawKristyBlock(pdf,headshotImg,x,top){
  var hsW=58,hsH=70;pdf.addImage(headshotImg,'JPEG',x,top,hsW,hsH);
  pdf.setDrawColor(204,204,204);pdf.setLineWidth(0.5);pdf.rect(x,top,hsW,hsH);
  var tx=x+hsW+8,ly=top+9;
  pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor(26,26,26);pdf.text(KRISTY.name,tx,ly);ly+=11;
  pdf.setFontSize(6.5);pdf.setFont('helvetica','normal');pdf.setTextColor(68,68,68);
  pdf.text(KRISTY.title1,tx,ly);ly+=9;pdf.text(KRISTY.title2,tx,ly);ly+=9;pdf.text(KRISTY.nmls,tx,ly);ly+=11;
  pdf.setFont('helvetica','bold');pdf.setTextColor(37,99,160);pdf.text(KRISTY.phone,tx,ly);ly+=9;
  pdf.setFont('helvetica','normal');pdf.text(KRISTY.email,tx,ly);ly+=9;pdf.text(KRISTY.web1,tx,ly);
}

function drawRealtorBlock(pdf,info,x,top){
  var hsW=58,hsH=70;pdf.setFillColor(240,243,247);pdf.setDrawColor(170,187,204);pdf.setLineWidth(1);pdf.rect(x,top,hsW,hsH,'FD');
  var initials=info.name.split(' ').map(function(w){return w[0]||''}).join('').toUpperCase().substring(0,2);
  pdf.setFontSize(16);pdf.setFont('helvetica','bold');pdf.setTextColor(136,153,170);pdf.text(initials,x+hsW/2,top+hsH/2+6,{align:'center'});
  var tx=x+hsW+8,ly=top+9;
  pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor(26,26,26);pdf.text(info.name,tx,ly);ly+=11;
  pdf.setFontSize(6.5);pdf.setFont('helvetica','normal');pdf.setTextColor(68,68,68);
  if(info.title){pdf.text(info.title,tx,ly);ly+=9}if(info.brokerage){pdf.text(info.brokerage,tx,ly);ly+=9}ly+=2;
  pdf.setTextColor(37,99,160);
  if(info.phone){pdf.text(info.phone,tx,ly);ly+=9}if(info.email){pdf.text(info.email,tx,ly);ly+=9}if(info.website){pdf.text(info.website,tx,ly)}
}

function drawBrandingFooter(pdf,prefix,headshotImg,prmgImg,W,brandY,BRANDING_H){
  var isCobrand=document.getElementById(prefix+'OptCobrand').classList.contains('active');
  var isLeft=document.getElementById(prefix+'LayoutLeft').classList.contains('active');
  pdf.setFillColor(255,255,255);pdf.rect(0,brandY,W,BRANDING_H,'F');
  pdf.setDrawColor(220,220,220);pdf.setLineWidth(0.5);pdf.line(20,brandY,W-20,brandY);
  var sTop=brandY+12;
  if(isCobrand){var rInfo=getRealtorInfo(prefix);saveRealtor(prefix);
    if(isLeft){drawRealtorBlock(pdf,rInfo,36,sTop);drawKristyBlock(pdf,headshotImg,W-36-200,sTop)}
    else{drawKristyBlock(pdf,headshotImg,36,sTop);drawRealtorBlock(pdf,rInfo,W-36-200,sTop)}
    var pW=90,pH=pW*(3529/9000);pdf.addImage(prmgImg,'PNG',(W-pW)/2,brandY+BRANDING_H-38,pW,pH);
    pdf.setFontSize(5.5);pdf.setTextColor(51,51,51);pdf.text('Paramount Residential Mortgage Group, Inc.',W/2,brandY+BRANDING_H-6,{align:'center'});
  }else{drawKristyBlock(pdf,headshotImg,36,sTop);
    var pW2=150,pH2=pW2*(3529/9000);pdf.addImage(prmgImg,'PNG',W-48-pW2,sTop-5,pW2,pH2);
    pdf.setFontSize(8);pdf.setTextColor(51,51,51);pdf.text('Paramount Residential Mortgage Group, Inc.',W-48,sTop+pH2+5,{align:'right'});
  }
}

function drawDisclaimerBar(pdf,ehImg,W,H,DISCLAIMER_H){
  var dY=H-DISCLAIMER_H;pdf.setFillColor(26,26,26);pdf.rect(0,dY,W,DISCLAIMER_H,'F');
  var ehW=28*(270/148);pdf.addImage(ehImg,'PNG',14,dY+(DISCLAIMER_H-28)/2,ehW,28);
  pdf.setFontSize(4.5);pdf.setTextColor(187,187,187);var txtLeft=14+ehW+10;
  var lines=pdf.splitTextToSize(PRMG_DISCLAIMER,W-txtLeft-14);
  var startY=dY+(DISCLAIMER_H-lines.length*6.5)/2+5;
  lines.forEach(function(line,i){pdf.text(line,txtLeft,startY+i*6.5)});
}

function loadImage(src){
  return new Promise(function(resolve,reject){
    var img=new Image();img.crossOrigin='anonymous';
    img.onload=function(){var c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);resolve(c.toDataURL('image/png'))};
    img.onerror=function(){reject(new Error('Failed to load: '+src))};img.src=src;
  });
}

/* ===========================
   PDF: PAYMENT COMPARISON (3 columns)
=========================== */
async function generateComparisonPDF(){
  var btn=document.getElementById('cmpGenBtn'),status=document.getElementById('cmpStatus');
  btn.disabled=true;btn.textContent='Generating...';status.textContent='';
  try{
    var address=val('cmpAddress'),price=num('cmpPrice');
    if(!address)throw new Error('Please enter a property address.');
    if(!price)throw new Error('Please enter a valid list price.');
    if(!_photos.cmp)throw new Error('Please upload a property photo.');
    var sqft=val('cmpSqft'),beds=val('cmpBeds'),baths=val('cmpBaths'),yearBuilt=val('cmpYear');

    var progs=[];
    for(var i=1;i<=3;i++){
      var p='cmpProg'+i;var loan=num(p+'Loan'),rate=num(p+'Rate'),term=num(p+'Term')||30,down=num(p+'Down'),mi=num(p+'MI'),tax=num(p+'Tax'),ins=num(p+'Ins'),hoa=num(p+'HOA');
      var pi=calcPI(loan,rate,term);var piti=pi+mi+tax+ins;var apr=calcAPR(loan,rate,term);
      progs.push({name:getProgName(p),term:term,down:down,loan:loan,rate:rate,pi:pi,mi:mi,tax:tax,ins:ins,piti:piti,hoa:hoa,apr:apr});
    }

    var headshotImg=await loadImage('hero-headshot.jpg');var prmgImg=await loadImage('PRMG-Logo.png');var ehImg=await loadImage('equal-housing-logo.png');
    var pdf=new jspdf.jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
    var W=612,H=792,BRANDING_H=120,DISCLAIMER_H=52;
    pdf.setFillColor(255,255,255);pdf.rect(0,0,W,H,'F');

    // Address header
    var y=28;pdf.setFontSize(14);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);
    pdf.text(address.toUpperCase(),W/2,y,{align:'center'});
    y+=8;pdf.setDrawColor(0,37,86);pdf.setLineWidth(1.5);pdf.line(20,y,W-20,y);

    // Stats bar
    y+=16;pdf.setFontSize(8);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);
    var stats='OFFERED AT: '+fmt$W(price);
    if(sqft)stats+='     SQUARE FEET: '+Number(sqft).toLocaleString();
    if(beds)stats+='     BEDS: '+beds;if(baths)stats+='     BATHS: '+baths;
    if(yearBuilt)stats+='     YEAR BUILT: '+yearBuilt;
    pdf.text(stats,W/2,y,{align:'center'});

    // Photo
    y+=12;var photoH=220;pdf.addImage(_photos.cmp,'JPEG',20,y,W-40,photoH);y+=photoH+10;

    // Table
    var tX=20,tW=W-40,c0W=140,colW=(tW-c0W)/3,rowH=18;
    pdf.setFillColor(0,37,86);pdf.rect(tX,y,tW,rowH+4,'F');
    pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor(255,255,255);
    pdf.text('Program',tX+8,y+13);
    for(var c=0;c<3;c++){var cx=tX+c0W+c*colW+colW/2;pdf.text(progs[c].name,cx,y+8,{align:'center'});pdf.setFontSize(6);pdf.text('+ '+progs[c].term+' years',cx,y+17,{align:'center'});pdf.setFontSize(7)}
    y+=rowH+4;

    var rows=[
      {label:'Down Payment',vals:progs.map(function(p){return fmt$W(p.down)})},
      {label:'Total Loan Amount',vals:progs.map(function(p){return fmt$W(p.loan)})},
      {label:'Interest Rate',vals:progs.map(function(p){return fmtP(p.rate)})},
      {label:'Principal & Interest Payment',vals:progs.map(function(p){return fmt$(p.pi)})},
      {label:'MI (Mortgage Insurance)',vals:progs.map(function(p){return fmt$(p.mi)})},
      {label:'Taxes',vals:progs.map(function(p){return fmt$(p.tax)})},
      {label:'Insurance',vals:progs.map(function(p){return fmt$(p.ins)})},
      {label:'Total Payment/PITI',vals:progs.map(function(p){return fmt$(p.piti)}),bold:true},
      {label:'HOA Dues',vals:progs.map(function(p){return fmt$W(p.hoa)+'/yr'})},
      {label:'APR (Annual Percentage Rate)',vals:progs.map(function(p){return fmtP(p.apr)})}
    ];

    rows.forEach(function(row,ri){
      if(ri%2===0){pdf.setFillColor(240,240,240);pdf.rect(tX,y,tW,rowH,'F')}
      pdf.setFontSize(7);pdf.setFont('helvetica',row.bold?'bold':'normal');pdf.setTextColor(51,51,51);
      pdf.text(row.label,tX+8,y+12);
      for(var c=0;c<3;c++){pdf.text(row.vals[c],tX+c0W+c*colW+colW/2,y+12,{align:'center'})}
      y+=rowH;
    });

    // Flyer disclaimer
    y+=12;pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.setTextColor(68,68,68);
    var flyerDiscLines=pdf.splitTextToSize(FLYER_DISCLAIMER,W-40);
    flyerDiscLines.forEach(function(line){pdf.text(line,20,y);y+=11});

    // Branding + disclaimer
    var brandY=H-BRANDING_H-DISCLAIMER_H;
    drawBrandingFooter(pdf,'cmp',headshotImg,prmgImg,W,brandY,BRANDING_H);
    drawDisclaimerBar(pdf,ehImg,W,H,DISCLAIMER_H);

    pdf.save('payment-comparison-'+address.replace(/[^a-zA-Z0-9]/g,'-').toLowerCase().substring(0,40)+'.pdf');
    status.textContent='PDF downloaded!';status.style.color='#22c55e';
    btn.textContent='Generate & Download PDF';btn.disabled=false;
    setTimeout(function(){closePopup('comparisonPopup')},1500);
  }catch(err){console.error('PDF error:',err);status.textContent=err.message||'Error generating PDF.';status.style.color='#ef4444';btn.textContent='Generate & Download PDF';btn.disabled=false}
}

/* ===========================
   PDF: LUXURY LISTING (1 column, 3 photos)
=========================== */
async function generateLuxuryPDF(){
  var btn=document.getElementById('luxGenBtn'),status=document.getElementById('luxStatus');
  btn.disabled=true;btn.textContent='Generating...';status.textContent='';
  try{
    var address=val('luxAddress'),price=num('luxPrice');
    if(!address)throw new Error('Please enter a property address.');
    if(!price)throw new Error('Please enter a valid list price.');
    if(!_photos.lux1)throw new Error('Please upload at least the hero photo.');
    var sqft=val('luxSqft'),beds=val('luxBeds'),baths=val('luxBaths'),yearBuilt=val('luxYear');

    var loan=num('luxProgLoan'),rate=num('luxProgRate'),term=num('luxProgTerm')||30,down=num('luxProgDown');
    var mi=num('luxProgMI'),tax=num('luxProgTax'),ins=num('luxProgIns'),hoa=num('luxProgHOA');
    var pi=calcPI(loan,rate,term),piti=pi+mi+tax+ins,apr=calcAPR(loan,rate,term);
    var progName=getProgName('luxProg');

    var headshotImg=await loadImage('hero-headshot.jpg');var prmgImg=await loadImage('PRMG-Logo.png');var ehImg=await loadImage('equal-housing-logo.png');
    var pdf=new jspdf.jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
    var W=612,H=792,BRANDING_H=120,DISCLAIMER_H=52;
    pdf.setFillColor(255,255,255);pdf.rect(0,0,W,H,'F');

    // Address header with lines
    var y=20;pdf.setDrawColor(0,37,86);pdf.setLineWidth(1.5);pdf.line(20,y,W-20,y);
    y+=20;pdf.setFontSize(14);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);
    pdf.text(address.toUpperCase(),W/2,y,{align:'center'});
    y+=10;pdf.setLineWidth(0.5);pdf.line(20,y,W-20,y);

    // Stats bar
    y+=14;pdf.setFontSize(7.5);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);
    var stats='OFFERED AT: '+fmt$W(price);
    if(sqft)stats+='     SQUARE FEET: '+Number(sqft).toLocaleString();
    if(beds)stats+='     BEDS: '+beds;if(baths)stats+='     BATHS: '+baths;
    if(yearBuilt)stats+='     YEAR BUILT: '+yearBuilt;
    pdf.text(stats,W/2,y,{align:'center'});

    // Photos: hero left, 2 stacked right
    y+=12;var heroW=(W-40)*0.65,heroH=240,sideW=(W-40)-heroW-8,sideH=(heroH-8)/2;
    pdf.addImage(_photos.lux1,'JPEG',20,y,heroW,heroH);
    if(_photos.lux2)pdf.addImage(_photos.lux2,'JPEG',20+heroW+8,y,sideW,sideH);
    if(_photos.lux3)pdf.addImage(_photos.lux3,'JPEG',20+heroW+8,y+sideH+8,sideW,sideH);
    y+=heroH+8;

    // Single program table
    var tX=20,tW=W-40,c0W=tW*0.55,c1W=tW-c0W,rowH=18;
    pdf.setFillColor(0,37,86);pdf.rect(tX,y,tW,rowH+2,'F');
    pdf.setFontSize(8);pdf.setFont('helvetica','bold');pdf.setTextColor(255,255,255);
    pdf.text('Program',tX+8,y+12);pdf.text(progName,tX+c0W+c1W/2,y+12,{align:'center'});
    y+=rowH+2;

    var rows=[
      {label:'Down Payment',val:fmt$W(down)+' ('+Math.round(down/price*100)+'%)'},
      {label:'Total Loan Amount',val:fmt$W(loan)},
      {label:'Interest Rate',val:fmtP(rate)},
      {label:'Principal & Interest Payment',val:fmt$(pi)},
      {label:'MI (Mortgage Insurance)',val:fmt$(mi)},
      {label:'Taxes',val:fmt$(tax)},
      {label:'Insurance',val:fmt$(ins)},
      {label:'Total Payment/PITI',val:fmt$(piti),bold:true},
      {label:'HOA Dues',val:fmt$W(hoa)+'/yr'},
      {label:'APR (Annual Percentage Rate)',val:fmtP(apr)}
    ];

    rows.forEach(function(row,ri){
      if(ri%2===0){pdf.setFillColor(240,240,240);pdf.rect(tX,y,tW,rowH,'F')}
      pdf.setFontSize(7.5);pdf.setFont('helvetica',row.bold?'bold':'normal');pdf.setTextColor(51,51,51);
      pdf.text(row.label,tX+8,y+12);pdf.text(row.val,tX+c0W+c1W/2,y+12,{align:'center'});
      y+=rowH;
    });

    // Flyer disclaimer
    y+=12;pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.setTextColor(68,68,68);
    var flyerDiscLines=pdf.splitTextToSize(FLYER_DISCLAIMER,W-40);
    flyerDiscLines.forEach(function(line){pdf.text(line,20,y);y+=11});

    // Branding + disclaimer
    var brandY=H-BRANDING_H-DISCLAIMER_H;
    drawBrandingFooter(pdf,'lux',headshotImg,prmgImg,W,brandY,BRANDING_H);
    drawDisclaimerBar(pdf,ehImg,W,H,DISCLAIMER_H);

    pdf.save('luxury-listing-'+address.replace(/[^a-zA-Z0-9]/g,'-').toLowerCase().substring(0,40)+'.pdf');
    status.textContent='PDF downloaded!';status.style.color='#22c55e';
    btn.textContent='Generate & Download PDF';btn.disabled=false;
    setTimeout(function(){closePopup('luxuryPopup')},1500);
  }catch(err){console.error('PDF error:',err);status.textContent=err.message||'Error generating PDF.';status.style.color='#ef4444';btn.textContent='Generate & Download PDF';btn.disabled=false}
}

/* ===========================
   PDF: 2-1 BUYDOWN
=========================== */
async function generateBuydownPDF(){
  var btn=document.getElementById('bdGenBtn'),status=document.getElementById('bdStatus');
  btn.disabled=true;btn.textContent='Generating...';status.textContent='';
  try{
    var address=val('bdAddress'),price=num('bdPrice');
    var sqft=val('bdSqft'),beds=val('bdBeds'),baths=val('bdBaths'),yearBuilt=val('bdYear');
    var description=val('bdDescription');
    if(!address)throw new Error('Please enter a property address.');
    if(!price)throw new Error('Please enter a valid list price.');
    if(!_photos.bd)throw new Error('Please upload a property photo.');

    var noteRate=6.0,downPct=0.20,downAmt=price*downPct,loanAmt=price-downAmt,termYears=30;
    var rate1=noteRate-2,rate2=noteRate-1,rate3=noteRate;
    var pi1=calcPI(loanAmt,rate1,termYears),pi2=calcPI(loanAmt,rate2,termYears),pi3=calcPI(loanAmt,rate3,termYears);
    var savings1=pi3-pi1,savings2=pi3-pi2;

    var headshotImg=await loadImage('hero-headshot.jpg');var prmgImg=await loadImage('PRMG-Logo.png');var ehImg=await loadImage('equal-housing-logo.png');
    var pdf=new jspdf.jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
    var W=612,H=792,BRANDING_H=120,DISCLAIMER_H=52;
    pdf.setFillColor(255,255,255);pdf.rect(0,0,W,H,'F');

    // Header bar
    var headerH=36;pdf.setFillColor(0,37,86);pdf.rect(0,0,W,headerH,'F');
    pdf.setFontSize(18);pdf.setFont('helvetica','bold');pdf.setTextColor(255,255,255);pdf.text(fmt$W(price),20,25);
    pdf.setFontSize(10);pdf.setFont('helvetica','normal');pdf.text(address.toUpperCase(),W/2,25,{align:'center'});

    // Two column layout
    var colLeft=20,colMid=W*0.55,colRight=W-20,topY=headerH+10;
    var photoW=colMid-colLeft-15,photoH=210;
    pdf.addImage(_photos.bd,'JPEG',colLeft,topY,photoW,photoH);

    // Right column
    var rX=colMid,rW=colRight-colMid,rY=topY+5;
    pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);
    if(sqft){pdf.text('SQ Feet: '+Number(sqft).toLocaleString(),rX,rY);rY+=14}
    if(beds){pdf.text('Bedrooms: '+beds,rX,rY);rY+=14}
    if(baths){pdf.text('Bath: '+baths,rX,rY);rY+=14}
    if(yearBuilt){pdf.text('Year Built: '+yearBuilt,rX,rY);rY+=14}
    rY+=4;pdf.setDrawColor(0,37,86);pdf.setLineWidth(1.5);pdf.line(rX,rY,rX+rW,rY);rY+=14;
    pdf.setFontSize(10);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);pdf.text('Property Description:',rX,rY);rY+=14;
    if(description){pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.setTextColor(51,51,51);
      var dLines=pdf.splitTextToSize(description,rW);dLines.forEach(function(line){if(rY<topY+photoH){pdf.text(line,rX,rY);rY+=11}})}

    // How it works
    var sY=topY+photoH+18;pdf.setDrawColor(0,37,86);pdf.setLineWidth(2);pdf.line(colLeft,sY,colLeft+80,sY);sY+=14;
    pdf.setFontSize(11);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);pdf.text('How a 2-1 Buy down works:',colLeft,sY);sY+=16;
    var bullets=['Buy down option must be paid by builder, seller or third-party','Borrower cannot pay for buy down','Home buyer\u2019s interest rate is lowered by 2% in year 1 and 1% in year 2','After two years, original interest rate continues for the life of the loan'];
    pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.setTextColor(51,51,51);
    bullets.forEach(function(b){pdf.text('\u2022  '+b,colLeft+8,sY);sY+=13});

    // Scenario table
    sY+=10;pdf.setFontSize(10);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);
    pdf.text('2-1 Buy Down Scenario Example:',colLeft,sY);sY+=18;
    var col1X=colLeft+20,col2X=W/3+20,col3X=(W/3)*2+20;
    var years=[{label:'2-1 Buy down | Year 1',rate:rate1,pi:pi1,savings:savings1},{label:'2-1 Buy down | Year 2',rate:rate2,pi:pi2,savings:savings2},{label:'2-1 Buy down | Year 3-30',rate:rate3,pi:pi3,savings:0}];
    var colXs=[col1X,col2X,col3X];

    years.forEach(function(yr,i){
      var cx=colXs[i];pdf.setFontSize(16);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);
      if(i===2)pdf.setTextColor(192,57,43);
      var amtStr=fmt$(yr.pi);pdf.text(amtStr,cx,sY);
      var amtW=pdf.getTextWidth(amtStr);
      pdf.setFontSize(6);pdf.setFont('helvetica','normal');pdf.setTextColor(102,102,102);
      pdf.text('Estimated',cx+amtW+4,sY-8);pdf.text('Payment',cx+amtW+4,sY);
    });
    sY+=14;
    years.forEach(function(yr,i){pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor(0,37,86);pdf.text(yr.label,colXs[i],sY)});
    sY+=16;

    var detailRows=[
      {label:'Loan Amount:',vals:[fmt$W(loanAmt),fmt$W(loanAmt),fmt$W(loanAmt)]},
      {label:'Interest Rate:',vals:[fmtP(rate1),fmtP(rate2),fmtP(rate3)]},
      {label:'Principal & Interest:',vals:[fmt$(pi1),fmt$(pi2),fmt$(pi3)]},
      {label:'Monthly Savings:',vals:[fmt$(savings1),fmt$(savings2),'$0.00']}
    ];
    detailRows.forEach(function(row){pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor(68,68,68);
      years.forEach(function(yr,i){pdf.text(row.label,colXs[i],sY);pdf.setFont('helvetica','normal');pdf.text(row.vals[i],colXs[i]+2,sY+10);pdf.setFont('helvetica','bold')});sY+=22});

    // Buydown disclaimer
    sY+=12;pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.setTextColor(68,68,68);
    var bdDiscLines=pdf.splitTextToSize(BUYDOWN_DISCLAIMER,W-40);
    bdDiscLines.forEach(function(line){pdf.text(line,colLeft,sY);sY+=11});

    // Branding + disclaimer
    var brandY=H-BRANDING_H-DISCLAIMER_H;
    drawBrandingFooter(pdf,'bd',headshotImg,prmgImg,W,brandY,BRANDING_H);
    drawDisclaimerBar(pdf,ehImg,W,H,DISCLAIMER_H);

    pdf.save('buydown-'+address.replace(/[^a-zA-Z0-9]/g,'-').toLowerCase().substring(0,40)+'.pdf');
    status.textContent='PDF downloaded!';status.style.color='#22c55e';
    btn.textContent='Generate & Download PDF';btn.disabled=false;
    setTimeout(function(){closePopup('buydownPopup')},1500);
  }catch(err){console.error('PDF error:',err);status.textContent=err.message||'Error generating PDF.';status.style.color='#ef4444';btn.textContent='Generate & Download PDF';btn.disabled=false}
}
