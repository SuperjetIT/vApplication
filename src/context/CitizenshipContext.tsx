import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getCitizenshipByCode } from '../data/citizenships'
import type { ResidencyStatus } from '../utils/visaRequirements'

const CITIZENSHIP_KEY = 'super_visa_citizenship'
const RESIDENCE_KEY = 'super_visa_residence'
const STATUS_KEY = 'super_visa_residency_status'
const LEGACY_CITIZENSHIP_KEY = 'user_citizenship'

const DEFAULT_CITIZENSHIP = { citizenship: 'India', countryCode: 'in' }
const DEFAULT_RESIDENCE = { residenceCountry: 'United Arab Emirates', residenceCode: 'ae' }
const DEFAULT_STATUS: ResidencyStatus = 'Permanent Resident'

type CitizenshipContextValue = {
  citizenship: string
  countryCode: string
  citizenshipCode: string
  setCitizenship: (citizenship: string, countryCode: string) => void
  residenceCountry: string
  residenceCode: string
  setResidenceCountry: (residenceCountry: string, residenceCode: string) => void
  residencyStatus: ResidencyStatus
  setResidencyStatus: (status: ResidencyStatus) => void
  saveProfile: (
    citizenship: string,
    citizenshipCode: string,
    residenceCountry: string,
    residenceCode: string,
    residencyStatus: ResidencyStatus,
  ) => void
  hasSavedCitizenship: boolean
  isModalOpen: boolean
  openCitizenshipModal: () => void
  closeCitizenshipModal: () => void
  detectedCountryHint: string | null
  setDetectedCountryHint: (hint: string | null) => void
}

function loadCitizenship(): { citizenship: string; countryCode: string; hasSaved: boolean } {
  try {
    const raw = localStorage.getItem(CITIZENSHIP_KEY) ?? localStorage.getItem(LEGACY_CITIZENSHIP_KEY)
    if (!raw) return { ...DEFAULT_CITIZENSHIP, hasSaved: false }
    const parsed = JSON.parse(raw) as { citizenship?: string; countryCode?: string }
    if (parsed.citizenship && parsed.countryCode) {
      return {
        citizenship: parsed.citizenship,
        countryCode: parsed.countryCode.toLowerCase(),
        hasSaved: true,
      }
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_CITIZENSHIP, hasSaved: false }
}

function loadResidence(): { residenceCountry: string; residenceCode: string } {
  try {
    const raw = localStorage.getItem(RESIDENCE_KEY)
    if (!raw) return DEFAULT_RESIDENCE
    const parsed = JSON.parse(raw) as { residenceCountry?: string; residenceCode?: string }
    if (parsed.residenceCountry && parsed.residenceCode) {
      return {
        residenceCountry: parsed.residenceCountry,
        residenceCode: parsed.residenceCode.toLowerCase(),
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_RESIDENCE
}

function loadStatus(): ResidencyStatus {
  try {
    const raw = localStorage.getItem(STATUS_KEY)
    if (raw) return raw as ResidencyStatus
  } catch {
    /* ignore */
  }
  return DEFAULT_STATUS
}

const CitizenshipContext = createContext<CitizenshipContextValue | null>(null)

export function CitizenshipProvider({ children }: { children: ReactNode }) {
  const initialCitizenship = loadCitizenship()
  const initialResidence = loadResidence()

  const [citizenship, setCitizenshipName] = useState(initialCitizenship.citizenship)
  const [countryCode, setCountryCode] = useState(initialCitizenship.countryCode)
  const [hasSavedCitizenship, setHasSavedCitizenship] = useState(initialCitizenship.hasSaved)
  const [residenceCountry, setResidenceName] = useState(initialResidence.residenceCountry)
  const [residenceCode, setResidenceCodeState] = useState(initialResidence.residenceCode)
  const [residencyStatus, setResidencyStatusState] = useState<ResidencyStatus>(loadStatus())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detectedCountryHint, setDetectedCountryHint] = useState<string | null>(null)
  const [ipDetectionDone, setIpDetectionDone] = useState(false)

  const setCitizenship = useCallback((name: string, code: string) => {
    const normalizedCode = code.toLowerCase()
    const entry = getCitizenshipByCode(normalizedCode)
    const nextName = entry?.name ?? name
    setCitizenshipName(nextName)
    setCountryCode(normalizedCode)
    setHasSavedCitizenship(true)
    localStorage.setItem(
      CITIZENSHIP_KEY,
      JSON.stringify({ citizenship: nextName, countryCode: normalizedCode }),
    )
    localStorage.removeItem(LEGACY_CITIZENSHIP_KEY)
  }, [])

  const setResidenceCountry = useCallback((name: string, code: string) => {
    const normalizedCode = code.toLowerCase()
    const entry = getCitizenshipByCode(normalizedCode)
    const nextName = entry?.name ?? name
    setResidenceName(nextName)
    setResidenceCodeState(normalizedCode)
    localStorage.setItem(
      RESIDENCE_KEY,
      JSON.stringify({ residenceCountry: nextName, residenceCode: normalizedCode }),
    )
  }, [])

  const setResidencyStatus = useCallback((status: ResidencyStatus) => {
    setResidencyStatusState(status)
    localStorage.setItem(STATUS_KEY, status)
  }, [])

  const saveProfile = useCallback(
    (
      nextCitizenship: string,
      nextCitizenshipCode: string,
      nextResidence: string,
      nextResidenceCode: string,
      nextStatus: ResidencyStatus,
    ) => {
      setCitizenship(nextCitizenship, nextCitizenshipCode)
      setResidenceCountry(nextResidence, nextResidenceCode)
      setResidencyStatus(nextStatus)
    },
    [setCitizenship, setResidenceCountry, setResidencyStatus],
  )

  useEffect(() => {
    if (ipDetectionDone) return
    let cancelled = false

    async function detectResidence() {
      const hasResidence = Boolean(localStorage.getItem(RESIDENCE_KEY))
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { country_name?: string; country_code?: string }
        const detectedCountry = data.country_name?.trim()
        const detectedCode = data.country_code?.trim().toLowerCase()
        if (!detectedCountry || !detectedCode || cancelled) return

        setDetectedCountryHint(detectedCountry)

        if (!hasResidence) {
          const entry = getCitizenshipByCode(detectedCode)
          setResidenceName(entry?.name ?? detectedCountry)
          setResidenceCodeState(detectedCode)
          localStorage.setItem(
            RESIDENCE_KEY,
            JSON.stringify({
              residenceCountry: entry?.name ?? detectedCountry,
              residenceCode: detectedCode,
            }),
          )
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setIpDetectionDone(true)
      }
    }

    detectResidence()
    return () => {
      cancelled = true
    }
  }, [ipDetectionDone])

  const openCitizenshipModal = useCallback(() => setIsModalOpen(true), [])
  const closeCitizenshipModal = useCallback(() => setIsModalOpen(false), [])

  const value = useMemo<CitizenshipContextValue>(
    () => ({
      citizenship,
      countryCode,
      citizenshipCode: countryCode,
      setCitizenship,
      residenceCountry,
      residenceCode,
      setResidenceCountry,
      residencyStatus,
      setResidencyStatus,
      saveProfile,
      hasSavedCitizenship,
      isModalOpen,
      openCitizenshipModal,
      closeCitizenshipModal,
      detectedCountryHint,
      setDetectedCountryHint,
    }),
    [
      citizenship,
      countryCode,
      setCitizenship,
      residenceCountry,
      residenceCode,
      setResidenceCountry,
      residencyStatus,
      setResidencyStatus,
      saveProfile,
      hasSavedCitizenship,
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
