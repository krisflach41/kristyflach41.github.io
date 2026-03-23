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
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 64px; height: 64px; border-radius: 50%;
      background: #002556; border: 3px solid #baa370;
      cursor: pointer; overflow: hidden;
      box-shadow: 0 6px 24px rgba(0,37,86,0.35), 0 2px 8px rgba(0,0,0,0.15);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex; align-items: center; justify-content: center;
    }
    #gus-fab:hover {
      transform: scale(1.1) rotate(-5deg);
      box-shadow: 0 10px 32px rgba(0,37,86,0.4), 0 4px 12px rgba(0,0,0,0.2);
    }
    #gus-fab img {
      width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
    }
    #gus-fab .gus-badge {
      position: absolute; top: -2px; right: -2px;
      background: #baa370; color: #002556; font-size: 9px; font-weight: 800;
      padding: 2px 5px; border-radius: 8px; letter-spacing: 0.3px;
      font-family: 'DM Sans', system-ui, sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }

    #gus-panel {
      position: fixed; bottom: 100px; right: 24px; z-index: 99998;
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
      align-self: flex-start; padding: 10px 18px;
      background: white; border-radius: 14px; border-bottom-left-radius: 4px;
      border: 1px solid rgba(186,163,112,0.2);
      display: flex; gap: 5px; align-items: center;
    }
    .gus-dot {
      width: 7px; height: 7px; background: #baa370; border-radius: 50%;
      animation: gusBounce 1.2s infinite;
    }
    .gus-dot:nth-child(2) { animation-delay: 0.2s; }
    .gus-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes gusBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
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
      #gus-panel { width: calc(100vw - 32px); right: 16px; bottom: 90px; max-height: 70vh; }
      #gus-fab { bottom: 16px; right: 16px; width: 56px; height: 56px; }
    }
  `;
  document.head.appendChild(style);

  // Inject HTML
  var widget = document.createElement('div');
  widget.innerHTML = `
    <div id="gus-fab" onclick="window.gusToggle()">
      <img src="gus.JPG" alt="Gus">
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
      document.getElementById('gus-input').focus();
    } else {
      panel.classList.remove('open');
    }
  };

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
    typing.innerHTML = '<div class="gus-dot"></div><div class="gus-dot"></div><div class="gus-dot"></div>';
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
