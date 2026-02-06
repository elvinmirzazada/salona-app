import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/navigation.css';

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu on window resize if screen becomes larger
    const handleResize = () => {
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    closeMobileMenu();

    // If we're not on the homepage, navigate to homepage with hash
    if (!isHomePage) {
      navigate(`/${targetId}`);
      return;
    }

    // If we're on homepage, smooth scroll to section
    const targetSection = document.querySelector(targetId);
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Handle hash navigation on homepage load (when coming from other pages with hash)
  useEffect(() => {
    if (isHomePage && location.hash) {
      setTimeout(() => {
        const targetSection = document.querySelector(location.hash);
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  }, [isHomePage, location.hash]);

  return (
    <>
      <nav
        className="navbar"
        style={{
          background: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          boxShadow: isScrolled ? '0 2px 20px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        <div className="nav-container">
          <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
            <img src="/salona-icon.png" alt="Salona" className="nav-logo-icon" />
            <span>Salona</span>
          </Link>
          <div className={`nav-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
            <a
              href="#features"
              className="nav-link"
              onClick={(e) => handleNavLinkClick(e, '#features')}
            >
              Features
            </a>
            <a
              href="#about"
              className="nav-link"
              onClick={(e) => handleNavLinkClick(e, '#about')}
            >
              About
            </a>
            <a
              href="#contact"
              className="nav-link"
              onClick={(e) => handleNavLinkClick(e, '#contact')}
            >
              Contact
            </a>
            <Link to="/login" className="nav-link login-btn" onClick={closeMobileMenu}>Login</Link>
            <Link to="/signup" className="nav-link signup-btn" onClick={closeMobileMenu}>Get Started</Link>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </nav>
      <div
        className={`nav-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      ></div>
    </>
  );
};

export default Navigation;

