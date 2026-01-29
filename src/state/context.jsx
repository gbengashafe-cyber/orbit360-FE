import { employeeService, userService } from '@/api';
import { LocalStorageUtil } from '@/pages/login/local-storage.util';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

const GlobalContext = createContext({});

export const useGlobalContext = () => useContext(GlobalContext);

const SAVED_USER_EXPIRY_IN_SECONDS = 60 * 5;
const LOCAL_STORAGE_CURRENT_USER_KEY = 'orbit360-current-user';

export const GlobalContextProvider = ({ children }) => {
  const [isMD, setIsMD] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    let savedUserStr = LocalStorageUtil.get(LOCAL_STORAGE_CURRENT_USER_KEY);

    if (!savedUserStr) return {};

    const savedUser = JSON.parse(savedUserStr);
    const lastUpdated = new Date(savedUser.lastUpdated).getTime();
    const now = new Date().getTime();

    const isExpired = (now - lastUpdated) / 1000 > SAVED_USER_EXPIRY_IN_SECONDS;

    if (isExpired) {
      return {};
    }

    return savedUser;
  });
  const location = window.location.pathname;

  const loadCurrentUser = async () => {
    try {
      setIsLoadingUser(true);
      const userResponse = await userService.getCurrentUser();

      storeCurrentUser(userResponse?.data);

      const userEmployeeData = await employeeService.getEmployees(1, 100, { search: userResponse.data?.email });

      const isMDUser = userEmployeeData?.data?.[0].jobRole === 'Managing Director';
      const isAdmin = userResponse?.data?.role?.toUpperCase() === 'ADMIN';

      setIsAdmin(isAdmin);
      setIsMD(isMDUser);
    } catch (error) {
      toast.error('Error loading current user', {
        description: `${error.message ? error.message : 'Failed to load user profile.'}`,
      });
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    if (['/login'].includes(location)) {
      return;
    }

    loadCurrentUser();

    return () => {
      setCurrentUser({});
      setIsMD(false);
      setIsAdmin(false);
    };
  }, []);

  useEffect(() => {
    if (['/login'].includes(location)) {
      return;
    }

    loadCurrentEmployee();

    return () => {
      setCurrentEmployee({});
    };
  }, []);

  const loadCurrentEmployee = async () => {
    try {
      const userResponse = await userService.getCurrentUser();

      storeCurrentUser(userResponse?.data);

      const userEmployeeData = await employeeService.getEmployees(1, 100, { search: userResponse.data?.email });

      const isMDUser = userEmployeeData?.data?.[0].jobRole === 'Managing Director';
      const isAdmin = userResponse?.data?.role?.toUpperCase() === 'ADMIN';

      setIsAdmin(isAdmin);
      setIsMD(isMDUser);
    } catch (error) {
      toast.error('Error loading current user', {
        description: `${error.message ? error.message : 'Failed to load user profile.'}`,
      });
    } finally {
      setIsLoadingUser(false);
    }
  };

  const storeCurrentUser = (user) => {
    user.lastUpdated = new Date();

    LocalStorageUtil.save(user, LOCAL_STORAGE_CURRENT_USER_KEY);
    setCurrentUser(user);
  };

  const value = {
    currentUser,
    isMD,
    isAdmin,
    isLoadingUser,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};
