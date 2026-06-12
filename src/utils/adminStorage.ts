export interface AdminNote {
  id: string
  date: string
  text: string
  createdAt: string
}

export interface AdminCalendarEvent {
  id: string
  date: string
  title: string
  time?: string
}

const NOTES_KEY = 'admin_notes'
const EVENTS_KEY = 'admin_calendar_events'
const WALLET_KEY = 'admin_wallet_balances'

export function loadNotes(): AdminNote[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (raw) return JSON.parse(raw) as AdminNote[]
  } catch { /* ignore */ }
  return [
    { id: '1', date: '2026-06-03', text: 'Follow up with Mohammed Ali — bank transfer overdue', createdAt: '2026-06-03T09:00:00' },
    { id: '2', date: '2026-06-05', text: 'Team standup — review Schengen applications', createdAt: '2026-06-02T14:00:00' },
  ]
}

export function saveNotes(notes: AdminNote[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

export function loadCalendarEvents(): AdminCalendarEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    if (raw) return JSON.parse(raw) as AdminCalendarEvent[]
  } catch { /* ignore */ }
  return [
    { id: '1', date: '2026-06-05', title: 'Embassy submission batch', time: '10:00' },
    { id: '2', date: '2026-06-12', title: 'B2B partner review call', time: '14:30' },
  ]
}

export function saveCalendarEvents(events: AdminCalendarEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

export function loadWalletBalances(): { b2b: number; b2c: number } {
  try {
    const raw = localStorage.getItem(WALLET_KEY)
    if (raw) return JSON.parse(raw) as { b2b: number; b2c: number }
  } catch { /* ignore */ }
  return { b2b: 12450, b2c: 8320 }
}

export function saveWalletBalances(balances: { b2b: number; b2c: number }) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(balances))
}

export function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch { /* ignore */ }
}
