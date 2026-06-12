import { Link } from 'react-router-dom'
import { TEXT_MUTED, TEXT_PRIMARY } from '../components/admin/adminTheme'

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8f9fc' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: '#e8ecf0', lineHeight: 1 }}>404</div>
        <h1 style={{ margin: '16px 0 8px', fontSize: 22, color: TEXT_PRIMARY }}>Page not found</h1>
        <p style={{ margin: '0 0 24px', color: TEXT_MUTED, fontSize: 15 }}>The page you are looking for does not exist.</p>
        <Link to="/" style={{ color: '#f93e42', fontWeight: 600, textDecoration: 'none' }}>← Back to home</Link>
      </div>
    </div>
  )
}
