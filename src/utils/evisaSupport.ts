const evisaCountries = [
  'kenya', 'india', 'uae', 'thailand', 'turkey', 'vietnam', 'indonesia',
  'sri-lanka', 'egypt', 'azerbaijan', 'cambodia', 'myanmar',
]

export function checkEvisaSupport(destinationSlug: string): boolean {
  return evisaCountries.includes(destinationSlug.toLowerCase())
}

export function evisaBadgeLabel(supported: boolean): string {
  return supported ? '⚡ eVisa Available' : '📋 Manual Submission Required'
}
