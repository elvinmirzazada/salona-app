import React from 'react';
import '../styles/legal-document.css';

const BookingTermsPage: React.FC = () => {
  return (
    <div className="legal-page-wrapper">
      <div className="legal-document">
        <a href="javascript:history.back()" className="back-link">
          <i className="fas fa-arrow-left"></i> Back to Booking
        </a>

        <div className="legal-header">
          <h1>Booking Terms &amp; Conditions</h1>
          <p className="last-updated">Last Updated: January 8, 2026</p>
        </div>

        <div className="legal-content">
          <div className="highlight-box">
            <p><strong>Important:</strong> By completing a booking through Salona, you agree to these terms and conditions. Please read them carefully before proceeding with your appointment.</p>
          </div>

          <h2>1. Booking Acceptance</h2>
          <p>When you make a booking through Salona, you are entering into an agreement with the service provider (salon, spa, or beauty professional). Salona acts as a platform to facilitate this booking but is not directly responsible for the services provided.</p>

          <h3>1.1 Booking Confirmation</h3>
          <p>You will receive a confirmation email with your booking details once your appointment is successfully scheduled. Please review all details carefully and contact the service provider immediately if any information is incorrect.</p>

          <h2>2. Cancellation Policy</h2>
          <p>Each service provider sets their own cancellation policy. Generally, the following applies:</p>
          <ul>
            <li>Cancellations must be made at least 24 hours before your scheduled appointment.</li>
            <li>Late cancellations (less than 24 hours notice) may result in a cancellation fee of up to 50% of the service price.</li>
            <li>No-shows will be charged the full service price.</li>
            <li>The specific cancellation policy of your chosen service provider will be communicated during the booking process.</li>
          </ul>

          <h3>2.1 How to Cancel</h3>
          <p>To cancel your appointment, please contact the service provider directly using the contact information provided in your booking confirmation email, or use the cancellation link if available.</p>

          <h2>3. Payment Terms</h2>
          <p>Payment methods and timing are determined by each service provider:</p>
          <ul>
            <li>Some providers require advance payment at the time of booking.</li>
            <li>Others accept payment upon arrival or after service completion.</li>
            <li>All displayed prices include applicable taxes unless otherwise stated.</li>
            <li>Service providers may charge additional fees for special requests or premium services.</li>
          </ul>

          <h2>4. Late Arrivals</h2>
          <p>We understand that delays happen, but please note:</p>
          <ul>
            <li>If you arrive more than 15 minutes late, your appointment may need to be shortened or rescheduled.</li>
            <li>You will still be charged the full service price for late arrivals.</li>
            <li>The service provider reserves the right to cancel your appointment if you arrive more than 30 minutes late.</li>
            <li>Please contact the service provider as soon as possible if you expect to be late.</li>
          </ul>

          <h2>5. Rescheduling</h2>
          <p>If you need to reschedule your appointment:</p>
          <ul>
            <li>Contact the service provider at least 24 hours in advance.</li>
            <li>Rescheduling is subject to availability.</li>
            <li>Multiple rescheduling requests may result in cancellation of your booking.</li>
            <li>Late rescheduling requests may be treated as cancellations and subject to cancellation fees.</li>
          </ul>

          <h2>6. Service Provider Responsibilities</h2>
          <p>Service providers using the Salona platform are expected to:</p>
          <ul>
            <li>Provide services in a professional and timely manner</li>
            <li>Maintain a clean and safe environment</li>
            <li>Use quality products and equipment</li>
            <li>Respect your privacy and personal information</li>
            <li>Honor the services and prices advertised on the platform</li>
          </ul>

          <h2>7. Customer Responsibilities</h2>
          <p>As a customer using Salona, you agree to:</p>
          <ul>
            <li>Provide accurate information when booking</li>
            <li>Arrive on time for your scheduled appointment</li>
            <li>Inform the service provider of any allergies or sensitivities</li>
            <li>Treat service providers with respect and courtesy</li>
            <li>Pay for services as agreed</li>
            <li>Follow the service provider's policies and guidelines</li>
          </ul>

          <h2>8. Health and Safety</h2>
          <p>For the safety of all parties:</p>
          <ul>
            <li>Please inform the service provider of any relevant medical conditions, allergies, or skin sensitivities.</li>
            <li>If you are feeling unwell, please reschedule your appointment.</li>
            <li>Service providers reserve the right to refuse service if they believe it may pose a health risk.</li>
            <li>Follow all health and safety guidelines provided by the service provider.</li>
          </ul>

          <h2>9. Pricing and Promotions</h2>
          <ul>
            <li>All prices displayed on the platform are in Euros (€) unless otherwise stated.</li>
            <li>Prices are subject to change without notice.</li>
            <li>Promotional offers and discounts are subject to specific terms and conditions.</li>
            <li>Promotional codes cannot be combined unless explicitly stated.</li>
            <li>Service providers may offer package deals or loyalty discounts.</li>
          </ul>

          <h2>10. Disputes and Complaints</h2>
          <p>If you have a complaint or dispute:</p>
          <ul>
            <li>First, try to resolve the issue directly with the service provider.</li>
            <li>If unresolved, contact Salona customer support with details of your complaint.</li>
            <li>We will investigate and attempt to mediate a fair resolution.</li>
            <li>Salona reserves the right to make final decisions in dispute cases.</li>
          </ul>

          <h2>11. Liability and Disclaimers</h2>
          <p><strong>Important Legal Information:</strong></p>
          <ul>
            <li>Salona acts as a booking platform and is not directly responsible for services provided by independent service providers.</li>
            <li>Service providers are independent contractors, not employees or agents of Salona.</li>
            <li>We do not guarantee the quality, safety, or legality of services provided.</li>
            <li>We are not liable for any injuries, damages, or losses resulting from services received through our platform.</li>
            <li>Your use of the platform and services is at your own risk.</li>
          </ul>

          <h2>12. Data Protection</h2>
          <p>Your personal information is protected under our Privacy Policy:</p>
          <ul>
            <li>We collect and use your information as described in our Privacy Policy.</li>
            <li>Service providers may also collect information necessary to provide services.</li>
            <li>By using Salona, you consent to data processing as described in our Privacy Policy.</li>
            <li>You have rights regarding your personal data, including access, correction, and deletion.</li>
          </ul>

          <h2>13. Intellectual Property</h2>
          <p>All content on the Salona platform, including:</p>
          <ul>
            <li>Text, graphics, logos, images, and software</li>
            <li>Design, layout, and functionality</li>
            <li>Trademarks and branding</li>
          </ul>
          <p>are owned by Salona or licensed to us and are protected by intellectual property laws. You may not copy, reproduce, or distribute any content without our written permission.</p>

          <h2>14. Prohibited Activities</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the platform for any illegal or unauthorized purpose</li>
            <li>Violate any laws or regulations</li>
            <li>Impersonate others or provide false information</li>
            <li>Harass, abuse, or harm service providers or other users</li>
            <li>Attempt to access unauthorized areas of the platform</li>
            <li>Interfere with the platform's operation or security</li>
            <li>Use automated systems to access the platform without permission</li>
          </ul>

          <h2>15. Account Termination</h2>
          <p>We reserve the right to:</p>
          <ul>
            <li>Suspend or terminate your account for violations of these terms</li>
            <li>Refuse service to anyone for any reason</li>
            <li>Remove or edit content that violates our policies</li>
            <li>Take legal action if necessary</li>
          </ul>

          <h2>16. Modifications to Terms</h2>
          <p>We may update these Terms and Conditions from time to time. We will notify you of significant changes by:</p>
          <ul>
            <li>Posting the updated terms on our platform</li>
            <li>Updating the "Last Updated" date</li>
            <li>Sending email notifications for material changes</li>
          </ul>
          <p>Your continued use of the platform after changes are posted constitutes acceptance of the updated terms.</p>

          <h2>17. Governing Law</h2>
          <p>These Terms and Conditions are governed by and construed in accordance with the laws of Estonia. Any disputes arising from these terms will be subject to the exclusive jurisdiction of the Estonian courts.</p>

          <h2>18. Severability</h2>
          <p>If any provision of these terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.</p>

          <h2>19. Entire Agreement</h2>
          <p>These Terms and Conditions, together with our Privacy Policy, constitute the entire agreement between you and Salona regarding your use of the platform.</p>

          <div className="contact-info">
            <h3>Contact Information</h3>
            <p>If you have any questions about these Terms and Conditions, please contact us:</p>
            <p><strong>Email:</strong> support@salona.app</p>
            <p><strong>Customer Service:</strong> Available Monday-Friday, 9:00 AM - 6:00 PM (EET)</p>
            <p><strong>Address:</strong> Salona Support Team, [Your Business Address]</p>
            <p><strong>Phone:</strong> [Your Contact Number]</p>
          </div>

          <div className="highlight-box" style={{ marginTop: '30px' }}>
            <p><strong>Thank You:</strong> By using Salona, you help support local beauty businesses and professionals. We appreciate your trust in our platform and are committed to providing you with the best booking experience possible.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingTermsPage;

