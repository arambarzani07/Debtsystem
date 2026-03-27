import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, Market, MarketRequest, EmployeePermission } from '@/types';
import { safeJSONParse, safeSetItem } from '@/utils/storageRecovery';

const USERS_KEY = 'users_data';
const MARKETS_KEY = 'markets_data';
const MARKET_REQUESTS_KEY = 'market_requests_data';
const CURRENT_USER_KEY = 'current_user';
const OWNER_USERNAME = 'owner';
const OWNER_PASSWORD = 'owner123';

const GRACE_PERIOD_DAYS = 7;
const EXTENDED_GRACE_PERIOD_DAYS = 30;
const EXPIRY_WARNING_DAYS = 7;

export const [AuthContext, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketRequests, setMarketRequests] = useState<MarketRequest[]>([]);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const createOwnerUser = () => ({
        id: 'owner-1',
        username: OWNER_USERNAME,
        password: OWNER_PASSWORD,
        role: 'owner' as const,
        marketId: 'owner-market',
        createdAt: new Date().toISOString(),
      });

      try {
        const stored = await AsyncStorage.getItem(USERS_KEY);
        console.log('Loading users...');
        
        const parsed = await safeJSONParse<User[]>(stored, []);
        
        if (parsed.length === 0) {
          const ownerUser = createOwnerUser();
          console.log('Creating new owner user');
          await safeSetItem(USERS_KEY, [ownerUser]);
          return [ownerUser];
        }

        if (!Array.isArray(parsed)) {
          console.warn('Users data is not array, recreating');
          await AsyncStorage.removeItem(USERS_KEY);
          const ownerUser = createOwnerUser();
          await safeSetItem(USERS_KEY, [ownerUser]);
          return [ownerUser];
        }

        const ownerExists = parsed.find((u: any) => u.username === OWNER_USERNAME);
        if (!ownerExists) {
          console.log('Owner user not found, adding');
          const ownerUser = createOwnerUser();
          const updatedUsers = [ownerUser, ...parsed];
          await safeSetItem(USERS_KEY, updatedUsers);
          return updatedUsers;
        }

        return parsed;
      } catch (error) {
        console.error('Error loading users:', error);
        try {
          await AsyncStorage.removeItem(USERS_KEY);
        } catch (removeError) {
          console.error('Error removing corrupted users data:', removeError);
        }
        const ownerUser = createOwnerUser();
        return [ownerUser];
      }
    },
    staleTime: 5000,
    gcTime: 10000,
    retry: 1,
  });

  const marketsQuery = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(MARKETS_KEY);
        const parsed = await safeJSONParse<Market[]>(stored, []);

        if (!Array.isArray(parsed)) {
          console.warn('Markets data is not array');
          try {
            await AsyncStorage.removeItem(MARKETS_KEY);
          } catch (removeError) {
            console.error('Error removing corrupted markets data:', removeError);
          }
          return [];
        }
        return parsed;
      } catch (error) {
        console.error('Error loading markets:', error);
        try {
          await AsyncStorage.removeItem(MARKETS_KEY);
        } catch (removeError) {
          console.error('Error removing corrupted markets data:', removeError);
        }
        return [];
      }
    },
    staleTime: 5000,
    gcTime: 10000,
    retry: 1,
  });

  const marketRequestsQuery = useQuery({
    queryKey: ['marketRequests'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(MARKET_REQUESTS_KEY);
        const parsed = await safeJSONParse<MarketRequest[]>(stored, []);

        if (!Array.isArray(parsed)) {
          console.warn('Market requests data is not array');
          return [];
        }
        return parsed;
      } catch (error) {
        console.error('Error loading market requests:', error);
        return [];
      }
    },
    staleTime: 5000,
    gcTime: 10000,
    retry: 1,
  });

  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(CURRENT_USER_KEY);
        const parsed = await safeJSONParse<User | null>(stored, null);

        if (!parsed || typeof parsed !== 'object') {
          return null;
        }
        return parsed as User;
      } catch (error) {
        console.error('Error loading current user:', error);
        return null;
      }
    },
    staleTime: 5000,
    gcTime: 10000,
    retry: 1,
  });

  const syncUsersMutation = useMutation({
    mutationFn: async (data: User[]) => {
      try {
        if (!Array.isArray(data)) {
          console.error('syncUsers: data is not an array');
          throw new Error('Invalid data type: expected array');
        }
        console.log('Syncing users...');
        await safeSetItem(USERS_KEY, data);
        setUsers(data);
        return data;
      } catch (error) {
        console.error('Error syncing users:', error);
        throw error;
      }
    },
  });

  const { mutateAsync: mutateUsers } = syncUsersMutation;
  const syncUsers = useCallback(async (data: User[]) => {
    await mutateUsers(data);
  }, [mutateUsers]);

  const syncMarketsMutation = useMutation({
    mutationFn: async (data: Market[]) => {
      try {
        if (!Array.isArray(data)) {
          console.error('syncMarkets: invalid data');
          throw new Error('Invalid data type: expected array');
        }
        await safeSetItem(MARKETS_KEY, data);
        setMarkets(data);
        return data;
      } catch (error) {
        console.error('Error syncing markets:', error);
        throw error;
      }
    },
  });

  const { mutateAsync: mutateMarkets } = syncMarketsMutation;
  const syncMarkets = useCallback(async (data: Market[]) => {
    await mutateMarkets(data);
  }, [mutateMarkets]);

  const syncMarketRequestsMutation = useMutation({
    mutationFn: async (data: MarketRequest[]) => {
      try {
        if (!Array.isArray(data)) {
          console.error('syncMarketRequests: invalid data');
          throw new Error('Invalid data type: expected array');
        }
        await safeSetItem(MARKET_REQUESTS_KEY, data);
        setMarketRequests(data);
        return data;
      } catch (error) {
        console.error('Error syncing market requests:', error);
        throw error;
      }
    },
  });

  const { mutateAsync: mutateMarketRequests } = syncMarketRequestsMutation;
  const syncMarketRequests = useCallback(async (data: MarketRequest[]) => {
    await mutateMarketRequests(data);
  }, [mutateMarketRequests]);

  const syncCurrentUserMutation = useMutation({
    mutationFn: async (data: User | null) => {
      try {
        if (data) {
          if (typeof data !== 'object' || Array.isArray(data)) {
            console.error('syncCurrentUser: invalid data');
            throw new Error('Invalid data type: expected object');
          }
          console.log('Syncing current user...');
          await safeSetItem(CURRENT_USER_KEY, data);
        } else {
          await AsyncStorage.removeItem(CURRENT_USER_KEY);
        }
        setCurrentUser(data);
        return data;
      } catch (error) {
        console.error('Error syncing current user:', error);
        throw error;
      }
    },
  });

  const { mutateAsync: mutateCurrentUser } = syncCurrentUserMutation;
  const syncCurrentUser = useCallback(async (data: User | null) => {
    await mutateCurrentUser(data);
  }, [mutateCurrentUser]);

  useEffect(() => {
    if (usersQuery.data) {
      setUsers(usersQuery.data);
    }
  }, [usersQuery.data]);

  useEffect(() => {
    if (marketsQuery.data) {
      setMarkets(marketsQuery.data);
    }
  }, [marketsQuery.data]);

  useEffect(() => {
    if (marketRequestsQuery.data) {
      setMarketRequests(marketRequestsQuery.data);
    }
  }, [marketRequestsQuery.data]);

  useEffect(() => {
    if (currentUserQuery.data !== undefined) {
      setCurrentUser(currentUserQuery.data);
    }
  }, [currentUserQuery.data]);

  const login = useCallback(async (identifier: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Login attempt for:', identifier);
      
      if (identifier === OWNER_USERNAME && password === OWNER_PASSWORD) {
        const ownerUser: User = {
          id: 'owner-1',
          username: OWNER_USERNAME,
          password: OWNER_PASSWORD,
          role: 'owner' as const,
          marketId: 'owner-market',
          createdAt: new Date().toISOString(),
        };
        
        console.log('Owner login successful');
        setCurrentUser(ownerUser);
        await syncCurrentUser(ownerUser);
        
        const userExists = users.find(u => u.username === OWNER_USERNAME);
        if (!userExists) {
          const updatedUsers = [...users, ownerUser];
          setUsers(updatedUsers);
          syncUsers(updatedUsers);
        }
        
        return { success: true, message: 'بەسەرکەوتوویی چوویتە ژوورەوە' };
      }
      
      const user = users.find(u => (u.phone === identifier || u.username === identifier) && u.password === password);
      
      if (!user) {
        return { success: false, message: 'ژمارە تەلەفۆن یان ووشەی نهێنی هەڵەیە' };
      }

      if (user.role === 'employee') {
        const isActive = user.isActive !== undefined ? user.isActive : true;
        if (!isActive) {
          console.log('Employee is inactive:', user.id);
          return { success: false, message: 'هەژماری کارمەندەکە ناچالاکە. تکایە پەیوەندی بە بەڕێوەبەر بکە.' };
        }
      }

      if (user.role !== 'owner') {
        const market = markets.find(m => m.id === user.marketId);
        
        if (!market) {
          return { success: false, message: 'مارکێت نەدۆزرایەوە' };
        }

        if (!market.isActive) {
          return { success: false, message: '🚫 مارکێتەکە لەلایەن خاوەندارەوە ناچالاک کراوە' };
        }

        const subscriptionEnd = new Date(market.subscriptionEndDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        subscriptionEnd.setHours(0, 0, 0, 0);
        
        const diffTime = subscriptionEnd.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysExpired = Math.abs(daysLeft);
        const isExpired = daysLeft < 0;
        
        if (isExpired) {
          if (daysExpired <= GRACE_PERIOD_DAYS) {
            console.log(`✓ چوونەژوورەوە ڕێگەپێدراوە (مۆڵەتی ڕەحمەت): ${daysExpired} ڕۆژ بەسەرچووە`);
            return { 
              success: true, 
              message: `⚠️ مۆڵەتی ڕەحمەت: مۆڵەتی مارکێت ${daysExpired} ڕۆژ لەمەوبەر بەسەرچووە. تکایە زوو پەیوەندی بە خاوەندار بکە بۆ درێژکردنەوە` 
            };
          } else if (daysExpired <= EXTENDED_GRACE_PERIOD_DAYS) {
            if (user.role === 'manager') {
              console.log(`✓ بەڕێوەبەر دەتوانێت بچێتە ژوورەوە: ${daysExpired} ڕۆژ بەسەرچووە`);
              return { 
                success: true, 
                message: `🔴 ئاگاداری گرنگ: مۆڵەت ${daysExpired} ڕۆژ بەسەرچووە! تەنها بەڕێوەبەر دەتوانێت بچێتە ژوورەوە. تکایە یەکسەر پەیوەندی بە خاوەندار بکە` 
              };
            } else {
              return { 
                success: false, 
                message: `❌ مۆڵەتی مارکێت ${daysExpired} ڕۆژ لەمەوبەر بەسەرچووە. تەنها بەڕێوەبەر دەتوانێت بچێتە ژوورەوە. تکایە پەیوەندی بە بەڕێوەبەر بکە` 
              };
            }
          } else {
            return { 
              success: false, 
              message: `⛔ مۆڵەتی مارکێت ${daysExpired} ڕۆژ لەمەوبەر تەواو بەسەرچووە. تکایە پەیوەندی بە خاوەندار بکە بۆ چالاککردنەوە` 
            };
          }
        }
        
        if (daysLeft <= EXPIRY_WARNING_DAYS && daysLeft > 0) {
          const urgencyLevel = daysLeft <= 3 ? '🔴' : '⚠️';
          console.log(`${urgencyLevel} ئاگاداری نزیکبوونەوە: ${daysLeft} ڕۆژ ماوە`);
          return { 
            success: true, 
            message: `${urgencyLevel} ئاگاداری: تەنها ${daysLeft} ڕۆژ ماوە بۆ بەسەرچوونی مۆڵەت! تکایە یەکسەر پەیوەندی بە خاوەندار بکە` 
          };
        }
      }

      console.log('Login successful for user:', user.id);
      setCurrentUser(user);
      await syncCurrentUser(user);
      return { success: true, message: 'بەسەرکەوتوویی چوویتە ژوورەوە' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [users, markets, syncCurrentUser, syncUsers]);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    syncCurrentUser(null);
  }, [syncCurrentUser]);

  const submitMarketRequest = useCallback(async (
    marketName: string,
    marketPhone: string,
    managerName: string,
    managerPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const phoneExists = users.find(u => u.phone === marketPhone || u.username === marketPhone);
      if (phoneExists) {
        return { success: false, message: 'ئەم ژمارە تەلەفۆنە پێشتر بەکارهاتووە' };
      }

      const existingRequest = marketRequests.find(
        r => r.marketPhone === marketPhone && r.status === 'pending'
      );

      if (existingRequest) {
        return { success: false, message: 'داواکارییەک بە ئەم ژمارەیە پێشتر نێردراوە' };
      }

      const newRequest: MarketRequest = {
        id: Date.now().toString(),
        marketName,
        marketPhone,
        managerName,
        managerPassword,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const updated = [...marketRequests, newRequest];
      setMarketRequests(updated);
      syncMarketRequests(updated);

      return { success: true, message: 'داواکارییەکەت بەسەرکەوتوویی نێردرا' };
    } catch (error) {
      console.error('Submit market request error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [users, marketRequests, syncMarketRequests]);

  const approveMarketRequest = useCallback(async (
    requestId: string,
    subscriptionDays: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const request = marketRequests.find(r => r.id === requestId);
      if (!request || request.status !== 'pending') {
        return { success: false, message: 'داواکارییەکە نەدۆزرایەوە' };
      }

      const phoneExists = users.find(u => u.phone === request.marketPhone || u.username === request.marketPhone);
      if (phoneExists) {
        return { success: false, message: 'ئەم ژمارە تەلەفۆنە پێشتر بەکارهاتووە' };
      }

      const marketId = Date.now().toString();
      const managerId = `manager-${marketId}`;

      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + subscriptionDays);

      const newMarket: Market = {
        id: marketId,
        name: request.marketName,
        phone: request.marketPhone,
        managerId,
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        debtorsData: [],
      };

      const newManager: User = {
        id: managerId,
        username: request.marketPhone,
        password: request.managerPassword,
        role: 'manager',
        marketId,
        fullName: request.managerName,
        phone: request.marketPhone,
        createdAt: new Date().toISOString(),
      };

      const updatedRequests = marketRequests.map(r =>
        r.id === requestId
          ? { ...r, status: 'approved' as const, processedAt: new Date().toISOString() }
          : r
      );

      const updatedMarkets = [...markets, newMarket];
      const updatedUsers = [...users, newManager];

      setMarketRequests(updatedRequests);
      setMarkets(updatedMarkets);
      setUsers(updatedUsers);

      syncMarketRequests(updatedRequests);
      syncMarkets(updatedMarkets);
      syncUsers(updatedUsers);

      return { success: true, message: 'داواکارییەکە پەسەندکرا' };
    } catch (error) {
      console.error('Approve market request error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [marketRequests, markets, users, syncMarketRequests, syncMarkets, syncUsers]);

  const rejectMarketRequest = useCallback(async (requestId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const updatedRequests = marketRequests.map(r =>
        r.id === requestId
          ? { ...r, status: 'rejected' as const, processedAt: new Date().toISOString() }
          : r
      );

      setMarketRequests(updatedRequests);
      syncMarketRequests(updatedRequests);

      return { success: true, message: 'داواکارییەکە ڕەتکرایەوە' };
    } catch (error) {
      console.error('Reject market request error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [marketRequests, syncMarketRequests]);

  const addEmployee = useCallback(async (
    fullName: string,
    phone: string,
    password: string,
    permissions: EmployeePermission[]
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || currentUser.role !== 'manager') {
        return { success: false, message: 'تەنها بەڕێوەبەر دەتوانێت کارمەند زیاد بکات' };
      }

      const existingUser = users.find(u => u.phone === phone || u.username === phone);
      if (existingUser) {
        return { success: false, message: 'ئەم ژمارە تەلەفۆنە پێشتر بەکارهاتووە' };
      }

      const newEmployee: User = {
        id: `employee-${Date.now()}`,
        username: phone,
        password,
        role: 'employee',
        marketId: currentUser.marketId || '',
        permissions,
        fullName,
        phone,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...users, newEmployee];
      setUsers(updatedUsers);
      syncUsers(updatedUsers);

      return { success: true, message: 'کارمەند بەسەرکەوتوویی زیادکرا' };
    } catch (error) {
      console.error('Add employee error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [currentUser, users, syncUsers]);

  const updateEmployeePermissions = useCallback(async (
    employeeId: string,
    permissions: EmployeePermission[]
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || currentUser.role !== 'manager') {
        return { success: false, message: 'تەنها بەڕێوەبەر دەتوانێت مۆڵەتەکان دەستکاری بکات' };
      }

      const updatedUsers = users.map(u =>
        u.id === employeeId && u.marketId === currentUser.marketId
          ? { ...u, permissions }
          : u
      );

      setUsers(updatedUsers);
      syncUsers(updatedUsers);

      return { success: true, message: 'مۆڵەتەکان نوێکرانەوە' };
    } catch (error) {
      console.error('Update employee permissions error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [currentUser, users, syncUsers]);

  const deleteEmployee = useCallback(async (employeeId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || currentUser.role !== 'manager') {
        return { success: false, message: 'تەنها بەڕێوەبەر دەتوانێت کارمەند بسڕێتەوە' };
      }

      const employee = users.find(u => u.id === employeeId);
      if (!employee || employee.marketId !== currentUser.marketId) {
        return { success: false, message: 'کارمەندەکە نەدۆزرایەوە' };
      }

      const updatedUsers = users.filter(u => u.id !== employeeId);
      setUsers(updatedUsers);
      syncUsers(updatedUsers);

      return { success: true, message: 'کارمەند سڕایەوە' };
    } catch (error) {
      console.error('Delete employee error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [currentUser, users, syncUsers]);

  const toggleEmployeeStatus = useCallback(async (employeeId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || currentUser.role !== 'manager') {
        return { success: false, message: 'تەنها بەڕێوەبەر دەتوانێت دۆخی کارمەند بگۆڕێت' };
      }

      const employee = users.find(u => u.id === employeeId);
      if (!employee || employee.marketId !== currentUser.marketId) {
        return { success: false, message: 'کارمەندەکە نەدۆزرایەوە' };
      }

      const currentStatus = employee.isActive !== undefined ? employee.isActive : true;
      const newStatus = !currentStatus;
      
      const updatedUsers = users.map(u =>
        u.id === employeeId
          ? { ...u, isActive: newStatus }
          : u
      );

      setUsers(updatedUsers);
      syncUsers(updatedUsers);

      return { 
        success: true, 
        message: newStatus ? 'کارمەند چالاککرایەوە' : 'کارمەند ناچالاککرا'
      };
    } catch (error) {
      console.error('Toggle employee status error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [currentUser, users, syncUsers]);

  const addCustomer = useCallback(async (
    debtorId: string,
    phone: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('addCustomer called with:', { debtorId, phone, currentUser });
      
      if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'employee')) {
        console.log('Permission denied - currentUser:', currentUser);
        return { success: false, message: 'مۆڵەتت نییە' };
      }

      console.log('Checking for existing user...');
      const existingUser = users.find(u => u.phone === phone || u.username === phone);
      if (existingUser) {
        console.log('User already exists:', existingUser);
        return { success: false, message: 'ئەم ژمارە تەلەفۆنە پێشتر بەکارهاتووە' };
      }

      console.log('Creating new customer...');
      const newCustomer: User = {
        id: `customer-${Date.now()}`,
        username: phone,
        password,
        role: 'customer',
        marketId: currentUser.marketId || '',
        phone,
        debtorId,
        createdAt: new Date().toISOString(),
      };

      console.log('New customer object:', newCustomer);
      const updatedUsers = [...users, newCustomer];
      console.log('Updated users array length:', updatedUsers.length);
      
      console.log('Syncing users...');
      await syncUsers(updatedUsers);
      console.log('Users synced successfully');

      return { success: true, message: 'هەژماری کڕیار دروستکرا' };
    } catch (error) {
      console.error('Add customer error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [currentUser, users, syncUsers]);

  const hasPermission = useCallback((permission: EmployeePermission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner' || currentUser.role === 'manager') return true;
    if (currentUser.role === 'employee') {
      return currentUser.permissions?.includes(permission) || false;
    }
    return false;
  }, [currentUser]);

  const getCurrentMarket = useCallback((): Market | null => {
    if (!currentUser) return null;
    return markets.find(m => m.id === currentUser.marketId) || null;
  }, [currentUser, markets]);

  const getMarketEmployees = useCallback((): User[] => {
    if (!currentUser || currentUser.role !== 'manager') return [];
    return users.filter(u => u.marketId === currentUser.marketId && u.role === 'employee');
  }, [currentUser, users]);

  const getPendingRequests = useCallback((): MarketRequest[] => {
    if (!currentUser || currentUser.role !== 'owner') return [];
    return marketRequests.filter(r => r.status === 'pending');
  }, [currentUser, marketRequests]);

  const extendMarketSubscription = useCallback(async (
    marketId: string,
    additionalDays: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || currentUser.role !== 'owner') {
        return { success: false, message: 'تەنها خاوەندار دەتوانێت مۆڵەت درێژ بکاتەوە' };
      }

      const market = markets.find(m => m.id === marketId);
      if (!market) {
        return { success: false, message: 'مارکێتەکە نەدۆزرایەوە' };
      }

      const currentEnd = new Date(market.subscriptionEndDate);
      const now = new Date();
      const baseDate = currentEnd > now ? currentEnd : now;
      
      baseDate.setDate(baseDate.getDate() + additionalDays);

      const updatedMarkets = markets.map(m =>
        m.id === marketId
          ? { ...m, subscriptionEndDate: baseDate.toISOString(), isActive: true }
          : m
      );

      setMarkets(updatedMarkets);
      syncMarkets(updatedMarkets);

      return { success: true, message: 'مۆڵەت درێژکرایەوە' };
    } catch (error) {
      console.error('Extend subscription error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [currentUser, markets, syncMarkets]);

  const toggleMarketStatus = useCallback(async (marketId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || currentUser.role !== 'owner') {
        return { success: false, message: 'تەنها خاوەندار دەتوانێت دۆخی مارکێت بگۆڕێت' };
      }

      const market = markets.find(m => m.id === marketId);
      if (!market) {
        return { success: false, message: 'مارکێتەکە نەدۆزرایەوە' };
      }

      const currentStatus = market.isActive !== undefined ? market.isActive : true;
      const newStatus = !currentStatus;
      
      const updatedMarkets = markets.map(m =>
        m.id === marketId
          ? { ...m, isActive: newStatus }
          : m
      );

      setMarkets(updatedMarkets);
      syncMarkets(updatedMarkets);

      return { 
        success: true, 
        message: newStatus ? 'مارکێت چالاککرایەوە' : 'مارکێت ناچالاککرا'
      };
    } catch (error) {
      console.error('Toggle market status error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [currentUser, markets, syncMarkets]);

  const reduceMarketSubscription = useCallback(async (
    marketId: string,
    daysToReduce: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || currentUser.role !== 'owner') {
        return { success: false, message: 'تەنها خاوەندار دەتوانێت مۆڵەت کەم بکاتەوە' };
      }

      const market = markets.find(m => m.id === marketId);
      if (!market) {
        return { success: false, message: 'مارکێتەکە نەدۆزرایەوە' };
      }

      const currentEnd = new Date(market.subscriptionEndDate);
      currentEnd.setDate(currentEnd.getDate() - daysToReduce);

      const now = new Date();
      if (currentEnd < now) {
        return { success: false, message: 'ناتوانیت زیاتر لە ڕۆژەکانی ماوە کەم بکەیتەوە' };
      }

      const updatedMarkets = markets.map(m =>
        m.id === marketId
          ? { ...m, subscriptionEndDate: currentEnd.toISOString() }
          : m
      );

      setMarkets(updatedMarkets);
      syncMarkets(updatedMarkets);

      return { success: true, message: 'مۆڵەت کەمکرایەوە' };
    } catch (error) {
      console.error('Reduce subscription error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [currentUser, markets, syncMarkets]);

  const deleteMarket = useCallback(async (
    marketId: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentUser || currentUser.role !== 'owner') {
        return { success: false, message: 'تەنها خاوەندار دەتوانێت مۆڵەت بسڕێتەوە' };
      }

      if (password !== OWNER_PASSWORD) {
        return { success: false, message: 'ووشەی نهێنی هەڵەیە' };
      }

      const market = markets.find(m => m.id === marketId);
      if (!market) {
        return { success: false, message: 'مارکێتەکە نەدۆزرایەوە' };
      }

      const updatedMarkets = markets.filter(m => m.id !== marketId);
      const updatedUsers = users.filter(u => u.marketId !== marketId);

      setMarkets(updatedMarkets);
      setUsers(updatedUsers);
      syncMarkets(updatedMarkets);
      syncUsers(updatedUsers);

      try {
        await AsyncStorage.removeItem(`market_${marketId}_debtors`);
      } catch (error) {
        console.warn('Failed to remove market debtors data:', error);
      }

      return { success: true, message: 'مۆڵەتی مارکێت بە تەواوی سڕایەوە' };
    } catch (error) {
      console.error('Delete market error:', error);
      return { success: false, message: 'هەڵەیەک ڕوویدا' };
    }
  }, [currentUser, markets, users, syncMarkets, syncUsers]);

  return useMemo(
    () => ({
      currentUser,
      isAuthenticated: !!currentUser,
      login,
      logout,
      submitMarketRequest,
      approveMarketRequest,
      rejectMarketRequest,
      addEmployee,
      updateEmployeePermissions,
      deleteEmployee,
      toggleEmployeeStatus,
      addCustomer,
      hasPermission,
      getCurrentMarket,
      getMarketEmployees,
      getPendingRequests,
      extendMarketSubscription,
      reduceMarketSubscription,
      toggleMarketStatus,
      deleteMarket,
      markets,
      users,
      marketRequests,
      syncUsers,
      syncMarkets,
      isLoading: usersQuery.isLoading || marketsQuery.isLoading || marketRequestsQuery.isLoading || currentUserQuery.isLoading,
    }),
    [
      currentUser,
      login,
      logout,
      submitMarketRequest,
      approveMarketRequest,
      rejectMarketRequest,
      addEmployee,
      updateEmployeePermissions,
      deleteEmployee,
      toggleEmployeeStatus,
      addCustomer,
      hasPermission,
      getCurrentMarket,
      getMarketEmployees,
      getPendingRequests,
      extendMarketSubscription,
      reduceMarketSubscription,
      toggleMarketStatus,
      deleteMarket,
      markets,
      users,
      marketRequests,
      syncUsers,
      syncMarkets,
      usersQuery.isLoading,
      marketsQuery.isLoading,
      marketRequestsQuery.isLoading,
      currentUserQuery.isLoading,
    ]
  );
});
