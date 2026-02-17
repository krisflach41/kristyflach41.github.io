/* ===================================================
   AGENT EDGE — FEATURE GATING SYSTEM
   
   Controls what trial vs partner members can access.
   Include this script on any page that has gated features.
   
   Usage:
   1. Add class="premium-feature" to any element that should be locked for trial users
   2. Add data-gate="calculator" or data-gate="credit" etc. for specific gates
   3. Add class="usage-limited" data-limit="5" data-tool="grab-and-go" for usage limits
   
   The script handles everything else automatically.
=================================================== */

(function() {
  'use strict';

  var USAGE_ENDPOINT = 'https://agent-edge-backend.vercel.app/api/track';

  // ===== GET USER ROLE =====
  function getUserRole() {
    return sessionStorage.getItem('agentEdgeRole') || 'trial';
  }

  function isPartner() {
    return getUserRole() === 'partner' || getUserRole() === 'admin';
  }

  function isAdmin() {
    return sessionStorage.getItem('agentEdgeAdmin') === 'true';
  }

  // ===== USAGE TRACKING (for limited features) =====
  function getUsageCount(toolKey) {
    var counts = JSON.parse(sessionStorage.getItem('agentEdgeUsageCounts') || '{}');
    return counts[toolKey] || 0;
  }

  function incrementUsage(toolKey) {
    var counts = JSON.parse(sessionStorage.getItem('agentEdgeUsageCounts') || '{}');
    counts[toolKey] = (counts[toolKey] || 0) + 1;
    sessionStorage.setItem('agentEdgeUsageCounts', JSON.stringify(counts));
    return counts[toolKey];
  }

  // ===== PREMIUM OVERLAY =====
  function createPremiumOverlay(element, message) {
    // Don't double-apply
    if (element.querySelector('.premium-overlay')) return;

    element.style.position = 'relative';
    
    var overlay = document.createElement('div');
    overlay.className = 'premium-overlay';
    overlay.innerHTML = 
      '<div class="premium-overlay-content">' +
        '<div class="premium-lock-icon">&#128274;</div>' +
        '<div class="premium-lock-title">Partner Feature</div>' +
        '<div class="premium-lock-message">' + (message || 'This feature is available to Partner members.') + '</div>' +
        '<a href="convert-membership.html" class="premium-upgrade-btn">Upgrade to Partner</a>' +
      '</div>';

    element.appendChild(overlay);
  }

  // ===== PREMIUM MODAL (for click-triggered gates) =====
  window.showPremiumModal = function(featureName) {
    // Remove existing modal if any
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
          (featureName ? '<strong>' + featureName + '</strong> is a premium feature available to Partner members.' : 'This is a premium feature available to Partner members.') +
          ' Upgrade to unlock full access to all Agent Edge tools.' +
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
          'You\'ve used <strong>' + used + ' of ' + limit + '</strong> free ' + toolName + ' during your trial. ' +
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

  // ===== CHECK USAGE BEFORE ACTION =====
  // Call this before generating content. Returns true if allowed, false if blocked.
  window.checkUsageLimit = function(toolKey, limit) {
    if (isPartner() || isAdmin()) return true;
    
    var used = getUsageCount(toolKey);
    if (used >= limit) {
      showUsageLimitModal(toolKey.replace(/-/g, ' '), used, limit);
      return false;
    }
    
    incrementUsage(toolKey);
    return true;
  };

  // ===== CHECK IF FEATURE IS ALLOWED =====
  window.checkPremiumAccess = function(featureName) {
    if (isPartner() || isAdmin()) return true;
    showPremiumModal(featureName);
    return false;
  };

  // ===== INJECT STYLES =====
  var style = document.createElement('style');
  style.textContent = 
    /* Overlay for blocked elements */
    '.premium-overlay {' +
      'position: absolute; top: 0; left: 0; right: 0; bottom: 0;' +
      'background: rgba(255,255,255,0.85);' +
      'backdrop-filter: blur(4px);' +
      'display: flex; align-items: center; justify-content: center;' +
      'border-radius: inherit; z-index: 50;' +
    '}' +
    '.premium-overlay-content {' +
      'text-align: center; padding: 30px;' +
    '}' +
    '.premium-lock-icon {' +
      'font-size: 32px; margin-bottom: 10px;' +
    '}' +
    '.premium-lock-title {' +
      'font-size: 18px; font-weight: 700; color: #0b1f3a; margin-bottom: 8px;' +
    '}' +
    '.premium-lock-message {' +
      'font-size: 13px; color: #555; margin-bottom: 16px; line-height: 1.5;' +
    '}' +
    '.premium-upgrade-btn {' +
      'display: inline-block; padding: 10px 24px;' +
      'background: linear-gradient(135deg, #0b4ea2, #1e6fd4);' +
      'color: white; border-radius: 8px; text-decoration: none;' +
      'font-weight: 600; font-size: 13px; transition: 0.25s ease;' +
    '}' +
    '.premium-upgrade-btn:hover {' +
      'transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,78,162,0.3);' +
    '}' +
    /* Modal */
    '.premium-modal-backdrop {' +
      'position: fixed; top: 0; left: 0; right: 0; bottom: 0;' +
      'background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);' +
      'display: flex; align-items: center; justify-content: center;' +
      'z-index: 10000;' +
    '}' +
    '.premium-modal {' +
      'background: white; border-radius: 18px; padding: 40px;' +
      'max-width: 420px; width: 90%; text-align: center;' +
      'box-shadow: 0 25px 60px rgba(0,0,0,0.15);' +
    '}' +
    '.premium-modal-icon {' +
      'font-size: 40px; margin-bottom: 12px;' +
    '}' +
    '.premium-modal-title {' +
      'font-size: 22px; font-weight: 700; color: #0b1f3a; margin: 0 0 12px;' +
    '}' +
    '.premium-modal-message {' +
      'font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 25px;' +
    '}' +
    '.premium-modal-buttons {' +
      'display: flex; flex-direction: column; gap: 10px; align-items: center;' +
    '}' +
    '.premium-modal-upgrade {' +
      'display: inline-block; width: 100%; padding: 14px 30px;' +
      'background: linear-gradient(135deg, #0b4ea2, #1e6fd4);' +
      'color: white; border-radius: 10px; text-decoration: none;' +
      'font-weight: 700; font-size: 16px; transition: 0.25s ease;' +
      'box-sizing: border-box;' +
    '}' +
    '.premium-modal-upgrade:hover {' +
      'transform: translateY(-1px); box-shadow: 0 6px 20px rgba(11,78,162,0.3);' +
    '}' +
    '.premium-modal-close {' +
      'background: none; border: none; color: #999; font-size: 14px;' +
      'cursor: pointer; padding: 8px;' +
    '}' +
    '.premium-modal-close:hover { color: #666; }';

  document.head.appendChild(style);

  // ===== AUTO-APPLY ON PAGE LOAD =====
  document.addEventListener('DOMContentLoaded', function() {
    // Skip gating for partners and admins
    if (isPartner() || isAdmin()) return;

    // Apply overlays to elements with class="premium-feature"
    var gatedElements = document.querySelectorAll('.premium-feature');
    gatedElements.forEach(function(el) {
      var msg = el.getAttribute('data-gate-message') || null;
      createPremiumOverlay(el, msg);
    });

    // Block cancelled users entirely
    if (getUserRole() === 'cancelled') {
      window.location.href = 'login.html';
    }
  });

})();
