import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { resetSocket } from "../services/socket";
import { useTranslation } from "react-i18next";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("medibridge_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem("medibridge_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/profile")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("medibridge_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("medibridge_token");
        localStorage.removeItem("medibridge_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("medibridge_token", res.data.token);
    localStorage.setItem("medibridge_user", JSON.stringify(res.data.user));
    resetSocket(); // new login => new socket identity
    setUser(res.data.user);
    if (res.data.user.preferredLanguage) {
      i18n.changeLanguage(res.data.user.preferredLanguage);
    }
    return res.data.user;
  }, [i18n]);

  const register = useCallback(async (payload) => {
    const res = await api.post("/auth/register", payload);
    localStorage.setItem("medibridge_token", res.data.token);
    localStorage.setItem("medibridge_user", JSON.stringify(res.data.user));
    resetSocket(); // new login => new socket identity
    setUser(res.data.user);
    if (res.data.user.preferredLanguage) {
      i18n.changeLanguage(res.data.user.preferredLanguage);
    }
    return res.data.user;
  }, [i18n]);

  const logout = useCallback(() => {
    resetSocket();
    localStorage.removeItem("medibridge_token");
    localStorage.removeItem("medibridge_user");
    setUser(null);
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("medibridge_user", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
