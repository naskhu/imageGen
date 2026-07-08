const state = { items: [], logoUrl: null, selected: 0 };
const $ = id => document.getElementById(id);
const BODY_FONT = 'Manrope, Inter, Arial, sans-serif';
const DISPLAY_FONT = 'Plus Jakarta Sans, Manrope, Arial, sans-serif';
const templates = {
  electronics:{bg:['#06105c','#009cff'],accent:'#ffd21f',red:'#e31d16',dark:'#06113a',name:'Electronics'},
  food:{bg:['#05321f','#18b96b'],accent:'#ffd21f',red:'#e31d16',dark:'#052e1d',name:'Food'},
  hardware:{bg:['#121826','#dc2626'],accent:'#ffd21f',red:'#e31d16',dark:'#111827',name:'Hardware'},
  fashion:{bg:['#3b0764','#e43a92'],accent:'#ffd21f',red:'#e31d16',dark:'#1f0a2e',name:'Fashion'},
  default:{bg:['#06105c','#009cff'],accent:'#ffd21f',red:'#e31d16',dark:'#06113a',name:'Default'}
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
        <label>Offer text<input data-id="${it.id}" data-k="offer" value="${escapeHtml(it.offer)}" placeholder="BIG SALE / TODAY SALE"></label>
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
function drawPolygon(ctx, pts, color){ ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]); ctx.closePath(); ctx.fill(); }
function drawBackground(ctx,w,h,t){
  const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,t.bg[0]); g.addColorStop(.50,t.bg[1]); g.addColorStop(1,t.dark); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.09)'; for(let i=0;i<120;i++){ const x=w*(.15+(i%15)*.032), y=h*(.035+Math.floor(i/15)*.013); ctx.beginPath(); ctx.arc(x,y,w*.0034,0,Math.PI*2); ctx.fill(); }
  ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=w*.0024; ctx.beginPath(); ctx.arc(w*.82,h*.31,w*.43,Math.PI*1.05,Math.PI*1.95); ctx.stroke();
  const rg=ctx.createRadialGradient(w*.78,h*.34,w*.05,w*.78,h*.34,w*.38); rg.addColorStop(0,'#ffe766'); rg.addColorStop(1,'#ffb51f'); ctx.fillStyle=rg; ctx.beginPath(); ctx.ellipse(w*.78,h*.34,w*.38,h*.285,-.08,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.16)'; ctx.beginPath(); ctx.arc(w*.33,h*.57,w*.09,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(w*.39,h*.57,w*.052,0,Math.PI*2); ctx.fill();
  drawPolygon(ctx,[[w*.04,h*.30],[w*.085,h*.35],[w*.02,h*.36]],'#ffd21f');
  drawPolygon(ctx,[[w*.11,h*.50],[w*.145,h*.54],[w*.105,h*.555]],'#fff');
  drawPolygon(ctx,[[w*.20,h*.12],[w*.225,h*.16],[w*.19,h*.17]],'#ffd21f');
}
function splitSale(label){ const words=String(label||'BIG SALE').trim().toUpperCase().split(/\s+/); if(words.length===1) return [words[0]==='SALE'?'BIG':words[0],'SALE']; return [words[0],words.slice(1).join(' ')]; }
function drawSaleRibbon(ctx,w,h,it){
  const [top,bottom]=splitSale(it.offer||'BIG SALE');
  ctx.save(); ctx.translate(w*.075,h*.115); ctx.rotate(-0.075);
  ctx.shadowColor='rgba(0,0,0,.35)'; ctx.shadowBlur=w*.018; ctx.shadowOffsetY=h*.008;
  drawPolygon(ctx,[[0,0],[w*.285,-h*.022],[w*.257,h*.095],[w*.022,h*.112]],'#ffd21f');
  ctx.fillStyle='#06113a'; fontFit(ctx,top,w*.215,w*.064,w*.034,'900',DISPLAY_FONT); ctx.fillText(top,w*.038,h*.073);
  drawPolygon(ctx,[[0,h*.093],[w*.425,h*.052],[w*.402,h*.188],[w*.025,h*.225]],'#e21d16');
  drawPolygon(ctx,[[w*.018,h*.218],[w*.145,h*.195],[w*.11,h*.285]],'#b91110');
  ctx.fillStyle='#fff'; fontFit(ctx,bottom,w*.355,w*.088,w*.046,'900',DISPLAY_FONT); ctx.fillText(bottom,w*.042,h*.169);
  ctx.restore();
}
function drawPrice(ctx,it,t,w,h){
  const currency=($('currencyInput').value.trim()||'MVR').toUpperCase(); const amount=String(it.price||'0').trim(); const unit=it.unit?`/${it.unit}`:'';
  const x=w*.07,y=h*.595,bw=w*.365,bh=h*.255;
  ctx.shadowColor='rgba(0,0,0,.38)'; ctx.shadowBlur=w*.026; ctx.shadowOffsetY=h*.012;
  fillRound(ctx,x,y,bw,bh,w*.035,'#ffffff'); ctx.shadowColor='transparent';
  fillRound(ctx,x+w*.012,y+h*.012,bw-w*.024,bh*.72,w*.028,'#e21d16');
  ctx.strokeStyle='rgba(255,255,255,.40)'; ctx.lineWidth=w*.002; ctx.setLineDash([w*.008,w*.006]); roundRect(ctx,x+w*.025,y+h*.025,bw-w*.05,bh*.72-h*.05,w*.02); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#fff'; ctx.font=`900 ${Math.round(w*.032)}px ${BODY_FONT}`; ctx.fillText('PRICE',x+w*.04,y+h*.056);
  ctx.fillStyle='#ffd21f'; ctx.font=`900 ${Math.round(w*.047)}px ${DISPLAY_FONT}`; ctx.fillText(currency,x+w*.04,y+h*.109);
  ctx.fillStyle='#fff'; fontFit(ctx,amount,bw-w*.07,w*.122,w*.06,'900',DISPLAY_FONT); ctx.fillText(amount,x+w*.04,y+h*.202);
  if(unit){ ctx.font=`800 ${Math.round(w*.026)}px ${BODY_FONT}`; ctx.fillStyle='rgba(255,255,255,.86)'; ctx.fillText(unit,x+bw*.69,y+h*.202); }
  if(it.old_price){ const old=`WAS ${currency} ${it.old_price}`; ctx.fillStyle='#374151'; ctx.font=`900 ${Math.round(w*.029)}px ${BODY_FONT}`; ctx.fillText(old,x+w*.045,y+bh*.89); const ow=ctx.measureText(old).width; line(ctx,x+w*.165,y+bh*.875,x+w*.045+ow,y+bh*.875,'#ef4444',Math.max(4,w*.004)); }
}
async function drawItem(it,canvas){
  const [w,h]=$('sizeSelect').value.split('x').map(Number); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d');
  if(document.fonts?.ready){ try{ await document.fonts.ready; }catch(e){} }
  const t=templates[(it.category||'default').toLowerCase()]||templates.default;
  drawBackground(ctx,w,h,t);
  if(state.logoUrl){ const logo=await loadImage(state.logoUrl); fitContain(ctx,logo,w*.075,h*.04,w*.19,h*.06); }
  else { ctx.fillStyle='rgba(255,255,255,.93)'; ctx.font=`900 ${Math.round(w*.026)}px ${BODY_FONT}`; ctx.fillText('YOUR LOGO',w*.075,h*.075); }
  drawSaleRibbon(ctx,w,h,it);
  if(it.photoUrl){
    const img=await loadImage(it.photoUrl); ctx.shadowColor='rgba(0,0,0,.38)'; ctx.shadowBlur=w*.040; ctx.shadowOffsetY=h*.017;
    fitContain(ctx,img,w*.355,h*.105,w*.61,h*.51,w*.002); ctx.shadowColor='transparent';
  }
  drawPrice(ctx,it,t,w,h);
  const title=it.item_name||'Product Name';
  ctx.fillStyle='#ffffff'; fontFit(ctx,title,w*.50,w*.067,w*.038,'900',DISPLAY_FONT); let y=wrapText(ctx,title,w*.46,h*.748,w*.49,Math.round(w*.067),2);
  const desc=it.description||it.brand||'';
  if(desc){ ctx.fillStyle='rgba(255,255,255,.86)'; ctx.font=`700 ${Math.round(w*.029)}px ${BODY_FONT}`; y=wrapText(ctx,desc,w*.46,y+4,w*.45,Math.round(w*.039),2); }
  ctx.fillStyle='rgba(255,255,255,.88)'; ctx.font=`850 ${Math.round(w*.023)}px ${BODY_FONT}`; ctx.fillText(`${it.item_code?it.item_code+'  •  ':''}${it.phone||''}`,w*.075,h*.955);
}
async function previewSelected(){ const it=state.items[state.selected]; const c=$('previewCanvas'); if(!it){ const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); updateSummary(); return; } await drawItem(it,c); updateSummary(); }
function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }
$('addItemBtn').onclick=()=>addItem(); $('duplicateBtn').onclick=duplicateSelected;
$('downloadSample').onclick=()=>{ const headers=['item_name','price','category','description','unit','old_price','offer','item_code','phone','brand']; const rows=[['Fresh Tuna','80','food','Maldives local fresh tuna','kg','','BIG SALE','FD-001','9485333','Local Tuna']]; downloadBlob(new Blob([[headers,...rows].map(r=>r.map(csvEscape).join(',')).join('\n')],{type:'text/csv'}),'sample-items.csv'); };
$('csvInput').onchange=async e=>{ const f=e.target.files[0]; if(!f)return; const rows=parseCSV(await f.text()); state.items.push(...rows); state.selected=Math.max(0,state.items.length-rows.length); setStatus('csvStatus',`${rows.length} items imported. Now choose each photo.`,rows.length?'good':'bad'); renderItems(); previewSelected(); };
$('logoInput').onchange=e=>{ const f=e.target.files[0]; if(!f)return; if(state.logoUrl)URL.revokeObjectURL(state.logoUrl); state.logoUrl=URL.createObjectURL(f); setStatus('logoStatus',`Logo loaded: ${f.name}`,'good'); previewSelected(); };
$('sizeSelect').onchange=previewSelected; $('currencyInput').oninput=previewSelected;
$('downloadOneBtn').onclick=async()=>{ const it=state.items[state.selected]; if(!it)return; const c=document.createElement('canvas'); await drawItem(it,c); c.toBlob(b=>downloadBlob(b,`${(it.item_name||'product').replace(/[^a-z0-9-_]+/gi,'_')}.png`),'image/png',0.95); };
$('generateBtn').onclick=async()=>{ if(!window.JSZip){setStatus('generateStatus','ZIP library could not load. Reload with internet.','bad');return;} const ready=validItems(); if(!ready.length)return; $('generateBtn').disabled=true; const zip=new JSZip(), c=document.createElement('canvas'); for(let i=0;i<ready.length;i++){ setStatus('generateStatus',`Generating ${i+1} of ${ready.length}...`,'warn'); await drawItem(ready[i],c); const b=await new Promise(res=>c.toBlob(res,'image/png',0.95)); const safe=(ready[i].item_name||`item-${i+1}`).replace(/[^a-z0-9-_]+/gi,'_').slice(0,70); zip.file(`${String(i+1).padStart(3,'0')}_${safe}.png`,b); } const out=await zip.generateAsync({type:'blob'}); downloadBlob(out,'product-posters.zip'); setStatus('generateStatus','ZIP generated successfully.','good'); $('generateBtn').disabled=false; };
addItem({item_name:'',category:'default'});
