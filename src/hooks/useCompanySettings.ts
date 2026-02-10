import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api';
import { useUser } from '../contexts/UserContext';

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  description?: string;
  address?: {
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
  };
}

interface CompanyResponse {
  success: boolean;
  data: Company;
  message?: string;
}

const fetchCompanySettings = async (companyId: string): Promise<CompanyResponse> => {
  const response = await fetch(`${API_BASE_URL}/v1/companies/${companyId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch company settings');
  }

  return response.json();
};

export const useCompanySettings = () => {
  const { user } = useUser();
  const companyId = user?.company_id;

  return useQuery({
    queryKey: ['company-settings', companyId],
    queryFn: () => fetchCompanySettings(companyId!),
    enabled: !!companyId, // Only fetch if company ID exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
