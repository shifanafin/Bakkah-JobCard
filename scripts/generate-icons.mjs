import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const iconsDir = join(root, 'public', 'icons')

const logoSvg     = readFileSync(join(root, 'public', 'logo.svg'))
const iconSvg     = readFileSync(join(iconsDir, 'icon.svg'))
const maskableSvg = readFileSync(join(iconsDir, 'icon-maskable.svg'))

// Brand gold (#C9A227) — home-screen icons need an opaque background because
// iOS/Android render transparent icon regions as black.
const BRAND_GOLD = { r: 0xC9, g: 0xA2, b: 0x27, alpha: 1 }

const icons = [
  { svg: iconSvg,     size: 192, out: 'icon-192.png' },
  { svg: iconSvg,     size: 512, out: 'icon-512.png' },
  { svg: logoSvg,     size: 180, out: 'apple-touch-icon.png' },
  { svg: maskableSvg, size: 192, out: 'icon-maskable-192.png' },
  { svg: maskableSvg, size: 512, out: 'icon-maskable-512.png' },
]

for (const { svg, size, out } of icons) {
  await sharp(svg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: BRAND_GOLD })
    .flatten({ background: BRAND_GOLD })
    .png()
    .toFile(join(iconsDir, out))
  console.log(`✓  ${out}  (${size}x${size})`)
}

console.log('\nAll icons generated.')
