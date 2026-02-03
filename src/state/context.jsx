import { employeeService, userService } from '@/api';
import { logger } from '@/utils';
import { localStorageKeys, LocalStorageUtil } from '@/utils/local-storage.util';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
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
    LocalStorageUtil.delete(key);
    return {};
  }

  return savedData;
};

export const GlobalContextProvider = ({ children }) => {
  const [isMD, setIsMD] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(() => {
    const cached = loadDataFromLocalStorage(localStorageKeys.CURRENT_USER);
    return !cached?.lastFetched;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return loadDataFromLocalStorage(localStorageKeys.CURRENT_USER);
  });

  const hasLoadedRef = useRef(false);
  const location = useLocation();

  useEffect(() => {
    if (currentUser?.employeeData?.jobRole) {
      setIsMD(currentUser.employeeData.jobRole === 'Managing Director');
    }
    if (currentUser?.role) {
      setIsAdmin(currentUser.role.toUpperCase() === 'ADMIN');
    }
  }, [currentUser?.employeeData?.jobRole, currentUser?.role]);

  useEffect(() => {
    if (location.pathname.startsWith('/login')) {
      return;
    }

    if (hasLoadedRef.current || currentUser?.lastFetched) {
      setIsLoadingUser(false);
      return;
    }

    let isCancelled = false;

    const loadCurrentUser = async () => {
      try {
        setIsLoadingUser(true);
        const userResponse = await userService.getCurrentUser();
        if (isCancelled) return;

        const userEmployeeData = await employeeService.getUserEmployeeData();
        if (isCancelled) return;

        if (userEmployeeData?.data) {
          const enrichedUser = { ...userResponse?.data, employeeData: userEmployeeData?.data };
          storeCurrentUser(enrichedUser);

          const isMDUser = userEmployeeData?.data?.jobRole === 'Managing Director';
          const isAdmin = userResponse?.data?.role?.toUpperCase() === 'ADMIN';

          setIsAdmin(isAdmin);
          setIsMD(isMDUser);
        } else {
          storeCurrentUser(userResponse?.data);
        }

        hasLoadedRef.current = true;
      } catch (error) {
        if (isCancelled) return;
        logger.error({ caller: 'Loading current user', payload: error });
        toast.error('Error loading current user', {
          description: error.message ?? 'Failed to load user profile.',
        });
      } finally {
        if (!isCancelled) {
          setIsLoadingUser(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isCancelled = true;
    };
  }, [location.pathname]);

  const storeCurrentUser = (user) => {
    const userWithTimestamp = {
      ...user,
      lastFetched: new Date(),
    };

    LocalStorageUtil.save(userWithTimestamp, localStorageKeys.CURRENT_USER);
    setCurrentUser(userWithTimestamp);
  };

  const value = {
    currentUser,
    isMD,
    isAdmin,
    isLoadingUser,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};
