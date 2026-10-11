export const DEFAULT_MENU = [
 {id:'choco',name:'Choco chip cookie',price:65,aliases:['choco chip cookies','choco chip cookie','chocolate chip cookies','chocolate chip cookie','choco chips','choco chip']},
 {id:'double',name:'Double chocolate cookie',price:75,aliases:['double chocolate cookies','double chocolate cookie','double chocolate','double choc cookies','double choc']},
 {id:'brownie',name:'Brownie',price:90,aliases:['brownies','brownie']},
 {id:'oat',name:'Oat cookie',price:60,aliases:['oat cookies','oat cookie','oatmeal cookies','oatmeal cookie']}
];
export const STATUS=['New','Baking','Ready','Completed'];
export const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
export function isoDay(date=new Date()){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function validDay(s){ if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false; const d=new Date(s+'T12:00:00'); return !Number.isNaN(+d)&&isoDay(d)===s; }
export function dayPlus(s,n){ const d=new Date(s+'T12:00:00'); d.setDate(d.getDate()+n); return isoDay(d); }
export function formatDay(s){return validDay(s)?new Date(s+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Date needed';}
export function total(items){return items.reduce((sum,i)=>sum+Math.round(Number(i.price)*100)*Number(i.qty||0),0)/100;}
const nums={a:1,an:1,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function parseOrder(source,menu=DEFAULT_MENU,referenceDate=isoDay()){
 const text=String(source||'').trim(), lower=text.toLowerCase(), flags=[], items=[];
 if(!validDay(referenceDate))throw Error('Choose a valid message date.');
 if(!text)throw Error('Paste a customer message first.');
 if(text.length>12000)throw Error('Use one message thread, up to 12,000 characters.');
 const occupied=[];
 for(const product of menu){
  const aliases=[product.name,...product.aliases].sort((a,b)=>b.length-a.length);
  const re=new RegExp('\\b(?:'+aliases.map(esc).join('|')+')\\b','gi');
  const matches=[...text.matchAll(re)].filter(m=>!occupied.some(([a,b])=>m.index<b&&m.index+m[0].length>a));
  if(!matches.length)continue;
  matches.forEach(m=>occupied.push([m.index,m.index+m[0].length]));
  let qty=null; const m=matches[0], prefix=lower.slice(Math.max(0,m.index-70),m.index);
  if(/(?:no|without|cancel|remove|not)\s+(?:the\s+)?$/.test(prefix)){
   flags.push(`Check whether ${product.name.toLowerCase()} should be excluded.`);
  }else if(/half\s+(?:a\s+)?dozen\s+(?:of\s+)?$/.test(prefix)){qty=6;}
  else{
   const q=prefix.match(/\b(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(dozen|dozens)?\s*(?:x\s*|of\s*)?$/);
   if(q){qty=(nums[q[1]]??Number(q[1]))*(q[2]?12:1);}
   else{const after=lower.slice(m.index+m[0].length);const q2=after.match(/^\s*(?:x|×|:)\s*(\d+)\b/);if(q2)qty=Number(q2[1]);}
  }
  if(qty!==null&&(!Number.isInteger(qty)||qty<1||qty>999)){qty=null;flags.push(`Use 1–999 pieces for ${product.name.toLowerCase()}.`);}
  if(qty===null)flags.push(`Confirm the quantity of ${product.name.toLowerCase()}.`);
  if(matches.length>1)flags.push(`${product.name} appears more than once. Check additions or changes.`);
  items.push({id:product.id,name:product.name,price:product.price,qty});
 }
 if(!items.length)flags.push('No menu items found. Add the requested items manually.');
 const knownText=occupied.reduce((s,[a,b])=>s.slice(0,a)+' '.repeat(b-a)+s.slice(b),lower);
 if(/\b(?:cake|cakes|cupcakes?|muffins?|croissants?|sandwich(?:es)?|breads?|macarons?|donuts?|doughnuts?|pastr(?:y|ies)|cookies?)\b/.test(knownText))flags.push('A product may be outside your menu. Check the full message.');
 if(/\b(?:instead|actually|change|changed|make it|cancel|remove|not|box|boxes|pack|packs|kg|grams|each)\b/.test(lower))flags.push('A change, exclusion, pack size, or unit needs a manual check.');
 const allergy=/\b(?:allerg\w*|nuts?|peanuts?|gluten|dairy|eggless|vegan|lactose)\b/.test(lower);
 if(allergy)flags.push('Dietary request: confirm ingredients and cross-contact directly before accepting.');
 let customer='';const name=text.match(/(?:\b(?:name\s*[:\-]|i['’]?m|i am|this is)\s*)([A-Za-z][A-Za-z .'-]{0,50}?)(?=[,.!\n]|\s+(?:and|can|please|would|want|need|ordering)\b|$)/i);
 if(name)customer=name[1].trim();
 if(!customer)flags.push('Customer name is missing.');
 let date='';const days=[];
 for(const m of text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g))days.push(m[1]);
 for(const m of text.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g))days.push(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
 if(/\bday after tomorrow\b/.test(lower))days.push(dayPlus(referenceDate,2));
 else if(/\btomorrow\b/.test(lower))days.push(dayPlus(referenceDate,1));
 if(/\btoday\b/.test(lower))days.push(referenceDate);
 const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
 for(let i=0;i<weekdays.length;i++)if(new RegExp('\\b'+weekdays[i]+'\\b').test(lower)){
  const d=new Date(referenceDate+'T12:00:00');const delta=(i-d.getDay()+7)%7;
  days.push(dayPlus(referenceDate,delta)); flags.push('Weekday interpreted from the message date. Confirm the exact date.');
 }
 if(days.length)date=days[0];
 if(date&&!validDay(date)){date='';flags.push('The written date is invalid.');}
 if(new Set(days).size>1)flags.push('More than one date was mentioned. Confirm the due date.');
 if(!date)flags.push('Due date is missing.');
 if(date&&date<referenceDate)flags.push('The due date is earlier than the message date.');
 let time=''; const tm=lower.match(/\b(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/);
 if(tm&&+tm[1]>=1&&+tm[1]<=12)time=`${String((+tm[1]%12)+(tm[3]==='pm'?12:0)).padStart(2,'0')}:${tm[2]||'00'}`;
 else{const t24=lower.match(/\b(?:at\s+)?([01]\d|2[0-3]):([0-5]\d)\b/);if(t24)time=t24[1]+':'+t24[2];}
 if(!time)flags.push('Pickup or delivery time is missing.');
 const pickup=/\b(?:pickup|pick up|collect|collection)\b/.test(lower), delivery=/\b(?:deliver|delivery|drop off)\b/.test(lower);
 const method=pickup&&!delivery?'Pickup':delivery&&!pickup?'Delivery':'';
 if(!method)flags.push('Confirm pickup or delivery.');
 const phone=text.match(/(?:\+91[ -]?)?\b[6-9]\d{9}\b/);
 return {source:text,referenceDate,customer,date,time,method,phone:phone?phone[0]:'',address:'',notes:allergy?'Dietary request in original message. Confirm before accepting.':'',items,flags:[...new Set(flags)],allergy};
}
export function validateOrder(order){
 const errors=[];
 if(!String(order.customer||'').trim())errors.push('Add a customer name.');
 if(!validDay(order.date))errors.push('Choose a valid due date.');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(order.time||''))errors.push('Add a valid pickup or delivery time.');
 if(!['Pickup','Delivery'].includes(order.method))errors.push('Choose pickup or delivery.');
 if(order.method==='Delivery'&&!String(order.address||'').trim())errors.push('Add the delivery address.');
 if(!Array.isArray(order.items)||!order.items.length)errors.push('Add at least one item.');
 for(const i of order.items||[])if(!Number.isInteger(i.qty)||i.qty<1||i.qty>999||!Number.isFinite(i.price)||i.price<0||i.price>99999)errors.push('Every item needs 1–999 pieces and a valid unit price.');
 return [...new Set(errors)];
}
export function replyFor(order){
 const lines=order.items.map(i=>`${i.qty} × ${i.name} (${money(i.price*i.qty)})`).join(', ');
 return `Hi ${order.customer}! Please confirm: ${lines}. Items total: ${money(total(order.items))}. ${order.method} on ${formatDay(order.date)} at ${order.time}${order.method==='Delivery'?`, to ${order.address}`:''}. Delivery fees or taxes, if applicable, will be agreed separately.${order.notes?' Note: '+order.notes:''} Once confirmed, we will reserve your order. Thank you!`;
}
export function prepList(orders,date=''){
 const map=new Map();
 for(const o of orders.filter(o=>o.status!=='Completed'&&(!date||o.date===date))){
  for(const i of o.items){const k=o.date+'|'+i.id; const row=map.get(k)||{date:o.date,id:i.id,name:i.name,qty:0,orders:0,needsBaking:0};row.qty+=i.qty;row.orders++;if(o.status!=='Ready')row.needsBaking+=i.qty;map.set(k,row);}
 }
 return [...map.values()].sort((a,b)=>(a.date+a.name).localeCompare(b.date+b.name));
}
export function csvCell(v){const s=String(v??'');return '"'+(/^[=+@\-\t\r\n]/.test(s)?"'":'')+s.replace(/"/g,'""')+'"';}
export function ordersCsv(orders){const rows=[['Order','Customer','Date','Time','Method','Status','Item','Quantity','Unit price INR','Line total INR','Notes']];for(const o of orders)for(const i of o.items)rows.push([o.code,o.customer,o.date,o.time,o.method,o.status,i.name,i.qty,i.price,i.qty*i.price,o.notes]);return '\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');}
