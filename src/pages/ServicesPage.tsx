import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { servicesAPI } from '../utils/api';
import { Service, Category, Staff, CreateServiceData, CreateCategoryData } from '../types/services';
import '../styles/services.css';

interface ServiceModalData {
  isOpen: boolean;
  service: Service | null;
  isEditing: boolean;
}

interface CategoryModalData {
  isOpen: boolean;
  category: Category | null;
  isEditing: boolean;
}

interface DeleteModalData {
  isOpen: boolean;
  type: 'service' | 'category';
  id: string | null;
  name: string;
}

const ServicesPage: React.FC = () => {
  const { user, unreadNotificationsCount } = useUser();

  // State management
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [serviceModal, setServiceModal] = useState<ServiceModalData>({
    isOpen: false,
    service: null,
    isEditing: false,
  });

  const [categoryModal, setCategoryModal] = useState<CategoryModalData>({
    isOpen: false,
    category: null,
    isEditing: false,
  });

  const [deleteModal, setDeleteModal] = useState<DeleteModalData>({
    isOpen: false,
    type: 'service',
    id: null,
    name: '',
  });

  // Form refs
  const serviceFormRef = useRef<HTMLFormElement>(null);
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [activeLanguageTab, setActiveLanguageTab] = useState<'en' | 'ee' | 'ru'>('en');

  // Language-specific form values
  const [languageFormValues, setLanguageFormValues] = useState({
    name_en: '',
    name_ee: '',
    name_ru: '',
    description_en: '',
    description_ee: '',
    description_ru: '',
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesRes, categoriesRes, staffRes] = await Promise.all([
        servicesAPI.getServices(),
        servicesAPI.getCategories(),
        servicesAPI.getStaff(),
      ]);

      // Use categories from the dedicated categories endpoint
      const categoriesData: Category[] = [];
      if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
        categoriesRes.data.forEach((category: any) => {
          categoriesData.push({
            id: category.id,
            name: category.name,
            description: category.description || '',
          });
        });
      }

      // Process services from the services endpoint response
      const servicesData: Service[] = [];
      if (servicesRes.data && Array.isArray(servicesRes.data)) {
        servicesRes.data.forEach((category: any) => {
          // Add services from this category to services array
          if (category.services && Array.isArray(category.services)) {
            category.services.forEach((service: any) => {
              servicesData.push({
                id: service.id,
                name: service.name,
                name_en: service.name_en || '',
                name_ee: service.name_ee || '',
                name_ru: service.name_ru || '',
                duration: service.duration,
                price: service.price,
                discount_price: service.discount_price,
                status: service.status,
                additional_info: service.additional_info || '',
                additional_info_en: service.additional_info_en || '',
                additional_info_ee: service.additional_info_ee || '',
                additional_info_ru: service.additional_info_ru || '',
                buffer_before: service.buffer_before || 0,
                buffer_after: service.buffer_after || 0,
                category_id: category.id, // Link to parent category
                image_url: service.image_url,
                service_staff: service.service_staff?.map((ss: any) => ({
                  id: ss.id,
                  user_id: ss.user_id,
                  first_name: ss.user?.first_name || '',
                  last_name: ss.user?.last_name || '',
                  email: ss.user?.email || '',
                  position: ss.user?.position || '',
                })) || [],
              });
            });
          }
        });
      }

      // console.log('Loaded categories:', categoriesData);
      // console.log('Loaded services:', servicesData);

      setCategories(categoriesData);
      setServices(servicesData);
      setStaff(staffRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Service operations
  const openServiceModal = (service: Service | null = null) => {
    const isEditing = !!service;
    setServiceModal({
      isOpen: true,
      service,
      isEditing,
    });

    if (service) {
      setImagePreview(service.image_url || null);
      setSelectedStaff(service.service_staff?.map(s => s.user_id) || []);
      setLanguageFormValues({
        name_en: service.name_en || '',
        name_ee: service.name_ee || '',
        name_ru: service.name_ru || '',
        description_en: service.additional_info_en || '',
        description_ee: service.additional_info_ee || '',
        description_ru: service.additional_info_ru || '',
      });
    } else {
      setImagePreview(null);
      setSelectedStaff([]);
      setLanguageFormValues({
        name_en: '',
        name_ee: '',
        name_ru: '',
        description_en: '',
        description_ee: '',
        description_ru: '',
      });
    }

    setActiveLanguageTab('en');
  };

  const closeServiceModal = () => {
    setServiceModal({ isOpen: false, service: null, isEditing: false });
    setImagePreview(null);
    setSelectedStaff([]);
    setLanguageFormValues({
      name_en: '',
      name_ee: '',
      name_ru: '',
      description_en: '',
      description_ee: '',
      description_ru: '',
    });
    if (serviceFormRef.current) {
      serviceFormRef.current.reset();
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const discountPriceValue = formData.get('service-discount-price') as string;
    const discountPrice = discountPriceValue && parseFloat(discountPriceValue) > 0
      ? Math.round(parseFloat(discountPriceValue))
      : undefined;

    const serviceData: CreateServiceData = {
      name: formData.get('service-name') as string,
      name_en: languageFormValues.name_en,
      name_ee: languageFormValues.name_ee,
      name_ru: languageFormValues.name_ru,
      duration: parseInt(formData.get('service-duration') as string),
      price: Math.round(parseFloat(formData.get('service-price') as string)),
      ...(discountPrice && { discount_price: discountPrice }),
      additional_info_en: languageFormValues.description_en,
      additional_info_ee: languageFormValues.description_ee,
      additional_info_ru: languageFormValues.description_ru,
      status: 'active',
      buffer_before: 0,
      buffer_after: 0,
      category_id: formData.get('service-category') as string,
      staff_ids: selectedStaff,
    };

    const imageFile = imageInputRef.current?.files?.[0];

    try {
      if (serviceModal.isEditing && serviceModal.service) {
        await servicesAPI.updateService(serviceModal.service.id, serviceData, imageFile);
        setSuccess('Service updated successfully');
      } else {
        await servicesAPI.createService(serviceData, imageFile);
        setSuccess('Service created successfully');
      }

      closeServiceModal();
      loadData();
    } catch (err) {
      console.error('Failed to save service:', err);
      setError(serviceModal.isEditing ? 'Failed to update service' : 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  // Category operations
  const openCategoryModal = (category: Category | null = null) => {
    const isEditing = !!category;
    setCategoryModal({
      isOpen: true,
      category,
      isEditing,
    });
  };

  const closeCategoryModal = () => {
    setCategoryModal({ isOpen: false, category: null, isEditing: false });
    if (categoryFormRef.current) {
      categoryFormRef.current.reset();
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const categoryData: CreateCategoryData = {
      name: formData.get('category-name') as string,
      description: formData.get('category-description') as string || '',
    };

    try {
      if (categoryModal.isEditing && categoryModal.category) {
        await servicesAPI.updateCategory(categoryModal.category.id, categoryData);
        setSuccess('Category updated successfully');
      } else {
        await servicesAPI.createCategory(categoryData);
        setSuccess('Category created successfully');
      }

      closeCategoryModal();
      loadData();
    } catch (err) {
      console.error('Failed to save category:', err);
      setError(categoryModal.isEditing ? 'Failed to update category' : 'Failed to create category');
    }
  };

  // Delete operations
  const openDeleteModal = (type: 'service' | 'category', id: string, name: string) => {
    setDeleteModal({ isOpen: true, type, id, name });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: 'service', id: null, name: '' });
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      if (deleteModal.type === 'service') {
        await servicesAPI.deleteService(deleteModal.id);
        setSuccess('Service deleted successfully');
      } else {
        await servicesAPI.deleteCategory(deleteModal.id);
        setSuccess('Category deleted successfully');
      }

      closeDeleteModal();
      loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
      setError(`Failed to delete ${deleteModal.type}`);
    }
  };

  // Image handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Staff selection
  const handleStaffToggle = (staffId: string) => {
    setSelectedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };


  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        {/* Messages */}
        {success && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#10b981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 1001,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#ef4444',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 1001,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {error}
          </div>
        )}

        <main style={{ padding: '2rem' }}>
          {/* Header */}
          <div className="services-card">
            <div className="services-header">
              <div className="header-content">
                <div className="header-text">
                  <h2 className="services-title">
                    <i className="fas fa-cogs services-icon"></i>
                    Manage Services
                  </h2>
                  <p className="services-subtitle">Create, edit, and organize your business services</p>
                </div>
                <div className="header-right">
                  <div className="header-actions">
                    {(user?.role === 'owner' || user?.role === 'admin') && (
                      <button
                        className="add-service-btn"
                        onClick={() => openServiceModal()}
                      >
                        <i className="fas fa-plus-circle"></i>
                        <span>Add New Service</span>
                      </button>
                    )}
                  </div>
                  <UserProfile user={user} />
                </div>
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                </div>
              ) : services.length === 0 ? (
                <div className="empty-state">
                  {user?.role === 'owner' || user?.role === 'admin' ? (
                    <p>No services found. Click "Add Service" to create your first service.</p>
                  ) : (
                    <p>Insufficient privileges. Please contact your administrator.</p>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="services-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Category</th>
                        <th>Duration</th>
                        <th>Price</th>
                        <th>Staff</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr key={service.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {service.image_url ? (
                                <img
                                  src={service.image_url}
                                  alt={service.name}
                                  className="service-image"
                                />
                              ) : (
                                <div className="service-image service-image-placeholder">
                                  <i className="fas fa-scissors"></i>
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 500 }}>{service.name}</div>
                                {service.additional_info && (
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                    {service.additional_info}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{getCategoryName(service.category_id)}</td>
                          <td>{service.duration} min</td>
                          <td>
                            <div>
                              € {(service.price / 100).toFixed(2)}
                              {service.discount_price !== 0 && (
                                <div style={{
                                  fontSize: '12px',
                                  color: '#10b981',
                                  fontWeight: 500
                                }}>
                                  Discount: € {(service.discount_price / 100).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="staff-assignment">
                              {service.service_staff && service.service_staff.length > 0 ? (
                                service.service_staff.map((staff, index) => (
                                  <span key={index} className="staff-badge">
                                    {staff.first_name} {staff.last_name}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>No staff assigned</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="service-actions">
                              <button
                                className="btn-icon btn-edit"
                                onClick={() => openServiceModal(service)}
                                title="Edit Service"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn-icon btn-delete"
                                onClick={() => openDeleteModal('service', service.id, service.name)}
                                title="Delete Service"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Service Modal */}
        {serviceModal.isOpen && (
          <div className="modal-overlay" onClick={closeServiceModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{serviceModal.isEditing ? 'Edit Service' : 'Add Service'}</h2>
                <button className="modal-close" onClick={closeServiceModal}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <form ref={serviceFormRef} onSubmit={handleServiceSubmit}>
                  <div className="form-group">
                    <label htmlFor="service-name">Service Name</label>
                    <input
                      type="text"
                      id="service-name"
                      name="service-name"
                      defaultValue={serviceModal.service?.name || ''}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="service-category">Category</label>
                    <div className="category-input-group">
                      <select
                        id="service-category"
                        name="service-category"
                        defaultValue={serviceModal.service?.category_id || ''}
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-icon-text"
                        onClick={() => openCategoryModal()}
                        title="Create new category"
                      >
                        <i className="fas fa-plus"></i>
                        <span>New Category</span>
                      </button>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="service-duration">Duration (minutes)</label>
                      <input
                        type="number"
                        id="service-duration"
                        name="service-duration"
                        min="5"
                        step="5"
                        defaultValue={serviceModal.service?.duration || ''}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="service-price">Price</label>
                      <div className="price-input">
                        <span className="currency-symbol">€</span>
                        <input
                          type="number"
                          id="service-price"
                          name="service-price"
                          min="0"
                          step="0.01"
                          defaultValue={serviceModal.service?.price ? (serviceModal.service.price / 100).toFixed(2) : ''}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="service-discount-price">Discount Price (optional)</label>
                    <div className="price-input">
                      <span className="currency-symbol">€</span>
                      <input
                        type="number"
                        id="service-discount-price"
                        name="service-discount-price"
                        min="0"
                        step="0.01"
                        defaultValue={serviceModal.service?.discount_price ? (serviceModal.service.discount_price / 100).toFixed(2) : ''}
                      />
                    </div>
                  </div>


                  {/* Language Tabs Section */}
                  <div className="language-section">
                    <div className="language-section-title">Translations (Optional)</div>
                    <div className="language-tabs">
                      <button
                        type="button"
                        className={`language-tab ${activeLanguageTab === 'en' ? 'active' : ''}`}
                        onClick={() => setActiveLanguageTab('en')}
                      >
                        🇬🇧 English
                      </button>
                      <button
                        type="button"
                        className={`language-tab ${activeLanguageTab === 'ee' ? 'active' : ''}`}
                        onClick={() => setActiveLanguageTab('ee')}
                      >
                        🇪🇪 Estonian
                      </button>
                      <button
                        type="button"
                        className={`language-tab ${activeLanguageTab === 'ru' ? 'active' : ''}`}
                        onClick={() => setActiveLanguageTab('ru')}
                      >
                        🇷🇺 Russian
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content">
                      {activeLanguageTab === 'en' && (
                        <>
                          <div className="form-group">
                            <label htmlFor="service-name-en">Service Name (English)</label>
                            <input
                              type="text"
                              id="service-name-en"
                              name="service-name-en"
                              value={languageFormValues.name_en}
                              onChange={(e) => setLanguageFormValues(prev => ({ ...prev, name_en: e.target.value }))}
                              placeholder="Enter English name"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="service-description-en">Description (English)</label>
                            <textarea
                              id="service-description-en"
                              name="service-description-en"
                              rows={3}
                              value={languageFormValues.description_en}
                              onChange={(e) => setLanguageFormValues(prev => ({ ...prev, description_en: e.target.value }))}
                              placeholder="Enter English description (optional)"
                            ></textarea>
                          </div>
                        </>
                      )}

                      {activeLanguageTab === 'ee' && (
                        <>
                          <div className="form-group">
                            <label htmlFor="service-name-ee">Service Name (Estonian)</label>
                            <input
                              type="text"
                              id="service-name-ee"
                              name="service-name-ee"
                              value={languageFormValues.name_ee}
                              onChange={(e) => setLanguageFormValues(prev => ({ ...prev, name_ee: e.target.value }))}
                              placeholder="Enter Estonian name"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="service-description-ee">Description (Estonian)</label>
                            <textarea
                              id="service-description-ee"
                              name="service-description-ee"
                              rows={3}
                              value={languageFormValues.description_ee}
                              onChange={(e) => setLanguageFormValues(prev => ({ ...prev, description_ee: e.target.value }))}
                              placeholder="Enter Estonian description (optional)"
                            ></textarea>
                          </div>
                        </>
                      )}

                      {activeLanguageTab === 'ru' && (
                        <>
                          <div className="form-group">
                            <label htmlFor="service-name-ru">Service Name (Russian)</label>
                            <input
                              type="text"
                              id="service-name-ru"
                              name="service-name-ru"
                              value={languageFormValues.name_ru}
                              onChange={(e) => setLanguageFormValues(prev => ({ ...prev, name_ru: e.target.value }))}
                              placeholder="Enter Russian name"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="service-description-ru">Description (Russian)</label>
                            <textarea
                              id="service-description-ru"
                              name="service-description-ru"
                              rows={3}
                              value={languageFormValues.description_ru}
                              onChange={(e) => setLanguageFormValues(prev => ({ ...prev, description_ru: e.target.value }))}
                              placeholder="Enter Russian description (optional)"
                            ></textarea>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Service Image (optional)</label>
                    <div className="image-upload-container">
                      <input
                        ref={imageInputRef}
                        type="file"
                        id="service-image"
                        name="service-image"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <div
                        className="image-preview"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {imagePreview ? (
                          <img src={imagePreview} alt="Service preview" />
                        ) : (
                          <>
                            <i className="fas fa-image"></i>
                            <span>Click to upload image</span>
                          </>
                        )}
                      </div>
                      <div className="upload-buttons">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <i className="fas fa-upload"></i>
                          Choose Image
                        </button>
                        {imagePreview && (
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={removeImage}
                          >
                            <i className="fas fa-times"></i>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Staff who perform this service</label>
                    <div className="checkbox-group">
                      {staff.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>No staff members available. Please add staff members first.</p>
                      ) : (
                        staff.map(member => (
                          <div key={member.id} className="staff-checkbox">
                            <input
                              type="checkbox"
                              id={`staff-${member.id}`}
                              checked={selectedStaff.includes(member.user_id)}
                              onChange={() => handleStaffToggle(member.user_id)}
                            />
                            <div className="staff-info">
                              <div className="staff-name">
                                {member.user?.first_name || ''} {member.user?.last_name || ''}
                              </div>
                              <div className="staff-email">{member.user?.email || ''}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={closeServiceModal}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          {serviceModal.isEditing ? 'Updating...' : 'Saving...'}
                        </>
                      ) : (
                        serviceModal.isEditing ? 'Update Service' : 'Save Service'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {categoryModal.isOpen && (
          <div className="modal-overlay" onClick={closeCategoryModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{categoryModal.isEditing ? 'Edit Category' : 'Add Category'}</h2>
                <button className="modal-close" onClick={closeCategoryModal}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <form ref={categoryFormRef} onSubmit={handleCategorySubmit}>
                  <div className="form-group">
                    <label htmlFor="category-name">Category Name</label>
                    <input
                      type="text"
                      id="category-name"
                      name="category-name"
                      defaultValue={categoryModal.category?.name || ''}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category-description">Description</label>
                    <textarea
                      id="category-description"
                      name="category-description"
                      rows={3}
                      defaultValue={categoryModal.category?.description || ''}
                    ></textarea>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={closeCategoryModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {categoryModal.isEditing ? 'Update Category' : 'Save Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="modal-overlay" onClick={closeDeleteModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Delete {deleteModal.type === 'service' ? 'Service' : 'Category'}</h2>
                <button className="modal-close" onClick={closeDeleteModal}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete "{deleteModal.name}"?</p>
                <p>This action cannot be undone.</p>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={closeDeleteModal}>
                    Cancel
                  </button>
                  <button type="button" className="btn-danger" onClick={handleDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ServicesPage;

