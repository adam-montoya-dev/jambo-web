/* Jambo Arcade: easter egg. 3 clics seguidos en el logo JAMBO (o escribir "jambo") */
(function(){
  console.log('Jambo Arcade listo');

  var CSS=`
.arc{position:fixed;inset:0;z-index:2000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.88)}
.arc.show{display:flex}
.arc-box{position:relative;width:min(92vw,400px);padding:14px;background:#0b0b14;border:4px solid #f5a524;box-shadow:0 0 0 4px #c8372d,0 0 40px rgba(245,165,36,.35);font-family:"Press Start 2P","Courier New",monospace;color:#f5a524;line-height:1.7;transition:box-shadow .1s}
.arc-box.hit{box-shadow:0 0 0 4px #fff,0 0 50px #c8372d}
.arc-box::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;background:repeating-linear-gradient(to bottom,rgba(0,0,0,0) 0,rgba(0,0,0,0) 2px,rgba(0,0,0,.22) 3px)}
.arc-x{position:absolute;top:-18px;right:-18px;z-index:6;width:38px;height:38px;border:3px solid #fff;background:#c8372d;color:#fff;font:inherit;font-size:1.1rem;cursor:pointer}
.arc-hud{display:flex;justify-content:space-between;font-size:.7rem;margin:0 0 10px}
.arc-box canvas{display:block;margin:0 auto;border:2px solid #34312d}
.arc-msg{position:absolute;inset:0;z-index:3;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:28px 18px;text-align:center;overflow:auto;background:rgba(10,10,20,.94)}
.arc-msg.clear{background:rgba(10,10,20,.35)}
.arc-msg h3{margin:0;font-size:.95rem;color:#fff;font-weight:400;line-height:1.6;font-family:inherit;text-transform:none}
.arc-msg p{margin:0;font-size:.62rem;color:#f3efe9;max-width:none}
.arc-msg .arc-small{font-size:.5rem;color:#9b958c}
.arc-msg .arc-score{font-size:1rem;color:#f5a524}
.arc-msg .arc-new{color:#4cd964;animation:arcblink .6s steps(2) infinite}
.arc-big{font-size:3.4rem;color:#fff;font-weight:400}
.arc-msg button{font-family:inherit;font-size:.7rem;color:#fff;background:#c8372d;border:3px solid #fff;padding:12px 18px;cursor:pointer;border-radius:0;text-transform:none;letter-spacing:0}
.arc-msg button:hover{background:#f5a524;color:#161514}
.arc-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.arc-blink{animation:arcblink 1s steps(2) infinite;color:#f5a524 !important}
.arc-secret{border:2px dashed #f5a524;padding:12px;font-size:.55rem;line-height:1.9;color:#fff}
.arc-secret b{color:#f5a524;font-weight:400}
@keyframes arcblink{50%{opacity:0}}
@media(prefers-reduced-motion:reduce){.arc-blink,.arc-msg .arc-new{animation:none}}
`;

  var clicks=[],box,cv,ctx,msg,hudS,hudT,W=320,H=400,dpr=1;
  var token=0,raf=0,playing=false,items=[],px=160,score=0,timeLeft=10,last=0,spawnT=0,keys={},best=0;
  var GOOD=['🍟','🍔','🧀','🥓','🥬','🍅','🥤'],BAD='🔥';
  try{best=parseInt(localStorage.getItem('jambo-arcade-best'),10)||0}catch(e){}

  function pad(n,l){n=String(n);while(n.length<l)n='0'+n;return n}

  function build(){
    if(box)return;
    var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
    var l=document.createElement('link');
    l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(l);
    var o=document.createElement('div');o.className='arc';
    o.innerHTML='<div class="arc-box" role="dialog" aria-modal="true" aria-label="Jambo Arcade">'+
      '<button class="arc-x" type="button" aria-label="Cerrar">×</button>'+
      '<div class="arc-hud"><span id="arcS">PTS 000</span><span id="arcT">T 10</span></div>'+
      '<canvas id="arcC"></canvas><div class="arc-msg" id="arcM"></div></div>';
    document.body.appendChild(o);
    box=o;cv=o.querySelector('#arcC');ctx=cv.getContext('2d');
    msg=o.querySelector('#arcM');hudS=o.querySelector('#arcS');hudT=o.querySelector('#arcT');
    cv.style.touchAction='none';
    cv.onpointermove=cv.onpointerdown=function(e){
      var r=cv.getBoundingClientRect();
      px=Math.max(44,Math.min(W-44,e.clientX-r.left));
    };
    o.querySelector('.arc-x').onclick=close;
    o.onclick=function(e){if(e.target===o)close()};
    msg.onclick=function(e){
      var b=e.target.closest('button[data-a]');if(!b)return;
      if(b.dataset.a==='go')countdown();else close();
    };
  }

  function size(){
    var w=Math.min(372,window.innerWidth-56);
    var h=Math.round(Math.min(w*1.25,window.innerHeight*.52));
    W=w;H=h;dpr=Math.min(2,window.devicePixelRatio||1);
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    cv.style.width=W+'px';cv.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    px=W/2;
  }

  function screen(html,clear){
    msg.className='arc-msg'+(clear?' clear':'');
    msg.innerHTML=html;msg.style.display='flex';
  }
  function hud(){
    hudS.textContent='PTS '+pad(score,3);
    hudT.textContent='T '+Math.max(0,Math.ceil(timeLeft));
  }

  function openArc(){
    build();size();token++;playing=false;cancelAnimationFrame(raf);
    items=[];score=0;timeLeft=10;hud();draw();
    box.classList.add('show');document.body.style.overflow='hidden';
    screen('<h3>JAMBO ARCADE</h3>'+
      '<p>¡Has encontrado el secreto!</p>'+
      '<p>Atrapa ingredientes durante 10 segundos.<br>Evita las llamas 🔥</p>'+
      '<p class="arc-small">Mueve el dedo, el ratón o las flechas ← →</p>'+
      '<button type="button" data-a="go">START</button>'+
      '<p class="arc-blink">INSERT COIN</p>');
  }
  function close(){
    token++;playing=false;cancelAnimationFrame(raf);
    if(box)box.classList.remove('show');
    document.body.style.overflow='';
  }

  function countdown(){
    var my=++token;playing=false;cancelAnimationFrame(raf);
    size();items=[];score=0;timeLeft=10;hud();draw();
    var n=3;
    (function step(){
      if(my!==token)return;
      if(n>0){screen('<b class="arc-big">'+n+'</b>',true);n--;setTimeout(step,700)}
      else{
        screen('<b class="arc-big">GO!</b>',true);
        setTimeout(function(){
          if(my!==token)return;
          msg.style.display='none';begin();
        },500);
      }
    })();
  }

  function begin(){
    playing=true;last=performance.now();spawnT=0;
    raf=requestAnimationFrame(loop);
  }

  function loop(ts){
    if(!playing)return;
    var dt=Math.min(.05,(ts-last)/1000);last=ts;
    timeLeft-=dt;
    update(dt);draw();hud();
    if(timeLeft<=0){end();return}
    raf=requestAnimationFrame(loop);
  }

  function flash(){
    box.classList.add('hit');
    setTimeout(function(){box.classList.remove('hit')},160);
  }

  function update(dt){
    var sp=420,i,it,ty=H-34;
    if(keys.l)px-=sp*dt;
    if(keys.r)px+=sp*dt;
    px=Math.max(44,Math.min(W-44,px));
    spawnT-=dt;
    if(spawnT<=0){
      spawnT=.30+Math.random()*.2;
      var bad=Math.random()<.22;
      items.push({
        x:24+Math.random()*(W-48),y:-20,
        v:(150+Math.random()*100+(10-timeLeft)*8)*(H/400),
        e:bad?BAD:GOOD[Math.floor(Math.random()*GOOD.length)],bad:bad,s:30
      });
    }
    for(i=items.length-1;i>=0;i--){
      it=items[i];it.y+=it.v*dt;
      if(it.y+it.s*.4>=ty&&it.y<=ty+16&&Math.abs(it.x-px)<=46){
        if(it.bad){score=Math.max(0,score-2);flash()}else score++;
        items.splice(i,1);
      }else if(it.y>H+30)items.splice(i,1);
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a14';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(245,165,36,.07)';ctx.lineWidth=1;
    for(var x=0;x<W;x+=32){ctx.beginPath();ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,H);ctx.stroke()}
    for(var y=0;y<H;y+=32){ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(W,y+.5);ctx.stroke()}
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(var i=0;i<items.length;i++){
      var it=items[i];ctx.font=it.s+'px serif';ctx.fillText(it.e,it.x,it.y);
    }
    var ty=H-34;
    ctx.fillStyle='#f5a524';ctx.fillRect(px-40,ty,80,10);
    ctx.fillStyle='#c8372d';ctx.fillRect(px-40,ty+10,80,6);
    ctx.fillStyle='#fff';ctx.fillRect(px-40,ty,80,2);
  }

  function end(){
    playing=false;timeLeft=0;hud();
    var title=score>=14?'MAESTRO JAMBO':score>=8?'CHEF DE LA PLANCHA':score>=4?'AYUDANTE DE COCINA':'A CALENTAR LA PLANCHA';
    var rec='';
    if(score>best){
      best=score;rec='<p class="arc-new">¡NUEVO RÉCORD!</p>';
      try{localStorage.setItem('jambo-arcade-best',String(best))}catch(e){}
    }
    screen('<p class="arc-small">TIEMPO</p><h3>'+title+'</h3>'+
      '<p class="arc-score">'+score+' PUNTOS</p>'+rec+
      '<p class="arc-small">RÉCORD: '+best+'</p>'+
      '<div class="arc-secret"><b>MENSAJE SECRETO</b><br>Hamburguesas. Sin complicaciones.<br>Y tú, que has encontrado el secreto, ya eres de los nuestros.</div>'+
      '<div class="arc-btns"><button type="button" data-a="go">OTRA VEZ</button><button type="button" data-a="x">SALIR</button></div>');
  }

  /* Tres clics seguidos en el logo JAMBO (arriba o en el pie) */
  function isLogo(t){
    if(!t||!t.closest)return false;
    if(t.closest('.logo'))return true;
    var a=t.closest('a');
    return !!(a&&a.getAttribute('href')==='#top');
  }
  document.addEventListener('click',function(e){
    if(!isLogo(e.target))return;
    var now=Date.now();
    clicks=clicks.filter(function(x){return now-x<1200});
    clicks.push(now);
    if(clicks.length>=3){clicks=[];e.preventDefault();openArc()}
  },true);

  /* Atajo alternativo: escribir "jambo" con el teclado */
  var typed='';
  document.addEventListener('keydown',function(e){
    if(box&&box.classList.contains('show')){
      if(e.key==='Escape'){close();return}
      if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){keys.l=true;e.preventDefault()}
      if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){keys.r=true;e.preventDefault()}
      return;
    }
    if(/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;
    typed=(typed+String(e.key).toLowerCase()).slice(-5);
    if(typed==='jambo'){typed='';openArc()}
  });
  document.addEventListener('keyup',function(e){
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')keys.l=false;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')keys.r=false;
  });
})();