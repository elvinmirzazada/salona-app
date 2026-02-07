import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/profile.css';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  languages?: string;
  profile_photo_url?: string;
  role?: string;
  role_status?: string;
  company_id?: string;
}

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Bengali',
  'Turkish', 'Dutch', 'Swedish', 'Polish', 'Danish', 'Norwegian', 'Finnish',
  'Greek', 'Czech', 'Hungarian', 'Romanian', 'Thai', 'Vietnamese', 'Indonesian',
  'Malay', 'Hebrew', 'Ukrainian', 'Persian (Farsi)', 'Urdu', 'Swahili',
  'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Punjabi', 'Malayalam',
  'Serbian', 'Croatian', 'Slovak', 'Bulgarian', 'Catalan', 'Estonian', 'Latvian',
  'Lithuanian', 'Slovenian', 'Albanian', 'Macedonian', 'Icelandic', 'Georgian',
  'Armenian', 'Azerbaijani', 'Kazakh', 'Uzbek', 'Mongolian', 'Burmese', 'Khmer',
  'Lao', 'Tagalog (Filipino)', 'Amharic', 'Nepali', 'Sinhala', 'Pashto', 'Kurdish'
].sort();

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: globalUser, loading: userLoading, refreshUser, unreadNotificationsCount } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Language dropdown
  const [languageSearch, setLanguageSearch] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [filteredLanguages, setFilteredLanguages] = useState<string[]>(LANGUAGES);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!userLoading && globalUser) {
      loadUserDataToForm(globalUser);
      setLoading(false);
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [globalUser, userLoading]);

  const loadUserDataToForm = (userData: User) => {
    setFirstName(userData.first_name || '');
    setLastName(userData.last_name || '');
    setEmail(userData.email || '');
    setPhone(userData.phone || '');
    setPosition(userData.position || '');
    // Add cache-busting query parameter to profile photo URL
    if (userData.profile_photo_url) {
      const photoUrl = userData.profile_photo_url.includes('?') 
        ? `${userData.profile_photo_url}&t=${Date.now()}`
        : `${userData.profile_photo_url}?t=${Date.now()}`;
      setProfilePhoto(photoUrl);
    } else {
      setProfilePhoto('');
    }

    // Parse languages
    if (userData.languages) {
      const langs = typeof userData.languages === 'string'
        ? userData.languages.split(',').map((l: string) => l.trim()).filter((l: string) => l)
        : userData.languages;
      setSelectedLanguages(langs);
    }
  };

  useEffect(() => {
    const filtered = LANGUAGES.filter(lang =>
      lang.toLowerCase().includes(languageSearch.toLowerCase()) &&
      !selectedLanguages.includes(lang)
    );
    setFilteredLanguages(filtered);
  }, [languageSearch, selectedLanguages]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        position,
        languages: selectedLanguages.join(',')
      };

      const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Profile updated successfully!');
        // Refresh user context to get updated data
        await refreshUser();
      } else {
        showMessage('error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingPhoto(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/users/me/profile-photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Profile photo uploaded successfully!');
        // Add cache-busting query parameter to force browser to load new image
        const newPhotoUrl = data.data.profile_photo_url + '?t=' + Date.now();
        setProfilePhoto(newPhotoUrl);
        // Refresh user context to get updated profile photo
        await refreshUser();
      } else {
        showMessage('error', data.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      showMessage('error', 'Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/users/me/profile-photo`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Profile photo removed successfully!');
        setProfilePhoto('');
        // Refresh user context to update profile photo
        await refreshUser();
      } else {
        showMessage('error', data.message || 'Failed to remove photo');
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      showMessage('error', 'Error removing photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addLanguage = (lang: string) => {
    if (!selectedLanguages.includes(lang)) {
      setSelectedLanguages([...selectedLanguages, lang]);
      setLanguageSearch('');
      setShowLanguageDropdown(false);
    }
  };

  const removeLanguage = (lang: string) => {
    setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
  };

  if (loading) {
    return (
      <>
        <Sidebar user={globalUser} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner-circle"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar user={globalUser} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        <main className="profile-page">
          <header className="profile-header">
            <div className="header-left">
              <button className="back-button" onClick={() => navigate('/dashboard')}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <h2 className="page-title">Profile</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
              {!globalUser?.company_id && (globalUser?.role === 'admin' || globalUser?.role === 'owner') && (
                <button
                  className="btn-primary"
                  onClick={() => navigate('/company-settings')}
                >
                  <i className="fas fa-plus"></i> Create Company
                </button>
              )}
              <UserProfile user={globalUser} />
            </div>
          </header>

          {message && (
            <div className={`alert alert-${message.type}`}>
              <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              {message.text}
            </div>
          )}

          <div className="profile-content">
            {!globalUser?.company_id && (globalUser?.role === 'admin' || globalUser?.role === 'owner') && (
              <div className="profile-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', border: '2px solid #8B5CF6' }}>
                <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                  <i className="fas fa-building" style={{ fontSize: '3rem', color: '#8B5CF6', marginBottom: '1rem' }}></i>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6B21A8', marginBottom: '0.5rem' }}>
                    Create Your Company
                  </h3>
                  <p style={{ color: '#7C3AED', marginBottom: '1.5rem' }}>
                    Set up your company to start managing your business with Salona
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => navigate('/company-settings')}
                    style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                  >
                    <i className="fas fa-plus"></i> Create Company Now
                  </button>
                </div>
              </div>
            )}

            <div className="profile-card">
              <div className="card-header">
                <h2>Profile Information</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* Profile Photo Section */}
                  <div className="form-group profile-photo-section">
                    <label>Profile Photo</label>
                    <div className="profile-photo-container">
                      <div className="profile-photo-preview">
                        {uploadingPhoto ? (
                          <div className="profile-photo-placeholder">
                            <i className="fas fa-spinner fa-spin"></i>
                          </div>
                        ) : profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="profile-photo-img" />
                        ) : (
                          <div className="profile-photo-placeholder">
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                      </div>
                      <div className="profile-photo-actions">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                        >
                          {uploadingPhoto ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i> Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-upload"></i> Upload Photo
                            </>
                          )}
                        </button>
                        {profilePhoto && (
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={handleRemovePhoto}
                            disabled={uploadingPhoto}
                          >
                            <i className="fas fa-trash"></i> Remove
                          </button>
                        )}
                        <small className="form-text">
                          Recommended: Square image, at least 200x200px, max. 5 MB
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="first-name">First Name</label>
                    <input
                      type="text"
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="last-name">Last Name</label>
                    <input
                      type="text"
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="languages">Languages</label>
                    <div className="language-select-wrapper">
                      <div className="language-search-container">
                        <input
                          type="text"
                          className="language-search-input"
                          placeholder="Search languages..."
                          value={languageSearch}
                          onChange={(e) => setLanguageSearch(e.target.value)}
                          onFocus={() => setShowLanguageDropdown(true)}
                          onBlur={() => setTimeout(() => setShowLanguageDropdown(false), 200)}
                        />
                        <i className="fas fa-search search-icon"></i>
                      </div>
                      {showLanguageDropdown && (
                        <div className="language-dropdown">
                          {filteredLanguages.length > 0 ? (
                            filteredLanguages.map(lang => (
                              <div
                                key={lang}
                                className="language-option"
                                onClick={() => addLanguage(lang)}
                              >
                                {lang}
                              </div>
                            ))
                          ) : (
                            <div className="no-results">No languages found</div>
                          )}
                        </div>
                      )}
                      <div className="selected-languages">
                        {selectedLanguages.map(lang => (
                          <div key={lang} className="language-chip">
                            <span>{lang}</span>
                            <button
                              type="button"
                              className="language-chip-remove"
                              onClick={() => removeLanguage(lang)}
                              aria-label={`Remove ${lang}`}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="position">Position</label>
                    <input
                      type="text"
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      maxLength={250}
                      placeholder="e.g., Stylist, Hairdresser..."
                    />
                    <small className="form-text">Maximum 250 characters</small>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Saving...
                        </>
                      ) : (
                        <>Save Profile</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ProfilePage;

