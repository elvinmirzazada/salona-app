import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../utils/api';
import '../styles/company-settings.css';

interface Company {
  id: string;
  name: string;
  type?: string;
  logo_url?: string;
  website?: string;
  description?: string;
  team_size?: number;
  timezone?: string;
}

interface Email {
  id?: string;
  email: string;
  type: string;
}

interface Phone {
  id?: string;
  phone: string;
  type: string;
  is_primary?: boolean;
}

interface Address {
  street?: string; // Used in UI, maps to 'address' in API
  city?: string;
  country?: string;
  zip?: string;
  is_primary?: boolean;
}

// Timezone list for dropdown
const TIMEZONES = [
  { value: 'UTC', label: '(UTC+00:00) UTC' },
  { value: 'Europe/London', label: '(UTC+00:00) London' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Berlin, Rome' },
  { value: 'Europe/Athens', label: '(UTC+02:00) Athens, Bucharest, Helsinki' },
  { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow, St. Petersburg' },
  { value: 'Europe/Istanbul', label: '(UTC+03:00) Istanbul' },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai, Abu Dhabi' },
  { value: 'Asia/Karachi', label: '(UTC+05:00) Karachi, Tashkent' },
  { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka, Astana' },
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Jakarta' },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Shanghai, Hong Kong' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Seoul' },
  { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney, Melbourne' },
  { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland, Wellington' },
  { value: 'America/New_York', label: '(UTC-05:00) New York, Washington' },
  { value: 'America/Chicago', label: '(UTC-06:00) Chicago, Dallas' },
  { value: 'America/Denver', label: '(UTC-07:00) Denver, Phoenix' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Los Angeles, San Francisco' },
  { value: 'America/Anchorage', label: '(UTC-09:00) Anchorage' },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Honolulu' },
  { value: 'America/Sao_Paulo', label: '(UTC-03:00) São Paulo, Buenos Aires' },
  { value: 'America/Mexico_City', label: '(UTC-06:00) Mexico City, Monterrey' },
  { value: 'Europe/Tallinn', label: '(UTC+02:00) Tallinn' },
  { value: 'Europe/Riga', label: '(UTC+02:00) Riga' },
  { value: 'Europe/Vilnius', label: '(UTC+02:00) Vilnius' },
];

const CompanySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshUser, unreadNotificationsCount } = useUser();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company-details');
  const isLoadingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Company data
  const [hasCompany, setHasCompany] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [emails, setEmails] = useState<Email[]>([{ email: '', type: 'primary' }]);
  const [phones, setPhones] = useState<Phone[]>([{ phone: '', type: 'primary' }]);
  const [address, setAddress] = useState<Address>({});

  // Create company form
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyTeamSize, setCompanyTeamSize] = useState(1);
  const [companyTimezone, setCompanyTimezone] = useState('UTC');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCompanyData = useCallback(async (companyId: string) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    try {
      // Load company details
      const companyResponse = await apiClient.get(`/v1/companies/${companyId}`);
      const companyData = companyResponse.data;
      if (companyData.success && companyData.data) {
        setCompany(companyData.data);
        setCompanyName(companyData.data.name || '');
        setCompanyType(companyData.data.type || '');
        setCompanyLogoUrl(companyData.data.logo_url || '');
        setLogoPreview(companyData.data.logo_url || '');
        setCompanyWebsite(companyData.data.website || '');
        setCompanyDescription(companyData.data.description || '');
        setCompanyTeamSize(companyData.data.team_size || 1);
        setCompanyTimezone(companyData.data.timezone || 'UTC');
      }

      // Load emails
      const emailsResponse = await apiClient.get('/v1/companies/all/emails');
      const emailsData = emailsResponse.data;
      if (emailsData.success && emailsData.data && emailsData.data.length > 0) {
        setEmails(emailsData.data);
      }

      // Load phones
      const phonesResponse = await apiClient.get('/v1/companies/all/phones');
      const phonesData = phonesResponse.data;
      if (phonesData.success && phonesData.data && phonesData.data.length > 0) {
        setPhones(phonesData.data);
      }

      // Load address
      const addressResponse = await apiClient.get(`/v1/companies/${companyId}/address`);
      const addressData = addressResponse.data;
      if (addressData.success && addressData.data) {
        // Map API 'address' field to UI 'street' field
        setAddress({
          street: addressData.data.address || '',
          city: addressData.data.city || '',
          country: addressData.data.country || '',
          zip: addressData.data.zip || '',
          is_primary: addressData.data.is_primary || false
        });
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      if (user.company_id) {
        setHasCompany(true);
        loadCompanyData(user.company_id);
      } else {
        setHasCompany(false);
        setLoading(false);
      }
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user?.company_id, userLoading, loadCompanyData]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', t('companySettings.selectImageFile'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', t('companySettings.imageSizeTooLarge'));
      return;
    }

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/v1/companies/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data;

      if (data?.success !== false) {
        showMessage('success', t('companySettings.logoUploadedSuccessfully'));

        // Update the logo URL and preview
        if (data.data && data.data.logo_url) {
          setCompanyLogoUrl(data.data.logo_url);
          setLogoPreview(data.data.logo_url);

          // Update company state
          if (company) {
            setCompany({ ...company, logo_url: data.data.logo_url });
          }
        }
      } else {
        showMessage('error', data.message || t('companySettings.failedToUploadLogo'));
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showMessage('error', t('companySettings.errorUploadingLogo'));
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = async () => {
    if (!confirm(t('companySettings.removeLogoConfirm'))) {
      return;
    }

    try {
      setUploadingLogo(true);

      // You can implement a DELETE endpoint or just update the company with empty logo_url
      const response = await apiClient.delete('/v1/companies/logo', {
        data: {
          name: companyName,
          type: companyType,
          logo_url: '',
          website: companyWebsite,
          description: companyDescription,
          team_size: companyTeamSize,
          timezone: companyTimezone
        }
      });
      const data = response.data;

      if (data?.success !== false) {
        showMessage('success', t('companySettings.logoRemovedSuccessfully'));
        setCompanyLogoUrl('');
        setLogoPreview('');
        if (company) {
          setCompany({ ...company, logo_url: '' });
        }
      } else {
        showMessage('error', data.message || t('companySettings.failedToRemoveLogo'));
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      showMessage('error', t('companySettings.errorRemovingLogo'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await apiClient.post('/v1/companies', {
        name: companyName,
        type: companyType,
        logo_url: companyLogoUrl,
        website: companyWebsite,
        description: companyDescription,
        team_size: companyTeamSize,
        timezone: companyTimezone
      });
      const data = response.data;

      if (data?.success !== false) {
        showMessage('success', t('companySettings.companyCreatedSuccessfully'));
        // Refresh user data to get the new company_id
        await refreshUser();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showMessage('error', data.message || t('companySettings.failedToCreateCompany'));
      }
    } catch (error) {
      console.error('Error creating company:', error);
      showMessage('error', t('companySettings.errorCreatingCompany'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCompanyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    setSaving(true);

    try {
      const response = await apiClient.patch('/v1/companies', {
        name: companyName,
        type: companyType,
        logo_url: companyLogoUrl,
        website: companyWebsite,
        description: companyDescription,
        team_size: companyTeamSize,
        timezone: companyTimezone
      });
      const data = response.data;

      if (data?.success !== false) {
        showMessage('success', t('companySettings.companyDetailsUpdatedSuccessfully'));
        // Update company state with the response data if available
        if (data.data) {
          setCompany(data.data);
        }
      } else {
        showMessage('error', data.message || t('companySettings.failedToUpdateDetails'));
      }
    } catch (error) {
      console.error('Error updating company:', error);
      showMessage('error', t('companySettings.errorUpdatingDetails'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    setSaving(true);

    try {
      // Format emails with status field
      const formattedEmails = emails.map(email => ({
        email: email.email,
        type: email.type,
        status: 'primary' // Add status field
      }));

      const response = await apiClient.post('/v1/companies/emails', {
        emails: formattedEmails,
        company_id: company.id
      });
      const data = response.data;

      if (data?.success !== false) {
        showMessage('success', t('companySettings.emailsSavedSuccessfully'));
        // Update emails state if the response includes the saved data
        if (data.data && data.data.length > 0) {
          setEmails(data.data);
        }
      } else {
        showMessage('error', data.message || t('companySettings.failedToSaveEmails'));
      }
    } catch (error) {
      console.error('Error saving emails:', error);
      showMessage('error', t('companySettings.errorSavingEmails'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhones = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    setSaving(true);

    try {
      // Format phones to match API requirements
      const formattedPhones = phones.map((phone, index) => ({
        phone: phone.phone,
        is_primary: index === 0 || phone.type === 'primary' // First phone or explicitly marked as primary
      }));

      const response = await apiClient.post('/v1/companies/phones', {
        company_phones: formattedPhones,
        company_id: company.id
      });
      const data = response.data;

      if (data?.success !== false) {
        showMessage('success', t('companySettings.phonesSavedSuccessfully'));
        // Update phones state if the response includes the saved data
        if (data.data && data.data.length > 0) {
          setPhones(data.data);
        }
      } else {
        showMessage('error', data.message || t('companySettings.failedToSavePhones'));
      }
    } catch (error) {
      console.error('Error saving phones:', error);
      showMessage('error', t('companySettings.errorSavingPhones'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    setSaving(true);

    try {
      // Format address data to match API requirements
      const addressData = {
        address: address.street || '', // Map 'street' to 'address'
        city: address.city || '',
        zip: address.zip || '',
        country: address.country || '',
        is_primary: address.is_primary || false
      };

      const response = await apiClient.post('/v1/companies/address', addressData);
      const data = response.data;

      if (data?.success !== false) {
        showMessage('success', t('companySettings.addressSavedSuccessfully'));
        // Address state is already updated, no need to reload
      } else {
        showMessage('error', data.message || t('companySettings.failedToSaveAddress'));
      }
    } catch (error) {
      console.error('Error saving address:', error);
      showMessage('error', t('companySettings.errorSavingAddress'));
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    setEmails([...emails, { email: '', type: 'other' }]);
  };

  const removeEmail = async (index: number) => {
    if (emails.length === 1) {
      showMessage('error', 'At least one email is required');
      return;
    }

    const emailToRemove = emails[index];

    // If the email has an ID, call the DELETE API
    if (emailToRemove.id) {
      if (!confirm(t('companySettings.deleteEmailConfirm'))) {
        return;
      }

      try {
        const response = await apiClient.delete(`/v1/companies/emails/${emailToRemove.id}`);
        const data = response.data;

        if (data?.success !== false) {
          showMessage('success', t('companySettings.emailDeletedSuccessfully'));
          setEmails(emails.filter((_, i) => i !== index));
        } else {
          showMessage('error', data.message || t('companySettings.failedToDeleteEmail'));
        }
      } catch (error) {
        console.error('Error deleting email:', error);
        showMessage('error', t('companySettings.errorDeletingEmail'));
      }
    } else {
      // If no ID, just remove from local state (it's a new email that hasn't been saved)
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, field: 'email' | 'type', value: string) => {
    const newEmails = [...emails];
    newEmails[index][field] = value;
    setEmails(newEmails);
  };

  const addPhone = () => {
    setPhones([...phones, { phone: '', type: 'other' }]);
  };

  const removePhone = async (index: number) => {
    if (phones.length === 1) {
      showMessage('error', 'At least one phone number is required');
      return;
    }

    const phoneToRemove = phones[index];

    // If the phone has an ID, call the DELETE API
    if (phoneToRemove.id) {
      if (!confirm(t('companySettings.deletePhoneConfirm'))) {
        return;
      }

      try {
        const response = await apiClient.delete(`/v1/companies/phones/${phoneToRemove.id}`);
        const data = response.data;

        if (data?.success !== false) {
          showMessage('success', t('companySettings.phoneDeletedSuccessfully'));
          setPhones(phones.filter((_, i) => i !== index));
        } else {
          showMessage('error', data.message || t('companySettings.failedToDeletePhone'));
        }
      } catch (error) {
        console.error('Error deleting phone:', error);
        showMessage('error', t('companySettings.errorDeletingPhone'));
      }
    } else {
      // If no ID, just remove from local state (it's a new phone that hasn't been saved)
      setPhones(phones.filter((_, i) => i !== index));
    }
  };

  const updatePhone = (index: number, field: 'phone' | 'type', value: string) => {
    const newPhones = [...phones];
    newPhones[index][field] = value;
    setPhones(newPhones);
  };

  if (loading) {
    return (
      <>
        <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner-circle"></div>
            <p>{t('companySettings.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        <main className="company-settings-page">
          <header className="settings-header">
            <div className="header-left">
              <button className="back-button" onClick={() => navigate('/dashboard')}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <h2 className="page-title">{t('companySettings.title')}</h2>
            </div>
            <UserProfile user={user} />
          </header>

          {message && (
            <div className={`alert alert-${message.type}`}>
              <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              {message.text}
            </div>
          )}

          <div className="settings-content">
            {!hasCompany ? (
              // Create Company Form
              <div className="settings-card">
                <div className="card-header">
                  <h2>{t('companySettings.createCompany')}</h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handleCreateCompany}>
                    <div className="form-group">
                      <label htmlFor="company-name">{t('companySettings.companyNameLabel')}</label>
                      <input
                        type="text"
                        id="company-name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-type">{t('companySettings.businessTypeLabel')}</label>
                      <input
                        type="text"
                        id="company-type"
                        value={companyType}
                        onChange={(e) => setCompanyType(e.target.value)}
                        placeholder={t('companySettings.businessTypePlaceholder')}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('companySettings.companyLogoLabel')}</label>
                      <div className="logo-upload-container">
                        <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                          <i className="fas fa-info-circle"></i>
                          <span>{t('companySettings.pleaseUploadLogo')}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-upload-logo"
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        >
                          <i className="fas fa-cloud-upload-alt"></i>
                          <span>{t('companySettings.uploadCompanyLogo')}</span>
                          <small>{t('companySettings.availableAfterCreation')}</small>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-website">{t('companySettings.websiteLabel')}</label>
                      <input
                        type="url"
                        id="company-website"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder={t('companySettings.websitePlaceholder')}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-description">{t('companySettings.descriptionLabel')}</label>
                      <textarea
                        id="company-description"
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        rows={3}
                        placeholder={t('companySettings.descriptionPlaceholder')}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-team-size">{t('companySettings.teamSizeLabel')}</label>
                      <input
                        type="number"
                        id="company-team-size"
                        value={companyTeamSize}
                        onChange={(e) => setCompanyTeamSize(parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-timezone">{t('companySettings.timezoneLabel')}</label>
                      <select
                        id="company-timezone"
                        value={companyTimezone}
                        onChange={(e) => setCompanyTimezone(e.target.value)}
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> {t('companySettings.creating')}
                          </>
                        ) : (
                          t('companySettings.saveCompany')
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              // Company Settings Tabs
              <div className="settings-card">
                <div className="tabs-container">
                  <div className="tabs-header">
                    <button
                      className={`tab-button ${activeTab === 'company-details' ? 'active' : ''}`}
                      onClick={() => setActiveTab('company-details')}
                    >
                      <i className="fas fa-building"></i>
                      <span>{t('companySettings.companyDetailsTab')}</span>
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'company-emails' ? 'active' : ''}`}
                      onClick={() => setActiveTab('company-emails')}
                    >
                      <i className="fas fa-envelope"></i>
                      <span>{t('companySettings.companyEmailsTab')}</span>
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'company-phones' ? 'active' : ''}`}
                      onClick={() => setActiveTab('company-phones')}
                    >
                      <i className="fas fa-phone"></i>
                      <span>{t('companySettings.phoneNumbersTab')}</span>
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'company-address' ? 'active' : ''}`}
                      onClick={() => setActiveTab('company-address')}
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{t('companySettings.companyAddressTab')}</span>
                    </button>
                  </div>

                  <div className="tabs-content">
                    {/* Tab 1: Company Details */}
                    {activeTab === 'company-details' && (
                      <div className="tab-panel active">
                        <form onSubmit={handleUpdateCompanyDetails}>
                          <div className="form-group">
                            <label htmlFor="details-company-name">{t('companySettings.companyNameLabel')}</label>
                            <input
                              type="text"
                              id="details-company-name"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>{t('companySettings.companyLogoLabel')}</label>
                            <div className="logo-upload-container">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                style={{ display: 'none' }}
                              />

                              {logoPreview ? (
                                <div className="logo-preview-wrapper">
                                  <img src={logoPreview} alt="Company Logo" className="logo-preview" />
                                  <div className="logo-actions">
                                    <button
                                      type="button"
                                      className="btn-secondary btn-sm"
                                      onClick={handleLogoClick}
                                      disabled={uploadingLogo}
                                    >
                                      <i className="fas fa-sync-alt"></i> {t('companySettings.changeLogo')}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-danger btn-sm"
                                      onClick={handleRemoveLogo}
                                      disabled={uploadingLogo}
                                    >
                                      <i className="fas fa-trash-alt"></i> {t('companySettings.removeLogo')}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-upload-logo"
                                  onClick={handleLogoClick}
                                  disabled={uploadingLogo}
                                >
                                  {uploadingLogo ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i>
                                      <span>{t('companySettings.uploading')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-cloud-upload-alt"></i>
                                      <span>{t('companySettings.uploadCompanyLogo')}</span>
                                      <small>{t('companySettings.logoFileTypes')}</small>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-website">{t('companySettings.websiteLabel')}</label>
                            <input
                              type="url"
                              id="details-company-website"
                              value={companyWebsite}
                              onChange={(e) => setCompanyWebsite(e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-description">{t('companySettings.descriptionLabel')}</label>
                            <textarea
                              id="details-company-description"
                              value={companyDescription}
                              onChange={(e) => setCompanyDescription(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-team-size">{t('companySettings.teamSizeLabel')}</label>
                            <input
                              type="number"
                              id="details-company-team-size"
                              value={companyTeamSize}
                              onChange={(e) => setCompanyTeamSize(parseInt(e.target.value) || 1)}
                              min="1"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-type">{t('companySettings.businessTypeLabel')}</label>
                            <input
                              type="text"
                              id="details-company-type"
                              value={companyType}
                              onChange={(e) => setCompanyType(e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-timezone">{t('companySettings.timezoneLabel')}</label>
                            <select
                              id="details-company-timezone"
                              value={companyTimezone}
                              onChange={(e) => setCompanyTimezone(e.target.value)}
                            >
                              {TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                  {tz.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={saving}>
                              {saving ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i> {t('companySettings.saving')}
                                </>
                              ) : (
                                t('companySettings.saveDetails')
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Tab 2: Company Emails */}
                    {activeTab === 'company-emails' && (
                      <div className="tab-panel active">
                        <div className="tab-panel-header">
                          <button className="btn-primary" onClick={addEmail} type="button">
                            <i className="fas fa-plus"></i> {t('companySettings.addEmail')}
                          </button>
                        </div>
                        <form onSubmit={handleSaveEmails}>
                          <div className="emails-container">
                            {emails.map((email, index) => (
                              <div key={index} className="email-entry">
                                <div className="form-row">
                                  <div className="form-group flex-grow">
                                    <label>{t('companySettings.emailLabel')}</label>
                                    <input
                                      type="email"
                                      value={email.email}
                                      onChange={(e) => updateEmail(index, 'email', e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>{t('companySettings.typeLabel')}</label>
                                    <select
                                      value={email.type}
                                      onChange={(e) => updateEmail(index, 'type', e.target.value)}
                                    >
                                      <option value="primary">{t('companySettings.primaryType')}</option>
                                      <option value="billing">{t('companySettings.billingType')}</option>
                                      <option value="support">{t('companySettings.supportType')}</option>
                                      <option value="other">{t('companySettings.otherType')}</option>
                                    </select>
                                  </div>
                                  <div className="form-group delete-btn-group">
                                    <label>&nbsp;</label>
                                    <button
                                      type="button"
                                      className="btn-danger"
                                      onClick={() => removeEmail(index)}
                                      disabled={emails.length === 1}
                                    >
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={saving}>
                              {saving ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i> {t('companySettings.saving')}
                                </>
                              ) : (
                                t('companySettings.saveEmails')
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Tab 3: Company Phones */}
                    {activeTab === 'company-phones' && (
                      <div className="tab-panel active">
                        <div className="tab-panel-header">
                          <button className="btn-primary" onClick={addPhone} type="button">
                            <i className="fas fa-plus"></i> {t('companySettings.addPhone')}
                          </button>
                        </div>
                        <form onSubmit={handleSavePhones}>
                          <div className="phones-container">
                            {phones.map((phone, index) => (
                              <div key={index} className="phone-entry">
                                <div className="form-row">
                                  <div className="form-group flex-grow">
                                    <label>{t('companySettings.phoneNumberLabel')}</label>
                                    <input
                                      type="tel"
                                      value={phone.phone}
                                      onChange={(e) => updatePhone(index, 'phone', e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>{t('companySettings.typeLabel')}</label>
                                    <select
                                      value={phone.type}
                                      onChange={(e) => updatePhone(index, 'type', e.target.value)}
                                    >
                                      <option value="primary">{t('companySettings.primaryType')}</option>
                                      <option value="business">{t('companySettings.businessType')}</option>
                                      <option value="mobile">{t('companySettings.mobileType')}</option>
                                      <option value="fax">{t('companySettings.faxType')}</option>
                                      <option value="other">{t('companySettings.otherType')}</option>
                                    </select>
                                  </div>
                                  <div className="form-group delete-btn-group">
                                    <label>&nbsp;</label>
                                    <button
                                      type="button"
                                      className="btn-danger"
                                      onClick={() => removePhone(index)}
                                      disabled={phones.length === 1}
                                    >
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={saving}>
                              {saving ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i> {t('companySettings.saving')}
                                </>
                              ) : (
                                t('companySettings.savePhones')
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Tab 4: Company Address */}
                    {activeTab === 'company-address' && (
                      <div className="tab-panel active">
                        <form onSubmit={handleSaveAddress}>
                          <div className="form-group">
                            <label htmlFor="company-address">Street Address</label>
                            <input
                              type="text"
                              id="company-address"
                              value={address.street || ''}
                              onChange={(e) => setAddress({ ...address, street: e.target.value })}
                            />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="company-city">City</label>
                              <input
                                type="text"
                                id="company-city"
                                value={address.city || ''}
                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="company-country">Country</label>
                              <input
                                type="text"
                                id="company-country"
                                value={address.country || ''}
                                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="company-zip">ZIP/Postal Code</label>
                              <input
                                type="text"
                                id="company-zip"
                                value={address.zip || ''}
                                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={saving}>
                              {saving ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i> Saving...
                                </>
                              ) : (
                                'Save Address'
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default CompanySettingsPage;
