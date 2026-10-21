/* Pedidos para recoger: el cliente envía el pedido y le llega a Jambo en tiempo real (Firebase) */
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,collection,addDoc,doc,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';

if(!firebaseConfig||!firebaseConfig.projectId||/^PEGA/.test(firebaseConfig.projectId)){
  console.warn('Pedidos desactivados: falta rellenar firebase-config.js');
}else{
  init();
}

function init(){
  var db=getFirestore(initializeApp(firebaseConfig));
  var KEY='jambo-pedido';
  var TEL='+34643950394',TELTXT='643 95 03 94';
  var DEF={abierto:true,base:15,porUnidad:3,extra:0,ultimoPedido:'22:45',ultimaRecogida:'23:00'};
  var cfg=Object.assign({},DEF);
  var mode='form',unsub=null,last=null,savedId=null,chip=null;

  /* Notificaciones del pedido (funcionan mientras el navegador mantenga la página viva) */
  var swReg=null,prevEstado=null;
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').then(function(r){swReg=r}).catch(function(){});
  }
  function notify(title,body){
    try{
      if(!('Notification' in window)||Notification.permission!=='granted'||!swReg)return;
      swReg.showNotification(title,{body:body,tag:'jambo-pedido',renotify:true,vibrate:[200,100,200]});
    }catch(e){}
  }

  var CSS=`
.pd{position:fixed;inset:0;z-index:1500;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.7)}
.pd.show{display:flex}
.pd-box{background:#1b1a18;color:#f3efe9;width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:18px 18px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));font-family:Archivo,system-ui,sans-serif;position:relative}
@media(min-width:600px){.pd{align-items:center}.pd-box{border-radius:18px}}
.pd-box h3{font-family:"Bebas Neue",Impact,sans-serif;font-weight:400;font-size:2.2rem;line-height:1;margin:0 0 12px;text-transform:uppercase}
.pd-x{position:absolute;top:10px;right:12px;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:1.5rem;cursor:pointer}
.pd-lines{list-style:none;margin:0 0 10px;padding:0}
.pd-lines li{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.12)}
.pd-total{display:flex;justify-content:space-between;font-size:1.2rem;font-weight:700;padding:8px 0}
.pd-note{margin:6px 0 14px;color:#d9d4cc;font-size:.92rem}
.pd-box label{display:block;font-size:.85rem;color:#b9b3aa;margin:12px 0 4px}
.pd-box input[type=text],.pd-box input[type=tel],.pd-box select,.pd-box textarea{width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:#262421;color:#fff;font:inherit}
.pd-box textarea{min-height:70px;resize:vertical}
.pd-opt{display:flex;align-items:center;gap:10px;margin:8px 0;color:#f3efe9;font-size:1rem}
.pd-opt input{width:20px;height:20px;accent-color:#c8372d}
.pd-chk{display:flex !important;gap:10px;align-items:flex-start;color:#d9d4cc !important;margin-top:14px !important}
.pd-chk input{margin-top:3px;width:18px;height:18px;accent-color:#c8372d}
.pd-hp{position:absolute;left:-9999px;opacity:0}
.pd-err{color:#ff8a80;min-height:1.2em;margin:10px 0 0;font-size:.92rem}
.pd-btn{font-family:Oswald,"Arial Narrow",sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:1rem;padding:14px 22px;border-radius:999px;border:2px solid #fff;background:transparent;color:#fff;cursor:pointer;margin:6px 6px 0 0;text-decoration:none;display:inline-block}
.pd-btn.main{background:#c8372d;border-color:#c8372d}
.pd-btn:disabled{opacity:.6}
.pd-st{text-align:center;padding:10px 0}
.pd-st .big{font-size:3rem;margin:0}
.pd-st h3{margin-top:6px}
.pd-st p{color:#d9d4cc;margin:6px 0}
.pd-st .eta{font-family:"Bebas Neue",Impact,sans-serif;font-size:3.4rem;color:#f5a524;line-height:1}
.pd-chip{position:fixed;left:12px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:35;display:none;padding:12px 18px;border-radius:999px;border:2px solid #f5a524;background:#161514;color:#fff;font:600 .9rem Archivo,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4)}
.pd-chip.show{display:block}
`;
  var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);

  var modal=document.createElement('div');modal.className='pd';
  modal.innerHTML='<div class="pd-box" role="dialog" aria-modal="true" aria-label="Pedido para recoger"><button class="pd-x" type="button" aria-label="Cerrar" data-a="x">×</button><div id="pd-body"></div></div>';
  document.body.appendChild(modal);
  var body=modal.querySelector('#pd-body');

  /* ---------- utilidades ---------- */
  function pad(n){return (n<10?'0':'')+n}
  function mad(){var d=new Date(new Date().toLocaleString('en-US',{timeZone:'Europe/Madrid'}));return {day:d.getDay(),min:d.getHours()*60+d.getMinutes()}}
  function toMin(s){var p=String(s).split(':');return (+p[0])*60+(+p[1]||0)}
  function fmt(m){m=((m%1440)+1440)%1440;return pad(Math.floor(m/60))+':'+pad(m%60)}
  function eur(n){return Number(n).toFixed(2).replace('.',',')+' €'}
  function up(m,s){return Math.ceil(m/s)*s}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  function openState(){
    var t=mad();
    if(!cfg.abierto)return {ok:false,why:'off',t:t};
        var test=false;try{test=localStorage.getItem('jambo-test')==='1'}catch(e){}
    if(test)return {ok:true,t:t};
    if([3,4,5,6,0].indexOf(t.day)<0||t.min<1200||t.min>toMin(cfg.ultimoPedido))return {ok:false,why:'hours',t:t};
    return {ok:true,t:t};
  }

  function cartData(){
    var c=(window.jamboGetCart&&window.jamboGetCart())||{},items=[],total=0,burgers=0;
    var bn=(window.JAMBO_ITEMS||[]).filter(function(i){return i.cat==='burgers'}).map(function(i){return i.name});
    Object.keys(c).forEach(function(k){
      var x=c[k];
      if(x&&x.q>0){
        items.push({n:k,q:x.q,p:x.price});
        total+=x.q*x.price;
        if(bn.indexOf(k.replace(' (menú)',''))>-1)burgers+=x.q;
      }
    });
    return {items:items,total:Math.round(total*100)/100,burgers:burgers};
  }
  function etaOf(b){return up(Number(cfg.base)+Number(cfg.porUnidad)*b+Number(cfg.extra),5)}

  /* ---------- ajustes del local en directo ---------- */
  onSnapshot(doc(db,'config','local'),function(s){
    cfg=Object.assign({},DEF,s.exists()?s.data():{});
    if(modal.classList.contains('show')&&mode==='form')render();
  },function(){});

  /* ---------- botón dentro del pedido ---------- */
  var sheetPanel=document.querySelector('#sheet .panel');
  if(sheetPanel){
    var go=document.createElement('button');
    go.type='button';go.className='btn main';go.id='ped-go';go.textContent='Hacer pedido para recoger';
    var first=sheetPanel.querySelector('a.btn');
    if(first)sheetPanel.insertBefore(go,first);else sheetPanel.appendChild(go);
    go.onclick=function(){mode='form';render();modal.classList.add('show')};
  }

  function closeModal(){modal.classList.remove('show')}

  /* ---------- formulario ---------- */
  function render(){
    if(mode==='status'){renderStatus();return}
    var cd=cartData(),os=openState();
    if(!cd.items.length){
      body.innerHTML='<h3>Pedido para recoger</h3><p class="pd-note">Tu pedido está vacío. Añade algo de la carta primero.</p><button class="pd-btn" data-a="x">Cerrar</button>';
      return;
    }
    if(!os.ok){
      var why=os.why==='off'
        ?'Ahora mismo no estamos aceptando pedidos online.'
        :'Los pedidos online se aceptan de miércoles a domingo, de 20:00 a '+cfg.ultimoPedido+'.';
      body.innerHTML='<h3>Pedido para recoger</h3><p class="pd-note">'+why+'<br>Puedes llamarnos al <a style="color:#f5a524" href="tel:'+TEL+'">'+TELTXT+'</a>.</p><button class="pd-btn" data-a="x">Cerrar</button>';
      return;
    }
    var eta=etaOf(cd.burgers),t=os.t;
    var firstSlot=up(t.min+eta,10),lastSlot=toMin(cfg.ultimaRecogida),slots=[];
    for(var m=firstSlot;m<=lastSlot;m+=10)slots.push(m);

    var h='<h3>Pedido para recoger</h3><ul class="pd-lines">';
    cd.items.forEach(function(i){h+='<li><span>'+i.q+' × '+esc(i.n)+'</span><b>'+eur(i.q*i.p)+'</b></li>'});
    h+='</ul><div class="pd-total"><span>Total</span><span>'+eur(cd.total)+'</span></div>';
    h+='<p class="pd-note">Pagas al recoger en el local. Los precios finales son los de caja.</p>';
    h+='<label for="pd-n">Tu nombre</label><input id="pd-n" type="text" maxlength="40" autocomplete="given-name">';
    h+='<label for="pd-t">Teléfono (por si tenemos que avisarte)</label><input id="pd-t" type="tel" inputmode="tel" maxlength="16" autocomplete="tel">';
    h+='<label>¿Cuándo vienes a recogerlo?</label>';
    h+='<div class="pd-opt"><input type="radio" name="pd-m" id="pd-m1" value="ya" checked><label for="pd-m1" style="margin:0;color:inherit;font-size:1rem">Lo antes posible (listo sobre las '+fmt(t.min+eta)+')</label></div>';
    if(slots.length){
      h+='<div class="pd-opt"><input type="radio" name="pd-m" id="pd-m2" value="hora"><label for="pd-m2" style="margin:0;color:inherit;font-size:1rem">A una hora concreta</label></div>';
      h+='<select id="pd-h" aria-label="Hora de recogida">'+slots.map(function(m){return '<option value="'+fmt(m)+'">'+fmt(m)+'</option>'}).join('')+'</select>';
    }
    h+='<label for="pd-o">Alergias o notas (opcional)</label><textarea id="pd-o" maxlength="300" placeholder="Ej.: soy celíaco, sin pepinillo…"></textarea>';
    h+='<input class="pd-hp" id="pd-hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">';
    h+='<label class="pd-chk"><input type="checkbox" id="pd-ok"><span>Acepto que Jambo trate mi nombre, mi teléfono y, si los escribo, mis datos sobre alergias solo para preparar este pedido. Más información en la <a href="legal.html#privacidad" target="_blank" rel="noopener" style="color:#f5a524">política de privacidad</a>.</span></label>';
    h+='<p class="pd-note">🔔 Al enviar, tu navegador te preguntará si quieres recibir avisos cuando el pedido esté confirmado y listo.</p>';
    h+='<p class="pd-err" id="pd-err" role="alert"></p>';
    h+='<button class="pd-btn main" type="button" data-a="send" id="pd-send">Enviar pedido a Jambo</button><button class="pd-btn" type="button" data-a="x">Volver</button>';
    body.innerHTML=h;
    body._eta=eta;body._burgers=cd.burgers;
  }

  function fail(msg){var e=body.querySelector('#pd-err');if(e)e.textContent=msg}

  async function send(){
    var os=openState();
    if(!os.ok){render();return}
    var cd=cartData();
    if(!cd.items.length){render();return}
    var nombre=body.querySelector('#pd-n').value.trim();
    var tel=body.querySelector('#pd-t').value.replace(/[\s.-]/g,'');
    var notas=body.querySelector('#pd-o').value.trim();
    var modo=(body.querySelector('input[name="pd-m"]:checked')||{}).value||'ya';
    var hora=modo==='hora'?body.querySelector('#pd-h').value:'';
    if(body.querySelector('#pd-hp').value)return;
    if(nombre.length<1)return fail('Escribe tu nombre.');
    if(!/^\+?\d{9,15}$/.test(tel))return fail('Escribe un teléfono válido (9 cifras).');
    if(!body.querySelector('#pd-ok').checked)return fail('Tienes que aceptar el uso de tus datos para enviar el pedido.');
    var btn=body.querySelector('#pd-send');btn.disabled=true;btn.textContent='Enviando…';
    if('Notification' in window&&Notification.permission==='default'){
      try{await Notification.requestPermission()}catch(e){}
    }
    try{
      var ref=await addDoc(collection(db,'pedidos'),{
        nombre:nombre,telefono:tel,modo:modo,hora:hora,notas:notas,
        items:cd.items,total:cd.total,etaSug:etaOf(cd.burgers),
        estado:'nuevo',creado:serverTimestamp()
      });
      try{localStorage.setItem(KEY,ref.id)}catch(e){}
      if(window.jamboClear)window.jamboClear();
      watch(ref.id);
      mode='status';render();
    }catch(err){
      console.error(err);
      btn.disabled=false;btn.textContent='Enviar pedido a Jambo';
      fail('No se pudo enviar. Inténtalo otra vez o llámanos al '+TELTXT+'.');
    }
  }

  /* ---------- seguimiento del pedido ---------- */
  function shortId(){return savedId?savedId.slice(-4).toUpperCase():''}
  function clearSaved(){
    try{localStorage.removeItem(KEY)}catch(e){}
    if(unsub){unsub();unsub=null}
    savedId=null;last=null;
    if(chip)chip.classList.remove('show');
  }
  function chipText(d){
    var s=d.estado;
    if(s==='nuevo')return 'Mi pedido #'+shortId()+' · esperando confirmación';
    if(s==='aceptado')return 'Mi pedido #'+shortId()+' · listo sobre las '+(d.listoA||'—');
    if(s==='listo')return 'Mi pedido #'+shortId()+' · ¡listo para recoger!';
    if(s==='rechazado')return 'Mi pedido #'+shortId()+' · no aceptado';
    return 'Mi pedido #'+shortId();
  }
  function watch(id){
    if(unsub){unsub();unsub=null}
    savedId=id;prevEstado=null;
    if(!chip){
      chip=document.createElement('button');chip.type='button';chip.className='pd-chip';
      chip.onclick=function(){mode='status';render();modal.classList.add('show')};
      document.body.appendChild(chip);
    }
    unsub=onSnapshot(doc(db,'pedidos',id),function(s){
      if(!s.exists()){clearSaved();if(mode==='status'&&modal.classList.contains('show'))closeModal();return}
      last=s.data();
      var est=last.estado;
      if(prevEstado!==null&&prevEstado!==est&&(document.hidden||!modal.classList.contains('show'))){
        if(est==='aceptado')notify('Pedido confirmado ✅','Estará listo sobre las '+(last.listoA||'—'));
        else if(est==='listo')notify('¡Tu pedido está listo! 🍔','Puedes venir a recogerlo.');
        else if(est==='rechazado')notify('Jambo no ha podido aceptar tu pedido','Llámanos al '+TELTXT);
      }
      prevEstado=est;
      if(last.estado==='entregado'&&!modal.classList.contains('show')){clearSaved();return}
      chip.textContent=chipText(last);chip.classList.add('show');
      if(mode==='status'&&modal.classList.contains('show'))renderStatus();
    },function(){clearSaved()});
  }
  function renderStatus(){
    var d=last;
    if(!d){body.innerHTML='<div class="pd-st"><p>Cargando tu pedido…</p></div>';return}
    var h='<div class="pd-st">',s=d.estado,id='#'+shortId();
    if(s==='nuevo'){
      h+='<p class="big">⏳</p><h3>Pedido '+id+' enviado</h3><p>Esperando a que Jambo lo confirme…</p><p>Mantén esta página abierta y te avisaremos cuando cambie.</p><p>Si tarda mucho, llámanos al <a style="color:#f5a524" href="tel:'+TEL+'">'+TELTXT+'</a>.</p>';
    }else if(s==='aceptado'){
      h+='<p class="big">✅</p><h3>Pedido '+id+' confirmado</h3><p>Estará listo sobre las</p><p class="eta">'+esc(d.listoA||'—')+'</p><p>Te avisaremos aquí cuando esté listo.</p>';
    }else if(s==='listo'){
      h+='<p class="big">🍔</p><h3>¡Tu pedido está listo!</h3><p>Puedes venir a recogerlo. Pedido '+id+' a nombre de '+esc(d.nombre)+'.</p>';
    }else if(s==='entregado'){
      h+='<p class="big">🙌</p><h3>¡Gracias!</h3><p>Que aproveche.</p>';
    }else if(s==='rechazado'){
      h+='<p class="big">❌</p><h3>No hemos podido aceptarlo</h3>'+(d.motivo?'<p>'+esc(d.motivo)+'</p>':'')+'<p>Llámanos al <a style="color:#f5a524" href="tel:'+TEL+'">'+TELTXT+'</a>.</p>';
    }
    var fin=(s==='entregado'||s==='rechazado');
    h+='<button class="pd-btn'+(fin?' main':'')+'" type="button" data-a="'+(fin?'fin':'x')+'">'+(fin?'Cerrar':'Seguir viendo la web')+'</button></div>';
    body.innerHTML=h;
  }

  /* ---------- eventos ---------- */
  modal.onclick=function(e){
    if(e.target===modal){closeModal();return}
    var b=e.target.closest('[data-a]');if(!b)return;
    var a=b.dataset.a;
    if(a==='x')closeModal();
    else if(a==='send')send();
    else if(a==='fin'){clearSaved();closeModal()}
  };
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});

  /* Si había un pedido en curso, lo recuperamos */
  try{var old=localStorage.getItem(KEY);if(old)watch(old)}catch(e){}
}
