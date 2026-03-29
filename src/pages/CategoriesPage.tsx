import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../utils/api';
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
  const { t } = useTranslation();
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
      const response = await apiClient.get('/v1/services/companies/categories');
      const data = response.data;
      const flatCategories = data.data || [];

      // Build hierarchical structure
      const hierarchicalCategories = buildCategoryHierarchy(flatCategories);
      setCategories(hierarchicalCategories);
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
        ? `/v1/services/categories/${editingCategory.id}`
        : `/v1/services/categories`;

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

      const response = await apiClient.request({
        url,
        method,
        data: requestBody,
      });
      const data = response.data;

      if (data?.success !== false) {
        showMessage('success', `Category ${modalMode === 'edit' ? 'updated' : 'created'} successfully!`);
        setShowModal(false);
        fetchCategories();
      } else {
        showMessage('error', data.message || `Failed to ${modalMode === 'edit' ? 'update' : 'create'} category`);
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
      const response = await apiClient.delete(`/v1/services/categories/${deletingCategory.id}`);
      const data = response.data;

      if (data?.success !== false) {
        showMessage('success', 'Category deleted successfully!');
        setShowDeleteModal(false);
        setDeletingCategory(null);
        fetchCategories();
      } else {
        showMessage('error', data.message || 'Failed to delete category');
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
                title={isExpanded ? t('common.collapse') : t('common.expand')}
              >
                <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
              </button>
            )}
            <div className="category-icon">
              <i className={`fas ${getCategoryIcon(category.name)}`}></i>
            </div>
            <div className="category-details">
              <h4>{category.name}</h4>
              {level > 0 && <span className="subcategory-badge">{t('categories.subcategory')}</span>}
            </div>
          </div>
        </td>
        <td>
          <div className="category-description">
            <p>{category.description_en || t('categories.noDescription')}</p>
          </div>
        </td>
        <td>
          {hasSubcategories ? (
            <span className={`stat-badge stat-subcategory`}>
              {subcategoryCount} {subcategoryCount === 1 ? t('categories.subcategory') : t('categories.subcategories')}
            </span>
          ) : (
            <span className={`stat-badge ${getServicesCountBadge(category.services_count)}`}>
              {category.services_count || 0} {category.services_count === 1 ? t('categories.service') : t('categories.services')}
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
                  title={t('categories.addSubcategory')}
                  style={{
                    visibility: (!category.services_count || category.services_count === 0) ? 'visible' : 'hidden'
                  }}
                >
                  <i className="fas fa-plus"></i>
                </button>
                <button
                  className="action-btn edit"
                  onClick={() => handleEditCategory(category)}
                  title={t('categories.editCategory')}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDeleteCategory(category)}
                  title={hasSubcategories ? t('categories.cannotDelete') : t('categories.deleteCategory')}
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
      <LanguageSwitcher />
      <div className="page-with-sidebar">
        <div className="categories-page">
          {/* Header */}
          <div className="categories-header">
            <div className="categories-header-left">
              <h1 className="page-title">{t('categories.title')}</h1>
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
              <h3>{t('categories.noCompanyFound')}</h3>
              <p>{t('categories.noCompanyMessage')}</p>
              <button className="btn btn-primary" onClick={() => navigate('/company-settings')}>
                {t('categories.createCompany')}
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
                      {t('categories.title')}
                    </h2>
                    <p className="categories-subtitle">{t('categories.subtitle')}</p>
                  </div>
                  {isAdmin && (
                    <div className="header-actions">
                      <button className="add-category-btn" onClick={() => handleAddCategory()}>
                        <i className="fas fa-plus-circle"></i>
                        <span>{t('categories.addNewCategory')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="categories-table-container">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{t('categories.loading')}</p>
                  </div>
                ) : categories.length > 0 ? (
                  <div className="table-responsive">
                    <table className="categories-table">
                      <thead>
                        <tr>
                          <th>{t('categories.categoryName')}</th>
                          <th>{t('categories.description')}</th>
                          <th>{t('categories.count')}</th>
                          <th>{t('categories.createdDate')}</th>
                          <th>{t('categories.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => renderCategoryRow(category))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-folder-open"></i>
                    <h3>{t('categories.noCategoriesFound')}</h3>
                    {isAdmin ? (
                      <p>{t('categories.noAdminMessage')}</p>
                    ) : (
                      <p>{t('categories.insufficientPrivileges')}</p>
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
                    {modalMode === 'add' ? t('categories.addCategory') : t('categories.editCategoryTitle')}
                  </h3>
                  <button className="modal-close" onClick={() => setShowModal(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    {/* Default Category Name - Always Visible */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="category-name">{t('categories.categoryNameLabel')}</label>
                      <input
                        type="text"
                        id="category-name"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder={t('common.enterText')}
                      />
                    </div>

                    {/* Parent Category Selection */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="parent-category">{t('categories.parentCategory')}</label>
                      <select
                        id="parent-category"
                        className="form-input"
                        value={parentCategoryId}
                        onChange={(e) => setParentCategoryId(e.target.value)}
                      >
                        <option value="">{t('common.none')} ({t('common.mainCategory')})</option>
                        {getMainCategories(categories, editingCategory?.id).map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.parent_category_id ? '  └─ ' : ''}{cat.name}
                          </option>
                        ))}
                      </select>
                      <small className="form-hint">{t('categories.parentCategoryHint')}</small>
                    </div>

                    {/* Language Tabs */}
                    <div className="language-section">
                      <div className="language-section-title">{t('common.translations')}</div>
                      <div className="language-tabs">
                        <button
                          type="button"
                          className={`language-tab ${activeTab === 'en' ? 'active' : ''}`}
                          onClick={() => setActiveTab('en')}
                        >
                          🇬🇧 {t('common.english')}
                        </button>
                        <button
                          type="button"
                          className={`language-tab ${activeTab === 'ee' ? 'active' : ''}`}
                          onClick={() => setActiveTab('ee')}
                        >
                          🇪🇪 {t('common.estonian')}
                        </button>
                        <button
                          type="button"
                          className={`language-tab ${activeTab === 'ru' ? 'active' : ''}`}
                          onClick={() => setActiveTab('ru')}
                        >
                          🇷🇺 {t('common.russian')}
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="tab-content">
                        {activeTab === 'en' && (
                          <>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-name-en">{t('categories.categoryNameEn')}</label>
                              <input
                                type="text"
                                id="category-name-en"
                                className="form-input"
                                value={formData.name_en}
                                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                                placeholder={t('common.enterText')}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-description-en">{t('categories.descriptionEn')}</label>
                              <textarea
                                id="category-description-en"
                                className="form-textarea"
                                value={formData.description_en}
                                onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                                rows={3}
                                placeholder={`${t('common.enterText')} ${t('common.optional')}`}
                              />
                            </div>
                          </>
                        )}

                        {activeTab === 'ee' && (
                          <>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-name-ee">{t('categories.categoryNameEe')}</label>
                              <input
                                type="text"
                                id="category-name-ee"
                                className="form-input"
                                value={formData.name_ee}
                                onChange={(e) => setFormData(prev => ({ ...prev, name_ee: e.target.value }))}
                                placeholder={t('common.enterText')}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-description-ee">{t('categories.descriptionEe')}</label>
                              <textarea
                                id="category-description-ee"
                                className="form-textarea"
                                value={formData.description_ee}
                                onChange={(e) => setFormData(prev => ({ ...prev, description_ee: e.target.value }))}
                                rows={3}
                                placeholder={`${t('common.enterText')} ${t('common.optional')}`}
                              />
                            </div>
                          </>
                        )}

                        {activeTab === 'ru' && (
                          <>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-name-ru">{t('categories.categoryNameRu')}</label>
                              <input
                                type="text"
                                id="category-name-ru"
                                className="form-input"
                                value={formData.name_ru}
                                onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                                placeholder={t('common.enterText')}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" htmlFor="category-description-ru">{t('categories.descriptionRu')}</label>
                              <textarea
                                id="category-description-ru"
                                className="form-textarea"
                                value={formData.description_ru}
                                onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                                rows={3}
                                placeholder={`${t('common.enterText')} ${t('common.optional')}`}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                        {t('categories.cancel')}
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            {modalMode === 'add' ? t('categories.creating') : t('categories.updating')}
                          </>
                        ) : (
                          modalMode === 'add' ? t('categories.saveCategory') : t('categories.updateCategory')
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
                  <h3 className="modal-title">{t('categories.deleteConfirm')}</h3>
                  <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <p>
                    {t('categories.deleteConfirmText')} "<strong>{deletingCategory.name}</strong>"?
                  </p>
                  <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {t('categories.deleteWarning')}
                  </p>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      {t('categories.cancel')}
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
                          {t('categories.deleting')}
                        </>
                      ) : (
                        t('categories.deleteCategory')
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
