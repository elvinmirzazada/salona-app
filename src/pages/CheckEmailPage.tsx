import React from 'react';
import { useSearchParams } from 'react-router-dom';

const CheckEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div style={{ padding: '100px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>
        <i className="fas fa-envelope-open-text" style={{ color: '#8B5CF6' }}></i>
      </div>
      <h1>Check Your Email</h1>
      <p style={{ fontSize: '18px', color: '#6B7280', marginTop: '20px' }}>
        We've sent a verification email to:
      </p>
      <p style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937', marginTop: '10px' }}>
        {email || 'your email address'}
      </p>
      <p style={{ fontSize: '16px', color: '#6B7280', marginTop: '20px' }}>
        Please check your inbox and click the verification link to complete your registration.
      </p>
    </div>
  );
};

export default CheckEmailPage;

