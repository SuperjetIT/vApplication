import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CitizenshipModal } from './components/CitizenshipModal'
import { AuthProvider } from './context/AuthContext'
import { CitizenshipProvider, useCitizenship } from './context/CitizenshipContext'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import OtpVerifyPage from './pages/OtpVerifyPage'
import SchengenPage from './pages/SchengenPage'
import SignInPage from './pages/SignInPage'
import UserApplicationPage from './pages/UserApplicationPage'
import ApplyPage from './pages/ApplyPage'
import InvoicePage from './pages/InvoicePage'
import UserMePage from './pages/UserMePage'
import VisaPage from './pages/VisaPage'

const BRAND = '#f93e42'

function CookiesBanner({ onAccept }: { onAccept: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        background: '#fff',
        borderTop: '1px solid #eee',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <p style={{ margin: 0, fontSize: 14, color: '#333' }}>
        We use cookies to enhance your experience on Super Visa.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          style={{
            border: 'none',
            background: 'none',
            color: '#666',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Manage
        </button>
        <button
          type="button"
          onClick={onAccept}
          style={{
            border: 'none',
            borderRadius: 40,
            background: BRAND,
            color: '#fff',
            padding: '8px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Accept All
        </button>
      </div>
    </div>
  )
}

function AppContent() {
  const { isModalOpen } = useCitizenship()
  const [cookiesAccepted, setCookiesAccepted] = useState(
    () => localStorage.getItem('cookies_accepted') === 'true',
  )

  const handleAcceptCookies = () => {
    localStorage.setItem('cookies_accepted', 'true')
    setCookiesAccepted(true)
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/visa/schengen" element={<SchengenPage />} />
        <Route path="/visa/:countrySlug" element={<VisaPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/invoice" element={<InvoicePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-in/verify" element={<OtpVerifyPage />} />
        <Route path="/user/me" element={<UserMePage />} />
        <Route path="/user/me/applications/:applicationId" element={<UserApplicationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {isModalOpen && <CitizenshipModal />}
      {!cookiesAccepted && <CookiesBanner onAccept={handleAcceptCookies} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CitizenshipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </CitizenshipProvider>
    </BrowserRouter>
  )
}
