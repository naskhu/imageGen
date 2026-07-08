const state = { items: [], logoUrl: null, selected: 0 };
const $ = id => document.getElementById(id);
const BODY_FONT = 'Manrope, Inter, Arial, sans-serif';
const DISPLAY_FONT = 'Plus Jakarta Sans, Manrope, Arial, sans-serif';
const templates = {
  electronics:{bg:['#07111f','#0f4fd6'],accent:'#38d5ff',dark:'#07111f',name:'Electronics',soft:'#e0f2fe'},
  food:{bg:['#06351f','#16a34a'],accent:'#facc15',dark:'#052e1d',name:'Food',soft:'#ecfccb'},
  hardware:{bg:['#1f2937','#dc2626'],accent:'#fbbf24',dark:'#111827',name:'Hardware',soft:'#fee2e2'},
  fashion:{bg:['#3b0764','#db2777'],accent:'#f9a8d4',dark:'#1f0a2e',name:'Fashion',soft:'#fce7f3'},
  default:{bg:['#0f172a','#334155'],accent:'#38bdf8',dark:'#07111f',name:'Default',soft:'#e2e8f0'}
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
function updateItem(id,key,value){ const it=state.items.find(x=>x.id===id); if(!it)return; it[key]=value; const idx=state.items.indexOf(it); if(idx>=0) state.selected=idx; updateSummary(); previewSelected(); }
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
function fontFit(ctx,text,maxWidth,start,min,weight='900',family=DISPLAY_FONT){ let size=start; do{ctx.font=`${weight} ${Math.round(size)}px ${family}`; if(ctx.measureText(text).width<=maxWidth)break; size-=2;}while(size>=min); return size; }
function line(ctx,x1,y1,x2,y2,color,width){ ctx.strokeStyle=color; ctx.lineWidth=width; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
function drawSoftPattern(ctx,w,h,t){
  ctx.globalAlpha=.13; ctx.fillStyle='#fff';
  for(let i=0;i<9;i++){ ctx.beginPath(); ctx.arc(w*(.12+i*.11),h*.12,w*.006,0,Math.PI*2); ctx.fill(); }
  ctx.globalAlpha=.12; ctx.strokeStyle='#fff'; ctx.lineWidth=w*.002;
  ctx.beginPath(); ctx.arc(w*.96,h*.10,w*.25,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(-w*.03,h*.88,w*.38,0,Math.PI*2); ctx.stroke();
  ctx.globalAlpha=1;
}
function drawPrice(ctx,it,t,w,h){
  const currency=($('currencyInput').value.trim()||'MVR').toUpperCase();
  const amount=String(it.price||'0').trim();
  const unit=it.unit?`/${it.unit}`:'';
  const x=w*.08, y=h*.655, bw=w*.84, bh=h*.142;
  ctx.shadowColor='rgba(2,6,23,.25)'; ctx.shadowBlur=w*.028; ctx.shadowOffsetY=h*.012;
  fillRound(ctx,x,y,bw,bh,w*.035,'rgba(255,255,255,.97)');
  ctx.shadowColor='transparent';
  fillRound(ctx,x+w*.022,y+h*.022,w*.19,bh-h*.044,w*.026,t.dark);
  ctx.fillStyle='#ffffff'; ctx.font=`800 ${Math.round(w*.029)}px ${BODY_FONT}`; ctx.textAlign='center'; ctx.fillText('PRICE',x+w*.117,y+h*.052);
  ctx.fillStyle=t.accent; ctx.font=`900 ${Math.round(w*.036)}px ${DISPLAY_FONT}`; ctx.fillText(currency,x+w*.117,y+h*.101);
  ctx.textAlign='left';
  ctx.fillStyle='#020617'; fontFit(ctx,amount,bw*.48,w*.088,w*.052,'900',DISPLAY_FONT); ctx.fillText(amount,x+w*.255,y+h*.098);
  if(unit){ ctx.font=`800 ${Math.round(w*.029)}px ${BODY_FONT}`; ctx.fillStyle='#64748b'; ctx.fillText(unit,x+w*.58,y+h*.098); }
  if(it.old_price){
    const old=`${currency} ${it.old_price}`;
    ctx.font=`800 ${Math.round(w*.026)}px ${BODY_FONT}`; ctx.fillStyle='#94a3b8'; ctx.fillText(old,x+w*.66,y+h*.052);
    const ow=ctx.measureText(old).width; line(ctx,x+w*.66,y+h*.044,x+w*.66+ow,y+h*.044,'#ef4444',Math.max(4,w*.004));
  }
}
async function drawItem(it,canvas){
  const [w,h]=$('sizeSelect').value.split('x').map(Number); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d');
  if(document.fonts?.ready) { try { await document.fonts.ready; } catch(e){} }
  const t=templates[(it.category||'default').toLowerCase()]||templates.default;
  const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,t.bg[0]); g.addColorStop(.65,t.bg[1]); g.addColorStop(1,t.dark); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  drawSoftPattern(ctx,w,h,t);
  fillRound(ctx,w*.07,h*.035,w*.23,h*.055,w*.025,'rgba(255,255,255,.12)');
  if(state.logoUrl){ const logo=await loadImage(state.logoUrl); fitContain(ctx,logo,w*.085,h*.045,w*.19,h*.035); }
  else { ctx.fillStyle='rgba(255,255,255,.88)'; ctx.font=`800 ${Math.round(w*.024)}px ${BODY_FONT}`; ctx.fillText('YOUR LOGO',w*.102,h*.071); }
  const offer=(it.offer||'NEW ARRIVAL').toUpperCase();
  fillRound(ctx,w*.61,h*.04,w*.31,h*.065,w*.032,t.accent); ctx.fillStyle=t.dark; fontFit(ctx,offer,w*.25,w*.031,w*.020,'900',DISPLAY_FONT); ctx.textAlign='center'; ctx.fillText(offer,w*.765,h*.083); ctx.textAlign='left';
  ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font=`800 ${Math.round(w*.030)}px ${BODY_FONT}`; ctx.fillText('PRODUCT SALE',w*.08,h*.145);
  ctx.fillStyle='rgba(255,255,255,.58)'; ctx.font=`700 ${Math.round(w*.020)}px ${BODY_FONT}`; ctx.fillText('LIMITED OFFER • BEST PRICE',w*.08,h*.176);
  if(it.photoUrl){
    const img=await loadImage(it.photoUrl); const px=w*.08,py=h*.205,pw=w*.84,ph=h*.405;
    ctx.shadowColor='rgba(2,6,23,.32)'; ctx.shadowBlur=w*.035; ctx.shadowOffsetY=h*.015;
    fillRound(ctx,px,py,pw,ph,w*.045,'rgba(255,255,255,.96)');
    ctx.shadowColor='transparent';
    fillRound(ctx,px+w*.018,py+h*.018,pw-w*.036,ph-h*.036,w*.036,'#f8fafc');
    fitContain(ctx,img,px+w*.018,py+h*.018,pw-w*.036,ph-h*.036,w*.018);
  }
  drawPrice(ctx,it,t,w,h);
  const title=it.item_name||'Product Name';
  ctx.fillStyle='#ffffff'; fontFit(ctx,title,w*.84,w*.060,w*.038,'900',DISPLAY_FONT); let y=wrapText(ctx,title,w*.08,h*.852,w*.84,Math.round(w*.062),2);
  const desc=it.description||it.brand||'High quality product, ready for order.';
  ctx.fillStyle='rgba(255,255,255,.78)'; ctx.font=`650 ${Math.round(w*.027)}px ${BODY_FONT}`; y=wrapText(ctx,desc,w*.08,y+8,w*.76,Math.round(w*.038),2);
  fillRound(ctx,w*.08,h*.944,w*.28,h*.045,w*.022,'rgba(255,255,255,.12)');
  ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font=`900 ${Math.round(w*.020)}px ${BODY_FONT}`; ctx.textAlign='center'; ctx.fillText('SHOP NOW',w*.22,h*.974); ctx.textAlign='left';
  ctx.fillStyle='rgba(255,255,255,.82)'; ctx.font=`800 ${Math.round(w*.021)}px ${BODY_FONT}`; ctx.fillText(`${it.item_code?it.item_code+'  •  ':''}${it.phone||''}`,w*.40,h*.973);
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
