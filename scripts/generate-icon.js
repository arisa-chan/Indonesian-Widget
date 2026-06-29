const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function createPNG(width, height, pixels) {
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

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rawData = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0
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
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

function setPixel(pixels, size, x, y, r, g, b, a) {
  if (x < 0 || x >= size || y < 0 || y >= size) return
  const idx = (y * size + x) * 4
  pixels[idx] = r
  pixels[idx + 1] = g
  pixels[idx + 2] = b
  pixels[idx + 3] = a
}

function drawCircle(pixels, size, cx, cy, r, pr, pg, pb, pa) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) {
        setPixel(pixels, size, x, y, pr, pg, pb, pa)
      }
    }
  }
}

function drawRing(pixels, size, cx, cy, outerR, innerR, pr, pg, pb, pa) {
  for (let y = cy - outerR; y <= cy + outerR; y++) {
    for (let x = cx - outerR; x <= cx + outerR; x++) {
      const dist = (x - cx) * (x - cx) + (y - cy) * (y - cy)
      if (dist <= outerR * outerR && dist > innerR * innerR) {
        setPixel(pixels, size, x, y, pr, pg, pb, pa)
      }
    }
  }
}

function drawRect(pixels, size, x1, y1, x2, y2, pr, pg, pb, pa) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      setPixel(pixels, size, x, y, pr, pg, pb, pa)
    }
  }
}

// Blend a color onto existing pixel (for anti-aliased-like edges)
function blendPixel(pixels, size, x, y, r, g, b, alpha) {
  if (x < 0 || x >= size || y < 0 || y >= size) return
  const idx = (y * size + x) * 4
  // Simple blend: new = old * (1-a) + color * a
  const a = alpha / 255
  pixels[idx] = Math.round(pixels[idx] * (1 - a) + r * a)
  pixels[idx + 1] = Math.round(pixels[idx + 1] * (1 - a) + g * a)
  pixels[idx + 2] = Math.round(pixels[idx + 2] * (1 - a) + b * a)
  pixels[idx + 3] = Math.min(255, pixels[idx + 3] + Math.round(alpha))
}

// Draw a circle with a soft edge (one pixel of 50% alpha)
function drawCircleSoft(pixels, size, cx, cy, r, pr, pg, pb, pa) {
  for (let y = cy - r - 1; y <= cy + r + 1; y++) {
    for (let x = cx - r - 1; x <= cx + r + 1; x++) {
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy))
      if (dist <= r) {
        setPixel(pixels, size, x, y, pr, pg, pb, pa)
      } else if (dist <= r + 1) {
        const alpha = Math.round((1 - (dist - r)) * pa)
        blendPixel(pixels, size, x, y, pr, pg, pb, alpha)
      }
    }
  }
}

// Generate a 256x256 icon
const size = 256
const pixels = Buffer.alloc(size * size * 4)

// Indonesian flag colors
const RED = [206, 17, 38]      // #CE1126
const WHITE = [255, 255, 255]  // #FFFFFF
const DARK_RED = [160, 10, 28] // Darker shade for border
const GOLD = [218, 165, 32]    // Gold accent

const cx = 128, cy = 128, radius = 120

// 1. Draw a soft-edged circle with Indonesian flag (red top, white bottom)
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy))
    if (dist <= radius) {
      // Flag split: red above center, white below center
      const isRed = y < cy
      setPixel(pixels, size, x, y, isRed ? RED[0] : WHITE[0], isRed ? RED[1] : WHITE[1], isRed ? RED[2] : WHITE[2], 255)
    } else if (dist <= radius + 1) {
      // Soft edge
      const alpha = Math.round((1 - (dist - radius)) * 255)
      const isRed = y < cy
      blendPixel(pixels, size, x, y, isRed ? RED[0] : WHITE[0], isRed ? RED[1] : WHITE[1], isRed ? RED[2] : WHITE[2], alpha)
    }
  }
}

// 2. Draw a dark red border ring
drawRing(pixels, size, cx, cy, radius, radius - 3, DARK_RED[0], DARK_RED[1], DARK_RED[2], 220)

// 3. Draw a gold inner accent ring (thin)
drawRing(pixels, size, cx, cy, radius - 3, radius - 5, GOLD[0], GOLD[1], GOLD[2], 160)

// 4. Draw stylized "ID" monogram in the center
// The "I" is a thick vertical bar
const iLeft = 96, iRight = 118
const iTop = 78, iBottom = 178
// The "D" is a vertical stem + curved bowl
const dStemLeft = 138, dStemRight = 158
const dBowlCx = 158, dBowlCy = 128, dBowlR = 42

// Draw the monogram letters - use white on red half, red on white half
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    // Check if pixel is in either letter
    let inI = false, inD = false

    // I: vertical bar
    if (x >= iLeft && x <= iRight && y >= iTop && y <= iBottom) {
      inI = true
    }

    // D: vertical stem
    if (x >= dStemLeft && x <= dStemRight && y >= iTop && y <= iBottom) {
      inD = true
    }

    // D: curved bowl (semicircle on the right)
    const dx = x - dBowlCx, dy = y - dBowlCy
    if (dx * dx + dy * dy <= dBowlR * dBowlR && x >= dStemRight && y >= iTop && y <= iBottom) {
      inD = true
    }

    if (inI || inD) {
      // White on red background, red on white background
      if (y < cy) {
        setPixel(pixels, size, x, y, WHITE[0], WHITE[1], WHITE[2], 255)
      } else {
        setPixel(pixels, size, x, y, RED[0], RED[1], RED[2], 255)
      }
    }
  }
}

// 5. Add 5 small stars (bintang) in the red section to evoke the Indonesian flag
const starPositions = [
  [70, 55],
  [186, 55],
  [128, 40],
  [50, 90],
  [206, 90],
]
const starSize = 5

for (const [sx, sy] of starPositions) {
  drawCircle(pixels, size, sx, sy, starSize, WHITE[0], WHITE[1], WHITE[2], 100)
}

const outDir = path.join(__dirname, '..', 'build')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'icon.png'), createPNG(size, size, pixels))
console.log('✓ Generated build/icon.png (Indonesian flag design with ID monogram)')

// Generate a 32x32 tray icon — simpler, bolder design for small sizes
const traySize = 32
const trayPixels = Buffer.alloc(traySize * traySize * 4)

// Indonesian flag: red top half (14px), white bottom half (18px)
const splitY = 14
for (let y = 0; y < traySize; y++) {
  for (let x = 0; x < traySize; x++) {
    const isRed = y < splitY
    const idx = (y * traySize + x) * 4
    trayPixels[idx] = isRed ? 206 : 255
    trayPixels[idx + 1] = isRed ? 17 : 255
    trayPixels[idx + 2] = isRed ? 38 : 255
    trayPixels[idx + 3] = 255
  }
}

// Bold "ID" letters at 32x32 — simple bitmap
// I: vertical bar from y=6 to y=26, x=5 to x=8
for (let y = 6; y <= 26; y++) {
  for (let x = 5; x <= 8; x++) {
    const idx = (y * traySize + x) * 4
    trayPixels[idx] = 255; trayPixels[idx + 1] = 215; trayPixels[idx + 2] = 0
  }
}
// I: top bar
for (let y = 4; y <= 8; y++) {
  for (let x = 3; x <= 10; x++) {
    const idx = (y * traySize + x) * 4
    trayPixels[idx] = 255; trayPixels[idx + 1] = 215; trayPixels[idx + 2] = 0
  }
}
// I: bottom bar
for (let y = 24; y <= 28; y++) {
  for (let x = 3; x <= 10; x++) {
    const idx = (y * traySize + x) * 4
    trayPixels[idx] = 255; trayPixels[idx + 1] = 215; trayPixels[idx + 2] = 0
  }
}

// D: stem from y=6 to y=26, x=15 to x=17
for (let y = 6; y <= 26; y++) {
  for (let x = 15; x <= 17; x++) {
    const idx = (y * traySize + x) * 4
    trayPixels[idx] = 255; trayPixels[idx + 1] = 215; trayPixels[idx + 2] = 0
  }
}
// D: curved bowl (filled arc on the right of the stem)
const dCenterX = 17, dCenterY = 16, dRadius = 7
for (let y = 6; y <= 26; y++) {
  for (let x = 17; x <= 26; x++) {
    const dx = x - dCenterX, dy = y - dCenterY
    if (dx * dx + dy * dy <= dRadius * dRadius) {
      const idx = (y * traySize + x) * 4
      trayPixels[idx] = 255; trayPixels[idx + 1] = 215; trayPixels[idx + 2] = 0
    }
  }
}

fs.writeFileSync(path.join(outDir, 'tray-icon.png'), createPNG(traySize, traySize, trayPixels))
console.log('✓ Generated build/tray-icon.png (32x32 tray icon)')
