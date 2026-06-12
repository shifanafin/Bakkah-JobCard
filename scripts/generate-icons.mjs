import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const regularSvg = readFileSync(join(root, 'public/icons/icon.svg'))
const maskableSvg = readFileSync(join(root, 'public/icons/icon-maskable.svg'))

const sizes = [192, 512]

for (const size of sizes) {
  await sharp(regularSvg).resize(size, size).png().toFile(join(root, `public/icons/icon-${size}.png`))
  console.log(`Generated icon-${size}.png`)

  await sharp(maskableSvg).resize(size, size).png().toFile(join(root, `public/icons/icon-maskable-${size}.png`))
  console.log(`Generated icon-maskable-${size}.png`)
}

// Also generate a 180x180 for Apple touch icon
await sharp(regularSvg).resize(180, 180).png().toFile(join(root, 'public/icons/apple-touch-icon.png'))
console.log('Generated apple-touch-icon.png')

console.log('All icons generated successfully.')
