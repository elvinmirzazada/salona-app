import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useUser } from '../contexts/UserContext';
import { authAPI } from '../utils/api';
import { googleAuth } from '../utils/googleAuth';
import '../styles/auth.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user is already authenticated, redirect them
    if (!userLoading && user) {
      redirectBasedOnUser(user);
    }
  }, [user, userLoading]);

  const redirectBasedOnUser = (userData: any) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login(email, password);

      if (response.status === 200 && response.data.success) {
        console.log('Login successful, refreshing user context...');
        
        // CRITICAL: Refresh user context to get fresh data
        await refreshUser();
        
        // The redirect will happen automatically via useEffect when user state updates
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleAuth.authorize();
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to initiate Google login. Please try again.');
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
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/salona-icon.png" alt="Salona" className="auth-logo-icon" />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your Salona account</p>
          </div>

          {/* Display error message if exists */}
          {error && (
            <div className="alert alert-danger" id="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-options">
              {/*<label className="checkbox-container">*/}
              {/*  <input*/}
              {/*    type="checkbox"*/}
              {/*    id="remember-me"*/}
              {/*    checked={rememberMe}*/}
              {/*    onChange={(e) => setRememberMe(e.target.checked)}*/}
              {/*    disabled={isLoading}*/}
              {/*  />*/}
              {/*  <span className="checkmark"></span>*/}
              {/*  Remember me*/}
              {/*</label>*/}
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="spinner-circle"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup" className="auth-link">Create one here</Link></p>
          </div>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-auth">
            <button
              className="social-btn google-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <i className="fab fa-google"></i>
              Google
            </button>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="auth-features">
          <div className="feature-highlight">
            <div className="feature-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div>
              <h3>Smart Scheduling</h3>
              <p>Effortless appointment management with automated reminders</p>
            </div>
          </div>
          <div className="feature-highlight">
            <div className="feature-icon">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <h3>Client Management</h3>
              <p>Comprehensive customer profiles and service history</p>
            </div>
          </div>
          <div className="feature-highlight">
            <div className="feature-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div>
              <h3>Business Insights</h3>
              <p>Real-time analytics to grow your salon business</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;


