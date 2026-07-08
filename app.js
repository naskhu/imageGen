const state = { items: [], logoUrl: null, selected: 0 };
const $ = id => document.getElementById(id);
const templates = {
  electronics:{bg:['#08111f','#155bd5'],accent:'#39d5ff',dark:'#07111f',name:'Electronics'},
  food:{bg:['#0b3b25','#1fbf75'],accent:'#ffe066',dark:'#052e1d',name:'Food'},
  hardware:{bg:['#1f2937','#ef4444'],accent:'#fbbf24',dark:'#111827',name:'Hardware'},
  fashion:{bg:['#3b0764','#ec4899'],accent:'#f9a8d4',dark:'#1f0a2e',name:'Fashion'},
  default:{bg:['#0f172a','#334155'],accent:'#38bdf8',dark:'#07111f',name:'Default'}
};
function uid(){ return 'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function blankItem(){ return {id:uid(), item_name:'', price:'', category:'default', description:'', unit:'', old_price:'', offer:'', item_code:'', phone:'', brand:'', photoUrl:null, photoName:''}; }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function csvEscape(v){ v=String(v??''); return /[",\n]/.test(v)?`"${v.replaceAll('"','""')}"`:v; }
function setStatus(id,msg,cls='muted'){ $(id).className='status '+cls; $(id).textContent=msg; }
function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){ const c=text[i], n=text[i+1];
    if(c==='"'&&q&&n==='"'){cell+='"';i++;} else if(c==='"'){q=!q;} else if(c===','&&!q){row.push(cell.trim());cell='';}
    else if((c==='\n'||c==='\r')&&!q){ if(cell||row.length){row.push(cell.trim());rows.push(row);row=[];cell='';} if(c==='\r'&&n==='\n')i++; } else cell+=c;
  }
  if(cell||row.length){row.push(cell.trim());rows.push(row);} if(!rows.length)return[];
  const headers=rows.shift().map(h=>h.trim().toLowerCase());
  return rows.filter(r=>r.some(Boolean)).map(r=>{ const it=blankItem(); headers.forEach((h,i)=>{ if(h in it) it[h]=r[i]||''; }); return it; });
}
function validItems(){ return state.items.filter(i=>i.item_name.trim() && i.price.trim() && i.photoUrl); }
function updateSummary(){
  const complete=validItems().length, total=state.items.length;
  $('summaryText').textContent = total ? `${total} item(s), ${complete} ready to generate` : 'Add your first product.';
  $('generateBtn').disabled = complete===0;
  $('downloadOneBtn').disabled = !state.items[state.selected] || !state.items[state.selected].photoUrl;
  $('duplicateBtn').disabled = !state.items.length;
  if(total && complete<total) setStatus('generateStatus','Some items need name, price, and photo. Completed items can be generated.','warn');
  else if(complete) setStatus('generateStatus','Ready to generate professional portrait posters.','good');
  else setStatus('generateStatus','Add item and choose photo.','muted');
}
function addItem(data){ state.items.push({...blankItem(), ...(data||{})}); state.selected=state.items.length-1; renderItems(); previewSelected(); }
function updateItem(id,key,value){ const it=state.items.find(x=>x.id===id); if(!it)return; it[key]=value; renderItems(false); previewSelected(); }
function selectItem(idx){ state.selected=idx; renderItems(false); previewSelected(); }
function deleteItem(idx){ const it=state.items[idx]; if(it?.photoUrl) URL.revokeObjectURL(it.photoUrl); state.items.splice(idx,1); state.selected=Math.max(0,Math.min(state.selected,state.items.length-1)); renderItems(); previewSelected(); }
function duplicateSelected(){ const src=state.items[state.selected]; if(!src)return; const copy={...src,id:uid(),item_name:src.item_name+' Copy'}; state.items.splice(state.selected+1,0,copy); state.selected++; renderItems(); previewSelected(); }
function renderItems(reset=true){
  const wrap=$('itemCards'); wrap.innerHTML='';
  if(!state.items.length){ wrap.innerHTML='<div class="empty">No items yet. Press + Add Item.</div>'; updateSummary(); return; }
  state.items.forEach((it,idx)=>{
    const card=document.createElement('div'); card.className='item-card'+(idx===state.selected?' selected':'');
    const img = it.photoUrl ? `<img class="photo-thumb" src="${it.photoUrl}" alt="Product photo">` : `<div class="photo-thumb photo-placeholder">No photo</div>`;
    card.innerHTML=`
      <div class="item-card-head"><div class="item-title">Item ${idx+1}${it.item_name?' · '+escapeHtml(it.item_name):''}</div><button class="danger-btn small-btn" data-del="${idx}">Delete</button></div>
      <div class="photo-row">${img}<label class="upload-box compact choose-photo"><input type="file" accept="image/*" data-photo="${it.id}"><span>${it.photoUrl?'Change photo':'Choose photo'}</span></label></div>
      <div class="form-grid">
        <label class="full">Item name<input data-id="${it.id}" data-k="item_name" value="${escapeHtml(it.item_name)}" placeholder="Fresh tuna / iPhone charger"></label>
        <label>Price<input data-id="${it.id}" data-k="price" value="${escapeHtml(it.price)}" placeholder="120"></label>
        <label>Unit<input data-id="${it.id}" data-k="unit" value="${escapeHtml(it.unit)}" placeholder="kg / pc"></label>
        <label>Category<select data-id="${it.id}" data-k="category">${Object.keys(templates).map(k=>`<option value="${k}" ${it.category===k?'selected':''}>${templates[k].name}</option>`).join('')}</select></label>
        <label>Old price<input data-id="${it.id}" data-k="old_price" value="${escapeHtml(it.old_price)}" placeholder="150"></label>
        <label>Offer text<input data-id="${it.id}" data-k="offer" value="${escapeHtml(it.offer)}" placeholder="NEW / OFFER"></label>
        <label>Item code<input data-id="${it.id}" data-k="item_code" value="${escapeHtml(it.item_code)}" placeholder="EL-001"></label>
        <label>Phone<input data-id="${it.id}" data-k="phone" value="${escapeHtml(it.phone)}" placeholder="9485333"></label>
        <label class="full">Description<textarea data-id="${it.id}" data-k="description" placeholder="Short product details">${escapeHtml(it.description)}</textarea></label>
      </div>`;
    card.addEventListener('click',e=>{ if(!e.target.matches('input,select,textarea,button')) selectItem(idx); });
    wrap.appendChild(card);
  });
  wrap.querySelectorAll('[data-id]').forEach(el=>{ el.oninput=e=>updateItem(e.target.dataset.id,e.target.dataset.k,e.target.value); });
  wrap.querySelectorAll('[data-photo]').forEach(el=>{ el.onchange=e=>{ const f=e.target.files[0]; if(!f)return; const it=state.items.find(x=>x.id===e.target.dataset.photo); if(!it)return; if(it.photoUrl) URL.revokeObjectURL(it.photoUrl); it.photoUrl=URL.createObjectURL(f); it.photoName=f.name; state.selected=state.items.indexOf(it); renderItems(false); previewSelected(); }; });
  wrap.querySelectorAll('[data-del]').forEach(btn=>{ btn.onclick=e=>{ e.stopPropagation(); deleteItem(Number(btn.dataset.del)); }; });
  updateSummary();
}
function loadImage(src){ return new Promise((res,rej)=>{ const img=new Image(); img.onload=()=>res(img); img.onerror=rej; img.src=src; }); }
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function fillRound(ctx,x,y,w,h,r,color){ ctx.fillStyle=color; roundRect(ctx,x,y,w,h,r); ctx.fill(); }
function fitContain(ctx,img,x,y,w,h,pad=0){ x+=pad;y+=pad;w-=pad*2;h-=pad*2; const ir=img.width/img.height,r=w/h; let dw=w,dh=h,dx=x,dy=y; if(ir>r){dh=w/ir;dy=y+(h-dh)/2}else{dw=h*ir;dx=x+(w-dw)/2} ctx.drawImage(img,dx,dy,dw,dh); }
function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines){ const words=String(text||'').split(/\s+/).filter(Boolean); let line='', lines=[]; for(const word of words){ const t=line?line+' '+word:word; if(ctx.measureText(t).width>maxWidth&&line){lines.push(line);line=word}else line=t } if(line)lines.push(line); lines=lines.slice(0,maxLines); lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight)); return y+lines.length*lineHeight; }
function fontFit(ctx,text,maxWidth,start,min,weight='900',family='Arial'){ let size=start; do{ctx.font=`${weight} ${Math.round(size)}px ${family}`; if(ctx.measureText(text).width<=maxWidth)break; size-=2;}while(size>=min); return size; }
function drawPrice(ctx,it,t,w,h){
  const currency=$('currencyInput').value.trim().toUpperCase(); const amount=String(it.price||'0'); const unit=it.unit?`/ ${it.unit}`:'';
  const x=w*.08,y=h*.705,bw=w*.84,bh=h*.12;
  fillRound(ctx,x,y,bw,bh,w*.035,'rgba(255,255,255,.96)');
  ctx.fillStyle=t.dark; ctx.font=`800 ${Math.round(w*.035)}px Arial`; ctx.fillText(currency,x+w*.045,y+h*.047);
  fontFit(ctx,amount,bw*.58,w*.09,w*.05,'950'); ctx.fillStyle='#020617'; ctx.fillText(amount,x+w*.045,y+h*.102);
  if(unit){ ctx.font=`800 ${Math.round(w*.032)}px Arial`; ctx.fillStyle='#64748b'; ctx.fillText(unit,x+w*.42,y+h*.101); }
  if(it.old_price){ const old=`${currency} ${it.old_price}`; ctx.font=`800 ${Math.round(w*.027)}px Arial`; ctx.fillStyle='#94a3b8'; ctx.fillText(old,x+w*.66,y+h*.055); const ow=ctx.measureText(old).width; ctx.strokeStyle='#ef4444'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x+w*.66,y+h*.047); ctx.lineTo(x+w*.66+ow,y+h*.047); ctx.stroke(); }
}
async function drawItem(it,canvas){
  const [w,h]=$('sizeSelect').value.split('x').map(Number); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d');
  const t=templates[(it.category||'default').toLowerCase()]||templates.default;
  const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,t.bg[0]); g.addColorStop(1,t.bg[1]); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.10)'; ctx.beginPath(); ctx.arc(w*.88,h*.08,w*.28,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(w*.02,h*.98,w*.36,0,Math.PI*2); ctx.fill();
  if(state.logoUrl){ const logo=await loadImage(state.logoUrl); fitContain(ctx,logo,w*.07,h*.035,w*.26,h*.07); }
  const offer=(it.offer||templates[(it.category||'default')]?.name||'SPECIAL').toUpperCase(); fillRound(ctx,w*.63,h*.04,w*.30,h*.055,w*.025,t.accent); ctx.fillStyle=t.dark; fontFit(ctx,offer,w*.24,w*.028,w*.020,'950'); ctx.fillText(offer,w*.66,h*.078);
  if(it.photoUrl){ const img=await loadImage(it.photoUrl); const px=w*.07,py=h*.13,pw=w*.86,ph=h*.53; ctx.shadowColor='rgba(0,0,0,.30)'; ctx.shadowBlur=w*.03; ctx.shadowOffsetY=h*.01; fillRound(ctx,px,py,pw,ph,w*.045,'#ffffff'); ctx.shadowColor='transparent'; fitContain(ctx,img,px,py,pw,ph,w*.035); }
  drawPrice(ctx,it,t,w,h);
  ctx.fillStyle='#ffffff'; fontFit(ctx,it.item_name||'Product Name',w*.86,w*.067,w*.039,'950'); let y=wrapText(ctx,it.item_name||'Product Name',w*.08,h*.875,w*.86,Math.round(w*.067),2);
  ctx.fillStyle='rgba(255,255,255,.82)'; ctx.font=`650 ${Math.round(w*.030)}px Arial`; y=wrapText(ctx,it.description||'',w*.08,y+8,w*.84,Math.round(w*.041),2);
  ctx.fillStyle='rgba(255,255,255,.82)'; ctx.font=`800 ${Math.round(w*.023)}px Arial`; ctx.fillText(`${it.item_code?it.item_code+'  •  ':''}${it.phone||''}`,w*.08,h*.975);
}
async function previewSelected(){ const it=state.items[state.selected]; const c=$('previewCanvas'); if(!it){ const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); updateSummary(); return; } await drawItem(it,c); updateSummary(); }
function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }
$('addItemBtn').onclick=()=>addItem(); $('duplicateBtn').onclick=duplicateSelected;
$('downloadSample').onclick=()=>{ const headers=['item_name','price','category','description','unit','old_price','offer','item_code','phone','brand']; const rows=[['Fresh Tuna','80','food','Maldives local fresh tuna','kg','','FRESH','FD-001','9485333','Local Tuna']]; downloadBlob(new Blob([[headers,...rows].map(r=>r.map(csvEscape).join(',')).join('\n')],{type:'text/csv'}),'sample-items.csv'); };
$('csvInput').onchange=async e=>{ const f=e.target.files[0]; if(!f)return; const rows=parseCSV(await f.text()); state.items.push(...rows); state.selected=Math.max(0,state.items.length-rows.length); setStatus('csvStatus',`${rows.length} items imported. Now choose each photo.`,rows.length?'good':'bad'); renderItems(); previewSelected(); };
$('logoInput').onchange=e=>{ const f=e.target.files[0]; if(!f)return; if(state.logoUrl)URL.revokeObjectURL(state.logoUrl); state.logoUrl=URL.createObjectURL(f); setStatus('logoStatus',`Logo loaded: ${f.name}`,'good'); previewSelected(); };
$('sizeSelect').onchange=previewSelected; $('currencyInput').oninput=previewSelected;
$('downloadOneBtn').onclick=async()=>{ const it=state.items[state.selected]; if(!it)return; const c=document.createElement('canvas'); await drawItem(it,c); c.toBlob(b=>downloadBlob(b,`${(it.item_name||'product').replace(/[^a-z0-9-_]+/gi,'_')}.png`),'image/png',0.95); };
$('generateBtn').onclick=async()=>{ if(!window.JSZip){setStatus('generateStatus','ZIP library could not load. Reload with internet.','bad');return;} const ready=validItems(); if(!ready.length)return; $('generateBtn').disabled=true; const zip=new JSZip(), c=document.createElement('canvas'); for(let i=0;i<ready.length;i++){ setStatus('generateStatus',`Generating ${i+1} of ${ready.length}...`,'warn'); await drawItem(ready[i],c); const b=await new Promise(res=>c.toBlob(res,'image/png',0.95)); const safe=(ready[i].item_name||`item-${i+1}`).replace(/[^a-z0-9-_]+/gi,'_').slice(0,70); zip.file(`${String(i+1).padStart(3,'0')}_${safe}.png`,b); } const out=await zip.generateAsync({type:'blob'}); downloadBlob(out,'product-posters.zip'); setStatus('generateStatus','ZIP generated successfully.','good'); $('generateBtn').disabled=false; };
addItem({item_name:'',category:'default'});
