const playerImg = new Image();
playerImg.src = 'assets/images/player.png';

class Player {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.min(130, canvas.width * 0.2);
    this.y = canvas.height / 2;
    this.w = 64;
    this.h = 64;
    this.targetX = this.x;
    this.targetY = this.y;
    this.fireTimer = 0;
    this.fireRate = 26;
    this.hitTimer = 0;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  clamp() {
    const pad = 20;
    const minX = this.w / 2 + pad;
    const maxX = this.canvas.width - this.w / 2 - pad;
    const minY = this.h + pad;
    const maxY = this.canvas.height - this.h - pad;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
    this.targetX = Math.max(minX, Math.min(maxX, this.targetX));
    this.targetY = Math.max(minY, Math.min(maxY, this.targetY));
  }

  getBulletConfigs() {
    switch (GS.powerLevel) {
      case 1:  return [{ vx: 9, vy: -2 }, { vx: 9, vy: 2 }];
      case 2:  return [{ vx: 9, vy: -3 }, { vx: 10, vy: 0 }, { vx: 9, vy: 3 }];
      case 3:  return [{ vx: 9, vy: -3 }, { vx: 10, vy: 0 }, { vx: 9, vy: 3 }, { vx: -7, vy: 0 }];
      default: return [{ vx: 10, vy: 0 }];
    }
  }

  update() {
    const pad = 20;
    const minX = this.w / 2 + pad;
    const maxX = this.canvas.width - this.w / 2 - pad;
    const minY = this.h + pad;
    const maxY = this.canvas.height - this.h - pad;

    this.targetX = Math.max(minX, Math.min(maxX, this.targetX));
    this.targetY = Math.max(minY, Math.min(maxY, this.targetY));

    this.x += (this.targetX - this.x) * 0.1;
    this.y += (this.targetY - this.y) * 0.1;

    if (this.hitTimer > 0) this.hitTimer--;

    this.fireTimer++;
    if (this.fireTimer >= this.fireRate) {
      this.fireTimer = 0;
      return this.getBulletConfigs();
    }
    return null;
  }

  // Returns true if a life was lost
  hit() {
    if (GS.shield > 0) {
      GS.shield--;
      this.hitTimer = 20;
      return false;
    }
    GS.lives--;
    this.hitTimer = 45;
    return true;
  }

  draw(ctx) {
    ctx.save();

    const scale = GS.giant ? 1.5 : 1.0;
    const drawW = this.w * scale;
    const drawH = this.h * scale;

    ctx.translate(Math.round(this.x), Math.round(this.y));

    if (GS.invincible > 0) {
      ctx.globalAlpha = Math.floor(GS.invincible / 4) % 2 === 0 ? 1.0 : 0.55;
    } else if (this.hitTimer > 0) {
      ctx.globalAlpha = Math.floor(this.hitTimer / 5) % 2 === 0 ? 0.2 : 1.0;
    }

    ctx.drawImage(playerImg, -drawW / 2, -drawH / 2, drawW, drawH);

    if (GS.shield > 0) {
      const t = performance.now() / 800;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);

      const drawRing = (rx, ry, color) => {
        ctx.strokeStyle = color;
        ctx.shadowColor = color;

        ctx.globalAlpha = 0.10 + 0.08 * pulse;
        ctx.lineWidth = 14;
        ctx.shadowBlur = 32;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.40 + 0.20 * pulse;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.90;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      };

      drawRing(drawW / 2 + 14, drawH / 2 + 12, '#3399ff');
      if (GS.shield >= 2) {
        drawRing(drawW / 2 + 28, drawH / 2 + 26, '#00ffff');
      }
    }

    ctx.restore();
  }
}
