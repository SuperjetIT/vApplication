import { SiteLayout, PromoSection } from '../components/SiteLayout'
import './ContactPage.css'

const supportChannels = [
  {
    title: 'Customer Support',
    description: 'Help with your visa application, status, and account.',
    email: 'support@vapplication.com',
  },
  {
    title: 'General queries',
    description: 'Partnerships, press, and other general questions.',
    email: 'procurement@superjetgroup.com',
  },
]

const offices = [
  {
    city: 'Delhi',
    address: '7 Khullar Farms, New Delhi, India',
  },
  {
    city: 'Dubai',
    address: 'M16, Al Quoz 3, Sheikh Zayed Rd, Dubai, UAE',
  },
  {
    city: 'New York',
    address: '447 Broadway STE 851, New York, USA',
  },
]

export default function ContactPage() {
  return (
    <SiteLayout>
      <main className="contact-page">
        <header className="contact-hero">
          <h1>Get in touch</h1>
          <p>
            Thank you for your interest in reaching out to us! We value your feedback, inquiries,
            and suggestions. To ensure we can assist you effectively, please find the appropriate
            contact information and guidelines below:
          </p>
        </header>

        <section className="contact-section" aria-labelledby="support-heading">
          <h2 id="support-heading" className="visually-hidden">
            Support channels
          </h2>
          <div className="contact-cards">
            {supportChannels.map((channel) => (
              <article key={channel.title} className="contact-card">
                <h3>{channel.title}</h3>
                <p className="contact-card__desc">{channel.description}</p>
                <a href={`mailto:${channel.email}`} className="contact-card__email">
                  {channel.email}
                </a>
              </article>
            ))}

            <article className="contact-card contact-card--phone">
              <h3>Application issues</h3>
              <p className="contact-card__desc">
                Urgent help with an in-progress application or embassy appointment.
              </p>
              <a href="tel:+918031149395" className="contact-card__phone">
                +91 80-31149395
              </a>
            </article>
          </div>

          <p className="contact-response-note">We respond to all queries within 48 hours.</p>

          <div className="contact-policy-links">
            <a href="#refunds" className="contact-policy-links__item">
              Refund Policy <span aria-hidden>↗</span>
            </a>
            <a href="#transparency" className="contact-policy-links__item">
              Commitment to Transparency <span aria-hidden>↗</span>
            </a>
          </div>
        </section>

        <section className="contact-section contact-section--offices" aria-labelledby="offices-heading">
          <h2 id="offices-heading">Offices</h2>
          <div className="office-grid">
            {offices.map((office) => (
              <article key={office.city} className="office-card">
                <h3>{office.city}</h3>
                <p className="office-card__label">Address</p>
                <p className="office-card__address">{office.address}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="contact-section contact-section--grievance"
          aria-labelledby="grievance-heading"
        >
          <h2 id="grievance-heading">Grievance Redressal</h2>
          <p className="contact-grievance-intro">
            Per Consumer Protection (E-Commerce) Rules, 2020 &amp; IT Act, 2000.
          </p>
          <div className="grievance-card">
            <dl className="grievance-details">
              <div className="grievance-details__row">
                <dt>Officer</dt>
                <dd>Mr. Meyappan Murugappan</dd>
              </div>
              <div className="grievance-details__row">
                <dt>Email</dt>
                <dd>
                  <a href="mailto:grievance@vapplication.com">grievance@vapplication.com</a>
                </dd>
              </div>
              <div className="grievance-details__row">
                <dt>Phone</dt>
                <dd>
                  <a href="tel:+918031149395">+91 80-31149395</a>
                </dd>
              </div>
              <div className="grievance-details__row">
                <dt>Address</dt>
                <dd>7 Khullar Farms, New Delhi, 110030</dd>
              </div>
            </dl>
          </div>
        </section>

        <PromoSection />
      </main>

      <div className="contact-floating-badge" aria-hidden>
        On Time Guaranteed
      </div>
    </SiteLayout>
  )
}
