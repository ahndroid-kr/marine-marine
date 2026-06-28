// ─── Background decorative objects ────────────────────────────────────────────
// Shared by all stages. No collision. Rendered behind gameplay objects.

const _decoImgs = (function () {
  const names = [
    'deco_jellyfish_1', 'deco_jellyfish_2',
    'deco_bubble_1',    'deco_bubble_2',
    'deco_fish_group_1','deco_fish_group_2',
  ];
  const map = {};
  for (const n of names) {
    const img = new Image();
    img.src = `assets/images/${n}.png`;
    map[n] = img;
  }
  return map;
}());

// Natural asset sizes in pixels (reference at canvas.height === 600)
const _DECO_NAT = {
  deco_jellyfish_1:  { w: 48,  h: 48  },
  deco_jellyfish_2:  { w: 36,  h: 42  },
  deco_bubble_1:     { w: 36,  h: 94  },
  deco_bubble_2:     { w: 96,  h: 48  },
  deco_fish_group_1: { w: 128, h: 56  },
  deco_fish_group_2: { w: 96,  h: 48  },
};

// move: 'rtl' right→left  |  'ltr' left→right  |  'up' bottom→top
const _DECO_POOL_DEF = [
  { key: 'deco_jellyfish_1',  max: 2, move: 'rtl', wobble: true  },
  { key: 'deco_jellyfish_2',  max: 2, move: 'rtl', wobble: true  },
  { key: 'deco_bubble_1',     max: 2, move: 'up',  wobble: false },
  { key: 'deco_bubble_2',     max: 2, move: 'up',  wobble: false },
  { key: 'deco_fish_group_1', max: 1, move: 'rtl', wobble: false },
  { key: 'deco_fish_group_2', max: 1, move: 'ltr', wobble: false },
];

let _decos = [];

function _spawnDeco(key, move, wobble, canvas, scatter) {
  const nat   = _DECO_NAT[key];
  const sc    = canvas.height / 600;
  const dw    = Math.round(nat.w * sc);
  const dh    = Math.round(nat.h * sc);
  const uiH   = Math.round(canvas.height * 0.085);
  const sbH   = Math.round(canvas.height * 0.035);
  const zoneH = canvas.height - uiH - sbH;

  let x, y, vx, vy;

  if (move === 'up') {
    // bubbles: slow rise, random x
    const spd = (0.12 + Math.random() * 0.18) * sc;
    x  = Math.random() * canvas.width;
    y  = scatter ? Math.random() * canvas.height : canvas.height + dh;
    vx = 0;
    vy = -spd;
  } else if (move === 'rtl') {
    // jellyfish / fish_group_1: right → left
    const spd = key.startsWith('deco_fish')
      ? (0.45 + Math.random() * 0.45) * sc   // fish move a bit faster
      : (0.20 + Math.random() * 0.30) * sc;  // jellyfish slow
    x  = scatter ? Math.random() * canvas.width : canvas.width + dw;
    y  = uiH + Math.random() * zoneH;
    vx = -spd;
    vy = 0;
  } else {
    // fish_group_2: left → right
    const spd = (0.35 + Math.random() * 0.45) * sc;
    x  = scatter ? Math.random() * canvas.width : -dw;
    y  = uiH + Math.random() * zoneH;
    vx = spd;
    vy = 0;
  }

  return { key, move, wobble, x, y, vx, vy, dw, dh, t: Math.random() * Math.PI * 2 };
}

function initDecos(canvas) {
  _decos = [];
  for (const { key, max, move, wobble } of _DECO_POOL_DEF) {
    for (let i = 0; i < max; i++) {
      _decos.push(_spawnDeco(key, move, wobble, canvas, true));
    }
  }
}

function updateDecos(canvas) {
  const sc    = canvas.height / 600;
  const uiH   = Math.round(canvas.height * 0.085);
  const sbH   = Math.round(canvas.height * 0.035);
  const zoneH = canvas.height - uiH - sbH;

  for (const d of _decos) {
    d.t += 0.025;
    d.x += d.vx;
    d.y += d.vy;

    if (d.wobble) {
      // Jellyfish: gentle horizontal sway + slight vertical bob
      d.x += Math.sin(d.t * 0.8) * 0.35 * sc;
      d.y += Math.sin(d.t * 1.3) * 0.28 * sc;
    }

    // Wrap / respawn off-screen
    if (d.move === 'up' && d.y < -d.dh) {
      d.x = Math.random() * canvas.width;
      d.y = canvas.height + d.dh;
    } else if (d.move === 'rtl' && d.x < -d.dw) {
      d.x = canvas.width + d.dw;
      d.y = uiH + Math.random() * zoneH;
    } else if (d.move === 'ltr' && d.x > canvas.width + d.dw) {
      d.x = -d.dw;
      d.y = uiH + Math.random() * zoneH;
    }
  }
}

function drawDecos(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.70;
  for (const d of _decos) {
    const img = _decoImgs[d.key];
    if (!img.complete || !img.naturalWidth) continue;
    ctx.drawImage(img, Math.round(d.x - d.dw / 2), Math.round(d.y - d.dh / 2), d.dw, d.dh);
  }
  ctx.restore();
}
