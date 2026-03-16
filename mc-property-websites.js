// ===== PROSPECTING PLACEHOLDER =====
function runProspectSearch() {
  var q = document.getElementById('prospectSearch').value.trim();
  if (!q) return;
  showToast('Prospecting coming soon - will search: ' + q);
}

// ===== PROPERTY WEBSITES =====
var pwPhotos = [];
var pwPropertyData = {};

function ppShowWebsiteBuilder() {
  // Hide the main flyers content (orders + templates)
  var flyersTab = document.getElementById('ppFlyers');
  var panels = flyersTab.querySelectorAll(':scope > .mc-panel');
  panels.forEach(function(p) { p.style.display = 'none'; });
  document.getElementById('ppWebsiteBuilder').style.display = 'block';
}

function ppHideWebsiteBuilder() {
  document.getElementById('ppWebsiteBuilder').style.display = 'none';
  var flyersTab = document.getElementById('ppFlyers');
  var panels = flyersTab.querySelectorAll(':scope > .mc-panel');
  panels.forEach(function(p) { p.style.display = ''; });
}

async function pwLoadOrders() {
  var list = document.getElementById('pwOrdersList');
  var badge = document.getElementById('pwOrderCount');
  try {
    var resp = await fetch(API_BASE + '/get-orders');
    var data = await resp.json();
    var allOrders = data.orders || data || [];
    
    // Filter to orders that have websites in items
    var websiteOrders = [];
    allOrders.forEach(function(o) {
      var items = o.items || {};
      var websites = items.websites || [];
      if (websites.length) {
        websites.forEach(function(w) {
          websiteOrders.push({
            orderId: o.order_id || o.id,
            userName: o.user_name || '',
            email: o.user_email || '',
            brokerage: o.brokerage || '',
            status: o.status || 'new',
            coBranding: items.cobrand && items.cobrand.enabled,
            cobrandLayout: items.cobrand ? items.cobrand.layout : '',
            date: o.created_at || '',
            address: w.address || '',
            mls: w.mls || '',
            comments: w.comments || '',
            template: w.template || 'Cavallo',
            colorScheme: w.colorScheme || 'Blue'
          });
        });
      }
    });
    
    if (!websiteOrders.length) {
      list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);">No property website orders yet.</div>';
      badge.style.display = 'none';
      return;
    }
    
    badge.textContent = websiteOrders.length;
    badge.style.display = 'inline';
    
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    websiteOrders.forEach(function(o) {
      var statusColor = o.status === 'new' ? 'var(--accent-blue)' : o.status === 'in progress' ? 'var(--gold)' : 'var(--accent-green)';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--bg-hover);border-radius:8px;cursor:pointer;" onclick="pwLoadOrder(\'' + 
        (o.address||'').replace(/'/g,"\\'") + '\',\'' + 
        (o.mls||'').replace(/'/g,"\\'") + '\',\'' + 
        (o.template||'Cavallo').replace(/'/g,"\\'") + '\',\'' + 
        (o.colorScheme||'Blue').replace(/'/g,"\\'") + '\')">' +
        '<div><div style="font-weight:600;color:var(--text-primary);">' + (o.address || 'No address') + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);">' + 
        (o.mls ? 'MLS #' + o.mls + ' | ' : '') + 
        o.userName + 
        (o.brokerage ? ' | ' + o.brokerage : '') + 
        ' | ' + (o.date ? new Date(o.date).toLocaleDateString() : '') + 
        (o.coBranding ? ' | Co-branded (' + o.cobrandLayout + ')' : '') +
        (o.comments ? ' | "' + o.comments + '"' : '') +
        '</div></div>' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
        '<span style="font-size:11px;padding:3px 10px;border-radius:10px;background:' + statusColor + '22;color:' + statusColor + ';font-weight:600;text-transform:uppercase;">' + o.status + '</span>' +
        '<span style="font-size:12px;color:var(--sage);font-weight:600;">Build <i class="fas fa-arrow-right"></i></span>' +
        '</div></div>';
    });
    html += '</div>';
    list.innerHTML = html;
  } catch(e) {
    list.innerHTML = '<div style="color:var(--accent-red);">Failed to load orders: ' + e.message + '</div>';
  }
}

function pwLoadOrder(address, mls, template, colorScheme) {
  // Parse address into parts if it's a full address string
  var parts = (address || '').split(',').map(function(s){return s.trim();});
  var street = parts[0] || address || '';
  var city = parts[1] || '';
  var stateZip = (parts[2] || '').trim().split(/\s+/);
  var state = stateZip[0] || '';
  var zip = stateZip[1] || '';
  document.getElementById('pwStreet').value = street;
  document.getElementById('pwCity').value = city;
  document.getElementById('pwState').value = state;
  document.getElementById('pwZip').value = zip;
  document.getElementById('pwMls').value = mls;
  if (template) document.getElementById('pwTemplate').value = template;
  if (colorScheme) document.getElementById('pwColor').value = colorScheme;
  ppShowWebsiteBuilder();
  pwLookup();
}

function pwNewLookup() {
  document.getElementById('pwStreet').value = '';
  document.getElementById('pwCity').value = '';
  document.getElementById('pwState').value = '';
  document.getElementById('pwZip').value = '';
  document.getElementById('pwMls').value = '';
  document.getElementById('pwStep2').style.display = 'none';
  document.getElementById('pwStep3').style.display = 'none';
  document.getElementById('pwStep4').style.display = 'none';
  document.getElementById('pwPreviewFrame').style.display = 'none';
  pwPhotos = [];
  pwPropertyData = {};
  var status = document.getElementById('pwLookupStatus');
  status.style.display = 'none';
}

async function pwLookup() {
  var street = document.getElementById('pwStreet').value.trim();
  var city = document.getElementById('pwCity').value.trim();
  var state = document.getElementById('pwState').value.trim();
  var zip = document.getElementById('pwZip').value.trim();
  var address = [street, city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  var mls = document.getElementById('pwMls').value.trim();
  if (!address && !mls) { alert('Enter an address or MLS #.'); return; }
  
  var btn = document.getElementById('pwLookupBtn');
  var status = document.getElementById('pwLookupStatus');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Looking up...';
  status.className = 'status-msg show info';
  status.textContent = 'Searching property databases... this may take 15-30 seconds.';
  
  try {
    var params = [];
    if (address) params.push('address=' + encodeURIComponent(address));
    if (mls) params.push('mls=' + encodeURIComponent(mls));
    var resp = await fetch(API_BASE + '/property-lookup?' + params.join('&'));
    var data = await resp.json();
    
    if (data.success && data.property) {
      pwPropertyData = data.property;
      document.getElementById('pwDataAddress').value = data.property.address || '';
      document.getElementById('pwDataCity').value = data.property.city || '';
      document.getElementById('pwDataState').value = data.property.state || '';
      document.getElementById('pwDataZip').value = data.property.zip || '';
      document.getElementById('pwDataPrice').value = data.property.price || '';
      document.getElementById('pwDataBeds').value = data.property.beds || '';
      document.getElementById('pwDataBaths').value = data.property.baths || '';
      document.getElementById('pwDataSqft').value = data.property.sqft || '';
      document.getElementById('pwDataLot').value = data.property.lotSize || '';
      document.getElementById('pwDataYear').value = data.property.yearBuilt || '';
      document.getElementById('pwDataDesc').value = data.property.description || '';
      document.getElementById('pwDataAgent').value = data.property.listingAgent || '';
      document.getElementById('pwDataType').value = data.property.propertyType || '';
      document.getElementById('pwDataStatus').value = data.property.status || '';
      document.getElementById('pwDataUrl').value = data.property.url || '';
      var openBtn = document.getElementById('pwOpenListing');
      if (data.property.url) {
        openBtn.href = data.property.url;
        openBtn.style.display = 'flex';
      } else {
        openBtn.style.display = 'none';
      }
      
      document.getElementById('pwStep2').style.display = 'block';
      document.getElementById('pwStep3').style.display = 'block';
      document.getElementById('pwStep4').style.display = 'block';
      status.className = 'status-msg show success';
      status.textContent = 'Property found! Review data below, then upload photos from the listing.';
    } else {
      status.className = 'status-msg show error';
      status.textContent = data.error || 'Property not found. Check the address or MLS #.';
    }
  } catch(e) {
    status.className = 'status-msg show error';
    status.textContent = 'Lookup failed: ' + e.message;
  }
  
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-search"></i> Look Up';
}

function pwUploadPhotos(e) {
  var files = Array.from(e.target.files);
  files.forEach(function(file) {
    pwCompressImage(file, function(compressedSrc) {
      pwPhotos.push({ src: compressedSrc, selected: true, role: 'gallery', file: file });
      pwRenderPhotos();
    });
  });
}

function pwCompressImage(file, callback) {
  var reader = new FileReader();
  reader.onload = function(ev) {
    var img = new Image();
    img.onload = function() {
      var maxW = 1920;
      var maxH = 1440;
      var w = img.width;
      var h = img.height;
      if (w > maxW) { h = h * (maxW / w); w = maxW; }
      if (h > maxH) { w = w * (maxH / h); h = maxH; }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      var compressed = canvas.toDataURL('image/jpeg', 0.80);
      callback(compressed);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function pwRenderPhotos() {
  var grid = document.getElementById('pwPhotoGrid');
  grid.innerHTML = '';
  pwPhotos.forEach(function(photo, i) {
    var div = document.createElement('div');
    div.style.cssText = 'position:relative;border-radius:8px;overflow:hidden;border:3px solid ' + (photo.selected ? 'var(--sage)' : 'var(--border)') + ';cursor:pointer;';
    div.innerHTML = '<img src="' + photo.src + '" style="width:100%;height:140px;object-fit:cover;display:block;">' +
      '<div style="padding:8px;background:white;">' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
      '<input type="checkbox" ' + (photo.selected ? 'checked' : '') + ' onchange="pwTogglePhoto(' + i + ',this.checked)" style="margin:0;">' +
      '<span style="font-size:11px;font-weight:600;color:var(--text-secondary);">Photo ' + (i+1) + '</span>' +
      '</div>' +
      '<select onchange="pwSetRole(' + i + ',this.value)" style="width:100%;font-size:11px;padding:3px;border:1px solid var(--border);border-radius:4px;">' +
      '<option value="hero"' + (photo.role==='hero'?' selected':'') + '>Hero Image</option>' +
      '<option value="gallery"' + (photo.role==='gallery'?' selected':'') + '>Gallery</option>' +
      '<option value="parallax"' + (photo.role==='parallax'?' selected':'') + '>Parallax Background</option>' +
      '</select>' +
      '</div>' +
      '<button onclick="pwRemovePhoto(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>';
    grid.appendChild(div);
  });
}

function pwTogglePhoto(i, checked) { pwPhotos[i].selected = checked; pwRenderPhotos(); }
function pwSetRole(i, role) { pwPhotos[i].role = role; }
function pwRemovePhoto(i) { pwPhotos.splice(i, 1); pwRenderPhotos(); }
function pwSelectAll() { pwPhotos.forEach(function(p) { p.selected = true; }); pwRenderPhotos(); }
function pwDeselectAll() { pwPhotos.forEach(function(p) { p.selected = false; }); pwRenderPhotos(); }

function pwPreview() {
  var selectedPhotos = pwPhotos.filter(function(p) { return p.selected; });
  var heroPhoto = selectedPhotos.find(function(p) { return p.role === 'hero'; }) || selectedPhotos[0];
  var parallaxPhoto = selectedPhotos.find(function(p) { return p.role === 'parallax'; });
  var galleryPhotos = selectedPhotos.filter(function(p) { return p.role === 'gallery' || (!heroPhoto || p !== heroPhoto); });
  
  var addr = document.getElementById('pwDataAddress').value || 'Property Address';
  var city = document.getElementById('pwDataCity').value || '';
  var state = document.getElementById('pwDataState').value || '';
  var zip = document.getElementById('pwDataZip').value || '';
  var price = document.getElementById('pwDataPrice').value || '';
  var beds = document.getElementById('pwDataBeds').value || '';
  var baths = document.getElementById('pwDataBaths').value || '';
  var sqft = document.getElementById('pwDataSqft').value || '';
  var lot = document.getElementById('pwDataLot').value || '';
  var year = document.getElementById('pwDataYear').value || '';
  var desc = document.getElementById('pwDataDesc').value || '';
  var agent = document.getElementById('pwDataAgent').value || '';
  var template = document.getElementById('pwTemplate').value || 'Cavallo';
  var color = document.getElementById('pwColor').value || 'Navy';
  
  var colorMap = {Blue:'#2563eb',Navy:'#002556',Black:'#111111',Green:'#166534',Red:'#991b1b',Gold:'#92700c',Charcoal:'#374151'};
  var c = colorMap[color] || '#002556';
  var cLight = c + '18';
  
  var heroSrc = heroPhoto ? heroPhoto.src : '';
  var parallaxSrc = parallaxPhoto ? parallaxPhoto.src : heroSrc;
  var fullAddr = addr + (city ? ', ' + city : '') + (state ? ' ' + state : '') + (zip ? ' ' + zip : '');
  
  var galleryHtml = '';
  galleryPhotos.forEach(function(p,i) {
    galleryHtml += '<img src="' + p.src + '" class="gal-img" alt="Photo ' + (i+1) + '">';
  });

  var statsHtml = '';
  if(price) statsHtml += '<div class="stat"><div class="stat-val">$'+Number(price).toLocaleString()+'</div><div class="stat-lbl">Price</div></div>';
  if(beds) statsHtml += '<div class="stat"><div class="stat-val">'+beds+'</div><div class="stat-lbl">Beds</div></div>';
  if(baths) statsHtml += '<div class="stat"><div class="stat-val">'+baths+'</div><div class="stat-lbl">Baths</div></div>';
  if(sqft) statsHtml += '<div class="stat"><div class="stat-val">'+Number(sqft).toLocaleString()+'</div><div class="stat-lbl">Sq Ft</div></div>';
  if(lot) statsHtml += '<div class="stat"><div class="stat-val">'+lot+'</div><div class="stat-lbl">Lot</div></div>';
  if(year) statsHtml += '<div class="stat"><div class="stat-val">'+year+'</div><div class="stat-lbl">Built</div></div>';

  var html = '';
  var bannerVal = document.getElementById('pwBanner') ? document.getElementById('pwBanner').value : 'None';
  var colorAccentMap = {Blue:'#3a7bd5',Navy:'#002556',Black:'#111111',Green:'#166534',Red:'#991b1b',Gold:'#92700c',Charcoal:'#374151'};
  var colorDarkMap = {Blue:'#2a5fa0',Navy:'#001a3d',Black:'#000000',Green:'#14532d',Red:'#7f1d1d',Gold:'#78590a',Charcoal:'#1f2937'};

  // Hero = single static hero photo, NOT a slideshow
  var tplHeroHtml = heroSrc ? '<div class="hero-slide" style="background-image:url(\'' + heroSrc + '\');"></div>' : '';
  // Gallery = all selected photos except parallax
  var tplGalleryHtml = '';
  selectedPhotos.forEach(function(p) {
    if (p.role !== 'parallax') tplGalleryHtml += '<img src="' + p.src + '" alt="Property Photo">';
  });
  // Photo grid for Contemporary (clickable)
  var tplPhotoGridHtml = '';
  selectedPhotos.forEach(function(p, i) {
    if (p.role !== 'parallax') tplPhotoGridHtml += '<img src="' + p.src + '" onclick="openLB(' + i + ')" alt="">';
  });
  var mapAddr = encodeURIComponent(fullAddr);

  // Shared data object for all templates
  var tplData = {
    addr: addr, city: city, state: state, zip: zip, fullAddr: fullAddr,
    priceF: price ? '$' + Number(price).toLocaleString() : '',
    beds: beds, baths: baths, sqftF: sqft ? Number(sqft).toLocaleString() : '', year: year, lot: lot,
    desc: desc, agent: agent, agentCompany: '', agentEmail: '',
    heroSrc: heroSrc, parallaxSrc: parallaxSrc,
    heroSlidesHtml: tplHeroHtml,
    galleryTrackHtml: tplGalleryHtml,
    photoGridHtml: tplPhotoGridHtml,
    mapEmbed: '<iframe src="https://www.google.com/maps/embed?origin=mfe&pb=!1m2!2m1!1s' + mapAddr + '"></iframe>',
    mapLink: 'https://maps.google.com/maps?q=' + mapAddr,
    bannerText: bannerVal,
    tagline: 'One of a Kind',
    virtualTour: '',
    accentColor: colorAccentMap[color] || '#002556',
    accentDark: colorDarkMap[color] || '#001a3d'
  };

  if (template === 'Cavallo') {
    html = pwBuildCavallo(tplData);
  } else if (template === 'Stylish') {
    html = pwBuildStylish(tplData);
  } else if (template === 'Vertical') {
    html = pwBuildVertical(tplData);
  } else if (template === 'Sleek') {
    html = pwBuildSleek(tplData);
  } else if (template === 'Impact') {
    html = pwBuildImpact(tplData);
  } else if (template === 'Modern') {
    html = pwBuildModern(tplData);
  } else if (template === 'Contemporary') {
    html = pwBuildContemporary(tplData);
  }
  
  var frame = document.getElementById('pwPreviewFrame');
  frame.style.display = 'block';
  var iframe = document.getElementById('pwIframe');
  var blob = new Blob([html], {type: 'text/html'});
  iframe.src = URL.createObjectURL(blob);
}

function pwGenerate() {
  var status = document.getElementById('pwGenerateStatus');
  var btn = document.getElementById('pwGenerateBtn');
  status.style.display = 'block';
  status.className = 'status-msg show info';
  status.textContent = 'Preparing site...';
  btn.disabled = true;
  btn.style.opacity = '0.6';

  // First run preview to build the HTML
  pwPreview();

  var iframe = document.getElementById('pwIframe');
  setTimeout(async function() {
    try {
      var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      var siteHtml = '<!DOCTYPE html>' + iframeDoc.documentElement.outerHTML;

      // Build slug from address
      var addr = document.getElementById('pwDataAddress').value || 'property';
      var city = document.getElementById('pwDataCity').value || '';
      var slug = (addr + '-' + city).toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);

      // Collect photos that need uploading (base64 data URLs)
      var selectedPhotos = pwPhotos.filter(function(p) { return p.selected; });
      var photosToUpload = [];

      selectedPhotos.forEach(function(p, i) {
        if (p.src && p.src.startsWith('data:')) {
          photosToUpload.push({ src: p.src, role: p.role, index: i });
        }
      });

      // Upload photos one at a time using existing upload-image endpoint
      var totalPhotos = photosToUpload.length;
      var photoUrlMap = {}; // base64 src -> permanent supabase url

      for (var i = 0; i < totalPhotos; i++) {
        var photo = photosToUpload[i];
        status.textContent = 'Uploading photo ' + (i + 1) + ' of ' + totalPhotos + '...';

        try {
          var resp = await fetch('https://agent-edge-backend.vercel.app/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: photo.src,
              filename: slug + '-' + photo.role + '-' + photo.index
            })
          });
          var data = await resp.json();
          if (data.success && data.url) {
            photoUrlMap[photo.src] = data.url;
          }
        } catch (uploadErr) {
          console.error('Photo ' + i + ' upload failed:', uploadErr);
        }
      }

      status.textContent = 'Building site...';

      // Replace all base64 data URLs in the HTML with permanent Supabase URLs
      Object.keys(photoUrlMap).forEach(function(oldSrc) {
        siteHtml = siteHtml.split(oldSrc).join(photoUrlMap[oldSrc]);
      });

      // Now upload just the HTML file (small) to publish-site endpoint
      status.textContent = 'Publishing...';

      var publishResp = await fetch('https://agent-edge-backend.vercel.app/api/publish-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug,
          html: siteHtml,
          address: (document.getElementById('pwDataAddress').value || '') + ', ' + (document.getElementById('pwDataCity').value || '') + ' ' + (document.getElementById('pwDataState').value || '') + ' ' + (document.getElementById('pwDataZip').value || ''),
          agent: document.getElementById('pwDataAgent').value || '',
          template: document.getElementById('pwTemplate').value || ''
        })
      });
      var publishData = await publishResp.json();

      btn.disabled = false;
      btn.style.opacity = '1';

      if (publishData.success && publishData.url) {
        status.className = 'status-msg show success';
        status.innerHTML = '<i class="fas fa-check-circle" style="margin-right:6px;"></i> Published! ' + totalPhotos + ' photos uploaded.<br>' +
          '<a href="' + publishData.url + '" target="_blank" style="color:#16a34a;font-weight:700;text-decoration:underline;word-break:break-all;">' + publishData.url + '</a>' +
          '<br><button onclick="navigator.clipboard.writeText(\'' + publishData.url + '\');this.textContent=\'Copied!\';var b=this;setTimeout(function(){b.textContent=\'Copy Link\';},1500);" style="margin-top:8px;padding:6px 16px;border-radius:6px;border:1px solid #16a34a;background:white;color:#16a34a;font-family:\'DM Sans\',sans-serif;font-size:11px;font-weight:700;cursor:pointer;">Copy Link</button>';
      } else {
        status.className = 'status-msg show error';
        status.textContent = 'Publish failed: ' + (publishData.error || 'Unknown error');
      }

    } catch (err) {
      btn.disabled = false;
      btn.style.opacity = '1';
      status.className = 'status-msg show error';
      status.textContent = 'Publish failed: ' + err.message;
      console.error('pwGenerate error:', err);
    }
  }, 1500);
}

