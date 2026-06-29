import {
  ADMIN_AUTH_KEY,
  ADMIN_EXP_KEY,
  ADMIN_REF_KEY,
  HINT_KEY,
  REDIRECT_KEY,
  USER_AUTH_KEY,
  USER_REF_KEY,
  USER_SESSION_KEY,
} from '../config/storageKeys'

export const REDIRECT_AFTER_LOGIN_KEY = REDIRECT_KEY
export const LAST_LOGIN_EMAIL_KEY = HINT_KEY
export const USER_LOGGED_IN_KEY = USER_AUTH_KEY
export const SIGNIN_PREFILL_EMAIL_KEY = 'sv_signin_prefill'

export function isUserLoggedIn(): boolean {
  return localStorage.getItem(USER_AUTH_KEY) === 'true'
}

export function saveRedirectUrl(url: string) {
  localStorage.setItem(REDIRECT_KEY, url)
}

export function peekRedirectUrl(): string | null {
  return localStorage.getItem(REDIRECT_KEY)
}

export function consumeRedirectUrl(): string | null {
  const url = localStorage.getItem(REDIRECT_KEY)
  if (url) localStorage.removeItem(REDIRECT_KEY)
  return url
}

export function clearRedirectUrl() {
  localStorage.removeItem(REDIRECT_KEY)
}

export function redirectToSignIn(
  navigate: (path: string) => void,
  redirectUrl: string,
  register = false,
) {
  saveRedirectUrl(redirectUrl)
  navigate(register ? '/sign-in?mode=register' : '/sign-in')
}

export function resolvePostLoginPath(): string {
  return consumeRedirectUrl() ?? '/user/me'
}

export { USER_REF_KEY, USER_SESSION_KEY }
export const CURRENT_USER_ID_KEY = USER_REF_KEY
