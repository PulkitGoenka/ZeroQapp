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
        console.log("AuthContext: Starting initialization...");
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Timeout')), 3000);
        });
        timeoutPromise.catch(() => {}); // Prevent unhandled rejection
        
        const loadDataPromise = async () => {
            const token       = await AsyncStorage.getItem('accessToken');
            const savedUser   = await AsyncStorage.getItem('userInfo');
            const savedSession = await AsyncStorage.getItem('activeSession');
            return { token, savedUser, savedSession };
        };

        const { token, savedUser, savedSession } = await Promise.race([loadDataPromise(), timeoutPromise]);
        clearTimeout(timeoutId);

        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          if (savedSession && savedSession !== 'null') {
            setSession(JSON.parse(savedSession));
          }
        }
        console.log("AuthContext: Initialization complete.");
      } catch (e) {
        console.warn("AuthContext Init Error:", e);
      }
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