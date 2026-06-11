import { useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminToast } from '../../components/admin/AdminToast'
import { AdminToggle } from '../../components/admin/AdminToggle'
import { BRAND, BORDER, cardStyle, inputStyle, PAGE_BG, pillTab, primaryBtn, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'

const TABS = [
  { key: 'gateways', label: 'Payment Gateways' },
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'visa', label: 'Visa APIs' },
  { key: 'security', label: 'Security' },
] as const

function MaskedField({ label, defaultValue = 'sk_test_••••••••••••••••' }: { label: string; defaultValue?: string }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const value = defaultValue

  const copy = () => {
    navigator.clipboard.writeText(value.replace(/•/g, 'x'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type={revealed ? 'text' : 'password'} defaultValue={value} style={{ ...inputStyle, flex: 1 }} readOnly />
        <button type="button" onClick={() => setRevealed((r) => !r)} style={{ background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', cursor: 'pointer', color: TEXT_SECONDARY }}>{revealed ? '🙈' : '👁'}</button>
        <button type="button" onClick={copy} style={{ background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', cursor: 'pointer', color: TEXT_SECONDARY, position: 'relative' }}>
          📋
          {copied && <span style={{ position: 'absolute', top: -28, right: 0, background: '#22c55e', color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 6 }}>Copied!</span>}
        </button>
      </div>
    </div>
  )
}

function GatewayCard({ name, logo, defaultOn, children, onSave }: { name: string; logo: React.ReactNode; defaultOn?: boolean; children: React.ReactNode; onSave: () => void }) {
  const [on, setOn] = useState(defaultOn ?? false)
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ ...cardStyle, padding: 24, transition: 'all 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = cardStyle.boxShadow as string; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{logo}<span style={{ fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY }}>{name}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: on ? '#f0fff4' : PAGE_BG, color: on ? '#16a34a' : TEXT_MUTED, border: `1px solid ${on ? '#bbf7d0' : BORDER}` }}>{on ? 'Connected' : 'Disconnected'}</span>
          <AdminToggle enabled={on} onChange={setOn} />
        </div>
      </div>
      <button type="button" onClick={() => setExpanded((e) => !e)} style={{ ...primaryBtn, fontSize: 13, padding: '8px 20px' }}>Settings</button>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
          {children}
          <button type="button" onClick={onSave} style={{ ...primaryBtn, marginTop: 12 }}>Save Settings</button>
        </div>
      )}
    </div>
  )
}

export default function AdminSettings() {
  const [activeSettingsTab, setActiveSettingsTab] = useState<(typeof TABS)[number]['key']>('gateways')
  const [toast, setToast] = useState<string | null>(null)
  const [sherpaConnected, setSherpaConnected] = useState(false)
  const [twoFa, setTwoFa] = useState(false)

  const save = () => setToast('Settings saved')

  return (
    <AdminLayout activePath="/admin/settings" title="Settings & API Integrations">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ background: PAGE_BG, borderRadius: 40, padding: 4, display: 'inline-flex', marginBottom: 24, flexWrap: 'wrap', gap: 4 }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveSettingsTab(t.key)} style={pillTab(activeSettingsTab === t.key)}>{t.label}</button>
        ))}
      </div>

      {activeSettingsTab === 'gateways' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          <GatewayCard name="Stripe" onSave={save} logo={<span style={{ fontWeight: 800, color: '#635bff', fontSize: 18 }}>stripe</span>}>
            <MaskedField label="Publishable Key" defaultValue="pk_test_••••••••••••" />
            <MaskedField label="Secret Key" />
            <MaskedField label="Webhook Secret" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_SECONDARY }}><input type="checkbox" /> Test Mode</label>
          </GatewayCard>
          <GatewayCard name="PayPal" onSave={save} logo={<span style={{ fontWeight: 800, color: '#003087' }}>PayPal</span>}>
            <MaskedField label="Client ID" />
            <MaskedField label="Secret" />
          </GatewayCard>
          <GatewayCard name="Bank Transfer" defaultOn onSave={save} logo={<span style={{ fontSize: 22 }}>🏦</span>}>
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Bank Name</label>
            <input defaultValue="Emirates NBD" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>IBAN</label>
            <input defaultValue="AE07 0351 2345 6789 0123 456" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Account Name</label>
            <input defaultValue="Superjet Global FZE" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Swift Code</label>
            <input defaultValue="EBILAEAD" style={{ ...inputStyle, width: '100%' }} />
          </GatewayCard>
          <GatewayCard name="Telr" onSave={save} logo={<span style={{ fontWeight: 700, color: '#00a651' }}>Telr</span>}>
            <MaskedField label="Store ID" defaultValue="•••••" />
            <MaskedField label="Auth Key" />
          </GatewayCard>
          <GatewayCard name="Network International" onSave={save} logo={<span style={{ fontWeight: 600, fontSize: 13 }}>NI UAE</span>}>
            <MaskedField label="Outlet ID" />
            <MaskedField label="Terminal ID" />
            <MaskedField label="API Key" />
          </GatewayCard>
          <GatewayCard name="Checkout.com" onSave={save} logo={<span style={{ fontWeight: 700 }}>Checkout</span>}>
            <MaskedField label="Public Key" />
            <MaskedField label="Secret Key" />
          </GatewayCard>
          <GatewayCard name="Wallet Balance" defaultOn onSave={save} logo={<span style={{ fontSize: 22 }}>👛</span>}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, color: TEXT_SECONDARY }}><input type="checkbox" defaultChecked /> Enable top-up</label>
            <input defaultValue="0" placeholder="Min Balance" style={{ ...inputStyle, width: '100%', marginBottom: 8 }} />
            <input defaultValue="Full refund within 7 days" style={{ ...inputStyle, width: '100%' }} />
          </GatewayCard>
          <GatewayCard name="Pay Later" onSave={save} logo={<span style={{ fontSize: 22 }}>📅</span>}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, color: TEXT_SECONDARY }}><input type="checkbox" /> Enable installments</label>
            <input defaultValue="3 / 6 / 12 months" style={{ ...inputStyle, width: '100%' }} />
          </GatewayCard>
        </div>
      )}

      {activeSettingsTab === 'email' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700 }}>Resend.com</span>
              <AdminToggle enabled onChange={() => {}} />
            </div>
            <MaskedField label="API Key" />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>From Email</label>
            <input defaultValue="no-reply@superjetglobal.com" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>From Name</label>
            <input defaultValue="Super Visa" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <button type="button" onClick={save} style={primaryBtn}>Send Test Email</button>
          </div>
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700 }}>SendGrid</span>
              <AdminToggle enabled={false} onChange={() => {}} />
            </div>
            <MaskedField label="API Key" />
          </div>
        </div>
      )}

      {activeSettingsTab === 'whatsapp' && (
        <div style={{ ...cardStyle, padding: 24, maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 16px' }}>Meta WhatsApp Cloud API</h3>
          <MaskedField label="Phone Number ID" defaultValue="••••••••" />
          <MaskedField label="Access Token" />
          <MaskedField label="Webhook Verify Token" />
          <a href="https://wa.me/971559641020" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, background: '#25d366', color: TEXT_PRIMARY, borderRadius: 8, padding: '8px 20px', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>Send Test Message</a>
        </div>
      )}

      {activeSettingsTab === 'visa' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          <div style={{ ...cardStyle, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>Sherpa API</h3>
            <MaskedField label="API Key" />
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>Environment</span>
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <label style={{ fontSize: 13, color: TEXT_SECONDARY }}><input type="radio" name="sherpa" defaultChecked /> Sandbox</label>
                <label style={{ fontSize: 13, color: TEXT_SECONDARY }}><input type="radio" name="sherpa" /> Production</label>
              </div>
            </div>
            <button type="button" onClick={() => { setSherpaConnected(true); save() }} style={primaryBtn}>Test Connection</button>
            <div style={{ marginTop: 12, fontSize: 13, color: sherpaConnected ? '#22c55e' : TEXT_MUTED }}>{sherpaConnected ? '● Connected' : '● Not Connected'}</div>
          </div>
          <div style={{ ...cardStyle, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>Amadeus API</h3>
            <MaskedField label="Client ID" />
            <MaskedField label="Client Secret" />
            <button type="button" onClick={save} style={{ ...primaryBtn, marginTop: 8 }}>Test Connection</button>
          </div>
          <div style={{ ...cardStyle, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>ipapi.co</h3>
            <div style={{ fontSize: 13, color: '#22c55e', marginBottom: 8 }}>● Free tier active</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 8 }}>234 / 1000 requests today</div>
            <div style={{ height: 8, background: PAGE_BG, borderRadius: 4, marginBottom: 12 }}>
              <div style={{ width: '23.4%', height: '100%', background: BRAND, borderRadius: 4 }} />
            </div>
            <a href="#" style={{ fontSize: 13, color: BRAND }}>Upgrade to Pro →</a>
          </div>
        </div>
      )}

      {activeSettingsTab === 'security' && (
        <div style={{ ...cardStyle, padding: 24, maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 16px' }}>Change Admin Password</h3>
          <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Current Password</label>
          <input type="password" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
          <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>New Password</label>
          <input type="password" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
          <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Confirm Password</label>
          <input type="password" style={{ ...inputStyle, width: '100%', marginBottom: 20 }} />
          <button type="button" onClick={save} style={{ ...primaryBtn, marginBottom: 24 }}>Update Password</button>
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 500 }}>Two-Factor Authentication</span>
              <AdminToggle enabled={twoFa} onChange={setTwoFa} />
            </div>
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Session Timeout</label>
            <select style={{ ...inputStyle, width: '100%', marginBottom: 16 }}>
              <option>1 hour</option><option>4 hours</option><option>8 hours</option><option>24 hours</option>
            </select>
            <label style={{ display: 'block', fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>Login Attempts Limit</label>
            <input defaultValue="5" style={{ ...inputStyle, width: '100%' }} />
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
