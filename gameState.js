const QA_MODE = true;

const GS = {
  score: 0,
  lives: 3,
  stageNum: 1,
  phase: 'title', // 'title' | 'playing' | 'stageclear' | 'gameover'
  scrollX: 0,
  scrollSpeed: 1.5,
  powerLevel: 0,   // 0-3
  shield: 0,        // 0-2
  petCount: 0,      // 0-2
  invincible: 0,    // countdown frames (300 = 5 s)
  giant: false,
  clearTimer: 0,    // frames elapsed on stageclear screen
};
