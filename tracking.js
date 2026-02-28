/* ===================================================
   AGENT EDGE — TRACKING V2
   Session-based tracking with tenant scoping.
   Drop this script into ANY page — it handles the rest.

   Manual tracking still available via:
   trackActivity(collection, tool, action, details)
=================================================== */

(function() {
  'use strict';

  var TRACKING_ENDPOINT = 'https://agent-edge-backend.vercel.app/api/track';
  var pageEntryTime = Date.now();

  // ===== SESSION MANAGEMENT =====
  function getSessionId() {
    var sid = sessionStorage.getItem('aeSessionId');
    if (!sid) {
      sid = 'ses-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('aeSessionId', sid);
    }
    return sid;
  }

  // ===== USER IDENTITY =====
  function getTrackedUser() {
    return {
      name: sessionStorage.getItem('agentEdgeName') || sessionStorage.getItem('agentEdgeUser') || 'Unknown',
      email: sessionStorage.getItem('agentEdgeUser') || '',
      isAdmin: sessionStorage.getItem('agentEdgeAdmin') === 'true',
      loUserId: sessionStorage.getItem('agentEdgeLoUserId') || 'default'
    };
  }

  // ===== PAGE DETECTION =====
  var PAGE_MAP = {
    'portal':            { collection: 'Portal',    tool: 'Partner Portal' },
    'login':             { collection: 'Portal',    tool: 'Login' },
    'signup':            { collection: 'Portal',    tool: 'Signup' },
    'forgot-password':   { collection: 'Portal',    tool: 'Forgot Password' },
    'change-password':   { collection: 'Portal',    tool: 'Change Password' },
    'checkout':          { collection: 'Portal',    tool: 'Checkout' },
    'order-confirmation':{ collection: 'Portal',    tool: 'Order Confirmation' },
    'trial-expired':     { collection: 'Portal',    tool: 'Trial Expired' },
    'thank-you':         { collection: 'Portal',    tool: 'Thank You' },
    'market-intelligence':      { collection: 'Marketing', tool: 'Market Intelligence' },
    'market-pulse':             { collection: 'Marketing', tool: 'Market Pulse' },
    'open-house':               { collection: 'Marketing', tool: 'Open House Toolkit' },
    'buyers':                   { collection: 'Marketing', tool: 'Buyer Reports' },
    'sellers':                  { collection: 'Marketing', tool: 'Seller Reports' },
    'construction':             { collection: 'Marketing', tool: 'Construction Reports' },
    'financing':                { collection: 'Marketing', tool: 'Financing Reports' },
    'property-websites':        { collection: 'Marketing', tool: 'Property Websites' },
    'realtor-marketing-studio': { collection: 'Marketing', tool: 'Realtor Marketing Studio' },
    'realtor':                  { collection: 'Marketing', tool: 'Realtor Page' },
    'advisory-collection':   { collection: 'Advisory', tool: 'Advisory Collection' },
    'amortization-report':   { collection: 'Advisory', tool: 'Amortization Report' },
    'credit-score-simulator':{ collection: 'Advisory', tool: 'Credit Score Simulator' },
    'income-calculator':     { collection: 'Advisory', tool: 'Income Calculator' },
    'self-employed-calculator':{ collection: 'Advisory', tool: 'Self-Employed Calculator' },
    'decision-tools':        { collection: 'Advisory', tool: 'Decision Tools' },
    'client-summary':        { collection: 'Advisory', tool: 'Client Summary' },
    'summary-briefs':        { collection: 'Advisory', tool: 'Summary Briefs' },
    'week-in-review':        { collection: 'Advisory', tool: 'Week in Review' },
    'education-collection':    { collection: 'Education', tool: 'Education Hub' },
    'education-calculators':   { collection: 'Education', tool: 'Education Calculators' },
    'education-credit-tools':  { collection: 'Education', tool: 'Credit Tools' },
    'education-loan-guides':   { collection: 'Education', tool: 'Loan Guides' },
    'education-videos':        { collection: 'Education', tool: 'Education Videos' },
    'conventional-loans-education': { collection: 'Education', tool: 'Conventional Loans Guide' },
    'conventional-loans':      { collection: 'Education', tool: 'Conventional Loans' },
    'fha-loans-education':     { collection: 'Education', tool: 'FHA Loans Guide' },
    'FHA-Loans':               { collection: 'Education', tool: 'FHA Loans' },
    'va-loan-educaton':        { collection: 'Education', tool: 'VA Loans Guide' },
    'VA-Loans':                { collection: 'Education', tool: 'VA Loans' },
    'usda-loans-education':    { collection: 'Education', tool: 'USDA Loans Guide' },
    'USDA-Loans':              { collection: 'Education', tool: 'USDA Loans' },
    'jumbo-loans-education':   { collection: 'Education', tool: 'Jumbo Loans Guide' },
    'dscr-loans-education':    { collection: 'Education', tool: 'DSCR Loans Guide' },
    'reverse-mortgage-education': { collection: 'Education', tool: 'Reverse Mortgage Guide' },
    'Reverse-Mortgages':       { collection: 'Education', tool: 'Reverse Mortgages' },
    'Non-Conforming-Loans':    { collection: 'Education', tool: 'Non-Conforming Loans' },
    'Non-Qualified-Loans':     { collection: 'Education', tool: 'Non-Qualified Loans' },
    'down-payment-assistance-education': { collection: 'Education', tool: 'Down Payment Assistance Guide' },
    'credit-score-education':  { collection: 'Education', tool: 'Credit Score Education' },
    'messaging-collection':  { collection: 'Messaging', tool: 'Messaging Hub' },
    'messaging-grabandgo':   { collection: 'Messaging', tool: 'Grab & Go' },
    'messaging-ondemand':    { collection: 'Messaging', tool: 'On-Demand AI' },
    'messaging-images':      { collection: 'Messaging', tool: 'Image Library' },
    'mission-control':  { collection: 'Admin', tool: 'Mission Control' },
    'briefing-admin':   { collection: 'Admin', tool: 'Briefing Admin' },
    'crm-activity':     { collection: 'Admin', tool: 'CRM Activity' }
  };

  function detectPage() {
    var path = window.location.pathname;
    var filename = path.split('/').pop().replace('.html', '').replace('.htm', '');
    if (!filename || filename === '' || filename === 'index') {
      return { collection: 'Website', tool: 'Homepage' };
    }
    return PAGE_MAP[filename] || { collection: 'Unknown', tool: filename };
  }

  // ===== CORE TRACKING FUNCTION =====
  window.trackActivity = function(collection, tool, action, details) {
    var user = getTrackedUser();
    var page = detectPage();
    var isPublicPage = (page.tool === 'Login' || page.tool === 'Signup' || page.tool === 'Homepage');
    if (!user.email && !isPublicPage) return;

    var payload = {
      sessionId: getSessionId(),
      userName: user.name,
      userEmail: user.email,
      loUserId: user.loUserId,
      isAdmin: user.isAdmin,
      collection: collection,
      tool: tool,
      action: action,
      details: details || '',
      page: page.tool
    };

    fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function() {});
  };

  // ===== AUTO-FILL HELPER =====
  window.autoFillUserInfo = function(nameFieldId, emailFieldId) {
    var user = getTrackedUser();
    if (nameFieldId) {
      var nameField = document.getElementById(nameFieldId);
      if (nameField && user.name && user.name !== 'Unknown') nameField.value = user.name;
    }
    if (emailFieldId) {
      var emailField = document.getElementById(emailFieldId);
      if (emailField && user.email) emailField.value = user.email;
    }
  };

  // ===== AUTO-TRACKING =====
  document.addEventListener('DOMContentLoaded', function() {
    var page = detectPage();

    // 1. PAGE VISIT (also serves as session heartbeat)
    trackActivity(page.collection, page.tool, 'Page Visit', document.title);

    // 2. DOWNLOADS
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      var ext = href.split('.').pop().toLowerCase().split('?')[0];
      var downloadTypes = ['pdf', 'xlsx', 'xls', 'csv', 'doc', 'docx', 'pptx', 'zip', 'png', 'jpg'];
      if (downloadTypes.indexOf(ext) !== -1) {
        trackActivity(page.collection, page.tool, 'Download', href.split('/').pop());
      }
    });

    // 3. PRINT
    window.addEventListener('beforeprint', function() {
      trackActivity(page.collection, page.tool, 'Print', document.title);
    });

    // 4. TIME SPENT (fires on page leave, only if > 5 seconds)
    function trackTimeSpent() {
      var seconds = Math.round((Date.now() - pageEntryTime) / 1000);
      if (seconds >= 5) {
        var user = getTrackedUser();
        var data = JSON.stringify({
          sessionId: getSessionId(),
          userName: user.name,
          userEmail: user.email,
          loUserId: user.loUserId,
          isAdmin: user.isAdmin,
          collection: page.collection,
          tool: page.tool,
          action: 'Time Spent',
          details: seconds + ' seconds',
          page: page.tool
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(TRACKING_ENDPOINT, new Blob([data], { type: 'application/json' }));
        } else {
          trackActivity(page.collection, page.tool, 'Time Spent', seconds + ' seconds');
        }
      }
    }

    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') trackTimeSpent();
    });
    window.addEventListener('pagehide', trackTimeSpent);

    // 5. FORM SUBMISSIONS
    document.addEventListener('submit', function(e) {
      var form = e.target;
      var formName = form.getAttribute('name') || form.getAttribute('id') || 'Unnamed Form';
      trackActivity(page.collection, page.tool, 'Form Submit', formName);
    });
  });

})();
