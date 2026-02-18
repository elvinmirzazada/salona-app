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
  );
};

export default LanguageSwitcher;

