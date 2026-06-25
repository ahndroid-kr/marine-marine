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
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 32;
    this.type = type || STAR_TYPES[Math.floor(Math.random() * STAR_TYPES.length)];
    this.dead = false;
    this.vx = -(Math.random() * 0.8 + 1);
    this.t = Math.random() * Math.PI * 2;
  }

  update() {
    this.x += this.vx;
    this.t += 0.07;
    this.y += Math.sin(this.t) * 0.8;
    if (this.x < -60) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'life') {
      if (itemLifeImg.complete && itemLifeImg.naturalWidth > 0) {
        ctx.drawImage(itemLifeImg, -16, -16, 32, 32);
      } else {
        ctx.fillStyle = '#ff3355';
        ctx.shadowColor = '#ff3355';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', 0, 1);
      }
    } else {
      const img = itemImgs[this.type];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -16, -16, 32, 32);
      }
    }

    ctx.restore();
  }
}
