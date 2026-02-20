# SixKey Architecture

## Data Flow

```
┌──────────────┐    ┌────────────────┐    ┌───────────────┐    ┌──────────────┐
│   Keyboard   │    │  Chord Engine  │    │ Mapping Engine │    │    Output    │
│  SDF-JKL     │───▶│  Multi-key     │───▶│  Dots → Char  │───▶│  Unicode     │
│  (physical)  │    │  detection     │    │  (per schema) │    │  Braille     │
└──────────────┘    └────────────────┘    └───────────────┘    └──────────────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                 ▼                 ▼
                        ┌──────────┐    ┌──────────────┐   ┌──────────┐
                        │ English  │    │   Chinese    │   │  Direct  │
                        │ Grade 1  │    │ 现行盲文     │   │  Braille │
                        │ (letter) │    │ (pinyin IME) │   │  (dots)  │
                        └──────────┘    └──────────────┘   └──────────┘
```

## Core Modules

### 1. Chord Engine

Detects simultaneous key presses on SDF-JKL and converts them into a dot pattern (6-bit integer).

**Input**: Raw key-down/key-up events
**Output**: `UInt8` representing dots (e.g., `0b000111` = dots 1+2+3 = ⠇)

**Key challenge**: Defining the timing window for "simultaneous" presses. Typical threshold: 50-100ms.

### 2. Mapping Engine

Takes a dot pattern and produces output based on the active schema:

| Schema         | Input         | Output                                 |
| -------------- | ------------- | -------------------------------------- |
| Direct Braille | dots          | Unicode braille character              |
| English G1     | dots          | English letter/symbol                  |
| Chinese 现行   | dots sequence | Pinyin → Chinese characters (via IME) |

### 3. Chinese Pinyin Pipeline

```
dots → braille cell → pinyin initial/final → pinyin syllable → Chinese character
                                                        ▲
                                                        │
                                                  candidate list
                                                  (like pinyin IME)
```

The Chinese pipeline requires an additional **Pinyin-to-Hanzi** step, which functions like a standard pinyin input method. Options:

- Integrate with system IME framework
- Use an open-source dictionary (e.g., librime / pypinyin)
- Use liblouis for braille-to-text translation

## Implementation Paths

### 「方案选单」Path A: RIME Schema (Quick Prototype)

Use the RIME engine (鼠须管 on macOS) with `chord_composer`:

- Define SDF-JKL as chord keys in `braille.schema.yaml`
- Map chords to pinyin via `braille.dict.yaml`
- RIME handles candidate selection and text output
- **Pros**: Fast to build, battle-tested IME framework
- **Cons**: Limited UI customization

### Path B: Native macOS IME (Full Control)

Build a macOS input method using `IMKInputController`:

- Bundle ID must contain `.inputmethod`
- Install to `~/Library/Input Methods/`
- Handle `NSEvent` key events, implement chord detection
- Custom candidate window with SwiftUI
- **Pros**: Full control, custom braille visualization
- **Cons**: More development effort, system integration complexity

## File Reference

| File                          | Purpose                                       |
| ----------------------------- | --------------------------------------------- |
| `data/chinese_braille.json` | Chinese initials/finals/tones → dot patterns |
| `data/english_braille.json` | English letters/digits → dot patterns        |
| `data/braille_unicode.json` | All 64 six-dot Unicode patterns               |
