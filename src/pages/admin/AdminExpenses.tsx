import { useMemo, useState } from 'react'
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AdminLayout } from '../../components/AdminLayout'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminToast } from '../../components/admin/AdminToast'
import { BRAND, BORDER, chartTooltipStyle, inputStyle, selectStyle, cardStyle, outlineBtn, primaryBtn, tableHeaderStyle, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY, PAGE_BG } from '../../components/admin/adminTheme'
import { useDatabaseListener } from '../../hooks/useDatabase'
import { Database } from '../../database/db'
import type { AdminExpense } from '../../types/adminTypes'
import { dbExpenseToAdmin } from '../../utils/dbMappers'

const CATEGORIES = ['Salary', 'Office Rent', 'Software', 'Marketing', 'Travel', 'Other', 'Custom']
const COLORS = ['#f93e42', '#5057ea', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']
const BUDGET_TOTAL = 120000

const pillFilter = (active: boolean): React.CSSProperties => ({
  borderRadius: 40,
  padding: '6px 16px',
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  border: active ? 'none' : `1px solid ${BORDER}`,
  background: active ? BRAND : '#fff',
  color: active ? '#fff' : TEXT_SECONDARY,
})

export default function AdminExpenses() {
  useDatabaseListener()
  const expenses = Database.getExpenses().map((e) => dbExpenseToAdmin(e as Record<string, unknown>))
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({ category: 'Salary', customCategory: '', description: '', amount: '', date: '', receiptName: '' })

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => categoryFilter === 'all' || e.category === categoryFilter)
  }, [expenses, categoryFilter])

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const thisMonth = expenses.filter((e) => e.date.startsWith('2026-06')).reduce((s, e) => s + e.amount, 0)
  const budgetUsed = Math.min((thisMonth / BUDGET_TOTAL) * 100, 100)
  const budgetRemaining = Math.max(BUDGET_TOTAL - thisMonth, 0)

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

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setForm((f) => ({ ...f, receiptName: file.name }))
  }

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.date) return
    const category = form.category === 'Custom' ? (form.customCategory.trim() || 'Custom') : form.category
    Database.createExpense({
      category,
      description: form.description,
      amount: Number(form.amount),
      date: form.date,
      addedBy: 'Super Admin',
      receiptName: form.receiptName || null,
      receiptUrl: form.receiptName ? `local://${form.receiptName}` : null,
    })
    setModalOpen(false)
    setForm({ category: 'Salary', customCategory: '', description: '', amount: '', date: '', receiptName: '' })
    setToast('Expense added successfully')
  }

  return (
    <AdminLayout activePath="/admin/expenses" title="Expenses">
      <AdminToast message={toast} onClose={() => setToast(null)} />

      {/* Budget progress bar */}
      <div style={{ ...cardStyle, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4 }}>Monthly Budget</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY }}>
              AED {thisMonth.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500, color: TEXT_MUTED }}>/ {BUDGET_TOTAL.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>Remaining</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: budgetRemaining > 0 ? '#22c55e' : '#ef4444' }}>AED {budgetRemaining.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ height: 12, background: PAGE_BG, borderRadius: 40, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
          <div style={{
            height: '100%',
            borderRadius: 40,
            width: `${budgetUsed}%`,
            background: budgetUsed > 85 ? 'linear-gradient(90deg, #ef4444, #f97316)' : budgetUsed > 70 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : `linear-gradient(90deg, ${BRAND}, #ff6b6b)`,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: TEXT_MUTED }}>
          <span>{budgetUsed.toFixed(0)}% used</span>
          <span>Total all-time: AED {total.toLocaleString()}</span>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => setCategoryFilter('all')} style={pillFilter(categoryFilter === 'all')}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setCategoryFilter(c)} style={pillFilter(categoryFilter === c)}>{c}</button>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, padding: 24, flex: '1 1 300px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={{ stroke: TEXT_MUTED, strokeWidth: 1 }}
              >
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [`AED ${Number(value ?? 0).toLocaleString()}`, 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...cardStyle, padding: 24, flex: '2 1 400px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Monthly Expenses vs Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: TEXT_MUTED, fontSize: 12 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <YAxis tick={{ fill: TEXT_MUTED, fontSize: 12 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value, name) => [`AED ${Number(value ?? 0).toLocaleString()}`, name === 'expenses' ? 'Expenses' : 'Revenue']}
              />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} name="Expenses" dot={{ fill: '#ef4444', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2.5} name="Revenue" dot={{ fill: BRAND, strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense table */}
      <div className="admin-table-wrap" style={{ ...cardStyle, padding: 0, marginBottom: 80 }}>
        {filteredExpenses.length === 0 ? (
          <AdminEmptyState title="No expenses found" onClearFilters={categoryFilter !== 'all' ? () => setCategoryFilter('all') : undefined} onAdd={() => setModalOpen(true)} addLabel="+ Add Expense" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Category', 'Description', 'Amount', 'Date', 'Added by', 'Receipt'].map((h) => (
                  <th key={h} style={{ ...tableHeaderStyle, background: PAGE_BG }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((e) => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                  onMouseEnter={(ev) => { ev.currentTarget.style.background = PAGE_BG }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: 16 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: PAGE_BG, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>{e.category}</span>
                  </td>
                  <td style={{ padding: 16 }}>{e.description}</td>
                  <td style={{ padding: 16, fontWeight: 600 }}>AED {e.amount.toLocaleString()}</td>
                  <td style={{ padding: 16, color: TEXT_MUTED }}>{e.date}</td>
                  <td style={{ padding: 16, color: TEXT_SECONDARY }}>{e.addedBy}</td>
                  <td style={{ padding: 16 }}>{e.hasReceipt ? `📎 ${(e as AdminExpense & { receiptName?: string }).receiptName ?? 'Receipt'}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sticky floating Add Expense button */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
          ...primaryBtn,
          borderRadius: 40,
          padding: '14px 28px',
          fontSize: 15,
          boxShadow: '0 8px 32px rgba(249,62,66,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Expense
      </button>

      {modalOpen && (
        <>
          <div role="presentation" onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', ...cardStyle, padding: 32, maxWidth: 480, width: '90%', zIndex: 2001 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>Add Expense</h3>
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...selectStyle, width: '100%', marginBottom: 12 }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.category === 'Custom' && (
              <>
                <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Custom Category Name</label>
                <input value={form.customCategory} onChange={(e) => setForm({ ...form, customCategory: e.target.value })} placeholder="e.g. Legal Fees" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
              </>
            )}
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Amount (AED)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <label style={{ display: 'block', fontSize: 13, color: TEXT_SECONDARY, marginBottom: 4, fontWeight: 500 }}>Receipt (optional)</label>
            <input type="file" accept="image/*,.pdf" onChange={handleReceiptChange} style={{ ...inputStyle, width: '100%', marginBottom: 8, padding: 8 }} />
            {form.receiptName && <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '0 0 12px' }}>📎 {form.receiptName}</p>}
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
