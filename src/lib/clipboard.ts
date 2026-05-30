export type CopyResult = "copied" | "manual";

export async function copyText(value: string): Promise<CopyResult> {
  try {
    if (!navigator.clipboard?.writeText) return "manual";
    await navigator.clipboard.writeText(value);
    return "copied";
  } catch {
    copyTextFallback(value);
    return "manual";
  }
}

function copyTextFallback(value: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
