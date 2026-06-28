const CACHE = 'marine-marine-v10';

const PRECACHE = [
  './',
  './index.html',
  './gameState.js',
  './effects.js',
  './player.js',
  './enemy.js',
  './boss.js',
  './bullet.js',
  './item.js',
  './pet.js',
  './ui.js',
  './stageTransition.js',
  './deco.js',
  './stage/stage1.js',
  './stage/stage2.js',
  './stage/stage3.js',
  './main.js',
  './manifest.json',
  './assets/images/bg_stage1.png',
  './assets/images/bg_stage2.png',
  './assets/images/bg_stage3.png',
  './assets/images/bg_stage3_deco.png',
  './assets/images/player.png',
  './assets/images/ui_heart.png',
  './assets/images/boss_puffer_1.png',
  './assets/images/boss_puffer_2.png',
  './assets/images/boss_puffer_dead.png',
  './assets/images/boss_shark_1.png',
  './assets/images/boss_shark_2.png',
  './assets/images/boss_shark_dead.png',
  './assets/images/boss_shark_minion.png',
  './assets/images/midboss_ray.png',
  './assets/images/midboss_turtle.png',
  './assets/images/bullet_turtle_shell.png',
  './assets/images/bullet_bubble.png',
  './assets/images/bullet_bubble_large.png',
  './assets/images/enemy_squid.png',
  './assets/images/enemy_shrimp.png',
  './assets/images/enemy_hairtail.png',
  './assets/images/enemy_porgy.png',
  './assets/images/enemy_filefish.png',
  './assets/images/enemy_flounder.png',
  './assets/images/item_life.png',
  './assets/images/item_star_blue.png',
  './assets/images/item_star_green.png',
  './assets/images/item_star_pink.png',
  './assets/images/item_star_red.png',
  './assets/images/item_star_yellow.png',
  './assets/images/pet.png',
  './assets/images/plant_00.png',
  './assets/images/plant_01.png',
  './assets/images/plant_02.png',
  './assets/images/plant_03.png',
  './assets/images/plant_04.png',
  './assets/images/deco_bubble_1.png',
  './assets/images/deco_bubble_2.png',
  './assets/images/deco_jellyfish_1.png',
  './assets/images/deco_jellyfish_2.png',
  './assets/images/deco_fish_group_1.png',
  './assets/images/deco_fish_group_2.png',
  './assets/images/effect_boss_hit.png',
  './assets/images/effect_angry.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for assets, network-first for HTML/JS
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isAsset = url.pathname.includes('/assets/');
  if (isAsset) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  } else {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
