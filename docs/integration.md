# Integration Guide

`src/telex.js` is a standalone, zero-dependency JavaScript module. It has no DOM requirements, no Node APIs. Drop it into any runtime — browser, Electron, Tauri, CLI, system tray daemon, or keyboard hook.

## API

```ts
function telexTransform(input: string, skipWords?: string[]): string
```

- **`input`** — Raw text containing Telex-encoded Vietnamese mixed with English
- **`skipWords`** — Optional array of English words to leave untransformed (prefix matching)
- **Returns** — Transformed text with proper Vietnamese Unicode

## Basic Usage

```js
import { telexTransform } from "./telex.js";

telexTransform("cais gif vayaj");  // → "cái gì vậy"
telexTransform("tieengs vieetj");  // → "tiếng việt"
```

English words are auto-detected and left alone:

```js
telexTransform("hello world");     // → "hello world"
telexTransform("catcher teacher"); // → "catcher teacher"
```

## With Skip Words

```js
telexTransform("core mix test cais", ["core", "mix", "test"]);
// → "core mix test cái"
```

Skip words use prefix matching: `"core"` covers `"cores"`, `"cored"`, `"core's"`.

## Integration Examples

### Electron (macOS menu bar app)

```js
const { clipboard, globalShortcut, Tray, Menu, app } = require("electron");
const { telexTransform } = require("./telex.js");

app.whenReady().then(() => {
  const tray = new Tray("icon.png");
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: "Transform Clipboard",
      click: () => {
        const text = clipboard.readText();
        clipboard.writeText(telexTransform(text));
      },
    },
  ]));

  globalShortcut.register("Cmd+Option+V", () => {
    const text = clipboard.readText();
    clipboard.writeText(telexTransform(text));
  });
});
```

### Browser Extension

```js
// content script
import { telexTransform } from "./telex.js";

// Transform selected text on Cmd+Option+V
document.addEventListener("keydown", async (e) => {
  if (e.metaKey && e.altKey && e.key === "v") {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = range.toString();
    const transformed = telexTransform(text);

    range.deleteContents();
    range.insertNode(document.createTextNode(transformed));
    selection.removeAllRanges();
    selection.addRange(range);
  }
});

// Transform text via context menu
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "transform-selection") {
    const selection = window.getSelection().toString();
    const transformed = telexTransform(selection);
    navigator.clipboard.writeText(transformed);
  }
});
```

### Tauri (desktop app)

```js
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { telexTransform } from "./telex.js";

async function transformClipboard() {
  const text = await readText();
  const transformed = telexTransform(text);
  await writeText(transformed);
}

// Register global shortcut
import { register } from "@tauri-apps/plugin-global-shortcut";
await register("CmdOrCtrl+Alt+V", transformClipboard);
```

### Node.js CLI

```bash
node -e "import {telexTransform} from './src/telex.js'; \
  console.log(telexTransform(process.argv.slice(2).join(' ')))" \
  "tooi ddang hocj code"
# → tôi đang học code
```

Or as a script (`transform.mjs`):

```js
#!/usr/bin/env node
import { telexTransform } from "./src/telex.js";

const input = process.argv.slice(2).join(" ");
if (!input) {
  console.log("Usage: node transform.mjs <telex text>");
  process.exit(1);
}
console.log(telexTransform(input));
```

### AppleScript (macOS automation)

```applescript
-- Bind to a keyboard shortcut via FastScripts or Automator
tell application "System Events"
  set theText to the clipboard
  set theTransformed to do shell script ¬
    "cd /path/to/project && node -e \"import('file:///path/to/project/src/telex.js').then(m => console.log(m.telexTransform('" & theText & "')))\""
  set the clipboard to theTransformed
end tell
```

Better: bundle the transform as a tiny native binary with [Bun](https://bun.sh) or [pkg](https://github.com/vercel/pkg).

## Environment Requirements

- **Runtime**: Any ES module environment (Node 18+, Bun, Deno, modern browsers)
- **Dependencies**: None
- **File size**: ~8 KB minified
- **Performance**: < 1ms for typical input (sub-millisecond)
- **Unicode**: Full support for Vietnamese precomposed characters (NFD/NFC safe)

## Known Limitations

English words that form valid Vietnamese syllables cannot be auto-detected (they look identical):

| Input | Output | Reason | Fix |
|-------|--------|--------|-----|
| `mix` | `mĩ` | Valid VN: `mi` + sắc | Add to skipWords |
| `core` | `cỏe` | Valid VN: `c` + `oe` + hỏi | Add to skipWords |
| `test` | `tét` | Valid VN: `t` + `e` + `t` + sắc | Add to skipWords |
| `box` | `bõ` | Valid VN: `bo` + ngã | Add to skipWords |
| `six` | `sĩ` | Valid VN: `si` + ngã | Add to skipWords |

The engine is designed for **post-processing** (transform after typing), not real-time IME interception. For real-time Vietnamese input, consider [Gõ Nhanh](https://github.com/khaphanspace/gonhanh.org) (macOS/Linux/Windows).
