/* ===================================================
   AGENT EDGE — FEATURE GATING SYSTEM
   
   Usage counts persist in Supabase via /api/usage
   Falls back to localStorage if API is unavailable
   
   TRIAL members:
   - Marketing/Advisory: FULL access, can order, NO co-branding
   - Education Videos & Loan Guides: full access
   - Income Calculator: can see, can't use
   - Self-Employed Calculator: can see, can't use
   - Credit Score Simulator: can see, can't use
   - Credit Score Education: can see, can't use
   - Messaging Image Library: full access
   - Messaging Grab & Go: 5 free uses
   - Messaging On-Demand AI: 5 free uses
   
   PARTNER members: everything unlocked
=================================================== */

(function() {
  'use strict';

  var API_BASE = 'https://agent-edge-backend.vercel.app/api';

  // ===== USER ROLE =====
  function getUserRole() {
    return sessionStorage.getItem('agentEdgeRole') || 'trial';
  }

  function isPartner() {
    var role = getUserRole();
    return role === 'partner' || role === 'admin';
  }

  function isAdmin() {
    return sessionStorage.getItem('agentEdgeAdmin') === 'true';
  }

  function getUserEmail() {
    return sessionStorage.getItem('agentEdgeUserEmail') || sessionStorage.getItem('agentEdgeUser') || '';
  }

  function hasHeadshot() {
    return sessionStorage.getItem('agentEdgeHasHeadshot') === 'true';
  }

  // ===== USAGE TRACKING (Supabase-backed) =====
  // Cache counts in sessionStorage so we don't hit API on every page load
  var usageCache = JSON.parse(sessionStorage.getItem('agentEdgeUsageCache') || '{}');
  var usageCacheLoaded = false;

  // Load counts from Supabase on first page load
  function loadUsageCounts(callback) {
    if (usageCacheLoaded) {
      if (callback) callback();
      return;
    }

    var email = getUserEmail();
    if (!email) {
      usageCacheLoaded = true;
      if (callback) callback();
      return;
    }

    fetch(API_BASE + '/usage?email=' + encodeURIComponent(email))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.counts) {
          usageCache = data.counts;
          sessionStorage.setItem('agentEdgeUsageCache', JSON.stringify(usageCache));
        }
        usageCacheLoaded = true;
        if (callback) callback();
      })
      .catch(function() {
        // Fall back to localStorage
        usageCache = JSON.parse(localStorage.getItem('agentEdgeUsageCounts') || '{}');
        usageCacheLoaded = true;
        if (callback) callback();
      });
  }

  function getUsageCount(toolKey) {
    return usageCache[toolKey] || 0;
  }

  function incrementUsage(toolKey) {
    usageCache[toolKey] = (usageCache[toolKey] || 0) + 1;
    sessionStorage.setItem('agentEdgeUsageCache', JSON.stringify(usageCache));
    // Also keep localStorage as backup
    localStorage.setItem('agentEdgeUsageCounts', JSON.stringify(usageCache));

    // Persist to Supabase (fire and forget)
    var email = getUserEmail();
    if (email) {
      fetch(API_BASE + '/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, toolKey: toolKey })
      }).catch(function() { /* silent fail */ });
    }

    return usageCache[toolKey];
  }

  // ===== PAGE DETECTION =====
  function getPageKey() {
    var path = window.location.pathname;
    return path.split('/').pop().replace('.html', '').replace('.htm', '') || 'index';
  }

  // Pages where trial users can SEE but not USE
  var VIEW_ONLY_PAGES = [
    'income-calculator',
    'self-employed-calculator',
    'credit-score-simulator',
    'credit-score-education'
  ];

  // Pages with usage limits (5 free)
  var USAGE_LIMITED_PAGES = {
    'messaging-grabandgo': { key: 'grab-and-go', limit: 5, name: 'Grab & Go posts' },
    'messaging-ondemand': { key: 'on-demand', limit: 5, name: 'On-Demand AI posts' }
  };

  // ===== PREMIUM MODAL =====
  window.showPremiumModal = function(featureName) {
    var existing = document.getElementById('premiumModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'premiumModal';
    modal.className = 'premium-modal-backdrop';
    modal.innerHTML = 
      '<div class="premium-modal">' +
        '<div class="premium-modal-icon">&#128274;</div>' +
        '<h3 class="premium-modal-title">Partner Feature</h3>' +
        '<p class="premium-modal-message">' + 
          (featureName ? '<strong>' + featureName + '</strong> is a premium feature for Partner members.' : 'This is a premium feature for Partner members.') +
          ' Upgrade to unlock full access to everything Agent Edge has to offer.' +
        '</p>' +
        '<div class="premium-modal-buttons">' +
          '<a href="convert-membership.html" class="premium-modal-upgrade">Become a Partner</a>' +
          '<button onclick="document.getElementById(\'premiumModal\').remove()" class="premium-modal-close">Maybe Later</button>' +
        '</div>' +
      '</div>';

    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  };

  // ===== USAGE LIMIT MODAL =====
  window.showUsageLimitModal = function(toolName, used, limit) {
    var existing = document.getElementById('premiumModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'premiumModal';
    modal.className = 'premium-modal-backdrop';
    modal.innerHTML = 
      '<div class="premium-modal">' +
        '<div class="premium-modal-icon">&#9889;</div>' +
        '<h3 class="premium-modal-title">Free Limit Reached</h3>' +
        '<p class="premium-modal-message">' + 
          'You\'ve used all <strong>' + limit + ' free ' + toolName + '</strong> in your explorer account. ' +
          'Become a Partner for unlimited access!' +
        '</p>' +
        '<div class="premium-modal-buttons">' +
          '<a href="convert-membership.html" class="premium-modal-upgrade">Become a Partner</a>' +
          '<button onclick="document.getElementById(\'premiumModal\').remove()" class="premium-modal-close">Maybe Later</button>' +
        '</div>' +
      '</div>';

    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  };

  // ===== USAGE REMAINING BANNER =====
  function showUsageBanner(toolName, used, limit) {
    var remaining = limit - used;
    if (remaining <= 0) return;

    var banner = document.createElement('div');
    banner.className = 'usage-banner';
    banner.innerHTML = 
      '<div class="usage-banner-inner">' +
        '<div class="usage-banner-text">' +
          '<span class="usage-banner-icon">&#9889;</span>' +
          '<strong>' + remaining + ' of ' + limit + ' free ' + toolName + ' remaining</strong>' +
          '<span class="usage-banner-sub">in your explorer account</span>' +
        '</div>' +
        '<a href="convert-membership.html" class="usage-banner-btn">Become a Partner for Full Access</a>' +
      '</div>';

    document.body.insertBefore(banner, document.body.firstChild);
    document.body.style.paddingTop = (banner.offsetHeight) + 'px';
  }

  // ===== FULL PAGE OVERLAY (for view-only pages) =====
  function applyPageOverlay(title, message) {
    var overlay = document.createElement('div');
    overlay.className = 'premium-page-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(255,255,255,0.45)';
    overlay.style.backdropFilter = 'none';

    overlay.innerHTML = 
      '<div style="text-align:center; padding:40px; max-width:450px; background:rgba(255,255,255,0.92); border-radius:18px; box-shadow:0 10px 40px rgba(0,0,0,0.1);">' +
        '<div style="font-size:48px; margin-bottom:16px;">&#128274;</div>' +
        '<h2 style="font-size:24px; font-weight:700; color:#0b1f3a; margin:0 0 12px;">' + title + '</h2>' +
        '<p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:28px;">' + message + '</p>' +
        '<a href="convert-membership.html" style="' +
          'display:inline-block; padding:14px 36px;' +
          'background:linear-gradient(135deg,#0b4ea2,#1e6fd4);' +
          'color:white; border-radius:10px; text-decoration:none;' +
          'font-weight:700; font-size:16px;' +
          'box-shadow:0 4px 15px rgba(11,78,162,0.3);' +
        '">Become a Partner</a>' +
        '<br><a href="portal.html" style="' +
          'display:inline-block; margin-top:16px; color:#999;' +
          'text-decoration:none; font-size:14px;' +
        '">Back to Portal</a>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  // ===== GLOBAL HELPER FUNCTIONS =====

  window.checkPremiumAccess = function(featureName) {
    if (isPartner() || isAdmin()) return true;
    showPremiumModal(featureName);
    return false;
  };

  window.checkUsageLimit = function(toolKey, limit) {
    if (isPartner() || isAdmin()) return true;
    
    var used = getUsageCount(toolKey);
    if (used >= limit) {
      var config = null;
      for (var page in USAGE_LIMITED_PAGES) {
        if (USAGE_LIMITED_PAGES[page].key === toolKey) {
          config = USAGE_LIMITED_PAGES[page];
          break;
        }
      }
      showUsageLimitModal(config ? config.name : toolKey, used, limit);
      return false;
    }
    
    incrementUsage(toolKey);
    return true;
  };

  window.checkCoBranding = function() {
    if (!isPartner() && !isAdmin()) {
      showPremiumModal('Co-Branded Materials');
      return false;
    }
    if (!hasHeadshot()) {
      var existing = document.getElementById('premiumModal');
      if (existing) existing.remove();

      var modal = document.createElement('div');
      modal.id = 'premiumModal';
      modal.className = 'premium-modal-backdrop';
      modal.innerHTML = 
        '<div class="premium-modal">' +
          '<div class="premium-modal-icon">&#128247;</div>' +
          '<h3 class="premium-modal-title">Headshot Needed</h3>' +
          '<p class="premium-modal-message">' + 
            'To create co-branded materials, we need your professional headshot. ' +
            'Upload it in your profile and you\'re all set!' +
          '</p>' +
          '<div class="premium-modal-buttons">' +
            '<a href="convert-membership.html" class="premium-modal-upgrade">Upload Headshot</a>' +
            '<button onclick="document.getElementById(\'premiumModal\').remove()" class="premium-modal-close">Later</button>' +
          '</div>' +
        '</div>';

      modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
      });

      document.body.appendChild(modal);
      return false;
    }
    return true;
  };

  // ===== INJECT STYLES =====
  var style = document.createElement('style');
  style.textContent = 
    '.premium-modal-backdrop {' +
      'position:fixed; top:0; left:0; right:0; bottom:0;' +
      'background:rgba(0,0,0,0.4); backdrop-filter:blur(4px);' +
      'display:flex; align-items:center; justify-content:center;' +
      'z-index:10000;' +
    '}' +
    '.premium-modal {' +
      'background:white; border-radius:18px; padding:40px;' +
      'max-width:420px; width:90%; text-align:center;' +
      'box-shadow:0 25px 60px rgba(0,0,0,0.15);' +
    '}' +
    '.premium-modal-icon { font-size:40px; margin-bottom:12px; }' +
    '.premium-modal-title { font-size:22px; font-weight:700; color:#0b1f3a; margin:0 0 12px; }' +
    '.premium-modal-message { font-size:14px; color:#555; line-height:1.6; margin-bottom:25px; }' +
    '.premium-modal-buttons { display:flex; flex-direction:column; gap:10px; align-items:center; }' +
    '.premium-modal-upgrade {' +
      'display:inline-block; width:100%; padding:14px 30px;' +
      'background:linear-gradient(135deg,#0b4ea2,#1e6fd4);' +
      'color:white; border-radius:10px; text-decoration:none;' +
      'font-weight:700; font-size:16px; box-sizing:border-box; text-align:center;' +
    '}' +
    '.premium-modal-upgrade:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(11,78,162,0.3); }' +
    '.premium-modal-close { background:none; border:none; color:#999; font-size:14px; cursor:pointer; padding:8px; }' +
    '.premium-modal-close:hover { color:#666; }' +
    /* Big visible usage banner */
    '.usage-banner {' +
      'position:fixed; top:0; left:0; right:0; z-index:9000;' +
      'background:linear-gradient(135deg, #f59e0b, #d97706);' +
      'box-shadow: 0 4px 20px rgba(217,119,6,0.4);' +
    '}' +
    '.usage-banner-inner {' +
      'max-width:1100px; margin:0 auto; padding:14px 24px;' +
      'display:flex; align-items:center; justify-content:space-between;' +
      'flex-wrap:wrap; gap:12px;' +
    '}' +
    '.usage-banner-text {' +
      'display:flex; align-items:center; gap:10px; flex-wrap:wrap;' +
      'color:#7c2d12; font-size:15px;' +
    '}' +
    '.usage-banner-icon { font-size:20px; }' +
    '.usage-banner-sub { font-size:13px; opacity:0.8; }' +
    '.usage-banner-btn {' +
      'background:white; color:#d97706; padding:8px 20px;' +
      'border-radius:8px; text-decoration:none; font-weight:700;' +
      'font-size:13px; white-space:nowrap;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.1);' +
      'transition:0.2s ease;' +
    '}' +
    '.usage-banner-btn:hover {' +
      'transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.15);' +
    '}' +
    '@media (max-width:600px) {' +
      '.usage-banner-inner { justify-content:center; text-align:center; }' +
      '.usage-banner-text { justify-content:center; }' +
    '}';

  document.head.appendChild(style);

  // ===== AUTO-APPLY ON PAGE LOAD =====
  document.addEventListener('DOMContentLoaded', function() {
    // Partners and admins skip all gating
    if (isPartner() || isAdmin()) return;

    // Block cancelled users everywhere
    if (getUserRole() === 'cancelled') {
      window.location.href = 'login.html';
      return;
    }

    var page = getPageKey();

    // ----- VIEW-ONLY PAGES (can see, can't use) -----
    if (VIEW_ONLY_PAGES.indexOf(page) !== -1) {
      applyPageOverlay(
        'Partner Feature',
        'This tool is fully functional for Partner members. You can preview it here, but upgrade to use it with your clients!'
      );
      return;
    }

    // ----- USAGE-LIMITED PAGES -----
    var limitConfig = USAGE_LIMITED_PAGES[page];
    if (limitConfig) {
      // Load counts from Supabase first, then apply gating
      loadUsageCounts(function() {
        var used = getUsageCount(limitConfig.key);
        
        if (used >= limitConfig.limit) {
          applyPageOverlay(
            'Free Limit Reached',
            'You\'ve used all ' + limitConfig.limit + ' free ' + limitConfig.name + ' in your explorer account. Become a Partner for unlimited access!'
          );
        } else {
          showUsageBanner(limitConfig.name, used, limitConfig.limit);
        }
      });
    }
  });

})();
