import { employeeService, payrollService } from '@/api';
import { logger } from '@/utils';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export const usePayslips = ({ isHrView, employeeId, location }) => {
  const [loading, setLoading] = useState(true);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    return () => {
      setSelectedEmployee(null);
      setPayrollRecords([]);
    };
  }, [location]);

  const fetchPayroll = useCallback(async (id) => {
    if (!id) return;

    setLoading(true);

    try {
      const res = await payrollService.getPayrollByEmployee({ id });
      setPayrollRecords(res.data);
    } catch (error) {
      toast.error('Error loading payslip data', {
        description: error.message ?? 'Kindly contact the system administrator',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      setLoadingEmployees(true);
      try {
        if (isHrView) {
          const employeesDataResponse = await employeeService.getEmployees({ rows: 1000 });
          setAllEmployees(employeesDataResponse.data);
          if (!employeesDataResponse?.data?.length) {
            return;
          }

          const emp = employeesDataResponse.data?.[0];
          setSelectedEmployee(emp);
          await fetchPayroll(emp.id);
        } else {
          if (!employeeId) {
            return;
          }
          const records = await employeeService.getEmployeePayrollRecords(employeeId);
          setPayrollRecords(records.data);
        }
      } catch (error) {
        toast.error('Error loading payslip data', {
          description: error.message ?? 'Kindly contact the system administrator',
        });
      } finally {
        setLoading(false);
        setLoadingEmployees(false);
      }
    };
    loadAllData();
  }, [isHrView, employeeId, fetchPayroll]);

  const handleEmployeeChange = async (id) => {
    try {
      setLoading(true);
      setLoadingEmployees(true);
      const emp = allEmployees.find((e) => e.id === Number(id));
      if (emp) {
        setSelectedEmployee(emp);
        await fetchPayroll(emp.id);
      }
    } catch (error) {
      logger.error({ caller: 'Change employee on Payslip page', payload: error });
      toast.error('Error', {
        description: error?.message || 'Unable to fetch payroll records. Kindly contact system administrator',
      });
    } finally {
      setLoadingEmployees(false);
      setLoading(false);
    }
  };

  return { loading, allEmployees, selectedEmployee, payrollRecords, handleEmployeeChange, loadingEmployees };
};
