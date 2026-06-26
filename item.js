const itemImgs = {};
['red', 'blue', 'pink', 'green', 'yellow'].forEach(c => {
  itemImgs[c] = new Image();
  itemImgs[c].src = `assets/images/item_star_${c}.png`;
});
const itemLifeImg = new Image();
itemLifeImg.src = 'assets/images/item_life.png';

const STAR_TYPES = ['red', 'blue', 'pink', 'green', 'yellow'];

class Item {
  constructor(x, y, type) {
    this.x    = x;
    this.y    = y;
    this.type = type || STAR_TYPES[Math.floor(Math.random() * STAR_TYPES.length)];
    this.dead = false;
    const s   = canvas.height / 600;
    this.vx   = -(Math.random() * 0.8 + 1) * s;
    this.t    = Math.random() * Math.PI * 2;
  }

  // canvas is the global from main.js
  get w() { return Math.round(canvas.height * 0.053); }
  get h() { return Math.round(canvas.height * 0.053); }

  update() {
    const s = canvas.height / 600;
    this.x += this.vx;
    this.t += 0.07;
    this.y += Math.sin(this.t) * 0.8 * s;
    if (this.x < -(this.w + 20)) this.dead = true;
  }

  draw(ctx) {
    const hw = this.w / 2;
    const hh = this.h / 2;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'life') {
      if (itemLifeImg.complete && itemLifeImg.naturalWidth > 0) {
        ctx.drawImage(itemLifeImg, -hw, -hh, this.w, this.h);
      } else {
        ctx.fillStyle = '#ff3355';
        ctx.shadowColor = '#ff3355';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, hw, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(this.w * 0.6)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', 0, 1);
      }
    } else {
      const img = itemImgs[this.type];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -hw, -hh, this.w, this.h);
      }
    }
    ctx.restore();
  }
}
