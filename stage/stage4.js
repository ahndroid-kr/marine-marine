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

// ─── EnemyHermitCrab: 하단 고정, 플레이어 조준 발사 ──────────────────────────
class EnemyHermitCrab {
  constructor(canvas) {
    this.canvas         = canvas;
    this.hp             = 8;
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
      const bW   = Math.round(this.canvas.height * 0.052);
      const bH   = Math.round(this.canvas.height * 0.044);
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

// ─── EnemyStarfish: 상단 2/3, 빠른 스텝형 이동 ───────────────────────────────
class EnemyStarfish {
  constructor(canvas) {
    this.canvas         = canvas;
    this.hp             = 6;
    this.scoreValue     = 70;
    this.dead           = false;
    this.dying          = false;
    this._giantDmgTimer = 0;
    const s    = canvas.height / 600;
    const uiH  = Math.round(canvas.height * 0.085);
    const maxY = Math.round(canvas.height * 0.65) - this.h / 2;
    this.x     = canvas.width + this.w + Math.random() * 40;
    this.y     = uiH + this.h / 2 + Math.random() * Math.max(0, maxY - uiH - this.h / 2);
    this._spd       = (5.5 + Math.random() * 1.0) * s;
    this.hitFlash   = 0;
    this._stepTimer = 0;
    this._stepping  = true;
    this._stepLen   = 12;   // 이동 지속 프레임
    this._pauseLen  = 8;    // 정지 프레임
  }

  get w() { return Math.round(this.canvas.height * 0.133); }
  get h() { return Math.round(this.canvas.height * 0.133); }

  onHit() { this.hitFlash = 4; }

  update() {
    this._stepTimer++;
    if (this._stepping) {
      this.x -= this._spd;
      if (this._stepTimer >= this._stepLen) { this._stepping = false; this._stepTimer = 0; }
    } else {
      if (this._stepTimer >= this._pauseLen) { this._stepping = true;  this._stepTimer = 0; }
    }
    if (this.x < -(this.w + 20)) { this.dead = true; return null; }
    if (this.hitFlash > 0) this.hitFlash--;
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
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
    this.hp             = 12;
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
    this.dropLife        = false;
    this.hitFlash        = 0;
    this.hitEffects      = [];
    this.fireTimer       = 0;
    this.invincibleTimer = 0;
    this._giantDmgTimer  = 0;
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

  onDeath() { this.dying = true; }

  update() {
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

    // 발사 패턴: phase1 120f(2s) / phase2(HP 50% 이하) 30f 연사
    const phase2    = this.hp <= this.maxHp * 0.5;
    const fireRate  = phase2 ? 30 : 120;
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

// ─── Stage 4 ──────────────────────────────────────────────────────────────────
const stage4 = {
  _inited:     false,
  wave:        'wave1',
  waveTimer:   0,
  spawnTimer:  0,
  midbossRef:  null,
  warning:     null,

  init() {
    this._inited    = false;
    this.wave       = 'wave1';
    this.waveTimer  = 0;
    this.spawnTimer = 0;
    this.midbossRef = null;
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

  // wave6: 중간보스 처치 후 짧은 정리 구간 (600f / 10s) — 3단계에서 boss_warn으로 교체 예정
  _wave6(canvas, enemies) {
    if (this.spawnTimer >= 150) {
      this.spawnTimer = 0;
      const r = Math.random();
      if      (r < 0.4) enemies.push(new EnemyHermitCrab(canvas));
      else if (r < 0.7) enemies.push(new EnemyStarfish(canvas));
      else               enemies.push(new EnemyJellyfish(canvas));
    }
    if (this.waveTimer >= 600) GS.phase = 'stageclear'; // TODO: → boss_warn
  },

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

    switch (this.wave) {
      case 'wave1':        this._wave1(canvas, enemies);        break;
      case 'wave2':        this._wave2(canvas, enemies);        break;
      case 'wave3':        this._wave3(canvas, enemies);        break;
      case 'wave4':        this._wave4(canvas, enemies);        break;
      case 'wave5':        this._wave5(canvas, enemies);        break;
      case 'midboss_warn': this._waveMidbossWarn(canvas, enemies); break;
      case 'midboss':      this._waveMidboss();                 break;
      case 'wave6':        this._wave6(canvas, enemies);        break;
    }
    this.waveTimer++;
    this.spawnTimer++;
  },

  draw(ctx, canvas) {
    if (this.wave !== 'midboss_warn' || !this.warning) return;
    const isOn = Math.floor(this.warning.timer / 25) % 2 === 0;
    if (!isOn) return;

    ctx.save();
    ctx.fillStyle = 'rgba(90, 0, 0, 0.42)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fs = Math.round(Math.min(canvas.width, canvas.height) * 0.062);
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
    ctx.fillText('MID BOSS APPROACHING', cx, cy + Math.round(fs * 1.05));
    ctx.restore();
  },
};
