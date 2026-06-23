export type LeadStatus =
  | 'New Application'
  | 'Contacted'
  | 'Qualified'
  | 'Payment Pending'
  | 'Docs Pending'
  | 'Under Review'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'
  | 'Closed'

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'OVERDUE' | 'REFUNDED'
export type PaymentStatus = 'Success' | 'Pending' | 'Failed' | 'Refunded'

export interface AdminLead {
  id: string
  name: string
  email: string
  passport: string
  passportCode: string
  destination: string
  destCode: string
  source: 'B2C' | 'B2B'
  status: LeadStatus
  assigned: string
  created: string
  visaType: string
  /** Links B2C website submission to customer dashboard */
  applicationId?: string
  invoiceNo?: string
  paymentMethod?: 'Card' | 'Bank Transfer'
  amount?: number
  documentsComplete?: boolean
  /** B2B partner who submitted this application */
  agentId?: string
  agentName?: string
  agentApplicationId?: string
  commissionAed?: number
  commissionPaid?: boolean
}

export interface AdminCustomer {
  id: string
  name: string
  email: string
  username: string
  password: string
  phone: string
  nationality: string
  applications: number
  totalSpent: number
  lastActive: string
  profileImage?: string
}

export interface AdminAgent {
  id: string
  name: string
  email: string
  username: string
  password: string
  leads: number
  revenue: number
  commission: number
  status: 'Active' | 'Inactive'
  profileImage?: string
  /** Partner wallet for commission-model payments */
  walletBalance?: number
}

export interface AdminInvoice {
  id: string
  invoiceNo: string
  customer: string
  destination: string
  amount: number
  govFee: number
  processingFee: number
  status: InvoiceStatus
  date: string
  dueDate: string
  countryCode: string
  paymentMethod: 'Card' | 'Bank Transfer'
}

export const MOCK_WALLET_BALANCES = {
  b2b: 12450,
  b2c: 8320,
}

export interface AdminPayment {
  id: string
  txnId: string
  customer: string
  amount: number
  method: 'Card' | 'Bank Transfer' | 'Wallet'
  methodDetail: string
  gateway: 'Stripe' | 'Bank'
  status: PaymentStatus
  date: string
  invoiceNo: string
}

export interface AdminExpense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  addedBy: string
  hasReceipt: boolean
  receiptName?: string
}

export interface AdminActivity {
  id: string
  type: 'approved' | 'rejected' | 'lead' | 'payment' | 'doc' | 'agent'
  text: string
  time: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  username: string
  password?: string
  role: string
  status: 'Active' | 'Inactive'
  created: string
  lastLogin: string
}

export interface AdminCase {
  id: string
  customer: string
  destination: string
  status: LeadStatus
  assigned: string
  created: string
  passportCode: string
}

export const LEAD_STATUSES: LeadStatus[] = [
  'New Application',
  'Contacted',
  'Qualified',
  'Payment Pending',
  'Docs Pending',
  'Under Review',
  'Submitted',
  'Approved',
  'Rejected',
  'Closed',
]

export const PIPELINE_STAGES = [
  { stage: 'New Application', count: 284, width: '100%', color: '#5057ea' },
  { stage: 'Contacted', count: 210, width: '74%', color: '#6366f1' },
  { stage: 'Qualified', count: 156, width: '55%', color: '#f59e0b' },
  { stage: 'Payment Pending', count: 89, width: '31%', color: '#f97316' },
  { stage: 'Docs Pending', count: 67, width: '24%', color: '#ef4444' },
  { stage: 'Under Review', count: 54, width: '19%', color: '#ec4899' },
  { stage: 'Submitted', count: 47, width: '17%', color: '#8b5cf6' },
  { stage: 'Approved', count: 198, width: '70%', color: '#22c55e' },
]

export const REVENUE_CHART_DATA = [
  { month: 'Jan', revenue: 28000, target: 25000 },
  { month: 'Feb', revenue: 31000, target: 30000 },
  { month: 'Mar', revenue: 25000, target: 32000 },
  { month: 'Apr', revenue: 42000, target: 35000 },
  { month: 'May', revenue: 38500, target: 38000 },
  { month: 'Jun', revenue: 15000, target: 40000 },
]

export const DESTINATION_DEMAND = [
  { country: 'Schengen', applications: 89, flag: '🇪🇺' },
  { country: 'UK', applications: 67, flag: '🇬🇧' },
  { country: 'USA', applications: 54, flag: '🇺🇸' },
  { country: 'Canada', applications: 43, flag: '🇨🇦' },
  { country: 'Australia', applications: 38, flag: '🇦🇺' },
  { country: 'Kenya', applications: 31, flag: '🇰🇪' },
  { country: 'UAE', applications: 28, flag: '🇦🇪' },
]

export const MOCK_LEADS: AdminLead[] = [
  { id: '1', name: 'Ahmed Hassan', email: 'ahmed.h@email.com', passport: 'India', passportCode: 'in', destination: 'Kenya', destCode: 'ke', source: 'B2C', status: 'Docs Pending', assigned: 'Sara M.', created: '5 min ago', visaType: 'e-Visa' },
  { id: '2', name: 'Priya Sharma', email: 'priya.s@email.com', passport: 'India', passportCode: 'in', destination: 'UK', destCode: 'gb', source: 'B2C', status: 'Under Review', assigned: 'John D.', created: '23 min ago', visaType: 'Sticker' },
  { id: '3', name: 'Mohammed Ali', email: 'm.ali@email.com', passport: 'Pakistan', passportCode: 'pk', destination: 'Schengen', destCode: 'fr', source: 'B2B', status: 'New Application', assigned: 'Unassigned', created: '1 hr ago', visaType: 'Schengen' },
  { id: '4', name: 'Sarah Johnson', email: 'sarah.j@email.com', passport: 'USA', passportCode: 'us', destination: 'USA', destCode: 'us', source: 'B2C', status: 'Payment Pending', assigned: 'Sara M.', created: '2 hr ago', visaType: 'B1/B2' },
  { id: '5', name: 'Ravi Kumar', email: 'ravi.k@email.com', passport: 'India', passportCode: 'in', destination: 'Canada', destCode: 'ca', source: 'B2C', status: 'Approved', assigned: 'John D.', created: '3 hr ago', visaType: 'Visitor' },
  { id: '6', name: 'Fatima Al Mansouri', email: 'fatima@email.com', passport: 'UAE', passportCode: 'ae', destination: 'Schengen', destCode: 'fr', source: 'B2C', status: 'New Application', assigned: 'Unassigned', created: '8 min ago', visaType: 'Tourist' },
  { id: '7', name: 'James Wilson', email: 'j.wilson@email.com', passport: 'UK', passportCode: 'gb', destination: 'Australia', destCode: 'au', source: 'B2B', status: 'Qualified', assigned: 'Ahmed K.', created: '4 hr ago', visaType: 'Visitor' },
  { id: '8', name: 'Lina Farouk', email: 'lina.f@email.com', passport: 'Egypt', passportCode: 'eg', destination: 'Thailand', destCode: 'th', source: 'B2C', status: 'Contacted', assigned: 'Sara M.', created: '5 hr ago', visaType: 'e-Visa' },
  { id: '9', name: 'Chen Wei', email: 'chen.w@email.com', passport: 'China', passportCode: 'cn', destination: 'UK', destCode: 'gb', source: 'B2C', status: 'Submitted', assigned: 'John D.', created: '6 hr ago', visaType: 'Student' },
  { id: '10', name: 'Omar Siddiqui', email: 'omar.s@email.com', passport: 'Bangladesh', passportCode: 'bd', destination: 'Malaysia', destCode: 'my', source: 'B2B', status: 'Approved', assigned: 'Ahmed K.', created: '1 day ago', visaType: 'e-Visa' },
  { id: '11', name: 'Emily Brown', email: 'emily.b@email.com', passport: 'USA', passportCode: 'us', destination: 'Kenya', destCode: 'ke', source: 'B2C', status: 'Rejected', assigned: 'Sara M.', created: '1 day ago', visaType: 'e-Visa' },
  { id: '12', name: 'Hassan Malik', email: 'h.malik@email.com', passport: 'Pakistan', passportCode: 'pk', destination: 'Canada', destCode: 'ca', source: 'B2C', status: 'Payment Pending', assigned: 'John D.', created: '2 days ago', visaType: 'Visitor' },
  { id: '13', name: 'Nadia Petrova', email: 'nadia.p@email.com', passport: 'Russia', passportCode: 'ru', destination: 'UAE', destCode: 'ae', source: 'B2C', status: 'Docs Pending', assigned: 'Ahmed K.', created: '2 days ago', visaType: 'Tourist' },
  { id: '14', name: 'Kevin Okafor', email: 'kevin.o@email.com', passport: 'Nigeria', passportCode: 'ng', destination: 'UK', destCode: 'gb', source: 'B2B', status: 'Under Review', assigned: 'Sara M.', created: '3 days ago', visaType: 'Visitor' },
  { id: '15', name: 'Maria Santos', email: 'maria.s@email.com', passport: 'Philippines', passportCode: 'ph', destination: 'Singapore', destCode: 'sg', source: 'B2C', status: 'Approved', assigned: 'John D.', created: '3 days ago', visaType: 'e-Visa' },
  { id: '16', name: 'Yuki Tanaka', email: 'yuki.t@email.com', passport: 'Japan', passportCode: 'jp', destination: 'France', destCode: 'fr', source: 'B2C', status: 'Closed', assigned: 'Ahmed K.', created: '4 days ago', visaType: 'Tourist' },
  { id: '17', name: 'David Miller', email: 'david.m@email.com', passport: 'Australia', passportCode: 'au', destination: 'USA', destCode: 'us', source: 'B2C', status: 'Qualified', assigned: 'Sara M.', created: '4 days ago', visaType: 'B1/B2' },
  { id: '18', name: 'Aisha Rahman', email: 'aisha.r@email.com', passport: 'India', passportCode: 'in', destination: 'Egypt', destCode: 'eg', source: 'B2B', status: 'Contacted', assigned: 'John D.', created: '5 days ago', visaType: 'e-Visa' },
  { id: '19', name: 'Tom Becker', email: 'tom.b@email.com', passport: 'Germany', passportCode: 'de', destination: 'Kenya', destCode: 'ke', source: 'B2C', status: 'New Application', assigned: 'Unassigned', created: '5 days ago', visaType: 'e-Visa' },
  { id: '20', name: 'Sofia Costa', email: 'sofia.c@email.com', passport: 'Brazil', passportCode: 'br', destination: 'UK', destCode: 'gb', source: 'B2C', status: 'Submitted', assigned: 'Ahmed K.', created: '6 days ago', visaType: 'Visitor' },
]

export const MOCK_CUSTOMERS: AdminCustomer[] = [
  { id: '1', name: 'Ahmed Hassan', email: 'ahmed.h@email.com', username: 'ahmedhassan', password: 'B2C@Ah3xK9', phone: '+971 50 123 4567', nationality: 'India', applications: 3, totalSpent: 1386, lastActive: '2 min ago' },
  { id: '2', name: 'Priya Sharma', email: 'priya.s@email.com', username: 'priyasharma', password: 'B2C@Ps7mN2', phone: '+971 55 234 5678', nationality: 'India', applications: 2, totalSpent: 924, lastActive: '1 hr ago' },
  { id: '3', name: 'Mohammed Ali', email: 'm.ali@email.com', username: 'mohammedali', password: 'B2C@Ma5pQ8', phone: '+971 52 345 6789', nationality: 'Pakistan', applications: 1, totalSpent: 462, lastActive: '3 hr ago' },
  { id: '4', name: 'Sarah Johnson', email: 'sarah.j@email.com', username: 'sarahjohnson', password: 'B2C@Sj4rT1', phone: '+971 56 456 7890', nationality: 'USA', applications: 4, totalSpent: 2100, lastActive: '5 hr ago' },
  { id: '5', name: 'Ravi Kumar', email: 'ravi.k@email.com', username: 'ravikumar', password: 'B2C@Rk6wU3', phone: '+971 54 567 8901', nationality: 'India', applications: 2, totalSpent: 843, lastActive: '1 day ago' },
  { id: '6', name: 'Fatima Al Mansouri', email: 'fatima@email.com', username: 'fatima_m', password: 'B2C@Fm8yV5', phone: '+971 50 678 9012', nationality: 'UAE', applications: 1, totalSpent: 385, lastActive: '2 days ago' },
  { id: '7', name: 'James Wilson', email: 'j.wilson@email.com', username: 'jameswilson', password: 'B2C@Jw2zA7', phone: '+971 55 789 0123', nationality: 'UK', applications: 3, totalSpent: 1575, lastActive: '2 days ago' },
  { id: '8', name: 'Lina Farouk', email: 'lina.f@email.com', username: 'linafarouk', password: 'B2C@Lf9bC4', phone: '+971 52 890 1234', nationality: 'Egypt', applications: 1, totalSpent: 320, lastActive: '3 days ago' },
  { id: '9', name: 'Chen Wei', email: 'chen.w@email.com', username: 'chenwei', password: 'B2C@Cw1dE6', phone: '+971 56 901 2345', nationality: 'China', applications: 2, totalSpent: 1100, lastActive: '4 days ago' },
  { id: '10', name: 'Omar Siddiqui', email: 'omar.s@email.com', username: 'omarsiddiqui', password: 'B2C@Os3fG8', phone: '+971 54 012 3456', nationality: 'Bangladesh', applications: 1, totalSpent: 275, lastActive: '5 days ago' },
  { id: '11', name: 'Emily Brown', email: 'emily.b@email.com', username: 'emilybrown', password: 'B2C@Eb5hJ2', phone: '+971 50 123 7890', nationality: 'USA', applications: 2, totalSpent: 650, lastActive: '1 week ago' },
  { id: '12', name: 'Hassan Malik', email: 'h.malik@email.com', username: 'hassanmalik', password: 'B2C@Hm7kL9', phone: '+971 55 234 8901', nationality: 'Pakistan', applications: 1, totalSpent: 520, lastActive: '1 week ago' },
  { id: '13', name: 'Nadia Petrova', email: 'nadia.p@email.com', username: 'nadiapetrova', password: 'B2C@Np4mN1', phone: '+971 52 345 9012', nationality: 'Russia', applications: 1, totalSpent: 410, lastActive: '2 weeks ago' },
  { id: '14', name: 'Kevin Okafor', email: 'kevin.o@email.com', username: 'kevinokafor', password: 'B2C@Ko6pQ3', phone: '+971 56 456 0123', nationality: 'Nigeria', applications: 2, totalSpent: 890, lastActive: '2 weeks ago' },
  { id: '15', name: 'Maria Santos', email: 'maria.s@email.com', username: 'mariasantos', password: 'B2C@Ms8rS5', phone: '+971 54 567 1234', nationality: 'Philippines', applications: 3, totalSpent: 1200, lastActive: '3 weeks ago' },
]

export const MOCK_AGENTS: AdminAgent[] = [
  { id: '1', name: 'Mohammed Travel', email: 'info@mohammedtravel.ae', username: 'mohammedtravel', password: 'B2B@Mt24xK', leads: 24, revenue: 8400, commission: 840, status: 'Active' },
  { id: '2', name: 'Al Faris Agency', email: 'contact@alfaris.ae', username: 'alfaris_agency', password: 'B2B@Af18mP', leads: 18, revenue: 6300, commission: 630, status: 'Active' },
  { id: '3', name: 'Gulf Visa Center', email: 'hello@gulfvisa.ae', username: 'gulfvisa', password: 'B2B@Gv15nQ', leads: 15, revenue: 5250, commission: 525, status: 'Active' },
  { id: '4', name: 'Dubai Travel Co.', email: 'sales@dubaitravel.ae', username: 'dubaitravel', password: 'B2B@Dt12wR', leads: 12, revenue: 4200, commission: 420, status: 'Active' },
  { id: '5', name: 'Emirates Visa Hub', email: 'support@evhub.ae', username: 'evhub_uae', password: 'B2B@Ev10yS', leads: 10, revenue: 3500, commission: 350, status: 'Active' },
  { id: '6', name: 'Global Pathways', email: 'info@globalpath.ae', username: 'globalpath', password: 'B2B@Gp08zT', leads: 8, revenue: 2800, commission: 280, status: 'Inactive' },
  { id: '7', name: 'Visa Express UAE', email: 'team@visaexpress.ae', username: 'visaexpress', password: 'B2B@Vx07aU', leads: 7, revenue: 2450, commission: 245, status: 'Active' },
  { id: '8', name: 'Horizon Travels', email: 'book@horizon.ae', username: 'horizon_ae', password: 'B2B@Hz05bV', leads: 5, revenue: 1750, commission: 175, status: 'Active' },
]

export const MOCK_INVOICES: AdminInvoice[] = [
  { id: '1', invoiceNo: 'ATL48291034', customer: 'Ahmed Hassan', destination: 'Kenya', amount: 462, govFee: 289, processingFee: 173, status: 'PAID', date: '2026-06-03', dueDate: '2026-06-03', countryCode: 'ke', paymentMethod: 'Card' },
  { id: '2', invoiceNo: 'ATL48291035', customer: 'Priya Sharma', destination: 'UK', amount: 843, govFee: 520, processingFee: 323, status: 'UNPAID', date: '2026-06-02', dueDate: '2026-06-02', countryCode: 'gb', paymentMethod: 'Card' },
  { id: '3', invoiceNo: 'ATL48291036', customer: 'Mohammed Ali', destination: 'Schengen', amount: 520, govFee: 347, processingFee: 173, status: 'UNPAID', date: '2026-05-28', dueDate: '2026-05-30', countryCode: 'fr', paymentMethod: 'Bank Transfer' },
  { id: '4', invoiceNo: 'ATL48291037', customer: 'Sarah Johnson', destination: 'USA', amount: 1200, govFee: 800, processingFee: 400, status: 'PAID', date: '2026-06-01', dueDate: '2026-06-01', countryCode: 'us', paymentMethod: 'Card' },
  { id: '5', invoiceNo: 'ATL48291038', customer: 'Ravi Kumar', destination: 'Canada', amount: 650, govFee: 400, processingFee: 250, status: 'PAID', date: '2026-05-30', dueDate: '2026-05-30', countryCode: 'ca', paymentMethod: 'Bank Transfer' },
  { id: '6', invoiceNo: 'ATL48291039', customer: 'Fatima Al Mansouri', destination: 'Schengen', amount: 385, govFee: 250, processingFee: 135, status: 'UNPAID', date: '2026-05-29', dueDate: '2026-06-05', countryCode: 'fr', paymentMethod: 'Card' },
  { id: '7', invoiceNo: 'ATL48291040', customer: 'James Wilson', destination: 'Australia', amount: 720, govFee: 450, processingFee: 270, status: 'PAID', date: '2026-05-27', dueDate: '2026-05-27', countryCode: 'au', paymentMethod: 'Card' },
  { id: '8', invoiceNo: 'ATL48291041', customer: 'Lina Farouk', destination: 'Thailand', amount: 275, govFee: 150, processingFee: 125, status: 'REFUNDED', date: '2026-05-25', dueDate: '2026-05-25', countryCode: 'th', paymentMethod: 'Card' },
  { id: '9', invoiceNo: 'ATL48291042', customer: 'Chen Wei', destination: 'UK', amount: 890, govFee: 550, processingFee: 340, status: 'UNPAID', date: '2026-05-22', dueDate: '2026-05-25', countryCode: 'gb', paymentMethod: 'Bank Transfer' },
  { id: '10', invoiceNo: 'ATL48291043', customer: 'Omar Siddiqui', destination: 'Malaysia', amount: 310, govFee: 180, processingFee: 130, status: 'PAID', date: '2026-05-20', dueDate: '2026-05-20', countryCode: 'my', paymentMethod: 'Bank Transfer' },
  { id: '11', invoiceNo: 'ATL48291044', customer: 'Emily Brown', destination: 'Kenya', amount: 462, govFee: 289, processingFee: 173, status: 'UNPAID', date: '2026-05-18', dueDate: '2026-06-10', countryCode: 'ke', paymentMethod: 'Card' },
  { id: '12', invoiceNo: 'ATL48291045', customer: 'Hassan Malik', destination: 'Canada', amount: 680, govFee: 420, processingFee: 260, status: 'PAID', date: '2026-05-15', dueDate: '2026-05-15', countryCode: 'ca', paymentMethod: 'Card' },
  { id: '13', invoiceNo: 'ATL48291046', customer: 'Nadia Petrova', destination: 'UAE', amount: 350, govFee: 200, processingFee: 150, status: 'UNPAID', date: '2026-05-12', dueDate: '2026-05-20', countryCode: 'ae', paymentMethod: 'Bank Transfer' },
  { id: '14', invoiceNo: 'ATL48291047', customer: 'Kevin Okafor', destination: 'UK', amount: 920, govFee: 580, processingFee: 340, status: 'PAID', date: '2026-05-10', dueDate: '2026-05-10', countryCode: 'gb', paymentMethod: 'Card' },
  { id: '15', invoiceNo: 'ATL48291048', customer: 'Maria Santos', destination: 'Singapore', amount: 295, govFee: 165, processingFee: 130, status: 'UNPAID', date: '2026-05-08', dueDate: '2026-06-08', countryCode: 'sg', paymentMethod: 'Card' },
]

export const MOCK_PAYMENTS: AdminPayment[] = [
  { id: '1', txnId: 'TXN84729103', customer: 'Ahmed Hassan', amount: 462, method: 'Card', methodDetail: 'Visa ****4242', gateway: 'Stripe', status: 'Success', date: '2026-06-03 11:51', invoiceNo: 'ATL48291034' },
  { id: '2', txnId: 'TXN84729104', customer: 'Sarah Johnson', amount: 1200, method: 'Card', methodDetail: 'Mastercard ****8812', gateway: 'Stripe', status: 'Success', date: '2026-06-01 14:22', invoiceNo: 'ATL48291037' },
  { id: '3', txnId: 'TXN84729105', customer: 'Ravi Kumar', amount: 650, method: 'Bank Transfer', methodDetail: 'Bank Transfer', gateway: 'Bank', status: 'Success', date: '2026-05-30 09:15', invoiceNo: 'ATL48291038' },
  { id: '4', txnId: 'TXN84729106', customer: 'Priya Sharma', amount: 843, method: 'Card', methodDetail: 'Visa ****4242', gateway: 'Stripe', status: 'Pending', date: '2026-06-02 16:40', invoiceNo: 'ATL48291035' },
  { id: '5', txnId: 'TXN84729107', customer: 'Mohammed Ali', amount: 520, method: 'Card', methodDetail: 'Amex ****1005', gateway: 'Stripe', status: 'Failed', date: '2026-05-28 10:05', invoiceNo: 'ATL48291036' },
  { id: '6', txnId: 'TXN84729108', customer: 'Lina Farouk', amount: 275, method: 'Card', methodDetail: 'Visa ****4242', gateway: 'Stripe', status: 'Refunded', date: '2026-05-25 13:30', invoiceNo: 'ATL48291041' },
  { id: '7', txnId: 'TXN84729109', customer: 'James Wilson', amount: 720, method: 'Wallet', methodDetail: 'Wallet Balance', gateway: 'Bank', status: 'Success', date: '2026-05-27 11:00', invoiceNo: 'ATL48291040' },
  { id: '8', txnId: 'TXN84729110', customer: 'Omar Siddiqui', amount: 310, method: 'Bank Transfer', methodDetail: 'Bank Transfer', gateway: 'Bank', status: 'Success', date: '2026-05-20 15:45', invoiceNo: 'ATL48291043' },
  { id: '9', txnId: 'TXN84729111', customer: 'Hassan Malik', amount: 680, method: 'Card', methodDetail: 'Visa ****4242', gateway: 'Stripe', status: 'Success', date: '2026-05-15 08:20', invoiceNo: 'ATL48291045' },
  { id: '10', txnId: 'TXN84729112', customer: 'Kevin Okafor', amount: 920, method: 'Card', methodDetail: 'Mastercard ****3321', gateway: 'Stripe', status: 'Success', date: '2026-05-10 17:55', invoiceNo: 'ATL48291047' },
  { id: '11', txnId: 'TXN84729113', customer: 'Fatima Al Mansouri', amount: 385, method: 'Card', methodDetail: 'Visa ****4242', gateway: 'Stripe', status: 'Pending', date: '2026-05-29 12:10', invoiceNo: 'ATL48291039' },
  { id: '12', txnId: 'TXN84729114', customer: 'Emily Brown', amount: 462, method: 'Bank Transfer', methodDetail: 'Bank Transfer', gateway: 'Bank', status: 'Pending', date: '2026-05-18 09:30', invoiceNo: 'ATL48291044' },
  { id: '13', txnId: 'TXN84729115', customer: 'Chen Wei', amount: 890, method: 'Card', methodDetail: 'Visa ****4242', gateway: 'Stripe', status: 'Failed', date: '2026-05-22 14:00', invoiceNo: 'ATL48291042' },
  { id: '14', txnId: 'TXN84729116', customer: 'Nadia Petrova', amount: 350, method: 'Card', methodDetail: 'Visa ****4242', gateway: 'Stripe', status: 'Pending', date: '2026-05-12 11:25', invoiceNo: 'ATL48291046' },
  { id: '15', txnId: 'TXN84729117', customer: 'Maria Santos', amount: 295, method: 'Wallet', methodDetail: 'Wallet Balance', gateway: 'Bank', status: 'Success', date: '2026-05-08 16:50', invoiceNo: 'ATL48291048' },
]

export const MOCK_EXPENSES: AdminExpense[] = [
  { id: '1', category: 'Salary', description: 'Operations team payroll — June', amount: 45000, date: '2026-06-01', addedBy: 'Super Admin', hasReceipt: true },
  { id: '2', category: 'Office Rent', description: 'Dubai office — June 2026', amount: 12000, date: '2026-06-01', addedBy: 'Super Admin', hasReceipt: true },
  { id: '3', category: 'Software', description: 'Stripe + Resend + AWS', amount: 2800, date: '2026-05-28', addedBy: 'Super Admin', hasReceipt: true },
  { id: '4', category: 'Marketing', description: 'Google Ads — May campaign', amount: 5500, date: '2026-05-25', addedBy: 'Sara M.', hasReceipt: true },
  { id: '5', category: 'Travel', description: 'Embassy visit — Abu Dhabi', amount: 850, date: '2026-05-20', addedBy: 'John D.', hasReceipt: true },
  { id: '6', category: 'Software', description: 'Sherpa API sandbox', amount: 1200, date: '2026-05-15', addedBy: 'Super Admin', hasReceipt: false },
  { id: '7', category: 'Other', description: 'Office supplies', amount: 420, date: '2026-05-10', addedBy: 'Ahmed K.', hasReceipt: true },
  { id: '8', category: 'Marketing', description: 'Social media ads', amount: 3200, date: '2026-05-05', addedBy: 'Sara M.', hasReceipt: true },
  { id: '9', category: 'Salary', description: 'Partner commission payout', amount: 8400, date: '2026-05-01', addedBy: 'Super Admin', hasReceipt: true },
  { id: '10', category: 'Office Rent', description: 'Dubai office — May 2026', amount: 12000, date: '2026-05-01', addedBy: 'Super Admin', hasReceipt: true },
]

export const MOCK_ACTIVITIES: AdminActivity[] = [
  { id: '1', type: 'approved', text: 'Visa approved — Ahmed Hassan (Kenya)', time: '2 min ago' },
  { id: '2', type: 'lead', text: 'New application — Fatima Al Mansouri (Schengen)', time: '8 min ago' },
  { id: '3', type: 'payment', text: 'Payment received AED 462 — Ravi Kumar', time: '15 min ago' },
  { id: '4', type: 'rejected', text: 'Document rejected — passport unclear — Priya Sharma', time: '32 min ago' },
  { id: '5', type: 'agent', text: 'New B2B partner registered — Dubai Travel Co.', time: '1 hr ago' },
  { id: '6', type: 'approved', text: 'Visa approved — Sarah Johnson (USA)', time: '2 hr ago' },
  { id: '7', type: 'payment', text: 'Payment received AED 843 — Mohammed Ali', time: '3 hr ago' },
  { id: '8', type: 'doc', text: 'Documents uploaded — Chen Wei (UK)', time: '4 hr ago' },
  { id: '9', type: 'lead', text: 'New application — Tom Becker (Kenya)', time: '5 hr ago' },
  { id: '10', type: 'approved', text: 'Visa approved — Maria Santos (Singapore)', time: '6 hr ago' },
]

export const MOCK_USERS: AdminUser[] = [
  { id: '1', name: 'Super Admin', email: 'admin@superjetglobal.com', username: 'superadmin', password: 'demoadminsjt', role: 'Admin', status: 'Active', created: '2025-01-15', lastLogin: '2026-06-03' },
  { id: '2', name: 'Sara Malik', email: 'sara@superjetglobal.com', username: 'sara042', password: 'sara042', role: 'Operations', status: 'Active', created: '2025-03-20', lastLogin: '2026-06-02' },
  { id: '3', name: 'John Davidson', email: 'john@superjetglobal.com', username: 'john187', password: 'john187', role: 'Operations', status: 'Active', created: '2025-04-10', lastLogin: '2026-06-01' },
  { id: '4', name: 'Ahmed Khan', email: 'ahmed@superjetglobal.com', username: 'ahmed329', password: 'ahmed329', role: 'Operations', status: 'Inactive', created: '2025-06-05', lastLogin: '2026-05-15' },
]

export const MOCK_CASES: AdminCase[] = MOCK_LEADS.slice(0, 10).map((l) => ({
  id: l.id,
  customer: l.name,
  destination: l.destination,
  status: l.status,
  assigned: l.assigned,
  created: l.created,
  passportCode: l.passportCode,
}))

export const PENDING_ACTIONS = [
  { issue: 'Passport expired', customer: 'Ahmed H.', destination: 'Kenya' },
  { issue: 'Missing bank statement', customer: 'Priya S.', destination: 'UK' },
  { issue: 'Payment overdue 3 days', customer: 'Mohammed A.', destination: 'Schengen' },
  { issue: 'Interview date approaching', customer: 'Sarah J.', destination: 'USA' },
  { issue: 'Documents rejected by embassy', customer: 'Ravi K.', destination: 'Canada' },
]

export function getStatusColor(status: LeadStatus): { bg: string; color: string; border: string } {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    'New Application': { bg: '#f8f9fc', color: '#6b7280', border: '#e5e7eb' },
    Contacted: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
    Qualified: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    'Payment Pending': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    'Docs Pending': { bg: '#fefce8', color: '#a16207', border: '#fde68a' },
    'Under Review': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    Submitted: { bg: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
    Approved: { bg: '#f0fff4', color: '#15803d', border: '#bbf7d0' },
    Rejected: { bg: '#fff0f0', color: '#b91c1c', border: '#fca5a5' },
    Closed: { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' },
  }
  return map[status] ?? { bg: '#f8f9fc', color: '#6b7280', border: '#e5e7eb' }
}

export function getInvoiceStatusStyle(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, { bg: string; color: string; border: string }> = {
    PAID: { bg: '#f0fff4', color: '#16a34a', border: '#bbf7d0' },
    UNPAID: { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
    OVERDUE: { bg: '#fff0f0', color: '#b91c1c', border: '#fca5a5' },
    REFUNDED: { bg: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
  }
  return map[status]
}

export const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f93e42, #ff6b6b)',
  'linear-gradient(135deg, #5057ea, #818cf8)',
  'linear-gradient(135deg, #22c55e, #86efac)',
  'linear-gradient(135deg, #f59e0b, #fcd34d)',
  'linear-gradient(135deg, #8b5cf6, #c4b5fd)',
  'linear-gradient(135deg, #ec4899, #f9a8d4)',
  'linear-gradient(135deg, #06b6d4, #67e8f9)',
]

export function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function getAvatarGradient(name: string): string {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length]
}

export function getUniqueDestinations(leads: AdminLead[]): string[] {
  return [...new Set(leads.map((l) => l.destination))].sort()
}
