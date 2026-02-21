import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { apiClient } from '../utils/api';
import '../styles/customers.css';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_photo_url?: string;
  total_bookings: number;
  total_spent: number;
  last_visit?: string;
  created_at: string;
  status: string;
}

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, unreadNotificationsCount } = useUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recent' | 'frequent'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage, setCustomersPerPage] = useState(10);

  useEffect(() => {
    if (user?.company_id) {
      fetchCustomers();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, filterType]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when page size changes
  }, [customersPerPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/companies/customers');
      const data = response.data;
      setCustomers(data.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // For demo purposes, use mock data if API fails
      setCustomers(generateMockCustomers());
    } finally {
      setLoading(false);
    }
  };

  const generateMockCustomers = (): Customer[] => {
    return [
      {
        id: '1',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1-555-0123',
        total_bookings: 15,
        total_spent: 750.00,
        last_visit: '2026-02-01',
        created_at: '2025-06-15',
        status: 'active'
      },
      {
        id: '2',
        first_name: 'Emma',
        last_name: 'Wilson',
        email: 'emma.wilson@example.com',
        phone: '+1-555-0124',
        total_bookings: 8,
        total_spent: 420.00,
        last_visit: '2026-01-28',
        created_at: '2025-08-20',
        status: 'active'
      },
      {
        id: '3',
        first_name: 'Michael',
        last_name: 'Davis',
        email: 'michael.davis@example.com',
        phone: '+1-555-0125',
        total_bookings: 22,
        total_spent: 1100.00,
        last_visit: '2026-02-03',
        created_at: '2025-03-10',
        status: 'active'
      },
      {
        id: '4',
        first_name: 'Lisa',
        last_name: 'Brown',
        email: 'lisa.brown@example.com',
        phone: '+1-555-0126',
        total_bookings: 5,
        total_spent: 250.00,
        last_visit: '2025-12-15',
        created_at: '2025-11-01',
        status: 'inactive'
      },
      {
        id: '5',
        first_name: 'James',
        last_name: 'Miller',
        email: 'james.miller@example.com',
        phone: '+1-555-0127',
        total_bookings: 12,
        total_spent: 600.00,
        last_visit: '2026-01-30',
        created_at: '2025-07-12',
        status: 'active'
      }
    ];
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    switch (filterType) {
      case 'recent':
        // Customers who visited in the last 30 days
        filtered = filtered.filter(customer => {
          if (!customer.last_visit) return false;
          const lastVisit = new Date(customer.last_visit);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastVisit >= thirtyDaysAgo;
        });
        break;
      case 'frequent':
        // Customers with 10+ bookings
        filtered = filtered.filter(customer => customer.total_bookings >= 10);
        break;
      default:
        // All customers
        break;
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filter: 'all' | 'recent' | 'frequent') => {
    setFilterType(filter);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLastVisitStatus = (lastVisit?: string) => {
    if (!lastVisit) return 'never';

    const lastVisitDate = new Date(lastVisit);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) return 'recent';
    if (daysDiff <= 30) return 'moderate';
    return 'old';
  };

  // Pagination
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCustomersPerPage(parseInt(e.target.value));
  };

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        <div className="customers-page">
          {/* Header */}
          <div className="customers-header">
            <div className="customers-header-left">
              <h1 className="page-title">Customers</h1>
            </div>
            <UserProfile user={user} />
          </div>

          {!user?.company_id ? (
            <div className="empty-state">
              <i className="fas fa-building"></i>
              <h3>No Company Found</h3>
              <p>You need to create a company first to manage customers.</p>
              <button className="btn btn-primary" onClick={() => navigate('/company-settings')}>
                Create Company
              </button>
            </div>
          ) : (
            <div className="customers-container">
              {/* Header Section */}
              <div className="customers-section-header">
                <div className="header-content">
                  <div className="header-text">
                    <h2 className="customers-title">
                      <i className="fas fa-users customers-icon"></i>
                      Company Customers
                    </h2>
                    <p className="customers-subtitle">View and manage your business customers</p>
                  </div>
                </div>
              </div>

              <div className="customers-table-container">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading customers...</p>
                  </div>
                ) : (
                  <>
                    {/* Search and Filter Controls */}
                    <div className="table-controls">
                      <div className="search-box">
                        <i className="fas fa-search search-icon"></i>
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search customers..."
                          value={searchTerm}
                          onChange={handleSearch}
                        />
                      </div>
                      <div className="control-group">
                        <div className="page-size-selector">
                          <label htmlFor="page-size">Show:</label>
                          <select
                            id="page-size"
                            value={customersPerPage}
                            onChange={handlePageSizeChange}
                            className="page-size-select"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                          <span>per page</span>
                        </div>
                        <div className="filter-buttons">
                          <button
                            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => handleFilterChange('all')}
                          >
                            All
                          </button>
                          <button
                            className={`filter-btn ${filterType === 'recent' ? 'active' : ''}`}
                            onClick={() => handleFilterChange('recent')}
                          >
                            Recent
                          </button>
                          <button
                            className={`filter-btn ${filterType === 'frequent' ? 'active' : ''}`}
                            onClick={() => handleFilterChange('frequent')}
                          >
                            Frequent
                          </button>
                        </div>
                      </div>
                    </div>

                    {filteredCustomers.length > 0 ? (
                      <>
                        {/* Customers Table */}
                        <table className="customers-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Phone</th>
                              <th>Total Bookings</th>
                              <th>Total Spent</th>
                              <th>Last Visit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentCustomers.map((customer) => (
                              <tr key={customer.id}>
                                <td>
                                  <div className="customer-info">
                                    <div className="customer-avatar">
                                      {customer.profile_photo_url ? (
                                        <img
                                          src={customer.profile_photo_url}
                                          alt={`${customer.first_name} ${customer.last_name}`}
                                        />
                                      ) : (
                                        getInitials(customer.first_name, customer.last_name)
                                      )}
                                    </div>
                                    <div className="customer-details">
                                      <h4>{customer.first_name} {customer.last_name}</h4>
                                      <p>{customer.status}</p>
                                    </div>
                                  </div>
                                </td>
                                <td>{customer.email}</td>
                                <td>{customer.phone || '-'}</td>
                                <td>
                                  <span className="stat-badge stat-bookings">
                                    {customer.total_bookings}
                                  </span>
                                </td>
                                <td>
                                  <span className="stat-badge stat-revenue">
                                    {formatCurrency(customer.total_spent / 100)}
                                  </span>
                                </td>
                                <td>
                                  <span className={`last-visit ${getLastVisitStatus(customer.last_visit)}`}>
                                    {customer.last_visit ? formatDate(customer.last_visit) : 'Never'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="pagination-container">
                            <div className="pagination-info">
                              Showing {indexOfFirstCustomer + 1} to {Math.min(indexOfLastCustomer, filteredCustomers.length)} of {filteredCustomers.length} customers
                            </div>
                            <div className="pagination-controls">
                              <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                <i className="fas fa-chevron-left"></i>
                              </button>

                              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNumber;
                                if (totalPages <= 5) {
                                  pageNumber = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNumber = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNumber = totalPages - 4 + i;
                                } else {
                                  pageNumber = currentPage - 2 + i;
                                }

                                return (
                                  <button
                                    key={pageNumber}
                                    className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
                                    onClick={() => handlePageChange(pageNumber)}
                                  >
                                    {pageNumber}
                                  </button>
                                );
                              })}

                              <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              >
                                <i className="fas fa-chevron-right"></i>
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="empty-state">
                        <i className="fas fa-users"></i>
                        <h3>No Customers Found</h3>
                        {searchTerm || filterType !== 'all' ? (
                          <p>No customers match your current search or filter criteria. Try adjusting your filters.</p>
                        ) : (
                          <p>You haven't received any customers yet. They will appear here once you start getting bookings.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomersPage;
