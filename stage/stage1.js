const stage1 = {
  spawnTimer: 0,
  midbossSpawned: false,
  bossSpawned: false,

  init() {
    this.spawnTimer = 0;
    this.midbossSpawned = false;
    this.bossSpawned = false;
  },

  update(frame, canvas, enemies) {
    if (!this.midbossSpawned && frame >= 1800) {
      this.midbossSpawned = true;
      enemies.push(new MidbossRay(canvas));
    }
    if (!this.bossSpawned && frame >= 4800) {
      this.bossSpawned = true;
      enemies.push(new BossPuffer(canvas));
    }

    this.spawnTimer++;
    const interval = Math.max(38, 85 - Math.floor(GS.score / 400) * 4);
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      const types = ['squid', 'shrimp', 'hairtail'];
      enemies.push(new Enemy(canvas, types[Math.floor(Math.random() * types.length)]));
      if (GS.score > 800 && Math.random() < 0.35) {
        const type2 = types[Math.floor(Math.random() * types.length)];
        const e2 = new Enemy(canvas, type2);
        e2.y = Math.max(60, Math.min(canvas.height - 60, e2.y + (Math.random() > 0.5 ? 85 : -85)));
        enemies.push(e2);
      }
    }
  },
};
