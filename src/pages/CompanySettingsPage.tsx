import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/company-settings.css';

interface Company {
  id: string;
  name: string;
  type?: string;
  logo_url?: string;
  website?: string;
  description?: string;
  team_size?: number;
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

const CompanySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshUser, unreadNotificationsCount } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company-details');
  const isLoadingRef = useRef(false);

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

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCompanyData = useCallback(async (companyId: string) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    try {
      // Load company details
      const companyResponse = await fetch(`${API_BASE_URL}/v1/companies/${companyId}`, {
        credentials: 'include'
      });
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        if (companyData.success && companyData.data) {
          setCompany(companyData.data);
          setCompanyName(companyData.data.name || '');
          setCompanyType(companyData.data.type || '');
          setCompanyLogoUrl(companyData.data.logo_url || '');
          setCompanyWebsite(companyData.data.website || '');
          setCompanyDescription(companyData.data.description || '');
          setCompanyTeamSize(companyData.data.team_size || 1);
        }
      }

      // Load emails
      const emailsResponse = await fetch(`${API_BASE_URL}/v1/companies/all/emails`, {
        credentials: 'include'
      });
      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        if (emailsData.success && emailsData.data && emailsData.data.length > 0) {
          setEmails(emailsData.data);
        }
      }

      // Load phones
      const phonesResponse = await fetch(`${API_BASE_URL}/v1/companies/all/phones`, {
        credentials: 'include'
      });
      if (phonesResponse.ok) {
        const phonesData = await phonesResponse.json();
        if (phonesData.success && phonesData.data && phonesData.data.length > 0) {
          setPhones(phonesData.data);
        }
      }

      // Load address
      const addressResponse = await fetch(`${API_BASE_URL}/v1/companies/${companyId}/address`, {
        credentials: 'include'
      });
      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
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

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: companyName,
          type: companyType,
          logo_url: companyLogoUrl,
          website: companyWebsite,
          description: companyDescription,
          team_size: companyTeamSize
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Company created successfully!');
        // Refresh user data to get the new company_id
        await refreshUser();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showMessage('error', data.message || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      showMessage('error', 'Error creating company');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCompanyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/companies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: companyName,
          type: companyType,
          logo_url: companyLogoUrl,
          website: companyWebsite,
          description: companyDescription,
          team_size: companyTeamSize
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Company details updated successfully!');
        // Update company state with the response data if available
        if (data.data) {
          setCompany(data.data);
        }
      } else {
        showMessage('error', data.message || 'Failed to update company');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      showMessage('error', 'Error updating company');
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

      const response = await fetch(`${API_BASE_URL}/v1/companies/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          emails: formattedEmails,
          company_id: company.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Company emails saved successfully!');
        // Update emails state if the response includes the saved data
        if (data.data && data.data.length > 0) {
          setEmails(data.data);
        }
      } else {
        showMessage('error', data.message || 'Failed to save emails');
      }
    } catch (error) {
      console.error('Error saving emails:', error);
      showMessage('error', 'Error saving emails');
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

      const response = await fetch(`${API_BASE_URL}/v1/companies/phones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          company_phones: formattedPhones,
          company_id: company.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Company phone numbers saved successfully!');
        // Update phones state if the response includes the saved data
        if (data.data && data.data.length > 0) {
          setPhones(data.data);
        }
      } else {
        showMessage('error', data.message || 'Failed to save phones');
      }
    } catch (error) {
      console.error('Error saving phones:', error);
      showMessage('error', 'Error saving phones');
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

      const response = await fetch(`${API_BASE_URL}/v1/companies/address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addressData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Company address saved successfully!');
        // Address state is already updated, no need to reload
      } else {
        showMessage('error', data.message || 'Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      showMessage('error', 'Error saving address');
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
      if (!confirm('Are you sure you want to delete this email?')) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/v1/companies/emails/${emailToRemove.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showMessage('success', 'Email deleted successfully!');
          setEmails(emails.filter((_, i) => i !== index));
        } else {
          showMessage('error', data.message || 'Failed to delete email');
        }
      } catch (error) {
        console.error('Error deleting email:', error);
        showMessage('error', 'Error deleting email');
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
      if (!confirm('Are you sure you want to delete this phone number?')) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/v1/companies/phones/${phoneToRemove.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showMessage('success', 'Phone number deleted successfully!');
          setPhones(phones.filter((_, i) => i !== index));
        } else {
          showMessage('error', data.message || 'Failed to delete phone number');
        }
      } catch (error) {
        console.error('Error deleting phone:', error);
        showMessage('error', 'Error deleting phone number');
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
            <p>Loading...</p>
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
              <h2 className="page-title">Company Settings</h2>
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
                  <h2>Create Company</h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handleCreateCompany}>
                    <div className="form-group">
                      <label htmlFor="company-name">Company Name *</label>
                      <input
                        type="text"
                        id="company-name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-type">Business Type</label>
                      <input
                        type="text"
                        id="company-type"
                        value={companyType}
                        onChange={(e) => setCompanyType(e.target.value)}
                        placeholder="e.g., Salon, Spa, Barbershop"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-logo-url">Company Logo URL</label>
                      <input
                        type="url"
                        id="company-logo-url"
                        value={companyLogoUrl}
                        onChange={(e) => setCompanyLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-website">Website</label>
                      <input
                        type="url"
                        id="company-website"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-description">Description</label>
                      <textarea
                        id="company-description"
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        rows={3}
                        placeholder="Tell us about your business..."
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company-team-size">Team Size</label>
                      <input
                        type="number"
                        id="company-team-size"
                        value={companyTeamSize}
                        onChange={(e) => setCompanyTeamSize(parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Creating...
                          </>
                        ) : (
                          'Save Company'
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
                      <span>Company Details</span>
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'company-emails' ? 'active' : ''}`}
                      onClick={() => setActiveTab('company-emails')}
                    >
                      <i className="fas fa-envelope"></i>
                      <span>Company Emails</span>
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'company-phones' ? 'active' : ''}`}
                      onClick={() => setActiveTab('company-phones')}
                    >
                      <i className="fas fa-phone"></i>
                      <span>Phone Numbers</span>
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'company-address' ? 'active' : ''}`}
                      onClick={() => setActiveTab('company-address')}
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      <span>Company Address</span>
                    </button>
                  </div>

                  <div className="tabs-content">
                    {/* Tab 1: Company Details */}
                    {activeTab === 'company-details' && (
                      <div className="tab-panel active">
                        <form onSubmit={handleUpdateCompanyDetails}>
                          <div className="form-group">
                            <label htmlFor="details-company-name">Company Name *</label>
                            <input
                              type="text"
                              id="details-company-name"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-logo-url">Company Logo URL</label>
                            <input
                              type="url"
                              id="details-company-logo-url"
                              value={companyLogoUrl}
                              onChange={(e) => setCompanyLogoUrl(e.target.value)}
                              placeholder="https://example.com/logo.png"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-website">Website</label>
                            <input
                              type="url"
                              id="details-company-website"
                              value={companyWebsite}
                              onChange={(e) => setCompanyWebsite(e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-description">Description</label>
                            <textarea
                              id="details-company-description"
                              value={companyDescription}
                              onChange={(e) => setCompanyDescription(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-team-size">Team Size</label>
                            <input
                              type="number"
                              id="details-company-team-size"
                              value={companyTeamSize}
                              onChange={(e) => setCompanyTeamSize(parseInt(e.target.value) || 1)}
                              min="1"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="details-company-type">Business Type</label>
                            <input
                              type="text"
                              id="details-company-type"
                              value={companyType}
                              onChange={(e) => setCompanyType(e.target.value)}
                            />
                          </div>

                          <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={saving}>
                              {saving ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i> Saving...
                                </>
                              ) : (
                                'Save Details'
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
                            <i className="fas fa-plus"></i> Add Email
                          </button>
                        </div>
                        <form onSubmit={handleSaveEmails}>
                          <div className="emails-container">
                            {emails.map((email, index) => (
                              <div key={index} className="email-entry">
                                <div className="form-row">
                                  <div className="form-group flex-grow">
                                    <label>Email</label>
                                    <input
                                      type="email"
                                      value={email.email}
                                      onChange={(e) => updateEmail(index, 'email', e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Type</label>
                                    <select
                                      value={email.type}
                                      onChange={(e) => updateEmail(index, 'type', e.target.value)}
                                    >
                                      <option value="primary">Primary</option>
                                      <option value="billing">Billing</option>
                                      <option value="support">Support</option>
                                      <option value="other">Other</option>
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
                                  <i className="fas fa-spinner fa-spin"></i> Saving...
                                </>
                              ) : (
                                'Save Emails'
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
                            <i className="fas fa-plus"></i> Add Phone
                          </button>
                        </div>
                        <form onSubmit={handleSavePhones}>
                          <div className="phones-container">
                            {phones.map((phone, index) => (
                              <div key={index} className="phone-entry">
                                <div className="form-row">
                                  <div className="form-group flex-grow">
                                    <label>Phone Number</label>
                                    <input
                                      type="tel"
                                      value={phone.phone}
                                      onChange={(e) => updatePhone(index, 'phone', e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Type</label>
                                    <select
                                      value={phone.type}
                                      onChange={(e) => updatePhone(index, 'type', e.target.value)}
                                    >
                                      <option value="primary">Primary</option>
                                      <option value="business">Business</option>
                                      <option value="mobile">Mobile</option>
                                      <option value="fax">Fax</option>
                                      <option value="other">Other</option>
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
                                  <i className="fas fa-spinner fa-spin"></i> Saving...
                                </>
                              ) : (
                                'Save Phone Numbers'
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
