(function(){
  var box=document.getElementById('quiz');
  var m=document.getElementById('qmodal');
  var openBtn=document.getElementById('openQuiz');
  var closeBtn=document.getElementById('qclose');
  if(!box||!m||!openBtn)return;

  var token=0;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Frases divertidas: cámbialas por las que quieras */
  var JOKES={
    'Cheese Burger':'Clásica, sin dramas y sin giros de guion. Como debe ser.',
    'Bacon Cheese':'Hoy tu dieta mira hacia otro lado. Y hace bien.',
    'Oklahoma':'Cebolla, queso y cero remordimientos. ¡Yeehaw!',
    'Jambo':'La burger de la casa lleva nuestro nombre. Algo tendrá.',
    'Vegetal':'Las plantas también merecen una burger con carácter.',
    'Kids':'Para peques con hambre y opiniones firmes.'
  };

  function eur(n){return n.toFixed(2).replace('.',',')+' €'}
  function find(name){
    return (window.JAMBO_ITEMS||[]).filter(function(i){return i.cat==='burgers'&&i.name===name})[0];
  }
  function show(){box.classList.remove('in');void box.offsetWidth;box.classList.add('in')}
  function openQ(){m.classList.add('show');document.body.style.overflow='hidden';start()}
  function closeQ(){token++;m.classList.remove('show');document.body.style.overflow=''}

  function ask(n,title,opts){
    token++;
    box.innerHTML='<p class="qz-n">Pregunta '+n+' de 3</p><h3>'+title+'</h3><div class="qz-opts">'+
      opts.map(function(o,i){return '<button data-i="'+i+'">'+o[0]+'</button>'}).join('')+'</div>';
    box.onclick=function(e){var b=e.target.closest('button[data-i]');if(b)opts[b.dataset.i][1]()};
    show();
  }

  function confetti(){
    if(reduce)return '';
    var cols=['#f5a524','#c8372d','#ffffff'],h='<div class="qz-cf" aria-hidden="true">';
    for(var i=0;i<18;i++){
      h+='<i style="left:'+Math.round(Math.random()*100)+'%;background:'+cols[i%3]+
         ';animation-delay:'+(Math.random()*.7).toFixed(2)+'s;animation-duration:'+(1.5+Math.random()*1.2).toFixed(2)+'s"></i>';
    }
    return h+'</div>';
  }

  function reveal(name,it){
    var h=confetti();
    h+='<p class="qz-n">Tu burger perfecta es</p>';
    if(it.img)h+='<div class="qz-ph"><img src="images/carta/'+it.img+'.jpg" alt="'+name+'" onerror="this.parentNode.remove()"></div>';
    h+='<h3 class="qz-res">'+name+'</h3>';
    if(JOKES[name])h+='<p class="qz-joke">'+JOKES[name]+'</p>';
    if(it.desc)h+='<p class="qz-d">'+it.desc+'</p>';
    if(it.price)h+='<div class="qz-act"><button data-a="s">+ Solo · '+eur(it.price)+'</button><button class="m" data-a="m">+ Menú · '+eur(it.menu)+'</button></div>';
    h+='<button class="qz-re" data-a="r">Volver a empezar</button>';
    box.innerHTML=h;
    box.onclick=function(e){
      var b=e.target.closest('button[data-a]');if(!b)return;
      var a=b.dataset.a;
      if(a==='r'){start();return}
      if(!window.jamboAdd)return;
      if(a==='s')window.jamboAdd(name,it.price);
      if(a==='m')window.jamboAdd(name+' (menú)',it.menu);
      b.textContent='Añadido ✓';
      setTimeout(closeQ,800);
    };
    show();
  }

  function result(name){
    var my=++token;
    var it=find(name)||{name:name};
    box.onclick=null;
    box.innerHTML='<p class="qz-n">Analizando tus respuestas…</p><div class="qz-think" aria-hidden="true"><span></span><span></span><span></span></div>';
    show();
    setTimeout(function(){if(my===token)reveal(name,it)},reduce?200:1400);
  }

  function q3(){
    ask(3,'¿Qué te apetece?',[
      ['Lo clásico de siempre',function(){result('Cheese Burger')}],
      ['Con bacon',function(){result('Bacon Cheese')}],
      ['Con cebolla y salsa Jambo',function(){result('Oklahoma')}],
      ['La más completa',function(){result('Jambo')}]
    ]);
  }
  function q2(){
    ask(2,'¿Comes carne?',[
      ['Sí, claro',q3],
      ['No, prefiero vegetal',function(){result('Vegetal')}]
    ]);
  }
  function start(){
    ask(1,'¿Para quién es?',[
      ['Para mí',q2],
      ['Para un peque',function(){result('Kids')}]
    ]);
  }

  openBtn.onclick=openQ;
  if(closeBtn)closeBtn.onclick=closeQ;
  m.onclick=function(e){if(e.target===m)closeQ()};
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeQ()});
})();