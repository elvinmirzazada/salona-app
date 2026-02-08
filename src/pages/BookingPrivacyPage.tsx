import React from 'react';
import '../styles/legal-document.css';

const BookingPrivacyPage: React.FC = () => {
  return (
    <div className="legal-page-wrapper">
      <div className="legal-document">
        <a href="javascript:history.back()" className="back-link">
          <i className="fas fa-arrow-left"></i> Back to Booking
        </a>

        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: January 8, 2026</p>
        </div>

        <div className="legal-content">
          <div className="highlight-box">
            <p><strong>Your Privacy Matters:</strong> At Salona, we are committed to protecting your personal information and being transparent about how we collect, use, and safeguard your data.</p>
          </div>

          <h2>1. Introduction</h2>
          <p>This Privacy Policy explains how Salona ('we', 'us', or 'our') collects, uses, discloses, and protects your information when you use our booking platform and services. By using Salona, you agree to the collection and use of information in accordance with this policy.</p>

          <h2>2. Information We Collect</h2>

          <h3>2.1 Information You Provide</h3>
          <p>When you use our services, you may provide us with:</p>
          <ul>
            <li>Personal identification information (name, email address, phone number)</li>
            <li>Booking details (appointment time, services requested, special requirements)</li>
            <li>Payment information (processed securely by our payment partners)</li>
            <li>Communication preferences and history</li>
            <li>Profile information and preferences</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <p>When you access our platform, we automatically collect:</p>
          <ul>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, time spent, features used)</li>
            <li>Location information (if you grant permission)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3>2.3 Information from Third Parties</h3>
          <p>We may receive information about you from:</p>
          <ul>
            <li>Service providers (salons, spas, beauty professionals)</li>
            <li>Social media platforms (if you connect your accounts)</li>
            <li>Payment processors and financial institutions</li>
            <li>Analytics and advertising partners</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li><strong>Service Delivery:</strong> To process bookings, send confirmations, and facilitate appointments</li>
            <li><strong>Communication:</strong> To send reminders, updates, and respond to your inquiries</li>
            <li><strong>Improvement:</strong> To enhance our platform, develop new features, and optimize user experience</li>
            <li><strong>Marketing:</strong> To send promotional offers and updates (with your consent)</li>
            <li><strong>Security:</strong> To protect against fraud, unauthorized access, and security threats</li>
            <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>We may share your information with:</p>

          <h3>4.1 Service Providers</h3>
          <p>When you book an appointment, we share necessary information with the service provider to fulfill your booking.</p>

          <h3>4.2 Third-Party Service Providers</h3>
          <p>We may share information with trusted partners who assist us in:</p>
          <ul>
            <li>Payment processing</li>
            <li>Email and SMS communications</li>
            <li>Analytics and performance monitoring</li>
            <li>Cloud hosting and data storage</li>
            <li>Customer support services</li>
          </ul>

          <h3>4.3 Legal Requirements</h3>
          <p>We may disclose information if required by law, court order, or to protect our rights and safety.</p>

          <h2>5. Data Security</h2>
          <p>We implement industry-standard security measures to protect your data:</p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure servers with regular security audits</li>
            <li>Access controls and authentication systems</li>
            <li>Regular security updates and patches</li>
            <li>Employee training on data protection</li>
          </ul>
          <p>However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>

          <h2>6. Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal information:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Restrict Processing:</strong> Limit how we use your information</li>
          </ul>

          <h2>7. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul>
            <li>Remember your preferences and settings</li>
            <li>Understand how you use our platform</li>
            <li>Improve your user experience</li>
            <li>Provide personalized content and recommendations</li>
          </ul>
          <p>You can control cookies through your browser settings, but disabling cookies may affect platform functionality.</p>

          <h2>8. Children's Privacy</h2>
          <p>Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will delete it promptly.</p>

          <h2>9. International Data Transfers</h2>
          <p>Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.</p>

          <h2>10. Data Retention</h2>
          <p>We retain your personal information for as long as necessary to:</p>
          <ul>
            <li>Provide our services to you</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce our agreements</li>
            <li>Maintain business records</li>
          </ul>
          <p>When your data is no longer needed, we will securely delete or anonymize it.</p>

          <h2>11. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by:</p>
          <ul>
            <li>Posting the new policy on our platform</li>
            <li>Updating the "Last Updated" date</li>
            <li>Sending you an email notification (for material changes)</li>
          </ul>
          <p>Your continued use of our services after changes are posted constitutes acceptance of the updated policy.</p>

          <h2>12. Third-Party Links</h2>
          <p>Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.</p>

          <div className="contact-info">
            <h3>Contact Us</h3>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:</p>
            <p><strong>Email:</strong> privacy@salona.app</p>
            <p><strong>Address:</strong> Salona Privacy Team, [Your Business Address]</p>
            <p><strong>Phone:</strong> [Your Contact Number]</p>
            <p>We will respond to your inquiry within 30 days.</p>
          </div>

          <div className="highlight-box" style={{ marginTop: '30px' }}>
            <p><strong>Your Rights Under GDPR (EU Residents):</strong> If you are located in the European Union, you have additional rights under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with your local data protection authority.</p>
          </div>

          <div className="highlight-box">
            <p><strong>California Residents:</strong> Under the California Consumer Privacy Act (CCPA), you have specific rights regarding your personal information. Please contact us to exercise these rights.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPrivacyPage;

