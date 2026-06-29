// ─── Stage 3 assets (GPU pre-warm) ───────────────────────────────────────────
function _s3LoadImg(src) {
  const img = new Image();
  img.src = src;
  img.decode().then(() => {
    const tmp = document.createElement('canvas');
    tmp.width  = img.naturalWidth  || 2;
    tmp.height = img.naturalHeight || 2;
    tmp.getContext('2d').drawImage(img, 0, 0);
  }).catch(() => {});
  return img;
}

const _s3BgImg   = _s3LoadImg('assets/images/bg_stage3.png');
const _s3DecoImg = _s3LoadImg('assets/images/bg_stage3_deco.png');

// ─── Glow particles ───────────────────────────────────────────────────────────
const _S3_COLORS = ['#FFD700', '#00CFFF'];
const _S3_COUNT  = 35;
const _s3Ptcls   = [];

function _s3MakePtcl(canvas, randomY) {
  const h = canvas ? canvas.height : 540;
  const w = canvas ? canvas.width  : 960;
  return {
    x:     Math.random() * w,
    y:     randomY ? Math.random() * h : h + 4,
    r:     2 + Math.random() * 2,
    alpha: 0.3 + Math.random() * 0.6,
    spd:   0.3 + Math.random() * 0.7,
    color: _S3_COLORS[Math.floor(Math.random() * _S3_COLORS.length)],
  };
}

function _s3InitPtcls(canvas) {
  _s3Ptcls.length = 0;
  for (let i = 0; i < _S3_COUNT; i++) _s3Ptcls.push(_s3MakePtcl(canvas, true));
}

function _s3UpdatePtcls(canvas) {
  for (let i = 0; i < _s3Ptcls.length; i++) {
    _s3Ptcls[i].y -= _s3Ptcls[i].spd;
    if (_s3Ptcls[i].y < -_s3Ptcls[i].r * 2) _s3Ptcls[i] = _s3MakePtcl(canvas, false);
  }
  while (_s3Ptcls.length < _S3_COUNT) _s3Ptcls.push(_s3MakePtcl(canvas, false));
}

function _s3DrawPtcls(ctx) {
  ctx.save();
  for (const p of _s3Ptcls) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ─── Stage 3 ──────────────────────────────────────────────────────────────────
const stage3 = {
  _inited:    false,
  wave:       'wave1',
  waveTimer:  0,
  spawnTimer: 0,
  midbossRef: null,
  bossRef:    null,
  warning:    null,  // { timer, type: 'midboss' | 'boss' }

  init() {
    this._inited    = false;
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

  _spawnKrillGroup(canvas, enemies) {
    const count   = 5 + Math.floor(Math.random() * 2);
    const uiH     = Math.round(canvas.height * 0.085);
    const sbH     = Math.round(canvas.height * 0.035);
    const lift    = Math.round(canvas.height * 0.080);
    const floorY  = canvas.height - sbH - lift - Math.round(canvas.height * 0.120);
    const krillH  = Math.round(canvas.height * 0.044);
    const maxCY   = floorY - krillH / 2;
    const baseY   = uiH + krillH / 2 + Math.random() * Math.max(0, maxCY - krillH / 2 - uiH);
    for (let i = 0; i < count; i++) {
      const rawY = baseY + (Math.random() - 0.5) * canvas.height * 0.25;
      const k = new EnemyKrill(canvas, Math.max(uiH + krillH / 2, Math.min(maxCY, rawY)));
      k.x += i * 22;
      enemies.push(k);
    }
  },

  // ── wave1: 거미게 + 블랙스모커 (900f) ────────────────────────────────────
  _wave1(canvas, enemies) {
    if (this.spawnTimer >= 200) {
      this.spawnTimer = 0;
      enemies.push(Math.random() < 0.5 ? new EnemySpiderCrab(canvas) : new EnemyBlackSmoker(canvas));
    }
    if (this.waveTimer >= 1170) this._next('wave2');
  },

  // ── wave2: 초롱아귀 등장 (936f) ──────────────────────────────────────────
  _wave2(canvas, enemies) {
    if (this.spawnTimer >= 180) {
      this.spawnTimer = 0;
      enemies.push(new EnemyAnglerfish(canvas));
    }
    if (this.waveTimer >= 936) this._next('wave3');
  },

  // ── wave3: 거미게 + 초롱아귀 혼합 (1170f) ────────────────────────────────
  _wave3(canvas, enemies) {
    if (this.spawnTimer >= 200) {
      this.spawnTimer = 0;
      enemies.push(Math.random() < 0.5 ? new EnemySpiderCrab(canvas) : new EnemyAnglerfish(canvas));
    }
    if (this.waveTimer >= 1170) this._next('wave4');
  },

  // ── wave4: 크릴새우떼 돌진 (624f) ────────────────────────────────────────
  _wave4(canvas, enemies) {
    if (this.spawnTimer >= 240) {
      this.spawnTimer = 0;
      this._spawnKrillGroup(canvas, enemies);
    }
    if (this.waveTimer >= 624) this._next('wave5');
  },

  // ── wave5: 전체 혼합 (1170f) ──────────────────────────────────────────────
  _wave5(canvas, enemies) {
    if (this.spawnTimer >= 180) {
      this.spawnTimer = 0;
      const r = Math.random();
      if      (r < 0.30) enemies.push(new EnemySpiderCrab(canvas));
      else if (r < 0.55) enemies.push(new EnemyAnglerfish(canvas));
      else if (r < 0.70) enemies.push(new EnemyBlackSmoker(canvas));
      else               this._spawnKrillGroup(canvas, enemies);
    }
    if (this.waveTimer >= 1170) this._next('midboss_warn');
  },

  // ── 중간보스 WARNING (150f) ───────────────────────────────────────────────
  _waveMidbossWarn(canvas, enemies) {
    if (!this.warning) this.warning = { timer: 0, type: 'midboss' };
    this.warning.timer++;
    if (this.warning.timer >= 150) {
      const sunfish   = new MidbossSunfish(canvas);
      enemies.push(sunfish);
      this.midbossRef = sunfish;
      this.warning    = null;
      this._next('midboss');
    }
  },

  // ── 중간보스: 개복치 (일반 스폰 중단) ────────────────────────────────────
  _waveMidboss(canvas, enemies) {
    // 일반 몬스터 스폰 없음 — midbossRef 사망 시 update()에서 wave6 전환
  },

  // ── wave6: 초롱아귀 + 크릴새우 단기 (540f) ───────────────────────────────
  _wave6(canvas, enemies) {
    if (this.spawnTimer >= 200) {
      this.spawnTimer = 0;
      if (Math.random() < 0.5) enemies.push(new EnemyAnglerfish(canvas));
      else                     this._spawnKrillGroup(canvas, enemies);
    }
    if (this.waveTimer >= 702) this._next('boss_warn');
  },

  // ── 최종보스 WARNING (150f) ───────────────────────────────────────────────
  _waveBossWarn(canvas, enemies) {
    if (!this.warning) this.warning = { timer: 0, type: 'boss' };
    this.warning.timer++;
    if (this.warning.timer >= 150) {
      const witch  = new BossWitch(canvas);
      enemies.push(witch);
      this.bossRef = witch;
      this.warning = null;
      this._next('boss');
    }
  },

  // ── 최종보스 (BossWitch 사망까지) ─────────────────────────────────────────
  _waveBoss(canvas, enemies) {
    // pendingSpawns(소환 오징어)는 main.js에서 일괄 처리
  },

  // Called from main.js stageclear block too, so particles stay alive during last-stage clear
  updateBackground(canvas) {
    if (!this._inited) { _s3InitPtcls(canvas); this._inited = true; }
    _s3UpdatePtcls(canvas);
  },

  // Replaces standard drawBg() — layer 1: bg, layer 2: deco (1.5× scroll)
  drawBackground(ctx, canvas) {
    if (_s3BgImg.complete && _s3BgImg.naturalWidth > 0) {
      const iw     = Math.round(_s3BgImg.naturalWidth * (canvas.height / _s3BgImg.naturalHeight));
      const offset = -(GS.scrollX * 0.3) % iw;
      for (let x = offset; x < canvas.width + iw; x += iw) ctx.drawImage(_s3BgImg,   x, 0, iw, canvas.height);
    } else {
      ctx.fillStyle = '#0a0820';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (_s3DecoImg.complete && _s3DecoImg.naturalWidth > 0) {
      const iw     = Math.round(_s3DecoImg.naturalWidth * (canvas.height / _s3DecoImg.naturalHeight));
      const offset = -(GS.scrollX * 0.45) % iw;  // 1.5× faster than bg (0.3 × 1.5)
      for (let x = offset; x < canvas.width + iw; x += iw) ctx.drawImage(_s3DecoImg, x, 0, iw, canvas.height);
    }
  },

  // Drawn after drawBackground, before game objects
  drawGlowParticles(ctx) {
    _s3DrawPtcls(ctx);
  },

  // ── main update ───────────────────────────────────────────────────────────
  update(frame, canvas, enemies) {
    this.updateBackground(canvas);

    if (this.bossRef && this.bossRef.dead) {
      GS.phase     = 'stageclear';
      this.bossRef = null;
      return;
    }

    if (this.midbossRef && this.midbossRef.dead) {
      this.midbossRef = null;
      if (this.wave === 'midboss') this._next('wave6');
    }

    this.waveTimer++;
    this.spawnTimer++;

    switch (this.wave) {
      case 'wave1':        this._wave1(canvas, enemies);           break;
      case 'wave2':        this._wave2(canvas, enemies);           break;
      case 'wave3':        this._wave3(canvas, enemies);           break;
      case 'wave4':        this._wave4(canvas, enemies);           break;
      case 'wave5':        this._wave5(canvas, enemies);           break;
      case 'midboss_warn': this._waveMidbossWarn(canvas, enemies); break;
      case 'midboss':      this._waveMidboss(canvas, enemies);     break;
      case 'wave6':        this._wave6(canvas, enemies);           break;
      case 'boss_warn':    this._waveBossWarn(canvas, enemies);    break;
      case 'boss':         this._waveBoss(canvas, enemies);        break;
    }
  },

  // ── draw: WARNING overlay ─────────────────────────────────────────────────
  draw(ctx, canvas) {
    const isWarnWave = this.wave === 'midboss_warn' || this.wave === 'boss_warn';
    if (!isWarnWave || !this.warning) return;

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

    const sub = this.warning.type === 'boss' ? 'BOSS APPROACHING' : 'MID BOSS APPROACHING';
    ctx.font      = `${Math.round(fs * 0.40)}px 'Press Start 2P', monospace`;
    ctx.fillStyle = '#ffaaaa';
    ctx.shadowBlur = 16;
    ctx.fillText(sub, cx, cy + Math.round(fs * 1.05));
    ctx.restore();
  },
};
