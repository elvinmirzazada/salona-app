import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { authAPI } from '../utils/api';
import { googleAuth } from '../utils/googleAuth';
import '../styles/auth.css';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');
  const [showSocialAuth, setShowSocialAuth] = useState(true);

  useEffect(() => {
    // Check for invitation token and email in URL
    const token = searchParams.get('invitation_token');
    const emailParam = searchParams.get('email');

    if (token) {
      setInvitationToken(token);
      setShowSocialAuth(false); // Hide social auth for invitations
    }

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // Check if user is already authenticated
    checkAuthentication();
  }, [searchParams]);

  const checkAuthentication = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data && response.data.data) {
        const userData = response.data.data;
        // User is authenticated, redirect based on their status
        if (userData.company_id) {
          const userRole = userData.role?.toLowerCase();
          if (userRole === 'admin' || userRole === 'owner') {
            navigate('/dashboard');
          } else {
            navigate('/calendar');
          }
        } else {
          navigate('/profile');
        }
      }
    } catch (error) {
      // User is not authenticated, stay on signup page
      console.log('User not authenticated');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all required fields first
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    // Check if passwords match FIRST before other validations
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate terms agreement
    if (!termsAgreed) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare signup data
      const signupData: any = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        password: password,
      };

      // Add invitation token if present
      if (invitationToken) {
        signupData.token = invitationToken;
      }

      const response = await authAPI.signup(signupData);

      // Check if signup was successful (200 or 201 status code)
      if (response.status === 200 || response.status === 201) {
        console.log('Signup successful:', response.data);
        
        // If invitation token exists, handle acceptance workflow
        if (invitationToken) {
          try {
            // Accept the invitation automatically with full user details
            // Note: This would need a separate API endpoint
            // For now, redirect to dashboard after signup
            console.log('Invitation signup - redirecting to dashboard');
            navigate('/dashboard');
          } catch (acceptError) {
            console.error('Failed to accept invitation after signup:', acceptError);
            // Redirect to check email page even if acceptance fails
            navigate(`/check-email?email=${encodeURIComponent(email)}`);
          }
        } else {
          // No invitation token - redirect to check email page normally
          console.log('Regular signup - redirecting to check-email');
          navigate(`/check-email?email=${encodeURIComponent(email)}`);
        }
      } else {
        // Unexpected status code but no error thrown
        console.warn('Unexpected response status:', response.status);
        setError('Signup completed but with unexpected response. Please try logging in.');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await googleAuth.authorize();
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Failed to initiate Google signup. Please try again.');
    }
  };

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
        <div className="auth-card signup-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/salona-icon.png" alt="Salona" className="auth-logo-icon" />
            </div>
            <h1 className="auth-title">Join Salona</h1>
            <p className="auth-subtitle">Create your account and start managing your salon</p>
          </div>

          {/* Display error message if exists */}
          {error && (
            <div className="alert alert-danger" id="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first-name">
                  <i className="fas fa-user"></i>
                  First Name
                </label>
                <input
                  type="text"
                  id="first-name"
                  className="form-control"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="last-name">
                  <i className="fas fa-user"></i>
                  Last Name
                </label>
                <input
                  type="text"
                  id="last-name"
                  className="form-control"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || !!invitationToken}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <i className="fas fa-phone"></i>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                className="form-control"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">
                  <i className="fas fa-lock"></i>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">
                  <i className="fas fa-lock"></i>
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  className="form-control"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-terms">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  id="terms-agreement"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  required
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                <span>
                  I agree to the{' '}
                  <a href="/terms-of-service" className="terms-link" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy-policy" className="terms-link" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Loading spinner */}
            {isLoading && (
              <div className="auth-spinner" id="signup-spinner">
                <div className="spinner-circle"></div>
                <span>Creating your account...</span>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="spinner-circle"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>

          {showSocialAuth && (
            <>
              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <div className="social-auth">
                <button
                  className="social-btn google-btn"
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                >
                  <i className="fab fa-google"></i>
                  Google
                </button>
              </div>
            </>
          )}
        </div>

        {/* Feature highlights */}
        <div className="auth-features">
          <div className="signup-benefits">
            <h2 className="benefits-title">Why Choose Salona?</h2>
            <div className="benefit-item">
              <div className="benefit-icon">
                <i className="fas fa-rocket"></i>
              </div>
              <div className="benefit-content">
                <h3>Quick Setup</h3>
                <p>Get your salon online in minutes, not hours</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="benefit-content">
                <h3>Secure & Reliable</h3>
                <p>Bank-level security with 99.9% uptime guarantee</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <i className="fas fa-headset"></i>
              </div>
              <div className="benefit-content">
                <h3>24/7 Support</h3>
                <p>Expert support whenever you need assistance</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <i className="fas fa-chart-trend-up"></i>
              </div>
              <div className="benefit-content">
                <h3>Grow Your Business</h3>
                <p>Powerful analytics to boost your salon's success</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;

