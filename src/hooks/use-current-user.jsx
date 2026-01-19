import { employeeService, userService } from '@/api';
import { useEffect, useState } from 'react';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState({});
  const [isMD, setIsMD] = useState(false);

  const loadCurrentUser = async () => {
    try {
      const user = await userService.getCurrentUser();
      setCurrentUser(user?.data || user);

      const userEmployeeData = await employeeService.getEmployees(1, 100, { search: user.email });

      const isMDUser = userEmployeeData.data[0].jobRole === 'Managing Director';
      setIsMD(isMDUser);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  useEffect(() => {
    loadCurrentUser();

    return () => {
      setCurrentUser({});
      setIsMD({});
    };
  }, []);

  return { currentUser, isMD };
};
