(() => {
  'use strict';

  const CH = window.GAME_CHARACTERS;
  const STORIES = window.GAME_STORIES;
  const DEFAULT_DATA = window.GAME_KANJI_DATA;
  const STROKES = window.GAME_KANJI_STROKES || {};
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ---------- Cấu hình ----------
  const KEY_DATA = 'bubble-game-kanji-list-v3';
  const KEY_PROGRESS = 'bubble-game-progress-v1';
  const MAX_LIVES = 3;
  const POINTS = 10;
  const MIN_KANJI = 4;
  const ALL_STAGE_SIZE = 15;          // số câu của ô ぜんぶ
  const TIME_LIMIT_S = 60;
  const NIGATE_CLEAR_STREAK = 3;      // đúng liên tiếp 3 lần thì rời danh sách にがて
  const SILENCE_MS = 900;             // khoảng lặng thay cho chữ Hán khi đọc câu
  const STROKE_MS = 450;              // thời gian viết 1 nét trên bảng đen
  const LESSON_RISE_MS = [15000, 15000, 14000, 14000, 13000];
  const ALL_RISE_MS = 12000;
  const ALL_STEP_MS = 200;
  const ALL_MIN_MS = 9000;
  const SAGASHI_EXTRA_MS = 3000;
  const TIME_RISE_MS = 9000;
  const NIGATE_RISE_MS = 15000;
  const COLORS = ['#FF6B8B', '#FF9F43', '#4D96FF', '#3DBE6A', '#B072FF', '#E89B0C', '#FF5DA2', '#22B8CF'];
  // Nhóm chữ trông giống nhau, dùng làm lựa chọn sai khi chọn chữ Hán
  const SIMILAR = [
    ['大', '天', '木', '犬'], ['日', '月', '田', '目', '白'], ['上', '下', '正', '土'], ['子', '字', '学'],
    ['男', '田', '町'], ['一', '二', '三'], ['七', '十', '九', '千'], ['手', '毛'], ['見', '貝', '目'],
    ['先', '生', '青'], ['川', '小', '水'], ['八', '人', '入'], ['五', '王'], ['文', '父'],
  ];
  const STAGE_MODES = ['yomi', 'erabi', 'sagashi'];
  const MODES = {
    yomi: { title: 'よみかた ふうせん', icon: '🎈', desc: 'かんじの よみかたを えらぼう' },
    erabi: { title: 'かんじ えらび', icon: '✏️', desc: 'ひらがなに あう かんじを えらぼう' },
    sagashi: { title: 'かんじ さがし', icon: '👂', desc: 'よく きいて ふうせんを わろう' },
    story: { title: 'おはなし', icon: '📖', desc: 'おはなしに かんじを いれよう' },
    time: { title: '60びょう チャレンジ', icon: '⏱️', desc: '60びょうで いくつ できるかな' },
    nigate: { title: 'にがて れんしゅう', icon: '💪', desc: 'まちがえた かんじを れんしゅう' },
  };

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    screens: {
      menu: $('screen-menu'), parent: $('screen-parent'), map: $('screen-map'), game: $('screen-game'),
      story: $('screen-story'), result: $('screen-result'), zukan: $('screen-zukan'),
    },
    menuBuddy: $('menu-buddy'), menuStars: $('menu-stars'), menuModes: $('menu-modes'),
    parentInput: $('parent-input'), parentMsg: $('parent-msg'),
    mapTitle: $('map-title'), mapGrid: $('map-grid'),
    score: $('score'), lives: $('lives'),
    progress: $('progress'), progressFill: $('progress-fill'), progressIcon: $('progress-icon'),
    stage: $('stage'), buddy: $('buddy'), choices: $('choices'),
    storyStage: $('story-stage'), storyChar: $('story-char'), storyTitle: $('story-title'),
    storyPage: $('story-page'), storyText: $('story-text'), tray: $('story-tray'),
    resultTitle: $('result-title'), resultStars: $('result-stars'), resultScore: $('result-score'),
    resultFriends: $('result-friends'), resultMissedTitle: $('result-missed-title'), resultMissed: $('result-missed'),
    zukanGrid: $('zukan-grid'), toast: $('toast'),
  };

  // ---------- Tiện ích ----------
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const isKatakana = (s) => /^[゠-ヿㇰ-ㇿ・ー]+$/.test(s);

  function showScreen(name) {
    Object.entries(el.screens).forEach(([key, node]) => { node.hidden = key !== name; });
    window.scrollTo(0, 0);
  }

  let toastTimer = 0;
  function toast(text) {
    el.toast.textContent = text;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2200);
  }

  // ---------- Giọng đọc tiếng Nhật ----------
  const speech = {
    supported: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    voice: null,
    token: 0,

    init() {
      if (!this.supported) return;
      const pickVoice = () => {
        const voices = speechSynthesis.getVoices();
        this.voice = voices.find((v) => /^ja/i.test(v.lang)) || null;
      };
      pickVoice();
      speechSynthesis.addEventListener('voiceschanged', pickVoice);
    },

    // Safari chỉ cho đọc sau thao tác của người dùng: gọi trong sự kiện click.
    unlock() {
      if (!this.supported) return;
      speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    },

    stop() {
      this.token += 1;
      if (this.supported) speechSynthesis.cancel();
    },

    say(text, token) {
      return new Promise((resolve) => {
        if (!this.supported || !text || token !== this.token) {
          resolve();
          return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        if (this.voice) u.voice = this.voice;
        u.rate = 0.9;
        u.pitch = 1.2;
        let done = false;
        // một số trình duyệt không bắn sự kiện onend, nên có hạn giờ dự phòng
        const fallback = setTimeout(() => finish(), 2000 + text.length * 300);
        function finish() {
          if (done) return;
          done = true;
          clearTimeout(fallback);
          resolve();
        }
        u.onend = finish;
        u.onerror = finish;
        speechSynthesis.speak(u);
      });
    },

    note() {
      if (!this.supported) return 'この がめんでは こえが でません。';
      if (!this.voice) return 'にほんごの こえが ありません。おうちの ひとに たのんでね。';
      return '';
    },
  };

  // ---------- Dữ liệu chữ Hán ----------
  let data = null;

  function parseData(text) {
    let lessons = [];
    const kanjiMap = new Map();
    const questions = [];
    const errors = { missing: [], sentence: [] };
    let lesson = null;
    const currentLesson = () => {
      if (!lesson) {
        lesson = { title: '', kanji: [] };
        lessons.push(lesson);
      }
      return lesson;
    };

    text.split(/\r?\n/).forEach((raw, index) => {
      const line = raw.trim();
      if (!line) return;
      if (line.startsWith('#')) {
        lesson = { title: line.replace(/^#+\s*/, '').replace(/^\d+\s*/, ''), kanji: [] };
        lessons.push(lesson);
        return;
      }
      const cols = line.split(/\s*[|｜\t]\s*/).map((c) => c.trim());
      const kanji = cols[0] || '';
      const readings = (cols[1] || '').split(/[、,，]/).map((s) => s.trim()).filter(Boolean);
      let k = kanjiMap.get(kanji);
      if (!kanji || (!k && readings.length === 0)) {
        errors.missing.push(index + 1);
        return;
      }
      if (!k) {
        k = { kanji, readings: [], meaning: '', lessonRef: currentLesson(), questions: [] };
        kanjiMap.set(kanji, k);
        currentLesson().kanji.push(k);
      }
      readings.forEach((r) => { if (!k.readings.includes(r)) k.readings.push(r); });
      if (cols[2] && !k.meaning) k.meaning = cols[2];

      const sentence = cols[3] || '';
      if (sentence && !sentence.includes(kanji)) {
        errors.sentence.push(index + 1);
        return;
      }
      const answer = cols[4] || '';
      if (answer && !k.readings.includes(answer)) k.readings.push(answer);
      if (!sentence) return;
      const at = sentence.indexOf(kanji);
      const q = {
        key: `${kanji}|${sentence}`,
        kanji,
        sentence,
        before: sentence.slice(0, at),
        after: sentence.slice(at + kanji.length),
        answer: answer || k.readings[0],
      };
      if (!k.questions.some((x) => x.key === q.key)) {
        k.questions.push(q);
        questions.push(q);
      }
    });

    // Chữ không có câu ví dụ: mỗi cách đọc là 1 câu hỏi chỉ có chữ đó
    kanjiMap.forEach((k) => {
      if (k.questions.length) return;
      k.readings.forEach((r) => {
        const q = { key: `${k.kanji}|${r}`, kanji: k.kanji, sentence: '', before: '', after: '', answer: r };
        k.questions.push(q);
        questions.push(q);
      });
    });

    lessons = lessons.filter((l) => l.kanji.length);
    lessons.forEach((l, i) => l.kanji.forEach((k) => { k.lesson = i; }));
    kanjiMap.forEach((k) => { delete k.lessonRef; });

    return {
      lessons,
      kanjiMap,
      questions,
      errors,
      allReadings: [...new Set([...kanjiMap.values()].flatMap((k) => k.readings))],
      questionMap: new Map(questions.map((q) => [q.key, q])),
    };
  }

  function validate(d) {
    if (d.errors.missing.length) {
      return `${d.errors.missing.join('、')} ぎょうめに かんじか よみかたが ありません。`;
    }
    if (d.errors.sentence.length) {
      return `${d.errors.sentence.join('、')} ぎょうめの れいぶんに その かんじが ありません。`;
    }
    if (d.kanjiMap.size < MIN_KANJI) {
      return `かんじを ${MIN_KANJI}こ いじょう いれてね。いまは ${d.kanjiMap.size}こです。`;
    }
    const weak = [...d.kanjiMap.values()].filter((k) => d.allReadings.filter((r) => !k.readings.includes(r)).length < 3);
    if (weak.length) {
      return `${weak.map((k) => k.kanji).join('、')} の こたえを つくれません。ほかの よみかたの かんじを ふやしてね。`;
    }
    return '';
  }

  function loadDataText() {
    try { return localStorage.getItem(KEY_DATA) || DEFAULT_DATA; } catch { return DEFAULT_DATA; }
  }

  function useData(text) {
    const d = parseData(text);
    const error = validate(d);
    if (!error) data = d;
    return error;
  }

  // ---------- Tiến độ ----------
  const emptyProgress = () => ({ stars: { yomi: {}, erabi: {}, sagashi: {}, story: {} }, best60: 0, readOk: {}, weak: {} });

  function loadProgress() {
    const base = emptyProgress();
    try {
      const saved = JSON.parse(localStorage.getItem(KEY_PROGRESS) || 'null');
      if (saved) return { ...base, ...saved, stars: { ...base.stars, ...(saved.stars || {}) } };
    } catch { /* dữ liệu hỏng thì bắt đầu lại */ }
    return base;
  }
  let progress = loadProgress();
  function saveProgress() {
    try { localStorage.setItem(KEY_PROGRESS, JSON.stringify(progress)); } catch { /* bỏ qua khi trình duyệt chặn lưu */ }
  }

  const starsFor = (mistakes) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
  const totalStars = () => Object.values(progress.stars).reduce((sum, m) => sum + Object.values(m).reduce((a, b) => a + b, 0), 0);

  function markReadOk(kanji, reading) {
    const list = progress.readOk[kanji] || (progress.readOk[kanji] = []);
    if (!list.includes(reading)) list.push(reading);
  }
  function addWeak(key) { progress.weak[key] = 0; }
  function bumpWeak(key) {
    if (!(key in progress.weak)) return;
    progress.weak[key] += 1;
    if (progress.weak[key] >= NIGATE_CLEAR_STREAK) delete progress.weak[key];
  }
  const weakQuestions = () => Object.keys(progress.weak).map((key) => data.questionMap.get(key)).filter(Boolean);

  // Bài i mở khi i là bài đầu, hoặc bài trước có ít nhất 1 sao trong cùng cách chơi
  function tileKeys(mode) {
    if (mode === 'story') return STORIES.map((_, i) => i);
    return [...data.lessons.map((_, i) => i), 'all'];
  }
  function isUnlocked(mode, key) {
    const keys = tileKeys(mode);
    const idx = keys.indexOf(key);
    if (idx <= 0) return true;
    return (progress.stars[mode][keys[idx - 1]] || 0) >= 1;
  }

  function unlockedCharacters() {
    const ids = [];
    CH.lessonOrder.forEach((id, i) => {
      const fromStage = STAGE_MODES.some((m) => (progress.stars[m][i] || 0) > 0);
      const fromStory = STORIES.some((s, si) => s.lesson === i && (progress.stars.story[si] || 0) > 0);
      if (fromStage || fromStory) ids.push(id);
    });
    const bossStage = STAGE_MODES.some((m) => (progress.stars[m].all || 0) > 0);
    const bossStory = STORIES.some((s, si) => s.lesson === 'all' && (progress.stars.story[si] || 0) > 0);
    if (bossStage || bossStory) ids.push(CH.boss);
    return ids;
  }

  // ---------- Nhân vật, phông nền ----------
  const lessonCharId = (key) => (key === 'all' ? CH.boss : CH.lessonOrder[key % CH.lessonOrder.length]);
  const lessonBg = (key) => (key === 'all' ? 5 : key % 5);

  function mountCharacter(box, id) {
    const c = CH.list[id];
    box.innerHTML = c.svg + '<div class="char-say"></div>';
    box.className = `char side-${c.side}${c.boss ? ' is-boss' : ''}`;
    box.dataset.id = id;
  }

  function charReact(box, kind, ms) {
    clearTimeout(box._timer);
    box.classList.remove('is-good', 'is-bad', 'is-throwing');
    void box.offsetWidth; // chạy lại animation khi cùng trạng thái
    box.classList.add(`is-${kind}`);
    const say = box.querySelector('.char-say');
    const c = CH.list[box.dataset.id];
    if (say && c && (kind === 'good' || kind === 'bad')) {
      say.textContent = CH.lines[c.side][kind];
      say.classList.add('show');
    }
    box._timer = setTimeout(() => {
      box.classList.remove(`is-${kind}`);
      if (say) say.classList.remove('show');
    }, ms);
  }

  function applyBackground(stage, index) {
    const bg = CH.backgrounds[index];
    stage.style.setProperty('--sky-top', bg.sky[0]);
    stage.style.setProperty('--sky-bottom', bg.sky[1]);
    stage.style.setProperty('--ground', bg.ground);
    stage.querySelector('.decor').innerHTML = bg.decor;
    stage.classList.toggle('is-night', !!bg.night);
  }

  function staticChar(id, locked) {
    const c = CH.list[id];
    return `<div class="char char-static side-${c.side}${locked ? ' is-silhouette' : ''}">${c.svg}</div>`;
  }

  // ---------- Chim đọc câu ----------
  function makeReader(barId) {
    const bar = $(barId);
    const reader = { el: bar.querySelector('.reader'), text: bar.querySelector('.sentence'), note: bar.querySelector('.voice-note') };
    reader.el.innerHTML = CH.reader;
    return reader;
  }
  const gameReader = makeReader('game-reader-bar');
  const storyReader = makeReader('story-reader-bar');

  function readerMood(reader, mood) {
    reader.el.classList.remove('is-right', 'is-wrong', 'is-hush');
    void reader.el.offsetWidth;
    if (mood) reader.el.classList.add(mood);
  }
  const readerTalk = (reader, on) => reader.el.classList.toggle('is-talking', on);

  function showVoiceNote() {
    const note = speech.note();
    [gameReader, storyReader].forEach((r) => {
      r.note.textContent = note;
      r.note.hidden = !note;
    });
  }

  function renderSentence(q, slotText, slotClass) {
    const t = gameReader.text;
    t.textContent = '';
    const slot = document.createElement('span');
    slot.className = `slot ${slotClass}`;
    slot.textContent = slotText;
    t.append(document.createTextNode(q.before), slot, document.createTextNode(q.after));
  }

  // Đọc câu, đến chữ Hán thì im lặng.
  async function readMuted(q) {
    speech.stop();
    const token = speech.token;
    readerMood(gameReader, null);
    renderSentence(q, q.kanji, 'is-muted');
    readerTalk(gameReader, true);
    await speech.say(q.before, token);
    if (token !== speech.token) return;
    readerTalk(gameReader, false);
    gameReader.el.classList.add('is-hush');
    await wait(SILENCE_MS);
    if (token !== speech.token) return;
    gameReader.el.classList.remove('is-hush');
    readerTalk(gameReader, true);
    await speech.say(q.after, token);
    if (token === speech.token) readerTalk(gameReader, false);
  }

  // Đọc cả câu với cách đọc cho trước, hiện slotText ở chỗ chữ Hán.
  function readFull(q, reading, mood, slotText, slotClass) {
    speech.stop();
    const token = speech.token;
    readerMood(gameReader, mood);
    renderSentence(q, slotText, slotClass);
    readerTalk(gameReader, true);
    return speech.say(q.before + reading + q.after, token).then(() => {
      if (token === speech.token) readerTalk(gameReader, false);
    });
  }

  function resetReaders() {
    speech.stop();
    [gameReader, storyReader].forEach((r) => {
      readerTalk(r, false);
      readerMood(r, null);
      r.text.textContent = '';
    });
  }

  // ---------- Lượt chơi ----------
  let run = null;
  let lastStart = null; // để nút もういちど chơi lại đúng ô vừa chơi

  function newRun(fields) {
    run = { timers: [], rafId: 0, timerId: 0, ...fields };
    return run;
  }
  // Hẹn giờ gắn với lượt chơi: lượt đã đổi thì không chạy.
  function later(fn, ms) {
    const r = run;
    const t = setTimeout(() => { if (run === r) fn(); }, ms);
    if (r) r.timers.push(t);
  }
  function afterAll(promises, minMs, fn) {
    const r = run;
    Promise.all([...promises, wait(minMs)]).then(() => { if (run === r) fn(); });
  }
  function stopRun() {
    if (run) {
      run.timers.forEach(clearTimeout);
      cancelAnimationFrame(run.rafId);
      clearInterval(run.timerId);
      run = null;
    }
    [el.stage, el.storyStage].forEach((s) => s.querySelectorAll('.balloon, .spark, .float-label, .calli').forEach((n) => n.remove()));
    el.tray.innerHTML = '';
    el.choices.innerHTML = '';
    resetReaders();
  }

  // ---------- Chọn câu hỏi và lựa chọn ----------
  function pickQuestion(k) {
    const ok = progress.readOk[k.kanji] || [];
    const fresh = k.questions.filter((q) => !ok.includes(q.answer));
    return pick(fresh.length ? fresh : k.questions);
  }

  const firstReading = (kanji) => {
    const k = data.kanjiMap.get(kanji);
    return k ? k.readings[0] : '';
  };

  function readingChoices(q) {
    const k = data.kanjiMap.get(q.kanji);
    const own = new Set(k.readings);
    // có câu ví dụ: cách đọc khác của chính chữ đó là lựa chọn sai đặt trước (はち so với はっ)
    const ownOthers = q.sentence ? shuffle(k.readings.filter((r) => r !== q.answer)).slice(0, 2) : [];
    const pool = shuffle(data.allReadings.filter((r) => !own.has(r)));
    const same = pool.filter((r) => isKatakana(r) === isKatakana(q.answer));
    const other = pool.filter((r) => isKatakana(r) !== isKatakana(q.answer));
    const wrongs = [...ownOthers, ...same, ...other].slice(0, 3);
    return shuffle([q.answer, ...wrongs]).map((t) => ({ text: t, reading: t, ok: t === q.answer }));
  }

  // Lựa chọn sai khi chọn chữ Hán: ưu tiên chữ cùng âm, chữ trông giống, chữ cùng bài.
  // Không có câu ví dụ thì bỏ chữ cùng âm, vì khi đó không phân biệt được.
  function kanjiDistractors(target, reading, count, lesson, allowSameReading) {
    const all = [...data.kanjiMap.keys()].filter((c) => c !== target);
    const sameReading = all.filter((c) => data.kanjiMap.get(c).readings.includes(reading));
    const usable = allowSameReading ? all : all.filter((c) => !sameReading.includes(c));
    const similar = SIMILAR.filter((g) => g.includes(target)).flat().filter((c) => usable.includes(c));
    const sameLesson = usable.filter((c) => data.kanjiMap.get(c).lesson === lesson);
    const order = [...(allowSameReading ? shuffle(sameReading) : []), ...shuffle(similar), ...shuffle(sameLesson), ...shuffle(usable)];
    const out = [];
    for (const c of order) {
      if (!out.includes(c)) out.push(c);
      if (out.length === count) break;
    }
    return out;
  }

  function kanjiChoices(q) {
    const k = data.kanjiMap.get(q.kanji);
    const wrongs = kanjiDistractors(q.kanji, q.answer, 3, k.lesson, !!q.sentence);
    return shuffle([q.kanji, ...wrongs]).map((c) => ({ text: c, reading: firstReading(c), ok: c === q.kanji }));
  }

  // ---------- Menu ----------
  function renderMenu() {
    el.menuBuddy.innerHTML = CH.list.punimaru.svg;
    el.menuStars.textContent = totalStars();
    el.menuModes.innerHTML = '';
    Object.entries(MODES).forEach(([id, m]) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mode-card';
      card.innerHTML = '<span class="mode-icon"></span><span class="mode-title"></span><span class="mode-desc"></span><span class="mode-extra"></span>';
      card.querySelector('.mode-icon').textContent = m.icon;
      card.querySelector('.mode-title').textContent = m.title;
      card.querySelector('.mode-desc').textContent = m.desc;
      let extra = '';
      if (id === 'time' && progress.best60) extra = `さいこう ${progress.best60}てん`;
      if (id === 'nigate') extra = `にがて ${weakQuestions().length}こ`;
      card.querySelector('.mode-extra').textContent = extra;
      card.addEventListener('click', () => openMode(id));
      el.menuModes.append(card);
    });
    showScreen('menu');
  }

  function openMode(id) {
    if (id === 'time') startRun('time', null);
    else if (id === 'nigate') {
      if (weakQuestions().length === 0) toast('にがてな かんじは ないよ！');
      else startRun('nigate', null);
    } else renderMap(id);
  }

  // ---------- Bản đồ ----------
  let mapMode = null;
  function renderMap(mode) {
    mapMode = mode;
    el.mapTitle.textContent = MODES[mode].title;
    el.mapGrid.innerHTML = '';
    const tiles = mode === 'story'
      ? STORIES.map((s, i) => ({ key: i, num: s.lesson === 'all' ? 'ぜんぶ' : String(i + 1), label: s.title, charId: s.character }))
      : [
        ...data.lessons.map((l, i) => ({ key: i, num: String(i + 1), label: l.title, charId: lessonCharId(i) })),
        { key: 'all', num: 'ぜんぶ', label: 'ぜんぶの かんじ', charId: CH.boss },
      ];
    tiles.forEach((t) => {
      const open = isUnlocked(mode, t.key);
      const stars = progress.stars[mode][t.key] || 0;
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'map-tile';
      tile.disabled = !open;
      tile.innerHTML = '<span class="tile-num"></span><span class="tile-char"></span><span class="tile-label"></span><span class="tile-stars"></span>';
      tile.querySelector('.tile-num').textContent = t.num;
      tile.querySelector('.tile-char').innerHTML = open ? staticChar(t.charId, false) : '🔒';
      tile.querySelector('.tile-label').textContent = t.label;
      tile.querySelector('.tile-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      tile.addEventListener('click', () => (mode === 'story' ? startStory(t.key) : startRun(mode, t.key)));
      el.mapGrid.append(tile);
    });
    showScreen('map');
  }

  // ---------- Chơi với bóng bay ----------
  function startRun(mode, lessonKey) {
    stopRun();
    speech.unlock();
    lastStart = { mode, key: lessonKey };
    const r = newRun({
      kind: 'balloon', mode, lessonKey,
      lives: MAX_LIVES, score: 0, mistakes: 0, solved: 0, total: 0,
      missed: new Map(), balloons: [], queue: [], pool: [],
      phase: 'idle', current: null, timeLeft: TIME_LIMIT_S, replay: null,
    });

    if (mode === 'time') {
      const openLessons = data.lessons.map((_, i) => i).filter((i) => isUnlocked('yomi', i));
      r.pool = data.questions.filter((q) => openLessons.includes(data.kanjiMap.get(q.kanji).lesson));
    } else if (mode === 'nigate') {
      r.queue = shuffle(weakQuestions());
      r.total = r.queue.length;
    } else {
      const kanjiList = lessonKey === 'all'
        ? shuffle([...data.kanjiMap.values()]).slice(0, ALL_STAGE_SIZE)
        : data.lessons[lessonKey].kanji;
      r.queue = shuffle(kanjiList.map(pickQuestion));
      r.total = r.queue.length;
    }

    const special = mode === 'time' || mode === 'nigate';
    mountCharacter(el.buddy, special ? 'punimaru' : lessonCharId(lessonKey));
    applyBackground(el.stage, special ? 0 : lessonBg(lessonKey));
    showVoiceNote();
    renderHud();
    showScreen('game');

    if (mode === 'time') {
      r.timerId = setInterval(() => {
        if (run !== r) return;
        r.timeLeft -= 1;
        renderHud();
        if (r.timeLeft <= 0) finishRun(true);
      }, 1000);
    }
    later(nextQuestion, 600);
  }

  function renderHud() {
    const r = run;
    el.score.textContent = r.score;
    if (r.mode === 'time') el.lives.textContent = `⏱ ${r.timeLeft}`;
    else if (r.mode === 'nigate') el.lives.textContent = '';
    else {
      el.lives.innerHTML = Array.from({ length: MAX_LIVES }, (_, i) =>
        `<span class="heart${i < r.lives ? '' : ' lost'}">♥</span>`).join('');
    }
    el.progress.hidden = r.mode === 'time';
    const boss = r.lessonKey === 'all' && STAGE_MODES.includes(r.mode);
    el.progress.classList.toggle('is-boss', boss);
    const done = r.total ? r.solved / r.total : 0;
    el.progressFill.style.width = `${(boss ? 1 - done : done) * 100}%`;
    el.progressIcon.textContent = boss ? '👹' : '🏁';
  }

  function riseMs(type) {
    const r = run;
    let ms;
    if (r.mode === 'time') ms = TIME_RISE_MS;
    else if (r.mode === 'nigate') ms = NIGATE_RISE_MS;
    else if (r.lessonKey === 'all') ms = Math.max(ALL_MIN_MS, ALL_RISE_MS - r.solved * ALL_STEP_MS);
    else ms = LESSON_RISE_MS[Math.min(r.lessonKey, LESSON_RISE_MS.length - 1)];
    if (type === 'sagashi') ms += SAGASHI_EXTRA_MS;
    return ms;
  }

  function nextQuestion() {
    const r = run;
    if (!r || r.phase === 'over') return;
    let q;
    let type;
    if (r.mode === 'time') {
      do { q = pick(r.pool); } while (r.pool.length > 1 && r.current && q === r.current.q);
      type = Math.random() < 0.5 ? 'yomi' : 'erabi';
    } else {
      if (r.queue.length === 0) {
        finishRun(true);
        return;
      }
      q = r.queue.shift();
      type = r.mode === 'nigate' ? 'yomi' : r.mode;
    }
    r.current = { q, type };
    r.balloons = [];
    r.lastTs = 0;
    if (type === 'sagashi') spawnSagashi(q);
    else spawnSingle(q, type);
    r.phase = 'flying';
    r.rafId = requestAnimationFrame(tick);
  }

  function makeBalloon(text) {
    const node = document.createElement('div');
    node.className = 'balloon';
    const color = pick(COLORS);
    node.style.setProperty('--color', color);
    node.innerHTML =
      '<div class="balloon-inner">' +
        '<div class="balloon-body"><span class="balloon-text"></span></div>' +
        '<div class="balloon-knot"></div>' +
        '<div class="balloon-string"></div>' +
      '</div>';
    const t = node.querySelector('.balloon-text');
    t.textContent = text;
    t.dataset.len = String(Math.min([...text].length, 4));
    el.stage.append(node);
    return { node, color };
  }

  // よみかた và かんじ えらび: 1 bóng thả từ tay nhân vật
  function spawnSingle(q, type) {
    const r = run;
    const { node, color } = makeBalloon(type === 'yomi' ? q.kanji : q.answer);
    const stageRect = el.stage.getBoundingClientRect();
    const buddyRect = el.buddy.getBoundingClientRect();
    const hand = CH.list[el.buddy.dataset.id].hand;
    const handX = buddyRect.left - stageRect.left + buddyRect.width * hand[0];
    const handY = buddyRect.top - stageRect.top + buddyRect.height * hand[1];
    const bw = node.offsetWidth;
    const bh = node.offsetHeight;
    const startX = handX - bw / 2;
    const startY = Math.max(handY - bh, 60);
    const targetX = clamp(stageRect.width / 2 - bw / 2 + (Math.random() - 0.5) * stageRect.width * 0.4, 8, stageRect.width - bw - 8);
    const b = {
      node, color, bw, bodyH: node.querySelector('.balloon-body').offsetHeight,
      startX, startY, targetX, x: startX, y: startY, elapsed: 0,
      duration: riseMs(type), isAnswer: true, hover: r.mode === 'nigate',
    };
    r.balloons.push(b);
    placeBalloon(b);

    renderChoices(type === 'yomi' ? readingChoices(q) : kanjiChoices(q), type);
    charReact(el.buddy, 'throwing', 500);
    r.replay = type === 'yomi'
      ? () => readMuted(q)
      : () => readFull(q, q.answer, null, q.answer, 'is-kana');
    r.replay();
  }

  // かんじ さがし: 4 bóng chữ Hán bay lên từ dưới, bấm bóng đúng
  function spawnSagashi(q) {
    const r = run;
    el.choices.innerHTML = '<p class="choices-hint">ただしい かんじの ふうせんを タッチ！</p>';
    el.choices.classList.remove('is-kanji');
    const k = data.kanjiMap.get(q.kanji);
    const kanjis = shuffle([q.kanji, ...kanjiDistractors(q.kanji, q.answer, 3, k.lesson, !!q.sentence)]);
    const W = el.stage.clientWidth;
    const H = el.stage.clientHeight;
    const laneW = W / kanjis.length;
    const size = Math.min(96, laneW - 10);
    const duration = riseMs('sagashi');
    kanjis.forEach((kanji, i) => {
      const { node, color } = makeBalloon(kanji);
      node.style.setProperty('--balloon-w', `${size}px`);
      node.classList.add('is-tappable');
      const bw = node.offsetWidth;
      const bodyH = node.querySelector('.balloon-body').offsetHeight;
      const x = i * laneW + (laneW - bw) / 2;
      const startY = H - bodyH * 0.6;
      const b = {
        node, color, bw, bodyH, kanji,
        startX: x, targetX: x, x, y: startY, startY,
        elapsed: -i * 400 - Math.random() * 300,
        duration: duration * (0.9 + Math.random() * 0.2),
        isAnswer: kanji === q.kanji,
      };
      node.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        tapBalloon(b);
      });
      r.balloons.push(b);
      placeBalloon(b);
    });
    charReact(el.buddy, 'throwing', 500);
    r.replay = () => readFull(q, q.answer, null, '？', 'is-hidden');
    r.replay();
  }

  function placeBalloon(b) {
    b.node.style.transform = `translate(${b.x}px, ${b.y}px)`;
  }

  function tick(ts) {
    const r = run;
    if (!r || r.phase !== 'flying') return;
    const dt = r.lastTs ? Math.min(ts - r.lastTs, 50) : 16; // tab bị ẩn thì bóng không nhảy vọt
    r.lastTs = ts;
    for (const b of r.balloons) {
      if (b.gone) continue;
      b.elapsed += dt;
      let p = clamp(b.elapsed / b.duration, 0, 1);
      if (b.hover) p = Math.min(p, 0.75); // にがて れんしゅう: bóng dừng lại chờ, không bay mất
      const ease = 1 - (1 - p) * (1 - p);
      b.x = b.startX + (b.targetX - b.startX) * ease + Math.sin(b.elapsed / 650) * 10 * p;
      b.y = b.startY * (1 - p);
      placeBalloon(b);
      if (p >= 1) {
        if (b.isAnswer) {
          timeoutQuestion();
          return;
        }
        b.gone = true;
        b.node.remove();
      }
    }
    r.rafId = requestAnimationFrame(tick);
  }

  function renderChoices(list, type) {
    el.choices.innerHTML = '';
    el.choices.classList.toggle('is-kanji', type !== 'yomi');
    list.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.dataset.ok = choice.ok ? '1' : '';
      btn.innerHTML = `<span class="key">${i + 1}</span><span class="txt"></span>`;
      btn.querySelector('.txt').textContent = choice.text;
      btn.addEventListener('click', () => {
        if (!run || run.phase !== 'flying' || btn.disabled) return;
        if (choice.ok) {
          btn.classList.add('right');
          resolveCorrect();
        } else {
          btn.classList.add('wrong');
          btn.disabled = true;
          resolveWrong(choice);
        }
      });
      el.choices.append(btn);
    });
  }

  function lockChoices(reveal) {
    el.choices.querySelectorAll('.choice').forEach((btn) => {
      btn.disabled = true;
      if (reveal && btn.dataset.ok) btn.classList.add('reveal');
    });
  }

  function tapBalloon(b) {
    if (!run || run.phase !== 'flying' || b.gone) return;
    if (b.isAnswer) {
      resolveCorrect();
      return;
    }
    b.gone = true;
    b.node.classList.add('is-dud');
    setTimeout(() => b.node.remove(), 700);
    resolveWrong({ text: b.kanji, reading: firstReading(b.kanji) });
  }

  const answerBalloon = () => run.balloons.find((b) => b.isAnswer);
  const slotAnswer = (q, type) => (type === 'yomi' ? q.answer : q.kanji);

  function resolveCorrect() {
    const r = run;
    const { q, type } = r.current;
    r.phase = 'resolving';
    cancelAnimationFrame(r.rafId);
    r.score += POINTS;
    r.solved += 1;
    markReadOk(q.kanji, q.answer);
    if (r.mode === 'nigate') bumpWeak(q.key);
    saveProgress();
    renderHud();
    lockChoices(false);

    const b = answerBalloon();
    b.node.classList.add('popped');
    r.balloons.filter((x) => !x.isAnswer && !x.gone).forEach((x) => x.node.classList.add('escaped'));
    const cx = b.x + b.bw / 2;
    const cy = b.y + b.bodyH / 2;
    burst(el.stage, cx, cy, b.color);
    floatLabel(el.stage, `${slotAnswer(q, type)} ⭕`, cx, cy, false);
    charReact(el.buddy, 'good', 1000);
    const spoken = readFull(q, q.answer, 'is-right', slotAnswer(q, type), 'is-right');
    // 60びょう チャレンジ bỏ phần viết bảng để giữ nhịp nhanh
    const writing = r.mode === 'time' ? Promise.resolve() : calligraphy(el.stage, q.kanji);

    afterAll([spoken, writing], 1000, () => {
      clearBalloons();
      nextQuestion();
    });
  }

  function resolveWrong(choice) {
    const r = run;
    const { q, type } = r.current;
    r.mistakes += 1;
    r.missed.set(q.key, q);
    addWeak(q.key);
    if (r.mode === 'nigate') progress.weak[q.key] = 0;
    saveProgress();
    if (type !== 'sagashi') {
      const node = answerBalloon().node;
      node.classList.remove('is-shaking');
      void node.offsetWidth;
      node.classList.add('is-shaking');
    }
    charReact(el.buddy, 'bad', 900);
    const spoken = readFull(q, choice.reading, 'is-wrong', choice.text, 'is-wrong');
    if (!STAGE_MODES.includes(r.mode)) return;

    r.lives -= 1;
    renderHud();
    if (r.lives <= 0) {
      r.phase = 'ending';
      cancelAnimationFrame(r.rafId);
      lockChoices(true);
      afterAll([spoken], 1200, () => finishRun(false));
    }
  }

  function timeoutQuestion() {
    const r = run;
    const { q, type } = r.current;
    r.phase = 'resolving';
    r.mistakes += 1;
    r.missed.set(q.key, q);
    addWeak(q.key);
    saveProgress();
    r.balloons.filter((b) => !b.gone).forEach((b) => {
      b.node.classList.add('escaped');
      b.node.style.transform = `translate(${b.x}px, ${-b.node.offsetHeight}px)`;
    });
    const b = answerBalloon();
    floatLabel(el.stage, slotAnswer(q, type), b.x + b.bw / 2, 60, true);
    charReact(el.buddy, 'bad', 900);
    lockChoices(true);
    const spoken = readFull(q, q.answer, 'is-wrong', slotAnswer(q, type), 'is-reveal');

    if (STAGE_MODES.includes(r.mode)) {
      r.queue.push(q); // câu bị bay mất phải làm lại sau
      r.lives -= 1;
      renderHud();
      if (r.lives <= 0) {
        r.phase = 'ending';
        afterAll([spoken], 1200, () => finishRun(false));
        return;
      }
    }
    afterAll([spoken], 1400, () => {
      clearBalloons();
      nextQuestion();
    });
  }

  function clearBalloons() {
    el.stage.querySelectorAll('.balloon').forEach((n) => n.remove());
    if (run) run.balloons = [];
  }

  function burst(stage, x, y, color) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 50 + Math.random() * 40;
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty('--color', color);
      s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      stage.append(s);
      s.addEventListener('animationend', () => s.remove());
    }
  }

  function floatLabel(stage, text, x, y, isMiss) {
    const label = document.createElement('div');
    label.className = 'float-label' + (isMiss ? ' is-miss' : '');
    label.textContent = text;
    label.style.left = `${clamp(x, 90, stage.clientWidth - 90)}px`;
    label.style.top = `${Math.max(y, 40)}px`;
    stage.append(label);
    label.addEventListener('animationend', () => label.remove());
  }

  // ---------- ふでまる viết chữ lên bảng đen ----------
  // Đi vào từ trái, viết từng nét kèm số thứ tự nét, rồi đi sang phải và biến mất.
  async function calligraphy(stage, kanji) {
    const r = run;
    const node = document.createElement('div');
    node.className = 'calli';
    node.innerHTML = `<div class="calli-writer">${CH.writer}</div><div class="calli-board">${CH.board}</div>`;
    stage.append(node);
    const alive = () => run === r && node.isConnected;
    const W = stage.clientWidth;
    const w = node.offsetWidth;

    node.style.transform = `translateX(${-w - 10}px)`;
    void node.offsetWidth;
    node.classList.add('is-moving');
    node.style.transition = 'transform 1.1s ease-out';
    node.style.transform = `translateX(${(W - w) / 2}px)`;
    await wait(1150);
    if (!alive()) { node.remove(); return; }
    node.classList.remove('is-moving');
    node.classList.add('is-writing');

    const strokesG = node.querySelector('.calli-strokes');
    const numsG = node.querySelector('.calli-nums');
    const strokes = STROKES[kanji];
    if (strokes) {
      for (let i = 0; i < strokes.length; i++) {
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', strokes[i]);
        path.setAttribute('class', 'calli-stroke');
        strokesG.append(path);
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;

        const start = path.getPointAtLength(0);
        const num = document.createElementNS(SVG_NS, 'g');
        num.setAttribute('class', 'calli-num');
        const nx = clamp(start.x - 7, 6, 94);
        const ny = clamp(start.y - 7, 6, 94);
        num.innerHTML = `<circle cx="${nx}" cy="${ny}" r="5.5"/><text x="${nx}" y="${ny}">${i + 1}</text>`;
        numsG.append(num);

        path.getBoundingClientRect();
        path.style.transition = `stroke-dashoffset ${STROKE_MS}ms ease-in-out`;
        path.style.strokeDashoffset = '0';
        await wait(STROKE_MS + 120);
        if (!alive()) { node.remove(); return; }
      }
    } else {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '50');
      text.setAttribute('y', '52');
      text.setAttribute('class', 'calli-whole');
      text.textContent = kanji;
      strokesG.append(text);
      await wait(900);
    }

    node.classList.remove('is-writing');
    await wait(700);
    if (!alive()) { node.remove(); return; }
    node.classList.add('is-moving');
    node.style.transition = 'transform 1.1s ease-in';
    node.style.transform = `translateX(${W + 10}px)`;
    await wait(1150);
    node.remove();
  }

  // ---------- Kết thúc lượt ----------
  function finishRun(cleared) {
    const r = run;
    if (!r) return;
    const before = unlockedCharacters();
    stopRun();

    let stars = 0;
    let newBest = false;
    if (STAGE_MODES.includes(r.mode) && cleared) {
      stars = starsFor(r.mistakes);
      const s = progress.stars[r.mode];
      s[r.lessonKey] = Math.max(s[r.lessonKey] || 0, stars);
    }
    if (r.mode === 'time' && r.score > progress.best60) {
      progress.best60 = r.score;
      newBest = true;
    }
    saveProgress();
    const newFriends = unlockedCharacters().filter((id) => !before.includes(id));

    let title;
    let scoreLine;
    if (r.mode === 'time') {
      title = 'タイムアップ！';
      scoreLine = `てんすう <strong>${r.score}</strong>　さいこう ${progress.best60}てん${newBest ? '　しんきろく！' : ''}`;
    } else if (r.mode === 'nigate') {
      title = 'れんしゅう おわり！';
      scoreLine = `のこりの にがて <strong>${weakQuestions().length}</strong>こ`;
    } else {
      title = cleared ? 'クリア！' : 'ざんねん…';
      scoreLine = `てんすう <strong>${r.score}</strong>`;
    }
    showResult({ title, stars, scoreLine, newFriends, missed: [...r.missed.values()] });
  }

  function showResult({ title, stars, scoreLine, newFriends, missed }) {
    el.resultTitle.textContent = title;
    el.resultStars.textContent = stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
    el.resultScore.innerHTML = scoreLine;
    el.resultFriends.innerHTML = '';
    newFriends.forEach((id) => {
      const card = document.createElement('div');
      card.className = 'friend-card';
      card.innerHTML = `${staticChar(id, false)}<span></span>`;
      card.querySelector('span').textContent = `${CH.list[id].name}が なかまに なった！`;
      el.resultFriends.append(card);
    });
    el.resultMissed.innerHTML = '';
    el.resultMissedTitle.hidden = missed.length === 0;
    missed.forEach((q) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="k"></span><span class="r"></span><span class="s"></span>';
      li.querySelector('.k').textContent = q.kanji;
      li.querySelector('.r').textContent = q.answer;
      li.querySelector('.s').textContent = q.sentence;
      el.resultMissed.append(li);
    });
    showScreen('result');
  }

  function leaveToMap() {
    stopRun();
    if (lastStart && (lastStart.mode === 'time' || lastStart.mode === 'nigate')) renderMenu();
    else if (mapMode) renderMap(mapMode);
    else renderMenu();
  }

  // ---------- おはなし ----------
  function parseStoryPage(text) {
    const segs = [];
    let last = 0;
    const re = /〔(.+?):(.+?)〕/g;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) segs.push({ type: 'text', text: text.slice(last, m.index) });
      segs.push({ type: 'blank', kanji: m[1], reading: m[2], filled: false });
      last = m.index + m[0].length;
    }
    if (last < text.length) segs.push({ type: 'text', text: text.slice(last) });
    return segs;
  }

  function startStory(index) {
    stopRun();
    speech.unlock();
    lastStart = { mode: 'story', key: index };
    const story = STORIES[index];
    newRun({ kind: 'story', mode: 'story', storyIndex: index, story, page: 0, mistakes: 0, missed: new Map(), segments: [], pos: 0, active: null, chunk: '' });
    mountCharacter(el.storyChar, story.character);
    applyBackground(el.storyStage, story.lesson === 'all' ? 5 : story.lesson % 5);
    el.storyTitle.textContent = story.title;
    showVoiceNote();
    showScreen('story');
    openPage(0);
  }

  function openPage(i) {
    const r = run;
    r.page = i;
    r.segments = parseStoryPage(r.story.pages[i]);
    r.pos = 0;
    r.active = null;
    el.storyPage.textContent = `${i + 1} / ${r.story.pages.length}`;
    el.tray.innerHTML = '';
    renderStoryText();
    later(readOn, 500);
  }

  function renderStoryText() {
    const r = run;
    const p = el.storyText;
    p.textContent = '';
    r.segments.forEach((s, i) => {
      if (s.type === 'text') {
        p.append(document.createTextNode(s.text));
        return;
      }
      const span = document.createElement('span');
      span.className = 'blank' + (s.filled ? ' is-filled' : '') + (i === r.active ? ' is-active' : '');
      span.dataset.i = String(i);
      span.textContent = s.filled ? s.kanji : '';
      span.addEventListener('click', () => {
        if (selectedCard && i === run.active) dropCard(selectedCard);
      });
      p.append(span);
    });
  }

  // Đọc tiếp từ vị trí hiện tại đến ô trống kế tiếp, hoặc đến hết trang.
  async function readOn() {
    const r = run;
    if (!r || r.kind !== 'story') return;
    let text = '';
    let i = r.pos;
    while (i < r.segments.length) {
      const s = r.segments[i];
      if (s.type === 'text') text += s.text;
      else if (s.filled) text += s.reading;
      else break;
      i += 1;
    }
    r.pos = i;
    r.chunk = text;
    speech.stop();
    const token = speech.token;
    readerMood(storyReader, null);
    readerTalk(storyReader, true);
    await speech.say(text, token);
    if (run !== r || token !== speech.token) return;
    readerTalk(storyReader, false);

    if (i < r.segments.length) {
      r.active = i;
      storyReader.el.classList.add('is-hush');
      renderStoryText();
      showTray(r.segments[i]);
    } else {
      later(() => {
        if (r.page + 1 < r.story.pages.length) openPage(r.page + 1);
        else finishStory();
      }, 900);
    }
  }

  function showTray(seg) {
    const lesson = run.story.lesson === 'all' ? -1 : run.story.lesson;
    const kanjis = shuffle([seg.kanji, ...kanjiDistractors(seg.kanji, seg.reading, 3, lesson, true)]);
    el.tray.innerHTML = '';
    selectedCard = null;
    kanjis.forEach((k) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.textContent = k;
      card.dataset.kanji = k;
      card.setAttribute('role', 'button');
      setupCard(card);
      el.tray.append(card);
    });
  }

  // Kéo thả thẻ vào ô trống; chạm thẻ rồi chạm ô trống cũng được.
  let selectedCard = null;
  function setupCard(card) {
    card.addEventListener('pointerdown', (e) => {
      if (!run || run.active === null || card.classList.contains('is-used')) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      let ghost = null;
      card.setPointerCapture(e.pointerId);

      const blankAt = (x, y) => {
        const target = document.elementFromPoint(x, y);
        return target ? target.closest('.blank.is-active') : null;
      };
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 8) {
          ghost = card.cloneNode(true);
          ghost.classList.add('card-ghost');
          ghost.classList.remove('is-selected');
          document.body.append(ghost);
          card.classList.add('is-dragging');
        }
        if (ghost) {
          ghost.style.left = `${ev.clientX}px`;
          ghost.style.top = `${ev.clientY}px`;
          const over = blankAt(ev.clientX, ev.clientY);
          el.storyText.querySelectorAll('.blank').forEach((b) => b.classList.toggle('is-over', b === over));
        }
      };
      const up = (ev) => {
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerup', up);
        card.removeEventListener('pointercancel', up);
        card.classList.remove('is-dragging');
        if (ghost) {
          ghost.remove();
          el.storyText.querySelectorAll('.blank').forEach((b) => b.classList.remove('is-over'));
          if (ev.type === 'pointerup' && blankAt(ev.clientX, ev.clientY)) dropCard(card);
        } else {
          if (selectedCard) selectedCard.classList.remove('is-selected');
          selectedCard = card;
          card.classList.add('is-selected');
        }
      };
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerup', up);
      card.addEventListener('pointercancel', up);
    });
  }

  async function dropCard(card) {
    const r = run;
    if (!r || r.active === null) return;
    const seg = r.segments[r.active];
    const kanji = card.dataset.kanji;
    if (selectedCard) selectedCard.classList.remove('is-selected');
    selectedCard = null;

    if (kanji === seg.kanji) {
      seg.filled = true;
      const blankIndex = r.active;
      r.active = null;
      storyReader.el.classList.remove('is-hush');
      readerMood(storyReader, 'is-right');
      charReact(el.storyChar, 'good', 1000);
      el.tray.innerHTML = '';
      renderStoryText();
      if (data.kanjiMap.has(kanji)) {
        markReadOk(kanji, seg.reading);
        saveProgress();
      }
      await calligraphy(el.storyStage, kanji);
      if (run !== r) return;
      r.pos = blankIndex;
      readOn();
      return;
    }

    // Thả sai: chim đọc đoạn vừa đọc kèm âm của chữ đã thả, thẻ bị khoá
    r.mistakes += 1;
    const plain = r.story.pages[r.page].replace(/〔(.+?):(.+?)〕/g, '$1');
    r.missed.set(`${seg.kanji}|${plain}`, { kanji: seg.kanji, answer: seg.reading, sentence: plain });
    card.classList.add('is-used');
    const blank = el.storyText.querySelector(`.blank[data-i="${r.active}"]`);
    if (blank) {
      blank.textContent = kanji;
      blank.classList.add('is-wrong');
    }
    readerMood(storyReader, 'is-wrong');
    charReact(el.storyChar, 'bad', 900);
    speech.stop();
    const token = speech.token;
    const tail = r.chunk.split(/[。！？」]/).pop();
    readerTalk(storyReader, true);
    await speech.say(tail + firstReading(kanji), token);
    if (run !== r || token !== speech.token) return;
    readerTalk(storyReader, false);
    storyReader.el.classList.add('is-hush');
    renderStoryText();
  }

  function finishStory() {
    const r = run;
    const before = unlockedCharacters();
    stopRun();
    const stars = starsFor(r.mistakes);
    progress.stars.story[r.storyIndex] = Math.max(progress.stars.story[r.storyIndex] || 0, stars);
    saveProgress();
    const newFriends = unlockedCharacters().filter((id) => !before.includes(id));
    showResult({ title: 'おしまい！', stars, scoreLine: `まちがい <strong>${r.mistakes}</strong>かい`, newFriends, missed: [...r.missed.values()] });
  }

  function replayStory() {
    const r = run;
    if (!r || r.kind !== 'story' || r.active === null) return;
    speech.stop();
    const token = speech.token;
    readerTalk(storyReader, true);
    speech.say(r.chunk, token).then(() => { if (token === speech.token) readerTalk(storyReader, false); });
  }

  // ---------- なかま ずかん ----------
  function renderZukan() {
    const unlocked = unlockedCharacters();
    el.zukanGrid.innerHTML = '';
    CH.zukanOrder.forEach((id) => {
      const open = unlocked.includes(id);
      const c = CH.list[id];
      const card = document.createElement('div');
      card.className = 'zukan-card';
      card.innerHTML = `${staticChar(id, !open)}<div class="zukan-name"></div><div class="zukan-desc"></div>`;
      card.querySelector('.zukan-name').textContent = open ? c.name : '？？？';
      card.querySelector('.zukan-desc').textContent = open ? c.desc : 'クリアすると なかまに なるよ';
      el.zukanGrid.append(card);
    });
    showScreen('zukan');
  }

  // ---------- おうちの ひと ----------
  function openParent() {
    el.parentInput.value = loadDataText();
    el.parentMsg.textContent = '';
    el.parentMsg.classList.remove('is-ok');
    showScreen('parent');
  }

  function saveParent() {
    const text = el.parentInput.value;
    const error = useData(text);
    el.parentMsg.classList.toggle('is-ok', !error);
    if (error) {
      el.parentMsg.textContent = error;
      return;
    }
    try { localStorage.setItem(KEY_DATA, text); } catch { /* bỏ qua khi trình duyệt chặn lưu */ }
    el.parentMsg.textContent = 'ほぞん しました。';
  }

  // ---------- Sự kiện ----------
  $('btn-zukan').addEventListener('click', renderZukan);
  $('btn-parent').addEventListener('click', openParent);
  $('btn-parent-back').addEventListener('click', renderMenu);
  $('btn-parent-save').addEventListener('click', saveParent);
  $('btn-parent-default').addEventListener('click', () => {
    el.parentInput.value = DEFAULT_DATA;
    el.parentMsg.textContent = '';
  });
  $('btn-parent-reset').addEventListener('click', () => {
    if (!window.confirm('ほしと きろくを ぜんぶ けしますか？')) return;
    progress = emptyProgress();
    saveProgress();
    el.parentMsg.classList.add('is-ok');
    el.parentMsg.textContent = 'きろくを けしました。';
  });
  $('btn-map-back').addEventListener('click', renderMenu);
  $('btn-zukan-back').addEventListener('click', renderMenu);
  $('btn-game-back').addEventListener('click', leaveToMap);
  $('btn-story-back').addEventListener('click', leaveToMap);
  $('btn-result-back').addEventListener('click', leaveToMap);
  $('btn-result-again').addEventListener('click', () => {
    if (!lastStart) return;
    if (lastStart.mode === 'story') startStory(lastStart.key);
    else if (lastStart.mode === 'nigate' && weakQuestions().length === 0) {
      toast('にがてな かんじは ないよ！');
      renderMenu();
    } else startRun(lastStart.mode, lastStart.key);
  });
  $('btn-game-replay').addEventListener('click', () => {
    if (run && run.kind === 'balloon' && run.phase === 'flying' && run.replay) run.replay();
  });
  $('btn-story-replay').addEventListener('click', replayStory);

  document.addEventListener('keydown', (e) => {
    if (el.screens.game.hidden) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      const btn = el.choices.querySelectorAll('.choice')[n - 1];
      if (btn) btn.click();
    }
  });

  // ---------- Khởi động ----------
  speech.init();
  if (useData(loadDataText())) useData(DEFAULT_DATA);
  renderMenu();
})();
