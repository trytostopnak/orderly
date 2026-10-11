import {DEFAULT_MENU,STATUS,money,isoDay,validDay,dayPlus,formatDay,total,parseOrder,validateOrder,replyFor,prepList,ordersCsv} from './core.mjs';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x)), uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
const STORE='orderly.workspace.v1';let draft=null,isExample=false,toastTimer;
function validateMenu(menu){return Array.isArray(menu)&&menu.length>0&&menu.length<=100&&new Set(menu.map(p=>p.id)).size===menu.length&&menu.every(p=>typeof p.id==='string'&&p.id.length<=100&&typeof p.name==='string'&&p.name.trim()&&p.name.length<=100&&Number.isFinite(p.price)&&p.price>=0&&p.price<=99999&&Array.isArray(p.aliases)&&p.aliases.length<=30&&p.aliases.every(a=>typeof a==='string'&&a.length<=100));}
function validateBackup(s){return s?.schemaVersion===1&&validateMenu(s.menu)&&Array.isArray(s.orders)&&s.orders.length<=3000&&new Set(s.orders.map(o=>o.id)).size===s.orders.length&&s.orders.every(o=>o&&typeof o.id==='string'&&typeof o.code==='string'&&Array.isArray(o.items)&&o.items.every(i=>typeof i.name==='string'&&typeof i.id==='string')&&validateOrder(o).length===0&&STATUS.includes(o.status));}
let state={schemaVersion:1,menu:clone(DEFAULT_MENU),orders:[]};
try{const raw=localStorage.getItem(STORE);if(raw){const data=JSON.parse(raw);if(validateBackup(data))state=data;else setTimeout(()=>toast('Saved data could not be loaded. Restore a valid backup from Your menu.'),500);}}catch{setTimeout(()=>toast('Browser storage is unavailable. Download backups to keep your work.'),500);}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),5000);}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));return true;}catch{toast('Storage is full or blocked. Your changes are only in this session. Download a backup.');return false;}}
function goTab(name){if(!['inbox','orders','prep','menu'].includes(name))name='inbox';$$('.tab-panel').forEach(x=>x.hidden=x.id!=='tab-'+name);$$('[data-tab]').forEach(x=>{const a=x.dataset.tab===name;x.classList.toggle('active',a);if(a)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});if(name==='orders')renderOrders();if(name==='prep')renderPrep();if(name==='menu')renderMenu();history.replaceState(null,'','#'+name);window.scrollTo({top:0,behavior:'smooth'});}
$$('[data-tab],[data-goto]').forEach(b=>b.onclick=()=>goTab(b.dataset.tab||b.dataset.goto));
$('.brand').onclick=e=>{e.preventDefault();goTab('inbox');};
$('#today-label').textContent=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
$('#reference-date').value=isoDay();
$('#message').oninput=()=>{$('#message-count').textContent=$('#message').value.length+' characters';isExample=false;};
const examples={
 clear:"Hi, I'm Ananya. Can I get 6 choco chip cookies and 4 brownies for tomorrow at 5 pm? Pickup please.",
 missing:'Can I get a box of brownies and 4 oat cookies? Delivery please. Also, do you make muffins?',
 dietary:"Hi, I'm Kabir. I need 8 double chocolate cookies for tomorrow at 6 pm. Pickup please. My child has a peanut allergy. Can you confirm whether these are suitable?"
};
$$('[data-example]').forEach(b=>b.onclick=()=>{$('#message').value=examples[b.dataset.example];$('#message-count').textContent=$('#message').value.length+' characters';$('#reference-date').value=isoDay();isExample=true;$('#message').focus();});
$('#parse').onclick=()=>{try{draft=parseOrder($('#message').value,state.menu,$('#reference-date').value);draft.demo=isExample;renderDraft();toast('Draft ready. Review every detail before saving.');if(window.innerWidth<990)$('#draft-form').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){toast(e.message);}};
function renderDraft(){
 $('#draft-empty').hidden=true;$('#draft-form').hidden=false;
 for(const [id,key] of [['customer','customer'],['phone','phone'],['due-date','date'],['due-time','time'],['method','method'],['address','address'],['notes','notes']])$('#'+id).value=draft[key]||'';
 $('#reviewed').checked=false;$('#address-wrap').hidden=draft.method!=='Delivery';$('#address').required=draft.method==='Delivery';
 $('#draft-flags').innerHTML=draft.flags.length?`<div class="flag-box"><strong>${draft.flags.length} detail${draft.flags.length===1?'':'s'} to check</strong><ul>${draft.flags.map(f=>`<li>${escape(f)}</li>`).join('')}</ul></div>`:'<div class="ok-box">The main details were found. Check them against the original message.</div>';
 $('#add-product').innerHTML=state.menu.map(p=>`<option value="${escape(p.id)}">${escape(p.name)} · ${money(p.price)}</option>`).join('');renderDraftItems();
}
function renderDraftItems(){
 $('#draft-items').innerHTML=draft.items.map((i,n)=>`<div class="draft-line"><strong>${escape(i.name)}<small>${money(i.price)} / piece</small></strong><input aria-label="${escape(i.name)} quantity" type="number" min="1" max="999" step="1" required data-qty="${n}" value="${i.qty??''}"><span data-line-total="${n}">${money(i.price*(i.qty||0))}</span><button type="button" class="remove-item" data-remove="${n}" aria-label="Remove ${escape(i.name)}">×</button></div>`).join('');
 $$('[data-qty]').forEach(i=>i.oninput=()=>{draft.items[+i.dataset.qty].qty=i.value===''?null:Number(i.value);$(`[data-line-total="${i.dataset.qty}"]`).textContent=money(draft.items[+i.dataset.qty].price*Number(i.value));$('#draft-total').textContent=money(total(draft.items));$('#reviewed').checked=false;});
 $$('[data-remove]').forEach(b=>b.onclick=()=>{draft.items.splice(+b.dataset.remove,1);renderDraftItems();$('#reviewed').checked=false;});$('#draft-total').textContent=money(total(draft.items));
}
$('#method').onchange=()=>{$('#address-wrap').hidden=$('#method').value!=='Delivery';$('#address').required=$('#method').value==='Delivery';};
$('#draft-form').addEventListener('input',e=>{if(e.target.id!=='reviewed')$('#reviewed').checked=false;});
$('#add-item').onclick=()=>{if(!draft)return;const p=state.menu.find(i=>i.id===$('#add-product').value);if(!p)return;if(draft.items.some(i=>i.id===p.id)){toast('Already in this order. Update its quantity.');return;}draft.items.push({id:p.id,name:p.name,price:p.price,qty:1});renderDraftItems();$('#reviewed').checked=false;};
$('#draft-form').onsubmit=e=>{e.preventDefault();if(!draft)return;
 const order={...draft,id:uid(),code:'OD-'+String(state.orders.reduce((max,o)=>Math.max(max,Number(o.code.replace('OD-',''))||0),0)+1).padStart(3,'0'),createdAt:new Date().toISOString(),status:'New'};
 for(const [id,key] of [['customer','customer'],['phone','phone'],['due-date','date'],['due-time','time'],['method','method'],['address','address'],['notes','notes']])order[key]=$('#'+id).value.trim();
 order.items=clone(draft.items);const errors=validateOrder(order);if(errors.length){toast(errors.join(' '));return;}if(!$('#reviewed').checked){toast('Check the original message before saving.');return;}
 if(state.orders.some(o=>o.customer.toLowerCase()===order.customer.toLowerCase()&&o.date===order.date&&o.source===order.source)){toast('This customer message is already saved. Open it in Orders.');return;}
 state.orders.unshift(order);const persisted=save();draft=null;$('#draft-form').hidden=true;$('#draft-empty').hidden=false;$('#message').value='';$('#message-count').textContent='0 characters';isExample=false;renderCounts();goTab('orders');if(persisted)toast('Order saved. Your kitchen prep list is updated.');openOrder(order.id);
};
function renderCounts(){$('#nav-count').textContent=state.orders.filter(o=>o.status!=='Completed').length;}
function renderOrders(){
 renderCounts();const active=state.orders.filter(o=>o.status!=='Completed'),real=state.orders.filter(o=>!o.demo);
 $('#order-stats').innerHTML=[['Active orders',active.length],['Due today',active.filter(o=>o.date===isoDay()).length],['Ready to collect',active.filter(o=>o.status==='Ready').length],['Recorded value',money(real.reduce((sum,o)=>sum+total(o.items),0))]].map(([label,value])=>`<div class="stat"><span>${label}</span><strong>${value}</strong>${label==='Recorded value'?'<span>Real orders · not payments</span>':''}</div>`).join('');
 const q=$('#search').value.toLowerCase(),filter=$('#status-filter').value;
 const list=state.orders.filter(o=>(!filter||o.status===filter)&&(!q||(o.customer+' '+o.code).toLowerCase().includes(q))).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 $('#order-list').innerHTML=list.length?list.map(o=>`<article class="order-card"><div class="card-top"><span>${escape(o.code)}${o.demo?'<span class="sample-tag">SAMPLE</span>':''}</span><span class="status-pill status-${o.status}">${o.status}</span></div><h3>${escape(o.customer)}</h3><span class="due">${formatDay(o.date)} · ${escape(o.time)} · ${escape(o.method)}</span><ul>${o.items.map(i=>`<li><span>${escape(i.name)}</span><b>×${i.qty}</b></li>`).join('')}</ul><div class="card-bottom"><strong>${money(total(o.items))}</strong><button data-open-order="${escape(o.id)}">View order ↗</button></div></article>`).join(''):`<div class="empty-state"><h3>${q||filter?'No matching orders.':'Your first order starts here.'}</h3><p>${q||filter?'Try another search or status.':'Paste a message in the Message desk, or explore the sample orders.'}</p><button class="secondary-button" id="empty-new">Go to message desk</button></div>`;
 $$('[data-open-order]').forEach(b=>b.onclick=()=>openOrder(b.dataset.openOrder));if($('#empty-new'))$('#empty-new').onclick=()=>goTab('inbox');
}
$('#search').oninput=renderOrders;$('#status-filter').onchange=renderOrders;
function openOrder(id){const o=state.orders.find(x=>x.id===id);if(!o)return;
 $('#order-detail').innerHTML=`<button class="dialog-close" id="close-order" aria-label="Close">×</button><p class="eyebrow">${escape(o.code)} ${o.demo?'· SAMPLE ORDER':''}</p><h2>${escape(o.customer)}</h2><div class="detail-grid"><span>Due<b>${formatDay(o.date)} at ${escape(o.time)}</b></span><span>Fulfilment<b>${escape(o.method)}</b></span>${o.phone?`<span>Phone<b>${escape(o.phone)}</b></span>`:''}${o.address?`<span>Address<b>${escape(o.address)}</b></span>`:''}</div><ul class="detail-list">${o.items.map(i=>`<li><span>${i.qty} × ${escape(i.name)}</span><b>${money(i.qty*i.price)}</b></li>`).join('')}<li><span>Items total</span><b>${money(total(o.items))}</b></li></ul>${o.notes?`<p><b>Order notes:</b> ${escape(o.notes)}</p>`:''}<details><summary>Original message</summary><p class="source-box">${escape(o.source)}</p></details><label for="reply" style="display:block;margin-top:20px">Reply draft · check before copying</label><textarea id="reply" class="reply-box">${escape(replyFor(o))}</textarea><div class="detail-actions"><button id="copy-reply" class="primary-button">Copy reply</button><label>Status <select id="order-status">${STATUS.map(s=>`<option${s===o.status?' selected':''}>${s}</option>`).join('')}</select></label></div><button id="delete-order" class="danger-link">Delete this order</button>`;
 $('#close-order').onclick=()=>$('#order-dialog').close();$('#copy-reply').onclick=()=>copyText($('#reply').value);
 $('#order-status').onchange=()=>{o.status=$('#order-status').value;const persisted=save();renderOrders();renderPrep();if(persisted)toast('Order status updated.');};
 $('#delete-order').onclick=()=>{if(confirm(`Delete ${o.code} for ${o.customer}?`)){state.orders=state.orders.filter(x=>x.id!==id);const persisted=save();$('#order-dialog').close();renderOrders();renderPrep();if(persisted)toast('Order deleted.');}};
 if(!$('#order-dialog').open)$('#order-dialog').showModal();
}
async function copyText(text){try{await navigator.clipboard.writeText(text);toast('Reply copied. Check it before sending to the customer.');}catch{$('#reply')?.select();toast('Select and copy the reply using your keyboard.');}}
function renderPrep(){const date=$('#prep-date').value,rows=prepList(state.orders,date);$('#prep-date-label').textContent=date?formatDay(date):'All active orders';
 $('#prep-list').innerHTML=rows.length?`<table class="prep-table"><thead><tr><th>DUE DATE</th><th>PRODUCT</th><th>PIECES</th><th>TO BAKE</th><th>ORDERS</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${formatDay(r.date)}</td><td>${escape(r.name)}</td><td class="qty">${r.qty}</td><td>${r.needsBaking}</td><td>${r.orders}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-state"><h3>A clear kitchen.</h3><p>No active orders for this selection.</p></div>';
 const notes=state.orders.filter(o=>o.status!=='Completed'&&(!date||o.date===date)&&o.notes);$('#prep-notes').innerHTML=notes.length?'<h3>Notes for the kitchen</h3>'+notes.map(o=>`<p><b>${escape(o.customer)} · ${formatDay(o.date)}${o.demo?' · SAMPLE':''}</b><br>${escape(o.notes)}</p>`).join(''):'';
}
$('#prep-date').onchange=renderPrep;$('#all-dates').onclick=()=>{$('#prep-date').value='';renderPrep();};$('#print-prep').onclick=()=>window.print();
function renderMenu(){
 $('#menu-list').innerHTML=state.menu.map((p,n)=>`<div class="menu-row"><label>Product name<input data-menu="${n}" data-field="name" value="${escape(p.name)}" maxlength="100"></label><label>₹ / piece<input data-menu="${n}" data-field="price" type="number" min="0" max="99999" step="0.01" value="${p.price}"></label><label>Also known as <span class="optional">comma separated</span><input data-menu="${n}" data-field="aliases" value="${escape(p.aliases.join(', '))}" maxlength="2500"></label><button class="small-button" data-menu-delete="${n}" aria-label="Delete ${escape(p.name)}">Delete</button></div>`).join('');
 $$('[data-menu]').forEach(i=>i.onchange=()=>{const n=+i.dataset.menu,f=i.dataset.field,old=clone(state.menu[n]);if(f==='price')state.menu[n][f]=i.value===''?NaN:Math.round(Number(i.value)*100)/100;else if(f==='aliases')state.menu[n][f]=i.value.split(',').map(x=>x.trim()).filter(Boolean);else state.menu[n][f]=i.value.trim();if(!validateMenu(state.menu)){state.menu[n]=old;renderMenu();toast('Use a product name, a price from ₹0 to ₹99,999, and up to 30 short aliases.');return;}if(save())toast('Menu saved. New drafts will use these details.');});
 $$('[data-menu-delete]').forEach(b=>b.onclick=()=>{if(state.menu.length===1){toast('Keep at least one product.');return;}const p=state.menu[+b.dataset.menuDelete];if(confirm(`Remove ${p.name} from the menu? Saved orders will be kept.`)){state.menu.splice(+b.dataset.menuDelete,1);save();renderMenu();}});
}
$('#new-product').onclick=()=>{if(state.menu.length>=100){toast('Maximum 100 menu products.');return;}state.menu.push({id:uid(),name:'New product',price:0,aliases:[]});save();renderMenu();$$('[data-field="name"]').at(-1).focus();$$('[data-field="name"]').at(-1).select();};
function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#export-csv').onclick=()=>{if(!state.orders.length){toast('Save an order first.');return;}download('Orderly_Orders.csv',ordersCsv(state.orders),'text/csv;charset=utf-8');};
$('#backup').onclick=()=>download('Orderly_Backup_'+isoDay()+'.json',JSON.stringify(state,null,2),'application/json');
$('#restore').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>6000000)throw Error('Use a backup smaller than 6 MB.');const data=JSON.parse(await file.text());if(!validateBackup(data))throw Error('This is not a valid Orderly backup.');if(!confirm(`Replace this device's ${state.orders.length} orders and menu with ${data.orders.length} orders from the backup? Download a backup first if needed.`))return;state=clone(data);draft=null;$('#draft-form').hidden=true;$('#draft-empty').hidden=false;const persisted=save();renderMenu();renderCounts();if(persisted)toast('Backup restored.');}catch(e){toast(e.message);}finally{$('#restore').value='';}};
function loadDemo(){if(state.orders.some(o=>o.demo)){goTab('orders');toast('Sample orders are already in your order book.');return;}
 const date=dayPlus(isoDay(),1),samples=[{customer:'Ananya',time:'17:00',status:'New',items:[{...DEFAULT_MENU[0],qty:6},{...DEFAULT_MENU[2],qty:4}],notes:''},{customer:'Kabir',time:'18:00',status:'Baking',items:[{...DEFAULT_MENU[1],qty:8}],notes:'Peanut allergy mentioned. Confirm ingredients and cross-contact directly before accepting.'},{customer:'Meera',time:'16:30',status:'Ready',items:[{...DEFAULT_MENU[0],qty:12},{...DEFAULT_MENU[3],qty:6}],notes:'Pack cookies in two separate bags.'}];
 let count=state.orders.reduce((n,o)=>Math.max(n,Number(o.code.replace('OD-',''))||0),0);
 for(const sample of samples)state.orders.push({...sample,id:uid(),code:'OD-'+String(++count).padStart(3,'0'),date,method:'Pickup',address:'',phone:'',source:'Fictional sample order for exploring Orderly.',demo:true,createdAt:new Date().toISOString()});
 const persisted=save();goTab('orders');if(persisted)toast('Three fictional sample orders loaded.');
}
$('#load-demo').onclick=loadDemo;
$('#clear-demo').onclick=()=>{const count=state.orders.filter(o=>o.demo).length;if(!count){toast('No sample orders to remove.');return;}if(confirm(`Remove ${count} sample orders? Your other orders will be kept.`)){state.orders=state.orders.filter(o=>!o.demo);const persisted=save();renderCounts();if(persisted)toast('Sample orders removed.');}};
$('#about-open').onclick=()=>$('#about-dialog').showModal();$$('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
for(const dialog of $$('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
renderCounts();goTab(location.hash.slice(1)||'inbox');
