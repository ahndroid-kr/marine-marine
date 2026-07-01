// ─── Death particle pool ──────────────────────────────────────────────────────
const _particles   = [];
const _COLORS      = ['#7ddeff', '#b8eeff', '#ffffff', '#50c8ff', '#daf5ff', '#a0f0ff'];
const _CLAM_COLORS = ['#ffffff', '#7ddeff', '#b8eeff', '#ffd700', '#ffe066', '#50c8ff', '#daf5ff'];

function spawnDeathParticles(x, y, count) {
  const n = count !== undefined ? count : (8 + Math.floor(Math.random() * 5));
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 1.2 + Math.random() * 3.8;
    const r     = 2 + Math.random() * 3;          // radius 2-5 → diameter 4-10px
    const life  = 18 + Math.floor(Math.random() * 14); // ~0.3-0.53s
    _particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      r, life,
      maxLife: life,
      color: _COLORS[Math.floor(Math.random() * _COLORS.length)],
    });
  }
}

function updateParticles() {
  let w = 0;
  for (let i = 0; i < _particles.length; i++) {
    const p = _particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.91;
    p.vy *= 0.91;
    p.life--;
    if (p.life > 0) _particles[w++] = p;
  }
  _particles.length = w;
}

function drawParticles(ctx) {
  if (_particles.length === 0) return;
  ctx.save();
  for (const p of _particles) {
    const t = p.life / p.maxLife;
    ctx.globalAlpha = t;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (0.3 + 0.7 * t), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ─── Screen shake ─────────────────────────────────────────────────────────────
let _shakeFrames    = 0;
let _shakeIntensity = 0;
let _shakeX         = 0;
let _shakeY         = 0;

function triggerShake(intensity, frames) {
  if (intensity > _shakeIntensity || _shakeFrames === 0) {
    _shakeIntensity = intensity;
    _shakeFrames    = frames;
  }
}

function updateShake() {
  if (_shakeFrames > 0) {
    const decay = _shakeFrames / (_shakeFrames + 4);
    _shakeX = (Math.random() * 2 - 1) * _shakeIntensity * decay;
    _shakeY = (Math.random() * 2 - 1) * _shakeIntensity * decay;
    _shakeFrames--;
    if (_shakeFrames === 0) { _shakeX = 0; _shakeY = 0; _shakeIntensity = 0; }
  }
}

function getShakeOffset() { return { x: _shakeX, y: _shakeY }; }

// ─── MidbossClam 전용 폭발 파티클 ────────────────────────────────────────────
function spawnClamDeathExplosion(x, y) {
  const count = 15 + Math.floor(Math.random() * 6);  // 15~20개
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 2.5 + Math.random() * 5.0;
    const r     = 4 + Math.random() * 6;               // 반지름 4~10 (기본보다 큼)
    const life  = 36 + Math.floor(Math.random() * 14); // 36~50프레임 = 600~833ms
    _particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      r, life,
      maxLife: life,
      color: _CLAM_COLORS[Math.floor(Math.random() * _CLAM_COLORS.length)],
    });
  }
}

// ─── Helper: trigger appropriate FX based on enemy type ───────────────────────
function enemyDeathFX(e) {
  const isFinalBoss = e instanceof BossPuffer || e instanceof BossShark || e instanceof BossMonkey;
  const isMidBoss   = e instanceof MidbossRay  || e instanceof MidbossTurtle || e instanceof MidbossClam;
  if (isFinalBoss) {
    spawnDeathParticles(e.x, e.y, 22);
    triggerShake(10, 30);
  } else if (isMidBoss) {
    spawnDeathParticles(e.x, e.y, 15);
    triggerShake(5, 18);
  } else {
    spawnDeathParticles(e.x, e.y);
    triggerShake(2.5, 12);
  }
}
