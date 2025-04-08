import { DateTime } from "https://cdn.skypack.dev/luxon";

export default function initClock(map) {
  console.log("🕒 Clock plugin loaded");

  const zones = [
    'Pacific/Honolulu',
    'America/Los_Angeles',
    'America/Chicago',
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo'
  ];

  // Approximate longitudes for each timezone (used to position on map)
  const zoneLongitudes = {
  //  'Pacific/Honolulu': -157,
    'America/Los_Angeles': -122,
  //  'America/Chicago': -87,
    'America/New_York': -74,
    'Europe/London': 0,
    'Asia/Tokyo': 139
  };

  const container = document.createElement("div");
  container.id = "clock-top-container";
  document.body.appendChild(container);

  zones.forEach(zone => {
    const clock = document.createElement("div");
    clock.className = "clock-timezone";
    clock.dataset.zone = zone;

    // Map longitude to % left position
    const lon = zoneLongitudes[zone];
    const leftPercent = ((lon + 180) / 360) * 100;
    clock.style.left = `${leftPercent}%`;

    clock.innerHTML = `
      <div class="clock-time">--:--</div>
      <div class="clock-zone">${zone}</div>
    `;

    container.appendChild(clock);
  });

  function updateClocks() {
    document.querySelectorAll(".clock-timezone").forEach(div => {
      const zone = div.dataset.zone;
      const now = DateTime.now().setZone(zone);

      div.querySelector(".clock-time").textContent = now.toFormat("HH:mm");
    });
  }

  updateClocks();
  setInterval(updateClocks, 60 * 1000);
}
