import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import '../styles/auth.css';

const TermsOfServicePage: React.FC = () => {
  return (
    <>
      <Navigation />
      <div style={styles.legalDocument}>
        <Link to="/signup" style={styles.backLink}>
          <i className="fas fa-arrow-left"></i> Back to Sign Up
        </Link>

        <div style={styles.legalHeader}>
          <h1 style={styles.h1}>Terms of Service</h1>
          <p style={styles.lastUpdated}>Last Updated: November 16, 2025</p>
        </div>

        <div style={styles.legalContent}>
          <h2 style={styles.h2}>1. Acceptance of Terms</h2>
          <p style={styles.p}>
            By accessing and using Salona's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our services.
          </p>

          <h2 style={styles.h2}>2. Description of Service</h2>
          <p style={styles.p}>Salona provides a comprehensive salon and beauty business management platform that includes:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Online booking and appointment scheduling</li>
            <li style={styles.li}>Customer relationship management (CRM)</li>
            <li style={styles.li}>Staff management and scheduling</li>
            <li style={styles.li}>Service and inventory management</li>
            <li style={styles.li}>Payment processing and financial reporting</li>
            <li style={styles.li}>Marketing and communication tools</li>
            <li style={styles.li}>Analytics and business insights</li>
          </ul>

          <h2 style={styles.h2}>3. User Accounts</h2>
          <h3 style={styles.h3}>3.1 Account Registration</h3>
          <p style={styles.p}>To use Salona's services, you must:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Be at least 18 years old or have parental/guardian consent</li>
            <li style={styles.li}>Provide accurate, current, and complete information</li>
            <li style={styles.li}>Maintain and update your account information</li>
            <li style={styles.li}>Keep your password secure and confidential</li>
          </ul>

          <h3 style={styles.h3}>3.2 Account Responsibilities</h3>
          <p style={styles.p}>
            You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account or any other breach of security.
          </p>

          <h2 style={styles.h2}>4. Use of Service</h2>
          <h3 style={styles.h3}>4.1 Acceptable Use</h3>
          <p style={styles.p}>You agree to use Salona's services only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Violate any applicable laws or regulations</li>
            <li style={styles.li}>Infringe upon the rights of others</li>
            <li style={styles.li}>Transmit any harmful, offensive, or illegal content</li>
            <li style={styles.li}>Attempt to gain unauthorized access to our systems</li>
            <li style={styles.li}>Interfere with or disrupt the service or servers</li>
            <li style={styles.li}>Use automated systems to access the service without permission</li>
            <li style={styles.li}>Impersonate any person or entity</li>
          </ul>

          <h3 style={styles.h3}>4.2 Service Modifications</h3>
          <p style={styles.p}>
            We reserve the right to modify, suspend, or discontinue any part of our service at any time with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
          </p>

          <h2 style={styles.h2}>5. Payment Terms</h2>
          <h3 style={styles.h3}>5.1 Subscription Fees</h3>
          <p style={styles.p}>
            Access to certain features requires a paid subscription. Subscription fees are billed in advance on a recurring basis (monthly or annually) and are non-refundable except as required by law.
          </p>

          <h3 style={styles.h3}>5.2 Price Changes</h3>
          <p style={styles.p}>
            We reserve the right to change our subscription prices. Price changes will be communicated to you at least 30 days in advance and will take effect at the start of your next billing cycle.
          </p>

          <h3 style={styles.h3}>5.3 Cancellation</h3>
          <p style={styles.p}>
            You may cancel your subscription at any time. Upon cancellation, you will continue to have access to paid features until the end of your current billing period.
          </p>

          <h2 style={styles.h2}>6. Data and Privacy</h2>
          <p style={styles.p}>
            Your use of Salona is also governed by our Privacy Policy. By using our services, you consent to the collection, use, and sharing of your information as described in our Privacy Policy.
          </p>

          <div style={styles.highlightBox}>
            <strong>GDPR Compliance:</strong>
            <p style={styles.p}>
              For users in the European Union, we comply with the General Data Protection Regulation (GDPR). You have the right to access, correct, delete, or export your personal data. Contact us at privacy@salona.me to exercise these rights.
            </p>
          </div>

          <h2 style={styles.h2}>7. Intellectual Property</h2>
          <h3 style={styles.h3}>7.1 Our Content</h3>
          <p style={styles.p}>
            All content, features, and functionality of Salona, including but not limited to text, graphics, logos, icons, images, audio clips, and software, are the exclusive property of Salona and are protected by copyright, trademark, and other intellectual property laws.
          </p>

          <h3 style={styles.h3}>7.2 Your Content</h3>
          <p style={styles.p}>
            You retain all rights to the content you upload to Salona. By uploading content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and display your content solely for the purpose of providing our services to you.
          </p>

          <h2 style={styles.h2}>8. Limitation of Liability</h2>
          <p style={styles.p}>
            To the maximum extent permitted by law, Salona shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
          </p>
          <ul style={styles.ul}>
            <li style={styles.li}>Your use or inability to use the service</li>
            <li style={styles.li}>Any unauthorized access to or use of our servers</li>
            <li style={styles.li}>Any interruption or cessation of transmission to or from the service</li>
            <li style={styles.li}>Any bugs, viruses, or malicious code transmitted through the service</li>
            <li style={styles.li}>Any errors or omissions in any content</li>
          </ul>

          <h2 style={styles.h2}>9. Warranties and Disclaimers</h2>
          <p style={styles.p}>
            THE SERVICE IS PROVIDED 'AS IS' AND 'AS AVAILABLE' WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. SALONA DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>

          <h2 style={styles.h2}>10. Indemnification</h2>
          <p style={styles.p}>
            You agree to indemnify, defend, and hold harmless Salona and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the service or your violation of these Terms.
          </p>

          <h2 style={styles.h2}>11. Termination</h2>
          <p style={styles.p}>
            We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the service will immediately cease.
          </p>

          <h2 style={styles.h2}>12. Dispute Resolution</h2>
          <h3 style={styles.h3}>12.1 Governing Law</h3>
          <p style={styles.p}>
            These Terms shall be governed by and construed in accordance with the laws of Estonia, without regard to its conflict of law provisions.
          </p>

          <h3 style={styles.h3}>12.2 Arbitration</h3>
          <p style={styles.p}>
            Any dispute arising from these Terms or your use of the service shall be resolved through binding arbitration, except that either party may seek injunctive relief in court for violations of intellectual property rights.
          </p>

          <h2 style={styles.h2}>13. Changes to Terms</h2>
          <p style={styles.p}>
            We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the new Terms on our website and updating the 'Last Updated' date. Your continued use of the service after such changes constitutes acceptance of the new Terms.
          </p>

          <h2 style={styles.h2}>14. Contact Information</h2>
          <p style={styles.p}>If you have any questions about these Terms of Service, please contact us at:</p>
          <ul style={styles.ul}>
            <li style={styles.li}>Email: support@salona.me</li>
            <li style={styles.li}>Legal Email: legal@salona.me</li>
          </ul>
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
};

export default TermsOfServicePage;

