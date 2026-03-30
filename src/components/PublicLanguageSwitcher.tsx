import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import '../styles/language-switcher.css';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

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
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="language-switcher-admin">
      {/* Desktop: Dropdown with flags and labels */}
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

      {/* Mobile: native select dropdown */}
      <select
        className="lang-select-mobile"
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>

      {/* Backdrop for mobile dropdown */}
      {isOpen && <div className="lang-backdrop" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default LanguageSwitcher;
