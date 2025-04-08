export default function initStardateClock(map) {
    const el = document.getElementById('stardate');
  
    function update() {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const days = (now - start) / (1000 * 60 * 60 * 24);
      const stardate = `${now.getFullYear()}.${(days / 365 * 1000).toFixed(1)}`;
      el.textContent = `Stardate ${stardate}`;
    }
  
    update();
    setInterval(update, 10000);
  }
  