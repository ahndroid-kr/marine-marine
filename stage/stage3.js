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
  _inited: false,

  init() {
    this._inited = false;
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

  update(frame, canvas, enemies) {
    this.updateBackground(canvas);
    // enemies: not yet implemented
  },

  draw(ctx, canvas) {
    // no overlays for now
  },
};
