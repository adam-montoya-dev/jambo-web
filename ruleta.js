(function(){
  var modal=document.getElementById('rmodal');
  var openBtn=document.getElementById('openRl');
  var closeBtn=document.getElementById('rclose');
  var wheel=document.getElementById('wheel');
  var btn=document.getElementById('spin');
  var out=document.getElementById('rl-out');
  if(!modal||!openBtn||!wheel||!btn||!out)return;

  var burgers=[],n=0,seg=0,rot=0,busy=false,current=null,built=false;
  var dur=matchMedia('(prefers-reduced-motion: reduce)').matches?1000:4500;
  wheel.style.transition='transform '+dur+'ms cubic-bezier(.12,.7,.1,1)';

  function eur(v){return v.toFixed(2).replace('.',',')+' €'}

  function build(){
    if(built)return true;
    burgers=(window.JAMBO_ITEMS||[]).filter(function(i){return i.cat==='burgers'});
    if(!burgers.length)return false;
    n=burgers.length;seg=360/n;
    var cols=['#c8372d','#1f1d1b'],stops=[];
    burgers.forEach(function(b,i){
      stops.push(cols[i%2]+' '+(i*seg)+'deg '+((i+1)*seg)+'deg');
      var s=document.createElement('span');
      s.className='lab';s.textContent=b.name;
      s.style.setProperty('--a',(i*seg+seg/2)+'deg');
      wheel.appendChild(s);
    });
    wheel.style.background='conic-gradient('+stops.join(',')+')';
    built=true;return true;
  }

  function openR(){
    modal.classList.add('show');document.body.style.overflow='hidden';
    out.classList.remove('in');btn.textContent='¡Girar!';btn.disabled=false;
    if(!build()){
      out.innerHTML='<p class="rl-d">No encuentro las burgers de la carta. Revisa que en carta.js esté la línea window.JAMBO_ITEMS=ITEMS;</p>';
      out.classList.add('in');btn.disabled=true;
    }else{out.innerHTML=''}
  }
  function closeR(){modal.classList.remove('show');document.body.style.overflow=''}

  function finish(b){
    current=b;
    var h='<p class="rl-n">Te ha tocado</p><h3>'+b.name+'</h3>';
    if(b.desc)h+='<p class="rl-d">'+b.desc+'</p>';
    h+='<p class="rl-d"><b>Lo dice la ruleta: ¡a por ella!</b></p>';
    h+='<div class="rl-act"><button data-a="s">Me la pido · '+eur(b.price)+'</button><button class="m" data-a="m">En menú · '+eur(b.menu)+'</button></div>';
    out.innerHTML=h;out.classList.add('in');
    busy=false;btn.disabled=false;btn.textContent='Girar otra vez';
  }

  btn.onclick=function(){
    if(busy||!build())return;
    busy=true;btn.disabled=true;
    out.innerHTML='';out.classList.remove('in');
    var i=Math.floor(Math.random()*n);
    var target=360-(i*seg+seg/2);
    var cur=((rot%360)+360)%360;
    rot+=360*5+((target-cur)+360)%360;
    wheel.style.transform='rotate('+rot+'deg)';
    setTimeout(function(){finish(burgers[i])},dur+150);
  };

  out.onclick=function(e){
    var b=e.target.closest('button[data-a]');
    if(!b||!current||!window.jamboAdd)return;
    if(b.dataset.a==='s')window.jamboAdd(current.name,current.price);
    else window.jamboAdd(current.name+' (menú)',current.menu);
    b.textContent='Añadido ✓';
    setTimeout(closeR,800);
  };

  openBtn.onclick=openR;
  closeBtn.onclick=closeR;
  modal.onclick=function(e){if(e.target===modal)closeR()};
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeR()});
})();