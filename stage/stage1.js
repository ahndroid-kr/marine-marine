const stage1 = {
  spawnTimer: 0,
  midbossSpawned: false,
  bossSpawned: false,
  warning: null,   // { type: 'midboss'|'boss', timer }
  bossRef: null,   // reference to live boss enemy

  init() {
    this.spawnTimer = 0;
    this.midbossSpawned = false;
    this.bossSpawned = false;
    this.warning = null;
    this.bossRef = null;
  },

  update(frame, canvas, enemies) {
    // 1. Detect boss death
    if (this.bossRef && this.bossRef.dead) {
      if (this.bossRef instanceof BossPuffer) GS.phase = 'stageclear';
      this.bossRef = null;
    }

    // 2. Trigger warning (only when no boss alive and no warning running)
    if (!this.midbossSpawned && !this.warning && !this.bossRef && frame >= 1800) {
      this.midbossSpawned = true;
      this.warning = { type: 'midboss', timer: 0 };
    }
    if (!this.bossSpawned && !this.warning && !this.bossRef && frame >= 4800) {
      this.bossSpawned = true;
      this.warning = { type: 'boss', timer: 0 };
    }

    // 3. Suspend normal spawning while boss is alive
    if (this.bossRef) return;

    // 4. Warning countdown — suspend spawning here too
    if (this.warning) {
      this.warning.timer++;
      if (this.warning.timer >= 150) {
        const boss = this.warning.type === 'midboss'
          ? new MidbossRay(canvas)
          : new BossPuffer(canvas);
        enemies.push(boss);
        this.bossRef = boss;
        this.warning = null;
      }
      return;
    }

    // 5. Normal enemy spawning
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

  // WARNING overlay
  draw(ctx, canvas) {
    if (!this.warning) return;
    const isOn = Math.floor(this.warning.timer / 25) % 2 === 0;
    if (!isOn) return;

    ctx.save();
    ctx.fillStyle = 'rgba(90, 0, 0, 0.42)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fs = Math.round(Math.min(canvas.width, canvas.height) * 0.09);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fs}px monospace`;
    ctx.fillStyle = '#ff2222';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 48;
    ctx.fillText('⚠  WARNING  ⚠', cx, cy);

    ctx.font = `bold ${Math.round(fs * 0.33)}px monospace`;
    ctx.fillStyle = '#ffaaaa';
    ctx.shadowBlur = 16;
    ctx.fillText('BOSS APPROACHING', cx, cy + Math.round(fs * 0.85));
    ctx.restore();
  },
};
