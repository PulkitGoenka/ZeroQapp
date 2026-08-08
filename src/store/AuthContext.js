import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearTokens, saveTokens } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session,   setSession]   = useState(null);
  const [cart,      setCart]      = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token       = await AsyncStorage.getItem('accessToken');
        const savedUser   = await AsyncStorage.getItem('userInfo');
        const savedSession = await AsyncStorage.getItem('activeSession');
        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          // Only restore session if it's a real object, not "null" string
          if (savedSession && savedSession !== 'null') {
            setSession(JSON.parse(savedSession));
          }
        }
      } catch {}
      finally { setIsLoading(false); }
    })();
  }, []);

  const login = async (tokens, userInfo) => {
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logoutUser = async () => {
    await clearTokens();
    await AsyncStorage.multiRemove(['userInfo', 'activeSession']);
    setUser(null);
    setSession(null);
    setCart(null);
  };

  const saveSession = async (data) => {
    setSession(data);
    if (data) {
      await AsyncStorage.setItem('activeSession', JSON.stringify(data));
    } else {
      await AsyncStorage.removeItem('activeSession');
    }
  };

  const clearSession = async () => {
    setSession(null);
    setCart(null);
    await AsyncStorage.removeItem('activeSession');
  };

  return (
      <AuthContext.Provider value={{
        user, isLoading, session, cart,
        login, logoutUser, saveSession, clearSession, setCart,
      }}>
        {children}
      </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);