import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/api';
import { useUser } from '../contexts/UserContext';

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  description?: string;
  timezone?: string;
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
  const response = await apiClient.get(`/v1/companies/${companyId}`);
  return response.data;
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
