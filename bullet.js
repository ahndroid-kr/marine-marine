const bulletBubbleImg = new Image();
bulletBubbleImg.src = 'assets/images/bullet_bubble.png';

const bulletBubbleLargeImg = new Image();
bulletBubbleLargeImg.src = 'assets/images/bullet_bubble_large.png';

// canvas is the global from main.js — available at call-time
class Bullet {
  constructor(x, y, vx, vy, fromPlayer, fromBoss = false, large = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.fromBoss = fromBoss;
    this.large = large;
    this.dead = false;
  }

  // Dynamic sizing relative to canvas height
  get w() {
    if (this.fromPlayer) return Math.round(canvas.height * (this.large ? 0.052 : 0.036));
    if (this.fromBoss)   return Math.round(canvas.height * 0.016);
    return Math.round(canvas.height * 0.014);
  }
  get h() {
    if (this.fromPlayer) return Math.round(canvas.height * (this.large ? 0.052 : 0.036));
    if (this.fromBoss)   return Math.round(canvas.height * 0.016);
    return Math.round(canvas.height * 0.014);
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
      const img = this.large ? bulletBubbleLargeImg : bulletBubbleImg;
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
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
      // Enemy bullet: small mint/sky orb
      const r = this.w / 2;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, '#7FD4F0');
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.restore();
  }
}
