(function() {
  var calImageData = null, calMediaType = null, parsedCal = null, parsedWeekLabel = null;
  var rewrittenMkt = null, rewrittenClient = null;
  var API = 'https://agent-edge-backend.vercel.app/api';

  document.getElementById('wirToggle').addEventListener('change', function() {
    var on = this.checked;
    document.getElementById('wirInput').disabled = !on;
    document.getElementById('generateWirBtn').disabled = !on;
  });

  var dz = document.getElementById('calDropZone');
  dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.style.borderColor='rgba(59,130,246,0.6)'; dz.style.background='rgba(59,130,246,0.08)'; });
  dz.addEventListener('dragleave', function() { dz.style.borderColor='rgba(59,130,246,0.3)'; dz.style.background='rgba(59,130,246,0.03)'; });
  dz.addEventListener('drop', function(e) { e.preventDefault(); dz.style.borderColor='rgba(59,130,246,0.3)'; dz.style.background='rgba(59,130,246,0.03)'; var f=e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) handleCalImg(f); });

  document.addEventListener('paste', function(e) {
    var p=document.getElementById('view-briefings'); if(!p||p.style.display==='none') return;
    var items=e.clipboardData?e.clipboardData.items:null; if(!items) return;
    for(var i=0;i<items.length;i++) { if(items[i].type.startsWith('image/')) { e.preventDefault(); handleCalImg(items[i].getAsFile()); break; } }
  });

  window.handleCalImg = function(file) {
    if(!file) return; calMediaType=file.type;
    var r=new FileReader();
    r.onload=function(e) {
      var url=e.target.result; calImageData=url.split(',')[1];
      dz.style.borderColor='rgba(34,197,94,0.4)'; dz.style.borderStyle='solid'; dz.style.padding='10px';
      dz.innerHTML='<img src="'+url+'" style="max-width:100%;border-radius:6px;display:block;margin:0 auto;"><input type="file" id="calFileInput" accept="image/*" style="display:none;" onchange="handleCalImg(this.files[0])">';
      var btn=document.getElementById('parseCalBtn'); btn.disabled=false; btn.style.opacity='1';
    };
    r.readAsDataURL(file);
  };

  window.parseCalendar = async function() {
    if(!calImageData) return;
    var btn=document.getElementById('parseCalBtn'); btn.disabled=true; btn.innerHTML='<span class="bc-spin"></span>Reading...';
    briefStatus('Reading calendar screenshot...','loading');
    try {
      var resp=await fetch(API+'/parse-briefing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'parse_calendar',image:calImageData,mediaType:calMediaType})});
      var data=await resp.json(); if(!data.success) throw new Error(data.error||'Failed');
      parsedCal=data.portalCalendar; parsedWeekLabel=data.weekLabel;
      renderCalPreview(parsedCal,parsedWeekLabel);
      briefStatus('Calendar parsed — review below, then publish.','success');
    } catch(err) { briefStatus('Error: '+err.message,'error'); }
    btn.disabled=false; btn.style.opacity='1'; btn.innerHTML='Read Calendar';
  };

  function renderCalPreview(cal,label) {
    var panel=document.getElementById('calPreview'), content=document.getElementById('calPreviewContent');
    if(label) document.getElementById('calPreviewTitle').textContent=label.toUpperCase();
    var html='';
    cal.forEach(function(item) {
      var abbr=item.day.substring(0,3), hasMore=item.additionalEvents&&item.additionalEvents.length>0;
      html+='<div style="display:flex;align-items:baseline;gap:12px;padding:7px 0;border-bottom:1px solid var(--border-light);">';
      html+='<span style="font-weight:700;color:#3b82f6;min-width:32px;font-size:13px;">'+abbr+'</span>';
      html+='<span style="font-weight:500;color:var(--text-primary);font-size:13px;">'+item.mainEvent+'</span>';
      if(hasMore) html+='<span style="background:#3b82f6;color:white;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-left:auto;flex-shrink:0;">+'+item.additionalEvents.length+'</span>';
      html+='</div>';
      if(hasMore) { item.additionalEvents.forEach(function(evt) { html+='<div style="color:var(--text-muted);font-size:12px;padding-left:44px;padding-bottom:3px;">'+evt+'</div>'; }); }
    });
    content.innerHTML=html; panel.style.display='block';
  }

  window.rewriteSummaries = async function() {
    var raw=document.getElementById('rawMarketInput').value.trim();
    if(!raw){briefStatus('Paste market content first.','error');return;}
    var btn=document.getElementById('rewriteBtn'); btn.disabled=true; btn.innerHTML='<span class="bc-spin"></span>Writing...';
    briefStatus('Rewriting summaries...','loading');
    try {
      var resp=await fetch(API+'/parse-briefing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rewrite_summaries',rawContent:raw})});
      var data=await resp.json(); if(!data.success) throw new Error(data.error||'Failed');
      rewrittenMkt=data.marketSummary; rewrittenClient=data.clientFriendly;
      document.getElementById('mktPreviewContent').innerHTML=fmtText(rewrittenMkt);
      document.getElementById('clientPreviewContent').innerHTML=fmtText(rewrittenClient);
      document.getElementById('mktPreview').style.display='block';
      document.getElementById('clientPreview').style.display='block';
      briefStatus('Summaries ready — review below, then publish.','success');
    } catch(err) { briefStatus('Error: '+err.message,'error'); }
    btn.disabled=false; btn.innerHTML='Rewrite Summaries';
  };

  function fmtText(text) {
    if(!text) return '';
    return text.split(/\n\n+/).map(function(p) {
      p=p.trim(); if(!p) return '';
      if(p.match(/^(Market Open|What This Means|Looking Ahead|Bottom Line)/i)) {
        var lines=p.split('\n');
        return '<div style="font-weight:600;color:var(--text-primary);margin:12px 0 4px;">'+lines[0]+'</div>'+(lines.length>1?'<div>'+lines.slice(1).join('<br>')+'</div>':'');
      }
      return '<div style="margin-bottom:8px;">'+p.replace(/\n/g,'<br>')+'</div>';
    }).join('');
  }

  window.generateWIR = async function() {
    var btn=document.getElementById('generateWirBtn'); btn.disabled=true; btn.innerHTML='<span class="bc-spin"></span>Generating...';
    briefStatus('Pulling this week\'s summaries and generating recap...','loading');
    try {
      var histResp=await fetch(API+'/briefing?action=history');
      var histData=await histResp.json();
      if(!histData.days||histData.days.length===0) throw new Error('No daily summaries found for this week. Publish some summaries first.');
      var wirResp=await fetch(API+'/parse-briefing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'generate_wir',dailySummaries:histData.days,weekStart:histData.weekStart,weekEnd:histData.weekEnd})});
      var wirData=await wirResp.json(); if(!wirData.success) throw new Error(wirData.error||'WIR generation failed');
      document.getElementById('wirInput').value=wirData.weekInReview;
      document.getElementById('wirPreviewLabel').textContent=(wirData.weekEndingLabel||'WEEK IN REVIEW').toUpperCase();
      document.getElementById('wirPreviewContent').innerHTML='<div style="margin-bottom:6px;font-weight:600;color:rgba(245,158,11,0.8);">'+(wirData.weekEndingLabel||'')+'</div>'+fmtText(wirData.weekInReview);
      document.getElementById('wirPreview').style.display='block';
      briefStatus('Week in Review generated — review below, then publish.','success');
    } catch(err) { briefStatus('Error: '+err.message,'error'); }
    btn.disabled=!document.getElementById('wirToggle').checked; btn.innerHTML='Generate from This Week';
  };

  window.publishBriefing = async function() {
    var btn=document.getElementById('publishBtn');
    var hasCal=parsedCal&&parsedCal.length>0, hasMkt=rewrittenMkt||rewrittenClient;
    var hasWir=document.getElementById('wirToggle').checked&&document.getElementById('wirInput').value.trim();
    if(!hasCal&&!hasMkt&&!hasWir){briefStatus('Nothing to publish.','error');return;}
    btn.disabled=true; btn.innerHTML='<span class="bc-spin"></span> PUBLISHING...';
    briefStatus('Saving to database...','loading');
    try {
      var payload={};
      if(hasCal){payload.economicCalendar=parsedCal; if(parsedWeekLabel) payload.calendarWeek=parsedWeekLabel;}
      if(rewrittenMkt) payload.marketSummary=rewrittenMkt;
      if(rewrittenClient) payload.clientFriendly=rewrittenClient;
      if(hasWir) payload.weekInReview=document.getElementById('wirInput').value.trim();
      var resp=await fetch(API+'/briefing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      var data=await resp.json(); if(!data.success) throw new Error(data.error||'Publish failed');
      briefStatus('PUBLISHED — your realtors can see the update now.','success');
    } catch(err) { briefStatus('Publish error: '+err.message,'error'); }
    btn.disabled=false; btn.innerHTML='PUBLISH TO PORTAL';
  };

  function briefStatus(msg,type) {
    var bar=document.getElementById('briefingStatus'); bar.textContent=msg; bar.style.display='block';
    if(type==='success'){bar.style.background='rgba(34,197,94,0.08)';bar.style.border='1px solid rgba(34,197,94,0.2)';bar.style.color='#22c55e';}
    else if(type==='error'){bar.style.background='rgba(239,68,68,0.08)';bar.style.border='1px solid rgba(239,68,68,0.2)';bar.style.color='#ef4444';}
    else{bar.style.background='rgba(59,130,246,0.06)';bar.style.border='1px solid rgba(59,130,246,0.15)';bar.style.color='#60a5fa';}
  }
})();
