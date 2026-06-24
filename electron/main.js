const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
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
  // Load the build icon and resize for tray
  const iconPath = path.join(__dirname, '..', 'build', 'icon.png')
  let icon
  try {
    const iconPng = fs.readFileSync(iconPath)
    icon = nativeImage.createFromBuffer(iconPng).resize({ width: 32, height: 32 })
  } catch {
    // Fallback: solid color icon if build icon doesn't exist
    const size = 32
    const pixels = Buffer.alloc(size * size * 4)
    for (let i = 0; i < size * size; i++) {
      pixels[i * 4] = 230
      pixels[i * 4 + 1] = 126
      pixels[i * 4 + 2] = 34
      pixels[i * 4 + 3] = 255
    }
    icon = nativeImage.createFromBuffer(createPNG(size, size, pixels))
  }

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

  // Left-click toggles show/hide
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
