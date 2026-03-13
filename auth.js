/* ===========================
   AUTHENTICATION SYSTEM
   Agent Edge Partner Portal
   
   Email = username = primary key
   Everything ties to email address
=========================== */

var AUTH_API = 'https://agent-edge-backend.vercel.app/api';

// ===== SESSION MANAGEMENT =====

function isAuthenticated() {
  return sessionStorage.getItem('agentEdgeAuth') === 'authenticated';
}

function getCurrentUserEmail() {
  return sessionStorage.getItem('agentEdgeUserEmail') || '';
}

function getCurrentUserName() {
  return sessionStorage.getItem('agentEdgeUserName') || 'User';
}

function getCurrentUserBrokerage() {
  return sessionStorage.getItem('agentEdgeUserBrokerage') || '';
}

function getCurrentUserPhone() {
  return sessionStorage.getItem('agentEdgeUserPhone') || '';
}

function getCurrentUserTitle() {
  return sessionStorage.getItem('agentEdgeUserTitle') || '';
}

function getCurrentUserWebsite() {
  return sessionStorage.getItem('agentEdgeUserWebsite') || '';
}

// Keep backward compatibility — old code references agentEdgeUser
function getCurrentUser() {
  return getCurrentUserEmail();
}

function setUserSession(user) {
  sessionStorage.setItem('agentEdgeAuth', 'authenticated');
  sessionStorage.setItem('agentEdgeUserEmail', user.email);
  sessionStorage.setItem('agentEdgeUserName', user.name);
  sessionStorage.setItem('agentEdgeUserBrokerage', user.brokerage || '');
  sessionStorage.setItem('agentEdgeUserPhone', user.phone || '');
  sessionStorage.setItem('agentEdgeUserTitle', user.title || '');
  sessionStorage.setItem('agentEdgeUserWebsite', user.website || '');
  // Backward compatibility keys
  sessionStorage.setItem('agentEdgeUser', user.email);
  sessionStorage.setItem('agentEdgeName', user.name);
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ===== PAGE PROTECTION =====

function protectPage() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }
  
  // Check trial expiration
  var role = sessionStorage.getItem('agentEdgeRole');
  var trialStart = sessionStorage.getItem('agentEdgeTrialStart');
  
  if (role === 'trial' && trialStart) {
    var start = new Date(trialStart);
    var now = new Date();
    var daysSinceStart = (now - start) / (1000 * 60 * 60 * 24);
    
    // Don't redirect if already on trial-expired page
    var currentPage = window.location.pathname.split('/').pop();
    if (daysSinceStart > 7 && currentPage !== 'trial-expired.html') {
      window.location.href = 'trial-expired.html';
      return;
    }
  }
}

// ===== LOGIN HANDLER =====
// Attaches to login form if it exists on the page

document.addEventListener('DOMContentLoaded', function() {
  var loginForm = document.getElementById('loginForm');
  if (!loginForm) return;
  
  var errorMessage = document.getElementById('errorMessage');

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    var email = document.getElementById('email').value.trim().toLowerCase();
    var password = document.getElementById('password').value;
    var loginBtn = loginForm.querySelector('button[type="submit"]');

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';
    errorMessage.classList.remove('show');

    try {
      var response = await fetch(AUTH_API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });

      var data = await response.json();

      if (data.success) {
        setUserSession(data.user);
        
        // Store admin flag
        sessionStorage.setItem('agentEdgeAdmin', data.isAdmin ? 'true' : 'false');
        
        // Store role and trial info
        sessionStorage.setItem('agentEdgeRole', data.role || 'partner');
        if (data.trialStart) {
          sessionStorage.setItem('agentEdgeTrialStart', data.trialStart);
        }
        
        // Store headshot flag for co-brand gating
        sessionStorage.setItem('agentEdgeHasHeadshot', data.hasHeadshot ? 'true' : 'false');
        
        // Store lender/admin name for cheat sheets
        if (data.lenderName) {
          sessionStorage.setItem('agentEdgeLenderName', data.lenderName);
        }
        
        // Check if temp password — force password change
        if (data.tempPassword) {
          sessionStorage.setItem('agentEdgeTempPassword', 'true');
          window.location.href = 'change-password.html';
        } 
        // Check if trial has expired (7 days)
        else if (data.role === 'trial' && data.trialStart) {
          var trialStart = new Date(data.trialStart);
          var now = new Date();
          var daysSinceStart = (now - trialStart) / (1000 * 60 * 60 * 24);
          
          if (daysSinceStart > 7) {
            window.location.href = 'trial-expired.html';
          } else {
            window.location.href = 'portal.html';
          }
        } else {
          window.location.href = 'portal.html';
        }
      } else {
        errorMessage.textContent = data.message || 'Invalid email or password. Please try again.';
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
});
