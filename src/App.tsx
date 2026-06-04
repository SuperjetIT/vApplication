import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import OtpVerifyPage from './pages/OtpVerifyPage'
import SchengenPage from './pages/SchengenPage'
import SignInPage from './pages/SignInPage'
import UserApplicationPage from './pages/UserApplicationPage'
import UserMePage from './pages/UserMePage'
import VisaPage from './pages/VisaPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/visa/schengen" element={<SchengenPage />} />
          <Route path="/visa/:countrySlug" element={<VisaPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-in/verify" element={<OtpVerifyPage />} />
          <Route path="/user/me" element={<UserMePage />} />
          <Route path="/user/me/applications/:applicationId" element={<UserApplicationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
