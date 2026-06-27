const playerImg = new Image();
playerImg.src = 'assets/images/player.png';

class Player {
  constructor(canvas) {
    this.canvas   = canvas;
    this.x        = canvas.width * 0.15;
    this.y        = canvas.height / 2;
    this.targetX  = this.x;
    this.targetY  = this.y;
    this.fireTimer = 0;
    this.fireRate  = 26;
    this.hitTimer  = 0;
  }

  get w() { return Math.round(this.canvas.height * 0.10); }
  get h() { return Math.round(this.canvas.height * 0.10); }

  get _pad()  { return Math.round(this.canvas.height * 0.035); }
  get _minX() { return this.w / 2 + this._pad; }
  get _maxX() { return this.canvas.width  - this.w / 2 - this._pad; }
  get _minY() { return this.h + this._pad; }
  get _maxY() { return this.canvas.height - this.h - this._pad; }

  setTarget(x, y) { this.targetX = x; this.targetY = y; }

  clamp() {
    this.x       = Math.max(this._minX, Math.min(this._maxX, this.x));
    this.y       = Math.max(this._minY, Math.min(this._maxY, this.y));
    this.targetX = Math.max(this._minX, Math.min(this._maxX, this.targetX));
    this.targetY = Math.max(this._minY, Math.min(this._maxY, this.targetY));
  }

  getBulletConfigs() {
    const s = this.canvas.height / 600;
    switch (GS.powerLevel) {
      case 1:  return [{ vx: 9*s, vy: -2*s }, { vx: 9*s, vy: 2*s }];
      case 2:  return [{ vx: 9*s, vy: -3*s }, { vx: 10*s, vy: 0 }, { vx: 9*s, vy: 3*s }];
      case 3:  return [{ vx: 9*s, vy: -3*s }, { vx: 10*s, vy: 0 }, { vx: 9*s, vy: 3*s }, { vx: -7*s, vy: 0 }];
      default: return [{ vx: 10*s, vy: 0 }];
    }
  }

  update() {
    this.targetX = Math.max(this._minX, Math.min(this._maxX, this.targetX));
    this.targetY = Math.max(this._minY, Math.min(this._maxY, this.targetY));
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

  hit() {
    if (GS.shield > 0) { GS.shield--; this.hitTimer = 20; return false; }
    GS.lives--;
    GS.powerLevel = 0;
    GS.petCount   = 0;
    GS.invincible = 0;
    GS.giant      = false;
    pets.length   = 0;
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
      const pulse    = 0.5 + 0.5 * Math.sin(performance.now() * (Math.PI * 2 / 1500));
      const isDouble = GS.shield >= 2;
      const coreCol  = isDouble ? '#fffde7' : '#ffffff';
      const glowCol  = isDouble ? '#fff9c4' : '#ffffff';
      const shieldPad = Math.round(this.canvas.height * 0.033);
      const rx0 = drawW / 2 + shieldPad;
      const ry0 = drawH / 2 + shieldPad;

      const ovalPath = (rx, ry) => {
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.closePath();
      };
      const drawShieldLayer = (rx, ry, boost) => {
        ctx.globalAlpha = (0.15 + 0.10 * pulse) * boost;
        ctx.strokeStyle = glowCol; ctx.shadowColor = glowCol;
        ctx.lineWidth = 24; ctx.shadowBlur = 44 + 22 * pulse;
        ovalPath(rx, ry); ctx.stroke();

        ctx.globalAlpha = (0.32 + 0.18 * pulse) * boost;
        ctx.lineWidth = 10; ctx.shadowBlur = 26 + 14 * pulse;
        ovalPath(rx, ry); ctx.stroke();

        ctx.globalAlpha = 0.80 + 0.20 * pulse;
        ctx.strokeStyle = coreCol; ctx.shadowColor = coreCol;
        ctx.lineWidth = 2; ctx.shadowBlur = 18 + 8 * pulse;
        ovalPath(rx, ry); ctx.stroke();

        ctx.globalAlpha = 0.05 + 0.04 * pulse;
        ctx.fillStyle = coreCol; ctx.shadowBlur = 0;
        ovalPath(rx, ry); ctx.fill();
      };

      const gap = Math.round(this.canvas.height * 0.030);
      if (isDouble) drawShieldLayer(rx0 + gap, ry0 + gap, 1.3);
      drawShieldLayer(rx0, ry0, 1.0);
      ctx.restore();
    }
    ctx.restore();
  }
}
