class Bullet {
  constructor(x, y, vx, vy, fromPlayer) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.w = fromPlayer ? 22 : 14;
    this.h = fromPlayer ? 6 : 5;
    this.dead = false;
  }

  update(canvas) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > canvas.width + 60 || this.x < -60) this.dead = true;
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
      ctx.beginPath();
      ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e03030';
      ctx.fill();
    }

    ctx.restore();
  }
}
