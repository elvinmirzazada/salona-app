import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/categories.css';

interface Category {
  id: string;
  name: string;
  name_en?: string;
  name_ee?: string;
  name_ru?: string;
  description_en?: string;
  description_ee?: string;
  description_ru?: string;
  services_count?: number;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  name: string;
  name_en: string;
  name_ee: string;
  name_ru: string;
  description_en: string;
  description_ee: string;
  description_ru: string;
}

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, unreadNotificationsCount } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    name_en: '',
    name_ee: '',
    name_ru: '',
    description_en: '',
    description_ee: '',
    description_ru: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'en' | 'ee' | 'ru'>('en');

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  // ...existing code...

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/v1/services/companies/categories`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      } else {
        console.error('Failed to fetch categories');
        // For demo purposes, use mock data if API fails
        setCategories(generateMockCategories());
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // For demo purposes, use mock data if API fails
      setCategories(generateMockCategories());
    } finally {
      setLoading(false);
    }
  };

  const generateMockCategories = (): Category[] => {
    return [
      {
        id: '1',
        name: 'Hair Services',
        name_en: 'Hair Services',
        name_ee: 'Juukseteenused',
        name_ru: 'Услуги для волос',
        description_en: 'All hair cutting, styling, and treatment services',
        description_ee: 'Kõik juukselõikuse, stiilingu ja hoolduse teenused',
        description_ru: 'Все услуги по стрижке, укладке и уходу за волосами',
        services_count: 8,
        created_at: '2025-06-15',
        updated_at: '2025-12-01'
      },
      {
        id: '2',
        name: 'Nail Services',
        name_en: 'Nail Services',
        name_ee: 'Küüneteenused',
        name_ru: 'Маникюрные услуги',
        description_en: 'Manicures, pedicures, and nail art services',
        description_ee: 'Maniküür, pediküür ja küünekunsti teenused',
        description_ru: 'Маникюр, педикюр и услуги нейл-арта',
        services_count: 5,
        created_at: '2025-06-20',
        updated_at: '2025-11-15'
      },
      {
        id: '3',
        name: 'Facial & Skin Care',
        name_en: 'Facial & Skin Care',
        name_ee: 'Näohooldus',
        name_ru: 'Уход за лицом и кожей',
        description_en: 'Facial treatments, cleansing, and skincare services',
        description_ee: 'Näohooldus, puhastus ja nahahoolduse teenused',
        description_ru: 'Процедуры для лица, очищение и уход за кожей',
        services_count: 12,
        created_at: '2025-07-01',
        updated_at: '2026-01-10'
      },
      {
        id: '4',
        name: 'Massage Therapy',
        name_en: 'Massage Therapy',
        name_ee: 'Massaažiteraapia',
        name_ru: 'Массажная терапия',
        description_en: 'Relaxation and therapeutic massage services',
        description_ee: 'Lõõgastus- ja terapeutilise massaaži teenused',
        description_ru: 'Расслабляющий и лечебный массаж',
        services_count: 6,
        created_at: '2025-07-15',
        updated_at: '2025-12-20'
      },
      {
        id: '5',
        name: 'Spa Packages',
        name_en: 'Spa Packages',
        name_ee: 'SPA paketid',
        name_ru: 'СПА пакеты',
        description_en: 'Combination spa packages and premium treatments',
        description_ee: 'Kombineeritud SPA paketid ja premium teenused',
        description_ru: 'Комбинированные СПА пакеты и премиум услуги',
        services_count: 3,
        created_at: '2025-08-01',
        updated_at: '2026-01-05'
      }
    ];
  };

  const handleAddCategory = () => {
    setModalMode('add');
    setEditingCategory(null);
    setFormData({
      name: '',
      name_en: '',
      name_ee: '',
      name_ru: '',
      description_en: '',
      description_ee: '',
      description_ru: ''
    });
    setActiveTab('en');
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setModalMode('edit');
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_en: category.name_en || '',
      name_ee: category.name_ee || '',
      name_ru: category.name_ru || '',
      description_en: category.description_en || '',
      description_ee: category.description_ee || '',
      description_ru: category.description_ru || ''
    });
    setActiveTab('en');
    setShowModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showMessage('error', 'Please enter a category name');
      return;
    }

    setSaving(true);

    try {
      const url = modalMode === 'edit' && editingCategory
        ? `${API_BASE_URL}/v1/services/categories/${editingCategory.id}`
        : `${API_BASE_URL}/v1/services/categories`;

      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          name_en: formData.name_en.trim(),
          name_ee: formData.name_ee.trim(),
          name_ru: formData.name_ru.trim(),
          description_en: formData.description_en.trim(),
          description_ee: formData.description_ee.trim(),
          description_ru: formData.description_ru.trim()
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showMessage('success', `Category ${modalMode === 'edit' ? 'updated' : 'created'} successfully!`);
          setShowModal(false);
          fetchCategories();
        } else {
          showMessage('error', data.message || `Failed to ${modalMode === 'edit' ? 'update' : 'create'} category`);
        }
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.message || `Failed to ${modalMode === 'edit' ? 'update' : 'create'} category`);
      }
    } catch (error: any) {
      console.error('Error saving category:', error);
      showMessage('error', error?.response?.data?.message || error?.message || `Failed to ${modalMode === 'edit' ? 'update' : 'create'} category`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;

    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/services/categories/${deletingCategory.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showMessage('success', 'Category deleted successfully!');
          setShowDeleteModal(false);
          setDeletingCategory(null);
          fetchCategories();
        } else {
          showMessage('error', data.message || 'Failed to delete category');
        }
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.message || 'Failed to delete category');
      }
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showMessage('error', error?.response?.data?.message || error?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('hair')) return 'fa-cut';
    if (lowerName.includes('nail')) return 'fa-hand-sparkles';
    if (lowerName.includes('facial') || lowerName.includes('skin')) return 'fa-spa';
    if (lowerName.includes('massage')) return 'fa-hands';
    if (lowerName.includes('spa')) return 'fa-leaf';
    return 'fa-folder';
  };

  const getServicesCountBadge = (count?: number) => {
    if (!count || count === 0) return 'stat-inactive';
    if (count >= 10) return 'stat-popular';
    return 'stat-services';
  };

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        <div className="categories-page">
          {/* Header */}
          <div className="categories-header">
            <div className="categories-header-left">
              <h1 className="page-title">Categories</h1>
            </div>
            <UserProfile user={user} />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`alert alert-${message.type}`}>
              <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              {message.text}
            </div>
          )}

          {!user?.company_id ? (
            <div className="empty-state">
              <i className="fas fa-building"></i>
              <h3>No Company Found</h3>
              <p>You need to create a company first to manage categories.</p>
              <button className="btn btn-primary" onClick={() => navigate('/company-settings')}>
                Create Company
              </button>
            </div>
          ) : (
            <div className="categories-container">
              {/* Header Section */}
              <div className="categories-section-header">
                <div className="header-content">
                  <div className="header-text">
                    <h2 className="categories-title">
                      <i className="fas fa-folder-open categories-icon"></i>
                      Manage Categories
                    </h2>
                    <p className="categories-subtitle">Organize and structure your service categories</p>
                  </div>
                  {isAdmin && (
                    <div className="header-actions">
                      <button className="add-category-btn" onClick={handleAddCategory}>
                        <i className="fas fa-plus-circle"></i>
                        <span>Add New Category</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="categories-table-container">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading categories...</p>
                  </div>
                ) : categories.length > 0 ? (
                  <table className="categories-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Services Count</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id}>
                          <td>
                            <div className="category-info">
                              <div className="category-icon">
                                <i className={`fas ${getCategoryIcon(category.name)}`}></i>
                              </div>
                              <div className="category-details">
                                <h4>{category.name}</h4>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="category-details">
                              <p>{category.description_en || 'No description provided'}</p>
                            </div>
                          </td>
                          <td>
                            <span className={`stat-badge ${getServicesCountBadge(category.services_count)}`}>
                              {category.services_count || 0} services
                            </span>
                          </td>
                          <td>{formatDate(category.created_at)}</td>
                          <td>
                            <div className="action-buttons">
                              {isAdmin && (
                                <>
                                  <button
                                    className="action-btn edit"
                                    onClick={() => handleEditCategory(category)}
                                    title="Edit Category"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    className="action-btn delete"
                                    onClick={() => handleDeleteCategory(category)}
                                    title="Delete Category"
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
                    <i className="fas fa-folder-open"></i>
                    <h3>No Categories Found</h3>
                    {isAdmin ? (
                      <p>No categories found. Click "Add New Category" to create your first category.</p>
                    ) : (
                      <p>Insufficient privileges. Please contact your administrator.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add/Edit Category Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">
                    {modalMode === 'add' ? 'Add Category' : 'Edit Category'}
                  </h3>
                  <button className="modal-close" onClick={() => setShowModal(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    {/* Default Category Name - Always Visible */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="category-name">Category Name *</label>
                      <input
                        type="text"
                        id="category-name"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Enter category name"
                      />
                    </div>

                    {/* Language Tabs */}
                    <div className="language-section">
                      <div className="language-section-title">Translations (Optional)</div>
                      <div className="language-tabs">
                        <button
                          type="button"
                          className={`language-tab ${activeTab === 'en' ? 'active' : ''}`}
                          onClick={() => setActiveTab('en')}
                        >
                          🇬🇧 English
                        </button>
                        <button
                          type="button"
                          className={`language-tab ${activeTab === 'ee' ? 'active' : ''}`}
                          onClick={() => setActiveTab('ee')}
                        >
                          🇪🇪 Estonian
                        </button>
                        <button
                          type="button"
                          className={`language-tab ${activeTab === 'ru' ? 'active' : ''}`}
                          onClick={() => setActiveTab('ru')}
                        >
                          🇷🇺 Russian
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="tab-content">
                        {activeTab === 'en' && (
                          <>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-name-en">Category Name (English)</label>
                              <input
                                type="text"
                                id="category-name-en"
                                className="form-input"
                                value={formData.name_en}
                                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                                placeholder="Enter English name"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-description-en">Description (English)</label>
                              <textarea
                                id="category-description-en"
                                className="form-textarea"
                                value={formData.description_en}
                                onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                                rows={3}
                                placeholder="Enter English description (optional)"
                              />
                            </div>
                          </>
                        )}

                        {activeTab === 'ee' && (
                          <>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-name-ee">Category Name (Estonian)</label>
                              <input
                                type="text"
                                id="category-name-ee"
                                className="form-input"
                                value={formData.name_ee}
                                onChange={(e) => setFormData(prev => ({ ...prev, name_ee: e.target.value }))}
                                placeholder="Enter Estonian name"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-description-ee">Description (Estonian)</label>
                              <textarea
                                id="category-description-ee"
                                className="form-textarea"
                                value={formData.description_ee}
                                onChange={(e) => setFormData(prev => ({ ...prev, description_ee: e.target.value }))}
                                rows={3}
                                placeholder="Enter Estonian description (optional)"
                              />
                            </div>
                          </>
                        )}

                        {activeTab === 'ru' && (
                          <>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-name-ru">Category Name (Russian)</label>
                              <input
                                type="text"
                                id="category-name-ru"
                                className="form-input"
                                value={formData.name_ru}
                                onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                                placeholder="Enter Russian name"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-description-ru">Description (Russian)</label>
                              <textarea
                                id="category-description-ru"
                                className="form-textarea"
                                value={formData.description_ru}
                                onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                                rows={3}
                                placeholder="Enter Russian description (optional)"
                              />
                            </div>
                          </>
                        )}
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
                            {modalMode === 'add' ? 'Creating...' : 'Updating...'}
                          </>
                        ) : (
                          modalMode === 'add' ? 'Save Category' : 'Update Category'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Delete Category Modal */}
          {showDeleteModal && deletingCategory && (
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Delete Category</h3>
                  <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete the category "<strong>{deletingCategory.name}</strong>"?
                  </p>
                  <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    This will remove all services in this category. This action cannot be undone.
                  </p>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={confirmDelete}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Deleting...
                        </>
                      ) : (
                        'Delete Category'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoriesPage;

