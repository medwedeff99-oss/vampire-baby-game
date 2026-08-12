(() => {
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const FLOOR_Y = 360;
const FLOOR_H = 360;
const PLAYER_GROUND_TOP = 392;
const PLAYER_GROUND_BOTTOM = 610;

const dom = {
  hud: q('hud'), levelName: q('levelName'), objective: q('objective'), hint: q('hint'), treasureCount: q('treasureCount'), enemyCount: q('enemyCount'), teamCount: q('teamCount'), musicBtn: q('musicBtn'),
  bossBarWrap: q('bossBarWrap'), bossName: q('bossName'), bossBar: q('bossBar'), inventoryBar: q('inventoryBar'), rosterBar: q('rosterBar'),
  dialogue: q('dialogue'), dialoguePortrait: q('dialoguePortrait'), dialogueName: q('dialogueName'), dialogueText: q('dialogueText'), toast: q('toast'),
  startScreen: q('startScreen'), playBtn: q('playBtn'), introScreen: q('introScreen'), introEyebrow: q('introEyebrow'), introTitle: q('introTitle'), introText: q('introText'), introBtn: q('introBtn'),
  endScreen: q('endScreen'), endEyebrow: q('endEyebrow'), endTitle: q('endTitle'), endText: q('endText'), endStats: q('endStats'), victoryChant: q('victoryChant'), victoryCast: q('victoryCast'), nextBtn: q('nextBtn'), replayBtn: q('replayBtn'), menuBtn: q('menuBtn'),
  loseScreen: q('loseScreen'), retryFromLoseBtn: q('retryFromLoseBtn'), menuFromLoseBtn: q('menuFromLoseBtn'),
};
function q(id){ return document.getElementById(id); }

const keys = new Set();
let state = 'start';
let levelIndex = 0;
let level = null;
let assets = {};
let cameraX = 0;
let toastTimer = 0;
let lastTime = performance.now();
let dialogue = null;
let nearNpc = null;
let abilityTimer = 0;
let abilityOwner = null;
let abilityData = null;
let damageCooldown = 0;
let shootCooldown = 0;
let levelStartTime = 0;
let endReason = 'level';

const backgroundMusic = new Audio('assets/audio/Midnight_Monster_Trot.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.46;
backgroundMusic.preload = 'auto';
let musicOn = true;
function playMusic(){
  if(!musicOn) return;
  const p = backgroundMusic.play();
  if(p && typeof p.catch === 'function') p.catch(()=>{});
}
function pauseMusic(){ backgroundMusic.pause(); }
function setMusicButton(){ if(dom.musicBtn) dom.musicBtn.textContent = musicOn ? '♫ ON' : '♫ OFF'; }
function toggleMusic(){ musicOn = !musicOn; if(musicOn) playMusic(); else pauseMusic(); setMusicButton(); }

const CHAR_KEYS = ['vampire','maya','pumpkin','skeleton','zombie','witch'];
const CHARACTERS = {
  maya:      { name:'Maya',          speed:300, maxHp:5, img:'characters/maya.png',      shot:'projectiles/heart_shot.png',       shotScale:0.30, ability:'Friendship Spark', color:'#ff8fbf' },
  vampire:   { name:'Vampire Baby',  speed:292, maxHp:5, img:'characters/vampire.png',   shot:'projectiles/moon_shot.png',        shotScale:0.30, ability:'Moon Bolt Sense', color:'#b08cff' },
  pumpkin:   { name:'Pumpkin Baby',  speed:282, maxHp:6, img:'characters/pumpkin.png',   shot:'projectiles/candycorn_shot.png',   shotScale:0.30, ability:'Candy Corn Burst', color:'#ffb04a' },
  skeleton:  { name:'Skeleton Baby', speed:302, maxHp:4, img:'characters/skeleton.png',  shot:'projectiles/bone_shot.png',        shotScale:0.30, ability:'Bone Shield', color:'#ffe9c8' },
  zombie:    { name:'Sleepy Zombie', speed:272, maxHp:6, img:'characters/zombie.png',    shot:'projectiles/dream_shot.png',       shotScale:0.30, ability:'Dream Slow', color:'#d9a7ff' },
  witch:     { name:'Witch Baby',    speed:304, maxHp:4, img:'characters/witch.png',     shot:'projectiles/witch_shot.png',       shotScale:0.30, ability:'Star Spell', color:'#ffe06d' },
};

const ITEM_LABELS = {
  candy_corn:'Candy Corn', crayon_box:'Crayon Box', mini_pumpkin:'Mini Pumpkin', moon_badge:'Moon Badge', bat_sticker:'Bat Sticker', ghost_eraser:'Ghost Eraser', purple_backpack:'Purple Backpack', paint_palette:'Paint Palette', purple_ribbon:'Purple Ribbon', pumpkin_stamp:'Pumpkin Stamp', glitter_glue:'Glitter Glue', star_sticker:'Star Sticker', moon_bookmark:'Moon Bookmark', golden_key:'Golden Key', sleepy_spellbook:'Sleepy Spellbook', flying_book:'Flying Book', friendship_card:'Friendship Card', heart_lunchbox:'Heart Lunchbox', shiny_apple:'Shiny Apple', star_cookie:'Star Cookie', dreamy_juice:'Dreamy Juice', broom_charm:'Broom Charm', popcorn:'Popcorn', heart_gem:'Heart Gem', moon_gem:'Moon Gem', pumpkin_gem:'Pumpkin Gem', courage_gem:'Courage Gem', dream_gem:'Dream Gem', star_gem:'Star Gem', portal_key:'Portal Key', candy_apple:'Candy Apple', friendship_bell:'Friendship Bell',
  candy_corn_sticker:'Candy Corn', crayon_box_sticker:'Crayon Box', pumpkin_sticker2:'Pumpkin Sticker', moon_coin:'Moon Coin', bat_sticker2:'Bat Friend', ghost_sticker2:'Ghost Pal', backpack_sticker2:'Moon Backpack', palette_sticker2:'Palette', purple_bow:'Purple Bow', pumpkin_stamp2:'Pumpkin Stamp', glitter_bottle:'Glitter Bottle', shooting_star:'Shooting Star', bookmark_moon:'Moon Bookmark', sleepy_spellbook2:'Spellbook', flying_book2:'Winged Book', friendship_card2:'Friendship Card', heart_lunchbox2:'Heart Lunchbox', apple2:'Apple', star_cookie2:'Star Cookie', dreamy_juice2:'Moon Juice', broom_charm2:'Broom Charm', portal_key2:'Portal Key', popcorn2:'Popcorn', candy_apple2:'Candy Apple', friendship_bell2:'Friendship Bell', pumpkin_gem2:'Pumpkin Gem', courage_gem2:'Green Gem', heart_gem2:'Heart Gem',
};

const ENEMY_TYPES = {
  pencil_puff:      { name:'Pencil Puff',      img:'enemies/pencil_puff.png',       hp:3, speed:65, shot:'projectiles/dark_wisp_shot.png',   shotScale:0.22, color:'#ff6d9d' },
  locker_wisp:      { name:'Locker Wisp',      img:'enemies/locker_wisp.png',       hp:4, speed:55, shot:'projectiles/dark_wisp_shot.png',   shotScale:0.24, color:'#ff739f' },
  notebook_ghost:   { name:'Notebook Ghost',   img:'enemies/notebook_ghost.png',    hp:3, speed:72, shot:'projectiles/book_flurry_shot.png', shotScale:0.24, color:'#ff7ca7' },
  bubble_blip:      { name:'Bubble Blip',      img:'enemies/bubble_blip.png',       hp:3, speed:80, shot:'projectiles/popcorn_blast_shot.png', shotScale:0.22, color:'#ff7fa4' },
  bell_angel:       { name:'Bell Breeze',      img:'enemies/bell_angel.png',        hp:4, speed:68, shot:'projectiles/moon_shot.png',       shotScale:0.20, color:'#ff8aac' },
  paint_jar_jinx:   { name:'Paint Jinx',       img:'enemies/paint_jar_jinx.png',    hp:4, speed:82, shot:'projectiles/rainbow_splat_shot.png', shotScale:0.24, color:'#ff8ea8' },
  brush_runner:     { name:'Brush Runner',     img:'enemies/brush_runner.png',      hp:4, speed:88, shot:'projectiles/rainbow_splat_shot.png', shotScale:0.22, color:'#ff7e90' },
  glitter_fairy:    { name:'Glitter Fairy',    img:'enemies/glitter_fairy.png',     hp:4, speed:92, shot:'projectiles/witch_shot.png',      shotScale:0.22, color:'#ff75c7' },
  palette_prankster:{ name:'Palette Prankster',img:'enemies/palette_prankster.png', hp:5, speed:75, shot:'projectiles/rainbow_splat_shot.png', shotScale:0.23, color:'#ff8d73' },
  rainbow_blob:     { name:'Rainbow Blob',     img:'enemies/rainbow_blob.png',      hp:5, speed:70, shot:'projectiles/rainbow_splat_shot.png', shotScale:0.24, color:'#ff6d85' },
};

const BOSS_TYPES = {
  hallway: { name:'Hallway Mist', img:'bosses/hallway_mist_boss.png', hp:20, speed:55, shot:'projectiles/dark_wisp_shot.png', shotScale:0.34 },
  art:     { name:'Paint Bandit', img:'bosses/paint_bandit_boss.png', hp:22, speed:62, shot:'projectiles/rainbow_splat_shot.png', shotScale:0.34 },
  library: { name:'Book Bat',     img:'bosses/book_bat_boss.png', hp:24, speed:62, shot:'projectiles/book_flurry_shot.png', shotScale:0.34 },
  cafe:    { name:'Snack Gobbler',img:'bosses/snack_gobbler_boss.png', hp:26, speed:58, shot:'projectiles/popcorn_blast_shot.png', shotScale:0.34 },
  portal:  { name:'Portal Imp',   img:'bosses/portal_imp_boss.png', hp:28, speed:70, shot:'projectiles/portal_swirl_shot.png', shotScale:0.34 },
};

const NPCS = {
  sofia:{ name:'Sofia', img:'npcs/sofia.png' },
  theo:{ name:'Theo', img:'npcs/theo.png' },
  ava:{ name:'Ava', img:'npcs/ava.png' },
  noah:{ name:'Noah', img:'npcs/noah.png' },
};

function makeLevel(cfg){
  const itemXs = spaced(520, cfg.worldW - 520, cfg.items.length);
  const items = cfg.items.map((key, i) => ({ key, label: ITEM_LABELS[key] || key, x: itemXs[i], y: randFrom([442, 478, 518, 560]) }));
  const enemyXs = spaced(780, cfg.worldW - 730, cfg.enemies.length);
  const enemies = cfg.enemies.map((type, i) => ({ type, x: enemyXs[i], y: randFrom([470, 520, 560]) }));
  return {
    ...cfg,
    items,
    enemies,
    props: cfg.props || [],
    npcs: cfg.npcs || [],
    exitX: cfg.worldW - 190,
    bossX: cfg.worldW - 520,
  };
}

const LEVELS = [
  makeLevel({
    id:'hallway', number:1, name:'First Bell Hallway', worldW:3400, startChar:'vampire', bossKey:'hallway',
    intro:'Vampire Baby starts the adventure and leads all six friends into Moonberry School. Gold glows mark treasures. Pink-red glows mark pranksters. Clear the hallway, protect the team, and beat Hallway Mist.',
    hint:'Vampire Baby starts. Gold glow = collect it. Pink ring = enemy. The team has less HP now, so dodge and switch wisely.',
    items:['candy_corn','crayon_box','mini_pumpkin','moon_badge','bat_sticker','ghost_eraser','purple_backpack','star_sticker','bookmark_moon','friendship_card2'],
    enemies:['pencil_puff','locker_wisp','notebook_ghost','bubble_blip','bell_angel','pencil_puff','notebook_ghost','locker_wisp'],
    props:[['lockers',220,255,360],['bulletin',1180,130,280],['lockers',1640,255,360],['bulletin',2760,120,300],['magic_door',3180,190,240]],
    npcs:[
      {key:'sofia', x:820, y:560, lines:['Vampire Baby! The hallway treasures are sparkling in gold.', 'Those pink-ring pranksters are the troublemakers. Calm them and keep the whole team moving.']},
      {key:'theo', x:2270, y:560, lines:['Vampire Baby is definitely leading this crew.', 'When one friend gets knocked out, another jumps in. You only lose if the whole team goes down.']},
    ],
  }),
  makeLevel({
    id:'art', number:2, name:'Art Classroom', worldW:3500, startChar:'vampire', bossKey:'art',
    intro:'Vampire Baby takes the lead. The art room is swarming with paint pranksters, brighter shots, and more treasure. The challenge is harder now—dodge, switch, and keep shooting.',
    hint:'Use Vampire Baby to lead. Paint enemies fire rainbow splats. The palette boss is tougher.',
    items:['paint_palette','purple_ribbon','pumpkin_stamp','glitter_glue','shooting_star','palette_sticker2','glitter_bottle','purple_bow','candy_apple2','heart_gem2'],
    enemies:['paint_jar_jinx','brush_runner','glitter_fairy','palette_prankster','rainbow_blob','brush_runner','paint_jar_jinx','glitter_fairy'],
    props:[['easel',390,220,250],['art_shelf',960,200,240],['rolling_cart',1560,430,190],['easel',2240,220,250],['art_shelf',2850,200,240],['magic_door',3290,190,240]],
    npcs:[
      {key:'ava', x:1140, y:560, lines:['The collectibles here are extra bright and artsy.', 'The pranksters are still friendly-looking, but they are absolutely enemies. Watch the red rings under them.']},
      {key:'sofia', x:2480, y:560, lines:['Your shots are real now—use them!', 'Paint Bandit loves messy projectile spreads, so keep moving.']},
    ],
  }),
  makeLevel({
    id:'library', number:3, name:'Magical Library', worldW:3600, startChar:'vampire', bossKey:'library',
    intro:'Quiet voices, flying pages, and the sneakiest projectiles so far. The library hides the most collectibles yet, and the Book Bat punishes sloppy dodging.',
    hint:'Book enemies toss page storms. Use Bone Shield or Dream Slow if the screen gets hectic.',
    items:['golden_key','sleepy_spellbook','flying_book','moon_bookmark','flying_book2','sleepy_spellbook2','golden_key','friendship_card','star_cookie2','courage_gem2'],
    enemies:['notebook_ghost','bell_angel','locker_wisp','glitter_fairy','notebook_ghost','bubble_blip','bell_angel','palette_prankster'],
    props:[['bookshelf',360,240,300],['bookshelf',970,240,300],['rolling_cart',1510,430,180],['bookshelf',2080,240,300],['bookshelf',2760,240,300],['magic_door',3390,190,240]],
    npcs:[
      {key:'noah', x:910, y:560, lines:['The library prizes are hidden in plain sight, but the flying page shots are faster.', 'If Vampire Baby senses treasure, follow that lead.']},
      {key:'ava', x:2470, y:560, lines:['This boss likes screen pressure.', 'Keep calm, rotate characters, and do not get trapped against the right side.']},
    ],
  }),
  makeLevel({
    id:'cafe', number:4, name:'Cafeteria Kindness', worldW:3650, startChar:'vampire', bossKey:'cafe',
    intro:'The cafeteria looks sweet, but the chaos is sticky. There are more enemies now, more loot, and a gobbler boss that floods the room with popcorn shots.',
    hint:'Gold glow collectibles are mixed with food clutter. Snack Gobbler fires wide bursts.',
    items:['heart_lunchbox','shiny_apple','star_cookie','dreamy_juice','popcorn','heart_lunchbox2','apple2','star_cookie2','dreamy_juice2','popcorn2'],
    enemies:['bubble_blip','palette_prankster','rainbow_blob','paint_jar_jinx','bubble_blip','brush_runner','rainbow_blob','bell_angel'],
    props:[['cafeteria_table',560,420,290],['rolling_cart',1200,430,180],['cafeteria_table',1880,420,290],['rolling_cart',2470,430,180],['cafeteria_table',2970,420,290],['magic_door',3470,190,240]],
    npcs:[
      {key:'theo', x:1310, y:560, lines:['The cafeteria mixes treasure with distractions.', 'Snack Gobbler is cute, but definitely not your friend.']},
      {key:'noah', x:2710, y:560, lines:['If your active character gets knocked out, another friend jumps in automatically.', 'Save Witch Baby or Maya for messy bullet fields if you can.']},
    ],
  }),
  makeLevel({
    id:'portal', number:5, name:'Playground Portal', worldW:3800, startChar:'vampire', bossKey:'portal',
    intro:'Final level. The portal zone throws the most treasure, the most pranksters, and the nastiest boss patterns. Win here and the game ends with style.',
    hint:'Portal swirls hit hard. This is the toughest level. Use every character wisely.',
    items:['broom_charm','heart_gem','moon_gem','pumpkin_gem','courage_gem','dream_gem','star_gem','portal_key','friendship_bell','portal_key2'],
    enemies:['glitter_fairy','bell_angel','rainbow_blob','locker_wisp','bubble_blip','glitter_fairy','palette_prankster','notebook_ghost'],
    props:[['portal',560,300,250],['bookshelf',1240,240,260],['rolling_cart',1890,430,180],['portal',2500,300,250],['bookshelf',3100,240,260],['magic_door',3620,190,240]],
    npcs:[
      {key:'sofia', x:1010, y:560, lines:['This is it—the hardest floor in Moonberry School.', 'If you finish this, Vampire Baby officially becomes the tiny king of chaos.']},
      {key:'ava', x:2800, y:560, lines:['The portal boss loves to flood the screen.', 'Keep dodging, switch characters, and do not panic when the last stretch gets noisy.']},
    ],
  }),
];

const game = {
  team: [],
  activeIndex: 0,
  player: null,
  items: [],
  enemies: [],
  npcList: [],
  boss: null,
  playerShots: [],
  enemyShots: [],
  particles: [],
  openedExit: false,
  score: 0,
  totalDefeated: 0,
  totalCollected: 0,
};

function spaced(start,end,count){
  if(count<=1) return [Math.round((start+end)/2)];
  const out=[]; const step=(end-start)/(count-1); for(let i=0;i<count;i++) out.push(Math.round(start+i*step)); return out;
}
function randFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function dist(a,b,c,d){ return Math.hypot(a-c,b-d); }
function alpha(v){ return `rgba(255,255,255,${v})`; }

function buildAssetList(){
  const need = new Set();
  Object.values(CHARACTERS).forEach(c => { need.add('assets/'+c.img); need.add('assets/'+c.shot); });
  Object.values(NPCS).forEach(n => need.add('assets/'+n.img));
  Object.values(ENEMY_TYPES).forEach(e => { need.add('assets/'+e.img); need.add('assets/'+e.shot); });
  Object.values(BOSS_TYPES).forEach(b => { need.add('assets/'+b.img); need.add('assets/'+b.shot); });
  LEVELS.forEach(l => {
    l.items.forEach(it => need.add('assets/items/'+it.key+'.png'));
    l.props.forEach(p => need.add('assets/props/'+p[0]+'.png'));
  });
  return [...need];
}

async function loadAssets(){
  const paths = buildAssetList();
  await Promise.all(paths.map(path => new Promise(res => {
    const img = new Image();
    img.onload = () => { assets[path] = img; res(); };
    img.onerror = () => { console.warn('missing',path); assets[path] = null; res(); };
    img.src = path;
  })));
}

function startLevel(idx){
  backgroundMusic.volume = 0.46;
  levelIndex = idx;
  level = LEVELS[idx];
  game.team = CHAR_KEYS.map(k => ({ key:k, hp:CHARACTERS[k].maxHp, alive:true }));
  game.activeIndex = CHAR_KEYS.indexOf(level.startChar);
  if(game.activeIndex < 0) game.activeIndex = 0;
  const charKey = game.team[game.activeIndex].key;
  game.player = { x: 190, y: 560, vx:0, vy:0, dir:1, charKey };
  game.items = level.items.map((it, i) => ({ ...it, id:'item'+i, found:false, bob:Math.random()*Math.PI*2 }));
  game.enemies = level.enemies.map((e, i) => ({ id:'enemy'+i, type:e.type, x:e.x, y:e.y, homeX:e.x, vx:(Math.random()>.5?1:-1), hp:ENEMY_TYPES[e.type].hp, alive:true, fireCd:1 + Math.random()*1.4, hitFlash:0, phase:Math.random()*Math.PI*2 }));
  game.npcList = level.npcs.map((n, i) => ({ ...n, id:'npc'+i, talked:false }));
  const bossDef = BOSS_TYPES[level.bossKey];
  game.boss = { key: level.bossKey, x: level.bossX, y: 555, vx:1, hp:bossDef.hp, maxHp:bossDef.hp, alive:true, fireCd:1.5, phase:0, revealed:true, hitFlash:0 };
  game.playerShots = []; game.enemyShots = []; game.particles = []; game.score=0; game.totalDefeated = 0; game.totalCollected = 0; game.openedExit = false;
  cameraX = 0; toastTimer = 0; dialogue = null; nearNpc = null; abilityTimer = 0; abilityOwner = null; abilityData = null; damageCooldown = 0; shootCooldown = 0; levelStartTime = performance.now();
  state = 'intro';
  dom.startScreen.classList.add('hidden');
  dom.endScreen.classList.add('hidden'); dom.loseScreen.classList.add('hidden'); dom.victoryChant.classList.add('hidden'); dom.victoryCast.classList.add('hidden');
  dom.introScreen.classList.remove('hidden');
  dom.hud.classList.remove('hidden'); dom.inventoryBar.classList.remove('hidden'); dom.rosterBar.classList.remove('hidden'); dom.bossBarWrap.classList.remove('hidden');
  dom.introEyebrow.textContent = `LEVEL ${level.number} • ${level.name}`;
  dom.introTitle.textContent = 'Vampire Baby leads the adventure';
  dom.introText.textContent = level.intro;
  updateDom();
}

function beginPlay(){ state = 'playing'; dom.introScreen.classList.add('hidden'); playMusic(); showToast('Vampire Baby leads the team!'); }
function backToMenu(){ backgroundMusic.volume = 0.46; state='start'; dom.startScreen.classList.remove('hidden'); dom.endScreen.classList.add('hidden'); dom.loseScreen.classList.add('hidden'); dom.victoryChant.classList.add('hidden'); dom.victoryCast.classList.add('hidden'); dom.introScreen.classList.add('hidden'); dom.hud.classList.add('hidden'); dom.inventoryBar.classList.add('hidden'); dom.rosterBar.classList.add('hidden'); dom.bossBarWrap.classList.add('hidden'); dom.dialogue.classList.add('hidden'); hideToast(); }

function updateDom(){
  const found = game.items.filter(i=>i.found).length;
  const aliveEnemies = game.enemies.filter(e=>e.alive).length;
  const teamAlive = game.team.filter(t=>t.alive).length;
  dom.levelName.textContent = `LEVEL ${level.number} • ${level.name}`;
  dom.objective.textContent = `Collect ${game.items.length} treasures • calm ${game.enemies.length} pranksters • defeat ${BOSS_TYPES[level.bossKey].name}`;
  const c = currentCharDef();
  dom.hint.textContent = `${level.hint} • ${c.name}: ${c.ability} • HP ${currentTeamMember().hp}/${c.maxHp}`;
  dom.treasureCount.textContent = `${found} / ${game.items.length}`;
  dom.enemyCount.textContent = `${game.enemies.length - aliveEnemies} / ${game.enemies.length}`;
  dom.teamCount.textContent = teamAlive;
  dom.bossName.textContent = BOSS_TYPES[level.bossKey].name;
  dom.bossBar.style.width = `${Math.max(0, game.boss.hp / game.boss.maxHp * 100)}%`;

  dom.inventoryBar.innerHTML = '';
  game.items.forEach(it => {
    const d=document.createElement('div'); d.className='inventory-slot'+(it.found?'':' missing');
    const img=document.createElement('img'); img.src='assets/items/'+it.key+'.png'; img.alt=it.label; d.appendChild(img); dom.inventoryBar.appendChild(d);
  });
  dom.rosterBar.innerHTML='';
  game.team.forEach((t, idx) => {
    const cdef=CHARACTERS[t.key];
    const b=document.createElement('div');
    b.className='roster-card'+(idx===game.activeIndex?' active':'')+(t.alive?'':' ko');
    b.innerHTML=`<img src="assets/${cdef.img}" alt="${cdef.name}"><div class="name">${cdef.name.replace(' Baby','')}</div><div class="hp">${t.alive ? 'HP '+t.hp+'/'+cdef.maxHp : 'KO'}</div>`;
    b.onclick=()=>switchToIndex(idx);
    dom.rosterBar.appendChild(b);
  });
}

function currentTeamMember(){ return game.team[game.activeIndex] || game.team.find(t=>t && t.alive) || null; }
function currentCharDef(){ const t=currentTeamMember(); return t ? CHARACTERS[t.key] : CHARACTERS.vampire; }

function switchToIndex(idx){
  if(state !== 'playing' && state !== 'intro') return;
  if(idx < 0 || idx >= game.team.length || !game.team[idx].alive) return;
  game.activeIndex = idx;
  game.player.charKey = game.team[idx].key;
  updateDom();
  showToast(`${currentCharDef().name} steps in.`);
}
function switchBy(step){
  let idx = game.activeIndex;
  for(let i=0;i<game.team.length;i++){
    idx = (idx + step + game.team.length) % game.team.length;
    if(game.team[idx].alive){ switchToIndex(idx); return; }
  }
}

function useAbility(){
  if(state !== 'playing') return;
  const key = currentTeamMember().key;
  abilityOwner = key; abilityTimer = 3.2; abilityData = {key};
  if(key==='maya'){
    game.enemies.forEach(e=>{ if(e.alive && dist(e.x,e.y,game.player.x,game.player.y)<180) e.hp-=1; if(e.hp<=0) calmEnemy(e); });
    game.enemyShots = game.enemyShots.filter(s=>dist(s.x,s.y,game.player.x,game.player.y)>220);
    burst(game.player.x, game.player.y-60, 24, '#ff94c8');
    showToast('Friendship Spark clears nearby danger.');
  } else if(key==='vampire'){
    abilityData.targetId = nearestUnfoundItem()?.id || null;
    burst(game.player.x, game.player.y-60, 22, '#b797ff');
    showToast('Moon Sense points to the nearest treasure.');
  } else if(key==='pumpkin'){
    game.enemies.forEach(e=>{ if(e.alive && dist(e.x,e.y,game.player.x,game.player.y)<230){ e.hp -= 2; e.stun=1.25; if(e.hp<=0) calmEnemy(e); } });
    if(game.boss.alive && dist(game.boss.x,game.boss.y,game.player.x,game.player.y)<250){ game.boss.hp -= 1; game.boss.stun = 1.1; }
    burst(game.player.x, game.player.y-40, 30, '#ffb047');
    showToast('Candy Corn Burst pops nearby enemies.');
  } else if(key==='skeleton'){
    abilityData.shield = true;
    burst(game.player.x, game.player.y-70, 18, '#fff2dd');
    showToast('Bone Shield makes Skeleton Baby tough for a moment.');
  } else if(key==='zombie'){
    game.enemies.forEach(e=>{ if(e.alive) e.slow = 2.8; });
    if(game.boss.alive) game.boss.slow = 2.8;
    burst(game.player.x, game.player.y-70, 24, '#d7abff');
    showToast('Dream Slow softens the whole room.');
  } else if(key==='witch'){
    abilityData.rapid = true;
    burst(game.player.x, game.player.y-90, 26, '#ffe66b');
    showToast('Star Spell boosts Witch Baby shots.');
  }
  updateDom();
}

function fire(){
  if(state !== 'playing' || shootCooldown > 0) return;
  const c = currentCharDef();
  const boost = abilityOwner===currentTeamMember().key && abilityTimer>0 && abilityData && abilityData.rapid ? 1.2 : 1;
  const shot = { x:game.player.x + game.player.dir*44, y:game.player.y - 70, vx:game.player.dir * 680 * boost, vy:0, img:c.shot, scale:c.shotScale, life:2.2, friendly:true, damage:1 };
  game.playerShots.push(shot);
  if(abilityOwner===currentTeamMember().key && abilityTimer>0 && abilityData && abilityData.rapid){
    game.playerShots.push({ x:game.player.x + game.player.dir*40, y:game.player.y - 92, vx:game.player.dir*620, vy:-40, img:c.shot, scale:c.shotScale*0.9, life:1.7, friendly:true, damage:1 });
    game.playerShots.push({ x:game.player.x + game.player.dir*40, y:game.player.y - 48, vx:game.player.dir*620, vy:40, img:c.shot, scale:c.shotScale*0.9, life:1.7, friendly:true, damage:1 });
  }
  shootCooldown = abilityOwner===currentTeamMember().key && abilityTimer>0 && abilityData && abilityData.rapid ? 0.11 : 0.22;
}

function nearestUnfoundItem(){
  return game.items.filter(i=>!i.found).sort((a,b)=>dist(a.x,a.y,game.player.x,game.player.y)-dist(b.x,b.y,game.player.x,game.player.y))[0] || null;
}

function calmEnemy(enemy){
  if(!enemy.alive) return;
  enemy.alive = false;
  enemy.hp = 0;
  game.totalDefeated++;
  burst(enemy.x, enemy.y-40, 28, ENEMY_TYPES[enemy.type].color);
  showToast(`${ENEMY_TYPES[enemy.type].name} calmed down.`);
  updateDom();
}

function hurtPlayer(amount){
  if(state !== 'playing') return;
  if(damageCooldown > 0) return;
  if(abilityOwner===currentTeamMember().key && abilityTimer>0 && abilityData && abilityData.shield) return;
  const t = currentTeamMember();
  t.hp -= amount;
  damageCooldown = 0.58;
  burst(game.player.x, game.player.y-60, 14, '#ff5b8d');
  if(t.hp <= 0){
    t.hp = 0; t.alive = false;
    const oldName = currentCharDef().name;
    updateDom();
    let next = game.team.findIndex((m, i) => m.alive);
    if(next === -1){
      loseGame();
      return;
    }
    game.activeIndex = next;
    game.player.charKey = game.team[next].key;
    showToast(`${oldName} is knocked out! ${currentCharDef().name} jumps in.`);
  } else {
    showToast(`${currentCharDef().name} took a hit!`);
  }
  updateDom();
}

function loseGame(){
  state = 'lose';
  dom.loseScreen.classList.remove('hidden');
}

function finishLevel(){
  const timeSec = Math.round((performance.now()-levelStartTime)/1000);
  const teamAlive = game.team.filter(t=>t.alive).length;
  state = 'end';
  dom.endScreen.classList.remove('hidden');
  const final = levelIndex === LEVELS.length - 1;
  dom.endEyebrow.textContent = final ? 'GAME COMPLETE' : `LEVEL ${level.number} COMPLETE`;
  dom.endTitle.textContent = final ? 'VAMPIRE BABY SAVED MOONBERRY!' : `${level.name} cleared!`;
  dom.endText.textContent = final
    ? 'The principal checked the damage report, saw six tiny heroes dancing in the hallway, and officially declared: “I have absolutely no idea what happened here… but Vampire Baby gets an A+.”'
    : 'Vampire Baby and the crew cleared another round of Moonberry mayhem. Everybody still standing gets bragging rights.';
  if(final){
    dom.victoryChant.classList.remove('hidden');
    dom.victoryCast.classList.remove('hidden');
    backgroundMusic.volume = 0.62;
    try{ backgroundMusic.currentTime = 0; }catch(_){ }
    playMusic();
  } else {
    dom.victoryChant.classList.add('hidden');
    dom.victoryCast.classList.add('hidden');
    backgroundMusic.volume = 0.46;
  }
  dom.endStats.innerHTML = `<span>Time: ${timeSec}s</span><span>Treasures: ${game.items.filter(i=>i.found).length}/${game.items.length}</span><span>Enemies Calmed: ${game.totalDefeated}/${game.enemies.length}</span><span>Team Left: ${teamAlive}/6</span>`;
  dom.nextBtn.style.display = final ? 'none' : '';
  endReason = final ? 'final' : 'level';
}

function openDialogue(npc){
  dialogue = { npc, index:0 };
  state = 'dialogue';
  dom.dialogue.classList.remove('hidden');
  renderDialogue();
}
function renderDialogue(){
  if(!dialogue) return;
  const d = dialogue;
  dom.dialoguePortrait.src = 'assets/' + NPCS[d.npc.key].img;
  dom.dialogueName.textContent = NPCS[d.npc.key].name;
  dom.dialogueText.textContent = d.npc.lines[d.index];
}
function advanceDialogue(){
  if(!dialogue) return;
  dialogue.index++;
  if(dialogue.index >= dialogue.npc.lines.length){
    dialogue.npc.talked = true;
    dialogue = null;
    state = 'playing';
    dom.dialogue.classList.add('hidden');
    showToast('Friend chatted. Back to the mission.');
  } else {
    renderDialogue();
  }
}

function showToast(text){ dom.toast.textContent=text; dom.toast.classList.remove('hidden'); toastTimer = 1.8; }
function hideToast(){ dom.toast.classList.add('hidden'); }

function burst(x,y,count,color){
  for(let i=0;i<count;i++) game.particles.push({ x, y, vx:(Math.random()-0.5)*220, vy:-40 - Math.random()*160, life:0.45 + Math.random()*0.7, t:0, color, size:2 + Math.random()*4 });
}

function update(dt){
  if(state === 'intro' || state === 'start' || state === 'end' || state === 'lose') return;
  if(toastTimer > 0){ toastTimer -= dt; if(toastTimer<=0) hideToast(); }
  if(damageCooldown > 0) damageCooldown -= dt;
  if(shootCooldown > 0) shootCooldown -= dt;
  if(abilityTimer > 0){ abilityTimer -= dt; if(abilityTimer<=0){ abilityOwner=null; abilityData=null; } }

  if(state === 'dialogue'){
    updateParticles(dt);
    return;
  }

  const c = currentCharDef();
  const move = {x:0,y:0};
  if(keys.has('ArrowLeft')||keys.has('a')) move.x -= 1;
  if(keys.has('ArrowRight')||keys.has('d')) move.x += 1;
  if(keys.has('ArrowUp')||keys.has('w')) move.y -= 1;
  if(keys.has('ArrowDown')||keys.has('s')) move.y += 1;
  const len = Math.hypot(move.x, move.y) || 1;
  move.x /= len; move.y /= len;
  let speed = c.speed;
  if(abilityOwner === 'witch' && abilityTimer>0 && currentTeamMember().key==='witch') speed += 40;
  game.player.x = clamp(game.player.x + move.x * speed * dt, 80, level.worldW - 90);
  game.player.y = clamp(game.player.y + move.y * speed * 0.68 * dt, PLAYER_GROUND_TOP, PLAYER_GROUND_BOTTOM);
  if(move.x) game.player.dir = Math.sign(move.x);

  // camera
  cameraX = clamp(game.player.x - W*0.44, 0, level.worldW - W);

  // NPC interaction
  nearNpc = null;
  for(const npc of game.npcList){
    if(dist(npc.x,npc.y,game.player.x,game.player.y)<92){ nearNpc = npc; break; }
  }

  // items
  for(const item of game.items){
    item.bob += dt * 2.6;
    if(!item.found && dist(item.x,item.y,game.player.x,game.player.y) < 64){
      item.found = true; game.totalCollected++; burst(item.x,item.y-20,20,'#ffd96d'); showToast(`${item.label} collected.`); updateDom();
    }
  }

  // enemies
  for(const e of game.enemies){
    if(!e.alive) continue;
    const def = ENEMY_TYPES[e.type];
    if(e.stun>0){ e.stun -= dt; } else {
      const slowFactor = e.slow>0 ? 0.45 : 1;
      e.phase += dt * (0.8 + def.speed/130);
      const dirToPlayer = Math.sign(game.player.x - e.x) || 1;
      e.x += Math.cos(e.phase) * def.speed * 0.18 * dt * slowFactor + dirToPlayer * def.speed * 0.23 * dt * slowFactor;
      e.x = clamp(e.x, e.homeX - 130, e.homeX + 130);
      e.y += Math.sin(e.phase*1.7) * 20 * dt;
      e.y = clamp(e.y, 450, 580);
    }
    if(e.slow>0) e.slow -= dt;
    if(e.hitFlash>0) e.hitFlash -= dt;
    e.fireCd -= dt * (game.boss.alive ? 1.0 : 1.15);
    const shotRange = 540;
    if(e.fireCd<=0 && dist(e.x,e.y,game.player.x,game.player.y) < shotRange){
      fireEnemyShot(e.x, e.y-40, def.shot, def.shotScale, targetVelocity(e.x,e.y-40,game.player.x,game.player.y-70, 285 + levelIndex*12 + Math.random()*70), 1, false);
      e.fireCd = 1.15 + Math.random()*1.3;
    }
    if(dist(e.x,e.y,game.player.x,game.player.y) < 62) hurtPlayer(1);
  }

  // boss
  if(game.boss.alive){
    const b = game.boss, bd = BOSS_TYPES[b.key];
    if(b.hitFlash>0) b.hitFlash -= dt;
    if(b.stun>0) b.stun -= dt;
    const slowFactor = b.slow>0 ? 0.55 : 1;
    if(b.slow>0) b.slow -= dt;
    if(b.stun<=0){
      b.phase += dt * 1.1;
      b.x += Math.sin(b.phase) * bd.speed * 0.42 * dt * slowFactor;
      b.x = clamp(b.x, level.bossX - 180, level.bossX + 160);
      b.y = 535 + Math.sin(b.phase*2.1)*14;
    }
    b.fireCd -= dt;
    if(b.fireCd <= 0 && dist(b.x,b.y,game.player.x,game.player.y) < 840){
      const spread = levelIndex < 2 ? 2 : levelIndex < 4 ? 3 : 4;
      for(let i=0;i<spread;i++){
        const vel = targetVelocity(b.x, b.y-85, game.player.x, game.player.y-70, 315 + levelIndex*10 + i*10);
        vel.vx += (i - (spread-1)/2) * 35;
        vel.vy += (i - (spread-1)/2) * 18;
        fireEnemyShot(b.x, b.y-85, bd.shot, bd.shotScale, vel, levelIndex >= 2 ? 2 : 1, true);
      }
      b.fireCd = 1.2 + Math.max(0.25, 1.4 - levelIndex*0.16);
    }
    if(dist(b.x,b.y,game.player.x,game.player.y) < 95) hurtPlayer(1);
  }

  // player shots
  for(const s of game.playerShots){
    s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    for(const e of game.enemies){
      if(e.alive && dist(s.x,s.y,e.x,e.y-40) < 58){
        s.life = 0; e.hp -= s.damage; e.hitFlash = 0.18; burst(s.x,s.y,10,'#ffe270'); if(e.hp<=0) calmEnemy(e); break;
      }
    }
    if(s.life > 0 && game.boss.alive && dist(s.x,s.y,game.boss.x,game.boss.y-70) < 95){
      s.life = 0; game.boss.hp -= s.damage; game.boss.hitFlash = 0.18; burst(s.x,s.y,10,'#ffce77'); if(game.boss.hp <= 0){ game.boss.hp = 0; game.boss.alive = false; burst(game.boss.x, game.boss.y-50, 42, '#ffae67'); showToast(`${BOSS_TYPES[level.bossKey].name} was defeated!`); } updateDom();
    }
  }
  game.playerShots = game.playerShots.filter(s=>s.life>0 && s.x > -100 && s.x < level.worldW + 100 && s.y > -100 && s.y < H+100);

  // enemy shots
  for(const s of game.enemyShots){
    s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if(dist(s.x,s.y,game.player.x,game.player.y-65) < 44){ s.life = 0; hurtPlayer(s.damage); }
  }
  game.enemyShots = game.enemyShots.filter(s=>s.life>0 && s.x > -180 && s.x < level.worldW + 180 && s.y > -180 && s.y < H+180);

  updateParticles(dt);

  const allItems = game.items.every(i=>i.found);
  const allEnemies = game.enemies.every(e=>!e.alive);
  const bossDead = !game.boss.alive;
  game.openedExit = allItems && allEnemies && bossDead;

  if(game.openedExit && dist(level.exitX, 530, game.player.x, game.player.y) < 90){ finishLevel(); }

}

function fireEnemyShot(x,y,img,scale,vel,damage,bossShot){
  game.enemyShots.push({ x, y, vx:vel.vx, vy:vel.vy, img, scale, life:4.2, damage, bossShot });
}
function targetVelocity(x,y,tx,ty,speed){
  const dx = tx - x, dy = ty - y, d = Math.hypot(dx,dy) || 1;
  return { vx: dx/d*speed, vy: dy/d*speed };
}

function updateParticles(dt){
  for(const p of game.particles){ p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 120*dt; }
  game.particles = game.particles.filter(p=>p.t < p.life);
}

function draw(){
  // Keep the animation loop alive while the main menu is showing.
  // The old build called currentCharDef() before a team existed, which
  // killed requestAnimationFrame on the very first frame.
  if(!level || !game.player || !game.team.length){
    drawMenuBackdrop();
    return;
  }
  drawBackground();
  drawProps();
  drawGroundDecor();
  drawItems();
  drawNpcs();
  drawEnemies();
  drawBoss();
  drawPlayer();
  drawShots();
  drawParticles();
  drawExit();
  drawNearLabels();
}

function drawMenuBackdrop(){
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#dcb1cb'); grad.addColorStop(.6,'#d6abc6'); grad.addColorStop(1,'#c68f7d');
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#6f3c8d'; ctx.fillRect(0,298,W,22);
  ctx.fillStyle = '#c68f7d'; ctx.fillRect(0,FLOOR_Y,W,FLOOR_H);
}

function drawBackground(){
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#dcb1cb'); grad.addColorStop(.6,'#d6abc6'); grad.addColorStop(1,'#c7968e');
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
  // circles
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  for(let i=0;i<5;i++){
    const x = ((i*760 - cameraX*0.35) % (W+320)) - 100; ctx.beginPath(); ctx.arc(x, 120 + (i%2)*28, 110 + (i%3)*20, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = '#6f3c8d'; ctx.fillRect(0, 298, W, 22);
  ctx.fillStyle = '#c68f7d'; ctx.fillRect(0, FLOOR_Y, W, FLOOR_H);
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 2;
  for(let y = 432; y < H; y += 56){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  for(let x=-40; x < W+80; x += 150){ ctx.beginPath(); ctx.moveTo(x - (cameraX%150), H); ctx.lineTo(x + 40 - (cameraX%150), FLOOR_Y); ctx.stroke(); }
  drawLegend();
}

function drawLegend(){
  ctx.save();
  ctx.translate(0,0);
  // hint ribbon mid top
  drawRoundedRect(450, 128, 380, 48, 22, 'rgba(74,24,110,.92)');
  ctx.fillStyle = '#fff1d0'; ctx.font='bold 16px Arial'; ctx.textAlign='center';
  const c = currentCharDef();
  ctx.fillText(`${c.name} • ${c.ability}`, 640, 159);
  ctx.restore();
}

function drawProps(){
  for(const [key,x,y,h] of level.props){
    const img = assets['assets/props/'+key+'.png']; if(!img) continue;
    drawImageWorld(img,x,y,h);
  }
}
function drawGroundDecor(){
  ctx.save();
  ctx.globalAlpha = .18; ctx.fillStyle='#ffffff';
  for(let i=0;i<6;i++){
    const x = (i*250 - (cameraX*.6)%250) + 20; ctx.fillRect(x, H-84, 1, 55);
  }
  ctx.restore();
}

function drawItems(){
  for(const item of game.items){
    if(item.found) continue;
    const img = assets['assets/items/'+item.key+'.png']; if(!img) continue;
    const sx = item.x - cameraX, sy = item.y + Math.sin(item.bob)*8;
    glowCircle(sx, sy+24, 34, 'rgba(255,216,107,.22)', 'rgba(255,216,107,.75)');
    drawImageScreen(img, sx, sy, 68);
    if(dist(item.x,item.y,game.player.x,game.player.y) < 170){
      floatingTag(sx, sy-38, item.label, 'TREASURE', '#ffe286', '#7a4d00');
    }
  }
}
function drawNpcs(){
  for(const npc of game.npcList){
    const img = assets['assets/'+NPCS[npc.key].img]; if(!img) continue;
    drawImageWorld(img, npc.x, npc.y, 132);
    if(nearNpc && nearNpc.id === npc.id && state === 'playing') floatingTag(npc.x - cameraX, npc.y - 128, NPCS[npc.key].name, 'FRIEND • SPACE', '#9df8d1', '#0f563d');
  }
}
function drawEnemies(){
  for(const e of game.enemies){
    if(!e.alive) continue;
    const def = ENEMY_TYPES[e.type]; const img = assets['assets/'+def.img]; if(!img) continue;
    const sx = e.x - cameraX, sy = e.y;
    glowCircle(sx, sy+20, 34, 'rgba(255,84,128,.17)', 'rgba(255,91,141,.75)');
    if(e.hitFlash>0){ ctx.save(); ctx.globalAlpha = .28; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(sx, sy-20, 58, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
    drawImageScreen(img, sx, sy, 118);
    floatingTag(sx, sy-108, def.name, 'PRANKSTER', '#ffb8ce', '#6d1636', 0.84);
    drawHpPips(sx, sy+84, e.hp, ENEMY_TYPES[e.type].hp, '#ff86a8');
  }
}
function drawBoss(){
  if(!game.boss.alive && !game.openedExit) return;
  const b = game.boss; const def = BOSS_TYPES[b.key]; const img = assets['assets/'+def.img]; if(!img) return;
  const sx = b.x - cameraX, sy = b.y;
  glowCircle(sx, sy+26, 64, 'rgba(255,135,91,.16)', 'rgba(255,140,100,.8)');
  if(b.hitFlash>0){ ctx.save(); ctx.globalAlpha=.25; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(sx, sy-40, 92, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
  drawImageScreen(img, sx, sy, 220);
  if(game.boss.alive){ floatingTag(sx, sy-158, def.name, 'BOSS', '#ffd3b9', '#703311', 1.05); drawHpPips(sx, sy+128, b.hp, b.maxHp, '#ff9455', 9); }
}
function drawPlayer(){
  const t = currentTeamMember(); const c = currentCharDef(); const img = assets['assets/'+c.img]; if(!img) return;
  const sx = game.player.x - cameraX, sy = game.player.y;
  glowCircle(sx, sy+24, 42, `rgba(255,255,255,.16)`, c.color);
  drawImageScreen(img, sx, sy, 150);
  floatingTag(sx, sy-120, c.name, currentCharDef().ability, '#fff3bd', '#4c2d00', 0.94);
  drawHpPips(sx, sy+90, t.hp, c.maxHp, c.color, 7);
  if(abilityOwner === t.key && abilityTimer>0){
    ctx.save(); ctx.strokeStyle = c.color; ctx.lineWidth = 4; ctx.setLineDash([8,6]); ctx.beginPath(); ctx.arc(sx, sy-12, 84 + Math.sin(performance.now()/120)*4, 0, Math.PI*2); ctx.stroke(); ctx.restore();
    if(t.key==='vampire' && abilityData && abilityData.targetId){
      const item = game.items.find(i=>i.id===abilityData.targetId && !i.found); if(item){
        ctx.save(); ctx.strokeStyle='#ffe97a'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(sx, sy-60); ctx.lineTo(item.x-cameraX, item.y-20); ctx.stroke(); ctx.restore();
      }
    }
  }
}
function drawShots(){
  for(const s of game.playerShots){
    const img = assets['assets/'+s.img]; if(!img) continue;
    drawImageScreen(img, s.x-cameraX, s.y, 82*s.scale*2.8, Math.atan2(s.vy,s.vx));
  }
  for(const s of game.enemyShots){
    const img = assets['assets/'+s.img]; if(!img) continue;
    drawImageScreen(img, s.x-cameraX, s.y, (s.bossShot?104:78)*s.scale*2.6, Math.atan2(s.vy,s.vx));
    glowCircle(s.x-cameraX, s.y, s.bossShot?22:18, 'rgba(255,85,125,.15)','rgba(255,85,125,.6)');
  }
}
function drawParticles(){
  for(const p of game.particles){
    ctx.save(); ctx.globalAlpha = 1 - p.t/p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x-cameraX, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
  }
}
function drawExit(){
  const x = level.exitX - cameraX, y = 540;
  const img = assets['assets/props/magic_door.png']; if(img) drawImageScreen(img, x, y, 190);
  if(game.openedExit){ floatingTag(x, y-128, 'Exit Open', 'Walk into the door', '#d7ffbc', '#2e5624'); }
  else { floatingTag(x, y-128, 'Exit Locked', `${game.items.filter(i=>!i.found).length} treasure • ${game.enemies.filter(e=>e.alive).length} enemy • ${game.boss.alive?1:0} boss`, '#ffd8d8', '#5a2438', 0.82); }
}
function drawNearLabels(){
  if(state!=='playing') return;
  if(!nearNpc) return;
  // small prompt already handled in NPC draw
}

function drawRoundedRect(x,y,w,h,r,fill){
  ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill();
}
function glowCircle(x,y,r,fill,stroke){
  ctx.save(); ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();
}
function floatingTag(x,y,top,bottom,bg,text,scale=1){
  const pad = 10*scale; ctx.save(); ctx.font=`bold ${Math.round(14*scale)}px Arial`; const topW = ctx.measureText(top).width; ctx.font=`bold ${Math.round(11*scale)}px Arial`; const botW = ctx.measureText(bottom).width; const w = Math.max(topW, botW) + pad*2; const h = 36*scale; drawRoundedRect(x-w/2,y-h/2,w,h,14*scale,bg); ctx.fillStyle=text; ctx.textAlign='center'; ctx.font=`bold ${Math.round(14*scale)}px Arial`; ctx.fillText(top,x,y-1*scale); ctx.font=`bold ${Math.round(11*scale)}px Arial`; ctx.fillText(bottom,x,y+12*scale); ctx.restore();
}
function drawImageWorld(img,x,y,h){ drawImageScreen(img, x-cameraX, y, h); }
function drawImageScreen(img,x,y,h,rot=0){
  const ratio = img.width/img.height; const w = h*ratio;
  ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot); ctx.drawImage(img, -w/2, -h, w, h); ctx.restore();
}
function drawHpPips(x,y,hp,max,color, maxShow=8){
  const show = Math.min(max, maxShow); const dotW = 12; const start = x - (show*dotW + (show-1)*4)/2;
  ctx.save(); for(let i=0;i<show;i++){ ctx.fillStyle = i < hp ? color : 'rgba(255,255,255,.18)'; drawRoundedRect(start + i*(dotW+4), y, dotW, 8, 5, ctx.fillStyle); } ctx.restore();
}

function loop(now){
  const dt = Math.min(.033, (now-lastTime)/1000);
  lastTime = now;
  update(dt); draw();
  requestAnimationFrame(loop);
}

function onKeyDown(e){
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Spacebar'].includes(e.key)) e.preventDefault();
  keys.add(k);
  if(state === 'dialogue' && (e.key === ' ' || e.code === 'Space')){ advanceDialogue(); return; }
  if(state === 'intro' && (e.key === ' ' || e.code === 'Space' || e.key === 'Enter')){ beginPlay(); return; }
  if(state !== 'playing') return;
  if(e.key === 'f' || e.key === 'F') fire();
  if(e.key === ' ' || e.code === 'Space'){ if(nearNpc) openDialogue(nearNpc); else useAbility(); }
  if(e.key === 'q' || e.key === 'Q') switchBy(-1);
  if(e.key === 'e' || e.key === 'E') switchBy(1);
  if(/^[1-6]$/.test(e.key)) switchToIndex(Number(e.key)-1);
}
function onKeyUp(e){ const k = e.key.length===1 ? e.key.toLowerCase() : e.key; keys.delete(k); }

function bindUi(){
  dom.playBtn.onclick = () => { playMusic(); startLevel(0); };
  dom.introBtn.onclick = beginPlay;
  dom.nextBtn.onclick = () => endReason==='final' ? backToMenu() : startLevel(levelIndex+1);
  dom.replayBtn.onclick = () => startLevel(levelIndex);
  dom.menuBtn.onclick = backToMenu;
  dom.retryFromLoseBtn.onclick = () => startLevel(levelIndex);
  dom.menuFromLoseBtn.onclick = backToMenu;
  if(dom.musicBtn) dom.musicBtn.onclick = toggleMusic;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

(async function init(){
  bindUi();
  setMusicButton();
  await loadAssets();
  backToMenu();
  requestAnimationFrame(loop);
})();

})();
