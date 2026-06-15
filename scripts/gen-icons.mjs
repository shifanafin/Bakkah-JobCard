import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Use the real logo PNG as source for all raster icons
const src = readFileSync(join(root, 'public/logo.png'))

const icons = [
  { dest: 'public/icons/icon-192.png',          size: 192 },
  { dest: 'public/icons/icon-512.png',          size: 512 },
  { dest: 'public/icons/icon-maskable-192.png', size: 192 },
  { dest: 'public/icons/icon-maskable-512.png', size: 512 },
  { dest: 'public/icons/apple-touch-icon.png',  size: 180 },
]

for (const { dest, size } of icons) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 76, g: 88, b: 38, alpha: 1 } })
    .png()
    .toFile(join(root, dest))
  console.log(`✓ ${dest} (${size}x${size})`)
}
