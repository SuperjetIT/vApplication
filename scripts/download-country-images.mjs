/**
 * Re-download country landmark images into frontend/public/images/countries/
 * Sources: Pexels (free license — https://www.pexels.com/license/)
 *
 * Usage: node scripts/download-country-images.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../frontend/public/images/countries')

const images = {
  india: 'https://images.pexels.com/photos/1006965/pexels-photo-1006965.jpeg?auto=compress&cs=tinysrgb&w=1200',
  uae: 'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=1200',
  france: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=1200',
  singapore: 'https://images.pexels.com/photos/1842332/pexels-photo-1842332.jpeg?auto=compress&cs=tinysrgb&w=1200',
  malaysia: 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200',
  uk: 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=1200',
  kenya: 'https://images.pexels.com/photos/33045/lion-wild-africa-african.jpg?auto=compress&cs=tinysrgb&w=1200',
  'united-states': 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1200',
  egypt: 'https://images.pexels.com/photos/71241/pexels-photo-71241.jpeg?auto=compress&cs=tinysrgb&w=1200',
  indonesia: 'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=1200',
  thailand: 'https://images.pexels.com/photos/207052/pexels-photo-207052.jpeg?auto=compress&cs=tinysrgb&w=1200',
  vietnam: 'https://images.pexels.com/photos/1035678/pexels-photo-1035678.jpeg?auto=compress&cs=tinysrgb&w=1200',
  canada: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200',
  australia: 'https://images.pexels.com/photos/995718/pexels-photo-995718.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'saudi-arabia': 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg?auto=compress&cs=tinysrgb&w=1200',
  brazil: 'https://images.pexels.com/photos/351283/pexels-photo-351283.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'south-korea': 'https://images.pexels.com/photos/2376997/pexels-photo-2376997.jpeg?auto=compress&cs=tinysrgb&w=1200',
  japan: 'https://images.pexels.com/photos/1450082/pexels-photo-1450082.jpeg?auto=compress&cs=tinysrgb&w=1200',
  default: 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=1200',
}

await mkdir(outDir, { recursive: true })

for (const [slug, url] of Object.entries(images)) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed ${slug}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 20_000) throw new Error(`File too small for ${slug} (${buf.length} bytes)`)
  const file = path.join(outDir, `${slug}.jpg`)
  await writeFile(file, buf)
  console.log(`Saved ${slug}.jpg (${buf.length} bytes)`)
}

console.log('Done.')
