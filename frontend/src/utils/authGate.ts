export const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login'
export const LAST_LOGIN_EMAIL_KEY = 'last_login_email'
export const USER_LOGGED_IN_KEY = 'user_logged_in'
export const SIGNIN_PREFILL_EMAIL_KEY = 'signin_prefill_email'

export function isUserLoggedIn(): boolean {
  return localStorage.getItem(USER_LOGGED_IN_KEY) === 'true'
}

export function saveRedirectUrl(url: string) {
  localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, url)
}

export function peekRedirectUrl(): string | null {
  return localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)
}

export function consumeRedirectUrl(): string | null {
  const url = localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)
  if (url) localStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
  return url
}

export function clearRedirectUrl() {
  localStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
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
