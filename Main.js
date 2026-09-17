const app = document.querySelector('#app');

const STORAGE = {
  profile: 'levelup-fitness-profile-v2',
  history: 'levelup-fitness-history-v2',
  settings: 'levelup-fitness-settings-v2',
};

const defaults = {
  profile: {
    name: 'Apex',
    level: 1,
    xp: 0,
    streak: 0,
    coins: 0,
    badge: 'Rookie',
    wins: 0,
  },
  settings: {
    music: true,
    sound: true,
  },
  history: [],
};

const plans = [
  {
    id: 'rebuild',
    title: 'Rebuild Protocol',
    difficulty: 'Easy → Moderate',
    duration: 18,
    reward: 160,
    accent: '#67e8f9',
    steps: [
      { type: 'warmup', name: 'Mobility Wake-Up', duration: 4, cue: 'Loosen hips, shoulders, and spine.', icon: 'warmup' },
      { type: 'exercise', name: 'March in Place', sets: 2, reps: 20, cue: 'Tall posture and relaxed arms.', icon: 'march' },
      { type: 'exercise', name: 'Bodyweight Squat', sets: 2, reps: 12, cue: 'Sit back, chest up, slow control.', icon: 'squat' },
      { type: 'exercise', name: 'Wall Push-Up', sets: 2, reps: 10, cue: 'Keep the body in a straight line.', icon: 'pushup' },
      { type: 'exercise', name: 'Glute Bridge', sets: 2, reps: 12, cue: 'Squeeze glutes at the top.', icon: 'bridge' },
      { type: 'exercise', name: 'Bird Dog', sets: 2, reps: 8, cue: 'Move slow and steady.', icon: 'birddog' },
      { type: 'cooldown', name: 'Cooldown Reset', duration: 4, cue: 'Let the heart rate settle.', icon: 'cooldown' },
      { type: 'breath', name: 'Breathing Reset', duration: 3, cue: 'Breathe in for 4, out for 6.', icon: 'breath' },
    ],
  },
  {
    id: 'power',
    title: 'Power Quest',
    difficulty: 'Moderate',
    duration: 24,
    reward: 220,
    accent: '#f59e0b',
    steps: [
      { type: 'warmup', name: 'Dynamic Warm-Up', duration: 5, cue: 'Activate joints and increase blood flow.', icon: 'warmup' },
      { type: 'exercise', name: 'Reverse Lunge', sets: 3, reps: 8, cue: 'Drive through the front heel.', icon: 'lunge' },
      { type: 'exercise', name: 'Hip Hinge', sets: 3, reps: 10, cue: 'Neutral spine and soft knees.', icon: 'hinge' },
      { type: 'exercise', name: 'Calf Raise', sets: 3, reps: 15, cue: 'Use a slow, full range of motion.', icon: 'calf' },
      { type: 'exercise', name: 'Dead Bug', sets: 2, reps: 8, cue: 'Keep your lower back down.', icon: 'deadbug' },
      { type: 'exercise', name: 'Mountain Climber', sets: 2, reps: 10, cue: 'Stay controlled and low.', icon: 'climber' },
      { type: 'cooldown', name: 'Recovery Phase', duration: 4, cue: 'Smooth breathing and easy stretching.', icon: 'cooldown' },
      { type: 'breath', name: 'Breathing Reset', duration: 3, cue: 'Slow exhale to calm the nervous system.', icon: 'breath' },
    ],
  },
  {
    id: 'recovery',
    title: 'Recovery Flow',
    difficulty: 'Low Impact',
    duration: 12,
    reward: 120,
    accent: '#34d399',
    steps: [
      { type: 'warmup', name: 'Gentle Wake-Up', duration: 3, cue: 'Wake the body gently without strain.', icon: 'warmup' },
      { type: 'exercise', name: 'Chair Sit-to-Stand', sets: 2, reps: 10, cue: 'Stand and sit under control.', icon: 'chair' },
      { type: 'exercise', name: 'Wall Sit Hold', sets: 2, reps: 25, cue: 'Breathe while maintaining posture.', icon: 'wallsit' },
      { type: 'exercise', name: 'Seated Twist', sets: 2, reps: 8, cue: 'Rotate gently and avoid forcing range.', icon: 'twist' },
      { type: 'exercise', name: 'Standing Stretch', duration: 3, cue: 'Lengthen the lowers and upper back.', icon: 'stretch' },
      { type: 'breath', name: 'Breathing Reset', duration: 4, cue: 'Longer exhale for recovery and calm.', icon: 'breath' },
    ],
  },
];

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const state = {
  profile: load(STORAGE.profile, defaults.profile),
  history: load(STORAGE.history, defaults.history),
  settings: load(STORAGE.settings, defaults.settings),
  activePlan: null,
  stepIndex: 0,
  timer: 0,
  timerId: null,
  sessionComplete: false,
};

function getLevelInfo(xp) {
  const level = Math.max(1, 1 + Math.floor(xp / 250));
  const xpIntoLevel = xp % 250;
  return {
    level,
    xpIntoLevel,
    progress: (xpIntoLevel / 250) * 100,
  };
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function awardXp(amount) {
  state.profile.xp += amount;
  state.profile.coins += Math.max(10, Math.floor(amount / 5));
  const lvl = getLevelInfo(state.profile.xp);
  state.profile.level = lvl.level;
  state.profile.badge = lvl.level >= 4 ? 'Elite Adventurer' : lvl.level >= 2 ? 'Rising Hero' : 'Rookie';
  save(STORAGE.profile, state.profile);
}

function updateProfileSummary() {
  const { level, progress } = getLevelInfo(state.profile.xp);
  state.profile.level = level;

  const levelNode = document.querySelector('[data-role="level"]');
  const xpNode = document.querySelector('[data-role="xp"]');
  const streakNode = document.querySelector('[data-role="streak"]');
  const coinNode = document.querySelector('[data-role="coins"]');
  const barNode = document.querySelector('[data-role="xp-bar"]');
  const nameNode = document.querySelector('[data-role="player-name"]');

  if (levelNode) levelNode.textContent = `Level ${level}`;
  if (xpNode) xpNode.textContent = `${state.profile.xp} XP`;
  if (streakNode) streakNode.textContent = `${state.profile.streak} day streak`;
  if (coinNode) coinNode.textContent = `${state.profile.coins} coins`;
  if (barNode) barNode.style.width = `${progress}%`;
  if (nameNode) nameNode.textContent = state.profile.name;

  save(STORAGE.profile, state.profile);
}

function getExerciseArt(icon) {
  const maps = {
    warmup: 'M24 72 L32 46 L45 58 L60 36 L79 68 M30 78 L32 42 M60 78 L60 30',
    march: 'M18 76 L40 46 L58 46 L86 76 M34 48 L50 26 L66 48 M48 26 L46 12 M36 40 L20 24 M68 40 L84 24',
    squat: 'M20 78 L34 55 L48 57 L64 78 M36 55 L52 36 L70 54 M52 36 L46 14 M62 54 L82 36',
    pushup: 'M18 78 L34 52 L58 52 L82 78 M34 52 L52 28 L68 52 M52 28 L52 12 M32 44 L18 24 M68 44 L82 24',
    bridge: 'M18 72 L40 38 L62 38 L84 72 M40 38 L40 18 M62 38 L62 18',
    birddog: 'M18 78 L42 50 L54 50 L82 78 M42 50 L38 18 M54 50 L60 18 M30 32 L12 22 M72 32 L90 22',
    lunge: 'M18 80 L38 46 L58 52 L82 80 M34 48 L52 20 M58 52 L74 30',
    hinge: 'M20 80 L42 48 L64 48 L84 80 M42 48 L54 24 M64 24 L78 14',
    calf: 'M18 82 L40 66 L58 66 L84 82 M38 66 L46 40 M58 66 L52 40',
    deadbug: 'M18 80 L40 48 L58 48 L84 80 M40 48 L32 20 M58 48 L66 20 M22 30 L8 18 M78 30 L92 18',
    climber: 'M26 80 L42 50 L58 50 L78 80 M42 50 L34 24 M58 50 L66 24 M22 42 L8 26 M78 42 L92 26',
    chair: 'M18 76 L22 42 L84 42 L82 76 M30 42 L30 22 M70 42 L70 22',
    wallsit: 'M20 82 L20 52 L82 52 L82 82 M28 52 L28 28 M72 52 L72 28',
    twist: 'M20 82 L36 50 L60 50 L82 82 M36 50 L42 26 M60 50 L58 26',
    stretch: 'M18 82 L40 64 L62 64 L84 82 M40 64 L44 34 M62 64 L58 34',
    cooldown: 'M28 80 C22 64, 32 58, 42 48 C56 34, 70 44, 74 62 C78 80, 60 88, 44 86 C34 84, 30 82, 28 80 Z',
    breath: 'M18 56 C26 36, 42 30, 54 40 C70 52, 80 46, 86 38 M18 64 C22 76, 36 82, 48 74 C62 66, 78 68, 86 56',
    default: 'M26 18 L74 18 L82 48 L72 82 L28 82 L18 48 Z',
  };

  return `
    <svg viewBox="0 0 100 100" aria-hidden="true" class="exercise-art">
      <path d="${maps[icon] || maps.default}" fill="none" stroke="#edf2ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function renderQuestCards() {
  return plans.map((plan) => `
    <button class="quest-card-btn" data-plan="${plan.id}" style="--accent:${plan.accent}">
      <div class="quest-badges">
        <span class="pill">${plan.difficulty}</span>
        <span class="pill pill-gold">+${plan.reward} XP</span>
      </div>
      <h3>${plan.title}</h3>
      <p>${plan.duration} min</p>
    </button>
  `).join('');
}

function renderDailyMissions() {
  const missions = [
    { label: 'Complete 1 workout', done: state.history.length >= 1 },
    { label: 'Hit 5 day streak', done: state.profile.streak >= 5 },
    { label: 'Earn 500 XP', done: state.profile.xp >= 500 },
  ];

  return `
    <section class="panel">
      <div class="panel-header">
        <h2>Mission board</h2>
      </div>
      <div class="missions-list">
        ${missions.map((mission) => `
          <div class="mission-item ${mission.done ? 'done' : ''}">
            <span>${mission.label}</span>
            <strong>${mission.done ? '✓' : '○'}</strong>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderHistory() {
  const items = state.history.length
    ? state.history.slice(0, 5).map((entry) => `
        <div class="history-item">
          <span>${entry.plan}</span>
          <strong>${entry.xp} XP</strong>
        </div>
      `).join('')
    : '<p class="muted">No workouts logged yet.</p>';

  return `
    <section class="panel">
      <div class="panel-header">
        <h2>Workout log</h2>
      </div>
      <div class="history-list">${items}</div>
    </section>
  `;
}

function renderBossArena() {
  const bossName = plans[state.profile.wins % plans.length]?.title || 'Rebuild Protocol';
  const hp = Math.max(12, 100 - (state.profile.wins || 0) * 8);

  return `
    <section class="panel">
      <div class="panel-header">
        <h2>Boss arena</h2>
        <span class="pill pill-gold">${state.profile.wins || 0} wins</span>
      </div>
      <div class="boss-card">
        <div class="boss-avatar">${getExerciseArt('warmup')}</div>
        <div class="boss-copy">
          <h3>${bossName} boss</h3>
          <p>Complete quests to damage the boss. Consistency is your power-up.</p>
        </div>
      </div>
      <div class="boss-health">
        <span>Boss HP ${hp}%</span>
        <div class="health-track"><div class="health-fill" style="width:${hp}%"></div></div>
      </div>
    </section>
  `;
}

function renderHome() {
  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Level Up Fitness</p>
          <h1 data-role="player-name">${state.profile.name}</h1>
        </div>
        <button class="icon-btn" data-action="toggle-music">${state.settings.music ? '♫' : '🔇'}</button>
      </header>

      <section class="panel profile-panel">
        <div class="row between">
          <div>
            <p class="eyebrow">Current rank</p>
            <strong data-role="level">Level ${state.profile.level}</strong>
          </div>
          <div class="mini-stats">
            <span data-role="coins">${state.profile.coins} coins</span>
            <span data-role="streak">${state.profile.streak} day streak</span>
          </div>
        </div>

        <div class="xp-track">
          <div class="xp-bar" data-role="xp-bar"></div>
        </div>

        <div class="row between xp-meta">
          <span data-role="xp">${state.profile.xp} XP</span>
          <span>${state.profile.badge}</span>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Choose your quest</h2>
        </div>
        <div class="quest-grid">
          ${renderQuestCards()}
        </div>
      </section>

      ${renderBossArena()}
      ${renderDailyMissions()}
      ${renderHistory()}
    </div>
  `;

  updateProfileSummary();
  bindEvents();
}

function startMusic() {
  if (!state.settings.music || !window.AudioContext) return;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 220;
  gainNode.gain.value = 0.025;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), 180);
}

function renderWorkoutSession() {
  const activePlan = state.activePlan;
  const step = activePlan?.steps[state.stepIndex];

  if (!activePlan || !step) {
    finishWorkout();
    return;
  }

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Active Quest</p>
          <h1 data-role="player-name">${state.profile.name}</h1>
        </div>
        <button class="icon-btn" data-action="toggle-music">${state.settings.music ? '♫' : '🔇'}</button>
      </header>

      <section class="panel profile-panel">
        <div class="row between">
          <div>
            <p class="eyebrow">Current rank</p>
            <strong data-role="level">Level ${state.profile.level}</strong>
          </div>
          <div class="mini-stats">
            <span data-role="coins">${state.profile.coins} coins</span>
            <span data-role="streak">${state.profile.streak} day streak</span>
          </div>
        </div>

        <div class="xp-track">
          <div class="xp-bar" data-role="xp-bar"></div>
        </div>

        <div class="row between xp-meta">
          <span data-role="xp">${state.profile.xp} XP</span>
          <span>${state.profile.badge}</span>
        </div>
      </section>

      <section class="panel workout-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">${activePlan.title}</p>
            <h2>${step.name}</h2>
          </div>
          <button class="tiny-btn" data-action="back-home">Back</button>
        </div>

        <div class="arena">
          <div class="exercise-visual">${getExerciseArt(step.icon || 'default')}</div>
          <div class="exercise-copy">
            <span class="tag">${step.type === 'exercise' ? 'Movement' : step.type === 'warmup' ? 'Warm-up' : step.type === 'cooldown' ? 'Recovery' : 'Breath'}</span>
            <p class="muted">${step.cue || 'Stay steady and breathe rhythmically.'}</p>
            <div class="stat-line">
              <span class="stat-pill">${step.type === 'exercise' ? `${step.reps || 12} reps` : `${step.duration}s`}</span>
              <span class="stat-pill timer-pill" data-role="timer">${formatTime(state.timer)}</span>
            </div>
          </div>
        </div>

        <div class="session-actions">
          <button class="primary-btn" data-action="complete-step">Complete step</button>
          <button class="secondary-btn" data-action="skip-step">Skip</button>
        </div>
      </section>
    </div>
  `;

  updateProfileSummary();
  bindEvents();
}

function tickTimer() {
  if (!state.activePlan) return;

  state.timer = Math.max(0, state.timer - 1);
  const timerNode = document.querySelector('[data-role="timer"]');
  if (timerNode) timerNode.textContent = formatTime(state.timer);

  if (state.timer <= 0) {
    clearInterval(state.timerId);
    state.timerId = null;
    advanceSession();
  }
}

function beginTimer(seconds) {
  clearInterval(state.timerId);
  state.timer = Math.max(1, seconds);
  const timerNode = document.querySelector('[data-role="timer"]');
  if (timerNode) timerNode.textContent = formatTime(state.timer);
  state.timerId = setInterval(tickTimer, 1000);
}

function advanceSession() {
  if (!state.activePlan) return;

  const currentStep = state.activePlan.steps[state.stepIndex];
  if (!currentStep) {
    finishWorkout();
    return;
  }

  if (currentStep.type === 'exercise') {
    awardXp(20);
  } else {
    awardXp(10);
  }

  state.stepIndex += 1;
  const nextStep = state.activePlan.steps[state.stepIndex];
  if (!nextStep) {
    finishWorkout();
    return;
  }

  beginTimer(nextStep.duration || 20);
  renderWorkoutSession();
}

function finishWorkout() {
  clearInterval(state.timerId);
  state.timerId = null;

  if (state.activePlan) {
    state.profile.streak += 1;
    state.profile.wins = (state.profile.wins || 0) + 1;
    awardXp(state.activePlan.reward || 100);
    state.history.unshift({
      plan: state.activePlan.title,
      xp: state.activePlan.reward || 100,
      date: new Date().toLocaleDateString(),
    });
    save(STORAGE.history, state.history);
  }

  state.sessionComplete = true;
  state.activePlan = null;
  state.stepIndex = 0;

  if (state.settings.music) startMusic();
  renderHome();
}

function startWorkout(planId) {
  const plan = plans.find((item) => item.id === planId) || plans[0];
  state.activePlan = plan;
  state.stepIndex = 0;
  state.sessionComplete = false;
  beginTimer(plan.steps[0].duration || 25);
  renderWorkoutSession();
}

function completeCurrentStep() {
  if (!state.activePlan) return;

  clearInterval(state.timerId);
  const currentStep = state.activePlan.steps[state.stepIndex];
  if (!currentStep) return;

  if (currentStep.type === 'exercise') {
    awardXp(25);
  } else {
    awardXp(12);
  }

  state.stepIndex += 1;
  const next = state.activePlan.steps[state.stepIndex];
  if (!next) {
    finishWorkout();
    return;
  }

  beginTimer(next.duration || 20);
  renderWorkoutSession();
}

function skipCurrentStep() {
  if (!state.activePlan) return;

  clearInterval(state.timerId);
  state.stepIndex += 1;
  const next = state.activePlan.steps[state.stepIndex];
  if (!next) {
    finishWorkout();
    return;
  }

  beginTimer(next.duration || 20);
  renderWorkoutSession();
}

function handleAction(event) {
  const actionTarget = event.target.closest('[data-action]');
  if (actionTarget) {
    const action = actionTarget.dataset.action;

    if (action === 'toggle-music') {
      state.settings.music = !state.settings.music;
      save(STORAGE.settings, state.settings);
      renderHome();
      return;
    }

    if (action === 'back-home') {
      clearInterval(state.timerId);
      state.activePlan = null;
      state.stepIndex = 0;
      state.sessionComplete = false;
      renderHome();
      return;
    }

    if (action === 'complete-step') {
      completeCurrentStep();
      return;
    }

    if (action === 'skip-step') {
      skipCurrentStep();
      return;
    }
  }

  const planBtn = event.target.closest('[data-plan]');
  if (planBtn) {
    startWorkout(planBtn.dataset.plan);
  }
}

function bindEvents() {
  document.querySelectorAll('[data-action]').forEach((node) => {
    node.addEventListener('click', handleAction);
  });

  document.querySelectorAll('[data-plan]').forEach((node) => {
    node.addEventListener('click', handleAction);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

renderHome();
