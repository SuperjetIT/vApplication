import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getAvatarColor, getDisplayName, getInitials } from '../utils/avatar'

const USER_KEY = 'supervisa_user'
const OTP_KEY = 'supervisa_otp'
const OTP_EMAIL_KEY = 'supervisa_otp_email'
const OTP_EXPIRES_KEY = 'supervisa_otp_expires'

export type AuthUser = {
  email: string
  name?: string
}

type AuthContextValue = {
  user: AuthUser | null
  isLoggedIn: boolean
  avatarInitials: string
  avatarColor: string
  displayName: string
  login: (user: AuthUser) => void
  logout: () => void
  sendOtp: (email: string) => Promise<string>
  verifyOtp: (email: string, code: string) => boolean
  getPendingOtpEmail: () => string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (parsed?.email) return parsed
  } catch {
    /* ignore */
  }
  return null
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser())

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [user])

  const login = useCallback((next: AuthUser) => {
    setUser(next)
    sessionStorage.removeItem(OTP_KEY)
    sessionStorage.removeItem(OTP_EMAIL_KEY)
    sessionStorage.removeItem(OTP_EXPIRES_KEY)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const sendOtp = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase()
    await new Promise((r) => setTimeout(r, 900))
    const code = generateOtp()
    sessionStorage.setItem(OTP_KEY, code)
    sessionStorage.setItem(OTP_EMAIL_KEY, normalized)
    sessionStorage.setItem(OTP_EXPIRES_KEY, String(Date.now() + 10 * 60 * 1000))
    return code
  }, [])

  const verifyOtp = useCallback((email: string, code: string) => {
    const normalized = email.trim().toLowerCase()
    const storedEmail = sessionStorage.getItem(OTP_EMAIL_KEY)
    const storedOtp = sessionStorage.getItem(OTP_KEY)
    const expires = Number(sessionStorage.getItem(OTP_EXPIRES_KEY) ?? 0)
    if (!storedOtp || !storedEmail || storedEmail !== normalized) return false
    if (Date.now() > expires) return false
    return storedOtp === code.trim()
  }, [])

  const getPendingOtpEmail = useCallback(() => sessionStorage.getItem(OTP_EMAIL_KEY), [])

  const value = useMemo<AuthContextValue>(() => {
    const email = user?.email ?? ''
    return {
      user,
      isLoggedIn: Boolean(user),
      avatarInitials: user ? getInitials(email, user.name) : '',
      avatarColor: user ? getAvatarColor(email) : '#9ca3af',
      displayName: user ? getDisplayName(email, user.name) : '',
      login,
      logout,
      sendOtp,
      verifyOtp,
      getPendingOtpEmail,
    }
  }, [user, login, logout, sendOtp, verifyOtp, getPendingOtpEmail])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
