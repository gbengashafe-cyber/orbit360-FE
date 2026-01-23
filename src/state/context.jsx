import { employeeService, userService } from '@/api';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageUtil } from '@/pages/login/local-storage.util';
import { createContext, useContext, useEffect, useState } from 'react';

const GlobalContext = createContext({});

export const useGlobalContext = () => useContext(GlobalContext);

const SAVED_USER_EXPIRY_IN_SECONDS = 5 * 60;
const LOCAL_STORAGE_CURRENT_USER_KEY = 'orbit360-current-user';

export const GlobalContextProvider = ({ children }) => {
  const { toast } = useToast();
  const [isMD, setIsMD] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    let savedUserStr = LocalStorageUtil.get(LOCAL_STORAGE_CURRENT_USER_KEY);

    if (!savedUserStr) return null;

    const savedUser = JSON.parse(savedUserStr);
    const lastUpdated = new Date(savedUser.lastUpdated).getTime();
    const now = new Date().getTime();

    const isExpired = (now - lastUpdated) / 1000 > SAVED_USER_EXPIRY_IN_SECONDS;

    if (isExpired) {
      return null;
    }

    return savedUser;
  });

  const loadCurrentUser = async () => {
    try {
      const userResponse = await userService.getCurrentUser();
      const userData = userResponse?.data || userResponse;

      storeCurrentUser(userData);

      const userEmployeeData = await employeeService.getEmployees(1, 100, { search: userData.email });

      const isMDUser = userEmployeeData?.data?.[0].jobRole === 'Managing Director';
      setIsMD(isMDUser);
    } catch (error) {
      toast({
        title: 'Error loading current user',
        description: error.message || 'Failed to load user profile.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    loadCurrentUser();

    return () => {
      // setCurrentUser({});
      setIsMD(false);
    };
  }, []);

  const storeCurrentUser = (user) => {
    user.lastUpdated = new Date();

    LocalStorageUtil.save(user, LOCAL_STORAGE_CURRENT_USER_KEY);
    setCurrentUser(user);
  };
  const value = {
    currentUser,
    isMD,
    storeCurrentUser,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};
