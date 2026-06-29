const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const zlib = require('zlib')

let mainWindow = null
let tray = null
let currentDate = new Date().toISOString().split('T')[0]

// Generate a valid PNG from raw RGBA pixel data using Node.js built-ins only
function createPNG(width, height, pixels) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function crc32(buf) {
    let crc = 0xFFFFFFFF
    const table = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      }
      table[i] = c
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
    }
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  function makeChunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii')
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const crcData = Buffer.concat([typeBytes, data])
    const crcBuf = Buffer.alloc(4)
    crcBuf.writeUInt32BE(crc32(crcData))
    return Buffer.concat([length, typeBytes, data, crcBuf])
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // Build raw data with filter bytes (None filter = 0x00 per row)
  const rawData = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0 // filter byte
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4
      const dst = y * (1 + width * 4) + 1 + x * 4
      rawData[dst] = pixels[src]
      rawData[dst + 1] = pixels[src + 1]
      rawData[dst + 2] = pixels[src + 2]
      rawData[dst + 3] = pixels[src + 3]
    }
  }

  const compressed = zlib.deflateSync(rawData)
  const idat = makeChunk('IDAT', compressed)
  const iend = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, makeChunk('IHDR', ihdr), idat, iend])
}

function createTrayIcon() {
  const size = 32
  const pixels = Buffer.alloc(size * size * 4)

  const RED = [206, 17, 38]
  const WHITE = [255, 255, 255]

  // Draw Indonesian flag: red top half, white bottom half
  for (let y = 0; y < size; y++) {
    const isRed = y < size / 2
    const color = isRed ? RED : WHITE
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      pixels[idx] = color[0]
      pixels[idx + 1] = color[1]
      pixels[idx + 2] = color[2]
      pixels[idx + 3] = 255
    }
  }

  // Draw bold "ID" letters using a simple bitmap font (5x7 per letter, scaled to fit)
  const charW = 3
  const charH = 5
  const startX = 7
  const startY = 8
  const gap = 3

  // "I" — vertical bar
  function drawI(ox, oy, c) {
    for (let y = 0; y < charH; y++) {
      for (let x = 0; x < charW; x++) {
        if (x >= 1 && x <= 2) {
          const px = ox + x
          const py = oy + y
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const idx = (py * size + px) * 4
            pixels[idx] = c[0]; pixels[idx + 1] = c[1]; pixels[idx + 2] = c[2]
          }
        }
      }
    }
    // top bar
    for (let x = 0; x < charW + 1; x++) {
      for (let row = 0; row < 2; row++) {
        const px = ox - 1 + x; const py = oy + row
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const idx = (py * size + px) * 4
          pixels[idx] = c[0]; pixels[idx + 1] = c[1]; pixels[idx + 2] = c[2]
        }
      }
    }
    // bottom bar
    for (let x = 0; x < charW + 1; x++) {
      for (let row = charH - 2; row < charH; row++) {
        const px = ox - 1 + x; const py = oy + row
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const idx = (py * size + px) * 4
          pixels[idx] = c[0]; pixels[idx + 1] = c[1]; pixels[idx + 2] = c[2]
        }
      }
    }
  }

  // "D" — vertical stem + semicircle
  function drawD(ox, oy, c) {
    // vertical stem
    for (let y = 0; y < charH; y++) {
      for (let x = 0; x < charW; x++) {
        if (x >= 0 && x <= 1) {
          const px = ox + x; const py = oy + y
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const idx = (py * size + px) * 4
            pixels[idx] = c[0]; pixels[idx + 1] = c[1]; pixels[idx + 2] = c[2]
          }
        }
      }
    }
    // curved right side (simplified as filled block with rounded feel)
    for (let y = 1; y < charH - 1; y++) {
      for (let x = 1; x < charW + 2; x++) {
        if (x >= 2) {
          const dist = Math.abs(y - Math.floor(charH / 2))
          if (dist < Math.floor(charH / 2) - 1 || (x <= 3 && dist <= Math.floor(charH / 2))) {
            const px = ox + x; const py = oy + y
            if (px >= 0 && px < size && py >= 0 && py < size) {
              const idx = (py * size + px) * 4
              pixels[idx] = c[0]; pixels[idx + 1] = c[1]; pixels[idx + 2] = c[2]
            }
          }
        }
      }
    }
  }

  // Draw I and D — use contrasting color per half
  const iX = startX
  const dX = startX + charW + gap
  // I on the red half gets white, on white half gets red
  drawI(iX, startY, RED) // I top part (red on red... invisible)
  drawI(iX, startY + Math.ceil(charH / 3), WHITE) // I middle-bottom

  // Simpler approach: draw letters that span both halves — use a contrasting 3rd color
  const GOLD = [255, 220, 50]

  // Redraw I and D in gold for full visibility across the flag split
  // Clear the old attempts and use gold
  drawI(iX, startY, GOLD)
  drawD(dX, startY, GOLD)

  const icon = nativeImage.createFromBuffer(createPNG(size, size, pixels))
  tray = new Tray(icon)
  tray.setToolTip('Indonesian Widget')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Widget',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 380,
    resizable: false,
    maximizable: false,
    minimizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    center: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
  createTrayIcon()

  // Check every 30 seconds for day change (midnight rollover while running)
  setInterval(() => {
    const today = new Date().toISOString().split('T')[0]
    if (today !== currentDate) {
      currentDate = today
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('new-day')
      }
    }
  }, 30000)
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  } else if (mainWindow) {
    mainWindow.show()
  }
})

app.on('window-all-closed', () => {
  // Don't quit — hide to tray instead
})

// IPC handlers
ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.hide()
})

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.hide()
})

ipcMain.handle('set-login-item', (_event, enabled) => {
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: enabled })
  } else {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: process.execPath,
      args: [path.resolve(__dirname, '..')],
    })
  }
})

ipcMain.handle('get-login-item', () => {
  return app.getLoginItemSettings().openAtLogin
})
