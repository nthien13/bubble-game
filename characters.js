// Nhân vật SVG, phông nền theo bài, câu thoại phản ứng.
// Mỗi nhân vật có 3 nhóm mặt: face-normal, face-good (người chơi đúng), face-bad (người chơi sai).
// Nhóm .arm là tay thả bóng; hand là vị trí bàn tay theo tỉ lệ khung 200x200.
window.GAME_CHARACTERS = (() => {
  const INK = '#3B3250';

  const roundEyes = (l, r, y, w = 7, h = 9) =>
    `<ellipse cx="${l}" cy="${y}" rx="${w}" ry="${h}" fill="${INK}"/>` +
    `<ellipse cx="${r}" cy="${y}" rx="${w}" ry="${h}" fill="${INK}"/>` +
    `<circle cx="${l + 2.5}" cy="${y - 3.5}" r="2.6" fill="#fff"/>` +
    `<circle cx="${r + 2.5}" cy="${y - 3.5}" r="2.6" fill="#fff"/>` +
    `<circle cx="${l - 2.5}" cy="${y + 4}" r="1.2" fill="#fff" opacity=".8"/>` +
    `<circle cx="${r - 2.5}" cy="${y + 4}" r="1.2" fill="#fff" opacity=".8"/>`;

  const happyEyes = (l, r, y, sw = 3) =>
    `<g stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round">` +
    `<path d="M${l - 8} ${y + 3} Q${l} ${y - 6} ${l + 8} ${y + 3}"/>` +
    `<path d="M${r - 8} ${y + 3} Q${r} ${y - 6} ${r + 8} ${y + 3}"/></g>`;

  const sadEyes = (l, r, y) =>
    `<g stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M${l - 7} ${y - 6} L${l + 5} ${y} L${l - 7} ${y + 6}"/>` +
    `<path d="M${r + 7} ${y - 6} L${r - 5} ${y} L${r + 7} ${y + 6}"/></g>`;

  const dizzyEyes = (l, r, y) =>
    `<g stroke="${INK}" stroke-width="3" stroke-linecap="round">` +
    `<path d="M${l - 6} ${y - 6} L${l + 6} ${y + 6} M${l + 6} ${y - 6} L${l - 6} ${y + 6}"/>` +
    `<path d="M${r - 6} ${y - 6} L${r + 6} ${y + 6} M${r + 6} ${y - 6} L${r - 6} ${y + 6}"/></g>`;

  const cheeks = (l, r, y) =>
    `<ellipse cx="${l}" cy="${y}" rx="11" ry="7" fill="#FF9EBB" opacity=".6"/>` +
    `<ellipse cx="${r}" cy="${y}" rx="11" ry="7" fill="#FF9EBB" opacity=".6"/>`;

  const svg = (body, normal, good, bad) =>
    `<svg viewBox="0 0 200 200">${body}` +
    `<g class="face face-normal">${normal}</g>` +
    `<g class="face face-good">${good}</g>` +
    `<g class="face face-bad">${bad}</g></svg>`;

  // ---------- ぷにまる: bạn, bài 1 ----------
  const punimaru = svg(
    `<g class="sprout">
      <path d="M100 56 C100 44 100 36 100 28" stroke="#4FAE5A" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M100 34 C88 22 76 26 74 34 C84 40 94 38 100 34Z" fill="#7ED67F"/>
      <path d="M100 30 C110 16 124 18 128 26 C118 34 108 34 100 30Z" fill="#7ED67F"/>
    </g>
    <g class="ear ear-left">
      <ellipse cx="44" cy="84" rx="17" ry="34" transform="rotate(38 44 84)" fill="#B39CF2"/>
      <ellipse cx="46" cy="86" rx="8" ry="22" transform="rotate(38 46 86)" fill="#FFC6DC"/>
    </g>
    <g class="ear ear-right">
      <ellipse cx="156" cy="84" rx="17" ry="34" transform="rotate(-38 156 84)" fill="#B39CF2"/>
      <ellipse cx="154" cy="86" rx="8" ry="22" transform="rotate(-38 154 86)" fill="#FFC6DC"/>
    </g>
    <ellipse cx="72" cy="186" rx="20" ry="10" fill="#A48BEB"/>
    <ellipse cx="128" cy="186" rx="20" ry="10" fill="#A48BEB"/>
    <ellipse cx="100" cy="122" rx="68" ry="66" fill="#C8B6FF"/>
    <ellipse cx="100" cy="148" rx="40" ry="31" fill="#FFF4E6"/>
    <ellipse cx="38" cy="142" rx="12" ry="18" transform="rotate(25 38 142)" fill="#B39CF2"/>
    <g class="arm"><ellipse cx="166" cy="98" rx="12" ry="20" transform="rotate(-30 166 98)" fill="#B39CF2"/></g>
    ${cheeks(57, 143, 128)}`,
    roundEyes(76, 124, 106) +
      `<path d="M93 124 Q96.5 129 100 124 Q103.5 129 107 124" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    happyEyes(76, 124, 106) +
      `<path d="M92 123 Q100 136 108 123 Z" fill="#F0788E" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
    sadEyes(76, 124, 107) +
      `<path d="M93 131 Q100 125 107 131" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
  );

  // ---------- かっぱ: bạn, bài 2 ----------
  const kappa = svg(
    `<ellipse cx="100" cy="128" rx="74" ry="62" fill="#5E8A35"/>
    <ellipse cx="72" cy="188" rx="20" ry="10" fill="#5AA34E"/>
    <ellipse cx="128" cy="188" rx="20" ry="10" fill="#5AA34E"/>
    <ellipse cx="100" cy="126" rx="64" ry="62" fill="#7CC96B"/>
    <ellipse cx="100" cy="152" rx="38" ry="28" fill="#F5E9A8"/>
    <path d="M42 92 L50 66 L62 80 L72 58 L86 74 L100 54 L114 74 L128 58 L138 80 L150 66 L158 92 Q100 70 42 92Z" fill="#3E7D3A"/>
    <ellipse cx="100" cy="62" rx="30" ry="11" fill="#EAF6FF" stroke="#8FC3E6" stroke-width="4"/>
    <ellipse cx="38" cy="142" rx="12" ry="18" transform="rotate(25 38 142)" fill="#6CBF5B"/>
    <g class="arm">
      <ellipse cx="166" cy="98" rx="12" ry="20" transform="rotate(-30 166 98)" fill="#6CBF5B"/>
      <circle cx="175" cy="80" r="9" fill="#6CBF5B"/>
    </g>
    ${cheeks(57, 143, 124)}`,
    roundEyes(78, 122, 104, 6.5, 8.5) +
      `<ellipse cx="100" cy="126" rx="13" ry="7" fill="#F6B73C"/>` +
      `<path d="M89 126 L111 126" stroke="#C98A1C" stroke-width="1.8" stroke-linecap="round"/>`,
    happyEyes(78, 122, 104) +
      `<path d="M87 122 Q100 117 113 122 Q100 140 87 122Z" fill="#F6B73C"/>` +
      `<ellipse cx="100" cy="127" rx="5" ry="3" fill="#F0788E"/>`,
    sadEyes(78, 122, 104) +
      `<ellipse cx="100" cy="128" rx="12" ry="7" fill="#F6B73C"/>` +
      `<path d="M91 130 Q100 125 109 130" stroke="#C98A1C" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
  );

  // ---------- からかさおばけ: nghịch ngợm, bài 3 ----------
  const karakasa = svg(
    `<path d="M100 20 L178 134 Q139 122 100 134 Q61 122 22 134 Z" fill="#E9677A"/>
    <path d="M100 20 L62 128 M100 20 L138 128" stroke="#B9475A" stroke-width="3" fill="none"/>
    <circle cx="100" cy="18" r="7" fill="#8B5A2B"/>
    <rect x="95" y="132" width="10" height="42" rx="4" fill="#8B5A2B"/>
    <rect x="76" y="174" width="48" height="9" rx="3" fill="#6B4423"/>
    <rect x="82" y="183" width="8" height="8" fill="#6B4423"/>
    <rect x="110" y="183" width="8" height="8" fill="#6B4423"/>
    <g class="arm">
      <path d="M150 112 Q166 100 172 84" stroke="#8B5A2B" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="173" cy="80" r="8" fill="#F6D7A7"/>
    </g>`,
    `<circle cx="100" cy="82" r="15" fill="#fff" stroke="${INK}" stroke-width="2.4"/>` +
      `<circle cx="102" cy="84" r="6.5" fill="${INK}"/><circle cx="104.5" cy="81" r="2.3" fill="#fff"/>` +
      `<path d="M88 106 Q100 113 112 106" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      `<path d="M98 109 Q100 119 106 109.5Z" fill="#FF8FA3" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`,
    `<circle cx="100" cy="80" r="17" fill="#fff" stroke="${INK}" stroke-width="2.4"/>` +
      `<circle cx="100" cy="80" r="3.5" fill="${INK}"/>` +
      `<ellipse cx="100" cy="110" rx="5" ry="6.5" fill="#7A3A4A"/>` +
      `<path d="M136 58 Q143 70 136 75 Q129 70 136 58Z" fill="#7FC8F8"/>`,
    `<path d="M88 84 Q100 74 112 84" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
      `<path d="M86 104 Q100 112 114 104" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      `<path d="M96 107.5 Q100 126 107 108Z" fill="#FF8FA3" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`
  );

  // ---------- ちょうちんおばけ: nghịch ngợm, bài 4 ----------
  const chochin = svg(
    `<path d="M100 30 L100 14" stroke="#3A2E2A" stroke-width="4"/>
    <circle cx="100" cy="10" r="5" fill="none" stroke="#3A2E2A" stroke-width="3"/>
    <rect x="66" y="30" width="68" height="14" rx="4" fill="#3A2E2A"/>
    <ellipse cx="100" cy="104" rx="60" ry="64" fill="#FFE3A3" stroke="#E0A84A" stroke-width="3"/>
    <path d="M48 70 Q100 80 152 70 M41 104 Q100 114 159 104 M48 138 Q100 148 152 138" stroke="#EDBE6B" stroke-width="3" fill="none"/>
    <rect x="70" y="162" width="60" height="14" rx="4" fill="#3A2E2A"/>
    <path d="M88 176 L86 192 M112 176 L114 192" stroke="#3A2E2A" stroke-width="5" stroke-linecap="round"/>
    <g class="arm">
      <path d="M156 100 Q168 88 172 74" stroke="#3A2E2A" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="173" cy="70" r="7" fill="#FFE3A3" stroke="#3A2E2A" stroke-width="2"/>
    </g>`,
    `<circle cx="80" cy="90" r="11" fill="#fff" stroke="${INK}" stroke-width="2.2"/>` +
      `<circle cx="81.5" cy="91.5" r="4.5" fill="${INK}"/><circle cx="83" cy="89.5" r="1.5" fill="#fff"/>` +
      `<path d="M113 91 Q122 84 131 91" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
      `<path d="M78 116 Q100 140 122 116 Q100 124 78 116Z" fill="#D9534F" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M94 126 Q100 135 107 126.5Z" fill="#FF9FB0"/>`,
    `<circle cx="80" cy="88" r="12" fill="#fff" stroke="${INK}" stroke-width="2.2"/><circle cx="80" cy="88" r="3.2" fill="${INK}"/>` +
      `<circle cx="122" cy="88" r="12" fill="#fff" stroke="${INK}" stroke-width="2.2"/><circle cx="122" cy="88" r="3.2" fill="${INK}"/>` +
      `<ellipse cx="101" cy="122" rx="6.5" ry="8" fill="#D9534F" stroke="${INK}" stroke-width="2"/>`,
    happyEyes(80, 122, 92) +
      `<path d="M76 112 Q100 146 124 112 Z" fill="#D9534F" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M90 128 Q100 141 111 128Z" fill="#FF9FB0"/>`
  );

  // ---------- 鬼: phe địch, bài 5 và trùm ----------
  const oni = ({ skin, dark, horns }) => {
    const hornPaths = horns === 1
      ? '<path d="M92 44 L100 12 L108 44Z" fill="#FFF1C1" stroke="#D9B65A" stroke-width="2"/>'
      : '<path d="M66 56 L58 18 L82 46Z" fill="#FFF1C1" stroke="#D9B65A" stroke-width="2"/>' +
        '<path d="M134 56 L142 18 L118 46Z" fill="#FFF1C1" stroke="#D9B65A" stroke-width="2"/>';
    const brows = `<path d="M62 88 Q76 89 88 96 M138 88 Q124 89 112 96" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return svg(
      `${hornPaths}
      <circle cx="60" cy="62" r="16" fill="#3A2340"/><circle cx="78" cy="50" r="16" fill="#3A2340"/>
      <circle cx="100" cy="46" r="16" fill="#3A2340"/><circle cx="122" cy="50" r="16" fill="#3A2340"/>
      <circle cx="140" cy="62" r="16" fill="#3A2340"/>
      <g transform="rotate(-18 30 150)">
        <rect x="20" y="88" width="20" height="80" rx="8" fill="#8C6A4F"/>
        <circle cx="30" cy="100" r="3.5" fill="#E8D9BF"/><circle cx="26" cy="114" r="3.5" fill="#E8D9BF"/>
        <circle cx="34" cy="126" r="3.5" fill="#E8D9BF"/><circle cx="28" cy="140" r="3.5" fill="#E8D9BF"/>
      </g>
      <ellipse cx="72" cy="188" rx="20" ry="10" fill="${dark}"/>
      <ellipse cx="128" cy="188" rx="20" ry="10" fill="${dark}"/>
      <ellipse cx="100" cy="124" rx="68" ry="64" fill="${skin}"/>
      <path d="M42 150 Q100 172 158 150 L154 182 Q100 198 46 182Z" fill="#F6C343"/>
      <path d="M62 158 L58 186 M86 164 L84 192 M114 164 L116 192 M138 158 L142 186" stroke="#3A2340" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="40" cy="138" rx="12" ry="18" transform="rotate(25 40 138)" fill="${dark}"/>
      <g class="arm">
        <ellipse cx="166" cy="98" rx="12" ry="20" transform="rotate(-30 166 98)" fill="${skin}"/>
        <circle cx="176" cy="80" r="10" fill="${skin}"/>
      </g>`,
      brows +
        `<circle cx="77" cy="108" r="9" fill="#fff"/><circle cx="78.5" cy="109" r="4.2" fill="${INK}"/><circle cx="80" cy="107.5" r="1.3" fill="#fff"/>` +
        `<circle cx="123" cy="108" r="9" fill="#fff"/><circle cx="121.5" cy="109" r="4.2" fill="${INK}"/><circle cx="123" cy="107.5" r="1.3" fill="#fff"/>` +
        `<path d="M84 132 Q100 144 116 132 Z" fill="#8A2E3A"/>` +
        `<path d="M88 133 L91.5 140 L95 133.5Z M112 133 L108.5 140 L105 133.5Z" fill="#fff"/>`,
      dizzyEyes(77, 123, 108) +
        `<path d="M86 136 Q93 131 100 136 Q107 141 114 136" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
        `<g class="dizzy-stars" fill="#FFD43B"><circle cx="56" cy="30" r="6"/><circle cx="144" cy="28" r="5"/><circle cx="100" cy="6" r="4"/></g>`,
      brows + happyEyes(77, 123, 110, 3.4) +
        `<path d="M80 128 Q100 156 120 128Z" fill="#8A2E3A"/>` +
        `<path d="M85 129 L89 137 L93 129.5Z M115 129 L111 137 L107 129.5Z" fill="#fff"/>` +
        `<ellipse cx="100" cy="144" rx="8" ry="4" fill="#FF8A8A"/>`
    );
  };

  // ---------- Chim đọc truyện ----------
  const reader = `<svg viewBox="0 0 120 120">
    <path d="M38 26 L43 6 L53 22Z" fill="#F29A52"/>
    <path d="M67 22 L77 6 L82 26Z" fill="#F29A52"/>
    <ellipse cx="15" cy="72" rx="10" ry="18" transform="rotate(15 15 72)" fill="#F29A52"/>
    <ellipse cx="105" cy="72" rx="10" ry="18" transform="rotate(-15 105 72)" fill="#F29A52"/>
    <circle cx="60" cy="64" r="47" fill="#FFC88E"/>
    <ellipse cx="60" cy="84" rx="31" ry="25" fill="#FFF1DD"/>
    <ellipse cx="27" cy="72" rx="8" ry="5" fill="#FF9EBB" opacity=".8"/>
    <ellipse cx="93" cy="72" rx="8" ry="5" fill="#FF9EBB" opacity=".8"/>
    <circle cx="43" cy="52" r="14" fill="#fff" stroke="#3A3350" stroke-width="2.6"/>
    <circle cx="77" cy="52" r="14" fill="#fff" stroke="#3A3350" stroke-width="2.6"/>
    <path d="M57 52 L63 52" stroke="#3A3350" stroke-width="2.6"/>
    <g class="r-eyes r-eyes-normal">
      <circle cx="44" cy="53" r="4.5" fill="${INK}"/><circle cx="76" cy="53" r="4.5" fill="${INK}"/>
      <circle cx="45.6" cy="51.4" r="1.5" fill="#fff"/><circle cx="77.6" cy="51.4" r="1.5" fill="#fff"/>
    </g>
    <g class="r-eyes r-eyes-happy" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round">
      <path d="M37 56 Q43 46 49 56"/><path d="M71 56 Q77 46 83 56"/>
    </g>
    <g class="r-eyes r-eyes-sad" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round">
      <path d="M37 50 L49 55"/><path d="M83 50 L71 55"/>
      <circle cx="44" cy="58" r="2" fill="${INK}"/><circle cx="76" cy="58" r="2" fill="${INK}"/>
    </g>
    <path class="beak-lower" d="M54 70 L66 70 L60 79Z" fill="#E66F24"/>
    <path class="beak-upper" d="M52 66 L68 66 L60 74Z" fill="#FF8A3D"/>
    <g class="book">
      <rect x="30" y="90" width="60" height="26" rx="3" fill="#fff" stroke="#7B5CF0" stroke-width="3"/>
      <path d="M60 90 L60 116" stroke="#7B5CF0" stroke-width="3"/>
      <path d="M37 98 L54 98 M37 105 L54 105 M66 98 L83 98 M66 105 L83 105" stroke="#CFC4FF" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  </svg>`;

  // ---------- ふでまる: nhân vật cầm bút lông, viết chữ lên bảng đen ----------
  const writer = `<svg viewBox="0 0 120 140">
    <ellipse cx="44" cy="128" rx="14" ry="7" fill="#E9DCC7"/>
    <ellipse cx="76" cy="128" rx="14" ry="7" fill="#E9DCC7"/>
    <ellipse cx="60" cy="86" rx="42" ry="40" fill="#FFFDF7" stroke="#E9DCC7" stroke-width="3"/>
    <path d="M22 66 Q60 52 98 66 L98 76 Q60 62 22 76Z" fill="#E8546F"/>
    <path d="M96 68 L112 58 L110 72Z M96 70 L114 74 L104 82Z" fill="#E8546F"/>
    <g stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round">
      <path d="M41 88 Q46 83 51 88"/><path d="M69 88 Q74 83 79 88"/>
    </g>
    <ellipse cx="36" cy="100" rx="8" ry="5" fill="#FF9EBB" opacity=".85"/>
    <ellipse cx="84" cy="100" rx="8" ry="5" fill="#FF9EBB" opacity=".85"/>
    <path d="M55.5 103 Q60 107.5 64.5 103" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <g class="brush">
      <path d="M92 104 L112 60" stroke="#8B5A2B" stroke-width="6" stroke-linecap="round"/>
      <path d="M109 64 Q118 50 116 40 Q106 48 106 62Z" fill="${INK}"/>
      <circle cx="92" cy="106" r="9" fill="#FFFDF7" stroke="#E9DCC7" stroke-width="3"/>
    </g>
  </svg>`;

  // Bảng đen có bánh xe. Khung chữ 100x100 nằm trong svg con: .calli-strokes nhận nét, .calli-nums nhận số thứ tự nét.
  const board = `<svg viewBox="0 0 160 192">
    <path d="M34 150 L24 176 M126 150 L136 176" stroke="#8B5A2B" stroke-width="6" stroke-linecap="round"/>
    <g class="wheel"><circle cx="24" cy="180" r="10" fill="#3A2E2A"/><path d="M24 172 L24 188 M16 180 L32 180" stroke="#9C8A7A" stroke-width="2"/></g>
    <g class="wheel"><circle cx="136" cy="180" r="10" fill="#3A2E2A"/><path d="M136 172 L136 188 M128 180 L144 180" stroke="#9C8A7A" stroke-width="2"/></g>
    <rect x="6" y="4" width="148" height="148" rx="8" fill="#8B5A2B"/>
    <rect x="14" y="12" width="132" height="132" rx="4" fill="#2F5D46"/>
    <rect x="14" y="140" width="132" height="8" fill="#6B4423"/>
    <svg x="20" y="16" width="120" height="120" viewBox="0 0 100 100">
      <path d="M50 4 L50 96 M4 50 L96 50" stroke="#5E8C74" stroke-width="1" stroke-dasharray="3 3"/>
      <g class="calli-strokes"></g>
      <g class="calli-nums"></g>
    </svg>
  </svg>`;

  // ---------- Phông nền ----------
  const cloud = (top, left, w, h, dur, extra = '') =>
    `<div class="cloud ${extra}" style="top:${top}%;left:${left}%;width:${w}px;height:${h}px;animation-duration:${dur}s"></div>`;
  const stars = [[8, 12], [14, 30], [6, 48], [18, 62], [10, 78], [24, 90], [28, 20], [32, 52], [22, 40], [36, 70], [4, 92], [30, 6]]
    .map(([t, l], i) => `<div class="star" style="top:${t}%;left:${l}%;animation-delay:${(i % 5) * 0.4}s"></div>`).join('');
  const lanterns = [10, 26, 42, 58, 74, 90]
    .map((l, i) => `<div class="lantern" style="left:${l}%;animation-delay:${i * 0.3}s"></div>`).join('');

  const backgrounds = [
    { sky: ['#A9DDFF', '#EAF7FF'], ground: '#9BD77A',
      decor: cloud(12, 8, 110, 30, 40) + cloud(28, 62, 80, 24, 55) + cloud(46, 30, 130, 34, 70) },
    { sky: ['#9FD9F2', '#E3F6EF'], ground: '#7FC86A',
      decor: cloud(10, 14, 100, 28, 45) + cloud(24, 66, 90, 26, 60) +
        '<div class="pond"><span class="lily" style="left:20%"></span><span class="lily" style="left:62%"></span></div>' },
    { sky: ['#FFB38A', '#FFE8C7'], ground: '#B5C96A',
      decor: '<div class="sun"></div>' + cloud(16, 20, 190, 52, 80, 'whale') + cloud(40, 66, 90, 24, 50) },
    { sky: ['#1F2B5C', '#45508F'], ground: '#3E5A3A', night: true,
      decor: '<div class="moon"></div>' + stars + `<div class="lantern-line">${lanterns}</div>` },
    { sky: ['#6A3D8F', '#D58BB3'], ground: '#5C4A6B', night: true,
      decor: '<div class="moon red"></div>' + stars +
        '<div class="rock" style="left:4%;width:90px;height:70px"></div><div class="rock" style="right:6%;width:120px;height:90px"></div>' },
    { sky: ['#2A2233', '#4A3B57'], ground: '#3A3140', night: true,
      decor: '<div class="stalactites"></div><div class="torch" style="left:6%"></div><div class="torch" style="right:6%"></div>' },
  ];

  const list = {
    punimaru: { name: 'ぷにまる', side: 'friend', hand: [0.88, 0.39], svg: punimaru,
      desc: 'ふわふわの なかよし。ふうせんが だいすき。' },
    kappa: { name: 'かっぱ', side: 'friend', hand: [0.875, 0.4], svg: kappa,
      desc: 'いけに すんで いる。あたまの おさらが じまん。' },
    karakasa: { name: 'からかさおばけ', side: 'trick', hand: [0.865, 0.4], svg: karakasa,
      desc: 'いっぽんあしで ぴょんぴょん。いたずらが すき。' },
    chochin: { name: 'ちょうちんおばけ', side: 'trick', hand: [0.865, 0.35], svg: chochin,
      desc: 'よるに ひかる。おおきな くちで わらう。' },
    akaoni: { name: 'あかおに', side: 'enemy', hand: [0.88, 0.4], svg: oni({ skin: '#F25C54', dark: '#D9463F', horns: 1 }),
      desc: 'つのが 1ぽん。かなぼうを もって いる。' },
    oyabun: { name: 'おにの おやぶん', side: 'enemy', boss: true, hand: [0.88, 0.4], svg: oni({ skin: '#4F7BE8', dark: '#3C63C9', horns: 2 }),
      desc: 'おにの なかで いちばん つよい。' },
  };

  // Câu thoại khi người chơi đúng (good) hoặc sai (bad)
  const lines = {
    friend: { good: 'やったね！', bad: 'ざんねん…' },
    trick: { good: 'びっくり！', bad: 'べろべろ〜' },
    enemy: { good: 'うわっ、やられた！', bad: 'がっはっは！' },
  };

  return {
    list,
    lines,
    reader,
    writer,
    board,
    backgrounds,
    lessonOrder: ['punimaru', 'kappa', 'karakasa', 'chochin', 'akaoni'],
    boss: 'oyabun',
    zukanOrder: ['punimaru', 'kappa', 'karakasa', 'chochin', 'akaoni', 'oyabun'],
  };
})();
