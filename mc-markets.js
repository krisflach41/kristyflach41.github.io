// mc-markets.js — Markets Overview for Mission Control
// Real Fibonacci retracements, pivot-point Support/Resistance,
// candlestick + MAs, stochastic oscillator, clickable cards, auto-refresh

var mktsLoaded=false,mktsData=null,mktsCurrentSymbol='UMBS_5.5',mktsCurrentRange='3mo';
var mktsRefreshTimer=null,mktsChartData=null;
var mktsDMA={200:true,100:true,50:true,25:true};
var mktsDMAColors={200:'#2563eb',100:'#a855f7',50:'#0b1f3a',25:'#ea580c'};


function loadMarketsData(){
  var ts=document.getElementById('mktsTimestamp');
  if(ts)ts.textContent='Refreshing...';
  fetch('https://agent-edge-backend.vercel.app/api/markets')
  .then(function(r){return r.json()})
  .then(function(d){
    if(d.error){if(ts)ts.textContent='Error: '+d.error;return;}
    mktsData=d;
    var t=new Date(d.fetchedAt);
    if(ts)ts.textContent='Day Change: '+t.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'})+' ET';
    mktsRenderCards(d);
    mktsLoadChart();
  }).catch(function(e){if(ts)ts.textContent='Error: '+e.message;});
}

function mktsBpHtml(bps,inv){
  var up=bps>0,color=inv?(up?'#dc2626':'#16a34a'):(up?'#16a34a':'#dc2626');
  if(bps===0)color='#0b1f3a';
  return '<span style="color:'+color+';font-weight:700;">'+Math.abs(bps)+'bp '+(up?'▲':(bps<0?'▼':''))+'</span>';
}
function mktsPtsHtml(v){
  var c=v>=0?'#16a34a':'#dc2626';
  return '<span style="color:'+c+';font-weight:700;">'+Math.abs(v).toFixed(2)+' '+(v>=0?'▲':'▼')+'</span>';
}
function mktsSet(id,v,dec){var e=document.getElementById(id);if(e)e.textContent=(v!=null)?v.toFixed(dec||4):'—';}

function mktsRenderCards(d){
  var u55=d.umbs['UMBS_5.5'];
  if(u55&&u55.price){
    document.getElementById('mktsUmbs55Price').textContent=u55.price.toFixed(2);
    document.getElementById('mktsUmbs55Bps').innerHTML=mktsBpHtml(Math.round((u55.change||0)*100),false);
    mktsSet('mktsUmbs55Open',u55.open||u55.previousClose,4);
    mktsSet('mktsUmbs55Last',u55.price,4);
    mktsSet('mktsUmbs55High',u55.high,4);
    mktsSet('mktsUmbs55Low',u55.low,4);
  }
  var t10=d.treasuries['10Y'];
  if(t10&&t10.yield){
    document.getElementById('mkts10YPrice').textContent=t10.yield.toFixed(4);
    document.getElementById('mkts10YBps').innerHTML=mktsBpHtml(t10.changeBps||0,true);
    mktsSet('mkts10YOpen',t10.previousYield,4);mktsSet('mkts10YLast',t10.yield,4);
    mktsSet('mkts10YHigh',t10.yield,4);mktsSet('mkts10YLow',t10.yield,4);
  }
  var spy=d.spy;
  if(spy&&spy.price){
    document.getElementById('mktsSpyPrice').textContent=spy.price.toFixed(2);
    document.getElementById('mktsSpyPts').innerHTML=mktsPtsHtml(spy.change||0);
    mktsSet('mktsSpyOpen',spy.open,2);mktsSet('mktsSpyLast',spy.price,2);
    mktsSet('mktsSpyHigh',spy.high,2);mktsSet('mktsSpyLow',spy.low,2);
  }
  ['UMBS_5','UMBS_6'].forEach(function(k){
    var u=d.umbs[k],pre=k==='UMBS_5'?'mktsUmbs5':'mktsUmbs6';
    if(u&&u.price){
      document.getElementById(pre+'Price').textContent=u.price.toFixed(2);
      document.getElementById(pre+'Bps').innerHTML=mktsBpHtml(Math.round((u.change||0)*100),false);
      mktsSet(pre+'Open',u.open||u.previousClose,4);mktsSet(pre+'Last',u.price,4);
      mktsSet(pre+'High',u.high,4);mktsSet(pre+'Low',u.low,4);
    }
  });
  ['1Y','2Y','5Y','7Y'].forEach(function(tn){
    var td=d.treasuries[tn];
    if(td&&td.yield){
      document.getElementById('mkts'+tn+'Price').textContent=td.yield.toFixed(4);
      document.getElementById('mkts'+tn+'Bps').innerHTML=mktsBpHtml(td.changeBps||0,true);
      mktsSet('mkts'+tn+'Open',td.previousYield,4);mktsSet('mkts'+tn+'Last',td.yield,4);
      mktsSet('mkts'+tn+'High',td.yield,4);mktsSet('mkts'+tn+'Low',td.yield,4);
    }
  });
}

function mktsChangeSymbol(sym){
  mktsCurrentSymbol=sym;
  document.querySelectorAll('[data-mkts-card]').forEach(function(c){
    var match=c.getAttribute('data-mkts-card')===sym;
    c.style.borderColor=match?'#6e7f77':'#e2e5ed';
    c.style.borderWidth=match?'2px':'1px';
  });
  var lbl=document.getElementById('mktsDMALabel');
  if(lbl){var m={'UMBS_5.5':'UMBS 30YR 5.5%','UMBS_5':'UMBS 30YR 5%','UMBS_6':'UMBS 30YR 6%','10Y':'10Y UST','SPY':'S&P 500','1Y':'1Y UST','2Y':'2Y UST','5Y':'5Y UST','7Y':'7Y UST'};lbl.textContent=m[sym]||sym;}
  mktsLoadChart();
}
function mktsChangeRange(r){
  mktsCurrentRange=r;
  document.querySelectorAll('#mktsChartRanges button').forEach(function(b){
    var br=b.getAttribute('data-range');
    b.style.background=br===r?'#6e7f77':'#fff';b.style.color=br===r?'#fff':'#5a6578';
  });
  mktsLoadChart();
}
function mktsToggleDMA(p){mktsDMA[p]=!mktsDMA[p];var cb=document.getElementById('mktsDMA'+p+'CB');if(cb)cb.checked=mktsDMA[p];mktsRenderChartFromData();}


function mktsLoadChart(){
  var isT=['1Y','2Y','5Y','7Y','10Y'].indexOf(mktsCurrentSymbol)!==-1;
  var url='https://agent-edge-backend.vercel.app/api/markets?mode=history&symbol='+mktsCurrentSymbol+'&range='+mktsCurrentRange;
  if(!isT)url+='&interval=1d';
  fetch(url).then(function(r){return r.json()}).then(function(d){mktsChartData=d;mktsRenderChartFromData();}).catch(function(e){console.error(e);});
}

function mktsRenderChartFromData(){
  if(!mktsChartData||!mktsChartData.data||mktsChartData.data.length===0)return;
  var isT=mktsChartData.type==='treasury',data=mktsChartData.data;
  var canvas=document.getElementById('mktsMainChart');
  var dpr=window.devicePixelRatio||1,w=canvas.offsetWidth,h=canvas.offsetHeight;
  canvas.width=w*dpr;canvas.height=h*dpr;
  var ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  if(isT)mktsDrawTreasury(ctx,w,h,data);else mktsDrawCandles(ctx,w,h,data);
  var sc=document.getElementById('mktsStochChart'),sl=document.getElementById('mktsStochLabel');
  if(sc&&!isT&&true&&data.length>21){
    sc.style.display='block';if(sl)sl.style.display='block';
    var sw=sc.offsetWidth,sh=sc.offsetHeight;sc.width=sw*dpr;sc.height=sh*dpr;
    var sctx=sc.getContext('2d');sctx.scale(dpr,dpr);mktsDrawStoch(sctx,sw,sh,data);
  }else{if(sc)sc.style.display='none';if(sl)sl.style.display='none';}
}

function mktsCalcSMA(data,p){var r=[];for(var i=0;i<data.length;i++){if(i<p-1){r.push(null);continue;}var s=0;for(var j=i-p+1;j<=i;j++)s+=(data[j].close||data[j].value);r.push(s/p);}return r;}

function mktsCalcPivots(data){
  if(data.length<2)return null;
  var prev=data[data.length-2];
  var H=prev.high,L=prev.low,C=prev.close;
  if(!H||!L||!C)return null;
  var P=(H+L+C)/3;
  return{pivot:P,r1:2*P-L,r2:P+(H-L),s1:2*P-H,s2:P-(H-L)};
}

function mktsCalcFib(data){
  var hi=-Infinity,lo=Infinity;
  data.forEach(function(c){if(c.high>hi)hi=c.high;if(c.low<lo)lo=c.low;});
  var r=hi-lo;if(r===0)return null;
  return{
    pct0:{level:hi,label:'0% '+hi.toFixed(2)},
    pct236:{level:hi-r*0.236,label:'23.6% '+(hi-r*0.236).toFixed(2)},
    pct382:{level:hi-r*0.382,label:'38.2% '+(hi-r*0.382).toFixed(2)},
    pct50:{level:hi-r*0.5,label:'50% '+(hi-r*0.5).toFixed(2)},
    pct618:{level:hi-r*0.618,label:'61.8% '+(hi-r*0.618).toFixed(2)},
    pct100:{level:lo,label:'100% '+lo.toFixed(2)}
  };
}

function mktsDrawCandles(ctx,w,h,data){
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
  var pad={top:15,right:58,bottom:28,left:15},cw=w-pad.left-pad.right,ch=h-pad.top-pad.bottom;
  var minP=Infinity,maxP=-Infinity;
  data.forEach(function(c){if(c.low<minP)minP=c.low;if(c.high>maxP)maxP=c.high;});
  var range=maxP-minP||1;minP-=range*0.06;maxP+=range*0.06;range=maxP-minP;
  function yP(v){return pad.top+((maxP-v)/range)*ch;}
  function xP(i){return pad.left+(cw/data.length)*i+(cw/data.length)/2;}

  // Grid
  for(var g=0;g<=7;g++){
    var gy=pad.top+(ch/7)*g;
    ctx.strokeStyle='#f0f2f7';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(pad.left,gy);ctx.lineTo(w-pad.right,gy);ctx.stroke();
    ctx.fillStyle='#9ca3b4';ctx.font='9px DM Sans,sans-serif';ctx.textAlign='left';
    ctx.fillText((maxP-(range/7)*g).toFixed(2),w-pad.right+5,gy+3);
  }

  // MAs
  [200,100,50,25].forEach(function(p){
    if(!mktsDMA[p]||data.length<p)return;
    var sma=mktsCalcSMA(data,p);
    ctx.beginPath();ctx.strokeStyle=mktsDMAColors[p];ctx.lineWidth=1.2;var s=false;
    sma.forEach(function(v,i){if(v===null)return;if(!s){ctx.moveTo(xP(i),yP(v));s=true;}else ctx.lineTo(xP(i),yP(v));});
    ctx.stroke();
  });

  // Fibonacci
  if(true){
    var fib=mktsCalcFib(data);
    if(fib){ctx.setLineDash([5,4]);
      Object.keys(fib).forEach(function(k){var f=fib[k];if(f.level>=minP&&f.level<=maxP){
        var y=yP(f.level);ctx.strokeStyle='rgba(110,127,119,0.4)';ctx.lineWidth=0.8;
        ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(w-pad.right,y);ctx.stroke();
        ctx.fillStyle='#6e7f77';ctx.font='9px DM Sans,sans-serif';ctx.textAlign='left';
        ctx.fillText(f.label,pad.left+10,y-4);
      }});ctx.setLineDash([]);
    }
  }

  // S/R
  if(true){
    var pv=mktsCalcPivots(data);
    if(pv){ctx.setLineDash([8,4]);
      [{v:pv.r2,l:'R2 '+pv.r2.toFixed(2),c:'#2563eb'},{v:pv.r1,l:'R1 '+pv.r1.toFixed(2),c:'#2563eb'},
       {v:pv.s1,l:'S1 '+pv.s1.toFixed(2),c:'#dc2626'},{v:pv.s2,l:'S2 '+pv.s2.toFixed(2),c:'#dc2626'}
      ].forEach(function(sr){if(sr.v>=minP&&sr.v<=maxP){
        var y=yP(sr.v);ctx.strokeStyle=sr.c;ctx.lineWidth=0.8;
        ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(w-pad.right,y);ctx.stroke();
        ctx.fillStyle=sr.c;ctx.font='9px DM Sans,sans-serif';ctx.textAlign='right';
        ctx.fillText(sr.l,w-pad.right-5,y-4);
      }});ctx.setLineDash([]);
    }
  }

  // Candles
  var barW=Math.max(2,Math.min(9,(cw/data.length)*0.65));
  data.forEach(function(c,i){
    var x=xP(i),up=c.close>=c.open,color=up?'#16a34a':'#dc2626';
    ctx.strokeStyle=color;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,yP(c.high));ctx.lineTo(x,yP(c.low));ctx.stroke();
    ctx.fillStyle=color;
    var top=Math.min(yP(c.open),yP(c.close)),bh=Math.max(Math.abs(yP(c.close)-yP(c.open)),1);
    ctx.fillRect(x-barW/2,top,barW,bh);
  });

  // X dates
  ctx.textAlign='center';ctx.fillStyle='#9ca3b4';ctx.font='9px DM Sans,sans-serif';
  var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var li=Math.max(1,Math.ceil(data.length/12));
  data.forEach(function(c,i){if(i%li===0){var dt=new Date(c.date);ctx.fillText(months[dt.getMonth()]+' '+dt.getDate(),xP(i),h-6);}});
}

function mktsDrawTreasury(ctx,w,h,data){
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
  var pad={top:15,right:58,bottom:28,left:15},cw=w-pad.left-pad.right,ch=h-pad.top-pad.bottom;
  var vals=data.map(function(d){return d.value;}),minV=Math.min.apply(null,vals),maxV=Math.max.apply(null,vals);
  var range=maxV-minV||0.1;minV-=range*0.06;maxV+=range*0.06;range=maxV-minV;
  function yP(v){return pad.top+((maxV-v)/range)*ch;}
  for(var g=0;g<=7;g++){var gy=pad.top+(ch/7)*g;ctx.strokeStyle='#f0f2f7';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(pad.left,gy);ctx.lineTo(w-pad.right,gy);ctx.stroke();ctx.fillStyle='#9ca3b4';ctx.font='9px DM Sans,sans-serif';ctx.textAlign='left';ctx.fillText((maxV-(range/7)*g).toFixed(2)+'%',w-pad.right+5,gy+3);}
  ctx.beginPath();ctx.strokeStyle='#6e7f77';ctx.lineWidth=2;
  data.forEach(function(d,i){var x=pad.left+(cw/Math.max(data.length-1,1))*i;if(i===0)ctx.moveTo(x,yP(d.value));else ctx.lineTo(x,yP(d.value));});
  ctx.stroke();ctx.lineTo(pad.left+cw,pad.top+ch);ctx.lineTo(pad.left,pad.top+ch);ctx.closePath();ctx.fillStyle='rgba(110,127,119,0.06)';ctx.fill();
  ctx.textAlign='center';var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var li=Math.max(1,Math.ceil(data.length/12));
  data.forEach(function(d,i){if(i%li===0){var p=d.date.split('-');ctx.fillStyle='#9ca3b4';ctx.font='9px DM Sans,sans-serif';ctx.fillText(months[parseInt(p[1])-1]+' '+parseInt(p[2]),pad.left+(cw/Math.max(data.length-1,1))*i,h-6);}});
}

function mktsDrawStoch(ctx,w,h,data){
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
  var pad={top:10,right:58,bottom:28,left:15},cw=w-pad.left-pad.right,ch=h-pad.top-pad.bottom;
  var kV=[],dV=[];
  for(var i=0;i<data.length;i++){if(i<20){kV.push(null);continue;}var hi=-Infinity,lo=Infinity;for(var j=i-20;j<=i;j++){if(data[j].high>hi)hi=data[j].high;if(data[j].low<lo)lo=data[j].low;}var r=hi-lo;kV.push(r===0?50:((data[i].close-lo)/r)*100);}
  for(var i=0;i<kV.length;i++){if(kV[i]===null||i<22){dV.push(null);continue;}var s=0,c=0;for(var j=i-2;j<=i;j++){if(kV[j]!==null){s+=kV[j];c++;}}dV.push(c>0?s/c:null);}
  function yP(v){return pad.top+((100-v)/100)*ch;}
  function xP(i){return pad.left+(cw/data.length)*i+(cw/data.length)/2;}
  [{v:80,c:'#16a34a'},{v:20,c:'#dc2626'}].forEach(function(l){var y=yP(l.v);ctx.strokeStyle=l.c;ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(w-pad.right,y);ctx.stroke();ctx.fillStyle=l.c;ctx.font='9px DM Sans,sans-serif';ctx.textAlign='left';ctx.fillText(l.v,w-pad.right+5,y+3);});
  [0,50,100].forEach(function(v){var y=yP(v);ctx.strokeStyle='#f0f2f7';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(w-pad.right,y);ctx.stroke();});
  ctx.beginPath();ctx.strokeStyle='#0b1f3a';ctx.lineWidth=1.5;var s=false;
  kV.forEach(function(v,i){if(v===null)return;if(!s){ctx.moveTo(xP(i),yP(v));s=true;}else ctx.lineTo(xP(i),yP(v));});ctx.stroke();
  ctx.beginPath();ctx.strokeStyle='#a855f7';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);s=false;
  dV.forEach(function(v,i){if(v===null)return;if(!s){ctx.moveTo(xP(i),yP(v));s=true;}else ctx.lineTo(xP(i),yP(v));});ctx.stroke();ctx.setLineDash([]);
  ctx.textAlign='center';var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var li=Math.max(1,Math.ceil(data.length/12));
  data.forEach(function(c,i){if(i%li===0){var dt=new Date(c.date);ctx.fillStyle='#9ca3b4';ctx.font='9px DM Sans,sans-serif';ctx.fillText(months[dt.getMonth()]+' '+dt.getDate(),xP(i),h-6);}});
}

(function(){var orig=switchView;switchView=function(viewId,navEl){orig(viewId,navEl);if(viewId==='markets'&&!mktsLoaded){mktsLoaded=true;loadMarketsData();mktsRefreshTimer=setInterval(loadMarketsData,120000);}};})();
