/* Paintagruélique — click & collect (demo): cart, 15-min pickup slots, full name, order QR. Needs qr.js for the QR code. */
(function(){
var CLOSE_FROM=630,REOPEN=780; /* same-day orders paused 10:30–13:00 (lunch rush) */
function money(c,l){return new Intl.NumberFormat(l.loc,{style:"currency",currency:"EUR"}).format(c/100)}
var CAP=6; /* max orders per 15-min slot (demo: slot load is simulated, connect to real order counts) */
var D={
fr:{loc:"fr-FR",empty:"Votre panier est vide.",total:"Total (à payer au retrait)",out:"Épuisé",left:"Plus que ",full:"complet",
err:"Ajoutez au moins un produit, choisissez un créneau disponible et renseignez prénom, nom et téléphone.",
title:"Commande enregistrée",num:"N° de commande",pick:"Retrait",at:" à ",code:"Code étudiant",reuse:"✓ Boîte réutilisable",
show:"Présentez ce QR code et votre carte étudiante au comptoir, payez sur place et récupérez votre madeleine offerte.",
showGen:"Présentez votre numéro de commande au comptoir et payez sur place.",
shot:"Conseil : faites une capture d’écran de cette page.",
demo:"Maquette : cette commande n’est pas envoyée à la boulangerie.",newo:"Nouvelle commande"},
en:{loc:"en-GB",empty:"Your basket is empty.",total:"Total (pay at pickup)",out:"Sold out",left:"Only left: ",full:"full",
err:"Add at least one product, pick an available slot and enter your first name, last name and phone number.",
title:"Order saved",num:"Order no.",pick:"Pickup",at:" at ",code:"Student code",reuse:"✓ Reusable box",
show:"Show this QR code and your student ID at the counter, pay in store and collect your free madeleine.",
showGen:"Show your order number at the counter and pay in store.",
shot:"Tip: take a screenshot of this page.",
demo:"Mockup: this order is not sent to the bakery.",newo:"New order"}};
function isStudent(){return document.body.getAttribute("data-promo")==="student"}
function L(){return document.documentElement.lang==="en"?"en":"fr"}
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var items=[].slice.call(document.querySelectorAll(".prod")),byId={},qty={},last=null;
items.forEach(function(it){byId[it.dataset.id]=it});
function nameOf(it){var n=it.querySelector(".nm ."+L())||it.querySelector(".nm");return n.textContent}
function total(){var t=0;for(var k in qty)t+=qty[k];return t}
function parse(v){var p=v.split("-");return new Date(+p[0],+p[1]-1,+p[2])}
function taken(x,t){var s=x.toDateString()+t,h=0,i;for(i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%(CAP+1)}
function slots(x){var w=x.getDay();if(w===1||w===2)return[];
var now=new Date(),same=x.toDateString()===now.toDateString(),nm=now.getHours()*60+now.getMinutes();
if(same&&nm>=CLOSE_FROM&&nm<REOPEN)return[];
var end=(w===0?13.5:19.5)*60-15,out=[];
for(var m=390;m<=end;m+=15){if(same&&m<nm+30)continue;var t=("0"+Math.floor(m/60)).slice(-2)+":"+("0"+m%60).slice(-2);out.push({t:t,full:taken(x,t)>=CAP})}return out}
function open(x){return slots(x).some(function(s){return!s.full})}
function fillDays(){var sel=$("pday");if(!sel)return;var prev=sel.value,l=D[L()],d=new Date(),n=0;d.setHours(0,0,0,0);sel.innerHTML="";
for(var i=0;i<14&&n<7;i++){var x=new Date(d);x.setDate(d.getDate()+i);if(!open(x))continue;
var o=document.createElement("option");o.value=x.getFullYear()+"-"+(x.getMonth()+1)+"-"+x.getDate();o.textContent=x.toLocaleDateString(l.loc,{weekday:"long",day:"numeric",month:"long"});sel.appendChild(o);n++}
if(prev)sel.value=prev;if(!sel.value&&sel.options.length)sel.selectedIndex=0;fillTimes()}
function fillTimes(){var st=$("ptime"),sel=$("pday");if(!st||!sel)return;var prev=st.value,l=D[L()];st.innerHTML="";
if(!sel.value)return;slots(parse(sel.value)).forEach(function(s){var o=document.createElement("option");o.value=s.t;o.textContent=s.full?s.t+" ("+l.full+")":s.t;o.disabled=s.full;st.appendChild(o)});
var ok=[].slice.call(st.options).filter(function(o){return!o.disabled});
if(prev&&ok.some(function(o){return o.value===prev}))st.value=prev;else if(ok.length)st.value=ok[0].value}
function ascii(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9 .'\-]/g,"").toUpperCase()}
function qrsvg(text){try{var q=new QRLib.QRCode(-1,QRLib.EC.M);q.addData(text);q.make();var n=q.getModuleCount(),p="",r,c;
for(r=0;r<n;r++)for(c=0;c<n;c++)if(q.isDark(r,c))p+="M"+(c+4)+" "+(r+4)+"h1v1h-1z";
return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(n+8)+" "+(n+8)+'" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="'+p+'" fill="#000" shape-rendering="crispEdges"/></svg>'}catch(e){return ""}}
function showConfirm(){var c=$("confirm");if(!c||!last)return;var l=D[L()],o=last,st=isStudent();
var dt=parse(o.date).toLocaleDateString(l.loc,{weekday:"long",day:"numeric",month:"long"});
var lines=o.lines.map(function(x){return"<li>"+x.q+" × "+esc(nameOf(byId[x.id]))+"</li>"}).join("");
c.innerHTML='<div class="conf"><h3>'+l.title+'</h3>'+(st?'<div class="qr">'+o.svg+"</div>":"")+'<div class="oid">'+l.num+" "+esc(o.id)+"</div><p><b>"+esc(o.name)+"</b><br>"+l.pick+" : "+dt+l.at+o.time+"</p>"+(o.code?'<p class="s">'+l.code+" : "+esc(o.code)+"</p>":"")+"<ul>"+lines+"</ul>"+(o.sum?"<p><b>"+l.total+" : "+money(o.sum,l)+"</b></p>":"")+(o.reuse?'<p class="s">'+l.reuse+"</p>":"")+"<p>"+(st?l.show:l.showGen)+"</p>"+(st?'<p class="s">'+l.shot+"</p>":"")+'<p class="s">'+l.demo+'</p><button type="button" class="btn" id="newo" style="border:0;cursor:pointer;font:inherit;font-weight:600;margin:6px 0 0">'+l.newo+"</button></div>";
$("newo").addEventListener("click",function(){last=null;c.innerHTML="";var f=$("orderform");if(f)f.style.display="";render()})}
function render(){var l=D[L()],t=0,sum=0,box=$("cartlist");if(box)box.textContent="";
items.forEach(function(it){var id=it.dataset.id,q=qty[id]||0,s=parseInt(it.dataset.stock,10),pc=parseInt(it.dataset.price,10)||0,pe=it.querySelector(".pr");
if(pe&&pc)pe.textContent=money(pc,l);
it.querySelector(".q").textContent=q;
it.querySelector(".stk").textContent=s===0?l.out:(s<=3?l.left+s:"");
it.classList.toggle("out",s===0);
it.querySelector(".plus").disabled=s===0||q>=s;
it.querySelector(".minus").disabled=q===0;
if(q){t+=q;if(box){var d=document.createElement("div");d.textContent=q+" × "+nameOf(it)+(pc?" — "+money(q*pc,l):"");box.appendChild(d)}sum+=q*pc}});
if(sum&&box){var tt=document.createElement("div");tt.className="tot";tt.textContent=l.total+" : "+money(sum,l);box.appendChild(tt)}
if(!t&&box)box.textContent=l.empty;
var cc=$("cartcount");if(cc)cc.textContent=t;
[].slice.call(document.querySelectorAll(".cartn,#cartbadge")).forEach(function(e){e.textContent=t?"("+t+")":""});
fillDays();if(last)showConfirm()}
items.forEach(function(it){var id=it.dataset.id;
it.querySelector(".plus").addEventListener("click",function(){qty[id]=(qty[id]||0)+1;render()});
it.querySelector(".minus").addEventListener("click",function(){qty[id]=Math.max(0,(qty[id]||0)-1);render()})});
var day=$("pday");if(day)day.addEventListener("change",fillTimes);
var ob=$("order");if(ob)ob.addEventListener("click",function(){
var l=D[L()],f=$("pfirst").value.trim(),n=$("plast").value.trim(),ph=$("pphone").value.trim(),t=total(),msg=$("ordermsg"),st=$("ptime"),dv=$("pday").value;
var tm=st.options.length&&!st.options[st.selectedIndex].disabled?st.value:"";
if(!t||!f||!n||ph.length<6||!tm||!dv){if(msg)msg.textContent=l.err;return}
if(msg)msg.textContent="";
var lines=[],sum=0;items.forEach(function(it){var q=qty[it.dataset.id];if(q){lines.push({id:it.dataset.id,q:q});sum+=q*(parseInt(it.dataset.price,10)||0)}});
var id="PTG-"+Math.random().toString(36).slice(2,6).toUpperCase().padEnd(4,"X");
var pc=$("pcode"),code=pc?pc.value.trim():"",re=$("preuse");
var payload=["PTG",id,ascii(f+" "+n),dv+" "+tm,t+"X"].concat(isStudent()?["STU",ascii(code)]:[]).join("|");
last={sum:sum,id:id,name:f+" "+n,date:dv,time:tm,count:t,lines:lines,code:code,reuse:!!(re&&re.checked),svg:isStudent()?qrsvg(payload):""};
if(window.track)track("order_placed",{items:t,lang:L()});
qty={};var of=$("orderform");if(of)of.style.display="none";
render();var c=$("confirm");if(c&&c.scrollIntoView)c.scrollIntoView({behavior:"smooth",block:"start"})});
window.shopRender=render;render();
})();
