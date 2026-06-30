// ─── Stage 4 assets (GPU pre-warm) ───────────────────────────────────────────
function _s4LoadImg(src) {
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

const _s4BgImg = _s4LoadImg('assets/images/bg_stage4.png');

const enemyStage4Imgs = {};
['hermitcrab', 'starfish', 'jellyfish'].forEach(t => {
  enemyStage4Imgs[t] = _s4LoadImg(`assets/images/enemy_${t}.png`);
});

const bulletCrabImg    = _s4LoadImg('assets/images/bullet_crab.png');
const bulletPearlImg   = _s4LoadImg('assets/images/bullet_pearl.png');
const midbossClamImg   = _s4LoadImg('assets/images/midboss_clam.png');
const bulletBananaImg  = _s4LoadImg('assets/images/bullet_banana.png');
const bulletCoconut1   = _s4LoadImg('assets/images/bullet_coconut_1.png');
const bulletCoconut2   = _s4LoadImg('assets/images/bullet_coconut_2.png');
const bossMonkeyImgs   = {
  1:    _s4LoadImg('assets/images/boss_monkey_1.png'),
  2:    _s4LoadImg('assets/images/boss_monkey_2.png'),
  3:    _s4LoadImg('assets/images/boss_monkey_3.png'),
  dead: _s4LoadImg('assets/images/boss_monkey_dead.png'),
};

// ─── EnemyHermitCrab: 하단 고정, 플레이어 조준 발사 ──────────────────────────
class EnemyHermitCrab {
  constructor(canvas) {
    this.canvas         = canvas;
    this.hp             = 3;
    this.scoreValue     = 80;
    this.dead           = false;
    this.dying          = false;
    this._giantDmgTimer = 0;
    const s    = canvas.height / 600;
    this.x     = canvas.width + this.w;
    this.y     = canvas.height - Math.round(canvas.height * 0.07) - this.h / 2;
    this.vx    = -(0.6 + Math.random() * 0.4) * s;
    this.hitFlash  = 0;
    this.fireTimer = Math.floor(Math.random() * 120);
  }

  get w() { return Math.round(this.canvas.height * 0.133); }
  get h() { return Math.round(this.canvas.height * 0.096); }

  onHit() { this.hitFlash = 4; }

  update() {
    const s = this.canvas.height / 600;
    this.x += this.vx;
    if (this.x < -(this.w + 20)) { this.dead = true; return null; }
    if (this.hitFlash > 0) this.hitFlash--;

    this.fireTimer++;
    if (this.fireTimer >= 150 && !this.dead) {
      this.fireTimer = 0;
      const spd  = 4.5 * s;
      const dx   = player.x - this.x;
      const dy   = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const bW   = Math.round(this.canvas.height * 0.078);  // 42/540
      const bH   = Math.round(this.canvas.height * 0.067);  // 36/540
      return [{ x: this.x, y: this.y, vx: spd * dx / dist, vy: spd * dy / dist, img: bulletCrabImg, bw: bW, bh: bH }];
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = enemyStage4Imgs.hermitcrab;
    if (img && img.complete && img.naturalWidth > 0)
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

// ─── EnemyStarfish: 상단 1/3, 점멸 텔레포트 이동 ────────────────────────────
class EnemyStarfish {
  constructor(canvas) {
    this.canvas         = canvas;
    this.hp             = 2;
    this.scoreValue     = 70;
    this.dead           = false;
    this.dying          = false;
    this._giantDmgTimer = 0;
    const s    = canvas.height / 600;
    const uiH  = Math.round(canvas.height * 0.085);
    const maxY = Math.round(canvas.height * 0.33) - this.h / 2;  // 상단 1/3
    this.x     = canvas.width + this.w + Math.random() * 40;
    this.y     = uiH + this.h / 2 + Math.random() * Math.max(0, maxY - uiH - this.h / 2);
    this._spd          = (5.5 + Math.random() * 1.0) * s;
    this.hitFlash      = 0;
    this._alpha        = 1;
    this._phase        = 'visible';  // 'visible' | 'fadeout' | 'fadein'
    this._phaseTimer   = 0;
    this._visibleDur   = 20 + Math.floor(Math.random() * 16);  // 20~35f
    this._fadeDur      = 6;
    this._teleportDist = 0;
  }

  get w() { return Math.round(this.canvas.height * 0.133); }
  get h() { return Math.round(this.canvas.height * 0.133); }

  onHit() { this.hitFlash = 4; }

  update() {
    this._phaseTimer++;
    if (this.hitFlash > 0) this.hitFlash--;

    if (this._phase === 'visible') {
      this._alpha = 1;
      if (this._phaseTimer >= this._visibleDur) {
        // 사이클 전체 시간(정지+페이드)만큼 이동한 것처럼 텔레포트 거리 계산
        this._teleportDist = this._spd * (this._visibleDur + this._fadeDur * 2);
        this._phase      = 'fadeout';
        this._phaseTimer = 0;
      }
    } else if (this._phase === 'fadeout') {
      this._alpha = 1 - this._phaseTimer / this._fadeDur;
      if (this._phaseTimer >= this._fadeDur) {
        this.x          -= this._teleportDist;  // 즉시 왼쪽으로 텔레포트
        this._phase      = 'fadein';
        this._phaseTimer = 0;
      }
    } else {
      // fadein
      this._alpha = this._phaseTimer / this._fadeDur;
      if (this._phaseTimer >= this._fadeDur) {
        this._alpha      = 1;
        this._phase      = 'visible';
        this._phaseTimer = 0;
        this._visibleDur = 20 + Math.floor(Math.random() * 16);
      }
    }

    if (this.x < -(this.w + 20)) { this.dead = true; return null; }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    let alpha = Math.max(0, Math.min(1, this._alpha));
    if (this.hitFlash > 0) alpha *= (this.hitFlash % 2 === 0 ? 0.3 : 1.0);
    ctx.globalAlpha = alpha;
    const img = enemyStage4Imgs.starfish;
    if (img && img.complete && img.naturalWidth > 0)
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

// ─── EnemyJellyfish: 중앙 사인파 이동, 랜덤 버블 탄 발사 ─────────────────────
class EnemyJellyfish {
  constructor(canvas) {
    this.canvas         = canvas;
    this.hp             = 3;
    this.scoreValue     = 100;
    this.dead           = false;
    this.dying          = false;
    this._giantDmgTimer = 0;
    const s    = canvas.height / 600;
    const uiH  = Math.round(canvas.height * 0.085);
    const minY = uiH + this.h / 2 + Math.round(canvas.height * 0.10);
    const maxY = Math.round(canvas.height * 0.75) - this.h / 2;
    this.x      = canvas.width + this.w;
    this._baseY = minY + Math.random() * Math.max(0, maxY - minY);
    this.y      = this._baseY;
    this.vx     = -(1.5 + Math.random() * 0.5) * s;
    this.t      = Math.random() * Math.PI * 2;
    this.hitFlash  = 0;
    this.fireTimer = Math.floor(Math.random() * 90);
    this._nextFire = 90 + Math.floor(Math.random() * 90);
  }

  get w() { return Math.round(this.canvas.height * 0.185); }
  get h() { return Math.round(this.canvas.height * 0.185); }

  onHit() { this.hitFlash = 4; }

  update() {
    const s   = this.canvas.height / 600;
    const uiH = Math.round(this.canvas.height * 0.085);
    this.t   += 0.04;
    this.x   += this.vx;
    this.y    = this._baseY + Math.sin(this.t) * 45 * s;
    const margin = this.h / 2 + 5;
    this.y = Math.max(uiH + margin, Math.min(this.canvas.height - margin, this.y));

    if (this.x < -(this.w + 20)) { this.dead = true; return null; }
    if (this.hitFlash > 0) this.hitFlash--;

    this.fireTimer++;
    if (this.fireTimer >= this._nextFire && !this.dead) {
      this.fireTimer = 0;
      this._nextFire = 90 + Math.floor(Math.random() * 90);
      const spd  = 3.5 * s;
      const dx   = player.x - this.x;
      const dy   = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      return [{ x: this.x, y: this.y, vx: spd * dx / dist, vy: spd * dy / dist, glowStyle: 'jellyfish' }];
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = enemyStage4Imgs.jellyfish;
    if (img && img.complete && img.naturalWidth > 0)
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

// ─── MidbossClam: 화면 우측 고정, 진주알 탄 발사 ────────────────────────────
class MidbossClam {
  constructor(canvas) {
    this.canvas          = canvas;
    this.maxHp           = 35;
    this.hp              = 35;
    this.dead            = false;
    this.dying           = false;
    this.scoreValue      = 600;
    this.hitFlash        = 0;
    this.hitEffects      = [];
    this.fireTimer       = 0;
    this.deadTimer       = 0;
    this.invincibleTimer = 0;
    this._giantDmgTimer  = 0;
    this._pendingDrops   = [];   // 사망 연출 후 지연 드롭
    this.x = canvas.width + this.w;
    this.y = canvas.height / 2;
    this._restX  = Math.round(canvas.width * 0.78);
    this._arrived = false;
    const s = canvas.height / 600;
    this._vx = -(2.5 * s);
  }

  get w() { return Math.round(this.canvas.height * 0.474); }
  get h() { return Math.round(this.canvas.height * 0.380); }

  onHit() {
    if (this.invincibleTimer > 0) return;
    this.hitFlash = 6;
    const angle = Math.random() * Math.PI * 2;
    const dist  = (this.w / 2) * (0.4 + Math.random() * 0.4);
    this.hitEffects.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, timer: 12 });
  }

  // 드롭은 즉시 생성하지 않고 _pendingDrops에 저장 → 연출 후 main.js에서 방출
  getDrops() {
    const starTypes = ['red', 'blue', 'yellow'];
    const count = 1 + Math.floor(Math.random() * 2);
    this._pendingDrops = [
      { x: this.x, y: this.y, type: 'life', sizeScale: 1.5 },
    ];
    for (let i = 0; i < count; i++) {
      this._pendingDrops.push({
        x: this.x + (Math.random() - 0.5) * 80,
        y: this.y + (Math.random() - 0.5) * 50,
        type: starTypes[Math.floor(Math.random() * starTypes.length)],
        sizeScale: 1,
      });
    }
    return [];  // 즉시 드롭 없음
  }

  onDeath() {
    this.dying     = true;
    this.deadTimer = 0;
    triggerShake(6, 10);  // 강도 6, 10f (~167ms)
  }

  update() {
    // 사망 연출: 18f 페이드아웃 후 dead = true → main.js 필터에서 지연 드롭 방출
    if (this.dying) {
      this.deadTimer++;
      if (this.deadTimer >= 18) this.dead = true;
      return null;
    }

    const s = this.canvas.height / 600;
    if (this.hitFlash        > 0) this.hitFlash--;
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);

    // 진입 이동 → 도달 후 완전 고정
    if (!this._arrived) {
      this.x += this._vx;
      if (this.x <= this._restX) { this.x = this._restX; this._arrived = true; }
      return null;
    }

    // 발사 패턴: phase1 120f(2s) / phase2(HP 50% 이하) 55f 연사 (~0.9s)
    const phase2    = this.hp <= this.maxHp * 0.5;
    const fireRate  = phase2 ? 55 : 120;
    const shotSpd   = (phase2 ? 5.5 : 4.5) * s;
    this.fireTimer++;
    if (this.fireTimer >= fireRate && !this.dead) {
      this.fireTimer = 0;
      const dx   = player.x - this.x;
      const dy   = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const bSz  = Math.round(this.canvas.height * 0.067);
      return [{ x: this.x - this.w / 2, y: this.y,
                vx: shotSpd * dx / dist, vy: shotSpd * dy / dist,
                img: bulletPearlImg, bw: bSz, bh: bSz }];
    }
    return null;
  }

  draw(ctx) {
    const hw = this.w / 2, hh = this.h / 2;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.dying) {
      const t     = Math.min(1, this.deadTimer / 18);
      const scale = 1 + t * 0.15;          // 1.0 → 1.15
      const alpha = Math.max(0, 1 - t);    // 1.0 → 0.0
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      if (midbossClamImg.complete && midbossClamImg.naturalWidth > 0)
        ctx.drawImage(midbossClamImg, -hw, -hh, this.w, this.h);
      // 초기 1~2f 흰색 플래시 오버레이
      if (this.deadTimer <= 2) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle   = '#ffffff';
        ctx.fillRect(-hw, -hh, this.w, this.h);
      }
      ctx.restore();
      return;
    }

    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    if (midbossClamImg.complete && midbossClamImg.naturalWidth > 0)
      ctx.drawImage(midbossClamImg, -hw, -hh, this.w, this.h);
    ctx.globalAlpha = 1;
    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 12;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }
    drawBossHpBar(ctx, this.w, this.canvas.height, hh, this.hp, this.maxHp,
      { wRatio: 0.175, hRatio: 0.006, color: '#00e5ff' });
    ctx.restore();
  }
}

// ─── BossMonkey: 3페이즈, 바나나/코코넛 투척 ─────────────────────────────────
class BossMonkey {
  constructor(canvas) {
    this.canvas          = canvas;
    this.maxHp           = 300;
    this.hp              = 300;
    this.dead            = false;
    this.dying           = false;
    this.scoreValue      = 1500;
    this.t               = 0;
    this.hitFlash        = 0;
    this.deadTimer       = 0;
    this.hitEffects      = [];
    this.fireTimer       = 0;
    this._coconutToggle  = false;  // coconut_1/2 교번용
    this.invincibleTimer = 0;
    this._giantDmgTimer  = 0;
    const s    = canvas.height / 600;
    this.vx    = -2.5 * s;
    this.arrived = false;
    this.x     = canvas.width + this.w;
    this.y     = canvas.height / 2;
  }

  // 원본 256×205 → 1.5× 렌더: 384×308
  get w() { return Math.round(this.canvas.height * 0.711); }
  get h() { return Math.round(this.canvas.height * 0.570); }

  get attackPhase() {
    const r = this.hp / this.maxHp;
    if (r > 0.66) return 1;
    if (r > 0.33) return 2;
    return 3;
  }

  get currentImg() {
    if (this.dying) return bossMonkeyImgs.dead;
    return bossMonkeyImgs[this.attackPhase];
  }

  onHit() {
    if (this.invincibleTimer > 0) return;
    this.hitFlash = 6;
    const angle = Math.random() * Math.PI * 2;
    const dist  = (this.w / 2) * (0.5 + Math.random() * 0.4);
    this.hitEffects.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, timer: 14 });
  }

  onDeath() { this.dying = true; this.deadTimer = 0; }

  getDrops() {
    const sp    = this.w * 0.30;
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

  _bananaSingle(s) {
    const bSz = Math.round(this.canvas.height * 0.115);  // 62/540
    const spd = 5 * s;
    const dx = player.x - this.x, dy = player.y - this.y;
    const d  = Math.sqrt(dx * dx + dy * dy) || 1;
    return [{ x: this.x - this.w * 0.4, y: this.y,
              vx: spd * dx / d, vy: spd * dy / d,
              img: bulletBananaImg, bw: bSz, bh: bSz, spin: 0.08 }];
  }

  _coconutShot(s) {
    const bSz = Math.round(this.canvas.height * 0.078);
    const spd = 5.5 * s;
    const img = this._coconutToggle ? bulletCoconut2 : bulletCoconut1;
    this._coconutToggle = !this._coconutToggle;
    const dx = player.x - this.x, dy = player.y - this.y;
    const d  = Math.sqrt(dx * dx + dy * dy) || 1;
    return [{ x: this.x - this.w * 0.4, y: this.y,
              vx: spd * dx / d, vy: spd * dy / d,
              img, bw: bSz, bh: bSz }];
  }

  _phase3Barrage(s) {
    const shots  = [];
    const spd    = 6 * s;
    const spread = Math.PI / 10;  // 18° 간격
    const dx = player.x - this.x, dy = player.y - this.y;
    const base = Math.atan2(dy, dx);
    const bBanana = Math.round(this.canvas.height * 0.115);  // 62/540
    const bSz     = Math.round(this.canvas.height * 0.078);
    for (let i = -1; i <= 1; i++) {
      const a        = base + i * spread;
      const isBanana = Math.random() < 0.5;
      shots.push({
        x: this.x - this.w * 0.4, y: this.y,
        vx: spd * Math.cos(a), vy: spd * Math.sin(a),
        img:  isBanana ? bulletBananaImg : (Math.random() < 0.5 ? bulletCoconut1 : bulletCoconut2),
        bw:   isBanana ? bBanana : bSz,
        bh:   isBanana ? bBanana : bSz,
        spin: isBanana ? 0.08 : 0,
      });
    }
    return shots;
  }

  update(player) {
    if (this.dying) {
      this.deadTimer++;
      if (this.deadTimer > 150) this.dead = true;
      return null;
    }

    const s   = this.canvas.height / 600;
    const ap  = this.attackPhase;
    const uiH = Math.round(this.canvas.height * 0.085);
    this.t += 0.015;
    if (this.hitFlash        > 0) this.hitFlash--;
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);

    const restX  = this.canvas.width * 0.70;
    const margin = this.h / 2 + 10;
    if (!this.arrived) {
      this.x += this.vx;
      if (this.x <= restX) { this.x = restX; this.arrived = true; }
    } else {
      this.x = Math.max(this.w / 2 + 20, restX + Math.sin(this.t * 0.9) * (this.canvas.width * 0.015));
    }
    this.y += Math.sin(this.t * 0.8) * 0.5 * s;
    this.y  = Math.max(uiH + margin, Math.min(this.canvas.height - margin, this.y));

    // 페이즈별 발사 패턴
    const fireRate = ap === 1 ? 120 : ap === 2 ? 90 : 90;
    this.fireTimer++;
    if (this.fireTimer >= fireRate) {
      this.fireTimer = 0;
      if (ap === 1) return this._bananaSingle(s);
      if (ap === 2) return this._coconutShot(s);
      return this._phase3Barrage(s);
    }
    return null;
  }

  draw(ctx) {
    const hw = this.w / 2, hh = this.h / 2;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = this.currentImg;
    if (img && img.complete && img.naturalWidth > 0)
      ctx.drawImage(img, -hw, -hh, this.w, this.h);
    ctx.globalAlpha = 1;
    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 14;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }
    if (!this.dying)
      drawBossHpBar(ctx, this.w, this.canvas.height, hh, this.hp, this.maxHp,
        { color: '#FFD700' });
    ctx.restore();
  }
}

// ─── Stage 4 ──────────────────────────────────────────────────────────────────
const stage4 = {
  _inited:     false,
  wave:        'wave1',
  waveTimer:   0,
  spawnTimer:  0,
  midbossRef:  null,
  bossRef:     null,
  warning:     null,

  init() {
    this._inited    = false;
    this.wave       = 'wave1';
    this.waveTimer  = 0;
    this.spawnTimer = 0;
    this.midbossRef = null;
    this.bossRef    = null;
    this.warning    = null;
  },

  _next(name) {
    this.wave       = name;
    this.waveTimer  = 0;
    this.spawnTimer = 0;
  },

  // wave1: 소라게 + 불가사리 (900f / 15s)
  _wave1(canvas, enemies) {
    if (this.spawnTimer >= 180) {
      this.spawnTimer = 0;
      if (Math.random() < 0.5) enemies.push(new EnemyHermitCrab(canvas));
      else                     enemies.push(new EnemyStarfish(canvas));
    }
    if (this.waveTimer >= 900) this._next('wave2');
  },

  // wave2: 해파리 + 소라게 (1080f / 18s)
  _wave2(canvas, enemies) {
    if (this.spawnTimer >= 200) {
      this.spawnTimer = 0;
      if (Math.random() < 0.55) enemies.push(new EnemyJellyfish(canvas));
      else                      enemies.push(new EnemyHermitCrab(canvas));
    }
    if (this.waveTimer >= 1080) this._next('wave3');
  },

  // wave3: 불가사리 돌진 (720f / 12s)
  _wave3(canvas, enemies) {
    if (this.spawnTimer >= 120) {
      this.spawnTimer = 0;
      enemies.push(new EnemyStarfish(canvas));
    }
    if (this.waveTimer >= 720) this._next('wave4');
  },

  // wave4: 전체 혼합 (1260f / 21s)
  _wave4(canvas, enemies) {
    if (this.spawnTimer >= 160) {
      this.spawnTimer = 0;
      const r = Math.random();
      if      (r < 0.35) enemies.push(new EnemyHermitCrab(canvas));
      else if (r < 0.65) enemies.push(new EnemyStarfish(canvas));
      else               enemies.push(new EnemyJellyfish(canvas));
    }
    if (this.waveTimer >= 1260) this._next('wave5');
  },

  // wave5: 전체 혼합 고밀도 (1080f / 18s)
  _wave5(canvas, enemies) {
    if (this.spawnTimer >= 130) {
      this.spawnTimer = 0;
      const r = Math.random();
      if      (r < 0.35) enemies.push(new EnemyHermitCrab(canvas));
      else if (r < 0.65) enemies.push(new EnemyStarfish(canvas));
      else               enemies.push(new EnemyJellyfish(canvas));
    }
    if (this.waveTimer >= 1080) this._next('midboss_warn');
  },

  // 중간보스 WARNING (150f)
  _waveMidbossWarn(canvas, enemies) {
    if (!this.warning) this.warning = { timer: 0, type: 'midboss' };
    this.warning.timer++;
    if (this.warning.timer >= 150) {
      const clam      = new MidbossClam(canvas);
      enemies.push(clam);
      this.midbossRef = clam;
      this.warning    = null;
      this._next('midboss');
    }
  },

  // 중간보스: 대왕조개 (사망까지)
  _waveMidboss() {},

  // wave6: 중간보스 처치 후 짧은 정리 구간 (600f / 10s)
  _wave6(canvas, enemies) {
    if (this.spawnTimer >= 150) {
      this.spawnTimer = 0;
      const r = Math.random();
      if      (r < 0.4) enemies.push(new EnemyHermitCrab(canvas));
      else if (r < 0.7) enemies.push(new EnemyStarfish(canvas));
      else               enemies.push(new EnemyJellyfish(canvas));
    }
    if (this.waveTimer >= 600) this._next('boss_warn');
  },

  // 보스 WARNING (150f)
  _waveBossWarn(canvas, enemies) {
    if (!this.warning) this.warning = { timer: 0, type: 'boss' };
    this.warning.timer++;
    if (this.warning.timer >= 150) {
      const monkey  = new BossMonkey(canvas);
      enemies.push(monkey);
      this.bossRef = monkey;
      this.warning = null;
      this._next('boss');
    }
  },

  // 보스: 원숭이 (사망까지)
  _waveBoss() {},

  updateBackground() {},  // 파티클 없음, main.js 호환용

  drawBackground(ctx, canvas) {
    if (_s4BgImg.complete && _s4BgImg.naturalWidth > 0) {
      const iw     = Math.round(_s4BgImg.naturalWidth * (canvas.height / _s4BgImg.naturalHeight));
      const offset = -(GS.scrollX * 0.3) % iw;
      for (let x = offset; x < canvas.width + iw; x += iw)
        ctx.drawImage(_s4BgImg, x, 0, iw, canvas.height);
    } else {
      ctx.fillStyle = '#0a2010';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  },

  update(frame, canvas, enemies) {
    if (this.midbossRef && this.midbossRef.dead) {
      this.midbossRef = null;
      if (this.wave === 'midboss') this._next('wave6');
    }
    if (this.bossRef && this.bossRef.dead) {
      this.bossRef = null;
      if (this.wave === 'boss') GS.phase = 'stageclear';
    }

    switch (this.wave) {
      case 'wave1':        this._wave1(canvas, enemies);           break;
      case 'wave2':        this._wave2(canvas, enemies);           break;
      case 'wave3':        this._wave3(canvas, enemies);           break;
      case 'wave4':        this._wave4(canvas, enemies);           break;
      case 'wave5':        this._wave5(canvas, enemies);           break;
      case 'midboss_warn': this._waveMidbossWarn(canvas, enemies); break;
      case 'midboss':      this._waveMidboss();                    break;
      case 'wave6':        this._wave6(canvas, enemies);           break;
      case 'boss_warn':    this._waveBossWarn(canvas, enemies);    break;
      case 'boss':         this._waveBoss();                       break;
    }
    this.waveTimer++;
    this.spawnTimer++;
  },

  draw(ctx, canvas) {
    const isWarn = (this.wave === 'midboss_warn' || this.wave === 'boss_warn') && this.warning;
    if (!isWarn) return;
    const isOn = Math.floor(this.warning.timer / 25) % 2 === 0;
    if (!isOn) return;

    ctx.save();
    ctx.fillStyle = 'rgba(90, 0, 0, 0.42)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx   = canvas.width / 2;
    const cy   = canvas.height / 2;
    const fs   = Math.round(Math.min(canvas.width, canvas.height) * 0.062);
    const sub  = this.warning.type === 'boss' ? 'BOSS APPROACHING' : 'MID BOSS APPROACHING';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `${fs}px 'Press Start 2P', monospace`;
    ctx.fillStyle    = '#ff2222';
    ctx.shadowColor  = '#ff0000';
    ctx.shadowBlur   = 48;
    ctx.fillText('⚠  WARNING  ⚠', cx, cy);
    ctx.font      = `${Math.round(fs * 0.40)}px 'Press Start 2P', monospace`;
    ctx.fillStyle = '#ffaaaa';
    ctx.shadowBlur = 16;
    ctx.fillText(sub, cx, cy + Math.round(fs * 1.05));
    ctx.restore();
  },
};
