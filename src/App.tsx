import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import SchengenPage from './pages/SchengenPage'
import SignInPage from './pages/SignInPage'
import VisaPage from './pages/VisaPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/visa/schengen" element={<SchengenPage />} />
        <Route path="/visa/:countrySlug" element={<VisaPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
