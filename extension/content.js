/**
 * 盲文悬浮注音 - Content Script
 * 鼠标悬停中文字显示现行盲文注音
 */

(function() {
  'use strict';

  let popup = null;
  let isEnabled = true;
  let showTone = false;
  let showDots = true;
  let showEnglish = false;
  let foldZh = false;
  let foldEn = true;
  let theme = 'light';
  let currentRange = null;
  let currentWord = null;
  let isMouseOverPopup = false;
  let hideTimeout = null;

  // 中文分词器（Chrome 原生 API，零依赖）
  const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

  // 标点符号正则（包含中英文常见标点 + 间隔号）
  const PUNCT_REGEX = /[\u3000-\u303F\uFF00-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\u2014\u2026\u2018\u2019\u201C\u201D\u00B7\u30FB.,;:!?\[\]\(\)]/ ;

  // 在文本的指定偏移处找到所属的中文词
  function segmentWordAt(text, offset) {
    // 先检查是否是多字符标点（—— 或 ……）
    if (BrailleConverter && BrailleConverter.MULTI_CHAR_PUNCTUATION) {
      for (const mp of BrailleConverter.MULTI_CHAR_PUNCTUATION) {
        const start = offset - (mp.length - 1);
        for (let s = Math.max(0, start); s <= offset; s++) {
          if (text.substring(s, s + mp.length) === mp) {
            return { word: mp, index: s, type: 'punct' };
          }
        }
      }
    }

    // 检查单字符标点
    const ch = text[offset];
    if (ch && PUNCT_REGEX.test(ch)) {
      if (BrailleConverter && BrailleConverter.PUNCTUATION_BRAILLE && BrailleConverter.PUNCTUATION_BRAILLE[ch]) {
        return { word: ch, index: offset, type: 'punct' };
      }
    }

    const segments = segmenter.segment(text);
    for (const seg of segments) {
      if (offset >= seg.index && offset < seg.index + seg.segment.length) {
        // 中文词
        if (/[\u4e00-\u9fff]/.test(seg.segment)) {
          return { word: seg.segment, index: seg.index, type: 'zh' };
        }
        // 英文词（仅当 showEnglish 开启时）
        if (showEnglish && /^[a-zA-Z]+$/.test(seg.segment)) {
          return { word: seg.segment, index: seg.index, type: 'en' };
        }
        return null;
      }
    }
    return null;
  }

  // 初始化
  function init() {
    createPopup();
    loadSettings();
    setupEventListeners();
    console.log('盲文悬浮注音已加载');
  }

  // 创建弹窗 DOM 元素
  function createPopup() {
    popup = document.createElement('div');
    popup.id = 'braille-popup-dict';
    popup.style.display = 'none';
    popup.innerHTML = '<div class="braille-popup-main"></div>';
    document.body.appendChild(popup);

    popup.addEventListener('mouseenter', () => {
      isMouseOverPopup = true;
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      // 展开详情区域
      const detail = popup.querySelector('.braille-detail-section');
      if (detail) {
        detail.style.maxHeight = detail.scrollHeight + 'px';
      }
    });

    popup.addEventListener('mouseleave', () => {
      isMouseOverPopup = false;
      // 折叠详情区域
      const detail = popup.querySelector('.braille-detail-section');
      if (detail) {
        detail.style.maxHeight = '0';
      }
      scheduleHidePopup();
    });

    popup.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
  }

  // 加载用户设置
  function loadSettings() {
    chrome.storage.sync.get(['enabled', 'showTone', 'showDots', 'showEnglish', 'foldZh', 'foldEn', 'theme'], (result) => {
      isEnabled = result.enabled !== false;
      showTone = result.showTone === true;
      showDots = result.showDots !== false;
      showEnglish = result.showEnglish === true;
      foldZh = result.foldZh === true;
      foldEn = result.foldEn !== false;
      theme = result.theme || 'light';
      if (popup) applyTheme();
    });
  }

  // 设置事件监听器
  function setupEventListeners() {
    let lastX = 0, lastY = 0;
    let isThrottled = false;
    let isSelecting = false;

    document.addEventListener('mousemove', (e) => {
      if (!isEnabled || isSelecting) return;
      if (isMouseOverPopup) return;
      if (hasEditableFocus()) return;

      const targetElement = document.elementFromPoint(e.clientX, e.clientY);
      if (isEditableElement(targetElement)) return;

      if (isThrottled) return;
      if (Math.abs(e.clientX - lastX) < 5 && Math.abs(e.clientY - lastY) < 5) return;

      lastX = e.clientX;
      lastY = e.clientY;

      isThrottled = true;
      setTimeout(() => { isThrottled = false; }, 50);

      handleMouseOver(e);
    });

    document.addEventListener('mouseleave', () => {
      if (hasEditableFocus()) {
        if (popup) popup.style.display = 'none';
        return;
      }
      hidePopup();
    });

    document.addEventListener('mousedown', (e) => {
      if (popup && popup.contains(e.target)) return;
      isSelecting = true;
      currentWord = null;
      if (hasEditableFocus()) {
        if (popup) popup.style.display = 'none';
        return;
      }
      hidePopup();
    });

    document.addEventListener('mouseup', () => {
      setTimeout(() => { isSelecting = false; }, 300);
    });

    document.addEventListener('scroll', () => {
      hidePopup();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hidePopup();
    });
  }

  // 检查元素是否可编辑
  function isEditableElement(element) {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea') return true;
    if (element.isContentEditable) return true;
    let parent = element.parentElement;
    while (parent) {
      if (parent.isContentEditable) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  // 检查是否有可编辑元素获得焦点
  function hasEditableFocus() {
    const activeEl = document.activeElement;
    if (!activeEl) return false;
    return (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable ||
      activeEl.getAttribute('contenteditable') === 'true' ||
      (activeEl.closest && activeEl.closest('[contenteditable="true"]'))
    );
  }

  // 处理鼠标悬停事件
  function handleMouseOver(e) {
    if (!isEnabled) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    const range = document.caretRangeFromPoint(clientX, clientY);
    if (!range) {
      scheduleHidePopup();
      return;
    }

    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) {
      scheduleHidePopup();
      return;
    }

    const offset = getAccurateOffset(textNode, clientX, clientY);
    if (offset === -1) {
      scheduleHidePopup();
      return;
    }

    const text = textNode.textContent;

    // 使用 Intl.Segmenter 进行中文分词
    const result = segmentWordAt(text, offset);
    if (!result) {
      currentWord = null;
      scheduleHidePopup();
      return;
    }
    const word = result.word;
    const wordOffset = result.index;

    if (currentWord === word && popup.style.display !== 'none') {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      return;
    }

    currentWord = word;
    highlightText(textNode, wordOffset, word.length);

    // 转换为盲文
    let brailleResults;
    if (result.type === 'punct') {
      // 标点符号
      const punctBraille = BrailleConverter.punctuationToBraille(word);
      if (!punctBraille) {
        scheduleHidePopup();
        return;
      }
      brailleResults = [{
        char: word,
        pinyin: punctBraille.name,
        brailleResult: punctBraille,
      }];
    } else if (result.type === 'en') {
      // 英文：逐字母转换
      brailleResults = word.split('').map(ch => ({
        char: ch,
        pinyin: ch.toLowerCase(),
        brailleResult: BrailleConverter.charToBraille(ch),
      }));
    } else {
      brailleResults = BrailleConverter.textToBraille(word, showTone);
    }

    if (brailleResults.length === 0 || brailleResults.every(r => !r.brailleResult)) {
      scheduleHidePopup();
      return;
    }

    if (currentRange) {
      const rects = currentRange.getClientRects();
      let bestRect = null;
      for (const rect of rects) {
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
          bestRect = rect;
          break;
        }
      }
      if (!bestRect && rects.length > 0) {
        let minDist = Infinity;
        for (const rect of rects) {
          const dx = Math.max(rect.left - clientX, 0, clientX - rect.right);
          const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom);
          const dist = dx * dx + dy * dy;
          if (dist < minDist) { minDist = dist; bestRect = rect; }
        }
      }
      showPopup(word, brailleResults, bestRect || currentRange.getBoundingClientRect(), result.type);
    }
  }

  // 精确定位字符
  function getAccurateOffset(textNode, clientX, clientY) {
    const text = textNode.textContent;
    if (!text) return -1;
    const charPattern = showEnglish
      ? /[\u4e00-\u9fffa-zA-Z\u3000-\u303F\uFF00-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\u2014\u2026\u2018\u2019\u201C\u201D.,;:!?]/
      : /[\u4e00-\u9fff\u3000-\u303F\uFF00-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\u2014\u2026\u2018\u2019\u201C\u201D.,;:!?]/;
    const range = document.createRange();
    for (let i = 0; i < text.length; i++) {
      if (!charPattern.test(text[i])) continue;
      try {
        range.setStart(textNode, i);
        range.setEnd(textNode, i + 1);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
          return i;
        }
      } catch (e) { /* ignore */ }
    }
    return -1;
  }

  // 显示弹窗
  function showPopup(word, brailleResults, rect, wordType) {
    const popupMain = popup.querySelector('.braille-popup-main');
    
    // 构建 HTML
    let html = '';

    // 汉字区域
    html += `<div class="braille-word-section">`;
    html += `<span class="braille-word-text">${word}</span>`;
    
    // 完整盲文 - SVG 点阵 + 可选中的隐藏 Unicode 文字
    const allCells = brailleResults
      .filter(r => r.brailleResult)
      .flatMap(r => r.brailleResult.cells);
    const fullBraille = allCells.map(c => c.char).join('');
    html += `<span class="braille-full-text" style="position:relative;display:inline-block">`;
    for (const cell of allCells) {
      html += brailleSVG(cell.char, 28);
    }
    html += `<span style="position:absolute;top:0;left:0;right:0;bottom:0;color:transparent;font-size:28px;letter-spacing:0.1em;cursor:text;-webkit-user-select:text;user-select:text">${fullBraille}</span>`;
    html += `</span>`;
    html += `</div>`;

    // 详情区域（根据设置决定是否折叠）
    const shouldFold = wordType === 'en' ? foldEn : foldZh;
    if (shouldFold) {
      html += `<div class="braille-detail-section" style="max-height:0;overflow:hidden;transition:max-height 0.25s ease">`;
    } else {
      html += `<div class="braille-detail-section">`;
    }
    for (const item of brailleResults) {
      if (!item.brailleResult) continue;
      const br = item.brailleResult;
      
      html += `<div class="braille-char-row">`;
      
      // 汉字 + 拼音
      html += `<div class="braille-char-info">`;
      html += `<span class="braille-char">${item.char}</span>`;
      html += `<span class="braille-pinyin">${item.pinyin}</span>`;
      html += `</div>`;

      // 盲文方块展示
      html += `<div class="braille-cells">`;
      for (const cell of br.cells) {
        html += `<div class="braille-cell">`;
        html += `<span class="braille-cell-char">${brailleSVG(cell.char, 32)}</span>`;
        if (showDots) {
          html += `<span class="braille-cell-dots">${cell.dots}</span>`;
        }
        html += `<span class="braille-cell-label">${cell.label}</span>`;
        html += `</div>`;
      }
      html += `</div>`;

      html += `</div>`;
    }
    html += `</div>`;

    popupMain.innerHTML = html;

    // 定位弹窗
    popup.style.visibility = 'hidden';
    popup.style.display = 'block';
    applyTheme();

    const popupWidth = popup.offsetWidth || 280;
    const popupHeight = popup.offsetHeight || 120;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left, top;

    if (rect.left + 5 + popupWidth <= viewportWidth) {
      left = rect.left + 5;
    } else {
      left = viewportWidth - popupWidth - 10;
      if (left < 5) left = 5;
    }

    if (rect.bottom + 5 + popupHeight <= viewportHeight) {
      top = rect.bottom + 5;
    } else {
      top = rect.top - popupHeight - 5;
      if (top < 5) top = 5;
    }

    popup.style.position = 'fixed';
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    popup.style.visibility = 'visible';
  }

  // 延迟隐藏
  function scheduleHidePopup(delay = 200) {
    if (hideTimeout) return;
    hideTimeout = setTimeout(() => {
      if (!isMouseOverPopup) hidePopup();
      hideTimeout = null;
    }, delay);
  }

  // 隐藏弹窗
  function hidePopup() {
    if (popup) popup.style.display = 'none';
    currentWord = null;
    removeHighlight();
  }

  // 选中文字
  function highlightText(textNode, offset, length) {
    try {
      const range = document.createRange();
      range.setStart(textNode, offset);
      range.setEnd(textNode, Math.min(offset + length, textNode.textContent.length));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      currentRange = range;
    } catch (e) {
      console.log('Selection failed:', e);
    }
  }

  // 移除选中
  function removeHighlight() {
    if (currentRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      currentRange = null;
    }
  }

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleEnabled') {
      isEnabled = request.enabled;
      if (!isEnabled) hidePopup();
    } else if (request.action === 'changeShowTone') {
      showTone = request.showTone;
    } else if (request.action === 'changeShowDots') {
      showDots = request.showDots;
    } else if (request.action === 'changeShowEnglish') {
      showEnglish = request.showEnglish;
    } else if (request.action === 'changeFoldZh') {
      foldZh = request.foldZh;
    } else if (request.action === 'changeFoldEn') {
      foldEn = request.foldEn;
    } else if (request.action === 'changeTheme') {
      theme = request.theme;
      applyTheme();
    }
  });

  // 将盲文 Unicode 字符渲染为 SVG 点阵（显示虚点）
  function brailleSVG(brailleChar, size) {
    const code = brailleChar.codePointAt(0) - 0x2800;
    const dots = [
      !!(code & 1),   // dot 1 (top-left)
      !!(code & 2),   // dot 2 (mid-left)
      !!(code & 4),   // dot 3 (bot-left)
      !!(code & 8),   // dot 4 (top-right)
      !!(code & 16),  // dot 5 (mid-right)
      !!(code & 32),  // dot 6 (bot-right)
    ];
    const w = size * 0.6;
    const h = size;
    const r = size * 0.1;
    const cx = [w * 0.3, w * 0.7];
    const cy = [h * 0.2, h * 0.5, h * 0.8];
    const positions = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]];
    let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="vertical-align:middle;margin:0 1px;">`;
    for (let i = 0; i < 6; i++) {
      const x = cx[positions[i][0]];
      const y = cy[positions[i][1]];
      if (dots[i]) {
        svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor"/>`;
      } else {
        svg += `<circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.2"/>`;
      }
    }
    svg += `</svg>`;
    return svg;
  }

  function applyTheme() {
    if (!popup) return;
    popup.classList.toggle('theme-dark', theme === 'dark');
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
