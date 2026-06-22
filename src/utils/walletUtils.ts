export function getWalletHealthStyle(balance: number): { background: string; color: string; label: string } {
  if (balance > 1000) return { background: '#f0fff4', color: '#166534', label: 'Healthy' }
  if (balance >= 500) return { background: '#fff8e1', color: '#92400e', label: 'Low' }
  return { background: '#fff0f0', color: '#b91c1c', label: 'Critical' }
}

export type WalletTxn = {
  id?: unknown
  type?: unknown
  amount?: unknown
  note?: unknown
  balanceAfter?: unknown
  createdAt?: unknown
  applicationId?: unknown
}

export function downloadWalletStatement(
  transactions: WalletTxn[],
  filename: string,
) {
  const header = ['Date', 'Type', 'Description', 'Amount', 'Balance After']
  const rows = transactions.map((t) => [
    String(t.createdAt ?? '').slice(0, 19).replace('T', ' '),
    String(t.type ?? ''),
    String(t.note ?? '').replace(/,/g, ';'),
    String(t.amount ?? 0),
    String(t.balanceAfter ?? 0),
  ])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function getWalletChartData(transactions: WalletTxn[], days = 30) {
  const map: Record<string, { credits: number; debits: number }> = {}
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map[key] = { credits: 0, debits: 0 }
  }
  transactions.forEach((t) => {
    const key = String(t.createdAt ?? '').slice(0, 10)
    if (!map[key]) return
    const amt = Number(t.amount ?? 0)
    if (String(t.type) === 'credit') map[key].credits += amt
    else map[key].debits += amt
  })
  return Object.entries(map).map(([date, v]) => ({
    date: date.slice(5),
    credits: v.credits,
    debits: v.debits,
  }))
}
