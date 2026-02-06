import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import '../styles/auth.css';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <>
      <Navigation />
      <div style={styles.legalDocument}>
        <Link to="/signup" style={styles.backLink}>
          <i className="fas fa-arrow-left"></i> Back to Sign Up
        </Link>

        <div style={styles.legalHeader}>
          <h1 style={styles.h1}>Privacy Policy</h1>
          <p style={styles.lastUpdated}>Last Updated: November 16, 2025</p>
        </div>

        <div style={styles.legalContent}>
          <div style={styles.highlightBox}>
            <p style={styles.p}>
              <strong>Your Privacy Matters:</strong> Salona is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information in compliance with GDPR and other data protection regulations.
            </p>
          </div>

          <h2 style={styles.h2}>1. Introduction</h2>
          <p style={styles.p}>
            Salona ('we', 'us', or 'our') operates the Salona platform (the 'Service'). This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
          </p>

          <h2 style={styles.h2}>2. Data Controller Information</h2>
          <p style={styles.p}>For the purposes of GDPR and other data protection laws, Salona acts as the data controller for the personal information we collect from you.</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Company: Salona OÜ</li>
            <li style={styles.li}>Address: Estonia</li>
            <li style={styles.li}>Email: privacy@salona.me</li>
          </ul>

          <h2 style={styles.h2}>3. Information We Collect</h2>

          <h3 style={styles.h3}>3.1 Information You Provide to Us</h3>
          <table style={styles.dataTable}>
            <thead>
              <tr>
                <th style={styles.th}>Data Type</th>
                <th style={styles.th}>Examples</th>
                <th style={styles.th}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>Account Information</td>
                <td style={styles.td}>Name, email, phone number, password</td>
                <td style={styles.td}>Account creation and authentication</td>
              </tr>
              <tr>
                <td style={styles.td}>Business Information</td>
                <td style={styles.td}>Business name, address, tax ID, banking details</td>
                <td style={styles.td}>Service provision and payment processing</td>
              </tr>
              <tr>
                <td style={styles.td}>Customer Data</td>
                <td style={styles.td}>Client names, contact info, appointment history</td>
                <td style={styles.td}>Booking management and CRM functionality</td>
              </tr>
              <tr>
                <td style={styles.td}>Communications</td>
                <td style={styles.td}>Support tickets, emails, chat messages</td>
                <td style={styles.td}>Customer support and service improvement</td>
              </tr>
            </tbody>
          </table>

          <h3 style={styles.h3}>3.2 Information Collected Automatically</h3>
          <p style={styles.p}>When you use our Service, we automatically collect:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Device information (IP address, browser type, operating system)</li>
            <li style={styles.li}>Usage data (pages visited, features used, time spent)</li>
            <li style={styles.li}>Cookies and similar tracking technologies</li>
            <li style={styles.li}>Log data (access times, error logs)</li>
          </ul>

          <h3 style={styles.h3}>3.3 Information from Third Parties</h3>
          <p style={styles.p}>We may receive information from:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Social media platforms (if you sign up via Google, Facebook, etc.)</li>
            <li style={styles.li}>Payment processors</li>
            <li style={styles.li}>Marketing and analytics partners</li>
            <li style={styles.li}>Third-party integrations you connect to Salona</li>
          </ul>

          <h2 style={styles.h2}>4. How We Use Your Information</h2>
          <p style={styles.p}>We use your personal data for the following purposes:</p>

          <h3 style={styles.h3}>4.1 Service Provision (Legal Basis: Contract Performance)</h3>
          <ul style={styles.ul}>
            <li style={styles.li}>Creating and managing your account</li>
            <li style={styles.li}>Providing booking and scheduling functionality</li>
            <li style={styles.li}>Processing payments and managing subscriptions</li>
            <li style={styles.li}>Customer relationship management</li>
            <li style={styles.li}>Sending transactional emails and notifications</li>
          </ul>

          <h3 style={styles.h3}>4.2 Service Improvement (Legal Basis: Legitimate Interest)</h3>
          <ul style={styles.ul}>
            <li style={styles.li}>Analyzing usage patterns and trends</li>
            <li style={styles.li}>Developing new features and improvements</li>
            <li style={styles.li}>Troubleshooting and debugging</li>
            <li style={styles.li}>Ensuring security and preventing fraud</li>
          </ul>

          <h3 style={styles.h3}>4.3 Marketing (Legal Basis: Consent)</h3>
          <ul style={styles.ul}>
            <li style={styles.li}>Sending promotional emails and newsletters (with your consent)</li>
            <li style={styles.li}>Displaying personalized advertisements</li>
            <li style={styles.li}>Conducting market research</li>
          </ul>

          <h3 style={styles.h3}>4.4 Legal Compliance (Legal Basis: Legal Obligation)</h3>
          <ul style={styles.ul}>
            <li style={styles.li}>Complying with legal requirements and regulations</li>
            <li style={styles.li}>Responding to legal requests and preventing illegal activity</li>
            <li style={styles.li}>Enforcing our Terms of Service</li>
          </ul>

          <h2 style={styles.h2}>5. GDPR Rights for EU Users</h2>

          <div style={styles.gdprBox}>
            <h3 style={styles.h3}>Your Data Protection Rights</h3>
            <p style={styles.p}>If you are a resident of the European Economic Area (EEA), you have the following data protection rights:</p>
          </div>

          <h3 style={styles.h3}>5.1 Right to Access</h3>
          <p style={styles.p}>You have the right to request copies of your personal data. We may charge a reasonable fee for multiple requests.</p>

          <h3 style={styles.h3}>5.2 Right to Rectification</h3>
          <p style={styles.p}>You have the right to request correction of any inaccurate or incomplete personal data.</p>

          <h3 style={styles.h3}>5.3 Right to Erasure ('Right to be Forgotten')</h3>
          <p style={styles.p}>You have the right to request deletion of your personal data under certain conditions, such as when the data is no longer necessary or you withdraw consent.</p>

          <h3 style={styles.h3}>5.4 Right to Restrict Processing</h3>
          <p style={styles.p}>You have the right to request restriction of processing your personal data under certain conditions.</p>

          <h3 style={styles.h3}>5.5 Right to Data Portability</h3>
          <p style={styles.p}>You have the right to request transfer of your data to another organization or directly to you in a structured, commonly used format.</p>

          <h3 style={styles.h3}>5.6 Right to Object</h3>
          <p style={styles.p}>You have the right to object to processing of your personal data for direct marketing purposes or based on legitimate interests.</p>

          <h3 style={styles.h3}>5.7 Right to Withdraw Consent</h3>
          <p style={styles.p}>Where we rely on consent, you have the right to withdraw it at any time without affecting the lawfulness of processing before withdrawal.</p>

          <h3 style={styles.h3}>5.8 How to Exercise Your Rights</h3>
          <p style={styles.p}>To exercise any of these rights, please contact us at:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Email: privacy@salona.me</li>
            <li style={styles.li}>Through your account settings for certain rights</li>
          </ul>
          <p style={styles.p}>We will respond to your request within 30 days. You also have the right to lodge a complaint with your local data protection authority.</p>

          <h2 style={styles.h2}>6. Data Sharing and Disclosure</h2>
          <p style={styles.p}>We may share your personal data with:</p>

          <h3 style={styles.h3}>6.1 Service Providers</h3>
          <ul style={styles.ul}>
            <li style={styles.li}>Cloud hosting providers (AWS, Google Cloud, etc.)</li>
            <li style={styles.li}>Payment processors (Stripe, PayPal, etc.)</li>
            <li style={styles.li}>Email service providers</li>
            <li style={styles.li}>Analytics and monitoring services</li>
            <li style={styles.li}>Customer support tools</li>
          </ul>

          <h3 style={styles.h3}>6.2 Business Transfers</h3>
          <p style={styles.p}>If Salona is involved in a merger, acquisition, or asset sale, your personal data may be transferred. We will notify you before your data is transferred and becomes subject to a different Privacy Policy.</p>

          <h3 style={styles.h3}>6.3 Legal Requirements</h3>
          <p style={styles.p}>We may disclose your personal data if required by law or in response to valid requests by public authorities.</p>

          <h3 style={styles.h3}>6.4 With Your Consent</h3>
          <p style={styles.p}>We may share your information for any other purpose with your explicit consent.</p>

          <h2 style={styles.h2}>7. Data Security</h2>
          <p style={styles.p}>We implement appropriate technical and organizational measures to protect your personal data:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Encryption of data in transit (TLS/SSL) and at rest</li>
            <li style={styles.li}>Regular security audits and penetration testing</li>
            <li style={styles.li}>Access controls and authentication mechanisms</li>
            <li style={styles.li}>Employee training on data protection</li>
            <li style={styles.li}>Incident response procedures</li>
            <li style={styles.li}>Regular backups and disaster recovery plans</li>
          </ul>
          <p style={styles.p}>However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>

          <h2 style={styles.h2}>8. Data Retention</h2>
          <p style={styles.p}>We retain your personal data only for as long as necessary for the purposes set out in this Privacy Policy:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Account data: Retained while your account is active and for 30 days after deletion</li>
            <li style={styles.li}>Transaction records: Retained for 7 years for tax and accounting purposes</li>
            <li style={styles.li}>Marketing data: Retained until you unsubscribe or object</li>
            <li style={styles.li}>Usage logs: Retained for 90 days</li>
            <li style={styles.li}>Support communications: Retained for 3 years</li>
          </ul>

          <h2 style={styles.h2}>9. International Data Transfers</h2>
          <p style={styles.p}>Your information may be transferred to and processed in countries outside your country of residence, including countries outside the European Economic Area that may not have equivalent data protection laws.</p>
          <p style={styles.p}>When we transfer data internationally, we ensure appropriate safeguards are in place:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Standard Contractual Clauses approved by the European Commission</li>
            <li style={styles.li}>Privacy Shield certification (where applicable)</li>
            <li style={styles.li}>Binding Corporate Rules</li>
          </ul>

          <h2 style={styles.h2}>10. Cookies and Tracking Technologies</h2>
          <p style={styles.p}>We use cookies and similar tracking technologies:</p>

          <h3 style={styles.h3}>10.1 Essential Cookies</h3>
          <p style={styles.p}>Required for the website to function properly (e.g., session management, security).</p>

          <h3 style={styles.h3}>10.2 Analytics Cookies</h3>
          <p style={styles.p}>Help us understand how visitors interact with our website (Google Analytics, etc.).</p>

          <h3 style={styles.h3}>10.3 Marketing Cookies</h3>
          <p style={styles.p}>Used to deliver relevant advertisements and track campaign effectiveness.</p>

          <h3 style={styles.h3}>10.4 Cookie Management</h3>
          <p style={styles.p}>You can control cookies through your browser settings. Note that disabling certain cookies may affect website functionality.</p>

          <h2 style={styles.h2}>11. Children's Privacy</h2>
          <p style={styles.p}>Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>

          <h2 style={styles.h2}>12. Third-Party Links</h2>
          <p style={styles.p}>Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.</p>

          <h2 style={styles.h2}>13. Changes to This Privacy Policy</h2>
          <p style={styles.p}>We may update our Privacy Policy from time to time. We will notify you of any material changes by:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Posting the new Privacy Policy on this page</li>
            <li style={styles.li}>Updating the 'Last Updated' date</li>
            <li style={styles.li}>Sending you an email notification (for significant changes)</li>
          </ul>
          <p style={styles.p}>Your continued use of the Service after changes become effective constitutes acceptance of the revised Privacy Policy.</p>

          <h2 style={styles.h2}>14. Contact Us</h2>
          <p style={styles.p}>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Email: privacy@salona.me</li>
            <li style={styles.li}>Support: support@salona.me</li>
            <li style={styles.li}>Website: www.salona.me</li>
          </ul>

          <h2 style={styles.h2}>15. Supervisory Authority</h2>
          <p style={styles.p}>If you are an EU resident and believe we have not addressed your concerns adequately, you have the right to lodge a complaint with your local data protection supervisory authority.</p>

          <div style={styles.gdprBox}>
            <strong>Data Protection Commitment:</strong>
            <p style={styles.p}>Salona is committed to transparency and accountability in our data practices. We regularly review and update our policies and procedures to ensure compliance with evolving privacy regulations and best practices.</p>
          </div>
        </div>
      </div>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  legalDocument: {
    maxWidth: '900px',
    margin: '100px auto 50px',
    padding: '40px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: '20px',
    color: '#8B5CF6',
    textDecoration: 'none',
    fontWeight: 500,
  },
  legalHeader: {
    textAlign: 'center',
    marginBottom: '40px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f0f0f0',
  },
  h1: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  lastUpdated: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
  legalContent: {
    color: '#555',
  },
  h2: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.8rem',
    color: '#2c3e50',
    marginTop: '30px',
    marginBottom: '15px',
  },
  h3: {
    fontSize: '1.3rem',
    color: '#34495e',
    marginTop: '20px',
    marginBottom: '10px',
  },
  p: {
    lineHeight: 1.8,
    color: '#555',
    marginBottom: '15px',
  },
  ul: {
    margin: '15px 0',
    paddingLeft: '30px',
  },
  li: {
    marginBottom: '10px',
    lineHeight: 1.8,
    color: '#555',
  },
  highlightBox: {
    background: '#f8f9fa',
    borderLeft: '4px solid #8B5CF6',
    padding: '15px 20px',
    margin: '20px 0',
    borderRadius: '4px',
  },
  gdprBox: {
    background: '#e8f5e9',
    borderLeft: '4px solid #4caf50',
    padding: '15px 20px',
    margin: '20px 0',
    borderRadius: '4px',
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    margin: '20px 0',
  },
  th: {
    border: '1px solid #ddd',
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    fontWeight: 600,
  },
  td: {
    border: '1px solid #ddd',
    padding: '12px',
    textAlign: 'left',
  },
};

export default PrivacyPolicyPage;

