export default async function initClock(map) {
  const response = await fetch('./config.json');
  const config = await response.json();
  const timezones = config.clock?.timezones || [
    { tz: 'UTC', label: 'UTC' },
    { tz: 'America/New_York', label: 'NYC' },
    { tz: 'America/Los_Angeles', label: 'LAX' },
    { tz: 'Europe/London', label: 'LON' },
    { tz: 'Asia/Tokyo', label: 'TYO' },
    { tz: 'Australia/Sydney', label: 'SYD' }
  ];

  const showStardate = config.clock?.showStardate !== false;

  const leftClocks = timezones.slice(0, 3);
  const rightClocks = timezones.slice(3);

  function createClockColumn(id, timezones) {
    const col = document.createElement('div');
    col.className = `clock-column ${id}`;
    timezones.forEach(tzObj => {
      const wrapper = document.createElement('div');
      wrapper.className = 'clock-wrapper';

      const timeEl = document.createElement('div');
      timeEl.className = 'clock-time';
      timeEl.dataset.tz = tzObj.tz;

      const ampmEl = document.createElement('div');
      ampmEl.className = 'clock-ampm';

      const labelEl = document.createElement('div');
      labelEl.className = 'clock-label';
      labelEl.innerText = tzObj.label;

      wrapper.appendChild(timeEl);
      wrapper.appendChild(ampmEl);
      wrapper.appendChild(labelEl);
      col.appendChild(wrapper);
    });
    return col;
  }

  const left = createClockColumn('left', leftClocks);
  const right = createClockColumn('right', rightClocks);
  document.body.appendChild(left);
  document.body.appendChild(right);

  if (showStardate) {
    const stardate = document.createElement('div');
    stardate.id = 'stardate';
    document.body.appendChild(stardate);
  }

  function updateClocks() {
    const now = new Date();
    document.querySelectorAll('.clock-time').forEach(el => {
      const tz = el.dataset.tz;
      const date = new Date().toLocaleString('en-US', { timeZone: tz });
      const d = new Date(date);
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const displayHour = (hours % 12 || 12).toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';

      el.innerText = `${displayHour}:${minutes}`;
      el.nextSibling.innerText = ampm;
    });

    if (showStardate) {
      const year = now.getUTCFullYear();
      const start = Date.UTC(year, 0, 1);
      const end = Date.UTC(year + 1, 0, 1);
      const yearProgress = (now.getTime() - start) / (end - start);
      const stardateVal = (1000 * (year - 2323) + yearProgress * 1000).toFixed(1);

      const stardate = document.getElementById('stardate');
      if (stardate) {
        stardate.innerText = `Stardate ${stardateVal}`;
      }
    }
  }

  updateClocks();
  setInterval(updateClocks, 10000);
}
