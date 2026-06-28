function _loadImg(src) {
  const img = new Image();
  img.src = src;
  img.decode().then(() => {
    const tmp = document.createElement('canvas');
    tmp.width  = img.naturalWidth  || 2;
    tmp.height = img.naturalHeight || 2;
    tmp.getContext('2d').drawImage(img, 0, 0);
  }).catch(() => {});
  return img;
}

const midbossRayImg      = _loadImg('assets/images/midboss_ray.png');
const effectBossHitImg   = _loadImg('assets/images/effect_boss_hit.png');
const midbossTurtleImg   = _loadImg('assets/images/midboss_turtle.png');
const bulletTurtleShellImg = _loadImg('assets/images/bullet_turtle_shell.png');
const bossSharkMinionImg = _loadImg('assets/images/boss_shark_minion.png');
const effectAngryImg     = _loadImg('assets/images/effect_angry.png');

const bossPufferImgs = {
  1:    _loadImg('assets/images/boss_puffer_1.png'),
  2:    _loadImg('assets/images/boss_puffer_2.png'),
  dead: _loadImg('assets/images/boss_puffer_dead.png'),
};

const bossSharkImgs = {
  1:    _loadImg('assets/images/boss_shark_1.png'),
  2:    _loadImg('assets/images/boss_shark_2.png'),
  dead: _loadImg('assets/images/boss_shark_dead.png'),
};

// ctx must already be translated to the boss centre when this is called.
// color: fixed CSS string for mid-bosses, null for dynamic green→yellow→red.
function drawBossHpBar(ctx, bossW, canvasH, hh, hp, maxHp, { wRatio = 0.225, hRatio = 0.0075, color = null } = {}) {
  const barW = Math.round(bossW * wRatio);
  const barH = Math.round(canvasH * hRatio);
  const pct  = hp / maxHp;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-barW / 2 - 1, hh + 8, barW + 2, barH + 2);
  ctx.fillStyle = color ?? (pct > 0.66 ? '#00cc44' : pct > 0.33 ? '#ffaa00' : '#ff3300');
  ctx.fillRect(-barW / 2, hh + 9, barW * pct, barH);
}

// ─── Mid-boss ────────────────────────────────────────────────────────────────
class MidbossRay {
  constructor(canvas) {
    this.canvas          = canvas;
    this.x               = canvas.width + 80;
    this.y               = canvas.height / 2;
    this.maxHp           = 20;
    this.hp              = 20;
    this._dead           = false; // backing field — use setter to guard dash phase
    this.dying           = false;
    this.scoreValue      = 500;
    this.dropLife        = false;
    this.t               = 0;
    this.hitFlash        = 0;
    this.hitEffects      = [];
    this.behaviorPhase   = 'advance'; // 'advance' | 'dash'
    this.fireTimer       = 0;
    this.invincibleTimer = 0; // brief invincibility on dash re-entry
    this.reentryGrace    = 0; // frames before HP can re-trigger dash after re-entry
    this.lastDashY       = canvas.height / 2;
  }

  // Block instant-kill while dashing with HP remaining
  get dead() { return this._dead; }
  set dead(v) {
    if (v && this.hp > 0 && this.behaviorPhase === 'dash') return;
    this._dead = v;
  }

  get w() { return Math.round(this.canvas.height * 0.25); }
  get h() { return Math.round(this.canvas.height * 0.25); }

  onHit() {
    if (this.invincibleTimer > 0) return;
    this.hitFlash = 6;
    this.hitEffects.push({
      x: (Math.random() - 0.5) * this.w * 0.5,
      y: (Math.random() - 0.5) * this.h * 0.5,
      timer: 12,
    });
  }

  _fire8Way() {
    const spd = 5 * this.canvas.height / 600;
    return Array.from({ length: 8 }, (_, i) => {
      const a = (Math.PI * 2 / 8) * i;
      return { x: this.x, y: this.y, vx: spd * Math.cos(a), vy: spd * Math.sin(a) };
    });
  }

  update() {
    const s = this.canvas.height / 600;
    this.t += 0.025;
    if (this.hitFlash        > 0) this.hitFlash--;
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);

    if (this.behaviorPhase === 'advance') {
      // Pattern 1: slow advance + 8-way fire every 3 seconds (180 frames)
      this.x += -0.9 * s;
      this.y += Math.sin(this.t) * 1.2 * s;
      const margin = this.h / 2 + 10;
      this.y = Math.max(margin, Math.min(this.canvas.height - margin, this.y));

      if (this.reentryGrace > 0) {
        this.reentryGrace--;
      } else if (this.hp <= this.maxHp * 0.5) {
        this.behaviorPhase = 'dash';
        this.lastDashY     = this.y;
        return null;
      }

      if (this.x < -(this.w + 40)) { this._dead = true; return null; }

      this.fireTimer++;
      if (this.fireTimer >= 180) {
        this.fireTimer = 0;
        return this._fire8Way();
      }
    } else {
      // Pattern 2: dash left repeatedly; wrap from right with randomised y
      const dashSpd = 14 * s;
      this.x -= dashSpd; // always left

      // Track y while visible so re-entry lands near last known position
      if (this.x > 0 && this.x < this.canvas.width) {
        this.lastDashY = this.y;
      }

      if (this.x < -(this.w / 2)) {
        const uiH    = Math.round(this.canvas.height * 0.085);
        const spread = Math.round(this.canvas.height * 0.15);
        const minY   = uiH + this.h / 2 + 20;
        const maxY   = this.canvas.height - this.h / 2 - 20;
        this.y = Math.max(minY, Math.min(maxY,
          this.lastDashY + (Math.random() - 0.5) * 2 * spread));
        this.x               = this.canvas.width + this.w / 2;
        this.behaviorPhase   = 'advance'; // reset to pattern 1 on re-entry
        this.fireTimer       = 0;
        this.reentryGrace    = 200; // ~3.3 s grace before HP can re-trigger dash
        this.invincibleTimer = 30;  // 0.5 s invincibility
      }
    }

    return null;
  }

  draw(ctx) {
    const hw = this.w / 2, hh = this.h / 2;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.invincibleTimer > 0) ctx.globalAlpha = Math.floor(this.invincibleTimer / 4) % 2 === 0 ? 1.0 : 0.35;
    else if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    ctx.drawImage(midbossRayImg, -hw, -hh, this.w, this.h);
    ctx.globalAlpha = 1;
    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 12;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }
    drawBossHpBar(ctx, this.w, this.canvas.height, hh, this.hp, this.maxHp, { wRatio: 0.175, hRatio: 0.006, color: '#ff9900' });
    ctx.restore();
  }
}

// ─── Final Boss ───────────────────────────────────────────────────────────────
class BossPuffer {
  constructor(canvas) {
    this.canvas    = canvas;
    this.x         = canvas.width + 130;
    this.y         = canvas.height / 2;
    this.maxHp     = 80;
    this.hp        = 80;
    this.phase     = 1;  // sprite phase: 1 or 2
    this.dead      = false;
    this.dying     = false;
    this.scoreValue = 8000;
    this.dropLife  = true;
    this.vx        = -0.6 * canvas.height / 600;
    this.t         = 0;
    this.hitFlash  = 0;
    this.deadTimer = 0;
    this.hitEffects = [];
    this.fireTimer = 0;
    this.arrived   = false;
  }

  get w() { return Math.round(this.canvas.height * 0.50); }
  get h() { return Math.round(this.canvas.height * 0.50); }

  // Attack phase based on HP ratio
  get attackPhase() {
    const r = this.hp / this.maxHp;
    if (r > 0.6) return 1;
    if (r > 0.3) return 2;
    return 3;
  }

  onHit() {
    this.hitFlash = 6;
    // Position effects on the boss perimeter so they show around the sprite, not on top
    const angle = Math.random() * Math.PI * 2;
    const dist  = (this.w / 2) * (0.75 + Math.random() * 0.45);
    this.hitEffects.push({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      timer: 14,
    });
  }

  onDeath() { this.dying = true; this.deadTimer = 0; }

  // Returns item drop descriptors on kill — life (2x) + 2~3 random stars
  getDrops() {
    const sp      = this.w * 0.55;
    const drops   = [{ x: this.x, y: this.y, type: 'life', sizeScale: 2 }];
    const count   = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const types   = ['red', 'blue', 'yellow'];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 / count) * i - Math.PI / 2;
      drops.push({
        x: this.x + Math.cos(a) * sp,
        y: this.y + Math.sin(a) * sp,
        type: types[Math.floor(Math.random() * types.length)],
        sizeScale: 1,
      });
    }
    return drops;
  }

  // Returns array of {x, y, vx, vy} shot descriptors, or null
  getShots() {
    const spd = 7 * this.canvas.height / 600;
    const ap  = this.attackPhase;

    if (ap === 3) {
      // Phase 3: 8-directional radial burst
      return Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI * 2 / 8) * i;
        return { x: this.x, y: this.y, vx: spd * Math.cos(a), vy: spd * Math.sin(a) };
      });
    }

    // Phase 1 & 2: 3-way forward
    const shots = [
      { x: this.x, y: this.y, vx: -spd,       vy: -spd * 0.30 },
      { x: this.x, y: this.y, vx: -spd,        vy: 0           },
      { x: this.x, y: this.y, vx: -spd,        vy:  spd * 0.30 },
    ];

    if (ap === 2) {
      // Phase 2: add up/down straight shots
      shots.push(
        { x: this.x, y: this.y, vx: 0, vy: -spd },
        { x: this.x, y: this.y, vx: 0, vy:  spd },
      );
    }

    return shots;
  }

  update() {
    if (this.dying) {
      this.deadTimer++;
      if (this.deadTimer > 150) this.dead = true;
      return null;
    }

    const s = this.canvas.height / 600;
    this.t += 0.018;

    const restX = this.canvas.width * 0.58;
    const minX  = this.w / 2 + 20;
    if (!this.arrived) {
      this.x += this.vx;
      if (this.x <= restX) {
        this.x     = restX;
        this.arrived = true;
      }
    } else {
      // Hover: gentle sin-wave drift around rest position
      this.x = Math.max(minX, restX + Math.sin(this.t * 1.1) * (this.canvas.width * 0.02));
    }

    this.y += Math.sin(this.t * 0.8) * 0.9 * s;
    const margin = this.h / 2 + 10;
    this.y = Math.max(margin, Math.min(this.canvas.height - margin, this.y));

    // Sync sprite phase to attack phase (2 sprite images)
    this.phase = this.attackPhase === 1 ? 1 : 2;

    if (this.hitFlash > 0) this.hitFlash--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);

    // Fire pattern based on attack phase
    const ap       = this.attackPhase;
    const fireRate = ap === 1 ? 150 : ap === 2 ? 90 : 60;
    this.fireTimer++;
    if (this.fireTimer >= fireRate) {
      this.fireTimer = 0;
      return this.getShots();
    }
    return null;
  }

  get currentImg() {
    if (this.dying) return bossPufferImgs.dead;
    return bossPufferImgs[this.phase];
  }

  draw(ctx) {
    const half = this.w / 2;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Hit effects rendered BEHIND the boss sprite
    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 14;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }

    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    ctx.drawImage(this.currentImg, -half, -half, this.w, this.h);
    ctx.globalAlpha = 1;

    if (!this.dying)
      drawBossHpBar(ctx, this.w, this.canvas.height, half, this.hp, this.maxHp);
    ctx.restore();
  }
}

// ─── Stage 2 Mid-boss ─────────────────────────────────────────────────────────
class MidbossTurtle {
  constructor(canvas) {
    this.canvas          = canvas;
    this.x               = canvas.width + 80;
    this.y               = canvas.height / 2;
    this.maxHp           = 30;
    this.hp              = 30;
    this.dead            = false;
    this.dying           = false;
    this.scoreValue      = 500;
    this.dropLife        = false;
    this.t               = 0;
    this.hitFlash        = 0;
    this.hitEffects      = [];
    // Pattern 1 state
    this.fireTimer       = 0;
    this.burstActive     = false;
    this.burstTimer      = 0;
    this.burstShotsFired = 0;
    // Pattern 2 state (HP ≤ 50%)
    this.shellTimer      = 0;
  }

  get w() { return Math.round(this.canvas.height * 0.184); }
  get h() { return Math.round(this.canvas.height * 0.095); }

  onHit() {
    this.hitFlash = 6;
    const angle = Math.random() * Math.PI * 2;
    const dist  = (this.w / 2) * (0.5 + Math.random() * 0.4);
    this.hitEffects.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, timer: 12 });
  }

  update(player) {
    const s = this.canvas.height / 600;
    this.t += 0.02;
    if (this.hitFlash > 0) this.hitFlash--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);

    // Movement: slow advance with sine oscillation
    this.x -= 0.7 * s;
    this.y += Math.sin(this.t) * 1.0 * s;
    const margin = this.h / 2 + 10;
    this.y = Math.max(margin, Math.min(this.canvas.height - margin, this.y));

    if (this.x < -(this.w + 40)) {
      // Re-enter from the right at a random Y; only die when HP reaches 0
      const uiH = Math.round(this.canvas.height * 0.085);
      const reMargin = this.h / 2 + 10;
      this.x           = this.canvas.width + this.w / 2;
      this.y           = this.canvas.height * 0.25 + Math.random() * this.canvas.height * 0.5;
      this.burstActive     = false;
      this.burstTimer      = 0;
      this.burstShotsFired = 0;
      this.fireTimer       = 0;
      return null;
    }

    const shots = [];
    const px = player ? player.x : 0;
    const py = player ? player.y : this.canvas.height / 2;

    // --- Pattern 1: 3 homing shots sequentially (0.3s / 18f apart), cooldown 2.5s ---
    if (this.burstActive) {
      this.burstTimer++;
      // Fire at frames 1, 19, 37 (≈0, 0.3s, 0.6s into burst)
      const thresholds = [1, 19, 37];
      if (this.burstShotsFired < 3 && this.burstTimer >= thresholds[this.burstShotsFired]) {
        const dx = px - this.x, dy = py - this.y;
        const len = Math.hypot(dx, dy) || 1;
        const spd = 3.5 * s;
        shots.push({ x: this.x, y: this.y, vx: dx / len * spd, vy: dy / len * spd });
        this.burstShotsFired++;
      }
      if (this.burstShotsFired >= 3) {
        this.burstActive     = false;
        this.burstTimer      = 0;
        this.burstShotsFired = 0;
      }
    } else {
      this.fireTimer++;
      if (this.fireTimer >= 150) { // 2.5s at 60fps
        this.fireTimer   = 0;
        this.burstActive = true;
      }
    }

    // --- Pattern 2: 8-directional shell spread, HP ≤ 50%, cooldown 4s ---
    if (this.hp <= this.maxHp * 0.5) {
      this.shellTimer++;
      if (this.shellTimer >= 240) { // 4s at 60fps
        this.shellTimer = 0;
        const spd  = 3 * s;
        const size = Math.round(this.canvas.height * (48 / 600));
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i;
          shots.push({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            img: bulletTurtleShellImg, bw: size, bh: size,
          });
        }
      }
    }

    return shots.length ? shots : null;
  }

  draw(ctx) {
    const hw = this.w / 2, hh = this.h / 2;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    ctx.drawImage(midbossTurtleImg, -hw, -hh, this.w, this.h);
    ctx.globalAlpha = 1;

    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 12;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }

    drawBossHpBar(ctx, this.w, this.canvas.height, hh, this.hp, this.maxHp, { wRatio: 0.175, hRatio: 0.006, color: '#ff9900' });
    ctx.restore();
  }
}

// ─── Stage 2 Boss Minion ──────────────────────────────────────────────────────
// Spawned by BossShark phase 3. Dashes straight toward the player's position
// at spawn time (direction is fixed — not tracking).
class BossSharkMinion {
  constructor(canvas, spawnX, spawnY, targetX, targetY) {
    this.canvas     = canvas;
    this.hp         = 2;
    this.scoreValue = 100;
    this.dead       = false;
    this.dying      = false;
    this.x          = spawnX;
    this.y          = spawnY;
    this.hitFlash   = 0;
    const s  = canvas.height / 600;
    const dx = targetX - spawnX, dy = targetY - spawnY;
    const len = Math.hypot(dx, dy) || 1;
    this.vx  = (dx / len) * 2.5 * s;
    this.vy  = (dy / len) * 2.5 * s;
  }

  get w() { return Math.round(this.canvas.height * 0.16); }  // 96px at 600h
  get h() { return Math.round(this.canvas.height * 0.08); }  // 48px at 600h

  onHit() { this.hitFlash = 4; }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.hitFlash > 0) this.hitFlash--;
    const pad = this.w + 20;
    if (this.x < -pad || this.x > this.canvas.width + pad ||
        this.y < -pad || this.y > this.canvas.height + pad) {
      this.dead = true;
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    if (bossSharkMinionImg.complete && bossSharkMinionImg.naturalWidth > 0)
      ctx.drawImage(bossSharkMinionImg, -this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

// ─── Stage 2 Final Boss ───────────────────────────────────────────────────────
class BossShark {
  constructor(canvas) {
    this.canvas        = canvas;
    this.x             = canvas.width + 200;
    this.y             = canvas.height / 2;
    this.maxHp         = 300;
    this.hp            = 300;
    this.dead          = false;
    this.dying         = false;
    this.scoreValue    = 15000;
    this.t             = 0;
    this.hitFlash      = 0;
    this.deadTimer     = 0;
    this.hitEffects    = [];
    this.fireTimer     = 149; // pre-charged: fires on the first frame after arriving
    this.vx            = -3 * canvas.height / 600;
    this.arrived       = false;
    // Phase 2/3 dash
    this.dashing       = false;
    this.dashCooldown  = 360;
    // Phase 3 minions
    this.minionTimer   = 0;
    this.pendingSpawns = [];
    this.activeMinions = [];
    // effect_angry
    this.angryTimer    = 0;
    this.angryFlip     = false;
  }

  get w() { return Math.round(this.canvas.height * 0.52); }
  get h() { return Math.round(this.canvas.height * 0.26); }

  get attackPhase() {
    const r = this.hp / this.maxHp;
    if (r > 0.66) return 1;
    if (r > 0.33) return 2;
    return 3;
  }

  get currentImg() {
    if (this.dying) return bossSharkImgs.dead;
    return this.attackPhase === 1 ? bossSharkImgs[1] : bossSharkImgs[2];
  }

  onHit() {
    this.hitFlash = 6;
    const angle = Math.random() * Math.PI * 2;
    const dist  = (this.w / 2) * (0.75 + Math.random() * 0.45);
    this.hitEffects.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, timer: 14 });
  }

  onDeath() { this.dying = true; this.deadTimer = 0; }

  getDrops() {
    const sp    = this.w * 0.55;
    const drops = [{ x: this.x, y: this.y, type: 'life', sizeScale: 2 }];
    const count = 2 + Math.floor(Math.random() * 2);
    const types = ['red', 'blue', 'yellow'];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 / count) * i - Math.PI / 2;
      drops.push({
        x: this.x + Math.cos(a) * sp,
        y: this.y + Math.sin(a) * sp,
        type: types[Math.floor(Math.random() * types.length)],
        sizeScale: 1,
      });
    }
    return drops;
  }

  _fire3Way() {
    const spd = 6 * this.canvas.height / 600;
    return [
      { x: this.x, y: this.y, vx: -spd, vy: -spd * 0.30 },
      { x: this.x, y: this.y, vx: -spd, vy: 0            },
      { x: this.x, y: this.y, vx: -spd, vy:  spd * 0.30  },
    ];
  }

  update(player) {
    if (this.dying) {
      this.deadTimer++;
      if (this.deadTimer > 150) this.dead = true;
      return null;
    }

    const s  = this.canvas.height / 600;
    const ap = this.attackPhase;
    this.t += 0.018;
    if (this.hitFlash > 0) this.hitFlash--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);

    const restX  = this.canvas.width * 0.72;
    const minX   = this.w / 2 + 20;
    const margin = this.h / 2 + 10;
    const uiH    = Math.round(this.canvas.height * 0.085);

    if (!this.arrived) {
      // Advance to rest position
      this.x += this.vx;
      if (this.x <= restX) {
        this.x       = restX;
        this.arrived = true;
      }
    } else if (this.dashing) {
      // Dash left across screen
      this.x -= 14 * s;
      if (this.x < -(this.w / 2)) {
        // Re-enter from right at new y
        this.y = this.canvas.height * 0.25 + Math.random() * this.canvas.height * 0.5;
        this.x       = this.canvas.width + this.w / 2;
        this.dashing = false;
        this.arrived = false; // re-advance to rest
        this.dashCooldown = ap === 2 ? 360 : 300;
      }
    } else {
      // Hover at rest: gentle sin-wave + up/down drift
      this.x  = Math.max(minX, restX + Math.sin(this.t * 1.1) * (this.canvas.width * 0.02));
      this.y += Math.sin(this.t * 0.8) * 1.2 * s;
      this.y  = Math.max(uiH + margin, Math.min(this.canvas.height - margin, this.y));

      // Phase 2+ periodic dash
      if (ap >= 2) {
        this.dashCooldown--;
        if (this.dashCooldown <= 0) this.dashing = true;
      }

      // Fire when hovering
      const fireRate = ap === 1 ? 150 : 120;
      this.fireTimer++;
      if (this.fireTimer >= fireRate) {
        this.fireTimer = 0;
        return this._fire3Way();
      }
    }

    // Phase 3: minion spawn timer — always counts regardless of dash/advance state
    if (ap === 3) {
      this.minionTimer++;
      if (this.minionTimer >= 120) {
        this.minionTimer = 0;
        this.activeMinions = this.activeMinions.filter(m => !m.dead);
        if (this.activeMinions.length < 2) {
          const px  = player ? player.x : 0;
          const py  = player ? player.y : this.canvas.height / 2;
          const cx  = this.arrived ? this.x : this.canvas.width * 0.72;
          const cy  = this.y;
          const sx  = cx - this.w / 2 - 10;
          const off = this.h * 0.5;
          const m1  = new BossSharkMinion(this.canvas, sx, cy - off, px, py);
          const m2  = new BossSharkMinion(this.canvas, sx, cy + off, px, py);
          this.activeMinions.push(m1, m2);
          this.pendingSpawns.push(m1, m2);
        }
      }
      // angry anim toggle
      this.angryTimer++;
      if (this.angryTimer >= 20) { this.angryTimer = 0; this.angryFlip = !this.angryFlip; }
    }

    return null;
  }

  draw(ctx) {
    const hh = this.h / 2;
    // Natural-aspect draw widths per phase
    const drawW = this.dying
      ? Math.round(this.h * (280 / 168))
      : this.attackPhase === 1
        ? Math.round(this.h * (256 / 118))
        : Math.round(this.h * (262 / 144));

    ctx.save();
    ctx.translate(this.x, this.y);

    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 14;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }

    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    ctx.drawImage(this.currentImg, -drawW / 2, -hh, drawW, this.h);
    ctx.globalAlpha = 1;

    // Phase 3 effect_angry overlay (cosmetic, toggles L/R)
    if (this.attackPhase === 3 && !this.dying && effectAngryImg.complete && effectAngryImg.naturalWidth > 0) {
      const sz = Math.round(this.canvas.height * 0.09);
      const ex = this.angryFlip ? drawW / 2 - sz : -drawW / 2;
      ctx.drawImage(effectAngryImg, ex, -hh - sz * 0.5, sz, sz);
    }

    if (!this.dying)
      drawBossHpBar(ctx, this.w, this.canvas.height, hh, this.hp, this.maxHp);
    ctx.restore();
  }
}
