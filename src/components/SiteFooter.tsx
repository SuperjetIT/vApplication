import { useState } from 'react'
import { Link } from 'react-router-dom'

const BRAND = '#f93e42'

function WhatsAppSvg() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 3 }}>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
        stroke="#888"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="10" r="2.5" stroke="#888" strokeWidth="1.5" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#888" strokeWidth="1.5" />
      <path d="M3 7l9 6 9-6" stroke="#888" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path
        d="M6.5 4h3l1.5 5-2 1.5a11 11 0 005 5l1.5-2 5 1.5v3a2 2 0 01-2 2C10.5 20 4 13.5 4 6.5a2 2 0 012-2.5z"
        stroke="#888"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FooterLink({ to, label }: { to: string; label: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        color: hovered ? BRAND : '#666',
        fontSize: 14,
        lineHeight: 2.2,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </Link>
  )
}

export function SiteFooter({ isMobile }: { isMobile: boolean }) {
  return (
    <footer
      style={{
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        padding: isMobile ? '48px 20px 24px' : '48px 32px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 32 : 40,
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMobile ? 'center' : 'flex-start',
          }}
        >
          <div>
            <span style={{ fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: BRAND }}>
              Super Visa
            </span>
            <span style={{ marginLeft: 6, color: BRAND, fontSize: 20 }}>→</span>
          </div>
          <p style={{ margin: '8px 0 0', color: '#888', fontSize: 14 }}>Visas. Delivered On Time.</p>
          <a
            href="https://wa.me/971559641020"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 40,
              background: 'linear-gradient(135deg, #25d366, #128c7e)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
            }}
          >
            <WhatsAppSvg />
            +971 559641020
          </a>
        </div>

        <div>
          <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15, color: '#111' }}>Contact Us</p>
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 16,
              justifyContent: isMobile ? 'center' : 'flex-start',
            }}
          >
            <PinIcon />
            <p style={{ margin: 0, color: '#666', fontSize: 14, lineHeight: 1.8, textAlign: isMobile ? 'left' : 'left' }}>
              Office 206, Fifty One @ Business Bay,
              <br />
              Marasi Drive, Business Bay,
              <br />
              Dubai, United Arab Emirates
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
              justifyContent: isMobile ? 'center' : 'flex-start',
            }}
          >
            <MailIcon />
            <a
              href="mailto:inquiry@superjetgroup.com"
              style={{ color: BRAND, fontSize: 14, textDecoration: 'none' }}
            >
              inquiry@superjetgroup.com
            </a>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              justifyContent: isMobile ? 'center' : 'flex-start',
            }}
          >
            <PhoneIcon />
            <a href="tel:+97143399779" style={{ color: '#666', fontSize: 14, textDecoration: 'none' }}>
              +971 4 339 9779
            </a>
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15, color: '#111' }}>Quick Links</p>
          <nav aria-label="Footer">
            <FooterLink to="/" label="Home" />
            <FooterLink to="/contact" label="Contact" />
            <FooterLink to="/sign-in" label="Sign In" />
            <FooterLink to="/visa/schengen" label="Schengen Visa" />
          </nav>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: '32px auto 0',
          borderTop: '1px solid #f0f0f0',
          paddingTop: 20,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'center' : 'space-between',
          alignItems: 'center',
          gap: 12,
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        <span style={{ color: '#aaa', fontSize: 13 }}>Copyright © 2026 Superjet Visa</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <span
            style={{
              background: '#f8f8f8',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 11,
              color: '#888',
            }}
          >
            🔒 AES-256 Encrypted
          </span>
          <span
            style={{
              background: '#f8f8f8',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 11,
              color: '#888',
            }}
          >
            ✓ Secure Payments
          </span>
        </div>
      </div>
    </footer>
  )
}
