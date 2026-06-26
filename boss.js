const midbossRayImg = new Image();
midbossRayImg.src = 'assets/images/midboss_ray.png';

const bossPufferImgs = { 1: new Image(), 2: new Image(), dead: new Image() };
bossPufferImgs[1].src = 'assets/images/boss_puffer_1.png';
bossPufferImgs[2].src = 'assets/images/boss_puffer_2.png';
bossPufferImgs.dead.src = 'assets/images/boss_puffer_dead.png';

const effectBossHitImg = new Image();
effectBossHitImg.src = 'assets/images/effect_boss_hit.png';

class MidbossRay {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = canvas.width + 80;
    this.y = canvas.height / 2;
    this.w = 160;
    this.h = 160;
    this.maxHp = 30;
    this.hp = 30;
    this.dead = false;
    this.dying = false;
    this.scoreValue = 3000;
    this.dropLife = false;
    this.vx = -0.9;
    this.t = 0;
    this.hitFlash = 0;
    this.hitEffects = [];
  }

  onHit() {
    this.hitFlash = 6;
    this.hitEffects.push({
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 60,
      timer: 12,
    });
  }

  update() {
    this.x += this.vx;
    this.t += 0.025;
    this.y += Math.sin(this.t) * 1.2;
    this.y = Math.max(70, Math.min(this.canvas.height - 70, this.y));
    if (this.hitFlash > 0) this.hitFlash--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);
    if (this.x < -160) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    ctx.drawImage(midbossRayImg, -80, -80, 160, 160);
    ctx.globalAlpha = 1;
    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 12;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }
    const barW = 100, barH = 7;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-barW / 2 - 1, 88, barW + 2, barH + 2);
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(-barW / 2, 89, barW * (this.hp / this.maxHp), barH);
    ctx.restore();
  }
}

class BossPuffer {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = canvas.width + 130;
    this.y = canvas.height / 2;
    this.w = 180;
    this.h = 180;
    this.maxHp = 80;
    this.hp = 80;
    this.phase = 1;
    this.dead = false;
    this.dying = false;
    this.scoreValue = 8000;
    this.dropLife = true;
    this.vx = -0.6;
    this.t = 0;
    this.hitFlash = 0;
    this.deadTimer = 0;
    this.hitEffects = [];
  }

  onHit() {
    this.hitFlash = 6;
    this.hitEffects.push({
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      timer: 14,
    });
  }

  onDeath() {
    this.dying = true;
    this.deadTimer = 0;
  }

  update() {
    if (this.dying) {
      this.deadTimer++;
      if (this.deadTimer > 150) this.dead = true;
      return;
    }
    this.t += 0.018;
    this.x += this.vx;
    this.y += Math.sin(this.t * 0.8) * 0.9;
    this.y = Math.max(100, Math.min(this.canvas.height - 100, this.y));
    if (this.hp <= this.maxHp / 2 && this.phase === 1) this.phase = 2;
    if (this.hitFlash > 0) this.hitFlash--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);
    if (this.x < -220) this.dead = true;
  }

  get currentImg() {
    if (this.dying) return bossPufferImgs.dead;
    return bossPufferImgs[this.phase];
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    const half = this.w / 2;
    ctx.drawImage(this.currentImg, -half, -half, this.w, this.h);
    ctx.globalAlpha = 1;
    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 14;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }
    if (!this.dying) {
      const barW = 160, barH = 10;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barW / 2 - 1, 96, barW + 2, barH + 2);
      const pct = this.hp / this.maxHp;
      ctx.fillStyle = pct > 0.5 ? '#00cc44' : '#ff3300';
      ctx.fillRect(-barW / 2, 97, barW * pct, barH);
    }
    ctx.restore();
  }
}
