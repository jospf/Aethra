# Aethra Documentation

Aethra is a plugin‑based world map dashboard that runs entirely in the browser.
This document provides a quick tour of the project structure, how to run the
application and how to extend it with new plugins.

## Repository Layout

- `index.html` – entry point that loads the map and plugins.
- `main.js` – bootstraps MapLibre and dynamically loads JavaScript plugins.
- `config.json` – user configuration for enabled plugins and options.
- `plugins/` – collection of optional dashboard features implemented as ES
  modules. Examples include clocks, satellite trackers and weather overlays.
- `server.py` – optional Flask backend supplying data for astronomy‑related
  plugins (Sun/Moon, ISS, Starlink, daylight terminator).

## Running the Dashboard

1. **Install dependencies** (only required for the optional backend):

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python server.py
   ```

   The Flask server provides API endpoints used by several plugins.

2. **Start a simple web server** from the repository root so the browser can
   load the HTML and JavaScript files:

   ```bash
   python3 -m http.server 8000
   ```

3. Open `http://localhost:8000` in your browser. Enabled plugins will load
   according to `config.json`.

## Customising

Edit `config.json` to enable or disable plugins and pass settings to them. For
example the `clock` section defines which time zones to display and whether to
show the Stardate counter. The `weather` section controls the overlay layer and
opacity.

```
{
  "plugins": ["clock", "sunmoon", "iss"],
  "clock": { "timezones": [{"tz": "UTC", "label": "UTC"}] },
  "weather": { "enabled": false }
}
```

Restart the HTTP server after changing the configuration.

## Writing a Plugin

Each plugin exports a default function that receives the MapLibre instance. A
minimal plugin might look like:

```javascript
export default function initExample(map) {
  console.log('example plugin loaded');
  // interact with map here
}
```

Save the file in `plugins/example.js` and add `"example"` to the `plugins`
array in `config.json`.

## Further Reading

The main `README.md` contains a project overview and screenshots. Refer to the
source files in `plugins/` for real examples of interacting with MapLibre and
fetching data from the Flask backend.

