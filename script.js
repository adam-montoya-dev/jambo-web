(function(){
  try{
    var p=new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()),g={};
    p.forEach(function(x){g[x.type]=x.value});
    var d=g.weekday.toLowerCase().replace('.',''),h=parseInt(g.hour,10)%24;
    var closedDay=(d==='lun'||d==='mar');
    var open=!closedDay&&h>=20&&h<23;
    var s=document.getElementById('status');
    document.getElementById('statusText').textContent=open?'Abierto ahora · hasta las 23:00':(closedDay||h>=23?'Cerrado ahora · abrimos de miércoles a domingo a las 20:00':'Cerrado ahora · abrimos a las 20:00');
    if(open)s.classList.add('open');
  }catch(e){}
})();

(function(){
  var cart={},fmt=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var $=function(i){return document.getElementById(i)};
  function num(t){return parseFloat(t.replace('€','').replace(',','.'))}
  function add(name,price){var c=cart[name]||(cart[name]={price:price,q:0});c.q++;draw()}
  function draw(){
    var n=0,t=0,h='';
    Object.keys(cart).forEach(function(k){var c=cart[k];if(c.q<1){delete cart[k];return}n+=c.q;t+=c.q*c.price;
      h+='<div class="line"><span>'+k+'</span><button data-k="'+k+'" data-d="-1" aria-label="Quitar uno">−</button><b>'+c.q+'</b><button data-k="'+k+'" data-d="1" aria-label="Añadir uno">+</button><b>'+fmt(c.q*c.price)+'</b></div>'});
    $('lines').innerHTML=h||'<p>Aún no has añadido nada.</p>';
    $('tot').textContent=fmt(t);
    $('bar').classList.toggle('show',n>0);
    $('barN').textContent='Ver pedido ('+n+')';$('barT').textContent=fmt(t);
    if(!n)$('sheet').classList.remove('show');
  }
  document.querySelectorAll('.burger').forEach(function(b){
    var nm=b.querySelector('h3').firstChild.textContent.trim();
    b.querySelectorAll('.p').forEach(function(sp){
      var m=sp.classList.contains('m'),btn=document.createElement('button');
      btn.className=sp.className;btn.textContent=sp.textContent;
      var label=nm+(m?' (menú)':'');btn.setAttribute('aria-label','Añadir '+label+' '+sp.textContent);
      btn.onclick=function(){add(label,num(sp.textContent))};
      sp.replaceWith(btn);
    });
  });
  document.querySelectorAll('.row').forEach(function(r){
    var nm=r.querySelector('span').textContent.trim(),b=r.querySelector('b'),pr=num(b.textContent);
    var btn=document.createElement('button');btn.className='add';btn.textContent='+';btn.setAttribute('aria-label','Añadir '+nm);
    btn.onclick=function(){add(nm,pr)};b.appendChild(btn);
  });
  $('bar').onclick=function(){$('sheet').classList.add('show')};
  $('close').onclick=function(){$('sheet').classList.remove('show')};
  $('sheet').onclick=function(e){if(e.target===this)this.classList.remove('show')};
  document.addEventListener('keydown',function(e){if(e.key==='Escape')$('sheet').classList.remove('show')});
  $('lines').onclick=function(e){var k=e.target.getAttribute('data-k');if(k){cart[k].q+=parseInt(e.target.getAttribute('data-d'),10);draw()}};
  $('copy').onclick=function(){
    var t='Pedido Jambo:\n';Object.keys(cart).forEach(function(k){t+=cart[k].q+' x '+k+'\n'});t+='Total: '+$('tot').textContent;
    try{navigator.clipboard.writeText(t);this.textContent='Copiado'}catch(e){this.textContent='No se pudo copiar'}
  };
  /* nav activa */
  var links=document.querySelectorAll('.topbar .links a');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)})}})},{rootMargin:'-40% 0px -55% 0px'});
    ['filosofia','carta', 'experiencia', 'instalaciones', 'instagram', 'visitanos'].forEach(function(i){io.observe($(i))});
  }
  var ct=$('copyTel');
  if(ct)ct.onclick=function(){try{navigator.clipboard.writeText('643950394');ct.textContent='Copiado'}catch(e){ct.textContent='643 95 03 94'}};
  /* aparecer al hacer scroll */
  if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}})},{threshold:.15});
    document.querySelectorAll('h2,.burger,.row,.card,.note,.ph,.filo-text p, .ec, .ig, .ip').forEach(function(el){el.classList.add('reveal');ro.observe(el)});
  }
    var tb=document.getElementById('topbar');
  function onScroll(){tb.classList.toggle('solid',window.scrollY>40)}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
    window.jamboAdd=add;
  draw();
})();
