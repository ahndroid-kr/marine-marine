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
      ctx.save();

      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * (Math.PI * 2 / 1500));
      const isDouble = GS.shield >= 2;
      const coreCol  = isDouble ? '#fffde7' : '#ffffff';
      const glowCol  = isDouble ? '#fff9c4' : '#ffffff';

      const rx0 = drawW / 2 + 20;
      const ry0 = drawH / 2 + 20;

      const hexPath = (rx, ry) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          i === 0 ? ctx.moveTo(rx * Math.cos(a), ry * Math.sin(a))
                  : ctx.lineTo(rx * Math.cos(a), ry * Math.sin(a));
        }
        ctx.closePath();
      };

      const drawShieldLayer = (rx, ry, glowBoost) => {
        // outermost wide blur — aura spreading inward
        ctx.globalAlpha = (0.18 + 0.12 * pulse) * glowBoost;
        ctx.strokeStyle = glowCol;
        ctx.shadowColor = glowCol;
        ctx.lineWidth = 22;
        ctx.shadowBlur = 40 + 20 * pulse;
        hexPath(rx, ry);
        ctx.stroke();

        // mid glow halo
        ctx.globalAlpha = (0.35 + 0.20 * pulse) * glowBoost;
        ctx.lineWidth = 10;
        ctx.shadowBlur = 24 + 12 * pulse;
        hexPath(rx, ry);
        ctx.stroke();

        // bright core edge
        ctx.globalAlpha = 0.80 + 0.20 * pulse;
        ctx.strokeStyle = coreCol;
        ctx.shadowColor = coreCol;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 16 + 8 * pulse;
        hexPath(rx, ry);
        ctx.stroke();

        // near-invisible inner fill
        ctx.globalAlpha = 0.05 + 0.05 * pulse;
        ctx.fillStyle = coreCol;
        ctx.shadowBlur = 0;
        hexPath(rx, ry);
        ctx.fill();
      };

      if (isDouble) drawShieldLayer(rx0 + 18, ry0 + 18, 1.3);
      drawShieldLayer(rx0, ry0, 1.0);

      ctx.restore();
    }

    ctx.restore();
  }
}
