# Architecture & Engine

`src/telex.js` is the core engine — a zero-dependency, pure JavaScript module. It exports a single function, runs in O(n) time, and has no DOM or Node API requirements. The Raycast extension (`vntelex-transform.ts`) is just one consumer.

## Pipeline

```
telexTransform(input, skipWords)
│
├─ Split into tokens (by whitespace)
│
├─ Per token:
│  ├─ Skip-words check (exact + prefix match)
│  ├─ Telex transform loop
│  │   ├─ Consume tone markers (s,f,r,x,j)
│  │   ├─ Apply modifiers (aa→â, ee→ê, dd→đ, etc.)
│  │   └─ uo + w → ươ compound
│  ├─ Syllable validation
│  │   └─ If invalid → return original token
│  └─ Apply tone mark to correct vowel
│
└─ Join tokens
```

## Syllable Validator

Inspired by [Gõ Nhanh](https://github.com/khaphanspace/gonhanh.org)'s validation algorithm. Rejects non-Vietnamese words before tones are applied.

### Stages

```
isValidVietnameseWord("nghieng")
│
├─ Stage 1: Parse initial consonant
│   ├─ 3-char: ngh (requires len > 3)
│   ├─ 2-char: ch, gh, gi, kh, kr, ng, nh, ph, qu, th, tr (requires len > 2)
│   └─ 1-char: b, c, d, đ, g, h, k, l, m, n, p, r, s, t, v, x
│       Result: i = 3 (ngh)
│
├─ Stage 2: Parse glide
│   ├─ o before a, e  (not after q)
│   └─ u / ư before any vowel (not after q)
│       Result: no glide (next is i, not a/e)
│
├─ Stage 3: Parse vowel nucleus
│   ├─ Collect consecutive vowels
│   │   Result: "ie" (positions 3-4)
│   ├─ Validate vowel pairs (inclusion approach)
│   │   "ie" → normalize → "ie" → ✓ in VALID_VOWEL_PAIRS
│   └─ Diacritic-only check
│       "ie" not in DIACRITIC_ONLY_PAIRS → pass
│
├─ Stage 4: Parse final consonant
│   ├─ 2-char: ch, ng, nh
│   └─ 1-char: c, k, m, n, p, t, i, o, u, y
│       Result: "ng" (positions 5-6) ✓
│
└─ All chars consumed: 7 chars parsed = 7 total → ✓ valid
```

### Data Constants

| Constant | Entries | Purpose |
|----------|---------|---------|
| `VOWELS` | 67 chars | All valid Vietnamese vowels (base + marked + toned) |
| `VALID_INITIALS_1` | 16 | Single consonant initials |
| `VALID_INITIALS_2` | 11 | Double consonant clusters (incl. `kr` for ethnic names) |
| `VALID_FINALS_1` | 10 | Single final consonants + semivowels |
| `VALID_FINALS_2` | 3 | Double final consonants |
| `VALID_VOWEL_PAIRS` | 20 | Valid base vowel pairs (inclusion set) |
| `DIACRITIC_ONLY_PAIRS` | 5 | Pairs only valid with diacritics (`ue`, `ye`, `ei`, `eu`, `uu`) |
| `TONE_TO_BASE` | Map | O(1) tone mark → base vowel lookup |
| `NORMALIZE_MAP` | Map | O(1) any vowel → normalized base lookup |

### Diacritic-Only Vowel Pairs

Some vowel pairs are only valid Vietnamese when at least one character carries a diacritic:

| Pair | Plain (rejected) | With diacritic (accepted) |
|------|------------------|--------------------------|
| `ue` | `user` → stays `user` | `uể` (uê + hỏi) |
| `ye` | `yes` → stays `yes` | `yều` (yêu + huyền) |
| `ei` | `bei` → stays `bei` | `mếi` (mê + i + sắc) |
| `eu` | `meu` → stays `meu` | `mều` (mêu + huyền) |
| `uu` | `huu` → stays `huu` | `hừu` (hưu + huyền) |

The check: if a vowel pair normalizes to a diacritic-only base, but the actual characters carry no diacritic → reject the word.

### Glide Pair Validation

When a glide (`o`/`u`) is consumed before the vowel nucleus, the glide+vowel pair (e.g. `ue`, `oa`) is validated separately from the main vowel pairs. This catches words like `user` where `u` is a glide and `e` is the sole vowel — the `ue` pair would otherwise escape the main vowel-pair loop.

## Telex Modifiers

| Input | Key | Result | Rule |
|-------|-----|--------|------|
| `aa` | a | `â` | Double-a → circumflex |
| `ee` | e | `ê` | Double-e → circumflex |
| `oo` | o | `ô` | Double-o → circumflex |
| `aw` | w | `ă` | a + w → breve |
| `ow` | w | `ơ` | o + w → horn |
| `uw` | w | `ư` | u + w → horn |
| `dd` | d | `đ` | Double-d → stroke |
| `uo` + `w` | w | `ươ` | Compound horn on both u and o |

## Tone Markers

| Key | Tone | Name |
|-----|------|------|
| `s` | 1 | Sắc (acute) |
| `f` | 2 | Huyền (grave) |
| `r` | 3 | Hỏi (hook) |
| `x` | 4 | Ngã (tilde) |
| `j` | 5 | Nặng (dot) |

Tone markers are consumed when:
- They are the last character in the token, OR
- They are preceded by a vowel, OR
- The next character is a non-letter (punctuation)

### Tone Placement

Tones are placed on the correct vowel following Chữ Quốc Ngữ rules:

| Pattern | Rule | Example |
|---------|------|---------|
| Single vowel | On that vowel | `cá`, `bò` |
| Diphthong + final C | On second vowel | `toàn`, `tiếng`, `chuẩn` |
| Diphthong, no final | On first vowel | `cái`, `hỏa`, `tía` |
| `oa`/`oe` diphthong | On first unless final C follows | `hỏa` vs `hoàn` |
| Triphthong | On middle vowel | `người`, `tuyển` |
| `uy` + vowel | On third vowel | `uyển`, `thuyền` |

## Performance

All lookups are O(1) via precomputed Maps and Sets. The transform runs in O(n) where n is input length.

| Input size | Time |
|-----------|------|
| 3 words | ~3 µs |
| 12 words | ~11 µs |
| 40 words | ~50 µs |
| 200 words | ~320 µs |

## Testing

```bash
npm test
```

105 test cases covering: basic tones, modifiers, glide+tones, diacritic-only pairs, punctuation, mixed EN/VN, long sentences, and skip-words (exact + prefix matching).
