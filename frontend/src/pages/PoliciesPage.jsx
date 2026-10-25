import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { openPrivacySettings } from "../lib/privacyPreferences";

function PolicyLayout({ title, children }) {
  return (
    <div className="policy-page">
      <PageHeader title={title} />
      <article className="policy-content">
        <p className="policy-updated">Website information for West Rand Judo Association NPC</p>
        {children}
        <p className="policy-contact">
          Questions about this page? Contact <a href="mailto:admin@wrja.co.za">admin@wrja.co.za</a> or use the <Link to="/contact">contact form</Link>.
        </p>
      </article>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy notice">
      <p>
        This notice explains the personal information the WRJA website handles,
        why it is used, and how to contact us about it. It describes the
        website’s current features and is not a promise that online services
        are risk-free.
      </p>
      <h2>Information we handle</h2>
      <ul>
        <li>
          Account details, such as name, email address, phone number, account
          type and, for athlete sign-up, date of birth.
        </li>
        <li>
          Enquiry details submitted through forms, including your name, email,
          optional phone number, message and the page or subject of the enquiry.
        </li>
        <li>
          Proof-of-payment files and related event/account information submitted
          by signed-in members.
        </li>
        <li>
          Chat messages when you use the WRJA assistant. The conversation is
          kept in your browser session and messages are sent to Google Gemini
          to generate replies.
        </li>
        <li>
          Technical information needed to operate and protect the service, which
          may include request details recorded by hosting or service providers.
        </li>
      </ul>
      <h2>How information is used and shared</h2>
      <p>
        WRJA uses this information to create and secure member accounts,
        respond to enquiries, review payment evidence, provide requested
        features, and operate and protect the website. Information is shared
        with service providers only as needed for those purposes, including
        Supabase for authentication, database and file storage; the configured
        email and hosting providers; Google Gemini when you send a chat
        message; Mapbox when you choose to load the map; and Vercel Speed
        Insights only if you enable performance analytics. A provider may
        process information outside South Africa under its own terms and
        safeguards.
      </p>
      <p>
        WRJA does not request payment card details on this website. Do not
        include passwords, full bank account details, or unnecessary health
        information in an enquiry or chat. Use a parent or guardian account
        where required for a child.
      </p>
      <h2>Cookies and browser storage</h2>
      <p>
        Essential HTTP-only session cookies support sign-in and account
        security. The site also stores functional information in browser
        storage, such as your WRJA Buddy tour progress and chat session. Your
        analytics and external-content choices are saved in browser storage,
        not as a tracking cookie. Optional analytics and the Mapbox map remain
        disabled until you opt in. Consent choices expire after six months.
      </p>
      <p>
        <button type="button" className="policy-settings-button" onClick={openPrivacySettings}>
          Manage privacy preferences
        </button>
      </p>
      <h2>Retention and your choices</h2>
      <p>
        WRJA keeps information only for as long as it is needed for the purpose
        it was collected or to meet applicable obligations. The retention
        period depends on the record type. You may ask to access or correct
        personal information, or request deletion or object to processing where
        applicable. We may need to verify your identity and retain information
        where the law requires it.
      </p>
      <p>
        Send a request to <a href="mailto:admin@wrja.co.za">admin@wrja.co.za</a>.
        You may also raise a complaint with South Africa’s Information
        Regulator. This notice does not limit rights available under applicable
        privacy law.
      </p>
      <h2>Security</h2>
      <p>
        WRJA uses technical and organisational safeguards intended to protect
        information, including access controls for member and payment
        information. No internet service can guarantee absolute security. If
        you suspect an issue, contact us using the details above and do not
        include passwords or sensitive personal information.
      </p>
    </PolicyLayout>
  );
}

export function TermsPage() {
  return (
    <PolicyLayout title="Website terms">
      <p>
        These terms apply to use of the West Rand Judo Association website.
        Please use the site responsibly and contact WRJA if anything is unclear.
      </p>
      <h2>Website information and events</h2>
      <p>
        Website content is general information and may change. Event dates,
        availability, fees and registration requirements should be confirmed
        with WRJA or the relevant organiser before making arrangements.
        Submitting proof of payment does not itself confirm event registration
        or payment acceptance; WRJA must review it.
      </p>
      <h2>Accounts and acceptable use</h2>
      <p>
        Provide accurate information, keep your sign-in details private, and
        notify WRJA if you believe your account has been misused. Do not
        interfere with the site, attempt unauthorised access, submit unlawful
        material, or use another person’s information without authority.
      </p>
      <h2>Judo and safety</h2>
      <p>
        Website information is not medical advice and does not replace
        instructions from a qualified coach or healthcare professional. Judo
        is a physical activity with inherent risks; participants should follow
        their club’s safety guidance and seek appropriate advice about their
        own fitness. These terms do not waive participant rights or replace
        separate club, event or membership requirements.
      </p>
      <h2>External services and content</h2>
      <p>
        The website may link to third-party websites or services. Those
        services are operated under their own terms and privacy notices. WRJA
        does not control their content or availability.
      </p>
      <h2>Legal rights</h2>
      <p>
        Nothing in these terms excludes or limits a right, remedy or liability
        that cannot lawfully be excluded or limited. These terms are subject
        to applicable South African law.
      </p>
    </PolicyLayout>
  );
}

export function AccessibilityPage() {
  return (
    <PolicyLayout title="Accessibility">
      <p>
        WRJA aims to make this website usable by as many people as possible.
        Current improvements include keyboard-operable controls, visible
        keyboard focus, a skip-to-content link and support for reduced-motion
        preferences. This is an ongoing effort, not a claim of verified
        conformance to a particular accessibility standard.
      </p>
      <h2>Tell us about a barrier</h2>
      <p>
        If content or a feature is difficult to use, email{" "}
        <a href="mailto:admin@wrja.co.za">admin@wrja.co.za</a> or use the{" "}
        <Link to="/contact">contact form</Link>. Please include the page,
        what you were trying to do, and an accessible way for us to reply.
        Do not include passwords or sensitive personal information.
      </p>
    </PolicyLayout>
  );
}

export function SecurityPage() {
  return (
    <PolicyLayout title="Security contact">
      <p>
        If you believe you have found a security issue in this website, please
        report it privately to{" "}
        <a href="mailto:admin@wrja.co.za?subject=Website%20security%20report">admin@wrja.co.za</a>.
        Include the affected page and a concise description. Please do not
        access, alter or download other people’s information, disrupt the
        service, or include passwords, payment records or other sensitive
        personal information in a report.
      </p>
      <p>
        WRJA will review reports as resources allow. This contact page is not
        an emergency service and does not promise a response time or reward.
      </p>
    </PolicyLayout>
  );
}
