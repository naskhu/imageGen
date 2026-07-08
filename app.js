const state = { items: [], photos: new Map(), photoUrls: new Map(), logo: null, logoUrl: null, selected: 0 };
const $ = id => document.getElementById(id);
const templates = {
  electronics:{bg:['#0f172a','#1d4ed8'],accent:'#38bdf8',text:'#ffffff',sub:'#dbeafe'},
  food:{bg:['#14532d','#16a34a'],accent:'#facc15',text:'#ffffff',sub:'#ecfccb'},
  hardware:{bg:['#27272a','#dc2626'],accent:'#fbbf24',text:'#ffffff',sub:'#fee2e2'},
  fashion:{bg:['#581c87','#db2777'],accent:'#f9a8d4',text:'#ffffff',sub:'#fce7f3'},
  default:{bg:['#111827','#334155'],accent:'#38bdf8',text:'#ffffff',sub:'#cbd5e1'}
};
function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"' && q && n==='"'){cell+='"'; i++;}
    else if(c==='"'){q=!q;}
    else if(c===',' && !q){row.push(cell.trim()); cell='';}
    else if((c==='\n'||c==='\r') && !q){ if(cell || row.length){row.push(cell.trim()); rows.push(row); row=[]; cell='';} if(c==='\r'&&n==='\n')i++; }
    else cell+=c;
  }
  if(cell || row.length){row.push(cell.trim()); rows.push(row);}
  if(!rows.length) return [];
  const headers=rows.shift().map(h=>h.trim().toLowerCase());
  return rows.filter(r=>r.some(Boolean)).map((r,idx)=>{
    const obj={_row:idx+2}; headers.forEach((h,i)=>obj[h]=r[i]||''); return obj;
  });
}
function csvEscape(v){ v=String(v??''); return /[",\n]/.test(v)?`"${v.replaceAll('"','""')}"`:v; }
function setStatus(id,msg,cls='muted'){ $(id).className='status '+cls; $(id).textContent=msg; }
function normalizeName(name){ return String(name||'').trim().toLowerCase(); }
function missingItems(){ return state.items.filter(it=>!state.photos.has(normalizeName(it.photo_filename))); }
function canGenerate(){ return state.items.length>0 && missingItems().length===0; }
function updateSummary(){
  const miss=missingItems().length;
  $('summaryText').textContent = state.items.length ? `${state.items.length} items imported • ${state.photos.size} photos uploaded • ${miss} missing photos` : 'Waiting for data.';
  $('generateBtn').disabled=!canGenerate(); $('previewBtn').disabled=state.items.length===0 || miss===state.items.length;
  if(state.items.length && miss) setStatus('generateStatus', `${miss} item(s) missing matching product photos. Fix before generating.`, 'bad');
  else if(canGenerate()) setStatus('generateStatus','Ready to generate all images.','good');
}
function renderTable(){
  const tbody=$('itemsTable'), q=$('searchInput').value.toLowerCase(); tbody.innerHTML='';
  let list=state.items.map((it,i)=>({it,i})).filter(x=>JSON.stringify(x.it).toLowerCase().includes(q));
  if(!list.length){ tbody.innerHTML='<tr><td colspan="5" class="empty">No matching items.</td></tr>'; updateSummary(); return; }
  for(const {it,i} of list){
    const has=state.photos.has(normalizeName(it.photo_filename));
    const tr=document.createElement('tr'); if(i===state.selected) tr.classList.add('selected');
    tr.innerHTML=`<td><span class="badge ${has?'ok':'no'}">${has?'PHOTO OK':'MISSING'}</span></td>
      <td><strong>${escapeHtml(it.item_name||'Unnamed')}</strong><br><span class="small">${escapeHtml(it.description||it.brand||'')}</span></td>
      <td>${escapeHtml(it.category||'default')}</td><td>${escapeHtml(it.price||'')}</td><td>${escapeHtml(it.photo_filename||'')}</td>`;
    tr.onclick=()=>{state.selected=i; renderTable(); previewSelected();}; tbody.appendChild(tr);
  }
  updateSummary();
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function loadImage(src){ return new Promise((res,rej)=>{ const img=new Image(); img.onload=()=>res(img); img.onerror=rej; img.src=src; }); }
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function fitImage(ctx,img,x,y,w,h){ const ir=img.width/img.height, r=w/h; let dw=w,dh=h,dx=x,dy=y; if(ir>r){dh=w/ir; dy=y+(h-dh)/2;} else {dw=h*ir; dx=x+(w-dw)/2;} ctx.drawImage(img,dx,dy,dw,dh); }
function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines){
  const words=String(text||'').split(/\s+/); let line='', lines=[];
  for(const word of words){ const t=line?line+' '+word:word; if(ctx.measureText(t).width>maxWidth && line){lines.push(line); line=word;} else line=t; }
  if(line) lines.push(line); lines=lines.slice(0,maxLines); lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight)); return y+lines.length*lineHeight;
}
async function drawItem(item, canvas){
  const [w,h]=$('sizeSelect').value.split('x').map(Number); canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext('2d'); const key=(item.category||'default').toLowerCase(); const t=templates[key]||templates.default;
  const grad=ctx.createLinearGradient(0,0,w,h); grad.addColorStop(0,t.bg[0]); grad.addColorStop(1,t.bg[1]); ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.10)'; ctx.beginPath(); ctx.arc(w*0.82,h*0.12,w*.28,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(w*0.1,h*0.86,w*.22,0,Math.PI*2); ctx.fill();
  const imgUrl=state.photoUrls.get(normalizeName(item.photo_filename));
  if(imgUrl){ const img=await loadImage(imgUrl); ctx.fillStyle='#ffffff'; roundRect(ctx,w*.08,h*.17,w*.84,h*.48,34); ctx.fill(); fitImage(ctx,img,w*.11,h*.20,w*.78,h*.42); }
  if(state.logoUrl){ const logo=await loadImage(state.logoUrl); fitImage(ctx,logo,w*.07,h*.045,w*.22,h*.075); }
  ctx.fillStyle=t.accent; roundRect(ctx,w*.07,h*.69,w*.34,h*.085,22); ctx.fill(); ctx.fillStyle='#07111f'; ctx.font=`800 ${Math.round(w*.042)}px Arial`; ctx.fillText((item.offer||'SPECIAL').toUpperCase(),w*.095,h*.745);
  ctx.fillStyle=t.text; ctx.font=`900 ${Math.round(w*.058)}px Arial`; let y=wrapText(ctx,item.item_name,w*.07,h*.84,w*.72,Math.round(w*.066),2);
  ctx.fillStyle=t.sub; ctx.font=`500 ${Math.round(w*.028)}px Arial`; y=wrapText(ctx,item.description||item.brand||'',w*.07,y+8,w*.70,Math.round(w*.038),2);
  const currency=$('currencyInput').value.trim(); const priceText=`${currency} ${item.price}${item.unit?' / '+item.unit:''}`;
  ctx.fillStyle='#ffffff'; roundRect(ctx,w*.58,h*.705,w*.35,h*.13,28); ctx.fill(); ctx.fillStyle=t.bg[1]; ctx.font=`900 ${Math.round(w*.052)}px Arial`; ctx.fillText(priceText,w*.61,h*.785);
  if(item.old_price){ctx.strokeStyle='#ef4444'; ctx.lineWidth=5; ctx.font=`600 ${Math.round(w*.028)}px Arial`; ctx.fillStyle='#64748b'; ctx.fillText(`${currency} ${item.old_price}`,w*.615,h*.835); ctx.beginPath(); ctx.moveTo(w*.61,h*.824); ctx.lineTo(w*.79,h*.824); ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font=`600 ${Math.round(w*.022)}px Arial`; ctx.fillText(`${item.item_code?item.item_code+'  •  ':''}${item.phone||''}`,w*.07,h*.965);
}
async function previewSelected(){ if(!state.items.length) return; await drawItem(state.items[state.selected]||state.items[0], $('previewCanvas')); }
function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }
$('downloadSample').onclick=()=>{
  const headers=['item_name','price','category','photo_filename','description','unit','old_price','offer','item_code','phone','brand'];
  const rows=[['iPhone Charger','120','electronics','charger.jpg','Fast USB-C charging adapter','pc','150','NEW','EL-001','9485333',''],['Fresh Tuna','80','food','tuna.jpg','Maldives local fresh tuna','kg','','FRESH','FD-001','9485333','Local Tuna']];
  downloadBlob(new Blob([[headers,...rows].map(r=>r.map(csvEscape).join(',')).join('\n')],{type:'text/csv'}),'sample-items.csv');
};
$('csvInput').onchange=async e=>{ const f=e.target.files[0]; if(!f)return; state.items=parseCSV(await f.text()); state.selected=0; setStatus('csvStatus',`${state.items.length} items imported from ${f.name}.`,'good'); renderTable(); previewSelected(); };
$('photoInput').onchange=e=>{ for(const f of e.target.files){ const k=normalizeName(f.name); state.photos.set(k,f); if(state.photoUrls.has(k)) URL.revokeObjectURL(state.photoUrls.get(k)); state.photoUrls.set(k,URL.createObjectURL(f)); } setStatus('photoStatus',`${state.photos.size} photos uploaded.`,'good'); renderTable(); previewSelected(); };
$('logoInput').onchange=e=>{ const f=e.target.files[0]; if(!f)return; state.logo=f; if(state.logoUrl) URL.revokeObjectURL(state.logoUrl); state.logoUrl=URL.createObjectURL(f); setStatus('logoStatus',`Logo loaded: ${f.name}`,'good'); previewSelected(); };
$('searchInput').oninput=renderTable; $('previewBtn').onclick=previewSelected; $('sizeSelect').onchange=previewSelected; $('currencyInput').oninput=previewSelected;
$('generateBtn').onclick=async()=>{
  if(!window.JSZip){ setStatus('generateStatus','ZIP library could not load. Check internet connection and reload.','bad'); return; }
  const miss=missingItems(); if(miss.length){ setStatus('generateStatus',`${miss.length} missing photos. Cannot generate.`, 'bad'); return; }
  $('generateBtn').disabled=true; const zip=new JSZip(); const canvas=document.createElement('canvas');
  for(let i=0;i<state.items.length;i++){
    setStatus('generateStatus',`Generating ${i+1} of ${state.items.length}...`,'warn'); await drawItem(state.items[i],canvas);
    const blob=await new Promise(res=>canvas.toBlob(res,'image/png',0.95));
    const safe=(state.items[i].item_name||`item-${i+1}`).replace(/[^a-z0-9-_]+/gi,'_').slice(0,70);
    zip.file(`${String(i+1).padStart(3,'0')}_${safe}.png`, blob);
  }
  const out=await zip.generateAsync({type:'blob'}); downloadBlob(out,'generated-product-posts.zip'); setStatus('generateStatus','ZIP generated successfully.','good'); $('generateBtn').disabled=false;
};
renderTable();
