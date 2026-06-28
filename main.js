const safeArea = document.getElementById('safeArea');
const canvas   = document.getElementById('gameCanvas');
const ctx      = canvas.getContext('2d');

// ─── Fixed internal resolution (letterbox scaling via CSS transform) ──────────
const GAME_W = 960;
const GAME_H = 540;
canvas.width  = GAME_W;
canvas.height = GAME_H;

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
    // Tile horizontally: scale image to canvas height, scroll
    const iw     = Math.round(bgImg.naturalWidth * (GAME_H / bgImg.naturalHeight));
    const offset = -(GS.scrollX * 0.3) % iw;
    for (let x = offset; x < GAME_W + iw; x += iw) {
      ctx.drawImage(bgImg, x, 0, iw, GAME_H);
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
    case 'life':
      if (GS.lives < 5) GS.lives++;
      else GS.score += 500;
      break;
  }
}

// ─── Safe-area insets (resolved from CSS env() on the safeArea wrapper) ──────
function getSafeInsets() {
  const cs = getComputedStyle(safeArea);
  return {
    top:    parseFloat(cs.paddingTop)    || 0,
    right:  parseFloat(cs.paddingRight)  || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left:   parseFloat(cs.paddingLeft)   || 0,
  };
}

// ─── Resize — letterbox within safe area, maintain 16:9 ──────────────────────
function resize() {
  const ins    = getSafeInsets();
  const availW = window.innerWidth  - ins.left - ins.right;
  const availH = window.innerHeight - ins.top  - ins.bottom;
  const scale  = Math.min(availW / GAME_W, availH / GAME_H);
  const ox     = Math.round((availW - GAME_W * scale) / 2);
  const oy     = Math.round((availH - GAME_H * scale) / 2);
  canvas.style.width     = GAME_W + 'px';
  canvas.style.height    = GAME_H + 'px';
  canvas.style.left      = (ins.left + ox) + 'px';
  canvas.style.top       = (ins.top  + oy) + 'px';
  canvas.style.transform = `scale(${scale})`;
  if (player) player.clamp();
}

let resizeTimer = null;
function onResize() {
  resize();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    initBg();
    initPlants();
    initDecos(canvas);
    if (player) player.clamp();
  }, 150);
}

// Convert viewport client coords → fixed 960×540 canvas coords (inverse letterbox + safe area)
function clientToCanvas(cx, cy) {
  const ins    = getSafeInsets();
  const availW = window.innerWidth  - ins.left - ins.right;
  const availH = window.innerHeight - ins.top  - ins.bottom;
  const scale  = Math.min(availW / GAME_W, availH / GAME_H);
  const ox     = (availW - GAME_W * scale) / 2;
  const oy     = (availH - GAME_H * scale) / 2;
  return {
    x: (cx - ins.left - ox) / scale,
    y: (cy - ins.top  - oy) / scale,
  };
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
  console.log('[startStage] num=' + num);
  const def     = STAGE_DEFS[num - 1];
  if (!def) { console.error('[startStage] no stage def for num=' + num); return; }
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

// ─── Stage transition timing ──────────────────────────────────────────────────
const LAST_STAGE     = STAGE_DEFS[STAGE_DEFS.length - 1].stageObj;
const COLLECT_FRAMES = 180;   // 3s item collection
const FADEOUT_FRAMES = 75;    // 1.25s fade to black
const HOLD_FRAMES    = 45;    // 0.75s full black (next stage prepped at midpoint)
const FADEIN_FRAMES  = 75;    // 1.25s fade from black
const PREP_FRAME     = COLLECT_FRAMES + FADEOUT_FRAMES + Math.floor(HOLD_FRAMES / 2);
const DONE_FRAME     = COLLECT_FRAMES + FADEOUT_FRAMES + HOLD_FRAMES + FADEIN_FRAMES;

let _nextStageLabel    = '';    // "STAGE 2" shown during blackout
let _nextStagePrepped  = false;
let _clearIsLastStage  = false; // cached at stageclear start; stays correct after _prepNextStage() swaps currentStage

function _prepNextStage() {
  const idx = STAGE_DEFS.findIndex(d => d.stageObj === currentStage);
  if (idx < 0 || idx + 1 >= STAGE_DEFS.length) return;
  const def    = STAGE_DEFS[idx + 1];
  bullets      = [];
  enemies      = [];
  items        = [];
  scorePopups  = [];
  frame        = 0;
  GS.scrollX   = 0;
  GS.shield    = 0;
  GS.petCount  = 0;
  GS.invincible = 0;
  GS.giant     = false;
  if (player) {
    player.x = GAME_W * 0.15;  player.targetX = player.x;
    player.y = GAME_H / 2;     player.targetY = player.y;
  }
  currentStage = def.stageObj;
  currentStage.init();
  bgImg.src = def.bg;
  initBg();
  initPlants();
  initDecos(canvas);
}

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
    updateParticles();
    updateShake();

    const t = GS.clearTimer;

    // Cache isLast at the very first frame of stageclear so it stays stable
    // even after _prepNextStage() replaces currentStage with the next (possibly LAST) stage.
    if (t === 1) _clearIsLastStage = (currentStage === LAST_STAGE);
    const isLast = _clearIsLastStage;

    if (isLast) {
      // Last stage: just let player collect, tap to continue
      const ks = Math.round(canvas.height * 0.009);
      if (keys['ArrowUp']    || keys['w'] || keys['W']) player.targetY -= ks;
      if (keys['ArrowDown']  || keys['s'] || keys['S']) player.targetY += ks;
      if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.targetX -= ks;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) player.targetX += ks;
      player.update();
      for (const item of items) item.update();
      for (const item of items) {
        if (item.dead) continue;
        if (overlap(item, player)) { item.dead = true; applyItem(item.type, player.x, player.y); }
      }
      items = items.filter(item => !item.dead);
      return;
    }

    // Non-last: collect phase — player active, invincible, no hit
    if (t === 1) {
      const idx = STAGE_DEFS.findIndex(d => d.stageObj === currentStage);
      _nextStageLabel   = idx >= 0 && idx + 1 < STAGE_DEFS.length ? STAGE_DEFS[idx + 1].label : '';
      _nextStagePrepped = false;
    }
    if (t <= COLLECT_FRAMES) {
      GS.invincible = Math.max(GS.invincible, 2); // keep invincible during collect
      const ks = Math.round(canvas.height * 0.009);
      if (keys['ArrowUp']    || keys['w'] || keys['W']) player.targetY -= ks;
      if (keys['ArrowDown']  || keys['s'] || keys['S']) player.targetY += ks;
      if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.targetX -= ks;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) player.targetX += ks;
      player.update();
      for (const item of items) item.update();
      for (const item of items) {
        if (item.dead) continue;
        if (overlap(item, player)) { item.dead = true; applyItem(item.type, player.x, player.y); }
      }
      items = items.filter(item => !item.dead);
    }

    // Mid-blackout: quietly initialize next stage content
    if (t === PREP_FRAME && !_nextStagePrepped) {
      _nextStagePrepped = true;
      _prepNextStage();
    }

    // Full transition complete → start playing
    if (t >= DONE_FRAME) {
      GS.phase      = 'playing';
      GS.clearTimer = 0;
    }
    return;
  }
  if (paused || GS.phase !== 'playing') return;

  frame++;
  GS.scrollX += GS.scrollSpeed;
  updateBg();
  updatePlants();
  updateDecos(canvas);

  updateParticles();
  updateShake();

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
      if (e.x >= canvas.width) continue; // not yet on-screen — no hitbox
      if (overlap(b, e)) {
        b.dead = true;
        if (e.invincibleTimer > 0) continue;
        if (e.onHit) e.onHit();
        e.hp--;
        if (e.hp <= 0) {
          enemyDeathFX(e);
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
          enemyDeathFX(e);
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
            enemyDeathFX(e);
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

  // Game world with screen shake
  const { x: sx, y: sy } = getShakeOffset();
  const doShake = sx !== 0 || sy !== 0;
  if (doShake) { ctx.save(); ctx.translate(sx, sy); }

  drawBg();
  drawParticles(ctx);
  items.forEach(item => item.draw(ctx));
  enemies.forEach(e => e.draw(ctx));
  bullets.forEach(b => b.draw(ctx));
  pets.forEach(p => p.draw(ctx));
  player.draw(ctx);
  drawScorePopups();

  if (doShake) ctx.restore();

  // UI and overlays — no shake
  drawUI(ctx, canvas);
  currentStage.draw(ctx, canvas);
  if (GS.phase === 'stageclear' && _clearIsLastStage)  drawStageClear(ctx, canvas, true);
  if (GS.phase === 'stageclear' && !_clearIsLastStage) _drawTransitionOverlay();
  if (GS.phase === 'gameover')   drawGameOver(ctx, canvas);
  if (paused && GS.phase === 'playing') drawPaused(ctx, canvas);
}

function _drawTransitionOverlay() {
  const t  = GS.clearTimer;
  const fo = COLLECT_FRAMES;
  const hd = fo + FADEOUT_FRAMES;
  const fi = hd + HOLD_FRAMES;

  let alpha = 0;
  if (t > fo && t <= hd) {
    alpha = (t - fo) / FADEOUT_FRAMES;
  } else if (t > hd && t <= fi) {
    alpha = 1;
  } else if (t > fi) {
    alpha = Math.max(0, 1 - (t - fi) / FADEIN_FRAMES);
  }
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle   = '#000';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Stage label fades in during hold, fades out early in fade-in
  if (_nextStageLabel && t > hd) {
    const labelProgress = t <= fi
      ? Math.min(1, (t - hd) / (HOLD_FRAMES * 0.6))
      : Math.max(0, 1 - (t - fi) / (FADEIN_FRAMES * 0.35));
    if (labelProgress > 0) {
      const sz = Math.round(GAME_H * 0.072);
      ctx.globalAlpha  = labelProgress;
      ctx.font         = `${sz}px 'Press Start 2P', monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#ffffff';
      ctx.shadowColor  = '#00e5ff';
      ctx.shadowBlur   = 32;
      ctx.fillText(_nextStageLabel, GAME_W / 2, GAME_H / 2);
      ctx.shadowBlur   = 0;
    }
  }
  ctx.restore();
}

// ─── Loop ─────────────────────────────────────────────────────────────────────
function loop() {
  try {
    update();
    draw();
  } catch (err) {
    console.error('[loop error]', err);
  }
  requestAnimationFrame(loop);
}

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
  // Called for: tap on last-stage clear, gameover tap → back to title
  init();
}

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t   = e.touches[0];
  const pos = clientToCanvas(t.clientX, t.clientY);
  const px  = pos.x, py = pos.y;
  const TOUCH_X_OFFSET = 80;
  const TOUCH_Y_OFFSET = 40;
  console.log('[touch] phase=' + GS.phase + ' px=' + Math.round(px) + ' py=' + Math.round(py) + ' canvas=' + canvas.width + 'x' + canvas.height + ' bounds=' + titleBtnBounds.length);
  if (GS.phase === 'title') {
    for (let i = 0; i < titleBtnBounds.length; i++) {
      const b = titleBtnBounds[i];
      console.log('[touch] btn[' + i + '] x=' + Math.round(b.x) + ' y=' + Math.round(b.y) + ' w=' + Math.round(b.w) + ' h=' + Math.round(b.h));
      if (inRect(px, py, b)) {
        console.log('[touch] HIT btn ' + i + ' → startStage(' + (i + 1) + ')');
        startStage(i + 1); return;
      }
    }
    console.log('[touch] no button hit on title');
    return;
  }
  if (handlePauseOrRestart(px, py)) return;
  if (paused) return;
  if (GS.phase === 'gameover') { handleClearOrGameover(); return; }
  if (GS.phase === 'stageclear' && currentStage === LAST_STAGE) { handleClearOrGameover(); return; }
  if (GS.phase === 'stageclear') return; // mid-transition, ignore taps
  player.setTarget(px + TOUCH_X_OFFSET, py - TOUCH_Y_OFFSET);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (paused) return;
  const t   = e.touches[0];
  const pos = clientToCanvas(t.clientX, t.clientY);
  player.setTarget(pos.x + 80, pos.y - 40);
}, { passive: false });

canvas.addEventListener('touchend', e => { e.preventDefault(); }, { passive: false });

let mouseDown = false;
canvas.addEventListener('mousedown', e => {
  mouseDown = true;
  const pos = clientToCanvas(e.clientX, e.clientY);
  const px  = pos.x, py = pos.y;
  if (GS.phase === 'title') {
    for (let i = 0; i < titleBtnBounds.length; i++) {
      if (inRect(px, py, titleBtnBounds[i])) { startStage(i + 1); return; }
    }
    return;
  }
  if (handlePauseOrRestart(px, py)) return;
  if (paused) return;
  if (GS.phase === 'gameover') { handleClearOrGameover(); return; }
  if (GS.phase === 'stageclear' && currentStage === LAST_STAGE) { handleClearOrGameover(); return; }
  if (GS.phase === 'stageclear') return; // mid-transition, ignore taps
  player.setTarget(px, py);
});
canvas.addEventListener('mousemove', e => {
  if (mouseDown && GS.phase === 'playing' && !paused && player) {
    const pos = clientToCanvas(e.clientX, e.clientY);
    player.setTarget(pos.x, pos.y);
  }
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
