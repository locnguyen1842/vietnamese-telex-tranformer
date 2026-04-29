# Raycast Extension

Transform selected Telex text into proper Vietnamese with one hotkey. No IME, no keyboard switching.

## Installation

1. Clone this repository
2. Run `npm install`
3. In Raycast → Extensions → **Import Extension**, select this folder
4. In Raycast Settings → Extensions → **Transform Vietnamese Telex**, assign a hotkey (recommended: `Cmd + Option + V`)

## Usage

1. Select raw telex text anywhere
2. Press your assigned hotkey
3. The selection transforms in place

```
Select:  tooi ddang hocj code, fix bug status cho user
Press:   Cmd+Option+V
Result:  tôi đang học code, fix bug status cho user
```

English words are automatically detected and left alone. Punctuation and code symbols pass through.

## Skip Words

Some English words coincidentally form structurally valid Vietnamese syllables and cannot be auto-detected:

| Input | Output | Reason |
|-------|--------|--------|
| `mix` | `mĩ` | `mi` + sắc = valid syllable |
| `core` | `cỏe` | `c` + `oe` + hỏi = valid syllable |
| `test` | `tét` | `t` + `e` + `t` + sắc = valid syllable |

These are handled by a skip-word list. **Prefix matching** is used — `"core"` also catches `"cores"`, `"core's"`, `"cored"`.

### Built-in skip words

Defined in `src/vntelex-transform.ts` as `defaultSkipWords`. Edit the array to add or remove entries:

```ts
const defaultSkipWords = [
  "access", "actor", "class", "color", "complex",
  "core",    // + cores, cored, core's
  "doctor", "door", "error", "ex", "favor",
  "fix", "floor", "focus", "for", "fox",
  "if", "index", "major", "mass", "minor",
  "minus", "monitor", "motor", "nor", "of",
  "pass", "plus", "process", "proof", "relax",
  "roof", "self", "sensor", "status", "stress",
  "stuff", "success", "text",   // + texts
  "virus", "yes", "are", "good",
];
```

### Custom skip words file

Create a text file with one word per line:

```
mix
six
box
mycompanyname
```

In Raycast → Extensions → **Transform Vietnamese Telex** → Preferences, set **Custom Skip Words File** to the path. Words are merged with the built-in list.

### How it works

The `telexTransform` function accepts an optional `skipWords` array:

```ts
telexTransform(text);                      // no skip words
telexTransform(text, ["core", "mix"]);     // with custom list
```

Skip words are checked before transformation. Both exact match (`Set.has`) and prefix match (`startsWith`) are applied. If a token starts with any skip word, the entire token is left unchanged.

## Preferences

| Setting | Type | Description |
|---------|------|-------------|
| Custom Skip Words File | File path | Path to a text file with one word per line. Merged with built-in list. |
