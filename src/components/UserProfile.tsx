import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/api';
import '../styles/user-profile.css';

interface UserProfileProps {
  user: {
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_photo_url?: string;
  } | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.first_name || user.email || 'User';

  const initials = user.first_name && user.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user.first_name
    ? user.first_name[0].toUpperCase()
    : user.email
    ? user.email[0].toUpperCase()
    : 'U';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      await apiClient.put('/v1/users/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear any local storage if needed
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  return (
    <div className="user-profile-wrapper" ref={dropdownRef}>
      <div className="user-profile-header" onClick={toggleDropdown}>
        <span className="user-profile-name">{displayName}</span>
        <div className="user-profile-avatar">
          {user.profile_photo_url ? (
            <img src={user.profile_photo_url} alt={displayName} />
          ) : (
            <div className="user-profile-initials">{initials}</div>
          )}
        </div>
      </div>

      {isDropdownOpen && (
        <div className="user-profile-dropdown">
          <button className="dropdown-item" onClick={handleProfileClick}>
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </button>
          <button className="dropdown-item logout-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
