import { SiteLayout } from '../components/SiteLayout'
import './SignInPage.css'

export default function SignInPage() {
  return (
    <SiteLayout>
      <main className="signin-page">
        <section className="signin-card" aria-labelledby="signin-title">
          <p className="signin-kicker">Welcome back</p>
          <h1 id="signin-title">Sign In</h1>
          <p className="signin-subtitle">
            Continue to vApplication to track visas, manage applications, and get real-time updates.
          </p>

          <form className="signin-form" onSubmit={(e) => e.preventDefault()}>
            <label className="signin-field">
              <span>Email</span>
              <input type="email" placeholder="you@example.com" autoComplete="email" required />
            </label>

            <label className="signin-field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>

            <button type="submit" className="signin-submit">
              Sign In
            </button>
          </form>

          <div className="signin-meta">
            <a href="#forgot-password">Forgot password?</a>
            <span>•</span>
            <a href="#create-account">Create account</a>
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
