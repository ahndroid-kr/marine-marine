class Enemy {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = canvas.width + 65;
    this.y = 60 + Math.random() * (canvas.height - 130);
    const speedMult = Math.min(1 + GS.score / 3000, 2.5);
    this.vx = -(Math.random() * 1.5 + 1.5) * speedMult;
    this.w = 55;
    this.h = 22;
    this.hp = 1;
    this.scoreValue = 100;
    this.dead = false;
    this.t = Math.random() * Math.PI * 2;
    const hue = [0, 20, 170, 200, 280][Math.floor(Math.random() * 5)];
    this.bodyColor = `hsl(${hue}, 65%, 45%)`;
    this.finColor = `hsl(${hue}, 50%, 32%)`;
  }

  update() {
    this.x += this.vx;
    this.t += 0.055;
    this.y += Math.sin(this.t) * 0.5;
    this.y = Math.max(40, Math.min(this.canvas.height - 50, this.y));
    if (this.x < -120) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const hw = this.w / 2;
    const hh = this.h / 2;

    // Tail fin (right — trailing as fish moves left)
    ctx.beginPath();
    ctx.moveTo(hw, 0);
    ctx.lineTo(hw + 14, -hh - 4);
    ctx.lineTo(hw + 14, hh + 4);
    ctx.closePath();
    ctx.fillStyle = this.finColor;
    ctx.fill();

    // Body ellipse
    ctx.beginPath();
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.bodyColor;
    ctx.fill();

    // Dorsal fin
    ctx.beginPath();
    ctx.moveTo(hw * 0.15, -hh);
    ctx.lineTo(hw * 0.5, -hh - 10);
    ctx.lineTo(hw * 0.85, -hh);
    ctx.closePath();
    ctx.fillStyle = this.finColor;
    ctx.fill();

    // Pectoral fin
    ctx.beginPath();
    ctx.moveTo(hw * 0.1, 0);
    ctx.lineTo(hw * 0.35, hh + 8);
    ctx.lineTo(hw * 0.65, 0);
    ctx.closePath();
    ctx.fillStyle = this.finColor;
    ctx.fill();

    // Eye (left/head side)
    ctx.beginPath();
    ctx.arc(-hw + 11, -1, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-hw + 12, -1, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();

    // Body highlight stripe
    ctx.beginPath();
    ctx.moveTo(-hw * 0.3, -hh + 3);
    ctx.lineTo(-hw * 0.35, hh - 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.restore();
  }
}
