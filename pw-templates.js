// pw-templates.js — Modern Template Generator
// Loaded by mission-control.html via <script src="pw-templates.js"></script>

function pwBuildModern(d) {
  // d = { addr, city, state, zip, fullAddr, priceF, beds, baths, sqftF, year, lot,
  //        desc, agent, agentCompany, agentEmail, heroSrc, parallaxSrc,
  //        heroSlidesHtml, galleryTrackHtml, mapEmbed, mapLink,
  //        bannerText, virtualTour, accentColor, accentDark }

  var css = `/* ===== RESET & BASE ===== */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Lato',sans-serif;color:#333;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
img{max-width:100%;height:auto;display:block;}
a{text-decoration:none;color:inherit;}

/* ===== COLOR SCHEME ===== */
:root{
  --accent:ACCENT_COLOR;
  --accent-dark:ACCENT_DARK;
  --dark-bg:#1a1a2e;
  --darker-bg:#12121f;
  --text-light:#fff;
  --text-dark:#1a1a2e;
  --text-muted:#999;
  --section-bg:#f5f5f5;
}

/* ===== BANNER BADGE ===== */
.banner-badge{
  position:absolute;top:20px;left:20px;z-index:10;
  padding:10px 24px;font-size:12px;letter-spacing:3px;font-weight:600;
  text-transform:uppercase;color:#fff;
  background:var(--accent);
  box-shadow:0 4px 20px rgba(230,126,34,0.4);
}

/* ===== SOCIAL SIDEBAR ===== */
.social-sidebar{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:90;display:flex;flex-direction:column;}
.social-sidebar a{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;transition:opacity 0.3s;}
.social-sidebar a:hover{opacity:0.7;}
.social-fb{background:#3b5998;}.social-x{background:#000;}.social-li{background:#0077b5;}.social-pi{background:#bd081c;}.social-em{background:#555;}

/* ===== HERO — SPLIT SCREEN ===== */
.hero{position:relative;height:100vh;min-height:600px;display:flex;}
.hero-slide-area{
  flex:1;position:relative;overflow:hidden;
}
.hero-slides{position:absolute;inset:0;display:flex;transition:transform 1s cubic-bezier(0.25,0.46,0.45,0.94);}
.hero-slide{min-width:100%;height:100%;background-size:cover;background-position:center;}
.hero-slide-dots{
  position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:5;
  display:flex;gap:8px;
}
.hero-slide-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.3);cursor:pointer;transition:all 0.3s;}
.hero-slide-dot.active{background:var(--accent);}

.hero-detail-area{
  width:42%;background:#fff;display:flex;flex-direction:column;justify-content:center;
  padding:60px 50px;position:relative;
}
.hero-label{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:4px;color:var(--text-muted);text-transform:uppercase;font-weight:300;}
.hero-street{font-family:'Oswald',sans-serif;font-size:clamp(30px,4vw,48px);font-weight:600;color:var(--text-dark);line-height:1.1;margin:12px 0 6px;text-transform:uppercase;}
.hero-city{font-size:15px;color:#777;letter-spacing:2px;font-weight:300;}
.hero-accent-line{width:40px;height:3px;background:var(--accent);margin:20px 0;}
.hero-price{font-family:'Oswald',sans-serif;font-size:clamp(32px,4vw,48px);font-weight:300;color:var(--text-dark);}
.hero-stats-mini{display:flex;gap:24px;margin-top:20px;}
.hero-stat{text-align:left;}
.hero-stat-num{font-family:'Oswald',sans-serif;font-size:24px;font-weight:500;color:var(--text-dark);}
.hero-stat-label{font-size:11px;letter-spacing:2px;color:var(--text-muted);text-transform:uppercase;}
.hero-buttons{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;}
.hero-btn{
  padding:14px 28px;background:var(--accent);color:#fff;
  font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:2px;font-weight:500;
  text-transform:uppercase;transition:background 0.3s;border:none;cursor:pointer;
}
.hero-btn:hover{background:var(--accent-dark);}
.hero-btn-outline{
  padding:14px 28px;border:2px solid var(--text-dark);color:var(--text-dark);background:transparent;
  font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:2px;font-weight:500;
  text-transform:uppercase;transition:all 0.3s;cursor:pointer;
}
.hero-btn-outline:hover{background:var(--text-dark);color:#fff;}

/* ===== STICKY NAV ===== */
.site-nav{
  position:sticky;top:0;z-index:100;
  background:var(--dark-bg);
  display:flex;align-items:center;justify-content:center;
  border-bottom:1px solid rgba(255,255,255,0.06);
}
.nav-links{display:flex;gap:0;}
.nav-links a{
  padding:16px 24px;font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:3px;font-weight:400;
  color:rgba(255,255,255,0.5);text-transform:uppercase;transition:color 0.3s;
}
.nav-links a:hover{color:var(--text-light);}

/* ===== ABOUT ===== */
.about{padding:80px 20px;text-align:center;background:#fff;}
.about-inner{max-width:800px;margin:0 auto;}
.section-accent{width:40px;height:3px;background:var(--accent);margin:0 auto 20px;}
.section-heading{font-family:'Oswald',sans-serif;font-size:32px;font-weight:500;color:var(--text-dark);text-transform:uppercase;letter-spacing:4px;margin-bottom:30px;}
.about-desc{font-size:16px;line-height:2;color:#555;font-weight:300;text-align:justify;}

/* ===== STATS BAR ===== */
.stats{background:var(--section-bg);padding:0;}
.stats-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.stat-item{padding:40px 20px;text-align:center;border-right:1px solid rgba(0,0,0,0.06);}
.stat-item:last-child{border-right:none;}
.stat-number{font-family:'Oswald',sans-serif;font-size:clamp(36px,5vw,56px);font-weight:300;color:var(--text-dark);line-height:1;}
.stat-label{font-size:11px;letter-spacing:4px;color:var(--text-muted);text-transform:uppercase;margin-top:10px;font-weight:400;}

/* ===== GALLERY ===== */
.gallery{padding:60px 20px;background:#fff;text-align:center;}
.gallery-slider{position:relative;overflow:hidden;max-width:1000px;margin:0 auto;}
.gallery-track{display:flex;transition:transform 0.5s ease;}
.gallery-track img{min-width:100%;height:500px;object-fit:cover;user-select:none;}
.gallery-controls{display:flex;justify-content:center;gap:12px;margin-top:20px;}
.gallery-controls button{
  width:44px;height:44px;border-radius:0;border:none;
  background:var(--accent);cursor:pointer;font-size:16px;color:#fff;
  transition:all 0.2s;display:flex;align-items:center;justify-content:center;
}
.gallery-controls button:hover{background:var(--accent-dark);}
.gallery-dots{display:flex;justify-content:center;gap:6px;margin-top:14px;}
.gallery-dot{width:8px;height:8px;background:rgba(0,0,0,0.1);cursor:pointer;transition:all 0.3s;}
.gallery-dot.active{background:var(--accent);}

/* ===== PARALLAX CTA ===== */
.cta-parallax{
  position:relative;height:350px;
  background-size:cover;background-position:center;background-attachment:fixed;
  display:flex;align-items:center;justify-content:center;
}
.cta-overlay{position:absolute;inset:0;background:rgba(26,26,46,0.7);}
.cta-content{position:relative;z-index:2;text-align:center;}
.cta-text{font-family:'Oswald',sans-serif;font-size:clamp(24px,4vw,42px);font-weight:300;color:var(--text-light);letter-spacing:4px;text-transform:uppercase;margin-bottom:24px;}
.cta-btn{
  display:inline-block;padding:16px 40px;background:var(--accent);color:#fff;
  font-family:'Oswald',sans-serif;font-size:14px;font-weight:500;letter-spacing:3px;text-transform:uppercase;
  transition:background 0.3s;
}
.cta-btn:hover{background:var(--accent-dark);}

/* ===== LOCATION ===== */
.location{padding:60px 20px;text-align:center;background:var(--section-bg);}
.location-address{font-size:15px;color:#777;letter-spacing:1px;margin-top:12px;}
.location-address a{color:var(--accent);font-weight:700;}
.location iframe{width:100%;max-width:1000px;height:450px;border:none;margin-top:20px;box-shadow:0 4px 20px rgba(0,0,0,0.06);}

/* ===== TEAM ===== */
.team{padding:80px 20px;background:#fff;text-align:center;}
.team-inner{max-width:1000px;margin:0 auto;}
.team-heading{font-family:'Oswald',sans-serif;font-size:32px;font-weight:500;color:var(--text-dark);text-transform:uppercase;letter-spacing:4px;margin-bottom:50px;}
.team-grid{display:flex;justify-content:center;align-items:flex-start;gap:60px;flex-wrap:wrap;}
.team-member{flex:1;min-width:280px;max-width:400px;text-align:center;}
.team-photo{width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 20px;box-shadow:0 6px 30px rgba(0,0,0,0.12);border:4px solid #fff;}
.team-photo-placeholder{width:140px;height:140px;border-radius:50%;margin:0 auto 20px;background:linear-gradient(135deg,#ddd,#eee);display:flex;align-items:center;justify-content:center;font-size:40px;color:#bbb;border:4px solid #fff;box-shadow:0 6px 30px rgba(0,0,0,0.12);}
.team-name{font-family:'Oswald',sans-serif;font-size:22px;font-weight:500;color:var(--text-dark);}
.team-title{font-size:13px;color:#777;margin-top:2px;}
.team-license{font-size:12px;color:#999;}
.team-company{font-size:13px;color:#666;margin-top:6px;font-weight:400;}
.team-contact-line{font-size:13px;color:#555;margin-top:3px;}
.team-contact-line a{color:var(--accent);font-weight:700;}
.team-website{font-size:12px;margin-top:3px;}
.team-website a{color:var(--accent);}
.team-logos{display:flex;justify-content:center;align-items:center;gap:30px;margin-top:40px;flex-wrap:wrap;}
.team-logos img{height:50px;object-fit:contain;opacity:0.8;}

/* ===== CONTACT ===== */
.contact{padding:80px 20px;background:var(--dark-bg);color:var(--text-light);}
.contact-inner{max-width:900px;margin:0 auto;}
.contact-heading{text-align:center;font-family:'Oswald',sans-serif;font-size:32px;font-weight:500;text-transform:uppercase;letter-spacing:4px;margin-bottom:40px;}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;}
.contact-left{display:flex;flex-direction:column;gap:16px;}
.contact-input{
  padding:14px 18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  color:#fff;font-size:15px;font-family:'Lato',sans-serif;
  transition:border-color 0.3s;width:100%;
}
.contact-input:focus{outline:none;border-color:var(--accent);}
.contact-input::placeholder{color:rgba(255,255,255,0.3);}
textarea.contact-input{resize:vertical;min-height:100%;font-family:'Lato',sans-serif;}
.contact-right{display:flex;}
.contact-right textarea{flex:1;}
.contact-disclaimer{grid-column:1/-1;font-size:9px;color:rgba(255,255,255,0.2);line-height:1.5;margin-top:8px;}
.contact-submit{
  grid-column:1/-1;justify-self:center;
  padding:14px 50px;border:none;
  background:var(--accent);color:#fff;font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:3px;
  font-weight:500;text-transform:uppercase;
  cursor:pointer;transition:all 0.3s;margin-top:10px;
}
.contact-submit:hover{background:var(--accent-dark);}

/* ===== FOOTER ===== */
.footer{padding:20px;text-align:center;background:var(--darker-bg);font-size:11px;color:rgba(255,255,255,0.2);}

/* ===== RESPONSIVE ===== */
@media(max-width:768px){
  .hero{flex-direction:column;height:auto;}
  .hero-slide-area{height:50vh;min-height:300px;width:100%;}
  .hero-detail-area{width:100%;padding:40px 24px;}
  .stats-grid{grid-template-columns:repeat(2,1fr);}
  .stat-item{border-right:none;border-bottom:1px solid rgba(0,0,0,0.06);}
  .contact-grid{grid-template-columns:1fr;}
  .nav-links{display:none;}
  .team-grid{flex-direction:column;align-items:center;}
  .gallery-track img{height:300px;}
}
@media(max-width:480px){
  .hero-stats-mini{flex-wrap:wrap;gap:16px;}
  .hero-buttons{flex-direction:column;}
}`;

  // Replace dynamic CSS vars
  css = css.replace('ACCENT_COLOR', d.accentColor || '#e67e22');
  css = css.replace('ACCENT_DARK', d.accentDark || '#d35400');

  var body = `<!-- Social Sharing Sidebar -->
<div class="social-sidebar">
  <a href="#" class="social-fb"><i class="fab fa-facebook-f"></i></a>
  <a href="#" class="social-x"><i class="fab fa-x-twitter"></i></a>
  <a href="#" class="social-li"><i class="fab fa-linkedin-in"></i></a>
  <a href="#" class="social-pi"><i class="fab fa-pinterest-p"></i></a>
  <a href="#" class="social-em"><i class="fas fa-envelope"></i></a>
</div>

<!-- Banner Badge -->
<div class="banner-badge">BANNER_TEXT</div>

<!-- Hero — Split Screen -->
<section class="hero" id="home">
  <!-- Left: Slideshow -->
  <div class="hero-slide-area">
    <div class="hero-slides" id="heroSlides">HERO_SLIDES_HTML</div>
  </div>

  <!-- Right: Details -->
  <div class="hero-detail-area">
    <div class="hero-label">The Property</div>
    <h1 class="hero-street">ADDR_STREET</h1>
    <div class="hero-city">ADDR_CITYSTATE</div>
    <div class="hero-accent-line"></div>
    <div class="hero-price">PRICE_F</div>
    <div class="hero-stats-mini">
      HERO_STAT_BEDS
      HERO_STAT_BATHS
      HERO_STAT_SQFT
      HERO_STAT_YEAR
    </div>
    <div class="hero-buttons">
      <a href="#about" class="hero-btn">View Details</a>
      <a href="VIRTUAL_TOUR_LINK" target="_blank" class="hero-btn-outline">Virtual Tour</a>
    </div>
  </div>
</section>

<!-- Sticky Nav -->
<nav class="site-nav">
  <div class="nav-links">
    <a href="#home">Home</a>
    <a href="#about">Overview</a>
    <a href="#gallery">Gallery</a>
    <a href="#location">Location</a>
    <a href="#team">Team</a>
    <a href="#contact">Contact</a>
  </div>
</nav>

<!-- Stats (repeated for scroll context) -->
<section class="stats">
  <div class="stats-grid">
    STAT_BEDS
    STAT_BATHS
    STAT_SQFT
    STAT_YEAR
  </div>
</section>

<!-- About -->
<section class="about" id="about">
  <div class="about-inner">
    <div class="section-accent"></div>
    <h2 class="section-heading">Residence</h2>
    DESC_BLOCK
  </div>
</section>

<!-- Gallery -->
<section class="gallery" id="gallery">
  <div class="section-accent"></div>
  <h2 class="section-heading">Gallery</h2>
  <div style="height:20px;"></div>
  <div class="gallery-slider">
    <div class="gallery-track" id="galleryTrack">GALLERY_TRACK_HTML</div>
    <div class="gallery-controls">
      <button onclick="galleryPrev()"><i class="fas fa-chevron-left"></i></button>
      <button onclick="galleryNext()"><i class="fas fa-chevron-right"></i></button>
    </div>
    <div class="gallery-dots" id="galleryDots"></div>
  </div>
</section>

<!-- CTA Parallax -->
<section class="cta-parallax" style="background-image:url('PARALLAX_SRC');">
  <div class="cta-overlay"></div>
  <div class="cta-content">
    <div class="cta-text">Schedule Your Private Tour</div>
    <a href="#contact" class="cta-btn">Get In Touch</a>
  </div>
</section>

<!-- Location -->
<section class="location" id="location">
  <div class="section-accent"></div>
  <h2 class="section-heading">Location</h2>
  <p class="location-address">
    FULL_ADDR<br>
    <a href="MAP_LINK" target="_blank">View on Google Maps</a>
  </p>
  MAP_EMBED
</section>

<!-- Team -->
<section class="team" id="team">
  <div class="team-inner">
    <div class="section-accent"></div>
    <h2 class="team-heading">Who Are We Anyway?</h2>
    <div class="team-grid">
      <!-- REALTOR (Left) -->
      <div class="team-member">
        <div class="team-photo-placeholder"><i class="fas fa-user"></i></div>
        <div class="team-name">AGENT_NAME</div>
        <div class="team-title">Realtor</div>
        <div class="team-company">AGENT_COMPANY</div>
        <div class="team-contact-line"><a href="mailto:AGENT_EMAIL">AGENT_EMAIL</a></div>
      </div>
      <!-- LENDER (Right — always Kristy) -->
      <div class="team-member">
        <img src="hero-headshot.jpg" alt="Kristy Flach" class="team-photo">
        <div class="team-name">Kristy Flach</div>
        <div class="team-title">Certified Mortgage Advisor &amp; Loan Originator</div>
        <div class="team-license">NMLS #2632259</div>
        <div class="team-company">Paramount Residential Mortgage Group, Inc.</div>
        <div class="team-contact-line"><i class="fas fa-phone" style="font-size:11px;margin-right:4px;"></i> (513) 268-3891</div>
        <div class="team-contact-line"><a href="mailto:kflach@prmg.net">kflach@prmg.net</a></div>
        <div class="team-contact-line"><a href="mailto:kflach@kristyflach.com">kflach@kristyflach.com</a></div>
        <div class="team-website"><a href="https://kristyflach.com" target="_blank">kristyflach.com</a></div>
        <div class="team-website"><a href="https://kflach.myprmg.net" target="_blank">kflach.myprmg.net</a></div>
      </div>
    </div>
    <div class="team-logos">
      <img src="PRMG-Logo.png" alt="PRMG">
      <img src="CMA%20Logo.png" alt="Certified Mortgage Advisor">
      <img src="equal-housing-logo.png" alt="Equal Housing Opportunity">
    </div>
  </div>
</section>

<!-- Contact -->
<section class="contact" id="contact">
  <div class="contact-inner">
    <div class="section-accent" style="margin:0 auto 10px;"></div>
    <h2 class="contact-heading">Contact</h2>
    <form class="contact-grid" id="contactForm">
      <div class="contact-left">
        <input type="text" class="contact-input" placeholder="Name" name="name" required>
        <input type="email" class="contact-input" placeholder="Email" name="email" required>
        <input type="tel" class="contact-input" placeholder="Phone" name="phone">
      </div>
      <div class="contact-right">
        <textarea class="contact-input" placeholder="Message" name="message" rows="6"></textarea>
      </div>
      <div class="contact-disclaimer">
        By submitting your email address and mobile number, you consent to receiving email and SMS messages from Kristy Flach using an automatic system. Consent to receive SMS messages is not a condition of purchase. Message and data rates may apply. You may unsubscribe at any time.
      </div>
      <button type="submit" class="contact-submit">Send Message</button>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  &copy; 2026 Paramount Residential Mortgage Group, Inc. ("PRMG") NMLS #75243. Equal Housing Opportunity. All applications are subject to underwriting guidelines and approval.
</footer>`;

  // Replace all dynamic placeholders
  body = body.replace('HERO_SLIDES_HTML', d.heroSlidesHtml || '');
  body = body.replace('ADDR_STREET', d.addr || 'Property Address');
  body = body.replace(/ADDR_CITYSTATE/g, (d.city||'')+', '+(d.state||'')+' '+(d.zip||''));
  body = body.replace(/FULL_ADDR/g, d.fullAddr || '');
  body = body.replace('PRICE_F', d.priceF || '');
  
  // Hero mini stats
  body = body.replace('HERO_STAT_BEDS', d.beds ? '<div class="hero-stat"><div class="hero-stat-num">'+d.beds+'</div><div class="hero-stat-label">Beds</div></div>' : '');
  body = body.replace('HERO_STAT_BATHS', d.baths ? '<div class="hero-stat"><div class="hero-stat-num">'+d.baths+'</div><div class="hero-stat-label">Baths</div></div>' : '');
  body = body.replace('HERO_STAT_SQFT', d.sqftF ? '<div class="hero-stat"><div class="hero-stat-num">'+d.sqftF+'</div><div class="hero-stat-label">Sqft</div></div>' : '');
  body = body.replace('HERO_STAT_YEAR', d.year ? '<div class="hero-stat"><div class="hero-stat-num">'+d.year+'</div><div class="hero-stat-label">Built</div></div>' : '');

  // Stats bar
  body = body.replace('STAT_BEDS', d.beds ? '<div class="stat-item"><div class="stat-number">'+d.beds+'</div><div class="stat-label">Bedrooms</div></div>' : '');
  body = body.replace('STAT_BATHS', d.baths ? '<div class="stat-item"><div class="stat-number">'+d.baths+'</div><div class="stat-label">Bathrooms</div></div>' : '');
  body = body.replace('STAT_SQFT', d.sqftF ? '<div class="stat-item"><div class="stat-number">'+d.sqftF+'</div><div class="stat-label">Square Feet</div></div>' : '');
  body = body.replace('STAT_YEAR', d.year ? '<div class="stat-item"><div class="stat-number">'+d.year+'</div><div class="stat-label">Built In</div></div>' : '');

  // Description
  body = body.replace('DESC_BLOCK', d.desc ? '<p class="about-desc">'+d.desc+'</p>' : '');

  // Gallery
  body = body.replace('GALLERY_TRACK_HTML', d.galleryTrackHtml || '');
  
  // Parallax
  body = body.replace('PARALLAX_SRC', d.parallaxSrc || d.heroSrc || '');
  
  // Map
  body = body.replace('MAP_EMBED', d.mapEmbed || '');
  body = body.replace('MAP_LINK', d.mapLink || '#');
  
  // Agent
  body = body.replace('AGENT_NAME', d.agent || 'Listing Agent');
  body = body.replace('AGENT_COMPANY', d.agentCompany || '');
  body = body.replace(/AGENT_EMAIL/g, d.agentEmail || '');
  
  // Virtual tour
  body = body.replace('VIRTUAL_TOUR_LINK', d.virtualTour || '#');
  
  // Banner
  body = body.replace('BANNER_TEXT', d.bannerText || 'Just Listed');

  // Hide banner if "None"
  if (!d.bannerText || d.bannerText === 'None') {
    body = body.replace(/<div class="banner-badge">[^<]*<\/div>/, '');
  }

  // Hide virtual tour button if no link
  if (!d.virtualTour) {
    body = body.replace(/<a href="#"[^>]*class="hero-btn-outline">Virtual Tour<\/a>/, '');
  }

  var scriptContent = `// Gallery slider
var currentSlide=0;
var track=document.getElementById('galleryTrack');
var imgs=track?track.querySelectorAll('img'):[];
var totalSlides=imgs.length;
var dotsEl=document.getElementById('galleryDots');

function buildDots(){
  if(!dotsEl||!totalSlides)return;
  for(var i=0;i<totalSlides;i++){
    var d=document.createElement('div');
    d.className='gallery-dot'+(i===0?' active':'');
    d.setAttribute('data-i',i);
    d.onclick=function(){goToSlide(parseInt(this.getAttribute('data-i')));};
    dotsEl.appendChild(d);
  }
}
function updateDots(){
  if(!dotsEl)return;
  var dots=dotsEl.querySelectorAll('.gallery-dot');
  dots.forEach(function(d,i){d.className='gallery-dot'+(i===currentSlide?' active':'');});
}
function goToSlide(n){
  currentSlide=n;
  if(currentSlide>=totalSlides)currentSlide=0;
  if(currentSlide<0)currentSlide=totalSlides-1;
  track.style.transform='translateX(-'+currentSlide*100+'%)';
  updateDots();
}
function galleryNext(){goToSlide(currentSlide+1);}
function galleryPrev(){goToSlide(currentSlide-1);}
buildDots();
setInterval(function(){galleryNext();},4000);

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var target=document.querySelector(this.getAttribute('href'));
    if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
  });
});`;

  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + (d.fullAddr || 'Property Website') + '</title>' +
    '<meta name="description" content="' + (d.desc || '').substring(0,160) + '">' +
    '<meta property="og:title" content="' + (d.fullAddr || '') + '">' +
    '<meta property="og:image" content="' + (d.heroSrc || '') + '">' +
    '<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">' +
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' + body + '<script>' + scriptContent + '<\/script></body></html>';
}


// ===============================================
// AUTO-GENERATED TEMPLATE FUNCTIONS
// ===============================================

function pwBuildCavallo(d) {
  var css = `/* ===== RESET & BASE ===== */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Raleway',sans-serif;color:#333;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
img{max-width:100%;height:auto;display:block;}
a{text-decoration:none;color:inherit;}

/* ===== COLOR SCHEME (Blue default) ===== */
:root{
  --primary:ACCENT_COLOR;
  --primary-dark:ACCENT_DARK;
  --overlay:rgba(10,20,40,0.55);
  --text-light:#fff;
  --text-dark:#1a1a2e;
  --section-bg:#f9f9f9;
  --dark-bg:#0d1b2a;
  --accent-line:rgba(255,255,255,0.25);
}

/* ===== HERO SECTION ===== */
.hero{
  position:relative;
  height:100vh;
  min-height:600px;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  overflow:hidden;
}
.hero-bg{
  position:absolute;inset:0;
  background-size:cover;background-position:center;
  transform:scale(1.05);
  animation:heroZoom 20s ease-in-out infinite alternate;
}
@keyframes heroZoom{0%{transform:scale(1.05);}100%{transform:scale(1.12);}}
.hero-overlay{position:absolute;inset:0;background:var(--overlay);}
.hero-content{position:relative;z-index:2;padding:20px;max-width:800px;}
.hero-line{width:60px;height:1px;background:var(--accent-line);margin:10px auto;}
.hero-label{font-size:13px;letter-spacing:5px;color:rgba(255,255,255,0.6);font-weight:400;text-transform:uppercase;}
.hero-street{font-size:clamp(32px,6vw,58px);font-weight:700;color:var(--text-light);line-height:1.1;margin:8px 0;}
.hero-city{font-size:16px;letter-spacing:4px;color:rgba(255,255,255,0.65);font-weight:400;text-transform:uppercase;}
.hero-tagline{font-size:13px;letter-spacing:6px;color:rgba(255,255,255,0.45);margin-top:6px;font-weight:600;}
.hero-buttons{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:28px;}
.hero-btn{
  padding:12px 28px;border:1px solid rgba(255,255,255,0.35);
  color:var(--text-light);font-size:11px;letter-spacing:3px;font-weight:600;
  text-transform:uppercase;font-family:'Raleway',sans-serif;
  transition:all 0.3s;background:transparent;cursor:pointer;
}
.hero-btn:hover{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.6);}

/* ===== BANNER (Just Listed, Sold, etc) ===== */
.banner-badge{
  position:absolute;top:20px;left:20px;z-index:10;
  padding:10px 24px;font-size:12px;letter-spacing:3px;font-weight:700;
  text-transform:uppercase;color:#fff;
  background:var(--primary);
  box-shadow:0 4px 20px rgba(0,0,0,0.3);
}

/* ===== STICKY NAV ===== */
.site-nav{
  position:sticky;top:0;z-index:100;
  background:var(--dark-bg);
  padding:0 40px;
  display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid rgba(255,255,255,0.06);
}
.nav-brand{font-size:11px;letter-spacing:1.5px;color:rgba(255,255,255,0.5);font-weight:600;padding:18px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px;}
.nav-links{display:flex;gap:0;}
.nav-links a{
  padding:18px 20px;font-size:11px;letter-spacing:2.5px;font-weight:600;
  color:rgba(255,255,255,0.5);text-transform:uppercase;transition:color 0.3s;
}
.nav-links a:hover{color:var(--text-light);}

/* ===== STATS PARALLAX BAR ===== */
.stats-bar{
  position:relative;
  background-size:cover;background-position:center;background-attachment:fixed;
  padding:0;
}
.stats-overlay{
  background:rgba(10,20,40,0.75);
  padding:50px 20px;
}
.stats-grid{
  max-width:900px;margin:0 auto;
  display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center;
}
.stat-number{font-size:clamp(32px,5vw,52px);font-weight:300;color:var(--text-light);line-height:1;}
.stat-label{font-size:11px;letter-spacing:4px;color:rgba(255,255,255,0.45);text-transform:uppercase;margin-top:8px;font-weight:600;}

/* ===== ABOUT / RESIDENCE SECTION ===== */
.about{padding:80px 20px;text-align:center;background:#fff;}
.about-inner{max-width:800px;margin:0 auto;}
.section-line{width:50px;height:1px;background:rgba(0,0,0,0.15);margin:0 auto 20px;}
.section-heading{font-size:28px;letter-spacing:8px;font-weight:300;color:var(--text-dark);text-transform:uppercase;margin-bottom:8px;}
.about-price{font-size:clamp(36px,5vw,54px);font-weight:300;color:var(--text-dark);margin:20px 0 30px;font-style:italic;}
.about-desc{font-size:16px;line-height:1.9;color:#555;font-weight:400;text-align:justify;}

/* ===== GALLERY ===== */
.gallery{background:var(--section-bg);padding:60px 0;}
.gallery-title{text-align:center;font-size:28px;letter-spacing:8px;font-weight:300;color:var(--text-dark);margin-bottom:40px;}
.gallery-slider{position:relative;overflow:hidden;max-width:1000px;margin:0 auto;}
.gallery-track{display:flex;transition:transform 0.5s ease;cursor:grab;}
.gallery-track img{min-width:100%;height:500px;object-fit:cover;user-select:none;-webkit-user-drag:none;}
.gallery-nav{display:flex;justify-content:center;gap:12px;margin-top:20px;}
.gallery-nav button{
  width:40px;height:40px;border-radius:50%;border:1px solid rgba(0,0,0,0.15);
  background:#fff;cursor:pointer;font-size:16px;color:#333;transition:all 0.2s;
  display:flex;align-items:center;justify-content:center;
}
.gallery-nav button:hover{background:var(--primary);color:#fff;border-color:var(--primary);}
.gallery-dots{display:flex;justify-content:center;gap:6px;margin-top:16px;}
.gallery-dot{width:8px;height:8px;border-radius:50%;background:rgba(0,0,0,0.15);cursor:pointer;transition:all 0.3s;}
.gallery-dot.active{background:var(--primary);transform:scale(1.2);}

/* ===== LOCATION ===== */
.location{padding:80px 20px;text-align:center;background:#fff;}
.location iframe{width:100%;max-width:1000px;height:450px;border:none;border-radius:4px;margin-top:30px;box-shadow:0 4px 20px rgba(0,0,0,0.08);}
.location-address{font-size:15px;color:#777;letter-spacing:1px;margin-top:12px;}
.location-address a{color:var(--primary);font-weight:600;}

/* ===== WHO ARE WE / TEAM ===== */
.team{padding:80px 20px;background:var(--section-bg);text-align:center;}
.team-inner{max-width:1000px;margin:0 auto;}
.team-heading{font-size:28px;letter-spacing:8px;font-weight:300;color:var(--text-dark);margin-bottom:50px;}

/* Co-brand layout */
.team-grid{display:flex;justify-content:center;align-items:flex-start;gap:60px;flex-wrap:wrap;}
.team-member{flex:1;min-width:280px;max-width:400px;text-align:center;}
.team-photo{width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 20px;box-shadow:0 6px 30px rgba(0,0,0,0.12);border:4px solid #fff;}
.team-photo-placeholder{width:140px;height:140px;border-radius:50%;margin:0 auto 20px;background:linear-gradient(135deg,#ddd,#eee);display:flex;align-items:center;justify-content:center;font-size:40px;color:#bbb;border:4px solid #fff;box-shadow:0 6px 30px rgba(0,0,0,0.12);}
.team-name{font-size:20px;font-weight:600;color:var(--text-dark);margin-bottom:2px;}
.team-title{font-size:13px;color:#777;letter-spacing:1px;margin-bottom:4px;}
.team-license{font-size:12px;color:#999;letter-spacing:0.5px;}
.team-company{font-size:13px;color:#666;margin-top:6px;font-weight:500;}
.team-contact-line{font-size:13px;color:#555;margin-top:3px;}
.team-contact-line a{color:var(--primary);font-weight:500;}
.team-website{font-size:12px;color:var(--primary);margin-top:3px;}

/* Logos row */
.team-logos{display:flex;justify-content:center;align-items:center;gap:30px;margin-top:40px;flex-wrap:wrap;}
.team-logos img{height:50px;object-fit:contain;opacity:0.8;}

/* ===== CONTACT FORM ===== */
.contact{padding:80px 20px;background:var(--dark-bg);color:var(--text-light);}
.contact-inner{max-width:900px;margin:0 auto;}
.contact-heading{text-align:center;font-size:28px;letter-spacing:8px;font-weight:300;margin-bottom:40px;}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;}
.contact-left{display:flex;flex-direction:column;gap:16px;}
.contact-input{
  padding:14px 18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  border-radius:2px;color:#fff;font-size:15px;font-family:'Raleway',sans-serif;
  transition:border-color 0.3s;width:100%;
}
.contact-input:focus{outline:none;border-color:var(--primary);}
.contact-input::placeholder{color:rgba(255,255,255,0.35);}
textarea.contact-input{resize:vertical;min-height:100%;font-family:'Raleway',sans-serif;}
.contact-right{display:flex;}
.contact-right textarea{flex:1;}
.contact-disclaimer{grid-column:1/-1;font-size:9px;color:rgba(255,255,255,0.3);line-height:1.5;margin-top:8px;}
.contact-submit{
  grid-column:1/-1;justify-self:center;
  padding:14px 50px;border:1px solid rgba(255,255,255,0.3);
  background:transparent;color:var(--text-light);font-size:12px;letter-spacing:4px;
  font-weight:600;text-transform:uppercase;font-family:'Raleway',sans-serif;
  cursor:pointer;transition:all 0.3s;margin-top:10px;
}
.contact-submit:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.6);}

/* ===== SOCIAL SHARING SIDEBAR ===== */
.social-sidebar{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:90;display:flex;flex-direction:column;}
.social-sidebar a{
  width:36px;height:36px;display:flex;align-items:center;justify-content:center;
  color:#fff;font-size:14px;transition:opacity 0.3s;
}
.social-sidebar a:hover{opacity:0.7;}
.social-fb{background:#3b5998;}
.social-x{background:#000;}
.social-li{background:#0077b5;}
.social-pi{background:#bd081c;}
.social-em{background:#555;}

/* ===== FOOTER ===== */
.footer{padding:20px;text-align:center;background:#0a1420;font-size:11px;color:rgba(255,255,255,0.25);}
.footer a{color:rgba(255,255,255,0.4);}

/* ===== RESPONSIVE ===== */
@media(max-width:768px){
  .stats-grid{grid-template-columns:repeat(2,1fr);gap:30px;}
  .contact-grid{grid-template-columns:1fr;}
  .nav-links{display:none;}
  .team-grid{flex-direction:column;align-items:center;}
  .gallery-track img{height:300px;}
  .hero-btn{padding:10px 20px;font-size:10px;}
}
@media(max-width:480px){
  .stats-grid{grid-template-columns:repeat(2,1fr);gap:20px;}
  .hero-buttons{flex-direction:column;align-items:center;}
}`;
  css = css.replace('ACCENT_COLOR', d.accentColor || '#3a7bd5');
  css = css.replace('ACCENT_DARK', d.accentDark || '#2a5fa0');

  var body = `<!-- Social Sharing Sidebar -->
<div class="social-sidebar">
  <a href="#" class="social-fb"><i class="fab fa-facebook-f"></i></a>
  <a href="#" class="social-x"><i class="fab fa-x-twitter"></i></a>
  <a href="#" class="social-li"><i class="fab fa-linkedin-in"></i></a>
  <a href="#" class="social-pi"><i class="fab fa-pinterest-p"></i></a>
  <a href="#" class="social-em"><i class="fas fa-envelope"></i></a>
</div>

<!-- Banner Badge -->
<div class="banner-badge">BANNER_TEXT</div>

<!-- Hero Section -->
<section class="hero" id="home">
  <div class="hero-bg" style="background-image:url('HERO_SRC');"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-line"></div>
    <div class="hero-label">The Property</div>
    <div class="hero-line"></div>
    <h1 class="hero-street">ADDR_STREET</h1>
    <div class="hero-line"></div>
    <div class="hero-city">ADDR_CITYSTATE_SHORT</div>
    <div class="hero-line"></div>
    <div class="hero-tagline">TAGLINE</div>
    <div class="hero-buttons">
      <a href="#about" class="hero-btn">View Details</a>
      <a href="#gallery" class="hero-btn">Gallery</a>
      <a href="VIRTUAL_TOUR_LINK" target="_blank" class="hero-btn">Virtual Tour</a>
      <a href="#contact" class="hero-btn">Schedule a Visit</a>
    </div>
  </div>
</section>

<!-- Sticky Navigation -->
<nav class="site-nav">
  <div class="nav-brand">FULL_ADDR</div>
  <div class="nav-links">
    <a href="#home">Home</a>
    <a href="#about">Overview</a>
    <a href="#gallery">Gallery</a>
    <a href="#location">Location</a>
    <a href="#contact">Contact</a>
  </div>
</nav>

<!-- Stats Parallax Bar -->
<section class="stats-bar" style="background-image:url('PARALLAX_SRC');">
  <div class="stats-overlay">
    <div class="stats-grid">
      <div><div class="stat-number">4</div><div class="stat-label">Bedrooms</div></div>
      <div><div class="stat-number">4</div><div class="stat-label">Bathrooms</div></div>
      <div><div class="stat-number">2,912</div><div class="stat-label">Square Feet</div></div>
      <div><div class="stat-number">1993</div><div class="stat-label">Built In</div></div>
    </div>
  </div>
</section>

<!-- About / Residence -->
<section class="about" id="about">
  <div class="about-inner">
    <div class="section-line"></div>
    <h2 class="section-heading">Residence</h2>
    <div class="section-line"></div>
    <div class="about-price">PRICE_F</div>
    <p class="about-desc">DESC_TEXT</p>
  </div>
</section>

<!-- Gallery -->
<section class="gallery" id="gallery">
  <h2 class="gallery-title">Gallery</h2>
  <div class="gallery-slider">
    <div class="gallery-track" id="galleryTrack">GALLERY_TRACK_HTML</div>
    <div class="gallery-nav">
      <button onclick="galleryPrev()"><i class="fas fa-chevron-left"></i></button>
      <button onclick="galleryNext()"><i class="fas fa-chevron-right"></i></button>
    </div>
    <div class="gallery-dots" id="galleryDots"></div>
  </div>
</section>

<!-- Location -->
<section class="location" id="location">
  <div class="section-line"></div>
  <h2 class="section-heading">Location</h2>
  <div class="section-line"></div>
  <p class="location-address">
    FULL_ADDR<br>
    <a href="MAP_LINK" target="_blank">View on Google Maps</a>
  </p>
  MAP_EMBED
</section>

<!-- Who Are We / Team Section — CO-BRANDED: Realtor LEFT -->
<section class="team" id="team">
  <div class="team-inner">
    <div class="section-line"></div>
    <h2 class="team-heading">Who Are We Anyway?</h2>

    <div class="team-grid">
      <!-- REALTOR (Left position) -->
      <div class="team-member">
        <div class="team-photo-placeholder"><i class="fas fa-user"></i></div>
        <div class="team-name">AGENT_NAME</div>
        <div class="team-title">Realtor</div>
        <div class="team-company">AGENT_COMPANY</div>
        <div class="team-contact-line"><a href="mailto:AGENT_EMAIL">AGENT_EMAIL</a></div>
      </div>

      <!-- LENDER (Right position — always Kristy) -->
      <div class="team-member">
        <img src="hero-headshot.jpg" alt="Kristy Flach" class="team-photo">
        <div class="team-name">Kristy Flach</div>
        <div class="team-title">Certified Mortgage Advisor &amp; Loan Originator</div>
        <div class="team-license">NMLS #2632259</div>
        <div class="team-company">Paramount Residential Mortgage Group, Inc.</div>
        <div class="team-contact-line"><i class="fas fa-phone" style="font-size:11px;margin-right:4px;"></i> (513) 268-3891</div>
        <div class="team-contact-line"><a href="mailto:kflach@prmg.net">kflach@prmg.net</a></div>
        <div class="team-contact-line"><a href="mailto:kflach@kristyflach.com">kflach@kristyflach.com</a></div>
        <div class="team-website"><a href="https://kristyflach.com" target="_blank">kristyflach.com</a></div>
        <div class="team-website"><a href="https://kflach.myprmg.net" target="_blank">kflach.myprmg.net</a></div>
      </div>
    </div>

    <!-- Logos -->
    <div class="team-logos">
      <img src="PRMG-Logo.png" alt="PRMG">
      <img src="CMA%20Logo.png" alt="Certified Mortgage Advisor">
      <img src="equal-housing-logo.png" alt="Equal Housing Opportunity">
    </div>
  </div>
</section>

<!-- Contact Form -->
<section class="contact" id="contact">
  <div class="contact-inner">
    <div class="section-line" style="background:rgba(255,255,255,0.15);"></div>
    <h2 class="contact-heading">Contact</h2>
    <form class="contact-grid" id="contactForm">
      <div class="contact-left">
        <input type="text" class="contact-input" placeholder="Name" name="name" required>
        <input type="email" class="contact-input" placeholder="Email" name="email" required>
        <input type="tel" class="contact-input" placeholder="Phone" name="phone">
      </div>
      <div class="contact-right">
        <textarea class="contact-input" placeholder="Message" name="message" rows="6"></textarea>
      </div>
      <div class="contact-disclaimer">
        By submitting your email address and mobile number, you consent to receiving email and SMS messages from Kristy Flach using an automatic system. Consent to receive SMS messages is not a condition of purchase. Message and data rates may apply. You may unsubscribe at any time.
      </div>
      <button type="submit" class="contact-submit">Send Message</button>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  &copy; 2026 Paramount Residential Mortgage Group, Inc. ("PRMG") NMLS #75243. Equal Housing Opportunity. All applications are subject to underwriting guidelines and approval.
</footer>

<!-- Gallery Script -->`;
  
  // Replace dynamic placeholders
  body = body.replace(/HERO_SLIDES_HTML/g, d.heroSlidesHtml || '');
  body = body.replace(/HERO_SRC/g, d.heroSrc || '');
  body = body.replace(/ADDR_STREET/g, d.addr || 'Property Address');
  body = body.replace(/ADDR_CITYSTATE_SHORT/g, (d.city||'')+', '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE_NOSPACE/g, (d.city||'')+' '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE/g, (d.city||'')+', '+(d.state||'')+' '+(d.zip||''));
  body = body.replace(/FULL_ADDR/g, d.fullAddr || '');
  body = body.replace('PRICE_F', d.priceF || '');
  body = body.replace('BANNER_TEXT', d.bannerText || 'Just Listed');
  body = body.replace('TAGLINE', d.tagline || 'One of a Kind');
  body = body.replace('DESC_TEXT', d.desc || '');
  body = body.replace(/GALLERY_TRACK_HTML/g, d.galleryTrackHtml || '');
  body = body.replace(/PHOTO_GRID_HTML/g, d.photoGridHtml || '');
  body = body.replace(/PARALLAX_SRC/g, d.parallaxSrc || d.heroSrc || '');
  body = body.replace('MAP_EMBED', d.mapEmbed || '');
  body = body.replace('MAP_LINK', d.mapLink || '#');
  body = body.replace('AGENT_NAME', d.agent || 'Listing Agent');
  body = body.replace('AGENT_COMPANY', d.agentCompany || '');
  body = body.replace(/AGENT_EMAIL/g, d.agentEmail || '');
  body = body.replace('VIRTUAL_TOUR_LINK', d.virtualTour || '#');

  if (!d.bannerText || d.bannerText === 'None') {
    body = body.replace(/<div class="banner-badge">[^<]*<\/div>/, '');
  }
  if (!d.virtualTour) {
    body = body.replace(/<a[^>]*>Virtual Tour<\/a>/g, '');
  }

  var scriptContent = `var currentSlide=0;
var track=document.getElementById('galleryTrack');
var imgs=track?track.querySelectorAll('img'):[];
var totalSlides=imgs.length;
var dotsEl=document.getElementById('galleryDots');

function buildDots(){
  if(!dotsEl||!totalSlides)return;
  for(var i=0;i<totalSlides;i++){
    var d=document.createElement('div');
    d.className='gallery-dot'+(i===0?' active':'');
    d.setAttribute('data-i',i);
    d.onclick=function(){goToSlide(parseInt(this.getAttribute('data-i')));};
    dotsEl.appendChild(d);
  }
}
function updateDots(){
  if(!dotsEl)return;
  var dots=dotsEl.querySelectorAll('.gallery-dot');
  dots.forEach(function(d,i){d.className='gallery-dot'+(i===currentSlide?' active':'');});
}
function goToSlide(n){
  currentSlide=n;
  if(currentSlide>=totalSlides)currentSlide=0;
  if(currentSlide<0)currentSlide=totalSlides-1;
  track.style.transform='translateX(-'+currentSlide*100+'%)';
  updateDots();
}
function galleryNext(){goToSlide(currentSlide+1);}
function galleryPrev(){goToSlide(currentSlide-1);}

buildDots();

// Auto-advance
setInterval(function(){galleryNext();},4000);

// Smooth scroll for nav
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var target=document.querySelector(this.getAttribute('href'));
    if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
  });
});`;

  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + (d.fullAddr || 'Property Website') + '</title>' +
    '<meta name="description" content="' + (d.desc || '').substring(0,160) + '">' +
    '<meta property="og:title" content="' + (d.fullAddr || '') + '">' +
    '<meta property="og:image" content="' + (d.heroSrc || '') + '">' +
    '<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">' +
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' + body + '<scr' + 'ipt>' + scriptContent + '</scr' + 'ipt></body></html>';
}


function pwBuildStylish(d) {
  var css = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Source Sans 3',sans-serif;color:#333;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
img{max-width:100%;height:auto;display:block;}
a{text-decoration:none;color:inherit;}

:root{
  --primary:ACCENT_COLOR;
  --primary-dark:ACCENT_DARK;
  --dark:#2c3e50;
  --darker:#1a252f;
  --text-light:#fff;
  --text-dark:#333;
}

/* ===== SIDEBAR NAV ===== */
.sidebar-nav{position:fixed;top:0;left:-280px;width:280px;height:100vh;background:var(--darker);z-index:200;transition:left 0.3s ease;padding:80px 30px 30px;overflow-y:auto;}
.sidebar-nav.open{left:0;}
.sidebar-nav a{display:block;padding:14px 0;font-size:16px;color:rgba(255,255,255,0.7);border-bottom:1px solid rgba(255,255,255,0.06);font-weight:400;transition:color 0.2s;}
.sidebar-nav a:hover{color:#fff;}
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:199;display:none;}
.sidebar-overlay.open{display:block;}
.menu-toggle{position:fixed;top:20px;left:20px;z-index:201;width:44px;height:44px;background:rgba(0,0,0,0.5);border:none;border-radius:4px;cursor:pointer;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;}
.menu-toggle span{display:block;width:22px;height:2px;background:#fff;transition:0.3s;}
.menu-close{position:absolute;top:20px;right:20px;width:36px;height:36px;background:none;border:1px solid rgba(255,255,255,0.2);border-radius:4px;cursor:pointer;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;}

/* ===== BANNER ===== */
.banner-badge{position:absolute;top:20px;right:20px;z-index:10;padding:10px 24px;font-size:12px;letter-spacing:3px;font-weight:700;text-transform:uppercase;color:#fff;background:var(--primary);box-shadow:0 4px 20px rgba(0,0,0,0.3);}

/* ===== HERO ===== */
.hero{position:relative;height:100vh;min-height:600px;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;background-size:cover;background-position:center;}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.3),rgba(0,0,0,0.6));}
.hero-content{position:relative;z-index:2;padding:20px;max-width:700px;}
.hero-label{font-size:14px;letter-spacing:4px;color:rgba(255,255,255,0.6);font-weight:300;text-transform:uppercase;}
.hero-line{width:50px;height:1px;background:rgba(255,255,255,0.3);margin:12px auto;}
.hero-street{font-size:clamp(30px,6vw,52px);font-weight:700;color:#fff;line-height:1.15;margin:6px 0;}
.hero-city{font-size:18px;color:rgba(255,255,255,0.6);font-weight:300;}
.hero-btn{display:inline-block;margin-top:28px;padding:14px 36px;background:var(--primary);color:#fff;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;transition:background 0.3s;border:none;cursor:pointer;}
.hero-btn:hover{background:var(--primary-dark);}

/* ===== ABOUT ===== */
.about{padding:80px 20px;text-align:center;background:#fff;}
.about-inner{max-width:800px;margin:0 auto;}
.section-heading{font-size:32px;font-weight:700;color:var(--dark);text-transform:uppercase;letter-spacing:2px;margin-bottom:20px;}
.about-desc{font-size:17px;line-height:1.9;color:#666;font-weight:300;}

/* ===== STATS (Icon Circles) ===== */
.stats{padding:60px 20px;background:var(--primary);text-align:center;}
.stats-grid{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
.stat-item{display:flex;flex-direction:column;align-items:center;}
.stat-circle{width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;margin-bottom:12px;}
.stat-circle i{font-size:28px;color:#fff;}
.stat-text{font-size:18px;font-weight:700;color:#fff;}

/* ===== CALLOUT PARALLAX ===== */
.callout{position:relative;height:350px;background-size:cover;background-position:center;background-attachment:fixed;display:flex;align-items:center;justify-content:center;}
.callout-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.5);}
.callout-content{position:relative;z-index:2;display:flex;gap:16px;flex-wrap:wrap;justify-content:center;}
.callout-btn{padding:14px 32px;background:var(--primary);color:#fff;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border:none;cursor:pointer;transition:background 0.3s;}
.callout-btn:hover{background:var(--primary-dark);}

/* ===== GALLERY ===== */
.gallery{padding:60px 20px;background:#fff;text-align:center;}
.gallery-title{font-size:32px;font-weight:700;color:var(--dark);margin-bottom:10px;}
.gallery-line{width:50px;height:2px;background:var(--primary);margin:0 auto 30px;}
.gallery-slider{position:relative;overflow:hidden;max-width:900px;margin:0 auto;border-radius:4px;}
.gallery-track{display:flex;transition:transform 0.5s ease;}
.gallery-track img{min-width:100%;height:500px;object-fit:cover;}
.gallery-controls{display:flex;justify-content:center;gap:10px;margin-top:16px;}
.gallery-controls button{width:40px;height:40px;border-radius:50%;border:2px solid var(--primary);background:#fff;cursor:pointer;font-size:16px;color:var(--primary);transition:all 0.2s;display:flex;align-items:center;justify-content:center;}
.gallery-controls button:hover{background:var(--primary);color:#fff;}

/* ===== CONTACT ===== */
.contact{padding:80px 20px;background:var(--primary);color:#fff;}
.contact-inner{max-width:900px;margin:0 auto;}
.contact-heading{text-align:center;font-size:32px;font-weight:700;margin-bottom:10px;}
.contact-sub{text-align:center;font-size:16px;font-weight:300;color:rgba(255,255,255,0.8);margin-bottom:30px;letter-spacing:1px;text-transform:uppercase;}
.contact-line{width:50px;height:2px;background:rgba(255,255,255,0.4);margin:0 auto 30px;}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.contact-left{display:flex;flex-direction:column;gap:12px;}
.contact-input{padding:14px 18px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:0;color:#fff;font-size:15px;font-family:'Source Sans 3',sans-serif;width:100%;}
.contact-input:focus{outline:none;border-color:rgba(255,255,255,0.5);}
.contact-input::placeholder{color:rgba(255,255,255,0.5);}
textarea.contact-input{resize:vertical;min-height:100%;}
.contact-right{display:flex;}
.contact-right textarea{flex:1;}
.contact-disclaimer{grid-column:1/-1;font-size:9px;color:rgba(255,255,255,0.4);line-height:1.5;margin-top:8px;}
.contact-submit{grid-column:1/-1;justify-self:center;padding:14px 50px;background:rgba(0,0,0,0.3);border:none;color:#fff;font-size:14px;letter-spacing:2px;font-weight:700;text-transform:uppercase;cursor:pointer;transition:background 0.3s;margin-top:10px;}
.contact-submit:hover{background:rgba(0,0,0,0.5);}

/* ===== LOCATION ===== */
.location{padding:60px 20px;text-align:center;background:#fff;}
.location h2{font-size:28px;font-weight:700;color:var(--dark);text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;}
.location h3{font-size:14px;color:#999;font-weight:300;margin-bottom:20px;}
.location-line{width:50px;height:2px;background:var(--primary);margin:0 auto 20px;}
.location iframe{width:100%;max-width:1000px;height:450px;border:none;}

/* ===== TEAM ===== */
.team{padding:80px 20px;background:#f5f5f5;text-align:center;}
.team-inner{max-width:1000px;margin:0 auto;}
.team-heading{font-size:32px;font-weight:700;color:var(--dark);margin-bottom:50px;letter-spacing:2px;}
.team-grid{display:flex;justify-content:center;align-items:flex-start;gap:60px;flex-wrap:wrap;}
.team-member{flex:1;min-width:280px;max-width:400px;text-align:center;}
.team-photo{width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 20px;box-shadow:0 6px 30px rgba(0,0,0,0.12);border:4px solid #fff;}
.team-photo-placeholder{width:140px;height:140px;border-radius:50%;margin:0 auto 20px;background:linear-gradient(135deg,#ddd,#eee);display:flex;align-items:center;justify-content:center;font-size:40px;color:#bbb;border:4px solid #fff;box-shadow:0 6px 30px rgba(0,0,0,0.12);}
.team-name{font-size:20px;font-weight:700;color:var(--dark);}
.team-title{font-size:13px;color:#777;margin-top:2px;}
.team-license{font-size:12px;color:#999;}
.team-company{font-size:13px;color:#666;margin-top:6px;font-weight:600;}
.team-contact-line{font-size:13px;color:#555;margin-top:3px;}
.team-contact-line a{color:var(--primary);font-weight:600;}
.team-website{font-size:12px;margin-top:3px;}
.team-website a{color:var(--primary);}
.team-logos{display:flex;justify-content:center;align-items:center;gap:30px;margin-top:40px;flex-wrap:wrap;}
.team-logos img{height:50px;object-fit:contain;opacity:0.8;}

/* ===== SOCIAL ===== */
.social-sidebar{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:90;display:flex;flex-direction:column;}
.social-sidebar a{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;transition:opacity 0.3s;}
.social-sidebar a:hover{opacity:0.7;}
.social-fb{background:#3b5998;}.social-x{background:#000;}.social-li{background:#0077b5;}.social-pi{background:#bd081c;}.social-em{background:#555;}

/* ===== FOOTER ===== */
.footer{padding:20px;text-align:center;background:var(--darker);font-size:11px;color:rgba(255,255,255,0.25);}

@media(max-width:768px){
  .stats-grid{grid-template-columns:repeat(2,1fr);gap:30px;}
  .contact-grid{grid-template-columns:1fr;}
  .team-grid{flex-direction:column;align-items:center;}
  .gallery-track img{height:300px;}
  .callout{height:250px;}
}`;
  css = css.replace('ACCENT_COLOR', d.accentColor || '#3498db');
  css = css.replace('ACCENT_DARK', d.accentDark || '#2980b9');

  var body = `<!-- Social Sidebar -->
<div class="social-sidebar">
  <a href="#" class="social-fb"><i class="fab fa-facebook-f"></i></a>
  <a href="#" class="social-x"><i class="fab fa-x-twitter"></i></a>
  <a href="#" class="social-li"><i class="fab fa-linkedin-in"></i></a>
  <a href="#" class="social-pi"><i class="fab fa-pinterest-p"></i></a>
  <a href="#" class="social-em"><i class="fas fa-envelope"></i></a>
</div>

<!-- Sidebar Nav -->
<button class="menu-toggle" onclick="document.querySelector('.sidebar-nav').classList.add('open');document.querySelector('.sidebar-overlay').classList.add('open');"><span></span><span></span><span></span></button>
<div class="sidebar-overlay" onclick="document.querySelector('.sidebar-nav').classList.remove('open');this.classList.remove('open');"></div>
<nav class="sidebar-nav">
  <button class="menu-close" onclick="document.querySelector('.sidebar-nav').classList.remove('open');document.querySelector('.sidebar-overlay').classList.remove('open');">&times;</button>
  <a href="#home">Home</a>
  <a href="#about">Details</a>
  <a href="#gallery">Gallery</a>
  <a href="#location">Location</a>
  <a href="#contact">Contact</a>
</nav>

<!-- Banner -->
<div class="banner-badge">BANNER_TEXT</div>

<!-- Hero -->
<section class="hero" id="home" style="background-image:url('PARALLAX_SRC');">
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-label">The Property</div>
    <div class="hero-line"></div>
    <h1 class="hero-street">ADDR_STREET</h1>
    <div class="hero-city">ADDR_CITYSTATE_SHORT</div>
    <div class="hero-line"></div>
    <a href="#about" class="hero-btn">View Details</a>
  </div>
</section>

<!-- About -->
<section class="about" id="about">
  <div class="about-inner">
    <h2 class="section-heading">Residence</h2>
    <p class="about-desc">DESC_TEXT</p>
  </div>
</section>

<!-- Stats -->
<section class="stats">
  <div class="stats-grid">
    <div class="stat-item"><div class="stat-circle"><i class="fas fa-dollar-sign"></i></div><div class="stat-text">PRICE_F</div></div>
    <div class="stat-item"><div class="stat-circle"><i class="fas fa-bed"></i></div><div class="stat-text">4 Beds, 4 Baths</div></div>
    <div class="stat-item"><div class="stat-circle"><i class="fas fa-home"></i></div><div class="stat-text">2,912 sq ft</div></div>
    <div class="stat-item"><div class="stat-circle"><i class="fas fa-calendar"></i></div><div class="stat-text">Built In 1993</div></div>
  </div>
</section>

<!-- Callout Parallax -->
<section class="callout" style="background-image:url('PARALLAX_SRC');">
  <div class="callout-overlay"></div>
  <div class="callout-content">
    <a href="VIRTUAL_TOUR_LINK" target="_blank" class="callout-btn">Virtual Tour</a>
    <a href="#gallery" class="callout-btn">View Photo Gallery</a>
  </div>
</section>

<!-- Gallery -->
<section class="gallery" id="gallery">
  <h2 class="gallery-title">Gallery</h2>
  <div class="gallery-line"></div>
  <div class="gallery-slider">
    <div class="gallery-track" id="galleryTrack">GALLERY_TRACK_HTML</div>
    <div class="gallery-controls">
      <button onclick="gPrev()"><i class="fas fa-chevron-left"></i></button>
      <button onclick="gNext()"><i class="fas fa-chevron-right"></i></button>
    </div>
  </div>
</section>

<!-- Contact -->
<section class="contact" id="contact">
  <div class="contact-inner">
    <h2 class="contact-heading">Contact</h2>
    <div class="contact-line"></div>
    <div class="contact-sub">Want to schedule a visit? Or have questions?</div>
    <form class="contact-grid">
      <div class="contact-left">
        <input type="text" class="contact-input" placeholder="Name" required>
        <input type="email" class="contact-input" placeholder="Email" required>
        <input type="tel" class="contact-input" placeholder="Phone">
      </div>
      <div class="contact-right">
        <textarea class="contact-input" placeholder="Message"></textarea>
      </div>
      <div class="contact-disclaimer">By submitting your email address and mobile number, you consent to receiving email and SMS messages from Kristy Flach using an automatic system. Consent to receive SMS messages is not a condition of purchase. Message and data rates may apply. You may unsubscribe at any time.</div>
      <button type="submit" class="contact-submit">Send Message</button>
    </form>
  </div>
</section>

<!-- Location -->
<section class="location" id="location">
  <h2>Location</h2>
  <h3>FULL_ADDR</h3>
  <div class="location-line"></div>
  MAP_EMBED
</section>

<!-- Team -->
<section class="team" id="team">
  <div class="team-inner">
    <h2 class="team-heading">Who Are We Anyway?</h2>
    <div class="team-grid">
      <div class="team-member">
        <div class="team-photo-placeholder"><i class="fas fa-user"></i></div>
        <div class="team-name">AGENT_NAME</div>
        <div class="team-title">Realtor</div>
        <div class="team-company">AGENT_COMPANY</div>
        <div class="team-contact-line"><a href="mailto:AGENT_EMAIL">AGENT_EMAIL</a></div>
      </div>
      <div class="team-member">
        <img src="hero-headshot.jpg" alt="Kristy Flach" class="team-photo">
        <div class="team-name">Kristy Flach</div>
        <div class="team-title">Certified Mortgage Advisor &amp; Loan Originator</div>
        <div class="team-license">NMLS #2632259</div>
        <div class="team-company">Paramount Residential Mortgage Group, Inc.</div>
        <div class="team-contact-line"><i class="fas fa-phone" style="font-size:11px;margin-right:4px;"></i> (513) 268-3891</div>
        <div class="team-contact-line"><a href="mailto:kflach@prmg.net">kflach@prmg.net</a></div>
        <div class="team-contact-line"><a href="mailto:kflach@kristyflach.com">kflach@kristyflach.com</a></div>
        <div class="team-website"><a href="https://kristyflach.com" target="_blank">kristyflach.com</a></div>
        <div class="team-website"><a href="https://kflach.myprmg.net" target="_blank">kflach.myprmg.net</a></div>
      </div>
    </div>
    <div class="team-logos">
      <img src="PRMG-Logo.png" alt="PRMG">
      <img src="CMA%20Logo.png" alt="CMA">
      <img src="equal-housing-logo.png" alt="Equal Housing">
    </div>
  </div>
</section>

<footer class="footer">&copy; 2026 Paramount Residential Mortgage Group, Inc. ("PRMG") NMLS #75243. Equal Housing Opportunity.</footer>`;
  
  // Replace dynamic placeholders
  body = body.replace(/HERO_SLIDES_HTML/g, d.heroSlidesHtml || '');
  body = body.replace(/HERO_SRC/g, d.heroSrc || '');
  body = body.replace(/ADDR_STREET/g, d.addr || 'Property Address');
  body = body.replace(/ADDR_CITYSTATE_SHORT/g, (d.city||'')+', '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE_NOSPACE/g, (d.city||'')+' '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE/g, (d.city||'')+', '+(d.state||'')+' '+(d.zip||''));
  body = body.replace(/FULL_ADDR/g, d.fullAddr || '');
  body = body.replace('PRICE_F', d.priceF || '');
  body = body.replace('BANNER_TEXT', d.bannerText || 'Just Listed');
  body = body.replace('TAGLINE', d.tagline || 'One of a Kind');
  body = body.replace('DESC_TEXT', d.desc || '');
  body = body.replace(/GALLERY_TRACK_HTML/g, d.galleryTrackHtml || '');
  body = body.replace(/PHOTO_GRID_HTML/g, d.photoGridHtml || '');
  body = body.replace(/PARALLAX_SRC/g, d.parallaxSrc || d.heroSrc || '');
  body = body.replace('MAP_EMBED', d.mapEmbed || '');
  body = body.replace('MAP_LINK', d.mapLink || '#');
  body = body.replace('AGENT_NAME', d.agent || 'Listing Agent');
  body = body.replace('AGENT_COMPANY', d.agentCompany || '');
  body = body.replace(/AGENT_EMAIL/g, d.agentEmail || '');
  body = body.replace('VIRTUAL_TOUR_LINK', d.virtualTour || '#');

  if (!d.bannerText || d.bannerText === 'None') {
    body = body.replace(/<div class="banner-badge">[^<]*<\/div>/, '');
  }
  if (!d.virtualTour) {
    body = body.replace(/<a[^>]*>Virtual Tour<\/a>/g, '');
  }

  var scriptContent = `var cs=0,track=document.getElementById('galleryTrack'),total=track?track.querySelectorAll('img').length:0;
function gTo(n){cs=n;if(cs>=total)cs=0;if(cs<0)cs=total-1;track.style.transform='translateX(-'+cs*100+'%)';}
function gNext(){gTo(cs+1);}function gPrev(){gTo(cs-1);}
setInterval(gNext,4500);
document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=document.querySelector(this.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}});});`;

  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + (d.fullAddr || 'Property Website') + '</title>' +
    '<meta name="description" content="' + (d.desc || '').substring(0,160) + '">' +
    '<meta property="og:title" content="' + (d.fullAddr || '') + '">' +
    '<meta property="og:image" content="' + (d.heroSrc || '') + '">' +
    '<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap" rel="stylesheet">' +
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' + body + '<scr' + 'ipt>' + scriptContent + '</scr' + 'ipt></body></html>';
}


function pwBuildContemporary(d) {
  var css = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Montserrat',sans-serif;color:#333;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
img{max-width:100%;height:auto;display:block;}
a{text-decoration:none;color:inherit;}

:root{--accent:ACCENT_COLOR;--text-dark:#1a1a1a;--text-light:#fff;--bg-warm:#f8f7f2;}

/* ===== TOP NAV ===== */
.top-nav{position:fixed;top:0;left:0;right:0;z-index:100;background:transparent;padding:16px 30px;display:flex;justify-content:flex-end;gap:24px;transition:background 0.3s;}
.top-nav.scrolled{background:rgba(255,255,255,0.95);box-shadow:0 1px 8px rgba(0,0,0,0.06);}
.top-nav a{font-size:11px;letter-spacing:3px;font-weight:500;color:rgba(255,255,255,0.7);text-transform:uppercase;transition:color 0.3s;}
.top-nav.scrolled a{color:#555;}
.top-nav a:hover{color:#fff;}
.top-nav.scrolled a:hover{color:#000;}

/* ===== HERO ===== */
.hero{position:relative;height:85vh;min-height:500px;background-size:cover;background-position:center;display:flex;flex-direction:column;justify-content:flex-end;padding:60px 50px;}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.5) 100%);}
.hero-content{position:relative;z-index:2;}
.hero-street{font-family:'Libre Baskerville',serif;font-size:clamp(36px,7vw,72px);font-weight:400;color:#fff;line-height:1.05;}
.hero-city{font-size:20px;font-weight:300;color:rgba(255,255,255,0.7);margin-top:8px;letter-spacing:2px;}

/* ===== BANNER ===== */
.banner-badge{position:absolute;top:80px;left:50px;z-index:10;padding:10px 24px;font-size:12px;letter-spacing:3px;font-weight:600;text-transform:uppercase;color:#fff;background:var(--accent);box-shadow:0 4px 20px rgba(0,0,0,0.2);}

/* ===== STATS BAR ===== */
.stats{background:var(--accent);padding:40px 20px;}
.stats-grid{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center;}
.stat-number{font-family:'Libre Baskerville',serif;font-size:clamp(36px,5vw,56px);font-weight:400;color:#fff;line-height:1;}
.stat-label{font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.5);text-transform:uppercase;margin-top:8px;font-weight:500;}

/* ===== PRICE & DESCRIPTION ===== */
.description{padding:80px 20px;text-align:center;background:var(--bg-warm);}
.desc-inner{max-width:800px;margin:0 auto;}
.desc-offered{font-size:14px;letter-spacing:6px;color:#999;font-weight:300;text-transform:uppercase;}
.desc-price{font-family:'Libre Baskerville',serif;font-size:clamp(40px,6vw,64px);font-weight:400;color:var(--text-dark);font-style:italic;margin:12px 0 30px;}
.desc-heading{font-size:16px;letter-spacing:6px;font-weight:400;color:#999;text-transform:uppercase;margin-bottom:20px;}
.desc-text{font-family:'Libre Baskerville',serif;font-size:15px;line-height:2;color:#555;font-weight:400;}

/* ===== PHOTO GRID ===== */
.photos{padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.photos img{width:100%;height:250px;object-fit:cover;cursor:pointer;transition:opacity 0.3s;}
.photos img:hover{opacity:0.85;}

/* Lightbox */
.lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:300;align-items:center;justify-content:center;}
.lightbox.open{display:flex;}
.lightbox img{max-width:90%;max-height:85vh;object-fit:contain;}
.lightbox-close{position:absolute;top:20px;right:30px;color:#fff;font-size:32px;cursor:pointer;}
.lightbox-nav{position:absolute;top:50%;transform:translateY(-50%);color:#fff;font-size:28px;cursor:pointer;padding:20px;}
.lightbox-prev{left:10px;}
.lightbox-next{right:10px;}

/* ===== TEAM ===== */
.team{padding:80px 20px;background:#fff;text-align:center;}
.team-inner{max-width:1000px;margin:0 auto;}
.team-heading{font-family:'Libre Baskerville',serif;font-size:32px;font-weight:400;color:var(--text-dark);margin-bottom:50px;letter-spacing:4px;}
.team-grid{display:flex;justify-content:center;align-items:flex-start;gap:60px;flex-wrap:wrap;}
.team-member{flex:1;min-width:280px;max-width:400px;text-align:center;}
.team-photo{width:150px;height:150px;border-radius:50%;object-fit:cover;margin:0 auto 20px;box-shadow:0 6px 30px rgba(0,0,0,0.1);}
.team-photo-placeholder{width:150px;height:150px;border-radius:50%;margin:0 auto 20px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:40px;color:#ccc;}
.team-name{font-family:'Libre Baskerville',serif;font-size:20px;color:var(--text-dark);}
.team-title{font-size:13px;color:#888;margin-top:4px;font-weight:300;}
.team-license{font-size:12px;color:#aaa;}
.team-company{font-size:13px;color:#666;margin-top:6px;}
.team-contact-line{font-size:13px;color:#555;margin-top:3px;}
.team-contact-line a{color:var(--accent);}
.team-website{font-size:12px;margin-top:3px;}
.team-website a{color:var(--accent);}
.team-logos{display:flex;justify-content:center;align-items:center;gap:30px;margin-top:40px;flex-wrap:wrap;}
.team-logos img{height:50px;object-fit:contain;opacity:0.7;}

/* ===== CONTACT ===== */
.contact{padding:80px 20px;background:var(--accent);color:#fff;}
.contact-inner{max-width:900px;margin:0 auto;}
.contact-heading{text-align:center;font-family:'Libre Baskerville',serif;font-size:28px;font-weight:400;margin-bottom:40px;letter-spacing:4px;}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.contact-left{display:flex;flex-direction:column;gap:14px;}
.contact-input{padding:14px 18px;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.3);color:#fff;font-size:15px;font-family:'Montserrat',sans-serif;font-weight:300;width:100%;}
.contact-input:focus{outline:none;border-bottom-color:#fff;}
.contact-input::placeholder{color:rgba(255,255,255,0.4);text-transform:uppercase;font-size:12px;letter-spacing:2px;}
textarea.contact-input{resize:vertical;min-height:100%;border:1px solid rgba(255,255,255,0.2);padding:14px 18px;}
.contact-right{display:flex;}
.contact-right textarea{flex:1;}
.contact-disclaimer{grid-column:1/-1;font-size:9px;color:rgba(255,255,255,0.3);line-height:1.5;}
.contact-submit{grid-column:1/-1;justify-self:center;padding:14px 50px;background:transparent;border:1px solid rgba(255,255,255,0.4);color:#fff;font-size:12px;letter-spacing:4px;font-weight:500;text-transform:uppercase;cursor:pointer;transition:all 0.3s;margin-top:10px;}
.contact-submit:hover{background:rgba(255,255,255,0.1);border-color:#fff;}

/* ===== SOCIAL ===== */
.social-row{padding:20px;background:#fff;text-align:center;display:flex;justify-content:center;gap:16px;}
.social-row a{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;transition:opacity 0.3s;}
.social-row a:hover{opacity:0.7;}

/* ===== LOCATION ===== */
.map iframe{width:100%;height:450px;border:none;display:block;}

/* ===== SOCIAL SIDEBAR ===== */
.social-sidebar{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:90;display:flex;flex-direction:column;}
.social-sidebar a{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;transition:opacity 0.3s;}
.social-sidebar a:hover{opacity:0.7;}
.social-fb{background:#3b5998;}.social-x{background:#000;}.social-li{background:#0077b5;}.social-pi{background:#bd081c;}.social-em{background:#555;}

.footer{padding:20px;text-align:center;background:#2d3436;font-size:11px;color:rgba(255,255,255,0.25);}

@media(max-width:768px){
  .stats-grid{grid-template-columns:repeat(2,1fr);gap:24px;}
  .photos{grid-template-columns:repeat(2,1fr);}
  .contact-grid{grid-template-columns:1fr;}
  .team-grid{flex-direction:column;align-items:center;}
  .hero{padding:40px 24px;}
  .top-nav{display:none;}
}
@media(max-width:480px){
  .photos{grid-template-columns:1fr;}
}`;
  css = css.replace('ACCENT_COLOR', d.accentColor || '#4a5568');
  css = css.replace('ACCENT_DARK', d.accentDark || '#3d4756');

  var body = `<div class="social-sidebar">
  <a href="#" class="social-fb"><i class="fab fa-facebook-f"></i></a>
  <a href="#" class="social-x"><i class="fab fa-x-twitter"></i></a>
  <a href="#" class="social-li"><i class="fab fa-linkedin-in"></i></a>
  <a href="#" class="social-pi"><i class="fab fa-pinterest-p"></i></a>
  <a href="#" class="social-em"><i class="fas fa-envelope"></i></a>
</div>

<nav class="top-nav" id="topNav">
  <a href="#desc">Overview</a>
  <a href="#photos">Photos</a>
  <a href="#contact">Connect</a>
  <a href="#map">Map</a>
</nav>

<section class="hero" id="home" style="background-image:url('PARALLAX_SRC');">
  <div class="hero-overlay"></div>
  <div class="banner-badge">BANNER_TEXT</div>
  <div class="hero-content">
    <h1 class="hero-street">ADDR_STREET</h1>
    <div class="hero-city">ADDR_CITYSTATE_NOSPACE</div>
  </div>
</section>

<section class="stats">
  <div class="stats-grid">
    <div><div class="stat-number">4</div><div class="stat-label">Beds</div></div>
    <div><div class="stat-number">4</div><div class="stat-label">Baths</div></div>
    <div><div class="stat-number">2,912</div><div class="stat-label">Sqft</div></div>
    <div><div class="stat-number">1993</div><div class="stat-label">Year Built</div></div>
  </div>
</section>

<section class="description" id="desc">
  <div class="desc-inner">
    <div class="desc-offered">Offered At</div>
    <div class="desc-price">PRICE_F</div>
    <div class="desc-heading">Residence</div>
    <p class="desc-text">DESC_TEXT</p>
  </div>
</section>

<section class="photos" id="photos">PHOTO_GRID_HTML</section>

<div class="lightbox" id="lightbox">
  <div class="lightbox-close" onclick="closeLB()">&times;</div>
  <div class="lightbox-nav lightbox-prev" onclick="lbPrev()"><i class="fas fa-chevron-left"></i></div>
  <img id="lbImg" src="" alt="">
  <div class="lightbox-nav lightbox-next" onclick="lbNext()"><i class="fas fa-chevron-right"></i></div>
</div>

<section class="team" id="team">
  <div class="team-inner">
    <h2 class="team-heading">Who Are We Anyway?</h2>
    <div class="team-grid">
      <div class="team-member">
        <div class="team-photo-placeholder"><i class="fas fa-user"></i></div>
        <div class="team-name">AGENT_NAME</div>
        <div class="team-title">Realtor</div>
        <div class="team-company">AGENT_COMPANY</div>
        <div class="team-contact-line"><a href="mailto:AGENT_EMAIL">AGENT_EMAIL</a></div>
      </div>
      <div class="team-member">
        <img src="hero-headshot.jpg" alt="Kristy Flach" class="team-photo">
        <div class="team-name">Kristy Flach</div>
        <div class="team-title">Certified Mortgage Advisor &amp; Loan Originator</div>
        <div class="team-license">NMLS #2632259</div>
        <div class="team-company">Paramount Residential Mortgage Group, Inc.</div>
        <div class="team-contact-line"><i class="fas fa-phone" style="font-size:11px;margin-right:4px;"></i> (513) 268-3891</div>
        <div class="team-contact-line"><a href="mailto:kflach@prmg.net">kflach@prmg.net</a></div>
        <div class="team-contact-line"><a href="mailto:kflach@kristyflach.com">kflach@kristyflach.com</a></div>
        <div class="team-website"><a href="https://kristyflach.com" target="_blank">kristyflach.com</a></div>
        <div class="team-website"><a href="https://kflach.myprmg.net" target="_blank">kflach.myprmg.net</a></div>
      </div>
    </div>
    <div class="team-logos">
      <img src="PRMG-Logo.png" alt="PRMG">
      <img src="CMA%20Logo.png" alt="CMA">
      <img src="equal-housing-logo.png" alt="Equal Housing">
    </div>
  </div>
</section>

<section class="contact" id="contact">
  <div class="contact-inner">
    <h2 class="contact-heading">Contact</h2>
    <form class="contact-grid">
      <div class="contact-left">
        <input type="text" class="contact-input" placeholder="Name" required>
        <input type="email" class="contact-input" placeholder="Email" required>
        <input type="tel" class="contact-input" placeholder="Phone">
      </div>
      <div class="contact-right"><textarea class="contact-input" placeholder="Message"></textarea></div>
      <div class="contact-disclaimer">By submitting your email address and mobile number, you consent to receiving email and SMS messages from Kristy Flach using an automatic system. Consent to receive SMS messages is not a condition of purchase. Message and data rates may apply. You may unsubscribe at any time.</div>
      <button type="submit" class="contact-submit">Send</button>
    </form>
  </div>
</section>

<section class="map" id="map">
  MAP_EMBED
</section>

<footer class="footer">&copy; 2026 Paramount Residential Mortgage Group, Inc. ("PRMG") NMLS #75243. Equal Housing Opportunity.</footer>`;
  
  // Replace dynamic placeholders
  body = body.replace(/HERO_SLIDES_HTML/g, d.heroSlidesHtml || '');
  body = body.replace(/HERO_SRC/g, d.heroSrc || '');
  body = body.replace(/ADDR_STREET/g, d.addr || 'Property Address');
  body = body.replace(/ADDR_CITYSTATE_SHORT/g, (d.city||'')+', '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE_NOSPACE/g, (d.city||'')+' '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE/g, (d.city||'')+', '+(d.state||'')+' '+(d.zip||''));
  body = body.replace(/FULL_ADDR/g, d.fullAddr || '');
  body = body.replace('PRICE_F', d.priceF || '');
  body = body.replace('BANNER_TEXT', d.bannerText || 'Just Listed');
  body = body.replace('TAGLINE', d.tagline || 'One of a Kind');
  body = body.replace('DESC_TEXT', d.desc || '');
  body = body.replace(/GALLERY_TRACK_HTML/g, d.galleryTrackHtml || '');
  body = body.replace(/PHOTO_GRID_HTML/g, d.photoGridHtml || '');
  body = body.replace(/PARALLAX_SRC/g, d.parallaxSrc || d.heroSrc || '');
  body = body.replace('MAP_EMBED', d.mapEmbed || '');
  body = body.replace('MAP_LINK', d.mapLink || '#');
  body = body.replace('AGENT_NAME', d.agent || 'Listing Agent');
  body = body.replace('AGENT_COMPANY', d.agentCompany || '');
  body = body.replace(/AGENT_EMAIL/g, d.agentEmail || '');
  body = body.replace('VIRTUAL_TOUR_LINK', d.virtualTour || '#');

  if (!d.bannerText || d.bannerText === 'None') {
    body = body.replace(/<div class="banner-badge">[^<]*<\/div>/, '');
  }
  if (!d.virtualTour) {
    body = body.replace(/<a[^>]*>Virtual Tour<\/a>/g, '');
  }

  var scriptContent = `// Nav scroll effect
var nav=document.getElementById('topNav');
window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>100);});

// Lightbox
var lbPhotos=document.querySelectorAll('.photos img');
var lbUrls=[];document.querySelectorAll('.photos img').forEach(function(p){lbUrls.push(p.src);});});
var lbIdx=0;
function openLB(i){lbIdx=i;document.getElementById('lbImg').src=lbUrls[lbIdx];document.getElementById('lightbox').classList.add('open');}
function closeLB(){document.getElementById('lightbox').classList.remove('open');}
function lbNext(){lbIdx=(lbIdx+1)%lbUrls.length;document.getElementById('lbImg').src=lbUrls[lbIdx];}
function lbPrev(){lbIdx=(lbIdx-1+lbUrls.length)%lbUrls.length;document.getElementById('lbImg').src=lbUrls[lbIdx];}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLB();if(e.key==='ArrowRight')lbNext();if(e.key==='ArrowLeft')lbPrev();});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=document.querySelector(this.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}});});`;

  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + (d.fullAddr || 'Property Website') + '</title>' +
    '<meta name="description" content="' + (d.desc || '').substring(0,160) + '">' +
    '<meta property="og:title" content="' + (d.fullAddr || '') + '">' +
    '<meta property="og:image" content="' + (d.heroSrc || '') + '">' +
    '<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@100;200;300;400;500;600&display=swap" rel="stylesheet">' +
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' + body + '<scr' + 'ipt>' + scriptContent + '</scr' + 'ipt></body></html>';
}


function pwBuildVertical(d) {
  var css = `/* ===== RESET & BASE ===== */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;scroll-snap-type:y mandatory;}
body{font-family:'Ubuntu',sans-serif;color:#333;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
img{max-width:100%;height:auto;display:block;}
a{text-decoration:none;color:inherit;}

/* ===== COLOR SCHEME ===== */
:root{
  --accent:ACCENT_COLOR;
  --accent-dark:ACCENT_DARK;
  --dark-1:#0f2027;
  --dark-2:#203a43;
  --dark-3:#2c5364;
  --overlay:rgba(15,32,39,0.6);
  --text-light:#fff;
  --text-dark:#1a1a2e;
  --section-bg:#f4f7f6;
}

/* ===== FULL-SECTION SCROLL PANELS ===== */
.panel{min-height:100vh;scroll-snap-align:start;position:relative;}

/* ===== DOT NAVIGATION (Left Side) ===== */
.dot-nav{
  position:fixed;left:24px;top:50%;transform:translateY(-50%);z-index:100;
  display:flex;flex-direction:column;gap:16px;
}
.dot-nav a{
  width:10px;height:10px;border-radius:50%;
  background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.3);
  transition:all 0.3s;display:block;
}
.dot-nav a:hover,.dot-nav a.active{background:var(--accent);border-color:var(--accent);transform:scale(1.3);}

/* ===== SCROLL INDICATOR ===== */
.scroll-cue{
  position:absolute;bottom:30px;left:50%;transform:translateX(-50%);z-index:5;
  display:flex;flex-direction:column;align-items:center;gap:6px;
  animation:scrollBounce 2s ease-in-out infinite;
}
.scroll-cue-mouse{width:20px;height:32px;border:2px solid rgba(255,255,255,0.4);border-radius:10px;position:relative;}
.scroll-cue-mouse::after{
  content:'';position:absolute;top:6px;left:50%;transform:translateX(-50%);
  width:3px;height:6px;background:rgba(255,255,255,0.6);border-radius:2px;
  animation:scrollWheel 1.5s ease-in-out infinite;
}
.scroll-cue-text{font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.4);text-transform:uppercase;}
@keyframes scrollBounce{0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(8px);}}
@keyframes scrollWheel{0%{opacity:1;top:6px;}100%{opacity:0;top:16px;}}

/* ===== BANNER BADGE ===== */
.banner-badge{
  position:absolute;top:20px;right:20px;z-index:10;
  padding:10px 24px;font-size:12px;letter-spacing:3px;font-weight:700;
  text-transform:uppercase;color:#fff;
  background:var(--accent);
  box-shadow:0 4px 20px rgba(0,0,0,0.3);
}

/* ===== SOCIAL SIDEBAR ===== */
.social-sidebar{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:90;display:flex;flex-direction:column;}
.social-sidebar a{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;transition:opacity 0.3s;}
.social-sidebar a:hover{opacity:0.7;}
.social-fb{background:#3b5998;}.social-x{background:#000;}.social-li{background:#0077b5;}.social-pi{background:#bd081c;}.social-em{background:#555;}

/* ===== HERO (Panel 1) ===== */
.hero{
  background:linear-gradient(160deg,var(--dark-1),var(--dark-2),var(--dark-3));
  display:flex;align-items:center;padding:0 80px;overflow:hidden;
}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;}
.hero-overlay{position:absolute;inset:0;background:var(--overlay);}
.hero-content{position:relative;z-index:2;max-width:700px;}
.hero-street{font-size:clamp(36px,7vw,64px);font-weight:700;color:var(--text-light);line-height:1.05;}
.hero-accent-line{width:60px;height:3px;background:var(--accent);margin:16px 0;}
.hero-city{font-size:18px;color:rgba(255,255,255,0.6);font-weight:300;letter-spacing:3px;text-transform:uppercase;}
.hero-tagline{font-size:13px;color:rgba(255,255,255,0.35);letter-spacing:5px;margin-top:8px;font-weight:400;}
.hero-buttons{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px;}
.hero-btn{
  padding:12px 28px;border:1px solid rgba(255,255,255,0.3);
  color:var(--text-light);font-size:11px;letter-spacing:3px;font-weight:500;
  text-transform:uppercase;font-family:'Ubuntu',sans-serif;
  transition:all 0.3s;background:transparent;cursor:pointer;
}
.hero-btn:hover{background:var(--accent);border-color:var(--accent);}

/* ===== STATS (Panel 2) ===== */
.stats-panel{
  display:flex;align-items:center;justify-content:center;
  background-size:cover;background-position:center;background-attachment:fixed;
}
.stats-overlay{
  position:absolute;inset:0;
  background:linear-gradient(160deg,rgba(15,32,39,0.88),rgba(44,83,100,0.88));
}
.stats-inner{position:relative;z-index:2;text-align:center;width:100%;max-width:1000px;padding:40px 20px;}
.stats-label{font-size:12px;letter-spacing:6px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:50px;font-weight:400;}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:30px;}
.stat-number{font-size:clamp(40px,6vw,68px);font-weight:300;color:var(--text-light);line-height:1;}
.stat-unit{font-size:14px;color:var(--accent);letter-spacing:2px;font-weight:500;}
.stat-label{font-size:11px;letter-spacing:4px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-top:10px;font-weight:400;}

/* ===== ABOUT (Panel 3) ===== */
.about-panel{display:flex;align-items:center;justify-content:center;background:var(--section-bg);}
.about-inner{max-width:800px;padding:60px 20px;text-align:center;}
.section-accent{width:40px;height:3px;background:var(--accent);margin:0 auto 24px;}
.section-heading{font-size:12px;letter-spacing:8px;color:#999;text-transform:uppercase;font-weight:400;margin-bottom:10px;}
.about-price{font-size:clamp(38px,5vw,58px);font-weight:300;color:var(--text-dark);margin:20px 0 30px;}
.about-desc{font-size:16px;line-height:2;color:#555;font-weight:300;text-align:justify;}

/* ===== GALLERY (Panel 4) ===== */
.gallery-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;}
.gallery-inner{width:100%;max-width:1000px;padding:40px 20px;}
.gallery-header{text-align:center;margin-bottom:30px;}
.gallery-slider{position:relative;overflow:hidden;border-radius:4px;}
.gallery-track{display:flex;transition:transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);}
.gallery-track img{min-width:100%;height:500px;object-fit:cover;user-select:none;-webkit-user-drag:none;}
.gallery-controls{display:flex;justify-content:center;gap:12px;margin-top:20px;}
.gallery-controls button{
  width:44px;height:44px;border-radius:50%;border:2px solid var(--accent);
  background:transparent;cursor:pointer;font-size:16px;color:var(--accent);
  transition:all 0.2s;display:flex;align-items:center;justify-content:center;
}
.gallery-controls button:hover{background:var(--accent);color:#fff;}
.gallery-dots{display:flex;justify-content:center;gap:6px;margin-top:14px;}
.gallery-dot{width:8px;height:8px;border-radius:50%;background:rgba(0,0,0,0.12);cursor:pointer;transition:all 0.3s;}
.gallery-dot.active{background:var(--accent);transform:scale(1.3);}

/* ===== LOCATION (Panel 5) ===== */
.location-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--section-bg);}
.location-inner{width:100%;max-width:1000px;padding:40px 20px;text-align:center;}
.location-address{font-size:15px;color:#777;letter-spacing:1px;margin-top:12px;}
.location-address a{color:var(--accent);font-weight:500;}
.location-inner iframe{width:100%;height:450px;border:none;border-radius:4px;margin-top:20px;box-shadow:0 4px 20px rgba(0,0,0,0.06);}

/* ===== TEAM ===== */
.team{padding:80px 20px;background:#fff;text-align:center;}
.team-inner{max-width:1000px;margin:0 auto;}
.team-heading{font-size:12px;letter-spacing:8px;color:#999;text-transform:uppercase;font-weight:400;margin-bottom:50px;}
.team-grid{display:flex;justify-content:center;align-items:flex-start;gap:60px;flex-wrap:wrap;}
.team-member{flex:1;min-width:280px;max-width:400px;text-align:center;}
.team-photo{width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 20px;box-shadow:0 6px 30px rgba(0,0,0,0.12);border:4px solid #fff;}
.team-photo-placeholder{width:140px;height:140px;border-radius:50%;margin:0 auto 20px;background:linear-gradient(135deg,#ddd,#eee);display:flex;align-items:center;justify-content:center;font-size:40px;color:#bbb;border:4px solid #fff;box-shadow:0 6px 30px rgba(0,0,0,0.12);}
.team-name{font-size:20px;font-weight:500;color:var(--text-dark);}
.team-title{font-size:13px;color:#777;margin-top:2px;}
.team-license{font-size:12px;color:#999;}
.team-company{font-size:13px;color:#666;margin-top:6px;font-weight:500;}
.team-contact-line{font-size:13px;color:#555;margin-top:3px;}
.team-contact-line a{color:var(--accent);font-weight:500;}
.team-website{font-size:12px;margin-top:3px;}
.team-website a{color:var(--accent);}
.team-logos{display:flex;justify-content:center;align-items:center;gap:30px;margin-top:40px;flex-wrap:wrap;}
.team-logos img{height:50px;object-fit:contain;opacity:0.8;}

/* ===== CONTACT ===== */
.contact{padding:80px 20px;background:linear-gradient(160deg,var(--dark-1),var(--dark-2),var(--dark-3));color:var(--text-light);}
.contact-inner{max-width:900px;margin:0 auto;}
.contact-heading{text-align:center;font-size:12px;letter-spacing:8px;font-weight:400;text-transform:uppercase;margin-bottom:40px;}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;}
.contact-left{display:flex;flex-direction:column;gap:16px;}
.contact-input{
  padding:14px 18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  border-radius:2px;color:#fff;font-size:15px;font-family:'Ubuntu',sans-serif;
  transition:border-color 0.3s;width:100%;
}
.contact-input:focus{outline:none;border-color:var(--accent);}
.contact-input::placeholder{color:rgba(255,255,255,0.3);}
textarea.contact-input{resize:vertical;min-height:100%;font-family:'Ubuntu',sans-serif;}
.contact-right{display:flex;}
.contact-right textarea{flex:1;}
.contact-disclaimer{grid-column:1/-1;font-size:9px;color:rgba(255,255,255,0.25);line-height:1.5;margin-top:8px;}
.contact-submit{
  grid-column:1/-1;justify-self:center;
  padding:14px 50px;border:2px solid var(--accent);
  background:transparent;color:var(--text-light);font-size:12px;letter-spacing:4px;
  font-weight:500;text-transform:uppercase;font-family:'Ubuntu',sans-serif;
  cursor:pointer;transition:all 0.3s;margin-top:10px;
}
.contact-submit:hover{background:var(--accent);border-color:var(--accent);}

/* ===== FOOTER ===== */
.footer{padding:20px;text-align:center;background:var(--dark-1);font-size:11px;color:rgba(255,255,255,0.2);}

/* ===== RESPONSIVE ===== */
@media(max-width:768px){
  html{scroll-snap-type:none;}
  .dot-nav{display:none;}
  .hero{padding:0 30px;}
  .stats-grid{grid-template-columns:repeat(2,1fr);gap:30px;}
  .contact-grid{grid-template-columns:1fr;}
  .team-grid{flex-direction:column;align-items:center;}
  .gallery-track img{height:300px;}
  .hero-btn{padding:10px 20px;font-size:10px;}
}
@media(max-width:480px){
  .stats-grid{grid-template-columns:repeat(2,1fr);gap:20px;}
  .hero-buttons{flex-direction:column;align-items:flex-start;}
}`;
  css = css.replace('ACCENT_COLOR', d.accentColor || '#5bb5a2');
  css = css.replace('ACCENT_DARK', d.accentDark || '#3d9a87');

  var body = `<!-- Social Sharing Sidebar -->
<div class="social-sidebar">
  <a href="#" class="social-fb"><i class="fab fa-facebook-f"></i></a>
  <a href="#" class="social-x"><i class="fab fa-x-twitter"></i></a>
  <a href="#" class="social-li"><i class="fab fa-linkedin-in"></i></a>
  <a href="#" class="social-pi"><i class="fab fa-pinterest-p"></i></a>
  <a href="#" class="social-em"><i class="fas fa-envelope"></i></a>
</div>

<!-- Dot Navigation -->
<nav class="dot-nav" id="dotNav">
  <a href="#home" class="active" title="Home"></a>
  <a href="#stats" title="Stats"></a>
  <a href="#about" title="About"></a>
  <a href="#gallery" title="Gallery"></a>
  <a href="#location" title="Location"></a>
</nav>

<!-- Banner Badge -->
<div class="banner-badge">BANNER_TEXT</div>

<!-- Panel 1: Hero -->
<section class="panel hero" id="home">
  <div class="hero-bg" style="background-image:url('HERO_SRC');"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <h1 class="hero-street">ADDR_STREET</h1>
    <div class="hero-accent-line"></div>
    <div class="hero-city">ADDR_CITYSTATE_SHORT</div>
    <div class="hero-tagline">TAGLINE</div>
    <div class="hero-buttons">
      <a href="#about" class="hero-btn">View Details</a>
      <a href="#gallery" class="hero-btn">Gallery</a>
      <a href="VIRTUAL_TOUR_LINK" target="_blank" class="hero-btn">Virtual Tour</a>
      <a href="#contact" class="hero-btn">Schedule a Visit</a>
    </div>
  </div>
  <div class="scroll-cue">
    <div class="scroll-cue-mouse"></div>
    <div class="scroll-cue-text">Scroll</div>
  </div>
</section>

<!-- Panel 2: Stats -->
<section class="panel stats-panel" id="stats" style="background-image:url('PARALLAX_SRC');">
  <div class="stats-overlay"></div>
  <div class="stats-inner">
    <div class="stats-label">Property Highlights</div>
    <div class="stats-grid">
      <div><div class="stat-number">4</div><div class="stat-label">Bedrooms</div></div>
      <div><div class="stat-number">4</div><div class="stat-label">Bathrooms</div></div>
      <div><div class="stat-number">2,912</div><div class="stat-label">Square Feet</div></div>
      <div><div class="stat-number">1993</div><div class="stat-label">Built In</div></div>
    </div>
  </div>
</section>

<!-- Panel 3: About -->
<section class="panel about-panel" id="about">
  <div class="about-inner">
    <div class="section-accent"></div>
    <div class="section-heading">Residence</div>
    <div class="about-price">PRICE_F</div>
    <p class="about-desc">DESC_TEXT</p>
  </div>
</section>

<!-- Panel 4: Gallery -->
<section class="panel gallery-panel" id="gallery">
  <div class="gallery-inner">
    <div class="gallery-header">
      <div class="section-accent"></div>
      <div class="section-heading">Gallery</div>
    </div>
    <div class="gallery-slider">
      <div class="gallery-track" id="galleryTrack">GALLERY_TRACK_HTML</div>
      <div class="gallery-controls">
        <button onclick="galleryPrev()"><i class="fas fa-chevron-left"></i></button>
        <button onclick="galleryNext()"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="gallery-dots" id="galleryDots"></div>
    </div>
  </div>
</section>

<!-- Panel 5: Location -->
<section class="panel location-panel" id="location">
  <div class="location-inner">
    <div class="section-accent"></div>
    <div class="section-heading">Location</div>
    <p class="location-address">
      FULL_ADDR<br>
      <a href="MAP_LINK" target="_blank">View on Google Maps</a>
    </p>
    MAP_EMBED
  </div>
</section>

<!-- Team Section -->
<section class="team" id="team">
  <div class="team-inner">
    <div class="section-accent"></div>
    <div class="team-heading">Who Are We Anyway?</div>
    <div class="team-grid">
      <!-- REALTOR (Left) -->
      <div class="team-member">
        <div class="team-photo-placeholder"><i class="fas fa-user"></i></div>
        <div class="team-name">AGENT_NAME</div>
        <div class="team-title">Realtor</div>
        <div class="team-company">AGENT_COMPANY</div>
        <div class="team-contact-line"><a href="mailto:AGENT_EMAIL">AGENT_EMAIL</a></div>
      </div>
      <!-- LENDER (Right — always Kristy) -->
      <div class="team-member">
        <img src="hero-headshot.jpg" alt="Kristy Flach" class="team-photo">
        <div class="team-name">Kristy Flach</div>
        <div class="team-title">Certified Mortgage Advisor &amp; Loan Originator</div>
        <div class="team-license">NMLS #2632259</div>
        <div class="team-company">Paramount Residential Mortgage Group, Inc.</div>
        <div class="team-contact-line"><i class="fas fa-phone" style="font-size:11px;margin-right:4px;"></i> (513) 268-3891</div>
        <div class="team-contact-line"><a href="mailto:kflach@prmg.net">kflach@prmg.net</a></div>
        <div class="team-contact-line"><a href="mailto:kflach@kristyflach.com">kflach@kristyflach.com</a></div>
        <div class="team-website"><a href="https://kristyflach.com" target="_blank">kristyflach.com</a></div>
        <div class="team-website"><a href="https://kflach.myprmg.net" target="_blank">kflach.myprmg.net</a></div>
      </div>
    </div>
    <div class="team-logos">
      <img src="PRMG-Logo.png" alt="PRMG">
      <img src="CMA%20Logo.png" alt="Certified Mortgage Advisor">
      <img src="equal-housing-logo.png" alt="Equal Housing Opportunity">
    </div>
  </div>
</section>

<!-- Contact -->
<section class="contact" id="contact">
  <div class="contact-inner">
    <div class="section-accent" style="background:var(--accent);margin:0 auto 10px;"></div>
    <h2 class="contact-heading">Contact</h2>
    <form class="contact-grid" id="contactForm">
      <div class="contact-left">
        <input type="text" class="contact-input" placeholder="Name" name="name" required>
        <input type="email" class="contact-input" placeholder="Email" name="email" required>
        <input type="tel" class="contact-input" placeholder="Phone" name="phone">
      </div>
      <div class="contact-right">
        <textarea class="contact-input" placeholder="Message" name="message" rows="6"></textarea>
      </div>
      <div class="contact-disclaimer">
        By submitting your email address and mobile number, you consent to receiving email and SMS messages from Kristy Flach using an automatic system. Consent to receive SMS messages is not a condition of purchase. Message and data rates may apply. You may unsubscribe at any time.
      </div>
      <button type="submit" class="contact-submit">Send Message</button>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  &copy; 2026 Paramount Residential Mortgage Group, Inc. ("PRMG") NMLS #75243. Equal Housing Opportunity. All applications are subject to underwriting guidelines and approval.
</footer>`;
  
  // Replace dynamic placeholders
  body = body.replace(/HERO_SLIDES_HTML/g, d.heroSlidesHtml || '');
  body = body.replace(/HERO_SRC/g, d.heroSrc || '');
  body = body.replace(/ADDR_STREET/g, d.addr || 'Property Address');
  body = body.replace(/ADDR_CITYSTATE_SHORT/g, (d.city||'')+', '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE_NOSPACE/g, (d.city||'')+' '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE/g, (d.city||'')+', '+(d.state||'')+' '+(d.zip||''));
  body = body.replace(/FULL_ADDR/g, d.fullAddr || '');
  body = body.replace('PRICE_F', d.priceF || '');
  body = body.replace('BANNER_TEXT', d.bannerText || 'Just Listed');
  body = body.replace('TAGLINE', d.tagline || 'One of a Kind');
  body = body.replace('DESC_TEXT', d.desc || '');
  body = body.replace(/GALLERY_TRACK_HTML/g, d.galleryTrackHtml || '');
  body = body.replace(/PHOTO_GRID_HTML/g, d.photoGridHtml || '');
  body = body.replace(/PARALLAX_SRC/g, d.parallaxSrc || d.heroSrc || '');
  body = body.replace('MAP_EMBED', d.mapEmbed || '');
  body = body.replace('MAP_LINK', d.mapLink || '#');
  body = body.replace('AGENT_NAME', d.agent || 'Listing Agent');
  body = body.replace('AGENT_COMPANY', d.agentCompany || '');
  body = body.replace(/AGENT_EMAIL/g, d.agentEmail || '');
  body = body.replace('VIRTUAL_TOUR_LINK', d.virtualTour || '#');

  if (!d.bannerText || d.bannerText === 'None') {
    body = body.replace(/<div class="banner-badge">[^<]*<\/div>/, '');
  }
  if (!d.virtualTour) {
    body = body.replace(/<a[^>]*>Virtual Tour<\/a>/g, '');
  }

  var scriptContent = `// Gallery
var currentSlide=0;
var track=document.getElementById('galleryTrack');
var imgs=track?track.querySelectorAll('img'):[];
var totalSlides=imgs.length;
var dotsEl=document.getElementById('galleryDots');

function buildDots(){
  if(!dotsEl||!totalSlides)return;
  for(var i=0;i<totalSlides;i++){
    var d=document.createElement('div');
    d.className='gallery-dot'+(i===0?' active':'');
    d.setAttribute('data-i',i);
    d.onclick=function(){goToSlide(parseInt(this.getAttribute('data-i')));};
    dotsEl.appendChild(d);
  }
}
function updateDots(){
  if(!dotsEl)return;
  var dots=dotsEl.querySelectorAll('.gallery-dot');
  dots.forEach(function(d,i){d.className='gallery-dot'+(i===currentSlide?' active':'');});
}
function goToSlide(n){
  currentSlide=n;
  if(currentSlide>=totalSlides)currentSlide=0;
  if(currentSlide<0)currentSlide=totalSlides-1;
  track.style.transform='translateX(-'+currentSlide*100+'%)';
  updateDots();
}
function galleryNext(){goToSlide(currentSlide+1);}
function galleryPrev(){goToSlide(currentSlide-1);}
buildDots();
setInterval(function(){galleryNext();},4000);

// Dot nav active state
var sections=['home','stats','about','gallery','location'];
var dots=document.querySelectorAll('.dot-nav a');
window.addEventListener('scroll',function(){
  var scrollPos=window.scrollY+window.innerHeight/2;
  sections.forEach(function(id,i){
    var el=document.getElementById(id);
    if(el&&scrollPos>=el.offsetTop&&scrollPos<el.offsetTop+el.offsetHeight){
      dots.forEach(function(d){d.classList.remove('active');});
      if(dots[i])dots[i].classList.add('active');
    }
  });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var target=document.querySelector(this.getAttribute('href'));
    if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
  });
});`;

  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + (d.fullAddr || 'Property Website') + '</title>' +
    '<meta name="description" content="' + (d.desc || '').substring(0,160) + '">' +
    '<meta property="og:title" content="' + (d.fullAddr || '') + '">' +
    '<meta property="og:image" content="' + (d.heroSrc || '') + '">' +
    '<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">' +
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' + body + '<scr' + 'ipt>' + scriptContent + '</scr' + 'ipt></body></html>';
}


function pwBuildSleek(d) {
  var css = `/* ===== RESET & BASE ===== */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'PT Sans',sans-serif;color:#ccc;overflow-x:hidden;-webkit-font-smoothing:antialiased;background:#111;}
img{max-width:100%;height:auto;display:block;}
a{text-decoration:none;color:inherit;}

/* ===== COLOR SCHEME ===== */
:root{
  --accent:ACCENT_COLOR;
  --accent-dark:ACCENT_DARK;
  --bg-dark:#111;
  --bg-darker:#0a0a0a;
  --bg-section:#161616;
  --border:#222;
  --text-light:#fff;
  --text-muted:rgba(255,255,255,0.5);
}

/* ===== BANNER BADGE ===== */
.banner-badge{
  position:absolute;top:20px;left:20px;z-index:10;
  padding:10px 24px;font-size:12px;letter-spacing:3px;font-weight:700;
  text-transform:uppercase;color:#fff;
  background:var(--accent);
  box-shadow:0 4px 20px rgba(231,76,60,0.4);
}

/* ===== SOCIAL SIDEBAR ===== */
.social-sidebar{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:90;display:flex;flex-direction:column;}
.social-sidebar a{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;transition:opacity 0.3s;}
.social-sidebar a:hover{opacity:0.7;}
.social-fb{background:#3b5998;}.social-x{background:#222;}.social-li{background:#0077b5;}.social-pi{background:#bd081c;}.social-em{background:#555;}

/* ===== HERO ===== */
.hero{
  position:relative;height:100vh;min-height:600px;
  display:flex;align-items:flex-end;
  overflow:hidden;
}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.8) 100%);}
.hero-content{position:relative;z-index:2;padding:60px 50px;max-width:800px;}
.hero-street{font-family:'PT Sans Narrow',sans-serif;font-size:clamp(36px,7vw,68px);font-weight:700;color:var(--text-light);line-height:1.05;text-transform:uppercase;}
.hero-city{font-size:18px;color:var(--text-muted);font-weight:400;margin-top:6px;letter-spacing:2px;}
.hero-btn{
  display:inline-block;margin-top:24px;padding:14px 32px;
  border:2px solid var(--accent);color:var(--accent);
  font-size:12px;letter-spacing:3px;font-weight:700;text-transform:uppercase;
  font-family:'PT Sans',sans-serif;transition:all 0.3s;
}
.hero-btn:hover{background:var(--accent);color:#fff;}

/* ===== STICKY NAV ===== */
.site-nav{
  position:sticky;top:0;z-index:100;
  background:var(--bg-darker);
  display:flex;align-items:center;justify-content:center;
  border-bottom:1px solid var(--border);
}
.nav-links{display:flex;gap:0;}
.nav-links a{
  padding:16px 24px;font-size:11px;letter-spacing:3px;font-weight:700;
  color:var(--text-muted);text-transform:uppercase;transition:all 0.3s;
  border-bottom:2px solid transparent;
}
.nav-links a:hover{color:var(--text-light);border-bottom-color:var(--accent);}

/* ===== SECTION DIVIDERS ===== */
.section-bar{padding:60px 20px;text-align:center;}
.section-bar-inner{max-width:900px;margin:0 auto;}
.section-title{font-family:'PT Sans Narrow',sans-serif;font-size:28px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:4px;margin-bottom:6px;}
.section-line{width:50px;height:2px;background:var(--accent);margin:0 auto 16px;}

/* ===== STATS ===== */
.stats{padding:50px 20px;background:var(--bg-section);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.stats-grid{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center;}
.stat-number{font-family:'PT Sans Narrow',sans-serif;font-size:clamp(36px,5vw,56px);font-weight:700;color:var(--text-light);line-height:1;}
.stat-label{font-size:11px;letter-spacing:3px;color:var(--text-muted);text-transform:uppercase;margin-top:8px;font-weight:400;}

/* ===== ABOUT ===== */
.about{padding:80px 20px;text-align:center;background:var(--bg-dark);}
.about-inner{max-width:800px;margin:0 auto;}
.about-price{font-family:'PT Sans Narrow',sans-serif;font-size:clamp(40px,6vw,60px);font-weight:700;color:var(--text-light);margin:20px 0 30px;}
.about-desc{font-size:16px;line-height:2;color:rgba(255,255,255,0.55);font-weight:400;text-align:justify;}

/* ===== PARALLAX BREAK ===== */
.parallax-break{
  position:relative;height:350px;
  background-size:cover;background-position:center;background-attachment:fixed;
  display:flex;align-items:center;justify-content:center;
}
.parallax-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.6);}
.parallax-content{position:relative;z-index:2;display:flex;gap:16px;flex-wrap:wrap;justify-content:center;}
.parallax-btn{
  padding:14px 32px;border:2px solid var(--accent);color:var(--accent);
  font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
  transition:all 0.3s;background:transparent;
}
.parallax-btn:hover{background:var(--accent);color:#fff;}

/* ===== GALLERY ===== */
.gallery{padding:60px 20px;background:var(--bg-dark);text-align:center;}
.gallery-slider{position:relative;overflow:hidden;max-width:1000px;margin:0 auto;border-radius:2px;}
.gallery-track{display:flex;transition:transform 0.5s ease;}
.gallery-track img{min-width:100%;height:500px;object-fit:cover;user-select:none;}
.gallery-controls{display:flex;justify-content:center;gap:12px;margin-top:20px;}
.gallery-controls button{
  width:44px;height:44px;border-radius:0;border:2px solid var(--accent);
  background:transparent;cursor:pointer;font-size:16px;color:var(--accent);
  transition:all 0.2s;display:flex;align-items:center;justify-content:center;
}
.gallery-controls button:hover{background:var(--accent);color:#fff;}
.gallery-dots{display:flex;justify-content:center;gap:6px;margin-top:14px;}
.gallery-dot{width:8px;height:8px;background:rgba(255,255,255,0.15);cursor:pointer;transition:all 0.3s;}
.gallery-dot.active{background:var(--accent);}

/* ===== LOCATION ===== */
.location{padding:60px 20px;text-align:center;background:var(--bg-section);}
.location-address{font-size:15px;color:var(--text-muted);letter-spacing:1px;margin-top:12px;}
.location-address a{color:var(--accent);font-weight:700;}
.location iframe{width:100%;max-width:1000px;height:450px;border:none;margin-top:20px;filter:grayscale(0.3);}

/* ===== TEAM ===== */
.team{padding:80px 20px;background:var(--bg-dark);text-align:center;}
.team-inner{max-width:1000px;margin:0 auto;}
.team-heading{font-family:'PT Sans Narrow',sans-serif;font-size:28px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:4px;margin-bottom:50px;}
.team-grid{display:flex;justify-content:center;align-items:flex-start;gap:60px;flex-wrap:wrap;}
.team-member{flex:1;min-width:280px;max-width:400px;text-align:center;}
.team-photo{width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 20px;box-shadow:0 6px 30px rgba(0,0,0,0.3);border:3px solid var(--border);}
.team-photo-placeholder{width:140px;height:140px;border-radius:50%;margin:0 auto 20px;background:var(--bg-section);display:flex;align-items:center;justify-content:center;font-size:40px;color:#444;border:3px solid var(--border);box-shadow:0 6px 30px rgba(0,0,0,0.3);}
.team-name{font-size:20px;font-weight:700;color:var(--text-light);}
.team-title{font-size:13px;color:var(--text-muted);margin-top:2px;}
.team-license{font-size:12px;color:#666;}
.team-company{font-size:13px;color:rgba(255,255,255,0.4);margin-top:6px;font-weight:400;}
.team-contact-line{font-size:13px;color:rgba(255,255,255,0.4);margin-top:3px;}
.team-contact-line a{color:var(--accent);font-weight:700;}
.team-website{font-size:12px;margin-top:3px;}
.team-website a{color:var(--accent);}
.team-logos{display:flex;justify-content:center;align-items:center;gap:30px;margin-top:40px;flex-wrap:wrap;}
.team-logos img{height:50px;object-fit:contain;opacity:0.6;filter:brightness(2);}

/* ===== CONTACT ===== */
.contact{padding:80px 20px;background:var(--bg-section);color:var(--text-light);border-top:1px solid var(--border);}
.contact-inner{max-width:900px;margin:0 auto;}
.contact-heading{text-align:center;font-family:'PT Sans Narrow',sans-serif;font-size:28px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin-bottom:40px;}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;}
.contact-left{display:flex;flex-direction:column;gap:16px;}
.contact-input{
  padding:14px 18px;background:rgba(255,255,255,0.04);border:1px solid var(--border);
  color:#fff;font-size:15px;font-family:'PT Sans',sans-serif;
  transition:border-color 0.3s;width:100%;
}
.contact-input:focus{outline:none;border-color:var(--accent);}
.contact-input::placeholder{color:rgba(255,255,255,0.25);}
textarea.contact-input{resize:vertical;min-height:100%;font-family:'PT Sans',sans-serif;}
.contact-right{display:flex;}
.contact-right textarea{flex:1;}
.contact-disclaimer{grid-column:1/-1;font-size:9px;color:rgba(255,255,255,0.2);line-height:1.5;margin-top:8px;}
.contact-submit{
  grid-column:1/-1;justify-self:center;
  padding:14px 50px;border:2px solid var(--accent);
  background:transparent;color:var(--accent);font-size:12px;letter-spacing:4px;
  font-weight:700;text-transform:uppercase;font-family:'PT Sans',sans-serif;
  cursor:pointer;transition:all 0.3s;margin-top:10px;
}
.contact-submit:hover{background:var(--accent);color:#fff;}

/* ===== FOOTER ===== */
.footer{padding:20px;text-align:center;background:var(--bg-darker);font-size:11px;color:rgba(255,255,255,0.15);border-top:1px solid var(--border);}

/* ===== RESPONSIVE ===== */
@media(max-width:768px){
  .stats-grid{grid-template-columns:repeat(2,1fr);gap:30px;}
  .contact-grid{grid-template-columns:1fr;}
  .nav-links{display:none;}
  .team-grid{flex-direction:column;align-items:center;}
  .gallery-track img{height:300px;}
  .hero{align-items:center;}
  .hero-content{padding:40px 24px;}
}
@media(max-width:480px){
  .stats-grid{grid-template-columns:repeat(2,1fr);gap:20px;}
}`;
  css = css.replace('ACCENT_COLOR', d.accentColor || '#e74c3c');
  css = css.replace('ACCENT_DARK', d.accentDark || '#c0392b');

  var body = `<!-- Social Sharing Sidebar -->
<div class="social-sidebar">
  <a href="#" class="social-fb"><i class="fab fa-facebook-f"></i></a>
  <a href="#" class="social-x"><i class="fab fa-x-twitter"></i></a>
  <a href="#" class="social-li"><i class="fab fa-linkedin-in"></i></a>
  <a href="#" class="social-pi"><i class="fab fa-pinterest-p"></i></a>
  <a href="#" class="social-em"><i class="fas fa-envelope"></i></a>
</div>

<!-- Banner Badge -->
<div class="banner-badge">BANNER_TEXT</div>

<!-- Hero -->
<section class="hero" id="home">
  <div class="hero-bg" style="background-image:url('HERO_SRC');"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <h1 class="hero-street">ADDR_STREET</h1>
    <div class="hero-city">ADDR_CITYSTATE</div>
    <a href="#about" class="hero-btn">Explore Property</a>
  </div>
</section>

<!-- Sticky Nav -->
<nav class="site-nav">
  <div class="nav-links">
    <a href="#home">Home</a>
    <a href="#about">Overview</a>
    <a href="#gallery">Gallery</a>
    <a href="#location">Location</a>
    <a href="#team">Team</a>
    <a href="#contact">Contact</a>
  </div>
</nav>

<!-- Stats -->
<section class="stats">
  <div class="stats-grid">
    <div><div class="stat-number">4</div><div class="stat-label">Bedrooms</div></div>
    <div><div class="stat-number">4</div><div class="stat-label">Bathrooms</div></div>
    <div><div class="stat-number">2,912</div><div class="stat-label">Square Feet</div></div>
    <div><div class="stat-number">1993</div><div class="stat-label">Built In</div></div>
  </div>
</section>

<!-- About -->
<section class="about" id="about">
  <div class="about-inner">
    <div class="section-line"></div>
    <div class="section-title">Residence</div>
    <div class="about-price">PRICE_F</div>
    <p class="about-desc">DESC_TEXT</p>
  </div>
</section>

<!-- Parallax Break -->
<section class="parallax-break" style="background-image:url('PARALLAX_SRC');">
  <div class="parallax-overlay"></div>
  <div class="parallax-content">
    <a href="VIRTUAL_TOUR_LINK" target="_blank" class="parallax-btn">Virtual Tour</a>
    <a href="#gallery" class="parallax-btn">Photo Gallery</a>
    <a href="#contact" class="parallax-btn">Schedule a Visit</a>
  </div>
</section>

<!-- Gallery -->
<section class="gallery" id="gallery">
  <div class="section-line"></div>
  <div class="section-title">Gallery</div>
  <div style="height:20px;"></div>
  <div class="gallery-slider">
    <div class="gallery-track" id="galleryTrack">GALLERY_TRACK_HTML</div>
    <div class="gallery-controls">
      <button onclick="galleryPrev()"><i class="fas fa-chevron-left"></i></button>
      <button onclick="galleryNext()"><i class="fas fa-chevron-right"></i></button>
    </div>
    <div class="gallery-dots" id="galleryDots"></div>
  </div>
</section>

<!-- Location -->
<section class="location" id="location">
  <div class="section-line"></div>
  <div class="section-title">Location</div>
  <p class="location-address">
    FULL_ADDR<br>
    <a href="MAP_LINK" target="_blank">View on Google Maps</a>
  </p>
  MAP_EMBED
</section>

<!-- Team -->
<section class="team" id="team">
  <div class="team-inner">
    <div class="section-line"></div>
    <h2 class="team-heading">Who Are We Anyway?</h2>
    <div class="team-grid">
      <!-- REALTOR (Left) -->
      <div class="team-member">
        <div class="team-photo-placeholder"><i class="fas fa-user"></i></div>
        <div class="team-name">AGENT_NAME</div>
        <div class="team-title">Realtor</div>
        <div class="team-company">AGENT_COMPANY</div>
        <div class="team-contact-line"><a href="mailto:AGENT_EMAIL">AGENT_EMAIL</a></div>
      </div>
      <!-- LENDER (Right — always Kristy) -->
      <div class="team-member">
        <img src="hero-headshot.jpg" alt="Kristy Flach" class="team-photo">
        <div class="team-name">Kristy Flach</div>
        <div class="team-title">Certified Mortgage Advisor &amp; Loan Originator</div>
        <div class="team-license">NMLS #2632259</div>
        <div class="team-company">Paramount Residential Mortgage Group, Inc.</div>
        <div class="team-contact-line"><i class="fas fa-phone" style="font-size:11px;margin-right:4px;"></i> (513) 268-3891</div>
        <div class="team-contact-line"><a href="mailto:kflach@prmg.net">kflach@prmg.net</a></div>
        <div class="team-contact-line"><a href="mailto:kflach@kristyflach.com">kflach@kristyflach.com</a></div>
        <div class="team-website"><a href="https://kristyflach.com" target="_blank">kristyflach.com</a></div>
        <div class="team-website"><a href="https://kflach.myprmg.net" target="_blank">kflach.myprmg.net</a></div>
      </div>
    </div>
    <div class="team-logos">
      <img src="PRMG-Logo.png" alt="PRMG">
      <img src="CMA%20Logo.png" alt="Certified Mortgage Advisor">
      <img src="equal-housing-logo.png" alt="Equal Housing Opportunity">
    </div>
  </div>
</section>

<!-- Contact -->
<section class="contact" id="contact">
  <div class="contact-inner">
    <div class="section-line"></div>
    <h2 class="contact-heading">Contact</h2>
    <form class="contact-grid" id="contactForm">
      <div class="contact-left">
        <input type="text" class="contact-input" placeholder="Name" name="name" required>
        <input type="email" class="contact-input" placeholder="Email" name="email" required>
        <input type="tel" class="contact-input" placeholder="Phone" name="phone">
      </div>
      <div class="contact-right">
        <textarea class="contact-input" placeholder="Message" name="message" rows="6"></textarea>
      </div>
      <div class="contact-disclaimer">
        By submitting your email address and mobile number, you consent to receiving email and SMS messages from Kristy Flach using an automatic system. Consent to receive SMS messages is not a condition of purchase. Message and data rates may apply. You may unsubscribe at any time.
      </div>
      <button type="submit" class="contact-submit">Send Message</button>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  &copy; 2026 Paramount Residential Mortgage Group, Inc. ("PRMG") NMLS #75243. Equal Housing Opportunity. All applications are subject to underwriting guidelines and approval.
</footer>`;
  
  // Replace dynamic placeholders
  body = body.replace(/HERO_SLIDES_HTML/g, d.heroSlidesHtml || '');
  body = body.replace(/HERO_SRC/g, d.heroSrc || '');
  body = body.replace(/ADDR_STREET/g, d.addr || 'Property Address');
  body = body.replace(/ADDR_CITYSTATE_SHORT/g, (d.city||'')+', '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE_NOSPACE/g, (d.city||'')+' '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE/g, (d.city||'')+', '+(d.state||'')+' '+(d.zip||''));
  body = body.replace(/FULL_ADDR/g, d.fullAddr || '');
  body = body.replace('PRICE_F', d.priceF || '');
  body = body.replace('BANNER_TEXT', d.bannerText || 'Just Listed');
  body = body.replace('TAGLINE', d.tagline || 'One of a Kind');
  body = body.replace('DESC_TEXT', d.desc || '');
  body = body.replace(/GALLERY_TRACK_HTML/g, d.galleryTrackHtml || '');
  body = body.replace(/PHOTO_GRID_HTML/g, d.photoGridHtml || '');
  body = body.replace(/PARALLAX_SRC/g, d.parallaxSrc || d.heroSrc || '');
  body = body.replace('MAP_EMBED', d.mapEmbed || '');
  body = body.replace('MAP_LINK', d.mapLink || '#');
  body = body.replace('AGENT_NAME', d.agent || 'Listing Agent');
  body = body.replace('AGENT_COMPANY', d.agentCompany || '');
  body = body.replace(/AGENT_EMAIL/g, d.agentEmail || '');
  body = body.replace('VIRTUAL_TOUR_LINK', d.virtualTour || '#');

  if (!d.bannerText || d.bannerText === 'None') {
    body = body.replace(/<div class="banner-badge">[^<]*<\/div>/, '');
  }
  if (!d.virtualTour) {
    body = body.replace(/<a[^>]*>Virtual Tour<\/a>/g, '');
  }

  var scriptContent = `var currentSlide=0;
var track=document.getElementById('galleryTrack');
var imgs=track?track.querySelectorAll('img'):[];
var totalSlides=imgs.length;
var dotsEl=document.getElementById('galleryDots');

function buildDots(){
  if(!dotsEl||!totalSlides)return;
  for(var i=0;i<totalSlides;i++){
    var d=document.createElement('div');
    d.className='gallery-dot'+(i===0?' active':'');
    d.setAttribute('data-i',i);
    d.onclick=function(){goToSlide(parseInt(this.getAttribute('data-i')));};
    dotsEl.appendChild(d);
  }
}
function updateDots(){
  if(!dotsEl)return;
  var dots=dotsEl.querySelectorAll('.gallery-dot');
  dots.forEach(function(d,i){d.className='gallery-dot'+(i===currentSlide?' active':'');});
}
function goToSlide(n){
  currentSlide=n;
  if(currentSlide>=totalSlides)currentSlide=0;
  if(currentSlide<0)currentSlide=totalSlides-1;
  track.style.transform='translateX(-'+currentSlide*100+'%)';
  updateDots();
}
function galleryNext(){goToSlide(currentSlide+1);}
function galleryPrev(){goToSlide(currentSlide-1);}
buildDots();
setInterval(function(){galleryNext();},4000);

document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var target=document.querySelector(this.getAttribute('href'));
    if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
  });
});`;

  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + (d.fullAddr || 'Property Website') + '</title>' +
    '<meta name="description" content="' + (d.desc || '').substring(0,160) + '">' +
    '<meta property="og:title" content="' + (d.fullAddr || '') + '">' +
    '<meta property="og:image" content="' + (d.heroSrc || '') + '">' +
    '<link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=PT+Sans+Narrow:wght@400;700&display=swap" rel="stylesheet">' +
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' + body + '<scr' + 'ipt>' + scriptContent + '</scr' + 'ipt></body></html>';
}


function pwBuildImpact(d) {
  var css = `/* ===== RESET & BASE ===== */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Noto Sans',sans-serif;color:#333;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
img{max-width:100%;height:auto;display:block;}
a{text-decoration:none;color:inherit;}

/* ===== COLOR SCHEME ===== */
:root{
  --accent:ACCENT_COLOR;
  --accent-dark:ACCENT_DARK;
  --dark-bg:#1a1a2e;
  --darker-bg:#12121f;
  --text-light:#fff;
  --text-dark:#1a1a2e;
  --text-muted:rgba(255,255,255,0.5);
  --section-bg:#f5f5f5;
}

/* ===== BANNER BADGE ===== */
.banner-badge{
  position:absolute;top:20px;left:20px;z-index:10;
  padding:10px 24px;font-size:12px;letter-spacing:3px;font-weight:700;
  text-transform:uppercase;color:#fff;
  background:var(--accent);
  box-shadow:0 4px 20px rgba(230,126,34,0.4);
}

/* ===== SOCIAL SIDEBAR ===== */
.social-sidebar{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:90;display:flex;flex-direction:column;}
.social-sidebar a{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;transition:opacity 0.3s;}
.social-sidebar a:hover{opacity:0.7;}
.social-fb{background:#3b5998;}.social-x{background:#000;}.social-li{background:#0077b5;}.social-pi{background:#bd081c;}.social-em{background:#555;}

/* ===== HERO SLIDESHOW ===== */
.hero{position:relative;height:100vh;min-height:600px;overflow:hidden;}
.hero-slides{position:absolute;inset:0;display:flex;transition:transform 1s cubic-bezier(0.25,0.46,0.45,0.94);}
.hero-slide{min-width:100%;height:100%;background-size:cover;background-position:center;}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(26,26,46,0.85) 100%);}
.hero-info{
  position:absolute;bottom:0;left:0;right:0;z-index:2;
  padding:50px;
}
.hero-label{font-size:12px;letter-spacing:5px;color:rgba(255,255,255,0.4);font-weight:400;text-transform:uppercase;}
.hero-street{font-size:clamp(34px,6vw,60px);font-weight:800;color:var(--text-light);line-height:1.1;margin:8px 0;}
.hero-city{font-size:16px;color:rgba(255,255,255,0.5);letter-spacing:3px;font-weight:300;}
.hero-buttons{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px;}
.hero-btn{
  padding:12px 28px;background:var(--accent);color:#fff;
  font-size:12px;letter-spacing:2px;font-weight:700;text-transform:uppercase;
  font-family:'Noto Sans',sans-serif;transition:all 0.3s;border:none;cursor:pointer;
}
.hero-btn:hover{background:var(--accent-dark);}
.hero-btn-outline{
  padding:12px 28px;border:2px solid rgba(255,255,255,0.3);background:transparent;
  color:var(--text-light);font-size:12px;letter-spacing:2px;font-weight:600;
  text-transform:uppercase;font-family:'Noto Sans',sans-serif;transition:all 0.3s;cursor:pointer;
}
.hero-btn-outline:hover{border-color:#fff;background:rgba(255,255,255,0.1);}

/* Slide indicators */
.hero-dots{position:absolute;bottom:20px;right:50px;z-index:5;display:flex;gap:8px;}
.hero-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.25);cursor:pointer;transition:all 0.3s;}
.hero-dot.active{background:var(--accent);transform:scale(1.2);}

/* ===== STATS BAR ===== */
.stats{background:var(--dark-bg);padding:0;}
.stats-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.stat-item{padding:40px 20px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);}
.stat-item:last-child{border-right:none;}
.stat-number{font-size:clamp(36px,5vw,52px);font-weight:300;color:var(--text-light);line-height:1;}
.stat-label{font-size:11px;letter-spacing:4px;color:var(--text-muted);text-transform:uppercase;margin-top:10px;font-weight:400;}

/* ===== ABOUT ===== */
.about{padding:80px 20px;text-align:center;background:#fff;}
.about-inner{max-width:800px;margin:0 auto;}
.section-accent{width:40px;height:3px;background:var(--accent);margin:0 auto 20px;}
.section-heading{font-size:28px;font-weight:800;color:var(--text-dark);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;}
.about-price{font-size:clamp(38px,5vw,56px);font-weight:300;color:var(--text-dark);margin:24px 0 30px;}
.about-desc{font-size:16px;line-height:2;color:#555;font-weight:400;text-align:justify;}

/* ===== GALLERY ===== */
.gallery{padding:60px 20px;background:var(--section-bg);text-align:center;}
.gallery-slider{position:relative;overflow:hidden;max-width:1000px;margin:0 auto;}
.gallery-track{display:flex;transition:transform 0.5s ease;}
.gallery-track img{min-width:100%;height:500px;object-fit:cover;user-select:none;}
.gallery-controls{display:flex;justify-content:center;gap:12px;margin-top:20px;}
.gallery-controls button{
  width:44px;height:44px;border-radius:50%;border:none;
  background:var(--accent);cursor:pointer;font-size:16px;color:#fff;
  transition:all 0.2s;display:flex;align-items:center;justify-content:center;
}
.gallery-controls button:hover{background:var(--accent-dark);}
.gallery-dots{display:flex;justify-content:center;gap:6px;margin-top:14px;}
.gallery-dot{width:8px;height:8px;border-radius:50%;background:rgba(0,0,0,0.12);cursor:pointer;transition:all 0.3s;}
.gallery-dot.active{background:var(--accent);transform:scale(1.3);}

/* ===== PARALLAX CTA ===== */
.cta-parallax{
  position:relative;height:350px;
  background-size:cover;background-position:center;background-attachment:fixed;
  display:flex;align-items:center;justify-content:center;
}
.cta-overlay{position:absolute;inset:0;background:rgba(26,26,46,0.7);}
.cta-content{position:relative;z-index:2;text-align:center;}
.cta-text{font-size:clamp(24px,4vw,40px);font-weight:300;color:var(--text-light);letter-spacing:2px;margin-bottom:24px;}
.cta-btn{
  display:inline-block;padding:16px 40px;background:var(--accent);color:#fff;
  font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
  transition:background 0.3s;
}
.cta-btn:hover{background:var(--accent-dark);}

/* ===== LOCATION ===== */
.location{padding:60px 20px;text-align:center;background:#fff;}
.location-address{font-size:15px;color:#777;letter-spacing:1px;margin-top:12px;}
.location-address a{color:var(--accent);font-weight:600;}
.location iframe{width:100%;max-width:1000px;height:450px;border:none;border-radius:4px;margin-top:20px;box-shadow:0 4px 20px rgba(0,0,0,0.08);}

/* ===== TEAM ===== */
.team{padding:80px 20px;background:var(--section-bg);text-align:center;}
.team-inner{max-width:1000px;margin:0 auto;}
.team-heading{font-size:28px;font-weight:800;color:var(--text-dark);text-transform:uppercase;letter-spacing:2px;margin-bottom:50px;}
.team-grid{display:flex;justify-content:center;align-items:flex-start;gap:60px;flex-wrap:wrap;}
.team-member{flex:1;min-width:280px;max-width:400px;text-align:center;}
.team-photo{width:140px;height:140px;border-radius:50%;object-fit:cover;margin:0 auto 20px;box-shadow:0 6px 30px rgba(0,0,0,0.12);border:4px solid #fff;}
.team-photo-placeholder{width:140px;height:140px;border-radius:50%;margin:0 auto 20px;background:linear-gradient(135deg,#ddd,#eee);display:flex;align-items:center;justify-content:center;font-size:40px;color:#bbb;border:4px solid #fff;box-shadow:0 6px 30px rgba(0,0,0,0.12);}
.team-name{font-size:20px;font-weight:700;color:var(--text-dark);}
.team-title{font-size:13px;color:#777;margin-top:2px;}
.team-license{font-size:12px;color:#999;}
.team-company{font-size:13px;color:#666;margin-top:6px;font-weight:500;}
.team-contact-line{font-size:13px;color:#555;margin-top:3px;}
.team-contact-line a{color:var(--accent);font-weight:600;}
.team-website{font-size:12px;margin-top:3px;}
.team-website a{color:var(--accent);}
.team-logos{display:flex;justify-content:center;align-items:center;gap:30px;margin-top:40px;flex-wrap:wrap;}
.team-logos img{height:50px;object-fit:contain;opacity:0.8;}

/* ===== CONTACT ===== */
.contact{padding:80px 20px;background:var(--dark-bg);color:var(--text-light);}
.contact-inner{max-width:900px;margin:0 auto;}
.contact-heading{text-align:center;font-size:28px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:40px;}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;}
.contact-left{display:flex;flex-direction:column;gap:16px;}
.contact-input{
  padding:14px 18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  border-radius:4px;color:#fff;font-size:15px;font-family:'Noto Sans',sans-serif;
  transition:border-color 0.3s;width:100%;
}
.contact-input:focus{outline:none;border-color:var(--accent);}
.contact-input::placeholder{color:rgba(255,255,255,0.3);}
textarea.contact-input{resize:vertical;min-height:100%;font-family:'Noto Sans',sans-serif;}
.contact-right{display:flex;}
.contact-right textarea{flex:1;}
.contact-disclaimer{grid-column:1/-1;font-size:9px;color:rgba(255,255,255,0.2);line-height:1.5;margin-top:8px;}
.contact-submit{
  grid-column:1/-1;justify-self:center;
  padding:14px 50px;border:none;border-radius:4px;
  background:var(--accent);color:#fff;font-size:12px;letter-spacing:3px;
  font-weight:700;text-transform:uppercase;font-family:'Noto Sans',sans-serif;
  cursor:pointer;transition:all 0.3s;margin-top:10px;
}
.contact-submit:hover{background:var(--accent-dark);}

/* ===== FOOTER ===== */
.footer{padding:20px;text-align:center;background:var(--darker-bg);font-size:11px;color:rgba(255,255,255,0.2);}

/* ===== RESPONSIVE ===== */
@media(max-width:768px){
  .stats-grid{grid-template-columns:repeat(2,1fr);}
  .stat-item{border-right:none;border-bottom:1px solid rgba(255,255,255,0.06);}
  .contact-grid{grid-template-columns:1fr;}
  .team-grid{flex-direction:column;align-items:center;}
  .gallery-track img{height:300px;}
  .hero-info{padding:30px 24px;}
  .hero-dots{right:24px;}
}
@media(max-width:480px){
  .stats-grid{grid-template-columns:repeat(2,1fr);}
  .hero-buttons{flex-direction:column;align-items:flex-start;}
}`;
  css = css.replace('ACCENT_COLOR', d.accentColor || '#e67e22');
  css = css.replace('ACCENT_DARK', d.accentDark || '#d35400');

  var body = `<!-- Social Sharing Sidebar -->
<div class="social-sidebar">
  <a href="#" class="social-fb"><i class="fab fa-facebook-f"></i></a>
  <a href="#" class="social-x"><i class="fab fa-x-twitter"></i></a>
  <a href="#" class="social-li"><i class="fab fa-linkedin-in"></i></a>
  <a href="#" class="social-pi"><i class="fab fa-pinterest-p"></i></a>
  <a href="#" class="social-em"><i class="fas fa-envelope"></i></a>
</div>

<!-- Banner Badge -->
<div class="banner-badge">BANNER_TEXT</div>

<!-- Hero Slideshow -->
<section class="hero" id="home">
  <div class="hero-slides" id="heroSlides">
    <div class="hero-slide" style="background-image:url('PARALLAX_SRC');"></div>
    <div class="hero-slide" style="background-image:url('PARALLAX_SRC');"></div>
    <div class="hero-slide" style="background-image:url('PARALLAX_SRC');"></div>
    <div class="hero-slide" style="background-image:url('PARALLAX_SRC');"></div>
  </div>
  <div class="hero-overlay"></div>
  <div class="hero-info">
    <div class="hero-label">Presented By Agent Edge</div>
    <h1 class="hero-street">ADDR_STREET</h1>
    <div class="hero-city">ADDR_CITYSTATE</div>
    <div class="hero-buttons">
      <a href="#about" class="hero-btn">View Details</a>
      <a href="VIRTUAL_TOUR_LINK" target="_blank" class="hero-btn-outline">Virtual Tour</a>
      <a href="#contact" class="hero-btn-outline">Schedule a Visit</a>
    </div>
  </div>
  <div class="hero-dots" id="heroDots"></div>
</section>

<!-- Stats -->
<section class="stats">
  <div class="stats-grid">
    <div class="stat-item"><div class="stat-number">4</div><div class="stat-label">Bedrooms</div></div>
    <div class="stat-item"><div class="stat-number">4</div><div class="stat-label">Bathrooms</div></div>
    <div class="stat-item"><div class="stat-number">2,912</div><div class="stat-label">Square Feet</div></div>
    <div class="stat-item"><div class="stat-number">1993</div><div class="stat-label">Built In</div></div>
  </div>
</section>

<!-- About -->
<section class="about" id="about">
  <div class="about-inner">
    <div class="section-accent"></div>
    <h2 class="section-heading">Residence</h2>
    <div class="about-price">PRICE_F</div>
    <p class="about-desc">DESC_TEXT</p>
  </div>
</section>

<!-- Gallery -->
<section class="gallery" id="gallery">
  <div class="section-accent"></div>
  <h2 class="section-heading">Gallery</h2>
  <div style="height:20px;"></div>
  <div class="gallery-slider">
    <div class="gallery-track" id="galleryTrack">GALLERY_TRACK_HTML</div>
    <div class="gallery-controls">
      <button onclick="galleryPrev()"><i class="fas fa-chevron-left"></i></button>
      <button onclick="galleryNext()"><i class="fas fa-chevron-right"></i></button>
    </div>
    <div class="gallery-dots" id="galleryDots"></div>
  </div>
</section>

<!-- CTA Parallax -->
<section class="cta-parallax" style="background-image:url('PARALLAX_SRC');">
  <div class="cta-overlay"></div>
  <div class="cta-content">
    <div class="cta-text">Experience It In Person</div>
    <a href="#contact" class="cta-btn">Schedule a Private Tour</a>
  </div>
</section>

<!-- Location -->
<section class="location" id="location">
  <div class="section-accent"></div>
  <h2 class="section-heading">Location</h2>
  <p class="location-address">
    FULL_ADDR<br>
    <a href="MAP_LINK" target="_blank">View on Google Maps</a>
  </p>
  MAP_EMBED
</section>

<!-- Team -->
<section class="team" id="team">
  <div class="team-inner">
    <div class="section-accent"></div>
    <h2 class="team-heading">Who Are We Anyway?</h2>
    <div class="team-grid">
      <!-- REALTOR (Left) -->
      <div class="team-member">
        <div class="team-photo-placeholder"><i class="fas fa-user"></i></div>
        <div class="team-name">AGENT_NAME</div>
        <div class="team-title">Realtor</div>
        <div class="team-company">AGENT_COMPANY</div>
        <div class="team-contact-line"><a href="mailto:AGENT_EMAIL">AGENT_EMAIL</a></div>
      </div>
      <!-- LENDER (Right — always Kristy) -->
      <div class="team-member">
        <img src="hero-headshot.jpg" alt="Kristy Flach" class="team-photo">
        <div class="team-name">Kristy Flach</div>
        <div class="team-title">Certified Mortgage Advisor &amp; Loan Originator</div>
        <div class="team-license">NMLS #2632259</div>
        <div class="team-company">Paramount Residential Mortgage Group, Inc.</div>
        <div class="team-contact-line"><i class="fas fa-phone" style="font-size:11px;margin-right:4px;"></i> (513) 268-3891</div>
        <div class="team-contact-line"><a href="mailto:kflach@prmg.net">kflach@prmg.net</a></div>
        <div class="team-contact-line"><a href="mailto:kflach@kristyflach.com">kflach@kristyflach.com</a></div>
        <div class="team-website"><a href="https://kristyflach.com" target="_blank">kristyflach.com</a></div>
        <div class="team-website"><a href="https://kflach.myprmg.net" target="_blank">kflach.myprmg.net</a></div>
      </div>
    </div>
    <div class="team-logos">
      <img src="PRMG-Logo.png" alt="PRMG">
      <img src="CMA%20Logo.png" alt="Certified Mortgage Advisor">
      <img src="equal-housing-logo.png" alt="Equal Housing Opportunity">
    </div>
  </div>
</section>

<!-- Contact -->
<section class="contact" id="contact">
  <div class="contact-inner">
    <div class="section-accent" style="margin:0 auto 10px;"></div>
    <h2 class="contact-heading">Contact</h2>
    <form class="contact-grid" id="contactForm">
      <div class="contact-left">
        <input type="text" class="contact-input" placeholder="Name" name="name" required>
        <input type="email" class="contact-input" placeholder="Email" name="email" required>
        <input type="tel" class="contact-input" placeholder="Phone" name="phone">
      </div>
      <div class="contact-right">
        <textarea class="contact-input" placeholder="Message" name="message" rows="6"></textarea>
      </div>
      <div class="contact-disclaimer">
        By submitting your email address and mobile number, you consent to receiving email and SMS messages from Kristy Flach using an automatic system. Consent to receive SMS messages is not a condition of purchase. Message and data rates may apply. You may unsubscribe at any time.
      </div>
      <button type="submit" class="contact-submit">Send Message</button>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  &copy; 2026 Paramount Residential Mortgage Group, Inc. ("PRMG") NMLS #75243. Equal Housing Opportunity. All applications are subject to underwriting guidelines and approval.
</footer>`;
  
  // Replace dynamic placeholders
  body = body.replace(/HERO_SLIDES_HTML/g, d.heroSlidesHtml || '');
  body = body.replace(/HERO_SRC/g, d.heroSrc || '');
  body = body.replace(/ADDR_STREET/g, d.addr || 'Property Address');
  body = body.replace(/ADDR_CITYSTATE_SHORT/g, (d.city||'')+', '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE_NOSPACE/g, (d.city||'')+' '+(d.state||''));
  body = body.replace(/ADDR_CITYSTATE/g, (d.city||'')+', '+(d.state||'')+' '+(d.zip||''));
  body = body.replace(/FULL_ADDR/g, d.fullAddr || '');
  body = body.replace('PRICE_F', d.priceF || '');
  body = body.replace('BANNER_TEXT', d.bannerText || 'Just Listed');
  body = body.replace('TAGLINE', d.tagline || 'One of a Kind');
  body = body.replace('DESC_TEXT', d.desc || '');
  body = body.replace(/GALLERY_TRACK_HTML/g, d.galleryTrackHtml || '');
  body = body.replace(/PHOTO_GRID_HTML/g, d.photoGridHtml || '');
  body = body.replace(/PARALLAX_SRC/g, d.parallaxSrc || d.heroSrc || '');
  body = body.replace('MAP_EMBED', d.mapEmbed || '');
  body = body.replace('MAP_LINK', d.mapLink || '#');
  body = body.replace('AGENT_NAME', d.agent || 'Listing Agent');
  body = body.replace('AGENT_COMPANY', d.agentCompany || '');
  body = body.replace(/AGENT_EMAIL/g, d.agentEmail || '');
  body = body.replace('VIRTUAL_TOUR_LINK', d.virtualTour || '#');

  if (!d.bannerText || d.bannerText === 'None') {
    body = body.replace(/<div class="banner-badge">[^<]*<\/div>/, '');
  }
  if (!d.virtualTour) {
    body = body.replace(/<a[^>]*>Virtual Tour<\/a>/g, '');
  }

  var scriptContent = `

// Gallery
var currentSlide=0;
var track=document.getElementById('galleryTrack');
var imgs=track?track.querySelectorAll('img'):[];
var totalSlides=imgs.length;
var dotsEl=document.getElementById('galleryDots');

function buildDots(){
  if(!dotsEl||!totalSlides)return;
  for(var i=0;i<totalSlides;i++){
    var d=document.createElement('div');
    d.className='gallery-dot'+(i===0?' active':'');
    d.setAttribute('data-i',i);
    d.onclick=function(){goToSlide(parseInt(this.getAttribute('data-i')));};
    dotsEl.appendChild(d);
  }
}
function updateDots(){
  if(!dotsEl)return;
  var dots=dotsEl.querySelectorAll('.gallery-dot');
  dots.forEach(function(d,i){d.className='gallery-dot'+(i===currentSlide?' active':'');});
}
function goToSlide(n){
  currentSlide=n;
  if(currentSlide>=totalSlides)currentSlide=0;
  if(currentSlide<0)currentSlide=totalSlides-1;
  track.style.transform='translateX(-'+currentSlide*100+'%)';
  updateDots();
}
function galleryNext(){goToSlide(currentSlide+1);}
function galleryPrev(){goToSlide(currentSlide-1);}
buildDots();
setInterval(function(){galleryNext();},4000);

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var target=document.querySelector(this.getAttribute('href'));
    if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
  });
});`;

  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + (d.fullAddr || 'Property Website') + '</title>' +
    '<meta name="description" content="' + (d.desc || '').substring(0,160) + '">' +
    '<meta property="og:title" content="' + (d.fullAddr || '') + '">' +
    '<meta property="og:image" content="' + (d.heroSrc || '') + '">' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">' +
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' + body + '<scr' + 'ipt>' + scriptContent + '</scr' + 'ipt></body></html>';
}
