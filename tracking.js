/* ===========================
   ACTIVITY TRACKING SYSTEM
   Agent Edge Partner Portal
   
   Include this script on any page
   that needs tracking. It reads the
   logged-in user from sessionStorage
   and sends activity to Google Sheets.
=========================== */

const TRACKING_ENDPOINT = 'https://agent-edge-backend.vercel.app/api/track';

/**
 * Get the currently logged-in user info
 * Returns { name, email } from sessionStorage
 */
function getTrackedUser() {
  return {
    name: sessionStorage.getItem('agentEdgeUserName') || sessionStorage.getItem('agentEdgeUser') || 'Unknown',
    email: sessionStorage.getItem('agentEdgeUserEmail') || ''
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
