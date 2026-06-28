const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

let player, bullets, enemies, items, pets, frame, scorePopups, currentStage;
const keys = {};

let paused           = false;
let pauseBtnBounds   = { x: 0, y: 0, w: 0, h: 0 };
let resumeBtnBounds  = { x: 0, y: 0, w: 0, h: 0 };
let restartBtnBounds = { x: 0, y: 0, w: 0, h: 0 };
let titleBtnBounds   = [];

function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// ─── Image assets ─────────────────────────────────────────────────────────────
const bgImg = new Image();
bgImg.src = 'assets/images/bg_stage1.png';

const plantImgs = Array.from({ length: 5 }, (_, i) => {
  const img = new Image();
  img.src = `assets/images/plant_0${i}.png`;
  return img;
});

// ─── Background bubbles ───────────────────────────────────────────────────────
const bgLayers = [];

function initBg() {
  bgLayers.length = 0;
  const sc = canvas.height / 600;
  const defs = [
    { count: 22, speedMul: 0.25, minR: 1.5 * sc, maxR: 4 * sc },
    { count: 14, speedMul: 0.65, minR: 3   * sc, maxR: 7 * sc },
  ];
  for (const d of defs) {
    const bubbles = [];
    for (let i = 0; i < d.count; i++) {
      bubbles.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * (d.maxR - d.minR) + d.minR,
        alpha: Math.random() * 0.25 + 0.05,
        rise:  (Math.random() * 0.25 + 0.08) * sc,
      });
    }
    bgLayers.push({ items: bubbles, speedMul: d.speedMul });
  }
}

function updateBg() {
  for (const layer of bgLayers) {
    for (const b of layer.items) {
      b.x -= GS.scrollSpeed * layer.speedMul;
      b.y -= b.rise;
      if (b.x < -10) b.x = canvas.width + 10;
      if (b.y < -10) b.y = canvas.height + 10;
    }
  }
}


// ─── Plants ───────────────────────────────────────────────────────────────────
const plants = [];

function initPlants() {
  plants.length = 0;
  for (let i = 0; i < 10; i++) plants.push(makePlant(Math.random() * canvas.width));
}

function makePlant(x) {
  return { x, imgIdx: Math.floor(Math.random() * 5), scale: 0.35 + Math.random() * 0.45 };
}

function updatePlants() {
  for (const p of plants) {
    p.x -= GS.scrollSpeed * 0.85;
    if (p.x < -80) {
      p.x = canvas.width + 40 + Math.random() * 150;
      p.imgIdx = Math.floor(Math.random() * 5);
      p.scale  = 0.35 + Math.random() * 0.45;
    }
  }
}

// ─── Draw background ──────────────────────────────────────────────────────────
function drawBg() {
  if (bgImg.complete && bgImg.naturalWidth > 0) {
    const scale  = canvas.height / bgImg.naturalHeight;
    const iw     = bgImg.naturalWidth * scale;
    const offset = -(GS.scrollX * 0.3) % iw;
    for (let x = offset; x < canvas.width + iw; x += iw) {
      ctx.drawImage(bgImg, x, 0, iw, canvas.height);
    }
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0,   '#060e1c');
    g.addColorStop(0.5, '#0a1e38');
    g.addColorStop(1,   '#030810');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Bubbles
  for (const layer of bgLayers) {
    ctx.save();
    for (const b of layer.items) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(110,200,255,${b.alpha})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Deco objects (jellyfish, bubbles, fish schools — behind plants and seabed)
  drawDecos(ctx);

  // Seabed
  const SB_H = Math.round(canvas.height * 0.035);
  const sbY  = canvas.height - SB_H;

  // Plants (drawn before seabed strip so bases are hidden)
  const baseSize = canvas.height * 0.22;
  for (const p of plants) {
    const img = plantImgs[p.imgIdx];
    if (!img.complete || !img.naturalWidth) continue;
    const w = baseSize * p.scale;
    const h = baseSize * p.scale;
    ctx.drawImage(img, p.x - w / 2, sbY - h + SB_H * 0.7, w, h);
  }

  // Seabed strip
  const sbG = ctx.createLinearGradient(0, sbY, 0, canvas.height);
  sbG.addColorStop(0, '#0a1a10');
  sbG.addColorStop(1, '#050c08');
  ctx.fillStyle = sbG;
  ctx.fillRect(0, sbY, canvas.width, SB_H);

}

// ─── Collision (AABB centre-based, 80% of size) ───────────────────────────────
function overlap(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) * 0.4 &&
    Math.abs(a.y - b.y) < (a.h + b.h) * 0.4
  );
}

// ─── Item drop ────────────────────────────────────────────────────────────────
function rollDrop(x, y) {
  const r = Math.random();
  if (r < 0.060) return new Item(x, y, 'red');
  if (r < 0.110) return new Item(x, y, 'blue');
  if (r < 0.150) return new Item(x, y, 'pink');
  if (r < 0.170) return new Item(x, y, 'green');
  if (r < 0.250) return new Item(x, y, 'yellow');
  return null;
}

function applyItem(type, px, py) {
  switch (type) {
    case 'red':
      if (GS.powerLevel < 3) GS.powerLevel++;
      else GS.score += 500;
      break;
    case 'blue':
      if (GS.shield < 2) GS.shield++;
      else GS.score += 300;
      break;
    case 'pink':
      if (GS.petCount < 2) {
        pets.push(new Pet(canvas, GS.petCount, px, py));
        GS.petCount++;
      } else GS.score += 200;
      break;
    case 'green':
      if (GS.invincible > 0) GS.score += 400;
      GS.invincible = 300;
      GS.giant = true;
      break;
    case 'yellow':
      GS.score += 1000;
      scorePopups.push({ x: px, y: py, timer: 55 });
      break;
    case 'life':   GS.lives = Math.min(GS.lives + 1, 5); break;
  }
}

// ─── Resize ───────────────────────────────────────────────────────────────────
function resize() {
  canvas.width        = window.innerWidth;
  canvas.height       = window.innerHeight;
  canvas.style.width  = '';
  canvas.style.height = '';
  if (player) player.clamp();
}

let resizeTimer = null;
function onResize() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  console.log('[resize]', W, H);
  canvas.width        = W;
  canvas.height       = H;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    initBg();
    initPlants();
    initDecos(canvas);
    if (player) player.clamp();
  }, 150);
}

// ─── Stage definitions (add entries here to extend to future stages) ──────────
const STAGE_DEFS = [
  { label: 'STAGE 1', stageObj: stage1, bg: 'assets/images/bg_stage1.png' },
  { label: 'STAGE 2', stageObj: stage2, bg: 'assets/images/bg_stage2.png' },
];
const STAGE_LABELS = STAGE_DEFS.map(d => d.label);

// ─── Init (title screen) ──────────────────────────────────────────────────────
function init() {
  paused        = false;
  GS.phase      = 'title';
  GS.clearTimer = 0;
  bgImg.src     = 'assets/images/bg_stage1.png';
  resize();
  initBg();
  initPlants();
  initDecos(canvas);
}

// ─── Start a specific stage (called from title screen) ────────────────────────
function startStage(num) {
  const def     = STAGE_DEFS[num - 1];
  paused        = false;
  player        = new Player(canvas);
  bullets       = [];
  enemies       = [];
  items         = [];
  pets          = [];
  scorePopups   = [];
  frame         = 0;
  GS.score      = 0;
  GS.lives      = QA_MODE ? 99 : 3;
  GS.phase      = 'playing';
  GS.scrollX    = 0;
  GS.powerLevel = 0;
  GS.shield     = 0;
  GS.petCount   = 0;
  GS.invincible = 0;
  GS.giant      = false;
  GS.clearTimer = 0;
  currentStage  = def.stageObj;
  currentStage.init();
  bgImg.src     = def.bg;
  initBg();
  initPlants();
  initDecos(canvas);
}

// ─── Update ───────────────────────────────────────────────────────────────────
const LAST_STAGE        = STAGE_DEFS[STAGE_DEFS.length - 1].stageObj;
const CLEAR_MIN_FRAMES  = 120;   // 2s minimum wait before auto-transition
const CLEAR_MAX_FRAMES  = 600;   // 10s safety cap

function update() {
  if (GS.phase === 'title') {
    GS.scrollX += GS.scrollSpeed;
    updateBg();
    updatePlants();
    updateDecos(canvas);
    return;
  }
  if (GS.phase === 'stageclear') {
    GS.clearTimer++;
    GS.scrollX += GS.scrollSpeed;
    updateBg();
    updatePlants();
    updateDecos(canvas);

    // Keep player moveable so items can be collected
    const ks = Math.round(canvas.height * 0.009);
    if (keys['ArrowUp']    || keys['w'] || keys['W']) player.targetY -= ks;
    if (keys['ArrowDown']  || keys['s'] || keys['S']) player.targetY += ks;
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.targetX -= ks;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.targetX += ks;
    player.update();

    for (const item of items) item.update();
    for (const item of items) {
      if (item.dead) continue;
      if (overlap(item, player)) {
        item.dead = true;
        applyItem(item.type, player.x, player.y);
      }
    }
    items = items.filter(item => !item.dead);

    if (currentStage !== LAST_STAGE) {
      const allGone  = items.length === 0 && GS.clearTimer >= CLEAR_MIN_FRAMES;
      const timedOut = GS.clearTimer >= CLEAR_MAX_FRAMES;
      if (allGone || timedOut) {
        GS.clearTimer = 0;
        handleClearOrGameover();
      }
    }
    return;
  }
  if (paused || GS.phase !== 'playing') return;

  frame++;
  GS.scrollX += GS.scrollSpeed;
  updateBg();
  updatePlants();
  updateDecos(canvas);

  if (GS.invincible > 0) {
    GS.invincible--;
    if (GS.invincible === 0) GS.giant = false;
  }

  // Keyboard movement (speed scales with canvas height)
  const ks = Math.round(canvas.height * 0.009);
  if (keys['ArrowUp']    || keys['w'] || keys['W']) player.targetY -= ks;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) player.targetY += ks;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.targetX -= ks;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player.targetX += ks;

  // Player fire
  const fired = player.update();
  if (fired) {
    const isLarge = GS.powerLevel >= 2;
    for (const cfg of fired) {
      bullets.push(new Bullet(player.x + player.w / 2, player.y, cfg.vx, cfg.vy, true, false, isLarge));
    }
  }

  // Pet fire
  for (const p of pets) {
    const petFired = p.update(player);
    if (petFired) {
      const isLarge = GS.powerLevel >= 2;
      for (const cfg of petFired) {
        bullets.push(new Bullet(p.x + p.w / 2, p.y, cfg.vx, cfg.vy, true, false, isLarge));
      }
    }
  }

  currentStage.update(frame, canvas, enemies);

  for (const b of bullets) b.update(canvas);
  bullets = bullets.filter(b => !b.dead);

  // Enemy update — boss returns shots when firing
  for (const e of enemies) {
    const shots = e.update(player);
    if (shots) {
      const isBoss = e instanceof BossPuffer || e instanceof BossShark;
      for (const s of shots) {
        const opts = s.img ? { img: s.img, w: s.bw, h: s.bh } : {};
        bullets.push(new Bullet(s.x, s.y, s.vx, s.vy, false, isBoss, false, opts));
      }
    }
  }

  // Drain pending spawns from bosses (e.g. BossShark phase 3 minions)
  const newSpawns = [];
  for (const e of enemies) {
    if (e.pendingSpawns && e.pendingSpawns.length) {
      newSpawns.push(...e.pendingSpawns);
      e.pendingSpawns = [];
    }
  }
  enemies.push(...newSpawns);

  enemies = enemies.filter(e => !e.dead);

  for (const item of items) item.update();
  items = items.filter(item => !item.dead);

  // Player bullets vs enemies
  for (const b of bullets) {
    if (!b.fromPlayer) continue;
    for (const e of enemies) {
      if (b.dead || e.dead || e.dying) continue;
      if (overlap(b, e)) {
        b.dead = true;
        if (e.invincibleTimer > 0) continue;
        if (e.onHit) e.onHit();
        e.hp--;
        if (e.hp <= 0) {
          GS.score += e.scoreValue;
          if (e.onDeath) e.onDeath();
          else e.dead = true;
          if (e.getDrops) {
            for (const d of e.getDrops()) items.push(new Item(d.x, d.y, d.type, d.sizeScale));
          } else if (e.dropLife) {
            items.push(new Item(e.x, e.y, 'life'));
          } else {
            const drop = rollDrop(e.x, e.y);
            if (drop) items.push(drop);
          }
        }
      }
    }
  }

  // Enemy body vs player
  if (GS.invincible > 0) {
    for (const e of enemies) {
      if (e._giantDmgTimer > 0) e._giantDmgTimer--;
      if (e.dead || e.dying) continue;
      if (overlap(e, player)) {
        if (e.invincibleTimer > 0) continue;
        if (e._giantDmgTimer > 0) continue;
        const isBossType = e instanceof MidbossRay || e instanceof BossPuffer ||
                           e instanceof MidbossTurtle || e instanceof BossShark;
        if (e.onHit) e.onHit();
        if (isBossType && e.maxHp) {
          // Giant damage capped at 30% of boss maxHp per hit, 1s cooldown
          const dmg = Math.min(e.hp, Math.floor(e.maxHp * 0.30));
          e.hp -= dmg;
          e._giantDmgTimer = 60;
        } else {
          e.hp = 0;
        }
        if (e.hp <= 0) {
          GS.score += e.scoreValue;
          if (e.onDeath) e.onDeath();
          else e.dead = true;
          if (e.getDrops) {
            for (const d of e.getDrops()) items.push(new Item(d.x, d.y, d.type, d.sizeScale));
          } else if (e.dropLife) {
            items.push(new Item(e.x, e.y, 'life'));
          } else {
            const drop = rollDrop(e.x, e.y);
            if (drop) items.push(drop);
          }
        }
      }
    }
  } else if (player.hitTimer === 0) {
    for (const e of enemies) {
      if (e.dead || e.dying) continue;
      if (overlap(e, player)) {
        if (e instanceof MidbossRay || e instanceof BossPuffer ||
            e instanceof MidbossTurtle || e instanceof BossShark) {
          // Boss body contact: deal HP damage (not instant kill)
          if (e.onHit) e.onHit();
          e.hp--;
          if (e.hp <= 0) {
            GS.score += e.scoreValue;
            if (e.onDeath) e.onDeath();
            else e._dead = true;
            if (e.getDrops) {
              for (const d of e.getDrops()) items.push(new Item(d.x, d.y, d.type, d.sizeScale));
            } else if (e.dropLife) {
              items.push(new Item(e.x, e.y, 'life'));
            } else {
              const drop = rollDrop(e.x, e.y);
              if (drop) items.push(drop);
            }
          }
        } else {
          e.dead = true;
        }
        if (player.hit() && GS.lives <= 0) GS.phase = 'gameover';
        break;
      }
    }
  }

  // Enemy bullets vs player
  if (GS.invincible === 0 && player.hitTimer === 0) {
    for (const b of bullets) {
      if (b.fromPlayer || b.dead) continue;
      if (overlap(b, player)) {
        b.dead = true;
        if (player.hit() && GS.lives <= 0) GS.phase = 'gameover';
        break;
      }
    }
  }

  // Score popups
  for (const p of scorePopups) { p.y -= 0.7; p.timer--; }
  scorePopups = scorePopups.filter(p => p.timer > 0);

  // Items vs player
  for (const item of items) {
    if (item.dead) continue;
    if (overlap(item, player)) {
      item.dead = true;
      applyItem(item.type, player.x, player.y);
    }
  }
}

// ─── Score popups ─────────────────────────────────────────────────────────────
function drawScorePopups() {
  const fontSize = Math.round(canvas.height * 0.028);
  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const p of scorePopups) {
    ctx.globalAlpha = p.timer / 55;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('+1000', p.x, p.y);
  }
  ctx.restore();
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function draw() {
  if (GS.phase === 'title') {
    drawBg();
    drawTitle(ctx, canvas, QA_MODE ? STAGE_LABELS : ['START'], titleBtnBounds);
    return;
  }
  drawBg();
  items.forEach(item => item.draw(ctx));
  enemies.forEach(e => e.draw(ctx));
  bullets.forEach(b => b.draw(ctx));
  pets.forEach(p => p.draw(ctx));
  player.draw(ctx);
  drawScorePopups();
  drawUI(ctx, canvas);
  currentStage.draw(ctx, canvas);
  if (GS.phase === 'stageclear') drawStageClear(ctx, canvas, currentStage === LAST_STAGE);
  if (GS.phase === 'gameover')   drawGameOver(ctx, canvas);
  if (paused && GS.phase === 'playing') drawPaused(ctx, canvas);
}

// ─── Loop ─────────────────────────────────────────────────────────────────────
function loop() { update(); draw(); requestAnimationFrame(loop); }

// ─── Input ────────────────────────────────────────────────────────────────────
function handlePauseOrRestart(px, py) {
  // Pause button (always visible when playing or paused)
  if (GS.phase === 'playing' || paused) {
    if (inRect(px, py, pauseBtnBounds)) { paused = !paused; return true; }
  }
  // Resume / Restart buttons (pause overlay only)
  if (paused && inRect(px, py, resumeBtnBounds))  { paused = false; return true; }
  if (paused && inRect(px, py, restartBtnBounds)) { paused = false; init(); return true; }
  return false;
}

// ─── Stage transition / restart ───────────────────────────────────────────────
function handleClearOrGameover() {
  if (GS.phase === 'stageclear' && currentStage === stage1) {
    // Stage 1 클리어 → Stage 2 시작
    console.log('[Stage] stage1 clear → stage2 start');
    GS.phase      = 'playing';
    GS.clearTimer = 0;
    enemies       = [];
    bullets       = bullets.filter(b => b.fromPlayer);
    items         = [];
    scorePopups   = [];
    frame         = 0;
    currentStage  = stage2;
    currentStage.init();
    bgImg.src     = 'assets/images/bg_stage2.png';
  } else {
    // 게임오버 또는 스테이지2 클리어 → 처음부터 재시작
    init();
  }
}

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t  = e.touches[0];
  const px = t.clientX, py = t.clientY;
  if (GS.phase === 'title') {
    for (let i = 0; i < titleBtnBounds.length; i++) {
      if (inRect(px, py, titleBtnBounds[i])) { startStage(i + 1); return; }
    }
    return;
  }
  if (handlePauseOrRestart(px, py)) return;
  if (paused) return;
  if (GS.phase === 'gameover' || GS.phase === 'stageclear') { handleClearOrGameover(); return; }
  player.setTarget(px, py);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (paused) return;
  const t = e.touches[0];
  player.setTarget(t.clientX, t.clientY);
}, { passive: false });

canvas.addEventListener('touchend', e => { e.preventDefault(); }, { passive: false });

let mouseDown = false;
canvas.addEventListener('mousedown', e => {
  mouseDown = true;
  const px = e.clientX, py = e.clientY;
  if (GS.phase === 'title') {
    for (let i = 0; i < titleBtnBounds.length; i++) {
      if (inRect(px, py, titleBtnBounds[i])) { startStage(i + 1); return; }
    }
    return;
  }
  if (handlePauseOrRestart(px, py)) return;
  if (paused) return;
  if (GS.phase === 'gameover' || GS.phase === 'stageclear') { handleClearOrGameover(); return; }
  player.setTarget(px, py);
});
canvas.addEventListener('mousemove', e => {
  if (mouseDown && GS.phase === 'playing' && !paused && player) player.setTarget(e.clientX, e.clientY);
});
canvas.addEventListener('mouseup', () => { mouseDown = false; });

window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && GS.phase === 'playing') {
    paused = !paused;
    return;
  }
  keys[e.key] = true;
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

window.addEventListener('resize', onResize);

// ─── Start ────────────────────────────────────────────────────────────────────
init();
loop();
