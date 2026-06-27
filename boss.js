const midbossRayImg = new Image();
midbossRayImg.src = 'assets/images/midboss_ray.png';

const bossPufferImgs = { 1: new Image(), 2: new Image(), dead: new Image() };
bossPufferImgs[1].src = 'assets/images/boss_puffer_1.png';
bossPufferImgs[2].src = 'assets/images/boss_puffer_2.png';
bossPufferImgs.dead.src = 'assets/images/boss_puffer_dead.png';

const effectBossHitImg = new Image();
effectBossHitImg.src = 'assets/images/effect_boss_hit.png';

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
    const barW = Math.round(this.w * 0.7), barH = Math.round(this.canvas.height * 0.012);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-barW / 2 - 1, hh + 8, barW + 2, barH + 2);
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(-barW / 2, hh + 9, barW * (this.hp / this.maxHp), barH);
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
  }

  get w() { return Math.round(this.canvas.height * 0.25); }
  get h() { return Math.round(this.canvas.height * 0.25); }

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
    if (this.x > restX) {
      // Advance phase: move left toward rest position
      this.x = Math.max(restX, this.x + this.vx);
    } else {
      // Hover phase: gentle left-right oscillation around rest position
      this.x = Math.max(minX, restX + Math.cos(this.t * 1.2) * (this.canvas.width * 0.03));
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

    if (!this.dying) {
      const barW = Math.round(this.w * 0.9);
      const barH = Math.round(this.canvas.height * 0.015);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barW / 2 - 1, half + 8, barW + 2, barH + 2);
      const pct = this.hp / this.maxHp;
      ctx.fillStyle = pct > 0.6 ? '#00cc44' : pct > 0.3 ? '#ffaa00' : '#ff3300';
      ctx.fillRect(-barW / 2, half + 9, barW * pct, barH);
    }
    ctx.restore();
  }
}
