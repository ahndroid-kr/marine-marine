class Player {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.min(130, canvas.width * 0.2);
    this.y = canvas.height / 2;
    this.w = 88;
    this.h = 30;
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
    const maxX = this.canvas.width * 0.48;
    const minX = this.w / 2 + pad;
    const minY = this.h + pad;
    const maxY = this.canvas.height - this.h - pad;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
    this.targetX = Math.max(minX, Math.min(maxX, this.targetX));
    this.targetY = Math.max(minY, Math.min(maxY, this.targetY));
  }

  update() {
    const pad = 20;
    const maxX = this.canvas.width * 0.48;
    const minX = this.w / 2 + pad;
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
      return true;
    }
    return false;
  }

  hit() {
    this.hitTimer = 45;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    if (this.hitTimer > 0) {
      ctx.globalAlpha = Math.floor(this.hitTimer / 5) % 2 === 0 ? 0.2 : 1.0;
    }

    const hw = this.w / 2;
    const hh = this.h / 2;

    // Bottom stabilizer fin
    ctx.beginPath();
    ctx.moveTo(-hw * 0.25, hh);
    ctx.lineTo(-hw * 0.55, hh + 12);
    ctx.lineTo(hw * 0.15, hh);
    ctx.closePath();
    ctx.fillStyle = '#2a5e50';
    ctx.fill();

    // Main hull
    ctx.beginPath();
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3d7a65';
    ctx.fill();
    ctx.strokeStyle = '#1e4a3a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nose cap
    ctx.beginPath();
    ctx.ellipse(hw - 7, 0, 13, hh - 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2e6555';
    ctx.fill();

    // Conning tower
    const ctX = -5, ctY = -hh - 15, ctW = 21, ctH = 15;
    ctx.beginPath();
    ctx.moveTo(ctX + 3, ctY);
    ctx.lineTo(ctX + ctW - 3, ctY);
    ctx.quadraticCurveTo(ctX + ctW, ctY, ctX + ctW, ctY + 3);
    ctx.lineTo(ctX + ctW, ctY + ctH);
    ctx.lineTo(ctX, ctY + ctH);
    ctx.lineTo(ctX, ctY + 3);
    ctx.quadraticCurveTo(ctX, ctY, ctX + 3, ctY);
    ctx.closePath();
    ctx.fillStyle = '#2e6555';
    ctx.fill();
    ctx.strokeStyle = '#1e4a3a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Periscope
    ctx.fillStyle = '#1a3d30';
    ctx.fillRect(ctX + 4, ctY - 14, 3, 15);
    ctx.fillRect(ctX + 1, ctY - 15, 9, 4);

    // Spinning propeller
    const propX = -hw + 3;
    const now = Date.now() / 130;
    ctx.save();
    ctx.translate(propX, 0);
    for (let i = 0; i < 3; i++) {
      const a = now + (i * Math.PI * 2) / 3;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 8, 3, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#5aaa8a';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Wake bubbles
    for (let i = 0; i < 3; i++) {
      const bx = -hw - 8 - i * 10;
      const by = Math.sin(Date.now() / 180 + i * 1.2) * 4;
      ctx.beginPath();
      ctx.arc(bx, by, 2.5 - i * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(150, 220, 255, ${0.55 - i * 0.15})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Porthole
    ctx.beginPath();
    ctx.arc(hw * 0.28, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#99ddff';
    ctx.fill();
    ctx.strokeStyle = '#1e4a3a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hw * 0.28 - 1.5, -2, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fill();

    ctx.restore();
  }
}
