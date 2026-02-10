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
  description?: string;
  description_en?: string;
  description_ee?: string;
  description_ru?: string;
  parent_category_id?: string | null;
  services_count?: number;
  has_subcategories?: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: Category[];
}

interface CategoryFormData {
  name: string;
  name_en: string;
  name_ee: string;
  name_ru: string;
  description?: string;
  description_en: string;
  description_ee: string;
  description_ru: string;
  parent_category_id?: string;
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [parentCategoryId, setParentCategoryId] = useState<string>('');

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
        const flatCategories = data.data || [];

        // Build hierarchical structure
        const hierarchicalCategories = buildCategoryHierarchy(flatCategories);
        setCategories(hierarchicalCategories);
      } else {
        console.error('Failed to fetch categories');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical category structure
  const buildCategoryHierarchy = (flatCategories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map of all categories
    flatCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, subcategories: [] });
    });

    // Second pass: build hierarchy
    flatCategories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent_category_id) {
        const parent = categoryMap.get(cat.parent_category_id);
        if (parent) {
          parent.subcategories = parent.subcategories || [];
          parent.subcategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Get all main categories (for parent selection dropdown)
  const getMainCategories = (cats: Category[] = categories, exclude?: string): Category[] => {
    const mainCats: Category[] = [];

    cats.forEach(cat => {
      if (cat.id !== exclude) {
        mainCats.push(cat);
        if (cat.subcategories && cat.subcategories.length > 0) {
          mainCats.push(...getMainCategories(cat.subcategories, exclude));
        }
      }
    });

    return mainCats;
  };

  const handleAddCategory = (parentId?: string) => {
    setModalMode('add');
    setEditingCategory(null);
    setParentCategoryId(parentId || '');
    setFormData({
      name: '',
      name_en: '',
      name_ee: '',
      name_ru: '',
      description_en: '',
      description_ee: '',
      description_ru: '',
      parent_category_id: parentId
    });
    setActiveTab('en');
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setModalMode('edit');
    setEditingCategory(category);
    setParentCategoryId(category.parent_category_id || '');
    setFormData({
      name: category.name,
      name_en: category.name_en || '',
      name_ee: category.name_ee || '',
      name_ru: category.name_ru || '',
      description_en: category.description_en || '',
      description_ee: category.description_ee || '',
      description_ru: category.description_ru || '',
      parent_category_id: category.parent_category_id || undefined
    });
    setActiveTab('en');
    setShowModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    // Prevent deletion if has subcategories
    if (category.has_subcategories || (category.subcategories && category.subcategories.length > 0)) {
      showMessage('error', 'Cannot delete category with subcategories. Please delete subcategories first.');
      return;
    }
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

      const requestBody: any = {
        name: formData.name.trim(),
        name_en: formData.name_en.trim(),
        name_ee: formData.name_ee.trim(),
        name_ru: formData.name_ru.trim(),
        description_en: formData.description_en.trim(),
        description_ee: formData.description_ee.trim(),
        description_ru: formData.description_ru.trim()
      };

      // Include parent_category_id if it's set
      if (parentCategoryId) {
        requestBody.parent_category_id = parentCategoryId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  // Recursive category row renderer
  const renderCategoryRow = (category: Category, level: number = 0): React.ReactElement[] => {
    const isExpanded = expandedCategories.has(category.id);
    const hasSubcategories = category.has_subcategories || (category.subcategories && category.subcategories.length > 0);
    const subcategoryCount = category.subcategories?.length || 0;

    const rows: React.ReactElement[] = [
      <tr key={category.id} className={`category-row level-${level}`}>
        <td>
          <div className="category-info" style={{ paddingLeft: `${level * 24}px` }}>
            {hasSubcategories && (
              <button
                className="expand-button"
                onClick={() => toggleCategory(category.id)}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
              </button>
            )}
            <div className="category-icon">
              <i className={`fas ${getCategoryIcon(category.name)}`}></i>
            </div>
            <div className="category-details">
              <h4>{category.name}</h4>
              {level > 0 && <span className="subcategory-badge">Subcategory</span>}
            </div>
          </div>
        </td>
        <td>
          <div className="category-description">
            <p>{category.description_en || 'No description provided'}</p>
          </div>
        </td>
        <td>
          {hasSubcategories ? (
            <span className={`stat-badge stat-subcategory`}>
              {subcategoryCount} {subcategoryCount === 1 ? 'subcategory' : 'subcategories'}
            </span>
          ) : (
            <span className={`stat-badge ${getServicesCountBadge(category.services_count)}`}>
              {category.services_count || 0} {category.services_count === 1 ? 'service' : 'services'}
            </span>
          )}
        </td>
        <td>{formatDate(category.created_at)}</td>
        <td>
          <div className="action-buttons">
            {isAdmin && (
              <>
                <button
                  className="action-btn add-sub"
                  onClick={() => handleAddCategory(category.id)}
                  title="Add Subcategory"
                  style={{
                    visibility: (!category.services_count || category.services_count === 0) ? 'visible' : 'hidden'
                  }}
                >
                  <i className="fas fa-plus"></i>
                </button>
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
                  title={hasSubcategories ? 'Cannot delete - has subcategories' : 'Delete Category'}
                  disabled={hasSubcategories}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    ];

    // Render subcategories if expanded
    if (isExpanded && category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(subcat => {
        rows.push(...renderCategoryRow(subcat, level + 1));
      });
    }

    return rows;
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
                      <button className="add-category-btn" onClick={() => handleAddCategory()}>
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
                        <th>Count</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => renderCategoryRow(category))}
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
            <div
              className="modal-overlay"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setShowModal(false);
                }
              }}
            >
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

                    {/* Parent Category Selection */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="parent-category">Parent Category (Optional)</label>
                      <select
                        id="parent-category"
                        className="form-input"
                        value={parentCategoryId}
                        onChange={(e) => setParentCategoryId(e.target.value)}
                      >
                        <option value="">None (Main Category)</option>
                        {getMainCategories(categories, editingCategory?.id).map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.parent_category_id ? '  └─ ' : ''}{cat.name}
                          </option>
                        ))}
                      </select>
                      <small className="form-hint">Select a parent category to create a subcategory</small>
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
            <div
              className="modal-overlay"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setShowDeleteModal(false);
                }
              }}
            >
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

