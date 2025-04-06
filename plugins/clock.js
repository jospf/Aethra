// plugins/clock.js
export default function initClock(map) {
    const clockEl = document.createElement('div');
    clockEl.style.position = 'absolute';
    clockEl.style.top = '10px';
    clockEl.style.left = '10px';
    clockEl.style.padding = '5px 10px';
    clockEl.style.background = 'rgba(0,0,0,0.5)';
    clockEl.style.color = 'white';
    clockEl.style.fontFamily = 'monospace';
    clockEl.style.zIndex = '999';
    document.body.appendChild(clockEl);
  
    function updateClock() {
      const now = new Date();
      const utc = now.toUTCString().split(' ')[4];
      const local = now.toTimeString().split(' ')[0];
      clockEl.innerText = `Local: ${local}\nUTC: ${utc}`;
    }
  
    updateClock();
    setInterval(updateClock, 1000);
  }
  