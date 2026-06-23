/** Local landmark photos for destination cards (stored in /public/images/countries). */
import { countries } from '../data/countries'

const COUNTRY_IMAGE_BASE = '/images/countries'
const KNOWN_SLUGS = new Set(countries.map((c) => c.slug))

export function getCountryLandmarkImage(slug: string, _width = 800, _height?: number): string {
  if (KNOWN_SLUGS.has(slug)) return `${COUNTRY_IMAGE_BASE}/${slug}.jpg`
  return `${COUNTRY_IMAGE_BASE}/default.jpg`
}

export function getCountryLandmarkLabel(slug: string): string {
  const labels: Record<string, string> = {
    india: 'Taj Mahal',
    uae: 'Burj Khalifa',
    france: 'Eiffel Tower',
    singapore: 'Merlion',
    malaysia: 'Petronas Towers',
    uk: 'Big Ben',
    kenya: 'Maasai Mara',
    'united-states': 'Statue of Liberty',
    egypt: 'Pyramids of Giza',
    indonesia: 'Borobudur',
    thailand: 'Wat Arun',
    vietnam: 'Ha Long Bay',
    canada: 'Canadian Rockies',
    australia: 'Sydney Opera House',
    'saudi-arabia': 'Riyadh',
    brazil: 'Christ the Redeemer',
    'south-korea': 'Gyeongbokgung Palace',
    japan: 'Mount Fuji',
  }
  return labels[slug] ?? 'landmark'
}
