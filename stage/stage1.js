const stage1 = {
  spawnTimer: 0,
  midbossSpawned: false,
  bossSpawned: false,
  warning: null,   // { type: 'midboss'|'boss', timer: 0 }

  init() {
    this.spawnTimer = 0;
    this.midbossSpawned = false;
    this.bossSpawned = false;
    this.warning = null;
  },

  update(frame, canvas, enemies) {
    // Trigger midboss warning
    if (!this.midbossSpawned && !this.warning && frame >= 1800) {
      this.midbossSpawned = true;
      this.warning = { type: 'midboss', timer: 0 };
    }
    // Trigger final boss warning
    if (!this.bossSpawned && !this.warning && frame >= 4800) {
      this.bossSpawned = true;
      this.warning = { type: 'boss', timer: 0 };
    }

    // Warning countdown — pause normal spawning during this
    if (this.warning) {
      this.warning.timer++;
      if (this.warning.timer >= 150) {   // 150 frames ≈ 2.5 s
        if (this.warning.type === 'midboss') enemies.push(new MidbossRay(canvas));
        else                                enemies.push(new BossPuffer(canvas));
        this.warning = null;
      }
      return;
    }

    // Normal enemy spawning
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

  // WARNING overlay — called from main draw()
  draw(ctx, canvas) {
    if (!this.warning) return;

    const t = this.warning.timer;
    // Blink: 25 frames ON, 25 frames OFF → 3 full blinks in 150 frames
    const isOn = Math.floor(t / 25) % 2 === 0;
    if (!isOn) return;

    ctx.save();

    // Dark red vignette
    ctx.fillStyle = 'rgba(90, 0, 0, 0.42)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fs = Math.round(Math.min(canvas.width, canvas.height) * 0.09);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Main WARNING text
    ctx.font = `bold ${fs}px monospace`;
    ctx.fillStyle = '#ff2222';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 48;
    ctx.fillText('⚠  WARNING  ⚠', cx, cy);

    // Subtitle
    ctx.font = `bold ${Math.round(fs * 0.33)}px monospace`;
    ctx.fillStyle = '#ffaaaa';
    ctx.shadowBlur = 16;
    ctx.fillText('BOSS APPROACHING', cx, cy + Math.round(fs * 0.85));

    ctx.restore();
  },
};
