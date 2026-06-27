const bgStage2Img = new Image();
bgStage2Img.src = 'assets/images/bg_stage2.png';

const stage2 = {
  wave:       'wave1',
  waveTimer:  0,
  spawnTimer: 0,
  midbossRef: null,
  bossRef:    null,
  warning:    null,

  init() {
    this.wave       = 'wave1';
    this.waveTimer  = 0;
    this.spawnTimer = 0;
    this.midbossRef = null;
    this.bossRef    = null;
    this.warning    = null;
  },

  _next(name) {
    this.wave       = name;
    this.waveTimer  = 0;
    this.spawnTimer = 0;
  },

  // ── wave1: 도미 1~2마리 개별 등장 (900 frames) ───────────────────────────
  _wave1(canvas, enemies) {
    if (this.spawnTimer >= 150) {
      this.spawnTimer = 0;
      enemies.push(new EnemyPorgy(canvas));
      // 40% 확률로 1마리 추가 (y 오프셋 다르게)
      if (Math.random() < 0.4) {
        const e2  = new EnemyPorgy(canvas);
        const uiH = Math.round(canvas.height * 0.085);
        const sbH = Math.round(canvas.height * 0.035);
        const off = canvas.height * 0.18 * (Math.random() > 0.5 ? 1 : -1);
        e2.y = Math.max(uiH + e2.h / 2,
               Math.min(canvas.height - sbH - e2.h / 2, e2.y + off));
        enemies.push(e2);
      }
    }
    if (this.waveTimer >= 900) this._next('wave2');
  },

  // ── wave2: 쥐치 + 도미 혼합 (900 frames) ─────────────────────────────────
  _wave2(canvas, enemies) {
    if (this.spawnTimer >= 180) {
      this.spawnTimer = 0;
      enemies.push(Math.random() < 0.5 ? new EnemyFilefish(canvas) : new EnemyPorgy(canvas));
    }
    if (this.waveTimer >= 900) this._next('wave3');
  },

  // ── wave3: 광어 교차 돌진 구간 (720 frames) ───────────────────────────────
  _wave3(canvas, enemies) {
    if (this.spawnTimer >= 240) {
      this.spawnTimer = 0;
      // 위아래 동시 한 쌍 소환
      const f1 = new EnemyFlounder(canvas);
      f1.fromTop = true;
      f1.y       = -f1.h;
      enemies.push(f1);

      const f2 = new EnemyFlounder(canvas);
      f2.fromTop = false;
      f2.y       = canvas.height + f2.h;
      f2.x       = f1.x - 60;
      enemies.push(f2);
    }
    if (this.waveTimer >= 720) this._next('wave4');
  },

  // ── wave4: 도미 + 쥐치 + 광어 혼합 (1080 frames) ─────────────────────────
  _wave4(canvas, enemies) {
    if (this.spawnTimer >= 150) {
      this.spawnTimer = 0;
      const r = Math.random();
      if      (r < 0.35) enemies.push(new EnemyPorgy(canvas));
      else if (r < 0.65) enemies.push(new EnemyFilefish(canvas));
      else               enemies.push(new EnemyFlounder(canvas));
    }
    if (this.waveTimer >= 1080) this._next('midboss');
  },

  // ── 중간보스: 바다거북 등장, 일반 스폰 유지 ──────────────────────────────
  _waveMidboss(canvas, enemies) {
    if (!this.midbossRef) {
      const turtle    = new MidbossTurtle(canvas);
      enemies.push(turtle);
      this.midbossRef = turtle;
    }
    // 중보스 살아있는 동안 가벼운 잡몹 스폰 유지
    if (this.spawnTimer >= 280) {
      this.spawnTimer = 0;
      enemies.push(Math.random() < 0.5 ? new EnemyPorgy(canvas) : new EnemyFilefish(canvas));
    }
    // 거북 사망 → wave5 전환 (update()에서 처리)
  },

  // ── wave5: 쥐치 + 광어 혼합 짧은 구간 (540 frames) ──────────────────────
  _wave5(canvas, enemies) {
    if (this.spawnTimer >= 200) {
      this.spawnTimer = 0;
      enemies.push(Math.random() < 0.5 ? new EnemyFilefish(canvas) : new EnemyFlounder(canvas));
    }
    if (this.waveTimer >= 540) this._next('boss_warn');
  },

  // ── 최종보스 WARNING (150 frames) ────────────────────────────────────────
  _waveBossWarn(canvas, enemies) {
    if (!this.warning) this.warning = { timer: 0 };
    this.warning.timer++;
    if (this.warning.timer >= 150) {
      const shark   = new BossShark(canvas);
      enemies.push(shark);
      this.bossRef  = shark;
      this.warning  = null;
      this._next('boss');
    }
  },

  // ── 최종보스 (BossShark 사망까지) ─────────────────────────────────────────
  _waveBoss(canvas, enemies) {
    // 아기상어 소환 큐 처리
    if (this.bossRef?.pendingSpawns?.length > 0) {
      enemies.push(...this.bossRef.pendingSpawns.splice(0));
    }
  },

  // ── main update ───────────────────────────────────────────────────────────
  update(frame, canvas, enemies) {
    // 최종보스 사망 → 스테이지 클리어
    if (this.bossRef && this.bossRef.dead) {
      GS.phase    = 'stageclear';
      this.bossRef = null;
      return;
    }

    // 중간보스 사망 감지
    if (this.midbossRef && this.midbossRef.dead) {
      this.midbossRef = null;
      if (this.wave === 'midboss') this._next('wave5');
    }

    this.waveTimer++;
    this.spawnTimer++;

    switch (this.wave) {
      case 'wave1':    this._wave1(canvas, enemies);     break;
      case 'wave2':    this._wave2(canvas, enemies);     break;
      case 'wave3':    this._wave3(canvas, enemies);     break;
      case 'wave4':    this._wave4(canvas, enemies);     break;
      case 'midboss':  this._waveMidboss(canvas, enemies); break;
      case 'wave5':    this._wave5(canvas, enemies);     break;
      case 'boss_warn':this._waveBossWarn(canvas, enemies); break;
      case 'boss':     this._waveBoss(canvas, enemies);  break;
    }
  },

  // ── draw: WARNING overlay ─────────────────────────────────────────────────
  draw(ctx, canvas) {
    if (this.wave !== 'boss_warn' || !this.warning) return;
    const isOn = Math.floor(this.warning.timer / 25) % 2 === 0;
    if (!isOn) return;

    ctx.save();
    ctx.fillStyle = 'rgba(90, 0, 0, 0.42)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fs = Math.round(Math.min(canvas.width, canvas.height) * 0.062);

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `${fs}px 'Press Start 2P', monospace`;
    ctx.fillStyle    = '#ff2222';
    ctx.shadowColor  = '#ff0000';
    ctx.shadowBlur   = 48;
    ctx.fillText('⚠  WARNING  ⚠', cx, cy);

    ctx.font      = `${Math.round(fs * 0.40)}px 'Press Start 2P', monospace`;
    ctx.fillStyle = '#ffaaaa';
    ctx.shadowBlur = 16;
    ctx.fillText('BOSS APPROACHING', cx, cy + Math.round(fs * 1.05));
    ctx.restore();
  },
};
