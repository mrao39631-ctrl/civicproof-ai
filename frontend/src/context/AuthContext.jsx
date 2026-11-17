import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("civicproof_token"));
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState({});

  useEffect(() => {
    loadUser();
    loadDemoAccounts();
  }, []);

  const loadDemoAccounts = async () => {
    try {
      const data = await api.getDemoUsers();
      setDemoAccounts(data);
    } catch (err) {
      console.warn("Could not load demo accounts:", err);
    }
  };

  const loadUser = async () => {
    const savedToken = localStorage.getItem("civicproof_token");
    const isLoggedOut = localStorage.getItem("civicproof_logged_out") === "true";

    if (!savedToken) {
      if (isLoggedOut) {
        setLoading(false);
        return;
      }
      // Auto-login as demo citizen for zero-friction hackathon preview!
      try {
        const demos = await api.getDemoUsers();
        if (demos.citizen) {
          localStorage.setItem("civicproof_token", demos.citizen.token);
          setToken(demos.citizen.token);
          setUser(demos.citizen.user);
          setDemoAccounts(demos);
          setLoading(false);
          return;
        }
      } catch {
        // backend might not be up yet
      }
      setLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      console.error("Token verification failed:", err);
      localStorage.removeItem("civicproof_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    localStorage.removeItem("civicproof_logged_out");
    const data = await api.login(username, password);
    localStorage.setItem("civicproof_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    localStorage.removeItem("civicproof_logged_out");
    const data = await api.register(userData);
    localStorage.setItem("civicproof_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("civicproof_token");
    localStorage.setItem("civicproof_logged_out", "true");
    setToken(null);
    setUser(null);
  };

  // 1-Click Role Switcher for Hackathon Demonstrations
  const quickSwitchRole = async (targetRole) => {
    localStorage.removeItem("civicproof_logged_out");
    try {
      let accounts = demoAccounts;
      if (!accounts || !accounts[targetRole]) {
        accounts = await api.getDemoUsers();
        setDemoAccounts(accounts);
      }
      if (accounts[targetRole]) {
        const item = accounts[targetRole];
        localStorage.setItem("civicproof_token", item.token);
        setToken(item.token);
        setUser(item.user);
        return item.user;
      }
    } catch (err) {
      console.error("Failed to switch demo role:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        quickSwitchRole,
        demoAccounts,
        role: user?.role || "guest"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
