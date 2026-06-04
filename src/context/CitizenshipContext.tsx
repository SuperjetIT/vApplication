import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getCitizenshipByCode } from '../data/citizenships'

const STORAGE_KEY = 'user_citizenship'

export type CitizenshipValue = {
  citizenship: string
  countryCode: string
}

type CitizenshipContextValue = CitizenshipValue & {
  hasSavedCitizenship: boolean
  setCitizenship: (citizenship: string, countryCode: string) => void
  isModalOpen: boolean
  openCitizenshipModal: () => void
  closeCitizenshipModal: () => void
  detectedCountryHint: string | null
  setDetectedCountryHint: (hint: string | null) => void
}

const DEFAULT: CitizenshipValue = {
  citizenship: 'India',
  countryCode: 'in',
}

function loadFromStorage(): { value: CitizenshipValue; hasSaved: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { value: DEFAULT, hasSaved: false }
    const parsed = JSON.parse(raw) as Partial<CitizenshipValue>
    if (parsed.citizenship && parsed.countryCode) {
      return {
        value: {
          citizenship: parsed.citizenship,
          countryCode: parsed.countryCode.toLowerCase(),
        },
        hasSaved: true,
      }
    }
  } catch {
    /* ignore */
  }
  return { value: DEFAULT, hasSaved: false }
}

const CitizenshipContext = createContext<CitizenshipContextValue | null>(null)

export function CitizenshipProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage()
  const [citizenship, setCitizenshipName] = useState(initial.value.citizenship)
  const [countryCode, setCountryCode] = useState(initial.value.countryCode)
  const [hasSavedCitizenship, setHasSavedCitizenship] = useState(initial.hasSaved)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detectedCountryHint, setDetectedCountryHint] = useState<string | null>(null)

  const setCitizenship = useCallback((name: string, code: string) => {
    const normalizedCode = code.toLowerCase()
    const entry = getCitizenshipByCode(normalizedCode)
    const nextName = entry?.name ?? name
    setCitizenshipName(nextName)
    setCountryCode(normalizedCode)
    setHasSavedCitizenship(true)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ citizenship: nextName, countryCode: normalizedCode }),
    )
  }, [])

  const openCitizenshipModal = useCallback(() => setIsModalOpen(true), [])
  const closeCitizenshipModal = useCallback(() => setIsModalOpen(false), [])

  const value = useMemo<CitizenshipContextValue>(
    () => ({
      citizenship,
      countryCode,
      hasSavedCitizenship,
      setCitizenship,
      isModalOpen,
      openCitizenshipModal,
      closeCitizenshipModal,
      detectedCountryHint,
      setDetectedCountryHint,
    }),
    [
      citizenship,
      countryCode,
      hasSavedCitizenship,
      setCitizenship,
      isModalOpen,
      openCitizenshipModal,
      closeCitizenshipModal,
      detectedCountryHint,
    ],
  )

  return <CitizenshipContext.Provider value={value}>{children}</CitizenshipContext.Provider>
}

export function useCitizenship(): CitizenshipContextValue {
  const ctx = useContext(CitizenshipContext)
  if (!ctx) {
    throw new Error('useCitizenship must be used within CitizenshipProvider')
  }
  return ctx
}
