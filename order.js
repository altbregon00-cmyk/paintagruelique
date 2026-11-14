/* Paintagruélique — click & collect (demo): cart, student formula, pickup slots, name match at the till.
   No QR code, no online payment. At pickup the student shows a student ID and the name on the order. */
(function(){
var ENDPOINT="";   /* Optional: paste a Google Apps Script web-app URL to receive each order as a row in a Google Sheet. Empty = demo only. */
var CUTOFF=630;    /* Same-day orders close at 10:30 (rush hour). 630 = 10:30 in minutes. */
var PRICE=8;       /* Student formula price in euros (to confirm with the owners). */
var SAV={curry:{fr:"Sandwich poulet-curry",en:"Chicken curry sandwich"},thon:{fr:"Viennoise thon",en:"Tuna viennoise"},focaccia:{fr:"Focaccia",en:"Focaccia"}};
var DRK={cafe:{fr:"Café américain",en:"Americano coffee"},orange:{fr:"Jus d’orange",en:"Orange juice"},pomme:{fr:"Jus de pomme",en:"Apple juice"}};
var D={
fr:{loc:"fr-FR",empty:"Votre panier est vide.",out:"Épuisé",left:"Plus que ",
err:"Ajoutez la formule ou au moins un produit, et renseignez prénom, nom et téléphone.",
errF:"Choisis un salé et une boisson pour ta formule.",added:"Formule ajoutée à ta commande.",
title:"Commande enregistrée",pick:"Retrait",at:" à ",formula:"Formule PANTA",incl:"madeleine au citron",rm:"Retirer",
show:"En caisse, montrez votre carte étudiante et donnez le nom de la commande. Paiement sur place.",
demo:"Maquette : cette commande n’est pas envoyée à la boulangerie.",newo:"Nouvelle commande"},
en:{loc:"en-GB",empty:"Your basket is empty.",out:"Sold out",left:"Only left: ",
err:"Add the formula or at least one product, and enter your first name, last name and phone number.",
errF:"Choose a savoury item and a drink for your formula.",added:"Formula added to your order.",
title:"Order saved",pick:"Pickup",at:" at ",formula:"PANTA formula",incl:"lemon madeleine",rm:"Remove",
show:"At the till, show your student ID and give the name on the order. Pay in store.",
demo:"Mockup: this order is not sent to the bakery.",newo:"New order"}};
function L(){return document.documentElement.lang==="en"?"en":"fr"}
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var items=[].slice.call(document.querySelectorAll(".prod")),byId={},qty={},last=null,F=null;
items.forEach(function(it){byId[it.dataset.id]=it});
function nameOf(it){var n=it.querySelector(".nm ."+L())||it.querySelector(".nm");return n.textContent}
function fname(f){var l=D[L()];return l.formula+" : "+SAV[f.sav][L()]+" + "+DRK[f.drk][L()]+" + "+l.incl+" — "+PRICE+" €"}
function total(){var t=F?1:0;for(var k in qty)t+=qty[k];return t}
function parse(v){var p=v.split("-");return new Date(+p[0],+p[1]-1,+p[2])}
function slots(x){var w=x.getDay();if(w===1||w===2)return[];
var end=(w===0?13.5:19.5)*60-30,out=[],now=new Date(),same=x.toDateString()===now.toDateString(),nowM=now.getHours()*60+now.getMinutes();
if(same&&nowM>=CUTOFF)return[];
for(var m=390;m<=end;m+=30){if(same&&m<nowM+30)continue;out.push(("0"+Math.floor(m/60)).slice(-2)+":"+("0"+m%60).slice(-2))}return out}
function fillDays(){var sel=$("pday");if(!sel)return;var prev=sel.value,l=D[L()],d=new Date(),n=0;d.setHours(0,0,0,0);sel.innerHTML="";
for(var i=0;i<14&&n<7;i++){var x=new Date(d);x.setDate(d.getDate()+i);if(!slots(x).length)continue;
var o=document.createElement("option");o.value=x.getFullYear()+"-"+(x.getMonth()+1)+"-"+x.getDate();o.textContent=x.toLocaleDateString(l.loc,{weekday:"long",day:"numeric",month:"long"});sel.appendChild(o);n++}
if(prev)sel.value=prev;if(!sel.value&&sel.options.length)sel.selectedIndex=0;fillTimes()}
function fillTimes(){var st=$("ptime"),sel=$("pday");if(!st||!sel)return;var prev=st.value;st.innerHTML="";
if(!sel.value)return;slots(parse(sel.value)).forEach(function(t){var o=document.createElement("option");o.value=t;o.textContent=t;st.appendChild(o)});if(prev)st.value=prev}
function utm(){var o={};try{var p=new URLSearchParams(location.search);["utm_source","utm_medium","utm_campaign"].forEach(function(k){if(p.get(k))o[k]=p.get(k)})}catch(e){}return o}
function syncSel(){[].slice.call(document.querySelectorAll(".opt")).forEach(function(o){var i=o.querySelector("input");o.classList.toggle("sel",!!(i&&i.checked))})}
function checked(n){var r=document.querySelector('input[name="'+n+'"]:checked');return r?r.value:null}
function showConfirm(){var c=$("confirm");if(!c||!last)return;var l=D[L()],o=last;
var dt=parse(o.date).toLocaleDateString(l.loc,{weekday:"long",day:"numeric",month:"long"});
var lines=(o.formula?"<li>1 × "+esc(fname(o.formula))+"</li>":"")+o.lines.map(function(x){return"<li>"+x.q+" × "+esc(nameOf(byId[x.id]))+"</li>"}).join("");
c.innerHTML='<div class="conf"><h3>'+l.title+'</h3><p><b>'+esc(o.name)+"</b><br>"+l.pick+" : "+dt+l.at+o.time+"</p><ul>"+lines+"</ul><p><b>"+l.show+"</b></p>"+(ENDPOINT?"":'<p class="s">'+l.demo+"</p>")+'<button type="button" class="btn" id="newo" style="border:0;cursor:pointer;font:inherit;font-weight:600;margin:6px 0 0">'+l.newo+"</button></div>";
$("newo").addEventListener("click",function(){last=null;c.innerHTML="";var f=$("orderform");if(f)f.style.display="";render()})}
function render(){var l=D[L()],t=0,box=$("cartlist");if(box)box.textContent="";
if(F){t+=1;if(box){var fd=document.createElement("div");fd.textContent="1 × "+fname(F)+" ";var rb=document.createElement("button");rb.type="button";rb.textContent=l.rm;rb.style.cssText="margin-left:6px;font:inherit;font-size:.8rem;background:transparent;border:1px solid currentColor;border-radius:4px;color:inherit;cursor:pointer;padding:2px 8px";rb.addEventListener("click",function(){F=null;render()});fd.appendChild(rb);box.appendChild(fd)}}
items.forEach(function(it){var id=it.dataset.id,q=qty[id]||0,s=parseInt(it.dataset.stock,10);
it.querySelector(".q").textContent=q;
it.querySelector(".stk").textContent=s===0?l.out:(s<=3?l.left+s:"");
it.classList.toggle("out",s===0);
it.querySelector(".plus").disabled=s===0||q>=s;
it.querySelector(".minus").disabled=q===0;
if(q){t+=q;if(box){var d=document.createElement("div");d.textContent=q+" × "+nameOf(it);box.appendChild(d)}}});
if(!t&&box)box.textContent=l.empty;
var cc=$("cartcount");if(cc)cc.textContent=t;
[].slice.call(document.querySelectorAll(".cartn,#cartbadge")).forEach(function(e){e.textContent=t?"("+t+")":""});
fillDays();if(last)showConfirm()}
items.forEach(function(it){var id=it.dataset.id;
it.querySelector(".plus").addEventListener("click",function(){qty[id]=(qty[id]||0)+1;render()});
it.querySelector(".minus").addEventListener("click",function(){qty[id]=Math.max(0,(qty[id]||0)-1);render()})});
[].slice.call(document.querySelectorAll(".opt input")).forEach(function(i){i.addEventListener("change",syncSel)});
var fadd=$("fadd");if(fadd)fadd.addEventListener("click",function(){var l=D[L()],m=$("fmsg"),s=checked("fsav"),d=checked("fdrk");
if(!s||!d){if(m)m.textContent=l.errF;return}
F={sav:s,drk:d};if(m)m.textContent=l.added;if(window.track)track("formula_added",{savory:s,drink:d,lang:L()});render()});
var day=$("pday");if(day)day.addEventListener("change",fillTimes);
var dn=document.querySelector("#commande .note");if(dn&&ENDPOINT)dn.style.display="none";
var ob=$("order");if(ob)ob.addEventListener("click",function(){
var l=D[L()],f=$("pfirst").value.trim(),n=$("plast").value.trim(),ph=$("pphone").value.trim(),t=total(),msg=$("ordermsg"),tm=$("ptime").value,dv=$("pday").value;
if(!t||!f||!n||ph.length<6||!tm||!dv){if(msg)msg.textContent=l.err;return}
if(msg)msg.textContent="";
var lines=[];items.forEach(function(it){if(qty[it.dataset.id])lines.push({id:it.dataset.id,q:qty[it.dataset.id]})});
var id="PTG-"+Math.random().toString(36).slice(2,6).toUpperCase().padEnd(4,"X");
last={id:id,name:f+" "+n,date:dv,time:tm,count:t,lines:lines,formula:F?{sav:F.sav,drk:F.drk}:null};
if(ENDPOINT){try{fetch(ENDPOINT,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({id:id,first:f,last:n,phone:ph,pickup:dv+" "+tm,formula:F?{savory:SAV[F.sav].fr,drink:DRK[F.drk].fr,price:PRICE}:null,items:lines.map(function(x){return{product:nameOf(byId[x.id]),qty:x.q}}),utm:utm(),lang:L()})})}catch(e){}}
if(window.track)track("order_placed",{items:t,formula:F?1:0,lang:L()});
qty={};F=null;[].slice.call(document.querySelectorAll(".opt input")).forEach(function(i){i.checked=false});syncSel();var fm=$("fmsg");if(fm)fm.textContent="";
var of=$("orderform");if(of)of.style.display="none";
render();var c=$("confirm");if(c&&c.scrollIntoView)c.scrollIntoView({behavior:"smooth",block:"start"})});
window.shopRender=render;render();
})();
