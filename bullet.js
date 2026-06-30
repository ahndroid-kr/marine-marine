const bulletBubbleImg = new Image();
bulletBubbleImg.src = 'assets/images/bullet_bubble.png';

const bulletBubbleLargeImg = new Image();
bulletBubbleLargeImg.src = 'assets/images/bullet_bubble_large.png';

// canvas is the global from main.js — available at call-time
class Bullet {
  constructor(x, y, vx, vy, fromPlayer, fromBoss = false, large = false, opts = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.fromBoss = fromBoss;
    this.large = large;
    this.dead = false;
    this.customImg  = opts.img       || null;
    this.fixedW     = opts.w         || null;
    this.fixedH     = opts.h         || null;
    this.glowStyle  = opts.glowStyle || null;
  }

  // Dynamic sizing relative to canvas height
  get w() {
    if (this.fixedW)     return this.fixedW;
    if (this.fromPlayer) return Math.round(canvas.height * (this.large ? 0.052 : 0.036));
    if (this.fromBoss)   return Math.round(canvas.height * 0.016);
    return Math.round(canvas.height * 0.016);
  }
  get h() {
    if (this.fixedH)     return this.fixedH;
    if (this.fromPlayer) return Math.round(canvas.height * (this.large ? 0.052 : 0.036));
    if (this.fromBoss)   return Math.round(canvas.height * 0.016);
    return Math.round(canvas.height * 0.016);
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

    if (this.customImg) {
      if (this.customImg.complete && this.customImg.naturalWidth > 0) {
        ctx.drawImage(this.customImg, -this.w / 2, -this.h / 2, this.w, this.h);
      }
    } else if (this.fromPlayer) {
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
    } else if (this.glowStyle === 'jellyfish') {
      const r = Math.max(5, Math.round(canvas.height * 0.011));
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur  = 18;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,229,255,0.15)';
      ctx.fill();
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0,   '#FFFFFF');
      grad.addColorStop(0.4, '#00E5FF');
      grad.addColorStop(1,   'rgba(0,180,220,0.0)');
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.glowStyle === 'anglerfish') {
      const r    = Math.max(6, Math.round(canvas.height * 0.013));
      // 외곽 halo — 넓게 번지는 빛
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur  = 32;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,210,0,0.18)';
      ctx.fill();
      // 중심 코어
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0,   '#FFFFFF');
      grad.addColorStop(0.4, '#FFE135');
      grad.addColorStop(1,   'rgba(255,180,0,0.0)');
      ctx.shadowColor = '#FFE135';
      ctx.shadowBlur  = 20;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Enemy bullet: pink-red orb
      const r = this.w / 2;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, '#FF6B8A');
      grad.addColorStop(1, '#C9184A');
      ctx.shadowColor = '#FF4D6D';
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}
