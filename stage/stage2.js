const stage2 = {
  spawnTimer: 0,

  init() {
    this.spawnTimer = 0;
  },

  update(frame, canvas, enemies) {
    this.spawnTimer++;
    const interval = Math.max(80, 160 - Math.floor(GS.score / 800) * 5);
    if (this.spawnTimer < interval) return;

    this.spawnTimer = 0;
    const roll = Math.random();
    let e;
    if (roll < 0.40) {
      e = new EnemyPorgy(canvas);
    } else if (roll < 0.75) {
      e = new EnemyFilefish(canvas);
    } else {
      e = new EnemyFlounder(canvas);
    }
    enemies.push(e);

    // 점수 1200 이상이면 50% 확률로 추가 스폰
    if (GS.score > 1200 && Math.random() < 0.5) {
      const roll2 = Math.random();
      let e2;
      if (roll2 < 0.40) {
        e2 = new EnemyPorgy(canvas);
      } else if (roll2 < 0.75) {
        e2 = new EnemyFilefish(canvas);
      } else {
        e2 = new EnemyFlounder(canvas);
      }
      enemies.push(e2);
    }
  },

  draw(ctx, canvas) {},
};
