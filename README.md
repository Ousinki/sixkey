# SixKey ⠎⠊⠭⠅⠑⠽

A braille input method for macOS that transforms your standard QWERTY keyboard into a 6-key braille typewriter.

Type braille characters by pressing **SDF-JKL** as chords — just like a [Perkins Brailler](https://en.wikipedia.org/wiki/Perkins_Brailler).

## ✋ Keyboard Layout

```
┌───┐ ┌───┐ ┌───┐       ┌───┐ ┌───┐ ┌───┐
│ S │ │ D │ │ F │       │ J │ │ K │ │ L │
│ 3 │ │ 2 │ │ 1 │       │ 4 │ │ 5 │ │ 6 │
└───┘ └───┘ └───┘       └───┘ └───┘ └───┘
  ·     ·     ●           ●     ·     ·     → dots 1+4 = ⠉ (c)
  ·     ●     ●           ·     ·     ·     → dots 1+2 = ⠃ (b)
  ●     ●     ●           ●     ·     ·     → dots 1+2+3+4 = ⠏ (k in Chinese)
```

Each key maps to one of the 6 braille dots:

| Key | Dot | Position    | Hex Value |
|-----|-----|-------------|-----------|
| F   | 1   | Top-left    | `0x01`    |
| D   | 2   | Mid-left    | `0x02`    |
| S   | 3   | Bottom-left | `0x04`    |
| J   | 4   | Top-right   | `0x08`    |
| K   | 5   | Mid-right   | `0x10`    |
| L   | 6   | Bottom-right| `0x20`    |

## 🔢 Unicode Calculation

Every braille pattern maps to a unique Unicode character in the **Braille Patterns** block (`U+2800`–`U+28FF`).

The formula is simple bitwise addition:

```
Unicode = U+2800 + dot1×0x01 + dot2×0x02 + dot3×0x04 + dot4×0x08 + dot5×0x10 + dot6×0x20
```

**Example**: Press `F` + `D` + `J` (dots 1, 2, 4):
```
U+2800 + 0x01 + 0x02 + 0x08 = U+280B → ⠋ (f in English, f in Chinese pinyin)
```

## 🌏 Supported Braille Systems

### English — Grade 1 (EBAE)
Direct letter-to-braille mapping. Each English letter has a unique dot pattern (e.g., `a` = dot 1 = ⠁).

### Chinese — 现行盲文 (Current Standard)
Phonetic braille based on Hanyu Pinyin (汉语拼音):
- **21 声母 (initials)**: b ⠃, p ⠏, m ⠍, f ⠋, d ⠙, t ⠞, ...
- **34 韵母 (finals)**: a ⠔, o ⠢, e ⠄, ai ⠪, ei ⠮, ...
- **4 声调 (tones)**: optional tone markers
- A Chinese character like 天 (tiān) = `⠞⠩` (t + ian)

> **Note**: Chinese braille is purely phonetic — the same Unicode dot patterns are reused, but mapped to pinyin initials/finals instead of English letters.

## 📁 Project Structure

```
sixkey/
├── README.md
├── data/
│   ├── chinese_braille.json    # 声母 + 韵母 + 声调 mappings
│   ├── english_braille.json    # Grade 1 letter mappings
│   └── braille_unicode.json    # Universal 64-pattern reference
├── docs/
│   └── ARCHITECTURE.md         # Technical design document
└── .gitignore
```

## 🗺️ Roadmap

- [x] Core braille mapping data (Chinese & English)
- [ ] RIME (鼠须管) custom schema with `chord_composer`
- [ ] Native macOS input method (`IMKInputController`)
- [ ] Braille ↔ text bidirectional converter
- [ ] Interactive braille learning mode
- [ ] Support for 双拼盲文 (Two-Cell Chinese Braille)
- [ ] Support for Cantonese (粤语) and Taiwanese (注音) braille

## 📚 References

- [Liblouis](https://github.com/liblouis/liblouis) — Open-source braille translation library (industry standard)
- [RIME 中州韵](https://rime.im/) — Customizable input method engine
- [GB/T 15720-1995](https://www.moe.gov.cn/) — Chinese braille national standard (中国盲文)
- [Unicode Braille Patterns](https://www.unicode.org/charts/PDF/U2800.pdf) — U+2800–U+28FF
- [Braille Academy](https://brailleacademy.com/) — Interactive braille learning

## License

MIT
