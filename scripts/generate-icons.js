const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outputDir = path.join(__dirname, '../public/icons')

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

// SVG source: navy gradient with school emoji
const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E3A5F"/>
      <stop offset="100%" style="stop-color:#2563EB"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="512" height="512" rx="115" ry="115"/>
    </clipPath>
  </defs>
  <rect width="512" height="512" fill="url(#g)" rx="115" ry="115"/>
  <!-- School building -->
  <rect x="106" y="220" width="300" height="200" fill="white" opacity="0.9"/>
  <polygon points="256,100 80,230 432,230" fill="white" opacity="0.95"/>
  <!-- Door -->
  <rect x="216" y="320" width="80" height="100" fill="#1E3A5F"/>
  <!-- Windows -->
  <rect x="130" y="260" width="60" height="50" rx="4" fill="#2563EB" opacity="0.8"/>
  <rect x="322" y="260" width="60" height="50" rx="4" fill="#2563EB" opacity="0.8"/>
  <!-- Flag pole -->
  <rect x="252" y="80" width="8" height="70" fill="#F59E0B"/>
  <polygon points="260,80 310,95 260,110" fill="#F59E0B"/>
</svg>`

async function generate() {
  const buf = Buffer.from(svgSource)
  for (const size of sizes) {
    const outFile = path.join(outputDir, `icon-${size}x${size}.png`)
    await sharp(buf)
      .resize(size, size)
      .png()
      .toFile(outFile)
    console.log(`Generated ${outFile}`)
  }

  // Also generate apple-touch-icon (180x180)
  const appleFile = path.join(__dirname, '../public/apple-touch-icon.png')
  await sharp(buf).resize(180, 180).png().toFile(appleFile)
  console.log(`Generated ${appleFile}`)

  console.log('All icons generated successfully!')
}

generate().catch(console.error)
