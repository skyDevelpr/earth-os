// EARTH OS — Satellite, Hybrid, Zoom, Location & Theme Automated Visual Verification Script
import fs from 'node:fs'
const wsUrl = process.argv[2]
const artifactDir = '/Users/akashprajapati/.gemini/antigravity/brain/090cde0a-f881-43fc-bdfb-954853e45393'

const ws = new WebSocket(wsUrl)
let msgId = 1
const callbacks = new Map()

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++
    callbacks.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.id && callbacks.has(data.id)) {
    const { resolve } = callbacks.get(data.id)
    callbacks.delete(data.id)
    resolve(data.result)
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function capture(filename) {
  const ss = await send('Page.captureScreenshot', { format: 'png' })
  if (ss?.data) {
    fs.writeFileSync(`${artifactDir}/${filename}`, Buffer.from(ss.data, 'base64'))
    console.log(`✓ Saved ${filename}`)
  }
}

ws.onopen = async () => {
  try {
    await send('Runtime.enable')
    await send('Page.enable')

    console.log('1. Waiting 4s for map and telemetry initialization...')
    await sleep(4000)

    // Capture Globe Mode
    console.log('Capturing 13_mode_globe.png...')
    await capture('13_mode_globe.png')

    // 2. Open Layer Control Drawer to verify Google Maps-style layer selector
    console.log('2. Opening Map Layer Control Centre...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setLayerControlOpen(true);
          }
        })()
      `,
    })
    await sleep(800)

    // 3. Switch to Satellite Mode
    console.log('3. Switching to Satellite Mode...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setMapMode('satellite');
          }
        })()
      `,
    })
    await sleep(3500)
    console.log('Capturing 14_mode_satellite.png...')
    await capture('14_mode_satellite.png')

    // 4. Switch to Hybrid Mode
    console.log('4. Switching to Hybrid Mode (Satellite + Roads & Boundaries)...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setMapMode('hybrid');
          }
        })()
      `,
    })
    await sleep(3500)
    console.log('Capturing 15_mode_hybrid.png...')
    await capture('15_mode_hybrid.png')

    // 5. Switch to Terrain Mode
    console.log('5. Switching to Terrain Mode...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setMapMode('terrain');
          }
        })()
      `,
    })
    await sleep(3500)
    console.log('Capturing 16_mode_terrain.png...')
    await capture('16_mode_terrain.png')

    // Close Layer Drawer
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setLayerControlOpen(false);
          }
        })()
      `,
    })
    await sleep(500)

    // 6. Deep Zoom Test in Hybrid Mode (San Francisco Bay & Silicon Valley)
    console.log('6. Executing deep zoom test in Hybrid Mode over San Francisco (zoom: 12)...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const map = window.__EOS_MAP__;
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setMapMode('hybrid');
          }
          if (map) {
            map.flyTo({
              center: [-122.4194, 37.7749],
              zoom: 12.0,
              pitch: 35,
              bearing: -15,
              duration: 1500
            });
          }
        })()
      `,
    })
    await sleep(4500)
    console.log('Capturing 17_hybrid_zoom_city_level.png...')
    await capture('17_hybrid_zoom_city_level.png')

    // 7. Test User Location Blue Dot & Accuracy Circle
    console.log('7. Testing User Geolocation indicator...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setUserLocation({
              coords: [-122.4194, 37.7749],
              accuracy: 25
            });
          }
        })()
      `,
    })
    await sleep(1500)
    console.log('Capturing 18_user_location_active.png...')
    await capture('18_user_location_active.png')

    // 8. Light Mode Test
    console.log('8. Testing Apple Light Mode appearance...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setThemeMode('light');
            window.__EOS_STORE__.getState().setMapMode('globe');
          }
          const map = window.__EOS_MAP__;
          if (map) {
            map.flyTo({
              center: [15, 48],
              zoom: 4.2,
              pitch: 0,
              bearing: 0,
              duration: 1200
            });
          }
        })()
      `,
    })
    await sleep(3500)
    console.log('Capturing 19_light_mode_overview.png...')
    await capture('19_light_mode_overview.png')

    // 9. Restore Dark Mode
    console.log('9. Restoring Dark Mode...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setThemeMode('dark');
            window.__EOS_STORE__.getState().setUserLocation(null);
          }
          const map = window.__EOS_MAP__;
          if (map) {
            map.flyTo({
              center: [0, 20],
              zoom: 1.5,
              pitch: 0,
              bearing: 0,
              duration: 1200
            });
          }
        })()
      `,
    })
    await sleep(2500)
    console.log('Capturing 20_dark_mode_restored.png...')
    await capture('20_dark_mode_restored.png')

    console.log('=== ALL VISUAL SATELLITE, ZOOM & THEME TESTS COMPLETED SUCCESSFULLY ===')
  } catch (err) {
    console.error('Error during testing:', err)
  } finally {
    ws.close()
    process.exit(0)
  }
}
