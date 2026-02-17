/* ===================================================
   AGENT EDGE — FEATURE GATING SYSTEM
   
   Auto-detects page and applies appropriate gates.
   Drop this script into ANY page — it handles the rest.
   
   TRIAL members:
   - Marketing/Advisory: full access, NO co-branding
   - Education Videos & Loan Guides: full access
   - Education Calculators: can see, can't use
   - Education Credit Tools: can see, can't use
   - Messaging Image Library: full access
   - Messaging Grab & Go: 5 free uses
   - Messaging On-Demand AI: 5 free uses
   - Checkout/Ordering: blocked
   
   PARTNER members: everything unlocked
   
   Manual gating also available:
   - checkPremiumAccess('Feature Name') → returns true/false
   - checkUsageLimit('tool-key', 5) → returns true/false
=================================================== */

(function() {
  'use strict';

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

  function hasHeadshot() {
    // TODO: check from CRM contact data when loaded
    return sessionStorage.getItem('agentEdgeHasHeadshot') === 'true';
  }

  // ===== USAGE TRACKING =====
  function getUsageCount(toolKey) {
    var counts = JSON.parse(localStorage.getItem('agentEdgeUsageCounts') || '{}');
    return counts[toolKey] || 0;
  }

  function incrementUsage(toolKey) {
    var counts = JSON.parse(localStorage.getItem('agentEdgeUsageCounts') || '{}');
    counts[toolKey] = (counts[toolKey] || 0) + 1;
    localStorage.setItem('agentEdgeUsageCounts', JSON.stringify(counts));
    return counts[toolKey];
  }

  // ===== PAGE DETECTION =====
  function getPageKey() {
    var path = window.location.pathname;
    return path.split('/').pop().replace('.html', '').replace('.htm', '') || 'index';
  }

  // Pages that are FULLY BLOCKED for trial users
  var BLOCKED_PAGES = ['checkout'];

  // Pages where trial users can SEE but not USE (overlay applied)
  var VIEW_ONLY_PAGES = [
    'income-calculator',
    'self-employed-calculator',
    'credit-score-simulator',
    'credit-score-education',
    'education-calculators',
    'education-credit-tools'
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
          '<a href="convert-membership.html" class="premium-modal-upgrade">Upgrade to Partner</a>' +
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
          'You\'ve used all <strong>' + limit + ' free ' + toolName + '</strong> in your trial. ' +
          'Upgrade to Partner for unlimited access!' +
        '</p>' +
        '<div class="premium-modal-buttons">' +
          '<a href="convert-membership.html" class="premium-modal-upgrade">Upgrade to Partner</a>' +
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
      '<span>&#9889; <strong>' + remaining + ' free ' + toolName + ' remaining</strong> in your trial</span>' +
      '<a href="convert-membership.html">Upgrade for unlimited</a>';

    // Insert at top of body
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // ===== FULL PAGE OVERLAY (for blocked/view-only pages) =====
  function applyPageOverlay(title, message, showContent) {
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

    if (showContent) {
      // Semi-transparent — they can see the page behind it
      overlay.style.background = 'rgba(255,255,255,0.88)';
      overlay.style.backdropFilter = 'blur(3px)';
    } else {
      // Fully blocked
      overlay.style.background = 'rgba(255,255,255,0.95)';
      overlay.style.backdropFilter = 'blur(8px)';
    }

    overlay.innerHTML = 
      '<div style="text-align:center; padding:40px; max-width:450px;">' +
        '<div style="font-size:48px; margin-bottom:16px;">&#128274;</div>' +
        '<h2 style="font-size:24px; font-weight:700; color:#0b1f3a; margin:0 0 12px;">' + title + '</h2>' +
        '<p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:28px;">' + message + '</p>' +
        '<a href="convert-membership.html" style="' +
          'display:inline-block; padding:14px 36px;' +
          'background:linear-gradient(135deg,#0b4ea2,#1e6fd4);' +
          'color:white; border-radius:10px; text-decoration:none;' +
          'font-weight:700; font-size:16px;' +
          'box-shadow:0 4px 15px rgba(11,78,162,0.3);' +
        '">Upgrade to Partner</a>' +
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
      // Find the display name
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
      // Partner but no headshot yet
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
      'font-weight:700; font-size:16px; box-sizing:border-box;' +
    '}' +
    '.premium-modal-upgrade:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(11,78,162,0.3); }' +
    '.premium-modal-close { background:none; border:none; color:#999; font-size:14px; cursor:pointer; padding:8px; }' +
    '.premium-modal-close:hover { color:#666; }' +
    '.usage-banner {' +
      'position:fixed; top:0; left:0; right:0; z-index:9000;' +
      'background:linear-gradient(135deg,#0b4ea2,#1e6fd4);' +
      'color:white; text-align:center; padding:10px 20px;' +
      'font-size:13px; display:flex; align-items:center;' +
      'justify-content:center; gap:16px;' +
    '}' +
    '.usage-banner a {' +
      'color:white; background:rgba(255,255,255,0.2);' +
      'padding:4px 14px; border-radius:20px; text-decoration:none;' +
      'font-weight:600; font-size:12px;' +
    '}' +
    '.usage-banner a:hover { background:rgba(255,255,255,0.3); }';

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

    // ----- FULLY BLOCKED PAGES -----
    if (BLOCKED_PAGES.indexOf(page) !== -1) {
      applyPageOverlay(
        'Partner Feature',
        'Ordering and co-branded materials are available exclusively to Partner members. Upgrade to start placing orders!',
        false
      );
      return;
    }

    // ----- VIEW-ONLY PAGES (can see, can't use) -----
    if (VIEW_ONLY_PAGES.indexOf(page) !== -1) {
      // For the landing/menu pages, show a softer overlay
      if (page === 'education-calculators' || page === 'education-credit-tools') {
        applyPageOverlay(
          'Partner Feature',
          'Financial calculators and credit tools are fully functional for Partner members. You can preview them, but upgrade to use them with your clients.',
          true
        );
      } else {
        // For the actual tool pages (income-calculator, credit-score-simulator, etc.)
        applyPageOverlay(
          'Partner Feature',
          'This tool is fully functional for Partner members. Upgrade to use it with your clients!',
          true
        );
      }
      return;
    }

    // ----- USAGE-LIMITED PAGES -----
    var limitConfig = USAGE_LIMITED_PAGES[page];
    if (limitConfig) {
      var used = getUsageCount(limitConfig.key);
      
      if (used >= limitConfig.limit) {
        // Out of free uses — block the page
        applyPageOverlay(
          'Free Limit Reached',
          'You\'ve used all ' + limitConfig.limit + ' free ' + limitConfig.name + ' in your trial. Upgrade to Partner for unlimited access!',
          false
        );
      } else {
        // Still has uses left — show the banner
        showUsageBanner(limitConfig.name, used, limitConfig.limit);
      }
    }
  });

})();
