const enemyImgs = {};
['squid', 'shrimp', 'hairtail'].forEach(t => {
  enemyImgs[t] = new Image();
  enemyImgs[t].src = `assets/images/enemy_${t}.png`;
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
