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
const bulletBubbleS4   = _s4LoadImg('assets/images/bullet_bubble.png');

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
      const bSz  = Math.round(this.canvas.height * 0.040);
      const dx   = player.x - this.x;
      const dy   = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      return [{ x: this.x, y: this.y, vx: spd * dx / dist, vy: spd * dy / dist, img: bulletBubbleS4, bw: bSz, bh: bSz }];
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

// ─── Stage 4 ──────────────────────────────────────────────────────────────────
const stage4 = {
  _inited:    false,
  wave:       'wave1',
  waveTimer:  0,
  spawnTimer: 0,

  init() {
    this._inited    = false;
    this.wave       = 'wave1';
    this.waveTimer  = 0;
    this.spawnTimer = 0;
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

  // wave5: 전체 혼합 고밀도 (1080f / 18s) — 2단계에서 midboss_warn으로 교체 예정
  _wave5(canvas, enemies) {
    if (this.spawnTimer >= 130) {
      this.spawnTimer = 0;
      const r = Math.random();
      if      (r < 0.35) enemies.push(new EnemyHermitCrab(canvas));
      else if (r < 0.65) enemies.push(new EnemyStarfish(canvas));
      else               enemies.push(new EnemyJellyfish(canvas));
    }
    if (this.waveTimer >= 1080) GS.phase = 'stageclear'; // TODO: → midboss_warn
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
    switch (this.wave) {
      case 'wave1': this._wave1(canvas, enemies); break;
      case 'wave2': this._wave2(canvas, enemies); break;
      case 'wave3': this._wave3(canvas, enemies); break;
      case 'wave4': this._wave4(canvas, enemies); break;
      case 'wave5': this._wave5(canvas, enemies); break;
    }
    this.waveTimer++;
    this.spawnTimer++;
  },

  draw(ctx, canvas) {},  // 2단계에서 WARNING 오버레이 추가 예정
};
