import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import UserProfile from '../components/UserProfile';
import DashboardCharts from '../components/DashboardCharts';
import { useUser } from '../contexts/UserContext';
import { useDashboardReport, useInvalidateReport, clearReportsCache } from '../hooks/useDashboardReport';
import type { ReportData, StaffPerformance } from '../utils/ReportsManager';
import { exportToPDF, exportToCSV } from '../utils/dashboardExport';
import '../styles/dashboard.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: userLoading, unreadNotificationsCount } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [dateRange, setDateRange] = useState('');

  // Custom date range state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Use TanStack Query for data fetching with caching
  const { data: metrics, isLoading, isFetching, refetch } = useDashboardReport(
    selectedPeriod,
    customStartDate,
    customEndDate,
    !!user?.company_id, // Only fetch if user has company
    user?.id // Pass user ID for cache isolation between different users
  );

  const { invalidateReport } = useInvalidateReport();

  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);

  // Update staff performance and date range when metrics change
  useEffect(() => {
    if (metrics) {
      setStaffPerformance(metrics.staff_performance || []);
      updateDateRangeDisplay(metrics);
    }
  }, [metrics]);

  const updateDateRangeDisplay = (data: ReportData) => {
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date).toLocaleDateString();
      const endDate = new Date(data.end_date).toLocaleDateString();
      setDateRange(`${startDate} - ${endDate}`);
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setShowDatePicker(false);
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleCustomDateChange = () => {
    setSelectedPeriod('custom');
    setShowDatePicker(true);
  };

  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setShowDatePicker(false);
      // TanStack Query will automatically fetch fresh data for custom ranges
    }
  };

  const resetToCurrentWeek = () => {
    setSelectedPeriod('week');
    setShowDatePicker(false);
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleManualRefresh = async () => {
    // 1. Clear the ReportsManager in-memory cache so it doesn't serve stale data
    clearReportsCache();
    // 2. Remove TanStack Query's cached entry so staleTime doesn't block a fresh fetch
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      invalidateReport(user?.id, selectedPeriod, customStartDate, customEndDate);
    } else {
      invalidateReport(user?.id, selectedPeriod);
    }
    // 3. Trigger a fresh fetch
    await refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatChangePercent = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const handleExportPDF = () => {
    if (metrics && dateRange) {
      exportToPDF(metrics, dateRange);
    }
  };

  const handleExportCSV = () => {
    if (metrics && dateRange) {
      exportToCSV(metrics, dateRange);
    }
  };

  if (isLoading || userLoading) {
    return (
      <>
        <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div className="dashboard-page">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('dashboard.loadingDashboard')}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <LanguageSwitcher />
      <div className="page-with-sidebar">
        <div className="dashboard-page">
          {!user?.company_id && (user?.role === 'admin' || user?.role === 'owner') ? (
            // Show company creation prompt
            <div style={{
              background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
              border: '2px solid #8B5CF6',
              borderRadius: '0.75rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              marginTop: '2rem',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.2)'
            }}>
              <i className="fas fa-building" style={{ fontSize: '4rem', color: '#8B5CF6', marginBottom: '1.5rem' }}></i>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#6B21A8', marginBottom: '1rem' }}>
                {t('dashboard.welcome')}
              </h2>
              <p style={{ color: '#7C3AED', marginBottom: '2rem', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                {t('dashboard.welcomeDescription')}
              </p>
              <button
                onClick={() => navigate('/company-settings')}
                style={{
                  padding: '1rem 2.5rem',
                  fontSize: '1.125rem',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.4)',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(139, 92, 246, 0.4)';
                }}
              >
                <i className="fas fa-plus-circle"></i>
                {t('dashboard.createCompany')}
              </button>
            </div>
          ) : (
            // Show dashboard content for users with company
            <>
              {/* Dashboard Header */}
              <div className="dashboard-header">
                <div>
                  <h1 className="dashboard-title">{t('dashboard.title')}</h1>
                  <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
                </div>
                <UserProfile user={user} />
              </div>

              {/* Quick Actions Bar */}
              {/*<div className="quick-actions-bar">*/}
              {/*  <button className="quick-action-btn" onClick={() => navigate('/calendar')}>*/}
              {/*    <i className="fas fa-calendar-alt"></i>*/}
              {/*    <span>View Calendar</span>*/}
              {/*  </button>*/}
              {/*  <button className="quick-action-btn" onClick={() => navigate('/services')}>*/}
              {/*    <i className="fas fa-cut"></i>*/}
              {/*    <span>Manage Services</span>*/}
              {/*  </button>*/}
              {/*  <button className="quick-action-btn" onClick={() => navigate('/staff')}>*/}
              {/*    <i className="fas fa-users"></i>*/}
              {/*    <span>Manage Staff</span>*/}
              {/*  </button>*/}
              {/*  <button className="quick-action-btn" onClick={() => navigate('/customers')}>*/}
              {/*    <i className="fas fa-user-friends"></i>*/}
              {/*    <span>View Customers</span>*/}
              {/*  </button>*/}
              {/*  <button className="quick-action-btn" onClick={() => navigate('/company-settings')}>*/}
              {/*    <i className="fas fa-cog"></i>*/}
              {/*    <span>Settings</span>*/}
              {/*  </button>*/}
              {/*</div>*/}

              {/* Dashboard Controls */}
              <div className="dashboard-controls">
                {/* Desktop: button group */}
                <div className="period-selector">
                  <button
                    className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                    onClick={() => handlePeriodChange('week')}
                  >
                    <i className="fas fa-calendar-week"></i>
                    {t('dashboard.thisWeek')}
                  </button>
                  <button
                    className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                    onClick={() => handlePeriodChange('month')}
                  >
                    <i className="fas fa-calendar-alt"></i>
                    {t('dashboard.thisMonth')}
                  </button>
                  <button
                    className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
                    onClick={() => handlePeriodChange('year')}
                  >
                    <i className="fas fa-calendar"></i>
                    {t('dashboard.thisYear')}
                  </button>
                  <button
                    className={`period-btn ${selectedPeriod === 'custom' ? 'active' : ''}`}
                    onClick={handleCustomDateChange}
                  >
                    <i className="fas fa-calendar-range"></i>
                    {t('dashboard.customDates')}
                  </button>
                </div>

                {/* Mobile: dropdown */}
                <div className="period-selector-dropdown">
                  <i className="fas fa-calendar-alt period-dropdown-icon"></i>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        handleCustomDateChange();
                      } else {
                        handlePeriodChange(val);
                      }
                    }}
                  >
                    <option value="week">{t('dashboard.thisWeek')}</option>
                    <option value="month">{t('dashboard.thisMonth')}</option>
                    <option value="year">{t('dashboard.thisYear')}</option>
                    <option value="custom">{t('dashboard.customDates')}</option>
                  </select>
                </div>

                <div className="export-buttons">
                  <button
                    className="export-btn"
                    onClick={handleManualRefresh}
                    disabled={isFetching}
                  >
                    <i className={`fas ${isFetching ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                    {t('dashboard.refresh')}
                  </button>
                  <button className="export-btn" onClick={handleExportPDF} disabled={!metrics}>
                    <i className="fas fa-file-pdf"></i>
                    {t('dashboard.exportPDF')}
                  </button>
                  <button className="export-btn" onClick={handleExportCSV} disabled={!metrics}>
                    <i className="fas fa-file-excel"></i>
                    {t('dashboard.exportCSV')}
                  </button>
                </div>
              </div>

              {/* Custom Date Picker */}
              {showDatePicker && (
                <div className="date-picker-card">
                  <div className="date-picker-header">
                    <h3>
                      <i className="fas fa-calendar-range"></i>
                      {t('dashboard.selectCustomDateRange')}
                    </h3>
                    <button
                      className="date-picker-close"
                      onClick={() => setShowDatePicker(false)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="date-picker-content">
                    <div className="date-input-group">
                      <label htmlFor="start-date">
                        <i className="fas fa-calendar"></i>
                        {t('dashboard.startDate')}
                      </label>
                      <input
                        id="start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        max={customEndDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="date-input-group">
                      <label htmlFor="end-date">
                        <i className="fas fa-calendar"></i>
                        {t('dashboard.endDate')}
                      </label>
                      <input
                        id="end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        min={customStartDate}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="date-picker-actions">
                    <button
                      className="date-picker-btn secondary"
                      onClick={resetToCurrentWeek}
                    >
                      {t('dashboard.resetToCurrentWeek')}
                    </button>
                    <button
                      className="date-picker-btn primary"
                      onClick={applyCustomDateRange}
                      disabled={!customStartDate || !customEndDate}
                    >
                      {t('dashboard.applyDateRange')}
                    </button>
                  </div>
                </div>
              )}

              {/* Date Range Display */}
              {dateRange && (
                <div className="date-range-display">
                  <i className="fas fa-calendar-range"></i>
                  <span>{dateRange}</span>
                </div>
              )}

              {/* Metrics Grid */}
              {metrics ? (
                <div className="metrics-grid">
                  {/* Total Bookings Card */}
                  <div className="metric-card">
                    <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <i className="fas fa-calendar-check"></i>
                    </div>
                    <div className="metric-content">
                      <h3 className="metric-title">{t('dashboard.totalBookings')}</h3>
                      <p className="metric-value">{metrics.total_bookings}</p>
                      {metrics.comparison && (
                        <div className={`metric-change ${metrics.comparison.bookings_change >= 0 ? 'positive' : 'negative'}`}>
                          <i className={`fas fa-arrow-${metrics.comparison.bookings_change >= 0 ? 'up' : 'down'}`}></i>
                          <span>{formatChangePercent(metrics.comparison.bookings_change)}</span> {t('dashboard.vsLastPeriod')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total Revenue Card */}
                  <div className="metric-card">
                    <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                      <i className="fas fa-dollar-sign"></i>
                    </div>
                    <div className="metric-content">
                      <h3 className="metric-title">{t('dashboard.totalRevenue')}</h3>
                      <p className="metric-value">{formatCurrency(metrics.total_revenue)}</p>
                      {metrics.comparison && (
                        <div className={`metric-change ${metrics.comparison.revenue_change >= 0 ? 'positive' : 'negative'}`}>
                          <i className={`fas fa-arrow-${metrics.comparison.revenue_change >= 0 ? 'up' : 'down'}`}></i>
                          <span>{formatChangePercent(metrics.comparison.revenue_change)}</span> {t('dashboard.vsLastPeriod')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Completed Bookings Card */}
                  <div className="metric-card">
                    <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="metric-content">
                      <h3 className="metric-title">{t('dashboard.completed')}</h3>
                      <p className="metric-value">{metrics.completed_bookings}</p>
                      <p className="metric-subtitle">{metrics.completion_rate.toFixed(1)}% {t('dashboard.completionRate')}</p>
                    </div>
                  </div>

                  {/* Average Booking Value Card */}
                  <div className="metric-card">
                    <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="metric-content">
                      <h3 className="metric-title">{t('dashboard.avgBookingValue')}</h3>
                      <p className="metric-value">{formatCurrency(metrics.average_booking_value)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-chart-line"></i>
                  <h3>{t('dashboard.noDataAvailable')}</h3>
                  <p>{t('dashboard.startBooking')}</p>
                </div>
              )}

              {/* Charts Section */}
              {metrics && (
                <DashboardCharts data={metrics} />
              )}

              {/* Staff Performance Table */}
              {staffPerformance.length > 0 && (
                <div className="table-card">
                  <div className="table-header">
                    <h3 className="table-title">
                      <i className="fas fa-users"></i>
                      {t('dashboard.staffPerformance')}
                    </h3>
                    <p className="table-subtitle">{t('dashboard.bookingsAndRevenueByStaff')}</p>
                  </div>
                  <div className="table-responsive">
                    <table className="performance-table">
                      <thead>
                        <tr>
                          <th>{t('dashboard.staffMember')}</th>
                          <th>{t('dashboard.bookings')}</th>
                          <th>{t('dashboard.revenue')}</th>
                          <th>{t('dashboard.avgPerBooking')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffPerformance.map((staff) => (
                          <tr key={staff.id}>
                            <td>{staff.name}</td>
                            <td>{staff.bookings}</td>
                            <td>{formatCurrency(staff.revenue)}</td>
                            <td>{formatCurrency(staff.average_per_booking)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Business Insights Section */}
              {metrics && (
                <div className="insights-section">
                  <div className="insights-header">
                    <h3 className="insights-title">
                      <i className="fas fa-lightbulb"></i>
                      {t('dashboard.businessInsights')}
                    </h3>
                    <p className="insights-subtitle">{t('dashboard.dataRecommendations')}</p>
                  </div>

                  <div className="insights-grid">
                    {/* Revenue Growth Insight */}
                    {metrics.comparison && metrics.comparison.revenue_change !== 0 && (
                      <div className="insight-card">
                        <div className="insight-icon" style={{ background: metrics.comparison.revenue_change > 0 ? '#10B981' : '#F59E0B' }}>
                          <i className={`fas fa-${metrics.comparison.revenue_change > 0 ? 'trending-up' : 'exclamation-triangle'}`}></i>
                        </div>
                        <div className="insight-content">
                          <h4>{t('dashboard.revenueTrend')}</h4>
                          <p>
                            {metrics.comparison.revenue_change > 0 ? t('dashboard.incByPercent') : t('dashboard.decByPercent')}{' '}
                            <strong>{Math.abs(metrics.comparison.revenue_change).toFixed(1)}%</strong> {t('dashboard.vsLastPeriod')}.
                            {metrics.comparison.revenue_change > 0
                              ? ` ${t('dashboard.keepUpExcellent')}`
                              : ` ${t('dashboard.reviewPricing')}`
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Completion Rate Insight */}
                    <div className="insight-card">
                      <div className="insight-icon" style={{ background: metrics.completion_rate > 80 ? '#10B981' : '#F59E0B' }}>
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div className="insight-content">
                        <h4>{t('dashboard.completionRateInsight')}</h4>
                        <p>
                          {t('dashboard.completionRateIs')} <strong>{metrics.completion_rate.toFixed(1)}%</strong>.
                          {metrics.completion_rate > 90
                            ? ` ${t('dashboard.excellentCompletion')}`
                            : metrics.completion_rate > 80
                            ? ` ${t('dashboard.goodCompletion')}`
                            : ` ${t('dashboard.needImprovement')}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Average Booking Value Insight */}
                    <div className="insight-card">
                      <div className="insight-icon" style={{ background: '#6366F1' }}>
                        <i className="fas fa-dollar-sign"></i>
                      </div>
                      <div className="insight-content">
                        <h4>{t('dashboard.avgValueInsight')}</h4>
                        <p>
                          {t('dashboard.avgValueIs')} <strong>{formatCurrency(metrics.average_booking_value)}</strong>.
                          {metrics.average_booking_value > 100
                            ? ` ${t('dashboard.highValueMaintain')}`
                            : ` ${t('dashboard.lowValueUpsell')}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardPage;


