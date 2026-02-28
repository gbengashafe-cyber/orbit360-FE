import { departmentService } from '@/api';
import { logger } from '@/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useDepartments = () => {
  const [departments, setDepartments] = useState([]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getDepartments({ rows: 100 });
      setDepartments(response.data);
    } catch (error) {
      logger.error({ caller: 'Load all departments utils', payload: error });
      toast.error('Error', { description: error.message ?? 'Error loading departments' });
    }
  };

  useEffect(() => {
    loadDepartments();

    return () => {
      // setAllDepartments([]);
    };
  }, []);

  return { departments };
};
