const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player, bullets, enemies, frame;
const keys = {};

// --- Background ---
const bgLayers = [];
const rocks = [];

function initBg() {
  bgLayers.length = 0;
  const defs = [
    { count: 22, speedMul: 0.25, minR: 1.5, maxR: 4 },
    { count: 14, speedMul: 0.65, minR: 3,   maxR: 7 },
  ];
  for (const d of defs) {
    const items = [];
    for (let i = 0; i < d.count; i++) {
      items.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * (d.maxR - d.minR) + d.minR,
        alpha: Math.random() * 0.25 + 0.05,
        rise: Math.random() * 0.25 + 0.08,
      });
    }
    bgLayers.push({ items, speedMul: d.speedMul });
  }
}

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

function updateBg() {
  for (const layer of bgLayers) {
    for (const b of layer.items) {
      b.x -= GS.scrollSpeed * layer.speedMul;
      b.y -= b.rise;
      if (b.x < -10) b.x = canvas.width + 10;
      if (b.y < -10) b.y = canvas.height + 10;
    }
  }
  for (const r of rocks) {
    r.x -= GS.scrollSpeed;
    if (r.x < -r.w - 10) {
      r.x = canvas.width + r.w + Math.random() * 80;
      r.w = Math.random() * 32 + 12;
      r.h = Math.random() * 18 + 8;
    }
  }
}

function drawBg() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0,   '#060e1c');
  g.addColorStop(0.5, '#0a1e38');
  g.addColorStop(1,   '#030810');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Light shafts
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.fillStyle = '#55bbff';
  for (let i = 0; i < 5; i++) {
    const bx = ((GS.scrollX * 0.12 + i * (canvas.width / 4.5)) % (canvas.width + 100)) - 50;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx - 45, canvas.height);
    ctx.lineTo(bx + 45, canvas.height);
    ctx.fill();
  }
  ctx.restore();

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

  // Seabed strip
  const sbY = canvas.height - 22;
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

// --- Collision (AABB with slight shrink) ---
function overlap(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 6 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2 - 6
  );
}

// --- Init ---
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  if (player) player.clamp();
}

function init() {
  resize();
  player  = new Player(canvas);
  bullets = [];
  enemies = [];
  frame   = 0;
  GS.score   = 0;
  GS.lives   = 3;
  GS.phase   = 'playing';
  GS.scrollX = 0;
  stage1.init();
  initBg();
  initSeabed();
}

// --- Update ---
function update() {
  if (GS.phase !== 'playing') return;

  frame++;
  GS.scrollX += GS.scrollSpeed;
  updateBg();

  // Keyboard nudge
  const ks = 5;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) player.targetY -= ks;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) player.targetY += ks;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.targetX -= ks;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player.targetX += ks;

  const fired = player.update();
  if (fired) {
    bullets.push(new Bullet(player.x + player.w / 2, player.y, 10, 0, true));
  }

  stage1.update(frame, canvas, enemies);

  for (const b of bullets) b.update(canvas);
  bullets = bullets.filter(b => !b.dead);

  for (const e of enemies) e.update();
  enemies = enemies.filter(e => !e.dead);

  // Bullets vs enemies
  for (const b of bullets) {
    if (!b.fromPlayer) continue;
    for (const e of enemies) {
      if (b.dead || e.dead) continue;
      if (overlap(b, e)) {
        b.dead = true;
        e.hp--;
        if (e.hp <= 0) { e.dead = true; GS.score += e.scoreValue; }
      }
    }
  }

  // Enemies vs player (with invincibility frames)
  if (player.hitTimer === 0) {
    for (const e of enemies) {
      if (e.dead) continue;
      if (overlap(e, player)) {
        e.dead = true;
        GS.lives--;
        player.hit();
        if (GS.lives <= 0) GS.phase = 'gameover';
        break;
      }
    }
  }
}

// --- Draw ---
function draw() {
  drawBg();
  enemies.forEach(e => e.draw(ctx));
  bullets.forEach(b => b.draw(ctx));
  player.draw(ctx);
  drawUI(ctx, canvas);
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

window.addEventListener('resize', () => { resize(); initBg(); initSeabed(); });

// --- Start ---
init();
loop();
