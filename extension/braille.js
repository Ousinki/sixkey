/**
 * 盲文转换模块 (Braille Conversion Module)
 * 将拼音转换为现行盲文 Unicode 符号
 */

(function (global) {
  "use strict";

  // 现行盲文标准 (GB/T 15720 / 国家通用盲文方案)
  // 数据来源: 教育部 moe.gov.cn
  const INITIALS = {
    b: "⠃",   // dots 12
    p: "⠏",   // dots 1234
    m: "⠍",   // dots 134
    f: "⠋",   // dots 124
    d: "⠙",   // dots 145
    t: "⠞",   // dots 2345
    n: "⠝",   // dots 1345
    l: "⠇",   // dots 123
    g: "⠛",   // dots 1245
    k: "⠅",   // dots 13
    h: "⠓",   // dots 125
    j: "⠛",   // dots 1245 (same as g)
    q: "⠅",   // dots 13 (same as k)
    x: "⠓",   // dots 125 (same as h)
    zh: "⠌",  // dots 34
    ch: "⠟",  // dots 12345
    sh: "⠱",  // dots 156
    r: "⠚",   // dots 245
    z: "⠵",   // dots 1356
    c: "⠉",   // dots 14
    s: "⠎",   // dots 234
  };

  const FINALS = {
    a: "⠔",     // dots 35
    o: "⠢",     // dots 26 (same as e, per Wikipedia)
    uo: "⠕",    // dots 135 (wo, -uo)
    ua: "⠿",    // dots 123456 (wa, -ua)
    e: "⠢",     // dots 26
    i: "⠊",     // dots 24
    u: "⠥",     // dots 136
    v: "⠬",     // dots 346 (ü)
    ai: "⠪",    // dots 246
    ei: "⠮",    // dots 2346
    ao: "⠖",    // dots 235
    ou: "⠷",    // dots 12356
    an: "⠧",    // dots 1236
    en: "⠴",    // dots 356
    ang: "⠦",   // dots 236
    eng: "⠼",   // dots 3456
    ong: "⠲",   // dots 256
    er: "⠗",    // dots 1235
    ie: "⠑",    // dots 15
    ia: "⠫",    // dots 1246
    iou: "⠳",   // dots 1256 (iu)
    uei: "⠺",   // dots 2456 (ui)
    ve: "⠾",    // dots 23456 (üe)
    in: "⠣",    // dots 126
    un: "⠒",    // dots 25 (un/uen)
    uen: "⠒",   // dots 25 (alias)
    vn: "⠸",    // dots 456 (ün)
    ing: "⠡",   // dots 16
    ian: "⠩",   // dots 146
    iao: "⠜",   // dots 345
    iong: "⠹",  // dots 1456
    iang: "⠭",  // dots 1346
    uan: "⠻",   // dots 12456
    uai: "⠽",   // dots 13456
    uang: "⠶", // dots 2356
    van: "⠯",   // dots 12346 (üan)
  };

  const TONES = {
    1: "⠁",   // dot 1
    2: "⠂",   // dot 2
    3: "⠄",   // dot 3
    4: "⠆",   // dots 23
  };

  // 点位号映射（用于显示）
  const DOTS_MAP = {
    "⠀": "",
    "⠁": "1",
    "⠂": "2",
    "⠃": "12",
    "⠄": "3",
    "⠅": "13",
    "⠆": "23",
    "⠇": "123",
    "⠈": "4",
    "⠉": "14",
    "⠊": "24",
    "⠋": "124",
    "⠌": "34",
    "⠍": "134",
    "⠎": "234",
    "⠏": "1234",
    "⠐": "5",
    "⠑": "15",
    "⠒": "25",
    "⠓": "125",
    "⠔": "35",
    "⠕": "135",
    "⠖": "235",
    "⠗": "1235",
    "⠘": "45",
    "⠙": "145",
    "⠚": "245",
    "⠛": "1245",
    "⠜": "345",
    "⠝": "1345",
    "⠞": "2345",
    "⠟": "12345",
    "⠠": "6",
    "⠡": "16",
    "⠢": "26",
    "⠣": "126",
    "⠤": "36",
    "⠥": "136",
    "⠦": "236",
    "⠧": "1236",
    "⠨": "46",
    "⠩": "146",
    "⠪": "246",
    "⠫": "1246",
    "⠬": "346",
    "⠭": "1346",
    "⠮": "2346",
    "⠯": "12346",
    "⠰": "56",
    "⠱": "156",
    "⠲": "256",
    "⠳": "1256",
    "⠴": "356",
    "⠵": "1356",
    "⠶": "2356",
    "⠷": "12356",
    "⠸": "456",
    "⠹": "1456",
    "⠺": "2456",
    "⠻": "12456",
    "⠼": "3456",
    "⠽": "13456",
    "⠾": "23456",
    "⠿": "123456",
  };

  // 所有声母列表（从长到短排序，优先匹配长的）
  const INITIAL_LIST = [
    "zh",
    "ch",
    "sh",
    "b",
    "p",
    "m",
    "f",
    "d",
    "t",
    "n",
    "l",
    "g",
    "k",
    "h",
    "j",
    "q",
    "x",
    "r",
    "z",
    "c",
    "s",
  ];

  // 标准拼音中的韵母别名映射（pinyin-pro 输出 → 盲文标准韵母）
  const FINAL_ALIAS = {
    iu: "iou",
    ui: "uei",
    ü: "v",
    üe: "ve",
    üan: "van",
    ün: "vn",
  };

  /**
   * 解析拼音音节，分离声母、韵母、声调
   * @param {string} syllable - 带声调的拼音音节（如 "nǐ"）
   * @returns {{ initial: string, final: string, tone: string, rawPinyin: string }}
   */
  function parseSyllable(syllable) {
    if (!syllable) return null;

    // 使用 pinyin-pro 获取无声调拼音和声调号
    let rawPinyin = syllable.toLowerCase().trim();

    // 提取声调号（如果末尾有数字 1-4）
    let tone = "";
    const toneMatch = rawPinyin.match(/([1-4])$/);
    if (toneMatch) {
      tone = toneMatch[1];
      rawPinyin = rawPinyin.slice(0, -1);
    }

    // 处理零声母音节的拼写变体
    // y → i 系列, w → u 系列
    let initial = "";
    let final = rawPinyin;

    // 先尝试匹配声母
    for (const ini of INITIAL_LIST) {
      if (rawPinyin.startsWith(ini)) {
        initial = ini;
        final = rawPinyin.substring(ini.length);
        break;
      }
    }

    // 处理零声母（y/w 开头的特殊情况）
    if (!initial) {
      if (rawPinyin.startsWith("y")) {
        if (rawPinyin === "yi" || rawPinyin === "y") {
          final = "i";
        } else if (rawPinyin === "yun") {
          // yun → vn (ün), per 现行盲文标准
          final = "vn";
        } else if (rawPinyin === "yuan") {
          // yuan → uan (not van), per RIME standard: ⠲
          final = "uan";
        } else if (rawPinyin.startsWith("yu")) {
          final = "v" + rawPinyin.substring(2);
        } else if (rawPinyin.startsWith("yi")) {
          final = "i" + rawPinyin.substring(2);
        } else {
          // ya → ia, ye → ie, yao → iao, you → iou, yan → ian, etc.
          final = "i" + rawPinyin.substring(1);
        }
      } else if (rawPinyin.startsWith("w")) {
        if (rawPinyin === "wu" || rawPinyin === "w") {
          final = "u";
        } else if (rawPinyin.startsWith("wu")) {
          final = "u" + rawPinyin.substring(2);
        } else {
          // wa → ua, wo → uo, wai → uai, wei → uei, wan → uan, etc.
          final = "u" + rawPinyin.substring(1);
        }
      }
    }

    // 特殊处理 j/q/x + u → j/q/x + v (ü)
    if (["j", "q", "x"].includes(initial)) {
      if (final === "u") final = "v";
      else if (final === "ue") final = "ve";
      else if (final === "uan") final = "van";
      else if (final === "un") final = "vn";
    }

    // 现行盲文规则：zh/ch/sh/r/z/c/s + i（舌尖元音/空韵）省略韵母
    // zhi, chi, shi, ri, zi, ci, si 只写声母，不写韵母 i
    if (["zh", "ch", "sh", "r", "z", "c", "s"].includes(initial) && final === "i") {
      final = "";
    }

    // 应用韵母别名
    if (FINAL_ALIAS[final]) {
      final = FINAL_ALIAS[final];
    }

    return { initial, final, tone, rawPinyin: syllable };
  }

  /**
   * 将单个拼音音节转为盲文
   * @param {string} syllable - 无声调拼音（如 "ni"）+ 声调号（如 "3"）
   * @param {boolean} withTone - 是否包含声调
   * @returns {{ braille: string, cells: Array, initialPart: string, finalPart: string, tonePart: string }}
   */
  function syllableToBraille(syllable, withTone = false) {
    const parsed = parseSyllable(syllable);
    if (!parsed) return null;

    const initialChar = parsed.initial ? INITIALS[parsed.initial] || "" : "";
    const finalChar = FINALS[parsed.final] || "";

    if (!finalChar && !initialChar) return null;

    let braille = "";
    const cells = [];

    if (initialChar) {
      braille += initialChar;
      cells.push({
        char: initialChar,
        dots: DOTS_MAP[initialChar] || "",
        label: parsed.initial,
      });
    }

    if (finalChar) {
      braille += finalChar;
      cells.push({
        char: finalChar,
        dots: DOTS_MAP[finalChar] || "",
        label: parsed.final,
      });
    }

    let toneChar = "";
    if (withTone && parsed.tone && TONES[parsed.tone]) {
      toneChar = TONES[parsed.tone];
      braille += toneChar;
      cells.push({
        char: toneChar,
        dots: DOTS_MAP[toneChar] || "",
        label: `tone ${parsed.tone}`,
      });
    }

    return {
      braille,
      cells,
      initial: parsed.initial,
      final: parsed.final,
      tone: parsed.tone,
      initialChar,
      finalChar,
      toneChar,
    };
  }

  /**
   * 获取盲文符号的点位号
   */
  function getDots(brailleChar) {
    return DOTS_MAP[brailleChar] || "";
  }

  /**
   * 将中文文本转为盲文注音
   * @param {string} text - 中文文本
   * @param {boolean} withTone - 是否显示声调
   * @returns {Array<{ char: string, pinyin: string, pinyinWithTone: string, brailleResult: object }>}
   */
  /**
   * 检查拼音是否是"声母独用"（zhi/chi/shi/ri/zi/ci/si → 只写声母）
   */
  function isInitialOnly(pinyinNum) {
    if (!pinyinNum) return false;
    const raw = pinyinNum.replace(/[1-4]$/, "");
    return ["zhi", "chi", "shi", "ri", "zi", "ci", "si"].includes(raw);
  }

  /**
   * 检查拼音是否是"韵母独用"（零声母音节）
   */
  function isZeroInitial(pinyinNum) {
    if (!pinyinNum) return false;
    const raw = pinyinNum.replace(/[1-4]$/, "");
    // 零声母：以 a/o/e/i 开头（不含声母），或 y/w 开头的（会被还原为韵母）
    return /^[aoeiywü]/.test(raw);
  }

  /**
   * 将中文文本转为盲文注音
   * @param {string} text - 中文文本
   * @param {boolean} withTone - 是否显示声调
   * @returns {Array<{ char: string, pinyin: string, pinyinWithTone: string, brailleResult: object }>}
   */
  function textToBraille(text, withTone = false) {
    if (!text || !global.pinyinPro) return [];

    const results = [];

    // 获取每个字的拼音（带声调数字）
    const pinyinArr = global.pinyinPro.pinyin(text, {
      toneType: "num",
      type: "array",
    });

    // 获取带声调符号的拼音（用于显示）
    const pinyinDisplayArr = global.pinyinPro.pinyin(text, {
      toneType: "symbol",
      type: "array",
    });

    const chars = [...text];

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const py = pinyinArr[i] || "";
      const pyDisplay = pinyinDisplayArr[i] || "";

      // 只处理中文字符
      if (!/[\u4e00-\u9fff]/.test(char)) {
        results.push({
          char,
          pinyin: "",
          pinyinWithTone: "",
          brailleResult: null,
        });
        continue;
      }

      // 界音声调规则：声母独用 + 韵母独用 → 自动加前字声调
      // 即使 withTone=false，也要强制加声调以避免歧义
      let forceTone = false;
      if (isInitialOnly(py)) {
        // 找下一个中文字符
        for (let j = i + 1; j < chars.length; j++) {
          if (/[\u4e00-\u9fff]/.test(chars[j])) {
            const nextPy = pinyinArr[j] || "";
            if (isZeroInitial(nextPy)) {
              forceTone = true;
            }
            break;
          }
        }
      }

      // 规则5：常用同音、近音字词的特别规定
      // 她 → 写声调（阴平⠁），用以区分"他"
      // 它 → 声母前加四点符形⠈(dot 4)，不写声调
      if (char === "她") {
        forceTone = true;
      }

      const brailleResult = syllableToBraille(py, withTone || forceTone);

      // 它 → 在盲文前面加四点符形 ⠈ (dot 4) 作为特殊标记
      if (char === "它" && brailleResult) {
        const prefix = { char: "⠈", dots: "4", label: "它" };
        brailleResult.braille = "⠈" + brailleResult.braille;
        brailleResult.cells.unshift(prefix);
      }

      results.push({
        char,
        pinyin: pyDisplay,
        pinyinNum: py,
        brailleResult,
        boundaryTone: forceTone,
      });
    }

    return results;
  }

  // ===== 中文标点符号盲文映射（现行盲文标准）=====
  const PUNCTUATION_BRAILLE = {
    // 句末标点（前后均不空方）
    "。": { braille: "⠐⠆", name: "句号", cells: 2, spaceBefore: false, spaceAfter: false },
    "？": { braille: "⠐⠄", name: "问号", cells: 2, spaceBefore: false, spaceAfter: false },
    "！": { braille: "⠰⠂", name: "感叹号", cells: 2, spaceBefore: false, spaceAfter: false },
    // 句中标点（前不空方，后空一方）
    "，": { braille: "⠐",   name: "逗号", cells: 1, spaceBefore: false, spaceAfter: true },
    "、": { braille: "⠈",   name: "顿号", cells: 1, spaceBefore: false, spaceAfter: true },
    "：": { braille: "⠤",   name: "冒号", cells: 1, spaceBefore: false, spaceAfter: true },
    "；": { braille: "⠰",   name: "分号", cells: 1, spaceBefore: false, spaceAfter: true },
    // 特殊标点
    "——": { braille: "⠠⠤",   name: "破折号", cells: 2, spaceBefore: false, spaceAfter: false },
    "……": { braille: "⠐⠐⠐", name: "省略号", cells: 3, spaceBefore: false, spaceAfter: true },
    // 引号（开号前空一方，关号后空一方，同形dot45）
    "\u201C": { braille: "⠘",  name: "引号", cells: 1, spaceBefore: true, spaceAfter: false },
    "\u201D": { braille: "⠘",  name: "引号", cells: 1, spaceBefore: false, spaceAfter: true },
    "\u2018": { braille: "⠘",  name: "引号", cells: 1, spaceBefore: true, spaceAfter: false },
    "\u2019": { braille: "⠘",  name: "引号", cells: 1, spaceBefore: false, spaceAfter: true },
    // 圆括号（前后均不空方）
    "（": { braille: "⠰⠄",  name: "左圆括号", cells: 2, spaceBefore: false, spaceAfter: false },
    "）": { braille: "⠠⠆",  name: "右圆括号", cells: 2, spaceBefore: false, spaceAfter: false },
    "(":  { braille: "⠰⠄",  name: "左圆括号", cells: 2, spaceBefore: false, spaceAfter: false },
    ")":  { braille: "⠠⠆",  name: "右圆括号", cells: 2, spaceBefore: false, spaceAfter: false },
    // 方括号（前后均不空方，开关同形）
    "［": { braille: "⠰⠆",  name: "方括号", cells: 2, spaceBefore: false, spaceAfter: false },
    "］": { braille: "⠰⠆",  name: "方括号", cells: 2, spaceBefore: false, spaceAfter: false },
    "[":  { braille: "⠰⠆",  name: "方括号", cells: 2, spaceBefore: false, spaceAfter: false },
    "]":  { braille: "⠰⠆",  name: "方括号", cells: 2, spaceBefore: false, spaceAfter: false },
    // 双书名号（开号前空一方，关号后空一方）
    "《": { braille: "⠐⠤", name: "左书名号", cells: 2, spaceBefore: true, spaceAfter: false },
    "》": { braille: "⠤⠂", name: "右书名号", cells: 2, spaceBefore: false, spaceAfter: true },
    // 单书名号（开号前空一方，关号后空一方）
    "〈": { braille: "⠐⠄", name: "左单书名号", cells: 2, spaceBefore: true, spaceAfter: false },
    "〉": { braille: "⠠⠂", name: "右单书名号", cells: 2, spaceBefore: false, spaceAfter: true },
    // 间隔号（前后均不空方）
    "·":  { braille: "⠠⠄", name: "间隔号", cells: 2, spaceBefore: false, spaceAfter: false },
    "\u00B7": { braille: "⠠⠄", name: "间隔号", cells: 2, spaceBefore: false, spaceAfter: false },
    // 着重号（前空一方）
    "\uFE45": { braille: "⠐", name: "着重号", cells: 1, spaceBefore: true, spaceAfter: false },
    // 换行连写号（dot36）
    // 注：换行连写号用于盲文排版，不会出现在明文中
    // 半角/ASCII 标点映射
    "?": { braille: "⠐⠄", name: "问号", cells: 2, spaceBefore: false, spaceAfter: false },
    "!": { braille: "⠰⠂", name: "感叹号", cells: 2, spaceBefore: false, spaceAfter: false },
    ",": { braille: "⠐",   name: "逗号", cells: 1, spaceBefore: false, spaceAfter: true },
    ":": { braille: "⠤",   name: "冒号", cells: 1, spaceBefore: false, spaceAfter: true },
    ";": { braille: "⠰",   name: "分号", cells: 1, spaceBefore: false, spaceAfter: true },
    ".": { braille: "⠐⠆", name: "句号", cells: 2, spaceBefore: false, spaceAfter: false },
  };

  // 多字符标点列表（优先匹配长的）
  const MULTI_CHAR_PUNCTUATION = ["——", "……"];

  /**
   * 将标点符号转为盲文
   * @param {string} punct - 标点字符
   * @returns {{ braille: string, cells: Array, name: string }} | null
   */
  function punctuationToBraille(punct) {
    const entry = PUNCTUATION_BRAILLE[punct];
    if (!entry) return null;

    const chars = [...entry.braille];
    const cells = [];

    // 前空一方
    if (entry.spaceBefore) {
      cells.push({ char: "⠀", dots: "", label: "空方" });
    }

    // 标点本体
    for (let i = 0; i < chars.length; i++) {
      cells.push({
        char: chars[i],
        dots: DOTS_MAP[chars[i]] || "",
        label: chars.length === 1 ? entry.name : `${entry.name}${i + 1}`,
      });
    }

    // 后空一方
    if (entry.spaceAfter) {
      cells.push({ char: "⠀", dots: "", label: "空方" });
    }

    const fullBraille = cells.map(c => c.char).join("");

    return {
      braille: fullBraille,
      cells,
      name: entry.name,
    };
  }

  // ===== 国际盲文英文字母映射 =====
  const ENGLISH_BRAILLE = {
    a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑",
    f: "⠋", g: "⠛", h: "⠓", i: "⠊", j: "⠚",
    k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕",
    p: "⠏", q: "⠟", r: "⠗", s: "⠎", t: "⠞",
    u: "⠥", v: "⠧", w: "⠺", x: "⠭", y: "⠽",
    z: "⠵",
  };

  // 将单个英文字母转为盲文
  function charToBraille(char) {
    const lower = char.toLowerCase();
    const brailleChar = ENGLISH_BRAILLE[lower];
    if (!brailleChar) return null;
    return {
      braille: brailleChar,
      cells: [{
        char: brailleChar,
        dots: DOTS_MAP[brailleChar] || "",
        label: lower,
      }],
    };
  }

  // 导出
  global.BrailleConverter = {
    parseSyllable,
    syllableToBraille,
    textToBraille,
    charToBraille,
    punctuationToBraille,
    getDots,
    DOTS_MAP,
    INITIALS,
    FINALS,
    TONES,
    ENGLISH_BRAILLE,
    PUNCTUATION_BRAILLE,
    MULTI_CHAR_PUNCTUATION,
  };
})(window);
