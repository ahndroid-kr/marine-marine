// canvas is the global from main.js — available at call-time
class Bullet {
  constructor(x, y, vx, vy, fromPlayer) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.dead = false;
  }

  // Dynamic sizing relative to canvas height
  get w() { return Math.round(canvas.height * (this.fromPlayer ? 0.036 : 0.022)); }
  get h() { return Math.round(canvas.height * (this.fromPlayer ? 0.010 : 0.022)); }

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
