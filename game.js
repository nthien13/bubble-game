(() => {
  'use strict';

  const CH = window.GAME_CHARACTERS;
  const STORIES = window.GAME_STORIES;
  const LIBRARY = window.GAME_KANJI_LIBRARY;
  const STROKES = window.GAME_KANJI_STROKES || {};
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ---------- Cấu hình ----------
  const KEY_ON = 'bubble-game-kanji-on-v1';            // mảng chữ Hán đang bật (ON)
  const KEY_OLD_LIST = 'bubble-game-kanji-list-v3';    // danh sách chữ dạng chữ cũ: chỉ đọc để chuyển sang KEY_ON
  const KEY_PROGRESS = 'bubble-game-progress-v1';
  const DEFAULT_ON_LESSONS = ['L01', 'L02', 'L03', 'L04', 'L05']; // 39 chữ đã học khi làm thư viện
  const MAX_LIVES = 3;
  const POINTS = 10;
  const MIN_KANJI = 4;
  const ALL_STAGE_SIZE = 15;          // số câu của ô ぜんぶ
  const TIME_LIMIT_S = 60;
  const NIGATE_CLEAR_STREAK = 3;      // đúng liên tiếp 3 lần thì rời danh sách にがて
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
    ['先', '生', '青'], ['川', '小', '水'], ['八', '人', '入'], ['五', '王', '玉'], ['文', '父'],
    ['右', '左', '石', '名'], ['木', '林', '森', '本', '休', '村'], ['口', '中', '田', '日'], ['百', '白', '日'],
    ['夕', '名', '多'], ['草', '早'], ['力', '九', '刀'], ['虫', '中'], ['円', '内'], ['年', '午'], ['立', '音'],
    ['耳', '目', '貝'], ['土', '王', '上'], ['金', '全'], ['花', '化'], ['足', '早', '定'],
  ];
  const STAGE_MODES = ['yomi', 'erabi', 'sagashi'];
  const MODES = {
    yomi: { title: 'よみかた ふうせん', icon: 'comment-dots', desc: 'かんじの よみかたを えらぼう' },
    erabi: { title: 'かんじ えらび', icon: 'pencil', desc: 'ひらがなに あう かんじを えらぼう' },
    sagashi: { title: 'かんじ さがし', icon: 'ear-listen', desc: 'よく きいて ふうせんを わろう' },
    story: { title: 'おはなし', icon: 'book-open', desc: 'おはなしに かんじを いれよう' },
    time: { title: '60びょう チャレンジ', icon: 'stopwatch', desc: '60びょうで いくつ できるかな' },
    nigate: { title: 'にがて れんしゅう', icon: 'dumbbell', desc: 'まちがえた かんじを れんしゅう' },
  };

  // ---------- Biểu tượng (SVG nội tuyến, chạy offline) ----------
  // Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0)
  const ICONS = {
    'star': { w: 576, h: 512, d: 'M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z' },
    'star-empty': { w: 576, h: 512, d: 'M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z' },
    'heart': { w: 512, h: 512, d: 'M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z' },
    'heart-empty': { w: 512, h: 512, d: 'M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8l0-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3c4.2-4.8 8.7-9.2 13.5-13.3c3.7-3.2 7.5-6.2 11.5-9c0 0 0 0 0 0C313.1 47 353.4 37.9 392.8 45.4C462 58.6 512 119.1 512 189.5l0 3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20-.1-.1s0 0 0 0c-23.1-25.9-58-37.7-92-31.2C81.6 101.5 48 142.1 48 189.5l0 3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268c20.9-19.4 32.8-46.7 32.8-75.2l0-3.3c0-47.3-33.6-88-80.1-96.9c-34-6.5-69 5.4-92 31.2c0 0 0 0-.1 .1s0 0-.1 .1l-17.8 20c-.3 .4-.7 .7-1 1.1c-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z' },
    'book': { w: 448, h: 512, d: 'M96 0C43 0 0 43 0 96L0 416c0 53 43 96 96 96l288 0 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l0-64c17.7 0 32-14.3 32-32l0-320c0-17.7-14.3-32-32-32L384 0 96 0zm0 384l256 0 0 64L96 448c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-240c0-8.8 7.2-16 16-16l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16zm16 48l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z' },
    'book-open': { w: 576, h: 512, d: 'M249.6 471.5c10.8 3.8 22.4-4.1 22.4-15.5l0-377.4c0-4.2-1.6-8.4-5-11C247.4 52 202.4 32 144 32C93.5 32 46.3 45.3 18.1 56.1C6.8 60.5 0 71.7 0 83.8L0 454.1c0 11.9 12.8 20.2 24.1 16.5C55.6 460.1 105.5 448 144 448c33.9 0 79 14 105.6 23.5zm76.8 0C353 462 398.1 448 432 448c38.5 0 88.4 12.1 119.9 22.6c11.3 3.8 24.1-4.6 24.1-16.5l0-370.3c0-12.1-6.8-23.3-18.1-27.6C529.7 45.3 482.5 32 432 32c-58.4 0-103.4 20-123 35.6c-3.3 2.6-5 6.8-5 11L304 456c0 11.4 11.7 19.3 22.4 15.5z' },
    'volume-high': { w: 640, h: 512, d: 'M533.6 32.5C598.5 85.2 640 165.8 640 256s-41.5 170.7-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z' },
    'comment-dots': { w: 512, h: 512, d: 'M256 448c141.4 0 256-93.1 256-208S397.4 32 256 32S0 125.1 0 240c0 45.1 17.7 86.8 47.7 120.9c-1.9 24.5-11.4 46.3-21.4 62.9c-5.5 9.2-11.1 16.6-15.2 21.6c-2.1 2.5-3.7 4.4-4.9 5.7c-.6 .6-1 1.1-1.3 1.4l-.3 .3c0 0 0 0 0 0c0 0 0 0 0 0s0 0 0 0s0 0 0 0c-4.6 4.6-5.9 11.4-3.4 17.4c2.5 6 8.3 9.9 14.8 9.9c28.7 0 57.6-8.9 81.6-19.3c22.9-10 42.4-21.9 54.3-30.6c31.8 11.5 67 17.9 104.1 17.9zM128 208a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm128 0a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm96 32a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z' },
    'pencil': { w: 512, h: 512, d: 'M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1 0 32c0 8.8 7.2 16 16 16l32 0zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z' },
    'ear-listen': { w: 512, h: 512, d: 'M398.3 3.4c-15.8-7.9-35-1.5-42.9 14.3c-7.9 15.8-1.5 34.9 14.2 42.9l.4 .2c.4 .2 1.1 .6 2.1 1.2c2 1.2 5 3 8.7 5.6c7.5 5.2 17.6 13.2 27.7 24.2C428.5 113.4 448 146 448 192c0 17.7 14.3 32 32 32s32-14.3 32-32c0-66-28.5-113.4-56.5-143.7C441.6 33.2 427.7 22.2 417.3 15c-5.3-3.7-9.7-6.4-13-8.3c-1.6-1-3-1.7-4-2.2c-.5-.3-.9-.5-1.2-.7l-.4-.2-.2-.1c0 0 0 0-.1 0c0 0 0 0 0 0L384 32 398.3 3.4zM128.7 227.5c6.2-56 53.7-99.5 111.3-99.5c61.9 0 112 50.1 112 112c0 29.3-11.2 55.9-29.6 75.9c-17 18.4-34.4 45.1-34.4 78l0 6.1c0 26.5-21.5 48-48 48c-17.7 0-32 14.3-32 32s14.3 32 32 32c61.9 0 112-50.1 112-112l0-6.1c0-9.8 5.4-21.7 17.4-34.7C398.3 327.9 416 286 416 240c0-97.2-78.8-176-176-176C149.4 64 74.8 132.5 65.1 220.5c-1.9 17.6 10.7 33.4 28.3 35.3s33.4-10.7 35.3-28.3zM32 512a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM192 352a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0zM208 240c0-17.7 14.3-32 32-32s32 14.3 32 32c0 13.3 10.7 24 24 24s24-10.7 24-24c0-44.2-35.8-80-80-80s-80 35.8-80 80c0 13.3 10.7 24 24 24s24-10.7 24-24z' },
    'stopwatch': { w: 448, h: 512, d: 'M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z' },
    'dumbbell': { w: 640, h: 512, d: 'M96 64c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 160 0 64 0 160c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-64-32 0c-17.7 0-32-14.3-32-32l0-64c-17.7 0-32-14.3-32-32s14.3-32 32-32l0-64c0-17.7 14.3-32 32-32l32 0 0-64zm448 0l0 64 32 0c17.7 0 32 14.3 32 32l0 64c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 64c0 17.7-14.3 32-32 32l-32 0 0 64c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-160 0-64 0-160c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32zM416 224l0 64-192 0 0-64 192 0z' },
    'lock': { w: 448, h: 512, d: 'M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z' },
    'dragon': { w: 640, h: 512, d: 'M352 124.5l-51.9-13c-6.5-1.6-11.3-7.1-12-13.8s2.8-13.1 8.7-16.1l40.8-20.4L294.4 28.8c-5.5-4.1-7.8-11.3-5.6-17.9S297.1 0 304 0L416 0l32 0 16 0c30.2 0 58.7 14.2 76.8 38.4l57.6 76.8c6.2 8.3 9.6 18.4 9.6 28.8c0 26.5-21.5 48-48 48l-21.5 0c-17 0-33.3-6.7-45.3-18.7L480 160l-32 0 0 21.5c0 24.8 12.8 47.9 33.8 61.1l106.6 66.6c32.1 20.1 51.6 55.2 51.6 93.1C640 462.9 590.9 512 530.2 512L496 512l-64 0L32.3 512c-3.3 0-6.6-.4-9.6-1.4C13.5 507.8 6 501 2.4 492.1C1 488.7 .2 485.2 0 481.4c-.2-3.7 .3-7.3 1.3-10.7c2.8-9.2 9.6-16.7 18.6-20.4c3-1.2 6.2-2 9.5-2.2L433.3 412c8.3-.7 14.7-7.7 14.7-16.1c0-4.3-1.7-8.4-4.7-11.4l-44.4-44.4c-30-30-46.9-70.7-46.9-113.1l0-45.5 0-57zM512 72.3c0-.1 0-.2 0-.3s0-.2 0-.3l0 .6zm-1.3 7.4L464.3 68.1c-.2 1.3-.3 2.6-.3 3.9c0 13.3 10.7 24 24 24c10.6 0 19.5-6.8 22.7-16.3zM130.9 116.5c16.3-14.5 40.4-16.2 58.5-4.1l130.6 87 0 27.5c0 32.8 8.4 64.8 24 93l-232 0c-6.7 0-12.7-4.2-15-10.4s-.5-13.3 4.6-17.7L171 232.3 18.4 255.8c-7 1.1-13.9-2.6-16.9-9s-1.5-14.1 3.8-18.8L130.9 116.5z' },
    'flag-checkered': { w: 448, h: 512, d: 'M32 0C49.7 0 64 14.3 64 32l0 16 69-17.2c38.1-9.5 78.3-5.1 113.5 12.5c46.3 23.2 100.8 23.2 147.1 0l9.6-4.8C423.8 28.1 448 43.1 448 66.1l0 279.7c0 13.3-8.3 25.3-20.8 30l-34.7 13c-46.2 17.3-97.6 14.6-141.7-7.4c-37.9-19-81.3-23.7-122.5-13.4L64 384l0 96c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-80 0-66L0 64 0 32C0 14.3 14.3 0 32 0zM64 187.1l64-13.9 0 65.5L64 252.6 64 318l48.8-12.2c5.1-1.3 10.1-2.4 15.2-3.3l0-63.9 38.9-8.4c8.3-1.8 16.7-2.5 25.1-2.1l0-64c13.6 .4 27.2 2.6 40.4 6.4l23.6 6.9 0 66.7-41.7-12.3c-7.3-2.1-14.8-3.4-22.3-3.8l0 71.4c21.8 1.9 43.3 6.7 64 14.4l0-69.8 22.7 6.7c13.5 4 27.3 6.4 41.3 7.4l0-64.2c-7.8-.8-15.6-2.3-23.2-4.5l-40.8-12 0-62c-13-3.8-25.8-8.8-38.2-15c-8.2-4.1-16.9-7-25.8-8.8l0 72.4c-13-.4-26 .8-38.7 3.6L128 173.2 128 98 64 114l0 73.1zM320 335.7c16.8 1.5 33.9-.7 50-6.8l14-5.2 0-71.7-7.9 1.8c-18.4 4.3-37.3 5.7-56.1 4.5l0 77.4zm64-149.4l0-70.8c-20.9 6.1-42.4 9.1-64 9.1l0 69.4c13.9 1.4 28 .5 41.7-2.6l22.3-5.2z' },
    'circle-empty': { w: 512, h: 512, d: 'M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z' },
  };
  // Trả về chuỗi SVG tin cậy; chỉ dùng tên icon cố định, không ghép dữ liệu người dùng
  function icon(name, cls = '') {
    const ic = ICONS[name];
    if (!ic) return '';
    return `<svg class="fa-icon${cls ? ` ${cls}` : ''}" viewBox="0 0 ${ic.w} ${ic.h}" aria-hidden="true" focusable="false"><path fill="currentColor" d="${ic.d}"/></svg>`;
  }
  // Hàng 3 ngôi sao: sao đặc = đã đạt, sao rỗng = chưa đạt
  const starsHtml = (n) => icon('star', 'star-on').repeat(n) + icon('star-empty', 'star-off').repeat(3 - n);
  // Thay các chỗ giữ chỗ <span data-icon="..."> trong index.html bằng SVG
  function hydrateIcons(rootNode) {
    rootNode.querySelectorAll('[data-icon]').forEach((node) => {
      node.outerHTML = icon(node.dataset.icon, node.className);
    });
  }

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    screens: {
      menu: $('screen-menu'), parent: $('screen-parent'), map: $('screen-map'), game: $('screen-game'),
      story: $('screen-story'), result: $('screen-result'), zukan: $('screen-zukan'),
    },
    menuBuddy: $('menu-buddy'), menuStars: $('menu-stars'), menuModes: $('menu-modes'),
    parentList: $('parent-list'), parentCount: $('parent-count'), parentMsg: $('parent-msg'),
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
  // Ưu tiên giọng Soniox qua server.js (GET /api/tts). Không có server (mở bằng file://,
  // thiếu SONIOX_API_KEY, mất mạng...) thì quay về speechSynthesis của trình duyệt.
  const TTS_URL = 'api/tts';
  const TTS_FETCH_MS = 8000;          // quá lâu thì đọc bằng giọng trình duyệt cho câu đó
  const TTS_MEMO_MAX = 120;           // số câu giữ sẵn trong bộ nhớ (blob URL)
  // wav im lặng rất ngắn, phát trong thao tác chạm để iOS/Safari cho phép phát audio sau đó
  const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

  const speech = {
    supported: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    voice: null,
    token: 0,
    // Soniox: null = chưa biết, true = dùng được, false = không dùng được (dùng giọng trình duyệt)
    cloud: /^https?:$/.test(location.protocol) && typeof Audio === 'function' && 'fetch' in window ? null : false,
    audio: null,
    audioUnlocked: false,
    memo: new Map(),                  // text -> Promise<blob URL>
    finishAudio: null,                // kết thúc câu Soniox đang phát (dùng khi stop)
    onchange: null,

    init() {
      if (this.cloud !== false) {
        this.audio = new Audio();
        this.audio.preload = 'auto';
        this.checkCloud();
      }
      if (!this.supported) return;
      const pickVoice = () => {
        const voices = speechSynthesis.getVoices();
        this.voice = voices.find((v) => /^ja/i.test(v.lang)) || null;
        if (this.onchange) this.onchange();
      };
      pickVoice();
      speechSynthesis.addEventListener('voiceschanged', pickVoice);
    },

    setCloud(ok) {
      if (this.cloud === ok) return;
      this.cloud = ok;
      if (this.onchange) this.onchange();
    },

    // Hỏi server đã có SONIOX_API_KEY chưa (không tốn tiền Soniox).
    checkCloud() {
      fetch(`${TTS_URL}/status`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((d) => this.setCloud(!!(d && d.ready)))
        .catch(() => this.setCloud(false));
    },

    // Safari chỉ cho đọc sau thao tác của người dùng: gọi trong sự kiện click.
    unlock() {
      // trước đó server chưa có khoá (hoặc lỗi): hỏi lại, để không bị kẹt ở giọng trình duyệt
      if (this.audio && this.cloud === false) {
        this.setCloud(null);
        this.checkCloud();
      }
      if (this.audio && !this.audioUnlocked) {
        this.audioUnlocked = true;
        const a = this.audio;
        a.src = SILENT_WAV;
        const p = a.play();
        if (p && p.catch) p.catch((e) => { if (e && e.name === 'NotAllowedError') this.audioUnlocked = false; });
      }
      if (!this.supported) return;
      speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    },

    stop() {
      this.token += 1;
      if (this.finishAudio) this.finishAudio();
      if (this.supported) speechSynthesis.cancel();
    },

    // Lấy (và nhớ) audio của 1 câu. Lỗi thì trả về Promise bị reject.
    fetchAudio(text) {
      let job = this.memo.get(text);
      if (job) {
        this.memo.delete(text);       // đưa lên cuối = mới dùng gần đây
        this.memo.set(text, job);
        return job;
      }
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, TTS_FETCH_MS);
      job = fetch(`${TTS_URL}?text=${encodeURIComponent(text)}`, ctrl ? { signal: ctrl.signal } : {})
        .then((res) => {
          if (!res.ok) {
            // 404: không có server.js, 503: server thiếu khoá -> thôi dùng Soniox
            if (res.status === 404 || res.status === 503) this.setCloud(false);
            throw new Error(`tts ${res.status}`);
          }
          return res.blob();
        })
        .then((blob) => {
          if (this.cloud === null) this.setCloud(true);
          return URL.createObjectURL(blob);
        })
        .finally(() => clearTimeout(timer));
      job.catch(() => { if (this.memo.get(text) === job) this.memo.delete(text); });
      this.memo.set(text, job);
      while (this.memo.size > TTS_MEMO_MAX) {
        const [oldText, oldJob] = this.memo.entries().next().value;
        this.memo.delete(oldText);
        oldJob.then((u) => setTimeout(() => URL.revokeObjectURL(u), 30000), () => {});
      }
      return job;
    },

    // Tải trước câu sắp đọc để không phải chờ.
    prefetch(text) {
      if (text && this.cloud !== false) this.fetchAudio(text).catch(() => {});
    },

    say(text, token) {
      if (!text || token !== this.token) return Promise.resolve();
      if (this.cloud === false) return this.sayLocal(text, token);
      return this.fetchAudio(text).then(
        (src) => (token === this.token ? this.playAudio(src, text, token) : undefined),
        () => this.sayLocal(text, token),
      );
    },

    // Phát audio Soniox; Promise xong khi đọc hết, bị stop(), hoặc lỗi (lỗi thì đọc bằng giọng trình duyệt).
    playAudio(src, text, token) {
      return new Promise((resolve) => {
        const a = this.audio;
        let done = false;
        let fallback = 0;
        const cleanup = () => {
          clearTimeout(fallback);
          a.onended = null;
          a.onerror = null;
          a.onloadedmetadata = null;
          if (this.finishAudio === finish) this.finishAudio = null;
        };
        const finish = () => {
          if (done) return;
          done = true;
          cleanup();
          a.pause();
          resolve();
        };
        const failToLocal = () => {
          if (done) return;
          done = true;
          cleanup();
          this.sayLocal(text, token).then(resolve);
        };
        // phòng khi không có sự kiện ended
        const arm = (ms) => {
          clearTimeout(fallback);
          fallback = setTimeout(finish, ms);
        };
        arm(4000 + text.length * 400);
        a.onloadedmetadata = () => { if (isFinite(a.duration)) arm(a.duration * 1000 + 1500); };
        a.onended = finish;
        a.onerror = failToLocal;
        this.finishAudio = finish;
        a.src = src;
        const p = a.play();
        if (p && p.catch) p.catch((e) => { if (e && e.name !== 'AbortError') failToLocal(); });
      });
    },

    // Giọng có sẵn của trình duyệt (dự phòng khi không có Soniox).
    sayLocal(text, token) {
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
      if (this.cloud !== false) return ''; // Soniox dùng được (hoặc đang kiểm tra)
      if (!this.supported) return 'この がめんでは こえが でません。';
      if (!this.voice) return 'にほんごの こえが ありません。おうちの ひとに たのんでね。';
      return '';
    },
  };

  // ---------- Dữ liệu chữ Hán ----------
  // lib: cả 80 chữ của thư viện (kanji-library.js). data: chỉ các chữ đang bật (ON); game chỉ dùng data.
  function buildLibrary(src) {
    const lessons = [];
    const kanjiMap = new Map();
    src.forEach((l, index) => {
      const lesson = { id: l.id, title: l.title, index, kanji: [] };
      l.kanji.forEach((item) => {
        const k = {
          kanji: item.k, on: item.on || [], kun: item.kun || [], meaning: item.mean || '',
          lesson: l.id, questions: [],
        };
        k.readings = [...k.on, ...k.kun];
        (item.ex || []).forEach(([sentence, answer]) => {
          const at = sentence.indexOf(k.kanji);
          if (at < 0 || !answer) return;
          if (!k.readings.includes(answer)) k.readings.push(answer);
          const q = {
            key: `${k.kanji}|${sentence}`, // giữ dạng khoá cũ để danh sách にがて cũ vẫn dùng được
            kanji: k.kanji,
            sentence,
            before: sentence.slice(0, at),
            after: sentence.slice(at + k.kanji.length),
            answer,
          };
          if (!k.questions.some((x) => x.key === q.key)) k.questions.push(q);
        });
        // Chữ không có câu ví dụ: mỗi cách đọc là 1 câu hỏi chỉ có chữ đó
        if (!k.questions.length) {
          k.readings.forEach((r) => k.questions.push({ key: `${k.kanji}|${r}`, kanji: k.kanji, sentence: '', before: '', after: '', answer: r }));
        }
        kanjiMap.set(k.kanji, k);
        lesson.kanji.push(k);
      });
      lessons.push(lesson);
    });
    const all = [...kanjiMap.values()];
    return {
      lessons,
      kanjiMap,
      order: all.map((k) => k.kanji),
      allReadings: [...new Set(all.flatMap((k) => k.readings))],
      lessonIndex: new Map(lessons.map((l) => [l.id, l.index])),
    };
  }
  const lib = buildLibrary(LIBRARY);
  const DEFAULT_ON = lib.lessons.filter((l) => DEFAULT_ON_LESSONS.includes(l.id)).flatMap((l) => l.kanji.map((k) => k.kanji));

  // Bài không còn chữ ON thì ẩn; câu hỏi và lựa chọn chỉ lấy từ chữ ON.
  function buildData(list) {
    const on = new Set(list);
    const lessons = lib.lessons
      .map((l) => ({ ...l, kanji: l.kanji.filter((k) => on.has(k.kanji)) }))
      .filter((l) => l.kanji.length);
    const kanjiMap = new Map([...lib.kanjiMap].filter(([c]) => on.has(c)));
    const questions = [...kanjiMap.values()].flatMap((k) => k.questions);
    return {
      lessons,
      kanjiMap,
      questions,
      allReadings: [...new Set([...kanjiMap.values()].flatMap((k) => k.readings))],
      questionMap: new Map(questions.map((q) => [q.key, q])),
    };
  }

  // ---------- Chữ đang bật (ON) ----------
  let onList = [];
  let data = null;
  let migrateNote = '';    // báo cho phụ huynh khi chuyển danh sách cũ có chữ bị bỏ

  const libOrder = (c) => lib.order.indexOf(c);
  const sortByLibrary = (list) => [...new Set(list)].filter((c) => lib.kanjiMap.has(c)).sort((a, b) => libOrder(a) - libOrder(b));

  function saveOnList() {
    try { localStorage.setItem(KEY_ON, JSON.stringify(onList)); } catch { /* bỏ qua khi trình duyệt chặn lưu */ }
  }

  // Lấy chữ Hán (cột đầu) từ danh sách dạng chữ cũ: "chữ | cách đọc | ...", dòng # là tên bài.
  function oldListKanji(text) {
    const out = [];
    String(text).split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      const c = line.split(/[|｜\t]/)[0].trim();
      if (c && !out.includes(c)) out.push(c);
    });
    return out;
  }

  // Thứ tự ưu tiên: KEY_ON đã lưu -> chuyển từ KEY_OLD_LIST (lần đầu) -> 39 chữ mặc định.
  function loadOnList() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY_ON) || 'null');
      if (Array.isArray(saved)) {
        const list = sortByLibrary(saved.filter((c) => typeof c === 'string'));
        if (list.length >= MIN_KANJI) return list;
      }
    } catch { /* dữ liệu hỏng thì làm lại từ đầu */ }

    let list = DEFAULT_ON;
    let old = null;
    try { old = localStorage.getItem(KEY_OLD_LIST); } catch { /* không đọc được thì bỏ qua */ }
    if (old) {
      const chars = oldListKanji(old);
      const kept = sortByLibrary(chars);
      const dropped = chars.filter((c) => !lib.kanjiMap.has(c));
      if (kept.length >= MIN_KANJI) {
        list = kept;
        if (dropped.length) migrateNote = `まえの リストの ${dropped.join('、')} は ない かんじなので はずしました。`;
      } else {
        migrateNote = `まえの リストの かんじが ${MIN_KANJI}こ より すくないので、はじめの かんじに しました。`;
      }
      if (migrateNote) console.info(`[kanji] ${migrateNote}`);
    }
    onList = sortByLibrary(list);
    saveOnList();
    return onList;
  }

  function setOnList(list) {
    onList = sortByLibrary(list);
    saveOnList();
    data = buildData(onList);
  }

  // Ô trống trong truyện: 〔chữ Hán:cách đọc〕
  const BLANK_RE = /〔(.+?):(.+?)〕/g;
  const storyKanji = (story) => [...new Set(story.pages.flatMap((p) => [...p.matchAll(BLANK_RE)].map((m) => m[1])))];
  // Truyện chỉ hiện khi mọi chữ trong ô trống đều đang ON
  const visibleStories = () => STORIES.filter((s) => storyKanji(s).every((c) => data.kanjiMap.has(c)));

  // ---------- Tiến độ ----------
  // Sao lưu theo id bài ('L01'...) và 'all'; sao truyện lưu theo lesson của truyện.
  const emptyProgress = () => ({ stars: { yomi: {}, erabi: {}, sagashi: {}, story: {} }, best60: 0, readOk: {}, weak: {} });

  // Bản cũ lưu sao theo số thứ tự (0, 1, ...): bài i -> lib.lessons[i].id, truyện i -> STORIES[i].lesson.
  function migrateStars(p) {
    let changed = false;
    Object.keys(p.stars).forEach((mode) => {
      const m = p.stars[mode];
      if (!m || typeof m !== 'object') {
        p.stars[mode] = {};
        return;
      }
      Object.keys(m).forEach((key) => {
        if (!/^\d+$/.test(key)) return;
        const i = Number(key);
        const target = mode === 'story' ? STORIES[i] && STORIES[i].lesson : lib.lessons[i] && lib.lessons[i].id;
        if (target === undefined) return; // không biết thuộc bài nào thì giữ nguyên, không làm mất sao
        m[target] = Math.max(m[target] || 0, Number(m[key]) || 0);
        delete m[key];
        changed = true;
      });
    });
    return changed;
  }

  function loadProgress() {
    const base = emptyProgress();
    try {
      const saved = JSON.parse(localStorage.getItem(KEY_PROGRESS) || 'null');
      if (saved) {
        const p = { ...base, ...saved, stars: { ...base.stars, ...(saved.stars || {}) } };
        if (!p.readOk || typeof p.readOk !== 'object') p.readOk = {};
        if (!p.weak || typeof p.weak !== 'object') p.weak = {};
        if (migrateStars(p)) {
          try { localStorage.setItem(KEY_PROGRESS, JSON.stringify(p)); } catch { /* bỏ qua khi trình duyệt chặn lưu */ }
        }
        return p;
      }
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
  // Chỉ lấy câu của chữ đang ON; chữ OFF vẫn giữ trong progress.weak để bật lại thì còn
  const weakQuestions = () => Object.keys(progress.weak).map((key) => data.questionMap.get(key)).filter(Boolean);

  // Chỉ xét các ô đang hiện: ô mở khi là ô đầu, hoặc ô hiện ngay trước có ít nhất 1 sao trong cùng cách chơi
  function tileKeys(mode) {
    if (mode === 'story') return visibleStories().map((s) => s.lesson);
    return [...data.lessons.map((l) => l.id), 'all'];
  }
  function isUnlocked(mode, key) {
    const keys = tileKeys(mode);
    const idx = keys.indexOf(key);
    if (idx <= 0) return true;
    return (progress.stars[mode][keys[idx - 1]] || 0) >= 1;
  }

  // Nhân vật của bài thành bạn khi bài đó (hoặc truyện của bài) có sao, kể cả bài đang ẩn
  function unlockedCharacters() {
    const ids = [];
    const hasStar = (key) => STAGE_MODES.some((m) => (progress.stars[m][key] || 0) > 0) || (progress.stars.story[key] || 0) > 0;
    lib.lessons.forEach((l) => {
      const id = lessonCharId(l.id);
      if (hasStar(l.id) && !ids.includes(id)) ids.push(id);
    });
    if (hasStar('all')) ids.push(CH.boss);
    return ids;
  }

  // ---------- Nhân vật, phông nền ----------
  const lessonNo = (key) => lib.lessonIndex.get(key) || 0;
  const lessonCharId = (key) => (key === 'all' ? CH.boss : CH.lessonOrder[lessonNo(key) % CH.lessonOrder.length]);
  const lessonBg = (key) => (key === 'all' ? CH.bossBackground : CH.lessonBackgrounds[lessonNo(key) % CH.lessonBackgrounds.length]);

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

  // Câu đầy đủ để đọc: chữ Hán thay bằng cách đọc đúng. Giọng chỉ đọc nguyên câu, không đọc từng phần.
  const fullText = (q) => q.before + q.answer + q.after;

  // Hiện câu nhưng không đọc (đọc trước khi trả lời sẽ lộ cách đọc); tải trước câu đầy đủ để đọc sau khi trả lời.
  function showSilent(q) {
    speech.stop();
    readerTalk(gameReader, false);
    readerMood(gameReader, null);
    renderSentence(q, q.kanji, 'is-muted');
    speech.prefetch(fullText(q));
  }

  // Đọc cả câu, hiện slotText ở chỗ chữ Hán.
  function readFull(q, mood, slotText, slotClass) {
    speech.stop();
    const token = speech.token;
    readerMood(gameReader, mood);
    renderSentence(q, slotText, slotClass);
    readerTalk(gameReader, true);
    return speech.say(fullText(q), token).then(() => {
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

  function readingChoices(q) {
    const k = data.kanjiMap.get(q.kanji) || lib.kanjiMap.get(q.kanji);
    const own = new Set(k.readings);
    // có câu ví dụ: cách đọc khác của chính chữ đó là lựa chọn sai đặt trước (はち so với はっ)
    const ownOthers = q.sentence ? shuffle(k.readings.filter((r) => r !== q.answer)).slice(0, 2) : [];
    // cùng kiểu chữ (ひらがな/カタカナ) với đáp án đặt trước
    const byScript = (list) => [
      ...list.filter((r) => isKatakana(r) === isKatakana(q.answer)),
      ...list.filter((r) => isKatakana(r) !== isKatakana(q.answer)),
    ];
    const pool = shuffle(data.allReadings.filter((r) => !own.has(r)));
    // ít chữ ON quá thì mượn cách đọc của các chữ khác trong thư viện
    const extra = shuffle(lib.allReadings.filter((r) => !own.has(r) && !pool.includes(r)));
    const wrongs = [...ownOthers, ...byScript(pool), ...byScript(extra)].slice(0, 3);
    return shuffle([q.answer, ...wrongs]).map((t) => ({ text: t, ok: t === q.answer }));
  }

  // Lựa chọn sai khi chọn chữ Hán: ưu tiên chữ cùng âm, chữ trông giống, chữ cùng bài.
  // Không có câu ví dụ thì bỏ chữ cùng âm, vì khi đó không phân biệt được.
  // Lấy từ chữ ON trước; thiếu thì mượn chữ trong thư viện.
  function kanjiDistractors(target, reading, count, lesson, allowSameReading) {
    const rank = (map) => {
      const all = [...map.keys()].filter((c) => c !== target);
      const sameReading = all.filter((c) => map.get(c).readings.includes(reading));
      const usable = allowSameReading ? all : all.filter((c) => !sameReading.includes(c));
      const similar = SIMILAR.filter((g) => g.includes(target)).flat().filter((c) => usable.includes(c));
      const sameLesson = usable.filter((c) => map.get(c).lesson === lesson);
      return [...(allowSameReading ? shuffle(sameReading) : []), ...shuffle(similar), ...shuffle(sameLesson), ...shuffle(usable)];
    };
    const out = [];
    const add = (list) => {
      for (const c of list) {
        if (out.length >= count) break;
        if (!out.includes(c)) out.push(c);
      }
    };
    add(rank(data.kanjiMap));
    if (out.length < count) add(rank(lib.kanjiMap));
    return out;
  }

  function kanjiChoices(q) {
    const k = lib.kanjiMap.get(q.kanji);
    const wrongs = kanjiDistractors(q.kanji, q.answer, 3, k.lesson, !!q.sentence);
    return shuffle([q.kanji, ...wrongs]).map((c) => ({ text: c, ok: c === q.kanji }));
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
      card.querySelector('.mode-icon').innerHTML = icon(m.icon);
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
    // Số trên ô là số bài trong thư viện (bài ẩn thì số bị nhảy, để khớp với sách)
    const tiles = mode === 'story'
      ? visibleStories().map((s) => ({
        key: s.lesson, num: s.lesson === 'all' ? 'ぜんぶ' : String(lessonNo(s.lesson) + 1), label: s.title, charId: s.character,
      }))
      : [
        ...data.lessons.map((l) => ({ key: l.id, num: String(l.index + 1), label: l.title, charId: lessonCharId(l.id) })),
        { key: 'all', num: 'ぜんぶ', label: 'ぜんぶの かんじ', charId: CH.boss },
      ];
    if (!tiles.length) {
      const p = document.createElement('p');
      p.className = 'map-empty';
      p.textContent = 'おはなしは まだ ないよ。';
      el.mapGrid.append(p);
    }
    tiles.forEach((t) => {
      const open = isUnlocked(mode, t.key);
      const stars = progress.stars[mode][t.key] || 0;
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'map-tile';
      tile.disabled = !open;
      tile.innerHTML = '<span class="tile-num"></span><span class="tile-char"></span><span class="tile-label"></span><span class="tile-stars"></span>';
      tile.querySelector('.tile-num').textContent = t.num;
      tile.querySelector('.tile-char').innerHTML = open ? staticChar(t.charId, false) : icon('lock', 'tile-lock');
      tile.querySelector('.tile-label').textContent = t.label;
      tile.querySelector('.tile-stars').innerHTML = starsHtml(stars);
      tile.addEventListener('click', () => (mode === 'story' ? startStory(t.key) : startRun(mode, t.key)));
      el.mapGrid.append(tile);
    });
    showScreen('map');
  }

  // ---------- Chơi với bóng bay ----------
  function startRun(mode, lessonKey) {
    stopRun();
    const lesson = STAGE_MODES.includes(mode) && lessonKey !== 'all' ? data.lessons.find((l) => l.id === lessonKey) : null;
    // bài vừa bị tắt hết chữ (ví dụ bấm もういちど sau khi phụ huynh đổi ON) thì về menu
    if (STAGE_MODES.includes(mode) && lessonKey !== 'all' && !lesson) {
      renderMenu();
      return;
    }
    speech.unlock();
    lastStart = { mode, key: lessonKey };
    const r = newRun({
      kind: 'balloon', mode, lessonKey,
      lives: MAX_LIVES, score: 0, mistakes: 0, solved: 0, total: 0,
      missed: new Map(), balloons: [], queue: [], pool: [],
      phase: 'idle', current: null, timeLeft: TIME_LIMIT_S, replay: null,
    });

    if (mode === 'time') {
      const openLessons = data.lessons.map((l) => l.id).filter((id) => isUnlocked('yomi', id));
      r.pool = data.questions.filter((q) => openLessons.includes(data.kanjiMap.get(q.kanji).lesson));
      if (!r.pool.length) r.pool = data.questions.slice();
    } else if (mode === 'nigate') {
      r.queue = shuffle(weakQuestions());
      r.total = r.queue.length;
    } else {
      const kanjiList = lessonKey === 'all'
        ? shuffle([...data.kanjiMap.values()]).slice(0, ALL_STAGE_SIZE)
        : lesson.kanji;
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
    if (r.mode === 'time') el.lives.innerHTML = `${icon('stopwatch', 'timer-icon')} ${Number(r.timeLeft)}`;
    else if (r.mode === 'nigate') el.lives.textContent = '';
    else {
      el.lives.innerHTML = Array.from({ length: MAX_LIVES }, (_, i) =>
        i < r.lives ? `<span class="heart">${icon('heart')}</span>` : `<span class="heart lost">${icon('heart-empty')}</span>`).join('');
    }
    el.progress.hidden = r.mode === 'time';
    const boss = r.lessonKey === 'all' && STAGE_MODES.includes(r.mode);
    el.progress.classList.toggle('is-boss', boss);
    const done = r.total ? r.solved / r.total : 0;
    el.progressFill.style.width = `${(boss ? 1 - done : done) * 100}%`;
    el.progressIcon.innerHTML = boss ? icon('dragon') : icon('flag-checkered');
  }

  function riseMs(type) {
    const r = run;
    let ms;
    if (r.mode === 'time') ms = TIME_RISE_MS;
    else if (r.mode === 'nigate') ms = NIGATE_RISE_MS;
    else if (r.lessonKey === 'all') ms = Math.max(ALL_MIN_MS, ALL_RISE_MS - r.solved * ALL_STEP_MS);
    else ms = LESSON_RISE_MS[Math.min(lessonNo(r.lessonKey), LESSON_RISE_MS.length - 1)];
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
    // よみかた: đọc câu sẽ lộ đáp án, nên im lặng đến khi trả lời xong và tắt nút nghe lại.
    // かんじ えらび: âm thanh là đề bài (đáp án là chữ Hán), đọc nguyên câu ngay.
    if (type === 'yomi') {
      setReplay(null);
      showSilent(q);
    } else {
      setReplay(() => readFull(q, null, q.answer, 'is-kana'));
      r.replay();
    }
  }

  // Gắn hàm cho nút nghe lại; không có thì tắt nút.
  function setReplay(fn) {
    run.replay = fn;
    $('btn-game-replay').disabled = !fn;
  }

  // かんじ さがし: 4 bóng chữ Hán bay lên từ dưới, bấm bóng đúng
  function spawnSagashi(q) {
    const r = run;
    el.choices.innerHTML = '<p class="choices-hint">ただしい かんじの ふうせんを タッチ！</p>';
    el.choices.classList.remove('is-kanji');
    const k = lib.kanjiMap.get(q.kanji);
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
    setReplay(() => readFull(q, null, '？', 'is-hidden'));
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
    resolveWrong({ text: b.kanji });
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
    floatLabel(el.stage, slotAnswer(q, type), cx, cy, false, 'circle-empty');
    charReact(el.buddy, 'good', 1000);
    const spoken = readFull(q, 'is-right', slotAnswer(q, type), 'is-right');
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
    // Chọn sai: chỉ báo bằng hình (không đọc câu lẫn âm sai), câu đang đọc (nếu có) vẫn đọc tiếp
    readerMood(gameReader, 'is-wrong');
    renderSentence(q, choice.text, 'is-wrong');
    if (!STAGE_MODES.includes(r.mode)) return;

    r.lives -= 1;
    renderHud();
    if (r.lives <= 0) {
      r.phase = 'ending';
      cancelAnimationFrame(r.rafId);
      lockChoices(true);
      // hết mạng: lộ đáp án, đọc nguyên câu đúng một lần
      const spoken = readFull(q, 'is-wrong', slotAnswer(q, type), 'is-reveal');
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
    const spoken = readFull(q, 'is-wrong', slotAnswer(q, type), 'is-reveal');

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

  function floatLabel(stage, text, x, y, isMiss, iconName) {
    const label = document.createElement('div');
    label.className = 'float-label' + (isMiss ? ' is-miss' : '');
    label.textContent = text;
    // text là dữ liệu nên giữ textContent; icon (chuỗi SVG cố định) chèn riêng phía sau
    if (iconName) label.insertAdjacentHTML('beforeend', ` ${icon(iconName, 'label-icon')}`);
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
    el.resultStars.innerHTML = stars ? starsHtml(stars) : '';
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
    const re = new RegExp(BLANK_RE.source, 'g');
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) segs.push({ type: 'text', text: text.slice(last, m.index) });
      segs.push({ type: 'blank', kanji: m[1], reading: m[2], filled: false });
      last = m.index + m[0].length;
    }
    if (last < text.length) segs.push({ type: 'text', text: text.slice(last) });
    return segs;
  }

  // key = lesson của truyện ('L01'... hoặc 'all')
  function startStory(key) {
    stopRun();
    const story = visibleStories().find((s) => s.lesson === key);
    if (!story) {
      renderMenu();
      return;
    }
    speech.unlock();
    lastStart = { mode: 'story', key };
    newRun({ kind: 'story', mode: 'story', storyKey: key, story, page: 0, mistakes: 0, missed: new Map(), segments: [], active: null, chunk: '' });
    mountCharacter(el.storyChar, story.character);
    applyBackground(el.storyStage, lessonBg(story.lesson));
    el.storyTitle.textContent = story.title;
    showVoiceNote();
    showScreen('story');
    openPage(0);
  }

  function openPage(i) {
    const r = run;
    r.page = i;
    r.segments = parseStoryPage(r.story.pages[i]);
    r.chunk = pageText(r.segments);
    r.active = null;
    el.storyPage.textContent = `${i + 1} / ${r.story.pages.length}`;
    el.tray.innerHTML = '';
    renderStoryText();
    // tải trước trang này và trang sau
    speech.prefetch(r.chunk);
    if (i + 1 < r.story.pages.length) speech.prefetch(pageText(parseStoryPage(r.story.pages[i + 1])));
    later(readPage, 500);
  }

  // Cả trang để đọc, ô trống thay bằng cách đọc đúng.
  const pageText = (segs) => segs.map((s) => (s.type === 'text' ? s.text : s.reading)).join('');

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

  // Đọc nguyên trang (nguyên câu, có cả cách đọc của ô trống) rồi mới hỏi.
  // Đáp án là thẻ chữ Hán nên nghe cách đọc không lộ đáp án (giống かんじ さがし).
  async function readPage() {
    const r = run;
    if (!r || r.kind !== 'story') return;
    speech.stop();
    const token = speech.token;
    readerMood(storyReader, null);
    readerTalk(storyReader, true);
    await speech.say(r.chunk, token);
    if (run !== r || token !== speech.token) return;
    readerTalk(storyReader, false);
    askBlank();
  }

  // Hỏi ô trống chưa điền đầu tiên (không đọc gì thêm); điền hết thì sang trang sau.
  function askBlank() {
    const r = run;
    const i = r.segments.findIndex((s) => s.type === 'blank' && !s.filled);
    if (i >= 0) {
      r.active = i;
      readerMood(storyReader, null);
      storyReader.el.classList.add('is-hush');
      renderStoryText();
      showTray(r.segments[i]);
      return;
    }
    later(() => {
      if (r.page + 1 < r.story.pages.length) openPage(r.page + 1);
      else finishStory();
    }, 900);
  }

  function showTray(seg) {
    const lesson = run.story.lesson === 'all' ? null : run.story.lesson;
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
      askBlank();
      return;
    }

    // Thả sai: chỉ báo bằng hình (không đọc), thẻ bị khoá, lát sau ô trống trở lại như cũ
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
    const blankIndex = r.active;
    later(() => {
      if (r.active !== blankIndex) return;
      storyReader.el.classList.add('is-hush');
      renderStoryText();
    }, 900);
  }

  function finishStory() {
    const r = run;
    const before = unlockedCharacters();
    stopRun();
    const stars = starsFor(r.mistakes);
    progress.stars.story[r.storyKey] = Math.max(progress.stars.story[r.storyKey] || 0, stars);
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
  // Danh sách 80 chữ theo bài; mỗi chữ là 1 nút bật/tắt (aria-pressed). Đổi là lưu ngay.
  function parentMessage(text, ok) {
    el.parentMsg.textContent = text;
    el.parentMsg.classList.toggle('is-ok', !!ok);
  }

  function openParent() {
    renderParent();
    parentMessage(migrateNote, false);
    migrateNote = '';
    showScreen('parent');
  }

  function renderParent() {
    el.parentList.innerHTML = '';
    lib.lessons.forEach((l) => {
      const box = document.createElement('section');
      box.className = 'parent-lesson';
      box.innerHTML = '<div class="parent-lesson-head"><h2 class="parent-lesson-title"></h2>' +
        '<button type="button" class="btn small secondary parent-lesson-toggle"></button></div><div class="kchips"></div>';
      box.querySelector('.parent-lesson-title').textContent = `${l.index + 1} ${l.title}`;
      const toggle = box.querySelector('.parent-lesson-toggle');
      toggle.dataset.lesson = l.id;
      toggle.addEventListener('click', () => toggleLesson(l));
      const chips = box.querySelector('.kchips');
      l.kanji.forEach((k) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'kchip';
        btn.dataset.kanji = k.kanji;
        btn.innerHTML = '<span class="kchip-k"></span><span class="kchip-r"></span>';
        btn.querySelector('.kchip-k').textContent = k.kanji;
        btn.querySelector('.kchip-r').textContent = [...k.on, ...k.kun].join('・');
        btn.addEventListener('click', () => toggleKanji(k.kanji));
        chips.append(btn);
      });
      el.parentList.append(box);
    });
    updateParent();
  }

  function updateParent() {
    const on = new Set(onList);
    el.parentList.querySelectorAll('.kchip').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(on.has(btn.dataset.kanji)));
    });
    el.parentList.querySelectorAll('.parent-lesson-toggle').forEach((btn) => {
      const lesson = lib.lessons[lessonNo(btn.dataset.lesson)];
      const allOn = lesson.kanji.every((k) => on.has(k.kanji));
      btn.textContent = allOn ? 'ぜんぶ OFF' : 'ぜんぶ ON';
    });
    el.parentCount.textContent = `${onList.length}/${lib.kanjiMap.size}`;
  }

  const tooFewMessage = () => `かんじは ${MIN_KANJI}こ いじょう ONに してね。`;

  function applyOnList(list) {
    setOnList(list);
    updateParent();
    parentMessage('ほぞん しました。', true);
  }

  function toggleKanji(c) {
    if (onList.includes(c)) {
      if (onList.length <= MIN_KANJI) {
        parentMessage(tooFewMessage(), false);
        return;
      }
      applyOnList(onList.filter((x) => x !== c));
    } else {
      applyOnList([...onList, c]);
    }
  }

  function toggleLesson(lesson) {
    const chars = lesson.kanji.map((k) => k.kanji);
    if (chars.every((c) => onList.includes(c))) {
      const rest = onList.filter((c) => !chars.includes(c));
      if (rest.length < MIN_KANJI) {
        parentMessage(tooFewMessage(), false);
        return;
      }
      applyOnList(rest);
    } else {
      applyOnList([...onList, ...chars]);
    }
  }

  // ---------- Sự kiện ----------
  $('btn-zukan').addEventListener('click', renderZukan);
  $('btn-parent').addEventListener('click', openParent);
  $('btn-parent-back').addEventListener('click', renderMenu);
  $('btn-parent-default').addEventListener('click', () => {
    if (!window.confirm(`ONの かんじを はじめの ${DEFAULT_ON.length}こに もどしますか？`)) return;
    applyOnList(DEFAULT_ON);
  });
  $('btn-parent-reset').addEventListener('click', () => {
    if (!window.confirm('ほしと きろくを ぜんぶ けしますか？')) return;
    progress = emptyProgress();
    saveProgress();
    parentMessage('きろくを けしました。', true);
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
  hydrateIcons(document);
  speech.onchange = showVoiceNote;
  speech.init();
  setOnList(loadOnList());
  renderMenu();
  if (migrateNote) toast(migrateNote);
})();
