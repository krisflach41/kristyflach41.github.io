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
    <div class="hero-slides" id="heroSlides">HERO_SLIDES_HTML</div><div class="hero-slide-dots" id="heroDots"></div>
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

  var scriptContent = `// Hero slideshow
var heroIdx=0;
var heroSlides=document.getElementById('heroSlides');
var heroTotal=heroSlides?heroSlides.children.length:0;
var heroDots=document.getElementById('heroDots');

function buildHeroDots(){
  if(!heroDots||!heroTotal)return;
  for(var i=0;i<heroTotal;i++){
    var d=document.createElement('div');
    d.className='hero-slide-dot'+(i===0?' active':'');
    d.setAttribute('data-i',i);
    d.onclick=function(){heroGoTo(parseInt(this.getAttribute('data-i')));};
    heroDots.appendChild(d);
  }
}
function updateHeroDots(){
  if(!heroDots)return;
  var dots=heroDots.querySelectorAll('.hero-slide-dot');
  dots.forEach(function(d,i){d.className='hero-slide-dot'+(i===heroIdx?' active':'');});
}
function heroGoTo(n){
  heroIdx=n;
  if(heroIdx>=heroTotal)heroIdx=0;
  if(heroIdx<0)heroIdx=heroTotal-1;
  heroSlides.style.transform='translateX(-'+heroIdx*100+'%)';
  updateHeroDots();
}
buildHeroDots();
setInterval(function(){heroGoTo(heroIdx+1);},5000);

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
    '<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">' +
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' + body + '<script>' + scriptContent + '<\/script></body></html>';
}
