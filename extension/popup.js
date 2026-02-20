/**
 * 盲文悬浮注音 - Popup Script
 */
(function() {
  'use strict';

  const toggleEnabled = document.getElementById('toggle-enabled');
  const toggleTone = document.getElementById('toggle-tone');
  const toggleDots = document.getElementById('toggle-dots');
  const toggleEnglish = document.getElementById('toggle-english');
  const toggleFoldZh = document.getElementById('toggle-fold-zh');
  const toggleFoldEn = document.getElementById('toggle-fold-en');
  const themeBtn = document.getElementById('theme-toggle');

  // 加载设置
  chrome.storage.sync.get(['enabled', 'showTone', 'showDots', 'showEnglish', 'foldZh', 'foldEn', 'theme'], (result) => {
    toggleEnabled.checked = result.enabled !== false;
    toggleTone.checked = result.showTone === true;
    toggleDots.checked = result.showDots !== false;
    toggleEnglish.checked = result.showEnglish === true;
    toggleFoldZh.checked = result.foldZh === true;
    toggleFoldEn.checked = result.foldEn !== false; // 默认开启
    applyTheme(result.theme || 'light');
  });

  // 启用/禁用
  toggleEnabled.addEventListener('change', () => {
    const enabled = toggleEnabled.checked;
    chrome.storage.sync.set({ enabled });
    notifyTabs({ action: 'toggleEnabled', enabled });
  });

  // 声调
  toggleTone.addEventListener('change', () => {
    const showTone = toggleTone.checked;
    chrome.storage.sync.set({ showTone });
    notifyTabs({ action: 'changeShowTone', showTone });
    updateDemo(showTone);
  });

  // 点位号
  toggleDots.addEventListener('change', () => {
    const showDots = toggleDots.checked;
    chrome.storage.sync.set({ showDots });
    notifyTabs({ action: 'changeShowDots', showDots });
  });

  // 英文盲文
  toggleEnglish.addEventListener('change', () => {
    const showEnglish = toggleEnglish.checked;
    chrome.storage.sync.set({ showEnglish });
    notifyTabs({ action: 'changeShowEnglish', showEnglish });
  });

  // 中文折叠
  toggleFoldZh.addEventListener('change', () => {
    chrome.storage.sync.set({ foldZh: toggleFoldZh.checked });
    notifyTabs({ action: 'changeFoldZh', foldZh: toggleFoldZh.checked });
  });

  // 英文折叠
  toggleFoldEn.addEventListener('change', () => {
    chrome.storage.sync.set({ foldEn: toggleFoldEn.checked });
    notifyTabs({ action: 'changeFoldEn', foldEn: toggleFoldEn.checked });
  });

  // 主题切换
  themeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('theme-dark');
    const theme = isDark ? 'light' : 'dark';
    chrome.storage.sync.set({ theme });
    applyTheme(theme);
    notifyTabs({ action: 'changeTheme', theme });
  });

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    themeBtn.textContent = isDark ? '☀' : '☾';
  }

  function notifyTabs(msg) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
      });
    });
  }

  function updateDemo(withTone) {
    const el = document.getElementById('demo-braille');
    el.textContent = withTone ? '⠝⠊⠄ ⠓⠖⠄' : '⠝⠊ ⠓⠖';
  }
})();
