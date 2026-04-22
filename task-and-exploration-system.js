// task-and-exploration-system.js
// Adds task system for Holdings, wilderness exploration, enhanced encounters, and approach dropdowns

function getApproachGroups(){
  return{
    'Combat':{stats:['strike','shoot','defend']},
    'Physical':{stats:['body']},
    'Social':{stats:['spirit','lead']},
    'Mental':{stats:['control','mind']}
  };
}

function buildApproachSelectHTML(selectedStat){
  if(!selectedStat)selectedStat='lead';
  let h='';
  const groups=getApproachGroups();
  Object.entries(groups).forEach(([approach,details])=>{
    h+=`<optgroup label="${approach}">`;
    details.stats.forEach(stat=>{
      const sel=stat===selectedStat?'selected':'';
      h+=`<option value="${stat}" ${sel}>${stat.toUpperCase()}</option>`;
    });
    h+='</optgroup>';
  });
  return h;
}

function promiseWildernessExploration(col,row){
  const hex=mapData.find(h=>h.col===col&&h.row===row);
  if(!hex||hex.type!=='wilderness')return;
  const options=getAvailableObservationDirections(col,row);
  if(!options.length){
    showNotif('No adjacent hexes available to observe from this edge.','warn');
    return;
  }
  let html='<div style="font-size:.82rem;color:var(--text2);margin-bottom:.35rem;">Choose one adjacent direction to observe (Lead vs DD6).</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.3rem;">';
  options.forEach(opt=>{
    html+=`<button class="btn btn-sm btn-gold" onclick="performWildernessObservation(${col},${row},'${opt.key}')">${opt.label}</button>`;
  });
  html+='</div>';
  openModal('Observe Adjacent Hex',html);
}

function performWildernessObservation(col,row,directionKey){
  const leadDie=typeof getEffectiveDie==='function'?getEffectiveDie('lead'):(S.stats.lead||4);
  const leadRoll=explodingRoll(leadDie);
  const dreadRoll=explodingRoll(6);
  const success=leadRoll.total>=dreadRoll.total;
  const target=getAdjacentHexByDirection(col,row,directionKey);
  
  let html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.4rem;">'
    +'<div style="text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);">Lead Die</div>'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--teal);">'+leadRoll.total+'</div></div>'
    +'<div style="text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);">Dread Die</div>'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--red);">'+dreadRoll.total+'</div></div>'
    +'</div>';
    
  if(success){
    if(typeof addSuccessRoll==='function')addSuccessRoll();
    if(!target){
      html+=`<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.35);padding:.4rem;"><div style="font-size:.72rem;color:var(--red2);font-weight:700;margin-bottom:.2rem;">No Adjacent Hex</div>There is no mapped hex in that direction.</div>`;
    }else{
      // Assign a wonder to the target hex if it doesn't have one yet
      if(target.hex.type==='wilderness'&&!target.hex.data.wonder&&target.hex.terrain&&typeof pick==='function'){
        const terrainData=TERRAIN_DESC[target.hex.terrain.name];
        if(terrainData&&terrainData.wonder&&Array.isArray(terrainData.wonder)){
          if(!target.hex.data)target.hex.data={};
          target.hex.data.wonder=pick(terrainData.wonder);
        }
      }
      html+=`<div style="background:rgba(46,196,182,.06);border:1px solid rgba(46,196,182,.35);padding:.4rem;"><div style="font-size:.72rem;color:var(--green2);font-weight:700;margin-bottom:.25rem;">✓ Successful Observation (${target.label})</div><div style="padding:.22rem .42rem;border-left:2px solid rgba(201,162,39,.4);">${formatObservedHexSummary(target.hex)}</div></div>`;
    }
  }else{
    if(typeof addTMWOnFail==='function')addTMWOnFail();
    html+=`<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.35);padding:.4rem;"><div style="font-size:.72rem;color:var(--red2);font-weight:700;margin-bottom:.2rem;">✗ Observation Failed</div>The horizon is obscured. No details visible.</div>`;
  }
  
  openModal('Observation — Adjacent Hexes',html);
  appendHexNote(col,row,`[Observation] Lead vs DD6 (${directionKey||'adjacent'}): ${leadRoll.total} vs ${dreadRoll.total} => ${success?'success':'failure'}`);
}

function getAvailableObservationDirections(col,row){
  const dirs=[
    {key:'north',label:'North',dc:0,dr:-1},
    {key:'northeast',label:'Northeast',dc:1,dr:-1},
    {key:'east',label:'East',dc:1,dr:0},
    {key:'southeast',label:'Southeast',dc:1,dr:1},
    {key:'south',label:'South',dc:0,dr:1},
    {key:'southwest',label:'Southwest',dc:-1,dr:1},
    {key:'west',label:'West',dc:-1,dr:0},
    {key:'northwest',label:'Northwest',dc:-1,dr:-1}
  ];
  return dirs.filter(d=>mapData.some(h=>h.col===col+d.dc&&h.row===row+d.dr));
}

function getAdjacentHexByDirection(col,row,directionKey){
  const dirs=getAvailableObservationDirections(col,row);
  const d=dirs.find(x=>x.key===directionKey);
  if(!d)return null;
  const hex=mapData.find(h=>h.col===col+d.dc&&h.row===row+d.dr);
  if(!hex)return null;
  return {hex:hex,label:d.label};
}

function getAdjacentHexes(col,row){
  const offsets=[
    [-1,-1],[0,-1],[1,-1],
    [-1,0],        [1,0],
    [-1,1], [0,1], [1,1]
  ];
  const out=[];
  offsets.forEach(([dc,dr])=>{
    const h=mapData.find(x=>x.col===col+dc&&x.row===row+dr);
    if(h)out.push(h);
  });
  return out;
}

function formatObservedHexSummary(hex){
  if(hex.type==='wilderness'){
    const wonder=(hex.data&&hex.data.wonder)?hex.data.wonder:'';
    const terrain=hex.terrain&&hex.terrain.name?hex.terrain.name:'Unknown';
    return wonder
      ? `<strong>${terrain}</strong><div style="margin-top:.25rem;font-style:italic;color:var(--gold);">${wonder}</div>`
      : `<strong>${terrain}</strong> — no obvious wonder visible.`;
  }

  if(hex.type==='gate'){
    const d=hex.data||{};
    const terrain=hex.terrain&&hex.terrain.name?hex.terrain.name:'Unknown';
    const gateName=hex.name||'Gate';
    const detail=d.fn||d.leads||d.where||'Unknown destination';
    return `<strong>Gate</strong> — ${gateName}: ${detail} into ${terrain} terrain.`;
  }

  if(hex.type==='temple'){
    const d=hex.data||{};
    return `<strong>Temple</strong> — ${hex.name||'Sanctuary'}. ${d.mood||'Ancient'}.`;
  }

  if(hex.type==='holding'||hex.type==='seat'||hex.type==='dwelling'){
    const d=hex.data||{};
    const kind=hex.type.charAt(0).toUpperCase()+hex.type.slice(1);
    const general=(d.style&&d.feature)?`${d.style} ${d.feature}`:(d.news||d.mood?.mood||hex.name||'Settlement activity');
    return `<strong>${kind}</strong> — ${general}.`;
  }

  if(hex.type==='event')return `<strong>Event</strong> — ${hex.name||'Omen Site'}.`;
  if(hex.type==='trade')return '<strong>Trade Route</strong> — caravan traffic and roadside posts.';
  if(hex.type==='ruins'||hex.type==='lostcity'||hex.type==='gate'||hex.type==='barrier'||hex.type==='peril'||hex.type==='monument'){
    const kind=hex.type.charAt(0).toUpperCase()+hex.type.slice(1);
    return `<strong>${kind}</strong> — ${hex.name||'Ancient construction'}.`;
  }

  return '<strong>Unknown</strong> — distant forms on the horizon.';
}

function getHexesInDirection(col,row,direction,range){
  const hexes=[];
  for(let i=1;i<=range;i++){
    let nc=col,nr=row;
    switch(direction){
      case 'north': nr-=i; break;
      case 'south': nr+=i; break;
      case 'east': nc+=i; break;
      case 'west': nc-=i; break;
      case 'northeast': nc+=i; nr-=i; break;
      case 'northwest': nc-=i; nr-=i; break;
      case 'southeast': nc+=i; nr+=i; break;
      case 'southwest': nc-=i; nr+=i; break;
    }
    const h=mapData.find(x=>x.col===nc&&x.row===nr);
    if(h)hexes.push(h);
  }
  return hexes;
}

function haggleMerchantCaravan(col,row){
  const spiritDie=typeof getEffectiveDie==='function'?getEffectiveDie('spirit'):(S.stats.spirit||4);
  const spiritRoll=explodingRoll(spiritDie);
  const dreadRoll=explodingRoll(8);
  const success=spiritRoll.total>=dreadRoll.total;
  
  let html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.4rem;">'
    +'<div style="text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);">Your Spirit</div>'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--teal);">'+spiritRoll.total+'</div></div>'
    +'<div style="text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);">Merchant Resolve</div>'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--red);">'+dreadRoll.total+'</div></div>'
    +'</div>';
  
  if(success){
    S.data=S.data||{};
    S.data.haggleDiscount=true;
    html+=`<div style="background:rgba(46,196,182,.06);border:1px solid rgba(46,196,182,.35);padding:.4rem;color:var(--text);"><strong style="color:var(--green2);">✓ Haggle Success</strong> — Items cost 20% less!</div>`;
    showNotif('Haggle success! Merchant gives better prices.','good');
    if(typeof addSuccessRoll==='function')addSuccessRoll();
  }else{
    html+=`<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.35);padding:.4rem;color:var(--text);"><strong style="color:var(--red2);">✗ Haggle Failed</strong> — No discount.</div>`;
    showNotif('Haggle failed. No discount.','warn');
    if(typeof addTMWOnFail==='function')addTMWOnFail();
  }
  
  openModal('Haggle Check (Spirit vs DD8)',html);
}

function generateTaskForHex(col,row){
  const hex=mapData.find(h=>h.col===col&&h.row===row);
  if(!hex)return;
  
  const verbs=['Hunt','Guard','Rescue','Deliver','Investigate','Eliminate','Retrieve','Escort'];
  const targets=['Bandits','Beasts','Refugees','Cargo','Matters','Threats','Artifacts','VIPs'];
  const dirs=['north','northeast','east','southeast','south','southwest','west','northwest'];
  
  const candidates=[];
  dirs.forEach(dir=>{
    const distance=roll(4)+1;
    let destCol=col,destRow=row;
    for(let i=0;i<distance;i++){
      switch(dir){
        case 'north': destRow--; break;
        case 'south': destRow++; break;
        case 'east': destCol++; break;
        case 'west': destCol--; break;
        case 'northeast': destCol++; destRow--; break;
        case 'northwest': destCol--; destRow--; break;
        case 'southeast': destCol++; destRow++; break;
        case 'southwest': destCol--; destRow++; break;
      }
    }
    const destHex=mapData.find(h=>h.col===destCol&&h.row===destRow);
    if(destHex)candidates.push({dir:dir,distance:distance,destCol:destCol,destRow:destRow});
  });
  if(!candidates.length){showNotif('No valid task destination found from this holding.','warn');return;}

  const targetSpec=pick(candidates);
  const verb=pick(verbs);
  const target=pick(targets);
  const distance=targetSpec.distance;
  const dir=targetSpec.dir;
  const destCol=targetSpec.destCol;
  const destRow=targetSpec.destRow;

  let html=`<div style="font-size:.84rem;color:var(--text2);line-height:1.6;"><strong style="color:var(--gold2);">Task Offer</strong><br>${verb} ${target}, ${distance} hex${distance!==1?'es':''} to the ${dir}.<br><br>Destination: Hex [${destCol+1},${destRow+1}]<br><br><strong style="color:var(--gold);">Success = +1 Renown</strong></div>`;
  html+=`<div style="margin-top:.4rem;display:flex;justify-content:flex-end;gap:.3rem;"><button class="btn btn-sm btn-warn" onclick="closeModal();">Decline</button><button class="btn btn-sm btn-success" onclick="acceptGeneratedHoldingTask(${col},${row},'${verb}','${target}',${distance},'${dir}',${destCol},${destRow});">Accept Task</button></div>`;

  openModal('Task Assignment',html);
}

function acceptGeneratedHoldingTask(col,row,verb,target,distance,dir,destCol,destRow){
  const originHex=mapData.find(h=>h.col===col&&h.row===row);
  const destHex=mapData.find(h=>h.col===destCol&&h.row===destRow);
  if(!originHex||!destHex){showNotif('Task destination could not be resolved.','warn');return;}

  originHex.data=originHex.data||{};
  originHex.data.task={col:col,row:row,verb:verb,target:target,distance:distance,direction:dir,completed:false,createdAt:new Date().toISOString()};
  destHex.data=destHex.data||{};
  destHex.data.taskSite={verb:verb,target:target,originCol:col,originRow:row};

  showNotif(`Task accepted: ${verb} ${target} ${distance} hex${distance!==1?'es':''} ${dir}`,'good');
  appendHexNote(col,row,`[Task Accepted] ${verb} ${target} — destination [${destCol+1},${destRow+1}]`);
  closeModal();
  if(typeof renderHexMap==='function')renderHexMap();
}

function completeTaskAtHex(col,row){
  const hex=mapData.find(h=>h.col===col&&h.row===row);
  if(!hex||!hex.data||!hex.data.taskSite)return;

  const task=hex.data.taskSite;
  const councilTaskId=task.councilTaskId;
  const adDie=(S.stats&&S.stats.adventure)?S.stats.adventure:4;
  const a=explodingRoll(adDie);
  const d=explodingRoll(8);
  const success=a.total>=d.total;

  if(success){
    S.renown=(S.renown||0)+1;
    if(typeof updateRenown==='function')updateRenown();
    if(typeof addSuccessRoll==='function')addSuccessRoll();
    showNotif(`Task Complete: ${task.verb} ${task.target} — +1 Renown!`,'good');
    appendHexNote(col,row,`[Task Complete] ${task.verb} ${task.target}: AD${adDie} ${a.total} vs DD8 ${d.total} — success, Renown +1`);
    if(councilTaskId&&typeof onHoldingCouncilTaskResolved==='function')onHoldingCouncilTaskResolved(councilTaskId,true);
    delete hex.data.taskSite;
  }else{
    if(typeof addTMWOnFail==='function')addTMWOnFail();
    showNotif(`Task Failed: ${task.verb} ${task.target} (${a.total} vs ${d.total})`,'warn');
    appendHexNote(col,row,`[Task Failed] ${task.verb} ${task.target}: AD${adDie} ${a.total} vs DD8 ${d.total}`);
    if(councilTaskId&&typeof onHoldingCouncilTaskResolved==='function')onHoldingCouncilTaskResolved(councilTaskId,false);
  }
}

function handleRoyalCaravanEncounter(col,row){
  const verbs=['Hunt','Guard','Rescue','Deliver','Investigate','Eliminate','Retrieve','Escort'];
  const targets=['Bandits','Beasts','Refugees','Cargo','Matters','Threats','Artifacts','VIPs'];
  const dirs=['north','northeast','east','southeast','south','southwest','west','northwest'];
  
  const verb=pick(verbs);
  const target=pick(targets);
  const distance=roll(4)+1;
  const dir=pick(dirs);
  
  let html=`<div style="font-size:.84rem;color:var(--text2);line-height:1.6;"><strong style="color:var(--gold2);">Royal Caravan Encounter</strong><br><br>The Royal Caravan demands payment: <strong>50₵</strong> tax to pass safely.<br><br>Or complete a task for them:<br><strong style="color:var(--gold);">${verb} ${target}, ${distance} hex${distance!==1?'es':''} to the ${dir}.</strong><br><br>Task completion: +1 Renown</div>`;
  html+=`<div style="margin-top:.4rem;display:flex;justify-content:flex-end;gap:.3rem;"><button class="btn btn-sm btn-warn" onclick="payRoyalCaravanTax(${col},${row},50);">Pay 50₵ Tax</button><button class="btn btn-sm btn-success" onclick="acceptRoyalCaravanTask(${col},${row},'${verb}','${target}',${distance},'${dir}');">Accept Task</button></div>`;
  
  openModal('Royal Caravan',html);
}

function payRoyalCaravanTax(col,row,amount){
  if(S.credits<amount){showNotif(`Not enough credits (need ${amount}₵)`,'warn');return;}
  S.credits-=amount;
  showNotif(`Paid ${amount}₵ tax to Royal Caravan`,'info');
  if(typeof updateCreditsUI==='function')updateCreditsUI();
  appendHexNote(col,row,`[Royal Caravan] Paid ${amount}₵ tax`);
  closeModal();
}

function acceptRoyalCaravanTask(col,row,verb,target,distance,dir){
  let destCol=col,destRow=row;
  for(let i=0;i<distance;i++){
    switch(dir){
      case 'north': destRow--; break;
      case 'south': destRow++; break;
      case 'east': destCol++; break;
      case 'west': destCol--; break;
      case 'northeast': destCol++; destRow--; break;
      case 'northwest': destCol--; destRow--; break;
      case 'southeast': destCol++; destRow++; break;
      case 'southwest': destCol--; destRow++; break;
    }
  }
  
  const destHex=mapData.find(h=>h.col===destCol&&h.row===destRow);
  if(destHex){
    destHex.data=destHex.data||{};
    destHex.data.royalTask={verb:verb,target:target,originCol:col,originRow:row};
  }
  
  showNotif(`Task Accepted: ${verb} ${target} ${distance} hex${distance!==1?'es':''} ${dir}`,'good');
  appendHexNote(col,row,`[Royal Caravan] Accepted task: ${verb} ${target}`);
  closeModal();
}

function completeRoyalTask(col,row){
  const hex=mapData.find(h=>h.col===col&&h.row===row);
  if(!hex||!hex.data||!hex.data.royalTask)return;

  const task=hex.data.royalTask;
  const adDie=(S.stats&&S.stats.adventure)?S.stats.adventure:4;
  const a=explodingRoll(adDie);
  const d=explodingRoll(8);
  const success=a.total>=d.total;

  if(success){
    S.renown=(S.renown||0)+1;
    if(typeof updateRenown==='function')updateRenown();
    if(typeof addSuccessRoll==='function')addSuccessRoll();
    showNotif(`Royal Task Complete: ${task.verb} ${task.target} — +1 Renown!`,'good');
    appendHexNote(col,row,`[Royal Task Complete] ${task.verb} ${task.target}: AD${adDie} ${a.total} vs DD8 ${d.total} — success, Renown +1`);
    delete hex.data.royalTask;
  }else{
    if(typeof addTMWOnFail==='function')addTMWOnFail();
    showNotif(`Royal Task Failed: ${task.verb} ${task.target} (${a.total} vs ${d.total})`,'warn');
    appendHexNote(col,row,`[Royal Task Failed] ${task.verb} ${task.target}: AD${adDie} ${a.total} vs DD8 ${d.total}`);
  }
}
