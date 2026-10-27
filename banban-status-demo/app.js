const $ = id => document.getElementById(id);
let snapshot, filter = 'notification', lastOk = null, fetchError = '';
const labels = {running:['🟢','執行中'],complete:['✅','最近完成'],checkpoint:['📍','完成進度'],error:['🚨','異常'],unknown:['⚪','待確認'],triggered:['✅','排程已觸發'],upcoming:['🔔','待觸發'],due:['⏳','到點，等待排程回報'],unverified:['⚪','執行未確認']};
function card(icon, title, meta, time='', status='') {
  const row=document.createElement('div'); row.className='card'+(status?` s-${status}`:'');
  const i=document.createElement('span');i.className='icon';i.textContent=icon;i.setAttribute('aria-hidden','true');
  const text=document.createElement('div');text.className='text';
  const n=document.createElement('div');n.className='name';n.textContent=title;
  const m=document.createElement('div');m.className='meta';m.textContent=meta;
  text.append(n,m);row.append(i,text);
  if(time){const t=document.createElement('span');t.className='time';t.textContent=time;row.append(t)}
  return row;
}
function notice(level, text){const a=document.createElement('div');a.className=`alert ${level}`;a.textContent=text;return a}
function renderAlerts(){
  const box=$('alerts'), out=[];
  if(fetchError)out.push(notice('warn',`⚠️ 資料暫時無法更新（${fetchError}）`+(lastOk?`，畫面停在 ${lastOk} 的狀態`:'')));
  if(snapshot){
    if(snapshot.source_stale)out.push(notice('warn',`⚠️ 排程資料${snapshot.source_updated?`自 ${snapshot.source_updated.slice(11,16)} 起`:''}未更新，狀態可能落後`));
    const errors=[...snapshot.workers.filter(x=>x.status==='error'),...snapshot.timeline.filter(x=>x.status==='error')];
    const names=[...new Set(errors.map(x=>x.name))];
    if(names.length)out.push(notice('error',`🚨 ${names.length} 項異常：${names.join('、')}`));
    if(snapshot.unreadable?.length)out.push(notice('warn',`⚪ ${snapshot.unreadable.length} 個排程無法解析，未列入時間軸`));
  }
  box.replaceChildren(...out);
}
function render(){renderAlerts();if(!snapshot)return;
  const data=snapshot, timeline=data.timeline.filter(x=>filter==='all'||x.delivery==='notification'||x.delivery==='reminder');
  $('stamp').textContent='互動展示 · 虛構範例';
  $('running-count').textContent=data.running.length+data.workers.filter(x=>x.status==='running').length;
  $('today-count').textContent=new Set(timeline.map(x=>x.id)).size;
  $('upcoming-count').textContent=new Set(timeline.filter(x=>x.status==='upcoming'||x.status==='due').map(x=>x.id)).size;
  const work=$('work');work.replaceChildren();
  for(const x of data.running)work.append(card('🟢',x.name,'排程正在執行','','running'));
  for(const x of data.workers){const [icon,label]=labels[x.status]||labels.unknown;work.append(card(icon,x.name,`${label} · ${x.detail} · 更新 ${x.updated?.slice(11,16)||'未知'}`,'',x.status))}
  if(!work.children.length)work.append(card('⚪','目前沒有可確認的執行中工作','未有紀錄不等於系統故障'));
  const list=$('timeline');list.replaceChildren();
  for(const x of timeline){const [icon,label]=labels[x.status]||labels.unknown;let meta=label;
    if(x.recurring)meta+=' · 定期巡檢（僅列最近／下次）';
    if(x.conditional)meta+=' · 條件式／可能不發通知';
    if(x.delivery==='internal')meta+=' · 內部工作';
    list.append(card(icon,x.name,meta,x.at.slice(11,16),x.status))}
  if(!timeline.length){const e=document.createElement('div');e.className='empty';e.textContent='今天沒有符合篩選的排程';list.append(e)}
  $('paused-count').textContent=`(${data.paused.length})`;
  const paused=$('paused');paused.replaceChildren(...data.paused.map(x=>card('⏸️',x.name,'已暫停，不列入今日待辦','','paused')));
}
async function refresh(){try{const response=await fetch('./demo.json',{cache:'no-store'});if(!response.ok)throw Error(`HTTP ${response.status}`);snapshot=await response.json();fetchError='';lastOk='範例';$('error').textContent=''}catch(e){fetchError=e.message;$('error').textContent=`範例無法載入：${e.message}`}render()}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b===button));render()}));
refresh();
