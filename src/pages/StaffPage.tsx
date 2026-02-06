import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/staff.css';

interface StaffMember {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    profile_photo_url?: string;
    company_id: string;
    status: string;
    position?: string;
    languages?: string;
  };
  availability?: WeeklyAvailability;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  sent_date: string;
  expires_at: string;
}

interface WeeklyAvailability {
  [key: number]: DayAvailability;
}

interface DayAvailability {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

interface StaffFormData {
  email: string;
  role: string;
  availability: WeeklyAvailability;
}

const StaffPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, unreadNotificationsCount } = useUser();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    email: '',
    role: 'staff',
    availability: {
      0: { enabled: true, start_time: '09:00', end_time: '17:00' }, // Monday
      1: { enabled: true, start_time: '09:00', end_time: '17:00' }, // Tuesday
      2: { enabled: true, start_time: '09:00', end_time: '17:00' }, // Wednesday
      3: { enabled: true, start_time: '09:00', end_time: '17:00' }, // Thursday
      4: { enabled: true, start_time: '09:00', end_time: '17:00' }, // Friday
      5: { enabled: false, start_time: '10:00', end_time: '14:00' }, // Saturday
      6: { enabled: false, start_time: '10:00', end_time: '14:00' }, // Sunday
    }
  });
  const [saving, setSaving] = useState(false);
  const [_message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchStaff();
      fetchInvitations();
    } else {
      setLoading(false);
      setInvitationsLoading(false);
    }
  }, [user]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/v1/companies/users`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.data || []);
      } else {
        console.error('Failed to fetch staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const response = await fetch(`${API_BASE_URL}/v1/companies/all/invitations`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.data || []);
      } else {
        console.error('Failed to fetch invitations');
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const handleAddStaff = () => {
    setModalMode('add');
    setEditingStaff(null);
    setFormData({
      email: '',
      role: 'staff',
      availability: {
        0: { enabled: true, start_time: '09:00', end_time: '17:00' },
        1: { enabled: true, start_time: '09:00', end_time: '17:00' },
        2: { enabled: true, start_time: '09:00', end_time: '17:00' },
        3: { enabled: true, start_time: '09:00', end_time: '17:00' },
        4: { enabled: true, start_time: '09:00', end_time: '17:00' },
        5: { enabled: false, start_time: '10:00', end_time: '14:00' },
        6: { enabled: false, start_time: '10:00', end_time: '14:00' },
      }
    });
    setShowModal(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setModalMode('edit');
    setEditingStaff(staffMember);
    setFormData({
      email: staffMember.user.email,
      role: staffMember.role,
      availability: staffMember.availability || {
        0: { enabled: true, start_time: '09:00', end_time: '17:00' },
        1: { enabled: true, start_time: '09:00', end_time: '17:00' },
        2: { enabled: true, start_time: '09:00', end_time: '17:00' },
        3: { enabled: true, start_time: '09:00', end_time: '17:00' },
        4: { enabled: true, start_time: '09:00', end_time: '17:00' },
        5: { enabled: false, start_time: '10:00', end_time: '14:00' },
        6: { enabled: false, start_time: '10:00', end_time: '14:00' },
      }
    });
    setShowModal(true);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/companies/users/${staffId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setStaff(staff.filter(s => s.id !== staffId));
      } else {
        showMessage('error', 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      showMessage('error', 'Failed to delete staff member');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/companies/invitations/${invitationId}/resend`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Invitation resent successfully!');
        fetchInvitations();
      } else {
        showMessage('error', 'Failed to resend invitation' + (data.message ? `: ${data.message}` : ''));
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      showMessage('error', 'Failed to resend invitation');
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setInvitations(invitations.filter(i => i.id !== invitationId));
      } else {
        showMessage('error', 'Failed to delete invitation');
      }
    } catch (error) {
      console.error('Error deleting invitation:', error);
      showMessage('error', 'Failed to delete invitation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.role) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const url = modalMode === 'edit' && editingStaff
        ? `${API_BASE_URL}/v1/companies/members/${editingStaff.user_id}`
        : `${API_BASE_URL}/v1/companies/invitations`;

      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
          availability: formData.availability
        }),
        credentials: 'include'
      });

      if (response.ok) {
        if (modalMode === 'add') {
          alert('Invitation sent successfully');
          fetchInvitations();
        } else {
          alert('Staff member updated successfully');
          fetchStaff();
        }
        setShowModal(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message || `Failed to ${modalMode === 'edit' ? 'update' : 'invite'} staff member`);
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      alert(`Failed to ${modalMode === 'edit' ? 'update' : 'invite'} staff member`);
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          enabled: !prev.availability[day].enabled
        }
      }
    }));
  };

  const handleTimeChange = (day: number, field: 'start_time' | 'end_time', value: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'staff': 'Staff',
      'admin': 'Admin',
      'owner': 'Owner',
      'manager': 'Manager'
    };
    return roleMap[role] || role;
  };

  const getStatusDisplayName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'inactive': 'Inactive',
      'pending': 'Pending',
      'accepted': 'Accepted',
      'declined': 'Declined',
      'expired': 'Expired'
    };
    return statusMap[status] || status;
  };

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        <div className="staff-page">
          {/* Header */}
          <div className="staff-header">
            <div className="staff-header-left">
              {/*<button className="back-button" onClick={() => navigate('/dashboard')}>*/}
              {/*  <i className="fas fa-arrow-left"></i>*/}
              {/*</button>*/}
              <h1 className="page-title">Staff</h1>
            </div>
          </div>

          {!user?.company_id ? (
            <div className="empty-state">
              <i className="fas fa-building"></i>
              <h3>No Company Found</h3>
              <p>You need to create a company first to manage staff members.</p>
              <button className="btn btn-primary" onClick={() => navigate('/company-settings')}>
                Create Company
              </button>
            </div>
          ) : (
            <>
              {/* Staff Members Section */}
              <div className="staff-container">
                <div className="staff-section-header">
                  <div className="header-content">
                    <div className="header-text">
                      <h2 className="staff-title">
                        <i className="fas fa-users staff-icon"></i>
                        Manage Staff
                      </h2>
                      <p className="staff-subtitle">Create, edit, and organize your staff members</p>
                    </div>
                    {isAdmin && (
                      <div className="header-actions">
                        <button className="add-staff-btn" onClick={handleAddStaff}>
                          <i className="fas fa-plus-circle"></i>
                          <span>Invite team member</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="staff-table-container">
                  {loading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Loading staff members...</p>
                    </div>
                  ) : staff.length > 0 ? (
                    <table className="staff-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Position</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map((member) => (
                          <tr key={member.id}>
                            <td>
                              <div className="staff-member">
                                <div className="staff-avatar">
                                  {member.user.profile_photo_url ? (
                                    <img
                                      src={member.user.profile_photo_url}
                                      alt={`${member.user.first_name} ${member.user.last_name}`}
                                      onError={(e) => {
                                        // Fallback to initials if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.textContent = getInitials(member.user.first_name, member.user.last_name);
                                      }}
                                    />
                                  ) : (
                                    getInitials(member.user.first_name, member.user.last_name)
                                  )}
                                </div>
                                <div className="staff-info">
                                  <h4>{member.user.first_name} {member.user.last_name}</h4>
                                </div>
                              </div>
                            </td>
                            <td>{member.user.email}</td>
                            <td>{member.user.phone || '-'}</td>
                            <td>{member.user.position || '-'}</td>
                            <td>
                              <span className={`role-badge role-${member.role}`}>
                                {getRoleDisplayName(member.role)}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge status-${member.status}`}>
                                {getStatusDisplayName(member.status)}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {isAdmin && (
                                  <>
                                    <button
                                      className="action-btn edit"
                                      onClick={() => handleEditStaff(member)}
                                      title="Edit"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                      className="action-btn delete"
                                      onClick={() => handleDeleteStaff(member.id)}
                                      title="Delete"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <i className="fas fa-users"></i>
                      <h3>No Staff Members</h3>
                      {isAdmin ? (
                        <p>No staff members found. Click "Invite team member" to add your first staff member.</p>
                      ) : (
                        <p>Insufficient privileges. Please contact your administrator.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Invitations Section */}
              <div className="staff-container">
                <div className="staff-section-header">
                  <div className="header-content">
                    <div className="header-text">
                      <h2 className="staff-title">
                        <i className="fas fa-envelope staff-icon"></i>
                        Pending Invitations
                      </h2>
                      <p className="staff-subtitle">Manage pending team member invitations</p>
                    </div>
                  </div>
                </div>

                <div className="staff-table-container">
                  {invitationsLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Loading invitations...</p>
                    </div>
                  ) : invitations.length > 0 ? (
                    <table className="staff-table">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Sent Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map((invitation) => (
                          <tr key={invitation.id}>
                            <td>{invitation.email}</td>
                            <td>
                              <span className={`role-badge role-${invitation.role}`}>
                                {getRoleDisplayName(invitation.role)}
                              </span>
                            </td>
                            <td>{formatDate(invitation.sent_date)}</td>
                            <td>
                              <span className={`status-badge status-${invitation.status}`}>
                                {getStatusDisplayName(invitation.status)}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {isAdmin && (
                                  <>
                                    <button
                                      className="action-btn resend"
                                      onClick={() => handleResendInvitation(invitation.token)}
                                      title="Resend"
                                    >
                                      <i className="fas fa-redo"></i>
                                    </button>
                                    <button
                                      className="action-btn delete"
                                      onClick={() => handleDeleteInvitation(invitation.id)}
                                      title="Delete"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <i className="fas fa-envelope-open"></i>
                      <h3>No Pending Invitations</h3>
                      <p>No pending invitations. All team members have been accepted or invitations have expired.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Staff Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">
                    {modalMode === 'add' ? 'Invite team member' : 'Edit Staff Member'}
                  </h3>
                  <button className="modal-close" onClick={() => setShowModal(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        disabled={modalMode === 'edit'}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="role">Role</label>
                      <select
                        id="role"
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                    </div>

                    {/* Weekly Availability Section */}
                    <div className="availability-section">
                      <label className="form-label">
                        <i className="fas fa-calendar-alt"></i> Weekly Availability
                      </label>
                      <p className="availability-subtitle">Set the working hours for this staff member</p>

                      <div className="availability-list">
                        {Object.keys(formData.availability).map((dayKey) => {
                          const day = parseInt(dayKey);
                          const dayData = formData.availability[day];

                          return (
                            <div key={day} className={`availability-day ${dayData.enabled ? 'enabled' : ''}`}>
                              <div className="day-header">
                                <div className="day-info">
                                  <input
                                    type="checkbox"
                                    id={`day-${day}-enabled`}
                                    className="day-toggle"
                                    checked={dayData.enabled}
                                    onChange={() => handleAvailabilityToggle(day)}
                                  />
                                  <label htmlFor={`day-${day}-enabled`} className="day-name">
                                    {dayNames[day]}
                                  </label>
                                </div>
                                <div className="time-inputs">
                                  <input
                                    type="time"
                                    className="time-input"
                                    value={dayData.start_time}
                                    disabled={!dayData.enabled}
                                    onChange={(e) => handleTimeChange(day, 'start_time', e.target.value)}
                                  />
                                  <span className="time-separator">-</span>
                                  <input
                                    type="time"
                                    className="time-input"
                                    value={dayData.end_time}
                                    disabled={!dayData.enabled}
                                    onChange={(e) => handleTimeChange(day, 'end_time', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            {modalMode === 'add' ? 'Sending...' : 'Saving...'}
                          </>
                        ) : (
                          modalMode === 'add' ? 'Send Invitation' : 'Update Staff Member'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StaffPage;
