import { DateTime } from "https://cdn.skypack.dev/luxon";

export default function initClockPanels(map) {
  console.log("🕒 Clock panel plugin loaded");

  function update() {
    const now = DateTime.now();
    document.getElementById("clock-local").textContent = now.toFormat("HH:mm");
    document.getElementById("clock-pacific").textContent = now.setZone("America/Los_Angeles").toFormat("HH:mm");
    document.getElementById("clock-zulu").textContent = now.setZone("UTC").toFormat("HH:mm");
    document.getElementById("clock-julian").textContent = now.ordinal.toString();  // 1-365/366
  }

  update();
  setInterval(update, 60 * 1000);
}