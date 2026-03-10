// Rulează cu: node frontend/scripts/generate-icons.js
// Fără dependențe externe: generează icon-uri SVG placeholder pentru PWA

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, '..', 'public', 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

sizes.forEach((size) => {
  const fontSize = Math.round(size * 0.35)
  const cornerRadius = Math.round(size * 0.2)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#2B579A"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">HD</text>
</svg>`

  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg)
  console.log(`Generat icon-${size}.svg`)
})

console.log('\nNotă: acestea sunt icon-uri SVG placeholder.')
console.log('Pentru producție, înlocuiește cu icon-uri finale exportate din design.')
