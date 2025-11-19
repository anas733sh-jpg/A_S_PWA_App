/* games.js — النسخة النهائية المصححة مع الحفاظ على البنية الأصلية */
const SECTORS_DEFAULT = 12; 
let positions = [];
let wheel = null;
let isSpinning = false;
let currentRotation = 0;

// آخر نتيجة لمنع التكرار
let lastIndex = -1;

// audio context synth
const AUDIO_CTX = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;

// read app config from localStorage
function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem('appConfig') || '{"sounds":true,"hearts":80}');
  } catch (e) {
    return { sounds: true, hearts: 80 };
  }
}
let appConfig = loadConfig();
let soundEnabled = !!appConfig.sounds;

// helper: play short synth tone 
function playSynth(type) {
  if (!soundEnabled || !AUDIO_CTX) return;

  try {
    if (type === 'spin') {
      const now = AUDIO_CTX.currentTime;
      for (let i = 0; i < 6; i++) {
        const o = AUDIO_CTX.createOscillator();
        const g = AUDIO_CTX.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 200 + i * 20;
        g.gain.value = 0.01;
        o.connect(g); g.connect(AUDIO_CTX.destination);
        o.start(now + i * 0.02);
        o.stop(now + i * 0.02 + 0.06);
      }
    } 
    else if (type === 'stop') {
      const o = AUDIO_CTX.createOscillator();
      const g = AUDIO_CTX.createGain();
      o.type = 'triangle';
      o.frequency.value = 760;
      g.gain.value = 0.08;
      o.connect(g); g.connect(AUDIO_CTX.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, AUDIO_CTX.currentTime + 0.5);
      setTimeout(()=>{ try{o.stop();}catch(e){} }, 520);
    } 
    else if (type === 'click') {
      const o = AUDIO_CTX.createOscillator();
      const g = AUDIO_CTX.createGain();
      o.type = 'square';
      o.frequency.value = 1100;
      g.gain.value = 0.06;
      o.connect(g); g.connect(AUDIO_CTX.destination);
      o.start();
      setTimeout(()=>{ try{o.stop();}catch(e){} }, 80);
    }

  } catch (e) {
    console.debug('Synth play error', e);
  }
}

// helper: create confetti
function spawnConfetti() {
  const count = Math.min(30, Math.max(8, Math.floor((positions.length || SECTORS_DEFAULT)/1)));
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    const colors = ['#ffd700','#ff6b6b','#4ecdc4','#ffd166','#06d6a0','#118ab2','#b86bff','#ff9bd3'];
    c.style.background = colors[Math.floor(Math.random()*colors.length)];
    c.style.left = Math.random()*100 + 'vw';
    c.style.top = (-10 - Math.random()*20) + 'vh';
    c.style.transform = `rotate(${Math.random()*360}deg)`;
    c.style.width = 6 + Math.random()*8 + 'px';
    c.style.height = 8 + Math.random()*8 + 'px';
    c.style.animationDelay = (Math.random()*0.8) + 's';
    document.body.appendChild(c);
    setTimeout(()=>{ if(c.parentNode) c.parentNode.removeChild(c); }, 4500);
  }
}

// 🔄 load positions مع إصلاح المسارات
async function loadPositions() {
  try {
    const res = await fetch('/api/positions');
    positions = await res.json();
    if (!Array.isArray(positions)) positions = [];

    console.log('تم تحميل الوضعيات من السيرفر:', positions.length);
    updateWheelInfo();
  } catch(e) {
    console.error('Failed to load positions from server', e);
    // استخدم البيانات المحلية كنسخة احتياطية
    loadFromLocalStorage();
  }
  buildWheel();
}

// تحميل من التخزين المحلي
function loadFromLocalStorage() {
  const saved = localStorage.getItem('wheelPositions');
  if (saved) {
    try {
      positions = JSON.parse(saved);
      console.log('تم تحميل الوضعيات من التخزين المحلي:', positions.length);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      positions = [];
    }
  }

  if (positions.length === 0) {
    positions = getDefaultPositions();
    console.log('تم استخدام الوضعيات الافتراضية');
  }

  updateWheelInfo();
}

// بيانات افتراضية
function getDefaultPositions() {
  return [
    { name: "وضعية رومانسية", description: "ليلة رومانسية مميزة", image: "" },
    { name: "وضعية مغامرة", description: "مغامرة جديدة ومثيرة", image: "" },
    { name: "وضعية استرخاء", description: "لاسترخاء والهدوء التام", image: "" },
    { name: "وضعية إبداعية", description: "للاوقات الإبداعية", image: "" }
  ];
}

// تحديث معلومات العجلة
function updateWheelInfo() {
  const infoElement = document.getElementById('wheelInfo');
  if (infoElement) {
    if (positions.length === 0) {
      infoElement.textContent = 'لا توجد وضعيات';
      infoElement.style.background = 'rgba(255,100,100,0.2)';
    } else {
      infoElement.textContent = `الوضعيات المتاحة: ${positions.length}`;
      infoElement.style.background = 'rgba(255,255,255,0.1)';
    }
  }
}

// build wheel 
function buildWheel() {
  wheel = document.getElementById('wheel');
  if (!wheel) return;

  wheel.innerHTML = '';

  const count = positions.length || SECTORS_DEFAULT;
  const angle = 360 / count;

  for (let i = 0; i < count; i++) {
    const pos = positions[i] || { name: `وضعية ${i+1}`, image: '', description: '' };

    const sector = document.createElement('div');
    sector.className = 'sector';
    sector.style.transform = `rotate(${angle*i}deg) translate(-50%, -50%)`;

    const span = document.createElement('span');
    span.textContent = pos.name || `الوضعية ${i+1}`;
    span.title = pos.name || '';
    sector.appendChild(span);

    wheel.appendChild(sector);
  }

  wheel.style.transform = `rotate(${currentRotation}deg)`;
}

// ✔ spin the wheel + prevent repeating last result
function spinWheel() {
  if (isSpinning || (positions.length === 0)) return;
  isSpinning = true;

  if (AUDIO_CTX && AUDIO_CTX.state === 'suspended') {
    AUDIO_CTX.resume().catch(()=>{});
  }

  playSynth('spin');

  const count = positions.length;
  const angle = 360 / count;

  // اختيار عشوائي بدون تكرار
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * count);
  } while (randomIndex === lastIndex);

  lastIndex = randomIndex;

  const sectorCenter = randomIndex * angle + angle/2;
  const baseSpins = 5 * 360;
  const jitter = (Math.random()* (angle/2 - 2)) + 2;
  const target = -(baseSpins + sectorCenter - jitter);
  const finalAngle = currentRotation + target + (Math.random()*10 - 5);

  wheel.classList.remove('stop-glow', 'stop-pulse');

  wheel.style.transition = 'transform 4s cubic-bezier(0.16,0.84,0.24,1)';

  const onEnd = (e) => {
    if (e.target !== wheel) return;
    wheel.removeEventListener('transitionend', onEnd);

    playSynth('stop');

    wheel.classList.add('stop-glow', 'stop-pulse');
    const pointer = document.querySelector('.pointer');
    if (pointer) { 
      pointer.classList.add('flash'); 
      setTimeout(()=>pointer.classList.remove('flash'),700); 
    }

    spawnConfetti();

    const chosenIndex = normalizeIndex(Math.round(((360 - (finalAngle % 360)) % 360) / (360 / (positions.length || SECTORS_DEFAULT))));
    showResult(chosenIndex);

    currentRotation = ((finalAngle % 360) + 360) % 360;
    isSpinning = false;

    setTimeout(()=> {
      wheel.classList.remove('stop-glow', 'stop-pulse');
    }, 900);
  };

  wheel.addEventListener('transitionend', onEnd);

  requestAnimationFrame(() => {
    wheel.style.transform = `rotate(${finalAngle}deg)`;
  });
}

function normalizeIndex(idx) {
  const n = positions.length || SECTORS_DEFAULT;
  let i = idx % n;
  if (i < 0) i += n;
  return i;
}

// ✔ showResult مع إصلاح مسارات الصور
function showResult(index) {
  const pos = positions[index] || { name: 'لا شيء', description: '', image: '' };

  const modal = document.getElementById('resultModal');
  const imageEl = document.getElementById('resultImage');
  const nameEl = document.getElementById('resultName');
  const descEl = document.getElementById('resultDesc');
  const modalCard = document.getElementById('modalCard');

  // إصلاح مسار الصورة - استخدام المسار الصحيح
  if (pos.image && pos.image.trim() !== '') {
    // إذا كانت الصورة مسار كامل (URL) استخدمه مباشرة
    if (pos.image.startsWith('http') || pos.image.startsWith('/')) {
      imageEl.style.backgroundImage = `url("${pos.image}")`;
    } else {
      // إذا كان اسم ملف فقط، أضف المسار الصحيح للسيرفر
      imageEl.style.backgroundImage = `url("/public/uploads/${pos.image}")`;
    }
    imageEl.style.backgroundSize = 'contain';
    imageEl.style.backgroundColor = 'rgba(255,255,255,0.95)';
  } else {
    imageEl.style.backgroundImage = `linear-gradient(135deg,#ff9ccf,#7ad1ff)`;
    imageEl.style.backgroundSize = 'cover';
    imageEl.style.backgroundColor = 'transparent';
  }

  nameEl.textContent = pos.name || '';
  descEl.textContent = pos.description || '';

  modal.classList.remove('hidden');
  modalCard.classList.add('show');
  imageEl.classList.add('show');

  playSynth('click');
}

function closeModal() {
  const modal = document.getElementById('resultModal');
  const modalCard = document.getElementById('modalCard');
  modalCard.classList.remove('show');
  setTimeout(()=> modal.classList.add('hidden'), 220);
}

// التهيئة مع إضافة منع السلوك الافتراضي
document.addEventListener('DOMContentLoaded', () => {
  wheel = document.getElementById('wheel');

  const spinBtn = document.getElementById('spinBtn');
  const resetBtn = document.getElementById('resetBtn');
  const againBtn = document.getElementById('againBtn');
  const closeBtn = document.getElementById('closeModal');

  spinBtn.addEventListener('click', () => {
    appConfig = loadConfig();
    soundEnabled = !!appConfig.sounds;
    spinWheel();
  });

  resetBtn.addEventListener('click', () => {
    wheel.style.transition = 'transform 300ms ease';
    wheel.style.transform = 'rotate(0deg)';
    currentRotation = 0;
  });

  againBtn.addEventListener('click', () => { closeModal(); setTimeout(()=>spinWheel(), 300); });
  closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === spinBtn) {
      spinWheel();
    }
  });

  // منع السلوك الافتراضي للسحب والتمرير
  document.addEventListener('touchmove', function(e) {
    if (e.target.closest('#wheel-scene') || e.target.closest('.modal') || e.target.closest('.container')) {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  });

  document.addEventListener('selectstart', function(e) {
    e.preventDefault();
  });

  loadPositions();
});

// وظائف مساعدة للإدارة
window.wheelManager = {
  getPositions: () => positions,
  getPositionsCount: () => positions.length,
  reloadPositions: loadPositions
};