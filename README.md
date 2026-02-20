# SixKey ⠎⠊⠭⠅⠑⠽

**盲文悬浮注音 · Chinese Braille Hover Annotation**

一款 macOS 盲文输入法 + Chrome 浏览器插件，将标准 QWERTY 键盘变为 6 键盲文打字机，并提供网页中文实时盲文注音。

A braille input method for macOS + Chrome extension that transforms your QWERTY keyboard into a 6-key braille typewriter with real-time Chinese braille web annotations.

![Demo](docs/hover_demo.png)

---

## ✨ 功能特性 Features

| 功能 | Feature | 说明 Description |
|------|---------|-----------------|
| 🖱️ 悬浮注音 | Hover Annotation | 鼠标悬停中文即显示盲文点位图<br>Hover over Chinese text to see braille dot patterns |
| 🔄 双向转换器 | Bidirectional Converter | 中文 ↔ 盲文实时互转<br>Real-time Chinese ↔ Braille conversion |
| 🎵 声调标注 | Tone Marks | 支持四声声调显示<br>Optional 4-tone markers |
| 🔤 英文盲文 | English Braille | 支持 Grade 1 国际盲文<br>Grade 1 (EBAE) letter mapping |
| 📖 对照表 | Reference Table | 声母/韵母/声调/英文完整对照<br>Full lookup for initials, finals, tones |
| 🌙 深色模式 | Dark Mode | 全界面深色主题<br>Eye-friendly dark theme |
| ⌨️ RIME 方案 | RIME Schema | 6 键和弦输入盲文<br>SDF-JKL chord braille input |

---

## ✋ 键盘布局 Keyboard Layout

用 **SDF-JKL** 六个键同时按下（和弦），如同 [Perkins 盲文打字机](https://en.wikipedia.org/wiki/Perkins_Brailler)。

Press **SDF-JKL** as chords — just like a [Perkins Brailler](https://en.wikipedia.org/wiki/Perkins_Brailler).

```
┌───┐ ┌───┐ ┌───┐       ┌───┐ ┌───┐ ┌───┐
│ S │ │ D │ │ F │       │ J │ │ K │ │ L │
│ 3 │ │ 2 │ │ 1 │       │ 4 │ │ 5 │ │ 6 │
└───┘ └───┘ └───┘       └───┘ └───┘ └───┘
  ·     ·     ●           ●     ·     ·     → dots 1+4 = ⠉ (c)
  ·     ●     ●           ·     ·     ·     → dots 1+2 = ⠃ (b)
  ●     ●     ●           ●     ·     ·     → dots 1+2+3+4 = ⠏ (k in Chinese)
```

| 键 Key | 点 Dot | 位置 Position | 十六进制 Hex |
|--------|--------|--------------|------------|
| F | 1 | 左上 Top-left | `0x01` |
| D | 2 | 左中 Mid-left | `0x02` |
| S | 3 | 左下 Bottom-left | `0x04` |
| J | 4 | 右上 Top-right | `0x08` |
| K | 5 | 右中 Mid-right | `0x10` |
| L | 6 | 右下 Bottom-right | `0x20` |

---

## 🔢 Unicode 编码计算 Unicode Calculation

所有盲文图案对应 Unicode **Braille Patterns** 区块 (`U+2800`–`U+28FF`) 中的唯一字符。

Every braille pattern maps to a unique Unicode character in the Braille Patterns block (`U+2800`–`U+28FF`).

```
Unicode = U+2800 + dot1×0x01 + dot2×0x02 + dot3×0x04 + dot4×0x08 + dot5×0x10 + dot6×0x20
```

**示例 Example**：按 `F` + `D` + `J`（点 1, 2, 4）：
```
U+2800 + 0x01 + 0x02 + 0x08 = U+280B → ⠋ (f)
```

---

## 🌏 支持的盲文体系 Supported Braille Systems

### 英文 English — Grade 1 (EBAE)
字母与盲文直接映射，每个英文字母对应唯一的盲文点位（如 `a` = 点 1 = ⠁）。

Direct letter-to-braille mapping (e.g., `a` = dot 1 = ⠁).

### 中文 Chinese — 现行盲文 (GB/T 15720)
基于汉语拼音的表音盲文：

Phonetic braille based on Hanyu Pinyin (汉语拼音):

- **21 声母 Initials**: b ⠃, p ⠏, m ⠍, f ⠋, d ⠙, t ⠞, …
- **34 韵母 Finals**: a ⠔, o ⠢, e ⠄, ai ⠪, ei ⠮, …
- **4 声调 Tones**: 可选声调标记 / optional tone markers
- 例如 天 (tiān) = `⠞⠩` (t + ian)

> **注意 Note**：中文盲文是纯表音的——使用相同的 Unicode 点阵字符，但映射到拼音声母/韵母而非英文字母。
>
> Chinese braille is purely phonetic — the same Unicode dot patterns are reused, but mapped to pinyin initials/finals instead of English letters.

---

## 📁 项目结构 Project Structure

```
sixkey/
├── extension/          # Chrome 浏览器插件 / Browser extension
│   ├── manifest.json   # 扩展配置 (MV3)
│   ├── braille.js      # 核心转换引擎 / Core conversion engine
│   ├── content.js      # 悬浮注音脚本 / Hover annotation script
│   ├── converter.html  # 双向转换器页面 / Bidirectional converter
│   ├── reference.html  # 盲文对照表 / Braille reference table
│   ├── popup.html/js   # 设置弹窗 / Settings popup
│   └── privacy.html    # 隐私政策 / Privacy policy
├── rime/               # RIME 输入法方案 / RIME input schemas
├── data/               # 盲文映射数据 / Braille mapping data
├── docs/               # 文档 / Documentation
└── pack.sh             # Chrome 商店打包脚本 / Store packaging script
```

---

## 🗺️ 路线图 Roadmap

- [x] 核心盲文映射数据 Core braille mapping data (Chinese & English)
- [x] Chrome 浏览器悬浮注音插件 Chrome hover annotation extension
- [x] 双向盲文转换器 Braille ↔ text bidirectional converter
- [x] RIME 盲文输入方案 RIME braille input schema
- [ ] 原生 macOS 输入法 Native macOS input method (`IMKInputController`)
- [ ] 互动式盲文学习模式 Interactive braille learning mode
- [ ] 双拼盲文支持 Two-Cell Chinese Braille (双拼盲文)
- [ ] 粤语/注音盲文支持 Cantonese & Taiwanese braille

---

## 📚 参考资料 References

- [Liblouis](https://github.com/liblouis/liblouis) — 开源盲文翻译库 / Open-source braille translation library
- [RIME 中州韵](https://rime.im/) — 可定制输入法引擎 / Customizable input method engine
- [GB/T 15720-1995](https://www.moe.gov.cn/) — 中国盲文国家标准 / Chinese braille national standard
- [Unicode Braille Patterns](https://www.unicode.org/charts/PDF/U2800.pdf) — U+2800–U+28FF
- [Braille Academy](https://brailleacademy.com/) — 互动盲文学习 / Interactive braille learning

## 📜 许可证 License

MIT
