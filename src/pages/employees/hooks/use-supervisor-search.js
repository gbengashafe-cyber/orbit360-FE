import { useDebounce } from '@/api/apiClient';
import { departmentService } from '@/api/department.service';
import { CanceledError } from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useSupervisorSearch({ departmentName, departments, query }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 600);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      const department = departments.find((d) => d.name === departmentName);
      if (!department) return;

      setLoading(true);

      try {
        const res = await departmentService.getDepartmentEmployees(
          {
            id: department.id,
            rows: 25,
            options: { search: debouncedQuery },
          },
          { signal: controller.signal },
        );

        setEmployees(res.data.employees);
      } catch (error) {
        if (error instanceof CanceledError) {
          return;
        }
        toast.error('Error:', {
          description: `${error.message ? error.message : 'Could not load employees in this department.'}`,
        });
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [departmentName, debouncedQuery, departments]);

  return { employees, loading };
}
