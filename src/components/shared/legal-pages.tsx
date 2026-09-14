'use client'

import { LegalPage, LegalSection, LegalP, LegalList } from '@/components/shared/legal-page'

export function PrivacyView() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2024">
      <LegalP>
        DriveLuxe (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This
        policy explains what information we collect, why we collect it, and how
        you can control it. This is a portfolio project, so the practices
        described here are illustrative.
      </LegalP>

      <LegalSection title="Information we collect">
        <LegalList
          items={[
            'Account information: name, email address, and phone number (optional) when you register.',
            'Booking information: pickup location, dates, and the vehicle you rent.',
            'Usage data: pages you view and features you interact with, to improve the service.',
            'Authentication tokens: a signed JWT stored in an httpOnly cookie so you stay logged in.',
          ]}
        />
      </LegalSection>

      <LegalSection title="How we use your information">
        <LegalList
          items={[
            'To create and manage your account.',
            'To process and fulfil your bookings.',
            'To award loyalty points and track your rewards history.',
            'To respond to support requests you submit.',
            'To prevent fraud and abusive behaviour on the platform.',
          ]}
        />
      </LegalSection>

      <LegalSection title="How we protect your data">
        <LegalP>
          Passwords are never stored in plain text — they are hashed with
          bcrypt before being saved. Authentication tokens are placed in
          httpOnly cookies so they cannot be read by JavaScript, reducing the
          risk of token theft via cross-site scripting.
        </LegalP>
      </LegalSection>

      <LegalSection title="Sharing your information">
        <LegalP>
          We do not sell your personal data. Information is shared only when
          necessary to fulfil a booking (for example, with the team that
          prepares your vehicle) or when required by law.
        </LegalP>
      </LegalSection>

      <LegalSection title="Your rights">
        <LegalList
          items={[
            'Access the personal data we hold about you.',
            'Correct inaccurate information from your profile page.',
            'Request deletion of your account and associated data.',
            'Opt out of marketing communications at any time.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Contact">
        <LegalP>
          Questions about privacy? Email{' '}
          <span className="text-primary">privacy@driveluxe.com</span> or submit
          a request through the Help &amp; Support page.
        </LegalP>
      </LegalSection>
    </LegalPage>
  )
}

export function TermsView() {
  return (
    <LegalPage title="Terms of Service" updated="September 2024">
      <LegalP>
        By creating a DriveLuxe account or booking a vehicle, you agree to these
        terms. Please read them carefully.
      </LegalP>

      <LegalSection title="1. Eligibility">
        <LegalP>
          You must be at least 21 years old and hold a valid driving licence to
          rent a vehicle. By registering you confirm that you meet these
          requirements.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. Your account">
        <LegalList
          items={[
            'You are responsible for keeping your password confidential.',
            'You must not share your account or allow others to book on your behalf.',
            'You agree to provide accurate information when registering and booking.',
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Bookings">
        <LegalP>
          A booking is confirmed once you complete the booking flow and receive
          a confirmation. The vehicle is reserved for your selected dates and
          cannot be double-booked. Prices are calculated based on the daily rate
          and the number of rental days.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. Vehicle use">
        <LegalList
          items={[
            'The vehicle must be operated in accordance with all traffic laws.',
            'The vehicle must be returned on or before the agreed return date.',
            'You are responsible for any damage, tolls, or fines incurred during the rental.',
            'Smoking and transporting illegal substances in the vehicle are prohibited.',
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Cancellations & refunds">
        <LegalP>
          Cancellation and refund rules are detailed in our Refund Policy.
          Points earned on a booking are reversed if the booking is cancelled.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Loyalty points">
        <LegalP>
          Points are awarded on completed bookings and have no cash value. We
          may modify or discontinue the points programme at any time.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Limitation of liability">
        <LegalP>
          DriveLuxe is provided &ldquo;as is&rdquo;. To the fullest extent
          permitted by law, we are not liable for indirect or consequential
          losses arising from your use of the service.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. Changes to these terms">
        <LegalP>
          We may update these terms from time to time. Continued use of the
          service after changes take effect constitutes acceptance of the
          updated terms.
        </LegalP>
      </LegalSection>
    </LegalPage>
  )
}

export function CookiesView() {
  return (
    <LegalPage title="Cookies Policy" updated="September 2024">
      <LegalP>
        This policy explains how DriveLuxe uses cookies and similar
        technologies.
      </LegalP>

      <LegalSection title="What are cookies?">
        <LegalP>
          Cookies are small text files stored on your device when you visit a
          website. They allow the site to remember your actions and preferences
          over time.
        </LegalP>
      </LegalSection>

      <LegalSection title="Cookies we use">
        <LegalList
          items={[
            'Authentication cookie (driveluxe_token): stores your login session so you stay signed in. It is httpOnly and cannot be read by JavaScript.',
            'Preference cookies: remember choices like theme or filters during your visit.',
            'Analytics cookies (if enabled): help us understand how the site is used so we can improve it.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Managing cookies">
        <LegalP>
          You can control or delete cookies through your browser settings.
          Disabling the authentication cookie will sign you out and prevent
          access to account-only areas of the site.
        </LegalP>
      </LegalSection>

      <LegalSection title="Third-party content">
        <LegalP>
          Some pages may load images or content from third-party hosts (for
          example, vehicle photographs). Those hosts may set their own cookies
          in accordance with their respective policies.
        </LegalP>
      </LegalSection>
    </LegalPage>
  )
}

export function RefundView() {
  return (
    <LegalPage title="Refund Policy" updated="September 2024">
      <LegalP>
        We want every DriveLuxe rental to go smoothly. If something goes wrong,
        this policy explains when and how you can receive a refund.
      </LegalP>

      <LegalSection title="Cancellation windows">
        <LegalList
          items={[
            'More than 24 hours before pickup: full refund, no questions asked.',
            'Within 24 hours of pickup: 50% refund of the total booking amount.',
            'After the pickup time has passed: no refund (the reservation was held for you).',
          ]}
        />
      </LegalSection>

      <LegalSection title="How to cancel">
        <LegalP>
          Visit your <strong>My Bookings</strong> page and click{' '}
          <strong>Cancel</strong> on the relevant booking. The cancellation is
          processed immediately and any loyalty points earned on that booking
          are reversed.
        </LegalP>
      </LegalSection>

      <LegalSection title="If something went wrong">
        <LegalP>
          If the vehicle was not as described, was unavailable at pickup, or you
          experienced any other issue, you may be eligible for a full or partial
          refund beyond the standard windows. In that case:
        </LegalP>
        <LegalList
          items={[
            'Submit a support request through the Help & Support page within 7 days of the incident.',
            'Include your booking reference and a description of the issue.',
            'Our team will review and respond within 2 business days.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Refund processing">
        <LegalP>
          Approved refunds are returned to the original payment method within
          5–10 business days. Loyalty points are adjusted to reflect any
          refunded booking.
        </LegalP>
      </LegalSection>

      <LegalSection title="Non-refundable items">
        <LegalList
          items={[
            'Fines, tolls, or damage charges incurred during the rental.',
            'Bookings cancelled after the return date has passed.',
            'Promotional or points-redemption bookings (points are returned instead).',
          ]}
        />
      </LegalSection>

      <LegalSection title="Need help?">
        <LegalP>
          Open a support ticket from the Help &amp; Support page and select the{' '}
          <strong>refund</strong> category. Our team is here to help.
        </LegalP>
      </LegalSection>
    </LegalPage>
  )
}
