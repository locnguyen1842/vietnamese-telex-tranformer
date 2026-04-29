import { getSelectedText, Clipboard, showHUD, showToast, Toast } from "@raycast/api";
import { telexTransform } from "./telex";

const defaultSkipWords = [
  "access",
  "actor",
  "class",
  "color",
  "complex",
  "doctor",
  "door",
  "error",
  "ex",
  "favor",
  "fix",
  "floor",
  "focus",
  "for",
  "fox",
  "if",
  "index",
  "major",
  "mass",
  "minor",
  "minus",
  "monitor",
  "motor",
  "nor",
  "of",
  "pass",
  "plus",
  "process",
  "proof",
  "relax",
  "roof",
  "self",
  "sensor",
  "status",
  "stress",
  "stuff",
  "success",
  "virus",
  "yes",
  "are",
  "good",
  "text",
  "core",
];
export default async function Command() {
  try {
    const selectedText = await getSelectedText();

    if (!selectedText.trim()) {
      return;
    }

    const result = telexTransform(selectedText, defaultSkipWords);

    await Clipboard.paste(result);
    await Clipboard.copy(result);

    await showHUD("Copied to clipboard");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Cannot transform text",
      message: String(error),
    });
  }
}
