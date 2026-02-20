// 盲文转换器 - 交互逻辑
(function () {
  'use strict';

  // DOM
  const inputArea = document.getElementById('input-area');
  const outputArea = document.getElementById('output-area');
  const breakdown = document.getElementById('breakdown');
  const toneBtn = document.getElementById('tone-btn');
  const swapBtn = document.getElementById('swap-btn');
  const clearBtn = document.getElementById('clear-btn');
  const copyBtn = document.getElementById('copy-btn');
  const dirLabel = document.getElementById('dir-label');
  const inputLabel = document.getElementById('input-label');
  const outputLabel = document.getElementById('output-label');
  const breakdownTitle = document.getElementById('breakdown-title');
  const themeBtn = document.getElementById('theme-btn');

  let showTone = false;
  let reversed = false; // false = 中文→盲文, true = 盲文→中文
  let debounceTimer = null;

  // ========================
  // Braille SVG renderer
  // ========================
  function brailleSVG(char, size) {
    const code = char.codePointAt(0) - 0x2800;
    const dots = [
      !!(code & 1), !!(code & 2), !!(code & 4),
      !!(code & 8), !!(code & 16), !!(code & 32),
    ];
    const w = size * 0.6, h = size, r = size * 0.1;
    const cx = [w * 0.3, w * 0.7], cy = [h * 0.2, h * 0.5, h * 0.8];
    const pos = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]];
    let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    for (let i = 0; i < 6; i++) {
      const x = cx[pos[i][0]], y = cy[pos[i][1]];
      svg += dots[i]
        ? `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor"/>`
        : `<circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.2"/>`;
    }
    svg += '</svg>';
    return svg;
  }

  function getDots(char) {
    return BrailleConverter.DOTS_MAP[char] || '';
  }

  // ========================
  // Chinese → Braille
  // ========================
  function convertChineseToBraille(text) {
    if (!text.trim()) {
      outputArea.value = '';
      breakdown.innerHTML = '<div class="empty-state">输入文字后自动显示逐字分解</div>';
      return;
    }

    let brailleOutput = '';
    const cards = [];

    // Process character by character, handling multi-char punctuation first
    let i = 0;
    const chars = [...text];

    // We need to process the text to handle multi-char punctuation and regular text
    const rawText = text;
    const segments = [];
    let pos = 0;

    while (pos < rawText.length) {
      let matched = false;
      // Check multi-char punctuation
      for (const mp of BrailleConverter.MULTI_CHAR_PUNCTUATION) {
        if (rawText.substring(pos, pos + mp.length) === mp) {
          segments.push({ type: 'punct', text: mp });
          pos += mp.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // Check single-char punctuation
      const ch = rawText[pos];
      if (BrailleConverter.PUNCTUATION_BRAILLE[ch]) {
        segments.push({ type: 'punct', text: ch });
        pos++;
        continue;
      }

      // Check for newline
      if (ch === '\n') {
        segments.push({ type: 'newline', text: '\n' });
        pos++;
        continue;
      }

      // Accumulate Chinese or other text
      let textBuf = '';
      while (pos < rawText.length) {
        const c = rawText[pos];
        if (c === '\n') break;
        if (BrailleConverter.PUNCTUATION_BRAILLE[c]) break;
        let isMulti = false;
        for (const mp of BrailleConverter.MULTI_CHAR_PUNCTUATION) {
          if (rawText.substring(pos, pos + mp.length) === mp) { isMulti = true; break; }
        }
        if (isMulti) break;
        textBuf += c;
        pos++;
      }
      if (textBuf) {
        segments.push({ type: 'text', text: textBuf });
      }
    }

    // Now process segments
    for (const seg of segments) {
      if (seg.type === 'newline') {
        brailleOutput += '\n';
        continue;
      }

      if (seg.type === 'punct') {
        const punctResult = BrailleConverter.punctuationToBraille(seg.text);
        if (punctResult) {
          brailleOutput += punctResult.braille;
          cards.push(buildPunctCard(seg.text, punctResult));
        }
        continue;
      }

      // Text segment - use textToBraille for Chinese, charToBraille for English
      const segText = seg.text;
      const brailleResults = BrailleConverter.textToBraille(segText, showTone);

      for (const item of brailleResults) {
        if (item.brailleResult) {
          brailleOutput += item.brailleResult.braille;
          cards.push(buildCharCard(item));
        } else if (/[a-zA-Z]/.test(item.char)) {
          const enResult = BrailleConverter.charToBraille(item.char);
          if (enResult) {
            brailleOutput += enResult.braille;
            cards.push(buildEnCard(item.char, enResult));
          }
        } else if (item.char === ' ') {
          brailleOutput += '⠀'; // braille space
        } else {
          brailleOutput += item.char;
        }
      }
    }

    outputArea.value = brailleOutput;

    if (cards.length > 0) {
      breakdown.innerHTML = cards.join('');
    } else {
      breakdown.innerHTML = '<div class="empty-state">无法识别的输入</div>';
    }
  }

  function buildCharCard(item) {
    const br = item.brailleResult;
    let dotsStr = br.cells.map(c => c.dots).filter(Boolean).join(' ');
    const toneCells = br.cells.filter(c => /^tone/.test(c.label));
    const nonToneCells = br.cells.filter(c => !/^tone/.test(c.label));
    let labelsStr = nonToneCells.map(c => c.label).filter(Boolean).join('+');
    if (toneCells.length > 0) {
      labelsStr += ' ' + toneCells.map(c => c.label.replace('tone ', '')).join('');
    }
    let svgHtml = br.cells.map(c => brailleSVG(c.char, 28)).join('');

    return `<div class="char-card">
      <div class="cc-char">${item.char}</div>
      <div class="cc-pinyin">${item.pinyin || ''}</div>
      <div class="cc-braille">${svgHtml}</div>
      <div class="cc-dots">${dotsStr}</div>
      <div class="cc-labels">${labelsStr}</div>
    </div>`;
  }

  function buildPunctCard(punct, result) {
    let svgHtml = result.cells
      .filter(c => c.char !== '⠀')
      .map(c => brailleSVG(c.char, 28)).join('');
    let dotsStr = result.cells
      .filter(c => c.dots)
      .map(c => c.dots).join(' ');

    return `<div class="char-card punct">
      <div class="cc-char">${punct}</div>
      <div class="cc-pinyin">${result.name}</div>
      <div class="cc-braille">${svgHtml}</div>
      <div class="cc-dots">${dotsStr}</div>
    </div>`;
  }

  function buildEnCard(char, result) {
    let svgHtml = result.cells.map(c => brailleSVG(c.char, 28)).join('');
    let dotsStr = result.cells.map(c => c.dots).filter(Boolean).join(' ');

    return `<div class="char-card">
      <div class="cc-char">${char}</div>
      <div class="cc-pinyin">${char.toLowerCase()}</div>
      <div class="cc-braille">${svgHtml}</div>
      <div class="cc-dots">${dotsStr}</div>
    </div>`;
  }

  // ========================
  // Braille → Chinese (reverse lookup)
  // ========================

  // Build reverse maps
  const brailleToInitial = {};
  const brailleToFinal = {};
  const brailleToTone = {};

  for (const [key, val] of Object.entries(BrailleConverter.INITIALS)) {
    if (!brailleToInitial[val]) brailleToInitial[val] = [];
    brailleToInitial[val].push(key);
  }
  for (const [key, val] of Object.entries(BrailleConverter.FINALS)) {
    if (!brailleToFinal[val]) brailleToFinal[val] = [];
    brailleToFinal[val].push(key);
  }
  for (const [key, val] of Object.entries(BrailleConverter.TONES)) {
    brailleToTone[val] = key;
  }

  // Build reverse punctuation map
  const brailleToPunct = {};
  for (const [key, val] of Object.entries(BrailleConverter.PUNCTUATION_BRAILLE)) {
    if (!brailleToPunct[val.braille]) {
      brailleToPunct[val.braille] = { punct: key, name: val.name };
    }
  }

  // Build reverse English map
  const brailleToEnglish = {};
  for (const [key, val] of Object.entries(BrailleConverter.ENGLISH_BRAILLE)) {
    brailleToEnglish[val] = key;
  }

  function convertBrailleToChinese(text) {
    if (!text.trim()) {
      outputArea.value = '';
      breakdown.innerHTML = '<div class="empty-state">输入盲文后自动显示解析结果</div>';
      return;
    }

    const brailleChars = [...text].filter(c => {
      const code = c.codePointAt(0);
      return (code >= 0x2800 && code <= 0x28FF) || c === '\n';
    });

    if (brailleChars.length === 0) {
      outputArea.value = '';
      breakdown.innerHTML = '<div class="empty-state">请输入有效的盲文字符 (⠀–⠿)</div>';
      return;
    }

    let result = '';
    const cards = [];
    let i = 0;

    while (i < brailleChars.length) {
      const ch = brailleChars[i];

      if (ch === '\n') {
        result += '\n';
        i++;
        continue;
      }

      // Try 3-char punctuation first (省略号 ⠐⠐⠐)
      if (i + 2 < brailleChars.length) {
        const tri = brailleChars[i] + brailleChars[i+1] + brailleChars[i+2];
        if (brailleToPunct[tri]) {
          const p = brailleToPunct[tri];
          result += p.punct;
          cards.push(buildReversePunctCard(tri, p));
          i += 3;
          continue;
        }
      }

      // Try 2-char punctuation
      if (i + 1 < brailleChars.length) {
        const di = brailleChars[i] + brailleChars[i+1];
        if (brailleToPunct[di]) {
          const p = brailleToPunct[di];
          result += p.punct;
          cards.push(buildReversePunctCard(di, p));
          i += 2;
          continue;
        }
      }

      // Try 1-char punctuation
      if (brailleToPunct[ch]) {
        const p = brailleToPunct[ch];
        result += p.punct;
        cards.push(buildReversePunctCard(ch, p));
        i++;
        continue;
      }

      // Braille blank (⠀) = space
      if (ch === '⠀') {
        result += ' ';
        i++;
        continue;
      }

      // Try as initial + final
      const initial = brailleToInitial[ch];
      if (initial && i + 1 < brailleChars.length) {
        const nextCh = brailleChars[i + 1];
        const final_ = brailleToFinal[nextCh];
        if (final_) {
          const initStr = initial.join('/');
          const finStr = final_.join('/');
          const pinyin = initStr + finStr;
          result += `[${pinyin}]`;
          cards.push(buildReverseCard(ch, nextCh, initial, final_));
          i += 2;

          // Check if next char is a tone
          if (i < brailleChars.length && brailleToTone[brailleChars[i]]) {
            const toneNum = brailleToTone[brailleChars[i]];
            result = result.slice(0, -1) + ` T${toneNum}]`;
            i++;
          }
          continue;
        }
      }

      // Try as standalone final (zero-initial)
      const final_ = brailleToFinal[ch];
      if (final_) {
        result += `[${final_.join('/')}]`;
        cards.push(buildReverseFinalCard(ch, final_));
        i++;

        // Check tone
        if (i < brailleChars.length && brailleToTone[brailleChars[i]]) {
          const toneNum = brailleToTone[brailleChars[i]];
          result = result.slice(0, -1) + ` T${toneNum}]`;
          i++;
        }
        continue;
      }

      // Try as standalone initial (空韵 zhi/chi/shi/ri/zi/ci/si)
      if (initial) {
        result += `[${initial.join('/')}i]`;
        cards.push(buildReverseInitialCard(ch, initial));
        i++;

        // Check tone
        if (i < brailleChars.length && brailleToTone[brailleChars[i]]) {
          const toneNum = brailleToTone[brailleChars[i]];
          result = result.slice(0, -1) + ` T${toneNum}]`;
          i++;
        }
        continue;
      }

      // Try as English letter
      if (brailleToEnglish[ch]) {
        result += brailleToEnglish[ch];
        cards.push(buildReverseEnCard(ch, brailleToEnglish[ch]));
        i++;
        continue;
      }

      // Unknown
      result += ch;
      i++;
    }

    outputArea.value = result;

    if (cards.length > 0) {
      breakdown.innerHTML = cards.join('');
    } else {
      breakdown.innerHTML = '<div class="empty-state">无法解析的盲文</div>';
    }
  }

  function buildReverseCard(initChar, finalChar, initials, finals) {
    let svgHtml = brailleSVG(initChar, 28) + brailleSVG(finalChar, 28);
    return `<div class="char-card">
      <div class="cc-char">${initials.join('/')}+${finals.join('/')}</div>
      <div class="cc-pinyin">声母+韵母</div>
      <div class="cc-braille">${svgHtml}</div>
      <div class="cc-dots">${getDots(initChar)} ${getDots(finalChar)}</div>
    </div>`;
  }

  function buildReverseFinalCard(brChar, finals) {
    return `<div class="char-card">
      <div class="cc-char">${finals.join('/')}</div>
      <div class="cc-pinyin">韵母独用</div>
      <div class="cc-braille">${brailleSVG(brChar, 28)}</div>
      <div class="cc-dots">${getDots(brChar)}</div>
    </div>`;
  }

  function buildReverseInitialCard(brChar, initials) {
    return `<div class="char-card">
      <div class="cc-char">${initials.join('/')}i</div>
      <div class="cc-pinyin">声母独用(空韵)</div>
      <div class="cc-braille">${brailleSVG(brChar, 28)}</div>
      <div class="cc-dots">${getDots(brChar)}</div>
    </div>`;
  }

  function buildReversePunctCard(brStr, punctInfo) {
    let svgHtml = [...brStr].map(c => brailleSVG(c, 28)).join('');
    let dotsStr = [...brStr].map(c => getDots(c)).filter(Boolean).join(' ');
    return `<div class="char-card punct">
      <div class="cc-char">${punctInfo.punct}</div>
      <div class="cc-pinyin">${punctInfo.name}</div>
      <div class="cc-braille">${svgHtml}</div>
      <div class="cc-dots">${dotsStr}</div>
    </div>`;
  }

  function buildReverseEnCard(brChar, letter) {
    return `<div class="char-card">
      <div class="cc-char">${letter}</div>
      <div class="cc-pinyin">English</div>
      <div class="cc-braille">${brailleSVG(brChar, 28)}</div>
      <div class="cc-dots">${getDots(brChar)}</div>
    </div>`;
  }

  // ========================
  // Event Handlers
  // ========================

  function doConvert() {
    const text = inputArea.value;
    if (reversed) {
      convertBrailleToChinese(text);
    } else {
      convertChineseToBraille(text);
    }
  }

  inputArea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doConvert, 150);
  });

  // Tone toggle
  toneBtn.addEventListener('click', () => {
    showTone = !showTone;
    toneBtn.classList.toggle('active', showTone);
    doConvert();
  });

  // Swap direction
  swapBtn.addEventListener('click', () => {
    reversed = !reversed;
    swapBtn.classList.toggle('swapped', reversed);

    if (reversed) {
      dirLabel.textContent = '盲文 → 中文';
      inputLabel.textContent = '盲文输入';
      outputLabel.textContent = '解析输出';
      inputArea.placeholder = '输入盲文字符 (⠀–⠿)…';
      outputArea.placeholder = '解析结果将显示在这里…';
      breakdownTitle.textContent = '逐符解析';
      toneBtn.style.display = 'none';
    } else {
      dirLabel.textContent = '中文 → 盲文';
      inputLabel.textContent = '中文输入';
      outputLabel.textContent = '盲文输出';
      inputArea.placeholder = '输入中文文字…';
      outputArea.placeholder = '盲文将显示在这里…';
      breakdownTitle.textContent = '逐字分解';
      toneBtn.style.display = '';
    }

    // Swap the text content
    const tmp = inputArea.value;
    inputArea.value = outputArea.value;
    outputArea.value = tmp;

    doConvert();
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    inputArea.value = '';
    outputArea.value = '';
    breakdown.innerHTML = '<div class="empty-state">输入文字后自动显示逐字分解</div>';
    inputArea.focus();
  });

  // Copy
  copyBtn.addEventListener('click', () => {
    const text = outputArea.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = '✓ 已复制';
      setTimeout(() => { copyBtn.textContent = '📋 复制'; }, 1500);
    });
  });

  // Theme
  let dark = localStorage.getItem('converter-theme') === 'dark';
  applyTheme();
  themeBtn.addEventListener('click', () => {
    dark = !dark;
    localStorage.setItem('converter-theme', dark ? 'dark' : 'light');
    applyTheme();
  });

  function applyTheme() {
    document.body.classList.toggle('dark', dark);
    themeBtn.textContent = dark ? '☀' : '☾';
  }

})();
