export default async function initClock(map) {
    const response = await fetch('./config.json');
    const config = await response.json();
    const timezones = config.clock?.timezones || [
      'UTC', 'America/New_York', 'America/Los_Angeles', 
      'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'
    ];
  
    const leftClocks = timezones.slice(0, 3);
    const rightClocks = timezones.slice(3);
  
    function createClockColumn(id, timezones) {
      const col = document.createElement('div');
      col.className = `clock-column ${id}`;
      timezones.forEach(zone => {
        const wrapper = document.createElement('div');
        wrapper.className = 'clock-wrapper';
      
        const timeEl = document.createElement('div');
        timeEl.className = 'clock-time';
        timeEl.dataset.tz = zone.tz;
      
        const ampmEl = document.createElement('div');
        ampmEl.className = 'clock-ampm';
      
        const labelEl = document.createElement('div');
        labelEl.className = 'clock-label';
        labelEl.innerText = zone.label || getTzAbbreviation(zone.tz);
      
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
  
    const stardate = document.createElement('div');
    stardate.id = 'stardate';
    document.body.appendChild(stardate);

    const julian = document.createElement('div');
    julian.id = 'julian-date';
    document.body.appendChild(julian);
  
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
  
      // Update stardate
      const dayOfYear = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
      const fractionalDay = now.getUTCHours() / 24 + now.getUTCMinutes() / 1440;
      const starDate = `${now.getFullYear()}.${(dayOfYear + fractionalDay).toFixed(1)}`;
      stardate.innerText = `Stardate ${starDate}`;
      const julianDay = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
      julian.innerText = `Julian ${julianDay}`;

    }
  
    function getTzAbbreviation(tz) {
      const abbr = new Date().toLocaleTimeString('en-us', {
        timeZone: tz,
        timeZoneName: 'short'
      }).split(' ').pop();
      return abbr.length > 5 ? tz.split('/')[1].slice(0, 3).toUpperCase() : abbr;
    }
  
    updateClocks();
    setInterval(updateClocks, 10000);
  }
  