const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player, bullets, enemies, items, pets, frame;
const keys = {};

// --- Image assets ---
const bgImg = new Image();
bgImg.src = 'assets/images/bg_stage1.png';

const plantImgs = Array.from({ length: 5 }, (_, i) => {
  const img = new Image();
  img.src = `assets/images/plant_0${i}.png`;
  return img;
});

// --- Background bubbles ---
const bgLayers = [];

function initBg() {
  bgLayers.length = 0;
  const defs = [
    { count: 22, speedMul: 0.25, minR: 1.5, maxR: 4 },
    { count: 14, speedMul: 0.65, minR: 3,   maxR: 7 },
  ];
  for (const d of defs) {
    const bubbles = [];
    for (let i = 0; i < d.count; i++) {
      bubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * (d.maxR - d.minR) + d.minR,
        alpha: Math.random() * 0.25 + 0.05,
        rise: Math.random() * 0.25 + 0.08,
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

// --- Seabed rocks ---
const rocks = [];

function initSeabed() {
  rocks.length = 0;
  for (let i = 0; i < 16; i++) {
    rocks.push({
      x: Math.random() * canvas.width * 1.6,
      w: Math.random() * 32 + 12,
      h: Math.random() * 18 + 8,
      dark: Math.random() > 0.5,
    });
  }
}

function updateRocks() {
  for (const r of rocks) {
    r.x -= GS.scrollSpeed;
    if (r.x < -r.w - 10) {
      r.x = canvas.width + r.w + Math.random() * 80;
      r.w = Math.random() * 32 + 12;
      r.h = Math.random() * 18 + 8;
    }
  }
}

// --- Plants ---
const plants = [];

function initPlants() {
  plants.length = 0;
  for (let i = 0; i < 10; i++) {
    plants.push(makePlant(Math.random() * canvas.width));
  }
}

function makePlant(x) {
  return {
    x,
    imgIdx: Math.floor(Math.random() * 5),
    scale: 0.35 + Math.random() * 0.45,
  };
}

function updatePlants() {
  for (const p of plants) {
    p.x -= GS.scrollSpeed * 0.85;
    if (p.x < -80) {
      p.x = canvas.width + 40 + Math.random() * 150;
      p.imgIdx = Math.floor(Math.random() * 5);
      p.scale = 0.35 + Math.random() * 0.45;
    }
  }
}

// --- Draw background ---
function drawBg() {
  if (bgImg.complete && bgImg.naturalWidth > 0) {
    const scale = canvas.height / bgImg.naturalHeight;
    const iw = bgImg.naturalWidth * scale;
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

  // Plants (drawn before seabed so bases are hidden)
  const sbY = canvas.height - 22;
  for (const p of plants) {
    const img = plantImgs[p.imgIdx];
    if (!img.complete || !img.naturalWidth) continue;
    const w = 128 * p.scale;
    const h = 128 * p.scale;
    ctx.drawImage(img, p.x - w / 2, sbY - h + 18, w, h);
  }

  // Seabed strip
  const sbG = ctx.createLinearGradient(0, sbY, 0, canvas.height);
  sbG.addColorStop(0, '#0a1a10');
  sbG.addColorStop(1, '#050c08');
  ctx.fillStyle = sbG;
  ctx.fillRect(0, sbY, canvas.width, canvas.height - sbY);

  // Rocks
  for (const r of rocks) {
    ctx.beginPath();
    ctx.ellipse(r.x, sbY, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = r.dark ? '#101a12' : '#182818';
    ctx.fill();
  }
}

// --- Collision (AABB center-based, 80% of image size) ---
function overlap(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) * 0.4 &&
    Math.abs(a.y - b.y) < (a.h + b.h) * 0.4
  );
}

// --- Item drop ---
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
        pets.push(new Pet(GS.petCount, px, py));
        GS.petCount++;
      } else {
        GS.score += 200;
      }
      break;
    case 'green':
      if (GS.invincible > 0) GS.score += 400;
      GS.invincible = 300;
      GS.giant = true;
      break;
    case 'yellow':
      GS.score += 1000;
      break;
    case 'life':
      GS.lives = Math.min(GS.lives + 1, 5);
      break;
  }
}

// --- Resize ---
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  if (player) player.clamp();
}

let resizeTimer = null;
function onResize() {
  resize();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    initBg();
    initSeabed();
    initPlants();
  }, 150);
}

// --- Init ---
function init() {
  resize();
  player      = new Player(canvas);
  bullets     = [];
  enemies     = [];
  items       = [];
  pets        = [];
  frame       = 0;
  GS.score      = 0;
  GS.lives      = 3;
  GS.phase      = 'playing';
  GS.scrollX    = 0;
  GS.powerLevel = 0;
  GS.shield     = 0;
  GS.petCount   = 0;
  GS.invincible = 0;
  GS.giant      = false;
  stage1.init();
  initBg();
  initSeabed();
  initPlants();
}

// --- Update ---
function update() {
  if (GS.phase !== 'playing') return;

  frame++;
  GS.scrollX += GS.scrollSpeed;
  updateBg();
  updateRocks();
  updatePlants();

  // Invincibility countdown
  if (GS.invincible > 0) {
    GS.invincible--;
    if (GS.invincible === 0) GS.giant = false;
  }

  const ks = 5;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) player.targetY -= ks;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) player.targetY += ks;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.targetX -= ks;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player.targetX += ks;

  // Player fire
  const fired = player.update();
  if (fired) {
    for (const cfg of fired) {
      bullets.push(new Bullet(player.x + player.w / 2, player.y, cfg.vx, cfg.vy, true));
    }
  }

  // Pet update and fire
  for (const p of pets) {
    const petFired = p.update(player);
    if (petFired) {
      for (const cfg of petFired) {
        bullets.push(new Bullet(p.x + p.w / 2, p.y, cfg.vx, cfg.vy, true));
      }
    }
  }

  stage1.update(frame, canvas, enemies);

  for (const b of bullets) b.update(canvas);
  bullets = bullets.filter(b => !b.dead);

  for (const e of enemies) e.update();
  enemies = enemies.filter(e => !e.dead);

  for (const item of items) item.update();
  items = items.filter(item => !item.dead);

  // Bullets vs enemies
  for (const b of bullets) {
    if (!b.fromPlayer) continue;
    for (const e of enemies) {
      if (b.dead || e.dead || e.dying) continue;
      if (overlap(b, e)) {
        b.dead = true;
        if (e.onHit) e.onHit();
        e.hp--;
        if (e.hp <= 0) {
          GS.score += e.scoreValue;
          if (e.onDeath) e.onDeath();
          else e.dead = true;
          if (e.dropLife) {
            items.push(new Item(e.x, e.y, 'life'));
          } else {
            const drop = rollDrop(e.x, e.y);
            if (drop) items.push(drop);
          }
        }
      }
    }
  }

  // Enemies vs player (skipped while invincible)
  if (GS.invincible === 0 && player.hitTimer === 0) {
    for (const e of enemies) {
      if (e.dead || e.dying) continue;
      if (overlap(e, player)) {
        e.dead = true;
        if (player.hit()) {
          if (GS.lives <= 0) GS.phase = 'gameover';
        }
        break;
      }
    }
  }

  // Items vs player
  for (const item of items) {
    if (item.dead) continue;
    if (overlap(item, player)) {
      item.dead = true;
      applyItem(item.type, player.x, player.y);
    }
  }
}

// --- Draw ---
function draw() {
  drawBg();
  items.forEach(item => item.draw(ctx));
  enemies.forEach(e => e.draw(ctx));
  bullets.forEach(b => b.draw(ctx));
  pets.forEach(p => p.draw(ctx));
  player.draw(ctx);
  drawUI(ctx, canvas);
  stage1.draw(ctx, canvas);
  if (GS.phase === 'gameover') drawGameOver(ctx, canvas);
}

// --- Loop ---
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// --- Input ---
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (GS.phase === 'gameover') { init(); return; }
  const t = e.touches[0];
  player.setTarget(t.clientX, t.clientY);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const t = e.touches[0];
  player.setTarget(t.clientX, t.clientY);
}, { passive: false });

canvas.addEventListener('touchend', e => { e.preventDefault(); }, { passive: false });

let mouseDown = false;
canvas.addEventListener('mousedown', e => {
  mouseDown = true;
  if (GS.phase === 'gameover') { init(); return; }
  player.setTarget(e.clientX, e.clientY);
});
canvas.addEventListener('mousemove', e => {
  if (mouseDown && GS.phase === 'playing') player.setTarget(e.clientX, e.clientY);
});
canvas.addEventListener('mouseup', () => { mouseDown = false; });

window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  keys[e.key] = true;
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

window.addEventListener('resize', onResize);

// --- Start ---
init();
loop();
