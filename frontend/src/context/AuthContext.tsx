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
import { Database } from '../database/db'

import { LAST_LOGIN_EMAIL_KEY, USER_LOGGED_IN_KEY, USER_REF_KEY, USER_SESSION_KEY } from '../utils/authGate'
import { USER_EXP_KEY, setSessionExpiry } from '../config/storageKeys'
import { notifyAdminNewUser } from '../utils/adminNotifications'
import { syncUserToServer } from '../utils/userSync'

const USER_KEY = USER_SESSION_KEY
const OTP_EMAIL_KEY = 'supervisa_otp_email'
const CURRENT_USER_ID_KEY = USER_REF_KEY

function loadProfilePhotoFromDb(email: string): string | null {
  const dbUser = Database.getUserByEmail(email.trim().toLowerCase())
  const photo = dbUser?.profilePhoto
  return typeof photo === 'string' && photo.trim() ? photo : null
}

export type AuthUser = {
  email: string
  fullName?: string
}

type ServerUserMeta = {
  id?: string
  lastLogin?: string
  loginCount?: number
  registrationSource?: string
}

function syncUserToDatabase(email: string, fullName: string, serverMeta?: ServerUserMeta) {
  const normalized = email.trim().toLowerCase()
  const now = new Date().toISOString()
  const existing = Database.getUserByEmail(normalized)
  if (!existing) {
    const created = Database.createUser({
      id: serverMeta?.id,
      fullName,
      email: normalized,
      phone: '',
      phoneCode: '+971',
      passportCountry: '',
      residenceCountry: 'UAE',
      residencyStatus: 'Resident',
      registrationSource: serverMeta?.registrationSource ?? 'sign_in',
      isVerified: true,
      profilePhoto: null,
      lastLogin: serverMeta?.lastLogin ?? now,
      loginCount: serverMeta?.loginCount ?? 1,
    })
    notifyAdminNewUser({
      userId: String(created.id),
      fullName,
      email: normalized,
      source: serverMeta?.registrationSource === 'application' ? 'application' : 'sign_in',
    })
    localStorage.setItem(CURRENT_USER_ID_KEY, String(created.id))
    void syncUserToServer(created as Record<string, unknown>)
    return
  }
  const updated = Database.updateUser(String(existing.id), {
    fullName,
    lastLogin: serverMeta?.lastLogin ?? now,
    loginCount: serverMeta?.loginCount ?? existing.loginCount ?? 1,
    isVerified: true,
  })
  localStorage.setItem(CURRENT_USER_ID_KEY, String(existing.id))
  if (updated) void syncUserToServer(updated as Record<string, unknown>)
}

type AuthContextValue = {
  user: AuthUser | null
  isLoggedIn: boolean
  avatarInitials: string
  avatarColor: string
  profilePhotoUrl: string | null
  displayName: string
  loginWithEmail: (email: string, verifiedUser?: AuthUser, serverMeta?: ServerUserMeta) => Promise<void>
  logout: () => void
  updateProfile: (fullName: string) => Promise<void>
  updateProfilePhoto: (dataUrl: string | null) => Promise<void>
  refreshUser: () => Promise<void>
  sendOtp: (email: string) => Promise<void>
  verifyOtp: (
    email: string,
    code: string,
  ) => Promise<{ ok: boolean; error?: string; user?: AuthUser; serverMeta?: ServerUserMeta }>
  getPendingOtpEmail: () => string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

function normalizeStoredUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as { email?: string; fullName?: string; name?: string }
  if (!record.email) return null
  const email = record.email.trim().toLowerCase()
  const fullName = (record.fullName ?? record.name ?? '').trim()
  return { email, fullName: fullName || undefined }
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return normalizeStoredUser(JSON.parse(raw))
  } catch {
    return null
  }
}

function persistUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        email: user.email,
        fullName: user.fullName ?? '',
      }),
    )
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

function clearAuthStorage() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(USER_LOGGED_IN_KEY)
  sessionStorage.removeItem(OTP_EMAIL_KEY)
}

async function parseApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    if (data.error) return data.error
  } catch {
    /* ignore */
  }
  return 'Something went wrong. Please try again.'
}

async function fetchUserMe(email: string): Promise<AuthUser> {
  const normalized = email.trim().toLowerCase()
  const res = await fetch('/api/user/me', {
    headers: { 'X-User-Email': normalized },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  const data = (await res.json()) as { email: string; fullName?: string }
  return {
    email: data.email.trim().toLowerCase(),
    fullName: (data.fullName ?? '').trim() || undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const loaded = loadUser()
    if (loaded?.email) {
      localStorage.setItem(USER_LOGGED_IN_KEY, 'true')
      if (!localStorage.getItem(LAST_LOGIN_EMAIL_KEY)) {
        localStorage.setItem(LAST_LOGIN_EMAIL_KEY, loaded.email)
      }
    }
    return loaded
  })
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(() =>
    user?.email ? loadProfilePhotoFromDb(user.email) : null,
  )

  const applyUser = useCallback((next: AuthUser | null) => {
    setUser(next)
    persistUser(next)
  }, [])

  useEffect(() => {
    if (!user?.email) return
    let cancelled = false
    fetchUserMe(user.email)
      .then((fresh) => {
        if (!cancelled) applyUser(fresh)
      })
      .catch(() => {
        /* keep cached user if API unavailable */
      })
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- refresh once on mount when cached session exists

  useEffect(() => {
    if (!user?.email) {
      setProfilePhotoUrl(null)
      return
    }
    setProfilePhotoUrl(loadProfilePhotoFromDb(user.email))
  }, [user?.email])

  const loginWithEmail = useCallback(
    async (email: string, verifiedUser?: AuthUser, serverMeta?: ServerUserMeta) => {
      const normalized = email.trim().toLowerCase()
      let nextUser: AuthUser = verifiedUser ?? { email: normalized }

      try {
        nextUser = await fetchUserMe(normalized)
      } catch {
        /* API unreachable or /user/me missing — use verify response */
      }

      applyUser(nextUser)
      syncUserToDatabase(normalized, nextUser.fullName ?? '', serverMeta)
      localStorage.setItem(USER_LOGGED_IN_KEY, 'true')
      localStorage.setItem(LAST_LOGIN_EMAIL_KEY, normalized)
      setSessionExpiry(USER_EXP_KEY)
      sessionStorage.removeItem(OTP_EMAIL_KEY)
    },
    [applyUser],
  )

  const logout = useCallback(() => {
    setUser(null)
    clearAuthStorage()
  }, [])

  const refreshUser = useCallback(async () => {
    if (!user?.email) return
    const fresh = await fetchUserMe(user.email)
    applyUser(fresh)
  }, [user?.email, applyUser])

  const updateProfile = useCallback(
    async (fullName: string) => {
      if (!user?.email) return
      const trimmed = fullName.trim()
      const normalized = user.email.trim().toLowerCase()

      applyUser({
        email: normalized,
        fullName: trimmed || undefined,
      })
      syncUserToDatabase(normalized, trimmed)

      try {
        const res = await fetch('/api/user/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized, fullName: trimmed }),
        })
        if (!res.ok) {
          throw new Error(await parseApiError(res))
        }
        const data = (await res.json()) as { email: string; fullName?: string }
        const apiName = (data.fullName ?? trimmed).trim()
        applyUser({
          email: data.email.trim().toLowerCase(),
          fullName: apiName || undefined,
        })
        syncUserToDatabase(data.email.trim().toLowerCase(), apiName)
      } catch {
        /* Database + local session already updated — API sync is best-effort */
      }
    },
    [user?.email, applyUser],
  )

  const updateProfilePhoto = useCallback(async (dataUrl: string | null) => {
    if (!user?.email) throw new Error('Not signed in')
    const normalized = user.email.trim().toLowerCase()
    const dbUser = Database.getUserByEmail(normalized)
    const userId = dbUser?.id ?? localStorage.getItem(CURRENT_USER_ID_KEY)
    if (!userId) throw new Error('User account not found')
    Database.updateUser(String(userId), { profilePhoto: dataUrl })
    setProfilePhotoUrl(dataUrl)
  }, [user?.email])

  const sendOtp = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase()
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized }),
    })

    if (!res.ok) {
      throw new Error(await parseApiError(res))
    }

    sessionStorage.setItem(OTP_EMAIL_KEY, normalized)
  }, [])

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const normalized = email.trim().toLowerCase()
    let res: Response
    try {
      res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized, code: code.trim() }),
      })
    } catch {
      return {
        ok: false,
        error: 'Cannot reach the server. Run npm run dev (starts API + website).',
      }
    }

    let data: {
      success: boolean
      error?: string
      user?: {
        email: string
        fullName?: string
        id?: string
        lastLogin?: string
        loginCount?: number
        registrationSource?: string
      }
    }
    try {
      data = (await res.json()) as typeof data
    } catch {
      return { ok: false, error: 'Invalid response from server. Please try again.' }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? 'Something went wrong. Please try again.',
      }
    }

    if (!data.success) {
      return { ok: false, error: data.error ?? 'Invalid or expired code.' }
    }

    const authUser: AuthUser = {
      email: normalized,
      fullName: (data.user?.fullName ?? '').trim() || undefined,
    }

    const serverMeta: ServerUserMeta = {
      id: data.user?.id,
      lastLogin: data.user?.lastLogin,
      loginCount: data.user?.loginCount,
      registrationSource: data.user?.registrationSource,
    }

    return { ok: true, user: authUser, serverMeta }
  }, [])

  const getPendingOtpEmail = useCallback(() => sessionStorage.getItem(OTP_EMAIL_KEY), [])

  const value = useMemo<AuthContextValue>(() => {
    const email = user?.email ?? ''
    const fullName = user?.fullName
    return {
      user,
      isLoggedIn: Boolean(user),
      avatarInitials: user ? getInitials(email, fullName) : '',
      avatarColor: user ? getAvatarColor(email) : '#9ca3af',
      profilePhotoUrl,
      displayName: user ? getDisplayName(email, fullName) : '',
      loginWithEmail,
      logout,
      updateProfile,
      updateProfilePhoto,
      refreshUser,
      sendOtp,
      verifyOtp,
      getPendingOtpEmail,
    }
  }, [
    user,
    profilePhotoUrl,
    loginWithEmail,
    logout,
    updateProfile,
    updateProfilePhoto,
    refreshUser,
    sendOtp,
    verifyOtp,
    getPendingOtpEmail,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
