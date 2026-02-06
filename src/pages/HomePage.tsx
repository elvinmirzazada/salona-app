import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import '../styles/home.css';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

const HomePage: React.FC = () => {
  const features: Feature[] = [
    {
      title: 'Smart Booking System',
      description: 'Effortless appointment scheduling with automated confirmations and reminders',
      icon: 'fas fa-calendar-alt'
    },
    {
      title: 'Client Management',
      description: 'Comprehensive customer profiles with service history and preferences',
      icon: 'fas fa-users'
    },
    {
      title: 'Staff Coordination',
      description: 'Manage your team schedules, services, and availability seamlessly',
      icon: 'fas fa-user-friends'
    },
    {
      title: 'Service Catalog',
      description: 'Organize your treatments, pricing, and service packages professionally',
      icon: 'fas fa-cut'
    },
    {
      title: 'Real-time Notifications',
      description: 'Stay updated with instant notifications for bookings and business activities',
      icon: 'fas fa-bell'
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track performance, revenue, and business insights with detailed analytics',
      icon: 'fas fa-chart-line'
    }
  ];

  useEffect(() => {
    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Animate feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
      const element = card as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
      observer.observe(card);
    });

    // Animate about section
    const aboutElements = document.querySelectorAll('.about-text > *, .salon-mockup');
    aboutElements.forEach((element, index) => {
      const el = element as HTMLElement;
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
      observer.observe(element);
    });


    // Trigger counter animation when hero section is visible
    // const heroObserver = new IntersectionObserver((entries) => {
    //   entries.forEach(entry => {
    //     if (entry.isIntersecting) {
    //       const statNumbers = entry.target.querySelectorAll('.stat-number');
    //       const values = [500, 50, 99.9]; // Corresponding to the stats
    //       statNumbers.forEach((stat, index) => {
    //         setTimeout(() => {
    //           animateCounter(stat as HTMLElement, values[index]);
    //         }, index * 200);
    //       });
    //       heroObserver.unobserve(entry.target);
    //     }
    //   });
    // });


    // Floating notification animation
    const floatingNotification = document.querySelector('.floating-notification');
    if (floatingNotification) {
      const interval = setInterval(() => {
        const element = floatingNotification as HTMLElement;
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 300);
      }, 3000);

      return () => {
        clearInterval(interval);
        observer.disconnect();
        // heroObserver.disconnect();
      };
    }

    return () => {
      observer.disconnect();
      // heroObserver.disconnect();
    };
  }, []);

  return (
    <>
      <Navigation />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Transform Your <span className="gradient-text">Beauty Business</span> with Salona
              </h1>
              <p className="hero-subtitle">
                Salona is an all-in-one salon management platform designed to help beauty professionals streamline bookings, manage clients, automate daily operations, and grow revenue using technology.
              </p>
              <div className="hero-buttons">
                <Link to="/signup" className="btn btn-primary">
                  <i className="fas fa-rocket"></i>
                  Start Free Trial
                </Link>
                {/*<a href="#features" className="btn btn-secondary">*/}
                {/*  <i className="fas fa-play-circle"></i>*/}
                {/*  Watch Demo*/}
                {/*</a>*/}
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">Early Access</span>
                  <span className="stat-label">Now Open for Salons</span>
                </div>
                <div className="stat">
                  <span className="stat-number">MVP Live</span>
                  <span className="stat-label">Actively Tested with Partners</span>
                </div>
                <div className="stat">
                  <span className="stat-number">Founder-Built</span>
                  <span className="stat-label">With Real Salon Feedback</span>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-card salon-dashboard">
                <div className="card-header">
                  <div className="card-title">
                    <i className="fas fa-calendar-alt"></i>
                    Today's Schedule
                  </div>
                </div>
                <div className="card-content">
                  <div className="appointment-item">
                    <div className="appointment-time">09:30</div>
                    <div className="appointment-details">
                      <div className="client-name">Sarah Reliika</div>
                      <div className="service">Hair Cut & Style</div>
                    </div>
                    <div className="appointment-status confirmed">Confirmed</div>
                  </div>
                  <div className="appointment-item">
                    <div className="appointment-time">11:00</div>
                    <div className="appointment-details">
                      <div className="client-name">Maria Kungla</div>
                      <div className="service">Facial Treatment</div>
                    </div>
                    <div className="appointment-status pending">Pending</div>
                  </div>
                  <div className="appointment-item">
                    <div className="appointment-time">14:15</div>
                    <div className="appointment-details">
                      <div className="client-name">Emma Masing</div>
                      <div className="service">Manicure & Pedicure</div>
                    </div>
                    <div className="appointment-status confirmed">Confirmed</div>
                  </div>
                </div>
              </div>
              <div className="hero-card floating-notification">
                <i className="fas fa-bell"></i>
                <span>New booking from Lisa Maria</span>
              </div>
              <div className="hero-card stats-card">
                <div className="stats-item">
                  <i className="fas fa-chart-line"></i>
                  <div>
                    <div className="stats-number">+23%</div>
                    <div className="stats-label">Revenue Growth</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need to Run Your Salon</h2>
            <p className="section-subtitle">Powerful features designed specifically for beauty professionals</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="about-title">Built for Beauty Professionals</h2>
              <p className="about-description">
                Salona’s mission is to empower beauty professionals with technology that simplifies business operations, enhances client experience, and drives growth.
              </p>
              <div className="about-features">
                <div className="about-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Automated appointment reminders</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Integrated payment processing</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Staff performance tracking</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Analytics dashboard with performance and revenue insights</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Automated assistant that answers clients and books appointments for you</span>
                </div>
              </div>
              <Link to="/signup" className="btn btn-primary">
                Start Your Journey
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="about-image">
              <div className="salon-mockup">
                <div className="mockup-header">
                  <div className="mockup-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="mockup-content">
                  <div className="client-profile">
                    <div className="client-avatar">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="client-info">
                      <h4>Piret Maarin</h4>
                      <p>VIP Client • Last visit: Oct 15, 2025</p>
                    </div>
                  </div>
                  <div className="service-history">
                    <h5>Recent Services</h5>
                    <div className="service-item">
                      <span>Balayage Highlights</span>
                      <span>$185</span>
                    </div>
                    <div className="service-item">
                      <span>Deep Conditioning</span>
                      <span>$45</span>
                    </div>
                    <div className="service-item">
                      <span>Eyebrow Shaping</span>
                      <span>$35</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Elevate Your Beauty Business?</h2>
            <p className="cta-subtitle">Join a growing community of salon owners simplifying their operations with Salona.</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">
                <i className="fas fa-crown"></i>
                Start Free Trial
              </Link>
              <div className="cta-note">
                <i className="fas fa-shield-alt"></i>
                <span>No credit card required • 30-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <img src="/salona-icon.png" alt="Salona" className="nav-logo-icon" />
                <span>Salona</span>
              </div>
              <p className="footer-description">
                Empowering beauty professionals with next-generation salon management software.
              </p>
              <div className="social-links">
                <a href="https://www.facebook.com/profile.php?id=61582986749612" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.instagram.com/salona.me" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://www.linkedin.com/company/salona-me" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
            {/*<div className="footer-section">*/}
            {/*  <h4 className="footer-title">Support</h4>*/}
            {/*  <ul className="footer-links">*/}
            {/*    <li><a href="#">Help Center</a></li>*/}
            {/*    <li><a href="#">Documentation</a></li>*/}
            {/*    <li><a href="#">Contact Us</a></li>*/}
            {/*    <li><a href="#">System Status</a></li>*/}
            {/*  </ul>*/}
            {/*</div>*/}
          {/*  <div className="footer-section">*/}
          {/*    <h4 className="footer-title">Company</h4>*/}
          {/*    <ul className="footer-links">*/}
          {/*      <li><a href="#about">About Us</a></li>*/}
          {/*      <li><a href="#">Careers</a></li>*/}
          {/*      <li><a href="#">Privacy Policy</a></li>*/}
          {/*      <li><a href="#">Terms of Service</a></li>*/}
          {/*    </ul>*/}
          {/*  </div>*/}
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Salona. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage;

