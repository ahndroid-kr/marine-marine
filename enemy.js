function _loadEnemyImg(src) {
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

const enemyImgs = {};
['squid', 'shrimp', 'hairtail'].forEach(t => {
  enemyImgs[t] = _loadEnemyImg(`assets/images/enemy_${t}.png`);
});

const enemyStage2Imgs = {};
['porgy', 'filefish', 'flounder'].forEach(t => {
  enemyStage2Imgs[t] = _loadEnemyImg(`assets/images/enemy_${t}.png`);
});

const enemyStage3Imgs = {};
['spidercrab', 'anglerfish_on', 'anglerfish_off', 'smoker', 'krill'].forEach(t => {
  enemyStage3Imgs[t] = _loadEnemyImg(`assets/images/enemy_${t}.png`);
});

const bulletBlacksmokerImg = _loadEnemyImg('assets/images/bullet_blacksmoker.png');

// Size ratios relative to canvas.height
const ENEMY_DEFS = {
  squid:    { wR: 0.080, hR: 0.080, hp: 1, score: 100 },
  shrimp:   { wR: 0.085, hR: 0.065, hp: 1, score: 100 },
  hairtail: { wR: 0.200, hR: 0.100, hp: 2, score: 200 },
};

class Enemy {
  constructor(canvas, type) {
    const t = type || ['squid', 'shrimp', 'hairtail'][Math.floor(Math.random() * 3)];
    this.canvas = canvas;
    this.type   = t;
    this.hp     = ENEMY_DEFS[t].hp;
    this.scoreValue = ENEMY_DEFS[t].score;

    const uiH = Math.round(canvas.height * 0.085);
    this.x = canvas.width + this.w;
    this.y = uiH + this.h / 2 + Math.random() * (canvas.height - uiH - this.h - 40);

    const s = canvas.height / 600;
    const speedMult = Math.min(1 + GS.score / 3000, 2.5);
    const baseMult  = t === 'hairtail' ? 1.0 : 0.65;
    this.vx = -(Math.random() * 1.5 + 1.5) * speedMult * baseMult * s;

    this.dead = false;
    this.dying = false;
    this.t = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
    if (t === 'squid') this.fireTimer = Math.floor(Math.random() * 120);
  }

  get w() { return Math.round(this.canvas.height * ENEMY_DEFS[this.type].wR); }
  get h() { return Math.round(this.canvas.height * ENEMY_DEFS[this.type].hR); }

  onHit() { this.hitFlash = 4; }

  update() {
    const s   = this.canvas.height / 600;
    const sbH = Math.round(this.canvas.height * 0.035);
    const uiH = Math.round(this.canvas.height * 0.085);

    this.x += this.vx;

    if (this.type === 'shrimp') {
      // 새우: 큰 진폭 sin파 지그재그
      this.t += 0.09;
      this.y += Math.sin(this.t) * 4 * s;
    } else {
      this.t += 0.055;
      this.y += Math.sin(this.t) * 0.5 * s;
    }

    this.y = Math.max(uiH + this.h / 2, Math.min(this.canvas.height - sbH - this.h / 2, this.y));
    if (this.x < -(this.w + 20)) this.dead = true;
    if (this.hitFlash > 0) this.hitFlash--;

    // 꼴뚜기: 2초(120프레임)마다 전방 직진탄 1발
    if (this.type === 'squid' && !this.dead) {
      this.fireTimer++;
      if (this.fireTimer >= 120) {
        this.fireTimer = 0;
        const spd = 5 * s;
        return [{ x: this.x - this.w / 2, y: this.y, vx: -spd, vy: 0 }];
      }
    }

    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = enemyImgs[this.type];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}

// ─── Stage 2 Enemies ──────────────────────────────────────────────────────────

// EnemyPorgy (도미): 지그재그 이동 + 전방 단발
class EnemyPorgy {
  constructor(canvas) {
    this.canvas = canvas;
    this.hp = 2;
    this.scoreValue = 100;
    this.dead = false;
    this.dying = false;
    const uiH = Math.round(canvas.height * 0.085);
    this.x = canvas.width + this.w;
    this.y = uiH + this.h / 2 + Math.random() * (canvas.height - uiH - this.h - 40);
    const s = canvas.height / 600;
    this.vx = -(Math.random() * 1.0 + 1.5) * s;
    this.t = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
    this.fireTimer = Math.floor(Math.random() * 120);
  }

  get w() { return Math.round(this.canvas.height * 0.127); }
  get h() { return Math.round(this.canvas.height * 0.090); }

  onHit() { this.hitFlash = 4; }

  update() {
    const s   = this.canvas.height / 600;
    const sbH = Math.round(this.canvas.height * 0.035);
    const uiH = Math.round(this.canvas.height * 0.085);

    this.x += this.vx;
    this.t += 0.08;
    this.y += Math.sin(this.t) * 3 * s;
    this.y = Math.max(uiH + this.h / 2, Math.min(this.canvas.height - sbH - this.h / 2, this.y));

    if (this.x < -(this.w + 20)) this.dead = true;
    if (this.hitFlash > 0) this.hitFlash--;

    this.fireTimer++;
    if (this.fireTimer >= 120 && !this.dead) {
      this.fireTimer = 0;
      const spd = 5 * s;
      return [{ x: this.x - this.w / 2, y: this.y, vx: -spd, vy: 0 }];
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = enemyStage2Imgs.porgy;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}

// EnemyFilefish (쥐치): 천천히 직선 접근 + 플레이어 조준탄
class EnemyFilefish {
  constructor(canvas) {
    this.canvas = canvas;
    this.hp = 3;
    this.scoreValue = 150;
    this.dead = false;
    this.dying = false;
    const uiH = Math.round(canvas.height * 0.085);
    this.x = canvas.width + this.w;
    this.y = uiH + this.h / 2 + Math.random() * (canvas.height - uiH - this.h - 40);
    const s = canvas.height / 600;
    this.vx = -(Math.random() * 0.8 + 1.2) * s;
    this.hitFlash = 0;
    this.fireTimer = Math.floor(Math.random() * 150);
  }

  get w() { return Math.round(this.canvas.height * 0.128); }
  get h() { return Math.round(this.canvas.height * 0.085); }

  onHit() { this.hitFlash = 4; }

  update() {
    const s   = this.canvas.height / 600;
    const sbH = Math.round(this.canvas.height * 0.035);
    const uiH = Math.round(this.canvas.height * 0.085);

    this.x += this.vx;
    this.y = Math.max(uiH + this.h / 2, Math.min(this.canvas.height - sbH - this.h / 2, this.y));

    if (this.x < -(this.w + 20)) this.dead = true;
    if (this.hitFlash > 0) this.hitFlash--;

    this.fireTimer++;
    if (this.fireTimer >= 150 && !this.dead) {
      this.fireTimer = 0;
      const spd = 5 * s;
      const dx   = player.x - this.x;
      const dy   = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      return [{ x: this.x - this.w / 2, y: this.y, vx: spd * dx / dist, vy: spd * dy / dist }];
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = enemyStage2Imgs.filefish;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}

// EnemyFlounder (광어): 대기 → 예비동작 → 돌진 → 반복
class EnemyFlounder {
  constructor(canvas) {
    this.canvas     = canvas;
    this.hp         = 2;
    this.scoreValue = 120;
    this.dead       = false;
    this.dying      = false;

    const s = canvas.height / 600;
    this.fromTop   = Math.random() > 0.5;
    this.x         = canvas.width * (0.35 + Math.random() * 0.45);
    this.y         = this.fromTop ? -this.h : canvas.height + this.h;
    this.vx        = -(0.4 + Math.random() * 0.3) * s;
    this.vy        = 0;
    this._rushSpd  = (5.5 + Math.random() * 2) * s;
    this.state     = 'waiting'; // 'waiting' | 'windup' | 'rushing'
    this.stateTimer = 0;
    this.waitDur   = 25 + Math.floor(Math.random() * 20);
    this.hitFlash  = 0;
  }

  get w() { return Math.round(this.canvas.height * 0.169); }
  get h() { return Math.round(this.canvas.height * 0.090); }

  onHit() { this.hitFlash = 4; }

  _edgeY() {
    // 예비동작 시 화면 가장자리에서 절반만 보이는 위치
    return this.fromTop ? 0 : this.canvas.height;
  }

  update() {
    this.x += this.vx;
    if (this.x < -(this.w + 20)) { this.dead = true; return null; }
    if (this.hitFlash > 0) this.hitFlash--;
    this.stateTimer++;

    if (this.state === 'waiting') {
      // 화면 바깥 대기 — waitDur 후 가장자리로 이동해 예비동작
      if (this.stateTimer >= this.waitDur) {
        this.y          = this._edgeY();
        this.state      = 'windup';
        this.stateTimer = 0;
      }

    } else if (this.state === 'windup') {
      // 0.3초(18프레임) 예비동작: 가장자리에서 살짝 진동
      const wobble = Math.sin(this.stateTimer * 1.6) * (this.canvas.height * 0.003);
      this.y = this._edgeY() + (this.fromTop ? wobble : -wobble);
      if (this.stateTimer >= 18) {
        this.vy         = this.fromTop ? this._rushSpd : -this._rushSpd;
        this.state      = 'rushing';
        this.stateTimer = 0;
      }

    } else {
      // 고속 돌진
      this.y += this.vy;
      if (this.vy > 0 && this.y > this.canvas.height + this.h) {
        // 아래로 이탈 → 아래쪽에서 대기, 다음엔 위로 돌진
        this.fromTop    = false;
        this.y          = this.canvas.height + this.h;
        this.vy         = 0;
        this.state      = 'waiting';
        this.stateTimer = 0;
        this.waitDur    = 20 + Math.floor(Math.random() * 25);
      } else if (this.vy < 0 && this.y < -this.h) {
        // 위로 이탈 → 위쪽에서 대기, 다음엔 아래로 돌진
        this.fromTop    = true;
        this.y          = -this.h;
        this.vy         = 0;
        this.state      = 'waiting';
        this.stateTimer = 0;
        this.waitDur    = 20 + Math.floor(Math.random() * 25);
      }
    }

    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = enemyStage2Imgs.flounder;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}

// ─── Stage 3 Enemies ──────────────────────────────────────────────────────────

// EnemySpiderCrab: 화면 하단 고정, 느린 직진, 2초 간격 플레이어 조준탄
class EnemySpiderCrab {
  constructor(canvas) {
    this.canvas = canvas;
    this.hp = 5;
    this.scoreValue = 150;
    this.dead = false;
    this.dying = false;
    this._giantDmgTimer = 0;
    const s      = canvas.height / 600;
    const sbH    = Math.round(canvas.height * 0.035);
    const lift   = Math.round(canvas.height * 0.080);
    this.x = canvas.width + this.w;
    this.y = canvas.height - sbH - this.h / 2 - lift;
    this._baseY    = this.y;
    this.vx = -(1.2 + Math.random() * 0.6) * s;
    this.hitFlash  = 0;
    this.fireTimer = Math.floor(Math.random() * 120);
  }

  get w() { return Math.round(this.canvas.height * 0.160); }
  get h() { return Math.round(this.canvas.height * 0.110); }

  onHit() { this.hitFlash = 4; }

  update() {
    const s = this.canvas.height / 600;
    this.x += this.vx;
    this.y = this._baseY;  // y 고정
    if (this.x < -(this.w + 20)) { this.dead = true; return null; }
    if (this.hitFlash > 0) this.hitFlash--;

    this.fireTimer++;
    if (this.fireTimer >= 120 && !this.dead) {
      this.fireTimer = 0;
      const spd  = 5 * s;
      const dx   = player.x - this.x;
      const dy   = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      return [{ x: this.x, y: this.y - this.h / 2, vx: spd * dx / dist, vy: spd * dy / dist }];
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = enemyStage3Imgs.spidercrab;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}

// EnemyAnglerfish: 느린 직진, on/off 깜빡임 1.5초 후 플레이어 조준탄 발사
class EnemyAnglerfish {
  constructor(canvas) {
    this.canvas = canvas;
    this.hp = 3;
    this.scoreValue = 200;
    this.dead = false;
    this.dying = false;
    this._giantDmgTimer = 0;
    const uiH = Math.round(canvas.height * 0.085);
    this.x = canvas.width + this.w;
    this.y = uiH + this.h / 2 + Math.random() * (canvas.height - uiH - this.h - 40);
    this._baseY   = this.y;
    this.sinTimer = Math.random() * Math.PI * 2;
    const s = canvas.height / 600;
    this.vx = -(0.8 + Math.random() * 0.5) * s;
    this.hitFlash  = 0;
    this.fireTimer = Math.floor(Math.random() * 90);
    this.blinking  = false;
    this.blinkTimer = 0;
    this.on = true;
  }

  get w() { return Math.round(this.canvas.height * 0.144); }
  get h() { return Math.round(this.canvas.height * 0.144); }

  onHit() { this.hitFlash = 4; }

  update() {
    const s   = this.canvas.height / 600;
    const sbH = Math.round(this.canvas.height * 0.035);
    const uiH = Math.round(this.canvas.height * 0.085);

    this.x += this.vx;
    this.sinTimer += 0.04;
    const sinAmp = Math.round(this.canvas.height * 0.06);
    this.y = Math.max(uiH + this.h / 2,
      Math.min(this.canvas.height - sbH - this.h / 2, this._baseY + Math.sin(this.sinTimer) * sinAmp));
    if (this.x < -(this.w + 20)) { this.dead = true; return null; }
    if (this.hitFlash > 0) this.hitFlash--;

    if (!this.blinking) {
      this.on = true;
      this.fireTimer++;
      if (this.fireTimer >= 120) {  // 2s idle → 깜빡임 시작
        this.fireTimer  = 0;
        this.blinking   = true;
        this.blinkTimer = 0;
      }
    } else {
      this.blinkTimer++;
      // 0.5초(30f) 간격 on/off 토글
      this.on = Math.floor(this.blinkTimer / 30) % 2 === 0;
      if (this.blinkTimer >= 90) {  // 1.5초 깜빡임 후 발사
        this.blinking = false;
        this.on       = true;
        const spd  = 5 * s;
        const dx   = player.x - this.x;
        const dy   = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        return [{ x: this.x - this.w / 2, y: this.y, vx: spd * dx / dist, vy: spd * dy / dist, glowStyle: 'anglerfish' }];
      }
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    if (this.on) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur  = 15;
    }
    const img = this.on ? enemyStage3Imgs.anglerfish_on : enemyStage3Imgs.anglerfish_off;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// EnemyBlackSmoker: 화면 하단 고정, 느린 직진, 3초 간격 위쪽 연속 3발
class EnemyBlackSmoker {
  constructor(canvas) {
    this.canvas = canvas;
    this.hp = 12;
    this.scoreValue = 200;
    this.dead = false;
    this.dying = false;
    this._giantDmgTimer = 0;
    const s    = canvas.height / 600;
    const sbH  = Math.round(canvas.height * 0.035);
    const lift = Math.round(canvas.height * 0.080);
    this.x = canvas.width + this.w;
    this.y = canvas.height - sbH - this.h / 2 - lift;
    this.vx = -(0.5 + Math.random() * 0.4) * s;
    this.hitFlash      = 0;
    this.fireTimer     = Math.floor(Math.random() * 90);
    this.burstRemaining = 0;
    this.burstTimer     = 0;
  }

  get w() { return Math.round(this.canvas.height * 0.120); }
  get h() { return Math.round(this.canvas.height * 0.120); }

  onHit() { this.hitFlash = 4; }

  update() {
    const s = this.canvas.height / 600;
    this.x += this.vx;
    if (this.x < -(this.w + 20)) { this.dead = true; return null; }
    if (this.hitFlash > 0) this.hitFlash--;

    // 연속 버스트 처리 (2번째, 3번째 탄)
    if (this.burstRemaining > 0) {
      this.burstTimer++;
      if (this.burstTimer >= 10) {
        this.burstTimer = 0;
        this.burstRemaining--;
        const spd = 5 * s;
        const bSz = Math.round(this.canvas.height * 0.044);
        return [{ x: this.x, y: this.y - this.h / 2, vx: 0, vy: -spd, img: bulletBlacksmokerImg, bw: bSz, bh: bSz }];
      }
      return null;
    }

    this.fireTimer++;
    if (this.fireTimer >= 180 && !this.dead) {  // 3초 간격
      this.fireTimer      = 0;
      this.burstRemaining = 2;  // 이후 2발 추가 발사
      this.burstTimer     = 0;
      const spd = 5 * s;
      const bSz = Math.round(this.canvas.height * 0.044);
      return [{ x: this.x, y: this.y - this.h / 2, vx: 0, vy: -spd, img: bulletBlacksmokerImg, bw: bSz, bh: bSz }];
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = enemyStage3Imgs.smoker;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}

// EnemyKrill: 고속 직진, 공격 없음(몸통 박치기), 무리 스폰
class EnemyKrill {
  constructor(canvas, yPos) {
    this.canvas = canvas;
    this.hp = 2;
    this.scoreValue = 50;
    this.dead = false;
    this.dying = false;
    this._giantDmgTimer = 0;
    const s   = canvas.height / 600;
    const uiH = Math.round(canvas.height * 0.085);
    this.x = canvas.width + this.w + Math.random() * 40;
    this.y = yPos !== undefined
      ? yPos
      : uiH + this.h / 2 + Math.random() * (canvas.height - uiH - this.h - 40);
    this.vx = -(4.0 + Math.random() * 1.5) * s;
    this.hitFlash = 0;
  }

  get w() { return Math.round(this.canvas.height * 0.044); }
  get h() { return Math.round(this.canvas.height * 0.044); }

  onHit() { this.hitFlash = 4; }

  update() {
    this.x += this.vx;
    if (this.x < -(this.w + 20)) { this.dead = true; return null; }
    if (this.hitFlash > 0) this.hitFlash--;
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const img = enemyStage3Imgs.krill;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}
