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
  
  const directions=['north','northeast','east','southeast','south','southwest','west','northwest'];
  let dirHTML='<div style="font-size:.82rem;color:var(--text2);margin-bottom:.4rem;"><strong>Which direction are you looking?</strong></div>';
  dirHTML+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.35rem;">';
  directions.forEach(dir=>{
    dirHTML+=`<button class="btn btn-sm" onclick="performWildernessObservation(${col},${row},'${dir}')">${dir.charAt(0).toUpperCase()+dir.slice(1)}</button>`;
  });
  dirHTML+='</div>';
  openModal('Wilderness Observation — Lead/Notice vs DD6',dirHTML);
}

function performWildernessObservation(col,row,direction){
  const leadDie=typeof getEffectiveDie==='function'?getEffectiveDie('lead'):(S.stats.lead||4);
  const leadRoll=explodingRoll(leadDie);
  const dreadRoll=explodingRoll(6);
  const success=leadRoll.total>=dreadRoll.total;
  
  let html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.4rem;">'
    +'<div style="text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);">Lead Die</div>'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--teal);">'+leadRoll.total+'</div></div>'
    +'<div style="text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);">Dread Die</div>'
    +'<div style="font-family:\'Rajdhani\',sans-serif;font-size:2rem;font-weight:700;color:var(--red);">'+dreadRoll.total+'</div></div>'
    +'</div>';
    
  if(success){
    const observedHexes=getHexesInDirection(col,row,direction,2);
    let findings='';
    observedHexes.forEach(h=>{
      if(h.type==='wilderness'&&h.data&&h.data.wonder){
        findings+=`<div style="padding:.2rem .4rem;border-left:2px solid var(--gold2);color:var(--gold2);"><strong>${h.data.wonder}</strong></div>`;
      }else if(h.type==='event'){
        findings+=`<div style="padding:.2rem .4rem;border-left:2px solid var(--red2);color:var(--red2);">🕸 <strong>${h.name}</strong> (Event)</div>`;
      }else if(h.type==='holding'||h.type==='seat'){
        findings+=`<div style="padding:.2rem .4rem;border-left:2px solid var(--gold);">🏛 <strong>${h.name}</strong> (Holding)</div>`;
      }else if(h.type==='wilderness'){
        findings+=`<div style="padding:.2rem .4rem;border-left:2px solid var(--border);">Wilderness — ${h.terrain&&h.terrain.name?h.terrain.name:'remote'}</div>`;
      }else if(h.type==='dwelling'){
        findings+=`<div style="padding:.2rem .4rem;border-left:2px solid var(--teal);">🏚 Dwelling</div>`;
      }else if(h.type==='trade'){
        findings+=`<div style="padding:.2rem .4rem;border-left:2px solid var(--gold);">🏛 Trade Route</div>`;
      }
    });
    html+=`<div style="background:rgba(46,196,182,.06);border:1px solid rgba(46,196,182,.35);padding:.4rem;"><div style="font-size:.72rem;color:var(--green2);font-weight:700;margin-bottom:.25rem;">✓ Successful Observation</div>You see ${direction}:<br>${findings||'<em style="color:var(--muted);">Just wilderness...</em>'}</div>`;
  }else{
    html+=`<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.35);padding:.4rem;"><div style="font-size:.72rem;color:var(--red2);font-weight:700;margin-bottom:.2rem;">✗ Observation Failed</div>The horizon is obscured. No details visible.</div>`;
  }
  
  openModal(`Observation — Looking ${direction}`,html);
  appendHexNote(col,row,`[Observation] Lead vs DD6 (${direction}): ${leadRoll.total} vs ${dreadRoll.total} => ${success?'success':'failure'}`);
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
  }else{
    html+=`<div style="background:rgba(200,50,50,.06);border:1px solid rgba(200,50,50,.35);padding:.4rem;color:var(--text);"><strong style="color:var(--red2);">✗ Haggle Failed</strong> — No discount.</div>`;
    showNotif('Haggle failed. No discount.','warn');
  }
  
  openModal('Haggle Check (Spirit vs DD8)',html);
}

function generateTaskForHex(col,row){
  const hex=mapData.find(h=>h.col===col&&h.row===row);
  if(!hex)return;
  
  const verbs=['Hunt','Guard','Rescue','Deliver','Investigate','Eliminate','Retrieve','Escort'];
  const targets=['Bandits','Beasts','Refugees','Cargo','Matters','Threats','Artifacts','VIPs'];
  const dirs=['north','northeast','east','southeast','south','southwest','west','northwest'];
  
  const verb=pick(verbs);
  const target=pick(targets);
  const distance=roll(4)+1;
  const dir=pick(dirs);
  
  const task={col:col,row:row,verb:verb,target:target,distance:distance,direction:dir,completed:false,createdAt:new Date().toISOString()};
  hex.data=hex.data||{};
  hex.data.task=task;
  
  // Find the destination hex
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
    destHex.data.taskSite={verb:verb,target:target,originCol:col,originRow:row};
  }
  
  let html=`<div style="font-size:.84rem;color:var(--text2);line-height:1.6;"><strong style="color:var(--gold2);">Task Generated</strong><br>${verb} ${target}, ${distance} hex${distance!==1?'es':''} to the ${dir}.<br><br>Travel to Hex [${destCol+1},${destRow+1}] and complete the task.<br><br><strong style="color:var(--gold);">Success = +1 Renown</strong></div>`;
  html+=`<div style="margin-top:.4rem;display:flex;justify-content:flex-end;"><button class="btn btn-sm btn-primary" onclick="closeModal();">Understood</button></div>`;
  
  openModal('Task Assignment',html);
  showNotif(`Task: ${verb} ${target} ${distance} hex${distance!==1?'es':''} ${dir}`,'good');
}

function completeTaskAtHex(col,row){
  const hex=mapData.find(h=>h.col===col&&h.row===row);
  if(!hex||!hex.data||!hex.data.taskSite)return;
  
  const task=hex.data.taskSite;
  S.renown=(S.renown||0)+1;
  if(typeof updateRenown==='function')updateRenown();
  
  showNotif(`Task Complete: ${task.verb} ${task.target} — +1 Renown!`,'good');
  appendHexNote(col,row,`[Task Complete] ${task.verb} ${task.target} — Renown +1`);
  
  delete hex.data.taskSite;
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
  S.renown=(S.renown||0)+1;
  if(typeof updateRenown==='function')updateRenown();
  
  showNotif(`Royal Task Complete: ${task.verb} ${task.target} — +1 Renown!`,'good');
  appendHexNote(col,row,`[Royal Task] Completed ${task.verb} ${task.target} — Renown +1`);
  
  delete hex.data.royalTask;
}
