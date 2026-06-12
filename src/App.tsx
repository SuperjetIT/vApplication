import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import VisaCheckerPage from './pages/VisaCheckerPage'
import VisaRequirementsPage from './pages/VisaRequirementsPage'
import VisaPage from './pages/VisaPage'
import { AdminGuard, OperationsGuard } from './components/AdminLayout'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLeads from './pages/admin/AdminLeads'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminAgents from './pages/admin/AdminAgents'
import AdminInvoices from './pages/admin/AdminInvoices'
import AdminPayments from './pages/admin/AdminPayments'
import AdminExpenses from './pages/admin/AdminExpenses'
import AdminReports from './pages/admin/AdminReports'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSettings from './pages/admin/AdminSettings'
import AdminCaseDetail from './pages/admin/AdminCaseDetail'
import NotFoundPage from './pages/NotFoundPage'
import OperationsLoginPage from './pages/admin/OperationsLoginPage'
import {
  ADMIN_LOGIN_PATH,
  ADMIN_LOGIN_PATH_LEGACY,
  OPERATIONS_BASE_PATH,
  OPERATIONS_LOGIN_PATH,
} from './config/portalRoutes'

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
        We use cookies to enhance your experience on Superjet Global.
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
  const location = useLocation()
  const isAdminRoute =
    location.pathname.startsWith('/admin')
    || location.pathname.startsWith(OPERATIONS_BASE_PATH)
    || location.pathname === ADMIN_LOGIN_PATH
    || location.pathname === OPERATIONS_LOGIN_PATH
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
        <Route path="/visa-checker" element={<VisaCheckerPage />} />
        <Route path="/tools/visa-requirements" element={<VisaRequirementsPage />} />
        <Route path="/tools/visa-requirements/:destinationSlug" element={<VisaRequirementsPage />} />
        <Route path="/visa/schengen" element={<SchengenPage />} />
        <Route path="/visa/:countrySlug" element={<VisaPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/invoice" element={<InvoicePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-in/verify" element={<OtpVerifyPage />} />
        <Route path="/user/me" element={<UserMePage />} />
        <Route path="/user/me/applications/:applicationId" element={<UserApplicationPage />} />
        <Route path={ADMIN_LOGIN_PATH} element={<AdminLoginPage />} />
        <Route path={OPERATIONS_LOGIN_PATH} element={<OperationsLoginPage />} />
        <Route path={ADMIN_LOGIN_PATH_LEGACY} element={<NotFoundPage />} />
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path={OPERATIONS_BASE_PATH} element={<OperationsGuard><AdminDashboard /></OperationsGuard>} />
        <Route path="/admin/leads" element={<AdminGuard><AdminLeads /></AdminGuard>} />
        <Route path="/admin/customers" element={<AdminGuard><AdminCustomers /></AdminGuard>} />
        <Route path="/admin/agents" element={<AdminGuard><AdminAgents /></AdminGuard>} />
        <Route path="/admin/invoices" element={<AdminGuard><AdminInvoices /></AdminGuard>} />
        <Route path="/admin/payments" element={<AdminGuard><AdminPayments /></AdminGuard>} />
        <Route path="/admin/expenses" element={<AdminGuard><AdminExpenses /></AdminGuard>} />
        <Route path="/admin/reports" element={<AdminGuard><AdminReports /></AdminGuard>} />
        <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
        <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
        <Route path="/admin/cases/:id" element={<AdminGuard><AdminCaseDetail /></AdminGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/leads`} element={<OperationsGuard><AdminLeads /></OperationsGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/customers`} element={<OperationsGuard><AdminCustomers /></OperationsGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/agents`} element={<OperationsGuard><AdminAgents /></OperationsGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/invoices`} element={<OperationsGuard><AdminInvoices /></OperationsGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/payments`} element={<OperationsGuard><AdminPayments /></OperationsGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/expenses`} element={<OperationsGuard><AdminExpenses /></OperationsGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/reports`} element={<OperationsGuard><AdminReports /></OperationsGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/settings`} element={<OperationsGuard><Navigate to={OPERATIONS_BASE_PATH} replace /></OperationsGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/cases/:id`} element={<OperationsGuard><AdminCaseDetail /></OperationsGuard>} />
        <Route path={`${OPERATIONS_BASE_PATH}/users`} element={<OperationsGuard><Navigate to={OPERATIONS_BASE_PATH} replace /></OperationsGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isAdminRoute && isModalOpen && <CitizenshipModal />}
      {!isAdminRoute && !cookiesAccepted && <CookiesBanner onAccept={handleAcceptCookies} />}
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
