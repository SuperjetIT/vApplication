import { useMemo, useState } from 'react'
import { Database } from '../database/db'

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function DevToolsPanel() {
  const [open, setOpen] = useState(false)
  const [rawOpen, setRawOpen] = useState(false)

  const rawData = useMemo(() => Database.exportDatabase(), [open, rawOpen])
  const parsed = useMemo(() => JSON.parse(rawData) as Record<string, unknown>, [rawData])
  const counts = useMemo(
    () => ({
      users: Array.isArray(parsed.users) ? parsed.users.length : 0,
      partners: Array.isArray(parsed.partners) ? parsed.partners.length : 0,
      applications: Array.isArray(parsed.applications) ? parsed.applications.length : 0,
      operators: Array.isArray(parsed.operators) ? parsed.operators.length : 0,
      admins: Array.isArray(parsed.admins) ? parsed.admins.length : 0,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices.length : 0,
      payments: Array.isArray(parsed.payments) ? parsed.payments.length : 0,
      commissions: Array.isArray(parsed.commissions) ? parsed.commissions.length : 0,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses.length : 0,
      documents: Array.isArray(parsed.documents) ? parsed.documents.length : 0,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications.length : 0,
      activities: Array.isArray(parsed.activities) ? parsed.activities.length : 0,
    }),
    [parsed],
  )

  if (!import.meta.env.DEV) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 99999,
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: 40,
          padding: '8px 16px',
          fontSize: 12,
          cursor: 'pointer',
          border: 'none',
        }}
      >
        🛠 Dev Tools
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 60,
            left: 16,
            zIndex: 99999,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            background: '#111',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: 12,
            padding: 14,
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13 }}>Temporary JSON DB</strong>
            <button type="button" onClick={() => setOpen(false)} style={{ border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}>x</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <button type="button" onClick={() => Database.resetDatabase()} style={{ fontSize: 12, background: '#991b1b', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Reset Database</button>
            <button type="button" onClick={() => downloadJson(`super-visa-db-${Date.now()}.json`, rawData)} style={{ fontSize: 12, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Export Database as JSON</button>
            <button type="button" onClick={() => setRawOpen((v) => !v)} style={{ fontSize: 12, background: '#374151', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>View Raw Data</button>
          </div>

          <div style={{ fontSize: 11, color: '#ddd', lineHeight: 1.7 }}>
            Users: {counts.users} | Partners: {counts.partners} | Applications: {counts.applications}
            <br />
            Operators: {counts.operators} | Admins: {counts.admins} | Invoices: {counts.invoices}
            <br />
            Payments: {counts.payments} | Commissions: {counts.commissions} | Expenses: {counts.expenses}
            <br />
            Documents: {counts.documents} | Notifications: {counts.notifications} | Activity: {counts.activities}
          </div>

          {rawOpen && (
            <pre
              style={{
                marginTop: 12,
                maxHeight: 220,
                overflow: 'auto',
                background: '#000',
                border: '1px solid #333',
                borderRadius: 8,
                padding: 10,
                fontSize: 10,
                whiteSpace: 'pre-wrap',
              }}
            >
              {rawData}
            </pre>
          )}
        </div>
      )}
    </>
  )
}
