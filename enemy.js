const enemyImgs = {};
['squid', 'shrimp', 'hairtail'].forEach(t => {
  enemyImgs[t] = new Image();
  enemyImgs[t].src = `assets/images/enemy_${t}.png`;
});

const enemyStage2Imgs = {};
['porgy', 'filefish', 'flounder'].forEach(t => {
  enemyStage2Imgs[t] = new Image();
  enemyStage2Imgs[t].src = `assets/images/enemy_${t}.png`;
});

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
    this.vx = -(Math.random() * 0.5 + 0.7) * s;
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

// EnemyFlounder (광어): 상하 교차 돌진 반복, 공격 없음
class EnemyFlounder {
  constructor(canvas) {
    this.canvas = canvas;
    this.hp = 2;
    this.scoreValue = 120;
    this.dead = false;
    this.dying = false;
    const s = canvas.height / 600;
    this.fromTop = Math.random() > 0.5;
    this.x = canvas.width + this.w;
    this.y = this.fromTop ? -this.h : canvas.height + this.h;
    this.vy = (this.fromTop ? 1 : -1) * (3.5 + Math.random() * 1.5) * s;
    this.vx = -(0.5 + Math.random() * 0.4) * s;
    this.hitFlash = 0;
  }

  get w() { return Math.round(this.canvas.height * 0.169); }
  get h() { return Math.round(this.canvas.height * 0.090); }

  onHit() { this.hitFlash = 4; }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.hitFlash > 0) this.hitFlash--;

    // 반대편 이탈 시 시작 위치로 리셋해 반복 돌진
    if (this.vy > 0 && this.y > this.canvas.height + this.h) {
      this.y = -this.h;
    } else if (this.vy < 0 && this.y < -this.h) {
      this.y = this.canvas.height + this.h;
    }

    if (this.x < -(this.w + 20)) this.dead = true;
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
