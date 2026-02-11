/* ===========================
   AUTHENTICATION SYSTEM
   Agent Edge Partner Portal
=========================== */

// Simple hash function for passwords
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Load credentials from credentials.js AND localStorage
function checkCredentials(username, password) {
  const hashedPassword = simpleHash(password);
  
  // Check static credentials first (from credentials.js)
  if (typeof credentials !== 'undefined' && credentials[username] && credentials[username] === hashedPassword) {
    return true;
  }
  
  // Check localStorage credentials (self-registered users)
  const storedCredentials = JSON.parse(localStorage.getItem('agentEdgeCredentials') || '{}');
  if (storedCredentials[username] && storedCredentials[username] === hashedPassword) {
    return true;
  }
  
  return false;
}

// Handle login form submission
if (document.getElementById('loginForm')) {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (checkCredentials(username, password)) {
      // Success! Set session and redirect
      sessionStorage.setItem('agentEdgeAuth', 'authenticated');
      sessionStorage.setItem('agentEdgeUser', username);
      window.location.href = 'portal.html';
    } else {
      // Failed - show error
      errorMessage.classList.add('show');
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
      
      // Hide error after 4 seconds
      setTimeout(() => {
        errorMessage.classList.remove('show');
      }, 4000);
    }
  });
}

// Check if user is authenticated (for portal.html)
function isAuthenticated() {
  return sessionStorage.getItem('agentEdgeAuth') === 'authenticated';
}

// Get current username
function getCurrentUser() {
  return sessionStorage.getItem('agentEdgeUser') || 'User';
}

// Logout function
function logout() {
  sessionStorage.removeItem('agentEdgeAuth');
  sessionStorage.removeItem('agentEdgeUser');
  window.location.href = 'login.html';
}

// Protect portal page - add this to portal.html
function protectPage() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}
