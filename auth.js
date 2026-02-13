/* ===========================
   AUTHENTICATION SYSTEM
   Agent Edge Partner Portal
   Server-side auth via Vercel
=========================== */

const AUTH_API = 'https://agent-edge-backend.vercel.app/api';

// Check if user is authenticated
function isAuthenticated() {
  return sessionStorage.getItem('agentEdgeAuth') === 'authenticated';
}

// Get current user info
function getCurrentUser() {
  return sessionStorage.getItem('agentEdgeUser') || 'User';
}

function getCurrentUserName() {
  return sessionStorage.getItem('agentEdgeUserName') || sessionStorage.getItem('agentEdgeUser') || 'User';
}

function getCurrentUserEmail() {
  return sessionStorage.getItem('agentEdgeUserEmail') || '';
}

function getCurrentUserBrokerage() {
  return sessionStorage.getItem('agentEdgeUserBrokerage') || '';
}

// Store user session after successful auth
function setUserSession(user) {
  sessionStorage.setItem('agentEdgeAuth', 'authenticated');
  sessionStorage.setItem('agentEdgeUser', user.username);
  sessionStorage.setItem('agentEdgeUserName', user.name);
  sessionStorage.setItem('agentEdgeUserEmail', user.email);
  sessionStorage.setItem('agentEdgeUserBrokerage', user.brokerage || '');
}

// Logout function
function logout() {
  sessionStorage.removeItem('agentEdgeAuth');
  sessionStorage.removeItem('agentEdgeUser');
  sessionStorage.removeItem('agentEdgeUserName');
  sessionStorage.removeItem('agentEdgeUserEmail');
  sessionStorage.removeItem('agentEdgeUserBrokerage');
  window.location.href = 'login.html';
}

// Protect portal pages - redirect to login if not authenticated
function protectPage() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

// ===== LOGIN HANDLER =====
if (document.getElementById('loginForm')) {
  var loginForm = document.getElementById('loginForm');
  var errorMessage = document.getElementById('errorMessage');

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;
    var loginBtn = loginForm.querySelector('button[type="submit"]');

    // Disable button while processing
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';
    errorMessage.classList.remove('show');

    try {
      var response = await fetch(AUTH_API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      });

      var data = await response.json();

      if (data.success) {
        setUserSession(data.user);
        window.location.href = 'portal.html';
      } else {
        errorMessage.textContent = data.message || 'Invalid username or password. Please try again.';
        errorMessage.classList.add('show');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();

        setTimeout(function() {
          errorMessage.classList.remove('show');
        }, 4000);
      }
    } catch (error) {
      console.error('Login error:', error);
      errorMessage.textContent = 'Connection error. Please try again.';
      errorMessage.classList.add('show');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  });
}
