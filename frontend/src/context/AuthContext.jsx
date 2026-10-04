import React, { createContext, useContext, useState } from "react";
import { clearCompareQueue } from "../utils/compareStorage";

export const Auth = createContext(null);

export const useAuth = () => useContext(Auth);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const updateUser = (changes) => {
    setUser((current) => {
      const next = {
        ...current,
        ...changes,
        profile: { ...(current?.profile || {}), ...(changes?.profile || {}) },
      };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearCompareQueue();
    window.dispatchEvent(new Event("account-logged-out"));
    setUser(null);
  };

  return (
    <Auth.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </Auth.Provider>
  );
};

export default Auth;
