const enemyImgs = {};
['squid', 'shrimp', 'hairtail'].forEach(t => {
  enemyImgs[t] = new Image();
  enemyImgs[t].src = `assets/images/enemy_${t}.png`;
});

const ENEMY_DEFS = {
  squid:    { w: 48, h: 48, hp: 1, score: 100 },
  shrimp:   { w: 52, h: 40, hp: 1, score: 100 },
  hairtail: { w: 160, h: 80, hp: 2, score: 200 },
};

class Enemy {
  constructor(canvas, type) {
    const t = type || ['squid', 'shrimp', 'hairtail'][Math.floor(Math.random() * 3)];
    const def = ENEMY_DEFS[t];
    this.canvas = canvas;
    this.type = t;
    this.x = canvas.width + def.w;
    this.y = 60 + Math.random() * (canvas.height - 130);
    const speedMult = Math.min(1 + GS.score / 3000, 2.5);
    this.vx = -(Math.random() * 1.5 + 1.5) * speedMult;
    this.w = def.w;
    this.h = def.h;
    this.hp = def.hp;
    this.scoreValue = def.score;
    this.dead = false;
    this.dying = false;
    this.t = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
  }

  onHit() {
    this.hitFlash = 4;
  }

  update() {
    this.x += this.vx;
    this.t += 0.055;
    this.y += Math.sin(this.t) * 0.5;
    this.y = Math.max(40, Math.min(this.canvas.height - 50, this.y));
    if (this.x < -120) this.dead = true;
    if (this.hitFlash > 0) this.hitFlash--;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) {
      ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    }
    const img = enemyImgs[this.type];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}
