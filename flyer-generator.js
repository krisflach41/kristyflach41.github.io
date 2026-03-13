/* ===========================
   FLYER PDF GENERATOR
   Agent Edge Partner Portal
   
   Self-service PDF generation for static flyers.
   Stamps co-branding + disclaimer onto flyer background images.
   
   Usage: Include this script + jsPDF on any wing page.
   Each flyer card needs: data-bg="flyer-backgrounds/filename.png"
   Button: <button class="generate-btn" onclick="openFlyerGenerator(this)">Generate Flyer</button>
=========================== */

/* ===== KRISTY'S STATIC INFO (baked into every flyer) ===== */
var KRISTY_INFO = {
  name: 'Kristy Flach',
  title: 'Certified Mortgage Advisor\n& Loan Officer',
  nmls: 'NMLS ID# 2632259',
  phone: 'M: (206) 313-5883',
  email: 'kflach@prmg.net',
  web1: 'kflach.myprmg.net',
  web2: 'kristyflach.com'
};

var DISCLAIMER_TEXT = '\u00A92025 Paramount Residential Mortgage Group, Inc. (\u201CPRMG\u201D) is a mortgage lender. NMLS ID# 75243 (www.nmlsconsumeraccess.org). 1265 Corona Pointe Court, Suite 301, Corona, CA 92879. 866-776-4937. AZ Mortgage Banker License #910387. Licensed by the Department of Financial Protection and Innovation under the California Residential Mortgage Lending Act. Massachusetts Lender/Broker Licenses #MC75243. Licensed by the N.J. Department of Banking and Insurance. OH #RM.804171.000. Rhode Island Licensed Lender. Equal Housing Opportunity.';

/* ===== GLOBAL STATE ===== */
var _flyerBgPath = '';
var _flyerName = '';

/* ===== OPEN THE GENERATE POPUP ===== */
function openFlyerGenerator(btn) {
  var card = btn.closest('.flyer-card');
  _flyerBgPath = card.getAttribute('data-bg');
  _flyerName = card.getAttribute('data-name') || 'Flyer';

  // Get realtor info from session
  var realtorName = sessionStorage.getItem('agentEdgeUserName') || '';
  var realtorTitle = sessionStorage.getItem('agentEdgeUserTitle') || '';
  var realtorPhone = sessionStorage.getItem('agentEdgeUserPhone') || '';
  var realtorEmail = sessionStorage.getItem('agentEdgeUserEmail') || '';
  var realtorBrokerage = sessionStorage.getItem('agentEdgeUserBrokerage') || '';
  var realtorWebsite = sessionStorage.getItem('agentEdgeUserWebsite') || '';

  // Build popup HTML
  var popup = document.getElementById('flyerGenPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'flyerGenPopup';
    document.body.appendChild(popup);
  }

  popup.innerHTML = 
    '<div class="fg-overlay" onclick="closeFlyerGenerator()"></div>' +
    '<div class="fg-modal">' +
      '<div class="fg-header">' +
        '<h3>Generate Flyer</h3>' +
        '<button class="fg-close" onclick="closeFlyerGenerator()">&times;</button>' +
      '</div>' +
      '<div class="fg-body">' +
        '<p class="fg-flyer-name">' + _flyerName + '</p>' +
        
        '<div class="fg-section-label">Branding Option</div>' +
        '<div class="fg-brand-options">' +
          '<label class="fg-brand-opt active" id="fgOptCobrand" onclick="fgPickBrand(\'cobrand\')">' +
            '<input type="radio" name="fg_brand" value="cobrand" checked style="display:none;">' +
            '<div class="fg-opt-preview"><span class="fg-you">YOU</span><span class="fg-kristy">KRISTY</span></div>' +
            '<div class="fg-opt-label">Co-branded</div>' +
          '</label>' +
          '<label class="fg-brand-opt" id="fgOptSingle" onclick="fgPickBrand(\'single\')">' +
            '<input type="radio" name="fg_brand" value="single" style="display:none;">' +
            '<div class="fg-opt-preview"><span class="fg-kristy">KRISTY ONLY</span></div>' +
            '<div class="fg-opt-label">Kristy-branded</div>' +
          '</label>' +
        '</div>' +

        '<div id="fgCobrandFields">' +
          '<div class="fg-section-label">Your Layout</div>' +
          '<div class="fg-layout-options">' +
            '<label class="fg-layout-opt active" id="fgLayoutLeft" onclick="fgPickLayout(\'left\')">' +
              '<input type="radio" name="fg_layout" value="left" checked style="display:none;">' +
              '<div class="fg-layout-preview"><span class="fg-you-sm">YOU</span><span class="fg-kristy-sm">KRISTY</span></div>' +
              '<div class="fg-opt-label">You on Left</div>' +
            '</label>' +
            '<label class="fg-layout-opt" id="fgLayoutRight" onclick="fgPickLayout(\'right\')">' +
              '<input type="radio" name="fg_layout" value="right" style="display:none;">' +
              '<div class="fg-layout-preview"><span class="fg-kristy-sm">KRISTY</span><span class="fg-you-sm">YOU</span></div>' +
              '<div class="fg-opt-label">You on Right</div>' +
            '</label>' +
          '</div>' +

          '<div class="fg-section-label">Your Info</div>' +
          '<div class="fg-fields">' +
            '<div class="fg-field-row">' +
              '<input type="text" id="fgName" placeholder="Your Name" value="' + realtorName + '">' +
              '<input type="text" id="fgTitle" placeholder="Title (e.g. Realtor)" value="' + realtorTitle + '">' +
            '</div>' +
            '<div class="fg-field-row">' +
              '<input type="text" id="fgBrokerage" placeholder="Brokerage" value="' + realtorBrokerage + '">' +
              '<input type="tel" id="fgPhone" placeholder="Phone" value="' + realtorPhone + '">' +
            '</div>' +
            '<div class="fg-field-row">' +
              '<input type="email" id="fgEmail" placeholder="Email" value="' + realtorEmail + '">' +
              '<input type="text" id="fgWebsite" placeholder="Website" value="' + realtorWebsite + '">' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<button class="fg-generate-btn" onclick="generateFlyerPDF()" id="fgGenBtn">Generate & Download PDF</button>' +
        '<div class="fg-status" id="fgStatus"></div>' +
      '</div>' +
    '</div>';

  popup.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeFlyerGenerator() {
  var popup = document.getElementById('flyerGenPopup');
  if (popup) popup.style.display = 'none';
  document.body.style.overflow = '';
}

function fgPickBrand(mode) {
  document.getElementById('fgOptCobrand').classList.toggle('active', mode === 'cobrand');
  document.getElementById('fgOptSingle').classList.toggle('active', mode === 'single');
  document.getElementById('fgCobrandFields').style.display = mode === 'cobrand' ? 'block' : 'none';
}

function fgPickLayout(side) {
  document.getElementById('fgLayoutLeft').classList.toggle('active', side === 'left');
  document.getElementById('fgLayoutRight').classList.toggle('active', side === 'right');
}

/* ===== PDF GENERATION ===== */
async function generateFlyerPDF() {
  var btn = document.getElementById('fgGenBtn');
  var status = document.getElementById('fgStatus');
  btn.disabled = true;
  btn.textContent = 'Generating...';
  status.textContent = '';

  try {
    var isCobrand = document.getElementById('fgOptCobrand').classList.contains('active');
    var isLeft = document.getElementById('fgLayoutLeft').classList.contains('active');

    // Load background image
    var bgImg = await loadImage(_flyerBgPath);

    // Load Kristy's headshot
    var headshotImg = await loadImage('hero-headshot.jpg');

    // Load PRMG logo
    var prmgImg = await loadImage('PRMG-Logo.png');

    // Load Equal Housing logo
    var ehImg = await loadImage('equal-housing-logo.png');

    // Create PDF (letter size: 612 x 792 points = 8.5 x 11 inches)
    var pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });

    var W = 612;
    var H = 792;
    var BRANDING_H = 138;
    var DISCLAIMER_H = 42;
    var BG_H = H - BRANDING_H - DISCLAIMER_H;

    // Draw background image (top area)
    pdf.addImage(bgImg, 'PNG', 0, 0, W, BG_H);

    // White branding area
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, BG_H, W, BRANDING_H, 'F');

    var sectionTop = BG_H + 15;

    if (isCobrand) {
      // Get realtor info from form
      var rInfo = {
        name: document.getElementById('fgName').value.trim() || 'Your Name',
        title: document.getElementById('fgTitle').value.trim(),
        brokerage: document.getElementById('fgBrokerage').value.trim(),
        phone: document.getElementById('fgPhone').value.trim(),
        email: document.getElementById('fgEmail').value.trim(),
        website: document.getElementById('fgWebsite').value.trim()
      };

      // Save to session for next time
      if (rInfo.name !== 'Your Name') sessionStorage.setItem('agentEdgeUserName', rInfo.name);
      if (rInfo.title) sessionStorage.setItem('agentEdgeUserTitle', rInfo.title);
      if (rInfo.brokerage) sessionStorage.setItem('agentEdgeUserBrokerage', rInfo.brokerage);
      if (rInfo.phone) sessionStorage.setItem('agentEdgeUserPhone', rInfo.phone);
      if (rInfo.email) sessionStorage.setItem('agentEdgeUserEmail', rInfo.email);
      if (rInfo.website) sessionStorage.setItem('agentEdgeUserWebsite', rInfo.website);

      if (isLeft) {
        // Realtor LEFT, Kristy RIGHT
        drawRealtorBlock(pdf, rInfo, 36, sectionTop);
        drawKristyBlock(pdf, headshotImg, W - 36 - 200, sectionTop);
      } else {
        // Kristy LEFT, Realtor RIGHT
        drawKristyBlock(pdf, headshotImg, 36, sectionTop);
        drawRealtorBlock(pdf, rInfo, W - 36 - 200, sectionTop);
      }

      // PRMG logo bottom center
      var prmgW = 90;
      var prmgH = prmgW * (3529 / 9000);
      pdf.addImage(prmgImg, 'PNG', (W - prmgW) / 2, BG_H + BRANDING_H - 48, prmgW, prmgH);
      pdf.setFontSize(5.5);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Paramount Residential Mortgage Group, Inc.', W / 2, BG_H + BRANDING_H - 10, { align: 'center' });

    } else {
      // Single brand — Kristy only
      drawKristyBlock(pdf, headshotImg, 36, sectionTop);

      // PRMG logo on the right
      var prmgW2 = 150;
      var prmgH2 = prmgW2 * (3529 / 9000);
      pdf.addImage(prmgImg, 'PNG', W - 48 - prmgW2, sectionTop - 5, prmgW2, prmgH2);
      pdf.setFontSize(8);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Paramount Residential Mortgage Group, Inc.', W - 48, sectionTop + prmgH2 + 5, { align: 'right' });
    }

    // ===== DISCLAIMER BAR =====
    var disclaimerY = H - DISCLAIMER_H;
    pdf.setFillColor(26, 26, 26);
    pdf.rect(0, disclaimerY, W, DISCLAIMER_H, 'F');

    // Equal Housing logo
    var ehW = 28 * (270 / 148);
    pdf.addImage(ehImg, 'PNG', 14, disclaimerY + (DISCLAIMER_H - 28) / 2, ehW, 28);

    // Disclaimer text
    pdf.setFontSize(4.8);
    pdf.setTextColor(187, 187, 187);
    var txtLeft = 14 + ehW + 10;
    var txtWidth = W - txtLeft - 14;
    var lines = pdf.splitTextToSize(DISCLAIMER_TEXT, txtWidth);
    var lineH = 7;
    var startY = disclaimerY + (DISCLAIMER_H + lines.length * lineH) / 2 - 5;
    lines.forEach(function(line, i) {
      pdf.text(line, txtLeft, startY - (lines.length - 1 - i) * lineH + (lines.length - 1) * lineH);
    });
    // Re-do disclaimer positioning more simply
    var dStartY = disclaimerY + (DISCLAIMER_H - lines.length * lineH) / 2 + 5;
    // Clear and redraw
    pdf.setFillColor(26, 26, 26);
    pdf.rect(0, disclaimerY, W, DISCLAIMER_H, 'F');
    pdf.addImage(ehImg, 'PNG', 14, disclaimerY + (DISCLAIMER_H - 28) / 2, ehW, 28);
    pdf.setFontSize(4.8);
    pdf.setTextColor(187, 187, 187);
    lines.forEach(function(line, i) {
      pdf.text(line, txtLeft, dStartY + i * lineH);
    });

    // Download
    var filename = _flyerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '.pdf';
    pdf.save(filename);

    status.textContent = 'PDF downloaded!';
    status.style.color = '#22c55e';
    btn.textContent = 'Generate & Download PDF';
    btn.disabled = false;

    // Close popup after a brief moment
    setTimeout(closeFlyerGenerator, 1500);

  } catch (err) {
    console.error('PDF generation error:', err);
    status.textContent = 'Error generating PDF. Please try again.';
    status.style.color = '#ef4444';
    btn.textContent = 'Generate & Download PDF';
    btn.disabled = false;
  }
}

/* ===== DRAW HELPER FUNCTIONS ===== */

function drawKristyBlock(pdf, headshotImg, x, top) {
  // Headshot
  var hsW = 64, hsH = 78;
  pdf.addImage(headshotImg, 'JPEG', x, top, hsW, hsH);
  pdf.setDrawColor(204, 204, 204);
  pdf.setLineWidth(0.5);
  pdf.rect(x, top, hsW, hsH);

  // Text
  var tx = x + hsW + 10;
  var ly = top + 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 26, 26);
  pdf.text(KRISTY_INFO.name, tx, ly); ly += 12;

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(68, 68, 68);
  pdf.text('Certified Mortgage Advisor', tx, ly); ly += 10;
  pdf.text('& Loan Officer', tx, ly); ly += 10;
  pdf.text(KRISTY_INFO.nmls, tx, ly); ly += 13;

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(37, 99, 160);
  pdf.text(KRISTY_INFO.phone, tx, ly); ly += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.text(KRISTY_INFO.email, tx, ly); ly += 10;
  pdf.text(KRISTY_INFO.web1, tx, ly); ly += 10;
  pdf.text(KRISTY_INFO.web2, tx, ly);
}

function drawRealtorBlock(pdf, info, x, top) {
  // Initials placeholder (no headshot yet)
  var hsW = 64, hsH = 78;
  pdf.setFillColor(240, 243, 247);
  pdf.setDrawColor(170, 187, 204);
  pdf.setLineWidth(1);
  // Dashed border - jsPDF doesn't support dashes natively, use solid
  pdf.rect(x, top, hsW, hsH, 'FD');

  // Initials
  var initials = info.name.split(' ').map(function(w) { return w[0] || ''; }).join('').toUpperCase().substring(0, 2);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(136, 153, 170);
  pdf.text(initials, x + hsW / 2, top + hsH / 2 + 6, { align: 'center' });

  // Text
  var tx = x + hsW + 10;
  var ly = top + 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 26, 26);
  pdf.text(info.name, tx, ly); ly += 12;

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(68, 68, 68);
  if (info.title) { pdf.text(info.title, tx, ly); ly += 10; }
  if (info.brokerage) { pdf.text(info.brokerage, tx, ly); ly += 10; }
  ly += 3;

  pdf.setTextColor(37, 99, 160);
  if (info.phone) { pdf.text(info.phone, tx, ly); ly += 10; }
  if (info.email) { pdf.text(info.email, tx, ly); ly += 10; }
  if (info.website) { pdf.text(info.website, tx, ly); }
}

/* ===== IMAGE LOADER ===== */
function loadImage(src) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      // Convert to canvas to get data URL
      var canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = function() {
      reject(new Error('Failed to load image: ' + src));
    };
    img.src = src;
  });
}

/* ===== POPUP STYLES (injected once) ===== */
(function injectFlyerGeneratorStyles() {
  if (document.getElementById('fg-styles')) return;
  var style = document.createElement('style');
  style.id = 'fg-styles';
  style.textContent = 
    '#flyerGenPopup { display:none; position:fixed; inset:0; z-index:10001; }' +
    '.fg-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.55); backdrop-filter:blur(4px); }' +
    '.fg-modal { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:90%; max-width:480px; max-height:90vh; overflow-y:auto; background:#fff; border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,0.3); }' +
    '.fg-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid #e5e7eb; }' +
    '.fg-header h3 { margin:0; font-size:18px; color:#0b1f3a; }' +
    '.fg-close { background:none; border:none; font-size:24px; color:#666; cursor:pointer; padding:0; width:30px; height:30px; display:flex; align-items:center; justify-content:center; }' +
    '.fg-body { padding:24px; }' +
    '.fg-flyer-name { font-size:14px; font-weight:700; color:#0b4ea2; margin:0 0 20px 0; text-align:center; }' +
    '.fg-section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#0b1f3a; margin:0 0 10px 0; }' +
    '.fg-brand-options { display:flex; gap:10px; margin-bottom:20px; }' +
    '.fg-brand-opt { flex:1; padding:14px; border-radius:10px; border:2px solid #ddd; text-align:center; cursor:pointer; transition:0.2s; }' +
    '.fg-brand-opt.active { border-color:#0b4ea2; background:rgba(11,78,162,0.04); }' +
    '.fg-opt-preview { display:flex; justify-content:center; gap:6px; margin-bottom:6px; }' +
    '.fg-you { padding:4px 12px; background:rgba(25,118,210,0.12); border-radius:4px; font-size:9px; font-weight:700; color:#1976d2; }' +
    '.fg-kristy { padding:4px 12px; background:rgba(11,78,162,0.08); border-radius:4px; font-size:9px; font-weight:700; color:#0b4ea2; }' +
    '.fg-opt-label { font-size:11px; font-weight:600; color:#555; }' +
    '.fg-brand-opt.active .fg-opt-label { color:#0b4ea2; }' +
    '.fg-layout-options { display:flex; gap:10px; margin-bottom:20px; }' +
    '.fg-layout-opt { flex:1; padding:12px; border-radius:10px; border:2px solid #ddd; text-align:center; cursor:pointer; transition:0.2s; }' +
    '.fg-layout-opt.active { border-color:#0b4ea2; background:rgba(11,78,162,0.04); }' +
    '.fg-layout-preview { display:flex; justify-content:center; gap:6px; margin-bottom:4px; }' +
    '.fg-you-sm { padding:3px 10px; background:rgba(25,118,210,0.12); border-radius:3px; font-size:8px; font-weight:700; color:#1976d2; }' +
    '.fg-kristy-sm { padding:3px 10px; background:rgba(11,78,162,0.08); border-radius:3px; font-size:8px; font-weight:700; color:#0b4ea2; }' +
    '.fg-fields { margin-bottom:20px; }' +
    '.fg-field-row { display:flex; gap:8px; margin-bottom:8px; }' +
    '.fg-field-row input { flex:1; padding:10px 12px; border:1px solid rgba(11,78,162,0.2); border-radius:6px; font-size:13px; background:rgba(255,255,255,0.8); }' +
    '.fg-field-row input:focus { outline:none; border-color:#0b4ea2; box-shadow:0 0 0 2px rgba(11,78,162,0.1); }' +
    '.fg-generate-btn { width:100%; padding:14px; border:none; border-radius:8px; background:#0b4ea2; color:white; font-weight:700; font-size:15px; cursor:pointer; transition:0.2s; }' +
    '.fg-generate-btn:hover:not(:disabled) { background:#0a3d7f; transform:translateY(-1px); box-shadow:0 4px 16px rgba(11,78,162,0.3); }' +
    '.fg-generate-btn:disabled { background:#999; cursor:not-allowed; }' +
    '.fg-status { text-align:center; margin-top:12px; font-size:13px; font-weight:600; min-height:20px; }';
  document.head.appendChild(style);
})();
