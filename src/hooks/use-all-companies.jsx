import { companyService } from '@/api/company.service';
import { logger } from '@/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useCompanies = () => {
  const [allCompanies, setAllCompanies] = useState([]);

  const loadAllCompanies = async () => {
    try {
      const allCompanies = await companyService.getCompanies({ rows: 40 });
      setAllCompanies(allCompanies.data);
    } catch (error) {
      logger.error({ caller: 'Load all companies utils', payload: error });
      toast.error('Error', { description: error.message ?? 'Error loading companies' });
    }
  };

  useEffect(() => {
    loadAllCompanies();

    return () => {
      // setAllDepartments([]);
    };
  }, []);

  return { allCompanies };
};
