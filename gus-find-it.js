/* ===== GUS FIND IT — Floating AI Assistant Widget ===== */
(function() {
  var API = 'https://agent-edge-backend.vercel.app/api/gus-find-it';
  var isOpen = false;
  var history = [];

  // Inject CSS
  var style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

    #gus-fab {
      position: fixed; top: 50%; right: 12px; transform: translateY(-50%); z-index: 99999;
      width: 85px; height: 85px; border-radius: 50%;
      background: #002556; border: 3px solid #baa370;
      cursor: grab; overflow: hidden;
      box-shadow: 0 6px 24px rgba(0,37,86,0.35), 0 2px 8px rgba(0,0,0,0.15);
      transition: box-shadow 0.3s, opacity 0.3s;
      display: flex; align-items: center; justify-content: center;
      opacity: 0.75;
      user-select: none; -webkit-user-select: none;
    }
    #gus-fab:hover {
      box-shadow: 0 10px 32px rgba(0,37,86,0.4), 0 4px 12px rgba(0,0,0,0.2);
      opacity: 1;
    }
    #gus-fab.dragging {
      cursor: grabbing; opacity: 1;
      box-shadow: 0 14px 40px rgba(0,37,86,0.5), 0 6px 16px rgba(0,0,0,0.25);
    }
    #gus-fab img {
      width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
    }
    #gus-fab .gus-badge {
      position: absolute; top: -2px; right: -2px;
      background: #baa370; color: #002556; font-size: 11px; font-weight: 800;
      padding: 3px 7px; border-radius: 8px; letter-spacing: 0.3px;
      font-family: 'DM Sans', system-ui, sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }

    #gus-panel {
      position: fixed; top: 50%; right: 88px; z-index: 99998;
      transform: translateY(-50%);
      width: 380px; max-height: 520px;
      background: #faf8f4; border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,37,86,0.25), 0 8px 24px rgba(0,0,0,0.12);
      border: 1px solid rgba(186,163,112,0.3);
      display: none; flex-direction: column; overflow: hidden;
      font-family: 'DM Sans', system-ui, sans-serif;
      animation: gusSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #gus-panel.open { display: flex; }

    @keyframes gusSlideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    #gus-header {
      padding: 16px 18px; display: flex; align-items: center; gap: 12px;
      background: #002556; color: white; flex-shrink: 0;
    }
    #gus-header img {
      width: 42px; height: 42px; border-radius: 50%; border: 2px solid #baa370;
      object-fit: cover;
    }
    #gus-header-info h3 {
      margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.3px;
    }
    #gus-header-info p {
      margin: 2px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.65); font-weight: 500;
    }
    #gus-close {
      margin-left: auto; background: none; border: none; color: rgba(255,255,255,0.6);
      font-size: 22px; cursor: pointer; padding: 4px 8px; border-radius: 8px;
      transition: all 0.2s;
    }
    #gus-close:hover { color: white; background: rgba(255,255,255,0.1); }

    #gus-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
      min-height: 200px; max-height: 340px;
    }
    #gus-messages::-webkit-scrollbar { width: 4px; }
    #gus-messages::-webkit-scrollbar-thumb { background: rgba(110,127,119,0.2); border-radius: 4px; }

    .gus-msg {
      max-width: 88%; padding: 10px 14px; border-radius: 14px;
      font-size: 14px; line-height: 1.55; word-break: break-word;
    }
    .gus-msg a { color: #002556; font-weight: 600; text-decoration: underline; }
    .gus-msg-bot {
      background: white; color: #1a2332; align-self: flex-start;
      border: 1px solid rgba(186,163,112,0.2);
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .gus-msg-user {
      background: #002556; color: white; align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .gus-typing {
      align-self: flex-start; padding: 12px 18px;
      background: white; border-radius: 14px; border-bottom-left-radius: 4px;
      border: 1px solid rgba(186,163,112,0.2);
      display: flex; gap: 8px; align-items: center;
    }
    .gus-paw {
      font-size: 18px; animation: gusPawBounce 1.6s ease infinite;
      display: inline-block;
    }
    .gus-paw:nth-child(2) { animation-delay: 0.2s; }
    .gus-paw:nth-child(3) { animation-delay: 0.4s; }
    .gus-paw:nth-child(4) { animation-delay: 0.6s; }
    @keyframes gusPawBounce {
      0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
      30% { transform: translateY(-8px) rotate(-15deg); opacity: 1; }
      50% { transform: translateY(0) rotate(0deg); opacity: 1; }
    }

    #gus-input-wrap {
      padding: 12px 16px; border-top: 1px solid rgba(186,163,112,0.15);
      display: flex; gap: 8px; background: white; flex-shrink: 0;
    }
    #gus-input {
      flex: 1; padding: 10px 14px; border: 1px solid rgba(110,127,119,0.2);
      border-radius: 12px; font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 14px; color: #1a2332; background: #faf8f4;
      outline: none; transition: border-color 0.2s;
    }
    #gus-input:focus { border-color: #6e7f77; }
    #gus-input::placeholder { color: #aaa; }

    #gus-send {
      width: 40px; height: 40px; border-radius: 12px; border: none;
      background: #002556; color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; flex-shrink: 0;
    }
    #gus-send:hover { background: #001a3d; transform: scale(1.05); }
    #gus-send:disabled { opacity: 0.4; cursor: default; transform: none; }
    #gus-send svg { width: 18px; height: 18px; }

    @media (max-width: 480px) {
      #gus-panel { width: calc(100vw - 32px); right: 16px; top: auto; bottom: 80px; transform: none; max-height: 70vh; }
      #gus-fab { top: auto; bottom: 16px; right: 16px; width: 56px; height: 56px; transform: none; }
      #gus-fab:hover { transform: scale(1.1); }
    }
  `;
  document.head.appendChild(style);

  // Inject HTML
  var widget = document.createElement('div');
  widget.innerHTML = `
    <div id="gus-fab">
      <img src="gus.JPG" alt="Gus" draggable="false">
      <span class="gus-badge">FIND IT</span>
    </div>
    <div id="gus-panel">
      <div id="gus-header">
        <img src="gus.JPG" alt="Gus">
        <div id="gus-header-info">
          <h3>Gus Find It</h3>
          <p>I know where everything is. Try me.</p>
        </div>
        <button id="gus-close" onclick="window.gusToggle()">&times;</button>
      </div>
      <div id="gus-messages">
        <div class="gus-msg gus-msg-bot">Hey there! I'm Gus. I know every corner of Agent Edge. Ask me where to find something, how a tool works, or what's available — I'll dig it up for you.</div>
      </div>
      <div id="gus-input-wrap">
        <input type="text" id="gus-input" placeholder="Ask Gus anything..." onkeydown="if(event.key==='Enter')window.gusSend()">
        <button id="gus-send" onclick="window.gusSend()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // Toggle
  window.gusToggle = function() {
    isOpen = !isOpen;
    var panel = document.getElementById('gus-panel');
    if (isOpen) {
      panel.classList.add('open');
      // Position panel near the fab
      var fab = document.getElementById('gus-fab');
      var fabRect = fab.getBoundingClientRect();
      panel.style.top = Math.max(10, fabRect.top - 200) + 'px';
      panel.style.right = (window.innerWidth - fabRect.left + 12) + 'px';
      panel.style.transform = 'none';
      document.getElementById('gus-input').focus();
    } else {
      panel.classList.remove('open');
    }
  };

  // Drag functionality
  (function() {
    var fab = document.getElementById('gus-fab');
    var isDragging = false;
    var wasDragged = false;
    var startX, startY, startLeft, startTop;

    fab.addEventListener('mousedown', function(e) {
      e.preventDefault();
      isDragging = true;
      wasDragged = false;
      fab.classList.add('dragging');
      var rect = fab.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      // Remove any transform so positioning works
      fab.style.transform = 'none';
      fab.style.left = startLeft + 'px';
      fab.style.top = startTop + 'px';
      fab.style.right = 'auto';
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) wasDragged = true;
      fab.style.left = (startLeft + dx) + 'px';
      fab.style.top = (startTop + dy) + 'px';
    });

    document.addEventListener('mouseup', function() {
      if (!isDragging) return;
      isDragging = false;
      fab.classList.remove('dragging');
      if (!wasDragged) {
        window.gusToggle();
      }
    });

    // Touch support for mobile
    fab.addEventListener('touchstart', function(e) {
      isDragging = true;
      wasDragged = false;
      fab.classList.add('dragging');
      var touch = e.touches[0];
      var rect = fab.getBoundingClientRect();
      startX = touch.clientX;
      startY = touch.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      fab.style.transform = 'none';
      fab.style.left = startLeft + 'px';
      fab.style.top = startTop + 'px';
      fab.style.right = 'auto';
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      var touch = e.touches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) wasDragged = true;
      fab.style.left = (startLeft + dx) + 'px';
      fab.style.top = (startTop + dy) + 'px';
    }, { passive: true });

    document.addEventListener('touchend', function() {
      if (!isDragging) return;
      isDragging = false;
      fab.classList.remove('dragging');
      if (!wasDragged) {
        window.gusToggle();
      }
    });
  })();

  // Send message
  window.gusSend = async function() {
    var input = document.getElementById('gus-input');
    var q = input.value.trim();
    if (!q) return;

    var msgs = document.getElementById('gus-messages');
    var sendBtn = document.getElementById('gus-send');

    // Add user message
    var userDiv = document.createElement('div');
    userDiv.className = 'gus-msg gus-msg-user';
    userDiv.textContent = q;
    msgs.appendChild(userDiv);
    input.value = '';
    sendBtn.disabled = true;

    // Add typing indicator
    var typing = document.createElement('div');
    typing.className = 'gus-typing';
    typing.innerHTML = '<span class="gus-paw">🐾</span><span class="gus-paw">🐾</span><span class="gus-paw">🐾</span><span class="gus-paw">🐾</span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    // Track in history
    history.push({ role: 'user', content: q });

    try {
      var resp = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: history.slice(-10) })
      });
      var data = await resp.json();
      var answer = data.answer || 'Hmm, I got turned around. Try asking a different way?';

      // Track answer
      history.push({ role: 'assistant', content: answer });

      // Remove typing, add answer
      typing.remove();
      var botDiv = document.createElement('div');
      botDiv.className = 'gus-msg gus-msg-bot';
      // Convert URLs and page references to links
      botDiv.innerHTML = formatGusAnswer(answer);
      msgs.appendChild(botDiv);

    } catch (err) {
      typing.remove();
      var errDiv = document.createElement('div');
      errDiv.className = 'gus-msg gus-msg-bot';
      errDiv.textContent = 'Oops — I got distracted by a squirrel. Try again in a sec.';
      msgs.appendChild(errDiv);
    }

    msgs.scrollTop = msgs.scrollHeight;
    sendBtn.disabled = false;
    input.focus();
  };

  // Format answer — turn .html references into clickable links
  function formatGusAnswer(text) {
    // Escape HTML
    var safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Convert .html file references to links
    safe = safe.replace(/(\b\w[\w-]*\.html)\b/g, '<a href="$1" target="_self">$1</a>');
    // Convert markdown-style links [text](url)
    safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Convert **bold**
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Line breaks
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }
})();
