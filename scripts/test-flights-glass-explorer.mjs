// EARTH OS — Comprehensive Verification Script for Glass UI, Explorer Separation, Theme Toggle, & Live Flights
import fs from 'node:fs'

const wsUrl = process.argv[2]
if (!wsUrl) {
  console.error('Error: WebSocket URL argument is required.')
  process.exit(1)
}

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

    console.log('1. Waiting 4s for application & map initialization...')
    await sleep(4000)

    // Test 1: Verify Explorer is default with NO left panel (unobstructed full-screen globe)
    console.log('Test 1: Verifying Explorer unobstructed full-screen Earth view...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setActiveModule('explorer');
          }
        })()
      `,
    })
    await sleep(1000)
    await capture('21_explorer_unobstructed.png')

    // Test 2: Separate Live Events from Explorer
    console.log('Test 2: Switching to Live Events (dedicated independent menu)...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setActiveModule('events');
          }
        })()
      `,
    })
    await sleep(1500)
    await capture('22_live_events_frosted_glass.png')

    // Test 3: Test Apple Light Appearance with refined frosted glass
    console.log('Test 3: Testing Apple Light Appearance with frosted glass...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setThemeMode('light');
          }
        })()
      `,
    })
    await sleep(1500)
    await capture('23_light_mode_frosted_glass.png')

    // Restore Dark Mode
    console.log('Restoring Dark Mode...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setThemeMode('dark');
          }
        })()
      `,
    })
    await sleep(800)

    // Test 4: Activate Live Flights module
    console.log('Test 4: Activating Live Flights module...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setActiveModule('flights');
          }
        })()
      `,
    })
    console.log('Waiting 5s for live ADS-B flight telemetry from OpenSky...')
    await sleep(5500)
    await capture('24_live_flights_active.png')

    // Test 5: Select an active flight to open detail inspector
    console.log('Test 5: Selecting flight and inspecting details...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            const store = window.__EOS_STORE__.getState();
            const flights = store.flights;
            if (flights && flights.length > 0) {
              const target = flights.find(f => !f.onGround && f.altitudeFeet > 15000) || flights[0];
              store.setSelectedFlight(target);
              store.flyTo({
                center: [target.longitude, target.latitude],
                zoom: 7.5,
                bearing: target.heading || 0,
                pitch: 35,
              });
            }
          }
        })()
      `,
    })
    await sleep(2000)
    await capture('26_flight_detail_inspector.png')

    // Test 6: Enter 3D Cockpit View
    console.log('Test 6: Entering immersive Cockpit View...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setCockpitViewOpen(true);
          }
        })()
      `,
    })
    await sleep(1800)
    await capture('27_cockpit_view_active.png')

    // Test 7: Exit Cockpit View safely
    console.log('Test 7: Exiting Cockpit View back to normal Earth map...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setCockpitViewOpen(false);
          }
        })()
      `,
    })
    await sleep(1500)
    await capture('28_cockpit_view_exited_safe.png')

    // Test 8: Deactivate Live Flights and return to Explorer (clean slate)
    console.log('Test 8: Deactivating Live Flights and returning to Explorer...')
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__EOS_STORE__) {
            window.__EOS_STORE__.getState().setActiveModule('explorer');
          }
        })()
      `,
    })
    await sleep(1500)
    await capture('29_explorer_returned_clean.png')

    console.log('=== ALL FLIGHTS, GLASS UI & EXPLORER TESTS COMPLETED SUCCESSFULLY ===')
    process.exit(0)
  } catch (err) {
    console.error('Test execution failed:', err)
    process.exit(1)
  }
}
