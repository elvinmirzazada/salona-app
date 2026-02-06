import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { authAPI } from '../utils/api';
import '../styles/auth.css';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please check your email link.');
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);

        if (response.status === 200 || response.status === 201) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 10000);
        } else {
          setStatus('error');
          setMessage('Email verification failed. Please try again or contact support.');
        }
      } catch (err: any) {
        console.error('Email verification error:', err);
        setStatus('error');

        if (err.response?.data?.message) {
          setMessage(err.response.data.message);
        } else if (err.response?.data?.error) {
          setMessage(err.response.data.error);
        } else if (err.response?.status === 400) {
          setMessage('Invalid or expired verification token.');
        } else {
          setMessage('An error occurred during verification. Please try again.');
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <>
      <Navigation />

      {/* Background Shapes */}
      <div className="auth-background">
        <div className="auth-shape auth-shape-1"></div>
        <div className="auth-shape auth-shape-2"></div>
        <div className="auth-shape auth-shape-3"></div>
      </div>

      {/* Main Content */}
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '500px', margin: 'auto' }}>
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/salona-icon.png" alt="Salona" className="auth-logo-icon" />
            </div>
            <h1 className="auth-title">Email Verification</h1>
          </div>

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {status === 'loading' && (
              <>
                <div className="auth-spinner">
                  <div className="spinner-circle"></div>
                  <span>Verifying your email...</span>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div style={{ fontSize: '64px', color: '#10b981', marginBottom: '20px' }}>
                  <i className="fas fa-check-circle"></i>
                </div>
                <h2 style={{ color: '#10b981', marginBottom: '15px' }}>Success!</h2>
                <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '20px' }}>
                  {message}
                </p>
                <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
                  Redirecting to login page in 3 seconds...
                </p>
                <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
                  <i className="fas fa-sign-in-alt"></i>
                  Go to Login
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div style={{ fontSize: '64px', color: '#ef4444', marginBottom: '20px' }}>
                  <i className="fas fa-times-circle"></i>
                </div>
                <h2 style={{ color: '#ef4444', marginBottom: '15px' }}>Verification Failed</h2>
                <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '30px' }}>
                  {message}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/signup" className="btn btn-secondary">
                    <i className="fas fa-user-plus"></i>
                    Sign Up Again
                  </Link>
                  <Link to="/login" className="btn btn-primary">
                    <i className="fas fa-sign-in-alt"></i>
                    Go to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage;

