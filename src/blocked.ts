import { sendExtensionMessage } from "./types/Messages";

function blockedUrl() {
  const marker = "?blocked=";
  const index = window.location.href.indexOf(marker);
  return index >= 0 ? window.location.href.slice(index + marker.length) : "";
}

function domainOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "this site"; }
}

const url = blockedUrl();
const domain = document.getElementById("blocked-domain");
if (domain) domain.textContent = domainOf(url);
sendExtensionMessage("blocking.hit", { url });

document.getElementById("go-back")?.addEventListener("click", () => {
  if (history.length > 1) history.back();
  else window.close();
});

document.getElementById("allow-once")?.addEventListener("click", async () => {
  const button = document.getElementById("allow-once") as HTMLButtonElement | null;
  if (button) { button.disabled = true; button.textContent = "Opening…"; }
  const result = await sendExtensionMessage("blocking.allowOnce", { url });
  if (!result.ok && button) { button.disabled = false; button.textContent = "Open for 5 minutes"; }
});
