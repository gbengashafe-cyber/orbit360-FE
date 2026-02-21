import { employeeService } from '@/api';
import { useDebounce } from '@/api/apiClient';
import { logger } from '@/utils';
import { CanceledError } from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useSupervisorSearch({ query }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 600);

  useEffect(() => {
    const controller = new AbortController();

    const loadEmployees = async () => {
      setLoading(true);

      try {
        const response = await employeeService.getActiveEmployeesV1(
          {
            rows: 25,
            search: debouncedQuery,
          },
          { signal: controller.signal },
        );

        setEmployees(response.data);
      } catch (error) {
        if (error instanceof CanceledError) {
          return;
        }
        logger.error({ caller: 'Use supervisor search', payload: error });
        toast.error('Error:', {
          description: error.message ?? 'Could not load employees.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
    return () => controller.abort();
  }, [debouncedQuery]);

  return { employees, loading };
}
