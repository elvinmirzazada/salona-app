export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
  services_count?: number;
}

export interface Staff {
  id: string;
  user_id: string;
  role?: string;
  status?: string;
  profile_photo_url?: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    languages?: string;
    position?: string;
    profile_photo_url?: string;
    status?: string;
  };
}

export interface ServiceStaff {
  id: string;
  service_id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    languages?: string;
    position?: string;
    profile_photo_url?: string;
    status?: string;
  };
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  additional_info?: string;
  category_id: string;
  category?: Category;
  duration: number;
  price: number;
  discount_price?: number;
  status: string;
  buffer_before: number;
  buffer_after: number;
  image_url?: string;
  service_staff: ServiceStaff[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateServiceData {
  name: string;
  duration: number;
  price: number;
  discount_price?: number;
  additional_info?: string;
  status: string;
  buffer_before: number;
  buffer_after: number;
  category_id: string;
  staff_ids: string[];
  remove_image?: boolean;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}
