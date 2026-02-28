import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/language-switcher.css';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('bookingLanguage', lng);
  };

  return (
    <div className="language-switcher">
      {/* Desktop: pill buttons */}
      <div className="lang-btn-group">
        <button
          className={`lang-btn ${i18n.language === 'ee' ? 'active' : ''}`}
          onClick={() => changeLanguage('ee')}
        >
          EE
        </button>
        <button
          className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
          onClick={() => changeLanguage('en')}
        >
          EN
        </button>
        <button
          className={`lang-btn ${i18n.language === 'ru' ? 'active' : ''}`}
          onClick={() => changeLanguage('ru')}
        >
          RU
        </button>
      </div>

      {/* Mobile: native select dropdown */}
      <select
        className="lang-select"
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
      >
        <option value="ee">🇪🇪 EE</option>
        <option value="en">🇬🇧 EN</option>
        <option value="ru">🇷🇺 RU</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
