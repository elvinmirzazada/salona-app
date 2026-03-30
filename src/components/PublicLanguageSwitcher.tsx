import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import '../styles/language-switcher.css';

const PublicLanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const languages = [
    { code: 'ee', label: 'Eesti', flag: '🇪🇪', name: 'Estonian' },
    { code: 'en', label: 'English', flag: '🇬🇧', name: 'English' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺', name: 'Russian' }
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);

    // Save to general app storage for unauthenticated users
    localStorage.setItem('appLanguage', lng);

    // If user is logged in, also save user-specific language preference
    if (user) {
      localStorage.setItem(`userLanguage_${user.id}`, lng);
    }

    setIsOpen(false);
    setIsDrawerOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <>
      {/* Desktop: Dropdown with flags and labels */}
      <div className="language-switcher-admin">
        <div className="lang-dropdown-container">
          <button
            className="lang-dropdown-btn"
            onClick={() => setIsOpen(!isOpen)}
            title="Change language"
          >
            <span className="lang-flag">{currentLanguage.flag}</span>
            <span className="lang-label">{currentLanguage.label}</span>
            <svg
              className={`lang-dropdown-arrow ${isOpen ? 'open' : ''}`}
              fill="none"
              viewBox="0 0 10 6"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 4 4 4-4"
              />
            </svg>
          </button>

          {isOpen && (
            <div className="lang-dropdown-menu">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  className={`lang-dropdown-item ${i18n.language === lang.code ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  <span className="lang-item-flag">{lang.flag}</span>
                  <div className="lang-item-content">
                    <div className="lang-item-label">{lang.label}</div>
                    <div className="lang-item-name">{lang.name}</div>
                  </div>
                  {i18n.language === lang.code && (
                    <svg className="lang-checkmark" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Language selection drawer */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lang-drawer-backdrop"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className={`lang-drawer-panel ${isDrawerOpen ? 'open' : ''}`}>
            <div className="lang-drawer-header">
              <h3 className="lang-drawer-title">Select Language</h3>
              <button
                className="lang-drawer-close"
                onClick={() => setIsDrawerOpen(false)}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="lang-drawer-content">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  className={`lang-drawer-item ${i18n.language === lang.code ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  <span className="lang-drawer-flag">{lang.flag}</span>
                  <div className="lang-drawer-text">
                    <div className="lang-drawer-lang">{lang.label}</div>
                    <div className="lang-drawer-name">{lang.name}</div>
                  </div>
                  {i18n.language === lang.code && (
                    <svg className="lang-drawer-check" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PublicLanguageSwitcher;
