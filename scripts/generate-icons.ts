import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve } from 'path'

async function generateIcons() {
  const svgPath = resolve(process.cwd(), 'public/icon.svg')
  const svgBuffer = readFileSync(svgPath)

  // 生成 192x192 图标
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(resolve(process.cwd(), 'public/icon-192.png'))

  console.log('✅ Generated icon-192.png')

  // 生成 512x512 图标
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(resolve(process.cwd(), 'public/icon-512.png'))

  console.log('✅ Generated icon-512.png')

  // 生成 favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(resolve(process.cwd(), 'public/favicon.ico'))

  console.log('✅ Generated favicon.ico')

  console.log('\n🎉 All icons generated successfully!')
}

generateIcons().catch(console.error)
