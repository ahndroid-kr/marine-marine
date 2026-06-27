const stage1 = {
  spawnTimer: 0,
  midbossSpawned: false,
  bossSpawned: false,
  warning: null,      // { type: 'boss', timer } — final boss only
  bossRef: null,      // reference to live final boss
  midbossRef: null,   // reference to live mid-boss

  init() {
    this.spawnTimer = 0;
    this.midbossSpawned = false;
    this.bossSpawned = false;
    this.warning = null;
    this.bossRef = null;
    this.midbossRef = null;
  },

  update(frame, canvas, enemies) {
    // 1. Detect final boss death
    if (this.bossRef && this.bossRef.dead) {
      if (this.bossRef instanceof BossPuffer) GS.phase = 'stageclear';
      this.bossRef = null;
    }
    // Track midboss death
    if (this.midbossRef && this.midbossRef.dead) this.midbossRef = null;

    // 2. Spawn midboss directly at frame 2700 — no WARNING, normal spawning continues
    if (!this.midbossSpawned && frame >= 2700) {
      this.midbossSpawned = true;
      const midboss = new MidbossRay(canvas);
      enemies.push(midboss);
      this.midbossRef = midboss;
    }

    // 3. Trigger WARNING for final boss only (no midboss alive required)
    if (!this.bossSpawned && !this.warning && !this.bossRef && frame >= 4800) {
      this.bossSpawned = true;
      this.warning = { type: 'boss', timer: 0 };
    }

    // 4. Suspend normal spawning only while final boss is alive
    if (this.bossRef) return;

    // 5. Warning countdown for final boss — suspend spawning
    if (this.warning) {
      this.warning.timer++;
      if (this.warning.timer >= 150) {
        const boss = new BossPuffer(canvas);
        enemies.push(boss);
        this.bossRef = boss;
        this.warning = null;
      }
      return;
    }

    // 6. Normal enemy spawning (runs even while midboss is alive)
    this.spawnTimer++;
    const interval = Math.max(54, 122 - Math.floor(GS.score / 400) * 6);
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

  // WARNING overlay — final boss only
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
