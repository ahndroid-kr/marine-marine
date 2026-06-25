const stage1 = {
  spawnTimer: 0,

  init() {
    this.spawnTimer = 0;
  },

  update(frame, canvas, enemies) {
    this.spawnTimer++;
    const interval = Math.max(38, 85 - Math.floor(GS.score / 400) * 4);
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      enemies.push(new Enemy(canvas));
      // Double spawn at higher scores
      if (GS.score > 800 && Math.random() < 0.35) {
        const e2 = new Enemy(canvas);
        e2.y = Math.max(60, Math.min(canvas.height - 60, e2.y + (Math.random() > 0.5 ? 85 : -85)));
        enemies.push(e2);
      }
    }
  },
};
