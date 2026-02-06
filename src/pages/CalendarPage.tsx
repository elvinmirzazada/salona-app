import React from 'react';
import Sidebar from '../components/Sidebar';
import { useUser } from '../contexts/UserContext';

const CalendarPage: React.FC = () => {
  const { user, unreadNotificationsCount } = useUser();

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        <div style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Calendar
          </h1>
          <p style={{ color: '#6B7280' }}>
            Calendar page will be implemented soon...
          </p>
        </div>
      </div>
    </>
  );
};

export default CalendarPage;

