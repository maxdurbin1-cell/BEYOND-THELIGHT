(function(){
  function clamp(num,min,max){
    return Math.max(min,Math.min(max,num));
  }

  function snapRivalDreadDie(v){
    var chain=[4,6,8,10,12,20];
    var n=Math.max(4,Number(v)||4);
    var best=chain[0];
    for(var i=0;i<chain.length;i++){
      if(chain[i]<=n)best=chain[i];
      else break;
    }
    return best;
  }

  function shiftRivalDread(dread,steps){
    var chain=[4,6,8,10,12,20];
    var base=snapRivalDreadDie(dread);
    var idx=chain.indexOf(base);
    if(idx<0)idx=2;
    var next=clamp(idx+Number(steps||0),0,chain.length-1);
    return chain[next];
  }

  function ensureRivalState(){
    if(typeof S==='undefined'||!S||typeof S!=='object')return null;
    if(!S.rival||typeof S.rival!=='object'){
      var baseName='The Rival';
      if(S.backstory&&typeof S.backstory.rival==='string'&&S.backstory.rival.trim())baseName=S.backstory.rival.trim();
      S.rival={
        name:baseName,
        title:'Shadow Counterpart',
        dread:8,
        rapport:0,
        threatTier:1,
        alive:true,
        faction:'none',
        status:'rising',
        encounters:0,
        combatWins:0,
        combatLosses:0,
        defeatCount:0,
        lastOutcome:'',
        lastMap:'',
        history:[],
        lastGateToken:''
      };
    }
    var r=S.rival;
    if(typeof r.name!=='string'||!r.name.trim())r.name='The Rival';
    if(typeof r.title!=='string')r.title='Shadow Counterpart';
    if(typeof r.dread!=='number')r.dread=8;
    if(typeof r.rapport!=='number')r.rapport=0;
    if(typeof r.threatTier!=='number')r.threatTier=1;
    if(typeof r.alive!=='boolean')r.alive=true;
    if(typeof r.faction!=='string')r.faction='none';
    if(typeof r.status!=='string')r.status='rising';
    if(typeof r.encounters!=='number')r.encounters=0;
    if(typeof r.combatWins!=='number')r.combatWins=0;
    if(typeof r.combatLosses!=='number')r.combatLosses=0;
    if(typeof r.defeatCount!=='number')r.defeatCount=0;
    if(typeof r.lastOutcome!=='string')r.lastOutcome='';
    if(typeof r.lastMap!=='string')r.lastMap='';
    if(!Array.isArray(r.history))r.history=[];
    if(typeof r.lastGateToken!=='string')r.lastGateToken='';
    r.dread=snapRivalDreadDie(r.dread||8);
    r.rapport=clamp(Math.round(r.rapport||0),-8,8);
    r.threatTier=clamp(Math.round(r.threatTier||1),1,10);
    return r;
  }

  function getPhaseGateToken(){
    try{
      if(typeof getCurrentTravelPhaseToken==='function')return String(getCurrentTravelPhaseToken());
      if(typeof getGameDatePhaseText==='function')return String(getGameDatePhaseText());
    }catch(_err){}
    var d=new Date();
    return [d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours()].join('|');
  }

  function rivalRoll(n){
    if(typeof roll==='function')return roll(n);
    return Math.floor(Math.random()*n)+1;
  }

  function rivalActionRoll(stat,dreadDie){
    var die=4;
    if(typeof getEffectiveDie==='function')die=getEffectiveDie(stat||'lead')||4;
    else if(S&&S.stats&&typeof S.stats[stat]==='number')die=S.stats[stat];
    var actor=(typeof explodingRoll==='function')?explodingRoll(die):{total:rivalRoll(die)};
    var dread=(typeof explodingRoll==='function')?explodingRoll(dreadDie||8):{total:rivalRoll(dreadDie||8)};
    return {
      actorTotal:Number(actor&&actor.total||0),
      dreadTotal:Number(dread&&dread.total||0),
      success:Number(actor&&actor.total||0)>=Number(dread&&dread.total||0),
      die:die,
      dreadDie:dreadDie||8
    };
  }

  function addRivalHistory(text){
    var r=ensureRivalState();
    if(!r)return;
    r.history.push({at:Date.now(),text:String(text||'')});
    if(r.history.length>24)r.history=r.history.slice(r.history.length-24);
  }

  function syncRivalStatus(){
    var r=ensureRivalState();
    if(!r)return;
    if(!r.alive){
      r.status='fallen';
      r.faction='none';
      return;
    }
    if(r.rapport>=5){
      r.status='heroic ally';
      r.faction='heroes';
    }else if(r.rapport>=2){
      r.status='uneasy ally';
      if(r.faction==='criminal' || r.faction==='warlord')r.faction='none';
    }else if(r.rapport<=-5){
      r.status='nemesis';
      if(r.threatTier>=6&&r.faction==='none')r.faction=rivalRoll(2)===1?'criminal':'warlord';
    }else if(r.rapport<=-2){
      r.status='hostile';
      if(r.threatTier>=4&&r.faction==='none'&&rivalRoll(100)<=40)r.faction='criminal';
    }else{
      r.status='rising';
    }
  }

  function ensureRivalStatusHost(){
    var enemyList=document.getElementById('enemyList');
    if(!enemyList||!enemyList.parentElement)return null;
    var id='rivalCombatStatus';
    var node=document.getElementById(id);
    if(!node){
      node=document.createElement('div');
      node.id=id;
      node.style.marginTop='.35rem';
      node.style.padding='.35rem .45rem';
      node.style.border='1px solid rgba(224,80,80,.35)';
      node.style.background='rgba(224,80,80,.06)';
      node.style.fontSize='.75rem';
      node.style.color='var(--text2)';
      enemyList.parentElement.appendChild(node);
    }
    return node;
  }

  function renderRivalCombatStatus(){
    var r=ensureRivalState();
    if(!r)return;
    var host=ensureRivalStatusHost();
    if(!host)return;
    host.innerHTML='<strong style="color:var(--red2);">Rival:</strong> '
      + String(r.name)
      + ' | Dread d' + String(r.dread)
      + ' | Rapport ' + String(r.rapport)
      + ' | Threat ' + String(r.threatTier)
      + ' | Defeats ' + String(r.defeatCount) + '/3'
      + (r.lastOutcome ? ('<br><span style="color:var(--muted2);">Last Outcome: ' + String(r.lastOutcome) + '</span>') : '');
  }

  function openRivalEncounter(mapKey,ctx){
    var r=ensureRivalState();
    if(!r||!r.alive)return;
    var where=(ctx&&ctx.label)?String(ctx.label):'this zone';
    var mapLabel=String(mapKey||'province').toUpperCase();
    var baseDd=snapRivalDreadDie(r.dread + Math.max(0,Math.floor((r.threatTier-1)/2)));
    var indicator=r.rapport>=2?'Positive Path':(r.rapport<=-2?'Negative Path':'Uncertain Path');
    var dialogue = r.rapport>=3
      ? '"We keep crossing paths for a reason. Help me end this cleanly."'
      : (r.rapport<=-3
        ? '"You made me into this. Now witness what follows."'
        : '"Another crossing. Choose your side this time."');
    var html=''
      + '<div style="font-size:.82rem;color:var(--text2);line-height:1.6;">'
      + '<div style="font-family:\'Cinzel\',serif;font-size:.9rem;color:var(--gold2);">Rival Encounter — '+mapLabel+'</div>'
      + '<div style="margin-top:.2rem;">'+String(r.name)+' appears in <strong>'+where+'</strong>.</div>'
      + '<div style="margin-top:.25rem;color:var(--muted2);">'+dialogue+'</div>'
      + '<div style="margin-top:.3rem;border:1px solid rgba(201,162,39,.35);background:rgba(201,162,39,.08);padding:.28rem .35rem;">'
      + '<strong>Interaction Indicator:</strong> '+indicator
      + ' | Rival Dread d'+String(baseDd)
      + ' | Threat Tier '+String(r.threatTier)
      + ' | Defeated '+String(r.defeatCount)+'/3'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.28rem;margin-top:.4rem;">'
      + '<button class="btn btn-sm btn-teal" onclick="resolveRivalInteraction(\'parley\',\'lead\',\'positive\',\''+String(mapKey||'province')+'\',\''+String((ctx&&ctx.key)||'')+'\')">Parley (Lead)</button>'
      + '<button class="btn btn-sm btn-primary" onclick="resolveRivalInteraction(\'empathize\',\'spirit\',\'positive\',\''+String(mapKey||'province')+'\',\''+String((ctx&&ctx.key)||'')+'\')">Empathize (Spirit)</button>'
      + '<button class="btn btn-sm btn-warn" onclick="resolveRivalInteraction(\'intimidate\',\'control\',\'negative\',\''+String(mapKey||'province')+'\',\''+String((ctx&&ctx.key)||'')+'\')">Intimidate (Control)</button>'
      + '<button class="btn btn-sm" onclick="resolveRivalInteraction(\'undermine\',\'mind\',\'negative\',\''+String(mapKey||'province')+'\',\''+String((ctx&&ctx.key)||'')+'\')">Undermine (Mind)</button>'
      + '</div>'
      + '<div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.45rem;">'
      + '<button class="btn btn-sm btn-red" onclick="startRivalCombat(\''+String(mapKey||'province')+'\',\''+String((ctx&&ctx.key)||'')+'\')">⚔ Enter Combat</button>'
      + '<button class="btn btn-sm" onclick="if(typeof closeModal===\'function\')closeModal();">Leave</button>'
      + '</div>'
      + '</div>';
    if(typeof openModal==='function')openModal('Rival Encounter',html);
    else if(typeof alert==='function')alert('Rival encountered in '+where+'.');
  }

  function resolveRivalInteraction(action,stat,intent,mapKey,key){
    var r=ensureRivalState();
    if(!r||!r.alive)return;
    var dread=snapRivalDreadDie(r.dread + Math.max(0,Math.floor((r.threatTier-1)/2)));
    var rollOut=rivalActionRoll(stat,dread);
    var success=!!rollOut.success;
    var label=String(action||'interaction');
    var drift='';
    if(String(intent)==='positive'){
      if(success){
        r.rapport=clamp(r.rapport+1,-8,8);
        r.dread=shiftRivalDread(r.dread,-1);
        r.threatTier=clamp(r.threatTier-1,1,10);
        drift='Trust improved; rival pressure eased.';
      }else{
        r.rapport=clamp(r.rapport-1,-8,8);
        r.dread=shiftRivalDread(r.dread,1);
        r.threatTier=clamp(r.threatTier+1,1,10);
        drift='Attempt backfired; they grew sharper.';
      }
    }else{
      if(success){
        r.rapport=clamp(r.rapport-1,-8,8);
        r.dread=shiftRivalDread(r.dread,1);
        r.threatTier=clamp(r.threatTier+1,1,10);
        drift='You gain ground, but the rivalry escalates.';
      }else{
        r.rapport=clamp(r.rapport-2,-8,8);
        r.dread=shiftRivalDread(r.dread,2);
        r.threatTier=clamp(r.threatTier+2,1,10);
        drift='They exploit your opening and become more dangerous.';
      }
    }
    r.encounters=(r.encounters||0)+1;
    r.lastMap=String(mapKey||'');
    r.lastOutcome=(success?'Success':'Failure')+' - '+label;
    addRivalHistory('['+String(mapKey||'province')+'] '+label+': '+(success?'success':'failure')+' ('+String(stat)+')');
    syncRivalStatus();
    renderRivalCombatStatus();
    if(typeof closeModal==='function')closeModal();
    if(typeof showNotif==='function'){
      showNotif('Rival '+label+': '+(success?'success':'failure')+'. '+drift,success?'good':'warn');
    }
    if(typeof renderQP==='function')renderQP('combat');
  }

  function startRivalCombat(mapKey,key){
    var r=ensureRivalState();
    if(!r||!r.alive)return;
    var dd=snapRivalDreadDie(r.dread + Math.max(0,Math.floor(r.threatTier/2)));
    if(!S.combat||typeof S.combat!=='object')S.combat={enemyDread:8,spacing:'Engaged',actionsLeft:3,round:0,active:false,armyA:{stress:0,dread:0},armyB:{stress:0,dread:0}};
    S.combat.enemyDread=dd;
    if(Array.isArray(S.enemies)){
      S.enemies=S.enemies.filter(function(e){
        return !(e&&typeof e.name==='string'&&e.name.indexOf(String(r.name))===0);
      });
    }else{
      S.enemies=[];
    }
    if(typeof addEnemy==='function')addEnemy(r.name,dd);
    r.lastMap=String(mapKey||'');
    r.lastOutcome='Combat Engaged';
    addRivalHistory('['+String(mapKey||'province')+'] combat engaged at '+String(key||'unknown'));
    renderRivalCombatStatus();
    if(typeof updateCombatUI==='function')updateCombatUI();
    if(typeof renderEnemies==='function')renderEnemies();
    if(typeof renderQP==='function')renderQP('combat');
    if(typeof switchTab==='function')switchTab('combat',null);

    var html=''
      + '<div style="font-size:.82rem;color:var(--text2);line-height:1.6;">'
      + '<div><strong>'+String(r.name)+'</strong> enters combat.</div>'
      + '<div style="margin-top:.2rem;">Rival Dread: <strong>d'+String(dd)+'</strong> | Threat Tier: '+String(r.threatTier)+'</div>'
      + '<div style="margin-top:.2rem;color:var(--muted2);">They cannot be killed in one battle. You must defeat them <strong>3 times</strong> total.</div>'
      + '<div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.45rem;">'
      + '<button class="btn btn-sm btn-primary" onclick="finalizeRivalCombat(true)">Record Combat Success</button>'
      + '<button class="btn btn-sm btn-red" onclick="finalizeRivalCombat(false)">Record Combat Failure</button>'
      + '</div>'
      + '</div>';
    if(typeof openModal==='function')openModal('Rival Combat',html);
  }

  function finalizeRivalCombat(success){
    var r=ensureRivalState();
    if(!r)return;
    if(success){
      r.defeatCount=(r.defeatCount||0)+1;
      r.combatWins=(r.combatWins||0)+1;
      r.rapport=clamp(r.rapport-1,-8,8);
      if(r.defeatCount>=3){
        r.alive=false;
        r.lastOutcome='Combat Success - Rival Defeated Permanently';
        addRivalHistory('Final defeat delivered. Rival fell after three combats.');
        if(typeof showNotif==='function')showNotif('Final defeat: your rival has fallen after the third combat.', 'good');
      }else{
        r.dread=shiftRivalDread(r.dread,1);
        r.threatTier=clamp(r.threatTier+1,1,10);
        r.lastOutcome='Combat Success - Rival Escaped';
        addRivalHistory('Combat won. Rival escaped and hardened. Defeats: '+String(r.defeatCount)+'/3');
        if(typeof showNotif==='function')showNotif('Combat success. Rival escaped ('+String(r.defeatCount)+'/3 defeats).', 'good');
      }
    }else{
      r.combatLosses=(r.combatLosses||0)+1;
      r.dread=shiftRivalDread(r.dread,1);
      r.threatTier=clamp(r.threatTier+2,1,10);
      r.rapport=clamp(r.rapport-1,-8,8);
      r.lastOutcome='Combat Failure';
      if(r.threatTier>=6&&r.faction==='none')r.faction=rivalRoll(2)===1?'criminal':'warlord';
      addRivalHistory('Combat lost. Rival influence expanded.');
      if(typeof showNotif==='function')showNotif('Combat failed. Rival danger increased.', 'warn');
    }
    syncRivalStatus();
    renderRivalCombatStatus();
    if(typeof closeModal==='function')closeModal();
    if(typeof renderQP==='function')renderQP('combat');
  }

  function rollRivalEncounterForMap(mapKey,ctx){
    var r=ensureRivalState();
    if(!r||!r.alive)return false;
    var where=ctx&&ctx.key?String(ctx.key):'unknown';
    var gate=String(mapKey||'province')+'|'+where+'|'+getPhaseGateToken();
    if(r.lastGateToken===gate)return false;
    r.lastGateToken=gate;
    if(rivalRoll(100)>20)return false;
    if(typeof ensureBackstoryScopeMarkers==='function'){
      try{
        ensureBackstoryScopeMarkers(String(mapKey||'province'),[{key:String(where),type:String((ctx&&ctx.terrain)||''),label:String((ctx&&ctx.label)||'')}],{});
      }catch(_err){}
    }
    openRivalEncounter(String(mapKey||'province'),ctx||{});
    return true;
  }

  window.ensureRivalState=ensureRivalState;
  window.rollRivalEncounterForMap=rollRivalEncounterForMap;
  window.resolveRivalInteraction=resolveRivalInteraction;
  window.startRivalCombat=startRivalCombat;
  window.finalizeRivalCombat=finalizeRivalCombat;
  window.renderRivalCombatStatus=renderRivalCombatStatus;
})();
