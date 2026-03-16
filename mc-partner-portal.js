// ===== PARTNER PORTAL =====
function ppTab(tab,el){document.querySelectorAll('.pp-tab').forEach(function(t){t.classList.remove('active');});el.classList.add('active');['ppDashboard','ppReports','ppFlyers','ppScenarios','ppHistory'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none';});var map={dashboard:'ppDashboard',reports:'ppReports',flyers:'ppFlyers',scenarios:'ppScenarios',history:'ppHistory'};var t=document.getElementById(map[tab]);if(t)t.style.display='block';if(tab==='flyers'){var wb=document.getElementById('ppWebsiteBuilder');if(wb)wb.style.display='none';}if(tab==='dashboard')ppBuildDashboard();if(tab==='reports')ppBuildReportOrders();if(tab==='flyers')ppBuildFlyerOrders();if(tab==='scenarios')ppLoadScenarios();if(tab==='history')ppBuildOrderHistory('all');}

var ppActivityLog=[];
var ppActFilterPartner='';
var ppColorPalette=['#f472b6','#3b82f6','#22c55e','#a855f7','#06b6d4','#f59e0b','#ef4444','#34d399','#818cf8','#fb923c','#e879f9','#14b8a6'];
function ppGetColor(i){return ppColorPalette[i%ppColorPalette.length];}

function ppInit(el){if(el)el.textContent='--';}

var reportNames={amortization:'Payoff Accelerator',bid:'Worth the Premium',buyrent:'Rent to Wealth',costwaiting:'Your Wealth Starts Now',appreciation:'Wealth in Motion',investment:'Owner to Investor',reportcard:'Neighborhood Blueprint'};

function ppBuildDashboard(){
  if(!ordersLoaded){loadOrders();setTimeout(ppBuildDashboard,1500);return;}

  // KPIs from real orders
  var partnerEmails={};
  allOrders.forEach(function(o){if(o.email)partnerEmails[o.email.toLowerCase()]=true;});
  var e=document.getElementById('ppKpiPartners');if(e)e.textContent=Object.keys(partnerEmails).length;
  var activeOrders=allOrders.filter(function(o){return(o.status||'').toLowerCase()!=='complete';}).length;
  var e2=document.getElementById('ppKpiOrders');if(e2)e2.textContent=activeOrders;
  var e3=document.getElementById('ppKpiDownloads');if(e3)e3.textContent=allOrders.length;

  // Leaderboard from real orders
  var byPartner={};
  allOrders.forEach(function(o){
    var key=(o.email||'unknown').toLowerCase();
    if(!byPartner[key])byPartner[key]={name:o.name||o.email||'Unknown',brokerage:o.brokerage||'',orders:0};
    byPartner[key].orders++;
    if(o.name)byPartner[key].name=o.name;
    if(o.brokerage)byPartner[key].brokerage=o.brokerage;
  });
  var leaders=Object.values(byPartner).sort(function(a,b){return b.orders-a.orders;}).slice(0,10);
  var h='';
  if(leaders.length===0){
    h='<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No orders yet. Leaderboard populates as realtors place orders.</div>';
  } else {
    var maxO=leaders[0].orders||1;
    leaders.forEach(function(p,i){
      var cl=ppGetColor(i);
      var ini=p.name.split(' ').map(function(w){return w[0]||'';}).join('').substring(0,2);
      var pct=(p.orders/maxO)*100;
      var rankColors=['#fbbf24','#94a3b8','#d97706'];
      h+='<div style="display:flex;align-items:center;gap:14px;padding:10px 14px;border-radius:8px;margin-bottom:3px;">';
      h+='<div style="font-family:sans-serif;font-size:16px;font-weight:900;width:30px;text-align:center;color:'+(i<3?rankColors[i]:'var(--text-muted)')+';">'+(i+1)+'</div>';
      h+='<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;background:'+cl+'20;color:'+cl+';">'+ini+'</div>';
      h+='<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--text-primary);">'+p.name+'</div><div style="font-size:11px;color:var(--text-muted);">'+p.brokerage+'</div></div>';
      h+='<div style="flex:1;height:6px;background:#fafbfc;border-radius:3px;overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+cl+'30,'+cl+');border-radius:3px;"></div></div>';
      h+='<div style="text-align:right;"><div style="font-family:sans-serif;font-size:14px;font-weight:700;color:'+cl+';">'+p.orders+'</div><div style="font-size:9px;color:var(--text-muted);letter-spacing:1px;font-weight:600;">ORDERS</div></div>';
      h+='</div>';
    });
  }
  var lb=document.getElementById('ppLeaderboard');if(lb)lb.innerHTML=h;

  // Top Reports + Top Flyers from real order items
  var reportCounts={};var flyerCounts={};
  allOrders.forEach(function(o){
    try{
      var items=o.items||o.cartJson||'';
      var obj=typeof items==='object'?items:JSON.parse(items);
      if(obj.advisory){Object.keys(obj.advisory).forEach(function(k){var n=reportNames[k]||(k.charAt(0).toUpperCase()+k.slice(1));reportCounts[n]=(reportCounts[n]||0)+1;});}
      if(obj.marketing&&Array.isArray(obj.marketing)){obj.marketing.forEach(function(m){var n=typeof m==='string'?m:(m.name||m.type||'Flyer');flyerCounts[n]=(flyerCounts[n]||0)+1;});}
      if(obj.websites&&Array.isArray(obj.websites)){flyerCounts['Property Website']=(flyerCounts['Property Website']||0)+obj.websites.length;}
    }catch(e){}
  });
  function buildTop5(counts){
    var arr=Object.keys(counts).map(function(k){return{n:k,c:counts[k]};}).sort(function(a,b){return b.c-a.c;}).slice(0,5);
    if(arr.length===0)return'<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:12px;">No data yet</div>';
    var h='';arr.forEach(function(d,i){h+='<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:6px;margin-bottom:3px;background:rgba(0,0,0,0.01);"><div style="font-family:sans-serif;font-size:14px;font-weight:900;color:rgba(59,130,246,0.4);width:24px;text-align:center;">'+(i+1)+'</div><div style="font-size:13px;color:var(--text-secondary);font-weight:600;flex:1;">'+d.n+'</div><div style="font-family:sans-serif;font-size:14px;font-weight:700;color:rgba(59,130,246,0.6);">'+d.c+'</div></div>';});
    return h;
  }
  var tr=document.getElementById('ppTopReports');if(tr)tr.innerHTML=buildTop5(reportCounts);
  var tf=document.getElementById('ppTopFlyers');if(tf)tf.innerHTML=buildTop5(flyerCounts);
  ppLoadOnlineUsers();
}

function ppLoadOnlineUsers() {
  var loId = localStorage.getItem('agent_edge_user') || 'default';
  fetch(API_BASE + '/track?action=online&lo_user_id=' + loId)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var countEl = document.getElementById('ppOnlineCount');
      var listEl = document.getElementById('ppOnlineList');
      if (!countEl || !listEl) return;

      var online = data.online || [];
      countEl.textContent = online.length;

      if (online.length === 0) {
        listEl.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:10px 0;text-align:center;">No realtors online right now</div>';
        return;
      }

      var h = '';
      online.forEach(function(u) {
        var initials = (u.user_name || u.user_email || '?').split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
        var ago = ppTimeAgo(u.last_active);
        var pageName = u.last_page || 'Portal';

        h += '<div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:6px;margin-bottom:2px;">';
        h += '<div style="position:relative;width:28px;height:28px;border-radius:50%;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#22c55e;">' + initials;
        h += '<div style="position:absolute;bottom:-1px;right:-1px;width:8px;height:8px;border-radius:50%;background:#22c55e;border:2px solid var(--bg-card);"></div>';
        h += '</div>';
        h += '<div style="flex:1;min-width:0;">';
        h += '<div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (u.user_name || u.user_email) + '</div>';
        h += '<div style="font-size:10px;color:var(--text-muted);">' + pageName + ' · ' + ago + '</div>';
        h += '</div>';
        h += '</div>';
      });
      listEl.innerHTML = h;
    })
    .catch(function() {
      var listEl = document.getElementById('ppOnlineList');
      if (listEl) listEl.innerHTML = '<div style="font-size:11px;color:var(--text-muted);padding:10px 0;text-align:center;">—</div>';
    });

  // Load activity data (merged into dashboard)
  ppBuildActivity();
}

function ppTimeAgo(ts) {
  if (!ts) return '';
  var diff = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  return Math.floor(diff / 3600) + 'h ago';
}

function ppParseOrderItems(raw){
  if(!raw)return{title:'Order',details:'',lineItems:[]};
  var str=typeof raw==='string'?raw:JSON.stringify(raw);
  try{
    var obj=typeof raw==='object'?raw:JSON.parse(str);
    var parts=[];
    var lineItems=[];
    var reportIcons={amortization:'☕',bid:'📊',buyrent:'🏠',costwaiting:'⏰',appreciation:'📈',investment:'🏢',reportcard:'📝'};
    var reportNames={amortization:'Payoff Accelerator',bid:'Worth the Premium',buyrent:'Rent to Wealth',costwaiting:'Your Wealth Starts Now',appreciation:'Wealth in Motion',investment:'Owner to Investor',reportcard:'Neighborhood Blueprint'};
    if(obj.advisory){
      Object.keys(obj.advisory).forEach(function(k){
        var r=obj.advisory[k];
        var items=Array.isArray(r)?r:[r];
        items.forEach(function(item,idx){
          var name=reportNames[k]||(k.charAt(0).toUpperCase()+k.slice(1)+' Report');
          var icon=reportIcons[k]||'📋';
          var dets=[];
          if(item.address)dets.push(item.address);
          if(item.loan)dets.push('$'+Number(String(item.loan).replace(/[^0-9.]/g,'')|| 0).toLocaleString());
          if(item.rate)dets.push(item.rate+'%');
          if(item.purchase)dets.push(item.purchase);
          if(item.list)dets.push('List: $'+Number(String(item.list).replace(/[^0-9.]/g,'')||0).toLocaleString());
          if(item.offer)dets.push('Offer: $'+Number(String(item.offer).replace(/[^0-9.]/g,'')||0).toLocaleString());
          lineItems.push({type:k,name:name,icon:icon,detail:dets.join(' · '),data:item,category:'ADVISORY'});
          parts.push(name+(dets.length>0?' — '+dets.join(', '):''));
        });
      });
    }
    if(obj.marketing&&obj.marketing.length>0){
      obj.marketing.forEach(function(m){
        lineItems.push({type:'flyer',name:m,icon:'🎨',detail:'Marketing flyer',data:{name:m},category:'MARKETING'});
        parts.push(m);
      });
    }
    if(obj.websites&&obj.websites.length>0){
      obj.websites.forEach(function(w){
        var wName=typeof w==='object'?(w.address||'Property Website'):w;
        var wDets=[];
        if(typeof w==='object'){
          if(w.mls)wDets.push('MLS: '+w.mls);
          if(w.template)wDets.push(w.template);
          if(w.colorScheme)wDets.push(w.colorScheme);
        }
        lineItems.push({type:'website',name:wName,icon:'🌐',detail:wDets.length>0?wDets.join(' · '):'Property Website',data:w,category:'WEBSITE'});
      });
      parts.push(obj.websites.length+' Website(s)');
    }
    var totalItems=lineItems.length;
    var title=totalItems>1?totalItems+' Items':parts[0]||'Order';
    return{title:title,details:totalItems>1?parts.slice(0,2).join(' · '):'',lineItems:lineItems};
  }catch(e){}
  var clean=str.replace(/[{}"[\]]/g,'').replace(/,/g,', ').substring(0,80);
  return{title:clean||'Order',details:'',lineItems:[]};
}

function ppBuildOrderRow(parsed,partner,meta,status,statusColor,email,orderId){
  var buttons='';
  if(status==='COMPLETE'){
    buttons='<button class="pp-order-btn" onclick="ppViewOrder(\''+orderId+'\')" style="background:transparent;border:1px solid var(--border);color:var(--text-muted);">VIEW ORDER</button>';
  } else {
    buttons='<button class="pp-order-btn" onclick="ppViewOrder(\''+orderId+'\')">VIEW ORDER</button>';
  }
  buttons+='<button class="pp-email-btn" onclick="ppEmailPartner(\''+email+'\',\''+parsed.title.replace(/'/g,'')+'\')"><i class="fas fa-paper-plane"></i> EMAIL</button>';
  buttons+='<button class="pp-order-btn" onclick="ppDeleteOrder(\''+orderId+'\')" style="background:transparent;border:1px solid rgba(220,38,38,0.2);color:rgba(220,38,38,0.6);margin-left:4px;" title="Delete order"><i class="fas fa-trash"></i></button>';
  return '<div class="pp-order-row"><div class="pp-order-dot" style="background:'+statusColor+';box-shadow:0 0 8px '+statusColor+';"></div><div class="pp-order-info"><div class="pp-order-name">'+parsed.title+' — '+partner+'</div><div class="pp-order-meta">'+(parsed.details?parsed.details+' · ':'')+meta+'</div></div><div class="pp-order-tag" style="background:'+statusColor+'18;color:'+statusColor+';">'+status+'</div>'+buttons+'</div>';
}

function ppUpdateOrderStatus(orderId,newStatus,callback){
  fetch('https://agent-edge-backend.vercel.app/api/update-order',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({orderId:orderId,status:newStatus})
  }).then(function(r){return r.json();}).then(function(d){
    if(d.success){
      var order=allOrders.find(function(o){return o.orderId===orderId;});
      if(order)order.status=newStatus;
      if(callback)callback();
    } else {
      showToast('Status update failed');
    }
  }).catch(function(e){showToast('Status update error');});
}

function ppCompleteOrder(orderId){
  ppUpdateOrderStatus(orderId,'complete',function(){
    showToast('Order marked complete ✓');
    ppCloseOrderPanel();
    ppBuildReportOrders();
    ppBuildFlyerOrders();
  });
}

function ppDeleteOrder(orderId){
  if(!confirm('Delete this order? This cannot be undone.'))return;
  fetch('https://agent-edge-backend.vercel.app/api/update-order',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({orderId:orderId,action:'delete'})
  }).then(function(r){return r.json();}).then(function(d){
    if(d.success){
      allOrders=allOrders.filter(function(o){return o.orderId!==orderId;});
      showToast('Order deleted');
      ppCloseOrderPanel();
      ppBuildReportOrders();
      ppBuildFlyerOrders();
      ppBuildOrderHistory(ppHistoryFilterVal||'all');
      ppBuildDashboard();
    } else {
      showToast('Delete failed: '+(d.message||'Unknown error'));
    }
  }).catch(function(e){showToast('Delete failed');});
}

// ===== VIEW ORDER PANEL =====
var currentViewOrderId=null;

function ppViewOrder(orderId){
  var order=allOrders.find(function(o){return o.orderId===orderId;});
  if(!order){showToast('Order not found');return;}
  currentViewOrderId=orderId;

  // Update status to in progress if new
  if((order.status||'').toLowerCase()==='new'){
    ppUpdateOrderStatus(orderId,'in progress',function(){
      ppBuildReportOrders();
      ppBuildFlyerOrders();
    });
    order.status='in progress';
  }

  var parsed=ppParseOrderItems(order.items||order.cartJson);
  var items=parsed.lineItems;
  var ts=order.timestamp?new Date(order.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';
  var sl=(order.status||'').toLowerCase();
  var statusLabel=sl==='complete'?'COMPLETE':sl==='in progress'?'IN PROGRESS':'NEW';
  var statusColor=sl==='complete'?'#22c55e':sl==='in progress'?'#f59e0b':'#ef4444';

  var cobrandChip='';
  if(order.branding==='Co-branded'){
    cobrandChip='<div class="pp-od-chip cobrand-yes"><i class="fas fa-check" style="font-size:8px;"></i> CO-BRANDED · '+(order.cobrandLayout||'LEFT').toUpperCase()+'</div>';
  } else {
    cobrandChip='<div class="pp-od-chip cobrand-no">KRISTY BRANDED</div>';
  }

  var h='';
  // Header
  h+='<div class="pp-od-header"><div class="pp-od-topline"><div><div class="pp-od-title">ORDER '+orderId+'</div>';
  h+='<div class="pp-od-sub">'+(order.name||'Unknown')+' · '+(order.brokerage||'')+'</div></div>';
  h+='<button class="pp-od-close" onclick="ppCloseOrderPanel()">✕</button></div>';
  h+='<div class="pp-od-meta">';
  h+='<div class="pp-od-chip partner"><i class="fas fa-user" style="font-size:8px;"></i> '+(order.name||'Unknown')+'</div>';
  h+=cobrandChip;
  if(ts)h+='<div class="pp-od-chip date"><i class="fas fa-clock" style="font-size:8px;"></i> '+ts+'</div>';
  h+='<div class="pp-od-chip status" style="background:'+statusColor+'12;color:'+statusColor+';border-color:'+statusColor+'30;">'+statusLabel+'</div>';
  h+='</div></div>';

  // Body
  h+='<div class="pp-od-body">';
  h+='<div class="pp-od-section-label">LINE ITEMS · '+items.length+' '+(items.length===1?'ITEM':'ITEMS')+'</div>';

  // Select all
  if(items.length>1){
    h+='<div class="pp-od-select-all"><input type="checkbox" id="ppSelectAll" onchange="ppToggleAllItems(this.checked)"><label for="ppSelectAll" style="cursor:pointer;">SELECT ALL</label></div>';
  }

  // Line items
  var genItems=order.generatedItems||[];
  items.forEach(function(item,i){
    var isGen=genItems.indexOf(i)>=0;
    if(isGen){
      h+='<div class="pp-od-item generated" data-index="'+i+'" data-type="'+item.type+'" onclick="ppToggleItem(this)">';
      h+='<input type="checkbox" class="pp-od-cb" onclick="event.stopPropagation();ppUpdateSelCount();">';
    } else {
      h+='<div class="pp-od-item" onclick="ppToggleItem(this)" data-index="'+i+'" data-type="'+item.type+'">';
      h+='<input type="checkbox" class="pp-od-cb" onclick="event.stopPropagation();ppUpdateSelCount();">';
    }
    h+='<div class="pp-od-item-icon">'+item.icon+'</div>';
    h+='<div class="pp-od-item-info"><div class="pp-od-item-name">'+item.name+(isGen?' <span class="pp-od-item-check-icon">✓ Done</span>':'')+'</div>';
    h+='<div class="pp-od-item-detail">'+item.detail+'</div></div>';
    if(isGen){
      h+='<div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">';
      h+='<button class="topbar-btn" onclick="event.stopPropagation();ppOpenGeneratedItem('+i+',\''+orderId+'\')" style="padding:4px 10px;font-size:10px;letter-spacing:0.5px;"><i class="fas fa-eye"></i> Open</button>';
      h+='<button class="topbar-btn" onclick="event.stopPropagation();ppUndoGenerated('+i+',\''+orderId+'\')" style="padding:4px 10px;font-size:10px;letter-spacing:0.5px;border-color:rgba(220,38,38,0.2);color:rgba(220,38,38,0.6);"><i class="fas fa-undo"></i></button>';
      h+='</div>';
    } else {
      h+='<div class="pp-od-item-type">'+item.category+'</div>';
    }
    h+='</div>';
  });

  // Notes
  if(order.notes){
    h+='<div class="pp-od-notes"><div class="pp-od-notes-label">NOTES FROM PARTNER</div>';
    h+='<div class="pp-od-notes-text">'+order.notes.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div></div>';
  }
  h+='</div>';

  // Footer
  h+='<div class="pp-od-footer">';
  h+='<div class="pp-od-count" id="ppOdCount">0 of '+items.length+' selected</div>';
  h+='<button class="pp-od-btn cancel" onclick="ppCloseOrderPanel()">CLOSE</button>';
  if(sl!=='complete'){
    h+='<button class="pp-od-btn complete" onclick="ppCompleteOrder(\''+orderId+'\')">✓ COMPLETE</button>';
  }
  h+='<button class="pp-od-btn generate disabled" id="ppOdGenBtn" onclick="ppGenerateSelected(\''+orderId+'\')">GENERATE SELECTED</button>';
  h+='</div>';

  document.getElementById('ppOrderPanel').innerHTML=h;
  document.getElementById('ppOrderOverlay').style.display='block';
  document.getElementById('ppOrderPanel').style.display='block';
}

function ppCloseOrderPanel(){
  document.getElementById('ppOrderOverlay').style.display='none';
  document.getElementById('ppOrderPanel').style.display='none';
  document.getElementById('ppOrderFloatTab').style.display='none';
  currentViewOrderId=null;
}

function ppMinimizeOrderPanel(orderId){
  document.getElementById('ppOrderOverlay').style.display='none';
  document.getElementById('ppOrderPanel').style.display='none';
  var tab=document.getElementById('ppOrderFloatTab');
  document.getElementById('ppFloatTabLabel').textContent='Order '+(orderId||'');
  tab.style.display='flex';
  tab.setAttribute('data-order-id',orderId||'');
}

function ppRestoreOrderPanel(){
  var tab=document.getElementById('ppOrderFloatTab');
  var orderId=tab.getAttribute('data-order-id');
  tab.style.display='none';
  if(orderId){
    ppViewOrder(orderId);
  }
}

function ppToggleItem(row){
  var cb=row.querySelector('.pp-od-cb');
  cb.checked=!cb.checked;
  row.classList.toggle('checked',cb.checked);
  ppUpdateSelCount();
}

function ppToggleAllItems(isChecked){
  document.querySelectorAll('.pp-od-cb').forEach(function(cb){
    cb.checked=isChecked;
    cb.closest('.pp-od-item').classList.toggle('checked',isChecked);
  });
  ppUpdateSelCount();
}

function ppUpdateSelCount(){
  var total=document.querySelectorAll('.pp-od-cb').length;
  var checked=document.querySelectorAll('.pp-od-cb:checked').length;
  var countEl=document.getElementById('ppOdCount');
  if(countEl)countEl.textContent=checked+' of '+total+' selected';
  var btn=document.getElementById('ppOdGenBtn');
  if(btn){
    if(checked===0){btn.classList.add('disabled');btn.textContent='GENERATE SELECTED';}
    else{btn.classList.remove('disabled');btn.textContent='GENERATE '+(checked===total&&total>1?'ALL':checked>1?checked:'REPORT');}
  }
  var sa=document.getElementById('ppSelectAll');
  if(sa)sa.checked=total>0&&checked===total;
}

function ppGenerateSelected(orderId){
  var order=allOrders.find(function(o){return o.orderId===orderId;});
  if(!order)return;
  var parsed=ppParseOrderItems(order.items||order.cartJson);
  var items=parsed.lineItems;
  var checkedEls=document.querySelectorAll('.pp-od-cb:checked');
  if(checkedEls.length===0){showToast('Select at least one item');return;}

  var existingGen=order.generatedItems||[];
  var newGen=existingGen.slice();

  var hasWebsite=false;
  checkedEls.forEach(function(cb){
    var row=cb.closest('.pp-od-item');
    var idx=parseInt(row.getAttribute('data-index'));
    var item=items[idx];
    if(!item)return;
    if(item.type==='website')hasWebsite=true;
    ppGenerateLineItem(item,order);
    if(newGen.indexOf(idx)<0)newGen.push(idx);
  });

  // Save generated items to backend
  order.generatedItems=newGen;
  fetch('https://agent-edge-backend.vercel.app/api/update-order',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({orderId:orderId,generated_items:newGen})
  }).catch(function(e){console.error('Save generated items error:',e);});

  // For website items, don't reopen the panel — builder is now active
  if(hasWebsite){
    showToast('Opening property website builder...');
  } else {
    showToast('Generating '+checkedEls.length+' report'+(checkedEls.length>1?'s':'')+'...');
    // Refresh the panel to show updated state after a short delay
    setTimeout(function(){ppViewOrder(orderId);},500);
  }
}

function ppUndoGenerated(itemIndex, orderId){
  if(!confirm('Mark this item as not completed? You can regenerate it.'))return;
  var order=allOrders.find(function(o){return o.orderId===orderId;});
  if(!order)return;
  var gen=order.generatedItems||[];
  gen=gen.filter(function(idx){return idx!==itemIndex;});
  order.generatedItems=gen;
  // Save to backend
  fetch('https://agent-edge-backend.vercel.app/api/update-order',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({orderId:orderId,generated_items:gen})
  }).catch(function(e){console.error('Undo generated error:',e);});
  showToast('Item marked as incomplete');
  ppViewOrder(orderId);
}

function ppOpenGeneratedItem(itemIndex, orderId){
  var order=allOrders.find(function(o){return o.orderId===orderId;});
  if(!order)return;
  var parsed=ppParseOrderItems(order.items||order.cartJson);
  var item=parsed.lineItems[itemIndex];
  if(!item)return;
  // Re-run the generate to open the report/tool
  ppGenerateLineItem(item,order);
}

function ppGenerateLineItem(item,order){
  var p=[];
  // Common order params
  if(order.name)p.push('realtorName='+encodeURIComponent(order.name));
  if(order.email)p.push('realtorEmail='+encodeURIComponent(order.email));
  if(order.brokerage)p.push('realtorBrokerage='+encodeURIComponent(order.brokerage));
  if(order.branding==='Co-branded'){
    p.push('cobrand=true');
    p.push('cobrandLayout='+encodeURIComponent(order.cobrandLayout||'left'));
  }
  if(order.notes){
    var clientMatch=order.notes.match(/client[:\s]+([^\n,;]+)/i);
    if(clientMatch)p.push('clientName='+encodeURIComponent(clientMatch[1].trim()));
  }

  // Item-specific params
  var data=item.data||{};
  if(item.type==='amortization'){
    if(data.loan)p.push('loan='+encodeURIComponent(data.loan));
    if(data.rate)p.push('rate='+encodeURIComponent(data.rate));
    if(data.address)p.push('address='+encodeURIComponent(data.address));
    window.open('amortization-report.html?'+p.join('&'),'_blank');
  } else if(item.type==='bid'){
    if(data.address)p.push('address='+encodeURIComponent(data.address));
    if(data.list)p.push('list='+encodeURIComponent(data.list));
    if(data.offer)p.push('offer='+encodeURIComponent(data.offer));
    // Future: window.open('bid-over-ask-report.html?'+p.join('&'),'_blank');
    showToast('Bid Over Ask generator coming soon');
  } else if(item.type==='buyrent'){
    showToast('Buy vs Rent generator coming soon');
  } else if(item.type==='costwaiting'){
    window.open('wealth-starts-now.html','_blank');
  } else if(item.type==='appreciation'){
    var ap=[];
    if(data.address)ap.push('address='+encodeURIComponent(data.address));
    if(data.purchase)ap.push('price='+encodeURIComponent(data.purchase));
    if(data.name)ap.push('clientName='+encodeURIComponent(data.name));
    window.open('wealth-in-motion.html'+(ap.length?'?'+ap.join('&'):''),'_blank');
  } else if(item.type==='investment'){
    var ip=[];
    if(data.address)ip.push('address='+encodeURIComponent(data.address));
    if(data.purchase)ip.push('price='+encodeURIComponent(data.purchase));
    if(data.name)ip.push('clientName='+encodeURIComponent(data.name));
    if(data.rent)ip.push('rent='+encodeURIComponent(data.rent));
    window.open('owner-to-investor.html'+(ip.length?'?'+ip.join('&'):''),'_blank');
  } else if(item.type==='reportcard'){
    var p=[];
    if(data.address)p.push('zip='+encodeURIComponent(data.address.replace(/[^0-9]/g,'').slice(-5)));
    if(data.address)p.push('address='+encodeURIComponent(data.address));
    if(order.partnerName)p.push('clientName='+encodeURIComponent(order.partnerName));
    if(order.cobrandStatus==='Co-branded'){
      p.push('cobrand=true');
      if(order.partnerName)p.push('realtorName='+encodeURIComponent(order.partnerName));
      if(order.brokerage)p.push('realtorBrokerage='+encodeURIComponent(order.brokerage));
      if(order.cobrandLayout)p.push('cobrandLayout='+encodeURIComponent(order.cobrandLayout));
    }
    window.open('neighborhood-blueprint.html'+(p.length?'?'+p.join('&'):''),'_blank');
  } else if(item.type==='website'){
    var addr=typeof data==='object'?(data.address||''):data;
    var mls=typeof data==='object'?(data.mls||''):'';
    var tpl=typeof data==='object'?(data.template||'Cavallo'):'Cavallo';
    var clr=typeof data==='object'?(data.colorScheme||'Blue'):'Blue';
    ppMinimizeOrderPanel(order.orderId||currentViewOrderId);
    var flyersTabBtn=document.querySelector('.pp-tab[onclick*="flyers"]');
    if(flyersTabBtn)flyersTabBtn.click();
    pwLoadOrder(addr,mls,tpl,clr);
  } else {
    showToast('Generator for '+item.name+' coming soon');
  }
}

function ppEmailPartner(email,subject){
  if(!email){showToast('No email address for this partner');return;}
  var sub=subject||'order';
  showToast('Sending email to '+email+'...');
  fetch('https://agent-edge-backend.vercel.app/api/send-email',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      to:email,
      subject:'Your '+sub+' is ready!',
      body:'<p>Hi,</p><p>Great news — your <strong>'+sub+'</strong> is complete and ready for you!</p><p>If you have any questions or need any changes, just let me know. I\'m always happy to help.</p><p>Looking forward to working together!</p>'
    })
  }).then(function(r){return r.json();}).then(function(d){
    if(d.success){showToast('Email sent to '+email+' ✓');}
    else{showToast('Email failed: '+(d.message||'Unknown error'));}
  }).catch(function(e){showToast('Email error: '+e.toString());});
}

function ppBuildReportOrders(){
  if(!ordersLoaded){loadOrders();setTimeout(ppBuildReportOrders,1500);return;}
  var reportOrders=allOrders.filter(function(o){
    var str=typeof o.items==='string'?o.items:JSON.stringify(o.items||{});
    str=str.toLowerCase();
    var isReport=str.indexOf('advisory')>=0||str.indexOf('amortization')>=0||str.indexOf('bid')>=0||str.indexOf('buyrent')>=0||str.indexOf('costwaiting')>=0||str.indexOf('appreciation')>=0||str.indexOf('investment')>=0||str.indexOf('reportcard')>=0;
    var isActive=(o.status||'').toLowerCase()!=='complete';
    return isReport&&isActive;
  });
  var h='';var pendingCount=reportOrders.length;
  reportOrders.forEach(function(o){
    var sc=(o.status||'').toLowerCase()==='in progress'?'#f59e0b':'#ef4444';
    var sl=(o.status||'').toLowerCase()==='in progress'?'IN PROGRESS':'NEW';
    var parsed=ppParseOrderItems(o.items||o.cartJson);
    var ts=o.timestamp?new Date(o.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';
    h+=ppBuildOrderRow(parsed,o.name||'Unknown',(o.brokerage||'')+(ts?' · '+ts:''),sl,sc,o.email||'',o.orderId||'');
  });
  if(h==='')h='<div style="padding:20px;text-align:center;color:var(--text-muted);font-weight:600;font-size:13px;">NO ACTIVE ORDERS</div>';
  document.getElementById('ppReportOrders').innerHTML=h;
  document.getElementById('ppReportOrderCount').textContent=pendingCount>0?pendingCount+' PENDING':'ALL CLEAR';
}

function ppBuildFlyerOrders(){
  if(!ordersLoaded){loadOrders();setTimeout(ppBuildFlyerOrders,1500);return;}
  var flyerOrders=allOrders.filter(function(o){
    // Parse the actual cart data to check for real marketing items
    try{
      var items=o.items||o.cartJson||'';
      var obj=typeof items==='object'?items:JSON.parse(typeof items==='string'?items:JSON.stringify(items));
      if(obj.marketing&&Array.isArray(obj.marketing)&&obj.marketing.length>0)return true;
      if(obj.websites&&Array.isArray(obj.websites)&&obj.websites.length>0)return true;
    }catch(e){}
    // Fallback string check for flyer-specific terms only
    var str=typeof o.items==='string'?o.items:JSON.stringify(o.items||{});
    str=str.toLowerCase();
    return str.indexOf('flyer')>=0||str.indexOf('open house')>=0||str.indexOf('just listed')>=0||str.indexOf('just sold')>=0||str.indexOf('website')>=0;
  }).filter(function(o){
    var isActive=(o.status||'').toLowerCase()!=='complete';
    return isActive;
  });
  var h='';var pendingCount=flyerOrders.length;
  flyerOrders.forEach(function(o){
    var sc=(o.status||'').toLowerCase()==='in progress'?'#f59e0b':'#ef4444';
    var sl=(o.status||'').toLowerCase()==='in progress'?'IN PROGRESS':'NEW';
    var parsed=ppParseOrderItems(o.items||o.cartJson);
    var ts=o.timestamp?new Date(o.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';
    h+=ppBuildOrderRow(parsed,o.name||'Unknown',(o.brokerage||'')+(ts?' · '+ts:''),sl,sc,o.email||'',o.orderId||'');
  });
  if(h==='')h='<div style="padding:20px;text-align:center;color:var(--text-muted);font-weight:600;font-size:13px;">NO FLYER ORDERS</div>';
  document.getElementById('ppFlyerOrders').innerHTML=h;
  document.getElementById('ppFlyerOrderCount').textContent=pendingCount>0?pendingCount+' PENDING':'ALL CLEAR';
}

// ===== ORDER HISTORY =====
var ppHistoryFilterVal='all';

function ppFilterHistory(filter,btn){
  ppHistoryFilterVal=filter;
  document.querySelectorAll('.pp-history-filter button').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  ppBuildOrderHistory(filter);
}

function ppBuildOrderHistory(filter){
  if(!ordersLoaded){loadOrders();setTimeout(function(){ppBuildOrderHistory(filter);},1500);return;}
  filter=filter||ppHistoryFilterVal||'all';
  var orders=allOrders.filter(function(o){
    if(filter==='all')return true;
    return(o.status||'').toLowerCase()===filter.toLowerCase();
  });
  // Sort newest first
  orders.sort(function(a,b){return new Date(b.timestamp||0)-new Date(a.timestamp||0);});

  var h='<table class="pp-history-table"><thead><tr><th>ORDER ID</th><th>PARTNER</th><th>BROKERAGE</th><th>ITEMS</th><th>CO-BRAND</th><th>DATE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>';
  orders.forEach(function(o){
    var parsed=ppParseOrderItems(o.items||o.cartJson);
    var ts=o.timestamp?new Date(o.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
    var sl=(o.status||'').toLowerCase();
    var statusLabel=sl==='complete'?'COMPLETE':sl==='in progress'?'IN PROGRESS':'NEW';
    var statusColor=sl==='complete'?'#22c55e':sl==='in progress'?'#f59e0b':'#ef4444';
    var cobrand=o.branding==='Co-branded'?'Yes · '+(o.cobrandLayout||'left').toUpperCase():'No';
    var itemSummary=parsed.lineItems.length+' item'+(parsed.lineItems.length!==1?'s':'');
    h+='<tr>';
    h+='<td style="font-weight:600;font-size:11px;color:var(--text-muted);">'+o.orderId+'</td>';
    h+='<td style="font-weight:600;color:var(--text-secondary);">'+(o.name||'Unknown')+'</td>';
    h+='<td>'+(o.brokerage||'—')+'</td>';
    h+='<td>'+itemSummary+'</td>';
    h+='<td>'+cobrand+'</td>';
    h+='<td style="font-weight:600;">'+ts+'</td>';
    h+='<td><span class="status-badge" style="background:'+statusColor+'15;color:'+statusColor+';">'+statusLabel+'</span></td>';
    h+='<td><button class="pp-order-btn" onclick="ppViewOrder(\''+o.orderId+'\')" style="padding:5px 12px;font-size:9px;letter-spacing:1px;">VIEW</button> <button class="pp-order-btn" onclick="ppDeleteOrder(\''+o.orderId+'\')" style="padding:5px 8px;font-size:9px;background:transparent;border:1px solid rgba(220,38,38,0.2);color:rgba(220,38,38,0.6);" title="Delete"><i class="fas fa-trash"></i></button></td>';
    h+='</tr>';
  });
  h+='</tbody></table>';
  if(orders.length===0)h='<div style="padding:30px;text-align:center;color:var(--text-muted);font-weight:600;">NO ORDERS FOUND</div>';
  document.getElementById('ppHistoryTable').innerHTML=h;
  document.getElementById('ppHistoryCount').textContent=orders.length+' ORDER'+(orders.length!==1?'S':'');
}

function ppBuildActivity(){
  var loId=localStorage.getItem('agent_edge_user')||'default';
  // Fetch real tracking events
  fetch(API_BASE+'/track?action=active_users&lo_user_id='+loId+'&period=30d')
    .then(function(r){return r.json();})
    .then(function(data){
      var users=data.users||[];
      var h='';
      if(users.length===0){
        h='<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No partner activity in the last 30 days.</div>';
      } else {
        users.forEach(function(u,i){
          var cl=ppGetColor(i);
          var name=u.user_name||u.user_email||'Unknown';
          var ini=name.split(' ').map(function(w){return w[0]||'';}).join('').substring(0,2).toUpperCase();
          var visits=u.pages_visited||0;
          var lastAgo=u.last_active?ppTimeAgo(u.last_active):'—';
          var isA=ppActFilterPartner===name;
          h+='<div class="pp-pcard'+(isA?' active':'')+'" onclick="ppTogglePartner(\''+name.replace(/'/g,"\\'")+'\')">';
          h+='<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:'+cl+'20;color:'+cl+';flex-shrink:0;">'+ini+'</div>';
          h+='<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;color:var(--text-primary);">'+name+'</div><div style="font-size:10px;color:var(--text-muted);font-weight:600;">'+visits+' pages · Last: '+lastAgo+'</div></div>';
          h+='<div style="text-align:right;"><div style="font-family:sans-serif;font-size:14px;font-weight:700;color:'+cl+';">'+visits+'</div><div style="font-size:9px;color:var(--text-muted);letter-spacing:1px;font-weight:600;">PAGES</div></div>';
          h+='</div>';
        });
      }
      var pc=document.getElementById('ppPartnerCards');if(pc)pc.innerHTML=h;

      // Tool usage from rollups
      fetch(API_BASE+'/track?action=rollup_stats&lo_user_id='+loId+'&days=30')
        .then(function(r2){return r2.json();})
        .then(function(rollData){
          var rollups=rollData.rollups||[];
          var toolTotals={};
          rollups.forEach(function(r){
            if(r.top_collection){toolTotals[r.top_collection]=(toolTotals[r.top_collection]||0)+r.page_visits;}
          });
          var toolArr=Object.keys(toolTotals).map(function(k){return{n:k.toUpperCase(),c:toolTotals[k]};}).sort(function(a,b){return b.c-a.c;}).slice(0,6);
          if(toolArr.length===0){
            var tb2=document.getElementById('ppToolBars');if(tb2)tb2.innerHTML='<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:12px;">No tool usage data yet</div>';
            return;
          }
          var mx=Math.max.apply(null,toolArr.map(function(t){return t.c;}));var th='';
          var toolColors=['#3b82f6','#22c55e','#a855f7','#f472b6','#fbbf24','#06b6d4'];
          toolArr.forEach(function(t,i){var pct=(t.c/mx)*100;var tcl=toolColors[i%toolColors.length];th+='<div style="display:flex;align-items:center;gap:12px;padding:6px 0;"><div style="width:110px;font-size:11px;color:var(--text-muted);text-align:right;font-weight:600;">'+t.n+'</div><div style="flex:1;height:6px;background:#fafbfc;border-radius:3px;overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+tcl+'30,'+tcl+');border-radius:3px;"></div></div><div style="font-family:sans-serif;font-size:13px;font-weight:700;color:'+tcl+';width:30px;text-align:right;">'+t.c+'</div></div>';});
          var tb2=document.getElementById('ppToolBars');if(tb2)tb2.innerHTML=th;
          // Content downloads from rollups
          var dlReports=0,dlFlyers=0,dlSocial=0;
          rollups.forEach(function(r){
            dlReports+=r.downloads||0;
            if(r.top_collection==='Marketing')dlFlyers+=(r.downloads||0);
          });
          // Also count from real orders this month
          var now=new Date();var monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
          var monthOrders=allOrders.filter(function(o){return o.timestamp&&o.timestamp>=monthStart;});
          var rptCount=0,flyCount=0;
          monthOrders.forEach(function(o){
            try{
              var items=o.items||o.cartJson||'';
              var obj=typeof items==='object'?items:JSON.parse(items);
              if(obj.advisory)rptCount+=Object.keys(obj.advisory).length;
              if(obj.marketing&&Array.isArray(obj.marketing))flyCount+=obj.marketing.length;
              if(obj.websites&&Array.isArray(obj.websites))flyCount+=obj.websites.length;
            }catch(e){}
          });
          var dr=document.getElementById('ppDlReports');if(dr)dr.textContent=rptCount;
          var df=document.getElementById('ppDlFlyers');if(df)df.textContent=flyCount;
          var ds=document.getElementById('ppDlSocial');if(ds)ds.textContent=0;
          var dt=document.getElementById('ppDlTotal');if(dt)dt.textContent=rptCount+flyCount;
        }).catch(function(){});

      // Load activity log from real events
      ppLoadActivityLog(loId);
    })
    .catch(function(e){
      console.error('Activity load error:',e);
      var pc=document.getElementById('ppPartnerCards');if(pc)pc.innerHTML='<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Could not load activity data.</div>';
    });
}

function ppLoadActivityLog(loId){
  // We need recent events — use the rollup or direct event query
  // For now, pull from crm_activity which track.js writes to
  fetch(API_BASE+'/crm-api?action=list&limit=100&lo_user_id='+(loId||'default'))
    .then(function(){
      // crm_activity doesn't have a list endpoint, so use tracking events via a simple approach
      // Pull last 50 events from ae_tracking_events by fetching rollups and building from orders + sessions
      ppActivityLog=[];
      // Build activity from real orders
      allOrders.forEach(function(o){
        if(!o.timestamp)return;
        var parsed=ppParseOrderItems(o.items||o.cartJson);
        ppActivityLog.push({
          partner:o.name||o.email||'Unknown',
          type:'order',
          detail:parsed.title||'Order',
          date:new Date(o.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}),
          time:parsed.lineItems.length+' items'
        });
      });
      // Sort newest first
      ppActivityLog.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
      ppActFilter();
    })
    .catch(function(){ppActFilter();});
}

function ppTogglePartner(n){ppActFilterPartner=ppActFilterPartner===n?'':n;ppBuildActivity();}

function ppActFilter(){
  var s=(document.getElementById('ppActSearch')||{}).value||'';s=s.toLowerCase();
  var tf=(document.getElementById('ppActTypeFilter')||{}).value||'';
  var typeMap={report:'REPORT',flyer:'FLYER',tool:'TOOL',social:'SOCIAL',login:'LOGIN',order:'ORDER'};
  var filtered=ppActivityLog.filter(function(a){
    if(ppActFilterPartner&&a.partner!==ppActFilterPartner)return false;
    if(tf&&a.type!==tf)return false;
    if(s&&(a.partner+' '+a.type+' '+a.detail).toLowerCase().indexOf(s)<0)return false;
    return true;
  });
  var h='';
  if(filtered.length===0){
    h='<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">No activity records found</td></tr>';
  } else {
    filtered.forEach(function(a){
      var cl=ppGetColor(Math.abs(a.partner.charCodeAt(0)-65)%12);
      h+='<tr><td style="font-weight:700;color:var(--text-primary);">'+a.partner+'</td>';
      h+='<td><span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:1px;background:'+cl+'18;color:'+cl+';">'+(typeMap[a.type]||a.type.toUpperCase())+'</span></td>';
      h+='<td>'+a.detail+'</td><td style="color:var(--text-muted);">'+a.date+'</td><td style="color:'+cl+';font-weight:700;">'+a.time+'</td></tr>';
    });
  }
  var tb=document.getElementById('ppActTableBody');if(tb)tb.innerHTML=h;
  var ct=document.getElementById('ppActLogCount');if(ct)ct.textContent=filtered.length+' RECORDS';
  var ft=document.getElementById('ppActFooter');if(ft)ft.innerHTML='SHOWING <span style="color:#3b82f6;font-weight:700;">'+filtered.length+'</span> OF '+ppActivityLog.length+' TOTAL';
}

function loadPartnerPortal(){
  // Check URL hash for direct tab navigation
  var hash=(window.location.hash||'').replace('#','').toLowerCase();
  var validTabs=['dashboard','reports','flyers','scenarios','history'];
  if(hash&&validTabs.indexOf(hash)>=0){
    var tabEl=document.querySelectorAll('.pp-tab')[validTabs.indexOf(hash)];
    if(tabEl)ppTab(hash,tabEl);
  } else {
    ppBuildDashboard();
  }
}

// ===== SCENARIOS (inside Partner Portal) =====
function ppLoadScenarios() {
  var container = document.getElementById('ppScenarioContent');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:36px;margin-bottom:12px;">&#x1F43E;</div><div style="font-size:12px;letter-spacing:1px;">LOADING SCENARIOS...</div></div>';

  fetch(API_BASE + '/scenario-desk')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var scenarios = data.scenarios || [];
      if (scenarios.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);"><div style="font-size:48px;margin-bottom:12px;">&#x1F43E;</div><div style="font-size:14px;">No scenarios yet</div><div style="font-size:12px;margin-top:4px;">When realtors ask Gus Gus questions or submit review requests, they\'ll appear here.</div></div>';
        return;
      }

      var h = '';
      // Stat cards
      var hotCount = scenarios.filter(function(s) { return s.status === 'new' && s.type !== 'ask_gus'; }).length;
      var intelCount = scenarios.filter(function(s) { return s.type === 'ask_gus'; }).length;
      var resolvedCount = scenarios.filter(function(s) { return s.status === 'called_back' || s.status === 'closed' || s.status === 'reviewed'; }).length;

      h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">';
      h += '<div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:14px 16px;"><div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#ef4444;">HOT LEADS</div><div style="font-size:24px;font-weight:700;color:#ef4444;margin-top:4px;">' + hotCount + '</div></div>';
      h += '<div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:10px;padding:14px 16px;"><div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#3b82f6;">INTEL FEED</div><div style="font-size:24px;font-weight:700;color:#3b82f6;margin-top:4px;">' + intelCount + '</div></div>';
      h += '<div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.15);border-radius:10px;padding:14px 16px;"><div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#22c55e;">RESOLVED</div><div style="font-size:24px;font-weight:700;color:#22c55e;margin-top:4px;">' + resolvedCount + '</div></div>';
      h += '</div>';

      // Scenario cards
      scenarios.forEach(function(s) {
        var isHot = s.status === 'new' && s.type !== 'ask_gus';
        var isIntel = s.type === 'ask_gus';
        var dotColor = isHot ? '#ef4444' : isIntel ? '#3b82f6' : '#22c55e';
        var statusLabel = isHot ? 'NEW' : isIntel ? 'INTEL' : 'RESOLVED';
        var badgeBg = isHot ? 'rgba(239,68,68,0.15)' : isIntel ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)';
        var ago = s.created_at ? ppTimeAgoScenario(s.created_at) : '';

        h += '<div class="mc-panel" style="margin-bottom:10px;border-left:3px solid ' + dotColor + ';">';
        h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">';
        h += '<span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:1px;background:' + badgeBg + ';color:' + dotColor + ';">' + statusLabel + '</span>';
        h += '<span style="font-size:11px;color:var(--text-muted);font-weight:600;">' + (s.realtor_name || 'Unknown') + ' · ' + ago + '</span>';
        h += '</div>';
        h += '<div style="font-size:14px;color:var(--text-primary);line-height:1.6;margin-bottom:10px;">' + (s.question || '').substring(0, 200) + (s.question && s.question.length > 200 ? '...' : '') + '</div>';

        // Action buttons
        h += '<div style="display:flex;gap:8px;">';
        if (isHot) {
          h += '<button class="topbar-btn" onclick="ppScenarioAction(\'' + s.id + '\',\'called_back\')" style="border-color:rgba(34,197,94,0.3);color:#22c55e;font-size:11px;"><i class="fas fa-phone"></i> Called Back</button>';
        }
        if (!s.status || s.status === 'new' || s.status === 'auto_resolved') {
          h += '<button class="topbar-btn" onclick="ppScenarioAction(\'' + s.id + '\',\'reviewed\')" style="font-size:11px;"><i class="fas fa-check"></i> Mark Reviewed</button>';
        }
        h += '<button class="topbar-btn" onclick="ppScenarioDelete(\'' + s.id + '\')" style="border-color:rgba(220,38,38,0.2);color:rgba(220,38,38,0.6);font-size:11px;"><i class="fas fa-trash"></i></button>';
        h += '</div>';
        h += '</div>';
      });

      container.innerHTML = h;
    })
    .catch(function(err) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px;">Failed to load scenarios.</div>';
    });
}

function ppScenarioAction(id, status) {
  fetch(API_BASE + '/scenario-desk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_status', id: id, status: status })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.success) {
      showToast('Scenario updated');
      ppLoadScenarios();
    }
  }).catch(function() { showToast('Update failed'); });
}

function ppScenarioDelete(id) {
  if (!confirm('Delete this scenario?')) return;
  fetch(API_BASE + '/scenario-desk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_status', id: id, status: 'deleted' })
  }).then(function(r) { return r.json(); }).then(function(d) {
    showToast('Scenario removed');
    ppLoadScenarios();
  }).catch(function() { showToast('Delete failed'); });
}

function ppTimeAgoScenario(ts) {
  if (!ts) return '';
  var diff = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}
