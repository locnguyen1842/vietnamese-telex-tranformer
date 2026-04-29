Project Name: Vietnamese Telex Transformer
Category: Productivity / Text Manipulation Tool

Problem: Standard Vietnamese IMEs (Telex/VNI) interfere with coding, terminal commands, and English-Vietnamese mixed typing. Manual keyboard switching breaks developer flow.

Solution: Post-processing transformation tool. Select text → press hotkey → text is parsed for Telex marks and replaced with Unicode-compliant Vietnamese. The engine auto-detects English words via full syllable structure validation.

Tech Stack:
- Platform: Raycast (macOS)
- Language: TypeScript / JavaScript
- Engine: `src/telex.js` — zero-dependency, reusable across any JS runtime
  - Full syllable validator (onset → glide → vowel → final → all chars consumed)
  - Telex modifier transform loop (aa→â, dd→đ, ow→ơ, uo+w→ươ)
  - O(1) precomputed lookup maps for all tone/normalize operations
  - 105 test cases covering tones, modifiers, diacritic pairs, punctuation, EN/VN mixed

Architecture:
- `src/telex.js` — Core engine, reusable
- `src/vntelex-transform.ts` — Raycast platform layer
- `src/telex.test.js` — Test suite (105 cases)
- `docs/architecture.md` — Engine details
- `docs/raycast.md` — Extension usage
- `docs/integration.md` — Reuse examples
