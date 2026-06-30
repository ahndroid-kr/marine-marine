// ─── Stage 5 assets ───────────────────────────────────────────────────────────
function _s5LoadImg(src) {
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

const _s5BgImg = _s5LoadImg('assets/images/bg_stage5.png');

// ─── Stage 5 (배경 확인용 — 몬스터/보스 로직 미포함) ─────────────────────────
const stage5 = {
  init() {},

  update(frame, canvas, enemies) {},

  updateBackground() {},

  drawBackground(ctx, canvas) {
    if (_s5BgImg.complete && _s5BgImg.naturalWidth > 0) {
      const iw     = Math.round(_s5BgImg.naturalWidth * (canvas.height / _s5BgImg.naturalHeight));
      const offset = -(GS.scrollX * 0.3) % iw;
      for (let x = offset; x < canvas.width + iw; x += iw)
        ctx.drawImage(_s5BgImg, x, 0, iw, canvas.height);
    } else {
      ctx.fillStyle = '#050a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  },
};
