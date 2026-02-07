import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/membership.css';

interface MembershipPlan {
  id: string;
  name: string;
  plan_type: string;
  price: number;
  duration_days: number;
  description?: string;
  url?: string;
}

interface ActiveSubscription {
  id: string;
  membership_plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  membership_plan: MembershipPlan;
}

const MembershipPage: React.FC = () => {
  const { user, loading: userLoading, unreadNotificationsCount } = useUser();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [activePlan, setActivePlan] = useState<ActiveSubscription | null>(null);
  const [error, setError] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) {
      loadMembershipData();
    }
  }, [userLoading]);

  const loadMembershipData = async () => {
    try {
      setLoading(true);
      setError(false);

      // Load membership plans
      const plansResponse = await fetch(`${API_BASE_URL}/v1/memberships/plans`, {
        credentials: 'include'
      });

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        if (plansData.success && plansData.data) {
          setPlans(plansData.data);
        }
      }

      // Load active subscription if user has company
      if (user?.company_id) {
        const subscriptionResponse = await fetch(`${API_BASE_URL}/v1/memberships/active-plan`, {
          credentials: 'include'
        });

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          if (subscriptionData.success && subscriptionData.data) {
            setActivePlan(subscriptionData.data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading membership data:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    const euros = price / 100;
    return euros.toFixed(2);
  };

  const formatDuration = (days: number): string => {
    if (days === 30 || days === 31) return 'month';
    if (days === 365 || days === 366) return 'year';
    if (days === 7) return 'week';
    return `${days} days`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const subscribeToPlan = async (planId: string) => {
    try {
      setProcessingPlanId(planId);

      // Create checkout session
      const response = await fetch(`${API_BASE_URL}/v1/memberships/create-checkout-session/${planId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Open checkout URL in new tab
        window.open(data.url, '_blank');
      } else {
        alert('Failed to start checkout process. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process. Please try again or contact support.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const renderFeatures = (plan: MembershipPlan): string[] => {
    const staffRange = plan.description || 'Multiple Staff Members';
    return [
      staffRange,
      'Unlimited Bookings',
      'Customer Management',
      'Service Management',
      'Calendar Management',
      'Email Notifications',
      'SMS Notifications',
      'Booking Reminders',
      'Advanced Analytics & Reports',
      'Custom Branding',
      'Mobile Responsive',
      '24/7 Priority Support'
    ];
  };

  if (loading || userLoading) {
    return (
      <>
        <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div className="membership-page">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading membership plans...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div className="membership-page">
            <div className="error-state">
              <i className="fas fa-exclamation-circle"></i>
              <p>Failed to load membership plans. Please try again later.</p>
              <button className="btn-primary" onClick={loadMembershipData}>
                <i className="fas fa-refresh"></i> Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        <div className="membership-page">
          <div className="page-header">
            <div>
              <h1>Membership Plans</h1>
              <p>Manage your subscription and billing</p>
            </div>
            <UserProfile user={user} />
          </div>

          <div className="plans-header">
            <h2 className="plans-title">
              <i className="fas fa-crown"></i>
              Choose Your Plan
            </h2>
            <p className="plans-subtitle">Select the perfect membership plan for your business needs</p>
          </div>

          {/* Active Plan Section */}
          {activePlan && (
            <>
              <div className="active-plan-banner">
                <div className="active-plan-content">
                  <div className="active-plan-header">
                    <i className="fas fa-check-circle"></i>
                    <h3>Your Active Plan</h3>
                  </div>
                  <div className="active-plan-details">
                    <div className="active-plan-info">
                      <div className="active-plan-item">
                        <label>Plan Name</label>
                        <strong>{activePlan.membership_plan.name}</strong>
                      </div>
                      <div className="active-plan-item">
                        <label>Plan Type</label>
                        <strong>{activePlan.membership_plan.plan_type.toUpperCase()}</strong>
                      </div>
                      <div className="active-plan-item">
                        <label>Price</label>
                        <strong>
                          €{formatPrice(activePlan.membership_plan.price)} / {formatDuration(activePlan.membership_plan.duration_days)}
                        </strong>
                      </div>
                      <div className="active-plan-item">
                        <label>Status</label>
                        <strong>{activePlan.status.toUpperCase()}</strong>
                      </div>
                      <div className="active-plan-item">
                        <label>Start Date</label>
                        <strong>{formatDate(activePlan.start_date)}</strong>
                      </div>
                      <div className="active-plan-item">
                        <label>End Date</label>
                        <strong>{formatDate(activePlan.end_date)}</strong>
                      </div>
                      <div className="active-plan-item">
                        <label>Auto Renew</label>
                        <strong style={{ color: activePlan.auto_renew ? '#ffffff' : '#ef4444' }}>
                          {activePlan.auto_renew ? 'YES' : 'NO'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section-divider">
                <span>Available Plans</span>
              </div>
            </>
          )}

          {/* Plans Grid */}
          {plans.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <p>No membership plans available at this time.</p>
            </div>
          ) : (
            <div className="plans-grid">
              {plans
                .sort((a, b) => a.price - b.price)
                .map((plan, index) => {
                  const isActive = activePlan?.membership_plan_id === plan.id;
                  const isFeatured = index === 1; // Middle plan is featured
                  const isStandardPlan = plan.name.toLowerCase().includes('standard');
                  const features = renderFeatures(plan);

                  return (
                    <div
                      key={plan.id}
                      className={`plan-card ${isFeatured ? 'featured' : ''} ${isActive ? 'active' : ''}`}
                    >
                      <div className="plan-header">
                        <h3 className="plan-name">{plan.name}</h3>
                        <span className={`plan-type ${plan.plan_type.toLowerCase()}`}>
                          {plan.plan_type}
                        </span>
                      </div>

                      {isStandardPlan && (
                        <div className="free-trial-badge">
                          <i className="fas fa-gift"></i> 30 Days Free Trial
                        </div>
                      )}

                      <div className="plan-price">
                        <span className="price-amount">
                          <span className="price-currency">€</span>
                          {formatPrice(plan.price)}
                        </span>
                        <span className="price-period">per {formatDuration(plan.duration_days)}</span>
                      </div>

                      <ul className="plan-features">
                        {features.map((feature, idx) => (
                          <li key={idx}>
                            <i className="fas fa-check-circle"></i>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="plan-action">
                        <button
                          className={`plan-button ${isFeatured ? 'primary' : 'secondary'}`}
                          disabled={isActive || processingPlanId === plan.id}
                          onClick={() => subscribeToPlan(plan.id)}
                        >
                          {processingPlanId === plan.id ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i>
                              Processing...
                            </>
                          ) : isActive ? (
                            <>
                              <i className="fas fa-check"></i>
                              Current Plan
                            </>
                          ) : (
                            <>
                              <i className="fas fa-crown"></i>
                              Choose Plan
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MembershipPage;

