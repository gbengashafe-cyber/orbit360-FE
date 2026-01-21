import { departmentService } from '@/api/department.service';
import { useEffect, useState } from 'react';

export const useAllDepartments = () => {
  const [allDepartments, setAllDepartments] = useState([]);

  const loadAllDepartments = async () => {
    try {
      const allDepartments = await departmentService.getDepartments({ rows: 1000 });
      setAllDepartments(allDepartments.data);
    } catch (error) {
      console.error('Error loading departments:', error);
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
