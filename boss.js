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

  // render & hitbox size: 25% of canvas height
  get w() { return Math.round(this.canvas.height * 0.25); }
  get h() { return Math.round(this.canvas.height * 0.25); }

  onHit() {
    this.hitFlash = 6;
    this.hitEffects.push({
      x: (Math.random() - 0.5) * this.w * 0.5,
      y: (Math.random() - 0.5) * this.h * 0.5,
      timer: 12,
    });
  }

  update() {
    this.x += this.vx;
    this.t += 0.025;
    this.y += Math.sin(this.t) * 1.2;
    const margin = this.h / 2 + 10;
    this.y = Math.max(margin, Math.min(this.canvas.height - margin, this.y));
    if (this.hitFlash > 0) this.hitFlash--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);
    if (this.x < -(this.w + 40)) this.dead = true;
  }

  draw(ctx) {
    const hw = this.w / 2;
    const hh = this.h / 2;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    ctx.drawImage(midbossRayImg, -hw, -hh, this.w, this.h);
    ctx.globalAlpha = 1;
    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 12;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }
    const barW = Math.round(this.w * 0.7), barH = 7;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-barW / 2 - 1, hh + 8, barW + 2, barH + 2);
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(-barW / 2, hh + 9, barW * (this.hp / this.maxHp), barH);
    ctx.restore();
  }
}

class BossPuffer {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = canvas.width + 130;
    this.y = canvas.height / 2;
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

  // render & hitbox size: 25% of canvas height
  get w() { return Math.round(this.canvas.height * 0.25); }
  get h() { return Math.round(this.canvas.height * 0.25); }

  onHit() {
    this.hitFlash = 6;
    this.hitEffects.push({
      x: (Math.random() - 0.5) * this.w * 0.6,
      y: (Math.random() - 0.5) * this.h * 0.6,
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
    const margin = this.h / 2 + 10;
    this.y = Math.max(margin, Math.min(this.canvas.height - margin, this.y));
    if (this.hp <= this.maxHp / 2 && this.phase === 1) this.phase = 2;
    if (this.hitFlash > 0) this.hitFlash--;
    this.hitEffects = this.hitEffects.filter(e => --e.timer > 0);
    if (this.x < -(this.w + 60)) this.dead = true;
  }

  get currentImg() {
    if (this.dying) return bossPufferImgs.dead;
    return bossPufferImgs[this.phase];
  }

  draw(ctx) {
    const half = this.w / 2;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.globalAlpha = this.hitFlash % 2 === 0 ? 0.3 : 1.0;
    ctx.drawImage(this.currentImg, -half, -half, this.w, this.h);
    ctx.globalAlpha = 1;
    for (const e of this.hitEffects) {
      ctx.save();
      ctx.globalAlpha = e.timer / 14;
      ctx.drawImage(effectBossHitImg, e.x - 48, e.y - 48, 96, 96);
      ctx.restore();
    }
    if (!this.dying) {
      const barW = Math.round(this.w * 0.9), barH = 10;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barW / 2 - 1, half + 8, barW + 2, barH + 2);
      const pct = this.hp / this.maxHp;
      ctx.fillStyle = pct > 0.5 ? '#00cc44' : '#ff3300';
      ctx.fillRect(-barW / 2, half + 9, barW * pct, barH);
    }
    ctx.restore();
  }
}
