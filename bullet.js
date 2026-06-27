// canvas is the global from main.js — available at call-time
class Bullet {
  constructor(x, y, vx, vy, fromPlayer, fromBoss = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.fromBoss = fromBoss;
    this.dead = false;
  }

  // Dynamic sizing relative to canvas height
  get w() {
    if (this.fromPlayer) return Math.round(canvas.height * 0.036);
    if (this.fromBoss)   return Math.round(canvas.height * 0.016);
    return Math.round(canvas.height * 0.022);
  }
  get h() {
    if (this.fromPlayer) return Math.round(canvas.height * 0.010);
    if (this.fromBoss)   return Math.round(canvas.height * 0.016);
    return Math.round(canvas.height * 0.022);
  }

  update(c) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > c.width + 80 || this.x < -80 || this.y < -80 || this.y > c.height + 80) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.fromPlayer) {
      // Torpedo body
      ctx.beginPath();
      ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#d4a820';
      ctx.fill();
      // Pointed nose
      ctx.beginPath();
      ctx.moveTo(this.w / 2, 0);
      ctx.lineTo(this.w / 2 - 5, -(this.h / 2 - 1));
      ctx.lineTo(this.w / 2 - 5, this.h / 2 - 1);
      ctx.closePath();
      ctx.fillStyle = '#f0c040';
      ctx.fill();
      // Bubble trail
      ctx.beginPath();
      ctx.moveTo(-this.w / 2, 0);
      ctx.lineTo(-this.w / 2 - 13, -2);
      ctx.lineTo(-this.w / 2 - 13, 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(150, 220, 255, 0.5)';
      ctx.fill();
    } else if (this.fromBoss) {
      // Boss bullet: purple/pink magic orb
      const r = this.w / 2;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, '#FF85C2');
      grad.addColorStop(1, '#9B59B6');
      ctx.shadowColor = '#C77DFF';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Enemy bullet: glowing red orb
      const r = this.w / 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff3300';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = Math.round(canvas.height * 0.015);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}
