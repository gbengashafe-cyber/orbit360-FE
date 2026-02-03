import { employeeService, userService } from '@/api';
import { logger } from '@/utils';
import { localStorageKeys, LocalStorageUtil } from '@/utils/local-storage.util';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

const GlobalContext = createContext({});

export const useGlobalContext = () => useContext(GlobalContext);

const SAVED_DATA_EXPIRY_IN_SECONDS = 60 * 5;

const loadDataFromLocalStorage = (key) => {
  let savedDataStr = LocalStorageUtil.get(key);

  if (!savedDataStr) return {};

  const savedData = JSON.parse(savedDataStr);
  const lastFetched = new Date(savedData.lastFetched).getTime();
  const now = new Date().getTime();

  const isExpired = (now - lastFetched) / 1000 > SAVED_DATA_EXPIRY_IN_SECONDS;

  if (isExpired) {
    return {};
  }

  return savedData;
};

export const GlobalContextProvider = ({ children }) => {
  const [isMD, setIsMD] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(() => {
    return loadDataFromLocalStorage(localStorageKeys.CURRENT_EMPLOYEE);
  });
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    return loadDataFromLocalStorage(localStorageKeys.CURRENT_USER);
  });

  useEffect(() => {
    const location = window.location.pathname;
    if (['/login'].includes(location)) {
      return;
    }

    const loadCurrentUser = async () => {
      try {
        setIsLoadingUser(true);
        const userResponse = await userService.getCurrentUser();

        storeCurrentUser(userResponse?.data);

        const userEmployeeData = await employeeService.getUserEmployeeData();

        if (userEmployeeData?.data) {
          storeCurrentEmployee(userEmployeeData?.data);
          const isMDUser = userEmployeeData?.data?.jobRole === 'Managing Director';
          const isAdmin = userResponse?.data?.role?.toUpperCase() === 'ADMIN';

          setIsAdmin(isAdmin);
          setIsMD(isMDUser);
        }
      } catch (error) {
        logger.error({ caller: 'Loading current user', payload: error });
        toast.error('Error loading current user', {
          description: `${error.message ? error.message : 'Failed to load user profile.'}`,
        });
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadCurrentUser();

    return () => {
      setCurrentUser({});
      setIsMD(false);
      setIsAdmin(false);
    };
  }, []);

  const storeCurrentUser = (user) => {
    user.lastFetched = new Date();

    LocalStorageUtil.save(user, localStorageKeys.CURRENT_USER);
    setCurrentUser(user);
  };

  const storeCurrentEmployee = (employee) => {
    employee.lastFetched = new Date();

    LocalStorageUtil.save(employee, localStorageKeys.CURRENT_EMPLOYEE);
    setCurrentEmployee(employee);
  };

  const isLoggedIn = () => {
    return Object.keys(loadDataFromLocalStorage(localStorageKeys.ACCESS_TOKEN)).length;
  };

  const value = {
    currentUser,
    currentEmployee,
    isMD,
    isAdmin,
    isLoadingUser,
    isLoggedIn,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};
