import { departmentService } from '@/api/department.service';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useAllDepartments = () => {
  const [allDepartments, setAllDepartments] = useState([]);

  const loadAllDepartments = async () => {
    try {
      const allDepartments = await departmentService.getDepartments({ rows: 1000 });
      setAllDepartments(allDepartments.data);
    } catch (error) {
      toast.error('Error', { description: `${error.message ? error.message : 'Error loading departments'}` });
    }
  };

  useEffect(() => {
    loadAllDepartments();

    return () => {
      // setAllDepartments([]);
    };
  }, []);

  return { allDepartments };
};
