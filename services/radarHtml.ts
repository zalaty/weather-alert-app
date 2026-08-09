const MAX_FRAMES = 8;
const RADAR_TILE_SIZE = 256;
const RADAR_COLOR_SCHEME = 2;
const FRAME_INTERVAL_MS = 500;
const NATIVE_MAX_ZOOM = 7;

export interface RadarHtmlStrings {
  loading: string;
  loadError: string;
}

export function buildRadarHtml(lat: number, lon: number, strings: RadarHtmlStrings): string {
  const lat_ = JSON.stringify(lat);
  const lon_ = JSON.stringify(lon);
  const loadingText = JSON.stringify(strings.loading);
  const loadErrorText = JSON.stringify(strings.loadError);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #ddd; }
    #overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.85); font: 14px -apple-system, sans-serif; color: #444;
      z-index: 1000; text-align: center; padding: 24px;
    }
    #controls {
      position: absolute; bottom: 24px; left: 0; right: 0;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      z-index: 900; pointer-events: none;
    }
    #playBtn {
      pointer-events: auto;
      width: 44px; height: 44px; border-radius: 22px; border: none;
      background: #4A90E2; color: #fff; font-size: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    #timeLabel {
      pointer-events: auto;
      background: rgba(255,255,255,0.9); border-radius: 14px;
      padding: 6px 12px; font: 600 12px -apple-system, sans-serif; color: #222;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="overlay"></div>
  <div id="controls" style="display:none">
    <button id="playBtn">▶</button>
    <div id="timeLabel"></div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      var LAT = ${lat_};
      var LON = ${lon_};
      var overlay = document.getElementById('overlay');
      overlay.textContent = ${loadingText};

      var map = L.map('map', { zoomControl: true }).setView([LAT, LON], ${NATIVE_MAX_ZOOM});

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.circleMarker([LAT, LON], {
        radius: 7, color: '#4A90E2', weight: 2, fillColor: '#4A90E2', fillOpacity: 0.6,
      }).addTo(map);

      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var past = (data.radar && data.radar.past) || [];
          var frames = past.slice(Math.max(0, past.length - ${MAX_FRAMES}));
          if (frames.length === 0) throw new Error('no frames');

          var layers = frames.map(function (frame) {
            var url = data.host + frame.path + '/${RADAR_TILE_SIZE}/{z}/{x}/{y}/${RADAR_COLOR_SCHEME}/1_1.png';
            return L.tileLayer(url, {
              opacity: 0,
              maxNativeZoom: ${NATIVE_MAX_ZOOM},
              attribution: 'Radar &copy; <a href="https://www.rainviewer.com">RainViewer</a>',
            }).addTo(map);
          });

          var current = layers.length - 1;
          var playing = false;
          var timer = null;

          function showFrame(index) {
            layers[current].setOpacity(0);
            current = index;
            layers[current].setOpacity(0.7);
            var d = new Date(frames[current].time * 1000);
            document.getElementById('timeLabel').textContent =
              d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }

          function tick() {
            showFrame((current + 1) % layers.length);
          }

          document.getElementById('playBtn').addEventListener('click', function () {
            playing = !playing;
            this.textContent = playing ? '⏸' : '▶';
            if (playing) {
              timer = setInterval(tick, ${FRAME_INTERVAL_MS});
            } else if (timer) {
              clearInterval(timer);
              timer = null;
            }
          });

          showFrame(current);
          overlay.style.display = 'none';
          document.getElementById('controls').style.display = 'flex';
        })
        .catch(function () {
          overlay.textContent = ${loadErrorText};
        });
    })();
  </script>
</body>
</html>`;
}
