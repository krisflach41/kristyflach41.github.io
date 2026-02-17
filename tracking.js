/* ===========================
   ACTIVITY TRACKING SYSTEM
   Agent Edge Partner Portal
   
   Include this script on any page
   that needs tracking. It reads the
   logged-in user from sessionStorage
   and sends activity to Vercel API.
   
   ENHANCED: Now includes automatic tracking
   for page visits, time spent, downloads, etc.
=========================== */

const TRACKING_ENDPOINT = 'https://agent-edge-backend.vercel.app/api/track';

/**
 * Get the currently logged-in user info
 * Returns { name, email } from sessionStorage
 */
function getTrackedUser() {
  return {
    name: sessionStorage.getItem('agentEdgeName') || sessionStorage.getItem('agentEdgeUserName') || sessionStorage.getItem('agentEdgeUser') || 'Unknown',
    email: sessionStorage.getItem('agentEdgeUser') || sessionStorage.getItem('agentEdgeUserEmail') || ''
  };
}

/**
 * Track an activity - fire and forget (never blocks UI)
 * 
 * @param {string} collection - Which collection (Messaging, Advisory, Marketing, Portal)
 * @param {string} tool - Which tool (Grab & Go, On-Demand, Market Intelligence, etc.)
 * @param {string} action - What happened (Login, Generated Post, Downloaded Graphic, Submitted Order, etc.)
 * @param {string} details - Additional context (post category, report type, etc.)
 */
function trackActivity(collection, tool, action, details) {
  var user = getTrackedUser();

  // Fire and forget - don't await, don't block
  fetch(TRACKING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: user.name,
      userEmail: user.email,
      collection: collection,
      tool: tool,
      action: action,
      details: details || ''
    })
  }).catch(function(err) {
    // Silent fail - tracking should never break the user experience
    console.log('Tracking: silent fail', err);
  });
}

/**
 * Auto-fill form fields with logged-in user data
 * Call this on pages with name/email form fields
 * 
 * @param {string} nameFieldId - ID of the name input field
 * @param {string} emailFieldId - ID of the email input field
 */
function autoFillUserInfo(nameFieldId, emailFieldId) {
  var user = getTrackedUser();
  
  if (nameFieldId) {
    var nameField = document.getElementById(nameFieldId);
    if (nameField && user.name && user.name !== 'Unknown') {
      nameField.value = user.name;
    }
  }
  
  if (emailFieldId) {
    var emailField = document.getElementById(emailFieldId);
    if (emailField && user.email) {
      emailField.value = user.email;
    }
  }
}

/* ===========================
   AUTOMATIC TRACKING
   Runs on every page automatically
=========================== */

(function() {
  'use strict';
  
  var user = getTrackedUser();
  
  // Don't auto-track if no user logged in
  if (!user.email || user.email === '') return;
  
  var pageLoadTime = new Date();
  var pagePath = window.location.pathname;
  var pageTitle = document.title || 'Unknown Page';
  
  // Detect collection based on URL/title
  var collection = 'Portal';
  var tool = pageTitle;
  
  if (pagePath.includes('market-intelligence') || pageTitle.toLowerCase().includes('market intelligence')) {
    collection = 'Marketing Intelligence';
  } else if (pagePath.includes('advisory') || pagePath.includes('amortization') || pagePath.includes('report')) {
    collection = 'Advisory Tools';
  } else if (pagePath.includes('education') || pagePath.includes('market-pulse')) {
    collection = 'Education';
  } else if (pagePath.includes('messaging')) {
    collection = 'Messaging';
  } else if (pagePath.includes('mission-control')) {
    collection = 'Admin';
  } else if (pagePath.includes('checkout')) {
    collection = 'Checkout';
  }
  
  // 1. AUTO-TRACK PAGE VISIT
  trackActivity(collection, tool, 'page_visit', 'Viewed: ' + pagePath);
  
  // 2. AUTO-TRACK TIME SPENT (on page unload)
  window.addEventListener('beforeunload', function() {
    var timeSpent = Math.round((new Date() - pageLoadTime) / 1000);
    trackActivity(collection, tool, 'time_spent', timeSpent + ' seconds');
  });
  
  // 3. AUTO-TRACK DOWNLOADS
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a, button');
    if (!target) return;
    
    var href = target.getAttribute('href') || '';
    var download = target.getAttribute('download');
    
    if (download || href.match(/\.(pdf|docx|xlsx|pptx|png|jpg|jpeg|gif)$/i)) {
      var fileName = download || href.split('/').pop();
      trackActivity(collection, 'File Download', 'download', fileName);
    }
  });
  
  // 4. AUTO-TRACK FORM SUBMISSIONS
  document.addEventListener('submit', function(e) {
    var form = e.target;
    var formName = form.getAttribute('name') || form.getAttribute('id') || 'Form';
    trackActivity(collection, 'Form', 'form_submit', 'Submitted: ' + formName);
  });
  
  // 5. AUTO-TRACK PRINT
  window.addEventListener('beforeprint', function() {
    trackActivity(collection, tool, 'print', 'Printed page');
  });
  
  // Console confirmation
  console.log('✅ Agent Edge Tracking Active - ' + collection + ' - ' + tool);
  
})();
