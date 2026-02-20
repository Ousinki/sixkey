<p align="center">
  <img src="extension/icons/icon128.png" width="80" />
</p>

<h1 align="center">SixKey ⠎⠊⠭⠅⠑⠽</h1>

<p align="center">
  <strong>Chinese Braille Hover Annotation</strong><br>
  A Chrome extension + macOS braille input method
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh.md">中文</a>
</p>

---

![Demo](docs/hover_demo.png)

A braille input method for macOS + Chrome extension that transforms your QWERTY keyboard into a 6-key braille typewriter with real-time Chinese braille web annotations.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🖱️ Hover Annotation | Hover over Chinese text to see braille dot patterns |
| 🔄 Bidirectional Converter | Real-time Chinese ↔ Braille conversion |
| 🎵 Tone Marks | Optional 4-tone markers |
| 🔤 English Braille | Grade 1 (EBAE) letter mapping |
| 📖 Reference Table | Full lookup for initials, finals, tones |
| 🌙 Dark Mode | Eye-friendly dark theme |
| ⌨️ RIME Schema | SDF-JKL chord braille input |

## ✋ Keyboard Layout

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

| Key | Dot | Position     | Hex     |
|-----|-----|--------------|---------|
| F   | 1   | Top-left     | `0x01`  |
| D   | 2   | Mid-left     | `0x02`  |
| S   | 3   | Bottom-left  | `0x04`  |
| J   | 4   | Top-right    | `0x08`  |
| K   | 5   | Mid-right    | `0x10`  |
| L   | 6   | Bottom-right | `0x20`  |

## 🔢 Unicode Calculation

Every braille pattern maps to a unique Unicode character in the **Braille Patterns** block (`U+2800`–`U+28FF`).

```
Unicode = U+2800 + dot1×0x01 + dot2×0x02 + dot3×0x04 + dot4×0x08 + dot5×0x10 + dot6×0x20
```

**Example**: Press `F` + `D` + `J` (dots 1, 2, 4):
```
U+2800 + 0x01 + 0x02 + 0x08 = U+280B → ⠋ (f)
```

## 🌏 Supported Braille Systems

### Chinese — 现行盲文 (GB/T 15720)

Phonetic braille based on Hanyu Pinyin (汉语拼音):
- **21 Initials**: b ⠃, p ⠏, m ⠍, f ⠋, d ⠙, t ⠞, …
- **34 Finals**: a ⠔, o ⠢, e ⠄, ai ⠪, ei ⠮, …
- **4 Tones**: optional tone markers
- e.g. 天 (tiān) = `⠞⠩` (t + ian)

> **Note**: Chinese braille is purely phonetic — the same Unicode dot patterns are reused, but mapped to pinyin initials/finals instead of English letters.

### English — Grade 1 (EBAE)

Direct letter-to-braille mapping. Each English letter has a unique dot pattern (e.g., `a` = dot 1 = ⠁).

## 📁 Project Structure

```
sixkey/
├── extension/          # Chrome browser extension
│   ├── manifest.json   # Extension config (MV3)
│   ├── braille.js      # Core conversion engine
│   ├── content.js      # Hover annotation script
│   ├── converter.html  # Bidirectional converter page
│   ├── reference.html  # Braille reference table
│   ├── popup.html/js   # Settings popup
│   └── privacy.html    # Privacy policy
├── rime/               # RIME input method schemas
├── data/               # Braille mapping data
├── docs/               # Documentation
└── pack.sh             # Chrome Web Store packaging script
```

## 🗺️ Roadmap

- [x] Core braille mapping data (Chinese & English)
- [x] Chrome hover annotation extension
- [x] Braille ↔ text bidirectional converter
- [x] RIME braille input schema
- [ ] Native macOS input method (`IMKInputController`)
- [ ] Interactive braille learning mode
- [ ] Two-Cell Chinese Braille (双拼盲文)
- [ ] Cantonese & Taiwanese braille

## 📚 References

- [Liblouis](https://github.com/liblouis/liblouis) — Open-source braille translation library
- [RIME](https://rime.im/) — Customizable input method engine
- [GB/T 15720-1995](https://www.moe.gov.cn/) — Chinese braille national standard
- [Unicode Braille Patterns](https://www.unicode.org/charts/PDF/U2800.pdf) — U+2800–U+28FF

## 📜 License

MIT
