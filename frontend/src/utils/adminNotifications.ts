import { Database } from '../database/db'

export const ADMIN_NOTIFICATION_USER_ID = 'admin'
export const SUPPORT_WHATSAPP = '971559641020'

export type AdminNotificationCategory =
  | 'b2c_application'
  | 'b2b_application'
  | 'contact_inquiry'
  | 'visa_checker_inquiry'
  | 'b2c_user_registered'
  | 'b2b_partner_registered'

export function formatNotificationTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function buildSupportWhatsAppUrl(message: string, phone?: string): string {
  const base = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`
  return base
}

export function notifyAdminB2CApplication(params: {
  applicationId: string
  customerName: string
  destination: string
  amountPending: number
  paymentStatus: 'paid' | 'pending'
  paymentMethod: string
  customerPhone?: string
}) {
  const amountLine =
    params.paymentStatus === 'paid'
      ? `Payment received via ${params.paymentMethod}.`
      : `Amount pending: AED ${params.amountPending.toLocaleString()} (${params.paymentMethod}).`

  const message = `${params.customerName} submitted a B2C visa application for ${params.destination}. ${amountLine} Application ref: ${params.applicationId}.`

  const whatsappMessage = `Hello ${params.customerName}, this is Superjet Global support. We received your ${params.destination} visa application (Ref: ${params.applicationId}). ${
    params.paymentStatus === 'pending'
      ? `Amount pending: AED ${params.amountPending.toLocaleString()}. Please complete payment or reply here for help.`
      : 'Your payment is confirmed. We will update you on progress.'
  }`

  return Database.createAdminNotification({
    category: 'b2c_application',
    title: params.paymentStatus === 'paid' ? 'New B2C visa application' : 'New B2C application — payment pending',
    message,
    applicationId: params.applicationId,
    amountPending: params.paymentStatus === 'pending' ? params.amountPending : 0,
    paymentStatus: params.paymentStatus,
    whatsappMessage,
    linkPath: `/admin/cases/${params.applicationId}`,
    customerName: params.customerName,
    destination: params.destination,
  })
}

export function notifyAdminB2BApplication(params: {
  applicationId: string
  partnerName: string
  customerName: string
  destination: string
  amount: number
  paymentStatus: 'paid' | 'pending'
  paymentMethod: string
}) {
  const amountLine =
    params.paymentStatus === 'paid'
      ? `Paid via ${params.paymentMethod} — AED ${params.amount.toLocaleString()}.`
      : `Amount pending: AED ${params.amount.toLocaleString()} (${params.paymentMethod}).`

  const message = `B2B partner ${params.partnerName} applied for ${params.destination} visa (customer: ${params.customerName}). ${amountLine} Ref: ${params.applicationId}.`

  const whatsappMessage = `Hello ${params.partnerName} team, Superjet Global ops here. We received your B2B application for ${params.customerName} — ${params.destination} visa (Ref: ${params.applicationId}). ${
    params.paymentStatus === 'pending'
      ? `Pending amount: AED ${params.amount.toLocaleString()}. Reply here if you need assistance.`
      : 'Payment confirmed. Application is under review.'
  }`

  return Database.createAdminNotification({
    category: 'b2b_application',
    title: params.paymentStatus === 'paid' ? 'New B2B agent application' : 'New B2B application — payment pending',
    message,
    applicationId: params.applicationId,
    amountPending: params.paymentStatus === 'pending' ? params.amount : 0,
    paymentStatus: params.paymentStatus,
    whatsappMessage,
    linkPath: `/admin/cases/${params.applicationId}`,
    partnerName: params.partnerName,
    customerName: params.customerName,
    destination: params.destination,
  })
}

export function notifyAdminContactInquiry(params: {
  fullName: string
  email: string
  phone?: string
  subject: string
  message: string
}) {
  const preview = params.message.length > 120 ? `${params.message.slice(0, 120)}…` : params.message
  const body = `${params.fullName} (${params.email}${params.phone ? `, ${params.phone}` : ''}) asked: "${params.subject}". Message: ${preview}`

  const whatsappMessage = params.phone
    ? `Hello ${params.fullName}, thank you for contacting Superjet Global about "${params.subject}". How can we help you today?`
    : `Hello ${params.fullName}, thank you for contacting Superjet Global about "${params.subject}". We received your message and will assist you shortly.`

  return Database.createAdminNotification({
    category: 'contact_inquiry',
    title: 'New support message',
    message: body,
    whatsappMessage,
    linkPath: '/admin/leads',
    customerName: params.fullName,
    customerEmail: params.email,
    customerPhone: params.phone,
    inquirySubject: params.subject,
  })
}

export function notifyAdminNewUser(params: {
  userId: string
  fullName: string
  email: string
  phone?: string
  source?: 'sign_in' | 'application'
}) {
  const displayName = params.fullName.trim() || params.email
  const sourceLabel = params.source === 'application' ? 'during visa application' : 'via sign-in'
  const message = `New B2C user registered ${sourceLabel}: ${displayName} (${params.email}${params.phone ? `, ${params.phone}` : ''}). User ID: ${params.userId}.`

  const whatsappMessage = params.phone
    ? `Hello ${displayName}, welcome to Superjet Global! Your account is ready. Reply here if you need help with visa applications.`
    : `Hello ${displayName}, welcome to Superjet Global! Your account (${params.email}) is now active. Contact us here for visa support.`

  return Database.createAdminNotification({
    category: 'b2c_user_registered',
    title: 'New B2C user registered',
    message,
    whatsappMessage,
    linkPath: '/admin/customers',
    customerName: displayName,
    customerEmail: params.email,
    customerPhone: params.phone,
    userId: params.userId,
  })
}

export function notifyAdminNewPartner(params: {
  partnerId: string
  companyName: string
  contactPerson: string
  email: string
  phone?: string
  status?: 'pending' | 'active'
}) {
  const statusLine =
    params.status === 'active' ? 'Status: active.' : 'Status: pending approval — review required.'
  const message = `New B2B partner registered: ${params.companyName} (${params.contactPerson}). Email: ${params.email}${params.phone ? `, Phone: ${params.phone}` : ''}. ${statusLine} Partner ID: ${params.partnerId}.`

  const whatsappMessage = params.phone
    ? `Hello ${params.contactPerson}, thank you for registering ${params.companyName} with Superjet Global B2B. Your application is under review. We will update you shortly.`
    : `Hello ${params.contactPerson}, thank you for registering ${params.companyName} with Superjet Global B2B. Your partner application is received and pending approval.`

  return Database.createAdminNotification({
    category: 'b2b_partner_registered',
    title: 'New B2B partner registered',
    message,
    whatsappMessage,
    linkPath: '/admin/agents',
    partnerName: params.companyName,
    customerName: params.contactPerson,
    customerEmail: params.email,
    customerPhone: params.phone,
    partnerId: params.partnerId,
    paymentStatus: params.status === 'pending' ? 'pending' : undefined,
  })
}

export function notifyAdminVisaCheckerInquiry(params: {
  fullName: string
  email: string
  phone?: string
  destinationName: string
  nationalityName: string
  travelDate: string
}) {
  const message = `${params.fullName} (${params.email}) requested a visa check for ${params.destinationName} (${params.nationalityName} passport). Travel date: ${params.travelDate}.`

  const whatsappMessage = params.phone
    ? `Hello ${params.fullName}, thank you for your visa eligibility check for ${params.destinationName}. Our team will review and contact you shortly. Reply here with any questions.`
    : `Hello ${params.fullName}, thank you for your visa check request for ${params.destinationName}. Our team will follow up with you soon.`

  return Database.createAdminNotification({
    category: 'visa_checker_inquiry',
    title: 'Visa checker — new inquiry',
    message,
    whatsappMessage,
    linkPath: '/admin/leads',
    customerName: params.fullName,
    customerEmail: params.email,
    customerPhone: params.phone,
    destination: params.destinationName,
  })
}

export function getNotificationGradient(category: string, paymentStatus?: string): string {
  if (category === 'contact_inquiry' || category === 'visa_checker_inquiry') {
    return 'linear-gradient(135deg,#8b5cf6,#c4b5fd)'
  }
  if (category === 'b2b_partner_registered') {
    return paymentStatus === 'pending'
      ? 'linear-gradient(135deg,#f59e0b,#fcd34d)'
      : 'linear-gradient(135deg,#8b5cf6,#c4b5fd)'
  }
  if (category === 'b2c_user_registered') {
    return 'linear-gradient(135deg,#0ea5e9,#7dd3fc)'
  }
  if (category === 'b2b_application') {
    return 'linear-gradient(135deg,#5057ea,#818cf8)'
  }
  if (paymentStatus === 'pending') {
    return 'linear-gradient(135deg,#f59e0b,#fcd34d)'
  }
  return 'linear-gradient(135deg,#22c55e,#86efac)'
}
