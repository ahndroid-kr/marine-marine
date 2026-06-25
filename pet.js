const petImg = new Image();
petImg.src = 'assets/images/pet.png';

class Pet {
  constructor(slot, startX, startY) {
    this.slot = slot; // 0 = below-rear diagonal, 1 = above-rear diagonal
    const dist = 55;
    this.x = startX - dist;
    this.y = slot === 0 ? startY + dist : startY - dist;
    this.w = 40;
    this.h = 40;
    this.fireTimer = Math.floor(Math.random() * 52); // stagger so pets don't fire together
    this.fireRate = 52; // ~50% of player fire rate
  }

  getBulletConfigs() {
    switch (GS.powerLevel) {
      case 1:  return [{ vx: 9, vy: -2 }, { vx: 9, vy: 2 }];
      case 2:  return [{ vx: 9, vy: -3 }, { vx: 10, vy: 0 }, { vx: 9, vy: 3 }];
      case 3:  return [{ vx: 9, vy: -3 }, { vx: 10, vy: 0 }, { vx: 9, vy: 3 }, { vx: -7, vy: 0 }];
      default: return [{ vx: 10, vy: 0 }];
    }
  }

  update(player) {
    const dist = 55;
    const tx = player.x - dist;
    const ty = this.slot === 0 ? player.y + dist : player.y - dist;
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
    ctx.drawImage(petImg, this.x - 20, this.y - 20, 40, 40);
  }
}
