// 盲文对照表 - 渲染 + 主题切换

// SVG 点阵渲染（带虚点 + 可复制 Unicode）
function brailleCell(char) {
  const code = char.codePointAt(0) - 0x2800;
  const dots = [
    !!(code & 1), !!(code & 2), !!(code & 4),
    !!(code & 8), !!(code & 16), !!(code & 32),
  ];
  const s = 24, w = s * 0.6, h = s, r = s * 0.1;
  const cx = [w * 0.3, w * 0.7], cy = [h * 0.2, h * 0.5, h * 0.8];
  const pos = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]];
  let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  for (let i = 0; i < 6; i++) {
    const x = cx[pos[i][0]], y = cy[pos[i][1]];
    svg += dots[i]
      ? `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor"/>`
      : `<circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.2"/>`;
  }
  svg += `</svg><span class="copy-text">${char}</span>`;
  return svg;
}

function getDots(char) {
  const code = char.codePointAt(0) - 0x2800;
  const names = [];
  if (code & 1) names.push('1');
  if (code & 2) names.push('2');
  if (code & 4) names.push('3');
  if (code & 8) names.push('4');
  if (code & 16) names.push('5');
  if (code & 32) names.push('6');
  return names.join('');
}

function row(py, char, note) {
  return `<tr><td class="c-py">${py}</td><td class="c-br">${brailleCell(char)}</td><td class="c-dt">${getDots(char)}</td>${note !== undefined ? `<td class="c-nt">${note}</td>` : ''}</tr>`;
}

function header(cols) {
  return '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
}

// 声母
const initials = [
  ['b', '⠃'], ['p', '⠏'], ['m', '⠍'], ['f', '⠋'],
  ['d', '⠙'], ['t', '⠞'], ['n', '⠝'], ['l', '⠇'],
  ['g / j', '⠛', '靠韵母区分'], ['k / q', '⠅', '靠韵母区分'], ['h / x', '⠓', '靠韵母区分'],
  ['zh', '⠌'], ['ch', '⠟'], ['sh', '⠱'],
  ['r', '⠚'], ['z', '⠵'], ['c', '⠉'], ['s', '⠎'],
];
const mid = Math.ceil(initials.length / 2);
const hdr4 = header(['拼音', '盲文', '点位', '']);
document.getElementById('initials-left').innerHTML = hdr4 + initials.slice(0, mid).map(r => row(r[0], r[1], r[2] || '')).join('');
document.getElementById('initials-right').innerHTML = hdr4 + initials.slice(mid).map(r => row(r[0], r[1], r[2] || '')).join('');

// 韵母
const hdr3 = header(['拼音', '盲文', '点位']);
const finalsL = [
  ['a', '⠔'], ['o / e', '⠢'], ['i', '⠊'],
  ['u', '⠥'], ['ü', '⠬'], ['er', '⠗'],
  ['ai', '⠪'], ['ei', '⠮'], ['ao', '⠖'], ['ou', '⠷'],
  ['an', '⠧'], ['en', '⠴'], ['ang', '⠦'], ['eng', '⠼'], ['ong / ueng', '⠲'],
];
const finalsR = [
  ['ia', '⠫'], ['ie', '⠑'], ['iao', '⠜'], ['iu (iou)', '⠳'],
  ['ian', '⠩'], ['in', '⠣'], ['iang', '⠭'], ['ing', '⠡'], ['iong', '⠹'],
  ['ua', '⠿'], ['uo', '⠕'], ['uan', '⠻'], ['uai', '⠽'], ['uang', '⠶'], ['ui (uei)', '⠺'], ['un (uen)', '⠒'],
  ['üe', '⠾'], ['üan', '⠯'], ['ün', '⠸'],
];
document.getElementById('finals-left').innerHTML = hdr3 + finalsL.map(r => row(r[0], r[1])).join('');
document.getElementById('finals-right').innerHTML = hdr3 + finalsR.map(r => row(r[0], r[1])).join('');

// 声调
const tones = [['1 阴平 ˉ', '⠁'], ['2 阳平 ˊ', '⠂'], ['3 上声 ˇ', '⠄'], ['4 去声 ˋ', '⠆']];
document.getElementById('tones').innerHTML = header(['声调', '盲文', '点位']) + tones.map(r => row(r[0], r[1])).join('');

// 英文
const letters = 'abcdefghijklmnopqrstuvwxyz';
const enBraille = { a:'⠁',b:'⠃',c:'⠉',d:'⠙',e:'⠑',f:'⠋',g:'⠛',h:'⠓',i:'⠊',j:'⠚',k:'⠅',l:'⠇',m:'⠍',n:'⠝',o:'⠕',p:'⠏',q:'⠟',r:'⠗',s:'⠎',t:'⠞',u:'⠥',v:'⠧',w:'⠺',x:'⠭',y:'⠽',z:'⠵' };
const enArr = letters.split('').map(c => [c, enBraille[c]]);
const enMid = Math.ceil(enArr.length / 2);
document.getElementById('english-left').innerHTML = hdr3.replace('拼音','字母') + enArr.slice(0, enMid).map(r => row(r[0], r[1])).join('');
document.getElementById('english-right').innerHTML = hdr3.replace('拼音','字母') + enArr.slice(enMid).map(r => row(r[0], r[1])).join('');

// 特殊规则
document.getElementById('rules').innerHTML = header(['规则', '说明', '示例']) +
  `<tr><td>空韵省略</td><td class="c-nt">zh/ch/sh/r/z/c/s + i 省略韵母</td><td class="c-py">知 zhī → ⠌</td></tr>` +
  `<tr><td>j/q/x + ü</td><td class="c-nt">j/q/x 后 u 实际为 ü</td><td class="c-py">全 quán → ⠅⠯</td></tr>` +
  `<tr><td>零声母</td><td class="c-nt">yi/wu/yu 等特殊处理</td><td class="c-py">一 yī → ⠊</td></tr>`;

// 主题
const btn = document.getElementById('theme-btn');
let dark = localStorage.getItem('ref-theme') === 'dark';
apply();
btn.addEventListener('click', () => { dark = !dark; localStorage.setItem('ref-theme', dark ? 'dark' : 'light'); apply(); });
function apply() { document.body.classList.toggle('dark', dark); btn.textContent = dark ? '☀' : '☾'; }
