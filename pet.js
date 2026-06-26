const petImg = new Image();
petImg.src = 'assets/images/pet.png';

class Pet {
  constructor(canvas, slot, startX, startY) {
    this.canvas    = canvas;
    this.slot      = slot;
    const dist     = Math.round(canvas.height * 0.09);
    this.x         = startX - dist;
    this.y         = slot === 0 ? startY + dist : startY - dist;
    this.fireTimer = Math.floor(Math.random() * 52);
    this.fireRate  = 52;
  }

  get w() { return Math.round(this.canvas.height * 0.065); }
  get h() { return Math.round(this.canvas.height * 0.065); }

  getBulletConfigs() {
    const s = this.canvas.height / 600;
    switch (GS.powerLevel) {
      case 1:  return [{ vx: 9*s, vy: -2*s }, { vx: 9*s, vy: 2*s }];
      case 2:  return [{ vx: 9*s, vy: -3*s }, { vx: 10*s, vy: 0 }, { vx: 9*s, vy: 3*s }];
      case 3:  return [{ vx: 9*s, vy: -3*s }, { vx: 10*s, vy: 0 }, { vx: 9*s, vy: 3*s }];
      default: return [{ vx: 10*s, vy: 0 }];
    }
  }

  update(player) {
    const dist = Math.round(this.canvas.height * 0.09);
    const tx   = player.x - dist;
    const ty   = this.slot === 0 ? player.y + dist : player.y - dist;
    this.x += (tx - this.x) * 0.09;
    this.y += (ty - this.y) * 0.09;
    this.fireTimer++;
    if (this.fireTimer >= this.fireRate) {
      this.fireTimer = 0;
      return this.getBulletConfigs();
    }
    return null;
  }

  draw(ctx) {
    if (!petImg.complete || !petImg.naturalWidth) return;
    ctx.drawImage(petImg, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
  }
}
