import { createRequire } from 'module'
import { mkdirSync } from 'fs'
const require = createRequire(import.meta.url)
const Jimp = require('jimp')

mkdirSync('src/static/tabbar', { recursive: true })

const GRAY = 0x888888ff
const PINK = 0xff6b9dff
const TRANS = 0x00000000

function newImg() {
  return new Jimp(40, 40, TRANS)
}

function setPixel(img, x, y, color) {
  if (x >= 0 && x < 40 && y >= 0 && y < 40)
    img.setPixelColor(color, x, y)
}

function drawRect(img, x, y, w, h, color) {
  for (let row = y; row < y + h; row++)
    for (let col = x; col < x + w; col++)
      setPixel(img, col, row, color)
}

function drawCircleOutline(img, cx, cy, r, thickness, color) {
  for (let row = cy - r; row <= cy + r; row++)
    for (let col = cx - r; col <= cx + r; col++) {
      const dx = col - cx, dy = row - cy, d2 = dx*dx + dy*dy
      if (d2 <= r*r && d2 >= (r - thickness) * (r - thickness))
        setPixel(img, col, row, color)
    }
}

function fillCircle(img, cx, cy, r, color) {
  for (let row = cy - r; row <= cy + r; row++)
    for (let col = cx - r; col <= cx + r; col++) {
      const dx = col - cx, dy = row - cy
      if (dx*dx + dy*dy <= r*r)
        setPixel(img, col, row, color)
    }
}

// 仪表盘：圆形表盘 + 指针
function makeHome(color) {
  const img = newImg()
  drawCircleOutline(img, 20, 20, 14, 3, color)
  // 指针（右上方 45°）
  for (let i = 0; i <= 8; i++) {
    const x = Math.round(20 + i * 0.7)
    const y = Math.round(20 - i * 0.7)
    setPixel(img, x, y, color)
    setPixel(img, x+1, y, color)
  }
  fillCircle(img, 20, 20, 2, color)
  // 刻度：上、左下、右下
  drawRect(img, 19, 7, 2, 3, color)
  drawRect(img, 8, 23, 3, 2, color)
  drawRect(img, 29, 23, 3, 2, color)
  return img
}

// 周计划：日历
function makePlan(color) {
  const img = newImg()
  // 外框
  for (let col = 6; col < 34; col++) {
    setPixel(img, col, 9, color)
    setPixel(img, col, 33, color)
  }
  for (let row = 9; row <= 33; row++) {
    setPixel(img, 6, row, color)
    setPixel(img, 33, row, color)
  }
  // 顶部实心色带
  drawRect(img, 6, 9, 28, 7, color)
  // 挂钩
  drawRect(img, 13, 6, 3, 5, color)
  drawRect(img, 24, 6, 3, 5, color)
  // 3行 x 4列 小方块
  for (const dy of [20, 25, 30])
    for (const dx of [10, 16, 22, 28])
      if (dx < 33 && dy < 33)
        drawRect(img, dx, dy, 4, 3, color)
  return img
}

// 每日进度：条形图
function makeProgress(color) {
  const img = newImg()
  // 底线
  drawRect(img, 4, 34, 32, 2, color)
  const bars = [
    { x: 5,  h: 10 },
    { x: 13, h: 18 },
    { x: 21, h: 14 },
    { x: 29, h: 24 },
  ]
  for (const { x, h } of bars)
    drawRect(img, x, 34 - h, 6, h, color)
  return img
}

// 评分：五角星（扫描线填充）
function makeApprove(color) {
  const img = newImg()
  const cx = 20, cy = 21, ro = 14, ri = 6
  const pts = []
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI / 5) - Math.PI / 2
    const r = i % 2 === 0 ? ro : ri
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  for (let row = 5; row < 36; row++) {
    const xs = []
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]
      if ((y1 <= row && y2 > row) || (y2 <= row && y1 > row))
        xs.push(x1 + (row - y1) * (x2 - x1) / (y2 - y1))
    }
    xs.sort((a, b) => a - b)
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let col = Math.ceil(xs[k]); col <= Math.floor(xs[k+1]); col++)
        setPixel(img, col, row, color)
  }
  return img
}

const makers = [
  { name: 'home',     fn: makeHome },
  { name: 'plan',     fn: makePlan },
  { name: 'progress', fn: makeProgress },
  { name: 'approve',  fn: makeApprove },
]

for (const { name, fn } of makers) {
  await fn(GRAY).writeAsync(`src/static/tabbar/tab-${name}.png`)
  await fn(PINK).writeAsync(`src/static/tabbar/tab-${name}-active.png`)
  console.log(`✓ tab-${name}`)
}

console.log('All icons created!')
