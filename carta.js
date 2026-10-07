(function(){
  var B='images/carta/';
  var E={burgers:'🍔',acomp:'🍟',bebidas:'🥤',postres:'🍰'};
  var TABS=[['burgers','Hamburguesas'],['acomp','Acompañamientos'],['bebidas','Bebidas'],['postres','Postres']];
  var G='Gluten',L='Leche',H='Huevo',M='Mostaza';
  var ITEMS=[
    {cat:'burgers',img:'cheese-burger',name:'Cheese Burger',tag:'Clásica',price:8.9,menu:11.9,desc:'Doble patty · doble cheddar · pepinillo · ketchup · mostaza',al:[G,L,M]},
    {cat:'burgers',img:'bacon-cheese',name:'Bacon Cheese',tag:'Con bacon',price:10.9,menu:13.9,desc:'Doble patty · doble cheddar · doble bacon · pepinillo · ketchup · mostaza',al:[G,L,M]},
    {cat:'burgers',img:'oklahoma',name:'Oklahoma',tag:'Signature',price:10.9,menu:13.9,desc:'Doble patty · doble cheddar · cebolla · salsa Jambo',al:[G,L,H,M]},
    {cat:'burgers',img:'jambo',name:'Jambo',tag:'La firma de la casa',price:11.9,menu:14.9,desc:'Doble patty · doble cheddar · pepinillos · lechuga · tomate · cebolla encurtida · salsa Jambo',al:[G,L,H,M]},
    {cat:'burgers',img:'vegetal',name:'Vegetal',tag:'Plant-based',price:11.9,menu:14.9,desc:'Beyond Burger® · cheddar · lechuga · tomate · cebolla encurtida · pepinillos · salsa Jambo',al:[G,L,M]},
    {cat:'burgers',img:'kids',name:'Kids',tag:'Menú infantil',price:7.9,menu:10.9,desc:'Patty · cheddar · ketchup',al:[G,L,M]},

    {cat:'acomp',g:'Sides',img:'patatas-fritas',name:'Patatas fritas',price:2.9,desc:'Las de toda la vida.'},
    {cat:'acomp',g:'Sides',img:'box-patatas',name:'Box de patatas',price:4.9,desc:'Para compartir.'},
    {cat:'acomp',g:'Sides',img:'patatas-trufadas',name:'Patatas trufadas',price:5.9,desc:'Con salsa trufada.'},
    {cat:'acomp',g:'Sides',img:'patatas-huevo-chorizo',name:'Patatas huevo frito + chorizo',price:6.9,desc:'Con salsa de huevo frito y chorizo.'},
    {cat:'acomp',g:'Sides',img:'cogollos',name:'Cogollos grill',price:4.9,desc:'Con salsa césar y parmesano.'},
    {cat:'acomp',g:'Sides',img:'costillas-maiz',name:'Costillas de maíz',price:4.9,desc:'Con salsa a elegir.'},
    {cat:'acomp',g:'Salsas',name:'Jambo',price:1.5},
    {cat:'acomp',g:'Salsas',name:'César',price:1.5},
    {cat:'acomp',g:'Salsas',name:'Chipotle',price:1.5},
    {cat:'acomp',g:'Salsas',name:'Trufada',price:1.5},
    {cat:'acomp',g:'Salsas',name:'Huevo frito',price:1.5},
    {cat:'acomp',g:'Salsas',name:'Sobre ketchup / mostaza / mayo',price:0.15},

    {cat:'bebidas',img:'refrescos-cervezas',name:'Refrescos 33 cl / Cervezas 33 cl',price:1.8},
    {cat:'bebidas',img:'monster-25',name:'Monster 25 cl',price:1.8},
    {cat:'bebidas',img:'refrescos-50',name:'Refrescos 50 cl',price:2.2},
    {cat:'bebidas',img:'monster-50',name:'Monster 50 cl',price:2.5},
    {cat:'bebidas',img:'agua',name:'Agua 50 cl',price:1.2},

    {cat:'postres',img:'tarta-queso',name:'Tarta de queso',price:3.9,desc:'Con frutos rojos.'},
    {cat:'postres',img:'nutella',name:'Cremoso de Nutella',price:3.9,desc:'Con almendra.'},
    {cat:'postres',img:'brownie',name:'Brownie',price:4.9,desc:'Con caramelo salado.'}
  ];

  var tabs=document.getElementById('tabs'),grid=document.getElementById('grid');
  if(!tabs||!grid)return;
  function eur(n){return n.toFixed(2).replace('.',',')+' €'}
  function btn(n,p,txt,cls){return '<button'+(cls?' class="'+cls+'"':'')+' data-n="'+n+'" data-p="'+p+'">'+txt+'</button>'}

  function card(i){
    var h='<article class="cc'+(i.img?'':' mini')+'">';
    if(i.img){
      h+='<div class="ci" data-e="'+E[i.cat]+'"><img src="'+B+i.img+'.jpg" alt="'+i.name+'" loading="lazy" onerror="this.parentNode.classList.add(\'noimg\');this.remove()">'+(i.tag?'<span class="tag">'+i.tag+'</span>':'')+'</div>';
    }
    h+='<div class="cb"><div class="ct"><h3>'+i.name+'</h3><span class="cp">'+eur(i.price)+'</span></div>';
    if(i.desc)h+='<p>'+i.desc+'</p>';
    if(i.al)h+='<div class="chips">'+i.al.map(function(a){return '<span>'+a+'</span>'}).join('')+'</div>';
    h+='<div class="ca">';
    if(i.menu){h+=btn(i.name,i.price,'+ Solo')+btn(i.name+' (menú)',i.menu,'+ Menú · '+eur(i.menu),'m')}
    else h+=btn(i.name,i.price,'+ Añadir');
    return h+'</div></div></article>';
  }

  function show(cat){
    var h='',last='';
    ITEMS.filter(function(i){return i.cat===cat}).forEach(function(i){
      if(i.g&&i.g!==last){h+='<h3 class="cg">'+i.g+'</h3>';last=i.g}
      h+=card(i);
    });
    grid.innerHTML=h;
    tabs.querySelectorAll('button').forEach(function(b){var on=b.dataset.c===cat;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  }

  tabs.innerHTML=TABS.map(function(t){return '<button role="tab" data-c="'+t[0]+'">'+t[1]+'</button>'}).join('');
  tabs.onclick=function(e){var b=e.target.closest('button[data-c]');if(b)show(b.dataset.c)};
  grid.onclick=function(e){
    var b=e.target.closest('button[data-n]');
    if(!b||!window.jamboAdd)return;
    window.jamboAdd(b.dataset.n,parseFloat(b.dataset.p));
    var t=b.textContent;b.textContent='Añadido ✓';setTimeout(function(){b.textContent=t},900);
  };
  show('burgers');
})();