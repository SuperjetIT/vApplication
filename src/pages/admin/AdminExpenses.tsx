import { useMemo, useState } from 'react'
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, chartTooltipStyle, inputStyle, selectStyle, cardStyle, outlineBtn, primaryBtn, tableHeaderStyle, tabActive, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from '../../components/admin/adminTheme'
import { MOCK_EXPENSES, type AdminExpense } from '../../data/adminMockData'

const CATEGORIES = ['Salary', 'Office Rent', 'Software', 'Marketing', 'Travel', 'Other']
const COLORS = ['#f93e42', '#5057ea', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState<AdminExpense[]>(MOCK_EXPENSES)
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({ category: 'Salary', description: '', amount: '', date: '' })

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => categoryFilter === 'all' || e.category === categoryFilter)
  }, [expenses, categoryFilter])

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const thisMonth = expenses.filter((e) => e.date.startsWith('2026-06')).reduce((s, e) => s + e.amount, 0)

  const byCategory = CATEGORIES.map((cat) => ({
    name: cat,
    value: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.value > 0)

  const monthlyData = [
    { month: 'Jan', expenses: 72000, revenue: 28000 },
    { month: 'Feb', expenses: 68000, revenue: 31000 },
    { month: 'Mar', expenses: 75000, revenue: 25000 },
    { month: 'Apr', expenses: 71000, revenue: 42000 },
    { month: 'May', expenses: 82000, revenue: 38500 },
    { month: 'Jun', expenses: thisMonth, revenue: 15000 },
  ]

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.date) return
    setExpenses((prev) => [...prev, {
      id: String(prev.length + 1),
      category: form.category,
      description: form.description,
      amount: Number(form.amount),
      date: form.date,
      addedBy: 'Super Admin',
      hasReceipt: false,
    }])
    setModalOpen(false)
    setForm({ category: 'Salary', description: '', amount: '', date: '' })
    setToast('Expense added successfully')
  }

  return (
    <AdminLayout activePath="/admin/expenses" title="Expenses">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, flex: 1 }}>
          {[
            { label: 'Total Expenses', value: `AED ${total.toLocaleString()}` },
            { label: 'This Month', value: `AED ${thisMonth.toLocaleString()}` },
            { label: 'Categories', value: `${byCategory.length}` },
            { label: 'Budget Remaining', value: 'AED 18,000' },
          ].map((c) => (
            <div key={c.label} style={{ ...cardStyle, padding: 20 }}>
              <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setModalOpen(true)} style={{ ...primaryBtn, alignSelf: 'flex-start' }}>+ Add Expense</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setCategoryFilter('all')} style={tabActive(categoryFilter === 'all')}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setCategoryFilter(c)} style={tabActive(categoryFilter === c)}>{c}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, padding: 24, flex: '1 1 300px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={{ fill: '#fff', fontSize: 11 }}>
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...cardStyle, padding: 24, flex: '2 1 400px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Monthly Expenses vs Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: TEXT_MUTED, fontSize: 12 }} />
              <YAxis tick={{ fill: TEXT_MUTED, fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              <Line type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {filteredExpenses.length === 0 ? (
          <AdminEmptyState title="No expenses found" onClearFilters={categoryFilter !== 'all' ? () => setCategoryFilter('all') : undefined} onAdd={() => setModalOpen(true)} addLabel="+ Add Expense" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f8f9fc' }}>
                {['Category', 'Description', 'Amount', 'Date', 'Added by', 'Receipt'].map((h) => (
                  <th key={h} style={tableHeaderStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f8f9fc', color: TEXT_PRIMARY }}
                  onMouseEnter={(ev) => { ev.currentTarget.style.background = '#fafafe' }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: 16 }}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: 'rgba(255,255,255,0.08)' }}>{e.category}</span></td>
                  <td style={{ padding: 16 }}>{e.description}</td>
                  <td style={{ padding: 16, fontWeight: 600 }}>AED {e.amount.toLocaleString()}</td>
                  <td style={{ padding: 16, color: TEXT_MUTED }}>{e.date}</td>
                  <td style={{ padding: 16, color: TEXT_SECONDARY }}>{e.addedBy}</td>
                  <td style={{ padding: 16 }}>{e.hasReceipt ? '📎' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <>
          <div role="presentation" onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', ...cardStyle, padding: 32, maxWidth: 480, width: '90%', zIndex: 2001 }}>
            <h3 style={{ margin: '0 0 20px' }}>Add Expense</h3>
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...selectStyle, width: '100%', marginBottom: 12 }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Amount (AED)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ ...outlineBtn, flex: 1 }}>Cancel</button>
              <button type="button" onClick={handleSubmit} style={{ ...primaryBtn, flex: 1 }}>Save</button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
