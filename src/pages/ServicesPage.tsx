import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { servicesAPI } from '../utils/api';
import { Service, Category, Staff, CreateServiceData, CreateCategoryData } from '../types/services';

import '../styles/services.css';

interface HierarchicalCategory {
  id: string;
  name: string;
  description?: string;
  parent_category_id?: string | null;
  has_subcategories?: boolean;
  services_count?: number;
  subcategories?: HierarchicalCategory[];
}

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
  const [categories, setCategories] = useState<HierarchicalCategory[]>([]);
  const [flatCategories, setFlatCategories] = useState<HierarchicalCategory[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copyingServices, setCopyingServices] = useState<Set<string>>(new Set());
  const [savingServices, setSavingServices] = useState<Set<string>>(new Set());
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceData, setEditingServiceData] = useState<Partial<Service>>({});
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);

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
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [imageRemoved, setImageRemoved] = useState(false);

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

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-search-wrapper') && !target.closest('.btn-icon-text')) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryDropdown]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesRes, categoriesRes, staffRes] = await Promise.all([
        servicesAPI.getServices(),
        servicesAPI.getCategories(),
        servicesAPI.getStaff(),
      ]);

      // Process categories from the dedicated categories endpoint
      const flatCategoriesData: HierarchicalCategory[] = [];
      if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
        categoriesRes.data.forEach((category: any) => {
          flatCategoriesData.push({
            id: category.id,
            name: category.name,
            description: category.description || '',
            parent_category_id: category.parent_category_id,
            has_subcategories: category.has_subcategories,
            services_count: category.services_count,
          });
        });
      }

      // Build hierarchical structure
      const hierarchicalCategories = buildCategoryHierarchy(flatCategoriesData);

      // Keep both flat and hierarchical versions
      setFlatCategories(flatCategoriesData);
      setCategories(hierarchicalCategories);

      // Process services from the NEW nested architecture
      // Categories can have either services OR subcategories
      const servicesData: Service[] = [];

      // Recursive function to extract services from nested structure
      const extractServices = (categories: any[]) => {
        categories.forEach((category: any) => {
          // If category has services, add them
          if (category.services && Array.isArray(category.services) && category.services.length > 0) {
            category.services.forEach((service: any) => {
              servicesData.push({
                id: service.id,
                name: service.name,
                name_en: service.name_en || '',
                name_ee: service.name_ee || '',
                name_ru: service.name_ru || '',
                duration: service.duration,
                price: parseFloat((service.price / 100).toFixed(2)),
                discount_price: parseFloat(((service.discount_price || 0) / 100).toFixed(2)),
                status: service.status,
                additional_info: service.additional_info || '',
                additional_info_en: service.additional_info_en || '',
                additional_info_ee: service.additional_info_ee || '',
                additional_info_ru: service.additional_info_ru || '',
                buffer_before: service.buffer_before || 0,
                buffer_after: service.buffer_after || 0,
                category_id: category.id,
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

          // If category has subcategories, recursively process them
          if (category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0) {
            extractServices(category.subcategories);
          }
        });
      };

      if (servicesRes.data && Array.isArray(servicesRes.data)) {
        extractServices(servicesRes.data);
      }

      setServices(servicesData);
      setStaff(staffRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical category structure
  const buildCategoryHierarchy = (flatCategories: HierarchicalCategory[]): HierarchicalCategory[] => {
    const categoryMap = new Map<string, HierarchicalCategory>();
    const rootCategories: HierarchicalCategory[] = [];

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
      setSelectedCategoryId(service.category_id);
      setCategorySearchTerm(getCategoryDisplayForInput(service.category_id));
      setImageRemoved(false);
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
      setSelectedCategoryId('');
      setCategorySearchTerm('');
      setImageRemoved(false);
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
    setSelectedCategoryId('');
    setCategorySearchTerm('');
    setShowCategoryDropdown(false);
    setImageRemoved(false);
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
      ? Math.round(parseFloat(discountPriceValue) * 100)
      : undefined;

    const serviceData: CreateServiceData = {
      name: formData.get('service-name') as string,
      name_en: languageFormValues.name_en,
      name_ee: languageFormValues.name_ee,
      name_ru: languageFormValues.name_ru,
      duration: parseInt(formData.get('service-duration') as string),
      price: Math.round(parseFloat(formData.get('service-price') as string) * 100),
      ...(discountPrice && { discount_price: discountPrice}),
      additional_info_en: languageFormValues.description_en,
      additional_info_ee: languageFormValues.description_ee,
      additional_info_ru: languageFormValues.description_ru,
      status: 'active',
      buffer_before: 0,
      buffer_after: 0,
      category_id: selectedCategoryId,
      staff_ids: selectedStaff,
      ...(serviceModal.isEditing && imageRemoved && { remove_image: true }),
    };

    const imageFile = imageInputRef.current?.files?.[0];

    try {
      let response;
      if (serviceModal.isEditing && serviceModal.service) {
        response = await servicesAPI.updateService(serviceModal.service.id, serviceData, imageFile);
      } else {
        response = await servicesAPI.createService(serviceData, imageFile);
      }

      // Check if the response indicates success
      if (!response || response.success === false) {
        // API returned an error response
        const errorMessage = response?.message || (serviceModal.isEditing ? 'Failed to update service' : 'Failed to create service');
        setError(errorMessage);
        return;
      }

      // Only show success if the operation actually succeeded
      setSuccess(serviceModal.isEditing ? 'Service updated successfully' : 'Service created successfully');
      closeServiceModal();
      await loadData();
    } catch (err: any) {
      console.error('Failed to save service:', err);

      // Try to extract error message from the response
      let errorMessage = serviceModal.isEditing ? 'Failed to update service' : 'Failed to create service';

      // Check if the error response contains JSON with error details
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.success === false && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
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

    // Add parent_category_id if selected
    const parentCategoryId = formData.get('parent-category') as string;
    if (parentCategoryId) {
      (categoryData as any).parent_category_id = parentCategoryId;
    }

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

  // Copy service
  const handleCopyService = async (serviceId: string, serviceName: string) => {
    // Check if this service is already being copied
    if (copyingServices.has(serviceId)) {
      return;
    }

    // Add this service to the copying set
    setCopyingServices(prev => new Set(prev).add(serviceId));

    try {
      const response = await servicesAPI.copyService(serviceId);

      // If the response contains the new service data, add it to the list
      if (response && response.id) {
        setServices(prevServices => [...prevServices, response]);
      } else {
        // If no service data returned, we need to refresh to get the new service
        await loadData();
      }

      setSuccess(`Service "${serviceName}" copied successfully`);
    } catch (err: any) {
      console.error('Failed to copy service:', err);
      let errorMessage = 'Failed to copy service';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      // Remove this service from the copying set
      setCopyingServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  // Inline editing functions
  const startInlineEdit = (service: Service) => {
    setEditingServiceId(service.id);
    setEditingServiceData({
      name: service.name,
      duration: service.duration,
      price: service.price,
      discount_price: service.discount_price,
      category_id: service.category_id,
    });
    setEditingImagePreview(service.image_url || null);
    setEditingImageFile(null);
  };

  const cancelInlineEdit = () => {
    setEditingServiceId(null);
    setEditingServiceData({});
    setEditingImageFile(null);
    setEditingImagePreview(null);
  };

  const updateEditingField = (field: string, value: any) => {
    setEditingServiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleInlineImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditingImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setEditingImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeInlineImage = () => {
    setEditingImageFile(null);
    setEditingImagePreview(null);
  };

  const saveInlineEdit = async (serviceId: string) => {
    // Check if this service is already being saved
    if (savingServices.has(serviceId)) {
      return;
    }

    // Add this service to the saving set
    setSavingServices(prev => new Set(prev).add(serviceId));

    // Exit edit mode immediately so user can edit other rows
    setEditingServiceId(null);

    // Store the data to save before clearing the editing state
    const dataToSave = {
      name: editingServiceData.name!,
      duration: editingServiceData.duration!,
      price: editingServiceData.price!,
      discount_price: (editingServiceData?.discount_price || 0),
      category_id: editingServiceData.category_id!,
    };
    const imageToSave = editingImageFile;
    const imagePreviewToSave = editingImagePreview;

    // Clear editing state
    setEditingServiceData({});
    setEditingImageFile(null);
    setEditingImagePreview(null);

    try {
      const serviceData: CreateServiceData = {
        name: dataToSave.name,
        duration: dataToSave.duration,
        price: dataToSave.price * 100,
        discount_price: dataToSave.discount_price * 100,
        category_id: dataToSave.category_id,
        status: 'active',
        buffer_before: 0,
        buffer_after: 0,
        staff_ids: services.find(s => s.id === serviceId)?.service_staff?.map(ss => ss.user_id) || [],
      };

      const response = await servicesAPI.updateService(serviceId, serviceData, imageToSave || undefined);

      if (!response || response.success === false) {
        const errorMessage = response?.message || 'Failed to update service';
        setError(errorMessage);
        return;
      }

      // Update the local services state with the new data
      setServices(prevServices =>
        prevServices.map(service =>
          service.id === serviceId
            ? {
                ...service,
                name: dataToSave.name,
                duration: dataToSave.duration,
                price: dataToSave.price,
                discount_price: dataToSave.discount_price || 0,
                category_id: dataToSave.category_id,
                // Update image_url if a new image was uploaded
                image_url: imagePreviewToSave || service.image_url,
              }
            : service
        )
      );

      setSuccess('Service updated successfully');
    } catch (err: any) {
      console.error('Failed to save service:', err);
      let errorMessage = 'Failed to update service';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      // Remove this service from the saving set
      setSavingServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
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
    setImageRemoved(true);
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

  // Get category name with hierarchy display
  const getCategoryName = (categoryId: string): string => {
    const category = flatCategories.find(c => c.id === categoryId);
    if (!category) return 'Uncategorized';

    // If it has a parent, show the hierarchy
    if (category.parent_category_id) {
      const parent = flatCategories.find(c => c.id === category.parent_category_id);
      if (parent) {
        return `${parent.name} → ${category.name}`;
      }
    }

    return category.name;
  };

  // Get category display name for dropdown (with indentation)
  const getCategoryDisplayName = (category: HierarchicalCategory, level: number = 0): string => {
    const indent = '  '.repeat(level);
    return `${indent}${category.name}`;
  };

  // Get filtered categories based on search term
  const getFilteredSelectableCategories = (): { category: HierarchicalCategory; displayName: string; level: number }[] => {
    const selectableCategories: { category: HierarchicalCategory; displayName: string; level: number }[] = [];

    const collectSelectableCategories = (categories: HierarchicalCategory[], level: number = 0) => {
      categories.forEach(category => {
        // Only show categories that can accept services (no subcategories)
        if (!category.has_subcategories && (!category.subcategories || category.subcategories.length === 0)) {
          const displayName = getCategoryDisplayName(category, level);

          // Filter based on search term
          if (!categorySearchTerm ||
              category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
              displayName.toLowerCase().includes(categorySearchTerm.toLowerCase())) {
            selectableCategories.push({ category, displayName, level });
          }
        }

        // Recursively collect from subcategories
        if (category.subcategories && category.subcategories.length > 0) {
          collectSelectableCategories(category.subcategories, level + 1);
        }
      });
    };

    collectSelectableCategories(categories);
    return selectableCategories;
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const category = flatCategories.find(c => c.id === categoryId);
    if (category) {
      setCategorySearchTerm(getCategoryName(categoryId));
    }
    setShowCategoryDropdown(false);
  };

  // Get category name for display in input field
  const getCategoryDisplayForInput = (categoryId: string): string => {
    return getCategoryName(categoryId);
  };

  // Get the full path of a category (e.g., "Hair Services → Hair Cuts")
  const getCategoryPath = (categoryId: string): string => {
    const category = flatCategories.find(c => c.id === categoryId);
    if (!category) return '';

    const path: string[] = [];
    let currentCategory: HierarchicalCategory | undefined = category;

    // Build path from child to parent
    while (currentCategory) {
      path.unshift(currentCategory.name);
      if (currentCategory.parent_category_id) {
        currentCategory = flatCategories.find(c => c.id === currentCategory!.parent_category_id);
      } else {
        currentCategory = undefined;
      }
    }

    return path.join(' → ');
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
                      {services.map((service) => {
                        const isEditing = editingServiceId === service.id;
                        const isSaving = savingServices.has(service.id);

                        return (
                          <tr key={service.id} className={isEditing ? 'editing-row' : (isSaving ? 'saving-row' : '')}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {isEditing ? (
                                  <div className="inline-image-upload">
                                    <input
                                      type="file"
                                      id={`inline-image-${service.id}`}
                                      accept="image/*"
                                      onChange={handleInlineImageChange}
                                      style={{ display: 'none' }}
                                    />
                                    <div
                                      className="inline-image-preview"
                                      onClick={() => document.getElementById(`inline-image-${service.id}`)?.click()}
                                      title="Click to change image"
                                    >
                                      {editingImagePreview ? (
                                        <img src={editingImagePreview} alt="Service preview" />
                                      ) : (
                                        <div className="inline-image-placeholder">
                                          <i className="fas fa-camera"></i>
                                        </div>
                                      )}
                                    </div>
                                    {editingImagePreview && (
                                      <button
                                        type="button"
                                        className="inline-image-remove"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeInlineImage();
                                        }}
                                        title="Remove image"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  service.image_url ? (
                                    <img
                                      src={service.image_url}
                                      alt={service.name}
                                      className="service-image"
                                    />
                                  ) : (
                                    <div className="service-image service-image-placeholder">
                                      <i className="fas fa-scissors"></i>
                                    </div>
                                  )
                                )}
                                <div style={{ flex: 1 }}>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      className="inline-edit-input"
                                      value={editingServiceData.name || ''}
                                      onChange={(e) => updateEditingField('name', e.target.value)}
                                      placeholder="Service name"
                                    />
                                  ) : (
                                    <>
                                      <div style={{ fontWeight: 500 }}>{service.name}</div>
                                      {service.additional_info && (
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                          {service.additional_info}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              {isEditing ? (
                                <select
                                  className="inline-edit-select"
                                  value={editingServiceData.category_id || ''}
                                  onChange={(e) => updateEditingField('category_id', e.target.value)}
                                >
                                  {getFilteredSelectableCategories().map(({ category }) => (
                                    <option key={category.id} value={category.id}>
                                      {getCategoryPath(category.id)}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                getCategoryName(service.category_id)
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="number"
                                    className="inline-edit-input-small"
                                    value={editingServiceData.duration || ''}
                                    onChange={(e) => updateEditingField('duration', parseInt(e.target.value))}
                                    min="5"
                                    step="5"
                                  />
                                  <span style={{ fontSize: '12px', color: '#6b7280' }}>min</span>
                                </div>
                              ) : (
                                `${service.duration} min`
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '14px' }}>€</span>
                                    <input
                                      type="number"
                                      className="inline-edit-input-small"
                                      value={editingServiceData.price || ''}
                                      onChange={(e) => updateEditingField('price', parseFloat(e.target.value))}
                                      min="1"
                                      step="1"
                                      placeholder="Price"
                                    />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '12px', color: '#10b981' }}>€</span>
                                    <input
                                      type="number"
                                      className="inline-edit-input-small"
                                      value={editingServiceData.discount_price || ''}
                                      onChange={(e) => updateEditingField('discount_price', e.target.value ? parseFloat(e.target.value) : 0)}
                                      min="0"
                                      step="0.01"
                                      placeholder="Discount"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  € {(service.price).toFixed(2)}
                                  {service.discount_price !== 0 && (
                                    <div style={{
                                      fontSize: '12px',
                                      color: '#10b981',
                                      fontWeight: 500
                                    }}>
                                      Discount: € {(service.discount_price).toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              )}
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
                                {isEditing ? (
                                  <>
                                    <button
                                      className="btn-icon btn-save"
                                      onClick={() => saveInlineEdit(service.id)}
                                      title="Save Changes"
                                      disabled={isSaving}
                                    >
                                      {isSaving ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                      ) : (
                                        <i className="fas fa-check"></i>
                                      )}
                                    </button>
                                    <button
                                      className="btn-icon btn-cancel"
                                      onClick={cancelInlineEdit}
                                      title="Cancel"
                                      disabled={isSaving}
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </>
                                ) : isSaving ? (
                                  <div className="saving-indicator">
                                    <i className="fas fa-spinner fa-spin"></i>
                                    <span>Saving...</span>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      className="btn-icon btn-copy"
                                      onClick={() => handleCopyService(service.id, service.name)}
                                      title="Copy Service"
                                      disabled={copyingServices.has(service.id)}
                                    >
                                      {copyingServices.has(service.id) ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                      ) : (
                                        <i className="fas fa-copy"></i>
                                      )}
                                    </button>
                                    <button
                                      className="btn-icon btn-edit"
                                      onClick={() => startInlineEdit(service)}
                                      title="Quick Edit"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                      className="btn-icon btn-details"
                                      onClick={() => openServiceModal(service)}
                                      title="Edit Details"
                                    >
                                      <i className="fas fa-ellipsis-h"></i>
                                    </button>
                                    <button
                                      className="btn-icon btn-delete"
                                      onClick={() => openDeleteModal('service', service.id, service.name)}
                                      title="Delete Service"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Service Modal */}
        {serviceModal.isOpen && (
          <div
            className="modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeServiceModal();
              }
            }}
          >
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
                      <div className="category-search-wrapper">
                        <input
                          type="text"
                          id="service-category"
                          name="service-category"
                          value={categorySearchTerm}
                          onChange={(e) => {
                            setCategorySearchTerm(e.target.value);
                            setShowCategoryDropdown(true);
                          }}
                          onFocus={() => setShowCategoryDropdown(true)}
                          placeholder="Search and select a category"
                          required
                          autoComplete="off"
                        />
                        <i className="fas fa-search category-search-icon"></i>

                        {/* Hidden input to store the actual category ID for form submission */}
                        <input
                          type="hidden"
                          name="service-category-id"
                          value={selectedCategoryId}
                        />

                        {showCategoryDropdown && (
                          <div className="category-dropdown">
                            {getFilteredSelectableCategories().length === 0 ? (
                              <div className="category-dropdown-item no-results">
                                No categories found
                              </div>
                            ) : (
                              getFilteredSelectableCategories().map(({ category, level }) => (
                                <div
                                  key={category.id}
                                  className={`category-dropdown-item ${selectedCategoryId === category.id ? 'selected' : ''}`}
                                  onClick={() => handleCategorySelect(category.id)}
                                  style={{ paddingLeft: `${8 + level * 12}px` }}
                                >
                                  <div className="category-item-content">
                                    <span className="category-name">{category.name}</span>
                                    {category.parent_category_id && (
                                      <span className="category-path">
                                        {getCategoryPath(category.id)}
                                      </span>
                                    )}
                                  </div>
                                  {level > 0 && (
                                    <span className="category-level-badge">
                                      Level {level + 1}
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-icon-text"
                        onClick={() => {
                          setShowCategoryDropdown(false);
                          openCategoryModal();
                        }}
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
                          defaultValue={serviceModal.service?.price ? serviceModal.service.price : ''}
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
                        defaultValue={serviceModal.service?.discount_price ? serviceModal.service.discount_price : ''}
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
          <div
            className="modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeCategoryModal();
              }
            }}
          >
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
                    <label htmlFor="parent-category">Parent Category (Optional)</label>
                    <select
                      id="parent-category"
                      name="parent-category"
                      defaultValue={''}
                    >
                      <option value="">None (Main Category)</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <small style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                      Select a parent category to create a subcategory
                    </small>
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
          <div
            className="modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeDeleteModal();
              }
            }}
          >
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

